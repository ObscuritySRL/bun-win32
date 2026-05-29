/**
 * Path Tracer — a real, progressive GPU path tracer converging to a clean image live.
 *
 * A borderless window fills with a Cornell-box-style room — a white ceiling/floor, a
 * red left wall, a green right wall, a glowing emissive panel in the ceiling — holding
 * three spheres: a soft diffuse sphere, a perfect mirror, and a clear glass ball that
 * refracts the room behind it. Nothing is precomputed: every frame a runtime-compiled
 * HLSL pixel shader traces exactly ONE new light path per pixel through up to eight
 * bounces (cosine-weighted diffuse with next-event estimation toward the ceiling
 * panel, mirror reflection, dielectric refract/reflect with Schlick Fresnel,
 * Russian-roulette path termination), using a per-pixel hash RNG seeded
 * by pixel coordinate + the running sample count. That single noisy sample is blended
 * into a 32-bit float accumulator with a ping-pong pair of render-target textures —
 * accum = lerp(prevAccum, sample, 1/spp) — so the picture boils with Monte-Carlo noise
 * for the first frames and then visibly resolves into a smooth, photographic render over
 * a few seconds. A final pass runs the accumulator through an ACES filmic tonemap plus
 * gamma to the swap-chain back buffer. Drag the mouse to orbit the camera, or W/S /
 * arrow keys to dolly; any camera move resets the sample count to 0 and the convergence
 * begins again. The wow is watching the noise melt away into a real render, in pure
 * TypeScript driving the actual GPU.
 *
 * Pipeline (per frame, ~60 fps off a PeekMessage pump):
 *   1. read input → orbit/dolly camera; if it moved, reset spp = 0
 *   2. update the constant buffer (resolution, camera basis, spp, frame seed)
 *   3. TRACE pass → bind prevAccum SRV, render one sample lerp-blended into nextAccum RTV
 *   4. swap the ping-pong pair (nextAccum becomes the live accumulator)
 *   5. TONEMAP pass → sample the live accumulator, ACES + gamma, draw to the back buffer
 *   6. IDXGISwapChain::Present; GDI TextOutW HUD on top
 *
 * @bun-win32 / engine APIs used (all via packages/all/example/_gpu.ts):
 *   createWindow / createDevice / compile / makeVertexShader / makePixelShader /
 *   makeConstantBuffer / updateConstantBuffer / makeTexture (R32G32B32A32_FLOAT RTV+SRV) /
 *   makeSampler / setRenderTargets / setViewport / clear / vsSet / psSet /
 *   drawFullscreenTriangle / present / comRelease / blobRelease  — plus GDI32/User32 for the HUD.
 *
 * Run: bun run packages/all/example/pathtracer.ts
 */

import { GDI32, User32 } from '../index';
import { VirtualKey } from '@bun-win32/user32';
import * as gpu from './_gpu';

const WIDTH = 1280;
const HEIGHT = 720;
const TRANSPARENT_BK = 1;

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

// Letter virtual-key codes (Windows uses the uppercase ASCII value for A–Z).
const VK_W = 0x57;
const VK_A = 0x41;
const VK_S = 0x53;
const VK_D = 0x44;

// ── Shaders ────────────────────────────────────────────────────────────────────
// Fullscreen-triangle vertex shader: 3 verts from SV_VertexID, carries uv.
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

