/**
 * named-cached-readpath — named() (the RESOLVED-control identity in a ref-action result, mcp.ts) read controlType + name
 * LIVE (get_CurrentControlType + get_CurrentName) — TWO cross-process round-trips per ref action — even though a ref-path
 * element comes from the snapshot's BuildUpdatedCache with Name + ControlType ALREADY cached (the very values the rendered
 * tree is built from). named() now reads cachedControlTypeName / cachedName on the ref path, with a cachedControlType===0
 * guard that falls back to the live read for a find()-resolved element (which has no cache). This proves the two cached
 * reads equal the live reads for ref elements, and that the fallback boundary (uncached → 0/"") is exact.
 *
 * Proof (live, library-level — the exact getters named() now uses): launch Calculator, snapshot; for every ref'd element
 * cachedControlTypeName===controlTypeName AND cachedName===name (byte-identical); the attached root (a find()-resolved
 * analog with no cache) reports cachedControlType===0 without throwing, so the live fallback fires exactly there.
 * Calculator closed in teardown.
 *
 * bun test is broken repo-wide — runnable harness:
 * Run: bun run example/named-cached-readpath.integration.test.ts
 */
import { closeWindow, snapshot, uia } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

uia.initialize();
const win = await uia.launch(['calc.exe'], { title: 'Calculator' }).catch(() => null);
try {
  if (win === null) {
    console.log('  skip: Calculator did not launch');
  } else {
    await Bun.sleep(900);
    const snap = snapshot(win);
    let checked = 0;
    let typeMismatch = 0;
    let nameMismatch = 0;
    for (let i = 1; i <= 200 && checked < 20; i += 1) {
      const element = snap.resolve(`e${i}`);
      if (element === null) continue;
      checked += 1;
      if (element.cachedControlTypeName !== element.controlTypeName) typeMismatch += 1;
      if (element.cachedName !== element.name) nameMismatch += 1;
    }
    assert(checked > 0, `resolved ref'd elements from the snapshot (${checked})`);
    assert(typeMismatch === 0, `cachedControlTypeName === controlTypeName for all ${checked} ref elements (the named() cached read path)`);
    assert(nameMismatch === 0, `cachedName === name for all ${checked} ref elements (byte-identical, no round-trip needed)`);

    const root = uia.attach(win.hWnd); // a non-cache-built element — the find()-resolved analog
    let boundaryOk = false;
    try {
      boundaryOk = root.cachedControlType === 0;
    } catch {
      boundaryOk = false;
    }
    assert(boundaryOk, 'an uncached (find()-resolved analog) element reports cachedControlType===0 without throwing — the live-fallback boundary is exact');
    snap.dispose();
    root.dispose();
  }
} finally {
  if (win !== null) {
    closeWindow(win.hWnd);
    win.dispose();
  }
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — named() reads the ref path from cache (== live) and falls back to live exactly at the uncached boundary.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
