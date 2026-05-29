/**
 * Fluid — real-time ink-in-water you stir with your mouse, solved on your GPU in pure TypeScript.
 *
 * A borderless window fills with a 256x256 grid of dye that behaves like ink dropped in water:
 * it is ALIVE from the first frame — startup seeds several vivid colored blobs with tangential
 * velocity so they immediately curl into vortices, and a couple of slowly orbiting ambient
 * emitters keep injecting color + swirl forever, so the canvas is always full of moving ink
 * even with no input. Drag the mouse and a ribbon of vivid, time-cycling color unfurls, curls
 * into vortices, and diffuses into smoky filaments. This is a real Jos Stam "Stable Fluids" 2D Navier-Stokes
 * solver: every frame the engine ping-pongs a stack of floating-point textures (velocity,
 * pressure, divergence, dye) through a chain of full-screen pixel-shader passes — (1) advect
 * the velocity field semi-Lagrangian, (2) splat impulse + color where the mouse drags, (3)
 * add vorticity confinement to keep swirls crisp, (4) compute divergence, (5) ~36 Jacobi
 * pressure iterations, (6) subtract the pressure gradient so the flow is incompressible, (7)
 * advect the dye through the now-divergence-free field, then a final tonemapped palette pass
 * paints the dye to the back buffer with a soft glow. HLSL is compiled at runtime via
 * d3dcompiler_47 and run on a real ID3D11Device; a GDI HUD reads
 * "Navier-Stokes fluid · 256^2 · <fps> fps".
 *
 * Pipeline (per frame): for each pass we bind the previous texture's SRV + a linear sampler,
 * render a full-screen triangle (SV_VertexID) into the next texture's RTV, then swap. The
 * advection/splat/pressure shaders all share a 16-byte-aligned constant buffer carrying grid
 * size, dt, mouse position + drag vector, splat color, and tuning. Final pass samples dye +
 * velocity for a curl-tinted, Reinhard-tonemapped image and Present()s via the DXGI swap chain.
 *
 * Engine APIs (./_gpu): createWindow, createDevice, compile, makeVertexShader/makePixelShader,
 * makeTexture (R16G16B16A16_FLOAT / R32_FLOAT, rtv+srv), makeSampler, makeConstantBuffer/
 * updateConstantBuffer, setRenderTargets/setViewport/clear, drawFullscreenTriangle, vsSet/psSet,
 * present, comRelease. GDI32 CreateFontW/TextOutW for the HUD.
 *
 * Run: bun run packages/all/example/fluid.ts
 */

import { GDI32, User32 } from '../index';
import * as gpu from './_gpu';

const encodeWide = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');

// DXGI formats the engine does not export.
const DXGI_FORMAT_R16G16_FLOAT = 34;

// ── Configuration ────────────────────────────────────────────────────────────
const WIDTH = 1280;
const HEIGHT = 800;
const SIM = 256; // simulation grid is SIM x SIM
const PRESSURE_ITERS = 36;
const VK_ESCAPE = 0x1b;

// ── Shared full-screen vertex shader (SV_VertexID, emits uv in [0,1]) ─────────
const VS_SOURCE = `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o;
  float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p;                                   // 0..2; the [0,1] region covers the screen
  o.pos = float4(p * float2(2.0, -2.0) + float2(-1.0, 1.0), 0.0, 1.0);
  return o;
}
`;

// Number of always-on ambient emitters that keep the canvas alive without input.
const EMITTERS = 3;

// Constant buffer (b0): 16-byte aligned, 176 bytes.
//   float2 texel       (1/SIM, 1/SIM)
//   float  dt
//   float  time
//   float2 mouse       (uv 0..1)
//   float2 mousePrev   (uv 0..1)
//   float4 splat       (rgb dye, w = splat radius)   — mouse splat color
//   float  velScale    (drag -> velocity gain)
//   float  dissipation (dye fade)
//   float  vorticity   (confinement strength)
//   float  active      (1 while dragging)
//   float4 emPos[3]    (xy = uv position, z = radius, w = swirl sign ±1)
//   float4 emVel[3]    (xy = injected velocity, z = color intensity, w unused)
//   float4 emCol[3]    (rgb = dye color, a = dye intensity)
//   float  ambient     (master ambient gain; 0 disables emitters, e.g. between seed and run)
const CB_SOURCE = `
#define EMITTERS ${EMITTERS}
cbuffer Sim : register(b0) {
  float2 texel;
  float  dt;
  float  time;
  float2 mouse;
  float2 mousePrev;
  float4 splat;       // rgb color, a = radius
  float  velScale;
  float  dissipation;
  float  vorticity;
  float  active;
  float4 emPos[EMITTERS];   // xy = uv pos, z = radius, w = swirl sign
  float4 emVel[EMITTERS];   // xy = velocity, z = color intensity
  float4 emCol[EMITTERS];   // rgb = color, a = dye intensity
  float  ambient;
  float3 _pad;
};
Texture2D    Src  : register(t0);
Texture2D    Src2 : register(t1);
SamplerState Smp  : register(s0);
`;

