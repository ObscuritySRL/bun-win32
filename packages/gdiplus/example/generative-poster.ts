/**
 * Generative Art Poster
 *
 * Procedurally generates an 1200x900 PNG poster from scratch using GDI+ flat
 * APIs only. The composition layers a vertical sky gradient, a circular sun
 * with radial-style highlights, layered mountain silhouettes, scattered stars,
 * and an antialiased typographic title rendered with a custom font. The final
 * image is saved as `generative-poster.png` in the current working directory.
 *
 * Each pass demonstrates a different GDI+ subsystem: brushes for fills,
 * gradient brushes for the sky, path objects for the mountains, font + string
 * format for typography, and the encoder CLSID lookup for PNG encoding.
 *
 * APIs demonstrated:
 *   - GdiplusStartup / GdiplusShutdown   (initialize and tear down GDI+)
 *   - GdipCreateBitmapFromScan0          (allocate a 32-bit ARGB bitmap)
 *   - GdipGetImageGraphicsContext        (obtain a Graphics for a bitmap)
 *   - GdipSetSmoothingMode               (enable antialiasing for shapes)
 *   - GdipSetTextRenderingHint           (enable antialiased text)
 *   - GdipCreateSolidFill                (solid color brush)
 *   - GdipCreateLineBrushFromRectWithAngle (linear gradient brush)
 *   - GdipSetLineColors                  (override gradient endpoint colors)
 *   - GdipCreatePath / GdipAddPathLine /
 *     GdipAddPathPolygon / GdipClosePathFigure (build mountain silhouettes)
 *   - GdipFillPath / GdipFillRectangle / GdipFillEllipse (rasterize geometry)
 *   - GdipCreateFontFamilyFromName / GdipCreateFont (typography)
 *   - GdipCreateStringFormat             (text alignment)
 *   - GdipDrawString                     (render the title)
 *   - GdipGetImageEncoders / GdipGetImageEncodersSize (locate PNG encoder)
 *   - GdipSaveImageToFile                (PNG encode + write to disk)
 *   - GdipDispose* / GdipDeleteGraphics  (release native handles)
 *
 * Run: bun run example/generative-poster.ts
 */
import { read, type Pointer } from 'bun:ffi';
import Gdiplus, { FillMode, FontStyle, PixelFormat32bppARGB, SmoothingMode, Status, StringAlignment, TextRenderingHint, Unit } from '../index';

Gdiplus.Preload();

const WIDTH = 1200;
const HEIGHT = 900;

