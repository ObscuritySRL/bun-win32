#!/usr/bin/env bun
// A zero-dependency stdio MCP server exposing bun-uia (Playwright-for-desktop) to Claude and any MCP
// client — the substrate an AI uses to drive Windows. Snapshot-first: desktop_snapshot returns a compact
// ref-keyed UIA tree; action tools target a fresh 'eN' ref and auto-append a new snapshot so the model
// re-grounds. DRIVE-IN-THE-DARK doctrine: cursor-free UIA invoke/set_value/scroll + posted clicks act on
// a window that is minimized, background, occluded, or on a locked session — no focus theft, no real
// cursor — and SendInput (drag/hold/real click) is the explicit "a human is watching" opt-in. Beyond one
// window: screen_capture sees the whole desktop, inspect_point turns a pixel into a control, native_tree/
// msaa_tree read legacy windows, and gated launch/run/file tools reach past the GUI. A deployer-set policy
// (BUN_UIA_PROFILE readonly|safe|full + overrides) decides which tools exist. All COM runs on the main STA
// thread; dispatch is serialized so two calls never overlap the apartment. Newline-delimited JSON-RPC 2.0
// over stdin/stdout (no SDK); every diagnostic goes to stderr.

import { realpathSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';

import {
  capSnapshot,
  captureWindowLive,
  captureWindowRGB,
  clickAt,
  clipboardSequence,
  closeWindow,
  coldTreeNote,
  ControlType,
  copyFromControl,
  cutFromControl,
  diffTrees,
  doubleClickAt,
  dragTo,
  type Element,
  encodePNG,
  findWindow,
  foregroundWindow,
  holdKey,
  integrityLevel,
  isMaximized,
  isMinimized,
  isSecureDesktopActive,
  isWindow,
  isWindowVisible,
  listMonitors,
  maximizeWindow,
  middleClickAt,
  minimizeWindow,
  moveWindow,
  type MsaaNode,
  normalizeKey,
  NoScroll,
  openPath,
  ownedForegroundDialog,
  ownedModalDialog,
  ownerHwnd,
  pasteToControl,
  postClickAt,
  postClickToHwnd,
  postDoubleClickAt,
  postDoubleClickToHwnd,
  postDragToHwnd,
  postHWheel,
  postHoldKey,
  postKey,
  postText,
  postWheel,
  processImagePath,
  PropertyId,
  pruneRefTree,
  raiseWindow,
  type RefNode,
  renderDiff,
  renderSnapshot,
  renderWindowTree,
  restoreWindow,
  rightClickAt,
  ScrollAmount,
  screenshotWithMarks,
  scrollAt,
  selectAllInControl,
  selectorToString,
  setControlText,
  type Selector,
  snapWindow,
  type Snapshot,
  type TableData,
  uia,
  undoControl,
  virtualScreen,
  type Window,
  windowProcessId,
} from './index';

type JsonRpcId = string | number | null;
interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: JsonRpcId;
  method: string;
  params?: unknown;
}
type ToolCategory = 'read' | 'input' | 'window' | 'os' | 'fs';
type ToolHandler = (args: Record<string, unknown>) => object | Promise<object>;
interface McpTool {
  name: string;
  description: string;
  inputSchema: object;
  category: ToolCategory;
  annotations?: Record<string, boolean>;
}

const PROTOCOL_VERSION = '2025-11-25';
const SUPPORTED_VERSIONS = new Set(['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05']);
const SERVER_INFO = { name: 'bun-uia', version: '1.6.3' }; // keep in sync with package.json (scripts/published-deps.ts gates this)
const INSTRUCTIONS =
  'Drive Windows desktop apps via the UI Automation tree — and beyond it. Call list_windows, then attach (by hWnd or exact title — className is reliable only for single-window classes like Shell_TrayWnd, not the Chromium/Electron family) — attach ALREADY returns a ref-keyed tree, so act on those refs directly; call desktop_snapshot only to RE-ground after refs go stale (e.g. Button "Five" [ref=e49#1]); pass that ref VERBATIM (with its #generation tag) to click/invoke/type/toggle/set_value/inspect_element. Refs are valid ONLY for the most recent snapshot — every action returns a fresh one; re-ground from it. A ref from before a re-render is REJECTED (not silently mis-resolved), so always use the refs from the latest snapshot/delta. To stay cheap, an action that changes little returns just a "Δ" delta (the +/-/~ changes, with refs on appeared/renamed) instead of the full tree — your other refs stay valid; desktop_snapshot {maxDepth} bounds the tree size when a window is large. Prefer invoke/set_value/toggle/scroll (cursor-free — they need no focus and work on a minimized, background, occluded, or locked window — for a classic Win32/HWND app; a UWP/WinUI store app SUSPENDS its UI tree when minimized or fully backgrounded, so its tree reads empty and posted actions may not land until you restore/raise it) over click. To SEE beyond the attached window (a 2nd monitor, a game/browser, a composited surface, or anything with no window) use screen_capture; to see a SPECIFIC window even when occluded, in the background, or GPU-composited (where a plain screenshot is blank) use capture_window (Windows.Graphics.Capture); turn a pixel into a control with inspect_point. screenshot auto-falls-back PrintWindow → WGC → desktop-region. Read legacy/owner-draw windows with native_tree/msaa_tree. drag and real-cursor clicks move the actual mouse; SendInput-based input (sendKeys, press_key chord, hold_key, drag, and the type/paste fallback for a control with no own HWND) needs an unlocked, foregrounded desktop — the posted cursor-free paths do not: type (WM_CHAR) / paste (WM_PASTE) / press_key {ref} on an own-HWND control, plus set_value/invoke/toggle. launch/run/file tools and manage_window may be disabled by the server policy (BUN_UIA_PROFILE).';
// Shown instead of INSTRUCTIONS when the policy enables no 'input' category — so the system-prompt guidance never
// describes action tools that tools/list does not expose (a readonly/restricted profile).
const INSTRUCTIONS_READONLY =
  'INSPECT Windows desktop apps via the UI Automation tree — READ-ONLY under the current server policy: only inspection/capture tools are exposed, NO action/input tools (set BUN_UIA_PROFILE=safe or full to enable acting). Call list_windows, then attach (by hWnd or exact title — className is reliable only for single-window classes like Shell_TrayWnd), then desktop_snapshot for a ref-keyed tree (e.g. Button "Five" [ref=e49#1]); inspect_element {ref} reads a control\'s full live state, read_table reads a data grid, list_views its view modes, find_text finds text. To SEE: screen_capture (any monitor/region), capture_window (a specific occluded/GPU window via Windows.Graphics.Capture), inspect_point (pixel → control), screenshot (PrintWindow → WGC → desktop-region). Read legacy/owner-draw windows with native_tree/msaa_tree; list monitors/processes.';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

let attached: Window | null = null;
let current: Snapshot | null = null;
let epoch = 0;
// A ref-generation tag stamped onto every emitted ref (`e5#3`). It bumps ONLY when refs are renumbered — a full
// re-dump (structural churn), an explicit desktop_snapshot re-ground, or screenshot_marked — and is HELD across a
// value-change delta / no-change (where the same ref still denotes the same control). So a ref the model carries
// over from before a re-render is rejected by resolveRef instead of silently resolving to a DIFFERENT control,
// while a ref that is still valid after a cheap delta keeps working.
let refGen = 0;
let lastSnapshotBody = '';
let lastSnapshotTree: RefNode | null = null;

/** Hard char budget for an auto-appended snapshot body (~2k tokens) — bounds a heavy window per step. */
const SNAPSHOT_MAX_CHARS = 8_000;
const READ_TEXT_MAX = 4_000; // cap a single text read (a control value / clipboard / copy-cut) so a huge editor/terminal buffer can't blow the context budget the snapshot/inspect/file reads already bound
/** Cap free text dumped into the model's context, with a pointer to the narrower reads. */
function capText(text: string): string {
  return text.length <= READ_TEXT_MAX ? text : `${text.slice(0, READ_TEXT_MAX)}…(+${text.length - READ_TEXT_MAX} more chars — read the on-screen text via inspect_element {ref}, or narrow with find_text {ref, text})`;
}
/** Above this many delta lines an action returns the full pruned tree instead of the change list. */
const DIFF_MAX_CHANGES = 8;

console.log = console.error; // hard guard: nothing but JSON-RPC ever reaches stdout

// --- deployer policy: which capabilities the agent may use (safe-by-default, configurable) ---

const PROFILES: Record<string, readonly ToolCategory[]> = {
  readonly: ['read'],
  safe: ['read', 'input', 'window'],
  full: ['read', 'input', 'window', 'os', 'fs'],
};

function envSet(name: string): Set<string> {
  return new Set(
    (Bun.env[name] ?? '')
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0),
  );
}

// This MCP host's own integrity level, read once — a window that outranks it is behind the UIPI wall (UIA reads,
// capture, and input all silently fail), which an empty-tree snapshot must NOT misdiagnose as a recoverable cold tree.
const INTEGRITY_RANK: Record<string, number> = { '': 2, untrusted: 0, low: 1, medium: 2, high: 3, system: 4 };
const hostIntegrityRank = (() => {
  try {
    return INTEGRITY_RANK[integrityLevel(process.pid)] ?? 2;
  } catch {
    return 2;
  }
})();
/** True if a window's process outranks this host on integrity — its tree is unreachable across the UIPI wall. */
function isUipiWalled(hWnd: bigint): boolean {
  try {
    return (INTEGRITY_RANK[integrityLevel(windowProcessId(hWnd))] ?? 2) > hostIntegrityRank;
  } catch {
    return false;
  }
}

const enabledCategories = new Set<ToolCategory>(PROFILES[(Bun.env.BUN_UIA_PROFILE ?? 'safe').toLowerCase()] ?? PROFILES.safe);
if (Bun.env.BUN_UIA_OS === '1') {
  enabledCategories.add('os');
  enabledCategories.add('fs');
}
const policyAllow = envSet('BUN_UIA_ALLOW');
const policyDeny = envSet('BUN_UIA_DENY');
const cursorDenied = (Bun.env.BUN_UIA_CURSOR ?? '').toLowerCase() === 'never';
const fsRoot = Bun.env.BUN_UIA_FS_ROOT !== undefined ? resolve(Bun.env.BUN_UIA_FS_ROOT) : undefined;
// The root canonicalized past any reparse points, so the sandbox check compares REAL paths.
const fsRootReal =
  fsRoot !== undefined
    ? (() => {
        try {
          return realpathSync.native(fsRoot);
        } catch {
          return fsRoot;
        }
      })()
    : undefined;
// Lowercased roots for the sandbox prefix check — Windows is case-INSENSITIVE, so a case-sensitive compare would
// over-block a legitimate case-variant path (e.g. c:\sandbox vs C:\Sandbox). Lowercasing only RELAXES the check;
// resolve() collapses `..` before the compare, so every escape (dotdot/absolute/UNC/reparse) stays outside the root.
const fsRootLower = fsRoot?.toLowerCase();
const fsRootRealLower = fsRootReal?.toLowerCase();

/** Whether a tool is reachable under the resolved policy (deny wins, then explicit allow, then the profile). */
function toolAllowed(tool: McpTool): boolean {
  if (policyDeny.has(tool.name) || policyDeny.has(tool.category)) return false;
  if (policyAllow.has(tool.name) || policyAllow.has(tool.category)) return true;
  return enabledCategories.has(tool.category);
}

function send(message: object): void {
  Bun.write(Bun.stdout, encoder.encode(`${JSON.stringify(message)}\n`));
}

function log(...parts: unknown[]): void {
  console.error('[bun-uia-mcp]', ...parts);
}

/** Narrow an unknown JSON value to a property bag (mirrors the package's `(error as Error)` boundary). */
function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function requireString(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== 'string') throw new Error(`missing required string argument: ${key}`);
  return value;
}

function requireNumber(args: Record<string, unknown>, key: string): number {
  const value = args[key];
  if (typeof value !== 'number') throw new Error(`missing required number argument: ${key}`);
  return value;
}

function quote(value: unknown): string {
  return typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value ?? 'element');
}

// The RESOLVED control's identity for an action result — so the agent gets target confirmation grounded in what the
// ref actually resolved to, NOT an echo of its own (possibly hallucinated) `element` description. Matches the named
// results act()/find_and_act/reveal already return. A ref-path element comes from the snapshot's BuildUpdatedCache (Full
// mode, Name+ControlType cached — the very values the rendered tree shows), so read cached to skip two cross-process
// round-trips; a find()-resolved element has nothing cached (cachedControlType===0) → read live.
function named(element: Element): string {
  return element.cachedControlType === 0 ? `${element.controlTypeName} ${JSON.stringify(element.name)}` : `${element.cachedControlTypeName} ${JSON.stringify(element.cachedName)}`;
}

/** Resolve a controlType selector value to its numeric UIA id — a number, a numeric string ("50000"), OR a role
 *  NAME ("Button", "list", "tree item"), case- and separator-insensitive. undefined for an unknown name. */
function controlTypeId(value: number | string): number | undefined {
  if (typeof value === 'number') return value;
  if (/^\d+$/.test(value)) return Number(value);
  const normalized = value.toLowerCase().replace(/[\s_-]/g, '');
  for (const key of Object.keys(ControlType)) {
    if (!Number.isNaN(Number(key))) continue; // skip the reverse numeric→name entries
    if (key.toLowerCase() === normalized) return ControlType[key as keyof typeof ControlType];
  }
  return undefined;
}

const SELECTOR_KEYS = new Set(['name', 'nameContains', 'automationId', 'className', 'controlType']);
// The selector idioms an LLM reaches for first (ARIA/Playwright muscle memory) folded onto the real UIA keys.
const SELECTOR_ALIASES: Record<string, 'automationId' | 'controlType' | 'name'> = { accessibleName: 'name', id: 'automationId', label: 'name', role: 'controlType', title: 'name', type: 'controlType' };

function selectorFrom(value: unknown): Selector {
  const raw = { ...record(value) };
  // Fold the common LLM idioms (role/type → controlType, id → automationId, label/accessibleName/title → name) onto
  // the real UIA keys rather than rejecting them. A bare alias is honored; an alias that conflicts with its canonical
  // key is an error (never silently pick one and act on the wrong control).
  for (const alias of Object.keys(raw)) {
    const canonical = SELECTOR_ALIASES[alias];
    if (canonical === undefined) continue;
    if (canonical in raw && raw[canonical] !== raw[alias])
      throw new Error(`selector has both ${JSON.stringify(alias)} and ${JSON.stringify(canonical)} — ${JSON.stringify(alias)} is an alias for ${JSON.stringify(canonical)}; pass only one`);
    raw[canonical] = raw[alias];
    delete raw[alias];
  }
  // Reject UNKNOWN keys (a silently-dropped key would act on the WRONG control with a confident success).
  const unknown = Object.keys(raw).filter((key) => !SELECTOR_KEYS.has(key));
  if (unknown.length > 0)
    throw new Error(
      `unknown selector key${unknown.length > 1 ? 's' : ''} ${JSON.stringify(unknown)} — valid keys: name, nameContains, automationId, className, controlType. (Aliases accepted: role/type → controlType; label/accessibleName/title → name; id → automationId.)`,
    );
  const selector: Selector = {};
  if (typeof raw.name === 'string') selector.name = raw.name;
  if (typeof raw.nameContains === 'string') selector.nameContains = raw.nameContains;
  if (typeof raw.automationId === 'string') selector.automationId = raw.automationId;
  if (typeof raw.className === 'string') selector.className = raw.className;
  if (typeof raw.controlType === 'number' || typeof raw.controlType === 'string') {
    const id = controlTypeId(raw.controlType); // honor a number, a numeric string, OR a role name ("Button") — never silently drop it
    if (id === undefined) throw new Error(`unknown controlType ${JSON.stringify(raw.controlType)} — pass a UIA number (e.g. 50000 = Button) or a role name (Button, Edit, List, Tree, TreeItem, …)`);
    selector.controlType = id;
  }
  // An empty selector would silently match the window ROOT (a wrong target an AI can't self-correct from) — refuse.
  if (Object.keys(selector).length === 0) throw new Error('empty selector — pass a non-empty selector with name / nameContains / automationId / className / controlType (a number e.g. 50000, or a role name like Button), or target by ref');
  return selector;
}

/** `element` is a permission-prompt LABEL, never a target (no handler reads it). An LLM that passes only `element`
 *  (no ref, no selector) would otherwise hit the generic "empty selector"/"missing ref" error and loop on the wrong
 *  field — name the trap so it self-corrects to ref/selector. */
function rejectElementOnlyTarget(args: Record<string, unknown>): void {
  if (typeof args.element === 'string' && args.ref === undefined && Object.keys(record(args.selector)).length === 0)
    throw new Error('`element` is a label for the permission prompt only — it does NOT select a control. Target by `ref` (from the latest snapshot) or `selector` {name / nameContains / automationId / controlType}.');
}

/** Drop a DEAD attached window (closed by the user, or the app exited) and throw a re-attach steer — one IsWindow call
 *  guards every snapshot/ref action against a confident FALSE success on a destroyed window (a stale Element would
 *  silently no-op and the rebuilt tree would read "Type(0)" / empty). No-op while the window is alive or none attached. */
function assertAttachedAlive(): void {
  if (attached === null || isWindow(attached.hWnd)) return;
  const dead = attached.hWnd;
  current?.dispose();
  current = null;
  attached.dispose();
  attached = null;
  lastSnapshotBody = '';
  lastSnapshotTree = null;
  throw new Error(`the attached window (hWnd 0x${dead.toString(16)}) no longer exists — it was closed or the app exited; call list_windows then attach a live window`);
}

function requireAttached(): Window {
  if (attached === null) throw new Error('no window attached — call list_windows then attach first');
  assertAttachedAlive();
  return attached;
}

/** Attach by className the safe way: FindWindowW(class, NULL) returns the first top-level match in Z-order, which for
 *  the whole Chromium/Electron family (Chrome_WidgetWin_1 — Discord, Slack, VS Code, Teams, Edge, …) is an INVISIBLE
 *  helper window, leaving the agent snapshotting a dead window. Enumerate VISIBLE windows instead, and refuse or ask
 *  to disambiguate rather than silently grabbing the wrong one. */
function attachByClassName(className: string): Window {
  const matches = uia.windows({ includeUntitled: true }).filter((window) => window.className === className);
  if (matches.length > 1)
    throw new Error(
      `${matches.length} visible windows have class ${JSON.stringify(className)} — attach by hWnd to pick one:\n${matches.map((window) => `  - ${JSON.stringify(window.title)} [hWnd=0x${window.hWnd.toString(16)}] [pid=${window.processId}]`).join('\n')}`,
    );
  if (matches.length === 1) return uia.attach(matches[0]!.hWnd);
  // uia.windows (EnumWindows) can miss a present single-window class — the taskbar Shell_TrayWnd is intermittently not
  // enumerated. Fall back to FindWindowW, accepting it ONLY if VISIBLE: a titleless single-window class (taskbar)
  // attaches, while the INVISIBLE Chromium/Electron helper (Chrome_WidgetWin_1) is still rejected.
  const hWnd = findWindow({ className });
  if (isWindowVisible(hWnd)) return uia.attach(hWnd);
  throw new Error(`no VISIBLE window has class ${JSON.stringify(className)}${hWnd !== 0n ? ' (FindWindowW matched only an invisible helper)' : ''} — call list_windows and attach by an exact title or an hWnd.`);
}

/** Pick a window by exact title (optionally refined by className), disambiguating MANY matches with their hWnds the
 *  way attachByClassName does — so attach never silently grabs an arbitrary same-titled window. Falls back to the
 *  library resolveWindow (FindWindowW) when uia.windows/EnumWindows enumerates none (the Shell_TrayWnd-miss case). */
function attachByTitle(title: string, className: string | undefined): Window {
  const all = uia.windows({ includeUntitled: true }).filter((window) => className === undefined || window.className === className);
  const candidates = (list: typeof all): string => list.map((window) => `  - ${JSON.stringify(window.title)} [class=${window.className}] [hWnd=0x${window.hWnd.toString(16)}] [pid=${window.processId}]`).join('\n');
  const exact = all.filter((window) => window.title === title);
  if (exact.length > 1) throw new Error(`${exact.length} visible windows have title ${JSON.stringify(title)} — attach by hWnd to pick one:\n${candidates(exact)}`);
  if (exact.length === 1) return uia.attach(exact[0]!.hWnd);
  // No exact match — try a case-insensitive SUBSTRING match (attach by app name / a volatile title) before the
  // FindWindowW fallback. Exact always wins; a substring that is ambiguous lists candidates rather than guessing.
  const lower = title.toLowerCase();
  const substring = all.filter((window) => window.title.length > 0 && window.title.toLowerCase().includes(lower));
  if (substring.length > 1) throw new Error(`${substring.length} visible windows have a title CONTAINING ${JSON.stringify(title)} — attach by hWnd to pick one:\n${candidates(substring)}`);
  if (substring.length === 1) return uia.attach(substring[0]!.hWnd);
  return uia.attach({ title, ...(className !== undefined ? { className } : {}) }); // EnumWindows-miss fallback (matches the library's first-match semantics)
}

