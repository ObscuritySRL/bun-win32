/**
 * Particle Galaxy — ONE MILLION particles, alive, in pure TypeScript.
 *
 * A borderless 1280x720 window fills with a living, slowly rotating spiral galaxy:
 * 1,048,576 GPU particles seeded into a thin disk with orbital velocity, swirling
 * around a brilliant white-hot core, trailing cool-blue filaments out to warm-amber
 * arms. Every frame a compute shader integrates each particle on the GPU —
 * Newtonian central gravity toward the core for the orbital motion, curl-noise
 * turbulence for the wispy filaments, gentle damping, and a mouse "black-hole"
 * attractor: hold the LEFT mouse button and the whole galaxy streams toward the
 * cursor in world space. Particles that fall into the core are respawned out on the
 * rim. The positions are then drawn with NO vertex buffer — a vertex shader fetches
 * each particle from the position StructuredBuffer by SV_VertexID, projects it
 * through an auto-rotating 3D camera, and emits a POINTLIST; a pixel shader colors
 * by speed and depth (cool core-velocity blue → warm rim amber) and accumulates
 * with pure-additive ONE/ONE blending into an HDR R16G16B16A16_FLOAT target. A final
 * fullscreen pass applies a soft bloom-feel threshold/spread plus Reinhard tonemap
 * and gamma to the swap-chain back buffer. A GDI HUD reads
 * "1,048,576 particles · <fps> fps · GPU: <name>".
 *
 * Pipeline (per frame, ~60 fps off a PeekMessage pump):
 *   1. updateConstantBuffer(sim cb)         — dt, time, mouse world pos + button, rotation
 *   2. csSet(integrate, { cb, uav:[pos,vel] }) → dispatch(count/256)  — gravity + curl + attractor
 *   3. render HDR target: setBlendState(additive) → vsSetShaderResources([posSRV]) →
 *      vsSet/psSet → drawPoints(count)       — SV_VertexID point cloud, additive glow
 *   4. fullscreen bloom/tonemap PS: sample HDR SRV → drawFullscreenTriangle() → back buffer
 *   5. present + GDI TextOutW HUD
 *
 * @bun-win32 / engine APIs used (from ./_gpu): createWindow, createDevice, compile,
 *   makeComputeShader / makeVertexShader / makePixelShader, makeStructuredBuffer
 *   (UAV+SRV, initialData seeding), makeTexture (HDR RTV+SRV), makeSampler,
 *   makeConstantBuffer / updateConstantBuffer, makeAdditiveBlendState / setBlendState,
 *   csSet / dispatch, vsSetShaderResources / vsSet / psSet / drawPoints,
 *   setRenderTargets / setViewport / clear / drawFullscreenTriangle, present,
 *   comRelease / blobRelease. GDI32 CreateFontW/TextOutW HUD.
 *
 * Run: bun run packages/all/example/particle-galaxy.ts
 */

import { GDI32, User32 } from '../index';
import { VirtualKey } from '@bun-win32/user32';
import * as gpu from './_gpu';

const encodeWide = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');

const WIDTH = 1280;
const HEIGHT = 720;

// 1024 × 1024 = 1,048,576 particles. numthreads(256) → count/256 groups.
const PARTICLE_SIDE = 1024;
const PARTICLE_COUNT = PARTICLE_SIDE * PARTICLE_SIDE;
const THREADS_PER_GROUP = 256;
const GROUPS = PARTICLE_COUNT / THREADS_PER_GROUP;

// World-space disk radius the galaxy occupies (camera/projection tuned around this).
const GALAXY_RADIUS = 9.0;

// ── Window + device ─────────────────────────────────────────────────────────
const win = gpu.createWindow({ title: 'Particle Galaxy — 1,048,576 particles in pure TypeScript', width: WIDTH, height: HEIGHT, borderless: true });
const { w: clientW, h: clientH } = win.clientSize();
const dev = gpu.createDevice(win.hwnd, { width: clientW, height: clientH });

