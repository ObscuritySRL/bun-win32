/**
 * MFT Transform Census
 *
 * Sweeps every documented Media Foundation Transform category with
 * `MFTEnumEx`, walks each returned `IMFActivate` vtable to pull the codec's
 * friendly name via `GetAllocatedString(MFT_FRIENDLY_NAME_Attribute)`, and
 * renders the full installed MF codec ecosystem on this machine as a ranked
 * ANSI dashboard with per-category counts, hardware/async flags, and a bar
 * chart of relative coverage. Each `IMFActivate`, each allocated name, and
 * the outer `CoTaskMemAlloc`'d array is released in reverse-allocation
 * order.
 *
 * APIs demonstrated:
 *   - Mfplat.MFStartup / MFShutdown           (platform lifecycle)
 *   - Mfplat.MFTEnumEx                        (enumerate MFTs by category)
 *   - IMFAttributes::GetAllocatedString       (read MFT_FRIENDLY_NAME)
 *   - IMFAttributes::GetUINT32                (read flags)
 *   - IUnknown::Release                       (COM cleanup per activate)
 *   - ole32!CoInitializeEx / CoUninitialize   (COM apartment lifecycle)
 *   - ole32!CoTaskMemFree                     (free enum array + strings)
 *
 * Run: bun run example:mft-transform-census
 */

import { FFIType, dlopen, linkSymbols } from 'bun:ffi';

import Mfplat from '..';

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
const MFT_ENUM_FLAG_ALL = 0x0000_003f;
const POINTER_SIZE = 8;
const RELEASE_METHOD_OFFSET = 0x10;
const RPC_E_CHANGED_MODE = 0x8001_0106 >>> 0;
const GET_UINT32_OFFSET = 0x38;
const GET_ALLOCATED_STRING_OFFSET = 0x68;

const MFT_FRIENDLY_NAME_ATTRIBUTE = '314ffbae-5b41-4c95-9c19-4e7d586face3';
const MFT_TRANSFORM_CLSID_ATTRIBUTE = '8b1e40ea-3c3d-46dc-8fc9-9f6c6f64c03e';
const MFT_ENUM_HARDWARE_URL_ATTRIBUTE = '2fb866ac-b078-4942-ab6c-003d05cda674';

interface Category {
  guid: string;
  name: string;
}

const CATEGORIES: Category[] = [
  { guid: 'd6c02d4b-6833-45b4-971a-05a4b04bab91', name: 'Video decoders' },
  { guid: 'f79eac7d-e545-4387-bdee-d647d7bde42a', name: 'Video encoders' },
  { guid: '12e17c21-532c-4a6e-8a1c-40825a736397', name: 'Video effects' },
  { guid: '302ea3fc-aa5f-47f9-9f7a-c2188bb16302', name: 'Video processors' },
  { guid: '9ea73fb4-ef7a-4559-8d5d-719d8f0426c7', name: 'Audio decoders' },
  { guid: '91c64bd0-f91e-4d8c-9276-db248279d975', name: 'Audio encoders' },
  { guid: '11064c48-3648-4ed0-932e-05ce8ac811b7', name: 'Audio effects' },
  { guid: '059c561e-05ae-4b61-b69d-55b61ee54a7b', name: 'Multiplexers' },
  { guid: 'a8700a7a-939b-44c5-99d7-76226b23b3f1', name: 'Demultiplexers' },
  { guid: '90175d57-b7ea-4901-aeb3-933a8747756f', name: 'Other transforms' },
];

const kernel32 = dlopen('kernel32.dll', {
  GetCurrentProcess: { args: [], returns: FFIType.u64 },
  ReadProcessMemory: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
});

const ole32 = dlopen('ole32.dll', {
  CoInitializeEx: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
  CoTaskMemFree: { args: [FFIType.u64], returns: FFIType.void },
  CoUninitialize: { args: [], returns: FFIType.void },
});

const currentProcess = kernel32.symbols.GetCurrentProcess();

Mfplat.Preload(['MFShutdown', 'MFStartup', 'MFTEnumEx']);

interface MftInfo {
  friendlyName: string;
  hardware: boolean;
}

interface CategoryResult {
  count: number;
  entries: MftInfo[];
  hr: number;
  name: string;
}

function formatHResult(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0')}`;
}

function guidBytes(value: string): Buffer {
  const match = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i.exec(value);
  if (match === null) throw new Error(`Invalid GUID: ${value}`);
  const [, d1, d2, d3, d4High, d4Low] = match;
  const buffer = Buffer.alloc(16);
  buffer.writeUInt32LE(parseInt(d1, 16), 0);
  buffer.writeUInt16LE(parseInt(d2, 16), 4);
  buffer.writeUInt16LE(parseInt(d3, 16), 6);
  const data4 = `${d4High}${d4Low}`;
  for (let i = 0; i < 8; i += 1) buffer[8 + i] = parseInt(data4.slice(i * 2, i * 2 + 2), 16);
  return buffer;
}

