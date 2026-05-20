/**
 * Keyboard Ghost - every keystroke you make leaves a glowing letter that drifts
 * off into the cosmos.
 *
 * A fullscreen, click-through, topmost layered overlay (WS_EX_TOPMOST |
 * WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOOLWINDOW) that intercepts every
 * keystroke in the entire operating system via a WH_KEYBOARD_LL low-level
 * keyboard hook. When you press a printable key the overlay spawns a softly
 * glowing letter at the current cursor position, drifts it upward with slight
 * inertia, scales it gently, and fades it out over ~2 seconds. The overlay
 * is transparent to input so it never steals focus or eats clicks. Press ESC
 * to quit.
 *
 * Rendering strategy: every printable ASCII character is rasterized once at
 * startup into a 64x64 ARGB Gdiplus bitmap, its pixel data extracted via
 * GdipBitmapLockBits and cached as a JS Uint8Array. A fullscreen 32bpp BGRA
 * DIB section backs UpdateLayeredWindow; each frame the DIB is cleared, every
 * active particle's cached glyph is alpha-blended into it, and the layered
 * window is pushed to the compositor in a single call.
 *
 * Low-level hook safety: Windows silently unhooks WH_KEYBOARD_LL callbacks
 * that exceed LowLevelHooksTimeout (~300ms). The JSCallback below pushes
 * (vkCode, shift, caps) onto a queue and returns immediately. All rendering
 * happens on the timer thread.
 *
 * APIs demonstrated:
 *   - User32: SetWindowsHookExW(WH_KEYBOARD_LL), UnhookWindowsHookEx,
 *     CallNextHookEx, CreateWindowExW, UpdateLayeredWindow, GetCursorPos,
 *     GetAsyncKeyState, SetTimer + TIMERPROC, GetMessageW loop.
 *   - GDI32: CreateCompatibleDC, CreateDIBSection, SelectObject, DeleteDC.
 *   - Gdiplus: GdiplusStartup, GdipCreateBitmapFromScan0,
 *     GdipGetImageGraphicsContext, GdipDrawString, GdipBitmapLockBits.
 *   - Kernel32: GetModuleHandleW for the hook hMod parameter.
 *
 * Run: bun run example/keyboard-ghost.ts
 */

import { GDI32, Gdiplus, Kernel32, User32 } from '../index';
import { ExtendedWindowStyles, SystemMetric, VirtualKey, WindowStyles } from '@bun-win32/user32';
import { FontStyle, ImageLockMode, PixelFormat32bppARGB, SmoothingMode, Status, StringAlignment, TextRenderingHint, Unit } from '@bun-win32/gdiplus';
import { JSCallback, toArrayBuffer } from 'bun:ffi';
import type { Pointer } from 'bun:ffi';

const NULL_BIGINT = 0n;
const NULL_POINTER = null as unknown as Pointer;
const encodeWide = (text: string): Buffer => Buffer.from(`${text}\0`, 'utf16le');

const WH_KEYBOARD_LL = 13;
const HC_ACTION = 0;
const WM_KEYDOWN = 0x0100;
const WM_SYSKEYDOWN = 0x0104;
const WM_TIMER = 0x0113;
const ULW_ALPHA = 0x00000002;
const AC_SRC_OVER = 0x00;
const AC_SRC_ALPHA = 0x01;
const DIB_RGB_COLORS = 0;

const GLYPH_BOX = 64;
const PARTICLE_LIFETIME_MS = 2000;
const FRAME_INTERVAL_MS = 16;
const SPAWN_RADIUS = 28;
const MAX_PARTICLES = 200;

const PASTEL_HUES: readonly [number, number, number][] = [
  [0xff, 0xa8, 0xd8], // pink
  [0xa8, 0xd0, 0xff], // sky
  [0xb0, 0xff, 0xc8], // mint
  [0xff, 0xe0, 0x88], // butter
  [0xd8, 0xb0, 0xff], // lilac
  [0xff, 0xc0, 0x9a], // peach
  [0x90, 0xff, 0xe8], // aqua
];
let hueRotation = 0;

interface Particle {
  glyph: string;
  positionX: number;
  positionY: number;
  velocityY: number;
  remainingLifeMs: number;
  hueIndex: number;
}

const activeParticles: Particle[] = [];
// Triples of (vkCode, shiftDown ? 1 : 0, capsToggled ? 1 : 0) pushed by the
// hook thread, drained by the render timer.
const pendingKeyEvents: number[] = [];

