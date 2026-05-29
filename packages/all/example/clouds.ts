/**
 * Volumetric Clouds — flying through a ray-marched cloudscape on your real GPU, in pure TypeScript.
 *
 * A borderless 1280x720 window fills with a photoreal-ish sky you could stare at: a
 * Rayleigh-ish horizon-to-zenith gradient, a bloomed sun disc, and a single layer of
 * towering cumulus that the camera slowly flies forward through while drifting. The
 * clouds are not sprites or textures — every frame a fullscreen pixel shader RAY-MARCHES
 * a volumetric density field built from animated value-noise fbm (with a worley-ish
 * billow term), accumulating light with Beer-Lambert extinction and a Henyey-Greenstein
 * phase function for forward scattering, plus a short secondary march toward the sun for
 * self-shadowing — so the clouds have real volume, dark undersides, and bright silver
 * linings. Crepuscular god rays radiate from the sun, then the HDR result is Reinhard-
 * tonemapped with a subtle vignette and gamma. The camera flies forward continuously and
 * the mouse steers the look direction; the cloud field evolves over time. A GDI HUD reads
 * "Volumetric clouds · ray-marched · <fps> fps · <GPU name>".
 *
 * Pipeline (per frame, ~60 fps off a PeekMessage pump):
 *   1. _gpu.createWindow (WS_POPUP borderless, shown topmost) + createDevice (HW, WARP fallback)
 *   2. compile() the fullscreen-triangle VS (SV_VertexID) + the volumetric PS → DXBC at runtime
 *   3. makeVertexShader / makePixelShader / makeConstantBuffer(48 B, 16-aligned)
 *   4. updateConstantBuffer(res, time, mouse, camPos) → setRenderTargets → setViewport → clear
 *   5. vsSet → psSet({ cb }) → drawFullscreenTriangle (3 verts) → present(); GDI HUD on top
 *   6. comRelease / blobRelease / win.destroy() on every exit path
 *
 * @bun-win32 / engine APIs used:
 *   - ./_gpu  createWindow, createDevice, compile, makeVertexShader, makePixelShader,
 *             makeConstantBuffer, updateConstantBuffer, setRenderTargets, setViewport,
 *             clear, drawFullscreenTriangle, vsSet, psSet, comRelease, blobRelease
 *   - GDI32   CreateFontW / SelectObject / SetBkMode / SetTextColor / TextOutW / DeleteObject
 *   - User32  GetDC / ReleaseDC (HUD overlay on the swap-chain window)
 *
 * Run: bun run packages/all/example/clouds.ts
 */

import { GDI32, User32 } from '../index';
import * as gpu from './_gpu';

const WIDTH = 1280;
const HEIGHT = 720;
const TRANSPARENT_BK = 1;
const VK_ESCAPE = 0x1b;

const encode = (str: string): Buffer => Buffer.from(`${str}\0`, 'utf16le');

// ── Vertex shader: one full-screen triangle from SV_VertexID (no vertex buffer) ──
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

