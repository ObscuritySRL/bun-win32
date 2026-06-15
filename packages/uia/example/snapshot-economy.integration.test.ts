/**
 * Snapshot economy — the live proof for the MCP smart-observation chokepoint (prune + diff + cap).
 *
 * The MCP server auto-appends a re-grounding snapshot after EVERY action; this harness proves the three
 * token wins on a real window plus the one invariant that must never break: no actionable [ref] is lost.
 *
 * Asserts:
 *  A. Prune cuts the rendered tree (lines + ~tokens) AND every [ref=eN] in the unpruned render survives.
 *  B. A small change (press "5") renders as a ~tiny delta that NAMES the change, vs a full re-dump — and
 *     a pure rename has no ref churn (so the MCP withSnapshot path actually takes the delta branch).
 *  C. capSnapshot bounds a pathological tree to the budget, appends the "more nodes" trailer, and never
 *     truncates inside the kept region's refs.
 *  D. (synthetic, deterministic) pruneRefTree drops ref-less unnamed noise, keeps named + ref + interactive
 *     leaves, and collapses an unnamed ref-less single-child structural Pane.
 *
 * bun test is broken repo-wide — this is a runnable harness:
 * Run: bun run example/snapshot-economy.integration.test.ts
 */
import { capSnapshot, closeWindow, ControlType, diffTrees, pruneRefTree, type RefNode, renderDiff, renderSnapshot, uia } from '@bun-win32/uia';

function refs(text: string): Set<string> {
  const found = new Set<string>();
  for (const match of text.matchAll(/\[ref=(e\d+)\]/g)) found.add(match[1]!);
  return found;
}

function tokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`  ok: ${message}`);
}

// ---- D. synthetic prune rule (deterministic; no app) ---------------------------------------------
function syntheticPrune(): void {
  console.log('\n[D] prune rule (synthetic)');
  const tree: RefNode = {
    role: 'Window',
    name: 'Root',
    children: [
      { role: 'Pane', name: '', children: [{ role: 'Button', name: 'OK', ref: 'e1', children: [] }] }, // unnamed single-child pane → collapses to the Button
      { role: 'Text', name: 'Status: ready', children: [] }, // named leaf → kept
      { role: 'Pane', name: '', children: [] }, // unnamed ref-less non-interactive leaf → dropped
      { role: 'Custom', name: '', ref: 'e2', children: [] }, // ref leaf → kept
      { role: 'Edit', name: '', children: [] }, // interactive role, unnamed/ref-less → kept
    ],
  };
  const pruned = pruneRefTree(tree)!;
  const roles = pruned.children.map((child) => `${child.role}${child.ref ? `:${child.ref}` : ''}`);
  assert(roles.includes('Button:e1'), 'unnamed single-child Pane collapsed into its Button child (ref kept)');
  assert(roles.includes('Text'), 'named Text leaf kept');
  assert(roles.includes('Custom:e2'), 'ref-bearing Custom leaf kept');
  assert(roles.includes('Edit'), 'interactive Edit leaf kept even when unnamed/ref-less');
  assert(!pruned.children.some((child) => child.role === 'Pane'), 'unnamed ref-less non-interactive Pane dropped');
}

