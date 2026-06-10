// Constant/structured buffer creation, dynamic upload, and staging readback.

import { FFIType, toArrayBuffer, type Pointer } from 'bun:ffi';

import { vcall, comRelease } from './com';
import {
  CTX_COPY_RESOURCE,
  CTX_COPY_STRUCTURE_COUNT,
  CTX_COPY_SUBRESOURCE_REGION,
  CTX_FLUSH,
  CTX_MAP,
  CTX_UNMAP,
  CTX_UPDATE_SUBRESOURCE,
  D3D11_BIND_CONSTANT_BUFFER,
  D3D11_BIND_SHADER_RESOURCE,
  D3D11_BIND_UNORDERED_ACCESS,
  D3D11_BUFFER_UAV_FLAG_APPEND,
  D3D11_CPU_ACCESS_READ,
  D3D11_CPU_ACCESS_WRITE,
  D3D11_MAP_FLAG_DO_NOT_WAIT,
  D3D11_MAP_READ,
  D3D11_MAP_WRITE,
  D3D11_MAP_WRITE_DISCARD,
  D3D11_RESOURCE_MISC_BUFFER_STRUCTURED,
  D3D11_RESOURCE_MISC_DRAWINDIRECT_ARGS,
  D3D11_SRV_DIMENSION_BUFFER,
  D3D11_UAV_DIMENSION_BUFFER,
  D3D11_USAGE_DEFAULT,
  D3D11_USAGE_DYNAMIC,
  D3D11_USAGE_STAGING,
  DEV_CREATE_BUFFER,
  DEV_CREATE_SHADER_RESOURCE_VIEW,
  DEV_CREATE_UNORDERED_ACCESS_VIEW,
  DXGI_ERROR_WAS_STILL_DRAWING,
  DXGI_FORMAT_UNKNOWN,
} from './constants';
import { describeDeviceError, requireGpu } from './device';
import { trackResource, trackedByteSize, trackedStride } from './memory';

/** Result of {@link makeStructuredBuffer}: the buffer plus optional UAV/SRV views. */
export interface StructuredBuffer {
  buffer: bigint;
  uav?: bigint;
  srv?: bigint;
}

export interface StructuredBufferOptions {
  stride: number;
  count: number;
  uav?: boolean;
  srv?: boolean;
  /** Give the UAV a hidden append/consume counter (AppendStructuredBuffer/ConsumeStructuredBuffer). Reset it per bind via csSet's uavInitialCounts. */
  appendCounter?: boolean;
  cpuWritable?: boolean;
  initialData?: Buffer;
}

/** Create a DEFAULT-usage constant buffer of `byteSize` bytes (rounded up to 16). */
export function makeConstantBuffer(byteSize: number): bigint {
  const { device } = requireGpu();
  const size = Math.ceil(byteSize / 16) * 16;
  const desc = Buffer.alloc(24);
  desc.writeUInt32LE(size, 0); // ByteWidth
  desc.writeUInt32LE(D3D11_USAGE_DEFAULT, 4); // Usage
  desc.writeUInt32LE(D3D11_BIND_CONSTANT_BUFFER, 8); // BindFlags
  desc.writeUInt32LE(0, 12); // CPUAccessFlags
  desc.writeUInt32LE(0, 16); // MiscFlags
  desc.writeUInt32LE(0, 20); // StructureByteStride
  const pp = Buffer.alloc(8);
  const hr = vcall(device, DEV_CREATE_BUFFER, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [desc.ptr!, null, pp.ptr!]);
  if (hr !== 0) throw new Error(`CreateBuffer (constant buffer) failed: ${describeDeviceError(hr)}`);
  const buffer = pp.readBigUInt64LE(0);
  trackResource(buffer, size, 'constantBuffer');
  return buffer;
}

/**
 * Create a STRUCTURED buffer (MiscFlags STRUCTURED) of `count` × `stride` bytes,
 * optionally with a UAV (RWStructuredBuffer) and/or SRV (StructuredBuffer<>).
 */
