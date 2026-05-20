/**
 * Cursor Rain — glowing particles fall from your cursor onto the entire desktop
 *
 * A fullscreen `WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOPMOST` overlay sits
 * above every running app. Wherever the mouse moves, a stream of colored
 * particles spawns at the cursor and rains down under gravity, bouncing off the
 * floor with damping until it fades out. Left-clicks fire an 80-particle burst
 * plus a synthesized "splat" through a recycled XAudio2 source voice. The
 * window is click-through, so your real apps remain fully usable — the rain
 * just floats over them.
 *
 * Every frame, JS writes premultiplied BGRA pixels directly into a top-down
 * 32-bit DIB section, then `UpdateLayeredWindow` hands the bitmap to the
 * desktop compositor for per-pixel alpha compositing. Mouse + keyboard are
 * sampled via `GetCursorPos` + `GetAsyncKeyState` because click-through
 * windows never receive `WM_LBUTTONDOWN`.
 *
 * Pipeline:
 *
 *   1. RegisterClassExW + CreateWindowExW      — fullscreen click-through layered overlay
 *   2. GDI32 CreateCompatibleDC + CreateDIBSection — top-down 32-bit BGRA off-screen surface
 *   3. Xaudio2_9.XAudio2Create                 — flat export bootstraps a real engine
 *   4. IXAudio2::CreateMasteringVoice          — default endpoint, COM vtable
 *   5. IXAudio2::CreateSourceVoice             — recyclable mono PCM voice for the splat
 *   6. SetTimer (~60 fps) → poll input, integrate physics, paint, UpdateLayeredWindow
 *   7. teardown: KillTimer / DestroyWindow / DestroyVoice / Release / GDI cleanup
 *
 * Demonstrates (User32):  CreateWindowExW · UpdateLayeredWindow (ULW_ALPHA +
 *   BLENDFUNCTION) · GetSystemMetrics · GetCursorPos · GetAsyncKeyState ·
 *   SetTimer / KillTimer · GetMessageW message loop · JSCallback WndProc
 *
 * Demonstrates (GDI32):   CreateCompatibleDC · CreateDIBSection (top-down BI_RGB
 *   32-bpp) · SelectObject · DeleteObject · DeleteDC
 *
 * Demonstrates (Xaudio2_9): XAudio2Create + COM vtable for CreateMasteringVoice
 *   / CreateSourceVoice / SubmitSourceBuffer / Start / DestroyVoice / Release
 *
 * Controls:  move mouse to rain · left-click for burst · ESC / right-click /
 *   Ctrl+C to quit.
 *
 * Run: bun run example/cursor-rain.ts
 */

import { CFunction, FFIType, JSCallback, type Pointer, read, toArrayBuffer } from 'bun:ffi';

import { GDI32, User32, Xaudio2_9 } from '../index';
import { ExtendedWindowStyles, ShowWindowCommand, SystemMetric, VirtualKey, WindowStyles } from '@bun-win32/user32';
import { S_OK, XAUDIO2_USE_DEFAULT_PROCESSOR } from '@bun-win32/xaudio2_9';

// ── Win32 + IXAudio2 constants ────────────────────────────────────────────────
const WM_DESTROY = 0x0002;
const WM_CLOSE = 0x0010;
const TIMER_ID = 1n;
const FRAME_INTERVAL_MS = 16; // ~60 fps
const ULW_ALPHA = 0x00000002;
const AC_SRC_OVER = 0x00;
const AC_SRC_ALPHA = 0x01;
const BI_RGB = 0;
const DIB_RGB_COLORS = 0;
// IXAudio2 COM vtable slot order from xaudio2.h.
const IUNKNOWN_RELEASE = 2;
const IXAUDIO2_CREATESOURCEVOICE = 5;
const IXAUDIO2_CREATEMASTERINGVOICE = 7;
const IXAUDIO2VOICE_DESTROYVOICE = 18;
const IXAUDIO2SOURCEVOICE_START = 19;
const IXAUDIO2SOURCEVOICE_SUBMITSOURCEBUFFER = 21;
const AudioCategory_GameEffects = 6;

