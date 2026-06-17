/**
 * select-option — live proof of the one-call combobox pick (Playwright selectOption({label}) /
 * FlaUI comboBox.Select(value)) CURSOR-FREE.
 *
 * Drives Character Map's "Character set :" combobox through Element.selectOption(text) — the same path
 * the MCP `select_option` tool uses. ONE call expands the (collapsed) combo, reveals the matching
 * ListItem by Name, selects it via SelectionItem (Invoke fallback), and collapses again — replacing the
 * old four-step expand → snapshot → find → select → collapse dance. No real mouse, so it works on a
 * background/locked session.
 *
 * Asserts: selectOption returns true and the combo's ValuePattern reflects the picked option; an
 * ignoreCase pick lands the same value; a non-existent option returns false (and leaves the combo
 * collapsed). Pure composition of shipped patterns — no new FFI; a wrong slot in the composed path
 * would segfault, so this also live-exercises expand/reveal/select/collapse together.
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/select-option.integration.test.ts
 */
import { closeWindow, ControlType, uia } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

uia.initialize();
const priorMaps = new Set(
  uia
    .windows()
    .filter((window) => (window.title ?? '').includes('Character Map'))
    .map((window) => window.hWnd),
);
Bun.spawn(['charmap.exe'], { stdout: 'ignore', stderr: 'ignore' });
await Bun.sleep(2500);
const hWnd = uia.windows().find((window) => (window.title ?? '').includes('Character Map') && !priorMaps.has(window.hWnd))?.hWnd ?? 0n;

try {
  if (hWnd === 0n) {
    console.log('[select-option] could not open Character Map — SKIPPING');
  } else {
    const charmap = uia.attach(hWnd);
    const combo = charmap.findAll({ controlType: ControlType.ComboBox }).find((candidate) => candidate.name.startsWith('Character set'));
    console.log(`  combobox: ${combo !== undefined ? JSON.stringify(combo.name) : 'NOT FOUND'} (value ${JSON.stringify(combo?.value)})`);
    if (combo === undefined) {
      console.log('[select-option] Character Map shows no "Character set :" combobox — SKIPPING');
    } else {
      const picked = combo.selectOption('Windows: Cyrillic');
      await Bun.sleep(300);
      assert(picked, 'selectOption("Windows: Cyrillic") returns true (one call: expand → reveal → select → collapse)');
      assert(combo.value === 'Windows: Cyrillic', `the combobox value is now "Windows: Cyrillic" (${JSON.stringify(combo.value)})`);

      const pickedIgnoreCase = combo.selectOption('windows: greek', { ignoreCase: true });
      await Bun.sleep(300);
      assert(pickedIgnoreCase, 'selectOption("windows: greek", {ignoreCase}) returns true (case-insensitive pick)');
      assert(combo.value === 'Windows: Greek', `ignoreCase landed the canonically-cased value "Windows: Greek" (${JSON.stringify(combo.value)})`);

      const missing = combo.selectOption('No Such Character Set');
      await Bun.sleep(200);
      assert(!missing, 'selectOption on a non-existent option returns false');
      assert(combo.expandCollapseState === 0, 'the combobox is left COLLAPSED after a no-match pick');

      combo.release();
    }
    charmap.dispose();
  }
} finally {
  if (hWnd !== 0n) closeWindow(hWnd);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — cursor-free one-call combobox selectOption verified (text + ignoreCase + no-match).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