/** Pick a window by owning processId, disambiguating MANY top-level windows of that process with their hWnds rather
 *  than silently grabbing the first — a multi-window app (Explorer, a browser) otherwise lands on an arbitrary one. */
function attachByProcess(processId: number): Window {
  const matches = uia.windows({ includeUntitled: true }).filter((window) => window.processId === processId);
  if (matches.length > 1)
    throw new Error(
      `process ${processId} has ${matches.length} visible windows — attach by hWnd (or title + className) to pick one:\n${matches.map((window) => `  - ${JSON.stringify(window.title)} [class=${window.className}] [hWnd=0x${window.hWnd.toString(16)}]`).join('\n')}`,
    );
  if (matches.length === 1) return uia.attach(matches[0]!.hWnd);
  return uia.attach({ process: processId }); // EnumWindows-miss fallback (library first-match)
}

/** An hWnd argument as a bigint, or undefined if absent — accepts both a string ('0x1234' / '4660') AND a JSON
 *  number (the form a model overwhelmingly emits for an integer handle; the string-only gate silently ignored it,
 *  so window-scoped tools mis-targeted the attached window with a success message). BigInt() accepts either. */
function hwndArg(args: Record<string, unknown>): bigint | undefined {
  const value = args.hWnd;
  if (typeof value === 'string' && value.length > 0) return BigInt(value);
  if (typeof value === 'number' && Number.isInteger(value)) return BigInt(value);
  return undefined;
}

/** The handle a window-scoped tool targets: an explicit hWnd arg, a ref's native window, else the attached window. */
function resolveHwnd(args: Record<string, unknown>): bigint {
  const handle = hwndArg(args);
  if (handle !== undefined) return handle;
  if (typeof args.ref === 'string') {
    const refHandle = resolveRef(args.ref).nativeWindowHandle;
    if (refHandle !== 0n) return refHandle;
  }
  return requireAttached().hWnd;
}

const SNAPSHOT_COLD_REFS = 5; // a Chromium window with web roots but fewer refs than this is a cold / torn-down a11y tree
const SNAPSHOT_WARMUP_MAX = 6; // bounded re-queries to warm a cold Chromium tree
const SNAPSHOT_WARMUP_INTERVAL = 200; // ms between warm-up re-queries

/** Build one ref-keyed snapshot of the whole window, splicing in any Chromium web roots; retries once on a
 *  transient cache fail. Also reports whether the window is Chromium (has web roots) for the cold-tree warm-up. */
function buildWindowSnapshot(window: Window, maxDepth?: number): { snapshot: Snapshot; chromium: boolean } {
  for (let attempt = 0; ; attempt += 1) {
    // Chromium/Electron host their web/editor DOM in a child fragment the top-level walk misses — splice it in.
    const webRoots = window.webRoots();
    const chromium = webRoots.length > 0;
    try {
      return { snapshot: uia.snapshot(window, { ...(maxDepth !== undefined ? { maxDepth } : {}), extraRoots: webRoots }), chromium };
    } catch (error) {
      if (attempt >= 1) throw error;
      Bun.sleepSync(150);
    } finally {
      for (const webRoot of webRoots) webRoot.release();
    }
  }
}

/** Rebuild the ref-keyed snapshot of the attached window, releasing the prior generation. Retries once after a
 *  short settle: BuildUpdatedCache can transiently fail while the view is mid-render. Leaves `current` null (not
 *  a dangling disposed snapshot) and rethrows if it cannot rebuild. */
function rebuildSnapshot(maxDepth?: number, root?: Element): { header: string; tree: RefNode } {
  const window = requireAttached();
  current?.dispose();
  current = null;
  let snapshot: Snapshot;
  if (root !== undefined) {
    // Scoped re-grounding on a sub-element: just that subtree, no window-level web-root splice.
    snapshot = uia.snapshot(root, maxDepth !== undefined ? { maxDepth } : {});
  } else {
    let { snapshot: built, chromium } = buildWindowSnapshot(window, maxDepth);
    current = built; // hold a disposable handle so a throw mid-warm-up can't orphan it (the next rebuild disposes it; dispose is idempotent)
    // Chromium/Electron build their a11y tree on demand and tear it down when idle, so a just-attached or
    // long-idle browser's first snapshot can be sparse. Re-querying triggers the rebuild; poll (bounded) until
    // the ref count grows past the cold threshold or plateaus. Warm windows (many refs) skip this entirely.
    if (chromium && built.marks.length < SNAPSHOT_COLD_REFS) {
      for (let attempt = 0; attempt < SNAPSHOT_WARMUP_MAX; attempt += 1) {
        Bun.sleepSync(SNAPSHOT_WARMUP_INTERVAL);
        const next = buildWindowSnapshot(window, maxDepth).snapshot;
        if (next.marks.length <= built.marks.length) {
          next.dispose();
          break;
        }
        built.dispose();
        built = next;
        current = built;
        if (built.marks.length >= SNAPSHOT_COLD_REFS) break;
      }
    }
    snapshot = built;
  }
  current = snapshot;
  epoch += 1;
  const scope = root !== undefined ? ` scoped to ${JSON.stringify(root.name)}` : '';
  return { header: `### Snapshot (epoch ${epoch})${scope}: ${JSON.stringify(window.name)}`, tree: snapshot.tree };
}

/** Render a snapshot tree to the token-economical body an agent reads: pruned of ref-less noise, size-capped. */
function renderTree(tree: RefNode): string {
  return capSnapshot(renderSnapshot(pruneRefTree(tree) ?? tree), SNAPSHOT_MAX_CHARS);
}

/** Stamp the current ref-generation onto every `[ref=eN]` token in AI-facing text (`[ref=eN#G]`). Applied only to
 *  the returned copy — the stored `lastSnapshotBody` stays bare so the byte-equality / diff economy is unaffected. */
function stampRefs(text: string): string {
  return text.replace(/\[ref=(e\d+)\]/g, (_match, id) => `[ref=${id}#${refGen}]`);
}

// A one-line warning, appended to every post-action / re-ground snapshot, when the agent's action left a DIFFERENT
// top-level window owned by the attached one (a dialog / file picker / confirm / color picker) holding the foreground:
// the snapshot above is the OLD window (its refs are stale for the new one), so the agent must attach the new hWnd.
// Empty when nothing new owns the foreground (the steady-state path — zero token cost, never fires on background drive).
function foregroundNudge(): string {
  if (attached === null) return '';
  const dialog = ownedForegroundDialog(attached.hWnd);
  if (dialog !== 0n) {
    const info = uia.windows({ includeUntitled: true }).find((window) => window.hWnd === dialog);
    return `\n\n⚠ this action left a dialog/window it opened in the FOREGROUND: ${info !== undefined ? JSON.stringify(info.title) : '(untitled)'} [hWnd=0x${dialog.toString(16)}] — the snapshot above is the PREVIOUS window; attach {hWnd} to drive the new one.`;
  }
  // The "drive in the dark" case: an owned MODAL dialog that did NOT grab the foreground (background/minimized app) is
  // disabling the attached window. The snapshot above is the blocked parent — surface the modal so the agent attaches it.
  const modal = ownedModalDialog(attached.hWnd);
  if (modal !== 0n) {
    const info = uia.windows({ includeUntitled: true }).find((window) => window.hWnd === modal);
    return `\n\n⚠ a MODAL dialog owned by this window is blocking it (the window is disabled) and it is NOT in the foreground — the snapshot above is the blocked parent: ${info !== undefined ? JSON.stringify(info.title) : '(untitled)'} [hWnd=0x${modal.toString(16)}] — attach {hWnd} to drive it.`;
  }
  return '';
}

/** A snapshot of the top-level window set — used to tell which untitled popup an action just opened. */
function popupSnapshot(): Set<bigint> {
  return new Set(uia.windows({ includeUntitled: true }).map((window) => window.hWnd));
}

/** The cursor-free restore steer for a capture/OCR tool that hit a MINIMIZED window — a minimized window has no
 *  on-screen surface to capture or OCR, so steer to the cursor-free restore that unblocks it instead of a dead error
 *  or a useless taskbar-button sliver. Mirrors the click path's restore wording. */
function minimizedCaptureSteer(hWnd: bigint, tool: string): string {
  return `${tool}: 0x${hWnd.toString(16)} is MINIMIZED, so it has no on-screen surface to capture. Restore it first (manage_window {action:"restore"} — cursor-free, no foreground), then retry.`;
}

/** The processId of the attached window, or undefined — scopes newPopup to the in-app popup so a cross-process SHELL
 *  popup is never misattributed to an in-app action. */
function attachedProcessId(): number | undefined {
  return attached !== null ? windowProcessId(attached.hWnd) : undefined;
}

/** The NEW untitled popup window (dropdown / flyout / context menu / combobox list) that appeared since `before`, or
 *  undefined. A single synchronous scan — no sleep. Scoped to the attached window's PROCESS by default: a classic
 *  #32768 menu / ComboLBox and a WinUI app's own windowed popup are same-process, but a cross-process shell popup that
 *  happens to open during the action (e.g. an explorer Xaml_WindowedPopupClass "PopupHost", a toast) is NOT this
 *  action's popup and must not be auto-returned to the agent. */
function newPopup(before: Set<bigint>, ownerProcessId = attachedProcessId()): { hWnd: bigint; className: string } | undefined {
  return uia
    .windows({ includeUntitled: true })
    .find((window) => !before.has(window.hWnd) && (ownerProcessId === undefined || window.processId === ownerProcessId) && (window.className === '#32768' || /Combo|DropDown|Flyout|Menu|Popup/i.test(window.className)));
}

/** Poll for newPopup() over time. Checks FIRST so a popup created synchronously by the action costs nothing; `attempts`
 *  bounds the wait when none appears — only the provider-dependent context_menu needs the slow poll (invoke/expand use
 *  the sleep-free newPopup() bracketed around their withSnapshot rebuild instead). */
async function pollForNewPopup(before: Set<bigint>, attempts: number, ownerProcessId = attachedProcessId()): Promise<{ hWnd: bigint; className: string } | undefined> {
  for (let attempt = 0; ; attempt += 1) {
    const popup = newPopup(before, ownerProcessId);
    if (popup !== undefined) return popup;
    if (attempt + 1 >= attempts) return undefined;
    await Bun.sleep(80);
  }
}

