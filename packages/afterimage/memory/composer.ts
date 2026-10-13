// The composer turns a frame index back into pixels — on the GPU, into one of two shared view
// textures the eye samples from its own device. It writes only tiles whose blob differs from what
// that view already holds, and only into a view the eye has released (the eye fences its last use
// with an event query), so a moment never tears. Reduced (hot) tiles are uploaded as 16×16
// snapshots into an atlas and drawn back up to 64×64 with hardware bilinear filtering in one
// instanced draw. Exports decode the same tiles on the CPU.

import { FFIType, ptr } from 'bun:ffi';

import {
  CTX_COPY_RESOURCE,
  CTX_END,
  CTX_FLUSH,
  CTX_GET_DATA,
  CTX_UPDATE_SUBRESOURCE,
  D3D11_BIND_RENDER_TARGET,
  D3D11_BIND_SHADER_RESOURCE,
  DEV_CREATE_QUERY,
  DEV_CREATE_RENDER_TARGET_VIEW,
  DEV_CREATE_TEXTURE_2D,
  DXGI_FORMAT_B8G8R8A8_UNORM,
  type StructuredBuffer,
  type TextureResult,
  comRelease,
  compile,
  drawTriangles,
  makeConstantBuffer,
  makePixelShader,
  makeSampler,
  makeStructuredBuffer,
  makeTexture,
  makeVertexShader,
  psSet,
  requireGpu,
  setCull,
  setRenderTargets,
  setViewport,
  updateConstantBuffer,
  updateDynamicBuffer,
  vcall,
  vsSet,
  vsSetShaderResources,
} from '@bun-win32/gpu';

import { callOut, queryInterface } from '../shared/com';
import type { TileRegion } from '../shared/protocol';
import { DXGIResource, IID } from '../shared/slots';
import { tileSize } from './fingerprint';
import type { Journal } from './journal';
import { isReduced, restore } from './resample';
import type { TileStore } from './store';

const atlasCellsAcross = 0x80;
const atlasCellsDown = 0x40;
const cellSize = 16;
const quadStride = 32;
const resourceMiscShared = 0x2;
const unknownBlob = -2;

const restoreVertexShader = `struct Quad { float4 destination; float4 source; };
StructuredBuffer<Quad> quads : register(t0);
cbuffer Sizes : register(b0) { float2 viewSize; float2 atlasSize; };
struct Varyings { float4 position : SV_Position; nointerpolation float4 destination : TEXCOORD0; nointerpolation float4 source : TEXCOORD1; };
// Two clockwise triangles per quad, addressed by SV_VertexID (draw start offset is always 0).
Varyings main(uint vertex : SV_VertexID) {
  Quad quad = quads[vertex / 6];
  uint corner = vertex % 6;
  float2 unit = float2((corner == 1 || corner == 4 || corner == 5) ? 1.0 : 0.0, (corner == 2 || corner == 3 || corner == 5) ? 1.0 : 0.0);
  float2 pixel = lerp(quad.destination.xy, quad.destination.zw, unit);
  Varyings output;
  output.position = float4(pixel / viewSize * float2(2.0, -2.0) + float2(-1.0, 1.0), 0.0, 1.0);
  output.destination = quad.destination;
  output.source = quad.source;
  return output;
}`;

const restorePixelShader = `Texture2D<float4> atlas : register(t0);
SamplerState bilinear : register(s0);
cbuffer Sizes : register(b0) { float2 viewSize; float2 atlasSize; };
struct Varyings { float4 position : SV_Position; nointerpolation float4 destination : TEXCOORD0; nointerpolation float4 source : TEXCOORD1; };
// Same sampling as the CPU restore: source = (pixel + 0.5) / 4, clamped inside the 16x16 cell.
float4 main(Varyings input) : SV_Target {
  float2 local = (input.position.xy - input.destination.xy) / 4.0;
  float2 texel = input.source.xy + clamp(local, 0.5, input.source.zw - 0.5);
  return float4(atlas.SampleLevel(bilinear, texel / atlasSize, 0).rgb, 1.0);
}`;

export interface Composition {
  changedTiles: Uint32Array<ArrayBuffer>;
  frame: number;
  milliseconds: number;
  view: 0 | 1;
}

