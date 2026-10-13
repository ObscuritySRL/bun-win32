// Painter: Direct2D 1.1 and DirectWrite on top of an existing Direct3D 11 device, through raw
// vtables. It draws anti-aliased shapes and text into any BGRA texture (an offscreen target or a
// swap-chain back buffer). Coordinates are DIPs: `begin` sets the context DPI per target.

import { FFIType, ptr } from 'bun:ffi';

import D2D1 from '@bun-win32/d2d1';
import Dwrite from '@bun-win32/dwrite';
import { DXGI_FORMAT_B8G8R8A8_UNORM, IID_IDXGIDEVICE, comRelease, vcall } from '@bun-win32/gpu';

import { callOut, check, guid, queryInterface } from './com';
import { D2D1Device, D2D1DeviceContext, D2D1Factory1, D2D1SolidColorBrush, DWriteFactory, DWriteFontCollection, DWriteTextFormat, DWriteTextLayout, IID } from './slots';

/** Straight (non-premultiplied) RGBA, 0–1. */
export type Color = readonly [number, number, number, number];

export interface TextOptions {
  align?: 'center' | 'end' | 'start';
  family: string;
  italic?: boolean;
  size: number;
  /** Top-aligned, word-wrapped paragraph instead of one vertically centred line. */
  wrap?: boolean;
  /** DWRITE_FONT_WEIGHT: 400 regular, 600 semibold. */
  weight?: number;
}

const alignments = { center: 2, end: 1, start: 0 } as const;
const antialiasGrayscale = 2;
const bitmapOptionsTargetCannotDraw = 0x3;
const drawTextNoSnap = 0x1;
const recreateTarget = 0x8899_000c;

export class Painter {
  readonly #brush: bigint;
  readonly #color = new Float32Array(new ArrayBuffer(16));
  readonly #context: bigint;
  readonly #device2d: bigint;
  readonly #factory: bigint;
  readonly #formats = new Map<string, bigint>();
  readonly #measures = new Map<string, [number, number]>();
  readonly #rectangle = new Float32Array(new ArrayBuffer(24));
  readonly #targets = new Map<bigint, bigint>();
  readonly #transform = new Float32Array(new ArrayBuffer(24));
  readonly #writeFactory: bigint;