function snapshotText(maxDepth?: number, rootName?: string): string {
  const window = requireAttached();
  let root: Element | undefined;
  if (rootName !== undefined && rootName.length > 0) {
    if (/^e\d+(#\d+)?$/.test(rootName))
      throw new Error(`desktop_snapshot {root} takes a node NAME or automationId, not a [ref] — refs (${rootName}) address controls only on action tools; omit root and use maxDepth, or pass the name/automationId shown for that node`);
    root = window.find({ name: rootName }) ?? window.find({ automationId: rootName }) ?? undefined;
    if (root === undefined) throw new Error(`desktop_snapshot: no element named or automationId ${JSON.stringify(rootName)} under the attached window — omit root, or pick a name/id from a full snapshot`);
  }
  try {
    const { header, tree } = rebuildSnapshot(maxDepth, root);
    const body = renderTree(tree);
    lastSnapshotTree = tree;
    // A defensive unscoped re-ground that finds the tree BYTE-IDENTICAL must NOT re-dump it or bump refGen: the
    // structurally identical rebuild reassigned the same ref ids to the same controls, so the model's current-gen
    // refs still resolve. Return a one-line "no change" (saves the full re-dump) and keep refs valid (mirrors the
    // withSnapshot action-path contract). A scoped (root/maxDepth) snapshot always renders fully.
    // A CAPPED (truncated) body can be byte-identical while content below the cap changed — never short-circuit "no
    // change" on it; re-dump the full current tree so an explicit re-ground reflects below-fold changes (and the agent
    // can narrow with {maxDepth}/{root}).
    if (root === undefined && body === lastSnapshotBody && !body.includes('more nodes — narrow with'))
      return stampRefs(
        `${header}\n(no UI change since the last snapshot — refs unchanged)${coldTreeNote(current?.marks.length ?? 0, attached !== null && isMinimized(attached.hWnd), attached !== null && isUipiWalled(attached.hWnd), maxDepth)}${foregroundNudge()}`,
      ); // coldTreeNote is '' for a warm tree; on a still-COLD re-snapshot it re-surfaces the restore/activate/elevate steer the bare line would have suppressed (or a maxDepth-cap steer)
    lastSnapshotBody = body;
    refGen += 1; // an explicit re-ground renumbers refs — invalidate any the model still holds
    return stampRefs(
      `${header}\n${body}${root === undefined ? coldTreeNote(current?.marks.length ?? 0, attached !== null && isMinimized(attached.hWnd), attached !== null && isUipiWalled(attached.hWnd), maxDepth) + foregroundNudge() : ''}`,
    );
  } finally {
    root?.release();
  }
}

function resolveRef(ref: string): Element {
  assertAttachedAlive(); // a ref action on a since-closed window must fail loud, not resolve a stale Element to a phantom success
  const hash = ref.indexOf('#');
  const id = hash >= 0 ? ref.slice(0, hash) : ref;
  // No snapshot exists yet (fresh server, a failed attach, or a ref copied from a different session) — there is no
  // tree "above" to re-read, so say that plainly instead of the stale-generation message.
  if (current === null) throw new Error('no snapshot yet — call list_windows then attach (attach returns a snapshot), or desktop_snapshot, before using a ref');
  // A bare ref (no #generation) can no longer be PROVEN current once any re-render has happened — silently resolving it
  // to whatever now occupies that traversal slot would act on the WRONG control, breaking the "rejected, not
  // mis-resolved" guarantee. At refGen 0 (nothing re-rendered yet) a bare ref is still legitimately current; after the
  // first re-render every live ref carries #G≥1 (stampRefs), so a bare ref is provably stale/mangled.
  if (hash < 0 && refGen > 0)
    throw new Error(
      `ref ${id} is missing its #generation tag — pass it VERBATIM from the latest snapshot (e.g. ${id}#${refGen}); a bare ref can no longer be proven current, so it is rejected rather than mis-resolved — re-read the snapshot above and use ITS refs`,
    );
  // A ref carrying a stale generation provably no longer denotes the same control — fail loud instead of acting on
  // whatever now occupies that traversal slot.
  if (hash >= 0 && Number(ref.slice(hash + 1)) !== refGen)
    throw new Error(`ref ${id} is from an earlier snapshot generation (the tree was re-grounded since) — read the latest snapshot above and use ITS refs, or use find_and_act {selector} / reveal {selector}, which need no ref`);
  const element = current?.resolve(id) ?? null;
  if (element === null) throw new Error(`ref ${id} not in the current snapshot (epoch ${epoch}) — re-ground with desktop_snapshot, or use find_and_act {selector} / reveal {selector}, which need no ref`);
  return element;
}

function textResult(text: string): object {
  return { content: [{ type: 'text', text }] };
}

function errorResult(text: string): object {
  return { content: [{ type: 'text', text }], isError: true };
}

function imageResult(png: Uint8Array, note?: string): object {
  const image = { type: 'image', data: Buffer.from(png).toString('base64'), mimeType: 'image/png' };
  return { content: note !== undefined ? [image, { type: 'text', text: note }] : [image] };
}

// A window/region capture is window-LOCAL pixels; click_point/inspect_point want screen-absolute coords. Carry the
// capture's screen origin so the model can map a pixel it eyeballs here to the screen point before clicking it.
function originNote(originX: number, originY: number, width: number, height: number): string {
  return `window-local pixels — this image's top-left is screen ${originX},${originY} (size ${width}×${height}); add ${originX},${originY} to any pixel here to get the screen point for click_point / inspect_point (or use screenshot_marked to act by ref instead)`;
}

/**
 * An action result: the message plus a fresh re-grounding. To stay token-cheap on the agent's hottest
 * path, the appended observation is the SMALLEST faithful form: nothing when the tree is byte-identical,
 * a compact `+/-/~` delta when only a few things changed AND no actionable ref was renumbered, else the
 * full pruned+capped tree. The delta path is safe only without ref churn — a snapshot rebuild reassigns
 * ref ids in traversal order, so an appeared/disappeared actionable node shifts them and forces a full
 * re-dump; renames keep the order (and thus the agent's existing refs) stable.
 */
function withSnapshot(message: string): object {
  const prior = lastSnapshotTree;
  let rebuilt: { header: string; tree: RefNode };
  try {
    rebuilt = rebuildSnapshot();
  } catch (error) {
    // The action already ran — only the post-action snapshot refresh failed (a transient BuildUpdatedCache
    // race while the view re-renders). Never mask a successful action as an error: report success and tell the
    // agent its refs are stale so it re-grounds with desktop_snapshot.
    return textResult(`${message}\n\n(snapshot not refreshed — ${error instanceof Error ? error.message : String(error)}; refs are stale, call desktop_snapshot to re-ground)`);
  }
  const { header, tree } = rebuilt;
  const body = renderTree(tree);
  // A close-the-window action (a dialog's OK/Cancel/Close, a menu Exit) leaves an EMPTY rebuilt tree while the window
  // tears down ASYNCHRONOUSLY — at this instant isWindow can still be true (so assertAttachedAlive in the rebuild did
  // not fire), and the empty tree would otherwise read as a misleading "cold tree — re-snapshot to build it" loop that
  // only errors one round-trip later. When the new tree has 0 actionable controls but the PRIOR snapshot had refs,
  // settle briefly and re-check: if the window is now gone, report the close cleanly and drop the dead state. Gated on
  // prior-had-refs + post-settle isWindow===false, so a genuinely cold/minimized (but alive) tree falls through unchanged.
  if (current !== null && current.marks.length === 0 && attached !== null && lastSnapshotBody.includes('[ref=')) {
    Bun.sleepSync(200);
    if (!isWindow(attached.hWnd)) {
      const dead = attached.hWnd;
      current.dispose();
      current = null;
      attached.dispose();
      attached = null;
      lastSnapshotBody = '';
      lastSnapshotTree = null;
      return textResult(`${message}\n\n(the attached window (hWnd 0x${dead.toString(16)}) has CLOSED — the action succeeded and the window is gone; call list_windows then attach a live window)`);
    }
  }
  lastSnapshotTree = tree;
  // The rendered body is CAPPED (renderTree → capSnapshot at SNAPSHOT_MAX_CHARS), so on a heavy window a byte-identical
  // body can still hide a change BELOW the cap. Only take the cheap "no UI change" short-circuit when the body is NOT
  // truncated; when it is, the authoritative comparison is the full-tree diff below (which sees the whole tree, uncapped).
  const truncated = body.includes('more nodes — narrow with');
  const bodyUnchanged = body === lastSnapshotBody;
  const noUiChange = (): object =>
    textResult(
      `${message}\n\n${header}\n(no UI change since the last snapshot — refs unchanged)${coldTreeNote(current?.marks.length ?? 0, attached !== null && isMinimized(attached.hWnd), attached !== null && isUipiWalled(attached.hWnd))}${foregroundNudge()}`,
    ); // refs identical → generation held; coldTreeNote ('' when warm) re-surfaces recovery steer on a still-cold tree
  if (bodyUnchanged && !truncated) return noUiChange();
  if (prior !== null) {
    const diff = diffTrees(prior, tree);
    const refChurn = diff.appeared.some((change) => change.ref !== undefined) || diff.disappeared.some((change) => change.ref !== undefined);
    if (!refChurn && !diff.refsRenumbered) {
      // diff.refsRenumbered is computed in diffTrees' single flatten pass — no second pair of flattens per action.
      const delta = renderDiff(diff);
      // A truncated byte-identical body whose FULL-tree diff is empty really is unchanged — keep refs, don't re-dump a heavy window.
      if (delta.count === 0 && bodyUnchanged) return noUiChange();
      if (delta.count > 0 && delta.count <= DIFF_MAX_CHANGES) {
        lastSnapshotBody = body;
        return textResult(stampRefs(`${message}\n\n${header} — Δ ${delta.count} change${delta.count === 1 ? '' : 's'} (other refs unchanged)\n${delta.text}${foregroundNudge()}`)); // no churn → generation held, prior refs stay valid
      }
    }
  }
  lastSnapshotBody = body;
  refGen += 1; // a full re-dump renumbers refs in traversal order — bump so the model's pre-re-render refs are rejected
  return textResult(stampRefs(`${message}\n\n${header}\n${body}${coldTreeNote(current?.marks.length ?? 0, attached !== null && isMinimized(attached.hWnd), attached !== null && isUipiWalled(attached.hWnd))}${foregroundNudge()}`));
}

/** Like withSnapshot, but for an expand whose dropdown items render IN-PROCESS (a WinUI/UWP combobox/menu surfaces its
 *  items into the SAME tree, not an own window — verified: Settings' combobox reveals ref'd ListItems under itself).
 *  Those items race the ~13ms rebuild, so poll the rebuilt snapshot until its ref count grows past the pre-expand
 *  `baseline` (the items appeared) or plateaus. Bounded (a few 60ms ticks); an expand that reveals nothing returns at
 *  the cap with no harm, and an instant render returns immediately (no added latency). */
function withSettledSnapshot(message: string, baseline: number): object {
  let result = withSnapshot(message);
  for (let attempt = 0; attempt < 6 && (current?.marks.length ?? 0) <= baseline; attempt += 1) {
    Bun.sleepSync(60);
    result = withSnapshot(message);
  }
  return result;
}

/** Snapshot an act() outcome: an expand that did NOT open an own-window popup may have revealed in-process items that
 *  race the rebuild — settle for them; everything else gets one snapshot. */
function withActSnapshot(action: string, message: string, baseline: number): object {
  return action === 'expand' && !/OWN window/.test(message) ? withSettledSnapshot(message, baseline) : withSnapshot(message);
}

/** Like withSnapshot, but for launch_app where the window provably JUST appeared mid-render. A cold WinUI/UWP store app
 *  (Settings/Photos/Store/Mail) surfaces only its title-bar chrome immediately and renders its real content ~0.6-1.5s LATER
 *  (live-measured: a cold Settings launch shows 4 actionable refs the instant the window appears, 49 by +585ms, plateauing
 *  at 51 by ~865ms), so a bare snapshot hands the agent a content-less tree that LOOKS complete. Poll the rebuilt snapshot:
 *  once its actionable-ref count has GROWN past the first reading and then held steady across a tick, the content has
 *  settled — return it. A warm/instant app (or an MSAA-only provider gap) never grows, so it returns after a short floor;
 *  bounded by a ~2.5s cap. Grow-then-plateau (not bare plateau) is required because the cold title-bar frame is itself
 *  stable for ~300ms before the content lands. This is the launch path ONLY (the window is known fresh) — the per-action
 *  hot path is untouched, and a warm launch pays one extra tick. */
function withLaunchSettledSnapshot(message: string): object {
  withSnapshot(message);
  let previous = current?.marks.length ?? 0;
  let grew = false;
  for (let elapsed = 0; elapsed < 2500; elapsed += 160) {
    Bun.sleepSync(160);
    withSnapshot(message);
    const count = current?.marks.length ?? 0;
    if (count > previous) grew = true;
    const stable = count === previous;
    previous = count;
    if (grew && stable) break; // late content arrived then settled (cold WinUI) → done
    if (!grew && stable && elapsed >= 640) break; // never grew + stable past the WinUI render window → warm/instant or provider-gap
  }
  // Every settle-loop withSnapshot after the first sees `body === lastSnapshotBody` and short-circuits to the
  // content-LESS "no UI change" line — so the loop's own result is always that empty line, never the freshly-rendered
  // tree the launch is supposed to hand back. The window is provably FRESH (launch_app nulled lastSnapshotBody/Tree
  // before this), so there is no real "prior" to diff against: force one final FULL render by clearing the baseline.
  lastSnapshotBody = '';
  return withSnapshot(message);
}

/** ValuePattern set, falling back to RangeValuePattern for a numeric value on a slider/spinner (ValuePattern
 *  throws there) — so set_value drives both cursor-free. */
function setValueSmart(element: Element, value: string): string {
  try {
    element.setValue(value);
    return 'set value';
  } catch (error) {
    const number = Number(value);
    if (value.trim().length > 0 && Number.isFinite(number) && !Number.isNaN(element.rangeValue)) {
      element.setRangeValue(number);
      return `set range value ${number}`;
    }
    if (setControlText(element.nativeWindowHandle, value)) return 'set text cursor-free (WM_SETTEXT)'; // a no-ValuePattern classic Edit with its own HWND
    throw error;
  }
}

/** Run an invoke/expand inside act() (find_and_act / reveal / grid_cell) and, if it opened a flyout/menu/dropdown in its
 *  OWN window, append that popup's hWnd — the same auto-return the dedicated invoke/expand tools give, so the one-call
 *  selector idiom does not leave the agent hand-hunting the popup. Synchronous check (these popups are created in the
 *  action's own call, as the combobox case shows); no sleep. */
function withPopupNote(run: () => string): string {
  const before = popupSnapshot();
  const message = run();
  const popup = newPopup(before);
  return popup !== undefined ? `${message} — it opened a flyout/menu in its OWN window: [hWnd=0x${popup.hWnd.toString(16)}] [class=${popup.className}] — attach it (attach {hWnd}) to drive its items.` : message;
}

function act(element: Element, action: string, text: string | undefined, submit = false): string {
  if (action === 'read') {
    if (element.isPassword) return 'value: (password — withheld)';
    const content = element.value || element.text(); // NOT element.name — returning the label dressed as `value:` is a silent wrong read
    return content.length > 0
      ? `value: ${JSON.stringify(capText(content))}`
      : `(no readable value — control name is ${JSON.stringify(element.name)}; it may be empty or expose no Value/Text pattern — try inspect_element {ref} or read_table)`;
  }
  // Name the RESOLVED control in every result so an LLM gets target confirmation on an ambiguous selector match
  // (the named-result contract computer.ts semanticClick + AI.md:181 already document). One name/role read per action.
  const target = `${element.controlTypeName} ${JSON.stringify(element.name)}`;
  if (action === 'invoke') return withPopupNote(() => patternAction('invoke', () => (element.invoke(), `invoked ${target}`)));
  if (action === 'click') return `${clickElement(element, 'left', false, false)} ${target}`;
  if (action === 'focus') return element.focus(), `focused ${target}`; // UIA SetFocus — cursor-free, no SendInput, so never gated
  if (action === 'type') {
    // Mirror the dedicated `type` tool: cursor-free WM_CHAR to an own-HWND control; SendInput only for a no-own-HWND
    // sub-control. submit presses Enter after (the dedicated type tool's `submit`, which the selector idioms dropped).
    const handle = element.nativeWindowHandle;
    if (handle !== 0n) {
      postText(handle, text ?? '');
      if (submit) postKey(handle, 'Enter');
      return `typed into ${target} cursor-free${submit ? ' and pressed Enter' : ''}`;
    }
    if (cursorDenied) throw new Error('this control has no native window handle for the cursor-free WM_CHAR path, so type would need SendInput — disabled by BUN_UIA_CURSOR=never; use set_value (ValuePattern) to write it cursor-free');
    element.type(text ?? '');
    if (submit) uia.sendKeys('Enter');
    return `typed into ${target}${submit ? ' and pressed Enter' : ''}`;
  }
  if (action === 'set_value') return patternAction('set_value', () => `${setValueSmart(element, text ?? '')} ${target}`);
  if (action === 'toggle') return patternAction('toggle', () => (element.toggle(), `toggled ${target} (state ${element.toggleState})`));
  if (action === 'expand') return withPopupNote(() => patternAction('expand', () => (element.expand(), `expanded ${target}`)));
  if (action === 'collapse') return patternAction('collapse', () => (element.collapse(), `collapsed ${target}`));
  if (action === 'select') return patternAction('select', () => (element.select(), `selected ${target}`)); // cursor-free SelectionItem.Select — select a tab/radio/list-item/cell by name in one call (grid_cell{do:select} advertised this)
  throw new Error(`unknown action ${JSON.stringify(action)} — valid "do" verbs are: read, invoke, click, focus, type, set_value, toggle, expand, collapse, select.`);
}

// A toast/notification popup is a Windows.UI.Core.CoreWindow that User32.EnumWindows (and so list_windows) does NOT
// surface — yet it is fully drivable via attach-by-hWnd. Find any whose subtree carries the NormalToastView /
// ToastCenter automationId — locale-free, since the CoreWindow's own "New notification" name is localized — so the
// agent can attach it by hWnd and read its text + invoke the Dismiss/Settings/action buttons. Best-effort: returns []
// on any failure (never breaks list_windows).
function notificationWindows(): { hWnd: bigint; label: string }[] {
  const found: { hWnd: bigint; label: string }[] = [];
  let root: Element;
  try {
    root = uia.root();
  } catch {
    return found;
  }
  const children = root.children;
  try {
    for (const child of children) {
      if (child.className !== 'Windows.UI.Core.CoreWindow' || child.nativeWindowHandle === 0n) continue;
      const toast = child.find({ automationId: 'NormalToastView' }) ?? child.find({ automationId: 'ToastCenterScrollViewer' }); // server-side scoped FindFirst — cheap, returns null fast on a non-toast CoreWindow
      if (toast === null) continue;
      toast.release();
      found.push({ hWnd: child.nativeWindowHandle, label: child.name.length > 0 ? child.name : 'notification' });
    }
  } finally {
    for (const child of children) child.release();
    root.release();
  }
  return found;
}

// The system-tray "Show hidden icons" overflow flyout opens as a root-child window of class
// TopLevelWindowForOverflowXamlIsland that EnumWindows (and so list_windows) does NOT return — exactly like the
// CoreWindow toasts above. Surface it (when open) so the agent can attach it + invoke a hidden NotifyItemIcon.
// Best-effort: returns undefined on any failure.
function trayFlyoutWindow(): { hWnd: bigint; label: string } | undefined {
  let root: Element;
  try {
    root = uia.root();
  } catch {
    return undefined;
  }
  const children = root.children;
  try {
    for (const child of children)
      if (child.className === 'TopLevelWindowForOverflowXamlIsland' && child.nativeWindowHandle !== 0n) return { hWnd: child.nativeWindowHandle, label: child.name.length > 0 ? child.name : 'system tray overflow' };
    return undefined;
  } finally {
    for (const child of children) child.release();
    root.release();
  }
}

/** A guaranteed-hittable screen point for an element (UIA clickable point, else bounds center). */
function clickPoint(element: Element): { x: number; y: number } | null {
  const clickable = element.clickablePoint;
  if (clickable !== null) return clickable;
  const bounds = element.boundingRectangle;
  if (bounds.width === 0 && bounds.height === 0) return null; // 0×0 + no clickable point → no on-screen location; a coordinate click would misfire to the screen corner
  return { x: bounds.x + Math.floor(bounds.width / 2), y: bounds.y + Math.floor(bounds.height / 2) };
}

/**
 * Click an element CURSOR-FREE first — for a left single-click: UIA invoke → the semantic activation the control
 * supports (toggle a checkbox/switch, select a radio/list/tab item) → posted WM_* click — all work on a background,
 * minimized, occluded, or locked window with no real cursor; the toggle/select steps fire VERIFIABLY where a posted
 * coordinate click is silently dropped on a no-own-HWND WinUI control. Falls back to a real SendInput click only for a
 * left double / right / middle click or when the cursor-free paths fail (and BUN_UIA_CURSOR!=='never').
 */
function clickElement(element: Element, button: 'left' | 'right' | 'middle', doubleClick: boolean, forceCursor: boolean): string {
  if (!forceCursor && doubleClick) {
    // A double-click means "open/activate". Invoke is the pattern that actually navigates an Explorer
    // folder/drive cursor-free on a background window (LegacyIAccessible.DoDefaultAction is a silent no-op on
    // those shell items, so it is only a secondary fallback). A real double-click is the last resort.
    try {
      element.invoke();
      return 'opened (cursor-free, invoke)';
    } catch {
      // no Invoke pattern — try the MSAA default action
    }
    try {
      element.doDefaultAction();
      return 'opened (cursor-free, default action)';
    } catch {
      // no LegacyIAccessible pattern either — fall back to the real double-click below
    }
  }
  if (!forceCursor) {
    if (button === 'left' && !doubleClick) {
      try {
        element.invoke();
        return 'invoked (cursor-free)';
      } catch {
        // no Invoke pattern — try the other semantic activations a left-click maps to
      }
      // A left-click on a toggle/checkbox IS a toggle; on a radio/list/tab item it IS a select. These fire cursor-free
      // and VERIFIABLY (the control's state changes) on a no-own-HWND WinUI control — exactly where a posted COORDINATE
      // click is silently dropped (PostMessage returns nonzero but nothing happens, a false success). Both throw when
      // unsupported, so they only fire on a genuinely togglable/selectable control. (LegacyIAccessible.DoDefaultAction
      // is deliberately NOT in this chain: it can silently no-op, which would just trade one false success for another
      // and skip a coordinate post that would have worked on a legacy own-HWND control.)
      try {
        element.toggle();
        return `toggled (cursor-free, state ${element.toggleState})`;
      } catch {
        // not a TogglePattern control
      }
      try {
        element.select();
        return 'selected (cursor-free)';
      } catch {
        // not a SelectionItemPattern control — fall back to the posted coordinate click
      }
    }
    const point = clickPoint(element);
    if (point === null)
      throw new Error(
        `cannot click ${named(element)} — it has no on-screen location (0×0 bounds, no clickable point), so a coordinate click would misfire to the screen corner. Drive it cursor-free with a pattern verb: toggle / invoke / set_value / select (see inspect_element {ref} can:).`,
      );
    // Post to the element's OWN owner window, never WindowFromPoint — so the click lands on the target even when
    // another window occludes the pixel (the 'drive in the dark' doctrine). Falls back to the topmost-at-pixel
    // (*At) only if the element has no native window in its ancestry. Double + middle get a cursor-free path too.
    const owner = ownerHwnd(element);
    // A posted COORDINATE click cannot land on a window whose pixels are OFF-SCREEN (a minimized window's bounds are
    // ~-32000) — the message would target a phantom point and we'd report a false success. Invoke (above) already
    // handles minimized windows cursor-free; reaching here means this control has no Invoke pattern, so steer the
    // agent to restore the window or use a pattern verb rather than silently miss.
    const screen = virtualScreen();
    if (point.x < screen.x || point.y < screen.y || point.x >= screen.x + screen.width || point.y >= screen.y + screen.height || (owner !== 0n && isMinimized(owner)))
      throw new Error(
        `cannot click ${named(element)} by coordinate — it is off-screen / its window is minimized and it has no Invoke pattern for a cursor-free activate. Restore the window first (manage_window {action:"restore"} — cursor-free, no foreground), then click; or use a pattern verb from inspect_element's can: list (select / toggle / expand).`,
      );
    if (doubleClick) {
      if (owner !== 0n ? postDoubleClickToHwnd(owner, point.x, point.y) : postDoubleClickAt(point.x, point.y)) return 'posted double-click (cursor-free)';
    } else if (owner !== 0n ? postClickToHwnd(owner, point.x, point.y, button) : postClickAt(point.x, point.y, button)) {
      return `posted ${button} click (cursor-free)`;
    }
  }
  if (cursorDenied) throw new Error('cursor-free click was not possible and the real cursor is disabled (BUN_UIA_CURSOR=never)');
  const point = clickPoint(element);
  if (point === null)
    throw new Error(`cannot click ${named(element)} — it has no on-screen location (0×0 bounds, no clickable point). Drive it cursor-free with a pattern verb: toggle / invoke / set_value / select (see inspect_element {ref} can:).`);
  if (doubleClick) doubleClickAt(point.x, point.y);
  else if (button === 'right') rightClickAt(point.x, point.y);
  else if (button === 'middle') middleClickAt(point.x, point.y);
  else clickAt(point.x, point.y);
  return `${doubleClick ? 'double-' : ''}${button === 'left' ? '' : `${button} `}clicked (real cursor)`;
}

/** Detect a blank/near-uniform RGB grab (PrintWindow returns this on a locked or GPU-composited surface). */
function isNearUniform(rgb: Uint8Array): boolean {
  if (rgb.length < 12) return true;
  let minR = 255;
  let maxR = 0;
  let minG = 255;
  let maxG = 0;
  let minB = 255;
  let maxB = 0;
  const stride = Math.max(3, Math.floor(rgb.length / (3 * 4096)) * 3); // ~4096 samples
  for (let index = 0; index + 2 < rgb.length; index += stride) {
    const r = rgb[index]!;
    const g = rgb[index + 1]!;
    const b = rgb[index + 2]!;
    if (r < minR) minR = r;
    if (r > maxR) maxR = r;
    if (g < minG) minG = g;
    if (g > maxG) maxG = g;
    if (b < minB) minB = b;
    if (b > maxB) maxB = b;
  }
  return maxR - minR <= 8 && maxG - minG <= 8 && maxB - minB <= 8;
}

// ROLE_SYSTEM_* (oleacc) → readable name; unmapped roles render as role(N).
const MSAA_ROLES: Record<number, string> = {
  0x09: 'window',
  0x0a: 'client',
  0x0b: 'menupopup',
  0x0c: 'menuitem',
  0x0d: 'tooltip',
  0x0e: 'application',
  0x0f: 'document',
  0x10: 'pane',
  0x29: 'statictext',
  0x2a: 'text',
  0x2b: 'pushbutton',
  0x2c: 'checkbutton',
  0x2d: 'radiobutton',
  0x2e: 'combobox',
  0x32: 'menuitem',
  0x3a: 'list',
  0x3c: 'listitem',
};
function formatMsaa(node: MsaaNode, depth = 0): string {
  const indent = '  '.repeat(depth);
  const role = MSAA_ROLES[node.role] ?? `role(${node.role})`;
  const name = node.name.trim().length > 0 ? ` ${JSON.stringify(node.name)}` : '';
  // accLocation rect → a click_point target: MSAA-only (owner-draw/legacy) content has no UIA ref, but a cursor-free
  // click_point at the element's center acts on it. Emit the center so the agent can drive what UIA can't see.
  const at = node.bounds !== undefined ? ` @${Math.round(node.bounds.x + node.bounds.width / 2)},${Math.round(node.bounds.y + node.bounds.height / 2)} (click_point)` : '';
  let out = `${indent}- ${role}${name}${at}`;
  for (const child of node.children) out += `\n${formatMsaa(child, depth + 1)}`;
  return out;
}

/** Render a read table as a compact markdown table, noting any row truncation. */
function renderTable(table: TableData): string {
  const width = table.rows.reduce((max, row) => Math.max(max, row.length), table.headers.length);
  if (width === 0) return '(empty table)';
  const headers = table.headers.length > 0 ? table.headers : Array.from({ length: width }, (_unused, index) => `col${index + 1}`);
  const escape = (cell: string): string => cell.replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
  const lines = [`| ${headers.map(escape).join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`];
  for (const row of table.rows) lines.push(`| ${Array.from({ length: width }, (_unused, index) => escape(row[index] ?? '')).join(' | ')} |`);
  const hidden = table.totalRows - table.rows.length;
  return hidden > 0 ? `${lines.join('\n')}\n…(${hidden} more rows — raise maxRows)` : lines.join('\n');
}

/** Resolve a file-tool path, enforcing the BUN_UIA_FS_ROOT sandbox when one is set. A purely lexical prefix check
 *  is escapable: a junction/symlink INSIDE the root pointing out passes it, then Bun.file follows the reparse
 *  point out (verified). So after the lexical check, realpath the deepest EXISTING ancestor (a write target may not
 *  exist yet) and re-assert it canonicalizes under the REAL root. */
function resolveFsPath(path: string): string {
  if (fsRoot === undefined || fsRootLower === undefined) return path;
  const resolved = resolve(fsRoot, path);
  const resolvedLower = resolved.toLowerCase(); // case-insensitive compare (Windows FS); resolved (original case) is returned for the real read
  if (resolvedLower !== fsRootLower && !resolvedLower.startsWith(`${fsRootLower}\\`) && !resolvedLower.startsWith(`${fsRootLower}/`)) throw new Error(`path is outside the allowed root ${fsRoot}`);
  const rootLower = fsRootRealLower ?? fsRootLower;
  let ancestor = resolved;
  for (;;) {
    try {
      const real = realpathSync.native(ancestor);
      // relative() (not a manual slice) so a drive-root ancestor like `C:\` — which already ends in a separator —
      // does not drop the first char of the remainder (the off-by-one that wrongly blocked a not-yet-created child
      // of a bare drive root).
      const candidate = ancestor === resolved ? real : resolve(real, relative(ancestor, resolved));
      const candidateLower = candidate.toLowerCase();
      if (candidateLower !== rootLower && !candidateLower.startsWith(rootLower + sep)) throw new Error(`path escaped the allowed root ${fsRoot} via a reparse point`);
      return resolved;
    } catch (error) {
      if ((error as { code?: string }).code !== 'ENOENT') throw error;
      const parent = resolve(ancestor, '..');
      if (parent === ancestor) throw new Error(`path is outside the allowed root ${fsRoot}`);
      ancestor = parent;
    }
  }
}

const ELEMENT_DESC = 'A human-readable LABEL for the permission prompt + intent ONLY — it does NOT select the control. You must still target with `ref` (from the latest snapshot) or `selector`.';
const REF_DESC =
  'Exact target element reference from the LATEST snapshot, passed verbatim including its #generation tag (e.g. e49#3). A ref from before a re-render is rejected (so you never act on the wrong control) — re-read the latest snapshot and use its refs.';
const HWND_DESC = 'Target window handle — a decimal/0x-hex string or a JSON number; omit to use the attached window.';
const SELECTOR_SCHEMA = {
  type: 'object',
  description: 'Match a control by one or more fields (AND-ed). Aliases are accepted and folded onto these keys: role/type → controlType; id → automationId; label/accessibleName/title → name.',
  properties: {
    name: { type: 'string' },
    nameContains: { type: 'string' },
    automationId: { type: 'string' },
    className: { type: 'string' },
    controlType: { type: ['number', 'string'], description: 'UIA control-type — a number (50000), or a role NAME (Button, Edit, List, Tree, TreeItem, …)' },
  },
};

const TOOLS: McpTool[] = [
  {
    name: 'list_windows',
    category: 'read',
    description:
      'List visible top-level windows (title, className, processId, exe, hWnd, minimized/maximized/foreground, integrity). Start here. A visible toast/notification popup is appended as an attachable "notification" row (hWnd) — EnumWindows never returns it, so attach it by hWnd to read its text + invoke its Dismiss/Settings/action buttons. Set includePopups:true to ALSO list untitled popups — a combobox dropdown, classic #32768 context menu, or WPF/WinUI Popup opens in its own untitled window; list it, then attach it by hWnd to see + invoke its items.',
    inputSchema: { type: 'object', properties: { includePopups: { type: 'boolean', description: 'Also include untitled popup windows (dropdowns / context menus / autocomplete) so you can attach + drive them.' } } },
  },
  {
    name: 'attach',
    category: 'read',
    description:
      'Attach to a top-level window as the active root for snapshots and actions. Prefer an hWnd from list_windows or an exact title. className attaches only to the single VISIBLE window of that class — reliable for single-window classes (e.g. Shell_TrayWnd, the taskbar + system tray) but it refuses or asks you to disambiguate for the Chromium/Electron family (Discord, Slack, VS Code, Teams, Edge — all Chrome_WidgetWin_1), where it would otherwise grab an invisible helper. Provide a title (matched exactly, or as a case-insensitive substring when no exact match — ambiguous substrings list candidates to pick by hWnd), a className, an hWnd, or a processId. Works on a minimized/background window. Returns a fresh ref-keyed snapshot immediately — act on those refs; no follow-up desktop_snapshot is needed.',
    inputSchema: {
      type: 'object',
      properties: { title: { type: 'string' }, hWnd: { type: ['string', 'number'], description: 'Handle as a decimal/0x-hex string or a JSON number' }, processId: { type: 'number' }, className: { type: 'string' } },
    },
  },
  {
    name: 'desktop_snapshot',
    category: 'read',
    description:
      'Capture the attached window as a compact ref-keyed UIA tree (e.g. Button "Five" [ref=e49#1]). Better than a screenshot for acting; every interactable node carries a [ref=eN#G] you pass VERBATIM to action tools. Refs are valid ONLY until the next re-render — a stale-generation ref is rejected, not mis-resolved.',
    inputSchema: {
      type: 'object',
      properties: {
        maxDepth: { type: 'number', description: 'Cap tree depth (default 40)' },
        root: { type: 'string', description: "Re-ground on just one element's subtree (zoom into a large window): the name or automationId of a node from a prior snapshot. Combine with maxDepth." },
      },
    },
  },
  {
    name: 'find_and_act',
    category: 'input',
    description:
      'Find a control and act in one call. Target by ref (from the latest snapshot) OR selector. A selector acts on the FIRST match — if it could be ambiguous, pass a ref or a tighter selector (add automationId/controlType). Action is invoke|click|focus|type|set_value|toggle|expand|collapse|select|read (select = cursor-free SelectionItem for a tab/radio/list-item; focus = UIA SetFocus).',
    inputSchema: {
      type: 'object',
      properties: {
        element: { type: 'string', description: ELEMENT_DESC },
        ref: { type: 'string', description: REF_DESC },
        selector: SELECTOR_SCHEMA,
        do: { type: 'string', enum: ['invoke', 'click', 'type', 'set_value', 'toggle', 'expand', 'collapse', 'select', 'focus', 'read'] },
        text: { type: 'string', description: 'Text for type / set_value' },
        submit: { type: 'boolean', description: 'Press Enter after a type' },
      },
      required: ['do'],
    },
  },
  {
    name: 'reveal',
    category: 'input',
    description:
      'Scroll a VIRTUALIZED / off-screen list, grid, or tree item into view by selector, then optionally act on it. Use when a desktop_snapshot omits an item because it is scrolled out of view (Explorer folders, long lists, data grids, horizontal carousels) — those rows are not in the a11y tree until realized. Scans the container vertically (primary) and, when it only scrolls horizontally, along the horizontal axis. Cursor-free, no focus. do = invoke|click|focus|type|set_value|toggle|select|read (select = cursor-free SelectionItem; focus = UIA SetFocus); omit do to just bring it into the next snapshot (it then has a ref).',
    inputSchema: {
      type: 'object',
      properties: {
        element: { type: 'string', description: ELEMENT_DESC },
        selector: SELECTOR_SCHEMA,
        do: { type: 'string', enum: ['invoke', 'click', 'type', 'set_value', 'toggle', 'select', 'focus', 'read'] },
        text: { type: 'string', description: 'Text for type / set_value' },
        submit: { type: 'boolean', description: 'Press Enter after a type' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'click',
    category: 'input',
    description:
      "Click a control. CURSOR-FREE by default for EVERY button (left/right/middle) and doubleClick — for a left single-click: UIA invoke, else the semantic activation the control actually supports (toggle a checkbox/switch, select a radio/list/tab item), else a posted WM_*BUTTON to the control's own window — so a click on a no-own-HWND WinUI ToggleSwitch/radio truly fires (not a silently-dropped coordinate click that falsely reports success). Reports what it did (invoked / toggled / selected / posted). A control that ONLY opens a dropdown/flyout (a WinUI/WPF combobox or expander — ExpandCollapse only, no Invoke) is NOT opened by click; use the dedicated expand/collapse verb cursor-free. Works on a background/minimized/occluded/locked window with no real cursor. Pass cursor:true to FORCE the real SendInput mouse (needs an unlocked, foregrounded desktop); the real mouse is also the automatic fallback when no cursor-free path applies.",
    inputSchema: {
      type: 'object',
      properties: {
        element: { type: 'string', description: ELEMENT_DESC },
        ref: { type: 'string', description: REF_DESC },
        button: { type: 'string', enum: ['left', 'right', 'middle'] },
        doubleClick: { type: 'boolean' },
        cursor: { type: 'boolean', description: 'Force a real SendInput cursor click instead of the cursor-free path' },
      },
      required: ['ref'],
    },
  },
  {
    name: 'context_menu',
    category: 'input',
    description:
      "Open a control's right-click context menu CURSOR-FREE via UIA (IUIAutomationElement3::ShowContextMenu — no real mouse). Provider-dependent: when it works, the menu opens as an untitled popup whose hWnd is returned — attach it (attach {hWnd}) to read/invoke its items. If no menu appears (the provider does not support it), it says so — fall back to a real-cursor right-click: click {ref, button:'right', cursor:true}.",
    inputSchema: { type: 'object', properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC } }, required: ['ref'] },
  },
  {
    name: 'invoke',
    category: 'input',
    description:
      "Invoke a control via the UIA Invoke pattern (buttons, links) — cursor-free, works on a background/locked window. If it opens a flyout/menu in its OWN window, that popup's hWnd is returned automatically — attach it to drive its items.",
    inputSchema: { type: 'object', properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC } }, required: ['ref'] },
  },
  {
    name: 'focus',
    category: 'input',
    description:
      'Move keyboard focus to a control by ref (UIA SetFocus) — CURSOR-FREE (no SendInput), works under BUN_UIA_CURSOR=never and on a WinUI/WPF/Electron sub-control with NO own window handle. A subsequent press_key chord / Tab / arrow then lands on the focused control via SendInput, so that step needs an unlocked, foregrounded desktop (under BUN_UIA_CURSOR=never a no-own-HWND control has NO key path — drive it by intent: invoke / select / set_value instead). Prefer invoke/set_value/toggle when a pattern exists.',
    inputSchema: { type: 'object', properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC } }, required: ['ref'] },
  },
  {
    name: 'type',
    category: 'input',
    description:
      'Type Unicode text into an editable control. Cursor-free when the control has its own window handle (WM_CHAR — no focus, works minimized/background/locked); falls back to SendInput keystrokes for a WinUI/WPF/Chromium sub-control with no own HWND (that path needs an unlocked desktop and is refused under BUN_UIA_CURSOR=never). Prefer set_value when the control supports the Value pattern.',
    inputSchema: {
      type: 'object',
      properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC }, text: { type: 'string' }, submit: { type: 'boolean', description: 'Press Enter after' } },
      required: ['ref', 'text'],
    },
  },
  {
    name: 'set_value',
    category: 'input',
    description: 'Set a control value directly via the UIA Value pattern — no keystrokes, works on a background/locked window. A numeric value on a slider/spinner sets it via the RangeValue pattern.',
    inputSchema: { type: 'object', properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC }, value: { type: 'string' } }, required: ['ref', 'value'] },
  },
  {
    name: 'toggle',
    category: 'input',
    description: 'Toggle a checkbox or toggle button via the UIA Toggle pattern (cursor-free).',
    inputSchema: { type: 'object', properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC } }, required: ['ref'] },
  },
  {
    name: 'expand',
    category: 'input',
    description:
      "Expand a control via the UIA ExpandCollapse pattern — a combobox dropdown, tree node, split button, or menu — cursor-free, no focus (Invoke/posted clicks do NOT open these on WinUI/WPF/Chromium). If the list opens in its OWN window, that popup's hWnd is returned automatically (attach it to select items); otherwise desktop_snapshot to read the revealed items.",
    inputSchema: { type: 'object', properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC } }, required: ['ref'] },
  },
  {
    name: 'collapse',
    category: 'input',
    description: 'Collapse a control via the UIA ExpandCollapse pattern (combobox / tree node) — cursor-free.',
    inputSchema: { type: 'object', properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC } }, required: ['ref'] },
  },
  {
    name: 'select',
    category: 'input',
    description:
      'Select a list/grid/tree item via the UIA SelectionItem pattern — cursor-free, works on a background/locked window. mode: replace (default, clears other selections), add (multi-select — keeps the others), remove (deselect). The returned snapshot marks selected refs (selected).',
    inputSchema: {
      type: 'object',
      properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC }, mode: { type: 'string', enum: ['replace', 'add', 'remove'] } },
      required: ['ref'],
    },
  },
  {
    name: 'find_text',
    category: 'input',
    description:
      'Find a substring inside a text/document control and SELECT it — cursor-free, the desktop analog of getByText. Target the Document/Edit ref; the match becomes the active text selection so you can then copy it, replace just that match (type or paste over it — NOT set_value, which overwrites the WHOLE control), or read it. Returns the matched text, or "not found".',
    inputSchema: {
      type: 'object',
      properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC }, text: { type: 'string' }, ignoreCase: { type: 'boolean' } },
      required: ['ref', 'text'],
    },
  },
  {
    name: 'wait_for',
    category: 'read',
    description:
      'Wait until a control matching the selector APPEARS in the attached window (or, with gone:true, until it DISAPPEARS — the spinner / "Loading…" / progress-bar / just-dismissed-modal gate), then return a fresh snapshot. On timeout, throws quoting the nearest candidates (appear) or the still-present selector (gone).',
    inputSchema: {
      type: 'object',
      properties: {
        selector: SELECTOR_SCHEMA,
        gone: { type: 'boolean', description: 'Wait for the control to DISAPPEAR instead of appear (spinner/loading/modal-dismissed).' },
        timeout: { type: 'number', description: 'Milliseconds (default 5000)' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'wait_idle',
    category: 'read',
    description:
      'Block until the attached window stops changing (its tree is stable for quietMs), then return a fresh snapshot. Use after an action that triggers async rendering; pair with wait_for_window when you are waiting on a NEW window rather than the current one settling.',
    inputSchema: { type: 'object', properties: { quietMs: { type: 'number', description: 'Stable-for window in ms (default 400)' }, timeout: { type: 'number', description: 'Max wait in ms (default 5000)' } } },
  },
  {
    name: 'wait_for_window',
    category: 'read',
    description:
      'Wait until a top-level window matching title (substring) / className / process appears ANYWHERE on the desktop — driven by a SetWinEventHook event hook, not polling — then return its title/className/processId/hWnd. Resolves immediately if one is already open. Use to gate on a dialog, a just-launched app, or a page finishing navigation. Omit all fields to wait for any new window. Pass {gone:true} to instead wait until a matching window CLOSES/disappears (a dialog dismissed, a splash/progress window finishing, an app exiting) — resolves immediately if none is open.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        className: { type: 'string' },
        process: { type: 'number' },
        gone: { type: 'boolean', description: 'Wait for a matching window to CLOSE/disappear instead of appear' },
        timeout: { type: 'number', description: 'Milliseconds (default 30000)' },
      },
    },
  },
  {
    name: 'wait_for_process',
    category: 'read',
    description:
      'Wait until a process whose image name contains the given text is running (e.g. "chrome.exe"), then return its pid. Resolves immediately if already running. Use to trigger work the moment a process the agent is waiting on spawns.',
    inputSchema: { type: 'object', properties: { name: { type: 'string' }, timeout: { type: 'number', description: 'Milliseconds (default 30000)' } }, required: ['name'] },
  },
  {
    name: 'list_processes',
    category: 'read',
    description: 'List running processes as {processId, name} (optionally filtered by an image-name substring). Pair with wait_for_process / launch_app / attach by process.',
    inputSchema: { type: 'object', properties: { filter: { type: 'string', description: 'Case-insensitive image-name substring' } } },
  },
  {
    name: 'ocr',
    category: 'read',
    description:
      'READ TEXT out of the raw PIXELS of the attached window (or a given hWnd, or a screen region) via Windows OCR — for surfaces with NO accessibility tree: a <canvas>/WebGL app, a game, a video frame, a remote-desktop session, a chart, a scanned document, an image. Captures even occluded/GPU/background windows (WGC). Returns each line with a SCREEN-pixel bounding box; click recognized text with click_point at a box centre.',
    inputSchema: {
      type: 'object',
      properties: {
        hWnd: { type: ['string', 'number'], description: HWND_DESC },
        region: { type: 'object', description: 'Screen region {x,y,width,height} to OCR instead of a window', properties: { x: { type: 'number' }, y: { type: 'number' }, width: { type: 'number' }, height: { type: 'number' } } },
      },
    },
  },
  {
    name: 'click_point',
    category: 'input',
    description:
      "Click at absolute SCREEN pixel coordinates — a cursor-free posted click by default (no real cursor move), or cursor:true for a real SendInput click. The posted click goes to whatever window is TOPMOST at that pixel, so confirm the pixel belongs to your target (inspect_point / capture_window) when windows overlap; for a known control prefer click/invoke by ref, which targets the control's OWN window even when occluded. Pairs with ocr / inspect_point / screenshot_marked to click something that has no ref (pixel-only UI).",
    inputSchema: {
      type: 'object',
      properties: { x: { type: 'number' }, y: { type: 'number' }, button: { type: 'string', enum: ['left', 'right'] }, cursor: { type: 'boolean', description: 'Force a real SendInput cursor click' } },
      required: ['x', 'y'],
    },
  },
  {
    name: 'click_text',
    category: 'input',
    description:
      'OCR the attached window (or a hWnd) and click the on-screen text matching `text` (case-insensitive substring) at its box centre — cursor-free. The one-call "click what it says" for a PIXEL-ONLY surface with no ref/a11y (game, <canvas>/WebGL, remote desktop, video). Prefer a snapshot ref when one exists; this is the fallback. Returns what was clicked, or the nearest text it did find.',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string' }, hWnd: { type: ['string', 'number'], description: HWND_DESC }, cursor: { type: 'boolean', description: 'Force a real SendInput cursor click' } },
      required: ['text'],
    },
  },
  {
    name: 'screenshot',
    category: 'read',
    description:
      'Capture the attached window as a PNG. Tries PrintWindow, then Windows.Graphics.Capture (sees occluded/background/GPU-composited content) when PrintWindow renders blank, then a desktop-region grab. For the whole desktop or a 2nd monitor use screen_capture; for a specific occluded window by ref/hWnd use capture_window.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'capture_window',
    category: 'read',
    description:
      'Capture the LIVE pixels of a window via Windows.Graphics.Capture — sees it even when occluded, in the background, minimized-then-restored, or GPU-composited (hardware-accel Chromium/Edge/Electron, games, WinUI) that the plain screenshot returns blank for, the way Alt+Tab previews do. No foregrounding. Target a ref or hWnd; omit both for the attached window.',
    inputSchema: { type: 'object', properties: { ref: { type: 'string', description: REF_DESC }, hWnd: { type: ['string', 'number'], description: HWND_DESC } } },
  },
  {
    name: 'screen_capture',
    category: 'read',
    description:
      'Capture the WHOLE virtual desktop (all monitors) or a region as a PNG via BitBlt+CAPTUREBLT — the only path that sees a 2nd monitor, a game/canvas/WebGL surface, DWM-composited or overlay output, or anything with no window attached. Omit the region for the full desktop.',
    inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, width: { type: 'number' }, height: { type: 'number' } } },
  },
  {
    name: 'screenshot_marked',
    category: 'read',
    description:
      'Capture the attached window as a Set-of-Marks PNG: numbered red boxes drawn over every interactable control (derived from ground-truth UIA bounds, not a vision guess) plus a legend mapping each number to its ref/role/name. Marks are window-local; blank on a locked session (PrintWindow).',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'inspect_point',
    category: 'read',
    description: 'Identify the UIA control at a screen pixel (role, name, automationId, className, bounds) — turn a pixel from screen_capture into a ground-truth control. Coordinates are virtual-screen absolute.',
    inputSchema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] },
  },
  {
    name: 'inspect_element',
    category: 'read',
    description:
      'Dump the full live state of one ref: role, name, automationId, className, bounds, enabled, value, toggle/expand/selected/range/scroll state, clickable point, native window handle, TextPattern body, and a "can:" list of the actions the control actually supports (invoke/set_value/toggle/expand/collapse/select/scroll/read-text/read-table) — pick the verb from that list instead of guessing from the role, since a Button may only expand and invoke can silently no-op. A password field is shown as "(password)" with its value withheld. Read state without round-tripping through the tree.',
    inputSchema: { type: 'object', properties: { ref: { type: 'string', description: REF_DESC } }, required: ['ref'] },
  },
  {
    name: 'read_table',
    category: 'read',
    description:
      'Read a data grid / list / table (Explorer details view, a DataGrid, a spreadsheet-like control) as structured rows — UIA GridPattern cell-by-cell, with column headers when available. Target a ref from the latest snapshot (the List/DataGrid/Table node). Returns a markdown table; far cheaper and more reliable than reading cells from a screenshot. To ACT on one cell (edit/toggle/invoke/select it), use grid_cell {ref, row, column, do}.',
    inputSchema: { type: 'object', properties: { ref: { type: 'string', description: REF_DESC }, maxRows: { type: 'number', description: 'Cap rows read (default 100)' } }, required: ['ref'] },
  },
  {
    name: 'grid_cell',
    category: 'input',
    description:
      'Act on a single data-grid cell by (row, column) — the editable-grid path read_table (read-only) cannot reach. Target the GridPattern container ref (the List/DataGrid/Table node, same as read_table), give 0-based row+column, and a verb: read (default), set_value, invoke, toggle, select, click. Cursor-free (UIA pattern on the cell). Use read_table first to see the extent + which column is which.',
    inputSchema: {
      type: 'object',
      properties: {
        element: { type: 'string', description: ELEMENT_DESC },
        ref: { type: 'string', description: REF_DESC },
        row: { type: 'number', description: '0-based row index' },
        column: { type: 'number', description: '0-based column index' },
        do: { type: 'string', enum: ['read', 'set_value', 'invoke', 'toggle', 'select', 'click'], description: 'What to do to the cell (default read)' },
        text: { type: 'string', description: 'Value for set_value' },
      },
      required: ['ref', 'row', 'column'],
    },
  },
  {
    name: 'list_views',
    category: 'read',
    description:
      "List a container's view modes (UIA MultipleViewPattern) — e.g. File Explorer's Items View: current + supported {id, name} like Details/List/Large icons/Tiles/Content. Target the ref of the List/DataGrid/items container. Empty if the control has no MultipleView pattern.",
    inputSchema: { type: 'object', properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC } }, required: ['ref'] },
  },
  {
    name: 'set_view',
    category: 'input',
    description:
      'Switch a container to a view mode CURSOR-FREE (UIA MultipleViewPattern.SetCurrentView) — e.g. flip File Explorer to Details to make read_table work. Pass a view `id` from list_views. No focus, no cursor, works on a background window.',
    inputSchema: {
      type: 'object',
      properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC }, id: { type: 'number', description: 'A view id from list_views' } },
      required: ['ref', 'id'],
    },
  },
  {
    name: 'native_tree',
    category: 'read',
    description: 'The raw native Win32 window hierarchy (HWND class, control id, WS_*/WS_EX_* styles, rect) — the Spy++ view, for classic-Win32 / owner-draw windows where the UIA tree is sparse. Reads any window, foreground or not.',
    inputSchema: { type: 'object', properties: { hWnd: { type: ['string', 'number'], description: HWND_DESC }, maxDepth: { type: 'number', description: 'Default 12' } } },
  },
  {
    name: 'msaa_tree',
    category: 'read',
    description: 'The MSAA (oleacc IAccessible) tree of a window — the legacy fallback for owner-draw apps that expose no useful UIA tree.',
    inputSchema: { type: 'object', properties: { hWnd: { type: ['string', 'number'], description: HWND_DESC }, maxDepth: { type: 'number', description: 'Default 8' } } },
  },
  {
    name: 'list_monitors',
    category: 'read',
    description: 'List the physical monitors (index, full bounds, work area, primary flag) — the geometry an agent needs to place windows or pick a region to screen_capture.',
    inputSchema: { type: 'object', properties: {} },
  },
  { name: 'get_focused', category: 'read', description: 'Return the desktop element that currently has keyboard focus (role, name, automationId, bounds).', inputSchema: { type: 'object', properties: {} } },
  {
    name: 'press_key',
    category: 'input',
    description:
      'Send a key or chord, e.g. "Enter", "Control+S", "Control+Shift+Tab", "F4". With a ref AND a single key (no chord), posts the key to that control cursor-free (background/occluded/locked OK, no focus). On a control with its OWN window handle the everyday edit chords are ALSO cursor-free — Control+A/C/X/V/Z map to posted EM_SETSEL/WM_COPY/WM_CUT/WM_PASTE/EM_UNDO (no focus, locked/background OK). Any other chord with a ref FOCUSES it first (cursor-free UIA SetFocus) then sends synthetic input (needs an unlocked foregrounded desktop). With no ref, the key/chord goes to whatever currently holds focus.',
    inputSchema: { type: 'object', properties: { key: { type: 'string' }, element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC } }, required: ['key'] },
  },
  {
    name: 'scroll',
    category: 'input',
    description:
      'Scroll a control (cursor-free; works on a locked/background/minimized window). direction up/down/left/right scrolls the nearest ScrollPattern container by `amount` small steps (or a posted wheel on a ScrollPattern-less own-HWND control). direction top/bottom jumps to the start/end, page-up/page-down/page-left/page-right move one page (×`amount`) — these need a ScrollPattern. `to` (0-100) jumps to that percent (vertical unless direction is left/right). Without a direction or `to`, scrolls the ref into view via the ScrollItem pattern.',
    inputSchema: {
      type: 'object',
      properties: {
        element: { type: 'string', description: ELEMENT_DESC },
        ref: { type: 'string', description: REF_DESC },
        direction: { type: 'string', enum: ['up', 'down', 'left', 'right', 'top', 'bottom', 'page-up', 'page-down', 'page-left', 'page-right'] },
        amount: { type: 'number', description: 'Scroll steps / pages (default 3 for small steps, 1 for pages)' },
        to: { type: 'number', description: 'Scroll to this percent (0-100); vertical unless direction is left/right' },
      },
      required: ['ref'],
    },
  },
  {
    name: 'drag',
    category: 'input',
    description:
      'Press-drag-release. By DEFAULT uses the REAL mouse (drag-drop an icon/file, move a slider) — needs an unlocked, foregrounded desktop. {select:true} instead does a CURSOR-FREE drag (text selection / marquee-select) by posting mouse messages to a {ref} control with its OWN window handle (classic Edit/RichEdit/ListView) — works background/occluded/locked, but it cannot drag-DROP (for a drop use the real-mouse default). Target raw points {fromX,fromY,toX,toY} or a ref start {ref,toX,toY}. Under BUN_UIA_CURSOR=never a real drag is disabled, but a {ref} with its own window handle auto-falls-back to the cursor-free drag-select.',
    inputSchema: {
      type: 'object',
      properties: {
        element: { type: 'string', description: ELEMENT_DESC },
        ref: { type: 'string', description: REF_DESC },
        fromX: { type: 'number' },
        fromY: { type: 'number' },
        toX: { type: 'number' },
        toY: { type: 'number' },
        select: { type: 'boolean', description: 'Cursor-free drag-SELECT (text / marquee) via posted mouse messages on an own-HWND {ref} — no real cursor; cannot drag-drop' },
      },
      required: ['toX', 'toY'],
    },
  },
  {
    name: 'hold_key',
    category: 'input',
    description:
      'Press and hold a key for durationMs, then release (e.g. an arrow-repeat or a game key). With a ref to a control that has its OWN window handle, the hold is posted cursor-free (a WM_KEYDOWN autorepeat stream — no focus, background/occluded/locked OK); without a ref (or for a sub-control with no own HWND) it uses SendInput to the focused window, which needs an unlocked foregrounded desktop.',
    inputSchema: {
      type: 'object',
      properties: { key: { type: 'string' }, durationMs: { type: 'number', description: 'Default 1000' }, element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC } },
      required: ['key'],
    },
  },
  {
    name: 'manage_window',
    category: 'window',
    description:
      'Move/resize/minimize/maximize/restore/raise/snap/close a window WITHOUT activating it (works on a background window; raise is a best-effort z-order restack, not a true bring-to-front). move needs x,y,width,height. snap needs edge (left/right/top/bottom half, or center) — tiles the window on its monitor cursor-free, no Win+arrow.',
    inputSchema: {
      type: 'object',
      properties: {
        hWnd: { type: ['string', 'number'], description: HWND_DESC },
        ref: { type: 'string', description: REF_DESC },
        action: { type: 'string', enum: ['move', 'minimize', 'maximize', 'restore', 'raise', 'snap', 'close'] },
        edge: { type: 'string', enum: ['left', 'right', 'top', 'bottom', 'center'], description: 'Target for snap' },
        x: { type: 'number' },
        y: { type: 'number' },
        width: { type: 'number' },
        height: { type: 'number' },
      },
      required: ['action'],
    },
  },
  {
    name: 'read_clipboard',
    category: 'read',
    description:
      'Read the Windows clipboard as text. Pairs with copy (Ctrl+C) to pull selected text from any app, even one with no a11y tree. If the clipboard holds copied FILES instead of text (Explorer Ctrl+C/Cut → CF_HDROP), lists their full paths — so the Explorer copy/paste workflow is visible.',
    inputSchema: { type: 'object', properties: {} },
  },
  { name: 'set_clipboard', category: 'input', description: 'Set the Windows clipboard text (does not paste).', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  {
    name: 'paste',
    category: 'input',
    description:
      'Paste text via the clipboard — the reliable large-text path. With a ref whose control has its own window handle it is cursor-free (sets the clipboard, then WM_PASTE — no focus, works minimized/background/locked); otherwise it focuses + Ctrl+V via SendInput (needs an unlocked desktop, refused under BUN_UIA_CURSOR=never). Omit text to paste the current clipboard. Prefer set_value when the control supports the Value pattern.',
    inputSchema: {
      type: 'object',
      properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC }, text: { type: 'string', description: 'Text to paste (omit to paste the current clipboard)' } },
    },
  },
  {
    name: 'copy',
    category: 'input',
    description:
      "Copy selected text and return it. With a ref, reads that ref's selection via UIA TextPattern and writes the clipboard CURSOR-FREE (no focus, works locked/background; composes with find_text, which selects a substring cursor-free). If the ref has no TextPattern selection but is a classic Edit with its own HWND, it select-alls + WM_COPYs that control cursor-free. Without a ref, falls back to Ctrl+C of the active control (works on an app with no a11y tree).",
    inputSchema: { type: 'object', properties: { ref: { type: 'string', description: 'Ref whose current selection to copy cursor-free (TextPattern → clipboard).' } } },
  },
  {
    name: 'cut',
    category: 'input',
    description:
      "Cut a control's text to the clipboard and return it. Cursor-free for a classic Edit with its own window handle (select-all when nothing is selected, then WM_CUT — no focus, works minimized/background/locked); for a WinUI/Chromium sub-control with no own HWND it focuses + Ctrl+X via SendInput (needs an unlocked desktop, refused under BUN_UIA_CURSOR=never). Refuses a password field.",
    inputSchema: { type: 'object', properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC } }, required: ['ref'] },
  },
  {
    name: 'launch_app',
    category: 'os',
    description:
      'Start a program by name (notepad, calc) OR an App-Paths / Store-alias exe a bare $PATH spawn can\'t find (mspaint, winword, excel, wt) — it falls back to ShellExecuteW automatically. With a title/className, waits for its window and attaches (returns a snapshot); otherwise just spawns it. Gated — disabled unless the server policy enables the "os" category.',
    inputSchema: {
      type: 'object',
      properties: { command: { type: 'string', description: 'Executable + args, space-separated (e.g. "notepad.exe")' }, title: { type: 'string' }, className: { type: 'string' }, timeout: { type: 'number' } },
      required: ['command'],
    },
  },
  {
    name: 'run_program',
    category: 'os',
    description:
      'Run a console command and return its exit code, stdout, and stderr. For programs that exit on their own (CLI tools). NOT for GUI apps or servers that keep running — those are killed after timeoutMs (default 30000) and you get partial output; launch GUI apps with launch_app instead. Gated behind the "os" policy category.',
    inputSchema: {
      type: 'object',
      properties: { command: { type: 'string' }, args: { type: 'array', items: { type: 'string' } }, timeoutMs: { type: 'number', description: 'Kill the process and return partial output after this many ms (default 30000, max 300000).' } },
      required: ['command'],
    },
  },
  {
    name: 'open_path',
    category: 'os',
    description: 'Open a file, folder, or URL with its default handler (Explorer/browser). Gated behind the "os" policy category.',
    inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
  },
  {
    name: 'read_file',
    category: 'fs',
    description: 'Read a text file (first 20k chars). Gated behind the "fs" policy category; restricted to BUN_UIA_FS_ROOT when set.',
    inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
  },
  {
    name: 'write_file',
    category: 'fs',
    description: 'Write a text file (overwrites). Gated behind the "fs" policy category; restricted to BUN_UIA_FS_ROOT when set.',
    inputSchema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] },
  },
  {
    name: 'list_dir',
    category: 'fs',
    description: 'List a directory (names + dir/file kind). Gated behind the "fs" policy category; restricted to BUN_UIA_FS_ROOT when set.',
    inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
  },
];

