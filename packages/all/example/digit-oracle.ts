/**
 * Digit Oracle — a convolutional neural network recognizing your handwriting on the
 * GPU, live, in pure TypeScript. No Python, no ONNX, no native shim: a hand-written
 * Direct3D 11 engine over Bun FFI runs a real CNN as a chain of compute-shader passes.
 *
 * Hold the LEFT mouse button on the glowing canvas and paint a digit. Every frame the
 * 28x28 ink is preprocessed EXACTLY like MNIST (crop to the ink bbox, scale the longer
 * side to ~20px, center by center-of-mass into a 28x28 field, anti-alias) and pushed
 * through a LeNet-style convnet whose forward pass is six D3D11 compute dispatches:
 *
 *   input 1x28x28
 *   [conv1] conv3x3 1->8  (pad1) + ReLU      -> 8x28x28
 *   [pool1] maxpool 2x2                       -> 8x14x14
 *   [conv2] conv3x3 8->16 (pad1) + ReLU      -> 16x14x14
 *   [pool2] maxpool 2x2                       -> 16x7x7  (flatten 784)
 *   [fc]    784->10 GEMM                      -> 10 logits
 *   [soft]  numerically-stable softmax        -> 10 probabilities
 *
 * The 16 second-layer feature maps are read back and visualized live as a glowing
 * activation grid (you can literally watch the network "see"), the 10 class
 * probabilities drive animated confidence bars, and the winning class is rendered as a
 * huge neon digit. The model was trained OFFLINE on the REAL MNIST dataset
 * (digit-oracle.train.ts, >99% held-out test accuracy) and baked into
 * digit-oracle.weights.ts. Press SPACE / C to clear, 1..4 to stamp a reference digit,
 * ESC to exit.
 *
 * Engine APIs (from ./_gpu): createWindow, createDevice, compile, makeComputeShader /
 *   makeVertexShader / makePixelShader, makeStructuredBuffer (SRV weights + UAV
 *   activations + cpuWritable input), makeConstantBuffer / updateConstantBuffer,
 *   updateDynamicBuffer, csSet / dispatch, readbackBuffer, vsSet / psSet /
 *   setRenderTargets / setViewport / clear / drawFullscreenTriangle, present,
 *   comRelease / blobRelease. GDI HUD via ./_hud (composited, flicker-free).
 *
 * SELFSHOT=1 SELFSHOT_PATH=<abs.png> captures the back buffer before present for
 * unattended visual verification.
 *
 * Run: bun run packages/all/example/digit-oracle.ts
 */
import { FFIType, read, type Pointer } from 'bun:ffi';

import { GDI32, User32 } from '../index';
import { SystemMetric } from '@bun-win32/user32';
import * as gpu from './_gpu';
import * as hud from './_hud';
import { captureBackBuffer } from './_snapshot';
import { C1, C2, K, PAD, FC_IN, N_OUT, GRID, MNIST_TEST_ACC, WEIGHTS_B64, REF3_B64, REF7_B64, REF5_B64, REF8_B64 } from './digit-oracle.weights';

const encodeWide = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');
const SELFSHOT = process.env.SELFSHOT === '1';
const SELFSHOT_PATH = process.env.SELFSHOT_PATH ?? '';
const SELFCHECK = process.env.SELFCHECK === '1';

// ── Modest, ~16:9 borderless window (NOT full-screen) ─────────────────────────────
const screenW = User32.GetSystemMetrics(SystemMetric.SM_CXSCREEN) || 1920;
const screenH = User32.GetSystemMetrics(SystemMetric.SM_CYSCREEN) || 1080;
const WIN_H = Math.min(1000, Math.floor(screenH * 0.72));
const WIN_W = Math.min(Math.floor(screenW * 0.9), Math.round((WIN_H * 16) / 9));
const win = gpu.createWindow({ title: 'Digit Oracle — a convnet on the GPU, in pure TypeScript', width: WIN_W, height: WIN_H, borderless: true });
const { w: clientW, h: clientH } = win.clientSize();
const dev = gpu.createDevice(win.hwnd, { width: clientW, height: clientH });

console.log('Digit Oracle — a LeNet-style CNN recognizing handwriting on the GPU, in pure TypeScript.');
console.log(`  ${clientW}x${clientH} · ${dev.driver} · ${dev.gpuName} · MNIST test acc ${MNIST_TEST_ACC}%`);
console.log('  Hold LEFT MOUSE to draw · SPACE/C clears · 1-4 stamps a sample · ESC exits.\n');

// ── Decode baked CNN weights → per-tensor SRVs (long-lived) ───────────────────────
const W1_LEN = C1 * 1 * K * K; // 72
const B1_LEN = C1; // 8
const W2_LEN = C2 * C1 * K * K; // 1152
const B2_LEN = C2; // 16
const WF_LEN = N_OUT * FC_IN; // 7840
const BF_LEN = N_OUT; // 10
const weights = new Float32Array(Buffer.from(WEIGHTS_B64, 'base64').buffer.slice(0));
let wo = 0;
const w1f = weights.subarray(wo, (wo += W1_LEN));
const b1f = weights.subarray(wo, (wo += B1_LEN));
const w2f = weights.subarray(wo, (wo += W2_LEN));
const b2f = weights.subarray(wo, (wo += B2_LEN));
const wff = weights.subarray(wo, (wo += WF_LEN));
const bff = weights.subarray(wo, (wo += BF_LEN));

function f32Buf(src: Float32Array): Buffer {
  return Buffer.from(src.buffer, src.byteOffset, src.byteLength);
}

const w1Buf = gpu.makeStructuredBuffer({ stride: 4, count: W1_LEN, srv: true, initialData: f32Buf(w1f) });
const b1Buf = gpu.makeStructuredBuffer({ stride: 4, count: B1_LEN, srv: true, initialData: f32Buf(b1f) });
const w2Buf = gpu.makeStructuredBuffer({ stride: 4, count: W2_LEN, srv: true, initialData: f32Buf(w2f) });
const b2Buf = gpu.makeStructuredBuffer({ stride: 4, count: B2_LEN, srv: true, initialData: f32Buf(b2f) });
const wfBuf = gpu.makeStructuredBuffer({ stride: 4, count: WF_LEN, srv: true, initialData: f32Buf(wff) });
const bfBuf = gpu.makeStructuredBuffer({ stride: 4, count: BF_LEN, srv: true, initialData: f32Buf(bff) });

