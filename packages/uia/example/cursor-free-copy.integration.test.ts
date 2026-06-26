/**
 * cursor-free-copy — copy selected text to the clipboard WITHOUT focus or keystrokes. The MCP copy tool fell
 * back to Ctrl+C (global focus + SendInput, dropped on a locked session); with a ref it now reads the ref's
 * selection via UIA TextPattern (getSelectedText) and writes the clipboard directly — no focus, works on a
 * background/locked window, and composes with find_text (which selects a substring cursor-free).
 *
 * Proof: type text into Notepad, select a substring cursor-free (selectText), copy it via getSelectedText →
 * writeClipboard → readClipboard, and confirm the real cursor never moved.
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/cursor-free-copy.integration.test.ts
 */
import { closeWindow, ControlType, type Element, uia, windowProcessId } from '@bun-win32/uia';
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

const cursorBefore = cursorPos();
try {
  assert(notepad !== 0n, 'launched Notepad');
  if (notepad !== 0n) {
    await Bun.sleep(500);
    const win = uia.attach(notepad);
    const editor: Element | null = win.find({ controlType: ControlType.Edit }) ?? win.find({ controlType: ControlType.Document });
    assert(editor !== null, 'found the editor');
    if (editor !== null) {
      try {
        editor.setValue('alpha beta gamma delta');
      } catch {
        editor.type('alpha beta gamma delta');
      }
      await Bun.sleep(300);
      const matched = editor.selectText('gamma'); // cursor-free TextPattern FindText + Select
      assert(matched === 'gamma', `selected a substring cursor-free (matched ${JSON.stringify(matched)})`);
      const selection = editor.getSelectedText();
      assert(selection === 'gamma', `read the selection via TextPattern (${JSON.stringify(selection)})`);
      if (selection.length > 0) {
        uia.writeClipboard(selection);
        assert(uia.readClipboard() === 'gamma', 'the selection is on the clipboard — copied cursor-free');
      }
      editor.release();
    }
    const cursorAfter = cursorPos();
    assert(cursorAfter.x === cursorBefore.x && cursorAfter.y === cursorBefore.y, `the real cursor NEVER moved (stayed at ${cursorBefore.x},${cursorBefore.y})`);
    win.dispose();
  }
} finally {
  const notepadPid = notepad !== 0n ? windowProcessId(notepad) : 0;
  if (notepadPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(notepadPid)]);
  if (notepad !== 0n) closeWindow(notepad);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — copied a selection to the clipboard cursor-free (select → TextPattern → clipboard).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
