/**
 * blackhole.ts — a ray-traced Schwarzschild black hole with gravitational lensing, in pure TypeScript on the GPU.
 *
 * A borderless 1280x720 window fills with a cinematic, Interstellar-style black hole. For every pixel a
 * light ray is marched through curved space: each of a few hundred small steps bends the ray toward the
 * singularity with an acceleration that falls off like ~1/r^2, so the procedural starfield behind the hole
 * (hash-based stars plus faint fbm nebula) warps into glowing Einstein-ring arcs. A thin, tilted accretion
 * disk lives in the equatorial plane with turbulent fbm texture, Doppler beaming (the approaching side is
 * hot blue-white and brighter, the receding side red and dim), and an inner photon-ring brightening; the
 * pure-black event-horizon shadow is rendered with the lensed disk arc curving up and over its top edge.
 * The bright disk and ring are then bloomed through a bright-pass plus separable Gaussian blur and composited
 * with ACES-ish tonemapping. The mouse orbits the camera; otherwise it auto-orbits slowly. A GDI HUD reads
 * "Schwarzschild black hole · gravitational lensing · <fps> fps".
 *
 * Pipeline (each step uses the shared pure-TS D3D11 engine in ./_gpu):
 *   1. gpu.createWindow (WS_POPUP, auto-topmost+foreground) + gpu.createDevice (HARDWARE, WARP fallback)
 *   2. compile() the fullscreen-triangle VS and four pixel shaders (lensing ray-march, bright-pass,
 *      separable blur, composite) at runtime via d3dcompiler_47!D3DCompile → DXBC on the real GPU
 *   3. makeTexture R16G16B16A16_FLOAT HDR scene target + two half-res HDR bloom ping-pong targets
 *      (each rtv+srv); makeSampler (linear/clamp); makeConstantBuffer (16-byte aligned)
 *   4. per frame: pass 1 ray-march → HDR scene; pass 2 bright-pass → bloomA; pass 3 H-blur → bloomB;
 *      pass 4 V-blur → bloomA; pass 5 composite scene+bloom → back buffer; present(); GDI HUD on top
 *   5. comRelease every COM object, free the GDI font, win.destroy() on exit (ESC or DEMO_DURATION_MS)
 *
 * @bun-win32 / engine APIs used: gpu.createWindow / createDevice / compile / makeVertexShader /
 *   makePixelShader / makeTexture / makeSampler / makeConstantBuffer / updateConstantBuffer /
 *   setRenderTargets / setViewport / clear / vsSet / psSet / drawFullscreenTriangle / present /
 *   comRelease, plus GDI32 CreateFontW/TextOutW for the HUD.
 *
 * Run: bun run packages/all/example/blackhole.ts
 */

import { GDI32, User32 } from '../index';
import * as gpu from './_gpu';

const WIDTH = 1280;
const HEIGHT = 720;
const TRANSPARENT_BK = 1;

// ── Fullscreen-triangle vertex shader (SV_VertexID, no vertex buffer) ──────────
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

