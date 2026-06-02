/**
 * Neural Descent — a deep SIREN neural field that PAINTS A PHOTOGRAPH live on your GPU.
 *
 * A coordinate network  f(x, y) -> RGB  is overfit, in real time, to a high-detail
 * TARGET image so that you literally WATCH a neural field resolve a crisp picture out
 * of noise. The architecture is a SIREN — a Sinusoidal Implicit Neural Representation:
 * a 4-layer MLP  2 -> 160 -> 160 -> 160 -> 3  whose hidden activations are sin(omega*z)
 * instead of ReLU. SIRENs fit fine photographic detail (sharp edges, gradients, texture)
 * dramatically faster and cleaner than a ReLU+Fourier MLP, so the reconstruction becomes
 * nearly indistinguishable from the target within a few seconds. The weights are
 * initialized in pure TypeScript from the canonical SIREN distribution (first layer
 * U(-1/n,1/n); hidden U(-sqrt(6/n)/omega, +...)), uploaded once, and from then on every
 * one of the ~52,000 parameters is updated entirely on the hardware ID3D11Device.
 *
 * Forward propagation, the loss, the FULL backpropagation (chain rule layer by layer,
 * the sin derivative omega*cos(omega*z)), and the ADAM optimizer step are ALL hand-
 * written Direct3D 11 COMPUTE shaders running over structured buffers — there is no
 * DirectML, no ML library, no precomputed weights. Pure TypeScript drives a hand-written
 * D3D11 engine over Bun FFI; HLSL is compiled at runtime.
 *
 * Presentation. The frame is a single continuous picture split by a CONVERGENCE WIPE: a
 * luminous vertical seam that, as the network learns, sweeps from the left edge to the
 * right — uncovering the live NEURAL reconstruction over the analytic TARGET. Early on,
 * the not-yet-trained right side dissolves out of structured noise; by the end the seam
 * has crossed the whole frame and what remains is the net's own painting, lit by an HDR
 * bloom pass (bright-pass + separable Gaussian + filmic tonemap). A glassy LIVE LOSS
 * panel plots the falling log-MSE with a glowing head dot and a log grid, and reads out
 * EPOCH, the learning rate, the MSE and the PSNR (dB) climbing in real time. All of the
 * type, the panel and the labels are procedural HLSL baked into the frame so they survive
 * the gallery capture; a light GDI overlay adds the title + fps on the live window.
 *
 * Pipeline, per training STEP (many steps per displayed frame):
 *   1. ZERO-GRAD  CS  — clear the fixed-point gradient + loss/PSNR accumulators.
 *   2. TRAIN      CS [numthreads(64,1,1)] over a batch of pixels: each thread hashes a
 *      pixel coord, runs the full SIREN forward keeping activations + the sin-derivative
 *      gain per neuron in registers, reads the TARGET pixel, forms the output delta, and
 *      BACK-PROPAGATES manual flat-index matmuls, accumulating dL/dW and dL/db into uint
 *      buffers with InterlockedAdd (fixed-point) and the summed MSE into a uint cell.
 *   3. ADAM       CS  — one elementwise dispatch per parameter buffer: bias-corrected
 *      adaptive moment update  W -= lr * mhat / (sqrt(shat) + eps).
 * Rendering: a PIXEL shader evaluates the CURRENT weights per pixel into an offscreen HDR
 * texture; a bright-pass + two-tap separable Gaussian build a bloom texture; a COMPOSITE
 * shader paints TARGET | (wiped) NEURAL with bloom, filmic tonemap, vignette, the labels
 * and the live loss/PSNR HUD.
 *
 * @bun-win32 APIs used (see ./_gpu.ts): createWindow / createDevice / recreateRTV /
 *   compile / makeComputeShader / makeVertexShader / makePixelShader /
 *   makeStructuredBuffer (weights + Adam moments + uint grads, UAV+SRV) /
 *   makeTexture (HDR prediction + bloom ping/pong, RTV+SRV) / makeSampler /
 *   makeConstantBuffer / updateConstantBuffer / updateDynamicBuffer / dispatch /
 *   vsSet / psSet / setRenderTargets / setViewport / clear / drawFullscreenTriangle /
 *   readbackBuffer / present / comRelease — plus GDI32 for the HUD and _snapshot for
 *   the gallery capture.
 *
 * Run: bun run packages/all/example/neural-descent.ts
 *   SELFSHOT=1 SELFSHOT_PATH=<abs.png> DEMO_DURATION_MS=8000 bun run … — capture a frame.
 */

import { FFIType } from 'bun:ffi';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

import { GDI32, User32 } from '../index';
import {
  CTX_CS_SET_SHADER_RESOURCES,
  CTX_CS_SET_UNORDERED_ACCESS_VIEWS,
  D3D11_FILTER_MIN_MAG_MIP_LINEAR,
  D3D11_TEXTURE_ADDRESS_CLAMP,
  DXGI_FORMAT_R16G16B16A16_FLOAT,
  clear,
  comRelease,
  compile,
  createDevice,
  createWindow,
  dispatch,
  drawFullscreenTriangle,
  makeComputeShader,
  makeConstantBuffer,
  makePixelShader,
  makeSampler,
  makeStructuredBuffer,
  makeTexture,
  makeVertexShader,
  psSet,
  readbackBuffer,
  setRenderTargets,
  setViewport,
  updateConstantBuffer,
  updateDynamicBuffer,
  vcall,
  vsSet,
} from './_gpu';
import { captureBackBuffer, formatGrid } from './_snapshot';
import * as hud from './_hud';

const encodeWide = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');

// ── Modest, ~16:9 borderless window (never fills the monitor) ──────────────────
const screenW = User32.GetSystemMetrics(0) || 1920;
const screenH = User32.GetSystemMetrics(1) || 1080;
const WIN_H = Math.min(1000, Math.floor(screenH * 0.72));
const WIN_W = Math.min(Math.floor(screenW * 0.9), Math.round((WIN_H * 16) / 9));

// ── SIREN topology ─────────────────────────────────────────────────────────────
// 2 coordinates -> three sinusoidal hidden layers -> RGB. A wide-enough SIREN fits
// fine photographic detail; sin activations resolve sharp edges + gradients fast.
const INPUT = 2;
const H1 = 128;
const H2 = 128;
const H3 = 128;
const OUT = 3;

const W1_N = H1 * INPUT; //   320
const W2_N = H2 * H1; // 25,600
const W3_N = H3 * H2; // 25,600
const W4_N = OUT * H3; //   480
const PARAM_TOTAL = W1_N + H1 + W2_N + H2 + W3_N + H3 + W4_N + OUT;

// SIREN frequency. omega0 scales the first layer's pre-activation; hidden layers use
// the same omega with the canonical init so signals stay well-conditioned.
const OMEGA0 = 30.0;
const OMEGA = 30.0;

// Fixed-point scale for InterlockedAdd gradient accumulation. SIREN gradients near
// convergence are tiny; a fine scale keeps Adam's 1/sqrt(v) term from amplifying
// quantization noise into late-training speckle.
const GRAD_SCALE = 1 << 24; // 16,777,216

const BATCH = 16384; // pixel samples per training step (wide coverage -> crisp fit)
const STEPS_PER_FRAME = 18; // SIREN steps are heavier; fewer per frame, still fast
const LR = 0.0022; // Adam base learning rate (SIREN likes a small lr)
const ADAM_B1 = 0.9;
const ADAM_B2 = 0.999;
const ADAM_EPS = 1e-8;
const DECAY_STEPS = 4200; // cosine-anneal across the capture window to a tight finish
const WIPE_SECS = 6.5; // seconds for the convergence wipe to sweep edge-to-edge (paced)

// ── Window + device ─────────────────────────────────────────────────────────────
const win = createWindow({ title: 'Neural Descent — a SIREN neural field painting a photo live on the GPU', width: WIN_W, height: WIN_H, borderless: true });
const { w: clientW, h: clientH } = win.clientSize();
const gpu = createDevice(win.hwnd, { width: clientW, height: clientH });
gpu.recreateRTV();

// ── Seeded SIREN weight init (deterministic) ──────────────────────────────────
let seed = 0x9e3779b9 >>> 0;
function rand(): number {
  // xorshift32 in [0,1)
  seed ^= seed << 13; seed >>>= 0;
  seed ^= seed >> 17;
  seed ^= seed << 5; seed >>>= 0;
  return seed / 0x1_0000_0000;
}
// SIREN init: first layer U(-1/fanIn, 1/fanIn); hidden U(-sqrt(6/fanIn)/omega, +...).
function sirenW(count: number, fanIn: number, first: boolean): Buffer {
  const bound = first ? 1 / fanIn : Math.sqrt(6 / fanIn) / OMEGA;
  const buf = Buffer.alloc(count * 4);
  for (let i = 0; i < count; i += 1) buf.writeFloatLE((rand() * 2 - 1) * bound, i * 4);
  return buf;
}
const zeros = (count: number): Buffer => Buffer.alloc(count * 4);

// Weights (float; UAV for Adam writes + SRV for the render PS / TRAIN forward reads).
const w1 = makeStructuredBuffer({ stride: 4, count: W1_N, uav: true, srv: true, initialData: sirenW(W1_N, INPUT, true) });
const b1 = makeStructuredBuffer({ stride: 4, count: H1, uav: true, srv: true, initialData: zeros(H1) });
const w2 = makeStructuredBuffer({ stride: 4, count: W2_N, uav: true, srv: true, initialData: sirenW(W2_N, H1, false) });
const b2 = makeStructuredBuffer({ stride: 4, count: H2, uav: true, srv: true, initialData: zeros(H2) });
const w3 = makeStructuredBuffer({ stride: 4, count: W3_N, uav: true, srv: true, initialData: sirenW(W3_N, H2, false) });
const b3 = makeStructuredBuffer({ stride: 4, count: H3, uav: true, srv: true, initialData: zeros(H3) });
const w4 = makeStructuredBuffer({ stride: 4, count: W4_N, uav: true, srv: true, initialData: sirenW(W4_N, H3, false) });
const b4 = makeStructuredBuffer({ stride: 4, count: OUT, uav: true, srv: true, initialData: zeros(OUT) });