// The path-tracing pixel shader. Traces ONE sample per pixel this frame and
// lerp-blends it into the previous accumulator (read through t0). The whole
// Cornell-style scene is hard-coded as analytic spheres + axis-aligned planes.
const PS_TRACE = `
cbuffer Frame : register(b0) {
  float2 iResolution;  // viewport size in pixels
  float  iSpp;         // samples already accumulated BEFORE this one (0 on reset)
  float  iSeed;        // per-frame seed salt (frame counter)
  float3 camPos;       // camera world position
  float  camFovScale;  // tan(fov/2) baked into ray gen
  float3 camFwd;       // camera forward (normalized)
  float  pad0;
  float3 camRight;     // camera right (normalized)
  float  pad1;
  float3 camUp;        // camera up (normalized)
  float  pad2;
};

Texture2D    PrevAccum : register(t0);
SamplerState Smp       : register(s0);

#define PI 3.14159265358979

// ── per-pixel hash RNG (PCG-ish) ───────────────────────────────────────────────
uint hashU(uint x) {
  x ^= x >> 17; x *= 0xed5ad4bbu; x ^= x >> 11; x *= 0xac4c1b51u;
  x ^= x >> 15; x *= 0x31848babu; x ^= x >> 14; return x;
}
static uint g_rngState;
void seedRng(uint2 px, uint sampleIdx) {
  g_rngState = hashU(px.x * 1973u + px.y * 9277u + sampleIdx * 26699u + 1u);
}
float rnd() {
  g_rngState = g_rngState * 747796405u + 2891336453u;
  uint w = ((g_rngState >> ((g_rngState >> 28) + 4u)) ^ g_rngState) * 277803737u;
  w = (w >> 22) ^ w;
  return float(w) * (1.0 / 4294967296.0);
}

// ── scene description ──────────────────────────────────────────────────────────
// Materials: 0 diffuse, 1 mirror, 2 dielectric (glass), 3 emissive light.
struct Hit { float t; float3 n; float3 albedo; int mat; };

// Room is a box from (-rx,-ry,-rz) to (rx,ry,rz). Walls are colored planes.
static const float RX = 2.0, RY = 2.0, RZ = 2.6;

// Ceiling emissive panel geometry + radiance. The disk sits just under the
// ceiling, spanning [-LHX,LHX]x[-LHZ,LHZ] at height LY, facing down (0,-1,0).
// LEMIT is the panel's emitted radiance (bright so the room fills with light).
static const float LHX = 0.85, LHZ = 0.85;
static const float LY  = RY - 0.02;
static const float3 LEMIT = float3(34.0, 30.0, 24.0);
static const float  LAREA = (2.0 * LHX) * (2.0 * LHZ);

// Sphere intersection; returns distance or -1.
float iSphere(float3 ro, float3 rd, float3 c, float r) {
  float3 oc = ro - c;
  float b = dot(oc, rd);
  float cc = dot(oc, oc) - r * r;
  float h = b * b - cc;
  if (h < 0.0) return -1.0;
  h = sqrt(h);
  float t0 = -b - h;
  if (t0 > 1e-3) return t0;
  float t1 = -b + h;
  if (t1 > 1e-3) return t1;
  return -1.0;
}

// Trace the room (six inward-facing planes) + three spheres. Fills 'h'.
bool trace(float3 ro, float3 rd, out Hit h) {
  h.t = 1e9; h.mat = -1; h.n = float3(0,0,0); h.albedo = float3(0,0,0);
  bool found = false;

  // Axis-aligned room walls, viewed from INSIDE the box. Each wall's normal points
  // toward the interior; the plane offset is +R so the inward face is the front
  // face (denom = dot(rd,n) < 0 for a ray heading into the wall). For a wall at
  // coordinate -R the inward normal is +axis and the plane n·p + R = 0 holds
  // (p = -R on that axis); for the +R wall the inward normal is -axis, also +R.
  // -X (left) red, +X (right) green, the wall the camera faces is white, the wall
  // behind the camera is dim.
  [unroll] for (int i = 0; i < 6; i++) {
    float3 n; float planeD; float3 alb; int mat = 0;
    if (i == 0) { n = float3( 1, 0, 0); planeD = RX; alb = float3(0.75, 0.15, 0.15); }       // left wall (red)   x=-RX
    else if (i == 1) { n = float3(-1, 0, 0); planeD = RX; alb = float3(0.15, 0.55, 0.20); }  // right wall (green) x=+RX
    else if (i == 2) { n = float3( 0, 1, 0); planeD = RY; alb = float3(0.80, 0.80, 0.82); }  // floor   y=-RY
    else if (i == 3) { n = float3( 0,-1, 0); planeD = RY; alb = float3(0.80, 0.80, 0.82); }  // ceiling y=+RY
    else if (i == 4) { n = float3( 0, 0, 1); planeD = RZ; alb = float3(0.80, 0.80, 0.82); }  // far wall (faced) z=-RZ
    else            { n = float3( 0, 0,-1); planeD = RZ; alb = float3(0.10, 0.10, 0.12); }   // wall behind camera (dim) z=+RZ
    float denom = dot(rd, n);
    if (denom >= -1e-4) continue;                 // only inward-facing front faces
    float t = -(dot(ro, n) + planeD) / denom;
    if (t <= 1e-3 || t >= h.t) continue;
    float3 p = ro + rd * t;
    // Bounds check on the wall quad (stay inside the room footprint).
    if (abs(p.x) > RX + 1e-2 || abs(p.y) > RY + 1e-2 || abs(p.z) > RZ + 1e-2) continue;
    h.t = t; h.n = n; h.albedo = alb; h.mat = mat; found = true;
  }

  // Emissive ceiling panel: a bright rectangle just under the ceiling.
  {
    float3 n = float3(0, -1, 0);
    float t = -(ro.y - LY) / rd.y;
    if (rd.y > 1e-4 && t > 1e-3 && t < h.t) {
      float3 p = ro + rd * t;
      if (abs(p.x) < LHX && abs(p.z) < LHZ) {
        h.t = t; h.n = n; h.albedo = LEMIT; h.mat = 3; found = true;
      }
    }
  }

  // Three spheres on the floor.
  // 0: diffuse warm sphere (left), 1: mirror (right), 2: glass (front-center).
  float3 sc0 = float3(-1.05, -RY + 0.62, 0.45); float sr0 = 0.62;
  float3 sc1 = float3( 1.05, -RY + 0.62, -0.55); float sr1 = 0.62;
  float3 sc2 = float3( 0.10, -RY + 0.55, 1.05); float sr2 = 0.55;

  float ts = iSphere(ro, rd, sc0, sr0);
  if (ts > 0.0 && ts < h.t) { h.t = ts; h.n = normalize(ro + rd * ts - sc0); h.albedo = float3(0.85, 0.55, 0.30); h.mat = 0; found = true; }
  ts = iSphere(ro, rd, sc1, sr1);
  if (ts > 0.0 && ts < h.t) { h.t = ts; h.n = normalize(ro + rd * ts - sc1); h.albedo = float3(0.95, 0.95, 0.97); h.mat = 1; found = true; }
  ts = iSphere(ro, rd, sc2, sr2);
  if (ts > 0.0 && ts < h.t) { h.t = ts; h.n = normalize(ro + rd * ts - sc2); h.albedo = float3(1.0, 1.0, 1.0); h.mat = 2; found = true; }

  return found;
}

// Cosine-weighted hemisphere sample around normal n.
float3 cosineHemisphere(float3 n) {
  float u1 = rnd(); float u2 = rnd();
  float r = sqrt(u1);
  float phi = 2.0 * PI * u2;
  float3 t = normalize(abs(n.x) > 0.1 ? cross(float3(0,1,0), n) : cross(float3(1,0,0), n));
  float3 b = cross(n, t);
  float3 d = t * (r * cos(phi)) + b * (r * sin(phi)) + n * sqrt(max(0.0, 1.0 - u1));
  return normalize(d);
}

// Shadow ray: is there an OPAQUE (diffuse/mirror) blocker within [eps, maxT)?
// Glass is treated as transparent for shadows so the room stays brightly lit and
// caustic-free black blobs don't form; the light panel itself is not a blocker.
bool occluded(float3 ro, float3 rd, float maxT) {
  // Spheres: diffuse (sc0) and mirror (sc1) cast shadows; glass (sc2) does not.
  float3 sc0 = float3(-1.05, -RY + 0.62, 0.45); float sr0 = 0.62;
  float3 sc1 = float3( 1.05, -RY + 0.62, -0.55); float sr1 = 0.62;
  float ts = iSphere(ro, rd, sc0, sr0);
  if (ts > 1e-3 && ts < maxT) return true;
  ts = iSphere(ro, rd, sc1, sr1);
  if (ts > 1e-3 && ts < maxT) return true;
  // Walls (planes 0..5) — any inward-facing wall in range blocks the light.
  [unroll] for (int i = 0; i < 6; i++) {
    float3 n;
    if (i == 0) n = float3( 1, 0, 0);
    else if (i == 1) n = float3(-1, 0, 0);
    else if (i == 2) n = float3( 0, 1, 0);
    else if (i == 3) n = float3( 0,-1, 0);
    else if (i == 4) n = float3( 0, 0, 1);
    else            n = float3( 0, 0,-1);
    float planeD = (i < 2) ? RX : (i < 4) ? RY : RZ;
    float denom = dot(rd, n);
    if (denom >= -1e-4) continue;
    float t = -(dot(ro, n) + planeD) / denom;
    if (t <= 1e-3 || t >= maxT) continue;
    float3 p = ro + rd * t;
    if (abs(p.x) > RX + 1e-2 || abs(p.y) > RY + 1e-2 || abs(p.z) > RZ + 1e-2) continue;
    return true;
  }
  return false;
}

// Next-event estimation: sample a point on the ceiling light disk and return the
// direct radiance reaching a diffuse surface at p with normal n and albedo.
// This is what makes the scene resolve BRIGHT in the first frames instead of
// relying on a diffuse bounce randomly stumbling into the tiny light by chance.
float3 sampleLightDirect(float3 p, float3 n, float3 albedo) {
  // Uniform point on the rectangular panel (facing straight down).
  float3 lp = float3((rnd() * 2.0 - 1.0) * LHX, LY, (rnd() * 2.0 - 1.0) * LHZ);
  float3 toL = lp - p;
  float dist2 = dot(toL, toL);
  float dist = sqrt(dist2);
  float3 wi = toL / dist;
  float cosSurf = dot(n, wi);            // cosine at the shading point
  float cosLight = -wi.y;                // panel normal is (0,-1,0); facing down
  if (cosSurf <= 0.0 || cosLight <= 0.0) return float3(0,0,0);
  // Offset the shadow-ray origin off the surface and stop just short of the panel.
  float3 so = p + n * 1e-3;
  if (occluded(so, wi, dist - 2e-3)) return float3(0,0,0);
  // Diffuse BRDF (albedo/PI) × emitted radiance × geometry term / area-PDF.
  // pdf_area = 1/LAREA → convert to solid angle: G = cosSurf*cosLight/dist2.
  float G = (cosSurf * cosLight) / dist2;
  return (albedo / PI) * LEMIT * G * LAREA;
}

// Trace one full path and return its radiance. Uses next-event estimation at
// every diffuse bounce (sampleLightDirect), so the room is lit on the FIRST
// sample instead of waiting for a diffuse ray to randomly find the small panel.
// 'specularChain' tracks whether we arrived via the primary ray or a pure
// specular bounce (mirror/glass); only then do we add the panel's emission
// directly, which avoids double-counting the light already gathered via NEE.
float3 radiance(float3 ro, float3 rd) {
  float3 throughput = float3(1, 1, 1);
  float3 L = float3(0, 0, 0);
  bool specularChain = true;              // primary camera ray counts as specular

  [loop] for (int bounce = 0; bounce < 8; bounce++) {
    Hit h;
    if (!trace(ro, rd, h)) {
      // Missed everything — a faint cool ambient so escaped rays aren't pure black.
      L += throughput * float3(0.03, 0.035, 0.05);
      break;
    }
    float3 p = ro + rd * h.t;

    if (h.mat == 3) {                       // hit the light
      // Only add emission when the panel is seen directly or through a mirror/
      // glass bounce; diffuse paths already gathered it via NEE last bounce.
      if (specularChain) L += throughput * h.albedo;
      break;
    }
    if (h.mat == 1) {                       // mirror
      rd = reflect(rd, h.n);
      throughput *= h.albedo;
      ro = p + h.n * 1e-3;
      specularChain = true;
    } else if (h.mat == 2) {                // dielectric (glass)
      float ior = 1.5;
      float3 n = h.n;
      float cosi = dot(rd, n);
      float eta;
      if (cosi > 0.0) { n = -n; eta = ior; }     // exiting
      else { eta = 1.0 / ior; cosi = -cosi; }    // entering
      float k = 1.0 - eta * eta * (1.0 - cosi * cosi);
      // Schlick Fresnel reflectance.
      float r0 = (1.0 - ior) / (1.0 + ior); r0 = r0 * r0;
      float fres = (k < 0.0) ? 1.0 : (r0 + (1.0 - r0) * pow(1.0 - cosi, 5.0));
      if (rnd() < fres) {                   // reflect
        rd = reflect(rd, n);
        ro = p + n * 1e-3;
      } else {                              // refract
        rd = normalize(eta * rd + (eta * cosi - sqrt(max(0.0, k))) * n);
        ro = p - n * 1e-3;
      }
      specularChain = true;
      // glass barely tints — keep throughput
    } else {                                // diffuse
      // Direct lighting (NEE) at this hit — the dominant brightness term.
      L += throughput * sampleLightDirect(p, h.n, h.albedo);
      // Indirect: continue with a cosine-weighted bounce (BRDF/PDF = albedo).
      throughput *= h.albedo;
      ro = p + h.n * 1e-3;
      rd = cosineHemisphere(h.n);
      specularChain = false;
    }

    // Russian roulette after a few bounces.
    if (bounce >= 3) {
      float q = max(throughput.r, max(throughput.g, throughput.b));
      q = clamp(q, 0.05, 0.95);
      if (rnd() > q) break;
      throughput /= q;
    }
  }
  return L;
}

float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  uint2 px = uint2(fragPos.xy);
  uint sampleIdx = (uint)iSpp;
  seedRng(px, sampleIdx + (uint)iSeed * 9781u);

  // Jittered pixel center for free anti-aliasing across samples.
  float2 jitter = float2(rnd(), rnd());
  float2 ndc = ((fragPos.xy + jitter - 0.5) / iResolution) * 2.0 - 1.0;
  ndc.y = -ndc.y;
  float aspect = iResolution.x / iResolution.y;

  float3 dir = normalize(
      camFwd
    + camRight * (ndc.x * aspect * camFovScale)
    + camUp    * (ndc.y * camFovScale));

  float3 sampleRadiance = radiance(camPos, dir);

  // Read previous accumulator and blend: accum = lerp(prev, sample, 1/(spp+1)).
  float3 prev = PrevAccum.Sample(Smp, uv).rgb;
  float n = iSpp;                            // already-accumulated count
  float3 outc = (n <= 0.0) ? sampleRadiance : lerp(prev, sampleRadiance, 1.0 / (n + 1.0));
  return float4(outc, 1.0);
}
`;

