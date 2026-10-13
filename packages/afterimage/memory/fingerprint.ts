// GPU fingerprinting. Each capture is copied into one of two ping-pong textures and a single
// compute dispatch compares it with the previous capture, writing for every 64×64 tile a changed
// flag and a 64-bit content hash. The CPU reads back 16 bytes per tile — never the screen — and
// pulls pixels only for tiles whose hash it has never seen, through a small staging strip.
// Maps are polled with DO_NOT_WAIT: a blocking Map spun a core at ~4× the cost of the real work.

import { FFIType, ptr } from 'bun:ffi';

import {
  CTX_COPY_RESOURCE,
  CTX_COPY_SUBRESOURCE_REGION,
  CTX_FLUSH,
  CTX_MAP,
  CTX_UNMAP,
  D3D11_CPU_ACCESS_READ,
  D3D11_MAP_FLAG_DO_NOT_WAIT,
  D3D11_MAP_READ,
  D3D11_USAGE_STAGING,
  DEV_CREATE_BUFFER,
  DXGI_ERROR_WAS_STILL_DRAWING,
  DXGI_FORMAT_B8G8R8A8_UNORM,
  type TextureResult,
  comRelease,
  compile,
  csSet,
  dispatch,
  makeComputeShader,
  makeConstantBuffer,
  makeStructuredBuffer,
  makeTexture,
  requireGpu,
  updateConstantBuffer,
  vcall,
} from '@bun-win32/gpu';
import Kernel32 from '@bun-win32/kernel32';

import { callOut, check } from '../shared/com';
import { GpuFence } from './fence';

export const tileSize = 64;
const stripAcross = 32;
const stripDown = 4;
const stripTiles = stripAcross * stripDown;

const fingerprintShader = `Texture2D<float4> current : register(t0);
Texture2D<float4> previous : register(t1);
RWStructuredBuffer<uint4> tiles : register(u0);
cbuffer Parameters : register(b0) { uint width; uint height; uint tilesAcross; uint padding; };
groupshared uint sharedChanged;
groupshared uint sharedHashHigh;
groupshared uint sharedHashLow;
groupshared uint sharedRuns;

uint mixBits(uint value) {
  value ^= value >> 16; value *= 0x85ebca6bu; value ^= value >> 13; value *= 0xc2b2ae35u; value ^= value >> 16;
  return value;
}

uint packColor(float4 color) {
  uint4 bytes = (uint4)round(saturate(color) * 255.0);
  return bytes.b | (bytes.g << 8) | (bytes.r << 16) | (bytes.a << 24);
}

// One group per 64x64 tile; each thread covers a 4x4 block. Two independent position-keyed lanes
// summed across the tile give an order-sensitive 64-bit fingerprint. "Runs" counts pixels equal to
// their left neighbour: text and UI are full of them, video and photographs almost never are.
[numthreads(16, 16, 1)]
void main(uint3 group : SV_GroupID, uint3 local : SV_GroupThreadID, uint flat : SV_GroupIndex) {
  if (flat == 0) { sharedChanged = 0; sharedHashHigh = 0; sharedHashLow = 0; sharedRuns = 0; }
  GroupMemoryBarrierWithGroupSync();
  uint changed = 0;
  uint runs = 0;
  uint hashHigh = 0;
  uint hashLow = 0;
  [unroll] for (uint row = 0; row < 4; row++) {
    [unroll] for (uint column = 0; column < 4; column++) {
      uint2 inTile = local.xy * 4 + uint2(column, row);
      uint2 pixel = group.xy * 64 + inTile;
      if (pixel.x < width && pixel.y < height) {
        uint now = packColor(current.Load(int3(pixel, 0)));
        if (pixel.x > 0 && packColor(current.Load(int3(pixel - uint2(1, 0), 0))) == now) runs++;
        uint before = packColor(previous.Load(int3(pixel, 0)));
        changed |= (now != before) ? 1u : 0u;
        uint position = inTile.y * 64 + inTile.x;
        hashHigh += mixBits(now ^ (position * 0x9e3779b9u));
        hashLow += mixBits((now + 0x7f4a7c15u) * (position * 2u + 1u) ^ 0x632be5abu);
      }
    }
  }
  InterlockedOr(sharedChanged, changed);
  InterlockedAdd(sharedHashHigh, hashHigh);
  InterlockedAdd(sharedHashLow, hashLow);
  InterlockedAdd(sharedRuns, runs);
  GroupMemoryBarrierWithGroupSync();
  if (flat == 0) tiles[group.y * tilesAcross + group.x] = uint4(sharedChanged, sharedHashHigh, sharedHashLow, sharedRuns);
}`;

