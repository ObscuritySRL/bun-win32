/**
 * Neural Descent — a real neural network that TRAINS ITSELF LIVE on your GPU.
 *
 * A coordinate MLP  f(x, y) -> RGB  is overfit, in real time, to a procedurally
 * generated TARGET image (a smiling sun over a sunset sky and a green hill). Forward
 * propagation, the loss, full backpropagation, and the ADAM optimizer step are ALL
 * hand-written Direct3D 11 COMPUTE shaders run over structured buffers — there is no
 * DirectML, no library, no precomputed weights. The network is initialized from a
 * seeded Xavier distribution in pure TypeScript, uploaded once, and from then on
 * every parameter is updated entirely on the hardware ID3D11Device.
 *
 * The frame is split down the middle: the LEFT half is the analytic TARGET, the
 * RIGHT half is the network's PREDICTION of the identical world coordinate. The sun
 * straddles the seam, so as the mean-squared error plummets (~100×) the two halves
 * fuse into ONE continuous picture and the seam all but vanishes — you WATCH the net
 * reconstruct the image, frame by frame, until "TARGET" and "NEURAL NET" agree.
 *
 * The architecture is the one that actually works for this:
 *   input  : a 24-feature FOURIER positional encoding of (x, y)  — sin/cos at a
 *            geometric ladder of frequencies. This is the trick that lets a tiny
 *            MLP learn sharp edges and fine color fast (NeRF-style).
 *   hidden : 24 -> 80 -> 80, ReLU
 *   output : 80 -> 3, sigmoid  -> RGB in [0,1]
 *
 * Pipeline, per training STEP (many steps per displayed frame so learning is fast):
 *   1. ZERO-GRAD  CS  — clear the fixed-point gradient + loss accumulators.
 *   2. TRAIN      CS [numthreads(64,1,1)] over a batch of pixels: each thread picks
 *      a hashed pixel coord, builds its Fourier features, runs the FULL forward
 *      pass keeping activations in registers, reads the TARGET pixel, computes the
 *      output delta (sigmoid'·(out-target)·2/N), then BACK-PROPAGATES layer by
 *      layer — manual flat-index matmuls — accumulating dL/dW and dL/db into uint
 *      buffers with InterlockedAdd (fixed-point), and the MSE into a uint Loss cell.
 *   3. ADAM       CS  — one elementwise dispatch per parameter buffer maintains the
 *      first/second moments (m,s) and applies the bias-corrected adaptive step
 *      W -= lr·m̂/(√ŝ+ε). Adam (vs plain SGD) is what drives the loss two orders of
 *      magnitude down so the prediction becomes genuinely CRISP, not just blurred.
 * Rendering is two passes: a PIXEL shader evaluates the CURRENT weights per pixel
 * into an offscreen HDR texture; a COMPOSITE shader then paints TARGET | prediction
 * with a thin seam line, a tiny low-pass on the net side, a bitmap-font "TARGET" /
 * "NEURAL NET" label baked into the frame, and a vignette. A GDI HUD overlays the
 * live step count, GPU-read MSE, a falling-loss sparkline, and the fps.
 *
 * @bun-win32 APIs used (see ./_gpu.ts): createWindow / createDevice / recreateRTV /
 *   compile / makeComputeShader / makeVertexShader / makePixelShader /
 *   makeStructuredBuffer (weights + Adam moments + uint grads, UAV+SRV) /
 *   makeTexture (offscreen HDR prediction, RTV+SRV) / makeSampler / makeConstantBuffer /
 *   updateConstantBuffer / dispatch / vsSet / psSet / setRenderTargets /
 *   setViewport / clear / drawFullscreenTriangle / readbackBuffer / present /
 *   comRelease — plus GDI32 CreateFontW/TextOutW for the HUD and _snapshot for the
 *   gallery capture.
 *
 * Run: bun run packages/all/example/neural-descent.ts
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
  vcall,
  vsSet,
} from './_gpu';
import { captureBackBuffer, formatGrid } from './_snapshot';

const encodeWide = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');

// ── Resolution & network topology ─────────────────────────────────────────────
const WIDTH = 1280;
const HEIGHT = 720;

const NUM_FREQ = 6; // geometric frequency ladder; 6 bands fit this smooth scene +
                    // soft-edged disc cleanly while staying fast (more total steps).
const INPUT = NUM_FREQ * 4; // sin/cos × (x,y) = 24 features
const H1 = 80;
const H2 = 80;
const OUT = 3;

const W1_N = H1 * INPUT; // 2048
const W2_N = H2 * H1; // 4096
const W3_N = OUT * H2; // 192

// Fixed-point scale for InterlockedAdd gradient accumulation. Finer than 2^20: near
// convergence the gradients are tiny, and coarse quantization noise gets amplified
// by Adam's 1/sqrt(v) term — a higher scale keeps the late-training fit stable.
const GRAD_SCALE = 1 << 24; // 16,777,216

const BATCH = 8192; // pixel samples per training step (more coverage -> crisper)
const STEPS_PER_FRAME = 40; // training steps between displayed frames
const LR = 0.01; // Adam base learning rate
const ADAM_B1 = 0.9; // 1st-moment decay
const ADAM_B2 = 0.999; // 2nd-moment decay
const ADAM_EPS = 1e-8; // numerical floor
const DECAY_STEPS = 6000; // anneal LR to its floor by mid-run so the net SETTLES at
                          // its minimum and holds there through the capture frame

// ── Window + device ─────────────────────────────────────────────────────────────
const win = createWindow({ title: 'Neural Descent — a GPU neural net training itself live', width: WIDTH, height: HEIGHT, borderless: true });
const { w: clientW, h: clientH } = win.clientSize();
const gpu = createDevice(win.hwnd, { width: clientW, height: clientH });
gpu.recreateRTV();

// ── Seeded Xavier weight init (deterministic) ─────────────────────────────────
let seed = 0x9e3779b9 >>> 0;
function rand(): number {
  // xorshift32
  seed ^= seed << 13;
  seed >>>= 0;
  seed ^= seed >> 17;
  seed ^= seed << 5;
  seed >>>= 0;
  return seed / 0x1_0000_0000;
}
function randn(): number {
  // Box–Muller
  const u = Math.max(1e-7, rand());
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function xavier(count: number, fanIn: number, fanOut: number): Buffer {
  const std = Math.sqrt(2 / (fanIn + fanOut));
  const buf = Buffer.alloc(count * 4);
  for (let i = 0; i < count; i += 1) buf.writeFloatLE(randn() * std, i * 4);
  return buf;
}
const zeros = (count: number): Buffer => Buffer.alloc(count * 4);

// Weights (float, UAV for SGD writes + SRV for the render PS to read the live net).
const w1 = makeStructuredBuffer({ stride: 4, count: W1_N, uav: true, srv: true, initialData: xavier(W1_N, INPUT, H1) });
const b1 = makeStructuredBuffer({ stride: 4, count: H1, uav: true, srv: true, initialData: zeros(H1) });
const w2 = makeStructuredBuffer({ stride: 4, count: W2_N, uav: true, srv: true, initialData: xavier(W2_N, H1, H2) });
const b2 = makeStructuredBuffer({ stride: 4, count: H2, uav: true, srv: true, initialData: zeros(H2) });
const w3 = makeStructuredBuffer({ stride: 4, count: W3_N, uav: true, srv: true, initialData: xavier(W3_N, H2, OUT) });
const b3 = makeStructuredBuffer({ stride: 4, count: OUT, uav: true, srv: true, initialData: zeros(OUT) });

// Gradient accumulators (uint fixed-point). UAV = InterlockedAdd target in TRAIN;
// SRV = read by the SGD kernel to apply the step.
const gw1 = makeStructuredBuffer({ stride: 4, count: W1_N, uav: true, srv: true });
const gb1 = makeStructuredBuffer({ stride: 4, count: H1, uav: true, srv: true });
const gw2 = makeStructuredBuffer({ stride: 4, count: W2_N, uav: true, srv: true });
const gb2 = makeStructuredBuffer({ stride: 4, count: H2, uav: true, srv: true });
const gw3 = makeStructuredBuffer({ stride: 4, count: W3_N, uav: true, srv: true });
const gb3 = makeStructuredBuffer({ stride: 4, count: OUT, uav: true, srv: true });

// ADAM optimizer state: first moment m (mw*/mb*) and second moment s (sw*/sb*),
// one float per parameter, zero-initialized. Adam's per-parameter adaptive step is
// what drives the loss FAR below plain/momentum SGD's plateau, so the network's
// reconstruction becomes genuinely crisp (not just blurred) — both halves sharp.
const mw1 = makeStructuredBuffer({ stride: 4, count: W1_N, uav: true, srv: true, initialData: zeros(W1_N) });
const mb1 = makeStructuredBuffer({ stride: 4, count: H1, uav: true, srv: true, initialData: zeros(H1) });
const mw2 = makeStructuredBuffer({ stride: 4, count: W2_N, uav: true, srv: true, initialData: zeros(W2_N) });
const mb2 = makeStructuredBuffer({ stride: 4, count: H2, uav: true, srv: true, initialData: zeros(H2) });
const mw3 = makeStructuredBuffer({ stride: 4, count: W3_N, uav: true, srv: true, initialData: zeros(W3_N) });
const mb3 = makeStructuredBuffer({ stride: 4, count: OUT, uav: true, srv: true, initialData: zeros(OUT) });
const sw1 = makeStructuredBuffer({ stride: 4, count: W1_N, uav: true, srv: true, initialData: zeros(W1_N) });
const sb1 = makeStructuredBuffer({ stride: 4, count: H1, uav: true, srv: true, initialData: zeros(H1) });
const sw2 = makeStructuredBuffer({ stride: 4, count: W2_N, uav: true, srv: true, initialData: zeros(W2_N) });
const sb2 = makeStructuredBuffer({ stride: 4, count: H2, uav: true, srv: true, initialData: zeros(H2) });
const sw3 = makeStructuredBuffer({ stride: 4, count: W3_N, uav: true, srv: true, initialData: zeros(W3_N) });
const sb3 = makeStructuredBuffer({ stride: 4, count: OUT, uav: true, srv: true, initialData: zeros(OUT) });

