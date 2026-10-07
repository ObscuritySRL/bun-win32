// The frame renderer. Draws are recorded into a CPU-side Float32Array (one 256-byte record each) and uploaded with a
// single Map(WRITE_DISCARD) per frame; executing a draw costs at most a shader switch, a texture bind, and Draw(4, i*4).
// All per-frame FFI scratch memory lives in one ArrayBuffer whose backing store never moves.

import { FFIType } from 'bun:ffi';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  compileCached,
  CTX_CLEAR_RENDER_TARGET_VIEW,
  CTX_COPY_RESOURCE,
  CTX_COPY_SUBRESOURCE_REGION,
  CTX_GENERATE_MIPS,
  CTX_IA_SET_PRIMITIVE_TOPOLOGY,
  CTX_MAP,
  CTX_OM_SET_BLEND_STATE,
  CTX_OM_SET_RENDER_TARGETS,
  CTX_PS_SET_CONSTANT_BUFFERS,
  CTX_PS_SET_SAMPLERS,
  CTX_PS_SET_SHADER,
  CTX_PS_SET_SHADER_RESOURCES,
  CTX_RS_SET_STATE,
  CTX_RS_SET_VIEWPORTS,
  CTX_UNMAP,
  CTX_UPDATE_SUBRESOURCE,
  CTX_VS_SET_CONSTANT_BUFFERS,
  CTX_VS_SET_SHADER,
  CTX_VS_SET_SHADER_RESOURCES,
  blobRelease,
  DEV_CREATE_BLEND_STATE,
  DEV_CREATE_BUFFER,
  DEV_CREATE_PIXEL_SHADER,
  DEV_CREATE_RASTERIZER_STATE,
  DEV_CREATE_RENDER_TARGET_VIEW,
  DEV_CREATE_SAMPLER_STATE,
  DEV_CREATE_SHADER_RESOURCE_VIEW,
  DEV_CREATE_TEXTURE_2D,
  DEV_CREATE_VERTEX_SHADER,
} from '@bun-win32/gpu';

import type { Device } from './device';
import { composeTransform } from './geometry';
import { copyMemory } from './native';
import { backdropShader, blurShader, cardShader, DRAW_RECORD_FLOATS, panelShader, textShader, vertexShader } from './shaders';
import { comRelease, hex, vcall } from './winrt';

const D3D11_BIND_CONSTANT_BUFFER = 0x04;
const D3D11_BIND_RENDER_TARGET = 0x20;
const D3D11_BIND_SHADER_RESOURCE = 0x08;
const D3D11_BLEND_INV_SRC_ALPHA = 6;
const D3D11_BLEND_ONE = 2;
const D3D11_BLEND_OP_ADD = 1;
const D3D11_CPU_ACCESS_READ = 0x2_0000;
const D3D11_CPU_ACCESS_WRITE = 0x1_0000;
const D3D11_CULL_NONE = 1;
const D3D11_FILL_SOLID = 3;
const D3D11_FILTER_ANISOTROPIC = 0x55;
const D3D11_FILTER_MIN_MAG_MIP_LINEAR = 0x15;
const D3D11_MAP_READ = 1;
const D3D11_MAP_WRITE_DISCARD = 4;
const D3D11_RESOURCE_MISC_BUFFER_STRUCTURED = 0x40;
const D3D11_RESOURCE_MISC_GENERATE_MIPS = 0x01;
const D3D11_TEXTURE_ADDRESS_CLAMP = 3;
const D3D11_USAGE_DEFAULT = 0;
const D3D11_USAGE_DYNAMIC = 2;
const D3D11_USAGE_STAGING = 3;
const D3D11_PRIMITIVE_TOPOLOGY_TRIANGLESTRIP = 5;
const D3D11_BIND_VERTEX_BUFFER = 0x01;
const D3D11_INPUT_PER_INSTANCE_DATA = 1;
const D3D11_USAGE_IMMUTABLE = 1;
const DXGI_FORMAT_R32_UINT = 42;
const CTX_DRAW_INSTANCED = 21;
const CTX_IA_SET_INPUT_LAYOUT = 17;
const CTX_IA_SET_VERTEX_BUFFERS = 18;
const DEV_CREATE_INPUT_LAYOUT = 11;
const DEV_CREATE_QUERY = 24;
const CTX_BEGIN = 27;
const CTX_END = 28;
const CTX_GET_DATA = 29;
const D3D11_QUERY_TIMESTAMP = 2;
const D3D11_QUERY_TIMESTAMP_DISJOINT = 3;
const D3D11_SRV_DIMENSION_BUFFER = 1;
const DXGI_FORMAT_B8G8R8A8_UNORM = 87;
const DXGI_FORMAT_UNKNOWN = 0;

const RECORD_CAPACITY = 4096;
/** Compiled DXBC is cached on disk (keyed by source hash), so warm starts skip FXC entirely. */
const SHADER_CACHE = join(tmpdir(), 'iris-shader-cache');
const HIGHLIGHT_CAPACITY = 8192;

export type ShaderKind = 'backdrop' | 'blur' | 'card' | 'panel' | 'text';

export interface Texture {
  height: number;
  mipLevels: number;
  rtv: bigint;
  srv: bigint;
  texture: bigint;
  width: number;
}

