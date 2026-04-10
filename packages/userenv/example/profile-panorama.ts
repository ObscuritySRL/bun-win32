/**
 * Profile Panorama
 *
 * Queries the Windows user profile infrastructure to discover all standard
 * profile directories, counts their entries, and renders a colorful ANSI
 * panorama showing the profile directory tree with entry counts and
 * current profile type badges.
 *
 * APIs demonstrated:
 *   - Userenv.GetProfilesDirectoryW            (root profiles directory)
 *   - Userenv.GetAllUsersProfileDirectoryW      (shared ProgramData path)
 *   - Userenv.GetDefaultUserProfileDirectoryW   (default user template path)
 *   - Userenv.GetUserProfileDirectoryW          (current user profile path)
 *   - Userenv.GetProfileType                    (profile type flags)
 *
 * Run: bun run example/profile-panorama.ts
 */

import { readdirSync } from 'node:fs';
import { dlopen, FFIType, type Pointer } from 'bun:ffi';

import Userenv, { PT_MANDATORY, PT_ROAMING, PT_ROAMING_PREEXISTING, PT_TEMPORARY } from '../index';
import Kernel32 from '@bun-win32/kernel32';

Userenv.Preload([
  'GetAllUsersProfileDirectoryW',
  'GetDefaultUserProfileDirectoryW',
  'GetProfileType',
  'GetProfilesDirectoryW',
  'GetUserProfileDirectoryW',
]);
Kernel32.Preload(['CloseHandle', 'GetCurrentProcess', 'GetLastError']);

const ANSI = {
  blue: '\x1b[94m',
  bold: '\x1b[1m',
  cyan: '\x1b[96m',
  dim: '\x1b[2m',
  green: '\x1b[92m',
  magenta: '\x1b[95m',
  red: '\x1b[91m',
  reset: '\x1b[0m',
  white: '\x1b[97m',
  yellow: '\x1b[93m',
} as const;

const TOKEN_QUERY = 0x0008;

function getCurrentUserToken(): bigint {
  const { symbols: adv } = dlopen('advapi32.dll', {
    OpenProcessToken: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
  });
  const buf = Buffer.alloc(8);
  const ok = adv.OpenProcessToken(Kernel32.GetCurrentProcess(), TOKEN_QUERY, buf.ptr);
  if (ok === 0) throw new Error(`OpenProcessToken failed (${Kernel32.GetLastError()})`);
  return buf.readBigUInt64LE(0);
}

function queryDirectory(query: (dir: Pointer | null, size: Pointer) => number): string {
  const sizeBuf = Buffer.alloc(4);
  sizeBuf.writeUInt32LE(0, 0);
  query(null, sizeBuf.ptr);
  const charCount = sizeBuf.readUInt32LE(0);
  if (charCount === 0) throw new Error('Size query returned 0');
  const pathBuf = Buffer.alloc(charCount * 2);
  sizeBuf.writeUInt32LE(charCount, 0);
  const result = query(pathBuf.ptr, sizeBuf.ptr);
  if (result === 0) throw new Error(`Directory query failed (${Kernel32.GetLastError()})`);
  return pathBuf.toString('utf16le').replace(/\0.*$/, '');
}

function countEntries(dir: string): number {
  try {
    return readdirSync(dir).length;
  } catch {
    return -1;
  }
}

function formatProfileType(flags: number): string {
  const badges: string[] = [];
  if (flags & PT_TEMPORARY) badges.push(`${ANSI.red}TEMPORARY${ANSI.reset}`);
  if (flags & PT_ROAMING) badges.push(`${ANSI.yellow}ROAMING${ANSI.reset}`);
  if (flags & PT_MANDATORY) badges.push(`${ANSI.magenta}MANDATORY${ANSI.reset}`);
  if (flags & PT_ROAMING_PREEXISTING) badges.push(`${ANSI.cyan}PREEXISTING${ANSI.reset}`);
  return badges.length > 0 ? badges.join(' ') : `${ANSI.green}LOCAL${ANSI.reset}`;
}