// Loss accumulator (uint fixed-point), 1 element.
const loss = makeStructuredBuffer({ stride: 4, count: 1, uav: true });

// ── Constant buffer shared by every kernel + the render PS ────────────────────
// cbuffer Net (16-byte aligned):
//   uint  width, height, frame, batch;            (16)
//   uint  totalSteps, _p0, _p1, _p2;              (16)
//   float lr, gradScale, split, time;             (16)
const CB_SIZE = 64;
const cb = makeConstantBuffer(CB_SIZE);
const cbData = Buffer.alloc(CB_SIZE);

// ── Shared HLSL: constants, the network buffers, Fourier features, forward pass ─
const NET_DECLS = `
cbuffer Net : register(b0) {
  uint uWidth; uint uHeight; uint uFrame; uint uBatch;
  uint uTotalSteps; uint uCount; float uBc1; float uBc2;
  float uLr; float uGradScale; float uSplit; float uTime;
  float uB1; float uB2; float uEps; float uPad3;
};

#define NUM_FREQ ${NUM_FREQ}
#define INPUT ${INPUT}
#define H1 ${H1}
#define H2 ${H2}
#define OUTN ${OUT}
`;

// Fourier positional encoding of a normalized coord in [0,1]^2 -> INPUT features.
// Frequencies follow a geometric ladder (1,2,4,...) like NeRF; this is what lets a
// tiny MLP capture sharp edges and crisp color quickly.
const FOURIER = `
void fourier(float2 p, out float feat[INPUT]) {
  // center to [-1,1] for symmetric features
  float2 q = p * 2.0 - 1.0;
  [unroll]
  for (int k = 0; k < NUM_FREQ; k++) {
    float f = exp2(float(k)) * 3.14159265; // pi, 2pi, 4pi, ...
    feat[k * 4 + 0] = sin(q.x * f);
    feat[k * 4 + 1] = cos(q.x * f);
    feat[k * 4 + 2] = sin(q.y * f);
    feat[k * 4 + 3] = cos(q.y * f);
  }
}
`;

