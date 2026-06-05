/**
 * Shader Forge II — an interactive, JIT-recompiling, cinematic HLSL ray-marcher on your
 * real GPU, written entirely in TypeScript over Bun FFI → Direct3D 11.
 *
 * A borderless ~16:9 window becomes a film-quality SDF playground: TEN hand-authored
 * ray-marched scenes, each its own runtime-compiled HLSL pixel shader, rendered like stills
 * from an offline renderer — penumbra soft shadows, AO, fresnel + glossy reflections, TRUE
 * glass refraction with chromatic dispersion, a real participating-medium cloudscape, a
 * compute-shader reaction-diffusion field that lives on a creature's skin, a drifting
 * cinematic camera OR a free-fly camera you drive yourself, HDR accumulation, spiral bloom,
 * depth-of-field bokeh, anamorphic lens flare, chromatic aberration, motion blur, temporal
 * accumulation, and a JIT-selectable ACES / AgX / Reinhard filmic tonemap with dithered grain.
 *
 *   0. CHROME CATHEDRAL     — liquid-chrome monolith of arches over a mirror floor, god-rays.
 *   1. BIOLUMINESCENT REEF  — alien canyon of glowing coral domes under a teal nebula.
 *   2. APOLLONIAN ENGINE    — Apollonian-gasket fractal megastructure of nested spheres.
 *   3. MANDELBOX CITADEL    — folded Mandelbox megastructure with self-similar towers.
 *   4. STORM SEA OF LIGHT   — churning ocean of analytic waves with foam under a storm glow.
 *   5. GLASS & DISPERSION   — a faceted gem refracting the sky with per-channel IOR dispersion.
 *   6. VOLUMETRIC CLOUDS    — a real density-marched sunset cloudscape with light scattering.
 *   7. QUATERNION JULIA     — a 4D Julia set sliced to 3D, morphing, iridescent, orbit-trapped.
 *   8. SYNTHWAVE MENGER     — neon grid horizon + folded Menger megastructure + chrome sun.
 *   9. LIVING MEMBRANE      — a Gray-Scott reaction-diffusion sim (compute → buffer) glowing
 *                             on the displaced skin of an organic blob: a living creature.
 *
 * THE FLEX: none of this is precompiled. At launch the program builds the ten complete HLSL
 * ray-marchers (a shared lighting/sky/march "engine" string + each scene's own SDF) plus the
 * bloom / post / present / compute shaders and hands each as raw **source** to
 * `d3dcompiler_47!D3DCompile`, which JITs it to DXBC uploaded into a real `ID3D11Device`.
 * And it stays live: pressing the quality / tonemap / fractal-iteration / palette hotkeys
 * mutates the HLSL source string and **re-invokes D3DCompile on the active scene mid-render**
 * (~60 ms, one frame hitch), hot-swapping the shader — the runtime-compile story made
 * interactive and visible (the HUD flashes the JIT time).
 *
 * Pipeline (per frame): compute Gray-Scott step → simBuf → PASS A: march active scene → hdrA
 * (rgb=radiance, a=linear depth for DOF); if mid-fade, march next scene → hdrB → PASS B: spiral
 * bloom of lerp(hdrA,hdrB) → bloomTex → PASS C: DOF bokeh + chromatic aberration + lens flare +
 * motion blur + ACES/AgX/Reinhard tonemap + grade + vignette + grain → compTex → PRESENT: a
 * temporal-accumulation MRT pass → back buffer (+ history) → GDI HUD console → present.
 *
 * @bun-win32 / engine APIs: createWindow (+ getMouse/getWheel/keyDown input), createDevice,
 * compile (runtime HLSL→DXBC, all stages), makeVertexShader/makePixelShader/makeComputeShader,
 * makeConstantBuffer/updateConstantBuffer, makeStructuredBuffer (the reaction-diffusion field),
 * makeTexture (HDR RTV+SRV intermediates), makeSampler, setRenderTargets/setViewport/clear/
 * drawFullscreenTriangle, vsSet/psSet/csSet/dispatch, present, comRelease/blobRelease — plus
 * GDI32 CreateFontW/TextOutW for the HUD console.
 *
 * Controls (HUD console, Tab to toggle):
 *   Mouse drag orbit · wheel / Z X dolly · W A S D / Q E fly target · Space pause · [ ] prev/next
 *   1..0 jump to scene · C cinematic auto-camera+cycle · B G F V R bloom/god-rays/fog/AO/reflect
 *   - = exposure · , . march quality (JIT) · T tonemap op (JIT) · I fractal iters (JIT)
 *   J palette (JIT) · M motion blur · K chromatic aberration · O depth-of-field · P photo mode
 *
 * Run:        bun run packages/all/example/shader-forge.ts
 * Pin scene:  SCENE=7 bun run packages/all/example/shader-forge.ts
 * Self-shot:  SELFSHOT=1 SELFSHOT_PATH=<abs.png> DEMO_DURATION_MS=4000 bun run …/shader-forge.ts
 */

import { GDI32, User32 } from '../index';

import * as gpu from './_gpu';
import * as hud from './_hud';
import { captureBackBuffer } from './_snapshot';

const encode = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');
const TRANSPARENT_BK = 1;

// ── Scene catalog (display name + accent BGR for the HUD) ──────────────────────
export interface Scene {
  name: string;
  accent: number; // BGR for GDI SetTextColor
}
export const SCENES: readonly Scene[] = [
  { name: 'CHROME CATHEDRAL', accent: 0x00f0f0e8 },
  { name: 'BIOLUMINESCENT REEF', accent: 0x00f0e060 },
  { name: 'APOLLONIAN ENGINE', accent: 0x0060d0ff },
  { name: 'MANDELBOX CITADEL', accent: 0x00e0c0a0 },
  { name: 'STORM SEA OF LIGHT', accent: 0x00fff0d8 },
  { name: 'GLASS & DISPERSION', accent: 0x00f0d0b0 },
  { name: 'VOLUMETRIC CLOUDS', accent: 0x00c0e0ff },
  { name: 'QUATERNION JULIA', accent: 0x00ff90e0 },
  { name: 'SYNTHWAVE MENGER', accent: 0x00ff60c0 },
  { name: 'LIVING MEMBRANE', accent: 0x0070ffb0 },
];
const SCENE_HOLD = 7.0; // seconds a scene stays fully on screen (cinematic mode)
const SCENE_FADE = 2.6; // seconds of cross-fade into the next scene
const SCENE_CYCLE = SCENE_HOLD + SCENE_FADE;

// ── Fullscreen-triangle vertex shader (SV_VertexID, no vertex buffer) ──────────
export const VS_SOURCE = `
struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o;
  float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p;
  o.pos = float4(p * float2(2.0, -2.0) + float2(-1.0, 1.0), 0.0, 1.0);
  return o;
}
`;

// ── Shared ray-march engine header (cbuffer + helpers + Hit) ───────────────────
// Concatenated BEFORE the scene's SDF. The Frame cbuffer is 80 bytes; see writeFrameCb.
export const ENGINE_HEADER = `
cbuffer Frame : register(b0) {
  float2 iResolution;
  float  iTime;
  float  iSceneFade;
  float  iCamYaw;
  float  iCamPitch;
  float  iCamDist;
  float  iCamRoll;
  float3 iCamTarget;
  float  iQuality;
  float  iAO;
  float  iReflect;
  float  iFog;
  float  iGodrays;
  float  iEmissive;
  float  iShadow;
  float  iWarp;
  float  iPad0;
};

#ifndef MARCH_STEPS
#define MARCH_STEPS 160
#endif
#ifndef FRACTAL_ITERS
#define FRACTAL_ITERS 10
#endif
#ifndef PALETTE
#define PALETTE 0
#endif

#define PI 3.14159265
#define TAU 6.28318530

float hash21(float2 p) { p = frac(p * float2(123.34, 456.21)); p += dot(p, p + 45.32); return frac(p.x * p.y); }
float hash31(float3 p) { p = frac(p * 0.3183099 + 0.1); p *= 17.0; return frac(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise3(float3 x) {
  float3 i = floor(x); float3 f = frac(x); f = f * f * (3.0 - 2.0 * f);
  float n000 = hash31(i + float3(0,0,0)); float n100 = hash31(i + float3(1,0,0));
  float n010 = hash31(i + float3(0,1,0)); float n110 = hash31(i + float3(1,1,0));
  float n001 = hash31(i + float3(0,0,1)); float n101 = hash31(i + float3(1,0,1));
  float n011 = hash31(i + float3(0,1,1)); float n111 = hash31(i + float3(1,1,1));
  float nx00 = lerp(n000, n100, f.x); float nx10 = lerp(n010, n110, f.x);
  float nx01 = lerp(n001, n101, f.x); float nx11 = lerp(n011, n111, f.x);
  return lerp(lerp(nx00, nx10, f.y), lerp(nx01, nx11, f.y), f.z);
}
float fbm(float3 p) { float a = 0.5; float s = 0.0; [unroll] for (int i = 0; i < 5; i++) { s += a * noise3(p); p *= 2.02; a *= 0.5; } return s; }

float3x3 rotY(float a) { float s = sin(a), c = cos(a); return float3x3(c,0,s, 0,1,0, -s,0,c); }
float3x3 rotX(float a) { float s = sin(a), c = cos(a); return float3x3(1,0,0, 0,c,-s, 0,s,c); }
float3x3 rotZ(float a) { float s = sin(a), c = cos(a); return float3x3(c,-s,0, s,c,0, 0,0,1); }

float sdSphere(float3 p, float r) { return length(p) - r; }
float sdBox(float3 p, float3 b) { float3 q = abs(p) - b; return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0); }
float sdRoundBox(float3 p, float3 b, float r) { float3 q = abs(p) - b; return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r; }
float sdTorus(float3 p, float2 t) { float2 q = float2(length(p.xz) - t.x, p.y); return length(q) - t.y; }
float sdCyl(float3 p, float r, float h) { float2 d = abs(float2(length(p.xz), p.y)) - float2(r, h); return min(max(d.x,d.y),0.0) + length(max(d,0.0)); }
float sdOctahedron(float3 p, float s) { p = abs(p); return (p.x + p.y + p.z - s) * 0.57735027; }
float opSmoothUnion(float a, float b, float k) { float h = saturate(0.5 + 0.5 * (b - a) / k); return lerp(b, a, h) - k * h * (1.0 - h); }
float opSmoothSub(float a, float b, float k) { float h = saturate(0.5 - 0.5 * (b + a) / k); return lerp(b, -a, h) + k * h * (1.0 - h); }

struct Hit { float d; float3 albedo; float metal; float rough; float3 emissive; };
`;

// ── Per-scene SDF bodies ───────────────────────────────────────────────────────
// Each defines `Hit sceneMap(float3 p)` + `static const int SCENE_ID`, OR (for a fully
// custom renderer like the clouds) `#define CUSTOM_SCENE` and `float3 renderScene(...)`.

