// Window targeting (find / enumerate / by-process) and PrintWindow screenshots for visual assertions.
// EnumWindows invokes its callback synchronously on the calling thread (no foreign-thread hazard).
// PrintWindow + GDI capture a window's own rendering; the PNG can be blank on a locked session.

import { FFIType, JSCallback } from 'bun:ffi';

import Advapi32 from '@bun-win32/advapi32';
import Gdi32 from '@bun-win32/gdi32';
import Kernel32 from '@bun-win32/kernel32';
import Shell32 from '@bun-win32/shell32';
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

/** Whether a window handle is currently visible (User32.IsWindowVisible). Lets a FindWindowW fallback accept a
 *  titleless single-window class (the taskbar Shell_TrayWnd) while still rejecting an invisible Chromium/Electron
 *  helper window. False for a 0 handle. */
export function isWindowVisible(hWnd: bigint): boolean {
  return hWnd !== 0n && User32.IsWindowVisible(hWnd) !== 0;
}

/** Whether a window handle still refers to a live window (User32.IsWindow) — used to tell a real close from one a
 *  modal (a "Save changes?" dialog) blocked. False for a 0 handle. */
export function isWindow(hWnd: bigint): boolean {
  return hWnd !== 0n && User32.IsWindow(hWnd) !== 0;
}

/** The owning process id of a window handle (GetWindowThreadProcessId). 0 for a 0 handle. */
export function windowProcessId(hWnd: bigint): number {
  return hWnd === 0n ? 0 : readProcessId(hWnd);
}

/** Enumerate visible top-level windows with their class and owning process id. Titled windows always; with
 *  `includeUntitled`, also visible non-zero-size UNTITLED top-levels — the popups (combobox dropdowns, classic
 *  #32768 context menus, WPF/WinUI Popups, autocomplete lists) that open in their own window and would otherwise
 *  be invisible: enumerate them, then `attach` the popup by hWnd to see + invoke its items. */
export function listWindows(options: { includeUntitled?: boolean } = {}): WindowInfo[] {
  const windows: WindowInfo[] = [];
  const includeUntitled = options.includeUntitled === true;
  const callback = new JSCallback(
    (hWnd: bigint) => {
      if (User32.IsWindowVisible(hWnd) !== 0) {
        const title = readWindowText(hWnd);
        if (title.length > 0) windows.push({ hWnd, title, className: readClassName(hWnd), processId: readProcessId(hWnd) });
        else if (includeUntitled) {
          const rect = Buffer.alloc(16); // per-call so .ptr can't be stale from a sibling alloc
          if (User32.GetWindowRect(hWnd, rect.ptr!) !== 0 && rect.readInt32LE(8) > rect.readInt32LE(0) && rect.readInt32LE(12) > rect.readInt32LE(4))
            windows.push({ hWnd, title, className: readClassName(hWnd), processId: readProcessId(hWnd) });
        }
      }
      return 1;
    },
    { args: [FFIType.u64, FFIType.i64], returns: FFIType.i32 },
  );
  User32.EnumWindows(callback.ptr!, 0n);
  callback.close();
  return windows;
}

/**
 * The Chromium render-widget child windows (`Chrome_RenderWidgetHostHWND`) hosting a window's web / editor
 * DOM. Chromium, CEF, and Electron (browsers, VS Code, Discord, Slack, Teams, …) put their page content in a
 * child window whose UIA fragment the top-level walk does NOT bridge — attach to these directly to see the DOM.
 * Returns [] for non-Chromium windows (gated on the host class, so it costs one GetClassNameW there).
 * EnumChildWindows already recurses the whole child tree, so one pass finds nested (out-of-process iframe) widgets.
 */
