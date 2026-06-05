/**
 * nano-gpt — a real char-level transformer generating text live on your GPU, in pure TypeScript.
 *
 * A borderless fullscreen window streams text from a genuine decoder-only transformer
 * (token+position embeddings, 3 blocks of pre-norm multi-head causal self-attention +
 * GELU MLP, final LayerNorm, logit head — 111,606 trained parameters). The ENTIRE
 * forward pass runs as Direct3D 11 compute shaders (the slime/galaxy UAV->SRV multipass
 * pattern): embed, then per layer { LayerNorm, Q/K/V GEMM, scaled causal-softmax
 * attention, output GEMM + residual, LayerNorm, MLP up + GELU, MLP down + residual },
 * a final LayerNorm and a logit GEMM over the last position. Weights are flat
 * StructuredBuffer<float> with explicit W[row*K+col] indexing — no cbuffer matrices,
 * so no column-major trap. Each step the 54 logits of the last token are read back,
 * temperature/top-k sampled on the CPU, the char is appended, and the WHOLE frame is
 * GPU-composited: a glowing animated backdrop, the streaming generated text rendered as
 * a phosphor terminal from a GDI-rasterized glyph atlas sampled in the pixel shader
 * (left ~60%), a big live causal-attention heatmap (right), a column of per-token
 * probability bars for the latest sampling step, and a blinking caret. The model was
 * trained OFFLINE (nano-gpt.train.ts) on a self-generated structured log corpus; the
 * demo trains nothing and JIT-compiles HLSL at startup onto your real GPU.
 *
 * Per generated token (decode step):
 *   1. build the token-id constant buffer (context ids + length) immediately before dispatch
 *   2. embed -> per-layer compute passes -> final LN -> logits GEMM (last row only)
 *   3. readbackBuffer the 54 logits, temperature + top-k sample, append the char
 *   4. upload visible-text glyph grid + attention snapshot + top-k probs, GPU-composite, present
 *
 * @bun-win32 / engine APIs (from ./_gpu): createWindow, createDevice, compile,
 *   makeComputeShader/VertexShader/PixelShader, makeStructuredBuffer (SRV weights +
 *   UAV/SRV activations + cpuWritable grids), makeConstantBuffer/updateConstantBuffer,
 *   updateDynamicBuffer, csSet/dispatch, readbackBuffer, makeTexture/makeSampler,
 *   vcall (UpdateSubresource for the glyph atlas), vsSet/psSet/setRenderTargets/
 *   setViewport/clear/drawFullscreenTriangle, present, comRelease/blobRelease. GDI32
 *   CreateDIBSection/CreateFontW rasterizes the font atlas + draws the HUD title.
 *
 * Run: bun run packages/all/example/nano-gpt.ts
 */
import { FFIType, read, type Pointer } from 'bun:ffi';

import { GDI32, User32 } from '../index';
import { SystemMetric } from '@bun-win32/user32';
import * as gpu from './_gpu';
import * as hud from './_hud';
import { captureBackBuffer, formatGrid } from './_snapshot';
import { V, T, D, NH, NL, DFF, VOCAB, WEIGHTS_B64 } from './nano-gpt.weights';

const encodeWide = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');
const SELFCHECK = process.env.SELFCHECK === '1';
const SELFSHOT = process.env.SELFSHOT === '1';
const HD = (D / NH) | 0; // head dim

// ── A modest borderless window scaled to the monitor (not the whole desktop) ──
const screenW = User32.GetSystemMetrics(SystemMetric.SM_CXSCREEN) || 1920;
const screenH = User32.GetSystemMetrics(SystemMetric.SM_CYSCREEN) || 1080;
// nano-gpt's terminal+heatmap layout reads best WIDE, so this is a wide modest window.
const HEIGHT = Math.min(720, Math.floor(screenH * 0.5));
const WIDTH = Math.min(Math.floor(screenW * 0.92), Math.round(HEIGHT * 2.7));
const win = gpu.createWindow({ title: 'nano-gpt — a transformer generating text on the GPU, in pure TypeScript', width: WIDTH, height: HEIGHT, borderless: true });
const { w: clientW, h: clientH } = win.clientSize();
const dev = gpu.createDevice(win.hwnd, { width: clientW, height: clientH });

console.log('nano-gpt — a 111,606-param char transformer generating text on the GPU, in pure TypeScript.');
console.log(`  ${clientW}x${clientH} · ${dev.driver} · ${dev.gpuName} · V=${V} D=${D} NH=${NH} NL=${NL} T=${T}`);
console.log('  Watch it stream · ESC to exit.\n');

// ── Decode baked weights into named, offset slices (all long-lived) ──────────────
const W = new Float32Array(Buffer.from(WEIGHTS_B64, 'base64').buffer.slice(0));
let woff = 0;
const take = (n: number): Float32Array => {
  const s = W.subarray(woff, woff + n);
  woff += n;
  return s;
};
const wte = take(V * D);
const wpe = take(T * D);
interface LW {
  ln1g: Float32Array;
  ln1b: Float32Array;
  wq: Float32Array;
  bq: Float32Array;
  wk: Float32Array;
  bk: Float32Array;
  wv: Float32Array;
  bv: Float32Array;
  wo: Float32Array;
  bo: Float32Array;
  ln2g: Float32Array;
  ln2b: Float32Array;
  w1: Float32Array;
  b1: Float32Array;
  w2: Float32Array;
  b2: Float32Array;
}
const LWs: LW[] = [];
for (let l = 0; l < NL; l += 1) {
  LWs.push({
    ln1g: take(D),
    ln1b: take(D),
    wq: take(D * D),
    bq: take(D),
    wk: take(D * D),
    bk: take(D),
    wv: take(D * D),
    bv: take(D),
    wo: take(D * D),
    bo: take(D),
    ln2g: take(D),
    ln2b: take(D),
    w1: take(D * DFF),
    b1: take(DFF),
    w2: take(DFF * D),
    b2: take(D),
  });
}
const lnfg = take(D);
const lnfb = take(D);
const wout = take(D * V);
const bout = take(V);

const f32 = (s: Float32Array): Buffer => Buffer.from(s.buffer, s.byteOffset, s.byteLength);
const SB = (s: Float32Array): gpu.StructuredBuffer => gpu.makeStructuredBuffer({ stride: 4, count: s.length, srv: true, initialData: f32(s) });

