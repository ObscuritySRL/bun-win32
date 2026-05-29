/**
 * Digit Oracle — a neural network classifying your handwriting on the GPU, live, in pure TypeScript.
 *
 * A borderless fullscreen window shows a glowing 28x28 canvas: hold the LEFT mouse
 * button and paint a digit with a soft anti-aliased brush. Every frame the 784-pixel
 * canvas is fed through a real 784->128->10 multilayer perceptron — but the matrix
 * math runs on your GPU as three Direct3D 11 compute-shader passes (hidden GEMM+ReLU,
 * output GEMM, then a numerically-stable softmax), exactly the slime/galaxy UAV->SRV
 * multipass pattern. The 10 class probabilities are read back to the CPU and drive a
 * row of animated confidence bars; the winning class lights up. The network's ~102k
 * weights were trained OFFLINE (digit-oracle.train.ts, on synthetic GDI-rasterized
 * font glyphs, ~99% held-out accuracy) and baked into digit-oracle.weights.ts — the
 * demo itself touches no network and trains nothing at runtime. HLSL is JIT-compiled
 * at startup onto your real ID3D11Device. Press SPACE / C to clear, ESC to exit.
 *
 * Pipeline (per frame, off a PeekMessage pump):
 *   1. stamp the soft brush into a Float32Array(784) canvas (mouse) — or pre-stamped glyph
 *   2. center-of-mass recenter + normalize the canvas (MNIST-style) on the CPU
 *   3. updateDynamicBuffer(input) → csSet(hiddenCS, {cb, srv:[input,W1,b1], uav:[h1]}) → dispatch
 *   4. unbind → csSet(outCS, {srv:[h1,W2,b2], uav:[logits]}) → dispatch
 *   5. unbind → csSet(softmaxCS, {srv:[logits], uav:[probs]}) → dispatch(1)
 *   6. readbackBuffer(probs,40) → Float32Array(10)
 *   7. fullscreen PS draws the upscaled glowing canvas + 10 confidence bars → present
 *   8. GDI TextOutW HUD: predicted digit, confidence %, fps
 *
 * @bun-win32 / engine APIs (from ./_gpu): createWindow, createDevice, compile,
 *   makeComputeShader / makeVertexShader / makePixelShader, makeStructuredBuffer
 *   (SRV weights + UAV activations + cpuWritable input), makeConstantBuffer /
 *   updateConstantBuffer, updateDynamicBuffer, csSet / dispatch, readbackBuffer,
 *   vsSet / psSet / setRenderTargets / setViewport / clear / drawFullscreenTriangle,
 *   makeTexture / copyResource (self-check back-buffer readback), present,
 *   comRelease / blobRelease. GDI32 CreateFontW/TextOutW HUD.
 *
 * Run: bun run packages/all/example/digit-oracle.ts
 */
import { FFIType, read, type Pointer } from 'bun:ffi';

import { GDI32, User32 } from '../index';
import { SystemMetric } from '@bun-win32/user32';
import * as gpu from './_gpu';
import * as hud from './_hud';
import { N_IN, N_HID, N_OUT, WEIGHTS_B64, REF3_B64 } from './digit-oracle.weights';

const encodeWide = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');
const GRID = 28;
const SELFCHECK = process.env.SELFCHECK === '1';

// ── Window sized to fill the primary monitor (borderless) ─────────────────────
const screenW = User32.GetSystemMetrics(SystemMetric.SM_CXSCREEN) || 1920;
const screenH = User32.GetSystemMetrics(SystemMetric.SM_CYSCREEN) || 1080;
const WIN_H = Math.min(1000, Math.floor(screenH * 0.72));
const WIN_W = Math.min(Math.floor(screenW * 0.9), Math.round(WIN_H * 16 / 9));
const win = gpu.createWindow({ title: 'Digit Oracle — a neural net on the GPU, in pure TypeScript', width: WIN_W, height: WIN_H, borderless: true });
const { w: clientW, h: clientH } = win.clientSize();
const dev = gpu.createDevice(win.hwnd, { width: clientW, height: clientH });

console.log('Digit Oracle — a 784-128-10 MLP classifying handwriting on the GPU, in pure TypeScript.');
console.log(`  ${clientW}x${clientH} · ${dev.driver} · ${dev.gpuName}`);
console.log('  Hold LEFT MOUSE to draw a digit · SPACE/C to clear · ESC to exit.\n');