// Activation buffers (each is both UAV for the producing pass and SRV for the next).
const A1_LEN = C1 * 28 * 28; // 6272
const P1_LEN = C1 * 14 * 14; // 1568
const A2_LEN = C2 * 14 * 14; // 3136
const P2_LEN = C2 * 7 * 7; // 784
const inBuf = gpu.makeStructuredBuffer({ stride: 4, count: GRID * GRID, srv: true, cpuWritable: true });
const a1Buf = gpu.makeStructuredBuffer({ stride: 4, count: A1_LEN, uav: true, srv: true });
const p1Buf = gpu.makeStructuredBuffer({ stride: 4, count: P1_LEN, uav: true, srv: true });
const a2Buf = gpu.makeStructuredBuffer({ stride: 4, count: A2_LEN, uav: true, srv: true });
const p2Buf = gpu.makeStructuredBuffer({ stride: 4, count: P2_LEN, uav: true, srv: true });
const logitsBuf = gpu.makeStructuredBuffer({ stride: 4, count: N_OUT, uav: true, srv: true });
const probsBuf = gpu.makeStructuredBuffer({ stride: 4, count: N_OUT, uav: true });

// ── HLSL: the CNN forward pass as six compute kernels ─────────────────────────────
const DIMS_CB = `
cbuffer Dims : register(b0) {
  uint gC1; uint gC2; uint gK; uint gPad;
  uint gFcIn; uint gNOut; uint pad0; uint pad1;
};
`;

// conv1: one thread per (oc,oy,ox). Input is the 28x28 grid in t0; w1 [oc][ky][kx] in t1; b1 in t2.
const CONV1_CS = `
${DIMS_CB}
StructuredBuffer<float> Input : register(t0);
StructuredBuffer<float> W1    : register(t1);
StructuredBuffer<float> B1    : register(t2);
RWStructuredBuffer<float> A1   : register(u0);
[numthreads(64,1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint n = id.x;
  uint total = gC1 * 28u * 28u;
  if (n >= total) return;
  uint ox = n % 28u;
  uint oy = (n / 28u) % 28u;
  uint oc = n / (28u * 28u);
  float acc = B1[oc];
  uint wbase = oc * (gK * gK);
  for (uint ky = 0u; ky < gK; ky++) {
    int iy = int(oy) + int(ky) - int(gPad);
    if (iy < 0 || iy >= 28) continue;
    for (uint kx = 0u; kx < gK; kx++) {
      int ix = int(ox) + int(kx) - int(gPad);
      if (ix < 0 || ix >= 28) continue;
      acc += Input[uint(iy) * 28u + uint(ix)] * W1[wbase + ky * gK + kx];
    }
  }
  A1[n] = max(acc, 0.0);
}
`;

// pool1: maxpool 2x2 over A1 (C1 x 28 x 28) -> P1 (C1 x 14 x 14).
const POOL1_CS = `
${DIMS_CB}
StructuredBuffer<float> A1 : register(t0);
RWStructuredBuffer<float> P1 : register(u0);
[numthreads(64,1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint n = id.x;
  uint total = gC1 * 14u * 14u;
  if (n >= total) return;
  uint ox = n % 14u;
  uint oy = (n / 14u) % 14u;
  uint c  = n / (14u * 14u);
  uint sbase = c * 28u * 28u;
  float m = -1e30;
  for (uint py = 0u; py < 2u; py++)
    for (uint px = 0u; px < 2u; px++)
      m = max(m, A1[sbase + (oy*2u+py) * 28u + (ox*2u+px)]);
  P1[n] = m;
}
`;

// conv2: one thread per (oc,oy,ox). P1 in t0; w2 [oc][ic][ky][kx] in t1; b2 in t2.
const CONV2_CS = `
${DIMS_CB}
StructuredBuffer<float> P1 : register(t0);
StructuredBuffer<float> W2 : register(t1);
StructuredBuffer<float> B2 : register(t2);
RWStructuredBuffer<float> A2 : register(u0);
[numthreads(64,1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint n = id.x;
  uint total = gC2 * 14u * 14u;
  if (n >= total) return;
  uint ox = n % 14u;
  uint oy = (n / 14u) % 14u;
  uint oc = n / (14u * 14u);
  float acc = B2[oc];
  for (uint ic = 0u; ic < gC1; ic++) {
    uint ibase = ic * 14u * 14u;
    uint wbase = (oc * gC1 + ic) * (gK * gK);
    for (uint ky = 0u; ky < gK; ky++) {
      int iy = int(oy) + int(ky) - int(gPad);
      if (iy < 0 || iy >= 14) continue;
      for (uint kx = 0u; kx < gK; kx++) {
        int ix = int(ox) + int(kx) - int(gPad);
        if (ix < 0 || ix >= 14) continue;
        acc += P1[ibase + uint(iy) * 14u + uint(ix)] * W2[wbase + ky * gK + kx];
      }
    }
  }
  A2[n] = max(acc, 0.0);
}
`;

// pool2: maxpool 2x2 over A2 (C2 x 14 x 14) -> P2 (C2 x 7 x 7), the flatten vector.
const POOL2_CS = `
${DIMS_CB}
StructuredBuffer<float> A2 : register(t0);
RWStructuredBuffer<float> P2 : register(u0);
[numthreads(64,1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint n = id.x;
  uint total = gC2 * 7u * 7u;
  if (n >= total) return;
  uint ox = n % 7u;
  uint oy = (n / 7u) % 7u;
  uint c  = n / (7u * 7u);
  uint sbase = c * 14u * 14u;
  float m = -1e30;
  for (uint py = 0u; py < 2u; py++)
    for (uint px = 0u; px < 2u; px++)
      m = max(m, A2[sbase + (oy*2u+py) * 14u + (ox*2u+px)]);
  P2[n] = m;
}
`;

// fc: one thread per output o. P2 (flatten 784) in t0; wf [o][i] in t1; bf in t2.
const FC_CS = `
${DIMS_CB}
StructuredBuffer<float> P2 : register(t0);
StructuredBuffer<float> WF : register(t1);
StructuredBuffer<float> BF : register(t2);
RWStructuredBuffer<float> Logits : register(u0);
[numthreads(16,1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint o = id.x;
  if (o >= gNOut) return;
  float acc = BF[o];
  uint wbase = o * gFcIn;
  [loop] for (uint i = 0u; i < gFcIn; i++) acc += P2[i] * WF[wbase + i];
  Logits[o] = acc;
}
`;

const SOFTMAX_CS = `
${DIMS_CB}
StructuredBuffer<float> Logits : register(t0);
RWStructuredBuffer<float> Probs : register(u0);
[numthreads(1,1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  float mx = -1e30;
  [loop] for (uint o = 0u; o < gNOut; o++) mx = max(mx, Logits[o]);
  float sum = 0.0;
  [loop] for (uint o2 = 0u; o2 < gNOut; o2++) sum += exp(Logits[o2] - mx);
  [loop] for (uint o3 = 0u; o3 < gNOut; o3++) Probs[o3] = exp(Logits[o3] - mx) / sum;
}
`;

// ── Render shaders ────────────────────────────────────────────────────────────────
const VS_SRC = `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o;
  float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p;
  o.pos = float4(p * float2(2.0, -2.0) + float2(-1.0, 1.0), 0.0, 1.0);
  return o;
}
`;