// ── Weight SRVs (seeded once) ─────────────────────────────────────────────────
const wteB = SB(wte);
const wpeB = SB(wpe);
const lwB = LWs.map((L) => ({
  ln1g: SB(L.ln1g),
  ln1b: SB(L.ln1b),
  wq: SB(L.wq),
  bq: SB(L.bq),
  wk: SB(L.wk),
  bk: SB(L.bk),
  wv: SB(L.wv),
  bv: SB(L.bv),
  wo: SB(L.wo),
  bo: SB(L.bo),
  ln2g: SB(L.ln2g),
  ln2b: SB(L.ln2b),
  w1: SB(L.w1),
  b1: SB(L.b1),
  w2: SB(L.w2),
  b2: SB(L.b2),
}));
const lnfgB = SB(lnfg);
const lnfbB = SB(lnfb);
const woutB = SB(wout);
const boutB = SB(bout);

// ── Activation buffers (UAV+SRV; reused every layer/token) ───────────────────────
const mkA = (count: number): gpu.StructuredBuffer => gpu.makeStructuredBuffer({ stride: 4, count, uav: true, srv: true });
const xBuf = mkA(T * D); // residual stream (ping target a)
const xBuf2 = mkA(T * D); // residual stream (ping target b)
const normBuf = mkA(T * D); // LayerNorm output
const qBuf = mkA(T * D);
const kBuf = mkA(T * D);
const vBuf = mkA(T * D);
const attBuf = mkA(NH * T * T); // attention weights
const aoBuf = mkA(T * D); // attention output (pre-proj)
const tmpBuf = mkA(T * D); // generic temp (matmul outputs / residual scratch)
const hBuf = mkA(T * DFF); // MLP hidden
const logitsBuf = mkA(V); // final logits (last row)

// idsBuf: token ids (uint), uploaded each step. Dynamic.
const idsBuf = gpu.makeStructuredBuffer({ stride: 4, count: T, srv: true, cpuWritable: true });

// ── Constant buffer: { uint S, pad,pad,pad } (current sequence length) ───────────
const cfgCb = gpu.makeConstantBuffer(16);
const cfgData = Buffer.alloc(16);

// ── HLSL (compute) ─────────────────────────────────────────────────────────────
const CFG = `cbuffer Cfg : register(b0) { uint gS; uint gP0; uint gP1; uint gP2; };`;
const DIMS = `static const uint V=${V}u, T=${T}u, D=${D}u, NH=${NH}u, HD=${HD}u, DFF=${DFF}u;`;

// Embed: out[i*D+d] = wte[ids[i]*D+d] + wpe[i*D+d]. One thread per (row,d).
const EMBED_CS = `
${CFG}
${DIMS}
StructuredBuffer<uint> Ids : register(t0);
StructuredBuffer<float> Wte : register(t1);
StructuredBuffer<float> Wpe : register(t2);
RWStructuredBuffer<float> Out : register(u0);
[numthreads(64,1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint i = id.y; uint d = id.x;
  if (i >= gS || d >= D) return;
  uint tok = Ids[i];
  Out[i*D+d] = Wte[tok*D+d] + Wpe[i*D+d];
}
`;

// LayerNorm: one thread per row, serial reduce over D. Out = norm*g + b.
const LN_CS = `
${CFG}
${DIMS}
StructuredBuffer<float> X : register(t0);
StructuredBuffer<float> G : register(t1);
StructuredBuffer<float> B : register(t2);
RWStructuredBuffer<float> Out : register(u0);
[numthreads(64,1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint i = id.x;
  if (i >= gS) return;
  float m = 0.0;
  [loop] for (uint d=0; d<D; d++) m += X[i*D+d];
  m /= float(D);
  float varc = 0.0;
  [loop] for (uint d2=0; d2<D; d2++) { float z = X[i*D+d2]-m; varc += z*z; }
  varc /= float(D);
  float rs = rsqrt(varc + 1e-5);
  [loop] for (uint d3=0; d3<D; d3++) Out[i*D+d3] = (X[i*D+d3]-m)*rs*G[d3] + B[d3];
}
`;

// GEMM + bias: Out[i*N+n] = b[n] + sum_k X[i*K+k]*Wt[k*N+n]. K,N as consts.
function gemmSrc(K: number, N: number): string {
  return `
${CFG}
${DIMS}
StructuredBuffer<float> X  : register(t0);
StructuredBuffer<float> Wt : register(t1);
StructuredBuffer<float> Bs : register(t2);
RWStructuredBuffer<float> Out : register(u0);
static const uint GK=${K}u, GN=${N}u;
[numthreads(16,16,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint i = id.y; uint n = id.x;
  if (i >= gS || n >= GN) return;
  float acc = Bs[n];
  [loop] for (uint k=0; k<GK; k++) acc += X[i*GK+k]*Wt[k*GN+n];
  Out[i*GN+n] = acc;
}
`;
}

// Causal multi-head attention: one thread per (head,query-row). Serial online softmax
// over keys j<=i, then weighted value sum. Writes ao[i*D + h*HD + d] and att weights.
const ATTN_CS = `
${CFG}
${DIMS}
StructuredBuffer<float> Q : register(t0);
StructuredBuffer<float> K : register(t1);
StructuredBuffer<float> Vv : register(t2);
RWStructuredBuffer<float> Att : register(u0);
RWStructuredBuffer<float> Ao  : register(u1);
[numthreads(16,8,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint h = id.y; uint i = id.x;
  if (h >= NH || i >= gS) return;
  uint ho = h*HD;
  float scale = rsqrt(float(HD));
  float mx = -1e30;
  [loop] for (uint j=0; j<=i; j++) {
    float dot = 0.0;
    [loop] for (uint d=0; d<HD; d++) dot += Q[i*D+ho+d]*K[j*D+ho+d];
    dot *= scale;
    Att[h*T*T + i*T + j] = dot;
    if (dot > mx) mx = dot;
  }
  float sum = 0.0;
  [loop] for (uint j2=0; j2<=i; j2++) {
    float e = exp(Att[h*T*T + i*T + j2] - mx);
    Att[h*T*T + i*T + j2] = e;
    sum += e;
  }
  float ainv = 1.0 / sum;
  [loop] for (uint d2=0; d2<HD; d2++) {
    float acc = 0.0;
    [loop] for (uint j3=0; j3<=i; j3++) acc += (Att[h*T*T + i*T + j3]*ainv) * Vv[j3*D+ho+d2];
    Ao[i*D+ho+d2] = acc;
  }
  [loop] for (uint j4=0; j4<=i; j4++) Att[h*T*T + i*T + j4] *= ainv;
}
`;

