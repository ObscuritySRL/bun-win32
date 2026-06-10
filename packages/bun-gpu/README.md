# bun-gpu

Run HLSL compute and headless rendering on **any GPU** — NVIDIA, AMD, Intel, or Microsoft's WARP software rasterizer — from [Bun](https://bun.sh) on Windows. Shaders compile at runtime on Direct3D 11 through pure `bun:ffi` against DLLs already in `C:\Windows\System32`. **Zero native dependencies. No node-gyp, no prebuilds, no postinstall downloads — a few kilobytes of TypeScript.**

```ts
import { run } from 'bun-gpu';

const { data } = run(
  `RWStructuredBuffer<float> data : register(u0);
   [numthreads(64, 1, 1)] void main(uint3 id : SV_DispatchThreadID) { data[id.x] = sqrt(data[id.x]); }`,
  { data: new Float32Array([1, 4, 9, 16, 25, 36, 49, 64]) },
);

console.log([...data]); // [ 1, 2, 3, 4, 5, 6, 7, 8 ]
```

```sh
bun add bun-gpu
```

That is the entire install story.

## Why this exists

GPU compute in JavaScript is a graveyard bracketed by abandonment and bloat (numbers pulled 2026-06-09):

| Package | Weekly downloads | Install | Status |
| --- | --- | --- | --- |
| [gpu.js](https://www.npmjs.com/package/gpu.js) | 15,972 | hard-dep `headless-gl` → node-gyp ANGLE build fails on modern Node/Windows | dead since Nov 2022 ([#807 "Is this project dead?"](https://github.com/gpujs/gpu.js/issues/807) — unanswered) |
| [gl](https://www.npmjs.com/package/gl) (headless-gl) | 56,431 | prebuild ∥ node-gyp ANGLE source build (VS + Python required) | semi-active; breaks on each VS/Node combo ([#325](https://github.com/stackgl/headless-gl/issues/325)) |
| [@tensorflow/tfjs-node](https://www.npmjs.com/package/@tensorflow/tfjs-node) | 110,266 | node-pre-gyp binary + source fallback | frozen since 2024-10; broken on Node 24 ([#8609](https://github.com/tensorflow/tfjs/issues/8609)) |
| [webgpu](https://www.npmjs.com/package/webgpu) (Dawn repack) | 42,039 | 24.8 MB tarball / 71 MB unpacked | pre-1.0; N-API crashes under Bun ([oven-sh/bun#19336](https://github.com/oven-sh/bun/issues/19336)) |
| [onnxruntime-node](https://www.npmjs.com/package/onnxruntime-node) | 2,351,086 | **266 MB unpacked** + postinstall CUDA download | active; DML future in doubt ([#23783](https://github.com/microsoft/onnxruntime/issues/23783)) |
| [bun-webgpu](https://www.npmjs.com/package/bun-webgpu) | 114,407 | 21.8 MB prebuilt Dawn DLL via optionalDependency | active; portable WGSL, not zero-payload |
| **bun-gpu** | — | **kilobytes of TypeScript, zero native code** | binds `d3d11.dll` — an OS-compatibility contract, not a deprecatable vendor add-on |

No N-API ABI surface to break on runtime upgrades, no compiler or Python on the install path, and the engine underneath is not a prototype: **a transformer, an MNIST-class trainer, a progressive path tracer, and ~30 more demos run on it** in [bun-win32](https://github.com/ObscuritySRL/bun-win32).

## What you can do

**Everything gpu.js did** — one-shot kernels, pipeline-mode chaining without readback, multiple outputs per pass, uniforms, 1D/2D/3D dispatch, graphical output, CPU(-class) fallback via WARP — **plus what it architecturally never could:**

Chained kernels with data retained on the GPU (`setPipeline(true)`, done right):

```ts
import { GpuArray, Kernel } from 'bun-gpu';

const array = GpuArray.from(new Float32Array(1_000_000));
const step = new Kernel('RWStructuredBuffer<float> data : register(u0);\n[numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { data[id.x] = data[id.x] * 0.5 + 1.0; }');
for (let i = 0; i < 100; i += 1) step.dispatch({ data: array }); // 100 dispatches, zero readbacks
const result = await array.readAsync(); // non-blocking — the event loop stays live
```

Real compute semantics — atomics, groupshared memory, scatter writes, stream compaction, GPU-driven dispatch:

```ts
import { gpuHistogram, gpuMatmul, gpuPrefixScan, gpuSort, gpuSum, GpuArray } from 'bun-gpu';

const noise = new Uint32Array(100_000);
for (let index = 0; index < noise.length; index += 1) noise[index] = (Math.random() * 0xffff_ffff) >>> 0;
const sorted = gpuSort(GpuArray.from(noise)); // EXACT vs CPU sort in the selftest
```

Image processing (gpu.js's most popular use case):

```ts
import { textureFromPixels, makeTexture, readbackTexture } from 'bun-gpu';
// upload RGBA → Texture2D SRV in, RWTexture2D UAV out → blur/sobel/anything → readback
```

Headless rendering with depth, blend, and samplers — to a PNG, no window, works on WARP in CI:

```ts
import { captureBackBuffer, decodePNG, encodePNG, makeDepthBuffer } from 'bun-gpu';
```

And the things **no JS GPU package offers**: an in-process shader toolchain (`compile` with real FXC diagnostics, `disassemble` to DXBC assembly, `compileCached` disk cache), GPU timestamp timers (`createGpuTimer`), fp64 compute behind a capability probe (`deviceFeatures`), printf-style kernel debugging (`createKernelDebugLog`), GPU memory accounting (`gpuMemory` + leak warnings), adapter census and multi-GPU pinning (`listAdapters`, `createComputeDevice({ adapter })`), and the raw COM vtable escape hatch (`vcall` + every verified slot constant) so any D3D11 call we didn't wrap is one function call away.

## Benchmarks

Measured on an NVIDIA GeForce RTX 4090, Windows 11, Bun 1.4.0 — reproduce with `bun run example/benchmark.ts` (numbers below are one run's table, verbatim):

| Metric | NVIDIA GeForce RTX 4090 (hardware) | Microsoft Basic Render Driver (WARP) |
|---|---|---|
| kernel compile (cold / warm) | 3.7 ms / 1.6 ms | 1.7 ms / 1.5 ms |
| empty dispatch (avg of 1,000) | 5.5 µs | 3.1 µs |
| readback 1 MB | 2190 MB/s | 2334 MB/s |
| readback 16 MB | 3748 MB/s | 2730 MB/s |
| readback 64 MB | 5269 MB/s | 2664 MB/s |
| SAXPY 1M elements | 43.00 Gelem/s | 1.99 Gelem/s |
| matmul 256×256 | 1489.7 GFLOPS | 17.9 GFLOPS |

The integration selftest (134 exact-value assertions: buffer round-trips, atomics histograms, groupshared reductions, cbuffer-vs-FXC layout proofs, depth-test proofs, determinism) passes on hardware **and** WARP: `bun run example/gpu.selftest.ts`.

## Gallery

| | |
| --- | --- |
| ![raymarch](https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/raymarch.png) `example/raymarch.ts` — soft-shadowed raymarcher, runtime-compiled | ![shader-tty](https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/shader-tty.png) `example/shader-tty.ts` — GPU plasma as terminal half-blocks |
| ![voxelscape](https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/voxelscape.png) [voxelscape](https://github.com/ObscuritySRL/bun-win32/blob/main/packages/all/example/voxelscape.ts) — a voxel world on this engine | ![neural-descent](https://raw.githubusercontent.com/ObscuritySRL/bun-win32/main/packages/all/screenshots/neural-descent.png) [neural-descent](https://github.com/ObscuritySRL/bun-win32/blob/main/packages/all/example/neural-descent.ts) — a neural field trained on-GPU |

A transformer ([nano-gpt](https://github.com/ObscuritySRL/bun-win32/blob/main/packages/all/example/nano-gpt.ts)), a progressive path tracer, a cloth sim, and [~30 more demos](https://github.com/ObscuritySRL/bun-win32/tree/main/packages/all/example) run on this engine — they are its regression suite.

## Note to AI agents

Read [`AI.md`](https://github.com/ObscuritySRL/bun-win32/blob/main/packages/gpu/AI.md) — it is the complete surface: capability table, full API, copy-paste recipes, and the traps ledger. You should never need to read the source.

## Requirements & honest scoping

- **Bun ≥ 1.1, Windows 10/11, any GPU or none** (WARP always works — including CI). Windows-only and Bun-only, stated plainly: that is the trade-off this package owns.
- **You write HLSL** (Shader Model 5.0, FXC). bun-gpu is a successor for gpu.js's *workloads*, not its write-a-JS-function API — a JS→shader transpiler is gpu.js's defining failure mode and a deliberate non-goal (a WGSL/GLSL transpile layer is on the roadmap as a separate concern).
- **Not an ONNX/TF model runtime** — it is the substrate such runtimes sit on: GPU-resident buffers, sync + async readback, dispose/memory accounting, adapter selection. No op library beyond the std kernels, no autograd.
- **Not WebGPU** — no WGSL, no portability, no CTS validation layer; HRESULTs and real FXC diagnostics are the deal. On Windows-native depth and install weight, nothing on npm comes close.
- Existing WebGL/three.js code cannot run unported (that is what ANGLE is for); this is for newly written code.

## License

MIT
