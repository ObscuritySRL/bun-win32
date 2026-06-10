// Standard kernel library — the reductions/scans/sorts gpu.js users asked for and
// never got. Every kernel is bounds-guarded (any N, not just powers of two) and
// proven against CPU references in example/std.selftest.ts on hardware AND WARP.
// Kernels are memoized per device (FXC compile costs 2-90 ms; the cache turns
// repeat calls into pure dispatch cost — gpuSum 1M measured 35× faster warm).

import { createComputeDevice, hasDevice, requireGpu } from './device';
import { GpuArray, Kernel, acquireRunArray, releaseRunArray } from './kernel';

// 16 elements per thread (window 4096, stride-256 coalesced loads) before the
// groupshared tree — the one-load-per-thread variant is launch/barrier-bound at
// ~60% of DRAM bandwidth (measured 599 vs 921 GB/s DRAM-cold, 5.9× cache-resident).
const SUM_SOURCE = `cbuffer Params : register(b0) { uint count; };
StructuredBuffer<float> data : register(t0);
RWStructuredBuffer<float> partialSums : register(u0);
groupshared float tile[256];
[numthreads(256,1,1)] void main(uint3 gid : SV_GroupID, uint3 tid : SV_GroupThreadID) {
  float sum = 0.0;
  uint base = gid.x * 4096 + tid.x;
  [unroll] for (uint i = 0; i < 16; i += 1) {
    uint index = base + i * 256;
    if (index < count) sum += data[index];
  }
  tile[tid.x] = sum;
  GroupMemoryBarrierWithGroupSync();
  for (uint stride = 128; stride > 0; stride >>= 1) {
    if (tid.x < stride) tile[tid.x] += tile[tid.x + stride];
    GroupMemoryBarrierWithGroupSync();
  }
  if (tid.x == 0) partialSums[gid.x] = tile[0];
}`;

// 2×2 register blocking on 32×32 tiles: 4 accumulators per thread reuse each
// groupshared load twice (2.84× measured at n=1024). The k loop is deliberately
// NOT [unroll]: identical GPU time, but FXC compile drops from ~348 ms to ~90 ms.
const MATMUL_SOURCE = `cbuffer Params : register(b0) { uint n; };
StructuredBuffer<float> a : register(t0);
StructuredBuffer<float> b : register(t1);
RWStructuredBuffer<float> c : register(u0);
groupshared float tileA[32][32];
groupshared float tileB[32][32];
[numthreads(16,16,1)] void main(uint3 gid : SV_GroupID, uint3 tid : SV_GroupThreadID) {
  uint rowBase = gid.y * 32;
  uint columnBase = gid.x * 32;
  float acc00 = 0, acc01 = 0, acc10 = 0, acc11 = 0;
  uint tiles = (n + 31) / 32;
  for (uint t = 0; t < tiles; t += 1) {
    [unroll] for (uint i = 0; i < 2; i += 1) {
      [unroll] for (uint j = 0; j < 2; j += 1) {
        uint r = tid.y * 2 + i;
        uint s = tid.x * 2 + j;
        uint aRow = rowBase + r;
        uint aColumn = t * 32 + s;
        uint bRow = t * 32 + r;
        uint bColumn = columnBase + s;
        tileA[r][s] = (aRow < n && aColumn < n) ? a[aRow * n + aColumn] : 0.0;
        tileB[r][s] = (bRow < n && bColumn < n) ? b[bRow * n + bColumn] : 0.0;
      }
    }
    GroupMemoryBarrierWithGroupSync();
    for (uint k = 0; k < 32; k += 1) {
      float a0 = tileA[tid.y * 2][k];
      float a1 = tileA[tid.y * 2 + 1][k];
      float b0 = tileB[k][tid.x * 2];
      float b1 = tileB[k][tid.x * 2 + 1];
      acc00 += a0 * b0;
      acc01 += a0 * b1;
      acc10 += a1 * b0;
      acc11 += a1 * b1;
    }
    GroupMemoryBarrierWithGroupSync();
  }
  uint row = rowBase + tid.y * 2;
  uint column = columnBase + tid.x * 2;
  if (row < n && column < n) c[row * n + column] = acc00;
  if (row < n && column + 1 < n) c[row * n + column + 1] = acc01;
  if (row + 1 < n && column < n) c[(row + 1) * n + column] = acc10;
  if (row + 1 < n && column + 1 < n) c[(row + 1) * n + column + 1] = acc11;
}`;

// Global-atomic fallback for bins above the groupshared threshold (coarsening this
// one is a measured wash — it is atomic-bound, not launch-bound).
const HISTOGRAM_SOURCE = `cbuffer Params : register(b0) { uint count; uint bins; };
StructuredBuffer<uint> values : register(t0);
RWStructuredBuffer<uint> histogram : register(u0);
[numthreads(256,1,1)] void main(uint3 id : SV_DispatchThreadID) {
  if (id.x >= count) return;
  uint value = values[id.x];
  if (value < bins) InterlockedAdd(histogram[value], 1u);
}`;