// ── Pixel shader: a fullscreen volumetric cloud ray-march ─────────────────────
// Density comes from animated value-noise fbm shaped into a cloud layer; lighting
// uses Beer-Lambert extinction + a Henyey-Greenstein phase + a short secondary
// march toward the sun for self-shadow. A Rayleigh-ish sky gradient, a bloomed sun
// disc, and screen-space god rays complete the frame; Reinhard tonemap + vignette.
const PS_SOURCE = `
cbuffer Frame : register(b0) {
  float2 iResolution;
  float  iTime;
  float  pad0;
  float2 iMouse;
  float2 pad1;
  float3 iCamPos;
  float  pad2;
};

static const float3 SUN_DIR = normalize(float3(-0.45, 0.28, 0.85));

// ── Hash + 3D value noise + fbm (animated by scrolling the sample point) ───────
float hash13(float3 p) {
  p = frac(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return frac((p.x + p.y) * p.z);
}

float valueNoise(float3 p) {
  float3 i = floor(p);
  float3 f = frac(p);
  f = f * f * (3.0 - 2.0 * f); // smoothstep interpolation
  float n000 = hash13(i + float3(0,0,0));
  float n100 = hash13(i + float3(1,0,0));
  float n010 = hash13(i + float3(0,1,0));
  float n110 = hash13(i + float3(1,1,0));
  float n001 = hash13(i + float3(0,0,1));
  float n101 = hash13(i + float3(1,0,1));
  float n011 = hash13(i + float3(0,1,1));
  float n111 = hash13(i + float3(1,1,1));
  float nx00 = lerp(n000, n100, f.x);
  float nx10 = lerp(n010, n110, f.x);
  float nx01 = lerp(n001, n101, f.x);
  float nx11 = lerp(n011, n111, f.x);
  float nxy0 = lerp(nx00, nx10, f.y);
  float nxy1 = lerp(nx01, nx11, f.y);
  return lerp(nxy0, nxy1, f.z);
}

float fbm(float3 p) {
  float sum = 0.0;
  float amp = 0.5;
  float3 shift = float3(0.0, iTime * 0.15, iTime * 0.05); // clouds evolve + drift
  [unroll]
  for (int i = 0; i < 5; i++) {
    sum += amp * valueNoise(p + shift);
    p = p * 2.02 + float3(11.3, 7.7, 3.1);
    shift *= 1.7;
    amp *= 0.5;
  }
  return sum;
}

// ── Cloud density: a slab between two heights, eroded by billowy fbm ──────────
static const float CLOUD_BOTTOM = 8.0;
static const float CLOUD_TOP = 26.0;

float cloudDensity(float3 p) {
  // Height falloff: a smooth band that fattens in the middle of the slab.
  float h = (p.y - CLOUD_BOTTOM) / (CLOUD_TOP - CLOUD_BOTTOM);
  if (h < 0.0 || h > 1.0) return 0.0;
  float heightShape = smoothstep(0.0, 0.25, h) * smoothstep(1.0, 0.55, h);

  float3 q = p * 0.06;
  float base = fbm(q);
  // Billow erosion: subtract higher-frequency detail so edges become wispy.
  float detail = fbm(q * 3.3 + 4.7);
  float d = base * heightShape - 0.36 - 0.22 * (1.0 - detail);
  d -= 0.12 * detail;                      // extra erosion for cauliflower edges
  return saturate(d) * 1.7;
}

// Henyey-Greenstein phase function (forward scattering toward the sun).
float hgPhase(float cosT, float g) {
  float g2 = g * g;
  return (1.0 - g2) / (4.0 * 3.14159265 * pow(1.0 + g2 - 2.0 * g * cosT, 1.5));
}

// ── Sky: Rayleigh-ish zenith→horizon gradient + bloomed sun disc + halo ───────
float3 skyColor(float3 rd) {
  float up = saturate(rd.y * 0.5 + 0.5);
  float3 zenith = float3(0.16, 0.34, 0.66);
  float3 horizon = float3(0.72, 0.80, 0.92);
  float3 sky = lerp(horizon, zenith, pow(up, 0.65));
  // Warm the band just above the horizon (atmospheric Mie haze).
  float haze = pow(saturate(1.0 - abs(rd.y) * 2.2), 3.0);
  sky += float3(0.35, 0.24, 0.12) * haze * 0.6;

  float sun = saturate(dot(rd, SUN_DIR));
  sky += float3(1.0, 0.85, 0.6) * pow(sun, 350.0) * 12.0;   // sun disc
  sky += float3(1.0, 0.7, 0.4) * pow(sun, 8.0) * 0.6;       // sun bloom/halo
  return sky;
}

float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 res = max(iResolution, float2(1.0, 1.0));
  float2 p = (fragPos.xy * 2.0 - res) / res.y;
  p.y = -p.y;

  // Camera: flying forward (iCamPos.z advances on the CPU); mouse steers look dir.
  float2 m = (iMouse / res - 0.5) * 2.0;
  float yaw = m.x * 0.5;
  float pitch = clamp(-m.y * 0.35 + 0.12, -0.4, 0.6);
  float cy = cos(yaw); float sy = sin(yaw);
  float cp = cos(pitch); float sp = sin(pitch);
  float3 ro = iCamPos;
  // Forward / right / up basis from yaw+pitch.
  float3 fwd = float3(sy * cp, sp, cy * cp);
  float3 right = float3(cy, 0.0, -sy);
  float3 upv = cross(right, fwd);
  float3 rd = normalize(p.x * right + p.y * upv + 1.6 * fwd);

  float3 sky = skyColor(rd);
  float3 col = sky;
  float transmittance = 1.0;
  float3 scattered = float3(0.0, 0.0, 0.0);

  // Only march if the ray can reach the cloud slab (rd.y > 0 looks up into it).
  if (rd.y > 0.02) {
    // Entry/exit distances where the ray crosses the slab [CLOUD_BOTTOM, CLOUD_TOP].
    float tBottom = (CLOUD_BOTTOM - ro.y) / rd.y;
    float tTop = (CLOUD_TOP - ro.y) / rd.y;
    float tStart = max(min(tBottom, tTop), 0.0);
    float tEnd = max(tBottom, tTop);
    tEnd = min(tEnd, 220.0); // far clamp so distant clouds fade into the sky

    if (tEnd > tStart) {
      const int STEPS = 64;
      float stepLen = (tEnd - tStart) / float(STEPS);
      float t = tStart + stepLen * (0.5 + 0.5 * frac(sin(dot(p, float2(12.9898, 78.233))) * 43758.5)); // jitter to hide banding
      float cosT = dot(rd, SUN_DIR);
      float phase = lerp(hgPhase(cosT, 0.6), hgPhase(cosT, -0.2), 0.5); // dual-lobe

      [loop]
      for (int i = 0; i < STEPS; i++) {
        if (transmittance < 0.02) break;
        float3 pos = ro + rd * t;
        float dens = cloudDensity(pos);
        if (dens > 0.001) {
          // Secondary (light) march toward the sun for self-shadowing.
          float shadow = 0.0;
          float ls = 1.6;
          [unroll]
          for (int j = 0; j < 5; j++) {
            float3 sp3 = pos + SUN_DIR * (ls * float(j) + ls);
            shadow += cloudDensity(sp3);
          }
          float sunT = exp(-shadow * ls * 0.55);   // Beer-Lambert toward the sun

          // Powder/dark-edge term so deep cloud reads denser than thin edges.
          float powder = 1.0 - exp(-dens * 2.0);
          float3 sunCol = float3(1.0, 0.93, 0.78) * 3.4;
          float3 ambient = lerp(float3(0.30, 0.36, 0.5), float3(0.9, 0.92, 1.0), saturate(pos.y / CLOUD_TOP));

          float3 lum = sunCol * sunT * phase * powder + ambient * 0.5;
          float dT = exp(-dens * stepLen * 1.1);   // Beer-Lambert along the view ray
          // Energy-conserving integration of in-scattered light.
          scattered += transmittance * (1.0 - dT) * lum;
          transmittance *= dT;
        }
        t += stepLen;
      }
    }
    // Composite clouds over the sky by remaining transmittance.
    col = sky * transmittance + scattered;
  }

  // ── Crepuscular god rays: radial blur of brightness toward the sun's screen pos.
  float sunFacing = saturate(dot(rd, SUN_DIR));
  float rays = 0.0;
  {
    // Sample the bright/scatter response along the ray back toward the sun direction
    // projected into screen space (cheap analytic approximation using sunFacing).
    float decay = 1.0;
    [unroll]
    for (int s = 0; s < 6; s++) {
      float w = pow(sunFacing, 6.0 + s * 2.0);
      rays += w * decay;
      decay *= 0.82;
    }
  }
  col += float3(1.0, 0.78, 0.5) * rays * 0.10 * transmittance;

  // ── Tonemap + gamma + subtle vignette ─────────────────────────────────────
  float2 q = fragPos.xy / res;
  float vig = pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.18);
  col *= lerp(0.78, 1.04, vig);
  col = col / (col + 1.0);            // Reinhard tonemap
  col = pow(col, 1.0 / 2.2);          // gamma
  return float4(col, 1.0);
}
`;

