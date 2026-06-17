// Java Access Bridge engine — read the accessibility tree of a Java Swing/AWT/JavaFX window, which exposes NOTHING
// to UIA or MSAA (only its top-level frame). The JVM speaks a separate protocol over WindowsAccessBridge-64.dll
// (a flat C-export system DLL, present wherever a JAB-enabled JDK/JRE is). The bridge registers running JVMs via a
// window-message handshake, so after Windows_run() the client MUST pump its message queue once for the JVM to be
// discovered; thereafter the read calls round-trip synchronously (SendMessage), no per-call pump needed. JOBJECT64 =
// jlong (i64) on the 64-bit bridge; vmID = Windows long (i32); HWND = u64; BOOL/jint = i32.
//
// READ (javaTree) and ACT (javaInvoke = doAccessibleActions, javaSetText = setTextContents) are BOTH cursor-free /
// background — invoke a button, toggle a check box, type into a field with no cursor and no foreground (verified: acting
// on a backgrounded Swing window steals no foreground).
//
// Selection: javaInvoke ALREADY selects a JList item (the row's own accessible action selects it — verified). A
// JComboBox/JTree item, though, can report invoke-success WITHOUT selecting (silent false success). A dedicated
// java_select via addAccessibleSelectionFromContext is feasible but DEFERRED: the selection index is widget-specific
// (JList = child index; JComboBox = item MODEL index, since items nest under a "popup menu"; JTree = visible-row index ≠
// sibling index) and the selection container must be found via the AccessibleContextInfo accessibleSelection flag — too
// silent-false-success-prone to ship without a careful per-widget verification pass. (A slider/spinner SET has NO flat
// export: the bridge's AccessibleValue interface is read-only — only get{Current,Maximum,Minimum}AccessibleValueFromContext
// exist — so a cursor-free value SET would need focus + posted keys, not a JAB primitive.)
//
// NOTE: bound via raw dlopen (the same in-package precedent as wgc.ts's d3d11 interop), not a @bun-win32 package — an
// internal alternate engine; only ~9 read/act exports are used. WindowsAccessBridge-64.dll is ABSENT on machines
// without a JAB-enabled JDK/JRE, so the dlopen is LAZY + fault-tolerant (see ensureStarted): a missing bridge degrades to
// isJavaWindow()=false / javaTree()=null / javaInvoke()=false, never a throw at import (a top-level dlopen would brick the
// whole package on a Java-less box). A full @bun-win32/windowsaccessbridge package is a verified-feasible future extraction.

import { dlopen, FFIType } from 'bun:ffi';

import User32 from '@bun-win32/user32';

import type { Rect } from './reads';