const argb = (a: number, r: number, g: number, b: number): number => (((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)) >>> 0;

function check(status: number, where: string): void {
  if (status !== Status.Ok) {
    throw new Error(`${where} failed: ${Status[status]} (${status})`);
  }
}

function readWcharPointer(buffer: Buffer, pointerOffset: number, maxChars = 256): string {
  const pointer = read.ptr(buffer.ptr!, pointerOffset) as Pointer;
  if (!pointer) return '';
  let out = '';
  for (let i = 0; i < maxChars; i++) {
    const code = read.u16(pointer, i * 2);
    if (code === 0) break;
    out += String.fromCharCode(code);
  }
  return out;
}

const tokenBuffer = Buffer.alloc(8);
const startupInput = Buffer.alloc(16); // GdiplusVersion, DebugEventCallback (8B aligned)
startupInput.writeUInt32LE(1, 0); // GdiplusVersion = 1
check(Gdiplus.GdiplusStartup(tokenBuffer.ptr, startupInput.ptr, null), 'GdiplusStartup');
const startupToken = tokenBuffer.readBigUInt64LE(0);

try {
  // Locate the PNG encoder CLSID by enumerating installed image encoders.
  const numEncodersBuffer = Buffer.alloc(4);
  const totalBytesBuffer = Buffer.alloc(4);
  check(Gdiplus.GdipGetImageEncodersSize(numEncodersBuffer.ptr, totalBytesBuffer.ptr), 'GdipGetImageEncodersSize');
  const encoderCount = numEncodersBuffer.readUInt32LE(0);
  const encoderListBuffer = Buffer.alloc(totalBytesBuffer.readUInt32LE(0));
  check(Gdiplus.GdipGetImageEncoders(encoderCount, totalBytesBuffer.readUInt32LE(0), encoderListBuffer.ptr), 'GdipGetImageEncoders');

  // ImageCodecInfo (x64): 16 (CLSID) + 16 (FormatID) + 5 wchar* (40) + 4 dwords (16) + 2 byte* (16) = 104 bytes.
  // We need the CLSID of the entry whose MIME type is "image/png".
  const ENTRY_SIZE = 104;
  const MIME_PTR_OFFSET = 16 + 16 + 4 * 8;
  let pngClsid: Buffer | null = null;
  for (let i = 0; i < encoderCount; i++) {
    const entryOffset = i * ENTRY_SIZE;
    const mime = readWcharPointer(encoderListBuffer, entryOffset + MIME_PTR_OFFSET, 32);
    if (mime === 'image/png') {
      // Copy the CLSID bytes into a fresh buffer so it has a stable .ptr to pass on.
      pngClsid = Buffer.from(encoderListBuffer.subarray(entryOffset, entryOffset + 16));
      break;
    }
  }
  if (!pngClsid) throw new Error('PNG encoder not found in image encoder list');

  // Allocate a 32bpp ARGB bitmap with GDI+ owning the pixel buffer.
  const bitmapHandleBuffer = Buffer.alloc(8);
  check(Gdiplus.GdipCreateBitmapFromScan0(WIDTH, HEIGHT, 0, PixelFormat32bppARGB, null, bitmapHandleBuffer.ptr), 'GdipCreateBitmapFromScan0');
  const bitmap = bitmapHandleBuffer.readBigUInt64LE(0);

  // Build a Graphics context bound to the bitmap.
  const graphicsHandleBuffer = Buffer.alloc(8);
  check(Gdiplus.GdipGetImageGraphicsContext(bitmap, graphicsHandleBuffer.ptr), 'GdipGetImageGraphicsContext');
  const graphics = graphicsHandleBuffer.readBigUInt64LE(0);

  check(Gdiplus.GdipSetSmoothingMode(graphics, SmoothingMode.SmoothingModeAntiAlias), 'GdipSetSmoothingMode');
  check(Gdiplus.GdipSetTextRenderingHint(graphics, TextRenderingHint.TextRenderingHintAntiAliasGridFit), 'GdipSetTextRenderingHint');

  // ── Layer 1: sky gradient (top deep-violet → mid orange → bottom warm yellow). ──
  // GDI+ linear brushes interpolate between two colors; layer two of them.
  const skyRect = Buffer.alloc(16);
  skyRect.writeFloatLE(0, 0);
  skyRect.writeFloatLE(0, 4);
  skyRect.writeFloatLE(WIDTH, 8);
  skyRect.writeFloatLE(HEIGHT, 12);

  const skyBrushBuffer = Buffer.alloc(8);
  check(Gdiplus.GdipCreateLineBrushFromRectWithAngle(skyRect.ptr, argb(255, 0x1a, 0x0a, 0x40), argb(255, 0xff, 0xc8, 0x6e), 90.0, 1, 0, skyBrushBuffer.ptr), 'GdipCreateLineBrushFromRectWithAngle');
  const skyBrush = skyBrushBuffer.readBigUInt64LE(0);
  check(Gdiplus.GdipFillRectangle(graphics, skyBrush, 0, 0, WIDTH, HEIGHT), 'GdipFillRectangle (sky)');

  // ── Layer 2: sun disc with concentric halo discs (largest first, fading inward). ──
  const sunCenterX = WIDTH * 0.72;
  const sunCenterY = HEIGHT * 0.36;
  const haloLayers = [
    { radius: 230, color: argb(60, 0xff, 0xf2, 0xa6) },
    { radius: 180, color: argb(90, 0xff, 0xe0, 0x80) },
    { radius: 140, color: argb(140, 0xff, 0xd1, 0x5a) },
    { radius: 100, color: argb(220, 0xff, 0xb9, 0x35) },
    { radius: 64, color: argb(255, 0xff, 0xee, 0xb0) },
  ];
  for (const layer of haloLayers) {
    const brushBuffer = Buffer.alloc(8);
    check(Gdiplus.GdipCreateSolidFill(layer.color, brushBuffer.ptr), 'GdipCreateSolidFill (halo)');
    const brush = brushBuffer.readBigUInt64LE(0);
    check(Gdiplus.GdipFillEllipse(graphics, brush, sunCenterX - layer.radius, sunCenterY - layer.radius, layer.radius * 2, layer.radius * 2), 'GdipFillEllipse (halo)');
    Gdiplus.GdipDeleteBrush(brush);
  }

  // ── Layer 3: scattered stars (small ellipses with deterministic LCG). ──
  let lcgState = 1337;
  const lcgNext = (): number => {
    lcgState = (lcgState * 1103515245 + 12345) & 0x7fffffff;
    return lcgState;
  };
  const starBrushBuffer = Buffer.alloc(8);
  check(Gdiplus.GdipCreateSolidFill(argb(220, 0xff, 0xff, 0xff), starBrushBuffer.ptr), 'GdipCreateSolidFill (star)');
  const starBrush = starBrushBuffer.readBigUInt64LE(0);
  for (let i = 0; i < 120; i++) {
    const x = (lcgNext() / 0x7fffffff) * WIDTH;
    const y = (lcgNext() / 0x7fffffff) * HEIGHT * 0.55; // keep stars in the upper half
    const size = 1 + (lcgNext() % 30) / 12;
    Gdiplus.GdipFillEllipse(graphics, starBrush, x, y, size, size);
  }
  Gdiplus.GdipDeleteBrush(starBrush);

  // ── Layer 4: three mountain ranges (back → front, getting darker). ──
  const mountainSpecs = [
    { baseY: HEIGHT * 0.65, peakHeight: 220, color: argb(255, 0x40, 0x28, 0x70), seed: 7 },
    { baseY: HEIGHT * 0.74, peakHeight: 180, color: argb(255, 0x28, 0x18, 0x52), seed: 41 },
    { baseY: HEIGHT * 0.82, peakHeight: 130, color: argb(255, 0x15, 0x0b, 0x32), seed: 113 },
  ];
  for (const mountain of mountainSpecs) {
    let prng = mountain.seed;
    const next = (): number => {
      prng = (prng * 48271) & 0x7fffffff;
      return prng;
    };

    const pathBuffer = Buffer.alloc(8);
    check(Gdiplus.GdipCreatePath(FillMode.FillModeAlternate, pathBuffer.ptr), 'GdipCreatePath');
    const path = pathBuffer.readBigUInt64LE(0);

    // Build a jagged ridgeline as a sequence of points then close into a polygon.
    const segments = 24;
    const points: number[] = [];
    points.push(0, HEIGHT);
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * WIDTH;
      const jitter = (next() / 0x7fffffff) * mountain.peakHeight;
      const y = mountain.baseY - jitter * 0.7;
      points.push(x, y);
    }
    points.push(WIDTH, HEIGHT);

    const polyBuffer = Buffer.alloc(points.length * 4);
    for (let i = 0; i < points.length; i++) polyBuffer.writeFloatLE(points[i], i * 4);
    check(Gdiplus.GdipAddPathPolygon(path, polyBuffer.ptr, points.length / 2), 'GdipAddPathPolygon (mountain)');
    check(Gdiplus.GdipClosePathFigure(path), 'GdipClosePathFigure');

    const fillBuffer = Buffer.alloc(8);
    check(Gdiplus.GdipCreateSolidFill(mountain.color, fillBuffer.ptr), 'GdipCreateSolidFill (mountain)');
    const fillBrush = fillBuffer.readBigUInt64LE(0);
    check(Gdiplus.GdipFillPath(graphics, fillBrush, path), 'GdipFillPath');
    Gdiplus.GdipDeleteBrush(fillBrush);
    Gdiplus.GdipDeletePath(path);
  }

  // ── Layer 5: typographic title. ──
  const fontFamilyBuffer = Buffer.alloc(8);
  const fontName = Buffer.from('Segoe UI\0', 'utf16le');
  check(Gdiplus.GdipCreateFontFamilyFromName(fontName.ptr, 0n, fontFamilyBuffer.ptr), 'GdipCreateFontFamilyFromName');
  const fontFamily = fontFamilyBuffer.readBigUInt64LE(0);

  const fontBuffer = Buffer.alloc(8);
  check(Gdiplus.GdipCreateFont(fontFamily, 72.0, FontStyle.FontStyleBoldItalic, Unit.UnitPixel, fontBuffer.ptr), 'GdipCreateFont');
  const font = fontBuffer.readBigUInt64LE(0);

  const stringFormatBuffer = Buffer.alloc(8);
  check(Gdiplus.GdipCreateStringFormat(0, 0, stringFormatBuffer.ptr), 'GdipCreateStringFormat');
  const stringFormat = stringFormatBuffer.readBigUInt64LE(0);
  Gdiplus.GdipSetStringFormatAlign(stringFormat, StringAlignment.StringAlignmentCenter);
  Gdiplus.GdipSetStringFormatLineAlign(stringFormat, StringAlignment.StringAlignmentNear);

  const textBuffer = Buffer.alloc(8);
  check(Gdiplus.GdipCreateSolidFill(argb(255, 0xff, 0xff, 0xff), textBuffer.ptr), 'GdipCreateSolidFill (title)');
  const textBrush = textBuffer.readBigUInt64LE(0);

  const title = Buffer.from('// bun-win32 //\0', 'utf16le');
  const layoutRect = Buffer.alloc(16);
  layoutRect.writeFloatLE(0, 0);
  layoutRect.writeFloatLE(HEIGHT * 0.82, 4);
  layoutRect.writeFloatLE(WIDTH, 8);
  layoutRect.writeFloatLE(120, 12);

  // Soft shadow: render the title once in semi-transparent black, offset down/right.
  const shadowBrushBuf = Buffer.alloc(8);
  Gdiplus.GdipCreateSolidFill(argb(140, 0x00, 0x00, 0x00), shadowBrushBuf.ptr);
  const shadowBrush = shadowBrushBuf.readBigUInt64LE(0);
  const shadowRect = Buffer.alloc(16);
  shadowRect.writeFloatLE(4, 0);
  shadowRect.writeFloatLE(HEIGHT * 0.82 + 4, 4);
  shadowRect.writeFloatLE(WIDTH, 8);
  shadowRect.writeFloatLE(120, 12);
  Gdiplus.GdipDrawString(graphics, title.ptr, -1, font, shadowRect.ptr, stringFormat, shadowBrush);
  Gdiplus.GdipDeleteBrush(shadowBrush);

  check(Gdiplus.GdipDrawString(graphics, title.ptr, -1, font, layoutRect.ptr, stringFormat, textBrush), 'GdipDrawString');

  // ── Save the bitmap as a PNG file in the working directory. ──
  const filename = Buffer.from('generative-poster.png\0', 'utf16le');
  check(Gdiplus.GdipSaveImageToFile(bitmap, filename.ptr, pngClsid.ptr, null), 'GdipSaveImageToFile');

  // Clean up native handles in reverse-creation order.
  Gdiplus.GdipDeleteBrush(textBrush);
  Gdiplus.GdipDeleteStringFormat(stringFormat);
  Gdiplus.GdipDeleteFont(font);
  Gdiplus.GdipDeleteFontFamily(fontFamily);
  Gdiplus.GdipDeleteBrush(skyBrush);
  Gdiplus.GdipDeleteGraphics(graphics);
  Gdiplus.GdipDisposeImage(bitmap);

  console.log(`\n  \x1b[92m✓\x1b[0m wrote ${WIDTH}x${HEIGHT} PNG: \x1b[96mgenerative-poster.png\x1b[0m`);
} finally {
  Gdiplus.GdiplusShutdown(startupToken);
}
