/**
 * Event Horizon — a black hole that physically devours your live Windows desktop.
 *
 * This is not a video and not a screen capture: it bends the REAL, live desktop.
 * Using the Windows Magnification full-screen pipeline, every frame hands the OS
 * compositor two things at once — (a) a full-screen zoom/pan transform that ramps
 * the magnification level and sweeps the pan offset so the whole desktop is pulled
 * toward a moving singularity, and (b) a hand-packed 5x5 MAGCOLOREFFECT matrix that
 * lerps toward a redshifted, brightness-crushed transform so colors smear toward
 * red and then to black as the horizon swells. Composited on top — through a
 * click-through, topmost, per-pixel-alpha layered overlay that is excluded from
 * the magnifier's own re-sampling via SetWindowDisplayAffinity — a GDI+ accretion
 * disk swirls: a Doppler-bright leading edge, a glowing photon ring, concentric
 * additive glow halos, and infalling sparks spiraling into the dark core. A deep
 * 38 Hz XAudio2 sub-bass rumble (a single looping buffer, LoopCount = infinite,
 * no callback) swells louder as the horizon grows. The mouse — or an Xbox
 * controller's left stick — moves the singularity around the screen. The reaction
 * is visceral: "my actual desktop is being eaten by a black hole."
 *
 * CRITICAL SAFETY: this manipulates GLOBAL desktop state. The original full-screen
 * color effect is captured up front and the transform/color effect are restored on
 * EVERY exit path — normal exit, ESC, SIGINT, process 'exit', and any thrown error
 * (the loop runs inside try/finally). On RDP / remote sessions, or if the
 * Magnification runtime rejects the first set, nothing is changed and it exits 0.
 *
 * Pipeline (per frame, ~60 fps off a WM_TIMER pumped by GetMessageW):
 *   1. ease the horizon growth + drift the singularity toward the cursor/stick
 *   2. MagSetFullscreenTransform(magLevel, xOff, yOff)  — suck the desktop inward
 *   3. MagSetFullscreenColorEffect(redshift 5x5 matrix) — redshift + crush to black
 *   4. GDI+ render the accretion disk into a 32bpp PARGB bitmap
 *   5. GdipCreateHBITMAPFromBitmap -> memory DC -> UpdateLayeredWindow (AC_SRC_ALPHA)
 *   6. IXAudio2Voice::SetVolume — ramp the sub-bass with the horizon
 *
 * APIs demonstrated (Magnification):
 *   - MagInitialize / MagUninitialize
 *   - MagGetFullscreenColorEffect / MagSetFullscreenColorEffect   (5x5 matrix)
 *   - MagGetFullscreenTransform   / MagSetFullscreenTransform     (zoom + pan)
 *
 * APIs demonstrated (User32):
 *   - RegisterClassExW / CreateWindowExW (WS_POPUP + LAYERED|TOPMOST|TRANSPARENT|
 *     TOOLWINDOW|NOACTIVATE) / DestroyWindow / UnregisterClassW
 *   - SetWindowDisplayAffinity (WDA_EXCLUDEFROMCAPTURE)
 *   - UpdateLayeredWindow (per-pixel premultiplied ARGB compositing)
 *   - SetTimer / KillTimer / GetMessageW / TranslateMessage / DispatchMessageW /
 *     PostQuitMessage / DefWindowProcW + JSCallback (WndProc)
 *   - GetAsyncKeyState / GetCursorPos / GetSystemMetrics / GetDC / ReleaseDC
 *
 * APIs demonstrated (GDI32):
 *   - CreateCompatibleDC / SelectObject / DeleteObject / DeleteDC
 *
 * APIs demonstrated (Gdiplus):
 *   - GdiplusStartup / GdiplusShutdown / GdipCreateBitmapFromScan0 (32bpp PARGB)
 *   - GdipGetImageGraphicsContext / GdipSetSmoothingMode / GdipGraphicsClear
 *   - GdipCreateSolidFill / GdipCreateLineBrushFromRectWithAngle / GdipSetLineColors
 *   - GdipCreatePath / GdipAddPathArc / GdipFillEllipse / GdipFillPath
 *   - GdipCreateHBITMAPFromBitmap / GdipDelete*
 *
 * APIs demonstrated (Xaudio2_9):
 *   - XAudio2Create -> IXAudio2::CreateMasteringVoice / CreateSourceVoice
 *   - IXAudio2SourceVoice::SubmitSourceBuffer (LoopCount = infinite) / Start
 *   - IXAudio2Voice::SetVolume / DestroyVoice + IUnknown::Release  (COM vtable)
 *
 * APIs demonstrated (Xinput1_4):
 *   - XInputGetState (optional left-stick singularity control)
 *
 * APIs demonstrated (D2D1):
 *   - D2D1SinCos (native sin/cos table for the swirl angle)
 *
 * Run: bun run example/event-horizon.ts
 */

import { CFunction, FFIType, JSCallback, type Pointer, read } from 'bun:ffi';

import { D2D1, GDI32, Gdiplus, Magnification, Ole32, User32, Xinput1_4, Xaudio2_9 } from '../index';
import { CompositingMode, FillMode, PixelFormat32bppARGB, PixelFormat32bppPARGB, SmoothingMode, Status, WrapMode } from '@bun-win32/gdiplus';
import { ExtendedWindowStyles, SystemMetric, VirtualKey, WindowStyles } from '@bun-win32/user32';
import { S_OK, XAUDIO2_USE_DEFAULT_PROCESSOR } from '@bun-win32/xaudio2_9';

