/**
 * Media Library Dashboard
 *
 * Enumerates every `.wav` file under `C:\Windows\Media`, opens each with
 * `MFCreateSourceReaderFromURL`, pulls real duration data from the live
 * `IMFSourceReader` COM object by walking its vtable to call
 * `GetPresentationAttribute(MF_PD_DURATION)`, and renders the entire Windows
 * system-sound collection as a ranked ANSI dashboard with aggregate runtime,
 * longest/shortest clips, and a per-file bar chart of relative durations.
 *
 * APIs demonstrated:
 *   - Mfreadwrite.MFCreateSourceReaderFromURL   (open a media file)
 *   - IMFSourceReader::GetPresentationAttribute (MF_PD_DURATION via COM vtable)
 *   - IMFSourceReader::Release                  (COM cleanup)
 *   - mfplat!MFStartup / MFShutdown             (Media Foundation lifecycle)
 *   - ole32!CoInitializeEx / CoUninitialize     (COM apartment lifecycle)
 *
 * Run: bun run example:media-library-dashboard
 */

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { FFIType, dlopen, linkSymbols } from 'bun:ffi';

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

const COINIT_APARTMENTTHREADED = 0x2;
const MF_PD_DURATION_GUID = guidBytes('6c990d33-bb8e-477a-8598-0d5d96fcd88a');
const MF_SOURCE_READER_MEDIASOURCE = 0xffff_ffff;
const MF_VERSION = 0x0002_0070;
const MFSTARTUP_LITE = 0x1;
const MEDIA_FOLDER = 'C:\\Windows\\Media';
const POINTER_SIZE = 8;
const PROPVARIANT_SIZE = 24;
const RELEASE_METHOD_OFFSET = 0x10;
const GET_PRESENTATION_ATTRIBUTE_OFFSET = 0x60;
const RPC_E_CHANGED_MODE = 0x8001_0106 >>> 0;

const kernel32 = dlopen('kernel32.dll', {
  GetCurrentProcess: { args: [], returns: FFIType.u64 },
  ReadProcessMemory: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
});

const ole32 = dlopen('ole32.dll', {
  CoInitializeEx: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
  CoUninitialize: { args: [], returns: FFIType.void },
});

const mfplat = dlopen('mfplat.dll', {
  MFShutdown: { args: [], returns: FFIType.i32 },
  MFStartup: { args: [FFIType.u32, FFIType.u32], returns: FFIType.i32 },
});

const currentProcess = kernel32.symbols.GetCurrentProcess();

Mfreadwrite.Preload(['MFCreateSourceReaderFromURL']);

interface MediaEntry {
  byteSize: number;
  durationSeconds: number;
  fileName: string;
  hr: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0 || !Number.isFinite(seconds)) return '     —  ';
  const totalMs = Math.round(seconds * 1000);
  const minutes = Math.floor(totalMs / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  return `${minutes.toString().padStart(2, ' ')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

function formatHResult(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0')}`;
}

function readPointerAt(address: bigint): bigint {
  const buffer = Buffer.alloc(POINTER_SIZE);
  const ok = kernel32.symbols.ReadProcessMemory(currentProcess, address, buffer.ptr, BigInt(POINTER_SIZE), null);
  if (ok === 0) throw new Error(`ReadProcessMemory failed at 0x${address.toString(16)}`);
  return buffer.readBigUInt64LE(0);
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

function probeFile(fullPath: string): MediaEntry {
  const fileName = fullPath.slice(MEDIA_FOLDER.length + 1);
  const byteSize = statSync(fullPath).size;
  const urlBuffer = Buffer.from(`${fullPath}\0`, 'utf16le');
  const readerOut = Buffer.alloc(POINTER_SIZE);

  const hr = Mfreadwrite.MFCreateSourceReaderFromURL(urlBuffer.ptr, null, readerOut.ptr);
  if (hr !== 0) return { byteSize, durationSeconds: -1, fileName, hr };

  const readerAddress = readerOut.readBigUInt64LE(0);
  if (readerAddress === 0n) return { byteSize, durationSeconds: -1, fileName, hr };

  const vtableAddress = readPointerAt(readerAddress);
  const getAttrAddress = readPointerAt(vtableAddress + BigInt(GET_PRESENTATION_ATTRIBUTE_OFFSET));
  const releaseAddress = readPointerAt(vtableAddress + BigInt(RELEASE_METHOD_OFFSET));

  const vtable = linkSymbols({
    GetPresentationAttribute: {
      args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr],
      ptr: getAttrAddress,
      returns: FFIType.i32,
    },
    Release: {
      args: [FFIType.u64],
      ptr: releaseAddress,
      returns: FFIType.u32,
    },
  });

  let durationSeconds = -1;
  try {
    const propvariant = Buffer.alloc(PROPVARIANT_SIZE);
    const attrHr = vtable.symbols.GetPresentationAttribute(readerAddress, MF_SOURCE_READER_MEDIASOURCE, MF_PD_DURATION_GUID.ptr, propvariant.ptr);
    if (attrHr === 0) {
      const units100ns = propvariant.readBigUInt64LE(8);
      durationSeconds = Number(units100ns) / 10_000_000;
    }
  } finally {
    vtable.symbols.Release(readerAddress);
    vtable.close();
  }

  return { byteSize, durationSeconds, fileName, hr };
}

