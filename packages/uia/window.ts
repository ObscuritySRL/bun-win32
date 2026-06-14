// Window targeting (find / enumerate / by-process) and PrintWindow screenshots for visual assertions.
// EnumWindows invokes its callback synchronously on the calling thread (no foreign-thread hazard).
// PrintWindow + GDI capture a window's own rendering; the PNG can be blank on a locked session.

import { FFIType, JSCallback } from 'bun:ffi';

import Gdi32 from '@bun-win32/gdi32';
import Kernel32 from '@bun-win32/kernel32';
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

export interface WindowCapture {
  rgb: Uint8Array;
  width: number;
  height: number;
  /** The window's top-left in virtual-screen pixels — subtract from UIA bounds to get window-local. */
  originX: number;
  originY: number;
}

/** Capture a window via PrintWindow into a tightly packed RGB buffer (BGRA→RGB). Null on failure. */
export function captureWindowRGB(hWnd: bigint): WindowCapture | null {
  const PW_RENDERFULLCONTENT = 0x0000_0002;
  const rect = Buffer.alloc(16);
  if (User32.GetWindowRect(hWnd, rect.ptr!) === 0) return null;
  const originX = rect.readInt32LE(0);
  const originY = rect.readInt32LE(4);
  const width = rect.readInt32LE(8) - originX;
  const height = rect.readInt32LE(12) - originY;
  if (width <= 0 || height <= 0) return null;

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
  return { rgb, width, height, originX, originY };
}

/** Capture a window via PrintWindow and encode it as PNG bytes. Empty Uint8Array on failure. */
export function screenshot(hWnd: bigint): Uint8Array {
  const capture = captureWindowRGB(hWnd);
  if (capture === null) return new Uint8Array(0);
  return encodePNG(capture.rgb, capture.width, capture.height);
}

const PROCESS_QUERY_LIMITED_INFORMATION = 0x0000_1000;
const SW_MAXIMIZE = 0x0000_0003;
const SW_MINIMIZE = 0x0000_0006;
const SW_RESTORE = 0x0000_0009;
const HWND_TOP = 0x0000_0000n;
const SWP_NOSIZE = 0x0000_0001;
const SWP_NOMOVE = 0x0000_0002;
const SWP_NOACTIVATE = 0x0000_0010;

/** The full image path of the process behind a window's pid (e.g. `C:\Windows\System32\notepad.exe`), or '' for a protected/system process. */
export function processImagePath(processId: number): string {
  const handle = Kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, processId);
  if (handle === 0n) return '';
  try {
    const buffer = Buffer.alloc(1024); // wchar_t[512]
    const size = Buffer.alloc(4);
    size.writeUInt32LE(512, 0); // in: capacity in chars; out: chars written (excl. null)
    if (Kernel32.QueryFullProcessImageNameW(handle, 0, buffer.ptr!, size.ptr!) === 0) return '';
    return buffer.subarray(0, size.readUInt32LE(0) * 2).toString('utf16le');
  } finally {
    Kernel32.CloseHandle(handle);
  }
}

/** Whether a window is minimized (iconic) — readable for any top-level window without touching it. */
export function isMinimized(hWnd: bigint): boolean {
  return User32.IsIconic(hWnd) !== 0;
}

/** Whether a window is maximized (zoomed). */
export function isMaximized(hWnd: bigint): boolean {
  return User32.IsZoomed(hWnd) !== 0;
}

/** The window that currently has the foreground (active) — 0n if none. */
export function foregroundWindow(): bigint {
  return User32.GetForegroundWindow();
}

/** Move + resize a window to an absolute screen rectangle. Works on a background window (no activation). */
export function moveWindow(hWnd: bigint, x: number, y: number, width: number, height: number): boolean {
  return User32.MoveWindow(hWnd, x, y, width, height, 1) !== 0;
}

/** Minimize a window (ShowWindow SW_MINIMIZE) — no foreground needed. */
export function minimizeWindow(hWnd: bigint): void {
  User32.ShowWindow(hWnd, SW_MINIMIZE);
}

/** Maximize a window (ShowWindow SW_MAXIMIZE). */
export function maximizeWindow(hWnd: bigint): void {
  User32.ShowWindow(hWnd, SW_MAXIMIZE);
}

/** Restore a window to its pre-min/max size (ShowWindow SW_RESTORE) — un-minimizes a background window without stealing focus. */
export function restoreWindow(hWnd: bigint): void {
  User32.ShowWindow(hWnd, SW_RESTORE);
}

/** Raise a window's z-order WITHOUT activating it (SetWindowPos HWND_TOP, SWP_NOACTIVATE). Best-effort restack
 *  only — NOT a true bring-to-front, which the foreground lock denies a background process. */
export function raiseWindow(hWnd: bigint): boolean {
  return User32.SetWindowPos(hWnd, HWND_TOP, 0, 0, 0, 0, (SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE) >>> 0) !== 0;
}

/** Ask a window to close (PostMessage WM_CLOSE) — universal, unlike WindowPattern which UWP apps lack;
 *  the app may still prompt to save. Posts cross-process, so it works on a background window. */
export function closeWindow(hWnd: bigint): boolean {
  const WM_CLOSE = 0x0000_0010;
  return User32.PostMessageW(hWnd, WM_CLOSE, 0n, 0n) !== 0;
}