const NULL = 0n;
const NULL_PTR = null as unknown as Pointer;
const encode = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');
const argb = (a: number, r: number, g: number, b: number): number => (((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)) >>> 0;
const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// ── Win32 message / flag constants the package enums do not cover ──
const WM_DESTROY = 0x0002;
const WM_TIMER = 0x0113;
const WM_CLOSE = 0x0010;
const WM_MOUSEMOVE = 0x0200;
const ULW_ALPHA = 0x02; // UpdateLayeredWindow: drive composition from the BLENDFUNCTION
const WDA_EXCLUDEFROMCAPTURE = 0x11; // keep the magnifier from re-sampling our overlay
const TIMER_ID = 1n;
const FRAME_INTERVAL_MS = 16; // ~60 fps

// ── IXAudio2 / IXAudio2Voice / IXAudio2SourceVoice vtable slots (xaudio2.h order) ──
const IUNKNOWN_RELEASE = 2;
const IXAUDIO2_CREATESOURCEVOICE = 5;
const IXAUDIO2_CREATEMASTERINGVOICE = 7;
const IXAUDIO2VOICE_SETVOLUME = 12;
const IXAUDIO2VOICE_DESTROYVOICE = 18;
const IXAUDIO2SOURCEVOICE_START = 19;
const IXAUDIO2SOURCEVOICE_SUBMITSOURCEBUFFER = 21;
const XAUDIO2_LOOP_INFINITE = 255;
const XAUDIO2_DEFAULT_FREQ_RATIO = 2.0;
const AudioCategory_GameEffects = 6;

const vcallInvokers = new Map<string, ReturnType<typeof CFunction>>();

/** Invokes COM vtable slot `slot` on interface pointer `thisPtr`; memoizes the bound CFunction per (method, signature). The implicit `this` is prepended. */
function vcall(thisPtr: bigint, slot: number, argTypes: readonly FFIType[], args: readonly unknown[], returns: FFIType = FFIType.i32): number {
  const vtable = read.u64(Number(thisPtr) as Pointer, 0);
  const method = read.u64(Number(vtable) as Pointer, slot * 8);
  const key = `${method}|${returns}|${argTypes.join(',')}`;
  let invoke = vcallInvokers.get(key);
  if (invoke === undefined) {
    invoke = CFunction({ ptr: Number(method) as Pointer, args: [FFIType.u64, ...argTypes], returns });
    vcallInvokers.set(key, invoke);
  }
  return invoke(thisPtr, ...args);
}

const screenWidth = User32.GetSystemMetrics(SystemMetric.SM_CXSCREEN);
const screenHeight = User32.GetSystemMetrics(SystemMetric.SM_CYSCREEN);

// ── Shared GDI+ disk-drawing helpers (used by both the live overlay and the
//    self-contained hero capture). Declared before any global-state touch so the
//    hero path can render without going near the Magnification pipeline. ──
const gradRect = Buffer.alloc(16); // RectF for line brushes
const brushOut = Buffer.alloc(8);
const pathOut = Buffer.alloc(8);

function fillEllipseInto(graphics: bigint, color: number, cx: number, cy: number, r: number): void {
  Gdiplus.GdipCreateSolidFill(color, brushOut.ptr!);
  const brush = brushOut.readBigUInt64LE(0);
  Gdiplus.GdipFillEllipse(graphics, brush, cx - r, cy - r, r * 2, r * 2);
  Gdiplus.GdipDeleteBrush(brush);
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO CAPTURE MODE (EVENT_HORIZON_HERO=1)
//
// The live effect is a Magnification lensing of the desktop plus a per-pixel-alpha
// layered overlay — and neither the geometric zoom nor the layered overlay survive
// a screen capture on every machine. So the showcase hero shot is rendered here,
// SELF-CONTAINED: a synthetic deep-space starfield is software gravitationally
// lensed (radial deflection ∝ 1/r so stars bend into Einstein-ring arcs), then the
// demo's OWN accretion-disk routine (drawAccretionDisk, below) is composited over
// it and the result is dumped straight to PNG. This path NEVER calls MagInitialize
// or touches any global desktop state, and exits 0 the moment the file is written.
// ─────────────────────────────────────────────────────────────────────────────
if (process.env.EVENT_HORIZON_HERO === '1') {
  renderHero();
  process.exit(0);
}

// ── Sandbox / RDP guard — refuse BEFORE touching any global state ──
if (User32.GetSystemMetrics(SystemMetric.SM_REMOTESESSION) !== 0) {
  console.log('Event Horizon needs a local console session — full-screen magnification');
  console.log('effects do not apply over Remote Desktop. Nothing was changed. Exiting.');
  process.exit(0);
}

console.log('Event Horizon — a black hole devouring your live desktop.');
console.log(`  screen ${screenWidth}x${screenHeight}  ·  move the mouse (or left stick) to steer the singularity  ·  ESC to escape\n`);

// ── D2D1 native sin/cos for the swirl angle ──
D2D1.Preload(['D2D1SinCos']);
const sinBuf = Buffer.alloc(4);
const cosBuf = Buffer.alloc(4);
function d2dSinCos(angle: number): [number, number] {
  D2D1.D2D1SinCos(angle, sinBuf.ptr!, cosBuf.ptr!);
  return [sinBuf.readFloatLE(0), cosBuf.readFloatLE(0)];
}

// ── Magnification lifecycle — capture original state up front so we can restore it ──
Magnification.Preload(['MagInitialize', 'MagGetFullscreenColorEffect', 'MagSetFullscreenColorEffect', 'MagGetFullscreenTransform', 'MagSetFullscreenTransform', 'MagUninitialize']);

const IDENTITY_MATRIX = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1];
const savedColorEffect = Buffer.alloc(100); // MAGCOLOREFFECT = float[5][5]
let savedColorOk = false;
let magnificationActive = false; // true only once we have actually changed global state

if (!Magnification.MagInitialize()) {
  console.log('MagInitialize failed — the Magnification runtime is unavailable here. Nothing changed. Exiting.');
  process.exit(0);
}

// Capture the current color effect so we can put it back exactly.
savedColorOk = Magnification.MagGetFullscreenColorEffect(savedColorEffect.ptr!) !== 0;

// Probe with identity: if the OS rejects it (no compositor / locked session), bail
// without having altered anything visible.
const identityBuf = Buffer.from(new Float32Array(IDENTITY_MATRIX).buffer);
if (Magnification.MagSetFullscreenColorEffect(identityBuf.ptr!) === 0) {
  console.log('MagSetFullscreenColorEffect was rejected (no desktop compositor here). Nothing changed. Exiting.');
  Magnification.MagUninitialize();
  process.exit(0);
}
magnificationActive = true; // from here on, restoration is mandatory on every path

// Restore desktop state. Idempotent and safe to call from any exit path.
let restored = false;
function restoreDesktop(): void {
  if (restored) return;
  restored = true;
  if (magnificationActive) {
    // Color first, then geometry, so the screen snaps back cleanly.
    if (savedColorOk) Magnification.MagSetFullscreenColorEffect(savedColorEffect.ptr!);
    else Magnification.MagSetFullscreenColorEffect(identityBuf.ptr!);
    Magnification.MagSetFullscreenTransform(1.0, 0, 0);
    Magnification.MagUninitialize();
    magnificationActive = false;
  }
}

// Register the desktop-restore handlers NOW — the instant global state can be
// dirty — so any throw, SIGINT, or exit during the remaining setup still restores.
// `teardown` (hoisted below) restores the desktop FIRST, then releases everything
// that exists yet; restoreDesktop/teardown are both idempotent and null-safe.
process.on('SIGINT', () => {
  teardown();
  process.exit(0);
});
process.on('exit', restoreDesktop);
process.on('uncaughtException', (err) => {
  teardown();
  console.error(err);
  process.exit(1);
});

// ── GDI+ startup ──
Gdiplus.Preload();
function gpCheck(status: number, where: string): void {
  if (status !== Status.Ok) throw new Error(`${where} failed: ${Status[status] ?? '?'} (${status})`);
}
const gdiplusTokenBuf = Buffer.alloc(8);
const gdiplusStartupInput = Buffer.alloc(16);
gdiplusStartupInput.writeUInt32LE(1, 0); // GdiplusVersion = 1
gpCheck(Gdiplus.GdiplusStartup(gdiplusTokenBuf.ptr!, gdiplusStartupInput.ptr!, null), 'GdiplusStartup');
const gdiplusToken = gdiplusTokenBuf.readBigUInt64LE(0);

// One persistent screen-sized 32bpp premultiplied-ARGB bitmap + Graphics.
const bitmapHandleBuf = Buffer.alloc(8);
gpCheck(Gdiplus.GdipCreateBitmapFromScan0(screenWidth, screenHeight, 0, PixelFormat32bppPARGB, null, bitmapHandleBuf.ptr!), 'GdipCreateBitmapFromScan0');
const gdipBitmap = bitmapHandleBuf.readBigUInt64LE(0);

const graphicsHandleBuf = Buffer.alloc(8);
gpCheck(Gdiplus.GdipGetImageGraphicsContext(gdipBitmap, graphicsHandleBuf.ptr!), 'GdipGetImageGraphicsContext');
const gdipGraphics = graphicsHandleBuf.readBigUInt64LE(0);
gpCheck(Gdiplus.GdipSetSmoothingMode(gdipGraphics, SmoothingMode.SmoothingModeAntiAlias), 'GdipSetSmoothingMode');

// ── GDI / layered-window plumbing ──
const screenDC = User32.GetDC(NULL);
const memoryDC = GDI32.CreateCompatibleDC(screenDC);

// Persistent UpdateLayeredWindow argument structures.
const dstPoint = Buffer.alloc(8); // POINT { 0, 0 }
const srcPoint = Buffer.alloc(8); // POINT { 0, 0 }
const sizeBuf = Buffer.alloc(8); // SIZE { screenWidth, screenHeight }
sizeBuf.writeInt32LE(screenWidth, 0);
sizeBuf.writeInt32LE(screenHeight, 4);
// BLENDFUNCTION: AC_SRC_OVER(0), BlendFlags(0), SourceConstantAlpha(255), AC_SRC_ALPHA(1).
const blendFunction = Buffer.from([0, 0, 255, 1]);

// ── XAudio2 sub-bass rumble (single looping buffer, no callback) ──
let audioReady = false;
let engine = 0n;
let masterVoice = 0n;
let sourceVoice = 0n;
const SAMPLE_RATE = 44_100;
const RUMBLE_SECONDS = 1.0; // looped seamlessly; base 38 Hz divides evenly enough
const RUMBLE_HZ = 38;
const rumbleSampleCount = SAMPLE_RATE * RUMBLE_SECONDS;
const rumblePcm = Buffer.alloc(rumbleSampleCount * 2); // 16-bit mono
{
  // Deep sine at RUMBLE_HZ with a slow amplitude wobble + a touch of a sub-octave
  // partial for body. Phase wraps cleanly across the 1 s loop point.
  for (let i = 0; i < rumbleSampleCount; i += 1) {
    const t = i / SAMPLE_RATE;
    const wobble = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.5 * t);
    const fundamental = Math.sin(2 * Math.PI * RUMBLE_HZ * t);
    const subOctave = 0.35 * Math.sin(2 * Math.PI * (RUMBLE_HZ / 2) * t);
    const sample = (fundamental + subOctave) * wobble * 0.55;
    rumblePcm.writeInt16LE(clamp(Math.round(sample * 32767), -32768, 32767), i * 2);
  }
}
const rumbleXbuf = Buffer.alloc(48); // XAUDIO2_BUFFER

