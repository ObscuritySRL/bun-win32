/**
 * Link Sentinel
 *
 * Continuously samples IsNetworkAlive and renders a live, compact terminal
 * dashboard with a rolling timeline of adapter-class transitions (LAN / WAN /
 * AOL / Internet). Each sampling tick paints a column per adapter class and a
 * combined "any" sparkline, so a developer can physically watch the exact
 * moment a WAN link comes up, a LAN cable is unplugged, or Internet
 * connectivity flaps. Drops, recoveries, and the total uptime per class are
 * reported live. Press Ctrl+C to stop.
 *
 * This is genuinely useful for:
 *   - Validating that a flaky adapter actually recovers instead of just
 *     "feeling like it does".
 *   - Capturing the precise timestamp of a transient outage during an
 *     install / driver swap / VPN negotiation.
 *   - Stress-testing reconnection logic without spinning up full packet
 *     capture tooling.
 *
 * APIs demonstrated:
 *   - Sensapi.IsNetworkAlive  (adapter class polling every tick)
 *   - Kernel32.GetLastError   (detects the documented IsNetworkAlive error path)
 *
 * Run: bun run example/link-sentinel.ts [--interval-ms=<n>] [--duration-s=<n>]
 */

import Sensapi, { NetworkAliveFlags } from '../index';
import Kernel32 from '@bun-win32/kernel32';

Sensapi.Preload(['IsNetworkAlive']);
Kernel32.Preload(['GetLastError']);

const ANSI = {
  bold: '\x1b[1m',
  clearLine: '\x1b[2K',
  cursorHome: '\x1b[H',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  screenClear: '\x1b[2J',
  yellow: '\x1b[33m',
} as const;

const TRACKED_CLASSES: { flag: NetworkAliveFlags; label: string }[] = [
  { flag: NetworkAliveFlags.NETWORK_ALIVE_LAN, label: 'LAN     ' },
  { flag: NetworkAliveFlags.NETWORK_ALIVE_WAN, label: 'WAN     ' },
  { flag: NetworkAliveFlags.NETWORK_ALIVE_AOL, label: 'AOL     ' },
  { flag: NetworkAliveFlags.NETWORK_ALIVE_INTERNET, label: 'Internet' },
];

const TIMELINE_WIDTH = 60;
const UP_GLYPH = '\u2588';
const DOWN_GLYPH = '\u00b7';

