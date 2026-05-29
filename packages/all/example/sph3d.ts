/**
 * SPH 3D — a 49,152-particle Smoothed-Particle-Hydrodynamics fluid, simulated AND
 * rendered entirely on your GPU in pure TypeScript.
 *
 * A borderless window FILLS the primary monitor with a true 3D Lagrangian fluid: a
 * dam-break column of liquid collapses, sloshes and pools at the floor of an unseen
 * box while a slow camera orbits it. Neighbour search uses an ATOMIC LINKED-LIST
 * uniform grid rebuilt every frame — a ClearGrid pass resets each cell head to -1, a
 * BuildGrid pass does InterlockedExchange(CellHead[cell], i) and captures the previous
 * head into Next[i] (a per-cell singly-linked list, no sort, no prefix sum).
 * Density/pressure (poly6) and pressure+viscosity (spiky-grad + viscosity-laplacian)
 * passes walk the 27 neighbouring cells, a semi-implicit Euler integrate + box
 * collision moves the particles, and finally the render pass draws each particle as a
 * camera-facing SOFT METABALL SPLAT (a clip-space billboard expanded from SV_VertexID,
 * 6 verts/particle) that accumulates ADDITIVELY into an HDR R16G16B16A16 target colored
 * by speed — slow deep-blue water, fast cyan-white spray. A fullscreen bloom + Reinhard
 * tonemap pass paints a glowing, dense, unmistakably-liquid 3D body to the back buffer.
 * Hold LEFT MOUSE to stir the fluid with a swirling world-space vortex. HLSL is
 * JIT-compiled at startup; the whole sim runs on a real ID3D11Device. GDI HUD reads
 * "SPH 3D · 49,152 particles · <fps> fps".
 *
 * Pipeline (per frame, off a PeekMessage pump):
 *   0. ClearGrid   [numthreads(256)]  CellHead[i] = -1
 *   1. BuildGrid   [numthreads(256)]  InterlockedExchange(CellHead[cell], i) → Next[i]
 *   2. Density     [numthreads(256)]  walk 27 cells, poly6 → density, pressure (Pos.w)
 *   3. Force       [numthreads(256)]  walk 27 cells, spiky pressure + visc + gravity +
 *                                     mouse stir, integrate, box-collide (Pos/Vel out)
 *   4. Render      additive HDR metaball splats → fullscreen bloom/tonemap → back buffer
 *
 * Engine / @bun-win32 APIs (./_gpu): createWindow, createDevice, compile,
 *   makeComputeShader / makeVertexShader / makePixelShader, makeStructuredBuffer
 *   (Pos/Vel float4 + CellHead/Next int, UAV+SRV), makeTexture (HDR RTV+SRV),
 *   makeSampler, makeConstantBuffer / updateConstantBuffer, csSet / dispatch,
 *   vsSetShaderResources / vsSet / psSet, setRenderTargets / setViewport / clear /
 *   drawFullscreenTriangle / setBlendState / makeAdditiveBlendState, vcall (custom
 *   TRIANGLELIST splat draw), comRelease / blobRelease. GDI32 CreateFontW/TextOutW HUD.
 *   User32.GetSystemMetrics for the primary-monitor size; captureBackBuffer self-check.
 *
 * Run: bun run packages/all/example/sph3d.ts
 */

import { FFIType } from 'bun:ffi';

import { GDI32, User32 } from '../index';
import { VirtualKey } from '@bun-win32/user32';
import * as gpu from './_gpu';
import * as hud from './_hud';
import { captureBackBuffer, formatGrid } from './_snapshot';

const encodeWide = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');

// ── Window FILLS the primary monitor (borderless) so the showcase capture is us ──
const SM_CXSCREEN = 0;
const SM_CYSCREEN = 1;
const screenW = User32.GetSystemMetrics(SM_CXSCREEN) || 1920;
const screenH = User32.GetSystemMetrics(SM_CYSCREEN) || 1080;
const WIN_H = Math.min(1000, Math.floor(screenH * 0.72));
const WIN_W = Math.min(Math.floor(screenW * 0.9), Math.round(WIN_H * 16 / 9));

const win = gpu.createWindow({ title: 'SPH 3D — 49,152-particle fluid in pure TypeScript', width: WIN_W, height: WIN_H, borderless: true });
const { w: clientW, h: clientH } = win.clientSize();
const dev = gpu.createDevice(win.hwnd, { width: clientW, height: clientH });

// ── Simulation constants ──────────────────────────────────────────────────────
// Box is [-BOX, BOX]^3. Grid cell size MUST equal the smoothing radius H so a 3x3x3
// cell walk captures every neighbour within H. GRID cells per axis = 2*BOX / H.
const PARTICLE_COUNT = 49152; // 48 * 1024
const THREADS = 256;
const PART_GROUPS = Math.ceil(PARTICLE_COUNT / THREADS);

const BOX = 1.0; // half-extent of the cube
const H = 0.055; // SPH smoothing radius
const GRID = Math.round((2 * BOX) / H); // ~36 cells per axis
const CELL_COUNT = GRID * GRID * GRID;
const CELL_GROUPS = Math.ceil(CELL_COUNT / THREADS);

const REST_DENSITY = 1000.0;
const PARTICLE_MASS = (REST_DENSITY * (2 * BOX) ** 3) / PARTICLE_COUNT; // mass so rest fluid ~ rest density
const STIFFNESS = 250.0; // pressure constant (gas k)
const VISCOSITY = 6.0;
const GRAVITY = -9.8;
const DT = 0.0016; // fixed sub-step
const SUBSTEPS = 3; // sub-steps per frame for stability
const RESTITUTION = 0.25; // wall bounce

