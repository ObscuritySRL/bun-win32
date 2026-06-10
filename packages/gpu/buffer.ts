// Constant/structured buffer creation, dynamic upload, and staging readback.

import { FFIType, toArrayBuffer, type Pointer } from 'bun:ffi';

import { vcall, comRelease } from './com';
import {
  CTX_COPY_RESOURCE,
  CTX_COPY_STRUCTURE_COUNT,
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
import { trackResource } from './memory';

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
  if (vcall(device, DEV_CREATE_BUFFER, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [desc.ptr!, null, pp.ptr!]) !== 0) {
    throw new Error('CreateBuffer (constant buffer) failed.');
  }
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
  if (vcall(device, DEV_CREATE_BUFFER, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [desc.ptr!, initBuf === null ? null : initBuf.ptr!, pp.ptr!]) !== 0) {
    throw new Error('CreateBuffer (structured buffer) failed.');
  }
  const buffer = pp.readBigUInt64LE(0);
  trackResource(buffer, byteWidth, 'buffer');

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
    if (vcall(device, DEV_CREATE_UNORDERED_ACCESS_VIEW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [buffer, uavDesc.ptr!, ppUav.ptr!]) !== 0) {
      throw new Error('CreateUnorderedAccessView (structured buffer) failed.');
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
    if (vcall(device, DEV_CREATE_SHADER_RESOURCE_VIEW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [buffer, srvDesc.ptr!, ppSrv.ptr!]) !== 0) {
      throw new Error('CreateShaderResourceView (structured buffer) failed.');
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
  if (vcall(device, DEV_CREATE_BUFFER, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [desc.ptr!, subresource.ptr!, pp.ptr!]) !== 0) {
    throw new Error('CreateBuffer (indirect args) failed.');
  }
  const buffer = pp.readBigUInt64LE(0);
  trackResource(buffer, 12, 'buffer');
  return buffer;
}

/**
 * Read an append/consume UAV's hidden counter (CopyStructureCount → tiny buffer →
 * readback). The variable-size-GPU-output primitive: dispatch, then ask how many
 * elements the kernel actually appended.
 */
export function appendCount(uav: bigint): number {
  const { device, context } = requireGpu();
  const desc = Buffer.alloc(24);
  desc.writeUInt32LE(4, 0); // ByteWidth
  desc.writeUInt32LE(D3D11_USAGE_DEFAULT, 4);
  desc.writeUInt32LE(0, 8); // BindFlags
  desc.writeUInt32LE(0, 12); // CPUAccessFlags
  desc.writeUInt32LE(0, 16); // MiscFlags
  desc.writeUInt32LE(0, 20); // StructureByteStride
  const pp = Buffer.alloc(8);
  if (vcall(device, DEV_CREATE_BUFFER, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [desc.ptr!, null, pp.ptr!]) !== 0) {
    throw new Error('CreateBuffer (append counter target) failed.');
  }
  const target = pp.readBigUInt64LE(0);
  vcall(context, CTX_COPY_STRUCTURE_COUNT, [FFIType.u64, FFIType.u32, FFIType.u64], [target, 0, uav], FFIType.void);
  const count = new Uint32Array(readbackBuffer(target, 4))[0]!;
  comRelease(target);
  return count;
}

/**
 * Read back a GPU buffer to host memory: create a STAGING copy, CopyResource into
 * it, Map READ, bulk-copy `byteSize` bytes into owned memory before Unmap.
 * `byteSize` must equal the buffer's full ByteWidth — CopyResource silently no-ops
 * when source and destination sizes differ. Slice the result for partial reads.
 * Returns a detached ArrayBuffer. Synchronizes the GPU (the perf cliff to know about).
 */
// Sync-readback hot-path state, allocated once (perf doctrine): the staging buffer
// is pooled per (device, byteSize) so a readback loop creates zero GPU resources.
// `.ptr` is read at call time, never cached — Bun small-Buffer stores can relocate.
const readbackDescScratch = Buffer.alloc(24);
const readbackHandleScratch = Buffer.alloc(8);
const readbackMappedScratch = Buffer.alloc(16); // pData@0, RowPitch u32@8, DepthPitch u32@12
let cachedStaging = 0n;
let cachedStagingByteSize = -1;
let cachedStagingDevice = 0n;

export function readbackBuffer(buffer: bigint, byteSize: number): ArrayBuffer {
  const { device, context } = requireGpu();
  if (cachedStaging === 0n || cachedStagingByteSize !== byteSize || cachedStagingDevice !== device) {
    comRelease(cachedStaging);
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
    cachedStaging = readbackHandleScratch.readBigUInt64LE(0);
    cachedStagingByteSize = byteSize;
    cachedStagingDevice = device;
  }
  const staging = cachedStaging;

  vcall(context, CTX_COPY_RESOURCE, [FFIType.u64, FFIType.u64], [staging, buffer], FFIType.void);

  const hr = vcall(context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [staging, 0, D3D11_MAP_READ, 0, readbackMappedScratch.ptr!]);
  if (hr !== 0) {
    throw new Error(`ID3D11DeviceContext::Map (readback) failed: ${describeDeviceError(hr)}`);
  }
  const dataPtr = readbackMappedScratch.readBigUInt64LE(0);
  // Bulk-copy the mapped region into an owned Uint8Array BEFORE Unmap (the mapped
  // pointer dies at Unmap; the copy detaches the result from driver memory).
  const out = new Uint8Array(byteSize);
  out.set(new Uint8Array(toArrayBuffer(Number(dataPtr) as Pointer, 0, byteSize)));
  vcall(context, CTX_UNMAP, [FFIType.u64, FFIType.u32], [staging, 0], FFIType.void);
  return out.buffer;
}

/** Internal: drop the pooled readback staging buffer (destroyDevice calls this). */
export function releaseReadbackStaging(): void {
  comRelease(cachedStaging);
  cachedStaging = 0n;
  cachedStagingByteSize = -1;
  cachedStagingDevice = 0n;
}

/**
 * Read back a GPU buffer WITHOUT blocking the event loop: staging copy, Flush, then
 * Map(DO_NOT_WAIT) polled across setImmediate turns until the copy completes.
 * Timers, I/O, and other promises keep running while the GPU finishes.
 */
export async function readbackBufferAsync(buffer: bigint, byteSize: number): Promise<ArrayBuffer> {
  const { device, context } = requireGpu();
  const desc = Buffer.alloc(24);
  desc.writeUInt32LE(byteSize, 0);
  desc.writeUInt32LE(D3D11_USAGE_STAGING, 4);
  desc.writeUInt32LE(0, 8); // BindFlags
  desc.writeUInt32LE(D3D11_CPU_ACCESS_READ, 12);
  desc.writeUInt32LE(0, 16); // MiscFlags
  desc.writeUInt32LE(0, 20); // StructureByteStride
  const pp = Buffer.alloc(8);
  if (vcall(device, DEV_CREATE_BUFFER, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [desc.ptr!, null, pp.ptr!]) !== 0) {
    throw new Error('CreateBuffer (async readback staging) failed.');
  }
  const staging = pp.readBigUInt64LE(0);

  vcall(context, CTX_COPY_RESOURCE, [FFIType.u64, FFIType.u64], [staging, buffer], FFIType.void);
  vcall(context, CTX_FLUSH, [], [], FFIType.void);

  // The desc/pp Buffers above are dead before the first await; `mapped` is
  // re-referenced after every await, so nothing FFI-visible spans a GC window.
  const mapped = Buffer.alloc(16); // pData@0, RowPitch u32@8, DepthPitch u32@12
  for (;;) {
    const hr = vcall(context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [staging, 0, D3D11_MAP_READ, D3D11_MAP_FLAG_DO_NOT_WAIT, mapped.ptr!]);
    if (hr === 0) break;
    if (hr >>> 0 !== DXGI_ERROR_WAS_STILL_DRAWING) {
      comRelease(staging);
      throw new Error(`ID3D11DeviceContext::Map (async readback) failed: ${describeDeviceError(hr)}`);
    }
    await new Promise<void>((resolve) => {
      setImmediate(resolve);
    });
  }
  const dataPtr = mapped.readBigUInt64LE(0);
  const out = new Uint8Array(byteSize);
  out.set(new Uint8Array(toArrayBuffer(Number(dataPtr) as Pointer, 0, byteSize)));
  vcall(context, CTX_UNMAP, [FFIType.u64, FFIType.u32], [staging, 0], FFIType.void);
  comRelease(staging);
  return out.buffer;
}

/** Upload `data` into a DEFAULT-usage constant buffer via UpdateSubresource. */
export function updateConstantBuffer(buffer: bigint, data: Buffer): void {
  const { context } = requireGpu();
  vcall(context, CTX_UPDATE_SUBRESOURCE, [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], [buffer, 0, null, data.ptr!, 0, 0], FFIType.void);
}

/** Upload `data` into a DYNAMIC (cpuWritable) buffer via Map WRITE_DISCARD. */
export function updateDynamicBuffer(buffer: bigint, data: Buffer): void {
  const { context } = requireGpu();
  const mapped = Buffer.alloc(16); // pData@0, RowPitch u32@8, DepthPitch u32@12
  const hr = vcall(context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [buffer, 0, D3D11_MAP_WRITE_DISCARD, 0, mapped.ptr!]);
  if (hr !== 0) throw new Error(`Map (WRITE_DISCARD) failed: ${describeDeviceError(hr)}`);
  const dataPtr = Number(mapped.readBigUInt64LE(0)) as Pointer;
  new Uint8Array(toArrayBuffer(dataPtr, 0, data.byteLength)).set(data);
  vcall(context, CTX_UNMAP, [FFIType.u64, FFIType.u32], [buffer, 0], FFIType.void);
}
