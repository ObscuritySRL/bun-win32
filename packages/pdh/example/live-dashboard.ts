/**
 * Live Dashboard
 *
 * Real-time system vitals monitor that polls Windows performance counters every
 * second and displays updating ASCII progress bars for CPU usage, available
 * memory, thread count, and process count. Runs for 15 seconds then cleans up.
 *
 * APIs demonstrated:
 *   - PdhOpenQueryW             (create a performance data query)
 *   - PdhAddEnglishCounterW     (add locale-independent counters)
 *   - PdhCollectQueryData       (sample all counters in the query)
 *   - PdhGetFormattedCounterValue (read formatted double/long values)
 *   - PdhRemoveCounter          (detach a counter from the query)
 *   - PdhCloseQuery             (release the query handle)
 *
 * Run: bun run example/live-dashboard.ts
 */
import Pdh, { PdhCounterFormat } from '../index';

Pdh.Preload([
  'PdhOpenQueryW',
  'PdhAddEnglishCounterW',
  'PdhCollectQueryData',
  'PdhGetFormattedCounterValue',
  'PdhRemoveCounter',
  'PdhCloseQuery',
]);

// Open a real-time query
const hQueryBuf = Buffer.alloc(8);
const openStatus = Pdh.PdhOpenQueryW(null, 0n, hQueryBuf.ptr);
if (openStatus !== 0) {
  console.error(`PdhOpenQueryW failed: 0x${(openStatus >>> 0).toString(16)}`);
  process.exit(1);
}
const hQuery = hQueryBuf.readBigUInt64LE(0);

// Counter definitions: path, label, unit, bar width, format function
interface CounterDef {
  path: string;
  label: string;
  unit: string;
  barWidth: number;
  maxValue: number;
  format: (v: number) => string;
}

const counterDefs: CounterDef[] = [
  {
    path: '\\Processor(_Total)\\% Processor Time',
    label: 'CPU Usage',
    unit: '%',
    barWidth: 40,
    maxValue: 100,
    format: (v) => `${v.toFixed(1)}%`,
  },
  {
    path: '\\Memory\\Available MBytes',
    label: 'Free Memory',
    unit: 'MB',
    barWidth: 40,
    maxValue: 0, // will be set dynamically
    format: (v) => `${v.toFixed(0)} MB`,
  },
  {
    path: '\\System\\Threads',
    label: 'Threads',
    unit: '',
    barWidth: 40,
    maxValue: 5000,
    format: (v) => `${Math.round(v).toLocaleString()}`,
  },
  {
    path: '\\System\\Processes',
    label: 'Processes',
    unit: '',
    barWidth: 40,
    maxValue: 500,
    format: (v) => `${Math.round(v).toLocaleString()}`,
  },
];

// Add all counters
const counterHandles: bigint[] = [];
for (const def of counterDefs) {
  const hCounterBuf = Buffer.alloc(8);
  const pathBuf = Buffer.from(def.path + '\0', 'utf16le');
  const status = Pdh.PdhAddEnglishCounterW(hQuery, pathBuf.ptr, 0n, hCounterBuf.ptr);
  if (status !== 0) {
    console.error(`Failed to add counter "${def.path}": 0x${(status >>> 0).toString(16)}`);
    counterHandles.push(0n);
  } else {
    counterHandles.push(hCounterBuf.readBigUInt64LE(0));
  }
}

// Rate counters need two samples, so collect a baseline
Pdh.PdhCollectQueryData(hQuery);
await Bun.sleep(1000);

function readCounterDouble(hCounter: bigint): number | null {
  if (hCounter === 0n) return null;
  const valueBuf = Buffer.alloc(24); // PDH_FMT_COUNTERVALUE: 4 bytes status + 4 pad + 8/16 bytes value
  const status = Pdh.PdhGetFormattedCounterValue(
    hCounter,
    PdhCounterFormat.PDH_FMT_DOUBLE,
    null,
    valueBuf.ptr,
  );
  if (status !== 0) return null;
  return valueBuf.readDoubleLE(8);
}

function progressBar(value: number, max: number, width: number): string {
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const filled = Math.round(pct * width);
  return '\u2588'.repeat(filled) + '\u2591'.repeat(width - filled);
}

function colorForPercent(pct: number): string {
  if (pct > 80) return '\x1b[91m'; // bright red
  if (pct > 50) return '\x1b[93m'; // bright yellow
  return '\x1b[92m'; // bright green
}

const DURATION_SEC = 15;
const POLL_MS = 1000;

console.log('\x1b[2J\x1b[H'); // clear screen

for (let tick = 0; tick < DURATION_SEC; tick++) {
  Pdh.PdhCollectQueryData(hQuery);

  // Move cursor to top
  process.stdout.write('\x1b[H');

  const timeLeft = DURATION_SEC - tick;
  console.log(`\x1b[96m  LIVE SYSTEM DASHBOARD\x1b[0m                          \x1b[90m[${timeLeft}s remaining]\x1b[0m`);
  console.log(`\x1b[90m  powered by @bun-win32/pdh\x1b[0m`);
  console.log(`  ${'─'.repeat(60)}`);
  console.log();

  for (let c = 0; c < counterDefs.length; c++) {
    const def = counterDefs[c]!;
    const handle = counterHandles[c]!;
    const value = readCounterDouble(handle);

    if (value === null) {
      console.log(`  ${def.label.padEnd(14)} [no data]                                        `);
      console.log();
      continue;
    }

    // For memory, invert the bar (more free = greener)
    let barMax = def.maxValue;
    let barValue = value;
    let displayPct: number;

    if (def.label === 'Free Memory') {
      // Dynamically set max if first sample, assume 32GB if unknown
      if (barMax === 0) {
        def.maxValue = Math.max(value * 2, 8192);
        barMax = def.maxValue;
      }
      displayPct = ((barMax - value) / barMax) * 100; // used % for coloring
    } else {
      displayPct = barMax > 0 ? (value / barMax) * 100 : 0;
    }

    const color = colorForPercent(displayPct);
    const bar = progressBar(barValue, barMax, def.barWidth);
    const valueStr = def.format(value);

    console.log(`  \x1b[97m${def.label.padEnd(14)}\x1b[0m ${color}${bar}\x1b[0m ${valueStr.padStart(10)}  `);
    console.log();
  }

  console.log(`  ${'─'.repeat(60)}`);
  console.log(`  \x1b[90mSampling every ${POLL_MS}ms via PdhCollectQueryData\x1b[0m              `);

  if (tick < DURATION_SEC - 1) {
    await Bun.sleep(POLL_MS);
  }
}

// Cleanup
for (const h of counterHandles) {
  if (h !== 0n) Pdh.PdhRemoveCounter(h);
}
Pdh.PdhCloseQuery(hQuery);

console.log('\n  \x1b[92mDashboard complete. All counters released.\x1b[0m\n');
