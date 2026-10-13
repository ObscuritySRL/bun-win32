// The renderer draws one frame of the eye into a surface (the overlay's swap chain, or an offscreen
// texture in headless mode): the scene pass on the GPU, then text through Direct2D on the same
// target. It owns the GPU-side inputs the scene samples — the moment (a shared texture the worker
// composes), its mip-blurred copy, the waveform bins, the change mask and the timeline marks.

import { FFIType, ptr } from 'bun:ffi';

import {
  CTX_COPY_SUBRESOURCE_REGION,
  CTX_UPDATE_SUBRESOURCE,
  D3D11_BIND_RENDER_TARGET,
  D3D11_BIND_SHADER_RESOURCE,
  DEV_CREATE_SHADER_RESOURCE_VIEW,
  DEV_CREATE_TEXTURE_2D,
  DXGI_FORMAT_B8G8R8A8_UNORM,
  DXGI_FORMAT_R32_FLOAT,
  type StructuredBuffer,
  type TextureResult,
  comRelease,
  compile,
  drawFullscreenTriangle,
  generateMips,
  makeConstantBuffer,
  makePixelShader,
  makeSampler,
  makeStructuredBuffer,
  makeTexture,
  makeVertexShader,
  psSet,
  requireGpu,
  setRenderTargets,
  setViewport,
  updateConstantBuffer,
  updateDynamicBuffer,
  vcall,
  vsSet,
} from '@bun-win32/gpu';

import { callOut } from '../shared/com';
import { Painter } from '../shared/painter';
import { fullscreenVertexShader, sceneLayout, scenePixelShader } from './shaders';

const formatR8Unorm = 0x3d;
const markCapacity = 0x100;
const miscGenerateMips = 0x1;

export type Scene = Parameters<(typeof sceneLayout)['write']>[0];

/** Somewhere to draw: a render-target view and the texture behind it (for Direct2D). */
export interface Surface {
  height: number;
  renderTarget: bigint;
  texture: bigint;
  width: number;
}

export interface Mark {
  /** 0 for a moment (dot at `from`), 1 for a gap (hatched span from–to). */
  kind: 0 | 1;
  from: number;
  to: number;
}

export class Renderer {
  readonly painter: Painter;
  #bins: TextureResult | null = null;
  #binsLength = 0;
  #blur: { texture: bigint; view: bigint } | null = null;
  #blurSource = 0n;
  readonly #constants: bigint;
  readonly #markBytes = Buffer.alloc(markCapacity * 16);
  #markCount = 0;
  readonly #marks: StructuredBuffer;
  #moment = 0n;
  readonly #momentViews = new Map<bigint, bigint>();
  readonly #pixelShader: bigint;
  readonly #sampler: bigint;
  readonly #sceneBytes = Buffer.alloc(sceneLayout.byteSize);
  #shimmer: TextureResult | null = null;
  #shimmerSize: [number, number] = [0, 0];
  readonly #vertexShader: bigint;

  constructor() {
    const { device } = requireGpu();
    this.painter = new Painter(device);
    this.#vertexShader = makeVertexShader(compile(fullscreenVertexShader, 'main', 'vs_5_0'));
    this.#pixelShader = makePixelShader(compile(scenePixelShader, 'main', 'ps_5_0'));
    this.#sampler = makeSampler();
    this.#constants = makeConstantBuffer(sceneLayout.byteSize);
    this.#marks = makeStructuredBuffer({ count: markCapacity, cpuWritable: true, srv: true, stride: 16 });
  }

  get markCount(): number {
    return this.#markCount;
  }

