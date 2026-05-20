/**
 * Clipboard Museum - Your clipboard history as a living art gallery.
 *
 * A borderless 1100x700 Mica-acrylic window with immersive dark mode and
 * rounded corners that subscribes to the Win32 clipboard change feed via
 * `User32.AddClipboardFormatListener`. Every time anything is copied -
 * anywhere in the OS - the WndProc receives `WM_CLIPBOARDUPDATE (0x031D)`,
 * opens the clipboard, walks `EnumClipboardFormats` to identify the
 * payload kind (text, bitmap, file list, or any other format - resolved by
 * name through `GetClipboardFormatNameW`), reads the text contents through
 * `GetClipboardData(CF_UNICODETEXT)` + `Kernel32.GlobalLock` / `GlobalUnlock`,
 * and adds a freshly stamped card to the gallery.
 *
 * The gallery is a vertical stack of glowing cards, rendered each frame by
 * GDI+ into a 32-bpp ARGB DIB section that is `BitBlt`'d onto the window in
 * a single transfer. Newest cards land at the top of the stack and animate
 * in from the right edge using a cubic ease-out curve; older cards drift
 * downward as new ones arrive, fading slightly with depth. Cards under the
 * mouse cursor enlarge and reveal their full content; a right-click on a
 * card animates it out to the right and removes it from the gallery.
 *
 * Pipeline:
 *
 *   1.  User32.RegisterClassExW            (custom class, WS_POPUP shell)
 *   2.  User32.CreateWindowExW             (borderless 1100x700, centred)
 *   3.  Dwmapi.DwmSetWindowAttribute       (dark mode + rounded corners +
 *                                           DWMSBT_TRANSIENTWINDOW mica)
 *   4.  User32.AddClipboardFormatListener  (the OS notifies us on every copy)
 *   5.  GDI32.CreateDIBSection             (top-down 32-bit BGRA backing store)
 *   6.  Gdiplus.GdipCreateFromHDC          (GDI+ Graphics bound to the DIB DC)
 *   7.  User32.SetTimer ~60 fps -> WM_TIMER -> InvalidateRect ->
 *         WM_PAINT -> paintFrame() -> GDI32.BitBlt to the window DC.
 *
 *   On every WM_CLIPBOARDUPDATE:
 *     User32.OpenClipboard -> User32.EnumClipboardFormats ->
 *     User32.GetClipboardData -> Kernel32.GlobalLock / GlobalSize ->
 *     decode UTF-16LE text -> Kernel32.GlobalUnlock -> User32.CloseClipboard
 *     -> push a new card with a slide-in animation.
 *
 *   On teardown:
 *     User32.RemoveClipboardFormatListener -> KillTimer -> DestroyWindow ->
 *     UnregisterClassW + release every GDI / GDI+ handle in reverse order.
 *
 * APIs demonstrated (User32):
 *   - RegisterClassExW / CreateWindowExW / DestroyWindow / UnregisterClassW
 *   - AddClipboardFormatListener / RemoveClipboardFormatListener
 *   - OpenClipboard / CloseClipboard / EnumClipboardFormats
 *   - GetClipboardData / GetClipboardFormatNameW
 *   - SetTimer / KillTimer / InvalidateRect / BeginPaint / EndPaint
 *   - GetMessageW / TranslateMessage / DispatchMessageW / DefWindowProcW
 *   - PostQuitMessage / ShowWindow / UpdateWindow / GetSystemMetrics / GetDC
 *   - ReleaseDC / SetLayeredWindowAttributes
 *
 * APIs demonstrated (Kernel32):
 *   - GlobalLock / GlobalSize / GlobalUnlock / GetModuleHandleW / GetTickCount
 *
 * APIs demonstrated (Dwmapi):
 *   - DwmSetWindowAttribute (DWMWA_USE_IMMERSIVE_DARK_MODE,
 *     DWMWA_SYSTEMBACKDROP_TYPE, DWMWA_WINDOW_CORNER_PREFERENCE)
 *
 * APIs demonstrated (Gdiplus):
 *   - GdiplusStartup / GdiplusShutdown / GdipCreateFromHDC / GdipDeleteGraphics
 *   - GdipSetSmoothingMode / GdipSetTextRenderingHint / GdipGraphicsClear
 *   - GdipCreateSolidFill / GdipCreatePen1 / GdipDeleteBrush / GdipDeletePen
 *   - GdipFillRectangleI / GdipDrawRectangleI / GdipFillEllipseI
 *   - GdipFillPath / GdipDeletePath / GdipCreatePath / GdipAddPathArc /
 *     GdipClosePathFigure / GdipDrawPath
 *   - GdipCreateFontFamilyFromName / GdipCreateFont / GdipDeleteFont /
 *     GdipDeleteFontFamily / GdipCreateStringFormat / GdipDrawString /
 *     GdipSetStringFormatAlign / GdipDeleteStringFormat
 *
 * APIs demonstrated (GDI32):
 *   - CreateCompatibleDC / CreateDIBSection / SelectObject / BitBlt /
 *     DeleteObject / DeleteDC
 *
 * Controls:
 *   - Copy anything anywhere   a new card flies in from the right
 *   - Hover a card             that card enlarges and reveals full content
 *   - Right-click a card       slide-off animation, card is removed
 *   - ESC / Ctrl+C             quit
 *
 * Run: bun run example/clipboard-museum.ts
 */

import { JSCallback, toArrayBuffer, type Pointer } from 'bun:ffi';
import { Dwmapi, GDI32, Gdiplus, Kernel32, User32 } from '../index';
import { ExtendedWindowStyles, ShowWindowCommand, SystemMetric, VirtualKey, WindowStyles } from '@bun-win32/user32';
import { SystemBackdropType, WindowAttribute, WindowCornerPreference } from '@bun-win32/dwmapi';
import {
  FillMode,
  FontStyle,
  SmoothingMode,
  Status,
  StringAlignment,
  TextRenderingHint,
  Unit,
} from '@bun-win32/gdiplus';

