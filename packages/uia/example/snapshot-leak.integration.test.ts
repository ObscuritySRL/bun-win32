/**
 * snapshot-leak — a fault mid-walk must not leak COM refs. walk()/walkLive() materialize a node's WHOLE child
 * array (each child a new AddRef'd Element) then recurse; if a child's property read throws partway (now possible
 * since the v1.5.0 vcall guards turn a torn-down-tree use-after-free into a catchable THROW), the not-yet-walked
 * siblings must still be released. The fix pushes every child to `owned` BEFORE recursing, so the snapshot's
 * error path frees all of them.
 *
 * Proof: instrument Element — count release() calls and materialized children, inject a throw mid-walk, then
 * assert releases >= materialized (every AddRef'd child was released). Closes Notepad.
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/snapshot-leak.integration.test.ts
 */
import { closeWindow, Element, snapshot, uia, windowProcessId } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

uia.initialize();
let notepad = 0n;
const prior = new Set(uia.windows().filter((w) => /Notepad/i.test(w.className)).map((w) => w.hWnd));
Bun.spawn(['notepad.exe'], { stdout: 'ignore', stderr: 'ignore' });
for (let attempt = 0; attempt < 40 && notepad === 0n; attempt += 1) {
  await Bun.sleep(150);
  notepad = uia.windows().find((w) => /Notepad/i.test(w.className) && !prior.has(w.hWnd))?.hWnd ?? 0n;
}

// instrument Element.prototype: count releases + materialized children, and inject a throw mid-walk.
const proto = Element.prototype as unknown as { release(): void; readonly cachedChildren: Element[]; readonly cachedControlType: number };
const releaseDescriptor = Object.getOwnPropertyDescriptor(proto, 'release');
const childrenDescriptor = Object.getOwnPropertyDescriptor(proto, 'cachedChildren');
const controlTypeDescriptor = Object.getOwnPropertyDescriptor(proto, 'cachedControlType');
let releases = 0;
let materialized = 0;
let armed = false;
let controlTypeReads = 0;
const THROW_AT = 6; // mid-tree: after a few nodes are walked, so the old code would orphan later siblings

try {
  assert(notepad !== 0n, 'launched Notepad');
  if (notepad !== 0n) {
    await Bun.sleep(500);
    const win = uia.attach(notepad);
    Object.defineProperty(proto, 'release', { configurable: true, value() { if (armed) releases += 1; return releaseDescriptor!.value.call(this); } });
    Object.defineProperty(proto, 'cachedChildren', { configurable: true, get() { const kids = childrenDescriptor!.get!.call(this) as Element[]; if (armed) materialized += kids.length; return kids; } });
    Object.defineProperty(proto, 'cachedControlType', { configurable: true, get() { if (armed && ++controlTypeReads === THROW_AT) throw new Error('injected mid-walk fault'); return controlTypeDescriptor!.get!.call(this); } });

    armed = true;
    let threw = false;
    try {
      const snap = snapshot(win, { maxDepth: 25 });
      snap.dispose(); // didn't throw (tree too small to hit THROW_AT) — disposing still releases everything
    } catch {
      threw = true;
    }
    armed = false;

    assert(threw, `injected a fault mid-walk (controlType read #${THROW_AT})`);
    assert(materialized > 0, `walk materialized children before the fault (${materialized})`);
    assert(releases >= materialized, `every materialized child was released — no leak (releases ${releases} >= materialized ${materialized})`);
    win.dispose();
  }
} finally {
  const notepadPid = notepad !== 0n ? windowProcessId(notepad) : 0;
  if (notepadPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(notepadPid)]);
  if (releaseDescriptor) Object.defineProperty(proto, 'release', releaseDescriptor);
  if (childrenDescriptor) Object.defineProperty(proto, 'cachedChildren', childrenDescriptor);
  if (controlTypeDescriptor) Object.defineProperty(proto, 'cachedControlType', controlTypeDescriptor);
  if (notepad !== 0n) closeWindow(notepad);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — a fault mid-walk releases every materialized child (no COM leak).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