// Per-group privatized histogram, 16 elements per thread (window 4096): local
// atomics in groupshared, one global InterlockedAdd per non-zero bin per group.
// Privatization beats global atomics 2.6-139×; the 16× coarsening amortizes the
// zero/flush loops over 4096 elements (13.9× measured at 16M/256 on top of
// privatization, exact on both drivers). 4096 bins = 16 KB groupshared (SM5 max 32 KB).
const HISTOGRAM_PRIVATIZED_SOURCE = `cbuffer Params : register(b0) { uint count; uint bins; };
StructuredBuffer<uint> values : register(t0);
RWStructuredBuffer<uint> histogram : register(u0);
groupshared uint localHistogram[4096];
[numthreads(256,1,1)] void main(uint3 gid : SV_GroupID, uint3 tid : SV_GroupThreadID) {
  for (uint zeroBin = tid.x; zeroBin < bins; zeroBin += 256) localHistogram[zeroBin] = 0u;
  GroupMemoryBarrierWithGroupSync();
  uint base = gid.x * 4096 + tid.x;
  [unroll] for (uint i = 0; i < 16; i += 1) {
    uint index = base + i * 256;
    if (index < count) {
      uint value = values[index];
      if (value < bins) InterlockedAdd(localHistogram[value], 1u);
    }
  }
  GroupMemoryBarrierWithGroupSync();
  for (uint flushBin = tid.x; flushBin < bins; flushBin += 256) {
    uint total = localHistogram[flushBin];
    if (total > 0u) InterlockedAdd(histogram[flushBin], total);
  }
}`;

const SCAN_GROUP_SOURCE = `cbuffer Params : register(b0) { uint count; };
StructuredBuffer<uint> data : register(t0);
RWStructuredBuffer<uint> exclusive : register(u0);
RWStructuredBuffer<uint> groupTotals : register(u1);
groupshared uint tile[256];
[numthreads(256,1,1)] void main(uint3 id : SV_DispatchThreadID, uint3 gid : SV_GroupID, uint3 tid : SV_GroupThreadID) {
  uint self = id.x < count ? data[id.x] : 0u;
  tile[tid.x] = self;
  GroupMemoryBarrierWithGroupSync();
  for (uint offset = 1; offset < 256; offset <<= 1) {
    uint addend = tid.x >= offset ? tile[tid.x - offset] : 0u;
    GroupMemoryBarrierWithGroupSync();
    tile[tid.x] += addend;
    GroupMemoryBarrierWithGroupSync();
  }
  if (id.x < count) exclusive[id.x] = tile[tid.x] - self;
  if (tid.x == 255) groupTotals[gid.x] = tile[255];
}`;

const SCAN_APPLY_SOURCE = `cbuffer Params : register(b0) { uint count; };
StructuredBuffer<uint> groupOffsets : register(t0);
RWStructuredBuffer<uint> data : register(u0);
[numthreads(256,1,1)] void main(uint3 id : SV_DispatchThreadID, uint3 gid : SV_GroupID) {
  if (id.x < count) data[id.x] += groupOffsets[gid.x];
}`;

const SORT_PAD_SOURCE = `cbuffer Params : register(b0) { uint count; };
StructuredBuffer<uint> source : register(t0);
RWStructuredBuffer<uint> padded : register(u0);
[numthreads(256,1,1)] void main(uint3 id : SV_DispatchThreadID) {
  padded[id.x] = id.x < count ? source[id.x] : 0xffffffffu;
}`;

const SORT_STEP_SOURCE = `cbuffer Params : register(b0) { uint j; uint k; uint paddedCount; };
RWStructuredBuffer<uint> data : register(u0);
[numthreads(256,1,1)] void main(uint3 id : SV_DispatchThreadID) {
  uint i = id.x;
  uint partner = i ^ j;
  if (i >= paddedCount || partner <= i || partner >= paddedCount) return;
  uint left = data[i];
  uint right = data[partner];
  bool ascending = (i & k) == 0;
  if ((ascending && left > right) || (!ascending && left < right)) {
    data[i] = right;
    data[partner] = left;
  }
}`;