// Residual add: Out[idx] = A[idx] + B[idx].
function addSrc(width: number): string {
  return `
${CFG}
${DIMS}
StructuredBuffer<float> A : register(t0);
StructuredBuffer<float> B : register(t1);
RWStructuredBuffer<float> Out : register(u0);
static const uint Wd=${width}u;
[numthreads(64,1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint i = id.y; uint c = id.x;
  if (i >= gS || c >= Wd) return;
  Out[i*Wd+c] = A[i*Wd+c] + B[i*Wd+c];
}
`;
}

// GELU elementwise over the MLP hidden (T*DFF).
const GELU_CS = `
${CFG}
${DIMS}
RWStructuredBuffer<float> H : register(u0);
[numthreads(64,1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint i = id.y; uint c = id.x;
  if (i >= gS || c >= DFF) return;
  float x = H[i*DFF+c];
  float t = tanh(0.7978845608*(x + 0.044715*x*x*x));
  H[i*DFF+c] = 0.5*x*(1.0+t);
}
`;

// Final logits: GEMM over ONLY the last row (gS-1).
const LOGITS_CS = `
${CFG}
${DIMS}
StructuredBuffer<float> X : register(t0);
StructuredBuffer<float> Wo : register(t1);
StructuredBuffer<float> Bo : register(t2);
RWStructuredBuffer<float> Out : register(u0);
[numthreads(64,1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint n = id.x;
  if (n >= V) return;
  uint last = gS - 1u;
  float acc = Bo[n];
  [loop] for (uint d=0; d<D; d++) acc += X[last*D+d]*Wo[d*V+n];
  Out[n] = acc;
}
`;

// ── GPU phosphor-text terminal: rasterize a Consolas glyph atlas via GDI once ────
const GLYPH_CELL = 32; // atlas cell px (rasterization res; sampled w/ bilinear)
const ATLAS_COLS = 16;
const ATLAS_ROWS = Math.ceil(VOCAB.length / ATLAS_COLS);
const ATLAS_W = GLYPH_CELL * ATLAS_COLS;
const ATLAS_H = GLYPH_CELL * ATLAS_ROWS;
const GLYPH_OF = new Map<string, number>();
for (let i = 0; i < VOCAB.length; i += 1) GLYPH_OF.set(VOCAB[i]!, i);

// Render every VOCAB glyph white-on-black into a top-down 32bpp DIB, then pack its
// red channel as the atlas RGBA (coverage in all channels) and UpdateSubresource it.
function buildGlyphAtlas(): gpu.TextureResult {
  const memDC = GDI32.CreateCompatibleDC(0n);
  const bmi = Buffer.alloc(40);
  bmi.writeUInt32LE(40, 0);
  bmi.writeInt32LE(ATLAS_W, 4);
  bmi.writeInt32LE(-ATLAS_H, 8); // top-down
  bmi.writeUInt16LE(1, 12);
  bmi.writeUInt16LE(32, 14);
  bmi.writeUInt32LE(0, 16); // BI_RGB
  const ppv = Buffer.alloc(8);
  const hbmp = GDI32.CreateDIBSection(memDC, bmi.ptr!, 0, ppv.ptr!, 0n, 0);
  const bits = Number(ppv.readBigUInt64LE(0)) as Pointer;
  GDI32.SelectObject(memDC, hbmp);
  const font = GDI32.CreateFontW(-(GLYPH_CELL - 7), 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);
  GDI32.SelectObject(memDC, font);
  GDI32.SetBkMode(memDC, 1);
  GDI32.SetTextColor(memDC, 0x00ffffff);
  for (let i = 0; i < VOCAB.length; i += 1) {
    const ch = VOCAB[i]!;
    if (ch === '\n' || ch === ' ') continue;
    const cx = (i % ATLAS_COLS) * GLYPH_CELL;
    const cy = ((i / ATLAS_COLS) | 0) * GLYPH_CELL;
    const w = encodeWide(ch);
    GDI32.TextOutW(memDC, cx + 3, cy + 2, w.ptr!, 1);
  }
  GDI32.GdiFlush();
  // Pack coverage into RGBA8 (all channels = blue-of-DIB == white intensity).
  const rgba = Buffer.alloc(ATLAS_W * ATLAS_H * 4);
  for (let p = 0; p < ATLAS_W * ATLAS_H; p += 1) {
    const c = read.u8(bits, p * 4); // B channel of white text
    rgba[p * 4] = c;
    rgba[p * 4 + 1] = c;
    rgba[p * 4 + 2] = c;
    rgba[p * 4 + 3] = 255;
  }
  const tex = gpu.makeTexture({ w: ATLAS_W, h: ATLAS_H, format: gpu.DXGI_FORMAT_R8G8B8A8_UNORM, srv: true });
  gpu.vcall(dev.context, gpu.CTX_UPDATE_SUBRESOURCE, [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], [tex.tex, 0, null, rgba.ptr!, ATLAS_W * 4, 0], FFIType.void);
  GDI32.DeleteObject(font);
  GDI32.DeleteObject(hbmp);
  GDI32.DeleteDC(memDC);
  return tex;
}
const atlasTex = buildGlyphAtlas();
const atlasSamp = gpu.makeSampler({ filter: gpu.D3D11_FILTER_MIN_MAG_MIP_LINEAR, address: gpu.D3D11_TEXTURE_ADDRESS_CLAMP });

// ── Text-terminal grid (visible glyph ids), attention snapshot, prob bars ────────
// Layout: text fills the left band; the heatmap + prob bars stack on the right.
const MARGIN_X = Math.round(clientW * 0.016);
const TITLE_H = Math.round(clientH * 0.125); // reserved for the GDI HUD title band
// Right column: a big attention heatmap with the probability bars beneath it.
const HEAT_SIZE = Math.round(clientH * 0.52);
const RIGHT_W = HEAT_SIZE;
const HEAT_LEFT = clientW - RIGHT_W - MARGIN_X;
const HEAT_TOP = TITLE_H + Math.round(clientH * 0.04);
const BARS_LEFT = HEAT_LEFT;
const BARS_TOP = HEAT_TOP + HEAT_SIZE + Math.round(clientH * 0.06);
const BARS_W = RIGHT_W;
const BARS_H = Math.max(0, clientH - BARS_TOP - Math.round(clientH * 0.035));

const TEXT_LEFT = MARGIN_X;
const TEXT_TOP = TITLE_H;
const TEXT_BOTTOM = clientH - Math.round(clientH * 0.025);
const TEXT_H = TEXT_BOTTOM - TEXT_TOP;
// The generated log lines are ~30-50 chars: size the column count so a typical line
// FILLS most of the band (no big empty right margin). Glyphs are large & readable.
const COLS = 62;
const TEXT_BAND_W = HEAT_LEFT - Math.round(clientW * 0.022) - TEXT_LEFT;
const CHAR_W = Math.max(18, Math.floor(TEXT_BAND_W / COLS));
const CHAR_H = Math.round(CHAR_W * 1.65);
const ROWS = Math.min(12, Math.max(4, Math.floor(TEXT_H / CHAR_H)));

