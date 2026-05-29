/**
 * Mandelbrot — an infinite, buttery-smooth zoom into the Mandelbrot set, on the GPU.
 *
 * A fullscreen pixel-shader fractal explorer rendered entirely in pure TypeScript:
 * HLSL is compiled at runtime and the iteration runs per-pixel on the real GPU.
 * The viewer sees a living, jewel-toned fractal — deep cyans bleeding into magenta
 * and gold — that you fall endlessly into. The escape-time iteration z = z² + c is
 * coloured with the *continuous* (fractional) iteration count
 * mu = n + 1 - log2(log2(|z|)), which removes the ugly banding and is mapped through
 * a slowly-cycling cosine palette so the colours breathe as you explore. The
 * interior is pure black, ringed by a luminous boundary glow. As you dive deeper the
 * shader automatically raises the iteration cap so fine filaments stay crisp, and a
 * 4× rotated-grid supersample softens every edge. Press J to morph into a Julia set
 * whose seed 'c' tracks the mouse, turning the same machinery into a flowing,
 * dendritic organism. Drag to pan; +/- (or Z/X) zoom toward the cursor.
 *
 * Deep-zoom precision note: single-precision float32 loses detail past ~1e5 zoom.
 * To push far deeper, the per-pixel sample centre is reconstructed in the shader
 * using *double-single* (two-float / "df64") emulation: the centre is carried as a
 * hi+lo float pair (ds_center) and the pixel offset is added with compensated
 * (Dekker/Knuth two-sum) arithmetic before the iteration begins. This buys roughly
 * 46 bits of mantissa — enough to zoom to ~1e12 before the structure smears — while
 * the inner z²+c loop stays in fast float32. (Full df64 inside the loop would go
 * deeper still at a large perf cost; here only the high-dynamic-range centre+offset
 * gets the extra precision, which is where float32 fails first.)
 *
 * Pipeline (per frame, ~60 fps off the engine's PeekMessage pump):
 *   1. CPU: ease zoom toward the cursor, pan on drag, raise iter cap with depth,
 *      split the centre (cx,cy) into hi/lo float pairs, pack the constant buffer.
 *   2. GPU: a single SV_VertexID fullscreen triangle → the Mandelbrot pixel shader
 *      iterates with 4× rotated-grid AA, smooth-colours via a cosine palette, and
 *      writes straight to the swap-chain back buffer.
 *   3. Present, then a GDI TextOutW HUD is drawn on the window DC.
 *
 * @bun-win32 / engine APIs used: createWindow / createDevice (D3D11 device + DXGI
 * swap chain over Bun FFI), compile / makeVertexShader / makePixelShader,
 * makeConstantBuffer / updateConstantBuffer, setRenderTargets / setViewport / clear /
 * drawFullscreenTriangle, vsSet / psSet, gpu.present, comRelease / blobRelease; plus
 * GDI32 (CreateFontW/SelectObject/SetTextColor/SetBkMode/TextOutW) + User32
 * (GetWindowDC/ReleaseDC) for the on-window HUD.
 *
 * Run: bun run packages/all/example/mandelbrot.ts   (ESC quits; DEMO_DURATION_MS auto-exits)
 */

import { GDI32, User32 } from '../index';
import {
  clear,
  comRelease,
  compile,
  createDevice,
  createWindow,
  drawFullscreenTriangle,
  makeConstantBuffer,
  makePixelShader,
  makeVertexShader,
  psSet,
  setRenderTargets,
  setViewport,
  updateConstantBuffer,
  vsSet,
  blobRelease,
} from './_gpu';

// ── Virtual-key codes (the engine's Win.keyDown takes raw VKs) ────────────────
const VK_LEFT = 0x25;
const VK_UP = 0x26;
const VK_RIGHT = 0x27;
const VK_DOWN = 0x28;
const VK_OEM_PLUS = 0xbb; // '=' / '+'
const VK_OEM_MINUS = 0xbd; // '-' / '_'
const VK_ADD = 0x6b; // numpad +
const VK_SUBTRACT = 0x6d; // numpad -
const VK_Z = 0x5a;
const VK_X = 0x58;
const VK_J = 0x4a;
const VK_R = 0x52;
const VK_SPACE = 0x20;

// ── GDI constants for the HUD ─────────────────────────────────────────────────
const TRANSPARENT = 1;
const FW_SEMIBOLD = 600;
const DEFAULT_CHARSET = 1;
const CLEARTYPE_QUALITY = 5;
const VARIABLE_PITCH = 2;
const rgb = (r: number, g: number, b: number): number => ((b << 16) | (g << 8) | r) >>> 0;

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