// Annotation policy: read tools are read-only; the rest mutate state (destructive); os tools reach beyond the
// local desktop (open-world); setters/copies are idempotent. Hosts use these to drive their permission UI.
const IDEMPOTENT = new Set(['copy', 'set_clipboard', 'set_value']);
for (const tool of TOOLS) {
  const readOnly = tool.category === 'read';
  tool.annotations = { openWorldHint: tool.category === 'os', ...(readOnly ? { readOnlyHint: true } : { destructiveHint: true }), ...(IDEMPOTENT.has(tool.name) ? { idempotentHint: true } : {}) };
}

// Window-class prefixes whose app content is an architectural a11y blind spot — UIA AND MSAA expose only the frame,
// so a near-empty tree is NOT a cold tree or a pixel-only surface. Steer the agent to the pixel/OCR path (and, for
// Java, to the Access Bridge) instead of letting it stall on an empty tree.
const BLIND_SPOTS: { test: RegExp; note: string }[] = [
  {
    test: /^SunAwt/,
    note: 'Java Swing/AWT window — its controls are invisible to UIA and MSAA (you will see only the frame). Java exposes its tree via the Java Access Bridge: run `jabswitch /enable` and RESTART the app, then re-attach. Until then, screen_capture + ocr / click_text is the only way to read/drive it.',
  },
  { test: /^Tk/, note: 'Tk/Tkinter window — its widgets are custom-drawn with no a11y bridge, invisible to UIA and MSAA (you will see only anonymous panes). screen_capture + ocr / click_text is the only way to read/drive it.' },
  {
    test: /^FLUTTER_RUNNER_WIN32_WINDOW$/,
    note: 'Flutter desktop window — it renders into a child FLUTTERVIEW whose semantics tree is often NOT exposed to generic UIA clients (you may see a single pane / near-empty tree). It MAY populate — re-snapshot once; if it stays near-empty, screen_capture + ocr / click_text is the way to read/drive it.',
  },
];

