/**
 * taskman — a task-manager-in-the-terminal with kilohertz-class CPU sampling.
 *
 * Renders ~30 fps while an inner high-resolution ticker loop keeps sampling per-core CPU
 * between frames (~700 Hz sustained on the waitable timer — async sleeps would cap it at
 * ~60 Hz). The HUD prints the ACHIEVED sample rate and this process's own CPU% — the
 * measured answer to "a 1 Hz systeminformation loop pegs a core" (si#626). The process
 * table refreshes at 2 Hz (the class-5 snapshot costs ~4 ms on a 450-process box).
 *
 * APIs demonstrated:
 * - CpuSampler, ProcessSampler, NetSampler, createTicker (high-rate sampling engines)
 * - memory, tcpSockets, osInfo, uptimeMs, pidStats (header metrics)
 * - @bun-win32/terminal runText/CharTerm (cross-package, example-only: the TTY engine)
 *
 * Run: bun run example/taskman.ts            (ESC or Ctrl-C quits; DEMO_DURATION_MS honored)
 */
import { runText } from '@bun-win32/terminal';
import { CpuSampler, NetSampler, ProcessSampler, type ProcessSample, createTicker, memory, monotonicMicroseconds, osInfo, pidStats, tcpSockets, uptimeMs } from '@bun-win32/sysmon';

const cpuSampler = new CpuSampler();
const processSampler = new ProcessSampler();
const netSampler = new NetSampler();
const ticker = createTicker(1);
const os = osInfo();

let perCore: number[] = [];
let totalBusy = 0;
let topRows: ProcessSample[] = [];
let memoryLoad = 0;
let availableGigabytes = 0;
let tcpCount = 0;
let inKilobytesPerSecond = 0;
let outKilobytesPerSecond = 0;
let achievedHz = 0;
let ownCpuPercent = 0;
let sampleCount = 0;
let lastRateStamp = monotonicMicroseconds();
let lastSlowStamp = 0;
let peakHz = 0;

function barRow(width: number, fraction: number): string {
  const filled = Math.round(Math.max(0, Math.min(1, fraction)) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)}G`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(0)}M`;
  return `${(bytes / 1024).toFixed(0)}K`;
}

await runText({
  title: 'bun-sysmon taskman',
  onKey: (key) => {
    if (key === 'esc') process.exit(0);
  },
  frame: (surface, time) => {
    // Inner kilohertz sampling burst: keep sampling on the 1 ms ticker for most of this
    // frame's budget; the renderer gets what is left. This is real sampling, not decoration.
    const frameDeadline = monotonicMicroseconds() + 24_000;
    while (monotonicMicroseconds() < frameDeadline) {
      ticker.wait();
      const sample = cpuSampler.sample();
      perCore = sample.perCore;
      totalBusy = sample.total;
      sampleCount += 1;
    }
    const now = monotonicMicroseconds();
    if (now - lastRateStamp >= 1_000_000) {
      achievedHz = (sampleCount / (now - lastRateStamp)) * 1_000_000;
      peakHz = Math.max(peakHz, achievedHz);
      sampleCount = 0;
      lastRateStamp = now;
      ownCpuPercent = pidStats(process.pid).cpu;
    }
    if (time - lastSlowStamp >= 0.5 || lastSlowStamp === 0) {
      lastSlowStamp = time;
      topRows = processSampler.sample(14);
      const ram = memory();
      memoryLoad = ram.memoryLoadPercent;
      availableGigabytes = Number(ram.availablePhysicalBytes) / 1024 ** 3;
      tcpCount = tcpSockets().length;
      const rates = netSampler.sample();
      inKilobytesPerSecond = rates.reduce((sum, rate) => sum + rate.inBytesPerSecond, 0) / 1024;
      outKilobytesPerSecond = rates.reduce((sum, rate) => sum + rate.outBytesPerSecond, 0) / 1024;
    }

    surface.clear(8, 10, 16);
    const columns = surface.columns;
    surface.text(1, 0, ` bun-sysmon taskman · Windows ${os.major}.${os.minor}.${os.build} · up ${(uptimeMs() / 3_600_000).toFixed(1)} h `, [255, 255, 255], [30, 60, 120], true);
    surface.text(
      1,
      1,
      `sampling ${achievedHz.toFixed(0)} Hz (peak ${peakHz.toFixed(0)}) · own CPU ${ownCpuPercent.toFixed(1)}% · RAM ${memoryLoad}% (${availableGigabytes.toFixed(1)} GB free) · TCP ${tcpCount} · net ↓${inKilobytesPerSecond.toFixed(0)} ↑${outKilobytesPerSecond.toFixed(0)} KB/s`,
      [150, 220, 255],
    );

    const coreRows = Math.ceil(perCore.length / 2);
    const half = Math.floor((columns - 4) / 2);
    const barWidth = half - 9;
    for (let core = 0; core < perCore.length; core += 1) {
      const column = core < coreRows ? 1 : 2 + half;
      const row = 3 + (core % coreRows);
      const busy = perCore[core]!;
      const tint: [number, number, number] = busy > 0.85 ? [255, 80, 60] : busy > 0.5 ? [255, 200, 80] : [90, 230, 140];
      surface.text(column, row, `${String(core).padStart(2)} `, [120, 130, 150]);
      surface.text(column + 3, row, barRow(barWidth, busy), tint);
      surface.text(column + 3 + barWidth, row, ` ${(busy * 100).toFixed(0).padStart(3)}%`, tint);
    }
    const totalRow = 3 + coreRows;
    surface.text(1, totalRow, `ALL ${barRow(columns - 12, totalBusy)} ${(totalBusy * 100).toFixed(0).padStart(3)}%`, [120, 200, 255], undefined, true);

    const tableTop = totalRow + 2;
    surface.text(1, tableTop, '  PID    CPU%      MEM  NAME', [180, 190, 210], undefined, true);
    for (let i = 0; i < topRows.length && tableTop + 1 + i < surface.rows - 1; i += 1) {
      const rowData = topRows[i]!;
      const tint: [number, number, number] = rowData.cpuPercent > 10 ? [255, 120, 90] : [210, 220, 235];
      surface.text(1, tableTop + 1 + i, `${String(rowData.pid).padStart(6)} ${rowData.cpuPercent.toFixed(1).padStart(6)} ${formatBytes(rowData.workingSetBytes).padStart(8)}  ${rowData.name.slice(0, columns - 26)}`, tint);
    }
  },
});

console.log(`taskman: sustained ${achievedHz.toFixed(0)} Hz CPU sampling (peak ${peakHz.toFixed(0)} Hz) at ${ownCpuPercent.toFixed(1)}% own CPU`);
ticker.dispose();
