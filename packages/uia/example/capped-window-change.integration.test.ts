/**
 * capped-window-change — the post-action / re-ground snapshot compared the CAPPED rendered body (renderTree →
 * capSnapshot at SNAPSHOT_MAX_CHARS) for byte-equality, so on a heavy window an action that changed something BELOW the
 * cap produced a byte-identical capped body and was reported as "no UI change — refs unchanged" — a silent false
 * negative on exactly the big windows the cap exists to protect. withSnapshot now skips the byte-equality short-circuit
 * when the body is truncated and lets the FULL-tree diff (uncapped) decide; snapshotText re-dumps a truncated explicit
 * re-ground. Both gate on the capSnapshot truncation trailer.
 *
 * Proof (unit + static — no FFI, the fix is pure control-flow): capSnapshot emits the exact "…(N more nodes — narrow
 * with …" trailer ONLY when it truncates, and both short-circuit sites in mcp.ts are gated on that marker. So a
 * byte-identical CAPPED body is never reported as "no UI change". (A live below-cap-change 2nd-op assertion needs a
 * second MCP walk of a heavy window, which hangs cross-process on this Bun build — the reveal-offscreen FFI-at-scale
 * class — so it is not exercised here; the guard is proven against the marker its producer emits.)
 *
 * bun test is broken repo-wide — runnable script:
 * Run: bun run example/capped-window-change.integration.test.ts
 */
import { capSnapshot } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

const MARKER = 'more nodes — narrow with';

// Producer: capSnapshot truncates a body over the cap and appends the trailer the guards key on; leaves a small body alone.
const big = Array.from({ length: 400 }, (_, i) => `  - CheckBox "chk ${String(i).padStart(3, '0')}" [ref=e${i}] (off)`).join('\n');
const capped = capSnapshot(big, 8000);
assert(capped.length <= 8200 && capped.includes(MARKER), `capSnapshot truncates an over-cap body and appends the "${MARKER}" trailer`);
assert(!capped.includes('chk 399'), 'the below-cap tail is dropped from the capped body (a below-cap change would not move it)');
const small = capSnapshot('  - Button "OK" [ref=e1]', 8000);
assert(!small.includes(MARKER), 'capSnapshot leaves a body under the cap untouched (no trailer)');

// Consumers: both short-circuit sites in mcp.ts are gated on that same marker.
const mcp = await Bun.file(`${import.meta.dir}/../mcp.ts`).text();
assert(new RegExp(`const truncated = body\\.includes\\('${MARKER}'\\)`).test(mcp) && /if \(bodyUnchanged && !truncated\) return noUiChange\(\)/.test(mcp), 'withSnapshot only short-circuits "no UI change" when the body is NOT truncated');
assert(new RegExp(`body === lastSnapshotBody && !body\\.includes\\('${MARKER}'\\)`).test(mcp), 'snapshotText re-grounds a truncated window instead of a false "no change"');
assert(/delta\.count === 0 && bodyUnchanged\) return noUiChange\(\)/.test(mcp), 'a truncated body whose FULL-tree diff is empty still reports "no change" (refs kept) — only the cap masking is fixed, not real no-ops');

console.log(failures === 0 ? '\nPASS — truncated snapshots are never byte-equality short-circuited; the cap can no longer mask a below-fold change.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
