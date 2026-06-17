// A Snapshot: one cached round-trip over a window's subtree that assigns per-snapshot ref ids
// ('e1', 'e2', …) to the interactable elements and KEEPS each live Element, so an agent can act on
// "ref e12" without re-finding it — the desktop analog of Playwright-MCP's [ref=eN] grounding. Refs
// are valid until dispose(); re-snapshot after any action that changes the tree. Every Element
// materialized by the walk is owned and released on dispose (the source window is NOT touched).

import { AutomationElementMode, type CacheRequest, createCacheRequest, DEFAULT_CACHE_PROPERTIES } from './cache';
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
  // A curated interactive-role control is actionable via its UIA pattern with NO coordinate, so it earns a ref even at
  // 0×0 bounds — e.g. a WinUI Settings ToggleSwitch in a collapsed card reads boundingRectangle {0,0,0,0} yet
  // TogglePattern.Toggle drives it cursor-free; the old `if (!hasBounds) return false` dropped it before this check,
  // making a whole class of switches unreachable by ref. The bounds gate now constrains ONLY the Custom heuristic.
  if (INTERACTIVE.has(controlType)) return true;
  return hasBounds && controlType === ControlType.Custom && name.trim().length > 0;
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
  PropertyId.IsScrollPatternAvailable,
  PropertyId.ScrollVerticallyScrollable,
  PropertyId.ScrollVerticalScrollPercent,
  PropertyId.ScrollHorizontallyScrollable,
  PropertyId.ScrollHorizontalScrollPercent,
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
  // Scroll position so the agent knows when content is off the fold (and to reach for reveal/scroll). Gated on
  // IsScrollPatternAvailable — one extra cached read for a non-container, the axis reads only for a scroll container.
  if (read(ptr, PropertyId.IsScrollPatternAvailable) === true) {
    if (read(ptr, PropertyId.ScrollVerticallyScrollable) === true) {
      const percent = read(ptr, PropertyId.ScrollVerticalScrollPercent);
      if (typeof percent === 'number' && percent >= 0) parts.push(percent < 99.5 ? `scroll ${Math.round(percent)}% — more below` : 'scroll 100% (end)');
    }
    if (read(ptr, PropertyId.ScrollHorizontallyScrollable) === true) {
      const percent = read(ptr, PropertyId.ScrollHorizontalScrollPercent);
      if (typeof percent === 'number' && percent >= 0) parts.push(percent < 99.5 ? `scroll-x ${Math.round(percent)}% — more right` : 'scroll-x 100% (right end)');
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
  /** Set when the maxNodes budget was exhausted while this node still had unwalked children — surfaced in the render
   *  as `(… N children omitted — raise maxNodes)` so the agent knows the tree was cut, not that the children vanished. */
  truncated?: boolean;
  children: RefNode[];
}

/** A shared per-snapshot node budget threaded through both walks: `remaining` decrements on every materialized node,
 *  `truncated` flips true the first time a parent's children are cut short. Mirrors jab.ts's walk() budget. */
type Budget = { remaining: number; truncated: boolean };

function walk(element: Element, depth: number, maxDepth: number, request: CacheRequest, budget: Budget, counter: { value: number }, byRef: Map<string, Element>, owned: Element[], marks: Mark[]): RefNode {
  // The caller owns `element` (snapshot pushed the root clone; a parent frame pushed each child before recursing).
  // `element` arrives carrying request's Full cache — from the window's TreeScope_Element BuildUpdatedCache for the
  // root, or from a prior firstChildCached/nextSiblingCached BuildCache navigation for every descendant.
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
  // Per-PARENT, budget-aware enumeration via the cached control-view walker's BuildCache child/sibling navigation —
  // each step marshals ONE node WITH its Full cache, and STOPS at maxNodes, so a dense 3000-sibling panel costs
  // O(maxNodes) cross-process navigations instead of the whole-subtree BuildUpdatedCache(Subtree) that walls ~7s on a
  // flat tree (the marshal cost is the sibling navigation, not depth — so the old maxDepth cap could not bound it).
  if (depth < maxDepth) {
    let child = element.firstChildCached(request);
    while (child !== null) {
      owned.push(child); // own each child the instant it is materialized so a fault mid-walk cannot leak it
      if (budget.remaining <= 0) {
        budget.truncated = true;
        node.truncated = true; // this parent had at least one more child than the budget allowed
        break;
      }
      budget.remaining -= 1;
      node.children.push(walk(child, depth + 1, maxDepth, request, budget, counter, byRef, owned, marks));
      child = child.nextSiblingCached(request);
    }
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
function walkLive(element: Element, depth: number, maxDepth: number, budget: Budget, counter: { value: number }, byRef: Map<string, Element>, owned: Element[], marks: Mark[]): RefNode {
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
    for (const child of children) {
      if (budget.remaining <= 0) {
        budget.truncated = true;
        node.truncated = true; // remaining siblings were materialized+owned above but are not walked — they release on dispose
        break;
      }
      budget.remaining -= 1;
      node.children.push(walkLive(child, depth + 1, maxDepth, budget, counter, byRef, owned, marks));
    }
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
export function snapshot(window: Element, options: { maxDepth?: number; maxNodes?: number; extraRoots?: readonly Element[]; live?: boolean } = {}): Snapshot {
  const maxDepth = options.maxDepth ?? 40;
  // The cache is ELEMENT-scoped (NOT Subtree): the budget-aware walk navigates child→sibling via the control-view
  // walker's *BuildCache methods, each marshaling ONE node with its Full cache. The old TreeScope_Subtree forced the
  // WHOLE subtree to marshal up front — ~7s on a 3000-sibling flat panel, and maxDepth could not bound it (the cost is
  // sibling navigation, not depth). Per-parent BuildCache navigation makes a dense parent cost O(maxNodes), not O(N).
  const request = createCacheRequest([...DEFAULT_CACHE_PROPERTIES, ...STATE_PROPERTIES], TreeScope.TreeScope_Element, AutomationElementMode.Full);
  // Heavy cross-process Chromium top-levels (e.g. Opera) deterministically FAIL BuildUpdatedCache while still serving
  // live reads + navigation. Default: try the one-shot cache; on failure fall back to the live walk so the native tree
  // (browser chrome: tabs / address bar / URL) is recovered instead of dropped. `live: true` skips the cache attempt.
  const useLive = options.live === true;
  const cached = useLive ? window : window.buildUpdatedCache(request);
  const mainOk = !useLive && cached.ptr !== window.ptr;
  const byRef = new Map<string, Element>();
  const owned: Element[] = [];
  const marks: Mark[] = [];
  const counter = { value: 1 };
  const budget: Budget = { remaining: options.maxNodes ?? Number.POSITIVE_INFINITY, truncated: false };
  try {
    if (mainOk) owned.push(cached); // snapshot owns the cached clone; walkLive's root is the caller's window (not owned)
    const tree = mainOk ? walk(cached, 0, maxDepth, request, budget, counter, byRef, owned, marks) : walkLive(window, 0, maxDepth, budget, counter, byRef, owned, marks);
    for (const extra of options.extraRoots ?? []) {
      try {
        const cachedExtra = extra.buildUpdatedCache(request);
        if (cachedExtra.ptr !== extra.ptr) owned.push(cachedExtra); // snapshot owns the cached clone; the live path's root is the caller's extra (not owned)
        const subtree = cachedExtra.ptr !== extra.ptr ? walk(cachedExtra, 1, maxDepth, request, budget, counter, byRef, owned, marks) : walkLive(extra, 1, maxDepth, budget, counter, byRef, owned, marks); // a render widget that refuses the cache still walks live
        if (subtree.children.length > 0 || subtree.ref !== undefined) tree.children.push(subtree); // skip an empty render widget
      } catch {
        // a render widget can be mid-navigation — its absence must not fail the whole snapshot
      }
    }
    if (budget.truncated) tree.truncated = true; // surface a global cut at the root so renderSnapshot's root trailer fires even if the deepest cut was nested
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
  // Surface greyed-out actionable controls — a disabled Next/OK/Submit reads identically to an enabled one otherwise,
  // hiding the gate state of every wizard/form. Only ref'd (actionable) nodes, so the token cost is near-zero.
  const disabled = node.ref !== undefined && node.enabled === false ? ' (disabled)' : '';
  // A ref'd node with NO bounds has no on-screen rectangle (0×0) — it has no clickable point, so click/click_point
  // would misfire; flag it so the agent drives it cursor-free via a pattern verb (toggle/invoke/set_value/select).
  const offscreen = node.ref !== undefined && node.bounds === undefined ? ' (off-screen — no click point; use a pattern verb)' : '';
  let out = `${indent}- ${node.role}${label}${ref}${id}${node.state ?? ''}${disabled}${offscreen}`;
  for (const child of node.children) out += `\n${renderSnapshot(child, depth + 1)}`;
  // A truncated parent had more children than the maxNodes budget allowed — tell the agent the tree was CUT (not that the
  // children vanished), mirroring jab.ts's '(… tree truncated)' so the same recovery (raise maxNodes / scope with root) reads.
  if (node.truncated) out += `\n${indent}  (… ${node.children.length}+ children shown — more omitted; raise maxNodes or scope with desktop_snapshot {root:"<a node name above>"})`;
  return out;
}

// Interactive control roles (by name) — the keep-set for pruning, derived from the ref-assigning set so
// the two never drift. An interactive node is kept even when unnamed/ref-less (e.g. an icon-only Button).
const INTERACTIVE_ROLES = new Set<string>([...INTERACTIVE].map((controlType) => ControlType[controlType]).filter((role): role is string => role !== undefined));

// Details-view shell-column display cells that are ALWAYS READ-ONLY (system-set, never user-editable) — a CLOSED
// positive allow-list, so pruning one can NEVER hide a WRITABLE shell field (System.ItemNameDisplay/Rating/Keywords/
// Title/Author/Comment are editable in a metadata-rich Details view and are deliberately ABSENT here → always kept). A
// folder with an exotic read-only column we didn't list just renders that column rather than dropping it (harmless).
const READONLY_DISPLAY_COLUMNS = new Set(['System.DateAccessed', 'System.DateCreated', 'System.DateModified', 'System.FileExtension', 'System.ItemTypeText', 'System.Size']);

/**
 * Prune ref-less structural noise from a snapshot tree before rendering — the single highest-leverage
 * token win, since the rendered tree is auto-appended after every MCP action. Bottom-up: drop a node
 * that has no ref, an empty name, no surviving children, and a non-interactive role; collapse an
 * unnamed ref-less single-child Pane/Group/Custom into that child. EVERY `[ref]` node and EVERY named node is kept in
 * the rendered TEXT, so no actionable target is ever lost — the ONE exception is a Details-view ROW's READ-ONLY
 * shell-column display cell (a leaf `Edit` under a ListItem/DataItem whose automationId is in the closed read-only
 * column allow-list — Date/Type/Size/…, NEVER a writable shell field like System.ItemNameDisplay): it is dropped from the
 * rendered TEXT only, yet KEEPS its ref (resolveRef still resolves it) and its Set-of-Marks entry (screenshot_marked
 * still overlays it) — only the redundant text line is removed (see below). Returns null when the whole node prunes away.
 */
export function pruneRefTree(node: RefNode): RefNode | null {
  // A Details-view ROW (ListItem/DataItem) carries one leaf `Edit` per column whose automationId is a `System.*`
  // property-system key. The READ-ONLY display columns (Date modified / Type / Size / …) are pure render noise: a busy
  // File Open/Save dialog renders 3+ per row, bloating the snapshot past the size cap so its Open/Cancel buttons get
  // TRUNCATED off the rendered tree (a dead-end on the "pick a file" task). Drop those from the RENDER — but ONLY under a
  // grid row, and ONLY when the column is in the CLOSED read-only allow-list (READONLY_DISPLAY_COLUMNS). That positive
  // allow-list is what makes this safe: a WRITABLE shell cell (System.ItemNameDisplay rename surface; System.Rating/
  // Keywords/Title/Author metadata in a Music/Documents view) is never in the set, so it is NEVER hidden — and a
  // property-pane metadata field (not under a row) is excluded by isRow anyway. Render-only: the ref→Element map keeps the
  // dropped cells (resolveRef still resolves a held ref), the row keeps the filename, and the columns remain via read_table.
  const isRow = node.role === 'ListItem' || node.role === 'DataItem';
  const children: RefNode[] = [];
  for (const child of node.children) {
    if (isRow && child.children.length === 0 && child.role === 'Edit' && child.automationId !== undefined && READONLY_DISPLAY_COLUMNS.has(child.automationId)) continue;
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
  if (node.truncated) pruned.truncated = true; // keep the budget-cut marker so the render trailer still fires after pruning
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
export function coldTreeNote(markCount: number, minimized = false, walled = false, cloaked = 0, maxDepth?: number, className = ''): string {
  if (markCount > 0) return '';
  // A Java window (SunAwt*) exposes NOTHING to UIA/MSAA at ANY depth — re-snapshotting / raising maxDepth / restoring
  // never builds a tree. The Access Bridge is the real way in, and it reads background/minimized/cloaked alike. (A
  // UIPI-walled Java window is the exception — UIPI blocks the bridge's SendMessage too, so let the walled steer win.)
  if (/^SunAwt/.test(className) && !walled)
    return '\n\n(0 actionable controls — this is a Java window (SunAwt*), invisible to UIA/MSAA. Read its REAL tree with java_tree (the Java Access Bridge — role/name/states/bounds, cursor-free/background; each node carries screen bounds you can click_point). If java_tree returns empty the JVM needs the Access Bridge enabled (`jabswitch -enable` then restart the app, or launch with -Djavax.accessibility.assistive_technologies=com.sun.java.accessibility.AccessBridge); failing that, screen_capture + ocr / click_text.)';
  // A small maxDepth caps the tree ABOVE the window's interactable controls — that is NOT a cold tree, so the generic
  // "re-snapshot to build it" steer would loop forever at the same depth. Steer to raising maxDepth instead. (UIPI /
  // minimized / cloaked are real conditions that take priority — they read empty at any depth.)
  if (maxDepth !== undefined && !walled && !minimized && cloaked === 0)
    return `\n\n(0 actionable controls — you passed maxDepth=${maxDepth}, which capped the tree ABOVE this window's interactable controls. Raise maxDepth (e.g. ${maxDepth + 4}) or omit it to read the full tree — re-snapshotting at the same depth will NOT help; this is not a cold tree.)`;
  if (walled)
    return '\n\n(0 actionable controls AND this window runs at a HIGHER integrity than this MCP host (a UAC-elevated / admin app) — the UIPI wall blocks UIA reads, capture, AND input alike, so the tree will ALWAYS read empty: re-snapshot / OCR / screen_capture cannot help. The only fix is to relaunch the MCP host ELEVATED (run it as administrator), then re-attach.)';
  if (minimized)
    return '\n\n(0 actionable controls AND this window is MINIMIZED — a UWP/WinUI window tears its UIA tree down while minimized, so re-snapshotting alone will NOT repopulate it. Restore it CURSOR-FREE with manage_window {action:"restore"} (SW_RESTORE — no focus theft, no foregrounding), then desktop_snapshot. If it is still empty after restoring, it may be a game / canvas / custom-draw surface — use ocr / screen_capture / inspect_point.)';
  if (cloaked === 2)
    return '\n\n(0 actionable controls AND this window is CLOAKED by the shell — it is on ANOTHER VIRTUAL DESKTOP (or shell-hidden), NOT a cold tree, so re-snapshotting will NOT build it. There is no cursor-free virtual-desktop switch here — a human must bring it to the current desktop, or try manage_window {action:"raise"}, then desktop_snapshot.)';
  if (cloaked !== 0)
    return '\n\n(0 actionable controls AND this window is CLOAKED (DWM-hidden though not minimized — a suspended/background window, or cloaked because its OWNER is hidden), NOT a cold tree, so re-snapshotting will NOT build it. Raise/restore it with manage_window {action:"raise"} — or surface its owner for an inherited cloak — then desktop_snapshot.)';
  return '\n\n(0 actionable controls — if this window has visible UI its UIA tree may be COLD: UWP/WinUI and Chromium build it on demand and tear it down when idle, so call desktop_snapshot again to build it (or briefly activate the window). If it is a game / canvas / custom-draw surface with no accessibility, use ocr / screen_capture / inspect_point for the pixels.)';
}
