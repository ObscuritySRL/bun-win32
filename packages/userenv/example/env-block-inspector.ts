/**
 * Environment Block Inspector
 *
 * Creates a Win32 environment block for the current user token, parses the
 * double-NUL-terminated wide-string list, and displays all variables in a
 * categorized ANSI table. Also demonstrates expanding environment variable
 * references through the user environment API.
 *
 * APIs demonstrated:
 *   - Userenv.CreateEnvironmentBlock            (build user environment block)
 *   - Userenv.DestroyEnvironmentBlock           (free environment block)
 *   - Userenv.ExpandEnvironmentStringsForUserW  (expand %VAR% references)
 *
 * Run: bun run example/env-block-inspector.ts
 */

import { dlopen, FFIType, type Pointer, read, toBuffer } from 'bun:ffi';

import Userenv from '../index';
import Kernel32 from '@bun-win32/kernel32';

Userenv.Preload(['CreateEnvironmentBlock', 'DestroyEnvironmentBlock', 'ExpandEnvironmentStringsForUserW']);
Kernel32.Preload(['CloseHandle', 'GetCurrentProcess', 'GetLastError']);

const ANSI = {
  blue: '\x1b[94m',
  bold: '\x1b[1m',
  cyan: '\x1b[96m',
  dim: '\x1b[2m',
  green: '\x1b[92m',
  magenta: '\x1b[95m',
  reset: '\x1b[0m',
  white: '\x1b[97m',
  yellow: '\x1b[93m',
} as const;

const TOKEN_QUERY = 0x0008;
const MAX_ENV_BYTES = 65536;

function getCurrentUserToken(): bigint {
  const { symbols: adv } = dlopen('advapi32.dll', {
    OpenProcessToken: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
  });
  const buf = Buffer.alloc(8);
  const ok = adv.OpenProcessToken(Kernel32.GetCurrentProcess(), TOKEN_QUERY, buf.ptr);
  if (ok === 0) throw new Error(`OpenProcessToken failed (${Kernel32.GetLastError()})`);
  return buf.readBigUInt64LE(0);
}

function parseEnvironmentBlock(envPtr: Pointer): Map<string, string> {
  const raw = toBuffer(envPtr, 0, MAX_ENV_BYTES);
  const vars = new Map<string, string>();
  let offset = 0;

  while (offset < MAX_ENV_BYTES - 2) {
    if (raw.readUInt16LE(offset) === 0) break;
    let end = offset;
    while (end < MAX_ENV_BYTES - 2 && raw.readUInt16LE(end) !== 0) end += 2;
    const entry = raw.subarray(offset, end).toString('utf16le');
    const eq = entry.indexOf('=');
    if (eq > 0) vars.set(entry.slice(0, eq), entry.slice(eq + 1));
    offset = end + 2;
  }

  return vars;
}

function expandString(hToken: bigint, input: string): string {
  const src = Buffer.from(input + '\0', 'utf16le');
  const dest = Buffer.alloc(1024);
  const ok = Userenv.ExpandEnvironmentStringsForUserW(hToken, src.ptr, dest.ptr, 512);
  if (ok === 0) return `(expand failed: ${Kernel32.GetLastError()})`;
  return dest.toString('utf16le').replace(/\0.*$/, '');
}

type Category = 'Path' | 'Program' | 'System' | 'User';

function categorize(name: string): Category {
  const upper = name.toUpperCase();
  if (upper.includes('PATH') || upper === 'PATHEXT') return 'Path';
  if (upper.startsWith('USER') || upper === 'HOMEPATH' || upper === 'HOMEDRIVE' || upper === 'APPDATA' || upper === 'LOCALAPPDATA' || upper === 'TEMP' || upper === 'TMP') return 'User';
  if (upper.startsWith('PROGRAM') || upper.startsWith('COMMON')) return 'Program';
  return 'System';
}

const CATEGORY_COLORS: Record<Category, string> = {
  Path: ANSI.yellow,
  Program: ANSI.magenta,
  System: ANSI.cyan,
  User: ANSI.green,
};

// --- Main ---

console.log(`\n${ANSI.bold}${ANSI.white} Environment Block Inspector${ANSI.reset}`);
console.log(`${ANSI.dim} Win32 CreateEnvironmentBlock + ExpandEnvironmentStringsForUserW${ANSI.reset}\n`);

const hToken = getCurrentUserToken();

try {
  const envPtrBuf = Buffer.alloc(8);
  const ok = Userenv.CreateEnvironmentBlock(envPtrBuf.ptr, hToken, 1);
  if (ok === 0) throw new Error(`CreateEnvironmentBlock failed (${Kernel32.GetLastError()})`);

  const envPtr = read.ptr(envPtrBuf.ptr) as Pointer;
  if (!envPtr) throw new Error('CreateEnvironmentBlock returned null');

  try {
    const vars = parseEnvironmentBlock(envPtr);
    const grouped = new Map<Category, [string, string][]>();

    for (const [name, value] of vars) {
      const cat = categorize(name);
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push([name, value]);
    }

    const categoryOrder: Category[] = ['System', 'User', 'Path', 'Program'];
    let total = 0;

    for (const cat of categoryOrder) {
      const entries = grouped.get(cat);
      if (!entries || entries.length === 0) continue;
      entries.sort((a, b) => a[0].localeCompare(b[0]));
      const color = CATEGORY_COLORS[cat];

      console.log(`${color}${ANSI.bold} ${cat}${ANSI.reset} ${ANSI.dim}(${entries.length})${ANSI.reset}`);

      for (const [name, value] of entries) {
        const displayValue = value.length > 72 ? value.slice(0, 69) + '...' : value;
        console.log(`  ${ANSI.white}${name.padEnd(28)}${ANSI.reset} ${ANSI.dim}${displayValue}${ANSI.reset}`);
        total++;
      }

      console.log('');
    }

    console.log(`${ANSI.dim} Total: ${total} variable(s) from environment block${ANSI.reset}\n`);

    // Demonstrate ExpandEnvironmentStringsForUserW
    console.log(`${ANSI.bold}${ANSI.white} Expand Demo${ANSI.reset}`);
    const testStrings = ['%SystemRoot%\\System32\\notepad.exe', '%USERPROFILE%\\Documents', '%ProgramFiles%\\Common Files'];

    for (const test of testStrings) {
      const expanded = expandString(hToken, test);
      console.log(`  ${ANSI.yellow}${test}${ANSI.reset}`);
      console.log(`  ${ANSI.dim}->${ANSI.reset} ${ANSI.green}${expanded}${ANSI.reset}`);
    }

    console.log('');
  } finally {
    Userenv.DestroyEnvironmentBlock(envPtr);
  }
} finally {
  Kernel32.CloseHandle(hToken);
}