export function makeStructuredBuffer(options: StructuredBufferOptions): StructuredBuffer {
  const { device } = requireGpu();
  const { stride, count, uav = false, srv = false, appendCounter = false, cpuWritable = false, initialData } = options;
  const byteWidth = stride * count;

  let bindFlags = 0;
  if (uav) bindFlags |= D3D11_BIND_UNORDERED_ACCESS;
  if (srv) bindFlags |= D3D11_BIND_SHADER_RESOURCE;
  if (bindFlags === 0) bindFlags = D3D11_BIND_SHADER_RESOURCE;

  const desc = Buffer.alloc(24);
  desc.writeUInt32LE(byteWidth, 0); // ByteWidth
  desc.writeUInt32LE(cpuWritable ? D3D11_USAGE_DYNAMIC : D3D11_USAGE_DEFAULT, 4); // Usage
  desc.writeUInt32LE(bindFlags, 8); // BindFlags
  desc.writeUInt32LE(cpuWritable ? D3D11_CPU_ACCESS_WRITE : 0, 12); // CPUAccessFlags
  desc.writeUInt32LE(D3D11_RESOURCE_MISC_BUFFER_STRUCTURED, 16); // MiscFlags
  desc.writeUInt32LE(stride, 20); // StructureByteStride

  // D3D11_SUBRESOURCE_DATA { pSysMem, SysMemPitch, SysMemSlicePitch } — 16 bytes.
  let initBuf: Buffer | null = null;
  if (initialData !== undefined) {
    initBuf = Buffer.alloc(16);
    initBuf.writeBigUInt64LE(BigInt(initialData.ptr!), 0);
  }
  const pp = Buffer.alloc(8);
  const hr = vcall(device, DEV_CREATE_BUFFER, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [desc.ptr!, initBuf === null ? null : initBuf.ptr!, pp.ptr!]);
  if (hr !== 0) throw new Error(`CreateBuffer (structured buffer) failed: ${describeDeviceError(hr)}`);
  const buffer = pp.readBigUInt64LE(0);
  trackResource(buffer, byteWidth, 'buffer', stride);

  const result: StructuredBuffer = { buffer };

  if (uav) {
    // D3D11_UNORDERED_ACCESS_VIEW_DESC: Format u32@0, ViewDimension u32@4, Buffer{FirstElement@8, NumElements@12, Flags@16}.
    const uavDesc = Buffer.alloc(28);
    uavDesc.writeUInt32LE(DXGI_FORMAT_UNKNOWN, 0);
    uavDesc.writeUInt32LE(D3D11_UAV_DIMENSION_BUFFER, 4);
    uavDesc.writeUInt32LE(0, 8); // FirstElement
    uavDesc.writeUInt32LE(count, 12); // NumElements
    uavDesc.writeUInt32LE(appendCounter ? D3D11_BUFFER_UAV_FLAG_APPEND : 0, 16); // Flags
    const ppUav = Buffer.alloc(8);
    const uavHr = vcall(device, DEV_CREATE_UNORDERED_ACCESS_VIEW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [buffer, uavDesc.ptr!, ppUav.ptr!]);
    if (uavHr !== 0) {
      comRelease(buffer);
      throw new Error(`CreateUnorderedAccessView (structured buffer) failed: ${describeDeviceError(uavHr)}`);
    }
    result.uav = ppUav.readBigUInt64LE(0);
  }

  if (srv) {
    // D3D11_SHADER_RESOURCE_VIEW_DESC: Format u32@0, ViewDimension u32@4, Buffer{FirstElement@8, NumElements@12}.
    const srvDesc = Buffer.alloc(28);
    srvDesc.writeUInt32LE(DXGI_FORMAT_UNKNOWN, 0);
    srvDesc.writeUInt32LE(D3D11_SRV_DIMENSION_BUFFER, 4);
    srvDesc.writeUInt32LE(0, 8); // FirstElement
    srvDesc.writeUInt32LE(count, 12); // NumElements
    const ppSrv = Buffer.alloc(8);
    const srvHr = vcall(device, DEV_CREATE_SHADER_RESOURCE_VIEW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [buffer, srvDesc.ptr!, ppSrv.ptr!]);
    if (srvHr !== 0) {
      comRelease(result.uav ?? 0n);
      comRelease(buffer);
      throw new Error(`CreateShaderResourceView (structured buffer) failed: ${describeDeviceError(srvHr)}`);
    }
    result.srv = ppSrv.readBigUInt64LE(0);
  }

  return result;
}