// All j ≤ 128 steps of one k-phase fused into a single groupshared dispatch — one
// global read+write per element instead of one per step (partners stay inside a
// 256-aligned block for j < 256; only the lower thread of each pair swaps).
const SORT_LOCAL_SOURCE = `cbuffer Params : register(b0) { uint jStart; uint k; uint paddedCount; };
RWStructuredBuffer<uint> data : register(u0);
groupshared uint tile[256];
[numthreads(256,1,1)] void main(uint3 id : SV_DispatchThreadID, uint3 tid : SV_GroupThreadID) {
  tile[tid.x] = id.x < paddedCount ? data[id.x] : 0xffffffffu;
  GroupMemoryBarrierWithGroupSync();
  for (uint j = jStart; j > 0; j >>= 1) {
    uint partner = tid.x ^ j;
    if (partner > tid.x) {
      uint left = tile[tid.x];
      uint right = tile[partner];
      bool ascending = (id.x & k) == 0;
      if ((ascending && left > right) || (!ascending && left < right)) {
        tile[tid.x] = right;
        tile[partner] = left;
      }
    }
    GroupMemoryBarrierWithGroupSync();
  }
  if (id.x < paddedCount) data[id.x] = tile[tid.x];
}`;

const SORT_TRIM_SOURCE = `cbuffer Params : register(b0) { uint count; };
StructuredBuffer<uint> padded : register(t0);
RWStructuredBuffer<uint> trimmed : register(u0);
[numthreads(256,1,1)] void main(uint3 id : SV_DispatchThreadID) {
  if (id.x < count) trimmed[id.x] = padded[id.x];
}`;

// Memoized per (source, device) — mirrors run()'s kernel cache. Recursion levels
// (gpuPrefixScan) safely share one cached kernel and its constant buffer because
// dispatch consumes uniforms synchronously via UpdateSubresource.
const stdKernelCache = new Map<string, { device: bigint; kernel: Kernel }>();

// Reused uniforms scratch — every std cbuffer fits 16 bytes; dispatch consumes it
// synchronously, so set the fields immediately before each dispatch.
const stdUniforms = new Uint32Array(4);

// Internal scratch GpuArrays come from run()'s shared pool (acquireRunArray creates
// scope-suppressed — a pooled internal must never be released by a user's gpuScope).
// Warm std calls therefore allocate zero GPU resources; pooled internals stay live
// until flushRunCache/destroyDevice, exactly like run()'s own pool.
const histogramZeros = new Map<number, Uint32Array>();
const sumResult = new Float32Array(1);

function stdKernel(source: string): Kernel {
  if (!hasDevice()) createComputeDevice();
  const device = requireGpu().device;
  let entry = stdKernelCache.get(source);
  if (entry === undefined || entry.device !== device) {
    if (entry !== undefined) entry.kernel.release();
    entry = { device, kernel: new Kernel(source) };
    stdKernelCache.set(source, entry);
  }
  return entry.kernel;
}

/** Release the memoized std kernels (destroyDevice does this automatically). */
export function flushStdKernelCache(): void {
  for (const entry of stdKernelCache.values()) entry.kernel.release();
  stdKernelCache.clear();
}

/** Bin uint values into `bins` buckets with InterlockedAdd (values ≥ bins are ignored). Exact. */
export function gpuHistogram(values: GpuArray, bins: number): Uint32Array {
  if (values.kind !== 'uint') throw new Error(`gpuHistogram: values must be a uint GpuArray (got ${values.kind}).`);
  if (!hasDevice()) createComputeDevice();
  // The coarsened privatized kernel wins in every measured cell on BOTH drivers up
  // to 4096 bins (the old WARP-1024 special case lost 1.8-3.4× once coarsened).
  const privatized = bins <= 4096;
  const kernel = stdKernel(privatized ? HISTOGRAM_PRIVATIZED_SOURCE : HISTOGRAM_SOURCE);
  const histogram = acquireRunArray('uint', bins);
  let zeros = histogramZeros.get(bins);
  if (zeros === undefined) {
    zeros = new Uint32Array(bins);
    histogramZeros.set(bins, zeros);
  }
  histogram.write(zeros);
  stdUniforms[0] = values.length;
  stdUniforms[1] = bins;
  kernel.dispatch({ histogram, values }, { groups: [Math.ceil(values.length / (privatized ? 4096 : 256))], uniforms: stdUniforms });
  const result = histogram.readInto(new Uint32Array(bins));
  releaseRunArray(histogram);
  return result;
}

/** Square n×n matrix multiply (row-major float), 32×32 tiles with 2×2 register blocking, any n. Returns a new GpuArray (caller releases). */
export function gpuMatmul(a: GpuArray, b: GpuArray, n: number): GpuArray {
  if (a.kind !== 'float' || b.kind !== 'float') throw new Error('gpuMatmul: a and b must be float GpuArrays.');
  if (a.length < n * n || b.length < n * n) throw new Error(`gpuMatmul: n=${n} needs ${n * n} elements; a has ${a.length}, b has ${b.length}.`);
  const kernel = stdKernel(MATMUL_SOURCE);
  const c = GpuArray.alloc('float', n * n);
  const groups = Math.ceil(n / 32);
  stdUniforms[0] = n;
  kernel.dispatch({ a, b, c }, { groups: [groups, groups], uniforms: stdUniforms });
  return c;
}

