// The coordinate-space bridge between the computer-use pixel world and the UIA element world. Every
// (x, y) here is a virtual-screen-absolute physical pixel — the same frame fromPoint() consumes and
// SetCursorPos places into; a per-window screenshot is window-local, so subtract the window's
// boundingRectangle {x, y}. The origin can be negative on a monitor left of / above the primary.
// `postClickAt` is the CURSOR-FREE coordinate click: it posts WM_*BUTTON to the window under the
// point, so the real mouse never moves (prefer Element.invoke(); this is the no-pattern fallback).

import User32 from '@bun-win32/user32';

import { Element, fromPoint } from './element';
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
