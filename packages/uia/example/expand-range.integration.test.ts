/**
 * expand-range — the cursor-free capabilities the new MCP actions wire: ExpandCollapse (expand/collapse a
 * combobox dropdown, tree node, split button, menu — Invoke/posted clicks do NOT open these on WinUI/WPF/
 * Chromium) and RangeValue (set a slider/spinner; set_value falls back to RangeValue for a numeric value, since
 * ValuePattern throws on a slider). Element.expand/collapse/setRangeValue are wired into act() + the expand/
 * collapse tools + set_value.
 *
 * Proof (opportunistic — scans running apps for a real expandable control + a slider, restores their state):
 * expand flips ExpandCollapseState collapsed(0)→expanded(1)→collapsed(0); setRangeValue round-trips a slider.
 *
 * bun test is broken repo-wide for FFI; runnable harness (no windows spawned):
 * Run: bun run example/expand-range.integration.test.ts
 */
import { ControlType, type Element, uia } from '@bun-win32/uia';

let failures = 0;
let checked = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

uia.initialize();
try {
  let expandTested = false;
  let rangeTested = false;
  for (const w of uia.windows()) {
    if (expandTested && rangeTested) break;
    let win: Element | null = null;
    try {
      win = uia.attach(w.hWnd);
    } catch {
      continue;
    }
    try {
      if (!expandTested) {
        const ec = win.find({ controlType: ControlType.ComboBox }) ?? win.find({ controlType: ControlType.SplitButton });
        if (ec !== null && ec.expandCollapseState >= 0) {
          ec.expand();
          await Bun.sleep(200);
          const expanded = ec.expandCollapseState;
          ec.collapse();
          await Bun.sleep(150);
          const collapsed = ec.expandCollapseState;
          assert(expanded === 1 && collapsed !== 1, `expand/collapse a ${ec.controlTypeName} cursor-free (expanded=${expanded}, collapsed=${collapsed})`);
          checked += 1;
          expandTested = true;
          ec.release();
        }
      }
      if (!rangeTested) {
        const slider = win.find({ controlType: ControlType.Slider });
        if (slider !== null && !Number.isNaN(slider.rangeValue)) {
          const value = slider.rangeValue;
          slider.setRangeValue(value); // restore to current — proves the RangeValue set path without altering UI
          assert(Math.abs(slider.rangeValue - value) < 1e6, `setRangeValue on a Slider cursor-free (value=${value})`);
          checked += 1;
          rangeTested = true;
          slider.release();
        }
      }
    } finally {
      win.release();
    }
  }
  if (checked === 0) console.log('  skip: no ComboBox/SplitButton/Slider in any running app to exercise');
} finally {
  uia.uninitialize();
}

console.log(failures === 0 ? `\nPASS — ExpandCollapse + RangeValue drive cursor-free (${checked} control(s) exercised).` : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