// ── Audio + particle tuning ───────────────────────────────────────────────────
const SAMPLE_RATE = 44_100;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const BLOCK_ALIGN = (CHANNELS * BITS_PER_SAMPLE) / 8;
const SPLAT_SAMPLES = Math.ceil(0.07 * SAMPLE_RATE);
const MAX_PARTICLES = 2200;
const SPAWN_PER_FRAME_MOVING = 6;
const SPAWN_PER_FRAME_IDLE = 2;
const CLICK_BURST_COUNT = 80;
const GRAVITY_PX_PER_FRAME_SQ = 0.42;
const FLOOR_BOUNCE = 0.55;
const FLOOR_FRICTION = 0.78;
const LIFE_DECAY_PER_FRAME = 0.012;
const PARTICLE_RADIUS = 6;

const encodeWide = (text: string): Buffer => Buffer.from(`${text}\0`, 'utf16le');
const isKeyDown = (vKey: number): boolean => (User32.GetAsyncKeyState(vKey) & 0x8000) !== 0;

// ── Resolve screen geometry up front ──────────────────────────────────────────

const SCREEN_WIDTH = User32.GetSystemMetrics(SystemMetric.SM_CXSCREEN);
const SCREEN_HEIGHT = User32.GetSystemMetrics(SystemMetric.SM_CYSCREEN);
const DIB_STRIDE = SCREEN_WIDTH * 4;
const DIB_BYTES = DIB_STRIDE * SCREEN_HEIGHT;

console.log(`Cursor Rain — ${SCREEN_WIDTH}×${SCREEN_HEIGHT}, up to ${MAX_PARTICLES} particles, ~60 fps.`);
console.log('Move the mouse to rain. Left-click for a burst. ESC / right-click / Ctrl+C to quit.');

// ── Particle storage (Structure-of-Arrays for tight inner loops) ──────────────

const particlePositionX = new Float32Array(MAX_PARTICLES);
const particlePositionY = new Float32Array(MAX_PARTICLES);
const particleVelocityX = new Float32Array(MAX_PARTICLES);
const particleVelocityY = new Float32Array(MAX_PARTICLES);
const particleLife = new Float32Array(MAX_PARTICLES); // 1 fresh → 0 dead
const particleRed = new Uint8Array(MAX_PARTICLES);
const particleGreen = new Uint8Array(MAX_PARTICLES);
const particleBlue = new Uint8Array(MAX_PARTICLES);
let particleCount = 0;

function spawnParticle(originX: number, originY: number, isBurst: boolean): void {
  if (particleCount >= MAX_PARTICLES) return;
  const i = particleCount++;
  particlePositionX[i] = originX + (Math.random() - 0.5) * (isBurst ? 4 : 12);
  particlePositionY[i] = originY + (Math.random() - 0.5) * (isBurst ? 4 : 6);
  if (isBurst) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 7;
    particleVelocityX[i] = Math.cos(angle) * speed;
    particleVelocityY[i] = Math.sin(angle) * speed - 1.5;
  } else {
    particleVelocityX[i] = (Math.random() - 0.5) * 1.4;
    particleVelocityY[i] = -0.6 + Math.random() * 1.2;
  }
  particleLife[i] = 0.85 + Math.random() * 0.15;
  // Cycle the hue across the spectrum using a 6-sector rainbow palette.
  const hue = (performance.now() * 0.00015 + Math.random() * 0.18) % 1;
  const sector = Math.floor(hue * 6);
  const frac = hue * 6 - sector;
  const rise = Math.round(255 * frac);
  const dip = 255 - rise;
  const rgb = [[255, rise, 80], [dip, 255, 80], [80, 255, rise], [80, dip, 255], [rise, 80, 255], [255, 80, dip]][sector % 6]!;
  particleRed[i] = rgb[0]!;
  particleGreen[i] = rgb[1]!;
  particleBlue[i] = rgb[2]!;
}

// ── Window class registration ─────────────────────────────────────────────────

const wndProc = new JSCallback(
  (hWnd: bigint, msg: number, wParam: bigint, lParam: bigint): bigint => {
    if (msg === WM_CLOSE) { User32.DestroyWindow(hWnd); return 0n; }
    if (msg === WM_DESTROY) { User32.PostQuitMessage(0); return 0n; }
    return BigInt(User32.DefWindowProcW(hWnd, msg, wParam, lParam));
  },
  { args: ['u64', 'u32', 'u64', 'i64'], returns: 'i64' },
);

