/**
 * Ocean — a real animated 3D OCEAN surface, lit, with sky + sun glint, rendered as
 * an opaque triangle MESH on your GPU in pure TypeScript.
 *
 * A borderless window fills the primary monitor with a living sea: a tessellated
 * grid mesh (a StructuredBuffer of base XZ positions, fetched by SV_VertexID — no
 * vertex/index buffers) is displaced every frame in the vertex shader by a SUM OF
 * SIX directional GERSTNER WAVES. Each wave both lifts the surface and sharpens its
 * crests (the horizontal pinch that gives a Gerstner ocean its choppy, peaked look),
 * and the analytic wave derivatives yield a per-vertex normal and a folding/Jacobian
 * measure with NO finite differencing. The pixel shader shades it like real water:
 * a deep-blue → teal body graded by view depth, a FRESNEL sky reflection (deep blue
 * zenith → warm hazy horizon), a tight specular SUN GLINT riding the wave normal, a
 * long shimmering sun-glitter road, and WHITE FOAM streaked across pinched crests.
 * It is rendered with the shared 3D companion (_gpu3d): a D32 DEPTH buffer makes the
 * surface a true opaque solid, depth-test ON, and a slowly orbiting camera skims low
 * over the water looking toward the sun on the horizon.
 *
 * Pipeline (per frame, off a PeekMessage pump):
 *   1. build column-major viewProj (orbiting camera) → upload TRANSPOSED
 *   2. setRenderTargetsWithDepth([backBufferRTV], depth.dsv); clear color + depth
 *   3. setDepthState(true,true); setCull("none")
 *   4. vsSet(gerstner VS, [cb]) + psSet(water PS, [cb]); drawTriangles(gridVertCount)
 *   5. present + GDI HUD ("Ocean · <waves> Gerstner waves · <fps> fps · <GPU>")
 *
 * Engine / @bun-win32 APIs: createWindow, createDevice, compile,
 *   makeVertexShader/makePixelShader, makeConstantBuffer/updateConstantBuffer,
 *   makeStructuredBuffer (grid SRV, initialData seeding), vsSetShaderResources,
 *   vsSet/psSet, present, comRelease/blobRelease; gpu3d.bindGpu3d / makeDepthBuffer /
 *   setRenderTargetsWithDepth / clearDepth / setDepthState / setCull / drawTriangles /
 *   releaseGpu3d. User32.GetSystemMetrics for the primary-monitor size; GDI32 HUD;
 *   captureBackBuffer for the gallery self-check.
 *
 * Run: bun run packages/all/example/ocean.ts
 */

import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

import { GDI32, User32 } from '../index';
import { VirtualKey } from '@bun-win32/user32';
import * as gpu from './_gpu';
import * as gpu3d from './_gpu3d';
import * as hud from './_hud';
import { captureBackBuffer, formatGrid } from './_snapshot';

const encodeWide = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');
const TRANSPARENT_BK = 1;

// ── A modest borderless window scaled to the monitor (not the whole desktop) ──
const SM_CXSCREEN = 0;
const SM_CYSCREEN = 1;
const screenW = User32.GetSystemMetrics(SM_CXSCREEN) || 1920;
const screenH = User32.GetSystemMetrics(SM_CYSCREEN) || 1080;
const HEIGHT = Math.min(1200, Math.floor(screenH * 0.86));
const WIDTH = Math.min(Math.floor(screenW * 0.9), Math.round(HEIGHT * 1.6));

const win = gpu.createWindow({ title: 'Ocean — Gerstner-wave 3D sea in pure TypeScript', width: WIDTH, height: HEIGHT, borderless: true });
const { w: clientW, h: clientH } = win.clientSize();
const g = gpu.createDevice(win.hwnd, { width: clientW, height: clientH });
gpu3d.bindGpu3d(g);

// ── Mesh: a GRID of cells. Each cell = 2 triangles = 6 vertices, fetched from the
// grid SRV by SV_VertexID. The SRV stores per-grid-vertex world-space XZ base coords;
// the index buffer is implicit (six SV_VertexIDs per cell map to four corners). ──
const GRID = 320; // cells per side
const VERTS_X = GRID + 1;
const TILE = 320.0; // world extent of the patch (metres)
const HALF = TILE * 0.5;
const NUM_WAVES = 6;

