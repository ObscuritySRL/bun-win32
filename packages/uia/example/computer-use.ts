/**
 * Computer-use, cursor-free — the Anthropic / OpenAI action set, grounded in UIA on Windows.
 *
 * Runs the literal computer-use `left_click` action against Calculator buttons BY COORDINATE, but the
 * adapter resolves the element under each point and invoke()s it: the real mouse never moves, it works
 * on a locked session, and every pixel action becomes a ground-truth semantic one — erasing the
 * coordinate-hallucination and downscaling-click-miss failure modes of screenshot-only agents. Asserts
 * that the cursor did not move and that 5 + 3 = 8. This example IS the integration test (exits non-zero
 * on failure).
 *
 * APIs demonstrated:
 * - dispatch (computer-use adapter, @bun-win32/uia), cursorPosition, uia.waitForIdle
 *
 * Run: bun run example/computer-use.ts
 */
import { ControlType, cursorPosition, dispatch, uia } from '@bun-win32/uia';

uia.initialize();
const calc = await uia.launch(['cmd', '/c', 'start', 'calc'], { title: 'Calculator' });
calc.activate();
await uia.waitForIdle(calc, { timeout: 4000, quietMs: 350 });

function center(name: string): [number, number] {
  const button = calc.find({ controlType: ControlType.Button, name });
  if (button === null) throw new Error(`no button "${name}"`);
  const bounds = button.boundingRectangle;
  button.release();
  return [bounds.x + (bounds.width >> 1), bounds.y + (bounds.height >> 1)];
}

const before = cursorPosition();
for (const name of ['Five', 'Plus', 'Three', 'Equals']) {
  const result = await dispatch(calc, { action: 'left_click', coordinate: center(name) });
  console.log(`  left_click ${name.padEnd(6)} -> ${result.output}`);
  await Bun.sleep(120);
}
const after = cursorPosition();

const display = calc.find({ automationId: 'CalculatorResults' })?.name ?? '';
const cursorStill = before.x === after.x && before.y === after.y;
console.log(`\n  display: \x1b[1m${display}\x1b[0m`);
console.log(`  real cursor moved: ${!cursorStill} (before ${before.x},${before.y} | after ${after.x},${after.y})`);

const ok = display.includes('8') && cursorStill;
console.log(ok ? '\n  \x1b[92m✓ 5 + 3 = 8, driven by coordinate, the real cursor never moved\x1b[0m\n' : '\n  \x1b[91m✗ assertion failed\x1b[0m\n');

try {
  calc.close(); // WindowPattern — unsupported on some UWP frames (Calculator); fall back to release
} catch {
  calc.dispose();
}
uia.uninitialize();
process.exit(ok ? 0 : 1);