/**
 * Map a staging resource once the GPU is done with it; returns (address, rowPitch). With a fence the
 * worker sleeps exactly until completion; without one it polls, keeping the event loop live.
 */
export async function mapWhenReady(resource: bigint, fence: GpuFence | null): Promise<[bigint, number]> {
  const { context } = requireGpu();
  const mapped = new DataView(new ArrayBuffer(16));
  fence?.wait();
  for (;;) {
    const result = vcall(context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [resource, 0, D3D11_MAP_READ, D3D11_MAP_FLAG_DO_NOT_WAIT, ptr(mapped)]);
    if (result >>> 0 === DXGI_ERROR_WAS_STILL_DRAWING) {
      await Bun.sleep(1);
      continue;
    }
    check(result, 'Map');
    return [mapped.getBigUint64(0, true), mapped.getUint32(8, true)];
  }
}

export function unmap(resource: bigint): void {
  vcall(requireGpu().context, CTX_UNMAP, [FFIType.u64, FFIType.u32], [resource, 0], FFIType.void);
}

/**
 * Copy `length` bytes of this process's memory at a raw address (a mapped GPU resource) into
 * `target`. Bun's Pointer type is branded and raw addresses are bigints here, so the typed route
 * is ReadProcessMemory on ourselves — one syscall per batch, never per row.
 */
export function copyFromAddress(address: bigint, target: Uint8Array, length: number): void {
  if (!Kernel32.ReadProcessMemory(Kernel32.GetCurrentProcess(), address, ptr(target), BigInt(length), null)) throw new Error('ReadProcessMemory failed on a mapped GPU resource');
}

export class Fingerprinter {
  readonly height: number;
  readonly tileCount: number;
  readonly tilesAcross: number;
  readonly tilesDown: number;
  readonly width: number;
  #currentIndex = 1;
  readonly #fence = GpuFence.create();
  readonly #frames: [TextureResult, TextureResult];
  #fresh = true;
  readonly #parameters: bigint;
  readonly #shader: bigint;
  readonly #strip: TextureResult;
  #stripBytes: Uint8Array;
  readonly #tileBytes = new Uint8Array(new ArrayBuffer(tileSize * tileSize * 4));
  readonly #tileInfo: { buffer: bigint; uav?: bigint };
  readonly #tileStaging: bigint;
  readonly #tileWords: Uint32Array;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.tilesAcross = Math.ceil(width / tileSize);
    this.tilesDown = Math.ceil(height / tileSize);
    this.tileCount = this.tilesAcross * this.tilesDown;
    this.#frames = [makeTexture({ format: DXGI_FORMAT_B8G8R8A8_UNORM, h: height, srv: true, w: width }), makeTexture({ format: DXGI_FORMAT_B8G8R8A8_UNORM, h: height, srv: true, w: width })];
    this.#tileInfo = makeStructuredBuffer({ count: this.tileCount, stride: 16, uav: true });
    const description = new Uint32Array(new ArrayBuffer(24));
    description.set([this.tileCount * 16, D3D11_USAGE_STAGING, 0, D3D11_CPU_ACCESS_READ, 0, 0]);
    this.#tileStaging = callOut(requireGpu().device, DEV_CREATE_BUFFER, [FFIType.ptr, FFIType.ptr], [ptr(description), null], 'CreateBuffer(tile staging)');
    this.#tileWords = new Uint32Array(new ArrayBuffer(this.tileCount * 16));
    this.#strip = makeTexture({ format: DXGI_FORMAT_B8G8R8A8_UNORM, h: stripDown * tileSize, staging: true, w: stripAcross * tileSize });
    this.#stripBytes = new Uint8Array(new ArrayBuffer(stripAcross * tileSize * 4 * stripDown * tileSize));
    this.#parameters = makeConstantBuffer(16);
    const parameters = Buffer.alloc(16);
    parameters.writeUInt32LE(width, 0);
    parameters.writeUInt32LE(height, 4);
    parameters.writeUInt32LE(this.tilesAcross, 8);
    updateConstantBuffer(this.#parameters, parameters);
    this.#shader = makeComputeShader(compile(fingerprintShader, 'main', 'cs_5_0'));
  }

  /** The texture holding the most recently ingested frame. */
  get current(): bigint {
    return this.#frames[this.#currentIndex]!.tex;
  }