const SDF_CATHEDRAL = `
static const int SCENE_ID = 0;
Hit sceneMap(float3 p) {
  Hit h; h.albedo = float3(0.9, 0.92, 0.95); h.metal = 1.0; h.rough = 0.05; h.emissive = float3(0,0,0);
  float floorD = p.y + 1.6;
  float3 q = mul(rotY(iTime * 0.18), p);
  float body = sdSphere(q - float3(0, 0.2 + 0.25 * sin(iTime * 0.5), 0), 0.92);
  body = opSmoothUnion(body, sdTorus(mul(rotX(1.2), q) - float3(0, -0.15, 0), float2(1.15, 0.22)), 0.35);
  body = opSmoothUnion(body, sdTorus(mul(rotZ(0.7 + iTime * 0.12), q) - float3(0, 0.55, 0), float2(0.80, 0.16)), 0.30);
  body += 0.035 * sin(8.0 * q.x + iTime) * sin(8.0 * q.y) * sin(8.0 * q.z);
  float3 cp = p;
  float ang = atan2(cp.z, cp.x);
  float seg = 6.2831853 / 8.0;
  float a2 = (floor(ang / seg) + 0.5) * seg;
  float2 dir = float2(cos(a2), sin(a2));
  float3 colp = float3(cp.x - dir.x * 4.4, cp.y, cp.z - dir.y * 4.4);
  float column = sdCyl(colp, 0.34, 3.4);
  float arch = sdTorus(float3(colp.x, colp.y - 3.2, colp.z), float2(1.0, 0.30));
  float pillars = min(column, arch);
  float d = min(floorD, min(body, pillars));
  h.d = d;
  if (pillars <= body && pillars <= floorD) { h.albedo = float3(0.52, 0.44, 0.32); h.metal = 0.10; h.rough = 0.50; h.emissive = float3(0,0,0); }
  else if (floorD <= body && floorD <= pillars) {
    float vein = 0.5 + 0.5 * sin(p.x * 1.7 + p.z * 1.3 + 3.0 * fbm(p * 0.6));
    h.albedo = lerp(float3(0.04, 0.045, 0.06), float3(0.14, 0.13, 0.12), vein);
    h.metal = 0.75; h.rough = 0.06; h.emissive = float3(0,0,0);
  }
  return h;
}
`;

const SDF_REEF = `
static const int SCENE_ID = 1;
float reefBump(float3 p) {
  return sin(p.x * 5.3 + p.y * 4.1) * sin(p.z * 4.7 - p.y * 3.3) * 0.5 + 0.5;
}
Hit sceneMap(float3 p) {
  Hit best; best.metal = 0.0; best.emissive = float3(0,0,0);
  float ground = p.y + 1.4 + 0.9 * (sin(p.x * 0.6) * cos(p.z * 0.5) * 0.5 + 0.5 + 0.25 * sin(p.x * 1.7 + p.z * 1.3));
  best.d = ground; best.albedo = float3(0.05, 0.09, 0.11); best.rough = 0.8;
  [loop]
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float a = fi * 2.39996323;
    float r = 1.1 + fi * 0.55;
    float3 c = float3(cos(a) * r, -1.0 + 0.4 * sin(fi * 1.7), sin(a) * r);
    float pulse = 0.5 + 0.5 * sin(iTime * 1.3 + fi * 1.9);
    float dome = sdSphere(p - c, 0.55 + 0.12 * sin(fi));
    dome = opSmoothUnion(dome, sdCyl(p - c - float3(0, 0.6, 0), 0.09, 0.7), 0.25);
    dome += 0.045 * (reefBump(p * 2.0 + fi) - 0.5);
    if (dome < best.d) {
      best.d = dome;
      float3 tint = 0.5 + 0.5 * cos(6.2831853 * (fi * 0.13 + float3(0.0, 0.33, 0.66)));
      best.albedo = tint * 0.18 + 0.02;
      best.emissive = tint * (0.45 + 1.05 * pulse) * 1.1;
      best.rough = 0.30; best.metal = 0.15;
    }
  }
  return best;
}
`;

const SDF_APOLLONIAN = `
static const int SCENE_ID = 2;
Hit sceneMap(float3 p) {
  Hit h; h.emissive = float3(0,0,0);
  float3 q = mul(rotY(iTime * 0.08), p);
  float s = 1.3;
  float orbit = 1e9;
  [loop]
  for (int i = 0; i < FRACTAL_ITERS; i++) {
    q = -1.0 + 2.0 * frac(0.5 * q + 0.5);
    float r2 = dot(q, q);
    orbit = min(orbit, r2);
    float k = 1.05 / r2;
    q *= k; s *= k;
  }
  h.d = 0.25 * abs(q.y) / s;
  float3 tint = 0.5 + 0.5 * cos(6.2831853 * (orbit * 1.4 + float(PALETTE) * 0.17 + float3(0.0, 0.25, 0.55)) + iTime * 0.2);
  h.albedo = tint * 0.58 + 0.05;
  h.emissive = tint * smoothstep(0.0, 0.06, 0.05 - orbit) * 1.15;
  h.metal = 0.72; h.rough = 0.11;
  return h;
}
`;

const SDF_MANDELBOX = `
static const int SCENE_ID = 3;
Hit sceneMap(float3 p) {
  Hit h; h.emissive = float3(0,0,0);
  float3 z = mul(rotY(iTime * 0.06), p) * 0.9;
  float3 offset = z;
  float dr = 1.0;
  float SCALE = 2.45;
  float orbit = 1e9;
  [loop]
  for (int i = 0; i < FRACTAL_ITERS; i++) {
    z = clamp(z, -1.0, 1.0) * 2.0 - z;
    float r2 = dot(z, z);
    orbit = min(orbit, r2);
    float m = (r2 < 0.25) ? 4.0 : ((r2 < 1.0) ? (1.0 / r2) : 1.0);
    z *= m; dr *= m;
    z = z * SCALE + offset;
    dr = dr * abs(SCALE) + 1.0;
  }
  h.d = length(z) / abs(dr);
  float3 tint = 0.5 + 0.5 * cos(6.2831853 * (orbit * 0.9 + float(PALETTE) * 0.13 + float3(0.0, 0.18, 0.42)) + 1.5);
  h.albedo = tint * 0.50 + 0.06;
  h.metal = 0.65; h.rough = 0.14;
  h.emissive = tint * smoothstep(0.0, 0.04, 0.03 - orbit) * 0.7;
  return h;
}
`;

const SDF_SEA = `
static const int SCENE_ID = 4;
Hit sceneMap(float3 p) {
  Hit h; h.metal = 0.0; h.emissive = float3(0,0,0);
  float t = iTime * 0.6;
  float wy = 0.0;
  wy += 0.42 * sin(p.x * 0.7 + t * 1.1) * cos(p.z * 0.5 - t * 0.7);
  wy += 0.22 * sin(p.x * 1.4 - t * 1.7 + p.z * 0.9);
  wy += 0.12 * sin(p.z * 2.3 + t * 2.1);
  wy += 0.07 * sin(p.x * 3.1 - t * 2.3) * sin(p.z * 2.7 + t * 1.9);
  h.d = (p.y - wy) * 0.5;
  float crest = saturate((wy + 0.18) * 1.5);
  float ripple = sin(p.x * 9.0 + p.z * 7.0) * sin(p.z * 8.0 - p.x * 6.0) * 0.5 + 0.5;
  float foam = smoothstep(0.6, 1.0, crest) * (0.4 + 0.6 * ripple);
  h.albedo = lerp(float3(0.02, 0.07, 0.13), float3(0.92, 0.97, 1.0), foam);
  h.rough = lerp(0.025, 0.55, foam);
  h.metal = 0.0;
  h.emissive = float3(0.05, 0.16, 0.24) * (1.0 - crest) * 0.7 + float3(0.18, 0.42, 0.55) * foam * 0.35;
  return h;
}
`;

// ── 5. GLASS & DISPERSION — a faceted gem; metal = -1 flags glass to the engine ─
const SDF_GLASS = `
static const int SCENE_ID = 5;
#define ENABLE_GLASS
Hit sceneMap(float3 p) {
  Hit h; h.emissive = float3(0,0,0);
  float3 q = mul(rotX(0.5), mul(rotY(iTime * 0.3), p - float3(0.0, 0.15 * sin(iTime * 0.6), 0.0)));
  // Brilliant-cut gem: an octahedron intersected with a sphere, faceted by a few planes.
  float gem = sdOctahedron(q, 1.15);
  gem = max(gem, length(q) - 1.28);
  gem = max(gem, -(abs(q.y - 0.95) - 0.06));           // a girdle table cut
  float floorD = p.y + 1.35;
  float d = min(gem, floorD);
  h.d = d;
  if (gem < floorD) {
    h.albedo = float3(0.92, 0.96, 1.0); h.metal = -1.0; h.rough = 0.0;  // glass flag
  } else {
    float chk = 0.5 + 0.5 * sign(sin(p.x * 1.5) * sin(p.z * 1.5));
    h.albedo = lerp(float3(0.015, 0.015, 0.02), float3(0.05, 0.05, 0.06), chk);
    h.metal = 0.55; h.rough = 0.10;
  }
  return h;
}
`;

// ── 6. VOLUMETRIC CLOUDS — a fully custom volumetric renderer ───────────────────
const SDF_CLOUDS = `
static const int SCENE_ID = 6;
#define CUSTOM_SCENE
// Local 3-octave noise (the engine's 5-octave fbm, called 6x/step with an unrolled
// light loop, made FXC take ~5 s and emit 300 KB of DXBC for this one scene).
float cloudFbm(float3 p) {
  float a = 0.5, s = 0.0;
  [unroll] for (int i = 0; i < 3; i++) { s += a * noise3(p); p *= 2.03; a *= 0.5; }
  return s;
}
float cloudDensity(float3 p) {
  float3 q = p; q.x += iTime * 0.55; q.z += iTime * 0.12;
  float base = cloudFbm(q * 0.32);
  float shape = base - 0.52 - 0.14 * noise3(q * 1.6);  // higher threshold → puffy, separated clouds
  float layer = smoothstep(-0.2, 1.6, p.y) * smoothstep(7.5, 3.0, p.y);
  return saturate(shape * 2.1) * layer;
}
// Self-contained sunset sky (the cloud renderer runs before the engine's skyColor).
float3 cloudSky(float3 rd) {
  float up = saturate(rd.y * 0.5 + 0.5);
  float3 zen = float3(0.05, 0.11, 0.30), hor = float3(0.95, 0.50, 0.34), gnd = float3(0.14, 0.11, 0.16);
  float3 c = lerp(hor, zen, pow(up, 0.45));
  c = lerp(c, gnd, smoothstep(0.45, 0.0, rd.y * 0.5 + 0.5));
  float3 sun = normalize(float3(0.55, 0.32, -0.45));
  float s = saturate(dot(rd, sun));
  c += float3(1.0, 0.6, 0.35) * pow(s, 7.0) * 0.5;
  c += float3(1.0, 0.85, 0.6) * pow(s, 2000.0) * 6.0;
  return c;
}
float3 renderScene(float3 ro, float3 rd, out float depthOut) {
  float3 sun = normalize(float3(0.55, 0.32, -0.45));
  float3 sky = cloudSky(rd);
  depthOut = 80.0;
  float3 sunC = float3(1.0, 0.66, 0.40);
  float t = 0.5;
  float trans = 1.0;
  float3 col = float3(0,0,0);
  bool gotDepth = false;
  [loop]
  for (int i = 0; i < 72; i++) {
    if (trans < 0.02) break;
    float3 pos = ro + rd * t;
    if (pos.y > 8.0 && rd.y > 0.0) break;
    float d = cloudDensity(pos);
    if (d > 0.01) {
      float ls = 0.0;
      [loop]
      for (int j = 1; j <= 5; j++) { ls += cloudDensity(pos + sun * float(j) * 0.55); }
      float light = exp(-ls * 0.7);
      float ct = dot(rd, sun);
      float g = 0.55;
      float hg = (1.0 - g * g) / pow(max(1.0 + g * g - 2.0 * g * ct, 1e-3), 1.5) / (4.0 * PI);
      float3 amb = lerp(float3(0.09, 0.13, 0.25), float3(0.55, 0.40, 0.40), saturate(pos.y * 0.18));
      float3 cclr = lerp(amb, sunC * 2.1, light) + sunC * hg * light * 2.4;
      float a = saturate(d * 0.7);
      col += trans * a * cclr;
      trans *= (1.0 - a);
      if (!gotDepth) { depthOut = t; gotDepth = true; }
    }
    t += max(0.13, t * 0.022);
    if (t > 48.0) break;
  }
  float3 outc = sky * trans + col;
  float s = saturate(dot(rd, sun));
  outc += sunC * pow(s, 6.0) * 0.5 + sunC * pow(s, 900.0) * 8.0;
  return outc;
}
`;