// ---- B0. ref-churn guard (synthetic; deterministic) ----------------------------------------------
function syntheticChurn(): void {
  console.log('\n[B0] ref-churn guard (synthetic)');
  const base: RefNode = {
    role: 'Window',
    name: 'App',
    children: [
      { role: 'Text', name: 'Display is 5', children: [] },
      { role: 'Button', name: 'Five', ref: 'e1', children: [] },
    ],
  };
  const renamed: RefNode = {
    role: 'Window',
    name: 'App',
    children: [
      { role: 'Text', name: 'Display is 55', children: [] },
      { role: 'Button', name: 'Five', ref: 'e1', children: [] },
    ],
  };
  const added: RefNode = { role: 'Window', name: 'App', children: [...base.children, { role: 'Button', name: 'Clear entry', ref: 'e2', children: [] }] };
  const renameDiff = diffTrees(base, renamed);
  const renameChurn = renameDiff.appeared.some((c) => c.ref !== undefined) || renameDiff.disappeared.some((c) => c.ref !== undefined);
  assert(!renameChurn && renderDiff(renameDiff).count === 1, 'a pure rename has no ref churn → MCP sends the Δ delta');
  const addDiff = diffTrees(base, added);
  const addChurn = addDiff.appeared.some((c) => c.ref !== undefined) || addDiff.disappeared.some((c) => c.ref !== undefined);
  assert(addChurn, 'an appeared actionable [ref] node is detected as churn → MCP falls back to the full tree (refs may shift)');
  // State-only change (e.g. a toggle): same name/position, only the inline state differs → must stay on the delta path.
  const offState: RefNode = { role: 'Window', name: 'App', children: [{ role: 'CheckBox', name: 'Wi-Fi', ref: 'e1', state: ' (off)', children: [] }] };
  const onState: RefNode = { role: 'Window', name: 'App', children: [{ role: 'CheckBox', name: 'Wi-Fi', ref: 'e1', state: ' (on)', children: [] }] };
  const stateDiff = diffTrees(offState, onState);
  const stateChurn = stateDiff.appeared.some((c) => c.ref !== undefined) || stateDiff.disappeared.some((c) => c.ref !== undefined);
  const stateDelta = renderDiff(stateDiff);
  console.log(`  state-only delta: ${JSON.stringify(stateDelta.text)} (count ${stateDelta.count}, churn ${stateChurn})`);
  assert(!stateChurn && stateDelta.count === 1 && /\(off\) → \(on\)/.test(stateDelta.text), 'a state-only change (off→on) is ONE Δ line, no churn → cheap delta, not a full dump');
}

