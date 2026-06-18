// The pixel-tool layer that complements the a11y tree — full-screen / region capture, pixel color,
// and (with match.ts) template matching — for surfaces with NO accessibility tree: games, canvas,
// custom-draw, and browsers that don't expose their content to UIA. Zero new bindings: BitBlt the
// screen DC, GetDIBits to RGB. This is the nut.js / robotjs niche, in-process and zero-dep, so bun-uia
// is a full REPLACEMENT (UIA when there's a tree, pixels when there isn't), not just a complement.

import Gdi32 from '@bun-win32/gdi32';
import User32 from '@bun-win32/user32';

import { virtualScreen } from '../input/coords';
import { encodePNG } from './png';
import type { Rect } from '../com/reads';

export interface Bitmap {
  rgb: Uint8Array;
  width: number;
  height: number;
  /** Top-left in virtual-screen pixels — add to an in-bitmap match to get absolute screen coords. */
  originX: number;
  originY: number;
}

const SRCCOPY = 0x00cc_0020;
const CAPTUREBLT = 0x4000_0000; // include layered/overlay windows in the grab

/** Capture a screen region (default: the whole virtual desktop) into a tightly packed RGB buffer. */
export function captureScreen(region?: Partial<Rect>): Bitmap {
  const screen = virtualScreen();
  const originX = region?.x ?? screen.x;
  const originY = region?.y ?? screen.y;
  const width = region?.width ?? screen.width;
  const height = region?.height ?? screen.height;

  const hdcScreen = User32.GetDC(0n);
  const hdcMem = Gdi32.CreateCompatibleDC(hdcScreen);
  const hBitmap = Gdi32.CreateCompatibleBitmap(hdcScreen, width, height);
  Gdi32.SelectObject(hdcMem, hBitmap);
  Gdi32.BitBlt(hdcMem, 0, 0, width, height, hdcScreen, originX, originY, (SRCCOPY | CAPTUREBLT) >>> 0);

  const info = Buffer.alloc(40); // BITMAPINFOHEADER
  info.writeUInt32LE(40, 0);
  info.writeInt32LE(width, 4);
  info.writeInt32LE(-height, 8); // top-down rows
  info.writeUInt16LE(1, 12);
  info.writeUInt16LE(32, 14);
  info.writeUInt32LE(0, 16);

  const bgra = Buffer.alloc(width * height * 4);
  Gdi32.GetDIBits(hdcMem, hBitmap, 0, height, bgra.ptr!, info.ptr!, 0);

  Gdi32.DeleteObject(hBitmap);
  Gdi32.DeleteDC(hdcMem);
  User32.ReleaseDC(0n, hdcScreen);

  const rgb = new Uint8Array(width * height * 3);
  for (let source = 0, target = 0; source < bgra.length; source += 4, target += 3) {
    rgb[target] = bgra[source + 2]!;
    rgb[target + 1] = bgra[source + 1]!;
    rgb[target + 2] = bgra[source]!;
  }
  return { rgb, width, height, originX, originY };
}

/** Crop a Bitmap to a sub-rectangle given in the SOURCE bitmap's local pixels (0,0 = its top-left). The crop is
 *  clamped to the source bounds; the returned Bitmap carries the correct screen origin (source origin + crop x/y) so
 *  per-word OCR boxes stay screen-absolute. Returns null if the clamped rectangle is empty (off-bitmap / zero-size).
 *  The occlusion-correct primitive behind Element.capture(): crop a WHOLE-WINDOW capture to one control's bounds. */
export function cropBitmap(source: Bitmap, x: number, y: number, width: number, height: number): Bitmap | null {
  const left = Math.max(0, Math.round(x));
  const top = Math.max(0, Math.round(y));
  const right = Math.min(source.width, Math.round(x) + Math.round(width));
  const bottom = Math.min(source.height, Math.round(y) + Math.round(height));
  const cropWidth = right - left;
  const cropHeight = bottom - top;
  if (cropWidth <= 0 || cropHeight <= 0) return null;
  const rgb = new Uint8Array(cropWidth * cropHeight * 3);
  for (let row = 0; row < cropHeight; row += 1) {
    const sourceStart = ((top + row) * source.width + left) * 3;
    rgb.set(source.rgb.subarray(sourceStart, sourceStart + cropWidth * 3), row * cropWidth * 3);
  }
  return { rgb, width: cropWidth, height: cropHeight, originX: source.originX + left, originY: source.originY + top };
}

/** Capture the screen (or a region) and encode it as PNG bytes. */
export function screenshotScreen(region?: Partial<Rect>): Uint8Array {
  const bitmap = captureScreen(region);
  return encodePNG(bitmap.rgb, bitmap.width, bitmap.height);
}

/** The RGB color of one screen pixel (physical/virtual-screen coordinates). */
export function pixelColor(x: number, y: number): { r: number; g: number; b: number } {
  const hdc = User32.GetDC(0n);
  const colorref = Gdi32.GetPixel(hdc, x, y); // 0x00BBGGRR
  User32.ReleaseDC(0n, hdc);
  return { r: colorref & 0xff, g: (colorref >> 8) & 0xff, b: (colorref >> 16) & 0xff };
}