// ── Window message + flag constants ───────────────────────────────────────────
const WM_DESTROY = 0x0002;
const WM_CLOSE = 0x0010;
const WM_ERASEBKGND = 0x0014;
const WM_PAINT = 0x000f;
const WM_KEYDOWN = 0x0100;
const WM_RBUTTONDOWN = 0x0204;
const WM_MOUSEMOVE = 0x0200;
const WM_NCHITTEST = 0x0084;
const WM_TIMER = 0x0113;
const WM_CLIPBOARDUPDATE = 0x031d;
const HTCAPTION = 2n;
const SRCCOPY = 0x00cc0020;

// ── Clipboard format identifiers (from WinUser.h) ─────────────────────────────
const CF_TEXT = 1;
const CF_BITMAP = 2;
const CF_OEMTEXT = 7;
const CF_DIB = 8;
const CF_UNICODETEXT = 13;
const CF_HDROP = 15;
const CF_DIBV5 = 17;
const CF_HTML_PREFIX = 'HTML Format';

const WINDOW_WIDTH = 1100;
const WINDOW_HEIGHT = 700;
const TIMER_ID = 1n;
const FRAME_INTERVAL_MS = 16; // ~60 fps

const NULL_PTR = null as unknown as Pointer;

const encodeWide = (text: string): Buffer => Buffer.from(`${text}\0`, 'utf16le');
const argb = (a: number, r: number, g: number, b: number): number =>
  (((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)) >>> 0;

function checkStatus(status: number, where: string): void {
  if (status !== Status.Ok) throw new Error(`${where} failed: ${Status[status] ?? 'unknown'} (${status})`);
}

// ── Card model ────────────────────────────────────────────────────────────────
interface ClipboardCard {
  readonly identifier: number;
  readonly kind: string;          // "text", "image", "files", or a fallback format name
  readonly accentColor: number;   // ARGB accent stripe + glyph color
  readonly preview: string;       // ~120-char snippet shown on the card front
  readonly fullText: string;      // full content used on hover
  readonly capturedAt: Date;
  readonly metadata: string;      // e.g. "423 bytes" / "1024x768" / "3 files"
  slideProgress: number;          // 0 -> just born, 1 -> fully landed
  removalProgress: number;        // 0 -> alive, 1 -> fully slid off-right (then dropped)
  doomed: boolean;                // right-click marks the card as doomed
}

const cards: ClipboardCard[] = [];
let cardSequence = 0;

// Total clipboard updates seen since launch (drives the header counter).
let updateCounter = 0;

// Mouse position in client coordinates, used for hover detection.
let mouseClientX = -1;
let mouseClientY = -1;
// The card the cursor is currently hovering over (or -1 if none).
let hoveredCardIdentifier = -1;

// ── Boot GDI+ early so any classification path that wants it has it ready ────
Gdiplus.Preload();
const gdiplusTokenBuffer = Buffer.alloc(8);
const gdiplusStartupInput = Buffer.alloc(16);
gdiplusStartupInput.writeUInt32LE(1, 0); // GdiplusVersion
checkStatus(Gdiplus.GdiplusStartup(gdiplusTokenBuffer.ptr, gdiplusStartupInput.ptr, null), 'GdiplusStartup');
const gdiplusToken = gdiplusTokenBuffer.readBigUInt64LE(0);

// ── Pre-allocate small reused buffers for clipboard format-name lookup ───────
const formatNameBuffer = Buffer.alloc(256 * 2); // 256 wchars

function clipboardFormatName(formatId: number): string {
  formatNameBuffer.fill(0);
  const length = User32.GetClipboardFormatNameW(formatId, formatNameBuffer.ptr, 256);
  if (length <= 0) return `Format #${formatId}`;
  return formatNameBuffer.subarray(0, length * 2).toString('utf16le').replace(/\0.*$/, '');
}

function isPredefinedFormat(formatId: number): string | null {
  switch (formatId) {
    case CF_TEXT: return 'CF_TEXT';
    case CF_BITMAP: return 'CF_BITMAP';
    case CF_OEMTEXT: return 'CF_OEMTEXT';
    case CF_DIB: return 'CF_DIB';
    case CF_UNICODETEXT: return 'CF_UNICODETEXT';
    case CF_HDROP: return 'CF_HDROP';
    case CF_DIBV5: return 'CF_DIBV5';
    default: return null;
  }
}

// ── Read the clipboard and append a card describing whatever landed ──────────
function readClipboardSnapshot(ownerHwnd: bigint): void {
  if (!User32.OpenClipboard(ownerHwnd)) return;
  try {
    updateCounter++;

    // Enumerate every format that is currently advertised so we can list the
    // foreign ones in the metadata strip and pick the best representation.
    const advertisedFormats: number[] = [];
    let format = User32.EnumClipboardFormats(0);
    while (format !== 0) {
      advertisedFormats.push(format);
      format = User32.EnumClipboardFormats(format);
    }
    if (advertisedFormats.length === 0) return;

    // Prefer Unicode text -> file list -> bitmap -> unknown-named-format.
    let chosen: number | undefined = advertisedFormats.find((id): boolean => id === CF_UNICODETEXT);
    if (chosen === undefined) chosen = advertisedFormats.find((id): boolean => id === CF_HDROP);
    if (chosen === undefined) chosen = advertisedFormats.find((id): boolean => id === CF_BITMAP || id === CF_DIB || id === CF_DIBV5);
    if (chosen === undefined) chosen = advertisedFormats[0];
    if (chosen === undefined) return;

    if (chosen === CF_UNICODETEXT) {
      ingestUnicodeText(advertisedFormats);
    } else if (chosen === CF_HDROP) {
      ingestFileList(advertisedFormats);
    } else if (chosen === CF_BITMAP || chosen === CF_DIB || chosen === CF_DIBV5) {
      ingestBitmap(chosen, advertisedFormats);
    } else {
      const formatName = isPredefinedFormat(chosen) ?? clipboardFormatName(chosen);
      ingestOpaque(chosen, formatName, advertisedFormats);
    }
  } finally {
    User32.CloseClipboard();
  }
}

function ingestUnicodeText(advertisedFormats: readonly number[]): void {
  const handle = User32.GetClipboardData(CF_UNICODETEXT);
  if (!handle) return;
  const ptr = Kernel32.GlobalLock(handle);
  if (!ptr) return;
  try {
    const byteCount = Number(Kernel32.GlobalSize(handle));
    // Cap the slurp at 128 KB of wide chars so a giant HTML paste does not
    // blow the renderer; the preview is truncated to ~120 chars anyway.
    const cap = Math.min(byteCount, 128 * 1024);
    const snapshot = Buffer.from(toArrayBuffer(ptr, 0, cap));
    const fullText = snapshot.toString('utf16le').replace(/\0.*$/, '');
    registerTextCard(fullText, advertisedFormats);
  } finally {
    Kernel32.GlobalUnlock(handle);
  }
}

function ingestFileList(advertisedFormats: readonly number[]): void {
  const handle = User32.GetClipboardData(CF_HDROP);
  if (!handle) return;
  const ptr = Kernel32.GlobalLock(handle);
  if (!ptr) return;
  try {
    // DROPFILES (Win32): pFiles offset (DWORD), pt (POINT), fNC (BOOL), fWide (BOOL).
    // We only need pFiles (offset to the file list) and fWide.
    const dropFilesOffset = readU32At(ptr, 0);
    const isWide = readU32At(ptr, 16) !== 0;
    const totalBytes = Number(Kernel32.GlobalSize(handle));

    const paths: string[] = [];
    if (isWide) {
      // Double-NUL-terminated array of UTF-16LE strings.
      const maxChars = Math.min((totalBytes - dropFilesOffset) / 2, 65_536);
      let current = '';
      let i = 0;
      while (i < maxChars) {
        const codeUnit = readWcharAt(ptr, dropFilesOffset / 2 + i);
        if (codeUnit === 0) {
          if (current.length === 0) break; // second NUL terminates the list
          paths.push(current);
          current = '';
        } else {
          current += String.fromCharCode(codeUnit);
        }
        i++;
      }
    } else {
      const maxChars = Math.min(totalBytes - dropFilesOffset, 65_536);
      let current = '';
      let i = 0;
      while (i < maxChars) {
        const byteValue = readU8At(ptr, dropFilesOffset + i);
        if (byteValue === 0) {
          if (current.length === 0) break;
          paths.push(current);
          current = '';
        } else {
          current += String.fromCharCode(byteValue);
        }
        i++;
      }
    }

    registerFileCard(paths, advertisedFormats);
  } finally {
    Kernel32.GlobalUnlock(handle);
  }
}

function ingestBitmap(formatId: number, advertisedFormats: readonly number[]): void {
  // We don't blit the bitmap into the gallery (that would require GDI conversion
  // every paint); we describe it instead by reading just the BITMAPINFOHEADER.
  const handle = User32.GetClipboardData(formatId);
  if (!handle) return;
  let width = 0;
  let height = 0;
  let bpp = 0;
  if (formatId === CF_DIB || formatId === CF_DIBV5) {
    const ptr = Kernel32.GlobalLock(handle);
    if (ptr) {
      try {
        width = readI32At(ptr, 4);
        height = readI32At(ptr, 8);
        bpp = readU16At(ptr, 14);
      } finally {
        Kernel32.GlobalUnlock(handle);
      }
    }
  }
  registerBitmapCard(width, height, bpp, formatId, advertisedFormats);
}

function ingestOpaque(formatId: number, formatName: string, advertisedFormats: readonly number[]): void {
  const handle = User32.GetClipboardData(formatId);
  let sizeBytes = 0;
  if (handle) sizeBytes = Number(Kernel32.GlobalSize(handle));
  registerOpaqueCard(formatId, formatName, sizeBytes, advertisedFormats);
}

// ── Build cards from each kind of payload ────────────────────────────────────
function registerTextCard(fullText: string, advertisedFormats: readonly number[]): void {
  const trimmed = fullText.trim();
  if (trimmed.length === 0) return;
  const preview = trimmed.length > 120 ? trimmed.slice(0, 117) + '...' : trimmed;
  const bytesUsed = Buffer.byteLength(fullText, 'utf16le');
  const formatSummary = summarizeAdvertised(advertisedFormats);
  const metadata = `${fullText.length} chars  ${bytesUsed} bytes  ${formatSummary}`;
  pushCard({
    kind: 'text',
    accentColor: argb(255, 120, 220, 200),
    preview: preview.replace(/\s+/g, ' '),
    fullText,
    metadata,
  });
}

function registerFileCard(paths: readonly string[], advertisedFormats: readonly number[]): void {
  if (paths.length === 0) return;
  const summary = paths.map((p) => p.split(/[\\/]/).pop() ?? p).slice(0, 4).join(', ');
  const preview = paths.length === 1 ? paths[0]! : `${paths.length} files: ${summary}`;
  const fullText = paths.join('\n');
  const metadata = `${paths.length} file${paths.length === 1 ? '' : 's'}  ${summarizeAdvertised(advertisedFormats)}`;
  pushCard({
    kind: 'files',
    accentColor: argb(255, 250, 200, 110),
    preview: preview.length > 120 ? preview.slice(0, 117) + '...' : preview,
    fullText,
    metadata,
  });
}

function registerBitmapCard(width: number, height: number, bpp: number, formatId: number, advertisedFormats: readonly number[]): void {
  const dims = width > 0 && height !== 0 ? `${width} x ${Math.abs(height)}` : 'unknown size';
  const depth = bpp > 0 ? `${bpp} bpp` : '';
  const formatLabel = isPredefinedFormat(formatId) ?? `Format #${formatId}`;
  pushCard({
    kind: 'image',
    accentColor: argb(255, 200, 160, 250),
    preview: `Bitmap on clipboard - ${dims}${depth ? ' - ' + depth : ''}`,
    fullText: `${formatLabel} bitmap\nDimensions: ${dims}\nBits per pixel: ${bpp || 'n/a'}\n\nFull bitmap blitting omitted - hover to confirm the metadata only.`,
    metadata: `${formatLabel}  ${summarizeAdvertised(advertisedFormats)}`,
  });
}

function registerOpaqueCard(formatId: number, formatName: string, sizeBytes: number, advertisedFormats: readonly number[]): void {
  pushCard({
    kind: formatName.length > 18 ? formatName.slice(0, 18) : formatName,
    accentColor: argb(255, 150, 180, 240),
    preview: `Opaque payload (${formatName})  -  ${sizeBytes.toLocaleString()} bytes`,
    fullText: `Clipboard format: ${formatName}\nFormat id: ${formatId}\nGlobalSize: ${sizeBytes} bytes\n\nNo native decoder bound for this format. The window simply records that it was present.`,
    metadata: `id=${formatId}  ${sizeBytes.toLocaleString()} bytes  ${summarizeAdvertised(advertisedFormats)}`,
  });
}

function summarizeAdvertised(advertisedFormats: readonly number[]): string {
  if (advertisedFormats.length <= 1) return `${advertisedFormats.length} format`;
  return `${advertisedFormats.length} formats`;
}

function pushCard(spec: Omit<ClipboardCard, 'identifier' | 'capturedAt' | 'slideProgress' | 'removalProgress' | 'doomed'>): void {
  cards.unshift({
    identifier: ++cardSequence,
    capturedAt: new Date(),
    slideProgress: 0,
    removalProgress: 0,
    doomed: false,
    ...spec,
  });
  // Cap the gallery so the bottom of the visible stack can stay in shape.
  const maximumCards = 24;
  if (cards.length > maximumCards) cards.length = maximumCards;
}

// ── Tiny FFI memory readers for clipboard payloads ───────────────────────────
// Each one builds a Buffer view around the pointer; the locked block is alive
// across the short read window since GlobalUnlock is in the surrounding finally.
function readWcharAt(pointer: Pointer, indexInWchars: number): number {
  return Buffer.from(toArrayBuffer(pointer, indexInWchars * 2, 2)).readUInt16LE(0);
}
function readU8At(pointer: Pointer, offset: number): number {
  return Buffer.from(toArrayBuffer(pointer, offset, 1)).readUInt8(0);
}
function readU16At(pointer: Pointer, offset: number): number {
  return Buffer.from(toArrayBuffer(pointer, offset, 2)).readUInt16LE(0);
}
function readU32At(pointer: Pointer, offset: number): number {
  return Buffer.from(toArrayBuffer(pointer, offset, 4)).readUInt32LE(0);
}
function readI32At(pointer: Pointer, offset: number): number {
  return Buffer.from(toArrayBuffer(pointer, offset, 4)).readInt32LE(0);
}

// ── Build window class + window ──────────────────────────────────────────────
const hInstance = Kernel32.GetModuleHandleW(null!);
const className = encodeWide('BunWin32ClipboardMuseum');
const titleBar = encodeWide('Clipboard Museum - @bun-win32/all');

let mainHwnd = 0n;

function clientPointFromLParam(lParam: bigint): { x: number; y: number } {
  // LOWORD = x (low 16 bits, signed), HIWORD = y (next 16 bits, signed).
  return {
    x: Number(BigInt.asIntN(16, lParam & 0xffffn)),
    y: Number(BigInt.asIntN(16, (lParam >> 16n) & 0xffffn)),
  };
}

const wndProc = new JSCallback(
  (hWnd: bigint, msg: number, wParam: bigint, lParam: bigint): bigint => {
    switch (msg) {
      case WM_NCHITTEST: {
        // Make the title strip act as a window caption so the user can drag the
        // borderless window around. Pass the rest of the client area through.
        const point = packedScreenPointToClient(hWnd, lParam);
        if (point.y >= 0 && point.y < TITLE_BAR_HEIGHT) return HTCAPTION;
        return BigInt(User32.DefWindowProcW(hWnd, msg, wParam, lParam));
      }
      case WM_ERASEBKGND:
        // We paint the entire client area ourselves each frame; skip the
        // system erase so the Mica backdrop doesn't flash between frames.
        return 1n;
      case WM_CLIPBOARDUPDATE:
        readClipboardSnapshot(hWnd);
        return 0n;
      case WM_TIMER:
        if (wParam === TIMER_ID) {
          stepAnimations();
          User32.InvalidateRect(hWnd, NULL_PTR, 0);
        }
        return 0n;
      case WM_MOUSEMOVE: {
        const point = clientPointFromLParam(lParam);
        mouseClientX = point.x;
        mouseClientY = point.y;
        return 0n;
      }
      case WM_RBUTTONDOWN: {
        const point = clientPointFromLParam(lParam);
        const targetIdentifier = cardAtClientPoint(point.x, point.y);
        if (targetIdentifier !== -1) {
          const target = cards.find((c) => c.identifier === targetIdentifier);
          if (target) target.doomed = true;
        }
        return 0n;
      }
      case WM_KEYDOWN:
        if (wParam === BigInt(VirtualKey.VK_ESCAPE)) {
          User32.DestroyWindow(hWnd);
        }
        return 0n;
      case WM_PAINT:
        paintFrameToWindow(hWnd);
        return 0n;
      case WM_CLOSE:
        User32.DestroyWindow(hWnd);
        return 0n;
      case WM_DESTROY:
        User32.PostQuitMessage(0);
        return 0n;
      default:
        return BigInt(User32.DefWindowProcW(hWnd, msg, wParam, lParam));
    }
  },
  { args: ['u64', 'u32', 'u64', 'i64'], returns: 'i64' },
);

// Pack/unpack helper for WM_NCHITTEST whose lParam is screen-space.
const screenPoint = new Int32Array(2);
function packedScreenPointToClient(hWnd: bigint, lParam: bigint): { x: number; y: number } {
  // lParam is screen-space; we want client-space, so use ScreenToClient via
  // GetWindowRect (avoids an extra import).
  const rect = Buffer.alloc(16);
  User32.GetWindowRect(hWnd, rect.ptr);
  screenPoint[0] = Number(BigInt.asIntN(16, lParam & 0xffffn));
  screenPoint[1] = Number(BigInt.asIntN(16, (lParam >> 16n) & 0xffffn));
  return {
    x: screenPoint[0]! - rect.readInt32LE(0),
    y: screenPoint[1]! - rect.readInt32LE(4),
  };
}

// ── Window class registration ───────────────────────────────────────────────
const wndClass = Buffer.alloc(80);
wndClass.writeUInt32LE(80, 0); // cbSize
wndClass.writeUInt32LE(0x0002 | 0x0001, 4); // CS_HREDRAW | CS_VREDRAW
wndClass.writeBigUInt64LE(BigInt(wndProc.ptr!), 8); // lpfnWndProc
wndClass.writeInt32LE(0, 16); // cbClsExtra
wndClass.writeInt32LE(0, 20); // cbWndExtra
wndClass.writeBigUInt64LE(BigInt(hInstance), 24); // hInstance
wndClass.writeBigUInt64LE(0n, 32); // hIcon
wndClass.writeBigUInt64LE(0n, 40); // hCursor
wndClass.writeBigUInt64LE(0n, 48); // hbrBackground (we paint the entire client area)
wndClass.writeBigUInt64LE(0n, 56); // lpszMenuName
wndClass.writeBigUInt64LE(BigInt(className.ptr!), 64); // lpszClassName
wndClass.writeBigUInt64LE(0n, 72); // hIconSm

if (!User32.RegisterClassExW(wndClass.ptr)) {
  console.error('RegisterClassExW failed');
  process.exit(1);
}

// Centre the window on the primary monitor.
const screenWidth = User32.GetSystemMetrics(SystemMetric.SM_CXSCREEN);
const screenHeight = User32.GetSystemMetrics(SystemMetric.SM_CYSCREEN);
const windowX = Math.max(0, Math.floor((screenWidth - WINDOW_WIDTH) / 2));
const windowY = Math.max(0, Math.floor((screenHeight - WINDOW_HEIGHT) / 2));

mainHwnd = User32.CreateWindowExW(
  ExtendedWindowStyles.WS_EX_APPWINDOW,
  className.ptr,
  titleBar.ptr,
  WindowStyles.WS_POPUP | WindowStyles.WS_CLIPCHILDREN | WindowStyles.WS_CLIPSIBLINGS,
  windowX,
  windowY,
  WINDOW_WIDTH,
  WINDOW_HEIGHT,
  0n,
  0n,
  hInstance,
  null,
);
if (!mainHwnd) {
  console.error('CreateWindowExW failed');
  process.exit(1);
}

// DWM hints: dark mode + Mica backdrop + rounded corners.
const dwmAttrBuf = Buffer.alloc(4);
dwmAttrBuf.writeInt32LE(1, 0);
Dwmapi.DwmSetWindowAttribute(mainHwnd, WindowAttribute.DWMWA_USE_IMMERSIVE_DARK_MODE, dwmAttrBuf.ptr, 4);
dwmAttrBuf.writeInt32LE(SystemBackdropType.DWMSBT_TRANSIENTWINDOW, 0);
Dwmapi.DwmSetWindowAttribute(mainHwnd, WindowAttribute.DWMWA_SYSTEMBACKDROP_TYPE, dwmAttrBuf.ptr, 4);
dwmAttrBuf.writeInt32LE(WindowCornerPreference.DWMWCP_ROUND, 0);
Dwmapi.DwmSetWindowAttribute(mainHwnd, WindowAttribute.DWMWA_WINDOW_CORNER_PREFERENCE, dwmAttrBuf.ptr, 4);

// ── Build the off-screen DIB + GDI+ surface ──────────────────────────────────
const screenDC = User32.GetDC(0n);
const memoryDC = GDI32.CreateCompatibleDC(screenDC);
User32.ReleaseDC(0n, screenDC);

const bitmapInfo = Buffer.alloc(40);
bitmapInfo.writeUInt32LE(40, 0); // biSize
bitmapInfo.writeInt32LE(WINDOW_WIDTH, 4); // biWidth
bitmapInfo.writeInt32LE(-WINDOW_HEIGHT, 8); // biHeight negative -> top-down
bitmapInfo.writeUInt16LE(1, 12); // biPlanes
bitmapInfo.writeUInt16LE(32, 14); // biBitCount
bitmapInfo.writeUInt32LE(0, 16); // biCompression = BI_RGB

const dibBitsPointerBuffer = Buffer.alloc(8);
const dibBitmap = GDI32.CreateDIBSection(memoryDC, bitmapInfo.ptr, 0, dibBitsPointerBuffer.ptr, 0n, 0);
if (!dibBitmap) {
  console.error('CreateDIBSection failed');
  process.exit(1);
}
const previousBitmap = GDI32.SelectObject(memoryDC, dibBitmap);

const graphicsHandleBuffer = Buffer.alloc(8);
checkStatus(Gdiplus.GdipCreateFromHDC(memoryDC, graphicsHandleBuffer.ptr), 'GdipCreateFromHDC');
const graphics = graphicsHandleBuffer.readBigUInt64LE(0);
Gdiplus.GdipSetSmoothingMode(graphics, SmoothingMode.SmoothingModeAntiAlias);
Gdiplus.GdipSetTextRenderingHint(graphics, TextRenderingHint.TextRenderingHintAntiAliasGridFit);

// ── Pre-built font family + assorted fonts ───────────────────────────────────
const fontFamilyHandleBuffer = Buffer.alloc(8);
checkStatus(Gdiplus.GdipCreateFontFamilyFromName(encodeWide('Segoe UI').ptr, 0n, fontFamilyHandleBuffer.ptr), 'GdipCreateFontFamilyFromName');
const fontFamily = fontFamilyHandleBuffer.readBigUInt64LE(0);

function createFont(sizePixels: number, style: number): bigint {
  const fontHandleBuffer = Buffer.alloc(8);
  checkStatus(Gdiplus.GdipCreateFont(fontFamily, sizePixels, style, Unit.UnitPixel, fontHandleBuffer.ptr), 'GdipCreateFont');
  return fontHandleBuffer.readBigUInt64LE(0);
}
const fontHeader = createFont(22, FontStyle.FontStyleBold);
const fontSubheader = createFont(13, FontStyle.FontStyleRegular);
const fontCardTitle = createFont(15, FontStyle.FontStyleBold);
const fontCardBody = createFont(13, FontStyle.FontStyleRegular);
const fontMetadata = createFont(11, FontStyle.FontStyleRegular);
const fontHovered = createFont(17, FontStyle.FontStyleBold);
const fontGlyph = createFont(20, FontStyle.FontStyleBold);

const stringFormatHandleBuffer = Buffer.alloc(8);
checkStatus(Gdiplus.GdipCreateStringFormat(0, 0, stringFormatHandleBuffer.ptr), 'GdipCreateStringFormat');
const stringFormat = stringFormatHandleBuffer.readBigUInt64LE(0);
Gdiplus.GdipSetStringFormatAlign(stringFormat, StringAlignment.StringAlignmentNear);

const stringFormatCentered = Buffer.alloc(8);
checkStatus(Gdiplus.GdipCreateStringFormat(0, 0, stringFormatCentered.ptr), 'GdipCreateStringFormat');
const stringFormatCenteredHandle = stringFormatCentered.readBigUInt64LE(0);
Gdiplus.GdipSetStringFormatAlign(stringFormatCenteredHandle, StringAlignment.StringAlignmentCenter);

// ── Layout constants ─────────────────────────────────────────────────────────
const TITLE_BAR_HEIGHT = 56;
const GALLERY_PADDING = 24;
const CARD_BASE_HEIGHT = 88;
const CARD_HOVERED_HEIGHT = 220;
const CARD_GAP = 12;
const CARD_RIGHT_INSET = 24;
const CARD_LEFT_INSET = 24;

// ── Cubic ease-out, used both for slide-in and slide-off animations ──────────
function easeOutCubic(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - clamped, 3);
}