/**
 * Create a 12-byte indirect-dispatch args buffer {x, y, z} (MISC DRAWINDIRECT_ARGS —
 * args buffers cannot be STRUCTURED). Fill x on the GPU via copyStructureCount, then
 * dispatchIndirect — thread-group counts never touch the CPU.
 */
export function makeIndirectArgsBuffer(initial: readonly [number, number, number] = [1, 1, 1]): bigint {
  const { device } = requireGpu();
  const desc = Buffer.alloc(24);
  desc.writeUInt32LE(12, 0); // ByteWidth
  desc.writeUInt32LE(D3D11_USAGE_DEFAULT, 4);
  desc.writeUInt32LE(0, 8); // BindFlags
  desc.writeUInt32LE(0, 12); // CPUAccessFlags
  desc.writeUInt32LE(D3D11_RESOURCE_MISC_DRAWINDIRECT_ARGS, 16);
  desc.writeUInt32LE(0, 20); // StructureByteStride
  const initialData = Buffer.alloc(12);
  initialData.writeUInt32LE(initial[0], 0);
  initialData.writeUInt32LE(initial[1], 4);
  initialData.writeUInt32LE(initial[2], 8);
  const subresource = Buffer.alloc(16);
  subresource.writeBigUInt64LE(BigInt(initialData.ptr!), 0);
  const pp = Buffer.alloc(8);
  const hr = vcall(device, DEV_CREATE_BUFFER, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [desc.ptr!, subresource.ptr!, pp.ptr!]);
  if (hr !== 0) throw new Error(`CreateBuffer (indirect args) failed: ${describeDeviceError(hr)}`);
  const buffer = pp.readBigUInt64LE(0);
  trackResource(buffer, 12, 'buffer');
  return buffer;
}

/**
 * Read an append/consume UAV's hidden counter (CopyStructureCount straight into a
 * persistent 4-byte staging buffer → Map READ). The variable-size-GPU-output
 * primitive: dispatch, then ask how many elements the kernel actually appended.
 * Per-call GPU resource churn is zero — the staging target lives for the device.
 */
export function appendCount(uav: bigint): number {
  const { device, context } = requireGpu();
  if (counterStaging === 0n || counterStagingDevice !== device) {
    comRelease(counterStaging);
    counterStaging = 0n; // a failed create must leave the pool empty, not poisoned
    counterStagingDevice = 0n;
    readbackDescScratch.writeUInt32LE(4, 0); // ByteWidth
    readbackDescScratch.writeUInt32LE(D3D11_USAGE_STAGING, 4);
    readbackDescScratch.writeUInt32LE(0, 8); // BindFlags
    readbackDescScratch.writeUInt32LE(D3D11_CPU_ACCESS_READ, 12);
    readbackDescScratch.writeUInt32LE(0, 16); // MiscFlags
    readbackDescScratch.writeUInt32LE(0, 20); // StructureByteStride
    const createHr = vcall(device, DEV_CREATE_BUFFER, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [readbackDescScratch.ptr!, null, readbackHandleScratch.ptr!]);
    if (createHr !== 0) throw new Error(`CreateBuffer (append counter staging) failed: ${describeDeviceError(createHr)}`);
    counterStaging = readbackHandleScratch.readBigUInt64LE(0);
    counterStagingDevice = device;
  }
  vcall(context, CTX_COPY_STRUCTURE_COUNT, [FFIType.u64, FFIType.u32, FFIType.u64], [counterStaging, 0, uav], FFIType.void);
  const hr = vcall(context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [counterStaging, 0, D3D11_MAP_READ, 0, readbackMappedScratch.ptr!]);
  if (hr !== 0) throw new Error(`ID3D11DeviceContext::Map (append counter) failed: ${describeDeviceError(hr)}`);
  const dataPtr = readbackMappedScratch.readBigUInt64LE(0);
  const count = new Uint32Array(toArrayBuffer(Number(dataPtr) as Pointer, 0, 4))[0]!;
  vcall(context, CTX_UNMAP, [FFIType.u64, FFIType.u32], [counterStaging, 0], FFIType.void);
  return count;
}

