// The backdrop: the user's own wallpaper, decoded by WIC, scaled to cover the monitor, uploaded with a full mip chain
// (the opening "focus pull" samples ever-coarser mips), plus a heavy Gaussian blur built on the GPU at 1/8 resolution
// (ping-ponged separable passes) that the backdrop and the frosted-glass panels both sample.

import { FFIType } from 'bun:ffi';

import Combase from '@bun-win32/combase';
import User32 from '@bun-win32/user32';

import type { Renderer, Texture } from './renderer';
import { comRelease, getInterface, guidBytes, hex, vcall } from './winrt';

const CLSID_WICImagingFactory = 'cacaf262-9370-4615-a13b-9f5539da4c0a';
const IID_IWICImagingFactory = 'ec5ec8a9-c395-4314-9c77-54d7a935ff70';
const GUID_WICPixelFormat32bppPBGRA = '6fddc324-4e03-4bfe-b185-3d77768dc910';
const CLSCTX_INPROC_SERVER = 1;
const GENERIC_READ = 0x8000_0000;
const SPI_GETDESKWALLPAPER = 0x0073;

const BITMAP_SOURCE_COPY_PIXELS = 7;
const BITMAP_SOURCE_GET_SIZE = 3;
const CONVERTER_INITIALIZE = 8;
const DECODER_GET_FRAME = 13;
const FACTORY_CREATE_BITMAP_SCALER = 11;
const FACTORY_CREATE_DECODER_FROM_FILENAME = 3;
const FACTORY_CREATE_FORMAT_CONVERTER = 10;
const SCALER_INITIALIZE = 8;

export interface Wallpaper {
  blurred: Texture;
  path: string;
  sharp: Texture;
  /** Screen UV → wallpaper UV (centre-crop of the cover-scaled image). */
  uv: readonly [number, number, number, number];
}

function wallpaperPath(): string {
  const buffer = Buffer.alloc(1040);
  if (User32.SystemParametersInfoW(SPI_GETDESKWALLPAPER, 520, buffer.ptr, 0) === 0) return '';
  return buffer.toString('utf16le').split('\0')[0] ?? '';
}

/** Decode `path` scaled to cover width×height (BGRA, premultiplied); null when the file is missing or undecodable. */
export function decodeImage(path: string, width: number, height: number): { pixels: Buffer; width: number; height: number } | null {
  const factoryOut = Buffer.alloc(8);
  if (Combase.CoCreateInstance(guidBytes(CLSID_WICImagingFactory).ptr, 0n, CLSCTX_INPROC_SERVER, guidBytes(IID_IWICImagingFactory).ptr, factoryOut.ptr) !== 0) return null;
  const factory = factoryOut.readBigUInt64LE(0);
  let decoder = 0n;
  let frame = 0n;
  let scaler = 0n;
  let converter = 0n;
  try {
    const wide = Buffer.from(`${path}\0`, 'utf16le');
    const out = Buffer.alloc(8);
    if (vcall(factory, FACTORY_CREATE_DECODER_FROM_FILENAME, [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], [wide.ptr, null, GENERIC_READ, 0, out.ptr]) !== 0) return null;
    decoder = out.readBigUInt64LE(0);
    if (vcall(decoder, DECODER_GET_FRAME, [FFIType.u32, FFIType.ptr], [0, out.ptr]) !== 0) return null;
    frame = out.readBigUInt64LE(0);
    // Both out-params live in one ArrayBuffer: views over a fresh small typed array's .buffer relocate its storage
    // (JSC "wastes" the inline vector), which would leave the first pointer dangling.
    const sizeStorage = new ArrayBuffer(8);
    const size = new Uint32Array(sizeStorage);
    vcall(frame, BITMAP_SOURCE_GET_SIZE, [FFIType.ptr, FFIType.ptr], [size.ptr, new Uint32Array(sizeStorage, 4, 1).ptr]);
    const sourceWidth = size[0]!;
    const sourceHeight = size[1]!;
    if (sourceWidth === 0 || sourceHeight === 0) return null;
    const scale = Math.max(width / sourceWidth, height / sourceHeight);
    const scaledWidth = Math.max(width, Math.round(sourceWidth * scale));
    const scaledHeight = Math.max(height, Math.round(sourceHeight * scale));
    scaler = getInterface(factory, FACTORY_CREATE_BITMAP_SCALER);
    if (scaler === 0n || vcall(scaler, SCALER_INITIALIZE, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32], [frame, scaledWidth, scaledHeight, 4]) !== 0) return null;
    converter = getInterface(factory, FACTORY_CREATE_FORMAT_CONVERTER);
    if (converter === 0n || vcall(converter, CONVERTER_INITIALIZE, [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.f64, FFIType.u32], [scaler, guidBytes(GUID_WICPixelFormat32bppPBGRA).ptr, 0, 0n, 0, 0]) !== 0) return null;
    const pixels = Buffer.alloc(scaledWidth * scaledHeight * 4);
    const copied = vcall(converter, BITMAP_SOURCE_COPY_PIXELS, [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], [null, scaledWidth * 4, pixels.length, pixels.ptr]);
    if (copied !== 0) throw new Error(`WIC CopyPixels failed: ${hex(copied)}`);
    return { height: scaledHeight, pixels, width: scaledWidth };
  } finally {
    comRelease(converter);
    comRelease(scaler);
    comRelease(frame);
    comRelease(decoder);
    comRelease(factory);
  }
}

