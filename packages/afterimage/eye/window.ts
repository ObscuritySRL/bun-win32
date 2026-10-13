// The overlay window and the main thread's message pump. One borderless, top-most popup per
// process: excluded from capture (so the recorder sees through it), cloaked until its first frame
// is presented (so it never flashes), DWM transitions disabled (so it never zooms). It also owns the
// global hotkey, the tray icon's callbacks and menu commands; every message becomes an event the
// view drains once per frame.

import { FFIType, JSCallback, ptr } from 'bun:ffi';

import Advapi32 from '@bun-win32/advapi32';
import Dwmapi from '@bun-win32/dwmapi';
import Kernel32 from '@bun-win32/kernel32';
import User32 from '@bun-win32/user32';

const classStyleDoubleClicks = 0x8;
const cloakAttribute = 0xd;
const extendedNoRedirectionBitmap = 0x20_0000;
const extendedToolWindow = 0x80;
const extendedTopmost = 0x8;
const hotkeyMessage = 0x312;
const keyboardRepeatBit = 0x4000_0000;
const popupStyle = 0x8000_0000;
const removeMessage = 0x1;
const transitionsAttribute = 0x3;
const windowTopmost = 0xffff_ffff_ffff_ffffn;
const windowExcludeFromCapture = 0x11;

/** The tray icon reports through this application message. */
export const trayMessage = 0x8001;

export type InputEvent =
  | { alt: boolean; control: boolean; down: boolean; key: number; repeat: boolean; shift: boolean; type: 'key' }
  | { button: 'left' | 'right'; double: boolean; down: boolean; type: 'button'; x: number; y: number }
  | { delta: number; horizontal: boolean; type: 'wheel' }
  | { dpi: number; type: 'dpi' }
  | { id: number; type: 'command' }
  | { id: number; type: 'hotkey' }
  | { lParam: number; type: 'tray' }
  | { text: string; type: 'character' }
  | { type: 'deactivated' }
  | { type: 'displayChanged' }
  | { type: 'taskbarCreated' }
  | { type: 'pointer'; x: number; y: number };

export class OverlayWindow {
  readonly hwnd: bigint;
  #arrow = 0n;
  readonly #className = Buffer.from('AfterimageOverlay\0', 'utf16le');
  #cursorReady = false;
  readonly #events: InputEvent[] = [];
  readonly #message = new Uint8Array(new ArrayBuffer(0x30));
  #previousForeground = 0n;
  readonly #procedure: JSCallback;
  readonly #taskbarCreated: number;
  #visible = false;