// The whole UI in one fullscreen pixel shader: animated nebula background, glowing
// draw canvas (with bloom + scanlines + neon frame), the 16 live conv2 feature maps as
// a 4x4 glowing tile grid, ten confidence bars, and connection "wires" between panels.
const PS_SRC = `
cbuffer UI : register(b0) {
  float4 gP;       // x=screenW y=screenH z=argmax w=time
  float4 gCanvas;  // x=left y=top z=size w=conf
  float4 gFeat;    // x=left y=top z=tileSize w=cols(=4)
  float4 gBars;    // x=left y=top z=width w=height
  float4 gMisc;    // x=hasInk y=maxFeat z=secondConf w=entropy
  float4 gVerdict; // x=cardCx y=cardCy z=cardRadius w=conf (neon halo behind big digit)
};
StructuredBuffer<float> Canvas : register(t0); // 784 raw display ink
StructuredBuffer<float> Probs  : register(t1); // 10
StructuredBuffer<float> Feat   : register(t2); // C2*14*14 conv2 activations (A2)

static const float PI = 3.14159265;

float hash21(float2 p) {
  p = frac(p * float2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return frac(p.x * p.y);
}

// Warm-to-electric inferno ramp for the ink + heat panels.
float3 inferno(float t) {
  t = saturate(t);
  float3 c0 = float3(0.012, 0.018, 0.05);
  float3 c1 = float3(0.30, 0.06, 0.45);
  float3 c2 = float3(0.95, 0.28, 0.30);
  float3 c3 = float3(1.00, 0.80, 0.32);
  float3 c4 = float3(1.00, 0.99, 0.92);
  if (t < 0.25) return lerp(c0, c1, t / 0.25);
  if (t < 0.55) return lerp(c1, c2, (t - 0.25) / 0.30);
  if (t < 0.80) return lerp(c2, c3, (t - 0.55) / 0.25);
  return lerp(c3, c4, (t - 0.80) / 0.20);
}

// Cool teal->cyan->white ramp for the feature maps (so they read as "data" not "fire").
float3 plasma(float t) {
  t = saturate(t);
  float3 c0 = float3(0.02, 0.05, 0.12);
  float3 c1 = float3(0.05, 0.35, 0.55);
  float3 c2 = float3(0.10, 0.85, 0.95);
  float3 c3 = float3(0.85, 1.00, 1.00);
  if (t < 0.45) return lerp(c0, c1, t / 0.45);
  if (t < 0.78) return lerp(c1, c2, (t - 0.45) / 0.33);
  return lerp(c2, c3, (t - 0.78) / 0.22);
}

float sampleCanvas(float2 g) {
  g = clamp(g, 0.0, 27.0);
  int x0 = (int)floor(g.x); int y0 = (int)floor(g.y);
  int x1 = min(x0 + 1, 27); int y1 = min(y0 + 1, 27);
  float fx = g.x - x0; float fy = g.y - y0;
  float a = Canvas[y0 * 28 + x0];
  float b = Canvas[y0 * 28 + x1];
  float c = Canvas[y1 * 28 + x0];
  float d = Canvas[y1 * 28 + x1];
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
}

// Bilinear sample of feature channel c (14x14) at cell coords g.
float sampleFeat(int c, float2 g) {
  g = clamp(g, 0.0, 13.0);
  int x0 = (int)floor(g.x); int y0 = (int)floor(g.y);
  int x1 = min(x0 + 1, 13); int y1 = min(y0 + 1, 13);
  float fx = g.x - x0; float fy = g.y - y0;
  int b = c * 14 * 14;
  float a = Feat[b + y0 * 14 + x0];
  float bb = Feat[b + y0 * 14 + x1];
  float cc = Feat[b + y1 * 14 + x0];
  float d = Feat[b + y1 * 14 + x1];
  return lerp(lerp(a, bb, fx), lerp(cc, d, fx), fy);
}

float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 px = fp.xy;
  float W = gP.x; float H = gP.y;
  int argmax = (int)gP.z;
  float t = gP.w;
  float hasInk = gMisc.x;
  float maxFeat = max(gMisc.y, 1e-3);

  float2 q = px / float2(W, H);

  // ── Deep animated nebula background ──
  float3 col = float3(0.018, 0.022, 0.045);
  {
    float2 c = q - 0.5;
    float r = length(c);
    // slow drifting plasma
    float n = 0.0;
    n += sin(q.x * 6.0 + t * 0.20) * 0.5 + 0.5;
    n += sin((q.y * 7.0 - t * 0.16) + sin(q.x * 4.0)) * 0.5 + 0.5;
    n *= 0.5;
    float3 neb = lerp(float3(0.03, 0.05, 0.12), float3(0.10, 0.06, 0.20), n);
    col = neb * (0.6 + 0.4 * (1.0 - r));
    // faint star/grid dust
    float2 gp = floor(px / 3.0);
    float spk = step(0.9975, hash21(gp));
    col += spk * 0.5 * float3(0.6, 0.75, 1.0);
    // vignette
    col *= smoothstep(0.95, 0.25, r);
  }

  // ── Neon halo behind the verdict digit ──
  // A soft radial bloom under the big winner glyph (GDI digit composites on top), so the
  // verdict reads as a glowing badge. Intensity tracks confidence; only when there's ink.
  {
    float2 vc = gVerdict.xy;
    float vr = max(gVerdict.z, 1.0);
    float vconf = gVerdict.w;
    if (hasInk > 0.5 && vconf > 0.0) {
      float vd = length(px - vc);
      float halo = exp(-vd * vd / (vr * vr));
      float ring = exp(-pow((vd - vr * 0.78) / (vr * 0.16), 2.0));
      float3 glowCol = lerp(float3(0.10, 0.55, 0.85), float3(0.30, 1.0, 0.62), vconf);
      col += halo * (0.35 + 0.45 * vconf) * glowCol;
      col += ring * 0.30 * (0.5 + 0.5 * vconf) * glowCol;
    }
  }

  // ── Draw canvas panel ──
  float cl = gCanvas.x; float ct = gCanvas.y; float cs = gCanvas.z;
  {
    // outer neon frame glow (drawn even just outside the panel)
    float2 d = max(float2(cl, ct) - px, px - float2(cl + cs, ct + cs));
    float distOut = length(max(d, 0.0));
    float frameGlow = exp(-distOut * 0.05);
    col += frameGlow * float3(0.18, 0.55, 1.0) * 0.5;
  }
  if (px.x >= cl && px.x < cl + cs && px.y >= ct && px.y < ct + cs) {
    float2 inC = (px - float2(cl, ct)) / cs;
    float2 g = inC * 28.0;
    float v = sampleCanvas(g);
    float glow = v;
    glow += sampleCanvas(g + float2(0.7, 0.0)) * 0.5;
    glow += sampleCanvas(g - float2(0.7, 0.0)) * 0.5;
    glow += sampleCanvas(g + float2(0.0, 0.7)) * 0.5;
    glow += sampleCanvas(g - float2(0.0, 0.7)) * 0.5;
    glow += sampleCanvas(g + float2(1.4, 1.4)) * 0.25;
    glow += sampleCanvas(g - float2(1.4, 1.4)) * 0.25;
    glow /= 3.5;
    float intensity = saturate(v * 1.2 + glow * 0.9);
    float3 ink = inferno(intensity * 0.95 + 0.05);
    // subtle backplate + cell grid
    float2 cell = frac(g);
    float grid = step(0.94, cell.x) + step(0.94, cell.y);
    float3 backplate = float3(0.025, 0.04, 0.085);
    float3 panel = lerp(backplate, ink, smoothstep(0.015, 0.30, intensity) + intensity);
    panel += grid * 0.03 * float3(0.25, 0.5, 0.9) * (1.0 - intensity);
    // scanlines for the holo look
    panel *= 0.88 + 0.12 * sin(px.y * 1.6 + t * 2.0);
    // bloom-ish lift on bright ink
    panel += pow(intensity, 3.0) * float3(0.5, 0.35, 0.15) * 1.2;
    // inner border
    float2 e = min(inC, 1.0 - inC);
    float border = smoothstep(0.0, 0.010, min(e.x, e.y));
    float3 frameCol = float3(0.25, 0.7, 1.0) * (0.7 + 0.3 * sin(t * 2.5));
    col = lerp(frameCol, panel, border);
    return float4(col, 1.0);
  }

  // ── Feature-map activation grid (16 conv2 maps, 4x4 tiles) ──
  float fl = gFeat.x; float ftp = gFeat.y; float ts = gFeat.z; int cols = (int)gFeat.w;
  float gap = ts * 0.10;
  float cellSpan = ts + gap;
  if (px.x >= fl && px.x < fl + cellSpan * cols - gap + 1.0 &&
      px.y >= ftp && px.y < ftp + cellSpan * cols - gap + 1.0) {
    float lx = px.x - fl; float ly = px.y - ftp;
    int tx = (int)floor(lx / cellSpan);
    int ty = (int)floor(ly / cellSpan);
    if (tx >= 0 && tx < cols && ty >= 0 && ty < cols) {
      float inx = lx - tx * cellSpan;
      float iny = ly - ty * cellSpan;
      if (inx < ts && iny < ts) {
        int ch = ty * cols + tx;
        float2 fg = float2(inx, iny) / ts * 14.0;
        float a = sampleFeat(ch, fg) / maxFeat;
        float3 tile = plasma(saturate(a) * hasInk);
        // tile bezel
        float2 te = min(float2(inx, iny) / ts, 1.0 - float2(inx, iny) / ts);
        float bez = smoothstep(0.0, 0.04, min(te.x, te.y));
        float3 bezel = float3(0.04, 0.10, 0.16);
        tile = lerp(bezel, tile, bez);
        // animated activation shimmer
        tile += saturate(a) * 0.15 * sin(t * 3.0 + ch) * float3(0.1, 0.3, 0.4);
        return float4(tile, 1.0);
      }
    }
    return float4(col * 0.6, 1.0);
  }

  // ── Confidence bars ──
  float bl = gBars.x; float bt = gBars.y; float bw = gBars.z; float bh = gBars.w;
  if (px.x >= bl && px.x <= bl + bw && px.y >= bt && px.y <= bt + bh) {
    float rowH = bh / 10.0;
    int row = (int)floor((px.y - bt) / rowH);
    row = clamp(row, 0, 9);
    float yInRow = (px.y - bt) - row * rowH;
    float barGap = rowH * 0.22;
    if (yInRow > barGap && yInRow < rowH - barGap) {
      float p = saturate(Probs[row]) * hasInk;
      float trackLeft = bl;
      float trackW = bw;
      float fillRight = trackLeft + trackW * p;
      bool isWin = (row == argmax) && hasInk > 0.5;
      float grad = (px.x - trackLeft) / max(trackW, 1.0);
      if (px.x <= fillRight) {
        float3 winA = float3(0.20, 1.0, 0.65);
        float3 winB = float3(0.95, 1.0, 0.55);
        float3 othA = float3(0.10, 0.30, 0.75);
        float3 othB = float3(0.25, 0.70, 1.0);
        float3 bar = isWin ? lerp(winA, winB, grad) : lerp(othA, othB, grad);
        float pulse = isWin ? (0.80 + 0.20 * sin(t * 7.0)) : 1.0;
        // glossy highlight near the leading edge
        float edge = smoothstep(fillRight - 14.0, fillRight, px.x);
        bar += edge * 0.6;
        // top sheen
        float sheen = 1.0 - smoothstep(barGap, rowH * 0.5, yInRow);
        bar += sheen * 0.18;
        col = bar * pulse;
      } else {
        // empty track with a faint inner gradient + tick
        col = float3(0.05, 0.07, 0.12) + grad * float3(0.01, 0.015, 0.03);
      }
      return float4(col, 1.0);
    }
  }

  return float4(col, 1.0);
}
`;