function renderBar(count: number, maxCount: number, width: number, color: string): string {
  if (count <= 0) return `${ANSI.dim}(empty)${ANSI.reset}`;
  const filled = Math.max(1, Math.round((count / maxCount) * width));
  return `${color}${'█'.repeat(filled)}${ANSI.dim}${'░'.repeat(width - filled)}${ANSI.reset} ${count}`;
}

// --- Main ---

console.log(`\n${ANSI.bold}${ANSI.white} Profile Panorama${ANSI.reset}`);
console.log(`${ANSI.dim} Windows User Profile Directory Overview${ANSI.reset}\n`);

const hToken = getCurrentUserToken();

interface ProfileEntry {
  color: string;
  count: number;
  label: string;
  path: string;
}

const entries: ProfileEntry[] = [];

try {
  const profilesRoot = queryDirectory((d, s) => Userenv.GetProfilesDirectoryW(d, s));
  entries.push({ color: ANSI.blue, count: countEntries(profilesRoot), label: 'Profiles Root', path: profilesRoot });

  const userDir = queryDirectory((d, s) => Userenv.GetUserProfileDirectoryW(hToken, d, s));
  entries.push({ color: ANSI.green, count: countEntries(userDir), label: 'Current User', path: userDir });

  const defaultDir = queryDirectory((d, s) => Userenv.GetDefaultUserProfileDirectoryW(d, s));
  entries.push({ color: ANSI.cyan, count: countEntries(defaultDir), label: 'Default User', path: defaultDir });

  const allUsersDir = queryDirectory((d, s) => Userenv.GetAllUsersProfileDirectoryW(d, s));
  entries.push({ color: ANSI.magenta, count: countEntries(allUsersDir), label: 'All Users', path: allUsersDir });
} finally {
  Kernel32.CloseHandle(hToken);
}

const flagsBuf = Buffer.alloc(4);
const profileTypeOk = Userenv.GetProfileType(flagsBuf.ptr);
const profileFlags = profileTypeOk !== 0 ? flagsBuf.readUInt32LE(0) : 0;

const maxCount = Math.max(...entries.map((e) => e.count), 1);
const barWidth = 30;

console.log(`${ANSI.dim} ┌──────────────────┬────────────────────────────────────────────────┐${ANSI.reset}`);
console.log(`${ANSI.dim} │${ANSI.reset} ${ANSI.bold}Directory${ANSI.reset}        ${ANSI.dim}│${ANSI.reset} ${ANSI.bold}Entries${ANSI.reset}                                         ${ANSI.dim}│${ANSI.reset}`);
console.log(`${ANSI.dim} ├──────────────────┼────────────────────────────────────────────────┤${ANSI.reset}`);

for (const entry of entries) {
  const label = `${entry.color}${entry.label.padEnd(16)}${ANSI.reset}`;
  const bar = renderBar(entry.count, maxCount, barWidth, entry.color);
  console.log(`${ANSI.dim} │${ANSI.reset} ${label} ${ANSI.dim}│${ANSI.reset} ${bar}`);
}

console.log(`${ANSI.dim} └──────────────────┴────────────────────────────────────────────────┘${ANSI.reset}`);

console.log(`\n${ANSI.bold} Paths${ANSI.reset}`);
for (const entry of entries) {
  console.log(`  ${entry.color}●${ANSI.reset} ${entry.label.padEnd(16)} ${ANSI.white}${entry.path}${ANSI.reset}`);
}

console.log(`\n${ANSI.bold} Profile Type${ANSI.reset}`);
console.log(`  ${formatProfileType(profileFlags)}  ${ANSI.dim}(flags: 0x${profileFlags.toString(16).padStart(8, '0')})${ANSI.reset}`);
console.log('');