// ── Pass 1: gravitational ray-march into an HDR scene texture ──────────────────
const PS_SCENE = `
cbuffer Frame : register(b0) {
  float2 iResolution;
  float  iTime;
  float  pad0;
  float2 iMouse;      // pixels; (0,0) means "no input yet"
  float2 pad1;
};

// ── hashes / noise ────────────────────────────────────────────────────────────
float hash21(float2 p) {
  p = frac(p * float2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return frac(p.x * p.y);
}
float hash31(float3 p) {
  p = frac(p * 0.3183099 + 0.1);
  p *= 17.0;
  return frac(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float vnoise(float3 x) {
  float3 i = floor(x);
  float3 f = frac(x);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash31(i + float3(0,0,0));
  float n100 = hash31(i + float3(1,0,0));
  float n010 = hash31(i + float3(0,1,0));
  float n110 = hash31(i + float3(1,1,0));
  float n001 = hash31(i + float3(0,0,1));
  float n101 = hash31(i + float3(1,0,1));
  float n011 = hash31(i + float3(0,1,1));
  float n111 = hash31(i + float3(1,1,1));
  float nx00 = lerp(n000, n100, f.x);
  float nx10 = lerp(n010, n110, f.x);
  float nx01 = lerp(n001, n101, f.x);
  float nx11 = lerp(n011, n111, f.x);
  float nxy0 = lerp(nx00, nx10, f.y);
  float nxy1 = lerp(nx01, nx11, f.y);
  return lerp(nxy0, nxy1, f.z);
}
float fbm(float3 p) {
  float a = 0.5;
  float s = 0.0;
  [unroll]
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p *= 2.02; a *= 0.5; }
  return s;
}

float3x3 rotY(float a) { float s = sin(a), c = cos(a); return float3x3(c,0,s, 0,1,0, -s,0,c); }
float3x3 rotX(float a) { float s = sin(a), c = cos(a); return float3x3(1,0,0, 0,c,-s, 0,s,c); }

// ── Procedural starfield + nebula sampled in a ray direction ────────────────────
float3 starfield(float3 dir) {
  // Faint, deep nebula from fbm at two scales.
  float3 nd = dir;
  float neb = fbm(nd * 2.4 + 13.0);
  neb = pow(saturate(neb * 1.3 - 0.35), 2.4);
  float neb2 = fbm(nd * 5.5 - 7.0);
  float3 nebCol =
      neb  * float3(0.10, 0.16, 0.34) * 0.9 +
      neb2 * neb * float3(0.30, 0.10, 0.22) * 0.8;

  // Hash-based stars on a spherical cell grid.
  float3 col = nebCol;
  float2 sph = float2(atan2(dir.z, dir.x), asin(clamp(dir.y, -1.0, 1.0)));
  [unroll]
  for (int L = 0; L < 3; L++) {
    float scale = 120.0 * (1.0 + float(L) * 1.7);
    float2 g = sph * scale;
    float2 cell = floor(g);
    float2 f = frac(g);
    float h = hash21(cell + float2(L * 37, L * 17));
    if (h > 0.86) {
      float2 starPos = float2(hash21(cell + 3.1), hash21(cell + 7.7));
      float d = length(f - starPos);
      float bright = (h - 0.86) / 0.14;
      float twinkle = 0.7 + 0.3 * sin(iTime * 2.0 + h * 50.0);
      float s = smoothstep(0.10, 0.0, d) * bright * twinkle;
      // subtle star color from hash
      float3 sc = lerp(float3(0.7,0.8,1.0), float3(1.0,0.9,0.7), hash21(cell + 9.3));
      col += sc * s * (1.4 - float(L) * 0.35);
    }
  }
  return col;
}

// ── Accretion-disk emission for a hit at equatorial-plane radius r, with disk
//    azimuth phi; vel is the orbital velocity direction projected on the ray for
//    Doppler beaming. ────────────────────────────────────────────────────────────
float3 diskColor(float r, float phi, float doppler) {
  // Radial profile: bright inner edge near the photon ring, fading out.
  float inner = 2.6;   // inner radius of the disk
  float outer = 9.0;   // outer radius
  float t = saturate((r - inner) / (outer - inner));
  float radial = pow(1.0 - t, 1.6) * smoothstep(0.0, 0.18, r - inner);
  // Turbulent fbm bands swirling with time.
  float swirl = phi * 3.0 - iTime * 0.6 - r * 0.7;
  float turb = fbm(float3(cos(swirl), sin(swirl), r * 0.45) * 2.5 + iTime * 0.05);
  turb = 0.55 + 0.65 * turb;
  // Temperature: hotter (bluer) closer in.
  float temp = saturate(1.0 - t * 0.85);
  float3 hot  = float3(0.75, 0.85, 1.15);    // blue-white
  float3 cool = float3(1.25, 0.45, 0.12);    // orange-red
  float3 base = lerp(cool, hot, temp);
  // Photon-ring brightening at the very inner edge.
  float ring = smoothstep(0.45, 0.0, r - inner) * 1.8;
  float3 col = base * radial * turb;
  col += float3(1.1, 1.0, 0.95) * ring * radial;
  // Doppler beaming: approaching side hotter & brighter, receding dimmer & redder.
  float beam = pow(saturate(doppler), 2.2);     // 0..~ -> brightness boost
  col *= 0.45 + 2.6 * beam;
  col = lerp(col * float3(1.3, 0.6, 0.4), col * float3(0.7, 0.85, 1.25), saturate(doppler));
  return col * 3.2;
}

float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 res = max(iResolution, float2(1.0, 1.0));
  float2 p = (fragPos.xy * 2.0 - res) / res.y;
  p.y = -p.y;

  // Camera orbit from mouse (or slow auto-orbit when idle).
  float2 m = (iMouse.x <= 0.0 && iMouse.y <= 0.0)
      ? float2(iTime * 0.06, 0.32)
      : float2((iMouse.x / res.x - 0.5) * 3.14159, (0.5 - iMouse.y / res.y) * 1.2 + 0.18);
  float yaw = m.x;
  float pitch = clamp(m.y, -0.18, 1.25);

  float dist = 16.0;
  float3 ro = float3(0.0, 0.0, dist);
  ro = mul(rotX(pitch), ro);
  ro = mul(rotY(yaw), ro);
  float3 target = float3(0.0, 0.0, 0.0);
  float3 ww = normalize(target - ro);
  float3 uu = normalize(cross(float3(0.0, 1.0, 0.0), ww));
  float3 vv = cross(ww, uu);
  float3 rd = normalize(p.x * uu + p.y * vv + 1.9 * ww);

  // Disk plane normal is world-up (equatorial plane y=0); orbital sense fixed.
  const float Rs = 1.0;          // Schwarzschild-ish radius scale (event horizon)
  const float horizon = 1.35;    // shadow radius

  float3 pos = ro;
  float3 vel = rd;
  float3 accum = float3(0.0, 0.0, 0.0);
  float transmit = 1.0;          // how much background light still reaches us
  bool captured = false;
  float prevY = pos.y;

  const int STEPS = 320;
  const float dt = 0.13;
  [loop]
  for (int i = 0; i < STEPS; i++) {
    float r2 = dot(pos, pos);
    float r = sqrt(r2);

    // Captured by the event horizon -> pure black shadow.
    if (r < horizon) { captured = true; break; }

    // Gravitational bending: pull velocity toward the center ~ 1/r^2.
    float3 toCenter = -pos / max(r, 1e-3);
    float g = 1.6 * Rs / max(r2, 0.05);
    vel = normalize(vel + toCenter * g * dt);

    float3 npos = pos + vel * dt * (1.0 + r * 0.08);  // longer strides far away

    // Accretion-disk crossing: detect equatorial-plane sign change in y.
    if ((prevY > 0.0) != (npos.y > 0.0)) {
      float tcross = prevY / (prevY - npos.y);
      float3 hitp = lerp(pos, npos, saturate(tcross));
      float rr = length(hitp.xz);
      if (rr > 2.5 && rr < 9.2) {
        float phi = atan2(hitp.z, hitp.x);
        // Orbital velocity direction (counter-clockwise in xz) at the hit.
        float3 orbit = normalize(float3(-hitp.z, 0.0, hitp.x));
        float speed = 0.62 * sqrt(2.6 / rr);
        float doppler = 0.5 + 0.5 * dot(orbit * speed / 0.5, normalize(vel));
        float3 dc = diskColor(rr, phi, doppler);
        // Soft vertical falloff so the disk reads as thin.
        float thin = exp(-pow((hitp.y) * 7.0, 2.0));
        accum += dc * transmit * thin;
        transmit *= 0.55;        // disk is fairly opaque near the core
      }
    }

    prevY = npos.y;
    pos = npos;

    // Escaped to the sky.
    if (r > 40.0 && dot(vel, pos) > 0.0) break;
  }

  float3 col = accum;
  if (!captured) {
    col += starfield(normalize(vel)) * transmit;
  }

  // Subtle bloom seed: keep HDR; clamp absurd values for stability.
  col = min(col, 40.0);
  return float4(col, 1.0);
}
`;

