/**
 * perf-gate — the package's ONLY perf-regression gate. slot-gate is correctness-only; benchmark.ts and
 * condition-perf assert direction or just print, so a 3–10× blow-up in a hot path (vcall dispatch, a cached
 * property read, the agent-grounding tree build) would ship silently. This launches Calculator, measures the
 * three published numbers with the same median() harness, and asserts ABSOLUTE ceilings — set at roughly 3×
 * the measured-stable medians so they catch a regression, not machine jitter — plus that each TIGHT-LOOP hot
 * closure DFG-compiled (a deopt is itself a regression). Run it next to slot-gate before a release.
 *
 * NOTE: this gate covers ONLY Calculator's small tree — it does NOT exercise a HIGH-DENSITY (flat) window with
 * thousands of non-virtualized sibling controls, which used to wall the snapshot ~7s with no escape hatch. That
 * hazard is now gated by dense-tree-budget.integration.test.ts (maxNodes budget + truncation); run both before a release.
 *
 * Ceilings (generous headroom, JSC on this repo's pinned Bun; the live numbers print so drift is visible):
 *  - single cached property read (in-proc)  < 3 µs   (vcall dispatch into a prefetched object; ~0.5 µs here)
 *  - agent-grounding tree build             < 150 ms (a cross-process Subtree BuildCache walk; ~45–60 ms here)
 *  - single cross-process property read     < 200 µs (a full COM-proxy round-trip; ~30–60 µs here)
 *
 * APIs demonstrated:
 * - vcall + SLOT.get_CurrentControlType (the cross-process read), createCacheRequest + buildUpdatedCache +
 *   cachedControlType (the in-proc cached read), uia.tree + estimateTokens (agent-grounding build)
 * - numberOfDFGCompiles (bun:jsc) — proves each hot closure JIT-optimized, not interpreted
 * - windowProcessId + taskkill teardown — Calculator is UWP, so force-kill the window owner by PID
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/perf-gate.integration.test.ts
 */
import { FFIType } from 'bun:ffi';
import { numberOfDFGCompiles } from 'bun:jsc';
import { AutomationElementMode, createCacheRequest, estimateTokens, SLOT, TreeScope, uia, vcall, windowProcessId } from '@bun-win32/uia';

// Ceilings are ~3× the measured-stable medians on this repo's pinned Bun (cross-process ~80–100 µs, cached
// ~1.8 µs, tree build ~0.3 ms) — wide enough for jitter, tight enough to catch a 3–10× hot-path regression.
const READ_CEILING_US = 200; // single cross-process property read (a full COM-proxy round-trip; ~30–60 µs)
const CACHED_CEILING_US = 3; // single in-proc cached property read (vcall dispatch into a prefetched object; ~0.5 µs)
const TREE_CEILING_MS = 150; // agent-grounding tree build (a cross-process Subtree BuildCache walk; ~45–60 ms)

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

/** Median-ish per-iteration cost in ns: warm to trigger JIT, then time `iterations` runs and divide. */
function perCallNs(run: () => void, iterations: number): number {
  for (let i = 0; i < Math.min(iterations, 5000); i += 1) run();
  const start = Bun.nanoseconds();
  for (let i = 0; i < iterations; i += 1) run();
  return (Bun.nanoseconds() - start) / iterations;
}

uia.initialize();
const window = await uia.launch(['cmd', '/c', 'start', 'calc'], { title: 'Calculator' });
const pid = windowProcessId(window.hWnd);
try {
  // Wait until Calculator's UIA subtree is realized — measuring a half-built tree is meaningless.
  let descendants = 0;
  for (let attempt = 0; attempt < 20 && descendants < 5; attempt += 1) {
    const probe = window.findAll({});
    descendants = probe.length;
    for (const element of probe) element.release();
    if (descendants < 5) await Bun.sleep(250);
  }
  assert(descendants >= 5, `Calculator subtree realized (${descendants} descendants) before measuring`);

  // The cached read and tree build need a healthy STA apartment, and a 100k tight FFI loop starves the
  // message pump (BuildUpdatedCache then returns an empty cache) — so the cross-process loop is measured LAST.

  // 1. single in-proc CACHED property read — vcall machinery into an already-prefetched cached object, no hop.
  // This is the vcall-dominated number: the in-proc getter is trivial, so it tracks dispatch overhead.
  const request = createCacheRequest(undefined, TreeScope.TreeScope_Subtree, AutomationElementMode.None);
  const cached = window.buildUpdatedCache(request);
  assert(cached.cachedControlType !== 0, `cache populated (root cachedControlType=${cached.cachedControlType})`);
  let cachedSink = 0;
  const cachedRead = (): void => {
    cachedSink += cached.cachedControlType;
  };
  const cachedNs = perCallNs(cachedRead, 100_000);
  request.release();
  console.log(`\n[1] single in-proc cached read: ${(cachedNs / 1000).toFixed(3)} µs (ceiling ${CACHED_CEILING_US} µs)`);
  assert(cachedNs / 1000 < CACHED_CEILING_US, `cached read ${(cachedNs / 1000).toFixed(3)} µs < ${CACHED_CEILING_US} µs ceiling`);
  assert(numberOfDFGCompiles(cachedRead) > 0, 'the cached-read closure DFG-compiled');

  // 2. agent-grounding tree build — the whole BuildCache walk + serialize the LLM hands off (the big win vs
  // OSWorld). A macro op (run a handful of times), so it is timed but NOT DFG-asserted (it never gets hot).
  let treeTokens = 0;
  const treeBuild = (): void => {
    treeTokens = estimateTokens(uia.tree(window, { agentProfile: true }));
  };
  const treeMs = perCallNs(treeBuild, 20) / 1e6;
  console.log(`[2] agent-grounding tree build: ${treeMs.toFixed(3)} ms, ~${treeTokens} tokens (ceiling ${TREE_CEILING_MS} ms)`);
  assert(treeMs < TREE_CEILING_MS, `tree build ${treeMs.toFixed(3)} ms < ${TREE_CEILING_MS} ms ceiling`);

  // 3. single cross-process property read — a full COM-proxy round-trip (vcall dispatch + the cross-process hop).
  const out4 = Buffer.alloc(4);
  let sink = 0;
  const crossProcessRead = (): void => {
    vcall(window.ptr, SLOT.get_CurrentControlType, [FFIType.ptr], [out4.ptr!]);
    sink += out4.readInt32LE(0);
  };
  const readNs = perCallNs(crossProcessRead, 100_000);
  console.log(`[3] single cross-process property read: ${(readNs / 1000).toFixed(3)} µs (ceiling ${READ_CEILING_US} µs)`);
  assert(readNs / 1000 < READ_CEILING_US, `cross-process read ${(readNs / 1000).toFixed(3)} µs < ${READ_CEILING_US} µs ceiling`);
  assert(numberOfDFGCompiles(crossProcessRead) > 0, 'the cross-process read closure DFG-compiled');

  console.log(`  (sink=${sink} cachedSink=${cachedSink})`);
} finally {
  if (pid) Bun.spawnSync(['taskkill', '/F', '/PID', String(pid)]);
  window.dispose();
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — all hot paths within ceiling and DFG-compiled.' : `\nFAILED — ${failures} perf assertion(s) over ceiling`);
process.exit(failures === 0 ? 0 : 1);
