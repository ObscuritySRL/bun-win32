// A Snapshot: one cached round-trip over a window's subtree that assigns per-snapshot ref ids
// ('e1', 'e2', …) to the interactable elements and KEEPS each live Element, so an agent can act on
// "ref e12" without re-finding it — the desktop analog of Playwright-MCP's [ref=eN] grounding. Refs
// are valid until dispose(); re-snapshot after any action that changes the tree. Every Element
// materialized by the walk is owned and released on dispose (the source window is NOT touched).

import { AutomationElementMode, createCacheRequest, DEFAULT_CACHE_PROPERTIES } from './cache';
import { ControlType, PropertyId, TreeScope } from './constants';
import { Element } from './element';
import { getCachedPropertyValue, getPropertyValue, type Rect, type VariantValue } from './reads';

const INTERACTIVE = new Set<number>([
  ControlType.Button,
  ControlType.CheckBox,
  ControlType.ComboBox,
  ControlType.DataGrid,
  ControlType.DataItem,
  ControlType.Document,
  ControlType.Edit,
  ControlType.Header,
  ControlType.HeaderItem,
  ControlType.Hyperlink,
  ControlType.List,
  ControlType.ListItem,
  ControlType.MenuItem,
  ControlType.RadioButton,
  ControlType.Slider,
  ControlType.Spinner,
  ControlType.SplitButton,
  ControlType.Tab,
  ControlType.TabItem,
  ControlType.Table,
  ControlType.Tree,
  ControlType.TreeItem,
]);

/** Whether a control should get an actionable [ref] — the interactive set plus a named Custom (WPF/WinUI
 *  custom-draw invokables surface as Custom; gate on a name + bounds so non-interactive Customs stay unlabeled). */
function isActionable(controlType: number, name: string, hasBounds: boolean): boolean {
  if (!hasBounds) return false;
  return INTERACTIVE.has(controlType) || (controlType === ControlType.Custom && name.trim().length > 0);
}

/** Pattern-state property ids the snapshot prefetches so every ref'd node's live state rides the SAME single
 *  BuildUpdatedCache round-trip (each value paired with its Is*PatternAvailable gate). */
const STATE_PROPERTIES: readonly number[] = [
  PropertyId.IsPassword,
  PropertyId.IsTogglePatternAvailable,
  PropertyId.ToggleToggleState,
  PropertyId.IsValuePatternAvailable,
  PropertyId.ValueValue,
  PropertyId.IsExpandCollapsePatternAvailable,
  PropertyId.ExpandCollapseExpandCollapseState,
  PropertyId.IsSelectionItemPatternAvailable,
  PropertyId.SelectionItemIsSelected,
  PropertyId.IsRangeValuePatternAvailable,
  PropertyId.RangeValueValue,
  PropertyId.RangeValueMinimum,
  PropertyId.RangeValueMaximum,
];

const TOGGLE_LABELS = ['off', 'on', 'mixed']; // ToggleState 0/1/2
const EXPAND_LABELS = ['collapsed', 'expanded', 'partial']; // ExpandCollapseState 0/1/2 (3 = leaf → not shown)

type PropertyReader = (ptr: bigint, propertyId: number) => VariantValue;

/** The inline dynamic-state suffix for a ref'd node: `(on)`/`(off)`, `(value="…")`, `(expanded)`/`(collapsed)`,
 *  `(selected)`, `(NN%)`. Each is gated on its Is*PatternAvailable so a control that does not support a pattern
 *  never shows that pattern's default value (unsupported state returns a default, NOT empty — verified). `read`
 *  is getCachedPropertyValue on the cached fast path (zero round-trips) or getPropertyValue on the live fallback.
 *  Returns '' when no state applies. */
