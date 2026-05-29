/**
 * Cloth — a 65,536-node GPU soft-body banner rippling over a sphere, in pure TypeScript.
 *
 * A borderless 1280x720 window holds a 256x256 = 65,536-particle cloth lattice — a
 * hanging banner pinned along its top edge — simulated ENTIRELY on the GPU as a stack
 * of Direct3D 11 compute shaders. Each frame:
 *   1. INTEGRATE CS (Verlet): pos' = 2·pos - prev + a·dt², where the acceleration is
 *      gravity plus a time-oscillating, height-modulated wind gust. The old position
 *      becomes the new prevPos. Pinned nodes (w == 0) are frozen so the top edge holds.
 *   2. SOLVE CS (XPBD-style distance constraints), run K Jacobi iterations that
 *      ping-pong two position buffers: every thread reads its 4 structural + 4 shear
 *      grid neighbours, sums half-corrections that pull each edge back toward its rest
 *      length, then projects the node out of a moving collision sphere and re-pins the
 *      top row. Reading src as an SRV and writing dst as a UAV (UAV unbound before the
 *      swap) keeps the solve hazard-free.
 *   3. RENDER: the solved positions feed a vertex shader through a position SRV by
 *      SV_VertexID. Each node is expanded into a small camera-facing additive quad
 *      (6 verts/particle, no vertex/index buffer) projected by a row-major view·proj
 *      matrix uploaded TRANSPOSED, accumulated into an R16G16B16A16_FLOAT HDR target.
 *      The pixel shader tints by local stretch + height for a shimmering fabric look.
 *   4. POST: a fullscreen pass blooms + Reinhard-tonemaps the HDR target to the back
 *      buffer. The camera auto-orbits the banner; a GDI HUD shows node count + fps.
 *
 * Nothing is precomputed — HLSL is JIT-compiled at runtime onto your real GPU, and
 * every D3D11 COM call is a hand-walked vtable invocation over Bun FFI.
 *
 * @bun-win32 / engine APIs used (from ./_gpu): createWindow, createDevice, compile,
 *   makeComputeShader / makeVertexShader / makePixelShader, makeStructuredBuffer
 *   (UAV+SRV ping-pong, initialData seeding), makeTexture (HDR RTV+SRV), makeSampler,
 *   makeConstantBuffer / updateConstantBuffer, makeAdditiveBlendState / setBlendState,
 *   csSet / dispatch, vsSetShaderResources / vsSet / psSet / drawPoints (Draw),
 *   setRenderTargets / setViewport / clear / drawFullscreenTriangle, present,
 *   copyResource, comRelease / blobRelease, vcall (raw vtable). GDI32 TextOutW HUD.
 *   Snapshot/verify: _snapshot.captureBackBuffer + formatGrid.
 *
 * Run: bun run packages/all/example/cloth.ts
 */

import { FFIType, type Pointer } from 'bun:ffi';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { GDI32, User32 } from '../index';
import { SystemMetric } from '@bun-win32/user32';
import * as gpu from './_gpu';
import * as hud from './_hud';
import { captureBackBuffer, formatGrid } from './_snapshot';

const encodeWide = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');

// Fill the primary monitor (borderless). The HDR target + post both use clientW/clientH
// so they follow whatever the window's real client size turns out to be.
const WIDTH = User32.GetSystemMetrics(SystemMetric.SM_CXSCREEN) || 1280;
const HEIGHT = User32.GetSystemMetrics(SystemMetric.SM_CYSCREEN) || 720;

// Virtual-key codes for the interactive controls.
const VK_LEFT = 0x25;
const VK_UP = 0x26;
const VK_RIGHT = 0x27;
const VK_DOWN = 0x28;
const VK_SPACE = 0x20;
const VK_Q = 0x51;
const VK_E = 0x45;
const VK_Z = 0x5a;
const VK_X = 0x58;
const VK_P = 0x50;
const VK_R = 0x52;

// 256 × 256 = 65,536 cloth nodes. numthreads(256) → side groups for the 1D dispatch.
const GRID_W = 256;
const GRID_H = 256;
const NODE_COUNT = GRID_W * GRID_H;
const THREADS = 256;
const GROUPS = NODE_COUNT / THREADS;

// World layout: the banner hangs from y≈+REST*H/2 down, REST is the grid spacing.
const REST = 0.05; // rest length between adjacent nodes (uniform grid spacing)
const CLOTH_W = REST * (GRID_W - 1); // ~12.75 world units wide
const CLOTH_H = REST * (GRID_H - 1); // ~12.75 world units tall
const SOLVE_ITERS = 16; // Jacobi constraint passes per frame
const STRIDE = 16; // float4 per node (xyz + w pin flag)

// ── Window + device ───────────────────────────────────────────────────────────
const win = gpu.createWindow({ title: 'Cloth — 65,536-node GPU soft-body, brushable in pure TypeScript', width: WIDTH, height: HEIGHT, borderless: true });
const { w: clientW, h: clientH } = win.clientSize();
const dev = gpu.createDevice(win.hwnd, { width: clientW, height: clientH });

console.log('Cloth — a 65,536-node GPU soft-body, simulated & rendered in pure TypeScript.');
console.log(`  ${NODE_COUNT.toLocaleString()} nodes · ${SOLVE_ITERS} XPBD iters/frame · ${dev.driver} · ${dev.gpuName}`);
console.log('  LMB drag: brush · arrows: orbit · Q/E: zoom · Z/X: wind · P: pin mode · Space: auto-orbit · R: reset · ESC.\n');

// ── Seed the cloth: a FLAT plane in world space, hanging from the top ────────────
// The sheet is laid out as a flat lattice that hangs DOWN from the top: gx maps to
// world +x (left → right across the cloth), gy maps to world -y (top row → bottom).
// Which nodes are actually held is decided IN-SHADER from the grid coords (pinMode),
// so this seed only establishes the rest/start geometry. The exact same formula
// (x0, yTop, restPos) is mirrored in both compute shaders so a pinned node freezes at
// precisely its lattice rest point regardless of the chosen pin mode. A whisper of z
// waviness breaks the first-frame flatness so the lighting has something to catch.
const posSeed = Buffer.alloc(NODE_COUNT * STRIDE);
{
  const x0 = -CLOTH_W * 0.5; // left edge
  const yTop = CLOTH_H * 0.5; // top edge
  for (let gy = 0; gy < GRID_H; gy += 1) {
    for (let gx = 0; gx < GRID_W; gx += 1) {
      const i = gy * GRID_W + gx;
      const x = x0 + gx * REST;
      const y = yTop - gy * REST;
      const z = Math.sin(gx * 0.16) * 0.06 + Math.cos(gy * 0.11) * 0.04;
      const o = i * STRIDE;
      posSeed.writeFloatLE(x, o + 0);
      posSeed.writeFloatLE(y, o + 4);
      posSeed.writeFloatLE(z, o + 8);
      posSeed.writeFloatLE(1, o + 12); // P.w unused for pinning now (shader decides); keep 1
    }
  }
}

