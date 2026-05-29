/**
 * Boids — a murmuration of thousands of birds, flocking on the GPU, in pure TypeScript.
 *
 * A borderless 1280x720 window fills with a deep twilight void in which ~8192 tiny
 * arrow-shaped birds wheel and swirl as one living organism. The whole flock is a
 * real N-body simulation: every frame a Direct3D 11 compute shader ([numthreads(256,1,1)])
 * lets each boid scan all the others, applying the three classic Reynolds rules —
 * separation, alignment, cohesion — then evades a mouse-controlled predator and
 * curves back inside a soft bounding sphere, integrating a speed-clamped velocity.
 * The positions/velocities live in a ping-ponged StructuredBuffer (float4 pos +
 * float4 vel); the vertex shader reads that buffer directly through SV_VertexID,
 * extruding three verts per boid into a camera-facing oriented triangle that points
 * along its velocity, shaded by speed and depth in a cyan→magenta palette with
 * additive blending so dense clusters bloom and shimmer. A slowly orbiting
 * perspective camera makes the murmuration read in true 3D; move the mouse and the
 * flock scatters away from the predator and re-forms. None of it is precomputed —
 * HLSL is JIT-compiled at runtime onto your real GPU.
 *
 * Pipeline (each step):
 *   1. createWindow (borderless WS_POPUP, shown topmost + foreground)
 *   2. createDevice → real ID3D11Device + DXGI swap chain (HARDWARE, WARP fallback)
 *   3. compile the flocking CS, the boid-render VS, and the glow PS at runtime → DXBC
 *   4. two StructuredBuffers (UAV+SRV) seeded with randomized boids; one constant buffer
 *   5. per frame: CSSetShader(flock) with src SRV (t0) + dst UAV (u0) → Dispatch(N/256)
 *      → swap src/dst → bind dst SRV to the VS (VSSetShaderResources t0) →
 *      OMSetBlendState(additive) → Draw(N*3) oriented triangles → Present → GDI HUD
 *   6. release every COM object + GDI font, win.destroy() on exit
 *
 * @bun-win32 / engine APIs used:
 *   - _gpu.ts: createWindow, createDevice, compile, makeComputeShader/VertexShader/PixelShader,
 *     makeStructuredBuffer (UAV+SRV ping-pong), makeConstantBuffer/updateConstantBuffer,
 *     csSet/dispatch, setRenderTargets/setViewport/clear, present, vcall (raw vtable), comRelease
 *   - extra vtable calls (derived from d3d11.h order, verified by running):
 *       ID3D11Device::CreateBlendState (slot 20), ID3D11DeviceContext::OMSetBlendState (slot 35),
 *       ID3D11DeviceContext::VSSetShaderResources (slot 25), VSSetConstantBuffers (slot 7)
 *   - GDI32 CreateFontW/SelectObject/SetTextColor/SetBkMode/TextOutW/DeleteObject HUD
 *
 * Run: bun run packages/all/example/boids.ts
 */

import { FFIType, type Pointer } from 'bun:ffi';

import { GDI32, User32 } from '../index';
import {
  clear,
  comRelease,
  compile,
  createDevice,
  createWindow,
  csSet,
  dispatch,
  makeComputeShader,
  makeConstantBuffer,
  makePixelShader,
  makeStructuredBuffer,
  makeVertexShader,
  setRenderTargets,
  setViewport,
  updateConstantBuffer,
  vcall,
  type StructuredBuffer,
} from './_gpu';

// ── Tunables ──────────────────────────────────────────────────────────────────
const WIDTH = 1280;
const HEIGHT = 720;
const NUM_BOIDS = 8192; // multiple of the 256-wide thread group
const THREADS = 256;
const BOID_STRIDE = 32; // float4 pos + float4 vel
const WORLD_RADIUS = 42; // soft bounding-sphere radius (large, so the flock fills the view)

// ── Extra vtable slots (d3d11.h declaration order; verified by running) ────────
const DEV_CREATE_BLEND_STATE = 20;
const CTX_VS_SET_CONSTANT_BUFFERS = 7;
const CTX_VS_SET_SHADER_RESOURCES = 25;
const CTX_DRAW = 13;
const CTX_OM_SET_BLEND_STATE = 35;
const CTX_IA_SET_PRIMITIVE_TOPOLOGY = 24;
const D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST = 4;

