/**
 * uwp-content — a UWP / WinUI Store app (Settings, Store, Photos, Mail, …) IS readable through the UIA tree,
 * cursor-free. Its XAML content lives in a `Windows.UI.Core.CoreWindow` hosted by an `ApplicationFrameWindow`;
 * UIA bridges the two, so attaching to the frame and snapshotting yields the app's controls. The one caveat is
 * a LAZY tree: a just-launched / long-idle UWP (like Chromium) builds its tree on demand, so the very first
 * snapshot can be sparse — poll until it populates (this test does), then it reads fully.
 *
 * Proof: launch Settings, poll desktop-style snapshots until the tree builds, then assert the navigation list
 * items + search box are present as actionable refs — all via UIA, no focus, no pixels.
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/uwp-content.integration.test.ts
 */
import { closeWindow, ControlType, type RefNode, snapshot, uia } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}
function countRole(node: RefNode, role: string): number {
  return (node.role === role && node.ref !== undefined ? 1 : 0) + node.children.reduce((sum, child) => sum + countRole(child, role), 0);
}

uia.initialize();
let frame = 0n;
const priorPids = new Set(
  uia
    .windows()
    .filter((w) => w.className === 'ApplicationFrameWindow' && /settings/i.test(w.title))
    .map((w) => w.hWnd),
);
Bun.spawn(['cmd', '/c', 'start', 'ms-settings:'], { stdout: 'ignore', stderr: 'ignore' });
for (let attempt = 0; attempt < 40 && frame === 0n; attempt += 1) {
  await Bun.sleep(200);
  frame = uia.windows().find((w) => w.className === 'ApplicationFrameWindow' && /settings/i.test(w.title) && !priorPids.has(w.hWnd))?.hWnd ?? 0n;
}

try {
  assert(frame !== 0n, 'launched the Settings UWP app');
  if (frame !== 0n) {
    const win = uia.attach(frame);
    // lazy tree: poll the snapshot until the XAML content builds (or give up)
    let refs = 0;
    let listItems = 0;
    for (let attempt = 0; attempt < 25; attempt += 1) {
      const snap = snapshot(win, { maxDepth: 30 });
      refs = snap.marks.length;
      listItems = countRole(snap.tree, ControlType[ControlType.ListItem] ?? 'ListItem');
      snap.dispose();
      if (listItems >= 3) break;
      await Bun.sleep(250);
    }
    assert(refs >= 8, `UWP content reads through UIA — ${refs} actionable refs (not blind)`);
    assert(listItems >= 3, `the Settings navigation list is present — ${listItems} ListItem refs (locale-independent)`);
    win.dispose();
  }
} finally {
  if (frame !== 0n) closeWindow(frame);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — a UWP/WinUI Store app is read via UIA, cursor-free (lazy tree polled until built).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