// Tonemap pass: ACES filmic + gamma from the accumulator to the back buffer.
const PS_TONEMAP = `
Texture2D    Accum : register(t0);
SamplerState Smp   : register(s0);

float3 aces(float3 x) {
  float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return saturate((x * (a * x + b)) / (x * (c * x + d) + e));
}

float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float3 hdr = Accum.Sample(Smp, uv).rgb;
  // Exposure before the filmic curve. The accumulator holds physically-scaled
  // radiance (bright emitter + 1/r^2 falloff), so it needs to be scaled UP into
  // ACES' sweet spot or the room renders near-black. 3.2 puts the lit walls,
  // floor and spheres comfortably into the mid/upper range while the panel and
  // mirror highlights roll off cleanly.
  hdr *= 3.2;
  float3 col = aces(hdr);
  col = pow(col, 1.0 / 2.2);                // gamma
  return float4(col, 1.0);
}
`;

// ── Window + device ─────────────────────────────────────────────────────────────
const win = gpu.createWindow({ title: 'Path Tracer — progressive GPU rendering', width: WIDTH, height: HEIGHT, borderless: true });
const { w: clientW, h: clientH } = win.clientSize();
const device = gpu.createDevice(win.hwnd, { width: clientW, height: clientH });

// ── Shaders ──────────────────────────────────────────────────────────────────────
const vsCode = gpu.compile(VS_SOURCE, 'main', 'vs_5_0');
const traceCode = gpu.compile(PS_TRACE, 'main', 'ps_5_0');
const tonemapCode = gpu.compile(PS_TONEMAP, 'main', 'ps_5_0');
const vs = gpu.makeVertexShader(vsCode);
const psTrace = gpu.makePixelShader(traceCode);
const psTonemap = gpu.makePixelShader(tonemapCode);