export interface RenderTarget {
  height: number;
  rtv: bigint;
  width: number;
}

/** Per-card appearance, mutated in place every frame (no per-frame allocation). */
export interface CardStyle {
  accent: readonly [number, number, number];
  brightness: number;
  focus: number;
  glare: number;
  glareX: number;
  glareY: number;
  opacity: number;
  radius: number;
  reflection: number;
  saturation: number;
  scan: number;
  shadow: number;
  shadowSigma: number;
  spotlight: number;
}

export interface PanelStyle {
  border: readonly [number, number, number, number];
  fill: readonly [number, number, number, number];
  frost: number;
  frostBrightness: number;
  opacity: number;
  radius: number;
  shadow: number;
  shadowSigma: number;
  sheen: number;
}

export interface BackdropStyle {
  accent: readonly [number, number, number];
  accentGlow: number;
  blur: number;
  brightness: number;
  grain: number;
  opacity: number;
  saturation: number;
  vignette: number;
}

interface PendingDraw {
  kind: ShaderKind;
  texture: bigint;
}

export class Renderer {
  #arena = new ArrayBuffer(4096);
  #bindSlots = new BigUint64Array(this.#arena, 0, 8);
  #blendFactor = new Float32Array(this.#arena, 64, 4);
  #frameData = new Float32Array(this.#arena, 128, 8);
  #mapped = new DataView(this.#arena, 192, 16);
  #mappedBytes = new Uint8Array(this.#arena, 192, 16);
  #viewport = new Float32Array(this.#arena, 256, 6);
  #clearColor = new Float32Array(this.#arena, 320, 4);
  #copyBox = new Uint32Array(this.#arena, 384, 6);

  #records = new Float32Array(new ArrayBuffer(RECORD_CAPACITY * DRAW_RECORD_FLOATS * 4));
  #highlights = new Float32Array(new ArrayBuffer(HIGHLIGHT_CAPACITY * 16));
  #draws: PendingDraw[] = [];
  #highlightCount = 0;
  #world = new Float32Array(16);

  #blendState = 0n;
  #frameBuffer = 0n;
  #highlightBuffer = 0n;
  #highlightView = 0n;
  #linearSampler = 0n;
  #anisotropicSampler = 0n;
  #rasterizerState = 0n;
  #recordBuffer = 0n;
  #recordView = 0n;
  #pixelShaders = new Map<ShaderKind, bigint>();
  #vertexShader = 0n;
  #inputLayout = 0n;
  #indexStream = 0n;
  #streamStride = new Uint32Array(this.#arena, 448, 2);
  #backdropBlurView = 0n;
  #staging = new Map<string, bigint>();

  readonly context: bigint;
  readonly device: Device;
  drawCallsLastFrame = 0;
  /** Pixels per DIP for screen-space chrome: text() and panel() take DIP coordinates and scale them by this. */
  ui = 1;
  readonly gpuTimer: GpuTimer;
  stateChangesLastFrame = 0;
  uploadBytesLastFrame = 0;

  constructor(device: Device) {
    this.device = device;
    this.context = device.context;
    this.#createVertexStage();
    this.gpuTimer = new GpuTimer(device.device, device.context);
    this.#pixelShaders.set('backdrop', this.#createShader(backdropShader, 'backdropMain', 'ps_5_0', DEV_CREATE_PIXEL_SHADER));
    this.#pixelShaders.set('blur', this.#createShader(blurShader, 'blurMain', 'ps_5_0', DEV_CREATE_PIXEL_SHADER));
    this.#pixelShaders.set('card', this.#createShader(cardShader, 'cardMain', 'ps_5_0', DEV_CREATE_PIXEL_SHADER));
    this.#pixelShaders.set('panel', this.#createShader(panelShader, 'panelMain', 'ps_5_0', DEV_CREATE_PIXEL_SHADER));
    this.#pixelShaders.set('text', this.#createShader(textShader, 'textMain', 'ps_5_0', DEV_CREATE_PIXEL_SHADER));

    const blend = Buffer.alloc(264); // D3D11_BLEND_DESC
    blend.writeUInt32LE(1, 8); // BlendEnable
    blend.writeUInt32LE(D3D11_BLEND_ONE, 12);
    blend.writeUInt32LE(D3D11_BLEND_INV_SRC_ALPHA, 16);
    blend.writeUInt32LE(D3D11_BLEND_OP_ADD, 20);
    blend.writeUInt32LE(D3D11_BLEND_ONE, 24);
    blend.writeUInt32LE(D3D11_BLEND_INV_SRC_ALPHA, 28);
    blend.writeUInt32LE(D3D11_BLEND_OP_ADD, 32);
    blend.writeUInt8(0x0f, 36);
    this.#blendState = this.#create(DEV_CREATE_BLEND_STATE, blend, 'CreateBlendState');

    const rasterizer = Buffer.alloc(40); // D3D11_RASTERIZER_DESC
    rasterizer.writeUInt32LE(D3D11_FILL_SOLID, 0);
    rasterizer.writeUInt32LE(D3D11_CULL_NONE, 4);
    rasterizer.writeUInt32LE(1, 24); // DepthClipEnable
    this.#rasterizerState = this.#create(DEV_CREATE_RASTERIZER_STATE, rasterizer, 'CreateRasterizerState');

    this.#anisotropicSampler = this.#createSampler(D3D11_FILTER_ANISOTROPIC, 16, -0.35);
    this.#linearSampler = this.#createSampler(D3D11_FILTER_MIN_MAG_MIP_LINEAR, 1, 0);

    const recordBuffer = this.#createStructuredBuffer(RECORD_CAPACITY, DRAW_RECORD_FLOATS * 4);
    this.#recordBuffer = recordBuffer.buffer;
    this.#recordView = recordBuffer.view;
    const highlightBuffer = this.#createStructuredBuffer(HIGHLIGHT_CAPACITY, 16);
    this.#highlightBuffer = highlightBuffer.buffer;
    this.#highlightView = highlightBuffer.view;

    const frame = Buffer.alloc(24); // D3D11_BUFFER_DESC
    frame.writeUInt32LE(32, 0);
    frame.writeUInt32LE(D3D11_USAGE_DEFAULT, 4);
    frame.writeUInt32LE(D3D11_BIND_CONSTANT_BUFFER, 8);
    const frameOut = Buffer.alloc(8);
    const frameResult = vcall(device.device, DEV_CREATE_BUFFER, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [frame.ptr, null, frameOut.ptr]);
    if (frameResult !== 0) throw new Error(`CreateBuffer(frame) failed: ${hex(frameResult)}`);
    this.#frameBuffer = frameOut.readBigUInt64LE(0);
  }

