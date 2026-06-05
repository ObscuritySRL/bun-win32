/**
 * Oscilloscope Music — sound that draws itself. A real `IXAudio2` engine plays a
 * STEREO 48 kHz PCM stream synthesized live in TypeScript, where the Left and
 * Right channels are not "audio for a picture" but the picture itself: the L
 * sample is the X coordinate and the R sample is the Y coordinate of a vector
 * figure, so an XY (Lissajous) plot of the speaker output traces a recognizable
 * shape. A square window renders that same XY trace as a glowing green-phosphor
 * oscilloscope — anti-aliased poly-line over a slowly-decaying persistence
 * framebuffer, a brighter beam head, and a soft bloom — so you literally SEE the
 * waveform draw the figure while you HEAR its tone. A GDI HUD labels the current
 * figure, its Lissajous a:b ratio, phase, rotation, and live fps. An Xbox
 * controller morphs the figure in real time (left stick → frequency ratio,
 * right stick → phase + rotation); with no controller it auto-cycles through a
 * gallery of figures (circle, ellipse, infinity, star, butterfly, spirograph,
 * the word "BUN") so it is mesmerizing unattended.
 *
 * Pipeline (every step is a real FFI call):
 *
 *   1. Xaudio2_9.XAudio2Create                  — boot a real IXAudio2 engine
 *   2. IXAudio2::CreateMasteringVoice           — open the default endpoint
 *   3. IXAudio2::CreateSourceVoice              — a 16-bit STEREO PCM voice
 *   4. (synthesize x(t),y(t) → interleaved L=x,R=y) — the figure IS the audio
 *   5. IXAudio2SourceVoice::SubmitSourceBuffer  — stream a ring of blocks forever
 *   6. IXAudio2SourceVoice::Start / GetState     — keep ≥4 buffers queued
 *   7. User32 window + GDI32 back-buffer scope   — paint the same XY samples
 *   8. Xinput1_4.XInputGetState                  — morph the figure live
 *   9. DestroyVoice / Release / DeleteObject     — clean teardown
 *
 * APIs demonstrated:
 *   - Xaudio2_9.XAudio2Create + IXAudio2::{CreateMasteringVoice, CreateSourceVoice}
 *   - IXAudio2SourceVoice::{Start, SubmitSourceBuffer, GetState, DestroyVoice}
 *   - IXAudio2MasteringVoice::DestroyVoice + IUnknown::Release
 *   - User32.{RegisterClassExW, CreateWindowExW, ShowWindow, UpdateWindow,
 *             GetDC, ReleaseDC, PeekMessageW, TranslateMessage, DispatchMessageW,
 *             DefWindowProcW, DestroyWindow, PostQuitMessage, GetSystemMetrics,
 *             GetAsyncKeyState, UnregisterClassW}
 *   - GDI32.{CreateCompatibleDC, CreateCompatibleBitmap, SelectObject, CreatePen,
 *            CreateSolidBrush, MoveToEx, LineTo, Polyline, Rectangle, SetPixel,
 *            SetBkMode, SetTextColor, CreateFontW, TextOutW, BitBlt, DeleteObject,
 *            DeleteDC}
 *   - Xinput1_4.XInputGetState
 *
 * Run: bun run packages/all/example/oscilloscope-music.ts
 */

import { CFunction, FFIType, JSCallback, read, type Pointer } from 'bun:ffi';

import { GDI32, Ole32, User32, Xaudio2_9, Xinput1_4 } from '../index';
import { ExtendedWindowStyles, ShowWindowCommand, VirtualKey, WindowStyles } from '@bun-win32/user32';
import { S_OK, XAUDIO2_USE_DEFAULT_PROCESSOR } from '@bun-win32/xaudio2_9';

// ──────────────────────────────────────────────────────────────────────────────
// Constants

const NULL = 0n;
const NULL_PTR = null as unknown as Pointer;
const encode = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');

const WINDOW_SIZE = 900; // square window → round scope
const SCOPE_MARGIN = 70; // px from window edge to the scope's drawing radius
const FRAME_INTERVAL_MS = 16; // ~62 fps target for the PeekMessage pump

const WM_DESTROY = 0x0002;
const WM_CLOSE = 0x0010;
const WM_KEYDOWN = 0x0100;
const PM_REMOVE = 0x0001;

// XInput.
const ERROR_SUCCESS = 0;
const ERROR_DEVICE_NOT_CONNECTED = 0x048f;
const XINPUT_STICK_DEADZONE = 7000;

