// Diff two serialized UIA trees (before/after an action) into a compact change set — the cheap
// "what changed" observation that lets an agent re-ground on the delta instead of re-reading the
// whole subtree every step. Pure logic over UiaNode; nodes are keyed by their structural path plus
// role + automationId, so a name change at a fixed position reads as a rename, not appear+disappear.

import type { UiaNode } from './tree';

export interface TreeChange {
  key: string;
  role: string;
  name: string;
}

export interface RenameChange extends TreeChange {
  before: string;
  after: string;
}

export interface TreeDiff {
  appeared: TreeChange[];
  disappeared: TreeChange[];
  renamed: RenameChange[];
}

function flatten(node: UiaNode, path: string, into: Map<string, UiaNode>): void {
  into.set(`${path}:${node.role}:${node.automationId ?? ''}`, node);
  for (let index = 0; index < node.children.length; index += 1) flatten(node.children[index]!, `${path}/${index}`, into);
}

/** Compute the structural delta from `before` to `after`. */
export function diffTrees(before: UiaNode, after: UiaNode): TreeDiff {
  const priors = new Map<string, UiaNode>();
  const nexts = new Map<string, UiaNode>();
  flatten(before, '0', priors);
  flatten(after, '0', nexts);
  const appeared: TreeChange[] = [];
  const disappeared: TreeChange[] = [];
  const renamed: RenameChange[] = [];
  for (const [key, node] of nexts) {
    const prior = priors.get(key);
    if (prior === undefined) appeared.push({ key, role: node.role, name: node.name });
    else if (prior.name !== node.name) renamed.push({ key, role: node.role, name: node.name, before: prior.name, after: node.name });
  }
  for (const [key, node] of priors) {
    if (!nexts.has(key)) disappeared.push({ key, role: node.role, name: node.name });
  }
  return { appeared, disappeared, renamed };
}
