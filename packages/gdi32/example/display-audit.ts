/**
 * Display and Graphics Device Capabilities Audit
 *
 * Queries the Windows display device context and system metrics to produce a
 * comprehensive report of monitor resolution, physical dimensions, color depth,
 * DPI, raster capabilities, and system font information.
 *
 * Console-only -- no window is created. Uses:
 *   - GDI32: CreateDCW, GetDeviceCaps, GetStockObject, GetObjectW, DeleteDC
 *   - User32: GetSystemMetrics (monitor count, virtual desktop size)
 *
 * GetDeviceCaps index constants follow the Windows SDK (wingdi.h). Stock object
 * indices follow GetStockObject documentation.
 *
 * Run with: bun run example/display-audit.ts
 */

import Gdi32 from '../index';
import User32, { SystemMetric } from '@bun-win32/user32';

// GetDeviceCaps index constants (wingdi.h)
const DRIVERVERSION = 0;
const TECHNOLOGY = 2;
const HORZSIZE = 4; // physical width in mm
const VERTSIZE = 6; // physical height in mm
const HORZRES = 8; // pixel width
const VERTRES = 10; // pixel height
const BITSPIXEL = 12; // bits per pixel per plane
const PLANES = 14; // number of color planes
const NUMBRUSHES = 16;
const NUMPENS = 18;
const NUMFONTS = 22;
const NUMCOLORS = 24;
const ASPECTX = 40;
const ASPECTY = 42;
const ASPECTXY = 44;
const LOGPIXELSX = 88; // horizontal DPI
const LOGPIXELSY = 90; // vertical DPI
const SIZEPALETTE = 104;
const NUMRESERVED = 106;
const COLORRES = 108;
const RASTERCAPS = 38;

// Technology type values returned by GetDeviceCaps(TECHNOLOGY)
const TECHNOLOGY_NAMES: Record<number, string> = {
  0: 'Vector plotter',
  1: 'Raster display',
  2: 'Raster printer',
  3: 'Raster camera',
  4: 'Character stream',
  5: 'Metafile (GDI)',
  6: 'Display file',
};

// Raster capability bit flags
const RASTER_CAP_FLAGS: [number, string][] = [
  [0x0001, 'RC_BITBLT (bit-block transfer)'],
  [0x0002, 'RC_BANDING (banding support)'],
  [0x0004, 'RC_SCALING (scaling)'],
  [0x0008, 'RC_BITMAP64 (64KB+ bitmaps)'],
  [0x0100, 'RC_DI_BITMAP (SetDIBits/GetDIBits)'],
  [0x0200, 'RC_PALETTE (palette-based)'],
  [0x0400, 'RC_DIBTODEV (DIB-to-device)'],
  [0x0800, 'RC_BIGFONT (fonts >64KB)'],
  [0x1000, 'RC_STRETCHBLT (StretchBlt)'],
  [0x2000, 'RC_FLOODFILL (flood fill)'],
  [0x4000, 'RC_STRETCHDIB (StretchDIBits)'],
  [0x8000, 'RC_OP_DX_OUTPUT (dev opaque/DX)'],
  [0x00010000, 'RC_DEVBITS (device bitmap support)'],
];

// GetStockObject indices
const DEFAULT_GUI_FONT = 17;
const SYSTEM_FONT = 13;

// LOGFONTW is 92 bytes: lfHeight(4) lfWidth(4) lfEscapement(4) lfOrientation(4)
// lfWeight(4) lfItalic(1) lfUnderline(1) lfStrikeOut(1) lfCharSet(1)
// lfOutPrecision(1) lfClipPrecision(1) lfQuality(1) lfPitchAndFamily(1)
// lfFaceName(32 WCHAR = 64 bytes) = total 92 bytes
const LOGFONTW_SIZE = 92;

function decodeRasterCaps(caps: number): string[] {
  const active: string[] = [];
  for (const [bit, label] of RASTER_CAP_FLAGS) {
    if (caps & bit) active.push(label);
  }
  return active;
}

function readLogFont(buffer: Buffer): { faceName: string; height: number; width: number; weight: number; italic: boolean; charSet: number } {
  const height = buffer.readInt32LE(0);
  const width = buffer.readInt32LE(4);
  const weight = buffer.readInt32LE(16);
  const italic = buffer.readUInt8(20) !== 0;
  const charSet = buffer.readUInt8(23);
  const faceNameBytes = buffer.subarray(28, 92);
  const faceName = faceNameBytes.toString('utf16le').replace(/\0.*$/, '');

  return { faceName, height, width, weight, italic, charSet };
}

function getStockFontInfo(stockIndex: number, label: string): void {
  const fontHandle = Gdi32.GetStockObject(stockIndex);
  if (!fontHandle) {
    console.log(`  ${label}: unavailable`);
    return;
  }

  const fontBuffer = Buffer.alloc(LOGFONTW_SIZE);
  const bytesWritten = Gdi32.GetObjectW(fontHandle, LOGFONTW_SIZE, fontBuffer.ptr);
  if (bytesWritten === 0) {
    console.log(`  ${label}: GetObjectW returned 0`);
    return;
  }

  const font = readLogFont(fontBuffer);
  console.log(`  ${label}:`);
  console.log(`    Face name : ${font.faceName}`);
  console.log(`    Height    : ${font.height}`);
  console.log(`    Width     : ${font.width}`);
  console.log(`    Weight    : ${font.weight} (${font.weight >= 700 ? 'bold' : font.weight >= 400 ? 'normal' : 'thin'})`);
  console.log(`    Italic    : ${font.italic}`);
  console.log(`    Charset   : ${font.charSet}`);
}

