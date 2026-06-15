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

import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  capSnapshot,
  captureWindowLive,
  captureWindowRGB,
  clickAt,
  closeWindow,
  diffTrees,
  doubleClickAt,
  dragTo,
  type Element,
  encodePNG,
  holdKey,
  isMaximized,
  isMinimized,
  listMonitors,
  maximizeWindow,
  middleClickAt,
  minimizeWindow,
  moveWindow,
  type MsaaNode,
  normalizeKey,
  postClickAt,
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
  type Selector,
  type Snapshot,
  type TableData,
  uia,
  type Window,
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
const SERVER_INFO = { name: 'bun-uia', version: '1.3.0' };
const INSTRUCTIONS =
  'Drive Windows desktop apps via the UI Automation tree — and beyond it. Call list_windows, then attach. Call desktop_snapshot for a ref-keyed tree (e.g. Button "Five" [ref=e49]); pass that ref to click/invoke/type/toggle/set_value/inspect_element. Refs are valid ONLY for the most recent snapshot — every action returns a fresh one; re-ground from it. To stay cheap, an action that changes little returns just a "Δ" delta (the +/-/~ changes, with refs on appeared/renamed) instead of the full tree — your other refs stay valid; desktop_snapshot {maxDepth} bounds the tree size when a window is large. Prefer invoke/set_value/toggle/scroll (cursor-free — they need no focus and work on a minimized, background, occluded, or locked window) over click. To SEE beyond the attached window (a 2nd monitor, a game/browser, a composited surface, or anything with no window) use screen_capture; to see a SPECIFIC window even when occluded, in the background, or GPU-composited (where a plain screenshot is blank) use capture_window (Windows.Graphics.Capture); turn a pixel into a control with inspect_point. screenshot auto-falls-back PrintWindow → WGC → desktop-region. Read legacy/owner-draw windows with native_tree/msaa_tree. drag/hold_key and real-cursor clicks move the actual mouse and need an unlocked, foregrounded desktop. launch/run/file tools and manage_window may be disabled by the server policy (BUN_UIA_PROFILE).';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

let attached: Window | null = null;
let current: Snapshot | null = null;
let epoch = 0;
let lastSnapshotBody = '';
let lastSnapshotTree: RefNode | null = null;

/** Hard char budget for an auto-appended snapshot body (~2k tokens) — bounds a heavy window per step. */
const SNAPSHOT_MAX_CHARS = 8_000;
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

const enabledCategories = new Set<ToolCategory>(PROFILES[(Bun.env.BUN_UIA_PROFILE ?? 'safe').toLowerCase()] ?? PROFILES.safe);
if (Bun.env.BUN_UIA_OS === '1') {
  enabledCategories.add('os');
  enabledCategories.add('fs');
}
const policyAllow = envSet('BUN_UIA_ALLOW');
const policyDeny = envSet('BUN_UIA_DENY');
const cursorDenied = (Bun.env.BUN_UIA_CURSOR ?? '').toLowerCase() === 'never';
const fsRoot = Bun.env.BUN_UIA_FS_ROOT !== undefined ? resolve(Bun.env.BUN_UIA_FS_ROOT) : undefined;

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

function selectorFrom(value: unknown): Selector {
  const raw = record(value);
  const selector: Selector = {};
  if (typeof raw.name === 'string') selector.name = raw.name;
  if (typeof raw.nameContains === 'string') selector.nameContains = raw.nameContains;
  if (typeof raw.automationId === 'string') selector.automationId = raw.automationId;
  if (typeof raw.className === 'string') selector.className = raw.className;
  if (typeof raw.controlType === 'number') selector.controlType = raw.controlType;
  return selector;
}

function requireAttached(): Window {
  if (attached === null) throw new Error('no window attached — call list_windows then attach first');
  return attached;
}

/** The handle a window-scoped tool targets: an explicit hWnd arg, a ref's native window, else the attached window. */
function resolveHwnd(args: Record<string, unknown>): bigint {
  if (typeof args.hWnd === 'string') return BigInt(args.hWnd);
  if (typeof args.ref === 'string') {
    const handle = resolveRef(args.ref).nativeWindowHandle;
    if (handle !== 0n) return handle;
  }
  return requireAttached().hWnd;
}

/** Rebuild the ref-keyed snapshot of the attached window, releasing the prior generation. Retries once after a
 *  short settle: BuildUpdatedCache can transiently fail while the view is mid-render. Leaves `current` null (not
 *  a dangling disposed snapshot) and rethrows if it cannot rebuild. */
