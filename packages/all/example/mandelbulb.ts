/**
 * Mandelbulb — a living 3D fractal, ray-marched on your real GPU, in pure TypeScript.
 *
 * A borderless 1280x720 window fills with a slowly breathing alien artifact: the power-8
 * Mandelbulb, ray-marched fresh every frame by an HLSL distance-estimator that Bun JITs at
 * startup via d3dcompiler_47 and runs on a real ID3D11Device. The camera auto-orbits the bulb
 * and you can grab it with the mouse (drag to orbit) while +/- or the arrow keys glide the
 * zoom in and out. The surface is shaded with penumbra soft shadows, ambient occlusion taken
 * from the escape-iteration count, a warm key light plus a cold rim/fresnel, and orbit-trap
 * iridescence so the folds glow in shifting jewel tones. A second pass blooms the bright
 * silhouette into a volumetric halo; the frame is ACES-tonemapped over a deep-space gradient
 * and finished with a gentle vignette. Nothing is precomputed — HLSL source becomes DXBC
 * bytecode at launch and the GPU evaluates the whole estimator per pixel, per frame.
 *
 * Pipeline (each frame): UpdateSubresource(camera/time cbuffer) → pass 1 renders the marched
 * Mandelbulb + glow accumulator into an R16G16B16A16_FLOAT HDR texture → pass 2 samples that
 * texture, adds a separable-ish radial bloom, ACES tonemaps, vignettes, and presents to the
 * DXGI back buffer → GDI TextOutW HUD on top.
 *
 * @bun-win32 / engine APIs: createWindow, createDevice, compile, makeVertexShader/
 * makePixelShader, makeConstantBuffer/updateConstantBuffer, makeTexture (HDR RTV+SRV),
 * makeSampler, setRenderTargets/setViewport/clear/drawFullscreenTriangle, vsSet/psSet,
 * present, comRelease — plus User32 GetDC/ReleaseDC and GDI32 CreateFontW/TextOutW for the HUD.
 *
 * Run: bun run packages/all/example/mandelbulb.ts
 */

import { GDI32 } from '../index';

import * as gpu from './_gpu';
import * as hud from './_hud';

const WIDTH = 1280;
const HEIGHT = 720;
const TRANSPARENT_BK = 1;

// Virtual-key codes for zoom control.
const VK_OEM_PLUS = 0xbb;
const VK_OEM_MINUS = 0xbd;
const VK_ADD = 0x6b;
const VK_SUBTRACT = 0x6d;
const VK_UP = 0x26;
const VK_DOWN = 0x28;
const VK_W = 0x57;
const VK_S = 0x53;

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