// ── Window + device ───────────────────────────────────────────────────────────
const win = createWindow({ title: 'Boids — GPU murmuration', width: WIDTH, height: HEIGHT, borderless: true });
const { w: clientW, h: clientH } = win.clientSize();
const gpu = createDevice(win.hwnd, { width: clientW, height: clientH });

// ── HLSL: flocking compute shader ─────────────────────────────────────────────
// Each thread owns one boid; it scans all boids (brute-force N²) within radii for
// separation / alignment / cohesion, then steers away from the predator and back
// toward the world centre, integrating a speed-clamped velocity.
const flockHLSL = `
struct Boid { float4 pos; float4 vel; };
StructuredBuffer<Boid>   Src : register(t0);
RWStructuredBuffer<Boid> Dst : register(u0);

cbuffer C : register(b0) {
  row_major float4x4 viewProj;   // (unused in CS but shared layout)
  float4   predator;   // xyz = world predator point, w = strength
  float4   params;     // x=dt, y=count, z=time, w=worldRadius
  float4   campos;     // xyz = camera position
};

// Separation must DOMINATE at close range so the flock never collapses to a point:
// it uses an inverse-square push inside a small radius with a strong weight, while
// cohesion is weak and acts over a much larger perception radius.
static const float R_SEP   = 3.0;    // separation radius (close-range repulsion)
static const float R_NEIGH = 9.0;    // alignment / cohesion perception radius
static const float MAXSPEED = 13.0;
static const float MINSPEED = 6.0;
static const float W_SEP    = 26.0;  // separation weight (dominant)
static const float W_ALI    = 0.85;  // alignment weight (moderate)
static const float W_COH    = 0.12;  // cohesion weight (weak — prevents collapse)

[numthreads(${THREADS},1,1)]
void main(uint3 tid : SV_DispatchThreadID) {
  uint i = tid.x;
  uint count = (uint)params.y;
  if (i >= count) return;

  float dt = params.x;
  float3 p = Src[i].pos.xyz;
  float3 v = Src[i].vel.xyz;

  float3 sep = 0.0.xxx;     // push away from very close neighbours (1/dist^2)
  float3 ali = 0.0.xxx;     // average heading of neighbours
  float3 coh = 0.0.xxx;     // centre of mass of neighbours
  int    nNeigh = 0;        // perception-radius neighbour count
  int    nClose = 0;        // close (separation-radius) neighbour count

  float r_sep2 = R_SEP * R_SEP;
  float r_neigh2 = R_NEIGH * R_NEIGH;

  // Brute-force N² neighbour scan.
  [loop]
  for (uint j = 0; j < count; j++) {
    if (j == i) continue;
    float3 d = p - Src[j].pos.xyz;
    float dist2 = dot(d, d);
    if (dist2 < r_neigh2) {
      // Inverse-square close-range separation: force grows steeply as dist→0,
      // so two boids can never occupy the same point — no collapse to a line.
      if (dist2 < r_sep2) {
        float dist = sqrt(max(dist2, 1e-4));
        sep += (d / dist) / max(dist2, 0.05);   // ~ dir / dist^2
        nClose++;
      }
      ali += Src[j].vel.xyz;
      coh += Src[j].pos.xyz;
      nNeigh++;
    }
  }

  float3 accel = 0.0.xxx;
  // Separation is applied unconditionally and strongly whenever anyone is close.
  if (nClose > 0) {
    accel += (sep / nClose) * W_SEP;          // dominant close-range repulsion
  }
  if (nNeigh > 0) {
    ali = ali / nNeigh;                        // mean velocity
    coh = coh / nNeigh - p;                    // toward centre of mass
    accel += (ali - v) * W_ALI;               // alignment (moderate)
    accel += coh * W_COH;                      // cohesion (weak, large radius)
  }

  // Predator avoidance: strong, falls off with distance.
  float3 fromPred = p - predator.xyz;
  float pd2 = dot(fromPred, fromPred);
  float pr = 12.0;
  if (pd2 < pr * pr) {
    float pd = sqrt(max(pd2, 1e-3));
    accel += (fromPred / pd) * (pr - pd) * predator.w * 4.5;
  }

  // Soft bounding sphere: gentle inward pull that ramps up past the surface, so the
  // murmuration fills a big volume instead of bunching at the centre.
  float wr = params.w;
  float rad = length(p);
  if (rad > wr * 0.62) {
    float over = (rad - wr * 0.62) / (wr * 0.38);
    accel += (-p / max(rad, 1e-3)) * over * over * 22.0;
  }

  // A swirling turbulence field keeps the flock alive, splitting and re-forming as a
  // big cloud rather than settling into one tight ball.
  float t = params.z;
  float3 swirl = float3(
    sin(p.y * 0.18 + t * 0.6) + cos(p.z * 0.12 - t * 0.35),
    cos(p.z * 0.16 - t * 0.5) + sin(p.x * 0.11 + t * 0.4),
    sin(p.x * 0.20 + t * 0.4) + cos(p.y * 0.13 + t * 0.45));
  accel += swirl * 3.0;

  v += accel * dt;

  // Clamp speed into a believable band so the flock keeps moving.
  float spd = length(v);
  if (spd > MAXSPEED) v = v / spd * MAXSPEED;
  else if (spd < MINSPEED && spd > 1e-3) v = v / spd * MINSPEED;
  else if (spd <= 1e-3) v = float3(MINSPEED, 0, 0);

  p += v * dt;

  Dst[i].pos = float4(p, 1.0);
  Dst[i].vel = float4(v, 0.0);
}
`;