function parseNumberOption(name: string, defaultValue: number): number {
  const prefix = `--${name}=`;

  for (const argument of Bun.argv.slice(2)) {
    if (!argument.startsWith(prefix)) continue;

    const parsed = Number(argument.slice(prefix.length));

    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return defaultValue;
}

const intervalMilliseconds = parseNumberOption('interval-ms', 500);
const durationSeconds = parseNumberOption('duration-s', 0);

interface ClassTrack {
  flag: NetworkAliveFlags;
  label: string;
  history: boolean[];
  transitions: number;
  upSamples: number;
}

const tracks: ClassTrack[] = TRACKED_CLASSES.map(({ flag, label }) => ({
  flag,
  history: [],
  label,
  transitions: 0,
  upSamples: 0,
}));

let anyHistory: ('up' | 'down' | 'err')[] = [];
let totalSamples = 0;
let errorSamples = 0;
let lastError = 0;
const startedAtMilliseconds = Date.now();

function sampleOnce(): void {
  const flagsBuffer = Buffer.alloc(4);
  const aliveResult = Sensapi.IsNetworkAlive(flagsBuffer.ptr);
  const errorCode = Kernel32.GetLastError();
  const aliveFlagsValue = flagsBuffer.readUInt32LE(0);

  totalSamples += 1;

  if (errorCode !== 0) {
    errorSamples += 1;
    lastError = errorCode;
    anyHistory.push('err');

    for (const track of tracks) {
      track.history.push(false);
    }
  } else {
    anyHistory.push(aliveResult !== 0 ? 'up' : 'down');

    for (const track of tracks) {
      const wasUp = (aliveFlagsValue & track.flag) !== 0;
      const previouslyUp = track.history.at(-1) ?? false;

      if (wasUp !== previouslyUp && track.history.length > 0) {
        track.transitions += 1;
      }

      if (wasUp) {
        track.upSamples += 1;
      }

      track.history.push(wasUp);
    }
  }

  if (anyHistory.length > TIMELINE_WIDTH) {
    anyHistory = anyHistory.slice(anyHistory.length - TIMELINE_WIDTH);
  }

  for (const track of tracks) {
    if (track.history.length > TIMELINE_WIDTH) {
      track.history = track.history.slice(track.history.length - TIMELINE_WIDTH);
    }
  }
}

function renderTimeline(): string {
  const elapsedSeconds = ((Date.now() - startedAtMilliseconds) / 1000).toFixed(1);
  const header = `${ANSI.bold}${ANSI.cyan}Link Sentinel${ANSI.reset}  ${ANSI.dim}${elapsedSeconds}s elapsed / ${totalSamples} samples @ ${intervalMilliseconds}ms${ANSI.reset}`;
  const lines: string[] = [header, ''];
  const combinedTimeline = anyHistory.map((entry) => (entry === 'err' ? `${ANSI.yellow}?${ANSI.reset}` : entry === 'up' ? `${ANSI.green}${UP_GLYPH}${ANSI.reset}` : `${ANSI.red}${DOWN_GLYPH}${ANSI.reset}`)).join('');

  lines.push(`  ${ANSI.bold}any     ${ANSI.reset} ${combinedTimeline}`);
  lines.push('');

  for (const track of tracks) {
    const currentlyUp = track.history.at(-1) ?? false;
    const uptimeRatio = totalSamples > 0 ? track.upSamples / totalSamples : 0;
    const stateLabel = currentlyUp ? `${ANSI.green}UP  ${ANSI.reset}` : `${ANSI.red}DOWN${ANSI.reset}`;
    const timeline = track.history.map((wasUp) => (wasUp ? `${ANSI.green}${UP_GLYPH}${ANSI.reset}` : `${ANSI.red}${DOWN_GLYPH}${ANSI.reset}`)).join('');

    lines.push(`  ${track.label} ${timeline}`);
    lines.push(`           ${stateLabel}  ${ANSI.dim}uptime ${(uptimeRatio * 100).toFixed(1)}%   transitions ${track.transitions}${ANSI.reset}`);
  }

  lines.push('');

  if (errorSamples > 0) {
    lines.push(`  ${ANSI.yellow}IsNetworkAlive error samples: ${errorSamples} (last=0x${lastError.toString(16).padStart(8, '0')})${ANSI.reset}`);
  } else {
    lines.push(`  ${ANSI.dim}No error samples.${ANSI.reset}`);
  }

  if (durationSeconds > 0) {
    lines.push(`  ${ANSI.dim}Auto-stop at ${durationSeconds}s. Ctrl+C to quit early.${ANSI.reset}`);
  } else {
    lines.push(`  ${ANSI.dim}Press Ctrl+C to stop.${ANSI.reset}`);
  }

  return lines.join('\n');
}

process.stdout.write(ANSI.screenClear + ANSI.cursorHome);

let stopRequested = false;

process.on('SIGINT', () => {
  stopRequested = true;
});

while (!stopRequested) {
  sampleOnce();
  process.stdout.write(ANSI.cursorHome + renderTimeline() + '\n');

  if (durationSeconds > 0 && (Date.now() - startedAtMilliseconds) / 1000 >= durationSeconds) {
    break;
  }

  await Bun.sleep(intervalMilliseconds);
}

process.stdout.write('\n');
console.log(`${ANSI.bold}Final report${ANSI.reset}`);

for (const track of tracks) {
  const uptimeRatio = totalSamples > 0 ? track.upSamples / totalSamples : 0;
  console.log(`  ${track.label}  uptime ${(uptimeRatio * 100).toFixed(1)}%   transitions ${track.transitions}`);
}

console.log(`  Total samples: ${totalSamples}   error samples: ${errorSamples}`);
