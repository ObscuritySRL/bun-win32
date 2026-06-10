/**
 * Std kernel library selftest — every std.ts kernel against a CPU reference, over
 * randomized sizes including non-powers-of-two and multi-group lengths, on
 * hardware AND WARP.
 *
 * APIs demonstrated:
 * - gpuSum (multi-pass groupshared tree reduction)
 * - gpuMatmul (32×32 tiled, 2×2 register-blocked groupshared matrix multiply, bounds-guarded)
 * - gpuHistogram (InterlockedAdd binning, exact)
 * - gpuPrefixScan (exclusive uint scan, exact)
 * - gpuSort (bitonic uint sort, exact)
 *
 * Run: bun run example/std.selftest.ts
 */
import { type CreateDeviceOptions, GpuArray, createComputeDevice, destroyDevice, gpuHistogram, gpuMatmul, gpuPrefixScan, gpuSort, gpuSum } from '@bun-win32/gpu';

let passes = 0;
let failures = 0;

function check(name: string, condition: boolean, detail: string): void {
  if (condition) {
    passes += 1;
    console.log(`PASS ${name}: ${detail}`);
  } else {
    failures += 1;
    console.log(`FAIL ${name}: ${detail}`);
  }
}

function nextRandom(state: { value: number }): number {
  state.value = (state.value * 1664525 + 1013904223) >>> 0;
  return state.value;
}

function runSuite(label: string, options: CreateDeviceOptions): void {
  const gpu = createComputeDevice(options);
  const tag = (name: string): string => `${name} [${label}]`;
  console.log(`-- std suite on ${gpu.gpuName} (${gpu.driver}) --`);
  const state = { value: 0x5eed_1234 };

  for (const N of [1000, 250_000]) {
    const values = new Float32Array(N);
    for (let index = 0; index < N; index += 1) values[index] = (nextRandom(state) & 0xffff) / 0x1_0000;
    const array = GpuArray.from(values);
    const gpuTotal = gpuSum(array);
    array.release();
    let cpuTotal = 0;
    for (let index = 0; index < N; index += 1) cpuTotal += values[index]!;
    const relativeDelta = Math.abs(gpuTotal - cpuTotal) / cpuTotal;
    check(tag(`sum N=${N}`), relativeDelta < 1e-5, `gpu=${gpuTotal.toFixed(3)} cpu=${cpuTotal.toFixed(3)} relΔ=${relativeDelta.toExponential(2)}`);
  }

  for (const N of [64, 100]) {
    const a = new Float32Array(N * N);
    const b = new Float32Array(N * N);
    for (let index = 0; index < N * N; index += 1) {
      a[index] = ((nextRandom(state) & 0xff) - 128) / 64;
      b[index] = ((nextRandom(state) & 0xff) - 128) / 64;
    }
    const gpuA = GpuArray.from(a);
    const gpuB = GpuArray.from(b);
    const gpuC = gpuMatmul(gpuA, gpuB, N);
    const c = gpuC.read();
    gpuC.release();
    gpuB.release();
    gpuA.release();
    let maxDelta = 0;
    for (let row = 0; row < N; row += 1) {
      for (let column = 0; column < N; column += 1) {
        let sum = 0;
        for (let k = 0; k < N; k += 1) sum += a[row * N + k]! * b[k * N + column]!;
        const delta = Math.abs(sum - Number(c[row * N + column]));
        if (delta > maxDelta) maxDelta = delta;
      }
    }
    check(tag(`matmul ${N}×${N}${N % 16 === 0 ? '' : ' (non-multiple-of-16)'}`), maxDelta < 1e-3, `tiled groupshared vs CPU, max |Δ| = ${maxDelta.toExponential(2)}`);
  }

  {
    const N = 100_000;
    const BINS = 64;
    const values = new Uint32Array(N);
    for (let index = 0; index < N; index += 1) values[index] = nextRandom(state) % (BINS + 8); // some values ≥ BINS get ignored
    const array = GpuArray.from(values);
    const histogram = gpuHistogram(array, BINS);
    array.release();
    const reference = new Uint32Array(BINS);
    for (let index = 0; index < N; index += 1) if (values[index]! < BINS) reference[values[index]!] += 1;
    let exact = true;
    for (let bin = 0; bin < BINS; bin += 1) if (histogram[bin] !== reference[bin]) exact = false;
    check(tag(`histogram N=${N}`), exact, `${BINS} bins EXACT (out-of-range values ignored)`);
  }

  for (const N of [1000, 60_000, 1_000_000]) {
    const values = new Uint32Array(N);
    for (let index = 0; index < N; index += 1) values[index] = nextRandom(state) & 0x3ff;
    const array = GpuArray.from(values);
    const scanned = gpuPrefixScan(array);
    const result = scanned.read();
    scanned.release();
    array.release();
    let exact = true;
    let running = 0;
    for (let index = 0; index < N; index += 1) {
      if (result[index] !== running) {
        exact = false;
        break;
      }
      running += values[index]!;
    }
    check(tag(`prefix-scan N=${N}`), exact, 'exclusive uint scan EXACT vs running CPU total');
  }

  {
    const N = 10_000;
    const values = new Uint32Array(N);
    for (let index = 0; index < N; index += 1) values[index] = nextRandom(state);
    const array = GpuArray.from(values);
    const sorted = gpuSort(array);
    const result = sorted.read();
    sorted.release();
    array.release();
    const reference = new Uint32Array(values).sort();
    let exact = true;
    for (let index = 0; index < N; index += 1) if (result[index] !== reference[index]) exact = false;
    check(tag(`sort N=${N}`), exact, 'bitonic uint sort EXACT vs CPU sort (non-power-of-two length, 0xFFFFFFFF padding trimmed)');
  }

  destroyDevice();
}

runSuite('hardware', {});
runSuite('warp', { driver: 'warp' });

console.log(`\n${passes} passed, ${failures} failed`);
process.exitCode = failures > 0 ? 1 : 0;