console.log('Particle Galaxy — one million GPU particles, integrated and rendered in pure TypeScript.');
console.log(`  ${PARTICLE_COUNT.toLocaleString()} particles · ${dev.driver} · ${dev.gpuName}`);
console.log('  Hold LEFT MOUSE to drag a black-hole attractor · ESC to exit.\n');

// ── Gravity constants — the seed velocity and the shader gravity MUST agree ──────
// Softened central gravity: a(r) = GM * r / (r^2 + soft^2)^1.5 (toward the core).
// The circular-orbit speed that exactly balances that acceleration is
//   v_circ(r) = sqrt(a(r) * r) = r * sqrt(GM) / (r^2 + soft^2)^0.75.
// Seeding every particle at v_circ gives stable orbits → a rotating disk, not a
// collapsing line. These three numbers are tuned together so the disk holds.
const GM = 9.0; // central mass × G
const SOFT = 1.1; // gravitational softening (kills the central singularity)
function circularSpeed(r: number): number {
  return (r * Math.sqrt(GM)) / Math.pow(r * r + SOFT * SOFT, 0.75);
}

// ── Seed the two structured buffers: positions (float4) + velocities (float4) ──
// A thin spiral disk plus a denser central bulge. Disk radius is drawn so density
// falls off outward (r = R·sqrt(rand) → area-uniform), a fraction of stars form a
// concentrated bulge near the core, two logarithmic arms emerge from an angular
// bias, the thickness is small (thin disk), and every particle gets the exact
// tangential orbital velocity so it ORBITS rather than falling in. A deterministic
// LCG keeps the seed reproducible run-to-run.
const posSeed = Buffer.alloc(PARTICLE_COUNT * 16);
const velSeed = Buffer.alloc(PARTICLE_COUNT * 16);
{
  let s = 0x1234abcd >>> 0;
  const rand = (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x1_0000_0000;
  };
  const gauss = (): number => rand() + rand() + rand() - 1.5; // ~N(0, .5), cheap
  const ARMS = 2;
  const BULGE_FRACTION = 0.28; // share of stars forming the dense central bulge
  const ARM_WINDING = 0.9; // log-spiral tightness (radians of twist per unit r)
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    let r: number;
    let theta: number;
    if (rand() < BULGE_FRACTION) {
      // Central bulge: small radius, roughly spheroidal, no arm structure.
      r = GALAXY_RADIUS * 0.16 * Math.pow(rand(), 0.7);
      theta = rand() * Math.PI * 2;
    } else {
      // Disk: r = R·sqrt(rand) gives a flat, area-uniform disk (density ∝ 1/r tail
      // trimmed by the arm concentration). Two log-spiral arms via an angular bias.
      r = GALAXY_RADIUS * Math.sqrt(rand());
      const arm = Math.floor(rand() * ARMS);
      const armBase = (arm / ARMS) * Math.PI * 2;
      const spiral = Math.log(1 + r) * ARM_WINDING * (Math.PI * 2);
      // Tight scatter around the arm centerline; a touch wider near the core.
      const scatter = gauss() * (0.35 + 0.5 / (1 + r));
      theta = armBase + spiral + scatter;
    }
    // Thin disk: small vertical thickness that thins outward; bulge is puffier.
    const thickness = 0.10 * GALAXY_RADIUS * (0.18 + 0.6 / (1 + r));
    const y = gauss() * thickness;

    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    const o = i * 16;
    posSeed.writeFloatLE(x, o + 0);
    posSeed.writeFloatLE(y, o + 4);
    posSeed.writeFloatLE(z, o + 8);
    posSeed.writeFloatLE(r, o + 12); // w = spawn radius (used for respawn + tint)

    // Tangential orbital velocity perpendicular to the radius in the XZ plane,
    // set to the exact circular speed for the softened gravity → stable orbits.
    const speed = circularSpeed(r);
    const tx = -Math.sin(theta) * speed;
    const tz = Math.cos(theta) * speed;
    velSeed.writeFloatLE(tx, o + 0);
    velSeed.writeFloatLE(gauss() * 0.01, o + 4); // tiny vertical jitter
    velSeed.writeFloatLE(tz, o + 8);
    velSeed.writeFloatLE(speed, o + 12); // w = speed (for the color ramp)
  }
}