function startAudio(): void {
  // XAudio2's mastering voice needs COM initialized on this thread (else CO_E_NOTINITIALIZED).
  Ole32.CoInitialize(null);
  const ppEngine = Buffer.alloc(8);
  if (Xaudio2_9.XAudio2Create(ppEngine.ptr!, 0, XAUDIO2_USE_DEFAULT_PROCESSOR) !== S_OK) return;
  engine = ppEngine.readBigUInt64LE(0);

  const ppMaster = Buffer.alloc(8);
  if (vcall(engine, IXAUDIO2_CREATEMASTERINGVOICE, [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.i32], [ppMaster.ptr!, 0, 0, 0, null, null, AudioCategory_GameEffects]) !== S_OK) {
    vcall(engine, IUNKNOWN_RELEASE, [], [], FFIType.u32);
    engine = 0n;
    return;
  }
  masterVoice = ppMaster.readBigUInt64LE(0);

  // WAVEFORMATEX (18 bytes): WAVE_FORMAT_PCM, mono, 16-bit.
  const wfx = Buffer.alloc(18);
  wfx.writeUInt16LE(1, 0); // wFormatTag = WAVE_FORMAT_PCM
  wfx.writeUInt16LE(1, 2); // nChannels
  wfx.writeUInt32LE(SAMPLE_RATE, 4);
  wfx.writeUInt32LE(SAMPLE_RATE * 2, 8); // nAvgBytesPerSec
  wfx.writeUInt16LE(2, 12); // nBlockAlign
  wfx.writeUInt16LE(16, 14); // wBitsPerSample

  const ppSource = Buffer.alloc(8);
  if (vcall(engine, IXAUDIO2_CREATESOURCEVOICE, [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.f32, FFIType.ptr, FFIType.ptr, FFIType.ptr], [ppSource.ptr!, wfx.ptr!, 0, XAUDIO2_DEFAULT_FREQ_RATIO, null, null, null]) !== S_OK) {
    vcall(masterVoice, IXAUDIO2VOICE_DESTROYVOICE, [], [], FFIType.void);
    vcall(engine, IUNKNOWN_RELEASE, [], [], FFIType.u32);
    engine = 0n;
    masterVoice = 0n;
    return;
  }
  sourceVoice = ppSource.readBigUInt64LE(0);

  // XAUDIO2_BUFFER (48 bytes): Flags@0, AudioBytes@4, pAudioData@8, PlayBegin@16,
  // PlayLength@20, LoopBegin@28, LoopLength@32, LoopCount@36, pContext@40.
  // No END_OF_STREAM flag: the buffer loops forever (LoopCount = infinite).
  rumbleXbuf.writeUInt32LE(0, 0); // Flags
  rumbleXbuf.writeUInt32LE(rumblePcm.length, 4); // AudioBytes
  rumbleXbuf.writeBigUInt64LE(BigInt(rumblePcm.ptr!), 8); // pAudioData (must outlive playback)
  rumbleXbuf.writeUInt32LE(0, 28); // LoopBegin
  rumbleXbuf.writeUInt32LE(0, 32); // LoopLength = 0 => whole buffer
  rumbleXbuf.writeUInt32LE(XAUDIO2_LOOP_INFINITE, 36); // LoopCount
  if (vcall(sourceVoice, IXAUDIO2SOURCEVOICE_SUBMITSOURCEBUFFER, [FFIType.ptr, FFIType.ptr], [rumbleXbuf.ptr!, null]) !== S_OK) return;

  vcall(sourceVoice, IXAUDIO2VOICE_SETVOLUME, [FFIType.f32, FFIType.u32], [0.0, 0], FFIType.i32); // start silent, ramp in
  vcall(sourceVoice, IXAUDIO2SOURCEVOICE_START, [FFIType.u32, FFIType.u32], [0, 0]);
  audioReady = true;
}
startAudio();
if (!audioReady) console.log('  (audio disabled — no XAudio2 endpoint)');