// ── HLSL: render VS — extrude an oriented, camera-facing triangle per boid ─────
const renderVSHLSL = `
struct Boid { float4 pos; float4 vel; };
StructuredBuffer<Boid> Boids : register(t0);

cbuffer C : register(b0) {
  row_major float4x4 viewProj;   // matches the row-major matrix uploaded from JS
  float4   predator;
  float4   params;     // x=dt, y=count, z=time, w=worldRadius
  float4   campos;     // xyz camera position
};

struct VSOut {
  float4 pos   : SV_Position;
  float3 color : COLOR0;
  float2 uv    : TEXCOORD0;
};

VSOut main(uint vid : SV_VertexID) {
  uint bid = vid / 3;          // which boid
  uint corner = vid % 3;       // 0,1,2 → tip, left wing, right wing

  Boid b = Boids[bid];
  float3 center = b.pos.xyz;
  float3 vel = b.vel.xyz;
  float speed = length(vel);
  float3 fwd = speed > 1e-3 ? vel / speed : float3(0,0,1);

  // Build a camera-facing basis: 'right' is perpendicular to forward and the view dir.
  float3 toCam = normalize(campos.xyz - center);
  float3 right = normalize(cross(fwd, toCam));
  // Fallback if forward nearly parallel to view.
  if (dot(right, right) < 0.5) right = normalize(cross(fwd, float3(0,1,0)));

  // Arrow geometry in the boid's local plane — scaled up several× so each bird reads
  // clearly against the big murmuration (size scales subtly with speed too).
  float s = 0.62 + speed * 0.04;
  float3 local;
  float2 uv;
  if (corner == 0)      { local =  fwd * (s * 2.4);                uv = float2(0.5, 0.0); } // nose
  else if (corner == 1) { local = -fwd * (s * 1.1) + right * s;    uv = float2(0.0, 1.0); } // left tail
  else                  { local = -fwd * (s * 1.1) - right * s;    uv = float2(1.0, 1.0); } // right tail

  float3 world = center + local;

  VSOut o;
  o.pos = mul(viewProj, float4(world, 1.0));
  o.uv = uv;

  // Cyan → magenta → gold palette driven by speed, with a depth-based cool tint.
  float t = saturate((speed - 6.0) / 7.0);
  float3 cool = float3(0.20, 0.85, 1.00);
  float3 warm = float3(1.00, 0.35, 0.85);
  float3 hot  = float3(1.00, 0.85, 0.45);
  float3 col = lerp(cool, warm, smoothstep(0.0, 0.6, t));
  col = lerp(col, hot, smoothstep(0.55, 1.0, t));

  // Depth fog/brightness: nearer boids glow a touch hotter. Brightened overall so the
  // additive bloom stays vivid across the larger, more spread-out cloud.
  float depth = saturate(length(campos.xyz - center) / (params.w * 2.6));
  col *= lerp(1.9, 0.85, depth);

  o.color = col;
  return o;
}
`;