// (1) Advection — semi-Lagrangian backtrace through the velocity field.
//   t0 = velocity (the field we move along), t1 = the quantity being advected.
const PS_ADVECT = `${CB_SOURCE}
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 vel = Src.SampleLevel(Smp, uv, 0).xy;
  float2 coord = uv - dt * vel * texel;       // backtrace one step
  float4 q = Src2.SampleLevel(Smp, coord, 0);
  return q * dissipation;
}
`;

// (2) Splat dye — inject color from the always-on ambient emitters (so the canvas
//     is never empty) plus the mouse splat under the cursor while dragging.
//   t0 = dye field to add into.
const PS_SPLAT = `${CB_SOURCE}
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float4 base = Src.SampleLevel(Smp, uv, 0);
  float3 add = float3(0,0,0);

  // Always-on ambient emitters keep ink flowing with no interaction.
  [unroll] for (int i = 0; i < EMITTERS; ++i) {
    float2 d = uv - emPos[i].xy;
    float r = emPos[i].z;
    float fall = exp(-dot(d, d) / (r * r));
    add += emCol[i].rgb * (emCol[i].a * ambient) * fall;
  }

  // Mouse splat (only while dragging).
  if (active > 0.5) {
    float2 d = uv - mouse;
    float r = splat.a;
    float fall = exp(-dot(d, d) / (r * r));
    add += splat.rgb * fall;
  }

  return base + float4(add, 0.0);
}
`;

// (2b) Force splat — push velocity from the ambient emitters (tangential swirl so the
//     dye curls into vortices) plus the mouse drag direction.
//   t0 = velocity field to add into.
const PS_FORCE = `${CB_SOURCE}
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 base = Src.SampleLevel(Smp, uv, 0).xy;
  float2 add = float2(0,0);

  // Always-on ambient swirl: each emitter injects its (tangential) velocity.
  [unroll] for (int i = 0; i < EMITTERS; ++i) {
    float2 d = uv - emPos[i].xy;
    float r = emPos[i].z;
    float fall = exp(-dot(d, d) / (r * r));
    add += emVel[i].xy * ambient * fall;
  }

  // Mouse drag force (only while dragging).
  if (active > 0.5) {
    float2 d = uv - mouse;
    float r = splat.a;
    float fall = exp(-dot(d, d) / (r * r));
    float2 drag = (mouse - mousePrev) * velScale;
    add += drag * fall;
  }

  return float4(base + add, 0.0, 1.0);
}
`;

// (3) Curl — vorticity (scalar) = dVy/dx - dVx/dy, stored in .x.
const PS_CURL = `${CB_SOURCE}
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float l = Src.SampleLevel(Smp, uv - float2(texel.x, 0), 0).y;
  float r = Src.SampleLevel(Smp, uv + float2(texel.x, 0), 0).y;
  float b = Src.SampleLevel(Smp, uv - float2(0, texel.y), 0).x;
  float t = Src.SampleLevel(Smp, uv + float2(0, texel.y), 0).x;
  float curl = 0.5 * ((r - l) - (t - b));
  return float4(curl, 0, 0, 1);
}
`;