function openBridge() {
  return dlopen('WindowsAccessBridge-64.dll', {
    Windows_run: { args: [], returns: FFIType.void },
    isJavaWindow: { args: [FFIType.u64], returns: FFIType.i32 },
    getAccessibleContextFromHWND: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleContextInfo: { args: [FFIType.i32, FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    getAccessibleChildFromContext: { args: [FFIType.i32, FFIType.i64, FFIType.i32], returns: FFIType.i64 },
    getAccessibleActions: { args: [FFIType.i32, FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    doAccessibleActions: { args: [FFIType.i32, FFIType.i64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    setTextContents: { args: [FFIType.i32, FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    releaseJavaObject: { args: [FFIType.i32, FFIType.i64], returns: FFIType.void },
  }).symbols;
}

type Bridge = ReturnType<typeof openBridge>;

let jab: Bridge | null = null;

export interface JavaNode {
  role: string;
  name: string;
  states: string;
  description: string;
  bounds: Rect;
  children: JavaNode[];
  truncated?: boolean; // set on the root when maxDepth/maxNodes cut the traversal short
}

/** Selects a control to act on by its AccessibleName (as shown by java_tree), optionally narrowed by an en_US role
 *  substring (e.g. 'push button', 'check box') to disambiguate same-named controls. */
export interface JavaTarget {
  name: string;
  role?: string;
}

// AccessibleContextInfo field byte offsets (wchar_t=2B; MAX_STRING_SIZE=1024, SHORT_STRING_SIZE=256 — verified vs
// AccessBridgePackages.h): name[1024]@0, description[1024]@2048, role[256]@4096, role_en_US@4608, states@5120,
// states_en_US@5632, then jint indexInParent@6144, childrenCount@6148, x@6152, y@6156, width@6160, height@6164.
const INFO_SIZE = 6400; // > 6188 actual; padded headroom

// AccessibleActions (getAccessibleActions output): jint actionsCount@0, then AccessibleActionInfo actionInfo[256], each
// a wchar_t name[256] (512B) — first action name at @4. AccessibleActionsToDo (doAccessibleActions input): jint
// actionsCount@0, then AccessibleActionInfo actionInfo[32]; we set count=1 and write one action name at @4. Verified vs
// AccessBridgePackages.h (MAX_ACTION_INFO=256, MAX_ACTIONS_TO_DO=32, SHORT_STRING_SIZE=256).
const ACTIONS_SIZE = 4 + 256 * 512 + 16; // getAccessibleActions output buffer (DLL fills it)
const ACTIONS_TODO_SIZE = 4 + 32 * 512 + 16; // doAccessibleActions input buffer

const PM_REMOVE = 0x0001;
const MSG = Buffer.allocUnsafe(48); // x64 MSG is 48 bytes; reused — its .ptr is read inline at each PeekMessage call
let started = false;

/** Drain the thread's Win32 message queue for `rounds` × ~30ms — lets the JAB↔JVM registration handshake messages
 *  flow. A freshly-started or late-launched JVM is only discovered once these are pumped. */
function pump(rounds: number): void {
  for (let round = 0; round < rounds; round += 1) {
    while (User32.PeekMessageW(MSG.ptr!, 0n, 0, 0, PM_REMOVE) !== 0) {
      User32.TranslateMessage(MSG.ptr!);
      User32.DispatchMessageW(MSG.ptr!);
    }
    Bun.sleepSync(30);
  }
}

/** Open the bridge once and complete the initial JVM-discovery handshake. Idempotent. If WindowsAccessBridge-64.dll is
 *  absent (no JAB-enabled JVM on this machine), `jab` stays null and every public call degrades to its empty contract —
 *  the dlopen must NOT throw at import time (index.ts/mcp.ts import this module unconditionally). */
function ensureStarted(): void {
  if (started) return;
  started = true;
  try {
    jab = openBridge();
    jab.Windows_run();
    pump(40); // ~1.2s — generous for the JVM to post its registration
  } catch {
    jab = null; // bridge DLL not present — no Java introspection on this box
  }
}

function readWChar(buffer: Buffer, byteOffset: number, maxChars: number): string {
  const end = byteOffset + maxChars * 2;
  let text = '';
  for (let offset = byteOffset; offset < end; offset += 2) {
    const code = buffer.readUInt16LE(offset);
    if (code === 0) break;
    text += String.fromCharCode(code);
  }
  return text;
}

/** Whether the JAB recognizes this window as a Java window (Swing/AWT/JavaFX with the Access Bridge loaded). */
export function isJavaWindow(hWnd: bigint): boolean {
  ensureStarted();
  const bridge = jab;
  if (bridge === null) return false;
  pump(2); // catch a JVM that launched after our handshake
  return bridge.isJavaWindow(hWnd) !== 0;
}

function walk(bridge: Bridge, vmID: number, context: bigint, depth: number, maxDepth: number, budget: { remaining: number; truncated: boolean }): JavaNode | null {
  const info = Buffer.allocUnsafe(INFO_SIZE);
  if (bridge.getAccessibleContextInfo(vmID, context, info.ptr!) === 0) return null;
  const node: JavaNode = {
    role: readWChar(info, 4608, 256) || readWChar(info, 4096, 256), // role_en_US (stable), fall back to localized role
    name: readWChar(info, 0, 1024),
    states: readWChar(info, 5632, 256), // states_en_US (stable, comma-separated)
    description: readWChar(info, 2048, 1024),
    bounds: { x: info.readInt32LE(6152), y: info.readInt32LE(6156), width: info.readInt32LE(6160), height: info.readInt32LE(6164) },
    children: [],
  };
  const childrenCount = info.readInt32LE(6148);
  if (depth < maxDepth) {
    for (let index = 0; index < childrenCount; index += 1) {
      if (budget.remaining <= 0) {
        budget.truncated = true; // node-budget exhausted with siblings still unread
        break;
      }
      const child = bridge.getAccessibleChildFromContext(vmID, context, index);
      if (child === 0n) continue;
      budget.remaining -= 1;
      const childNode = walk(bridge, vmID, child, depth + 1, maxDepth, budget);
      bridge.releaseJavaObject(vmID, child); // release every context the bridge handed us (JVM-side ref)
      if (childNode !== null) node.children.push(childNode);
    }
  } else if (childrenCount > 0) {
    budget.truncated = true; // depth cap hit with children left unread
  }
  return node;
}

/** Resolve a Java window to its (vmID, root AccessibleContext), or null if it is not a bridge-visible Java window. The
 *  caller MUST releaseJavaObject(vmID, root) when done — the bridge hands back a JVM-side ref. */
function resolveRoot(bridge: Bridge, hWnd: bigint): { vmID: number; root: bigint } | null {
  pump(2); // catch a JVM that launched after our handshake
  if (bridge.isJavaWindow(hWnd) === 0) return null;
  const vmidBuffer = Buffer.allocUnsafe(4);
  const contextBuffer = Buffer.allocUnsafe(8);
  if (bridge.getAccessibleContextFromHWND(hWnd, vmidBuffer.ptr!, contextBuffer.ptr!) === 0) return null;
  const vmID = vmidBuffer.readInt32LE(0);
  const root = contextBuffer.readBigUInt64LE(0);
  return root === 0n ? null : { vmID, root };
}

/** Read a Java window's accessibility tree via the Access Bridge, or null if it is not a (bridge-visible) Java window.
 *  `maxDepth` bounds depth, `maxNodes` bounds total nodes (a deep Swing tree can be large). Read-only, cursor-free. */
export function javaTree(hWnd: bigint, options: { maxDepth?: number; maxNodes?: number } = {}): JavaNode | null {
  ensureStarted();
  const bridge = jab;
  if (bridge === null) return null;
  const resolved = resolveRoot(bridge, hWnd);
  if (resolved === null) return null;
  const { vmID, root } = resolved;
  const budget = { remaining: options.maxNodes ?? 2000, truncated: false };
  try {
    const tree = walk(bridge, vmID, root, 0, options.maxDepth ?? 24, budget);
    if (tree !== null && budget.truncated) tree.truncated = true;
    return tree;
  } finally {
    bridge.releaseJavaObject(vmID, root);
  }
}

/** Walk to the FIRST context whose AccessibleName matches `target` (optionally narrowed by an en_US role substring) and
 *  run `perform` on it while it is live, releasing every fetched context exactly once (as the read walk does). Returns
 *  true once a match is handled, to stop the search. */
function findAndAct(bridge: Bridge, vmID: number, context: bigint, target: JavaTarget, perform: (matched: bigint) => void, depth: number): boolean {
  const info = Buffer.allocUnsafe(INFO_SIZE);
  if (bridge.getAccessibleContextInfo(vmID, context, info.ptr!) === 0) return false;
  const name = readWChar(info, 0, 1024);
  const role = readWChar(info, 4608, 256) || readWChar(info, 4096, 256);
  if (name === target.name && (target.role === undefined || role.includes(target.role))) {
    perform(context); // context is live here; the parent loop releases it after we return
    return true;
  }
  const childrenCount = info.readInt32LE(6148);
  if (depth < 64) {
    for (let index = 0; index < childrenCount; index += 1) {
      const child = bridge.getAccessibleChildFromContext(vmID, context, index);
      if (child === 0n) continue;
      let handled = false;
      try {
        handled = findAndAct(bridge, vmID, child, target, perform, depth + 1);
      } finally {
        bridge.releaseJavaObject(vmID, child);
      }
      if (handled) return true;
    }
  }
  return false;
}

/** Perform a control's first accessible action (its name from getAccessibleActions, e.g. 'click'; fall back to
 *  'click') via doAccessibleActions. Returns whether the bridge reported success. */
function invokeAction(bridge: Bridge, vmID: number, context: bigint): boolean {
  const actions = Buffer.allocUnsafe(ACTIONS_SIZE);
  // Read actionInfo[0].name (@4) ONLY when getAccessibleActions succeeded AND actionsCount(@0) > 0 — otherwise the
  // allocUnsafe tail is uninitialized, so guard on the count to deterministically fall back to 'click'.
  const actionName = bridge.getAccessibleActions(vmID, context, actions.ptr!) !== 0 && actions.readInt32LE(0) > 0 ? readWChar(actions, 4, 256) : '';
  const chosen = actionName.length > 0 ? actionName : 'click';
  const todo = Buffer.alloc(ACTIONS_TODO_SIZE); // zeroed: a clean actionsCount=1 + one NUL-terminated action name
  todo.writeInt32LE(1, 0);
  for (let index = 0; index < chosen.length && index < 255; index += 1) todo.writeUInt16LE(chosen.charCodeAt(index), 4 + index * 2);
  const failure = Buffer.allocUnsafe(4);
  return bridge.doAccessibleActions(vmID, context, todo.ptr!, failure.ptr!) !== 0;
}

/** Replace a text control's contents via setTextContents — it sets the document model directly, so no focus change is
 *  needed (verified: it lands on a backgrounded field without requestFocus and steals no foreground). */
function setTextAction(bridge: Bridge, vmID: number, context: bigint, text: string): boolean {
  const buffer = Buffer.from(`${text}\0`, 'utf16le');
  return bridge.setTextContents(vmID, context, buffer.ptr!) !== 0;
}

/** Invoke a Java control (push button / check box / menu item / …) by name, cursor-free / background, via the Access
 *  Bridge — the native equivalent of a click but with no cursor and no foreground. Returns whether it succeeded. */
export function javaInvoke(hWnd: bigint, target: JavaTarget): boolean {
  ensureStarted();
  const bridge = jab;
  if (bridge === null) return false;
  const resolved = resolveRoot(bridge, hWnd);
  if (resolved === null) return false;
  const { vmID, root } = resolved;
  let ok = false;
  try {
    findAndAct(
      bridge,
      vmID,
      root,
      target,
      (matched) => {
        ok = invokeAction(bridge, vmID, matched);
      },
      0,
    );
  } finally {
    bridge.releaseJavaObject(vmID, root);
  }
  return ok;
}

/** Set a Java text control's contents by name, cursor-free / background, via the Access Bridge. Returns success. */
export function javaSetText(hWnd: bigint, target: JavaTarget, text: string): boolean {
  ensureStarted();
  const bridge = jab;
  if (bridge === null) return false;
  const resolved = resolveRoot(bridge, hWnd);
  if (resolved === null) return false;
  const { vmID, root } = resolved;
  let ok = false;
  try {
    findAndAct(
      bridge,
      vmID,
      root,
      target,
      (matched) => {
        ok = setTextAction(bridge, vmID, matched, text);
      },
      0,
    );
  } finally {
    bridge.releaseJavaObject(vmID, root);
  }
  return ok;
}

/** Render a JavaNode tree as indented text (Spy++/msaa_tree style) for an LLM. */
export function renderJavaTree(node: JavaNode, depth = 0): string {
  const indent = '  '.repeat(depth);
  const name = node.name.length > 0 ? ` "${node.name}"` : '';
  const states = node.states.length > 0 ? ` [${node.states}]` : '';
  const description = node.description.length > 0 ? ` (${node.description})` : '';
  const bounds = node.bounds.width > 0 || node.bounds.height > 0 ? ` @${node.bounds.x},${node.bounds.y} ${node.bounds.width}x${node.bounds.height}` : '';
  let out = `${indent}- ${node.role}${name}${states}${description}${bounds}`;
  for (const child of node.children) out += `\n${renderJavaTree(child, depth + 1)}`;
  if (depth === 0 && node.truncated) out += '\n  (… tree truncated — raise maxDepth/maxNodes to read more)';
  return out;
}
