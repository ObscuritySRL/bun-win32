/**
 * snapshot-scope — desktop_snapshot can re-ground on ONE element's subtree (root scoping), so an agent can
 * zoom into a large window instead of re-dumping the whole tree. Before, the size-cap trailer told the agent to
 * "narrow with a selector" that did not exist; now snapshot()/desktop_snapshot accept a root (the MCP resolves a
 * name/automationId to a sub-element and snapshots just that subtree).
 *
 * Proof (the exact path the MCP desktop_snapshot uses): snapshot the whole window, pick a named container from
 * the tree, find() it, snapshot THAT element, and assert the scoped tree is re-grounded on it and is a strict
 * subtree (never more refs than the full window).
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/snapshot-scope.integration.test.ts
 */
import { closeWindow, type RefNode, snapshot, uia, windowProcessId } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}
// the deepest named container with children — a meaningful sub-region to scope onto
function pickContainer(node: RefNode, depth = 0): { name: string; depth: number } | null {
  let best: { name: string; depth: number } | null = node.name.trim().length > 0 && node.children.length > 0 && depth > 0 ? { name: node.name, depth } : null;
  for (const child of node.children) {
    const candidate = pickContainer(child, depth + 1);
    if (candidate !== null && (best === null || candidate.depth > best.depth)) best = candidate;
  }
  return best;
}

uia.initialize();
let notepad = 0n;
const prior = new Set(uia.windows().filter((w) => /Notepad/i.test(w.className)).map((w) => w.hWnd));
Bun.spawn(['notepad.exe'], { stdout: 'ignore', stderr: 'ignore' });
for (let attempt = 0; attempt < 40 && notepad === 0n; attempt += 1) {
  await Bun.sleep(150);
  notepad = uia.windows().find((w) => /Notepad/i.test(w.className) && !prior.has(w.hWnd))?.hWnd ?? uia.windows().find((w) => /Notepad/i.test(w.title) && !prior.has(w.hWnd))?.hWnd ?? 0n;
}

try {
  assert(notepad !== 0n, 'launched Notepad');
  if (notepad !== 0n) {
    await Bun.sleep(500);
    const win = uia.attach(notepad);
    const full = snapshot(win, { maxDepth: 25 });
    const container = pickContainer(full.tree);
    assert(container !== null, `full window has a named container to scope onto (${JSON.stringify(container?.name ?? '')}, ${full.marks.length} total refs)`);
    if (container !== null) {
      const element = win.find({ name: container.name });
      assert(element !== null, `find({ name }) resolved the container element`);
      if (element !== null) {
        const scoped = snapshot(element, { maxDepth: 25 });
        assert(scoped.tree.name === container.name, `scoped snapshot is re-grounded on the container (root "${scoped.tree.name}")`);
        assert(scoped.marks.length <= full.marks.length, `scoped subtree is never larger than the full window (scoped ${scoped.marks.length} ≤ full ${full.marks.length})`);
        scoped.dispose();
        element.release();
      }
    }
    full.dispose();
    win.dispose();
  }
} finally {
  const notepadPid = notepad !== 0n ? windowProcessId(notepad) : 0;
  if (notepadPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(notepadPid)]);
  if (notepad !== 0n) closeWindow(notepad);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — desktop_snapshot root scoping re-grounds on a sub-element subtree.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