// ── Per-frame animation step ─────────────────────────────────────────────────
function stepAnimations(): void {
  const speedIn = 0.07;       // slide-in progress per frame
  const speedOut = 0.09;      // slide-off progress per frame for doomed cards

  // Step each card forward and drop fully-removed ones.
  for (let i = cards.length - 1; i >= 0; i--) {
    const card = cards[i]!;
    if (!card.doomed) {
      card.slideProgress = Math.min(1, card.slideProgress + speedIn);
    } else {
      card.removalProgress = Math.min(1, card.removalProgress + speedOut);
      if (card.removalProgress >= 1) cards.splice(i, 1);
    }
  }

  // Track the hovered card identifier so animations can react instantly.
  hoveredCardIdentifier = cardAtClientPoint(mouseClientX, mouseClientY);
}

// ── Hit-test: find which card the cursor is over (or -1) ─────────────────────
function cardAtClientPoint(clientX: number, clientY: number): number {
  if (clientY < TITLE_BAR_HEIGHT) return -1;
  if (clientX < CARD_LEFT_INSET || clientX > WINDOW_WIDTH - CARD_RIGHT_INSET) return -1;

  let currentY = TITLE_BAR_HEIGHT + GALLERY_PADDING;
  for (const card of cards) {
    if (card.removalProgress > 0) {
      currentY += CARD_BASE_HEIGHT + CARD_GAP;
      continue;
    }
    const isHovered = hoveredCardIdentifier === card.identifier;
    const height = isHovered ? CARD_HOVERED_HEIGHT : CARD_BASE_HEIGHT;
    if (clientY >= currentY && clientY < currentY + height) return card.identifier;
    currentY += height + CARD_GAP;
    if (currentY > WINDOW_HEIGHT) break;
  }
  return -1;
}