// ── Decode baked weights → layer Buffers (kept module-scope for the whole run) ──
const weights = new Float32Array(Buffer.from(WEIGHTS_B64, 'base64').buffer.slice(0));
// Layout: W1[N_IN*N_HID], b1[N_HID], W2[N_HID*N_OUT], b2[N_OUT].
const W1_LEN = N_IN * N_HID;
const W2_LEN = N_HID * N_OUT;
const W1f = weights.subarray(0, W1_LEN);
const b1f = weights.subarray(W1_LEN, W1_LEN + N_HID);
const W2f = weights.subarray(W1_LEN + N_HID, W1_LEN + N_HID + W2_LEN);
const b2f = weights.subarray(W1_LEN + N_HID + W2_LEN, W1_LEN + N_HID + W2_LEN + N_OUT);

function f32Buf(src: Float32Array): Buffer {
  return Buffer.from(src.buffer, src.byteOffset, src.byteLength);
}

// Weight/bias SRVs (seeded once via initialData) — long-lived.
const w1Buf = gpu.makeStructuredBuffer({ stride: 4, count: W1_LEN, srv: true, initialData: f32Buf(W1f) });
const b1Buf = gpu.makeStructuredBuffer({ stride: 4, count: N_HID, srv: true, initialData: f32Buf(b1f) });
const w2Buf = gpu.makeStructuredBuffer({ stride: 4, count: W2_LEN, srv: true, initialData: f32Buf(W2f) });
const b2Buf = gpu.makeStructuredBuffer({ stride: 4, count: N_OUT, srv: true, initialData: f32Buf(b2f) });

// Input activations (DYNAMIC, uploaded each frame) + intermediate UAVs.
const inBuf = gpu.makeStructuredBuffer({ stride: 4, count: N_IN, srv: true, cpuWritable: true });
const h1Buf = gpu.makeStructuredBuffer({ stride: 4, count: N_HID, uav: true, srv: true });
const logitsBuf = gpu.makeStructuredBuffer({ stride: 4, count: N_OUT, uav: true, srv: true });
const probsBuf = gpu.makeStructuredBuffer({ stride: 4, count: N_OUT, uav: true });

// ── HLSL forward-pass compute shaders ─────────────────────────────────────────
const DIMS_CB = `
cbuffer Dims : register(b0) {
  uint nIn; uint nHid; uint nOut; uint pad;
};
`;

// Pass 1: hidden layer. One thread per hidden neuron j: dot(input, W1[:,j]) + b1[j], ReLU.
// W1 is stored row-major [in][hid] so W1[i*nHid + j].
const HIDDEN_CS = `
${DIMS_CB}
StructuredBuffer<float> Input : register(t0);
StructuredBuffer<float> W1    : register(t1);
StructuredBuffer<float> B1    : register(t2);
RWStructuredBuffer<float> H1  : register(u0);

[numthreads(64,1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint j = id.x;
  if (j >= nHid) return;
  float acc = B1[j];
  [loop] for (uint i = 0; i < nIn; i++) acc += Input[i] * W1[i * nHid + j];
  H1[j] = max(acc, 0.0); // ReLU
}
`;

// Pass 2: output layer. One thread per output o: dot(h1, W2[:,o]) + b2[o]. W2 row-major [hid][out].
const OUTPUT_CS = `
${DIMS_CB}
StructuredBuffer<float> H1 : register(t0);
StructuredBuffer<float> W2 : register(t1);
StructuredBuffer<float> B2 : register(t2);
RWStructuredBuffer<float> Logits : register(u0);

[numthreads(16,1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint o = id.x;
  if (o >= nOut) return;
  float acc = B2[o];
  [loop] for (uint j = 0; j < nHid; j++) acc += H1[j] * W2[j * nOut + o];
  Logits[o] = acc;
}
`;

// Pass 3: numerically-stable softmax over the (small) logits, one group.
const SOFTMAX_CS = `
${DIMS_CB}
StructuredBuffer<float> Logits : register(t0);
RWStructuredBuffer<float> Probs : register(u0);

[numthreads(1,1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  float mx = -1e30;
  [loop] for (uint o = 0; o < nOut; o++) mx = max(mx, Logits[o]);
  float sum = 0.0;
  [loop] for (uint o2 = 0; o2 < nOut; o2++) sum += exp(Logits[o2] - mx);
  [loop] for (uint o3 = 0; o3 < nOut; o3++) Probs[o3] = exp(Logits[o3] - mx) / sum;
}
`;

// ── Render shaders ────────────────────────────────────────────────────────────
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