/** A quiet two-tone gradient for desktops with no wallpaper image (solid colour, or an unreadable file). */
function gradient(width: number, height: number, accent: readonly [number, number, number]): { pixels: Buffer; width: number; height: number } {
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const v = y / height;
      const glow = Math.max(0, 1 - Math.hypot((u - 0.3) * 1.4, v - 0.2) * 1.3);
      const offset = (y * width + x) * 4;
      pixels[offset] = Math.round(255 * Math.min(1, 0.07 + accent[2] * glow * 0.45 + v * 0.03));
      pixels[offset + 1] = Math.round(255 * Math.min(1, 0.06 + accent[1] * glow * 0.45));
      pixels[offset + 2] = Math.round(255 * Math.min(1, 0.08 + accent[0] * glow * 0.45));
      pixels[offset + 3] = 255;
    }
  }
  return { height, pixels, width };
}

export function loadWallpaper(renderer: Renderer, monitorWidth: number, monitorHeight: number, accent: readonly [number, number, number], override: string | null = null): Wallpaper {
  const path = override ?? wallpaperPath();
  const image = path.length > 0 ? decodeImage(path, monitorWidth, monitorHeight) : null;
  const decoded = image ?? gradient(Math.ceil(monitorWidth / 4), Math.ceil(monitorHeight / 4), accent);
  const sharp = renderer.createTexture(decoded.width, decoded.height, { mips: true });
  renderer.uploadPixels(sharp, decoded.pixels);

  const blurWidth = Math.max(16, Math.ceil(decoded.width / 8));
  const blurHeight = Math.max(16, Math.ceil(decoded.height / 8));
  const first = renderer.createTexture(blurWidth, blurHeight, { renderTarget: true });
  const second = renderer.createTexture(blurWidth, blurHeight, { renderTarget: true });
  const level = Math.log2(decoded.width / blurWidth);
  const passes: [Texture, bigint, number, number, number][] = [
    [first, sharp.srv, 1.5 / blurWidth, 0, level],
    [second, first.srv, 0, 1.5 / blurHeight, 0],
    [first, second.srv, 1.5 / blurWidth, 0, 0],
    [second, first.srv, 0, 1.5 / blurHeight, 0],
  ];
  for (const [target, source, stepU, stepV, sourceLevel] of passes) {
    renderer.begin();
    renderer.blur(blurWidth, blurHeight, source, stepU, stepV, sourceLevel);
    renderer.execute({ height: blurHeight, rtv: target.rtv, width: blurWidth }, 0, null);
  }
  renderer.releaseTexture(first);
  const cropX = image === null ? 0 : (decoded.width - monitorWidth) / 2 / decoded.width;
  const cropY = image === null ? 0 : (decoded.height - monitorHeight) / 2 / decoded.height;
  return { blurred: second, path: image === null ? '' : path, sharp, uv: [cropX, cropY, 1 - cropX, 1 - cropY] };
}