function setRumbleVolume(v: number): void {
  if (!audioReady) return;
  vcall(sourceVoice, IXAUDIO2VOICE_SETVOLUME, [FFIType.f32, FFIType.u32], [clamp(v, 0, 4), 0], FFIType.i32);
}

// ── Simulation state ──
let singularityX = screenWidth / 2;
let singularityY = screenHeight / 2;
let targetX = singularityX;
let targetY = singularityY;
let horizon = 0; // 0 → 1 growth of the black hole
let frame = 0;
let shouldExit = false;

const startedAt = Date.now();
const durationMs = process.env.DEMO_DURATION_MS ? Math.max(0, parseInt(process.env.DEMO_DURATION_MS, 10)) : 0;

const cursorPos = new Int32Array(2);
const xinputState = Buffer.alloc(16); // XINPUT_STATE: dwPacketNumber@0, XINPUT_GAMEPAD@4 (wButtons@4, bLeftTrigger@6, bRightTrigger@7, sThumbLX@8, sThumbLY@10)
let xinputAvailable = true;

function pollInput(): void {
  if ((User32.GetAsyncKeyState(VirtualKey.VK_ESCAPE) & 0x8000) !== 0) shouldExit = true;

  // Mouse drives the singularity target.
  if (User32.GetCursorPos(cursorPos.ptr!)) {
    targetX = cursorPos[0]!;
    targetY = cursorPos[1]!;
  }

  // Optional: Xbox controller left stick nudges the target.
  if (xinputAvailable) {
    if (Xinput1_4.XInputGetState(0, xinputState.ptr!) === 0) {
      const lx = xinputState.readInt16LE(8);
      const ly = xinputState.readInt16LE(10);
      const DEAD = 7849;
      if (Math.abs(lx) > DEAD || Math.abs(ly) > DEAD) {
        targetX = clamp(targetX + (lx / 32767) * 28, 0, screenWidth);
        targetY = clamp(targetY - (ly / 32767) * 28, 0, screenHeight);
      }
    } else {
      xinputAvailable = false; // no controller — stop polling
    }
  }
}

/**
 * Draws the full accretion disk + outer glow + Doppler-beamed ring + infalling
 * sparks + photon ring + black core into `graphics`, centered at (cx,cy) with
 * event-horizon radius `baseR`. Pure with respect to global desktop state — only
 * GDI+ — so the hero capture mode (EVENT_HORIZON_HERO) can reuse the exact same
 * disk over a synthetic background without touching the Magnification pipeline.
 * `sinCos` is injected so the live path can use the D2D1 table and the hero path
 * can stay free of any preload coupling.
 */
function drawAccretionDisk(graphics: bigint, cx: number, cy: number, baseR: number, timeSec: number, horizonT: number, sinCos: (angle: number) => readonly [number, number]): void {
  const diskOuter = baseR * 2.7;
  const fill = (color: number, x: number, y: number, r: number): void => fillEllipseInto(graphics, color, x, y, r);

  // 1. Lensed outer glow — wide, faint warm halo so the disk reads as luminous.
  for (let i = 6; i >= 1; i -= 1) {
    const r = diskOuter * (0.65 + i * 0.13);
    const a = Math.round(lerp(2, 16, horizonT) * (i / 6));
    fill(argb(a, 255, 150, 70), cx, cy, r);
  }

  // 2. Accretion disk — swept arcs with a Doppler-bright leading edge. The disk
  //    is built from many thin rotating wedges; each wedge's brightness depends on
  //    whether it is approaching (blueshift-bright) or receding (redshift-dim).
  const swirl = timeSec * 1.7;
  const SEGMENTS = 72;
  for (let s = 0; s < SEGMENTS; s += 1) {
    const a0 = (s / SEGMENTS) * Math.PI * 2 + swirl;
    const [s0, c0] = sinCos(a0);
    // Approaching side (right of motion) is brighter — fake relativistic beaming.
    const beaming = 0.5 + 0.5 * c0; // 0..1, peaks on one side
    const ringR = lerp(baseR * 1.15, diskOuter, 0.5 + 0.4 * Math.sin(a0 * 2 + swirl));
    const alpha = Math.round(lerp(12, 90, beaming) * lerp(0.4, 1, horizonT));
    // Warm core that cools to orange/red on the receding side.
    const r = Math.round(lerp(255, 255, beaming));
    const g = Math.round(lerp(90, 210, beaming));
    const b = Math.round(lerp(30, 120, beaming));
    const px = cx + c0 * ringR;
    const py = cy + s0 * ringR * 0.42; // flatten the disk in Y for a tilted-plane look
    const dotR = lerp(8, 26, beaming) * lerp(0.6, 1.1, horizonT);
    fill(argb(alpha, r, g, b), px, py, dotR);
  }

  // 3. Infalling sparks spiraling toward the core.
  const SPARKS = 40;
  for (let k = 0; k < SPARKS; k += 1) {
    const phase = (k / SPARKS) * Math.PI * 2;
    const spin = timeSec * 2.6 + phase * 5;
    const fall = (timeSec * 0.35 + k * 0.137) % 1; // 0 (outer) → 1 (swallowed)
    const rad = lerp(diskOuter * 1.1, baseR * 0.85, fall);
    const [ss, cc] = sinCos(spin);
    const px = cx + cc * rad;
    const py = cy + ss * rad * 0.42;
    const a = Math.round(255 * (1 - fall) * (1 - fall));
    const size = lerp(3.5, 1, fall);
    fill(argb(a, 255, 230, 180), px, py, size);
  }

  // 4. Photon ring — a thin, intense bright circle just outside the horizon.
  const photonR = baseR * 1.05;
  Gdiplus.GdipCreatePath(FillMode.FillModeAlternate, pathOut.ptr!);
  const ringPath = pathOut.readBigUInt64LE(0);
  Gdiplus.GdipAddPathArc(ringPath, cx - photonR, cy - photonR, photonR * 2, photonR * 2, 0, 360);
  // Build a radial-ish bright brush via a line gradient hugging the ring box.
  gradRect.writeFloatLE(cx - photonR, 0);
  gradRect.writeFloatLE(cy - photonR, 4);
  gradRect.writeFloatLE(photonR * 2, 8);
  gradRect.writeFloatLE(photonR * 2, 12);
  Gdiplus.GdipCreateLineBrushFromRectWithAngle(gradRect.ptr!, argb(220, 255, 240, 210), argb(160, 255, 180, 110), 35.0, 1, WrapMode.WrapModeTileFlipXY, brushOut.ptr!);
  const ringBrush = brushOut.readBigUInt64LE(0);
  Gdiplus.GdipSetLineColors(ringBrush, argb(235, 255, 245, 220), argb(150, 255, 160, 90));
  // Stroke-like ring: fill the disk then punch the inside back to dark via the core.
  for (let i = 3; i >= 1; i -= 1) {
    fill(argb(Math.round(40 * i * horizonT), 255, 220, 160), cx, cy, photonR + i * 2);
  }
  Gdiplus.GdipFillPath(graphics, ringBrush, ringPath);
  Gdiplus.GdipDeleteBrush(ringBrush);
  Gdiplus.GdipDeletePath(ringPath);

  // 5. The black core — an opaque dark disk that grows, so the singularity reads
  //    as a true void punched through the swirling light.
  fill(argb(255, 6, 2, 10), cx, cy, baseR * 0.96);
  fill(argb(180, 0, 0, 0), cx, cy, baseR * 0.7);
}