/** Run a pattern action; on a "not supported" throw, append the recovery hint that points at inspect_element's
 *  `can:` affordance list — so a verb on the wrong control steers the agent to a verb it DOES support. Every
 *  pattern verb routes through here: the standalone invoke/set_value/toggle/expand/collapse/select handlers AND
 *  the find_and_act/reveal verbs via act(). (set_value wraps the setValueSmart CALL SITE, so its RangeValue +
 *  WM_SETTEXT fallbacks still run and only the final exhausted throw is annotated.) */
function patternAction<T>(verb: string, run: () => T): T {
  try {
    return run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // A MINIMIZED WinUI/UWP window suspends its UIA tree, so a pattern verb fails with a misleading error — steer to the
    // cursor-free restore (the real unblock) rather than the generic "this control may not support …" can:-list loop.
    if (attached !== null && isMinimized(attached.hWnd))
      throw new Error(`${message} — the attached window is MINIMIZED, so its WinUI/UWP UIA tree may be suspended; restore it first (manage_window {action:"restore"} — cursor-free, no foreground), then retry ${verb}.`);
    throw new Error(`${message} — this control may not support ${verb}; call inspect_element {ref} and pick a verb from its 'can:' list`);
  }
}

/** A steering note when the attached window is a known a11y blind spot (class-prefix match), else ''. */
function blindSpotNote(className: string): string {
  const hit = BLIND_SPOTS.find((entry) => entry.test.test(className));
  return hit !== undefined ? `\n\n⚠ This is a ${hit.note}` : '';
}

