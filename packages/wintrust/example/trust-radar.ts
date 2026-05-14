/**
 * Trust Radar
 *
 * An animated ANSI radar sweep that scans every executable in a directory
 * and verifies its Authenticode signature in real time. Each verified file
 * is plotted on a polar grid: angle from filename hash, radius from file
 * size. The sweep arm rotates around the radar while files light up as
 * colored blips as they're verified — green for trusted, red for failed,
 * yellow for unsigned, dim gray for catalog-only.
 *
 * APIs demonstrated:
 *   - WinVerifyTrust                          (Authenticode signature check via WINTRUST_ACTION_GENERIC_VERIFY_V2)
 *   - CryptCATAdminAcquireContext             (open catalog context for catalog-signed lookups)
 *   - CryptCATAdminCalcHashFromFileHandle     (compute the file hash to look up in the catalog DB)
 *   - CryptCATAdminEnumCatalogFromHash        (enumerate matching catalogs)
 *   - CryptCATAdminReleaseCatalogContext      (free the enumerated catalog handle)
 *   - CryptCATAdminReleaseContext             (free the admin context)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - CreateFileW                              (open file handle for catalog hashing)
 *   - CloseHandle                              (close the file handle)
 *   - GetStdHandle / GetConsoleMode / SetConsoleMode (enable ANSI escape processing)
 *
 * WinVerifyTrust return codes (selected):
 *   - 0x00000000                              Trusted
 *   - 0x800B0100  TRUST_E_NOSIGNATURE         No embedded signature (may still be catalog-signed)
 *   - 0x80092003  CRYPT_E_FILE_ERROR          File could not be read
 *   - 0x80096010  TRUST_E_BAD_DIGEST          File modified after signing
 *
 * Run: bun run example/trust-radar.ts
 */