const TOPK_BARS = 8; // candidate prob bars (fewer = taller, readable rows)

// glyphGrid: COLS*ROWS uint glyph-ids (0xffffffff = empty); dynamic each frame.
const glyphGrid = gpu.makeStructuredBuffer({ stride: 4, count: COLS * ROWS, srv: true, cpuWritable: true });
const glyphCpu = new Uint32Array(COLS * ROWS);
const glyphBytes = Buffer.alloc(COLS * ROWS * 4);
// attention snapshot (last layer head 0): T*T floats.
const attVisBuf = gpu.makeStructuredBuffer({ stride: 4, count: T * T, srv: true, cpuWritable: true });
const attVisCpu = new Float32Array(T * T);
const attVisBytes = Buffer.alloc(T * T * 4);
// prob bars: TOPK_BARS * 2 floats: [prob, glyphId] interleaved.
const probBuf = gpu.makeStructuredBuffer({ stride: 4, count: TOPK_BARS * 2, srv: true, cpuWritable: true });
const probCpu = new Float32Array(TOPK_BARS * 2);
const probBytes = Buffer.alloc(TOPK_BARS * 2 * 4);

// ── Render shaders: glowing background + GPU phosphor terminal + heatmap + bars ──
const VS_SRC = `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o; float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p; o.pos = float4(p * float2(2.0,-2.0) + float2(-1.0,1.0), 0.0, 1.0); return o;
}
`;

const PS_SRC = `
cbuffer UI : register(b0) {
  float4 gP;     // x=W y=H z=time w=caretOn
  float4 gText;  // x=left y=top z=charW w=charH
  float4 gGrid;  // x=cols y=rows z=seqLen w=heatHead
  float4 gHeat;  // x=heatLeft y=heatTop z=heatSize w=visN
  float4 gBars;  // x=barsLeft y=barsTop z=barsW w=barsH
  float4 gAtlas; // x=atlasCols y=atlasRows z=cellPad(0..1) w=topk
};
StructuredBuffer<float> Att    : register(t0); // T*T normalized attention
StructuredBuffer<uint>  Glyphs : register(t1); // cols*rows glyph ids (0xffffffff empty)
StructuredBuffer<float> Probs  : register(t2); // [prob,glyphId] * topk
Texture2D    Atlas  : register(t3);
SamplerState Smp    : register(s0);

float3 heat(float t) {
  t = saturate(t);
  float3 c0 = float3(0.02,0.04,0.12);
  float3 c1 = float3(0.10,0.22,0.60);
  float3 c2 = float3(0.15,0.80,0.95);
  float3 c3 = float3(1.00,0.90,0.55);
  float3 c4 = float3(1.00,0.55,0.30);
  if (t < 0.30) return lerp(c0,c1,t/0.30);
  if (t < 0.60) return lerp(c1,c2,(t-0.30)/0.30);
  if (t < 0.85) return lerp(c2,c3,(t-0.60)/0.25);
  return lerp(c3,c4,(t-0.85)/0.15);
}

// Sample one glyph's coverage at sub-cell coord g (0..1) for cell (col,row).
float glyphCov(uint col, uint row, float2 g, float2 cols2, float2 inset) {
  uint cols = (uint)gGrid.x;
  uint idx = row*cols + col;
  uint gid = Glyphs[idx];
  if (gid == 0xffffffffu) return 0.0;
  float ac = gAtlas.x, ar = gAtlas.y;
  float gx = (float)(gid % (uint)ac);
  float gy = (float)(gid / (uint)ac);
  // map cell-local g (with horizontal inset so glyphs aren't clipped) to atlas uv
  float2 lg = saturate((g - inset) / (1.0 - 2.0*inset));
  float2 uv = (float2(gx,gy) + lg) / float2(ac,ar);
  return Atlas.SampleLevel(Smp, uv, 0).r;
}

float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 px = fp.xy; float Wd = gP.x; float Hd = gP.y; float tm = gP.z;
  float2 q = px / float2(Wd, Hd);

  // ── Animated deep-space backdrop with soft moving glows + drifting grid ──
  float3 col = lerp(float3(0.018,0.024,0.055), float3(0.03,0.05,0.11), q.y);
  float aspect = Wd/Hd;
  float2 g1 = float2(0.28+0.10*sin(tm*0.23), 0.40+0.14*cos(tm*0.31));
  float d1 = length((q-g1)*float2(aspect,1.0));
  col += float3(0.05,0.14,0.34) * exp(-d1*2.0) * (0.7+0.3*sin(tm*1.3));
  float2 g2 = float2(0.78+0.08*cos(tm*0.17), 0.62+0.12*sin(tm*0.27));
  float d2 = length((q-g2)*float2(aspect,1.0));
  col += float3(0.20,0.08,0.26) * exp(-d2*2.6) * (0.6+0.4*cos(tm*0.9));
  float2 g3 = float2(0.55+0.12*sin(tm*0.13+2.0), 0.30+0.10*cos(tm*0.19));
  float d3 = length((q-g3)*float2(aspect,1.0));
  col += float3(0.06,0.20,0.16) * exp(-d3*2.8) * (0.55+0.45*sin(tm*0.7+1.0));
  // faint drifting grid lines (the "machine" lattice)
  float2 gl = frac((px + float2(0.0, tm*14.0)) / 46.0);
  float lattice = smoothstep(0.96,1.0, max(gl.x,gl.y));
  col += 0.018 * float3(0.3,0.6,0.9) * lattice;
  // subtle CRT scanlines
  col *= 0.94 + 0.06*sin(px.y*3.14159*0.5);

  // ── Phosphor-text terminal (GPU glyph atlas, glowing) ──
  float tl = gText.x, tt = gText.y, cw = gText.z, ch = gText.w;
  uint cols = (uint)gGrid.x, rows = (uint)gGrid.y;
  if (px.x >= tl && px.x < tl + cw*float(cols) && px.y >= tt && px.y < tt + ch*float(rows)) {
    float fcol = (px.x - tl) / cw;
    float frow = (px.y - tt) / ch;
    uint ccol = (uint)fcol;
    uint crow = (uint)frow;
    float2 g = float2(frac(fcol), frac(frow));
    float2 inset = float2(0.10, 0.04);
    // sharp core
    float core = glyphCov(ccol, crow, g, float2(cols,rows), inset);
    // soft halo: a few taps within the cell + a couple cross-cell for a true glow
    float halo = 0.0;
    [unroll] for (int oy=-1; oy<=1; oy++) {
      [unroll] for (int ox=-1; ox<=1; ox++) {
        float2 gg = g + float2(ox,oy)*0.22;
        int cc = (int)ccol + (gg.x<0.0?-1:(gg.x>1.0?1:0));
        int rr = (int)crow + (gg.y<0.0?-1:(gg.y>1.0?1:0));
        if (cc>=0 && rr>=0 && cc<(int)cols && rr<(int)rows)
          halo += glyphCov((uint)cc,(uint)rr, frac(gg), float2(cols,rows), inset);
      }
    }
    halo /= 9.0;
    float intensity = saturate(core*1.5 + halo*1.1);
    // phosphor green-cyan, brighter newest rows (bottom)
    float freshness = 0.6 + 0.4 * (frow/float(rows));
    float3 phos = float3(0.40,1.0,0.66) * intensity * (1.9*freshness);
    phos += float3(0.75,1.0,0.85) * pow(core,1.6) * 1.3; // hot core
    col += phos;
  }

  // ── Big causal-attention heatmap (right) ──
  float hl = gHeat.x, ht = gHeat.y, hs = gHeat.z; float visN = max(gHeat.w, 1.0);
  if (px.x >= hl-3.0 && px.x < hl+hs+3.0 && px.y >= ht-3.0 && px.y < ht+hs+3.0) {
    float2 inP = (px - float2(hl,ht)) / hs;
    if (inP.x>=0.0 && inP.x<1.0 && inP.y>=0.0 && inP.y<1.0) {
      int row = clamp((int)(inP.y*visN), 0, (int)visN-1);
      int colj = clamp((int)(inP.x*visN), 0, (int)visN-1);
      float3 cell;
      if (colj <= row) {
        float w = Att[row*${T} + colj];
        cell = heat(pow(saturate(w*6.0), 0.5));
      } else {
        cell = float3(0.015,0.02,0.04);
      }
      float2 cf = frac(inP*visN);
      float grid = step(0.93,cf.x) + step(0.93,cf.y);
      cell = lerp(cell, float3(0.04,0.07,0.12), grid*0.35);
      col = cell;
    } else {
      // glowing border frame
      col = lerp(col, float3(0.25,0.65,1.0), 0.85);
    }
  }

  // ── Per-token probability bars (under the heatmap): SQUARE glyph + bar ──
  float bl = gBars.x, bt = gBars.y, bw = gBars.z, bh = gBars.w; uint topk = (uint)gAtlas.w;
  if (bh > 1.0 && px.x >= bl && px.x < bl+bw && px.y >= bt && px.y < bt+bh) {
    float rowh = bh / float(topk);
    int bi = clamp((int)((px.y - bt) / rowh), 0, (int)topk-1);
    float p = Probs[bi*2];
    float inrow = frac((px.y - bt) / rowh);
    float fillx = (px.x - bl) / bw;
    // Glyph cell is SQUARE: its width (in fillx units) equals the row HEIGHT, so the
    // candidate token is never stretched regardless of how wide the bar band is.
    float glyphFrac = clamp(rowh / bw, 0.04, 0.30);
    if (inrow > 0.10 && inrow < 0.90) {
      if (fillx < glyphFrac) {
        uint gid = (uint)(Probs[bi*2+1] + 0.5);
        float ac = gAtlas.x, ar = gAtlas.y;
        float gx = (float)(gid % (uint)ac), gy = (float)(gid / (uint)ac);
        float2 lg = saturate(float2(fillx / glyphFrac, (inrow - 0.10) / 0.80));
        float2 auv = (float2(gx,gy) + lg) / float2(ac,ar);
        float cv = Atlas.SampleLevel(Smp, auv, 0).r;
        col = lerp(col, float3(0.8,1.0,0.85), saturate(cv));
      } else {
        float t = (fillx - glyphFrac - 0.02) / max(1.0 - glyphFrac - 0.02, 0.01);
        if (t >= 0.0 && t <= max(p, 0.012)) {
          float3 bc = heat(0.28 + 0.66*saturate(p*1.3));
          col = lerp(col, bc*1.7, 0.94);
          col += bc * 0.4 * saturate(1.0 - (t/max(p,0.02))); // leading glow
        } else if (t >= 0.0) {
          col = lerp(col, float3(0.06,0.10,0.16), 0.6); // empty track
        }
      }
    }
  }

  // vignette
  float2 vig = q - 0.5;
  col *= 1.0 - 0.5*dot(vig,vig);
  return float4(col, 1.0);
}
`;