// ── HLSL: glow PS — soft triangular falloff, additive-friendly ────────────────
const renderPSHLSL = `
struct VSOut {
  float4 pos   : SV_Position;
  float3 color : COLOR0;
  float2 uv    : TEXCOORD0;
};

float4 main(VSOut i) : SV_Target {
  // Distance from the triangle's nose-to-tail axis for a soft feathered edge.
  float edge = 1.0 - abs(i.uv.x - 0.5) * 2.0;     // 1 at center, 0 at wings
  float along = 1.0 - i.uv.y;                       // 1 at nose, 0 at tail
  float a = saturate(edge * 0.65 + along * 0.55);
  a = pow(a, 1.6);
  float3 c = i.color * a;
  // Additive output; alpha unused by the ONE/ONE blend but kept tidy.
  return float4(c, a);
}
`;

// ── Compile + create shaders ──────────────────────────────────────────────────
const flockCode = compile(flockHLSL, 'main', 'cs_5_0');
const flockCS = makeComputeShader(flockCode);
const vsCode = compile(renderVSHLSL, 'main', 'vs_5_0');
const vs = makeVertexShader(vsCode);
const psCode = compile(renderPSHLSL, 'main', 'ps_5_0');
const ps = makePixelShader(psCode);

// ── Seed boids: random points on a shell, velocities tangential-ish ───────────
const seed = Buffer.alloc(NUM_BOIDS * BOID_STRIDE);
for (let i = 0; i < NUM_BOIDS; i += 1) {
  // Random point inside a sphere (rejection-free via direction + radius^(1/3)).
  const u = Math.random() * 2 - 1;
  const phi = Math.random() * Math.PI * 2;
  const r = WORLD_RADIUS * 0.6 * Math.cbrt(Math.random());
  const sq = Math.sqrt(1 - u * u);
  const px = r * sq * Math.cos(phi);
  const py = r * sq * Math.sin(phi);
  const pz = r * u;
  // Initial velocity: a swirl around Y plus a little randomness.
  const vx = -pz * 0.35 + (Math.random() - 0.5) * 4;
  const vy = (Math.random() - 0.5) * 4;
  const vz = px * 0.35 + (Math.random() - 0.5) * 4;
  const o = i * BOID_STRIDE;
  seed.writeFloatLE(px, o + 0);
  seed.writeFloatLE(py, o + 4);
  seed.writeFloatLE(pz, o + 8);
  seed.writeFloatLE(1, o + 12);
  seed.writeFloatLE(vx, o + 16);
  seed.writeFloatLE(vy, o + 20);
  seed.writeFloatLE(vz, o + 24);
  seed.writeFloatLE(0, o + 28);
}

// Two ping-ponged structured buffers (each both UAV-writable and SRV-readable).
let bufA: StructuredBuffer = makeStructuredBuffer({ stride: BOID_STRIDE, count: NUM_BOIDS, uav: true, srv: true, initialData: seed });
let bufB: StructuredBuffer = makeStructuredBuffer({ stride: BOID_STRIDE, count: NUM_BOIDS, uav: true, srv: true, initialData: seed });

// ── Constant buffer layout (16-byte aligned, multiple of 16) ──────────────────
// float4x4 viewProj (64) | float4 predator (16) | float4 params (16) | float4 campos (16) = 112
const CB_SIZE = 112;
const cb = makeConstantBuffer(CB_SIZE);
const cbData = Buffer.alloc(CB_SIZE);