const posBuf = gpu.makeStructuredBuffer({ stride: 16, count: PARTICLE_COUNT, uav: true, srv: true, initialData: posSeed });
const velBuf = gpu.makeStructuredBuffer({ stride: 16, count: PARTICLE_COUNT, uav: true, srv: true, initialData: velSeed });

// ── HDR accumulation target (additive blending lands here, then we bloom/tonemap) ──
const hdr = gpu.makeTexture({ w: clientW, h: clientH, format: gpu.DXGI_FORMAT_R16G16B16A16_FLOAT, rtv: true, srv: true });
const sampler = gpu.makeSampler({ filter: gpu.D3D11_FILTER_MIN_MAG_MIP_LINEAR, address: gpu.D3D11_TEXTURE_ADDRESS_CLAMP });
const additiveBlend = gpu.makeAdditiveBlendState(true);

// ── Constant buffers ──────────────────────────────────────────────────────────
// Sim CB (compute): float4 mouse(x,y,z, buttonDown); float4 params(dt, time, GM, attractStrength);
// float4 grav(soft, dampPerSec, curlStrength, _).
const SIM_CB_SIZE = 48;
const simCb = gpu.makeConstantBuffer(SIM_CB_SIZE);
const simData = Buffer.alloc(SIM_CB_SIZE);

// Render CB (VS+PS): float4x4 viewProj (64) + float4 viewParams(pointBoost, count_unused, time, _) = 80 bytes.
const REND_CB_SIZE = 80;
const rendCb = gpu.makeConstantBuffer(REND_CB_SIZE);
const rendData = Buffer.alloc(REND_CB_SIZE);

// Post CB: float4 (texelW, texelH, exposure, time).
const POST_CB_SIZE = 16;
const postCb = gpu.makeConstantBuffer(POST_CB_SIZE);
const postData = Buffer.alloc(POST_CB_SIZE);

