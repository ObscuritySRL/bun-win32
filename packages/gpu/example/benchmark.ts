/**
 * Benchmark — the README's numbers, printed as a markdown table, on hardware AND WARP.
 *
 * Measures kernel compile latency (cold/warm), empty-dispatch submission cost,
 * staging-readback bandwidth at 1/16/64 MB, 1M-element SAXPY throughput, 256×256
 * matmul GFLOPS (an inline device-capability kernel AND the exported gpuMatmul),
 * and the exported std kernels cold/warm — the cold/warm pair is the
 * compile-churn detector: warm must not pay FXC. Every figure comes from a real
 * run on this machine — the README quotes this table verbatim and never claims
 * numbers it didn't print.
 *
 * APIs demonstrated:
 * - createComputeDevice (forced hardware and forced WARP passes)
 * - compile (FXC latency)
 * - Kernel / GpuArray (dispatch throughput, SAXPY, matmul)
 * - makeStructuredBuffer / readbackBuffer (bandwidth)
 * - gpuSum / gpuMatmul / gpuHistogram / gpuSort / gpuPrefixScan (std kernels, exported surface)
 *
 * Run: bun run example/benchmark.ts
 */
import { type CreateDeviceOptions, GpuArray, Kernel, comRelease, compile, createComputeDevice, destroyDevice, gpuHistogram, gpuMatmul, gpuPrefixScan, gpuSort, gpuSum, makeStructuredBuffer, readbackBuffer } from '@bun-win32/gpu';

interface BenchmarkRow {
  metric: string;
  value: string;
}