// Fullscreen PS: left ~58% = the glowing upscaled 28x28 canvas with a grid; right ~42%
// = ten labeled confidence bars, argmax highlighted. Canvas + probs come via buffers.
const PS_SRC = `
cbuffer UI : register(b0) {
  float4 gP;     // x=screenW, y=screenH, z=argmax, w=time
  float4 gSplit; // x=canvasLeft, y=canvasTop, z=canvasSize, w=barAreaLeft
};
StructuredBuffer<float> Canvas : register(t0); // 784 intensities
StructuredBuffer<float> Probs  : register(t1); // 10 probabilities

float3 heat(float t) {
  // Deep navy -> electric blue -> cyan -> white-hot.
  t = saturate(t);
  float3 c0 = float3(0.02, 0.03, 0.09);
  float3 c1 = float3(0.06, 0.22, 0.62);
  float3 c2 = float3(0.10, 0.70, 1.00);
  float3 c3 = float3(0.85, 0.98, 1.00);
  if (t < 0.4) return lerp(c0, c1, t / 0.4);
  if (t < 0.75) return lerp(c1, c2, (t - 0.4) / 0.35);
  return lerp(c2, c3, (t - 0.75) / 0.25);
}

float sampleCanvas(float2 g) {
  // Bilinear sample of the 28x28 grid in cell-space.
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

float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 px = fp.xy;
  float W = gP.x; float H = gP.y;
  int argmax = (int)gP.z;
  float t = gP.w;

  float3 col = float3(0.015, 0.02, 0.04); // base background

  // Subtle background vignette.
  float2 q = px / float2(W, H);
  float vig = pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.20);
  col *= lerp(0.55, 1.1, vig);

  // ── Canvas panel ──
  float cl = gSplit.x; float ct = gSplit.y; float cs = gSplit.z;
  if (px.x >= cl && px.x < cl + cs && px.y >= ct && px.y < ct + cs) {
    float2 inCanvas = (px - float2(cl, ct)) / cs;     // 0..1
    float2 g = inCanvas * 28.0;                        // cell space
    float v = sampleCanvas(g);
    // Soft glow: a few extra taps so strokes bloom.
    float glow = v;
    glow += sampleCanvas(g + float2(0.6, 0.0)) * 0.5;
    glow += sampleCanvas(g - float2(0.6, 0.0)) * 0.5;
    glow += sampleCanvas(g + float2(0.0, 0.6)) * 0.5;
    glow += sampleCanvas(g - float2(0.0, 0.6)) * 0.5;
    glow /= 3.0;
    float intensity = saturate(v * 1.15 + glow * 0.7);
    float3 ink = heat(intensity);
    // Faint cell grid lines.
    float2 cell = frac(g);
    float grid = step(0.96, cell.x) + step(0.96, cell.y);
    float3 panel = lerp(float3(0.03, 0.05, 0.10), ink, smoothstep(0.02, 0.25, intensity) + intensity);
    panel += grid * 0.025 * float3(0.3, 0.5, 0.8) * (1.0 - intensity);
    // Border frame.
    float2 e = min(inCanvas, 1.0 - inCanvas);
    float frame = smoothstep(0.0, 0.008, min(e.x, e.y));
    col = lerp(float3(0.18, 0.45, 0.85), panel, frame);
    return float4(col, 1.0);
  }

  // ── Confidence bars panel ──
  float barLeft = gSplit.w;
  float barRight = W - W * 0.04;
  float panelTop = H * 0.12;
  float panelBot = H * 0.92;
  if (px.x >= barLeft && px.x <= barRight && px.y >= panelTop && px.y <= panelBot) {
    float panelH = panelBot - panelTop;
    float rowH = panelH / 10.0;
    int row = (int)floor((px.y - panelTop) / rowH);
    row = clamp(row, 0, 9);
    float yInRow = (px.y - panelTop) - row * rowH;
    float barGap = rowH * 0.18;
    if (yInRow > barGap && yInRow < rowH - barGap) {
      float p = saturate(Probs[row]);
      float labelW = (barRight - barLeft) * 0.10;     // space for the digit label
      float trackLeft = barLeft + labelW;
      float trackW = barRight - trackLeft;
      float fillRight = trackLeft + trackW * p;
      bool isWin = (row == argmax);
      if (px.x >= trackLeft && px.x <= barRight) {
        if (px.x <= fillRight) {
          // Filled portion: winner glows hot, others cool blue.
          float grad = (px.x - trackLeft) / max(trackW, 1.0);
          float3 winCol = lerp(float3(0.2, 0.95, 0.7), float3(0.95, 1.0, 0.6), grad);
          float3 othCol = lerp(float3(0.10, 0.35, 0.75), float3(0.20, 0.65, 1.0), grad);
          float3 bar = isWin ? winCol : othCol;
          float pulse = isWin ? (0.85 + 0.15 * sin(t * 6.0)) : 1.0;
          col = bar * pulse;
        } else {
          col = float3(0.05, 0.07, 0.12); // empty track
        }
        return float4(col, 1.0);
      }
    }
  }

  return float4(col, 1.0);
}
`;