function main(): void {
  // Create a device context for the display (no specific device)
  const displayDriver = Buffer.from('DISPLAY\0', 'utf16le');
  const hdc = Gdi32.CreateDCW(displayDriver.ptr, null, null, null);
  if (!hdc) throw new Error('CreateDCW("DISPLAY") failed');

  console.log('=== Display Device Capabilities Audit ===\n');

  const driverVersion = Gdi32.GetDeviceCaps(hdc, DRIVERVERSION);
  const technology = Gdi32.GetDeviceCaps(hdc, TECHNOLOGY);
  const horzRes = Gdi32.GetDeviceCaps(hdc, HORZRES);
  const vertRes = Gdi32.GetDeviceCaps(hdc, VERTRES);
  const horzSizeMm = Gdi32.GetDeviceCaps(hdc, HORZSIZE);
  const vertSizeMm = Gdi32.GetDeviceCaps(hdc, VERTSIZE);
  const bitsPerPixel = Gdi32.GetDeviceCaps(hdc, BITSPIXEL);
  const planes = Gdi32.GetDeviceCaps(hdc, PLANES);
  const numColors = Gdi32.GetDeviceCaps(hdc, NUMCOLORS);
  const dpiX = Gdi32.GetDeviceCaps(hdc, LOGPIXELSX);
  const dpiY = Gdi32.GetDeviceCaps(hdc, LOGPIXELSY);
  const rasterCaps = Gdi32.GetDeviceCaps(hdc, RASTERCAPS);
  const numBrushes = Gdi32.GetDeviceCaps(hdc, NUMBRUSHES);
  const numPens = Gdi32.GetDeviceCaps(hdc, NUMPENS);
  const numFonts = Gdi32.GetDeviceCaps(hdc, NUMFONTS);
  const aspectX = Gdi32.GetDeviceCaps(hdc, ASPECTX);
  const aspectY = Gdi32.GetDeviceCaps(hdc, ASPECTY);
  const aspectXY = Gdi32.GetDeviceCaps(hdc, ASPECTXY);
  const sizePalette = Gdi32.GetDeviceCaps(hdc, SIZEPALETTE);
  const numReserved = Gdi32.GetDeviceCaps(hdc, NUMRESERVED);
  const colorRes = Gdi32.GetDeviceCaps(hdc, COLORRES);

  // Compute physical diagonal in inches for approximate screen size
  const diagMm = Math.sqrt(horzSizeMm * horzSizeMm + vertSizeMm * vertSizeMm);
  const diagInches = diagMm / 25.4;

  console.log('Display Resolution & Dimensions');
  console.log(`  Resolution        : ${horzRes} x ${vertRes} pixels`);
  console.log(`  Physical size     : ${horzSizeMm} x ${vertSizeMm} mm`);
  console.log(`  Diagonal          : ~${diagInches.toFixed(1)} inches`);
  console.log(`  DPI (logical)     : ${dpiX} x ${dpiY}`);
  console.log(`  Scaling factor    : ${Math.round((dpiX / 96) * 100)}%`);

  console.log('\nColor & Planes');
  console.log(`  Bits per pixel    : ${bitsPerPixel}`);
  console.log(`  Color planes      : ${planes}`);
  console.log(`  Total color depth : ${bitsPerPixel * planes} bits`);
  console.log(`  Num colors        : ${numColors === -1 ? '>256 (true color)' : numColors}`);
  console.log(`  Palette size      : ${sizePalette}`);
  console.log(`  Reserved colors   : ${numReserved}`);
  console.log(`  Color resolution  : ${colorRes} bits per primary`);

  console.log('\nDevice Info');
  console.log(`  Driver version    : ${driverVersion}`);
  console.log(`  Technology        : ${TECHNOLOGY_NAMES[technology] ?? `Unknown (${technology})`}`);
  console.log(`  Pixel aspect      : ${aspectX} : ${aspectY} (diagonal ${aspectXY})`);
  console.log(`  Stock brushes     : ${numBrushes}`);
  console.log(`  Stock pens        : ${numPens}`);
  console.log(`  Stock fonts       : ${numFonts}`);

  console.log('\nRaster Capabilities');
  const activeRasterCaps = decodeRasterCaps(rasterCaps);
  if (activeRasterCaps.length === 0) {
    console.log('  (none)');
  } else {
    for (const cap of activeRasterCaps) {
      console.log(`  + ${cap}`);
    }
  }

  // System metrics from User32
  const primaryWidth = User32.GetSystemMetrics(SystemMetric.SM_CXSCREEN);
  const primaryHeight = User32.GetSystemMetrics(SystemMetric.SM_CYSCREEN);
  const monitorCount = User32.GetSystemMetrics(SystemMetric.SM_CMONITORS);
  const virtualWidth = User32.GetSystemMetrics(SystemMetric.SM_CXVIRTUALSCREEN);
  const virtualHeight = User32.GetSystemMetrics(SystemMetric.SM_CYVIRTUALSCREEN);

  console.log('\nSystem Metrics (User32)');
  console.log(`  Primary monitor   : ${primaryWidth} x ${primaryHeight} pixels`);
  console.log(`  Monitor count     : ${monitorCount}`);
  console.log(`  Virtual desktop   : ${virtualWidth} x ${virtualHeight} pixels`);

  // Stock font information
  console.log('\nSystem Fonts');
  getStockFontInfo(DEFAULT_GUI_FONT, 'DEFAULT_GUI_FONT');
  getStockFontInfo(SYSTEM_FONT, 'SYSTEM_FONT');

  Gdi32.DeleteDC(hdc);

  console.log('\nAudit complete.');
}

main();