// ── Window + device ────────────────────────────────────────────────────────────
const win = gpu.createWindow({ title: 'Volumetric Clouds — ray-marched on the GPU', width: WIDTH, height: HEIGHT, borderless: true });
const { w: clientW, h: clientH } = win.clientSize();
const g = gpu.createDevice(win.hwnd, { width: clientW, height: clientH });

// ── Compile both stages at runtime → DXBC → real GPU shaders ──────────────────
const vsCode = gpu.compile(VS_SOURCE, 'main', 'vs_5_0');
const psCode = gpu.compile(PS_SOURCE, 'main', 'ps_5_0');
const vs = gpu.makeVertexShader(vsCode);
const ps = gpu.makePixelShader(psCode);

// Constant buffer: 48 bytes (res, time, pad, mouse, pad, camPos, pad) — 16-aligned.
const CB_SIZE = 48;
const cb = gpu.makeConstantBuffer(CB_SIZE);
const cbData = Buffer.alloc(CB_SIZE);

// ── GDI HUD font ──────────────────────────────────────────────────────────────
const hudFont = GDI32.CreateFontW(-18, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4 /* ANTIALIASED_QUALITY */, 0, encode('Consolas').ptr!);

console.log('Volumetric Clouds — flying through a ray-marched cloudscape on the GPU.');
console.log(`  ${g.driver} · ${g.gpuName} · move the mouse to steer · ESC to exit.`);