// (3b) Vorticity confinement — add a force that re-injects the small swirls advection eats.
//   t0 = velocity, t1 = curl.
const PS_VORTICITY = `${CB_SOURCE}
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 v = Src.SampleLevel(Smp, uv, 0).xy;
  float cl = Src2.SampleLevel(Smp, uv - float2(texel.x, 0), 0).x;
  float cr = Src2.SampleLevel(Smp, uv + float2(texel.x, 0), 0).x;
  float cb = Src2.SampleLevel(Smp, uv - float2(0, texel.y), 0).x;
  float ct = Src2.SampleLevel(Smp, uv + float2(0, texel.y), 0).x;
  float cc = Src2.SampleLevel(Smp, uv, 0).x;
  float2 grad = float2(abs(cr) - abs(cl), abs(ct) - abs(cb)) * 0.5;
  grad /= (length(grad) + 1e-5);
  float2 force = vorticity * float2(grad.y, -grad.x) * cc;
  return float4(v + force * dt, 0.0, 1.0);
}
`;

// (4) Divergence of the velocity field (scalar in .x).
const PS_DIVERGENCE = `${CB_SOURCE}
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float l = Src.SampleLevel(Smp, uv - float2(texel.x, 0), 0).x;
  float r = Src.SampleLevel(Smp, uv + float2(texel.x, 0), 0).x;
  float b = Src.SampleLevel(Smp, uv - float2(0, texel.y), 0).y;
  float t = Src.SampleLevel(Smp, uv + float2(0, texel.y), 0).y;
  float div = 0.5 * ((r - l) + (t - b));
  return float4(div, 0, 0, 1);
}
`;

// (5) Jacobi pressure iteration — t0 = pressure (x), t1 = divergence (x).
const PS_JACOBI = `${CB_SOURCE}
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float l = Src.SampleLevel(Smp, uv - float2(texel.x, 0), 0).x;
  float r = Src.SampleLevel(Smp, uv + float2(texel.x, 0), 0).x;
  float b = Src.SampleLevel(Smp, uv - float2(0, texel.y), 0).x;
  float t = Src.SampleLevel(Smp, uv + float2(0, texel.y), 0).x;
  float div = Src2.SampleLevel(Smp, uv, 0).x;
  float p = (l + r + b + t - div) * 0.25;
  return float4(p, 0, 0, 1);
}
`;

// (6) Subtract pressure gradient — make the velocity field divergence-free.
//   t0 = velocity, t1 = pressure.
const PS_GRADIENT = `${CB_SOURCE}
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float l = Src2.SampleLevel(Smp, uv - float2(texel.x, 0), 0).x;
  float r = Src2.SampleLevel(Smp, uv + float2(texel.x, 0), 0).x;
  float b = Src2.SampleLevel(Smp, uv - float2(0, texel.y), 0).x;
  float t = Src2.SampleLevel(Smp, uv + float2(0, texel.y), 0).x;
  float2 v = Src.SampleLevel(Smp, uv, 0).xy;
  v -= 0.5 * float2(r - l, t - b);
  return float4(v, 0.0, 1.0);
}
`;

// (7) Final display — palette/tonemap the dye, tinted by flow speed, with a soft bloom.
//   t0 = dye, t1 = velocity.
const PS_DISPLAY = `${CB_SOURCE}
float3 tonemap(float3 c) { return c / (c + 1.0); }
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float3 dye = max(Src.SampleLevel(Smp, uv, 0).rgb, 0.0);
  float2 vel = Src2.SampleLevel(Smp, uv, 0).xy;
  float speed = length(vel);

  // Cheap 5-tap bloom from the dye itself for a watery glow.
  float3 bloom = float3(0,0,0);
  bloom += Src.SampleLevel(Smp, uv + float2( texel.x,  texel.y) * 2.0, 0).rgb;
  bloom += Src.SampleLevel(Smp, uv + float2(-texel.x,  texel.y) * 2.0, 0).rgb;
  bloom += Src.SampleLevel(Smp, uv + float2( texel.x, -texel.y) * 2.0, 0).rgb;
  bloom += Src.SampleLevel(Smp, uv + float2(-texel.x, -texel.y) * 2.0, 0).rgb;
  bloom *= 0.25;

  float3 col = dye + bloom * 0.35;
  col += float3(0.06, 0.10, 0.16) * saturate(speed * 6.0);   // velocity sheen
  col = tonemap(col * 1.25);
  col = pow(col, 1.0 / 2.2);                                  // gamma

  // Subtle vignette frames the basin.
  float2 q = uv - 0.5;
  float vig = saturate(1.0 - dot(q, q) * 1.1);
  col *= lerp(0.65, 1.05, vig);
  return float4(col, 1.0);
}
`;