const HANDLERS: Record<string, ToolHandler> = {
  list_windows: (args) => {
    const fg = foregroundWindow();
    const lines = uia.windows({ includeUntitled: args.includePopups === true }).map((window) => {
      const state = [isMinimized(window.hWnd) ? 'min' : '', isMaximized(window.hWnd) ? 'max' : '', window.hWnd === fg ? 'fg' : ''].filter(Boolean).join(',');
      const exe = processImagePath(window.processId).split('\\').pop() ?? '';
      const integrity = integrityLevel(window.processId);
      const wall = integrity === 'high' || integrity === 'system' ? ` [${integrity}-integrity — UIPI wall: drivable only if YOUR host runs elevated too]` : integrity === 'low' || integrity === 'untrusted' ? ` [${integrity}-integrity]` : '';
      // The placeholder UAC leaves on the NORMAL desktop while a consent is pending — the real prompt is on the secure
      // desktop, so this window is undrivable; flag it so the agent does not attach + stall on it.
      // startsWith, not ===: the live placeholder is often the "… For Interim Dialog" variant of the class, not the bare name.
      const uac = window.className.startsWith('$$$Secure UAP Dummy Window Class')
        ? ' [UAC consent placeholder — the real prompt is on the secure desktop, undrivable from this session; a human must approve at the console, or relaunch the host elevated]'
        : '';
      return `- ${JSON.stringify(window.title)} [class=${window.className}] [pid=${window.processId}${exe ? ` ${exe}` : ''}] [hWnd=0x${window.hWnd.toString(16)}]${state ? ` (${state})` : ''}${wall}${uac}`;
    });
    // A UAC consent / secure desktop is invisible and undrivable from this session (no UIA, no capture) — say so, so
    // the agent does not loop waiting on a prompt it cannot see; a human must respond at the console, or run elevated.
    const secure = isSecureDesktopActive()
      ? '⚠ A UAC consent / secure desktop is active — it is INVISIBLE and undrivable from this session (no UIA, no capture, screenshots freeze). A human must respond at the physical console, or relaunch the host elevated.\n\n'
      : '';
    // Toasts/notification popups never come back from EnumWindows — surface them so the documented list_windows→attach flow finds them.
    for (const toast of notificationWindows())
      lines.push(`- ${JSON.stringify(toast.label)} [class=Windows.UI.Core.CoreWindow] [notification popup — attach by hWnd to read its text + invoke its Dismiss/Settings/action buttons] [hWnd=0x${toast.hWnd.toString(16)}]`);
    // The open system-tray overflow flyout is also a root-child window EnumWindows misses — surface it so a hidden NotifyItemIcon is reachable.
    const trayFlyout = trayFlyoutWindow();
    if (trayFlyout !== undefined)
      lines.push(`- ${JSON.stringify(trayFlyout.label)} [class=TopLevelWindowForOverflowXamlIsland] [system-tray overflow flyout — attach by hWnd to invoke a hidden tray icon] [hWnd=0x${trayFlyout.hWnd.toString(16)}]`);
    return textResult(`${secure}${lines.length > 0 ? lines.join('\n') : '(no visible top-level windows)'}`);
  },
  attach: (args) => {
    // Resolve the NEW window FIRST — attachBy*/uia.attach throw on not-found/ambiguous. A failed/ambiguous/typo
    // re-attach must NOT destroy the working attachment (which would leave the very next action with "no window
    // attached"); the error (and any disambiguation list) surfaces while the existing attachment keeps working. Dispose
    // + swap only AFTER a successful resolve (mirrors launch_app's dispose-after-success ordering).
    const handle = hwndArg(args);
    let next: Window;
    if (typeof args.title === 'string') next = attachByTitle(args.title, typeof args.className === 'string' ? args.className : undefined);
    else if (typeof args.className === 'string') next = attachByClassName(args.className);
    else if (handle !== undefined) next = uia.attach(handle);
    else if (typeof args.processId === 'number') next = attachByProcess(args.processId);
    else throw new Error('attach requires one of: title, className, hWnd, processId');
    current?.dispose();
    current = null;
    attached?.dispose();
    attached = next;
    lastSnapshotBody = '';
    lastSnapshotTree = null;
    return withSnapshot(`attached to ${JSON.stringify(next.name)}${blindSpotNote(next.className)}`);
  },
  desktop_snapshot: (args) => textResult(snapshotText(typeof args.maxDepth === 'number' ? args.maxDepth : undefined, typeof args.root === 'string' ? args.root : undefined)),
  find_and_act: (args) => {
    const action = requireString(args, 'do');
    const baseline = current?.marks.length ?? 0; // captured before the action so an expand can settle for its revealed in-process items
    const observe = (message: string): object => (action === 'read' ? textResult(message) : withActSnapshot(action, message, baseline)); // a pure read owes no full re-grounding snapshot; an expand settles for revealed items
    if (typeof args.ref === 'string') return observe(act(resolveRef(args.ref), action, typeof args.text === 'string' ? args.text : undefined, args.submit === true));
    rejectElementOnlyTarget(args);
    const window = requireAttached();
    const selector = selectorFrom(args.selector);
    const matches = window.findAll(selector); // findAll, not find — so an AMBIGUOUS selector is caught, not silently acted on
    if (matches.length === 0) throw new Error(window.describeNoMatch(selector));
    try {
      // A destructive verb on >1 matches would hit an arbitrary control with a confident success — refuse and list
      // the candidates (the same discipline attach uses), so the agent narrows by automationId/controlType or a ref.
      if (matches.length > 1 && action !== 'read')
        return errorResult(
          `selector matched ${matches.length} controls — refusing to ${action} an ambiguous target. Narrow with automationId / controlType, or pass a specific ref:\n${matches
            .slice(0, 10)
            .map((match) => `  - ${match.controlTypeName} ${JSON.stringify(match.name)}${match.automationId.length > 0 ? ` [automationId=${match.automationId}]` : ''} {x:${match.boundingRectangle.x},y:${match.boundingRectangle.y}}`)
            .join('\n')}${matches.length > 10 ? `\n  … +${matches.length - 10} more` : ''}`,
        );
      const outcome = act(matches[0]!, action, typeof args.text === 'string' ? args.text : undefined, args.submit === true);
      return observe(matches.length > 1 ? `${outcome} (read the first of ${matches.length} matches)` : outcome);
    } finally {
      for (const match of matches) match.release();
    }
  },
  reveal: (args) => {
    rejectElementOnlyTarget(args);
    const window = requireAttached();
    const selector = selectorFrom(args.selector);
    const element = window.reveal(selector);
    if (element === null) throw new Error(`reveal could not surface a match by scrolling — ${window.describeNoMatch(selector)}`);
    try {
      return withSnapshot(typeof args.do === 'string' ? act(element, args.do, typeof args.text === 'string' ? args.text : undefined, args.submit === true) : `revealed ${named(element)}`);
    } finally {
      element.release();
    }
  },
  click: (args) => {
    const element = resolveRef(requireString(args, 'ref'));
    const button = args.button === 'right' ? 'right' : args.button === 'middle' ? 'middle' : 'left';
    const outcome = clickElement(element, button, args.doubleClick === true, args.cursor === true);
    return withSnapshot(`${outcome} ${named(element)}`);
  },
  context_menu: async (args) => {
    const element = resolveRef(requireString(args, 'ref'));
    const opened = (popup: { hWnd: bigint; className: string }): object =>
      textResult(`context menu opened: [hWnd=0x${popup.hWnd.toString(16)}] [class=${popup.className}] — attach it (attach {hWnd}) to read + invoke its items (a WinUI flyout's items may need a re-snapshot).`);
    // 1) UIA ShowContextMenu (cursor-free, IUIAutomationElement3). ShowContextMenu / a posted right-click both return
    //    S_OK even when no menu appears, so poll for the REAL popup.
    const beforeMenu = popupSnapshot();
    if (element.showContextMenu()) {
      const popup = await pollForNewPopup(beforeMenu, 12);
      if (popup !== undefined) return opened(popup);
    }
    // 2) Fallback: a POSTED right-click (WM_RBUTTON to the control's own window) — also cursor-free, and it raises a
    //    menu on the modern WinUI/Chromium controls where ShowContextMenu has no Element3 or returns S_OK with no menu.
    const owner = ownerHwnd(element);
    if (owner !== 0n) {
      const before = popupSnapshot();
      const point = clickPoint(element);
      if (point !== null && postClickToHwnd(owner, point.x, point.y, 'right')) {
        const popup = await pollForNewPopup(before, 12);
        if (popup !== undefined) return opened(popup);
      }
    }
    // 3) Both cursor-free paths failed — only a real-cursor right-click will raise this provider's menu.
    return errorResult("no context menu appeared via UIA ShowContextMenu OR a posted right-click — this provider raises one only on a real right-click: click {ref, button:'right', cursor:true} (needs an unlocked, foregrounded desktop).");
  },
  invoke: (args) => {
    const element = resolveRef(requireString(args, 'ref'));
    const target = named(element);
    const before = popupSnapshot();
    patternAction('invoke', () => element.invoke());
    // Auto-return a flyout/menu that opened in its OWN window (so the agent need not hand-hunt it) — with NO dead poll
    // sleep: check once immediately (most providers create the popup synchronously) and once after the withSnapshot
    // rebuild, whose ~13ms cache build doubles as settle time for a slow provider.
    const note = (popup: { hWnd: bigint; className: string }): string =>
      `invoked ${target} — it opened a flyout/menu in its OWN window: [hWnd=0x${popup.hWnd.toString(16)}] [class=${popup.className}] — attach it (attach {hWnd}) to drive its items.`;
    const early = newPopup(before);
    const result = withSnapshot(early !== undefined ? note(early) : `invoked ${target}`);
    const late = early === undefined ? newPopup(before) : undefined;
    return late !== undefined ? withSnapshot(note(late)) : result;
  },
  focus: (args) => {
    // UIA SetFocus — cursor-free (no SendInput), so it works under BUN_UIA_CURSOR=never and on a no-own-HWND
    // WinUI/WPF/Electron control. The prerequisite for chord/arrow nav (press_key) to a SPECIFIC control by ref.
    const element = resolveRef(requireString(args, 'ref'));
    const target = named(element);
    element.focus();
    return withSnapshot(`focused ${target}`);
  },
  type: (args) => {
    const element = resolveRef(requireString(args, 'ref'));
    const text = requireString(args, 'text');
    const target = named(element);
    const handle = element.nativeWindowHandle;
    if (handle !== 0n) {
      // Cursor-free: WM_CHAR per code unit to the control's OWN HWND — no focus, works minimized/background/locked (the SendInput path can't).
      postText(handle, text);
      if (args.submit === true) postKey(handle, 'Enter');
      return withSnapshot(`typed into ${target} cursor-free${args.submit === true ? ' and pressed Enter' : ''}`);
    }
    // WinUI/WPF/Chromium sub-control with no own HWND — only SendInput reaches it (needs an unlocked, foregrounded desktop).
    if (cursorDenied) return errorResult('this control has no native window handle for the cursor-free WM_CHAR path, so type would need SendInput — disabled by BUN_UIA_CURSOR=never. Use set_value (ValuePattern) to write it cursor-free.');
    element.type(text);
    if (args.submit === true) uia.sendKeys('Enter');
    return withSnapshot(`typed into ${target}${args.submit === true ? ' and pressed Enter' : ''}`);
  },
  set_value: (args) => {
    const element = resolveRef(requireString(args, 'ref'));
    const value = requireString(args, 'value'); // hoisted OUT of the patternAction closure so a missing-value SCHEMA error is not annotated with pattern-support advice
    const target = named(element);
    const outcome = patternAction('set_value', () => setValueSmart(element, value)); // wrap the CALL SITE so RangeValue + WM_SETTEXT fallbacks still run and only the final exhausted throw gets the can: steer
    return withSnapshot(`${outcome} ${target} = ${element.isPassword ? '(password — withheld)' : JSON.stringify(args.value)}`); // never echo a secret-field value back (matches read / inspect_element / find_text)
  },
  toggle: (args) => {
    const element = resolveRef(requireString(args, 'ref'));
    const target = named(element);
    patternAction('toggle', () => element.toggle());
    return withSnapshot(`toggled ${target} (state ${element.toggleState})`);
  },
  expand: (args) => {
    const element = resolveRef(requireString(args, 'ref'));
    const target = named(element);
    const before = popupSnapshot();
    const baseline = current?.marks.length ?? 0;
    patternAction('expand', () => element.expand());
    // Classic combobox / WinUI 3 desktop flyout opens its list in its OWN untitled window — auto-return it (sleep-free).
    const note = (popup: { hWnd: bigint; className: string }): string =>
      `expanded ${target} (state ${element.expandCollapseState}) — its list opened in its OWN window: [hWnd=0x${popup.hWnd.toString(16)}] [class=${popup.className}] — attach it (attach {hWnd}) to see + select its items.`;
    const early = newPopup(before);
    if (early !== undefined) return withSnapshot(note(early));
    // In-process WinUI/UWP combobox/menu: items render into the SAME tree after a brief render race — settle until the
    // revealed items appear so the returned snapshot actually contains them (the old "desktop_snapshot to see them"
    // steer was a dead end against that race).
    const result = withSettledSnapshot(`expanded ${target} (state ${element.expandCollapseState})`, baseline);
    const late = newPopup(before);
    return late !== undefined ? withSnapshot(note(late)) : result;
  },
  collapse: (args) => {
    const element = resolveRef(requireString(args, 'ref'));
    const target = named(element);
    patternAction('collapse', () => element.collapse());
    return withSnapshot(`collapsed ${target}`);
  },
  select: (args) => {
    const element = resolveRef(requireString(args, 'ref'));
    const target = named(element);
    const mode = args.mode === 'add' ? 'add' : args.mode === 'remove' ? 'remove' : 'replace';
    patternAction('select', () => (mode === 'add' ? element.addToSelection() : mode === 'remove' ? element.removeFromSelection() : element.select()));
    return withSnapshot(`${mode === 'add' ? 'added to selection' : mode === 'remove' ? 'removed from selection' : 'selected'} ${target}`);
  },
  find_text: (args) => {
    const element = resolveRef(requireString(args, 'ref'));
    if (element.isPassword) return textResult('(password — withheld) — find_text will not extract text from a secret field'); // the one read path that was missing the gate every sibling applies
    // Disambiguate "no TextPattern" (wrong target) from "text genuinely absent" — they need different next steps.
    if (element.getProperty(PropertyId.IsTextPatternAvailable) !== true)
      return errorResult(
        `this control has no UIA TextPattern, so find_text cannot search it — target a Document / Edit / Text control (the editor/terminal/document body), not its container. inspect_element {ref} shows whether a ref can read-text.`,
      );
    const matched = element.selectText(requireString(args, 'text'), { ignoreCase: args.ignoreCase === true });
    return textResult(
      matched === null
        ? `text not present in this control: ${JSON.stringify(args.text)} — try a shorter / exact substring, mind case (ignoreCase:true), or it may be scrolled/virtualized off-screen (reveal it first)`
        : `found and selected ${JSON.stringify(matched)} — the active text selection; type or paste over it to REPLACE just this match (NOT set_value, which overwrites the WHOLE control), or copy / read it`,
    );
  },
  wait_for: async (args) => {
    const selector = selectorFrom(args.selector);
    const timeout = typeof args.timeout === 'number' ? args.timeout : 5000;
    if (args.gone === true) {
      await requireAttached().waitForGone(selector, { timeout });
      return withSnapshot(`gone: ${selectorToString(selector)}`);
    }
    const found = await requireAttached().waitFor(selector, { timeout });
    const target = named(found); // name the RESOLVED control, not a double-JSON-encoded echo of the selector
    found.release();
    return withSnapshot(`matched ${target}`);
  },
  wait_idle: async (args) => {
    const settled = await uia.waitForIdle(requireAttached(), { quietMs: typeof args.quietMs === 'number' ? args.quietMs : 400, timeout: typeof args.timeout === 'number' ? args.timeout : 5000 });
    return withSnapshot(settled ? 'UI settled' : 'UI still changing at timeout');
  },
  wait_for_window: async (args) => {
    const match: { title?: string; className?: string; process?: number } = {};
    if (typeof args.title === 'string') match.title = args.title;
    if (typeof args.className === 'string') match.className = args.className;
    if (typeof args.process === 'number') match.process = args.process;
    const timeout = typeof args.timeout === 'number' ? args.timeout : 30000;
    if (args.gone === true) {
      await uia.waitForWindowGone(match, { timeout });
      return textResult(`window gone: no window matching ${JSON.stringify(match)} is open anymore`);
    }
    const info = await uia.waitForWindow(match, { timeout });
    return textResult(`window: ${JSON.stringify(info.title)} [${info.className}] pid=${info.processId} hWnd=0x${info.hWnd.toString(16)} — attach by hWnd to drive it`);
  },
  wait_for_process: async (args) => {
    const name = requireString(args, 'name');
    const pid = await uia.waitForProcess(name, { timeout: typeof args.timeout === 'number' ? args.timeout : 30000 });
    return textResult(`process running: ${name} pid=${pid}`);
  },
  list_processes: (args) => {
    const filter = typeof args.filter === 'string' ? args.filter.toLowerCase() : null;
    const processes = uia
      .listProcesses()
      .filter((process) => filter === null || process.name.toLowerCase().includes(filter))
      .sort((first, second) => first.name.localeCompare(second.name));
    return textResult(`${processes.length} process(es)${filter !== null ? ` matching ${JSON.stringify(filter)}` : ''}:\n${processes.map((process) => `  ${String(process.processId).padStart(6)}  ${process.name}`).join('\n')}`);
  },
  ocr: async (args) => {
    const region = args.region;
    let result: { text: string; lines: { text: string; bounds: { x: number; y: number; width: number; height: number } }[] };
    let origin: string;
    if (region !== null && typeof region === 'object' && !Array.isArray(region)) {
      const r = region as Record<string, unknown>;
      result = await uia.ocrScreen({
        x: typeof r.x === 'number' ? r.x : undefined,
        y: typeof r.y === 'number' ? r.y : undefined,
        width: typeof r.width === 'number' ? r.width : undefined,
        height: typeof r.height === 'number' ? r.height : undefined,
      });
      origin = 'screen region';
    } else {
      const hWnd = hwndArg(args) ?? attached?.hWnd ?? 0n;
      if (hWnd === 0n) throw new Error('ocr: pass hWnd or region, or attach a window first');
      const windowResult = await uia.ocrWindow(hWnd);
      if (windowResult === null) {
        if (isMinimized(hWnd)) return errorResult(minimizedCaptureSteer(hWnd, 'ocr'));
        throw new Error('ocr: could not capture the window (protected / no surface)');
      }
      result = windowResult;
      origin = `hWnd 0x${hWnd.toString(16)}`;
    }
    if (result.lines.length === 0) return textResult(`OCR (${origin}) found no text.`);
    const body = result.lines.map((line) => `  [${line.bounds.x},${line.bounds.y} ${line.bounds.width}x${line.bounds.height}] ${line.text}`).join('\n');
    return textResult(`OCR (${origin}) — ${result.lines.length} line(s); click text via click_point at a box centre (x+width/2, y+height/2):\n${body}`);
  },
  click_point: (args) => {
    const x = requireNumber(args, 'x');
    const y = requireNumber(args, 'y');
    const button = args.button === 'right' ? 'right' : 'left';
    if (args.cursor === true) {
      if (cursorDenied) return errorResult('click_point {cursor:true} moves the real cursor — disabled by BUN_UIA_CURSOR=never. Omit cursor for a posted cursor-free click, or target a control by ref (click/invoke).');
      if (button === 'right') rightClickAt(x, y);
      else clickAt(x, y);
      return textResult(`clicked (real cursor) ${button} at ${x},${y}`);
    }
    if (postClickAt(x, y, button)) return textResult(`posted ${button} click at ${x},${y} (cursor-free)`);
    if (cursorDenied) return errorResult(`the posted ${button} click reached no window at ${x},${y} and the real-cursor fallback is disabled by BUN_UIA_CURSOR=never — target a control by ref (click/invoke) instead`);
    clickAt(x, y);
    return textResult(`clicked ${button} at ${x},${y} (real cursor fallback)`);
  },
  click_text: async (args) => {
    const want = requireString(args, 'text').toLowerCase();
    const hWnd = hwndArg(args) ?? attached?.hWnd ?? 0n;
    if (hWnd === 0n) throw new Error('click_text: attach a window or pass hWnd');
    const result = await uia.ocrWindow(hWnd);
    if (result === null) {
      if (isMinimized(hWnd)) return errorResult(minimizedCaptureSteer(hWnd, 'click_text'));
      throw new Error('click_text: could not capture the window (protected / no surface)');
    }
    const words = result.lines.flatMap((line) => line.words);
    const hit = words.find((word) => word.text.toLowerCase().includes(want)) ?? result.lines.find((line) => line.text.toLowerCase().includes(want)) ?? null;
    if (hit === null) {
      const nearest = words
        .map((word) => word.text)
        .filter((text) => text.trim().length > 0)
        .slice(0, 8);
      throw new Error(`click_text: no on-screen text matched ${JSON.stringify(args.text)}${nearest.length > 0 ? ` — nearest: ${nearest.map((text) => JSON.stringify(text)).join(', ')}` : ''}`);
    }
    const centerX = hit.bounds.x + Math.floor(hit.bounds.width / 2);
    const centerY = hit.bounds.y + Math.floor(hit.bounds.height / 2);
    if (args.cursor === true) {
      if (cursorDenied) return errorResult('click_text {cursor:true} moves the real cursor — disabled by BUN_UIA_CURSOR=never. Omit cursor for a posted cursor-free click.');
      clickAt(centerX, centerY);
      return textResult(`clicked text ${JSON.stringify(hit.text)} (real cursor) at ${centerX},${centerY}`);
    }
    if (postClickAt(centerX, centerY, 'left')) return textResult(`clicked text ${JSON.stringify(hit.text)} at ${centerX},${centerY} (cursor-free)`);
    if (cursorDenied) return errorResult(`the posted click did not reach the text's pixel at ${centerX},${centerY} and the real-cursor fallback is disabled by BUN_UIA_CURSOR=never — target a control by ref (click/invoke) instead`);
    clickAt(centerX, centerY);
    return textResult(`clicked text ${JSON.stringify(hit.text)} at ${centerX},${centerY} (real cursor fallback)`);
  },
  screenshot: async () => {
    const window = requireAttached();
    const capture = captureWindowRGB(window.hWnd);
    if (capture !== null && !isNearUniform(capture.rgb)) return imageResult(encodePNG(capture.rgb, capture.width, capture.height), `(${originNote(capture.originX, capture.originY, capture.width, capture.height)})`);
    const live = await captureWindowLive(window.hWnd);
    if (live !== null && !isNearUniform(live.rgb))
      return imageResult(encodePNG(live.rgb, live.width, live.height), `(PrintWindow was blank — Windows.Graphics.Capture live frame of the GPU/occluded surface; ${originNote(live.originX, live.originY, live.width, live.height)})`);
    // A minimized window has no surface — both PrintWindow and WGC came back blank. Steer to the cursor-free restore
    // BEFORE the desktop-region fallback, which would otherwise grab a useless taskbar-button sliver.
    if (isMinimized(window.hWnd)) return errorResult(minimizedCaptureSteer(window.hWnd, 'screenshot'));
    const bounds = window.boundingRectangle;
    if (bounds.width > 0 && bounds.height > 0)
      return imageResult(
        uia.screenshotScreen({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }),
        `(PrintWindow + WGC blank — desktop-region fallback; only the on-screen, non-occluded part; ${originNote(bounds.x, bounds.y, bounds.width, bounds.height)})`,
      );
    return errorResult('screenshot was empty (locked session, zero-size, or fully off-screen window)');
  },
  capture_window: async (args) => {
    const hWnd = resolveHwnd(args);
    const live = await captureWindowLive(hWnd);
    if (live === null) {
      if (isMinimized(hWnd)) return errorResult(minimizedCaptureSteer(hWnd, 'capture_window'));
      return errorResult('Windows.Graphics.Capture could not capture this window (protected/DRM content, or WGC unavailable)');
    }
    return imageResult(encodePNG(live.rgb, live.width, live.height), `(${originNote(live.originX, live.originY, live.width, live.height)})`);
  },
  screen_capture: (args) => {
    const region =
      typeof args.x === 'number' || typeof args.y === 'number' || typeof args.width === 'number' || typeof args.height === 'number'
        ? {
            x: typeof args.x === 'number' ? args.x : undefined,
            y: typeof args.y === 'number' ? args.y : undefined,
            width: typeof args.width === 'number' ? args.width : undefined,
            height: typeof args.height === 'number' ? args.height : undefined,
          }
        : undefined;
    return imageResult(uia.screenshotScreen(region));
  },
  screenshot_marked: () => {
    const window = requireAttached();
    current?.dispose();
    current = null; // if the rebuild throws (window closing), don't leave `current` pointing at the disposed snapshot
    current = buildWindowSnapshot(window).snapshot; // splice Chromium web roots so web-DOM controls get marks too (consistent with desktop_snapshot)
    epoch += 1;
    refGen += 1; // a fresh marked render renumbers refs — invalidate any the model still holds
    lastSnapshotTree = current.tree;
    lastSnapshotBody = renderTree(current.tree);
    const marked = screenshotWithMarks(window, current);
    if (marked.png.length === 0) return errorResult('screenshot_marked was blank (locked session / PrintWindow); use screen_capture for the visible pixels and desktop_snapshot for the refs');
    const legend = marked.marks.map((mark) => `[${mark.label}] ${mark.role} ${JSON.stringify(mark.name)} → ${mark.ref}#${refGen}`).join('\n');
    return {
      content: [
        { type: 'image', data: Buffer.from(marked.png).toString('base64'), mimeType: 'image/png' },
        { type: 'text', text: `### Marks (epoch ${epoch})\n${legend}` },
      ],
    };
  },
  inspect_point: (args) => {
    const description = uia.elementAt(requireNumber(args, 'x'), requireNumber(args, 'y'));
    if (description === null) return textResult(`(no UI element at ${args.x},${args.y})`);
    return textResult(
      `${description.role} ${JSON.stringify(description.name)}${description.automationId ? ` id=${description.automationId}` : ''} [class=${description.className}] {x:${description.bounds.x},y:${description.bounds.y} w:${description.bounds.width} h:${description.bounds.height}}`,
    );
  },
  inspect_element: (args) => {
    const element = resolveRef(requireString(args, 'ref'));
    const bounds = element.boundingRectangle;
    const lines = [`${element.controlTypeName} ${JSON.stringify(element.name)}`];
    if (element.automationId.length > 0) lines.push(`automationId: ${element.automationId}`);
    if (element.className.length > 0) lines.push(`className: ${element.className}`);
    lines.push(`bounds: {x:${bounds.x},y:${bounds.y} w:${bounds.width} h:${bounds.height}}`, `enabled: ${element.isEnabled}`);
    const isPassword = element.isPassword; // gate EVERY secret-bearing field (value + TextPattern body) — a leaked password can't be un-streamed
    const value = isPassword ? '' : element.value;
    if (isPassword) lines.push('value: (password — withheld)');
    else if (value.length > 0) lines.push(`value: ${JSON.stringify(value)}`);
    if (element.toggleState >= 0) lines.push(`toggleState: ${element.toggleState} (0=off,1=on,2=indeterminate)`);
    if (element.expandCollapseState >= 0) lines.push(`expandCollapseState: ${element.expandCollapseState} (0=collapsed,1=expanded,2=partial,3=leaf)`);
    if (element.isSelected) lines.push('selected: true');
    let rangeReadOnly = false;
    if (!Number.isNaN(element.rangeValue)) {
      const rangeMin = element.getProperty(PropertyId.RangeValueMinimum);
      const rangeMax = element.getProperty(PropertyId.RangeValueMaximum);
      const small = element.getProperty(PropertyId.RangeValueSmallChange); // arrow-key step; large = page step — actionable for set_value / press_key nudging
      const large = element.getProperty(PropertyId.RangeValueLargeChange);
      rangeReadOnly = element.getProperty(PropertyId.RangeValueIsReadOnly) === true; // a ProgressBar / read-only slider — a set_value(numeric) would throw
      const step = `${typeof small === 'number' && small > 0 ? `, small ${small}` : ''}${typeof large === 'number' && large > 0 ? `, large ${large}` : ''}${rangeReadOnly ? ', read-only' : ''}`;
      lines.push(typeof rangeMin === 'number' && typeof rangeMax === 'number' ? `rangeValue: ${element.rangeValue} (min ${rangeMin}, max ${rangeMax}${step})` : `rangeValue: ${element.rangeValue}${rangeReadOnly ? ' (read-only)' : ''}`);
    }
    const scroll = element.scrollInfo;
    if (scroll !== null) lines.push(`scroll: h=${scroll.horizontalPercent.toFixed(0)}% v=${scroll.verticalPercent.toFixed(0)}% scrollable=${scroll.horizontallyScrollable ? 'H' : ''}${scroll.verticallyScrollable ? 'V' : ''}`);
    const clickable = element.clickablePoint;
    if (clickable !== null) lines.push(`clickablePoint: ${clickable.x},${clickable.y}`);
    const handle = element.nativeWindowHandle;
    if (handle !== 0n) lines.push(`nativeWindowHandle: 0x${handle.toString(16)}`);
    const helpText = element.getProperty(PropertyId.HelpText);
    if (typeof helpText === 'string' && helpText.length > 0) lines.push(`helpText: ${JSON.stringify(helpText)}`);
    const itemStatus = element.getProperty(PropertyId.ItemStatus);
    if (typeof itemStatus === 'string' && itemStatus.length > 0) lines.push(`itemStatus: ${JSON.stringify(itemStatus)}`);
    if (element.getProperty(PropertyId.HasKeyboardFocus) === true) lines.push('hasKeyboardFocus: true');
    if (element.getProperty(PropertyId.IsOffscreen) === true) lines.push('offscreen: true');
    const frameworkId = element.getProperty(PropertyId.FrameworkId);
    if (typeof frameworkId === 'string' && frameworkId.length > 0) lines.push(`frameworkId: ${frameworkId}`);
    // Available actions, from each Is*PatternAvailable — a control's ROLE lies (a 'Button' may only ExpandCollapse, and
    // invoke() can no-op silently), so report what it actually supports rather than letting the agent guess the verb.
    const can: string[] = [];
    const hasValuePattern = element.getProperty(PropertyId.IsValuePatternAvailable) === true;
    const valueReadOnly = hasValuePattern && element.getProperty(PropertyId.ValueIsReadOnly) === true; // a read-only/disabled Edit — a set_value would throw (symmetric with the RangeValue read-only steer)
    const hasTextPattern = element.getProperty(PropertyId.IsTextPatternAvailable) === true;
    if (element.getProperty(PropertyId.IsInvokePatternAvailable) === true) can.push('invoke');
    if (hasValuePattern) can.push(valueReadOnly ? 'read value (read-only — set_value will fail)' : 'set_value');
    if (element.getProperty(PropertyId.IsTogglePatternAvailable) === true) can.push('toggle');
    if (element.getProperty(PropertyId.IsExpandCollapsePatternAvailable) === true) can.push('expand/collapse');
    if (element.getProperty(PropertyId.IsSelectionItemPatternAvailable) === true) can.push('select');
    if (element.getProperty(PropertyId.IsRangeValuePatternAvailable) === true) can.push(rangeReadOnly ? 'read rangeValue (read-only — set_value will fail)' : 'set_value(numeric)');
    if (element.getProperty(PropertyId.IsScrollPatternAvailable) === true) can.push('scroll');
    if (element.getProperty(PropertyId.IsScrollItemPatternAvailable) === true) can.push('scroll-into-view');
    if (hasTextPattern) can.push('read-text');
    if (element.getProperty(PropertyId.IsGridPatternAvailable) === true) can.push('read-table');
    if (element.getProperty(PropertyId.IsMultipleViewPatternAvailable) === true) can.push('set-view (list_views/set_view)');
    // Own-HWND text control → the cursor-free posted-message text verbs work (WM_CHAR/WM_PASTE/WM_COPY/WM_CUT); the
    // documented can: list must name them or the agent (told to drive off this list) won't know it can type into a
    // classic Win32 Edit (Notepad/WordPad/Run dialog/address bars) without focus. handle + patterns already in hand.
    if (handle !== 0n && (hasValuePattern || hasTextPattern)) can.push('type/paste/copy/cut (cursor-free, own HWND)');
    lines.push(can.length > 0 ? `can: ${can.join(', ')}` : 'can: (none — a static/container node with no actionable UIA pattern; act on a CHILD control instead, or use ocr / screen_capture / inspect_point for its pixels)');
    // TextPattern content (terminals, documents, read-only multiline text) — the buffer the ValuePattern `value`
    // does not carry. Prefer the ON-SCREEN text (GetVisibleRanges): bounded + relevant + cheap for a huge
    // scrollback; fall back to the full document for a non-scrollable text control. Capped either way.
    const visible = isPassword ? '' : element.visibleText();
    const text = isPassword ? '' : visible.length > 0 ? visible : element.text();
    if (text.length > 0 && text !== value && text !== element.name)
      lines.push(`${visible.length > 0 ? 'visible text' : 'text'} (${text.length} chars):\n${text.length > 2000 ? `${text.slice(0, 2000)} …(+${text.length - 2000} more chars)` : text}`);
    return textResult(lines.join('\n'));
  },
  read_table: (args) => {
    const table = resolveRef(requireString(args, 'ref')).readTable(typeof args.maxRows === 'number' ? args.maxRows : undefined);
    return textResult(table === null ? '(no table at this ref — it does not expose the UIA Grid pattern; try a different ref, e.g. the List/DataGrid node)' : renderTable(table));
  },
  grid_cell: (args) => {
    const grid = resolveRef(requireString(args, 'ref'));
    const cell = grid.cell(requireNumber(args, 'row'), requireNumber(args, 'column'));
    if (cell === null) return errorResult(`no cell at (${args.row}, ${args.column}) — this ref has no UIA Grid pattern, or that cell is out of range. Target the List/DataGrid/Table node and check read_table for the grid's extent.`);
    try {
      const action = typeof args.do === 'string' ? args.do : 'read';
      const outcome = act(cell, action, typeof args.text === 'string' ? args.text : undefined);
      return action === 'read' ? textResult(`cell (${args.row}, ${args.column}) ${outcome}`) : withSnapshot(`cell (${args.row}, ${args.column}): ${outcome}`);
    } finally {
      cell.release();
    }
  },
  list_views: (args) => {
    const state = resolveRef(requireString(args, 'ref')).views();
    if (state === null) return textResult('(no view modes — this control has no MultipleView pattern; target the items List/DataGrid container)');
    return textResult(`current view: ${state.current}\nsupported:\n${state.supported.map((view) => `  ${view.id}: ${view.name}${view.id === state.current ? ' (current)' : ''}`).join('\n')}`);
  },
  set_view: (args) => {
    const element = resolveRef(requireString(args, 'ref'));
    const id = requireNumber(args, 'id');
    const target = named(element);
    if (!element.setView(id)) return errorResult(`set_view: could not switch to view ${id} — the control has no MultipleView pattern or ${id} is not a supported id (call list_views).`);
    return withSnapshot(`switched ${target} to view ${id}`);
  },
  native_tree: (args) => textResult(renderWindowTree(uia.windowTree(resolveHwnd(args), typeof args.maxDepth === 'number' ? args.maxDepth : 12))),
  msaa_tree: (args) => {
    const tree = uia.msaaTree(resolveHwnd(args), typeof args.maxDepth === 'number' ? args.maxDepth : 8);
    return textResult(tree === null ? '(no MSAA/IAccessible tree for this window)' : formatMsaa(tree));
  },
  list_monitors: () =>
    textResult(
      listMonitors()
        .map(
          (monitor, index) =>
            `- monitor ${index}${monitor.primary ? ' (primary)' : ''} bounds={x:${monitor.bounds.x},y:${monitor.bounds.y} w:${monitor.bounds.width} h:${monitor.bounds.height}} work={w:${monitor.workArea.width} h:${monitor.workArea.height}}`,
        )
        .join('\n'),
    ),
  get_focused: () => {
    const element = uia.focused();
    try {
      const bounds = element.boundingRectangle;
      const id = element.automationId.length > 0 ? ` [automationId=${element.automationId}]` : '';
      // className + clickablePoint + own hWnd turn an UNNAMED focused control from a dead-end into an actionable identity
      // (className to recognize it, clickablePoint for click_point/inspect_point, hWnd for the cursor-free posted paths).
      const cls = element.className.length > 0 ? ` [class=${element.className}]` : '';
      const handle = element.nativeWindowHandle;
      const hwnd = handle !== 0n ? ` [hWnd=0x${handle.toString(16)}]` : '';
      const point = element.clickablePoint;
      const click = point !== null ? ` clickablePoint:${point.x},${point.y}` : '';
      return textResult(`${element.controlTypeName} ${JSON.stringify(element.name)}${id}${cls} {x:${bounds.x},y:${bounds.y} w:${bounds.width} h:${bounds.height}}${click}${hwnd}`);
    } finally {
      element.release();
    }
  },
  press_key: (args) => {
    const key = normalizeKey(requireString(args, 'key')); // fold xdotool/CUA names (ArrowDown, Page_Down, super, spacebar) onto the canonical vocabulary so the cursor-free posted paths resolve them too
    // Ctrl+Z → cursor-free EM_UNDO on a classic Edit with its own HWND (the one undo-key the WM_COPY/CUT/PASTE/SETSEL
    // cursor-free cluster was missing); falls through to the gated SendInput chord path for a no-own-HWND control.
    if (typeof args.ref === 'string' && key.toLowerCase().replace(/\s/g, '').replace('ctrl', 'control') === 'control+z') {
      const element = resolveRef(args.ref);
      const handle = element.nativeWindowHandle;
      if (handle !== 0n && undoControl(handle)) return withSnapshot(`undid the last edit in ${named(element)} cursor-free (EM_UNDO)`);
    }
    // The everyday edit chords on an own-HWND control go CURSOR-FREE via the posted-message primitives (no SendInput, no
    // foreground), mirroring the Control+Z special-case: Ctrl+A select-all, Ctrl+V paste, Ctrl+C copy, Ctrl+X cut.
    if (typeof args.ref === 'string' && key.includes('+')) {
      const chord = key.toLowerCase().replace(/\s/g, '').replace('ctrl', 'control');
      if (chord === 'control+a' || chord === 'control+c' || chord === 'control+x' || chord === 'control+v') {
        const element = resolveRef(args.ref);
        const handle = element.nativeWindowHandle;
        // Refuse to copy/cut a password field to the clipboard REGARDLESS of native handle. This MUST run before the
        // handle guard: a no-own-HWND password input (WinUI/WPF/Electron, handle===0n) skips the cursor-free block and
        // falls through to the SendInput chord path below, which would copy the secret as cleartext that read_clipboard
        // then returns. isPassword is a UIA property readable on any element.
        if ((chord === 'control+c' || chord === 'control+x') && element.isPassword) return errorResult(`refusing to ${chord === 'control+c' ? 'copy' : 'cut'} a password field to the clipboard`);
        if (handle !== 0n) {
          if (chord === 'control+a') return selectAllInControl(handle), withSnapshot(`selected all in ${named(element)} cursor-free (EM_SETSEL)`);
          if (chord === 'control+v') return pasteToControl(handle), withSnapshot(`pasted the clipboard into ${named(element)} cursor-free (WM_PASTE)`);
          if (element.getSelectedText().length === 0) selectAllInControl(handle);
          const before = clipboardSequence();
          if (chord === 'control+c') copyFromControl(handle);
          else cutFromControl(handle);
          // Only trust the clipboard if WM_COPY/CUT actually moved the counter; else the control ignored it — fall
          // through to the SendInput chord path rather than claim a stale clipboard.
          if (clipboardSequence() !== before) return withSnapshot(`${chord === 'control+c' ? 'copied' : 'cut'} ${named(element)} to the clipboard cursor-free — ${JSON.stringify(capText(uia.readClipboard()))}`);
        }
      }
    }
    if (typeof args.ref === 'string' && !key.includes('+')) {
      const element = resolveRef(args.ref);
      const handle = element.nativeWindowHandle;
      if (handle !== 0n && postKey(handle, key)) return withSnapshot(`pressed ${JSON.stringify(key)} cursor-free`);
      // The ref has no native window handle (WinUI/WPF/Chromium sub-control) and cannot be posted to. The SendInput
      // path aims at whatever holds focus, so FOCUS the ref first (cursor-free UIA SetFocus) — otherwise the key lands
      // on some other control. Mirrors type/paste/cut, which always act on the ref rather than ambient focus.
      if (cursorDenied)
        return errorResult(
          `${JSON.stringify(key)} cannot reach this control cursor-free: it has no native window handle (a WinUI/WPF/Electron sub-control), so a raw key needs SendInput — disabled by BUN_UIA_CURSOR=never — and focusing it adds NO cursor-free key path. Use the pattern for your intent instead: Enter/Space → invoke {ref}; a tab / list / menu choice → select {ref} by name; text entry → set_value {ref}. inspect_element {ref} lists the supported verbs (can:).`,
        );
      element.focus();
      uia.sendKeys(key);
      return withSnapshot(`focused ${named(element)} then pressed ${JSON.stringify(key)} — the ref has no native window handle, so the key was delivered with synthetic input to the now-focused control`);
    }
    if (cursorDenied)
      return errorResult(
        `a key chord like ${JSON.stringify(key)} is delivered with synthetic input (SendInput) to the focused control — disabled by BUN_UIA_CURSOR=never. Post a single key to a control by ref (press_key {ref,key}) instead.`,
      );
    // A chord with a ref: focus that control first (cursor-free SetFocus) so the synthetic chord lands on IT — without
    // this the ref was silently ignored and the chord hit whatever happened to hold focus.
    if (typeof args.ref === 'string') {
      const element = resolveRef(args.ref);
      element.focus();
      uia.sendKeys(key);
      return withSnapshot(`focused ${named(element)} then pressed ${JSON.stringify(key)} (synthetic chord)`);
    }
    uia.sendKeys(key);
    return withSnapshot(`pressed ${JSON.stringify(key)}`);
  },
  scroll: (args) => {
    const element = resolveRef(requireString(args, 'ref'));
    const target = named(element);
    const direction = args.direction;
    // Scroll-to-position (cursor-free UIA ScrollPattern): jump to top/bottom, page by a LargeIncrement, or to an explicit
    // percent — the one-call "go to the top/bottom of this long list/log/doc" an incremental small-step loop can't give.
    if (typeof args.to === 'number' || direction === 'top' || direction === 'bottom' || direction === 'page-up' || direction === 'page-down' || direction === 'page-left' || direction === 'page-right') {
      if (element.scrollInfo === null)
        return withSnapshot(
          `${target} has no ScrollPattern, so it cannot scroll-to-position — use a directional scroll {direction:up|down|left|right} (which also posts a wheel to a classic own-HWND control), or scroll {ref} alone to bring a ref into view`,
        );
      const horizontal = direction === 'left' || direction === 'right' || direction === 'page-left' || direction === 'page-right';
      if (typeof args.to === 'number') {
        const percent = Math.max(0, Math.min(100, args.to));
        element.setScrollPercent(horizontal ? percent : NoScroll, horizontal ? NoScroll : percent);
        return withSnapshot(`scrolled ${target} to ${percent}%${horizontal ? ' (horizontal)' : ''}`);
      }
      if (direction === 'top' || direction === 'bottom') {
        element.setScrollPercent(NoScroll, direction === 'top' ? 0 : 100);
        return withSnapshot(`scrolled ${target} to ${direction}`);
      }
      const pages = typeof args.amount === 'number' ? Math.max(1, args.amount) : 1;
      const step = direction === 'page-up' || direction === 'page-left' ? ScrollAmount.LargeDecrement : ScrollAmount.LargeIncrement;
      for (let count = 0; count < pages; count += 1) element.scroll(horizontal ? step : ScrollAmount.NoAmount, horizontal ? ScrollAmount.NoAmount : step);
      return withSnapshot(`scrolled ${target} ${direction}${pages > 1 ? ` ×${pages}` : ''}`);
    }
    if (direction === 'up' || direction === 'down' || direction === 'left' || direction === 'right') {
      const amount = typeof args.amount === 'number' ? args.amount : 3;
      const info = element.scrollInfo;
      if (info !== null) {
        const horizontal = direction === 'left' || direction === 'right';
        const step = direction === 'up' || direction === 'left' ? ScrollAmount.SmallDecrement : ScrollAmount.SmallIncrement;
        for (let count = 0; count < Math.max(1, amount); count += 1) element.scroll(horizontal ? step : ScrollAmount.NoAmount, horizontal ? ScrollAmount.NoAmount : step);
        return withSnapshot(`scrolled ${target} ${direction} ${amount}`);
      }
      const bounds = element.boundingRectangle;
      const centerX = bounds.x + Math.floor(bounds.width / 2);
      const centerY = bounds.y + Math.floor(bounds.height / 2);
      // No ScrollPattern — for a classic control with its OWN HWND, a posted wheel scrolls it CURSOR-FREE (works
      // minimized/background/locked), the path a ScrollPattern-less ListView/Edit/TreeView needs: WM_MOUSEWHEEL for
      // up/down, WM_MOUSEHWHEEL for left/right. NOT the ownerHwnd ancestor — posting the wheel to the parent (e.g. the
      // taskbar) would scroll the WRONG window while PostMessage still returns success (a false "scrolled" report). With
      // no own HWND it falls to a UIA-ScrollPattern ANCESTOR via scrollAt, then the honest "no scrollable container".
      const handle = element.nativeWindowHandle;
      const notches = direction === 'up' || direction === 'left' ? -Math.max(1, amount) : Math.max(1, amount); // wheel: +up/-down; hwheel: +right/-left
      if ((direction === 'up' || direction === 'down') && handle !== 0n && postWheel(handle, centerX, centerY, direction === 'up' ? Math.max(1, amount) : -Math.max(1, amount)))
        return withSnapshot(`scrolled ${target} ${direction} ${amount} (posted wheel, cursor-free)`);
      if ((direction === 'left' || direction === 'right') && handle !== 0n && postHWheel(handle, centerX, centerY, notches)) return withSnapshot(`scrolled ${target} ${direction} ${amount} (posted wheel, cursor-free)`);
      if (scrollAt(centerX, centerY, direction, amount)) return withSnapshot(`scrolled ${target} ${direction} ${amount}`);
      return withSnapshot(`no scrollable container at ${target}`);
    }
    // A PROVIDED-but-unrecognized direction must NOT silently fall through to scroll-into-view (a different operation
    // reported as a confident success) — enumerate the valid set, mirroring act()/manage_window. An OMITTED direction is
    // the legitimate scroll-into-view intent and still passes through.
    if (direction !== undefined)
      return errorResult(
        `unknown scroll direction ${JSON.stringify(direction)} — valid directions are: up, down, left, right, top, bottom, page-up, page-down, page-left, page-right; or pass {to: 0-100} for a percent; or omit direction to scroll the ref into view.`,
      );
    element.scrollIntoView();
    return withSnapshot(`scrolled ${target} into view`);
  },
  drag: (args) => {
    let fromX: number;
    let fromY: number;
    let owner = 0n;
    if (typeof args.ref === 'string') {
      const element = resolveRef(args.ref);
      const point = clickPoint(element);
      if (point === null) return errorResult(`cannot drag from ${named(element)} — it has no on-screen location (0×0 bounds, no clickable point). Pass explicit fromX/fromY, or target a control with a visible rectangle.`);
      fromX = point.x;
      fromY = point.y;
      owner = ownerHwnd(element);
    } else {
      fromX = requireNumber(args, 'fromX');
      fromY = requireNumber(args, 'fromY');
    }
    const toX = requireNumber(args, 'toX');
    const toY = requireNumber(args, 'toY');
    // Cursor-free drag-SELECT (text selection / marquee) via posted mouse messages — when explicitly requested
    // ({select:true}) or as the automatic fallback under cursor=never where a real drag is impossible. Requires an
    // own-HWND target; it CANNOT perform an OLE drag-DROP (that needs the real cursor), so the default stays real-mouse.
    if (args.select === true || cursorDenied) {
      if (owner !== 0n && postDragToHwnd(owner, fromX, fromY, toX, toY)) return withSnapshot(`drag-selected ${fromX},${fromY} → ${toX},${toY} cursor-free (posted — text selection / marquee, NOT a drag-drop)`);
      if (cursorDenied) return errorResult('drag needs the real cursor — disabled by BUN_UIA_CURSOR=never; a cursor-free drag-SELECT works ONLY on a {ref} to a control with its own window handle (a classic Edit/RichEdit/ListView)');
      return errorResult('cursor-free drag-select ({select:true}) needs a {ref} to a control with its own window handle (a classic Edit/RichEdit/ListView); for a raw-point drag or a drag-DROP, drop {select} to use the real cursor');
    }
    dragTo(fromX, fromY, toX, toY);
    return withSnapshot(`dragged ${fromX},${fromY} → ${toX},${toY} (real cursor)`);
  },
  hold_key: async (args) => {
    const key = normalizeKey(requireString(args, 'key')); // fold xdotool/CUA names so the cursor-free postHoldKey path resolves them too (the SendInput fallback already normalized)
    const durationMs = typeof args.durationMs === 'number' ? args.durationMs : 1000;
    if (typeof args.ref === 'string') {
      // Own-HWND control → hold it cursor-free (posted WM_KEYDOWN autorepeat); no focus, background/locked OK.
      const element = resolveRef(args.ref);
      const handle = element.nativeWindowHandle;
      if (handle !== 0n) {
        await postHoldKey(handle, key, durationMs);
        return withSnapshot(`held ${JSON.stringify(key)} on ${named(element)} for ${durationMs}ms cursor-free`);
      }
      if (cursorDenied)
        return errorResult(`hold_key on this ref needs SendInput (the control has no native window handle for the cursor-free WM_KEYDOWN path) — disabled by BUN_UIA_CURSOR=never; target a control with its own window handle`);
    }
    if (cursorDenied) return errorResult('hold_key holds a key down with synthetic input (SendInput) — disabled by BUN_UIA_CURSOR=never; pass a {ref} to an own-HWND control to hold it cursor-free');
    await holdKey(key, durationMs);
    return withSnapshot(`held ${JSON.stringify(key)} for ${durationMs}ms`);
  },
  manage_window: (args) => {
    const hWnd = resolveHwnd(args);
    const action = requireString(args, 'action');
    if (action === 'close') {
      closeWindow(hWnd);
      Bun.sleepSync(250); // let a blocking modal (a "Save changes?" dialog) raise before we judge whether the close took
      if (isWindow(hWnd)) {
        // The window SURVIVED WM_CLOSE — a modal needs a choice, or a multi-tab app only closed a tab. Do NOT report a
        // false "closed"; re-ground (when it is the attached window, the same-window WinUI ContentDialog is now in the tree).
        if (attached !== null && attached.hWnd === hWnd)
          return withSnapshot(`close was BLOCKED — window 0x${hWnd.toString(16)} is still open (a modal likely needs a choice — act on its Save / Don't save / Cancel buttons; a separate dialog window may need list_windows + attach)`);
        return textResult(`close was BLOCKED — window 0x${hWnd.toString(16)} is still open (a modal may need a choice; attach it or call list_windows to find the dialog)`);
      }
      return textResult(`window closed (hWnd=0x${hWnd.toString(16)})`);
    }
    if (action === 'minimize') minimizeWindow(hWnd);
    else if (action === 'maximize') maximizeWindow(hWnd);
    else if (action === 'restore') restoreWindow(hWnd);
    else if (action === 'raise') raiseWindow(hWnd);
    else if (action === 'move') moveWindow(hWnd, requireNumber(args, 'x'), requireNumber(args, 'y'), requireNumber(args, 'width'), requireNumber(args, 'height'));
    else if (action === 'snap') {
      const edge = requireString(args, 'edge');
      if (edge !== 'left' && edge !== 'right' && edge !== 'top' && edge !== 'bottom' && edge !== 'center') throw new Error(`snap edge must be left/right/top/bottom/center, got ${JSON.stringify(edge)}`);
      snapWindow(hWnd, edge);
    } else throw new Error(`unknown manage_window action ${JSON.stringify(action)} — valid actions are: close, minimize, maximize, restore, raise, move, snap.`);
    return textResult(`window ${action}${action === 'snap' ? ` ${args.edge}` : ''} (hWnd=0x${hWnd.toString(16)})`);
  },
  read_clipboard: () => {
    const text = uia.readClipboard();
    if (text.length > 0) return textResult(capText(text));
    const files = uia.readClipboardFiles(); // Explorer Ctrl+C / Cut puts CF_HDROP, not text
    if (files.length > 0) return textResult(`${files.length} file${files.length > 1 ? 's' : ''} on the clipboard (CF_HDROP):\n${files.join('\n')}`);
    return textResult('(clipboard empty or not text)');
  },
  set_clipboard: (args) => textResult(uia.writeClipboard(requireString(args, 'text')) ? 'clipboard set' : 'failed to set clipboard'),
  paste: (args) => {
    if (typeof args.ref === 'string') {
      const element = resolveRef(args.ref);
      const target = named(element);
      const handle = element.nativeWindowHandle;
      if (handle !== 0n) {
        // Cursor-free: set the clipboard (when text given), then WM_PASTE to the control's OWN HWND — no focus, works minimized/background/locked.
        if (typeof args.text === 'string') uia.writeClipboard(args.text);
        pasteToControl(handle);
        return withSnapshot(`pasted ${typeof args.text === 'string' ? `${args.text.length} chars` : 'clipboard'} into ${target} cursor-free`);
      }
      // WinUI/WPF/Chromium sub-control with no own HWND — only SendInput Ctrl+V reaches it.
      if (cursorDenied) return errorResult('this control has no native window handle for the cursor-free WM_PASTE path, so paste would need SendInput Ctrl+V — disabled by BUN_UIA_CURSOR=never. Use set_value to write it cursor-free.');
      element.focus();
      if (typeof args.text === 'string') uia.paste(args.text);
      else uia.sendKeys('Control+V');
      return withSnapshot(`pasted ${typeof args.text === 'string' ? `${args.text.length} chars` : 'clipboard'} into ${target}`);
    }
    // No ref → Ctrl+V on whatever owns focus (SendInput).
    if (cursorDenied) return errorResult('paste with no ref injects Ctrl+V via SendInput on the focused control — disabled by BUN_UIA_CURSOR=never; target a control by ref for the cursor-free WM_PASTE path, or use set_value');
    if (typeof args.text === 'string') uia.paste(args.text);
    else uia.sendKeys('Control+V');
    return withSnapshot(typeof args.text === 'string' ? `pasted ${args.text.length} chars` : 'pasted clipboard');
  },
  copy: async (args) => {
    if (typeof args.ref === 'string') {
      const element = resolveRef(args.ref);
      if (element.isPassword) return textResult('(password — withheld)'); // never clipboard a secret field's selection (matches read / inspect_element)
      const selected = element.getSelectedText(); // cursor-free: TextPattern selection, no focus, works locked/background
      if (selected.length > 0) {
        uia.writeClipboard(selected);
        return textResult(capText(selected));
      }
      // No TextPattern selection — for a classic Edit with its OWN HWND, select-all + WM_COPY cursor-free (no focus,
      // works minimized/background/locked), the path TextPattern-less Win32 Edits need.
      const handle = element.nativeWindowHandle;
      if (handle !== 0n) {
        const before = clipboardSequence();
        selectAllInControl(handle);
        copyFromControl(handle);
        // Only trust the clipboard if WM_COPY actually CHANGED it — else it is the prior (possibly secret) clipboard,
        // not this control's content; fall through to the honest "select first" message rather than leak a stale value.
        if (clipboardSequence() !== before) {
          const text = uia.readClipboard();
          if (text.length > 0) return textResult(capText(text));
        }
      }
      // No selection and no own-HWND Edit — do NOT silently Ctrl+C the FOCUSED control and pass its clipboard off as
      // THIS ref's content (a target-confusion lie). Tell the agent to select first; never reach the SendInput path.
      return textResult('(this ref has no active text selection and no own-HWND Edit to copy — select text first with find_text {ref, text}, or call copy with no ref to Ctrl+C the focused control)');
    }
    if (cursorDenied) return errorResult('copy with no ref falls through to a real Ctrl+C (SendInput) on the focused control — disabled by BUN_UIA_CURSOR=never; select text cursor-free with find_text {ref, text}, then copy {ref}');
    const before = clipboardSequence();
    const copied = await uia.copy();
    // If Ctrl+C did not move the clipboard counter, nothing was selected — do NOT pass the prior (possibly secret /
    // unrelated) clipboard off as the copied selection (the discipline the copy {ref} path already applies).
    if (clipboardSequence() === before)
      return textResult(
        '(Ctrl+C changed nothing — likely no selection; not returning the existing clipboard, which may be unrelated. Read it explicitly with read_clipboard, or select text first with find_text {ref, text} then copy {ref}.)',
      );
    return textResult(capText(copied) || '(no selection / clipboard empty)');
  },
  cut: (args) => {
    const element = resolveRef(requireString(args, 'ref'));
    if (element.isPassword) return errorResult('refusing to cut a password field to the clipboard'); // a secret must never reach the clipboard (matches copy/read/inspect_element)
    const target = named(element);
    const handle = element.nativeWindowHandle;
    if (handle !== 0n) {
      // Cursor-free: select the control's text (when nothing is selected) then WM_CUT to its OWN HWND — no focus, works minimized/background/locked.
      if (element.getSelectedText().length === 0) selectAllInControl(handle);
      const before = clipboardSequence();
      cutFromControl(handle);
      // WM_CUT is synchronous; if the clipboard counter did not move the control ignored it (not a classic Edit / nothing to cut) — do not report a stale clipboard as the cut text.
      if (clipboardSequence() === before)
        return errorResult(`nothing was cut from ${target} — it did not honor WM_CUT (not a classic Edit, or nothing selected). Select text first (find_text {ref, text}), or target a classic Edit control.`);
      return withSnapshot(`cut ${target} to the clipboard cursor-free — ${JSON.stringify(capText(uia.readClipboard()))}`);
    }
    // WinUI/WPF/Chromium sub-control with no own HWND — only SendInput Ctrl+X reaches it.
    if (cursorDenied) return errorResult('this control has no native window handle for the cursor-free WM_CUT path, so cut would need SendInput Ctrl+X — disabled by BUN_UIA_CURSOR=never');
    element.focus();
    uia.sendKeys('Control+X');
    return withSnapshot(`cut ${target} (SendInput Ctrl+X) — ${JSON.stringify(capText(uia.readClipboard()))}`);
  },
  launch_app: async (args) => {
    const command = requireString(args, 'command');
    const timeout = typeof args.timeout === 'number' ? args.timeout : 8000;
    // $PATH spawn first; on failure fall back to ShellExecuteW, which resolves App-Paths registry entries + Store
    // execution aliases (winword, excel, wt, mspaint, …) that a bare CreateProcess on $PATH cannot find.
    let spawned = true;
    try {
      Bun.spawn(command.split(' '), { stdout: 'ignore', stderr: 'ignore' });
    } catch {
      spawned = false;
    }
    if (!spawned && !openPath(command))
      return errorResult(`could not launch ${JSON.stringify(command)} — not on PATH and ShellExecuteW could not resolve it. Check the name, pass a full path, or use run_program for a command line with arguments.`);
    const via = spawned ? '' : ' (via shell — App-Paths/alias)';
    if (typeof args.title !== 'string' && typeof args.className !== 'string') return textResult(`launched${via}: ${command}`);
    const target: { title?: string; className?: string } = {};
    if (typeof args.title === 'string') target.title = args.title;
    if (typeof args.className === 'string') target.className = args.className;
    try {
      const info = await uia.waitForWindow(target, { timeout });
      const window = uia.attach(info.hWnd);
      current?.dispose();
      current = null;
      attached?.dispose();
      lastSnapshotBody = '';
      lastSnapshotTree = null;
      attached = window;
      return withLaunchSettledSnapshot(`launched${via} and attached to ${JSON.stringify(window.name)}`);
    } catch {
      return errorResult(`launched${via} ${JSON.stringify(command)} but no window matching ${JSON.stringify(target)} appeared within ${timeout}ms — call list_windows / wait_for_window, then attach by hWnd.`);
    }
  },
  run_program: async (args) => {
    const command = requireString(args, 'command');
    const extra = Array.isArray(args.args) ? args.args.filter((part): part is string => typeof part === 'string') : [];
    const timeoutMs = typeof args.timeoutMs === 'number' && Number.isFinite(args.timeoutMs) && args.timeoutMs > 0 ? Math.min(args.timeoutMs, 300_000) : 30_000;
    const proc = Bun.spawn(extra.length > 0 ? [command, ...extra] : command.split(' '), { stdout: 'pipe', stderr: 'pipe' });
    let out = '';
    let err = '';
    // Drain incrementally so partial output survives a timeout-kill — a GUI/never-exiting process keeps its pipe open, so Response(...).text() would never resolve and would wedge the serialized dispatch chain.
    const drainOut = (async () => {
      const reader = proc.stdout.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        out += dec.decode(value, { stream: true });
      }
    })().catch(() => {});
    const drainErr = (async () => {
      const reader = proc.stderr.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        err += dec.decode(value, { stream: true });
      }
    })().catch(() => {});
    let timer: ReturnType<typeof setTimeout> | undefined;
    const outcome = await Promise.race([
      proc.exited.then(() => 'exited' as const),
      new Promise<'timeout'>((resolve) => {
        timer = setTimeout(() => resolve('timeout'), timeoutMs);
      }),
    ]);
    if (outcome === 'timeout') {
      proc.kill();
      return textResult(
        `run_program: ${JSON.stringify(command)} did not exit within ${timeoutMs}ms — killed it. That usually means a GUI app or a long-running/server process; launch GUI apps with launch_app (it attaches to the window), or pass a larger timeoutMs.\n--- stdout (partial) ---\n${out.slice(0, 8000)}${err.length > 0 ? `\n--- stderr (partial) ---\n${err.slice(0, 2000)}` : ''}`,
      );
    }
    if (timer !== undefined) clearTimeout(timer);
    await Promise.all([drainOut, drainErr]);
    const code = await proc.exited;
    return textResult(`exit ${code}\n--- stdout ---\n${out.slice(0, 8000)}${err.length > 0 ? `\n--- stderr ---\n${err.slice(0, 2000)}` : ''}`);
  },
  open_path: (args) => {
    const path = requireString(args, 'path');
    // ShellExecuteW (no shell, no command-line re-parse) — never `cmd /c start`, which is command-injectable.
    if (!openPath(path)) return errorResult(`open_path: the shell could not open ${JSON.stringify(path)} (no default handler, or the path does not exist)`);
    return textResult(`opened: ${path}`);
  },
  read_file: async (args) => {
    const text = await Bun.file(resolveFsPath(requireString(args, 'path'))).text();
    return textResult(text.length > 20_000 ? `${text.slice(0, 20_000)}\n…(truncated)` : text);
  },
  write_file: async (args) => {
    const path = resolveFsPath(requireString(args, 'path'));
    const bytes = await Bun.write(path, requireString(args, 'content'));
    return textResult(`wrote ${bytes} bytes to ${path}`);
  },
  list_dir: async (args) => {
    const entries = await readdir(resolveFsPath(requireString(args, 'path')), { withFileTypes: true });
    return textResult(entries.map((entry) => `${entry.isDirectory() ? 'd' : '-'} ${entry.name}`).join('\n') || '(empty directory)');
  },
};

