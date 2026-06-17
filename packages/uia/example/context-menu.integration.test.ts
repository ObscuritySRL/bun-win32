/**
 * context-menu — cursor-free context menu via IUIAutomationElement3::ShowContextMenu (vtable slot 91, verified
 * against UIAutomationClient.h by slot-gate.test.ts). A DISTINCT mechanism from the posted-WM_CONTEXTMENU dead-end:
 * the UIA provider raises its own menu, no real right-click.
 *
 * Deterministic proof: showContextMenu() returns a boolean and does NOT segfault on a real control (the binding /
 * slot is correct). Whether a menu actually appears is provider-dependent, so the popup is checked opportunistically;
 * any popup is dismissed (Esc) and the app closed.
 *
 * bun test is broken repo-wide — runnable harness (spawns + closes Notepad):
 * Run: bun run example/context-menu.integration.test.ts
 */
import User32 from '@bun-win32/user32';
import { closeWindow, ControlType, uia, windowProcessId } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

uia.initialize();
const window = await uia.launch(['notepad.exe'], { className: 'Notepad' });
try {
  await Bun.sleep(500);
  const target = window.find({ controlType: ControlType.Document }) ?? window.find({ controlType: ControlType.Edit }) ?? window;
  const before = new Set(uia.windows({ includeUntitled: true }).map((w) => w.hWnd));

  const opened = target.showContextMenu();
  assert(typeof opened === 'boolean', 'showContextMenu() returns a boolean without segfaulting (slot 91 binding is correct)');

  await Bun.sleep(400);
  const popup = uia.windows({ includeUntitled: true }).find((w) => !before.has(w.hWnd) && (w.className === '#32768' || /Popup|Menu|Flyout|DropDown/i.test(w.className)));
  if (popup === undefined) console.log('  note: this provider raised no UIA context menu (provider-dependent) — the call still succeeded safely');
  else {
    assert(popup.title.length === 0 || /menu/i.test(popup.className), `the context menu opened as an untitled popup [class=${popup.className}] — attachable`);
    User32.PostMessageW(popup.hWnd, 0x0100, 0x1bn, 0n); // dismiss: Esc down
    User32.PostMessageW(popup.hWnd, 0x0101, 0x1bn, 0xc000_0001n);
  }
  if (target !== window) target.release();
} finally {
  const notepadPid = windowProcessId(window.hWnd);
  if (notepadPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(notepadPid)]);
  uia.windows({ includeUntitled: true }).filter((w) => w.className === '#32768').forEach((w) => User32.PostMessageW(w.hWnd, 0x0010, 0n, 0n)); // WM_CLOSE any stray menu
  window.dispose();
  await Bun.sleep(100);
  closeWindow(window.hWnd);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — ShowContextMenu drives cursor-free without segfault (slot 91); menu appearance is provider-dependent.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
