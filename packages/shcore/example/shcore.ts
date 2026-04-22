/**
 * Shcore process identity - DPI awareness, AppUserModelID, container status,
 * and a round-trip through an in-memory IStream.
 *
 * A realistic tour of the shcore.dll exports a modern Windows desktop app
 * touches during startup. We query the process's DPI awareness, read its
 * AppUserModelID (used by the taskbar to group windows and pin jump lists),
 * detect whether we're running inside an Isolated or WDAG container, and
 * finally round-trip a payload through a SHCreateMemStream-backed IStream
 * using IStream_Write / IStream_Size / IStream_Reset / IStream_Read. When
 * we're done we release the stream via IUnknown_AtomicRelease.
 *
 * Demonstrates:
 * - GetProcessDpiAwareness
 * - GetScaleFactorForDevice
 * - GetCurrentProcessExplicitAppUserModelID (CoTaskMemFree-owned output)
 * - IsProcessInIsolatedContainer / IsProcessInWDAGContainer
 * - SHCreateMemStream + IStream_Write / _Size / _Reset / _Read
 * - IUnknown_AtomicRelease
 * - SHAnsiToUnicode (ANSI -> UTF-16 helper)
 *
 * Run: bun run example/shcore.ts
 */

import { toArrayBuffer, type Pointer } from 'bun:ffi';

import Shcore, { DisplayDeviceType, ProcessDpiAwareness } from '../index';

const divider = '-'.repeat(72);
const awarenessLabel: Record<number, string> = {
  [ProcessDpiAwareness.PROCESS_DPI_UNAWARE]: 'PROCESS_DPI_UNAWARE',
  [ProcessDpiAwareness.PROCESS_SYSTEM_DPI_AWARE]: 'PROCESS_SYSTEM_DPI_AWARE',
  [ProcessDpiAwareness.PROCESS_PER_MONITOR_DPI_AWARE]: 'PROCESS_PER_MONITOR_DPI_AWARE',
};

function readWideString(ptr: Pointer, maxBytes = 1024): string {
  const buf = Buffer.from(toArrayBuffer(ptr, 0, maxBytes));
  let end = 0;
  while (end < buf.length - 1) {
    if (buf[end] === 0 && buf[end + 1] === 0) break;
    end += 2;
  }
  return buf.subarray(0, end).toString('utf16le');
}

console.log('Shcore process identity report');
console.log(`Generated: ${new Date().toLocaleString()}`);
console.log('');

// ---- 1. DPI awareness and scale factor ---------------------------------
console.log('1. Process DPI awareness');
console.log(divider);

const awarenessBuf = Buffer.alloc(4);
const gpdaHr = Shcore.GetProcessDpiAwareness(0n, awarenessBuf.ptr);
if (gpdaHr === 0) {
  const value = awarenessBuf.readInt32LE(0);
  console.log(`  Awareness: ${awarenessLabel[value] ?? `unknown (${value})`}`);
} else {
  console.log(`  GetProcessDpiAwareness failed: hr=0x${(gpdaHr >>> 0).toString(16)}`);
}

const primaryScale = Shcore.GetScaleFactorForDevice(DisplayDeviceType.DEVICE_PRIMARY);
console.log(`  Primary display preferred scale: ${primaryScale}%`);
console.log('');

// ---- 2. AppUserModelID --------------------------------------------------
console.log('2. Explicit AppUserModelID (taskbar grouping identity)');
console.log(divider);

const appIdOutBuf = Buffer.alloc(8); // receives PWSTR (heap allocated)
const aumidHr = Shcore.GetCurrentProcessExplicitAppUserModelID(appIdOutBuf.ptr);

if (aumidHr === 0) {
  const strPtrValue = appIdOutBuf.readBigUInt64LE(0);
  if (strPtrValue !== 0n) {
    const appId = readWideString(Number(strPtrValue) as unknown as Pointer);
    console.log(`  AppUserModelID: ${appId}`);
    // In production, call Ole32.CoTaskMemFree(strPtr) once done. This example
    // intentionally leaves the allocation to process teardown.
  } else {
    console.log('  AppUserModelID: (empty)');
  }
} else {
  // 0x80073D11 = APPMODEL_ERROR_NO_APPLICATION — common for non-packaged, un-set processes.
  console.log(`  No explicit AppUserModelID set (hr=0x${(aumidHr >>> 0).toString(16)})`);
}
console.log('');