const className = encodeWide('BunWin32CursorRainOverlay');
// WNDCLASSEXW (80 bytes): only cbSize, lpfnWndProc, and lpszClassName matter here.
const wndClassBuffer = Buffer.alloc(80);
wndClassBuffer.writeUInt32LE(80, 0); // cbSize
wndClassBuffer.writeBigUInt64LE(BigInt(wndProc.ptr!), 8); // lpfnWndProc
wndClassBuffer.writeBigUInt64LE(BigInt(className.ptr!), 64); // lpszClassName

if (!User32.RegisterClassExW(wndClassBuffer.ptr!)) { console.error('RegisterClassExW failed.'); process.exit(1); }

const extendedStyle = ExtendedWindowStyles.WS_EX_TOPMOST | ExtendedWindowStyles.WS_EX_LAYERED |
  ExtendedWindowStyles.WS_EX_TRANSPARENT | ExtendedWindowStyles.WS_EX_TOOLWINDOW | ExtendedWindowStyles.WS_EX_NOACTIVATE;
const overlayHwnd = User32.CreateWindowExW(extendedStyle, className.ptr!, encodeWide('Cursor Rain').ptr!,
  WindowStyles.WS_POPUP | WindowStyles.WS_VISIBLE, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, 0n, 0n, 0n, null);
if (!overlayHwnd) { console.error('CreateWindowExW failed.'); process.exit(1); }

// ── Off-screen 32-bit BGRA DIB section (top-down so y=0 is the top row) ───────

const screenDC = User32.GetDC(0n);
const memoryDC = GDI32.CreateCompatibleDC(screenDC);

// BITMAPINFOHEADER: 40 bytes; biHeight negative ⇒ top-down origin, 32-bpp BI_RGB.
const bitmapInfo = Buffer.alloc(40);
bitmapInfo.writeUInt32LE(40, 0); // biSize
bitmapInfo.writeInt32LE(SCREEN_WIDTH, 4); // biWidth
bitmapInfo.writeInt32LE(-SCREEN_HEIGHT, 8); // biHeight (top-down)
bitmapInfo.writeUInt16LE(1, 12); // biPlanes
bitmapInfo.writeUInt16LE(32, 14); // biBitCount
bitmapInfo.writeUInt32LE(BI_RGB, 16);
bitmapInfo.writeUInt32LE(DIB_BYTES, 20); // biSizeImage

const dibBitsPointerBuffer = Buffer.alloc(8);
const dibBitmap = GDI32.CreateDIBSection(memoryDC, bitmapInfo.ptr!, DIB_RGB_COLORS, dibBitsPointerBuffer.ptr!, 0n, 0);
if (!dibBitmap) { console.error('CreateDIBSection failed.'); process.exit(1); }
const dibPixels = new Uint8Array(toArrayBuffer(Number(read.u64(dibBitsPointerBuffer.ptr!, 0)) as Pointer, 0, DIB_BYTES));
const previousBitmap = GDI32.SelectObject(memoryDC, dibBitmap);

// ── UpdateLayeredWindow parameter buffers (re-used every frame) ───────────────

// POINT pptDst (window position) — fixed at screen origin.
const destinationOriginBuffer = Buffer.alloc(8);
// SIZE psize (source extent) — the full screen.
const sourceSizeBuffer = Buffer.alloc(8);
sourceSizeBuffer.writeInt32LE(SCREEN_WIDTH, 0);
sourceSizeBuffer.writeInt32LE(SCREEN_HEIGHT, 4);
// POINT pptSrc — top-left of the source bitmap.
const sourceOriginBuffer = Buffer.alloc(8);
// BLENDFUNCTION pblend: {AC_SRC_OVER, 0, 255, AC_SRC_ALPHA}.
const blendFunctionBuffer = Buffer.from([AC_SRC_OVER, 0, 255, AC_SRC_ALPHA]);

// ── XAudio2 click "splat" voice (silent failure if no audio endpoint) ────────

let xaudio2Engine = 0n;
let masteringVoice = 0n;
let splatSourceVoice = 0n;
let splatBuffer: Buffer | undefined;
let splatXBuffer: Buffer | undefined;
const submitInvokers = new Map<string, ReturnType<typeof CFunction>>();