// XAudio2 vtable slots (xaudio2.h declaration order).
const IUNKNOWN_RELEASE = 2;
const IXAUDIO2_CREATESOURCEVOICE = 5;
const IXAUDIO2_CREATEMASTERINGVOICE = 7;
const IXAUDIO2VOICE_DESTROYVOICE = 18;
const IXAUDIO2SOURCEVOICE_START = 19;
const IXAUDIO2SOURCEVOICE_SUBMITSOURCEBUFFER = 21;
const IXAUDIO2SOURCEVOICE_GETSTATE = 25;

const XAUDIO2_DEFAULT_FREQ_RATIO = 2.0;
const AUDIO_CATEGORY_GAME_EFFECTS = 6;

// Stereo 16-bit PCM at 48 kHz — Left = X, Right = Y.
const SAMPLE_RATE = 48_000;
const CHANNELS = 2;
const BITS = 16;
const BLOCK_ALIGN = (CHANNELS * BITS) / 8; // 4 bytes per L/R frame
const BLOCK_FRAMES = 2048; // audio frames per streamed buffer (~43 ms)
const RING_COUNT = 4; // long-lived buffers kept queued so the stream never starves

// GDI back-buffer color refs (COLORREF is 0x00BBGGRR).
const rgb = (r: number, g: number, b: number): number => (r & 0xff) | ((g & 0xff) << 8) | ((b & 0xff) << 16);
const COLOR_BG = rgb(2, 6, 4);
const COLOR_GRID = rgb(8, 34, 16);
const COLOR_AXIS = rgb(14, 52, 26);
const COLOR_TRACE = rgb(120, 255, 150);
const COLOR_HEAD = rgb(220, 255, 230);
const COLOR_HUD = rgb(120, 255, 170);
const COLOR_HUD_DIM = rgb(60, 140, 90);

// GDI stock/object constants.
const PS_SOLID = 0;
const TRANSPARENT = 1;
const SRCCOPY = 0x00cc0020;
const FW_SEMIBOLD = 600;
const DEFAULT_CHARSET = 1;
const CLEARTYPE_QUALITY = 5;
const FF_DONTCARE = 0;

// ──────────────────────────────────────────────────────────────────────────────
// COM vtable invoker — copied from xaudio2_9-fm-synth.ts. The implicit `this`
// u64 is PREPENDED by the helper, so the argTypes passed EXCLUDE `this`.

const invokers = new Map<string, ReturnType<typeof CFunction>>();

function vcall(thisPtr: bigint, slot: number, argTypes: readonly FFIType[], args: readonly unknown[], returns: FFIType = FFIType.i32): number {
  const vtable = read.u64(Number(thisPtr) as Pointer, 0);
  const method = read.u64(Number(vtable) as Pointer, slot * 8);
  const key = `${method}|${returns}|${argTypes.join(',')}`;
  let invoke = invokers.get(key);
  if (invoke === undefined) {
    invoke = CFunction({ ptr: Number(method) as Pointer, args: [FFIType.u64, ...argTypes], returns });
    invokers.set(key, invoke);
  }
  return invoke(thisPtr, ...args);
}

const hex = (hr: number): string => `0x${(hr >>> 0).toString(16).padStart(8, '0')}`;

// ──────────────────────────────────────────────────────────────────────────────
// Figures — each maps a phase u ∈ [0,1) to a unit-ish (x,y) in [-1,1]. Lissajous
// figures use the live (a,b) ratio + phase; stroked text is a precomputed path.

interface Figure {
  name: string;
  /** Returns [x, y] for parametric phase u ∈ [0,1). */
  sample(u: number, a: number, b: number, phase: number): [number, number];
}

/** Stroke a word into a closed parametric path of unit-space line segments. */
function strokePath(strokes: ReadonlyArray<ReadonlyArray<[number, number]>>): (u: number) => [number, number] {
  // Flatten all strokes into one polyline, distributing samples by segment length.
  const segs: { ax: number; ay: number; bx: number; by: number; len: number }[] = [];
  let total = 0;
  for (const stroke of strokes) {
    for (let i = 0; i < stroke.length - 1; i += 1) {
      const [ax, ay] = stroke[i]!;
      const [bx, by] = stroke[i + 1]!;
      const len = Math.hypot(bx - ax, by - ay) + 0.0001;
      segs.push({ ax, ay, bx, by, len });
      total += len;
    }
  }
  return (u: number): [number, number] => {
    let dist = (((u % 1) + 1) % 1) * total;
    for (const s of segs) {
      if (dist <= s.len) {
        const t = dist / s.len;
        return [s.ax + (s.bx - s.ax) * t, s.ay + (s.by - s.ay) * t];
      }
      dist -= s.len;
    }
    const last = segs[segs.length - 1]!;
    return [last.bx, last.by];
  };
}

