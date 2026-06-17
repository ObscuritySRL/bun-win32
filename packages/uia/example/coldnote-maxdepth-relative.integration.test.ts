/**
 * coldnote-maxdepth-relative — the empty-tree recovery hint interpolated the maxDepth the agent PASSED but then hardcoded
 * "Raise maxDepth (e.g. 4)", so an agent that passed maxDepth=6 was told to raise it to 4 — BELOW what it already passed,
 * deepening the failure loop. The suggested value is now relative (passed + 4) and offers "or omit it".
 *
 * Proof (pure unit): coldTreeNote(0, …, maxDepth) suggests passed+4 and never the stale literal "(e.g. 4)" for a higher
 * cap; the minimized / UIPI-walled branches take priority and carry no maxDepth suggestion.
 *
 * bun test is broken repo-wide — runnable script:
 * Run: bun run example/coldnote-maxdepth-relative.integration.test.ts
 */
import { coldTreeNote } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

const at6 = coldTreeNote(0, false, false, 0, 6);
assert(/maxDepth=6/.test(at6) && /e\.g\. 10/.test(at6), 'maxDepth=6 suggests raising to 10 (passed + 4)');
assert(!/e\.g\. 4\)/.test(at6), 'no longer suggests the stale literal "(e.g. 4)" below the passed cap');

const at2 = coldTreeNote(0, false, false, 0, 2);
assert(/e\.g\. 6/.test(at2), 'maxDepth=2 suggests raising to 6');

assert(coldTreeNote(5, false, false, 0, 2) === '', 'a non-empty tree yields no note (markCount>0)');

// Priority: minimized / walled / cloaked conditions override the maxDepth branch and carry no maxDepth suggestion.
assert(/MINIMIZED/.test(coldTreeNote(0, true, false, 0, 2)) && !/Raise maxDepth/.test(coldTreeNote(0, true, false, 0, 2)), 'minimized takes priority over the maxDepth hint');
assert(/UIPI|HIGHER integrity/.test(coldTreeNote(0, false, true, 0, 2)), 'UIPI-walled takes priority over the maxDepth hint');
// Cloaked (DWM-hidden) branches: reason 2 = shell/virtual-desktop, reason 1/4 = app/inherited; both override maxDepth and say NOT a cold tree.
assert(/VIRTUAL DESKTOP/.test(coldTreeNote(0, false, false, 2)) && !/Raise maxDepth/.test(coldTreeNote(0, false, false, 2, 8)), 'cloaked=2 (shell) → virtual-desktop steer, overrides maxDepth');
assert(/CLOAKED/.test(coldTreeNote(0, false, false, 1)) && /CLOAKED/.test(coldTreeNote(0, false, false, 4)), 'cloaked=1 (app) and =4 (inherited) → cloak steer (not cold-tree)');

console.log(failures === 0 ? '\nPASS — the maxDepth recovery hint suggests a value ABOVE the passed cap, not the stale literal 4.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