// ── Paint helpers ────────────────────────────────────────────────────────────
function withSolidBrush<T>(color: number, fn: (brush: bigint) => T): T {
  const handleBuffer = Buffer.alloc(8);
  Gdiplus.GdipCreateSolidFill(color, handleBuffer.ptr);
  const brush = handleBuffer.readBigUInt64LE(0);
  try {
    return fn(brush);
  } finally {
    Gdiplus.GdipDeleteBrush(brush);
  }
}

function withPen<T>(color: number, width: number, fn: (pen: bigint) => T): T {
  const handleBuffer = Buffer.alloc(8);
  Gdiplus.GdipCreatePen1(color, width, Unit.UnitPixel, handleBuffer.ptr);
  const pen = handleBuffer.readBigUInt64LE(0);
  try {
    return fn(pen);
  } finally {
    Gdiplus.GdipDeletePen(pen);
  }
}

function drawText(text: string, x: number, y: number, width: number, height: number, font: bigint, color: number, format: bigint = stringFormat): void {
  const buf = encodeWide(text);
  const layoutRect = Buffer.alloc(16);
  layoutRect.writeFloatLE(x, 0);
  layoutRect.writeFloatLE(y, 4);
  layoutRect.writeFloatLE(width, 8);
  layoutRect.writeFloatLE(height, 12);
  withSolidBrush(color, (brush) => {
    Gdiplus.GdipDrawString(graphics, buf.ptr, -1, font, layoutRect.ptr, format, brush);
  });
}