// ── 7. QUATERNION JULIA — a 4D Julia set sliced to 3D ───────────────────────────
const SDF_JULIA = `
static const int SCENE_ID = 7;
float4 qmul(float4 a, float4 b) {
  return float4(
    a.x * b.x - a.y * b.y - a.z * b.z - a.w * b.w,
    a.x * b.y + a.y * b.x + a.z * b.w - a.w * b.z,
    a.x * b.z - a.y * b.w + a.z * b.x + a.w * b.y,
    a.x * b.w + a.y * b.z - a.z * b.y + a.w * b.x);
}
Hit sceneMap(float3 p) {
  Hit h; h.emissive = float3(0,0,0);
  float3 pr = mul(rotY(iTime * 0.13), p) * 1.05;
  float4 z = float4(pr, 0.0);
  float4 c = float4(-0.45 + 0.08 * sin(iTime * 0.21), 0.55, 0.42 * sin(iTime * 0.18), 0.18 * cos(iTime * 0.15));
  float md = 1.0;
  float orbit = 1e9;
  [loop]
  for (int i = 0; i < FRACTAL_ITERS; i++) {
    md *= 2.0 * length(z);
    z = qmul(z, z) + c;
    float r2 = dot(z, z);
    orbit = min(orbit, r2);
    if (r2 > 8.0) break;
  }
  float r = length(z);
  h.d = 0.5 * r * log(max(r, 1.0001)) / max(md, 1e-6);
  float3 pal = 0.5 + 0.5 * cos(TAU * (orbit * 0.42 + float(PALETTE) * 0.18 + float3(0.0, 0.33, 0.66)) + iTime * 0.25);
  h.albedo = pal * 0.55 + 0.04;
  h.metal = 0.42; h.rough = 0.16;
  h.emissive = pal * smoothstep(0.0, 0.06, 0.05 - orbit) * 1.3;
  return h;
}
`;

// ── 8. SYNTHWAVE MENGER — neon grid + folded Menger megastructure ───────────────
const SDF_SYNTH = `
static const int SCENE_ID = 8;
float mengerDE(float3 p) {
  float d = sdBox(p, float3(1.25, 1.25, 1.25));
  float s = 1.0;
  [loop]
  for (int i = 0; i < FRACTAL_ITERS && i < 5; i++) {
    // Floor-based mod (HLSL fmod is truncation-based and breaks the fold on negative coords).
    float3 a = (p * s) - 2.0 * floor(p * s * 0.5) - 1.0;
    s *= 3.0;
    float3 r = abs(1.0 - 3.0 * abs(a));
    float c = (min(max(r.x, r.y), min(max(r.y, r.z), max(r.z, r.x))) - 1.0) / s;
    d = max(d, c);
  }
  return d;
}
Hit sceneMap(float3 p) {
  Hit h; h.emissive = float3(0,0,0);
  float floorD = p.y + 1.6;
  float3 q = mul(rotY(iTime * 0.12), p - float3(0.0, 1.25 + 0.15 * sin(iTime * 0.5), 0.0));
  float menger = mengerDE(q * 0.8) / 0.8;
  float d = min(floorD, menger);
  h.d = d;
  if (menger < floorD) {
    float3 pal = 0.5 + 0.5 * cos(TAU * (float(PALETTE) * 0.2 + float3(0.0, 0.4, 0.85)) + q.y * 0.6 + iTime * 0.3);
    h.albedo = pal * 0.18; h.metal = 0.7; h.rough = 0.12;
    h.emissive = pal * 0.85;
  } else {
    float2 g = abs(frac(p.xz * 0.5) - 0.5);
    float grid = exp(-min(g.x, g.y) * 42.0);
    float fade = exp(-length(p.xz) * 0.04);
    h.albedo = float3(0.02, 0.0, 0.05); h.metal = 0.25; h.rough = 0.08;
    h.emissive = (float3(1.0, 0.12, 0.85) * grid * 1.6 + float3(0.0, 0.7, 1.0) * grid * 0.5) * fade;
  }
  return h;
}
`;

// ── 9. LIVING MEMBRANE — Gray-Scott reaction-diffusion (compute) on a blob ──────
const SDF_MEMBRANE = `
static const int SCENE_ID = 9;
StructuredBuffer<float2> SimBuf : register(t0);
static const int SIMW = 256;
float simAt(float2 uv) {
  uv = frac(uv);
  float2 f = uv * float(SIMW);
  int2 i0 = (int2)floor(f);
  float2 fr = frac(f);
  int x0 = i0.x % SIMW, y0 = clamp(i0.y, 0, SIMW - 1);          // longitude wraps, latitude clamps
  int x1 = (i0.x + 1) % SIMW, y1 = min(i0.y + 1, SIMW - 1);
  float v00 = SimBuf[y0 * SIMW + x0].y, v10 = SimBuf[y0 * SIMW + x1].y;
  float v01 = SimBuf[y1 * SIMW + x0].y, v11 = SimBuf[y1 * SIMW + x1].y;
  return lerp(lerp(v00, v10, fr.x), lerp(v01, v11, fr.x), fr.y);
}
Hit sceneMap(float3 p) {
  Hit h; h.emissive = float3(0,0,0);
  float3 q = mul(rotY(iTime * 0.1), p);
  float rad = length(q);
  float2 uv = float2(atan2(q.z, q.x) / TAU + 0.5, acos(clamp(q.y / max(rad, 1e-3), -1.0, 1.0)) / PI);
  float v = simAt(uv * float2(2.0, 1.0));
  float blob = rad - 1.2;
  blob += 0.04 * sin(q.x * 4.0 + iTime) * sin(q.y * 4.0) * sin(q.z * 4.0);
  blob -= v * 0.14;                                    // living displacement
  float floorD = p.y + 1.45;
  float d = min(blob, floorD);
  h.d = d;
  if (blob < floorD) {
    float3 pal = lerp(float3(0.04, 0.10, 0.12), float3(0.15, 0.95, 0.7), v);
    h.albedo = pal * 0.3; h.metal = 0.2; h.rough = 0.28;
    h.emissive = float3(0.1, 1.0, 0.6) * smoothstep(0.18, 0.6, v) * 1.7;
  } else {
    h.albedo = float3(0.03, 0.04, 0.05); h.metal = 0.1; h.rough = 0.6;
  }
  return h;
}
`;

export const SCENE_SDFS: readonly string[] = [SDF_CATHEDRAL, SDF_REEF, SDF_APOLLONIAN, SDF_MANDELBOX, SDF_SEA, SDF_GLASS, SDF_CLOUDS, SDF_JULIA, SDF_SYNTH, SDF_MEMBRANE];