// ── Compile + create shaders ──────────────────────────────────────────────────
function CS(src: string): { cs: bigint; code: gpu.CompiledShader } {
  const code = gpu.compile(src, 'main', 'cs_5_0');
  return { cs: gpu.makeComputeShader(code), code };
}
const embed = CS(EMBED_CS);
const ln = CS(LN_CS);
const qkv = CS(gemmSrc(D, D));
const woGemm = qkv;
const attn = CS(ATTN_CS);
const addD = CS(addSrc(D));
const mlpUp = CS(gemmSrc(D, DFF));
const gelu = CS(GELU_CS);
const mlpDown = CS(gemmSrc(DFF, D));
const logitsCS = CS(LOGITS_CS);
const vs = gpu.makeVertexShader(gpu.compile(VS_SRC, 'main', 'vs_5_0'));
const psCode = gpu.compile(PS_SRC, 'main', 'ps_5_0');
const ps = gpu.makePixelShader(psCode);

// ── Unbind helpers (resources can't be UAV+SRV at once) ─────────────────────────
const nulls = Buffer.alloc(8 * 4);
function clearCsUav(n: number): void {
  gpu.vcall(dev.context, gpu.CTX_CS_SET_UNORDERED_ACCESS_VIEWS, [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], [0, n, nulls.ptr!, null], FFIType.void);
}
function clearCsSrv(n: number): void {
  gpu.vcall(dev.context, gpu.CTX_CS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, n, nulls.ptr!], FFIType.void);
}
function unbind(srvN: number, uavN: number): void {
  clearCsUav(uavN);
  clearCsSrv(srvN);
}