/**
 * Self-contained Interstellar-grade hero render for the showcase, gated by
 * EVENT_HORIZON_HERO=1. Touches NO global desktop state and never initializes the
 * Magnification runtime: it synthesizes a deep-space starfield, software
 * gravitationally lenses it (radial deflection ∝ 1/r, with a pure-black shadow
 * inside the photon sphere), composites the demo's OWN accretion disk over it via
 * drawAccretionDisk(), and dumps the frame straight to
 * packages/all/screenshots/event-horizon.png. Exits the process from the caller.
 */
function renderHero(): void {
  Gdiplus.Preload();
  const heroCheck = (status: number, where: string): void => {
    if (status !== Status.Ok) throw new Error(`${where} failed: ${Status[status] ?? '?'} (${status})`);
  };

  // GdiplusStartupInput is 24 bytes on x64 (UINT32 version + pad, ptr callback, two
  // trailing BOOLs). A 16-byte buffer leaves those BOOLs as garbage → InvalidParameter.
  const tokenBuf = Buffer.alloc(8);
  const startupInput = Buffer.alloc(24);
  startupInput.writeUInt32LE(1, 0); // GdiplusVersion = 1
  heroCheck(Gdiplus.GdiplusStartup(tokenBuf.ptr!, startupInput.ptr!, null), 'GdiplusStartup');
  const token = tokenBuf.readBigUInt64LE(0);

  const W = 1920;
  const H = 1200;
  const cx = W / 2;
  const cy = H / 2;
  const sinCos = (angle: number): readonly [number, number] => [Math.sin(angle), Math.cos(angle)];

  console.log(`Event Horizon — rendering self-contained ${W}x${H} hero (no desktop touched)…`);

  // ── 1. Synthesize the deep-space SOURCE field (BGRA, top-down) ───────────────
  // A near-black blue/violet vignette + a dense starfield + a faint grid. This is
  // the undistorted sky; the lensing pass below resamples it into `dst`.
  const stride = W * 4;
  const src = Buffer.alloc(stride * H);
  const setPx = (buf: Buffer, x: number, y: number, r: number, g: number, b: number): void => {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const o = y * stride + x * 4;
    buf[o] = clamp(Math.round(b), 0, 255); // B
    buf[o + 1] = clamp(Math.round(g), 0, 255); // G
    buf[o + 2] = clamp(Math.round(r), 0, 255); // R
    buf[o + 3] = 255; // A (opaque)
  };
  const addPx = (buf: Buffer, x: number, y: number, r: number, g: number, b: number): void => {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const o = y * stride + x * 4;
    buf[o] = clamp(buf[o]! + b, 0, 255);
    buf[o + 1] = clamp(buf[o + 1]! + g, 0, 255);
    buf[o + 2] = clamp(buf[o + 2]! + r, 0, 255);
    buf[o + 3] = 255;
  };

  // Background gradient vignette: a faint blue/violet core fading to near-black edges.
  const maxD = Math.hypot(cx, cy);
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const d = Math.hypot(x - cx, y - cy) / maxD; // 0 center → 1 corner
      const v = 1 - d; // brighter toward center
      const r = 4 + 10 * v * v;
      const g = 3 + 7 * v * v;
      const b = 10 + 26 * v * v; // blue/violet bias
      setPx(src, x, y, r, g, b);
    }
  }

  // A very faint cool grid — gives the lens coherent lines to bend into arcs without
  // adding a visible wash (kept dim so the deep-space field stays near-black).
  const gridStep = 110;
  for (let gx = gridStep; gx < W; gx += gridStep) {
    for (let y = 0; y < H; y += 1) addPx(src, gx, y, 4, 6, 11);
  }
  for (let gy = gridStep; gy < H; gy += gridStep) {
    for (let x = 0; x < W; x += 1) addPx(src, x, gy, 4, 6, 11);
  }

  // Dense starfield — varied brightness/size with a few warm/cool tints. A small
  // deterministic LCG keeps the render reproducible run-to-run.
  let seed = 0x9e3779b9 >>> 0;
  const rand = (): number => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x1_0000_0000;
  };
  const STARS = 1500;
  for (let i = 0; i < STARS; i += 1) {
    const x = Math.floor(rand() * W);
    const y = Math.floor(rand() * H);
    const mag = rand();
    const bright = 55 + Math.pow(mag, 2.0) * 200; // mostly faint, a few brilliant
    // Tint: mostly white, some warm (amber) and cool (icy blue) stars.
    const tint = rand();
    let r = bright;
    let g = bright;
    let b = bright;
    if (tint > 0.86) {
      r = bright;
      g = bright * 0.82;
      b = bright * 0.6;
    } else if (tint < 0.16) {
      r = bright * 0.7;
      g = bright * 0.82;
      b = bright;
    }
    setPx(src, x, y, r, g, b);
    // Bright stars get a small cross/halo so they read as points of light.
    if (bright > 180) {
      addPx(src, x + 1, y, r * 0.4, g * 0.4, b * 0.4);
      addPx(src, x - 1, y, r * 0.4, g * 0.4, b * 0.4);
      addPx(src, x, y + 1, r * 0.4, g * 0.4, b * 0.4);
      addPx(src, x, y - 1, r * 0.4, g * 0.4, b * 0.4);
      addPx(src, x + 2, y, r * 0.15, g * 0.15, b * 0.15);
      addPx(src, x - 2, y, r * 0.15, g * 0.15, b * 0.15);
    }
  }

  // ── 2. Gravitational lens: resample SOURCE into DST with a 1/r deflection ─────
  // For each destination pixel we walk OUTWARD from where light appears to come
  // from: the ray that reaches us from screen radius r originated farther out by a
  // deflection α ∝ 1/r. Sampling the source at (r + α) bends background features
  // into Einstein-ring arcs and concentrates light just outside the shadow.
  const dst = Buffer.alloc(stride * H);
  const shadowR = 150; // pure-black event-horizon shadow radius (px)
  const ringR = shadowR * 1.02; // photon-sphere lensing radius
  const lensK = 42000; // deflection strength (tuned so the ring is brilliant, arcs visible)
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.hypot(dx, dy);
      const o = y * stride + x * 4;
      if (r <= shadowR) {
        // Inside the shadow: the void. Leave near-black (the disk/core paints later).
        dst[o] = 2;
        dst[o + 1] = 1;
        dst[o + 2] = 3;
        dst[o + 3] = 255;
        continue;
      }
      // Deflect the sample radially outward by α = lensK / r (clamped near the ring).
      const alpha = lensK / Math.max(r - shadowR * 0.6, 14);
      const sr = r + alpha; // source radius the incoming ray maps from
      const scale = sr / r;
      let sx = Math.round(cx + dx * scale);
      let sy = Math.round(cy + dy * scale);
      // Tile-mirror out-of-bounds samples so the field stays full to the corners.
      if (sx < 0) sx = -sx;
      if (sy < 0) sy = -sy;
      if (sx >= W) sx = 2 * W - 1 - sx;
      if (sy >= H) sy = 2 * H - 1 - sy;
      sx = clamp(sx, 0, W - 1);
      sy = clamp(sy, 0, H - 1);
      const so = sy * stride + sx * 4;
      // Magnification brightening near the ring (light piles up at small r).
      const boost = r < ringR + 60 ? 1 + 2.2 * (1 - (r - ringR) / 60) : 1;
      dst[o] = clamp(src[so]! * boost, 0, 255);
      dst[o + 1] = clamp(src[so + 1]! * boost, 0, 255);
      dst[o + 2] = clamp(src[so + 2]! * boost, 0, 255);
      dst[o + 3] = 255;
    }
  }

  // ── 3. Wrap the lensed field as a GDI+ bitmap + Graphics ─────────────────────
  const bmpBuf = Buffer.alloc(8);
  heroCheck(Gdiplus.GdipCreateBitmapFromScan0(W, H, stride, PixelFormat32bppARGB, dst.ptr!, bmpBuf.ptr!), 'GdipCreateBitmapFromScan0');
  const bitmap = bmpBuf.readBigUInt64LE(0);

  const gBuf = Buffer.alloc(8);
  heroCheck(Gdiplus.GdipGetImageGraphicsContext(bitmap, gBuf.ptr!), 'GdipGetImageGraphicsContext');
  const g = gBuf.readBigUInt64LE(0);
  heroCheck(Gdiplus.GdipSetSmoothingMode(g, SmoothingMode.SmoothingModeAntiAlias), 'GdipSetSmoothingMode');
  // SourceOver so the disk's translucent warm passes accumulate (additive-ish glow).
  Gdiplus.GdipSetCompositingMode(g, CompositingMode.CompositingModeSourceOver);

  // A tight, luminous gold rim-glow hugging the disk — many fine additive steps so
  // it reads as a continuous bloom around the hole and falls off fast enough to keep
  // the surrounding deep-space field dark (no muddy brown wash to the corners).
  for (let i = 120; i >= 1; i -= 1) {
    const t = i / 120;
    const rr = shadowR * (1.02 + t * 1.35);
    const a = Math.max(1, Math.round(9 * (1 - t) * (1 - t) * (1 - t) * (1 - t)));
    fillEllipseInto(g, argb(a, 255, 178, 104), cx, cy, rr);
  }

  // Disk plane geometry, shared by the back/front passes and the lensed top arc.
  const tilt = 0.3; // y-foreshortening of the tilted disk plane
  const innerR = shadowR * 1.04;
  const outerR = shadowR * 3.0;

  /**
   * Paints a dense, SMOOTH, Doppler-beamed slice of the accretion disk for angles
   * in [a0,a1]. The approaching side (left, cos<0) is beamed bright/blue-white; the
   * receding side (right) is dim/red. Many radial samples per angle make a true
   * filled glowing disk rather than a string of beads.
   */
  const paintDiskArc = (a0: number, a1: number): void => {
    const STEPS = 1300;
    for (let s = 0; s <= STEPS; s += 1) {
      const ang = a0 + (a1 - a0) * (s / STEPS);
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      // Doppler beaming: bright on the left (approaching), dim but never dark on the
      // right (receding) — a floor so the smooth band fully envelops the demo beads.
      const beam = 0.32 + 0.68 * Math.pow(0.5 - 0.5 * ca, 1.4);
      // Sample many radii across the band thickness for a filled, soft, glowing disk.
      for (let rr = 0; rr <= 1.0001; rr += 0.04) {
        const band = innerR + (outerR - innerR) * rr;
        const px = cx + ca * band;
        const py = cy + sa * band * tilt;
        // Radial brightness: bright at the inner edge, fading outward; turbulence wisps.
        const radial = (1 - rr) * (1 - rr * 0.35);
        const wisp = 0.82 + 0.18 * Math.sin(ang * 5 + rr * 9 + 2.1);
        const intensity = radial * wisp;
        const a = Math.round((26 + 70 * beam) * intensity);
        if (a <= 0) continue;
        // Approaching side runs hot blue-white (relativistic blueshift); receding
        // side cools to deep orange/red — pull red DOWN as beaming peaks.
        const r = Math.round(255 - 55 * beam * beam);
        const gg = Math.round(108 + 138 * beam);
        const b = Math.round(30 + 200 * beam * beam);
        fillEllipseInto(g, argb(a, r, gg, b), px, py, 3.0 + 6.0 * (1 - rr));
      }
    }
  };

  // ── 4. The demo's OWN accretion disk, fully grown, at a hand-picked swirl pose —
  //    drawn at the BOTTOM so its infalling sparks + photon-ring gradient sparkle
  //    THROUGH the smooth bloom that follows. horizonT = 1 (fully formed). This is
  //    the exact reused renderOverlay routine, so the hero disk matches the demo. ──
  drawAccretionDisk(g, cx, cy, shadowR, 4.3, 1, sinCos);

  // ── 5. The smooth disk — blooms over the demo wedges so the disk reads as a
  //    continuous luminous, Doppler-beamed plane (the demo sparks twinkle through).
  //    Both halves are laid down; the black core then occludes the far underside. ─
  paintDiskArc(0, Math.PI * 2);

  // ── 6. The crisp black event-horizon shadow — punched over the back disk + demo
  //    disk so the void reads true, before the front lip + top arc ride over it. ──
  fillEllipseInto(g, argb(255, 1, 0, 2), cx, cy, shadowR * 0.99);

  // ── 7. The iconic lensed TOP ARC — light from the disk behind the hole is bent up
  //    and OVER the shadow, the bright crescent that sells the 3D gravitational warp.
  for (let s = 0; s <= 760; s += 1) {
    const u = s / 760; // 0..1 across the arc
    const ang = Math.PI * (1.04 + u * 0.92); // sweep across the very top
    const ringr = ringR * (1.0 + 0.05 * Math.sin(u * Math.PI));
    const px = cx + Math.cos(ang) * ringr;
    const py = cy + Math.sin(ang) * ringr - shadowR * 0.05; // ride just above center
    const edgeFade = Math.sin(u * Math.PI); // brightest mid-arc
    const beam = 0.5 - 0.5 * Math.cos(ang); // Doppler brightening along the arc
    const a = Math.round(40 + 150 * edgeFade * (0.5 + 0.5 * beam));
    fillEllipseInto(g, argb(a, 255, Math.round(214 + 40 * beam), Math.round(160 + 90 * beam)), px, py, 1.8 + 2.4 * edgeFade);
  }

  // ── 8. The brilliant photon ring — a thin luminous annulus hugging the shadow.
  //    Bright fills just outside the rim, then the void is punched back so only a
  //    crisp ring survives. This also re-asserts a guaranteed pure-black core. ────
  for (let i = 8; i >= 1; i -= 1) {
    const a = Math.round(160 * (i / 8) * (i / 8));
    fillEllipseInto(g, argb(a, 255, 247, 224), cx, cy, ringR + 2.5 + i * 1.2);
  }
  fillEllipseInto(g, argb(255, 1, 0, 2), cx, cy, ringR - 1.5); // the void, re-punched

  // ── 9. FRONT lip of the disk — the near rim, drawn LAST so it crosses IN FRONT of
  //    the BOTTOM of the shadow (a thin beamed crescent hugging the lower edge). The
  //    lip only spans the lower screen half, so the void above the equator stays a
  //    true void; this is the layering that reads as a tilted disk seen edge-on. ──
  for (let s = 0; s <= 900; s += 1) {
    const ang = Math.PI * (s / 900); // 0..π → near (lower-screen) rim only
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const beam = Math.pow(0.5 - 0.5 * ca, 1.5);
    for (let t = 0; t <= 1.0001; t += 0.12) {
      const band = innerR + (outerR - innerR) * 0.55 * t; // a slim front band
      const px = cx + ca * band;
      const py = cy + sa * band * tilt;
      // Only keep samples at/below the equator so the lip never paints over the void.
      if (py < cy - 2) continue;
      const radial = (1 - t) * (1 - t);
      const a = Math.round((10 + 44 * beam) * radial);
      if (a <= 0) continue;
      const gg = Math.round(120 + 120 * beam);
      const b = Math.round(40 + 170 * beam * beam);
      fillEllipseInto(g, argb(a, 255, gg, b), px, py, 2.0 + 3.5 * (1 - t));
    }
  }

  // ── 6. Save PNG (encoder CLSID 557CF406-…F406, NOT the …F402 GIF) ─────────────
  const pngClsid = Buffer.alloc(16);
  pngClsid.writeUInt32LE(0x557cf406, 0);
  pngClsid.writeUInt16LE(0x1a04, 4);
  pngClsid.writeUInt16LE(0x11d3, 6);
  pngClsid.set([0x9a, 0x73, 0x00, 0x00, 0xf8, 0x1e, 0xf3, 0x2e], 8);

  const outPath = `${import.meta.dir}\\..\\screenshots\\event-horizon.png`;
  const outBuf = Buffer.from(`${outPath}\0`, 'utf16le');
  const saveStatus = Gdiplus.GdipSaveImageToFile(bitmap, outBuf.ptr!, pngClsid.ptr!, null);

  // Sample a small grid as a built-in non-black sanity probe (center dark, ring bright).
  const colorOut = Buffer.alloc(4);
  const sampleA = (px: number, py: number): number => {
    if (Gdiplus.GdipBitmapGetPixel(bitmap, Math.round(px), Math.round(py), colorOut.ptr!) !== Status.Ok) return -1;
    const c = colorOut.readUInt32LE(0);
    return Math.max((c >> 16) & 0xff, (c >> 8) & 0xff, c & 0xff); // peak channel
  };
  const centerLum = sampleA(cx, cy);
  let ringMax = 0;
  for (let a = 0; a < 16; a += 1) {
    const ang = (a / 16) * Math.PI * 2;
    ringMax = Math.max(ringMax, sampleA(cx + Math.cos(ang) * shadowR * 1.6, cy + Math.sin(ang) * shadowR * 0.7));
  }
  const cornerLum = Math.max(sampleA(20, 20), sampleA(W - 20, H - 20));

  Gdiplus.GdipDeleteGraphics(g);
  Gdiplus.GdipDisposeImage(bitmap);
  Gdiplus.GdiplusShutdown(token);

  if (saveStatus !== Status.Ok) throw new Error(`GdipSaveImageToFile failed: ${Status[saveStatus] ?? '?'} (${saveStatus})`);
  console.log(`  saved → ${outPath}  (${W}x${H})`);
  console.log(`  probe: center=${centerLum} (dark) · ring peak=${ringMax} (bright) · corner=${cornerLum} (dark)`);
}