// The recursion body: scan `values` into the caller-provided `exclusive` so every
// intermediate level draws from the pool (only the public result is user-owned).
function scanInto(values: GpuArray, exclusive: GpuArray): void {
  const groups = Math.ceil(values.length / 256);
  const groupKernel = stdKernel(SCAN_GROUP_SOURCE);
  const groupTotals = acquireRunArray('uint', groups);
  stdUniforms[0] = values.length;
  groupKernel.dispatch({ data: values, exclusive, groupTotals }, { groups: [groups], uniforms: stdUniforms });
  if (groups > 1) {
    const scannedTotals = acquireRunArray('uint', groups);
    scanInto(groupTotals, scannedTotals);
    const applyKernel = stdKernel(SCAN_APPLY_SOURCE);
    stdUniforms[0] = values.length;
    applyKernel.dispatch({ data: exclusive, groupOffsets: scannedTotals }, { groups: [groups], uniforms: stdUniforms });
    releaseRunArray(scannedTotals);
  }
  releaseRunArray(groupTotals);
}

/** Exclusive prefix scan over a uint GpuArray — any length (group totals recurse per 256× level). Returns a new GpuArray (caller releases). Exact. */
export function gpuPrefixScan(values: GpuArray): GpuArray {
  if (values.kind !== 'uint') throw new Error(`gpuPrefixScan: values must be a uint GpuArray (got ${values.kind}).`);
  const exclusive = GpuArray.alloc('uint', values.length);
  scanInto(values, exclusive);
  return exclusive;
}

/** Ascending bitonic sort of a uint GpuArray (pads to a power of two with 0xFFFFFFFF). Returns a new sorted GpuArray (caller releases). Exact. */
export function gpuSort(values: GpuArray): GpuArray {
  if (values.kind !== 'uint') throw new Error(`gpuSort: values must be a uint GpuArray (got ${values.kind}).`);
  let paddedLength = 1;
  while (paddedLength < values.length) paddedLength <<= 1;
  // Power-of-two inputs: the working buffer IS the exact-size result — allocate it
  // as the returned (scope-registered) array and skip the trim pass entirely.
  const exact = paddedLength === values.length;
  const padKernel = stdKernel(SORT_PAD_SOURCE);
  const padded = exact ? GpuArray.alloc('uint', paddedLength) : acquireRunArray('uint', paddedLength);
  stdUniforms[0] = values.length;
  padKernel.dispatch({ padded, source: values }, { groups: [Math.ceil(paddedLength / 256)], uniforms: stdUniforms });
  const stepKernel = stdKernel(SORT_STEP_SOURCE);
  const localKernel = stdKernel(SORT_LOCAL_SOURCE);
  const groups = Math.ceil(paddedLength / 256);
  for (let k = 2; k <= paddedLength; k <<= 1) {
    let j = k >> 1;
    for (; j >= 256; j >>= 1) {
      stdUniforms[0] = j;
      stdUniforms[1] = k;
      stdUniforms[2] = paddedLength;
      stepKernel.dispatch({ data: padded }, { groups: [groups], uniforms: stdUniforms });
    }
    stdUniforms[0] = j;
    stdUniforms[1] = k;
    stdUniforms[2] = paddedLength;
    localKernel.dispatch({ data: padded }, { groups: [groups], uniforms: stdUniforms });
  }
  if (exact) return padded;
  const trimKernel = stdKernel(SORT_TRIM_SOURCE);
  const trimmed = GpuArray.alloc('uint', values.length);
  stdUniforms[0] = values.length;
  trimKernel.dispatch({ padded, trimmed }, { groups: [Math.ceil(values.length / 256)], uniforms: stdUniforms });
  releaseRunArray(padded);
  return trimmed;
}

/** Sum a float GpuArray via 16×-coarsened multi-pass groupshared tree reduction (any length). */
export function gpuSum(input: GpuArray): number {
  if (input.kind !== 'float') throw new Error(`gpuSum: input must be a float GpuArray (got ${input.kind}).`);
  const kernel = stdKernel(SUM_SOURCE);
  let current = input;
  let length = input.length;
  let owned = false;
  while (length > 1) {
    const groups = Math.ceil(length / 4096);
    const partialSums = acquireRunArray('float', groups);
    stdUniforms[0] = length;
    kernel.dispatch({ data: current, partialSums }, { groups: [groups], uniforms: stdUniforms });
    if (owned) releaseRunArray(current);
    current = partialSums;
    owned = true;
    length = groups;
  }
  const total = owned ? current.readInto(sumResult)[0]! : current.read()[0]!;
  if (owned) releaseRunArray(current);
  return total;
}
