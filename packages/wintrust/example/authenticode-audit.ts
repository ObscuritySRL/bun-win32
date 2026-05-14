/**
 * Authenticode Audit
 *
 * A thorough Authenticode signature audit for a directory tree. Walks every
 * .exe/.dll/.sys file, runs WinVerifyTrust, falls back to a CryptCATAdmin
 * catalog lookup for files without an embedded signature, and prints an
 * aligned table — file path, size, trust state, status code, catalog name,
 * and a SHA hash preview. A summary block at the bottom shows counts and
 * percentages by status with horizontal bar gauges.
 *
 * APIs demonstrated:
 *   - WinVerifyTrust                          (Authenticode signature check)
 *   - CryptCATAdminAcquireContext             (catalog admin context)
 *   - CryptCATAdminCalcHashFromFileHandle     (file hash for catalog lookup)
 *   - CryptCATAdminEnumCatalogFromHash        (find catalog containing hash)
 *   - CryptCATCatalogInfoFromContext          (catalog filename from context)
 *   - CryptCATAdminReleaseCatalogContext      (free catalog context)
 *   - CryptCATAdminReleaseContext             (free admin context)
 *   - WintrustGetRegPolicyFlags               (report the current policy flags)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - CreateFileW                              (open file for catalog hashing)
 *   - CloseHandle                              (close handle)
 *   - GetConsoleScreenBufferInfo               (terminal width for bar widths)
 *   - GetStdHandle / GetConsoleMode / SetConsoleMode (enable ANSI processing)
 *
 * Run: bun run example/authenticode-audit.ts [directory] [maxFiles]
 *   default: C:\Windows\System32, 200 files
 */

import { readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

import Kernel32, { STD_HANDLE } from '@bun-win32/kernel32';

import Wintrust, { DRIVER_ACTION_VERIFY, WINTRUST_ACTION_GENERIC_VERIFY_V2, WintrustPolicyFlag } from '../index';

Wintrust.Preload([
  'CryptCATAdminAcquireContext',
  'CryptCATAdminCalcHashFromFileHandle',
  'CryptCATAdminEnumCatalogFromHash',
  'CryptCATAdminReleaseCatalogContext',
  'CryptCATAdminReleaseContext',
  'CryptCATCatalogInfoFromContext',
  'WinVerifyTrust',
  'WintrustGetRegPolicyFlags',
]);

const SCAN_DIR = process.argv[2] ?? 'C:\\Windows\\System32';
const MAX_FILES = parseInt(process.argv[3] ?? '200', 10);

const ESC = '\x1b[';
const RESET = `${ESC}0m`;
const BOLD = `${ESC}1m`;
const DIM = `${ESC}2m`;
const C = {
  green: `${ESC}38;5;46m`,
  blue: `${ESC}38;5;39m`,
  yellow: `${ESC}38;5;220m`,
  red: `${ESC}38;5;196m`,
  magenta: `${ESC}38;5;201m`,
  cyan: `${ESC}38;5;51m`,
  gray: `${ESC}38;5;245m`,
  darkGray: `${ESC}38;5;238m`,
  white: `${ESC}38;5;231m`,
};

// Selected WinVerifyTrust / CRYPT_E_* status codes — names from winerror.h.
const STATUS_NAMES: Record<number, string> = {
  0x00000000: 'OK',
  0x80092003: 'CRYPT_E_FILE_ERROR',
  0x80092009: 'CRYPT_E_NO_MATCH',
  0x80092026: 'CRYPT_E_SECURITY_SETTINGS',
  0x80096010: 'TRUST_E_BAD_DIGEST',
  0x800b0001: 'TRUST_E_PROVIDER_UNKNOWN',
  0x800b0003: 'TRUST_E_SUBJECT_FORM_UNKNOWN',
  0x800b0004: 'TRUST_E_SUBJECT_NOT_TRUSTED',
  0x800b010a: 'CERT_E_CHAINING',
  0x800b010b: 'TRUST_E_FAIL',
  0x800b010c: 'TRUST_E_EXPLICIT_DISTRUST',
  0x800b0100: 'TRUST_E_NOSIGNATURE',
  0x800b0101: 'CERT_E_EXPIRED',
  0x800b0109: 'CERT_E_UNTRUSTEDROOT',
};

type Status = 'TRUSTED' | 'CATALOG' | 'UNSIGNED' | 'MODIFIED' | 'EXPIRED' | 'UNTRUSTED' | 'ERROR';

interface Row {
  path: string;
  sizeBytes: number;
  status: Status;
  codeHex: string;
  codeName: string;
  catalog: string;
  hashPreview: string;
}

function enableAnsi(): void {
  const hStdout = Kernel32.GetStdHandle(STD_HANDLE.OUTPUT);
  const modeBuf = Buffer.alloc(4);
  if (Kernel32.GetConsoleMode(hStdout, modeBuf.ptr!)) {
    Kernel32.SetConsoleMode(hStdout, modeBuf.readUInt32LE(0) | 0x0004);
  }
}

function consoleWidth(): number {
  return Math.max(80, Math.min(process.stdout.columns ?? 120, 160));
}

function formatBytes(n: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function verifyEmbedded(path: string): number {
  const pathBuf = Buffer.from(path + '\0', 'utf16le');
  const fileInfo = Buffer.alloc(32);
  fileInfo.writeUInt32LE(32, 0);
  fileInfo.writeBigUInt64LE(BigInt(pathBuf.ptr!), 8);
  const trustData = Buffer.alloc(88);
  trustData.writeUInt32LE(88, 0);
  trustData.writeUInt32LE(2, 24); // WTD_UI_NONE
  trustData.writeUInt32LE(0, 28); // WTD_REVOKE_NONE
  trustData.writeUInt32LE(1, 32); // WTD_CHOICE_FILE
  trustData.writeBigUInt64LE(BigInt(fileInfo.ptr!), 40);
  return Wintrust.WinVerifyTrust(-1n, WINTRUST_ACTION_GENERIC_VERIFY_V2.ptr!, trustData.ptr!);
}

// Returns [catalogFileName | '', hashHex | ''] when a catalog covers this file.
function catalogLookup(hCatAdmin: bigint, path: string): [string, string] {
  const pathBuf = Buffer.from(path + '\0', 'utf16le');
  const hFile = Kernel32.CreateFileW(pathBuf.ptr!, 0x80000000, 0x00000003, null!, 3, 0, 0n);
  if (hFile === -1n || hFile === 0xffffffffffffffffn) return ['', ''];
  try {
    const sizeBuf = Buffer.alloc(4);
    sizeBuf.writeUInt32LE(64, 0);
    if (!Wintrust.CryptCATAdminCalcHashFromFileHandle(hFile, sizeBuf.ptr!, null, 0)) return ['', ''];
    const hashLen = sizeBuf.readUInt32LE(0);
    if (!hashLen) return ['', ''];
    const hashBuf = Buffer.alloc(hashLen);
    if (!Wintrust.CryptCATAdminCalcHashFromFileHandle(hFile, sizeBuf.ptr!, hashBuf.ptr!, 0)) return ['', ''];
    const hashHex = hashBuf.toString('hex');
    const hCat = Wintrust.CryptCATAdminEnumCatalogFromHash(hCatAdmin, hashBuf.ptr!, hashLen, 0, null);
    if (!hCat || hCat === 0n) return ['', hashHex];
    // CATALOG_INFO: DWORD cbStruct + WCHAR[MAX_PATH] wszCatalogFile. 4 + 2*260 = 524.
    const catInfo = Buffer.alloc(524);
    catInfo.writeUInt32LE(524, 0);
    let catName = '';
    if (Wintrust.CryptCATCatalogInfoFromContext(hCat, catInfo.ptr!, 0)) {
      const widePath = catInfo.subarray(4);
      const text = new TextDecoder('utf-16').decode(widePath);
      catName = basename(text.replace(/\0.*$/, ''));
    }
    Wintrust.CryptCATAdminReleaseCatalogContext(hCatAdmin, hCat, 0);
    return [catName, hashHex];
  } finally {
    Kernel32.CloseHandle(hFile);
  }
}

function classify(status: number, catalog: string): Status {
  const c = status >>> 0;
  if (c === 0) return 'TRUSTED';
  if (c === 0x80096010) return 'MODIFIED';
  if (c === 0x800b0101) return 'EXPIRED';
  if (c === 0x800b010c || c === 0x800b010a || c === 0x800b0109 || c === 0x800b0004) return 'UNTRUSTED';
  if (c === 0x800b0100 || c === 0x80092003) return catalog ? 'CATALOG' : 'UNSIGNED';
  return 'ERROR';
}

function statusColor(s: Status): string {
  switch (s) {
    case 'TRUSTED':
      return C.green;
    case 'CATALOG':
      return C.blue;
    case 'UNSIGNED':
      return C.yellow;
    case 'MODIFIED':
      return C.magenta;
    case 'EXPIRED':
      return C.yellow;
    case 'UNTRUSTED':
      return C.red;
    case 'ERROR':
      return C.red;
  }
}

function statusGlyph(s: Status): string {
  switch (s) {
    case 'TRUSTED':
      return '✓';
    case 'CATALOG':
      return '◆';
    case 'UNSIGNED':
      return '○';
    case 'MODIFIED':
      return '!';
    case 'EXPIRED':
      return '⌛';
    case 'UNTRUSTED':
      return '✕';
    case 'ERROR':
      return '?';
  }
}

function statusName(c: number): string {
  const n = STATUS_NAMES[c >>> 0];
  return n ?? `0x${(c >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}

function listFiles(dir: string, limit: number): string[] {
  const out: string[] = [];
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (out.length >= limit) break;
    if (!/\.(exe|dll|sys)$/i.test(entry)) continue;
    const full = join(dir, entry);
    try {
      if (statSync(full).isFile()) out.push(full);
    } catch {}
  }
  return out;
}

function pad(s: string, n: number): string {
  // Account for ANSI escape bytes when measuring visible width.
  const visible = s.replace(/\x1b\[[0-9;]*m/g, '');
  if (visible.length >= n) return s;
  return s + ' '.repeat(n - visible.length);
}

function bar(filled: number, total: number, width: number): string {
  const ratio = total === 0 ? 0 : filled / total;
  const cells = Math.round(ratio * width);
  return '█'.repeat(cells) + `${C.darkGray}` + '░'.repeat(width - cells) + RESET;
}

function decodePolicyFlags(flags: number): string {
  const names: string[] = [];
  for (const [name, value] of Object.entries(WintrustPolicyFlag)) {
    if (typeof value === 'number' && (flags & value) === value) {
      names.push(name);
    }
  }
  return names.length ? names.join(' | ') : '<none>';
}

async function main(): Promise<void> {
  enableAnsi();
  const width = consoleWidth();

  // System-wide policy flags as captured at audit start.
  const flagsBuf = Buffer.alloc(4);
  Wintrust.WintrustGetRegPolicyFlags(flagsBuf.ptr!);
  const policyFlags = flagsBuf.readUInt32LE(0);

  const phCatAdmin = Buffer.alloc(8);
  if (!Wintrust.CryptCATAdminAcquireContext(phCatAdmin.ptr!, DRIVER_ACTION_VERIFY.ptr!, 0)) {
    console.error('Failed to acquire catalog admin context');
    process.exit(1);
  }
  const hCatAdmin = phCatAdmin.readBigUInt64LE(0);

  const files = listFiles(SCAN_DIR, MAX_FILES);
  if (files.length === 0) {
    console.error(`No matching files found in ${SCAN_DIR}`);
    Wintrust.CryptCATAdminReleaseContext(hCatAdmin, 0);
    process.exit(1);
  }

  console.log(`${BOLD}${C.white}Authenticode Audit${RESET}  ${C.gray}${SCAN_DIR}${RESET}`);
  console.log(`${C.gray}Policy flags 0x${policyFlags.toString(16).padStart(8, '0')}: ${decodePolicyFlags(policyFlags)}${RESET}`);
  console.log();

  // Column widths.
  const nameWidth = Math.min(36, Math.floor(width * 0.32));
  const sizeWidth = 10;
  const statusWidth = 10;
  const codeWidth = 26;
  const catalogWidth = Math.max(16, Math.floor(width * 0.18));
  const hashWidth = Math.max(10, width - nameWidth - sizeWidth - statusWidth - codeWidth - catalogWidth - 10);

  const header = `${BOLD}` + pad('FILE', nameWidth) + ' ' + pad('SIZE', sizeWidth) + ' ' + pad('STATUS', statusWidth) + ' ' + pad('CODE', codeWidth) + ' ' + pad('CATALOG', catalogWidth) + ' ' + pad('SHA', hashWidth) + RESET;
  console.log(header);
  console.log(`${C.darkGray}${'─'.repeat(width)}${RESET}`);

  const rows: Row[] = [];
  const counts: Record<Status, number> = { TRUSTED: 0, CATALOG: 0, UNSIGNED: 0, MODIFIED: 0, EXPIRED: 0, UNTRUSTED: 0, ERROR: 0 };
  let bytesScanned = 0;

  const t0 = Bun.nanoseconds();

  for (const file of files) {
    let size = 0;
    try {
      size = statSync(file).size;
    } catch {}
    bytesScanned += size;

    const code = verifyEmbedded(file);
    let catalog = '';
    let hashHex = '';
    if (code !== 0) {
      [catalog, hashHex] = catalogLookup(hCatAdmin, file);
    }
    const status = classify(code, catalog);
    counts[status]++;

    const row: Row = {
      path: file,
      sizeBytes: size,
      status,
      codeHex: `0x${(code >>> 0).toString(16).padStart(8, '0').toUpperCase()}`,
      codeName: statusName(code),
      catalog,
      hashPreview: hashHex ? hashHex.slice(0, hashWidth - 1) : '—',
    };
    rows.push(row);

    const name = basename(file);
    const nameStr = name.length > nameWidth - 1 ? name.slice(0, nameWidth - 2) + '…' : name;
    const statusStr = `${statusColor(status)}${statusGlyph(status)} ${status}${RESET}`;
    const codeStr = code === 0 ? `${C.gray}${row.codeName}${RESET}` : `${C.gray}${row.codeHex} ${row.codeName}${RESET}`;
    const catStr = catalog ? `${C.cyan}${catalog.length > catalogWidth - 1 ? catalog.slice(0, catalogWidth - 2) + '…' : catalog}${RESET}` : `${C.darkGray}—${RESET}`;
    const hashStr = hashHex ? `${C.darkGray}${row.hashPreview}${RESET}` : `${C.darkGray}—${RESET}`;

    console.log(pad(nameStr, nameWidth) + ' ' + pad(`${C.gray}${formatBytes(size)}${RESET}`, sizeWidth) + ' ' + pad(statusStr, statusWidth) + ' ' + pad(codeStr, codeWidth) + ' ' + pad(catStr, catalogWidth) + ' ' + hashStr);
  }

  const elapsedSec = (Bun.nanoseconds() - t0) / 1e9;

  console.log(`${C.darkGray}${'─'.repeat(width)}${RESET}`);
  console.log();
  console.log(`${BOLD}${C.white}Summary${RESET}`);
  console.log(`${C.gray}Audited ${rows.length} files, ${formatBytes(bytesScanned)} in ${elapsedSec.toFixed(2)}s (${(rows.length / elapsedSec).toFixed(1)} files/sec)${RESET}`);
  console.log();

  const total = rows.length || 1;
  const order: Status[] = ['TRUSTED', 'CATALOG', 'UNSIGNED', 'MODIFIED', 'EXPIRED', 'UNTRUSTED', 'ERROR'];
  const barWidth = Math.max(20, Math.min(width - 40, 60));
  for (const status of order) {
    const n = counts[status];
    const pct = ((n / total) * 100).toFixed(1);
    const label = `${statusColor(status)}${statusGlyph(status)} ${pad(status, 10)}${RESET}`;
    const countStr = `${C.gray}${String(n).padStart(4)} (${pct.padStart(5)}%)${RESET}`;
    console.log(`${label} ${countStr}  ${statusColor(status)}${bar(n, total, barWidth)}${RESET}`);
  }

  console.log();
  const trusted = counts.TRUSTED + counts.CATALOG;
  const trustPct = ((trusted / total) * 100).toFixed(1);
  console.log(`${BOLD}Trusted total:${RESET} ${C.green}${trusted}/${total} (${trustPct}%)${RESET}`);

  Wintrust.CryptCATAdminReleaseContext(hCatAdmin, 0);
}

void main();