// Per-grid-vertex base position (x,z) in a StructuredBuffer<float2>.
const gridSeed = Buffer.alloc(VERTS_X * VERTS_X * 8);
for (let z = 0; z < VERTS_X; z += 1) {
  for (let x = 0; x < VERTS_X; x += 1) {
    const o = (z * VERTS_X + x) * 8;
    gridSeed.writeFloatLE((x / GRID) * TILE - HALF, o + 0);
    gridSeed.writeFloatLE((z / GRID) * TILE - HALF, o + 4);
  }
}
const gridBuf = gpu.makeStructuredBuffer({ stride: 8, count: VERTS_X * VERTS_X, srv: true, initialData: gridSeed });
const GRID_VERT_COUNT = GRID * GRID * 6; // 6 SV_VertexIDs per cell

const depth = gpu3d.makeDepthBuffer(clientW, clientH);

// ── Gerstner wave table (CPU side → uploaded once). Each wave: dir(x,z), amplitude,
// wavelength, speed, steepness(Q). Mixed directions/scales so the sea reads as a real
// wind-driven swell with smaller chop riding the dominant long waves. ─────────────
interface Wave {
  dx: number;
  dz: number;
  amp: number;
  wlen: number;
  speed: number;
  steep: number;
}
const WIND = 0.5; // dominant wind heading (radians)
const waves: Wave[] = [];
{
  let s = 0xc0ffee >>> 0;
  const rand = (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x1_0000_0000;
  };
  // Longest, dominant swell first; each successive wave is shorter, steeper chop.
  const specs = [
    { wlen: 90, amp: 2.6, spread: 0.2 },
    { wlen: 54, amp: 1.5, spread: 0.55 },
    { wlen: 31, amp: 0.85, spread: 0.95 },
    { wlen: 19, amp: 0.48, spread: 1.3 },
    { wlen: 11, amp: 0.26, spread: 1.7 },
    { wlen: 6.5, amp: 0.14, spread: 2.2 },
  ];
  for (const sp of specs) {
    const ang = WIND + (rand() - 0.5) * 2 * sp.spread;
    const k = (2 * Math.PI) / sp.wlen; // wavenumber
    const c = Math.sqrt(9.81 / k); // deep-water phase speed = sqrt(g/k)
    waves.push({ dx: Math.cos(ang), dz: Math.sin(ang), amp: sp.amp, wlen: sp.wlen, speed: c, steep: 0.0 });
  }
  // Steepness Q per wave, normalised so the sum can't pinch past a cusp (Q*k*A <= 1
  // overall). Bias the longer waves to carry most of the steepness.
  const totalKA = waves.reduce((acc, w) => acc + ((2 * Math.PI) / w.wlen) * w.amp, 0);
  for (const w of waves) {
    const ka = ((2 * Math.PI) / w.wlen) * w.amp;
    w.steep = (0.82 / Math.max(1e-3, totalKA)) * (ka / Math.max(1e-3, ka)) * 1.0;
  }
}