// ---- 3. Container detection --------------------------------------------
console.log('3. Isolation / container detection');
console.log(divider);

const isoFlag = Buffer.alloc(4);
const isoHr = Shcore.IsProcessInIsolatedContainer(isoFlag.ptr);
if (isoHr === 0) {
  console.log(`  IsolatedContainer: ${isoFlag.readInt32LE(0) !== 0 ? 'YES' : 'no'}`);
} else {
  console.log(`  IsolatedContainer query failed: hr=0x${(isoHr >>> 0).toString(16)}`);
}

const wdagFlag = Buffer.alloc(4);
const wdagHr = Shcore.IsProcessInWDAGContainer(0n as unknown as Pointer, wdagFlag.ptr);
if (wdagHr === 0) {
  console.log(`  WDAGContainer:     ${wdagFlag.readInt32LE(0) !== 0 ? 'YES' : 'no'}`);
} else {
  console.log(`  WDAGContainer query failed: hr=0x${(wdagHr >>> 0).toString(16)}`);
}
console.log('');

// ---- 4. In-memory IStream round trip -----------------------------------
console.log('4. SHCreateMemStream + IStream_Write / _Size / _Reset / _Read');
console.log(divider);

const payload = Buffer.from('The quick brown fox jumps over the lazy dog', 'utf8');
const pstm = Shcore.SHCreateMemStream(null, 0);

if (pstm === 0n) {
  console.log('  SHCreateMemStream returned NULL — aborting stream demo.');
} else {
  console.log(`  Created stream: IStream* = 0x${pstm.toString(16)}`);

  // Write the payload
  const writeHr = Shcore.IStream_Write(pstm, payload.ptr, payload.length);
  console.log(`  IStream_Write(${payload.length} bytes)  -> hr=0x${(writeHr >>> 0).toString(16)}`);

  // Inspect size
  const sizeBuf = Buffer.alloc(8); // ULARGE_INTEGER (u64)
  const sizeHr = Shcore.IStream_Size(pstm, sizeBuf.ptr);
  console.log(`  IStream_Size               -> hr=0x${(sizeHr >>> 0).toString(16)}, bytes=${sizeBuf.readBigUInt64LE(0)}`);

  // Reset seek pointer to 0
  const resetHr = Shcore.IStream_Reset(pstm);
  console.log(`  IStream_Reset              -> hr=0x${(resetHr >>> 0).toString(16)}`);

  // Read the payload back
  const readBuf = Buffer.alloc(payload.length);
  const readHr = Shcore.IStream_Read(pstm, readBuf.ptr, payload.length);
  console.log(`  IStream_Read(${payload.length} bytes)   -> hr=0x${(readHr >>> 0).toString(16)}`);
  console.log(`  Round-tripped payload: "${readBuf.toString('utf8')}"`);

  // Release via IUnknown_AtomicRelease: takes IUnknown** (a pointer to pointer).
  // We allocate a local 8-byte slot holding the IStream*, then pass its address.
  const slot = Buffer.alloc(8);
  slot.writeBigUInt64LE(pstm, 0);
  Shcore.IUnknown_AtomicRelease(slot.ptr);
  console.log('  IUnknown_AtomicRelease     -> stream released, slot nulled');
}
console.log('');

// ---- 5. ANSI -> UTF-16 via SHAnsiToUnicode -----------------------------
console.log('5. SHAnsiToUnicode (in-place Win32 transcoding)');
console.log(divider);

const ansi = Buffer.from('Shcore says hello\0', 'ascii');
const wide = Buffer.alloc(128); // 64 wide chars
const written = Shcore.SHAnsiToUnicode(ansi.ptr, wide.ptr, 64);
console.log(`  Bytes translated: ${written} wide chars (incl. terminator)`);
console.log(`  Output: "${wide.subarray(0, (written - 1) * 2).toString('utf16le')}"`);
console.log('');

console.log(divider);
console.log('Report complete.');
