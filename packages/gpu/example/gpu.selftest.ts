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
import {
  type CreateDeviceOptions,
  DXGI_ERROR_DEVICE_HUNG,
  DXGI_ERROR_DEVICE_REMOVED,
  DXGI_ERROR_DEVICE_RESET,
  GpuArray,
  Kernel,
  captureBackBuffer,
  cbufferLayout,
  clear,
  clearDepth,
  compile,
  createComputeDevice,
  createDevice,
  createWindow,
  describeDeviceError,
  destroyDevice,
  drawFullscreenTriangle,
  drawTriangles,
  getDeviceRemovedReason,
  listAdapters,
  makeDepthBuffer,
  makePixelShader,
  makeTexture,
  makeVertexShader,
  psSet,
  readbackTexture,
  releaseDepth,
  run,
  setCull,
  setDepthState,
  setRenderTargets,
  setRenderTargetsWithDepth,
  setViewport,
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

  destroyDevice();
}

runSections('hardware', {});
runSections('warp', { driver: 'warp' });

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
