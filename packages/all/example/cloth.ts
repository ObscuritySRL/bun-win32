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
import * as gpu from './_gpu';
import { captureBackBuffer, formatGrid } from './_snapshot';

const encodeWide = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');

const WIDTH = 1280;
const HEIGHT = 720;

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
const win = gpu.createWindow({ title: 'Cloth — 65,536-node GPU soft-body banner in pure TypeScript', width: WIDTH, height: HEIGHT, borderless: true });
const { w: clientW, h: clientH } = win.clientSize();
const dev = gpu.createDevice(win.hwnd, { width: clientW, height: clientH });

console.log('Cloth — a 65,536-node GPU soft-body banner, simulated & rendered in pure TypeScript.');
console.log(`  ${NODE_COUNT.toLocaleString()} nodes · ${SOLVE_ITERS} XPBD iters/frame · ${dev.driver} · ${dev.gpuName}`);
console.log('  Auto-orbiting wind tunnel · ESC to exit.\n');

// ── Seed the cloth: a flag plane in world space, LEFT edge pinned to a mast ──────
// The flag hangs from a vertical mast on the left (gx == 0 pinned, w == 0) and streams
// to the right in the wind — the iconic flapping-flag pose that reads unmistakably as
// cloth. gx maps to world +x (along the flag, toward the free fly edge), gy maps to
// world -y (top → bottom). A slight z waviness breaks the first-frame flatness.
const posSeed = Buffer.alloc(NODE_COUNT * STRIDE);
{
  const x0 = -CLOTH_W * 0.5; // mast at the far left
  const yTop = CLOTH_H * 0.5;
  for (let gy = 0; gy < GRID_H; gy += 1) {
    for (let gx = 0; gx < GRID_W; gx += 1) {
      const i = gy * GRID_W + gx;
      const x = x0 + gx * REST;
      const y = yTop - gy * REST;
      const z = Math.sin(gx * 0.16) * 0.06 + Math.cos(gy * 0.11) * 0.04;
      // Pin the entire LEFT column (the mast) hard: w == 0 pinned, w == 1 free.
      const pinned = gx === 0 ? 0 : 1;
      const o = i * STRIDE;
      posSeed.writeFloatLE(x, o + 0);
      posSeed.writeFloatLE(y, o + 4);
      posSeed.writeFloatLE(z, o + 8);
      posSeed.writeFloatLE(pinned, o + 12);
    }
  }
}

// Three position buffers: pos (current), prev (Verlet history), plus a scratch buffer
// for the Jacobi ping-pong solve. All are UAV+SRV structured float4 buffers.
let posBuf = gpu.makeStructuredBuffer({ stride: STRIDE, count: NODE_COUNT, uav: true, srv: true, initialData: posSeed });
const prevBuf = gpu.makeStructuredBuffer({ stride: STRIDE, count: NODE_COUNT, uav: true, srv: true, initialData: posSeed });
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
const SIM_CB_SIZE = 64;
const simCb = gpu.makeConstantBuffer(SIM_CB_SIZE);
const simData = Buffer.alloc(SIM_CB_SIZE);

// Render CB (VS+PS): float4x4 viewProj (64) + float4 params (quadSize, gridW, gridH, time)
//   + float4 camRight(xyz) + float4 camUp(xyz) = 64 + 16 + 16 + 16 = 112.
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
};
RWStructuredBuffer<float4> Pos  : register(u0);
RWStructuredBuffer<float4> Prev : register(u1);