/**
 * Read back a GPU buffer to host memory: create a STAGING copy, CopyResource into
 * it, Map READ, bulk-copy `byteSize` bytes into owned memory before Unmap.
 * `byteSize` must equal the buffer's full ByteWidth — CopyResource silently no-ops
 * when source and destination sizes differ. Slice the result for partial reads.
 * Returns a detached ArrayBuffer. Synchronizes the GPU (the perf cliff to know about).
 */
// Sync-readback hot-path state, allocated once (perf doctrine): staging buffers are
// pooled per byteSize (insertion-order LRU, cap 8) so mixed-size readback loops and
// appendCount never evict each other (a 1 MB staging create+release pair costs
// ~27-42 µs). `.ptr` is read at call time, never cached — Bun small-Buffer stores
// can relocate.
const readbackDescScratch = Buffer.alloc(24);
const readbackHandleScratch = Buffer.alloc(8);
const readbackMappedScratch = Buffer.alloc(16); // pData@0, RowPitch u32@8, DepthPitch u32@12
const updateMappedScratch = Buffer.alloc(16);
const stagingPool = new Map<number, bigint>(); // byteSize → staging; first key is the LRU victim
const STAGING_POOL_LIMIT = 8;
let stagingPoolDevice = 0n;
const asyncStagingPool = new Map<string, bigint[]>(); // `${device}|${byteSize}` → freelist
const ASYNC_STAGING_POOL_LIMIT = 4;
let counterStaging = 0n; // persistent 4-byte staging for appendCount
let counterStagingDevice = 0n;
// Chunked large-transfer state: ≥16 MiB readbacks (and ≥32 MiB uploads) split into
// chunk-sized stagings via CopySubresourceRegion + Flush so GPU DMA overlaps the CPU
// memcpy (1.2-1.8× measured at 16-64 MB). Chunk edges MUST be multiples of the
// source's structure stride — D3D11 silently drops the whole region copy otherwise.
const chunkStagingPool = new Map<string, bigint[]>(); // `${device}|${chunkBytes}` → freelist
const boxScratch = Buffer.alloc(24); // D3D11_BOX { left, top, front, right, bottom, back }
const READBACK_CHUNK_THRESHOLD = 16 * 1024 * 1024;
const UPLOAD_CHUNK_THRESHOLD = 32 * 1024 * 1024;

function acquireChunkStaging(device: bigint, byteSize: number, cpuAccess: number): bigint {
  const poolKey = `${device}|${byteSize}|${cpuAccess}`;
  const pooled = chunkStagingPool.get(poolKey)?.pop();
  if (pooled !== undefined) return pooled;
  readbackDescScratch.writeUInt32LE(byteSize, 0);
  readbackDescScratch.writeUInt32LE(D3D11_USAGE_STAGING, 4);
  readbackDescScratch.writeUInt32LE(0, 8); // BindFlags
  readbackDescScratch.writeUInt32LE(cpuAccess, 12);
  readbackDescScratch.writeUInt32LE(0, 16); // MiscFlags
  readbackDescScratch.writeUInt32LE(0, 20); // StructureByteStride
  const hr = vcall(device, DEV_CREATE_BUFFER, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [readbackDescScratch.ptr!, null, readbackHandleScratch.ptr!]);
  if (hr !== 0) throw new Error(`CreateBuffer (chunk staging) failed: ${describeDeviceError(hr)}`);
  return readbackHandleScratch.readBigUInt64LE(0);
}

