// The notification-area icon: where Afterimage lives while it remembers. Left click looks back;
// right click (or the context-menu key) opens a menu. The tooltip says how much it is holding.

import { ptr } from 'bun:ffi';

import Shell32 from '@bun-win32/shell32';
import User32 from '@bun-win32/user32';

import { trayMessage } from './window';

const add = 0x0;
const flagIcon = 0x2;
const flagInformation = 0x10;
const flagMessage = 0x1;
const flagShowTip = 0x80;
const flagTip = 0x4;
const modify = 0x1;
const remove = 0x2;
const setVersion = 0x4;
const versionFour = 0x4;

export interface MenuItem {
  checked?: boolean;
  /** Items inside a submenu. */
  children?: MenuItem[];
  default?: boolean;
  disabled?: boolean;
  /** Command id; 0 for a separator. */
  id: number;
  label: string;
}

export class Tray {
  #icon: bigint;
  #tooltip = 'Afterimage';
  readonly #hwnd: bigint;

  constructor(hwnd: bigint, icon: bigint) {
    this.#hwnd = hwnd;
    this.#icon = icon;
  }

  /** (Re)create the icon — also after Explorer restarts (TaskbarCreated). */
  add(): void {
    Shell32.Shell_NotifyIconW(add, ptr(this.#data(flagMessage | flagIcon | flagTip | flagShowTip)));
    const version = this.#data(0);
    version.writeUInt32LE(versionFour, 0x330);
    Shell32.Shell_NotifyIconW(setVersion, ptr(version));
  }

  /** A quiet system notification from the icon (first run, "can't see the screen"). */
  notify(title: string, text: string): void {
    const data = this.#data(flagInformation);
    data.write(text.slice(0, 255), 0x130, 'utf16le');
    data.write(title.slice(0, 63), 0x334, 'utf16le');
    Shell32.Shell_NotifyIconW(modify, ptr(data));
  }

  remove(): void {
    Shell32.Shell_NotifyIconW(remove, ptr(this.#data(0)));
  }

  setTooltip(tooltip: string): void {
    if (tooltip === this.#tooltip) return;
    this.#tooltip = tooltip;
    Shell32.Shell_NotifyIconW(modify, ptr(this.#data(flagTip | flagShowTip)));
  }

  /** Show the menu at the pointer; returns the chosen id (0 when dismissed). */
  showMenu(items: readonly MenuItem[]): number {
    const menus: bigint[] = [];
    const build = (entries: readonly MenuItem[]): bigint => {
      const menu = User32.CreatePopupMenu();
      menus.push(menu);
      entries.forEach((item, index) => {
        if (item.id === 0 && item.children === undefined) {
          User32.AppendMenuW(menu, 0x800, 0n, null);
          return;
        }
        const flags = (item.checked === true ? 0x8 : 0) | (item.disabled === true ? 0x1 : 0) | (item.children !== undefined ? 0x10 : 0);
        const identifier = item.children !== undefined ? build(item.children) : BigInt(item.id);
        User32.AppendMenuW(menu, flags, identifier, ptr(Buffer.from(`${item.label}\0`, 'utf16le')));
        if (item.default === true) User32.SetMenuDefaultItem(menu, index, 1);
      });
      return menu;
    };
    const root = build(items);
    const point = new Int32Array(new ArrayBuffer(8));
    User32.GetCursorPos(ptr(point));
    User32.SetForegroundWindow(this.#hwnd);
    const chosen = User32.TrackPopupMenuEx(root, 0x100 | 0x80 | 0x2, point[0]!, point[1]!, this.#hwnd, null);
    User32.PostMessageW(this.#hwnd, 0, 0n, 0n);
    for (const menu of menus) User32.DestroyMenu(menu);
    return chosen;
  }

  /** NOTIFYICONDATAW (x64, 976 bytes) with the fields every call shares. */
  #data(flags: number): Buffer {
    const data = Buffer.alloc(0x3d0);
    data.writeUInt32LE(0x3d0, 0x00);
    data.writeBigUInt64LE(this.#hwnd, 0x08);
    data.writeUInt32LE(1, 0x10);
    data.writeUInt32LE(flags, 0x14);
    data.writeUInt32LE(trayMessage, 0x18);
    data.writeBigUInt64LE(this.#icon, 0x20);
    data.write(this.#tooltip.slice(0, 127), 0x28, 'utf16le');
    return data;
  }
}