// Hook -> keystroke queue. KBDLLHOOKSTRUCT layout: vkCode(u32) scanCode(u32)
// flags(u32) time(u32) dwExtraInfo(ULONG_PTR). Only vkCode is needed.
const lowLevelKeyboardHook = new JSCallback(
  (nCode: number, wParam: bigint, lParam: bigint): bigint => {
    if (nCode === HC_ACTION) {
      const message = Number(wParam);
      if (message === WM_KEYDOWN || message === WM_SYSKEYDOWN) {
        // lParam points into our own process's address space - the OS marshals
        // a copy of KBDLLHOOKSTRUCT here for us. Read it directly.
        const structBuffer = new Uint32Array(toArrayBuffer(Number(lParam) as Pointer, 0, 8));
        const vkCode = structBuffer[0]!;
        const shiftHeld = (User32.GetAsyncKeyState(VirtualKey.VK_SHIFT) & 0x8000) !== 0;
        const capsHeld = (User32.GetAsyncKeyState(VirtualKey.VK_CAPITAL) & 0x0001) !== 0;
        pendingKeyEvents.push(vkCode, shiftHeld ? 1 : 0, capsHeld ? 1 : 0);
      }
    }
    return BigInt(User32.CallNextHookEx(NULL_BIGINT, nCode, wParam, lParam));
  },
  { args: ['i32', 'u64', 'i64'], returns: 'i64' },
);

// Virtual-key -> printable glyph (US layout). A lookup table is more robust
// than ToUnicodeEx for this case (no dead-key state machine per thread).
const OEM_KEYS: Record<number, [string, string]> = {
  0xba: [';', ':'], 0xbb: ['=', '+'], 0xbc: [',', '<'], 0xbd: ['-', '_'],
  0xbe: ['.', '>'], 0xbf: ['/', '?'], 0xc0: ['`', '~'], 0xdb: ['[', '{'],
  0xdc: ['\\', '|'], 0xdd: [']', '}'], 0xde: ["'", '"'],
};
function vkCodeToGlyph(vkCode: number, shiftHeld: boolean, capsHeld: boolean): string | null {
  if (vkCode >= 0x41 && vkCode <= 0x5a) {
    const uppercase = shiftHeld !== capsHeld;
    return String.fromCharCode(uppercase ? vkCode : vkCode + 32);
  }
  if (vkCode >= 0x30 && vkCode <= 0x39) return shiftHeld ? ')!@#$%^&*('[vkCode - 0x30]! : String.fromCharCode(vkCode);
  if (vkCode >= 0x60 && vkCode <= 0x69) return String.fromCharCode(vkCode - 0x60 + 0x30);
  const pair = OEM_KEYS[vkCode];
  if (pair) return shiftHeld ? pair[1] : pair[0];
  if (vkCode === VirtualKey.VK_SPACE) return ' ';
  if (vkCode === VirtualKey.VK_RETURN) return '↵';
  if (vkCode === VirtualKey.VK_TAB) return '⇥';
  return null;
}

// Glyph atlas: pre-rasterize every printable character into a 64x64 BGRA
// pixel buffer at startup. Windows DIB byte order is B,G,R,A.
interface CachedGlyph {
  readonly pixels: Uint8Array; // GLYPH_BOX * GLYPH_BOX * 4 bytes, BGRA.
  readonly width: number;
  readonly height: number;
}
const glyphCache = new Map<string, CachedGlyph>();