// ── Shared ray-march engine body (lighting, sky/IBL, shadows, AO, march, glass) ─
// Concatenated AFTER the cbuffer + helpers and the scene's `sceneMap`/`SCENE_ID`.
export const ENGINE_BODY = `
#ifndef CUSTOM_SCENE
float mapD(float3 p) { return sceneMap(p).d; }

float3 calcNormal(float3 p) {
  float2 e = float2(1.0, -1.0) * 0.0011;
  return normalize(
    e.xyy * mapD(p + e.xyy) +
    e.yyx * mapD(p + e.yyx) +
    e.yxy * mapD(p + e.yxy) +
    e.xxx * mapD(p + e.xxx));
}

float softShadow(float3 ro, float3 rd, float k, float tmax) {
  float res = 1.0;
  float t = 0.025;
  float ph = 1e9;
  [loop]
  for (int i = 0; i < 32; i++) {
    float hh = mapD(ro + rd * t);
    if (hh < 0.0008) return 0.0;
    float y = hh * hh / (2.0 * ph);
    float d = sqrt(max(hh * hh - y * y, 0.0));
    res = min(res, k * d / max(0.0001, t - y));
    ph = hh;
    t += clamp(hh, 0.012, 0.32);
    if (t > tmax) break;
  }
  return saturate(res);
}

float calcAO(float3 p, float3 n) {
  float occ = 0.0; float sca = 1.0;
  [unroll]
  for (int i = 0; i < 6; i++) {
    float hr = 0.012 + 0.14 * float(i) / 5.0;
    float dd = mapD(p + n * hr);
    occ += (hr - dd) * sca;
    sca *= 0.78;
  }
  return saturate(1.0 - 2.4 * occ);
}
#endif

float3 sunDir() { return normalize(float3(0.45, 0.62, -0.50)); }
float3 fillDir() { return normalize(float3(-0.55, 0.18, 0.70)); }
float3 sunColor() { return float3(1.0, 0.86, 0.62); }

float3 skyColor(float3 rd) {
  float up = saturate(rd.y * 0.5 + 0.5);
  float3 hor, zen, gnd;
  if (SCENE_ID == 0)      { zen = float3(0.06, 0.10, 0.20); hor = float3(0.95, 0.62, 0.34); gnd = float3(0.10, 0.08, 0.07); }
  else if (SCENE_ID == 1) { zen = float3(0.01, 0.06, 0.11); hor = float3(0.02, 0.30, 0.36); gnd = float3(0.01, 0.04, 0.05); }
  else if (SCENE_ID == 2) { zen = float3(0.05, 0.04, 0.13); hor = float3(0.55, 0.22, 0.42); gnd = float3(0.05, 0.03, 0.07); }
  else if (SCENE_ID == 3) { zen = float3(0.04, 0.06, 0.12); hor = float3(0.46, 0.40, 0.52); gnd = float3(0.05, 0.05, 0.07); }
  else if (SCENE_ID == 4) { zen = float3(0.03, 0.05, 0.11); hor = float3(1.45, 1.10, 0.80); gnd = float3(0.04, 0.07, 0.11); }
  else if (SCENE_ID == 5) { zen = float3(0.10, 0.16, 0.30); hor = float3(1.30, 0.85, 0.55); gnd = float3(0.10, 0.10, 0.12); }
  else if (SCENE_ID == 6) { zen = float3(0.10, 0.20, 0.42); hor = float3(1.30, 0.72, 0.42); gnd = float3(0.18, 0.16, 0.20); }
  else if (SCENE_ID == 7) { zen = float3(0.03, 0.02, 0.08); hor = float3(0.30, 0.16, 0.45); gnd = float3(0.02, 0.02, 0.05); }
  else if (SCENE_ID == 8) { zen = float3(0.05, 0.01, 0.14); hor = float3(0.85, 0.10, 0.55); gnd = float3(0.02, 0.0, 0.05); }
  else                    { zen = float3(0.02, 0.05, 0.06); hor = float3(0.06, 0.22, 0.20); gnd = float3(0.01, 0.03, 0.03); }
  float3 col = lerp(hor, zen, pow(up, 0.55));
  col = lerp(col, gnd, smoothstep(0.5, 0.0, rd.y * 0.5 + 0.5));
  float band = 0.5 + 0.5 * sin(rd.x * 3.2 + iTime * 0.1) * sin(rd.z * 2.7 - iTime * 0.07) + 0.25 * sin(rd.y * 5.0 + iTime * 0.13);
  band = saturate(band * 0.6);
  float3 bandTint = (SCENE_ID == 1) ? float3(0.04, 0.16, 0.16) :
                    (SCENE_ID == 2) ? float3(0.16, 0.06, 0.18) :
                    (SCENE_ID == 6) ? float3(0.22, 0.12, 0.10) :
                    (SCENE_ID == 7) ? float3(0.14, 0.06, 0.20) :
                    (SCENE_ID == 8) ? float3(0.22, 0.04, 0.18) :
                    (SCENE_ID == 4) ? float3(0.10, 0.11, 0.15) :
                                      float3(0.14, 0.10, 0.07);
  col += bandTint * band * (0.6 + 0.4 * up);
  // Synthwave chrome sun: a banded gradient disc on the horizon.
  if (SCENE_ID == 8) {
    float3 sd = normalize(float3(0.0, 0.05, 1.0));
    float sun = saturate(dot(rd, sd));
    float disc = smoothstep(0.992, 0.9965, sun);
    float bands = step(0.0, sin(rd.y * 90.0 + 3.0));
    float3 sunGrad = lerp(float3(1.0, 0.85, 0.2), float3(1.0, 0.1, 0.6), saturate(-rd.y * 6.0 + 0.5));
    col += sunGrad * disc * (0.4 + 0.6 * bands) * 2.2;
  }
  float3 sun = sunDir();
  float s = saturate(dot(rd, sun));
  col += sunColor() * pow(s, 2200.0) * 14.0;
  col += float3(1.0, 0.55, 0.30) * pow(s, 7.0) * 0.55;
  return col;
}

float3 envSpec(float3 r, float rough) {
  float3 base = skyColor(r);
  float3 dull = skyColor(normalize(r + float3(0.0, 0.35, 0.0)));
  return lerp(base, dull, rough);
}

#ifndef CUSTOM_SCENE
float3 shadePoint(float3 pos, float3 rd, Hit m, float3 n, bool doShadow) {
  float3 ld = sunDir();
  float3 v = -rd;
  float3 hlf = normalize(ld + v);

  float ao = (iAO > 0.5) ? calcAO(pos, n) : 1.0;
  float sh = (doShadow && iShadow > 0.5) ? softShadow(pos + n * 0.01, ld, 9.0, 14.0) : 1.0;

  float diff = saturate(dot(n, ld));
  float ndf = pow(saturate(dot(n, hlf)), lerp(24.0, 2200.0, 1.0 - m.rough)) * (1.0 - m.rough * 0.85);
  float fres = pow(saturate(1.0 + dot(rd, n)), 5.0);
  float fillD = saturate(dot(n, fillDir())) * 0.5 + 0.5;

  float3 ambSky = skyColor(n) * (0.55 + 0.45 * n.y);
  float3 amb = ambSky * ao * lerp(0.9, 0.25, m.metal);
  float3 fill = float3(0.30, 0.42, 0.62) * fillD * ao * 0.5;
  float3 key = sunColor() * diff * sh * 3.0;

  float3 diffuse = m.albedo * (amb + fill + key);
  float3 spec = sunColor() * ndf * sh * (0.5 + 1.5 * m.metal);

  float3 col = diffuse + spec;
  col += m.emissive * iEmissive;
  col += float3(0.25, 0.45, 0.75) * fres * (0.25 + 0.55 * m.metal) * ao;
  return col;
}

float3 shadeReflected(float3 pos, float3 rd, Hit m, float3 n) {
  float3 ld = sunDir();
  float diff = saturate(dot(n, ld));
  float3 amb = skyColor(n) * (0.5 + 0.5 * n.y);
  float3 col = m.albedo * (amb * lerp(0.9, 0.3, m.metal) + sunColor() * diff * 2.0);
  col += m.emissive * iEmissive;
  return col;
}

float3 traceReflection(float3 ro, float3 rd) {
  float t = 0.04;
  [loop]
  for (int i = 0; i < 48; i++) {
    float3 pos = ro + rd * t;
    float d = mapD(pos);
    if (d < 0.0018 * t) {
      Hit m = sceneMap(pos);
      float3 n = calcNormal(pos);
      float3 c = shadeReflected(pos, rd, m, n);
      float fog = 1.0 - exp(-t * 0.05);
      return lerp(c, skyColor(rd), fog);
    }
    t += d;
    if (t > 20.0) break;
  }
  return skyColor(rd);
}
#endif

#ifdef ENABLE_GLASS
// March a ray that is INSIDE the medium until it exits (distance turns positive).
float marchInside(float3 ro, float3 rd, out float3 pOut) {
  float t = 0.02;
  [loop]
  for (int i = 0; i < 48; i++) {
    float3 pos = ro + rd * t;
    float d = mapD(pos);
    if (d > 0.0) { pOut = pos; return t; }
    t += max(-d, 0.012);
    if (t > 8.0) break;
  }
  pOut = ro + rd * t;
  return t;
}
// Refract one spectral channel through up to 2 internal bounces; sample the sky on exit.
float3 refractChannel(float3 ro, float3 rd, float3 n, float ior) {
  float3 dir = refract(rd, n, 1.0 / ior);
  if (dot(dir, dir) < 1e-5) dir = reflect(rd, n);
  float3 pos = ro;
  float3 col = float3(0,0,0);
  float att = 1.0;
  [loop]
  for (int b = 0; b < 2; b++) {
    float3 exitP;
    float tlen = marchInside(pos + dir * 0.02, dir, exitP);
    att *= exp(-tlen * 0.12);
    float3 nn = calcNormal(exitP);
    if (dot(dir, nn) > 0.0) nn = -nn;
    float3 rout = refract(dir, nn, ior);
    if (dot(rout, rout) > 1e-5) { col = skyColor(rout); break; }
    dir = reflect(dir, nn);
    pos = exitP;
    col = skyColor(dir);
  }
  return col * att;
}
float3 traceGlass(float3 ro, float3 rd, float3 n, float3 tint) {
  float r = refractChannel(ro, rd, n, 1.50).r;
  float g = refractChannel(ro, rd, n, 1.53).g;
  float b = refractChannel(ro, rd, n, 1.57).b;
  float3 refr = float3(r, g, b) * tint;
  float fres = pow(saturate(1.0 + dot(rd, n)), 5.0);
  float3 refl = skyColor(reflect(rd, n));
  return lerp(refr, refl, 0.04 + 0.55 * fres);
}
#endif

float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 res = max(iResolution, float2(1.0, 1.0));
  float2 jit = (float2(hash21(fragPos.xy + iTime), hash21(fragPos.yx - iTime)) - 0.5);
  float2 p = ((fragPos.xy + jit) * 2.0 - res) / res.y;
  p.y = -p.y;

  float yaw = iCamYaw, pitch = iCamPitch, dist = iCamDist;
  float3 fwd = float3(cos(yaw) * cos(pitch), sin(pitch), sin(yaw) * cos(pitch));
  float3 ro = iCamTarget - fwd * dist;
  float3 ww = normalize(iCamTarget - ro);
  float3 uu = normalize(cross(float3(0.0, 1.0, 0.0), ww));
  float3 vv = cross(ww, uu);
  float cr = cos(iCamRoll), sr = sin(iCamRoll);
  float3 uu2 = uu * cr + vv * sr;
  float3 vv2 = -uu * sr + vv * cr;
  float3 rd = normalize(p.x * uu2 + p.y * vv2 + 1.62 * ww);

#ifdef CUSTOM_SCENE
  float depth;
  float3 col = renderScene(ro, rd, depth);
  return float4(max(col, 0.0), depth);
#else
  float t = 0.02;
  float glow = 0.0;
  bool hit = false;
  [loop]
  for (int i = 0; i < MARCH_STEPS; i++) {
    float3 pos = ro + rd * t;
    float d = mapD(pos);
    glow += exp(-max(d, 0.0) * 7.0) * 0.030;
    if (d < 0.0012 * t) { hit = true; break; }
    t += d * 0.9;
    if (t > 34.0) break;
  }
  glow = min(glow, 2.2);

  float3 col;
  float depth = 80.0;
  if (hit) {
    float3 pos = ro + rd * t;
    Hit m = sceneMap(pos);
    float3 n = calcNormal(pos);
    depth = t;

    bool isGlass = false;
#ifdef ENABLE_GLASS
    isGlass = (m.metal < -0.5);
#endif
    if (isGlass) {
#ifdef ENABLE_GLASS
      col = traceGlass(pos, rd, n, m.albedo);
      float3 hlf2 = normalize(sunDir() - rd);
      col += sunColor() * pow(saturate(dot(n, hlf2)), 2400.0) * 3.5;
#else
      col = float3(0,0,0);
#endif
    } else {
      col = shadePoint(pos, rd, m, n, true);
      float fres = pow(saturate(1.0 + dot(rd, n)), 5.0);
      float reflAmt = (0.03 + 0.97 * fres) * lerp(0.04, 1.0, saturate(m.metal)) * (1.0 - m.rough * 0.75);
      if (iReflect > 0.5 && reflAmt > 0.02) {
        float3 r = reflect(rd, n);
        float3 reflCol;
        if (SCENE_ID == 0) {
          reflCol = lerp(traceReflection(pos + n * 0.02, r), envSpec(r, m.rough), m.rough * 0.6);
        } else {
          reflCol = envSpec(r, m.rough);
        }
        col = lerp(col, reflCol, saturate(reflAmt));
      }
      float3 hlf = normalize(sunDir() - rd);
      float glint = pow(saturate(dot(n, hlf)), 3000.0) * (1.0 - m.rough);
      col += sunColor() * glint * 4.0;
    }

    float fogK = (SCENE_ID == 0) ? 0.024 : (SCENE_ID == 4) ? 0.030 : 0.038;
    float fog = (1.0 - exp(-t * fogK)) * iFog;
    col = lerp(col, skyColor(rd), fog);
  } else {
    col = skyColor(rd);
  }

  float sunAmt = saturate(dot(rd, sunDir()));
  float3 godTint = (SCENE_ID == 1) ? float3(0.06, 0.40, 0.42) :
                   (SCENE_ID == 2) ? float3(0.40, 0.16, 0.42) :
                   (SCENE_ID == 7) ? float3(0.34, 0.14, 0.46) :
                   (SCENE_ID == 8) ? float3(0.50, 0.10, 0.50) :
                   (SCENE_ID == 4) ? float3(0.30, 0.40, 0.58) :
                                     float3(0.60, 0.42, 0.26);
  float3 vol = godTint * glow * (0.05 + 0.30 * pow(sunAmt, 3.0)) * iGodrays;
  col += vol;

  return float4(max(col, 0.0), depth);
#endif
}
`;

/** Build a complete per-scene marcher: JIT #defines + header + that scene's SDF + shared engine. */
export interface MarchDefines {
  marchSteps: number;
  fractalIters: number;
  palette: number;
}
export function buildMarchSource(sdf: string, d: MarchDefines): string {
  const defs = `#define MARCH_STEPS ${d.marchSteps}\n#define FRACTAL_ITERS ${d.fractalIters}\n#define PALETTE ${d.palette}\n`;
  return `${defs}${ENGINE_HEADER}\n${sdf}\n${ENGINE_BODY}`;
}

