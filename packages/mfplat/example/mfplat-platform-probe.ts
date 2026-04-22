/**
 * Mfplat Platform Probe
 *
 * Exercises the core `mfplat.dll` subsystems — platform lifecycle, system
 * clock, attribute bags, media types, buffers, samples, and work queues —
 * and reports a diagnostic matrix showing which calls succeed on this
 * machine. Verifies correctness by reading values back through the returned
 * COM vtables, then releases every live object in reverse-allocation order.
 *
 * APIs demonstrated:
 *   - Mfplat.MFStartup / MFShutdown        (platform lifecycle)
 *   - Mfplat.MFLockPlatform / MFUnlockPlatform (ref-counted platform hold)
 *   - Mfplat.MFGetSystemTime                (Media Foundation clock)
 *   - Mfplat.MFCreateAttributes             (attribute bag)
 *   - Mfplat.MFCreateMediaType              (media type descriptor)
 *   - Mfplat.MFCreateMemoryBuffer           (IMFMediaBuffer backed by heap)
 *   - Mfplat.MFCreateSample                 (IMFSample container)
 *   - Mfplat.MFAllocateWorkQueue / MFUnlockWorkQueue (MF thread pool)
 *   - Mfplat.MFTEnumEx                      (MFT discovery; category sweep)
 *   - IMFAttributes::SetUINT32 / GetUINT32  (round-trip a value)
 *   - IMFSample::AddBuffer                  (attach buffer to sample)
 *   - IUnknown::Release                     (COM cleanup)
 *   - ole32!CoInitializeEx / CoUninitialize (COM apartment lifecycle)
 *   - ole32!CoTaskMemFree                   (free MFTEnumEx output)
 *
 * Run: bun run example:mfplat-platform-probe
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
const MFT_CATEGORY_VIDEO_DECODER = 'd6c02d4b-6833-45b4-971a-05a4b04bab91';
const MFT_ENUM_FLAG_ALL = 0x0000_003f;
const POINTER_SIZE = 8;
const RELEASE_METHOD_OFFSET = 0x10;
const RPC_E_CHANGED_MODE = 0x8001_0106 >>> 0;
const SET_UINT32_OFFSET = 0xa8;
const GET_UINT32_OFFSET = 0x38;
const SAMPLE_ADD_BUFFER_OFFSET = 0x150;

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

Mfplat.Preload([
  'MFAllocateWorkQueue',
  'MFCreateAttributes',
  'MFCreateMediaType',
  'MFCreateMemoryBuffer',
  'MFCreateSample',
  'MFGetSystemTime',
  'MFLockPlatform',
  'MFShutdown',
  'MFStartup',
  'MFTEnumEx',
  'MFUnlockPlatform',
  'MFUnlockWorkQueue',
]);

type CheckStatus = 'ok' | 'fail' | 'info' | 'skip';

interface Check {
  detail: string;
  hr: number | null;
  name: string;
  status: CheckStatus;
}

const checks: Check[] = [];

function describeHResult(hr: number): string {
  if (hr === 0) return `${ANSI.green}S_OK${ANSI.reset}`;
  return `${ANSI.red}${formatHResult(hr)}${ANSI.reset}`;
}

function formatAddress(value: bigint): string {
  return `0x${value.toString(16).padStart(16, '0')}`;
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

function recordCheck(name: string, status: CheckStatus, hr: number | null, detail: string): void {
  checks.push({ detail, hr, name, status });
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

const coInitHr = ole32.symbols.CoInitializeEx(null, COINIT_APARTMENTTHREADED);
const shouldUninitialize = coInitHr >= 0;
if (coInitHr < 0 && (coInitHr >>> 0) !== RPC_E_CHANGED_MODE) {
  console.error(`${ANSI.red}CoInitializeEx failed: ${formatHResult(coInitHr)}${ANSI.reset}`);
  process.exit(1);
}
recordCheck('CoInitializeEx', coInitHr >= 0 || (coInitHr >>> 0) === RPC_E_CHANGED_MODE ? 'ok' : 'fail', coInitHr, `apartment = STA`);

const mfStartHr = Mfplat.MFStartup(MF_VERSION, MFSTARTUP_LITE);
recordCheck('MFStartup', mfStartHr >= 0 ? 'ok' : 'fail', mfStartHr, `MF_VERSION = ${formatHResult(MF_VERSION)}, MFSTARTUP_LITE`);

const lockHr = Mfplat.MFLockPlatform();
recordCheck('MFLockPlatform', lockHr >= 0 ? 'ok' : 'fail', lockHr, 'ref-counted platform hold acquired');

const timeBefore = Mfplat.MFGetSystemTime();
const spinUntil = timeBefore + 50_000n;
while (Mfplat.MFGetSystemTime() < spinUntil) {
  /* busy-wait ~5 ms of MF 100 ns units */
}
const timeAfter = Mfplat.MFGetSystemTime();
const deltaUnits = Number(timeAfter - timeBefore);
recordCheck('MFGetSystemTime', deltaUnits > 0 ? 'ok' : 'fail', null, `Δ = ${deltaUnits} × 100 ns (${(deltaUnits / 10_000).toFixed(3)} ms)`);

