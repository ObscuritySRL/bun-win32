// Typography: DirectWrite shapes, Direct2D rasterises straight into a GPU texture atlas on the same D3D11 device (a
// DXGI-surface render target), so text never touches the CPU. Colour emoji in window titles render in colour; search
// matches are re-weighted and re-coloured per character range inside one layout. Strings are cached by content and
// style; the atlas is a shelf packer that resets wholesale when full (everything live is re-requested next frame).

import { FFIType } from 'bun:ffi';

import D2D1 from '@bun-win32/d2d1';
import Dwrite from '@bun-win32/dwrite';

import type { Renderer, Texture } from './renderer';
import { comRelease, guidBytes, hex, queryInterface, vcall } from './winrt';

const ATLAS_SIZE = 4096;
const EMPTY_ENTRY: TextEntry = { height: 0, inkHeight: 0, inkWidth: 0, padding: 0, uv: [0, 0, 0, 0], width: 0 };
const PADDING = 4;

const IID_ID2D1Factory = '06152247-6f50-465a-9245-118bfd3b6007';
const IID_IDWriteFactory = 'b859ee5a-d838-4b5b-a2e8-1adc7d93db48';
const IID_IDXGISurface = 'cafcb56c-6ac3-4889-bf47-9e23bbd260ec';

const FACTORY_CREATE_DXGI_SURFACE_RENDER_TARGET = 15;
const RENDER_TARGET_BEGIN_DRAW = 48;
const RENDER_TARGET_CLEAR = 47;
const RENDER_TARGET_CREATE_SOLID_COLOR_BRUSH = 8;
const RENDER_TARGET_DRAW_TEXT_LAYOUT = 28;
const RENDER_TARGET_END_DRAW = 49;
const RENDER_TARGET_POP_AXIS_ALIGNED_CLIP = 46;
const RENDER_TARGET_PUSH_AXIS_ALIGNED_CLIP = 45;
const RENDER_TARGET_SET_DPI = 51;
const RENDER_TARGET_SET_TEXT_ANTIALIAS_MODE = 34;
const TEXT_FORMAT_SET_LINE_SPACING = 10;
const TEXT_FORMAT_SET_TRIMMING = 9;
const TEXT_FORMAT_SET_WORD_WRAPPING = 5;
const TEXT_LAYOUT_GET_METRICS = 60;
const TEXT_LAYOUT_SET_DRAWING_EFFECT = 38;
const TEXT_LAYOUT_SET_FONT_WEIGHT = 32;
const WRITE_FACTORY_CREATE_ELLIPSIS_TRIMMING_SIGN = 20;
const WRITE_FACTORY_CREATE_TEXT_FORMAT = 15;
const WRITE_FACTORY_CREATE_TEXT_LAYOUT = 18;

const D2D1_ANTIALIAS_MODE_ALIASED = 1;
const D2D1_DRAW_TEXT_OPTIONS_ENABLE_COLOR_FONT = 4;
const D2D1_TEXT_ANTIALIAS_MODE_GRAYSCALE = 2;

export type Color = readonly [number, number, number, number];

export interface TextStyle {
  color: Color;
  family: string;
  italic?: boolean;
  /** Lines to allow before wrapping stops (default 1 — single line, ellipsis-trimmed). */
  lines?: number;
  lineHeight?: number;
  size: number;
  weight: number;
}

/** Character ranges [start, length] drawn in `color` at `weight`. */
export interface TextEmphasis {
  color: Color;
  ranges: readonly (readonly [number, number])[];
  weight: number;
}

/** Sizes are in DIPs (1/96 inch); the atlas holds the text rasterised at the monitor's scale, so drawing an entry at
 *  DIP size × scale is pixel-exact. */
export interface TextEntry {
  /** Quad size (the atlas region, padding included). */
  height: number;
  /** Ink box of the laid-out text inside the quad. */
  inkHeight: number;
  inkWidth: number;
  padding: number;
  uv: readonly [number, number, number, number];
  width: number;
}

interface PendingDraw {
  layout: bigint;
  x: number;
  y: number;
  width: number;
  height: number;
  color: Color;
}

export class TextAtlas {
  #brushes = new Map<string, bigint>();
  #cache = new Map<string, TextEntry>();
  #cursorX = 0;
  #cursorY = 0;
  #ellipsis = new Map<bigint, bigint>();
  #formats = new Map<string, bigint>();
  #pending: PendingDraw[] = [];
  #renderTarget = 0n;
  #rowHeight = 0;
  #writeFactory = 0n;
  #cleared = true;
  #evictPending = false;
  #scale = 1;
  readonly texture: Texture;
  generation = 0;

