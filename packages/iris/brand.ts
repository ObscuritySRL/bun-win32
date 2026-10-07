// The Iris mark, drawn procedurally so the same pixels become the tray icon at runtime and the .exe icon at build time:
// a dark disc holding a blue-to-violet iris with fine radial fibres, a deep pupil, and one catch-light.

import Gdi32 from '@bun-win32/gdi32';
import User32 from '@bun-win32/user32';

import { copyMemory } from './native';

function coverage(distance: number, pixel: number): number {
  return Math.min(1, Math.max(0, 0.5 - distance / pixel));
}

/** Straight-alpha RGBA pixels of the mark at `size`×`size`. */
export function irisMark(size: number): Uint8Array {
  const pixels = new Uint8Array(size * size * 4);
  const pixel = 2 / size;
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const x = ((column + 0.5) / size) * 2 - 1;
      const y = ((row + 0.5) / size) * 2 - 1;
      const radius = Math.hypot(x, y);
      const angle = Math.atan2(y, x);
      const disc = coverage(radius - 0.94, pixel);
      if (disc <= 0) continue;
      let red = 0.05;
      let green = 0.07;
      let blue = 0.12;
      const iris = coverage(radius - 0.74, pixel) * (1 - coverage(radius - 0.3, pixel));
      if (iris > 0) {
        const mix = 0.5 + 0.5 * Math.sin(angle * 1.0 + 0.6);
        const fibres = 0.82 + 0.18 * Math.sin(angle * 38 + Math.sin(angle * 7) * 2);
        const glow = 1 - (radius - 0.3) / 0.44;
        const irisRed = (0.36 + 0.3 * mix) * fibres * (0.75 + 0.25 * glow);
        const irisGreen = (0.55 - 0.3 * mix) * fibres * (0.75 + 0.25 * glow);
        const irisBlue = 1.0 * fibres;
        red += (irisRed - red) * iris;
        green += (irisGreen - green) * iris;
        blue += (irisBlue - blue) * iris;
      }
      const catchLight = coverage(Math.hypot(x + 0.2, y + 0.2) - 0.1, pixel);
      red += (1 - red) * catchLight * 0.95;
      green += (1 - green) * catchLight * 0.95;
      blue += (1 - blue) * catchLight * 0.95;
      const offset = (row * size + column) * 4;
      pixels[offset] = Math.round(Math.min(1, red) * 255);
      pixels[offset + 1] = Math.round(Math.min(1, green) * 255);
      pixels[offset + 2] = Math.round(Math.min(1, blue) * 255);
      pixels[offset + 3] = Math.round(disc * 255);
    }
  }
  return pixels;
}

/** An HICON of the mark (caller destroys it with DestroyIcon). */
export function createIrisIcon(size: number): bigint {
  const rgba = irisMark(size);
  const info = Buffer.alloc(40); // BITMAPINFOHEADER, top-down 32 bpp
  info.writeUInt32LE(40, 0);
  info.writeInt32LE(size, 4);
  info.writeInt32LE(-size, 8);
  info.writeUInt16LE(1, 12);
  info.writeUInt16LE(32, 14);
  const bitsOut = Buffer.alloc(8);
  const color = Gdi32.CreateDIBSection(0n, info.ptr, 0, bitsOut.ptr, 0n, 0);
  const bgra = Buffer.alloc(size * size * 4);
  for (let index = 0; index < size * size * 4; index += 4) {
    bgra[index] = rgba[index + 2]!;
    bgra[index + 1] = rgba[index + 1]!;
    bgra[index + 2] = rgba[index]!;
    bgra[index + 3] = rgba[index + 3]!;
  }
  copyMemory(bitsOut.readBigUInt64LE(0), BigInt(bgra.ptr), bgra.length);
  const mask = Gdi32.CreateBitmap(size, size, 1, 1, null);
  const iconInfo = Buffer.alloc(32); // ICONINFO
  iconInfo.writeInt32LE(1, 0);
  iconInfo.writeBigUInt64LE(mask, 16);
  iconInfo.writeBigUInt64LE(color, 24);
  const icon = User32.CreateIconIndirect(iconInfo.ptr);
  Gdi32.DeleteObject(color);
  Gdi32.DeleteObject(mask);
  return icon;
}