const attrsOut = Buffer.alloc(POINTER_SIZE);
const attrsHr = Mfplat.MFCreateAttributes(attrsOut.ptr, 4);
const attrsAddress = attrsHr === 0 ? attrsOut.readBigUInt64LE(0) : 0n;
recordCheck(
  'MFCreateAttributes',
  attrsHr === 0 && attrsAddress !== 0n ? 'ok' : 'fail',
  attrsHr,
  attrsAddress === 0n ? 'no attribute bag' : `IMFAttributes @ ${formatAddress(attrsAddress)}`,
);

let roundTripOk = false;
let roundTripValue = -1;
const probeKey = guidBytes('c3f1f8d6-fe63-4f46-8f2e-1b3a64f4e6c2');
const probeValue = 0x4249_554e;
if (attrsAddress !== 0n) {
  const vtable = readPointerAt(attrsAddress);
  const setAddress = readPointerAt(vtable + BigInt(SET_UINT32_OFFSET));
  const getAddress = readPointerAt(vtable + BigInt(GET_UINT32_OFFSET));
  const attrLib = linkSymbols({
    GetUINT32: {
      args: [FFIType.u64, FFIType.ptr, FFIType.ptr],
      ptr: getAddress,
      returns: FFIType.i32,
    },
    SetUINT32: {
      args: [FFIType.u64, FFIType.ptr, FFIType.u32],
      ptr: setAddress,
      returns: FFIType.i32,
    },
  });
  try {
    const setHr = attrLib.symbols.SetUINT32(attrsAddress, probeKey.ptr, probeValue);
    if (setHr === 0) {
      const valueOut = Buffer.alloc(4);
      const getHr = attrLib.symbols.GetUINT32(attrsAddress, probeKey.ptr, valueOut.ptr);
      if (getHr === 0) {
        roundTripValue = valueOut.readUInt32LE(0);
        roundTripOk = roundTripValue === probeValue;
      }
    }
  } finally {
    attrLib.close();
  }
}
recordCheck(
  'IMFAttributes::Set/GetUINT32',
  roundTripOk ? 'ok' : 'fail',
  null,
  roundTripOk ? `round-trip 0x${probeValue.toString(16)} matched` : `stored 0x${probeValue.toString(16)}, read 0x${(roundTripValue >>> 0).toString(16)}`,
);