// ── Ping-pong accumulators (32-bit float, RTV + SRV) ──────────────────────────────
const accumA = gpu.makeTexture({ w: clientW, h: clientH, format: gpu.DXGI_FORMAT_R32G32B32A32_FLOAT, rtv: true, srv: true });
const accumB = gpu.makeTexture({ w: clientW, h: clientH, format: gpu.DXGI_FORMAT_R32G32B32A32_FLOAT, rtv: true, srv: true });
let readTex = accumA; // currently holds the previous accumulator
let writeTex = accumB; // target this frame

const sampler = gpu.makeSampler({ filter: gpu.D3D11_FILTER_MIN_MAG_MIP_POINT, address: gpu.D3D11_TEXTURE_ADDRESS_CLAMP });

// Constant buffer layout (96 bytes, 16-byte aligned):
//   float2 iResolution; float iSpp; float iSeed;     (16)
//   float3 camPos;      float camFovScale;           (16)
//   float3 camFwd;      float pad0;                  (16)
//   float3 camRight;    float pad1;                  (16)
//   float3 camUp;       float pad2;                  (16)
const CB_SIZE = 96;
const cb = gpu.makeConstantBuffer(CB_SIZE);
const cbData = Buffer.alloc(CB_SIZE);

// ── Camera (orbit around the room center) ─────────────────────────────────────────
let camYaw = 0.0;            // azimuth
let camPitch = 0.05;         // elevation
let camDist = 2.45;          // distance from target (INSIDE the box: RZ = 2.6)
const target: [number, number, number] = [0, -0.35, 0];
const fov = 42 * (Math.PI / 180);
const camFovScale = Math.tan(fov / 2);

