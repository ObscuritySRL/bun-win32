// The coordinate-space bridge between the computer-use pixel world and the UIA element world. Every
// (x, y) here is a virtual-screen-absolute physical pixel — the same frame fromPoint() consumes and
// SetCursorPos places into; a per-window screenshot is window-local, so subtract the window's
// boundingRectangle {x, y}. The origin can be negative on a monitor left of / above the primary.
// `postClickAt` is the CURSOR-FREE coordinate click: it posts WM_*BUTTON to the window under the
// point, so the real mouse never moves (prefer Element.invoke(); this is the no-pattern fallback).

import { FFIType, JSCallback } from 'bun:ffi';

import Shcore from '@bun-win32/shcore';
import User32 from '@bun-win32/user32';

import { Element, fromPoint } from '../element/element';
import { ScrollAmount } from '../element/patterns';
import type { Rect } from '../com/reads';

const MK_LBUTTON = 0x0001;
const MK_RBUTTON = 0x0002;
const MK_MBUTTON = 0x0010;
const WM_MOUSEMOVE = 0x0200;
const WM_LBUTTONDOWN = 0x0201;
const WM_LBUTTONUP = 0x0202;
const WM_LBUTTONDBLCLK = 0x0203;
const WM_RBUTTONDOWN = 0x0204;
const WM_RBUTTONUP = 0x0205;
const WM_MBUTTONDOWN = 0x0207;
const WM_MBUTTONUP = 0x0208;

type PostButton = 'left' | 'right' | 'middle';
const BUTTON_MESSAGES: Record<PostButton, { down: number; up: number; mk: number }> = {
  left: { down: WM_LBUTTONDOWN, up: WM_LBUTTONUP, mk: MK_LBUTTON },
  right: { down: WM_RBUTTONDOWN, up: WM_RBUTTONUP, mk: MK_RBUTTON },
  middle: { down: WM_MBUTTONDOWN, up: WM_MBUTTONUP, mk: MK_MBUTTON },
};

/** Pack a screen point into a window's client-relative lParam for a WM_*BUTTON message. */
function clientLParam(hWnd: bigint, x: number, y: number): bigint {
  const point = Buffer.alloc(8);
  point.writeInt32LE(x, 0);
  point.writeInt32LE(y, 4);
  User32.ScreenToClient(hWnd, point.ptr!);
  return BigInt(((point.readInt32LE(4) & 0xffff) << 16) | (point.readInt32LE(0) & 0xffff));
}

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
  /** Effective DPI of this monitor (96 = 100%); needed to map element/click coordinates on a mixed-DPI rig. */
  dpi: number;
  /** Effective scale factor (dpi / 96): 1.0 at 96 DPI, 1.5 at 144 DPI, … */
  scale: number;
}

const MDT_EFFECTIVE_DPI = 0x0000_0000;
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
        const dpiX = Buffer.alloc(4);
        const dpiY = Buffer.alloc(4);
        const dpi = Shcore.GetDpiForMonitor(hMonitor, MDT_EFFECTIVE_DPI, dpiX.ptr!, dpiY.ptr!) === 0 ? dpiX.readUInt32LE(0) : 96;
        monitors.push({ handle: hMonitor, bounds: rect(4), workArea: rect(20), primary: (info.readUInt32LE(36) & MONITORINFOF_PRIMARY) !== 0, dpi, scale: dpi / 96 });
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
 * Post a WM_*BUTTON click at a screen point to a SPECIFIC window — the occlusion-correct primitive. The screen
 * point is converted to THAT window's client coords, so the message reaches `hWnd` regardless of what overlaps the
 * pixel. Returns false for a 0 handle. (Chromium/Electron/games ignore posted clicks — prefer Element.invoke().)
 */
export function postClickToHwnd(hWnd: bigint, x: number, y: number, button: PostButton = 'left'): boolean {
  if (hWnd === 0n) return false;
  const lParam = clientLParam(hWnd, x, y);
  const message = BUTTON_MESSAGES[button];
  User32.PostMessageW(hWnd, WM_MOUSEMOVE, 0n, lParam);
  const down = User32.PostMessageW(hWnd, message.down, BigInt(message.mk), lParam);
  const up = User32.PostMessageW(hWnd, message.up, 0n, lParam);
  return down !== 0 && up !== 0;
}

/** Post a cursor-free DOUBLE left-click (down/up/DBLCLK/up) to a specific window — occlusion-correct like
 *  postClickToHwnd. The target window class must handle WM_LBUTTONDBLCLK (most do); 0n handle returns false. */
export function postDoubleClickToHwnd(hWnd: bigint, x: number, y: number): boolean {
  if (hWnd === 0n) return false;
  const lParam = clientLParam(hWnd, x, y);
  User32.PostMessageW(hWnd, WM_MOUSEMOVE, 0n, lParam);
  const down = User32.PostMessageW(hWnd, WM_LBUTTONDOWN, BigInt(MK_LBUTTON), lParam);
  User32.PostMessageW(hWnd, WM_LBUTTONUP, 0n, lParam);
  User32.PostMessageW(hWnd, WM_LBUTTONDBLCLK, BigInt(MK_LBUTTON), lParam);
  const up = User32.PostMessageW(hWnd, WM_LBUTTONUP, 0n, lParam);
  return down !== 0 && up !== 0;
}