/** Fill a rounded rectangle using a four-arc path. */
function fillRoundedRectangle(x: number, y: number, width: number, height: number, radius: number, color: number): void {
  const pathHandleBuffer = Buffer.alloc(8);
  Gdiplus.GdipCreatePath(FillMode.FillModeAlternate, pathHandleBuffer.ptr);
  const path = pathHandleBuffer.readBigUInt64LE(0);
  const diameter = radius * 2;
  Gdiplus.GdipAddPathArc(path, x, y, diameter, diameter, 180, 90);
  Gdiplus.GdipAddPathArc(path, x + width - diameter, y, diameter, diameter, 270, 90);
  Gdiplus.GdipAddPathArc(path, x + width - diameter, y + height - diameter, diameter, diameter, 0, 90);
  Gdiplus.GdipAddPathArc(path, x, y + height - diameter, diameter, diameter, 90, 90);
  Gdiplus.GdipClosePathFigure(path);
  withSolidBrush(color, (brush) => {
    Gdiplus.GdipFillPath(graphics, brush, path);
  });
  Gdiplus.GdipDeletePath(path);
}

function strokeRoundedRectangle(x: number, y: number, width: number, height: number, radius: number, color: number, penWidth: number): void {
  const pathHandleBuffer = Buffer.alloc(8);
  Gdiplus.GdipCreatePath(FillMode.FillModeAlternate, pathHandleBuffer.ptr);
  const path = pathHandleBuffer.readBigUInt64LE(0);
  const diameter = radius * 2;
  Gdiplus.GdipAddPathArc(path, x, y, diameter, diameter, 180, 90);
  Gdiplus.GdipAddPathArc(path, x + width - diameter, y, diameter, diameter, 270, 90);
  Gdiplus.GdipAddPathArc(path, x + width - diameter, y + height - diameter, diameter, diameter, 0, 90);
  Gdiplus.GdipAddPathArc(path, x, y + height - diameter, diameter, diameter, 90, 90);
  Gdiplus.GdipClosePathFigure(path);
  withPen(color, penWidth, (pen) => {
    Gdiplus.GdipDrawPath(graphics, pen, path);
  });
  Gdiplus.GdipDeletePath(path);
}

