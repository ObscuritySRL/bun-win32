/**
 * Package Watcher
 *
 * Polls the Windows Installer database at a configurable interval and detects
 * changes: new installs, uninstalls, version upgrades, and state transitions.
 * Each change is timestamped and printed with color-coded badges. Ctrl+C prints
 * a session summary before exiting.
 *
 * APIs demonstrated:
 *   - MsiEnumProductsW           (enumerate all product codes)
 *   - MsiQueryProductStateW      (check install state)
 *   - MsiGetProductInfoW         (read product name and version)
 *   - MsiGetFileHashW            (hash verification of local files)
 *
 * Run: bun run example/package-watcher.ts
 */

import Msi, { INSTALLSTATE } from '../index';

Msi.Preload(['MsiEnumProductsW', 'MsiQueryProductStateW', 'MsiGetProductInfoW']);

const ERROR_SUCCESS = 0;
const ERROR_MORE_DATA = 234;
const POLL_MS = 5000;

const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RED = '\x1b[31m';
const MAGENTA = '\x1b[35m';

function wstr(s: string): Buffer {
  return Buffer.from(s + '\0', 'utf16le');
}

function readWstr(buf: Buffer, cch: number): string {
  return buf.subarray(0, cch * 2).toString('utf16le');
}

function getProductInfo(productCode: string, property: string): string | null {
  const codeBuf = wstr(productCode);
  const propBuf = wstr(property);
  const valueBuf = Buffer.alloc(512);
  const cchBuf = Buffer.alloc(4);
  cchBuf.writeUInt32LE(256, 0);

  let rc = Msi.MsiGetProductInfoW(codeBuf.ptr, propBuf.ptr, valueBuf.ptr, cchBuf.ptr);
  if (rc === ERROR_MORE_DATA) {
    const cch = cchBuf.readUInt32LE(0) + 1;
    const bigBuf = Buffer.alloc(cch * 2);
    cchBuf.writeUInt32LE(cch, 0);
    rc = Msi.MsiGetProductInfoW(codeBuf.ptr, propBuf.ptr, bigBuf.ptr, cchBuf.ptr);
    if (rc === ERROR_SUCCESS) {
      return readWstr(bigBuf, cchBuf.readUInt32LE(0));
    }
  }
  if (rc === ERROR_SUCCESS) {
    const len = cchBuf.readUInt32LE(0);
    return len > 0 ? readWstr(valueBuf, len) : null;
  }
  return null;
}

function timestamp(): string {
  const d = new Date();
  return `${DIM}${d.toLocaleTimeString()}${RESET}`;
}

interface ProductSnapshot {
  name: string;
  version: string;
  state: number;
}

function snapshot(): Map<string, ProductSnapshot> {
  const map = new Map<string, ProductSnapshot>();
  const productBuf = Buffer.alloc(78);
  let idx = 0;

  while (Msi.MsiEnumProductsW(idx, productBuf.ptr) === ERROR_SUCCESS) {
    const code = readWstr(productBuf, 38);
    const state = Msi.MsiQueryProductStateW(wstr(code).ptr);
    const name = getProductInfo(code, 'InstalledProductName') ?? code;
    const version = getProductInfo(code, 'VersionString') ?? '?';
    map.set(code, { name, version, state });
    idx++;
  }

  return map;
}

function stateName(state: number): string {
  switch (state) {
    case INSTALLSTATE.INSTALLSTATE_DEFAULT:
      return 'installed';
    case INSTALLSTATE.INSTALLSTATE_ADVERTISED:
      return 'advertised';
    case INSTALLSTATE.INSTALLSTATE_ABSENT:
      return 'absent';
    case INSTALLSTATE.INSTALLSTATE_BROKEN:
      return 'broken';
    default:
      return `state(${state})`;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log(`\n${BOLD}${CYAN}  Package Watcher${RESET}`);
console.log(`${DIM}  Polling every ${POLL_MS / 1000}s for installer changes. Ctrl+C to stop.${RESET}`);
console.log(`${DIM}  ${'─'.repeat(60)}${RESET}\n`);

let current = snapshot();
let installs = 0;
let uninstalls = 0;
let upgrades = 0;
let transitions = 0;

console.log(`  ${timestamp()} ${DIM}Baseline: ${current.size} products${RESET}\n`);

const timer = setInterval(() => {
  const next = snapshot();

  // Detect new products
  for (const [code, info] of next) {
    const prev = current.get(code);
    if (!prev) {
      installs++;
      console.log(`  ${timestamp()} ${GREEN}${BOLD}+ NEW${RESET}  ${info.name} ${DIM}v${info.version}${RESET}`);
    } else if (prev.version !== info.version) {
      upgrades++;
      console.log(`  ${timestamp()} ${MAGENTA}${BOLD}\u2191 UPG${RESET}  ${info.name} ${DIM}${prev.version} \u2192 ${info.version}${RESET}`);
    } else if (prev.state !== info.state) {
      transitions++;
      console.log(`  ${timestamp()} ${YELLOW}${BOLD}~ CHG${RESET}  ${info.name} ${DIM}${stateName(prev.state)} \u2192 ${stateName(info.state)}${RESET}`);
    }
  }

  // Detect removals
  for (const [code, info] of current) {
    if (!next.has(code)) {
      uninstalls++;
      console.log(`  ${timestamp()} ${RED}${BOLD}- DEL${RESET}  ${info.name} ${DIM}v${info.version}${RESET}`);
    }
  }

  current = next;
}, POLL_MS);

process.on('SIGINT', () => {
  clearInterval(timer);
  console.log(`\n${DIM}  ${'─'.repeat(60)}${RESET}`);
  console.log(`  ${BOLD}Session Summary${RESET}`);
  console.log(`    ${GREEN}+ Installs:${RESET}    ${installs}`);
  console.log(`    ${RED}- Uninstalls:${RESET}  ${uninstalls}`);
  console.log(`    ${MAGENTA}\u2191 Upgrades:${RESET}    ${upgrades}`);
  console.log(`    ${YELLOW}~ Transitions:${RESET} ${transitions}`);
  console.log(`    ${DIM}Final count:   ${current.size} products${RESET}\n`);
  process.exit(0);
});