// "BUN" stroked in a blocky vector font, centered around the origin in [-1,1].
const bunStrokes: ReadonlyArray<ReadonlyArray<[number, number]>> = [
  // B
  [
    [-0.78, 0.5],
    [-0.78, -0.5],
    [-0.5, -0.5],
    [-0.42, -0.36],
    [-0.5, -0.22],
    [-0.78, -0.22],
    [-0.5, -0.22],
    [-0.4, -0.06],
    [-0.5, 0.5],
    [-0.78, 0.5],
  ],
  // U
  [
    [-0.18, -0.5],
    [-0.18, 0.34],
    [-0.08, 0.5],
    [0.08, 0.5],
    [0.18, 0.34],
    [0.18, -0.5],
  ],
  // N
  [
    [0.42, 0.5],
    [0.42, -0.5],
    [0.78, 0.5],
    [0.78, -0.5],
  ],
];
const bunPath = strokePath(bunStrokes);

const figures: Figure[] = [
  {
    name: 'CIRCLE',
    sample: (u) => [Math.cos(2 * Math.PI * u), Math.sin(2 * Math.PI * u)],
  },
  {
    name: 'LISSAJOUS',
    sample: (u, a, b, phase) => [Math.sin(2 * Math.PI * a * u + phase), Math.sin(2 * Math.PI * b * u)],
  },
  {
    name: 'INFINITY',
    sample: (u) => {
      const t = 2 * Math.PI * u;
      const d = 1 + Math.sin(t) ** 2;
      return [Math.cos(t) / d, ((Math.sin(t) * Math.cos(t)) / d) * 1.6];
    },
  },
  {
    name: 'STAR',
    sample: (u) => {
      const t = 2 * Math.PI * u;
      const r = 0.55 + 0.42 * Math.cos(5 * t);
      return [r * Math.cos(t), r * Math.sin(t)];
    },
  },
  {
    name: 'BUTTERFLY',
    sample: (u) => {
      const t = 2 * Math.PI * u * 3; // 3 loops fill the wings
      const r = (Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) - Math.sin(t / 12) ** 5) / 4.2;
      return [r * Math.sin(t), r * Math.cos(t)];
    },
  },
  {
    name: 'SPIROGRAPH',
    sample: (u, a, b) => {
      const t = 2 * Math.PI * u;
      const R = 0.62;
      const r = 0.24 + 0.02 * a;
      const d = 0.42 + 0.02 * b;
      const k = (R - r) / r;
      return [((R - r) * Math.cos(t) + d * Math.cos(k * t)) * 1.05, ((R - r) * Math.sin(t) - d * Math.sin(k * t)) * 1.05];
    },
  },
  {
    name: '"BUN"',
    sample: (u) => bunPath(u),
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Live figure parameters (morphed by the controller / auto-cycle).

let figureIndex = 0;
let ratioA = 3; // Lissajous numerator (left stick X)
let ratioB = 2; // Lissajous denominator (left stick Y)
let phase = Math.PI / 2; // right stick X → phase offset
let rotation = 0; // right stick Y → rotation of the whole figure
let figureFreq = 110; // Hz — how fast the beam retraces the figure (perceived pitch)
let curvePhase = 0; // running phase accumulator across streamed blocks (frames)
let autoMorph = true; // becomes false once any controller is detected

// The most-recently synthesized block, mirrored for the on-screen scope so the
// picture is exactly the samples sent to the speakers.
const scopeX = new Float32Array(BLOCK_FRAMES);
const scopeY = new Float32Array(BLOCK_FRAMES);

// ──────────────────────────────────────────────────────────────────────────────
// Audio engine bootstrap. XAudio2's mastering voice is COM-backed, so STA must be
// initialized on this thread before CreateMasteringVoice (else CO_E_NOTINITIALIZED).

Ole32.CoInitialize(NULL_PTR);

const ppEngine = Buffer.alloc(8);
const createHr = Xaudio2_9.XAudio2Create(ppEngine.ptr!, 0, XAUDIO2_USE_DEFAULT_PROCESSOR);
if (createHr !== S_OK) {
  console.log(`Oscilloscope Music: XAudio2Create failed (${hex(createHr)}). No audio here — exiting.`);
  process.exit(0);
}
const engine = ppEngine.readBigUInt64LE(0);

const ppMaster = Buffer.alloc(8);
const masterHr = vcall(engine, IXAUDIO2_CREATEMASTERINGVOICE, [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.i32], [ppMaster.ptr!, 0, 0, 0, null, null, AUDIO_CATEGORY_GAME_EFFECTS]);
if (masterHr !== S_OK) {
  console.log(`Oscilloscope Music: no audio endpoint (CreateMasteringVoice ${hex(masterHr)}). Exiting cleanly.`);
  vcall(engine, IUNKNOWN_RELEASE, [], [], FFIType.u32);
  process.exit(0);
}
const master = ppMaster.readBigUInt64LE(0);

// STEREO WAVEFORMATEX (18 bytes; cbSize = 0 for PCM).
const wfx = Buffer.alloc(18);
wfx.writeUInt16LE(1, 0); // WAVE_FORMAT_PCM
wfx.writeUInt16LE(CHANNELS, 2);
wfx.writeUInt32LE(SAMPLE_RATE, 4);
wfx.writeUInt32LE(SAMPLE_RATE * BLOCK_ALIGN, 8); // nAvgBytesPerSec
wfx.writeUInt16LE(BLOCK_ALIGN, 12);
wfx.writeUInt16LE(BITS, 14);
wfx.writeUInt16LE(0, 16);

const ppSource = Buffer.alloc(8);
const srcHr = vcall(engine, IXAUDIO2_CREATESOURCEVOICE, [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.f32, FFIType.ptr, FFIType.ptr, FFIType.ptr], [ppSource.ptr!, wfx.ptr!, 0, XAUDIO2_DEFAULT_FREQ_RATIO, null, null, null]);
if (srcHr !== S_OK) {
  console.log(`Oscilloscope Music: CreateSourceVoice failed (${hex(srcHr)}). Exiting.`);
  vcall(master, IXAUDIO2VOICE_DESTROYVOICE, [], [], FFIType.void);
  vcall(engine, IUNKNOWN_RELEASE, [], [], FFIType.u32);
  process.exit(0);
}
const source = ppSource.readBigUInt64LE(0);

// Ring of long-lived interleaved L/R buffers + their XAUDIO2_BUFFER descriptors.
// Keep both referenced for the whole run so GC cannot free a buffer the mixer is
// still reading.
const ringPcm: Buffer[] = [];
const ringDesc: Buffer[] = [];
for (let i = 0; i < RING_COUNT; i += 1) {
  ringPcm.push(Buffer.alloc(BLOCK_FRAMES * BLOCK_ALIGN));
  ringDesc.push(Buffer.alloc(48)); // XAUDIO2_BUFFER
}
let ringCursor = 0;

/** Synthesize one streamed block into ring slot `slot`, advancing curvePhase. */
function synthBlock(slot: number): void {
  const pcm = ringPcm[slot]!;
  const fig = figures[figureIndex]!;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  // Frames the beam needs to retrace the whole figure once at figureFreq.
  const framesPerCycle = SAMPLE_RATE / figureFreq;
  for (let i = 0; i < BLOCK_FRAMES; i += 1) {
    const u = (curvePhase + i) / framesPerCycle;
    let [x, y] = fig.sample(u, ratioA, ratioB, phase);
    // Rotate the whole figure, then gently clamp to the unit box for the scope.
    const rx = x * cosR - y * sinR;
    const ry = x * sinR + y * cosR;
    x = Math.max(-1, Math.min(1, rx * 0.92));
    y = Math.max(-1, Math.min(1, ry * 0.92));
    scopeX[i] = x;
    scopeY[i] = y;
    const off = i * BLOCK_ALIGN;
    pcm.writeInt16LE(Math.round(x * 30000), off); // Left = X
    pcm.writeInt16LE(Math.round(y * 30000), off + 2); // Right = Y
  }
  curvePhase = (curvePhase + BLOCK_FRAMES) % (framesPerCycle * 4096);
}

/** Submit ring slot `slot` to the source voice (streams forever — no EOS flag). */
function submitBlock(slot: number): boolean {
  const pcm = ringPcm[slot]!;
  const desc = ringDesc[slot]!;
  desc.writeUInt32LE(0, 0); // Flags — NOT end-of-stream
  desc.writeUInt32LE(pcm.length, 4); // AudioBytes
  desc.writeBigUInt64LE(BigInt(pcm.ptr!), 8); // pAudioData (kept alive in ringPcm)
  const hr = vcall(source, IXAUDIO2SOURCEVOICE_SUBMITSOURCEBUFFER, [FFIType.ptr, FFIType.ptr], [desc.ptr!, null]);
  return hr === S_OK;
}

// Prime the ring before Start so playback begins with a full queue.
for (let i = 0; i < RING_COUNT; i += 1) {
  synthBlock(i);
  submitBlock(i);
  ringCursor = (ringCursor + 1) % RING_COUNT;
}
vcall(source, IXAUDIO2SOURCEVOICE_START, [FFIType.u32, FFIType.u32], [0, 0]);

const voiceState = Buffer.alloc(24); // XAUDIO2_VOICE_STATE: ctx@0, BuffersQueued@8, SamplesPlayed@16

/** Keep the queue topped up to RING_COUNT buffers; synth fresh blocks as needed. */
function pumpAudio(): void {
  vcall(source, IXAUDIO2SOURCEVOICE_GETSTATE, [FFIType.ptr, FFIType.u32], [voiceState.ptr!, 0], FFIType.void);
  let queued = voiceState.readUInt32LE(8);
  while (queued < RING_COUNT) {
    synthBlock(ringCursor);
    if (!submitBlock(ringCursor)) break;
    ringCursor = (ringCursor + 1) % RING_COUNT;
    queued += 1;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// GDI back-buffer + phosphor scope.

const screenDc = User32.GetDC(NULL); // a screen DC to make compatible objects from
const backDc = GDI32.CreateCompatibleDC(screenDc);
const backBitmap = GDI32.CreateCompatibleBitmap(screenDc, WINDOW_SIZE, WINDOW_SIZE);
const oldBackBitmap = GDI32.SelectObject(backDc, backBitmap);
User32.ReleaseDC(NULL, screenDc);

const tracePen = GDI32.CreatePen(PS_SOLID, 2, COLOR_TRACE);
const bloomPen = GDI32.CreatePen(PS_SOLID, 5, rgb(20, 90, 40));
const gridPen = GDI32.CreatePen(PS_SOLID, 1, COLOR_GRID);
const axisPen = GDI32.CreatePen(PS_SOLID, 1, COLOR_AXIS);
const bgBrush = GDI32.CreateSolidBrush(COLOR_BG);

const hudFont = GDI32.CreateFontW(22, 0, 0, 0, FW_SEMIBOLD, 0, 0, 0, DEFAULT_CHARSET, 0, 0, CLEARTYPE_QUALITY, FF_DONTCARE, encode('Consolas').ptr!);
const titleFont = GDI32.CreateFontW(40, 0, 0, 0, FW_SEMIBOLD, 0, 0, 0, DEFAULT_CHARSET, 0, 0, CLEARTYPE_QUALITY, FF_DONTCARE, encode('Consolas').ptr!);
const oldFont = GDI32.SelectObject(backDc, hudFont);

GDI32.SetBkMode(backDc, TRANSPARENT);

const center = WINDOW_SIZE / 2;
const scopeRadius = center - SCOPE_MARGIN;

// Reusable Int32Array of POINT pairs for Polyline (one screen point per audio frame).
const polyPoints = new Int32Array(BLOCK_FRAMES * 2);

function paintGrid(): void {
  // Full background.
  GDI32.SelectObject(backDc, bgBrush);
  const noPen = GDI32.SelectObject(backDc, GDI32.GetStockObject(8)); // NULL_PEN = 8
  GDI32.Rectangle(backDc, 0, 0, WINDOW_SIZE, WINDOW_SIZE);
  GDI32.SelectObject(backDc, noPen);
  // Concentric grid rings + radial spokes for an authentic scope graticule.
  GDI32.SelectObject(backDc, gridPen);
  for (let r = scopeRadius / 4; r <= scopeRadius + 1; r += scopeRadius / 4) {
    GDI32.Ellipse(backDc, Math.round(center - r), Math.round(center - r), Math.round(center + r), Math.round(center + r));
  }
  // Cross-hair axes.
  GDI32.SelectObject(backDc, axisPen);
  GDI32.MoveToEx(backDc, center - scopeRadius, center, NULL_PTR);
  GDI32.LineTo(backDc, center + scopeRadius, center);
  GDI32.MoveToEx(backDc, center, center - scopeRadius, NULL_PTR);
  GDI32.LineTo(backDc, center, center + scopeRadius);
}

let fpsEma = 60;
let lastFrameTime = performance.now();

function renderScope(): void {
  // Phosphor persistence: instead of a hard clear, repaint the grid (which is
  // dark) — the previous trace was drawn over it, so this naturally dims the old
  // beam while the static graticule stays crisp. The decaying-glow look comes
  // from drawing the new trace bright over the freshly-dark field every frame.
  paintGrid();

  // Map this block's XY samples → screen points.
  for (let i = 0; i < BLOCK_FRAMES; i += 1) {
    polyPoints[i * 2] = Math.round(center + scopeX[i]! * scopeRadius);
    polyPoints[i * 2 + 1] = Math.round(center - scopeY[i]! * scopeRadius); // screen Y grows down
  }

  // Soft bloom underlay, then the crisp bright trace on top.
  GDI32.SelectObject(backDc, bloomPen);
  GDI32.Polyline(backDc, polyPoints.ptr!, BLOCK_FRAMES);
  GDI32.SelectObject(backDc, tracePen);
  GDI32.Polyline(backDc, polyPoints.ptr!, BLOCK_FRAMES);

  // Bright beam head — the last few samples, plus a hot pixel at the very tip.
  const headX = polyPoints[(BLOCK_FRAMES - 1) * 2]!;
  const headY = polyPoints[(BLOCK_FRAMES - 1) * 2 + 1]!;
  GDI32.SetPixel(backDc, headX, headY, COLOR_HEAD);
  GDI32.SetPixel(backDc, headX + 1, headY, COLOR_HEAD);
  GDI32.SetPixel(backDc, headX, headY + 1, COLOR_HEAD);

  // HUD.
  const now = performance.now();
  const dt = now - lastFrameTime;
  lastFrameTime = now;
  if (dt > 0) fpsEma = fpsEma * 0.9 + (1000 / dt) * 0.1;

  const fig = figures[figureIndex]!;
  GDI32.SelectObject(backDc, titleFont);
  GDI32.SetTextColor(backDc, COLOR_HUD);
  const title = `OSCILLOSCOPE  ${fig.name}`;
  const titleBuf = encode(title);
  GDI32.TextOutW(backDc, 28, 24, titleBuf.ptr!, title.length);

  GDI32.SelectObject(backDc, hudFont);
  GDI32.SetTextColor(backDc, COLOR_HUD_DIM);
  const line2 = `a:b ${ratioA}:${ratioB}   phase ${phase.toFixed(2)}   rot ${(rotation % (2 * Math.PI)).toFixed(2)}   ${figureFreq.toFixed(0)} Hz`;
  const l2 = encode(line2);
  GDI32.TextOutW(backDc, 30, 72, l2.ptr!, line2.length);

  const mode = autoMorph ? 'auto-cycling  ·  plug in an Xbox controller to morph' : 'L-stick: a:b ratio   R-stick: phase + rotation';
  const l3 = encode(mode);
  GDI32.TextOutW(backDc, 30, WINDOW_SIZE - 64, l3.ptr!, mode.length);

  const footer = `${fpsEma.toFixed(0)} fps   L=X  R=Y   stereo 48k   ESC to quit`;
  const l4 = encode(footer);
  GDI32.TextOutW(backDc, 30, WINDOW_SIZE - 36, l4.ptr!, footer.length);
}

function blitToWindow(hwnd: bigint): void {
  const hdc = User32.GetDC(hwnd);
  if (hdc === NULL) return;
  GDI32.BitBlt(hdc, 0, 0, WINDOW_SIZE, WINDOW_SIZE, backDc, 0, 0, SRCCOPY);
  User32.ReleaseDC(hwnd, hdc);
}

// ──────────────────────────────────────────────────────────────────────────────
// Input — morph the figure live, or auto-cycle the gallery.

const xinputState = Buffer.alloc(16); // XINPUT_STATE
let autoCycleAccumulator = 0;

function applyDeadzone(raw: number): number {
  if (Math.abs(raw) <= XINPUT_STICK_DEADZONE) return 0;
  const sign = Math.sign(raw);
  return sign * Math.min(1, (Math.abs(raw) - XINPUT_STICK_DEADZONE) / (32767 - XINPUT_STICK_DEADZONE));
}

let lastPollTime = performance.now();

function pollInput(): void {
  const now = performance.now();
  const dt = Math.min(100, now - lastPollTime); // real elapsed ms, clamped against stalls
  lastPollTime = now;

  let steering = false;
  const result = Xinput1_4.XInputGetState(0, xinputState.ptr!);
  if (result === ERROR_SUCCESS) {
    autoMorph = false;
    const lx = applyDeadzone(xinputState.readInt16LE(8));
    const ly = applyDeadzone(xinputState.readInt16LE(10));
    const rx = applyDeadzone(xinputState.readInt16LE(12));
    const ry = applyDeadzone(xinputState.readInt16LE(14));
    // Force the Lissajous figure whenever the left stick is steering the ratio.
    if (lx !== 0 || ly !== 0) {
      steering = true;
      figureIndex = 1; // LISSAJOUS
      ratioA = Math.max(1, Math.min(9, Math.round(3 + lx * 5)));
      ratioB = Math.max(1, Math.min(9, Math.round(2 + ly * 5)));
      autoCycleAccumulator = 0; // hold the figure while the player steers
    }
    phase += rx * 0.06;
    rotation += ry * 0.04;
    // Triggers nudge the retrace rate (perceived pitch) when present.
    const lt = xinputState.readUInt8(6);
    const rtTrig = xinputState.readUInt8(7);
    if (lt > 30 || rtTrig > 30) figureFreq = Math.max(40, Math.min(420, figureFreq + (rtTrig - lt) * 0.02));
  } else if (result === ERROR_DEVICE_NOT_CONNECTED) {
    autoMorph = true;
  }

  // Always keep the scope alive: gentle drift + gallery auto-cycle paced by real
  // elapsed time — unless the player is actively steering the ratio with the L-stick.
  if (!steering) {
    phase += 0.012;
    rotation += 0.006;
    autoCycleAccumulator += dt;
    if (autoCycleAccumulator >= 5200) {
      autoCycleAccumulator = 0;
      figureIndex = (figureIndex + 1) % figures.length;
      // Pick fresh, pleasing Lissajous ratios for the LISSAJOUS figure.
      ratioA = 2 + Math.floor(Math.random() * 5);
      ratioB = 1 + Math.floor(Math.random() * 4);
      figureFreq = [70, 90, 110, 130, 160][Math.floor(Math.random() * 5)]!;
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Window class + WndProc.

let quit = false;

const wndProc = new JSCallback(
  (hWnd: bigint, msg: number, wParam: bigint, lParam: bigint): bigint => {
    if (msg === WM_KEYDOWN && wParam === BigInt(VirtualKey.VK_ESCAPE)) {
      quit = true;
      return 0n;
    }
    if (msg === WM_CLOSE) {
      User32.DestroyWindow(hWnd);
      return 0n;
    }
    if (msg === WM_DESTROY) {
      quit = true;
      User32.PostQuitMessage(0);
      return 0n;
    }
    return BigInt(User32.DefWindowProcW(hWnd, msg, wParam, lParam));
  },
  { args: ['u64', 'u32', 'u64', 'i64'], returns: 'i64' },
);

const className = encode('BunWin32OscilloscopeMusic');
const windowTitle = encode('Oscilloscope Music — sound that draws itself · bun-win32');

const wndClassBuf = Buffer.alloc(80);
const wndClassView = new DataView(wndClassBuf.buffer);
wndClassView.setUint32(0, 80, true); // cbSize
wndClassView.setUint32(4, 0, true); // style
wndClassBuf.writeBigUInt64LE(BigInt(wndProc.ptr!), 8); // lpfnWndProc
wndClassView.setInt32(16, 0, true);
wndClassView.setInt32(20, 0, true);
wndClassBuf.writeBigUInt64LE(0n, 24);
wndClassBuf.writeBigUInt64LE(0n, 32);
wndClassBuf.writeBigUInt64LE(0n, 40);
wndClassBuf.writeBigUInt64LE(0n, 48);
wndClassBuf.writeBigUInt64LE(0n, 56);
wndClassBuf.writeBigUInt64LE(BigInt(className.ptr!), 64);
wndClassBuf.writeBigUInt64LE(0n, 72);

const classAtom = User32.RegisterClassExW(wndClassBuf.ptr!);
if (!classAtom) {
  console.error('Failed to register window class');
  process.exit(1);
}

const screenWidth = User32.GetSystemMetrics(0);
const screenHeight = User32.GetSystemMetrics(1);
const windowX = Math.max(0, Math.floor((screenWidth - WINDOW_SIZE) / 2));
const windowY = Math.max(0, Math.floor((screenHeight - WINDOW_SIZE) / 2));

// WS_OVERLAPPEDWINDOW would add a non-square client area; using WS_POPUP keeps the
// client area exactly WINDOW_SIZE × WINDOW_SIZE so the scope stays perfectly round.
const window = User32.CreateWindowExW(ExtendedWindowStyles.WS_EX_APPWINDOW, className.ptr!, windowTitle.ptr!, WindowStyles.WS_POPUP | WindowStyles.WS_VISIBLE, windowX, windowY, WINDOW_SIZE, WINDOW_SIZE, NULL, NULL, NULL, NULL_PTR);
if (!window) {
  console.error('Failed to create window');
  process.exit(1);
}

User32.ShowWindow(window, ShowWindowCommand.SW_SHOW);
User32.UpdateWindow(window);
// Force above the foreground window (e.g. the editor/terminal it was launched
// from) so the scope is never hidden behind it. HWND_TOPMOST (-1),
// SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW (0x43).
User32.SetWindowPos(window, 0xffffffffffffffffn, 0, 0, 0, 0, 0x0043);
User32.SetForegroundWindow(window);

console.log();
console.log('  OSCILLOSCOPE MUSIC — bun-win32');
console.log('  ──────────────────────────────────────────────');
console.log('  Stereo audio whose XY waveform IS the picture.');
console.log('  L channel = X, R channel = Y → the speakers draw the figure.');
console.log('  Plug in an Xbox controller to morph it, or watch it auto-cycle.');
console.log('  ESC (or close the window) to quit.');
console.log();

// ──────────────────────────────────────────────────────────────────────────────
// Teardown — release EVERYTHING exactly once.

let tornDown = false;
function teardown(): void {
  if (tornDown) return;
  tornDown = true;

  // Audio.
  vcall(source, IXAUDIO2VOICE_DESTROYVOICE, [], [], FFIType.void);
  vcall(master, IXAUDIO2VOICE_DESTROYVOICE, [], [], FFIType.void);
  vcall(engine, IUNKNOWN_RELEASE, [], [], FFIType.u32);

  // GDI — restore originals before deleting, then delete every created object.
  GDI32.SelectObject(backDc, oldFont);
  GDI32.SelectObject(backDc, oldBackBitmap);
  GDI32.DeleteObject(backBitmap);
  GDI32.DeleteObject(tracePen);
  GDI32.DeleteObject(bloomPen);
  GDI32.DeleteObject(gridPen);
  GDI32.DeleteObject(axisPen);
  GDI32.DeleteObject(bgBrush);
  GDI32.DeleteObject(hudFont);
  GDI32.DeleteObject(titleFont);
  GDI32.DeleteDC(backDc);

  // Window.
  if (window) User32.DestroyWindow(window);
  User32.UnregisterClassW(className.ptr!, NULL);
  wndProc.close();
}

process.on('SIGINT', () => {
  teardown();
  process.exit(0);
});
process.on('exit', teardown);

// ──────────────────────────────────────────────────────────────────────────────
// Main loop — non-blocking PeekMessage pump @ ~62 fps.

const deadline = process.env.DEMO_DURATION_MS ? performance.now() + Number(process.env.DEMO_DURATION_MS) : Infinity;
const msgBuffer = Buffer.alloc(48);

function frame(): void {
  // Drain the message queue without blocking.
  while (User32.PeekMessageW(msgBuffer.ptr!, NULL, 0, 0, PM_REMOVE) !== 0) {
    User32.TranslateMessage(msgBuffer.ptr!);
    User32.DispatchMessageW(msgBuffer.ptr!);
  }

  // Belt-and-suspenders ESC even if the window lacks focus.
  if ((User32.GetAsyncKeyState(VirtualKey.VK_ESCAPE) & 0x8000) !== 0) quit = true;
  if (performance.now() >= deadline) quit = true;

  pollInput();
  pumpAudio();
  renderScope();
  blitToWindow(window);

  if (quit) {
    teardown();
    process.exit(0);
  }
  setTimeout(frame, FRAME_INTERVAL_MS);
}

frame();
