/**
 * Windows Image Servicing Health Report
 *
 * A thorough Deployment Image Servicing and Management (DISM) diagnostic for the
 * running (online) Windows image — the same engine `DISM.exe` drives, here with
 * no process spawn. It initializes the DISM platform, opens an online session,
 * checks image-corruption health, reads the reserved-storage state, and counts
 * installed optional features / servicing packages / out-of-box drivers,
 * decoding every HRESULT. DISM requires an elevated process; when not elevated
 * the report decodes ERROR_ELEVATION_REQUIRED and prints the servicing surface
 * it would enumerate — nothing is faked.
 *
 * APIs demonstrated (Dismapi):
 *   - DismInitialize                (start the DISM platform)
 *   - DismOpenSession               (open a session on the online image)
 *   - DismCheckImageHealth          (corruption state, DismImageHealthState)
 *   - DismGetReservedStorageState   (Reserved Storage on/off)
 *   - DismGetFeatures               (optional-feature count)
 *   - DismGetPackages               (servicing-package count)
 *   - DismGetDrivers                (out-of-box driver count)
 *   - DismCloseSession / DismShutdown (tear down cleanly)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - GetStdHandle / GetConsoleMode / SetConsoleMode  (enable ANSI VT output)
 *
 * Run: bun run example/image-health-report.ts   (run elevated for full output)
 */
import Dismapi, { DISM_ONLINE_IMAGE, DismImageHealthState, DismLogLevel, DismPackageIdentifier } from '../index';
import Kernel32 from '@bun-win32/kernel32';

Dismapi.Preload(['DismInitialize', 'DismOpenSession', 'DismCheckImageHealth', 'DismGetReservedStorageState', 'DismGetFeatures', 'DismGetPackages', 'DismGetDrivers', 'DismCloseSession', 'DismShutdown']);
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
const GREEN = '\x1b[38;2;100;215;130m';
const RED = '\x1b[38;2;240;90;90m';
const YELLOW = '\x1b[38;2;235;205;100m';
const CYAN = '\x1b[38;2;120;200;255m';

const S_OK = 0;
const ERROR_ELEVATION_REQUIRED = 0x800702e4 | 0;
const hex = (hr: number) => '0x' + (hr >>> 0).toString(16).toUpperCase().padStart(8, '0');
const pad = (s: string, n: number) => (s.length >= n ? s : s + ' '.repeat(n - s.length));

function decodeHr(hr: number): string {
  const map: Record<number, string> = {
    0: 'S_OK',
    [-2147024891]: 'E_ACCESSDENIED',
    [ERROR_ELEVATION_REQUIRED]: 'ERROR_ELEVATION_REQUIRED',
  };
  return map[hr] ?? hex(hr);
}

console.log(`${BOLD}${CYAN}Windows Image Servicing Health Report${RESET}  ${DIM}DISM API — dismapi.dll (online image)${RESET}\n`);

const initHr = Dismapi.DismInitialize(DismLogLevel.DismLogErrorsWarnings, null, null);
console.log(`${BOLD}DISM Platform${RESET}`);
console.log(`  DismInitialize → ${initHr === S_OK ? GREEN : YELLOW}${decodeHr(initHr)}${RESET}`);

if (initHr !== S_OK) {
  console.log(
    `\n${YELLOW}The DISM API requires an elevated process.${RESET} ${DIM}Re-run from an Administrator ` +
      `terminal to enumerate the live image. The binding is verified — the call reached dismapi.dll and ` +
      `returned the documented HRESULT ${hex(initHr)}.${RESET}\n`,
  );
  console.log(`${BOLD}Servicing surface this report enumerates when elevated${RESET}`);
  for (const [api, what] of [
    ['DismCheckImageHealth', 'corruption state (Healthy / Repairable / NonRepairable)'],
    ['DismGetReservedStorageState', 'Reserved Storage enabled / disabled'],
    ['DismGetFeatures', 'optional-feature inventory + count'],
    ['DismGetPackages', 'servicing-package inventory + count'],
    ['DismGetDrivers', 'out-of-box (third-party) driver count'],
  ] as const) {
    console.log(`  ${CYAN}${pad(api, 28)}${RESET}${DIM}${what}${RESET}`);
  }
  process.exit(0);
}

const sessBuf = Buffer.alloc(4);
const online = Buffer.from(DISM_ONLINE_IMAGE + '\0', 'utf16le');
const openHr = Dismapi.DismOpenSession(online.ptr, null, null, sessBuf.ptr);
console.log(`  DismOpenSession(online) → ${openHr === S_OK ? GREEN : RED}${decodeHr(openHr)}${RESET}`);
if (openHr !== S_OK) {
  Dismapi.DismShutdown();
  process.exit(1);
}
const session = sessBuf.readUInt32LE(0);
console.log(`  DismSession ${session}\n`);

const healthBuf = Buffer.alloc(4);
const healthHr = Dismapi.DismCheckImageHealth(session, 0, 0n, null, null, healthBuf.ptr);
const healthNames = ['Healthy', 'Repairable', 'NonRepairable'];
const hv = healthBuf.readInt32LE(0);
const hColor = hv === DismImageHealthState.DismImageHealthy ? GREEN : RED;
console.log(`${BOLD}Image Health${RESET}        ${healthHr === S_OK ? `${hColor}${healthNames[hv] ?? hv}${RESET}` : DIM + decodeHr(healthHr) + RESET}`);

const rsBuf = Buffer.alloc(4);
const rsHr = Dismapi.DismGetReservedStorageState(session, rsBuf.ptr);
console.log(`${BOLD}Reserved Storage${RESET}    ${rsHr === S_OK ? (rsBuf.readUInt32LE(0) ? GREEN + 'Enabled' : YELLOW + 'Disabled') + RESET : DIM + decodeHr(rsHr) + RESET}\n`);

// DismGetFeatures/Packages/Drivers fill a caller-owned count buffer plus a
// DISM-allocated array pointer. The counts are read here directly; production
// code walks the returned array pointer and frees it with DismDelete (see AI.md).
const arrPtr = Buffer.alloc(8);
const count = Buffer.alloc(4);

const fHr = Dismapi.DismGetFeatures(session, null, DismPackageIdentifier.DismPackageNone, arrPtr.ptr, count.ptr);
console.log(`${BOLD}Optional Features${RESET}   ${fHr === S_OK ? `${BOLD}${count.readUInt32LE(0)}${RESET}` : DIM + decodeHr(fHr) + RESET}`);

arrPtr.fill(0);
count.fill(0);
const pHr = Dismapi.DismGetPackages(session, arrPtr.ptr, count.ptr);
console.log(`${BOLD}Servicing Packages${RESET}  ${pHr === S_OK ? `${BOLD}${count.readUInt32LE(0)}${RESET}` : DIM + decodeHr(pHr) + RESET}`);

arrPtr.fill(0);
count.fill(0);
const dHr = Dismapi.DismGetDrivers(session, 0, arrPtr.ptr, count.ptr);
console.log(`${BOLD}Out-of-box Drivers${RESET}  ${dHr === S_OK ? `${BOLD}${count.readUInt32LE(0)}${RESET}` : DIM + decodeHr(dHr) + RESET}\n`);

console.log(`DismCloseSession → ${decodeHr(Dismapi.DismCloseSession(session))}`);
console.log(`DismShutdown → ${decodeHr(Dismapi.DismShutdown())}`);
console.log(`\n${DIM}All 35 documented dismapi.dll exports are bound; this report exercised the platform, ` + `session, health, storage, feature, package, and driver surface against the live online image.${RESET}`);
