/**
 * Timing Showdown
 *
 * A head-to-head precision benchmark pitting multiple Windows timing APIs against
 * each other. Measures nanosecond-level resolution, jitter, and consistency across
 * three approaches: Ntdll's NtQueryPerformanceCounter, Kernel32's
 * QueryPerformanceCounter, and Ntdll's NtQuerySystemTime. Results are presented
 * as an ASCII "race" with bar charts and statistics.
 *
 * APIs demonstrated (Ntdll):
 *   - NtQueryPerformanceCounter    (NT-level high-resolution timer)
 *   - NtQuerySystemTime            (100-ns tick system clock)
 *   - NtQueryTimerResolution       (system timer resolution bounds)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - QueryPerformanceCounter      (Win32 high-resolution timer)
 *   - QueryPerformanceFrequency    (timer ticks-per-second)
 *
 * Run: bun run example/timing-showdown.ts
 */
import { ptr } from 'bun:ffi';
import Ntdll, { STATUS_SUCCESS } from '../index';
import Kernel32 from '@bun-win32/kernel32';

Ntdll.Preload(['NtQueryPerformanceCounter', 'NtQuerySystemTime', 'NtQueryTimerResolution']);
Kernel32.Preload(['QueryPerformanceCounter', 'QueryPerformanceFrequency']);

const ITERATIONS = 10_000;

// Get performance frequency (shared between Ntdll and Kernel32 counters)
const freqBuf = new ArrayBuffer(8);
Kernel32.QueryPerformanceFrequency(ptr(freqBuf));
const perfFreq = new DataView(freqBuf).getBigInt64(0, true);
const nsPerTick = Number(1_000_000_000n / perfFreq);

// Query timer resolution
const maxResBuf = new ArrayBuffer(4);
const minResBuf = new ArrayBuffer(4);
const curResBuf = new ArrayBuffer(4);
Ntdll.NtQueryTimerResolution(ptr(maxResBuf), ptr(minResBuf), ptr(curResBuf));
const maxResolution100ns = new DataView(maxResBuf).getUint32(0, true);
const minResolution100ns = new DataView(minResBuf).getUint32(0, true);
const curResolution100ns = new DataView(curResBuf).getUint32(0, true);

console.log(`
${'='.repeat(72)}
                   TIMING SHOWDOWN - Precision Benchmark
                      powered by @bun-win32/ntdll
${'='.repeat(72)}

  Performance Frequency:   ${perfFreq.toLocaleString()} Hz
  Nanoseconds per Tick:    ${nsPerTick} ns
  Timer Resolution (max):  ${(maxResolution100ns / 10).toLocaleString()} us (${maxResolution100ns} x 100ns)
  Timer Resolution (min):  ${(minResolution100ns / 10).toLocaleString()} us (${minResolution100ns} x 100ns)
  Timer Resolution (cur):  ${(curResolution100ns / 10).toLocaleString()} us (${curResolution100ns} x 100ns)
  Iterations per method:   ${ITERATIONS.toLocaleString()}
`);

interface BenchResult {
  name: string;
  samplesNs: number[];
  totalNs: number;
}

function computeStats(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / sorted.length;
  const median = sorted[Math.floor(sorted.length / 2)]!;
  const min = sorted[0]!;
  const max = sorted[sorted.length - 1]!;
  const p99 = sorted[Math.floor(sorted.length * 0.99)]!;
  const variance = sorted.reduce((a, v) => a + (v - mean) ** 2, 0) / sorted.length;
  const stdDev = Math.sqrt(variance);
  return { mean, median, min, max, p99, stdDev };
}

// Benchmark 1: Ntdll.NtQueryPerformanceCounter
function benchNtPerf(): BenchResult {
  const buf = new ArrayBuffer(8);
  const bufPtr = ptr(buf);
  const view = new DataView(buf);
  const samples: number[] = [];

  const startWall = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    Ntdll.NtQueryPerformanceCounter(bufPtr, null);
    const t1 = view.getBigInt64(0, true);
    Ntdll.NtQueryPerformanceCounter(bufPtr, null);
    const t2 = view.getBigInt64(0, true);
    const deltaNs = Number(t2 - t1) * nsPerTick;
    samples.push(deltaNs);
  }
  const endWall = performance.now();

  return { name: 'Ntdll.NtQueryPerformanceCounter', samplesNs: samples, totalNs: (endWall - startWall) * 1_000_000 };
}