// ── Boot ───────────────────────────────────────────────────────────────────────
const win = gpu.createWindow({ title: 'Fluid — stir the ink', width: WIDTH, height: HEIGHT, borderless: true });
const { w: clientW, h: clientH } = win.clientSize();
const g = gpu.createDevice(win.hwnd, { width: clientW, height: clientH });

const VEL = gpu.DXGI_FORMAT_R16G16B16A16_FLOAT; // store vel/dye/curl/div/pressure in RGBA16F for simplicity + linear filtering
void DXGI_FORMAT_R16G16_FLOAT; // (kept documented; RGBA16F is used uniformly to avoid format-support edge cases)

// Ping-pong texture pair helper.
interface Pair {
  tex: [gpu.TextureResult, gpu.TextureResult];
  read: () => gpu.TextureResult;
  write: () => gpu.TextureResult;
  swap: () => void;
}
function makePair(format: number): Pair {
  const a = gpu.makeTexture({ w: SIM, h: SIM, format, rtv: true, srv: true });
  const b = gpu.makeTexture({ w: SIM, h: SIM, format, rtv: true, srv: true });
  let cur = 0;
  return {
    tex: [a, b],
    read: () => (cur === 0 ? a : b),
    write: () => (cur === 0 ? b : a),
    swap: () => {
      cur ^= 1;
    },
  };
}

const velocity = makePair(VEL);
const dye = makePair(VEL);
const pressure = makePair(VEL);
const divergence = gpu.makeTexture({ w: SIM, h: SIM, format: VEL, rtv: true, srv: true });
const curl = gpu.makeTexture({ w: SIM, h: SIM, format: VEL, rtv: true, srv: true });

const sampler = gpu.makeSampler({ filter: gpu.D3D11_FILTER_MIN_MAG_MIP_LINEAR, address: gpu.D3D11_TEXTURE_ADDRESS_CLAMP });

// Compile pipeline.
const vsCode = gpu.compile(VS_SOURCE, 'main', 'vs_5_0');
const vs = gpu.makeVertexShader(vsCode);

function ps(src: string): bigint {
  const code = gpu.compile(src, 'main', 'ps_5_0');
  const shader = gpu.makePixelShader(code);
  gpu.blobRelease(code.blob);
  return shader;
}
const psAdvect = ps(PS_ADVECT);
const psSplat = ps(PS_SPLAT);
const psForce = ps(PS_FORCE);
const psCurl = ps(PS_CURL);
const psVorticity = ps(PS_VORTICITY);
const psDivergence = ps(PS_DIVERGENCE);
const psJacobi = ps(PS_JACOBI);
const psGradient = ps(PS_GRADIENT);
const psDisplay = ps(PS_DISPLAY);

// cbuffer layout (bytes): 64 base + emPos[3] (48) + emVel[3] (48) + emCol[3] (48)
//   + ambient (4) + pad (12) = 224, already a multiple of 16.
const OFF_EM_POS = 64; // float4 emPos[3] -> 64, 80, 96
const OFF_EM_VEL = 112; // float4 emVel[3] -> 112, 128, 144
const OFF_EM_COL = 160; // float4 emCol[3] -> 160, 176, 192
const OFF_AMBIENT = 208; // float ambient
const CB_BYTES = 224;
const cb = gpu.makeConstantBuffer(CB_BYTES);
const cbData = Buffer.alloc(CB_BYTES);

// ── Render a single sim pass into `dst` sampling `srvs` ──────────────────────────
function pass(shader: bigint, dst: bigint, srvs: readonly bigint[]): void {
  gpu.setRenderTargets([dst]);
  gpu.setViewport(SIM, SIM);
  gpu.vsSet(vs);
  gpu.psSet(shader, { cb: [cb], srv: srvs, samp: [sampler] });
  gpu.drawFullscreenTriangle();
  gpu.setRenderTargets([]); // unbind so the just-written texture can be read next pass
}