function releaseChunkStaging(device: bigint, byteSize: number, cpuAccess: number, staging: bigint): void {
  const poolKey = `${device}|${byteSize}|${cpuAccess}`;
  let freelist = chunkStagingPool.get(poolKey);
  if (freelist === undefined) {
    freelist = [];
    chunkStagingPool.set(poolKey, freelist);
  }
  freelist.push(staging); // bounded by K ≤ 16 per (device, chunk size) by construction
}

// Issue all chunk copies (each Flushed so DMA starts immediately), then drain them
// in order — Map of chunk 0 overlaps the GPU still copying chunks 1..K-1.
function readbackChunked(device: bigint, context: bigint, buffer: bigint, byteSize: number, stride: number, out: Uint8Array): void {
  const chunkCount = Math.min(16, Math.max(2, Math.round(byteSize / (4 * 1024 * 1024))));
  let chunkBytes = Math.floor(byteSize / chunkCount);
  chunkBytes -= chunkBytes % stride;
  const lastBytes = byteSize - chunkBytes * (chunkCount - 1);
  const stagings: bigint[] = [];
  for (let chunk = 0; chunk < chunkCount; chunk += 1) {
    const size = chunk === chunkCount - 1 ? lastBytes : chunkBytes;
    const staging = acquireChunkStaging(device, size, D3D11_CPU_ACCESS_READ);
    stagings.push(staging);
    const offset = chunk * chunkBytes;
    boxScratch.writeUInt32LE(offset, 0); // left
    boxScratch.writeUInt32LE(0, 4); // top
    boxScratch.writeUInt32LE(0, 8); // front
    boxScratch.writeUInt32LE(offset + size, 12); // right
    boxScratch.writeUInt32LE(1, 16); // bottom
    boxScratch.writeUInt32LE(1, 20); // back
    vcall(context, CTX_COPY_SUBRESOURCE_REGION, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.ptr], [staging, 0, 0, 0, 0, buffer, 0, boxScratch.ptr!], FFIType.void);
    vcall(context, CTX_FLUSH, [], [], FFIType.void);
  }
  for (let chunk = 0; chunk < chunkCount; chunk += 1) {
    const size = chunk === chunkCount - 1 ? lastBytes : chunkBytes;
    const staging = stagings[chunk]!;
    const hr = vcall(context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [staging, 0, D3D11_MAP_READ, 0, readbackMappedScratch.ptr!]);
    if (hr !== 0) throw new Error(`ID3D11DeviceContext::Map (chunked readback) failed: ${describeDeviceError(hr)}`);
    const dataPtr = readbackMappedScratch.readBigUInt64LE(0);
    out.set(new Uint8Array(toArrayBuffer(Number(dataPtr) as Pointer, 0, size)), chunk * chunkBytes);
    vcall(context, CTX_UNMAP, [FFIType.u64, FFIType.u32], [staging, 0], FFIType.void);
    releaseChunkStaging(device, size, D3D11_CPU_ACCESS_READ, staging);
  }
}