export function renderWidgetHandles(hWnd: bigint): bigint[] {
  if (!readClassName(hWnd).startsWith('Chrome_WidgetWin')) return [];
  const handles: bigint[] = [];
  const callback = new JSCallback(
    (child: bigint) => {
      if (readClassName(child) === 'Chrome_RenderWidgetHostHWND') handles.push(child);
      return 1;
    },
    { args: [FFIType.u64, FFIType.i64], returns: FFIType.i32 },
  );
  User32.EnumChildWindows(hWnd, callback.ptr!, 0n);
  callback.close();
  return handles;
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

/** Open a path / file / URL with its default handler via ShellExecuteW — lpFile is a real string argument, so there
 *  is NO shell and NO command-line re-parse (unlike `cmd /c start`, which is command-injectable via `&`/`"`/`%VAR%`).
 *  Returns false if the shell could not open it (ShellExecuteW HINSTANCE <= 32). */
export function openPath(path: string): boolean {
  const file = Buffer.from(`${path}\0`, 'utf16le');
  return Shell32.ShellExecuteW(0n, null, file.ptr!, null, null, 0x0000_0001) > 32n; // SW_SHOWNORMAL
}

const TOKEN_QUERY = 0x0000_0008;
const TOKEN_INTEGRITY_LEVEL = 0x0000_0019; // TokenInformationClass.TokenIntegrityLevel (25)

/** The Windows integrity level of a process — 'system' | 'high' | 'medium' | 'low' | 'untrusted', or '' if the
 *  token is inaccessible (a protected / higher-integrity process). A window whose integrity EXCEEDS the agent's
 *  own cannot be DRIVEN: UIPI blocks posted messages AND SendInput across integrity levels (a true OS wall, not
 *  a binding gap). Surface it so the agent diagnoses the wall (relaunch its host elevated) instead of retrying a
 *  silent failure. Reads the token's TokenIntegrityLevel SID and maps its RID. */
export function integrityLevel(processId: number): '' | 'untrusted' | 'low' | 'medium' | 'high' | 'system' {
  const handle = Kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, processId);
  if (handle === 0n) return '';
  const tokenOut = Buffer.alloc(8);
  try {
    if (Advapi32.OpenProcessToken(handle, TOKEN_QUERY, tokenOut.ptr!) === 0) return '';
    const token = tokenOut.readBigUInt64LE(0);
    try {
      const sizeOut = Buffer.alloc(4);
      Advapi32.GetTokenInformation(token, TOKEN_INTEGRITY_LEVEL, null, 0, sizeOut.ptr!); // size query
      const size = sizeOut.readUInt32LE(0);
      if (size === 0) return '';
      const info = Buffer.alloc(size);
      if (Advapi32.GetTokenInformation(token, TOKEN_INTEGRITY_LEVEL, info.ptr!, size, sizeOut.ptr!) === 0) return '';
      // TOKEN_MANDATORY_LABEL = SID_AND_ATTRIBUTES (16 B on x64) then the SID { Revision, SubAuthorityCount, 6-B authority, DWORD[] }.
      const subAuthorityCount = info.readUInt8(0x11); // 0x10 (SID start) + 1 (the SubAuthorityCount byte)
      const rid = info.readUInt32LE(0x18 + (subAuthorityCount - 1) * 4); // 0x10 + 8 (sub-authorities start) + the last one (the integrity RID)
      if (rid >= 0x4000) return 'system';
      if (rid >= 0x3000) return 'high';
      if (rid >= 0x2000) return 'medium';
      if (rid >= 0x1000) return 'low';
      return 'untrusted';
    } finally {
      Kernel32.CloseHandle(token);
    }
  } finally {
    Kernel32.CloseHandle(handle);
  }
}

const UOI_NAME = 0x0000_0002;
const DESKTOP_READOBJECTS = 0x0000_0001;

/** The name of the current INPUT desktop — 'Default' in normal use; 'Winlogon' when the SECURE desktop is up
 *  (a UAC consent prompt, Ctrl+Alt+Del, the lock/credential screen). '' when it cannot be opened from this session
 *  (typically because a secure desktop is active and inaccessible from a medium-integrity process). */
