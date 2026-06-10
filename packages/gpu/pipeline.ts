// Render/compute pipeline state: shader binding, render targets, viewport, clears, draws, dispatch, blend, samplers.

import { FFIType } from 'bun:ffi';

import { setComReleaseHook, vcall } from './com';
import {
  CTX_CLEAR_RENDER_TARGET_VIEW,
  CTX_COPY_RESOURCE,
  CTX_COPY_STRUCTURE_COUNT,
  CTX_CS_SET_CONSTANT_BUFFERS,
  CTX_CS_SET_SHADER,
  CTX_CS_SET_SHADER_RESOURCES,
  CTX_CS_SET_UNORDERED_ACCESS_VIEWS,
  CTX_DISPATCH,
  CTX_DISPATCH_INDIRECT,
  CTX_DRAW,
  CTX_GENERATE_MIPS,
  CTX_IA_SET_PRIMITIVE_TOPOLOGY,
  CTX_OM_SET_BLEND_STATE,
  CTX_OM_SET_RENDER_TARGETS,
  CTX_PS_SET_CONSTANT_BUFFERS,
  CTX_PS_SET_SAMPLERS,
  CTX_PS_SET_SHADER,
  CTX_PS_SET_SHADER_RESOURCES,
  CTX_RS_SET_VIEWPORTS,
  CTX_VS_SET_CONSTANT_BUFFERS,
  CTX_VS_SET_SHADER,
  CTX_VS_SET_SHADER_RESOURCES,
  D3D11_FILTER_MIN_MAG_MIP_LINEAR,
  D3D11_PRIMITIVE_TOPOLOGY_POINTLIST,
  D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST,
  D3D11_TEXTURE_ADDRESS_CLAMP,
  DEV_CREATE_BLEND_STATE,
  DEV_CREATE_SAMPLER_STATE,
} from './constants';
import { describeDeviceError, requireGpu } from './device';

// Per-call scratch, allocated once — binding/state setters run in per-frame and
// per-dispatch loops where a Buffer.alloc costs ~1 us (perf doctrine). `.ptr` is
// read AT CALL TIME, never cached: Bun small-Buffer backing stores can relocate
// after later allocations (measured ground truth — a cached pointer dangles).
// Safe to share: every vcall is synchronous and D3D11 copies the arrays during the call.
const colorScratch = Buffer.alloc(16);
const countScratch = Buffer.alloc(4 * 128);
const factorScratch = Buffer.alloc(16);
const handleScratch = Buffer.alloc(8 * 128);
const secondaryHandleScratch = Buffer.alloc(8 * 128);
const viewportScratch = Buffer.alloc(24);

// CS bind cache (depth 1): skip re-issuing byte-identical compute binds — the D3D11
// runtime runs hazard tracking on every UAV bind (~200 ns measured), so redundant
// sets are NOT cheap. Outputs win in D3D11 hazard resolution: an issued UAV bind can
// null a conflicting CS SRV, so issuing UAVs invalidates the SRV cache; graphics-side
// setters invalidate the whole cache; comRelease invalidates on a cached handle's
// release (a new object can land on the same address — an elided rebind would leave
// a dead object bound).
let csCacheDevice = 0n;
let csCacheShader = -1n;
const csCacheCb: bigint[] = [];
const csCacheSrv: bigint[] = [];
const csCacheUav: bigint[] = [];
let csCacheCbValid = false;
let csCacheSrvValid = false;
let csCacheUavValid = false;

setComReleaseHook((handle) => {
  if (handle === csCacheShader || csCacheCb.includes(handle) || csCacheSrv.includes(handle) || csCacheUav.includes(handle)) invalidateCsCache();
});

function cacheHandles(incoming: readonly bigint[], cached: bigint[]): void {
  cached.length = incoming.length;
  for (let index = 0; index < incoming.length; index += 1) cached[index] = incoming[index];
}

function sameHandles(incoming: readonly bigint[], cached: bigint[], valid: boolean): boolean {
  if (!valid || incoming.length !== cached.length) return false;
  for (let index = 0; index < incoming.length; index += 1) if (incoming[index] !== cached[index]) return false;
  return true;
}