// ── Pass 2: bright-pass (extract the glowing parts for bloom) ──────────────────
const PS_BRIGHT = `
cbuffer Frame : register(b0) {
  float2 iResolution; float iTime; float pad0; float2 iMouse; float2 pad1;
};
Texture2D Scene : register(t0);
SamplerState Smp : register(s0);
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float3 c = Scene.Sample(Smp, uv).rgb;
  float l = dot(c, float3(0.2126, 0.7152, 0.0722));
  float3 bright = c * smoothstep(0.7, 1.6, l);
  return float4(bright, 1.0);
}
`;

// ── Pass 3/4: separable Gaussian blur (direction in pad0/pad1.x via b0) ─────────
const PS_BLUR = `
cbuffer Frame : register(b0) {
  float2 iResolution; float iTime; float pad0; float2 dir; float2 pad1;
};
Texture2D Src : register(t0);
SamplerState Smp : register(s0);
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 texel = dir / max(iResolution, float2(1.0,1.0));
  float w[5] = { 0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216 };
  float3 sum = Src.Sample(Smp, uv).rgb * w[0];
  [unroll]
  for (int i = 1; i < 5; i++) {
    sum += Src.Sample(Smp, uv + texel * (float(i) * 1.5)).rgb * w[i];
    sum += Src.Sample(Smp, uv - texel * (float(i) * 1.5)).rgb * w[i];
  }
  return float4(sum, 1.0);
}
`;