function rasterizeGlyph(glyph: string, font: bigint, format: bigint): CachedGlyph {
  const bitmapHandle = Buffer.alloc(8);
  ensureStatus(Gdiplus.GdipCreateBitmapFromScan0(GLYPH_BOX, GLYPH_BOX, 0, PixelFormat32bppARGB, null, bitmapHandle.ptr), 'GdipCreateBitmapFromScan0(glyph)');
  const bitmap = bitmapHandle.readBigUInt64LE(0);

  const graphicsHandle = Buffer.alloc(8);
  ensureStatus(Gdiplus.GdipGetImageGraphicsContext(bitmap, graphicsHandle.ptr), 'GdipGetImageGraphicsContext(glyph)');
  const graphics = graphicsHandle.readBigUInt64LE(0);
  Gdiplus.GdipSetSmoothingMode(graphics, SmoothingMode.SmoothingModeAntiAlias);
  Gdiplus.GdipSetTextRenderingHint(graphics, TextRenderingHint.TextRenderingHintAntiAliasGridFit);

  // Solid white brush; the rendered pixels are tinted per-particle later by
  // multiplying their RGB channels against PASTEL_HUES.
  const brushHandle = Buffer.alloc(8);
  ensureStatus(Gdiplus.GdipCreateSolidFill(0xffffffff, brushHandle.ptr), 'GdipCreateSolidFill(glyph)');
  const brush = brushHandle.readBigUInt64LE(0);

  const layoutRect = Buffer.alloc(16);
  layoutRect.writeFloatLE(0, 0);
  layoutRect.writeFloatLE(0, 4);
  layoutRect.writeFloatLE(GLYPH_BOX, 8);
  layoutRect.writeFloatLE(GLYPH_BOX, 12);

  const textWide = encodeWide(glyph);
  ensureStatus(Gdiplus.GdipDrawString(graphics, textWide.ptr, glyph.length, font, layoutRect.ptr, format, brush), 'GdipDrawString(glyph)');

  // BitmapData layout: Width(4) Height(4) Stride(4) PixelFormat(4) Scan0(8) Reserved(8).
  // PixelFormat32bppARGB lays bytes as B,G,R,A per pixel (DWORD little-endian ARGB).
  const lockedBitmapData = Buffer.alloc(32);
  ensureStatus(Gdiplus.GdipBitmapLockBits(bitmap, null, ImageLockMode.ImageLockModeRead, PixelFormat32bppARGB, lockedBitmapData.ptr), 'GdipBitmapLockBits(glyph)');
  const stride = lockedBitmapData.readInt32LE(8);
  const scan0 = lockedBitmapData.readBigUInt64LE(16);
  const sourceBytes = new Uint8Array(toArrayBuffer(Number(scan0) as Pointer, 0, stride * GLYPH_BOX));
  const tightStride = GLYPH_BOX * 4;
  const pixels = new Uint8Array(tightStride * GLYPH_BOX);
  for (let row = 0; row < GLYPH_BOX; row++) {
    pixels.set(sourceBytes.subarray(row * stride, row * stride + tightStride), row * tightStride);
  }
  Gdiplus.GdipBitmapUnlockBits(bitmap, lockedBitmapData.ptr);

  Gdiplus.GdipDeleteBrush(brush);
  Gdiplus.GdipDeleteGraphics(graphics);
  Gdiplus.GdipDisposeImage(bitmap);

  return { pixels, width: GLYPH_BOX, height: GLYPH_BOX };
}

function ensureStatus(status: number, where: string): void {
  if (status !== Status.Ok) throw new Error(`${where} failed: ${Status[status]} (${status})`);
}

// Compositing: zero the DIB, blend every particle's cached glyph into it,
// then pre-multiply for UpdateLayeredWindow's ULW_ALPHA path.
function compositeFrame(screenPixels: Uint8Array, screenWidth: number, screenHeight: number): void {
  screenPixels.fill(0);
  for (const particle of activeParticles) {
    const cached = glyphCache.get(particle.glyph);
    if (!cached) continue;
    const lifeFraction = particle.remainingLifeMs / PARTICLE_LIFETIME_MS;
    // Curve: stay bright most of the way, fall off sharply at the end.
    const particleAlpha = Math.max(0, Math.min(1, lifeFraction * 1.4));
    const [tintR, tintG, tintB] = PASTEL_HUES[particle.hueIndex]!;
    const tintRf = tintR / 255;
    const tintGf = tintG / 255;
    const tintBf = tintB / 255;
    const drawX = Math.round(particle.positionX - cached.width / 2);
    const drawY = Math.round(particle.positionY - cached.height / 2);
    blitGlyph(screenPixels, screenWidth, screenHeight, cached, drawX, drawY, particleAlpha, tintRf, tintGf, tintBf);
  }
  // UpdateLayeredWindow with ULW_ALPHA expects pre-multiplied alpha. We built
  // the buffer as straight alpha for compositing math; convert it now.
  for (let pixelOffset = 0; pixelOffset < screenPixels.length; pixelOffset += 4) {
    const alphaByte = screenPixels[pixelOffset + 3]!;
    if (alphaByte === 0) continue;
    if (alphaByte === 255) continue;
    const alphaScale = alphaByte / 255;
    screenPixels[pixelOffset] = Math.round(screenPixels[pixelOffset]! * alphaScale);
    screenPixels[pixelOffset + 1] = Math.round(screenPixels[pixelOffset + 1]! * alphaScale);
    screenPixels[pixelOffset + 2] = Math.round(screenPixels[pixelOffset + 2]! * alphaScale);
  }
}