// The TARGET image, evaluated procedurally on the GPU. ONE bold, coherent, colorful
// scene that SPANS THE WHOLE FRAME and crosses the center line: a big smiling sun
// centered over a sunset sky and a rolling green hill. Because the main subject
// straddles the seam, when the net converges the left (target) and right (predicted)
// halves fuse into a single continuous picture — the seam should nearly vanish.
const TARGET_IMG = `
float3 target(float2 uv) {
  // uv in [0,1], y down (0 = top). 16:9 aspect — correct circles with this scale.
  float2 p = uv;
  float aspect = float(uWidth) / float(uHeight);

  // ── Sky: deep indigo up top fading to warm orange at the horizon ──
  float horizon = 0.70;
  float3 skyTop = float3(0.16, 0.09, 0.40);
  float3 skyMid = float3(0.92, 0.42, 0.32);
  float3 skyLow = float3(1.00, 0.80, 0.40);
  // smooth two-segment sky gradient (no hard branch -> no slope discontinuity)
  float ty = saturate(p.y / horizon);
  float3 sky = lerp(skyTop, skyMid, smoothstep(0.0, 0.62, ty));
  sky = lerp(sky, skyLow, smoothstep(0.62, 1.0, ty));
  // ── Ground: rolling green hill with a gentle sine ridge ──
  float g = saturate((p.y - horizon) / (1.0 - horizon));
  float3 hill = lerp(float3(0.30, 0.56, 0.24), float3(0.05, 0.20, 0.09), saturate(g + 0.04 * sin(p.x * 9.0)));
  // soft horizon blend so the sky->ground edge is band-limited (avoids ringing)
  float3 col = lerp(sky, hill, smoothstep(horizon - 0.03, horizon + 0.03, p.y));

  // The big sun-face is CENTERED so it crosses the screen seam at x=0.5.
  float2 face = float2(0.5, 0.40);
  // aspect-correct distance so the sun is a true circle, not an oval
  float2 d2 = (p - face) * float2(aspect, 1.0);
  float fd = length(d2);

  // ── Sun glow halo (soft, large) ──
  float halo = exp(-fd * 4.5);
  col = lerp(col, float3(1.0, 0.92, 0.55), saturate(halo * 0.85));

  // ── Sun disc ── (edges deliberately soft so the band-limited net fits them
  // without Gibbs ringing — a soft-edged sun still reads as crisp at viewing scale)
  float R = 0.235;
  float disc = smoothstep(R + 0.022, R - 0.022, fd);
  float3 sunCol = lerp(float3(1.0, 0.86, 0.20), float3(1.0, 0.62, 0.10), saturate(fd / R));
  col = lerp(col, sunCol, disc);

  // ── Face features (only inside the disc) ──
  // eyes
  float2 eL = face + float2(-0.075 / aspect, -0.055), eR = face + float2(0.075 / aspect, -0.055);
  float eye = smoothstep(0.044, 0.022, length((p - eL) * float2(aspect, 1.0)))
            + smoothstep(0.044, 0.022, length((p - eR) * float2(aspect, 1.0)));
  // rosy cheeks
  float2 cL = face + float2(-0.13 / aspect, 0.045), cR = face + float2(0.13 / aspect, 0.045);
  float cheek = smoothstep(0.05, 0.0, length((p - cL) * float2(aspect, 1.0)))
              + smoothstep(0.05, 0.0, length((p - cR) * float2(aspect, 1.0)));
  // big smile: lower arc of a ring
  float2 rel = (p - (face + float2(0.0, 0.01))) * float2(aspect, 1.0);
  float ringD = abs(length(rel) - 0.125);
  float mouth = smoothstep(0.034, 0.012, ringD) * smoothstep(0.01, 0.05, rel.y);

  float3 feat = float3(0.30, 0.10, 0.02);                 // dark brown features
  float3 faceShade = lerp(sunCol, float3(1.0, 0.55, 0.45), saturate(cheek * 0.5)); // cheeks
  faceShade = lerp(faceShade, feat, saturate(eye + mouth));
  col = lerp(col, faceShade, disc);

  return saturate(col);
}
`;

// Forward pass over the LIVE weights (StructuredBuffer SRVs). Returns RGB in [0,1].
// Activations are kept in registers; ReLU on hidden, sigmoid on output.
const FORWARD_SRV = `
StructuredBuffer<float> W1 : register(t0);
StructuredBuffer<float> B1 : register(t1);
StructuredBuffer<float> W2 : register(t2);
StructuredBuffer<float> B2 : register(t3);
StructuredBuffer<float> W3 : register(t4);
StructuredBuffer<float> B3 : register(t5);

float3 netForward(float2 uv) {
  float feat[INPUT];
  fourier(uv, feat);

  float h1[H1];
  [loop]
  for (int j1 = 0; j1 < H1; j1++) {
    float s = B1[j1];
    [loop]
    for (int i1 = 0; i1 < INPUT; i1++) s += W1[j1 * INPUT + i1] * feat[i1];
    h1[j1] = max(s, 0.0); // ReLU
  }
  float h2[H2];
  [loop]
  for (int j2 = 0; j2 < H2; j2++) {
    float s = B2[j2];
    [loop]
    for (int i2 = 0; i2 < H1; i2++) s += W2[j2 * H1 + i2] * h1[i2];
    h2[j2] = max(s, 0.0);
  }
  float3 o;
  [unroll]
  for (int k = 0; k < OUTN; k++) {
    float s = B3[k];
    [loop]
    for (int i3 = 0; i3 < H2; i3++) s += W3[k * H2 + i3] * h2[i3];
    o[k] = 1.0 / (1.0 + exp(-s)); // sigmoid
  }
  return o;
}
`;

