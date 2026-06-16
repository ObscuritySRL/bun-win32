// Diff two serialized UIA trees (before/after an action) into a compact change set — the cheap
// "what changed" observation that lets an agent re-ground on the delta instead of re-reading the
// whole subtree every step. Pure logic over the minimal node shape (role + name + automationId +
// optional ref + children), so both UiaNode (uia.tree) and RefNode (snapshots) diff with no cast.
// Nodes are keyed by their structural path plus role + automationId, so a name change at a fixed
// position reads as a rename, not appear+disappear. Each path segment is the child's automationId
// when it has one (a stable identity), else its index — so inserting a sibling (e.g. a result Text)
// before a control does NOT shift the keys of automationId-bearing siblings and renumber their refs.

/** The minimal tree shape diffTrees needs — satisfied structurally by both UiaNode and RefNode. */
export interface DiffNode {
  role: string;
  name: string;
  automationId?: string;
  /** The actionable ref (RefNode only); carried into the change so the delta is directly actionable. */
  ref?: string;
  /** Inline dynamic-state suffix (RefNode only), e.g. ` (on)` — diffed so a toggle/select stays on the delta path. */
  state?: string;
  /** Whether the control is enabled — diffed so a disabled↔enabled gate flip (a wizard's Next/OK) is reported. */
  enabled?: boolean;
  children: DiffNode[];
}

export interface TreeChange {
  key: string;
  role: string;
  name: string;
  /** The after-tree node's actionable ref (appeared/renamed/restated); absent for disappeared or ref-less nodes. */
  ref?: string;
}

export interface RenameChange extends TreeChange {
  before: string;
  after: string;
}

/** A same-node change to inline dynamic state only (e.g. `(off)` → `(on)`) — the node's name/position are unchanged. */
export interface StateChange extends TreeChange {
  before: string;
  after: string;
}

export interface TreeDiff {
  appeared: TreeChange[];
  disappeared: TreeChange[];
  renamed: RenameChange[];
  restated: StateChange[];
  /** True if any ref id now denotes a DIFFERENT structural node than before — the delta's "your other refs are
   *  unchanged" invariant. Computed in the SAME flatten pass as the diff, so a caller never needs a second
   *  flatten via the standalone refsRenumbered(). */
  refsRenumbered: boolean;
}

/** Whether any ref id maps to a different node between the two already-flattened trees (the maps diffTrees builds). */
function refsRenumberedFromMaps(priors: Map<string, DiffNode>, nexts: Map<string, DiffNode>): boolean {
  const priorRefs = new Map<string, string>();
  const nextRefs = new Map<string, string>();
  for (const [key, node] of priors) if (node.ref !== undefined) priorRefs.set(key, node.ref);
  for (const [key, node] of nexts) if (node.ref !== undefined) nextRefs.set(key, node.ref);
  if (priorRefs.size !== nextRefs.size) return true;
  for (const [key, ref] of nextRefs) if (priorRefs.get(key) !== ref) return true;
  return false;
}

function flatten(node: DiffNode, path: string, into: Map<string, DiffNode>): void {
  into.set(`${path}:${node.role}:${node.automationId ?? ''}`, node);
  // Child path segment is the child's automationId when it has one (a STABLE, position- AND name-independent identity),
  // else its positional index. Anchoring on automationId stops a sibling inserted/removed before a child (the commonest
  // click outcome — a status/result Text appearing) from cascading every later child's key and falsely renumbering
  // their refs; the positional fallback keeps the prior behavior for the controls that expose no automationId (so a
  // name change at a fixed position still reads as a rename, not appear+disappear).
  for (let index = 0; index < node.children.length; index += 1) {
    const child = node.children[index]!;
    const segment = child.automationId !== undefined && child.automationId.length > 0 ? `#${child.automationId}` : `${index}`;
    flatten(child, `${path}/${segment}`, into);
  }
}