// Three position buffers: pos (current), prev (Verlet history), plus a scratch buffer
// for the Jacobi ping-pong solve. All are UAV+SRV structured float4 buffers.
let posBuf = gpu.makeStructuredBuffer({ stride: STRIDE, count: NODE_COUNT, uav: true, srv: true, initialData: posSeed });
let prevBuf = gpu.makeStructuredBuffer({ stride: STRIDE, count: NODE_COUNT, uav: true, srv: true, initialData: posSeed });
let scratchBuf = gpu.makeStructuredBuffer({ stride: STRIDE, count: NODE_COUNT, uav: true, srv: true, initialData: posSeed });

// ── HDR accumulation target + sampler + additive blend ──────────────────────────
const hdr = gpu.makeTexture({ w: clientW, h: clientH, format: gpu.DXGI_FORMAT_R16G16B16A16_FLOAT, rtv: true, srv: true });
const sampler = gpu.makeSampler({ filter: gpu.D3D11_FILTER_MIN_MAG_MIP_LINEAR, address: gpu.D3D11_TEXTURE_ADDRESS_CLAMP });
const additiveBlend = gpu.makeAdditiveBlendState(true);

// ── No-cull rasterizer state ────────────────────────────────────────────────────
// The cloth quads are double-sided camera-facing sprites; with the default
// CULL_BACK rasterizer half (or all, when the plane faces the camera) of the
// triangles are culled by winding and nothing rasterizes. CULL_NONE draws both
// faces so the banner is always solid. CreateRasterizerState is slot 22, RSSetState 43.
const DEV_CREATE_RASTERIZER_STATE = 22;
const CTX_RS_SET_STATE = 43;
const noCullState = (() => {
  // D3D11_RASTERIZER_DESC (40 bytes): FillMode@0(3=SOLID), CullMode@4(1=NONE),
  // FrontCounterClockwise@8, DepthBias@12, DepthBiasClamp@16, SlopeScaledDepthBias@20,
  // DepthClipEnable@24, ScissorEnable@28, MultisampleEnable@32, AntialiasedLineEnable@36.
  const rdesc = Buffer.alloc(40);
  rdesc.writeInt32LE(3, 0); // FILL_SOLID
  rdesc.writeInt32LE(1, 4); // CULL_NONE
  rdesc.writeInt32LE(1, 24); // DepthClipEnable
  const pp = Buffer.alloc(8);
  if (gpu.vcall(dev.device, DEV_CREATE_RASTERIZER_STATE, [FFIType.ptr, FFIType.ptr], [rdesc.ptr!, pp.ptr!]) !== 0) {
    throw new Error('CreateRasterizerState (no-cull) failed.');
  }
  return pp.readBigUInt64LE(0);
})();

// ── Constant buffers ────────────────────────────────────────────────────────────
// Sim CB (compute): shared by integrate + solve.
//   float4 p0 (dt, time, gridW, gridH)
//   float4 p1 (rest, gravity, damping, stiffness)
//   float4 wind (wx, wy, wz, windStrength)
//   float4 sphere (cx, cy, cz, radius)
//   float4 p2 (pinMode, -, -, -)  — selects which lattice nodes are held in-shader
const SIM_CB_SIZE = 80;
const simCb = gpu.makeConstantBuffer(SIM_CB_SIZE);
const simData = Buffer.alloc(SIM_CB_SIZE);

// Brush CB (compute): the mouse-drag injector.
//   float4x4 gVP (the SAME viewProj used to render, uploaded TRANSPOSED) @0
//   float4 gMouse (ndcX, ndcY, active, radius) @64
//   float4 gDrag  (dx, dy, dz, strength)       @80
const BRUSH_CB_SIZE = 96;
const brushCb = gpu.makeConstantBuffer(BRUSH_CB_SIZE);
const brushData = Buffer.alloc(BRUSH_CB_SIZE);

// Render CB (VS+PS): float4x4 viewProj (64) + float4 params (-, gridW, gridH, time)
//   + float4 camPos(xyz) + float4 lightDir(xyz) = 64 + 16 + 16 + 16 = 112.
const REND_CB_SIZE = 112;
const rendCb = gpu.makeConstantBuffer(REND_CB_SIZE);
const rendData = Buffer.alloc(REND_CB_SIZE);

// Post CB: float4 (texelW, texelH, exposure, time).
const POST_CB_SIZE = 16;
const postCb = gpu.makeConstantBuffer(POST_CB_SIZE);
const postData = Buffer.alloc(POST_CB_SIZE);