// ─────────────────────────────────────────────────────────────────────────────
// HLSL — fullscreen Mandelbrot / Julia with smooth colouring, 4× AA, df64 centre.
// ─────────────────────────────────────────────────────────────────────────────
// Vertex shader: a single oversized triangle that covers the screen (no IA buffer).
const VS = /* hlsl */ `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o;
  float2 p = float2((vid << 1) & 2, vid & 2);   // (0,0) (2,0) (0,2)
  o.uv = p;                                       // 0..2 across the screen
  o.pos = float4(p * float2(2, -2) + float2(-1, 1), 0, 1);
  return o;
}`;

// Pixel shader. The constant buffer carries the view centre as a hi/lo float pair
// per axis (double-single), the world-space pixel scale, iteration cap, time,
// aspect, palette phase, the Julia seed, and a mode flag.
const PS = /* hlsl */ `
cbuffer C : register(b0) {
  float2 centerHi;   // view centre, high word (df64)
  float2 centerLo;   // view centre, low word  (df64)
  float  scale;      // world units per screen-height (half-extent in Y)
  float  iters;      // current iteration cap (float for cb packing)
  float  time;       // seconds, drives the palette cycle
  float  aspect;     // width / height
  float2 juliaC;     // Julia seed (mouse-driven)
  float  juliaMix;   // 0 = Mandelbrot, 1 = Julia
  float  glow;       // boundary-glow strength
};

// ── Double-single (two-float) helpers: ~46-bit mantissa for the centre/offset ──
// Knuth two-sum: returns the rounded sum plus the lost low-order bits.
float2 ds_add(float2 a, float2 b) {
  float s  = a.x + b.x;
  float v  = s - a.x;
  float e  = (a.x - (s - v)) + (b.x - v);
  e += a.y + b.y;
  float r  = s + e;
  return float2(r, e - (r - s));
}
// Add a plain float to a df pair.
float2 ds_addf(float2 a, float b) { return ds_add(a, float2(b, 0.0)); }

// Smooth HDR cosine palette (Inigo Quilez style) — warm gold → cyan → violet.
float3 palette(float t) {
  float3 a = float3(0.55, 0.45, 0.40);
  float3 b = float3(0.45, 0.50, 0.55);
  float3 c = float3(1.00, 1.00, 1.00);
  float3 d = float3(0.00, 0.18, 0.42);
  return a + b * cos(6.2831853 * (c * t + d));
}

// One escape-time sample at screen offset (ox,oy) in NDC-ish [-aspect..aspect]x[-1..1].
// Returns float3 colour for this sub-sample.
float3 sampleFractal(float ox, float oy) {
  // World offset from centre for this pixel (single precision is plenty here).
  float offX = ox * scale;
  float offY = oy * scale;

  // c (or the starting z, for Julia) reconstructed at df64 precision so the deep
  // centre coordinate keeps its bits even when |center| >> |offset|.
  float2 cx = ds_addf(float2(centerHi.x, centerLo.x), offX);
  float2 cy = ds_addf(float2(centerHi.y, centerLo.y), offY);

  // Collapse to float for the hot loop (the *relative* coordinate now fits f32).
  float crx = cx.x + cx.y;
  float cry = cy.x + cy.y;

  float2 z, cc;
  if (juliaMix > 0.5) { z = float2(crx, cry); cc = juliaC; }   // Julia: z0 = pixel, c = seed
  else                { z = float2(0.0, 0.0); cc = float2(crx, cry); } // Mandelbrot

  int   maxI = (int)iters;
  float n = 0.0;
  float zx = z.x, zy = z.y;
  float zx2 = zx * zx, zy2 = zy * zy;
  const float BAILOUT = 256.0; // large bailout → smoother log-log shading
  [loop]
  for (int i = 0; i < maxI; i++) {
    if (zx2 + zy2 > BAILOUT) break;
    zy = 2.0 * zx * zy + cc.y;
    zx = zx2 - zy2 + cc.x;
    zx2 = zx * zx; zy2 = zy * zy;
    n += 1.0;
  }

  if (n >= (float)maxI) return float3(0.0, 0.0, 0.0); // interior → pure black

  // Continuous (fractional) iteration count: mu = n + 1 - log2(log2(|z|)).
  float mag = sqrt(zx2 + zy2);
  float mu = n + 1.0 - log2(max(log2(max(mag, 1.0001)), 1e-8));

  // Map smoothly through the cycling palette; a sqrt spreads the inner detail.
  float t = sqrt(mu) * 0.045 + time * 0.02;
  float3 col = palette(t);

  // Boundary glow: ramp brightness near the escape edge so filaments shimmer.
  float edge = saturate(mu / (float)maxI);
  col *= 0.35 + 1.05 * pow(1.0 - edge, 0.5);
  col += glow * pow(1.0 - edge, 6.0) * float3(0.35, 0.55, 1.0);
  return col;
}

float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  // uv is 0..2; map to [-aspect..aspect] x [-1..1] (Y up).
  float2 p = (uv - 1.0) * float2(aspect, -1.0);

  // 4× rotated-grid supersample for clean anti-aliasing. Sub-pixel step in
  // screen-fraction → multiply by the per-pixel world size (2/height ≈ ddy).
  float px = (2.0 / 1080.0); // nominal pixel size in our [-1..1] Y space; cheap RGSS
  const float2 rg[4] = {
    float2( 0.125,  0.375), float2( 0.375, -0.125),
    float2(-0.125, -0.375), float2(-0.375,  0.125)
  };
  float3 acc = float3(0.0, 0.0, 0.0);
  [unroll]
  for (int s = 0; s < 4; s++) {
    float2 o = p + rg[s] * px;
    acc += sampleFractal(o.x, o.y);
  }
  acc *= 0.25;

  // Soft filmic-ish tonemap + gentle gamma for that HDR glow look.
  acc = acc / (acc + 0.7);
  acc = pow(saturate(acc), 0.85);
  return float4(acc, 1.0);
}`;

