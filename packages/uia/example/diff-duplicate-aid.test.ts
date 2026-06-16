/**
 * diff-duplicate-aid — diff.ts flatten() keyed a child by '#automationId' whenever it had one, with NO sibling-
 * uniqueness check. Two siblings sharing an aid (repeated/virtualized rows) collided to the SAME key — the map silently
 * dropped one, so a NON-LAST sibling's rename was swallowed AND refsRenumbered under-reported churn (a stale ref could
 * then survive and mis-resolve to the wrong control, breaking "refs rejected, not mis-resolved"). An aid is now used as
 * a key only when UNIQUE among siblings; a duplicated aid falls back to the positional index.
 *
 * Pure-function proof (no UIA, no windows): a middle dup-aid row renamed is now REPORTED (was lost to the collision),
 * while the unique-aid sibling-insert economy (refs survive a status row appearing) is preserved.
 *
 * bun test is broken repo-wide — runnable script:
 * Run: bun run example/diff-duplicate-aid.test.ts
 */
import { type DiffNode, diffTrees, refsRenumbered } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

const row = (name: string, ref: string): DiffNode => ({ role: 'Text', name, automationId: 'row', ref, children: [] }); // three siblings all sharing aid "row"
const pane = (children: DiffNode[]): DiffNode => ({ role: 'Window', name: 'w', children: [{ role: 'Pane', name: 'p', children }] });

// 1) A NON-LAST dup-aid sibling renamed — must be reported, not swallowed by a key collision.
const before = pane([row('Alpha', 'e1'), row('Beta', 'e2'), row('Gamma', 'e3')]);
const after = pane([row('Alpha', 'e1'), row('CHANGED', 'e2'), row('Gamma', 'e3')]); // middle Beta → CHANGED
const diff = diffTrees(before, after);
assert(diff.renamed.some((change) => change.before === 'Beta' && change.after === 'CHANGED'), `a middle duplicate-aid row's rename is reported (renamed: ${JSON.stringify(diff.renamed.map((c) => `${c.before}→${c.after}`))})`);
assert(diff.appeared.length === 0 && diff.disappeared.length === 0, 'the rename is NOT mis-read as appear+disappear');

// 2) Unique-aid sibling-insert economy preserved: a status Text appearing before unique-aid buttons must NOT renumber them.
const btn = (name: string, aid: string, ref: string): DiffNode => ({ role: 'Button', name, automationId: aid, ref, children: [] });
const formBefore: DiffNode = { role: 'Window', name: 'w', children: [btn('OK', 'okBtn', 'e1'), btn('Cancel', 'cancelBtn', 'e2')] };
const formAfter: DiffNode = { role: 'Window', name: 'w', children: [{ role: 'Text', name: 'Saved', children: [] }, btn('OK', 'okBtn', 'e1'), btn('Cancel', 'cancelBtn', 'e2')] };
assert(refsRenumbered(formBefore, formAfter) === false, 'a status row inserted before UNIQUE-aid controls does NOT renumber their refs (economy preserved)');

console.log(failures === 0 ? '\nPASS — duplicate-aid siblings no longer collide; unique-aid insert economy intact.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
