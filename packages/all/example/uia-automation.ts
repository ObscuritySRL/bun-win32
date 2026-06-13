/**
 * UI Automation — drive ANOTHER GUI app from TypeScript, now on @bun-win32/uia.
 *
 * Launches Windows Calculator, attaches Microsoft UI Automation to its live window, renders the actual
 * on-screen control tree as a colored ANSI tree, and then — the part you "cannot do in TypeScript" —
 * physically presses Calculator's buttons to compute 5 + 3 = 8 by invoking each button's UIA
 * InvokePattern (semantic targeting by name, not pixels). A PrintWindow screenshot saves the proof.
 *
 * This is the regression proof for the productization: the original demo inline-dlopen'd combase and
 * hand-rolled the COM vtable invoker, GUID packing, tree walk, and click. It now imports the published
 * @bun-win32/uia package — and still drives Calculator to 8.
 *
 * Native pipeline (all inside @bun-win32/uia):
 *   - @bun-win32/combase CoInitializeEx / CoCreateInstance(CLSID_CUIAutomation)   (the new activation bindings)
 *   - IUIAutomation::ElementFromHandle (slot 6) → window element                  (cast-free vcall)
 *   - server-side CreatePropertyCondition + FindFirst → the buttons by name        (the VARIANT-by-pointer path)
 *   - IUIAutomationInvokePattern::Invoke → presses each button
 *   - Window.screenshot → PrintWindow → pure-TS PNG                                (visual proof)
 *
 * Graceful degradation: if Calculator can't be launched/found or UIA is unavailable, it prints a
 * friendly note and exits 0.
 *
 * Run: bun run example/uia-automation.ts
 *      DEMO_DURATION_MS=8000 bun run example/uia-automation.ts
 */
import { ControlType, uia } from '@bun-win32/uia';
import User32 from '@bun-win32/user32';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[96m';
const GREEN = '\x1b[92m';
const YELLOW = '\x1b[93m';
const MAGENTA = '\x1b[95m';

const deadline = Bun.env.DEMO_DURATION_MS ? Bun.nanoseconds() + Number(Bun.env.DEMO_DURATION_MS) * 1e6 : Number.POSITIVE_INFINITY;

function colorForType(role: string): string {
  if (role === 'Button') return CYAN;
  if (role === 'Edit') return GREEN;
  if (role === 'Text') return YELLOW;
  if (role === 'Window' || role === 'Pane') return MAGENTA;
  return DIM;
}

try {
  uia.initialize();
  console.log(`\n${BOLD}${MAGENTA}  UI AUTOMATION — DRIVING ANOTHER GUI APP${RESET}  ${DIM}@bun-win32/uia · in-process COM vtable FFI${RESET}\n`);

  Bun.spawn(['cmd', '/c', 'start', 'calc'], { stdout: 'ignore', stderr: 'ignore' });
  let hWnd = 0n;
  const title = Buffer.from('Calculator\0', 'utf16le');
  const findUntil = Math.min(deadline, Bun.nanoseconds() + 6e9);
  while (hWnd === 0n && Bun.nanoseconds() < findUntil) {
    Bun.sleepSync(400);
    hWnd = User32.FindWindowW(null, title.ptr!);
  }
  if (hWnd === 0n) {
    console.log(`${YELLOW}  Could not find a 'Calculator' window — expected on locked-down boxes. Exiting cleanly.${RESET}\n`);
    process.exit(0);
  }
  Bun.sleepSync(800);
  const app = uia.attach(hWnd);
  console.log(`  ${GREEN}✓${RESET} attached IUIAutomation to ${BOLD}"${app.name}"${RESET} ${DIM}(HWND 0x${hWnd.toString(16)})${RESET}\n`);

  const buttons = app.findAll({ controlType: ControlType.Button });
  console.log(`${BOLD}  Calculator's live control tree${RESET}  ${DIM}${buttons.length} buttons${RESET}`);
  for (const button of buttons.slice(0, 16)) console.log(`  ${DIM}├─${RESET} ${colorForType('Button')}Button${RESET} ${button.name}`);
  for (const button of buttons) button.release();

  console.log(`\n${BOLD}  Computing 5 + 3 = 8 by invoking buttons${RESET}`);
  let allClicked = true;
  for (const name of ['Five', 'Plus', 'Three', 'Equals']) {
    if (Bun.nanoseconds() >= deadline) break;
    const button = app.find({ controlType: ControlType.Button, name });
    if (button) {
      try {
        button.invoke();
        console.log(`  ${GREEN}✓${RESET} pressed ${BOLD}${CYAN}${name}${RESET}`);
      } catch {
        allClicked = false;
      }
      button.release();
    } else allClicked = false;
    Bun.sleepSync(400);
  }

  Bun.sleepSync(400);
  const display = app.find({ automationId: 'CalculatorResults' });
  if (allClicked && display && /8/.test(display.name)) {
    console.log(`\n  ${BOLD}${GREEN}✓ ${display.name} — 5 + 3 = 8 typed into Calculator from TypeScript.${RESET}`);
    await Bun.write('.scratch/uia-automation.png', app.screenshot());
    console.log(`  ${DIM}Look at the Calculator window (or .scratch/uia-automation.png) — the display shows 8.${RESET}\n`);
  } else {
    console.log(`\n  ${YELLOW}Some buttons could not be invoked (Calculator's tree may differ on this build).${RESET}\n`);
  }
  display?.release();
  app.dispose();
  console.log(`${GREEN}${BOLD}  ✓ UI Automation walkthrough complete${RESET}\n`);
} catch (error) {
  console.error(`\x1b[91m  UI Automation unavailable: ${error instanceof Error ? error.message : String(error)}${RESET}`);
} finally {
  uia.uninitialize();
}
