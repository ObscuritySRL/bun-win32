/**
 * Installer Audit
 *
 * Enumerates every MSI-installed product on the system and builds a detailed
 * report: product name, version, publisher, install date, install location,
 * and applied patches. Results are printed in a color-coded table using ANSI
 * escape sequences with aligned columns and summary statistics.
 *
 * APIs demonstrated:
 *   - MsiEnumProductsW           (iterate all product codes)
 *   - MsiQueryProductStateW      (check install state)
 *   - MsiGetProductInfoW         (read product properties)
 *   - MsiEnumPatchesExW          (list applied patches per product)
 *
 * Run: bun run example/installer-audit.ts
 */

import Msi, { INSTALLSTATE, MSIINSTALLCONTEXT, MSIPATCHSTATE } from '../index';

Msi.Preload(['MsiEnumProductsW', 'MsiQueryProductStateW', 'MsiGetProductInfoW', 'MsiEnumPatchesExW']);

const ERROR_SUCCESS = 0;
const ERROR_MORE_DATA = 234;
const ERROR_NO_MORE_ITEMS = 259;

const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const WHITE = '\x1b[37m';
const RED = '\x1b[31m';

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

function formatDate(raw: string | null): string {
  if (!raw || raw.length !== 8) return raw ?? 'Unknown';
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

function stateLabel(state: number): string {
  switch (state) {
    case INSTALLSTATE.INSTALLSTATE_DEFAULT:
      return `${GREEN}Installed${RESET}`;
    case INSTALLSTATE.INSTALLSTATE_ADVERTISED:
      return `${YELLOW}Advertised${RESET}`;
    case INSTALLSTATE.INSTALLSTATE_ABSENT:
      return `${DIM}Absent${RESET}`;
    case INSTALLSTATE.INSTALLSTATE_BROKEN:
      return `${RED}Broken${RESET}`;
    default:
      return `${DIM}Unknown (${state})${RESET}`;
  }
}

function countPatches(productCode: string): number {
  const codeBuf = wstr(productCode);
  const patchBuf = Buffer.alloc(78);
  let count = 0;
  let idx = 0;

  while (
    Msi.MsiEnumPatchesExW(
      codeBuf.ptr,
      null,
      MSIINSTALLCONTEXT.MSIINSTALLCONTEXT_USERUNMANAGED | MSIINSTALLCONTEXT.MSIINSTALLCONTEXT_USERMANAGED | MSIINSTALLCONTEXT.MSIINSTALLCONTEXT_MACHINE,
      MSIPATCHSTATE.MSIPATCHSTATE_APPLIED,
      idx,
      patchBuf.ptr,
      null,
      null,
      null,
      null,
    ) === ERROR_SUCCESS
  ) {
    count++;
    idx++;
  }

  return count;
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log(`\n${BOLD}${CYAN}  MSI Installer Audit${RESET}`);
console.log(`${DIM}  ${'─'.repeat(60)}${RESET}\n`);

interface ProductEntry {
  code: string;
  name: string;
  version: string;
  publisher: string;
  date: string;
  state: number;
  patches: number;
}

const products: ProductEntry[] = [];
const productBuf = Buffer.alloc(78);
let index = 0;

while (Msi.MsiEnumProductsW(index, productBuf.ptr) === ERROR_SUCCESS) {
  const code = readWstr(productBuf, 38);
  const state = Msi.MsiQueryProductStateW(wstr(code).ptr);

  const name = getProductInfo(code, 'InstalledProductName') ?? '(unknown)';
  const version = getProductInfo(code, 'VersionString') ?? '?';
  const publisher = getProductInfo(code, 'Publisher') ?? '?';
  const date = getProductInfo(code, 'InstallDate') ?? '';
  const patches = countPatches(code);

  products.push({ code, name, version, publisher, date, state, patches });
  index++;
}

products.sort((a, b) => a.name.localeCompare(b.name));

const nameW = 40;
const verW = 14;
const pubW = 24;
const dateW = 12;
const stateW = 12;
const patchW = 8;

console.log(`  ${BOLD}${WHITE}${'Product'.padEnd(nameW)}${'Version'.padEnd(verW)}${'Publisher'.padEnd(pubW)}${'Installed'.padEnd(dateW)}${'State'.padEnd(stateW)}${'Patches'.padEnd(patchW)}${RESET}`);
console.log(`  ${DIM}${'─'.repeat(nameW + verW + pubW + dateW + stateW + patchW)}${RESET}`);

for (const p of products) {
  const nm = p.name.length > nameW - 2 ? p.name.slice(0, nameW - 3) + '...' : p.name;
  const pb = p.publisher.length > pubW - 2 ? p.publisher.slice(0, pubW - 3) + '...' : p.publisher;

  console.log(
    `  ${nm.padEnd(nameW)}${DIM}${p.version.padEnd(verW)}${RESET}${pb.padEnd(pubW)}${DIM}${formatDate(p.date).padEnd(dateW)}${RESET}${stateLabel(p.state).padEnd(stateW + 9)}${p.patches > 0 ? YELLOW + p.patches + RESET : DIM + '0' + RESET}`,
  );
}

const installed = products.filter((p) => p.state === INSTALLSTATE.INSTALLSTATE_DEFAULT).length;
const broken = products.filter((p) => p.state === INSTALLSTATE.INSTALLSTATE_BROKEN).length;
const totalPatches = products.reduce((sum, p) => sum + p.patches, 0);

console.log(`\n  ${DIM}${'─'.repeat(60)}${RESET}`);
console.log(`  ${BOLD}Total:${RESET} ${products.length} products  ${GREEN}${installed} installed${RESET}  ${broken > 0 ? RED + broken + ' broken' + RESET + '  ' : ''}${YELLOW}${totalPatches} patches${RESET}\n`);
