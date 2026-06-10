// Standard kernel library — the reductions/scans/sorts gpu.js users asked for and
// never got. Every kernel is bounds-guarded (any N, not just powers of two) and
// proven against CPU references in example/std.selftest.ts on hardware AND WARP.

import { GpuArray, Kernel } from './kernel';

const SUM_SOURCE = `cbuffer Params : register(b0) { uint count; };
StructuredBuffer<float> data : register(t0);
RWStructuredBuffer<float> partialSums : register(u0);
groupshared float tile[256];
[numthreads(256,1,1)] void main(uint3 id : SV_DispatchThreadID, uint3 gid : SV_GroupID, uint3 tid : SV_GroupThreadID) {
  tile[tid.x] = id.x < count ? data[id.x] : 0.0;
  GroupMemoryBarrierWithGroupSync();
  for (uint stride = 128; stride > 0; stride >>= 1) {
    if (tid.x < stride) tile[tid.x] += tile[tid.x + stride];
    GroupMemoryBarrierWithGroupSync();
  }
  if (tid.x == 0) partialSums[gid.x] = tile[0];
}`;

const MATMUL_SOURCE = `cbuffer Params : register(b0) { uint n; };
StructuredBuffer<float> a : register(t0);
StructuredBuffer<float> b : register(t1);
RWStructuredBuffer<float> c : register(u0);
groupshared float tileA[16][16];
groupshared float tileB[16][16];
[numthreads(16,16,1)] void main(uint3 id : SV_DispatchThreadID, uint3 tid : SV_GroupThreadID) {
  float sum = 0;
  uint tiles = (n + 15) / 16;
  for (uint t = 0; t < tiles; t += 1) {
    uint aColumn = t * 16 + tid.x;
    uint bRow = t * 16 + tid.y;
    tileA[tid.y][tid.x] = (id.y < n && aColumn < n) ? a[id.y * n + aColumn] : 0.0;
    tileB[tid.y][tid.x] = (bRow < n && id.x < n) ? b[bRow * n + id.x] : 0.0;
    GroupMemoryBarrierWithGroupSync();
    [unroll] for (uint k = 0; k < 16; k += 1) sum += tileA[tid.y][k] * tileB[k][tid.x];
    GroupMemoryBarrierWithGroupSync();
  }
  if (id.x < n && id.y < n) c[id.y * n + id.x] = sum;
}`;