// ── HLSL: INTEGRATE (Verlet) ─────────────────────────────────────────────────────
const CS_INTEGRATE = `
cbuffer Sim : register(b0) {
  float4 gP0;     // x=dt, y=time, z=gridW, w=gridH
  float4 gP1;     // x=rest, y=gravity, z=damping, w=stiffness
  float4 gWind;   // xyz=wind dir, w=wind strength
  float4 gSphere; // xyz=center, w=radius
  float4 gP2;     // x=pinMode (0=top corners, 1=top edge, 2=left edge)
};
RWStructuredBuffer<float4> Pos  : register(u0);
RWStructuredBuffer<float4> Prev : register(u1);

[numthreads(${THREADS},1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint i = id.x;
  uint count = (uint)(gP0.z * gP0.w);
  if (i >= count) return;

  uint gw = (uint)gP0.z;
  uint gh = (uint)gP0.w;
  uint gx = i % gw;
  uint gy = i / gw;
  float rest = gP1.x;

  // Deterministic pin geometry: the lattice's flat rest plane, hung from the top.
  float x0   = -rest * (gP0.z - 1.0) * 0.5;
  float yTop =  rest * (gP0.w - 1.0) * 0.5;
  float3 restPos = float3(x0 + gx * rest, yTop - gy * rest, 0.0);
  int mode = (int)gP2.x;
  bool pinned = (mode == 0) ? (gy == 0 && (gx == 0 || gx == gw - 1))  // top corners
              : (mode == 1) ? (gy == 0)                               // top edge
              :               (gx == 0);                              // left edge

  if (pinned) { Pos[i] = float4(restPos, 0); Prev[i] = float4(restPos, 0); return; }

  float4 P = Pos[i];
  float3 p = P.xyz;
  float  pin = 1.0;        // free node

  float3 prev = Prev[i].xyz;
  float dt = gP0.x;
  float t  = gP0.y;

  float u = (float)gx / (gP0.z - 1.0);
  float vv = (float)gy / (gP0.w - 1.0);

  // Gravity dominates — the cloth hangs from its held edge and DRAPES. The wind is a
  // gentle OUT-OF-PLANE (z) travelling flutter that ripples the sheet without dragging
  // it sideways into a cinched column. Its amplitude grows with distance from the held
  // top (vv): the held edge stays taut while the free lower body breathes and billows.
  float3 g = float3(0, gP1.y, 0);
  // Reach: ~0 at the held top, growing toward the free bottom so folds open downward.
  float reach = 0.10 + 0.90 * vv;
  // A faint lateral lean from the wind direction (mostly z), kept small so the drape
  // stays broad and centred rather than streaming off to one side.
  float3 drift = normalize(gWind.xyz + 1e-5) * gWind.w * 0.10 * reach;
  // Dominant out-of-plane travelling wave — the visible ripple of cloth. The phase
  // shears across BOTH axes so neighbouring columns swing on different beats and the
  // sheet fans into broad diagonal folds instead of all lurching together.
  float wave = sin(t * 3.4 + u * 7.0 - vv * 5.0)
             + 0.6 * sin(t * 2.1 - u * 4.5 + vv * 8.0)
             + 0.35 * sin(t * 5.2 + u * 11.0 + vv * 3.0);
  float3 flutter = float3(0, 0, 1) * wave * gWind.w * reach * 0.55;
  // A touch of vertical undulation so folds tilt and the lower hem breathes.
  flutter.y += sin(t * 2.6 + u * 6.0 - vv * 6.0) * gWind.w * reach * 0.18;
  float3 a = g + drift + flutter;

  // Verlet integration with velocity damping.
  float damp = gP1.z;
  float3 vel = (p - prev) * damp;
  float3 np = p + vel + a * dt * dt;

  Prev[i] = float4(p, 1.0);
  Pos[i]  = float4(np, 1.0);
}
`;

// ── HLSL: SOLVE (one Jacobi distance-constraint + collision pass, ping-pong) ──────
// Reads Src as a StructuredBuffer SRV, writes Dst as a RWStructuredBuffer UAV. Each
// node gathers its 4 axis-aligned (structural) and 4 diagonal (shear) grid neighbours,
// accumulates a half-correction toward the rest length of each edge, applies the
// accumulated correction (under-relaxed), then resolves the collision sphere and re-pins.
const CS_SOLVE = `
cbuffer Sim : register(b0) {
  float4 gP0;     // x=dt, y=time, z=gridW, w=gridH
  float4 gP1;     // x=rest, y=gravity, z=damping, w=stiffness
  float4 gWind;
  float4 gSphere; // xyz=center, w=radius
  float4 gP2;     // x=pinMode (0=top corners, 1=top edge, 2=left edge)
};
StructuredBuffer<float4>   Src : register(t0);
RWStructuredBuffer<float4> Dst : register(u0);

static const float SQRT2 = 1.41421356;

void accumulate(inout float3 corr, inout float wsum, float3 p, uint ni, float restLen, float stiff) {
  float3 q = Src[ni].xyz;
  float3 d = p - q;
  float len = length(d);
  if (len > 1e-6) {
    float diff = (len - restLen) / len;
    // Half the correction goes to THIS node (Jacobi-style symmetric split).
    corr -= d * diff * 0.5 * stiff;
    wsum += 1.0;
  }
}

[numthreads(${THREADS},1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint i = id.x;
  uint gw = (uint)gP0.z;
  uint gh = (uint)gP0.w;
  uint count = gw * gh;
  if (i >= count) return;

  float4 P = Src[i];
  float3 p = P.xyz;

  uint gx = i % gw;
  uint gy = i / gw;
  float rest = gP1.x;
  float diag = rest * SQRT2;
  float stiff = gP1.w;

  // Same deterministic pin geometry + mode test as the integrate pass.
  float x0   = -rest * (gP0.z - 1.0) * 0.5;
  float yTop =  rest * (gP0.w - 1.0) * 0.5;
  float3 restPos = float3(x0 + gx * rest, yTop - gy * rest, 0.0);
  int mode = (int)gP2.x;
  bool pinned = (mode == 0) ? (gy == 0 && (gx == 0 || gx == gw - 1))  // top corners
              : (mode == 1) ? (gy == 0)                               // top edge
              :               (gx == 0);                              // left edge

  if (pinned) { Dst[i] = float4(restPos, 0); return; }

  float3 corr = 0.0.xxx;
  float wsum = 0.0;
  // Structural neighbours (±x, ±y).
  if (gx > 0)      accumulate(corr, wsum, p, i - 1,  rest, stiff);
  if (gx < gw - 1) accumulate(corr, wsum, p, i + 1,  rest, stiff);
  if (gy > 0)      accumulate(corr, wsum, p, i - gw, rest, stiff);
  if (gy < gh - 1) accumulate(corr, wsum, p, i + gw, rest, stiff);
  // Shear neighbours (diagonals) — keep the weave from collapsing in shear.
  if (gx > 0      && gy > 0)      accumulate(corr, wsum, p, i - gw - 1, diag, stiff);
  if (gx < gw - 1 && gy > 0)      accumulate(corr, wsum, p, i - gw + 1, diag, stiff);
  if (gx > 0      && gy < gh - 1) accumulate(corr, wsum, p, i + gw - 1, diag, stiff);
  if (gx < gw - 1 && gy < gh - 1) accumulate(corr, wsum, p, i + gw + 1, diag, stiff);

  if (wsum > 0.0) p += corr / wsum;

  // Collision sphere: push the node out to the surface if it penetrated.
  float3 toC = p - gSphere.xyz;
  float dC = length(toC);
  float R = gSphere.w;
  if (dC < R && dC > 1e-5) p = gSphere.xyz + toC * (R / dC);

  Dst[i] = float4(p, 1.0);
}
`;

