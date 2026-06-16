/**
 * compile-needs-client-filter — compileCondition silently dropped an exact-scalar predicate that FAILED to build
 * (propertyCondition* returned 0n) without forcing the client-side matches() re-check, so the surviving server
 * condition (or TrueCondition, when all parts drop) would over-match and the fast path could act on the WRONG control.
 * Each scalar branch now sets needsClientFilter=true when its predicate drops, so element.ts's matches() pass re-verifies
 * every field exactly. The drop itself is a COM-failure case not reproducible with valid inputs; this test guards the
 * REAL risk of the change — that it must NOT flip needsClientFilter for a normal, buildable selector (which would kill
 * the server-only fast path) — and the existing condition.test.ts multi-field case proves the matches() net is sound.
 *
 * Proof: with a live IUIAutomation, a buildable exact selector keeps needsClientFilter=false (fast path), while
 * regex / nameContains / (and the empty fast path) keep their established values.
 *
 * bun test is broken repo-wide — runnable script (UIA init only, no window):
 * Run: bun run example/compile-needs-client-filter.integration.test.ts
 */
import { automation, comRelease, compileCondition, ControlType, uia } from '@bun-win32/uia';

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
  const pAutomation = automation();
  const check = (label: string, selector: Parameters<typeof compileCondition>[1], wantClientFilter: boolean): void => {
    const compiled = compileCondition(pAutomation, selector);
    assert(compiled.needsClientFilter === wantClientFilter, `${label}: needsClientFilter === ${wantClientFilter}`);
    if (compiled.owned) comRelease(compiled.condition);
  };

  // Buildable exact scalars → server-only fast path (needsClientFilter stays false). My change must not regress these.
  check('exact name', { name: 'Five' }, false);
  check('exact automationId', { automationId: 'num5Button' }, false);
  check('exact className', { className: 'Button' }, false);
  check('exact controlType', { controlType: ControlType.Button }, false);
  check('multi-field exact', { controlType: ControlType.Button, name: 'Five', className: 'Button' }, false);

  // Client-filter selectors (unchanged).
  check('regex name', { name: /^F/ }, true);
  check('nameContains', { nameContains: 'iv' }, true);

  // The ALREADY-OPTIMAL empty-selector fast path must stay (no failed parts → no client filter).
  check('empty selector', {}, false);
} finally {
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — compileCondition preserves the fast path for buildable selectors; a dropped predicate forces the client re-check.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