// ── Pass 5: composite scene + bloom, tonemap, vignette ──────────────────────────
const PS_COMPOSITE = `
cbuffer Frame : register(b0) {
  float2 iResolution; float iTime; float pad0; float2 iMouse; float2 pad1;
};
Texture2D Scene : register(t0);
Texture2D Bloom : register(t1);
SamplerState Smp : register(s0);

float3 aces(float3 x) {
  const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return saturate((x * (a * x + b)) / (x * (c * x + d) + e));
}
float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float3 scene = Scene.Sample(Smp, uv).rgb;
  float3 bloom = Bloom.Sample(Smp, uv).rgb;
  float3 col = scene + bloom * 1.35;
  col = aces(col * 1.05);
  // Vignette.
  float2 q = uv;
  float vig = pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.18);
  col *= lerp(0.7, 1.06, vig);
  col = pow(col, 1.0 / 2.2);   // gamma
  return float4(col, 1.0);
}
`;

// ── Bring up window + device through the shared engine ─────────────────────────
const win = gpu.createWindow({ title: 'Black Hole — gravitational lensing (pure TypeScript GPU ray-trace)', width: WIDTH, height: HEIGHT, borderless: true });
const { w: clientW, h: clientH } = win.clientSize();
const dev = gpu.createDevice(win.hwnd, { width: clientW, height: clientH });

// Bloom works at half resolution for speed and a softer glow.
const bloomW = Math.max(1, Math.floor(clientW / 2));
const bloomH = Math.max(1, Math.floor(clientH / 2));

// ── Compile shaders (runtime HLSL → DXBC on the real GPU) ──────────────────────
const vsCode = gpu.compile(VS_SOURCE, 'main', 'vs_5_0');
const psSceneCode = gpu.compile(PS_SCENE, 'main', 'ps_5_0');
const psBrightCode = gpu.compile(PS_BRIGHT, 'main', 'ps_5_0');
const psBlurCode = gpu.compile(PS_BLUR, 'main', 'ps_5_0');
const psCompCode = gpu.compile(PS_COMPOSITE, 'main', 'ps_5_0');

const vs = gpu.makeVertexShader(vsCode);
const psScene = gpu.makePixelShader(psSceneCode);
const psBright = gpu.makePixelShader(psBrightCode);
const psBlur = gpu.makePixelShader(psBlurCode);
const psComp = gpu.makePixelShader(psCompCode);

// ── HDR render targets ──────────────────────────────────────────────────────────
const sceneTex = gpu.makeTexture({ w: clientW, h: clientH, format: gpu.DXGI_FORMAT_R16G16B16A16_FLOAT, rtv: true, srv: true });
const bloomA = gpu.makeTexture({ w: bloomW, h: bloomH, format: gpu.DXGI_FORMAT_R16G16B16A16_FLOAT, rtv: true, srv: true });
const bloomB = gpu.makeTexture({ w: bloomW, h: bloomH, format: gpu.DXGI_FORMAT_R16G16B16A16_FLOAT, rtv: true, srv: true });

const samp = gpu.makeSampler({ filter: gpu.D3D11_FILTER_MIN_MAG_MIP_LINEAR, address: gpu.D3D11_TEXTURE_ADDRESS_CLAMP });

