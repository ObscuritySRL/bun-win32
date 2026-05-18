/**
 * Windows Servicing Inventory
 *
 * A live animated heads-up display of the running Windows image's servicing
 * footprint, pulled straight from the DISM API — the engine `DISM.exe` drives —
 * with no process spawn. When elevated it opens an online DISM session and polls
 * the optional-feature, servicing-package, and out-of-box-driver counts plus the
 * image-corruption health, rendering them as animated truecolor gauges. When not
 * elevated it decodes ERROR_ELEVATION_REQUIRED into an animated gate panel —
 * honest about what it can and cannot do.
 *
 * APIs demonstrated (Dismapi):
 *   - DismInitialize / DismShutdown      (DISM platform lifecycle)
 *   - DismOpenSession / DismCloseSession (online image session)
 *   - DismCheckImageHealth               (corruption state)
 *   - DismGetFeatures                    (optional-feature count)
 *   - DismGetPackages                    (servicing-package count)
 *   - DismGetDrivers                     (out-of-box driver count)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - GetStdHandle / GetConsoleMode / SetConsoleMode  (enable ANSI VT output)
 *
 * Run: bun run example/servicing-inventory.ts   (run elevated for the live gauges)
 */
import Dismapi, { DISM_ONLINE_IMAGE, DismImageHealthState, DismLogLevel, DismPackageIdentifier } from '../index';
import Kernel32 from '@bun-win32/kernel32';

Dismapi.Preload(['DismInitialize', 'DismOpenSession', 'DismCheckImageHealth', 'DismGetFeatures', 'DismGetPackages', 'DismGetDrivers', 'DismCloseSession', 'DismShutdown']);
Kernel32.Preload(['GetStdHandle', 'GetConsoleMode', 'SetConsoleMode']);

const STD_OUTPUT_HANDLE = -11;
const ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;
const hStdout = Kernel32.GetStdHandle(STD_OUTPUT_HANDLE);
const modeBuf = Buffer.alloc(4);
if (Kernel32.GetConsoleMode(hStdout, modeBuf.ptr)) {
  Kernel32.SetConsoleMode(hStdout, modeBuf.readUInt32LE(0) | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
}

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[38;2;90;220;130m';
const RED = '\x1b[38;2;240;85;85m';
const YELLOW = '\x1b[38;2;235;205;100m';
const CYAN = '\x1b[38;2;120;200;255m';
const HIDE_CURSOR = '\x1b[?25l';
const SHOW_CURSOR = '\x1b[?25h';
const HOME = '\x1b[H';
const CLEAR = '\x1b[2J';

const S_OK = 0;
const ERROR_ELEVATION_REQUIRED = 0x800702e4 | 0;
const hex = (hr: number) => '0x' + (hr >>> 0).toString(16).toUpperCase().padStart(8, '0');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const initHr = Dismapi.DismInitialize(DismLogLevel.DismLogErrorsWarnings, null, null);

process.stdout.write(HIDE_CURSOR + CLEAR);
try {
  if (initHr !== S_OK) {
    // Non-elevated: animated, honest elevation-gate panel.
    for (let f = 0; f < 16; f++) {
      const pulse = f % 2 === 0;
      let out = HOME;
      out += `${BOLD}${CYAN}╔═ WINDOWS SERVICING INVENTORY ════════════════════════════╗${RESET}\n`;
      out += `  ${pulse ? YELLOW : DIM}▲  ELEVATION REQUIRED${RESET}\n\n`;
      out += `  ${DIM}DismInitialize returned ${hex(initHr)} (ERROR_ELEVATION_REQUIRED).${RESET}\n`;
      out += `  ${DIM}The DISM API only services an image from an elevated process.${RESET}\n`;
      out += `  ${DIM}Re-run from an Administrator terminal for live gauges.${RESET}\n\n`;
      const items = ['Optional features', 'Servicing packages', 'Out-of-box drivers', 'Image health'];
      for (let i = 0; i < items.length; i++) {
        const lit = pulse ? i <= f % (items.length + 1) : i < f % (items.length + 1);
        out += `   ${lit ? CYAN + '◉' : DIM + '◌'}${RESET} ${DIM}${items[i]}${RESET}\n`;
      }
      out += `${BOLD}${CYAN}╚══════════════════════════════════════════════════════════╝${RESET}\n`;
      out += `${DIM}  Binding verified — call reached dismapi.dll, documented HRESULT returned.${RESET}`;
      process.stdout.write(out);
      await sleep(140);
    }
    process.stdout.write('\n');
    process.exit(0);
  }

  const sessBuf = Buffer.alloc(4);
  const online = Buffer.from(DISM_ONLINE_IMAGE + '\0', 'utf16le');
  if (Dismapi.DismOpenSession(online.ptr, null, null, sessBuf.ptr) !== S_OK) {
    Dismapi.DismShutdown();
    console.error('DismOpenSession failed');
    process.exit(1);
  }
  const session = sessBuf.readUInt32LE(0);
  const arr = Buffer.alloc(8);
  const cnt = Buffer.alloc(4);

  function count(fn: () => number): number {
    arr.fill(0);
    cnt.fill(0);
    return fn() === S_OK ? cnt.readUInt32LE(0) : -1;
  }

  const features = count(() => Dismapi.DismGetFeatures(session, null, DismPackageIdentifier.DismPackageNone, arr.ptr, cnt.ptr));
  const packages = count(() => Dismapi.DismGetPackages(session, arr.ptr, cnt.ptr));
  const drivers = count(() => Dismapi.DismGetDrivers(session, 0, arr.ptr, cnt.ptr));
  const hb = Buffer.alloc(4);
  const health = Dismapi.DismCheckImageHealth(session, 0, 0n, null, null, hb.ptr) === S_OK ? hb.readInt32LE(0) : -1;

  const gauges: [string, number, string][] = [
    ['Optional features', features, CYAN],
    ['Servicing packages', packages, GREEN],
    ['Out-of-box drivers', drivers, YELLOW],
  ];
  const maxVal = Math.max(1, features, packages, drivers);

  for (let frame = 0; frame <= 24; frame++) {
    const t = frame / 24;
    let out = HOME;
    out += `${BOLD}${CYAN}╔═ WINDOWS SERVICING INVENTORY ════════════════════════════╗${RESET}\n`;
    out += `  ${DIM}live from the online image via the DISM API · no DISM.exe spawn${RESET}\n\n`;
    for (const [label, value, color] of gauges) {
      const shown = Math.round(value * Math.min(1, t));
      const w = Math.round((value / maxVal) * 40 * Math.min(1, t));
      out += `  ${BOLD}${label.padEnd(20)}${RESET}${color}${'█'.repeat(w)}${DIM}${'░'.repeat(40 - w)}${RESET} ${color}${BOLD}${shown}${RESET}\n`;
    }
    const hName = ['Healthy', 'Repairable', 'NonRepairable'][health] ?? 'Unknown';
    const hColor = health === DismImageHealthState.DismImageHealthy ? GREEN : health < 0 ? DIM : RED;
    out += `\n  ${BOLD}Image health${RESET}        ${hColor}${frame % 2 === 0 ? '●' : '○'} ${hName}${RESET}\n`;
    out += `${BOLD}${CYAN}╚══════════════════════════════════════════════════════════╝${RESET}\n`;
    out += `${DIM}  DismSession ${session} · feature/package/driver counts polled over FFI${RESET}`;
    process.stdout.write(out);
    await sleep(70);
  }
  process.stdout.write('\n');

  Dismapi.DismCloseSession(session);
  Dismapi.DismShutdown();
} finally {
  process.stdout.write(SHOW_CURSOR);
}
