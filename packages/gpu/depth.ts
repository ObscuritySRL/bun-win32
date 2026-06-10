// Depth buffer, depth/raster state, and triangle-mesh draw — the 3D companion layer.

import { FFIType } from 'bun:ffi';

import { comRelease, vcall } from './com';
import {
  CTX_CLEAR_DEPTH_STENCIL_VIEW,
  CTX_DRAW,
  CTX_IA_SET_PRIMITIVE_TOPOLOGY,
  CTX_OM_SET_DEPTH_STENCIL_STATE,
  CTX_OM_SET_RENDER_TARGETS,
  CTX_RS_SET_STATE,
  D3D11_BIND_DEPTH_STENCIL,
  D3D11_CLEAR_DEPTH,
  D3D11_COMPARISON_LESS,
  D3D11_CULL_BACK,
  D3D11_CULL_FRONT,
  D3D11_CULL_NONE,
  D3D11_DEPTH_WRITE_MASK_ALL,
  D3D11_DEPTH_WRITE_MASK_ZERO,
  D3D11_DSV_DIMENSION_TEXTURE2D,
  D3D11_FILL_SOLID,
  D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST,
  D3D11_USAGE_DEFAULT,
  DEV_CREATE_DEPTH_STENCIL_STATE,
  DEV_CREATE_DEPTH_STENCIL_VIEW,
  DEV_CREATE_RASTERIZER_STATE,
  DEV_CREATE_TEXTURE_2D,
  DXGI_FORMAT_D32_FLOAT,
} from './constants';
import { describeDeviceError, requireGpu, type Gpu } from './device';
import { trackResource } from './memory';
import { invalidateCsCache } from './pipeline';

// Per-call scratch, allocated once (same doctrine as pipeline.ts): `.ptr` is read
// at call time, never cached.
const renderTargetScratch = Buffer.alloc(8 * 128);

/** A depth texture and its depth-stencil view. */
export interface DepthBuffer {
  tex: bigint;
  dsv: bigint;
}

// Depth resources this module owns (released by releaseDepth).
const ownedDepth: DepthBuffer[] = [];
const depthStates = new Map<string, bigint>();
const rasterStates = new Map<string, bigint>();

let boundGpu: Gpu | null = null;

/** Pin the depth helpers to a specific Gpu (default: the engine's active device). */
export function bindDepth(g: Gpu): void {
  boundGpu = g;
}

function depthTarget(): Gpu {
  return boundGpu ?? requireGpu();
}

/** Clear a depth-stencil view's depth to `depth` (ClearDepthStencilView, CLEAR_DEPTH). */
export function clearDepth(dsv: bigint, depth = 1.0): void {
  const { context } = depthTarget();
  // ClearDepthStencilView(pDSV, ClearFlags u32, Depth f32, Stencil u8).
  vcall(context, CTX_CLEAR_DEPTH_STENCIL_VIEW, [FFIType.u64, FFIType.u32, FFIType.f32, FFIType.u8], [dsv, D3D11_CLEAR_DEPTH, depth, 0], FFIType.void);
}

/** Draw `vertexCount` vertices as a TRIANGLELIST (IASetPrimitiveTopology + Draw). */
export function drawTriangles(vertexCount: number): void {
  const { context } = depthTarget();
  vcall(context, CTX_IA_SET_PRIMITIVE_TOPOLOGY, [FFIType.u32], [D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST], FFIType.void);
  vcall(context, CTX_DRAW, [FFIType.u32, FFIType.u32], [vertexCount, 0], FFIType.void);
}

/**
 * Create a D32_FLOAT depth texture (BIND_DEPTH_STENCIL) and a matching DSV. The
 * returned resources are tracked and freed by {@link releaseDepth}.
 */