// Constant buffer: float2 res, float time, float pad, float2 mouse/dir, float2 pad — 32 bytes (16-aligned).
const CB_SIZE = 32;
const cbScene = gpu.makeConstantBuffer(CB_SIZE);
const cbBright = gpu.makeConstantBuffer(CB_SIZE);
const cbBlurH = gpu.makeConstantBuffer(CB_SIZE);
const cbBlurV = gpu.makeConstantBuffer(CB_SIZE);
const cbComp = gpu.makeConstantBuffer(CB_SIZE);

// Per-pass CPU-side constant-buffer staging (packed immediately before each upload).
const cbBufScene = Buffer.alloc(CB_SIZE);
const cbBufBlurH = Buffer.alloc(CB_SIZE);
const cbBufBlurV = Buffer.alloc(CB_SIZE);
const cbBufComp = Buffer.alloc(CB_SIZE);

function packCB(buf: Buffer, resX: number, resY: number, time: number, a: number, b: number): void {
  buf.writeFloatLE(resX, 0);
  buf.writeFloatLE(resY, 4);
  buf.writeFloatLE(time, 8);
  buf.writeFloatLE(0, 12);
  buf.writeFloatLE(a, 16);
  buf.writeFloatLE(b, 20);
  buf.writeFloatLE(0, 24);
  buf.writeFloatLE(0, 28);
}

// ── GDI HUD (the engine doesn't draw text; use User32 GetDC + GDI32 TextOutW) ──
const hudFont = GDI32.CreateFontW(-18, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4 /* ANTIALIASED_QUALITY */, 0, Buffer.from('Consolas\0', 'utf16le').ptr!);
function drawHud(currentFps: number): void {
  const dc = User32.GetDC(win.hwnd);
  if (dc === 0n) return;
  const prevFont = GDI32.SelectObject(dc, hudFont);
  GDI32.SetBkMode(dc, TRANSPARENT_BK);
  const line = `Schwarzschild black hole · gravitational lensing · ${currentFps} fps`;
  const text = Buffer.from(`${line}\0`, 'utf16le');
  const len = line.length;
  GDI32.SetTextColor(dc, 0x000000);
  GDI32.TextOutW(dc, 19, 19, text.ptr!, len);
  GDI32.SetTextColor(dc, 0x00f0d8b0); // BGR warm white
  GDI32.TextOutW(dc, 18, 18, text.ptr!, len);
  GDI32.SelectObject(dc, prevFont);
  User32.ReleaseDC(win.hwnd, dc);
}

console.log('Black Hole — Schwarzschild gravitational lensing ray-traced on the GPU.');
console.log(`  ${dev.driver} · ${dev.gpuName} · ${clientW}x${clientH}`);
console.log('  Move the mouse to orbit the camera · ESC to exit.');

// ── Teardown ───────────────────────────────────────────────────────────────────
let cleanedUp = false;
function cleanup(): void {
  if (cleanedUp) return;
  cleanedUp = true;
  GDI32.DeleteObject(hudFont);
  gpu.comRelease(samp);
  gpu.comRelease(cbScene);
  gpu.comRelease(cbBright);
  gpu.comRelease(cbBlurH);
  gpu.comRelease(cbBlurV);
  gpu.comRelease(cbComp);
  for (const t of [sceneTex, bloomA, bloomB]) {
    gpu.comRelease(t.srv!);
    gpu.comRelease(t.rtv!);
    gpu.comRelease(t.tex);
  }
  gpu.comRelease(psComp);
  gpu.comRelease(psBlur);
  gpu.comRelease(psBright);
  gpu.comRelease(psScene);
  gpu.comRelease(vs);
  gpu.blobRelease(psCompCode.blob);
  gpu.blobRelease(psBlurCode.blob);
  gpu.blobRelease(psBrightCode.blob);
  gpu.blobRelease(psSceneCode.blob);
  gpu.blobRelease(vsCode.blob);
  gpu.comRelease(dev.backBufferRTV);
  gpu.comRelease(dev.swapChain);
  gpu.comRelease(dev.context);
  gpu.comRelease(dev.device);
  win.destroy();
}
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});
process.on('exit', cleanup);