// World-space radius of each rendered metaball splat (clip-space scaled in the VS).
const SPLAT_RADIUS = H * 0.5;

console.log('SPH 3D — a 49,152-particle Smoothed-Particle-Hydrodynamics fluid on the GPU.');
console.log(`  ${clientW}x${clientH} · ${dev.driver} · ${dev.gpuName}`);
console.log(`  grid ${GRID}^3 = ${CELL_COUNT} cells · h=${H} · mass=${PARTICLE_MASS.toFixed(4)}`);
console.log('  Hold LEFT MOUSE to stir the fluid · ESC to exit.\n');

// ── Seed: a dam-break column occupying part of the box ──────────────────────────
// Pack a dense cubic lattice into the left-front-upper region so it collapses under
// gravity and sloshes. Deterministic, jittered for irregularity.
const posSeed = Buffer.alloc(PARTICLE_COUNT * 16);
const velSeed = Buffer.alloc(PARTICLE_COUNT * 16); // zero velocity
{
  let s = 0x2f6b1ce3 >>> 0;
  const rand = (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x1_0000_0000;
  };
  // Classic dam-break: a TALL, NARROW column hugging the -X wall and full depth in z.
  // It collapses sideways under gravity into a fast rightward wave that sloshes up the
  // far wall — energetic and visibly asymmetric/dynamic at capture time.
  const colX = 0.78 * BOX; // narrow in x (column hugs the -X wall)
  const colZ = 1.85 * BOX; // near-full depth
  const colY = 1.9 * BOX; // tall
  const aspect3 = (colX * colY * colZ) / PARTICLE_COUNT;
  const spacing = Math.cbrt(aspect3) * 0.92; // sub-rest spacing → compressed column
  const nx = Math.max(1, Math.round(colX / spacing));
  const ny = Math.max(1, Math.round(colY / spacing));
  const nz = Math.max(1, Math.round(colZ / spacing));
  const ox = -BOX + 0.03;
  const oy = BOX - 0.03 - (ny - 1) * spacing;
  const oz = -BOX + 0.03;
  const lim = BOX - 0.02;
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    const ix = i % nx;
    const iy = Math.floor(i / nx) % ny;
    const iz = Math.floor(i / (nx * ny)) % nz;
    const jitter = spacing * 0.2;
    let x = ox + ix * spacing + (rand() - 0.5) * jitter;
    let y = oy + iy * spacing + (rand() - 0.5) * jitter;
    let z = oz + iz * spacing + (rand() - 0.5) * jitter;
    x = Math.max(-lim, Math.min(lim, x));
    y = Math.max(-lim, Math.min(lim, y));
    z = Math.max(-lim, Math.min(lim, z));
    const o = i * 16;
    posSeed.writeFloatLE(x, o + 0);
    posSeed.writeFloatLE(y, o + 4);
    posSeed.writeFloatLE(z, o + 8);
    posSeed.writeFloatLE(0, o + 12); // w = density (filled by sim)
  }
}

// ── GPU buffers ─────────────────────────────────────────────────────────────
const posBuf = gpu.makeStructuredBuffer({ stride: 16, count: PARTICLE_COUNT, uav: true, srv: true, initialData: posSeed });
const velBuf = gpu.makeStructuredBuffer({ stride: 16, count: PARTICLE_COUNT, uav: true, srv: true, initialData: velSeed });
const cellHead = gpu.makeStructuredBuffer({ stride: 4, count: CELL_COUNT, uav: true }); // RWStructuredBuffer<int>
const nextBuf = gpu.makeStructuredBuffer({ stride: 4, count: PARTICLE_COUNT, uav: true }); // particle next pointers

// ── HDR accumulation target + post resources ──────────────────────────────────
const hdr = gpu.makeTexture({ w: clientW, h: clientH, format: gpu.DXGI_FORMAT_R16G16B16A16_FLOAT, rtv: true, srv: true });
const sampler = gpu.makeSampler({ filter: gpu.D3D11_FILTER_MIN_MAG_MIP_LINEAR, address: gpu.D3D11_TEXTURE_ADDRESS_CLAMP });
const additiveBlend = gpu.makeAdditiveBlendState(true);

// Cull-NONE rasterizer state so the splat billboards render regardless of winding
// (default state culls back faces). D3D11_RASTERIZER_DESC: FillMode@0=SOLID(3),
// CullMode@4=NONE(1), then defaults; DepthClipEnable@24=TRUE.
const DEV_CREATE_RASTERIZER_STATE = 22; // d3d11.h: ...CreateBlendState=20, CreateDepthStencilState=21, CreateRasterizerState=22, CreateSamplerState=23
const CTX_RS_SET_STATE = 43;
const noCullRaster = (() => {
  const desc = Buffer.alloc(40);
  desc.writeInt32LE(3, 0); // FillMode = SOLID
  desc.writeInt32LE(1, 4); // CullMode = NONE
  desc.writeInt32LE(0, 8); // FrontCounterClockwise = FALSE
  desc.writeInt32LE(1, 24); // DepthClipEnable = TRUE
  const pp = Buffer.alloc(8);
  const hr = gpu.vcall(dev.device, DEV_CREATE_RASTERIZER_STATE, [FFIType.ptr, FFIType.ptr], [desc.ptr!, pp.ptr!]);
  if (hr !== 0) {
    throw new Error(`CreateRasterizerState (cull none) failed: 0x${(hr >>> 0).toString(16)}`);
  }
  return pp.readBigUInt64LE(0);
})();