let cleanedUp = false;
function cleanup(code: number): never {
  if (!cleanedUp) {
    cleanedUp = true;
    GDI32.DeleteObject(hudFont);
    gpu.comRelease(ps);
    gpu.comRelease(vs);
    gpu.blobRelease(psCode.blob);
    gpu.blobRelease(vsCode.blob);
    gpu.comRelease(cb);
    gpu.comRelease(g.backBufferRTV);
    gpu.comRelease(g.swapChain);
    gpu.comRelease(g.context);
    gpu.comRelease(g.device);
    win.destroy();
  }
  process.exit(code);
}
process.on('SIGINT', () => cleanup(0));
process.on('exit', () => {
  if (!cleanedUp) {
    cleanedUp = true;
    GDI32.DeleteObject(hudFont);
    gpu.comRelease(g.context);
    gpu.comRelease(g.device);
  }
});

function drawHud(fps: number): void {
  const dc = User32.GetDC(win.hwnd);
  if (!dc) return;
  const prevFont = GDI32.SelectObject(dc, hudFont);
  GDI32.SetBkMode(dc, TRANSPARENT_BK);
  const line = `Volumetric clouds · ray-marched · ${fps} fps · ${g.gpuName}`;
  const text = encode(line);
  const len = line.length;
  GDI32.SetTextColor(dc, 0x00203040); // BGR soft shadow
  GDI32.TextOutW(dc, 17, 17, text.ptr!, len);
  GDI32.SetTextColor(dc, 0x00f8f0e8); // BGR bright off-white
  GDI32.TextOutW(dc, 16, 16, text.ptr!, len);
  GDI32.SelectObject(dc, prevFont);
  User32.ReleaseDC(win.hwnd, dc);
}

// ── Render loop ────────────────────────────────────────────────────────────────
const startTime = performance.now();
const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
let frames = 0;
let fps = 0;
let fpsWindowStart = startTime;

const clearColor: [number, number, number, number] = [0.55, 0.7, 0.9, 1.0];

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;
  if ((User32.GetAsyncKeyState(VK_ESCAPE) & 0x8000) !== 0) break;

  const now = performance.now();
  const elapsed = (now - startTime) / 1000;
  const mouse = win.getMouse();

  // Camera flies forward along +Z and gently rises/drifts so the field evolves.
  const camZ = elapsed * 7.0;
  const camX = Math.sin(elapsed * 0.18) * 4.0;
  const camY = 1.5 + Math.sin(elapsed * 0.11) * 0.8;

  // Build the constant buffer immediately before the consuming call.
  cbData.writeFloatLE(clientW, 0); // iResolution.x
  cbData.writeFloatLE(clientH, 4); // iResolution.y
  cbData.writeFloatLE(elapsed, 8); // iTime
  cbData.writeFloatLE(0, 12); // pad0
  cbData.writeFloatLE(mouse.x, 16); // iMouse.x
  cbData.writeFloatLE(clientH - mouse.y, 20); // iMouse.y (flip to GL-style)
  cbData.writeFloatLE(0, 24); // pad1
  cbData.writeFloatLE(0, 28);
  cbData.writeFloatLE(camX, 32); // iCamPos.x
  cbData.writeFloatLE(camY, 36); // iCamPos.y
  cbData.writeFloatLE(camZ, 40); // iCamPos.z
  cbData.writeFloatLE(0, 44); // pad2
  gpu.updateConstantBuffer(cb, cbData);

  gpu.setRenderTargets([g.backBufferRTV]);
  gpu.setViewport(clientW, clientH);
  gpu.clear(g.backBufferRTV, clearColor);
  gpu.vsSet(vs);
  gpu.psSet(ps, { cb: [cb] });
  gpu.drawFullscreenTriangle();
  g.present(false);

  drawHud(fps);

  frames += 1;
  if (now - fpsWindowStart >= 500) {
    fps = Math.round((frames * 1000) / (now - fpsWindowStart));
    frames = 0;
    fpsWindowStart = now;
  }

  if (durationMs > 0 && now - startTime >= durationMs) break;
}

cleanup(0);