/** Internal: chunked staging upload for very large buffers. Returns false (caller falls back to UpdateSubresource) below 32 MiB, on WARP (its UpdateSubresource is a straight CPU memcpy — chunking regresses it 3.7-4×), or when chunks cannot be stride-aligned. */
export function uploadBufferChunked(buffer: bigint, data: ArrayBufferView, stride: number): boolean {
  const gpu = requireGpu();
  if (gpu.driver !== 'hardware' || data.byteLength < UPLOAD_CHUNK_THRESHOLD || stride <= 0) return false;
  const { device, context } = gpu;
  const chunkCount = 8;
  let chunkBytes = Math.floor(data.byteLength / chunkCount);
  chunkBytes -= chunkBytes % stride;
  if (chunkBytes === 0) return false;
  const lastBytes = data.byteLength - chunkBytes * (chunkCount - 1);
  const source = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  for (let chunk = 0; chunk < chunkCount; chunk += 1) {
    const size = chunk === chunkCount - 1 ? lastBytes : chunkBytes;
    const offset = chunk * chunkBytes;
    const staging = acquireChunkStaging(device, size, D3D11_CPU_ACCESS_WRITE);
    const hr = vcall(context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [staging, 0, D3D11_MAP_WRITE, 0, readbackMappedScratch.ptr!]);
    if (hr !== 0) {
      comRelease(staging); // never pool a buffer in unknown state
      throw new Error(`ID3D11DeviceContext::Map (chunked upload) failed: ${describeDeviceError(hr)}`);
    }
    const dataPtr = readbackMappedScratch.readBigUInt64LE(0);
    new Uint8Array(toArrayBuffer(Number(dataPtr) as Pointer, 0, size)).set(source.subarray(offset, offset + size));
    vcall(context, CTX_UNMAP, [FFIType.u64, FFIType.u32], [staging, 0], FFIType.void);
    boxScratch.writeUInt32LE(0, 0); // left
    boxScratch.writeUInt32LE(0, 4); // top
    boxScratch.writeUInt32LE(0, 8); // front
    boxScratch.writeUInt32LE(size, 12); // right
    boxScratch.writeUInt32LE(1, 16); // bottom
    boxScratch.writeUInt32LE(1, 20); // back
    vcall(context, CTX_COPY_SUBRESOURCE_REGION, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.ptr], [buffer, 0, offset, 0, 0, staging, 0, boxScratch.ptr!], FFIType.void);
    vcall(context, CTX_FLUSH, [], [], FFIType.void);
    releaseChunkStaging(device, size, D3D11_CPU_ACCESS_WRITE, staging);
  }
  return true;
}

// Staging copy + Map READ + bulk-copy into `out` BEFORE Unmap (the mapped pointer
// dies at Unmap; the copy detaches the result from driver memory).
function readbackIntoBytes(buffer: bigint, byteSize: number, out: Uint8Array): void {
  const trackedSize = trackedByteSize(buffer);
  if (trackedSize !== undefined && trackedSize !== byteSize) {
    throw new Error(`readback: byteSize ${byteSize} does not match the buffer's ByteWidth ${trackedSize} — CopyResource silently no-ops on size mismatch. Read the full ByteWidth and slice on the CPU.`);
  }
  const { device, context } = requireGpu();
  if (stagingPoolDevice !== device) {
    for (const staging of stagingPool.values()) comRelease(staging);
    stagingPool.clear();
    stagingPoolDevice = device;
  }
  if (byteSize >= READBACK_CHUNK_THRESHOLD) {
    const stride = trackedStride(buffer);
    if (stride > 0) {
      readbackChunked(device, context, buffer, byteSize, stride, out);
      return;
    }
    // Unknown stride (raw/untracked buffer) — chunk edges cannot be proven
    // stride-aligned, so stay on the single-staging CopyResource path.
  }
  let staging = stagingPool.get(byteSize);
  if (staging === undefined) {
    if (stagingPool.size >= STAGING_POOL_LIMIT) {
      const victim = stagingPool.keys().next().value!;
      comRelease(stagingPool.get(victim)!);
      stagingPool.delete(victim);
    }
    // Staging buffer: same ByteWidth, USAGE_STAGING, CPU_ACCESS_READ, no bind flags.
    readbackDescScratch.writeUInt32LE(byteSize, 0);
    readbackDescScratch.writeUInt32LE(D3D11_USAGE_STAGING, 4);
    readbackDescScratch.writeUInt32LE(0, 8); // BindFlags
    readbackDescScratch.writeUInt32LE(D3D11_CPU_ACCESS_READ, 12);
    readbackDescScratch.writeUInt32LE(0, 16); // MiscFlags
    readbackDescScratch.writeUInt32LE(0, 20); // StructureByteStride
    const createHr = vcall(device, DEV_CREATE_BUFFER, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [readbackDescScratch.ptr!, null, readbackHandleScratch.ptr!]);
    if (createHr !== 0) {
      throw new Error(`CreateBuffer (readback staging) failed: ${describeDeviceError(createHr)}`);
    }
    staging = readbackHandleScratch.readBigUInt64LE(0);
  } else {
    stagingPool.delete(byteSize); // LRU touch — re-insertion moves it to the back
  }
  stagingPool.set(byteSize, staging);

  vcall(context, CTX_COPY_RESOURCE, [FFIType.u64, FFIType.u64], [staging, buffer], FFIType.void);

  const hr = vcall(context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [staging, 0, D3D11_MAP_READ, 0, readbackMappedScratch.ptr!]);
  if (hr !== 0) {
    throw new Error(`ID3D11DeviceContext::Map (readback) failed: ${describeDeviceError(hr)}`);
  }
  const dataPtr = readbackMappedScratch.readBigUInt64LE(0);
  out.set(new Uint8Array(toArrayBuffer(Number(dataPtr) as Pointer, 0, byteSize)));
  vcall(context, CTX_UNMAP, [FFIType.u64, FFIType.u32], [staging, 0], FFIType.void);
}

