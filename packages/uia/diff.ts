// Diff two serialized UIA trees (before/after an action) into a compact change set — the cheap
// "what changed" observation that lets an agent re-ground on the delta instead of re-reading the
// whole subtree every step. Pure logic over the minimal node shape (role + name + automationId +
// optional ref + children), so both UiaNode (uia.tree) and RefNode (snapshots) diff with no cast.
// Nodes are keyed by their structural path plus role + automationId, so a name change at a fixed
// position reads as a rename, not appear+disappear.

/** The minimal tree shape diffTrees needs — satisfied structurally by both UiaNode and RefNode. */
export interface DiffNode {
  role: string;
  name: string;
  automationId?: string;
  /** The actionable ref (RefNode only); carried into the change so the delta is directly actionable. */
  ref?: string;
  /** Inline dynamic-state suffix (RefNode only), e.g. ` (on)` — diffed so a toggle/select stays on the delta path. */
  state?: string;
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
}

function flatten(node: DiffNode, path: string, into: Map<string, DiffNode>): void {
  into.set(`${path}:${node.role}:${node.automationId ?? ''}`, node);
  for (let index = 0; index < node.children.length; index += 1) flatten(node.children[index]!, `${path}/${index}`, into);
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
  }
  for (const [key, node] of priors) {
    if (!nexts.has(key)) disappeared.push({ key, role: node.role, name: node.name, ref: node.ref });
  }
  return { appeared, disappeared, renamed, restated };
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
