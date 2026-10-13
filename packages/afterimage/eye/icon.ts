// The Afterimage mark — a bright disc trailed by two fading echoes, the picture that lingers after
// something has moved — drawn with Direct2D. The same drawing becomes the tray icon (an HICON at
// the tray's size for the current DPI) and, at build time, the executable's multi-size .ico.

import { ptr } from 'bun:ffi';

import { DXGI_FORMAT_B8G8R8A8_UNORM, comRelease, encodePNGFromRGBA, makeTexture, readbackTexture } from '@bun-win32/gpu';
import Gdi32 from '@bun-win32/gdi32';
import User32 from '@bun-win32/user32';

import type { Painter } from '../shared/painter';
import { palette } from './design';

/** Straight-alpha RGBA pixels of the mark at `size`×`size`. */
export function renderMark(painter: Painter, size: number): Uint8Array {
  const target = makeTexture({ format: DXGI_FORMAT_B8G8R8A8_UNORM, h: size, rtv: true, srv: true, w: size });
  try {
    painter.begin(target.tex, 96);
    painter.clear([0, 0, 0, 0]);
    const unit = size / 16;
    const accent = palette.accent;
    painter.fillEllipse(4.2 * unit, 8 * unit, 2.6 * unit, 2.6 * unit, [accent[0], accent[1], accent[2], 0.32]);
    painter.fillEllipse(6.8 * unit, 8 * unit, 3.4 * unit, 3.4 * unit, [accent[0], accent[1], accent[2], 0.6]);
    painter.fillEllipse(10.4 * unit, 8 * unit, 4.6 * unit, 4.6 * unit, [accent[0], accent[1], accent[2], 1]);
    painter.fillEllipse(10.4 * unit, 8 * unit, 2.1 * unit, 2.1 * unit, [palette.now[0], palette.now[1], palette.now[2], 1]);
    painter.end();
    const bgra = readbackTexture(target.tex, size, size, 4, DXGI_FORMAT_B8G8R8A8_UNORM);
    const rgba = new Uint8Array(size * size * 4);
    for (let index = 0; index < size * size; index += 1) {
      const alpha = bgra[index * 4 + 3]!;
      const unpremultiply = alpha === 0 ? 0 : 255 / alpha;
      rgba[index * 4] = Math.min(255, Math.round(bgra[index * 4 + 2]! * unpremultiply));
      rgba[index * 4 + 1] = Math.min(255, Math.round(bgra[index * 4 + 1]! * unpremultiply));
      rgba[index * 4 + 2] = Math.min(255, Math.round(bgra[index * 4]! * unpremultiply));
      rgba[index * 4 + 3] = alpha;
    }
    return rgba;
  } finally {
    painter.releaseTarget(target.tex);
    comRelease(target.tex);
  }
}

/** An HICON (32-bit with alpha) from straight-alpha RGBA. */
export function createIcon(rgba: Uint8Array, size: number): bigint {
  const bgra = new Uint8Array(new ArrayBuffer(size * size * 4));
  for (let index = 0; index < size * size; index += 1) {
    bgra[index * 4] = rgba[index * 4 + 2]!;
    bgra[index * 4 + 1] = rgba[index * 4 + 1]!;
    bgra[index * 4 + 2] = rgba[index * 4]!;
    bgra[index * 4 + 3] = rgba[index * 4 + 3]!;
  }
  const color = Gdi32.CreateBitmap(size, size, 1, 32, ptr(bgra));
  const mask = Gdi32.CreateBitmap(size, size, 1, 1, ptr(new Uint8Array(new ArrayBuffer(Math.ceil(size / 16) * 2 * size))));
  const information = new DataView(new ArrayBuffer(0x20));
  information.setInt32(0x00, 1, true);
  information.setBigUint64(0x10, mask, true);
  information.setBigUint64(0x18, color, true);
  const icon = User32.CreateIconIndirect(ptr(information));
  Gdi32.DeleteObject(color);
  Gdi32.DeleteObject(mask);
  return icon;
}

/** A multi-resolution .ico (PNG-compressed entries) for the executable. */
export function encodeIcon(painter: Painter, sizes: readonly number[]): Uint8Array {
  const images = sizes.map((size) => encodePNGFromRGBA(renderMark(painter, size), size, size));
  const header = 6 + sizes.length * 16;
  const total = header + images.reduce((sum, image) => sum + image.length, 0);
  const file = new Uint8Array(total);
  const view = new DataView(file.buffer);
  view.setUint16(2, 1, true);
  view.setUint16(4, sizes.length, true);
  let offset = header;
  sizes.forEach((size, index) => {
    const entry = 6 + index * 16;
    file[entry] = size >= 256 ? 0 : size;
    file[entry + 1] = size >= 256 ? 0 : size;
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, 32, true);
    view.setUint32(entry + 8, images[index]!.length, true);
    view.setUint32(entry + 12, offset, true);
    file.set(images[index]!, offset);
    offset += images[index]!.length;
  });
  return file;
}
