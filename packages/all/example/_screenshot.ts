/**
 * Internal screenshot utility for the showcase. NOT a user-facing demo.
 *
 * Usage: bun ./example/_screenshot.ts <demo-name> [<delay-ms>]
 *
 * Launches `bun run example/<demo-name>.ts` in the background, waits `delay-ms`
 * (default 4000) for the demo to render, captures the entire primary monitor
 * via GDI BitBlt → Gdiplus PNG encoder, then terminates the demo and exits.
 *
 * Output: ./screenshots/<demo-name>.png
 */

import { spawn } from 'bun';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { GDI32, Gdiplus, Kernel32, User32 } from '../index';
import { Status } from '@bun-win32/gdiplus';
import { SystemMetric } from '@bun-win32/user32';

Gdiplus.Preload();

const demoName = process.argv[2];
const delayMs = Number.parseInt(process.argv[3] ?? '4000', 10);
if (!demoName) {
  console.error('usage: bun ./example/_screenshot.ts <demo-name> [delay-ms]');
  process.exit(1);
}

const screenshotsDir = resolve(import.meta.dir, '..', 'screenshots');
mkdirSync(screenshotsDir, { recursive: true });

const outputPath = resolve(screenshotsDir, `${demoName}.png`);
const demoPath = resolve(import.meta.dir, `${demoName}.ts`);

console.log(`[screenshot] launching ${demoName}…`);
const child = spawn({
  cmd: ['bun', 'run', demoPath],
  cwd: resolve(import.meta.dir, '..'),
  stdout: 'ignore',
  stderr: 'ignore',
  stdin: 'ignore',
});

console.log(`[screenshot] waiting ${delayMs} ms for render…`);
await Bun.sleep(delayMs);

console.log('[screenshot] capturing primary monitor…');

const width = User32.GetSystemMetrics(SystemMetric.SM_CXSCREEN);
const height = User32.GetSystemMetrics(SystemMetric.SM_CYSCREEN);

const hdcScreen = User32.GetDC(0n);
if (!hdcScreen) {
  console.error('[screenshot] GetDC failed');
  child.kill();
  process.exit(2);
}

const hdcMem = GDI32.CreateCompatibleDC(hdcScreen);
const hBitmap = GDI32.CreateCompatibleBitmap(hdcScreen, width, height);
const oldObject = GDI32.SelectObject(hdcMem, hBitmap);

const SRCCOPY = 0x00cc0020;
GDI32.BitBlt(hdcMem, 0, 0, width, height, hdcScreen, 0, 0, SRCCOPY);

const gdiplusTokenBuffer = Buffer.alloc(8);
const gdiplusStartupInput = Buffer.alloc(16);
gdiplusStartupInput.writeUInt32LE(1, 0);
const startupStatus = Gdiplus.GdiplusStartup(gdiplusTokenBuffer.ptr!, gdiplusStartupInput.ptr!, null);
if (startupStatus !== Status.Ok) {
  console.error(`[screenshot] GdiplusStartup failed: ${startupStatus}`);
  GDI32.SelectObject(hdcMem, oldObject);
  GDI32.DeleteObject(hBitmap);
  GDI32.DeleteDC(hdcMem);
  User32.ReleaseDC(0n, hdcScreen);
  child.kill();
  process.exit(3);
}
const gdiplusToken = gdiplusTokenBuffer.readBigUInt64LE(0);

const bitmapBuffer = Buffer.alloc(8);
const fromHbitmapStatus = Gdiplus.GdipCreateBitmapFromHBITMAP(hBitmap, 0n, bitmapBuffer.ptr!);
if (fromHbitmapStatus !== Status.Ok) {
  console.error(`[screenshot] GdipCreateBitmapFromHBITMAP failed: ${fromHbitmapStatus}`);
  Gdiplus.GdiplusShutdown(gdiplusToken);
  GDI32.SelectObject(hdcMem, oldObject);
  GDI32.DeleteObject(hBitmap);
  GDI32.DeleteDC(hdcMem);
  User32.ReleaseDC(0n, hdcScreen);
  child.kill();
  process.exit(4);
}
const gdiplusBitmap = bitmapBuffer.readBigUInt64LE(0);

// Locate PNG encoder CLSID.
const encoderCountBuffer = Buffer.alloc(4);
const encoderSizeBuffer = Buffer.alloc(4);
Gdiplus.GdipGetImageEncodersSize(encoderCountBuffer.ptr!, encoderSizeBuffer.ptr!);
const encoderCount = encoderCountBuffer.readUInt32LE(0);
const encoderTotalSize = encoderSizeBuffer.readUInt32LE(0);
const encodersBuffer = Buffer.alloc(encoderTotalSize);
Gdiplus.GdipGetImageEncoders(encoderCount, encoderTotalSize, encodersBuffer.ptr!);

// Each ImageCodecInfo on x64 is 104 bytes. CLSID at offset 0 (16 bytes). MimeType pointer at offset 32.
const codecStride = encoderTotalSize / encoderCount;
let pngClsid: Buffer | null = null;
for (let i = 0; i < encoderCount; i++) {
  const offset = i * codecStride;
  const mimeTypePtr = encodersBuffer.readBigUInt64LE(offset + 32);
  let mimeType = '';
  const memHandle = Kernel32.GetCurrentProcess();
  const peek = Buffer.alloc(2);
  for (let j = 0; j < 64; j++) {
    const readBuffer = Buffer.alloc(2);
    const bytesRead = Buffer.alloc(8);
    Kernel32.ReadProcessMemory(memHandle, mimeTypePtr + BigInt(j * 2), readBuffer.ptr!, 2, bytesRead.ptr!);
    const code = readBuffer.readUInt16LE(0);
    if (code === 0) break;
    mimeType += String.fromCharCode(code);
    peek;
  }
  if (mimeType === 'image/png') {
    pngClsid = encodersBuffer.subarray(offset, offset + 16);
    break;
  }
}

if (!pngClsid) {
  console.error('[screenshot] PNG encoder not found');
  Gdiplus.GdipDisposeImage(gdiplusBitmap);
  Gdiplus.GdiplusShutdown(gdiplusToken);
  GDI32.SelectObject(hdcMem, oldObject);
  GDI32.DeleteObject(hBitmap);
  GDI32.DeleteDC(hdcMem);
  User32.ReleaseDC(0n, hdcScreen);
  child.kill();
  process.exit(5);
}

const outputBuffer = Buffer.from(outputPath + '\0', 'utf16le');
const saveStatus = Gdiplus.GdipSaveImageToFile(gdiplusBitmap, outputBuffer.ptr!, pngClsid.ptr!, null);
if (saveStatus !== Status.Ok) {
  console.error(`[screenshot] GdipSaveImageToFile failed: ${saveStatus}`);
} else {
  console.log(`[screenshot] saved → ${outputPath}`);
}

Gdiplus.GdipDisposeImage(gdiplusBitmap);
Gdiplus.GdiplusShutdown(gdiplusToken);
GDI32.SelectObject(hdcMem, oldObject);
GDI32.DeleteObject(hBitmap);
GDI32.DeleteDC(hdcMem);
User32.ReleaseDC(0n, hdcScreen);

console.log('[screenshot] killing demo…');
child.kill();
await Bun.sleep(200);

process.exit(saveStatus === Status.Ok ? 0 : 6);
