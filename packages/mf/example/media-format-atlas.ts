/**
 * Media Foundation Format Atlas
 *
 * Asks Media Foundation directly which container/MIME types and which URL
 * byte-stream schemes the source-resolution layer can actually open on THIS
 * machine — the exact decision table the playback/transcode pipeline uses to
 * pick a source. `MFGetSupportedMimeTypes` / `MFGetSupportedSchemes` each hand
 * back a `PROPVARIANT` holding a `VT_VECTOR | VT_LPWSTR` (a counted array of
 * wide-string pointers); this walks that native array in-process, groups MIME
 * types by top-level family, and renders an aligned ANSI diagnostic with
 * per-family bar charts and a full listing. The PROPVARIANTs are released with
 * `PropVariantClear` so the vector and every string are freed by the OS.
 *
 * APIs demonstrated (mf):
 *   - Mf.MFGetSupportedMimeTypes      (enumerate supported container MIME types)
 *   - Mf.MFGetSupportedSchemes        (enumerate supported URL schemes)
 *
 * APIs demonstrated (mfplat, cross-package):
 *   - mfplat!MFStartup / MFShutdown   (Media Foundation platform lifecycle)
 *
 * APIs demonstrated (kernel32, cross-package):
 *   - kernel32!GetCurrentProcess      (pseudo-handle for self memory)
 *   - kernel32!ReadProcessMemory      (walk the PROPVARIANT string vector)
 *
 * APIs demonstrated (ole32, cross-package):
 *   - ole32!CoInitializeEx / CoUninitialize  (COM apartment lifecycle)
 *   - ole32!PropVariantClear                 (free the returned PROPVARIANT)
 *
 * Run: bun run example:media-format-atlas
 */

import { FFIType, dlopen } from 'bun:ffi';

import Mf from '..';

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

const COINIT_APARTMENTTHREADED = 0x2;
const MF_VERSION = 0x0002_0070;
const MFSTARTUP_LITE = 0x1;
const POINTER_SIZE = 8;
const RPC_E_CHANGED_MODE = 0x8001_0106 >>> 0;
const VT_LPWSTR = 31;
const VT_VECTOR = 0x1000;

const kernel32 = dlopen('kernel32.dll', {
  GetCurrentProcess: { args: [], returns: FFIType.u64 },
  ReadProcessMemory: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
});

const mfplat = dlopen('mfplat.dll', {
  MFShutdown: { args: [], returns: FFIType.i32 },
  MFStartup: { args: [FFIType.u32, FFIType.u32], returns: FFIType.i32 },
});

const ole32 = dlopen('ole32.dll', {
  CoInitializeEx: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
  CoUninitialize: { args: [], returns: FFIType.void },
  PropVariantClear: { args: [FFIType.ptr], returns: FFIType.i32 },
});

const currentProcess = kernel32.symbols.GetCurrentProcess();

function formatHResult(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0')}`;
}

function readPointerAt(address: bigint): bigint {
  const buffer = Buffer.alloc(POINTER_SIZE);
  const ok = kernel32.symbols.ReadProcessMemory(currentProcess, address, buffer.ptr, BigInt(POINTER_SIZE), null);
  if (ok === 0) return 0n;
  return buffer.readBigUInt64LE(0);
}

/**
 * Read a NUL-terminated UTF-16LE string from a native address. The shrinking
 * retry handles strings that sit close to an unmapped page boundary, where a
 * large `ReadProcessMemory` would straddle the guard page and fail outright.
 */
function readWideString(address: bigint): string {
  if (address === 0n) return '';
  for (const size of [256, 128, 64, 32, 16, 8]) {
    const buffer = Buffer.alloc(size);
    const ok = kernel32.symbols.ReadProcessMemory(currentProcess, address, buffer.ptr, BigInt(size), null);
    if (ok === 0) continue;
    const decoded = buffer.toString('utf16le');
    const terminator = decoded.indexOf(String.fromCharCode(0));
    return terminator === -1 ? decoded : decoded.slice(0, terminator);
  }
  return '';
}

/**
 * Pull the `VT_VECTOR | VT_LPWSTR` payload out of a freshly-filled
 * PROPVARIANT. On x64 the union starts at offset 8: `ULONG cElems` at 8,
 * `LPWSTR *pElems` at 16 (8-byte aligned).
 */
function readStringVector(propVariant: Buffer): string[] {
  const vt = propVariant.readUInt16LE(0);
  if (vt !== (VT_VECTOR | VT_LPWSTR)) return [];
  const count = propVariant.readUInt32LE(8);
  const elementsAddress = propVariant.readBigUInt64LE(16);
  if (elementsAddress === 0n || count === 0) return [];
  const values: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const stringAddress = readPointerAt(elementsAddress + BigInt(index * POINTER_SIZE));
    values.push(readWideString(stringAddress));
  }
  return values;
}

const coInitHr = ole32.symbols.CoInitializeEx(null, COINIT_APARTMENTTHREADED);
const shouldUninitialize = coInitHr >= 0;
if (coInitHr < 0 && coInitHr >>> 0 !== RPC_E_CHANGED_MODE) {
  console.error(`${ANSI.red}CoInitializeEx failed: ${formatHResult(coInitHr)}${ANSI.reset}`);
  process.exit(1);
}