const groups1D = (n: number) => Math.ceil(n / 64);
function runEmbed(S: number): void {
  gpu.csSet(embed.cs, { cb: [cfgCb], srv: [idsBuf.srv!, wteB.srv!, wpeB.srv!], uav: [xBuf.uav!] });
  gpu.dispatch(1, S, 1);
  unbind(3, 1);
}
function runLN(src: gpu.StructuredBuffer, g: gpu.StructuredBuffer, b: gpu.StructuredBuffer, dst: gpu.StructuredBuffer, S: number): void {
  gpu.csSet(ln.cs, { cb: [cfgCb], srv: [src.srv!, g.srv!, b.srv!], uav: [dst.uav!] });
  gpu.dispatch(groups1D(S), 1, 1);
  unbind(3, 1);
}
function runGemm(shader: { cs: bigint }, x: gpu.StructuredBuffer, w: gpu.StructuredBuffer, b: gpu.StructuredBuffer, out: gpu.StructuredBuffer, S: number, N: number): void {
  gpu.csSet(shader.cs, { cb: [cfgCb], srv: [x.srv!, w.srv!, b.srv!], uav: [out.uav!] });
  gpu.dispatch(Math.ceil(N / 16), Math.ceil(S / 16), 1);
  unbind(3, 1);
}
function runAdd(a: gpu.StructuredBuffer, b: gpu.StructuredBuffer, out: gpu.StructuredBuffer, S: number, width: number): void {
  gpu.csSet(addD.cs, { cb: [cfgCb], srv: [a.srv!, b.srv!], uav: [out.uav!] });
  gpu.dispatch(Math.ceil(width / 64), S, 1);
  unbind(2, 1);
}

// ── Full forward pass over the current context (length S). ──────────────────────
function forwardGPU(ids: Int32Array, S: number): void {
  const idsU = new Uint32Array(T);
  for (let i = 0; i < S; i += 1) idsU[i] = ids[i]! >>> 0;
  const idsBytes = Buffer.from(idsU.buffer, idsU.byteOffset, idsU.byteLength);
  gpu.updateDynamicBuffer(idsBuf.buffer, idsBytes);
  cfgData.writeUInt32LE(S >>> 0, 0);
  gpu.updateConstantBuffer(cfgCb, cfgData);

  runEmbed(S);
  let x = xBuf;
  let xAlt = xBuf2;

  for (let l = 0; l < NL; l += 1) {
    const L = lwB[l]!;
    runLN(x, L.ln1g, L.ln1b, normBuf, S);
    runGemm(qkv, normBuf, L.wq, L.bq, qBuf, S, D);
    runGemm(qkv, normBuf, L.wk, L.bk, kBuf, S, D);
    runGemm(qkv, normBuf, L.wv, L.bv, vBuf, S, D);
    gpu.csSet(attn.cs, { cb: [cfgCb], srv: [qBuf.srv!, kBuf.srv!, vBuf.srv!], uav: [attBuf.uav!, aoBuf.uav!] });
    gpu.dispatch(Math.ceil(S / 16), Math.ceil(NH / 8), 1);
    unbind(3, 2);
    runGemm(woGemm, aoBuf, L.wo, L.bo, tmpBuf, S, D);
    runAdd(x, tmpBuf, xAlt, S, D);
    runLN(xAlt, L.ln2g, L.ln2b, normBuf, S);
    runGemm(mlpUp, normBuf, L.w1, L.b1, hBuf, S, DFF);
    gpu.csSet(gelu.cs, { cb: [cfgCb], uav: [hBuf.uav!] });
    gpu.dispatch(Math.ceil(DFF / 64), S, 1);
    unbind(0, 1);
    runGemm(mlpDown, hBuf, L.w2, L.b2, tmpBuf, S, D);
    runAdd(xAlt, tmpBuf, x, S, D);
    void xAlt;
  }

  runLN(x, lnfgB, lnfbB, normBuf, S);
  gpu.csSet(logitsCS.cs, { cb: [cfgCb], srv: [normBuf.srv!, woutB.srv!, boutB.srv!], uav: [logitsBuf.uav!] });
  gpu.dispatch(groups1D(V), 1, 1);
  unbind(3, 1);
}

// ── Sampling (CPU) from the readback logits ──────────────────────────────────────
const logitsCpu = new Float32Array(V);
let rngState = 0xc0ffee ^ (SELFCHECK ? 1 : Date.now() & 0xffff);
const rnd = (): number => {
  rngState = (Math.imul(rngState, 1664525) + 1013904223) >>> 0;
  return rngState / 0x1_0000_0000;
};
let lastTopIdx: number[] = []; // for prob bars
let lastTopProb: number[] = [];
function sampleNext(temp: number, topK: number): number {
  const ab = gpu.readbackBuffer(logitsBuf.buffer, V * 4);
  logitsCpu.set(new Float32Array(ab));
  const idx = Array.from({ length: V }, (_, i) => i);
  idx.sort((a, b) => logitsCpu[b]! - logitsCpu[a]!);
  const k = Math.min(topK, V);
  let mx = -Infinity;
  for (let i = 0; i < k; i += 1) {
    const z = logitsCpu[idx[i]!]! / temp;
    if (z > mx) mx = z;
  }
  let sum = 0;
  const probs = new Float32Array(k);
  for (let i = 0; i < k; i += 1) {
    const e = Math.exp(logitsCpu[idx[i]!]! / temp - mx);
    probs[i] = e;
    sum += e;
  }
  lastTopIdx = idx.slice(0, TOPK_BARS);
  lastTopProb = Array.from({ length: TOPK_BARS }, (_, i) => (i < k ? probs[i]! / sum : 0));
  let r = rnd() * sum;
  for (let i = 0; i < k; i += 1) {
    r -= probs[i]!;
    if (r <= 0) return idx[i]!;
  }
  return idx[0]!;
}

// ── Generation state ──────────────────────────────────────────────────────────
const stoi = new Map<string, number>();
for (let i = 0; i < VOCAB.length; i += 1) stoi.set(VOCAB[i]!, i);
const NL_ID = stoi.get('\n') ?? 0;
const ctx: number[] = [stoi.get('[') ?? NL_ID];
let generated = '';
const TEMP = 0.55;
const TOPK = 12;

function decodeStep(): void {
  const window = ctx.slice(Math.max(0, ctx.length - T));
  const S = window.length;
  forwardGPU(Int32Array.from(window), S);
  const next = sampleNext(TEMP, TOPK);
  ctx.push(next);
  generated += VOCAB[next] ?? '?';
  if (generated.length > 8000) generated = generated.slice(-6000);
  if (ctx.length > 4 * T) ctx.splice(0, ctx.length - 2 * T);
}

// ── Per-frame uploads: attention snapshot, glyph grid, prob bars ──────────────────
function uploadHeatmap(): void {
  const ab = new Float32Array(gpu.readbackBuffer(attBuf.buffer, NH * T * T * 4));
  attVisCpu.set(ab.subarray(0, T * T));
  attVisBytes.set(new Uint8Array(attVisCpu.buffer, attVisCpu.byteOffset, T * T * 4));
  gpu.updateDynamicBuffer(attVisBuf.buffer, attVisBytes);
}