// ── Compile + create shaders ──────────────────────────────────────────────────
const hiddenCode = gpu.compile(HIDDEN_CS, 'main', 'cs_5_0');
const outputCode = gpu.compile(OUTPUT_CS, 'main', 'cs_5_0');
const softmaxCode = gpu.compile(SOFTMAX_CS, 'main', 'cs_5_0');
const vsCode = gpu.compile(VS_SRC, 'main', 'vs_5_0');
const psCode = gpu.compile(PS_SRC, 'main', 'ps_5_0');
const hiddenCS = gpu.makeComputeShader(hiddenCode);
const outputCS = gpu.makeComputeShader(outputCode);
const softmaxCS = gpu.makeComputeShader(softmaxCode);
const vs = gpu.makeVertexShader(vsCode);
const ps = gpu.makePixelShader(psCode);

// ── Constant buffers ──────────────────────────────────────────────────────────
const DIMS_SIZE = 16;
const dimsCb = gpu.makeConstantBuffer(DIMS_SIZE);
{
  const d = Buffer.alloc(DIMS_SIZE);
  d.writeUInt32LE(N_IN, 0);
  d.writeUInt32LE(N_HID, 4);
  d.writeUInt32LE(N_OUT, 8);
  d.writeUInt32LE(0, 12);
  gpu.updateConstantBuffer(dimsCb, d);
}
const UI_SIZE = 32;
const uiCb = gpu.makeConstantBuffer(UI_SIZE);
const uiData = Buffer.alloc(UI_SIZE);

// ── Canvas state ───────────────────────────────────────────────────────────────
const canvas = new Float32Array(N_IN); // 28x28 painted intensities, raw
const inputGrid = new Float32Array(N_IN); // recentered/normalized, uploaded each frame
const inUpload = Buffer.alloc(N_IN * 4);

// Canvas panel geometry (square, left side).
const canvasSize = Math.min(clientH * 0.74, clientW * 0.5);
const canvasLeft = clientW * 0.06;
const canvasTop = (clientH - canvasSize) / 2;
const barAreaLeft = canvasLeft + canvasSize + clientW * 0.06;

function clearCanvas(): void {
  canvas.fill(0);
}

// Stamp a soft gaussian brush into the 28x28 grid at screen-space (sx,sy).
function stampBrush(sx: number, sy: number): void {
  // Map screen -> canvas cell coords.
  const gx = ((sx - canvasLeft) / canvasSize) * 28;
  const gy = ((sy - canvasTop) / canvasSize) * 28;
  if (gx < -2 || gy < -2 || gx > 30 || gy > 30) return;
  const radius = 1.0; // cells — ~2-cell stroke, MNIST-like (was 1.6 = too fat)
  const r2 = radius * radius;
  const lo = Math.max(0, Math.floor(gx - radius - 1));
  const hi = Math.min(27, Math.ceil(gx + radius + 1));
  const loy = Math.max(0, Math.floor(gy - radius - 1));
  const hiy = Math.min(27, Math.ceil(gy + radius + 1));
  for (let y = loy; y <= hiy; y += 1) {
    for (let x = lo; x <= hi; x += 1) {
      const dx = x + 0.5 - gx;
      const dy = y + 0.5 - gy;
      const d2 = dx * dx + dy * dy;
      const v = Math.exp(-d2 / (2 * r2 * 0.5));
      const i = y * 28 + x;
      canvas[i] = Math.min(1, canvas[i]! + v * 0.55);
    }
  }
}

// Center-of-mass recenter + normalize the raw canvas into inputGrid (MNIST-style).
function buildInput(): boolean {
  let sum = 0;
  let cx = 0;
  let cy = 0;
  let mx = 0;
  for (let y = 0; y < 28; y += 1) {
    for (let x = 0; x < 28; x += 1) {
      const v = canvas[y * 28 + x]!;
      sum += v;
      cx += x * v;
      cy += y * v;
      if (v > mx) mx = v;
    }
  }
  inputGrid.fill(0);
  if (sum < 0.5 || mx < 1e-3) return false; // empty canvas
  cx /= sum;
  cy /= sum;
  const dx = Math.round(13.5 - cx);
  const dy = Math.round(13.5 - cy);
  const norm = 1 / mx;
  for (let y = 0; y < 28; y += 1) {
    for (let x = 0; x < 28; x += 1) {
      const sx2 = x - dx;
      const sy2 = y - dy;
      if (sx2 >= 0 && sx2 < 28 && sy2 >= 0 && sy2 < 28) inputGrid[y * 28 + x] = Math.min(1, canvas[sy2 * 28 + sx2]! * norm);
    }
  }
  return true;
}