// Gradient accumulators (uint fixed-point). UAV = InterlockedAdd target in TRAIN;
// SRV = read by the ADAM kernel to apply the step.
const gw1 = makeStructuredBuffer({ stride: 4, count: W1_N, uav: true, srv: true });
const gb1 = makeStructuredBuffer({ stride: 4, count: H1, uav: true, srv: true });
const gw2 = makeStructuredBuffer({ stride: 4, count: W2_N, uav: true, srv: true });
const gb2 = makeStructuredBuffer({ stride: 4, count: H2, uav: true, srv: true });
const gw3 = makeStructuredBuffer({ stride: 4, count: W3_N, uav: true, srv: true });
const gb3 = makeStructuredBuffer({ stride: 4, count: H3, uav: true, srv: true });
const gw4 = makeStructuredBuffer({ stride: 4, count: W4_N, uav: true, srv: true });
// GB4 holds the OUT output-bias gradients PLUS one extra cell [OUT] that doubles as
// the fixed-point MSE accumulator. Folding the loss into GB4 keeps TRAIN at exactly
// 8 UAVs (u0..u7) — the hard limit on D3D_FEATURE_LEVEL_11_0. The Adam pass only
// reads the first OUT elements, so the loss cell never perturbs the optimizer.
const gb4 = makeStructuredBuffer({ stride: 4, count: OUT + 1, uav: true, srv: true });

// ADAM optimizer state: first moment m and second moment s, one float per parameter.
const mw1 = makeStructuredBuffer({ stride: 4, count: W1_N, uav: true, srv: true, initialData: zeros(W1_N) });
const mb1 = makeStructuredBuffer({ stride: 4, count: H1, uav: true, srv: true, initialData: zeros(H1) });
const mw2 = makeStructuredBuffer({ stride: 4, count: W2_N, uav: true, srv: true, initialData: zeros(W2_N) });
const mb2 = makeStructuredBuffer({ stride: 4, count: H2, uav: true, srv: true, initialData: zeros(H2) });
const mw3 = makeStructuredBuffer({ stride: 4, count: W3_N, uav: true, srv: true, initialData: zeros(W3_N) });
const mb3 = makeStructuredBuffer({ stride: 4, count: H3, uav: true, srv: true, initialData: zeros(H3) });
const mw4 = makeStructuredBuffer({ stride: 4, count: W4_N, uav: true, srv: true, initialData: zeros(W4_N) });
const mb4 = makeStructuredBuffer({ stride: 4, count: OUT, uav: true, srv: true, initialData: zeros(OUT) });
const sw1 = makeStructuredBuffer({ stride: 4, count: W1_N, uav: true, srv: true, initialData: zeros(W1_N) });
const sb1 = makeStructuredBuffer({ stride: 4, count: H1, uav: true, srv: true, initialData: zeros(H1) });
const sw2 = makeStructuredBuffer({ stride: 4, count: W2_N, uav: true, srv: true, initialData: zeros(W2_N) });
const sb2 = makeStructuredBuffer({ stride: 4, count: H2, uav: true, srv: true, initialData: zeros(H2) });
const sw3 = makeStructuredBuffer({ stride: 4, count: W3_N, uav: true, srv: true, initialData: zeros(W3_N) });
const sb3 = makeStructuredBuffer({ stride: 4, count: H3, uav: true, srv: true, initialData: zeros(H3) });
const sw4 = makeStructuredBuffer({ stride: 4, count: W4_N, uav: true, srv: true, initialData: zeros(W4_N) });
const sb4 = makeStructuredBuffer({ stride: 4, count: OUT, uav: true, srv: true, initialData: zeros(OUT) });

// Loss-history ring for the in-frame loss curve: CPU writes a normalized 0..1 height
// per LOSS_PLOT_N samples; the composite PS reads it as an SRV and plots a glowing
// curve. cpuWritable + SRV so it can be mapped every frame.
const LOSS_PLOT_N = 192;
const lossPlot = makeStructuredBuffer({ stride: 4, count: LOSS_PLOT_N, cpuWritable: true, srv: true, initialData: Buffer.alloc(LOSS_PLOT_N * 4) });
const lossPlotData = Buffer.alloc(LOSS_PLOT_N * 4);

// ── Constant buffer shared by every kernel + the render passes ────────────────
// cbuffer Net (16-byte rows):
//   uint  width, height, frame, batch;                       (16)
//   uint  totalSteps, count, bc1f, bc2f;   (bc1f/bc2f are floats packed as below)
//   float lr, gradScale, wipe, time;                          (16)
//   float b1, b2, eps, omega;                                 (16)
//   float bc1, bc2, omega0, pad;                              (16)
//   float plotCount, psnr, scanY, mse;                        (16)  HUD-only
//   float epoch, lrNow, blurDir, bloomStr;                    (16)  render-only
const CB_SIZE = 112;
const cb = makeConstantBuffer(CB_SIZE);
const cbData = Buffer.alloc(CB_SIZE);

// ── Shared HLSL: constants + the SIREN buffers ────────────────────────────────
const NET_DECLS = `
cbuffer Net : register(b0) {
  uint uWidth; uint uHeight; uint uFrame; uint uBatch;
  uint uTotalSteps; uint uCount; uint uPadA; uint uPadB;
  float uLr; float uGradScale; float uWipe; float uTime;
  float uB1; float uB2; float uEps; float uOmega;
  float uBc1; float uBc2; float uOmega0; float uPadC;
  float uPlotCount; float uPsnr; float uScanY; float uMse;
  float uEpoch; float uLrNow; float uBlurDir; float uBloomStr;
};

#define INPUT ${INPUT}
#define H1 ${H1}
#define H2 ${H2}
#define H3 ${H3}
#define OUTN ${OUT}
`;