function blitGlyph(destination: Uint8Array, destinationWidth: number, destinationHeight: number, glyph: CachedGlyph, drawX: number, drawY: number, alphaFactor: number, tintR: number, tintG: number, tintB: number): void {
  const sourceWidth = glyph.width;
  const sourcePixels = glyph.pixels;
  const startX = Math.max(0, -drawX);
  const startY = Math.max(0, -drawY);
  const endX = Math.min(sourceWidth, destinationWidth - drawX);
  const endY = Math.min(glyph.height, destinationHeight - drawY);

  // Particles rarely overlap, so we use a max-alpha blend (visually
  // indistinguishable from "over", and ~3x faster in the hot loop).
  for (let sourceY = startY; sourceY < endY; sourceY++) {
    let sourceOffset = (sourceY * sourceWidth + startX) * 4;
    let destinationOffset = ((drawY + sourceY) * destinationWidth + drawX + startX) * 4;
    for (let sourceX = startX; sourceX < endX; sourceX++) {
      const sourceAlpha = sourcePixels[sourceOffset + 3]!;
      if (sourceAlpha !== 0) {
        const effectiveAlpha = (sourceAlpha * alphaFactor) | 0;
        if (effectiveAlpha > destination[destinationOffset + 3]!) {
          destination[destinationOffset] = (sourcePixels[sourceOffset]! * tintB) | 0;
          destination[destinationOffset + 1] = (sourcePixels[sourceOffset + 1]! * tintG) | 0;
          destination[destinationOffset + 2] = (sourcePixels[sourceOffset + 2]! * tintR) | 0;
          destination[destinationOffset + 3] = effectiveAlpha;
        }
      }
      sourceOffset += 4;
      destinationOffset += 4;
    }
  }
}

console.log('=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~');
console.log('      KEYBOARD GHOST - your keystrokes drift away');
console.log('=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~');
console.log('A fullscreen click-through overlay captures every key you press');
console.log('anywhere in the system. Glowing letters bloom at the cursor and');
console.log('drift up into the cosmos. Press ESC to quit.\n');

// GDI+ startup and glyph atlas build.
Gdiplus.Preload();
const gdiplusTokenBuffer = Buffer.alloc(8);
const gdiplusStartupInput = Buffer.alloc(16);
gdiplusStartupInput.writeUInt32LE(1, 0);
ensureStatus(Gdiplus.GdiplusStartup(gdiplusTokenBuffer.ptr, gdiplusStartupInput.ptr, null), 'GdiplusStartup');
const gdiplusStartupToken = gdiplusTokenBuffer.readBigUInt64LE(0);

const fontFamilyHandle = Buffer.alloc(8);
ensureStatus(Gdiplus.GdipCreateFontFamilyFromName(encodeWide('Segoe UI').ptr, NULL_BIGINT, fontFamilyHandle.ptr), 'GdipCreateFontFamilyFromName');
const fontFamily = fontFamilyHandle.readBigUInt64LE(0);

const fontHandle = Buffer.alloc(8);
ensureStatus(Gdiplus.GdipCreateFont(fontFamily, 36.0, FontStyle.FontStyleBold, Unit.UnitPixel, fontHandle.ptr), 'GdipCreateFont');
const font = fontHandle.readBigUInt64LE(0);

const stringFormatHandle = Buffer.alloc(8);
ensureStatus(Gdiplus.GdipCreateStringFormat(0, 0, stringFormatHandle.ptr), 'GdipCreateStringFormat');
const stringFormat = stringFormatHandle.readBigUInt64LE(0);
Gdiplus.GdipSetStringFormatAlign(stringFormat, StringAlignment.StringAlignmentCenter);
Gdiplus.GdipSetStringFormatLineAlign(stringFormat, StringAlignment.StringAlignmentCenter);

