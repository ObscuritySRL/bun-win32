/**
 * triple-click-cursorfree — the computer-use `triple_click` action ignored the cursorless option and always moved
 * the REAL mouse (three SendInput clicks), breaking the drive-in-the-dark doctrine every other click verb honors.
 * dispatch() now posts a cursor-free triple-click (down/up · DBLCLK/up · down/up to the window under the point)
 * when cursorless is set, leaving the real cursor where it was.
 *
 * Proof: park the real cursor in a corner, dispatch a cursorless triple_click over a Notepad editor, and assert the
 * result is "(cursor-free)" AND the real cursor never moved. Notepad is closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness (spawned Notepad):
 * Run: bun run example/triple-click-cursorfree.integration.test.ts
 */
import { closeWindow, uia } from '@bun-win32/uia';
import User32 from '@bun-win32/user32';

const cursor = (): { x: number; y: number } => {
  const point = Buffer.alloc(8);
  User32.GetCursorPos(point.ptr!);
  return { x: point.readInt32LE(0), y: point.readInt32LE(4) };
};

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

uia.initialize();
const notepad = await uia.launch(['notepad.exe'], { title: 'Untitled - Notepad' }, 6000).catch(() => uia.launch(['notepad.exe'], { className: 'Notepad' }, 6000).catch(() => null));
try {
  if (notepad === null) {
    console.log('  skip(live): Notepad did not launch');
  } else {
    await Bun.sleep(700);
    const bounds = notepad.boundingRectangle;
    const x = Math.round(bounds.x + bounds.width / 2);
    const y = Math.round(bounds.y + bounds.height / 2);
    User32.SetCursorPos(7, 7);
    await Bun.sleep(80);
    const before = cursor();
    const result = await uia.dispatch(notepad, { action: 'triple_click', coordinate: [x, y] }, { cursorless: true });
    await Bun.sleep(80);
    const after = cursor();
    console.log(`  dispatch -> ${JSON.stringify(result.output ?? result.error)}`);
    assert(result.ok && /cursor-free/.test(result.output ?? ''), `triple_click reports cursor-free (got: ${JSON.stringify(result.output ?? result.error)})`);
    assert(Math.abs(after.x - before.x) <= 2 && Math.abs(after.y - before.y) <= 2, `the real cursor never moved (before ${before.x},${before.y} → after ${after.x},${after.y})`);
  }
} finally {
  if (notepad !== null) {
    closeWindow(notepad.hWnd);
    notepad.dispose();
  }
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — triple_click honors cursorless (posted cursor-free, real mouse unmoved).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
