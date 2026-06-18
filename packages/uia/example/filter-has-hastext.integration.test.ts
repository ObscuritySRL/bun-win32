/**
 * filter-has-hastext — descendant-scoped Selector filter (Playwright filter({has, hasText})) on a single find.
 *
 * The Selector could express whole-window OR (controlTypes), positional (index/last), and name predicates, but had NO
 * way to say "the Group that CONTAINS a Button named Five" or "the row that HAS the text X" — Playwright's
 * locator.filter({has, hasText}) chaining. Selector now carries client-side `has?: Selector` / `hasText?: string`,
 * evaluated per surviving candidate by a TreeScope_Subtree find on the live element (element.ts subtreeMatches), off the
 * hot server path — engaged only when set. compileCondition forces needsClientFilter so the client pass runs them, and
 * matches() stays a pure property check that neither evaluates nor rejects on the subtree predicate.
 *
 * Proof (drives the real Calculator tree — Number pad Group CONTAINS the Five button; Memory controls does not):
 *  - find({controlType:Group, has:{name:'Five'}}) resolves the Number pad group; an absent inner selector → null;
 *  - find({controlType:Button, hasText:'Five'}) resolves the Five button (subtree includes self); a miss → null;
 *  - findAll honors it too; and the pure layer (needsSubtreeFilter / matches-ignores-subtree / compileCondition forces
 *    the client filter / selectorToString renders has+hasText) is asserted without a window.
 *
 * WITHOUT the fix every live assertion fails: has/hasText are unknown keys, so the selector over-matches the first
 * Group/Button instead of the contained one and never returns null.
 *
 * bun test is broken repo-wide for FFI; runnable harness (launches + force-closes one Calculator):
 * Run: bun run example/filter-has-hastext.integration.test.ts
 */
import { automation, comRelease, compileCondition, ControlType, matches, selectorToString, uia, windowProcessId } from '@bun-win32/uia';

import { needsSubtreeFilter } from '../element/condition'; // not yet re-exported from index (coordinator: add to the condition export); imported locally so this harness runs now

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

// pure layer (no window)
console.log('\n[1] pure layer');
assert(needsSubtreeFilter({ has: { name: 'Five' } }) === true, 'needsSubtreeFilter true for { has }');
assert(needsSubtreeFilter({ hasText: 'Five' }) === true, 'needsSubtreeFilter true for { hasText }');
assert(needsSubtreeFilter({ name: 'Five' }) === false, 'needsSubtreeFilter false for a plain property selector');
// matches() is property-only: it must IGNORE has/hasText (never reject on them — the caller folds them in via the subtree find).
const buttonProps = { name: 'Five', controlType: ControlType.Button, automationId: 'num5Button', className: 'Button' };
assert(matches(buttonProps, { controlType: ControlType.Button, has: { name: 'whatever' } }) === true, 'matches() ignores has (does not reject on it)');
assert(matches(buttonProps, { controlType: ControlType.Button, hasText: 'whatever' }) === true, 'matches() ignores hasText (does not reject on it)');
assert(matches(buttonProps, { controlType: ControlType.Edit, has: { name: 'x' } }) === false, 'matches() still rejects on a real property mismatch even with has set');
const rendered = selectorToString({ controlType: ControlType.Group, has: { name: 'Five' }, hasText: 'pad' });
assert(/has: \{.*name: "Five".*\}/.test(rendered) && /hasText: "pad"/.test(rendered), `selectorToString renders has + hasText (${rendered})`);

uia.initialize();
// compileCondition must force the client pass for a subtree-filter selector (so element.ts runs subtreeMatches).
const compiled = compileCondition(automation(), { controlType: ControlType.Group, has: { name: 'Five' } });
assert(compiled.needsClientFilter === true, 'compileCondition forces needsClientFilter for a { has } selector');
if (compiled.owned) comRelease(compiled.condition);

