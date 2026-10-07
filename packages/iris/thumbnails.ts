// Pixels for minimized windows. A minimized window has no composed surface for Windows.Graphics.Capture, but DWM still
// keeps the full-size bitmap it shows in taskbar previews. Iris registers DWM thumbnails of those windows into a host
// window of its own — cloaked and parked at -32000 so no one ever sees it — and captures the HOST with WGC. Each
// minimized window then has a region of the host texture: its real last frame, at up to native resolution.

import { JSCallback } from 'bun:ffi';

import Dwmapi from '@bun-win32/dwmapi';
import User32 from '@bun-win32/user32';

import { type WindowCapture } from './capture';

const DWM_TNP_OPACITY = 0x04;
const DWM_TNP_RECTDESTINATION = 0x01;
const DWM_TNP_SOURCECLIENTAREAONLY = 0x10;
const DWM_TNP_VISIBLE = 0x08;
const DWMWA_CLOAK = 13;
const HWND_BOTTOM = 1n;
const OFFSCREEN = -32_000;
const SWP_NOACTIVATE = 0x0010;
const SWP_SHOWWINDOW = 0x0040;
const WS_EX_NOACTIVATE = 0x0800_0000;
const WS_EX_TOOLWINDOW = 0x0000_0080;
const WS_POPUP = 0x8000_0000;

interface Slot {
  height: number;
  thumbnail: bigint;
  width: number;
  x: number;
  y: number;
}

let hostCounter = 0;

export class ThumbnailHost {
  #className: Buffer;
  #procedure: JSCallback;
  #slots = new Map<bigint, Slot>();
  #width = 1;
  #height = 1;
  readonly hwnd: bigint;
  capture: WindowCapture | null = null;

