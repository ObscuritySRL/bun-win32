/**
 * Lumen Pulse
 *
 * Drives every physically-attached monitor's backlight as if it were a piece
 * of software — via DDC/CI over I²C — and renders four genuinely useful
 * brightness animations:
 *
 *   sunrise   ramp from min → max brightness over the given duration. Drop
 *             this into a launcher and your wake-up alarm becomes a physical
 *             sunrise that doesn't depend on the OS theme or apps that may
 *             not have launched yet.
 *
 *   sunset    inverse of sunrise — useful as a "wind down" hook scheduled
 *             before bed so the panel itself dims on a deterministic curve,
 *             not on whatever the OS night-light decides.
 *
 *   breath    continuous, gentle in/out breathing. Pair with a Pomodoro or
 *             eye-strain timer: the screen literally exhales when you're
 *             due for a 20-20-20 break.
 *
 *   pulse     a fast attention flash — full-bright burst then a controlled
 *             dim — that's visible even when the screen is covered by a
 *             full-screen exclusive app. Treat it as a hardware-level toast
 *             when the GUI notification path is hijacked (games, kiosks,
 *             remote sessions).
 *
 * Original brightness is captured at startup and restored when the program
 * exits (Ctrl+C handled).
 *
 * APIs demonstrated:
 *   - User32.EnumDisplayMonitors with a JSCallback
 *   - Dxva2.GetNumberOfPhysicalMonitorsFromHMONITOR
 *   - Dxva2.GetPhysicalMonitorsFromHMONITOR
 *   - Dxva2.GetMonitorCapabilities (MC_CAPS_BRIGHTNESS / MC_CAPS_CONTRAST gating)
 *   - Dxva2.GetMonitorBrightness / SetMonitorBrightness
 *   - Dxva2.SetMonitorContrast (optional contrast curve under --mirror-contrast)
 *   - Dxva2.DestroyPhysicalMonitors
 *
 * Run: bun run example/lumen-pulse.ts [--mode=sunrise|sunset|breath|pulse]
 *                                     [--duration-s=<n>] [--cycles=<n>]
 *                                     [--mirror-contrast]
 */

import { JSCallback, type Pointer, toArrayBuffer } from 'bun:ffi';

import Dxva2, { MC_CAPS, PHYSICAL_MONITOR_DESCRIPTION_SIZE, PHYSICAL_MONITOR_SIZE } from '../index';
import User32 from '@bun-win32/user32';

Dxva2.Preload([
  'DestroyPhysicalMonitors',
  'GetMonitorBrightness',
  'GetMonitorCapabilities',
  'GetMonitorContrast',
  'GetNumberOfPhysicalMonitorsFromHMONITOR',
  'GetPhysicalMonitorsFromHMONITOR',
  'SetMonitorBrightness',
  'SetMonitorContrast',
]);
User32.Preload(['EnumDisplayMonitors']);

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
} as const;

type AnimationMode = 'sunrise' | 'sunset' | 'breath' | 'pulse';

function parseArguments(): { mode: AnimationMode; durationSeconds: number; cycles: number; mirrorContrast: boolean } {
  const argv = Bun.argv.slice(2);
  let mode: AnimationMode = 'breath';
  let durationSeconds = 8;
  let cycles = 3;
  let mirrorContrast = false;

  for (const argument of argv) {
    if (argument.startsWith('--mode=')) {
      const value = argument.slice('--mode='.length);
      if (value === 'sunrise' || value === 'sunset' || value === 'breath' || value === 'pulse') {
        mode = value;
      }
    } else if (argument.startsWith('--duration-s=')) {
      const value = Number(argument.slice('--duration-s='.length));
      if (Number.isFinite(value) && value > 0) durationSeconds = value;
    } else if (argument.startsWith('--cycles=')) {
      const value = Number(argument.slice('--cycles='.length));
      if (Number.isFinite(value) && value > 0) cycles = Math.floor(value);
    } else if (argument === '--mirror-contrast') {
      mirrorContrast = true;
    }
  }

  return { mode, durationSeconds, cycles, mirrorContrast };
}

const { mode, durationSeconds, cycles, mirrorContrast } = parseArguments();

interface ManagedPanel {
  description: string;
  hPhysical: bigint;
  minBrightness: number;
  maxBrightness: number;
  originalBrightness: number;
  minContrast: number;
  maxContrast: number;
  originalContrast: number;
  supportsContrast: boolean;
}

interface CollectedGroup {
  hMonitor: bigint;
  physicalArray: Buffer;
  physicalCount: number;
  panels: ManagedPanel[];
}

const collectedGroups: CollectedGroup[] = [];
const enumeratedHandles: bigint[] = [];