// ── HLSL: BRUSH (mouse-drag injector) ─────────────────────────────────────────────
// Runs AFTER integrate, BEFORE the solve loop. Projects each node to clip space with
// the SAME viewProj as the render pass, and if it falls under the mouse-brush disc in
// NDC, ADDS the drag world-vector into Pos (not Prev) — in a Verlet sim adding to the
// current position injects velocity, so dragging visibly grabs and swipes the fabric.
// Pinned nodes (re-derived with the identical pinMode test) are skipped so the held
// edge never tears loose. smoothstep falls off from the disc centre to its rim.
const CS_BRUSH = `
cbuffer Brush : register(b0) {
  float4x4 gVP;     // same viewProj as render, uploaded TRANSPOSED
  float4   gMouse;  // x=ndcX, y=ndcY, z=active, w=radius
  float4   gDrag;   // xyz=world drag vector, w=strength
};
RWStructuredBuffer<float4> Pos : register(u0);

static const uint GW = ${GRID_W};
static const uint GH = ${GRID_H};

[numthreads(${THREADS},1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint i = id.x;
  if (i >= GW * GH) return;
  if (gMouse.z < 0.5) return;          // brush inactive (mouse up)

  // Project the node with the SAME viewProj the cloth is rendered with, test the
  // mouse-brush disc in NDC, and ADD the drag world-vector into Pos (not Prev) so the
  // Verlet integrator reads it as injected velocity. Held nodes never need an explicit
  // skip here: the very next solve pass re-pins them to their rest point each frame, so
  // any transient brush nudge to the held edge is overwritten before it is ever drawn.
  float4 clip = mul(gVP, float4(Pos[i].xyz, 1.0));
  if (clip.w > 0.001) {
    float2 ndc = clip.xy / clip.w;
    float d = distance(ndc, gMouse.xy);
    if (d < gMouse.w) {
      float f = smoothstep(gMouse.w, 0.0, d) * gDrag.w;
      Pos[i].xyz += gDrag.xyz * f;
    }
  }
}
`;

// ── HLSL: RENDER VS — triangulate the solved lattice into a real lit surface ──────
// 6 verts per GRID CELL (two triangles), no vertex/index buffer: the VS derives the
// cell (gx,gy) and corner from SV_VertexID, fetches the four solved corner positions
// straight from the position SRV, and computes a SMOOTH per-vertex normal by central
// finite differences of the corner's neighbours. World position, normal, the surface
// stretch, and a fabric UV all flow to the PS for genuine directional + rim lighting.
const VS_SRC = `
cbuffer Rend : register(b0) {
  float4x4 gViewProj;
  float4   gParams;   // x=(unused), y=gridW, z=gridH, w=time
  float4   gCamPos;   // xyz=camera world pos
  float4   gLightDir; // xyz=normalized light direction (toward scene)
};
StructuredBuffer<float4> Pos : register(t0);

struct VSOut {
  float4 pos     : SV_Position;
  float3 wpos    : TEXCOORD0;
  float3 nrm     : TEXCOORD1;
  float2 uv      : TEXCOORD2;
  float  stretch : TEXCOORD3;
};

static const uint GW = ${GRID_W};
static const uint GH = ${GRID_H};
static const float REST = ${REST.toFixed(5)};

float3 fetch(uint x, uint y) {
  x = min(x, GW - 1u);
  y = min(y, GH - 1u);
  return Pos[y * GW + x].xyz;
}

// Smooth normal at lattice node (x,y) from central differences of its neighbours.
float3 nodeNormal(uint x, uint y) {
  float3 dx = fetch(x + 1u, y) - fetch(max(x, 1u) - 1u, y);
  float3 dy = fetch(x, y + 1u) - fetch(x, max(y, 1u) - 1u);
  return normalize(cross(dx, dy) + float3(0, 0, 1e-5));
}

VSOut main(uint vid : SV_VertexID) {
  uint cell   = vid / 6u;            // which grid quad
  uint corner = vid % 6u;            // which of the 6 triangle verts
  uint cellsW = GW - 1u;
  uint cx = cell % cellsW;           // cell column 0..GW-2
  uint cy = cell / cellsW;           // cell row    0..GH-2

  // Two triangles: (0,0)(1,0)(1,1) and (0,0)(1,1)(0,1).
  uint2 off;
  if      (corner == 0u) off = uint2(0u, 0u);
  else if (corner == 1u) off = uint2(1u, 0u);
  else if (corner == 2u) off = uint2(1u, 1u);
  else if (corner == 3u) off = uint2(0u, 0u);
  else if (corner == 4u) off = uint2(1u, 1u);
  else                   off = uint2(0u, 1u);

  uint gx = cx + off.x;
  uint gy = cy + off.y;

  float3 p   = fetch(gx, gy);
  float3 nrm = nodeNormal(gx, gy);

  // Local stretch (taut vs slack) from the cell's edge lengths vs rest.
  float lenX = length(fetch(gx + 1u, gy) - fetch(gx, gy));
  float lenY = length(fetch(gx, gy + 1u) - fetch(gx, gy));
  float stretch = saturate((max(lenX, lenY) / REST - 1.0) * 1.4);

  VSOut o;
  o.pos     = mul(gViewProj, float4(p, 1.0));
  o.wpos    = p;
  o.nrm     = nrm;
  o.uv      = float2((float)gx / (GW - 1.0), (float)gy / (GH - 1.0)); // 0..1 over the flag
  o.stretch = stretch;
  return o;
}
`;