let spp = 0;                 // samples accumulated so far
let frameCounter = 0;

// Mouse-drag orbit state.
let lastMouseX = win.getMouse().x;
let lastMouseY = win.getMouse().y;
let lastDown = false;

function computeCamera(): { pos: [number, number, number]; fwd: [number, number, number]; right: [number, number, number]; up: [number, number, number] } {
  const cp = Math.cos(camPitch);
  const sp = Math.sin(camPitch);
  const cy = Math.cos(camYaw);
  const sy = Math.sin(camYaw);
  // Orbit offset from target.
  const ox = camDist * cp * sy;
  const oy = camDist * sp;
  const oz = camDist * cp * cy;
  const pos: [number, number, number] = [target[0] + ox, target[1] + oy, target[2] + oz];
  // Forward toward the target.
  let fx = target[0] - pos[0];
  let fy = target[1] - pos[1];
  let fz = target[2] - pos[2];
  const fl = Math.hypot(fx, fy, fz) || 1;
  fx /= fl; fy /= fl; fz /= fl;
  // Right vector. cross((0,1,0), fwd) = (fz, 0, -fx); negate it so that the world
  // -X (red) wall lands on SCREEN-LEFT and +X (green) on SCREEN-RIGHT when looking
  // into the box. (Up is then derived from this right, keeping the image upright.)
  const rx = -fz;
  const ry = 0;
  const rz = fx;
  const rl = Math.hypot(rx, ry, rz) || 1;
  const rnx = rx / rl, rny = ry / rl, rnz = rz / rl;
  // Up = cross(fwd, right).
  const ux = fy * rnz - fz * rny;
  const uy = fz * rnx - fx * rnz;
  const uz = fx * rny - fy * rnx;
  return { pos, fwd: [fx, fy, fz], right: [rnx, rny, rnz], up: [ux, uy, uz] };
}