function nodeState(read: PropertyReader, ptr: bigint, name: string): string {
  const parts: string[] = [];
  if (read(ptr, PropertyId.IsTogglePatternAvailable) === true) {
    const state = read(ptr, PropertyId.ToggleToggleState);
    if (typeof state === 'number' && state >= 0 && state <= 2) parts.push(TOGGLE_LABELS[state]!);
  }
  if (read(ptr, PropertyId.IsPassword) === true) {
    parts.push('password'); // NEVER emit a password/secret field's value into the snapshot (model context + host audit logs)
  } else if (read(ptr, PropertyId.IsValuePatternAvailable) === true) {
    const value = read(ptr, PropertyId.ValueValue);
    if (typeof value === 'string' && value.length > 0 && value !== name) parts.push(`value=${JSON.stringify(value.length > 40 ? `${value.slice(0, 40)}…` : value)}`); // skip when value just echoes the name (e.g. nav TreeItems)
  }
  if (read(ptr, PropertyId.IsExpandCollapsePatternAvailable) === true) {
    const state = read(ptr, PropertyId.ExpandCollapseExpandCollapseState);
    if (typeof state === 'number' && state >= 0 && state <= 2) parts.push(EXPAND_LABELS[state]!);
  }
  if (read(ptr, PropertyId.IsSelectionItemPatternAvailable) === true && read(ptr, PropertyId.SelectionItemIsSelected) === true) parts.push('selected');
  if (read(ptr, PropertyId.IsRangeValuePatternAvailable) === true) {
    const value = read(ptr, PropertyId.RangeValueValue);
    if (typeof value === 'number') {
      const min = read(ptr, PropertyId.RangeValueMinimum);
      const max = read(ptr, PropertyId.RangeValueMaximum);
      parts.push(typeof min === 'number' && typeof max === 'number' && max > min ? `${Math.round(((value - min) / (max - min)) * 100)}%` : `value=${value}`);
    }
  }
  return parts.length > 0 ? ` (${parts.join(', ')})` : '';
}

/** Cached-read state suffix (fast path; rides the single BuildUpdatedCache round-trip, zero further reads). */
function cachedState(ptr: bigint, name: string): string {
  return nodeState(getCachedPropertyValue, ptr, name);
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
  /** Inline dynamic-state suffix on a ref'd node, e.g. ` (on)` / ` (value="…")` / ` (42%)`. */
  state?: string;
  children: RefNode[];
}

function walk(element: Element, depth: number, maxDepth: number, counter: { value: number }, byRef: Map<string, Element>, owned: Element[], marks: Mark[]): RefNode {
  // The caller owns `element` (snapshot pushed the root clone; a parent frame pushed each child before recursing).
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
    const state = cachedState(element.ptr, name);
    if (state.length > 0) node.state = state;
  }
  if (depth < maxDepth) {
    const children = element.cachedChildren;
    for (const child of children) owned.push(child); // own EVERY child up front so a fault mid-recursion cannot leak the not-yet-walked siblings
    for (const child of children) node.children.push(walk(child, depth + 1, maxDepth, counter, byRef, owned, marks));
  }
  return node;
}

/** The LIVE fallback walk for a provider that refuses the one-shot Subtree+Full cache (e.g. Opera and other
 *  heavy cross-process Chromium top-levels, whose BuildUpdatedCache(Subtree, Full) fails — verified live; the
 *  cached walk would then drop the entire native tree). It reads each node's properties LIVE (GetCurrent*, a few
 *  cross-process round-trips per node) and navigates the live control view, recovering that tree with real,
 *  actionable Element pointers. Slower than walk() (N round-trips, not one), so it is a fallback, not the default.
 *  The CALLER owns `element` (the window / an extra root — not pushed to `owned`); every descendant this walk
 *  materializes is pushed to `owned` BEFORE recursing, so dispose() releases exactly what the snapshot created
 *  and a fault mid-recursion cannot orphan the not-yet-walked siblings. */