// ── Compute: Gray-Scott reaction-diffusion into a structured buffer (float2 = U,V) ─
export const CS_SIM_SOURCE = `
StructuredBuffer<float2> Prev : register(t0);
RWStructuredBuffer<float2> Next : register(u0);
cbuffer Sim : register(b0) { uint iSimW; uint iFrame; float iFeed; float iKill; };

float2 cellAt(int x, int y) {
  int W = (int)iSimW;
  x = (x % W + W) % W; y = (y % W + W) % W;
  return Prev[y * W + x];
}
[numthreads(16, 16, 1)]
void main(uint3 id : SV_DispatchThreadID) {
  int W = (int)iSimW;
  if ((int)id.x >= W || (int)id.y >= W) return;
  int x = (int)id.x, y = (int)id.y;
  uint idx = (uint)(y * W + x);
  if (iFrame == 0u) {
    float2 s = float2(1.0, 0.0);
    float2 c = float2((float)(x - W / 2), (float)(y - W / 2));
    if (length(c) < 14.0) s.y = 0.65;
    if (length(c - float2(46.0, 34.0)) < 9.0) s.y = 0.65;
    if (length(c + float2(54.0, -22.0)) < 9.0) s.y = 0.65;
    if (length(c - float2(-30.0, 60.0)) < 7.0) s.y = 0.65;
    Next[idx] = s;
    return;
  }
  float2 c = cellAt(x, y);
  float2 lap = 0.2 * (cellAt(x - 1, y) + cellAt(x + 1, y) + cellAt(x, y - 1) + cellAt(x, y + 1))
             + 0.05 * (cellAt(x - 1, y - 1) + cellAt(x + 1, y - 1) + cellAt(x - 1, y + 1) + cellAt(x + 1, y + 1))
             - c;
  float u = c.x, v = c.y;
  float uvv = u * v * v;
  float du = 0.16 * lap.x - uvv + iFeed * (1.0 - u);
  float dv = 0.08 * lap.y + uvv - (iFeed + iKill) * v;
  float2 nx = c + float2(du, dv);
  Next[idx] = clamp(nx, 0.0, 1.0);
}
`;

// ── PASS B: spiral bright-pass bloom of lerp(hdrA, hdrB, blend) ─────────────────
export const PS_BLOOM_SOURCE = `
cbuffer Post : register(b0) {
  float2 iResolution; float iTime; float iBlend;
  float iExposure; float iBloom; float iVignette; float iGrain;
  float iAberration; float iDof; float iFocus; float iFlare;
  float iMotionBlur; float iAccum; float2 iCamVel;
  float2 iJitter; float iSaturation; float iPad;
};
Texture2D SrcA : register(t0);
Texture2D SrcB : register(t1);
SamplerState Smp : register(s0);

float3 brightPass(float3 c) {
  float lum = dot(c, float3(0.299, 0.587, 0.114));
  float soft = max(lum - 0.9, 0.0);
  float w = soft / (lum + 1e-3);
  return c * w;
}
float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 res = max(iResolution, float2(1.0, 1.0));
  float2 px = 1.0 / res;
  float3 bloom = float3(0,0,0);
  float total = 0.0;
  [unroll]
  for (int i = 0; i < 48; i++) {
    float a = float(i) * 2.39996323;
    float r = 1.0 + pow(float(i) / 47.0, 0.7) * 64.0;
    float2 off = float2(cos(a), sin(a)) * r * px;
    float3 sa = SrcA.Sample(Smp, uv + off).rgb;
    float3 sb = SrcB.Sample(Smp, uv + off).rgb;
    float3 s = lerp(sa, sb, iBlend);
    float w = 1.0 / (1.0 + r * 0.10);
    bloom += brightPass(s) * w;
    total += w;
  }
  bloom /= max(total, 1e-3);
  return float4(bloom, 1.0);
}
`;

// ── PASS C: DOF + aberration + flare + motion blur + tonemap + grade ───────────
const POST_CB = `
cbuffer Post : register(b0) {
  float2 iResolution; float iTime; float iBlend;
  float iExposure; float iBloom; float iVignette; float iGrain;
  float iAberration; float iDof; float iFocus; float iFlare;
  float iMotionBlur; float iAccum; float2 iCamVel;
  float2 iJitter; float iSaturation; float iPad;
};`;

const PS_POST_BODY = `
Texture2D SceneA : register(t0);
Texture2D SceneB : register(t1);
Texture2D Bloom : register(t2);
SamplerState Smp : register(s0);

float hash21(float2 p) { p = frac(p * float2(123.34, 456.21)); p += dot(p, p + 45.32); return frac(p.x * p.y); }

float3 linToSrgb(float3 c) {
  c = saturate(c);
  return lerp(c * 12.92, 1.055 * pow(c, 1.0 / 2.4) - 0.055, step(0.0031308, c));
}

// ACES filmic (Narkowicz/Hill fit) with the RRT input matrix.
static const float3x3 ACESIn = float3x3(
  0.59719, 0.35458, 0.04823,
  0.07600, 0.90834, 0.01566,
  0.02840, 0.13383, 0.83777);
static const float3x3 ACESOut = float3x3(
   1.60475, -0.53108, -0.07367,
  -0.10208,  1.10813, -0.00605,
  -0.00327, -0.07276,  1.07602);
float3 RRTODT(float3 v) { float3 a = v * (v + 0.0245786) - 0.000090537; float3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
float3 acesFitted(float3 c) { c = mul(ACESIn, c); c = RRTODT(c); c = mul(ACESOut, c); return saturate(c); }

// AgX approximation (compact, dot-product inset to dodge matrix-layout traps).
float3 agxContrast(float3 x) {
  float3 x2 = x * x; float3 x4 = x2 * x2;
  return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232;
}
float3 agx(float3 v) {
  float3 ax;
  ax.x = dot(v, float3(0.842479, 0.078434, 0.079224));
  ax.y = dot(v, float3(0.042328, 0.878469, 0.079166));
  ax.z = dot(v, float3(0.042376, 0.078434, 0.879143));
  ax = clamp(log2(max(ax, 1e-10)), -12.47393, 4.026069);
  ax = (ax + 12.47393) / (4.026069 + 12.47393);
  return saturate(agxContrast(ax));
}

float3 tonemap(float3 c) {
#if TONEMAP == 0
  return linToSrgb(acesFitted(c));
#elif TONEMAP == 1
  return agx(c);
#else
  return linToSrgb(c / (c + 1.0));
#endif
}

float3 sampleHDR(float2 uv) { return lerp(SceneA.Sample(Smp, uv).rgb, SceneB.Sample(Smp, uv).rgb, iBlend); }
float sampleDepth(float2 uv) { return lerp(SceneA.Sample(Smp, uv).a, SceneB.Sample(Smp, uv).a, iBlend); }

float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 res = max(iResolution, float2(1.0, 1.0));
  float2 px = 1.0 / res;
  float2 dc = uv - 0.5;

  // Depth-of-field circle of confusion (focus = camera->subject distance).
  float depth = sampleDepth(uv);
  float coc = saturate(abs(depth - iFocus) / max(iFocus, 1.0)) * iDof;
  float maxR = 17.0 * coc;

  // Bokeh gather with per-channel chromatic aberration baked into the offsets.
  float3 col = float3(0,0,0);
  float wsum = 0.0;
  float2 caDir = dc * (iAberration * 0.012);
  [loop]
  for (int i = 0; i < 28; i++) {
    float a = float(i) * 2.39996323;
    float rr = sqrt((float(i) + 0.5) / 28.0);
    float2 off = float2(cos(a), sin(a)) * rr * maxR * px;
    float2 suv = uv + off;
    float3 s;
    s.r = sampleHDR(suv + caDir).r;
    s.g = sampleHDR(suv).g;
    s.b = sampleHDR(suv - caDir).b;
    float w = 1.0;
    col += s * w;
    wsum += w;
  }
  col /= max(wsum, 1e-3);

  // Directional motion blur from camera velocity (a few taps).
  if (iMotionBlur > 0.001) {
    float3 mb = float3(0,0,0);
    [unroll]
    for (int k = -4; k <= 4; k++) {
      float2 o = iCamVel * (float(k) / 4.0) * 0.5;
      mb += sampleHDR(uv + o);
    }
    col = lerp(col, mb / 9.0, saturate(iMotionBlur));
  }

  // Bloom halo.
  float3 bloom = Bloom.Sample(Smp, uv).rgb;
  col += bloom * iBloom * 0.42;

  // Anamorphic lens flare: mirrored ghosts + a horizontal streak from bright spots.
  if (iFlare > 0.001) {
    float3 flare = float3(0,0,0);
    float2 ghostVec = (0.5 - uv);
    [unroll]
    for (int gi = 1; gi <= 4; gi++) {
      float2 guv = uv + ghostVec * (float(gi) * 0.32);
      float3 gb = Bloom.Sample(Smp, guv).rgb;
      float3 tint = lerp(float3(0.4, 0.7, 1.0), float3(1.0, 0.5, 0.3), float(gi) / 4.0);
      flare += gb * tint * (0.5 / float(gi));
    }
    float3 streak = float3(0,0,0);
    [unroll]
    for (int sx = -6; sx <= 6; sx++) {
      streak += Bloom.Sample(Smp, uv + float2(float(sx) * 6.0 * px.x, 0.0)).rgb;
    }
    flare += streak / 13.0 * float3(0.4, 0.6, 1.0) * 0.5;
    col += flare * iFlare;
  }

  // Exposure breathing + tonemap.
  float exposure = iExposure * (1.0 + 0.03 * sin(iTime * 0.30));
  col = tonemap(col * exposure);

  // Film grade: cool shadows, warm highlights; saturation.
  float lum = dot(col, float3(0.299, 0.587, 0.114));
  col = lerp(col * float3(0.96, 0.99, 1.06), col * float3(1.05, 1.0, 0.93), smoothstep(0.2, 0.85, lum));
  col = lerp(float3(lum, lum, lum), col, iSaturation);

  // Vignette.
  float2 q = fragPos.xy / res;
  float vig = pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.30);
  col *= lerp(1.0, lerp(0.55, 1.04, vig), iVignette);

  // Dithered grain.
  float g = hash21(fragPos.xy + frac(iTime) * 91.7) - 0.5;
  col += g * 0.018 * iGrain;

  return float4(saturate(col), 1.0);
}
`;

/** Build the post-composite pixel shader with the chosen tonemap operator (JIT). */
export function buildPostSource(tonemapOp: number): string {
  return `#define TONEMAP ${tonemapOp}\n${POST_CB}\n${PS_POST_BODY}`;
}

// ── PRESENT: temporal-accumulation MRT pass (back buffer + history) ─────────────
export const PS_PRESENT_SOURCE = `
${POST_CB}
Texture2D Comp : register(t0);
Texture2D Hist : register(t1);
SamplerState Smp : register(s0);
struct MRT { float4 back : SV_Target0; float4 hist : SV_Target1; };
MRT main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) {
  float3 c = Comp.Sample(Smp, uv).rgb;
  float3 h = Hist.Sample(Smp, uv).rgb;
  float3 o = lerp(c, h, iAccum);
  MRT m;
  m.back = float4(o, 1.0);
  m.hist = float4(o, 1.0);
  return m;
}
`;

// ── Window sizing — a borderless ~16:9 window (NOT full-screen) ────────────────
const screenW = User32.GetSystemMetrics(0) || 1920;
const screenH = User32.GetSystemMetrics(1) || 1080;
const WIN_H = Math.min(1000, Math.floor(screenH * 0.74));
const WIN_W = Math.min(Math.floor(screenW * 0.9), Math.round((WIN_H * 16) / 9));

const SELFSHOT = process.env.SELFSHOT === '1';
const SELFSHOT_PATH = process.env.SELFSHOT_PATH || 'D:/Projects/bun-win32/packages/all/screenshots/shader-forge.png';

const SIM_W = 256;

function comReleaseSafe(ptr: bigint | undefined): void {
  if (ptr !== undefined && ptr !== 0n) gpu.comRelease(ptr);
}

