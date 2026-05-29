/**
 * Reaction–Diffusion — living Turing patterns morphing in real time, on your GPU, in pure TypeScript.
 *
 * A borderless 1280x720 window fills with a writhing membrane of coral, cells, stripes
 * and fingerprints that is never the same twice. This is a real Gray–Scott
 * reaction–diffusion system solved on the actual hardware ID3D11Device: two RG16F float
 * textures hold the two chemical concentrations (A,B) and are PING-PONGED — each frame
 * runs MANY simulation substeps, every substep a full-screen pixel shader that samples the
 * previous state's 3x3 neighbourhood (a weighted Laplacian), applies the Gray–Scott
 * update with feed rate F and kill rate K, and writes the next state. F and K vary smoothly
 * ACROSS the screen, so spots, mitosis, stripes, coral and fingerprint regimes coexist and
 * bleed into one another. A final colorize pass maps concentration B through a rich,
 * cycleable cosine palette with a fake-3D emboss for a wet, organic sheen. The whole thing
 * is alive: LEFT-CLICK injects fresh chemical B at the cursor so you can paint patterns that
 * then grow, divide and devour each other. A GDI HUD reads
 * "Gray-Scott reaction-diffusion · <fps> fps · click to seed".
 *
 * Pipeline (per displayed frame, ~60 fps off a PeekMessage pump):
 *   1. inject B at the cursor while the left button is held (seed pass blends into current state)
 *   2. for substep in 0..N-1:  bind prev SRV → render simulation PS into next RTV → swap (ping-pong)
 *   3. bind the final state's SRV → colorize PS → present to the DXGI back buffer
 *   4. GDI TextOutW HUD on the window DC
 *
 * @bun-win32 / engine APIs used (all via packages/all/example/_gpu.ts, which walks the real
 * D3D11 COM vtables by hand over Bun FFI): createWindow, createDevice, compile,
 * makeVertexShader/makePixelShader, makeConstantBuffer/updateConstantBuffer,
 * makeTexture (RG16F, rtv+srv) for the ping-pong pair, makeSampler (point, clamp),
 * setRenderTargets/setViewport/clear, vsSet/psSet, drawFullscreenTriangle, present, comRelease.
 * Plus GDI32 CreateFontW/TextOutW for the on-window HUD.
 *
 * Controls: left-click to inject chemical · P cycles the palette · SPACE re-seeds · ESC quits.
 *
 * Run: bun run packages/all/example/reaction-diffusion.ts
 */

import { GDI32, User32 } from '../index';
import {
  D3D11_FILTER_MIN_MAG_MIP_LINEAR,
  D3D11_FILTER_MIN_MAG_MIP_POINT,
  D3D11_TEXTURE_ADDRESS_CLAMP,
  clear,
  comRelease,
  compile,
  createDevice,
  createWindow,
  drawFullscreenTriangle,
  makeConstantBuffer,
  makePixelShader,
  makeSampler,
  makeTexture,
  makeVertexShader,
  psSet,
  setRenderTargets,
  setViewport,
  updateConstantBuffer,
  vsSet,
  type TextureResult,
} from './_gpu';

// DXGI_FORMAT_R16G16_FLOAT — two 16-bit floats per texel (chemical A in R, B in G).
// Not surfaced by _gpu.ts; value from the DXGI_FORMAT enum (dxgiformat.h).
const DXGI_FORMAT_R16G16_FLOAT = 34;

const VK_SPACE = 0x20;
const VK_P = 0x50;

// The simulation runs at a fixed resolution independent of the window for stable
// pattern scale and speed; the colorize pass upsamples it to the back buffer.
const WIDTH = 1280;
const HEIGHT = 720;
const SIM_W = 640;
const SIM_H = 360;
const SUBSTEPS = 12; // Gray–Scott integration steps per displayed frame.
const PALETTE_COUNT = 5;

const encodeWide = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');

// ── Shared full-screen-triangle vertex shader (SV_VertexID, no vertex buffer) ──
const VS_SOURCE = `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o;
  float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p;
  o.pos = float4(p * float2(2.0, -2.0) + float2(-1.0, 1.0), 0.0, 1.0);
  return o;
}
`;