const enumCallback = new JSCallback(
  (hMonitor: bigint, _hdc: bigint, _lprcMonitor: Pointer, _data: bigint): number => {
    enumeratedHandles.push(hMonitor);
    return 1;
  },
  {
    args: ['u64', 'u64', 'ptr', 'i64'],
    returns: 'i32',
  },
);

User32.EnumDisplayMonitors(0n, null, enumCallback.ptr!, 0n);
enumCallback.close();

for (const hMonitor of enumeratedHandles) {
  const countBuffer = Buffer.alloc(4);
  if (Dxva2.GetNumberOfPhysicalMonitorsFromHMONITOR(hMonitor, countBuffer.ptr) === 0) continue;

  const physicalCount = countBuffer.readUInt32LE(0);
  if (physicalCount === 0) continue;

  const physicalArray = Buffer.alloc(PHYSICAL_MONITOR_SIZE * physicalCount);
  if (Dxva2.GetPhysicalMonitorsFromHMONITOR(hMonitor, physicalCount, physicalArray.ptr) === 0) continue;

  const panels: ManagedPanel[] = [];

  for (let physicalIndex = 0; physicalIndex < physicalCount; physicalIndex += 1) {
    const entryOffset = physicalIndex * PHYSICAL_MONITOR_SIZE;
    const hPhysical = physicalArray.readBigUInt64LE(entryOffset);
    const description = physicalArray
      .subarray(entryOffset + 8, entryOffset + 8 + PHYSICAL_MONITOR_DESCRIPTION_SIZE * 2)
      .toString('utf16le')
      .replace(/\0.*$/, '');

    const capsBuffer = Buffer.alloc(4);
    const colourBuffer = Buffer.alloc(4);
    if (Dxva2.GetMonitorCapabilities(hPhysical, capsBuffer.ptr, colourBuffer.ptr) === 0) continue;
    const capMask = capsBuffer.readUInt32LE(0);
    if ((capMask & MC_CAPS.MC_CAPS_BRIGHTNESS) === 0) continue;

    const brightMin = Buffer.alloc(4);
    const brightCur = Buffer.alloc(4);
    const brightMax = Buffer.alloc(4);
    if (Dxva2.GetMonitorBrightness(hPhysical, brightMin.ptr, brightCur.ptr, brightMax.ptr) === 0) continue;

    const panel: ManagedPanel = {
      description,
      hPhysical,
      maxBrightness: brightMax.readUInt32LE(0),
      maxContrast: 100,
      minBrightness: brightMin.readUInt32LE(0),
      minContrast: 0,
      originalBrightness: brightCur.readUInt32LE(0),
      originalContrast: 50,
      supportsContrast: false,
    };

    if (mirrorContrast && capMask & MC_CAPS.MC_CAPS_CONTRAST) {
      const contrastMin = Buffer.alloc(4);
      const contrastCur = Buffer.alloc(4);
      const contrastMax = Buffer.alloc(4);
      if (Dxva2.GetMonitorContrast(hPhysical, contrastMin.ptr, contrastCur.ptr, contrastMax.ptr) !== 0) {
        panel.supportsContrast = true;
        panel.minContrast = contrastMin.readUInt32LE(0);
        panel.maxContrast = contrastMax.readUInt32LE(0);
        panel.originalContrast = contrastCur.readUInt32LE(0);
      }
    }

    panels.push(panel);
  }

  if (panels.length === 0) {
    Dxva2.DestroyPhysicalMonitors(physicalCount, physicalArray.ptr);
    continue;
  }

  collectedGroups.push({ hMonitor, physicalArray, physicalCount, panels });
}

const allPanels = collectedGroups.flatMap((group) => group.panels);

console.log(`${ANSI.bold}${ANSI.cyan}Lumen Pulse${ANSI.reset}  mode=${ANSI.yellow}${mode}${ANSI.reset}  duration=${durationSeconds}s  ${mirrorContrast ? `${ANSI.dim}+ contrast mirror${ANSI.reset}` : ''}`);

if (allPanels.length === 0) {
  console.log(`${ANSI.red}No DDC/CI-controllable panels found.${ANSI.reset}`);
  console.log(`${ANSI.dim}This is normal for laptop internal panels, virtual displays, and many TVs over HDMI.${ANSI.reset}`);
  destroyAllGroups();
  process.exit(0);
}

for (const panel of allPanels) {
  console.log(`  ${ANSI.magenta}${panel.description}${ANSI.reset}  ${ANSI.dim}range ${panel.minBrightness}–${panel.maxBrightness}, current ${panel.originalBrightness}${ANSI.reset}`);
}
console.log('');

