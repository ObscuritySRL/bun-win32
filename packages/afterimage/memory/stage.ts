// The stage: a synthetic desktop that records exactly like a real one. Headless tests and every
// promo image come from here, so they are deterministic and never show anyone's real windows.
// Time is virtual — it only moves when the eye says `advance`. The wallpaper is a pixel shader;
// everything on it is drawn by the scenario through Direct2D.

import {
  DXGI_FORMAT_B8G8R8A8_UNORM,
  type TextureResult,
  comRelease,
  compile,
  drawFullscreenTriangle,
  makeConstantBuffer,
  makePixelShader,
  makeTexture,
  makeVertexShader,
  psSet,
  requireGpu,
  setRenderTargets,
  setViewport,
  updateConstantBuffer,
  vsSet,
} from '@bun-win32/gpu';

import { Painter } from '../shared/painter';
import type { AcquireResult, FrameSource, OutputDescription } from './duplication';
import { drawWorkday, pointerAt } from './workday';

const wallpaperVertexShader = `float4 main(uint vertex : SV_VertexID) : SV_Position {
  float2 corner = float2((vertex << 1) & 2, vertex & 2);
  return float4(corner * float2(2.0, -2.0) + float2(-1.0, 1.0), 0.0, 1.0);
}`;

// Deep blue-violet bloom: a vertical gradient, two soft light sources and a dither so 8-bit
// output never bands.
const wallpaperPixelShader = `cbuffer Size : register(b0) { float2 size; float2 padding; };
float hash(float2 p) { return frac(sin(dot(p, float2(12.9898, 78.233))) * 43758.5453); }
float4 main(float4 position : SV_Position) : SV_Target {
  float2 uv = position.xy / size;
  float aspect = size.x / size.y;
  float3 color = lerp(float3(0.035, 0.05, 0.13), float3(0.09, 0.06, 0.2), uv.y);
  float2 a = (uv - float2(0.7, 0.32)) * float2(aspect, 1.0);
  float2 b = (uv - float2(0.18, 0.92)) * float2(aspect, 1.0);
  color += float3(0.42, 0.28, 0.95) * 0.42 * exp(-dot(a, a) * 2.6);
  color += float3(0.12, 0.62, 0.7) * 0.22 * exp(-dot(b, b) * 3.4);
  color += (hash(position.xy) - 0.5) / 255.0;
  return float4(color, 1.0);
}`;

export class Stage implements FrameSource {
  readonly description: OutputDescription;
  readonly open = true;
  #dirty = true;
  readonly #epoch: number;
  readonly #painter: Painter;
  readonly #pixelShader: bigint;
  #pointer: [number, number] = [-1, -1];
  readonly #scale: number;
  readonly #scenario: string;
  readonly #size: bigint;
  readonly #target: TextureResult;
  #time = 0;
  readonly #vertexShader: bigint;

  constructor(width: number, height: number, scale: number, scenario: string, epoch: number) {
    this.description = { height, index: 0, left: 0, monitor: 0n, name: 'Stage', rotation: 1, top: 0, width };
    this.#scale = scale;
    this.#scenario = scenario;
    this.#epoch = epoch;
    this.#target = makeTexture({ format: DXGI_FORMAT_B8G8R8A8_UNORM, h: height, rtv: true, srv: true, w: width });
    this.#painter = new Painter(requireGpu().device);
    this.#vertexShader = makeVertexShader(compile(wallpaperVertexShader, 'main', 'vs_5_0'));
    this.#pixelShader = makePixelShader(compile(wallpaperPixelShader, 'main', 'ps_5_0'));
    this.#size = makeConstantBuffer(16);
    const size = Buffer.alloc(16);
    size.writeFloatLE(width, 0);
    size.writeFloatLE(height, 4);
    updateConstantBuffer(this.#size, size);
    this.#render();
  }

  /** Virtual milliseconds since the stage began. */
  get time(): number {
    return this.#time;
  }

  acquire(): AcquireResult {
    if (!this.#dirty) return { status: 'idle' };
    this.#dirty = false;
    const [x, y] = this.#pointer;
    return { imageUpdated: true, pointerMoved: true, pointerVisible: true, pointerX: Math.round(x), pointerY: Math.round(y), protectedContent: false, status: 'frame', texture: this.#target.tex };
  }

  advance(milliseconds: number): void {
    this.#time += milliseconds;
    this.#render();
    this.#dirty = true;
  }

  close(): void {
    this.#painter.dispose();
    comRelease(this.#target.tex);
    comRelease(this.#pixelShader);
    comRelease(this.#vertexShader);
    comRelease(this.#size);
  }

  release(): void {}

  reopen(): boolean {
    return true;
  }

  #render(): void {
    const { height, width } = this.description;
    setRenderTargets([this.#target.rtv!]);
    setViewport(width, height);
    vsSet(this.#vertexShader);
    psSet(this.#pixelShader, { cb: [this.#size] });
    drawFullscreenTriangle();
    setRenderTargets([]);
    const dipWidth = width / this.#scale;
    const dipHeight = height / this.#scale;
    const [pointerX, pointerY] = pointerAt(this.#time, dipWidth, dipHeight);
    this.#pointer = [pointerX * this.#scale, pointerY * this.#scale];
    this.#painter.begin(this.#target.tex, 96 * this.#scale);
    if (this.#scenario === 'workday') drawWorkday(this.#painter, this.#time, dipWidth, dipHeight, this.#epoch + this.#time);
    this.#painter.end();
  }
}