// ── ZERO-GRAD kernel: clear gradient + loss accumulators ───────────────────────
const ZERO_CS = `
${NET_DECLS}
RWStructuredBuffer<uint> GW1 : register(u0);
RWStructuredBuffer<uint> GB1 : register(u1);
RWStructuredBuffer<uint> GW2 : register(u2);
RWStructuredBuffer<uint> GB2 : register(u3);
RWStructuredBuffer<uint> GW3 : register(u4);
RWStructuredBuffer<uint> GB3 : register(u5);
RWStructuredBuffer<uint> Loss : register(u6);

[numthreads(256,1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint i = id.x;
  if (i < ${W1_N}u) GW1[i] = 0u;
  if (i < ${W2_N}u) GW2[i] = 0u;
  if (i < ${W3_N}u) GW3[i] = 0u;
  if (i < ${H1}u)   GB1[i] = 0u;
  if (i < ${H2}u)   GB2[i] = 0u;
  if (i < ${OUT}u)  GB3[i] = 0u;
  if (i == 0u)      Loss[0] = 0u;
}
`;

// ── TRAIN kernel: forward + backprop + grad accumulate for a batch of pixels ───
// Weights are read through SRVs (t0..t5); gradients accumulated into UAVs (u0..u6)
// with fixed-point InterlockedAdd. Each thread = one sample in the batch.
const TRAIN_CS = `
${NET_DECLS}
${FOURIER}
${TARGET_IMG}

StructuredBuffer<float> W1 : register(t0);
StructuredBuffer<float> B1 : register(t1);
StructuredBuffer<float> W2 : register(t2);
StructuredBuffer<float> B2 : register(t3);
StructuredBuffer<float> W3 : register(t4);
StructuredBuffer<float> B3 : register(t5);

RWStructuredBuffer<uint> GW1 : register(u0);
RWStructuredBuffer<uint> GB1 : register(u1);
RWStructuredBuffer<uint> GW2 : register(u2);
RWStructuredBuffer<uint> GB2 : register(u3);
RWStructuredBuffer<uint> GW3 : register(u4);
RWStructuredBuffer<uint> GB3 : register(u5);
RWStructuredBuffer<uint> Loss : register(u6);

uint hash(uint s) {
  s ^= 2747636419u; s *= 2654435769u;
  s ^= s >> 16; s *= 2654435769u;
  s ^= s >> 16; s *= 2654435769u;
  return s;
}

// signed fixed-point InterlockedAdd: add float g (scaled) to a uint cell using
// two's-complement wrap (uint add == int add mod 2^32).
void atomicAddF(RWStructuredBuffer<uint> buf, uint idx, float g) {
  int q = (int)round(g * uGradScale);
  uint prev;
  InterlockedAdd(buf[idx], (uint)q, prev);
}

[numthreads(64,1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint s = id.x;
  if (s >= uBatch) return;

  // Pick a pseudo-random pixel for this sample (decorrelated per step via frame).
  uint h = hash(s * 2654435761u + uFrame * 40503u + 0x9e3779b9u);
  uint px = h % uWidth;
  uint py = (h / uWidth) % uHeight;
  float2 uv = float2((float(px) + 0.5) / float(uWidth), (float(py) + 0.5) / float(uHeight));

  // ---- FORWARD (keep activations) ----
  float feat[INPUT];
  fourier(uv, feat);

  float z1[H1]; float a1[H1];
  [loop]
  for (int fj = 0; fj < H1; fj++) {
    float acc = B1[fj];
    [loop]
    for (int fi = 0; fi < INPUT; fi++) acc += W1[fj * INPUT + fi] * feat[fi];
    z1[fj] = acc; a1[fj] = max(acc, 0.0);
  }
  float z2[H2]; float a2[H2];
  [loop]
  for (int gj = 0; gj < H2; gj++) {
    float acc = B2[gj];
    [loop]
    for (int gi = 0; gi < H1; gi++) acc += W2[gj * H1 + gi] * a1[gi];
    z2[gj] = acc; a2[gj] = max(acc, 0.0);
  }
  float3 outv;
  [unroll]
  for (int ok = 0; ok < OUTN; ok++) {
    float acc = B3[ok];
    [loop]
    for (int hi = 0; hi < H2; hi++) acc += W3[ok * H2 + hi] * a2[hi];
    outv[ok] = 1.0 / (1.0 + exp(-acc));
  }

  // ---- LOSS + OUTPUT DELTA ----
  float3 tgt = target(uv);
  float3 diff = outv - tgt;
  float mse = (diff.x * diff.x + diff.y * diff.y + diff.z * diff.z) / 3.0;
  // accumulate the SUM of per-sample MSE (fixed-point 1e6); CPU divides by batch.
  uint lq; InterlockedAdd(Loss[0], (uint)(mse * 1000000.0), lq);

  // dL/dout averaged over the 3 channels and the batch; sigmoid'(z)=out*(1-out).
  float invN = 1.0 / float(uBatch);
  float3 dOut;
  [unroll]
  for (int dk = 0; dk < OUTN; dk++) {
    float dl = (2.0 / 3.0) * diff[dk] * invN;        // d(mse)/d(out_k)
    dOut[dk] = dl * outv[dk] * (1.0 - outv[dk]);      // * sigmoid'
  }

  // ---- BACKPROP layer 3 (output): dW3, dB3 ; delta2 = W3^T dOut ⊙ relu'(z2) ----
  float delta2[H2];
  [loop]
  for (int c2 = 0; c2 < H2; c2++) delta2[c2] = 0.0;
  [unroll]
  for (int bk = 0; bk < OUTN; bk++) {
    atomicAddF(GB3, (uint)bk, dOut[bk]);
    [loop]
    for (int b3i = 0; b3i < H2; b3i++) {
      atomicAddF(GW3, (uint)(bk * H2 + b3i), dOut[bk] * a2[b3i]);
      delta2[b3i] += dOut[bk] * W3[bk * H2 + b3i];
    }
  }
  [loop]
  for (int r2 = 0; r2 < H2; r2++) delta2[r2] *= (z2[r2] > 0.0) ? 1.0 : 0.0; // relu'

  // ---- BACKPROP layer 2: dW2, dB2 ; delta1 = W2^T delta2 ⊙ relu'(z1) ----
  float delta1[H1];
  [loop]
  for (int c1 = 0; c1 < H1; c1++) delta1[c1] = 0.0;
  [loop]
  for (int b2j = 0; b2j < H2; b2j++) {
    float d = delta2[b2j];
    atomicAddF(GB2, (uint)b2j, d);
    [loop]
    for (int b2i = 0; b2i < H1; b2i++) {
      atomicAddF(GW2, (uint)(b2j * H1 + b2i), d * a1[b2i]);
      delta1[b2i] += d * W2[b2j * H1 + b2i];
    }
  }
  [loop]
  for (int r1 = 0; r1 < H1; r1++) delta1[r1] *= (z1[r1] > 0.0) ? 1.0 : 0.0;

  // ---- BACKPROP layer 1: dW1, dB1 ----
  [loop]
  for (int b1j = 0; b1j < H1; b1j++) {
    float d = delta1[b1j];
    atomicAddF(GB1, (uint)b1j, d);
    [loop]
    for (int b1i = 0; b1i < INPUT; b1i++) {
      atomicAddF(GW1, (uint)(b1j * INPUT + b1i), d * feat[b1i]);
    }
  }
}
`;

