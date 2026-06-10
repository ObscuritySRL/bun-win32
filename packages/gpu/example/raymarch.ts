/**
 * Raymarch — a soft-shadowed sphere orbiting over a checkerboard plane, raymarched
 * per pixel in a runtime-compiled HLSL shader.
 *
 * A fullscreen-triangle pixel shader sphere-traces a signed-distance scene (sphere +
 * plane), shades it with a sun light, soft shadows, ambient occlusion, and a fresnel
 * rim, then tone-maps to the swap chain. The camera orbits slowly. Paced by vsync
 * present (never Bun.sleep — 15.6 ms quantization). DEMO_DURATION_MS self-exits;
 * CAPTURE_PNG captures the LAST frame before present (back-buffer contents are
 * undefined after Present with DXGI_SWAP_EFFECT_DISCARD).
 *
 * APIs demonstrated:
 * - createWindow / createDevice (window + swap chain, ESC to quit)
 * - compile / makeVertexShader / makePixelShader (runtime HLSL)
 * - makeConstantBuffer / updateConstantBuffer (per-frame uniforms)
 * - setRenderTargets / setViewport / clear / vsSet / psSet / drawFullscreenTriangle
 * - captureBackBuffer (CAPTURE_PNG hook, pre-present)
 *
 * Run: bun run example/raymarch.ts
 */
import {
  blobRelease,
  captureBackBuffer,
  clear,
  comRelease,
  compile,
  createDevice,
  createWindow,
  destroyDevice,
  drawFullscreenTriangle,
  formatGrid,
  makeConstantBuffer,
  makePixelShader,
  makeVertexShader,
  psSet,
  setRenderTargets,
  setViewport,
  updateConstantBuffer,
  vsSet,
} from '@bun-win32/gpu';

const RAYMARCH_PS = `
cbuffer Frame : register(b0) { float2 iResolution; float iTime; float pad; };

float sdSphere(float3 p, float radius) { return length(p) - radius; }

float2 mapScene(float3 p) {
  float sphere = sdSphere(p - float3(0.0, 1.0 + 0.25 * sin(iTime * 1.3), 0.0), 1.0);
  float plane = p.y;
  return sphere < plane ? float2(sphere, 1.0) : float2(plane, 2.0);
}

float3 sceneNormal(float3 p) {
  float2 e = float2(0.001, 0.0);
  return normalize(float3(
    mapScene(p + e.xyy).x - mapScene(p - e.xyy).x,
    mapScene(p + e.yxy).x - mapScene(p - e.yxy).x,
    mapScene(p + e.yyx).x - mapScene(p - e.yyx).x));
}

float softShadow(float3 origin, float3 direction) {
  float shadow = 1.0;
  float travelled = 0.02;
  for (int step = 0; step < 48; step += 1) {
    float distance = mapScene(origin + direction * travelled).x;
    if (distance < 0.001) return 0.0;
    shadow = min(shadow, 12.0 * distance / travelled);
    travelled += clamp(distance, 0.01, 0.5);
    if (travelled > 12.0) break;
  }
  return saturate(shadow);
}

float4 main(float4 fragment : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float2 screen = (uv * 2.0 - 1.0) * float2(iResolution.x / iResolution.y, -1.0);
  float angle = iTime * 0.4;
  float3 eye = float3(4.2 * sin(angle), 2.2, 4.2 * cos(angle));
  float3 target = float3(0.0, 0.9, 0.0);
  float3 forward = normalize(target - eye);
  float3 right = normalize(cross(float3(0, 1, 0), forward));
  float3 up = cross(forward, right);
  float3 rayDirection = normalize(forward * 1.7 + right * screen.x + up * screen.y);

  float travelled = 0.0;
  float material = 0.0;
  for (int step = 0; step < 96; step += 1) {
    float2 hit = mapScene(eye + rayDirection * travelled);
    if (hit.x < 0.001) { material = hit.y; break; }
    travelled += hit.x;
    if (travelled > 24.0) break;
  }

  float3 sun = normalize(float3(0.6, 0.8, -0.4));
  float3 sky = lerp(float3(0.65, 0.80, 0.95), float3(0.20, 0.42, 0.75), saturate(rayDirection.y * 1.6 + 0.2));
  float3 color = sky + pow(saturate(dot(rayDirection, sun)), 64.0) * float3(1.0, 0.9, 0.7);

  if (material > 0.5) {
    float3 hitPoint = eye + rayDirection * travelled;
    float3 normal = sceneNormal(hitPoint);
    float3 albedo;
    if (material < 1.5) {
      albedo = float3(0.85, 0.25, 0.20);
    } else {
      float2 cell = floor(hitPoint.xz * 1.2);
      float checker = fmod(cell.x + cell.y, 2.0);
      albedo = lerp(float3(0.22, 0.24, 0.28), float3(0.82, 0.84, 0.88), abs(checker));
    }
    float diffuse = saturate(dot(normal, sun));
    float shadow = softShadow(hitPoint + normal * 0.02, sun);
    float occlusion = saturate(0.5 + 0.5 * normal.y);
    float fresnel = pow(1.0 - saturate(dot(normal, -rayDirection)), 3.0);
    color = albedo * (0.18 * occlusion + diffuse * shadow * float3(1.0, 0.95, 0.85));
    color += fresnel * sky * 0.25;
    color = lerp(color, sky, saturate(travelled / 24.0));
  }

  color = color / (1.0 + color);
  return float4(sqrt(color), 1.0);
}`;

