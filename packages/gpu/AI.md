# AI Guide for @bun-win32/gpu

How to use this package. Everything below is reachable from `@bun-win32/gpu` alone (the unscoped `bun-gpu` package re-exports the identical surface). Bun + Windows only. This file is the complete surface — an agent should not need to read source to use it.

## What it is

GPU compute and headless rendering for Bun on Windows: runtime-compiled HLSL (Shader Model 5.0, FXC) on Direct3D 11 over pure `bun:ffi`, on any vendor (NVIDIA/AMD/Intel hardware, WARP software fallback), with zero native dependencies — it binds `d3d11.dll`/`d3dcompiler_47.dll`/`dxgi.dll` already in System32. Three layers, one mental model:

1. **`run()` / `Kernel` / `GpuArray`** — gpu.js-successor compute: one-shot or retained, typed end to end.
2. **The raw pipeline** — device/buffers/textures/shaders/draw/dispatch/depth/blend/queries for rendering and exotica.
3. **`vcall` + the slot constants** — the raw COM vtable escape hatch: any D3D11 call the package didn't wrap is one function call away.

Escalation rule: start at layer 1; drop a layer only when you need something the layer above lacks.

## Mental model (read this first)

- **The device is module-level state.** `createComputeDevice()` (headless) or `createDevice(hwnd, size)` (windowed swap chain) once; every helper targets it. `destroyDevice()` tears it down and warns about leaked resources. Failure throws (never exits).
- **HLSL compiles at runtime** via FXC (`cs_5_0`/`vs_5_0`/`ps_5_0`). Kernels are HLSL **strings** — this package never transpiles JavaScript (gpu.js's `fn.toString()` transpiler was its defining failure mode; bundlers/minifiers cannot break a string).
- **Buffers are explicit.** `GpuArray` stays on the GPU across dispatches (the chaining primitive — zero readbacks between kernels); `run()` is the one-shot sugar that uploads, dispatches, reads back **in place**, and releases the uploads. `run()` memoizes compiled kernels per source, so repeat calls skip FXC — but it still creates and destroys every GPU buffer per call. Hot loops: build `Kernel` + `GpuArray`s once, dispatch many times — zero per-iteration GPU allocations.
- **WARP is the universal fallback** — always present, deterministic, slow. Force it with `{ driver: 'warp' }` for reproducible CI and as your debug target.
- **Readback synchronizes the GPU** (the perf cliff). `readbackBuffer`/`GpuArray.read()` block; `readbackBufferAsync`/`GpuArray.readAsync()` poll across `setImmediate` turns so the event loop stays live.
- **GPU memory is never garbage-collected.** Every buffer/texture/shader/`GpuArray` owns a native resource: call `release()`/`comRelease()` and assert `gpuMemory().liveResources === 0` between jobs in long-running processes.

## Capability → API

| I want to… | Call |
| --- | --- |
| Run one compute kernel over typed arrays | `run(hlsl, { name: Float32Array \| Int32Array \| Uint32Array }, options?)` — mutates writable arrays in place, returns the same record |
| Chain kernels with no readback | `GpuArray.from(data)` / `GpuArray.alloc(kind, length)` → `new Kernel(hlsl).dispatch({ name: array })` ×N → `array.read()` |
| Pass uniforms | `kernel.dispatch(buffers, { uniforms: cbufferLayout({...}).write({...}) })` — kernel declares `cbuffer X : register(b0)` |
| 1D/2D/3D dispatch | `[numthreads(x,y,z)]` in HLSL + `{ groups: [gx, gy, gz] }` (default `ceil(maxLength / numthreadsX)`) |
| Compile-time constants / `[unroll]` bounds | `{ compile: { defines: { N: 64 } } }` (a `#line 1` keeps FXC errors on your line numbers) |
| Sum / matmul / histogram / scan / sort | `gpuSum` `gpuMatmul` `gpuHistogram` `gpuPrefixScan` `gpuSort` (std kernels, CPU-verified on hardware AND WARP) |
| Image-process pixels | `textureFromPixels(rgba, w, h)` → `Texture2D` SRV in, `RWTexture2D` UAV out (`makeTexture({ uav: true })`) → `readbackTexture` |
| Render to texture, read pixels | `makeTexture({ rtv: true })` + `setRenderTargets`/`setViewport`/`clear`/`drawFullscreenTriangle` → `readbackTexture` (RowPitch-correct) |
| Render to a window | `createWindow` → `createDevice(win.hwnd, …)` → draw → `gpu.present(vsync?)` (pace with `present(true)`, never `Bun.sleep`) |
| Depth-tested 3D | `makeDepthBuffer` `setRenderTargetsWithDepth` `clearDepth` `setDepthState` `setCull` `drawTriangles` (`bindDepth` pins a device; `releaseDepth` frees) |
| PNG in / PNG out | `decodePNG(bytes)` / `encodePNG(rgb, w, h)` / `encodePNGFromBGRA(bgra, w, h, stride?)` — pure TS |
| Capture + verify a frame | `captureBackBuffer(gpu, path)` (BEFORE `present()`) → `SnapshotStats` → `formatGrid(stats)` ASCII preview — then look at the PNG |
| Census the hardware | `listAdapters()` → name/VRAM/vendor/LUID/software flag; `deviceFeatures()` → fp64 support |
| Pick a GPU on multi-GPU boxes | `createComputeDevice({ adapter: index })` (indices = `listAdapters()` order; `openAdapter` for raw COM) |
| Time a kernel honestly | `createGpuTimer()` → `begin()` … `end()` → `resolve()` → GPU milliseconds (not CPU wall-clock) |
| Variable-size GPU output | `makeStructuredBuffer({ appendCounter: true, uav: true, … })` + `AppendStructuredBuffer` + `csSet(…, { uavInitialCounts: [0] })` → `appendCount(uav)` |
| GPU-driven dispatch | `makeIndirectArgsBuffer([0,1,1])` → `copyStructureCount(args, 0, uav)` → `dispatchIndirect(args)` — the count never touches the CPU |
| printf-debug a kernel | `createKernelDebugLog(capacity, register)` → paste `log.hlslPrelude`, call `DEBUG_LOG(threadId, value)`, bind `log.uav`, `log.read()` |
| Skip FXC on warm starts | `compileCached(source, entry, target, options?, cacheDirectory?)` — DXBC disk cache, corrupt entries silently recompile |
| Inspect generated code | `disassemble(compiledShader)` → numbered DXBC assembly text |
| Watch GPU memory | `gpuMemory()` → `{ liveResources, totalBytes, bytesByCategory }` |
| Decode a device-loss error | `describeDeviceError(hr)` (names `DXGI_ERROR_*`, explains the 2 s TDR watchdog), `getDeviceRemovedReason()` |
| Call any other D3D11 method | `vcall(thisPtr, slot, argTypes, args, returns?)` + the `DEV_*`/`CTX_*`/`SWAP_*` slot constants (layer 3, below) |

## Full API

### kernel.ts — the flagship compute API

- `run<T>(source: string, buffers: T, options?: RunOptions): T` — compile (memoized per source + compile options; repeat calls skip FXC) → upload → dispatch → read back **in place** → release the uploads. `T` is a record of `KernelArray`s keyed by the kernel's buffer names.
- `class Kernel` — `new Kernel(source, options?: CompileOptions)`; `.dispatch(buffers: Record<string, GpuArray>, options?: DispatchOptions)`; `.bindings` (parsed `KernelBinding[]`); `.threads` (`[x,y,z]` from `[numthreads]`); `.release()`.
- `class GpuArray` — `GpuArray.from(data: KernelArray)`, `GpuArray.alloc(kind: ScalarKind, length: number)`; `.read(): KernelArray`; `.readAsync(): Promise<KernelArray>` (event loop stays live); `.readInto(target)`; `.kind`; `.length`; `.buffer`/`.srv`/`.uav` (raw handles); `.release()`.
- `parseKernelBindings(source): KernelBinding[]` — the textual contract: explicit `StructuredBuffer<float|int|uint> name : register(tN)` / `RWStructuredBuffer<…> : register(uN)`, registers dense from 0 per kind. Throws actionable errors (wrong register space, sparse registers, no bindings, non-string source).
- `parseNumthreads(source): [number, number, number]`.
- Types: `KernelArray` (`Float32Array | Int32Array | Uint32Array`), `ScalarKind` (`'float' | 'int' | 'uint'`), `KernelBinding`, `DispatchOptions` (`groups?`, `uniforms?: Buffer | KernelArray`), `RunOptions` (`+ compile?: CompileOptions`).
- Kernel entry point must be `main`. The uniforms cbuffer must sit at `register(b0)`. Element stride is 4 (struct-typed buffers: use `structLayout` + `makeStructuredBuffer` directly).

### device.ts

- `createComputeDevice(options?: CreateDeviceOptions): Gpu` — headless; hardware → WARP fallback.
- `createDevice(hwnd: bigint, size: { width, height }, options?: CreateDeviceOptions): Gpu` — windowed swap chain (B8G8R8A8), back-buffer RTV ready.
- `CreateDeviceOptions`: `driver?: 'hardware' | 'warp'` (pin), `adapter?: number` (pin to a `listAdapters()` index; uses `DRIVER_TYPE_UNKNOWN`, takes precedence).
- `Gpu`: `{ device, context, swapChain, backBufferRTV: bigint; gpuName: string; driver: 'hardware' | 'WARP'; present(vsync?): void; recreateRTV(): void }`.
- `destroyDevice(): void` — releases RTV/swap chain/context/device, warns on leaked tracked resources, clears active state.
- `hasDevice(): boolean` · `requireGpu(): Gpu` (throws when none) · `deviceFeatures(): { doublePrecisionFloatShaderOps: boolean }`.
- `getDeviceRemovedReason(): number` · `describeDeviceError(hr: number): string` (TDR-aware messages for `0x887A0005/6/7`).

### shader.ts

- `compile(source, entry, target, options?: CompileOptions): CompiledShader` — FXC; throws with the **full** compiler diagnostic. `CompileOptions`: `defines?` (injected as `#define` + `#line 1`), `includes?` (named sources for `preprocessHLSL`), `flags?`, `allowNoise?`.
- `compileCached(source, entry, target, options?, cacheDirectory = '.gpu-cache'): CachedShader` — DXBC disk cache keyed by every codegen input; `fromCache` tells you; corrupt entries recompile + repair. Cache hits have `blob: 0n` and own `bytes` — keep the object referenced until the shader is created.
- `preprocessHLSL(source, includes?, depth?): string` — TS-side textual `#include "name"` resolution (never an `ID3DInclude` callback — foreign-thread COM hazard).
- `makeComputeShader(code)` / `makePixelShader(code)` / `makeVertexShader(code)` → shader handle (`bigint`).
- `disassemble(code: CompiledShader): string` — numbered DXBC assembly.
- Types: `CompiledShader` (`{ ptr, size, blob }`), `CachedShader`, `CompileOptions`.

### buffer.ts

- `makeStructuredBuffer(options: StructuredBufferOptions): StructuredBuffer` — `{ stride, count, uav?, srv?, appendCounter?, cpuWritable?, initialData? }` → `{ buffer, uav?, srv? }`.
- `makeConstantBuffer(byteSize): bigint` (rounds up to 16) · `updateConstantBuffer(buffer, data: Buffer)` · `updateDynamicBuffer(buffer, data)` (Map WRITE_DISCARD; needs `cpuWritable`).
- `readbackBuffer(buffer, byteSize): ArrayBuffer` — **byteSize must equal the buffer's full ByteWidth** (CopyResource silently no-ops on size mismatch; slice afterwards for partial reads). Synchronous.
- `readbackBufferAsync(buffer, byteSize): Promise<ArrayBuffer>` — Flush + Map(DO_NOT_WAIT) polled via `setImmediate`.
- `appendCount(uav): number` — read an append/consume hidden counter (CPU-side).
- `makeIndirectArgsBuffer(initial = [1, 1, 1]): bigint` — 12-byte dispatch-args buffer for `dispatchIndirect`.

### pipeline.ts

- Compute: `csSet(shader, { cb?, srv?, uav?, uavInitialCounts? })` · `dispatch(x, y?, z?)` · `dispatchIndirect(argsBuffer, alignedByteOffset?)`.
- Draw: `vsSet(shader, cbs?)` · `psSet(shader, { cb?, srv?, samp? })` · `drawFullscreenTriangle()` (3 verts, `SV_VertexID`, no IA) · `drawPoints(count)` · `vsSetShaderResources(srvs, startSlot?)`.
- Targets/state: `setRenderTargets(rtvs)` (pass `[]` to unbind) · `setViewport(w, h)` · `clear(rtv, [r,g,b,a])` · `makeSampler({ filter?, address? })` · `makeAdditiveBlendState(premultiplied?)` · `setBlendState(state, factor?, mask?)` (0n restores opaque).
- Resources: `copyResource(dst, src)` · `copyStructureCount(targetBuffer, alignedByteOffset, uav)` · `generateMips(srv)`.
- Types: `CsBindings`, `PsBindings`, `SamplerOptions`.

### texture.ts

- `makeTexture(options: TextureOptions): TextureResult` — `{ w, h, format?, rtv?, srv?, uav?, staging? }` → `{ tex, rtv?, srv?, uav? }`. Default format R8G8B8A8_UNORM.
- `textureFromPixels(pixels, w, h, options?): TextureResult` — UpdateSubresource upload of tightly packed pixels; defaults to an SRV. Unbind the SRV before re-uploading.
- `readbackTexture(tex, w, h, bytesPerPixel = 4, format = DXGI_FORMAT_R8G8B8A8_UNORM): Uint8Array` — staging + Map with the **RowPitch walk** (RowPitch ≠ w×bpp on many GPUs); returns tightly packed rows. `format` must match the source.

### depth.ts

- `makeDepthBuffer(w, h): DepthBuffer` (`{ tex, dsv }`, D32_FLOAT) · `setRenderTargetsWithDepth(rtvs, dsv)` · `clearDepth(dsv, depth = 1)` · `setDepthState(enable, write = true)` (LESS) · `setCull('none' | 'back' | 'front')` · `drawTriangles(vertexCount)` · `releaseDepth()` (frees cached states + owned depth buffers) · `bindDepth(gpu)` (pin; default = active device).

### std.ts — verified standard kernels

- `gpuSum(input: GpuArray): number` — multi-pass groupshared tree reduction, any length (float).
- `gpuMatmul(a, b, n): GpuArray` — n×n row-major float, 16×16 groupshared tiles, any n; caller releases the result.
- `gpuHistogram(values: GpuArray, bins): Uint32Array` — `InterlockedAdd` binning, exact (uint; values ≥ bins ignored).
- `gpuPrefixScan(values: GpuArray): GpuArray` — exclusive uint scan, exact; ≤ 65,536 elements in v1; caller releases.
- `gpuSort(values: GpuArray): GpuArray` — ascending bitonic uint sort (pads with 0xFFFFFFFF, trims); exact; caller releases.

### Diagnostics & introspection

- `listAdapters(): AdapterInfo[]` — `{ description, vendorId, deviceId, dedicatedVideoMemory, dedicatedSystemMemory, sharedSystemMemory, isSoftware, luidHighPart, luidLowPart }`.
- `openAdapter(index): bigint` — raw `IDXGIAdapter1` COM pointer (caller `comRelease`s).
- `createGpuTimer(): GpuTimer` — `{ begin, end, resolve, release }`; `resolve(): GpuTimerResult` = `{ gpuMilliseconds, frequency, disjoint }` (discard + retry when `disjoint`).
- `createKernelDebugLog(capacity = 1024, register = 0): KernelDebugLog` — `{ hlslPrelude, uav, capacity, read(): { attempted, entries: DebugLogEntry[] }, release }`. Entries past capacity are counted but dropped (not ring-wrapped). The `register` must equal the log UAV's position in your `csSet` uav array.
- `gpuMemory(): GpuMemoryReport` — `{ liveResources, totalBytes, bytesByCategory }` for resources made through the package's creators (views and call-transient staging excluded).

### Snapshot & PNG

- `captureBackBuffer(gpu, outPath, opts?: CaptureOptions): SnapshotStats` — never throws (`ok: false` + `note`). Stats: `{ ok, width, height, nonBlackFrac, meanLuma, grid, gridW, gridH, path, note }`.
- `formatGrid(stats): string` — ASCII luminance preview of the captured frame.
- `encodePNG(rgb, w, h): Uint8Array` (tightly packed RGB8) · `encodePNGFromBGRA(bgra, w, h, rowStride?)` · `decodePNG(bytes): DecodedPNG` (`{ width, height, pixels }` RGBA; 8-bit non-interlaced color types 0/2/3/6 only — explicit errors otherwise).

### window.ts

- `createWindow(options: CreateWindowOptions): Win` — `{ title, width, height, borderless? }` → `{ hwnd, wndProc, getMouse(), getWheel(), keyDown(vk), pump(), shouldClose(), clientSize(), destroy() }`. ESC closes. The window is shown, made topmost, and foregrounded (captures lie otherwise).

### Layer 3 — the raw COM escape hatch (com.ts + constants.ts)

- `vcall(thisPtr: bigint, slot: number, argTypes: readonly FFIType[], args: readonly unknown[], returns = FFIType.i32): number` — invoke vtable slot `slot` on any COM interface pointer. **argTypes/args EXCLUDE the implicit `this`** (the invoker prepends it). Invokers are memoized per (method, signature). A wrong slot segfaults.
- `comRelease(ptr)` (IUnknown::Release, 0n-safe) · `blobRelease(blob)` (ID3DBlob) · `guidBytes(guidString): Buffer` (16-byte COM GUID layout) · `hex(hr): string` (HRESULT formatting).
- Vtable slots (Windows 10 SDK `d3d11.h` declaration order, runtime-verified — wrong slot segfaults):
  - `ID3D11Device`: `DEV_CREATE_BUFFER` 3 · `DEV_CREATE_TEXTURE_2D` 5 · `DEV_CREATE_SHADER_RESOURCE_VIEW` 7 · `DEV_CREATE_UNORDERED_ACCESS_VIEW` 8 · `DEV_CREATE_RENDER_TARGET_VIEW` 9 · `DEV_CREATE_DEPTH_STENCIL_VIEW` 10 · `DEV_CREATE_VERTEX_SHADER` 12 · `DEV_CREATE_PIXEL_SHADER` 15 · `DEV_CREATE_COMPUTE_SHADER` 18 · `DEV_CREATE_BLEND_STATE` 20 · `DEV_CREATE_DEPTH_STENCIL_STATE` 21 · `DEV_CREATE_RASTERIZER_STATE` 22 (21/22: a published cheat-sheet had these swapped; these are runtime-verified) · `DEV_CREATE_SAMPLER_STATE` 23 · `DEV_CREATE_QUERY` 24 · `DEV_CHECK_FEATURE_SUPPORT` 33 · `DEV_GET_FEATURE_LEVEL` 37 · `DEV_GET_DEVICE_REMOVED_REASON` 39
  - `ID3D11DeviceContext`: `CTX_VS_SET_CONSTANT_BUFFERS` 7 · `CTX_PS_SET_SHADER_RESOURCES` 8 · `CTX_PS_SET_SHADER` 9 · `CTX_PS_SET_SAMPLERS` 10 · `CTX_VS_SET_SHADER` 11 · `CTX_DRAW` 13 · `CTX_MAP` 14 · `CTX_UNMAP` 15 · `CTX_PS_SET_CONSTANT_BUFFERS` 16 · `CTX_IA_SET_PRIMITIVE_TOPOLOGY` 24 · `CTX_VS_SET_SHADER_RESOURCES` 25 · `CTX_BEGIN` 27 · `CTX_END` 28 · `CTX_GET_DATA` 29 · `CTX_OM_SET_RENDER_TARGETS` 33 · `CTX_OM_SET_BLEND_STATE` 35 · `CTX_OM_SET_DEPTH_STENCIL_STATE` 36 · `CTX_DISPATCH` 41 · `CTX_DISPATCH_INDIRECT` 42 · `CTX_RS_SET_STATE` 43 · `CTX_RS_SET_VIEWPORTS` 44 · `CTX_COPY_RESOURCE` 47 · `CTX_UPDATE_SUBRESOURCE` 48 · `CTX_COPY_STRUCTURE_COUNT` 49 · `CTX_CLEAR_RENDER_TARGET_VIEW` 50 · `CTX_CLEAR_DEPTH_STENCIL_VIEW` 53 · `CTX_GENERATE_MIPS` 54 · `CTX_CS_SET_SHADER_RESOURCES` 67 · `CTX_CS_SET_UNORDERED_ACCESS_VIEWS` 68 · `CTX_CS_SET_SHADER` 69 · `CTX_CS_SET_CONSTANT_BUFFERS` 71 · `CTX_FLUSH` 111
  - Other interfaces: `SWAP_RELEASE` 2 · `SWAP_PRESENT` 8 · `SWAP_GET_BUFFER` 9 (IDXGISwapChain) · `TEX2D_GET_DESC` 10 (ID3D11Texture2D) · `BLOB_RELEASE` 2 · `BLOB_GET_BUFFER_POINTER` 3 · `BLOB_GET_BUFFER_SIZE` 4 (ID3DBlob) · `IUNKNOWN_QUERY_INTERFACE` 0 · `IUNKNOWN_RELEASE` 2 · `DXGIDEVICE_GET_ADAPTER` 7 · `DXGIADAPTER_GET_DESC` 8 · `DXGIADAPTER1_GET_DESC1` 10 · `DXGIFACTORY1_ENUM_ADAPTERS1` 12
- Format/flag/enum constants (all exported for layer-3 use): `DXGI_FORMAT_UNKNOWN` `DXGI_FORMAT_R8G8B8A8_UNORM` `DXGI_FORMAT_B8G8R8A8_UNORM` `DXGI_FORMAT_R16G16B16A16_FLOAT` `DXGI_FORMAT_R32G32B32A32_FLOAT` `DXGI_FORMAT_R32_FLOAT` `DXGI_FORMAT_R32_UINT` `DXGI_FORMAT_D32_FLOAT` · `D3D11_USAGE_DEFAULT` `D3D11_USAGE_DYNAMIC` `D3D11_USAGE_STAGING` · `D3D11_BIND_CONSTANT_BUFFER` `D3D11_BIND_SHADER_RESOURCE` `D3D11_BIND_RENDER_TARGET` `D3D11_BIND_UNORDERED_ACCESS` `D3D11_BIND_DEPTH_STENCIL` · `D3D11_CPU_ACCESS_READ` `D3D11_CPU_ACCESS_WRITE` · `D3D11_MAP_READ` `D3D11_MAP_WRITE_DISCARD` `D3D11_MAP_FLAG_DO_NOT_WAIT` · `D3D11_RESOURCE_MISC_BUFFER_STRUCTURED` `D3D11_RESOURCE_MISC_DRAWINDIRECT_ARGS` `D3D11_BUFFER_UAV_FLAG_APPEND` · `D3D11_UAV_DIMENSION_BUFFER` `D3D11_SRV_DIMENSION_BUFFER` `D3D11_SRV_DIMENSION_TEXTURE2D` `D3D11_DSV_DIMENSION_TEXTURE2D` · `D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST` `D3D11_PRIMITIVE_TOPOLOGY_POINTLIST` · `D3D11_FILTER_MIN_MAG_MIP_POINT` `D3D11_FILTER_MIN_MAG_MIP_LINEAR` `D3D11_TEXTURE_ADDRESS_WRAP` `D3D11_TEXTURE_ADDRESS_CLAMP` · `D3D11_CULL_NONE` `D3D11_CULL_FRONT` `D3D11_CULL_BACK` `D3D11_FILL_SOLID` · `D3D11_COMPARISON_LESS` `D3D11_DEPTH_WRITE_MASK_ZERO` `D3D11_DEPTH_WRITE_MASK_ALL` `D3D11_CLEAR_DEPTH` · `D3D11_QUERY_TIMESTAMP` `D3D11_QUERY_TIMESTAMP_DISJOINT` `D3D11_FEATURE_DOUBLES` · `D3D11_CREATE_DEVICE_BGRA_SUPPORT` `D3D_FEATURE_LEVEL_11_0` · `DXGI_SWAP_EFFECT_DISCARD` `DXGI_USAGE_RENDER_TARGET_OUTPUT` `DXGI_ADAPTER_FLAG_SOFTWARE` · `DXGI_ERROR_DEVICE_REMOVED` `DXGI_ERROR_DEVICE_HUNG` `DXGI_ERROR_DEVICE_RESET` `DXGI_ERROR_INVALID_CALL` `DXGI_ERROR_DRIVER_INTERNAL_ERROR` `DXGI_ERROR_NOT_FOUND` `DXGI_ERROR_WAS_STILL_DRAWING` · `IID_ID3D11TEXTURE2D` `IID_IDXGIDEVICE` `IID_IDXGIFACTORY1`.

### Layout calculators (cbuffer.ts)

- `cbufferLayout(fields): CBufferLayout` — HLSL **cbuffer** packing (4-byte alignment, never straddle a 16-byte register, float4x4 on a register boundary, total rounds to 16). `{ byteSize, offsets, write(values): Buffer }`. Matrices: HLSL is column-major by default — transpose or declare `row_major`.
- `structLayout(fields): CBufferLayout` — **StructuredBuffer** element packing (tight, 4-byte, NO register rule; `byteSize` is the stride). Use with `makeStructuredBuffer({ stride: layout.byteSize, … })`.
- Field types (`CBufferFieldType`): `float float2 float3 float4 float4x4 int int2 int3 int4 uint uint2 uint3 uint4`.

## Recipes

### One-shot compute (the 10-line wow)

```ts
import { run } from '@bun-win32/gpu';

const { data } = run(
  `RWStructuredBuffer<float> data : register(u0);
   [numthreads(64, 1, 1)] void main(uint3 id : SV_DispatchThreadID) { data[id.x] = sqrt(data[id.x]); }`,
  { data: new Float32Array([1, 4, 9, 16, 25, 36, 49, 64]) },
);
console.log([...data]); // [ 1, 2, 3, 4, 5, 6, 7, 8 ]
```

### Chained kernels, zero intermediate readback

```ts
import { GpuArray, Kernel } from '@bun-win32/gpu';

const array = GpuArray.from(new Float32Array(1_000_000));
const double = new Kernel('RWStructuredBuffer<float> data : register(u0);\n[numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { data[id.x] = data[id.x] * 2.0; }');
const addOne = new Kernel('RWStructuredBuffer<float> data : register(u0);\n[numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { data[id.x] = data[id.x] + 1.0; }');
double.dispatch({ data: array });
addOne.dispatch({ data: array });          // still on the GPU
const result = await array.readAsync();    // event loop stays live
array.release(); double.release(); addOne.release();
```

### Uniforms via cbufferLayout

```ts
import { cbufferLayout, run } from '@bun-win32/gpu';

const layout = cbufferLayout({ scale: 'float', offset3: 'float3', count: 'uint' });
run(
  `cbuffer Params : register(b0) { float scale; float3 offset3; uint count; };
   RWStructuredBuffer<float> results : register(u0);
   [numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { results[id.x] = results[id.x] * scale + offset3.x; }`,
  { results: new Float32Array(256) },
  { uniforms: layout.write({ scale: 2.5, offset3: [10, 20, 30], count: 7 }) },
);
```

### Headless render → PNG

```ts
import { clear, compile, createComputeDevice, drawFullscreenTriangle, encodePNG, makePixelShader, makeTexture, makeVertexShader, psSet, readbackTexture, setRenderTargets, setViewport, vsSet } from '@bun-win32/gpu';

createComputeDevice();
const target = makeTexture({ w: 512, h: 512, rtv: true });
const vs = makeVertexShader(compile('struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };\nVSOut main(uint vid : SV_VertexID) { VSOut o; float2 p = float2((vid << 1) & 2, vid & 2); o.uv = p; o.pos = float4(p * float2(2,-2) + float2(-1,1), 0, 1); return o; }', 'main', 'vs_5_0'));
const ps = makePixelShader(compile('float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target { return float4(uv, 0.5, 1); }', 'main', 'ps_5_0'));
setRenderTargets([target.rtv!]);
setViewport(512, 512);
clear(target.rtv!, [0, 0, 0, 1]);
vsSet(vs);
psSet(ps);
drawFullscreenTriangle();
const rgba = readbackTexture(target.tex, 512, 512);
const rgb = new Uint8Array(512 * 512 * 3);
for (let index = 0; index < 512 * 512; index += 1) {
  rgb[index * 3] = rgba[index * 4]!;
  rgb[index * 3 + 1] = rgba[index * 4 + 1]!;
  rgb[index * 3 + 2] = rgba[index * 4 + 2]!;
}
await Bun.write('frame.png', encodePNG(rgb, 512, 512));
```

### Windowed loop with vsync pacing + headless hooks

```ts
import { captureBackBuffer, clear, createDevice, createWindow, setRenderTargets, setViewport } from '@bun-win32/gpu';

const win = createWindow({ title: 'demo', width: 960, height: 540 });
const { w, h } = win.clientSize();
const gpu = createDevice(win.hwnd, { width: w, height: h });
const durationMs = Bun.env.DEMO_DURATION_MS ? Number(Bun.env.DEMO_DURATION_MS) : 0;
const start = performance.now();
while (!win.shouldClose()) {
  win.pump();
  const lastFrame = durationMs > 0 && performance.now() - start >= durationMs;
  setRenderTargets([gpu.backBufferRTV]);
  setViewport(w, h);
  clear(gpu.backBufferRTV, [0.1, 0.2, 0.3, 1]);
  // … vsSet/psSet/drawFullscreenTriangle your scene here …
  if (lastFrame && Bun.env.CAPTURE_PNG) void captureBackBuffer(gpu, Bun.env.CAPTURE_PNG); // BEFORE present
  gpu.present(true); // vsync paces the loop — never Bun.sleep (15.6 ms quantization)
  if (lastFrame) break;
}
win.destroy();
```

### Verify a visual demo (the repo doctrine)

```ts
import { captureBackBuffer, formatGrid } from '@bun-win32/gpu';

const stats = captureBackBuffer(gpu, 'out/frame.png'); // after the final draw, before present()
console.log(formatGrid(stats));                        // coarse ASCII luminance preview
if (!stats.ok || stats.nonBlackFrac < 0.5) throw new Error(`black frame: ${stats.note}`);
// then OPEN the PNG and look at it — numeric checks get fooled.
```

### Raw COM call the package didn't wrap (layer 3)

```ts
import { FFIType } from 'bun:ffi';
import { DEV_GET_FEATURE_LEVEL, createComputeDevice, vcall } from '@bun-win32/gpu';

const gpu = createComputeDevice();
const featureLevel = vcall(gpu.device, DEV_GET_FEATURE_LEVEL, [], [], FFIType.u32); // 0xb000 = 11.0
```

## Gotchas (the traps ledger — each is enforced or documented for a reason)

- **Backtick in HLSL** inside a JS template literal terminates the literal early; FXC sees truncated source. `compile` throws with this exact hint (the #1 demo-author trap).
- **`noise()` + `[unroll]`** can hang FXC for minutes. Guarded (comments are stripped, user helpers like `vnoise()` pass); override with `{ allowNoise: true }`.
- **HLSL reserved words can't name kernel buffers** — `out`, `signed`, and friends produce FXC syntax errors (X3000). Pick another name.
- **Capture before present.** With `DXGI_SWAP_EFFECT_DISCARD` the back buffer is undefined after `Present` — `captureBackBuffer` must run after the final draw, before `present()`.
- **Matrices are column-major in HLSL** by default — pass transposed data from row-major TS or declare `row_major` in the shader.
- **GC window:** assemble pointer-bearing structs immediately before the FFI call and read `.ptr` at call time — an `await` invalidates baked-in `Buffer` pointers, and Bun small-`Buffer` backing stores can RELOCATE after later allocations, so a cached `.ptr` dangles even synchronously (measured ground truth; engine paths stay synchronous and read `.ptr` live for this reason).
- **Same resource as SRV and UAV in one dispatch** is invalid D3D11 — the runtime silently nulls the binding. Chain sequential kernels instead.
- **`readbackBuffer` needs the full ByteWidth** — CopyResource silently no-ops on a size mismatch. Read everything, slice on the CPU.
- **Readback synchronizes the GPU.** Batch dispatches, read once; or `readAsync` to keep the event loop live.
- **`Bun.sleep` quantizes to 15.6 ms** (≈30 fps cap). Pace windowed loops with `present(true)` (vsync).
- **GPU memory is never GC'd.** `release()` everything; `gpuMemory().liveResources` should be 0 between jobs; `destroyDevice()` warns if not.
- **TDR watchdog:** Windows kills any kernel running longer than ~2 s and resets the driver (`DXGI_ERROR_DEVICE_REMOVED`). Split long work into chunks; `describeDeviceError` explains it when it happens.
- **`vcall` argTypes exclude the implicit `this`** — the invoker prepends it. A spurious leading u64 segfaults.
- **Double-precision division** needs 11.1 extended doubles; the `deviceFeatures()` fp64 cap covers add/mul/fma. fp16 storage: use `f16tof32`/`f32tof16` on uint buffers (SM5 ships them; no extra surface needed).

## Env conventions (examples honor these)

- `DEMO_DURATION_MS` — self-exit for headless runs. `CAPTURE_PNG` — capture the last frame. `NO_WINDOW=1` — skip windowed selftest sections.

## Where to look (source)

One line per file — open exactly one:

- `kernel.ts` — run/Kernel/GpuArray + the binding/numthreads parsers.
- `device.ts` — creation (driver/adapter pinning), teardown, feature probe, TDR error mapper.
- `shader.ts` — compile/compileCached/guardrails/preprocessor/disassemble.
- `buffer.ts` — structured/constant buffers, readback (sync + async), append counters, indirect args.
- `pipeline.ts` — all per-draw/per-dispatch state setting.
- `texture.ts` — textures, upload, RowPitch-correct readback.
- `depth.ts` — depth buffer/state, cull, triangle draws.
- `std.ts` — sum/matmul/histogram/scan/sort kernels.
- `cbuffer.ts` — cbufferLayout/structLayout packing calculators.
- `query.ts` — GPU timestamp timers. `debug.ts` — kernel debug log. `memory.ts` — resource accounting.
- `adapter.ts` — DXGI census + openAdapter. `snapshot.ts` — back-buffer capture + stats. `png.ts` — encode/decode. `window.ts` — Win32 window + pump.
- `com.ts` — vcall/comRelease/blobRelease/guidBytes/hex. `constants.ts` — every slot/flag/format constant.