// ── Virtual-key codes for the control scheme ───────────────────────────────────
const VK = {
  SPACE: 0x20,
  TAB: 0x09,
  A: 0x41,
  B: 0x42,
  C: 0x43,
  D: 0x44,
  E: 0x45,
  F: 0x46,
  G: 0x47,
  I: 0x49,
  J: 0x4a,
  K: 0x4b,
  M: 0x4d,
  O: 0x4f,
  P: 0x50,
  Q: 0x51,
  R: 0x52,
  S: 0x53,
  T: 0x54,
  V: 0x56,
  W: 0x57,
  X: 0x58,
  Z: 0x5a,
  LBRACKET: 0xdb,
  RBRACKET: 0xdd,
  MINUS: 0xbd,
  EQUALS: 0xbb,
  COMMA: 0xbc,
  PERIOD: 0xbe,
  D0: 0x30,
  D1: 0x31,
  D2: 0x32,
  D3: 0x33,
  D4: 0x34,
  D5: 0x35,
  D6: 0x36,
  D7: 0x37,
  D8: 0x38,
  D9: 0x39,
} as const;

const QUALITY_STEPS = [96, 160, 256] as const;
const ITER_STEPS = [6, 10, 14] as const;
const TONEMAP_NAMES = ['ACES', 'AgX', 'REINHARD'] as const;