[numthreads(${THREADS},1,1)]
void main(uint3 id : SV_DispatchThreadID) {
  uint i = id.x;
  uint count = (uint)(gP0.z * gP0.w);
  if (i >= count) return;

  float4 P = Pos[i];
  float3 p = P.xyz;
  float  pin = P.w;        // 0 = pinned, 1 = free

  if (pin < 0.5) { Prev[i] = float4(p, pin); Pos[i] = float4(p, pin); return; }

  float3 prev = Prev[i].xyz;
  float dt = gP0.x;
  float t  = gP0.y;

  uint gw = (uint)gP0.z;
  uint gx = i % gw;
  uint gy = i / gw;
  float u = (float)gx / (gP0.z - 1.0);
  float vv = (float)gy / (gP0.w - 1.0);

  // Gravity + wind. A flag reads best when the wind is dominated by an OUT-OF-PLANE
  // (z) travelling wave: that produces the big S-shaped folds sweeping from mast to fly
  // edge while the sheet stays broad and tall, rather than being dragged to a point. A
  // gentle steady downwind push (+x) keeps it streaming; reach grows from mast→edge but
  // never to zero in the middle, so the whole span flutters.
  float3 g = float3(0, gP1.y, 0);
  float reach = 0.15 + 0.85 * u;                     // mast (0.15) → fly edge (1.0)
  // Steady downwind drift (mostly +x), modest.
  float3 drift = normalize(gWind.xyz + 1e-5) * gWind.w * 0.45 * reach;
  // Dominant out-of-plane travelling flutter — the visible ripple of a flag.
  float wave = sin(t * 6.0 - u * 10.0 + vv * 2.5) + 0.6 * sin(t * 3.5 - u * 5.0 - vv * 4.0);
  float3 flutter = float3(0, 0, 1) * wave * gWind.w * reach * 1.3;
  // A little vertical undulation so folds are not perfectly horizontal bands.
  flutter.y += sin(t * 4.5 - u * 7.0 + vv * 5.0) * gWind.w * reach * 0.35;
  float3 a = g + drift + flutter;

  // Verlet integration with velocity damping.
  float damp = gP1.z;
  float3 vel = (p - prev) * damp;
  float3 np = p + vel + a * dt * dt;

  Prev[i] = float4(p, pin);
  Pos[i]  = float4(np, pin);
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
  float  pin = P.w;

  uint gx = i % gw;
  uint gy = i / gw;
  float rest = gP1.x;
  float diag = rest * SQRT2;
  float stiff = gP1.w;

  if (pin > 0.5) {
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
  }

  Dst[i] = float4(p, pin);
}
`;

// ── HLSL: RENDER VS — expand each node into a small camera-facing additive quad ───
// 6 verts per node (two triangles). The shader fetches the node from the position SRV
// by (vid / 6), reads neighbours to estimate the surface normal + stretch for shading,
// then offsets the quad corners along camera right/up and projects by gViewProj.
const VS_SRC = `
cbuffer Rend : register(b0) {
  float4x4 gViewProj;
  float4   gParams;   // x=quadSize, y=gridW, z=gridH, w=time
  float4   gCamRight; // xyz
  float4   gCamUp;    // xyz
};
StructuredBuffer<float4> Pos : register(t0);

struct VSOut {
  float4 pos   : SV_Position;
  float3 color : COLOR0;
  float2 uv    : TEXCOORD0;
};

VSOut main(uint vid : SV_VertexID) {
  uint node = vid / 6;
  uint corner = vid % 6;

  uint gw = (uint)gParams.y;
  uint gh = (uint)gParams.z;
  uint gx = node % gw;
  uint gy = node / gw;

  float3 p = Pos[node].xyz;

  // Estimate the local surface stretch from horizontal + vertical edge lengths vs rest.
  float rest = ${REST.toFixed(5)};
  float3 px1 = (gx < gw - 1) ? Pos[node + 1].xyz  : p;
  float3 py1 = (gy < gh - 1) ? Pos[node + gw].xyz : p;
  float lenX = length(px1 - p);
  float lenY = length(py1 - p);
  float stretch = saturate((max(lenX, lenY) / rest - 1.0) * 1.6);

  // Surface normal (cross of the two edges) for a soft directional sheen.
  float3 nrm = normalize(cross(px1 - p, py1 - p) + float3(0, 0, 1e-4));

  // Quad corner offsets (two triangles: 0,1,2 and 0,2,3).
  float2 q;
  if      (corner == 0) q = float2(-1, -1);
  else if (corner == 1) q = float2( 1, -1);
  else if (corner == 2) q = float2( 1,  1);
  else if (corner == 3) q = float2(-1, -1);
  else if (corner == 4) q = float2( 1,  1);
  else                  q = float2(-1,  1);

  float s = gParams.x;
  float3 world = p + gCamRight.xyz * (q.x * s) + gCamUp.xyz * (q.y * s);

  VSOut o;
  o.pos = mul(gViewProj, float4(world, 1.0));
  o.uv = q; // -1..1 across the quad

  // Fabric palette: a teal→magenta banner. Hue shifts with height (gy) and warms where
  // the cloth is stretched; a sheen term from the normal vs a fixed light adds shimmer.
  float h = (float)gy / (gParams.z - 1.0);                 // 0 top → 1 bottom
  float3 colTop = float3(0.10, 0.55, 0.95);                // cool teal-blue
  float3 colBot = float3(0.95, 0.20, 0.55);                // warm magenta
  float3 base = lerp(colTop, colBot, h);
  // Stretched (taut) regions glow hot gold; slack regions stay saturated.
  base = lerp(base, float3(1.0, 0.85, 0.45), stretch * 0.7);
  float sheen = pow(saturate(dot(nrm, normalize(float3(0.4, 0.7, 0.6)))), 3.0);
  float3 col = base * (0.6 + 0.8 * sheen) + 0.12;

  o.color = col;
  return o;
}
`;

// ── HLSL: RENDER PS — soft round additive sprite, edges feather to zero ──────────
const PS_POINTS_SRC = `
struct VSOut {
  float4 pos   : SV_Position;
  float3 color : COLOR0;
  float2 uv    : TEXCOORD0;
};

