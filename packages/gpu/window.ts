// Win32 window + message pump for windowed rendering, with the mandatory visibility fix.

import { JSCallback } from 'bun:ffi';

import User32 from '@bun-win32/user32';
import { ShowWindowCommand, SystemMetric, WindowStyles } from '@bun-win32/user32';

const WM_DESTROY = 0x0002;
const WM_CLOSE = 0x0010;
const WM_KEYDOWN = 0x0100;
const WM_KEYUP = 0x0101;
const WM_MOUSEMOVE = 0x0200;
const WM_LBUTTONDOWN = 0x0201;
const WM_LBUTTONUP = 0x0202;
const WM_RBUTTONDOWN = 0x0204;
const WM_RBUTTONUP = 0x0205;
const WM_MOUSEWHEEL = 0x020a;
const CS_HREDRAW = 0x0002;
const CS_VREDRAW = 0x0001;
const PM_REMOVE = 0x0001;
const VK_ESCAPE = 0x1b;

const encodeWide = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');

/** Live keyboard/mouse state and message-pump handle for a created window. */
export interface Win {
  hwnd: bigint;
  wndProc: JSCallback;
  getMouse(): { x: number; y: number; down: boolean; rightDown: boolean };
  /** Accumulated mouse-wheel delta since the last call (positive = forward); reset on read. */
  getWheel(): number;
  keyDown(vk: number): boolean;
  pump(): void;
  shouldClose(): boolean;
  clientSize(): { w: number; h: number };
  destroy(): void;
}

export interface CreateWindowOptions {
  title: string;
  width: number;
  height: number;
  /** WS_POPUP borderless when true; a normal framed window otherwise. */
  borderless?: boolean;
}

let windowClassCounter = 0;

/**
 * Register a window class, create a window, and apply the mandatory visibility
 * fix (ShowWindow → SetWindowPos HWND_TOPMOST → SetForegroundWindow). The WndProc
 * captures mouse move / left button, key down/up (tracking ESC), and close.
 */