  constructor() {
    this.#procedure = new JSCallback((hWnd: bigint, message: number, wParam: bigint, lParam: bigint) => this.#handle(hWnd, message, wParam, lParam), { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.i64], returns: FFIType.i64 });
    const instance = Kernel32.GetModuleHandleW(null);
    const windowClass = Buffer.alloc(0x50);
    windowClass.writeUInt32LE(0x50, 0x00);
    windowClass.writeUInt32LE(classStyleDoubleClicks, 0x04);
    windowClass.writeBigUInt64LE(BigInt(this.#procedure.ptr!), 0x08);
    windowClass.writeBigUInt64LE(instance, 0x18);
    windowClass.writeBigUInt64LE(BigInt(ptr(this.#className)), 0x40);
    User32.RegisterClassExW(ptr(windowClass));
    this.hwnd = User32.CreateWindowExW(extendedTopmost | extendedToolWindow | extendedNoRedirectionBitmap, ptr(this.#className), ptr(Buffer.from('Afterimage\0', 'utf16le')), popupStyle, 0, 0, 1, 1, 0n, 0n, instance, null);
    if (this.hwnd === 0n) throw new Error('CreateWindowExW failed');
    this.#setAttribute(transitionsAttribute, 1);
    this.#setAttribute(cloakAttribute, 1);
    User32.SetWindowDisplayAffinity(this.hwnd, windowExcludeFromCapture);
    this.#taskbarCreated = User32.RegisterWindowMessageW(ptr(Buffer.from('TaskbarCreated\0', 'utf16le')));
  }

  get visible(): boolean {
    return this.#visible;
  }

  /** Capture the mouse while dragging, so drags that leave the window still end. */
  capture(on: boolean): void {
    if (on) User32.SetCapture(this.hwnd);
    else User32.ReleaseCapture();
  }

  dispose(): void {
    User32.DestroyWindow(this.hwnd);
    this.#procedure.close();
  }

  drain(): InputEvent[] {
    return this.#events.splice(0);
  }

  /** Cloak and hide, handing focus back to whoever had it before. */
  hide(): void {
    if (!this.#visible) return;
    this.#setAttribute(cloakAttribute, 1);
    User32.ShowWindow(this.hwnd, 0);
    if (this.#previousForeground !== 0n) User32.SetForegroundWindow(this.#previousForeground);
    this.#visible = false;
  }

  /** Cover a monitor (physical pixels) and take focus — still cloaked, so nothing is visible yet. */
  prepare(left: number, top: number, width: number, height: number, activate: boolean): void {
    this.#previousForeground = User32.GetForegroundWindow();
    this.#cursorReady = false;
    User32.SetWindowPos(this.hwnd, windowTopmost, left, top, width, height, 0x10);
    User32.ShowWindow(this.hwnd, activate ? 5 : 8);
    if (activate) User32.SetForegroundWindow(this.hwnd);
    this.#visible = true;
  }

  /** Dispatch every queued message for this thread (overlay, hotkey, tray). */
  pump(): void {
    while (User32.PeekMessageW(ptr(this.#message), 0n, 0, 0, removeMessage)) {
      User32.TranslateMessage(ptr(this.#message));
      User32.DispatchMessageW(ptr(this.#message));
    }
  }

  /** Uncloak — call once the first frame has been presented and composed. */
  reveal(): void {
    this.#setAttribute(cloakAttribute, 0);
  }

  #handle(hWnd: bigint, message: number, wParam: bigint, lParam: bigint): bigint {
    const low = Number(lParam & 0xffffn);
    const high = Number((lParam >> 16n) & 0xffffn);
    const signedX = low > 0x7fff ? low - 0x1_0000 : low;
    const signedY = high > 0x7fff ? high - 0x1_0000 : high;
    switch (message) {
      case 0x0006:
        if ((wParam & 0xffffn) === 0n && this.#visible) this.#events.push({ type: 'deactivated' });
        return 0n;
      case 0x0014:
        return 1n;
      case 0x0020:
        if (!this.#cursorReady) return 1n;
        User32.SetCursor(this.#arrowCursor());
        return 1n;
      case 0x007e:
        this.#events.push({ type: 'displayChanged' });
        return 0n;
      case 0x0100:
      case 0x0104:
      case 0x0101:
      case 0x0105: {
        const down = message === 0x0100 || message === 0x0104;
        this.#events.push({
          alt: (User32.GetKeyState(0x12) & 0x8000) !== 0,
          control: (User32.GetKeyState(0x11) & 0x8000) !== 0,
          down,
          key: Number(wParam),
          repeat: down && (lParam & BigInt(keyboardRepeatBit)) !== 0n,
          shift: (User32.GetKeyState(0x10) & 0x8000) !== 0,
          type: 'key',
        });
        return 0n;
      }
      case 0x0102:
        this.#events.push({ text: String.fromCharCode(Number(wParam)), type: 'character' });
        return 0n;
      case 0x0111:
        this.#events.push({ id: Number(wParam & 0xffffn), type: 'command' });
        return 0n;
      case 0x0200:
        if (!this.#cursorReady) {
          this.#cursorReady = true;
          User32.SetCursor(this.#arrowCursor());
        }
        this.#events.push({ type: 'pointer', x: signedX, y: signedY });
        return 0n;
      case 0x0201:
      case 0x0202:
      case 0x0203:
      case 0x0204:
      case 0x0205:
        this.#events.push({ button: message >= 0x0204 ? 'right' : 'left', double: message === 0x0203, down: message === 0x0201 || message === 0x0203 || message === 0x0204, type: 'button', x: signedX, y: signedY });
        return 0n;
      case 0x020a:
      case 0x020e: {
        const raw = Number((wParam >> 16n) & 0xffffn);
        this.#events.push({ delta: (raw > 0x7fff ? raw - 0x1_0000 : raw) / 120, horizontal: message === 0x020e, type: 'wheel' });
        return 0n;
      }
      case 0x02e0:
        this.#events.push({ dpi: Number(wParam & 0xffffn), type: 'dpi' });
        return 0n;
      case hotkeyMessage:
        this.#events.push({ id: Number(wParam), type: 'hotkey' });
        return 0n;
      case trayMessage:
        this.#events.push({ lParam: low, type: 'tray' });
        return 0n;
    }
    if (message === this.#taskbarCreated && message !== 0) {
      this.#events.push({ type: 'taskbarCreated' });
      return 0n;
    }
    return User32.DefWindowProcW(hWnd, message, wParam, lParam);
  }

  /** The user's own arrow (their cursor scheme), loaded by path so no resource-id cast is needed. */
  #arrowCursor(): bigint {
    if (this.#arrow !== 0n) return this.#arrow;
    const data = new Uint16Array(new ArrayBuffer(0x410));
    const size = new Uint32Array(new ArrayBuffer(4));
    size[0] = data.byteLength;
    const hkeyCurrentUser = 0xffff_ffff_8000_0001n;
    let path = 'C:\\Windows\\Cursors\\aero_arrow.cur';
    if (Advapi32.RegGetValueW(hkeyCurrentUser, ptr(Buffer.from('Control Panel\\Cursors\0', 'utf16le')), ptr(Buffer.from('Arrow\0', 'utf16le')), 0xffff, null, ptr(data), ptr(size)) === 0) {
      const configured = Buffer.from(data.buffer, 0, Math.max(0, size[0]! - 2)).toString('utf16le');
      if (configured.length > 0) path = configured;
    }
    this.#arrow = User32.LoadImageW(0n, ptr(Buffer.from(`${path}\0`, 'utf16le')), 2, 0, 0, 0x50);
    return this.#arrow;
  }

  #setAttribute(attribute: number, value: number): void {
    const data = new Int32Array(new ArrayBuffer(4));
    data[0] = value;
    Dwmapi.DwmSetWindowAttribute(this.hwnd, attribute, ptr(data), 4);
  }
}
