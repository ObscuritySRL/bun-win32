/**
 * Hello GPU — square roots on whatever GPU you have, in ten lines.
 *
 * Compiles an HLSL kernel at runtime with d3dcompiler_47, dispatches it on the first
 * available device (NVIDIA/AMD/Intel hardware, or WARP software — works on every
 * Windows machine), and reads the result back. No native modules, no build step.
 *
 * APIs demonstrated:
 * - run (one-shot compile → upload → dispatch → readback)
 *
 * Run: bun run example/hello-gpu.ts
 */
import { run } from '@bun-win32/gpu';

const { data } = run(
  `RWStructuredBuffer<float> data : register(u0);
   [numthreads(64, 1, 1)] void main(uint3 id : SV_DispatchThreadID) { data[id.x] = sqrt(data[id.x]); }`,
  { data: new Float32Array([1, 4, 9, 16, 25, 36, 49, 64]) },
);

console.log([...data]);
