/**
 * _gpu3d.ts — a small depth-buffer + triangle-mesh companion for {@link ./_gpu}.
 *
 * `_gpu.ts` is the pristine, 26-demo-wide D3D11 engine; it has render targets,
 * shaders, structured/constant buffers, textures, and SV_VertexID drawing, but NO
 * depth buffer and no triangle-mesh helpers. This module ADDS exactly that, composed
 * on top of `_gpu.ts`'s exported `vcall`, the `DEV_*`/`CTX_*` slot consts, and the
 * texture/teardown helpers — WITHOUT touching `_gpu.ts`.
 *
 * It targets the GPU created by `gpu.createDevice()` / `gpu.createComputeDevice()`.
 * Because `_gpu.ts` keeps its active device module-private, call {@link bindGpu3d}
 * once with the `Gpu` that `createDevice` returned (the cloth/voxel demos already
 * hold it). Every helper here then operates on that device + context.
 *
 * Added vtable slots (byte offset = slot * 8; d3d11.h declaration order), verified
 * by RUNNING the self-test (a wrong slot segfaults):
 *   ID3D11Device:        CreateTexture2D 5 · CreateDepthStencilView 10 ·
 *                        CreateRasterizerState 21 · CreateDepthStencilState 22
 *   ID3D11DeviceContext: OMSetRenderTargets 33 · OMSetDepthStencilState 36 ·
 *                        RSSetState 43 · ClearDepthStencilView 53 ·
 *                        IASetPrimitiveTopology 24 · Draw 13
 *
 * ── Exported API ──────────────────────────────────────────────────────────────
 *   bindGpu3d(g)                                   — point the helpers at a device
 *   makeDepthBuffer(w, h) → { tex, dsv }           — D32_FLOAT depth texture + DSV
 *   setRenderTargetsWithDepth(rtvs, dsv)           — OMSetRenderTargets WITH the DSV
 *   clearDepth(dsv, depth=1.0)                      — ClearDepthStencilView (CLEAR_DEPTH)
 *   setDepthState(enable, write=true)              — create+cache + OMSetDepthStencilState
 *   setCull(mode)                                   — create+cache + RSSetState
 *   drawTriangles(vertexCount)                      — TRIANGLELIST topology + Draw
 *   releaseGpu3d()                                  — comRelease all cached state + owned depth
 *
 * Self-test: `bun run packages/all/example/_gpu3d.ts` renders a RED far triangle
 * (z=0.8) and a GREEN near triangle (z=0.2) overlapping it into an offscreen RTV
 * with a depth buffer, reads the pixels back, and asserts GREEN occludes RED in the
 * overlap (depth testing works). Importing the module is a no-op.
 *
 * Run: `import * as gpu from './_gpu'; import * as gpu3d from './_gpu3d';`
 */

import { FFIType, read, type Pointer } from 'bun:ffi';

import * as gpu from './_gpu';

// ── D3D11 enum values this module needs (not surfaced by _gpu.ts) ─────────────
const DXGI_FORMAT_D32_FLOAT = 40;
const D3D11_BIND_DEPTH_STENCIL = 0x40;
const D3D11_USAGE_DEFAULT = 0;

const D3D11_DSV_DIMENSION_TEXTURE2D = 3; // D3D11_DSV_DIMENSION
const D3D11_CLEAR_DEPTH = 1; // D3D11_CLEAR_FLAG

const D3D11_DEPTH_WRITE_MASK_ZERO = 0;
const D3D11_DEPTH_WRITE_MASK_ALL = 1;
const D3D11_COMPARISON_LESS = 2; // D3D11_COMPARISON_FUNC

const D3D11_FILL_SOLID = 3; // D3D11_FILL_MODE
const D3D11_CULL_NONE = 1; // D3D11_CULL_MODE
const D3D11_CULL_FRONT = 2;
const D3D11_CULL_BACK = 3;

const D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST = 4;