function vcall(thisPtr: bigint, slot: number, argTypes: readonly FFIType[], args: readonly unknown[], returns: FFIType = FFIType.i32): number {
  const vtable = read.u64(Number(thisPtr) as Pointer, 0);
  const method = read.u64(Number(vtable) as Pointer, slot * 8);
  const key = `${method}|${returns}|${argTypes.join(',')}`;
  let invoke = submitInvokers.get(key);
  if (invoke === undefined) {
    invoke = CFunction({ ptr: Number(method) as Pointer, args: [FFIType.u64, ...argTypes], returns });
    submitInvokers.set(key, invoke);
  }
  return invoke(thisPtr, ...args);
}

function initializeAudio(): void {
  const enginePtrBuf = Buffer.alloc(8);
  if (Xaudio2_9.XAudio2Create(enginePtrBuf.ptr!, 0, XAUDIO2_USE_DEFAULT_PROCESSOR) !== S_OK) return;
  xaudio2Engine = enginePtrBuf.readBigUInt64LE(0);

  const masterPtrBuf = Buffer.alloc(8);
  if (vcall(xaudio2Engine, IXAUDIO2_CREATEMASTERINGVOICE,
    [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.i32],
    [masterPtrBuf.ptr!, 0, 0, 0, null, null, AudioCategory_GameEffects]) !== S_OK) {
    vcall(xaudio2Engine, IUNKNOWN_RELEASE, [], [], FFIType.u32);
    xaudio2Engine = 0n;
    return;
  }
  masteringVoice = masterPtrBuf.readBigUInt64LE(0);

  // Synthesize the "splat": high-passed white noise with a snappy decay.
  splatBuffer = Buffer.alloc(SPLAT_SAMPLES * BLOCK_ALIGN);
  let previousSample = 0;
  for (let i = 0; i < SPLAT_SAMPLES; i++) {
    const noise = Math.random() * 2 - 1;
    const highPassed = noise - 0.6 * previousSample;
    previousSample = noise;
    const envelope = Math.exp(-i / (SAMPLE_RATE * 0.018));
    const sample = Math.max(-1, Math.min(1, highPassed * envelope * 0.45));
    splatBuffer.writeInt16LE(Math.round(sample * 32767), i * BLOCK_ALIGN);
  }

  // WAVEFORMATEX (18 bytes; cbSize = 0 for raw PCM).
  const waveFormat = Buffer.alloc(18);
  waveFormat.writeUInt16LE(1, 0); // WAVE_FORMAT_PCM
  waveFormat.writeUInt16LE(CHANNELS, 2);
  waveFormat.writeUInt32LE(SAMPLE_RATE, 4);
  waveFormat.writeUInt32LE(SAMPLE_RATE * BLOCK_ALIGN, 8);
  waveFormat.writeUInt16LE(BLOCK_ALIGN, 12);
  waveFormat.writeUInt16LE(BITS_PER_SAMPLE, 14);

  const sourcePtrBuf = Buffer.alloc(8);
  if (vcall(xaudio2Engine, IXAUDIO2_CREATESOURCEVOICE,
    [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.f32, FFIType.ptr, FFIType.ptr, FFIType.ptr],
    [sourcePtrBuf.ptr!, waveFormat.ptr!, 0, 4.0, null, null, null]) !== S_OK) {
    vcall(masteringVoice, IXAUDIO2VOICE_DESTROYVOICE, [], [], FFIType.void);
    vcall(xaudio2Engine, IUNKNOWN_RELEASE, [], [], FFIType.u32);
    masteringVoice = xaudio2Engine = 0n;
    return;
  }
  splatSourceVoice = sourcePtrBuf.readBigUInt64LE(0);
  vcall(splatSourceVoice, IXAUDIO2SOURCEVOICE_START, [FFIType.u32, FFIType.u32], [0, 0]);

  // XAUDIO2_BUFFER (48 bytes) — re-submitted on every click; the voice queues
  // them behind the play head so rapid clicks all sound out cleanly.
  splatXBuffer = Buffer.alloc(48);
  splatXBuffer.writeUInt32LE(splatBuffer.length, 4); // AudioBytes
  splatXBuffer.writeBigUInt64LE(BigInt(splatBuffer.ptr!), 8); // pAudioData (splatBuffer must outlive playback)
}