// ── Input → camera; reset spp whenever the camera moves ───────────────────────────
function pollInput(): boolean {
  let moved = false;
  const m = win.getMouse();

  if (m.down) {
    if (lastDown) {
      const dx = m.x - lastMouseX;
      const dy = m.y - lastMouseY;
      if (dx !== 0 || dy !== 0) {
        camYaw -= dx * 0.005;
        camPitch = clamp(camPitch + dy * 0.005, -1.3, 1.3);
        moved = true;
      }
    }
    lastDown = true;
  } else {
    lastDown = false;
  }
  lastMouseX = m.x;
  lastMouseY = m.y;

  // Dolly with W/S or Up/Down arrows. (W/A/S/D are letter VKs == their ASCII codes.)
  // Clamp keeps the camera INSIDE the closed box (RZ = 2.6) so the room stays in view.
  if (win.keyDown(VK_W) || win.keyDown(VirtualKey.VK_UP)) { camDist = clamp(camDist - 0.06, 1.5, 2.55); moved = true; }
  if (win.keyDown(VK_S) || win.keyDown(VirtualKey.VK_DOWN)) { camDist = clamp(camDist + 0.06, 1.5, 2.55); moved = true; }
  // Orbit with A/D or Left/Right arrows.
  if (win.keyDown(VK_A) || win.keyDown(VirtualKey.VK_LEFT)) { camYaw += 0.02; moved = true; }
  if (win.keyDown(VK_D) || win.keyDown(VirtualKey.VK_RIGHT)) { camYaw -= 0.02; moved = true; }

  return moved;
}