// ── Vertex shader: sum-of-Gerstner displacement + analytic normal/tangent. ────────
// Grid base XZ comes from the StructuredBuffer by SV_VertexID (decoded into a cell +
// corner). Each Gerstner wave displaces horizontally (steepness) AND vertically, and
// contributes its partial derivatives so the normal + a folding measure are exact.
const VS_SRC = `
cbuffer Frame : register(b0) {
  float4x4 gViewProj;
  float4   gCam;        // xyz = camera world pos, w = time
  float4   gSun;        // xyz = sun dir (normalised), w = unused
  float4   gWaveDir[${NUM_WAVES}];   // xy = dir, z = amp, w = wavenumber k
  float4   gWavePhase[${NUM_WAVES}]; // x = phaseSpeed (w = c*k), y = steepness Q, zw unused
};
StructuredBuffer<float2> Grid : register(t0);

static const int VERTS_X = ${VERTS_X};
static const int GRID = ${GRID};

struct VSOut {
  float4 pos    : SV_Position;
  float3 wpos   : TEXCOORD0;   // displaced world position
  float3 wnrm   : TEXCOORD1;   // analytic world normal
  float  fold   : TEXCOORD2;   // crest folding (foam) measure
  float  height : TEXCOORD3;   // vertical displacement
};

VSOut main(uint vid : SV_VertexID) {
  // Decode SV_VertexID → cell (cx,cz) + which of the 6 verts (two triangles).
  uint cell = vid / 6u;
  uint corner = vid % 6u;
  uint cx = cell % uint(GRID);
  uint cz = cell / uint(GRID);
  // Two triangles: (0,1,2) = (00,01,10) ; (3,4,5) = (10,01,11).
  uint2 off;
  if (corner == 0u) off = uint2(0u, 0u);
  else if (corner == 1u) off = uint2(0u, 1u);
  else if (corner == 2u) off = uint2(1u, 0u);
  else if (corner == 3u) off = uint2(1u, 0u);
  else if (corner == 4u) off = uint2(0u, 1u);
  else off = uint2(1u, 1u);
  uint gx = cx + off.x;
  uint gz = cz + off.y;
  float2 base = Grid[gz * uint(VERTS_X) + gx];

  float t = gCam.w;

  // Accumulate Gerstner displacement + Jacobian partials.
  float3 P = float3(base.x, 0.0, base.y);
  // Tangent (d/dx) and bitangent (d/dz) start as the flat-plane basis.
  float3 tang = float3(1.0, 0.0, 0.0);
  float3 bita = float3(0.0, 0.0, 1.0);

  [unroll]
  for (int i = 0; i < ${NUM_WAVES}; i++) {
    float2 D = gWaveDir[i].xy;
    float  A = gWaveDir[i].z;
    float  k = gWaveDir[i].w;
    float  c = gWavePhase[i].x;     // phase speed term (= c, multiplied by k below)
    float  Q = gWavePhase[i].y;     // steepness

    float phase = k * dot(D, base) - c * k * t;
    float s = sin(phase);
    float cphi = cos(phase);
    float QA = Q * A;

    // Horizontal pinch toward crests + vertical lift.
    P.x += QA * D.x * cphi;
    P.z += QA * D.y * cphi;
    P.y += A * s;

    // Partial derivatives of P w.r.t base x and z (for tangent/bitangent → normal).
    // d(phase)/dx = k*D.x ; d(phase)/dz = k*D.y
    float kdx = k * D.x;
    float kdz = k * D.y;
    // tangent (∂P/∂x)
    tang.x += -QA * D.x * D.x * k * s;
    tang.z += -QA * D.y * D.x * k * s;
    tang.y +=  A * D.x * k * cphi;
    // bitangent (∂P/∂z)
    bita.x += -QA * D.x * D.y * k * s;
    bita.z += -QA * D.y * D.y * k * s;
    bita.y +=  A * D.y * k * cphi;
  }

  float3 N = normalize(cross(bita, tang));
  if (N.y < 0.0) N = -N;

  // Folding / foam measure: where the horizontal Jacobian collapses (crests pinch),
  // tang.x*bita.z - tang.z*bita.x drops below 1 → growing foam.
  float jacobian = tang.x * bita.z - tang.z * bita.x;
  float fold = saturate(1.0 - jacobian);

  VSOut o;
  o.pos = mul(gViewProj, float4(P, 1.0));
  o.wpos = P;
  o.wnrm = N;
  o.fold = fold;
  o.height = P.y;
  return o;
}
`;