// ── Compile + create shaders ──────────────────────────────────────────────────────
const conv1Code = gpu.compile(CONV1_CS, 'main', 'cs_5_0');
const pool1Code = gpu.compile(POOL1_CS, 'main', 'cs_5_0');
const conv2Code = gpu.compile(CONV2_CS, 'main', 'cs_5_0');
const pool2Code = gpu.compile(POOL2_CS, 'main', 'cs_5_0');
const fcCode = gpu.compile(FC_CS, 'main', 'cs_5_0');
const softmaxCode = gpu.compile(SOFTMAX_CS, 'main', 'cs_5_0');
const vsCode = gpu.compile(VS_SRC, 'main', 'vs_5_0');
const psCode = gpu.compile(PS_SRC, 'main', 'ps_5_0');
const conv1CS = gpu.makeComputeShader(conv1Code);
const pool1CS = gpu.makeComputeShader(pool1Code);
const conv2CS = gpu.makeComputeShader(conv2Code);
const pool2CS = gpu.makeComputeShader(pool2Code);
const fcCS = gpu.makeComputeShader(fcCode);
const softmaxCS = gpu.makeComputeShader(softmaxCode);
const vs = gpu.makeVertexShader(vsCode);
const ps = gpu.makePixelShader(psCode);

// ── Constant buffers ────────────────────────────────────────────────────────────
const DIMS_SIZE = 32;
const dimsCb = gpu.makeConstantBuffer(DIMS_SIZE);
{
  const d = Buffer.alloc(DIMS_SIZE);
  d.writeUInt32LE(C1, 0);
  d.writeUInt32LE(C2, 4);
  d.writeUInt32LE(K, 8);
  d.writeUInt32LE(PAD, 12);
  d.writeUInt32LE(FC_IN, 16);
  d.writeUInt32LE(N_OUT, 20);
  gpu.updateConstantBuffer(dimsCb, d);
}
const UI_SIZE = 96; // 6 float4
const uiCb = gpu.makeConstantBuffer(UI_SIZE);
const uiData = Buffer.alloc(UI_SIZE);