// ---- C. budget cap (deterministic; no app) -------------------------------------------------------
function budgetCap(): void {
  console.log('\n[C] size budget (synthetic)');
  const huge: RefNode = { role: 'Window', name: 'Big', children: [] };
  for (let index = 0; index < 2000; index += 1) huge.children.push({ role: 'Button', name: `Item ${index}`, ref: `e${index + 1}`, children: [] });
  const rendered = renderSnapshot(huge);
  const capped = capSnapshot(rendered, 4_000);
  assert(rendered.length > 4_000, 'pathological tree exceeds the budget before capping');
  assert(capped.length <= 4_200, `capped body stays near the 4000-char budget (got ${capped.length})`);
  assert(/…\(\d+ more nodes/.test(capped), 'cap appends the "…(K more nodes)" trailer');
  const body = capped.slice(0, capped.lastIndexOf('\n')); // drop the trailer line
  assert(!body.includes('\n…('), 'trailer is a single appended line, not mid-body');
}

/** Render unpruned vs pruned for a window; assert no ref is lost; return the line/token deltas. */
function measurePrune(label: string, tree: RefNode): { unprunedLines: number; prunedLines: number; refsBefore: number } {
  const unpruned = renderSnapshot(tree);
  const pruned = renderSnapshot(pruneRefTree(tree) ?? tree);
  const before = refs(unpruned);
  const after = refs(pruned);
  console.log(`  ${label}: ${unpruned.split('\n').length} lines / ~${tokens(unpruned)} tok → ${pruned.split('\n').length} lines / ~${tokens(pruned)} tok (refs ${before.size}→${after.size})`);
  for (const ref of before) if (!after.has(ref)) throw new Error(`FAIL: prune dropped actionable ${ref} on ${label}`);
  assert(before.size === after.size && tokens(pruned) <= tokens(unpruned), `[${label}] every actionable ref survives prune (${after.size}/${before.size}), tree never grows`);
  return { unprunedLines: unpruned.split('\n').length, prunedLines: pruned.split('\n').length, refsBefore: before.size };
}

// ---- A + B. live -------------------------------------------------------------------
async function live(): Promise<void> {
  uia.initialize();
  const calc = await uia.launch(['cmd', '/c', 'start', 'calc'], { title: 'Calculator' });
  try {
    // A. prune token win + the ref-preservation invariant — on a dense app (Calculator) and a noisy one (Settings).
    console.log('\n[A] prune + ref-preservation invariant (live)');
    const calcSnap = uia.snapshot(calc);
    const calcMeasure = measurePrune('Calculator', calcSnap.tree);
    assert(calcMeasure.prunedLines < calcMeasure.unprunedLines, 'prune removes at least one ref-less structural line');
    calcSnap.dispose();
    // Settings is the noisy-app reference. Attach is best-effort (may be policy-blocked / slow); the
    // ref-preservation invariant is hard, the prune MAGNITUDE is informational (honest: ~8-12% on Settings —
    // most ref-less lines are NAMED section labels the agent needs, so they are kept by design, not dropped).
    let settings: Awaited<ReturnType<typeof uia.launch>> | null = null;
    try {
      settings = await uia.launch(['cmd', '/c', 'start', 'ms-settings:'], { className: 'ApplicationFrameWindow', title: 'Settings' }, 12_000);
      await uia.waitForIdle(settings, { quietMs: 600, timeout: 6_000 });
    } catch (error) {
      console.log(`  (could not attach Settings — skipping the noisy-app measurement: ${(error as Error).message})`);
      settings = null;
    }
    if (settings !== null) {
      const settingsSnap = uia.snapshot(settings);
      measurePrune('Settings', settingsSnap.tree);
      settingsSnap.dispose();
      closeWindow(settings.hWnd); // close the throwaway Settings we launched
      settings.dispose();
    }

    // B. diff (live) — Calculator is single-instance and keeps its display across runs, so we don't pin a
    //    specific press to churn. Instead press the SAME digit twice: once it is in entry mode, a further
    //    digit press is a PURE display rename (no actionable add/remove), which must take the cheap delta.
    console.log('\n[B] diff: pure-rename delta (live: Calculator)');
    const enter = calc.find({ controlType: ControlType.Button, name: 'Five' });
    assert(enter !== null, 'found the "Five" button');
    enter!.invoke(); // ensure entry mode regardless of leftover state
    enter!.release();
    await Bun.sleep(250);
    const renamePrior = uia.snapshot(calc).tree;
    const again = calc.find({ controlType: ControlType.Button, name: 'Five' });
    again!.invoke(); // append another digit → display name changes, no control added/removed
    again!.release();
    await Bun.sleep(250);
    const renameNext = uia.snapshot(calc);
    const fullBody = renderSnapshot(pruneRefTree(renameNext.tree) ?? renameNext.tree);
    const diff = diffTrees(renamePrior, renameNext.tree);
    const refChurn = diff.appeared.some((c) => c.ref !== undefined) || diff.disappeared.some((c) => c.ref !== undefined);
    const delta = renderDiff(diff);
    console.log(`  full re-dump ~${tokens(fullBody)} tok vs delta ~${tokens(delta.text)} tok (${delta.count} lines), refChurn=${refChurn}`);
    console.log(
      `  delta:\n${delta.text
        .split('\n')
        .map((line) => `    ${line}`)
        .join('\n')}`,
    );
    assert(delta.count > 0, 'the digit press produced a non-empty delta');
    assert(!refChurn, 'a digit-into-entry-mode press is a pure display rename — no ref churn, so MCP takes the delta branch');
    assert(tokens(delta.text) * 3 < tokens(fullBody), `delta is far cheaper than the full re-dump (${tokens(delta.text)} vs ${tokens(fullBody)})`);
    assert(/Display is/.test(delta.text), 'the delta NAMES the changed display text');
    renameNext.dispose();
  } finally {
    closeWindow(calc.hWnd); // close the throwaway Calculator we launched
    calc.dispose();
    uia.uninitialize();
  }
}

syntheticPrune();
syntheticChurn();
budgetCap();
await live();
console.log('\nPASS — snapshot economy verified (prune + diff + cap, refs preserved).');