// ── Pass 1: ray-march the Mandelbulb into an HDR target ────────────────────────
// Distance estimator: power-8 Mandelbulb with DE = 0.5*log(r)*r/dr, orbit-trap
// coloring, penumbra soft shadows, AO from iteration count, key + rim lighting,
// and a screen-space glow accumulator written into the alpha-tinted RGB.
const PS_MARCH_SOURCE = `
cbuffer Frame : register(b0) {
  float2 iResolution;
  float  iTime;
  float  iZoom;
  float3 iCamDir;   // normalized orbit direction (camera sits at -dir * dist)
  float  iCamDist;
};

static const float POWER = 8.0;

// Mandelbulb distance estimator + orbit trap. Returns DE in .x, trap in .yzw.
float4 bulbDE(float3 pos) {
  float3 z = pos;
  float dr = 1.0;
  float r = 0.0;
  float3 trap = float3(1e9, 1e9, 1e9);
  [loop]
  for (int i = 0; i < 10; i++) {
    r = length(z);
    if (r > 2.2) break;

    // Convert to polar, raise to the power, convert back.
    float theta = acos(clamp(z.z / r, -1.0, 1.0));
    float phi = atan2(z.y, z.x);
    dr = pow(r, POWER - 1.0) * POWER * dr + 1.0;

    float zr = pow(r, POWER);
    theta *= POWER;
    phi *= POWER;

    float st = sin(theta);
    z = zr * float3(st * cos(phi), st * sin(phi), cos(theta));
    z += pos;

    // Orbit trap — track the closest approach to a few primitives for color.
    trap = min(trap, float3(abs(z.x), length(z.xy), dot(z, z)));
  }
  float de = 0.5 * log(max(r, 1e-6)) * r / dr;
  return float4(de, trap);
}

float map(float3 p) { return bulbDE(p).x; }

float3 calcNormal(float3 p) {
  float2 e = float2(0.0008, 0.0);
  return normalize(float3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)));
}

// Penumbra soft shadow via closest-approach tracking.
float softShadow(float3 ro, float3 rd) {
  float res = 1.0;
  float t = 0.02;
  [loop]
  for (int i = 0; i < 40; i++) {
    float h = map(ro + rd * t);
    if (h < 0.0008) return 0.0;
    res = min(res, 12.0 * h / t);
    t += clamp(h, 0.01, 0.18);
    if (t > 4.0) break;
  }
  return clamp(res, 0.0, 1.0);
}

// Iridescent jewel-tone palette (Inigo Quilez cosine palette).
float3 palette(float t) {
  float3 a = float3(0.5, 0.5, 0.5);
  float3 b = float3(0.5, 0.5, 0.5);
  float3 c = float3(1.0, 1.0, 1.0);
  float3 d = float3(0.0, 0.15, 0.32);
  return a + b * cos(6.28318 * (c * t + d));
}

float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 res = max(iResolution, float2(1.0, 1.0));
  float2 p = (fragPos.xy * 2.0 - res) / res.y;
  p.y = -p.y;

  // Orbit camera: positioned along -iCamDir at iCamDist, looking at the origin.
  float3 ww = normalize(iCamDir);
  float3 ro = -ww * iCamDist;
  float3 up = abs(ww.y) > 0.95 ? float3(0.0, 0.0, 1.0) : float3(0.0, 1.0, 0.0);
  float3 uu = normalize(cross(up, ww));
  float3 vv = cross(ww, uu);
  float fov = lerp(2.4, 1.2, saturate(iZoom));
  float3 rd = normalize(p.x * uu + p.y * vv + fov * ww);

  // Background: deep-space vertical gradient with a faint nebula tint.
  float3 sky = lerp(float3(0.015, 0.02, 0.045), float3(0.06, 0.04, 0.10), saturate(p.y * 0.5 + 0.6));
  sky += float3(0.10, 0.05, 0.14) * pow(saturate(1.0 - length(p) * 0.55), 3.0);

  // March.
  float t = 0.0;
  float glow = 0.0;
  bool hit = false;
  float iter = 0.0;
  float4 trapHit = float4(0.0, 0.0, 0.0, 0.0);
  [loop]
  for (int i = 0; i < 160; i++) {
    float3 pos = ro + rd * t;
    float4 de = bulbDE(pos);
    float d = de.x;
    glow += 0.018 / (0.02 + d * d * 40.0);   // silhouette / proximity glow
    if (d < 0.0008 * t + 0.0004) { hit = true; trapHit = de; iter = float(i); break; }
    t += d * 0.85;
    if (t > 8.0) break;
    iter = float(i);
  }

  float3 col = sky;

  if (hit) {
    float3 pos = ro + rd * t;
    float3 n = calcNormal(pos);

    // AO from how quickly the ray escaped (cheap, very effective on fractals).
    float ao = saturate(1.0 - iter / 90.0);
    ao = pow(ao, 1.3);

    // Lights.
    float3 keyDir = normalize(float3(0.7, 0.65, 0.35));
    float3 fillDir = normalize(float3(-0.5, 0.2, -0.6));
    float diff = saturate(dot(n, keyDir));
    float fill = saturate(dot(n, fillDir));
    float sh = softShadow(pos + n * 0.003, keyDir);
    float fres = pow(saturate(1.0 + dot(rd, n)), 4.0);
    float spec = pow(saturate(dot(reflect(rd, n), keyDir)), 48.0);

    // Orbit-trap iridescence: blend palette samples driven by the trap channels.
    float3 base = palette(0.35 + 0.7 * trapHit.y + iTime * 0.03);
    base = lerp(base, palette(0.1 + 1.4 * sqrt(trapHit.w) + iTime * 0.02), 0.5);

    float3 lit = base * (0.10 + 0.95 * diff * sh) * ao;       // key
    lit += base * 0.22 * fill * ao;                            // cold fill
    lit += float3(0.9, 0.95, 1.05) * spec * sh * 0.6;          // crisp highlight
    lit += palette(0.55 + iTime * 0.05) * fres * 0.7;          // iridescent rim

    // Distance fog into the sky for depth.
    float fog = 1.0 - exp(-max(t - iCamDist, 0.0) * 0.25);
    col = lerp(lit, sky, fog * 0.6);
  }

  // Volumetric silhouette glow — jewel-toned halo around the bulb.
  col += palette(0.5 + iTime * 0.04) * glow * 0.06;

  // Output HDR (linear); pass 2 does bloom + tonemap. Pack a "brightness key"
  // in alpha so the bloom pass can isolate the hottest pixels.
  float lum = dot(col, float3(0.2126, 0.7152, 0.0722));
  return float4(col, lum);
}
`;