// ── Shaders ─────────────────────────────────────────────────────────────────
// COMPUTE: integrate each particle. Central gravity toward 0, curl-noise swirl,
// optional mouse black-hole attractor, damping, and respawn for swallowed stars.
const CS_SRC = `
cbuffer Sim : register(b0) {
  float4 gMouse;   // xyz = attractor world pos, w = button down (0/1)
  float4 gParams;  // x = dt, y = time, z = GM, w = attractStrength
  float4 gGrav;    // x = soft, y = dampPerSec, z = curlStrength, w = unused
};
RWStructuredBuffer<float4> Pos : register(u0);
RWStructuredBuffer<float4> Vel : register(u1);

// Cheap hash-based gradient noise → curl field for turbulence.
float3 hash33(float3 p) {
  p = float3(dot(p, float3(127.1, 311.7, 74.7)),
             dot(p, float3(269.5, 183.3, 246.1)),
             dot(p, float3(113.5, 271.9, 124.6)));
  return frac(sin(p) * 43758.5453) * 2.0 - 1.0;
}
float noise3(float3 p) {
  float3 i = floor(p);
  float3 f = frac(p);
  float3 u = f * f * (3.0 - 2.0 * f);
  float n = 0.0;
  [unroll] for (int dx = 0; dx <= 1; dx++)
  [unroll] for (int dy = 0; dy <= 1; dy++)
  [unroll] for (int dz = 0; dz <= 1; dz++) {
    float3 g = float3(dx, dy, dz);
    float3 h = hash33(i + g);
    float w = lerp(1.0 - u.x, u.x, g.x) * lerp(1.0 - u.y, u.y, g.y) * lerp(1.0 - u.z, u.z, g.z);
    n += dot(h, f - g) * w;
  }
  return n;
}
float3 curl(float3 p) {
  const float e = 0.35;
  float3 dx = float3(e, 0, 0), dy = float3(0, e, 0), dz = float3(0, 0, e);
  float x1 = noise3(p + dy) - noise3(p - dy);
  float x2 = noise3(p + dz) - noise3(p - dz);
  float y1 = noise3(p + dz) - noise3(p - dz);
  float y2 = noise3(p + dx) - noise3(p - dx);
  float z1 = noise3(p + dx) - noise3(p - dx);
  float z2 = noise3(p + dy) - noise3(p - dy);
  return float3(x1 - x2, y1 - y2, z1 - z2) / (2.0 * e);
}

[numthreads(${THREADS_PER_GROUP}, 1, 1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint i = id.x;
  float4 P = Pos[i];
  float4 V = Vel[i];
  float dt = gParams.x;
  float t = gParams.y;

  float3 p = P.xyz;
  float3 v = V.xyz;

  float GM = gParams.z;
  float soft = gGrav.x;

  // Softened central gravity: a = -GM * pos / (r^2 + soft^2)^1.5. The softening
  // removes the 1/r^2 singularity at the core so orbits stay stable instead of
  // collapsing to a line. Seed velocities are the exact circular speed for this.
  float r2 = dot(p, p);
  float denom = pow(r2 + soft * soft, 1.5);
  v += (-GM * p / denom) * dt;

  // Curl-noise turbulence — SMALL perturbation only (gGrav.z keeps it weak) so the
  // arms get a wispy, filamentary texture without overpowering the orbital flow.
  float3 cn = curl(p * 0.14 + float3(0, t * 0.04, 0));
  float turb = gGrav.z / (1.0 + length(p) * 0.25);
  v += cn * turb * dt;

  // Mouse black-hole attractor (only while the button is held).
  if (gMouse.w > 0.5) {
    float3 toM = gMouse.xyz - p;
    float md2 = dot(toM, toM) + 0.4;
    float3 dir = toM * rsqrt(md2);
    v += dir * (gParams.w / md2) * dt * 40.0;
  }

  // Very gentle damping keeps the system from heating up over long runs.
  v *= (1.0 - gGrav.y * dt);

  p += v * dt;

  // Respawn particles that fall deep into the core: place them back out near their
  // spawn radius on a fresh circular orbit (exact circular speed, tangential).
  float dist = length(p);
  if (dist < soft * 0.25) {
    float ang = frac(sin(float(i) * 12.9898 + t) * 43758.5453) * 6.2831853;
    float rr = max(P.w, 0.5) * (0.8 + 0.2 * frac(sin(float(i) * 78.233) * 12345.6789));
    float yy = (frac(float(i) * 0.013) - 0.5) * 0.15;
    p = float3(cos(ang) * rr, yy, sin(ang) * rr);
    float spd = rr * sqrt(GM) / pow(rr * rr + soft * soft, 0.75);
    v = float3(-sin(ang) * spd, 0, cos(ang) * spd);
  }

  Pos[i] = float4(p, P.w);
  Vel[i] = float4(v, length(v));
}
`;

// VERTEX SHADER: fetch the particle by SV_VertexID from the position SRV, project
// through the auto-rotating camera, emit a screen-space point. Carries speed + a
// distance-to-core term to the pixel stage for the color ramp. PSIZE is unused on
// D3D11 (points are 1px), so each particle is a single bright additive dot.
const VS_SRC = `
cbuffer Rend : register(b0) {
  float4x4 gViewProj;
  float4 gViewParams; // x = pointBoost, z = time
};
StructuredBuffer<float4> Pos : register(t0);
StructuredBuffer<float4> Vel : register(t1);

struct VSOut {
  float4 pos : SV_Position;
  float  speed : TEXCOORD0;
  float  coreT : TEXCOORD1; // 0 at core → 1 at rim
};

VSOut main(uint vid : SV_VertexID) {
  VSOut o;
  float4 P = Pos[vid];
  float speed = Vel[vid].w;
  o.pos = mul(gViewProj, float4(P.xyz, 1.0));
  o.speed = speed;
  o.coreT = saturate(length(P.xyz) / ${GALAXY_RADIUS.toFixed(1)});
  return o;
}
`;