const HISTOGRAM_SOURCE = `cbuffer Params : register(b0) { uint count; uint bins; };
StructuredBuffer<uint> values : register(t0);
RWStructuredBuffer<uint> histogram : register(u0);
[numthreads(256,1,1)] void main(uint3 id : SV_DispatchThreadID) {
  if (id.x >= count) return;
  uint value = values[id.x];
  if (value < bins) InterlockedAdd(histogram[value], 1u);
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

const SORT_TRIM_SOURCE = `cbuffer Params : register(b0) { uint count; };
StructuredBuffer<uint> padded : register(t0);
RWStructuredBuffer<uint> trimmed : register(u0);
[numthreads(256,1,1)] void main(uint3 id : SV_DispatchThreadID) {
  if (id.x < count) trimmed[id.x] = padded[id.x];
}`;

/** Bin uint values into `bins` buckets with InterlockedAdd (values ≥ bins are ignored). Exact. */
export function gpuHistogram(values: GpuArray, bins: number): Uint32Array {
  if (values.kind !== 'uint') throw new Error(`gpuHistogram: values must be a uint GpuArray (got ${values.kind}).`);
  const kernel = new Kernel(HISTOGRAM_SOURCE);
  const histogram = GpuArray.from(new Uint32Array(bins));
  kernel.dispatch({ histogram, values }, { groups: [Math.ceil(values.length / 256)], uniforms: new Uint32Array([values.length, bins, 0, 0]) });
  const result = histogram.read();
  histogram.release();
  kernel.release();
  return new Uint32Array(result.buffer, 0, bins);
}

/** Square n×n matrix multiply (row-major float), 16×16 groupshared tiles, any n. Returns a new GpuArray (caller releases). */
export function gpuMatmul(a: GpuArray, b: GpuArray, n: number): GpuArray {
  if (a.kind !== 'float' || b.kind !== 'float') throw new Error('gpuMatmul: a and b must be float GpuArrays.');
  if (a.length < n * n || b.length < n * n) throw new Error(`gpuMatmul: n=${n} needs ${n * n} elements; a has ${a.length}, b has ${b.length}.`);
  const kernel = new Kernel(MATMUL_SOURCE);
  const c = GpuArray.alloc('float', n * n);
  const groups = Math.ceil(n / 16);
  kernel.dispatch({ a, b, c }, { groups: [groups, groups], uniforms: new Uint32Array([n, 0, 0, 0]) });
  kernel.release();
  return c;
}

/** Exclusive prefix scan over a uint GpuArray — any length (group totals recurse per 256× level). Returns a new GpuArray (caller releases). Exact. */
export function gpuPrefixScan(values: GpuArray): GpuArray {
  if (values.kind !== 'uint') throw new Error(`gpuPrefixScan: values must be a uint GpuArray (got ${values.kind}).`);
  const groups = Math.ceil(values.length / 256);
  const groupKernel = new Kernel(SCAN_GROUP_SOURCE);
  const exclusive = GpuArray.alloc('uint', values.length);
  const groupTotals = GpuArray.alloc('uint', groups);
  groupKernel.dispatch({ data: values, exclusive, groupTotals }, { groups: [groups], uniforms: new Uint32Array([values.length, 0, 0, 0]) });
  if (groups > 1) {
    const scannedTotals = gpuPrefixScan(groupTotals);
    const applyKernel = new Kernel(SCAN_APPLY_SOURCE);
    applyKernel.dispatch({ data: exclusive, groupOffsets: scannedTotals }, { groups: [groups], uniforms: new Uint32Array([values.length, 0, 0, 0]) });
    applyKernel.release();
    scannedTotals.release();
  }
  groupTotals.release();
  groupKernel.release();
  return exclusive;
}

/** Ascending bitonic sort of a uint GpuArray (pads to a power of two with 0xFFFFFFFF). Returns a new sorted GpuArray (caller releases). Exact. */
export function gpuSort(values: GpuArray): GpuArray {
  if (values.kind !== 'uint') throw new Error(`gpuSort: values must be a uint GpuArray (got ${values.kind}).`);
  let paddedLength = 1;
  while (paddedLength < values.length) paddedLength <<= 1;
  const padKernel = new Kernel(SORT_PAD_SOURCE);
  const padded = GpuArray.alloc('uint', paddedLength);
  padKernel.dispatch({ padded, source: values }, { groups: [Math.ceil(paddedLength / 256)], uniforms: new Uint32Array([values.length, 0, 0, 0]) });
  padKernel.release();
  const stepKernel = new Kernel(SORT_STEP_SOURCE);
  const groups = Math.ceil(paddedLength / 256);
  for (let k = 2; k <= paddedLength; k <<= 1) {
    for (let j = k >> 1; j > 0; j >>= 1) {
      stepKernel.dispatch({ data: padded }, { groups: [groups], uniforms: new Uint32Array([j, k, paddedLength, 0]) });
    }
  }
  stepKernel.release();
  const trimKernel = new Kernel(SORT_TRIM_SOURCE);
  const trimmed = GpuArray.alloc('uint', values.length);
  trimKernel.dispatch({ padded, trimmed }, { groups: [Math.ceil(values.length / 256)], uniforms: new Uint32Array([values.length, 0, 0, 0]) });
  trimKernel.release();
  padded.release();
  return trimmed;
}

/** Sum a float GpuArray via multi-pass groupshared tree reduction (any length). */
export function gpuSum(input: GpuArray): number {
  if (input.kind !== 'float') throw new Error(`gpuSum: input must be a float GpuArray (got ${input.kind}).`);
  const kernel = new Kernel(SUM_SOURCE);
  let current = input;
  let length = input.length;
  let owned = false;
  while (length > 1) {
    const groups = Math.ceil(length / 256);
    const partialSums = GpuArray.alloc('float', groups);
    kernel.dispatch({ data: current, partialSums }, { groups: [groups], uniforms: new Uint32Array([length, 0, 0, 0]) });
    if (owned) current.release();
    current = partialSums;
    owned = true;
    length = groups;
  }
  const total = current.read()[0]!;
  if (owned) current.release();
  kernel.release();
  return total;
}