// ── Render the accretion disk + photon ring + infalling sparks into the bitmap ──
function renderOverlay(timeSec: number): void {
  Gdiplus.GdipGraphicsClear(gdipGraphics, 0x00000000); // fully transparent
  const baseR = lerp(70, 230, horizon); // event-horizon radius grows over time
  drawAccretionDisk(gdipGraphics, singularityX, singularityY, baseR, timeSec, horizon, d2dSinCos);
}

// Present the GDI+ bitmap through UpdateLayeredWindow (fresh HBITMAP per frame).
function presentOverlay(hwnd: bigint): void {
  const hbitmapBuf = Buffer.alloc(8);
  if (Gdiplus.GdipCreateHBITMAPFromBitmap(gdipBitmap, hbitmapBuf.ptr!, 0) !== Status.Ok) return;
  const hbitmap = hbitmapBuf.readBigUInt64LE(0);
  if (!hbitmap) return;
  const prev = GDI32.SelectObject(memoryDC, hbitmap);
  User32.UpdateLayeredWindow(hwnd, screenDC, dstPoint.ptr!, sizeBuf.ptr!, memoryDC, srcPoint.ptr!, 0, blendFunction.ptr!, ULW_ALPHA);
  GDI32.SelectObject(memoryDC, prev);
  GDI32.DeleteObject(hbitmap);
}