// Pre-rasterize the printable ASCII range plus return / tab indicators.
for (let code = 0x20; code <= 0x7e; code++) {
  const character = String.fromCharCode(code);
  glyphCache.set(character, rasterizeGlyph(character, font, stringFormat));
}
glyphCache.set('↵', rasterizeGlyph('↵', font, stringFormat));
glyphCache.set('⇥', rasterizeGlyph('⇥', font, stringFormat));
console.log(`Glyph atlas built (${glyphCache.size} characters).`);

Gdiplus.GdipDeleteStringFormat(stringFormat);
Gdiplus.GdipDeleteFont(font);
Gdiplus.GdipDeleteFontFamily(fontFamily);

// Fullscreen layered overlay. The built-in STATIC class is used (its default
// WndProc handles everything we need) so RegisterClassExW is unnecessary.
const screenWidth = User32.GetSystemMetrics(SystemMetric.SM_CXSCREEN);
const screenHeight = User32.GetSystemMetrics(SystemMetric.SM_CYSCREEN);

const overlayHwnd = User32.CreateWindowExW(
  ExtendedWindowStyles.WS_EX_TOPMOST | ExtendedWindowStyles.WS_EX_LAYERED | ExtendedWindowStyles.WS_EX_TRANSPARENT | ExtendedWindowStyles.WS_EX_TOOLWINDOW | ExtendedWindowStyles.WS_EX_NOACTIVATE,
  encodeWide('STATIC').ptr,
  encodeWide('Keyboard Ghost').ptr,
  WindowStyles.WS_POPUP | WindowStyles.WS_VISIBLE,
  0,
  0,
  screenWidth,
  screenHeight,
  NULL_BIGINT,
  NULL_BIGINT,
  NULL_BIGINT,
  NULL_POINTER,
);
if (!overlayHwnd) throw new Error('CreateWindowExW failed for overlay');
console.log(`Overlay created: ${screenWidth}x${screenHeight} (hwnd 0x${overlayHwnd.toString(16)})`);

// DIB section backing UpdateLayeredWindow.
const screenDeviceContext = User32.GetDC(NULL_BIGINT);
const memoryDeviceContext = GDI32.CreateCompatibleDC(screenDeviceContext);

// BITMAPINFOHEADER: 40 bytes, top-down 32bpp BGRA.
const bitmapInfo = Buffer.alloc(40);
bitmapInfo.writeUInt32LE(40, 0); // biSize
bitmapInfo.writeInt32LE(screenWidth, 4); // biWidth
bitmapInfo.writeInt32LE(-screenHeight, 8); // biHeight (negative = top-down)
bitmapInfo.writeUInt16LE(1, 12); // biPlanes
bitmapInfo.writeUInt16LE(32, 14); // biBitCount
bitmapInfo.writeUInt32LE(0, 16); // BI_RGB = 0
bitmapInfo.writeUInt32LE(screenWidth * screenHeight * 4, 20); // biSizeImage

const pixelPointerStorage = Buffer.alloc(8); // receives ppvBits
const dibBitmap = GDI32.CreateDIBSection(memoryDeviceContext, bitmapInfo.ptr, DIB_RGB_COLORS, pixelPointerStorage.ptr, NULL_BIGINT, 0);
if (!dibBitmap) throw new Error('CreateDIBSection failed');
const dibPixelsPointer = pixelPointerStorage.readBigUInt64LE(0);
const screenPixels = new Uint8Array(toArrayBuffer(Number(dibPixelsPointer) as Pointer, 0, screenWidth * screenHeight * 4));
const oldBitmap = GDI32.SelectObject(memoryDeviceContext, dibBitmap);

// Static UpdateLayeredWindow arguments allocated once, reused every frame.
const destinationPoint = Buffer.alloc(8); // POINT { x:0, y:0 }
const sourcePoint = Buffer.alloc(8); // POINT { x:0, y:0 }
const surfaceSize = Buffer.alloc(8);
surfaceSize.writeInt32LE(screenWidth, 0);
surfaceSize.writeInt32LE(screenHeight, 4);
const blendFunction = Buffer.alloc(4);
blendFunction.writeUInt8(AC_SRC_OVER, 0); // BlendOp
blendFunction.writeUInt8(255, 2); // SourceConstantAlpha (255 = use per-pixel alpha)
blendFunction.writeUInt8(AC_SRC_ALPHA, 3); // AlphaFormat