// The TARGET image, evaluated procedurally on the GPU: ONE bold, high-contrast scene
// that spans the whole frame and crosses the center — a DRAMATIC ALPINE SUNSET over a
// mirror lake. A fiery graded sky (violet zenith -> magenta -> orange -> molten gold)
// with a huge glowing SUN on the seam and a few band-limited cloud strata, a clean
// snow-capped mountain silhouette range, and a still lake that MIRRORS the whole scene
// with a bright sun-glitter column. Everything is mid-frequency + band-limited so the
// SIREN fits it CRISPLY and the loss keeps falling — and because the sun + peaks + their
// reflections straddle x=0.5, at convergence the two halves fuse into one photograph.
const TARGET_IMG = `
float hash21(float2 p) {
  p = frac(p * float2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return frac(p.x * p.y);
}
// value noise (band-limited via smoothstep) for soft texture
float vnoise(float2 p) {
  float2 i = floor(p); float2 f = frac(p);
  float a = hash21(i);
  float b = hash21(i + float2(1.0, 0.0));
  float c = hash21(i + float2(0.0, 1.0));
  float d = hash21(i + float2(1.0, 1.0));
  float2 u = f * f * (3.0 - 2.0 * f);
  return lerp(lerp(a, b, u.x), lerp(c, d, u.x), u.y);
}
float fbm(float2 p) {
  float s = 0.0, a = 0.5;
  [unroll] for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.0; a *= 0.5; }
  return s;
}
// Smooth peaked mountain skyline height (smaller y = higher peak) at horizontal x.
// Low-frequency sum of sines -> clean silhouette the SIREN resolves crisply.
float ridgeHeight(float x, float baseY, float amp, float freq, float ph) {
  float h = 0.0;
  h += 0.60 * abs(sin(x * freq + ph));
  h += 0.26 * abs(sin(x * freq * 2.07 + ph * 1.7 + 0.6));
  h += 0.12 * abs(sin(x * freq * 3.93 + ph * 0.5 + 1.3));
  return baseY - amp * h;
}

#define HORIZON 0.640
#define SUNX 0.5
#define SUNY 0.560

// Fiery sunset sky: a strong vertical gradient + soft cloud strata + the sun's glow.
float3 skyColor(float2 p, float aspect) {
  float t = saturate(p.y / HORIZON);                 // 0 zenith .. 1 horizon
  // bold high-contrast ramp: deep violet -> royal blue -> magenta -> orange -> gold
  float3 zen = float3(0.10, 0.05, 0.26);
  float3 hib = float3(0.26, 0.10, 0.42);
  float3 mag = float3(0.72, 0.18, 0.42);
  float3 org = float3(1.00, 0.46, 0.18);
  float3 gld = float3(1.00, 0.80, 0.36);
  float3 c = lerp(zen, hib, smoothstep(0.00, 0.34, t));
  c = lerp(c, mag, smoothstep(0.30, 0.62, t));
  c = lerp(c, org, smoothstep(0.60, 0.86, t));
  c = lerp(c, gld, smoothstep(0.86, 1.02, t));

  // radial warm glow blooming up from the sun on the horizon seam. Kept gentle so the
  // sky stays inside [0,1] (the sigmoid-bounded net can only paint values it can REACH;
  // the cinematic over-brightness is added later by the HDR bloom pass on the prediction).
  float2 d = (p - float2(SUNX, SUNY)) * float2(aspect, 1.0);
  float r = length(d);
  c = lerp(c, float3(1.00, 0.66, 0.34), saturate(exp(-r * 3.0) * 0.80));     // wide warm halo
  c = lerp(c, float3(1.00, 0.82, 0.52), saturate(exp(-r * 8.0) * 0.70));     // inner glow

  // band-limited cloud strata catching the sunset light (smooth, low-frequency)
  float band = fbm(float2(p.x * 3.2, p.y * 5.0 + 0.5));
  float strata = smoothstep(0.30, 0.95, sin(p.y * 16.0 + 1.4 * band + p.x * 1.2) * 0.5 + 0.5);
  strata *= smoothstep(0.06, 0.34, t) * (1.0 - smoothstep(0.78, 1.0, t));   // mid-sky only
  float cloudLight = saturate(1.0 - r * 1.4);                       // lit near the sun
  c = lerp(c, lerp(float3(0.34, 0.12, 0.24), float3(1.00, 0.66, 0.38), cloudLight), strata * 0.40);

  // the SUN disc itself (huge, soft-edged, white-hot core) — saturates to ~1.0, no overshoot
  float sun = smoothstep(0.168, 0.128, r);
  float sunCore = smoothstep(0.092, 0.034, r);
  c = lerp(c, float3(1.00, 0.80, 0.48), sun);
  c = lerp(c, float3(1.00, 0.98, 0.88), sunCore);
  return min(c, 1.0);
}

// Snow-capped mountain silhouette range. Returns rgb; outputs skyline height at x.
float3 mountains(float2 p, float aspect, out float skylineY) {
  // two ranges for depth (far hazy violet -> near dark with snow + alpenglow)
  float farY  = ridgeHeight(p.x, 0.560, 0.075, 5.7, 0.9);
  float nearY = ridgeHeight(p.x, 0.640, 0.150, 3.7, 2.1);
  skylineY = min(farY, nearY);
  float3 c = float3(0.0, 0.0, 0.0);

  // far range: hazy violet silhouette against the glow (atmospheric perspective)
  float farMask = smoothstep(farY - 0.0035, farY + 0.0035, p.y) * step(p.y, HORIZON + 0.02);
  c = lerp(c, float3(0.34, 0.20, 0.40), farMask);

  // near range: dark cool rock, warm alpenglow on the sun-facing slopes, crisp snow caps.
  float nearMask = smoothstep(nearY - 0.0035, nearY + 0.0035, p.y) * step(p.y, HORIZON + 0.02);
  float slope = ridgeHeight(p.x + 0.004, 0.640, 0.150, 3.7, 2.1) - nearY;
  float lit = saturate(-slope * sign(p.x - SUNX) * 60.0);          // faces toward the sun
  float3 rock = float3(0.08, 0.07, 0.13);
  float3 face = lerp(rock, float3(0.78, 0.34, 0.24), lit * 0.85);  // warm alpenglow face
  // snow cap hugging the band just under each ridge; thicker on the peaks
  float belowRidge = p.y - nearY;
  float peakiness = saturate((0.640 - nearY) / 0.150);
  float snow = smoothstep(0.040 + 0.045 * peakiness, 0.0, belowRidge)
             * smoothstep(0.0, 0.006, belowRidge)
             * (0.45 + 0.55 * peakiness);
  float3 snowCol = lerp(float3(0.70, 0.66, 0.86), float3(1.00, 0.82, 0.66), lit); // lit snow warmer
  float3 nearCol = lerp(face, snowCol, saturate(snow));
  c = lerp(c, nearCol, nearMask);
  return c;
}

float3 sceneAbove(float2 p, float aspect) {
  float3 col = skyColor(p, aspect);
  float skylineY;
  float3 mt = mountains(p, aspect, skylineY);
  float mMask = step(skylineY, p.y) * step(p.y, HORIZON);
  return lerp(col, mt, mMask);
}

float3 target(float2 uv) {
  float2 p = uv;                        // y down (0 = top)
  float aspect = float(uWidth) / float(uHeight);

  float3 col;
  if (p.y < HORIZON) {
    // ── sky + mountains (above the waterline) ──
    col = sceneAbove(p, aspect);
  } else {
    // ── lake: mirror the scene above the horizon, gently ripple-broken + darkened ──
    float depth = saturate((p.y - HORIZON) / (1.0 - HORIZON));
    float ripple = 0.008 * sin(p.y * 42.0 + p.x * 6.0) * (0.3 + 0.7 * depth);
    float2 rp = float2(p.x + ripple, HORIZON - (p.y - HORIZON) * 1.0);
    float3 refl = (rp.y < HORIZON) ? sceneAbove(rp, aspect) : float3(0.06, 0.04, 0.12);
    // darken + cool the reflection, fading into deep water with depth
    float3 water = lerp(float3(0.10, 0.06, 0.16), float3(0.02, 0.02, 0.06), depth);
    col = lerp(refl * float3(0.82, 0.74, 0.86), water, 0.30 + 0.50 * depth);
    // a bright sun-glitter column straight down from the sun on the seam
    float glit = exp(-abs(p.x - SUNX) * aspect * 2.6) * (0.55 + 0.45 * sin(p.y * 70.0));
    col = lerp(col, float3(1.00, 0.74, 0.44), saturate(glit) * (1.0 - depth * 0.7) * 0.65);
    // warm waterline glow: a soft bright band right at the horizon so sky -> lake reads as
    // one continuous picture (the sun's light pooling on the near water), not a hard seam.
    float wl = exp(-depth * 14.0);
    col = lerp(col, float3(1.00, 0.70, 0.42), wl * (0.45 + 0.30 * exp(-abs(p.x - SUNX) * aspect * 1.6)));
  }
  return clamp(col, 0.0, 1.0);
}
`;

// SIREN forward over the LIVE weights (StructuredBuffer SRVs). Returns RGB in [0,1].
// Hidden activation sin(omega*z); output sigmoid. Activations kept in registers.
const FORWARD_SRV = `
StructuredBuffer<float> W1 : register(t0);
StructuredBuffer<float> B1 : register(t1);
StructuredBuffer<float> W2 : register(t2);
StructuredBuffer<float> B2 : register(t3);
StructuredBuffer<float> W3 : register(t4);
StructuredBuffer<float> B3 : register(t5);
StructuredBuffer<float> W4 : register(t6);
StructuredBuffer<float> B4 : register(t7);

float3 netForward(float2 uv) {
  float2 x = uv * 2.0 - 1.0;        // center coords to [-1,1]
  float a1[H1];
  [loop] for (int j1 = 0; j1 < H1; j1++) {
    float s = B1[j1];
    s += W1[j1 * INPUT + 0] * x.x;
    s += W1[j1 * INPUT + 1] * x.y;
    a1[j1] = sin(uOmega0 * s);
  }
  float a2[H2];
  [loop] for (int j2 = 0; j2 < H2; j2++) {
    float s = B2[j2];
    [loop] for (int i2 = 0; i2 < H1; i2++) s += W2[j2 * H1 + i2] * a1[i2];
    a2[j2] = sin(uOmega * s);
  }
  float a3[H3];
  [loop] for (int j3 = 0; j3 < H3; j3++) {
    float s = B3[j3];
    [loop] for (int i3 = 0; i3 < H2; i3++) s += W3[j3 * H2 + i3] * a2[i3];
    a3[j3] = sin(uOmega * s);
  }
  float3 o;
  [unroll] for (int k = 0; k < OUTN; k++) {
    float s = B4[k];
    [loop] for (int i4 = 0; i4 < H3; i4++) s += W4[k * H3 + i4] * a3[i4];
    o[k] = 1.0 / (1.0 + exp(-s));   // sigmoid -> [0,1]
  }
  return o;
}
`;

// ── ZERO-GRAD kernel: clear all eight gradient accumulators (u0..u7) by index. ──
// GB4 has OUT+1 cells; clearing index OUT zeroes the folded fixed-point loss too.
const ZERO_CS = `
${NET_DECLS}
RWStructuredBuffer<uint> GW1 : register(u0);
RWStructuredBuffer<uint> GB1 : register(u1);
RWStructuredBuffer<uint> GW2 : register(u2);
RWStructuredBuffer<uint> GB2 : register(u3);
RWStructuredBuffer<uint> GW3 : register(u4);
RWStructuredBuffer<uint> GB3 : register(u5);
RWStructuredBuffer<uint> GW4 : register(u6);
RWStructuredBuffer<uint> GB4 : register(u7);

[numthreads(256,1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint i = id.x;
  if (i < ${W1_N}u)   GW1[i] = 0u;
  if (i < ${W2_N}u)   GW2[i] = 0u;
  if (i < ${W3_N}u)   GW3[i] = 0u;
  if (i < ${W4_N}u)   GW4[i] = 0u;
  if (i < ${H1}u)     GB1[i] = 0u;
  if (i < ${H2}u)     GB2[i] = 0u;
  if (i < ${H3}u)     GB3[i] = 0u;
  if (i < ${OUT + 1}u) GB4[i] = 0u;
}
`;

