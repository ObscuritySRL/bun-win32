/**
 * DDC/CI Monitor Console
 *
 * Talks DDC/CI (Display Data Channel / Command Interface) directly to the
 * PHYSICAL monitor over the I²C bus that rides the video cable — the same
 * sideband channel the monitor's own OSD buttons use. There is no Win32-y
 * "set brightness" registry key here: every value below is an actual VESA
 * MCCS VCP read/write transacted with the panel's scaler firmware.
 *
 * Pipeline (all synchronous on the JS thread via plain dlopen — no foreign
 * threads, no JSCallback re-entrancy hazard beyond the in-thread enum cb):
 *
 *   User32.EnumDisplayMonitors  (JSCallback collects HMONITORs, closed after)
 *     └─ Dxva2.GetNumberOfPhysicalMonitorsFromHMONITOR
 *        └─ Dxva2.GetPhysicalMonitorsFromHMONITOR  (PHYSICAL_MONITOR[] = HANDLE + 128 WCHAR)
 *           ├─ GetMonitorCapabilities            → MC_CAPS bitmask (gate every read/write)
 *           ├─ GetMonitorBrightness / Contrast   → min / cur / max over I²C
 *           ├─ GetVCPFeatureAndVCPFeatureReply(0x60) → input source (VGA/DVI/DP/HDMI)
 *           ├─ GetCapabilitiesStringLength + CapabilitiesRequestAndCapabilitiesReply
 *           │                                    → raw MCCS capabilities string from the panel
 *           └─ Set{Monitor,VCP}* (throttled ~12 fps) for live interactive control
 *
 * Interactive (when a DDC/CI-writable panel is present):
 *   + / -   brightness up / down        [ / ]   contrast down / up
 *   q / ESC / Ctrl-C  restore originals + quit
 *
 * GRACEFUL DEGRADATION: laptop internal panels, virtual/RDP displays and the
 * "Generic PnP Monitor" test box typically return BOOL=0 to DDC/CI writes (and
 * often reads). That is the EXPECTED path here — the program prints whatever
 * read-only capabilities it can extract, explains that DDC/CI is normal-absent
 * on internal/virtual panels, and exits 0. Real external monitors (most
 * DisplayPort/HDMI desktop displays) light up the full interactive UI.
 *
 * APIs: User32.EnumDisplayMonitors; Dxva2.{GetNumberOfPhysicalMonitorsFromHMONITOR,
 *   GetPhysicalMonitorsFromHMONITOR, GetMonitorCapabilities, GetMonitorBrightness,
 *   GetMonitorContrast, GetVCPFeatureAndVCPFeatureReply, GetCapabilitiesStringLength,
 *   CapabilitiesRequestAndCapabilitiesReply, SetMonitorBrightness, SetMonitorContrast,
 *   SetVCPFeature, DestroyPhysicalMonitors}; Kernel32.{GetStdHandle, Get/SetConsoleMode}.
 *
 * Run: bun run packages/all/example/ddc-monitor.ts
 *      (honors DEMO_DURATION_MS=<ms> to auto-exit the interactive loop)
 */

import { JSCallback, type Pointer } from 'bun:ffi';

import { Dxva2, Kernel32, User32 } from '../index';
import { MC_CAPS } from '@bun-win32/dxva2';

// ── ANSI / VT ───────────────────────────────────────────────────────────────

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

const STD_OUTPUT_HANDLE = 0xffff_fff5; // (DWORD)-11
const ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;