// ── GPU forward pass: 3 compute dispatches + readback of the 10 probs ───────────
const emptyBind = Buffer.alloc(8); // a single null pointer for unbinding
const probsOut = new Float32Array(N_OUT);

function unbindCs(): void {
  // Drop the UAV + SRVs bound to the compute stage so the next pass can rebind.
  gpu.csSet(0n, { uav: [0n] });
  vcallClearSrv(3);
}
function vcallClearSrv(count: number): void {
  const arr = Buffer.alloc(8 * count); // all null
  gpu.vcall(dev.context, gpu.CTX_CS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, count, arr.ptr!], FFIType.void);
}

function infer(hasInk: boolean): { argmax: number; conf: number } {
  if (!hasInk) {
    probsOut.fill(0);
    return { argmax: -1, conf: 0 };
  }
  // Upload the (already-built) input grid immediately before dispatch (no await).
  inUpload.set(new Uint8Array(inputGrid.buffer, inputGrid.byteOffset, N_IN * 4));
  gpu.updateDynamicBuffer(inBuf.buffer, inUpload);

  // Pass 1: hidden GEMM + ReLU.
  gpu.csSet(hiddenCS, { cb: [dimsCb], srv: [inBuf.srv!, w1Buf.srv!, b1Buf.srv!], uav: [h1Buf.uav!] });
  gpu.dispatch(Math.ceil(N_HID / 64), 1, 1);
  unbindCs();

  // Pass 2: output GEMM.
  gpu.csSet(outputCS, { cb: [dimsCb], srv: [h1Buf.srv!, w2Buf.srv!, b2Buf.srv!], uav: [logitsBuf.uav!] });
  gpu.dispatch(1, 1, 1);
  unbindCs();

  // Pass 3: softmax.
  gpu.csSet(softmaxCS, { cb: [dimsCb], srv: [logitsBuf.srv!], uav: [probsBuf.uav!] });
  gpu.dispatch(1, 1, 1);
  unbindCs();

  // Read back the 10 probabilities.
  const ab = gpu.readbackBuffer(probsBuf.buffer, N_OUT * 4);
  probsOut.set(new Float32Array(ab));
  let am = 0;
  for (let o = 1; o < N_OUT; o += 1) if (probsOut[o]! > probsOut[am]!) am = o;
  return { argmax: am, conf: probsOut[am]! };
}

// Upload the live canvas (raw, 0..1) into the Canvas SRV for the render PS. Reuses a
// separate display buffer so we show the unrecentered strokes the user actually drew.
const dispBuf = gpu.makeStructuredBuffer({ stride: 4, count: N_IN, srv: true, cpuWritable: true });
const dispUpload = Buffer.alloc(N_IN * 4);
// Probs SRV for the render PS (read-only copy of the latest probabilities).
const probsSrvBuf = gpu.makeStructuredBuffer({ stride: 4, count: N_OUT, srv: true, cpuWritable: true });
const probsUpload = Buffer.alloc(N_OUT * 4);

// ── Pre-stamp the baked reference '3' so an unattended screenshot is meaningful ──
{
  const ref3 = new Float32Array(Buffer.from(REF3_B64, 'base64').buffer.slice(0));
  for (let i = 0; i < N_IN; i += 1) canvas[i] = ref3[i]!;
}

