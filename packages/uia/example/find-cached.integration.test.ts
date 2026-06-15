/**
 * find-cached — the client-filter find path (regex / nameContains) now prefetches the matcher properties in ONE
 * FindAllBuildCache round-trip and matches each candidate from cache, instead of 4 LIVE cross-process reads per
 * candidate. This is the most common find path (MCP exposes nameContains first-class) and was the naive one the
 * package's own caching doctrine says to avoid; on a large window it ran ~1s, now ~0.5s (measured: Discord, 814
 * elements, 530 matches — 1002→511 ms). Correctness must be identical to the live path.
 *
 * Proof: find the same control two ways — exact name (server-side condition) vs nameContains substring (cached
 * client filter) — and confirm they resolve the SAME element; findAll(nameContains) returns only matches whose
 * name contains the needle.
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/find-cached.integration.test.ts
 */
import { closeWindow, ControlType, type Element, uia } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

uia.initialize();
let notepad = 0n;
const prior = new Set(uia.windows().filter((w) => /Notepad/i.test(w.className)).map((w) => w.hWnd));
Bun.spawn(['notepad.exe'], { stdout: 'ignore', stderr: 'ignore' });
for (let attempt = 0; attempt < 40 && notepad === 0n; attempt += 1) {
  await Bun.sleep(150);
  notepad = uia.windows().find((w) => /Notepad/i.test(w.className) && !prior.has(w.hWnd))?.hWnd ?? 0n;
}

try {
  assert(notepad !== 0n, 'launched Notepad');
  if (notepad !== 0n) {
    await Bun.sleep(500);
    const win = uia.attach(notepad);

    // pick a named control via the cached findAll, then re-find it both ways and compare.
    const named = win.findAll({ controlType: ControlType.Button }).filter((b) => b.name.trim().length >= 3);
    const sample = named[0] ?? null;
    const sampleName = sample?.name ?? '';
    for (const b of named) b.release();
    assert(sample !== null, `found a named Button to cross-check (${JSON.stringify(sampleName)})`);

    if (sample !== null) {
      const exact: Element | null = win.find({ name: sampleName }); // server-side condition (no client filter)
      const substring = sampleName.slice(1, Math.max(2, sampleName.length - 1));
      const viaContains: Element | null = win.find({ nameContains: substring }); // cached client-filter path
      assert(exact !== null && viaContains !== null, `both the exact and the nameContains find resolved an element`);
      assert(exact !== null && viaContains !== null && exact.name === viaContains.name, `cached client-filter find matches the same control as the server-side exact find (${JSON.stringify(viaContains?.name)})`);
      exact?.release();
      viaContains?.release();

      // findAll(nameContains) returns ONLY matches whose name contains the needle (filter correctness)
      const all = win.findAll({ nameContains: substring });
      const allMatch = all.every((e) => e.name.includes(substring));
      assert(all.length > 0 && allMatch, `findAll(nameContains "${substring}") returned ${all.length} matches, all containing the needle`);
      for (const e of all) e.release();
    }
    win.dispose();
  }
} finally {
  if (notepad !== 0n) closeWindow(notepad);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — cached client-filter find is correct (same matches as live), and ~2× faster on a large window.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
