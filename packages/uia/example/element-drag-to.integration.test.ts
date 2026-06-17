/**
 * element-drag-to — Element.dragTo(target) is the element→element drag (Playwright locator.dragTo(target) /
 * FlaUI element.DragAndDrop(target)): it resolves THIS element's clickable point (bounding-rectangle center fallback,
 * same as click()) and the TARGET's, then runs the real-mouse drag. Before this the destination was pixels-only — to
 * drag A onto B an agent had to resolve B's coordinates by hand, defeating the ref abstraction.
 *
 * Proof: spawn Notepad, grab two distinct child Elements with real on-screen bounds (two toolbar formatting buttons),
 * compute B's expected center independently, call A.dragTo(B), and assert the REAL cursor ended at B's center —
 * proving dragTo computed the destination from the target Element, not from caller-supplied pixels. Notepad is
 * force-killed by its window PID in teardown (findings/31 window discipline) so no save dialog is left behind.
 *
 * bun test is broken repo-wide — runnable harness (spawned Notepad):
 * Run: bun run example/element-drag-to.integration.test.ts
 */
import { type Element, closeWindow, uia, windowProcessId } from '@bun-win32/uia';
import User32 from '@bun-win32/user32';

const cursor = (): { x: number; y: number } => {
  const point = Buffer.alloc(8);
  User32.GetCursorPos(point.ptr!);
  return { x: point.readInt32LE(0), y: point.readInt32LE(4) };
};

const center = (element: Element): { x: number; y: number } => {
  const clickable = element.clickablePoint;
  if (clickable !== null) return clickable;
  const rect = element.boundingRectangle;
  return { x: rect.x + Math.floor(rect.width / 2), y: rect.y + Math.floor(rect.height / 2) };
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
    User32.SetForegroundWindow(notepad.hWnd);
    await Bun.sleep(120);
    // Two distinct toolbar formatting buttons (Bold, Italic) — stable non-zero bounds, and a press-release between
    // them activates nothing destructive (unlike the title-bar Close), so the drop is a no-op beyond the cursor move.
    const bold = notepad.find({ name: 'Bold (Ctrl+B)' }, 4 /* TreeScope_Descendants */);
    const italic = notepad.find({ name: 'Italic (Ctrl+I)' }, 4 /* TreeScope_Descendants */);
    if (bold === null || italic === null) {
      console.log(`  skip(live): toolbar buttons not found (bold=${bold !== null}, italic=${italic !== null})`);
    } else {
      const target = center(italic);
      User32.SetCursorPos(7, 7);
      await Bun.sleep(80);
      const before = cursor();
      assert(typeof bold.dragTo === 'function', 'Element.dragTo(target) exists (element→element drag, was undefined)');
      bold.dragTo(italic);
      await Bun.sleep(80);
      const after = cursor();
      console.log(`  before ${before.x},${before.y} -> after ${after.x},${after.y} | italic-center ${target.x},${target.y}`);
      assert(Math.abs(after.x - target.x) <= 3 && Math.abs(after.y - target.y) <= 3, `dragTo computed the destination from the TARGET element — real cursor landed at the italic button's center (${target.x},${target.y})`);
      bold.release();
      italic.release();
    }
  }
} finally {
  if (notepad !== null) {
    const notepadPid = windowProcessId(notepad.hWnd);
    if (notepadPid) Bun.spawnSync(['taskkill', '/F', '/PID', String(notepadPid)]);
    closeWindow(notepad.hWnd);
    notepad.dispose();
  }
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — Element.dragTo(target) resolves the target element center and drives the real mouse there.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