// ── Device vtable slots not exported by _gpu.ts (d3d11.h declaration order) ────
// NB: CreateDepthStencilState is slot 21 and CreateRasterizerState is slot 22 —
// matching ID3D11DeviceVtbl after CreateBlendState (20). VERIFIED by running:
// slot 21 returns S_OK for a depth-stencil desc, slot 22 for a rasterizer desc;
// swapping them returns E_INVALIDARG (0x80070057).
const DEV_CREATE_DEPTH_STENCIL_VIEW = 10;
const DEV_CREATE_DEPTH_STENCIL_STATE = 21;
const DEV_CREATE_RASTERIZER_STATE = 22;

// ── Context vtable slots not exported by _gpu.ts ──────────────────────────────
const CTX_OM_SET_DEPTH_STENCIL_STATE = 36;
const CTX_RS_SET_STATE = 43;
const CTX_CLEAR_DEPTH_STENCIL_VIEW = 53;

// ── Active target (bound via bindGpu3d) ────────────────────────────────────────
let active: gpu.Gpu | null = null;

/** Point the depth/mesh helpers at the device + context of `g` (the Gpu from createDevice). */
export function bindGpu3d(g: gpu.Gpu): void {
  active = g;
}

function require3d(): gpu.Gpu {
  if (active === null) {
    throw new Error('No GPU bound to _gpu3d. Call bindGpu3d(g) with the Gpu from createDevice() first.');
  }
  return active;
}

// ── Depth buffer ────────────────────────────────────────────────────────────
/** A depth texture and its depth-stencil view. */
export interface DepthBuffer {
  tex: bigint;
  dsv: bigint;
}

// Depth resources this module owns (released by releaseGpu3d).
const ownedDepth: DepthBuffer[] = [];

/**
 * Create a D32_FLOAT depth texture (BIND_DEPTH_STENCIL) and a matching DSV. The
 * returned resources are tracked and freed by {@link releaseGpu3d}.
 */
export function makeDepthBuffer(w: number, h: number): DepthBuffer {
  const { device } = require3d();

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
  if (gpu.vcall(device, gpu.DEV_CREATE_TEXTURE_2D, [FFIType.ptr, FFIType.ptr, FFIType.ptr], [desc.ptr!, null, ppTex.ptr!]) !== 0) {
    throw new Error('CreateTexture2D (depth) failed.');
  }
  const tex = ppTex.readBigUInt64LE(0);

  // D3D11_DEPTH_STENCIL_VIEW_DESC: Format u32@0, ViewDimension u32@4, Flags u32@8,
  // then the Texture2D{MipSlice u32} union @12. 20 bytes total (8-byte aligned alloc).
  const dsvDesc = Buffer.alloc(20);
  dsvDesc.writeUInt32LE(DXGI_FORMAT_D32_FLOAT, 0);
  dsvDesc.writeUInt32LE(D3D11_DSV_DIMENSION_TEXTURE2D, 4);
  dsvDesc.writeUInt32LE(0, 8); // Flags (no read-only)
  dsvDesc.writeUInt32LE(0, 12); // Texture2D.MipSlice

  const ppDsv = Buffer.alloc(8);
  if (gpu.vcall(device, DEV_CREATE_DEPTH_STENCIL_VIEW, [FFIType.u64, FFIType.ptr, FFIType.ptr], [tex, dsvDesc.ptr!, ppDsv.ptr!]) !== 0) {
    gpu.comRelease(tex);
    throw new Error('CreateDepthStencilView failed.');
  }
  const dsv = ppDsv.readBigUInt64LE(0);

  const result: DepthBuffer = { tex, dsv };
  ownedDepth.push(result);
  return result;
}

/**
 * Bind render targets together with a depth-stencil view (OMSetRenderTargets). This
 * is `_gpu.ts`'s `setRenderTargets` plus the real DSV (the engine helper passes 0n).
 */
export function setRenderTargetsWithDepth(rtvs: readonly bigint[], dsv: bigint): void {
  const { context } = require3d();
  if (rtvs.length === 0) {
    gpu.vcall(context, gpu.CTX_OM_SET_RENDER_TARGETS, [FFIType.u32, FFIType.ptr, FFIType.u64], [0, null, dsv], FFIType.void);
    return;
  }
  const arr = Buffer.alloc(8 * rtvs.length);
  rtvs.forEach((r, i) => arr.writeBigUInt64LE(r, i * 8));
  gpu.vcall(context, gpu.CTX_OM_SET_RENDER_TARGETS, [FFIType.u32, FFIType.ptr, FFIType.u64], [rtvs.length, arr.ptr!, dsv], FFIType.void);
}