// ── Pass 2: bloom + ACES tonemap + vignette ────────────────────────────────────
const PS_POST_SOURCE = `
cbuffer Frame : register(b0) {
  float2 iResolution;
  float  iTime;
  float  iZoom;
};
Texture2D Src : register(t0);
SamplerState Smp : register(s0);

float3 aces(float3 x) {
  float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return saturate((x * (a * x + b)) / (x * (c * x + d) + e));
}

float4 main(float4 fragPos : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 res = max(iResolution, float2(1.0, 1.0));
  float2 px = 1.0 / res;

  float3 hdr = Src.Sample(Smp, uv).rgb;

  // Radial bloom: sample a small spiral of taps, keeping only the bright key
  // (stored in alpha by pass 1) for a clean glow around the silhouette.
  float3 bloom = float3(0.0, 0.0, 0.0);
  float total = 0.0;
  [unroll]
  for (int i = 0; i < 24; i++) {
    float a = float(i) * 2.39996323;          // golden angle
    float r = 1.0 + float(i) * 0.9;
    float2 off = float2(cos(a), sin(a)) * r * px * 3.0;
    float4 s = Src.Sample(Smp, uv + off);
    float key = smoothstep(0.55, 1.4, s.a);   // isolate bright pixels
    float w = 1.0 / (1.0 + r * 0.18);
    bloom += s.rgb * key * w;
    total += w;
  }
  bloom /= max(total, 1e-3);

  float3 col = hdr + bloom * 0.85;

  // Gentle exposure breathing for a living feel.
  col *= 1.05 + 0.05 * sin(iTime * 0.4);

  // ACES filmic tonemap.
  col = aces(col * 1.1);

  // Vignette.
  float2 q = fragPos.xy / res;
  float vig = pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.30);
  col *= lerp(0.55, 1.05, vig);

  // Gamma.
  col = pow(col, 1.0 / 2.2);
  return float4(col, 1.0);
}
`;