  constructor() {
    hostCounter += 1;
    this.#procedure = new JSCallback((hWnd: bigint, message: number, wParam: bigint, lParam: bigint): bigint => User32.DefWindowProcW(hWnd, message, wParam, lParam), { args: ['u64', 'u32', 'u64', 'i64'], returns: 'i64' });
    this.#className = Buffer.from(`IrisThumbnailHost_${process.pid}_${hostCounter}_${Math.floor(Math.random() * 1e9)}\0`, 'utf16le');
    const windowClass = Buffer.alloc(80);
    windowClass.writeUInt32LE(80, 0);
    windowClass.writeBigUInt64LE(BigInt(this.#procedure.ptr!), 8);
    windowClass.writeBigUInt64LE(BigInt(this.#className.ptr), 64);
    if (User32.RegisterClassExW(windowClass.ptr) === 0) throw new Error('RegisterClassExW(thumbnail host) failed');
    this.hwnd = User32.CreateWindowExW(WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE, this.#className.ptr, this.#className.ptr, WS_POPUP, OFFSCREEN, OFFSCREEN, 1, 1, 0n, 0n, 0n, null);
    if (this.hwnd === 0n) throw new Error('CreateWindowExW(thumbnail host) failed');
    const cloak = Buffer.alloc(4);
    cloak.writeInt32LE(1, 0);
    Dwmapi.DwmSetWindowAttribute(this.hwnd, DWMWA_CLOAK, cloak.ptr, 4);
  }

  get width(): number {
    return this.#width;
  }

  get height(): number {
    return this.#height;
  }

  /** Host exactly `windows` (each fitted inside maximumCell², aspect from DWM's real source size), `columns` per row. */
  sync(windows: readonly bigint[], maximumCell: number, columns: number): void {
    const wanted = new Set(windows);
    for (const [hwnd, slot] of this.#slots) {
      if (wanted.has(hwnd)) continue;
      Dwmapi.DwmUnregisterThumbnail(slot.thumbnail);
      this.#slots.delete(hwnd);
    }
    const size = Buffer.alloc(8);
    const placements: { hwnd: bigint; slot: Slot; x: number; y: number; width: number; height: number }[] = [];
    let x = 0;
    let y = 0;
    let rowHeight = 0;
    let width = 1;
    let column = 0;
    for (const hwnd of windows) {
      let slot = this.#slots.get(hwnd);
      if (slot === undefined) {
        const out = Buffer.alloc(8);
        if (Dwmapi.DwmRegisterThumbnail(this.hwnd, hwnd, out.ptr) !== 0) continue;
        slot = { height: 0, thumbnail: out.readBigUInt64LE(0), width: 0, x: -1, y: -1 };
        this.#slots.set(hwnd, slot);
      }
      if (Dwmapi.DwmQueryThumbnailSourceSize(slot.thumbnail, size.ptr) !== 0) continue;
      const cell = fitCell(size.readInt32LE(0), size.readInt32LE(4), maximumCell);
      if (column === columns) {
        column = 0;
        x = 0;
        y += rowHeight;
        rowHeight = 0;
      }
      placements.push({ height: cell.height, hwnd, slot, width: cell.width, x, y });
      x += cell.width;
      width = Math.max(width, x);
      rowHeight = Math.max(rowHeight, cell.height);
      column += 1;
    }
    const height = Math.max(1, y + rowHeight);
    if (width !== this.#width || height !== this.#height || User32.IsWindowVisible(this.hwnd) === 0) {
      this.#width = width;
      this.#height = height;
      User32.SetWindowPos(this.hwnd, HWND_BOTTOM, OFFSCREEN, OFFSCREEN, width, height, SWP_NOACTIVATE | SWP_SHOWWINDOW);
    }
    const properties = Buffer.alloc(48); // DWM_THUMBNAIL_PROPERTIES
    for (const placement of placements) {
      const slot = placement.slot;
      if (slot.x === placement.x && slot.y === placement.y && slot.width === placement.width && slot.height === placement.height) continue;
      slot.x = placement.x;
      slot.y = placement.y;
      slot.width = placement.width;
      slot.height = placement.height;
      properties.fill(0);
      properties.writeUInt32LE(DWM_TNP_RECTDESTINATION | DWM_TNP_OPACITY | DWM_TNP_VISIBLE | DWM_TNP_SOURCECLIENTAREAONLY, 0);
      properties.writeInt32LE(placement.x, 4);
      properties.writeInt32LE(placement.y, 8);
      properties.writeInt32LE(placement.x + placement.width, 12);
      properties.writeInt32LE(placement.y + placement.height, 16);
      properties.writeUInt8(255, 36);
      properties.writeInt32LE(1, 40);
      Dwmapi.DwmUpdateThumbnailProperties(slot.thumbnail, properties.ptr);
    }
  }

  /** Where `hwnd`'s pixels sit inside the captured host texture (unit space), or null. */
  region(hwnd: bigint): readonly [number, number, number, number] | null {
    const slot = this.#slots.get(hwnd);
    const texture = this.capture?.texture;
    if (slot === undefined || texture == null || texture.width < this.#width || texture.height < this.#height) return null;
    return [slot.x / texture.width, slot.y / texture.height, (slot.x + slot.width) / texture.width, (slot.y + slot.height) / texture.height];
  }

  /** Pixel rectangle of `hwnd` inside the host (for read-back), or null. */
  rectangle(hwnd: bigint): { x: number; y: number; width: number; height: number } | null {
    const slot = this.#slots.get(hwnd);
    return slot === undefined ? null : { height: slot.height, width: slot.width, x: slot.x, y: slot.y };
  }

  destroy(): void {
    for (const slot of this.#slots.values()) Dwmapi.DwmUnregisterThumbnail(slot.thumbnail);
    this.#slots.clear();
    this.capture?.release();
    User32.DestroyWindow(this.hwnd);
    User32.UnregisterClassW(this.#className.ptr, 0n);
    this.#procedure.close();
  }
}

/** Fit a window of width×height inside a cell no larger than maximum×maximum, preserving aspect. */
export function fitCell(width: number, height: number, maximum: number): { width: number; height: number } {
  const scale = Math.min(1, maximum / Math.max(width, height));
  return { height: Math.max(8, Math.round(height * scale)), width: Math.max(8, Math.round(width * scale)) };
}