// ── TRAIN kernel: SIREN forward + backprop + grad accumulate ───────────────────
const TRAIN_CS = `
${NET_DECLS}
${TARGET_IMG}

StructuredBuffer<float> W1 : register(t0);
StructuredBuffer<float> B1 : register(t1);
StructuredBuffer<float> W2 : register(t2);
StructuredBuffer<float> B2 : register(t3);
StructuredBuffer<float> W3 : register(t4);
StructuredBuffer<float> B3 : register(t5);
StructuredBuffer<float> W4 : register(t6);
StructuredBuffer<float> B4 : register(t7);

RWStructuredBuffer<uint> GW1 : register(u0);
RWStructuredBuffer<uint> GB1 : register(u1);
RWStructuredBuffer<uint> GW2 : register(u2);
RWStructuredBuffer<uint> GB2 : register(u3);
RWStructuredBuffer<uint> GW3 : register(u4);
RWStructuredBuffer<uint> GB3 : register(u5);
RWStructuredBuffer<uint> GW4 : register(u6);
RWStructuredBuffer<uint> GB4 : register(u7);   // [0..OUT-1] = b4 grads, [OUT] = MSE acc

uint hash(uint s) {
  s ^= 2747636419u; s *= 2654435769u;
  s ^= s >> 16; s *= 2654435769u;
  s ^= s >> 16; s *= 2654435769u;
  return s;
}
void atomicAddF(RWStructuredBuffer<uint> buf, uint idx, float g) {
  int q = (int)round(g * uGradScale);
  uint prev; InterlockedAdd(buf[idx], (uint)q, prev);
}

[numthreads(64,1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint s = id.x;
  if (s >= uBatch) return;

  uint h = hash(s * 2654435761u + uFrame * 40503u + 0x9e3779b9u);
  uint px = h % uWidth;
  uint py = (h / uWidth) % uHeight;
  float2 uv = float2((float(px) + 0.5) / float(uWidth), (float(py) + 0.5) / float(uHeight));
  float2 xin = uv * 2.0 - 1.0;

  // ---- FORWARD (keep activation a[] and sin-derivative gain g[] = omega*cos(omega*z)) ----
  float a1[H1]; float g1[H1];
  [loop] for (int fj = 0; fj < H1; fj++) {
    float z = B1[fj] + W1[fj * INPUT + 0] * xin.x + W1[fj * INPUT + 1] * xin.y;
    a1[fj] = sin(uOmega0 * z);
    g1[fj] = uOmega0 * cos(uOmega0 * z);
  }
  float a2[H2]; float g2[H2];
  [loop] for (int gj = 0; gj < H2; gj++) {
    float z = B2[gj];
    [loop] for (int gi = 0; gi < H1; gi++) z += W2[gj * H1 + gi] * a1[gi];
    a2[gj] = sin(uOmega * z);
    g2[gj] = uOmega * cos(uOmega * z);
  }
  float a3[H3]; float g3[H3];
  [loop] for (int hj = 0; hj < H3; hj++) {
    float z = B3[hj];
    [loop] for (int hi = 0; hi < H2; hi++) z += W3[hj * H2 + hi] * a2[hi];
    a3[hj] = sin(uOmega * z);
    g3[hj] = uOmega * cos(uOmega * z);
  }
  float3 outv;
  [unroll] for (int ok = 0; ok < OUTN; ok++) {
    float z = B4[ok];
    [loop] for (int oi = 0; oi < H3; oi++) z += W4[ok * H3 + oi] * a3[oi];
    outv[ok] = 1.0 / (1.0 + exp(-z));
  }

  // ---- LOSS + OUTPUT DELTA ----
  float3 tgt = target(uv);
  float3 diff = outv - tgt;
  float mse = dot(diff, diff) / 3.0;
  uint lq; InterlockedAdd(GB4[${OUT}], (uint)(mse * 1000000.0), lq);

  float invN = 1.0 / float(uBatch);
  float3 dOut;
  [unroll] for (int dk = 0; dk < OUTN; dk++) {
    float dl = (2.0 / 3.0) * diff[dk] * invN;          // d(mse)/d(out_k)
    dOut[dk] = dl * outv[dk] * (1.0 - outv[dk]);        // * sigmoid'
  }

  // ---- BACKPROP layer 4 (output): dW4, dB4 ; delta3 = W4^T dOut ⊙ g3 ----
  float delta3[H3];
  [loop] for (int c3 = 0; c3 < H3; c3++) delta3[c3] = 0.0;
  [unroll] for (int bk = 0; bk < OUTN; bk++) {
    atomicAddF(GB4, (uint)bk, dOut[bk]);
    [loop] for (int b4i = 0; b4i < H3; b4i++) {
      atomicAddF(GW4, (uint)(bk * H3 + b4i), dOut[bk] * a3[b4i]);
      delta3[b4i] += dOut[bk] * W4[bk * H3 + b4i];
    }
  }
  [loop] for (int r3 = 0; r3 < H3; r3++) delta3[r3] *= g3[r3];

  // ---- BACKPROP layer 3: dW3, dB3 ; delta2 = W3^T delta3 ⊙ g2 ----
  float delta2[H2];
  [loop] for (int c2 = 0; c2 < H2; c2++) delta2[c2] = 0.0;
  [loop] for (int b3j = 0; b3j < H3; b3j++) {
    float d = delta3[b3j];
    atomicAddF(GB3, (uint)b3j, d);
    [loop] for (int b3i = 0; b3i < H2; b3i++) {
      atomicAddF(GW3, (uint)(b3j * H2 + b3i), d * a2[b3i]);
      delta2[b3i] += d * W3[b3j * H2 + b3i];
    }
  }
  [loop] for (int r2 = 0; r2 < H2; r2++) delta2[r2] *= g2[r2];

  // ---- BACKPROP layer 2: dW2, dB2 ; delta1 = W2^T delta2 ⊙ g1 ----
  float delta1[H1];
  [loop] for (int c1 = 0; c1 < H1; c1++) delta1[c1] = 0.0;
  [loop] for (int b2j = 0; b2j < H2; b2j++) {
    float d = delta2[b2j];
    atomicAddF(GB2, (uint)b2j, d);
    [loop] for (int b2i = 0; b2i < H1; b2i++) {
      atomicAddF(GW2, (uint)(b2j * H1 + b2i), d * a1[b2i]);
      delta1[b2i] += d * W2[b2j * H1 + b2i];
    }
  }
  [loop] for (int r1 = 0; r1 < H1; r1++) delta1[r1] *= g1[r1];

  // ---- BACKPROP layer 1: dW1, dB1 (inputs are the raw coords) ----
  [loop] for (int b1j = 0; b1j < H1; b1j++) {
    float d = delta1[b1j];
    atomicAddF(GB1, (uint)b1j, d);
    atomicAddF(GW1, (uint)(b1j * INPUT + 0), d * xin.x);
    atomicAddF(GW1, (uint)(b1j * INPUT + 1), d * xin.y);
  }
}
`;

// ── ADAM kernel (generic, one parameter buffer per dispatch) ───────────────────
const ADAM_CS = `
${NET_DECLS}
RWStructuredBuffer<float> P : register(u0);
RWStructuredBuffer<float> M : register(u1);
RWStructuredBuffer<float> S : register(u2);
StructuredBuffer<uint> G : register(t0);
[numthreads(256,1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint i = id.x;
  if (i >= uCount) return;
  float g = float((int)G[i]) / uGradScale;
  float m = uB1 * M[i] + (1.0 - uB1) * g;
  float v = uB2 * S[i] + (1.0 - uB2) * g * g;
  M[i] = m; S[i] = v;
  float mh = m / uBc1;
  float vh = v / uBc2;
  P[i] -= uLr * mh / (sqrt(vh) + uEps);
}
`;

// ── Vertex: full-screen triangle ───────────────────────────────────────────────
const VS = `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o;
  float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p;
  o.pos = float4(p * float2(2.0, -2.0) + float2(-1.0, 1.0), 0.0, 1.0);
  return o;
}
`;

// ── PASS 1 PS: evaluate the LIVE SIREN per-pixel into an offscreen HDR texture ──
const PS_NET = `
${NET_DECLS}
${FORWARD_SRV}
float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  return float4(netForward(uv), 1.0);
}
`;

// ── PASS 2 PS: bright-pass (HDR -> bloom seed) ─────────────────────────────────
const PS_BRIGHT = `
${NET_DECLS}
Texture2D Src : register(t0);
SamplerState Samp : register(s0);
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float3 c = Src.Sample(Samp, uv).rgb;
  float l = dot(c, float3(0.2126, 0.7152, 0.0722));
  // soft-knee bright pass: catch the sun, the sky glow, the snow and the glitter column
  float k = smoothstep(0.38, 0.78, l);
  return float4(c * k * 1.85, 1.0);
}
`;

// ── PASS 3 PS: separable Gaussian blur (uBlurDir picks horizontal/vertical) ────
const PS_BLUR = `
${NET_DECLS}
Texture2D Src : register(t0);
SamplerState Samp : register(s0);
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 dir = (uBlurDir < 0.5) ? float2(1.0, 0.0) : float2(0.0, 1.0);
  float2 texel = dir / float2(float(uWidth), float(uHeight));
  // 9-tap Gaussian (sigma ~ 2.2), generous radius for a soft cinematic bloom
  float w[5] = { 0.227027, 0.194595, 0.121622, 0.054054, 0.016216 };
  float3 c = Src.Sample(Samp, uv).rgb * w[0];
  [unroll] for (int i = 1; i < 5; i++) {
    float2 o = texel * (float(i) * 1.7);
    c += Src.Sample(Samp, uv + o).rgb * w[i];
    c += Src.Sample(Samp, uv - o).rgb * w[i];
  }
  return float4(c, 1.0);
}
`;