const mediaTypeOut = Buffer.alloc(POINTER_SIZE);
const mediaTypeHr = Mfplat.MFCreateMediaType(mediaTypeOut.ptr);
const mediaTypeAddress = mediaTypeHr === 0 ? mediaTypeOut.readBigUInt64LE(0) : 0n;
recordCheck(
  'MFCreateMediaType',
  mediaTypeHr === 0 && mediaTypeAddress !== 0n ? 'ok' : 'fail',
  mediaTypeHr,
  mediaTypeAddress === 0n ? 'no media type' : `IMFMediaType @ ${formatAddress(mediaTypeAddress)}`,
);

const bufferOut = Buffer.alloc(POINTER_SIZE);
const bufferHr = Mfplat.MFCreateMemoryBuffer(4096, bufferOut.ptr);
const bufferAddress = bufferHr === 0 ? bufferOut.readBigUInt64LE(0) : 0n;
recordCheck(
  'MFCreateMemoryBuffer',
  bufferHr === 0 && bufferAddress !== 0n ? 'ok' : 'fail',
  bufferHr,
  bufferAddress === 0n ? '4 KB buffer failed' : `IMFMediaBuffer @ ${formatAddress(bufferAddress)} (4 KB)`,
);

const sampleOut = Buffer.alloc(POINTER_SIZE);
const sampleHr = Mfplat.MFCreateSample(sampleOut.ptr);
const sampleAddress = sampleHr === 0 ? sampleOut.readBigUInt64LE(0) : 0n;
recordCheck(
  'MFCreateSample',
  sampleHr === 0 && sampleAddress !== 0n ? 'ok' : 'fail',
  sampleHr,
  sampleAddress === 0n ? 'no sample' : `IMFSample @ ${formatAddress(sampleAddress)}`,
);

let addBufferHr = -1;
if (sampleAddress !== 0n && bufferAddress !== 0n) {
  const vtable = readPointerAt(sampleAddress);
  const addAddress = readPointerAt(vtable + BigInt(SAMPLE_ADD_BUFFER_OFFSET));
  const sampleLib = linkSymbols({
    AddBuffer: {
      args: [FFIType.u64, FFIType.u64],
      ptr: addAddress,
      returns: FFIType.i32,
    },
  });
  try {
    addBufferHr = sampleLib.symbols.AddBuffer(sampleAddress, bufferAddress);
  } finally {
    sampleLib.close();
  }
}
recordCheck(
  'IMFSample::AddBuffer',
  addBufferHr === 0 ? 'ok' : 'fail',
  addBufferHr,
  addBufferHr === 0 ? 'memory buffer attached to sample' : 'no buffer attached',
);

const workQueueOut = Buffer.alloc(4);
const workQueueHr = Mfplat.MFAllocateWorkQueue(workQueueOut.ptr);
const workQueueId = workQueueHr === 0 ? workQueueOut.readUInt32LE(0) : 0;
recordCheck(
  'MFAllocateWorkQueue',
  workQueueHr === 0 && workQueueId !== 0 ? 'ok' : 'fail',
  workQueueHr,
  workQueueId === 0 ? 'no queue' : `work queue id = 0x${workQueueId.toString(16).padStart(8, '0')}`,
);

if (workQueueId !== 0) {
  const unlockHr = Mfplat.MFUnlockWorkQueue(workQueueId);
  recordCheck('MFUnlockWorkQueue', unlockHr >= 0 ? 'ok' : 'fail', unlockHr, 'work queue released');
}

const countOut = Buffer.alloc(4);
const activateArrayOut = Buffer.alloc(POINTER_SIZE);
const videoDecoderCategory = guidBytes(MFT_CATEGORY_VIDEO_DECODER);
const enumHr = Mfplat.MFTEnumEx(videoDecoderCategory.ptr, MFT_ENUM_FLAG_ALL, null, null, activateArrayOut.ptr, countOut.ptr);
const mftCount = enumHr === 0 ? countOut.readUInt32LE(0) : 0;
const activateArrayAddress = enumHr === 0 ? activateArrayOut.readBigUInt64LE(0) : 0n;
recordCheck(
  'MFTEnumEx · VIDEO_DECODER',
  enumHr === 0 ? 'ok' : 'fail',
  enumHr,
  enumHr === 0 ? `${mftCount} MFT${mftCount === 1 ? '' : 's'} in VIDEO_DECODER` : 'enumeration failed',
);

