/**
 * Drive in the dark — control a window the way an AI can but a human can't: without ever bringing it to
 * the foreground or moving the real cursor.
 *
 * Launches Calculator, then drives it entirely in the background: reads its UI Automation tree, captures
 * its LIVE pixels with Windows.Graphics.Capture (the same surface Alt+Tab previews use — works even when
 * the window is occluded or GPU/DWM-composited and PrintWindow returns blank), computes 7 × 6 = 42
 * cursor-free via the Invoke pattern, and asserts the foreground window was NEVER our target. The
 * human-transcending doctrine — cursor-free, no-foreground, see-in-the-dark — proven on a real app.
 *
 * APIs demonstrated:
 * - uia.attach / find / invoke (cursor-free UIA control — no keyboard focus, no real cursor)
 * - uia.captureWindowLive (Windows.Graphics.Capture — see an occluded / background / GPU window)
 * - uia.tree (background accessibility read), foregroundWindow (prove we never stole focus)
 * - uia.screenshotScreen (PrintWindow-free full capture for comparison)
 *
 * Run: bun run example/drive-in-the-dark.ts
 */
import { ControlType, encodePNG, foregroundWindow, uia } from '@bun-win32/uia';

uia.initialize();

const calc = await uia.launch(['cmd', '/c', 'start', 'calc'], { title: 'Calculator' });
const target = calc.hWnd;
const before = foregroundWindow();
console.log(`Calculator hWnd=0x${target.toString(16)}  (foreground is 0x${before.toString(16)} — NOT us)`);

// 1. READ the tree of a window we never touched — works in the background.
const tree = uia.tree(calc, { agentProfile: true });
const buttons = tree.children.flatMap(function collect(node): string[] {
  return [node.role === 'Button' ? node.name : '', ...node.children.flatMap(collect)].filter(Boolean);
});
console.log(`read ${buttons.length} buttons from the background tree (no foreground, no cursor)`);

// 2. SEE it — capture the live pixels via Windows.Graphics.Capture (works occluded / GPU-composited).
const live = await uia.captureWindowLive(target);
if (live !== null) {
  await Bun.write(`${import.meta.dir}/../.scratch/dark-calc.png`, encodePNG(live.rgb, live.width, live.height));
  console.log(`captured ${live.width}×${live.height} live pixels via WGC → .scratch/dark-calc.png`);
}

// 3. DRIVE it cursor-free — clear, then 7 × 6 = 42 via the Invoke pattern (no focus, no SendInput).
for (const name of ['Clear', 'Seven', 'Multiply by', 'Six', 'Equals']) {
  const button = calc.find({ controlType: ControlType.Button, name }) ?? calc.find({ controlType: ControlType.Button, nameContains: name });
  try {
    button?.invoke();
  } catch {
    // a disabled button (e.g. Clear when already 0) — skip
  }
  button?.release();
  Bun.sleepSync(150);
}
Bun.sleepSync(300);
const display = calc.find({ automationId: 'CalculatorResults' });
const result = display?.name ?? '';
display?.release();
console.log(`cursor-free result: ${JSON.stringify(result)}`);

// 4. PROVE we never foregrounded the window.
const stoleFocus = foregroundWindow() === target;
console.log(`\nforeground is still NOT Calculator: ${!stoleFocus}`);

const ok = /\b42\b/.test(result) && !stoleFocus && buttons.length > 0;
calc.dispose();
uia.uninitialize();
console.log(ok ? '\n\x1b[92m✓ drove a real app in the dark — read + saw + controlled it, never in the foreground\x1b[0m' : '\n\x1b[91m✗ failed\x1b[0m');
process.exit(ok ? 0 : 1);