/** Cursor-free double left-click at a screen point, posted to the TOPMOST window there (prefer the element/ref path
 *  for occlusion-correctness). False if no window is under the point. */
export function postDoubleClickAt(x: number, y: number): boolean {
  return postDoubleClickToHwnd(User32.WindowFromPoint(packPoint(x, y)), x, y);
}

/** Post a cursor-free TRIPLE left-click (down/up · DBLCLK/up · down/up) to a SPECIFIC window — selects the whole
 *  line/paragraph in a RichEdit / modern editor that honors triple-click (a plain Win32 EDIT does not line-select);
 *  occlusion-correct like postClickToHwnd. A plain double-then-single would collapse the word selection to a caret,
 *  so the third press follows the DBLCLK directly. Chromium/Electron ignore posted clicks. 0n handle returns false. */
export function postTripleClickToHwnd(hWnd: bigint, x: number, y: number): boolean {
  if (hWnd === 0n) return false;
  const lParam = clientLParam(hWnd, x, y);
  User32.PostMessageW(hWnd, WM_MOUSEMOVE, 0n, lParam);
  const down = User32.PostMessageW(hWnd, WM_LBUTTONDOWN, BigInt(MK_LBUTTON), lParam);
  User32.PostMessageW(hWnd, WM_LBUTTONUP, 0n, lParam);
  User32.PostMessageW(hWnd, WM_LBUTTONDBLCLK, BigInt(MK_LBUTTON), lParam);
  User32.PostMessageW(hWnd, WM_LBUTTONUP, 0n, lParam);
  User32.PostMessageW(hWnd, WM_LBUTTONDOWN, BigInt(MK_LBUTTON), lParam);
  const up = User32.PostMessageW(hWnd, WM_LBUTTONUP, 0n, lParam);
  return down !== 0 && up !== 0;
}

/** Cursor-free triple left-click at a screen point, posted to the TOPMOST window there (prefer the element/ref path
 *  for occlusion-correctness). False if no window is under the point. */
export function postTripleClickAt(x: number, y: number): boolean {
  return postTripleClickToHwnd(User32.WindowFromPoint(packPoint(x, y)), x, y);
}

/** Post a cursor-free left-button DRAG (down → interpolated moves carrying MK_LBUTTON → up) from one screen point to
 *  another, to a SPECIFIC window — drag-selects text in a classic Edit/RichEdit or marquee-selects items in a ListView/
 *  ListBox with no real cursor (works background/occluded/locked). Both points convert to `hWnd` client coords. False
 *  for a 0 handle. (Chromium/Electron/games that read GetCursorPos ignore posted moves — those need the real-cursor drag,
 *  as does an OLE drag-DROP.) */
export function postDragToHwnd(hWnd: bigint, fromX: number, fromY: number, toX: number, toY: number): boolean {
  if (hWnd === 0n) return false;
  const steps = 8;
  User32.PostMessageW(hWnd, WM_MOUSEMOVE, 0n, clientLParam(hWnd, fromX, fromY));
  const down = User32.PostMessageW(hWnd, WM_LBUTTONDOWN, BigInt(MK_LBUTTON), clientLParam(hWnd, fromX, fromY));
  for (let step = 1; step <= steps; step += 1) {
    const x = Math.round(fromX + ((toX - fromX) * step) / steps);
    const y = Math.round(fromY + ((toY - fromY) * step) / steps);
    User32.PostMessageW(hWnd, WM_MOUSEMOVE, BigInt(MK_LBUTTON), clientLParam(hWnd, x, y));
  }
  const up = User32.PostMessageW(hWnd, WM_LBUTTONUP, 0n, clientLParam(hWnd, toX, toY));
  return down !== 0 && up !== 0;
}

/** The HWND that owns an element's posted-message input: its own native window, else the nearest ancestor that has
 *  one. Posting to THIS (not WindowFromPoint) makes a cursor-free click occlusion-correct — it reaches the target's
 *  own window even when another window overlaps the pixel. 0n if no ancestor has a native window. */
export function ownerHwnd(element: Element): bigint {
  if (element.nativeWindowHandle !== 0n) return element.nativeWindowHandle;
  let current: Element | null = element.parent;
  for (let depth = 0; current !== null && depth < 24; depth += 1) {
    const handle = current.nativeWindowHandle;
    if (handle !== 0n) {
      current.release();
      return handle;
    }
    const parent: Element | null = current.parent;
    current.release();
    current = parent;
  }
  return 0n;
}

/**
 * Click at a screen point WITHOUT moving the real cursor — posts WM_*BUTTON to whatever window is TOPMOST at the
 * pixel (WindowFromPoint). For a known control prefer postClickToHwnd(ownerHwnd(element), …) / Element.invoke(),
 * which target the control's own window even when occluded. Returns false if no window is under the point.
 */
export function postClickAt(x: number, y: number, button: PostButton = 'left'): boolean {
  return postClickToHwnd(User32.WindowFromPoint(packPoint(x, y)), x, y, button);
}