function main(): void {
  const win = gpu.createWindow({ title: 'Shader Forge II — interactive runtime-HLSL ray-marcher', width: WIN_W, height: WIN_H, borderless: true });
  const { w: cw, h: ch } = win.clientSize();
  const g = gpu.createDevice(win.hwnd, { width: cw, height: ch });

  // ── Live render state (driven by the controls) ──────────────────────────────
  const state = {
    quality: 1, // index into QUALITY_STEPS
    iters: 1, // index into ITER_STEPS
    palette: 0,
    tonemap: 0,
    exposure: 1.05,
    bloom: 1.0,
    godrays: 1.0,
    fog: 1.0,
    ao: 1.0,
    reflect: 1.0,
    dof: 0.42,
    aberration: 1.0,
    motionBlur: 0.0,
    vignette: 1.0,
    grain: 1.0,
    saturation: 1.12,
    flare: 0.7,
  };

  // ── Camera state (manual) ───────────────────────────────────────────────────
  const cam = { yaw: 0.0, pitch: 0.18, dist: 5.4, tx: 0.0, ty: 0.0, tz: 0.0, roll: 0.0 };
  let cinematic = true;
  let paused = false;
  let showHud = true;
  let photoMode = false;
  let photoFrames = 0;

  // Per-scene camera framing for manual / SCENE-pinned mode (cinematic mode overrides this).
  const FRAMING: ReadonlyArray<{ yaw: number; pitch: number; dist: number; ty: number; roll: number }> = [
    { yaw: 0.6, pitch: 0.16, dist: 5.6, ty: 0.15, roll: 0 }, // 0 chrome
    { yaw: 0.4, pitch: 0.1, dist: 5.6, ty: -0.2, roll: 0 }, // 1 reef
    { yaw: 0.7, pitch: 0.18, dist: 4.6, ty: 0.0, roll: 0 }, // 2 apollonian
    { yaw: 0.5, pitch: 0.2, dist: 4.8, ty: 0.0, roll: 0 }, // 3 mandelbox
    { yaw: 0.3, pitch: -0.04, dist: 6.6, ty: 0.7, roll: 0 }, // 4 sea
    { yaw: 0.8, pitch: 0.16, dist: 4.2, ty: 0.1, roll: 0 }, // 5 glass
    { yaw: 1.1, pitch: 0.12, dist: 5.2, ty: 0.9, roll: 0 }, // 6 clouds
    { yaw: 0.6, pitch: 0.2, dist: 4.0, ty: 0.0, roll: 0 }, // 7 julia
    { yaw: 0.1, pitch: 0.06, dist: 6.2, ty: 1.0, roll: 0.05 }, // 8 synthwave
    { yaw: 0.7, pitch: 0.16, dist: 4.6, ty: 0.0, roll: 0 }, // 9 membrane
  ];
  function frameScene(idx: number): void {
    const f = FRAMING[idx] ?? FRAMING[0]!;
    cam.yaw = f.yaw;
    cam.pitch = f.pitch;
    cam.dist = f.dist;
    cam.tx = 0;
    cam.ty = f.ty;
    cam.tz = 0;
    cam.roll = f.roll;
  }

  // ── Compile every stage at runtime (timed for the HUD) ──────────────────────
  let vs = 0n;
  const sceneShaders: bigint[] = new Array(SCENE_SDFS.length).fill(0n);
  const warmupQueue: number[] = []; // scenes to JIT-compile in the background after launch
  const sceneSig: string[] = new Array(SCENE_SDFS.length).fill('');
  let psBloom = 0n;
  let psPost = 0n;
  let psPresent = 0n;
  let simCs = 0n;
  let compileMs = 0;
  let lastJitMs = 0;

  function defines(): MarchDefines {
    return { marchSteps: QUALITY_STEPS[state.quality]!, fractalIters: ITER_STEPS[state.iters]!, palette: state.palette };
  }
  function sigOf(d: MarchDefines): string {
    return `${d.marchSteps}|${d.fractalIters}|${d.palette}`;
  }

  /** Compile (or recompile) one scene's marcher to match the current JIT defines. */
  function ensureScene(idx: number): void {
    const d = defines();
    const sig = sigOf(d);
    if (sceneShaders[idx] !== 0n && sceneSig[idx] === sig) return;
    const t0 = performance.now();
    const code = gpu.compile(buildMarchSource(SCENE_SDFS[idx]!, d), 'main', 'ps_5_0');
    const shader = gpu.makePixelShader(code);
    gpu.blobRelease(code.blob);
    comReleaseSafe(sceneShaders[idx]);
    sceneShaders[idx] = shader;
    sceneSig[idx] = sig;
    lastJitMs = performance.now() - t0;
  }
  /** Recompile the post shader to match the chosen tonemap operator (JIT). */
  function ensurePost(): void {
    const code = gpu.compile(buildPostSource(state.tonemap), 'main', 'ps_5_0');
    const shader = gpu.makePixelShader(code);
    gpu.blobRelease(code.blob);
    comReleaseSafe(psPost);
    psPost = shader;
  }
  /** Mark every scene shader stale so the next time each is shown it recompiles. */
  function invalidateAllScenes(): void {
    for (let i = 0; i < sceneSig.length; i += 1) sceneSig[i] = '';
  }

  try {
    const t0 = performance.now();
    const vsCode = gpu.compile(VS_SOURCE, 'main', 'vs_5_0');
    vs = gpu.makeVertexShader(vsCode);
    gpu.blobRelease(vsCode.blob);

    const forceScene = process.env.SCENE !== undefined ? Number(process.env.SCENE) % SCENE_SDFS.length : -1;
    // Compile only the starting scene up front (instant launch), then warm up the rest in the
    // background during scene 0's hold — so the first cross-fade is already smooth and there is
    // no black "compiling…" window at launch.
    const startScene = forceScene >= 0 ? forceScene : 0;
    ensureScene(startScene);
    if (forceScene < 0) for (let i = 0; i < SCENE_SDFS.length; i += 1) if (i !== startScene) warmupQueue.push(i);

    const bloomCode = gpu.compile(PS_BLOOM_SOURCE, 'main', 'ps_5_0');
    psBloom = gpu.makePixelShader(bloomCode);
    gpu.blobRelease(bloomCode.blob);
    ensurePost();
    const presentCode = gpu.compile(PS_PRESENT_SOURCE, 'main', 'ps_5_0');
    psPresent = gpu.makePixelShader(presentCode);
    gpu.blobRelease(presentCode.blob);
    const csCode = gpu.compile(CS_SIM_SOURCE, 'main', 'cs_5_0');
    simCs = gpu.makeComputeShader(csCode);
    gpu.blobRelease(csCode.blob);
    compileMs = performance.now() - t0;
  } catch (err) {
    console.error(String((err as Error).message));
    process.exit(1);
  }

  // ── HDR intermediates ───────────────────────────────────────────────────────
  const F16 = gpu.DXGI_FORMAT_R16G16B16A16_FLOAT;
  const hdrA = gpu.makeTexture({ w: cw, h: ch, format: F16, rtv: true, srv: true });
  const hdrB = gpu.makeTexture({ w: cw, h: ch, format: F16, rtv: true, srv: true });
  const bloomTex = gpu.makeTexture({ w: cw, h: ch, format: F16, rtv: true, srv: true });
  const compTex = gpu.makeTexture({ w: cw, h: ch, format: F16, rtv: true, srv: true });
  let histPrev = gpu.makeTexture({ w: cw, h: ch, format: F16, rtv: true, srv: true });
  let histCurr = gpu.makeTexture({ w: cw, h: ch, format: F16, rtv: true, srv: true });
  // Clear the accumulation history so a first-frame frozen read can't sample garbage/NaN.
  gpu.setRenderTargets([histPrev.rtv!]);
  gpu.clear(histPrev.rtv!, [0, 0, 0, 1]);
  gpu.setRenderTargets([histCurr.rtv!]);
  gpu.clear(histCurr.rtv!, [0, 0, 0, 1]);
  gpu.setRenderTargets([]);
  const samp = gpu.makeSampler({ filter: gpu.D3D11_FILTER_MIN_MAG_MIP_LINEAR, address: gpu.D3D11_TEXTURE_ADDRESS_CLAMP });

  // ── Reaction-diffusion ping-pong buffers (float2 per cell) ──────────────────
  let simPrev = gpu.makeStructuredBuffer({ stride: 8, count: SIM_W * SIM_W, uav: true, srv: true });
  let simNext = gpu.makeStructuredBuffer({ stride: 8, count: SIM_W * SIM_W, uav: true, srv: true });
  let simFrame = 0;

  // ── Constant buffers ────────────────────────────────────────────────────────
  const cbFrame = gpu.makeConstantBuffer(80);
  const cbPost = gpu.makeConstantBuffer(80);
  const cbSim = gpu.makeConstantBuffer(16);
  const cbFrameData = Buffer.alloc(80);
  const cbPostData = Buffer.alloc(80);
  const cbSimData = Buffer.alloc(16);

  const hudFont = GDI32.CreateFontW(-21, 0, 0, 0, 700, 0, 0, 0, 0, 0, 0, 4, 0, encode('Consolas').ptr!);
  const hudFontSmall = GDI32.CreateFontW(-14, 0, 0, 0, 500, 0, 0, 0, 0, 0, 0, 4, 0, encode('Consolas').ptr!);

  console.log('Shader Forge II — interactive, JIT-recompiling cinematic HLSL ray-marcher on the GPU.');
  console.log(`  booted in ${compileMs.toFixed(0)} ms · ${SCENE_SDFS.length + 4} HLSL shaders JIT-compiled at runtime (rest warm up live) · ${g.driver} · ${g.gpuName}`);
  console.log(`  ${SCENES.length} SDF scenes · drag to orbit · C cinematic · Tab console · ESC to exit.`);

  const startTime = performance.now();
  const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
  const forceScene = process.env.SCENE !== undefined ? Number(process.env.SCENE) % SCENES.length : -1;
  if (forceScene >= 0) cinematic = false;

  let manualScene = forceScene >= 0 ? forceScene : 0;
  frameScene(manualScene);
  let worldTime = 0;
  let frames = 0;
  let totalFrames = 0;
  let fps = 0;
  let fpsWindowStart = startTime;
  let selfshotDone = false;
  let lastNow = startTime;

  // Input edge detection.
  const prevDown = new Set<number>();
  const watchVks = Object.values(VK);
  let prevMouseX = 0;
  let prevMouseY = 0;
  let prevDragging = false;
  let prevYaw = cam.yaw;
  let prevPitch = cam.pitch;

  function pressed(curDown: Set<number>, vk: number): boolean {
    return curDown.has(vk) && !prevDown.has(vk);
  }

  function writeFrameCb(yaw: number, pitch: number, dist: number, roll: number, tx: number, ty: number, tz: number, elapsed: number): void {
    cbFrameData.writeFloatLE(cw, 0);
    cbFrameData.writeFloatLE(ch, 4);
    cbFrameData.writeFloatLE(elapsed, 8);
    cbFrameData.writeFloatLE(0, 12);
    cbFrameData.writeFloatLE(yaw, 16);
    cbFrameData.writeFloatLE(pitch, 20);
    cbFrameData.writeFloatLE(dist, 24);
    cbFrameData.writeFloatLE(roll, 28);
    cbFrameData.writeFloatLE(tx, 32);
    cbFrameData.writeFloatLE(ty, 36);
    cbFrameData.writeFloatLE(tz, 40);
    cbFrameData.writeFloatLE(QUALITY_STEPS[state.quality]!, 44);
    cbFrameData.writeFloatLE(state.ao, 48);
    cbFrameData.writeFloatLE(state.reflect, 52);
    cbFrameData.writeFloatLE(state.fog, 56);
    cbFrameData.writeFloatLE(state.godrays, 60);
    cbFrameData.writeFloatLE(1.0, 64); // iEmissive
    cbFrameData.writeFloatLE(1.0, 68); // iShadow
    cbFrameData.writeFloatLE(0.0, 72); // iWarp
    cbFrameData.writeFloatLE(0.0, 76);
    gpu.updateConstantBuffer(cbFrame, cbFrameData);
  }

  function writePostCb(blend: number, elapsed: number, focus: number, accum: number, velX: number, velY: number): void {
    cbPostData.writeFloatLE(cw, 0);
    cbPostData.writeFloatLE(ch, 4);
    cbPostData.writeFloatLE(elapsed, 8);
    cbPostData.writeFloatLE(blend, 12);
    cbPostData.writeFloatLE(state.exposure, 16);
    cbPostData.writeFloatLE(state.bloom, 20);
    cbPostData.writeFloatLE(state.vignette, 24);
    cbPostData.writeFloatLE(state.grain, 28);
    cbPostData.writeFloatLE(state.aberration, 32);
    cbPostData.writeFloatLE(state.dof, 36);
    cbPostData.writeFloatLE(focus, 40);
    cbPostData.writeFloatLE(state.flare, 44);
    cbPostData.writeFloatLE(state.motionBlur, 48);
    cbPostData.writeFloatLE(accum, 52);
    cbPostData.writeFloatLE(velX, 56);
    cbPostData.writeFloatLE(velY, 60);
    cbPostData.writeFloatLE(0, 64); // iJitter.x
    cbPostData.writeFloatLE(0, 68); // iJitter.y
    cbPostData.writeFloatLE(state.saturation, 72);
    cbPostData.writeFloatLE(0, 76);
    gpu.updateConstantBuffer(cbPost, cbPostData);
  }

  function stepSim(steps: number): void {
    for (let i = 0; i < steps; i += 1) {
      cbSimData.writeUInt32LE(SIM_W, 0);
      cbSimData.writeUInt32LE(simFrame, 4);
      cbSimData.writeFloatLE(0.037, 8); // feed
      cbSimData.writeFloatLE(0.061, 12); // kill
      gpu.updateConstantBuffer(cbSim, cbSimData);
      gpu.csSet(simCs, { cb: [cbSim], uav: [simNext.uav!], srv: [simPrev.srv!] });
      gpu.dispatch(SIM_W / 16, SIM_W / 16, 1);
      gpu.csSet(simCs, { uav: [0n], srv: [0n] });
      const t = simPrev;
      simPrev = simNext;
      simNext = t;
      simFrame += 1;
    }
  }

  function drawHud(sceneIdx: number, activeIdx: number): void {
    const active = SCENES[activeIdx]!;
    const title = `${String(activeIdx + 1).padStart(2, '0')}  ${active.name}`;
    const titleBuf = encode(title);
    const sub = `${cinematic ? 'CINEMATIC' : 'FREE-CAM'}${paused ? ' · PAUSED' : ''}  ·  ${fps} fps  ·  q${QUALITY_STEPS[state.quality]} ${TONEMAP_NAMES[state.tonemap]}  ·  JIT ${lastJitMs.toFixed(0)}ms  ·  ${g.gpuName}`;
    const subBuf = encode(sub);
    const lines = showHud
      ? [
          'drag orbit · wheel/Z X dolly · WASD/QE fly · Space pause',
          '[ ] prev/next · 1-0 jump · C cinematic · Tab console',
          `B bloom:${onoff(state.bloom)} G rays:${onoff(state.godrays)} F fog:${onoff(state.fog)} V ao:${onoff(state.ao)} R refl:${onoff(state.reflect)}`,
          `- = exp:${state.exposure.toFixed(2)} · , . steps(JIT) · T tone(JIT) · I iters:${ITER_STEPS[state.iters]} · J palette:${state.palette}`,
          `O dof:${state.dof.toFixed(1)} K aberr:${onoff(state.aberration)} M blur:${onoff(state.motionBlur)} · P photo`,
        ]
      : [];
    hud.draw(g, cw, ch, (dc) => {
      GDI32.SetBkMode(dc, TRANSPARENT_BK);
      GDI32.SelectObject(dc, hudFont);
      GDI32.SetTextColor(dc, 0x00000000);
      GDI32.TextOutW(dc, 27, ch - 100, titleBuf.ptr!, title.length);
      GDI32.SetTextColor(dc, active.accent);
      GDI32.TextOutW(dc, 25, ch - 102, titleBuf.ptr!, title.length);
      GDI32.SelectObject(dc, hudFontSmall);
      GDI32.SetTextColor(dc, 0x00000000);
      GDI32.TextOutW(dc, 27, ch - 70, subBuf.ptr!, sub.length);
      GDI32.SetTextColor(dc, 0x00c8c0b0);
      GDI32.TextOutW(dc, 25, ch - 72, subBuf.ptr!, sub.length);
      for (let i = 0; i < lines.length; i += 1) {
        const lb = encode(lines[i]!);
        GDI32.SetTextColor(dc, 0x00000000);
        GDI32.TextOutW(dc, 27, 22 + i * 22, lb.ptr!, lines[i]!.length);
        GDI32.SetTextColor(dc, 0x0090d0e0);
        GDI32.TextOutW(dc, 25, 20 + i * 22, lb.ptr!, lines[i]!.length);
      }
    });
  }

  function onoff(v: number): string {
    return v > 0.5 ? 'on' : 'off';
  }

  // ── Process input; returns whether the camera moved and whether the rendered
  // image otherwise changed (either resets temporal accumulation). ────────────
  function handleInput(dt: number): { moved: boolean; dirty: boolean } {
    const curDown = new Set<number>();
    for (const vk of watchVks) if (win.keyDown(vk)) curDown.add(vk);

    let moved = false;
    let dirty = false; // a non-camera visual change (scene/FX/JIT) this frame
    const grab = (): void => {
      if (cinematic) {
        cinematic = false;
      }
    };

    // Mouse orbit.
    const m = win.getMouse();
    if (m.down) {
      if (prevDragging) {
        const dx = m.x - prevMouseX;
        const dy = m.y - prevMouseY;
        if (dx !== 0 || dy !== 0) {
          grab();
          cam.yaw += dx * 0.006;
          cam.pitch = Math.max(-1.5, Math.min(1.5, cam.pitch - dy * 0.006));
          moved = true;
        }
      }
      prevDragging = true;
    } else {
      prevDragging = false;
    }
    prevMouseX = m.x;
    prevMouseY = m.y;

    // Wheel / Z X dolly.
    const wheel = win.getWheel();
    if (wheel !== 0) {
      grab();
      cam.dist = Math.max(1.5, Math.min(20.0, cam.dist * Math.exp(-wheel * 0.12)));
      moved = true;
    }
    if (win.keyDown(VK.Z)) {
      grab();
      cam.dist = Math.max(1.5, cam.dist - 4.0 * dt);
      moved = true;
    }
    if (win.keyDown(VK.X)) {
      grab();
      cam.dist = Math.min(20.0, cam.dist + 4.0 * dt);
      moved = true;
    }

    // WASD / QE fly the target (in the camera's ground plane).
    const fwd = [Math.cos(cam.yaw), 0, Math.sin(cam.yaw)] as const;
    const right = [-Math.sin(cam.yaw), 0, Math.cos(cam.yaw)] as const;
    const sp = 2.4 * dt;
    let mvF = 0;
    let mvR = 0;
    let mvU = 0;
    if (win.keyDown(VK.W)) mvF += 1;
    if (win.keyDown(VK.S)) mvF -= 1;
    if (win.keyDown(VK.D)) mvR += 1;
    if (win.keyDown(VK.A)) mvR -= 1;
    if (win.keyDown(VK.E)) mvU += 1;
    if (win.keyDown(VK.Q)) mvU -= 1;
    if (mvF !== 0 || mvR !== 0 || mvU !== 0) {
      grab();
      cam.tx += (fwd[0] * mvF + right[0] * mvR) * sp;
      cam.tz += (fwd[2] * mvF + right[2] * mvR) * sp;
      cam.ty += mvU * sp;
      moved = true;
    }

    // Edge-triggered toggles.
    if (pressed(curDown, VK.C)) {
      cinematic = !cinematic;
    }
    if (pressed(curDown, VK.SPACE)) {
      paused = !paused;
    }
    if (pressed(curDown, VK.TAB)) {
      showHud = !showHud;
    }
    if (pressed(curDown, VK.B)) {
      state.bloom = state.bloom > 0.5 ? 0 : 1;
      dirty = true;
    }
    if (pressed(curDown, VK.G)) {
      state.godrays = state.godrays > 0.5 ? 0 : 1;
      dirty = true;
    }
    if (pressed(curDown, VK.F)) {
      state.fog = state.fog > 0.5 ? 0 : 1;
      dirty = true;
    }
    if (pressed(curDown, VK.V)) {
      state.ao = state.ao > 0.5 ? 0 : 1;
      dirty = true;
    } // A is the strafe key, so AO toggles on V
    if (pressed(curDown, VK.R)) {
      state.reflect = state.reflect > 0.5 ? 0 : 1;
      dirty = true;
    }
    if (pressed(curDown, VK.K)) {
      state.aberration = state.aberration > 0.5 ? 0 : 1;
      dirty = true;
    }
    if (pressed(curDown, VK.M)) {
      state.motionBlur = state.motionBlur > 0.5 ? 0 : 0.85;
      dirty = true;
    }
    if (pressed(curDown, VK.O)) {
      state.dof = state.dof > 0.05 ? 0 : 0.7;
      dirty = true;
    }
    if (pressed(curDown, VK.MINUS)) {
      state.exposure = Math.max(0.2, state.exposure - 0.08);
      dirty = true;
    }
    if (pressed(curDown, VK.EQUALS)) {
      state.exposure = Math.min(3.0, state.exposure + 0.08);
      dirty = true;
    }

    // JIT recompiles (each mutates the HLSL source and re-invokes D3DCompile).
    if (pressed(curDown, VK.PERIOD)) {
      state.quality = Math.min(QUALITY_STEPS.length - 1, state.quality + 1);
      invalidateAllScenes();
      dirty = true;
    }
    if (pressed(curDown, VK.COMMA)) {
      state.quality = Math.max(0, state.quality - 1);
      invalidateAllScenes();
      dirty = true;
    }
    if (pressed(curDown, VK.I)) {
      state.iters = (state.iters + 1) % ITER_STEPS.length;
      invalidateAllScenes();
      dirty = true;
    }
    if (pressed(curDown, VK.J)) {
      state.palette = (state.palette + 1) % 4;
      invalidateAllScenes();
      dirty = true;
    }
    if (pressed(curDown, VK.T)) {
      state.tonemap = (state.tonemap + 1) % 3;
      ensurePost();
      dirty = true;
    }

    // Photo mode (restore the HUD legend on exit, hide it on entry).
    if (pressed(curDown, VK.P)) {
      photoMode = !photoMode;
      photoFrames = 0;
      showHud = !photoMode;
    }

    // Scene selection (numbers + brackets).
    const numVks = [VK.D1, VK.D2, VK.D3, VK.D4, VK.D5, VK.D6, VK.D7, VK.D8, VK.D9, VK.D0];
    for (let i = 0; i < numVks.length; i += 1) {
      if (pressed(curDown, numVks[i]!)) {
        manualScene = i;
        cinematic = false;
        frameScene(i);
        dirty = true;
      }
    }
    if (pressed(curDown, VK.RBRACKET)) {
      manualScene = (manualScene + 1) % SCENES.length;
      cinematic = false;
      frameScene(manualScene);
      dirty = true;
    }
    if (pressed(curDown, VK.LBRACKET)) {
      manualScene = (manualScene + SCENES.length - 1) % SCENES.length;
      cinematic = false;
      frameScene(manualScene);
      dirty = true;
    }

    prevDown.clear();
    for (const vk of curDown) prevDown.add(vk);
    return { moved, dirty };
  }

  while (!win.shouldClose()) {
    win.pump();
    if (win.shouldClose()) break;

    const now = performance.now();
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;

    const { moved: cameraMoved, dirty: visualDirty } = handleInput(dt);
    // Temporal accumulation only denoises a FROZEN frame; while the world animates it
    // would smear. So advance world time unless paused or composing a photo.
    const frozen = paused || photoMode;
    if (!frozen) worldTime += dt;
    const elapsed = worldTime;

    // Advance the reaction-diffusion sim so the Living Membrane is alive (frozen when paused
    // or composing a photo, so a temporally-accumulated still doesn't ghost).
    if (!frozen) stepSim(6);

    // ── Scene scheduling ───────────────────────────────────────────────────────
    let sceneIdx: number;
    let nextIdx: number;
    let blend = 0;
    if (cinematic) {
      sceneIdx = Math.floor(elapsed / SCENE_CYCLE) % SCENES.length;
      nextIdx = (sceneIdx + 1) % SCENES.length;
      const cyclePos = elapsed % SCENE_CYCLE;
      if (cyclePos > SCENE_HOLD) {
        const f = (cyclePos - SCENE_HOLD) / SCENE_FADE;
        blend = f * f * (3 - 2 * f);
      }
      manualScene = sceneIdx;
    } else {
      sceneIdx = manualScene;
      nextIdx = manualScene;
      blend = 0;
    }
    const activeIdx = blend > 0.5 ? nextIdx : sceneIdx;

    ensureScene(sceneIdx);
    if (blend > 0.001) ensureScene(nextIdx);

    // ── Camera: cinematic drift mirrors into the manual cam so a grab is seamless ─
    let yaw: number;
    let pitch: number;
    let dist: number;
    let tx: number;
    let ty: number;
    let tz: number;
    let roll: number;
    if (cinematic) {
      yaw = elapsed * 0.14 + sceneIdx * 1.7;
      pitch = sceneIdx === 4 || sceneIdx === 6 ? -0.02 + 0.05 * Math.sin(elapsed * 0.19) : 0.18 + 0.12 * Math.sin(elapsed * 0.21);
      dist = sceneIdx === 4 ? 6.2 + 0.5 * Math.sin(elapsed * 0.13) : 5.4 + 0.6 * Math.sin(elapsed * 0.13);
      tx = 0;
      ty = sceneIdx === 1 ? -0.2 : sceneIdx === 4 ? 0.65 : sceneIdx === 6 ? 0.5 : 0.0;
      tz = 0;
      roll = sceneIdx === 8 ? 0.06 * Math.sin(elapsed * 0.1) : 0.0;
      cam.yaw = yaw;
      cam.pitch = pitch;
      cam.dist = dist;
      cam.tx = tx;
      cam.ty = ty;
      cam.tz = tz;
      cam.roll = roll;
    } else {
      yaw = cam.yaw;
      pitch = cam.pitch;
      dist = cam.dist;
      tx = cam.tx;
      ty = cam.ty;
      tz = cam.tz;
      roll = cam.roll;
    }

    // Screen-space camera velocity (for motion blur), from yaw/pitch deltas. Clamped so the
    // discrete yaw step at a cinematic scene boundary doesn't smear the transition frame.
    const velX = Math.max(-0.25, Math.min(0.25, (yaw - prevYaw) * 0.9));
    const velY = Math.max(-0.25, Math.min(0.25, (pitch - prevPitch) * 0.9));
    prevYaw = yaw;
    prevPitch = pitch;

    // ── PASS A1 — march the active scene into hdrA ─────────────────────────────
    writeFrameCb(yaw, pitch, dist, roll, tx, ty, tz, elapsed);
    gpu.setRenderTargets([hdrA.rtv!]);
    gpu.setViewport(cw, ch);
    gpu.clear(hdrA.rtv!, [0, 0, 0, 80]);
    gpu.vsSet(vs);
    if (sceneIdx === 9) gpu.psSet(sceneShaders[sceneIdx]!, { cb: [cbFrame], srv: [simPrev.srv!], samp: [samp] });
    else gpu.psSet(sceneShaders[sceneIdx]!, { cb: [cbFrame] });
    gpu.drawFullscreenTriangle();
    if (sceneIdx === 9) gpu.psSet(sceneShaders[sceneIdx]!, { srv: [0n] });
    gpu.setRenderTargets([]);

    // ── PASS A2 — during a fade, march the next scene into hdrB ─────────────────
    if (blend > 0.001) {
      const nyaw = cinematic ? elapsed * 0.14 + nextIdx * 1.7 : yaw;
      const ntargetY = nextIdx === 1 ? -0.2 : nextIdx === 4 ? 0.65 : nextIdx === 6 ? 0.5 : 0.0;
      writeFrameCb(nyaw, pitch, dist, roll, tx, cinematic ? ntargetY : ty, tz, elapsed);
      gpu.setRenderTargets([hdrB.rtv!]);
      gpu.setViewport(cw, ch);
      gpu.clear(hdrB.rtv!, [0, 0, 0, 80]);
      gpu.vsSet(vs);
      if (nextIdx === 9) gpu.psSet(sceneShaders[nextIdx]!, { cb: [cbFrame], srv: [simPrev.srv!], samp: [samp] });
      else gpu.psSet(sceneShaders[nextIdx]!, { cb: [cbFrame] });
      gpu.drawFullscreenTriangle();
      if (nextIdx === 9) gpu.psSet(sceneShaders[nextIdx]!, { srv: [0n] });
      gpu.setRenderTargets([]);
    } else {
      // Keep hdrB defined (sample A) so the post lerp is safe even when blend≈0.
    }

    // ── PASS B — bloom ─────────────────────────────────────────────────────────
    const focus = dist; // auto-focus on the subject (camera→target distance)
    // Reset accumulation on ANY visual change (camera OR scene/FX/JIT), else it ghosts.
    const accum = frozen && !cameraMoved && !visualDirty ? (photoMode ? Math.min(0.92, 0.6 + photoFrames * 0.03) : 0.85) : 0.0;
    writePostCb(blend, elapsed, focus, accum, velX, velY);
    gpu.setRenderTargets([bloomTex.rtv!]);
    gpu.setViewport(cw, ch);
    gpu.clear(bloomTex.rtv!, [0, 0, 0, 0]);
    gpu.vsSet(vs);
    gpu.psSet(psBloom, { cb: [cbPost], srv: [hdrA.srv!, blend > 0.001 ? hdrB.srv! : hdrA.srv!], samp: [samp] });
    gpu.drawFullscreenTriangle();
    gpu.psSet(psBloom, { srv: [0n, 0n] });
    gpu.setRenderTargets([]);

    // ── PASS C — cinematic composite into compTex ──────────────────────────────
    gpu.setRenderTargets([compTex.rtv!]);
    gpu.setViewport(cw, ch);
    gpu.clear(compTex.rtv!, [0, 0, 0, 1]);
    gpu.vsSet(vs);
    gpu.psSet(psPost, { cb: [cbPost], srv: [hdrA.srv!, blend > 0.001 ? hdrB.srv! : hdrA.srv!, bloomTex.srv!], samp: [samp] });
    gpu.drawFullscreenTriangle();
    gpu.psSet(psPost, { srv: [0n, 0n, 0n] });
    gpu.setRenderTargets([]);

    // ── PRESENT — temporal accumulation (compTex + history) → back buffer + history ─
    gpu.setRenderTargets([g.backBufferRTV, histCurr.rtv!]);
    gpu.setViewport(cw, ch);
    gpu.vsSet(vs);
    gpu.psSet(psPresent, { cb: [cbPost], srv: [compTex.srv!, histPrev.srv!], samp: [samp] });
    gpu.drawFullscreenTriangle();
    gpu.psSet(psPresent, { srv: [0n, 0n] });
    gpu.setRenderTargets([]);
    {
      const t = histPrev;
      histPrev = histCurr;
      histCurr = t;
    }

    if (!photoMode && process.env.HIDE_HUD !== '1') drawHud(sceneIdx, activeIdx);

    // ── Self-shot ──────────────────────────────────────────────────────────────
    if (SELFSHOT && !selfshotDone && elapsed > 1.0 && totalFrames >= 3) {
      const stats = captureBackBuffer(g, SELFSHOT_PATH);
      console.log(
        `SELFSHOT ${JSON.stringify({ ok: stats.ok, w: stats.width, h: stats.height, nonBlackFrac: Number(stats.nonBlackFrac.toFixed(3)), meanLuma: Number(stats.meanLuma.toFixed(3)), fps, scene: SCENES[activeIdx]!.name, path: stats.path })}`,
      );
      selfshotDone = true;
    }

    g.present(false);
    if (photoMode) photoFrames += 1;

    // Background warm-up: compile one not-yet-built scene per frame while the opening scene
    // holds, so later cross-fades never hitch. Skipped during a fade (both shaders are in use).
    if (warmupQueue.length > 0 && blend < 0.001) ensureScene(warmupQueue.shift()!);

    frames += 1;
    totalFrames += 1;
    if (now - fpsWindowStart >= 500) {
      fps = Math.round((frames * 1000) / (now - fpsWindowStart));
      frames = 0;
      fpsWindowStart = now;
    }

    if (durationMs > 0 && now - startTime >= durationMs) break;
  }

  // ── Teardown ────────────────────────────────────────────────────────────────
  hud.release();
  GDI32.DeleteObject(hudFont);
  GDI32.DeleteObject(hudFontSmall);
  comReleaseSafe(samp);
  comReleaseSafe(cbSim);
  comReleaseSafe(cbPost);
  comReleaseSafe(cbFrame);
  comReleaseSafe(simPrev.uav);
  comReleaseSafe(simPrev.srv);
  comReleaseSafe(simPrev.buffer);
  comReleaseSafe(simNext.uav);
  comReleaseSafe(simNext.srv);
  comReleaseSafe(simNext.buffer);
  for (const tex of [histCurr, histPrev, compTex, bloomTex, hdrB, hdrA]) {
    comReleaseSafe(tex.srv);
    comReleaseSafe(tex.rtv);
    comReleaseSafe(tex.tex);
  }
  comReleaseSafe(simCs);
  comReleaseSafe(psPresent);
  comReleaseSafe(psPost);
  comReleaseSafe(psBloom);
  for (const s of sceneShaders) comReleaseSafe(s);
  comReleaseSafe(vs);
  comReleaseSafe(g.backBufferRTV);
  comReleaseSafe(g.swapChain);
  comReleaseSafe(g.context);
  comReleaseSafe(g.device);
  win.destroy();
  process.exit(0);
}

if (import.meta.main) {
  main();
}