// ── HLSL: RENDER PS — silk banner material, directional + rim light, sheen ────────
// A two-sided lit fabric: the geometric normal is flipped toward the eye so both
// faces shade, a key directional light gives form, a warm rim picks out the silhouette
// of every fold, and a tight specular highlight reads as silk sheen. The cloth carries
// a woven base colour plus crisp vertical accent stripes (a banner motif) and a subtle
// diagonal weave, all in UV space so the rippling folds are unmistakably fabric.
const PS_SURFACE_SRC = `
cbuffer Rend : register(b0) {
  float4x4 gViewProj;
  float4   gParams;   // w=time
  float4   gCamPos;
  float4   gLightDir;
};

struct VSOut {
  float4 pos     : SV_Position;
  float3 wpos    : TEXCOORD0;
  float3 nrm     : TEXCOORD1;
  float2 uv      : TEXCOORD2;
  float  stretch : TEXCOORD3;
};

float4 main(VSOut i) : SV_Target {
  float3 V = normalize(gCamPos.xyz - i.wpos);     // toward eye
  float3 N = normalize(i.nrm);
  if (dot(N, V) < 0.0) N = -N;                    // two-sided: face the camera
  float3 L = normalize(-gLightDir.xyz);           // toward the light
  float3 H = normalize(L + V);

  // ── Fabric material ──────────────────────────────────────────────────────────
  // Vertical banner gradient (top cool → bottom warm) gives the cloth depth.
  float3 colTop = float3(0.05, 0.32, 0.95);       // deep azure
  float3 colMid = float3(0.70, 0.08, 0.62);       // royal magenta
  float3 colBot = float3(1.00, 0.42, 0.06);       // sunset amber
  float v = i.uv.y;
  float3 base = (v < 0.5) ? lerp(colTop, colMid, v * 2.0) : lerp(colMid, colBot, (v - 0.5) * 2.0);

  // Crisp vertical accent stripes streaming with the flag (a banner motif).
  float stripe = abs(frac(i.uv.x * 9.0) - 0.5) * 2.0;     // 0 at stripe centre
  float stripeMask = smoothstep(0.18, 0.0, stripe);       // bright bands
  base = lerp(base, base * 0.32 + float3(0.9, 0.85, 0.7) * 0.18, stripeMask * 0.7);

  // Fine diagonal weave so the fabric never looks like flat plastic.
  float weave = 0.5 + 0.5 * sin((i.uv.x + i.uv.y) * 380.0);
  weave *= 0.5 + 0.5 * sin((i.uv.x - i.uv.y) * 360.0);
  base *= 0.90 + 0.10 * weave;

  // Taut regions warm toward hot gold; slack regions stay saturated.
  base = lerp(base, float3(1.0, 0.82, 0.42), i.stretch * 0.5);

  // ── Lighting ───────────────────────────────────────────────────────────────
  float ndl = saturate(dot(N, L));
  float wrap = saturate((dot(N, L) + 0.30) / 1.30);        // soft wrap for cloth
  float3 ambient = float3(0.10, 0.13, 0.22) * (0.7 + 0.3 * v);
  float3 diffuse = base * (wrap * 0.55 + ndl * 0.38);

  // Silk sheen: a tight, slightly-warm highlight plus a coloured satin lobe. Both are
  // kept narrow and the satin lobe is tinted by the fabric colour so taut sheen stays
  // saturated instead of washing the banner to white.
  float specT = pow(saturate(dot(N, H)), 120.0) * 0.55;
  float3 spec = float3(1.0, 0.95, 0.85) * specT;
  float3 satin = base * pow(saturate(dot(N, H)), 22.0) * 0.30;

  // Warm rim light traces every fold's silhouette.
  float rim = pow(1.0 - saturate(dot(N, V)), 3.0);
  float3 rimCol = float3(1.0, 0.66, 0.40) * rim * 0.85;

  // Subtle translucency: light bleeding through the thin cloth from behind.
  float back = pow(saturate(dot(-N, L)), 2.0) * 0.22;
  float3 trans = base * back;

  float3 col = ambient * base + diffuse + spec + satin + rimCol + trans;

  return float4(col, 1.0);
}
`;