export function readbackBuffer(buffer: bigint, byteSize: number): ArrayBuffer {
  // allocUnsafeSlow: exact-size non-pooled backing store, no zero-fill (every byte
  // is overwritten) — the zero-fill alone costs ~46 µs at 1 MB.
  const out = Buffer.allocUnsafeSlow(byteSize);
  readbackIntoBytes(buffer, byteSize, out);
  return out.buffer;
}

/**
 * Read back a GPU buffer directly into caller-owned memory — one copy, zero
 * allocation (the hot-loop variant of {@link readbackBuffer}; GpuArray.readInto and
 * run() use it). `byteSize` must equal the buffer's full ByteWidth, and `target`
 * must hold at least `byteSize` bytes.
 */
export function readbackBufferInto(buffer: bigint, byteSize: number, target: ArrayBufferView): void {
  if (target.byteLength < byteSize) throw new Error(`readbackBufferInto: target holds ${target.byteLength} bytes but byteSize is ${byteSize}.`);
  readbackIntoBytes(buffer, byteSize, new Uint8Array(target.buffer, target.byteOffset, byteSize));
}

/** Internal: drop every pooled readback staging buffer (destroyDevice calls this). */
export function releaseReadbackStaging(): void {
  for (const staging of stagingPool.values()) comRelease(staging);
  stagingPool.clear();
  stagingPoolDevice = 0n;
  for (const freelist of asyncStagingPool.values()) {
    for (const staging of freelist) comRelease(staging);
  }
  asyncStagingPool.clear();
  for (const freelist of chunkStagingPool.values()) {
    for (const staging of freelist) comRelease(staging);
  }
  chunkStagingPool.clear();
  comRelease(counterStaging);
  counterStaging = 0n;
  counterStagingDevice = 0n;
}

/**
 * Read back a GPU buffer WITHOUT blocking the event loop: staging copy, Flush, then
 * Map(DO_NOT_WAIT) polled across setImmediate turns until the copy completes.
 * Timers, I/O, and other promises keep running while the GPU finishes.
 */