// PIXEL SHADER for the points: HDR color by speed + radius. The dense, fast core
// runs hot blue-white; the slower outer arms cool to amber/red. Output is additive
// into the float HDR target so overlapping particles bloom into a luminous core.
const PS_POINTS_SRC = `
struct VSOut {
  float4 pos : SV_Position;
  float  speed : TEXCOORD0;
  float  coreT : TEXCOORD1;
};

float3 spectral(float coreT, float speed) {
  // Core: blue-white. Mid: cyan→white. Rim: amber→deep red.
  float3 core = float3(0.55, 0.75, 1.25);
  float3 mid  = float3(0.95, 0.85, 0.70);
  float3 rim  = float3(1.10, 0.42, 0.16);
  float3 c = lerp(core, mid, smoothstep(0.0, 0.45, coreT));
  c = lerp(c, rim, smoothstep(0.45, 1.0, coreT));
  // Fast streams glow brighter and a touch hotter (toward white).
  c += float3(0.25, 0.25, 0.30) * saturate(speed * 0.5);
  return c;
}

float4 main(VSOut i) : SV_Target {
  float3 c = spectral(i.coreT, i.speed);
  // Per-particle brightness: brighter near the core so it reads as a hot nucleus.
  float lum = lerp(0.85, 0.18, smoothstep(0.0, 1.0, i.coreT)) + 0.10 * saturate(i.speed);
  return float4(c * lum, 1.0);
}
`;

// FULLSCREEN BLOOM + TONEMAP: sample the HDR target, lift the bright pixels with a
// small separable-ish blur (a compact gather), Reinhard-tonemap and gamma-correct
// into the swap-chain back buffer. Gives the galaxy its glowing, photographic feel.
const PS_POST_SRC = `
cbuffer Post : register(b0) { float4 gP; }; // x = texelW, y = texelH, z = exposure, w = time
Texture2D Hdr : register(t0);
SamplerState Smp : register(s0);

float3 sampleHdr(float2 uv) { return Hdr.SampleLevel(Smp, uv, 0).rgb; }

float3 bloom(float2 uv) {
  float2 tx = gP.xy;
  float3 b = 0.0.xxx;
  float wsum = 0.0;
  // 13-tap dilated gather → cheap wide glow that picks up the bright core/arms.
  const int N = 6;
  [unroll] for (int k = -N; k <= N; k++) {
    float fw = exp(-float(k * k) / 18.0);
    b += sampleHdr(uv + float2(tx.x * float(k) * 2.5, 0.0)) * fw;
    b += sampleHdr(uv + float2(0.0, tx.y * float(k) * 2.5)) * fw;
    wsum += fw * 2.0;
  }
  b /= wsum;
  // Diagonal smear for a softer, rounder bloom.
  b += sampleHdr(uv + tx * 3.0) * 0.5;
  b += sampleHdr(uv - tx * 3.0) * 0.5;
  return b * 0.5;
}

float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float3 hdr = sampleHdr(uv);
  // Threshold the bloom source so only luminous regions spread.
  float3 bl = bloom(uv);
  float3 brightOnly = max(bl - 0.35.xxx, 0.0.xxx);
  float3 col = hdr + brightOnly * 1.35;

  col *= gP.z; // exposure

  // Subtle deep-space vignette so the corners fall to near-black.
  float2 q = uv - 0.5;
  float vig = smoothstep(0.95, 0.25, dot(q, q) * 1.6);
  col *= lerp(0.55, 1.0, vig);

  // Reinhard tonemap + gamma.
  col = col / (col + 1.0.xxx);
  col = pow(col, (1.0 / 2.2).xxx);
  return float4(col, 1.0);
}
`;

// Fullscreen-triangle VS (SV_VertexID, no IA) for the post pass.
const VS_FULLSCREEN_SRC = `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o;
  float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p;
  o.pos = float4(p * float2(2.0, -2.0) + float2(-1.0, 1.0), 0.0, 1.0);
  return o;
}
`;