export function createWindow(options: CreateWindowOptions): Win {
  const { title, width, height, borderless = true } = options;

  let mouseX = width / 2;
  let mouseY = height / 2;
  let mouseDown = false;
  let mouseRightDown = false;
  let wheelAccum = 0;
  let closing = false;
  const keys = new Set<number>();
  let hwnd = 0n;

  const wndProc = new JSCallback(
    (hWnd: bigint, msg: number, wParam: bigint, lParam: bigint): bigint => {
      switch (msg) {
        case WM_MOUSEMOVE: {
          const lp = lParam & 0xffffffffn;
          mouseX = Number(lp & 0xffffn);
          mouseY = Number((lp >> 16n) & 0xffffn);
          return 0n;
        }
        case WM_LBUTTONDOWN:
          mouseDown = true;
          return 0n;
        case WM_LBUTTONUP:
          mouseDown = false;
          return 0n;
        case WM_RBUTTONDOWN:
          mouseRightDown = true;
          return 0n;
        case WM_RBUTTONUP:
          mouseRightDown = false;
          return 0n;
        case WM_MOUSEWHEEL: {
          // HIWORD(wParam) is a signed short wheel delta in multiples of 120.
          let delta = Number((wParam >> 16n) & 0xffffn);
          if (delta >= 0x8000) delta -= 0x10000;
          wheelAccum += delta / 120;
          return 0n;
        }
        case WM_KEYDOWN:
          keys.add(Number(wParam));
          if (Number(wParam) === VK_ESCAPE) {
            closing = true;
            User32.DestroyWindow(hWnd);
          }
          return 0n;
        case WM_KEYUP:
          keys.delete(Number(wParam));
          return 0n;
        case WM_CLOSE:
          closing = true;
          User32.DestroyWindow(hWnd);
          return 0n;
        case WM_DESTROY:
          closing = true;
          User32.PostQuitMessage(0);
          return 0n;
        default:
          return BigInt(User32.DefWindowProcW(hWnd, msg, wParam, lParam));
      }
    },
    { args: ['u64', 'u32', 'u64', 'i64'], returns: 'i64' },
  );

  windowClassCounter += 1;
  const className = encodeWide(`BunGpuEngine_${process.pid}_${windowClassCounter}`);
  const wndClass = Buffer.alloc(80);
  const view = new DataView(wndClass.buffer);
  view.setUint32(0, 80, true); // cbSize
  view.setUint32(4, CS_HREDRAW | CS_VREDRAW, true); // style
  wndClass.writeBigUInt64LE(BigInt(wndProc.ptr!), 8); // lpfnWndProc
  wndClass.writeBigUInt64LE(BigInt(className.ptr!), 64); // lpszClassName

  if (!User32.RegisterClassExW(wndClass.ptr!)) {
    wndProc.close();
    throw new Error('RegisterClassExW failed — the class registration was rejected (invalid wndProc callback, or the session ATOM table is exhausted).');
  }

  const screenW = User32.GetSystemMetrics(SystemMetric.SM_CXSCREEN);
  const screenH = User32.GetSystemMetrics(SystemMetric.SM_CYSCREEN);
  const startX = Math.max(0, Math.floor((screenW - width) / 2));
  const startY = Math.max(0, Math.floor((screenH - height) / 2));
  const style = borderless ? WindowStyles.WS_POPUP | WindowStyles.WS_VISIBLE : WindowStyles.WS_OVERLAPPEDWINDOW | WindowStyles.WS_VISIBLE;

  hwnd = User32.CreateWindowExW(0, className.ptr!, encodeWide(title).ptr!, style, startX, startY, width, height, 0n, 0n, 0n, null);
  if (!hwnd) {
    User32.UnregisterClassW(className.ptr!, 0n);
    wndProc.close();
    throw new Error('CreateWindowExW failed — likely no interactive desktop (headless session/CI service) or an invalid style combination.');
  }

  // Mandatory visibility fix: WS_VISIBLE alone is not enough — a prior batch
  // shipped windows that opened hidden. Show, force topmost, then foreground.
  User32.ShowWindow(hwnd, ShowWindowCommand.SW_SHOW);
  User32.UpdateWindow(hwnd);
  User32.SetWindowPos(hwnd, 0xffffffffffffffffn /* HWND_TOPMOST */, 0, 0, 0, 0, 0x0043 /* SWP_NOMOVE|SWP_NOSIZE|SWP_SHOWWINDOW */);
  User32.SetForegroundWindow(hwnd);

  const msgBuffer = Buffer.alloc(48);
  const clientRect = Buffer.alloc(16);
  let destroyed = false;

  return {
    hwnd,
    wndProc,
    getMouse: () => ({ x: mouseX, y: mouseY, down: mouseDown, rightDown: mouseRightDown }),
    getWheel: () => {
      const d = wheelAccum;
      wheelAccum = 0;
      return d;
    },
    keyDown: (vk: number) => keys.has(vk),
    pump: () => {
      while (User32.PeekMessageW(msgBuffer.ptr!, 0n, 0, 0, PM_REMOVE) !== 0) {
        User32.TranslateMessage(msgBuffer.ptr!);
        User32.DispatchMessageW(msgBuffer.ptr!);
      }
    },
    shouldClose: () => closing || (User32.GetAsyncKeyState(VK_ESCAPE) & 0x8000) !== 0,
    clientSize: () => {
      User32.GetClientRect(hwnd, clientRect.ptr!);
      const w = Math.max(1, clientRect.readInt32LE(8) - clientRect.readInt32LE(0)) || width;
      const h = Math.max(1, clientRect.readInt32LE(12) - clientRect.readInt32LE(4)) || height;
      return { w, h };
    },
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      if (hwnd) User32.DestroyWindow(hwnd);
      User32.UnregisterClassW(className.ptr!, 0n);
      wndProc.close();
    },
  };
}
