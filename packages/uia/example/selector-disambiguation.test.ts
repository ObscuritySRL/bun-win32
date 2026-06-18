/**
 * selector-disambiguation — three condition.ts upgrades, all pure-function (no UIA, no windows):
 *
 *  1) matches() with a /g or /y selector must stay STATELESS *and* cheap: it strips g/y to a memoized copy ONCE per
 *     distinct selector regex (a WeakMap), not per candidate. The pre-fix code rebuilt a fresh RegExp (+ a flags.replace
 *     pass) for EVERY candidate — ~67× the non-global cost on a large window. The micro-bench proves the global path now
 *     collapses toward the non-global cost; correctness (matching ALL siblings, repeatable) is asserted too.
 *  2) pickIndexed() disambiguates N identical twins (three "Delete" buttons, 20 unnamed ListItems) by `index`/`last`
 *     — a client-side slice, no snapshot round-trip — where a plain selector would silently act on the FIRST.
 *  3) matches() honors `controlTypes` (Button OR Hyperlink OR MenuItem) — the any-of case a single controlType can't
 *     express; compileCondition builds the server-side OR, and this client mirror re-verifies it.
 *
 * The pre-fix tree had no pickIndexed, no controlTypes, and recompiled the regex per candidate.
 *
 * bun test is broken repo-wide — runnable script:
 * Run: bun run example/selector-disambiguation.test.ts
 */
import { ControlType } from '../com/constants';
import { type ElementProperties, matches, pickIndexed, type Selector, selectorToString } from '../element/condition';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

const element = (name: string, controlType = 0, automationId = ''): ElementProperties => ({ automationId, className: '', controlType, name });
function medianNs(run: () => void, iterations: number): number {
  for (let i = 0; i < Math.min(iterations, 2000); i += 1) run();
  const start = Bun.nanoseconds();
  for (let i = 0; i < iterations; i += 1) run();
  return (Bun.nanoseconds() - start) / iterations;
}

// 1) matches() — global selector matches EVERY sibling, and the SAME object reused does not leak a lastIndex back.
console.log('\n[1] /g selector stays stateless');
const siblings = ['Save', 'Save As', 'Save Copy', 'Save All', 'Save and Close'].map((name) => element(name));
const globalSelector: Selector = { name: /save/gi };
assert(siblings.filter((sibling) => matches(sibling, globalSelector)).length === siblings.length, `/save/gi matched all ${siblings.length} "Save…" siblings`);
assert(siblings.filter((sibling) => matches(sibling, globalSelector)).length === siblings.length, 're-running the SAME /save/gi selector still matched all (no residual lastIndex)');
assert(matches(element('Save As'), { name: /save/i }) && !matches(element('Open'), { name: /save/i }), 'plain /save/i still matches "Save As" and rejects "Open"');

// 1b) micro-bench: the /g path must NOT be a multiple of the non-global path any more (was ~67×; now ~1× via the cache).
console.log('\n[1b] /g path no longer recompiles per candidate');
const pool = ['Save', 'Save As', 'Save Copy', 'Save All', 'Save and Close'].map((name) => element(name));
const plainSel: Selector = { name: /save/i };
const globalSel: Selector = { name: /save/gi };
const passPlain = (): void => {
  for (const candidate of pool) matches(candidate, plainSel);
};
const passGlobal = (): void => {
  for (const candidate of pool) matches(candidate, globalSel);
};
const plainNs = medianNs(passPlain, 200_000);
const globalNs = medianNs(passGlobal, 200_000);
const ratio = globalNs / plainNs;
console.log(`  non-global ${plainNs.toFixed(1)} ns vs /g ${globalNs.toFixed(1)} ns per 5-name pass → ${ratio.toFixed(2)}× (pre-fix was ~67×)`);
assert(ratio < 5, `/g matches() is within 5× of the non-global cost (got ${ratio.toFixed(2)}×) — the per-candidate recompile is gone`);

// 2) pickIndexed — disambiguate N identical twins.
console.log('\n[2] pickIndexed disambiguates twins');
const twins = [element('Delete', ControlType.Button, 'del0'), element('Delete', ControlType.Button, 'del1'), element('Delete', ControlType.Button, 'del2')];
assert(pickIndexed(twins, {})?.automationId === 'del0', 'no index → first match (del0)');
assert(pickIndexed(twins, { index: 1 })?.automationId === 'del1', 'index:1 → second match (del1)');
assert(pickIndexed(twins, { index: 2 })?.automationId === 'del2', 'index:2 → third match (del2)');
assert(pickIndexed(twins, { last: true })?.automationId === 'del2', 'last:true → final match (del2)');
assert(pickIndexed(twins, { index: 0, last: true })?.automationId === 'del0', 'index wins over last when both set');
assert(pickIndexed(twins, { index: 3 }) === null, 'index out of range → null (no silent wrap to first)');
assert(pickIndexed(twins, { index: -1 }) === null, 'negative index → null');
assert(pickIndexed([], { index: 0 }) === null && pickIndexed([], { last: true }) === null && pickIndexed([], {}) === null, 'empty candidate list → null for every variant');

// 3) controlTypes — any-of (Button OR Hyperlink OR MenuItem) the client mirror honors.
console.log('\n[3] controlTypes any-of (OR)');
const anyOf: Selector = { name: 'Submit', controlTypes: [ControlType.Button, ControlType.Hyperlink, ControlType.MenuItem] };
assert(matches(element('Submit', ControlType.Button), anyOf), 'controlTypes matches a Button named Submit');
assert(matches(element('Submit', ControlType.Hyperlink), anyOf), 'controlTypes matches a Hyperlink named Submit');
assert(matches(element('Submit', ControlType.MenuItem), anyOf), 'controlTypes matches a MenuItem named Submit');
assert(!matches(element('Submit', ControlType.Edit), anyOf), 'controlTypes rejects an Edit named Submit (not in the set)');
assert(!matches(element('Cancel', ControlType.Button), anyOf), 'AND with name still holds (Cancel Button rejected)');
assert(selectorToString(anyOf).includes('controlTypes: [Button, Hyperlink, MenuItem]'), 'selectorToString renders controlTypes by name');
assert(selectorToString({ index: 2, last: true }).includes('index: 2') && selectorToString({ index: 2, last: true }).includes('last: true'), 'selectorToString renders index + last');

console.log(failures === 0 ? '\nPASS — stateless+cached /g matches(), pickIndexed twins, controlTypes any-of all verified (pure-function).' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