// ── Additive blend state (SRC=ONE, DEST=ONE) so glow accumulates ──────────────
// D3D11_BLEND_DESC: AlphaToCoverageEnable(BOOL)@0, IndependentBlendEnable(BOOL)@4,
// then RenderTarget[8] of D3D11_RENDER_TARGET_BLEND_DESC (8 fields × 4 bytes = 32 each).
// RT0: BlendEnable@8, SrcBlend@12, DestBlend@16, BlendOp@20, SrcBlendAlpha@24,
//      DestBlendAlpha@28, BlendOpAlpha@32, RenderTargetWriteMask@36.
const D3D11_BLEND_ONE = 2;
const D3D11_BLEND_OP_ADD = 1;
const blendDesc = Buffer.alloc(8 + 32 * 8);
blendDesc.writeUInt32LE(0, 0); // AlphaToCoverageEnable
blendDesc.writeUInt32LE(0, 4); // IndependentBlendEnable
blendDesc.writeUInt32LE(1, 8); // RT0.BlendEnable = TRUE
blendDesc.writeUInt32LE(D3D11_BLEND_ONE, 12); // SrcBlend
blendDesc.writeUInt32LE(D3D11_BLEND_ONE, 16); // DestBlend
blendDesc.writeUInt32LE(D3D11_BLEND_OP_ADD, 20); // BlendOp
blendDesc.writeUInt32LE(D3D11_BLEND_ONE, 24); // SrcBlendAlpha
blendDesc.writeUInt32LE(D3D11_BLEND_ONE, 28); // DestBlendAlpha
blendDesc.writeUInt32LE(D3D11_BLEND_OP_ADD, 32); // BlendOpAlpha
blendDesc.writeUInt32LE(0x0f, 36); // WriteMask = ALL
const ppBlend = Buffer.alloc(8);
if (vcall(gpu.device, DEV_CREATE_BLEND_STATE, [FFIType.ptr, FFIType.ptr], [blendDesc.ptr!, ppBlend.ptr!]) !== 0) {
  throw new Error('CreateBlendState (additive) failed.');
}
const blendState = ppBlend.readBigUInt64LE(0);

// ── Math helpers for the orbiting perspective camera (column-major for HLSL mul) ─
type Vec3 = [number, number, number];
function buildViewProj(eye: Vec3, target: Vec3, fovY: number, aspect: number, near: number, far: number): Float32Array {
  // View (look-at, right-handed).
  const up: Vec3 = [0, 1, 0];
  const fx = target[0] - eye[0];
  const fy = target[1] - eye[1];
  const fz = target[2] - eye[2];
  let fl = Math.hypot(fx, fy, fz) || 1;
  const f: Vec3 = [fx / fl, fy / fl, fz / fl];
  // s = normalize(cross(f, up))
  let sx = f[1] * up[2] - f[2] * up[1];
  let sy = f[2] * up[0] - f[0] * up[2];
  let sz = f[0] * up[1] - f[1] * up[0];
  const sl = Math.hypot(sx, sy, sz) || 1;
  sx /= sl;
  sy /= sl;
  sz /= sl;
  // u = cross(s, f)
  const ux = sy * f[2] - sz * f[1];
  const uy = sz * f[0] - sx * f[2];
  const uz = sx * f[1] - sy * f[0];

  // Right-handed view matrix (row-vector form), stored row-major.
  const view = [
    sx, sy, sz, -(sx * eye[0] + sy * eye[1] + sz * eye[2]),
    ux, uy, uz, -(ux * eye[0] + uy * eye[1] + uz * eye[2]),
    -f[0], -f[1], -f[2], f[0] * eye[0] + f[1] * eye[1] + f[2] * eye[2],
    0, 0, 0, 1,
  ];

  // Perspective (right-handed, zero-to-one depth — D3D convention), row-major.
  const yScale = 1 / Math.tan(fovY / 2);
  const xScale = yScale / aspect;
  const zr = far / (near - far);
  const proj = [
    xScale, 0, 0, 0,
    0, yScale, 0, 0,
    0, 0, zr, zr * near,
    0, 0, -1, 0,
  ];

  // viewProj = proj * view (both row-major 4x4).
  const m = new Float32Array(16);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      let acc = 0;
      for (let k = 0; k < 4; k += 1) acc += proj[row * 4 + k]! * view[k * 4 + col]!;
      m[row * 4 + col] = acc;
    }
  }
  return m;
}

// ── GDI HUD font ──────────────────────────────────────────────────────────────
const hudFont = GDI32.CreateFontW(-18, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4 /* ANTIALIASED_QUALITY */, 0, Buffer.from('Consolas\0', 'utf16le').ptr!);
const TRANSPARENT_BK = 1;