// ── PASS 4 PS: composite TARGET | (wiped) NEURAL with bloom + HUD ──────────────
const PS_COMPOSITE = `
${NET_DECLS}
${TARGET_IMG}
Texture2D NetTex : register(t0);
Texture2D BloomTex : register(t1);
SamplerState Samp : register(s0);
StructuredBuffer<float> LossPlot : register(t2);

// ── ACES filmic tonemap (approx) ──
float3 aces(float3 x) {
  float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return saturate((x * (a * x + b)) / (x * (c * x + d) + e));
}

float hashS(float2 p) {
  p = frac(p * float2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return frac(p.x * p.y);
}

float3 sampleNet(float2 uv) {
  float2 px = float2(1.0 / float(uWidth), 1.0 / float(uHeight));
  // tiny 3x3 tent to wipe the last per-pixel fit noise (scene detail is far below cutoff)
  float3 sum = 0.0.xxx; float wsum = 0.0;
  [unroll] for (int j = -1; j <= 1; j++) {
    [unroll] for (int i = -1; i <= 1; i++) {
      float wq = exp(-(float(i * i + j * j)) / 1.6);
      sum += NetTex.Sample(Samp, uv + float2(float(i), float(j)) * px).rgb * wq;
      wsum += wq;
    }
  }
  return sum / wsum;
}

// ── 5x7 bitmap font baked into the frame so HUD type survives capture ──────────
// Codes: 0=T 1=A 2=R 3=G 4=E 5=N 6=U 7=L 8=space 9=S 10=P 11=M 12=O 13=. 14=-
//        15..24=0..9  25=e 26=: 27=d 28=B 29=H 30=I 31=C 32=W 33=+
float glyphRow(int code, int row) {
  if (code == 0)  { int r[7]={31, 4, 4, 4, 4, 4, 4}; return r[row]; }
  if (code == 1)  { int r[7]={14,17,17,31,17,17,17}; return r[row]; }
  if (code == 2)  { int r[7]={30,17,17,30,20,18,17}; return r[row]; }
  if (code == 3)  { int r[7]={14,17,16,23,17,17,14}; return r[row]; }
  if (code == 4)  { int r[7]={31,16,16,30,16,16,31}; return r[row]; }
  if (code == 5)  { int r[7]={17,25,21,19,17,17,17}; return r[row]; }
  if (code == 6)  { int r[7]={17,17,17,17,17,17,14}; return r[row]; }
  if (code == 7)  { int r[7]={16,16,16,16,16,16,31}; return r[row]; }
  if (code == 9)  { int r[7]={15,16,16,14, 1, 1,30}; return r[row]; }
  if (code == 10) { int r[7]={30,17,17,30,16,16,16}; return r[row]; }
  if (code == 11) { int r[7]={17,27,21,17,17,17,17}; return r[row]; }
  if (code == 12) { int r[7]={14,17,17,17,17,17,14}; return r[row]; }
  if (code == 13) { int r[7]={ 0, 0, 0, 0, 0, 0, 4}; return r[row]; }
  if (code == 14) { int r[7]={ 0, 0, 0,31, 0, 0, 0}; return r[row]; }
  if (code == 15) { int r[7]={14,17,19,21,25,17,14}; return r[row]; }
  if (code == 16) { int r[7]={ 4,12, 4, 4, 4, 4,14}; return r[row]; }
  if (code == 17) { int r[7]={14,17, 1, 2, 4, 8,31}; return r[row]; }
  if (code == 18) { int r[7]={31, 2, 4, 2, 1,17,14}; return r[row]; }
  if (code == 19) { int r[7]={ 2, 6,10,18,31, 2, 2}; return r[row]; }
  if (code == 20) { int r[7]={31,16,30, 1, 1,17,14}; return r[row]; }
  if (code == 21) { int r[7]={ 6, 8,16,30,17,17,14}; return r[row]; }
  if (code == 22) { int r[7]={31, 1, 2, 4, 8, 8, 8}; return r[row]; }
  if (code == 23) { int r[7]={14,17,17,14,17,17,14}; return r[row]; }
  if (code == 24) { int r[7]={14,17,17,15, 1, 2,12}; return r[row]; }
  if (code == 25) { int r[7]={ 0, 0,14,17,31,16,14}; return r[row]; }
  if (code == 26) { int r[7]={ 0, 4, 0, 0, 0, 4, 0}; return r[row]; }
  if (code == 27) { int r[7]={ 1, 1, 1,15,17,17,15}; return r[row]; }  // d
  if (code == 28) { int r[7]={30,17,17,30,17,17,30}; return r[row]; }  // B
  if (code == 29) { int r[7]={17,17,17,31,17,17,17}; return r[row]; }  // H
  if (code == 30) { int r[7]={31, 4, 4, 4, 4, 4,31}; return r[row]; }  // I
  if (code == 31) { int r[7]={14,17,16,16,16,17,14}; return r[row]; }  // C
  if (code == 32) { int r[7]={17,17,17,21,21,27,17}; return r[row]; }  // W
  if (code == 33) { int r[7]={ 0, 4, 4,31, 4, 4, 0}; return r[row]; }  // +
  if (code == 34) { int r[7]={31,16,16,30,16,16,16}; return r[row]; }  // F
  if (code == 35) { int r[7]={30,17,17,17,17,17,30}; return r[row]; }  // D
  return 0;
}
float glyphPix(int code, int cx, int cy) {
  if (cx < 0 || cx > 4 || cy < 0 || cy > 6) return 0.0;
  int rowBits = (int)glyphRow(code, cy);
  return ((rowBits >> (4 - cx)) & 1) ? 1.0 : 0.0;
}
float drawText(float2 frag, float2 org, float s, int codes[14], int len) {
  float2 local = (frag - org) / s;
  int gi = (int)floor(local.x / 6.0);
  if (gi < 0 || gi >= len) return 0.0;
  int cx = (int)floor(local.x - float(gi) * 6.0);
  int cy = (int)floor(local.y);
  return glyphPix(codes[gi], cx, cy);
}
float drawGlyph(float2 frag, float2 org, float s, int code) {
  float2 local = (frag - org) / s;
  int cx = (int)floor(local.x);
  int cy = (int)floor(local.y);
  if (cx < 0 || cx > 4) return 0.0;
  return glyphPix(code, cx, cy);
}
float lossCurveAt(float fx) {
  int n = (int)uPlotCount;
  if (n < 2) return 0.0;
  float s = saturate(fx) * float(n - 1);
  int i0 = (int)floor(s);
  int i1 = min(i0 + 1, n - 1);
  float f = s - float(i0);
  return lerp(LossPlot[i0], LossPlot[i1], f);
}

float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float aspect = float(uWidth) / float(uHeight);
  float wipe = uWipe;                      // 0..1, sweeps left->right as net learns
  float px = 1.0 / float(uWidth);
  float2 frag = uv * float2(float(uWidth), float(uHeight));

  float3 tgt = target(uv);                 // analytic ground truth
  float3 net = sampleNet(uv);              // live SIREN prediction

  // ── reveal: right of the wipe shows the NET; left shows the TARGET. Just ahead of
  // the wipe front the still-converging net dissolves out of structured noise. ──
  float frontW = 0.05;                     // soft front width
  float reveal = smoothstep(wipe - frontW, wipe + frontW, uv.x);  // 0 target .. 1 net
  // pre-reveal noise dissolve: where the front is sweeping, mix in dithered noise so it
  // looks like the picture is precipitating out of static.
  float n = hashS(frag + float2(uFrame * 1.7, 0.0));
  float dissolve = smoothstep(0.0, 1.0, abs(uv.x - wipe) / max(frontW, 1e-3));
  float3 noisy = lerp(float3(n, n, n) * float3(0.5, 0.65, 0.9), net, saturate(dissolve));
  float3 right = lerp(noisy, net, saturate(dissolve));
  float3 col = lerp(tgt, right, reveal);

  // ── HDR bloom add + exposure + saturation lift + ACES filmic tonemap ──
  float3 bloom = BloomTex.Sample(Samp, uv).rgb;
  col += bloom * uBloomStr;                                 // additive HDR bloom
  col += bloom * bloom * float3(1.0, 0.78, 0.5) * 0.6;      // warm squared-bloom glow on the sun
  col = aces(col * 1.24);                                   // exposure lift into the filmic curve
  float lum = dot(col, float3(0.2126, 0.7152, 0.0722));
  col = lerp(float3(lum, lum, lum), col, 1.16);             // richer saturation
  // golden-hour split-tone: warm the highlights, gently cool the shadows
  col += (float3(0.05, 0.02, -0.03)) * smoothstep(0.45, 1.0, lum);
  col += (float3(-0.01, 0.0, 0.03)) * (1.0 - smoothstep(0.0, 0.35, lum));
  col = saturate(col);

  // ── the wipe seam: a bright vertical light bar with a glow + scan pulse ──
  float dl = abs(uv.x - wipe);
  float seam = smoothstep(2.0 * px, 0.0, dl);
  float glow = smoothstep(22.0 * px, 0.0, dl);
  float scan = exp(-pow((uv.y - uScanY) * 5.0, 2.0));
  col = lerp(col, float3(0.85, 0.97, 1.0), seam * 0.9 * step(wipe, 0.999) * step(0.001, wipe));
  col += float3(0.20, 0.45, 0.70) * glow * 0.30 * step(wipe, 0.999) * step(0.001, wipe);
  col += float3(0.45, 0.72, 1.0) * smoothstep(40.0 * px, 0.0, dl) * scan * 0.22 * step(wipe, 0.999);

  // ── vignette ──
  float2 q = uv;
  float vig = pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.13);
  col *= lerp(0.80, 1.04, vig);

  // ── TARGET / NEURAL FIELD labels on translucent pills ──
  float sc = max(2.0, floor(float(uHeight) / 150.0));
  float lw = 6.0 * sc;
  float by = float(uHeight) - 18.0 - 7.0 * sc;
  int L_TARGET[14] = {0,1,2,3,4,0, 8,8,8,8,8,8,8,8};                 // TARGET
  float2 oL = float2(float(uWidth) * 0.25 - 3.0 * lw, by);
  float tL = drawText(frag, oL, sc, L_TARGET, 6);
  // right label "NEURAL FIELD" fades in once the wipe exposes that half
  int L_NF[14] = {5,4,6,2,1,7, 8,34,30,4,7,35, 8,8};                 // NEURAL FIELD
  float2 oR = float2(float(uWidth) * 0.75 - 6.0 * lw, by);
  float tR = drawText(frag, oR, sc, L_NF, 12) * smoothstep(0.30, 0.55, wipe);
  float padX = 1.5 * lw, padY = 1.2 * sc;
  float pillL = (frag.x > oL.x - padX && frag.x < oL.x + 6.0 * lw + padX &&
                 frag.y > oL.y - padY && frag.y < oL.y + 7.0 * sc + padY) ? 1.0 : 0.0;
  pillL *= smoothstep(0.55, 0.30, wipe);   // fade the TARGET pill out as net takes over
  float pillR = (frag.x > oR.x - padX && frag.x < oR.x + 12.0 * lw + padX &&
                 frag.y > oR.y - padY && frag.y < oR.y + 7.0 * sc + padY) ? 1.0 : 0.0;
  pillR *= smoothstep(0.30, 0.55, wipe);
  col = lerp(col, float3(0.02, 0.03, 0.06), (pillL + pillR) * 0.5);
  col = lerp(col, float3(0.97, 0.99, 1.0), saturate(tL * smoothstep(0.55, 0.30, wipe) + tR));

  // ── LIVE LOSS / PSNR HUD panel (top-left), procedural, baked into the frame ──
  float fsc = max(2.0, floor(float(uHeight) / 230.0));
  float gA = 6.0 * fsc;
  float panelX = 22.0, panelY = 18.0;
  float panelW = max(360.0, float(uWidth) * 0.31);
  float panelH = max(176.0, float(uHeight) * 0.30);
  float2 pmn = float2(panelX, panelY);
  float2 pmx = float2(panelX + panelW, panelY + panelH);
  bool inPanel = frag.x > pmn.x && frag.x < pmx.x && frag.y > pmn.y && frag.y < pmx.y;
  if (inPanel) {
    float2 rel = (frag - pmn) / (pmx - pmn);
    float edge = min(min(rel.x, 1.0 - rel.x), min(rel.y, 1.0 - rel.y));
    float border = smoothstep(0.012, 0.0, edge);
    float3 glass = lerp(float3(0.04, 0.07, 0.12), float3(0.015, 0.03, 0.06), rel.y);
    glass += float3(0.05, 0.10, 0.14) * smoothstep(0.10, 0.0, rel.y);
    col = lerp(col, glass, 0.90);
    col = lerp(col, float3(0.35, 0.74, 0.98), border * 0.9);

    float headerH = 11.0 * fsc;
    float footerH = 20.0 * fsc;
    float plotT = panelY + headerH;
    float plotB = panelY + panelH - footerH;
    float plotL = panelX + 12.0;
    float plotR = panelX + panelW - 12.0;
    bool inPlot = frag.x > plotL && frag.x < plotR && frag.y > plotT && frag.y < plotB;
    if (inPlot) {
      float gx = (frag.x - plotL) / (plotR - plotL);
      float gy = (frag.y - plotT) / (plotB - plotT);
      float grid = 0.0;
      grid += smoothstep(0.012, 0.0, abs(frac(gx * 6.0)));
      grid += smoothstep(0.016, 0.0, abs(frac(gy * 4.0)));
      col += float3(0.10, 0.22, 0.30) * saturate(grid) * 0.4;
      float curveY = lossCurveAt(gx);
      float dCurve = abs(gy - curveY);
      float curveLine = smoothstep(0.05, 0.0, dCurve);
      float core = smoothstep(0.018, 0.0, dCurve);
      float fill = smoothstep(0.0, 0.02, gy - curveY) * 0.14;
      col = lerp(col, float3(0.06, 0.45, 0.66), fill);
      col += float3(0.22, 0.88, 1.0) * curveLine * 0.55;
      col += float3(0.85, 1.0, 1.0) * core;
      float headY = lossCurveAt(1.0);
      float head = smoothstep(0.07, 0.0, length(float2((gx - 1.0) * 1.6, gy - headY)));
      col += float3(1.0, 0.97, 0.78) * head;
    }

    // HEADER: "LOSS" + "MSE m.me-x"
    float hy = panelY + 2.5 * fsc;
    int T_LOSS[14] = {7,12,9,9, 8,8,8,8,8,8,8,8,8,8};
    col = lerp(col, float3(0.74, 0.97, 1.0), saturate(drawText(frag, float2(panelX + 12.0, hy), fsc, T_LOSS, 4)));

    float lossV = max(uMse, 1e-12);
    float e10 = floor(log10(lossV));
    float mant = lossV / pow(10.0, e10);
    int m0 = (int)floor(mant);
    int m1 = (int)floor(frac(mant) * 10.0);
    int expA = (int)abs(e10);
    int e0 = expA / 10;
    int e1 = expA % 10;
    int eDigits = (e0 > 0) ? 2 : 1;
    float mseW = float(9 + eDigits) * gA;
    float mseX = plotR - mseW;
    int T_MSE[14] = {11,9,4,8, 8,8,8,8,8,8,8,8,8,8};
    col = lerp(col, float3(0.84, 1.0, 0.88), saturate(drawText(frag, float2(mseX, hy), fsc, T_MSE, 4)));
    float mvX = mseX + 4.0 * gA;
    float mse = 0.0;
    mse += drawGlyph(frag, float2(mvX + 0.0 * gA, hy), fsc, 15 + m0);
    mse += drawGlyph(frag, float2(mvX + 1.0 * gA, hy), fsc, 13);
    mse += drawGlyph(frag, float2(mvX + 2.0 * gA, hy), fsc, 15 + m1);
    mse += drawGlyph(frag, float2(mvX + 3.0 * gA, hy), fsc, 25);
    mse += drawGlyph(frag, float2(mvX + 4.0 * gA, hy), fsc, 14);
    if (e0 > 0) mse += drawGlyph(frag, float2(mvX + 5.0 * gA, hy), fsc, 15 + e0);
    mse += drawGlyph(frag, float2(mvX + (e0 > 0 ? 6.0 : 5.0) * gA, hy), fsc, 15 + e1);
    col = lerp(col, float3(0.86, 1.0, 0.90), saturate(mse));

    // FOOTER row 1: "EPOCH nnnnn"
    float fy1 = panelY + panelH - 17.0 * fsc;
    int T_EPOCH[14] = {4,10,12,31,29,8, 8,8,8,8,8,8,8,8};   // EPOCH
    col = lerp(col, float3(0.86, 0.95, 1.0), saturate(drawText(frag, float2(panelX + 12.0, fy1), fsc, T_EPOCH, 6)));
    float numX = panelX + 12.0 + 6.0 * gA;
    uint sv = (uint)uEpoch;
    int digits[6];
    [unroll] for (int di = 0; di < 6; di++) { digits[di] = (int)(sv % 10u); sv /= 10u; }
    uint tmp = (uint)uEpoch; int nd = 1;
    [unroll] for (int dc = 0; dc < 5; dc++) { tmp /= 10u; if (tmp > 0u) nd++; }
    float epochNum = 0.0;
    [unroll] for (int dr = 0; dr < 6; dr++) {
      if (dr < nd) epochNum += drawGlyph(frag, float2(numX + float(dr) * gA, fy1), fsc, 15 + digits[nd - 1 - dr]);
    }
    col = lerp(col, float3(1.0, 0.98, 0.84), saturate(epochNum));

    // FOOTER row 2: "PSNR nn.n dB"  (the headline 'wow' number)
    float fy2 = panelY + panelH - 8.5 * fsc;
    int T_PSNR[14] = {10,9,5,2,8, 8,8,8,8,8,8,8,8,8};       // PSNR
    col = lerp(col, float3(0.80, 1.0, 0.92), saturate(drawText(frag, float2(panelX + 12.0, fy2), fsc, T_PSNR, 5)));
    float pX = panelX + 12.0 + 5.0 * gA;
    float psnr = clamp(uPsnr, 0.0, 99.0);
    int p10 = (int)floor(psnr / 10.0);
    int p1  = (int)floor(psnr) % 10;
    int pd  = (int)floor(frac(psnr) * 10.0);
    float pnum = 0.0;
    pnum += drawGlyph(frag, float2(pX + 0.0 * gA, fy2), fsc, 15 + p10);
    pnum += drawGlyph(frag, float2(pX + 1.0 * gA, fy2), fsc, 15 + p1);
    pnum += drawGlyph(frag, float2(pX + 2.0 * gA, fy2), fsc, 13);     // .
    pnum += drawGlyph(frag, float2(pX + 3.0 * gA, fy2), fsc, 15 + pd);
    int T_DB[14] = {27,28,8, 8,8,8,8,8,8,8,8,8,8,8};        // dB
    pnum += drawText(frag, float2(pX + 4.5 * gA, fy2), fsc, T_DB, 2);
    col = lerp(col, float3(0.90, 1.0, 0.95), saturate(pnum));
  }

  return float4(saturate(col), 1.0);
}
`;

