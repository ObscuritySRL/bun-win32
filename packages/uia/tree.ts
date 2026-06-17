// Agent grounding: serialize a window's accessibility subtree to compact JSON for an LLM — ground-truth
// element identity + bounds, no pixel-counting. One BuildUpdatedCache round-trip prefetches the whole
// subtree; the recursion then reads cached children/properties in-process. The agent profile prunes to
// interactive + named controls (fewer tokens) the way Microsoft UFO2 grounds desktop agents.

import { AutomationElementMode, createCacheRequest } from './cache';
import { ControlType, TreeScope } from './constants';
import type { Element } from './element';
import type { Rect } from './reads';

export interface UiaNode {
  role: string;
  name: string;
  automationId?: string;
  className?: string;
  bounds?: Rect;
  enabled?: boolean;
  children: UiaNode[];
}

export interface SerializeOptions {
  /** Maximum tree depth (default 40). */
  maxDepth?: number;
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

function walk(element: Element, options: SerializeOptions, maxDepth: number, depth: number): UiaNode | null {
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

  if (depth < maxDepth) {
    for (const child of element.cachedChildren) {
      const childNode = walk(child, options, maxDepth, depth + 1);
      child.release();
      if (childNode !== null) node.children.push(childNode);
    }
  }

  if (options.agentProfile && node.children.length === 0 && node.name.trim().length === 0 && !INTERACTIVE.has(controlType)) return null;
  return node;
}

/** Serialize an element's subtree to a JSON-able tree. Build once via a single cached round-trip. */
export function serialize(element: Element, options: SerializeOptions = {}): UiaNode {
  const maxDepth = options.maxDepth ?? 40;
  const request = createCacheRequest(undefined, TreeScope.TreeScope_Subtree, AutomationElementMode.None);
  const cached = element.buildUpdatedCache(request);
  try {
    return walk(cached, options, maxDepth, 0) ?? { role: 'Pane', name: '', children: [] };
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