// ── Layout geometry ───────────────────────────────────────────────────────────────
// Three columns inside a work area below the title: [draw canvas] [feature maps]
// [verdict card + confidence bars]. Everything is derived from the client size so the
// composition stays balanced at the modest ~16:9 window.
const margin = Math.round(clientW * 0.032);
const workTop = Math.round(clientH * 0.155);
// Leave a real bottom margin so NOTHING (bars / big digit) is clipped by the client edge.
const workBot = Math.round(clientH * 0.93);
const workH = workBot - workTop;

// Column 1 — draw canvas (square), vertically centered.
const canvasSize = Math.min(Math.round(workH * 0.74), Math.round(clientW * 0.3));
const canvasLeft = margin;
const canvasTop = workTop + Math.round((workH - canvasSize) / 2);

// Column 2 — 4x4 conv-2 feature maps, sized to span most of the work height.
const featCols = 4;
const featGap = 0.12; // fraction of tile size
const featLeft = canvasLeft + canvasSize + Math.round(clientW * 0.045);
const featTileSize = Math.floor(Math.min(workH * 0.235, clientW * 0.072));
const featSpan = featTileSize * (1 + featGap);
const featGridW = featSpan * featCols - featTileSize * featGap;
const featTop = workTop + Math.round((workH - featGridW) / 2);

// Column 3 — verdict card (big glowing digit) stacked over the confidence bars.
const col3Left = featLeft + Math.round(featGridW) + Math.round(clientW * 0.05);
const col3Right = clientW - margin;
const col3W = col3Right - col3Left;
const verdictTop = workTop + Math.round(workH * 0.02);
const verdictH = Math.round(workH * 0.4);
const barTop = verdictTop + verdictH + Math.round(workH * 0.1);
const barHeight = workBot - barTop;
const barLabelW = Math.round(col3W * 0.07);
const barPctW = Math.round(col3W * 0.16);
const barLeft = col3Left + barLabelW;
const barWidth = col3W - barLabelW - barPctW;

// The huge winner digit lives INSIDE the verdict card (top of column 3), sized to fit
// the card height with margin (leaving room for the confidence readout below) so it
// never overflows the client area.
const bigFontPx = Math.round(verdictH * 0.8);
// Center + radius of the neon halo the pixel shader paints behind that digit.
const verdictCx = col3Left + Math.round(col3W / 2);
const verdictCy = verdictTop + Math.round(bigFontPx * 0.46);
const verdictR = Math.round(bigFontPx * 0.62);

// ── Canvas state ──────────────────────────────────────────────────────────────────
const N_IN = GRID * GRID;
const canvas = new Float32Array(N_IN); // raw ink (display)
const inputGrid = new Float32Array(N_IN); // MNIST-normalized (uploaded for inference)
const inUpload = Buffer.alloc(N_IN * 4);

function clearCanvas(): void {
  canvas.fill(0);
}

// Soft round brush, sized so a natural stroke is MNIST-thick after normalization.
function stampBrush(sx: number, sy: number): void {
  const gx = ((sx - canvasLeft) / canvasSize) * 28;
  const gy = ((sy - canvasTop) / canvasSize) * 28;
  if (gx < -2 || gy < -2 || gx > 30 || gy > 30) return;
  // Finer, more controllable brush: a tight Gaussian (~0.85 grid-unit core) that still
  // deposits enough ink for a natural stroke to survive the crop+scale-to-20px MNIST
  // normalization. Smaller radius + crisper falloff than before.
  const radius = 0.85;
  const sigma2 = 0.42; // Gaussian variance in grid² (tighter than the old 2*r²*0.6)
  const lo = Math.max(0, Math.floor(gx - radius - 1));
  const hi = Math.min(27, Math.ceil(gx + radius + 1));
  const loy = Math.max(0, Math.floor(gy - radius - 1));
  const hiy = Math.min(27, Math.ceil(gy + radius + 1));
  for (let y = loy; y <= hiy; y += 1) {
    for (let x = lo; x <= hi; x += 1) {
      const dx = x + 0.5 - gx;
      const dy = y + 0.5 - gy;
      const d2 = dx * dx + dy * dy;
      const v = Math.exp(-d2 / (2 * sigma2));
      const i = y * 28 + x;
      canvas[i] = Math.min(1, canvas[i]! + v * 0.85);
    }
  }
}