function playSplat(): void {
  if (!splatSourceVoice || !splatXBuffer) return;
  vcall(splatSourceVoice, IXAUDIO2SOURCEVOICE_SUBMITSOURCEBUFFER, [FFIType.ptr, FFIType.ptr], [splatXBuffer.ptr!, null]);
}

initializeAudio();

// ── Mouse / keyboard edge tracking ────────────────────────────────────────────

const cursorPointBuffer = new Int32Array(2);
let previousCursorX = SCREEN_WIDTH / 2;
let previousCursorY = SCREEN_HEIGHT / 2;
let previousLeftButtonDown = false;
let shouldQuit = false;

function pollInput(): { cursorX: number; cursorY: number; isMoving: boolean; clicked: boolean } {
  User32.GetCursorPos(cursorPointBuffer.ptr!);
  const cursorX = cursorPointBuffer[0]!;
  const cursorY = cursorPointBuffer[1]!;
  const isMoving = Math.abs(cursorX - previousCursorX) + Math.abs(cursorY - previousCursorY) > 1;
  previousCursorX = cursorX;
  previousCursorY = cursorY;

  const leftButtonDown = isKeyDown(VirtualKey.VK_LBUTTON);
  const clicked = leftButtonDown && !previousLeftButtonDown;
  previousLeftButtonDown = leftButtonDown;

  if (isKeyDown(VirtualKey.VK_ESCAPE) || isKeyDown(VirtualKey.VK_RBUTTON)) shouldQuit = true;

  return { cursorX, cursorY, isMoving, clicked };
}

// ── Physics + rendering inner loop ────────────────────────────────────────────

function stepFrame(): void {
  const { cursorX, cursorY, isMoving, clicked } = pollInput();

  const ambientSpawn = isMoving ? SPAWN_PER_FRAME_MOVING : SPAWN_PER_FRAME_IDLE;
  for (let s = 0; s < ambientSpawn; s++) spawnParticle(cursorX, cursorY, false);

  if (clicked) {
    for (let s = 0; s < CLICK_BURST_COUNT; s++) spawnParticle(cursorX, cursorY, true);
    playSplat();
  }

  // Integrate physics, compacting dead particles out in a single pass.
  let writeIndex = 0;
  for (let i = 0; i < particleCount; i++) {
    let velocityX = particleVelocityX[i]!;
    let velocityY = particleVelocityY[i]! + GRAVITY_PX_PER_FRAME_SQ;
    let positionX = particlePositionX[i]! + velocityX;
    let positionY = particlePositionY[i]! + velocityY;
    let life = particleLife[i]! - LIFE_DECAY_PER_FRAME;
    if (positionY > SCREEN_HEIGHT - 1) {
      positionY = SCREEN_HEIGHT - 1;
      velocityY = -velocityY * FLOOR_BOUNCE;
      velocityX *= FLOOR_FRICTION;
      life -= 0.04;
    }
    if (positionX < 0 || positionX > SCREEN_WIDTH - 1) {
      velocityX = -velocityX * FLOOR_BOUNCE;
      positionX = positionX < 0 ? 0 : SCREEN_WIDTH - 1;
    }
    if (life <= 0) continue;
    particlePositionX[writeIndex] = positionX;
    particlePositionY[writeIndex] = positionY;
    particleVelocityX[writeIndex] = velocityX;
    particleVelocityY[writeIndex] = velocityY;
    particleLife[writeIndex] = life;
    particleRed[writeIndex] = particleRed[i]!;
    particleGreen[writeIndex] = particleGreen[i]!;
    particleBlue[writeIndex] = particleBlue[i]!;
    writeIndex++;
  }
  particleCount = writeIndex;

  // Clear the DIB (fully transparent, premultiplied so BGRA all zero).
  dibPixels.fill(0);

  // Additively blit each particle as a small premultiplied-alpha glow disc.
  // Pixel layout per the DIB header is BGRA, top-down; clamp accumulator at 255.
  const radius = PARTICLE_RADIUS;
  const radiusSquared = radius * radius;
  for (let i = 0; i < particleCount; i++) {
    const centerX = particlePositionX[i]! | 0;
    const centerY = particlePositionY[i]! | 0;
    const life = particleLife[i]!;
    const minX = Math.max(0, centerX - radius);
    const maxX = Math.min(SCREEN_WIDTH - 1, centerX + radius);
    const minY = Math.max(0, centerY - radius);
    const maxY = Math.min(SCREEN_HEIGHT - 1, centerY + radius);
    const red = particleRed[i]!;
    const green = particleGreen[i]!;
    const blue = particleBlue[i]!;

    for (let pixelY = minY; pixelY <= maxY; pixelY++) {
      const deltaY = pixelY - centerY;
      const deltaYSquared = deltaY * deltaY;
      let offset = pixelY * DIB_STRIDE + minX * 4;
      for (let pixelX = minX; pixelX <= maxX; pixelX++) {
        const deltaX = pixelX - centerX;
        const distanceSquared = deltaX * deltaX + deltaYSquared;
        if (distanceSquared <= radiusSquared) {
          const falloff = 1 - distanceSquared / radiusSquared;
          const intensity = falloff * falloff * life; // quadratic, modulated by life
          const sB = dibPixels[offset]! + ((blue * intensity) | 0);
          const sG = dibPixels[offset + 1]! + ((green * intensity) | 0);
          const sR = dibPixels[offset + 2]! + ((red * intensity) | 0);
          const sA = dibPixels[offset + 3]! + ((255 * intensity) | 0);
          dibPixels[offset] = sB > 255 ? 255 : sB;
          dibPixels[offset + 1] = sG > 255 ? 255 : sG;
          dibPixels[offset + 2] = sR > 255 ? 255 : sR;
          dibPixels[offset + 3] = sA > 255 ? 255 : sA;
        }
        offset += 4;
      }
    }
  }

  // Blast the bitmap onto the screen with per-pixel alpha.
  User32.UpdateLayeredWindow(overlayHwnd, 0n, destinationOriginBuffer.ptr!, sourceSizeBuffer.ptr!,
    memoryDC, sourceOriginBuffer.ptr!, 0, blendFunctionBuffer.ptr!, ULW_ALPHA);

  if (shouldQuit) User32.DestroyWindow(overlayHwnd);
}

