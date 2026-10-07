// The window census: every Alt+Tab-eligible window in z-order, with its real (DWM extended-frame) bounds, process,
// friendly application name, and restore bounds when minimized. Plus the two verbs Iris performs on a window:
// bring it home (activate) and close it.

import Dwmapi from '@bun-win32/dwmapi';
import Kernel32 from '@bun-win32/kernel32';
import User32 from '@bun-win32/user32';
import Version from '@bun-win32/version';

import type { Rect } from './geometry';

const DWMWA_CLOAKED = 14;
const DWMWA_EXTENDED_FRAME_BOUNDS = 9;
const GA_ROOTOWNER = 3;
const GW_HWNDNEXT = 2;
const GW_OWNER = 4;
const GWL_EXSTYLE = -20;
const PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;
const SW_RESTORE = 9;
const WM_CLOSE = 0x0010;
const WS_EX_APPWINDOW = 0x0004_0000;
const WS_EX_NOACTIVATE = 0x0800_0000;
const WS_EX_TOOLWINDOW = 0x0000_0080;
const WPF_RESTORETOMAXIMIZED = 0x0002;
const MONITOR_DEFAULTTONEAREST = 2;

const IGNORED_CLASSES = new Set(['Progman', 'WorkerW', 'Shell_TrayWnd', 'Shell_SecondaryTrayWnd', 'Windows.UI.Core.CoreWindow', 'XamlExplorerHostIslandWindow']);

export interface WindowInfo {
  appName: string;
  /** Visible frame in virtual-screen pixels (the restored frame when minimized). */
  bounds: Rect;
  className: string;
  executablePath: string;
  hwnd: bigint;
  minimized: boolean;
  processId: number;
  title: string;
  /** 0 = frontmost. */
  zOrder: number;
}

const text = Buffer.alloc(1024);
const rect = Buffer.alloc(16);
const dword = Buffer.alloc(4);
const placement = Buffer.alloc(44);
const windowRect = Buffer.alloc(16);
/** Invisible resize borders (window rect minus DWM frame) remembered per window from its last restored sighting. */
const borders = new Map<bigint, { bottom: number; left: number; right: number; top: number }>();
const monitorInfo = Buffer.alloc(40);
const appNames = new Map<string, string>();
const executablePaths = new Map<number, string>();
const coreWindowClass = Buffer.from('Windows.UI.Core.CoreWindow\0', 'utf16le');

function windowText(hwnd: bigint): string {
  const length = User32.GetWindowTextW(hwnd, text.ptr, 512);
  return text.toString('utf16le', 0, length * 2);
}

function windowClass(hwnd: bigint): string {
  const length = User32.GetClassNameW(hwnd, text.ptr, 256);
  return text.toString('utf16le', 0, length * 2);
}

function processIdOf(hwnd: bigint): number {
  User32.GetWindowThreadProcessId(hwnd, dword.ptr);
  return dword.readUInt32LE(0);
}

function executablePath(processId: number): string {
  const cached = executablePaths.get(processId);
  if (cached !== undefined) return cached;
  let path = '';
  const process = Kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, processId);
  if (process !== 0n) {
    const size = Buffer.alloc(4);
    size.writeUInt32LE(512, 0);
    const name = Buffer.alloc(1024);
    if (Kernel32.QueryFullProcessImageNameW(process, 0, name.ptr, size.ptr) !== 0) path = name.toString('utf16le', 0, size.readUInt32LE(0) * 2);
    Kernel32.CloseHandle(process);
  }
  executablePaths.set(processId, path);
  return path;
}