/** Drop the compute-bind elision cache — the next csSet re-issues everything. Raw vcall(context, CTX_CS_*) users must call this; destroyDevice does. */
export function invalidateCsCache(): void {
  csCacheShader = -1n;
  csCacheCbValid = false;
  csCacheSrvValid = false;
  csCacheUavValid = false;
}

export interface PsBindings {
  cb?: readonly bigint[];
  srv?: readonly bigint[];
  samp?: readonly bigint[];
}

export interface CsBindings {
  cb?: readonly bigint[];
  uav?: readonly bigint[];
  /** Per-UAV initial hidden-counter values (append/consume); -1 keeps the current counter. Length must match uav. */
  uavInitialCounts?: readonly number[];
  srv?: readonly bigint[];
}

export interface SamplerOptions {
  /** D3D11_FILTER value; defaults to MIN_MAG_MIP_LINEAR. */
  filter?: number;
  /** D3D11_TEXTURE_ADDRESS_MODE for U/V/W; defaults to CLAMP. */
  address?: number;
}

/** Clear a render-target view to the given RGBA color. */
export function clear(rtv: bigint, color: readonly [number, number, number, number]): void {
  const { context } = requireGpu();
  colorScratch.writeFloatLE(color[0], 0);
  colorScratch.writeFloatLE(color[1], 4);
  colorScratch.writeFloatLE(color[2], 8);
  colorScratch.writeFloatLE(color[3], 12);
  vcall(context, CTX_CLEAR_RENDER_TARGET_VIEW, [FFIType.u64, FFIType.ptr], [rtv, colorScratch.ptr!], FFIType.void);
}

/** Copy an entire resource (CopyResource). */
export function copyResource(dst: bigint, src: bigint): void {
  const { context } = requireGpu();
  vcall(context, CTX_COPY_RESOURCE, [FFIType.u64, FFIType.u64], [dst, src], FFIType.void);
}

/** Copy an append/consume UAV's hidden counter into a buffer at a byte offset, GPU-side (CopyStructureCount). */
export function copyStructureCount(targetBuffer: bigint, alignedByteOffset: number, uav: bigint): void {
  const { context } = requireGpu();
  vcall(context, CTX_COPY_STRUCTURE_COUNT, [FFIType.u64, FFIType.u32, FFIType.u64], [targetBuffer, alignedByteOffset, uav], FFIType.void);
}

/** Bind the compute shader plus optional constant buffers, UAVs, and SRVs. Byte-identical re-binds are elided (see invalidateCsCache). */
export function csSet(shader: bigint, bindings: CsBindings = {}): void {
  const { device, context } = requireGpu();
  if (csCacheDevice !== device) {
    invalidateCsCache();
    csCacheDevice = device;
  }
  if (shader !== csCacheShader) {
    vcall(context, CTX_CS_SET_SHADER, [FFIType.u64, FFIType.ptr, FFIType.u32], [shader, null, 0], FFIType.void);
    csCacheShader = shader;
  }
  if (bindings.cb && bindings.cb.length > 0 && !sameHandles(bindings.cb, csCacheCb, csCacheCbValid)) {
    for (let index = 0; index < bindings.cb.length; index += 1) handleScratch.writeBigUInt64LE(bindings.cb[index], index * 8);
    vcall(context, CTX_CS_SET_CONSTANT_BUFFERS, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, bindings.cb.length, handleScratch.ptr!], FFIType.void);
    cacheHandles(bindings.cb, csCacheCb);
    csCacheCbValid = true;
  }
  if (bindings.uav && bindings.uav.length > 0 && (bindings.uavInitialCounts !== undefined || !sameHandles(bindings.uav, csCacheUav, csCacheUavValid))) {
    for (let index = 0; index < bindings.uav.length; index += 1) handleScratch.writeBigUInt64LE(bindings.uav[index], index * 8);
    let counts = false;
    if (bindings.uavInitialCounts !== undefined) {
      if (bindings.uavInitialCounts.length !== bindings.uav.length) throw new Error(`csSet: uavInitialCounts has ${bindings.uavInitialCounts.length} entries but uav has ${bindings.uav.length}.`);
      for (let index = 0; index < bindings.uavInitialCounts.length; index += 1) countScratch.writeInt32LE(bindings.uavInitialCounts[index], index * 4);
      counts = true;
    }
    // CSSetUnorderedAccessViews: StartSlot, NumUAVs, ppUAVs, pUAVInitialCounts.
    // Passing counts resets append counters — a side effect that must always re-issue.
    vcall(context, CTX_CS_SET_UNORDERED_ACCESS_VIEWS, [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], [0, bindings.uav.length, handleScratch.ptr!, counts ? countScratch.ptr! : null], FFIType.void);
    cacheHandles(bindings.uav, csCacheUav);
    csCacheUavValid = true;
    csCacheSrvValid = false; // the UAV bind may have nulled a conflicting CS SRV slot
  }
  if (bindings.srv && bindings.srv.length > 0 && !sameHandles(bindings.srv, csCacheSrv, csCacheSrvValid)) {
    for (let index = 0; index < bindings.srv.length; index += 1) secondaryHandleScratch.writeBigUInt64LE(bindings.srv[index], index * 8);
    vcall(context, CTX_CS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, bindings.srv.length, secondaryHandleScratch.ptr!], FFIType.void);
    cacheHandles(bindings.srv, csCacheSrv);
    csCacheSrvValid = true;
  }
}