import { closeSync, openSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import Kernel32, { STD_HANDLE } from '@bun-win32/kernel32';

import Wintrust, { DRIVER_ACTION_VERIFY, WINTRUST_ACTION_GENERIC_VERIFY_V2 } from '../index';

Wintrust.Preload(['CryptCATAdminAcquireContext', 'CryptCATAdminCalcHashFromFileHandle', 'CryptCATAdminEnumCatalogFromHash', 'CryptCATAdminReleaseCatalogContext', 'CryptCATAdminReleaseContext', 'WinVerifyTrust']);

const SCAN_DIR = process.argv[2] ?? 'C:\\Windows\\System32';
const MAX_FILES = parseInt(process.argv[3] ?? '120', 10);

const ESC = '\x1b[';
const RESET = `${ESC}0m`;
const HIDE_CURSOR = `${ESC}?25l`;
const SHOW_CURSOR = `${ESC}?25h`;
const CLEAR_SCREEN = `${ESC}2J${ESC}H`;

const COLOR = {
  trusted: `${ESC}38;5;46m`,
  catalog: `${ESC}38;5;39m`,
  unsigned: `${ESC}38;5;220m`,
  failed: `${ESC}38;5;196m`,
  modified: `${ESC}38;5;201m`,
  arm: `${ESC}38;5;51m`,
  grid: `${ESC}38;5;238m`,
  label: `${ESC}38;5;245m`,
  title: `${ESC}38;5;231;1m`,
};

enum TrustState {
  Trusted,
  Catalog,
  Unsigned,
  Failed,
  Modified,
}

interface Blip {
  name: string;
  state: TrustState;
  angle: number; // radians
  radius: number; // 0..1
  ticksAlive: number;
}

// Enable ANSI escape processing on the active console.
function enableAnsi(): void {
  const hStdout = Kernel32.GetStdHandle(STD_HANDLE.OUTPUT);
  const modeBuf = Buffer.alloc(4);
  if (Kernel32.GetConsoleMode(hStdout, modeBuf.ptr!)) {
    Kernel32.SetConsoleMode(hStdout, modeBuf.readUInt32LE(0) | 0x0004);
  }
}

// FNV-1a 32-bit hash of a string — used purely to spread blips across the radar.
function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Build a WINTRUST_FILE_INFO + WINTRUST_DATA pair and invoke WinVerifyTrust.
// Returns the raw LONG status. 0 = trusted, anything else = a failure code.
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

// Catalog-lookup fallback: compute the file's SHA hash and ask CryptCATAdmin
// whether any installed catalog vouches for it. Returns true if found.
function inCatalog(hCatAdmin: bigint, path: string): boolean {
  const pathBuf = Buffer.from(path + '\0', 'utf16le');
  // CreateFileW(path, GENERIC_READ, FILE_SHARE_READ|FILE_SHARE_WRITE, NULL, OPEN_EXISTING, 0, NULL)
  const hFile = Kernel32.CreateFileW(pathBuf.ptr!, 0x80000000, 0x00000003, null!, 3, 0, 0n);
  if (hFile === -1n || hFile === 0xffffffffffffffffn) return false;
  try {
    const sizeBuf = Buffer.alloc(4);
    sizeBuf.writeUInt32LE(64, 0);
    let ok = Wintrust.CryptCATAdminCalcHashFromFileHandle(hFile, sizeBuf.ptr!, null, 0);
    const hashLen = sizeBuf.readUInt32LE(0);
    if (!hashLen) return false;
    const hashBuf = Buffer.alloc(hashLen);
    ok = Wintrust.CryptCATAdminCalcHashFromFileHandle(hFile, sizeBuf.ptr!, hashBuf.ptr!, 0);
    if (!ok) return false;
    const hCat = Wintrust.CryptCATAdminEnumCatalogFromHash(hCatAdmin, hashBuf.ptr!, hashLen, 0, null);
    if (hCat && hCat !== 0n) {
      Wintrust.CryptCATAdminReleaseCatalogContext(hCatAdmin, hCat, 0);
      return true;
    }
    return false;
  } finally {
    Kernel32.CloseHandle(hFile);
  }
}

function classify(path: string, hCatAdmin: bigint): TrustState {
  const status = verifyEmbedded(path) >>> 0;
  if (status === 0) return TrustState.Trusted;
  if (status === 0x80096010) return TrustState.Modified;
  if (status === 0x800b0100 || status === 0x80092003) {
    return inCatalog(hCatAdmin, path) ? TrustState.Catalog : TrustState.Unsigned;
  }
  return TrustState.Failed;
}

function colorFor(state: TrustState): string {
  switch (state) {
    case TrustState.Trusted:
      return COLOR.trusted;
    case TrustState.Catalog:
      return COLOR.catalog;
    case TrustState.Unsigned:
      return COLOR.unsigned;
    case TrustState.Failed:
      return COLOR.failed;
    case TrustState.Modified:
      return COLOR.modified;
  }
}

function glyphFor(state: TrustState): string {
  switch (state) {
    case TrustState.Trusted:
      return '●';
    case TrustState.Catalog:
      return '◆';
    case TrustState.Unsigned:
      return '○';
    case TrustState.Failed:
      return '✕';
    case TrustState.Modified:
      return '!';
  }
}

function listExes(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (out.length >= MAX_FILES) break;
    if (!/\.(exe|dll|sys)$/i.test(entry)) continue;
    const full = join(dir, entry);
    try {
      if (statSync(full).isFile()) out.push(full);
    } catch {}
  }
  return out;
}

function drawFrame(blips: Blip[], armAngle: number, scanned: number, total: number, width: number, height: number): string {
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const r = Math.min(cx, cy) - 2;
  const grid: string[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => ' '));

  // Concentric grid rings.
  for (let i = 1; i <= 3; i++) {
    const ring = (r * i) / 3;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 60) {
      const x = cx + Math.round(Math.cos(a) * ring * 2);
      const y = cy + Math.round(Math.sin(a) * ring);
      if (x >= 0 && x < width && y >= 0 && y < height) grid[y]![x] = `${COLOR.grid}·${RESET}`;
    }
  }
  grid[cy]![cx] = `${COLOR.grid}+${RESET}`;

  // Sweep arm.
  for (let t = 0; t <= r; t += 0.5) {
    const x = cx + Math.round(Math.cos(armAngle) * t * 2);
    const y = cy + Math.round(Math.sin(armAngle) * t);
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const fade = 1 - t / r;
      const c = fade > 0.6 ? COLOR.arm : COLOR.grid;
      grid[y]![x] = `${c}·${RESET}`;
    }
  }

  // Plot blips.
  for (const b of blips) {
    const x = cx + Math.round(Math.cos(b.angle) * b.radius * r * 2);
    const y = cy + Math.round(Math.sin(b.angle) * b.radius * r);
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const pulse = b.ticksAlive < 4 ? '\x1b[1m' : '';
      grid[y]![x] = `${pulse}${colorFor(b.state)}${glyphFor(b.state)}${RESET}`;
    }
  }

  const rows = grid.map((row) => row.join(''));
  const title = `${COLOR.title}TRUST RADAR${RESET}  ${COLOR.label}${SCAN_DIR}${RESET}`;
  const progress = `${COLOR.label}scanned ${scanned}/${total}${RESET}`;
  const counts = countLabels(blips);
  return `${CLEAR_SCREEN}${title}\n${progress}    ${counts}\n${rows.join('\n')}\n`;
}