// Wrap the generated tail into the COLS×ROWS terminal grid (glyph ids; 0xffffffff empty).
function uploadGlyphGrid(caretOn: boolean): void {
  glyphCpu.fill(0xffffffff);
  // Build wrapped lines from the tail of `generated`.
  const lines: string[] = [];
  let cur = '';
  for (const chr of generated) {
    if (chr === '\n') {
      lines.push(cur);
      cur = '';
      continue;
    }
    cur += chr;
    if (cur.length >= COLS) {
      lines.push(cur);
      cur = '';
    }
  }
  lines.push(cur);
  // Keep the last ROWS lines (scrolling terminal).
  const show = lines.slice(Math.max(0, lines.length - ROWS));
  for (let r = 0; r < show.length; r += 1) {
    const line = show[r]!;
    for (let c = 0; c < line.length && c < COLS; c += 1) {
      const gid = GLYPH_OF.get(line[c]!);
      if (gid !== undefined) glyphCpu[r * COLS + c] = gid;
    }
  }
  // Blinking block caret at the end of the last line.
  if (caretOn) {
    const lastR = show.length - 1;
    const lastC = Math.min(COLS - 1, (show[lastR] ?? '').length);
    const caretGid = GLYPH_OF.get('[') ?? 0; // a solid-ish bracket reads as a cursor; underscore not in vocab
    glyphCpu[lastR * COLS + lastC] = caretGid;
  }
  glyphBytes.set(new Uint8Array(glyphCpu.buffer, glyphCpu.byteOffset, COLS * ROWS * 4));
  gpu.updateDynamicBuffer(glyphGrid.buffer, glyphBytes);
}

function uploadProbs(): void {
  for (let i = 0; i < TOPK_BARS; i += 1) {
    probCpu[i * 2] = lastTopProb[i] ?? 0;
    probCpu[i * 2 + 1] = lastTopIdx[i] ?? 0;
  }
  probBytes.set(new Uint8Array(probCpu.buffer, probCpu.byteOffset, TOPK_BARS * 2 * 4));
  gpu.updateDynamicBuffer(probBuf.buffer, probBytes);
}

// Numeric structure proof: confirm the attention matrix is a valid causal softmax.
function attentionStructure(S: number): Record<string, number | boolean> {
  let rowsSumOk = 0;
  let upperLeak = 0;
  let belowMass = 0;
  let maxRowPeak = 0;
  for (let i = 0; i < S; i += 1) {
    let rs = 0;
    for (let j = 0; j <= i; j += 1) {
      const w = attVisCpu[i * T + j]!;
      rs += w;
      if (w > maxRowPeak) maxRowPeak = w;
    }
    belowMass += rs;
    if (Math.abs(rs - 1) < 0.02) rowsSumOk += 1;
    for (let j = i + 1; j < S; j += 1) upperLeak += attVisCpu[i * T + j]!;
  }
  return {
    rowsSumToOne: rowsSumOk,
    seqLen: S,
    upperLeak: +upperLeak.toFixed(5),
    belowMass: +belowMass.toFixed(2),
    maxRowPeak: +maxRowPeak.toFixed(4),
    causalValid: rowsSumOk === S && upperLeak < 1e-3,
  };
}

// ── UI constant buffer (6 float4 = 96 bytes) ─────────────────────────────────────
const UI_SIZE = 96;
const uiCb = gpu.makeConstantBuffer(UI_SIZE);
const uiData = Buffer.alloc(UI_SIZE);

// ── GDI HUD (title band only; the streaming text is GPU-rendered) ────────────────
const TRANSPARENT_BK = 1;
const titleFont = GDI32.CreateFontW(-Math.round(clientH * 0.04), 0, 0, 0, 700, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);
const subFont = GDI32.CreateFontW(-Math.round(clientH * 0.026), 0, 0, 0, 500, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);
const labelFont = GDI32.CreateFontW(-Math.round(clientH * 0.024), 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);