function drawHud(fps: number): void {
  const dc = User32.GetDC(win.hwnd);
  if (!dc) return;
  const prevFont = GDI32.SelectObject(dc, hudFont);
  GDI32.SetBkMode(dc, TRANSPARENT_BK);
  const line = `Boids · ${NUM_BOIDS} · ${fps} fps · ${gpu.gpuName}`;
  const text = Buffer.from(`${line}\0`, 'utf16le');
  const len = line.length;
  GDI32.SetTextColor(dc, 0x00000000); // shadow
  GDI32.TextOutW(dc, 17, 17, text.ptr!, len);
  GDI32.SetTextColor(dc, 0x00ffd8a0); // BGR: warm cyan-white
  GDI32.TextOutW(dc, 16, 16, text.ptr!, len);
  GDI32.SelectObject(dc, prevFont);
  User32.ReleaseDC(win.hwnd, dc);
}

// ── Teardown ──────────────────────────────────────────────────────────────────
let cleanedUp = false;
function cleanup(code: number): never {
  if (!cleanedUp) {
    cleanedUp = true;
    GDI32.DeleteObject(hudFont);
    comRelease(blendState);
    comRelease(cb);
    if (bufA.srv) comRelease(bufA.srv);
    if (bufA.uav) comRelease(bufA.uav);
    comRelease(bufA.buffer);
    if (bufB.srv) comRelease(bufB.srv);
    if (bufB.uav) comRelease(bufB.uav);
    comRelease(bufB.buffer);
    comRelease(ps);
    comRelease(vs);
    comRelease(flockCS);
    comRelease(gpu.backBufferRTV);
    comRelease(gpu.swapChain);
    comRelease(gpu.context);
    comRelease(gpu.device);
    win.destroy();
  }
  process.exit(code);
}
process.on('SIGINT', () => cleanup(0));

console.log(`Boids — ${NUM_BOIDS} birds flocking on the GPU (${gpu.driver}, ${gpu.gpuName}).`);
console.log('  Move the mouse to drive the predator · ESC to exit.');

// ── Render loop ───────────────────────────────────────────────────────────────
const start = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
let last = start;
let frames = 0;
let fps = 0;
let fpsWindowStart = start;
const aspect = clientW / clientH;

