#!/usr/bin/env bun
// A zero-dependency stdio MCP server exposing bun-uia (Playwright-for-desktop) to Claude and any MCP
// client. Snapshot-first: desktop_snapshot returns a compact ref-keyed UIA tree; action tools target
// a fresh 'eN' ref from the latest snapshot and auto-append a new one so the model re-grounds. All COM
// runs on the main STA thread; dispatch is serialized so two tools/call never overlap the apartment.
// Pure newline-delimited JSON-RPC 2.0 over stdin/stdout (no SDK); every diagnostic goes to stderr.

import User32 from '@bun-win32/user32';

import { clickAt, doubleClickAt, type Element, middleClickAt, renderSnapshot, rightClickAt, type Selector, type Snapshot, uia, type Window } from './index';

type JsonRpcId = string | number | null;
interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: JsonRpcId;
  method: string;
  params?: unknown;
}
type ToolHandler = (args: Record<string, unknown>) => object | Promise<object>;

const PROTOCOL_VERSION = '2025-06-18';
const SUPPORTED_VERSIONS = new Set(['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05']);
const SERVER_INFO = { name: 'bun-uia', version: '1.0.0' };
const INSTRUCTIONS =
  'Drive Windows desktop apps via the UI Automation tree. Call list_windows, then attach to a window. Call desktop_snapshot for a ref-keyed tree (e.g. Button "Five" [ref=e49]); pass that ref (and a human-readable element description) to click/invoke/type/toggle/set_value. Refs are valid ONLY for the most recent snapshot — every action returns a fresh snapshot; re-ground from it. Prefer invoke/set_value (they need no cursor and work on a locked session) over click.';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

let attached: Window | null = null;
let current: Snapshot | null = null;
let epoch = 0;

console.log = console.error; // hard guard: nothing but JSON-RPC ever reaches stdout

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

/** Rebuild the ref-keyed snapshot of the attached window, releasing the prior generation. */
function snapshotText(): string {
  const window = requireAttached();
  current?.dispose();
  current = uia.snapshot(window);
  epoch += 1;
  return `### Snapshot (epoch ${epoch}): ${JSON.stringify(window.name)}\n${renderSnapshot(current.tree)}`;
}

function resolveRef(ref: string): Element {
  const element = current?.resolve(ref) ?? null;
  if (element === null) throw new Error(`ref ${ref} not in the current snapshot (epoch ${epoch}) — capture a new desktop_snapshot`);
  return element;
}

function textResult(text: string): object {
  return { content: [{ type: 'text', text }] };
}

/** An action result: the message plus a fresh snapshot so the model re-grounds on the new state. */
function withSnapshot(message: string): object {
  return { content: [{ type: 'text', text: `${message}\n\n${snapshotText()}` }] };
}

function act(element: Element, action: string, text: string | undefined): string {
  if (action === 'invoke') return element.invoke(), 'invoked';
  if (action === 'click') return element.click(), 'clicked';
  if (action === 'type') return element.type(text ?? ''), 'typed';
  if (action === 'set_value') return element.setValue(text ?? ''), 'set value';
  if (action === 'toggle') return element.toggle(), `toggled (state ${element.toggleState})`;
  if (action === 'read') return `value: ${JSON.stringify(element.value || element.text() || element.name)}`;
  throw new Error(`unknown action: ${action}`);
}

const ELEMENT_DESC = 'Human-readable element description, used for the permission prompt and intent.';
const REF_DESC = 'Exact target element reference from the latest desktop_snapshot (e.g. e49).';
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