let isShuttingDown = false;
process.on('SIGINT', () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n${ANSI.yellow}Interrupted — restoring original brightness.${ANSI.reset}`);
  restoreAndExit(130);
});

const startTime = performance.now();
const durationMs = durationSeconds * 1000;
const frameIntervalMs = 80; // DDC/CI is slow — ~12 fps is plenty and doesn't hammer the bus
let lastBrightnessByHandle = new Map<bigint, number>();

try {
  if (mode === 'sunrise' || mode === 'sunset') {
    await runOneShotCurve(mode);
  } else if (mode === 'breath') {
    await runBreath(cycles);
  } else if (mode === 'pulse') {
    await runPulse(cycles);
  }
} finally {
  restoreAndExit(0);
}

async function runOneShotCurve(curve: 'sunrise' | 'sunset'): Promise<void> {
  while (performance.now() - startTime < durationMs) {
    if (isShuttingDown) return;
    const fraction = Math.min(1, (performance.now() - startTime) / durationMs);
    const eased = easeInOut(fraction);
    const intensity = curve === 'sunrise' ? eased : 1 - eased;
    applyIntensityToAll(intensity);
    renderProgressBar(curve, intensity);
    await Bun.sleep(frameIntervalMs);
  }
  applyIntensityToAll(curve === 'sunrise' ? 1 : 0);
  renderProgressBar(curve, curve === 'sunrise' ? 1 : 0);
  process.stdout.write('\n');
}

async function runBreath(targetCycles: number): Promise<void> {
  let cycleIndex = 0;
  while (cycleIndex < targetCycles) {
    if (isShuttingDown) return;
    const cycleFraction = ((performance.now() - startTime) / durationMs) - cycleIndex;
    if (cycleFraction >= 1) {
      cycleIndex += 1;
      continue;
    }
    // sin curve from 0..2π gives a smooth in/out breath
    const intensity = 0.5 - 0.5 * Math.cos(cycleFraction * Math.PI * 2);
    applyIntensityToAll(intensity);
    renderProgressBar(`breath ${cycleIndex + 1}/${targetCycles}`, intensity);
    await Bun.sleep(frameIntervalMs);
  }
  process.stdout.write('\n');
}

async function runPulse(targetCycles: number): Promise<void> {
  const pulseDuration = 480; // ms per full burst → fades feel snappy but readable
  for (let pulseIndex = 0; pulseIndex < targetCycles; pulseIndex += 1) {
    if (isShuttingDown) return;
    const pulseStart = performance.now();
    while (performance.now() - pulseStart < pulseDuration) {
      if (isShuttingDown) return;
      const fraction = (performance.now() - pulseStart) / pulseDuration;
      // ramp up to 1.0 in the first 30% of the burst, then ease back down
      const intensity = fraction < 0.3 ? fraction / 0.3 : 1 - ((fraction - 0.3) / 0.7);
      applyIntensityToAll(intensity);
      renderProgressBar(`pulse ${pulseIndex + 1}/${targetCycles}`, intensity);
      await Bun.sleep(frameIntervalMs);
    }
    if (pulseIndex < targetCycles - 1) {
      applyIntensityToAll(0);
      await Bun.sleep(220);
    }
  }
  process.stdout.write('\n');
}

function applyIntensityToAll(intensity01: number): void {
  for (const panel of allPanels) {
    const brightnessRange = panel.maxBrightness - panel.minBrightness;
    const targetBrightness = panel.minBrightness + Math.round(intensity01 * brightnessRange);
    const previous = lastBrightnessByHandle.get(panel.hPhysical);

    if (previous !== targetBrightness) {
      Dxva2.SetMonitorBrightness(panel.hPhysical, targetBrightness);
      lastBrightnessByHandle.set(panel.hPhysical, targetBrightness);
    }

    if (panel.supportsContrast) {
      const contrastRange = panel.maxContrast - panel.minContrast;
      const targetContrast = panel.minContrast + Math.round(intensity01 * contrastRange);
      Dxva2.SetMonitorContrast(panel.hPhysical, targetContrast);
    }
  }
}

function renderProgressBar(label: string, intensity01: number): void {
  const width = 32;
  const filled = Math.round(intensity01 * width);
  const bar = `${'█'.repeat(filled)}${'░'.repeat(width - filled)}`;
  process.stdout.write(`\r  ${label.padEnd(18)} ${ANSI.cyan}[${bar}]${ANSI.reset} ${(intensity01 * 100).toFixed(0).padStart(3)}%`);
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function destroyAllGroups(): void {
  for (const group of collectedGroups) {
    Dxva2.DestroyPhysicalMonitors(group.physicalCount, group.physicalArray.ptr);
  }
}

function restoreAndExit(exitCode: number): void {
  for (const panel of allPanels) {
    Dxva2.SetMonitorBrightness(panel.hPhysical, panel.originalBrightness);
    if (panel.supportsContrast) {
      Dxva2.SetMonitorContrast(panel.hPhysical, panel.originalContrast);
    }
  }
  destroyAllGroups();
  process.exit(exitCode);
}