// ── Pixel shader: sky model + water body + Fresnel reflection + sun glint + foam. ──
const PS_SRC = `
cbuffer Frame : register(b0) {
  float4x4 gViewProj;
  float4   gCam;
  float4   gSun;
  float4   gWaveDir[${NUM_WAVES}];
  float4   gWavePhase[${NUM_WAVES}];
};

struct VSOut {
  float4 pos    : SV_Position;
  float3 wpos   : TEXCOORD0;
  float3 wnrm   : TEXCOORD1;
  float  fold   : TEXCOORD2;
  float  height : TEXCOORD3;
};

// Sky/atmosphere: deep blue zenith grading to a warm hazy horizon, with a soft sun
// halo and a bright sun disc. Used both as the background and as the water reflection.
float3 skyColor(float3 rd, float3 sun) {
  float up = saturate(rd.y);
  float3 zenith  = float3(0.05, 0.18, 0.42);
  float3 mid     = float3(0.22, 0.45, 0.72);
  float3 horizon = float3(0.78, 0.80, 0.80);
  float3 col = lerp(horizon, mid, pow(saturate(rd.y * 2.2 + 0.05), 0.55));
  col = lerp(col, zenith, pow(up, 1.1));
  float sd = saturate(dot(rd, sun));
  col += float3(1.0, 0.62, 0.32) * pow(sd, 6.0) * 0.45;   // warm scatter halo
  col += float3(1.0, 0.86, 0.62) * pow(sd, 64.0) * 0.9;   // tighter halo
  col += float3(1.0, 0.96, 0.86) * pow(sd, 3000.0) * 14.0; // sun disc
  // Warm haze band right on the horizon line.
  col = lerp(col, float3(0.92, 0.84, 0.72), pow(1.0 - up, 10.0) * 0.5);
  return col;
}

float4 main(VSOut i) : SV_Target {
  float3 sun = normalize(gSun.xyz);
  float3 N = normalize(i.wnrm);
  float3 V = normalize(gCam.xyz - i.wpos);   // toward camera
  float3 rd = -V;                            // view ray direction

  // ── Water body colour: deep ocean blue in the troughs, a saturated teal on the
  // wave faces that catch the sky. Steepen the grading so troughs read genuinely
  // dark and crests pop — a flat single teal looks like a swimming pool, not a sea.
  float3 deep    = float3(0.002, 0.018, 0.052);
  float3 shallow = float3(0.01, 0.14, 0.26);
  float facing = saturate(N.y * 0.5 + 0.5);
  float3 body = lerp(deep, shallow, pow(facing, 2.2));
  // Subsurface up-glow on the sunlit backs of waves (light scattering through them).
  float sss = pow(saturate(dot(V, -sun) * 0.5 + 0.5), 3.0) * saturate(i.height * 0.16 + 0.25);
  body += float3(0.0, 0.13, 0.12) * sss;

  // ── Fresnel sky reflection (Schlick). Grazing angles → almost pure sky mirror,
  // steep angles (looking down at nearby water) → mostly dark body colour.
  float3 refl = reflect(rd, N);
  refl.y = abs(refl.y) * 0.9 + 0.015;        // keep reflection sampling the sky dome
  float3 reflCol = skyColor(refl, sun);
  float f0 = 0.02;
  float fres = f0 + (1.0 - f0) * pow(saturate(1.0 - dot(V, N)), 5.0);

  float3 col = lerp(body, reflCol, saturate(fres));

  // ── Sharp specular sun glint riding the wave normal (Blinn-Phong).
  float3 H = normalize(sun + V);
  float spec = pow(saturate(dot(N, H)), 220.0);
  col += float3(1.0, 0.92, 0.74) * spec * 5.0;

  // ── Long shimmering sun-glitter road: the reflected sun broken up by wave normals
  // streaks a sparkling path of light from the sun across the water to the camera.
  float road = pow(saturate(dot(refl, sun)), 12.0);
  col += float3(1.0, 0.78, 0.48) * road * 1.4;
  float sparkle = pow(saturate(dot(refl, sun)), 90.0);
  col += float3(1.0, 0.95, 0.82) * sparkle * 2.0;

  // ── White FOAM, only where crests genuinely pinch (high Jacobian fold) or the
  // tallest waves break. Kept selective so it streaks the crests, not the whole sea.
  float crest = saturate((i.height - 2.0) * 0.55);
  float foam = saturate(i.fold * 1.7 + crest);
  foam = smoothstep(0.55, 1.0, foam);
  col = lerp(col, float3(0.92, 0.96, 1.0), foam * 0.95);

  // ── Distance fog into the warm horizon so the sea reads as vast and continuous.
  float dist = length(gCam.xyz - i.wpos);
  float fog = 1.0 - exp(-max(0.0, dist - 60.0) * 0.0042);
  float3 horizonHaze = skyColor(normalize(float3(rd.x, 0.02, rd.z)), sun);
  col = lerp(col, horizonHaze, saturate(fog));

  // ── Filmic tonemap + gamma so glints glow without hard clipping.
  float3 x = col * 1.05;
  col = saturate((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14));
  col = pow(col, 1.0 / 2.2);
  return float4(col, 1.0);
}
`;

