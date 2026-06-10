/**
 * Microbench — isolated hot-path timings for the performance-regression gate.
 *
 * Measures, with Bun.nanoseconds(), 200k+ warm-up, a dead-code sink, and the
 * median of 5 trials: vcall overhead on a trivial COM method, empty dispatch
 * submission, Kernel.dispatch with and without uniforms, GpuArray.write upload,
 * readbackBuffer sync + async ns/MB, run() one-shot vs reused-Kernel per-element
 * throughput, and cbufferLayout write/writeInto. These numbers feed
 * .scratch/baseline-perf.txt and the S14.6 release gate.
 *
 * Saturated Dispatch loops are driver-throughput bound (~130-200 ns floor on this
 * stack) — JS-side wins are invisible on that line once binds are elided.
 * Measured JSC negatives (do not re-litigate without new data): forEach→for-loop
 * ~1 ns; DataView/BigUint64Array handle writes lose to Buffer.writeBigUInt64LE;
 * #private-field guards, try/finally, and destructuring are noise; hoisting vcall
 * call-site arg literals REGRESSES under the spread-based invoker; number-typed
 * thisPtr into a u64 FFI arg is SLOWER than bigint.
 * Round-2 negatives: UpdateSubresource1 (flags=0 or D3D11_COPY_DISCARD), a ring of
 * DEFAULT cbuffers with per-dispatch rebind, and the D3D11.1 Map(WRITE_NO_OVERWRITE)
 * + CSSetConstantBuffers1 offset ring all measure equal-or-WORSE than plain
 * UpdateSubresource for per-dispatch uniforms (rings ~0.6-1.0 µs worse) even with
 * both D3D11_OPTIONS caps TRUE; run() pool/Map/record bookkeeping and the dispatch
 * extra-key for-in audit are invisible at the driver floor; fresh-vs-reused uniforms
 * typed arrays are indistinguishable; SINGLETHREADED/PREVENT_INTERNAL_THREADING
 * device flags are 1.00-1.04× (the vcall floor is FFI-bound, not lock-bound);
 * prefix-scan 16× coarsening is wall-neutral (readback-dominated); 4-bit LSD radix
 * sort loses to fused bitonic on cs_5_0 (no wave intrinsics); coarsening the GLOBAL
 * histogram fallback is 1.00× (atomic-bound). Evidence: .scratch/optim/r2-*.ts.
 *
 * APIs demonstrated:
 * - vcall (raw COM invoke floor)
 * - Kernel / GpuArray / run (hot-loop vs one-shot gap; uniforms dispatch; write upload)
 * - readbackBuffer / readbackBufferAsync (readback floors)
 * - cbufferLayout (uniform packing cost, write vs writeInto)
 *
 * Run: bun run example/microbench.ts
 */
import { DEV_GET_DEVICE_REMOVED_REASON, GpuArray, Kernel, cbufferLayout, comRelease, createComputeDevice, csSet, destroyDevice, dispatch, makeStructuredBuffer, readbackBuffer, readbackBufferAsync, run, vcall } from '@bun-win32/gpu';

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
  // Worst-case uniforms shape: a fresh 16-byte array per dispatch (measured equivalent to std.ts's reused stdUniforms scratch).
  const kernel = new Kernel('cbuffer Params : register(b0) { uint offset; };\nRWStructuredBuffer<float> data : register(u0);\n[numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { data[id.x] = data[id.x] + offset; }');
  const array = GpuArray.from(new Float32Array(64));
  kernel.dispatch({ data: array }, { uniforms: new Uint32Array(4) });
  bench('Kernel.dispatch + uniforms', 20_000, 5, 'ns/dispatch', (iterations) => {
    for (let index = 0; index < iterations; index += 1) kernel.dispatch({ data: array }, { uniforms: new Uint32Array([index, 0, 0, 0]) });
    void array.read();
  });
  array.release();
  kernel.release();
}

{
  const BYTES = 1024 * 1024;
  const payload = new Float32Array(BYTES / 4);
  const array = GpuArray.from(payload);
  array.write(payload);
  const nsPerWrite = bench('GpuArray.write 1 MB', 200, 5, 'ns/MB', (iterations) => {
    for (let index = 0; index < iterations; index += 1) array.write(payload);
    void array.read();
  });
  console.log(`  → ${(1e9 / nsPerWrite).toFixed(0)} MB/s upload`);
  array.release();
}

{
  const BYTES = 1024 * 1024;
  const source = makeStructuredBuffer({ count: BYTES / 4, srv: true, stride: 4 });
  void readbackBuffer(source.buffer, BYTES);
  const nsPerMb = bench('readbackBuffer 1 MB', 200, 5, 'ns/MB', (iterations) => {
    for (let index = 0; index < iterations; index += 1) sink += new Uint8Array(readbackBuffer(source.buffer, BYTES))[0]!;
  });
  console.log(`  → ${(1e9 / nsPerMb).toFixed(0)} MB/s sync readback`);
  void (await readbackBufferAsync(source.buffer, BYTES));
  const trials: number[] = [];
  for (let trial = 0; trial < 5; trial += 1) {
    const start = Bun.nanoseconds();
    for (let index = 0; index < 50; index += 1) sink += new Uint8Array(await readbackBufferAsync(source.buffer, BYTES))[0]!;
    trials.push((Bun.nanoseconds() - start) / 50);
  }
  const asyncNsPerMb = median(trials);
  console.log(`readbackBufferAsync 1 MB: ${asyncNsPerMb.toFixed(1)} ns/MB`);
  console.log(`  → ${(1e9 / asyncNsPerMb).toFixed(0)} MB/s async readback (serial await; the win is event-loop liveness, not speed)`);
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
  console.log(`  → ${(oneShotNs / N).toFixed(2)} vs ${(reusedNs / N).toFixed(2)} ns/element; one-shot is ${(oneShotNs / reusedNs).toFixed(1)}× the reused-Kernel cost (the semantic re-upload per call, not bookkeeping)`);
  array.release();
  kernel.release();
}

{
  const layout = cbufferLayout({ count: 'uint', offset3: 'float3', scale: 'float' });
  const values = { count: 7, offset3: [1, 2, 3] as const, scale: 2.5 };
  bench('cbufferLayout write()', 200_000, 5, 'ns/op', (iterations) => {
    for (let index = 0; index < iterations; index += 1) sink += layout.write(values).byteLength;
  });
  const scratch = Buffer.alloc(layout.byteSize);
  bench('cbufferLayout writeInto()', 200_000, 5, 'ns/op', (iterations) => {
    for (let index = 0; index < iterations; index += 1) sink += layout.writeInto(values, scratch).byteLength;
  });
}

destroyDevice();
if (sink === Number.MIN_SAFE_INTEGER) console.log(String(sink)); // dead-code sink