/** The FileDescription from the executable's version resource ("Visual Studio Code", "Discord"), else the file name. */
export function applicationName(path: string): string {
  if (path.length === 0) return '';
  const cached = appNames.get(path);
  if (cached !== undefined) return cached;
  const fileName = path.slice(path.lastIndexOf('\\') + 1).replace(/\.exe$/i, '');
  let name = fileName;
  const wide = Buffer.from(`${path}\0`, 'utf16le');
  const size = Version.GetFileVersionInfoSizeW(wide.ptr, null);
  if (size > 0) {
    const block = Buffer.alloc(size);
    if (Version.GetFileVersionInfoW(wide.ptr, 0, size, block.ptr) !== 0) {
      const valuePointer = Buffer.alloc(8);
      const valueLength = Buffer.alloc(4);
      const translation = Buffer.from('\\VarFileInfo\\Translation\0', 'utf16le');
      if (Version.VerQueryValueW(block.ptr, translation.ptr, valuePointer.ptr, valueLength.ptr) !== 0 && valueLength.readUInt32LE(0) >= 4) {
        const offset = Number(valuePointer.readBigUInt64LE(0) - BigInt(block.ptr));
        const language = block.readUInt16LE(offset).toString(16).padStart(4, '0');
        const codePage = block
          .readUInt16LE(offset + 2)
          .toString(16)
          .padStart(4, '0');
        const query = Buffer.from(`\\StringFileInfo\\${language}${codePage}\\FileDescription\0`, 'utf16le');
        if (Version.VerQueryValueW(block.ptr, query.ptr, valuePointer.ptr, valueLength.ptr) !== 0 && valueLength.readUInt32LE(0) > 1) {
          const start = Number(valuePointer.readBigUInt64LE(0) - BigInt(block.ptr));
          const description = block.toString('utf16le', start, start + (valueLength.readUInt32LE(0) - 1) * 2).trim();
          if (description.length > 0) name = description;
        }
      }
    }
  }
  appNames.set(path, name);
  return name;
}

/** Packaged apps often ship no FileDescription ("mspaint"); their title usually ends with the real name ("img0 - Paint"). */
function friendlyName(described: string, path: string, title: string): string {
  const fileName = path.slice(path.lastIndexOf('\\') + 1).replace(/\.exe$/i, '');
  if (described.length > 0 && (described !== fileName || /[A-Z\s]/.test(described))) return described;
  const suffix = title.slice(title.lastIndexOf(' - ') + 3).trim();
  if (title.includes(' - ') && suffix.length > 0 && suffix.length <= 32) return suffix;
  return described || title;
}

function isAltTabWindow(hwnd: bigint): boolean {
  if (User32.IsWindowVisible(hwnd) === 0) return false;
  const exStyle = Number(User32.GetWindowLongPtrW(hwnd, GWL_EXSTYLE));
  if ((exStyle & WS_EX_NOACTIVATE) !== 0) return false;
  const appWindow = (exStyle & WS_EX_APPWINDOW) !== 0;
  if ((exStyle & WS_EX_TOOLWINDOW) !== 0 && !appWindow) return false;
  if (User32.GetWindow(hwnd, GW_OWNER) !== 0n && !appWindow) return false;
  if (User32.GetAncestor(hwnd, GA_ROOTOWNER) !== hwnd && !appWindow) return false;
  Dwmapi.DwmGetWindowAttribute(hwnd, DWMWA_CLOAKED, dword.ptr, 4);
  return dword.readUInt32LE(0) === 0;
}