// Background sky fullscreen pass (drawn first, depth disabled) so the horizon + sun
// fill everything the ocean mesh doesn't cover.
const SKY_VS_SRC = `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o; float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p; o.pos = float4(p * float2(2.0, -2.0) + float2(-1.0, 1.0), 1.0, 1.0); return o;
}
`;
const SKY_PS_SRC = `
cbuffer Frame : register(b0) {
  float4x4 gViewProj;
  float4   gCam;       // xyz cam pos, w time
  float4   gSun;
  float4   gExtra;     // x = invW, y = invH, z = tanHalfFovY, w = aspect
  float4   gRight;     // xyz camera right
  float4   gUp;        // xyz camera up
  float4   gFwd;       // xyz camera forward
};
float3 skyColor(float3 rd, float3 sun) {
  float up = saturate(rd.y);
  float3 zenith  = float3(0.05, 0.18, 0.42);
  float3 mid     = float3(0.22, 0.45, 0.72);
  float3 horizon = float3(0.78, 0.80, 0.80);
  float3 col = lerp(horizon, mid, pow(saturate(rd.y * 2.2 + 0.05), 0.55));
  col = lerp(col, zenith, pow(up, 1.1));
  float sd = saturate(dot(rd, sun));
  col += float3(1.0, 0.62, 0.32) * pow(sd, 6.0) * 0.45;
  col += float3(1.0, 0.86, 0.62) * pow(sd, 64.0) * 0.9;
  col += float3(1.0, 0.96, 0.86) * pow(sd, 3000.0) * 14.0;
  col = lerp(col, float3(0.92, 0.84, 0.72), pow(1.0 - up, 10.0) * 0.5);
  return col;
}
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 ndc = uv * 2.0 - 1.0;
  ndc.y = -ndc.y;
  float3 dir = normalize(gFwd.xyz
    + gRight.xyz * (ndc.x * gExtra.z * gExtra.w)
    + gUp.xyz    * (ndc.y * gExtra.z));
  float3 sun = normalize(gSun.xyz);
  float3 col = skyColor(dir, sun);
  float3 x = col * 1.05;
  col = saturate((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14));
  col = pow(col, 1.0 / 2.2);
  return float4(col, 1.0);
}
`;

// ── Compile + create shaders ───────────────────────────────────────────────────
let vsCode: gpu.CompiledShader;
let psCode: gpu.CompiledShader;
let skyVsCode: gpu.CompiledShader;
let skyPsCode: gpu.CompiledShader;
let vs = 0n;
let ps = 0n;
let skyVs = 0n;
let skyPs = 0n;
try {
  vsCode = gpu.compile(VS_SRC, 'main', 'vs_5_0');
  psCode = gpu.compile(PS_SRC, 'main', 'ps_5_0');
  skyVsCode = gpu.compile(SKY_VS_SRC, 'main', 'vs_5_0');
  skyPsCode = gpu.compile(SKY_PS_SRC, 'main', 'ps_5_0');
  vs = gpu.makeVertexShader(vsCode);
  ps = gpu.makePixelShader(psCode);
  skyVs = gpu.makeVertexShader(skyVsCode);
  skyPs = gpu.makePixelShader(skyPsCode);
} catch (err) {
  console.error(String((err as Error).message));
  process.exit(1);
}

// Frame constant buffer: 64 (viewProj) + 16 (cam) + 16 (sun) + NUM_WAVES*16 (dir)
// + NUM_WAVES*16 (phase). Sized large enough for the sky pass's extra slots too.
const WAVE_BYTES = NUM_WAVES * 16;
const MESH_CB_SIZE = 64 + 16 + 16 + WAVE_BYTES * 2;
const SKY_CB_SIZE = 64 + 16 + 16 + 16 + 16 + 16 + 16; // viewProj+cam+sun+extra+right+up+fwd
const CB_SIZE = Math.max(MESH_CB_SIZE, SKY_CB_SIZE);
const cb = gpu.makeConstantBuffer(CB_SIZE);
const cbData = Buffer.alloc(CB_SIZE);