function rebuildSnapshot(maxDepth?: number): { header: string; tree: RefNode } {
  const window = requireAttached();
  current?.dispose();
  current = null;
  let snapshot: Snapshot | null = null;
  for (let attempt = 0; ; attempt += 1) {
    // Chromium/Electron host their web/editor DOM in a child fragment the top-level walk misses — splice it in.
    const webRoots = window.webRoots();
    try {
      snapshot = uia.snapshot(window, { ...(maxDepth !== undefined ? { maxDepth } : {}), extraRoots: webRoots });
      break;
    } catch (error) {
      if (attempt >= 1) throw error;
      Bun.sleepSync(150);
    } finally {
      for (const root of webRoots) root.release();
    }
  }
  current = snapshot;
  epoch += 1;
  return { header: `### Snapshot (epoch ${epoch}): ${JSON.stringify(window.name)}`, tree: snapshot.tree };
}

/** Render a snapshot tree to the token-economical body an agent reads: pruned of ref-less noise, size-capped. */
function renderTree(tree: RefNode): string {
  return capSnapshot(renderSnapshot(pruneRefTree(tree) ?? tree), SNAPSHOT_MAX_CHARS);
}

function snapshotText(maxDepth?: number): string {
  const { header, tree } = rebuildSnapshot(maxDepth);
  const body = renderTree(tree);
  lastSnapshotTree = tree;
  lastSnapshotBody = body;
  return `${header}\n${body}`;
}

function resolveRef(ref: string): Element {
  const element = current?.resolve(ref) ?? null;
  if (element === null) throw new Error(`ref ${ref} not in the current snapshot (epoch ${epoch}) — capture a new desktop_snapshot`);
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
  lastSnapshotTree = tree;
  if (body === lastSnapshotBody) return textResult(`${message}\n\n${header}\n(no UI change since the last snapshot — refs unchanged)`);
  if (prior !== null) {
    const diff = diffTrees(prior, tree);
    const refChurn = diff.appeared.some((change) => change.ref !== undefined) || diff.disappeared.some((change) => change.ref !== undefined);
    if (!refChurn) {
      const delta = renderDiff(diff);
      if (delta.count > 0 && delta.count <= DIFF_MAX_CHANGES) {
        lastSnapshotBody = body;
        return textResult(`${message}\n\n${header} — Δ ${delta.count} change${delta.count === 1 ? '' : 's'} (other refs unchanged)\n${delta.text}`);
      }
    }
  }
  lastSnapshotBody = body;
  return textResult(`${message}\n\n${header}\n${body}`);
}

function act(element: Element, action: string, text: string | undefined): string {
  if (action === 'invoke') return element.invoke(), 'invoked';
  if (action === 'click') return clickElement(element, 'left', false, false), 'clicked';
  if (action === 'type') return element.type(text ?? ''), 'typed';
  if (action === 'set_value') return element.setValue(text ?? ''), 'set value';
  if (action === 'toggle') return element.toggle(), `toggled (state ${element.toggleState})`;
  if (action === 'read') return `value: ${JSON.stringify(element.value || element.text() || element.name)}`;
  throw new Error(`unknown action: ${action}`);
}

/** A guaranteed-hittable screen point for an element (UIA clickable point, else bounds center). */
function clickPoint(element: Element): { x: number; y: number } {
  const clickable = element.clickablePoint;
  if (clickable !== null) return clickable;
  const bounds = element.boundingRectangle;
  return { x: bounds.x + Math.floor(bounds.width / 2), y: bounds.y + Math.floor(bounds.height / 2) };
}

/**
 * Click an element CURSOR-FREE first (UIA invoke → posted WM_* click — both work on a background, minimized,
 * occluded, or locked window with no real cursor), falling back to a real SendInput click only for a
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
  if (!forceCursor && !doubleClick) {
    if (button === 'left') {
      try {
        element.invoke();
        return 'invoked (cursor-free)';
      } catch {
        // no Invoke pattern — try a posted click
      }
    }
    const point = clickPoint(element);
    if (postClickAt(point.x, point.y, button === 'right' ? 'right' : 'left')) return `posted ${button} click (cursor-free)`;
  }
  if (cursorDenied) throw new Error('cursor-free click was not possible and the real cursor is disabled (BUN_UIA_CURSOR=never)');
  const point = clickPoint(element);
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
  let out = `${indent}- ${role}${name}`;
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

/** Resolve a file-tool path, enforcing the BUN_UIA_FS_ROOT sandbox when one is set. */
function resolveFsPath(path: string): string {
  if (fsRoot === undefined) return path;
  const resolved = resolve(fsRoot, path);
  if (resolved !== fsRoot && !resolved.startsWith(`${fsRoot}\\`) && !resolved.startsWith(`${fsRoot}/`)) throw new Error(`path is outside the allowed root ${fsRoot}`);
  return resolved;
}