export class Composer {
  readonly handles: [bigint, bigint];
  readonly #atlas: TextureResult;
  readonly #available: [boolean, boolean] = [true, true];
  readonly #height: number;
  readonly #journal: Journal;
  readonly #pixelShader: bigint;
  readonly #query: bigint;
  readonly #quadBytes: Buffer;
  readonly #quads: StructuredBuffer;
  #releaseWaiters: (() => void)[] = [];
  readonly #renderTargets: [bigint, bigint];
  readonly #sampler: bigint;
  #shown: 0 | 1 | -1 = -1;
  readonly #sizes: bigint;
  readonly #store: TileStore;
  readonly #target: Int32Array;
  readonly #textures: [bigint, bigint];
  readonly #tilesAcross: number;
  readonly #vertexShader: bigint;
  readonly #viewBlobs: [Int32Array, Int32Array];
  readonly #width: number;

  constructor(width: number, height: number, tilesAcross: number, journal: Journal, store: TileStore) {
    const { device } = requireGpu();
    this.#width = width;
    this.#height = height;
    this.#tilesAcross = tilesAcross;
    this.#journal = journal;
    this.#store = store;
    this.#target = new Int32Array(journal.tileCount);
    this.#viewBlobs = [new Int32Array(journal.tileCount).fill(unknownBlob), new Int32Array(journal.tileCount).fill(unknownBlob)];
    this.#textures = [this.#createSharedTexture(), this.#createSharedTexture()];
    this.handles = [this.#sharedHandle(this.#textures[0]), this.#sharedHandle(this.#textures[1])];
    this.#renderTargets = [this.#createRenderTarget(this.#textures[0]), this.#createRenderTarget(this.#textures[1])];
    this.#query = callOut(device, DEV_CREATE_QUERY, [FFIType.ptr], [ptr(new Uint32Array(new ArrayBuffer(8)))], 'CreateQuery(event)');
    this.#atlas = makeTexture({ format: DXGI_FORMAT_B8G8R8A8_UNORM, h: atlasCellsDown * cellSize, srv: true, w: atlasCellsAcross * cellSize });
    this.#quads = makeStructuredBuffer({ count: atlasCellsAcross * atlasCellsDown, cpuWritable: true, srv: true, stride: quadStride });
    this.#quadBytes = Buffer.alloc(atlasCellsAcross * atlasCellsDown * quadStride);
    this.#sizes = makeConstantBuffer(16);
    const sizes = Buffer.alloc(16);
    sizes.writeFloatLE(width, 0);
    sizes.writeFloatLE(height, 4);
    sizes.writeFloatLE(atlasCellsAcross * cellSize, 8);
    sizes.writeFloatLE(atlasCellsDown * cellSize, 12);
    updateConstantBuffer(this.#sizes, sizes);
    this.#vertexShader = makeVertexShader(compile(restoreVertexShader, 'main', 'vs_5_0'));
    this.#pixelShader = makePixelShader(compile(restorePixelShader, 'main', 'ps_5_0'));
    this.#sampler = makeSampler();
  }

  /** Recompose `frame` into a released view; `live` copies the newest capture texture whole instead. */
  async compose(frame: number, live: bigint | null): Promise<Composition> {
    const started = performance.now();
    const view = await this.#acquireView();
    const { context } = requireGpu();
    const blobs = this.#viewBlobs[view];
    const shown = this.#shown;
    const shownBlobs = shown === -1 ? null : this.#viewBlobs[shown];
    this.#journal.seek(frame, this.#target);
    if (live !== null) {
      vcall(context, CTX_COPY_RESOURCE, [FFIType.u64, FFIType.u64], [this.#textures[view], live], FFIType.void);
      // The live texture is the crisp truth; a reduced journal entry for the same tile is not.
      for (let tile = 0; tile < blobs.length; tile += 1) {
        const blob = this.#target[tile]!;
        blobs[tile] = blob >= 0 && this.#store.isReduced(blob) ? unknownBlob : blob;
      }
    } else {
      const box = new Uint32Array(new ArrayBuffer(24));
      let quads = 0;
      for (let tile = 0; tile < this.#target.length; tile += 1) {
        const blob = this.#target[tile]!;
        if (blob === blobs[tile] || blob < 0) continue;
        const left = (tile % this.#tilesAcross) * tileSize;
        const top = Math.floor(tile / this.#tilesAcross) * tileSize;
        const right = Math.min(this.#width, left + tileSize);
        const bottom = Math.min(this.#height, top + tileSize);
        const pixels = Bun.zstdDecompressSync(this.#store.blob(blob));
        blobs[tile] = blob;
        if (!isReduced(pixels, right - left, bottom - top)) {
          box.set([left, top, 0, right, bottom, 1]);
          vcall(context, CTX_UPDATE_SUBRESOURCE, [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], [this.#textures[view], 0, ptr(box), ptr(pixels), (right - left) * 4, 0], FFIType.void);
          continue;
        }
        if (quads === atlasCellsAcross * atlasCellsDown) {
          this.#drawQuads(view, quads);
          quads = 0;
        }
        const cellX = (quads % atlasCellsAcross) * cellSize;
        const cellY = Math.floor(quads / atlasCellsAcross) * cellSize;
        const columns = Math.ceil((right - left) / 4);
        const rows = Math.ceil((bottom - top) / 4);
        box.set([cellX, cellY, 0, cellX + columns, cellY + rows, 1]);
        vcall(context, CTX_UPDATE_SUBRESOURCE, [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], [this.#atlas.tex, 0, ptr(box), ptr(pixels), columns * 4, 0], FFIType.void);
        const offset = quads * quadStride;
        this.#quadBytes.writeFloatLE(left, offset);
        this.#quadBytes.writeFloatLE(top, offset + 4);
        this.#quadBytes.writeFloatLE(right, offset + 8);
        this.#quadBytes.writeFloatLE(bottom, offset + 12);
        this.#quadBytes.writeFloatLE(cellX, offset + 16);
        this.#quadBytes.writeFloatLE(cellY, offset + 20);
        this.#quadBytes.writeFloatLE(columns, offset + 24);
        this.#quadBytes.writeFloatLE(rows, offset + 28);
        quads += 1;
      }
      if (quads > 0) this.#drawQuads(view, quads);
    }
    const changed: number[] = [];
    if (shownBlobs !== null) for (let tile = 0; tile < blobs.length; tile += 1) if (blobs[tile] !== shownBlobs[tile]) changed.push(tile);
    await this.#fence();
    if (shown !== -1) this.#available[shown] = false;
    this.#shown = view;
    return { changedTiles: Uint32Array.from(changed), frame, milliseconds: performance.now() - started, view };
  }

  dispose(): void {
    comRelease(this.#query);
    for (const renderTarget of this.#renderTargets) comRelease(renderTarget);
    for (const texture of this.#textures) comRelease(texture);
    comRelease(this.#atlas.tex);
    comRelease(this.#quads.buffer);
    comRelease(this.#sizes);
    comRelease(this.#vertexShader);
    comRelease(this.#pixelShader);
    comRelease(this.#sampler);
  }

  /**
   * Decode `frame` (or a tile region of it) on the CPU into a top-down BGRA bitmap. Used for the
   * clipboard and PNG export, so pixels are exactly what was kept — no tint, no scaling.
   */
  export(frame: number, region: TileRegion | null): { bitmap: Uint8Array<ArrayBuffer>; height: number; width: number } {
    const bounds = region ?? { bottom: Math.ceil(this.#height / tileSize), left: 0, right: this.#tilesAcross, top: 0 };
    const left = bounds.left * tileSize;
    const top = bounds.top * tileSize;
    const width = Math.min(this.#width, bounds.right * tileSize) - left;
    const height = Math.min(this.#height, bounds.bottom * tileSize) - top;
    const bitmap = new Uint8Array(new ArrayBuffer(width * height * 4));
    this.#journal.seek(frame, this.#target);
    for (let tileY = bounds.top; tileY < bounds.bottom; tileY += 1) {
      for (let tileX = bounds.left; tileX < bounds.right; tileX += 1) {
        const blob = this.#target[tileY * this.#tilesAcross + tileX]!;
        if (blob < 0) continue;
        const columns = Math.min(tileSize, this.#width - tileX * tileSize);
        const rows = Math.min(tileSize, this.#height - tileY * tileSize);
        const stored = Bun.zstdDecompressSync(this.#store.blob(blob));
        const pixels = isReduced(stored, columns, rows) ? restore(stored, columns, rows) : stored;
        for (let row = 0; row < rows; row += 1) {
          const destination = ((tileY * tileSize + row - top) * width + (tileX * tileSize - left)) * 4;
          bitmap.set(pixels.subarray(row * columns * 4, (row + 1) * columns * 4), destination);
        }
      }
    }
    return { bitmap, height, width };
  }

  /** Blob ids just freed by eviction may be reused for other content: views must not trust them. */
  forget(freed: ReadonlySet<number>): void {
    if (freed.size === 0) return;
    for (const blobs of this.#viewBlobs) for (let tile = 0; tile < blobs.length; tile += 1) if (freed.has(blobs[tile]!)) blobs[tile] = unknownBlob;
  }

  forgetAll(): void {
    for (const blobs of this.#viewBlobs) blobs.fill(unknownBlob);
  }

  /** The eye no longer samples `view` (its GPU work using it has completed). */
  release(view: 0 | 1): void {
    if (view === this.#shown) return;
    this.#available[view] = true;
    for (const resolve of this.#releaseWaiters.splice(0)) resolve();
  }

  /** The eye closed: nothing is sampled any more. */
  reset(): void {
    this.#shown = -1;
    this.#available[0] = true;
    this.#available[1] = true;
    for (const resolve of this.#releaseWaiters.splice(0)) resolve();
  }

  async #acquireView(): Promise<0 | 1> {
    for (;;) {
      if (this.#shown !== 0 && this.#available[0]) return 0;
      if (this.#shown !== 1 && this.#available[1]) return 1;
      await new Promise<void>((resolve) => this.#releaseWaiters.push(resolve));
    }
  }

  #createRenderTarget(texture: bigint): bigint {
    return callOut(requireGpu().device, DEV_CREATE_RENDER_TARGET_VIEW, [FFIType.u64, FFIType.ptr], [texture, null], 'CreateRenderTargetView(view)');
  }

  #createSharedTexture(): bigint {
    const description = new Uint32Array(new ArrayBuffer(44));
    description.set([this.#width, this.#height, 1, 1, DXGI_FORMAT_B8G8R8A8_UNORM, 1, 0, 0, D3D11_BIND_SHADER_RESOURCE | D3D11_BIND_RENDER_TARGET, 0, resourceMiscShared]);
    return callOut(requireGpu().device, DEV_CREATE_TEXTURE_2D, [FFIType.ptr, FFIType.ptr], [ptr(description), null], 'CreateTexture2D(shared view)');
  }

  /** Restore `count` reduced tiles from the atlas into `view` with one draw. */
  #drawQuads(view: 0 | 1, count: number): void {
    updateDynamicBuffer(this.#quads.buffer, this.#quadBytes);
    setRenderTargets([this.#renderTargets[view]]);
    setViewport(this.#width, this.#height);
    setCull('none');
    vsSet(this.#vertexShader, [this.#sizes]);
    vsSetShaderResources([this.#quads.srv!]);
    psSet(this.#pixelShader, { cb: [this.#sizes], samp: [this.#sampler], srv: [this.#atlas.srv!] });
    drawTriangles(count * 6);
    setRenderTargets([]);
  }

  /** Wait (without blocking the event loop) until the GPU has executed everything issued so far. */
  async #fence(): Promise<void> {
    const { context } = requireGpu();
    const done = new Int32Array(new ArrayBuffer(4));
    vcall(context, CTX_END, [FFIType.u64], [this.#query], FFIType.void);
    vcall(context, CTX_FLUSH, [], [], FFIType.void);
    while (vcall(context, CTX_GET_DATA, [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], [this.#query, ptr(done), 4, 0]) !== 0) await new Promise((resolve) => setImmediate(resolve));
  }

  #sharedHandle(texture: bigint): bigint {
    const resource = queryInterface(texture, IID.IDXGIResource);
    try {
      return callOut(resource, DXGIResource.GetSharedHandle, [], [], 'GetSharedHandle');
    } finally {
      comRelease(resource);
    }
  }
}