// ── Per-frame redshift color matrix handed straight to the OS compositor ──
const colorMatrixBuf = Buffer.alloc(100);
const colorFloats = new Float32Array(colorMatrixBuf.buffer, colorMatrixBuf.byteOffset, 25);
function applyRedshift(strength: number): void {
  // Lerp identity → redshifted+crushed. We lift red's own contribution slightly,
  // bleed green/blue into red (warm smear), and crush overall brightness toward
  // black via the translation row, scaled by how close the horizon is.
  const k = clamp(strength, 0, 1);
  // Row-major 5x5: rows R,G,B,A,T ; cols R,G,B,A,T.
  colorFloats.fill(0);
  colorFloats[0] = lerp(1, 1.1, k); // R←R
  colorFloats[6] = lerp(1, 0.35, k); // G←G (drain green)
  colorFloats[12] = lerp(1, 0.18, k); // B←B (drain blue)
  colorFloats[18] = 1; // A←A
  colorFloats[24] = 1; // homogeneous
  colorFloats[5] = lerp(0, 0.45, k); // R gets some of input G (warm smear)
  colorFloats[10] = lerp(0, 0.3, k); // R gets some of input B
  // Brightness crush: negative translation on RGB pulls everything toward black.
  const crush = lerp(0, -0.45, k * k);
  colorFloats[20] = crush; // T→R
  colorFloats[21] = crush; // T→G
  colorFloats[22] = crush; // T→B
  Magnification.MagSetFullscreenColorEffect(colorMatrixBuf.ptr!);
}