// ── Compile + create shaders ────────────────────────────────────────────────────
const zeroCode = compile(ZERO_CS, 'main', 'cs_5_0');
const trainCode = compile(TRAIN_CS, 'main', 'cs_5_0');
const adamCode = compile(ADAM_CS, 'main', 'cs_5_0');
const vsCode = compile(VS, 'main', 'vs_5_0');
const psNetCode = compile(PS_NET, 'main', 'ps_5_0');
const psBrightCode = compile(PS_BRIGHT, 'main', 'ps_5_0');
const psBlurCode = compile(PS_BLUR, 'main', 'ps_5_0');
const psCompCode = compile(PS_COMPOSITE, 'main', 'ps_5_0');

const zeroCs = makeComputeShader(zeroCode);
const trainCs = makeComputeShader(trainCode);
const adamCs = makeComputeShader(adamCode);
const vs = makeVertexShader(vsCode);
const psNet = makePixelShader(psNetCode);
const psBright = makePixelShader(psBrightCode);
const psBlur = makePixelShader(psBlurCode);
const psComp = makePixelShader(psCompCode);

// Offscreen HDR textures: the SIREN prediction, a half-res bright/bloom ping-pong.
const netTex = makeTexture({ w: clientW, h: clientH, format: DXGI_FORMAT_R16G16B16A16_FLOAT, rtv: true, srv: true });
const bloomW = Math.max(1, Math.floor(clientW / 2));
const bloomH = Math.max(1, Math.floor(clientH / 2));
const bloomA = makeTexture({ w: bloomW, h: bloomH, format: DXGI_FORMAT_R16G16B16A16_FLOAT, rtv: true, srv: true });
const bloomB = makeTexture({ w: bloomW, h: bloomH, format: DXGI_FORMAT_R16G16B16A16_FLOAT, rtv: true, srv: true });
const linSampler = makeSampler({ filter: D3D11_FILTER_MIN_MAG_MIP_LINEAR, address: D3D11_TEXTURE_ADDRESS_CLAMP });

