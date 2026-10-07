/**
 * Live sky — an endlessly animated aurora over a mountain lake, as an ordinary framed window.
 *
 * Iris shows windows LIVE: their cards keep playing while you browse, search, and fly between layouts. This is the
 * moving content the promotional reel stages next to static documents — a full-window pixel shader (curtains of
 * green oxygen light with violet fringes, twinkling stars, a mirror-still lake) that loops forever without drifting,
 * unlike a zoom that eventually runs out of floating-point precision.
 *
 * APIs demonstrated:
 * - @bun-win32/gpu — createWindow (framed), createDevice (D3D11 swap chain), compile (runtime HLSL), makeVertexShader,
 *   makePixelShader, makeConstantBuffer / updateConstantBuffer, drawFullscreenTriangle, present (vsync pacing)
 *
 * Run: bun run packages/iris/example/live-sky.ts   (Esc quits; DEMO_DURATION_MS auto-exits)
 */

import User32 from '@bun-win32/user32';
import { clear, compile, createDevice, createWindow, drawFullscreenTriangle, makeConstantBuffer, makePixelShader, makeVertexShader, psSet, setRenderTargets, setViewport, updateConstantBuffer, vsSet } from '@bun-win32/gpu';

const vertexSource = `
struct Output { float4 position : SV_Position; float2 uv : TEXCOORD0; };
Output main(uint id : SV_VertexID) {
  Output output;
  float2 corner = float2((id << 1) & 2, id & 2);
  output.uv = corner;
  output.position = float4(corner * float2(2, -2) + float2(-1, 1), 0, 1);
  return output;
}`;

const pixelSource = `
cbuffer Sky : register(b0) { float time; float aspect; float2 unused; };

float hash(float2 p) { return frac(sin(dot(p, float2(127.1, 311.7))) * 43758.5453); }

float valueNoise(float2 p) {
  float2 cell = floor(p);
  float2 f = frac(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(cell);
  float b = hash(cell + float2(1, 0));
  float c = hash(cell + float2(0, 1));
  float d = hash(cell + float2(1, 1));
  return lerp(lerp(a, b, f.x), lerp(c, d, f.x), f.y);
}

float fbm(float2 p) {
  float sum = 0.0;
  float amplitude = 0.5;
  for (int octave = 0; octave < 5; octave++) {
    sum += valueNoise(p) * amplitude;
    p = p * 2.03 + float2(17.1, 9.2);
    amplitude *= 0.5;
  }
  return sum;
}

float3 aurora(float2 uv) {
  float3 light = 0.0;
  for (int layer = 0; layer < 4; layer++) {
    float depth = layer / 3.0;
    float x = uv.x * (1.0 + depth * 0.6) + layer * 1.7;
    float drift = time * (0.05 + depth * 0.03);
    float centre = 0.30 + 0.07 * sin(x * 1.6 + drift * 3.0 + layer) + (fbm(float2(x * 1.4 + drift, layer * 3.0)) - 0.5) * 0.22;
    float distance = uv.y - centre;
    float curtain = exp(-max(distance, 0.0) * 42.0) * exp(-max(-distance, 0.0) * 6.5);
    float rays = pow(0.5 + 0.5 * sin(x * 46.0 + fbm(float2(x * 6.0, time * 0.35 + layer)) * 9.0), 3.0);
    float shimmer = 0.65 + 0.35 * fbm(float2(x * 3.0 - time * 0.4, layer));
    float3 green = float3(0.16, 1.0, 0.58);
    float3 violet = float3(0.62, 0.28, 1.0);
    float3 colour = lerp(green, violet, saturate(-distance * 3.2 - 0.05));
    light += colour * curtain * (0.35 + 0.65 * rays) * shimmer * (0.55 - depth * 0.25);
  }
  return light;
}

float mountains(float x) {
  float peaks = 1.0 - abs(sin(x * 1.9 + 0.6));
  float ridges = 1.0 - abs(sin(x * 5.3 + 1.7));
  return 0.74 - peaks * peaks * 0.11 - ridges * 0.03 - fbm(float2(x * 9.0, 0.5)) * 0.025;
}

float3 sky(float2 uv) {
  float3 colour = lerp(float3(0.01, 0.03, 0.07), float3(0.0, 0.0, 0.015), saturate(1.0 - uv.y * 1.4));
  float2 starSpace = uv * float2(aspect, 1.0) * 140.0;
  float2 starCell = floor(starSpace);
  float2 starOffset = frac(starSpace) - 0.5 - (float2(hash(starCell + 7.0), hash(starCell + 11.0)) - 0.5) * 0.6;
  float twinkle = 0.55 + 0.45 * sin(time * (2.0 + hash(starCell + 3.1) * 4.0) + hash(starCell) * 40.0);
  float star = step(0.993, hash(starCell)) * smoothstep(0.16, 0.0, length(starOffset)) * twinkle;
  colour += star * 0.8 * saturate(1.0 - uv.y * 1.1);
  colour += aurora(uv);
  return colour;
}

float4 main(float4 position : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
  float x = uv.x * aspect;
  float horizon = 0.78;
  float3 colour;
  if (uv.y < horizon) {
    colour = sky(float2(x, uv.y));
    float ridge = mountains(x);
    if (uv.y > ridge) colour = lerp(float3(0.004, 0.008, 0.014), colour * 0.08, saturate((uv.y - ridge) * -40.0 + 1.0));
  } else {
    float mirrored = horizon - (uv.y - horizon);
    float ripple = sin(uv.y * 220.0 - time * 1.6) * 0.0016 * (uv.y - horizon) * 8.0;
    float2 reflected = float2(x + ripple, mirrored);
    colour = sky(reflected) * 0.55;
    if (mirrored > mountains(reflected.x)) colour = float3(0.004, 0.008, 0.014);
    colour *= 0.85 - (uv.y - horizon) * 1.2;
  }
  colour = 1.0 - exp(-colour * 1.6);
  return float4(pow(saturate(colour), 0.92), 1.0);
}`;

const window = createWindow({ borderless: false, height: 620, title: 'Live sky — aurora over the lake', width: 900 });
const { h: height, w: width } = window.clientSize();
const gpu = createDevice(window.hwnd, { height, width });
const vertexShader = makeVertexShader(compile(vertexSource, 'main', 'vs_5_0'));
const pixelShader = makePixelShader(compile(pixelSource, 'main', 'ps_5_0'));
const constants = makeConstantBuffer(16);
const data = Buffer.alloc(16);
const started = performance.now();
const duration = Bun.env.DEMO_DURATION_MS ? Number(Bun.env.DEMO_DURATION_MS) : Infinity;

// Not window.shouldClose(): it also polls Escape globally, and a staged demo must not quit when Esc is pressed elsewhere.
while (User32.IsWindow(window.hwnd) !== 0 && performance.now() - started < duration) {
  window.pump();
  const size = window.clientSize();
  data.writeFloatLE((performance.now() - started) / 1000, 0);
  data.writeFloatLE(size.w / size.h, 4);
  updateConstantBuffer(constants, data);
  setRenderTargets([gpu.backBufferRTV]);
  setViewport(width, height);
  clear(gpu.backBufferRTV, [0, 0, 0, 1]);
  vsSet(vertexShader);
  psSet(pixelShader, { cb: [constants] });
  drawFullscreenTriangle();
  gpu.present(true);
  await Bun.sleep(0);
}
window.destroy();