function frameBounds(hwnd: bigint, minimized: boolean): Rect | null {
  if (minimized) {
    placement.fill(0);
    placement.writeUInt32LE(44, 0);
    if (User32.GetWindowPlacement(hwnd, placement.ptr) === 0) return null;
    const monitor = User32.MonitorFromRect(placement.subarray(28, 44).ptr, MONITOR_DEFAULTTONEAREST);
    monitorInfo.fill(0);
    monitorInfo.writeUInt32LE(40, 0);
    const haveMonitor = User32.GetMonitorInfoW(monitor, monitorInfo.ptr) !== 0;
    const workLeft = monitorInfo.readInt32LE(20);
    const workTop = monitorInfo.readInt32LE(24);
    if (haveMonitor && (placement.readUInt32LE(4) & WPF_RESTORETOMAXIMIZED) !== 0) {
      // It will come back maximized: its real frame is the work area of the monitor it restores onto.
      return { height: monitorInfo.readInt32LE(32) - workTop, width: monitorInfo.readInt32LE(28) - workLeft, x: workLeft, y: workTop };
    }
    // rcNormalPosition is a window rect in workspace coordinates (shifted by a top/left taskbar or appbar) and includes
    // the invisible resize borders: convert to screen space and trim the borders seen when the window was last restored.
    const offsetX = haveMonitor ? workLeft - monitorInfo.readInt32LE(4) : 0;
    const offsetY = haveMonitor ? workTop - monitorInfo.readInt32LE(8) : 0;
    const inset = borders.get(hwnd) ?? { bottom: 0, left: 0, right: 0, top: 0 };
    const left = placement.readInt32LE(28) + offsetX + inset.left;
    const top = placement.readInt32LE(32) + offsetY + inset.top;
    const right = placement.readInt32LE(36) + offsetX - inset.right;
    const bottom = placement.readInt32LE(40) + offsetY - inset.bottom;
    return { height: bottom - top, width: right - left, x: left, y: top };
  }
  if (Dwmapi.DwmGetWindowAttribute(hwnd, DWMWA_EXTENDED_FRAME_BOUNDS, rect.ptr, 16) !== 0) return null;
  const left = rect.readInt32LE(0);
  const top = rect.readInt32LE(4);
  const right = rect.readInt32LE(8);
  const bottom = rect.readInt32LE(12);
  if (User32.GetWindowRect(hwnd, windowRect.ptr) !== 0) {
    borders.set(hwnd, { bottom: windowRect.readInt32LE(12) - bottom, left: left - windowRect.readInt32LE(0), right: windowRect.readInt32LE(8) - right, top: top - windowRect.readInt32LE(4) });
  }
  return { height: bottom - top, width: right - left, x: left, y: top };
}

/** Every switchable top-level window, frontmost first. */
export function enumerateWindows(excluded: ReadonlySet<bigint>): WindowInfo[] {
  const windows: WindowInfo[] = [];
  for (let hwnd = User32.GetTopWindow(0n); hwnd !== 0n; hwnd = User32.GetWindow(hwnd, GW_HWNDNEXT)) {
    if (excluded.has(hwnd) || !isAltTabWindow(hwnd)) continue;
    const className = windowClass(hwnd);
    if (IGNORED_CLASSES.has(className)) continue;
    const title = windowText(hwnd);
    if (title.length === 0) continue;
    const minimized = User32.IsIconic(hwnd) !== 0;
    const bounds = frameBounds(hwnd, minimized);
    if (bounds === null || bounds.width < 32 || bounds.height < 24) continue;
    let processId = processIdOf(hwnd);
    if (className === 'ApplicationFrameWindow') {
      const core = User32.FindWindowExW(hwnd, 0n, coreWindowClass.ptr, null);
      if (core !== 0n) processId = processIdOf(core);
    }
    const path = executablePath(processId);
    windows.push({ appName: friendlyName(applicationName(path), path, title), bounds, className, executablePath: path, hwnd, minimized, processId, title, zOrder: windows.length });
  }
  // Process ids are recycled: forget paths (and borders) for anything no longer on screen.
  const livePids = new Set(windows.map((window) => window.processId));
  for (const processId of executablePaths.keys()) if (!livePids.has(processId)) executablePaths.delete(processId);
  const liveWindows = new Set(windows.map((window) => window.hwnd));
  for (const hwnd of borders.keys()) if (!liveWindows.has(hwnd)) borders.delete(hwnd);
  return windows;
}

/** Restore (if minimized) and bring a window to the foreground. Iris owns the foreground, so Windows allows the hand-off. */
export function activateWindow(hwnd: bigint): void {
  if (User32.IsIconic(hwnd) !== 0) User32.ShowWindow(hwnd, SW_RESTORE);
  User32.SetForegroundWindow(hwnd);
}

/** Ask a window to close (it may prompt to save — exactly like clicking its ×). */
export function closeWindow(hwnd: bigint): void {
  User32.PostMessageW(hwnd, WM_CLOSE, 0n, 0n);
}

export function isWindowAlive(hwnd: bigint): boolean {
  return User32.IsWindow(hwnd) !== 0;
}