// ── Render loop ──────────────────────────────────────────────────────────────
const startTime = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
let frames = 0;
let totalFrames = 0;
let fps = 0;
let fpsWindowStart = startTime;
let everMoved = false;

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;

  const now = performance.now();
  const t = (now - startTime) / 1000;
  const mouse = win.getMouse();
  // Treat the centered initial position as "no input" so auto-orbit kicks in,
  // then latch once the user actually moves the mouse.
  if (Math.abs(mouse.x - clientW / 2) > 2 || Math.abs(mouse.y - clientH / 2) > 2) everMoved = true;
  const mx = everMoved ? mouse.x : 0;
  const my = everMoved ? mouse.y : 0;

  // Pass 1: ray-march the lensed scene into the HDR target.
  packCB(cbBufScene, clientW, clientH, t, mx, my);
  gpu.updateConstantBuffer(cbScene, cbBufScene);
  gpu.setRenderTargets([]);
  gpu.setRenderTargets([sceneTex.rtv!]);
  gpu.setViewport(clientW, clientH);
  gpu.clear(sceneTex.rtv!, [0, 0, 0, 1]);
  gpu.vsSet(vs);
  gpu.psSet(psScene, { cb: [cbScene] });
  gpu.drawFullscreenTriangle();
  gpu.setRenderTargets([]);

  // Pass 2: bright-pass scene -> bloomA (half res).
  gpu.updateConstantBuffer(cbBright, cbBufScene);
  gpu.setRenderTargets([bloomA.rtv!]);
  gpu.setViewport(bloomW, bloomH);
  gpu.clear(bloomA.rtv!, [0, 0, 0, 1]);
  gpu.vsSet(vs);
  gpu.psSet(psBright, { cb: [cbBright], srv: [sceneTex.srv!], samp: [samp] });
  gpu.drawFullscreenTriangle();
  gpu.setRenderTargets([]);

  // Pass 3: horizontal blur bloomA -> bloomB.
  packCB(cbBufBlurH, bloomW, bloomH, t, 1, 0);
  gpu.updateConstantBuffer(cbBlurH, cbBufBlurH);
  gpu.setRenderTargets([bloomB.rtv!]);
  gpu.setViewport(bloomW, bloomH);
  gpu.clear(bloomB.rtv!, [0, 0, 0, 1]);
  gpu.vsSet(vs);
  gpu.psSet(psBlur, { cb: [cbBlurH], srv: [bloomA.srv!], samp: [samp] });
  gpu.drawFullscreenTriangle();
  gpu.setRenderTargets([]);

  // Pass 4: vertical blur bloomB -> bloomA.
  packCB(cbBufBlurV, bloomW, bloomH, t, 0, 1);
  gpu.updateConstantBuffer(cbBlurV, cbBufBlurV);
  gpu.setRenderTargets([bloomA.rtv!]);
  gpu.setViewport(bloomW, bloomH);
  gpu.clear(bloomA.rtv!, [0, 0, 0, 1]);
  gpu.vsSet(vs);
  gpu.psSet(psBlur, { cb: [cbBlurV], srv: [bloomB.srv!], samp: [samp] });
  gpu.drawFullscreenTriangle();
  gpu.setRenderTargets([]);

  // Pass 5: composite scene + bloom -> back buffer.
  packCB(cbBufComp, clientW, clientH, t, mx, my);
  gpu.updateConstantBuffer(cbComp, cbBufComp);
  gpu.setRenderTargets([dev.backBufferRTV]);
  gpu.setViewport(clientW, clientH);
  gpu.clear(dev.backBufferRTV, [0, 0, 0, 1]);
  gpu.vsSet(vs);
  gpu.psSet(psComp, { cb: [cbComp], srv: [sceneTex.srv!, bloomA.srv!], samp: [samp] });
  gpu.drawFullscreenTriangle();
  gpu.setRenderTargets([]);

  dev.present(false);
  drawHud(fps);

  frames += 1;
  totalFrames += 1;
  if (now - fpsWindowStart >= 500) {
    fps = Math.round((frames * 1000) / (now - fpsWindowStart));
    frames = 0;
    fpsWindowStart = now;
  }

  if (durationMs > 0 && now - startTime >= durationMs) break;
}

console.log(`Presented ${totalFrames} frames over ${((performance.now() - startTime) / 1000).toFixed(2)}s · last ${fps} fps.`);
cleanup();
process.exit(0);