  /** Copy `source` (a desktop or stage texture) in and fingerprint it against the previous frame. */
  ingest(source: bigint): void {
    const { context } = requireGpu();
    this.#currentIndex = 1 - this.#currentIndex;
    const current = this.#frames[this.#currentIndex]!;
    const previous = this.#frames[1 - this.#currentIndex]!;
    vcall(context, CTX_COPY_RESOURCE, [FFIType.u64, FFIType.u64], [current.tex, source], FFIType.void);
    csSet(this.#shader, { cb: [this.#parameters], srv: [current.srv!, previous.srv!], uav: [this.#tileInfo.uav!] });
    dispatch(this.tilesAcross, this.tilesDown, 1);
    csSet(this.#shader, { cb: [this.#parameters], srv: [0n, 0n], uav: [this.#tileInfo.uav!] });
    vcall(context, CTX_COPY_RESOURCE, [FFIType.u64, FFIType.u64], [this.#tileStaging, this.#tileInfo.buffer], FFIType.void);
    vcall(context, CTX_FLUSH, [], [], FFIType.void);
  }

  /** Next ingest reports every tile as changed (first frame, or after a gap). */
  invalidate(): void {
    this.#fresh = true;
  }

  /**
   * Pixels of `tiles` from the latest frame, tightly packed BGRA, delivered one tile at a time to
   * `receive` (the view is only valid during the call).
   */
  async readTiles(tiles: readonly number[], receive: (tile: number, pixels: Uint8Array) => void): Promise<void> {
    const { context } = requireGpu();
    const box = new Uint32Array(new ArrayBuffer(24));
    for (let batch = 0; batch < tiles.length; batch += stripTiles) {
      const count = Math.min(stripTiles, tiles.length - batch);
      for (let slot = 0; slot < count; slot += 1) {
        const tile = tiles[batch + slot]!;
        const left = (tile % this.tilesAcross) * tileSize;
        const top = Math.floor(tile / this.tilesAcross) * tileSize;
        box.set([left, top, 0, Math.min(this.width, left + tileSize), Math.min(this.height, top + tileSize), 1]);
        vcall(
          context,
          CTX_COPY_SUBRESOURCE_REGION,
          [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.ptr],
          [this.#strip.tex, 0, (slot % stripAcross) * tileSize, Math.floor(slot / stripAcross) * tileSize, 0, this.current, 0, ptr(box)],
          FFIType.void,
        );
      }
      vcall(context, CTX_FLUSH, [], [], FFIType.void);
      const [address, rowPitch] = await mapWhenReady(this.#strip.tex, this.#fence);
      const rowsUsed = Math.ceil(count / stripAcross) * tileSize;
      if (rowPitch * rowsUsed > this.#stripBytes.length) this.#stripBytes = new Uint8Array(new ArrayBuffer(rowPitch * stripDown * tileSize));
      copyFromAddress(address, this.#stripBytes, rowPitch * rowsUsed);
      unmap(this.#strip.tex);
      for (let slot = 0; slot < count; slot += 1) {
        const tile = tiles[batch + slot]!;
        const columns = Math.min(tileSize, this.width - (tile % this.tilesAcross) * tileSize);
        const rows = Math.min(tileSize, this.height - Math.floor(tile / this.tilesAcross) * tileSize);
        const rowBytes = columns * 4;
        const originX = (slot % stripAcross) * tileSize * 4;
        const originY = Math.floor(slot / stripAcross) * tileSize;
        for (let row = 0; row < rows; row += 1) {
          const offset = (originY + row) * rowPitch + originX;
          this.#tileBytes.set(this.#stripBytes.subarray(offset, offset + rowBytes), row * rowBytes);
        }
        receive(tile, this.#tileBytes.subarray(0, rowBytes * rows));
      }
    }
  }

  release(): void {
    this.#fence?.dispose();
    for (const frame of this.#frames) comRelease(frame.tex);
    comRelease(this.#strip.tex);
    comRelease(this.#tileInfo.buffer);
    comRelease(this.#tileStaging);
    comRelease(this.#parameters);
    comRelease(this.#shader);
  }

  /** Per tile: [changed, hashHigh, hashLow, runs]. Valid until the next call. */
  async tiles(): Promise<Uint32Array> {
    const [address] = await mapWhenReady(this.#tileStaging, this.#fence);
    copyFromAddress(address, new Uint8Array(this.#tileWords.buffer), this.tileCount * 16);
    unmap(this.#tileStaging);
    if (this.#fresh) {
      for (let tile = 0; tile < this.tileCount; tile += 1) this.#tileWords[tile * 4] = 1;
      this.#fresh = false;
    }
    return this.#tileWords;
  }
}
