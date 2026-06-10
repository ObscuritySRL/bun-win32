/**
 * Shader TTY — a runtime-compiled HLSL plasma rendered by the GPU and presented as
 * truecolor half-blocks in your terminal.
 *
 * Renders a fullscreen-triangle pixel shader into an offscreen render target sized
 * to the terminal surface, reads it back RowPitch-correctly every frame, repacks
 * RGBA → RGB, and hands the bytes to @bun-win32/terminal's Term framebuffer
 * (cross-package example import; the published package does not depend on terminal).
 * DEMO_DURATION_MS self-exits; CAPTURE_PNG writes the final terminal frame.
 *
 * APIs demonstrated:
 * - @bun-win32/gpu: compile / makeVertexShader / makePixelShader (runtime HLSL)
 * - @bun-win32/gpu: makeTexture / readbackTexture (offscreen RTV → CPU pixels)
 * - @bun-win32/gpu: makeConstantBuffer / updateConstantBuffer / drawFullscreenTriangle
 * - @bun-win32/terminal: Term.pixels / present / toPNG (pixel framebuffer sink)
 *
 * Run: bun run example/shader-tty.ts
 */
import {
  clear,
  comRelease,
  compile,
  createComputeDevice,
  destroyDevice,
  drawFullscreenTriangle,
  makeConstantBuffer,
  makePixelShader,
  makeTexture,
  makeVertexShader,
  psSet,
  readbackTexture,
  setRenderTargets,
  setViewport,
  updateConstantBuffer,
  vsSet,
} from '@bun-win32/gpu';
import { Term } from '@bun-win32/terminal';

const surface = new Term(220, 64, { mode: 'half' });
const W = surface.width;
const H = surface.height;

const gpu = createComputeDevice();
const target = makeTexture({ w: W, h: H, rtv: true });
const vs = makeVertexShader(
  compile(
    `struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
     VSOut main(uint vid : SV_VertexID) {
       VSOut o; float2 p = float2((vid << 1) & 2, vid & 2);
       o.uv = p; o.pos = float4(p * float2(2,-2) + float2(-1,1), 0, 1); return o; }`,
    'main',
    'vs_5_0',
  ),
);
const ps = makePixelShader(
  compile(
    `cbuffer Frame : register(b0) { float2 iResolution; float iTime; float pad; };
     float4 main(float4 fragment : SV_Position, float2 uv : TEXCOORD0) : SV_Target {
       float2 p = (uv - 0.5) * float2(iResolution.x / iResolution.y, 1.0) * 3.0;
       float wave = sin(p.x * 2.0 + iTime) + sin(p.y * 2.3 - iTime * 1.3);
       wave += sin(length(p - float2(sin(iTime * 0.7), cos(iTime * 0.9))) * 4.0 - iTime * 2.0);
       wave += sin(length(p + float2(cos(iTime * 0.5), sin(iTime * 0.8))) * 3.0 + iTime);
       float3 color = 0.5 + 0.5 * cos(wave * 2.0 + float3(0.0, 2.094, 4.188) + iTime * 0.4);
       return float4(color * color, 1.0);
     }`,
    'main',
    'ps_5_0',
  ),
);
const frameConstants = makeConstantBuffer(16);
const constantBytes = Buffer.alloc(16);
const rgb = new Uint8Array(W * H * 3);

const durationMs = Bun.env.DEMO_DURATION_MS ? Math.max(0, Number(Bun.env.DEMO_DURATION_MS)) : 0;
const capturePath = Bun.env.CAPTURE_PNG ?? '';
const start = performance.now();
let frames = 0;

for (;;) {
  const elapsed = performance.now() - start;
  const lastFrame = durationMs > 0 && elapsed >= durationMs;

  constantBytes.writeFloatLE(W, 0);
  constantBytes.writeFloatLE(H, 4);
  constantBytes.writeFloatLE(elapsed / 1000, 8);
  updateConstantBuffer(frameConstants, constantBytes);
  setRenderTargets([target.rtv!]);
  setViewport(W, H);
  clear(target.rtv!, [0, 0, 0, 1]);
  vsSet(vs);
  psSet(ps, { cb: [frameConstants] });
  drawFullscreenTriangle();

  const rgba = readbackTexture(target.tex, W, H);
  for (let index = 0; index < W * H; index += 1) {
    rgb[index * 3] = rgba[index * 4]!;
    rgb[index * 3 + 1] = rgba[index * 4 + 1]!;
    rgb[index * 3 + 2] = rgba[index * 4 + 2]!;
  }
  surface.pixels.set(rgb);
  surface.present();
  frames += 1;

  if (lastFrame) {
    if (capturePath !== '') {
      await Bun.write(capturePath, surface.toPNG());
      console.log(`\n[shot] ${W}x${H} terminal frame -> ${capturePath}`);
    }
    break;
  }
}

console.log(`${frames} frames over ${((performance.now() - start) / 1000).toFixed(1)} s on ${gpu.gpuName} (${gpu.driver})`);
comRelease(frameConstants);
comRelease(ps);
comRelease(vs);
comRelease(target.rtv!);
comRelease(target.tex);
destroyDevice();
