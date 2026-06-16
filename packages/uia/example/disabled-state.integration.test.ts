/**
 * disabled-state — a greyed-out actionable control read identically to an enabled one (the snapshot dropped
 * enabled:false), and the diff never reported a disabled↔enabled flip — so the gate signal of every wizard/form
 * (Next/OK/Submit greying in or out) was invisible to the agent. renderSnapshot now appends " (disabled)" to a
 * ref'd disabled control, and diffTrees emits a "~ … disabled → enabled" restated change on a flip.
 *
 * Pure-function proof (renderSnapshot + diffTrees are exported, deterministic — no app/foreground needed).
 *
 * bun test is broken repo-wide for FFI; runnable harness:
 * Run: bun run example/disabled-state.integration.test.ts
 */
import { diffTrees, type RefNode, renderSnapshot } from '@bun-win32/uia';

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (condition) console.log(`  ok: ${message}`);
  else {
    console.error(`  FAIL: ${message}`);
    failures += 1;
  }
}

const node = (over: Partial<RefNode>): RefNode => ({ role: 'Button', name: 'Next', children: [], ...over });

// (1) renderSnapshot surfaces a ref'd disabled control, and does NOT tag an enabled one or a ref-less node.
const rendered = renderSnapshot(node({ role: 'Pane', name: 'root', children: [node({ ref: 'e1', enabled: false }), node({ ref: 'e2', name: 'Back', enabled: true }), node({ name: 'Static', enabled: false })] }));
assert(/Button "Next" \[ref=e1\] \(disabled\)/.test(rendered), 'a ref\'d disabled control renders " (disabled)"');
assert(!/Button "Back" \[ref=e2\][^\n]*\(disabled\)/.test(rendered), "an ENABLED ref'd control is not tagged disabled");
assert(!/"Static"[^\n]*\(disabled\)/.test(rendered), 'a ref-less node is not tagged (only actionable controls)');

// (2) diffTrees reports a disabled→enabled gate flip as a restated change, keeping the ref.
const before = node({ role: 'Pane', name: 'root', children: [node({ ref: 'e1', automationId: 'nextBtn', enabled: false })] });
const after = node({ role: 'Pane', name: 'root', children: [node({ ref: 'e1', automationId: 'nextBtn', enabled: true })] });
const diff = diffTrees(before, after);
const flip = diff.restated.find((change) => change.ref === 'e1');
assert(flip !== undefined && flip.before === 'disabled' && flip.after === 'enabled', 'a disabled→enabled flip is a restated change (before="disabled" after="enabled", ref kept)');
assert(diff.appeared.length === 0 && diff.disappeared.length === 0 && !diff.refsRenumbered, 'the flip is NOT churn — no appeared/disappeared, refs not renumbered');

console.log(failures === 0 ? '\nPASS — disabled controls are visible in the snapshot and enabled↔disabled flips show in the diff.' : `\nFAILED — ${failures} assertion(s)`);
process.exit(failures === 0 ? 0 : 1);
