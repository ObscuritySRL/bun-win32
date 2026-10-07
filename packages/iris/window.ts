// The overlay window: a borderless, topmost, tool-window (no taskbar button, no Alt+Tab entry) with no redirection
// bitmap — DirectComposition supplies all of its pixels. The window procedure only records input; the frame loop
// drains the queue, so no application logic ever runs inside a native callback.

import { JSCallback } from 'bun:ffi';

import User32 from '@bun-win32/user32';

import { Cursor } from './native';
import { WM_TRAY } from './tray';

const CS_DBLCLKS = 0x0008;
const IDC_ARROW = 32_512n;
const MA_ACTIVATE = 1n;
const WA_INACTIVE = 0;
const WM_ACTIVATE = 0x0006;
const WM_CHAR = 0x0102;
const WM_CLOSE = 0x0010;
const WM_HOTKEY = 0x0312;
const WM_KEYDOWN = 0x0100;
const WM_LBUTTONDOWN = 0x0201;
const WM_LBUTTONUP = 0x0202;
const WM_MBUTTONDOWN = 0x0207;
const WM_MOUSEACTIVATE = 0x0021;
const WM_MOUSEMOVE = 0x0200;
const WM_MOUSEWHEEL = 0x020a;
const WM_RBUTTONDOWN = 0x0204;
const WM_SYSKEYDOWN = 0x0104;
const WS_EX_NOREDIRECTIONBITMAP = 0x0020_0000;
const WS_EX_TOOLWINDOW = 0x0000_0080;
const WS_EX_TOPMOST = 0x0000_0008;
const WS_POPUP = 0x8000_0000;
const SW_HIDE = 0;
const SW_SHOW = 5;
const SWP_NOACTIVATE = 0x0010;
const SWP_SHOWWINDOW = 0x0040;
const HWND_TOPMOST = 0xffff_ffff_ffff_ffffn;
const VK_CONTROL = 0x11;
const VK_MENU = 0x12;
const VK_SHIFT = 0x10;

export type InputEvent =
  | { kind: 'character'; text: string }
  | { kind: 'deactivate' }
  | { kind: 'hotkey'; id: number }
  | { kind: 'tray'; message: number }
  | { kind: 'key'; alt: boolean; control: boolean; shift: boolean; virtualKey: number }
  | { kind: 'pointer-down'; button: 'left' | 'middle' | 'right'; x: number; y: number }
  | { kind: 'pointer-move'; x: number; y: number }
  | { kind: 'pointer-up'; button: 'left'; x: number; y: number }
  | { kind: 'wheel'; delta: number; x: number; y: number };

function signedLow(value: bigint): number {
  const low = Number(value & 0xffffn);
  return low >= 0x8000 ? low - 0x1_0000 : low;
}

function signedHigh(value: bigint): number {
  const high = Number((value >> 16n) & 0xffffn);
  return high >= 0x8000 ? high - 0x1_0000 : high;
}

export class OverlayWindow {
  #className: Buffer;
  #message = Buffer.alloc(48);
  #pendingHighSurrogate = '';
  #procedure: JSCallback;
  readonly events: InputEvent[] = [];
  readonly hwnd: bigint;
  visible = false;