// ── Constant buffers ──────────────────────────────────────────────────────────
const SIM_CB_SIZE = 64;
const simCb = gpu.makeConstantBuffer(SIM_CB_SIZE);
const simData = Buffer.alloc(SIM_CB_SIZE);

// Render CB (VS+PS): float4x4 viewProj (64) + float4 params(splatRadius, aspect, time, _) = 80
const REND_CB_SIZE = 80;
const rendCb = gpu.makeConstantBuffer(REND_CB_SIZE);
const rendData = Buffer.alloc(REND_CB_SIZE);

// Post CB: float4 (texelW, texelH, exposure, time)
const POST_CB_SIZE = 16;
const postCb = gpu.makeConstantBuffer(POST_CB_SIZE);
const postData = Buffer.alloc(POST_CB_SIZE);

// ── Shared HLSL declarations ────────────────────────────────────────────────
const SIM_DECL = `
cbuffer Sim : register(b0) {
  float4 gP0; // x=h, y=mass, z=restDensity, w=stiffness
  float4 gP1; // x=viscosity, y=gravity, z=dt, w=box
  uint4  gP2; // x=grid, y=particleCount, z=cellCount, w=frame
  float4 gMouse; // xyz = stir center (world), w = down
};
RWStructuredBuffer<float4> Pos  : register(u0);
RWStructuredBuffer<float4> Vel  : register(u1);
RWStructuredBuffer<int>    Head : register(u2);
RWStructuredBuffer<int>    Next : register(u3);

int3 cellOf(float3 p) {
  float box = gP1.w; float h = gP0.x; uint G = gP2.x;
  int3 c = (int3)floor((p + box) / h);
  c = clamp(c, int3(0,0,0), int3(int(G)-1, int(G)-1, int(G)-1));
  return c;
}
int cellIndex(int3 c) { uint G = gP2.x; return (c.z * int(G) + c.y) * int(G) + c.x; }

static const float PI = 3.14159265;
float poly6(float r2, float h) {
  float h2 = h*h;
  if (r2 >= h2) return 0.0;
  float d = h2 - r2;
  float coef = 315.0 / (64.0 * PI * pow(h, 9.0));
  return coef * d * d * d;
}
float spikyGrad(float r, float h) {
  if (r >= h || r <= 1e-6) return 0.0;
  float d = h - r;
  float coef = -45.0 / (PI * pow(h, 6.0));
  return coef * d * d;
}
float viscLap(float r, float h) {
  if (r >= h) return 0.0;
  float coef = 45.0 / (PI * pow(h, 6.0));
  return coef * (h - r);
}
`;

// Pass 0: clear grid heads to -1.
const CLEAR_CS = `${SIM_DECL}
[numthreads(${THREADS},1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  if (id.x >= gP2.z) return;
  Head[id.x] = -1;
}
`;

// Pass 1: build the per-cell linked list via InterlockedExchange.
const BUILD_CS = `${SIM_DECL}
[numthreads(${THREADS},1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint i = id.x;
  if (i >= gP2.y) return;
  int ci = cellIndex(cellOf(Pos[i].xyz));
  int prev;
  InterlockedExchange(Head[ci], int(i), prev);
  Next[i] = prev;
}
`;

// Pass 2: density + pressure. Walk own + 26 neighbour cells via Head/Next.
const DENSITY_CS = `${SIM_DECL}
[numthreads(${THREADS},1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint i = id.x;
  if (i >= gP2.y) return;
  float h = gP0.x; float mass = gP0.y;
  float3 pi = Pos[i].xyz;
  int3 base = cellOf(pi);
  uint G = gP2.x;
  float density = 0.0;
  [loop] for (int dz = -1; dz <= 1; dz++)
  [loop] for (int dy = -1; dy <= 1; dy++)
  [loop] for (int dx = -1; dx <= 1; dx++) {
    int3 c = base + int3(dx, dy, dz);
    if (c.x < 0 || c.y < 0 || c.z < 0 || c.x >= int(G) || c.y >= int(G) || c.z >= int(G)) continue;
    int j = Head[cellIndex(c)];
    [loop] while (j >= 0) {
      float3 rij = pi - Pos[j].xyz;
      float r2 = dot(rij, rij);
      density += mass * poly6(r2, h);
      j = Next[j];
    }
  }
  density = max(density, gP0.z * 0.05);
  Pos[i].w = density;
}
`;

