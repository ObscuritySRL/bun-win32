// A Snapshot: one cached round-trip over a window's subtree that assigns per-snapshot ref ids
// ('e1', 'e2', …) to the interactable elements and KEEPS each live Element, so an agent can act on
// "ref e12" without re-finding it — the desktop analog of Playwright-MCP's [ref=eN] grounding. Refs
// are valid until dispose(); re-snapshot after any action that changes the tree. Every Element
// materialized by the walk is owned and released on dispose (the source window is NOT touched).

import { AutomationElementMode, createCacheRequest } from './cache';
import { ControlType, TreeScope } from './constants';
import { Element } from './element';
import type { Rect } from './reads';

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

/** Whether a control should get an actionable [ref] — the interactive set plus a named Custom (WPF/WinUI
 *  custom-draw invokables surface as Custom; gate on a name + bounds so non-interactive Customs stay unlabeled). */
function isActionable(controlType: number, name: string, hasBounds: boolean): boolean {
  if (!hasBounds) return false;
  return INTERACTIVE.has(controlType) || (controlType === ControlType.Custom && name.trim().length > 0);
}

export interface Mark {
  ref: string;
  role: string;
  name: string;
  bounds: Rect;
}

export interface RefNode {
  /** Present only on interactable nodes — the handle an agent acts on. */
  ref?: string;
  role: string;
  name: string;
  automationId?: string;
  bounds?: Rect;
  enabled?: boolean;
  children: RefNode[];
}

function walk(element: Element, depth: number, maxDepth: number, counter: { value: number }, byRef: Map<string, Element>, owned: Element[], marks: Mark[]): RefNode {
  owned.push(element);
  const controlType = element.cachedControlType;
  const name = element.cachedName;
  const bounds = element.cachedBoundingRectangle;
  const node: RefNode = { role: ControlType[controlType] ?? `Type(${controlType})`, name, children: [] };
  const automationId = element.cachedAutomationId;
  if (automationId.length > 0) node.automationId = automationId;
  const hasBounds = bounds.width !== 0 || bounds.height !== 0;
  if (hasBounds) node.bounds = bounds;
  node.enabled = element.cachedIsEnabled;
  if (isActionable(controlType, name, hasBounds)) {
    const ref = `e${counter.value}`;
    counter.value += 1;
    node.ref = ref;
    byRef.set(ref, element);
    marks.push({ ref, role: node.role, name, bounds });
  }
  if (depth < maxDepth) {
    for (const child of element.cachedChildren) node.children.push(walk(child, depth + 1, maxDepth, counter, byRef, owned, marks));
  }
  return node;
}

export class Snapshot {
  readonly tree: RefNode;
  readonly marks: readonly Mark[];
  readonly #byRef: Map<string, Element>;
  readonly #owned: readonly Element[];
  #disposed = false;

  constructor(tree: RefNode, marks: Mark[], byRef: Map<string, Element>, owned: Element[]) {
    this.tree = tree;
    this.marks = marks;
    this.#byRef = byRef;
    this.#owned = owned;
  }

  /** The live Element for a ref id from this snapshot, or null if the ref is unknown/stale. */
  resolve(ref: string): Element | null {
    return this.#byRef.get(ref) ?? null;
  }

  /** Release every Element this snapshot owns. The source window is unaffected. */
  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    for (const element of this.#owned) element.release();
  }

  [Symbol.dispose](): void {
    this.dispose();
  }
}

/** Build a ref-keyed Snapshot of a window's subtree in one cached round-trip. The caller disposes it. */
export function snapshot(window: Element, options: { maxDepth?: number } = {}): Snapshot {
  const maxDepth = options.maxDepth ?? 40;
  const request = createCacheRequest(undefined, TreeScope.TreeScope_Subtree, AutomationElementMode.Full);
  const cached = window.buildUpdatedCache(request);
  const byRef = new Map<string, Element>();
  const owned: Element[] = [];
  const marks: Mark[] = [];
  try {
    if (cached.ptr === window.ptr) throw new Error('snapshot: BuildUpdatedCache failed (no cached clone)');
    const tree = walk(cached, 0, maxDepth, { value: 1 }, byRef, owned, marks);
    return new Snapshot(tree, marks, byRef, owned);
  } catch (error) {
    for (const element of owned) element.release();
    if (cached.ptr !== window.ptr) cached.release();
    throw error;
  } finally {
    request.release();
  }
}

/** Render a ref-keyed tree to compact, token-economical text (the Playwright-MCP snapshot analog). */
export function renderSnapshot(node: RefNode, depth = 0): string {
  const indent = '  '.repeat(depth);
  const label = node.name.trim().length > 0 ? ` ${JSON.stringify(node.name)}` : '';
  const ref = node.ref !== undefined ? ` [ref=${node.ref}]` : '';
  const id = node.automationId !== undefined ? ` id=${node.automationId}` : '';
  let out = `${indent}- ${node.role}${label}${ref}${id}`;
  for (const child of node.children) out += `\n${renderSnapshot(child, depth + 1)}`;
  return out;
}
