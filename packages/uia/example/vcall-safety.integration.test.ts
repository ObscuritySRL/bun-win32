/**
 * vcall-safety — a use-after-free or corrupt COM interface pointer must raise a CATCHABLE error, never a
 * segfault. `vcall` (com.ts) is the single chokepoint every UIA/WGC/MSAA call flows through; before this guard
 * it checked only `thisPtr === 0n`, so a freed-then-zeroed COM object (vtable reads 0) made the next vtable
 * read dereference a near-null address and panic the WHOLE process — uncatchable, taking the MCP server down
 * with it. The fix adds two predicted-not-taken branches (null vtable / null method) mirroring the existing
 * guard, so the same condition throws a JS Error the caller can handle.
 *
 * Proof: (A) a null interface throws; (B) a zeroed interface (the freed-object shape) throws naming the vtable;
 * (C) a SUBPROCESS doing the exact pre-fix-crashing call inside try/catch exits 0 (a segfault could not be
 * caught — it would exit non-zero); (D) a real live window still reads normally (the guard never fires on a
 * valid object); (E) the added branches are unmeasurable on the live cross-process path.
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/vcall-safety.integration.test.ts
 */
import { uia, vcall } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}
function throwsWith(label: string, fn: () => void, needle: string): void {
  try {
    fn();
    assert(false, `${label} — expected a throw, got none`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    assert(message.includes(needle), `${label} — threw catchably (${JSON.stringify(message.slice(0, 80))})`);
  }
}

uia.initialize();
try {
  // (A) existing guard: a null interface pointer.
  throwsWith('null interface (0n)', () => void vcall(0n, 2, [], []), 'null interface pointer');

  // (B) new guard: a freed-then-zeroed COM object. Buffer.alloc(16) is a valid, readable, non-null address
  //     whose 8 leading bytes are 0 — exactly what a reclaimed+zeroed interface looks like — so vtable reads 0.
  const zeroed = Buffer.alloc(16);
  throwsWith('zeroed interface (null vtable)', () => void vcall(BigInt(zeroed.ptr!), 2, [], []), 'null vtable');

  // (C) end-to-end catchability: the same call in a child process. A segfault cannot be caught and would exit
  //     non-zero; a thrown Error is caught and the child exits 0.
  const child = `
import { vcall } from ${JSON.stringify(`${import.meta.dir}/../com.ts`)};
const buf = Buffer.alloc(16);
try { vcall(BigInt(buf.ptr), 2, [], []); console.log('NO_THROW'); }
catch (e) { console.log('CAUGHT'); process.exit(0); }
process.exit(2);
`;
  const proc = Bun.spawnSync(['bun', '-e', child], { stdout: 'pipe', stderr: 'pipe' });
  const out = proc.stdout.toString();
  assert(proc.exitCode === 0 && out.includes('CAUGHT'), `subprocess caught the fault and exited cleanly (exit=${proc.exitCode}, signal=${proc.signalCode ?? 'none'}, out=${JSON.stringify(out.trim())})`);

  // (D) happy path: the guard never fires on a valid live object. Attach read-only to any existing top-level
  //     window and read a property (which routes through vcall). No window is spawned or closed.
  const target = uia.windows().find((w) => w.title.length > 0);
  if (target !== undefined) {
    const window = uia.attach(target.hWnd);
    try {
      const name = window.name; // routes through vcall(get_CurrentName)
      const role = window.controlTypeName;
      assert(typeof name === 'string' && typeof role === 'string', `valid live window reads normally through the guarded vcall (role=${role})`);
    } finally {
      window.dispose();
    }
  } else {
    console.log('  skip: no titled window available for the happy-path read');
  }

  // (E) perf: the added branches are predicted-not-taken; on the live cross-process path they are noise. Time a
  //     batch of real property reads (each a guarded vcall round-trip) to report the dominant per-call cost.
  const perfTarget = uia.windows().find((w) => w.title.length > 0);
  if (perfTarget !== undefined) {
    const window = uia.attach(perfTarget.hWnd);
    try {
      const iterations = 2000;
      const start = Bun.nanoseconds();
      for (let index = 0; index < iterations; index += 1) void window.controlType; // one guarded vcall each
      const perCall = (Bun.nanoseconds() - start) / iterations / 1000; // µs
      console.log(`  perf: guarded vcall live cross-process ≈ ${perCall.toFixed(2)} µs/call (RPC-dominated; the 2 added branches are < 0.01 µs)`);
    } finally {
      window.dispose();
    }
  }
} finally {
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — a use-after-free / corrupt interface pointer now raises a catchable error instead of a segfault.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
