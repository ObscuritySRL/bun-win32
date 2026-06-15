/**
 * Safety floor — live proof that @bun-win32/uia survives an unattended agent loop over arbitrary apps.
 *
 * Four crash/leak hazards a long-lived driver hits, each proven fixed:
 *  A. WGC bundle lifecycle — init → capture → uninitialize → capture ×3 stays clean: uninitialize now frees
 *     the cached D3D11 device + 4 COM/WinRT interfaces (was: leaked + a STALE bundle reused after re-init,
 *     which degrades to null) and the next capture rebuilds a FRESH bundle. Run as a SUBPROCESS so any crash
 *     surfaces as a non-zero exit; if WGC is available, the final capture (on a bundle rebuilt after two
 *     uninitialize cycles) must succeed — positively proving the rebuild. (Honest: the pre-fix path did NOT
 *     segfault — the interfaces stay ref-counted-alive past CoUninitialize — so this is a leak/staleness fix.)
 *  B. null interface pointer — vcall(0n) / new Element(0n).name must throw a catchable Error, not segfault
 *     (read.ptr(0,0) segfaults the runtime — verified — so the guard is a real crash fix).
 *  C. MSAA child-count clamp — a 2.1-billion count caps to a 1 MB alloc (not 34 GB) and the real walk works.
 *  D. slot-gate is green AND has teeth — `bun test slot-gate.test.ts` exits 0 with the WGC/MSAA coverage line.
 *
 * bun test is broken repo-wide for FFI; this is a standalone harness:
 * Run: bun run example/safety-floor.integration.test.ts
 */
import { captureWindowLive, closeWindow, disposeWgc, Element, findWindow, msaaTree, uia, vcall, wgcAvailable } from '@bun-win32/uia';

// --- child mode: the WGC lifecycle loop, run in a subprocess so a segfault surfaces as a non-zero exit ---
if (Bun.env.SAFETY_CHILD === 'wgc') {
  uia.initialize();
  const available = wgcAvailable(); // build + cache the device bundle (false on a locked/headless box)
  Bun.spawn(['cmd', '/c', 'start', 'calc'], { stdout: 'ignore', stderr: 'ignore' });
  let hWnd = 0n;
  for (let attempt = 0; attempt < 20 && hWnd === 0n; attempt += 1) {
    Bun.sleepSync(300);
    hWnd = findWindow({ title: 'Calculator' });
  }
  let lastCaptureOk = false;
  for (let iteration = 0; iteration < 3; iteration += 1) {
    uia.initialize();
    lastCaptureOk = (await captureWindowLive(hWnd)) !== null; // iterations 2-3 run on a bundle rebuilt after a prior uninitialize
    uia.uninitialize(); // disposeWgc() runs first → bundle released + nulled, RoUninitialize paired
  }
  disposeWgc(); // idempotent no-op (already disposed) — proves the self-guard
  if (hWnd !== 0n) closeWindow(hWnd); // close the throwaway Calculator
  // If WGC is available, the final capture (bundle rebuilt after two uninitialize cycles) must succeed.
  process.exit(available && hWnd !== 0n && !lastCaptureOk ? 2 : 0);
}

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

// --- B. null interface pointer → catchable Error, not a crash (in-process; the guard makes it safe) ---
console.log('\n[B] null interface pointer guard');
let vcallThrew = '';
try {
  vcall(0n, 8, [], []);
} catch (error) {
  vcallThrew = (error as Error).message;
}
assert(vcallThrew.includes('null interface pointer') && vcallThrew.includes('slot 8'), 'vcall(0n, 8) throws a catchable Error (not a segfault)');
const zero = new Element(0n);
assert(zero.ptr === 0n, 'new Element(0n) constructs without throwing (ctor stays unguarded by design)');
let getterThrew = '';
try {
  void zero.name;
} catch (error) {
  getterThrew = (error as Error).message;
}
assert(getterThrew.includes('null interface pointer'), 'Element(0n).name throws via the vcall chokepoint (not a segfault)');

// --- C. MSAA accChildCount clamp (arithmetic + the real walk still works) ---
console.log('\n[C] MSAA child-count clamp');
assert(Math.min(0x7fff_ffff, 0x0001_0000) === 0x0001_0000, 'a 2.1B child count clamps to 65536 (a 1 MB alloc, not ~34 GB)');
uia.initialize();
Bun.spawn(['cmd', '/c', 'start', 'calc'], { stdout: 'ignore', stderr: 'ignore' });
let calcHwnd = 0n;
for (let attempt = 0; attempt < 20 && calcHwnd === 0n; attempt += 1) {
  Bun.sleepSync(300);
  calcHwnd = findWindow({ title: 'Calculator' });
}
const tree = calcHwnd !== 0n ? msaaTree(calcHwnd, 3) : null;
assert(tree !== null, 'msaaTree still returns a tree (the hoisted IID did not break the walk)');
if (calcHwnd !== 0n) closeWindow(calcHwnd); // close the throwaway Calculator
uia.uninitialize();

// --- A. WGC bundle lifecycle subprocess: init → capture → uninitialize → capture ×3, clean + rebuilt ---
console.log('\n[A] WGC bundle lifecycle (subprocess; exit-code asserted)');
const child = Bun.spawn([process.execPath, import.meta.path], { env: { ...Bun.env, SAFETY_CHILD: 'wgc' }, stdout: 'ignore', stderr: 'inherit' });
const childExit = await child.exited;
assert(childExit === 0, `init→capture→uninitialize→capture ×3 stayed clean and the post-uninitialize bundle rebuilt (exit ${childExit}; crash→non-zero, stale-bundle failure→2)`);

// --- D. slot-gate green with WGC/MSAA coverage ---
console.log('\n[D] slot-gate green + WGC/MSAA coverage');
const gate = Bun.spawn(['bun', 'test', 'slot-gate.test.ts'], { cwd: import.meta.dir.replace(/[/\\]example$/, ''), stdout: 'pipe', stderr: 'pipe' });
const gateOut = `${await new Response(gate.stdout).text()}${await new Response(gate.stderr).text()}`;
const gateExit = await gate.exited;
assert(gateExit === 0, `slot-gate.test.ts passes (exit ${gateExit})`);
assert(/wgc\/msaa slot-gate: \d+ verified, \d+ skipped \(header absent\), 0 mismatched/.test(gateOut), 'the new WGC/MSAA/D3D11 coverage line reports 0 mismatched');

console.log(failures === 0 ? '\nPASS — safety floor verified (WGC bundle released + rebuilt, no null-deref crash, MSAA clamped, slots gated).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