function drawHud(fps: number, tokRate: number): void {
  hud.draw(dev, clientW, clientH, (dc) => {
    GDI32.SetBkMode(dc, TRANSPARENT_BK);

    const prev = GDI32.SelectObject(dc, titleFont);
    const title = `nano-gpt · 111,606-param transformer · ${dev.gpuName} · pure TypeScript`;
    const tw = encodeWide(title);
    GDI32.SetTextColor(dc, 0x00100804);
    GDI32.TextOutW(dc, MARGIN_X + 2, Math.round(clientH * 0.03) + 2, tw.ptr!, title.length);
    GDI32.SetTextColor(dc, 0x00f2dcaa);
    GDI32.TextOutW(dc, MARGIN_X, Math.round(clientH * 0.03), tw.ptr!, title.length);

    GDI32.SelectObject(dc, subFont);
    const sub = `decoder-only · ${NL} blocks · ${NH} heads · D=${D} · forward pass = D3D11 compute · ${tokRate.toFixed(1)} tok/s · ${fps} fps · ESC`;
    const sw = encodeWide(sub);
    GDI32.SetTextColor(dc, 0x0090a0b0);
    GDI32.TextOutW(dc, MARGIN_X, Math.round(clientH * 0.082), sw.ptr!, sub.length);

    // labels over the GPU panels
    GDI32.SelectObject(dc, labelFont);
    const heatLbl = 'causal self-attention (block 3, head 1)';
    const hw = encodeWide(heatLbl);
    GDI32.SetTextColor(dc, 0x00c8d8e8);
    GDI32.TextOutW(dc, HEAT_LEFT, HEAT_TOP - Math.round(clientH * 0.038), hw.ptr!, heatLbl.length);
    if (BARS_H > 1) {
      const barLbl = `next-token probability (top-${TOPK_BARS})`;
      const bw = encodeWide(barLbl);
      GDI32.TextOutW(dc, BARS_LEFT, BARS_TOP - Math.round(clientH * 0.036), bw.ptr!, barLbl.length);
    }

    GDI32.SelectObject(dc, prev);
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
      GDI32.DeleteObject(titleFont);
      GDI32.DeleteObject(subFont);
      GDI32.DeleteObject(labelFont);
      const allBufs: gpu.StructuredBuffer[] = [wteB, wpeB, lnfgB, lnfbB, woutB, boutB, xBuf, xBuf2, normBuf, qBuf, kBuf, vBuf, attBuf, aoBuf, tmpBuf, hBuf, logitsBuf, idsBuf, attVisBuf, glyphGrid, probBuf];
      for (const lw of lwB) for (const b of Object.values(lw)) allBufs.push(b);
      for (const b of allBufs) {
        gpu.comRelease(b.srv ?? 0n);
        gpu.comRelease(b.uav ?? 0n);
        gpu.comRelease(b.buffer);
      }
      gpu.comRelease(atlasTex.srv ?? 0n);
      gpu.comRelease(atlasTex.tex);
      gpu.comRelease(atlasSamp);
      gpu.comRelease(cfgCb);
      gpu.comRelease(uiCb);
      gpu.comRelease(ps);
      gpu.comRelease(vs);
      for (const s of [embed, ln, qkv, attn, addD, mlpUp, gelu, mlpDown, logitsCS]) {
        gpu.comRelease(s.cs);
        gpu.blobRelease(s.code.blob);
      }
      gpu.blobRelease(psCode.blob);
      gpu.comRelease(dev.backBufferRTV);
      gpu.comRelease(dev.swapChain);
      gpu.comRelease(dev.context);
      gpu.comRelease(dev.device);
    } catch {
      /* best-effort */
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

// ── Render loop ───────────────────────────────────────────────────────────────
const start = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
let frame = 0;
let fps = 0;
let fpsFrames = 0;
let fpsWindow = start;
let tokens = 0;
let tokRate = 0;
const TOKENS_PER_FRAME = 2; // keep the stream flowing & filling each frame

// Warm-start: pre-generate enough REAL tokens to fill most of the terminal so the
// gallery frame is a full, alive screen (not 2 sparse lines). Budget-capped.
const WARM_TARGET = Math.min(COLS * (ROWS - 2), 2600);
const warmBudgetMs = 4200;
{
  const t0 = performance.now();
  while (generated.length < WARM_TARGET && performance.now() - t0 < warmBudgetMs) {
    decodeStep();
    tokens += 1;
  }
  uploadHeatmap();
  uploadProbs();
  console.log(`  warm-start: ${tokens} tokens (${generated.length} chars) in ${((performance.now() - t0) / 1000).toFixed(2)}s · grid ${COLS}x${ROWS}`);
}

function bindAndDraw(time: number, caretOn: boolean): void {
  uiData.writeFloatLE(clientW, 0);
  uiData.writeFloatLE(clientH, 4);
  uiData.writeFloatLE(time, 8);
  uiData.writeFloatLE(caretOn ? 1 : 0, 12);
  uiData.writeFloatLE(TEXT_LEFT, 16);
  uiData.writeFloatLE(TEXT_TOP, 20);
  uiData.writeFloatLE(CHAR_W, 24);
  uiData.writeFloatLE(CHAR_H, 28);
  uiData.writeFloatLE(COLS, 32);
  uiData.writeFloatLE(ROWS, 36);
  uiData.writeFloatLE(Math.min(ctx.length, T), 40);
  uiData.writeFloatLE(0, 44);
  uiData.writeFloatLE(HEAT_LEFT, 48);
  uiData.writeFloatLE(HEAT_TOP, 52);
  uiData.writeFloatLE(HEAT_SIZE, 56);
  uiData.writeFloatLE(Math.min(ctx.length, T), 60);
  uiData.writeFloatLE(BARS_LEFT, 64);
  uiData.writeFloatLE(BARS_TOP, 68);
  uiData.writeFloatLE(BARS_W, 72);
  uiData.writeFloatLE(BARS_H, 76);
  uiData.writeFloatLE(ATLAS_COLS, 80);
  uiData.writeFloatLE(ATLAS_ROWS, 84);
  uiData.writeFloatLE(0, 88);
  uiData.writeFloatLE(TOPK_BARS, 92);
  gpu.updateConstantBuffer(uiCb, uiData);

  gpu.setRenderTargets([dev.backBufferRTV]);
  gpu.setViewport(clientW, clientH);
  gpu.clear(dev.backBufferRTV, [0.012, 0.016, 0.03, 1]);
  gpu.vsSet(vs);
  gpu.psSet(ps, { cb: [uiCb], srv: [attVisBuf.srv!, glyphGrid.srv!, probBuf.srv!, atlasTex.srv!], samp: [atlasSamp] });
  gpu.drawFullscreenTriangle();
  gpu.psSet(ps, { srv: [0n, 0n, 0n, 0n] });
}

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;
  const now = performance.now();
  const time = (now - start) / 1000;
  const caretOn = (Math.floor(time * 2.5) & 1) === 0;

  for (let t = 0; t < TOKENS_PER_FRAME; t += 1) {
    decodeStep();
    tokens += 1;
  }
  uploadHeatmap();
  uploadProbs();
  uploadGlyphGrid(caretOn);

  bindAndDraw(time, caretOn);

  // HUD composited INTO the back buffer (flicker-free), BEFORE present + capture.
  drawHud(fps, tokRate);

  // Self-shot: capture the GPU back buffer of the target frame BEFORE present.
  const lastFrame = (durationMs > 0 && now - start >= durationMs) || (SELFCHECK && frame === 6);
  if (SELFSHOT && lastFrame) {
    const out = process.env.SELFSHOT_PATH || `${import.meta.dir}/nano-gpt.selfcheck.png`;
    const stats = captureBackBuffer(dev, out, { gridW: 48, gridH: 20 });
    console.log(formatGrid(stats));
    console.log(`[selfshot] ok=${stats.ok} nonBlackPct=${(stats.nonBlackFrac * 100).toFixed(1)} meanLuma=${stats.meanLuma.toFixed(3)} -> ${stats.path}`);
  }

  dev.present(false);

  frame += 1;
  fpsFrames += 1;
  if (now - fpsWindow >= 500) {
    fps = Math.round((fpsFrames * 1000) / (now - fpsWindow));
    tokRate = (tokens * 1000) / (now - start);
    fpsFrames = 0;
    fpsWindow = now;
  }

  if (SELFCHECK && frame === 7) {
    const s: Record<string, unknown> = {};
    s.attn = attentionStructure(Math.min(ctx.length, T));
    s.generatedSample = generated.slice(0, 200);
    s.tokensGenerated = tokens;
    s.cols = COLS;
    s.rows = ROWS;
    s.heatSize = HEAT_SIZE;
    console.log('SELFCHECK_STATS ' + JSON.stringify(s));
    break;
  }
  if (lastFrame) break;
}

console.log(`\nnano-gpt finished — ${frame} frames, ${tokens} tokens over ${((performance.now() - start) / 1000).toFixed(2)}s (${fps} fps).`);
console.log('Generated:\n' + generated.slice(0, 400));
cleanup(0);