function main(): void {
  const win = gpu.createWindow({ title: 'Mandelbulb — ray-marched on the GPU', width: WIDTH, height: HEIGHT, borderless: true });
  const { w: cw, h: ch } = win.clientSize();
  const g = gpu.createDevice(win.hwnd, { width: cw, height: ch });

  // Compile both stages; on failure, tear down cleanly and exit non-zero.
  let vs: bigint;
  let psMarch: bigint;
  let psPost: bigint;
  let vsCode: gpu.CompiledShader;
  let marchCode: gpu.CompiledShader;
  let postCode: gpu.CompiledShader;
  try {
    vsCode = gpu.compile(VS_SOURCE, 'main', 'vs_5_0');
    marchCode = gpu.compile(PS_MARCH_SOURCE, 'main', 'ps_5_0');
    postCode = gpu.compile(PS_POST_SOURCE, 'main', 'ps_5_0');
    vs = gpu.makeVertexShader(vsCode);
    psMarch = gpu.makePixelShader(marchCode);
    psPost = gpu.makePixelShader(postCode);
  } catch (err) {
    console.error(String((err as Error).message));
    comReleaseSafe(g.backBufferRTV);
    comReleaseSafe(g.swapChain);
    comReleaseSafe(g.context);
    comReleaseSafe(g.device);
    win.destroy();
    process.exit(1);
  }

  // HDR intermediate target for the marched scene (so bloom + ACES work in linear).
  const hdr = gpu.makeTexture({ w: cw, h: ch, format: gpu.DXGI_FORMAT_R16G16B16A16_FLOAT, rtv: true, srv: true });
  const samp = gpu.makeSampler({ filter: gpu.D3D11_FILTER_MIN_MAG_MIP_LINEAR, address: gpu.D3D11_TEXTURE_ADDRESS_CLAMP });

  // Constant buffers. March cbuffer is 48 bytes (3 × float4 of payload, 16-aligned).
  const cbMarch = gpu.makeConstantBuffer(48);
  const cbPost = gpu.makeConstantBuffer(16);
  const cbMarchData = Buffer.alloc(48);
  const cbPostData = Buffer.alloc(16);

  // GDI HUD font.
  const hudFont = GDI32.CreateFontW(-18, 0, 0, 0, 600, 0, 0, 0, 0, 0, 0, 4 /* ANTIALIASED_QUALITY */, 0, Buffer.from('Consolas\0', 'utf16le').ptr!);

  // ── Orbit-camera state ────────────────────────────────────────────────────
  let yaw = 0.6; // azimuth (radians)
  let pitch = 0.25; // elevation (radians)
  let zoom = 0.35; // 0 = wide, 1 = close (drives fov)
  let camDist = 2.6; // world-space camera distance
  let dragging = false;
  let lastMx = 0;
  let lastMy = 0;

  console.log('Mandelbulb — power-8 distance-estimator ray-marcher on the GPU.');
  console.log(`  ${g.driver} · ${g.gpuName}`);
  console.log('  Drag to orbit · +/- or W/S / arrows to zoom · ESC to exit.');

  const startTime = performance.now();
  const durationMs = process.env.DEMO_DURATION_MS ? Number(process.env.DEMO_DURATION_MS) : 0;
  let frames = 0;
  let fps = 0;
  let fpsWindowStart = startTime;
  let lastNow = startTime;

  function drawHud(): void {
    hud.draw(g, cw, ch, (dc) => {
      const prevFont = GDI32.SelectObject(dc, hudFont);
      GDI32.SetBkMode(dc, TRANSPARENT_BK);
      const line = `Mandelbulb · ray-marched · ${fps} fps · drag to orbit`;
      const text = Buffer.from(`${line}\0`, 'utf16le');
      const len = line.length;
      GDI32.SetTextColor(dc, 0x000000);
      GDI32.TextOutW(dc, 19, 19, text.ptr!, len);
      GDI32.SetTextColor(dc, 0x00f0d0a0); // BGR: warm gold-white
      GDI32.TextOutW(dc, 18, 18, text.ptr!, len);
      GDI32.SelectObject(dc, prevFont);
    });
  }

  while (!win.shouldClose()) {
    win.pump();
    if (win.shouldClose()) break;

    const now = performance.now();
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;
    const elapsed = (now - startTime) / 1000;

    // ── Input: mouse drag orbits, keys zoom ──────────────────────────────────
    const m = win.getMouse();
    if (m.down) {
      if (!dragging) {
        dragging = true;
        lastMx = m.x;
        lastMy = m.y;
      }
      yaw -= (m.x - lastMx) * 0.008;
      pitch += (m.y - lastMy) * 0.008;
      lastMx = m.x;
      lastMy = m.y;
    } else {
      dragging = false;
    }
    // Slow auto-rotate when the user is not dragging.
    if (!dragging) yaw += dt * 0.18;

    pitch = Math.max(-1.45, Math.min(1.45, pitch));

    let zoomVel = 0;
    if (win.keyDown(VK_OEM_PLUS) || win.keyDown(VK_ADD) || win.keyDown(VK_UP) || win.keyDown(VK_W)) zoomVel += 1;
    if (win.keyDown(VK_OEM_MINUS) || win.keyDown(VK_SUBTRACT) || win.keyDown(VK_DOWN) || win.keyDown(VK_S)) zoomVel -= 1;
    zoom = Math.max(0, Math.min(1, zoom + zoomVel * dt * 0.6));
    // Closer camera + tighter fov as zoom rises.
    camDist = 2.9 - zoom * 1.35;

    // Orbit direction from yaw/pitch (camera is at -dir * camDist).
    const cp = Math.cos(pitch);
    const dirX = Math.cos(yaw) * cp;
    const dirY = Math.sin(pitch);
    const dirZ = Math.sin(yaw) * cp;

    // ── Build the march constant buffer immediately before the consuming call ──
    cbMarchData.writeFloatLE(cw, 0); // iResolution.x
    cbMarchData.writeFloatLE(ch, 4); // iResolution.y
    cbMarchData.writeFloatLE(elapsed, 8); // iTime
    cbMarchData.writeFloatLE(zoom, 12); // iZoom
    cbMarchData.writeFloatLE(dirX, 16); // iCamDir.x
    cbMarchData.writeFloatLE(dirY, 20); // iCamDir.y
    cbMarchData.writeFloatLE(dirZ, 24); // iCamDir.z
    cbMarchData.writeFloatLE(camDist, 28); // iCamDist
    cbMarchData.writeFloatLE(0, 32);
    cbMarchData.writeFloatLE(0, 36);
    cbMarchData.writeFloatLE(0, 40);
    cbMarchData.writeFloatLE(0, 44);
    gpu.updateConstantBuffer(cbMarch, cbMarchData);

    // Pass 1: ray-march into the HDR target.
    gpu.setRenderTargets([hdr.rtv!]);
    gpu.setViewport(cw, ch);
    gpu.clear(hdr.rtv!, [0, 0, 0, 0]);
    gpu.vsSet(vs);
    gpu.psSet(psMarch, { cb: [cbMarch] });
    gpu.drawFullscreenTriangle();

    // Unbind the HDR target before sampling it as a SRV.
    gpu.setRenderTargets([]);

    // Pass 2: bloom + ACES tonemap + vignette to the back buffer.
    cbPostData.writeFloatLE(cw, 0);
    cbPostData.writeFloatLE(ch, 4);
    cbPostData.writeFloatLE(elapsed, 8);
    cbPostData.writeFloatLE(zoom, 12);
    gpu.updateConstantBuffer(cbPost, cbPostData);

    gpu.setRenderTargets([g.backBufferRTV]);
    gpu.setViewport(cw, ch);
    gpu.clear(g.backBufferRTV, [0.01, 0.01, 0.02, 1]);
    gpu.vsSet(vs);
    gpu.psSet(psPost, { cb: [cbPost], srv: [hdr.srv!], samp: [samp] });
    gpu.drawFullscreenTriangle();

    drawHud();
    g.present(false);

    frames += 1;
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
  comReleaseSafe(samp);
  comReleaseSafe(cbPost);
  comReleaseSafe(cbMarch);
  comReleaseSafe(hdr.srv);
  comReleaseSafe(hdr.rtv);
  comReleaseSafe(hdr.tex);
  comReleaseSafe(psPost);
  comReleaseSafe(psMarch);
  comReleaseSafe(vs);
  gpu.blobRelease(postCode.blob);
  gpu.blobRelease(marchCode.blob);
  gpu.blobRelease(vsCode.blob);
  comReleaseSafe(g.backBufferRTV);
  comReleaseSafe(g.swapChain);
  comReleaseSafe(g.context);
  comReleaseSafe(g.device);
  win.destroy();
  process.exit(0);
}

function comReleaseSafe(ptr: bigint | undefined): void {
  if (ptr !== undefined && ptr !== 0n) gpu.comRelease(ptr);
}

main();