// ── Frame painter ────────────────────────────────────────────────────────────
function formatTimeAgo(then: Date): string {
  const milliseconds = Date.now() - then.getTime();
  if (milliseconds < 1000) return 'just now';
  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function paintFrame(): void {
  // Solid dark navy canvas. We do not rely on translucent pixels because the
  // Mica backdrop reads weirdly through an HDC-bound GDI+ Graphics; instead we
  // pick a dark colour that complements Mica and keep the borders clean.
  Gdiplus.GdipGraphicsClear(graphics, argb(255, 14, 16, 26));

  // ── Title bar ──────────────────────────────────────────────────────────
  withSolidBrush(argb(255, 20, 24, 38), (brush) => {
    Gdiplus.GdipFillRectangleI(graphics, brush, 0, 0, WINDOW_WIDTH, TITLE_BAR_HEIGHT);
  });
  withPen(argb(255, 60, 80, 130), 1, (pen) => {
    Gdiplus.GdipDrawLineI(graphics, pen, 0, TITLE_BAR_HEIGHT, WINDOW_WIDTH, TITLE_BAR_HEIGHT);
  });

  drawText('CLIPBOARD MUSEUM', 24, 14, 500, 30, fontHeader, argb(255, 240, 244, 255));
  drawText(
    `${updateCounter} update${updateCounter === 1 ? '' : 's'} - ${cards.length} card${cards.length === 1 ? '' : 's'} in residence`,
    24, 36, 500, 22,
    fontSubheader, argb(255, 170, 200, 240),
  );

  // Top-right hint line.
  const hint = 'Copy anything to add a card  -  Hover for full text  -  Right-click to drop  -  ESC quits';
  drawText(hint, WINDOW_WIDTH - 600, 22, 580, 22, fontSubheader, argb(255, 150, 180, 220), stringFormat);

  // ── Empty-state message before the first card lands ────────────────────
  if (cards.length === 0) {
    drawText(
      'Waiting for the next clipboard event...',
      0, WINDOW_HEIGHT / 2 - 20, WINDOW_WIDTH, 40,
      fontHeader, argb(255, 110, 150, 200), stringFormatCenteredHandle,
    );
    drawText(
      'Copy a sentence, drag-select a few files, or grab a screenshot. Cards land at the top.',
      0, WINDOW_HEIGHT / 2 + 16, WINDOW_WIDTH, 30,
      fontSubheader, argb(255, 130, 160, 210), stringFormatCenteredHandle,
    );
    return;
  }

  // ── Gallery stack ──────────────────────────────────────────────────────
  let currentY = TITLE_BAR_HEIGHT + GALLERY_PADDING;
  const stackWidth = WINDOW_WIDTH - CARD_LEFT_INSET - CARD_RIGHT_INSET;

  for (let index = 0; index < cards.length; index++) {
    const card = cards[index]!;
    const isHovered = hoveredCardIdentifier === card.identifier && card.removalProgress === 0;
    const cardHeight = isHovered ? CARD_HOVERED_HEIGHT : CARD_BASE_HEIGHT;
    if (currentY > WINDOW_HEIGHT) break;

    // Slide-in (from the right) and slide-off (back to the right) offsets.
    const slideIn = 1 - easeOutCubic(card.slideProgress);
    const slideOff = easeOutCubic(card.removalProgress);
    const xOffset = (slideIn + slideOff) * (stackWidth + 80);

    // Depth-based fade so older cards drift away visually.
    const depthFade = Math.max(0.55, 1 - index * 0.04);
    const baseAlpha = Math.round(255 * (1 - slideOff) * depthFade);

    const cardX = CARD_LEFT_INSET + xOffset;
    const cardY = currentY;

    // Drop shadow underneath (slightly offset; rounded rect).
    fillRoundedRectangle(cardX + 3, cardY + 4, stackWidth, cardHeight, 14, argb(Math.round(baseAlpha * 0.35), 0, 0, 0));

    // Card body.
    const bodyAlpha = Math.max(40, baseAlpha);
    const bodyColor = isHovered ? argb(bodyAlpha, 36, 44, 64) : argb(bodyAlpha, 28, 34, 50);
    fillRoundedRectangle(cardX, cardY, stackWidth, cardHeight, 14, bodyColor);

    // Outline.
    const outlineColor = isHovered
      ? withAlpha(card.accentColor, Math.round(baseAlpha * 0.95))
      : argb(Math.round(baseAlpha * 0.45), 80, 100, 150);
    strokeRoundedRectangle(cardX, cardY, stackWidth, cardHeight, 14, outlineColor, isHovered ? 1.5 : 1);

    // Left accent stripe.
    const stripeWidth = 6;
    fillRoundedRectangle(cardX + 1, cardY + 1, stripeWidth, cardHeight - 2, 4, withAlpha(card.accentColor, baseAlpha));

    // Kind glyph circle.
    const glyphCenterX = cardX + 38;
    const glyphCenterY = cardY + (isHovered ? 32 : cardHeight / 2);
    const glyphRadius = 16;
    withSolidBrush(withAlpha(card.accentColor, Math.round(baseAlpha * 0.25)), (brush) => {
      Gdiplus.GdipFillEllipseI(graphics, brush, glyphCenterX - glyphRadius, glyphCenterY - glyphRadius, glyphRadius * 2, glyphRadius * 2);
    });
    drawText(
      glyphForKind(card.kind),
      glyphCenterX - 16, glyphCenterY - 14, 32, 28,
      fontGlyph, withAlpha(card.accentColor, baseAlpha), stringFormatCenteredHandle,
    );

    // Card text columns.
    const textLeft = cardX + 66;
    const textWidth = stackWidth - 66 - 16;
    const titleText = `${card.kind.toUpperCase()}  -  Card #${card.identifier}`;
    drawText(titleText, textLeft, cardY + 12, textWidth, 22, fontCardTitle, argb(baseAlpha, 230, 240, 255));

    if (isHovered) {
      // Hovered: show the full text wrapped into the body of the enlarged card.
      drawText(
        truncateForRender(card.fullText, 1800),
        textLeft, cardY + 38, textWidth, cardHeight - 64,
        fontHovered, argb(baseAlpha, 220, 230, 250),
      );
    } else {
      drawText(card.preview, textLeft, cardY + 36, textWidth, 26, fontCardBody, argb(baseAlpha, 200, 215, 235));
    }

    // Metadata footer with time-ago.
    const metaText = `${card.metadata}  -  captured ${formatTimeAgo(card.capturedAt)}  -  ${card.capturedAt.toLocaleTimeString()}`;
    drawText(
      metaText,
      textLeft, cardY + cardHeight - 22, textWidth, 18,
      fontMetadata, argb(Math.round(baseAlpha * 0.85), 150, 170, 210),
    );

    currentY += cardHeight + CARD_GAP;
  }
}

function glyphForKind(kind: string): string {
  if (kind === 'text') return 'T';
  if (kind === 'files') return 'F';
  if (kind === 'image') return 'I';
  return '?';
}

function truncateForRender(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + '...';
}

function withAlpha(color: number, alpha: number): number {
  const safeAlpha = Math.max(0, Math.min(255, alpha));
  return ((safeAlpha & 0xff) << 24) | (color & 0x00ffffff);
}

// ── Compose a frame into the DIB and blit it to the window ───────────────────
const paintStruct = Buffer.alloc(72);

function paintFrameToWindow(hWnd: bigint): void {
  paintFrame();
  const targetDC = User32.BeginPaint(hWnd, paintStruct.ptr);
  if (targetDC) {
    GDI32.BitBlt(targetDC, 0, 0, WINDOW_WIDTH, WINDOW_HEIGHT, memoryDC, 0, 0, SRCCOPY);
  }
  User32.EndPaint(hWnd, paintStruct.ptr);
}

// ── Show the window, subscribe to clipboard updates, start the timer ─────────
User32.ShowWindow(mainHwnd, ShowWindowCommand.SW_SHOW);
User32.UpdateWindow(mainHwnd);

if (!User32.AddClipboardFormatListener(mainHwnd)) {
  console.warn('AddClipboardFormatListener failed - clipboard updates will not be observed.');
}

if (!User32.SetTimer(mainHwnd, TIMER_ID, FRAME_INTERVAL_MS, null)) {
  console.error('SetTimer failed');
  process.exit(1);
}

console.log('Clipboard Museum is open. Copy anything from any app to add a card.');
console.log(`Window: ${WINDOW_WIDTH}x${WINDOW_HEIGHT}, centred at (${windowX}, ${windowY}).`);
console.log('Hover a card for full text, right-click to drop, ESC to quit.');

// ── Standard Win32 message loop ──────────────────────────────────────────────
const messageBuffer = Buffer.alloc(48);
while (true) {
  const result = User32.GetMessageW(messageBuffer.ptr, 0n, 0, 0);
  if (result <= 0) break;
  User32.TranslateMessage(messageBuffer.ptr);
  User32.DispatchMessageW(messageBuffer.ptr);
}

// ── Teardown: reverse-creation order ─────────────────────────────────────────
User32.RemoveClipboardFormatListener(mainHwnd);
User32.KillTimer(mainHwnd, TIMER_ID);

Gdiplus.GdipDeleteStringFormat(stringFormatCenteredHandle);
Gdiplus.GdipDeleteStringFormat(stringFormat);
Gdiplus.GdipDeleteFont(fontHeader);
Gdiplus.GdipDeleteFont(fontSubheader);
Gdiplus.GdipDeleteFont(fontCardTitle);
Gdiplus.GdipDeleteFont(fontCardBody);
Gdiplus.GdipDeleteFont(fontMetadata);
Gdiplus.GdipDeleteFont(fontHovered);
Gdiplus.GdipDeleteFont(fontGlyph);
Gdiplus.GdipDeleteFontFamily(fontFamily);
Gdiplus.GdipDeleteGraphics(graphics);
Gdiplus.GdiplusShutdown(gdiplusToken);

GDI32.SelectObject(memoryDC, previousBitmap);
GDI32.DeleteObject(dibBitmap);
GDI32.DeleteDC(memoryDC);

User32.UnregisterClassW(className.ptr, hInstance);
wndProc.close();

// Suppress unused-import diagnostics if the bridge code is rearranged later.
void CF_TEXT; void CF_HTML_PREFIX;

console.log('Clipboard Museum closed cleanly.');