// Launch via the AppsFolder AUMID, not `start calc`: the explorer protocol path reliably (re)activates the UWP broker
// even when `start calc` wedges after rapid kill/relaunch; cold start can exceed the 8 s default, so allow 30 s.
const calc = await uia.launch(['explorer.exe', 'shell:AppsFolder\\Microsoft.WindowsCalculator_8wekyb3d8bbwe!App'], { title: 'Calculator' }, 30_000);
try {
  // The XAML content realizes a beat after the window appears — retry the anchor find before asserting.
  let anchor = null;
  for (let attempt = 0; attempt < 50 && anchor === null; attempt += 1) {
    anchor = calc.find({ name: 'Five' });
    if (anchor === null) Bun.sleepSync(200);
  }
  anchor?.release();
  assert(anchor !== null, 'Calculator content realized (Five button present)');

  console.log('\n[2] has — keep only a candidate whose subtree contains the inner selector');
  // has AND-folds with the other props: the NumberPad group's subtree contains Five, so the combined selector resolves it;
  // flip the inner selector to an absent name and the SAME otherwise-matching group is rejected (proves has is decisive).
  const numberPad = calc.find({ controlType: ControlType.Group, automationId: 'NumberPad', has: { name: 'Five' } });
  assert(numberPad !== null && numberPad.automationId === 'NumberPad', `find(Group#NumberPad has:{name:'Five'}) → the Number pad group (aid=${JSON.stringify(numberPad?.automationId)})`);
  numberPad?.release();

  const numberPadMiss = calc.find({ controlType: ControlType.Group, automationId: 'NumberPad', has: { name: 'ZzzNoSuchControl' } });
  assert(numberPadMiss === null, 'find(Group#NumberPad has:{name:absent}) → null (has rejects even when controlType + automationId match)');
  numberPadMiss?.release();

  console.log('\n[3] hasText — subtree (incl. self) name substring');
  const fiveByText = calc.find({ controlType: ControlType.Button, hasText: 'Five' });
  assert(fiveByText !== null && fiveByText.name === 'Five', `find(Button hasText:'Five') → the Five button (name=${JSON.stringify(fiveByText?.name)}), not the first Button`);
  fiveByText?.release();

  const noText = calc.find({ controlType: ControlType.Button, hasText: 'ZzzNoSuchControl' });
  assert(noText === null, 'find(Button hasText:absent) → null (does NOT fall through to the first Button)');
  noText?.release();

  console.log('\n[4] findAll honors the subtree filter');
  const allGroups = calc.findAll({ controlType: ControlType.Group });
  const totalGroups = allGroups.length;
  for (const group of allGroups) group.release();
  const groupsWithFive = calc.findAll({ controlType: ControlType.Group, has: { name: 'Five' } });
  const aids = groupsWithFive.map((group) => group.automationId);
  // Several ancestor Groups can each contain Five (the NumberPad and its wrapper) — the filter must INCLUDE NumberPad,
  // EXCLUDE the unrelated Memory/Standard groups, and yield strictly fewer than the unfiltered group set.
  assert(aids.includes('NumberPad'), `findAll(Group has:{name:'Five'}) includes NumberPad (${JSON.stringify(aids)})`);
  assert(!aids.includes('MemoryPanel') && !aids.includes('StandardOperators'), 'findAll(Group has:{name:"Five"}) EXCLUDES groups whose subtree lacks Five (Memory/Standard)');
  assert(groupsWithFive.length < totalGroups, `findAll filtered the group set down (${groupsWithFive.length} of ${totalGroups})`);
  for (const group of groupsWithFive) group.release();
} finally {
  // Force-kill the window's OWNING process by pid (findings/31): Win11 Calculator is single-instance UWP, so
  // closeWindow alone strands the CalculatorApp host and a later `start calc` races the zombie. taskkill /F is clean.
  const pid = windowProcessId(calc.hWnd);
  calc.dispose();
  if (pid) Bun.spawnSync(['taskkill', '/F', '/PID', String(pid)]);
  uia.uninitialize();
}

console.log(failures === 0 ? '\nPASS — has/hasText descendant-scoped filter resolves the contained candidate and returns null on a miss.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
