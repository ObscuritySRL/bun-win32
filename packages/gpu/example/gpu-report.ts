/**
 * GPU report — a professional diagnostic of the machine's GPU stack.
 *
 * Prints the DXGI adapter census (name, VRAM, vendor, software flag), the active
 * D3D11 device with its feature level and driver type, a probe-kernel compile with
 * timing, the head of its DXBC disassembly, empty-dispatch latency averaged over
 * 1,000 submissions, and staging-readback bandwidth at 1/16/64 MB.
 *
 * APIs demonstrated:
 * - listAdapters (adapter census with VRAM/vendor/flags)
 * - createComputeDevice / vcall (device + GetFeatureLevel via raw COM)
 * - compile / disassemble (FXC round trip with timing)
 * - Kernel / GpuArray (dispatch latency)
 * - makeStructuredBuffer / readbackBuffer (bandwidth)
 *
 * Run: bun run example/gpu-report.ts
 */
import { DEV_GET_FEATURE_LEVEL, GpuArray, Kernel, comRelease, compile, createComputeDevice, destroyDevice, disassemble, listAdapters, makeStructuredBuffer, readbackBuffer, vcall } from '@bun-win32/gpu';
import { FFIType } from 'bun:ffi';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[96m';
const GREEN = '\x1b[92m';
const MAGENTA = '\x1b[95m';
const YELLOW = '\x1b[93m';

function vendorName(vendorId: number): string {
  switch (vendorId) {
    case 0x10de:
      return 'NVIDIA';
    case 0x1002:
      return 'AMD';
    case 0x8086:
      return 'Intel';
    case 0x1414:
      return 'Microsoft';
    default:
      return `0x${vendorId.toString(16).padStart(4, '0')}`;
  }
}

function gigabytes(bytes: bigint): string {
  return `${(Number(bytes) / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

console.log(`\n${BOLD}${MAGENTA}◼ GPU Report${RESET}  ${DIM}— @bun-win32/gpu diagnostic${RESET}\n`);

const adapters = listAdapters();
console.log(`${BOLD}Adapters${RESET}`);
for (const [index, adapter] of adapters.entries()) {
  const flags = adapter.isSoftware ? `${YELLOW}software${RESET}` : `${GREEN}hardware${RESET}`;
  console.log(`  [${index}] ${CYAN}${adapter.description}${RESET}`);
  console.log(
    `      ${DIM}vendor${RESET} ${vendorName(adapter.vendorId).padEnd(10)} ${DIM}vram${RESET} ${gigabytes(adapter.dedicatedVideoMemory).padStart(9)} ${DIM}shared${RESET} ${gigabytes(adapter.sharedSystemMemory).padStart(9)}  ${flags}`,
  );
}

const gpu = createComputeDevice();
const featureLevelValue = vcall(gpu.device, DEV_GET_FEATURE_LEVEL, [], [], FFIType.u32);
const featureLevel = `${(featureLevelValue >> 12) & 0xf}.${(featureLevelValue >> 8) & 0xf}`;
console.log(`\n${BOLD}Active device${RESET}`);
console.log(`  ${CYAN}${gpu.gpuName}${RESET} ${DIM}driver${RESET} ${gpu.driver} ${DIM}feature level${RESET} ${featureLevel}`);

const PROBE_HLSL = `RWStructuredBuffer<float> data : register(u0);
[numthreads(64,1,1)] void main(uint3 id : SV_DispatchThreadID) { data[id.x] = sqrt(data[id.x] * 2.0 + 1.0); }`;
const compileStart = performance.now();
const code = compile(PROBE_HLSL, 'main', 'cs_5_0');
const compileMs = performance.now() - compileStart;
console.log(`\n${BOLD}Shader toolchain${RESET}`);
console.log(`  compile: ${YELLOW}${compileMs.toFixed(1)} ms${RESET} → ${code.size} bytes of DXBC (cs_5_0)`);
const assembly = disassemble(code).split('\n').slice(0, 15);
for (const line of assembly) console.log(`  ${DIM}${line}${RESET}`);

const kernel = new Kernel(PROBE_HLSL);
const array = GpuArray.from(new Float32Array(64));
kernel.dispatch({ data: array });
void array.read();
const DISPATCHES = 1000;
const dispatchStart = performance.now();
for (let index = 0; index < DISPATCHES; index += 1) kernel.dispatch({ data: array });
void array.read();
const dispatchMicroseconds = ((performance.now() - dispatchStart) / DISPATCHES) * 1000;
console.log(`\n${BOLD}Dispatch latency${RESET}`);
console.log(`  ${YELLOW}${dispatchMicroseconds.toFixed(1)} µs${RESET} per dispatch ${DIM}(avg over ${DISPATCHES}, includes one final sync)${RESET}`);
array.release();
kernel.release();

console.log(`\n${BOLD}Readback bandwidth${RESET}`);
for (const megabytes of [1, 16, 64]) {
  const bytes = megabytes * 1024 * 1024;
  const source = makeStructuredBuffer({ count: bytes / 4, srv: true, stride: 4 });
  void readbackBuffer(source.buffer, bytes);
  const ITERATIONS = 5;
  const start = performance.now();
  for (let iteration = 0; iteration < ITERATIONS; iteration += 1) void readbackBuffer(source.buffer, bytes);
  const seconds = (performance.now() - start) / 1000 / ITERATIONS;
  console.log(`  ${String(megabytes).padStart(2)} MB: ${YELLOW}${(megabytes / seconds).toFixed(0).padStart(6)} MB/s${RESET}`);
  comRelease(source.srv ?? 0n);
  comRelease(source.buffer);
}

destroyDevice();
console.log();
