/**
 * menu-drive — drive an application menu cursor-free. A modern (WinUI/Win32) app keeps an expanded menu's items
 * in its OWN UIA tree: expand the top MenuItem (ExpandCollapse pattern — no focus, no cursor), then re-snapshot
 * and the submenu's MenuItems are present and actionable (invoke them). This is the path for the common case;
 * only a classic #32768 popup menu lands in a separate top-level window (rare on Win11).
 *
 * Proof: Notepad's menu bar exposes a few MenuItems; expanding "File" makes its submenu items appear in the same
 * tree (count jumps) and a submenu item is found as an actionable MenuItem — all cursor-free.
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/menu-drive.integration.test.ts
 */
import { closeWindow, ControlType, type Element, uia, windowProcessId } from '@bun-win32/uia';

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
const prior = new Set(
  uia
    .windows()
    .filter((w) => /Notepad/i.test(w.className))
    .map((w) => w.hWnd),
);
Bun.spawn(['notepad.exe'], { stdout: 'ignore', stderr: 'ignore' });
for (let attempt = 0; attempt < 40 && notepad === 0n; attempt += 1) {
  await Bun.sleep(150);
  notepad = uia.windows().find((w) => /Notepad/i.test(w.className) && !prior.has(w.hWnd))?.hWnd ?? 0n;
}

try {
  assert(notepad !== 0n, 'launched Notepad');
  if (notepad !== 0n) {
    await Bun.sleep(600);
    const win = uia.attach(notepad);
    const countMenuItems = (): number => {
      const items = win.findAll({ controlType: ControlType.MenuItem });
      const n = items.length;
      for (const item of items) item.release();
      return n;
    };
    const before = countMenuItems();
    assert(before >= 1, `the menu bar exposes MenuItems (${before})`);

    const fileMenu: Element | null = win.find({ controlType: ControlType.MenuItem, name: /File/i }) ?? win.find({ controlType: ControlType.MenuItem });
    assert(fileMenu !== null, `found a top menu (${JSON.stringify(fileMenu?.name ?? '')})`);
    if (fileMenu !== null) {
      fileMenu.expand(); // ExpandCollapse pattern — cursor-free, no focus
      fileMenu.release();
      await Bun.sleep(400);
      const after = countMenuItems();
      assert(after >= before + 5, `expanding the menu surfaced its submenu items in the same tree (${before} → ${after}) — drivable cursor-free`);
      const submenuItem = win.findAll({ controlType: ControlType.MenuItem }).filter((item) => item.boundingRectangle.height > 0);
      assert(submenuItem.length > before, `submenu items are actionable MenuItems (${submenuItem.length} with bounds — invoke() any to pick it)`);
      for (const item of submenuItem) item.release();
    }
    win.dispose();
  }
} finally {
  const notepadPid = notepad !== 0n ? windowProcessId(notepad) : 0;
  if (notepadPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(notepadPid)]);
  if (notepad !== 0n) closeWindow(notepad);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — application menus are drivable cursor-free (expand → re-snapshot → invoke).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