// ── ADAM kernel (generic, one parameter buffer per dispatch) ────────────────────
// Gradients were mean-normalized by the batch inside TRAIN (invN). For each
// parameter:  m = b1·m + (1-b1)·g ;  s = b2·s + (1-b2)·g² ;
//             W -= lr · (m/uBc1) / (sqrt(s/uBc2) + eps).
// uBc1 = 1-b1^t and uBc2 = 1-b2^t are the bias-correction terms (CPU-computed).
// Adam's per-parameter adaptive step blows past the momentum-SGD plateau, so the
// reconstruction becomes genuinely sharp. Reads grads as uint (two's-complement).
const ADAM_CS = `
${NET_DECLS}
RWStructuredBuffer<float> P : register(u0);   // parameter (weight or bias)
RWStructuredBuffer<float> M : register(u1);   // 1st moment
RWStructuredBuffer<float> S : register(u2);   // 2nd moment
StructuredBuffer<uint> G : register(t0);      // fixed-point gradient accumulator
[numthreads(256,1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint i = id.x;
  if (i >= uCount) return;
  float g = float((int)G[i]) / uGradScale;
  float m = uB1 * M[i] + (1.0 - uB1) * g;
  float s = uB2 * S[i] + (1.0 - uB2) * g * g;
  M[i] = m; S[i] = s;
  float mh = m / uBc1;
  float sh = s / uBc2;
  P[i] -= uLr * mh / (sqrt(sh) + uEps);
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

const GRADE = `
float3 grade(float3 c) {
  c = saturate(c);
  c = pow(c, 1.0 / 1.05); // gentle lift
  return c;
}
`;

// ── PASS 1 PS: evaluate the LIVE net per-pixel into an offscreen HDR texture ────
// Full-resolution per-pixel forward pass over the current weights (no upsampling).
const PS_NET = `
${NET_DECLS}
${FOURIER}
${FORWARD_SRV}
${GRADE}
float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  return float4(grade(netForward(uv)), 1.0);
}
`;

// ── PASS 2 PS: composite TARGET (left) | net prediction (right) to the screen ──
// The right half samples the net texture through a tiny separable low-pass (a 3×3
// tent in UV) so the residual per-pixel net noise is smoothed into a CRISP image —
// the smooth scene and the soft-edged sun disc are far below this cutoff and stay
// sharp. The left half is the analytic target. Same world UV on both sides, so at
// convergence the seam nearly vanishes and the frame reads as one continuous image.
const PS_COMPOSITE = `
${NET_DECLS}
${FOURIER}
${TARGET_IMG}
${GRADE}
Texture2D NetTex : register(t0);
SamplerState Samp : register(s0);

float3 sampleNet(float2 uv) {
  float2 px = float2(1.0 / float(uWidth), 1.0 / float(uHeight));
  // Light 5×5 Gaussian (~2px) — Adam already fits the net tightly, so only a gentle
  // low-pass is needed to clean the last bit of per-pixel fit noise. The disc edge
  // and gradients stay crisp, keeping the predicted half visibly sharp.
  float3 sum = 0.0.xxx;
  float wsum = 0.0;
  [unroll] for (int j = -2; j <= 2; j++) {
    [unroll] for (int i = -2; i <= 2; i++) {
      float2 off = float2(float(i), float(j)) * px;
      float w = exp(-(float(i * i + j * j)) / 3.0);
      sum += NetTex.Sample(Samp, uv + off).rgb * w;
      wsum += w;
    }
  }
  return sum / wsum;
}

// ── Tiny 5×7 bitmap font (only the glyphs the two labels need) ──────────────────
// Each row is a 5-bit mask, MSB = leftmost column. code: 0=T 1=A 2=R 3=G 4=E 5=N
// 6=U 7=L 8=space. Returns 1.0 if pixel (cx,cy) in [0..4]×[0..6] is lit.
float glyphRow(int code, int row) {
  if (code == 0) { int r[7]={31,4,4,4,4,4,4}; return r[row]; }            // T
  if (code == 1) { int r[7]={14,17,17,31,17,17,17}; return r[row]; }      // A
  if (code == 2) { int r[7]={30,17,17,30,20,18,17}; return r[row]; }      // R
  if (code == 3) { int r[7]={14,17,16,23,17,17,14}; return r[row]; }      // G
  if (code == 4) { int r[7]={31,16,16,30,16,16,31}; return r[row]; }      // E
  if (code == 5) { int r[7]={17,25,21,19,17,17,17}; return r[row]; }      // N
  if (code == 6) { int r[7]={17,17,17,17,17,17,14}; return r[row]; }      // U
  if (code == 7) { int r[7]={16,16,16,16,16,16,31}; return r[row]; }      // L
  return 0;                                                              // space
}
float glyphPix(int code, int cx, int cy) {
  if (cx < 0 || cx > 4 || cy < 0 || cy > 6) return 0.0;
  int rowBits = (int)glyphRow(code, cy);
  return ((rowBits >> (4 - cx)) & 1) ? 1.0 : 0.0;
}
// Draw a string (codes[] up to len) starting at pixel origin org, glyph scale s.
float drawText(float2 frag, float2 org, float s, int codes[10], int len) {
  float2 local = (frag - org) / s;
  int gi = (int)floor(local.x / 6.0);        // 5px glyph + 1px gap
  if (gi < 0 || gi >= len) return 0.0;
  int cx = (int)floor(local.x - float(gi) * 6.0);
  int cy = (int)floor(local.y);
  return glyphPix(codes[gi], cx, cy);
}