const csCode = gpu.compile(CS_SRC, 'main', 'cs_5_0');
const vsCode = gpu.compile(VS_SRC, 'main', 'vs_5_0');
const psPointsCode = gpu.compile(PS_POINTS_SRC, 'main', 'ps_5_0');
const vsFullscreenCode = gpu.compile(VS_FULLSCREEN_SRC, 'main', 'vs_5_0');
const psPostCode = gpu.compile(PS_POST_SRC, 'main', 'ps_5_0');

const csIntegrate = gpu.makeComputeShader(csCode);
const vsPoints = gpu.makeVertexShader(vsCode);
const psPoints = gpu.makePixelShader(psPointsCode);
const vsFullscreen = gpu.makeVertexShader(vsFullscreenCode);
const psPost = gpu.makePixelShader(psPostCode);

// ── Camera: a fixed perspective looking down at a tilted, auto-rotating disk ──
// Build a column-major-friendly view*projection matrix on the CPU each frame.
function mul4(a: number[], b: number[]): number[] {
  const r = new Array<number>(16).fill(0);
  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < 4; j += 1) {
      let sum = 0;
      for (let k = 0; k < 4; k += 1) sum += a[i * 4 + k]! * b[k * 4 + j]!;
      r[i * 4 + j] = sum;
    }
  }
  return r;
}

// Left-handed look-at (D3D convention): forward (+z in view space) points from the
// eye toward the center, so a point in front of the camera has positive view-space z
// — which is exactly what the left-handed projection below expects. Returned ROW-MAJOR
// (the matrix is transposed on upload so HLSL's default column-major cbuffer read
// recovers it, and mul(M, v) then computes M·v correctly).
function lookAt(eye: [number, number, number], center: [number, number, number], up: [number, number, number]): number[] {
  // zaxis = normalize(center - eye)  (view forward, +z)
  let zx = center[0] - eye[0];
  let zy = center[1] - eye[1];
  let zz = center[2] - eye[2];
  const zl = Math.hypot(zx, zy, zz);
  zx /= zl;
  zy /= zl;
  zz /= zl;
  // xaxis = normalize(up × zaxis)  (view right)
  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  const xl = Math.hypot(xx, xy, xz);
  xx /= xl;
  xy /= xl;
  xz /= xl;
  // yaxis = zaxis × xaxis  (view up)
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  return [
    xx, xy, xz, -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    yx, yy, yz, -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    zx, zy, zz, -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
    0, 0, 0, 1,
  ];
}

// Left-handed perspective, D3D depth range [0,1]. Pairs with the left-handed view
// above. Row-major (transposed on upload).
function perspective(fovY: number, aspect: number, near: number, far: number): number[] {
  const ff = 1 / Math.tan(fovY / 2);
  const range = far / (far - near);
  return [
    ff / aspect, 0, 0, 0,
    0, ff, 0, 0,
    0, 0, range, -near * range,
    0, 0, 1, 0,
  ];
}

// ── GDI HUD font ──────────────────────────────────────────────────────────────
const hudFont = GDI32.CreateFontW(-19, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4 /* ANTIALIASED_QUALITY */, 0, encodeWide('Consolas').ptr!);
const TRANSPARENT_BK = 1;
const particleLabel = PARTICLE_COUNT.toLocaleString();

function drawHud(fps: number): void {
  const dc = User32.GetDC(win.hwnd);
  if (!dc) return;
  const prevFont = GDI32.SelectObject(dc, hudFont);
  GDI32.SetBkMode(dc, TRANSPARENT_BK);
  const line = `${particleLabel} particles · ${fps} fps · GPU: ${dev.gpuName}`;
  const text = encodeWide(line);
  const len = line.length;
  GDI32.SetTextColor(dc, 0x00100804); // dark shadow (BGR)
  GDI32.TextOutW(dc, 19, 19, text.ptr!, len);
  GDI32.SetTextColor(dc, 0x00f0d8b0); // warm icy-white
  GDI32.TextOutW(dc, 18, 18, text.ptr!, len);
  GDI32.SelectObject(dc, prevFont);
  User32.ReleaseDC(win.hwnd, dc);
}

