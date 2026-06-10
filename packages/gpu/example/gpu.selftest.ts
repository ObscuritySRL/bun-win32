/**
 * GPU selftest — the package's integration test suite, run as a plain script.
 *
 * Nineteen numbered sections exercise the full surface — device lifecycle, adapter
 * census, compile errors and guardrails, buffer round-trips, compute (1D/2D,
 * int/uint, multi-buffer, chaining, uniforms-vs-FXC, matmul, atomics, groupshared,
 * defines), determinism across hardware and WARP, headless rendering with depth,
 * the device-removed error mapper, and (windowed) back-buffer snapshot. Every
 * device-dependent section runs TWICE: once on the default (hardware) device and
 * once forced onto WARP. Prints PASS/FAIL per assertion and exits non-zero on any
 * failure.
 *
 * APIs demonstrated:
 * - createComputeDevice / destroyDevice / describeDeviceError / getDeviceRemovedReason (device lifecycle + TDR mapper)
 * - listAdapters (adapter census)
 * - compile / CompileOptions (FXC diagnostics, defines + #line, guardrails)
 * - run / Kernel / GpuArray (high-level compute, chaining, uniforms)
 * - cbufferLayout (packing calculator validated against FXC ground truth)
 * - makeTexture / readbackTexture / clear / drawFullscreenTriangle (headless render)
 * - makeDepthBuffer / setDepthState / setCull / drawTriangles (depth proof)
 * - createWindow / createDevice / captureBackBuffer (windowed snapshot; NO_WINDOW=1 skips)
 *
 * Run: bun run example/gpu.selftest.ts
 */
import { FFIType } from 'bun:ffi';
import { readdirSync, rmSync, writeFileSync } from 'node:fs';

import {
  type CompiledShader,
  type CreateDeviceOptions,
  DXGIADAPTER_GET_DESC,
  DXGIDEVICE_GET_ADAPTER,
  DXGI_ERROR_DEVICE_HUNG,
  DXGI_ERROR_DEVICE_REMOVED,
  DXGI_ERROR_DEVICE_RESET,
  GpuArray,
  IID_IDXGIDEVICE,
  IUNKNOWN_QUERY_INTERFACE,
  Kernel,
  appendCount,
  blobRelease,
  captureBackBuffer,
  cbufferLayout,
  clear,
  clearDepth,
  comRelease,
  compile,
  compileCached,
  createComputeDevice,
  createDevice,
  createGpuTimer,
  createKernelDebugLog,
  createWindow,
  csSet,
  describeDeviceError,
  destroyDevice,
  deviceFeatures,
  dispatch,
  drawFullscreenTriangle,
  drawTriangles,
  getDeviceRemovedReason,
  gpuMemory,
  guidBytes,
  listAdapters,
  makeComputeShader,
  makeConstantBuffer,
  makeDepthBuffer,
  makePixelShader,
  makeStructuredBuffer,
  makeTexture,
  makeVertexShader,
  psSet,
  readbackBuffer,
  readbackTexture,
  releaseDepth,
  run,
  setCull,
  setDepthState,
  setRenderTargets,
  setRenderTargetsWithDepth,
  setViewport,
  structLayout,
  textureFromPixels,
  vcall,
  vsSet,
} from '@bun-win32/gpu';

let passes = 0;
let failures = 0;

function check(name: string, condition: boolean, detail: string): void {
  if (condition) {
    passes += 1;
    console.log(`PASS ${name}: ${detail}`);
  } else {
    failures += 1;
    console.log(`FAIL ${name}: ${detail}`);
  }
}

function skip(name: string, reason: string): void {
  console.log(`SKIP ${name}: ${reason}`);
}