  #create(slot: number, description: Buffer, label: string): bigint {
    const out = Buffer.alloc(8);
    const result = vcall(this.device.device, slot, [FFIType.ptr, FFIType.ptr], [description.ptr, out.ptr]);
    if (result !== 0) throw new Error(`${label} failed: ${hex(result)}`);
    return out.readBigUInt64LE(0);
  }

  #createTexture2D(description: Buffer, label: string): bigint {
    const out = Buffer.alloc(8);
    const result = vcall(this.device.device, DEV_CREATE_TEXTURE_2D, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [description.ptr, null, out.ptr]);
    if (result !== 0) throw new Error(`${label} failed: ${hex(result)}`);
    return out.readBigUInt64LE(0);
  }

  #createSampler(filter: number, anisotropy: number, lodBias: number): bigint {
    const sampler = Buffer.alloc(52); // D3D11_SAMPLER_DESC
    sampler.writeUInt32LE(filter, 0);
    sampler.writeUInt32LE(D3D11_TEXTURE_ADDRESS_CLAMP, 4);
    sampler.writeUInt32LE(D3D11_TEXTURE_ADDRESS_CLAMP, 8);
    sampler.writeUInt32LE(D3D11_TEXTURE_ADDRESS_CLAMP, 12);
    sampler.writeFloatLE(lodBias, 16);
    sampler.writeUInt32LE(anisotropy, 20);
    sampler.writeUInt32LE(1, 24); // ComparisonFunc NEVER
    sampler.writeFloatLE(3.402_823_466e38, 48); // MaxLOD
    return this.#create(DEV_CREATE_SAMPLER_STATE, sampler, 'CreateSamplerState');
  }

  /** The vertex shader plus the per-instance DRAWINDEX stream: StartInstanceLocation = draw index selects the record. */
  #createVertexStage(): void {
    const compiled = compileCached(vertexShader, 'vertexMain', 'vs_5_0', {}, SHADER_CACHE);
    const shaderOut = Buffer.alloc(8);
    const shaderResult = vcall(this.device.device, DEV_CREATE_VERTEX_SHADER, [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], [compiled.ptr, BigInt(compiled.size), 0n, shaderOut.ptr]);
    if (shaderResult !== 0) throw new Error(`CreateVertexShader failed: ${hex(shaderResult)}`);
    this.#vertexShader = shaderOut.readBigUInt64LE(0);
    const semantic = Buffer.from('DRAWINDEX\0', 'ascii');
    const element = Buffer.alloc(32); // D3D11_INPUT_ELEMENT_DESC
    element.writeBigUInt64LE(BigInt(semantic.ptr), 0);
    element.writeUInt32LE(DXGI_FORMAT_R32_UINT, 12);
    element.writeUInt32LE(D3D11_INPUT_PER_INSTANCE_DATA, 24);
    element.writeUInt32LE(1, 28); // InstanceDataStepRate
    const layoutOut = Buffer.alloc(8);
    const layoutResult = vcall(this.device.device, DEV_CREATE_INPUT_LAYOUT, [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.u64, FFIType.ptr], [element.ptr, 1, compiled.ptr, BigInt(compiled.size), layoutOut.ptr]);
    blobRelease(compiled.blob);
    if (layoutResult !== 0) throw new Error(`CreateInputLayout failed: ${hex(layoutResult)}`);
    this.#inputLayout = layoutOut.readBigUInt64LE(0);
    const indices = new Uint32Array(RECORD_CAPACITY);
    for (let index = 0; index < RECORD_CAPACITY; index += 1) indices[index] = index;
    const description = Buffer.alloc(24);
    description.writeUInt32LE(indices.byteLength, 0);
    description.writeUInt32LE(D3D11_USAGE_IMMUTABLE, 4);
    description.writeUInt32LE(D3D11_BIND_VERTEX_BUFFER, 8);
    const initial = Buffer.alloc(16); // D3D11_SUBRESOURCE_DATA
    initial.writeBigUInt64LE(BigInt(indices.ptr), 0);
    const bufferOut = Buffer.alloc(8);
    const bufferResult = vcall(this.device.device, DEV_CREATE_BUFFER, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [description.ptr, initial.ptr, bufferOut.ptr]);
    if (bufferResult !== 0) throw new Error(`CreateBuffer(draw indices) failed: ${hex(bufferResult)}`);
    this.#indexStream = bufferOut.readBigUInt64LE(0);
  }

  #createShader(source: string, entry: string, target: string, slot: number): bigint {
    const compiled = compileCached(source, entry, target, {}, SHADER_CACHE);
    const out = Buffer.alloc(8);
    const result = vcall(this.device.device, slot, [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], [compiled.ptr, BigInt(compiled.size), 0n, out.ptr]);
    blobRelease(compiled.blob);
    if (result !== 0) throw new Error(`Create shader ${entry} failed: ${hex(result)}`);
    return out.readBigUInt64LE(0);
  }

  #createStructuredBuffer(count: number, stride: number): { buffer: bigint; view: bigint } {
    const description = Buffer.alloc(24);
    description.writeUInt32LE(count * stride, 0);
    description.writeUInt32LE(D3D11_USAGE_DYNAMIC, 4);
    description.writeUInt32LE(D3D11_BIND_SHADER_RESOURCE, 8);
    description.writeUInt32LE(D3D11_CPU_ACCESS_WRITE, 12);
    description.writeUInt32LE(D3D11_RESOURCE_MISC_BUFFER_STRUCTURED, 16);
    description.writeUInt32LE(stride, 20);
    const bufferOut = Buffer.alloc(8);
    const bufferResult = vcall(this.device.device, DEV_CREATE_BUFFER, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [description.ptr, null, bufferOut.ptr]);
    if (bufferResult !== 0) throw new Error(`CreateBuffer(structured) failed: ${hex(bufferResult)}`);
    const buffer = bufferOut.readBigUInt64LE(0);
    const view = Buffer.alloc(24); // D3D11_SHADER_RESOURCE_VIEW_DESC
    view.writeUInt32LE(DXGI_FORMAT_UNKNOWN, 0);
    view.writeUInt32LE(D3D11_SRV_DIMENSION_BUFFER, 4);
    view.writeUInt32LE(0, 8);
    view.writeUInt32LE(count, 12);
    const viewOut = Buffer.alloc(8);
    const viewResult = vcall(this.device.device, DEV_CREATE_SHADER_RESOURCE_VIEW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [buffer, view.ptr, viewOut.ptr]);
    if (viewResult !== 0) throw new Error(`CreateShaderResourceView(structured) failed: ${hex(viewResult)}`);
    return { buffer, view: viewOut.readBigUInt64LE(0) };
  }

  /** A BGRA texture with a shader view; optionally a render target and a full mip chain (for minified window cards). */
  createTexture(width: number, height: number, options: { mips?: boolean; renderTarget?: boolean } = {}): Texture {
    const mips = options.mips === true;
    const renderTarget = options.renderTarget === true || mips;
    const description = Buffer.alloc(44); // D3D11_TEXTURE2D_DESC
    description.writeUInt32LE(width, 0);
    description.writeUInt32LE(height, 4);
    description.writeUInt32LE(mips ? 0 : 1, 8);
    description.writeUInt32LE(1, 12);
    description.writeUInt32LE(DXGI_FORMAT_B8G8R8A8_UNORM, 16);
    description.writeUInt32LE(1, 20);
    description.writeUInt32LE(D3D11_USAGE_DEFAULT, 28);
    description.writeUInt32LE(D3D11_BIND_SHADER_RESOURCE | (renderTarget ? D3D11_BIND_RENDER_TARGET : 0), 32);
    description.writeUInt32LE(mips ? D3D11_RESOURCE_MISC_GENERATE_MIPS : 0, 40);
    const texture = this.#createTexture2D(description, `CreateTexture2D ${width}x${height}`);
    const viewOut = Buffer.alloc(8);
    const viewResult = vcall(this.device.device, DEV_CREATE_SHADER_RESOURCE_VIEW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [texture, null, viewOut.ptr]);
    if (viewResult !== 0) throw new Error(`CreateShaderResourceView failed: ${hex(viewResult)}`);
    let rtv = 0n;
    if (renderTarget) {
      const targetOut = Buffer.alloc(8);
      const targetResult = vcall(this.device.device, DEV_CREATE_RENDER_TARGET_VIEW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [texture, null, targetOut.ptr]);
      if (targetResult !== 0) throw new Error(`CreateRenderTargetView failed: ${hex(targetResult)}`);
      rtv = targetOut.readBigUInt64LE(0);
    }
    let mipLevels = 1;
    if (mips) mipLevels = Math.floor(Math.log2(Math.max(width, height))) + 1;
    return { height, mipLevels, rtv, srv: viewOut.readBigUInt64LE(0), texture, width };
  }

  releaseTexture(texture: Texture): void {
    comRelease(texture.rtv);
    comRelease(texture.srv);
    comRelease(texture.texture);
  }

  /** Upload tightly packed BGRA pixels into mip 0 (then regenerate mips when the texture has them). */
  uploadPixels(texture: Texture, pixels: Uint8Array): void {
    vcall(this.context, CTX_UPDATE_SUBRESOURCE, [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], [texture.texture, 0, null, pixels.ptr, texture.width * 4, 0], FFIType.void);
    if (texture.mipLevels > 1) this.generateMips(texture);
  }

  /** Upload tightly packed BGRA pixels into a sub-rectangle of mip 0, then regenerate mips. */
  uploadRegion(texture: Texture, x: number, y: number, width: number, height: number, pixels: Uint8Array): void {
    const box = this.#copyBox;
    box[0] = x;
    box[1] = y;
    box[2] = 0;
    box[3] = x + width;
    box[4] = y + height;
    box[5] = 1;
    vcall(this.context, CTX_UPDATE_SUBRESOURCE, [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], [texture.texture, 0, box.ptr, pixels.ptr, width * 4, 0], FFIType.void);
    if (texture.mipLevels > 1) this.generateMips(texture);
  }

  /** Copy the top-left width×height region of `source` (a foreign texture, e.g. a capture frame) into mip 0 of `target`. */
  copyRegion(target: Texture, source: bigint, width: number, height: number): void {
    const box = this.#copyBox;
    box[0] = 0;
    box[1] = 0;
    box[2] = 0;
    box[3] = width;
    box[4] = height;
    box[5] = 1;
    vcall(this.context, CTX_COPY_SUBRESOURCE_REGION, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.ptr], [target.texture, 0, 0, 0, 0, source, 0, box.ptr], FFIType.void);
  }

  generateMips(texture: Texture): void {
    vcall(this.context, CTX_GENERATE_MIPS, [FFIType.u64], [texture.srv], FFIType.void);
  }

  /** The heavy-blur wallpaper (t1): sampled by the backdrop and by frosted panels. */
  setBackdropBlur(view: bigint): void {
    this.#backdropBlurView = view;
  }

  /** Synchronously read back mip 0 of a BGRA texture as tightly packed rows (verification captures, OCR). */
  readback(texture: bigint, width: number, height: number): Buffer {
    const key = `${width}x${height}`;
    let staging = this.#staging.get(key);
    if (staging === undefined) {
      const description = Buffer.alloc(44);
      description.writeUInt32LE(width, 0);
      description.writeUInt32LE(height, 4);
      description.writeUInt32LE(1, 8);
      description.writeUInt32LE(1, 12);
      description.writeUInt32LE(DXGI_FORMAT_B8G8R8A8_UNORM, 16);
      description.writeUInt32LE(1, 20);
      description.writeUInt32LE(D3D11_USAGE_STAGING, 28);
      description.writeUInt32LE(D3D11_CPU_ACCESS_READ, 36);
      staging = this.#createTexture2D(description, 'CreateTexture2D(staging)');
      this.#staging.set(key, staging);
    }
    const box = this.#copyBox;
    box[0] = 0;
    box[1] = 0;
    box[2] = 0;
    box[3] = width;
    box[4] = height;
    box[5] = 1;
    vcall(this.context, CTX_COPY_SUBRESOURCE_REGION, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.ptr], [staging, 0, 0, 0, 0, texture, 0, box.ptr], FFIType.void);
    const mappedResult = vcall(this.context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [staging, 0, D3D11_MAP_READ, 0, this.#mappedBytes.ptr]);
    if (mappedResult !== 0) throw new Error(`Map(staging) failed: ${hex(mappedResult)}`);
    const data = this.#mapped.getBigUint64(0, true);
    const rowPitch = this.#mapped.getUint32(8, true);
    const pixels = Buffer.alloc(width * height * 4);
    if (rowPitch === width * 4) copyMemory(BigInt(pixels.ptr), data, pixels.length);
    else for (let row = 0; row < height; row += 1) copyMemory(BigInt(pixels.ptr) + BigInt(row * width * 4), data + BigInt(row * rowPitch), width * 4);
    vcall(this.context, CTX_UNMAP, [FFIType.u64, FFIType.u32], [staging, 0], FFIType.void);
    return pixels;
  }

  /** Start recording a frame. */
  begin(): void {
    this.#draws.length = 0;
    this.#highlightCount = 0;
  }

  get drawCount(): number {
    return this.#draws.length;
  }

  #record(kind: ShaderKind, texture: bigint): number {
    const index = this.#draws.length;
    if (index >= RECORD_CAPACITY) return -1;
    this.#draws.push({ kind, texture });
    const base = index * DRAW_RECORD_FLOATS;
    this.#records.fill(0, base, base + DRAW_RECORD_FLOATS);
    return base;
  }

  #writeWorld(base: number, world: Float32Array): void {
    this.#records.set(world, base);
  }

  #write4(base: number, register: number, x: number, y: number, z: number, w: number): void {
    const records = this.#records;
    const offset = base + register * 4;
    records[offset] = x;
    records[offset + 1] = y;
    records[offset + 2] = z;
    records[offset + 3] = w;
  }

  /** A window card. `highlights` holds unit-space rects (x0, y0, x1, y1, …) of matched words. */
  card(world: Float32Array, halfWidth: number, halfHeight: number, margin: number, texture: bigint, uvRect: readonly [number, number, number, number], style: CardStyle, highlights: readonly number[] = []): void {
    const base = this.#record('card', texture);
    if (base < 0) return;
    this.#writeWorld(base, world);
    this.#write4(base, 4, halfWidth + margin, halfHeight + margin, halfWidth, halfHeight);
    this.#write4(base, 5, uvRect[0], uvRect[1], uvRect[2], uvRect[3]);
    this.#write4(base, 6, 1, 1, 1, 1);
    this.#write4(base, 7, style.radius, style.opacity, style.saturation, style.brightness);
    this.#write4(base, 8, style.glare, style.glareX, style.glareY, style.focus);
    this.#write4(base, 9, style.shadow, style.shadowSigma, style.scan, style.reflection);
    const count = Math.min(highlights.length >> 2, HIGHLIGHT_CAPACITY - this.#highlightCount, 48);
    this.#write4(base, 10, style.accent[0], style.accent[1], style.accent[2], count);
    this.#write4(base, 11, this.#highlightCount, style.spotlight, 0, 0);
    if (count > 0) {
      this.#highlights.set(highlights.slice(0, count * 4), this.#highlightCount * 4);
      this.#highlightCount += count;
    }
  }

  /** A text (or icon) quad from an atlas, placed with an arbitrary world transform (local origin = quad centre). */
  textWorld(
    world: Float32Array,
    halfWidth: number,
    halfHeight: number,
    atlas: bigint,
    uvRect: readonly [number, number, number, number],
    tint: readonly [number, number, number, number],
    opacity: number,
    softness = 0,
    texelWidth = 0,
    texelHeight = 0,
  ): void {
    const base = this.#record('text', atlas);
    if (base < 0) return;
    this.#writeWorld(base, world);
    this.#write4(base, 4, halfWidth, halfHeight, halfWidth, halfHeight);
    this.#write4(base, 5, uvRect[0], uvRect[1], uvRect[2], uvRect[3]);
    this.#write4(base, 6, tint[0], tint[1], tint[2], tint[3]);
    this.#write4(base, 7, softness, opacity, 1, 1);
    this.#write4(base, 14, texelWidth, texelHeight, 0, 0);
  }

  /** A screen-space text quad with its top-left at (x, y). */
  text(
    x: number,
    y: number,
    width: number,
    height: number,
    atlas: bigint,
    uvRect: readonly [number, number, number, number],
    tint: readonly [number, number, number, number],
    opacity: number,
    softness = 0,
    texelWidth = 0,
    texelHeight = 0,
  ): void {
    const ui = this.ui;
    composeTransform(this.#world, (x + width / 2) * ui, (y + height / 2) * ui, 0, 0, 0, 1);
    this.textWorld(this.#world, (width / 2) * ui, (height / 2) * ui, atlas, uvRect, tint, opacity, softness, texelWidth, texelHeight);
  }

  /** A frosted rounded panel in screen space. `backdropUv` maps screen UV to the blurred wallpaper. */
  panel(x: number, y: number, width: number, height: number, style: PanelStyle, backdropUv: readonly [number, number, number, number], world?: Float32Array): void {
    const base = this.#record('panel', 0n);
    if (base < 0) return;
    // Screen-space panels take DIP coordinates; panels placed by a world transform are already in that space.
    const ui = world === undefined ? this.ui : 1;
    const halfWidth = (width / 2) * ui;
    const halfHeight = (height / 2) * ui;
    const sigma = style.shadowSigma * ui;
    const margin = style.shadow > 0 ? sigma * 3 : 2;
    this.#writeWorld(base, world ?? composeTransform(this.#world, x * ui + halfWidth, y * ui + halfHeight, 0, 0, 0, 1));
    this.#write4(base, 4, halfWidth + margin, halfHeight + margin, halfWidth, halfHeight);
    this.#write4(base, 5, backdropUv[0], backdropUv[1], backdropUv[2], backdropUv[3]);
    this.#write4(base, 7, style.radius * ui, style.opacity, 1, 1);
    this.#write4(base, 9, style.shadow, sigma, -1, 0);
    this.#write4(base, 12, style.fill[0], style.fill[1], style.fill[2], style.fill[3]);
    this.#write4(base, 13, style.border[0], style.border[1], style.border[2], style.border[3]);
    this.#write4(base, 14, style.frost, style.frostBrightness, style.sheen, 0);
  }

  /** The full-screen backdrop: the wallpaper, blurred and dimmed by `style.blur` / `style.brightness`. */
  backdrop(width: number, height: number, wallpaper: bigint, wallpaperUv: readonly [number, number, number, number], style: BackdropStyle): void {
    const base = this.#record('backdrop', wallpaper);
    if (base < 0) return;
    this.#writeWorld(base, composeTransform(this.#world, width / 2, height / 2, 0, 0, 0, 1));
    this.#write4(base, 4, width / 2, height / 2, width / 2, height / 2);
    this.#write4(base, 5, wallpaperUv[0], wallpaperUv[1], wallpaperUv[2], wallpaperUv[3]);
    this.#write4(base, 7, 0, style.opacity, style.blur, style.brightness);
    this.#write4(base, 8, style.vignette, style.grain, style.saturation, 0);
    this.#write4(base, 10, style.accent[0], style.accent[1], style.accent[2], style.accentGlow);
  }

  /** One separable Gaussian pass over `source` (sampled at `level`) filling a target of width×height. */
  blur(width: number, height: number, source: bigint, stepU: number, stepV: number, level: number): void {
    const base = this.#record('blur', source);
    if (base < 0) return;
    this.#writeWorld(base, composeTransform(this.#world, width / 2, height / 2, 0, 0, 0, 1));
    this.#write4(base, 4, width / 2, height / 2, width / 2, height / 2);
    this.#write4(base, 5, 0, 0, 1, 1);
    this.#write4(base, 7, 0, 1, 1, 1);
    this.#write4(base, 14, stepU, stepV, level, 0);
  }

  /** Upload this frame's records and execute them into `target`. `clear` is premultiplied RGBA or null. */
  execute(target: RenderTarget, time: number, clear: readonly [number, number, number, number] | null, timed = false): void {
    const context = this.context;
    const timing = timed && this.gpuTimer.begin();
    const drawCount = this.#draws.length;
    let stateChanges = 0;

    const frame = this.#frameData;
    frame[0] = target.width;
    frame[1] = target.height;
    frame[2] = cameraDistance(target.height);
    frame[3] = time;
    frame[4] = target.width / 2;
    frame[5] = target.height / 2;
    vcall(context, CTX_UPDATE_SUBRESOURCE, [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], [this.#frameBuffer, 0, null, frame.ptr, 0, 0], FFIType.void);

    if (drawCount > 0) {
      this.#upload(this.#recordBuffer, this.#records, drawCount * DRAW_RECORD_FLOATS * 4);
      if (this.#highlightCount > 0) this.#upload(this.#highlightBuffer, this.#highlights, this.#highlightCount * 16);
    }
    this.uploadBytesLastFrame = drawCount * DRAW_RECORD_FLOATS * 4 + this.#highlightCount * 16;

    const slots = this.#bindSlots;
    slots[0] = target.rtv;
    vcall(context, CTX_OM_SET_RENDER_TARGETS, [FFIType.u32, FFIType.ptr, FFIType.u64], [1, slots.ptr, 0n], FFIType.void);
    if (clear !== null) {
      const color = this.#clearColor;
      color[0] = clear[0];
      color[1] = clear[1];
      color[2] = clear[2];
      color[3] = clear[3];
      vcall(context, CTX_CLEAR_RENDER_TARGET_VIEW, [FFIType.u64, FFIType.ptr], [target.rtv, color.ptr], FFIType.void);
    }
    const viewport = this.#viewport;
    viewport[0] = 0;
    viewport[1] = 0;
    viewport[2] = target.width;
    viewport[3] = target.height;
    viewport[4] = 0;
    viewport[5] = 1;
    vcall(context, CTX_RS_SET_VIEWPORTS, [FFIType.u32, FFIType.ptr], [1, viewport.ptr], FFIType.void);
    vcall(context, CTX_RS_SET_STATE, [FFIType.u64], [this.#rasterizerState], FFIType.void);
    vcall(context, CTX_OM_SET_BLEND_STATE, [FFIType.u64, FFIType.ptr, FFIType.u32], [this.#blendState, this.#blendFactor.ptr, 0xffff_ffff], FFIType.void);
    vcall(context, CTX_IA_SET_PRIMITIVE_TOPOLOGY, [FFIType.u32], [D3D11_PRIMITIVE_TOPOLOGY_TRIANGLESTRIP], FFIType.void);
    vcall(context, CTX_IA_SET_INPUT_LAYOUT, [FFIType.u64], [this.#inputLayout], FFIType.void);
    slots[0] = this.#indexStream;
    const stride = this.#streamStride;
    stride[0] = 4;
    stride[1] = 0;
    vcall(context, CTX_IA_SET_VERTEX_BUFFERS, [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], [0, 1, slots.ptr, stride.ptr, new Uint32Array(this.#arena, 452, 1).ptr], FFIType.void);
    vcall(context, CTX_VS_SET_SHADER, [FFIType.u64, FFIType.ptr, FFIType.u32], [this.#vertexShader, null, 0], FFIType.void);
    slots[0] = this.#frameBuffer;
    vcall(context, CTX_VS_SET_CONSTANT_BUFFERS, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 1, slots.ptr], FFIType.void);
    vcall(context, CTX_PS_SET_CONSTANT_BUFFERS, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 1, slots.ptr], FFIType.void);
    slots[0] = this.#recordView;
    vcall(context, CTX_VS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [2, 1, slots.ptr], FFIType.void);
    slots[0] = this.#backdropBlurView;
    slots[1] = this.#recordView;
    slots[2] = this.#highlightView;
    vcall(context, CTX_PS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [1, 3, slots.ptr], FFIType.void);
    slots[0] = this.#anisotropicSampler;
    slots[1] = this.#linearSampler;
    vcall(context, CTX_PS_SET_SAMPLERS, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 2, slots.ptr], FFIType.void);

    let currentKind: ShaderKind | null = null;
    let currentTexture = -1n;
    for (let index = 0; index < drawCount; index += 1) {
      const draw = this.#draws[index]!;
      if (draw.kind !== currentKind) {
        vcall(context, CTX_PS_SET_SHADER, [FFIType.u64, FFIType.ptr, FFIType.u32], [this.#pixelShaders.get(draw.kind)!, null, 0], FFIType.void);
        currentKind = draw.kind;
        stateChanges += 1;
      }
      if (draw.texture !== currentTexture) {
        slots[0] = draw.texture;
        vcall(context, CTX_PS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 1, slots.ptr], FFIType.void);
        currentTexture = draw.texture;
        stateChanges += 1;
      }
      vcall(context, CTX_DRAW_INSTANCED, [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32], [4, 1, 0, index], FFIType.void);
    }
    // Unbind t0 so a texture that is also a render target (atlas, blur ping-pong) is never bound twice next pass.
    slots[0] = 0n;
    vcall(context, CTX_PS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, 1, slots.ptr], FFIType.void);
    slots[0] = 0n;
    vcall(context, CTX_OM_SET_RENDER_TARGETS, [FFIType.u32, FFIType.ptr, FFIType.u64], [1, slots.ptr, 0n], FFIType.void);
    if (timing) this.gpuTimer.end();
    this.drawCallsLastFrame = drawCount;
    this.stateChangesLastFrame = stateChanges;
  }

  #upload(buffer: bigint, source: Float32Array, byteLength: number): void {
    const result = vcall(this.context, CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [buffer, 0, D3D11_MAP_WRITE_DISCARD, 0, this.#mappedBytes.ptr]);
    if (result !== 0) throw new Error(`Map(WRITE_DISCARD) failed: ${hex(result)}`);
    copyMemory(this.#mapped.getBigUint64(0, true), BigInt(source.ptr), byteLength);
    vcall(this.context, CTX_UNMAP, [FFIType.u64, FFIType.u32], [buffer, 0], FFIType.void);
  }

  copyResource(target: bigint, source: bigint): void {
    vcall(this.context, CTX_COPY_RESOURCE, [FFIType.u64, FFIType.u64], [target, source], FFIType.void);
  }
}

/** GPU frame time from D3D11 timestamp queries, read back without ever stalling: a ring of query sets is
 *  collected with GetData(DONOTFLUSH) a few frames later. */
class GpuTimer {
  #context: bigint;
  #data = new BigUint64Array(new ArrayBuffer(32));
  #index = 0;
  #sets: { disjoint: bigint; end: bigint; pending: boolean; start: bigint }[] = [];
  milliseconds = 0;

  constructor(device: bigint, context: bigint) {
    this.#context = context;
    const description = Buffer.alloc(8);
    const create = (kind: number): bigint => {
      description.writeUInt32LE(kind, 0);
      const out = Buffer.alloc(8);
      if (vcall(device, DEV_CREATE_QUERY, [FFIType.ptr, FFIType.ptr], [description.ptr, out.ptr]) !== 0) return 0n;
      return out.readBigUInt64LE(0);
    };
    for (let index = 0; index < 5; index += 1) this.#sets.push({ disjoint: create(D3D11_QUERY_TIMESTAMP_DISJOINT), end: create(D3D11_QUERY_TIMESTAMP), pending: false, start: create(D3D11_QUERY_TIMESTAMP) });
  }

  #collect(): void {
    const data = this.#data;
    for (const set of this.#sets) {
      if (!set.pending) continue;
      if (vcall(this.#context, CTX_GET_DATA, [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], [set.disjoint, data.ptr, 16, 1]) !== 0) continue;
      const frequency = data[0]!;
      const disjoint = (data[1]! & 0xffff_ffffn) !== 0n;
      const startView = new BigUint64Array(data.buffer, 16, 1);
      const endView = new BigUint64Array(data.buffer, 24, 1);
      if (vcall(this.#context, CTX_GET_DATA, [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], [set.start, startView.ptr, 8, 1]) !== 0) continue;
      if (vcall(this.#context, CTX_GET_DATA, [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], [set.end, endView.ptr, 8, 1]) !== 0) continue;
      set.pending = false;
      if (!disjoint && frequency > 0n) this.milliseconds = (Number(endView[0]! - startView[0]!) / Number(frequency)) * 1000;
    }
  }

  begin(): boolean {
    this.#collect();
    const set = this.#sets[this.#index]!;
    if (set.pending || set.disjoint === 0n) return false;
    vcall(this.#context, CTX_BEGIN, [FFIType.u64], [set.disjoint], FFIType.void);
    vcall(this.#context, CTX_END, [FFIType.u64], [set.start], FFIType.void);
    return true;
  }

  end(): void {
    const set = this.#sets[this.#index]!;
    vcall(this.#context, CTX_END, [FFIType.u64], [set.end], FFIType.void);
    vcall(this.#context, CTX_END, [FFIType.u64], [set.disjoint], FFIType.void);
    set.pending = true;
    this.#index = (this.#index + 1) % this.#sets.length;
  }
}

/** The camera distance at which the z = 0 plane maps 1:1 to pixels for a 30° vertical field of view. */
export function cameraDistance(viewportHeight: number): number {
  return viewportHeight / 2 / Math.tan((15 * Math.PI) / 180);
}