function walkLive(element: Element, depth: number, maxDepth: number, counter: { value: number }, byRef: Map<string, Element>, owned: Element[], marks: Mark[]): RefNode {
  // The caller owns `element` (the window / extra root, or a child a parent frame pushed before recursing).
  const controlType = element.controlType;
  const name = element.name;
  const bounds = element.boundingRectangle;
  const node: RefNode = { role: ControlType[controlType] ?? `Type(${controlType})`, name, children: [] };
  const automationId = element.automationId;
  if (automationId.length > 0) node.automationId = automationId;
  const hasBounds = bounds.width !== 0 || bounds.height !== 0;
  if (hasBounds) node.bounds = bounds;
  node.enabled = element.isEnabled;
  if (isActionable(controlType, name, hasBounds)) {
    const ref = `e${counter.value}`;
    counter.value += 1;
    node.ref = ref;
    byRef.set(ref, element);
    marks.push({ ref, role: node.role, name, bounds });
    const state = nodeState(getPropertyValue, element.ptr, name);
    if (state.length > 0) node.state = state;
  }
  if (depth < maxDepth) {
    const children = element.children;
    for (const child of children) owned.push(child); // own EVERY child up front so a fault mid-recursion cannot leak the not-yet-walked siblings
    for (const child of children) node.children.push(walkLive(child, depth + 1, maxDepth, counter, byRef, owned, marks));
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
    if (this.#disposed) return null; // a dangling-disposed snapshot fails safe rather than vcall-ing freed COM pointers
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

/**
 * Build a ref-keyed Snapshot of a window's subtree in one cached round-trip. `extraRoots` are additional
 * fragment roots whose subtrees are appended under the main tree's root — used to splice in the web/editor DOM
 * of a Chromium/Electron window (its `Chrome_RenderWidgetHostHWND` children, which the top-level walk does not
 * bridge). Each extra root is cached independently; a transient one (mid-navigation / empty) is skipped. If a
 * provider refuses the one-shot Subtree+Full cache (heavy cross-process Chromium like Opera — verified live),
 * the main tree (and any such extra root) is recovered via a LIVE walk instead of dropped, so the native browser
 * chrome stays visible and actionable; pass `live: true` to force that path for a known cache-hostile provider.
 * The caller disposes the Snapshot (and owns the `extraRoots` Elements it passed in). */
export function snapshot(window: Element, options: { maxDepth?: number; extraRoots?: readonly Element[]; live?: boolean } = {}): Snapshot {
  const maxDepth = options.maxDepth ?? 40;
  const request = createCacheRequest([...DEFAULT_CACHE_PROPERTIES, ...STATE_PROPERTIES], TreeScope.TreeScope_Subtree, AutomationElementMode.Full);
  // Heavy cross-process Chromium top-levels (e.g. Opera) deterministically FAIL BuildUpdatedCache(Subtree, Full)
  // while still serving live reads + navigation. Default: try the one-shot cache; on failure fall back to the
  // live walk so the native tree (browser chrome: tabs / address bar / URL) is recovered instead of dropped.
  // `live: true` skips the cache attempt for a provider already known to be cache-hostile.
  const useLive = options.live === true;
  const cached = useLive ? window : window.buildUpdatedCache(request);
  const mainOk = !useLive && cached.ptr !== window.ptr;
  const byRef = new Map<string, Element>();
  const owned: Element[] = [];
  const marks: Mark[] = [];
  const counter = { value: 1 };
  try {
    if (mainOk) owned.push(cached); // snapshot owns the cached clone; walkLive's root is the caller's window (not owned)
    const tree = mainOk ? walk(cached, 0, maxDepth, counter, byRef, owned, marks) : walkLive(window, 0, maxDepth, counter, byRef, owned, marks);
    for (const extra of options.extraRoots ?? []) {
      try {
        const cachedExtra = extra.buildUpdatedCache(request);
        if (cachedExtra.ptr !== extra.ptr) owned.push(cachedExtra); // snapshot owns the cached clone; the live path's root is the caller's extra (not owned)
        const subtree = cachedExtra.ptr !== extra.ptr ? walk(cachedExtra, 1, maxDepth, counter, byRef, owned, marks) : walkLive(extra, 1, maxDepth, counter, byRef, owned, marks); // a render widget that refuses the cache still walks live
        if (subtree.children.length > 0 || subtree.ref !== undefined) tree.children.push(subtree); // skip an empty render widget
      } catch {
        // a render widget can be mid-navigation — its absence must not fail the whole snapshot
      }
    }
    return new Snapshot(tree, marks, byRef, owned);
  } catch (error) {
    for (const element of owned) element.release(); // owned = every node snapshot materialized (the cached clones it pushed + all children pushed before recursion); window / extraRoots stay caller-owned
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
  let out = `${indent}- ${node.role}${label}${ref}${id}${node.state ?? ''}`;
  for (const child of node.children) out += `\n${renderSnapshot(child, depth + 1)}`;
  return out;
}

// Interactive control roles (by name) — the keep-set for pruning, derived from the ref-assigning set so
// the two never drift. An interactive node is kept even when unnamed/ref-less (e.g. an icon-only Button).
const INTERACTIVE_ROLES = new Set<string>([...INTERACTIVE].map((controlType) => ControlType[controlType]).filter((role): role is string => role !== undefined));

/**
 * Prune ref-less structural noise from a snapshot tree before rendering — the single highest-leverage
 * token win, since the rendered tree is auto-appended after every MCP action. Bottom-up: drop a node
 * that has no ref, an empty name, no surviving children, and a non-interactive role; collapse an
 * unnamed ref-less single-child Pane/Group/Custom into that child. EVERY `[ref]` node and EVERY named
 * node is kept, so no actionable target is ever lost (the ref→Element map is untouched regardless).
 * Returns null when the whole node prunes away.
 */
export function pruneRefTree(node: RefNode): RefNode | null {
  const children: RefNode[] = [];
  for (const child of node.children) {
    const kept = pruneRefTree(child);
    if (kept !== null) children.push(kept);
  }
  const unlabeled = node.ref === undefined && node.name.trim().length === 0;
  if (unlabeled && children.length === 0 && !INTERACTIVE_ROLES.has(node.role)) return null;
  if (unlabeled && children.length === 1 && (node.role === 'Custom' || node.role === 'Group' || node.role === 'Pane')) return children[0]!;
  const pruned: RefNode = { role: node.role, name: node.name, children };
  if (node.ref !== undefined) pruned.ref = node.ref;
  if (node.automationId !== undefined) pruned.automationId = node.automationId;
  if (node.bounds !== undefined) pruned.bounds = node.bounds;
  if (node.enabled !== undefined) pruned.enabled = node.enabled;
  if (node.state !== undefined) pruned.state = node.state;
  return pruned;
}

/** Cap a rendered snapshot to `maxChars` on line boundaries, appending a "…(K more nodes)" trailer — the
 *  hard size budget so a heavy window (IDE/browser/file-manager) cannot dump unbounded tokens per step. */
export function capSnapshot(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const lines = text.split('\n');
  const kept: string[] = [];
  let length = 0;
  for (const line of lines) {
    if (length + line.length + 1 > maxChars) break;
    kept.push(line);
    length += line.length + 1;
  }
  return `${kept.join('\n')}\n…(${lines.length - kept.length} more nodes — narrow with desktop_snapshot {maxDepth} or {root:"<a node name above>"})`;
}

/** A recovery note for a whole-window snapshot that found NO actionable controls. UWP/WinUI and Chromium build
 *  their UIA/a11y tree on demand and tear it down when idle, so a just-attached or long-idle window can read
 *  empty on the first snapshot; a genuinely tree-less surface (game/canvas/custom-draw) also reads empty. The
 *  note tells the agent how to recover rather than give up. Empty string when there ARE controls. */
export function coldTreeNote(markCount: number, minimized = false): string {
  if (markCount > 0) return '';
  if (minimized)
    return '\n\n(0 actionable controls AND this window is MINIMIZED — a UWP/WinUI window tears its UIA tree down while minimized, so re-snapshotting alone will NOT repopulate it. Restore it CURSOR-FREE with manage_window {action:"restore"} (SW_RESTORE — no focus theft, no foregrounding), then desktop_snapshot. If it is still empty after restoring, it may be a game / canvas / custom-draw surface — use ocr / screen_capture / inspect_point.)';
  return '\n\n(0 actionable controls — if this window has visible UI its UIA tree may be COLD: UWP/WinUI and Chromium build it on demand and tear it down when idle, so call desktop_snapshot again to build it (or briefly activate the window). If it is a game / canvas / custom-draw surface with no accessibility, use ocr / screen_capture / inspect_point for the pixels.)';
}