const TOOLS = [
  { name: 'list_windows', description: 'List visible top-level desktop windows (title, className, processId, hWnd). Start here.', inputSchema: { type: 'object', properties: {} }, annotations: { readOnlyHint: true } },
  {
    name: 'attach',
    description: 'Attach to a top-level window as the active root for snapshots and actions. Provide a title (exact), an hWnd from list_windows, or a processId.',
    inputSchema: { type: 'object', properties: { title: { type: 'string' }, hWnd: { type: 'string', description: 'Handle as a decimal or 0x-hex string' }, processId: { type: 'number' }, className: { type: 'string' } } },
  },
  {
    name: 'desktop_snapshot',
    description:
      'Capture the attached window as a compact ref-keyed UIA tree (e.g. Button "Five" [ref=e49]). Better than a screenshot for acting; every interactable node carries a [ref=eN] you pass to action tools. Refs are valid ONLY until the next snapshot.',
    inputSchema: { type: 'object', properties: { maxDepth: { type: 'number', description: 'Cap tree depth (default 40)' } } },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'find_and_act',
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
    name: 'click',
    description: 'Click a control (coordinate click at its bounds center). Prefer invoke when possible — it needs no cursor and works locked.',
    inputSchema: {
      type: 'object',
      properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC }, button: { type: 'string', enum: ['left', 'right', 'middle'] }, doubleClick: { type: 'boolean' } },
      required: ['element', 'ref'],
    },
  },
  {
    name: 'invoke',
    description: 'Invoke a control via the UIA Invoke pattern (buttons, links) — cursor-free, works on a locked session.',
    inputSchema: { type: 'object', properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC } }, required: ['element', 'ref'] },
  },
  {
    name: 'type',
    description: 'Type Unicode text into an editable control (focuses it, then sends keystrokes). Needs an unlocked desktop.',
    inputSchema: {
      type: 'object',
      properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC }, text: { type: 'string' }, submit: { type: 'boolean', description: 'Press Enter after' } },
      required: ['element', 'ref', 'text'],
    },
  },
  {
    name: 'set_value',
    description: 'Set a control value directly via the UIA Value pattern — no keystrokes, works locked.',
    inputSchema: { type: 'object', properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC }, value: { type: 'string' } }, required: ['element', 'ref', 'value'] },
  },
  {
    name: 'toggle',
    description: 'Toggle a checkbox or toggle button via the UIA Toggle pattern.',
    inputSchema: { type: 'object', properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC } }, required: ['element', 'ref'] },
  },
  {
    name: 'wait_for',
    description: 'Wait until a control matching the selector appears in the attached window, then return a fresh snapshot. On timeout, throws quoting the nearest candidates.',
    inputSchema: { type: 'object', properties: { selector: SELECTOR_SCHEMA, timeout: { type: 'number', description: 'Milliseconds (default 5000)' } }, required: ['selector'] },
  },
  { name: 'screenshot', description: 'Capture the attached window as a PNG image. Prefer desktop_snapshot for acting.', inputSchema: { type: 'object', properties: {} }, annotations: { readOnlyHint: true } },
  { name: 'get_focused', description: 'Return the desktop element that currently has keyboard focus (role, name, automationId, bounds).', inputSchema: { type: 'object', properties: {} }, annotations: { readOnlyHint: true } },
  { name: 'press_key', description: 'Send a key or chord to the focused control, e.g. "Enter", "Control+S", "Control+Shift+Tab", "F4".', inputSchema: { type: 'object', properties: { key: { type: 'string' } }, required: ['key'] } },
  {
    name: 'scroll',
    description: 'Scroll a control into view via the UIA ScrollItem pattern (targets a ref).',
    inputSchema: { type: 'object', properties: { element: { type: 'string', description: ELEMENT_DESC }, ref: { type: 'string', description: REF_DESC } }, required: ['element', 'ref'] },
  },
];

const HANDLERS: Record<string, ToolHandler> = {
  list_windows: () => {
    const windows = uia.windows();
    const lines = windows.map((window) => `- ${JSON.stringify(window.title)} [class=${window.className}] [pid=${window.processId}] [hWnd=0x${window.hWnd.toString(16)}]`);
    return textResult(lines.length > 0 ? lines.join('\n') : '(no visible top-level windows)');
  },
  attach: (args) => {
    current?.dispose();
    current = null;
    attached?.dispose();
    attached = null;
    if (typeof args.title === 'string') attached = uia.attach(typeof args.className === 'string' ? { className: args.className, title: args.title } : args.title);
    else if (typeof args.hWnd === 'string') attached = uia.attach(BigInt(args.hWnd));
    else if (typeof args.processId === 'number') attached = uia.attach({ process: args.processId });
    else throw new Error('attach requires one of: title, hWnd, processId');
    return withSnapshot(`attached to ${JSON.stringify(attached.name)}`);
  },
  desktop_snapshot: () => textResult(snapshotText()),
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
  click: (args) => {
    const element = resolveRef(requireString(args, 'ref'));
    const bounds = element.boundingRectangle;
    const centerX = bounds.x + Math.floor(bounds.width / 2);
    const centerY = bounds.y + Math.floor(bounds.height / 2);
    const handle = element.nativeWindowHandle;
    if (handle !== 0n) User32.SetForegroundWindow(handle);
    if (args.doubleClick === true) doubleClickAt(centerX, centerY);
    else if (args.button === 'right') rightClickAt(centerX, centerY);
    else if (args.button === 'middle') middleClickAt(centerX, centerY);
    else clickAt(centerX, centerY);
    return withSnapshot(`clicked ${quote(args.element)}`);
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
  wait_for: async (args) => {
    const found = await requireAttached().waitFor(selectorFrom(args.selector), { timeout: typeof args.timeout === 'number' ? args.timeout : 5000 });
    found.release();
    return withSnapshot(`matched ${quote(JSON.stringify(args.selector))}`);
  },
  screenshot: () => {
    const png = requireAttached().screenshot();
    if (png.length === 0) return { content: [{ type: 'text', text: 'screenshot was empty (locked session or zero-size window)' }], isError: true };
    return { content: [{ type: 'image', data: Buffer.from(png).toString('base64'), mimeType: 'image/png' }] };
  },
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
    resolveRef(requireString(args, 'ref')).scrollIntoView();
    return withSnapshot(`scrolled ${quote(args.element)} into view`);
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
      return reply({ protocolVersion, capabilities: { tools: {} }, serverInfo: SERVER_INFO, instructions: INSTRUCTIONS });
    }
    case 'notifications/initialized':
      return;
    case 'ping':
      return reply({});
    case 'tools/list':
      return reply({ tools: TOOLS });
    case 'tools/call': {
      const callParams = record(request.params);
      const name = callParams.name;
      if (typeof name !== 'string') return fail(-32602, 'missing tool name');
      const handler = HANDLERS[name];
      if (handler === undefined) return fail(-32602, `unknown tool: ${name}`);
      try {
        return reply(await handler(record(callParams.arguments)));
      } catch (error) {
        return reply({ content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true });
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