  constructor(device: bigint) {
    this.#factory = this.#createFactory();
    const dxgiDevice = queryInterface(device, IID_IDXGIDEVICE);
    try {
      this.#device2d = callOut(this.#factory, D2D1Factory1.CreateDevice, [FFIType.u64], [dxgiDevice], 'ID2D1Factory1::CreateDevice');
    } finally {
      comRelease(dxgiDevice);
    }
    this.#context = callOut(this.#device2d, D2D1Device.CreateDeviceContext, [FFIType.u32], [0], 'CreateDeviceContext');
    vcall(this.#context, D2D1DeviceContext.SetTextAntialiasMode, [FFIType.u32], [antialiasGrayscale], FFIType.void);
    this.#color.set([1, 1, 1, 1]);
    this.#brush = callOut(this.#context, D2D1DeviceContext.CreateSolidColorBrush, [FFIType.ptr, FFIType.ptr], [ptr(this.#color), null], 'CreateSolidColorBrush');
    const slot = new BigUint64Array(new ArrayBuffer(8));
    check(Dwrite.DWriteCreateFactory(0, ptr(guid(IID.IDWriteFactory)), ptr(slot)), 'DWriteCreateFactory');
    this.#writeFactory = slot[0]!;
  }

  /** Start drawing into `texture` at `dpi` (96 × scale). */
  begin(texture: bigint, dpi: number): void {
    vcall(this.#context, D2D1DeviceContext.SetTarget, [FFIType.u64], [this.#target(texture)], FFIType.void);
    vcall(this.#context, D2D1DeviceContext.SetDpi, [FFIType.f32, FFIType.f32], [dpi, dpi], FFIType.void);
    vcall(this.#context, D2D1DeviceContext.BeginDraw, [], [], FFIType.void);
    this.setTransform(null);
  }

  clear(color: Color): void {
    this.#color.set(color);
    vcall(this.#context, D2D1DeviceContext.Clear, [FFIType.ptr], [ptr(this.#color)], FFIType.void);
  }

  dispose(): void {
    for (const bitmap of this.#targets.values()) comRelease(bitmap);
    for (const format of this.#formats.values()) comRelease(format);
    comRelease(this.#brush);
    comRelease(this.#context);
    comRelease(this.#device2d);
    comRelease(this.#writeFactory);
    comRelease(this.#factory);
  }

  end(): void {
    vcall(this.#context, D2D1DeviceContext.SetTarget, [FFIType.u64], [0n], FFIType.void);
    const result = vcall(this.#context, D2D1DeviceContext.EndDraw, [FFIType.ptr, FFIType.ptr], [null, null]);
    if (result >>> 0 === recreateTarget) throw new Error('Direct2D lost its device (D2DERR_RECREATE_TARGET)');
    check(result, 'EndDraw');
  }

  fillEllipse(centerX: number, centerY: number, radiusX: number, radiusY: number, color: Color): void {
    this.#use(color);
    this.#rectangle.set([centerX, centerY, radiusX, radiusY]);
    vcall(this.#context, D2D1DeviceContext.FillEllipse, [FFIType.ptr, FFIType.u64], [ptr(this.#rectangle), this.#brush], FFIType.void);
  }

  fillRectangle(left: number, top: number, width: number, height: number, color: Color): void {
    this.#use(color);
    this.#rectangle.set([left, top, left + width, top + height]);
    vcall(this.#context, D2D1DeviceContext.FillRectangle, [FFIType.ptr, FFIType.u64], [ptr(this.#rectangle), this.#brush], FFIType.void);
  }

  fillRoundedRectangle(left: number, top: number, width: number, height: number, radius: number, color: Color): void {
    this.#use(color);
    this.#rectangle.set([left, top, left + width, top + height, radius, radius]);
    vcall(this.#context, D2D1DeviceContext.FillRoundedRectangle, [FFIType.ptr, FFIType.u64], [ptr(this.#rectangle), this.#brush], FFIType.void);
  }

  /** Whether a font family is installed (Segoe UI Variable ships with Windows 11 only). */
  hasFamily(family: string): boolean {
    const collection = callOut(this.#writeFactory, DWriteFactory.GetSystemFontCollection, [], [], 'GetSystemFontCollection');
    try {
      const index = new Uint32Array(new ArrayBuffer(4));
      const exists = new Int32Array(new ArrayBuffer(4));
      vcall(collection, DWriteFontCollection.FindFamilyName, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [ptr(Buffer.from(`${family}\0`, 'utf16le')), ptr(index), ptr(exists)]);
      return exists[0] !== 0;
    } finally {
      comRelease(collection);
    }
  }

  line(fromX: number, fromY: number, toX: number, toY: number, width: number, color: Color): void {
    this.#use(color);
    this.#rectangle.set([fromX, fromY, toX, toY]);
    vcall(this.#context, D2D1DeviceContext.DrawLine, [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.f32, FFIType.u64], [this.#packedPoint(fromX, fromY), this.#packedPoint(toX, toY), this.#brush, width, 0n], FFIType.void);
  }

  /** Width and height of `text` laid out on one line (cached). */
  measure(text: string, options: TextOptions): [number, number] {
    const key = `${options.family}|${options.size}|${options.weight ?? 400}|${text}`;
    const cached = this.#measures.get(key);
    if (cached !== undefined) return cached;
    const wide = Buffer.from(text, 'utf16le');
    const layout = callOut(
      this.#writeFactory,
      DWriteFactory.CreateTextLayout,
      [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.f32, FFIType.f32],
      [ptr(wide), text.length, this.#format({ ...options, align: 'start' }), 100_000, 100_000],
      'CreateTextLayout',
    );
    const metrics = new Float32Array(new ArrayBuffer(36));
    check(vcall(layout, DWriteTextLayout.GetMetrics, [FFIType.ptr], [ptr(metrics)]), 'GetMetrics');
    comRelease(layout);
    const size: [number, number] = [metrics[3]!, metrics[4]!];
    if (this.#measures.size > 4_096) this.#measures.clear();
    this.#measures.set(key, size);
    return size;
  }

  popClip(): void {
    vcall(this.#context, D2D1DeviceContext.PopAxisAlignedClip, [], [], FFIType.void);
  }

  pushClip(left: number, top: number, width: number, height: number): void {
    this.#rectangle.set([left, top, left + width, top + height]);
    vcall(this.#context, D2D1DeviceContext.PushAxisAlignedClip, [FFIType.ptr, FFIType.u32], [ptr(this.#rectangle), 1], FFIType.void);
  }

  /** Forget a cached target (its texture is about to be released or resized). */
  releaseTarget(texture: bigint): void {
    const bitmap = this.#targets.get(texture);
    if (bitmap === undefined) return;
    comRelease(bitmap);
    this.#targets.delete(texture);
  }

  /** Translate-and-scale transform (DIPs), or identity for null. */
  setTransform(transform: { scale: number; x: number; y: number } | null): void {
    if (transform === null) this.#transform.set([1, 0, 0, 1, 0, 0]);
    else this.#transform.set([transform.scale, 0, 0, transform.scale, transform.x, transform.y]);
    vcall(this.#context, D2D1DeviceContext.SetTransform, [FFIType.ptr], [ptr(this.#transform)], FFIType.void);
  }

  strokeRoundedRectangle(left: number, top: number, width: number, height: number, radius: number, strokeWidth: number, color: Color): void {
    this.#use(color);
    this.#rectangle.set([left, top, left + width, top + height, radius, radius]);
    vcall(this.#context, D2D1DeviceContext.DrawRoundedRectangle, [FFIType.ptr, FFIType.u64, FFIType.f32, FFIType.u64], [ptr(this.#rectangle), this.#brush, strokeWidth, 0n], FFIType.void);
  }

  /** Draw `text` in the box (left, top, width, height), vertically centred, aligned per options. */
  text(text: string, options: TextOptions, left: number, top: number, width: number, height: number, color: Color): void {
    if (text.length === 0) return;
    this.#use(color);
    this.#rectangle.set([left, top, left + width, top + height]);
    const wide = Buffer.from(text, 'utf16le');
    vcall(
      this.#context,
      D2D1DeviceContext.DrawText,
      [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32],
      [ptr(wide), text.length, this.#format(options), ptr(this.#rectangle), this.#brush, drawTextNoSnap, 0],
      FFIType.void,
    );
  }

  #createFactory(): bigint {
    const slot = new BigUint64Array(new ArrayBuffer(8));
    check(D2D1.D2D1CreateFactory(0, ptr(guid(IID.ID2D1Factory1)), null, ptr(slot)), 'D2D1CreateFactory');
    return slot[0]!;
  }

  #format(options: TextOptions): bigint {
    const align = options.align ?? 'start';
    const wrap = options.wrap === true;
    const key = `${options.family}|${options.size}|${options.weight ?? 400}|${align}|${wrap}|${options.italic === true}`;
    const cached = this.#formats.get(key);
    if (cached !== undefined) return cached;
    const format = callOut(
      this.#writeFactory,
      DWriteFactory.CreateTextFormat,
      [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.f32, FFIType.ptr],
      [ptr(Buffer.from(`${options.family}\0`, 'utf16le')), 0n, options.weight ?? 400, options.italic === true ? 2 : 0, 5, options.size, ptr(Buffer.from('en-us\0', 'utf16le'))],
      `CreateTextFormat(${options.family})`,
    );
    vcall(format, DWriteTextFormat.SetTextAlignment, [FFIType.u32], [alignments[align]]);
    vcall(format, DWriteTextFormat.SetParagraphAlignment, [FFIType.u32], [wrap ? 0 : 2]);
    vcall(format, DWriteTextFormat.SetWordWrapping, [FFIType.u32], [wrap ? 0 : 1]);
    this.#formats.set(key, format);
    return format;
  }

  /** D2D1_POINT_2F passed by value: two floats packed into one 64-bit register. */
  #packedPoint(x: number, y: number): bigint {
    const view = new DataView(new ArrayBuffer(8));
    view.setFloat32(0, x, true);
    view.setFloat32(4, y, true);
    return view.getBigUint64(0, true);
  }

  #target(texture: bigint): bigint {
    const cached = this.#targets.get(texture);
    if (cached !== undefined) return cached;
    const surface = queryInterface(texture, IID.IDXGISurface);
    try {
      const properties = new DataView(new ArrayBuffer(32));
      properties.setUint32(0, DXGI_FORMAT_B8G8R8A8_UNORM, true);
      properties.setUint32(4, 1, true);
      properties.setFloat32(8, 96, true);
      properties.setFloat32(12, 96, true);
      properties.setUint32(16, bitmapOptionsTargetCannotDraw, true);
      const bitmap = callOut(this.#context, D2D1DeviceContext.CreateBitmapFromDxgiSurface, [FFIType.u64, FFIType.ptr], [surface, ptr(properties)], 'CreateBitmapFromDxgiSurface');
      this.#targets.set(texture, bitmap);
      return bitmap;
    } finally {
      comRelease(surface);
    }
  }

  #use(color: Color): void {
    this.#color.set(color);
    vcall(this.#brush, D2D1SolidColorBrush.SetColor, [FFIType.ptr], [ptr(this.#color)], FFIType.void);
  }
}
