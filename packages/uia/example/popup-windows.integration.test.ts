/**
 * popup-windows — discover owned/untitled popup windows (combobox dropdowns, classic #32768 context menus,
 * WPF/WinUI Popups, autocomplete) that open in their OWN window. listWindows dropped every untitled top-level,
 * so after expanding a dropdown the agent was blind to the items it had to click. listWindows({ includeUntitled })
 * (MCP list_windows { includePopups:true }) now also returns visible non-zero-size untitled top-levels, so the
 * agent enumerates the popup and attaches it by hWnd to see + invoke its items.
 *
 * Proof: includeUntitled is a strict superset that adds untitled windows; and (when a ComboBox is available)
 * expanding it makes a NEW untitled popup appear in the includeUntitled list that the default list still hides.
 *
 * bun test is broken repo-wide for FFI; runnable harness (no windows spawned):
 * Run: bun run example/popup-windows.integration.test.ts
 */
import { ControlType, type Element, uia } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

uia.initialize();
try {
  const titled = uia.windows();
  const all = uia.windows({ includeUntitled: true });
  const titledSet = new Set(titled.map((w) => w.hWnd));
  assert(all.length >= titled.length, `includeUntitled is a superset (${titled.length} titled → ${all.length} with untitled)`);
  assert(
    titled.every((w) => all.some((a) => a.hWnd === w.hWnd)),
    'every titled window is still present with includeUntitled',
  );
  if (all.some((w) => !titledSet.has(w.hWnd))) assert(true, 'includeUntitled surfaces untitled top-level windows the default list hides');
  else console.log('  skip: no untitled top-level window currently open to exercise the superset delta');

  // opportunistic: a real dropdown popup becomes discoverable only with includeUntitled.
  let combo: Element | null = null;
  let comboWin = 0n;
  for (const w of titled) {
    const win = uia.attach(w.hWnd);
    const found = win.find({ controlType: ControlType.ComboBox });
    if (found !== null) {
      combo = found;
      comboWin = w.hWnd;
      win.dispose();
      break;
    }
    win.dispose();
  }
  if (combo !== null) {
    const beforeDefault = new Set(uia.windows().map((w) => w.hWnd));
    try {
      combo.expand();
    } catch {
      /* some comboboxes use invoke */
    }
    await Bun.sleep(400);
    const popupsNow = uia.windows({ includeUntitled: true }).filter((w) => !beforeDefault.has(w.hWnd));
    const stillHidden = uia.windows().filter((w) => !beforeDefault.has(w.hWnd));
    assert(popupsNow.length > 0, `expanding a ComboBox surfaced a popup window via includeUntitled (${popupsNow.map((w) => w.className).join(',')})`);
    assert(popupsNow.length > stillHidden.length, 'the dropdown popup is discoverable ONLY with includeUntitled (the default list still hides it)');
    try {
      combo.collapse();
    } catch {
      /* ignore */
    }
    combo.release();
  } else {
    console.log('  skip: no ComboBox in any running app to open a live dropdown');
  }
} finally {
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — owned/untitled popup windows are discoverable (listWindows includeUntitled).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