  constructor(renderer: Renderer) {
    this.texture = renderer.createTexture(ATLAS_SIZE, ATLAS_SIZE, { renderTarget: true });
    const factoryOut = Buffer.alloc(8);
    const factoryResult = D2D1.D2D1CreateFactory(0, guidBytes(IID_ID2D1Factory).ptr, null, factoryOut.ptr);
    if (factoryResult !== 0) throw new Error(`D2D1CreateFactory failed: ${hex(factoryResult)}`);
    const factory = factoryOut.readBigUInt64LE(0);
    const surface = queryInterface(this.texture.texture, IID_IDXGISurface);
    const properties = Buffer.alloc(28); // D2D1_RENDER_TARGET_PROPERTIES
    properties.writeUInt32LE(87, 4); // DXGI_FORMAT_B8G8R8A8_UNORM
    properties.writeUInt32LE(1, 8); // D2D1_ALPHA_MODE_PREMULTIPLIED
    properties.writeFloatLE(96, 12);
    properties.writeFloatLE(96, 16);
    const targetOut = Buffer.alloc(8);
    const targetResult = vcall(factory, FACTORY_CREATE_DXGI_SURFACE_RENDER_TARGET, [FFIType.u64, FFIType.ptr, FFIType.ptr], [surface, properties.ptr, targetOut.ptr]);
    comRelease(surface);
    comRelease(factory);
    if (targetResult !== 0) throw new Error(`CreateDxgiSurfaceRenderTarget failed: ${hex(targetResult)}`);
    this.#renderTarget = targetOut.readBigUInt64LE(0);
    vcall(this.#renderTarget, RENDER_TARGET_SET_TEXT_ANTIALIAS_MODE, [FFIType.u32], [D2D1_TEXT_ANTIALIAS_MODE_GRAYSCALE], FFIType.void);
    const writeOut = Buffer.alloc(8);
    const writeResult = Dwrite.DWriteCreateFactory(0, guidBytes(IID_IDWriteFactory).ptr, writeOut.ptr);
    if (writeResult !== 0) throw new Error(`DWriteCreateFactory failed: ${hex(writeResult)}`);
    this.#writeFactory = writeOut.readBigUInt64LE(0);
  }

  get view(): bigint {
    return this.texture.srv;
  }

  /** Pixels per DIP for everything rasterised from now on (the monitor's DPI / 96). Changing it starts a fresh atlas. */
  get scale(): number {
    return this.#scale;
  }

  setScale(scale: number): void {
    if (scale === this.#scale) return;
    this.reset();
    this.#scale = scale;
    vcall(this.#renderTarget, RENDER_TARGET_SET_DPI, [FFIType.f32, FFIType.f32], [96 * scale, 96 * scale], FFIType.void);
  }

  #brush(color: Color): bigint {
    const key = color.join(',');
    let brush = this.#brushes.get(key);
    if (brush === undefined) {
      const value = new Float32Array(color);
      const out = Buffer.alloc(8);
      const result = vcall(this.#renderTarget, RENDER_TARGET_CREATE_SOLID_COLOR_BRUSH, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [value.ptr, null, out.ptr]);
      if (result !== 0) throw new Error(`CreateSolidColorBrush failed: ${hex(result)}`);
      brush = out.readBigUInt64LE(0);
      this.#brushes.set(key, brush);
    }
    return brush;
  }

  #format(style: TextStyle): bigint {
    const lines = style.lines ?? 1;
    const key = `${style.family}|${style.size}|${style.weight}|${style.italic === true}|${lines}|${style.lineHeight ?? 0}`;
    let format = this.#formats.get(key);
    if (format !== undefined) return format;
    const family = Buffer.from(`${style.family}\0`, 'utf16le');
    const locale = Buffer.from('en-us\0', 'utf16le');
    const out = Buffer.alloc(8);
    const result = vcall(
      this.#writeFactory,
      WRITE_FACTORY_CREATE_TEXT_FORMAT,
      [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.f32, FFIType.ptr, FFIType.ptr],
      [family.ptr, 0n, style.weight, style.italic === true ? 2 : 0, 5, style.size, locale.ptr, out.ptr],
    );
    if (result !== 0) throw new Error(`CreateTextFormat(${style.family}) failed: ${hex(result)}`);
    format = out.readBigUInt64LE(0);
    if (lines === 1) vcall(format, TEXT_FORMAT_SET_WORD_WRAPPING, [FFIType.u32], [1], FFIType.i32);
    const signOut = Buffer.alloc(8);
    if (vcall(this.#writeFactory, WRITE_FACTORY_CREATE_ELLIPSIS_TRIMMING_SIGN, [FFIType.u64, FFIType.ptr], [format, signOut.ptr]) === 0) {
      const sign = signOut.readBigUInt64LE(0);
      const trimming = Buffer.alloc(12); // DWRITE_TRIMMING { granularity, delimiter, delimiterCount }
      trimming.writeUInt32LE(lines === 1 ? 1 : 2, 0);
      vcall(format, TEXT_FORMAT_SET_TRIMMING, [FFIType.ptr, FFIType.u64], [trimming.ptr, sign]);
      this.#ellipsis.set(format, sign);
    }
    if (style.lineHeight !== undefined) vcall(format, TEXT_FORMAT_SET_LINE_SPACING, [FFIType.u32, FFIType.f32, FFIType.f32], [1, style.lineHeight, style.lineHeight * 0.8]);
    this.#formats.set(key, format);
    return format;
  }

  /** Lay out (and queue for rasterisation) `text`; returns its atlas entry. Cached by content + style + emphasis. */
  get(text: string, style: TextStyle, maxWidth = 4000, emphasis?: TextEmphasis, maxHeight = 2000): TextEntry {
    const key = `${style.family}|${style.size}|${style.weight}|${style.italic === true}|${style.lines ?? 1}|${style.color.join(',')}|${maxWidth}|${maxHeight}|${emphasis === undefined ? '' : `${emphasis.color.join(',')}:${emphasis.weight}:${emphasis.ranges.flat().join(',')}`}|${text}`;
    const cached = this.#cache.get(key);
    if (cached !== undefined) return cached;
    const format = this.#format(style);
    const source = Buffer.from(text, 'utf16le');
    const layoutOut = Buffer.alloc(8);
    const layoutResult = vcall(
      this.#writeFactory,
      WRITE_FACTORY_CREATE_TEXT_LAYOUT,
      [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.f32, FFIType.f32, FFIType.ptr],
      [source.length === 0 ? null : source.ptr, text.length, format, maxWidth, maxHeight, layoutOut.ptr],
    );
    if (layoutResult !== 0) throw new Error(`CreateTextLayout failed: ${hex(layoutResult)}`);
    const layout = layoutOut.readBigUInt64LE(0);
    if (emphasis !== undefined) {
      const brush = this.#brush(emphasis.color);
      for (const [start, length] of emphasis.ranges) {
        const range = (BigInt(length >>> 0) << 32n) | BigInt(start >>> 0);
        vcall(layout, TEXT_LAYOUT_SET_DRAWING_EFFECT, [FFIType.u64, FFIType.u64], [brush, range]);
        vcall(layout, TEXT_LAYOUT_SET_FONT_WEIGHT, [FFIType.u32, FFIType.u64], [emphasis.weight, range]);
      }
    }
    const metrics = new Float32Array(9);
    vcall(layout, TEXT_LAYOUT_GET_METRICS, [FFIType.ptr], [metrics.ptr]);
    const inkWidth = Math.ceil(Math.min(metrics[3]!, maxWidth));
    const inkHeight = Math.ceil(metrics[4]!);
    const pixelWidth = Math.ceil((inkWidth + PADDING * 2) * this.#scale);
    const pixelHeight = Math.ceil((inkHeight + PADDING * 2) * this.#scale);
    const slot = this.#allocate(pixelWidth, pixelHeight);
    if (slot === null) {
      // Full (or too large to ever fit): draw nothing this frame and start a fresh atlas at the next frame boundary, so
      // entries already recorded this frame keep pointing at the pixels they expect.
      comRelease(layout);
      if (pixelWidth <= ATLAS_SIZE && pixelHeight <= ATLAS_SIZE) this.#evictPending = true;
      return EMPTY_ENTRY;
    }
    this.#pending.push({ color: style.color, height: pixelHeight, layout, width: pixelWidth, x: slot.x, y: slot.y });
    const entry: TextEntry = {
      height: pixelHeight / this.#scale,
      inkHeight,
      inkWidth,
      padding: PADDING,
      uv: [slot.x / ATLAS_SIZE, slot.y / ATLAS_SIZE, (slot.x + pixelWidth) / ATLAS_SIZE, (slot.y + pixelHeight) / ATLAS_SIZE],
      width: pixelWidth / this.#scale,
    };
    this.#cache.set(key, entry);
    return entry;
  }

  #allocate(width: number, height: number): { x: number; y: number } | null {
    if (width > ATLAS_SIZE || height > ATLAS_SIZE) return null;
    if (this.#cursorX + width > ATLAS_SIZE) {
      this.#cursorX = 0;
      this.#cursorY += this.#rowHeight + 1;
      this.#rowHeight = 0;
    }
    if (this.#cursorY + height > ATLAS_SIZE) return null;
    const slot = { x: this.#cursorX, y: this.#cursorY };
    this.#cursorX += width + 1;
    this.#rowHeight = Math.max(this.#rowHeight, height);
    return slot;
  }

  /** Call before a frame requests any text: performs an eviction a previous frame asked for. */
  beginFrame(): void {
    if (!this.#evictPending) return;
    this.#evictPending = false;
    this.reset();
  }

  /** Forget every entry; the next flush clears the whole atlas. */
  reset(): void {
    for (const pending of this.#pending) comRelease(pending.layout);
    this.#pending.length = 0;
    this.#cache.clear();
    this.#cursorX = 0;
    this.#cursorY = 0;
    this.#rowHeight = 0;
    this.#cleared = false;
    this.generation += 1;
  }

  /** Rasterise everything queued since the last flush (one BeginDraw/EndDraw). Call before the frame's draws execute. */
  flush(): void {
    if (this.#pending.length === 0 && this.#cleared) return;
    const target = this.#renderTarget;
    vcall(target, RENDER_TARGET_BEGIN_DRAW, [], [], FFIType.void);
    const transparent = new Float32Array(4);
    if (!this.#cleared) {
      vcall(target, RENDER_TARGET_CLEAR, [FFIType.ptr], [transparent.ptr], FFIType.void);
      this.#cleared = true;
    }
    const clip = new Float32Array(4);
    const originStorage = new ArrayBuffer(8);
    const origin = new Float32Array(originStorage);
    const originBits = new BigUint64Array(originStorage);
    // The render target's DPI is 96 × scale, so Direct2D coordinates are DIPs: divide the atlas pixel slots back out.
    const scale = this.#scale;
    for (const pending of this.#pending) {
      clip[0] = pending.x / scale;
      clip[1] = pending.y / scale;
      clip[2] = (pending.x + pending.width) / scale;
      clip[3] = (pending.y + pending.height) / scale;
      vcall(target, RENDER_TARGET_PUSH_AXIS_ALIGNED_CLIP, [FFIType.ptr, FFIType.u32], [clip.ptr, D2D1_ANTIALIAS_MODE_ALIASED], FFIType.void);
      vcall(target, RENDER_TARGET_CLEAR, [FFIType.ptr], [transparent.ptr], FFIType.void);
      origin[0] = pending.x / scale + PADDING;
      origin[1] = pending.y / scale + PADDING;
      vcall(target, RENDER_TARGET_DRAW_TEXT_LAYOUT, [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.u32], [originBits[0]!, pending.layout, this.#brush(pending.color), D2D1_DRAW_TEXT_OPTIONS_ENABLE_COLOR_FONT], FFIType.void);
      vcall(target, RENDER_TARGET_POP_AXIS_ALIGNED_CLIP, [], [], FFIType.void);
      comRelease(pending.layout);
    }
    this.#pending.length = 0;
    const tagStorage = new ArrayBuffer(16);
    const result = vcall(target, RENDER_TARGET_END_DRAW, [FFIType.ptr, FFIType.ptr], [new BigUint64Array(tagStorage, 0, 1).ptr, new BigUint64Array(tagStorage, 8, 1).ptr]);
    if (result !== 0) {
      console.error(`[iris] Direct2D EndDraw failed ${hex(result)} — resetting the text atlas`);
      this.reset();
    }
  }

  /** Text width/height without rasterising (the caret, chip sizes). */
  measure(text: string, style: TextStyle): { width: number; height: number } {
    const entry = this.get(text, style);
    return { height: entry.inkHeight, width: entry.inkWidth };
  }
}