function thrownMessage(action: () => void): string {
  try {
    action();
    return '';
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

const FULLSCREEN_VS = `struct VSOut { float4 pos : SV_Position; float2 uv : TEXCOORD0; };
VSOut main(uint vid : SV_VertexID) {
  VSOut o; float2 p = float2((vid << 1) & 2, vid & 2);
  o.uv = p; o.pos = float4(p * float2(2,-2) + float2(-1,1), 0, 1); return o; }`;

console.log('== gpu.selftest ==');

{
  const gpu = createComputeDevice();
  check('1 device-default', gpu.device !== 0n && gpu.context !== 0n, `${gpu.gpuName} (${gpu.driver})`);
  destroyDevice();
  const warp = createComputeDevice({ driver: 'warp' });
  check('1 device-warp', warp.driver === 'WARP', warp.gpuName);
  destroyDevice();
  const again = createComputeDevice();
  check('1 device-recreate', again.device !== 0n, 'destroyDevice then re-create works');
  destroyDevice();
}

{
  const adapters = listAdapters();
  check('2 adapters-count', adapters.length >= 1, `${adapters.length} adapter(s)`);
  check(
    '2 adapters-warp',
    adapters.some((adapter) => adapter.description.includes('Basic Render Driver')),
    'WARP enumerable',
  );
}

const determinismByDriver = new Map<string, Float32Array>();

function runSections(label: string, options: CreateDeviceOptions): void {
  const gpu = createComputeDevice(options);
  const tag = (name: string): string => `${name} [${label}]`;
  console.log(`-- sections on ${gpu.gpuName} (${gpu.driver}) --`);

  {
    const error = thrownMessage(() => compile('float bad syntax;;;', 'main', 'cs_5_0'));
    check(tag('3 compile-error'), error.includes('X3') || error.includes('error'), 'garbage HLSL throws with an FXC diagnostic');
    const code = compile('RWStructuredBuffer<float> data : register(u0);\n[numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { data[id.x] = 1.0; }', 'main', 'cs_5_0');
    check(tag('3 compile-valid'), code.size > 0, `${code.size} bytes of DXBC`);
  }

  {
    const backtick = thrownMessage(() => compile('float4 main() : SV_Target { return 0; } `', 'main', 'ps_5_0'));
    check(tag('4 guard-backtick'), backtick.includes('template literal'), 'backtick source names the template-literal trap');
    const noise = thrownMessage(() => compile('[unroll] for (int i = 0; i < 4; i += 1) { value += noise(uv * i); }', 'main', 'ps_5_0'));
    check(tag('4 guard-noise'), noise.includes('allowNoise'), 'noise()+[unroll] suggests allowNoise');
  }

  {
    const values = new Float32Array(1024);
    for (let index = 0; index < values.length; index += 1) values[index] = index * 0.25 - 100;
    const array = GpuArray.from(values);
    const back = array.read();
    let exact = true;
    for (let index = 0; index < 1024; index += 1) if (back[index] !== values[index]) exact = false;
    check(tag('5 buffer-roundtrip'), exact, '1,024 floats up and back, byte-exact, no shader');
    array.release();
  }

  {
    const data = new Float32Array(256);
    for (let index = 0; index < data.length; index += 1) data[index] = index;
    run('RWStructuredBuffer<float> data : register(u0);\n[numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { data[id.x] = data[id.x] * 2.0; }', { data });
    let exact = true;
    for (let index = 0; index < 256; index += 1) if (data[index] !== index * 2) exact = false;
    check(tag('6 compute-basic'), exact, '256-element double kernel, exact');
  }

  {
    const a = new Float32Array(256);
    const b = new Float32Array(256);
    for (let index = 0; index < 256; index += 1) {
      a[index] = index;
      b[index] = index * 10;
    }
    const c = new Float32Array(256);
    run(
      `StructuredBuffer<float> a : register(t0);
       StructuredBuffer<float> b : register(t1);
       RWStructuredBuffer<float> c : register(u0);
       [numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { c[id.x] = a[id.x] + b[id.x]; }`,
      { a, b, c },
    );
    let exact = true;
    for (let index = 0; index < 256; index += 1) if (c[index] !== index * 11) exact = false;
    check(tag('7 multi-buffer'), exact, 'c[i] = a[i] + b[i] with t0/t1 inputs and u0 output');
  }

  {
    const signed = new Int32Array(128);
    for (let index = 0; index < 128; index += 1) signed[index] = -64 + index;
    run('RWStructuredBuffer<int> signedValues : register(u0);\n[numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { signedValues[id.x] = signedValues[id.x] * 3; }', { signedValues: signed });
    let intExact = true;
    for (let index = 0; index < 128; index += 1) if (signed[index] !== (-64 + index) * 3) intExact = false;
    check(tag('8 int'), intExact, 'negative ints survive (×3, exact)');
    const wrapping = new Uint32Array([0xffff_fffe, 0xffff_ffff, 0, 1]);
    run('RWStructuredBuffer<uint> wrapping : register(u0);\n[numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { wrapping[id.x] = wrapping[id.x] + 2u; }', { wrapping });
    check(tag('8 uint'), wrapping[0] === 0 && wrapping[1] === 1 && wrapping[2] === 2 && wrapping[3] === 3, 'uint wrap-around semantics (0xFFFFFFFE+2 → 0)');
  }

  {
    const width = 64;
    const height = 32;
    const grid = new Uint32Array(width * height);
    run('RWStructuredBuffer<uint> grid : register(u0);\n[numthreads(8,8,1)] void main(uint3 id : SV_DispatchThreadID) { grid[id.y * 64 + id.x] = id.y * 64 + id.x; }', { grid }, { groups: [width / 8, height / 8] });
    const at = (x: number, y: number): boolean => grid[y * width + x] === y * width + x;
    check(tag('9 2d-dispatch'), at(0, 0) && at(width - 1, 0) && at(0, height - 1) && at(width - 1, height - 1) && at(32, 16), '2D groups cover corners and center');
  }

  {
    const source = new Float32Array(512);
    for (let index = 0; index < source.length; index += 1) source[index] = index;
    const array = GpuArray.from(source);
    const double = new Kernel('RWStructuredBuffer<float> data : register(u0);\n[numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { data[id.x] = data[id.x] * 2.0; }');
    const addOne = new Kernel('RWStructuredBuffer<float> data : register(u0);\n[numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { data[id.x] = data[id.x] + 1.0; }');
    double.dispatch({ data: array });
    addOne.dispatch({ data: array });
    const out = array.read();
    let exact = true;
    for (let index = 0; index < 512; index += 1) if (out[index] !== index * 2 + 1) exact = false;
    check(tag('10 chaining'), exact, 'two kernels through one GpuArray, no intermediate readback');
    array.release();
    double.release();
    addOne.release();
  }

  {
    const layout = cbufferLayout({ scale: 'float', offset3: 'float3', count: 'uint' });
    const packed = layout.write({ scale: 2.5, offset3: [10, 20, 30], count: 7 });
    const out = new Float32Array(8);
    run(
      `cbuffer Params : register(b0) { float scale; float3 offset3; uint count; };
       RWStructuredBuffer<float> results : register(u0);
       [numthreads(8,1,1)] void main(uint3 id : SV_DispatchThreadID) {
         if (id.x == 0) results[0] = scale;
         if (id.x == 1) results[1] = offset3.x;
         if (id.x == 2) results[2] = offset3.y;
         if (id.x == 3) results[3] = offset3.z;
         if (id.x == 4) results[4] = (float)count;
       }`,
      { results: out },
      { uniforms: packed },
    );
    const expected = [2.5, 10, 20, 30, 7];
    let exact = true;
    for (let index = 0; index < expected.length; index += 1) if (out[index] !== expected[index]) exact = false;
    check(tag('11 uniforms-vs-fxc'), exact, `FXC sees [${[...out.slice(0, 5)]}] — cbufferLayout offsets match the compiler (offsets ${JSON.stringify(layout.offsets)})`);
  }

  {
    const N = 64;
    const a = new Float32Array(N * N);
    const b = new Float32Array(N * N);
    for (let index = 0; index < N * N; index += 1) {
      a[index] = ((index * 31 + 7) % 17) / 8 - 1;
      b[index] = ((index * 13 + 3) % 23) / 11 - 1;
    }
    const c = new Float32Array(N * N);
    run(
      `StructuredBuffer<float> a : register(t0);
       StructuredBuffer<float> b : register(t1);
       RWStructuredBuffer<float> c : register(u0);
       [numthreads(8,8,1)] void main(uint3 id : SV_DispatchThreadID) {
         float sum = 0;
         for (uint k = 0; k < N; k += 1) sum += a[id.y * N + k] * b[k * N + id.x];
         c[id.y * N + id.x] = sum;
       }`,
      { a, b, c },
      { compile: { defines: { N } }, groups: [N / 8, N / 8] },
    );
    let maxDelta = 0;
    for (let row = 0; row < N; row += 1) {
      for (let column = 0; column < N; column += 1) {
        let sum = 0;
        for (let k = 0; k < N; k += 1) sum += a[row * N + k]! * b[k * N + column]!;
        const delta = Math.abs(sum - c[row * N + column]!);
        if (delta > maxDelta) maxDelta = delta;
      }
    }
    check(tag('12 matmul'), maxDelta < 1e-3, `64×64 GPU matmul vs CPU reference, max |Δ| = ${maxDelta.toExponential(2)}`);
  }

  {
    // Inputs stay in [0, 2π): D3D guarantees transcendentals only to ~8e-4 absolute
    // over large domains; on a well-conditioned domain cross-vendor agreement is tight.
    const input = new Float32Array(256);
    for (let index = 0; index < input.length; index += 1) input[index] = (index / 256) * 6.28;
    const first = new Float32Array(input);
    const second = new Float32Array(input);
    const SOURCE = 'RWStructuredBuffer<float> data : register(u0);\n[numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { data[id.x] = sin(data[id.x]) * sqrt(data[id.x] + 1.0); }';
    run(SOURCE, { data: first });
    run(SOURCE, { data: second });
    let identical = true;
    for (let index = 0; index < 256; index += 1) if (first[index] !== second[index]) identical = false;
    check(tag('13 determinism-same-device'), identical, 'same kernel + data twice → byte-identical readbacks');
    determinismByDriver.set(gpu.driver, first);
  }

  {
    const target = makeTexture({ w: 64, h: 64, rtv: true });
    setRenderTargets([target.rtv!]);
    setViewport(64, 64);
    clear(target.rtv!, [0, 0, 1, 1]);
    const pixels = readbackTexture(target.tex, 64, 64);
    check(tag('14 render-clear'), pixels[0] === 0 && pixels[1] === 0 && pixels[2] === 255 && pixels[3] === 255, 'clear-to-blue pixel(0,0) is [0,0,255,255] (R8G8B8A8)');

    const vs = makeVertexShader(compile(FULLSCREEN_VS, 'main', 'vs_5_0'));
    const ps = makePixelShader(compile('float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target { return float4(uv.x, uv.y, 0, 1); }', 'main', 'ps_5_0'));
    vsSet(vs);
    psSet(ps);
    drawFullscreenTriangle();
    const gradient = readbackTexture(target.tex, 64, 64);
    const red = (x: number, y: number): number => gradient[(y * 64 + x) * 4]!;
    const green = (x: number, y: number): number => gradient[(y * 64 + x) * 4 + 1]!;
    check(tag('14 render-gradient'), red(61, 2) > red(2, 2) + 100 && green(2, 61) > green(2, 2) + 100, 'UV gradient rises monotonically across and down');

    // NEAR GREEN quads (z=0.2) draw FIRST, FAR RED quads (z=0.8) draw LAST — green
    // can only win the overlap because of the depth test, never draw order.
    const depthColor = makeTexture({ w: 64, h: 64, rtv: true });
    const depth = makeDepthBuffer(64, 64);
    const depthVs = makeVertexShader(
      compile(
        `struct VSOut { float4 pos : SV_Position; float3 col : COLOR0; };
         VSOut main(uint vid : SV_VertexID) {
           float3 grn[3]   = { float3(-0.6, -1.2, 0.2), float3(-0.6,  1.2, 0.2), float3( 1.2, -1.2, 0.2) };
           float3 grnB[3]  = { float3(-0.6,  1.2, 0.2), float3( 1.2,  1.2, 0.2), float3( 1.2, -1.2, 0.2) };
           float3 reds[3]  = { float3(-1.2, -1.2, 0.8), float3(-1.2,  1.2, 0.8), float3( 0.6, -1.2, 0.8) };
           float3 redsB[3] = { float3(-1.2,  1.2, 0.8), float3( 0.6,  1.2, 0.8), float3( 0.6, -1.2, 0.8) };
           float3 p;
           float3 c;
           if (vid < 3u)       { p = grn[vid];          c = float3(0,1,0); }
           else if (vid < 6u)  { p = grnB[vid - 3u];    c = float3(0,1,0); }
           else if (vid < 9u)  { p = reds[vid - 6u];    c = float3(1,0,0); }
           else                { p = redsB[vid - 9u];   c = float3(1,0,0); }
           VSOut o;
           o.pos = float4(p.xy, p.z, 1.0);
           o.col = c;
           return o;
         }`,
        'main',
        'vs_5_0',
      ),
    );
    const depthPs = makePixelShader(compile('struct VSOut { float4 pos : SV_Position; float3 col : COLOR0; };\nfloat4 main(VSOut i) : SV_Target { return float4(i.col, 1); }', 'main', 'ps_5_0'));
    setRenderTargetsWithDepth([depthColor.rtv!], depth.dsv);
    setViewport(64, 64);
    clear(depthColor.rtv!, [0, 0, 0, 1]);
    clearDepth(depth.dsv, 1.0);
    setDepthState(true, true);
    setCull('none');
    vsSet(depthVs);
    psSet(depthPs);
    drawTriangles(12);
    const depthPixels = readbackTexture(depthColor.tex, 64, 64);
    const probe = (x: number, y: number): readonly [number, number] => [depthPixels[(y * 64 + x) * 4]!, depthPixels[(y * 64 + x) * 4 + 1]!];
    const isGreenAt = (x: number, y: number): boolean => probe(x, y)[1] > 200 && probe(x, y)[0] < 60;
    const isRedAt = (x: number, y: number): boolean => probe(x, y)[0] > 200 && probe(x, y)[1] < 60;
    check(tag('14 render-depth'), isGreenAt(32, 32) && isRedAt(6, 32) && isGreenAt(58, 32), 'near green wins the overlap; red-only and green-only bands correct');
    releaseDepth();
    setDepthState(false, false);
    setRenderTargets([]);
    comRelease(depthPs);
    comRelease(depthVs);
    comRelease(depthColor.rtv!);
    comRelease(depthColor.tex);
    comRelease(ps);
    comRelease(vs);
    comRelease(target.rtv!);
    comRelease(target.tex);
  }

  {
    const missing = thrownMessage(() => run('RWStructuredBuffer<float> data : register(u0);\n[numthreads(1,1,1)] void main() { data[0] = 1; }', {}));
    check(tag('15 error-missing-buffer'), missing.includes('no typed array was passed'), 'missing buffer name names the buffer');
    const mismatch = thrownMessage(() => {
      const kernel = new Kernel('RWStructuredBuffer<float> data : register(u0);\n[numthreads(1,1,1)] void main() { data[0] = 1; }');
      const wrong = GpuArray.from(new Int32Array(4));
      try {
        kernel.dispatch({ data: wrong });
      } finally {
        wrong.release();
        kernel.release();
      }
    });
    check(tag('15 error-kind-mismatch'), mismatch.includes('declared float') && mismatch.includes('holds int'), 'kind mismatch states both kinds');
    const sparse = thrownMessage(() => new Kernel('RWStructuredBuffer<float> a : register(u0);\nRWStructuredBuffer<float> b : register(u2);\n[numthreads(1,1,1)] void main() { a[0] = b[0]; }'));
    check(tag('15 error-sparse-registers'), sparse.includes('dense from 0'), 'sparse registers point at the gap');
    const uniformless = thrownMessage(() => run('RWStructuredBuffer<float> data : register(u0);\n[numthreads(1,1,1)] void main() { data[0] = 1; }', { data: new Float32Array(1) }, { uniforms: new Float32Array(4) }));
    check(tag('15 error-uniforms-without-cbuffer'), uniformless.includes('declares no cbuffer'), 'uniforms without cbuffer rejected');
  }

  {
    const ELEMENTS = 65536;
    const samples = new Uint32Array(ELEMENTS);
    let state = 0x12345678;
    for (let index = 0; index < ELEMENTS; index += 1) {
      state = (state * 1664525 + 1013904223) >>> 0;
      samples[index] = state & 0xff;
    }
    const histogram = new Uint32Array(256);
    run(
      `StructuredBuffer<uint> samples : register(t0);
       RWStructuredBuffer<uint> histogram : register(u0);
       [numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { InterlockedAdd(histogram[samples[id.x]], 1u); }`,
      { samples, histogram },
      { groups: [ELEMENTS / 64] },
    );
    const reference = new Uint32Array(256);
    for (let index = 0; index < ELEMENTS; index += 1) reference[samples[index]!] += 1;
    let exact = true;
    for (let bucket = 0; bucket < 256; bucket += 1) if (histogram[bucket] !== reference[bucket]) exact = false;
    check(tag('16 atomics-histogram'), exact, `${ELEMENTS} uints into 256 buckets via InterlockedAdd, EXACT vs CPU`);
  }

  {
    const N = 4096;
    const GROUP = 256;
    const data = new Float32Array(N);
    for (let index = 0; index < N; index += 1) data[index] = (index % 32) + 1;
    const partialSums = new Float32Array(N / GROUP);
    run(
      `StructuredBuffer<float> data : register(t0);
       RWStructuredBuffer<float> partialSums : register(u0);
       groupshared float tile[256];
       [numthreads(256,1,1)] void main(uint3 id : SV_DispatchThreadID, uint3 gid : SV_GroupID, uint3 tid : SV_GroupThreadID) {
         tile[tid.x] = data[id.x];
         GroupMemoryBarrierWithGroupSync();
         for (uint stride = 128; stride > 0; stride >>= 1) {
           if (tid.x < stride) tile[tid.x] += tile[tid.x + stride];
           GroupMemoryBarrierWithGroupSync();
         }
         if (tid.x == 0) partialSums[gid.x] = tile[0];
       }`,
      { data, partialSums },
      { groups: [N / GROUP] },
    );
    let exact = true;
    for (let group = 0; group < N / GROUP; group += 1) {
      let sum = 0;
      for (let index = 0; index < GROUP; index += 1) sum += data[group * GROUP + index]!;
      if (partialSums[group] !== sum) exact = false;
    }
    check(tag('17 groupshared-reduction'), exact, 'tiled partial sums with GroupMemoryBarrierWithGroupSync, exact (integer-valued floats)');
  }

  {
    const SOURCE = `RWStructuredBuffer<float> results : register(u0);
[numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) {
  float sum = 0;
  [unroll] for (uint i = 0; i < N; i += 1) sum += 1.0;
  results[id.x] = sum;
}`;
    const four = new Float32Array(64);
    run(SOURCE, { results: four }, { compile: { defines: { N: 4 } } });
    const eight = new Float32Array(64);
    run(SOURCE, { results: eight }, { compile: { defines: { N: 8 } } });
    check(tag('18 defines-unroll'), four[0] === 4 && eight[0] === 8, 'same source, N=4 vs N=8 [unroll] bounds → 4 and 8');
    const lineError = thrownMessage(() => compile('RWStructuredBuffer<float> data : register(u0);\nfloat bad syntax;;;', 'main', 'cs_5_0', { defines: { N: 4 } }));
    check(tag('18 defines-line-numbers'), lineError.includes('(2,'), '#line 1 keeps FXC errors on the user line despite the define block');
  }

  {
    check(tag('19 removed-reason-healthy'), getDeviceRemovedReason() === 0, 'healthy device reports GetDeviceRemovedReason == 0 (slot 39 live)');
    const allMapped = [DXGI_ERROR_DEVICE_REMOVED, DXGI_ERROR_DEVICE_HUNG, DXGI_ERROR_DEVICE_RESET].every((code) => {
      const message = describeDeviceError(code);
      return message.includes('TDR') && message.includes('0x887a');
    });
    check(tag('19 removed-mapper'), allMapped, '0x887A0005/6/7 map to named, TDR-hinted messages');
  }

  {
    const W = 32;
    const H = 16;
    const pixels = new Uint8Array(W * H * 4);
    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        const offset = (y * W + x) * 4;
        pixels[offset] = (x * 8) & 0xff;
        pixels[offset + 1] = (y * 16) & 0xff;
        pixels[offset + 2] = ((x + y) % 2) * 255;
        pixels[offset + 3] = 255;
      }
    }
    const source = textureFromPixels(pixels, W, H);
    const verbatim = readbackTexture(source.tex, W, H);
    let uploadExact = true;
    for (let index = 0; index < pixels.length; index += 1) if (verbatim[index] !== pixels[index]) uploadExact = false;
    check(tag('23 texture-upload'), uploadExact, `${W}×${H} RGBA upload reads back byte-exact`);

    const destination = makeTexture({ w: W, h: H, uav: true });
    const blur = makeComputeShader(
      compile(
        `Texture2D<float4> source : register(t0);
         RWTexture2D<float4> destination : register(u0);
         [numthreads(8,8,1)] void main(uint3 id : SV_DispatchThreadID) {
           if (id.x >= W || id.y >= H) return;
           float4 accumulator = 0;
           for (int dy = -1; dy <= 1; dy += 1) {
             for (int dx = -1; dx <= 1; dx += 1) {
               int2 coordinate = clamp(int2(id.xy) + int2(dx, dy), int2(0, 0), int2(W - 1, H - 1));
               accumulator += source.Load(int3(coordinate, 0));
             }
           }
           destination[id.xy] = accumulator / 9.0;
         }`,
        'main',
        'cs_5_0',
        { defines: { H, W } },
      ),
    );
    csSet(blur, { srv: [source.srv!], uav: [destination.uav!] });
    dispatch(Math.ceil(W / 8), Math.ceil(H / 8));
    csSet(0n, { srv: [0n], uav: [0n] });
    const blurred = readbackTexture(destination.tex, W, H);
    let maxDelta = 0;
    for (let y = 0; y < H; y += 1) {
      for (let x = 0; x < W; x += 1) {
        for (let channel = 0; channel < 4; channel += 1) {
          let sum = 0;
          for (let dy = -1; dy <= 1; dy += 1) {
            for (let dx = -1; dx <= 1; dx += 1) {
              const sampleX = Math.min(W - 1, Math.max(0, x + dx));
              const sampleY = Math.min(H - 1, Math.max(0, y + dy));
              sum += pixels[(sampleY * W + sampleX) * 4 + channel]! / 255;
            }
          }
          const expected = Math.round((sum / 9) * 255);
          const delta = Math.abs(blurred[(y * W + x) * 4 + channel]! - expected);
          if (delta > maxDelta) maxDelta = delta;
        }
      }
    }
    check(tag('23 texture-blur'), maxDelta <= 2, `3×3 box blur via Texture2D→RWTexture2D matches CPU reference (max |Δ| = ${maxDelta} of 255)`);
    comRelease(destination.uav!);
    comRelease(destination.tex);
    comRelease(blur);
    comRelease(source.srv!);
    comRelease(source.tex);
  }

  {
    const N = 1024;
    const values = new Float32Array(N);
    let state = 0xc0ffee11;
    for (let index = 0; index < N; index += 1) {
      state = (state * 1664525 + 1013904223) >>> 0;
      values[index] = (state & 0xffff) / 0x1_0000;
    }
    const expectedKept = [...values].filter((value) => value > 0.5);
    const sourceData = Buffer.from(values.buffer);
    const source = makeStructuredBuffer({ count: N, initialData: sourceData, srv: true, stride: 4 });
    const kept = makeStructuredBuffer({ appendCounter: true, count: N, stride: 4, uav: true });
    const compaction = makeComputeShader(
      compile(
        `StructuredBuffer<float> source : register(t0);
         AppendStructuredBuffer<float> kept : register(u0);
         [numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) {
           float value = source[id.x];
           if (value > 0.5) kept.Append(value);
         }`,
        'main',
        'cs_5_0',
      ),
    );
    csSet(compaction, { srv: [source.srv!], uav: [kept.uav!], uavInitialCounts: [0] });
    dispatch(N / 64);
    csSet(0n, { srv: [0n], uav: [0n] });
    const count = appendCount(kept.uav!);
    check(tag('25 append-count'), count === expectedKept.length, `CopyStructureCount reads ${count}; CPU predicate kept ${expectedKept.length} of ${N}`);
    // readbackBuffer must read the FULL ByteWidth (CopyResource silently no-ops on size mismatch) — slice afterwards.
    const payload = [...new Float32Array(readbackBuffer(kept.buffer, N * 4)).slice(0, count)].sort((left, right) => left - right);
    const reference = [...expectedKept].sort((left, right) => left - right);
    let setEqual = payload.length === reference.length;
    for (let index = 0; index < payload.length; index += 1) if (payload[index] !== reference[index]) setEqual = false;
    check(tag('25 append-payload'), setEqual, 'appended payload set-equals the CPU-kept values (order is GPU-defined)');
    comRelease(compaction);
    comRelease(kept.uav!);
    comRelease(kept.buffer);
    comRelease(source.srv!);
    comRelease(source.buffer);
  }

  {
    const layout = structLayout({ a: 'float', b: 'float3', c: 'uint' });
    const N = 16;
    const items: Buffer[] = [];
    for (let index = 0; index < N; index += 1) {
      items.push(layout.write({ a: index + 0.5, b: [index * 2, index * 3, index * 4], c: index * 7 }));
    }
    const initialData = Buffer.concat(items);
    const source = makeStructuredBuffer({ count: N, initialData, srv: true, stride: layout.byteSize });
    const flat = new Float32Array(N * 5);
    const flatArray = GpuArray.from(flat);
    const unpack = makeComputeShader(
      compile(
        `struct Item { float a; float3 b; uint c; };
         StructuredBuffer<Item> items : register(t0);
         RWStructuredBuffer<float> flat : register(u0);
         [numthreads(16,1,1)] void main(uint3 id : SV_DispatchThreadID) {
           Item item = items[id.x];
           flat[id.x * 5 + 0] = item.a;
           flat[id.x * 5 + 1] = item.b.x;
           flat[id.x * 5 + 2] = item.b.y;
           flat[id.x * 5 + 3] = item.b.z;
           flat[id.x * 5 + 4] = (float)item.c;
         }`,
        'main',
        'cs_5_0',
      ),
    );
    csSet(unpack, { srv: [source.srv!], uav: [flatArray.uav] });
    dispatch(1);
    csSet(0n, { srv: [0n], uav: [0n] });
    const unpacked = flatArray.read();
    let exact = true;
    for (let index = 0; index < N; index += 1) {
      const expected = [index + 0.5, index * 2, index * 3, index * 4, index * 7];
      for (let field = 0; field < 5; field += 1) if (unpacked[index * 5 + field] !== expected[field]) exact = false;
    }
    check(tag('30 struct-layout'), exact, `AoS buffer from structLayout (stride ${layout.byteSize}, offsets ${JSON.stringify(layout.offsets)}) unpacks field-exact through FXC`);
    comRelease(unpack);
    flatArray.release();
    comRelease(source.srv!);
    comRelease(source.buffer);
  }

  {
    const cacheDirectory = `${import.meta.dir}/../.scratch/shader-cache`;
    rmSync(cacheDirectory, { force: true, recursive: true });
    const SOURCE = `RWStructuredBuffer<float> data : register(u0);
[numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { data[id.x] = data[id.x] * 4.0 + 0.25; }`;

    const coldStart = performance.now();
    const cold = compileCached(SOURCE, 'main', 'cs_5_0', {}, cacheDirectory);
    const coldMs = performance.now() - coldStart;
    const warmStart = performance.now();
    const warm = compileCached(SOURCE, 'main', 'cs_5_0', {}, cacheDirectory);
    const warmMs = performance.now() - warmStart;
    check(tag('29 cache-hit'), !cold.fromCache && warm.fromCache, `cold compile ${coldMs.toFixed(2)} ms (FXC) → warm load ${warmMs.toFixed(2)} ms (disk, no FXC)`);

    const runWith = (code: CompiledShader): Float32Array => {
      const shader = makeComputeShader(code);
      const values = new Float32Array(64);
      for (let index = 0; index < values.length; index += 1) values[index] = index;
      const array = GpuArray.from(values);
      csSet(shader, { uav: [array.uav] });
      dispatch(1);
      csSet(0n, { uav: [0n] });
      const result = new Float32Array(array.read());
      array.release();
      comRelease(shader);
      return result;
    };
    const coldResult = runWith(cold);
    const warmResult = runWith(warm);
    let identical = true;
    for (let index = 0; index < 64; index += 1) if (coldResult[index] !== warmResult[index]) identical = false;
    check(tag('29 cache-dispatch'), identical && warmResult[1] === 4.25, 'CreateComputeShader from cached bytes dispatches identically to the cold path');

    const cacheFiles = readdirSync(cacheDirectory);
    writeFileSync(`${cacheDirectory}/${cacheFiles[0]}`, Buffer.from('corrupted, not DXBC'));
    const repaired = compileCached(SOURCE, 'main', 'cs_5_0', {}, cacheDirectory);
    const reloaded = compileCached(SOURCE, 'main', 'cs_5_0', {}, cacheDirectory);
    check(tag('29 cache-corrupt'), !repaired.fromCache && reloaded.fromCache, 'corrupt cache entry silently recompiles and repairs the file');
    blobRelease(cold.blob);
    blobRelease(repaired.blob);
  }

  {
    const CAPACITY = 256;
    const THREADS = 320; // 64 over capacity — proves the drop-when-full contract
    const log = createKernelDebugLog(CAPACITY, 0);
    const logger = makeComputeShader(
      compile(
        `${log.hlslPrelude}
         [numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { DEBUG_LOG(id.x, id.x * 0.5); }`,
        'main',
        'cs_5_0',
      ),
    );
    csSet(logger, { uav: [log.uav] });
    dispatch(THREADS / 64);
    csSet(0n, { uav: [0n] });
    const { attempted, entries } = log.read();
    const threadIds = new Set(entries.map((entry) => entry.threadId));
    const bitExact = entries.every((entry) => entry.value === entry.threadId * 0.5);
    check(tag('28 debug-log-cursor'), attempted === THREADS && entries.length === CAPACITY, `attempted ${attempted} (= ${THREADS} threads), stored ${entries.length} (= capacity; overflow dropped as documented)`);
    check(tag('28 debug-log-values'), bitExact && threadIds.size === entries.length, 'decoded (threadId, value) pairs bit-exact via asuint round-trip, all threadIds distinct');
    comRelease(logger);
    log.release();
  }

  {
    const features = deviceFeatures();
    if (!features.doublePrecisionFloatShaderOps) {
      skip(tag('27 fp64'), 'device reports no double-precision shader ops');
    } else {
      const bits = new Uint32Array(2);
      run(
        `RWStructuredBuffer<uint> bits : register(u0);
         [numthreads(1,1,1)] void main() {
           double value = 0.1l + 0.2l;
           uint low;
           uint high;
           asuint(value, low, high);
           bits[0] = low;
           bits[1] = high;
         }`,
        { bits },
      );
      const reference = new Uint32Array(new Float64Array([0.1 + 0.2]).buffer);
      check(tag('27 fp64'), bits[0] === reference[0] && bits[1] === reference[1], `0.1 + 0.2 in shader doubles is bit-faithful to CPU Float64 (0x${bits[1]!.toString(16)}${bits[0]!.toString(16).padStart(8, '0')}) — provably not f32`);
    }
  }

  {
    const adapters = listAdapters();
    const warpIndex = adapters.findIndex((adapter) => adapter.description.includes('Basic Render Driver'));
    if (warpIndex === -1) {
      check(tag('26 adapter-pinned'), false, 'no WARP adapter in the census');
    } else {
      destroyDevice();
      const pinned = createComputeDevice({ adapter: warpIndex });
      // Verify the live device sits on the requested adapter by LUID, via the raw COM escape hatch.
      const ppDxgiDevice = Buffer.alloc(8);
      const iid = guidBytes(IID_IDXGIDEVICE);
      let luidMatch = false;
      if (vcall(pinned.device, IUNKNOWN_QUERY_INTERFACE, [FFIType.ptr, FFIType.ptr], [iid.ptr!, ppDxgiDevice.ptr!]) === 0) {
        const dxgiDevice = ppDxgiDevice.readBigUInt64LE(0);
        const ppAdapter = Buffer.alloc(8);
        if (vcall(dxgiDevice, DXGIDEVICE_GET_ADAPTER, [FFIType.ptr], [ppAdapter.ptr!]) === 0) {
          const adapterPointer = ppAdapter.readBigUInt64LE(0);
          const desc = Buffer.alloc(312);
          if (vcall(adapterPointer, DXGIADAPTER_GET_DESC, [FFIType.ptr], [desc.ptr!]) === 0) {
            luidMatch = desc.readUInt32LE(296) === adapters[warpIndex]!.luidLowPart && desc.readInt32LE(300) === adapters[warpIndex]!.luidHighPart;
          }
          comRelease(adapterPointer);
        }
        comRelease(dxgiDevice);
      }
      check(tag('26 adapter-pinned-luid'), luidMatch, `device created on adapter[${warpIndex}] — GetAdapter→GetDesc LUID matches the census (${adapters[warpIndex]!.description})`);
      const canary = new Float32Array([4, 9]);
      run('RWStructuredBuffer<float> data : register(u0);\n[numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { data[id.x] = sqrt(data[id.x]); }', { data: canary });
      check(tag('26 adapter-pinned-canary'), canary[0] === 2 && canary[1] === 3 && pinned.driver === 'WARP', `canary kernel ran on ${pinned.gpuName} (driver=${pinned.driver})`);
      destroyDevice();
      createComputeDevice(options);
    }
  }

  {
    const baseline = gpuMemory();
    const tracked = makeStructuredBuffer({ count: 1024, srv: true, stride: 4 });
    const constants = makeConstantBuffer(20); // rounds up to 32
    const texture = makeTexture({ w: 16, h: 16, srv: true });
    const after = gpuMemory();
    const bufferDelta = (after.bytesByCategory['buffer'] ?? 0) - (baseline.bytesByCategory['buffer'] ?? 0);
    const constantDelta = (after.bytesByCategory['constantBuffer'] ?? 0) - (baseline.bytesByCategory['constantBuffer'] ?? 0);
    const textureDelta = (after.bytesByCategory['texture'] ?? 0) - (baseline.bytesByCategory['texture'] ?? 0);
    check(tag('24 memory-bytes'), bufferDelta === 4096 && constantDelta === 32 && textureDelta === 1024, `byte-exact deltas: buffer +${bufferDelta}, constantBuffer +${constantDelta} (20→32 rounding), texture +${textureDelta}`);
    check(tag('24 memory-live'), after.liveResources === baseline.liveResources + 3, `liveResources ${baseline.liveResources} → ${after.liveResources}`);
    comRelease(tracked.srv!);
    comRelease(tracked.buffer);
    comRelease(constants);
    comRelease(texture.srv!);
    comRelease(texture.tex);
    const released = gpuMemory();
    check(tag('24 memory-release'), released.liveResources === baseline.liveResources && released.totalBytes === baseline.totalBytes, `back to baseline (${released.liveResources} live, ${released.totalBytes} bytes)`);

    const leaked = makeStructuredBuffer({ count: 256, stride: 4 });
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...parts: unknown[]): void => {
      warnings.push(parts.map(String).join(' '));
    };
    destroyDevice();
    console.warn = originalWarn;
    check(
      tag('24 memory-leak-warning'),
      warnings.some((line) => line.includes('live GPU resource')),
      `destroyDevice with a deliberate leak warned: ${warnings[0] ?? '(none)'}`,
    );
    void leaked;
    createComputeDevice(options);
  }

  {
    const a = GpuArray.from(new Float32Array(256 * 256).fill(1.25));
    const b = GpuArray.from(new Float32Array(256 * 256).fill(0.75));
    const c = GpuArray.alloc('float', 256 * 256);
    const matmul = new Kernel(
      `StructuredBuffer<float> a : register(t0);
       StructuredBuffer<float> b : register(t1);
       RWStructuredBuffer<float> c : register(u0);
       [numthreads(8,8,1)] void main(uint3 id : SV_DispatchThreadID) {
         float sum = 0;
         for (uint k = 0; k < 256; k += 1) sum += a[id.y * 256 + k] * b[k * 256 + id.x];
         c[id.y * 256 + id.x] = sum;
       }`,
    );
    let timing = { disjoint: true, frequency: 0n, gpuMilliseconds: 0 };
    let wallMilliseconds = 0;
    for (let attempt = 0; attempt < 3 && timing.disjoint; attempt += 1) {
      const timer = createGpuTimer();
      const wallStart = performance.now();
      timer.begin();
      matmul.dispatch({ a, b, c }, { groups: [32, 32] });
      timer.end();
      timing = timer.resolve();
      void c.read();
      wallMilliseconds = performance.now() - wallStart;
      timer.release();
    }
    check(
      tag('21 gpu-timer'),
      timing.frequency > 0n && !timing.disjoint && timing.gpuMilliseconds > 0 && timing.gpuMilliseconds <= wallMilliseconds,
      `matmul gpu=${timing.gpuMilliseconds.toFixed(3)} ms ≤ wall=${wallMilliseconds.toFixed(3)} ms, frequency=${timing.frequency}`,
    );
    a.release();
    b.release();
    c.release();
    matmul.release();
  }

  destroyDevice();
}