// ── Per-parameter Adam dispatch descriptors ─────────────────────────────────────
interface AdamGroup { uav: Buffer; srv: Buffer; count: number; groups: number; }
function adamGroup(p: { uav?: bigint }, m: { uav?: bigint }, s: { uav?: bigint }, g: { srv?: bigint }, count: number): AdamGroup {
  const uav = Buffer.alloc(8 * 3);
  uav.writeBigUInt64LE(p.uav!, 0);
  uav.writeBigUInt64LE(m.uav!, 8);
  uav.writeBigUInt64LE(s.uav!, 16);
  const srv = Buffer.alloc(8);
  srv.writeBigUInt64LE(g.srv!, 0);
  return { uav, srv, count, groups: Math.ceil(count / 256) };
}
const adamGroups: AdamGroup[] = [
  adamGroup(w1, mw1, sw1, gw1, W1_N),
  adamGroup(w2, mw2, sw2, gw2, W2_N),
  adamGroup(w3, mw3, sw3, gw3, W3_N),
  adamGroup(w4, mw4, sw4, gw4, W4_N),
  adamGroup(b1, mb1, sb1, gb1, H1),
  adamGroup(b2, mb2, sb2, gb2, H2),
  adamGroup(b3, mb3, sb3, gb3, H3),
  adamGroup(b4, mb4, sb4, gb4, OUT),
];

// ── Unbind helpers (avoid UAV/SRV hazards between passes) ───────────────────────
const nullArr8 = Buffer.alloc(8 * 9);
function clearCsUavs(count: number): void {
  vcall(gpu.context, CTX_CS_SET_UNORDERED_ACCESS_VIEWS, [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], [0, count, nullArr8.ptr!, null], FFIType.void);
}
function clearCsSrvs(count: number): void {
  vcall(gpu.context, CTX_CS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, count, nullArr8.ptr!], FFIType.void);
}

// ── GDI HUD font ─────────────────────────────────────────────────────────────
const hudFont = GDI32.CreateFontW(-20, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);
const TRANSPARENT_BK = 1;
const fullHist: number[] = [];

function drawShadowed(dc: bigint, x: number, y: number, str: string, fill: number, shadow = 0x00100800): void {
  const t = encodeWide(str);
  GDI32.SetTextColor(dc, shadow);
  GDI32.TextOutW(dc, x + 1, y + 1, t.ptr!, str.length);
  GDI32.SetTextColor(dc, fill);
  GDI32.TextOutW(dc, x, y, t.ptr!, str.length);
}
function drawHud(epoch: number, mseVal: number, psnr: number, fps: number): void {
  hud.draw(gpu, clientW, clientH, (dc) => {
    GDI32.SetBkMode(dc, TRANSPARENT_BK);
    const prevFont = GDI32.SelectObject(dc, hudFont);
    drawShadowed(dc, 20, clientH - 34, `SIREN  ${INPUT}-${H1}-${H2}-${H3}-3  ·  ${PARAM_TOTAL.toLocaleString()} params  ·  forward + backprop + Adam on GPU  ·  ${fps} fps  ·  ESC`, 0x00f5e8c8);
    GDI32.SelectObject(dc, prevFont);
  });
}

// ── Teardown ──────────────────────────────────────────────────────────────────
let cleaned = false;
function cleanup(code: number): never {
  if (!cleaned) {
    cleaned = true;
    hud.release();
    GDI32.DeleteObject(hudFont);
    for (const sb of [
      w1, b1, w2, b2, w3, b3, w4, b4,
      gw1, gb1, gw2, gb2, gw3, gb3, gw4, gb4,
      mw1, mb1, mw2, mb2, mw3, mb3, mw4, mb4,
      sw1, sb1, sw2, sb2, sw3, sb3, sw4, sb4, lossPlot,
    ]) {
      comRelease(sb.srv ?? 0n);
      comRelease(sb.uav ?? 0n);
      comRelease(sb.buffer);
    }
    comRelease(cb);
    comRelease(linSampler);
    for (const t of [netTex, bloomA, bloomB]) {
      comRelease(t.srv ?? 0n);
      comRelease(t.rtv ?? 0n);
      comRelease(t.tex);
    }
    comRelease(psComp);
    comRelease(psBlur);
    comRelease(psBright);
    comRelease(psNet);
    comRelease(vs);
    comRelease(adamCs);
    comRelease(trainCs);
    comRelease(zeroCs);
    comRelease(gpu.backBufferRTV);
    comRelease(gpu.swapChain);
    comRelease(gpu.context);
    comRelease(gpu.device);
    win.destroy();
  }
  process.exit(code);
}
process.on('SIGINT', () => cleanup(0));
process.on('uncaughtException', (err) => {
  console.error(err);
  cleanup(1);
});

console.log('Neural Descent — a deep SIREN neural field painting a photo live in pure TypeScript.');
console.log(`  ${clientW}x${clientH} · ${gpu.driver} · ${gpu.gpuName}`);
console.log(`  SIREN ${INPUT}→${H1}→${H2}→${H3}→3 · ${PARAM_TOTAL.toLocaleString()} params · sin(omega·z) · Adam · batch ${BATCH} · ${STEPS_PER_FRAME} steps/frame · lr ${LR}`);

// ── Training/render loop ──────────────────────────────────────────────────────
const start = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
const selfshot = process.env.SELFSHOT === '1';
const selfshotPath = process.env.SELFSHOT_PATH;
let frame = 0;
let totalSteps = 0;
let fps = 0;
let fpsFrames = 0;
let fpsWindow = start;
let lastMse = 1;
let smoothMse = 0;
let nextCheckpoint = 0;

const zeroGroups = Math.ceil(Math.max(W2_N, W3_N) / 256);
const trainGroups = Math.ceil(BATCH / 64);

const trainSrvArr = Buffer.alloc(8 * 8);
[w1.srv!, b1.srv!, w2.srv!, b2.srv!, w3.srv!, b3.srv!, w4.srv!, b4.srv!].forEach((s, i) => trainSrvArr.writeBigUInt64LE(s, i * 8));
// TRAIN + ZERO both bind exactly the eight grad buffers (u0..u7); GB4's extra cell
// carries the folded loss accumulator, so no 9th UAV is needed (FL11 caps CS at 8).
const gradUavArr = Buffer.alloc(8 * 8);
[gw1.uav!, gb1.uav!, gw2.uav!, gb2.uav!, gw3.uav!, gb3.uav!, gw4.uav!, gb4.uav!].forEach((u, i) => gradUavArr.writeBigUInt64LE(u, i * 8));

