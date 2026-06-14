// Win32 window introspection — the Spy++ / Winspector layer that complements the UIA a11y tree: the
// raw native HWND hierarchy, window styles (WS_*/WS_EX_*), class names, control ids, and rects. UIA
// gives the SEMANTIC control tree; this gives the NATIVE one, which catches controls in classic Win32
// apps where UIA is sparse and exposes the real window structure (styles, ids) UIA hides. The HWND
// walk is GetWindow(GW_CHILD/GW_HWNDNEXT); zero new bindings.

import User32 from '@bun-win32/user32';

import type { Rect } from './reads';

const GWL_STYLE = -16;
const GWL_EXSTYLE = -20;
const GW_HWNDNEXT = 2;
const GW_CHILD = 5;

const WINDOW_STYLES: readonly [number, string][] = [
  [0x8000_0000, 'WS_POPUP'],
  [0x4000_0000, 'WS_CHILD'],
  [0x2000_0000, 'WS_MINIMIZE'],
  [0x1000_0000, 'WS_VISIBLE'],
  [0x0800_0000, 'WS_DISABLED'],
  [0x0100_0000, 'WS_MAXIMIZE'],
  [0x0080_0000, 'WS_BORDER'],
  [0x0040_0000, 'WS_DLGFRAME'],
  [0x0020_0000, 'WS_VSCROLL'],
  [0x0010_0000, 'WS_HSCROLL'],
  [0x0008_0000, 'WS_SYSMENU'],
  [0x0004_0000, 'WS_THICKFRAME'],
  [0x0002_0000, 'WS_GROUP'],
  [0x0001_0000, 'WS_TABSTOP'],
];

const EX_STYLES: readonly [number, string][] = [
  [0x0000_0001, 'WS_EX_DLGMODALFRAME'],
  [0x0000_0008, 'WS_EX_TOPMOST'],
  [0x0000_0020, 'WS_EX_TRANSPARENT'],
  [0x0000_0080, 'WS_EX_TOOLWINDOW'],
  [0x0000_0100, 'WS_EX_WINDOWEDGE'],
  [0x0000_0200, 'WS_EX_CLIENTEDGE'],
  [0x0008_0000, 'WS_EX_LAYERED'],
  [0x0040_0000, 'WS_EX_LAYOUTRTL'],
  [0x0200_0000, 'WS_EX_COMPOSITED'],
  [0x0800_0000, 'WS_EX_NOACTIVATE'],
];

export interface NativeWindow {
  hWnd: bigint;
  className: string;
  text: string;
  controlId: number;
  styles: string[];
  exStyles: string[];
  rect: Rect;
  children: NativeWindow[];
}

function windowText(hWnd: bigint): string {
  const buffer = Buffer.alloc(1024);
  const length = User32.GetWindowTextW(hWnd, buffer.ptr!, 512);
  return length > 0 ? buffer.subarray(0, length * 2).toString('utf16le') : '';
}

function className(hWnd: bigint): string {
  const buffer = Buffer.alloc(512);
  const length = User32.GetClassNameW(hWnd, buffer.ptr!, 256);
  return length > 0 ? buffer.subarray(0, length * 2).toString('utf16le') : '';
}

function windowRect(hWnd: bigint): Rect {
  const rect = Buffer.alloc(16);
  if (User32.GetWindowRect(hWnd, rect.ptr!) === 0) return { x: 0, y: 0, width: 0, height: 0 };
  const left = rect.readInt32LE(0);
  const top = rect.readInt32LE(4);
  return { x: left, y: top, width: rect.readInt32LE(8) - left, height: rect.readInt32LE(12) - top };
}

function decodeStyles(value: bigint, table: readonly [number, string][]): string[] {
  const names: string[] = [];
  for (const [bit, name] of table) if ((value & BigInt(bit)) !== 0n) names.push(name);
  return names;
}

function nativeWindow(hWnd: bigint, depth: number, maxDepth: number): NativeWindow {
  const style = BigInt.asUintN(32, User32.GetWindowLongPtrW(hWnd, GWL_STYLE));
  const exStyle = BigInt.asUintN(32, User32.GetWindowLongPtrW(hWnd, GWL_EXSTYLE));
  const node: NativeWindow = {
    hWnd,
    className: className(hWnd),
    text: windowText(hWnd),
    controlId: User32.GetDlgCtrlID(hWnd),
    styles: decodeStyles(style, WINDOW_STYLES),
    exStyles: decodeStyles(exStyle, EX_STYLES),
    rect: windowRect(hWnd),
    children: [],
  };
  if (depth < maxDepth) {
    let child = User32.GetWindow(hWnd, GW_CHILD);
    while (child !== 0n) {
      node.children.push(nativeWindow(child, depth + 1, maxDepth));
      child = User32.GetWindow(child, GW_HWNDNEXT);
    }
  }
  return node;
}

/** The native Win32 window tree (HWND hierarchy with class, text, control id, styles, rect) — the
 *  Spy++/Winspector view, complementing the UIA a11y tree (catches classic-Win32 controls UIA misses). */
export function windowTree(hWnd: bigint, maxDepth = 12): NativeWindow {
  return nativeWindow(hWnd, 0, maxDepth);
}

/** The decoded window styles / extended styles of a single window. */
export function windowStyles(hWnd: bigint): { styles: string[]; exStyles: string[] } {
  return {
    styles: decodeStyles(BigInt.asUintN(32, User32.GetWindowLongPtrW(hWnd, GWL_STYLE)), WINDOW_STYLES),
    exStyles: decodeStyles(BigInt.asUintN(32, User32.GetWindowLongPtrW(hWnd, GWL_EXSTYLE)), EX_STYLES),
  };
}

/** Render a native window tree to compact text. */
export function renderWindowTree(node: NativeWindow, depth = 0): string {
  const indent = '  '.repeat(depth);
  const id = node.controlId !== 0 ? ` #${node.controlId}` : '';
  const text = node.text.length > 0 ? ` ${JSON.stringify(node.text.slice(0, 40))}` : '';
  const hidden = node.styles.includes('WS_VISIBLE') ? '' : ' (hidden)';
  let out = `${indent}- ${node.className}${id}${text} [${node.rect.width}x${node.rect.height}]${hidden}`;
  for (const child of node.children) out += `\n${renderWindowTree(child, depth + 1)}`;
  return out;
}