function countLabels(blips: Blip[]): string {
  const c = { trusted: 0, catalog: 0, unsigned: 0, failed: 0, modified: 0 };
  for (const b of blips) {
    if (b.state === TrustState.Trusted) c.trusted++;
    else if (b.state === TrustState.Catalog) c.catalog++;
    else if (b.state === TrustState.Unsigned) c.unsigned++;
    else if (b.state === TrustState.Failed) c.failed++;
    else c.modified++;
  }
  return `${colorFor(TrustState.Trusted)}● ${c.trusted}${RESET}  ${colorFor(TrustState.Catalog)}◆ ${c.catalog}${RESET}  ${colorFor(TrustState.Unsigned)}○ ${c.unsigned}${RESET}  ${colorFor(TrustState.Failed)}✕ ${c.failed}${RESET}  ${colorFor(TrustState.Modified)}! ${c.modified}${RESET}`;
}

async function main(): Promise<void> {
  enableAnsi();
  process.stdout.write(HIDE_CURSOR);

  const phCatAdmin = Buffer.alloc(8);
  const acquired = Wintrust.CryptCATAdminAcquireContext(phCatAdmin.ptr!, DRIVER_ACTION_VERIFY.ptr!, 0);
  if (!acquired) {
    process.stdout.write(SHOW_CURSOR);
    console.error('Failed to acquire catalog admin context');
    process.exit(1);
  }
  const hCatAdmin = phCatAdmin.readBigUInt64LE(0);

  const files = listExes(SCAN_DIR);
  const blips: Blip[] = [];

  // 80x24 default; query the real terminal size if available.
  const width = Math.min(process.stdout.columns ?? 100, 100);
  const height = Math.min(process.stdout.rows ?? 24, 24);

  let armAngle = 0;
  let scanned = 0;
  const exit = (): void => {
    process.stdout.write(SHOW_CURSOR + '\n');
    Wintrust.CryptCATAdminReleaseContext(hCatAdmin, 0);
  };
  process.on('SIGINT', () => {
    exit();
    process.exit(0);
  });

  try {
    for (const file of files) {
      const state = classify(file, hCatAdmin);
      const h = hashString(file);
      const angle = ((h & 0xffff) / 0xffff) * Math.PI * 2;
      const sz = (() => {
        try {
          return statSync(file).size;
        } catch {
          return 1;
        }
      })();
      const radius = Math.min(0.95, 0.2 + Math.log10(sz + 1) / 10);
      blips.push({ name: file, state, angle, radius, ticksAlive: 0 });
      scanned++;

      for (let frame = 0; frame < 3; frame++) {
        armAngle = (armAngle + Math.PI / 18) % (Math.PI * 2);
        for (const b of blips) b.ticksAlive++;
        process.stdout.write(drawFrame(blips, armAngle, scanned, files.length, width, height));
        await Bun.sleep(20);
      }
    }
    // Final settle frames so blips don't all pulse at once.
    for (let frame = 0; frame < 36; frame++) {
      armAngle = (armAngle + Math.PI / 18) % (Math.PI * 2);
      for (const b of blips) b.ticksAlive++;
      process.stdout.write(drawFrame(blips, armAngle, scanned, files.length, width, height));
      await Bun.sleep(40);
    }
  } finally {
    exit();
  }
}

void main();