// ── GDI HUD ────────────────────────────────────────────────────────────────────
const encode = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');
const hudFont = GDI32.CreateFontW(-18, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4 /* ANTIALIASED_QUALITY */, 0, encode('Consolas').ptr!);

function drawHud(fps: number): void {
  const dc = User32.GetDC(win.hwnd);
  if (!dc) return;
  const prevFont = GDI32.SelectObject(dc, hudFont);
  GDI32.SetBkMode(dc, TRANSPARENT_BK);
  const line = `Path tracer · ${spp} spp · ${fps} fps · drag to orbit · WASD/arrows to move · move to reset`;
  const text = encode(line);
  const len = line.length;
  GDI32.SetTextColor(dc, 0x000000); // shadow
  GDI32.TextOutW(dc, 17, 17, text.ptr!, len);
  GDI32.SetTextColor(dc, 0x00e8f0f8); // BGR warm white
  GDI32.TextOutW(dc, 16, 16, text.ptr!, len);
  GDI32.SelectObject(dc, prevFont);
  User32.ReleaseDC(win.hwnd, dc);
}

console.log('Path Tracer — progressive GPU path tracing in pure TypeScript.');
console.log(`  ${device.driver} · ${device.gpuName} · ${clientW}x${clientH}`);
console.log('  Drag to orbit · W/S/arrows to dolly · A/D to orbit · ESC to exit.');

// ── Render loop ────────────────────────────────────────────────────────────────
const startTime = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
let frames = 0;
let fps = 0;
let fpsWindowStart = startTime;