/** Dispatch a compute workload of the given thread-group counts. */
export function dispatch(x: number, y = 1, z = 1): void {
  const { context } = requireGpu();
  vcall(context, CTX_DISPATCH, [FFIType.u32, FFIType.u32, FFIType.u32], [x, y, z], FFIType.void);
}

/** Dispatch with thread-group counts read GPU-side from an indirect-args buffer (DispatchIndirect). */
export function dispatchIndirect(argsBuffer: bigint, alignedByteOffset = 0): void {
  const { context } = requireGpu();
  vcall(context, CTX_DISPATCH_INDIRECT, [FFIType.u64, FFIType.u32], [argsBuffer, alignedByteOffset], FFIType.void);
}

/** Draw a single full-screen triangle (3 verts, SV_VertexID, no IA buffers). */
export function drawFullscreenTriangle(): void {
  const { context } = requireGpu();
  vcall(context, CTX_IA_SET_PRIMITIVE_TOPOLOGY, [FFIType.u32], [D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST], FFIType.void);
  vcall(context, CTX_DRAW, [FFIType.u32, FFIType.u32], [3, 0], FFIType.void);
}

/** Draw `count` point primitives (POINTLIST topology, no IA buffers — the VS fetches from a bound SRV via SV_VertexID). */
export function drawPoints(count: number): void {
  const { context } = requireGpu();
  vcall(context, CTX_IA_SET_PRIMITIVE_TOPOLOGY, [FFIType.u32], [D3D11_PRIMITIVE_TOPOLOGY_POINTLIST], FFIType.void);
  vcall(context, CTX_DRAW, [FFIType.u32, FFIType.u32], [count, 0], FFIType.void);
}

/** Generate mip levels for a SRV-bound texture (texture must have GENERATE_MIPS misc + a SRV). */
export function generateMips(srv: bigint): void {
  const { context } = requireGpu();
  vcall(context, CTX_GENERATE_MIPS, [FFIType.u64], [srv], FFIType.void);
}

/**
 * Create an additive blend state (ID3D11Device::CreateBlendState, slot 20). With
 * `premultiplied` false the blend is SRC_ALPHA·src + ONE·dst; with it true the
 * blend is ONE·src + ONE·dst (pure additive). RGB and alpha both add.
 */
