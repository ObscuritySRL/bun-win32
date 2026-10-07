// The notification-area icon: how a resident Iris with no console is summoned and quit. Left click opens Iris, right
// click offers a menu. Clicks arrive as WM_TRAY on the overlay window and are queued like any other input.

import Shell32 from '@bun-win32/shell32';
import User32 from '@bun-win32/user32';

import { createIrisIcon } from './brand';

export const WM_TRAY = 0x8001; // WM_APP + 1

const MENU_OPEN = 1;
const MENU_QUIT = 2;
const MF_SEPARATOR = 0x0800;
const MF_STRING = 0x0000;
const NIF_ICON = 0x02;
const NIF_INFO = 0x10;
const NIF_MESSAGE = 0x01;
const NIF_TIP = 0x04;
const NIM_ADD = 0;
const NIM_DELETE = 2;
const NIM_MODIFY = 1;
const TPM_RETURNCMD = 0x0100;
const TPM_RIGHTBUTTON = 0x0002;

export type TrayChoice = 'none' | 'open' | 'quit';

export class Tray {
  #data = Buffer.alloc(976); // NOTIFYICONDATAW (x64)
  #hwnd: bigint;
  #icon: bigint;

  constructor(hwnd: bigint, tip: string) {
    this.#hwnd = hwnd;
    this.#icon = createIrisIcon(32);
    const data = this.#data;
    data.writeUInt32LE(976, 0);
    data.writeBigUInt64LE(hwnd, 8);
    data.writeUInt32LE(1, 16);
    data.writeUInt32LE(NIF_MESSAGE | NIF_ICON | NIF_TIP, 20);
    data.writeUInt32LE(WM_TRAY, 24);
    data.writeBigUInt64LE(this.#icon, 32);
    data.write(`${tip.slice(0, 127)}\0`, 40, 'utf16le');
    Shell32.Shell_NotifyIconW(NIM_ADD, data.ptr);
  }

  /** A one-time balloon ("Iris is running…"). */
  notify(title: string, text: string): void {
    const data = this.#data;
    data.writeUInt32LE(NIF_INFO, 20);
    data.fill(0, 304, 816);
    data.write(`${text.slice(0, 255)}\0`, 304, 'utf16le');
    data.fill(0, 820, 948);
    data.write(`${title.slice(0, 63)}\0`, 820, 'utf16le');
    data.writeUInt32LE(0x01 /* NIIF_INFO */, 948);
    Shell32.Shell_NotifyIconW(NIM_MODIFY, data.ptr);
    data.writeUInt32LE(NIF_MESSAGE | NIF_ICON | NIF_TIP, 20);
  }

  /** Show the right-click menu at the pointer; returns what was picked. */
  menu(): TrayChoice {
    const menu = User32.CreatePopupMenu();
    User32.AppendMenuW(menu, MF_STRING, BigInt(MENU_OPEN), Buffer.from('Open Iris\tAlt+`\0', 'utf16le').ptr);
    User32.AppendMenuW(menu, MF_SEPARATOR, 0n, null);
    User32.AppendMenuW(menu, MF_STRING, BigInt(MENU_QUIT), Buffer.from('Quit\0', 'utf16le').ptr);
    const point = Buffer.alloc(8);
    User32.GetCursorPos(point.ptr);
    // The menu only dismisses on an outside click if its owner is the foreground window.
    User32.SetForegroundWindow(this.#hwnd);
    const choice = User32.TrackPopupMenu(menu, TPM_RETURNCMD | TPM_RIGHTBUTTON, point.readInt32LE(0), point.readInt32LE(4), 0, this.#hwnd, null);
    User32.DestroyMenu(menu);
    return choice === MENU_OPEN ? 'open' : choice === MENU_QUIT ? 'quit' : 'none';
  }

  remove(): void {
    Shell32.Shell_NotifyIconW(NIM_DELETE, this.#data.ptr);
    User32.DestroyIcon(this.#icon);
  }
}