/** Clear a depth-stencil view's depth to `depth` (ClearDepthStencilView, CLEAR_DEPTH). */
export function clearDepth(dsv: bigint, depth = 1.0): void {
  const { context } = require3d();
  // ClearDepthStencilView(pDSV, ClearFlags u32, Depth f32, Stencil u8).
  gpu.vcall(context, CTX_CLEAR_DEPTH_STENCIL_VIEW, [FFIType.u64, FFIType.u32, FFIType.f32, FFIType.u8], [dsv, D3D11_CLEAR_DEPTH, depth, 0], FFIType.void);
}

// ── Depth-stencil state (created + cached per enable/write combination) ────────
const depthStates = new Map<string, bigint>();

/**
 * Create (and cache) a depth-stencil state with the given DepthEnable + write mask
 * (DepthFunc LESS) and bind it via OMSetDepthStencilState. Repeated calls reuse the
 * cached state, so they never leak.
 */
export function setDepthState(enable: boolean, write = true): void {
  const { device, context } = require3d();
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
    const hr = gpu.vcall(device, DEV_CREATE_DEPTH_STENCIL_STATE, [FFIType.ptr, FFIType.ptr], [desc.ptr!, pp.ptr!]);
    if (hr !== 0) {
      throw new Error(`CreateDepthStencilState failed 0x${(hr >>> 0).toString(16).padStart(8, '0')}.`);
    }
    state = pp.readBigUInt64LE(0);
    depthStates.set(key, state);
  }
  // OMSetDepthStencilState(pState, StencilRef u32).
  gpu.vcall(context, CTX_OM_SET_DEPTH_STENCIL_STATE, [FFIType.u64, FFIType.u32], [state, 0], FFIType.void);
}

// ── Rasterizer state (created + cached per cull mode) ──────────────────────────
const rasterStates = new Map<string, bigint>();

/**
 * Create (and cache) a SOLID-fill rasterizer state with the given cull mode and bind
 * it via RSSetState. Repeated calls reuse the cached state.
 */
export function setCull(mode: 'none' | 'back' | 'front'): void {
  const { device, context } = require3d();
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
    if (gpu.vcall(device, DEV_CREATE_RASTERIZER_STATE, [FFIType.ptr, FFIType.ptr], [desc.ptr!, pp.ptr!]) !== 0) {
      throw new Error('CreateRasterizerState failed.');
    }
    state = pp.readBigUInt64LE(0);
    rasterStates.set(mode, state);
  }
  gpu.vcall(context, CTX_RS_SET_STATE, [FFIType.u64], [state], FFIType.void);
}

/** Draw `vertexCount` vertices as a TRIANGLELIST (IASetPrimitiveTopology + Draw). */
export function drawTriangles(vertexCount: number): void {
  const { context } = require3d();
  gpu.vcall(context, gpu.CTX_IA_SET_PRIMITIVE_TOPOLOGY, [FFIType.u32], [D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST], FFIType.void);
  gpu.vcall(context, gpu.CTX_DRAW, [FFIType.u32, FFIType.u32], [vertexCount, 0], FFIType.void);
}

/** Release every cached depth/rasterizer state and the depth resources this module owns. */
export function releaseGpu3d(): void {
  for (const s of depthStates.values()) gpu.comRelease(s);
  depthStates.clear();
  for (const s of rasterStates.values()) gpu.comRelease(s);
  rasterStates.clear();
  for (const d of ownedDepth) {
    gpu.comRelease(d.dsv);
    gpu.comRelease(d.tex);
  }
  ownedDepth.length = 0;
}

