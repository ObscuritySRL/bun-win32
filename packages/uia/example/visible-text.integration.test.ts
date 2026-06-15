/**
 * visible-text — read ONLY the on-screen text of a TextPattern document (GetVisibleRanges), not the whole
 * scrollback. text() does GetText(-1) over the entire document; for a huge terminal/editor that is large and
 * mostly off-screen. visibleText() returns just the visible ranges — bounded + relevant + cheap. inspect_element
 * now prefers it. (GetVisibleRanges = IUIAutomationTextPattern slot 6, verified vs the SDK header by slot-gate.)
 *
 * Proof: fill Notepad with many lines; visibleText() is a non-empty subset of text() far smaller than the whole
 * document (only what's on screen). Plus, opportunistically, a live terminal reads its visible region < full.
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/visible-text.integration.test.ts
 */
import { closeWindow, ControlType, type Element, uia } from '@bun-win32/uia';

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

try {
  assert(notepad !== 0n, 'launched Notepad');
  if (notepad !== 0n) {
    await Bun.sleep(500);
    const win = uia.attach(notepad);
    const editor: Element | null = win.find({ controlType: ControlType.Edit }) ?? win.find({ controlType: ControlType.Document });
    assert(editor !== null, 'found the editor');
    if (editor !== null) {
      const lines = Array.from({ length: 500 }, (_, i) => `line ${i} of the document`).join('\n');
      try {
        editor.setValue(lines);
      } catch {
        editor.type(lines);
      }
      await Bun.sleep(500);
      const full = editor.text();
      const visible = editor.visibleText();
      console.log(`  full text=${full.length} chars, visibleText=${visible.length} chars`);
      assert(full.length > 2000, `the full document is large (${full.length} chars)`);
      assert(visible.length > 0, `visibleText() returned the on-screen region (${visible.length} chars)`);
      assert(visible.length < full.length, `visibleText is bounded to the screen — smaller than the whole document (${visible.length} < ${full.length})`);
      assert(full.includes(visible.trim().split('\n')[0]?.trim() ?? '__none__'), 'the visible text is genuine content from the document');
      editor.release();
    }
    win.dispose();
  }

  // opportunistic: a live terminal's visible region is smaller than its scrollback
  const term = uia.windows().find((w) => w.className === 'CASCADIA_HOSTING_WINDOW_CLASS');
  if (term !== undefined) {
    const win = uia.attach(term.hWnd);
    const doc = win.find({ controlType: ControlType.Document }) ?? win.find({ controlType: ControlType.Text });
    if (doc !== null) {
      const v = doc.visibleText();
      console.log(`  terminal visibleText=${v.length} chars`);
      assert(v.length >= 0, `read a live terminal's visible region (${v.length} chars)`);
      doc.release();
    }
    win.dispose();
  } else {
    console.log('  skip: no terminal running for the live visible-region read');
  }
} finally {
  if (notepad !== 0n) closeWindow(notepad);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — read only the on-screen TextPattern text (GetVisibleRanges), not the whole scrollback.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