// ── GDI HUD ─────────────────────────────────────────────────────────────────────
const hudFont = GDI32.CreateFontW(-22, 0, 0, 0, 700, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);
const bigFont = GDI32.CreateFontW(-Math.round(clientH * 0.14), 0, 0, 0, 800, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Segoe UI').ptr!);
const labelFont = GDI32.CreateFontW(-Math.round(Math.min(clientH * 0.045, 40)), 0, 0, 0, 700, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);
const TRANSPARENT_BK = 1;

function drawHud(fps: number, argmax: number, conf: number, hasInk: boolean): void {
  hud.draw(dev, clientW, clientH, (dc) => {
  GDI32.SetBkMode(dc, TRANSPARENT_BK);

  // Title / status line.
  const prevFont = GDI32.SelectObject(dc, hudFont);
  const line = `Digit Oracle · 784-128-10 MLP on the GPU · ${fps} fps · ${dev.gpuName} · draw with LMB · SPACE clears · ESC`;
  const text = encodeWide(line);
  GDI32.SetTextColor(dc, 0x00100804);
  GDI32.TextOutW(dc, 19, 19, text.ptr!, line.length);
  GDI32.SetTextColor(dc, 0x00f0d8b0);
  GDI32.TextOutW(dc, 18, 18, text.ptr!, line.length);

  // Big prediction digit above the canvas.
  GDI32.SelectObject(dc, bigFont);
  const predX = Math.round(canvasLeft);
  const predY = Math.round(canvasTop - clientH * 0.16);
  if (hasInk && argmax >= 0) {
    const ds = String(argmax);
    const dt = encodeWide(ds);
    GDI32.SetTextColor(dc, 0x00203010);
    GDI32.TextOutW(dc, predX + 3, predY + 3, dt.ptr!, ds.length);
    GDI32.SetTextColor(dc, 0x0060ffd0);
    GDI32.TextOutW(dc, predX, predY, dt.ptr!, ds.length);
    // Confidence next to it.
    GDI32.SelectObject(dc, hudFont);
    const cstr = `${(conf * 100).toFixed(1)}% confident`;
    const ct2 = encodeWide(cstr);
    GDI32.SetTextColor(dc, 0x00c0e0f0);
    GDI32.TextOutW(dc, predX + Math.round(clientH * 0.12), predY + Math.round(clientH * 0.06), ct2.ptr!, cstr.length);
  } else {
    GDI32.SelectObject(dc, hudFont);
    const hint = 'draw a digit (0-9)';
    const ht = encodeWide(hint);
    GDI32.SetTextColor(dc, 0x00708090);
    GDI32.TextOutW(dc, predX, predY + Math.round(clientH * 0.07), ht.ptr!, hint.length);
  }

  // Digit labels next to each confidence bar.
  GDI32.SelectObject(dc, labelFont);
  const panelTop = clientH * 0.12;
  const panelBot = clientH * 0.92;
  const rowH = (panelBot - panelTop) / 10;
  for (let d = 0; d < 10; d += 1) {
    const ds = String(d);
    const dt = encodeWide(ds);
    const ly = Math.round(panelTop + d * rowH + rowH * 0.12);
    const isWin = hasInk && d === argmax;
    GDI32.SetTextColor(dc, isWin ? 0x0080ffd0 : 0x00b0b8c0);
    GDI32.TextOutW(dc, Math.round(barAreaLeft + 6), ly, dt.ptr!, ds.length);
    // Percentage at the right edge of each bar.
    const pstr = `${(Math.min(1, probsOut[d]!) * 100).toFixed(0)}%`;
    const pt = encodeWide(pstr);
    GDI32.SetTextColor(dc, isWin ? 0x0080ffd0 : 0x008090a0);
    GDI32.TextOutW(dc, Math.round(clientW - clientW * 0.055), ly, pt.ptr!, pstr.length);
  }

  GDI32.SelectObject(dc, prevFont);
  });
}

// ── Teardown ──────────────────────────────────────────────────────────────────
let cleaned = false;
function cleanup(code: number): never {
  if (!cleaned) {
    cleaned = true;
    try {
      gpu.csSet(0n, { uav: [0n] });
      gpu.setRenderTargets([]);
      hud.release();
      GDI32.DeleteObject(hudFont);
      GDI32.DeleteObject(bigFont);
      GDI32.DeleteObject(labelFont);
      for (const b of [w1Buf, b1Buf, w2Buf, b2Buf, inBuf, h1Buf, logitsBuf, probsBuf, dispBuf, probsSrvBuf]) {
        gpu.comRelease(b.srv ?? 0n);
        gpu.comRelease(b.uav ?? 0n);
        gpu.comRelease(b.buffer);
      }
      gpu.comRelease(dimsCb);
      gpu.comRelease(uiCb);
      gpu.comRelease(ps);
      gpu.comRelease(vs);
      gpu.comRelease(softmaxCS);
      gpu.comRelease(outputCS);
      gpu.comRelease(hiddenCS);
      gpu.blobRelease(psCode.blob);
      gpu.blobRelease(vsCode.blob);
      gpu.blobRelease(softmaxCode.blob);
      gpu.blobRelease(outputCode.blob);
      gpu.blobRelease(hiddenCode.blob);
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

// ── Self-check: back-buffer pixel stats (Route B) ───────────────────────────────
const IID_ID3D11TEXTURE2D = '6f15aaf2-d208-4e89-9ab4-489535d34f9c';
function guid(value: string): Buffer {
  const hex = value.replace(/-/g, '');
  const b = Buffer.alloc(16);
  b.writeUInt32LE(parseInt(hex.slice(0, 8), 16), 0);
  b.writeUInt16LE(parseInt(hex.slice(8, 12), 16), 4);
  b.writeUInt16LE(parseInt(hex.slice(12, 16), 16), 6);
  for (let i = 0; i < 8; i += 1) b.writeUInt8(parseInt(hex.slice(16 + i * 2, 18 + i * 2), 16), 8 + i);
  return b;
}

function selfCheckBackBuffer(argmax: number): void {
  const ppBack = Buffer.alloc(8);
  const iid = guid(IID_ID3D11TEXTURE2D);
  if (gpu.vcall(dev.swapChain, gpu.SWAP_GET_BUFFER, [FFIType.u32, FFIType.ptr, FFIType.ptr], [0, iid.ptr!, ppBack.ptr!]) !== 0) {
    console.log('SELFCHECK_STATS ' + JSON.stringify({ error: 'GetBuffer failed' }));
    return;
  }
  const backTex = ppBack.readBigUInt64LE(0);
  const staging = gpu.makeTexture({ w: clientW, h: clientH, format: gpu.DXGI_FORMAT_B8G8R8A8_UNORM, staging: true });
  gpu.copyResource(staging.tex, backTex);
  const mapped = Buffer.alloc(16);
  const stats: Record<string, unknown> = {};
  if (gpu.vcall(dev.context, gpu.CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [staging.tex, 0, 1 /* READ */, 0, mapped.ptr!]) === 0) {
    const dataPtr = Number(mapped.readBigUInt64LE(0)) as Pointer;
    const rowPitch = mapped.readUInt32LE(8);
    // Sample a coarse grid of pixels for global stats + region stats.
    const step = 4;
    let nonBlack = 0;
    let total = 0;
    let lumaSum = 0;
    const buckets = new Set<number>();
    // 8x8 grid-cell luma variance (structure probe).
    const cellLuma = new Float64Array(64);
    const cellCount = new Float64Array(64);
    // Canvas-region ink count + per-bar-row colored pixel run (winner-longest probe).
    let canvasInk = 0;
    const barRowColored = new Array<number>(10).fill(0);
    const panelTop = clientH * 0.12;
    const panelBot = clientH * 0.92;
    const rowH = (panelBot - panelTop) / 10;
    for (let y = 0; y < clientH; y += step) {
      for (let x = 0; x < clientW; x += step) {
        const off = y * rowPitch + x * 4;
        const bch = read.u8(dataPtr, off);
        const gch = read.u8(dataPtr, off + 1);
        const rch = read.u8(dataPtr, off + 2);
        const luma = 0.299 * rch + 0.587 * gch + 0.114 * bch;
        total += 1;
        lumaSum += luma;
        if (rch + gch + bch > 36) nonBlack += 1;
        buckets.add((rch >> 5 << 6) | (gch >> 5 << 3) | (bch >> 5));
        const cellX = Math.min(7, Math.floor((x / clientW) * 8));
        const cellY = Math.min(7, Math.floor((y / clientH) * 8));
        const ci = cellY * 8 + cellX;
        cellLuma[ci] += luma;
        cellCount[ci] += 1;
        // Canvas region ink.
        if (x >= canvasLeft && x < canvasLeft + canvasSize && y >= canvasTop && y < canvasTop + canvasSize) {
          if (rch + gch + bch > 80) canvasInk += 1;
        }
        // Bar region colored fill (skip dark empty track).
        if (x >= barAreaLeft && x < clientW - clientW * 0.04 && y >= panelTop && y < panelBot) {
          const row = Math.min(9, Math.floor((y - panelTop) / rowH));
          if (rch + gch + bch > 120) barRowColored[row]! += 1;
        }
      }
    }
    gpu.vcall(dev.context, gpu.CTX_UNMAP, [FFIType.u64, FFIType.u32], [staging.tex, 0], FFIType.void);
    // Grid-cell luma variance proving structure (not flat fill / not uniform noise).
    const cellMeans: number[] = [];
    for (let i = 0; i < 64; i += 1) cellMeans.push(cellCount[i]! > 0 ? cellLuma[i]! / cellCount[i]! : 0);
    const gm = cellMeans.reduce((a, b) => a + b, 0) / 64;
    const gridVar = cellMeans.reduce((a, b) => a + (b - gm) * (b - gm), 0) / 64;
    // Which bar row had the most colored fill?
    let widestRow = 0;
    for (let r = 1; r < 10; r += 1) if (barRowColored[r]! > barRowColored[widestRow]!) widestRow = r;
    stats.nonBlackPct = +((100 * nonBlack) / total).toFixed(2);
    stats.distinctColorBuckets = buckets.size;
    stats.meanLuma = +(lumaSum / total).toFixed(2);
    stats.gridCellLumaVar = +gridVar.toFixed(2);
    stats.canvasInkSamples = canvasInk;
    stats.widestBarRow = widestRow;
    stats.predictedArgmax = argmax;
    stats.barRowColored = barRowColored;
  } else {
    stats.error = 'Map failed';
  }
  gpu.comRelease(staging.tex);
  gpu.comRelease(backTex);
  console.log('SELFCHECK_STATS ' + JSON.stringify(stats));
}

// ── Render loop ───────────────────────────────────────────────────────────────
const start = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
let frame = 0;
let fps = 0;
let fpsFrames = 0;
let fpsWindow = start;
let lastClearDown = false;
const VK_SPACE = 0x20;
const VK_C = 0x43;
let selfCheckArgmax = -1;

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;

  const now = performance.now();
  const time = (now - start) / 1000;

  // Input: paint with LMB; SPACE/C clears (debounced). In SELFCHECK we keep the
  // pre-stamped reference glyph and never accept drawing.
  if (!SELFCHECK) {
    const mouse = win.getMouse();
    if (mouse.down) stampBrush(mouse.x, mouse.y);
    const clearDown = win.keyDown(VK_SPACE) || win.keyDown(VK_C);
    if (clearDown && !lastClearDown) clearCanvas();
    lastClearDown = clearDown;
  }

  // CPU prep: recenter/normalize → GPU forward pass → readback.
  const hasInk = buildInput();
  const { argmax, conf } = infer(hasInk);
  selfCheckArgmax = argmax;

  // Upload the display canvas + probs for the render PS (immediately before draw).
  dispUpload.set(new Uint8Array(canvas.buffer, canvas.byteOffset, N_IN * 4));
  gpu.updateDynamicBuffer(dispBuf.buffer, dispUpload);
  probsUpload.set(new Uint8Array(probsOut.buffer, probsOut.byteOffset, N_OUT * 4));
  gpu.updateDynamicBuffer(probsSrvBuf.buffer, probsUpload);

  // UI constant buffer.
  uiData.writeFloatLE(clientW, 0);
  uiData.writeFloatLE(clientH, 4);
  uiData.writeFloatLE(hasInk ? argmax : -1, 8);
  uiData.writeFloatLE(time, 12);
  uiData.writeFloatLE(canvasLeft, 16);
  uiData.writeFloatLE(canvasTop, 20);
  uiData.writeFloatLE(canvasSize, 24);
  uiData.writeFloatLE(barAreaLeft, 28);
  gpu.updateConstantBuffer(uiCb, uiData);

  // Render the fullscreen UI.
  gpu.setRenderTargets([dev.backBufferRTV]);
  gpu.setViewport(clientW, clientH);
  gpu.clear(dev.backBufferRTV, [0.012, 0.016, 0.03, 1]);
  gpu.vsSet(vs);
  gpu.psSet(ps, { cb: [uiCb], srv: [dispBuf.srv!, probsSrvBuf.srv!] });
  gpu.drawFullscreenTriangle();
  // Unbind PS SRVs so the dynamic buffers can be Map-discarded next frame.
  gpu.psSet(ps, { srv: [0n, 0n] });

  drawHud(fps, argmax, conf, hasInk);
  dev.present(false);

  frame += 1;
  fpsFrames += 1;
  if (now - fpsWindow >= 500) {
    fps = Math.round((fpsFrames * 1000) / (now - fpsWindow));
    fpsFrames = 0;
    fpsWindow = now;
  }

  // SELFCHECK: after ~80 frames, verify the inference output then read back pixels.
  if (SELFCHECK && frame === 80) {
    console.log('SELFCHECK_INFER ' + JSON.stringify({ argmax, conf: +conf.toFixed(4), probs: Array.from(probsOut, (p) => +p.toFixed(4)) }));
    selfCheckBackBuffer(argmax);
    break;
  }

  if (durationMs > 0 && now - start >= durationMs) {
    if (SELFCHECK) {
      console.log('SELFCHECK_INFER ' + JSON.stringify({ argmax: selfCheckArgmax, conf: +conf.toFixed(4), probs: Array.from(probsOut, (p) => +p.toFixed(4)) }));
      selfCheckBackBuffer(selfCheckArgmax);
    }
    break;
  }
}

console.log(`Digit Oracle finished — ${frame} frames over ${((performance.now() - start) / 1000).toFixed(2)}s (${fps} fps).`);
cleanup(0);