// ──────────────────────────────────────────────────────────────────────────────
// Self-test — runs only as the entry point (import.meta.main). Proves depth
// occlusion: a GREEN near triangle (z=0.2) must occlude a RED far triangle (z=0.8)
// in their overlap region. Importing the module does NOT run this.
// ──────────────────────────────────────────────────────────────────────────────
function selfTest(): void {
  const W = 256;
  const H = 256;

  // Headless device (no window/swap chain) — we render to an offscreen RTV texture.
  const g = gpu.createComputeDevice();
  bindGpu3d(g);
  console.log(`_gpu3d self-test — ${g.driver} (${g.gpuName})`);

  const color = gpu.makeTexture({ w: W, h: H, format: gpu.DXGI_FORMAT_R8G8B8A8_UNORM, rtv: true });
  const depth = makeDepthBuffer(W, H);

  // Two overlapping screen-filling quads (2 triangles each) fetched by SV_VertexID.
  // CRITICAL ORDERING for an honest proof: the NEAR GREEN quad (z=0.2) is emitted
  // FIRST (verts 0..5) and the FAR RED quad (z=0.8) is emitted LAST (verts 6..11).
  // So red is drawn AFTER green. If depth testing were broken/off, the last-drawn
  // red would overwrite green in the overlap. Green only survives because the depth
  // test rejects the farther red fragments (0.8 >= stored 0.2 under LESS) — i.e. the
  // win is caused by DEPTH, not draw order. Culling is disabled so winding is moot.
  const VS_SRC = `
    struct VSOut { float4 pos : SV_Position; float3 col : COLOR0; };
    VSOut main(uint vid : SV_VertexID) {
      // GREEN near quad shifted RIGHT, RED far quad shifted LEFT, overlapping in the
      // center band. Each quad = two triangles in clip space (z carries the depth).
      float3 grn[3]   = { float3(-0.6, -1.2, 0.2), float3(-0.6,  1.2, 0.2), float3( 1.2, -1.2, 0.2) };
      float3 grnB[3]  = { float3(-0.6,  1.2, 0.2), float3( 1.2,  1.2, 0.2), float3( 1.2, -1.2, 0.2) };
      float3 reds[3]  = { float3(-1.2, -1.2, 0.8), float3(-1.2,  1.2, 0.8), float3( 0.6, -1.2, 0.8) };
      float3 redsB[3] = { float3(-1.2,  1.2, 0.8), float3( 0.6,  1.2, 0.8), float3( 0.6, -1.2, 0.8) };
      float3 p;
      float3 c;
      if (vid < 3u)       { p = grn[vid];          c = float3(0,1,0); } // near, drawn FIRST
      else if (vid < 6u)  { p = grnB[vid - 3u];    c = float3(0,1,0); }
      else if (vid < 9u)  { p = reds[vid - 6u];    c = float3(1,0,0); } // far, drawn LAST
      else                { p = redsB[vid - 9u];   c = float3(1,0,0); }
      VSOut o;
      o.pos = float4(p.xy, p.z, 1.0);
      o.col = c;
      return o;
    }`;
  const PS_SRC = `
    struct VSOut { float4 pos : SV_Position; float3 col : COLOR0; };
    float4 main(VSOut i) : SV_Target { return float4(i.col, 1.0); }`;

  const vsCode = gpu.compile(VS_SRC, 'main', 'vs_5_0');
  const psCode = gpu.compile(PS_SRC, 'main', 'ps_5_0');
  const vs = gpu.makeVertexShader(vsCode);
  const ps = gpu.makePixelShader(psCode);

  // Render: bind color RTV + the depth DSV, clear both, enable depth test, draw the
  // near GREEN quad first then the far RED quad last (see the VS ordering note). With
  // depth ON, green must still win in the overlap — proving the depth test, not order.
  setRenderTargetsWithDepth([color.rtv!], depth.dsv);
  gpu.setViewport(W, H);
  gpu.clear(color.rtv!, [0, 0, 0, 1]);
  clearDepth(depth.dsv, 1.0);
  setDepthState(true, true);
  setCull('none');
  gpu.vsSet(vs);
  gpu.psSet(ps);
  drawTriangles(12); // 4 triangles (2 green near + 2 red far), 12 verts

  // Read the color target back to the CPU via a staging texture + CopyResource + Map.
  const staging = gpu.makeTexture({ w: W, h: H, format: gpu.DXGI_FORMAT_R8G8B8A8_UNORM, staging: true });
  gpu.copyResource(staging.tex, color.tex);

  const D3D11_MAP_READ = 1;
  const mapped = Buffer.alloc(16); // pData@0, RowPitch u32@8, DepthPitch u32@12
  const hr = gpu.vcall(g.context, gpu.CTX_MAP, [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], [staging.tex, 0, D3D11_MAP_READ, 0, mapped.ptr!]);
  if (hr !== 0) {
    console.log(`FAIL — Map(staging) failed 0x${(hr >>> 0).toString(16)}`);
    process.exit(1);
  }
  const dataPtr = Number(mapped.readBigUInt64LE(0)) as Pointer;
  const rowPitch = mapped.readUInt32LE(8);
  const readPixel = (px: number, py: number): [number, number, number] => {
    const o = py * rowPitch + px * 4; // R8G8B8A8: r@+0, g@+1, b@+2
    return [read.u8(dataPtr, o + 0), read.u8(dataPtr, o + 1), read.u8(dataPtr, o + 2)];
  };

  // Sample regions:
  //  - OVERLAP band (center): both triangles cover it → GREEN must win (near).
  //  - RED-only band (left edge): only the red far quad covers it → RED.
  //  - GREEN-only band (right edge): only the green near quad covers it → GREEN.
  const cx = Math.floor(W * 0.5);
  const cy = Math.floor(H * 0.5);
  const leftX = Math.floor(W * 0.1); // inside red quad (x from -1.2..0.6), outside green (x>=-0.6 → NDC -0.6 ≈ px 51)
  const rightX = Math.floor(W * 0.92); // inside green quad (x up to 1.2), outside red (x<=0.6 → px 204)

  const overlap = readPixel(cx, cy);
  const redOnly = readPixel(leftX, cy);
  const greenOnly = readPixel(rightX, cy);

  gpu.vcall(g.context, gpu.CTX_UNMAP, [FFIType.u64, FFIType.u32], [staging.tex, 0], FFIType.void);

  const isGreen = (p: [number, number, number]): boolean => p[1] > 200 && p[0] < 60;
  const isRed = (p: [number, number, number]): boolean => p[0] > 200 && p[1] < 60;

  console.log('  pixel readback (R,G,B):');
  console.log(`    overlap   center (${cx},${cy}) = [${overlap.join(', ')}]  → expect GREEN (near z=0.2 occludes far z=0.8)`);
  console.log(`    red-only  left   (${leftX},${cy}) = [${redOnly.join(', ')}]  → expect RED (far quad only)`);
  console.log(`    green-only right (${rightX},${cy}) = [${greenOnly.join(', ')}]  → expect GREEN (near quad only)`);

  const overlapGreen = isGreen(overlap);
  const leftRed = isRed(redOnly);
  const rightGreen = isGreen(greenOnly);

  const pass = overlapGreen && leftRed && rightGreen;

  // Teardown.
  gpu.comRelease(staging.tex);
  gpu.comRelease(ps);
  gpu.comRelease(vs);
  gpu.blobRelease(psCode.blob);
  gpu.blobRelease(vsCode.blob);
  gpu.comRelease(color.rtv ?? 0n);
  gpu.comRelease(color.tex);
  releaseGpu3d();
  gpu.comRelease(g.context);
  gpu.comRelease(g.device);

  if (pass) {
    console.log('\nPASS — depth occlusion verified: the near GREEN triangle correctly occludes the far RED triangle in the overlap region.');
    process.exit(0);
  } else {
    console.log('\nFAIL — depth occlusion is WRONG:');
    if (!overlapGreen) console.log('   overlap center is NOT green (near triangle did not win the depth test).');
    if (!leftRed) console.log('   red-only band is NOT red.');
    if (!rightGreen) console.log('   green-only band is NOT green.');
    process.exit(1);
  }
}

if (import.meta.main) {
  selfTest();
}