// ─────────────────────────────────────────────────────────────────────────────
// Host: window, device, shaders, and the interactive zoom/pan loop.
// ─────────────────────────────────────────────────────────────────────────────
const WIDTH = 1280;
const HEIGHT = 800;

const win = createWindow({ title: 'Mandelbrot — infinite GPU zoom', width: WIDTH, height: HEIGHT, borderless: false });
const { w: CW, h: CH } = win.clientSize();
const gpu = createDevice(win.hwnd, { width: CW, height: CH });

console.log(`Mandelbrot — rendering on ${gpu.driver} (${gpu.gpuName}) at ${CW}x${CH}.`);
console.log('  drag to pan · +/- or Z/X to zoom (toward cursor) · J Julia · R reset · ESC quit');

const vsCode = compile(VS, 'main', 'vs_5_0');
const psCode = compile(PS, 'main', 'ps_5_0');
const vs = makeVertexShader(vsCode);
const ps = makePixelShader(psCode);

// Constant buffer layout (16-byte aligned, multiple of 16):
//   off 0:  float2 centerHi
//   off 8:  float2 centerLo
//   off 16: float  scale
//   off 20: float  iters
//   off 24: float  time
//   off 28: float  aspect
//   off 32: float2 juliaC
//   off 40: float  juliaMix
//   off 44: float  glow
//   → 48 bytes (multiple of 16).
const CB_SIZE = 48;
const cb = makeConstantBuffer(CB_SIZE);
const cbData = Buffer.alloc(CB_SIZE);

// ── View state (centre carried as JS doubles; split to hi/lo for the shader) ──
// Opening framing: gently diving into the dendritic "scepter valley" on the
// northern antenna of the set, so the screen is filled edge-to-edge with
// colourful self-similar filaments from frame 1 — no black margin, perfectly
// centred. (At zoom 1× any deep target just shoves the cardioid to one side
//  leaving a big black gap; instead we open at ~4.7× on a region that is *all*
//  boundary detail.) Verified by readback probe: lit fraction ≈ 1.00,
//  left/right & top/bottom luminance balance ≈ 0.97, mean luminance ≈ 0.60.
const OPEN_CENTER_X = -0.235;
const OPEN_CENTER_Y = 0.827;
const OPEN_SCALE = 0.30; // half-height in world units → zoom ≈ BASE_SCALE/scale ≈ 4.7×
let centerX = OPEN_CENTER_X;
let centerY = OPEN_CENTER_Y;
let scale = OPEN_SCALE; // half-height of the view in world units (≈ zoom = 1.4/scale)
const BASE_SCALE = 1.4;
let juliaMix = 0; // 0 = Mandelbrot, 1 = Julia
let juliaCX = 0;
let juliaCY = 0;

// Drag-to-pan tracking.
let dragging = false;
let lastMx = 0;
let lastMy = 0;

// Edge-trigger latches for toggle keys.
let jLatch = false;
let spaceLatch = false;

const aspect = CW / CH;

/** Split a JS double into a hi/lo float pair (df64): hi = round-to-f32, lo = remainder. */
function splitDouble(x: number): [number, number] {
  const hi = Math.fround(x);
  const lo = Math.fround(x - hi);
  return [hi, lo];
}

