// Application icons at full shell quality (IShellItemImageFactory — the same jumbo-icon path Explorer uses), packed
// into a small GPU atlas. One icon per executable, extracted once, drawn as text-style quads beside every label.

import { FFIType } from 'bun:ffi';

import Gdi32 from '@bun-win32/gdi32';

import { readMemory, Shell } from './native';
import type { Renderer, Texture } from './renderer';
import { comRelease, guidBytes, vcall } from './winrt';

const IID_IShellItemImageFactory = 'bcc18b79-ba16-442f-80c4-8a59c30c463b';
const IMAGE_FACTORY_GET_IMAGE = 3;
const SIIGBF_BIGGERSIZEOK = 0x1;
const SIIGBF_ICONONLY = 0x4;
const ICON_SIZE = 96;
const ATLAS_COLUMNS = 16;
const ATLAS_SIZE = ICON_SIZE * ATLAS_COLUMNS;

export interface IconEntry {
  uv: readonly [number, number, number, number];
}

export class IconAtlas {
  #entries = new Map<string, IconEntry | null>();
  #next = 0;
  #renderer: Renderer;
  readonly texture: Texture;

  constructor(renderer: Renderer) {
    this.#renderer = renderer;
    this.texture = renderer.createTexture(ATLAS_SIZE, ATLAS_SIZE, { mips: true });
  }

  get view(): bigint {
    return this.texture.srv;
  }

  /** The icon for an executable (cached; null when the shell has none). */
  get(executablePath: string): IconEntry | null {
    if (executablePath.length === 0) return null;
    const cached = this.#entries.get(executablePath);
    if (cached !== undefined) return cached;
    const entry = this.#extract(executablePath);
    this.#entries.set(executablePath, entry);
    return entry;
  }

  #extract(path: string): IconEntry | null {
    if (this.#next >= ATLAS_COLUMNS * ATLAS_COLUMNS) return null;
    const wide = Buffer.from(`${path}\0`, 'utf16le');
    const factoryOut = Buffer.alloc(8);
    if (Shell.SHCreateItemFromParsingName(wide.ptr, 0n, guidBytes(IID_IShellItemImageFactory).ptr, factoryOut.ptr) !== 0) return null;
    const factory = factoryOut.readBigUInt64LE(0);
    const bitmapOut = Buffer.alloc(8);
    const size = (BigInt(ICON_SIZE) << 32n) | BigInt(ICON_SIZE);
    const result = vcall(factory, IMAGE_FACTORY_GET_IMAGE, [FFIType.u64, FFIType.u32, FFIType.ptr], [size, SIIGBF_ICONONLY | SIIGBF_BIGGERSIZEOK, bitmapOut.ptr]);
    comRelease(factory);
    if (result !== 0) return null;
    const bitmap = bitmapOut.readBigUInt64LE(0);
    try {
      const header = Buffer.alloc(32); // BITMAP
      if (Gdi32.GetObjectW(bitmap, 32, header.ptr) === 0) return null;
      const width = header.readInt32LE(4);
      const height = header.readInt32LE(8);
      const stride = header.readInt32LE(12);
      const bitsPerPixel = header.readUInt16LE(18);
      const bits = header.readBigUInt64LE(24);
      if (bits === 0n || bitsPerPixel !== 32 || width <= 0 || height === 0) return null;
      const rows = Math.abs(height);
      const source = readMemory(bits, stride * rows);
      const pixels = Buffer.alloc(ICON_SIZE * ICON_SIZE * 4);
      const drawWidth = Math.min(width, ICON_SIZE);
      const drawHeight = Math.min(rows, ICON_SIZE);
      const offsetX = Math.floor((ICON_SIZE - drawWidth) / 2);
      const offsetY = Math.floor((ICON_SIZE - drawHeight) / 2);
      let anyAlpha = false;
      for (let row = 0; row < drawHeight; row += 1) {
        const sourceRow = height > 0 ? rows - 1 - row : row;
        for (let column = 0; column < drawWidth; column += 1) {
          const from = sourceRow * stride + column * 4;
          const to = ((row + offsetY) * ICON_SIZE + column + offsetX) * 4;
          pixels[to] = source[from]!;
          pixels[to + 1] = source[from + 1]!;
          pixels[to + 2] = source[from + 2]!;
          pixels[to + 3] = source[from + 3]!;
          if (source[from + 3]! !== 0) anyAlpha = true;
        }
      }
      if (!anyAlpha) for (let index = 3; index < pixels.length; index += 4) pixels[index] = 255;
      const slot = this.#next;
      this.#next += 1;
      const column = slot % ATLAS_COLUMNS;
      const row = Math.floor(slot / ATLAS_COLUMNS);
      this.#renderer.uploadRegion(this.texture, column * ICON_SIZE, row * ICON_SIZE, ICON_SIZE, ICON_SIZE, pixels);
      const inset = 0.5 / ATLAS_SIZE;
      return { uv: [column / ATLAS_COLUMNS + inset, row / ATLAS_COLUMNS + inset, (column + 1) / ATLAS_COLUMNS - inset, (row + 1) / ATLAS_COLUMNS - inset] };
    } finally {
      Gdi32.DeleteObject(bitmap);
    }
  }
}
