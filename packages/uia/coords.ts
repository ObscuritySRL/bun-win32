// The coordinate-space bridge between the computer-use pixel world and the UIA element world. Every
// (x, y) here is a virtual-screen-absolute physical pixel — the same frame fromPoint() consumes and
// SetCursorPos places into; a per-window screenshot is window-local, so subtract the window's
// boundingRectangle {x, y}. The origin can be negative on a monitor left of / above the primary.
// `postClickAt` is the CURSOR-FREE coordinate click: it posts WM_*BUTTON to the window under the
// point, so the real mouse never moves (prefer Element.invoke(); this is the no-pattern fallback).

import { FFIType, JSCallback } from 'bun:ffi';

import User32 from '@bun-win32/user32';

import { Element, fromPoint } from './element';
import { ScrollAmount } from './patterns';
import type { Rect } from './reads';

const MK_LBUTTON = 0x0001;
const MK_RBUTTON = 0x0002;
const WM_MOUSEMOVE = 0x0200;
const WM_LBUTTONDOWN = 0x0201;
const WM_LBUTTONUP = 0x0202;
const WM_RBUTTONDOWN = 0x0204;
const WM_RBUTTONUP = 0x0205;

const SM_XVIRTUALSCREEN = 76;
const SM_YVIRTUALSCREEN = 77;
const SM_CXVIRTUALSCREEN = 78;
const SM_CYVIRTUALSCREEN = 79;

export interface PointDescription {
  role: string;
  name: string;
  automationId: string;
  className: string;
  bounds: Rect;
}

export interface MonitorInfo {
  handle: bigint;
  /** The full monitor rectangle in virtual-screen pixels. */
  bounds: Rect;
  /** The work area (monitor minus the taskbar / app bars). */
  workArea: Rect;
  primary: boolean;
}

const MONITORINFOF_PRIMARY = 0x0000_0001;

/** Pack a POINT (x low dword, y high dword) for the by-value WindowFromPoint argument. */
function packPoint(x: number, y: number): bigint {
  return (BigInt(y >>> 0) << 32n) | BigInt(x >>> 0);
}

/** The virtual-screen rectangle — the union of every monitor; `x`/`y` may be negative. */
export function virtualScreen(): Rect {
  return {
    x: User32.GetSystemMetrics(SM_XVIRTUALSCREEN),
    y: User32.GetSystemMetrics(SM_YVIRTUALSCREEN),
    width: User32.GetSystemMetrics(SM_CXVIRTUALSCREEN),
    height: User32.GetSystemMetrics(SM_CYVIRTUALSCREEN),
  };
}

/** Enumerate the physical monitors (handle, full bounds, work area, primary flag). EnumDisplayMonitors
 *  invokes its callback synchronously on the calling thread, so the JSCallback is safe (no foreign thread). */
export function listMonitors(): MonitorInfo[] {
  const monitors: MonitorInfo[] = [];
  const callback = new JSCallback(
    (hMonitor: bigint) => {
      const info = Buffer.alloc(40); // MONITORINFO: cbSize@0, rcMonitor@4, rcWork@20, dwFlags@36
      info.writeUInt32LE(40, 0);
      if (User32.GetMonitorInfoW(hMonitor, info.ptr!) !== 0) {
        const rect = (offset: number): Rect => {
          const left = info.readInt32LE(offset);
          const top = info.readInt32LE(offset + 4);
          return { x: left, y: top, width: info.readInt32LE(offset + 8) - left, height: info.readInt32LE(offset + 12) - top };
        };
        monitors.push({ handle: hMonitor, bounds: rect(4), workArea: rect(20), primary: (info.readUInt32LE(36) & MONITORINFOF_PRIMARY) !== 0 });
      }
      return 1;
    },
    { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i64], returns: FFIType.i32 },
  );
  User32.EnumDisplayMonitors(0n, null, callback.ptr!, 0n);
  callback.close();
  return monitors;
}

/** The window handle directly under a screen point (the deepest visible child), or 0n. */
export function windowAt(x: number, y: number): bigint {
  return User32.WindowFromPoint(packPoint(x, y));
}

/** Describe the UIA element at a screen point — the pixel→semantic half of the bridge. Null if none. */
export function elementAt(x: number, y: number): PointDescription | null {
  let element: Element;
  try {
    element = fromPoint(x, y);
  } catch {
    return null;
  }
  try {
    return { role: element.controlTypeName, name: element.name, automationId: element.automationId, className: element.className, bounds: element.boundingRectangle };
  } finally {
    element.release();
  }
}

/**
 * Scroll the nearest ScrollPattern container at a screen point WITHOUT moving the cursor (UIA Scroll) —
 * works on a locked session, unlike the SendInput wheel. Walks up from the element under the point to
 * the first ancestor scrollable on the requested axis, then sends `amount` SmallIncrement/Decrement
 * steps. Returns false if nothing scrollable is found there (caller should fall back to scrollWheel).
 */
export function scrollAt(x: number, y: number, direction: 'up' | 'down' | 'left' | 'right', amount = 3): boolean {
  let element: Element | null;
  try {
    element = fromPoint(x, y);
  } catch {
    return false;
  }
  const horizontal = direction === 'left' || direction === 'right';
  const step = direction === 'up' || direction === 'left' ? ScrollAmount.SmallDecrement : ScrollAmount.SmallIncrement;
  for (let depth = 0; element !== null && depth < 16; depth += 1) {
    const info = element.scrollInfo;
    if (info !== null && (horizontal ? info.horizontallyScrollable : info.verticallyScrollable)) {
      try {
        for (let count = 0; count < Math.max(1, amount); count += 1) element.scroll(horizontal ? step : ScrollAmount.NoAmount, horizontal ? ScrollAmount.NoAmount : step);
      } catch {
        // boundary reached mid-scroll — the container still moved
      }
      element.release();
      return true;
    }
    const ancestor: Element | null = element.parent;
    element.release();
    element = ancestor;
  }
  if (element !== null) element.release();
  return false;
}

/**
 * Click at a screen point WITHOUT moving the real cursor — posts WM_*BUTTON (client-relative) to the
 * window under the point. Works for most Win32 apps; some (Chromium/Electron, games) ignore posted
 * clicks, so prefer Element.invoke() when a pattern exists. Returns false if no window is under it.
 */
export function postClickAt(x: number, y: number, button: 'left' | 'right' = 'left'): boolean {
  const hWnd = User32.WindowFromPoint(packPoint(x, y));
  if (hWnd === 0n) return false;
  const point = Buffer.alloc(8);
  point.writeInt32LE(x, 0);
  point.writeInt32LE(y, 4);
  User32.ScreenToClient(hWnd, point.ptr!);
  const lParam = BigInt(((point.readInt32LE(4) & 0xffff) << 16) | (point.readInt32LE(0) & 0xffff));
  const isRight = button === 'right';
  User32.PostMessageW(hWnd, WM_MOUSEMOVE, 0n, lParam);
  User32.PostMessageW(hWnd, isRight ? WM_RBUTTONDOWN : WM_LBUTTONDOWN, BigInt(isRight ? MK_RBUTTON : MK_LBUTTON), lParam);
  User32.PostMessageW(hWnd, isRight ? WM_RBUTTONUP : WM_LBUTTONUP, 0n, lParam);
  return true;
}