// Predator world point (smoothed toward the mouse-driven target).
const predator: Vec3 = [0, 0, 0];
const NULLP = null as unknown as Pointer;
const emptyBind = Buffer.alloc(8); // a single null pointer, for unbinding SRV/UAV

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;

  const now = performance.now();
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.05) dt = 0.05; // clamp huge first-frame / hitch steps
  const time = (now - start) / 1000;

  // ── Map the mouse into a world-space predator ray on the orbit plane ────────
  const mouse = win.getMouse();
  const ndcX = (mouse.x / clientW) * 2 - 1;
  const ndcY = (mouse.y / clientH) * 2 - 1;
  // Camera slowly orbits the flock.
  const orbit = time * 0.18;
  const camDist = WORLD_RADIUS * 1.6; // pulled in so the spread murmuration fills the frame
  const camHeight = Math.sin(time * 0.11) * WORLD_RADIUS * 0.4;
  const eye: Vec3 = [Math.cos(orbit) * camDist, camHeight, Math.sin(orbit) * camDist];
  const target: Vec3 = [0, 0, 0];
  // Predator target: project the mouse into the world near the flock centre.
  const fwd: Vec3 = [target[0] - eye[0], target[1] - eye[1], target[2] - eye[2]];
  const fl = Math.hypot(...fwd) || 1;
  const fn: Vec3 = [fwd[0] / fl, fwd[1] / fl, fwd[2] / fl];
  let rx = fn[1] * 0 - fn[2] * 1;
  let ry = fn[2] * 0 - fn[0] * 0;
  let rz = fn[0] * 1 - fn[1] * 0;
  const rl = Math.hypot(rx, ry, rz) || 1;
  rx /= rl;
  ry /= rl;
  rz /= rl;
  const ux = ry * fn[2] - rz * fn[1];
  const uy = rz * fn[0] - rx * fn[2];
  const uz = rx * fn[1] - ry * fn[0];
  const spread = WORLD_RADIUS * 0.95;
  const predTarget: Vec3 = [
    rx * ndcX * spread + ux * -ndcY * spread,
    ry * ndcX * spread + uy * -ndcY * spread,
    rz * ndcX * spread + uz * -ndcY * spread,
  ];
  // Smooth the predator so it glides.
  predator[0] += (predTarget[0] - predator[0]) * Math.min(1, dt * 6);
  predator[1] += (predTarget[1] - predator[1]) * Math.min(1, dt * 6);
  predator[2] += (predTarget[2] - predator[2]) * Math.min(1, dt * 6);

  // ── Build the constant buffer immediately before the calls that consume it ──
  const vp = buildViewProj(eye, target, (60 * Math.PI) / 180, aspect, 0.5, 200);
  for (let k = 0; k < 16; k += 1) cbData.writeFloatLE(vp[k]!, k * 4);
  cbData.writeFloatLE(predator[0], 64);
  cbData.writeFloatLE(predator[1], 68);
  cbData.writeFloatLE(predator[2], 72);
  cbData.writeFloatLE(mouse.down ? 2.0 : 1.0, 76); // predator strength (boosted on click)
  cbData.writeFloatLE(dt, 80); // params.x
  cbData.writeFloatLE(NUM_BOIDS, 84); // params.y
  cbData.writeFloatLE(time, 88); // params.z
  cbData.writeFloatLE(WORLD_RADIUS, 92); // params.w
  cbData.writeFloatLE(eye[0], 96); // campos.x
  cbData.writeFloatLE(eye[1], 100);
  cbData.writeFloatLE(eye[2], 104);
  cbData.writeFloatLE(0, 108);
  updateConstantBuffer(cb, cbData);

  // ── Compute pass: src (SRV) → dst (UAV) ─────────────────────────────────────
  csSet(flockCS, { cb: [cb], uav: [bufB.uav!], srv: [bufA.srv!] });
  dispatch(Math.ceil(NUM_BOIDS / THREADS), 1, 1);
  // Unbind the UAV so the same buffer can be read as a VS SRV next.
  vcall(
    gpu.context,
    68 /* CSSetUnorderedAccessViews */,
    [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr],
    [0, 1, emptyBind.ptr!, NULLP],
    FFIType.void,
  );
  // Swap: bufB now holds the new state.
  const tmp = bufA;
  bufA = bufB;
  bufB = tmp;

  // ── Render pass: oriented triangles, additive blend ─────────────────────────
  setRenderTargets([gpu.backBufferRTV]);
  setViewport(clientW, clientH);
  clear(gpu.backBufferRTV, [0.01, 0.012, 0.03, 1]);

  // OMSetBlendState(blendState, blendFactor=NULL, sampleMask=0xffffffff)
  vcall(gpu.context, CTX_OM_SET_BLEND_STATE, [FFIType.u64, FFIType.ptr, FFIType.u32], [blendState, NULLP, 0xffffffff], FFIType.void);

  // Bind VS + its SRV (the freshly computed boids in bufA) + constant buffer.
  vcall(gpu.context, 11 /* VSSetShader */, [FFIType.u64, FFIType.ptr, FFIType.u32], [vs, NULLP, 0], FFIType.void);
  const vsSrv = Buffer.alloc(8);
  vsSrv.writeBigUInt64LE(bufA.srv!, 0);
  vcall(gpu.context, CTX_VS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 1, vsSrv.ptr!], FFIType.void);
  const vsCb = Buffer.alloc(8);
  vsCb.writeBigUInt64LE(cb, 0);
  vcall(gpu.context, CTX_VS_SET_CONSTANT_BUFFERS, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 1, vsCb.ptr!], FFIType.void);

  // Bind PS.
  vcall(gpu.context, 9 /* PSSetShader */, [FFIType.u64, FFIType.ptr, FFIType.u32], [ps, NULLP, 0], FFIType.void);

  // Draw N triangles (3 verts each) with no vertex buffer; VS pulls from the SRV.
  vcall(gpu.context, CTX_IA_SET_PRIMITIVE_TOPOLOGY, [FFIType.u32], [D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST], FFIType.void);
  vcall(gpu.context, CTX_DRAW, [FFIType.u32, FFIType.u32], [NUM_BOIDS * 3, 0], FFIType.void);

  // Unbind the VS SRV so next frame's compute pass can re-use the buffer as a UAV.
  vcall(gpu.context, CTX_VS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 1, emptyBind.ptr!], FFIType.void);

  gpu.present(false);
  drawHud(fps);

  frames += 1;
  if (now - fpsWindowStart >= 500) {
    fps = Math.round((frames * 1000) / (now - fpsWindowStart));
    frames = 0;
    fpsWindowStart = now;
  }

  if (durationMs > 0 && now - start >= durationMs) break;
}

cleanup(0);