if (activateArrayAddress !== 0n) {
  for (let i = 0; i < mftCount; i += 1) {
    const activateAddress = readPointerAt(activateArrayAddress + BigInt(i * POINTER_SIZE));
    releaseObject(activateAddress);
  }
  ole32.symbols.CoTaskMemFree(activateArrayAddress);
}

releaseObject(sampleAddress);
releaseObject(bufferAddress);
releaseObject(mediaTypeAddress);
releaseObject(attrsAddress);

if (lockHr >= 0) {
  const unlockHr = Mfplat.MFUnlockPlatform();
  recordCheck('MFUnlockPlatform', unlockHr >= 0 ? 'ok' : 'fail', unlockHr, 'platform hold released');
}

const shutdownHr = Mfplat.MFShutdown();
recordCheck('MFShutdown', shutdownHr >= 0 ? 'ok' : 'fail', shutdownHr, 'platform shutdown');

if (shouldUninitialize) ole32.symbols.CoUninitialize();
ole32.close();
kernel32.close();

const NAME_WIDTH = Math.max(...checks.map((c) => c.name.length));
const HR_WIDTH = 10;

console.log();
console.log(`${ANSI.bold}${ANSI.cyan}mfplat.dll${ANSI.reset}  ${ANSI.dim}platform probe${ANSI.reset}`);
console.log();
console.log(`  ${ANSI.dim}${'Check'.padEnd(NAME_WIDTH)}  ${'HRESULT'.padEnd(HR_WIDTH)}  Detail${ANSI.reset}`);
console.log(`  ${ANSI.dim}${'─'.repeat(NAME_WIDTH + 2 + HR_WIDTH + 2 + 64)}${ANSI.reset}`);

const statusBadge: Record<CheckStatus, string> = {
  fail: `${ANSI.red}✗${ANSI.reset}`,
  info: `${ANSI.cyan}ℹ${ANSI.reset}`,
  ok: `${ANSI.green}✓${ANSI.reset}`,
  skip: `${ANSI.dim}·${ANSI.reset}`,
};

for (const check of checks) {
  const badge = statusBadge[check.status];
  const hrText = check.hr === null ? `${ANSI.dim}${'(n/a)'.padEnd(HR_WIDTH)}${ANSI.reset}` : describeHResult(check.hr).padEnd(HR_WIDTH + 9);
  const detail = check.status === 'skip' || check.status === 'info' ? `${ANSI.dim}${check.detail}${ANSI.reset}` : check.detail;
  console.log(`  ${badge} ${ANSI.yellow}${check.name.padEnd(NAME_WIDTH)}${ANSI.reset}  ${hrText}  ${detail}`);
}

const okCount = checks.filter((c) => c.status === 'ok').length;
const failCount = checks.filter((c) => c.status === 'fail').length;
const infoCount = checks.filter((c) => c.status === 'info').length;
const skipCount = checks.filter((c) => c.status === 'skip').length;

console.log();
console.log(`  ${ANSI.bold}${okCount}${ANSI.reset} ${ANSI.green}ok${ANSI.reset}  ${ANSI.dim}•${ANSI.reset}  ${ANSI.bold}${failCount}${ANSI.reset} ${ANSI.red}fail${ANSI.reset}  ${ANSI.dim}•${ANSI.reset}  ${ANSI.bold}${infoCount}${ANSI.reset} ${ANSI.cyan}info${ANSI.reset}  ${ANSI.dim}•${ANSI.reset}  ${ANSI.bold}${skipCount}${ANSI.reset} ${ANSI.dim}skip${ANSI.reset}`);
console.log();

process.exit(failCount > 0 ? 1 : 0);
