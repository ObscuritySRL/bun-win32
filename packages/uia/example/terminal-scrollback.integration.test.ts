/**
 * terminal-scrollback — the bounded read for a huge terminal: visibleText() (GetVisibleRanges) returns only the
 * ON-SCREEN region of a console's TextPattern document, far smaller than text() (GetText(-1)) over the whole
 * scrollback buffer. A terminal accumulates thousands of lines off-screen; text() pulls them all, visibleText()
 * pulls only what is rendered — bounded + relevant + cheap, the path inspect_element prefers. Cursor-free, no
 * foreground: the console buffer reads through its UIA ITextProvider without focus.
 *
 * Deterministic proof: spawn a console (the host the machine is configured for — Windows Terminal or conhost),
 * fill it with hundreds of scrollback lines, then read its document — text() is large (the whole scrollback),
 * visibleText() is a non-empty subset far smaller than it, and the visible text is genuine content from the
 * buffer. Force-kills the console's owning PID in finally (findings/31 — taskkill /F, not closeWindow).
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/terminal-scrollback.integration.test.ts
 */
import { ControlType, type Element, uia, windowProcessId } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

const isConsole = (className: string): boolean => /CASCADIA_HOSTING_WINDOW_CLASS|ConsoleWindowClass/.test(className);

uia.initialize();
const lineCount = 600;
const prior = new Set(
  uia
    .windows()
    .filter((w) => isConsole(w.className))
    .map((w) => w.hWnd),
);
// `start` opens the console in its own top-level window (the host the machine is configured for); the for-loop
// emits hundreds of scrollback lines so the off-screen buffer dwarfs the visible region.
const fill = `for /L %i in (1,1,${lineCount}) do @echo scrollback line %i of the bun-uia terminal-scrollback probe`;
Bun.spawnSync(['cmd.exe', '/c', 'start', 'cmd.exe', '/k', fill]);

let terminal = 0n;
for (let attempt = 0; attempt < 60 && terminal === 0n; attempt += 1) {
  await Bun.sleep(150);
  terminal = uia.windows().find((w) => isConsole(w.className) && !prior.has(w.hWnd))?.hWnd ?? 0n;
}

try {
  assert(terminal !== 0n, 'launched a console window');
  if (terminal !== 0n) {
    await Bun.sleep(2500); // let the fill loop finish writing the scrollback
    const win = uia.attach(terminal);
    // The console body is a Text/Document control exposing an ITextProvider; pick the one with the most text.
    let body: Element | null = null;
    let bodyFull = 0;
    for (const candidate of [...win.findAll({ controlType: ControlType.Text }), ...win.findAll({ controlType: ControlType.Document })]) {
      const length = candidate.text().length;
      if (length > bodyFull) {
        body?.release();
        body = candidate;
        bodyFull = length;
      } else candidate.release();
    }
    assert(body !== null && bodyFull > 0, `found the console buffer document (${bodyFull} chars)`);
    if (body !== null) {
      const full = body.text();
      const visible = body.visibleText();
      console.log(`  full scrollback=${full.length} chars, visibleText=${visible.length} chars`);
      assert(full.length > 5000, `the full scrollback is large (${full.length} chars — the whole buffer)`);
      assert(visible.length > 0, `visibleText() returned the on-screen region (${visible.length} chars)`);
      assert(visible.length < full.length, `visibleText is bounded to what's rendered — smaller than the whole scrollback (${visible.length} < ${full.length})`);
      assert(full.includes(visible.trim().split('\n')[0]?.trim() ?? '__none__'), 'the visible text is genuine content from the scrollback');
      body.release();
    }
    win.dispose();
  }
} finally {
  const terminalPid = terminal !== 0n ? windowProcessId(terminal) : 0;
  if (terminalPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(terminalPid)]);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — visibleText() reads only the on-screen region of a huge terminal scrollback (GetVisibleRanges), not the whole buffer.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