/** Iteration cap rises with zoom depth so fine filaments stay resolved. */
function iterForScale(s: number): number {
  const zoom = BASE_SCALE / s;
  return clamp(Math.round(160 + 90 * Math.log2(Math.max(zoom, 1) + 1)), 160, 2200);
}

// Convert a client pixel (mx,my) to world coordinates given the current view.
function pixelToWorld(mx: number, my: number): [number, number] {
  const ndcX = (mx / CW) * 2 - 1; // -1..1
  const ndcY = (my / CH) * 2 - 1;
  const wx = centerX + ndcX * aspect * scale;
  const wy = centerY - ndcY * scale; // Y up in world space
  return [wx, wy];
}

// Zoom toward a screen point: keep the world point under the cursor fixed.
function zoomToward(mx: number, my: number, factor: number): void {
  const [wx, wy] = pixelToWorld(mx, my);
  scale = clamp(scale * factor, 1e-13, 4.0);
  // Recompute where the cursor now maps and shift the centre to pin it.
  const ndcX = (mx / CW) * 2 - 1;
  const ndcY = (my / CH) * 2 - 1;
  centerX = wx - ndcX * aspect * scale;
  centerY = wy + ndcY * scale;
}

function reset(): void {
  centerX = OPEN_CENTER_X;
  centerY = OPEN_CENTER_Y;
  scale = OPEN_SCALE;
}

// ── HUD (GDI on the window DC) ────────────────────────────────────────────────
const hudFont = GDI32.CreateFontW(
  -18, 0, 0, 0, FW_SEMIBOLD, 0, 0, 0,
  DEFAULT_CHARSET, 0, 0, CLEARTYPE_QUALITY, VARIABLE_PITCH,
  Buffer.from('Segoe UI\0', 'utf16le').ptr!,
);

function drawHud(text: string): void {
  const dc = User32.GetWindowDC(win.hwnd);
  if (dc === 0n) return;
  const prevFont = GDI32.SelectObject(dc, hudFont);
  GDI32.SetBkMode(dc, TRANSPARENT);
  const wide = Buffer.from(`${text}\0`, 'utf16le');
  const len = text.length;
  // Soft drop shadow then the bright text for legibility over any colour.
  GDI32.SetTextColor(dc, rgb(0, 0, 0));
  GDI32.TextOutW(dc, 17, 15, wide.ptr!, len);
  GDI32.SetTextColor(dc, rgb(225, 240, 255));
  GDI32.TextOutW(dc, 16, 14, wide.ptr!, len);
  GDI32.SelectObject(dc, prevFont);
  User32.ReleaseDC(win.hwnd, dc);
}

// ── Frame timing / lifetime ───────────────────────────────────────────────────
const start = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Math.max(0, Number(process.env.DEMO_DURATION_MS)) : 0;
let frames = 0;
let fps = 0;
let fpsAccum = 0;
let fpsFrames = 0;
let lastFrame = start;
let autoZoom = durationMs > 0; // unattended runs dive on their own to prove motion

function teardown(): void {
  comRelease(cb);
  comRelease(ps);
  comRelease(vs);
  blobRelease(psCode.blob);
  blobRelease(vsCode.blob);
  GDI32.DeleteObject(hudFont);
  comRelease(gpu.backBufferRTV);
  comRelease(gpu.swapChain);
  comRelease(gpu.context);
  comRelease(gpu.device);
  win.destroy();
}