export function makeDepthBuffer(w: number, h: number): DepthBuffer {
  const { device } = depthTarget();

  // D3D11_TEXTURE2D_DESC: 44 bytes. Width@0 Height@4 MipLevels@8 ArraySize@12
  // Format@16 SampleDesc.Count@20 SampleDesc.Quality@24 Usage@28 BindFlags@32
  // CPUAccessFlags@36 MiscFlags@40.
  const desc = Buffer.alloc(44);
  desc.writeUInt32LE(w, 0);
  desc.writeUInt32LE(h, 4);
  desc.writeUInt32LE(1, 8); // MipLevels
  desc.writeUInt32LE(1, 12); // ArraySize
  desc.writeUInt32LE(DXGI_FORMAT_D32_FLOAT, 16);
  desc.writeUInt32LE(1, 20); // SampleDesc.Count
  desc.writeUInt32LE(0, 24); // SampleDesc.Quality
  desc.writeUInt32LE(D3D11_USAGE_DEFAULT, 28);
  desc.writeUInt32LE(D3D11_BIND_DEPTH_STENCIL, 32);
  desc.writeUInt32LE(0, 36); // CPUAccessFlags
  desc.writeUInt32LE(0, 40); // MiscFlags

  const ppTex = Buffer.alloc(8);
  const texHr = vcall(device, DEV_CREATE_TEXTURE_2D, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [desc.ptr!, null, ppTex.ptr!]);
  if (texHr !== 0) throw new Error(`CreateTexture2D (depth) failed: ${describeDeviceError(texHr)}`);
  const tex = ppTex.readBigUInt64LE(0);
  trackResource(tex, w * h * 4, 'depth');

  // D3D11_DEPTH_STENCIL_VIEW_DESC: Format u32@0, ViewDimension u32@4, Flags u32@8,
  // then the Texture2D{MipSlice u32} union @12. 20 bytes total (8-byte aligned alloc).
  const dsvDesc = Buffer.alloc(20);
  dsvDesc.writeUInt32LE(DXGI_FORMAT_D32_FLOAT, 0);
  dsvDesc.writeUInt32LE(D3D11_DSV_DIMENSION_TEXTURE2D, 4);
  dsvDesc.writeUInt32LE(0, 8); // Flags (no read-only)
  dsvDesc.writeUInt32LE(0, 12); // Texture2D.MipSlice

  const ppDsv = Buffer.alloc(8);
  const dsvHr = vcall(device, DEV_CREATE_DEPTH_STENCIL_VIEW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [tex, dsvDesc.ptr!, ppDsv.ptr!]);
  if (dsvHr !== 0) {
    comRelease(tex);
    throw new Error(`CreateDepthStencilView failed: ${describeDeviceError(dsvHr)}`);
  }
  const dsv = ppDsv.readBigUInt64LE(0);

  const result: DepthBuffer = { tex, dsv };
  ownedDepth.push(result);
  return result;
}

/** Release every cached depth/rasterizer state and the depth resources this module owns. */
export function releaseDepth(): void {
  for (const s of depthStates.values()) comRelease(s);
  depthStates.clear();
  for (const s of rasterStates.values()) comRelease(s);
  rasterStates.clear();
  for (const d of ownedDepth) {
    comRelease(d.dsv);
    comRelease(d.tex);
  }
  ownedDepth.length = 0;
  boundGpu = null;
}

/**
 * Create (and cache) a SOLID-fill rasterizer state with the given cull mode and bind
 * it via RSSetState. Repeated calls reuse the cached state.
 */
export function setCull(mode: 'none' | 'back' | 'front'): void {
  const { device, context } = depthTarget();
  let state = rasterStates.get(mode);
  if (state === undefined) {
    const cullMode = mode === 'none' ? D3D11_CULL_NONE : mode === 'front' ? D3D11_CULL_FRONT : D3D11_CULL_BACK;
    // D3D11_RASTERIZER_DESC: FillMode u32@0, CullMode u32@4, FrontCounterClockwise
    // BOOL@8, DepthBias i32@12, DepthBiasClamp f32@16, SlopeScaledDepthBias f32@20,
    // DepthClipEnable BOOL@24, ScissorEnable BOOL@28, MultisampleEnable BOOL@32,
    // AntialiasedLineEnable BOOL@36. 40 bytes.
    const desc = Buffer.alloc(40);
    desc.writeUInt32LE(D3D11_FILL_SOLID, 0);
    desc.writeUInt32LE(cullMode, 4);
    desc.writeUInt32LE(0, 8); // FrontCounterClockwise (FALSE → clockwise is front)
    desc.writeInt32LE(0, 12); // DepthBias
    desc.writeFloatLE(0, 16); // DepthBiasClamp
    desc.writeFloatLE(0, 20); // SlopeScaledDepthBias
    desc.writeUInt32LE(1, 24); // DepthClipEnable (TRUE — default)
    desc.writeUInt32LE(0, 28); // ScissorEnable
    desc.writeUInt32LE(0, 32); // MultisampleEnable
    desc.writeUInt32LE(0, 36); // AntialiasedLineEnable

    const pp = Buffer.alloc(8);
    const hr = vcall(device, DEV_CREATE_RASTERIZER_STATE, [FFIType.ptr, FFIType.ptr], [desc.ptr!, pp.ptr!]);
    if (hr !== 0) throw new Error(`CreateRasterizerState failed: ${describeDeviceError(hr)}`);
    state = pp.readBigUInt64LE(0);
    rasterStates.set(mode, state);
  }
  vcall(context, CTX_RS_SET_STATE, [FFIType.u64], [state], FFIType.void);
}

