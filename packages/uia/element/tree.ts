// Agent grounding: serialize a window's accessibility subtree to compact JSON for an LLM — ground-truth
// element identity + bounds, no pixel-counting. The walk navigates each parent's children via the cached
// control-view walker's *BuildCache methods (one node marshaled per step, WITH its cache), stopping at a
// maxNodes budget — so a dense flat/wide tree costs O(maxNodes), NOT the whole-subtree BuildUpdatedCache that
// walled ~7s (the marshal cost is sibling navigation, not depth — maxDepth alone could not bound it). The
// agent profile prunes to interactive + named controls (fewer tokens) the way Microsoft UFO2 grounds agents.

import { AutomationElementMode, type CacheRequest, createCacheRequest } from '../com/cache';
import { ControlType, TreeScope } from '../com/constants';
import type { Element } from './element';
import type { Rect } from '../com/reads';

export interface UiaNode {
  role: string;
  name: string;
  automationId?: string;
  className?: string;
  bounds?: Rect;
  enabled?: boolean;
  /** Set when the maxNodes budget was exhausted while this node still had unwalked children — surfaced as a
   *  `truncated` marker so the agent knows the tree was CUT (raise maxNodes), not that the children vanished. */
  truncated?: boolean;
  children: UiaNode[];
}

export interface SerializeOptions {
  /** Maximum tree depth (default 40). */
  maxDepth?: number;
  /** Cap TOTAL nodes walked (default 1500, matching the snapshot budget). The lever for a dense window with
   *  thousands of sibling controls — the per-parent BuildCache walk stops at the budget instead of marshaling
   *  the whole subtree, and sets `truncated` on the cut node. maxDepth canNOT bound a flat/wide tree. */
  maxNodes?: number;
  /** Prune to interactive/named controls — the compact profile to hand an LLM agent. */
  agentProfile?: boolean;
}

const INTERACTIVE = new Set<number>([
  ControlType.Button,
  ControlType.CheckBox,
  ControlType.ComboBox,
  ControlType.DataItem,
  ControlType.Document,
  ControlType.Edit,
  ControlType.Header,
  ControlType.HeaderItem,
  ControlType.Hyperlink,
  ControlType.ListItem,
  ControlType.MenuItem,
  ControlType.RadioButton,
  ControlType.Slider,
  ControlType.Spinner,
  ControlType.SplitButton,
  ControlType.Tab,
  ControlType.TabItem,
  ControlType.TreeItem,
]);

/** A shared per-serialize node budget: `remaining` decrements on every materialized node, `truncated` flips true the
 *  first time a parent's children are cut short. Mirrors refmap.ts's / jab.ts's walk() budget. */
type Budget = { remaining: number; truncated: boolean };

function walk(element: Element, options: SerializeOptions, maxDepth: number, depth: number, request: CacheRequest, budget: Budget): UiaNode | null {
  const controlType = element.cachedControlType;
  const node: UiaNode = {
    role: ControlType[controlType] ?? `Type(${controlType})`,
    name: element.cachedName,
    children: [],
  };
  const automationId = element.cachedAutomationId;
  if (automationId.length > 0) node.automationId = automationId;
  const className = element.cachedClassName;
  if (className.length > 0) node.className = className;
  const bounds = element.cachedBoundingRectangle;
  if (bounds.width !== 0 || bounds.height !== 0) node.bounds = bounds;
  node.enabled = element.cachedIsEnabled;

  // Per-PARENT, budget-aware enumeration via the cached control-view walker's BuildCache child/sibling navigation —
  // each step marshals ONE node WITH its cache, and STOPS at maxNodes, so a dense flat panel costs O(maxNodes)
  // cross-process navigations instead of the whole-subtree BuildUpdatedCache(Subtree) that walls ~7s on a flat tree.
  if (depth < maxDepth) {
    let child = element.firstChildCached(request);
    while (child !== null) {
      if (budget.remaining <= 0) {
        budget.truncated = true;
        node.truncated = true; // this parent had at least one more child than the budget allowed
        child.release();
        break;
      }
      budget.remaining -= 1;
      const childNode = walk(child, options, maxDepth, depth + 1, request, budget);
      const next = child.nextSiblingCached(request);
      child.release();
      if (childNode !== null) node.children.push(childNode);
      child = next;
    }
  }

  if (options.agentProfile && !node.truncated && node.children.length === 0 && node.name.trim().length === 0 && !INTERACTIVE.has(controlType)) return null;
  return node;
}

/** Serialize an element's subtree to a JSON-able tree. The walk navigates child→sibling via the control-view
 *  walker's *BuildCache methods (one marshal per node), stopping at maxNodes — NOT a whole-subtree round-trip. */
export function serialize(element: Element, options: SerializeOptions = {}): UiaNode {
  const maxDepth = options.maxDepth ?? 40;
  // ELEMENT-scoped cache (NOT Subtree): each firstChildCached/nextSiblingCached step marshals ONE node with its
  // cache, so the budget bounds the cross-process cost. TreeScope_Subtree forced the WHOLE subtree to marshal up
  // front — ~7s on a 2000-sibling flat panel, and maxDepth could not bound it (the cost is sibling navigation).
  // Full mode (not None): the control-view walker's *BuildCache navigation needs a LIVE reference to step from —
  // a None-mode (cache-only) element returns null on firstChildCached, dropping the whole tree.
  const request = createCacheRequest(undefined, TreeScope.TreeScope_Element, AutomationElementMode.Full);
  const cached = element.buildUpdatedCache(request);
  const budget: Budget = { remaining: options.maxNodes ?? 1500, truncated: false };
  try {
    return walk(cached, options, maxDepth, 0, request, budget) ?? { role: 'Pane', name: '', children: [] };
  } finally {
    request.release();
    if (cached.ptr !== element.ptr) cached.release();
  }
}

/** Count the nodes in a serialized tree (for benchmarks / agent-grounding stats). */
export function countNodes(node: UiaNode): number {
  let total = 1;
  for (const child of node.children) total += countNodes(child);
  return total;
}

/** Rough token estimate of the JSON form (~4 chars/token) — what an agent pays per grounding step. */
export function estimateTokens(node: UiaNode): number {
  return Math.ceil(JSON.stringify(node).length / 4);
}