const ELEMENT_DESC = 'Human-readable element description, used for the permission prompt and intent.';
const REF_DESC = 'Exact target element reference from the latest desktop_snapshot (e.g. e49).';
const HWND_DESC = 'Target window handle as a decimal or 0x-hex string; omit to use the attached window.';
const SELECTOR_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    nameContains: { type: 'string' },
    automationId: { type: 'string' },
    className: { type: 'string' },
    controlType: { type: 'number', description: 'UIA control-type id, e.g. 50000 Button, 50004 Edit' },
  },
};

const TOOLS: McpTool[] = [
  { name: 'list_windows', category: 'read', description: 'List visible top-level windows (title, className, processId, exe, hWnd, minimized/maximized/foreground). Start here.', inputSchema: { type: 'object', properties: {} } },
  {
    name: 'attach',
    category: 'read',
    description: 'Attach to a top-level window as the active root for snapshots and actions. Provide a title (exact), an hWnd from list_windows, or a processId. Works on a minimized/background window.',
    inputSchema: { type: 'object', properties: { title: { type: 'string' }, hWnd: { type: 'string', description: 'Handle as a decimal or 0x-hex string' }, processId: { type: 'number' }, className: { type: 'string' } } },
  },
  {
    name: 'desktop_snapshot',
    category: 'read',
    description:
      'Capture the attached window as a compact ref-keyed UIA tree (e.g. Button "Five" [ref=e49]). Better than a screenshot for acting; every interactable node carries a [ref=eN] you pass to action tools. Refs are valid ONLY until the next snapshot.',
    inputSchema: { type: 'object', properties: { maxDepth: { type: 'number', description: 'Cap tree depth (default 40)' } } },
  },
  {
    name: 'find_and_act',
    category: 'input',
    description: 'Find a control and act in one call. Target by ref (from the latest snapshot) OR selector. Action is invoke|click|type|set_value|toggle|read.',
    inputSchema: {
      type: 'object',
      properties: {
        element: { type: 'string', description: ELEMENT_DESC },
        ref: { type: 'string', description: REF_DESC },
        selector: SELECTOR_SCHEMA,
        do: { type: 'string', enum: ['invoke', 'click', 'type', 'set_value', 'toggle', 'read'] },
        text: { type: 'string', description: 'Text for type / set_value' },
      },
      required: ['do'],
    },
  },
  {
    name: 'reveal',
    category: 'input',
    description:
      'Scroll a VIRTUALIZED / off-screen list, grid, or tree item into view by selector, then optionally act on it. Use when a desktop_snapshot omits an item because it is scrolled below the fold (Explorer folders, long lists, data grids) — those rows are not in the a11y tree until realized. Cursor-free, no focus. do = invoke|click|type|set_value|toggle|read; omit do to just bring it into the next snapshot (it then has a ref).',
    inputSchema: {
      type: 'object',
      properties: {
        element: { type: 'string', description: ELEMENT_DESC },
        selector: SELECTOR_SCHEMA,
        do: { type: 'string', enum: ['invoke', 'click', 'type', 'set_value', 'toggle', 'read'] },
        text: { type: 'string', description: 'Text for type / set_value' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'click',
    category: 'input',
    description:
      'Click a control. Cursor-free by default (UIA invoke, then a posted click — works on a background/minimized/occluded/locked window, no real cursor). Pass cursor:true (or right/middle/doubleClick) to move the REAL mouse, which needs an unlocked foregrounded desktop.',
    inputSchema: {
      type: 'object',
      properties: {
        element: { type: 'string', description: ELEMENT_DESC },
        ref: { type: 'string', description: REF_DESC },
        button: { type: 'string', enum: ['left', 'right', 'middle'] },
        doubleClick: { type: 'boolean' },
        cursor: { type: 'boolean', description: 'Force a real SendInput cursor click instead of the cursor-free path' },
      },
      required: ['element', 'ref'],
    },
  },
  {
    name: 'invoke',
    category: 'input',
    description: 'Invoke a control via the UIA Invoke pattern (buttons, links) — cursor-free, works on a background/locked window.',
    inputSchema: { type: 'object', properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC } }, required: ['element', 'ref'] },
  },
  {
    name: 'type',
    category: 'input',
    description: 'Type Unicode text into an editable control (focuses it, then sends keystrokes). Needs an unlocked desktop; prefer set_value when the control supports the Value pattern.',
    inputSchema: {
      type: 'object',
      properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC }, text: { type: 'string' }, submit: { type: 'boolean', description: 'Press Enter after' } },
      required: ['element', 'ref', 'text'],
    },
  },
  {
    name: 'set_value',
    category: 'input',
    description: 'Set a control value directly via the UIA Value pattern — no keystrokes, works on a background/locked window.',
    inputSchema: { type: 'object', properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC }, value: { type: 'string' } }, required: ['element', 'ref', 'value'] },
  },
  {
    name: 'toggle',
    category: 'input',
    description: 'Toggle a checkbox or toggle button via the UIA Toggle pattern (cursor-free).',
    inputSchema: { type: 'object', properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC } }, required: ['element', 'ref'] },
  },
  {
    name: 'select',
    category: 'input',
    description:
      'Select a list/grid/tree item via the UIA SelectionItem pattern — cursor-free, works on a background/locked window. mode: replace (default, clears other selections), add (multi-select — keeps the others), remove (deselect). The returned snapshot marks selected refs (selected).',
    inputSchema: {
      type: 'object',
      properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC }, mode: { type: 'string', enum: ['replace', 'add', 'remove'] } },
      required: ['element', 'ref'],
    },
  },
  {
    name: 'find_text',
    category: 'input',
    description:
      'Find a substring inside a text/document control and SELECT it — cursor-free, the desktop analog of getByText. Target the Document/Edit ref; the match becomes the active text selection so you can then copy it, replace it (set_value/type), or read it. Returns the matched text, or "not found".',
    inputSchema: {
      type: 'object',
      properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC }, text: { type: 'string' }, ignoreCase: { type: 'boolean' } },
      required: ['ref', 'text'],
    },
  },
  {
    name: 'wait_for',
    category: 'read',
    description: 'Wait until a control matching the selector appears in the attached window, then return a fresh snapshot. On timeout, throws quoting the nearest candidates.',
    inputSchema: { type: 'object', properties: { selector: SELECTOR_SCHEMA, timeout: { type: 'number', description: 'Milliseconds (default 5000)' } }, required: ['selector'] },
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
      'Wait until a top-level window matching title (substring) / className / process appears ANYWHERE on the desktop — driven by a SetWinEventHook event hook, not polling — then return its title/className/processId/hWnd. Resolves immediately if one is already open. Use to gate on a dialog, a just-launched app, or a page finishing navigation. Omit all fields to wait for any new window.',
    inputSchema: { type: 'object', properties: { title: { type: 'string' }, className: { type: 'string' }, process: { type: 'number' }, timeout: { type: 'number', description: 'Milliseconds (default 30000)' } } },
  },
  {
    name: 'wait_for_process',
    category: 'read',
    description: 'Wait until a process whose image name contains the given text is running (e.g. "chrome.exe"), then return its pid. Resolves immediately if already running. Use to trigger work the moment a process the agent is waiting on spawns.',
    inputSchema: { type: 'object', properties: { name: { type: 'string' }, timeout: { type: 'number', description: 'Milliseconds (default 30000)' } }, required: ['name'] },
  },
  {
    name: 'list_processes',
    category: 'read',
    description: 'List running processes as {processId, name} (optionally filtered by an image-name substring). Pair with wait_for_process / launch_app / attach by process.',
    inputSchema: { type: 'object', properties: { filter: { type: 'string', description: 'Case-insensitive image-name substring' } } },
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
    inputSchema: { type: 'object', properties: { ref: { type: 'string', description: REF_DESC }, hWnd: { type: 'string', description: HWND_DESC } } },
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
      'Dump the full live state of one ref: role, name, automationId, className, bounds, enabled, value, toggle/expand/selected/range/scroll state, clickable point, native window handle. Read state without round-tripping through the tree.',
    inputSchema: { type: 'object', properties: { ref: { type: 'string', description: REF_DESC } }, required: ['ref'] },
  },
  {
    name: 'read_table',
    category: 'read',
    description:
      'Read a data grid / list / table (Explorer details view, a DataGrid, a spreadsheet-like control) as structured rows — UIA GridPattern cell-by-cell, with column headers when available. Target a ref from the latest snapshot (the List/DataGrid/Table node). Returns a markdown table; far cheaper and more reliable than reading cells from a screenshot.',
    inputSchema: { type: 'object', properties: { ref: { type: 'string', description: REF_DESC }, maxRows: { type: 'number', description: 'Cap rows read (default 100)' } }, required: ['ref'] },
  },
  {
    name: 'native_tree',
    category: 'read',
    description: 'The raw native Win32 window hierarchy (HWND class, control id, WS_*/WS_EX_* styles, rect) — the Spy++ view, for classic-Win32 / owner-draw windows where the UIA tree is sparse. Reads any window, foreground or not.',
    inputSchema: { type: 'object', properties: { hWnd: { type: 'string', description: HWND_DESC }, maxDepth: { type: 'number', description: 'Default 12' } } },
  },
  {
    name: 'msaa_tree',
    category: 'read',
    description: 'The MSAA (oleacc IAccessible) tree of a window — the legacy fallback for owner-draw apps that expose no useful UIA tree.',
    inputSchema: { type: 'object', properties: { hWnd: { type: 'string', description: HWND_DESC }, maxDepth: { type: 'number', description: 'Default 8' } } },
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
    description: 'Send a key or chord to the focused control, e.g. "Enter", "Control+S", "Control+Shift+Tab", "F4". Needs an unlocked desktop.',
    inputSchema: { type: 'object', properties: { key: { type: 'string' } }, required: ['key'] },
  },
  {
    name: 'scroll',
    category: 'input',
    description:
      'Scroll a control. With a direction, scrolls the nearest ScrollPattern container by `amount` steps (cursor-free, works on a locked/background window); without a direction, scrolls the ref into view via the ScrollItem pattern.',
    inputSchema: {
      type: 'object',
      properties: {
        element: { type: 'string', description: ELEMENT_DESC },
        ref: { type: 'string', description: REF_DESC },
        direction: { type: 'string', enum: ['up', 'down', 'left', 'right'] },
        amount: { type: 'number', description: 'Scroll steps (default 3)' },
      },
      required: ['element', 'ref'],
    },
  },
  {
    name: 'drag',
    category: 'input',
    description:
      'Press-drag-release with the REAL mouse — drag-select text, drag-drop an icon/file, move a slider. Target raw points {fromX,fromY,toX,toY} or a ref start {ref,toX,toY}. Needs an unlocked foregrounded desktop; disabled by BUN_UIA_CURSOR=never.',
    inputSchema: {
      type: 'object',
      properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC }, fromX: { type: 'number' }, fromY: { type: 'number' }, toX: { type: 'number' }, toY: { type: 'number' } },
      required: ['toX', 'toY'],
    },
  },
  {
    name: 'hold_key',
    category: 'input',
    description: 'Press and hold a key for durationMs, then release (e.g. an arrow-repeat or a game key). Needs an unlocked desktop.',
    inputSchema: { type: 'object', properties: { key: { type: 'string' }, durationMs: { type: 'number', description: 'Default 1000' } }, required: ['key'] },
  },
  {
    name: 'manage_window',
    category: 'window',
    description: 'Move/resize/minimize/maximize/restore/raise/close a window WITHOUT activating it (works on a background window; raise is a best-effort z-order restack, not a true bring-to-front). move needs x,y,width,height.',
    inputSchema: {
      type: 'object',
      properties: {
        hWnd: { type: 'string', description: HWND_DESC },
        ref: { type: 'string', description: REF_DESC },
        action: { type: 'string', enum: ['move', 'minimize', 'maximize', 'restore', 'raise', 'close'] },
        x: { type: 'number' },
        y: { type: 'number' },
        width: { type: 'number' },
        height: { type: 'number' },
      },
      required: ['action'],
    },
  },
  { name: 'read_clipboard', category: 'read', description: 'Read the Windows clipboard as text. Pairs with copy (Ctrl+C) to pull selected text from any app, even one with no a11y tree.', inputSchema: { type: 'object', properties: {} } },
  { name: 'set_clipboard', category: 'input', description: 'Set the Windows clipboard text (does not paste).', inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  {
    name: 'paste',
    category: 'input',
    description:
      'Paste text into the focused control via the clipboard + Ctrl+V — the reliable large-text path. Optionally focus a ref first; omit text to paste the current clipboard. Prefer set_value (cursor-free) when the control supports the Value pattern.',
    inputSchema: {
      type: 'object',
      properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC }, text: { type: 'string', description: 'Text to paste (omit to paste the current clipboard)' } },
    },
  },
  { name: 'copy', category: 'input', description: 'Copy the current selection (Ctrl+C) and return it — pull selected text from any app, even one with no a11y tree.', inputSchema: { type: 'object', properties: {} } },
  {
    name: 'launch_app',
    category: 'os',
    description: 'Start a program. With a title/className, waits for its window and attaches (returns a snapshot); otherwise just spawns it. Gated — disabled unless the server policy enables the "os" category.',
    inputSchema: {
      type: 'object',
      properties: { command: { type: 'string', description: 'Executable + args, space-separated (e.g. "notepad.exe")' }, title: { type: 'string' }, className: { type: 'string' }, timeout: { type: 'number' } },
      required: ['command'],
    },
  },
  {
    name: 'run_program',
    category: 'os',
    description: 'Run a command and return its exit code, stdout, and stderr. Gated behind the "os" policy category.',
    inputSchema: { type: 'object', properties: { command: { type: 'string' }, args: { type: 'array', items: { type: 'string' } } }, required: ['command'] },
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

const HANDLERS: Record<string, ToolHandler> = {
  list_windows: () => {
    const lines = uia.windows().map((window) => {
      const state = [isMinimized(window.hWnd) ? 'min' : '', isMaximized(window.hWnd) ? 'max' : ''].filter(Boolean).join(',');
      const exe = processImagePath(window.processId).split('\\').pop() ?? '';
      return `- ${JSON.stringify(window.title)} [class=${window.className}] [pid=${window.processId}${exe ? ` ${exe}` : ''}] [hWnd=0x${window.hWnd.toString(16)}]${state ? ` (${state})` : ''}`;
    });
    return textResult(lines.length > 0 ? lines.join('\n') : '(no visible top-level windows)');
  },
  attach: (args) => {
    current?.dispose();
    current = null;
    attached?.dispose();
    attached = null;
    lastSnapshotBody = '';
    lastSnapshotTree = null;
    if (typeof args.title === 'string') attached = uia.attach(typeof args.className === 'string' ? { className: args.className, title: args.title } : args.title);
    else if (typeof args.hWnd === 'string') attached = uia.attach(BigInt(args.hWnd));
    else if (typeof args.processId === 'number') attached = uia.attach({ process: args.processId });
    else throw new Error('attach requires one of: title, hWnd, processId');
    return withSnapshot(`attached to ${JSON.stringify(attached.name)}`);
  },
  desktop_snapshot: (args) => textResult(snapshotText(typeof args.maxDepth === 'number' ? args.maxDepth : undefined)),
  find_and_act: (args) => {
    const action = requireString(args, 'do');
    if (typeof args.ref === 'string') return withSnapshot(act(resolveRef(args.ref), action, typeof args.text === 'string' ? args.text : undefined));
    const window = requireAttached();
    const selector = selectorFrom(args.selector);
    const element = window.find(selector);
    if (element === null) throw new Error(window.describeNoMatch(selector));
    try {
      return withSnapshot(act(element, action, typeof args.text === 'string' ? args.text : undefined));
    } finally {
      element.release();
    }
  },
  reveal: (args) => {
    const window = requireAttached();
    const selector = selectorFrom(args.selector);
    const element = window.reveal(selector);
    if (element === null) throw new Error(`reveal could not surface a match by scrolling — ${window.describeNoMatch(selector)}`);
    try {
      const outcome = typeof args.do === 'string' ? act(element, args.do, typeof args.text === 'string' ? args.text : undefined) : 'revealed';
      return withSnapshot(`${outcome} ${quote(args.element)}`);
    } finally {
      element.release();
    }
  },
  click: (args) => {
    const element = resolveRef(requireString(args, 'ref'));
    const button = args.button === 'right' ? 'right' : args.button === 'middle' ? 'middle' : 'left';
    const outcome = clickElement(element, button, args.doubleClick === true, args.cursor === true);
    return withSnapshot(`${outcome} ${quote(args.element)}`);
  },
  invoke: (args) => {
    resolveRef(requireString(args, 'ref')).invoke();
    return withSnapshot(`invoked ${quote(args.element)}`);
  },
  type: (args) => {
    resolveRef(requireString(args, 'ref')).type(requireString(args, 'text'));
    if (args.submit === true) uia.sendKeys('Enter');
    return withSnapshot(`typed into ${quote(args.element)}${args.submit === true ? ' and pressed Enter' : ''}`);
  },
  set_value: (args) => {
    resolveRef(requireString(args, 'ref')).setValue(requireString(args, 'value'));
    return withSnapshot(`set ${quote(args.element)} = ${JSON.stringify(args.value)}`);
  },
  toggle: (args) => {
    const element = resolveRef(requireString(args, 'ref'));
    element.toggle();
    return withSnapshot(`toggled ${quote(args.element)} (state ${element.toggleState})`);
  },
  select: (args) => {
    const element = resolveRef(requireString(args, 'ref'));
    const mode = args.mode === 'add' ? 'add' : args.mode === 'remove' ? 'remove' : 'replace';
    if (mode === 'add') element.addToSelection();
    else if (mode === 'remove') element.removeFromSelection();
    else element.select();
    return withSnapshot(`${mode === 'add' ? 'added to selection' : mode === 'remove' ? 'removed from selection' : 'selected'} ${quote(args.element)}`);
  },
  find_text: (args) => {
    const matched = resolveRef(requireString(args, 'ref')).selectText(requireString(args, 'text'), { ignoreCase: args.ignoreCase === true });
    return textResult(matched === null ? `text not found (or the control has no TextPattern): ${JSON.stringify(args.text)}` : `found and selected ${JSON.stringify(matched)} — now the active text selection (copy / set_value / read it)`);
  },
  wait_for: async (args) => {
    const found = await requireAttached().waitFor(selectorFrom(args.selector), { timeout: typeof args.timeout === 'number' ? args.timeout : 5000 });
    found.release();
    return withSnapshot(`matched ${quote(JSON.stringify(args.selector))}`);
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
    const info = await uia.waitForWindow(match, { timeout: typeof args.timeout === 'number' ? args.timeout : 30000 });
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
  screenshot: async () => {
    const window = requireAttached();
    const capture = captureWindowRGB(window.hWnd);
    if (capture !== null && !isNearUniform(capture.rgb)) return imageResult(encodePNG(capture.rgb, capture.width, capture.height));
    const live = await captureWindowLive(window.hWnd);
    if (live !== null && !isNearUniform(live.rgb)) return imageResult(encodePNG(live.rgb, live.width, live.height), '(PrintWindow was blank — Windows.Graphics.Capture live frame of the GPU/occluded surface)');
    const bounds = window.boundingRectangle;
    if (bounds.width > 0 && bounds.height > 0)
      return imageResult(uia.screenshotScreen({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }), '(PrintWindow + WGC blank — desktop-region fallback; only the on-screen, non-occluded part)');
    return errorResult('screenshot was empty (locked session, zero-size, or fully off-screen window)');
  },
  capture_window: async (args) => {
    const live = await captureWindowLive(resolveHwnd(args));
    if (live === null) return errorResult('Windows.Graphics.Capture could not capture this window (minimized with no surface, protected/DRM content, or WGC unavailable)');
    return imageResult(encodePNG(live.rgb, live.width, live.height));
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
    current = uia.snapshot(window);
    epoch += 1;
    lastSnapshotTree = current.tree;
    lastSnapshotBody = renderTree(current.tree);
    const marked = screenshotWithMarks(window, current);
    if (marked.png.length === 0) return errorResult('screenshot_marked was blank (locked session / PrintWindow); use screen_capture for the visible pixels and desktop_snapshot for the refs');
    const legend = marked.marks.map((mark) => `[${mark.label}] ${mark.role} ${JSON.stringify(mark.name)} → ${mark.ref}`).join('\n');
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
    const value = element.value;
    if (value.length > 0) lines.push(`value: ${JSON.stringify(value)}`);
    if (element.toggleState >= 0) lines.push(`toggleState: ${element.toggleState} (0=off,1=on,2=indeterminate)`);
    if (element.expandCollapseState >= 0) lines.push(`expandCollapseState: ${element.expandCollapseState} (0=collapsed,1=expanded,2=partial,3=leaf)`);
    if (element.isSelected) lines.push('selected: true');
    if (!Number.isNaN(element.rangeValue)) lines.push(`rangeValue: ${element.rangeValue}`);
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
    return textResult(lines.join('\n'));
  },
  read_table: (args) => {
    const table = resolveRef(requireString(args, 'ref')).readTable(typeof args.maxRows === 'number' ? args.maxRows : undefined);
    return textResult(table === null ? '(no table at this ref — it does not expose the UIA Grid pattern; try a different ref, e.g. the List/DataGrid node)' : renderTable(table));
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
      return textResult(`${element.controlTypeName} ${JSON.stringify(element.name)}${id} {x:${bounds.x},y:${bounds.y} w:${bounds.width} h:${bounds.height}}`);
    } finally {
      element.release();
    }
  },
  press_key: (args) => {
    uia.sendKeys(requireString(args, 'key'));
    return withSnapshot(`pressed ${JSON.stringify(args.key)}`);
  },
  scroll: (args) => {
    const element = resolveRef(requireString(args, 'ref'));
    const direction = args.direction;
    if (direction === 'up' || direction === 'down' || direction === 'left' || direction === 'right') {
      const amount = typeof args.amount === 'number' ? args.amount : 3;
      const info = element.scrollInfo;
      if (info !== null) {
        const horizontal = direction === 'left' || direction === 'right';
        const step = direction === 'up' || direction === 'left' ? ScrollAmount.SmallDecrement : ScrollAmount.SmallIncrement;
        for (let count = 0; count < Math.max(1, amount); count += 1) element.scroll(horizontal ? step : ScrollAmount.NoAmount, horizontal ? ScrollAmount.NoAmount : step);
        return withSnapshot(`scrolled ${quote(args.element)} ${direction} ${amount}`);
      }
      const bounds = element.boundingRectangle;
      if (scrollAt(bounds.x + Math.floor(bounds.width / 2), bounds.y + Math.floor(bounds.height / 2), direction, amount)) return withSnapshot(`scrolled ${quote(args.element)} ${direction} ${amount}`);
      return withSnapshot(`no scrollable container at ${quote(args.element)}`);
    }
    element.scrollIntoView();
    return withSnapshot(`scrolled ${quote(args.element)} into view`);
  },
  drag: (args) => {
    if (cursorDenied) return errorResult('drag moves the real cursor, disabled by BUN_UIA_CURSOR=never');
    let fromX: number;
    let fromY: number;
    if (typeof args.ref === 'string') {
      const point = clickPoint(resolveRef(args.ref));
      fromX = point.x;
      fromY = point.y;
    } else {
      fromX = requireNumber(args, 'fromX');
      fromY = requireNumber(args, 'fromY');
    }
    const toX = requireNumber(args, 'toX');
    const toY = requireNumber(args, 'toY');
    dragTo(fromX, fromY, toX, toY);
    return withSnapshot(`dragged ${fromX},${fromY} → ${toX},${toY}`);
  },
  hold_key: async (args) => {
    await holdKey(normalizeKey(requireString(args, 'key')), typeof args.durationMs === 'number' ? args.durationMs : 1000);
    return withSnapshot(`held ${JSON.stringify(args.key)} for ${typeof args.durationMs === 'number' ? args.durationMs : 1000}ms`);
  },
  manage_window: (args) => {
    const hWnd = resolveHwnd(args);
    const action = requireString(args, 'action');
    if (action === 'minimize') minimizeWindow(hWnd);
    else if (action === 'maximize') maximizeWindow(hWnd);
    else if (action === 'restore') restoreWindow(hWnd);
    else if (action === 'raise') raiseWindow(hWnd);
    else if (action === 'close') closeWindow(hWnd);
    else if (action === 'move') moveWindow(hWnd, requireNumber(args, 'x'), requireNumber(args, 'y'), requireNumber(args, 'width'), requireNumber(args, 'height'));
    else throw new Error(`unknown manage_window action: ${action}`);
    return textResult(`window ${action} (hWnd=0x${hWnd.toString(16)})`);
  },
  read_clipboard: () => textResult(uia.readClipboard() || '(clipboard empty or not text)'),
  set_clipboard: (args) => textResult(uia.writeClipboard(requireString(args, 'text')) ? 'clipboard set' : 'failed to set clipboard'),
  paste: (args) => {
    if (typeof args.ref === 'string') resolveRef(args.ref).focus();
    if (typeof args.text === 'string') uia.paste(args.text);
    else uia.sendKeys('Control+V');
    const into = typeof args.ref === 'string' ? ` into ${quote(args.element)}` : '';
    return withSnapshot(typeof args.text === 'string' ? `pasted ${args.text.length} chars${into}` : `pasted clipboard${into}`);
  },
  copy: async () => textResult((await uia.copy()) || '(no selection / clipboard empty)'),
  launch_app: async (args) => {
    const command = requireString(args, 'command');
    if (typeof args.title === 'string' || typeof args.className === 'string') {
      const target: { title?: string; className?: string } = {};
      if (typeof args.title === 'string') target.title = args.title;
      if (typeof args.className === 'string') target.className = args.className;
      const window = await uia.launch(command.split(' '), target, typeof args.timeout === 'number' ? args.timeout : 8000);
      current?.dispose();
      current = null;
      attached?.dispose();
      lastSnapshotBody = '';
      lastSnapshotTree = null;
      attached = window;
      return withSnapshot(`launched and attached to ${JSON.stringify(window.name)}`);
    }
    Bun.spawn(command.split(' '), { stdout: 'ignore', stderr: 'ignore' });
    return textResult(`launched: ${command}`);
  },
  run_program: async (args) => {
    const command = requireString(args, 'command');
    const extra = Array.isArray(args.args) ? args.args.filter((part): part is string => typeof part === 'string') : [];
    const proc = Bun.spawn(extra.length > 0 ? [command, ...extra] : command.split(' '), { stdout: 'pipe', stderr: 'pipe' });
    const [out, err] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
    const code = await proc.exited;
    return textResult(`exit ${code}\n--- stdout ---\n${out.slice(0, 8000)}${err.length > 0 ? `\n--- stderr ---\n${err.slice(0, 2000)}` : ''}`);
  },
  open_path: (args) => {
    const path = requireString(args, 'path');
    Bun.spawn(['cmd', '/c', 'start', '', path], { stdout: 'ignore', stderr: 'ignore' });
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
      return reply({ protocolVersion, capabilities: { tools: {} }, serverInfo: SERVER_INFO, instructions: INSTRUCTIONS });
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
      if (!toolAllowed(tool)) return reply(errorResult(`tool "${name}" is disabled by the server policy (category "${tool.category}"). Enable it with BUN_UIA_PROFILE=full, BUN_UIA_OS=1, or BUN_UIA_ALLOW=${name}.`));
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
  current?.dispose();
  attached?.dispose();
  uia.uninitialize();
  process.exit(0);
}

process.on('unhandledRejection', (reason) => log('unhandledRejection:', reason));
process.on('uncaughtException', (error) => log('uncaughtException:', error));
void main();