export function makeAdditiveBlendState(premultiplied = true): bigint {
  const { device } = requireGpu();
  // D3D11_BLEND_DESC: AlphaToCoverageEnable BOOL@0, IndependentBlendEnable BOOL@4,
  // then RenderTarget[8] of D3D11_RENDER_TARGET_BLEND_DESC (8 × u32 each = 32 bytes).
  // RT desc: BlendEnable@0, SrcBlend@4, DestBlend@8, BlendOp@12, SrcBlendAlpha@16,
  //          DestBlendAlpha@20, BlendOpAlpha@24, RenderTargetWriteMask@28.
  const D3D11_BLEND_ONE = 2;
  const D3D11_BLEND_SRC_ALPHA = 5;
  const D3D11_BLEND_OP_ADD = 1;
  const desc = Buffer.alloc(8 + 32 * 8);
  desc.writeUInt32LE(0, 0); // AlphaToCoverageEnable
  desc.writeUInt32LE(0, 4); // IndependentBlendEnable
  const rt = 8; // RenderTarget[0]
  desc.writeUInt32LE(1, rt + 0); // BlendEnable
  desc.writeUInt32LE(premultiplied ? D3D11_BLEND_ONE : D3D11_BLEND_SRC_ALPHA, rt + 4); // SrcBlend
  desc.writeUInt32LE(D3D11_BLEND_ONE, rt + 8); // DestBlend
  desc.writeUInt32LE(D3D11_BLEND_OP_ADD, rt + 12); // BlendOp
  desc.writeUInt32LE(D3D11_BLEND_ONE, rt + 16); // SrcBlendAlpha
  desc.writeUInt32LE(D3D11_BLEND_ONE, rt + 20); // DestBlendAlpha
  desc.writeUInt32LE(D3D11_BLEND_OP_ADD, rt + 24); // BlendOpAlpha
  desc.writeUInt32LE(0x0f, rt + 28); // RenderTargetWriteMask = ALL
  const pp = Buffer.alloc(8);
  const hr = vcall(device, DEV_CREATE_BLEND_STATE, [FFIType.ptr, FFIType.ptr], [desc.ptr!, pp.ptr!]);
  if (hr !== 0) throw new Error(`CreateBlendState failed: ${describeDeviceError(hr)}`);
  return pp.readBigUInt64LE(0);
}

/** Create an ID3D11SamplerState. */
export function makeSampler(options: SamplerOptions = {}): bigint {
  const { device } = requireGpu();
  const { filter = D3D11_FILTER_MIN_MAG_MIP_LINEAR, address = D3D11_TEXTURE_ADDRESS_CLAMP } = options;
  // D3D11_SAMPLER_DESC: Filter@0 AddressU@4 AddressV@8 AddressW@12 MipLODBias@16
  // MaxAnisotropy@20 ComparisonFunc@24 BorderColor[4]@28 MinLOD@44 MaxLOD@48. (52 bytes)
  const desc = Buffer.alloc(52);
  desc.writeUInt32LE(filter, 0);
  desc.writeUInt32LE(address, 4);
  desc.writeUInt32LE(address, 8);
  desc.writeUInt32LE(address, 12);
  desc.writeFloatLE(0, 16); // MipLODBias
  desc.writeUInt32LE(1, 20); // MaxAnisotropy
  desc.writeUInt32LE(0, 24); // ComparisonFunc (NEVER)
  desc.writeFloatLE(0, 28); // BorderColor
  desc.writeFloatLE(0, 32);
  desc.writeFloatLE(0, 36);
  desc.writeFloatLE(0, 40);
  desc.writeFloatLE(-3.4e38, 44); // MinLOD
  desc.writeFloatLE(3.4e38, 48); // MaxLOD
  const pp = Buffer.alloc(8);
  const hr = vcall(device, DEV_CREATE_SAMPLER_STATE, [FFIType.ptr, FFIType.ptr], [desc.ptr!, pp.ptr!]);
  if (hr !== 0) throw new Error(`CreateSamplerState failed: ${describeDeviceError(hr)}`);
  return pp.readBigUInt64LE(0);
}

/** Bind a blend state (OMSetBlendState, slot 35). Pass 0n to restore the default opaque blend. */
export function setBlendState(blendState: bigint, blendFactor: readonly [number, number, number, number] = [0, 0, 0, 0], sampleMask = 0xffffffff): void {
  const { context } = requireGpu();
  factorScratch.writeFloatLE(blendFactor[0], 0);
  factorScratch.writeFloatLE(blendFactor[1], 4);
  factorScratch.writeFloatLE(blendFactor[2], 8);
  factorScratch.writeFloatLE(blendFactor[3], 12);
  vcall(context, CTX_OM_SET_BLEND_STATE, [FFIType.u64, FFIType.ptr, FFIType.u32], [blendState, blendState === 0n ? null : factorScratch.ptr!, sampleMask], FFIType.void);
}