function measure(options: CreateDeviceOptions): { device: string; rows: BenchmarkRow[] } {
  const gpu = createComputeDevice(options);
  const rows: BenchmarkRow[] = [];

  const KERNEL = `RWStructuredBuffer<float> data : register(u0);
[numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { data[id.x] = sqrt(data[id.x] * 2.0 + 1.0); }`;
  const coldStart = performance.now();
  void compile(KERNEL, 'main', 'cs_5_0');
  const coldMs = performance.now() - coldStart;
  const warmStart = performance.now();
  void compile(KERNEL, 'main', 'cs_5_0');
  const warmMs = performance.now() - warmStart;
  rows.push({ metric: 'kernel compile (cold / warm)', value: `${coldMs.toFixed(1)} ms / ${warmMs.toFixed(1)} ms` });

  {
    const kernel = new Kernel(KERNEL);
    const array = GpuArray.from(new Float32Array(64));
    kernel.dispatch({ data: array });
    void array.read();
    const DISPATCHES = 1000;
    const start = performance.now();
    for (let index = 0; index < DISPATCHES; index += 1) kernel.dispatch({ data: array });
    void array.read();
    const microseconds = ((performance.now() - start) / DISPATCHES) * 1000;
    rows.push({ metric: 'empty dispatch (avg of 1,000)', value: `${microseconds.toFixed(1)} µs` });
    array.release();
    kernel.release();
  }

  for (const megabytes of [1, 16, 64]) {
    const bytes = megabytes * 1024 * 1024;
    const source = makeStructuredBuffer({ count: bytes / 4, srv: true, stride: 4 });
    void readbackBuffer(source.buffer, bytes);
    const ITERATIONS = 5;
    const start = performance.now();
    for (let iteration = 0; iteration < ITERATIONS; iteration += 1) void readbackBuffer(source.buffer, bytes);
    const seconds = (performance.now() - start) / 1000 / ITERATIONS;
    rows.push({ metric: `readback ${megabytes} MB`, value: `${(megabytes / seconds).toFixed(0)} MB/s` });
    comRelease(source.srv ?? 0n);
    comRelease(source.buffer);
  }

  {
    const N = 1_000_000;
    const x = GpuArray.from(new Float32Array(N).fill(1.5));
    const y = GpuArray.from(new Float32Array(N).fill(2.0));
    const saxpy = new Kernel(
      `StructuredBuffer<float> x : register(t0);
       RWStructuredBuffer<float> y : register(u0);
       [numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { y[id.x] = 2.5 * x[id.x] + y[id.x]; }`,
    );
    saxpy.dispatch({ x, y });
    void y.read();
    const ITERATIONS = 200;
    const start = performance.now();
    for (let iteration = 0; iteration < ITERATIONS; iteration += 1) saxpy.dispatch({ x, y });
    void y.read();
    const seconds = (performance.now() - start) / 1000;
    rows.push({ metric: 'SAXPY 1M elements', value: `${((N * ITERATIONS) / seconds / 1e9).toFixed(2)} Gelem/s` });
    x.release();
    y.release();
    saxpy.release();
  }

  {
    const N = 256;
    const a = GpuArray.from(new Float32Array(N * N).fill(1.25));
    const b = GpuArray.from(new Float32Array(N * N).fill(0.75));
    const c = GpuArray.alloc('float', N * N);
    const matmul = new Kernel(
      `StructuredBuffer<float> a : register(t0);
       StructuredBuffer<float> b : register(t1);
       RWStructuredBuffer<float> c : register(u0);
       [numthreads(8,8,1)] void main(uint3 id : SV_DispatchThreadID) {
         float sum = 0;
         for (uint k = 0; k < N; k += 1) sum += a[id.y * N + k] * b[k * N + id.x];
         c[id.y * N + id.x] = sum;
       }`,
      { defines: { N } },
    );
    matmul.dispatch({ a, b, c }, { groups: [N / 8, N / 8] });
    void c.read();
    const ITERATIONS = 20;
    const start = performance.now();
    for (let iteration = 0; iteration < ITERATIONS; iteration += 1) matmul.dispatch({ a, b, c }, { groups: [N / 8, N / 8] });
    void c.read();
    const seconds = (performance.now() - start) / 1000;
    const gflops = (2 * N * N * N * ITERATIONS) / seconds / 1e9;
    rows.push({ metric: `matmul ${N}×${N}`, value: `${gflops.toFixed(1)} GFLOPS` });
    a.release();
    b.release();
    c.release();
    matmul.release();
  }

  {
    // The exported std kernels, cold then warm. Cold pays one FXC compile per
    // kernel (memoized per device); warm is pure dispatch+readback.
    const sumInput = GpuArray.from(new Float32Array(1_000_000).fill(0.5));
    const coldWarm = (work: () => void): [number, number] => {
      const coldStart = performance.now();
      work();
      const cold = performance.now() - coldStart;
      const warmStart = performance.now();
      work();
      const warm = performance.now() - warmStart;
      return [cold, warm];
    };
    const [sumCold, sumWarm] = coldWarm(() => void gpuSum(sumInput));
    rows.push({ metric: 'gpuSum 1M (cold / warm)', value: `${sumCold.toFixed(2)} ms / ${sumWarm.toFixed(2)} ms` });
    sumInput.release();

    const N = 256;
    const a = GpuArray.from(new Float32Array(N * N).fill(1.25));
    const b = GpuArray.from(new Float32Array(N * N).fill(0.75));
    let warmMatmulMs = 0;
    const [matmulCold] = coldWarm(() => {
      const start = performance.now();
      const c = gpuMatmul(a, b, N);
      void c.read();
      warmMatmulMs = performance.now() - start;
      c.release();
    });
    const matmulGflops = (2 * N * N * N) / (warmMatmulMs / 1000) / 1e9;
    rows.push({ metric: `gpuMatmul ${N}×${N} (cold / warm)`, value: `${matmulCold.toFixed(2)} ms / ${warmMatmulMs.toFixed(2)} ms (${matmulGflops.toFixed(0)} GFLOPS warm)` });
    a.release();
    b.release();

    const histogramElements = options.driver === 'warp' ? 4_000_000 : 16_000_000;
    const histogramValues = new Uint32Array(histogramElements);
    for (let index = 0; index < histogramElements; index += 1) histogramValues[index] = index & 0xff;
    const histogramInput = GpuArray.from(histogramValues);
    let warmHistogramMs = 0;
    coldWarm(() => {
      const start = performance.now();
      void gpuHistogram(histogramInput, 256);
      warmHistogramMs = performance.now() - start;
    });
    rows.push({ metric: 'gpuHistogram 256 bins (warm)', value: `${(histogramElements / 1e6 / (warmHistogramMs / 1000)).toFixed(0)} Melem/s @ ${histogramElements / 1e6}M` });
    histogramInput.release();

    const sortValues = new Uint32Array(1_000_000);
    for (let index = 0; index < sortValues.length; index += 1) sortValues[index] = (index * 2_654_435_761) >>> 0;
    const sortInput = GpuArray.from(sortValues);
    let warmSortMs = 0;
    coldWarm(() => {
      const start = performance.now();
      const sorted = gpuSort(sortInput);
      void sorted.read();
      warmSortMs = performance.now() - start;
      sorted.release();
    });
    const cpuSortStart = performance.now();
    void sortValues.slice().sort();
    const cpuSortMs = performance.now() - cpuSortStart;
    rows.push({ metric: 'gpuSort 1M (warm, incl. readback)', value: `${warmSortMs.toFixed(1)} ms (CPU sort ${cpuSortMs.toFixed(1)} ms)` });
    sortInput.release();

    const scanValues = new Uint32Array(1_000_000).fill(3);
    const scanInput = GpuArray.from(scanValues);
    let warmScanMs = 0;
    coldWarm(() => {
      const start = performance.now();
      const scanned = gpuPrefixScan(scanInput);
      void scanned.read();
      warmScanMs = performance.now() - start;
      scanned.release();
    });
    rows.push({ metric: 'gpuPrefixScan 1M (warm, incl. readback)', value: `${warmScanMs.toFixed(1)} ms` });
    scanInput.release();
  }

  const device = `${gpu.gpuName} (${gpu.driver})`;
  destroyDevice();
  return { device, rows };
}

const hardware = measure({});
const warp = measure({ driver: 'warp' });

console.log(`\n| Metric | ${hardware.device} | ${warp.device} |`);
console.log('|---|---|---|');
for (let index = 0; index < hardware.rows.length; index += 1) {
  console.log(`| ${hardware.rows[index]!.metric} | ${hardware.rows[index]!.value} | ${warp.rows[index]!.value} |`);
}
console.log();
