/**
 * Benchmark — the README's numbers, printed as a markdown table, on hardware AND WARP.
 *
 * Measures kernel compile latency (cold/warm), empty-dispatch submission cost,
 * staging-readback bandwidth at 1/16/64 MB, 1M-element SAXPY throughput, and
 * 256×256 matmul GFLOPS. Every figure comes from a real run on this machine —
 * the README quotes this table verbatim and never claims numbers it didn't print.
 *
 * APIs demonstrated:
 * - createComputeDevice (forced hardware and forced WARP passes)
 * - compile (FXC latency)
 * - Kernel / GpuArray (dispatch throughput, SAXPY, matmul)
 * - makeStructuredBuffer / readbackBuffer (bandwidth)
 *
 * Run: bun run example/benchmark.ts
 */
import { type CreateDeviceOptions, GpuArray, Kernel, comRelease, compile, createComputeDevice, destroyDevice, makeStructuredBuffer, readbackBuffer } from '@bun-win32/gpu';

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