async function dispatch(request: JsonRpcRequest): Promise<void> {
  const id = request.id;
  const isNotification = id === undefined;
  const reply = (result: object): void => {
    if (!isNotification) send({ jsonrpc: '2.0', id, result });
  };
  const fail = (code: number, message: string): void => {
    if (!isNotification) send({ jsonrpc: '2.0', id, error: { code, message } });
  };
  switch (request.method) {
    case 'initialize': {
      const requested = record(request.params).protocolVersion;
      const protocolVersion = typeof requested === 'string' && SUPPORTED_VERSIONS.has(requested) ? requested : PROTOCOL_VERSION;
      uia.initialize();
      log(`profile: ${(Bun.env.BUN_UIA_PROFILE ?? 'safe').toLowerCase()} → categories {${[...enabledCategories].join(',')}}; ${TOOLS.filter(toolAllowed).length}/${TOOLS.length} tools enabled`);
      return reply({ protocolVersion, capabilities: { tools: {} }, serverInfo: SERVER_INFO, instructions: enabledCategories.has('input') ? INSTRUCTIONS : INSTRUCTIONS_READONLY });
    }
    case 'notifications/initialized':
      return;
    case 'ping':
      return reply({});
    case 'tools/list':
      return reply({ tools: TOOLS.filter(toolAllowed) });
    case 'tools/call': {
      const callParams = record(request.params);
      const name = callParams.name;
      if (typeof name !== 'string') return fail(-32602, 'missing tool name');
      const tool = TOOLS.find((entry) => entry.name === name);
      if (tool === undefined) return fail(-32602, `unknown tool: ${name}`);
      if (!toolAllowed(tool)) {
        // Category-accurate remedy: BUN_UIA_OS=1 enables only os/fs; input/window need a profile bump or an allow-list entry.
        const remedy = tool.category === 'os' || tool.category === 'fs' ? `BUN_UIA_OS=1 (or BUN_UIA_PROFILE=full), or BUN_UIA_ALLOW=${name}` : `BUN_UIA_PROFILE=safe or full, or BUN_UIA_ALLOW=${name}`;
        return reply(errorResult(`tool "${name}" is disabled by the server policy (category "${tool.category}"). Enable it with ${remedy}.`));
      }
      try {
        return reply(await HANDLERS[name]!(record(callParams.arguments)));
      } catch (error) {
        return reply(errorResult(`Error: ${(error as Error).message}`));
      }
    }
    default:
      if (isNotification) return;
      return fail(-32601, `method not found: ${request.method}`);
  }
}

let pending: Promise<void> = Promise.resolve();

function enqueue(request: JsonRpcRequest): void {
  pending = pending.then(() => dispatch(request)).catch((error) => log('dispatch crash:', error));
}

async function main(): Promise<void> {
  let buffer = '';
  for await (const chunk of Bun.stdin.stream()) {
    buffer += decoder.decode(chunk, { stream: true });
    let newline = buffer.indexOf('\n');
    while (newline !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line.length > 0) {
        try {
          enqueue(JSON.parse(line));
        } catch {
          send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse error' } });
        }
      }
      newline = buffer.indexOf('\n');
    }
  }
  log('stdin closed, exiting');
  await pending; // drain the in-flight async dispatch chain before teardown — else a host's graceful stdin-close can
  // kill an async handler mid-await (write_file truncates-then-dies → an EMPTY target file; the reply is dropped).
  current?.dispose();
  attached?.dispose();
  uia.uninitialize();
  process.exit(0);
}

process.on('unhandledRejection', (reason) => log('unhandledRejection:', reason));
process.on('uncaughtException', (error) => log('uncaughtException:', error));
void main();