// Pass 3: pressure + viscosity force, gravity, mouse stir, integrate, box-collide.
const FORCE_CS = `${SIM_DECL}
[numthreads(${THREADS},1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint i = id.x;
  if (i >= gP2.y) return;
  float h = gP0.x; float mass = gP0.y; float rest = gP0.z; float k = gP0.w;
  float visc = gP1.x; float g = gP1.y; float dt = gP1.z; float box = gP1.w;

  float3 pi = Pos[i].xyz;
  float3 vi = Vel[i].xyz;
  float di = Pos[i].w;
  float pri = k * (di - rest);

  int3 base = cellOf(pi);
  uint G = gP2.x;
  float3 fPress = float3(0,0,0);
  float3 fVisc  = float3(0,0,0);

  [loop] for (int dz = -1; dz <= 1; dz++)
  [loop] for (int dy = -1; dy <= 1; dy++)
  [loop] for (int dx = -1; dx <= 1; dx++) {
    int3 c = base + int3(dx, dy, dz);
    if (c.x < 0 || c.y < 0 || c.z < 0 || c.x >= int(G) || c.y >= int(G) || c.z >= int(G)) continue;
    int j = Head[cellIndex(c)];
    [loop] while (j >= 0) {
      if (j != int(i)) {
        float3 rij = pi - Pos[j].xyz;
        float r = length(rij);
        if (r < h && r > 1e-5) {
          float dj = Pos[j].w;
          float prj = k * (dj - rest);
          float3 dir = rij / r;
          fPress += -dir * mass * (pri + prj) / (2.0 * dj) * spikyGrad(r, h);
          float3 vij = Vel[j].xyz - vi;
          fVisc += visc * mass * vij / dj * viscLap(r, h);
        }
      }
      j = Next[j];
    }
  }

  float3 force = fPress + fVisc + float3(0, g, 0) * di;

  // Mouse stir: a swirling vortex impulse around the cursor world point.
  if (gMouse.w > 0.5) {
    float3 toC = gMouse.xyz - pi;
    float d2 = dot(toC, toC) + 0.01;
    float fall = exp(-d2 * 18.0);
    float3 tangent = float3(-toC.z, 0.0, toC.x);
    force += (normalize(tangent + 1e-5) * 6.0 + toC * 3.0) * fall * di;
  }

  float3 acc = force / max(di, 1e-4);
  vi += acc * dt;
  float vmax = 9.0;
  float vl = length(vi);
  if (vl > vmax) vi *= vmax / vl;

  pi += vi * dt;

  float lim = box - 0.005;
  if (pi.x < -lim) { pi.x = -lim; vi.x = abs(vi.x) * ${RESTITUTION}; }
  if (pi.x >  lim) { pi.x =  lim; vi.x = -abs(vi.x) * ${RESTITUTION}; }
  if (pi.y < -lim) { pi.y = -lim; vi.y = abs(vi.y) * ${RESTITUTION}; }
  if (pi.y >  lim) { pi.y =  lim; vi.y = -abs(vi.y) * ${RESTITUTION}; }
  if (pi.z < -lim) { pi.z = -lim; vi.z = abs(vi.z) * ${RESTITUTION}; }
  if (pi.z >  lim) { pi.z =  lim; vi.z = -abs(vi.z) * ${RESTITUTION}; }

  Pos[i] = float4(pi, di);
  Vel[i] = float4(vi, length(vi));
}
`;

// ── Render: each particle is a camera-facing SOFT SPLAT (6 verts → 2 triangles). ──
// vid/6 = particle, vid%6 = quad corner. The center is projected; the corner is offset
// in CLIP-SPACE XY by the splat radius * w (so the screen size is constant in world
// units regardless of depth), with aspect correction. The PS gives a Gaussian falloff
// so overlapping splats accumulate additively into a dense, glowing fluid body.
const VS_SRC = `
cbuffer Rend : register(b0) {
  float4x4 gViewProj;
  float4 gParams; // x = splatRadius, y = aspect (w/h), z = time
};
StructuredBuffer<float4> Pos : register(t0);
StructuredBuffer<float4> Vel : register(t1);

struct VSOut {
  float4 pos   : SV_Position;
  float2 quv   : TEXCOORD0; // [-1,1]^2 local splat coords
  float  speed : TEXCOORD1;
  float  depth : TEXCOORD2; // 0 near .. 1 far (for subtle depth tint)
};

static const float2 CORNER[6] = {
  float2(-1,-1), float2( 1,-1), float2(-1, 1),
  float2(-1, 1), float2( 1,-1), float2( 1, 1)
};

VSOut main(uint vid : SV_VertexID) {
  VSOut o;
  uint pid = vid / 6u;
  uint cid = vid % 6u;
  float4 P = Pos[pid];
  float4 clip = mul(gViewProj, float4(P.xyz, 1.0));

  float2 corner = CORNER[cid];
  float rad = gParams.x;
  float aspect = gParams.y;
  // Offset in clip space; multiply by clip.w so the splat keeps a constant world size.
  clip.x += corner.x * rad * clip.w;
  clip.y += corner.y * rad * clip.w * aspect;

  o.pos = clip;
  o.quv = corner;
  o.speed = Vel[pid].w;
  o.depth = saturate(clip.z / clip.w);
  return o;
}
`;

const PS_POINTS_SRC = `
struct VSOut {
  float4 pos   : SV_Position;
  float2 quv   : TEXCOORD0;
  float  speed : TEXCOORD1;
  float  depth : TEXCOORD2;
};

float4 main(VSOut i) : SV_Target {
  // Soft round metaball: Gaussian falloff, zero outside the disc.
  float r2 = dot(i.quv, i.quv);
  if (r2 > 1.0) discard;
  float falloff = exp(-r2 * 2.6);

  // Per-splat color is BLUE-DOMINANT (low red) so even a deep additive stack tops
  // out as saturated cyan rather than washing to white; faster splats add a cyan
  // crest. The bright core emerges from density; the low red keeps it liquid-blue.
  float s = saturate(i.speed * 0.5);
  float3 deep = float3(0.015, 0.16, 0.70); // deep blue water (very low red)
  float3 cyan = float3(0.06, 0.55, 1.05);  // moving cyan crest
  float3 c = lerp(deep, cyan, smoothstep(0.0, 0.85, s));

  // Very low per-splat emission so it takes a deep stack of overlapping splats to
  // build the glowing core, while thin sheets/spray stay translucent blue. ONE/ONE.
  float emit = (0.0032 + 0.006 * s) * falloff;
  return float4(c * emit, 1.0);
}
`;