// Benchmark 2: Kernel32.QueryPerformanceCounter
function benchK32Perf(): BenchResult {
  const buf = new ArrayBuffer(8);
  const bufPtr = ptr(buf);
  const view = new DataView(buf);
  const samples: number[] = [];

  const startWall = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    Kernel32.QueryPerformanceCounter(bufPtr);
    const t1 = view.getBigInt64(0, true);
    Kernel32.QueryPerformanceCounter(bufPtr);
    const t2 = view.getBigInt64(0, true);
    const deltaNs = Number(t2 - t1) * nsPerTick;
    samples.push(deltaNs);
  }
  const endWall = performance.now();

  return { name: 'Kernel32.QueryPerformanceCounter', samplesNs: samples, totalNs: (endWall - startWall) * 1_000_000 };
}

// Benchmark 3: Ntdll.NtQuerySystemTime
function benchNtSysTime(): BenchResult {
  const buf = new ArrayBuffer(8);
  const bufPtr = ptr(buf);
  const view = new DataView(buf);
  const samples: number[] = [];

  const startWall = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    Ntdll.NtQuerySystemTime(bufPtr);
    const t1 = view.getBigInt64(0, true);
    Ntdll.NtQuerySystemTime(bufPtr);
    const t2 = view.getBigInt64(0, true);
    // NtQuerySystemTime returns 100ns units
    const deltaNs = Number(t2 - t1) * 100;
    samples.push(deltaNs);
  }
  const endWall = performance.now();

  return { name: 'Ntdll.NtQuerySystemTime', samplesNs: samples, totalNs: (endWall - startWall) * 1_000_000 };
}

console.log('  Starting benchmark races...\n');

const results: BenchResult[] = [benchNtPerf(), benchK32Perf(), benchNtSysTime()];

// Find fastest method by average
const stats = results.map((r) => ({ ...r, stats: computeStats(r.samplesNs) }));
stats.sort((a, b) => a.stats.mean - b.stats.mean);

function formatNs(ns: number): string {
  if (ns < 1000) return `${ns.toFixed(1)} ns`;
  if (ns < 1_000_000) return `${(ns / 1000).toFixed(2)} us`;
  return `${(ns / 1_000_000).toFixed(2)} ms`;
}

function raceBar(value: number, maxValue: number, width: number, medal: string): string {
  const barLen = maxValue > 0 ? Math.max(1, Math.round((value / maxValue) * width)) : 1;
  return medal + ' ' + '\u2588'.repeat(barLen) + ' ' + formatNs(value);
}

const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
const maxMean = stats[stats.length - 1]!.stats.mean;

console.log(`${'─'.repeat(72)}`);
console.log('  THE RACE: Average time between consecutive reads (lower = better)\n');

for (let i = 0; i < stats.length; i++) {
  const s = stats[i]!;
  console.log(`  ${medals[i]} ${s.name}`);
  console.log(`     ${raceBar(s.stats.mean, maxMean, 40, '  ')}`);
  console.log();
}

console.log(`${'─'.repeat(72)}`);
console.log('  DETAILED STATISTICS\n');

for (const s of stats) {
  const st = s.stats;
  console.log(`  ${s.name}`);
  console.log(`    Mean:        ${formatNs(st.mean).padStart(14)}`);
  console.log(`    Median:      ${formatNs(st.median).padStart(14)}`);
  console.log(`    Min:         ${formatNs(st.min).padStart(14)}`);
  console.log(`    Max:         ${formatNs(st.max).padStart(14)}`);
  console.log(`    P99:         ${formatNs(st.p99).padStart(14)}`);
  console.log(`    Std Dev:     ${formatNs(st.stdDev).padStart(14)}`);
  console.log(`    Wall Time:   ${formatNs(s.totalNs).padStart(14)}`);
  console.log();
}

console.log(`${'─'.repeat(72)}`);
console.log('  VERDICT\n');

const winner = stats[0]!;
const loser = stats[stats.length - 1]!;
const speedup = loser.stats.mean / winner.stats.mean;

console.log(`  Winner:  ${winner.name}`);
console.log(`  Loser:   ${loser.name}`);
console.log(`  Speedup: ${speedup.toFixed(1)}x faster\n`);

if (winner.name.includes('Ntdll')) {
  console.log('  Going straight to the NT layer pays off!');
} else {
  console.log('  The Win32 wrapper holds its own against the raw NT call!');
}

console.log(`\n${'='.repeat(72)}`);