// ── Seed pass: write the initial state (A=1 everywhere, B=spots) into a texture ──
// Drawn once at startup (and on SPACE) directly into both ping-pong textures.
const PS_SEED = `
cbuffer C : register(b0) {
  float2 iSimRes;   // simulation texel resolution
  float  iTime;
  float  iSeedKind; // 0 = full re-seed
};
float hash21(float2 p) {
  p = frac(p * float2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return frac(p.x * p.y);
}
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  // Base resting state: substrate A saturated, chemical B absent.
  float A = 1.0;
  float B = 0.0;
  // Scatter a handful of soft B blobs so several pattern fronts ignite at once.
  [unroll]
  for (int i = 0; i < 14; i++) {
    float fi = float(i);
    float2 c = float2(hash21(float2(fi, 1.7)), hash21(float2(fi, 4.2)));
    float d = distance(uv, c);
    float blob = exp(-d * d * 900.0);
    B = max(B, blob * 0.9);
  }
  // A central seed streak so a coral front always has somewhere to grow from.
  float streak = exp(-pow((uv.x - 0.5) * 30.0, 2.0)) * step(0.35, uv.y) * step(uv.y, 0.65);
  B = max(B, streak * 0.85);
  A = 1.0 - B;
  return float4(A, B, 0.0, 1.0);
}
`;

// ── Inject pass: blend a soft pulse of chemical B at the cursor into the state ──
// Reads the current state, ADDS B near the mouse, writes back (drawn into next, then
// the result is used as the simulation input for this frame's substeps).
const PS_INJECT = `
cbuffer C : register(b0) {
  float2 iSimRes;
  float2 iMouse;    // mouse in simulation-UV space (0..1)
  float  iRadius;   // brush radius in UV
  float  iStrength;
  float2 pad;
};
Texture2D Prev : register(t0);
SamplerState Smp : register(s0);
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 s = Prev.Sample(Smp, uv).rg;
  float d = distance(uv, iMouse);
  float brush = exp(-(d * d) / max(iRadius * iRadius, 1e-6)) * iStrength;
  float B = saturate(s.g + brush);
  float A = saturate(s.r - brush * 0.5);
  return float4(A, B, 0.0, 1.0);
}
`;

// ── Simulation pass: one Gray–Scott step (3x3 Laplacian + feed/kill), spatially varied ──
const PS_SIM = `
cbuffer C : register(b0) {
  float2 iSimRes;   // (SIM_W, SIM_H)
  float  iTime;
  float  pad0;
};
Texture2D Prev : register(t0);
SamplerState Smp : register(s0);

float2 lap5(float2 uv, float2 texel) {
  // 9-point weighted Laplacian (the classic Gray–Scott kernel).
  float2 sum = float2(0,0);
  sum += Prev.Sample(Smp, uv + texel * float2(-1,-1)).rg * 0.05;
  sum += Prev.Sample(Smp, uv + texel * float2( 0,-1)).rg * 0.20;
  sum += Prev.Sample(Smp, uv + texel * float2( 1,-1)).rg * 0.05;
  sum += Prev.Sample(Smp, uv + texel * float2(-1, 0)).rg * 0.20;
  sum += Prev.Sample(Smp, uv                       ).rg * -1.0;
  sum += Prev.Sample(Smp, uv + texel * float2( 1, 0)).rg * 0.20;
  sum += Prev.Sample(Smp, uv + texel * float2(-1, 1)).rg * 0.05;
  sum += Prev.Sample(Smp, uv + texel * float2( 0, 1)).rg * 0.20;
  sum += Prev.Sample(Smp, uv + texel * float2( 1, 1)).rg * 0.05;
  return sum;
}

float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 texel = 1.0 / iSimRes;
  float2 s = Prev.Sample(Smp, uv).rg;
  float A = s.r;
  float B = s.g;

  float2 L = lap5(uv, texel);

  // Spatially varying feed (F) and kill (K) so distinct organic regimes coexist:
  // the classic Pearson map sweeps F in x and K in y across the canvas. A slow
  // breathing term keeps the boundaries between regimes migrating over time.
  float breathe = 0.0015 * sin(iTime * 0.25);
  float F = lerp(0.018, 0.062, uv.x) + breathe;
  float K = lerp(0.045, 0.068, uv.y) - breathe;

  // Diffusion rates (B diffuses at half A's rate — the standard ratio).
  const float Da = 1.0;
  const float Db = 0.5;
  const float dt = 1.0;

  float reaction = A * B * B;
  float newA = A + (Da * L.r - reaction + F * (1.0 - A)) * dt;
  float newB = B + (Db * L.g + reaction - (K + F) * B) * dt;

  return float4(saturate(newA), saturate(newB), 0.0, 1.0);
}
`;