/** Enable VT processing on stdout; returns the previous mode so we can restore it. */
function enableVirtualTerminal(): { handle: bigint; previousMode: number } | null {
  const handle = Kernel32.GetStdHandle(STD_OUTPUT_HANDLE);
  if (handle === 0n) return null;

  const modeBuffer = Buffer.alloc(4);
  if (Kernel32.GetConsoleMode(handle, modeBuffer.ptr) === 0) return null;

  const previousMode = modeBuffer.readUInt32LE(0);
  Kernel32.SetConsoleMode(handle, previousMode | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
  return { handle, previousMode };
}

// ── PHYSICAL_MONITOR layout (packed: HANDLE u64 + 128 WCHAR) ─────────────────

const PHYSICAL_MONITOR_DESCRIPTION_CHARS = 128;
const PHYSICAL_MONITOR_SIZE = 8 + PHYSICAL_MONITOR_DESCRIPTION_CHARS * 2; // 264

// VCP 0x60 — Input Source select (VESA MCCS standard values).
const INPUT_SOURCE_VCP = 0x60;
const INPUT_SOURCE_NAMES: Readonly<Record<number, string>> = {
  0x01: 'VGA-1',
  0x02: 'VGA-2',
  0x03: 'DVI-1',
  0x04: 'DVI-2',
  0x05: 'Composite-1',
  0x06: 'Composite-2',
  0x07: 'S-Video-1',
  0x08: 'S-Video-2',
  0x09: 'Tuner-1',
  0x0a: 'Tuner-2',
  0x0b: 'Tuner-3',
  0x0c: 'Component-1',
  0x0d: 'Component-2',
  0x0e: 'Component-3',
  0x0f: 'DisplayPort-1',
  0x10: 'DisplayPort-2',
  0x11: 'HDMI-1',
  0x12: 'HDMI-2',
};

interface Range {
  min: number;
  cur: number;
  max: number;
}

interface PanelState {
  description: string;
  hPhysical: bigint;
  capabilityMask: number;
  supportsBrightness: boolean;
  supportsContrast: boolean;
  brightness: Range | null;
  contrast: Range | null;
  inputSource: number | null;
  mccsString: string | null;
  // Captured originals for restore-on-exit.
  originalBrightness: number | null;
  originalContrast: number | null;
}

interface MonitorGroup {
  hMonitor: bigint;
  physicalArray: Buffer;
  physicalCount: number;
  panels: PanelState[];
}

// ── Native helpers (each gates on BOOL !== 0 before reading buffers) ─────────

function readRange(method: 'GetMonitorBrightness' | 'GetMonitorContrast', hPhysical: bigint): Range | null {
  const minBuf = Buffer.alloc(4);
  const curBuf = Buffer.alloc(4);
  const maxBuf = Buffer.alloc(4);
  if (Dxva2[method](hPhysical, minBuf.ptr, curBuf.ptr, maxBuf.ptr) === 0) return null;
  return { min: minBuf.readUInt32LE(0), cur: curBuf.readUInt32LE(0), max: maxBuf.readUInt32LE(0) };
}

function readInputSource(hPhysical: bigint): number | null {
  const curBuf = Buffer.alloc(4);
  const maxBuf = Buffer.alloc(4);
  // pvct (VCP code type) may be NULL; we only want the current value.
  if (Dxva2.GetVCPFeatureAndVCPFeatureReply(hPhysical, INPUT_SOURCE_VCP, null, curBuf.ptr, maxBuf.ptr) === 0) return null;
  return curBuf.readUInt32LE(0);
}

function readMccsString(hPhysical: bigint): string | null {
  const lenBuf = Buffer.alloc(4);
  if (Dxva2.GetCapabilitiesStringLength(hPhysical, lenBuf.ptr) === 0) return null;
  const length = lenBuf.readUInt32LE(0);
  if (length === 0) return null;

  const strBuf = Buffer.alloc(length);
  if (Dxva2.CapabilitiesRequestAndCapabilitiesReply(hPhysical, strBuf.ptr, length) === 0) return null;
  // Length includes the terminating NUL.
  return strBuf.subarray(0, Math.max(0, length - 1)).toString('ascii');
}

// ── Enumerate HMONITORs via a synchronous JSCallback ─────────────────────────

const collectedHandles: bigint[] = [];

const enumCallback = new JSCallback(
  (hMonitor: bigint, _hdc: bigint, _lprcMonitor: Pointer, _data: bigint): number => {
    collectedHandles.push(hMonitor);
    return 1; // continue enumeration
  },
  { args: ['u64', 'u64', 'ptr', 'i64'], returns: 'i32' },
);

User32.EnumDisplayMonitors(0n, null, enumCallback.ptr!, 0n);
enumCallback.close();

// ── Resolve physical monitors + read everything DDC/CI will give us ──────────

const groups: MonitorGroup[] = [];

for (const hMonitor of collectedHandles) {
  const countBuf = Buffer.alloc(4);
  if (Dxva2.GetNumberOfPhysicalMonitorsFromHMONITOR(hMonitor, countBuf.ptr) === 0) continue;

  const physicalCount = countBuf.readUInt32LE(0);
  if (physicalCount === 0) continue;

  const physicalArray = Buffer.alloc(PHYSICAL_MONITOR_SIZE * physicalCount);
  if (Dxva2.GetPhysicalMonitorsFromHMONITOR(hMonitor, physicalCount, physicalArray.ptr) === 0) continue;

  const panels: PanelState[] = [];

  for (let i = 0; i < physicalCount; i += 1) {
    const offset = i * PHYSICAL_MONITOR_SIZE;
    const hPhysical = physicalArray.readBigUInt64LE(offset);
    const description = physicalArray
      .subarray(offset + 8, offset + 8 + PHYSICAL_MONITOR_DESCRIPTION_CHARS * 2)
      .toString('utf16le')
      .replace(/\0.*$/, '');

    const capsBuf = Buffer.alloc(4);
    const colorTempBuf = Buffer.alloc(4);
    let capabilityMask = 0;
    if (Dxva2.GetMonitorCapabilities(hPhysical, capsBuf.ptr, colorTempBuf.ptr) !== 0) {
      capabilityMask = capsBuf.readUInt32LE(0);
    }

    const supportsBrightness = (capabilityMask & MC_CAPS.MC_CAPS_BRIGHTNESS) !== 0;
    const supportsContrast = (capabilityMask & MC_CAPS.MC_CAPS_CONTRAST) !== 0;

    const brightness = supportsBrightness ? readRange('GetMonitorBrightness', hPhysical) : null;
    const contrast = supportsContrast ? readRange('GetMonitorContrast', hPhysical) : null;

    panels.push({
      brightness,
      capabilityMask,
      contrast,
      description: description.length > 0 ? description : '(no description)',
      hPhysical,
      inputSource: readInputSource(hPhysical),
      mccsString: readMccsString(hPhysical),
      originalBrightness: brightness ? brightness.cur : null,
      originalContrast: contrast ? contrast.cur : null,
      supportsBrightness,
      supportsContrast,
    });
  }

  groups.push({ hMonitor, panels, physicalArray, physicalCount });
}

const allPanels = groups.flatMap((group) => group.panels);
const writablePanels = allPanels.filter((panel) => panel.supportsBrightness || panel.supportsContrast);

// ── Lifetime / teardown ──────────────────────────────────────────────────────

const vt = enableVirtualTerminal();
let isTearingDown = false;

function restorePanels(): void {
  for (const panel of allPanels) {
    if (panel.originalBrightness !== null) Dxva2.SetMonitorBrightness(panel.hPhysical, panel.originalBrightness);
    if (panel.originalContrast !== null) Dxva2.SetMonitorContrast(panel.hPhysical, panel.originalContrast);
  }
}

function teardown(exitCode: number): never {
  if (isTearingDown) process.exit(exitCode);
  isTearingDown = true;

  restorePanels();
  for (const group of groups) {
    Dxva2.DestroyPhysicalMonitors(group.physicalCount, group.physicalArray.ptr);
  }

  if (process.stdin.isTTY) {
    try {
      process.stdin.setRawMode(false);
    } catch {
      /* not a TTY / already closed */
    }
    process.stdin.pause();
  }

  if (vt) Kernel32.SetConsoleMode(vt.handle, vt.previousMode);
  process.stdout.write(`${ANSI.reset}\x1b[?25h\n`); // show cursor
  process.exit(exitCode);
}

// ── Static report ────────────────────────────────────────────────────────────

/** Render a min/cur/max range with an inline bar (used in the read-only report). */
function formatRange(range: Range): string {
  const width = 24;
  const fraction = range.max > range.min ? (range.cur - range.min) / (range.max - range.min) : 0;
  const filled = Math.round(Math.max(0, Math.min(1, fraction)) * width);
  const meter = `${'█'.repeat(filled)}${'░'.repeat(width - filled)}`;
  return `${ANSI.green}${String(range.cur).padStart(4)}${ANSI.reset} ${ANSI.dim}(${range.min}-${range.max})${ANSI.reset} ${ANSI.cyan}[${meter}]${ANSI.reset}`;
}

const divider = '─'.repeat(78);

console.log(`${ANSI.bold}${ANSI.cyan}DDC/CI Monitor Console${ANSI.reset}  ${ANSI.dim}(VESA MCCS over I²C — dxva2.dll)${ANSI.reset}`);
console.log(`${ANSI.dim}${new Date().toISOString()}  ·  ${collectedHandles.length} HMONITOR(s) · ${allPanels.length} physical monitor(s)${ANSI.reset}`);
console.log(divider);

if (allPanels.length === 0) {
  console.log(`${ANSI.yellow}No physical monitors resolved from any HMONITOR.${ANSI.reset}`);
  console.log(`${ANSI.dim}This can happen on headless/RDP sessions where no display device backs the GDI monitor.${ANSI.reset}`);
  teardown(0);
}

for (let i = 0; i < allPanels.length; i += 1) {
  const panel = allPanels[i]!;
  console.log('');
  console.log(`${ANSI.bold}Monitor ${i + 1}/${allPanels.length}${ANSI.reset}  ${ANSI.magenta}${panel.description}${ANSI.reset}  ${ANSI.dim}handle=${panel.hPhysical}${ANSI.reset}`);

  if (panel.capabilityMask === 0) {
    console.log(`  ${ANSI.yellow}GetMonitorCapabilities returned 0 — panel does not answer DDC/CI MCCS.${ANSI.reset}`);
  } else {
    console.log(`  Capability mask    ${ANSI.green}0x${panel.capabilityMask.toString(16).padStart(8, '0')}${ANSI.reset}`);
  }

  if (panel.brightness) {
    console.log(`  Brightness         ${formatRange(panel.brightness)}`);
  } else if (panel.supportsBrightness) {
    console.log(`  Brightness         ${ANSI.red}reported supported but read failed${ANSI.reset}`);
  }

  if (panel.contrast) {
    console.log(`  Contrast           ${formatRange(panel.contrast)}`);
  } else if (panel.supportsContrast) {
    console.log(`  Contrast           ${ANSI.red}reported supported but read failed${ANSI.reset}`);
  }

  if (panel.inputSource !== null) {
    const name = INPUT_SOURCE_NAMES[panel.inputSource] ?? `unknown (0x${panel.inputSource.toString(16)})`;
    console.log(`  Input source (60h) ${ANSI.cyan}${name}${ANSI.reset} ${ANSI.dim}raw=0x${panel.inputSource.toString(16).padStart(2, '0')}${ANSI.reset}`);
  }

  if (panel.mccsString) {
    const trimmed = panel.mccsString.length > 220 ? `${panel.mccsString.slice(0, 217)}...` : panel.mccsString;
    console.log(`  MCCS string        ${ANSI.dim}${trimmed}${ANSI.reset}`);
  }
}

console.log('');
console.log(divider);

// ── Interactive control (only if something is writable) ──────────────────────

if (writablePanels.length === 0) {
  console.log(`${ANSI.yellow}No DDC/CI-writable panel found — read-only report above is the complete result.${ANSI.reset}`);
  console.log(`${ANSI.dim}This is normal and expected for laptop internal panels, virtual/RDP displays, the${ANSI.reset}`);
  console.log(`${ANSI.dim}"Generic PnP Monitor" test box, and many TVs over HDMI. It works fully on external${ANSI.reset}`);
  console.log(`${ANSI.dim}DDC/CI-capable desktop monitors (most DisplayPort/HDMI displays).${ANSI.reset}`);
  teardown(0);
}

if (!process.stdin.isTTY) {
  console.log(`${ANSI.yellow}stdin is not a TTY — skipping interactive control; read-only report above stands.${ANSI.reset}`);
  teardown(0);
}

console.log(`${ANSI.bold}Interactive DDC/CI control${ANSI.reset}  ${ANSI.dim}(${writablePanels.length} writable panel(s))${ANSI.reset}`);
console.log(`  ${ANSI.green}+${ANSI.reset}/${ANSI.green}-${ANSI.reset} brightness   ${ANSI.green}]${ANSI.reset}/${ANSI.green}[${ANSI.reset} contrast   ${ANSI.green}q${ANSI.reset}/${ANSI.green}ESC${ANSI.reset} restore & quit`);
console.log('');
process.stdout.write('\x1b[?25l'); // hide cursor

// Live working values (start at captured originals).
const liveBrightness = new Map<bigint, number>();
const liveContrast = new Map<bigint, number>();
for (const panel of writablePanels) {
  if (panel.brightness) liveBrightness.set(panel.hPhysical, panel.brightness.cur);
  if (panel.contrast) liveContrast.set(panel.hPhysical, panel.contrast.cur);
}

const FRAME_MS = 1000 / 12; // throttle DDC/CI writes to ~12 fps; the bus is slow
let lastWrite = 0;
let dirty = false;

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

function adjustBrightness(delta: number): void {
  for (const panel of writablePanels) {
    if (!panel.brightness) continue;
    const next = clamp((liveBrightness.get(panel.hPhysical) ?? panel.brightness.cur) + delta, panel.brightness.min, panel.brightness.max);
    liveBrightness.set(panel.hPhysical, next);
  }
  dirty = true;
}

function adjustContrast(delta: number): void {
  for (const panel of writablePanels) {
    if (!panel.contrast) continue;
    const next = clamp((liveContrast.get(panel.hPhysical) ?? panel.contrast.cur) + delta, panel.contrast.min, panel.contrast.max);
    liveContrast.set(panel.hPhysical, next);
  }
  dirty = true;
}

function flushWrites(): void {
  for (const panel of writablePanels) {
    if (panel.brightness) {
      const target = liveBrightness.get(panel.hPhysical)!;
      if (target !== panel.brightness.cur) {
        Dxva2.SetMonitorBrightness(panel.hPhysical, target);
        panel.brightness.cur = target;
      }
    }
    if (panel.contrast) {
      const target = liveContrast.get(panel.hPhysical)!;
      if (target !== panel.contrast.cur) {
        Dxva2.SetMonitorContrast(panel.hPhysical, target);
        panel.contrast.cur = target;
      }
    }
  }
}

function renderStatus(): void {
  const lines: string[] = [];
  for (const panel of writablePanels) {
    const parts: string[] = [`${ANSI.magenta}${panel.description}${ANSI.reset}`];
    if (panel.brightness) parts.push(`B ${bar(liveBrightness.get(panel.hPhysical)!, panel.brightness.min, panel.brightness.max)}`);
    if (panel.contrast) parts.push(`C ${bar(liveContrast.get(panel.hPhysical)!, panel.contrast.min, panel.contrast.max)}`);
    lines.push(`  ${parts.join('   ')}`);
  }
  // Redraw in place: move cursor up, clear, reprint.
  process.stdout.write(`\x1b[${lines.length}A`);
  for (const line of lines) process.stdout.write(`\x1b[2K${line}\n`);
}

function bar(value: number, min: number, max: number): string {
  const width = 24;
  const fraction = max > min ? (value - min) / (max - min) : 0;
  const filled = Math.round(clamp(fraction, 0, 1) * width);
  return `${ANSI.cyan}[${'█'.repeat(filled)}${ANSI.dim}${'░'.repeat(width - filled)}${ANSI.reset}${ANSI.cyan}]${ANSI.reset} ${String(value).padStart(4)} ${ANSI.dim}(${min}-${max})${ANSI.reset}`;
}

// Initial status block (one line per panel) — leave it on screen, then redraw in place.
for (const panel of writablePanels) {
  const parts: string[] = [`${ANSI.magenta}${panel.description}${ANSI.reset}`];
  if (panel.brightness) parts.push(`B ${bar(panel.brightness.cur, panel.brightness.min, panel.brightness.max)}`);
  if (panel.contrast) parts.push(`C ${bar(panel.contrast.cur, panel.contrast.min, panel.contrast.max)}`);
  process.stdout.write(`  ${parts.join('   ')}\n`);
}

// ── Input + frame pump ────────────────────────────────────────────────────────

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

const ESC = '';
const ETX = ''; // Ctrl-C

process.stdin.on('data', (chunk: string) => {
  for (const ch of chunk) {
    if (ch === ESC || ch === ETX || ch === 'q' || ch === 'Q') {
      process.stdout.write(`\n${ANSI.yellow}Restoring original brightness/contrast and exiting.${ANSI.reset}\n`);
      teardown(0);
    } else if (ch === '+' || ch === '=') {
      adjustBrightness(+5);
    } else if (ch === '-' || ch === '_') {
      adjustBrightness(-5);
    } else if (ch === ']') {
      adjustContrast(+5);
    } else if (ch === '[') {
      adjustContrast(-5);
    }
  }
});

process.on('SIGINT', () => teardown(0));

const startTime = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;

const pump = setInterval(() => {
  const now = performance.now();

  if (dirty && now - lastWrite >= FRAME_MS) {
    flushWrites();
    renderStatus();
    dirty = false;
    lastWrite = now;
  }

  if (durationMs > 0 && now - startTime >= durationMs) {
    clearInterval(pump);
    process.stdout.write(`\n${ANSI.dim}DEMO_DURATION_MS elapsed — restoring and exiting.${ANSI.reset}\n`);
    teardown(0);
  }
}, 16);