function readPointerAt(address: bigint): bigint {
  const buffer = Buffer.alloc(POINTER_SIZE);
  const ok = kernel32.symbols.ReadProcessMemory(currentProcess, address, buffer.ptr, BigInt(POINTER_SIZE), null);
  if (ok === 0) throw new Error(`ReadProcessMemory failed at 0x${address.toString(16)}`);
  return buffer.readBigUInt64LE(0);
}

function readWideString(address: bigint, maxChars = 256): string {
  if (address === 0n) return '';
  const bytes = Math.min(maxChars, 4096) * 2;
  const buffer = Buffer.alloc(bytes);
  const ok = kernel32.symbols.ReadProcessMemory(currentProcess, address, buffer.ptr, BigInt(bytes), null);
  if (ok === 0) return '';
  return new TextDecoder('utf-16').decode(buffer).replace(/\0.*$/, '');
}

function releaseObject(address: bigint): void {
  if (address === 0n) return;
  const vtable = readPointerAt(address);
  const releaseAddress = readPointerAt(vtable + BigInt(RELEASE_METHOD_OFFSET));
  const lib = linkSymbols({
    Release: {
      args: [FFIType.u64],
      ptr: releaseAddress,
      returns: FFIType.u32,
    },
  });
  try {
    lib.symbols.Release(address);
  } finally {
    lib.close();
  }
}

const friendlyNameKey = guidBytes(MFT_FRIENDLY_NAME_ATTRIBUTE);
const hardwareUrlKey = guidBytes(MFT_ENUM_HARDWARE_URL_ATTRIBUTE);
// MFT_TRANSFORM_CLSID_ATTRIBUTE is declared but unused; kept here for reference.
void MFT_TRANSFORM_CLSID_ATTRIBUTE;

function probeActivate(activateAddress: bigint): MftInfo {
  const vtable = readPointerAt(activateAddress);
  const getAllocatedStringAddress = readPointerAt(vtable + BigInt(GET_ALLOCATED_STRING_OFFSET));
  const getUInt32Address = readPointerAt(vtable + BigInt(GET_UINT32_OFFSET));
  const lib = linkSymbols({
    GetAllocatedString: {
      args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr],
      ptr: getAllocatedStringAddress,
      returns: FFIType.i32,
    },
    GetUINT32: {
      args: [FFIType.u64, FFIType.ptr, FFIType.ptr],
      ptr: getUInt32Address,
      returns: FFIType.i32,
    },
  });

  let friendlyName = '(unnamed)';
  let hardware = false;
  try {
    const stringOut = Buffer.alloc(POINTER_SIZE);
    const lengthOut = Buffer.alloc(4);
    const nameHr = lib.symbols.GetAllocatedString(activateAddress, friendlyNameKey.ptr, stringOut.ptr, lengthOut.ptr);
    if (nameHr === 0) {
      const stringAddress = stringOut.readBigUInt64LE(0);
      if (stringAddress !== 0n) {
        const length = lengthOut.readUInt32LE(0);
        friendlyName = readWideString(stringAddress, length + 1);
        ole32.symbols.CoTaskMemFree(stringAddress);
      }
    }

    const flagOut = Buffer.alloc(4);
    const flagHr = lib.symbols.GetUINT32(activateAddress, hardwareUrlKey.ptr, flagOut.ptr);
    hardware = flagHr === 0;
  } finally {
    lib.close();
  }

  return { friendlyName, hardware };
}

const coInitHr = ole32.symbols.CoInitializeEx(null, COINIT_APARTMENTTHREADED);
const shouldUninitialize = coInitHr >= 0;
if (coInitHr < 0 && (coInitHr >>> 0) !== RPC_E_CHANGED_MODE) {
  console.error(`${ANSI.red}CoInitializeEx failed: ${formatHResult(coInitHr)}${ANSI.reset}`);
  process.exit(1);
}

const mfStartHr = Mfplat.MFStartup(MF_VERSION, MFSTARTUP_LITE);
if (mfStartHr < 0) {
  console.error(`${ANSI.red}MFStartup failed: ${formatHResult(mfStartHr)}${ANSI.reset}`);
  if (shouldUninitialize) ole32.symbols.CoUninitialize();
  process.exit(1);
}