// ── Colorize pass: map B through a rich cosine palette with a wet emboss sheen ──
const PS_COLOR = `
cbuffer C : register(b0) {
  float2 iSimRes;
  float  iTime;
  float  iPalette;
};
Texture2D State : register(t0);
SamplerState Smp : register(s0);

float3 cosPalette(float t, float3 a, float3 b, float3 c, float3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}

float3 paletteFor(float idx, float t) {
  if (idx < 0.5)        return cosPalette(t, float3(0.5,0.5,0.5), float3(0.5,0.5,0.5), float3(1.0,1.0,1.0), float3(0.00,0.10,0.20)); // spectral
  else if (idx < 1.5)   return cosPalette(t, float3(0.20,0.18,0.32), float3(0.55,0.45,0.55), float3(1.0,1.0,1.0), float3(0.30,0.20,0.55)); // nebula
  else if (idx < 2.5)   return cosPalette(t, float3(0.30,0.18,0.10), float3(0.60,0.40,0.20), float3(1.0,1.0,1.0), float3(0.10,0.18,0.30)); // coral/ember
  else if (idx < 3.5)   return cosPalette(t, float3(0.10,0.30,0.30), float3(0.40,0.50,0.45), float3(1.0,1.0,1.0), float3(0.55,0.40,0.30)); // jade tide
  else                  return cosPalette(t, float3(0.50,0.50,0.50), float3(0.50,0.50,0.50), float3(2.0,1.0,0.0), float3(0.50,0.20,0.25)); // psychedelic
}

float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 texel = 1.0 / iSimRes;
  float B  = State.Sample(Smp, uv).g;
  // Emboss: gradient of B gives a fake-3D lit membrane (wet coral sheen).
  float bx = State.Sample(Smp, uv + float2(texel.x, 0)).g - State.Sample(Smp, uv - float2(texel.x, 0)).g;
  float by = State.Sample(Smp, uv + float2(0, texel.y)).g - State.Sample(Smp, uv - float2(0, texel.y)).g;
  float3 n = normalize(float3(-bx * 6.0, -by * 6.0, 1.0));
  float3 lightDir = normalize(float3(0.5, 0.6, 0.8));
  float diff = saturate(dot(n, lightDir));
  float spec = pow(saturate(dot(reflect(-lightDir, n), float3(0,0,1))), 28.0);

  // Map concentration to a palette position; gently animate the cycle.
  float t = B * 1.8 + iTime * 0.03;
  float3 col = paletteFor(iPalette, t);
  // Shade by the membrane lighting and lift highlights with a specular glint.
  col *= 0.35 + 0.85 * diff;
  col += spec * float3(1.0, 0.95, 0.85) * smoothstep(0.05, 0.3, B);
  // Deepen the empty substrate toward a dark, inky background.
  col = lerp(float3(0.02, 0.02, 0.04), col, smoothstep(0.0, 0.12, B + 0.02));

  // Subtle bloom: add a soft glow proportional to local B density.
  col += pow(saturate(B), 2.0) * paletteFor(iPalette, t + 0.35) * 0.25;

  // Tonemap + gamma for an HDR-ish, filmic look.
  col = col / (col + 1.0);
  col = pow(col, 1.0 / 2.2);
  return float4(col, 1.0);
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────────────────
const win = createWindow({ title: 'Reaction–Diffusion — living Turing patterns', width: WIDTH, height: HEIGHT, borderless: true });
const { w: clientW, h: clientH } = win.clientSize();
const gpu = createDevice(win.hwnd, { width: clientW, height: clientH });

console.log('Reaction–Diffusion — Gray–Scott Turing patterns running on the GPU.');
console.log(`  ${SIM_W}x${SIM_H} sim · ${SUBSTEPS} substeps/frame · ${gpu.driver} · ${gpu.gpuName}`);
console.log('  Left-click to inject chemical · P palette · SPACE re-seed · ESC exit.');

// Shaders.
const vsCode = compile(VS_SOURCE, 'main', 'vs_5_0');
const vs = makeVertexShader(vsCode);
const psSeedCode = compile(PS_SEED, 'main', 'ps_5_0');
const psSeed = makePixelShader(psSeedCode);
const psInjectCode = compile(PS_INJECT, 'main', 'ps_5_0');
const psInject = makePixelShader(psInjectCode);
const psSimCode = compile(PS_SIM, 'main', 'ps_5_0');
const psSim = makePixelShader(psSimCode);
const psColorCode = compile(PS_COLOR, 'main', 'ps_5_0');
const psColor = makePixelShader(psColorCode);

// Ping-pong RG16F state textures (A in R, B in G). Both render-target + sampleable.
let texA: TextureResult = makeTexture({ w: SIM_W, h: SIM_H, format: DXGI_FORMAT_R16G16_FLOAT, rtv: true, srv: true });
let texB: TextureResult = makeTexture({ w: SIM_W, h: SIM_H, format: DXGI_FORMAT_R16G16_FLOAT, rtv: true, srv: true });

// Point sampler for the simulation (exact neighbour fetches); linear for colorize upsample.
const sampPoint = makeSampler({ filter: D3D11_FILTER_MIN_MAG_MIP_POINT, address: D3D11_TEXTURE_ADDRESS_CLAMP });
const sampLinear = makeSampler({ filter: D3D11_FILTER_MIN_MAG_MIP_LINEAR, address: D3D11_TEXTURE_ADDRESS_CLAMP });

// Constant buffers (16-byte aligned). Layouts match the cbuffers above.
const cbSeed = makeConstantBuffer(16); // float2 res, float time, float kind
const cbInject = makeConstantBuffer(32); // float2 res, float2 mouse, float radius, float strength, float2 pad
const cbSim = makeConstantBuffer(16); // float2 res, float time, float pad
const cbColor = makeConstantBuffer(16); // float2 res, float time, float palette

const cbSeedData = Buffer.alloc(16);
const cbInjectData = Buffer.alloc(32);
const cbSimData = Buffer.alloc(16);
const cbColorData = Buffer.alloc(16);

// ── GDI HUD font ──
const hudFont = GDI32.CreateFontW(-18, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4 /* ANTIALIASED_QUALITY */, 0, encodeWide('Consolas').ptr!);
const TRANSPARENT_BK = 1;

let fps = 0;
let palette = 2; // start on the coral/ember palette

function drawHud(): void {
  const dc = User32.GetDC(win.hwnd);
  if (!dc) return;
  const prevFont = GDI32.SelectObject(dc, hudFont);
  GDI32.SetBkMode(dc, TRANSPARENT_BK);
  const line = `Gray-Scott reaction-diffusion · ${fps} fps · click to seed`;
  const text = encodeWide(line);
  const len = line.length;
  GDI32.SetTextColor(dc, 0x000000);
  GDI32.TextOutW(dc, 17, 17, text.ptr!, len);
  GDI32.SetTextColor(dc, 0x00e8f0ff); // warm white (BGR)
  GDI32.TextOutW(dc, 16, 16, text.ptr!, len);
  GDI32.SelectObject(dc, prevFont);
  User32.ReleaseDC(win.hwnd, dc);
}

// ── Seed both textures with the initial state ──
function seedInto(target: TextureResult): void {
  cbSeedData.writeFloatLE(SIM_W, 0);
  cbSeedData.writeFloatLE(SIM_H, 4);
  cbSeedData.writeFloatLE(performance.now() / 1000, 8);
  cbSeedData.writeFloatLE(0, 12);
  updateConstantBuffer(cbSeed, cbSeedData);
  setRenderTargets([target.rtv!]);
  setViewport(SIM_W, SIM_H);
  vsSet(vs);
  psSet(psSeed, { cb: [cbSeed] });
  drawFullscreenTriangle();
  setRenderTargets([]);
}

function reseed(): void {
  seedInto(texA);
  seedInto(texB);
}
reseed();

// ─────────────────────────────────────────────────────────────────────────────
// Render loop
// ─────────────────────────────────────────────────────────────────────────────
const startTime = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
let frames = 0;
let totalFrames = 0;
let fpsWindowStart = startTime;
let prevSpace = false;
let prevP = false;

let cleanedUp = false;
function cleanup(code: number): never {
  if (!cleanedUp) {
    cleanedUp = true;
    GDI32.DeleteObject(hudFont);
    comRelease(sampPoint);
    comRelease(sampLinear);
    comRelease(cbSeed);
    comRelease(cbInject);
    comRelease(cbSim);
    comRelease(cbColor);
    comRelease(psSeed);
    comRelease(psInject);
    comRelease(psSim);
    comRelease(psColor);
    comRelease(vs);
    for (const t of [texA, texB]) {
      comRelease(t.srv!);
      comRelease(t.rtv!);
      comRelease(t.tex);
    }
    comRelease(gpu.backBufferRTV);
    comRelease(gpu.swapChain);
    comRelease(gpu.context);
    comRelease(gpu.device);
    win.destroy();
  }
  process.exit(code);
}
process.on('SIGINT', () => cleanup(0));

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;

  const now = performance.now();
  const t = (now - startTime) / 1000;
  const mouse = win.getMouse();

  // Palette cycle (P) and re-seed (SPACE), edge-triggered.
  const pNow = win.keyDown(VK_P);
  if (pNow && !prevP) palette = (palette + 1) % PALETTE_COUNT;
  prevP = pNow;
  const spaceNow = win.keyDown(VK_SPACE);
  if (spaceNow && !prevSpace) reseed();
  prevSpace = spaceNow;

  // 1. Inject chemical B at the cursor while the left button is held. The inject pass
  //    reads texA and writes texB; we then swap so texA holds the injected state.
  if (mouse.down) {
    const mu = Math.min(1, Math.max(0, mouse.x / clientW));
    const mv = Math.min(1, Math.max(0, mouse.y / clientH));
    cbInjectData.writeFloatLE(SIM_W, 0);
    cbInjectData.writeFloatLE(SIM_H, 4);
    cbInjectData.writeFloatLE(mu, 8);
    cbInjectData.writeFloatLE(mv, 12);
    cbInjectData.writeFloatLE(0.025, 16); // radius (UV)
    cbInjectData.writeFloatLE(0.9, 20); // strength
    cbInjectData.writeFloatLE(0, 24);
    cbInjectData.writeFloatLE(0, 28);
    updateConstantBuffer(cbInject, cbInjectData);

    setRenderTargets([texB.rtv!]);
    setViewport(SIM_W, SIM_H);
    vsSet(vs);
    psSet(psInject, { cb: [cbInject], srv: [texA.srv!], samp: [sampPoint] });
    drawFullscreenTriangle();
    setRenderTargets([]);
    const swap = texA;
    texA = texB;
    texB = swap;
  }

  // 2. Run the Gray–Scott substeps. Each substep reads texA → writes texB → swap.
  cbSimData.writeFloatLE(SIM_W, 0);
  cbSimData.writeFloatLE(SIM_H, 4);
  cbSimData.writeFloatLE(t, 8);
  cbSimData.writeFloatLE(0, 12);
  updateConstantBuffer(cbSim, cbSimData);
  setViewport(SIM_W, SIM_H);
  for (let i = 0; i < SUBSTEPS; i += 1) {
    setRenderTargets([texB.rtv!]);
    vsSet(vs);
    psSet(psSim, { cb: [cbSim], srv: [texA.srv!], samp: [sampPoint] });
    drawFullscreenTriangle();
    setRenderTargets([]); // unbind so texB can be read as SRV next iteration
    const swap = texA;
    texA = texB;
    texB = swap;
  }

  // 3. Colorize the final state (texA) to the back buffer.
  cbColorData.writeFloatLE(SIM_W, 0);
  cbColorData.writeFloatLE(SIM_H, 4);
  cbColorData.writeFloatLE(t, 8);
  cbColorData.writeFloatLE(palette, 12);
  updateConstantBuffer(cbColor, cbColorData);
  setRenderTargets([gpu.backBufferRTV]);
  setViewport(clientW, clientH);
  clear(gpu.backBufferRTV, [0.02, 0.02, 0.04, 1]);
  vsSet(vs);
  psSet(psColor, { cb: [cbColor], srv: [texA.srv!], samp: [sampLinear] });
  drawFullscreenTriangle();
  setRenderTargets([]);

  gpu.present(false);
  drawHud();

  // FPS accounting.
  frames += 1;
  totalFrames += 1;
  if (now - fpsWindowStart >= 500) {
    fps = Math.round((frames * 1000) / (now - fpsWindowStart));
    frames = 0;
    fpsWindowStart = now;
  }

  if (durationMs > 0 && now - startTime >= durationMs) break;
}

console.log(`  presented ${totalFrames} frames (${totalFrames * SUBSTEPS} Gray–Scott substeps) over ${((performance.now() - startTime) / 1000).toFixed(2)}s.`);
cleanup(0);