const PS_POST_SRC = `
cbuffer Post : register(b0) { float4 gP; }; // x=texelW, y=texelH, z=exposure, w=time
Texture2D Hdr : register(t0);
SamplerState Smp : register(s0);

float3 sampleHdr(float2 uv) { return Hdr.SampleLevel(Smp, uv, 0).rgb; }

float3 bloom(float2 uv) {
  float2 tx = gP.xy;
  float3 b = 0.0.xxx; float wsum = 0.0;
  const int N = 8;
  [unroll] for (int k = -N; k <= N; k++) {
    float fw = exp(-float(k * k) / 26.0);
    b += sampleHdr(uv + float2(tx.x * float(k) * 4.0, 0.0)) * fw;
    b += sampleHdr(uv + float2(0.0, tx.y * float(k) * 4.0)) * fw;
    wsum += fw * 2.0;
  }
  b /= wsum;
  // Diagonal smear for a rounder glow.
  b += sampleHdr(uv + tx * 6.0) * 0.5;
  b += sampleHdr(uv - tx * 6.0) * 0.5;
  return b;
}

float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float3 hdr = sampleHdr(uv);
  float3 bl = bloom(uv);
  float3 brightOnly = max(bl - 0.20.xxx, 0.0.xxx);
  float3 col = hdr + brightOnly * 1.25; // glow lifts the dense core without white-out
  col *= gP.z; // exposure

  // Subtle vignette.
  float2 q = uv - 0.5;
  float vig = smoothstep(0.95, 0.18, dot(q, q) * 1.55);
  col *= lerp(0.45, 1.0, vig);

  col = col / (col + 1.0.xxx);    // Reinhard tonemap
  // White-hot core: lift only the brightest (densest) tonemapped regions toward
  // white-cyan so the core glows hot while the bulk stays deep liquid-blue.
  float l = dot(col, float3(0.299, 0.587, 0.114));
  float hot = smoothstep(0.55, 0.92, l);
  col = lerp(col, lerp(col, float3(0.92, 1.0, 1.06), 0.9), hot);
  col = pow(col, (1.0 / 2.2).xxx);
  return float4(col, 1.0);
}
`;

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

// ── Compile + create ──────────────────────────────────────────────────────────
const clearCode = gpu.compile(CLEAR_CS, 'main', 'cs_5_0');
const buildCode = gpu.compile(BUILD_CS, 'main', 'cs_5_0');
const densityCode = gpu.compile(DENSITY_CS, 'main', 'cs_5_0');
const forceCode = gpu.compile(FORCE_CS, 'main', 'cs_5_0');
const vsCode = gpu.compile(VS_SRC, 'main', 'vs_5_0');
const psPointsCode = gpu.compile(PS_POINTS_SRC, 'main', 'ps_5_0');
const vsFsCode = gpu.compile(VS_FULLSCREEN_SRC, 'main', 'vs_5_0');
const psPostCode = gpu.compile(PS_POST_SRC, 'main', 'ps_5_0');

const csClear = gpu.makeComputeShader(clearCode);
const csBuild = gpu.makeComputeShader(buildCode);
const csDensity = gpu.makeComputeShader(densityCode);
const csForce = gpu.makeComputeShader(forceCode);
const vsPoints = gpu.makeVertexShader(vsCode);
const psPoints = gpu.makePixelShader(psPointsCode);
const vsFs = gpu.makeVertexShader(vsFsCode);
const psPost = gpu.makePixelShader(psPostCode);

const D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST = 4;

/** Draw `count` particles as soft splats (6 verts each, TRIANGLELIST; VS expands via SV_VertexID). */
function drawSplats(count: number): void {
  gpu.vcall(dev.context, CTX_RS_SET_STATE, [FFIType.u64], [noCullRaster], FFIType.void);
  gpu.vcall(dev.context, gpu.CTX_IA_SET_PRIMITIVE_TOPOLOGY, [FFIType.u32], [D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST], FFIType.void);
  gpu.vcall(dev.context, gpu.CTX_DRAW, [FFIType.u32, FFIType.u32], [count * 6, 0], FFIType.void);
  gpu.vcall(dev.context, CTX_RS_SET_STATE, [FFIType.u64], [0n], FFIType.void); // restore default raster
}

// ── Helpers to fully unbind compute UAVs/SRVs between passes (avoid hazards) ───
const nullSlot = Buffer.alloc(8);
function clearCsUav(n: number): void {
  for (let i = 0; i < n; i += 1) {
    gpu.vcall(dev.context, gpu.CTX_CS_SET_UNORDERED_ACCESS_VIEWS, [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], [i, 1, nullSlot.ptr!, null], FFIType.void);
  }
}