  constructor(title: string) {
    this.#procedure = new JSCallback((hWnd: bigint, message: number, wParam: bigint, lParam: bigint): bigint => this.#handle(hWnd, message, wParam, lParam), {
      args: ['u64', 'u32', 'u64', 'i64'],
      returns: 'i64',
    });
    this.#className = Buffer.from(`IrisOverlay_${process.pid}\0`, 'utf16le');
    const windowClass = Buffer.alloc(80); // WNDCLASSEXW
    windowClass.writeUInt32LE(80, 0);
    windowClass.writeUInt32LE(CS_DBLCLKS, 4);
    windowClass.writeBigUInt64LE(BigInt(this.#procedure.ptr!), 8);
    windowClass.writeBigUInt64LE(Cursor.LoadCursorW(0n, IDC_ARROW), 40);
    windowClass.writeBigUInt64LE(BigInt(this.#className.ptr), 64);
    if (User32.RegisterClassExW(windowClass.ptr) === 0) throw new Error('RegisterClassExW failed');
    const titleText = Buffer.from(`${title}\0`, 'utf16le');
    this.hwnd = User32.CreateWindowExW(WS_EX_NOREDIRECTIONBITMAP | WS_EX_TOOLWINDOW | WS_EX_TOPMOST, this.#className.ptr, titleText.ptr, WS_POPUP, 0, 0, 1, 1, 0n, 0n, 0n, null);
    if (this.hwnd === 0n) throw new Error('CreateWindowExW failed');
  }

  #handle(hWnd: bigint, message: number, wParam: bigint, lParam: bigint): bigint {
    switch (message) {
      case WM_ACTIVATE:
        if (Number(wParam & 0xffffn) === WA_INACTIVE) this.events.push({ kind: 'deactivate' });
        return 0n;
      case WM_CHAR: {
        const code = Number(wParam);
        if (code >= 0xd800 && code <= 0xdbff) {
          this.#pendingHighSurrogate = String.fromCharCode(code);
          return 0n;
        }
        const text = this.#pendingHighSurrogate + String.fromCharCode(code);
        this.#pendingHighSurrogate = '';
        if (code >= 0x20 && code !== 0x7f) this.events.push({ kind: 'character', text });
        return 0n;
      }
      case WM_CLOSE:
        return 0n;
      case WM_TRAY:
        this.events.push({ kind: 'tray', message: Number(lParam & 0xffffn) });
        return 0n;
      case WM_HOTKEY:
        this.events.push({ kind: 'hotkey', id: Number(wParam) });
        return 0n;
      case WM_KEYDOWN:
      case WM_SYSKEYDOWN:
        this.events.push({
          alt: (User32.GetKeyState(VK_MENU) & 0x8000) !== 0,
          control: (User32.GetKeyState(VK_CONTROL) & 0x8000) !== 0,
          kind: 'key',
          shift: (User32.GetKeyState(VK_SHIFT) & 0x8000) !== 0,
          virtualKey: Number(wParam),
        });
        return message === WM_SYSKEYDOWN ? User32.DefWindowProcW(hWnd, message, wParam, lParam) : 0n;
      case WM_LBUTTONDOWN:
        this.events.push({ button: 'left', kind: 'pointer-down', x: signedLow(lParam), y: signedHigh(lParam) });
        return 0n;
      case WM_LBUTTONUP:
        this.events.push({ button: 'left', kind: 'pointer-up', x: signedLow(lParam), y: signedHigh(lParam) });
        return 0n;
      case WM_MBUTTONDOWN:
        this.events.push({ button: 'middle', kind: 'pointer-down', x: signedLow(lParam), y: signedHigh(lParam) });
        return 0n;
      case WM_MOUSEACTIVATE:
        return MA_ACTIVATE;
      case WM_MOUSEMOVE:
        this.events.push({ kind: 'pointer-move', x: signedLow(lParam), y: signedHigh(lParam) });
        return 0n;
      case WM_MOUSEWHEEL:
        this.events.push({ delta: signedHigh(wParam) / 120, kind: 'wheel', x: signedLow(lParam), y: signedHigh(lParam) });
        return 0n;
      case WM_RBUTTONDOWN:
        this.events.push({ button: 'right', kind: 'pointer-down', x: signedLow(lParam), y: signedHigh(lParam) });
        return 0n;
      default:
        return User32.DefWindowProcW(hWnd, message, wParam, lParam);
    }
  }

  /** Drain the thread's message queue (hotkeys arrive here even while the window is hidden). */
  pump(): void {
    while (User32.PeekMessageW(this.#message.ptr, 0n, 0, 0, 1) !== 0) {
      User32.TranslateMessage(this.#message.ptr);
      User32.DispatchMessageW(this.#message.ptr);
    }
  }

  /** Sleep until a message arrives or `timeoutMilliseconds` passes (the resident idle loop). */
  waitForMessage(timeoutMilliseconds: number): void {
    User32.MsgWaitForMultipleObjectsEx(0, null, timeoutMilliseconds, 0x04ff /* QS_ALLINPUT */, 0x0004 /* MWMO_INPUTAVAILABLE */);
  }

  show(x: number, y: number, width: number, height: number, activate: boolean): void {
    User32.SetWindowPos(this.hwnd, HWND_TOPMOST, x, y, width, height, SWP_SHOWWINDOW | (activate ? 0 : SWP_NOACTIVATE));
    User32.ShowWindow(this.hwnd, SW_SHOW);
    if (activate) User32.SetForegroundWindow(this.hwnd);
    this.visible = true;
  }

  hide(): void {
    User32.ShowWindow(this.hwnd, SW_HIDE);
    this.visible = false;
  }

  destroy(): void {
    User32.DestroyWindow(this.hwnd);
    User32.UnregisterClassW(this.#className.ptr, 0n);
    this.#procedure.close();
  }
}