function bindCb(): void {
  const arr = Buffer.alloc(8);
  arr.writeBigUInt64LE(cb, 0);
  vcall(gpu.context, 71, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 1, arr.ptr!], FFIType.void);
}

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;

  const now = performance.now();
  const time = (now - start) / 1000;

  for (let stp = 0; stp < STEPS_PER_FRAME; stp += 1) {
    const decayT = Math.min(1, totalSteps / DECAY_STEPS);
    const lrNow = LR * (0.06 + 0.94 * 0.5 * (1 + Math.cos(Math.PI * decayT)));
    const t = totalSteps + 1;
    const bc1 = 1 - Math.pow(ADAM_B1, t);
    const bc2 = 1 - Math.pow(ADAM_B2, t);

    cbData.writeUInt32LE(clientW, 0);
    cbData.writeUInt32LE(clientH, 4);
    cbData.writeUInt32LE((frame * STEPS_PER_FRAME + stp) >>> 0, 8);
    cbData.writeUInt32LE(BATCH, 12);
    cbData.writeUInt32LE(totalSteps >>> 0, 16);
    cbData.writeUInt32LE(0, 20); // uCount per Adam dispatch
    cbData.writeUInt32LE(0, 24);
    cbData.writeUInt32LE(0, 28);
    cbData.writeFloatLE(lrNow, 32);
    cbData.writeFloatLE(GRAD_SCALE, 36);
    cbData.writeFloatLE(0.5, 40); // wipe (unused by compute)
    cbData.writeFloatLE(time, 44);
    cbData.writeFloatLE(ADAM_B1, 48);
    cbData.writeFloatLE(ADAM_B2, 52);
    cbData.writeFloatLE(ADAM_EPS, 56);
    cbData.writeFloatLE(OMEGA, 60);
    cbData.writeFloatLE(bc1, 64);
    cbData.writeFloatLE(bc2, 68);
    cbData.writeFloatLE(OMEGA0, 72);
    cbData.writeFloatLE(0, 76);
    updateConstantBuffer(cb, cbData);

    // Pass A: zero the eight gradient accumulators (GB4's extra cell = the loss).
    vcall(gpu.context, 69, [FFIType.u64, FFIType.ptr, FFIType.u32], [zeroCs, null, 0], FFIType.void);
    bindCb();
    vcall(gpu.context, CTX_CS_SET_UNORDERED_ACCESS_VIEWS, [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], [0, 8, gradUavArr.ptr!, null], FFIType.void);
    dispatch(zeroGroups, 1, 1);
    clearCsUavs(8);

    // Pass B: forward + backprop, accumulate gradients (SRV weights -> UAV grads).
    vcall(gpu.context, 69, [FFIType.u64, FFIType.ptr, FFIType.u32], [trainCs, null, 0], FFIType.void);
    bindCb();
    vcall(gpu.context, CTX_CS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 8, trainSrvArr.ptr!], FFIType.void);
    vcall(gpu.context, CTX_CS_SET_UNORDERED_ACCESS_VIEWS, [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], [0, 8, gradUavArr.ptr!, null], FFIType.void);
    dispatch(trainGroups, 1, 1);
    clearCsUavs(8);
    clearCsSrvs(8);

    // Pass C: ADAM update — one elementwise dispatch per parameter buffer.
    vcall(gpu.context, 69, [FFIType.u64, FFIType.ptr, FFIType.u32], [adamCs, null, 0], FFIType.void);
    for (const ag of adamGroups) {
      cbData.writeUInt32LE(ag.count, 20);
      updateConstantBuffer(cb, cbData);
      bindCb();
      vcall(gpu.context, CTX_CS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 1, ag.srv.ptr!], FFIType.void);
      vcall(gpu.context, CTX_CS_SET_UNORDERED_ACCESS_VIEWS, [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], [0, 3, ag.uav.ptr!, null], FFIType.void);
      dispatch(ag.groups, 1, 1);
      clearCsUavs(3);
      clearCsSrvs(1);
    }

    totalSteps += 1;
  }

  // Read back the loss from the last step (throttled). MSE is on [0,1] color, so PSNR
  // (dB) = -10*log10(MSE) — the headline 'how close are we' number.
  if (frame % 2 === 0) {
    const lb = readbackBuffer(gb4.buffer, (OUT + 1) * 4);
    const lq = new Uint32Array(lb)[OUT]!; // GB4[OUT] = fixed-point MSE accumulator
    lastMse = lq / 1000000 / BATCH;
    smoothMse = smoothMse <= 0 ? lastMse : smoothMse * 0.8 + lastMse * 0.2;
    fullHist.push(smoothMse);
  }
  if (totalSteps >= nextCheckpoint) {
    const psnr = lastMse > 0 ? -10 * Math.log10(lastMse) : 99;
    console.log(`  [train] step ${totalSteps} · MSE ${lastMse.toExponential(3)} · PSNR ${psnr.toFixed(1)} dB · ${time.toFixed(2)}s`);
    nextCheckpoint += 600;
  }

  // ── the convergence wipe: a luminous seam that sweeps left->right as the field
  // sharpens. Driven by PSNR over 20..40 dB so the two halves stay a live TARGET vs
  // NEURAL comparison for most of the run and only fuse into one picture near the end. ──
  const curMse = smoothMse > 0 ? smoothMse : lastMse;
  const psnr = curMse > 0 ? -10 * Math.log10(curMse) : 99;
  // Convergence cap: how far the reveal is ALLOWED to advance given the current fit
  // (PSNR 22..34 dB -> 0..1). The seam can never run ahead of the network's real quality,
  // so the wipe stays an honest "the net is good enough HERE" front.
  const convCap = Math.max(0, Math.min(1, (psnr - 22) / (34 - 22)));
  // Time pacing: a steady cinematic sweep so a live viewer SEES the seam travel for a few
  // seconds (rather than snapping across the instant the loss drops). It eases in, crosses
  // the sun near the middle of the run, and is told to fully clear the right edge by the end.
  const tPace = Math.max(0, Math.min(1, (time - 0.6) / WIPE_SECS));
  const paced = tPace * tPace * (3 - 2 * tPace);                 // smoothstep ease
  const wRaw = Math.min(paced, convCap);
  // hold fully-open once both pacing and convergence have crossed the finish line
  const wipe = wRaw >= 0.985 ? 1.0 : wRaw;

  // Build the in-frame loss curve (resample full descent to LOSS_PLOT_N, log-normalized).
  let plotCount = 0;
  if (fullHist.length >= 2) {
    let lo = Infinity;
    let hi = -Infinity;
    for (const v of fullHist) {
      const lg = Math.log10(Math.max(v, 1e-12));
      if (lg < lo) lo = lg;
      if (lg > hi) hi = lg;
    }
    const span = Math.max(1e-6, hi - lo);
    plotCount = LOSS_PLOT_N;
    for (let i = 0; i < LOSS_PLOT_N; i += 1) {
      const fx = i / (LOSS_PLOT_N - 1);
      const src = fx * (fullHist.length - 1);
      const i0 = Math.floor(src);
      const i1 = Math.min(i0 + 1, fullHist.length - 1);
      const f = src - i0;
      const v = fullHist[i0]! * (1 - f) + fullHist[i1]! * f;
      const lg = Math.log10(Math.max(v, 1e-12));
      const hgt = 1 - (lg - lo) / span; // 0 worst(top) .. 1 best(bottom)
      lossPlotData.writeFloatLE(hgt, i * 4);
    }
    updateDynamicBuffer(lossPlot.buffer, lossPlotData);
  }
  const scanY = 0.5 - 0.5 * Math.cos(time * 1.6);
  const decayTr = Math.min(1, totalSteps / DECAY_STEPS);
  const lrNowR = LR * (0.06 + 0.94 * 0.5 * (1 + Math.cos(Math.PI * decayTr)));
  const bloomStr = 1.05;

  // Constant buffer for the RENDER passes (HUD fields populated).
  cbData.writeUInt32LE(clientW, 0);
  cbData.writeUInt32LE(clientH, 4);
  cbData.writeUInt32LE(frame >>> 0, 8);
  cbData.writeUInt32LE(BATCH, 12);
  cbData.writeUInt32LE(totalSteps >>> 0, 16);
  cbData.writeUInt32LE(0, 20);
  cbData.writeUInt32LE(0, 24);
  cbData.writeUInt32LE(0, 28);
  cbData.writeFloatLE(LR, 32);
  cbData.writeFloatLE(GRAD_SCALE, 36);
  cbData.writeFloatLE(wipe, 40);
  cbData.writeFloatLE(time, 44);
  cbData.writeFloatLE(ADAM_B1, 48);
  cbData.writeFloatLE(ADAM_B2, 52);
  cbData.writeFloatLE(ADAM_EPS, 56);
  cbData.writeFloatLE(OMEGA, 60);
  cbData.writeFloatLE(0, 64);
  cbData.writeFloatLE(0, 68);
  cbData.writeFloatLE(OMEGA0, 72);
  cbData.writeFloatLE(0, 76);
  cbData.writeFloatLE(plotCount, 80);   // uPlotCount
  cbData.writeFloatLE(psnr, 84);        // uPsnr
  cbData.writeFloatLE(scanY, 88);       // uScanY
  cbData.writeFloatLE(curMse, 92);      // uMse
  cbData.writeFloatLE(totalSteps, 96);  // uEpoch
  cbData.writeFloatLE(lrNowR, 100);     // uLrNow
  cbData.writeFloatLE(0, 104);          // uBlurDir (set per blur pass)
  cbData.writeFloatLE(bloomStr, 108);   // uBloomStr
  updateConstantBuffer(cb, cbData);

  setViewport(clientW, clientH);
  vsSet(vs);

  // ── Pass 1: render the LIVE SIREN per-pixel into the offscreen HDR texture ──
  setRenderTargets([netTex.rtv!]);
  psSet(psNet, { cb: [cb], srv: [w1.srv!, b1.srv!, w2.srv!, b2.srv!, w3.srv!, b3.srv!, w4.srv!, b4.srv!] });
  drawFullscreenTriangle();
  vcall(gpu.context, 8, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 8, nullArr8.ptr!], FFIType.void);
  setRenderTargets([]);

  // ── Pass 2: bright-pass netTex -> bloomA (half res) ──
  setViewport(bloomW, bloomH);
  setRenderTargets([bloomA.rtv!]);
  psSet(psBright, { cb: [cb], srv: [netTex.srv!], samp: [linSampler] });
  drawFullscreenTriangle();
  vcall(gpu.context, 8, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 1, nullArr8.ptr!], FFIType.void);
  setRenderTargets([]);

  // ── Pass 3a: horizontal blur bloomA -> bloomB ──
  cbData.writeFloatLE(0, 104); // uBlurDir = horizontal
  updateConstantBuffer(cb, cbData);
  setRenderTargets([bloomB.rtv!]);
  psSet(psBlur, { cb: [cb], srv: [bloomA.srv!], samp: [linSampler] });
  drawFullscreenTriangle();
  vcall(gpu.context, 8, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 1, nullArr8.ptr!], FFIType.void);
  setRenderTargets([]);

  // ── Pass 3b: vertical blur bloomB -> bloomA ──
  cbData.writeFloatLE(1, 104); // uBlurDir = vertical
  updateConstantBuffer(cb, cbData);
  setRenderTargets([bloomA.rtv!]);
  psSet(psBlur, { cb: [cb], srv: [bloomB.srv!], samp: [linSampler] });
  drawFullscreenTriangle();
  vcall(gpu.context, 8, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 1, nullArr8.ptr!], FFIType.void);
  setRenderTargets([]);
  cbData.writeFloatLE(0, 104);
  updateConstantBuffer(cb, cbData);

  // ── Pass 4: composite to the back buffer ──
  setViewport(clientW, clientH);
  setRenderTargets([gpu.backBufferRTV]);
  clear(gpu.backBufferRTV, [0.01, 0.01, 0.03, 1]);
  psSet(psComp, { cb: [cb], srv: [netTex.srv!, bloomA.srv!, lossPlot.srv!], samp: [linSampler] });
  drawFullscreenTriangle();
  vcall(gpu.context, 8, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 3, nullArr8.ptr!], FFIType.void);
  setRenderTargets([]);

  const willBreak = durationMs > 0 && now - start >= durationMs;
  drawHud(totalSteps, curMse, psnr, fps);

  if (willBreak) {
    const outPath = selfshot && selfshotPath
      ? selfshotPath
      : resolve(import.meta.dir, '..', 'screenshots', 'neural-descent.png');
    mkdirSync(resolve(outPath, '..'), { recursive: true });
    const stats = captureBackBuffer(gpu, outPath, { gridW: 48, gridH: 22 });
    console.log(formatGrid(stats));
    console.log(`[shot] ok=${stats.ok} nonBlack=${stats.nonBlackFrac.toFixed(3)} meanLuma=${stats.meanLuma.toFixed(3)} -> ${stats.path}`);
    console.log(`[shot] step ${totalSteps} · MSE ${lastMse.toExponential(3)} · PSNR ${psnr.toFixed(2)} dB`);
  }

  gpu.present(false);

  frame += 1;
  fpsFrames += 1;
  if (now - fpsWindow >= 500) {
    fps = Math.round((fpsFrames * 1000) / (now - fpsWindow));
    fpsFrames = 0;
    fpsWindow = now;
  }

  if (willBreak) break;
}

const finalPsnr = lastMse > 0 ? -10 * Math.log10(lastMse) : 99;
console.log(`  ran ${frame} frames · ${totalSteps} training steps · final MSE ${lastMse.toExponential(3)} · PSNR ${finalPsnr.toFixed(2)} dB · ${fps} fps · ${gpu.gpuName}.`);
cleanup(0);