  dispose(): void {
    for (const view of this.#momentViews.values()) comRelease(view);
    this.#releaseBlur();
    if (this.#bins !== null) comRelease(this.#bins.tex);
    if (this.#shimmer !== null) comRelease(this.#shimmer.tex);
    comRelease(this.#marks.buffer);
    comRelease(this.#constants);
    comRelease(this.#pixelShader);
    comRelease(this.#vertexShader);
    comRelease(this.#sampler);
    this.painter.dispose();
  }

  /** Draw the scene, then let `text` paint on top in DIPs. */
  draw(surface: Surface, scene: Scene, scale: number, text: (painter: Painter) => void): void {
    if (this.#moment === 0n) return;
    this.#refreshBlur(surface);
    updateConstantBuffer(this.#constants, sceneLayout.writeInto(scene, this.#sceneBytes));
    setRenderTargets([surface.renderTarget]);
    setViewport(surface.width, surface.height);
    vsSet(this.#vertexShader);
    psSet(this.#pixelShader, { cb: [this.#constants], samp: [this.#sampler], srv: [this.#momentViews.get(this.#moment)!, this.#blur!.view, this.#bins!.srv!, this.#shimmer!.srv!, this.#marks.srv!] });
    drawFullscreenTriangle();
    psSet(this.#pixelShader, { srv: [0n, 0n, 0n, 0n, 0n] });
    setRenderTargets([]);
    this.painter.begin(surface.texture, 96 * scale);
    text(this.painter);
    this.painter.end();
  }

  /** Initialise empty inputs so the first frame can draw before data arrives. */
  prepare(tilesAcross: number, tilesDown: number, binCount: number): void {
    this.setShimmer(new Uint8Array(tilesAcross * tilesDown), tilesAcross, tilesDown);
    this.setBins(new Float32Array(binCount));
    this.setMarks([]);
  }

  /** Waveform amplitudes, oldest first (0–1). */
  setBins(bins: Float32Array): void {
    const { context } = requireGpu();
    if (this.#bins === null || this.#binsLength !== bins.length) {
      if (this.#bins !== null) comRelease(this.#bins.tex);
      this.#bins = makeTexture({ format: DXGI_FORMAT_R32_FLOAT, h: 1, srv: true, w: bins.length });
      this.#binsLength = bins.length;
    }
    vcall(context, CTX_UPDATE_SUBRESOURCE, [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], [this.#bins.tex, 0, null, ptr(bins), bins.length * 4, 0], FFIType.void);
  }

  /** Moments and gaps along the track, in pixels. */
  setMarks(marks: readonly Mark[]): void {
    this.#markCount = Math.min(markCapacity, marks.length);
    for (let index = 0; index < this.#markCount; index += 1) {
      const mark = marks[index]!;
      this.#markBytes.writeFloatLE(mark.from, index * 16);
      this.#markBytes.writeFloatLE(mark.to, index * 16 + 4);
      this.#markBytes.writeFloatLE(mark.kind, index * 16 + 8);
      this.#markBytes.writeFloatLE(0, index * 16 + 12);
    }
    updateDynamicBuffer(this.#marks.buffer, this.#markBytes);
  }

  /** A new moment arrived in `texture` (an eye-side handle to one of the worker's shared views). */
  setMoment(texture: bigint): void {
    if (!this.#momentViews.has(texture)) this.#momentViews.set(texture, callOut(requireGpu().device, DEV_CREATE_SHADER_RESOURCE_VIEW, [FFIType.u64, FFIType.ptr], [texture, null], 'CreateShaderResourceView(moment)'));
    this.#moment = texture;
    this.#blurSource = 0n;
  }

  /** Which tiles just changed (255) — the scene glows them briefly. */
  setShimmer(mask: Uint8Array, tilesAcross: number, tilesDown: number): void {
    const { context } = requireGpu();
    if (this.#shimmer === null || this.#shimmerSize[0] !== tilesAcross || this.#shimmerSize[1] !== tilesDown) {
      if (this.#shimmer !== null) comRelease(this.#shimmer.tex);
      this.#shimmer = makeTexture({ format: formatR8Unorm, h: tilesDown, srv: true, w: tilesAcross });
      this.#shimmerSize = [tilesAcross, tilesDown];
    }
    vcall(context, CTX_UPDATE_SUBRESOURCE, [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], [this.#shimmer.tex, 0, null, ptr(mask), tilesAcross, 0], FFIType.void);
  }

  /** Copy the moment into the mip chain the backdrop blurs from — once per moment, not per frame. */
  #refreshBlur(surface: Surface): void {
    if (this.#blur === null) {
      const description = new Uint32Array(new ArrayBuffer(44));
      description.set([surface.width, surface.height, 0, 1, DXGI_FORMAT_B8G8R8A8_UNORM, 1, 0, 0, D3D11_BIND_SHADER_RESOURCE | D3D11_BIND_RENDER_TARGET, 0, miscGenerateMips]);
      const { device } = requireGpu();
      const texture = callOut(device, DEV_CREATE_TEXTURE_2D, [FFIType.ptr, FFIType.ptr], [ptr(description), null], 'CreateTexture2D(blur)');
      this.#blur = { texture, view: callOut(device, DEV_CREATE_SHADER_RESOURCE_VIEW, [FFIType.u64, FFIType.ptr], [texture, null], 'CreateShaderResourceView(blur)') };
      this.#blurSource = 0n;
    }
    if (this.#blurSource === this.#moment) return;
    vcall(requireGpu().context, CTX_COPY_SUBRESOURCE_REGION, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.ptr], [this.#blur.texture, 0, 0, 0, 0, this.#moment, 0, null], FFIType.void);
    generateMips(this.#blur.view);
    this.#blurSource = this.#moment;
  }

  #releaseBlur(): void {
    if (this.#blur === null) return;
    comRelease(this.#blur.view);
    comRelease(this.#blur.texture);
    this.#blur = null;
  }
}