async function runAsyncSections(label: string, options: CreateDeviceOptions): Promise<void> {
  const gpu = createComputeDevice(options);
  const tag = (name: string): string => `${name} [${label}]`;

  {
    const values = new Float32Array(262_144);
    for (let index = 0; index < values.length; index += 1) values[index] = index * 0.5;
    const array = GpuArray.from(values);
    // A deliberately heavy dispatch so the staging copy is still in flight when polling starts.
    const heavy = new Kernel(
      `RWStructuredBuffer<float> data : register(u0);
       [numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) {
         float accumulator = data[id.x];
         for (uint i = 0; i < 4096; i += 1) accumulator = sqrt(accumulator + 1.0);
         data[id.x] = accumulator;
       }`,
    );
    // Queue enough work that the GPU is still busy when polling starts — hardware
    // drains a single dispatch in well under a millisecond, WARP needs only one.
    const queuedDispatches = label === 'hardware' ? 64 : 1;
    for (let dispatchIndex = 0; dispatchIndex < queuedDispatches; dispatchIndex += 1) heavy.dispatch({ data: array });
    let intervalTicks = 0;
    const interval = setInterval(() => {
      intervalTicks += 1;
    }, 1);
    const asyncResult = await array.readAsync();
    clearInterval(interval);
    const syncResult = array.read();
    let identical = asyncResult.length === syncResult.length;
    for (let index = 0; index < asyncResult.length; index += 1) if (asyncResult[index] !== syncResult[index]) identical = false;
    check(tag('22 async-readback-bytes'), identical, `${asyncResult.length} elements byte-equal sync vs async`);
    check(tag('22 async-readback-liveness'), intervalTicks > 0, `event loop stayed live during await (${intervalTicks} interval ticks)`);
    array.release();
    heavy.release();
  }

  destroyDevice();
}

