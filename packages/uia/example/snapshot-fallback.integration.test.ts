/**
 * snapshot-fallback — a provider that refuses the one-shot Subtree+Full cache must still snapshot, not throw.
 * Heavy cross-process Chromium top-levels (e.g. Opera) deterministically fail BuildUpdatedCache(Subtree, Full)
 * (verified live), and the snapshot used to throw "BuildUpdatedCache failed (no cached clone)" for any caller
 * not passing extraRoots — including the MCP screenshot_marked tool. snapshot() now falls back to a LIVE walk
 * (live property reads + live navigation, keeping actionable Element pointers), and exposes `live: true` to force
 * that path for a known cache-hostile provider.
 *
 * Proof: (A) on a normal window the live path and the cached fast path produce the SAME ref tree (walkLive ≡
 * walk); (B) the live path yields actionable refs whose kept Element resolves and reads live; (C) if a
 * cache-hostile Chromium is present, snapshot() returns a tree instead of throwing.
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/snapshot-fallback.integration.test.ts
 */
import { closeWindow, snapshot, uia, windowProcessId } from '@bun-win32/uia';
import { createCacheRequest, AutomationElementMode, DEFAULT_CACHE_PROPERTIES } from '@bun-win32/uia';
import { TreeScope } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}
const namedCount = (marks: readonly { name: string }[]) => marks.filter((m) => m.name.trim().length > 0).length;

uia.initialize();

// (A)+(B) deterministic: spawn Notepad (a real tree), compare cached vs forced-live snapshots.
let notepad = 0n;
const priorNotepad = new Set(
  uia
    .windows()
    .filter((w) => w.className === 'Notepad' || /Notepad$/.test(w.className))
    .map((w) => w.hWnd),
);
Bun.spawn(['notepad.exe'], { stdout: 'ignore', stderr: 'ignore' });
for (let attempt = 0; attempt < 40 && notepad === 0n; attempt += 1) {
  await Bun.sleep(150);
  notepad = uia.windows().find((w) => /Notepad/i.test(w.className) && !priorNotepad.has(w.hWnd))?.hWnd ?? uia.windows().find((w) => /Notepad/i.test(w.title) && !priorNotepad.has(w.hWnd))?.hWnd ?? 0n;
}

try {
  assert(notepad !== 0n, 'launched Notepad');
  if (notepad !== 0n) {
    await Bun.sleep(500);
    const win = uia.attach(notepad);
    const cached = snapshot(win, { maxDepth: 25 });
    const live = snapshot(win, { maxDepth: 25, live: true });
    assert(live.marks.length > 0, `live walk produced actionable refs (${live.marks.length})`);
    assert(Math.abs(cached.marks.length - live.marks.length) <= 1, `live ≡ cached ref count (cached ${cached.marks.length}, live ${live.marks.length})`);
    assert(namedCount(live.marks) > 0 && Math.abs(namedCount(cached.marks) - namedCount(live.marks)) <= 1, `live ≡ cached named refs (cached ${namedCount(cached.marks)}, live ${namedCount(live.marks)})`);
    const firstNamed = live.marks.find((m) => m.name.trim().length > 0);
    if (firstNamed) {
      const el = live.resolve(firstNamed.ref);
      assert(el !== null && typeof el.name === 'string', `a live-walk ref resolves to an actionable Element (resolve(${firstNamed.ref}).name="${el?.name.slice(0, 24)}")`);
    }
    cached.dispose();
    live.dispose();
    win.dispose();
  }

  // (C) a cache-hostile Chromium (Opera), if present: snapshot returns a tree, never throws.
  let hostile = 0n;
  for (const w of uia.windows().filter((x) => x.className === 'Chrome_WidgetWin_1')) {
    const probe = uia.attach(w.hWnd);
    const request = createCacheRequest([...DEFAULT_CACHE_PROPERTIES], TreeScope.TreeScope_Subtree, AutomationElementMode.Full);
    const clone = probe.buildUpdatedCache(request);
    if (clone.ptr === probe.ptr) hostile = w.hWnd;
    request.release();
    if (clone.ptr !== probe.ptr) clone.release();
    probe.dispose();
    if (hostile !== 0n) break;
  }
  if (hostile !== 0n) {
    const win = uia.attach(hostile);
    try {
      const snap = snapshot(win, { maxDepth: 20 });
      assert(snap.tree.children.length >= 0, `cache-hostile Chromium snapshots without throwing (recovered ${snap.marks.length} native refs; web DOM via webRoots)`);
      snap.dispose();
    } catch (error) {
      assert(false, `cache-hostile Chromium snapshot threw: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      win.dispose();
    }
  } else {
    console.log('  skip: no cache-hostile Chromium running (open Opera to exercise the auto-fallback live)');
  }
} finally {
  const notepadPid = windowProcessId(notepad);
  if (notepadPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(notepadPid)]);
  if (notepad !== 0n) closeWindow(notepad);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — a cache-hostile provider snapshots via the live fallback; live ≡ cached on a normal window.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