// Hook installation.
const hModule = Kernel32.GetModuleHandleW(NULL_POINTER);
const hookHandle = User32.SetWindowsHookExW(WH_KEYBOARD_LL, lowLevelKeyboardHook.ptr!, hModule, 0);
if (!hookHandle) throw new Error('SetWindowsHookExW(WH_KEYBOARD_LL) failed');
console.log(`WH_KEYBOARD_LL hook installed (handle 0x${hookHandle.toString(16)}). Global keystrokes are now being captured.`);

// Render loop, driven by SetTimer at ~60fps.
const cursorPointBuffer = new Int32Array(2);
let shouldQuit = false;

// TIMERPROC: VOID CALLBACK TimerProc(HWND, UINT, UINT_PTR, DWORD)
const timerCallback = new JSCallback(
  (_hWnd: bigint, _msg: number, _id: bigint, _time: number): void => {
    while (pendingKeyEvents.length >= 3 && activeParticles.length < MAX_PARTICLES) {
      const vkCode = pendingKeyEvents.shift()!;
      const shiftHeld = pendingKeyEvents.shift()! !== 0;
      const capsHeld = pendingKeyEvents.shift()! !== 0;
      const glyph = vkCodeToGlyph(vkCode, shiftHeld, capsHeld);
      if (!glyph || !glyphCache.has(glyph)) continue;
      User32.GetCursorPos(cursorPointBuffer.ptr);
      activeParticles.push({
        glyph,
        positionX: cursorPointBuffer[0]! + (Math.random() - 0.5) * SPAWN_RADIUS * 2,
        positionY: cursorPointBuffer[1]! + (Math.random() - 0.5) * SPAWN_RADIUS * 2,
        velocityY: -1.5 - Math.random() * 0.8,
        remainingLifeMs: PARTICLE_LIFETIME_MS,
        hueIndex: hueRotation++ % PASTEL_HUES.length,
      });
    }

    for (let i = activeParticles.length - 1; i >= 0; i--) {
      const particle = activeParticles[i]!;
      particle.positionY += particle.velocityY;
      particle.velocityY *= 0.985;
      particle.remainingLifeMs -= FRAME_INTERVAL_MS;
      if (particle.remainingLifeMs <= 0) activeParticles.splice(i, 1);
    }

    if ((User32.GetAsyncKeyState(VirtualKey.VK_ESCAPE) & 0x8000) !== 0) {
      shouldQuit = true;
      User32.PostQuitMessage(0);
      return;
    }

    compositeFrame(screenPixels, screenWidth, screenHeight);
    User32.UpdateLayeredWindow(overlayHwnd, screenDeviceContext, destinationPoint.ptr, surfaceSize.ptr, memoryDeviceContext, sourcePoint.ptr, 0, blendFunction.ptr, ULW_ALPHA);
  },
  { args: ['u64', 'u32', 'u64', 'u32'], returns: 'void' },
);
const renderTimerId = User32.SetTimer(overlayHwnd, 1n, FRAME_INTERVAL_MS, timerCallback.ptr);
if (!renderTimerId) throw new Error('SetTimer failed');

// Cleanup wiring + message loop.
let alreadyTornDown = false;
function teardown(): void {
  if (alreadyTornDown) return;
  alreadyTornDown = true;
  console.log('\nShutting down Keyboard Ghost...');
  User32.KillTimer(overlayHwnd, renderTimerId);
  User32.UnhookWindowsHookEx(hookHandle);
  GDI32.SelectObject(memoryDeviceContext, oldBitmap);
  GDI32.DeleteObject(dibBitmap);
  GDI32.DeleteDC(memoryDeviceContext);
  User32.ReleaseDC(NULL_BIGINT, screenDeviceContext);
  User32.DestroyWindow(overlayHwnd);
  Gdiplus.GdiplusShutdown(gdiplusStartupToken);
  lowLevelKeyboardHook.close();
  timerCallback.close();
  console.log('Goodbye.');
}
process.on('SIGINT', () => {
  teardown();
  process.exit(0);
});

console.log('Render loop running. Start typing!\n');

const messageBuffer = Buffer.alloc(48);
while (!shouldQuit) {
  const result = User32.GetMessageW(messageBuffer.ptr, NULL_BIGINT, 0, 0);
  if (result <= 0) break;
  User32.TranslateMessage(messageBuffer.ptr);
  User32.DispatchMessageW(messageBuffer.ptr);
  if (messageBuffer.readUInt32LE(8) === WM_TIMER && shouldQuit) break;
}

teardown();