const win = createWindow({ title: 'bun-gpu raymarch — ESC quits', width: 960, height: 540, borderless: true });
const { w, h } = win.clientSize();
const gpu = createDevice(win.hwnd, { width: w, height: h });
console.log(`raymarch on ${gpu.gpuName} (${gpu.driver}) ${w}x${h}`);

const vsCode = compile(
  `struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
   VSOut main(uint vid : SV_VertexID) {
     VSOut o; float2 p = float2((vid << 1) & 2, vid & 2);
     o.uv = p; o.pos = float4(p * float2(2,-2) + float2(-1,1), 0, 1); return o; }`,
  'main',
  'vs_5_0',
);
const psCode = compile(RAYMARCH_PS, 'main', 'ps_5_0');
const vs = makeVertexShader(vsCode);
const ps = makePixelShader(psCode);
const frameConstants = makeConstantBuffer(16);
const constantBytes = Buffer.alloc(16);

const durationMs = Bun.env.DEMO_DURATION_MS ? Math.max(0, Number(Bun.env.DEMO_DURATION_MS)) : 0;
const capturePath = Bun.env.CAPTURE_PNG ?? '';
const start = performance.now();
let frames = 0;

while (!win.shouldClose()) {
  win.pump();
  if (win.shouldClose()) break;
  const elapsed = performance.now() - start;
  const lastFrame = durationMs > 0 && elapsed >= durationMs;

  constantBytes.writeFloatLE(w, 0);
  constantBytes.writeFloatLE(h, 4);
  constantBytes.writeFloatLE(elapsed / 1000, 8);
  constantBytes.writeFloatLE(0, 12);
  updateConstantBuffer(frameConstants, constantBytes);

  setRenderTargets([gpu.backBufferRTV]);
  setViewport(w, h);
  clear(gpu.backBufferRTV, [0, 0, 0, 1]);
  vsSet(vs);
  psSet(ps, { cb: [frameConstants] });
  drawFullscreenTriangle();

  if (lastFrame && capturePath !== '') {
    const stats = captureBackBuffer(gpu, capturePath);
    console.log(formatGrid(stats));
    console.log(`[shot] ok=${stats.ok} nonBlack=${stats.nonBlackFrac.toFixed(3)} meanLuma=${stats.meanLuma.toFixed(3)} ${stats.width}x${stats.height} -> ${stats.path}`);
  }

  gpu.present(true);
  frames += 1;
  if (lastFrame) break;
}

console.log(`${frames} frames over ${((performance.now() - start) / 1000).toFixed(1)} s`);
comRelease(frameConstants);
comRelease(ps);
comRelease(vs);
blobRelease(psCode.blob);
blobRelease(vsCode.blob);
win.destroy();
destroyDevice();