// ── The frame step: ease the sim, drive the lens, render the overlay, ramp audio ──
let overlayHwnd = NULL;
function step(): void {
  pollInput();
  if (durationMs > 0 && Date.now() - startedAt >= durationMs) shouldExit = true;
  if (shouldExit) {
    User32.DestroyWindow(overlayHwnd);
    return;
  }

  frame += 1;
  const timeSec = (Date.now() - startedAt) / 1000;

  // Horizon grows smoothly over the first ~10 s, then breathes.
  const grow = clamp(timeSec / 10, 0, 1);
  horizon = grow * (0.85 + 0.15 * Math.sin(timeSec * 0.6));

  // Ease the singularity toward the cursor/stick target.
  singularityX = lerp(singularityX, targetX, 0.12);
  singularityY = lerp(singularityY, targetY, 0.12);

  // (a) Pull the desktop toward the singularity. Magnify around a point by
  //     ramping the level and offsetting the pan so the singularity stays put.
  const magLevel = lerp(1.0, 2.6, horizon);
  // To zoom about (sx, sy): unmagnified pan offset = center - (point / level).
  // The Magnification pan is in unmagnified screen pixels of the top-left source.
  const xOff = Math.round(singularityX - singularityX / magLevel);
  const yOff = Math.round(singularityY - singularityY / magLevel);
  Magnification.MagSetFullscreenTransform(magLevel, clamp(xOff, 0, screenWidth), clamp(yOff, 0, screenHeight));

  // (b) Redshift + crush toward black near the horizon.
  applyRedshift(horizon);

  // (c) Composite the accretion disk on top.
  renderOverlay(timeSec);
  presentOverlay(overlayHwnd);

  // (d) Swell the sub-bass with the horizon.
  setRumbleVolume(lerp(0, 1.6, horizon));
}

// ── Window procedure ──
const wndProc = new JSCallback(
  (hWnd: bigint, msg: number, wParam: bigint, lParam: bigint): bigint => {
    if (msg === WM_TIMER) return 0n; // real work runs in the main loop after dispatch
    if (msg === WM_MOUSEMOVE) {
      // lParam packs x in the low word, y in the high word (client == screen for a full-screen popup at 0,0).
      targetX = Number(lParam & 0xffffn);
      targetY = Number((lParam >> 16n) & 0xffffn);
      return 0n;
    }
    if (msg === WM_CLOSE) {
      User32.DestroyWindow(hWnd);
      return 0n;
    }
    if (msg === WM_DESTROY) {
      User32.PostQuitMessage(0);
      return 0n;
    }
    return BigInt(User32.DefWindowProcW(hWnd, msg, wParam, lParam));
  },
  { args: ['u64', 'u32', 'u64', 'i64'], returns: 'i64' },
);

const className = encode('BunEventHorizonOverlay');
const wndClassBuf = Buffer.alloc(80); // WNDCLASSEXW (x64)
wndClassBuf.writeUInt32LE(80, 0); // cbSize
wndClassBuf.writeBigUInt64LE(BigInt(wndProc.ptr!), 8); // lpfnWndProc
wndClassBuf.writeBigUInt64LE(BigInt(className.ptr!), 64); // lpszClassName

// ── Teardown that releases EVERYTHING; safe to call repeatedly, from any path ──
let toreDown = false;
function teardown(): void {
  if (toreDown) return;
  toreDown = true;

  // 1. Restore global desktop state FIRST — the most important guarantee. This
  //    touches only state that exists before the restore handlers were installed.
  restoreDesktop();

  // 2. Release all other resources. Wrapped so that even if this runs during the
  //    brief setup window (before some binding is initialized), the desktop has
  //    already been restored above and the process can still exit cleanly.
  try {
    if (audioReady) {
      setRumbleVolume(0);
      vcall(sourceVoice, IXAUDIO2VOICE_DESTROYVOICE, [], [], FFIType.void);
      if (masterVoice) vcall(masterVoice, IXAUDIO2VOICE_DESTROYVOICE, [], [], FFIType.void);
      if (engine) vcall(engine, IUNKNOWN_RELEASE, [], [], FFIType.u32);
      audioReady = false;
    }
    if (overlayHwnd && User32.IsWindow(overlayHwnd)) {
      User32.KillTimer(overlayHwnd, TIMER_ID);
      User32.DestroyWindow(overlayHwnd);
    }
    GDI32.DeleteDC(memoryDC);
    User32.ReleaseDC(NULL, screenDC);
    Gdiplus.GdipDeleteGraphics(gdipGraphics);
    Gdiplus.GdipDisposeImage(gdipBitmap);
    Gdiplus.GdiplusShutdown(gdiplusToken);
    User32.UnregisterClassW(className.ptr!, NULL);
  } catch {
    // Desktop is already restored; swallow setup-window teardown races.
  }
}

// ── Main: window + timer + message loop, wrapped so a throw still restores ──
try {
  const classAtom = User32.RegisterClassExW(wndClassBuf.ptr!);
  if (!classAtom) throw new Error('RegisterClassExW failed');

  overlayHwnd = User32.CreateWindowExW(
    ExtendedWindowStyles.WS_EX_TOPMOST | ExtendedWindowStyles.WS_EX_LAYERED | ExtendedWindowStyles.WS_EX_TRANSPARENT | ExtendedWindowStyles.WS_EX_TOOLWINDOW | ExtendedWindowStyles.WS_EX_NOACTIVATE,
    className.ptr!,
    encode('Event Horizon').ptr!,
    WindowStyles.WS_POPUP | WindowStyles.WS_VISIBLE,
    0,
    0,
    screenWidth,
    screenHeight,
    NULL,
    NULL,
    NULL,
    NULL_PTR,
  );
  if (!overlayHwnd) throw new Error('CreateWindowExW failed');

  // Keep the magnifier from re-sampling our own glow (would create a feedback loop).
  // EVENT_HORIZON_CAPTURE=1 disables this so the accretion disk shows in a screenshot.
  if (!process.env.EVENT_HORIZON_CAPTURE) {
    User32.SetWindowDisplayAffinity(overlayHwnd, WDA_EXCLUDEFROMCAPTURE);
  }

  // First paint before the timer so the overlay is never blank.
  renderOverlay(0);
  presentOverlay(overlayHwnd);

  if (!User32.SetTimer(overlayHwnd, TIMER_ID, FRAME_INTERVAL_MS, NULL_PTR)) throw new Error('SetTimer failed');

  // Drive frames from the main loop (not the WndProc) so GetAsyncKeyState polling
  // happens outside dispatcher reentrancy; WM_TIMER still wakes GetMessageW promptly.
  const msgBuffer = Buffer.alloc(48);
  let lastTickAt = 0;
  while (!shouldExit) {
    const result = User32.GetMessageW(msgBuffer.ptr!, NULL, 0, 0);
    if (result <= 0) break;
    User32.TranslateMessage(msgBuffer.ptr!);
    User32.DispatchMessageW(msgBuffer.ptr!);
    const now = Date.now();
    if (now - lastTickAt >= FRAME_INTERVAL_MS - 2) {
      lastTickAt = now;
      step();
    }
  }
} finally {
  teardown();
}

console.log('\n  The horizon collapsed. Your desktop has been returned, intact.\n');
wndProc.close();
process.exit(0);