// ── HLSL: POST — bloom + Reinhard tonemap of the HDR target → back buffer ────────
const PS_POST_SRC = `
cbuffer Post : register(b0) { float4 gP; }; // x=texelW, y=texelH, z=exposure, w=time
Texture2D Hdr : register(t0);
SamplerState Smp : register(s0);

float3 sampleHdr(float2 uv) { return Hdr.SampleLevel(Smp, uv, 0).rgb; }

float3 bloom(float2 uv) {
  float2 tx = gP.xy;
  float3 b = 0.0.xxx;
  float wsum = 0.0;
  const int N = 6;
  [unroll] for (int k = -N; k <= N; k++) {
    float fw = exp(-float(k * k) / 18.0);
    b += sampleHdr(uv + float2(tx.x * float(k) * 2.2, 0.0)) * fw;
    b += sampleHdr(uv + float2(0.0, tx.y * float(k) * 2.2)) * fw;
    wsum += fw * 2.0;
  }
  return b / wsum;
}

float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float3 hdr = sampleHdr(uv);
  float3 bl  = bloom(uv);
  // Only the brightest sheen/rim highlights bloom — keeps the fabric crisp.
  float3 brightOnly = max(bl - 0.85.xxx, 0.0.xxx);
  float3 col = hdr + brightOnly * 0.7;

  col *= gP.z; // exposure

  // Gentle vignette to seat the banner in the frame.
  float2 q = uv - 0.5;
  float vig = smoothstep(1.05, 0.20, dot(q, q) * 1.7);
  col *= lerp(0.62, 1.0, vig);

  // Filmic ACES-ish tonemap for richer contrast than plain Reinhard.
  float3 x = col * 0.85;
  col = saturate((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14));
  col = pow(col, (1.0 / 2.2).xxx);      // gamma
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

// ── Compile + create shaders ──────────────────────────────────────────────────────
const csIntegrateCode = gpu.compile(CS_INTEGRATE, 'main', 'cs_5_0');
const csSolveCode = gpu.compile(CS_SOLVE, 'main', 'cs_5_0');
const csBrushCode = gpu.compile(CS_BRUSH, 'main', 'cs_5_0');
const vsCode = gpu.compile(VS_SRC, 'main', 'vs_5_0');
const psSurfaceCode = gpu.compile(PS_SURFACE_SRC, 'main', 'ps_5_0');
const vsFullscreenCode = gpu.compile(VS_FULLSCREEN_SRC, 'main', 'vs_5_0');
const psPostCode = gpu.compile(PS_POST_SRC, 'main', 'ps_5_0');

const csIntegrate = gpu.makeComputeShader(csIntegrateCode);
const csSolve = gpu.makeComputeShader(csSolveCode);
const csBrush = gpu.makeComputeShader(csBrushCode);
const vsSurface = gpu.makeVertexShader(vsCode);
const psSurface = gpu.makePixelShader(psSurfaceCode);
const vsFullscreen = gpu.makeVertexShader(vsFullscreenCode);
const psPost = gpu.makePixelShader(psPostCode);

// Cells (= quads) in the lattice; each expands to 2 triangles = 6 verts in the VS.
const CELL_COUNT = (GRID_W - 1) * (GRID_H - 1);

// ── Camera math (row-major; uploaded TRANSPOSED so HLSL column-major reads recover it) ─
type V3 = [number, number, number];
function lookAt(eye: V3, center: V3, up: V3): number[] {
  // Left-handed (D3D): zaxis = normalize(center - eye).
  let zx = center[0] - eye[0];
  let zy = center[1] - eye[1];
  let zz = center[2] - eye[2];
  const zl = Math.hypot(zx, zy, zz) || 1;
  zx /= zl; zy /= zl; zz /= zl;
  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  const xl = Math.hypot(xx, xy, xz) || 1;
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
function mul4(a: number[], b: number[]): number[] {
  const r = new Array<number>(16).fill(0);
  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < 4; j += 1) {
      let s = 0;
      for (let k = 0; k < 4; k += 1) s += a[i * 4 + k]! * b[k * 4 + j]!;
      r[i * 4 + j] = s;
    }
  }
  return r;
}

// ── Interactive state (mutated by the input handling each frame) ───────────────
const PIN_MODE_LABELS = ['Top corners', 'Top edge', 'Left edge'] as const;
let pinMode = 0; // 0 = top corners, 1 = top edge, 2 = left edge
let windStrength = 5.6; // Z/X adjust; clamped [0, 12]
let autoOrbit = true; // Space toggles the gentle idle orbit

// ── GDI HUD font ──────────────────────────────────────────────────────────────
const hudFont = GDI32.CreateFontW(-19, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4 /* ANTIALIASED_QUALITY */, 0, encodeWide('Consolas').ptr!);
const hudFontSmall = GDI32.CreateFontW(-15, 0, 0, 0, 500, 0, 0, 0, 0, 0, 0, 4 /* ANTIALIASED_QUALITY */, 0, encodeWide('Consolas').ptr!);
const TRANSPARENT_BK = 1;
const nodeLabel = NODE_COUNT.toLocaleString();

function drawHud(fps: number): void {
  hud.draw(dev, clientW, clientH, (dc) => {
    GDI32.SetBkMode(dc, TRANSPARENT_BK);

    // Line 1 — live state (drawn with the bold font, drop-shadowed for legibility).
    const prevBold = GDI32.SelectObject(dc, hudFont);
    const line1 = `Cloth · ${nodeLabel} nodes · pin: ${PIN_MODE_LABELS[pinMode]} · wind ${windStrength.toFixed(1)} · ${fps} fps`;
    const t1 = encodeWide(line1);
    GDI32.SetTextColor(dc, 0x00100804);
    GDI32.TextOutW(dc, 19, 19, t1.ptr!, line1.length);
    GDI32.SetTextColor(dc, 0x00f0d8b0);
    GDI32.TextOutW(dc, 18, 18, t1.ptr!, line1.length);

    // Line 2 — the controls legend (lighter, smaller).
    GDI32.SelectObject(dc, hudFontSmall);
    const line2 = 'LMB drag: brush  ·  arrows: orbit  ·  Q/E: zoom  ·  Z/X: wind  ·  P: pin mode  ·  Space: auto-orbit  ·  R: reset  ·  ESC';
    const t2 = encodeWide(line2);
    GDI32.SetTextColor(dc, 0x00080604);
    GDI32.TextOutW(dc, 19, 45, t2.ptr!, line2.length);
    GDI32.SetTextColor(dc, 0x00c0b090);
    GDI32.TextOutW(dc, 18, 44, t2.ptr!, line2.length);

    GDI32.SelectObject(dc, prevBold);
  });
}

// ── Teardown ──────────────────────────────────────────────────────────────────
let cleanedUp = false;
function cleanup(code: number): never {
  if (!cleanedUp) {
    cleanedUp = true;
    try {
      gpu.setBlendState(0n);
      hud.release();
      GDI32.DeleteObject(hudFontSmall);
      GDI32.DeleteObject(hudFont);
      gpu.comRelease(noCullState);
      gpu.comRelease(additiveBlend);
      gpu.comRelease(sampler);
      gpu.comRelease(hdr.srv ?? 0n);
      gpu.comRelease(hdr.rtv ?? 0n);
      gpu.comRelease(hdr.tex);
      gpu.comRelease(psPost);
      gpu.comRelease(vsFullscreen);
      gpu.comRelease(psSurface);
      gpu.comRelease(vsSurface);
      gpu.comRelease(csBrush);
      gpu.comRelease(csSolve);
      gpu.comRelease(csIntegrate);
      gpu.blobRelease(psPostCode.blob);
      gpu.blobRelease(vsFullscreenCode.blob);
      gpu.blobRelease(psSurfaceCode.blob);
      gpu.blobRelease(vsCode.blob);
      gpu.blobRelease(csBrushCode.blob);
      gpu.blobRelease(csSolveCode.blob);
      gpu.blobRelease(csIntegrateCode.blob);
      gpu.comRelease(postCb);
      gpu.comRelease(rendCb);
      gpu.comRelease(brushCb);
      gpu.comRelease(simCb);
      for (const b of [posBuf, prevBuf, scratchBuf]) {
        gpu.comRelease(b.srv ?? 0n);
        gpu.comRelease(b.uav ?? 0n);
        gpu.comRelease(b.buffer);
      }
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
process.on('uncaughtException', (e) => { console.error(e); cleanup(1); });

const NULLP = null as unknown as Pointer;

// Unbind helpers for hazard-free ping-pong (CSSetUnorderedAccessViews with NULL).
function unbindCsUav(numSlots: number): void {
  const empty = Buffer.alloc(8 * numSlots);
  vcall(dev.context, gpu.CTX_CS_SET_UNORDERED_ACCESS_VIEWS, [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], [0, numSlots, empty.ptr!, NULLP], FFIType.void);
}
const { vcall } = gpu;

// ── Render loop ─────────────────────────────────────────────────────────────────
const startTime = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
let frames = 0;
let fps = 0;
let fpsWindowStart = startTime;
let presented = 0;
let captured = false;

// FIXED simulation timestep advanced once per rendered frame. Decoupling sim time
// from the (very high, uncapped) wall-clock frame rate makes the banner's motion
// readable and deterministic instead of fast-forwarding to a crumpled rest state.
const SIM_DT = 0.0065;
let simTime = 0;
// The capture frame is chosen by SIM TIME (not wall clock) so the gallery PNG always
// shows the same well-developed, mid-flap pose regardless of how fast the machine runs.
const CAPTURE_SIM_TIME = process.env.CLOTH_CAPTURE_T ? Number(process.env.CLOTH_CAPTURE_T) : 3.6;

const aspect = clientW / clientH;
const proj = perspective((46 * Math.PI) / 180, aspect, 0.1, 200);
const rtvArrEmpty: readonly bigint[] = [];

// The collision sphere sits behind the cloth so the wind drapes the banner over it.
const SPHERE_R = CLOTH_W * 0.22;

// ── Camera + interaction state (user-driven) ──────────────────────────────────
let camYaw = -0.35;
let camPitch = 0.18;
let camDist = CLOTH_W * 1.15;
// Previous mouse position in NDC, for computing the per-frame drag vector.
let prevNdcX = 0;
let prevNdcY = 0;
// Edge-trigger latches: act once per key press, not once per frame held.
let pLast = false;
let spaceLast = false;
let rLast = false;

// Recreate the three position buffers from the flat seed (R = reset).
function resetCloth(): void {
  for (const b of [posBuf, prevBuf, scratchBuf]) {
    gpu.comRelease(b.srv ?? 0n);
    gpu.comRelease(b.uav ?? 0n);
    gpu.comRelease(b.buffer);
  }
  posBuf = gpu.makeStructuredBuffer({ stride: STRIDE, count: NODE_COUNT, uav: true, srv: true, initialData: posSeed });
  prevBuf = gpu.makeStructuredBuffer({ stride: STRIDE, count: NODE_COUNT, uav: true, srv: true, initialData: posSeed });
  scratchBuf = gpu.makeStructuredBuffer({ stride: STRIDE, count: NODE_COUNT, uav: true, srv: true, initialData: posSeed });
}

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;

  simTime += SIM_DT;
  const dt = SIM_DT;
  const t = simTime;

  // ── Input: camera (held), tweaks (held), and edge-triggered toggles ──
  if (win.keyDown(VK_LEFT)) { camYaw -= 0.03; autoOrbit = false; }
  if (win.keyDown(VK_RIGHT)) { camYaw += 0.03; autoOrbit = false; }
  if (win.keyDown(VK_UP)) camPitch += 0.02;
  if (win.keyDown(VK_DOWN)) camPitch -= 0.02;
  camPitch = Math.max(-1.35, Math.min(1.35, camPitch));
  if (win.keyDown(VK_Q)) camDist *= 0.98;
  if (win.keyDown(VK_E)) camDist *= 1.02;
  camDist = Math.max(CLOTH_W * 0.4, Math.min(CLOTH_W * 3.0, camDist));
  if (win.keyDown(VK_Z)) windStrength = Math.max(0, windStrength - 0.2);
  if (win.keyDown(VK_X)) windStrength = Math.min(12, windStrength + 0.2);

  const pNow = win.keyDown(VK_P);
  if (pNow && !pLast) pinMode = (pinMode + 1) % 3;
  pLast = pNow;
  const spaceNow = win.keyDown(VK_SPACE);
  if (spaceNow && !spaceLast) autoOrbit = !autoOrbit;
  spaceLast = spaceNow;
  const rNow = win.keyDown(VK_R);
  if (rNow && !rLast) resetCloth();
  rLast = rNow;

  if (autoOrbit) camYaw += 0.0035;

  // In capture mode hold a fixed front-quarter framing so the gallery PNG always shows
  // the broad draping face (the unbounded auto-orbit would otherwise rotate to an
  // edge-on sliver by the chosen capture sim-time). Interactive runs are unaffected.
  if (durationMs > 0) { camYaw = -0.42; camPitch = 0.20; camDist = CLOTH_W * 1.45; }

  // Wind drifts mainly along +x with a slow z lean. The big visible ripple comes from
  // the out-of-plane travelling wave in the shader; windStrength is user-tweakable.
  const windZ = Math.sin(t * 0.6) * 0.35;
  const windDir: V3 = [1.0, 0.0, windZ];
  // Collision sphere parked behind the cloth's mid-span so passing folds drape over it.
  const sphereCenter: V3 = [CLOTH_W * 0.20, -CLOTH_H * 0.02 + Math.sin(t * 0.7) * 0.3, -SPHERE_R * 0.9 + Math.cos(t * 0.5) * 0.5];

  // ── Camera basis (computed up front so the brush + render share one viewProj) ──
  // The cloth hangs from the top in modes 0/1, so we frame it slightly low; in left-edge
  // mode (2) it streams to the right like a flag, so the centre shifts downwind.
  const center: V3 = pinMode < 2 ? [0, -CLOTH_H * 0.22, 0] : [CLOTH_W * 0.20, -CLOTH_H * 0.12, 0];
  const eye: V3 = [
    center[0] + Math.sin(camYaw) * Math.cos(camPitch) * camDist,
    center[1] + Math.sin(camPitch) * camDist,
    center[2] - Math.cos(camYaw) * Math.cos(camPitch) * camDist,
  ];
  const view = lookAt(eye, center, [0, 1, 0]);
  const viewProj = mul4(proj, view);

  // ── Build the sim constant buffer (shared by integrate + solve) ──
  simData.writeFloatLE(dt, 0);
  simData.writeFloatLE(t, 4);
  simData.writeFloatLE(GRID_W, 8);
  simData.writeFloatLE(GRID_H, 12);
  simData.writeFloatLE(REST, 16);
  simData.writeFloatLE(-4.2, 20); // gravity (y) — light, so the cloth flies rather than droops
  simData.writeFloatLE(0.990, 24); // damping (a touch firmer so flaps settle, not ring)
  simData.writeFloatLE(1.0, 28); // stiffness
  simData.writeFloatLE(windDir[0], 32);
  simData.writeFloatLE(windDir[1], 36);
  simData.writeFloatLE(windDir[2], 40);
  simData.writeFloatLE(windStrength, 44);
  simData.writeFloatLE(sphereCenter[0], 48);
  simData.writeFloatLE(sphereCenter[1], 52);
  simData.writeFloatLE(sphereCenter[2], 56);
  simData.writeFloatLE(SPHERE_R, 60);
  simData.writeFloatLE(pinMode, 64); // gP2.x — which lattice nodes are held, in-shader
  gpu.updateConstantBuffer(simCb, simData);

  // ── 1. Verlet integrate: pos & prev in place ──
  gpu.csSet(csIntegrate, { cb: [simCb], uav: [posBuf.uav!, prevBuf.uav!] });
  gpu.dispatch(GROUPS, 1, 1);
  unbindCsUav(2);

  // ── 1b. Mouse brush: inject a drag impulse into Pos, AFTER integrate, BEFORE solve ──
  const mouse = win.getMouse();
  const ndcX = (mouse.x / clientW) * 2 - 1;
  const ndcY = 1 - (mouse.y / clientH) * 2;
  const dragNdcX = ndcX - prevNdcX;
  const dragNdcY = ndcY - prevNdcY;
  prevNdcX = ndcX;
  prevNdcY = ndcY;
  // Camera basis from eye→center, so a screen swipe maps to a world-space drag in the
  // image plane: right = up × forward, up = forward × right.
  let fwdX = center[0] - eye[0];
  let fwdY = center[1] - eye[1];
  let fwdZ = center[2] - eye[2];
  const fwdL = Math.hypot(fwdX, fwdY, fwdZ) || 1;
  fwdX /= fwdL; fwdY /= fwdL; fwdZ /= fwdL;
  // right = normalize(cross([0,1,0], forward))
  let rgtX = 1 * fwdZ - 0 * fwdY;
  let rgtY = 0 * fwdX - 0 * fwdZ;
  let rgtZ = 0 * fwdY - 1 * fwdX;
  const rgtL = Math.hypot(rgtX, rgtY, rgtZ) || 1;
  rgtX /= rgtL; rgtY /= rgtL; rgtZ /= rgtL;
  // up = cross(forward, right)
  const upX = fwdY * rgtZ - fwdZ * rgtY;
  const upY = fwdZ * rgtX - fwdX * rgtZ;
  const upZ = fwdX * rgtY - fwdY * rgtX;
  const gain = camDist * 2; // a full-screen swipe meaningfully grabs the cloth
  const dragWX = rgtX * dragNdcX * gain + upX * dragNdcY * gain;
  const dragWY = rgtY * dragNdcX * gain + upY * dragNdcY * gain;
  const dragWZ = rgtZ * dragNdcX * gain + upZ * dragNdcY * gain;

  // Upload the brush CB: gVP TRANSPOSED (column-major HLSL read), gMouse, gDrag.
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      brushData.writeFloatLE(viewProj[col * 4 + row]!, (row * 4 + col) * 4);
    }
  }
  brushData.writeFloatLE(ndcX, 64);
  brushData.writeFloatLE(ndcY, 68);
  brushData.writeFloatLE(mouse.down ? 1 : 0, 72);
  brushData.writeFloatLE(0.13, 76); // brush radius (NDC)
  brushData.writeFloatLE(dragWX, 80);
  brushData.writeFloatLE(dragWY, 84);
  brushData.writeFloatLE(dragWZ, 88);
  brushData.writeFloatLE(1.0, 92); // strength
  gpu.updateConstantBuffer(brushCb, brushData);

  gpu.csSet(csBrush, { cb: [brushCb], uav: [posBuf.uav!] });
  gpu.dispatch(GROUPS, 1, 1);
  unbindCsUav(1);

  // ── 2. Jacobi constraint solve, ping-ponging posBuf <-> scratchBuf ──
  for (let iter = 0; iter < SOLVE_ITERS; iter += 1) {
    gpu.csSet(csSolve, { cb: [simCb], uav: [scratchBuf.uav!], srv: [posBuf.srv!] });
    gpu.dispatch(GROUPS, 1, 1);
    unbindCsUav(1);
    // Unbind the CS SRV too, so the buffer can become a UAV next iter without hazard.
    gpu.csSet(csSolve, { srv: [0n] });
    const tmp = posBuf;
    posBuf = scratchBuf;
    scratchBuf = tmp;
  }

  // ── 3. Render the cloth as a lit triangulated surface into the HDR target ──
  // The view/proj were already computed above (shared with the brush pass).

  // Key light: a warm sun from the upper-left-front, raking across the folds.
  let ldx = -0.45;
  let ldy = -0.55;
  let ldz = 0.70;
  const ll = Math.hypot(ldx, ldy, ldz);
  ldx /= ll; ldy /= ll; ldz /= ll;

  // Upload viewProj TRANSPOSED (column-major HLSL read recovers the row-major matrix).
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      rendData.writeFloatLE(viewProj[col * 4 + row]!, (row * 4 + col) * 4);
    }
  }
  rendData.writeFloatLE(0, 64);
  rendData.writeFloatLE(GRID_W, 68);
  rendData.writeFloatLE(GRID_H, 72);
  rendData.writeFloatLE(t, 76);
  rendData.writeFloatLE(eye[0], 80); // camPos
  rendData.writeFloatLE(eye[1], 84);
  rendData.writeFloatLE(eye[2], 88);
  rendData.writeFloatLE(0, 92);
  rendData.writeFloatLE(ldx, 96); // light direction (toward scene)
  rendData.writeFloatLE(ldy, 100);
  rendData.writeFloatLE(ldz, 104);
  rendData.writeFloatLE(0, 108);
  gpu.updateConstantBuffer(rendCb, rendData);

  gpu.setRenderTargets([hdr.rtv!]);
  gpu.setViewport(clientW, clientH);
  gpu.clear(hdr.rtv!, [0.012, 0.016, 0.03, 1]);
  gpu.setBlendState(0n); // OPAQUE — the cloth is a solid lit surface
  vcall(dev.context, CTX_RS_SET_STATE, [FFIType.u64], [noCullState], FFIType.void); // double-sided cloth
  gpu.vsSetShaderResources([posBuf.srv!]);
  gpu.vsSet(vsSurface, [rendCb]);
  gpu.psSet(psSurface, { cb: [rendCb] });
  // 6 verts per grid cell, no IA — the VS triangulates the lattice from the SRV.
  vcall(dev.context, gpu.CTX_IA_SET_PRIMITIVE_TOPOLOGY, [FFIType.u32], [4 /* TRIANGLELIST */], FFIType.void);
  vcall(dev.context, gpu.CTX_DRAW, [FFIType.u32, FFIType.u32], [CELL_COUNT * 6, 0], FFIType.void);

  // Unbind VS SRV + HDR RTV before reusing HDR as a PS SRV.
  gpu.vsSetShaderResources([0n]);
  gpu.setRenderTargets(rtvArrEmpty);

  // ── 4. Bloom + tonemap to the back buffer ──
  postData.writeFloatLE(1 / clientW, 0);
  postData.writeFloatLE(1 / clientH, 4);
  postData.writeFloatLE(1.35, 8); // exposure
  postData.writeFloatLE(t, 12);
  gpu.updateConstantBuffer(postCb, postData);

  gpu.setRenderTargets([dev.backBufferRTV]);
  gpu.setViewport(clientW, clientH);
  gpu.clear(dev.backBufferRTV, [0, 0, 0, 1]);
  gpu.vsSet(vsFullscreen);
  gpu.psSet(psPost, { cb: [postCb], srv: [hdr.srv!], samp: [sampler] });
  gpu.drawFullscreenTriangle();
  gpu.psSet(psPost, { srv: [0n] });

  // Composite the GDI HUD INTO the back buffer (flicker-free) before present, so the
  // text is part of the presented frame and shows up in the gallery capture below.
  drawHud(fps);

  // ── Capture the gallery screenshot at a fixed SIM TIME (capture mode) ──
  // Trigger on the first frame whose sim time has passed the chosen well-developed
  // flapping pose; this is deterministic regardless of the (very high) frame rate.
  const wallNow = performance.now();
  const isLast = durationMs > 0 && (simTime >= CAPTURE_SIM_TIME || wallNow - startTime >= durationMs);
  if (isLast && !captured) {
    captured = true;
    const shotDir = resolve(import.meta.dir, '..', 'screenshots');
    mkdirSync(shotDir, { recursive: true });
    const stats = captureBackBuffer(dev, resolve(shotDir, 'cloth.png'), { gridW: 48, gridH: 22 });
    console.log(formatGrid(stats));
    console.log(`[shot] simTime=${simTime.toFixed(2)} ok=${stats.ok} nonBlack=${stats.nonBlackFrac.toFixed(3)} meanLuma=${stats.meanLuma.toFixed(3)} -> ${stats.path}`);
  }

  dev.present(false);
  presented += 1;

  frames += 1;
  if (wallNow - fpsWindowStart >= 500) {
    fps = Math.round((frames * 1000) / (wallNow - fpsWindowStart));
    frames = 0;
    fpsWindowStart = wallNow;
  }

  if (isLast) break;
}

console.log(`Cloth finished — frames presented=${presented} · ${NODE_COUNT.toLocaleString()} nodes · ${dev.gpuName}.`);
cleanup(0);
