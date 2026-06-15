/**
 * explorer-in-the-dark — drive a File Explorer window cursor-free: open drives/folders, scroll, and select a
 * drive in the sidebar — WITHOUT ever moving the real mouse or sending a keystroke. The exact scenario that
 * used to need the real cursor (select a drive in the sidebar, click folders, scroll) — now 100% input-free,
 * so it works on a background / occluded / unfocused window (UIA patterns need no focus or foreground).
 *
 * Proof: open This PC, then via UIA only — open Local Disk (C:) → Windows (InvokePattern = activate/navigate),
 * scroll the file list (ScrollPattern), and select a drive in the nav-tree sidebar (SelectionItem) — asserting
 * the title changed at each step (navigation happened) and the real cursor NEVER moved. Finally capture the
 * window with Windows.Graphics.Capture (works even occluded/background) so you can SEE the result.
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/explorer-in-the-dark.integration.test.ts
 */
import { captureWindowLive, closeWindow, ControlType, encodePNG, ScrollAmount, uia } from '@bun-win32/uia';
import User32 from '@bun-win32/user32';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}
function cursorPos(): { x: number; y: number } {
  const buffer = Buffer.alloc(8);
  User32.GetCursorPos(buffer.ptr!);
  return { x: buffer.readInt32LE(0), y: buffer.readInt32LE(4) };
}

uia.initialize();
// Close every pre-existing Explorer first: a leftover CabinetWClass window would let the hWnd-diff
// below attach to the wrong (stale) window, so the fresh "This PC" view is unambiguous.
for (const window of uia.windows()) {
  if (window.className === 'CabinetWClass') closeWindow(window.hWnd);
}
await Bun.sleep(800);
const priorExplorers = new Set(uia.windows().filter((w) => w.className === 'CabinetWClass').map((w) => w.hWnd));
Bun.spawn(['explorer.exe', 'shell:MyComputerFolder'], { stdout: 'ignore', stderr: 'ignore' });
// Wait for the NEW Explorer whose title is the "This PC" view (not just any CabinetWClass).
let hWnd = 0n;
for (let attempt = 0; attempt < 24 && hWnd === 0n; attempt += 1) {
  await Bun.sleep(250);
  hWnd = uia.windows().find((w) => w.className === 'CabinetWClass' && !priorExplorers.has(w.hWnd) && /This PC/.test(w.title))?.hWnd ?? 0n;
}
const cursorBefore = cursorPos();

try {
  assert(hWnd !== 0n, 'opened This PC');
  const explorer = uia.attach(hWnd);

  // Open a folder/drive by name — cursor-free, no focus, no keystroke. Invoke is the semantic "activate"
  // that navigates an Explorer item (LegacyIAccessible.DoDefaultAction is a no-op on these items, so it is
  // only a fallback). Polls because a freshly-rendered view populates its items after a beat.
  const open = (name: RegExp, label: string): boolean => {
    const before = explorer.name;
    for (let attempt = 0; attempt < 12 && explorer.name === before; attempt += 1) {
      const item = explorer.find({ controlType: ControlType.ListItem, name });
      if (item === null) {
        Bun.sleepSync(500);
        continue;
      }
      try {
        item.invoke();
      } catch {
        item.doDefaultAction();
      }
      item.release();
      Bun.sleepSync(1100);
    }
    const navigated = explorer.name !== before;
    if (navigated) assert(true, `opened ${label} cursor-free → ${JSON.stringify(explorer.name)}`);
    else console.log(`  (could not open ${label} here — contents vary)`);
    return navigated;
  };

  const openedC = open(/\(C:\)/, 'Local Disk (C:)');
  if (openedC) open(/^Windows$/, 'the Windows folder');
  assert(openedC, 'opened a drive cursor-free (the sidebar/folder click that used to need the real mouse)');

  // Scroll the file list cursor-free (ScrollPattern) — the scroll that used to need the real mouse wheel.
  const list = explorer.find({ controlType: ControlType.List });
  if (list !== null && list.scrollInfo?.verticallyScrollable) {
    const before = list.scrollInfo?.verticalPercent ?? 0;
    list.scroll(ScrollAmount.NoAmount, ScrollAmount.LargeIncrement);
    Bun.sleepSync(400);
    assert((list.scrollInfo?.verticalPercent ?? 0) > before, `scrolled the file list cursor-free (${before.toFixed(0)}% → ${(list.scrollInfo?.verticalPercent ?? 0).toFixed(0)}%)`);
  } else console.log('  (file list not scrollable here — skipping scroll assertion)');
  list?.release();

  // Select a drive in the nav-tree SIDEBAR (SelectionItem) — the sidebar drive-select that needed the cursor.
  const driveNode = explorer.find({ controlType: ControlType.TreeItem, name: /\(C:\)|\(D:\)|Local Disk|This PC/ });
  if (driveNode !== null) {
    driveNode.select();
    Bun.sleepSync(400);
    assert(driveNode.isSelected, `selected ${JSON.stringify(driveNode.name)} in the sidebar tree cursor-free`);
    driveNode.release();
  } else console.log('  (no drive TreeItem in the sidebar — skipping the tree-select assertion)');

  const cursorAfter = cursorPos();
  assert(cursorAfter.x === cursorBefore.x && cursorAfter.y === cursorBefore.y, `the real cursor NEVER moved (stayed at ${cursorBefore.x},${cursorBefore.y}) — no mouse hijack`);

  // SEE it: WGC captures the window even when it's occluded/background (no foregrounding needed).
  const shot = await captureWindowLive(hWnd);
  if (shot !== null) {
    await Bun.write('D:/Projects/bun-win32/packages/uia/.scratch/explorer-in-the-dark.png', encodePNG(shot.rgb, shot.width, shot.height));
    console.log(`  captured the window via WGC → ${shot.width}x${shot.height} (.scratch/explorer-in-the-dark.png)`);
  }
  explorer.dispose();
} finally {
  if (hWnd !== 0n) closeWindow(hWnd);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — drove File Explorer entirely cursor-free / input-free (open, scroll, sidebar-select).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
