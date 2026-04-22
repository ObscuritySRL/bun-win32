/**
 * Mfreadwrite Factory Probe
 *
 * Exercises every entry point exported by `mfreadwrite.dll` and reports a
 * diagnostic matrix showing which factory paths succeed on this machine.
 * Initializes COM + Media Foundation, resolves the class factories for
 * `CLSID_MFSourceReader` and `CLSID_MFSinkWriter` via `DllGetClassObject`,
 * creates a source reader from a URL, creates a second source reader from an
 * `IMFByteStream`, creates a sink writer bound to a temp `.mp3` path, and
 * probes `DllCanUnloadNow` at every checkpoint while releasing each live COM
 * object through its vtable.
 *
 * APIs demonstrated:
 *   - Mfreadwrite.DllCanUnloadNow                     (COM unload probe)
 *   - Mfreadwrite.DllGetClassObject                   (resolve class factories)
 *   - Mfreadwrite.MFCreateSourceReaderFromURL         (reader from URL)
 *   - Mfreadwrite.MFCreateSourceReaderFromByteStream  (reader from byte stream)
 *   - Mfreadwrite.MFCreateSourceReaderFromMediaSource (documented; skipped)
 *   - Mfreadwrite.MFCreateSinkWriterFromURL           (writer bound to URL)
 *   - Mfreadwrite.MFCreateSinkWriterFromMediaSink     (documented; skipped)
 *   - IUnknown::Release                               (release every object)
 *   - mfplat!MFCreateFile                             (build the IMFByteStream)
 *   - mfplat!MFStartup / MFShutdown                   (MF platform lifecycle)
 *   - ole32!CoInitializeEx / CoUninitialize           (COM apartment lifecycle)
 *
 * Run: bun run example:mfreadwrite-factory-probe
 */

import { existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { FFIType, dlopen, linkSymbols, read } from 'bun:ffi';
import type { Pointer } from 'bun:ffi';

import Mfreadwrite from '..';

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

const CLASS_E_CLASSNOTAVAILABLE = 0x8004_0111 >>> 0;
const CLSID_MF_SINK_WRITER = 'a3bbfb17-8273-4e52-9e0e-9739dc887990';
const CLSID_MF_SOURCE_READER = '1777133c-0881-411b-a577-ad545f0714c4';
const COINIT_APARTMENTTHREADED = 0x2;
const IID_I_CLASS_FACTORY = '00000001-0000-0000-c000-000000000046';
const MF_ACCESSMODE_READ = 1;
const MF_FILEFLAGS_NONE = 0;
const MF_OPENMODE_FAIL_IF_NOT_EXIST = 0;
const MF_VERSION = 0x0002_0070;
const MFSTARTUP_LITE = 0x1;
const POINTER_SIZE = 8;
const RELEASE_METHOD_OFFSET = 0x10;
const RPC_E_CHANGED_MODE = 0x8001_0106 >>> 0;
const S_FALSE = 0x0000_0001;
const SAMPLE_SOURCE_PATH = 'C:\\Windows\\Media\\chimes.wav';
const SINK_TARGET_PATH = join(tmpdir(), `bun-mfreadwrite-probe-${process.pid}.mp3`);

const kernel32 = dlopen('kernel32.dll', {
  GetCurrentProcess: { args: [], returns: FFIType.u64 },
  ReadProcessMemory: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
});

const ole32 = dlopen('ole32.dll', {
  CoInitializeEx: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
  CoUninitialize: { args: [], returns: FFIType.void },
});

const mfplat = dlopen('mfplat.dll', {
  MFCreateFile: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  MFShutdown: { args: [], returns: FFIType.i32 },
  MFStartup: { args: [FFIType.u32, FFIType.u32], returns: FFIType.i32 },
});

const currentProcess = kernel32.symbols.GetCurrentProcess();

Mfreadwrite.Preload();

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
  if (hr === S_FALSE) return `${ANSI.yellow}S_FALSE${ANSI.reset}`;
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

function linkRelease(objectAddress: bigint): { close(): void; release(): number } {
  const vtableAddress = readPointerAt(objectAddress);
  const releaseAddress = readPointerAt(vtableAddress + BigInt(RELEASE_METHOD_OFFSET));
  const library = linkSymbols({
    Release: {
      args: [FFIType.u64],
      ptr: releaseAddress,
      returns: FFIType.u32,
    },
  });
  return {
    close: () => library.close(),
    release: () => library.symbols.Release(objectAddress),
  };
}

function recordCheck(name: string, status: CheckStatus, hr: number | null, detail: string): void {
  checks.push({ detail, hr, name, status });
}

function toWideBuffer(value: string): Buffer {
  return Buffer.from(`${value}\0`, 'utf16le');
}

const clsidSourceReader = guidBytes(CLSID_MF_SOURCE_READER);
const clsidSinkWriter = guidBytes(CLSID_MF_SINK_WRITER);
const iidClassFactory = guidBytes(IID_I_CLASS_FACTORY);

const coInitHr = ole32.symbols.CoInitializeEx(null, COINIT_APARTMENTTHREADED);
const shouldUninitialize = coInitHr >= 0;
if (coInitHr < 0 && (coInitHr >>> 0) !== RPC_E_CHANGED_MODE) {
  console.error(`${ANSI.red}CoInitializeEx failed: ${formatHResult(coInitHr)}${ANSI.reset}`);
  process.exit(1);
}
recordCheck('CoInitializeEx', coInitHr >= 0 || (coInitHr >>> 0) === RPC_E_CHANGED_MODE ? 'ok' : 'fail', coInitHr, `apartment = STA`);

const mfStartHr = mfplat.symbols.MFStartup(MF_VERSION, MFSTARTUP_LITE);
recordCheck('MFStartup', mfStartHr >= 0 ? 'ok' : 'fail', mfStartHr, `MF_VERSION = ${formatHResult(MF_VERSION)}, MFSTARTUP_LITE`);

const unloadBaseline = Mfreadwrite.DllCanUnloadNow();
recordCheck('DllCanUnloadNow (baseline)', unloadBaseline === S_FALSE || unloadBaseline === 0 ? 'ok' : 'fail', unloadBaseline, unloadBaseline === S_FALSE ? 'server refuses unload (expected under MF)' : 'server reports unloadable');

const sourceFactoryOut = Buffer.alloc(POINTER_SIZE);
const sourceFactoryHr = Mfreadwrite.DllGetClassObject(clsidSourceReader.ptr, iidClassFactory.ptr, sourceFactoryOut.ptr);
const sourceFactoryAddress = sourceFactoryHr === 0 ? sourceFactoryOut.readBigUInt64LE(0) : 0n;
const sourceFactoryStatus: CheckStatus =
  sourceFactoryHr === 0 && sourceFactoryAddress !== 0n ? 'ok' : (sourceFactoryHr >>> 0) === CLASS_E_CLASSNOTAVAILABLE ? 'info' : 'fail';
const sourceFactoryDetail =
  sourceFactoryHr === 0 && sourceFactoryAddress !== 0n
    ? `IClassFactory @ ${formatAddress(sourceFactoryAddress)}`
    : (sourceFactoryHr >>> 0) === CLASS_E_CLASSNOTAVAILABLE
      ? 'CLSID not exposed as class factory — use MFCreateSourceReaderFromURL instead'
      : 'no class factory';
recordCheck('DllGetClassObject · CLSID_MFSourceReader', sourceFactoryStatus, sourceFactoryHr, sourceFactoryDetail);

const sinkFactoryOut = Buffer.alloc(POINTER_SIZE);
const sinkFactoryHr = Mfreadwrite.DllGetClassObject(clsidSinkWriter.ptr, iidClassFactory.ptr, sinkFactoryOut.ptr);
const sinkFactoryAddress = sinkFactoryHr === 0 ? sinkFactoryOut.readBigUInt64LE(0) : 0n;
const sinkFactoryStatus: CheckStatus =
  sinkFactoryHr === 0 && sinkFactoryAddress !== 0n ? 'ok' : (sinkFactoryHr >>> 0) === CLASS_E_CLASSNOTAVAILABLE ? 'info' : 'fail';
const sinkFactoryDetail =
  sinkFactoryHr === 0 && sinkFactoryAddress !== 0n
    ? `IClassFactory @ ${formatAddress(sinkFactoryAddress)}`
    : (sinkFactoryHr >>> 0) === CLASS_E_CLASSNOTAVAILABLE
      ? 'CLSID not exposed as class factory — use MFCreateSinkWriterFromURL instead'
      : 'no class factory';
recordCheck('DllGetClassObject · CLSID_MFSinkWriter', sinkFactoryStatus, sinkFactoryHr, sinkFactoryDetail);

const sampleUrl = toWideBuffer(SAMPLE_SOURCE_PATH);

const readerFromUrlOut = Buffer.alloc(POINTER_SIZE);
const readerFromUrlHr = Mfreadwrite.MFCreateSourceReaderFromURL(sampleUrl.ptr, null, readerFromUrlOut.ptr);
const readerFromUrlAddress = readerFromUrlHr === 0 ? readerFromUrlOut.readBigUInt64LE(0) : 0n;
recordCheck(
  'MFCreateSourceReaderFromURL',
  readerFromUrlHr === 0 && readerFromUrlAddress !== 0n ? 'ok' : 'fail',
  readerFromUrlHr,
  readerFromUrlAddress === 0n ? SAMPLE_SOURCE_PATH : `IMFSourceReader @ ${formatAddress(readerFromUrlAddress)}`,
);

const byteStreamOut = Buffer.alloc(POINTER_SIZE);
const byteStreamHr = mfplat.symbols.MFCreateFile(MF_ACCESSMODE_READ, MF_OPENMODE_FAIL_IF_NOT_EXIST, MF_FILEFLAGS_NONE, sampleUrl.ptr, byteStreamOut.ptr);
const byteStreamAddress = byteStreamHr === 0 ? byteStreamOut.readBigUInt64LE(0) : 0n;
const byteStreamPointer: Pointer | null = byteStreamHr === 0 && byteStreamAddress !== 0n ? (read.ptr(byteStreamOut.ptr, 0) as Pointer) : null;

let readerFromByteStreamAddress = 0n;
let readerFromByteStreamHr = byteStreamHr;
if (byteStreamHr === 0 && byteStreamPointer !== null) {
  const readerOut = Buffer.alloc(POINTER_SIZE);
  readerFromByteStreamHr = Mfreadwrite.MFCreateSourceReaderFromByteStream(byteStreamPointer, null, readerOut.ptr);
  if (readerFromByteStreamHr === 0) readerFromByteStreamAddress = readerOut.readBigUInt64LE(0);
}
recordCheck(
  'MFCreateSourceReaderFromByteStream',
  readerFromByteStreamHr === 0 && readerFromByteStreamAddress !== 0n ? 'ok' : 'fail',
  readerFromByteStreamHr,
  readerFromByteStreamAddress === 0n ? 'IMFByteStream probe skipped or reader failed' : `IMFSourceReader @ ${formatAddress(readerFromByteStreamAddress)}`,
);

if (existsSync(SINK_TARGET_PATH)) unlinkSync(SINK_TARGET_PATH);
const sinkUrl = toWideBuffer(SINK_TARGET_PATH);
const sinkOut = Buffer.alloc(POINTER_SIZE);
const sinkHr = Mfreadwrite.MFCreateSinkWriterFromURL(sinkUrl.ptr, null, null, sinkOut.ptr);
const sinkAddress = sinkHr === 0 ? sinkOut.readBigUInt64LE(0) : 0n;
recordCheck(
  'MFCreateSinkWriterFromURL',
  sinkHr === 0 && sinkAddress !== 0n ? 'ok' : 'fail',
  sinkHr,
  sinkAddress === 0n ? SINK_TARGET_PATH : `IMFSinkWriter @ ${formatAddress(sinkAddress)}  →  ${SINK_TARGET_PATH}`,
);

recordCheck('MFCreateSourceReaderFromMediaSource', 'skip', null, 'needs an IMFMediaSource (IMFSourceResolver bindings not in this package)');
recordCheck('MFCreateSinkWriterFromMediaSink', 'skip', null, 'needs an IMFMediaSink (IMFMediaSink factory bindings not in this package)');

const addresses: Array<[string, bigint]> = [
  ['CLSID_MFSourceReader factory', sourceFactoryAddress],
  ['CLSID_MFSinkWriter factory', sinkFactoryAddress],
  ['Reader from URL', readerFromUrlAddress],
  ['Reader from byte stream', readerFromByteStreamAddress],
  ['Byte stream (MFCreateFile)', byteStreamAddress],
  ['Sink writer to URL', sinkAddress],
];

for (const [, address] of addresses.slice().reverse()) {
  if (address === 0n) continue;
  const released = linkRelease(address);
  try {
    released.release();
  } finally {
    released.close();
  }
}

const unloadAfterRelease = Mfreadwrite.DllCanUnloadNow();
recordCheck(
  'DllCanUnloadNow (after Release chain)',
  unloadAfterRelease === S_FALSE || unloadAfterRelease === 0 ? 'ok' : 'fail',
  unloadAfterRelease,
  unloadAfterRelease === S_FALSE ? 'MF still retains internal references' : 'server reports unloadable',
);

mfplat.symbols.MFShutdown();
if (shouldUninitialize) ole32.symbols.CoUninitialize();
mfplat.close();
ole32.close();
kernel32.close();

if (existsSync(SINK_TARGET_PATH)) {
  try {
    unlinkSync(SINK_TARGET_PATH);
  } catch {
    /* best effort */
  }
}

const NAME_WIDTH = Math.max(...checks.map((c) => c.name.length));
const HR_WIDTH = 10;

console.log();
console.log(`${ANSI.bold}${ANSI.cyan}mfreadwrite.dll${ANSI.reset}  ${ANSI.dim}factory probe${ANSI.reset}`);
console.log(`${ANSI.dim}sample source  ${ANSI.reset}${SAMPLE_SOURCE_PATH}`);
console.log(`${ANSI.dim}sink target    ${ANSI.reset}${SINK_TARGET_PATH}`);
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