// ── HUD font ─────────────────────────────────────────────────────────────────
const hudFont = GDI32.CreateFontW(-18, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4 /* ANTIALIASED */, 0, encodeWide('Consolas').ptr!);
const TRANSPARENT_BK = 1;
let fps = 0;
function drawHud(): void {
  const dc = User32.GetDC(win.hwnd);
  if (!dc) return;
  const prevFont = GDI32.SelectObject(dc, hudFont);
  GDI32.SetBkMode(dc, TRANSPARENT_BK);
  const line = `Navier-Stokes fluid · ${SIM}^2 · ${fps} fps · drag to stir · ESC to exit`;
  const text = encodeWide(line);
  GDI32.SetTextColor(dc, 0x00201810); // shadow (BGR)
  GDI32.TextOutW(dc, 19, 19, text.ptr!, line.length);
  GDI32.SetTextColor(dc, 0x00f5e8d8); // bright warm white
  GDI32.TextOutW(dc, 18, 18, text.ptr!, line.length);
  GDI32.SelectObject(dc, prevFont);
  User32.ReleaseDC(win.hwnd, dc);
}

console.log(`Fluid — GPU stable-fluids (${SIM}^2) on ${g.driver} (${g.gpuName}). Drag to stir. ESC to exit.`);

// ── Main loop ────────────────────────────────────────────────────────────────
const startTime = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
let prevTime = startTime;
let frames = 0;
let fpsWindowStart = startTime;

// Mouse tracking in sim-uv space (y flipped to match texture v).
let mUv = { x: 0.5, y: 0.5 };
let mPrevUv = { x: 0.5, y: 0.5 };

let cleanedUp = false;
function cleanup(code: number): never {
  if (!cleanedUp) {
    cleanedUp = true;
    GDI32.DeleteObject(hudFont);
    for (const s of [psAdvect, psSplat, psForce, psCurl, psVorticity, psDivergence, psJacobi, psGradient, psDisplay, vs]) gpu.comRelease(s);
    gpu.blobRelease(vsCode.blob);
    gpu.comRelease(cb);
    gpu.comRelease(sampler);
    for (const p of [velocity, dye, pressure]) {
      for (const t of p.tex) {
        gpu.comRelease(t.srv!);
        gpu.comRelease(t.rtv!);
        gpu.comRelease(t.tex);
      }
    }
    for (const t of [divergence, curl]) {
      gpu.comRelease(t.srv!);
      gpu.comRelease(t.rtv!);
      gpu.comRelease(t.tex);
    }
    gpu.comRelease(g.backBufferRTV);
    gpu.comRelease(g.swapChain);
    gpu.comRelease(g.context);
    gpu.comRelease(g.device);
    win.destroy();
  }
  process.exit(code);
}
process.on('SIGINT', () => cleanup(0));

// ── Ambient emitters ─────────────────────────────────────────────────────────
// A handful of slowly orbiting emitters that always inject color + tangential
// (swirling) velocity, so the canvas is full of moving ink even with no input.
interface Emitter {
  cx: number; // orbit center (uv)
  cy: number;
  rx: number; // orbit radii (uv)
  ry: number;
  rate: number; // orbital angular speed (rad/s)
  phase: number; // orbital phase offset
  huePhase: number; // color-cycle phase offset
  radius: number; // splat radius (uv)
  swirl: 1 | -1; // rotation sense of the injected vortex
}
const emitters: readonly Emitter[] = [
  { cx: 0.34, cy: 0.4, rx: 0.16, ry: 0.13, rate: 0.5, phase: 0.0, huePhase: 0.0, radius: 0.085, swirl: 1 },
  { cx: 0.66, cy: 0.58, rx: 0.15, ry: 0.17, rate: -0.41, phase: 2.1, huePhase: 2.094, radius: 0.08, swirl: -1 },
  { cx: 0.5, cy: 0.5, rx: 0.22, ry: 0.1, rate: 0.31, phase: 4.0, huePhase: 4.188, radius: 0.075, swirl: 1 },
];
if (emitters.length !== EMITTERS) throw new Error(`emitters.length (${emitters.length}) must equal EMITTERS (${EMITTERS}).`);

// Vivid sin-palette color in [0,1]^3 for a given hue phase.
function palette(phase: number): [number, number, number] {
  return [0.5 + 0.5 * Math.sin(phase + 0.0), 0.5 + 0.5 * Math.sin(phase + 2.094), 0.5 + 0.5 * Math.sin(phase + 4.188)];
}