/**
 * Create (and cache) a depth-stencil state with the given DepthEnable + write mask
 * (DepthFunc LESS) and bind it via OMSetDepthStencilState. Repeated calls reuse the
 * cached state, so they never leak.
 */
export function setDepthState(enable: boolean, write = true): void {
  const { device, context } = depthTarget();
  const key = `${enable ? 1 : 0}|${write ? 1 : 0}`;
  let state = depthStates.get(key);
  if (state === undefined) {
    // D3D11_DEPTH_STENCIL_DESC: DepthEnable BOOL@0, DepthWriteMask u32@4,
    // DepthFunc u32@8, StencilEnable BOOL@12, StencilReadMask u8@16,
    // StencilWriteMask u8@17, FrontFace(4×u32)@20, BackFace(4×u32)@36. 52 bytes.
    const desc = Buffer.alloc(52);
    desc.writeUInt32LE(enable ? 1 : 0, 0); // DepthEnable
    desc.writeUInt32LE(write ? D3D11_DEPTH_WRITE_MASK_ALL : D3D11_DEPTH_WRITE_MASK_ZERO, 4);
    desc.writeUInt32LE(D3D11_COMPARISON_LESS, 8); // DepthFunc
    desc.writeUInt32LE(0, 12); // StencilEnable
    desc.writeUInt8(0xff, 16); // StencilReadMask
    desc.writeUInt8(0xff, 17); // StencilWriteMask
    // FrontFace / BackFace D3D11_DEPTH_STENCILOP_DESC (4×u32 each): even with
    // stencil DISABLED, D3D11 validates these as proper enums — 0 is an invalid
    // enum and fails CreateDepthStencilState. Use KEEP (1) ops + ALWAYS (8) func.
    const D3D11_STENCIL_OP_KEEP = 1;
    const D3D11_COMPARISON_ALWAYS = 8;
    // FrontFace @20: StencilFailOp@20, StencilDepthFailOp@24, StencilPassOp@28, StencilFunc@32.
    desc.writeUInt32LE(D3D11_STENCIL_OP_KEEP, 20);
    desc.writeUInt32LE(D3D11_STENCIL_OP_KEEP, 24);
    desc.writeUInt32LE(D3D11_STENCIL_OP_KEEP, 28);
    desc.writeUInt32LE(D3D11_COMPARISON_ALWAYS, 32);
    // BackFace @36: StencilFailOp@36, StencilDepthFailOp@40, StencilPassOp@44, StencilFunc@48.
    desc.writeUInt32LE(D3D11_STENCIL_OP_KEEP, 36);
    desc.writeUInt32LE(D3D11_STENCIL_OP_KEEP, 40);
    desc.writeUInt32LE(D3D11_STENCIL_OP_KEEP, 44);
    desc.writeUInt32LE(D3D11_COMPARISON_ALWAYS, 48);

    const pp = Buffer.alloc(8);
    const hr = vcall(device, DEV_CREATE_DEPTH_STENCIL_STATE, [FFIType.ptr, FFIType.ptr], [desc.ptr!, pp.ptr!]);
    if (hr !== 0) {
      throw new Error(`CreateDepthStencilState failed: ${describeDeviceError(hr)}`);
    }
    state = pp.readBigUInt64LE(0);
    depthStates.set(key, state);
  }
  // OMSetDepthStencilState(pState, StencilRef u32).
  vcall(context, CTX_OM_SET_DEPTH_STENCIL_STATE, [FFIType.u64, FFIType.u32], [state, 0], FFIType.void);
}

/**
 * Bind render targets together with a depth-stencil view (OMSetRenderTargets). This
 * is `setRenderTargets` plus the real DSV (the plain helper passes 0n).
 */
export function setRenderTargetsWithDepth(rtvs: readonly bigint[], dsv: bigint): void {
  const { context } = depthTarget();
  invalidateCsCache(); // an OM output bind can null conflicting CS SRVs (outputs win)
  if (rtvs.length === 0) {
    vcall(context, CTX_OM_SET_RENDER_TARGETS, [FFIType.u32, FFIType.ptr, FFIType.u64], [0, null, dsv], FFIType.void);
    return;
  }
  for (let index = 0; index < rtvs.length; index += 1) renderTargetScratch.writeBigUInt64LE(rtvs[index]!, index * 8);
  vcall(context, CTX_OM_SET_RENDER_TARGETS, [FFIType.u32, FFIType.ptr, FFIType.u64], [rtvs.length, renderTargetScratch.ptr!, dsv], FFIType.void);
}