// ── Drive frames through a SetTimer + WndProc message pump ────────────────────

const timerCallback = new JSCallback(() => stepFrame(), { args: ['u64', 'u32', 'u64', 'u32'], returns: 'void' });

if (!User32.SetTimer(overlayHwnd, TIMER_ID, FRAME_INTERVAL_MS, timerCallback.ptr)) {
  console.error('SetTimer failed.'); process.exit(1);
}

User32.ShowWindow(overlayHwnd, ShowWindowCommand.SW_SHOWNOACTIVATE);

// ── Cleanup paths (SIGINT + WM_DESTROY both route here) ───────────────────────

let cleanedUp = false;
function cleanup(): void {
  if (cleanedUp) return;
  cleanedUp = true;
  User32.KillTimer(overlayHwnd, TIMER_ID);
  if (splatSourceVoice) vcall(splatSourceVoice, IXAUDIO2VOICE_DESTROYVOICE, [], [], FFIType.void);
  if (masteringVoice) vcall(masteringVoice, IXAUDIO2VOICE_DESTROYVOICE, [], [], FFIType.void);
  if (xaudio2Engine) vcall(xaudio2Engine, IUNKNOWN_RELEASE, [], [], FFIType.u32);
  GDI32.SelectObject(memoryDC, previousBitmap);
  GDI32.DeleteObject(dibBitmap);
  GDI32.DeleteDC(memoryDC);
  User32.ReleaseDC(0n, screenDC);
  User32.UnregisterClassW(className.ptr!, 0n);
  timerCallback.close();
  wndProc.close();
  console.log('Cursor Rain stopped.');
}

process.on('SIGINT', () => {
  shouldQuit = true;
  if (overlayHwnd) User32.DestroyWindow(overlayHwnd);
});

// Standard Win32 message loop. WM_DESTROY → PostQuitMessage → GetMessageW=0.
const messageBuffer = Buffer.alloc(48);
while (true) {
  const result = User32.GetMessageW(messageBuffer.ptr!, 0n, 0, 0);
  if (result <= 0) break;
  User32.TranslateMessage(messageBuffer.ptr!);
  User32.DispatchMessageW(messageBuffer.ptr!);
}

cleanup();
process.exit(0);