// Pack the per-emitter blocks into cbData for time `t`. `colorGain`/`velGain` scale
// the injected dye intensity and swirl velocity; `ambientGain` is the master switch.
function packEmitters(t: number, colorGain: number, velGain: number, ambientGain: number): void {
  for (let i = 0; i < emitters.length; i += 1) {
    const e = emitters[i]!;
    const ang = t * e.rate + e.phase;
    // Position on the orbit.
    const px = e.cx + e.rx * Math.cos(ang);
    const py = e.cy + e.ry * Math.sin(ang);
    // Orbital velocity direction (tangent); the injected force is that tangent
    // rotated 90° by the swirl sign, which seeds a rotating vortex around the blob.
    const tx = -e.rx * Math.sin(ang) * e.rate;
    const ty = e.ry * Math.cos(ang) * e.rate;
    const sx = -ty * e.swirl;
    const sy = tx * e.swirl;
    const [r, gC, b] = palette(t * 0.35 + e.huePhase);

    const pOff = OFF_EM_POS + i * 16;
    cbData.writeFloatLE(px, pOff + 0);
    cbData.writeFloatLE(py, pOff + 4);
    cbData.writeFloatLE(e.radius, pOff + 8);
    cbData.writeFloatLE(e.swirl, pOff + 12);

    const vOff = OFF_EM_VEL + i * 16;
    cbData.writeFloatLE(sx * velGain, vOff + 0);
    cbData.writeFloatLE(sy * velGain, vOff + 4);
    cbData.writeFloatLE(0, vOff + 8);
    cbData.writeFloatLE(0, vOff + 12);

    const cOff = OFF_EM_COL + i * 16;
    cbData.writeFloatLE(r, cOff + 0);
    cbData.writeFloatLE(gC, cOff + 4);
    cbData.writeFloatLE(b, cOff + 8);
    cbData.writeFloatLE(colorGain, cOff + 12);
  }
  cbData.writeFloatLE(ambientGain, OFF_AMBIENT);
}

// Dissipation lives at cbuffer offset 52 and is shared by PS_ADVECT for whatever it
// is advecting. Velocity needs a touch more damping than dye so that the always-on
// forcing reaches a calm equilibrium instead of accumulating into runaway flow that
// would advect the dye straight off-screen.
const OFF_DISSIPATION = 52;
const VEL_DISSIPATION = 0.985; // velocity advect damping
const DYE_DISSIPATION = 0.998; // dye advect damping (slow, smoky fade)
function setDissipation(value: number): void {
  cbData.writeFloatLE(value, OFF_DISSIPATION);
  gpu.updateConstantBuffer(cb, cbData);
}

// Run one full Navier-Stokes step (no present). cbData must already be packed.
function simStep(): void {
  setDissipation(VEL_DISSIPATION);

  // (1) Advect velocity through itself.
  pass(psAdvect, velocity.write().rtv!, [velocity.read().srv!, velocity.read().srv!]);
  velocity.swap();

  // (2b) Add ambient + drag force to velocity.
  pass(psForce, velocity.write().rtv!, [velocity.read().srv!]);
  velocity.swap();

  // (3) Curl + vorticity confinement.
  pass(psCurl, curl.rtv!, [velocity.read().srv!]);
  pass(psVorticity, velocity.write().rtv!, [velocity.read().srv!, curl.srv!]);
  velocity.swap();

  // (4) Divergence of velocity.
  pass(psDivergence, divergence.rtv!, [velocity.read().srv!]);

  // (5) Jacobi pressure solve (clear pressure first for a clean start).
  gpu.clear(pressure.read().rtv!, [0, 0, 0, 0]);
  for (let i = 0; i < PRESSURE_ITERS; i += 1) {
    pass(psJacobi, pressure.write().rtv!, [pressure.read().srv!, divergence.srv!]);
    pressure.swap();
  }

  // (6) Subtract pressure gradient -> divergence-free velocity.
  pass(psGradient, velocity.write().rtv!, [velocity.read().srv!, pressure.read().srv!]);
  velocity.swap();

  // (2) Splat dye color (ambient + mouse), then (7) advect dye through the field.
  // Switch to the gentler dye dissipation so colour lingers as smoky filaments.
  setDissipation(DYE_DISSIPATION);
  pass(psSplat, dye.write().rtv!, [dye.read().srv!]);
  dye.swap();
  pass(psAdvect, dye.write().rtv!, [velocity.read().srv!, dye.read().srv!]);
  dye.swap();
}

