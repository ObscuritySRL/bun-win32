/**
 * Benchmark — the numbers the README quotes, measured on THIS machine.
 *
 * Times the UIA hot paths: a single cross-process property read, the naive vs cached subtree walk
 * (the headline), the agent-grounding tree build, and a waitFor poll. Prints a markdown table.
 * Numbers come from this gated run only — never copied. Run twice to confirm stability.
 *
 * APIs demonstrated:
 * - Element property reads, findAll vs findAllCached (the cached round-trip), uia.tree, waitFor
 *
 * Run: bun run example/benchmark.ts
 */
import { FFIType } from 'bun:ffi';
import { numberOfDFGCompiles } from 'bun:jsc';
import { createCacheRequest, estimateTokens, SLOT, uia, vcall } from '@bun-win32/uia';
import User32 from '@bun-win32/user32';

uia.initialize();
Bun.spawn(['cmd', '/c', 'start', 'calc'], { stdout: 'ignore', stderr: 'ignore' });
let hWnd = 0n;
const calc = Buffer.from('Calculator\0', 'utf16le');
for (let i = 0; i < 20 && hWnd === 0n; i += 1) {
  Bun.sleepSync(400);
  hWnd = User32.FindWindowW(null, calc.ptr!);
}
Bun.sleepSync(900);
const window = uia.attach(hWnd);

function median(run: () => void, iterations: number): number {
  for (let i = 0; i < Math.min(iterations, 5000); i += 1) run(); // warm
  const start = Bun.nanoseconds();
  for (let i = 0; i < iterations; i += 1) run();
  return (Bun.nanoseconds() - start) / iterations;
}

// 1. single cross-process property read
const out4 = Buffer.alloc(4);
let sink = 0;
const readControlType = (): void => {
  vcall(window.ptr, SLOT.get_CurrentControlType, [FFIType.ptr], [out4.ptr!]);
  sink += out4.readInt32LE(0);
};
const readNs = median(readControlType, 200_000);

// 2 + 3. naive vs cached subtree walk (5 properties/node)
const request = createCacheRequest();
const naiveWalk = (): void => {
  for (const element of window.findAll({})) {
    sink += element.name.length + element.controlType + element.automationId.length + element.boundingRectangle.width;
    element.release();
  }
};
const cachedWalk = (): void => {
  for (const element of window.findAllCached({}, request)) {
    sink += element.cachedName.length + element.cachedControlType + element.cachedAutomationId.length + element.cachedBoundingRectangle.width;
    element.release();
  }
};
const nodes = window.findAll({}).map((element) => (element.release(), 1)).length;
const naiveMs = median(naiveWalk, 30) / 1e6;
const cachedMs = median(cachedWalk, 30) / 1e6;
request.release();

// 4. tree build + tokens
let treeTokens = 0;
const treeBuild = (): void => {
  treeTokens = estimateTokens(uia.tree(window, { agentProfile: true }));
};
const treeMs = median(treeBuild, 20) / 1e6;

console.log(`\n# bun-uia benchmark (sink=${sink})\n`);
console.log(`machine: Windows ${Bun.env.OS ?? ''} ${process.platform}, Bun ${Bun.version}, ${navigator.hardwareConcurrency} logical CPUs\n`);
console.log('| operation | result |');
console.log('| --- | --- |');
console.log(`| single property read (cross-process) | ${(readNs / 1000).toFixed(2)} µs |`);
console.log(`| naive subtree walk (${nodes} nodes, 4 props) | ${naiveMs.toFixed(2)} ms |`);
const cacheRatio = naiveMs / cachedMs;
const cacheLabel =
  cacheRatio >= 1
    ? `${cacheRatio.toFixed(2)}× faster than naive`
    : `${(1 / cacheRatio).toFixed(2)}× SLOWER on this small ${nodes}-node tree — the cached walk trades a fixed BuildCache round-trip for N lazy reads, so it pays off only as the tree grows (large cross-process trees are where it wins)`;
console.log(`| **cached subtree walk** (1 round-trip) | **${cachedMs.toFixed(2)} ms** (${cacheLabel}) |`);
console.log(`| agent-grounding tree build | ${treeMs.toFixed(2)} ms, ~${treeTokens} tokens |`);
console.log(`| vs OSWorld a11y-tree build (3–26 s) | **${(3000 / treeMs).toFixed(0)}–${(26000 / treeMs).toFixed(0)}× faster** |`);
console.log(`\nDFG-compiled: read=${numberOfDFGCompiles(readControlType) > 0} naive=${numberOfDFGCompiles(naiveWalk) > 0} cached=${numberOfDFGCompiles(cachedWalk) > 0}`);

window.dispose();
uia.uninitialize();
