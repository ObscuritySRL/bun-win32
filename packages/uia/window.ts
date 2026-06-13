// Window targeting (find / enumerate / by-process) and PrintWindow screenshots for visual assertions.
// EnumWindows invokes its callback synchronously on the calling thread (no foreign-thread hazard).
// PrintWindow + GDI capture a window's own rendering; the PNG can be blank on a locked session.

import { FFIType, JSCallback } from 'bun:ffi';

import Gdi32 from '@bun-win32/gdi32';
import User32 from '@bun-win32/user32';

import { encodePNG } from './png';

export interface WindowInfo {
  hWnd: bigint;
  title: string;
  className: string;
  processId: number;
}

function readWindowText(hWnd: bigint): string {
  const buffer = Buffer.alloc(1024);
  const length = User32.GetWindowTextW(hWnd, buffer.ptr!, 512);
  return length > 0 ? buffer.subarray(0, length * 2).toString('utf16le') : '';
}

function readClassName(hWnd: bigint): string {
  const buffer = Buffer.alloc(512);
  const length = User32.GetClassNameW(hWnd, buffer.ptr!, 256);
  return length > 0 ? buffer.subarray(0, length * 2).toString('utf16le') : '';
}

function readProcessId(hWnd: bigint): number {
  const out = Buffer.alloc(4);
  User32.GetWindowThreadProcessId(hWnd, out.ptr!);
  return out.readUInt32LE(0);
}

/** Find a top-level window by exact title and/or class name. Returns 0n if none. */
export function findWindow(target: { className?: string; title?: string }): bigint {
  const classBuffer = target.className === undefined ? null : Buffer.from(`${target.className}\0`, 'utf16le').ptr!;
  const titleBuffer = target.title === undefined ? null : Buffer.from(`${target.title}\0`, 'utf16le').ptr!;
  return User32.FindWindowW(classBuffer, titleBuffer);
}

/** Enumerate visible, titled top-level windows with their class and owning process id. */
export function listWindows(): WindowInfo[] {
  const windows: WindowInfo[] = [];
  const callback = new JSCallback(
    (hWnd: bigint) => {
      if (User32.IsWindowVisible(hWnd) !== 0) {
        const title = readWindowText(hWnd);
        if (title.length > 0) windows.push({ hWnd, title, className: readClassName(hWnd), processId: readProcessId(hWnd) });
      }
      return 1;
    },
    { args: [FFIType.u64, FFIType.i64], returns: FFIType.i32 },
  );
  User32.EnumWindows(callback.ptr!, 0n);
  callback.close();
  return windows;
}

/** The first visible, titled top-level window owned by the process, or 0n. */
export function windowForProcess(processId: number): bigint {
  for (const window of listWindows()) {
    if (window.processId === processId) return window.hWnd;
  }
  return 0n;
}

/** Capture a window via PrintWindow and encode it as PNG bytes (BGRA→RGB). Empty Uint8Array on failure. */
export function screenshot(hWnd: bigint): Uint8Array {
  const PW_RENDERFULLCONTENT = 0x0000_0002;
  const rect = Buffer.alloc(16);
  if (User32.GetWindowRect(hWnd, rect.ptr!) === 0) return new Uint8Array(0);
  const width = rect.readInt32LE(8) - rect.readInt32LE(0);
  const height = rect.readInt32LE(12) - rect.readInt32LE(4);
  if (width <= 0 || height <= 0) return new Uint8Array(0);

  const hdcWindow = User32.GetWindowDC(hWnd);
  const hdcMem = Gdi32.CreateCompatibleDC(hdcWindow);
  const hBitmap = Gdi32.CreateCompatibleBitmap(hdcWindow, width, height);
  Gdi32.SelectObject(hdcMem, hBitmap);
  User32.PrintWindow(hWnd, hdcMem, PW_RENDERFULLCONTENT);

  const info = Buffer.alloc(40); // BITMAPINFOHEADER
  info.writeUInt32LE(40, 0); // biSize
  info.writeInt32LE(width, 4); // biWidth
  info.writeInt32LE(-height, 8); // biHeight (negative → top-down rows)
  info.writeUInt16LE(1, 12); // biPlanes
  info.writeUInt16LE(32, 14); // biBitCount (BGRA)
  info.writeUInt32LE(0, 16); // biCompression = BI_RGB

  const bgra = Buffer.alloc(width * height * 4);
  Gdi32.GetDIBits(hdcMem, hBitmap, 0, height, bgra.ptr!, info.ptr!, 0); // DIB_RGB_COLORS

  Gdi32.DeleteObject(hBitmap);
  Gdi32.DeleteDC(hdcMem);
  User32.ReleaseDC(hWnd, hdcWindow);

  const rgb = new Uint8Array(width * height * 3);
  for (let source = 0, target = 0; source < bgra.length; source += 4, target += 3) {
    rgb[target] = bgra[source + 2]!; // R
    rgb[target + 1] = bgra[source + 1]!; // G
    rgb[target + 2] = bgra[source]!; // B
  }
  return encodePNG(rgb, width, height);
}