const startHr = mfplat.symbols.MFStartup(MF_VERSION, MFSTARTUP_LITE);
if (startHr < 0) {
  console.error(`${ANSI.red}MFStartup failed: ${formatHResult(startHr)}${ANSI.reset}`);
  if (shouldUninitialize) ole32.symbols.CoUninitialize();
  process.exit(1);
}

// PROPVARIANT is 24 bytes on x64; allocate 32 (zero-filled) for headroom.
const mimePropVariant = Buffer.alloc(32);
const schemePropVariant = Buffer.alloc(32);

const mimeHr = Mf.MFGetSupportedMimeTypes(mimePropVariant.ptr!);
const schemeHr = Mf.MFGetSupportedSchemes(schemePropVariant.ptr!);

const mimeTypes = mimeHr === 0 ? readStringVector(mimePropVariant).filter(Boolean).sort() : [];
const schemes = schemeHr === 0 ? readStringVector(schemePropVariant).filter(Boolean).sort() : [];

if (mimeHr === 0) ole32.symbols.PropVariantClear(mimePropVariant.ptr!);
if (schemeHr === 0) ole32.symbols.PropVariantClear(schemePropVariant.ptr!);

mfplat.symbols.MFShutdown();
if (shouldUninitialize) ole32.symbols.CoUninitialize();
mfplat.close();
ole32.close();
kernel32.close();

function topLevel(mimeType: string): string {
  const slash = mimeType.indexOf('/');
  return slash === -1 ? 'other' : mimeType.slice(0, slash).toLowerCase();
}

const families = new Map<string, string[]>();
for (const mimeType of mimeTypes) {
  const family = topLevel(mimeType);
  if (!families.has(family)) families.set(family, []);
  families.get(family)!.push(mimeType);
}

const familyRows = [...families.entries()].sort((a, b) => b[1].length - a[1].length);
const maxFamily = Math.max(1, ...familyRows.map(([, list]) => list.length));
const FAMILY_WIDTH = Math.max(12, ...familyRows.map(([name]) => name.length));
const BAR_WIDTH = 30;

console.log();
console.log(`${ANSI.bold}${ANSI.cyan}Media Foundation Format Atlas${ANSI.reset}  ${ANSI.dim}what this machine's MF source layer can open${ANSI.reset}`);
console.log();

if (mimeHr !== 0 && schemeHr !== 0) {
  console.log(`  ${ANSI.red}Both queries failed${ANSI.reset}  ${ANSI.dim}MIME ${formatHResult(mimeHr)}  •  schemes ${formatHResult(schemeHr)}${ANSI.reset}`);
  console.log();
  process.exit(1);
}

console.log(`  ${ANSI.bold}Container MIME types by family${ANSI.reset}  ${ANSI.dim}(${mimeTypes.length} total)${ANSI.reset}`);
console.log(`  ${ANSI.dim}${'─'.repeat(FAMILY_WIDTH + 2 + 5 + 2 + BAR_WIDTH)}${ANSI.reset}`);
for (const [family, list] of familyRows) {
  const filled = Math.max(1, Math.round((list.length / maxFamily) * BAR_WIDTH));
  const bar = `${ANSI.green}${'█'.repeat(filled)}${ANSI.dim}${'·'.repeat(BAR_WIDTH - filled)}${ANSI.reset}`;
  const count = `${ANSI.magenta}${list.length.toString().padStart(5)}${ANSI.reset}`;
  const name = `${ANSI.yellow}${family.padEnd(FAMILY_WIDTH)}${ANSI.reset}`;
  console.log(`  ${name}  ${count}  ${bar}`);
}
console.log();

for (const [family, list] of [...families.entries()].sort()) {
  console.log(`  ${ANSI.bold}${ANSI.yellow}${family}${ANSI.reset}  ${ANSI.dim}(${list.length})${ANSI.reset}`);
  const sorted = list.slice().sort();
  for (let i = 0; i < sorted.length; i += 3) {
    const row = sorted
      .slice(i, i + 3)
      .map((value) => value.padEnd(28))
      .join(' ');
    console.log(`    ${ANSI.cyan}${row.trimEnd()}${ANSI.reset}`);
  }
  console.log();
}

console.log(`  ${ANSI.bold}URL byte-stream schemes${ANSI.reset}  ${ANSI.dim}(${schemes.length} total)${ANSI.reset}`);
console.log(`  ${ANSI.dim}${'─'.repeat(FAMILY_WIDTH + 2 + 5 + 2 + BAR_WIDTH)}${ANSI.reset}`);
for (let i = 0; i < schemes.length; i += 4) {
  const row = schemes
    .slice(i, i + 4)
    .map((value) => value.padEnd(18))
    .join(' ');
  console.log(`    ${ANSI.green}${row.trimEnd()}${ANSI.reset}`);
}
console.log();
console.log(`  ${ANSI.bold}${mimeTypes.length}${ANSI.reset} MIME types  ${ANSI.dim}•${ANSI.reset}  ${ANSI.bold}${families.size}${ANSI.reset} families  ${ANSI.dim}•${ANSI.reset}  ${ANSI.bold}${schemes.length}${ANSI.reset} URL schemes`);
console.log();