export function inputDesktopName(): string {
  const desktop = User32.OpenInputDesktop(0, 0, DESKTOP_READOBJECTS);
  if (desktop === 0n) return '';
  try {
    const buffer = Buffer.alloc(256); // wchar_t[128]
    const needed = Buffer.alloc(4);
    if (User32.GetUserObjectInformationW(desktop, UOI_NAME, buffer.ptr!, 256, needed.ptr!) === 0) return '';
    return buffer.toString('utf16le', 0, Math.max(0, needed.readUInt32LE(0) - 2)); // drop the trailing null
  } finally {
    User32.CloseDesktop(desktop);
  }
}

/** Whether a UAC consent / SECURE desktop is currently active — the input desktop is not 'Default' (e.g. 'Winlogon'),
 *  or it cannot be opened from this session at all. Such a prompt is INVISIBLE and UNDRIVABLE by OS design (no UIA, no
 *  capture); a human must respond at the physical console, or the host must run elevated. Detection only — a true OS
 *  wall, like driving an elevated window from medium integrity. */
export function isSecureDesktopActive(): boolean {
  const desktop = User32.OpenInputDesktop(0, 0, DESKTOP_READOBJECTS);
  if (desktop === 0n) return true; // the input desktop is not openable from this session → a secure desktop is up
  try {
    const buffer = Buffer.alloc(256);
    const needed = Buffer.alloc(4);
    if (User32.GetUserObjectInformationW(desktop, UOI_NAME, buffer.ptr!, 256, needed.ptr!) === 0) return false;
    return buffer.toString('utf16le', 0, Math.max(0, needed.readUInt32LE(0) - 2)).toLowerCase() !== 'default';
  } finally {
    User32.CloseDesktop(desktop);
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

/** Snap a window to half/quadrant/centre of its monitor's work area, cursor-free (no Win+arrow, no activation) —
 *  works on a background window. `edge`: left/right/top/bottom half, or a centred 3/4 rectangle. Returns false if
 *  the monitor info is unavailable. Restores first so it snaps cleanly from a maximized/minimized state. */
export function snapWindow(hWnd: bigint, edge: 'left' | 'right' | 'top' | 'bottom' | 'center'): boolean {
  const MONITOR_DEFAULTTONEAREST = 0x0000_0002;
  const monitor = User32.MonitorFromWindow(hWnd, MONITOR_DEFAULTTONEAREST);
  if (monitor === 0n) return false;
  const info = Buffer.alloc(40); // MONITORINFO: cbSize, rcMonitor[16], rcWork[16], dwFlags
  info.writeUInt32LE(40, 0);
  if (User32.GetMonitorInfoW(monitor, info.ptr!) === 0) return false;
  const left = info.readInt32LE(20); // rcWork
  const top = info.readInt32LE(24);
  const width = info.readInt32LE(28) - left;
  const height = info.readInt32LE(32) - top;
  const halfWidth = Math.floor(width / 2);
  const halfHeight = Math.floor(height / 2);
  const rect =
    edge === 'left'
      ? { x: left, y: top, width: halfWidth, height }
      : edge === 'right'
        ? { x: left + halfWidth, y: top, width: width - halfWidth, height }
        : edge === 'top'
          ? { x: left, y: top, width, height: halfHeight }
          : edge === 'bottom'
            ? { x: left, y: top + halfHeight, width, height: height - halfHeight }
            : { x: left + Math.floor(width / 8), y: top + Math.floor(height / 8), width: Math.floor((width * 3) / 4), height: Math.floor((height * 3) / 4) };
  User32.ShowWindow(hWnd, SW_RESTORE);
  return User32.MoveWindow(hWnd, rect.x, rect.y, rect.width, rect.height, 1) !== 0;
}

/** Ask a window to close (PostMessage WM_CLOSE) — universal, unlike WindowPattern which UWP apps lack;
 *  the app may still prompt to save. Posts cross-process, so it works on a background window. */
export function closeWindow(hWnd: bigint): boolean {
  const WM_CLOSE = 0x0000_0010;
  return User32.PostMessageW(hWnd, WM_CLOSE, 0n, 0n) !== 0;
}