// Sky uses its own constant buffer (different layout after viewProj/cam/sun).
const skyCb = gpu.makeConstantBuffer(SKY_CB_SIZE);
const skyData = Buffer.alloc(SKY_CB_SIZE);

// ── Camera math (left-handed, D3D), row-major → uploaded transposed. Copied from
// particle-galaxy so the column-major HLSL cbuffer reads it back correctly. ────────
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
interface Basis {
  fwd: [number, number, number];
  right: [number, number, number];
  up: [number, number, number];
}
function lookAtBasis(eye: [number, number, number], center: [number, number, number], up: [number, number, number]): { m: number[]; basis: Basis } {
  let zx = center[0] - eye[0];
  let zy = center[1] - eye[1];
  let zz = center[2] - eye[2];
  const zl = Math.hypot(zx, zy, zz) || 1;
  zx /= zl;
  zy /= zl;
  zz /= zl;
  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  const xl = Math.hypot(xx, xy, xz) || 1;
  xx /= xl;
  xy /= xl;
  xz /= xl;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  const m = [xx, xy, xz, -(xx * eye[0] + xy * eye[1] + xz * eye[2]), yx, yy, yz, -(yx * eye[0] + yy * eye[1] + yz * eye[2]), zx, zy, zz, -(zx * eye[0] + zy * eye[1] + zz * eye[2]), 0, 0, 0, 1];
  return { m, basis: { fwd: [zx, zy, zz], right: [xx, xy, xz], up: [yx, yy, yz] } };
}
function perspective(fovY: number, aspect: number, near: number, far: number): number[] {
  const ff = 1 / Math.tan(fovY / 2);
  const range = far / (far - near);
  return [ff / aspect, 0, 0, 0, 0, ff, 0, 0, 0, 0, range, -near * range, 0, 0, 1, 0];
}

const FOV_Y = (52 * Math.PI) / 180;
const aspect = clientW / clientH;
const TAN_HALF = Math.tan(FOV_Y / 2);
const proj = perspective(FOV_Y, aspect, 0.1, 1200);

// Low golden sun just above the horizon so its glitter road runs to the camera.
const sunElev = 0.12; // radians above horizon (low, dramatic)
const sunAzim = WIND; // aim the sun down-wind so the swell rolls toward the light
const sun: [number, number, number] = [Math.cos(sunElev) * Math.cos(sunAzim), Math.sin(sunElev), Math.cos(sunElev) * Math.sin(sunAzim)];

// ── GDI HUD font ──────────────────────────────────────────────────────────────
const hudFont = GDI32.CreateFontW(-Math.max(18, Math.round(clientH / 52)), 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);
function drawHud(fps: number): void {
  hud.draw(g, clientW, clientH, (dc) => {
    const prevFont = GDI32.SelectObject(dc, hudFont);
    GDI32.SetBkMode(dc, TRANSPARENT_BK);
    const line = `Ocean · ${NUM_WAVES} Gerstner waves · ${(GRID_VERT_COUNT / 3).toLocaleString()} tris · ${fps} fps · ${g.gpuName}`;
    const text = encodeWide(line);
    const len = line.length;
    GDI32.SetTextColor(dc, 0x00201408); // dark shadow (BGR)
    GDI32.TextOutW(dc, 23, 23, text.ptr!, len);
    GDI32.SetTextColor(dc, 0x00f0e0c0); // warm icy-white
    GDI32.TextOutW(dc, 22, 22, text.ptr!, len);
    GDI32.SelectObject(dc, prevFont);
  });
}

console.log('Ocean — Gerstner-wave 3D sea, opaque triangle mesh + depth buffer, in pure TypeScript.');
console.log(`  ${g.driver} · ${g.gpuName} · grid ${GRID}x${GRID} (${(GRID_VERT_COUNT / 3).toLocaleString()} tris) · ${NUM_WAVES} waves`);

