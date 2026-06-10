/**
 * benchmark — the README's numbers, produced on this machine.
 *
 * Median wall-clock of every headline call over 1000 iterations (kilohertz-class metrics),
 * the sustained CPU-sampling rate with this process's own CPU%, and the honest comparison:
 * ONE PowerShell `Get-CimInstance Win32_Process` spawn — the per-sample price the
 * wmic-era cluster pays — measured on the same box. Run twice; numbers are stable ~20%.
 *
 * APIs demonstrated:
 * - processes, pidStats, memory, cpuTimes, tcpSockets, monotonicMicroseconds (timed calls)
 * - CpuSampler + createTicker (the sustained-rate claim)
 *
 * Run: bun run example/benchmark.ts
 */
import { CpuSampler, cpuLayout, cpuTimes, createTicker, memory, monotonicMicroseconds, pidStats, processes, tcpSockets } from '@bun-win32/sysmon';

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]!;
}

function time(label: string, fn: () => void, iterations: number): { label: string; medianMicroseconds: number } {
  for (let i = 0; i < 50; i += 1) fn();
  const samples: number[] = [];
  for (let i = 0; i < iterations; i += 1) {
    const startedAt = monotonicMicroseconds();
    fn();
    samples.push(monotonicMicroseconds() - startedAt);
  }
  return { label, medianMicroseconds: median(samples) };
}

console.log('benchmark: timing the headline calls (1000 iterations each)…');
const rows = [
  time('memory()', () => void memory(), 1_000),
  time('cpuTimes()', () => void cpuTimes(), 1_000),
  time('tcpSockets()', () => void tcpSockets(), 1_000),
  time('processes()', () => void processes(), 1_000),
  time('pidStats(pid)', () => void pidStats(process.pid), 1_000),
];

const sampler = new CpuSampler();
const ticker = createTicker(1);
void sampler.sample();
const cpuBefore = process.cpuUsage();
const rateStart = monotonicMicroseconds();
let ticks = 0;
while (monotonicMicroseconds() - rateStart < 2_000_000) {
  ticker.wait();
  void sampler.sample();
  ticks += 1;
}
const rateMicroseconds = monotonicMicroseconds() - rateStart;
const cpuAfter = process.cpuUsage(cpuBefore);
ticker.dispose();
const sustainedHz = (ticks / rateMicroseconds) * 1_000_000;
const ownCpuPercent = ((cpuAfter.user + cpuAfter.system) / rateMicroseconds) * 100;

console.log('benchmark: spawning powershell.exe Get-CimInstance Win32_Process ONCE (the per-sample cost of the wmic-era cluster)…');
const spawnStart = monotonicMicroseconds();
const powershell = Bun.spawnSync(['powershell.exe', '-NoProfile', '-Command', 'Get-CimInstance Win32_Process | Measure-Object | Select-Object -ExpandProperty Count']);
const spawnMicroseconds = monotonicMicroseconds() - spawnStart;
const spawnWorked = powershell.exitCode === 0 && Number(powershell.stdout.toString().trim()) > 10;

console.log(`\nmachine: ${Bun.env.PROCESSOR_IDENTIFIER ?? 'unknown'} · ${cpuLayout().logicalProcessorCount} logical cores · Windows build ${(await import('@bun-win32/sysmon')).osInfo().build} · Bun ${Bun.version}\n`);
console.log('| call | median latency |');
console.log('|------|---------------:|');
for (const row of rows) console.log(`| \`${row.label}\` | ${row.medianMicroseconds < 1_000 ? `${row.medianMicroseconds.toFixed(1)} µs` : `${(row.medianMicroseconds / 1_000).toFixed(2)} ms`} |`);
console.log(`| sustained \`CpuSampler\` rate | ${sustainedHz.toFixed(0)} Hz @ ${ownCpuPercent.toFixed(1)}% own CPU |`);
if (spawnWorked) {
  console.log(`| **one** \`powershell Get-CimInstance Win32_Process\` spawn | **${(spawnMicroseconds / 1_000).toFixed(0)} ms** |`);
  const processesRow = rows.find((row) => row.label === 'processes()')!;
  console.log(`\nprocesses() is ${Math.round(spawnMicroseconds / processesRow.medianMicroseconds)}× faster than the spawn the wmic-era cluster pays per sample.`);
} else {
  console.log('| powershell spawn comparison | (spawn failed on this box — see exit code) |');
}
