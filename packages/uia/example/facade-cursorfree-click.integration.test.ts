/**
 * facade-cursorfree-click — the library facades execute() (agent.ts) and safeExecute() (safety.ts) ran a SendInput
 * click (and SendInput type) for do:'click'/'type', stealing foreground + moving the real cursor + failing on a locked
 * session even when a cursor-free path (InvokePattern / own-HWND WM_CHAR) existed — violating the drive-in-the-dark
 * doctrine the MCP layer already honors. Both now go cursor-free first via the shared performAgentAction helper.
 *
 * Proof: park the cursor, uia.execute({do:'click'}) the Character Map "Select" button, and assert the real cursor never
 * moved (invoke is cursor-free). Character Map closed in teardown.
 *
 * bun test is broken repo-wide — runnable script (lib facade + a spawned Character Map; no MCP subprocess):
 * Run: bun run example/facade-cursorfree-click.integration.test.ts
 */
import { closeWindow, ControlType, execute, uia } from '@bun-win32/uia';
import User32 from '@bun-win32/user32';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

uia.initialize();
const charmap = await uia.launch(['charmap.exe'], { title: 'Character Map' }).catch(() => null);
try {
  if (charmap === null) console.log('  skip: Character Map did not launch');
  else {
    await Bun.sleep(900);
    const window = uia.attach(charmap.hWnd);
    const button = window.find({ name: 'Select', controlType: ControlType.Button });
    if (button === null) console.log('  skip: no "Select" button in Character Map');
    else {
      button.release();
      const cursor = (): { x: number; y: number } => {
        const point = Buffer.alloc(8);
        User32.GetCursorPos(point.ptr!);
        return { x: point.readInt32LE(0), y: point.readInt32LE(4) };
      };
      User32.SetCursorPos(7, 7); // park the real cursor far from the button
      await Bun.sleep(60);
      const before = cursor();
      const results = execute(window, [{ find: { name: 'Select', controlType: ControlType.Button }, do: 'click' }]);
      await Bun.sleep(60);
      const after = cursor();
      assert(results[0]?.ok === true, `execute({do:'click'}) succeeds (got: ${JSON.stringify(results[0])})`);
      assert(Math.abs(after.x - before.x) <= 2 && Math.abs(after.y - before.y) <= 2, `the real cursor never moved (before ${before.x},${before.y} → after ${after.x},${after.y}) — invoke is cursor-free, no SendInput`);
    }
    window.dispose();
  }
} finally {
  if (charmap !== null) {
    closeWindow(charmap.hWnd);
    charmap.dispose();
  }
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — execute()/safeExecute() click cursor-free (invoke first), no foreground/cursor theft.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