const coInitHr = ole32.symbols.CoInitializeEx(null, COINIT_APARTMENTTHREADED);
const shouldUninitialize = coInitHr >= 0;
if (coInitHr < 0 && (coInitHr >>> 0) !== RPC_E_CHANGED_MODE) {
  console.error(`${ANSI.red}CoInitializeEx failed: ${formatHResult(coInitHr)}${ANSI.reset}`);
  process.exit(1);
}

const mfStartHr = mfplat.symbols.MFStartup(MF_VERSION, MFSTARTUP_LITE);
if (mfStartHr < 0) {
  console.error(`${ANSI.red}MFStartup failed: ${formatHResult(mfStartHr)}${ANSI.reset}`);
  if (shouldUninitialize) ole32.symbols.CoUninitialize();
  process.exit(1);
}

const entries: MediaEntry[] = [];
try {
  const fileNames = readdirSync(MEDIA_FOLDER).filter((n) => n.toLowerCase().endsWith('.wav'));
  for (const name of fileNames) entries.push(probeFile(join(MEDIA_FOLDER, name)));
} finally {
  mfplat.symbols.MFShutdown();
  if (shouldUninitialize) ole32.symbols.CoUninitialize();
}

mfplat.close();
ole32.close();
kernel32.close();

const successful = entries.filter((e) => e.durationSeconds > 0);
successful.sort((a, b) => b.durationSeconds - a.durationSeconds);

const longestSeconds = successful.length > 0 ? successful[0].durationSeconds : 1;
const totalSeconds = successful.reduce((sum, e) => sum + e.durationSeconds, 0);
const totalBytes = entries.reduce((sum, e) => sum + e.byteSize, 0);
const longest = successful[0];
const shortest = successful.at(-1);

const BAR_WIDTH = 28;
const NAME_WIDTH = Math.min(34, Math.max(18, ...successful.map((e) => e.fileName.length)));

console.log();
console.log(`${ANSI.bold}${ANSI.cyan}Windows Media Library${ANSI.reset}  ${ANSI.dim}${MEDIA_FOLDER}\\*.wav${ANSI.reset}`);
console.log();
console.log(`  ${ANSI.dim}${'File'.padEnd(NAME_WIDTH)}  ${'Duration'.padStart(8)}     ${'Size'.padStart(8)}   Relative duration${ANSI.reset}`);
console.log(`  ${ANSI.dim}${'─'.repeat(NAME_WIDTH + 2 + 8 + 5 + 8 + 3 + BAR_WIDTH + 2)}${ANSI.reset}`);

for (const entry of successful) {
  const ratio = entry.durationSeconds / longestSeconds;
  const filled = Math.max(1, Math.round(ratio * BAR_WIDTH));
  const bar = `${ANSI.green}${'█'.repeat(filled)}${ANSI.dim}${'·'.repeat(BAR_WIDTH - filled)}${ANSI.reset}`;
  const nameColored = `${ANSI.yellow}${entry.fileName.padEnd(NAME_WIDTH)}${ANSI.reset}`;
  const durationColored = `${ANSI.magenta}${formatDuration(entry.durationSeconds)}${ANSI.reset}`;
  const sizeColored = `${ANSI.dim}${formatBytes(entry.byteSize).padStart(8)}${ANSI.reset}`;
  console.log(`  ${nameColored}  ${durationColored}   ${sizeColored}   ${bar}`);
}

const failed = entries.filter((e) => e.durationSeconds <= 0);
for (const entry of failed) {
  const marker = `${ANSI.red}${formatHResult(entry.hr)}${ANSI.reset}`;
  console.log(`  ${ANSI.dim}${entry.fileName.padEnd(NAME_WIDTH)}${ANSI.reset}  ${marker}  ${ANSI.dim}(no duration)${ANSI.reset}`);
}

console.log();
console.log(`  ${ANSI.bold}${entries.length}${ANSI.reset} files  ${ANSI.dim}•${ANSI.reset}  total ${ANSI.bold}${formatDuration(totalSeconds)}${ANSI.reset}  ${ANSI.dim}•${ANSI.reset}  ${formatBytes(totalBytes)}  ${ANSI.dim}•${ANSI.reset}  ${ANSI.green}${successful.length} decoded${ANSI.reset}${failed.length > 0 ? `, ${ANSI.red}${failed.length} failed${ANSI.reset}` : ''}`);
if (longest !== undefined) console.log(`  ${ANSI.dim}longest  ${ANSI.reset}${ANSI.yellow}${longest.fileName}${ANSI.reset}  ${ANSI.magenta}${formatDuration(longest.durationSeconds)}${ANSI.reset}`);
if (shortest !== undefined) console.log(`  ${ANSI.dim}shortest ${ANSI.reset}${ANSI.yellow}${shortest.fileName}${ANSI.reset}  ${ANSI.magenta}${formatDuration(shortest.durationSeconds)}${ANSI.reset}`);
console.log();