runSections('hardware', {});
runSections('warp', { driver: 'warp' });
await runAsyncSections('hardware', {});
await runAsyncSections('warp', { driver: 'warp' });

{
  const hardware = determinismByDriver.get('hardware');
  const warp = determinismByDriver.get('WARP');
  if (hardware === undefined || warp === undefined) {
    check('13 determinism-cross-driver', hardware !== undefined && warp !== undefined, 'both drivers produced results');
  } else {
    let maxDelta = 0;
    for (let index = 0; index < hardware.length; index += 1) {
      const delta = Math.abs(hardware[index]! - warp[index]!);
      if (delta > maxDelta) maxDelta = delta;
    }
    check('13 determinism-cross-driver', maxDelta < 1e-5, `hardware vs WARP elementwise max |Δ| = ${maxDelta.toExponential(2)}`);
  }
}

if (Bun.env.NO_WINDOW === '1') {
  skip('20 snapshot', 'NO_WINDOW=1');
} else {
  const win = createWindow({ title: 'gpu.selftest snapshot', width: 320, height: 240, borderless: true });
  const { w, h } = win.clientSize();
  const gpu = createDevice(win.hwnd, { width: w, height: h });
  const vs = makeVertexShader(compile(FULLSCREEN_VS, 'main', 'vs_5_0'));
  const ps = makePixelShader(compile('float4 main(float4 fp : SV_Position, float2 uv : TEXCOORD0) : SV_Target { return float4(uv.x, 0.6, 1.0 - uv.y, 1); }', 'main', 'ps_5_0'));
  win.pump();
  setRenderTargets([gpu.backBufferRTV]);
  setViewport(w, h);
  clear(gpu.backBufferRTV, [0, 0, 0, 1]);
  vsSet(vs);
  psSet(ps);
  drawFullscreenTriangle();
  const stats = captureBackBuffer(gpu, `${import.meta.dir}/../.scratch/selftest-snapshot.png`);
  gpu.present(false);
  check('20 snapshot', stats.ok && stats.nonBlackFrac > 0.9, `captured ${stats.width}x${stats.height}, nonBlack=${stats.nonBlackFrac.toFixed(3)}, meanLuma=${stats.meanLuma.toFixed(3)}`);
  win.destroy();
  destroyDevice();
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exitCode = failures > 0 ? 1 : 0;