float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float sx = uv.x;
  float split = uSplit;
  float3 tgt = grade(target(uv));   // analytic ground truth (left)
  float3 net = sampleNet(uv);       // smoothed network prediction (right)
  float3 col = (sx < split) ? tgt : net;

  // Thin bright seam line — crisp, ~1.5px, with a faint halo. NO grid/scanlines.
  float px = 1.0 / float(uWidth);
  float dl = abs(sx - split);
  float seam = smoothstep(2.0 * px, 0.0, dl);
  float glow = smoothstep(14.0 * px, 0.0, dl) * 0.18;
  col = lerp(col, float3(0.85, 0.97, 1.0), seam);
  col += float3(0.20, 0.45, 0.70) * glow;

  // gentle vignette to frame the picture
  float2 q = uv;
  float vig = pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.10);
  col *= lerp(0.88, 1.03, vig);

  // ── In-frame labels rendered straight into the picture so they survive capture:
  // "TARGET" under the left half, "NEURAL NET" under the right half, each on a
  // translucent pill. (The live window also gets a richer GDI HUD on top.)
  float2 frag = uv * float2(float(uWidth), float(uHeight));
  float sc = max(2.0, floor(float(uHeight) / 150.0)); // glyph pixel scale
  float by = float(uHeight) - 16.0 - 7.0 * sc;        // baseline y

  int L_TARGET[10]   = {0,1,2,3,4,0, 8,8,8,8};        // TARGET
  int L_NEURAL[10]   = {5,4,6,2,1,7, 8,5,4,0};        // NEURAL NET (NEURAL + NET)
  float lw = 6.0 * sc;                                // per-glyph advance in px

  // left label, centered in the left half
  float2 oL = float2(float(uWidth) * 0.25 - 3.0 * lw, by);
  float tL = drawText(frag, oL, sc, L_TARGET, 6);
  // right label, centered in the right half
  float2 oR = float2(float(uWidth) * 0.75 - 5.0 * lw, by);
  float tR = drawText(frag, oR, sc, L_NEURAL, 10);

  // translucent pills behind each label for legibility on any background
  float padX = 1.5 * lw, padY = 1.2 * sc;
  float pillL = (frag.x > oL.x - padX && frag.x < oL.x + 6.0 * lw + padX &&
                 frag.y > oL.y - padY && frag.y < oL.y + 7.0 * sc + padY) ? 1.0 : 0.0;
  float pillR = (frag.x > oR.x - padX && frag.x < oR.x + 10.0 * lw + padX &&
                 frag.y > oR.y - padY && frag.y < oR.y + 7.0 * sc + padY) ? 1.0 : 0.0;
  col = lerp(col, float3(0.02, 0.03, 0.06), (pillL + pillR) * 0.55);
  float txt = saturate(tL + tR);
  col = lerp(col, float3(0.97, 0.99, 1.0), txt);

  return float4(saturate(col), 1.0);
}
`;

// ── Compile + create shaders ────────────────────────────────────────────────────
const zeroCode = compile(ZERO_CS, 'main', 'cs_5_0');
const trainCode = compile(TRAIN_CS, 'main', 'cs_5_0');
const adamCode = compile(ADAM_CS, 'main', 'cs_5_0');
const vsCode = compile(VS, 'main', 'vs_5_0');
const psNetCode = compile(PS_NET, 'main', 'ps_5_0');
const psCompCode = compile(PS_COMPOSITE, 'main', 'ps_5_0');

const zeroCs = makeComputeShader(zeroCode);
const trainCs = makeComputeShader(trainCode);
const adamCs = makeComputeShader(adamCode);
const vs = makeVertexShader(vsCode);
const psNet = makePixelShader(psNetCode);
const psComp = makePixelShader(psCompCode);

// Offscreen HDR texture the live net is rendered into each frame, plus a linear
// clamp sampler for the composite's low-pass. Full client resolution — the net is
// evaluated per pixel, then the composite smooths only the high-frequency residual.
const netTex = makeTexture({ w: clientW, h: clientH, format: DXGI_FORMAT_R16G16B16A16_FLOAT, rtv: true, srv: true });
const linSampler = makeSampler({ filter: D3D11_FILTER_MIN_MAG_MIP_LINEAR, address: D3D11_TEXTURE_ADDRESS_CLAMP });

// ── Per-parameter Adam dispatch descriptors (one per weight/bias buffer) ────────
// Each entry binds P/M/S as UAVs u0..u2 and the grad accumulator as SRV t0, with
// the buffer's element count written into uCount before the dispatch.
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
  adamGroup(b1, mb1, sb1, gb1, H1),
  adamGroup(b2, mb2, sb2, gb2, H2),
  adamGroup(b3, mb3, sb3, gb3, OUT),
];

// ── Helpers to unbind compute resources between passes (avoid hazards) ─────────
const nullArr8 = Buffer.alloc(8 * 8); // up to 8 null slots
function clearCsUavs(count: number): void {
  vcall(gpu.context, CTX_CS_SET_UNORDERED_ACCESS_VIEWS, [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], [0, count, nullArr8.ptr!, null], FFIType.void);
}
function clearCsSrvs(count: number): void {
  vcall(gpu.context, CTX_CS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, count, nullArr8.ptr!], FFIType.void);
}

// ── GDI HUD fonts ─────────────────────────────────────────────────────────────
const hudFont = GDI32.CreateFontW(-19, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4 /* ANTIALIASED_QUALITY */, 0, encodeWide('Consolas').ptr!);
const TRANSPARENT_BK = 1;

// A rolling history of the MSE loss for the sparkline (newest last).
const lossHist: number[] = [];
const SPARK = ' .:-=+*#%@'; // low→high glyph ramp (drawn inverted: low loss = short bar)

/** Draw a string twice (dark shadow + bright fill) for legibility over any background. */
function drawShadowed(dc: bigint, x: number, y: number, str: string, fill: number, shadow = 0x00100800): void {
  const t = encodeWide(str);
  GDI32.SetTextColor(dc, shadow);
  GDI32.TextOutW(dc, x + 1, y + 1, t.ptr!, str.length);
  GDI32.SetTextColor(dc, fill);
  GDI32.TextOutW(dc, x, y, t.ptr!, str.length);
}

function drawHud(stepCount: number, lossVal: number, fps: number): void {
  const dc = User32.GetDC(win.hwnd);
  if (!dc) return;
  GDI32.SetBkMode(dc, TRANSPARENT_BK);

  // ── top-left: title + live metrics ──
  const prevFont = GDI32.SelectObject(dc, hudFont);
  drawShadowed(dc, 18, 16, `Neural Descent  ·  MLP ${INPUT}-${H1}-${H2}-3  ·  Fourier+Adam on GPU  ·  ${fps} fps  ·  ESC`, 0x00f5e8c8);
  drawShadowed(dc, 18, 42, `step ${stepCount}    MSE ${lossVal.toExponential(3)}`, 0x00b9f5c8);

  // ── falling-loss sparkline (newest at the right) ──
  if (lossHist.length > 0) {
    const lo = Math.min(...lossHist);
    const hi = Math.max(...lossHist);
    const span = Math.max(1e-6, hi - lo);
    let spark = '';
    for (const v of lossHist) {
      const n = (v - lo) / span; // 0 (best) .. 1 (worst)
      spark += SPARK[Math.min(SPARK.length - 1, Math.floor(n * SPARK.length))];
    }
    drawShadowed(dc, 18, 68, `loss |${spark}|  ${hi.toExponential(1)} -> ${lo.toExponential(1)}`, 0x0080e0ff);
  }

  // (TARGET / NEURAL NET half-labels are rendered into the frame itself by the
  // composite shader so they survive the back-buffer capture; no GDI duplicate.)
  GDI32.SelectObject(dc, prevFont);
  User32.ReleaseDC(win.hwnd, dc);
}

// ── Teardown ──────────────────────────────────────────────────────────────────
let cleaned = false;
function cleanup(code: number): never {
  if (!cleaned) {
    cleaned = true;
    GDI32.DeleteObject(hudFont);
    for (const sb of [
      w1, b1, w2, b2, w3, b3, gw1, gb1, gw2, gb2, gw3, gb3,
      mw1, mb1, mw2, mb2, mw3, mb3, sw1, sb1, sw2, sb2, sw3, sb3, loss,
    ]) {
      comRelease(sb.srv ?? 0n);
      comRelease(sb.uav ?? 0n);
      comRelease(sb.buffer);
    }
    comRelease(cb);
    comRelease(linSampler);
    comRelease(netTex.srv ?? 0n);
    comRelease(netTex.rtv ?? 0n);
    comRelease(netTex.tex);
    comRelease(psComp);
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

console.log('Neural Descent — a GPU neural network training itself live in pure TypeScript.');
console.log(`  ${clientW}x${clientH} · ${gpu.driver} · ${gpu.gpuName}`);
console.log(`  MLP ${INPUT}→${H1}→${H2}→3 · Fourier features · Adam · batch ${BATCH} · ${STEPS_PER_FRAME} steps/frame · lr ${LR}`);

// ── Training/render loop ──────────────────────────────────────────────────────
const start = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
let frame = 0;
let totalSteps = 0;
let fps = 0;
let fpsFrames = 0;
let fpsWindow = start;
let lastLoss = 1;
let nextCheckpoint = 0;

const zeroGroups = Math.ceil(Math.max(W1_N, W2_N) / 256);
const trainGroups = Math.ceil(BATCH / 64);

// Bind arrays for the TRAIN pass (built once; UAVs/SRVs are stable handles).
const trainSrvArr = Buffer.alloc(8 * 6);
[w1.srv!, b1.srv!, w2.srv!, b2.srv!, w3.srv!, b3.srv!].forEach((s, i) => trainSrvArr.writeBigUInt64LE(s, i * 8));
const trainUavArr = Buffer.alloc(8 * 7);
[gw1.uav!, gb1.uav!, gw2.uav!, gb2.uav!, gw3.uav!, gb3.uav!, loss.uav!].forEach((u, i) => trainUavArr.writeBigUInt64LE(u, i * 8));
const zeroUavArr = Buffer.alloc(8 * 7);
[gw1.uav!, gb1.uav!, gw2.uav!, gb2.uav!, gw3.uav!, gb3.uav!, loss.uav!].forEach((u, i) => zeroUavArr.writeBigUInt64LE(u, i * 8));

function bindCb(): void {
  const arr = Buffer.alloc(8);
  arr.writeBigUInt64LE(cb, 0);
  vcall(gpu.context, 71 /* CSSetConstantBuffers */, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 1, arr.ptr!], FFIType.void);
}

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;

  const now = performance.now();
  const time = (now - start) / 1000;

  // Run several training steps before painting (makes convergence visibly fast).
  for (let s = 0; s < STEPS_PER_FRAME; s += 1) {
    // Learning-rate schedule: hold high early for a fast plunge, then cosine-decay
    // toward a small floor so the late iterations stop jittering and the predicted
    // half settles into a SMOOTH, crisp reconstruction (kills residual speckle).
    // Cosine LR decay to a small floor — Adam + decay lands at a tight final fit.
    const decayT = Math.min(1, totalSteps / DECAY_STEPS);
    const lrNow = LR * (0.02 + 0.98 * 0.5 * (1 + Math.cos(Math.PI * decayT)));
    // Adam bias-correction terms for this step (t = totalSteps + 1).
    const t = totalSteps + 1;
    const bc1 = 1 - Math.pow(ADAM_B1, t);
    const bc2 = 1 - Math.pow(ADAM_B2, t);
    // Constant buffer (rebuilt right before the passes that consume it).
    cbData.writeUInt32LE(clientW, 0);
    cbData.writeUInt32LE(clientH, 4);
    cbData.writeUInt32LE((frame * STEPS_PER_FRAME + s) >>> 0, 8); // frame/step seed
    cbData.writeUInt32LE(BATCH, 12);
    cbData.writeUInt32LE(totalSteps >>> 0, 16);
    cbData.writeUInt32LE(0, 20); // uCount — set per Adam dispatch below
    cbData.writeFloatLE(bc1, 24); // uBc1
    cbData.writeFloatLE(bc2, 28); // uBc2
    cbData.writeFloatLE(lrNow, 32);
    cbData.writeFloatLE(GRAD_SCALE, 36);
    cbData.writeFloatLE(0.5, 40); // split (unused by compute)
    cbData.writeFloatLE(time, 44);
    cbData.writeFloatLE(ADAM_B1, 48);
    cbData.writeFloatLE(ADAM_B2, 52);
    cbData.writeFloatLE(ADAM_EPS, 56);
    cbData.writeFloatLE(0, 60);
    updateConstantBuffer(cb, cbData);

    // Pass A: zero gradients + loss.
    vcall(gpu.context, 69 /* CSSetShader */, [FFIType.u64, FFIType.ptr, FFIType.u32], [zeroCs, null, 0], FFIType.void);
    bindCb();
    vcall(gpu.context, CTX_CS_SET_UNORDERED_ACCESS_VIEWS, [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], [0, 7, zeroUavArr.ptr!, null], FFIType.void);
    dispatch(zeroGroups, 1, 1);
    clearCsUavs(7);

    // Pass B: forward + backprop, accumulate gradients (SRV weights -> UAV grads).
    vcall(gpu.context, 69, [FFIType.u64, FFIType.ptr, FFIType.u32], [trainCs, null, 0], FFIType.void);
    bindCb();
    vcall(gpu.context, CTX_CS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 6, trainSrvArr.ptr!], FFIType.void);
    vcall(gpu.context, CTX_CS_SET_UNORDERED_ACCESS_VIEWS, [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], [0, 7, trainUavArr.ptr!, null], FFIType.void);
    dispatch(trainGroups, 1, 1);
    clearCsUavs(7);
    clearCsSrvs(6);

    // Pass C: ADAM update — one elementwise dispatch per parameter buffer (P/M/S
    // UAVs + grad SRV). uCount selects how many elements this buffer has.
    vcall(gpu.context, 69, [FFIType.u64, FFIType.ptr, FFIType.u32], [adamCs, null, 0], FFIType.void);
    for (const ag of adamGroups) {
      cbData.writeUInt32LE(ag.count, 20); // uCount
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

  // Read back the loss from the LAST step (cheap: 4 bytes).
  if (frame % 2 === 0) {
    const lb = readbackBuffer(loss.buffer, 4);
    const lq = new Uint32Array(lb)[0]!;
    lastLoss = lq / 1000000 / BATCH; // sum of (mse*1e6) over batch -> mean mse
    lossHist.push(lastLoss);
    if (lossHist.length > 56) lossHist.shift();
  }
  // Convergence checkpoints printed to the console (proves the loss falls).
  if (totalSteps >= nextCheckpoint) {
    console.log(`  [train] step ${totalSteps} · MSE ${lastLoss.toExponential(3)} · ${((now - start) / 1000).toFixed(2)}s`);
    nextCheckpoint += 1500;
  }

  // ── Render: TARGET (left) | NEURAL NET prediction (right) ─────────────────────
  // The seam holds at the exact center 0.5 so the two halves form one continuous
  // picture as the net converges. A brief 0.6s reveal slides the seam in from the
  // right at the very start (pure showmanship); it locks to 0.5 well before capture.
  const reveal = Math.min(1, time / 0.6); // 0→1 over the first 0.6s
  const sweep = 1.0 * (1 - reveal) + 0.5 * reveal; // 1.0 (all target) -> 0.5 (split)
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
  cbData.writeFloatLE(sweep, 40);
  cbData.writeFloatLE(time, 44);
  updateConstantBuffer(cb, cbData);

  setViewport(clientW, clientH);
  vsSet(vs);

  // ── Pass 1: render the LIVE net per-pixel into the offscreen HDR texture ──
  setRenderTargets([netTex.rtv!]);
  psSet(psNet, { cb: [cb], srv: [w1.srv!, b1.srv!, w2.srv!, b2.srv!, w3.srv!, b3.srv!] });
  drawFullscreenTriangle();
  // Unbind PS SRVs so the weight buffers can be UAVs next frame, and drop the RTV
  // so the texture can be read as an SRV in pass 2.
  vcall(gpu.context, 8 /* PSSetShaderResources */, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 6, nullArr8.ptr!], FFIType.void);
  setRenderTargets([]);

  // ── Pass 2: composite TARGET (left) | smoothed net texture (right) to screen ──
  setRenderTargets([gpu.backBufferRTV]);
  clear(gpu.backBufferRTV, [0.02, 0.02, 0.05, 1]);
  psSet(psComp, { cb: [cb], srv: [netTex.srv!], samp: [linSampler] });
  drawFullscreenTriangle();
  // Unbind the net texture SRV so it can be an RTV again next frame.
  vcall(gpu.context, 8 /* PSSetShaderResources */, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 1, nullArr8.ptr!], FFIType.void);
  setRenderTargets([]);

  // Gallery capture on the final frame (capture mode only).
  const willBreak = durationMs > 0 && now - start >= durationMs;
  if (willBreak) {
    const shotDir = resolve(import.meta.dir, '..', 'screenshots');
    mkdirSync(shotDir, { recursive: true });
    const stats = captureBackBuffer(gpu, resolve(shotDir, 'neural-descent.png'), { gridW: 48, gridH: 22 });
    console.log(formatGrid(stats));
    console.log(`[shot] ok=${stats.ok} nonBlack=${stats.nonBlackFrac.toFixed(3)} meanLuma=${stats.meanLuma.toFixed(3)} -> ${stats.path}`);
    console.log(`[shot] step ${totalSteps} · MSE ${lastLoss.toExponential(3)}`);
  }

  gpu.present(false);
  drawHud(totalSteps, lastLoss, fps);

  frame += 1;
  fpsFrames += 1;
  if (now - fpsWindow >= 500) {
    fps = Math.round((fpsFrames * 1000) / (now - fpsWindow));
    fpsFrames = 0;
    fpsWindow = now;
  }

  if (willBreak) break;
}

console.log(`  ran ${frame} frames · ${totalSteps} training steps · final MSE ${lastLoss.toExponential(3)} · ${fps} fps · ${gpu.gpuName}.`);
cleanup(0);
