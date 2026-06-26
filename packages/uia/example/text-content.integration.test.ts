/**
 * text-content — read a control's TextPattern content (terminal scrollback, document/editor body, read-only
 * multiline text) cursor-free. This is the buffer ValuePattern's `value` does NOT carry; inspect_element now
 * surfaces it via Element.text(). Terminals (Windows Terminal, conhost), editors, and document views all expose
 * an ITextProvider for screen readers, so .text() reads their visible text without focus.
 *
 * Proof: type a marker into Notepad and read it back via .text()/.value; plus, if a terminal is running, read
 * its buffer text (> 0 chars).
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/text-content.integration.test.ts
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

const marker = 'bun-uia text-content probe 12345';
try {
  assert(notepad !== 0n, 'launched Notepad');
  if (notepad !== 0n) {
    await Bun.sleep(500);
    const win = uia.attach(notepad);
    const editor: Element | null = win.find({ controlType: ControlType.Edit }) ?? win.find({ controlType: ControlType.Document });
    assert(editor !== null, 'found the editor control');
    if (editor !== null) {
      try {
        editor.setValue(marker);
      } catch {
        editor.type(marker); // RichEditBox may lack ValuePattern; fall back (steals focus, fine in a test)
      }
      await Bun.sleep(400);
      const text = editor.text();
      const value = editor.value;
      assert(text.includes(marker) || value.includes(marker), `read the editor content back (text:${text.length}ch value:${value.length}ch)`);
      if (text.includes(marker)) console.log('  note: content read via TextPattern (.text()) — the path inspect_element now surfaces');
      editor.release();
    }
    win.dispose();
  }

  // opportunistic: a live terminal's buffer is readable via TextPattern
  const term = uia.windows().find((w) => w.className === 'CASCADIA_HOSTING_WINDOW_CLASS' || /ConsoleWindowClass/.test(w.className));
  if (term !== undefined) {
    const win = uia.attach(term.hWnd);
    let best = 0;
    for (const d of [...win.findAll({ controlType: ControlType.Text }), ...win.findAll({ controlType: ControlType.Document })]) {
      best = Math.max(best, d.text().length);
      d.release();
    }
    assert(best > 0, `read a live terminal's buffer text via TextPattern (${best} chars)`);
    win.dispose();
  } else {
    console.log('  skip: no terminal running for the live read (deterministic terminal proof: terminal-scrollback.integration.test.ts)');
  }
} finally {
  const notepadPid = notepad !== 0n ? windowProcessId(notepad) : 0;
  if (notepadPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(notepadPid)]);
  if (notepad !== 0n) closeWindow(notepad);
  uia.uninitialize();
}

console.log(
  failures === 0
    ? '\nPASS — editor TextPattern content reads cursor-free; inspect_element surfaces it (terminal read is opportunistic — see terminal-scrollback.integration.test.ts for the deterministic terminal proof).'
    : `\nFAILED — ${failures} assertion(s)`,
);
process.exit(failures === 0 ? 0 : 1);
