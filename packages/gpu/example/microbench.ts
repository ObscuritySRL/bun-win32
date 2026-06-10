/**
 * Microbench — isolated hot-path timings for the performance-regression gate.
 *
 * Measures, with Bun.nanoseconds(), 200k+ warm-up, a dead-code sink, and the
 * median of 5 trials: vcall overhead on a trivial COM method, empty dispatch
 * submission, readbackBuffer ns/MB, run() one-shot vs reused-Kernel per-element
 * throughput (the compile-per-call gap), and cbufferLayout write. These numbers
 * feed .scratch/baseline-perf.txt and the S14.6 release gate.
 *
 * APIs demonstrated:
 * - vcall (raw COM invoke floor)
 * - Kernel / GpuArray / run (hot-loop vs one-shot gap)
 * - readbackBuffer (synchronous readback floor)
 * - cbufferLayout (uniform packing cost)
 *
 * Run: bun run example/microbench.ts
 */
import { DEV_GET_DEVICE_REMOVED_REASON, GpuArray, Kernel, cbufferLayout, comRelease, createComputeDevice, csSet, destroyDevice, dispatch, makeStructuredBuffer, readbackBuffer, run, vcall } from '@bun-win32/gpu';

let sink = 0;

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)]!;
}

function bench(name: string, perTrial: number, trials: number, unit: string, work: (iterations: number) => void): number {
  work(Math.max(1, Math.floor(perTrial / 4))); // warm-up
  const samples: number[] = [];
  for (let trial = 0; trial < trials; trial += 1) {
    const start = Bun.nanoseconds();
    work(perTrial);
    samples.push((Bun.nanoseconds() - start) / perTrial);
  }
  const value = median(samples);
  console.log(`${name}: ${value.toFixed(1)} ${unit}`);
  return value;
}

const gpu = createComputeDevice();
console.log(`microbench on ${gpu.gpuName} (${gpu.driver})\n`);

bench('vcall (GetDeviceRemovedReason)', 200_000, 5, 'ns/call', (iterations) => {
  for (let index = 0; index < iterations; index += 1) sink += vcall(gpu.device, DEV_GET_DEVICE_REMOVED_REASON, [], []);
});

{
  const kernel = new Kernel('RWStructuredBuffer<float> data : register(u0);\n[numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { data[id.x] = data[id.x]; }');
  const array = GpuArray.from(new Float32Array(64));
  kernel.dispatch({ data: array });
  void array.read();
  csSet(0n, { uav: [0n] });
  // Bind once, then measure pure Dispatch submissions (drained per trial by a readback).
  kernel.dispatch({ data: array });
  bench('empty dispatch (submission)', 20_000, 5, 'ns/dispatch', (iterations) => {
    for (let index = 0; index < iterations; index += 1) dispatch(1);
    void array.read();
  });
  bench('Kernel.dispatch (bind + submit)', 20_000, 5, 'ns/dispatch', (iterations) => {
    for (let index = 0; index < iterations; index += 1) kernel.dispatch({ data: array });
    void array.read();
  });
  array.release();
  kernel.release();
}

{
  const BYTES = 1024 * 1024;
  const source = makeStructuredBuffer({ count: BYTES / 4, srv: true, stride: 4 });
  void readbackBuffer(source.buffer, BYTES);
  const nsPerMb = bench('readbackBuffer 1 MB', 200, 5, 'ns/MB', (iterations) => {
    for (let index = 0; index < iterations; index += 1) sink += new Uint8Array(readbackBuffer(source.buffer, BYTES))[0]!;
  });
  console.log(`  → ${(1e9 / nsPerMb).toFixed(0)} MB/s sync readback`);
  comRelease(source.srv ?? 0n);
  comRelease(source.buffer);
}

{
  const N = 65_536;
  const SOURCE = 'RWStructuredBuffer<float> data : register(u0);\n[numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { data[id.x] = sqrt(data[id.x]); }';
  const oneShot = new Float32Array(N);
  const oneShotNs = bench('run() one-shot round trip', 30, 5, 'ns/call', (iterations) => {
    for (let index = 0; index < iterations; index += 1) run(SOURCE, { data: oneShot });
  });
  const kernel = new Kernel(SOURCE);
  const array = GpuArray.from(new Float32Array(N));
  const target = new Float32Array(N);
  const reusedNs = bench('reused Kernel+GpuArray round trip', 30, 5, 'ns/call', (iterations) => {
    for (let index = 0; index < iterations; index += 1) {
      kernel.dispatch({ data: array });
      array.readInto(target);
    }
  });
  console.log(`  → ${(oneShotNs / N).toFixed(2)} vs ${(reusedNs / N).toFixed(2)} ns/element; one-shot is ${(oneShotNs / reusedNs).toFixed(1)}× the reused-Kernel cost (the alloc-per-call gap)`);
  array.release();
  kernel.release();
}

{
  const layout = cbufferLayout({ count: 'uint', offset3: 'float3', scale: 'float' });
  const values = { count: 7, offset3: [1, 2, 3] as const, scale: 2.5 };
  bench('cbufferLayout write()', 200_000, 5, 'ns/op', (iterations) => {
    for (let index = 0; index < iterations; index += 1) sink += layout.write(values).byteLength;
  });
}

destroyDevice();
if (sink === Number.MIN_SAFE_INTEGER) console.log(String(sink)); // dead-code sink