/** Compute the structural delta from `before` to `after`. */
export function diffTrees(before: DiffNode, after: DiffNode): TreeDiff {
  const priors = new Map<string, DiffNode>();
  const nexts = new Map<string, DiffNode>();
  flatten(before, '0', priors);
  flatten(after, '0', nexts);
  const appeared: TreeChange[] = [];
  const disappeared: TreeChange[] = [];
  const renamed: RenameChange[] = [];
  const restated: StateChange[] = [];
  for (const [key, node] of nexts) {
    const prior = priors.get(key);
    if (prior === undefined) appeared.push({ key, role: node.role, name: node.name, ref: node.ref });
    else if (prior.name !== node.name) renamed.push({ key, role: node.role, name: node.name, before: prior.name, after: node.name, ref: node.ref });
    else if ((prior.state ?? '') !== (node.state ?? '')) restated.push({ key, role: node.role, name: node.name, before: prior.state ?? '', after: node.state ?? '', ref: node.ref });
    else if (node.ref !== undefined && prior.enabled !== node.enabled)
      restated.push({ key, role: node.role, name: node.name, before: prior.enabled === false ? 'disabled' : 'enabled', after: node.enabled === false ? 'disabled' : 'enabled', ref: node.ref }); // a gate flip (Next/OK/Submit greying in or out)
  }
  for (const [key, node] of priors) {
    if (!nexts.has(key)) disappeared.push({ key, role: node.role, name: node.name, ref: node.ref });
  }
  return { appeared, disappeared, renamed, restated, refsRenumbered: refsRenumberedFromMaps(priors, nexts) };
}

/** True if any ref id now denotes a DIFFERENT structural node than in `before` — the real invariant behind a delta's
 *  "your other refs are unchanged" promise. Catches what an appeared/disappeared check misses: a node flipping
 *  ref-eligibility (e.g. a Custom gaining/losing its name) shifts every later ref number while diffTrees reports it as
 *  a pure rename. Keyed by path + role + automationId (name-independent), so a value/name change alone is NOT churn. */
export function refsRenumbered(before: DiffNode, after: DiffNode): boolean {
  const priors = new Map<string, DiffNode>();
  const nexts = new Map<string, DiffNode>();
  flatten(before, '0', priors);
  flatten(after, '0', nexts);
  return refsRenumberedFromMaps(priors, nexts);
}

/**
 * Render a TreeDiff as compact `+`/`-`/`~` delta lines — the token-cheap per-step observation. Drops
 * ref-less unnamed structural churn (it carries no actionable signal); appeared/renamed lines keep
 * their `[ref=eN]` so the agent can act on the change without a full re-dump. Returns the rendered
 * text and the kept-line count (the caller decides whether the delta is small enough to send).
 */
export function renderDiff(diff: TreeDiff): { text: string; count: number } {
  const lines: string[] = [];
  for (const change of diff.appeared) {
    if (change.ref === undefined && change.name.trim().length === 0) continue;
    lines.push(`+ ${change.role}${change.name.trim().length > 0 ? ` ${JSON.stringify(change.name)}` : ''}${change.ref !== undefined ? ` [ref=${change.ref}]` : ''}`);
  }
  for (const change of diff.renamed) lines.push(`~ ${change.role} ${JSON.stringify(change.before)} → ${JSON.stringify(change.after)}${change.ref !== undefined ? ` [ref=${change.ref}]` : ''}`);
  for (const change of diff.restated)
    lines.push(`~ ${change.role}${change.name.trim().length > 0 ? ` ${JSON.stringify(change.name)}` : ''}${change.ref !== undefined ? ` [ref=${change.ref}]` : ''} ${change.before.trim() || '(—)'} → ${change.after.trim() || '(—)'}`);
  for (const change of diff.disappeared) {
    if (change.name.trim().length === 0) continue;
    lines.push(`- ${change.role} ${JSON.stringify(change.name)}`);
  }
  return { text: lines.join('\n'), count: lines.length };
}