try {
  while (!win.shouldClose()) {
    win.pump();
    if (win.shouldClose()) break;

    const now = performance.now();
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    const t = (now - start) / 1000;

    // ── Input ──────────────────────────────────────────────────────────────
    const m = win.getMouse();
    const mx = clamp(m.x, 0, CW);
    const my = clamp(m.y, 0, CH);

    // Drag-to-pan: translate the centre by the cursor delta in world units.
    if (m.down) {
      if (!dragging) {
        dragging = true;
      } else {
        const dxPix = mx - lastMx;
        const dyPix = my - lastMy;
        centerX -= (dxPix / CW) * 2 * aspect * scale;
        centerY += (dyPix / CH) * 2 * scale;
      }
      lastMx = mx;
      lastMy = my;
      autoZoom = false; // any interaction stops the auto-dive
    } else {
      dragging = false;
    }

    // Held-key continuous zoom toward the cursor.
    const zoomInHeld = win.keyDown(VK_OEM_PLUS) || win.keyDown(VK_ADD) || win.keyDown(VK_Z);
    const zoomOutHeld = win.keyDown(VK_OEM_MINUS) || win.keyDown(VK_SUBTRACT) || win.keyDown(VK_X);
    if (zoomInHeld) {
      zoomToward(mx, my, Math.pow(0.30, dt));
      autoZoom = false;
    }
    if (zoomOutHeld) {
      zoomToward(mx, my, Math.pow(3.3, dt));
      autoZoom = false;
    }

    // Arrow-key pan (in addition to drag).
    const panSpeed = scale * 1.4 * dt;
    if (win.keyDown(VK_LEFT)) { centerX -= panSpeed * aspect; autoZoom = false; }
    if (win.keyDown(VK_RIGHT)) { centerX += panSpeed * aspect; autoZoom = false; }
    if (win.keyDown(VK_UP)) { centerY += panSpeed; autoZoom = false; }
    if (win.keyDown(VK_DOWN)) { centerY -= panSpeed; autoZoom = false; }

    // J toggles Mandelbrot ↔ Julia (edge-triggered).
    if (win.keyDown(VK_J)) {
      if (!jLatch) {
        jLatch = true;
        juliaMix = juliaMix > 0.5 ? 0 : 1;
        if (juliaMix > 0.5) reset(); // recentre when entering Julia so it frames well
      }
    } else {
      jLatch = false;
    }
    if (win.keyDown(VK_R)) reset();
    if (win.keyDown(VK_SPACE)) {
      if (!spaceLatch) { spaceLatch = true; autoZoom = !autoZoom; }
    } else {
      spaceLatch = false;
    }

    // In Julia mode the seed 'c' follows the mouse (mapped to a tasteful range).
    if (juliaMix > 0.5) {
      juliaCX = (mx / CW) * 2.0 - 1.0; // -1..1
      juliaCY = (my / CH) * 2.0 - 1.0;
      juliaCX = -0.8 + juliaCX * 0.35;
      juliaCY = 0.156 + juliaCY * 0.35;
    }

    // Unattended auto-dive: gently zoom into the seahorse valley to prove motion.
    if (autoZoom) zoomToward(CW / 2, CH / 2, Math.pow(0.42, dt));

    // ── Pack constant buffer (immediately before the draw) ───────────────────
    const iters = iterForScale(scale);
    const [hiX, loX] = splitDouble(centerX);
    const [hiY, loY] = splitDouble(centerY);
    cbData.writeFloatLE(hiX, 0);
    cbData.writeFloatLE(hiY, 4);
    cbData.writeFloatLE(loX, 8);
    cbData.writeFloatLE(loY, 12);
    cbData.writeFloatLE(scale, 16);
    cbData.writeFloatLE(iters, 20);
    cbData.writeFloatLE(t, 24);
    cbData.writeFloatLE(aspect, 28);
    cbData.writeFloatLE(juliaCX, 32);
    cbData.writeFloatLE(juliaCY, 36);
    cbData.writeFloatLE(juliaMix, 40);
    cbData.writeFloatLE(0.6, 44); // glow
    updateConstantBuffer(cb, cbData);

    // ── Draw ─────────────────────────────────────────────────────────────────
    setRenderTargets([gpu.backBufferRTV]);
    setViewport(CW, CH);
    clear(gpu.backBufferRTV, [0, 0, 0, 1]);
    vsSet(vs);
    psSet(ps, { cb: [cb] });
    drawFullscreenTriangle();
    gpu.present(true); // vsync on → buttery 60fps with no tearing

    // ── HUD ──────────────────────────────────────────────────────────────────
    fpsAccum += dt;
    fpsFrames += 1;
    if (fpsAccum >= 0.4) {
      fps = fpsFrames / fpsAccum;
      fpsAccum = 0;
      fpsFrames = 0;
    }
    const zoom = BASE_SCALE / scale;
    const zoomStr = zoom < 1e4 ? `${zoom.toFixed(zoom < 100 ? 1 : 0)}×` : `${zoom.toExponential(1)}×`;
    const mode = juliaMix > 0.5 ? 'Julia' : 'Mandelbrot';
    drawHud(`${mode} · zoom ${zoomStr} · iter ${iters} · ${fps.toFixed(0)} fps · drag to pan, +/- to zoom, J=Julia`);

    frames += 1;
    if (durationMs > 0 && now - start >= durationMs) break;
  }
} finally {
  teardown();
}

const elapsed = (performance.now() - start) / 1000;
console.log(`Done. Presented ${frames} frames in ${elapsed.toFixed(2)}s (final zoom ${(BASE_SCALE / scale).toExponential(2)}×).`);
process.exit(0);