// ── Camera matrices (column-major upload; copy galaxy's pattern) ───────────────
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
function lookAt(eye: [number, number, number], center: [number, number, number], up: [number, number, number]): number[] {
  let zx = center[0] - eye[0];
  let zy = center[1] - eye[1];
  let zz = center[2] - eye[2];
  const zl = Math.hypot(zx, zy, zz);
  zx /= zl; zy /= zl; zz /= zl;
  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  const xl = Math.hypot(xx, xy, xz);
  xx /= xl; xy /= xl; xz /= xl;
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

const aspect = clientW / clientH;
// Tighter FOV + closer eye so the fluid fills most of the frame.
const proj = perspective((40 * Math.PI) / 180, aspect, 0.05, 100);
let lastViewProj: number[] = mul4(proj, lookAt([2.4, 1.4, 2.4], [0, -0.05, 0], [0, 1, 0]));

// ── GDI HUD ───────────────────────────────────────────────────────────────────
const hudFont = GDI32.CreateFontW(-19, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4, 0, encodeWide('Consolas').ptr!);
const TRANSPARENT_BK = 1;
const particleLabel = PARTICLE_COUNT.toLocaleString();
function drawHud(fps: number): void {
  hud.draw(dev, clientW, clientH, (dc) => {
    const prevFont = GDI32.SelectObject(dc, hudFont);
    GDI32.SetBkMode(dc, TRANSPARENT_BK);
    const line = `SPH 3D · ${particleLabel} particles · ${fps} fps · GPU: ${dev.gpuName}`;
    const text = encodeWide(line);
    const len = line.length;
    GDI32.SetTextColor(dc, 0x00100804);
    GDI32.TextOutW(dc, 19, 19, text.ptr!, len);
    GDI32.SetTextColor(dc, 0x00f0e0c0);
    GDI32.TextOutW(dc, 18, 18, text.ptr!, len);
    GDI32.SelectObject(dc, prevFont);
  });
}

// ── Teardown ────────────────────────────────────────────────────────────────
let cleaned = false;
function cleanup(code: number): never {
  if (!cleaned) {
    cleaned = true;
    try {
      gpu.setBlendState(0n);
      hud.release();
      GDI32.DeleteObject(hudFont);
      gpu.comRelease(additiveBlend);
      gpu.comRelease(noCullRaster);
      gpu.comRelease(sampler);
      gpu.comRelease(hdr.srv ?? 0n);
      gpu.comRelease(hdr.rtv ?? 0n);
      gpu.comRelease(hdr.tex);
      gpu.comRelease(psPost);
      gpu.comRelease(vsFs);
      gpu.comRelease(psPoints);
      gpu.comRelease(vsPoints);
      gpu.comRelease(csForce);
      gpu.comRelease(csDensity);
      gpu.comRelease(csBuild);
      gpu.comRelease(csClear);
      gpu.blobRelease(psPostCode.blob);
      gpu.blobRelease(vsFsCode.blob);
      gpu.blobRelease(psPointsCode.blob);
      gpu.blobRelease(vsCode.blob);
      gpu.blobRelease(forceCode.blob);
      gpu.blobRelease(densityCode.blob);
      gpu.blobRelease(buildCode.blob);
      gpu.blobRelease(clearCode.blob);
      gpu.comRelease(postCb);
      gpu.comRelease(rendCb);
      gpu.comRelease(simCb);
      gpu.comRelease(nextBuf.uav ?? 0n);
      gpu.comRelease(nextBuf.buffer);
      gpu.comRelease(cellHead.uav ?? 0n);
      gpu.comRelease(cellHead.buffer);
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
      // best-effort
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

// ── Sim/render one full frame (multi-pass) ────────────────────────────────────
function fillSimCb(frame: number, mouseWorld: [number, number, number], down: boolean): void {
  simData.writeFloatLE(H, 0);
  simData.writeFloatLE(PARTICLE_MASS, 4);
  simData.writeFloatLE(REST_DENSITY, 8);
  simData.writeFloatLE(STIFFNESS, 12);
  simData.writeFloatLE(VISCOSITY, 16);
  simData.writeFloatLE(GRAVITY, 20);
  simData.writeFloatLE(DT, 24);
  simData.writeFloatLE(BOX, 28);
  simData.writeUInt32LE(GRID, 32);
  simData.writeUInt32LE(PARTICLE_COUNT, 36);
  simData.writeUInt32LE(CELL_COUNT, 40);
  simData.writeUInt32LE(frame >>> 0, 44);
  simData.writeFloatLE(mouseWorld[0], 48);
  simData.writeFloatLE(mouseWorld[1], 52);
  simData.writeFloatLE(mouseWorld[2], 56);
  simData.writeFloatLE(down ? 1 : 0, 60);
  gpu.updateConstantBuffer(simCb, simData);
}

function simStep(frame: number, mouseWorld: [number, number, number], down: boolean): void {
  fillSimCb(frame, mouseWorld, down);
  gpu.csSet(csClear, { cb: [simCb], uav: [posBuf.uav!, velBuf.uav!, cellHead.uav!, nextBuf.uav!] });
  gpu.dispatch(CELL_GROUPS, 1, 1);
  gpu.csSet(csBuild, { cb: [simCb], uav: [posBuf.uav!, velBuf.uav!, cellHead.uav!, nextBuf.uav!] });
  gpu.dispatch(PART_GROUPS, 1, 1);
  gpu.csSet(csDensity, { cb: [simCb], uav: [posBuf.uav!, velBuf.uav!, cellHead.uav!, nextBuf.uav!] });
  gpu.dispatch(PART_GROUPS, 1, 1);
  gpu.csSet(csForce, { cb: [simCb], uav: [posBuf.uav!, velBuf.uav!, cellHead.uav!, nextBuf.uav!] });
  gpu.dispatch(PART_GROUPS, 1, 1);
}

const rtvEmpty: readonly bigint[] = [];

function renderFrame(t: number): void {
  // Auto-orbit camera looking slightly down at the box, framed so the fluid fills it.
  const yaw = 0.7 + t * 0.16;
  const eyeR = 2.55;
  const eyeY = 1.35;
  const eye: [number, number, number] = [Math.sin(yaw) * eyeR, eyeY, Math.cos(yaw) * eyeR];
  const view = lookAt(eye, [0, -0.02, 0], [0, 1, 0]);
  const viewProj = mul4(proj, view);
  lastViewProj = viewProj;
  // Upload TRANSPOSED (HLSL cbuffer matrices are column-major).
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      rendData.writeFloatLE(viewProj[col * 4 + row]!, (row * 4 + col) * 4);
    }
  }
  rendData.writeFloatLE(SPLAT_RADIUS, 64); // splat radius (world units, clip-scaled)
  rendData.writeFloatLE(aspect, 68); // w/h for square splats
  rendData.writeFloatLE(t, 72);
  rendData.writeFloatLE(0, 76);
  gpu.updateConstantBuffer(rendCb, rendData);

  // Render splats additively into HDR.
  gpu.setRenderTargets([hdr.rtv!]);
  gpu.setViewport(clientW, clientH);
  gpu.clear(hdr.rtv!, [0.004, 0.010, 0.030, 1]); // deep-blue near-black
  gpu.setBlendState(additiveBlend);
  gpu.vsSetShaderResources([posBuf.srv!, velBuf.srv!]);
  gpu.vsSet(vsPoints, [rendCb]);
  gpu.psSet(psPoints);
  drawSplats(PARTICLE_COUNT);

  gpu.vsSetShaderResources([0n, 0n]);
  gpu.setBlendState(0n);
  gpu.setRenderTargets(rtvEmpty);

  // Bloom + tonemap to back buffer.
  postData.writeFloatLE(1 / clientW, 0);
  postData.writeFloatLE(1 / clientH, 4);
  postData.writeFloatLE(1.1, 8); // exposure
  postData.writeFloatLE(t, 12);
  gpu.updateConstantBuffer(postCb, postData);

  gpu.setRenderTargets([dev.backBufferRTV]);
  gpu.setViewport(clientW, clientH);
  gpu.clear(dev.backBufferRTV, [0, 0, 0, 1]);
  gpu.vsSet(vsFs);
  gpu.psSet(psPost, { cb: [postCb], srv: [hdr.srv!], samp: [sampler] });
  gpu.drawFullscreenTriangle();
  gpu.psSet(psPost, { srv: [0n] });
}

// Project a screen-pixel cursor onto a world point near the fluid (mid-box plane).
function mouseToWorld(mx: number, my: number): [number, number, number] {
  const ndcX = (mx / clientW) * 2 - 1;
  const ndcY = 1 - (my / clientH) * 2;
  const inv = invert4(lastViewProj);
  if (!inv) return [0, 0, 0];
  const wn = transformPoint(inv, ndcX, ndcY, 0.5);
  return [
    Math.max(-BOX, Math.min(BOX, wn[0])),
    Math.max(-BOX, Math.min(BOX, wn[1])),
    Math.max(-BOX, Math.min(BOX, wn[2])),
  ];
}
function transformPoint(m: number[], x: number, y: number, z: number): [number, number, number] {
  const w = m[12]! * x + m[13]! * y + m[14]! * z + m[15]!;
  const ow = Math.abs(w) < 1e-6 ? 1 : w;
  return [
    (m[0]! * x + m[1]! * y + m[2]! * z + m[3]!) / ow,
    (m[4]! * x + m[5]! * y + m[6]! * z + m[7]!) / ow,
    (m[8]! * x + m[9]! * y + m[10]! * z + m[11]!) / ow,
  ];
}
function invert4(m: number[]): number[] | null {
  const inv = new Array<number>(16);
  const a = m;
  inv[0] = a[5]! * a[10]! * a[15]! - a[5]! * a[11]! * a[14]! - a[9]! * a[6]! * a[15]! + a[9]! * a[7]! * a[14]! + a[13]! * a[6]! * a[11]! - a[13]! * a[7]! * a[10]!;
  inv[4] = -a[4]! * a[10]! * a[15]! + a[4]! * a[11]! * a[14]! + a[8]! * a[6]! * a[15]! - a[8]! * a[7]! * a[14]! - a[12]! * a[6]! * a[11]! + a[12]! * a[7]! * a[10]!;
  inv[8] = a[4]! * a[9]! * a[15]! - a[4]! * a[11]! * a[13]! - a[8]! * a[5]! * a[15]! + a[8]! * a[7]! * a[13]! + a[12]! * a[5]! * a[11]! - a[12]! * a[7]! * a[9]!;
  inv[12] = -a[4]! * a[9]! * a[14]! + a[4]! * a[10]! * a[13]! + a[8]! * a[5]! * a[14]! - a[8]! * a[6]! * a[13]! - a[12]! * a[5]! * a[10]! + a[12]! * a[6]! * a[9]!;
  inv[1] = -a[1]! * a[10]! * a[15]! + a[1]! * a[11]! * a[14]! + a[9]! * a[2]! * a[15]! - a[9]! * a[3]! * a[14]! - a[13]! * a[2]! * a[11]! + a[13]! * a[3]! * a[10]!;
  inv[5] = a[0]! * a[10]! * a[15]! - a[0]! * a[11]! * a[14]! - a[8]! * a[2]! * a[15]! + a[8]! * a[3]! * a[14]! + a[12]! * a[2]! * a[11]! - a[12]! * a[3]! * a[10]!;
  inv[9] = -a[0]! * a[9]! * a[15]! + a[0]! * a[11]! * a[13]! + a[8]! * a[1]! * a[15]! - a[8]! * a[3]! * a[13]! - a[12]! * a[1]! * a[11]! + a[12]! * a[3]! * a[9]!;
  inv[13] = a[0]! * a[9]! * a[14]! - a[0]! * a[10]! * a[13]! - a[8]! * a[1]! * a[14]! + a[8]! * a[2]! * a[13]! + a[12]! * a[1]! * a[10]! - a[12]! * a[2]! * a[9]!;
  inv[2] = a[1]! * a[6]! * a[15]! - a[1]! * a[7]! * a[14]! - a[5]! * a[2]! * a[15]! + a[5]! * a[3]! * a[14]! + a[13]! * a[2]! * a[7]! - a[13]! * a[3]! * a[6]!;
  inv[6] = -a[0]! * a[6]! * a[15]! + a[0]! * a[7]! * a[14]! + a[4]! * a[2]! * a[15]! - a[4]! * a[3]! * a[14]! - a[12]! * a[2]! * a[7]! + a[12]! * a[3]! * a[6]!;
  inv[10] = a[0]! * a[5]! * a[15]! - a[0]! * a[7]! * a[13]! - a[4]! * a[1]! * a[15]! + a[4]! * a[3]! * a[13]! + a[12]! * a[1]! * a[7]! - a[12]! * a[3]! * a[5]!;
  inv[14] = -a[0]! * a[5]! * a[14]! + a[0]! * a[6]! * a[13]! + a[4]! * a[1]! * a[14]! - a[4]! * a[2]! * a[13]! - a[12]! * a[1]! * a[6]! + a[12]! * a[2]! * a[5]!;
  inv[3] = -a[1]! * a[6]! * a[11]! + a[1]! * a[7]! * a[10]! + a[5]! * a[2]! * a[11]! - a[5]! * a[3]! * a[10]! - a[9]! * a[2]! * a[7]! + a[9]! * a[3]! * a[6]!;
  inv[7] = a[0]! * a[6]! * a[11]! - a[0]! * a[7]! * a[10]! - a[4]! * a[2]! * a[11]! + a[4]! * a[3]! * a[10]! + a[8]! * a[2]! * a[7]! - a[8]! * a[3]! * a[6]!;
  inv[11] = -a[0]! * a[5]! * a[11]! + a[0]! * a[7]! * a[9]! + a[4]! * a[1]! * a[11]! - a[4]! * a[3]! * a[9]! - a[8]! * a[1]! * a[7]! + a[8]! * a[3]! * a[5]!;
  inv[15] = a[0]! * a[5]! * a[10]! - a[0]! * a[6]! * a[9]! - a[4]! * a[1]! * a[10]! + a[4]! * a[2]! * a[9]! + a[8]! * a[1]! * a[6]! - a[8]! * a[2]! * a[5]!;
  let det = a[0]! * inv[0]! + a[1]! * inv[4]! + a[2]! * inv[8]! + a[3]! * inv[12]!;
  if (Math.abs(det) < 1e-12) return null;
  det = 1 / det;
  for (let i = 0; i < 16; i += 1) inv[i] = inv[i]! * det;
  return inv;
}

// ── Render loop ───────────────────────────────────────────────────────────────
const SELFSHOT = process.env.SELFSHOT === '1';
const startTime = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
let frame = 0;
let fps = 0;
let fpsFrames = 0;
let fpsWindow = startTime;
let presented = 0;
let selfShotDone = false;

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;
  if ((User32.GetAsyncKeyState(VirtualKey.VK_ESCAPE) & 0x8000) !== 0) break;

  const now = performance.now();
  const t = (now - startTime) / 1000;

  const m = win.getMouse();
  const mouseWorld = m.down ? mouseToWorld(m.x, m.y) : ([0, 0, 0] as [number, number, number]);

  for (let sub = 0; sub < SUBSTEPS; sub += 1) {
    simStep(frame * SUBSTEPS + sub, mouseWorld, m.down);
  }
  clearCsUav(4);
  gpu.csSet(0n, {});

  renderFrame(t);

  // Self-check: capture the back buffer mid-collapse (PNG before present() because
  // DXGI_SWAP_EFFECT_DISCARD leaves the back buffer undefined after Present).
  if (SELFSHOT && !selfShotDone && frame >= 60) {
    selfShotDone = true;
    drawHud(fps);
    const dir = `${import.meta.dir}/screenshots`;
    try { require('node:fs').mkdirSync(dir, { recursive: true }); } catch { /* exists */ }
    const snap = captureBackBuffer(dev, `${dir}/sph3d.selfcheck.png`, { gridW: 48, gridH: 22 });
    console.log(formatGrid(snap));
    console.log(`  png ok=${snap.ok} ${snap.width}x${snap.height} nonBlackPct=${(snap.nonBlackFrac * 100).toFixed(2)} meanLuma=${snap.meanLuma.toFixed(3)} → ${snap.path}`);
    dev.present(false);
    break;
  }

  drawHud(fps);
  dev.present(false);
  presented += 1;

  frame += 1;
  fpsFrames += 1;
  if (now - fpsWindow >= 500) {
    fps = Math.round((fpsFrames * 1000) / (now - fpsWindow));
    fpsFrames = 0;
    fpsWindow = now;
  }

  if (durationMs > 0 && now - startTime >= durationMs) break;
}

console.log(`SPH 3D finished — frames presented=${presented}.`);
cleanup(0);