float4 main(VSOut i) : SV_Target {
  float r = length(i.uv);                 // 0 at center → ~1.41 at corners
  float a = saturate(1.0 - r);            // round falloff, hard zero past the inscribed circle
  a = pow(a, 1.6);
  // Quads overlap heavily with the larger size; keep each faint so the additive sum
  // forms a smooth, evenly-lit fabric sheet rather than blowing out into a white blob.
  return float4(i.color * a * 0.10, a);
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
  float3 brightOnly = max(bl - 0.30.xxx, 0.0.xxx);
  float3 col = hdr + brightOnly * 1.25;

  col *= gP.z; // exposure

  // Gentle vignette to seat the banner in the frame.
  float2 q = uv - 0.5;
  float vig = smoothstep(1.05, 0.20, dot(q, q) * 1.7);
  col *= lerp(0.55, 1.0, vig);

  col = col / (col + 1.0.xxx);          // Reinhard tonemap
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
const vsCode = gpu.compile(VS_SRC, 'main', 'vs_5_0');
const psPointsCode = gpu.compile(PS_POINTS_SRC, 'main', 'ps_5_0');
const vsFullscreenCode = gpu.compile(VS_FULLSCREEN_SRC, 'main', 'vs_5_0');
const psPostCode = gpu.compile(PS_POST_SRC, 'main', 'ps_5_0');

const csIntegrate = gpu.makeComputeShader(csIntegrateCode);
const csSolve = gpu.makeComputeShader(csSolveCode);
const vsPoints = gpu.makeVertexShader(vsCode);
const psPoints = gpu.makePixelShader(psPointsCode);
const vsFullscreen = gpu.makeVertexShader(vsFullscreenCode);
const psPost = gpu.makePixelShader(psPostCode);

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

// ── GDI HUD font ──────────────────────────────────────────────────────────────
const hudFont = GDI32.CreateFontW(-19, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4 /* ANTIALIASED_QUALITY */, 0, encodeWide('Consolas').ptr!);
const TRANSPARENT_BK = 1;
const nodeLabel = NODE_COUNT.toLocaleString();

function drawHud(fps: number): void {
  const dc = User32.GetDC(win.hwnd);
  if (!dc) return;
  const prevF = GDI32.SelectObject(dc, hudFont);
  GDI32.SetBkMode(dc, TRANSPARENT_BK);
  const line = `Cloth · ${nodeLabel} nodes · ${SOLVE_ITERS} XPBD iters · ${fps} fps · GPU: ${dev.gpuName}`;
  const text = encodeWide(line);
  const len = line.length;
  GDI32.SetTextColor(dc, 0x00100804);
  GDI32.TextOutW(dc, 19, 19, text.ptr!, len);
  GDI32.SetTextColor(dc, 0x00f0d8b0);
  GDI32.TextOutW(dc, 18, 18, text.ptr!, len);
  GDI32.SelectObject(dc, prevF);
  User32.ReleaseDC(win.hwnd, dc);
}

// ── Teardown ──────────────────────────────────────────────────────────────────
let cleanedUp = false;
function cleanup(code: number): never {
  if (!cleanedUp) {
    cleanedUp = true;
    try {
      gpu.setBlendState(0n);
      GDI32.DeleteObject(hudFont);
      gpu.comRelease(noCullState);
      gpu.comRelease(additiveBlend);
      gpu.comRelease(sampler);
      gpu.comRelease(hdr.srv ?? 0n);
      gpu.comRelease(hdr.rtv ?? 0n);
      gpu.comRelease(hdr.tex);
      gpu.comRelease(psPost);
      gpu.comRelease(vsFullscreen);
      gpu.comRelease(psPoints);
      gpu.comRelease(vsPoints);
      gpu.comRelease(csSolve);
      gpu.comRelease(csIntegrate);
      gpu.blobRelease(psPostCode.blob);
      gpu.blobRelease(vsFullscreenCode.blob);
      gpu.blobRelease(psPointsCode.blob);
      gpu.blobRelease(vsCode.blob);
      gpu.blobRelease(csSolveCode.blob);
      gpu.blobRelease(csIntegrateCode.blob);
      gpu.comRelease(postCb);
      gpu.comRelease(rendCb);
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
const CAPTURE_SIM_TIME = process.env.CLOTH_CAPTURE_T ? Number(process.env.CLOTH_CAPTURE_T) : 1.6;

const aspect = clientW / clientH;
const proj = perspective((46 * Math.PI) / 180, aspect, 0.1, 200);
const rtvArrEmpty: readonly bigint[] = [];

// The collision sphere sits behind the cloth so the wind drapes the banner over it.
const SPHERE_R = CLOTH_W * 0.22;

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;

  simTime += SIM_DT;
  const dt = SIM_DT;
  const t = simTime;

  // Wind drifts mainly along +x (downwind from the mast) with a slow z lean. The big
  // visible ripple comes from the out-of-plane travelling wave in the shader.
  const windZ = Math.sin(t * 0.6) * 0.35;
  const windDir: V3 = [1.0, 0.0, windZ];
  const windStrength = 7.0;
  // Collision sphere parked behind the flag's mid-span so passing folds drape over it.
  const sphereCenter: V3 = [CLOTH_W * 0.20, -CLOTH_H * 0.02 + Math.sin(t * 0.7) * 0.3, -SPHERE_R * 0.9 + Math.cos(t * 0.5) * 0.5];

  // ── Build the sim constant buffer (shared by integrate + solve) ──
  simData.writeFloatLE(dt, 0);
  simData.writeFloatLE(t, 4);
  simData.writeFloatLE(GRID_W, 8);
  simData.writeFloatLE(GRID_H, 12);
  simData.writeFloatLE(REST, 16);
  simData.writeFloatLE(-4.2, 20); // gravity (y) — light, so the flag flies rather than droops
  simData.writeFloatLE(0.986, 24); // damping (a touch firmer so flaps settle, not ring)
  simData.writeFloatLE(1.0, 28); // stiffness
  simData.writeFloatLE(windDir[0], 32);
  simData.writeFloatLE(windDir[1], 36);
  simData.writeFloatLE(windDir[2], 40);
  simData.writeFloatLE(windStrength, 44);
  simData.writeFloatLE(sphereCenter[0], 48);
  simData.writeFloatLE(sphereCenter[1], 52);
  simData.writeFloatLE(sphereCenter[2], 56);
  simData.writeFloatLE(SPHERE_R, 60);
  gpu.updateConstantBuffer(simCb, simData);

  // ── 1. Verlet integrate: pos & prev in place ──
  gpu.csSet(csIntegrate, { cb: [simCb], uav: [posBuf.uav!, prevBuf.uav!] });
  gpu.dispatch(GROUPS, 1, 1);
  unbindCsUav(2);

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

  // ── 3. Camera + render the cloth as additive quads into the HDR target ──
  // Frame the streaming flag's broad face from a slight front-quarter angle (so the
  // travelling folds read in 3D) and orbit gently. The flag spans the mast at x≈-6.4
  // out to a free edge billowing near x≈+5; centering near the mid-span keeps it framed.
  const yaw = -0.26 + Math.sin(t * 0.25) * 0.3; // near-front, gentle orbit
  const camDist = CLOTH_W * 1.36; // fits the full mast→fly span with the fabric large
  const camHeight = CLOTH_H * 0.03 + Math.sin(t * 0.2) * CLOTH_H * 0.04;
  // Aim slightly downwind of the mast so the billowing body of the flag is centered.
  const center: V3 = [CLOTH_W * 0.16, -CLOTH_H * 0.03, 0];
  const eye: V3 = [center[0] + Math.sin(yaw) * camDist, camHeight, center[2] - Math.cos(yaw) * camDist];
  const view = lookAt(eye, center, [0, 1, 0]);
  const viewProj = mul4(proj, view);

  // Camera right/up axes (from the view matrix rows) for the camera-facing quads.
  const camRight: V3 = [view[0]!, view[1]!, view[2]!];
  const camUp: V3 = [view[4]!, view[5]!, view[6]!];

  // Upload viewProj TRANSPOSED (column-major HLSL read recovers the row-major matrix).
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      rendData.writeFloatLE(viewProj[col * 4 + row]!, (row * 4 + col) * 4);
    }
  }
  rendData.writeFloatLE(REST * 2.2, 64); // quadSize (>2× spacing → quads overlap into a solid sheet, bridging stretch gaps)
  rendData.writeFloatLE(GRID_W, 68);
  rendData.writeFloatLE(GRID_H, 72);
  rendData.writeFloatLE(t, 76);
  rendData.writeFloatLE(camRight[0], 80);
  rendData.writeFloatLE(camRight[1], 84);
  rendData.writeFloatLE(camRight[2], 88);
  rendData.writeFloatLE(0, 92);
  rendData.writeFloatLE(camUp[0], 96);
  rendData.writeFloatLE(camUp[1], 100);
  rendData.writeFloatLE(camUp[2], 104);
  rendData.writeFloatLE(0, 108);
  gpu.updateConstantBuffer(rendCb, rendData);

  gpu.setRenderTargets([hdr.rtv!]);
  gpu.setViewport(clientW, clientH);
  gpu.clear(hdr.rtv!, [0.012, 0.016, 0.03, 1]);
  gpu.setBlendState(additiveBlend);
  vcall(dev.context, CTX_RS_SET_STATE, [FFIType.u64], [noCullState], FFIType.void); // double-sided cloth
  gpu.vsSetShaderResources([posBuf.srv!]);
  gpu.vsSet(vsPoints, [rendCb]);
  gpu.psSet(psPoints);
  // 6 verts per node, no IA — the VS expands each particle into a camera-facing quad.
  vcall(dev.context, gpu.CTX_IA_SET_PRIMITIVE_TOPOLOGY, [FFIType.u32], [4 /* TRIANGLELIST */], FFIType.void);
  vcall(dev.context, gpu.CTX_DRAW, [FFIType.u32, FFIType.u32], [NODE_COUNT * 6, 0], FFIType.void);

  // Unbind VS SRV + HDR RTV before reusing HDR as a PS SRV.
  gpu.vsSetShaderResources([0n]);
  gpu.setBlendState(0n);
  gpu.setRenderTargets(rtvArrEmpty);

  // ── 4. Bloom + tonemap to the back buffer ──
  postData.writeFloatLE(1 / clientW, 0);
  postData.writeFloatLE(1 / clientH, 4);
  postData.writeFloatLE(1.25, 8); // exposure
  postData.writeFloatLE(t, 12);
  gpu.updateConstantBuffer(postCb, postData);

  gpu.setRenderTargets([dev.backBufferRTV]);
  gpu.setViewport(clientW, clientH);
  gpu.clear(dev.backBufferRTV, [0, 0, 0, 1]);
  gpu.vsSet(vsFullscreen);
  gpu.psSet(psPost, { cb: [postCb], srv: [hdr.srv!], samp: [sampler] });
  gpu.drawFullscreenTriangle();
  gpu.psSet(psPost, { srv: [0n] });

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
  drawHud(fps);

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