// ── MNIST-exact preprocessing: crop bbox → scale longer side to ~20px (area sample)
//    → center by center-of-mass into 28x28. MUST match digit-oracle.train.ts. ──────
function buildInput(): boolean {
  inputGrid.fill(0);
  let minX = 28;
  let minY = 28;
  let maxX = -1;
  let maxY = -1;
  let total = 0;
  const threshold = 0.08;
  for (let y = 0; y < 28; y += 1) {
    for (let x = 0; x < 28; x += 1) {
      const v = canvas[y * 28 + x]!;
      total += v;
      if (v > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || total < 0.5) return false;
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const scale = 20 / Math.max(bw, bh);
  const tw = Math.max(1, Math.round(bw * scale));
  const th = Math.max(1, Math.round(bh * scale));
  const staged = new Float32Array(tw * th);
  for (let py = 0; py < th; py += 1) {
    for (let px = 0; px < tw; px += 1) {
      const ix0 = Math.floor(minX + (px / tw) * bw);
      const ix1 = Math.min(27, Math.ceil(minX + ((px + 1) / tw) * bw) - 1);
      const iy0 = Math.floor(minY + (py / th) * bh);
      const iy1 = Math.min(27, Math.ceil(minY + ((py + 1) / th) * bh) - 1);
      let acc = 0;
      let cnt = 0;
      for (let yy = iy0; yy <= iy1; yy += 1) {
        for (let xx = ix0; xx <= ix1; xx += 1) {
          acc += canvas[yy * 28 + xx]!;
          cnt += 1;
        }
      }
      staged[py * tw + px] = cnt > 0 ? acc / cnt : 0;
    }
  }
  let sum = 0;
  let cx = 0;
  let cy = 0;
  for (let y = 0; y < th; y += 1) {
    for (let x = 0; x < tw; x += 1) {
      const v = staged[y * tw + x]!;
      sum += v;
      cx += x * v;
      cy += y * v;
    }
  }
  if (sum < 1e-4) return false;
  cx /= sum;
  cy /= sum;
  const offX = Math.round(13.5 - cx);
  const offY = Math.round(13.5 - cy);
  for (let y = 0; y < th; y += 1) {
    for (let x = 0; x < tw; x += 1) {
      const dx = x + offX;
      const dy = y + offY;
      if (dx >= 0 && dx < 28 && dy >= 0 && dy < 28) inputGrid[dy * 28 + dx] = staged[y * tw + x]!;
    }
  }
  return true;
}

// ── GPU forward pass: six compute dispatches + readback ────────────────────────────
const probsOut = new Float32Array(N_OUT);
const featOut = new Float32Array(A2_LEN); // conv2 activations for the visualization
let featMax = 1;

function unbindCs(srvCount: number): void {
  gpu.csSet(0n, { uav: [0n] });
  const arr = Buffer.alloc(8 * srvCount);
  gpu.vcall(dev.context, gpu.CTX_CS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, srvCount, arr.ptr!], FFIType.void);
}

function infer(hasInk: boolean): { argmax: number; conf: number } {
  if (!hasInk) {
    probsOut.fill(0);
    featOut.fill(0);
    featMax = 1;
    return { argmax: -1, conf: 0 };
  }
  inUpload.set(new Uint8Array(inputGrid.buffer, inputGrid.byteOffset, N_IN * 4));
  gpu.updateDynamicBuffer(inBuf.buffer, inUpload);

  // conv1 -> A1
  gpu.csSet(conv1CS, { cb: [dimsCb], srv: [inBuf.srv!, w1Buf.srv!, b1Buf.srv!], uav: [a1Buf.uav!] });
  gpu.dispatch(Math.ceil(A1_LEN / 64), 1, 1);
  unbindCs(3);
  // pool1 -> P1
  gpu.csSet(pool1CS, { cb: [dimsCb], srv: [a1Buf.srv!], uav: [p1Buf.uav!] });
  gpu.dispatch(Math.ceil(P1_LEN / 64), 1, 1);
  unbindCs(1);
  // conv2 -> A2
  gpu.csSet(conv2CS, { cb: [dimsCb], srv: [p1Buf.srv!, w2Buf.srv!, b2Buf.srv!], uav: [a2Buf.uav!] });
  gpu.dispatch(Math.ceil(A2_LEN / 64), 1, 1);
  unbindCs(3);
  // pool2 -> P2
  gpu.csSet(pool2CS, { cb: [dimsCb], srv: [a2Buf.srv!], uav: [p2Buf.uav!] });
  gpu.dispatch(Math.ceil(P2_LEN / 64), 1, 1);
  unbindCs(1);
  // fc -> Logits
  gpu.csSet(fcCS, { cb: [dimsCb], srv: [p2Buf.srv!, wfBuf.srv!, bfBuf.srv!], uav: [logitsBuf.uav!] });
  gpu.dispatch(1, 1, 1);
  unbindCs(3);
  // softmax -> Probs
  gpu.csSet(softmaxCS, { cb: [dimsCb], srv: [logitsBuf.srv!], uav: [probsBuf.uav!] });
  gpu.dispatch(1, 1, 1);
  unbindCs(1);

  // Read back probabilities + conv2 activations (for the live feature-map panel).
  const probsAb = gpu.readbackBuffer(probsBuf.buffer, N_OUT * 4);
  probsOut.set(new Float32Array(probsAb));
  const featAb = gpu.readbackBuffer(a2Buf.buffer, A2_LEN * 4);
  featOut.set(new Float32Array(featAb));
  let fm = 1e-3;
  for (let i = 0; i < A2_LEN; i += 1) if (featOut[i]! > fm) fm = featOut[i]!;
  featMax = fm;

  let am = 0;
  for (let o = 1; o < N_OUT; o += 1) if (probsOut[o]! > probsOut[am]!) am = o;
  return { argmax: am, conf: probsOut[am]! };
}

// ── Display buffers for the render PS ──────────────────────────────────────────────
const dispBuf = gpu.makeStructuredBuffer({ stride: 4, count: N_IN, srv: true, cpuWritable: true });
const dispUpload = Buffer.alloc(N_IN * 4);
const probsSrvBuf = gpu.makeStructuredBuffer({ stride: 4, count: N_OUT, srv: true, cpuWritable: true });
const probsUpload = Buffer.alloc(N_OUT * 4);
const featSrvBuf = gpu.makeStructuredBuffer({ stride: 4, count: A2_LEN, srv: true, cpuWritable: true });
const featUpload = Buffer.alloc(A2_LEN * 4);

// ── Reference glyphs (pre-classified MNIST test samples) ───────────────────────────
const refDigits: Record<number, Float32Array> = {
  3: new Float32Array(Buffer.from(REF3_B64, 'base64').buffer.slice(0)),
  7: new Float32Array(Buffer.from(REF7_B64, 'base64').buffer.slice(0)),
  5: new Float32Array(Buffer.from(REF5_B64, 'base64').buffer.slice(0)),
  8: new Float32Array(Buffer.from(REF8_B64, 'base64').buffer.slice(0)),
};
function stampRef(d: number): void {
  const ref = refDigits[d];
  if (!ref) return;
  for (let i = 0; i < N_IN; i += 1) canvas[i] = ref[i]!;
}
stampRef(3); // default for an unattended screenshot

// ── GDI HUD ─────────────────────────────────────────────────────────────────────
const titleFont = GDI32.CreateFontW(-Math.round(clientH * 0.026), 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Segoe UI').ptr!);
const bigFont = GDI32.CreateFontW(-bigFontPx, 0, 0, 0, 800, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Segoe UI Semibold').ptr!);
const labelFont = GDI32.CreateFontW(-Math.round(Math.min(clientH * 0.04, 36)), 0, 0, 0, 700, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);
const smallFont = GDI32.CreateFontW(-Math.round(clientH * 0.022), 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);
const TRANSPARENT_BK = 1;

function text(dc: bigint, x: number, y: number, s: string, color: number, shadow = true): void {
  const t = encodeWide(s);
  if (shadow) {
    GDI32.SetTextColor(dc, 0x00060606);
    GDI32.TextOutW(dc, x + 2, y + 2, t.ptr!, s.length);
  }
  GDI32.SetTextColor(dc, color);
  GDI32.TextOutW(dc, x, y, t.ptr!, s.length);
}

function drawHud(fps: number, argmax: number, conf: number, hasInk: boolean): void {
  hud.draw(dev, clientW, clientH, (dc) => {
    GDI32.SetBkMode(dc, TRANSPARENT_BK);

    // Title bar.
    GDI32.SelectObject(dc, titleFont);
    text(dc, Math.round(margin), Math.round(clientH * 0.045), 'DIGIT ORACLE', 0x00f0e0c0);
    GDI32.SelectObject(dc, smallFont);
    text(dc, Math.round(margin), Math.round(clientH * 0.09), `convolutional neural net · GPU compute · pure TypeScript · ${MNIST_TEST_ACC}% MNIST`, 0x00b0c8d8);
    // fps + gpu, right aligned-ish.
    text(dc, Math.round(clientW - clientW * 0.32), Math.round(clientH * 0.045), `${fps} fps`, 0x0090ffd0);
    text(dc, Math.round(clientW - clientW * 0.32), Math.round(clientH * 0.078), `${dev.gpuName}`, 0x008090a0);

    // Canvas caption.
    GDI32.SelectObject(dc, smallFont);
    text(dc, Math.round(canvasLeft), Math.round(canvasTop - clientH * 0.038), hasInk ? 'INPUT  28x28' : 'DRAW A DIGIT (hold LMB)', hasInk ? 0x0070b0e0 : 0x0060a0ff);
    text(dc, Math.round(canvasLeft), Math.round(canvasTop + canvasSize + clientH * 0.012), 'SPACE clears · 1-4 samples · ESC', 0x00708090);

    // Feature-map caption.
    text(dc, Math.round(featLeft), Math.round(featTop - clientH * 0.038), 'CONV-2 FEATURE MAPS  16ch', 0x0080d0e0);

    // Confidence caption + labels.
    text(dc, Math.round(barLeft), Math.round(barTop - clientH * 0.038), 'CLASS CONFIDENCE', 0x0090c0d0);
    GDI32.SelectObject(dc, labelFont);
    const rowH = barHeight / 10;
    for (let d = 0; d < 10; d += 1) {
      const ly = Math.round(barTop + d * rowH + rowH * 0.1);
      const isWin = hasInk && d === argmax;
      text(dc, Math.round(barLeft - clientW * 0.022), ly, String(d), isWin ? 0x0080ffd0 : 0x00a0b0c0);
      const pstr = `${(Math.min(1, probsOut[d]!) * 100).toFixed(0)}%`;
      text(dc, Math.round(barLeft + barWidth - clientW * 0.045), ly, pstr, isWin ? 0x0080ffd0 : 0x007890a0);
    }

    // Verdict caption above the card.
    text(dc, Math.round(col3Left), Math.round(verdictTop - clientH * 0.038), 'VERDICT', 0x0090c0d0);

    // Big prediction digit — centered INSIDE the verdict card (top of column 3) so it
    // always fits within the client area.
    if (hasInk && argmax >= 0) {
      GDI32.SelectObject(dc, bigFont);
      const ds = String(argmax);
      const dt = encodeWide(ds);
      // A single Segoe UI Semibold digit is ~0.55em wide; center it in the card.
      const glyphW = Math.round(bigFontPx * 0.55);
      const predX = col3Left + Math.round((col3W - glyphW) / 2);
      // Seat the digit toward the top of the card, leaving a clear band below for the
      // confidence readout (GDI font cells carry internal leading, so nudge up a touch).
      const predY = verdictTop - Math.round(bigFontPx * 0.1);
      GDI32.SetTextColor(dc, 0x00103020);
      GDI32.TextOutW(dc, predX + 5, predY + 5, dt.ptr!, ds.length);
      GDI32.SetTextColor(dc, 0x0070ffd0);
      GDI32.TextOutW(dc, predX, predY, dt.ptr!, ds.length);
      // Confidence readout, centered in the clear band under the digit.
      GDI32.SelectObject(dc, titleFont);
      const cstr = `${(conf * 100).toFixed(1)}% sure`;
      const cx = col3Left + Math.round((col3W - cstr.length * clientH * 0.013) / 2);
      text(dc, cx, verdictTop + verdictH - Math.round(clientH * 0.02), cstr, 0x00d0f0e0);
    }
  });
}

// ── Teardown ──────────────────────────────────────────────────────────────────────
let cleaned = false;
function cleanup(code: number): never {
  if (!cleaned) {
    cleaned = true;
    try {
      gpu.csSet(0n, { uav: [0n] });
      gpu.setRenderTargets([]);
      hud.release();
      for (const f of [titleFont, bigFont, labelFont, smallFont]) GDI32.DeleteObject(f);
      const sbs = [w1Buf, b1Buf, w2Buf, b2Buf, wfBuf, bfBuf, inBuf, a1Buf, p1Buf, a2Buf, p2Buf, logitsBuf, probsBuf, dispBuf, probsSrvBuf, featSrvBuf];
      for (const b of sbs) {
        gpu.comRelease(b.srv ?? 0n);
        gpu.comRelease(b.uav ?? 0n);
        gpu.comRelease(b.buffer);
      }
      gpu.comRelease(dimsCb);
      gpu.comRelease(uiCb);
      gpu.comRelease(ps);
      gpu.comRelease(vs);
      for (const cs of [conv1CS, pool1CS, conv2CS, pool2CS, fcCS, softmaxCS]) gpu.comRelease(cs);
      for (const cc of [psCode, vsCode, conv1Code, pool1Code, conv2Code, pool2Code, fcCode, softmaxCode]) gpu.blobRelease(cc.blob);
      gpu.comRelease(dev.backBufferRTV);
      gpu.comRelease(dev.swapChain);
      gpu.comRelease(dev.context);
      gpu.comRelease(dev.device);
    } catch {
      // best-effort teardown
    }
    win.destroy();
  }
  process.exit(code);
}
process.on('SIGINT', () => cleanup(0));
process.on('uncaughtException', (err) => {
  console.error(err);
  cleanup(1);
});

// ── SELFCHECK: prove the LIVE GPU forward pass is correct ─────────────────────────
// Stamps each baked reference glyph and confirms the prediction, then (if the real
// MNIST test set is cached on disk) runs the entire live GPU pipeline over thousands
// of real test images and reports accuracy. ~98-99% means model + preprocessing are
// sound; far lower means the live inference path is broken.
if (SELFCHECK) {
  const be32 = (b: Uint8Array, off: number): number => ((b[off]! << 24) | (b[off + 1]! << 16) | (b[off + 2]! << 8) | b[off + 3]!) >>> 0;

  // (a) Reference-glyph sanity: each baked REF must classify to its label.
  let refOk = 0;
  let refTot = 0;
  for (const [labStr, ref] of Object.entries(refDigits)) {
    const lab = Number(labStr);
    for (let i = 0; i < N_IN; i += 1) inputGrid[i] = ref[i]!;
    const { argmax } = infer(true);
    refTot += 1;
    if (argmax === lab) refOk += 1;
    console.log(`  REF ${lab}: predicted ${argmax} ${argmax === lab ? 'OK' : 'MISMATCH'}`);
  }
  console.log(`SELFCHECK refs: ${refOk}/${refTot} correct`);

  // (b) Full live MNIST test accuracy (only if the dataset is present on disk).
  const mnistDir = `${import.meta.dir}/.mnist`;
  const imgPath = `${mnistDir}/t10k-images-idx3-ubyte`;
  const lblPath = `${mnistDir}/t10k-labels-idx1-ubyte`;
  const imgFile = Bun.file(imgPath);
  const lblFile = Bun.file(lblPath);
  if ((await imgFile.exists()) && (await lblFile.exists())) {
    const imgBytes = new Uint8Array(await imgFile.arrayBuffer());
    const lblBytes = new Uint8Array(await lblFile.arrayBuffer());
    if (be32(imgBytes, 0) === 0x803 && be32(lblBytes, 0) === 0x801) {
      const limit = process.env.SELFCHECK_LIMIT ? Number(process.env.SELFCHECK_LIMIT) : 2000;
      const n = Math.min(be32(imgBytes, 4), be32(lblBytes, 4), limit);
      console.log(`SELFCHECK: running ${n} live MNIST test images through the GPU pipeline...`);
      let correct = 0;
      const t0 = performance.now();
      for (let s = 0; s < n; s += 1) {
        const base = 16 + s * 784;
        // Raw MNIST 0..255 -> display canvas 0..1, then the EXACT live preprocessing.
        for (let i = 0; i < 784; i += 1) canvas[i] = imgBytes[base + i]! / 255;
        const ink = buildInput();
        const { argmax } = infer(ink);
        if (argmax === lblBytes[8 + s]!) correct += 1;
      }
      const acc = (correct / n) * 100;
      const dt = (performance.now() - t0) / 1000;
      console.log(`SELFCHECK_ACC ${acc.toFixed(2)}%  (${correct}/${n})  trained=${MNIST_TEST_ACC}%  in ${dt.toFixed(2)}s`);
    } else {
      console.log('SELFCHECK: MNIST test files present but header magic is wrong; skipping accuracy.');
    }
  } else {
    console.log('SELFCHECK: MNIST test set not cached (.mnist/t10k-*); ran reference check only.');
  }
  clearCanvas();
  cleanup(0);
}

// ── Render loop ─────────────────────────────────────────────────────────────────
const start = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
let frame = 0;
let fps = 0;
let fpsFrames = 0;
let fpsWindow = start;
let lastClear = false;
let lastRefKey = -1;
let shotTaken = false;
const VK_SPACE = 0x20;
const VK_C = 0x43;
const refKeys: Record<number, number> = { 0x31: 3, 0x32: 7, 0x33: 5, 0x34: 8 };

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;

  const now = performance.now();
  const time = (now - start) / 1000;

  if (!SELFCHECK) {
    const mouse = win.getMouse();
    if (mouse.down) stampBrush(mouse.x, mouse.y);
    const clearDown = win.keyDown(VK_SPACE) || win.keyDown(VK_C);
    if (clearDown && !lastClear) clearCanvas();
    lastClear = clearDown;
    // Reference-digit hotkeys (1..4).
    let pressedRef = -1;
    for (const k of Object.keys(refKeys)) {
      const vk = Number(k);
      if (win.keyDown(vk)) pressedRef = refKeys[vk]!;
    }
    if (pressedRef >= 0 && lastRefKey !== pressedRef) {
      clearCanvas();
      stampRef(pressedRef);
    }
    lastRefKey = pressedRef;
  }

  const hasInk = buildInput();
  const { argmax, conf } = infer(hasInk);

  // Compute a couple of HUD scalars.
  let second = 0;
  for (let o = 0; o < N_OUT; o += 1) if (o !== argmax && probsOut[o]! > second) second = probsOut[o]!;
  let entropy = 0;
  for (let o = 0; o < N_OUT; o += 1) {
    const p = probsOut[o]!;
    if (p > 1e-6) entropy -= p * Math.log(p);
  }

  // Upload display ink + probs + conv2 activations for the render PS.
  dispUpload.set(new Uint8Array(canvas.buffer, canvas.byteOffset, N_IN * 4));
  gpu.updateDynamicBuffer(dispBuf.buffer, dispUpload);
  probsUpload.set(new Uint8Array(probsOut.buffer, probsOut.byteOffset, N_OUT * 4));
  gpu.updateDynamicBuffer(probsSrvBuf.buffer, probsUpload);
  featUpload.set(new Uint8Array(featOut.buffer, featOut.byteOffset, A2_LEN * 4));
  gpu.updateDynamicBuffer(featSrvBuf.buffer, featUpload);

  // UI constant buffer.
  uiData.writeFloatLE(clientW, 0);
  uiData.writeFloatLE(clientH, 4);
  uiData.writeFloatLE(hasInk ? argmax : -1, 8);
  uiData.writeFloatLE(time, 12);
  uiData.writeFloatLE(canvasLeft, 16);
  uiData.writeFloatLE(canvasTop, 20);
  uiData.writeFloatLE(canvasSize, 24);
  uiData.writeFloatLE(conf, 28);
  uiData.writeFloatLE(featLeft, 32);
  uiData.writeFloatLE(featTop, 36);
  uiData.writeFloatLE(featTileSize, 40);
  uiData.writeFloatLE(featCols, 44);
  uiData.writeFloatLE(barLeft, 48);
  uiData.writeFloatLE(barTop, 52);
  uiData.writeFloatLE(barWidth, 56);
  uiData.writeFloatLE(barHeight, 60);
  uiData.writeFloatLE(hasInk ? 1 : 0, 64);
  uiData.writeFloatLE(featMax, 68);
  uiData.writeFloatLE(second, 72);
  uiData.writeFloatLE(entropy, 76);
  uiData.writeFloatLE(verdictCx, 80);
  uiData.writeFloatLE(verdictCy, 84);
  uiData.writeFloatLE(verdictR, 88);
  uiData.writeFloatLE(hasInk ? conf : 0, 92);
  gpu.updateConstantBuffer(uiCb, uiData);

  // Render the fullscreen UI.
  gpu.setRenderTargets([dev.backBufferRTV]);
  gpu.setViewport(clientW, clientH);
  gpu.clear(dev.backBufferRTV, [0.012, 0.016, 0.03, 1]);
  gpu.vsSet(vs);
  gpu.psSet(ps, { cb: [uiCb], srv: [dispBuf.srv!, probsSrvBuf.srv!, featSrvBuf.srv!] });
  gpu.drawFullscreenTriangle();
  gpu.psSet(ps, { srv: [0n, 0n, 0n] });

  drawHud(fps, argmax, conf, hasInk);

  // SELFSHOT: capture a well-developed frame (after fps settles) before present.
  if (SELFSHOT && !shotTaken && fps > 0 && frame > 40 && SELFSHOT_PATH) {
    captureBackBuffer(dev, SELFSHOT_PATH);
    console.log(`SELFSHOT_DONE ${SELFSHOT_PATH} argmax=${argmax} conf=${conf.toFixed(3)} probs=[${Array.from(probsOut, (p) => p.toFixed(2)).join(',')}]`);
    shotTaken = true;
  }

  dev.present(false);

  frame += 1;
  fpsFrames += 1;
  if (now - fpsWindow >= 500) {
    fps = Math.round((fpsFrames * 1000) / (now - fpsWindow));
    fpsFrames = 0;
    fpsWindow = now;
  }

  if (durationMs > 0 && now - start >= durationMs) break;
}

console.log(`Digit Oracle finished — ${frame} frames over ${((performance.now() - start) / 1000).toFixed(2)}s (${fps} fps).`);
cleanup(0);