// ── Render loop ─────────────────────────────────────────────────────────────
const startTime = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
const selfShot = process.env.SELFSHOT === '1';
let frames = 0;
let fps = 0;
let fpsWindowStart = startTime;

let cleanedUp = false;
function cleanup(code: number): never {
  if (!cleanedUp) {
    cleanedUp = true;
    try {
      hud.release();
      GDI32.DeleteObject(hudFont);
      gpu.comRelease(skyPs);
      gpu.comRelease(skyVs);
      gpu.comRelease(ps);
      gpu.comRelease(vs);
      if (skyPsCode) gpu.blobRelease(skyPsCode.blob);
      if (skyVsCode) gpu.blobRelease(skyVsCode.blob);
      if (psCode) gpu.blobRelease(psCode.blob);
      if (vsCode) gpu.blobRelease(vsCode.blob);
      gpu.comRelease(skyCb);
      gpu.comRelease(cb);
      gpu.comRelease(gridBuf.srv ?? 0n);
      gpu.comRelease(gridBuf.buffer);
      gpu3d.releaseGpu3d();
      gpu.comRelease(g.backBufferRTV);
      gpu.comRelease(g.swapChain);
      gpu.comRelease(g.context);
      gpu.comRelease(g.device);
    } catch {
      // best-effort teardown
    }
    win.destroy();
  }
  process.exit(code);
}
process.on('SIGINT', () => cleanup(0));
process.on('uncaughtException', (e) => {
  console.error(e);
  cleanup(1);
});

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;
  if ((User32.GetAsyncKeyState(VirtualKey.VK_ESCAPE) & 0x8000) !== 0) break;

  const now = performance.now();
  const t = (now - startTime) / 1000;

  // ── Slowly orbiting camera skimming low over the surface, looking toward the sun.
  const orbit = t * 0.06;
  const camR = 26.0;
  const camY = 4.2 + Math.sin(t * 0.4) * 0.6; // skim low, gently bobbing
  const camX = Math.sin(orbit) * camR;
  const camZ = Math.cos(orbit) * camR - 4.0;
  // Look toward a point out near the horizon in the sun's bearing so the glitter road
  // and the sun sit in frame; aim slightly down to keep plenty of sea in the lower half.
  const lookAhead = 80.0;
  const tgt: [number, number, number] = [camX + sun[0] * lookAhead, 1.0, camZ + sun[2] * lookAhead];
  const eye: [number, number, number] = [camX, camY, camZ];
  const { m: view, basis } = lookAtBasis(eye, tgt, [0, 1, 0]);
  const viewProj = mul4(proj, view);

  // ── 1. Sky background pass (no depth) ───────────────────────────────────────
  // Fill skyCb: viewProj(unused by sky but keeps slot)+cam+sun+extra+right+up+fwd.
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) skyData.writeFloatLE(viewProj[col * 4 + row]!, (row * 4 + col) * 4);
  }
  skyData.writeFloatLE(eye[0], 64);
  skyData.writeFloatLE(eye[1], 68);
  skyData.writeFloatLE(eye[2], 72);
  skyData.writeFloatLE(t, 76);
  skyData.writeFloatLE(sun[0], 80);
  skyData.writeFloatLE(sun[1], 84);
  skyData.writeFloatLE(sun[2], 88);
  skyData.writeFloatLE(0, 92);
  skyData.writeFloatLE(1 / clientW, 96);
  skyData.writeFloatLE(1 / clientH, 100);
  skyData.writeFloatLE(TAN_HALF, 104);
  skyData.writeFloatLE(aspect, 108);
  skyData.writeFloatLE(basis.right[0], 112);
  skyData.writeFloatLE(basis.right[1], 116);
  skyData.writeFloatLE(basis.right[2], 120);
  skyData.writeFloatLE(0, 124);
  skyData.writeFloatLE(basis.up[0], 128);
  skyData.writeFloatLE(basis.up[1], 132);
  skyData.writeFloatLE(basis.up[2], 136);
  skyData.writeFloatLE(0, 140);
  skyData.writeFloatLE(basis.fwd[0], 144);
  skyData.writeFloatLE(basis.fwd[1], 148);
  skyData.writeFloatLE(basis.fwd[2], 152);
  skyData.writeFloatLE(0, 156);
  gpu.updateConstantBuffer(skyCb, skyData);

  gpu3d.setRenderTargetsWithDepth([g.backBufferRTV], depth.dsv);
  gpu.setViewport(clientW, clientH);
  gpu3d.clearDepth(depth.dsv, 1.0);
  gpu3d.setDepthState(false, false); // sky doesn't write/test depth
  gpu3d.setCull('none');
  gpu.vsSet(skyVs, [skyCb]);
  gpu.psSet(skyPs, { cb: [skyCb] });
  gpu.drawFullscreenTriangle();

  // ── 2. Ocean mesh pass (depth on) ───────────────────────────────────────────
  // Fill the mesh constant buffer immediately before the draw (no await between).
  let o = 0;
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) cbData.writeFloatLE(viewProj[col * 4 + row]!, (row * 4 + col) * 4);
  }
  o = 64;
  cbData.writeFloatLE(eye[0], o);
  cbData.writeFloatLE(eye[1], o + 4);
  cbData.writeFloatLE(eye[2], o + 8);
  cbData.writeFloatLE(t, o + 12);
  o = 80;
  cbData.writeFloatLE(sun[0], o);
  cbData.writeFloatLE(sun[1], o + 4);
  cbData.writeFloatLE(sun[2], o + 8);
  cbData.writeFloatLE(0, o + 12);
  o = 96; // gWaveDir[]
  for (let i = 0; i < NUM_WAVES; i += 1) {
    const w = waves[i]!;
    const k = (2 * Math.PI) / w.wlen;
    cbData.writeFloatLE(w.dx, o);
    cbData.writeFloatLE(w.dz, o + 4);
    cbData.writeFloatLE(w.amp, o + 8);
    cbData.writeFloatLE(k, o + 12);
    o += 16;
  }
  for (let i = 0; i < NUM_WAVES; i += 1) {
    const w = waves[i]!;
    cbData.writeFloatLE(w.speed, o);
    cbData.writeFloatLE(w.steep, o + 4);
    cbData.writeFloatLE(0, o + 8);
    cbData.writeFloatLE(0, o + 12);
    o += 16;
  }
  gpu.updateConstantBuffer(cb, cbData);

  gpu3d.setDepthState(true, true);
  gpu3d.setCull('none');
  gpu.vsSetShaderResources([gridBuf.srv!]);
  gpu.vsSet(vs, [cb]);
  gpu.psSet(ps, { cb: [cb] });
  gpu3d.drawTriangles(GRID_VERT_COUNT);
  gpu.vsSetShaderResources([0n]);

  // ── HUD: composite the GDI overlay INTO the back buffer (after the scene render,
  // before present) so it never flickers and shows up in back-buffer captures.
  drawHud(fps);

  // ── Self-check: capture the back buffer BEFORE present (DISCARD wipes it after).
  const lastFrame = durationMs > 0 && now - startTime >= durationMs;
  if (lastFrame && selfShot) {
    const out = process.env.SELFSHOT_PATH ?? resolve(import.meta.dir, '..', 'screenshots', 'ocean.selfcheck.png');
    mkdirSync(resolve(out, '..'), { recursive: true });
    const stats = captureBackBuffer(g, out, { gridW: 56, gridH: 24 });
    console.log(formatGrid(stats));
    console.log(`[shot] ok=${stats.ok} nonBlack=${stats.nonBlackFrac.toFixed(3)} meanLuma=${stats.meanLuma.toFixed(3)} ${stats.width}x${stats.height} -> ${stats.path}`);
  }

  g.present(false);

  frames += 1;
  if (now - fpsWindowStart >= 500) {
    fps = Math.round((frames * 1000) / (now - fpsWindowStart));
    frames = 0;
    fpsWindowStart = now;
  }

  if (lastFrame) break;
}

console.log(`Ocean finished · ${fps} fps · ${g.driver} · ${g.gpuName}`);
cleanup(0);