/** Bind render targets (OMSetRenderTargets). Pass [] to unbind. */
export function setRenderTargets(rtvs: readonly bigint[]): void {
  const { context } = requireGpu();
  invalidateCsCache(); // an OM output bind can null conflicting CS SRVs (outputs win)
  if (rtvs.length === 0) {
    vcall(context, CTX_OM_SET_RENDER_TARGETS, [FFIType.u32, FFIType.ptr, FFIType.u64], [0, null, 0n], FFIType.void);
    return;
  }
  rtvs.forEach((r, i) => handleScratch.writeBigUInt64LE(r, i * 8));
  vcall(context, CTX_OM_SET_RENDER_TARGETS, [FFIType.u32, FFIType.ptr, FFIType.u64], [rtvs.length, handleScratch.ptr!, 0n], FFIType.void);
}

/** Set a single full-size viewport (RSSetViewports). */
export function setViewport(w: number, h: number): void {
  const { context } = requireGpu();
  viewportScratch.writeFloatLE(0, 0); // 6 floats
  viewportScratch.writeFloatLE(0, 4);
  viewportScratch.writeFloatLE(w, 8);
  viewportScratch.writeFloatLE(h, 12);
  viewportScratch.writeFloatLE(0, 16);
  viewportScratch.writeFloatLE(1, 20);
  vcall(context, CTX_RS_SET_VIEWPORTS, [FFIType.u32, FFIType.ptr], [1, viewportScratch.ptr!], FFIType.void);
}

/** Bind the pixel shader plus optional constant buffers, SRVs, and samplers. */
export function psSet(shader: bigint, bindings: PsBindings = {}): void {
  const { context } = requireGpu();
  vcall(context, CTX_PS_SET_SHADER, [FFIType.u64, FFIType.ptr, FFIType.u32], [shader, null, 0], FFIType.void);
  if (bindings.cb && bindings.cb.length > 0) {
    bindings.cb.forEach((c, i) => handleScratch.writeBigUInt64LE(c, i * 8));
    vcall(context, CTX_PS_SET_CONSTANT_BUFFERS, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, bindings.cb.length, handleScratch.ptr!], FFIType.void);
  }
  if (bindings.srv && bindings.srv.length > 0) {
    bindings.srv.forEach((s, i) => handleScratch.writeBigUInt64LE(s, i * 8));
    vcall(context, CTX_PS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, bindings.srv.length, handleScratch.ptr!], FFIType.void);
  }
  if (bindings.samp && bindings.samp.length > 0) {
    bindings.samp.forEach((s, i) => secondaryHandleScratch.writeBigUInt64LE(s, i * 8));
    vcall(context, CTX_PS_SET_SAMPLERS, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, bindings.samp.length, secondaryHandleScratch.ptr!], FFIType.void);
  }
}

/** Bind the vertex shader and its constant buffers (VSSetShader + VSSetConstantBuffers). */
export function vsSet(shader: bigint, cbs: readonly bigint[] = []): void {
  const { context } = requireGpu();
  vcall(context, CTX_VS_SET_SHADER, [FFIType.u64, FFIType.ptr, FFIType.u32], [shader, null, 0], FFIType.void);
  if (cbs.length > 0) {
    cbs.forEach((c, i) => handleScratch.writeBigUInt64LE(c, i * 8));
    vcall(context, CTX_VS_SET_CONSTANT_BUFFERS, [FFIType.u32, FFIType.u32, FFIType.ptr], [0, cbs.length, handleScratch.ptr!], FFIType.void);
  }
}

/** Bind shader-resource views to the vertex shader (VSSetShaderResources). */
export function vsSetShaderResources(srvs: readonly bigint[], startSlot = 0): void {
  const { context } = requireGpu();
  srvs.forEach((s, i) => handleScratch.writeBigUInt64LE(s, i * 8));
  vcall(context, CTX_VS_SET_SHADER_RESOURCES, [FFIType.u32, FFIType.u32, FFIType.ptr], [startSlot, srvs.length, handleScratch.ptr!], FFIType.void);
}