// ── Render loop ─────────────────────────────────────────────────────────────
const startTime = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
let frames = 0;
let fps = 0;
let fpsWindowStart = startTime;
let lastFrameTime = startTime;
let dispatched = false;
let presented = 0;

// Mouse-attractor world position lags the on-screen cursor.
let attractWX = 0;
let attractWY = 0;
let attractWZ = 0;

const aspect = clientW / clientH;
const proj = perspective((48 * Math.PI) / 180, aspect, 0.1, 100);

let cleanedUp = false;
function cleanup(code: number): never {
  if (!cleanedUp) {
    cleanedUp = true;
    // Unbind UAVs/SRVs to avoid in-use warnings, then release everything.
    try {
      gpu.setBlendState(0n);
      GDI32.DeleteObject(hudFont);
      gpu.comRelease(additiveBlend);
      gpu.comRelease(sampler);
      gpu.comRelease(hdr.srv ?? 0n);
      gpu.comRelease(hdr.rtv ?? 0n);
      gpu.comRelease(hdr.tex);
      gpu.comRelease(psPost);
      gpu.comRelease(vsFullscreen);
      gpu.comRelease(psPoints);
      gpu.comRelease(vsPoints);
      gpu.comRelease(csIntegrate);
      gpu.blobRelease(psPostCode.blob);
      gpu.blobRelease(vsFullscreenCode.blob);
      gpu.blobRelease(psPointsCode.blob);
      gpu.blobRelease(vsCode.blob);
      gpu.blobRelease(csCode.blob);
      gpu.comRelease(postCb);
      gpu.comRelease(rendCb);
      gpu.comRelease(simCb);
      gpu.comRelease(posBuf.srv ?? 0n);
      gpu.comRelease(posBuf.uav ?? 0n);
      gpu.comRelease(posBuf.buffer);
      gpu.comRelease(velBuf.srv ?? 0n);
      gpu.comRelease(velBuf.uav ?? 0n);
      gpu.comRelease(velBuf.buffer);
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

const rtvArrEmpty: readonly bigint[] = [];

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;
  if ((User32.GetAsyncKeyState(VirtualKey.VK_ESCAPE) & 0x8000) !== 0) break;

  const now = performance.now();
  let dt = (now - lastFrameTime) / 1000;
  lastFrameTime = now;
  if (dt > 0.05) dt = 0.05; // clamp big stalls so the sim never explodes
  const t = (now - startTime) / 1000;

  // ── Map the cursor to a world-space point on the disk plane for the attractor ──
  const m = win.getMouse();
  // NDC of the cursor.
  const ndcX = (m.x / clientW) * 2 - 1;
  const ndcY = 1 - (m.y / clientH) * 2;
  // Project onto the galaxy's tilted disk: scale NDC into world XZ by the view extent.
  const worldScale = GALAXY_RADIUS * 1.25;
  const targetWX = ndcX * worldScale;
  const targetWZ = ndcY * worldScale; // tilt makes screen-Y ≈ world-Z
  attractWX += (targetWX - attractWX) * 0.2;
  attractWZ += (targetWZ - attractWZ) * 0.2;
  attractWY += (0 - attractWY) * 0.2;

  // ── 1. Compute integration step ──
  simData.writeFloatLE(attractWX, 0);
  simData.writeFloatLE(attractWY, 4);
  simData.writeFloatLE(attractWZ, 8);
  simData.writeFloatLE(m.down ? 1 : 0, 12);
  simData.writeFloatLE(dt, 16);
  simData.writeFloatLE(t, 20);
  simData.writeFloatLE(GM, 24); // central mass × G (matches the seed velocities)
  simData.writeFloatLE(m.down ? 6.0 : 0.0, 28); // attractStrength
  simData.writeFloatLE(SOFT, 32); // gravitational softening
  simData.writeFloatLE(0.015, 36); // damping per second (very gentle)
  simData.writeFloatLE(0.22, 40); // curl-noise strength (small perturbation only)
  simData.writeFloatLE(0, 44);
  gpu.updateConstantBuffer(simCb, simData);

  gpu.csSet(csIntegrate, { cb: [simCb], uav: [posBuf.uav!, velBuf.uav!] });
  gpu.dispatch(GROUPS, 1, 1);
  // Unbind the UAVs so the buffers can be read as SRVs by the vertex shader.
  gpu.csSet(0n, { uav: [0n, 0n] });
  dispatched = true;

  // ── 2. Build the auto-rotating camera and render points additively to HDR ──
  // Look DOWN at the disk from ~48° elevation (eyeY high relative to eyeR) so the
  // spiral face fills the frame as a tilted 2D ellipse, not an edge-on streak.
  const yaw = t * 0.12;
  const eyeR = 16.0; // horizontal orbit radius
  const eyeY = 18.0; // height above the disk plane → elevation ≈ atan2(18,16) ≈ 48°
  const eye: [number, number, number] = [Math.sin(yaw) * eyeR, eyeY, Math.cos(yaw) * eyeR];
  const view = lookAt(eye, [0, 0, 0], [0, 1, 0]);
  const viewProj = mul4(proj, view);
  // Upload TRANSPOSED: HLSL constant-buffer matrices default to column-major, so
  // storing our row-major matrix transposed makes the shader read back M, and
  // mul(M, v) then evaluates M·v correctly (a non-transposed upload scrambles the
  // projection and collapses the disk into a thin horizontal streak).
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      rendData.writeFloatLE(viewProj[col * 4 + row]!, (row * 4 + col) * 4);
    }
  }
  rendData.writeFloatLE(1.0, 64); // pointBoost (unused on D3D11 1px points, kept for layout)
  rendData.writeFloatLE(0, 68);
  rendData.writeFloatLE(t, 72);
  rendData.writeFloatLE(0, 76);
  gpu.updateConstantBuffer(rendCb, rendData);

  gpu.setRenderTargets([hdr.rtv!]);
  gpu.setViewport(clientW, clientH);
  gpu.clear(hdr.rtv!, [0.006, 0.008, 0.018, 1]); // faint deep-space blue
  gpu.setBlendState(additiveBlend);
  gpu.vsSetShaderResources([posBuf.srv!, velBuf.srv!]);
  gpu.vsSet(vsPoints, [rendCb]);
  gpu.psSet(psPoints);
  gpu.drawPoints(PARTICLE_COUNT);

  // Unbind the VS SRVs + HDR RTV before reusing the HDR texture as a PS SRV.
  gpu.vsSetShaderResources([0n, 0n]);
  gpu.setBlendState(0n);
  gpu.setRenderTargets(rtvArrEmpty);

  // ── 3. Bloom + tonemap fullscreen pass to the back buffer ──
  postData.writeFloatLE(1 / clientW, 0);
  postData.writeFloatLE(1 / clientH, 4);
  postData.writeFloatLE(1.15, 8); // exposure
  postData.writeFloatLE(t, 12);
  gpu.updateConstantBuffer(postCb, postData);

  gpu.setRenderTargets([dev.backBufferRTV]);
  gpu.setViewport(clientW, clientH);
  gpu.clear(dev.backBufferRTV, [0, 0, 0, 1]);
  gpu.vsSet(vsFullscreen);
  gpu.psSet(psPost, { cb: [postCb], srv: [hdr.srv!], samp: [sampler] });
  gpu.drawFullscreenTriangle();

  // Unbind the HDR SRV so it is free to be a render target next frame.
  gpu.psSet(psPost, { srv: [0n] });

  dev.present(false);
  presented += 1;

  drawHud(fps);

  frames += 1;
  if (now - fpsWindowStart >= 500) {
    fps = Math.round((frames * 1000) / (now - fpsWindowStart));
    frames = 0;
    fpsWindowStart = now;
  }

  if (durationMs > 0 && now - startTime >= durationMs) break;
}

console.log(`Particle Galaxy finished — dispatched=${dispatched} · frames presented=${presented}.`);
cleanup(0);