let cleanedUp = false;
function cleanup(code: number): never {
  if (!cleanedUp) {
    cleanedUp = true;
    GDI32.DeleteObject(hudFont);
    gpu.comRelease(accumA.srv!);
    gpu.comRelease(accumA.rtv!);
    gpu.comRelease(accumA.tex);
    gpu.comRelease(accumB.srv!);
    gpu.comRelease(accumB.rtv!);
    gpu.comRelease(accumB.tex);
    gpu.comRelease(sampler);
    gpu.comRelease(cb);
    gpu.comRelease(psTonemap);
    gpu.comRelease(psTrace);
    gpu.comRelease(vs);
    gpu.blobRelease(tonemapCode.blob);
    gpu.blobRelease(traceCode.blob);
    gpu.blobRelease(vsCode.blob);
    gpu.comRelease(device.backBufferRTV);
    gpu.comRelease(device.swapChain);
    gpu.comRelease(device.context);
    gpu.comRelease(device.device);
    win.destroy();
  }
  process.exit(code);
}
process.on('SIGINT', () => cleanup(0));

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;

  // Input: orbit/dolly; reset the accumulator when the camera moves.
  if (pollInput()) spp = 0;

  const cam = computeCamera();

  // Constant buffer assembled immediately before the consuming draw.
  cbData.writeFloatLE(clientW, 0);
  cbData.writeFloatLE(clientH, 4);
  cbData.writeFloatLE(spp, 8);
  cbData.writeFloatLE(frameCounter % 4096, 12);
  cbData.writeFloatLE(cam.pos[0], 16);
  cbData.writeFloatLE(cam.pos[1], 20);
  cbData.writeFloatLE(cam.pos[2], 24);
  cbData.writeFloatLE(camFovScale, 28);
  cbData.writeFloatLE(cam.fwd[0], 32);
  cbData.writeFloatLE(cam.fwd[1], 36);
  cbData.writeFloatLE(cam.fwd[2], 40);
  cbData.writeFloatLE(0, 44);
  cbData.writeFloatLE(cam.right[0], 48);
  cbData.writeFloatLE(cam.right[1], 52);
  cbData.writeFloatLE(cam.right[2], 56);
  cbData.writeFloatLE(0, 60);
  cbData.writeFloatLE(cam.up[0], 64);
  cbData.writeFloatLE(cam.up[1], 68);
  cbData.writeFloatLE(cam.up[2], 72);
  cbData.writeFloatLE(0, 76);
  gpu.updateConstantBuffer(cb, cbData);

  // ── Pass 1: TRACE one sample into writeTex, reading readTex as previous accum ──
  gpu.setRenderTargets([writeTex.rtv!]);
  gpu.setViewport(clientW, clientH);
  gpu.vsSet(vs);
  gpu.psSet(psTrace, { cb: [cb], srv: [readTex.srv!], samp: [sampler] });
  gpu.drawFullscreenTriangle();
  gpu.setRenderTargets([]); // unbind so writeTex can be sampled next pass

  spp += 1;

  // ── Pass 2: TONEMAP the freshly written accumulator to the back buffer ──
  gpu.setRenderTargets([device.backBufferRTV]);
  gpu.setViewport(clientW, clientH);
  gpu.clear(device.backBufferRTV, [0, 0, 0, 1]);
  gpu.vsSet(vs);
  gpu.psSet(psTonemap, { srv: [writeTex.srv!], samp: [sampler] });
  gpu.drawFullscreenTriangle();
  gpu.setRenderTargets([]); // unbind writeTex SRV before it becomes a RTV again

  // VSync-paced present: one new sample per refresh (~60 spp/s) so the convergence
  // from noisy to clean reads as a smooth few-second reveal rather than an instant snap.
  device.present(true);

  // Swap ping-pong: the just-written texture becomes the previous accumulator.
  const tmp = readTex;
  readTex = writeTex;
  writeTex = tmp;

  frameCounter += 1;

  // FPS accounting.
  const now = performance.now();
  frames += 1;
  if (now - fpsWindowStart >= 500) {
    fps = Math.round((frames * 1000) / (now - fpsWindowStart));
    frames = 0;
    fpsWindowStart = now;
  }
  drawHud(fps);

  if (durationMs > 0 && now - startTime >= durationMs) break;
}

console.log(`  ${frameCounter} frames presented · converged to ${spp} samples/pixel.`);
cleanup(0);