const results: CategoryResult[] = [];
for (const category of CATEGORIES) {
  const countOut = Buffer.alloc(4);
  const activateArrayOut = Buffer.alloc(POINTER_SIZE);
  const categoryGuid = guidBytes(category.guid);
  const enumHr = Mfplat.MFTEnumEx(categoryGuid.ptr, MFT_ENUM_FLAG_ALL, null, null, activateArrayOut.ptr, countOut.ptr);

  if (enumHr !== 0) {
    results.push({ count: 0, entries: [], hr: enumHr, name: category.name });
    continue;
  }

  const count = countOut.readUInt32LE(0);
  const activateArrayAddress = activateArrayOut.readBigUInt64LE(0);
  const entries: MftInfo[] = [];

  if (activateArrayAddress !== 0n && count > 0) {
    for (let i = 0; i < count; i += 1) {
      const activateAddress = readPointerAt(activateArrayAddress + BigInt(i * POINTER_SIZE));
      try {
        entries.push(probeActivate(activateAddress));
      } catch {
        entries.push({ friendlyName: '(unreadable)', hardware: false });
      } finally {
        releaseObject(activateAddress);
      }
    }
    ole32.symbols.CoTaskMemFree(activateArrayAddress);
  }

  results.push({ count, entries, hr: enumHr, name: category.name });
}

Mfplat.MFShutdown();
if (shouldUninitialize) ole32.symbols.CoUninitialize();
ole32.close();
kernel32.close();

const totalMfts = results.reduce((sum, r) => sum + r.count, 0);
const hardwareMfts = results.reduce((sum, r) => sum + r.entries.filter((e) => e.hardware).length, 0);
const maxCount = Math.max(1, ...results.map((r) => r.count));
const NAME_WIDTH = Math.max(18, ...results.map((r) => r.name.length));
const BAR_WIDTH = 28;

console.log();
console.log(`${ANSI.bold}${ANSI.cyan}Media Foundation Transform Census${ANSI.reset}  ${ANSI.dim}installed on this machine${ANSI.reset}`);
console.log();
console.log(`  ${ANSI.dim}${'Category'.padEnd(NAME_WIDTH)}  ${'Count'.padStart(5)}  ${'HW'.padStart(3)}  Coverage${ANSI.reset}`);
console.log(`  ${ANSI.dim}${'─'.repeat(NAME_WIDTH + 2 + 5 + 2 + 3 + 2 + BAR_WIDTH)}${ANSI.reset}`);

for (const result of results) {
  const hwCount = result.entries.filter((e) => e.hardware).length;
  const filled = Math.max(result.count === 0 ? 0 : 1, Math.round((result.count / maxCount) * BAR_WIDTH));
  const bar = `${ANSI.green}${'█'.repeat(filled)}${ANSI.dim}${'·'.repeat(BAR_WIDTH - filled)}${ANSI.reset}`;
  const countText = `${ANSI.magenta}${result.count.toString().padStart(5)}${ANSI.reset}`;
  const hwText = hwCount > 0 ? `${ANSI.cyan}${hwCount.toString().padStart(3)}${ANSI.reset}` : `${ANSI.dim}  ·${ANSI.reset}`;
  const nameColored = `${ANSI.yellow}${result.name.padEnd(NAME_WIDTH)}${ANSI.reset}`;
  console.log(`  ${nameColored}  ${countText}  ${hwText}  ${bar}`);
}

console.log();
console.log(`  ${ANSI.bold}${totalMfts}${ANSI.reset} transforms  ${ANSI.dim}•${ANSI.reset}  ${ANSI.cyan}${hardwareMfts}${ANSI.reset} hardware-backed  ${ANSI.dim}•${ANSI.reset}  ${ANSI.bold}${results.length}${ANSI.reset} categories swept`);
console.log();

for (const result of results) {
  if (result.entries.length === 0) continue;
  const header = `${ANSI.bold}${ANSI.yellow}${result.name}${ANSI.reset}  ${ANSI.dim}(${result.entries.length})${ANSI.reset}`;
  console.log(`  ${header}`);
  const sorted = result.entries.slice().sort((a, b) => a.friendlyName.localeCompare(b.friendlyName));
  const displayLimit = 8;
  for (const entry of sorted.slice(0, displayLimit)) {
    const hwBadge = entry.hardware ? `${ANSI.cyan}◆${ANSI.reset}` : `${ANSI.dim}◇${ANSI.reset}`;
    console.log(`    ${hwBadge} ${entry.friendlyName}`);
  }
  if (sorted.length > displayLimit) {
    console.log(`    ${ANSI.dim}…and ${sorted.length - displayLimit} more${ANSI.reset}`);
  }
  console.log();
}

const failed = results.filter((r) => r.hr !== 0);
if (failed.length > 0) {
  console.log(`  ${ANSI.red}${failed.length} categor${failed.length === 1 ? 'y' : 'ies'} failed${ANSI.reset}`);
  for (const f of failed) {
    console.log(`    ${ANSI.red}${f.name}${ANSI.reset}  ${ANSI.dim}${formatHResult(f.hr)}${ANSI.reset}`);
  }
  console.log();
}