export async function readbackBufferAsync(buffer: bigint, byteSize: number): Promise<ArrayBuffer> {
  const { device, context } = requireGpu();
  // Freelist pool per (device, byteSize): the acquiring call owns its staging buffer
  // for the whole copy/Flush/poll/Map/copy-out/Unmap lifetime, so overlapping
  // in-flight readbacks are correct by construction.
  const poolKey = `${device}|${byteSize}`;
  let staging = asyncStagingPool.get(poolKey)?.pop();
  if (staging === undefined) {
    // The desc/handle scratch are shared with the sync path — this prologue is synchronous.
    readbackDescScratch.writeUInt32LE(byteSize, 0);
    readbackDescScratch.writeUInt32LE(D3D11_USAGE_STAGING, 4);
    readbackDescScratch.writeUInt32LE(0, 8); // BindFlags
    readbackDescScratch.writeUInt32LE(D3D11_CPU_ACCESS_READ, 12);
    readbackDescScratch.writeUInt32LE(0, 16); // MiscFlags
    readbackDescScratch.writeUInt32LE(0, 20); // StructureByteStride
    const createHr = vcall(device, DEV_CREATE_BUFFER, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [readbackDescScratch.ptr!, null, readbackHandleScratch.ptr!]);
    if (createHr !== 0) throw new Error(`CreateBuffer (async readback staging) failed: ${describeDeviceError(createHr)}`);
    staging = readbackHandleScratch.readBigUInt64LE(0);
  }

  vcall(context, CTX_COPY_RESOURCE, [FFIType.u64, FFIType.u64], [staging, buffer], FFIType.void);
  vcall(context, CTX_FLUSH, [], [], FFIType.void);

  // `mapped` spans awaits and concurrent readbacks — it must stay per-call; it is
  // re-referenced after every await, so nothing FFI-visible spans a GC window.
  const mapped = Buffer.alloc(16); // pData@0, RowPitch u32@8, DepthPitch u32@12
  // Pre-first-yield burst: small copies complete microseconds after Flush, so
  // re-polling Map synchronously up to 128 times (~25 µs worst case at ~200 ns per
  // failed attempt) brings small async readbacks to sync parity with zero yield
  // turns; large copies exhaust the burst and yield exactly as before.
  let burstLeft = 128;
  for (;;) {
    const hr = vcall(context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [staging, 0, D3D11_MAP_READ, D3D11_MAP_FLAG_DO_NOT_WAIT, mapped.ptr!]);
    if (hr === 0) break;
    if (hr >>> 0 !== DXGI_ERROR_WAS_STILL_DRAWING) {
      comRelease(staging); // never pool a buffer in unknown state
      throw new Error(`ID3D11DeviceContext::Map (async readback) failed: ${describeDeviceError(hr)}`);
    }
    if (burstLeft > 0) {
      burstLeft -= 1;
      continue;
    }
    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });
  }
  const dataPtr = mapped.readBigUInt64LE(0);
  const out = Buffer.allocUnsafeSlow(byteSize);
  out.set(new Uint8Array(toArrayBuffer(Number(dataPtr) as Pointer, 0, byteSize)));
  vcall(context, CTX_UNMAP, [FFIType.u64, FFIType.u32], [staging, 0], FFIType.void);
  let freelist = asyncStagingPool.get(poolKey);
  if (freelist === undefined) {
    freelist = [];
    asyncStagingPool.set(poolKey, freelist);
  }
  if (freelist.length < ASYNC_STAGING_POOL_LIMIT) freelist.push(staging);
  else comRelease(staging);
  return out.buffer;
}

/** Upload `data` into a DEFAULT-usage constant buffer via UpdateSubresource. The copy reads the DESTINATION's full (16-rounded) ByteWidth from `data.ptr` — `data` must be at least that large (Kernel.dispatch pads its uniforms for exactly this reason). */
export function updateConstantBuffer(buffer: bigint, data: Buffer): void {
  const { context } = requireGpu();
  vcall(context, CTX_UPDATE_SUBRESOURCE, [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], [buffer, 0, null, data.ptr!, 0, 0], FFIType.void);
}

/** Upload `data` into a DYNAMIC (cpuWritable) buffer via Map WRITE_DISCARD. */
export function updateDynamicBuffer(buffer: bigint, data: Buffer): void {
  const { context } = requireGpu();
  const hr = vcall(context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [buffer, 0, D3D11_MAP_WRITE_DISCARD, 0, updateMappedScratch.ptr!]);
  if (hr !== 0) throw new Error(`Map (WRITE_DISCARD) failed: ${describeDeviceError(hr)}`);
  const dataPtr = Number(updateMappedScratch.readBigUInt64LE(0)) as Pointer;
  new Uint8Array(toArrayBuffer(dataPtr, 0, data.byteLength)).set(data);
  vcall(context, CTX_UNMAP, [FFIType.u64, FFIType.u32], [buffer, 0], FFIType.void);
}
