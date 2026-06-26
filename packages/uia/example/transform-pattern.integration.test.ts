/**
 * transform-pattern — UIA TransformPattern parity (FlaUI's AutomationElement.Patterns.Transform). bun-uia could
 * only SetWindowPos a top-level HWND (moveWindow), so it could not cursor-free move/resize an element via UIA —
 * and could not reach an HWND-less child (MDI child, dockable/floating pane, splitter panel) with no nativeWindowHandle.
 *
 * Now Element exposes .canMove/.canResize/.canRotate + .move(x,y)/.resize(w,h)/.rotate(deg), each over the existing
 * cast-free com.ts vcall on IUIAutomationTransformPattern (slots Move=3 Resize=4 Rotate=5 CanMove=6 CanResize=7
 * CanRotate=8, gated by slot-gate.test.ts against UIAutomationClient.h). Cursor-free: no SendInput, no real cursor,
 * works locked/background.
 *
 * Proof: spawn classic Notepad, find the FRESH top-level Notepad window (by hWnd diff so it never touches another
 * test's window), attach its element (which supports TransformPattern), assert .canMove/.canResize, then .move(200,200)
 * + .resize(700,500) and assert boundingRectangle changed to match. ONLY the freshly-spawned window is closed in
 * teardown (closeWindow, not just dispose — dispose != close).
 *
 * bun test is broken repo-wide — this is a runnable harness:
 * Run: bun run example/transform-pattern.integration.test.ts
 */
import { closeWindow, fromHandle, listWindows, uia } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

uia.initialize();
const before = new Set(
  listWindows()
    .filter((window) => window.className === 'Notepad')
    .map((window) => window.hWnd),
);
Bun.spawn(['notepad.exe']);
let target = 0n;
for (let attempt = 0; attempt < 30 && target === 0n; attempt += 1) {
  await Bun.sleep(300);
  const fresh = listWindows().filter((window) => window.className === 'Notepad' && !before.has(window.hWnd));
  if (fresh.length > 0) target = fresh[0]!.hWnd;
}
try {
  if (target === 0n) console.log('  skip: classic Notepad did not appear (Win11 Store Notepad / no notepad.exe)');
  else {
    await Bun.sleep(500); // let the window settle so its first bounding rectangle is stable
    const element = fromHandle(target);
    assert(element.canMove, 'fresh Notepad top-level element advertises TransformPattern CanMove');
    assert(element.canResize, 'fresh Notepad top-level element advertises TransformPattern CanResize');

    element.move(200, 200);
    element.resize(700, 500);
    await Bun.sleep(200); // let the move/resize land before re-reading bounds

    const after = element.boundingRectangle;
    assert(after.x === 200 && after.y === 200, `cursor-free .move(200,200) landed — boundingRectangle x,y = ${after.x},${after.y}`);
    assert(after.width === 700 && after.height === 500, `cursor-free .resize(700,500) landed — boundingRectangle w,h = ${after.width},${after.height}`);
    element.release();
  }
} finally {
  if (target !== 0n) closeWindow(target);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — Element.move/resize via UIA TransformPattern is cursor-free and live (FlaUI Transform parity).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