// Pack the non-emitter base fields of the constant buffer.
function packBase(dt: number, t: number, active: number, splatColor: [number, number, number]): void {
  cbData.writeFloatLE(1 / SIM, 0); // texel.x
  cbData.writeFloatLE(1 / SIM, 4); // texel.y
  cbData.writeFloatLE(dt * 60.0, 8); // dt (scaled to grid units / frame)
  cbData.writeFloatLE(t, 12); // time
  cbData.writeFloatLE(mUv.x, 16); // mouse.x
  cbData.writeFloatLE(mUv.y, 20); // mouse.y
  cbData.writeFloatLE(mPrevUv.x, 24); // mousePrev.x
  cbData.writeFloatLE(mPrevUv.y, 28); // mousePrev.y
  cbData.writeFloatLE(splatColor[0], 32); // splat.r
  cbData.writeFloatLE(splatColor[1], 36); // splat.g
  cbData.writeFloatLE(splatColor[2], 40); // splat.b
  cbData.writeFloatLE(0.06, 44); // splat radius (uv)
  cbData.writeFloatLE(900.0, 48); // velScale (drag uv -> velocity)
  cbData.writeFloatLE(DYE_DISSIPATION, 52); // dissipation (overridden per-advect in simStep)
  cbData.writeFloatLE(3.5, 56); // vorticity confinement strength (calmer: too high makes flow blow up)
  cbData.writeFloatLE(active, 60); // active flag
}

// Clear all fields to zero up front.
for (const p of [velocity, dye, pressure]) {
  for (const t of p.tex) gpu.clear(t.rtv!, [0, 0, 0, 0]);
}
gpu.clear(divergence.rtv!, [0, 0, 0, 0]);
gpu.clear(curl.rtv!, [0, 0, 0, 0]);

// ── Seed: fill the basin with vivid swirling ink BEFORE the first present so the
//    screen is gorgeous from frame one. Strong emitter color + swirl, several steps.
const SEED_STEPS = 22;
const SEED_DT = 1 / 60;
for (let s = 0; s < SEED_STEPS; s += 1) {
  const ts = s * SEED_DT;
  packBase(SEED_DT, ts, 0, [0, 0, 0]);
  // Strong color so the disk fills fast, with a moderate swirl velocity. velGain
  // must stay modest: the force splat ADDS to velocity every step, so a large gain
  // compounds into runaway flow that advects the dye straight off-screen.
  packEmitters(ts, 0.5, 40.0, 1.0);
  simStep();
}

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;
  if (win.keyDown(VK_ESCAPE)) break;

  const now = performance.now();
  const dtRaw = (now - prevTime) / 1000;
  prevTime = now;
  const dt = Math.min(dtRaw, 1 / 30); // clamp to keep the sim stable on stalls
  const t = (now - startTime) / 1000;

  // Mouse -> sim uv (texture v grows downward, same as window y).
  const m = win.getMouse();
  mPrevUv = mUv;
  mUv = { x: m.x / clientW, y: m.y / clientH };
  const active = m.down ? 1 : 0;

  // Color cycles through a vivid palette as you drag.
  const [cr, cg, cb3] = palette(t * 0.7);

  // Pack the constant buffer immediately before the passes that read it: base
  // fields + a gentle continuous ambient injection that keeps the ink alive.
  packBase(dt, t, active, [cr * 0.55, cg * 0.55, cb3 * 0.55]);
  packEmitters(t, 0.08, 14.0, 1.0);
  simStep();

  // Final display pass -> back buffer.
  gpu.setRenderTargets([g.backBufferRTV]);
  gpu.setViewport(clientW, clientH);
  gpu.clear(g.backBufferRTV, [0.01, 0.012, 0.02, 1]);
  gpu.vsSet(vs);
  gpu.psSet(psDisplay, { cb: [cb], srv: [dye.read().srv!, velocity.read().srv!], samp: [sampler] });
  gpu.drawFullscreenTriangle();
  gpu.setRenderTargets([]);

  g.present(false);
  drawHud();

  frames += 1;
  if (now - fpsWindowStart >= 500) {
    fps = Math.round((frames * 1000) / (now - fpsWindowStart));
    frames = 0;
    fpsWindowStart = now;
  }

  if (durationMs > 0 && now - startTime >= durationMs) break;
}

cleanup(0);
