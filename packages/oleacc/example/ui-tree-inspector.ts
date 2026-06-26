/**
 * UI Accessibility Tree Inspector
 *
 * A thorough Microsoft Active Accessibility (MSAA) diagnostic. It resolves the
 * foreground window to its root `IAccessible` via the single flat
 * `AccessibleObjectFromWindow` export, then recursively walks the entire
 * accessibility tree the way a screen reader does — enumerating children with
 * the flat `AccessibleChildren` export and reading every node's name, role,
 * state, and screen rectangle over the `IAccessible`/`IDispatch` COM vtable
 * (`get_accName` / `get_accRole` / `get_accState` / `accLocation`,
 * `QueryInterface` to promote `IDispatch` children to `IAccessible`). Roles and
 * state bit-flags are decoded into human-readable text with the flat
 * `GetRoleTextW` / `GetStateTextW` exports. The output is an aligned, colored
 * tree plus a summary: node count, depth reached, a role histogram, and the
 * most common state flags.
 *
 * APIs demonstrated:
 *   - Oleacc.AccessibleObjectFromWindow   (HWND → root IAccessible)
 *   - Oleacc.AccessibleChildren           (enumerate a container's children)
 *   - Oleacc.GetRoleTextW                 (decode a ROLE_SYSTEM_* value)
 *   - Oleacc.GetStateTextW                (decode a single STATE_SYSTEM_* bit)
 *   - IAccessible::get_accName/Role/State (per-node properties, COM vtable)
 *   - IAccessible::accLocation            (per-node screen rectangle, COM vtable)
 *   - IDispatch::QueryInterface / IUnknown::Release (COM vtable lifetime)
 *
 * APIs demonstrated (ole32, cross-package):
 *   - CoInitialize                        (enter an STA before COM marshaling)
 *
 * APIs demonstrated (user32, cross-package):
 *   - GetForegroundWindow / GetDesktopWindow (pick a target window)
 *   - GetWindowTextW / GetClassNameW      (label the target in the header)
 *
 * APIs demonstrated (kernel32, cross-package):
 *   - GetCurrentProcess / ReadProcessMemory (walk native vtables / VARIANTs)
 *
 * Run: bun run example:ui-tree-inspector
 */

import { FFIType, linkSymbols } from 'bun:ffi';

import Oleacc, { CHILDID_SELF, IID_IAccessible, OBJID, ROLE_SYSTEM } from '../index';
import Kernel32 from '@bun-win32/kernel32';
import Ole32 from '@bun-win32/ole32';
import User32 from '@bun-win32/user32';

const ANSI = {
  bold: '\x1b[1m',
  cyan: '\x1b[96m',
  dim: '\x1b[2m',
  green: '\x1b[92m',
  magenta: '\x1b[95m',
  red: '\x1b[91m',
  reset: '\x1b[0m',
  white: '\x1b[97m',
  yellow: '\x1b[93m',
} as const;

const MAX_DEPTH = 5;
const MAX_CHILDREN_PER_NODE = 48;
const MAX_TOTAL_NODES = 500;
const VARIANT_SIZE = 24;
const POINTER_SIZE = 8;

// IAccessible vtable slot offsets (8 bytes per slot on x64).
// IUnknown 0-2, IDispatch 3-6, IAccessible 7+.
const V_QUERYINTERFACE = 0x00n;
const V_RELEASE = 0x10n;
const V_GET_ACCCHILDCOUNT = 0x40n;
const V_GET_ACCNAME = 0x50n;
const V_GET_ACCROLE = 0x68n;
const V_GET_ACCSTATE = 0x70n;
const V_ACCLOCATION = 0xb0n;

const VT_I4 = 3;
const VT_BSTR = 8;
const VT_DISPATCH = 9;

Oleacc.Preload(['AccessibleObjectFromWindow', 'AccessibleChildren', 'GetRoleTextW', 'GetStateTextW']);

const process_ = Kernel32.GetCurrentProcess();

function readBytes(address: bigint, size: number): Buffer {
  const buffer = Buffer.alloc(size);
  Kernel32.ReadProcessMemory(process_, address, buffer.ptr!, BigInt(size), null);
  return buffer;
}

function readPointer(address: bigint): bigint {
  return readBytes(address, POINTER_SIZE).readBigUInt64LE(0);
}

function guidBytes(value: string): Buffer {
  const match = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i.exec(value)!;
  const [, d1, d2, d3, d4High, d4Low] = match;
  const buffer = Buffer.alloc(16);
  buffer.writeUInt32LE(parseInt(d1, 16), 0);
  buffer.writeUInt16LE(parseInt(d2, 16), 4);
  buffer.writeUInt16LE(parseInt(d3, 16), 6);
  const data4 = `${d4High}${d4Low}`;
  for (let index = 0; index < 8; index += 1) buffer[8 + index] = parseInt(data4.slice(index * 2, index * 2 + 2), 16);
  return buffer;
}

function readBStr(bstrAddress: bigint): string {
  if (bstrAddress === 0n) return '';
  // A BSTR is preceded by a 4-byte little-endian byte-count prefix.
  const byteLength = readBytes(bstrAddress - 4n, 4).readUInt32LE(0);
  if (byteLength === 0 || byteLength > 0x10000) return '';
  return readBytes(bstrAddress, byteLength).toString('utf16le').replace(/\0+$/, '');
}

function makeChildVariant(childId: number): Buffer {
  const variant = Buffer.alloc(VARIANT_SIZE);
  variant.writeUInt16LE(VT_I4, 0); // vt = VT_I4
  variant.writeInt32LE(childId, 8); // lVal
  return variant;
}

const accessibleIid = guidBytes(IID_IAccessible);

interface AccVtable {
  symbols: {
    QueryInterface: (this_: bigint, riid: number, ppv: number) => number;
    Release: (this_: bigint) => number;
    get_accChildCount: (this_: bigint, pcount: number) => number;
    get_accName: (this_: bigint, varChild: number, pszName: number) => number;
    get_accRole: (this_: bigint, varChild: number, pvarRole: number) => number;
    get_accState: (this_: bigint, varChild: number, pvarState: number) => number;
    accLocation: (this_: bigint, pxLeft: number, pyTop: number, pcxWidth: number, pcyHeight: number, varChild: number) => number;
  };
  close: () => void;
}

function bindAccessible(accAddress: bigint): AccVtable {
  const vtable = readPointer(accAddress);
  return linkSymbols({
    QueryInterface: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], ptr: readPointer(vtable + V_QUERYINTERFACE), returns: FFIType.i32 },
    Release: { args: [FFIType.u64], ptr: readPointer(vtable + V_RELEASE), returns: FFIType.u32 },
    get_accChildCount: { args: [FFIType.u64, FFIType.ptr], ptr: readPointer(vtable + V_GET_ACCCHILDCOUNT), returns: FFIType.i32 },
    get_accName: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], ptr: readPointer(vtable + V_GET_ACCNAME), returns: FFIType.i32 },
    get_accRole: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], ptr: readPointer(vtable + V_GET_ACCROLE), returns: FFIType.i32 },
    get_accState: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], ptr: readPointer(vtable + V_GET_ACCSTATE), returns: FFIType.i32 },
    accLocation: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], ptr: readPointer(vtable + V_ACCLOCATION), returns: FFIType.i32 },
  });
}

const roleTextCache = new Map<number, string>();
function roleText(role: number): string {
  const cached = roleTextCache.get(role);
  if (cached !== undefined) return cached;
  const buffer = Buffer.alloc(128);
  const length = Oleacc.GetRoleTextW(role, buffer.ptr!, 64);
  const text = length > 0 ? buffer.toString('utf16le', 0, length * 2) : ROLE_SYSTEM[role] || `role 0x${role.toString(16)}`;
  roleTextCache.set(role, text);
  return text;
}

function stateText(state: number): string {
  const parts: string[] = [];
  for (let bit = 0; bit < 31 && parts.length < 4; bit += 1) {
    const mask = 1 << bit;
    if ((state & mask) === 0) continue;
    const buffer = Buffer.alloc(128);
    const length = Oleacc.GetStateTextW(mask >>> 0, buffer.ptr!, 64);
    if (length > 0) parts.push(buffer.toString('utf16le', 0, length * 2));
  }
  return parts.join(', ');
}

interface NodeInfo {
  name: string;
  role: number;
  state: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

function readNodeInfo(acc: AccVtable, accAddress: bigint, childId: number): NodeInfo {
  const varChild = makeChildVariant(childId);

  const nameOut = Buffer.alloc(POINTER_SIZE);
  acc.symbols.get_accName(accAddress, varChild.ptr!, nameOut.ptr!);
  const name = readBStr(nameOut.readBigUInt64LE(0));

  const roleVariant = Buffer.alloc(VARIANT_SIZE);
  let role = -1;
  if (acc.symbols.get_accRole(accAddress, varChild.ptr!, roleVariant.ptr!) === 0) {
    role = roleVariant.readUInt16LE(0) === VT_I4 ? roleVariant.readInt32LE(8) : -1;
  }

  const stateVariant = Buffer.alloc(VARIANT_SIZE);
  let state = 0;
  if (acc.symbols.get_accState(accAddress, varChild.ptr!, stateVariant.ptr!) === 0) {
    state = stateVariant.readUInt16LE(0) === VT_I4 ? stateVariant.readInt32LE(8) >>> 0 : 0;
  }

  const left = Buffer.alloc(4);
  const top = Buffer.alloc(4);
  const width = Buffer.alloc(4);
  const height = Buffer.alloc(4);
  acc.symbols.accLocation(accAddress, left.ptr!, top.ptr!, width.ptr!, height.ptr!, varChild.ptr!);

  return {
    name,
    role,
    state,
    left: left.readInt32LE(0),
    top: top.readInt32LE(0),
    width: width.readInt32LE(0),
    height: height.readInt32LE(0),
  };
}

const roleHistogram = new Map<number, number>();
const stateHistogram = new Map<number, number>();
let totalNodes = 0;
let deepestLevel = 0;

function recordHistograms(info: NodeInfo): void {
  if (info.role >= 0) roleHistogram.set(info.role, (roleHistogram.get(info.role) ?? 0) + 1);
  for (let bit = 0; bit < 31; bit += 1) {
    const mask = 1 << bit;
    if ((info.state & mask) !== 0) stateHistogram.set(mask, (stateHistogram.get(mask) ?? 0) + 1);
  }
}

function roleColor(role: number): string {
  if (role === ROLE_SYSTEM.ROLE_SYSTEM_WINDOW || role === ROLE_SYSTEM.ROLE_SYSTEM_CLIENT) return ANSI.cyan;
  if (role === ROLE_SYSTEM.ROLE_SYSTEM_PUSHBUTTON || role === ROLE_SYSTEM.ROLE_SYSTEM_MENUITEM) return ANSI.green;
  if (role === ROLE_SYSTEM.ROLE_SYSTEM_TEXT || role === ROLE_SYSTEM.ROLE_SYSTEM_STATICTEXT) return ANSI.yellow;
  return ANSI.white;
}

function printNode(info: NodeInfo, depth: number): void {
  const indent = depth === 0 ? '' : `${ANSI.dim}${'│  '.repeat(depth - 1)}├─ ${ANSI.reset}`;
  const label = info.name ? `${ANSI.bold}${info.name.slice(0, 56)}${ANSI.reset}` : `${ANSI.dim}(no name)${ANSI.reset}`;
  const role = `${roleColor(info.role)}${roleText(info.role)}${ANSI.reset}`;
  const rect = info.width > 0 || info.height > 0 ? `${ANSI.dim}[${info.left},${info.top} ${info.width}×${info.height}]${ANSI.reset}` : '';
  const states = info.state ? `${ANSI.magenta}${stateText(info.state)}${ANSI.reset}` : '';
  console.log(`${indent}${label} ${ANSI.dim}·${ANSI.reset} ${role} ${rect} ${states}`.trimEnd());
}

function walk(acc: AccVtable, accAddress: bigint, childId: number, depth: number): void {
  if (totalNodes >= MAX_TOTAL_NODES) return;
  totalNodes += 1;
  deepestLevel = Math.max(deepestLevel, depth);

  const info = readNodeInfo(acc, accAddress, childId);
  recordHistograms(info);
  printNode(info, depth);

  // Only full objects (CHILDID_SELF) own an enumerable child collection.
  if (childId !== CHILDID_SELF || depth >= MAX_DEPTH) return;

  const countOut = Buffer.alloc(4);
  if (acc.symbols.get_accChildCount(accAddress, countOut.ptr!) !== 0) return;
  const childCount = Math.min(countOut.readInt32LE(0), MAX_CHILDREN_PER_NODE);
  if (childCount <= 0) return;

  const children = Buffer.alloc(VARIANT_SIZE * childCount);
  const obtained = Buffer.alloc(4);
  if (Oleacc.AccessibleChildren(accAddress, 0, childCount, children.ptr!, obtained.ptr!) !== 0) return;

  for (let index = 0; index < obtained.readInt32LE(0) && totalNodes < MAX_TOTAL_NODES; index += 1) {
    const base = index * VARIANT_SIZE;
    const variantType = children.readUInt16LE(base);

    if (variantType === VT_DISPATCH) {
      const dispatchAddress = children.readBigUInt64LE(base + 8);
      if (dispatchAddress === 0n) continue;

      const dispatch = bindAccessible(dispatchAddress);
      const childAccOut = Buffer.alloc(POINTER_SIZE);
      const queried = dispatch.symbols.QueryInterface(dispatchAddress, accessibleIid.ptr!, childAccOut.ptr!);
      const childAccAddress = childAccOut.readBigUInt64LE(0);

      if (queried === 0 && childAccAddress !== 0n) {
        const childAcc = bindAccessible(childAccAddress);
        walk(childAcc, childAccAddress, CHILDID_SELF, depth + 1);
        childAcc.symbols.Release(childAccAddress);
        childAcc.close();
      }
      dispatch.symbols.Release(dispatchAddress);
      dispatch.close();
    } else if (variantType === VT_I4) {
      // Simple element: a child ID owned by this same IAccessible (a leaf).
      walk(acc, accAddress, children.readInt32LE(base + 8), depth + 1);
    }
  }
}

// ── Resolve a target window ────────────────────────────────────────────────

Ole32.CoInitialize(null);

let targetWindow = User32.GetForegroundWindow();
if (targetWindow === 0n) targetWindow = User32.GetDesktopWindow();

const titleBuffer = Buffer.alloc(512);
const titleLength = User32.GetWindowTextW(targetWindow, titleBuffer.ptr!, 256);
const windowTitle = titleLength > 0 ? titleBuffer.toString('utf16le', 0, titleLength * 2) : '(untitled)';

const classBuffer = Buffer.alloc(512);
const classLength = User32.GetClassNameW(targetWindow, classBuffer.ptr!, 256);
const windowClass = classLength > 0 ? classBuffer.toString('utf16le', 0, classLength * 2) : '(unknown)';

const rootOut = Buffer.alloc(POINTER_SIZE);
const rootHr = Oleacc.AccessibleObjectFromWindow(targetWindow, OBJID.OBJID_WINDOW >>> 0, accessibleIid.ptr!, rootOut.ptr!);
const rootAddress = rootOut.readBigUInt64LE(0);

console.log();
console.log(`${ANSI.bold}${ANSI.magenta}◼ UI Accessibility Tree Inspector${ANSI.reset}  ${ANSI.dim}— MSAA over pure FFI${ANSI.reset}`);
console.log(`${ANSI.dim}  window${ANSI.reset} ${ANSI.white}${windowTitle.slice(0, 60)}${ANSI.reset}  ${ANSI.dim}class${ANSI.reset} ${windowClass}  ${ANSI.dim}hwnd${ANSI.reset} 0x${targetWindow.toString(16)}`);
console.log(`${ANSI.dim}  AccessibleObjectFromWindow → hr 0x${(rootHr >>> 0).toString(16).padStart(8, '0')}  IAccessible 0x${rootAddress.toString(16)}${ANSI.reset}`);
console.log();

if (rootHr !== 0 || rootAddress === 0n) {
  console.log(`${ANSI.red}  Could not resolve an IAccessible for this window.${ANSI.reset}`);
  process.exit(1);
}

const root = bindAccessible(rootAddress);
walk(root, rootAddress, CHILDID_SELF, 0);
root.symbols.Release(rootAddress);
root.close();

// ── Summary ────────────────────────────────────────────────────────────────

const topRoles = [...roleHistogram.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
const topStates = [...stateHistogram.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
const maxRoleCount = topRoles.length > 0 ? topRoles[0][1] : 1;

console.log();
console.log(`${ANSI.dim}  ─ summary ─${ANSI.reset}`);
console.log(
  `  ${ANSI.dim}nodes${ANSI.reset} ${ANSI.yellow}${totalNodes}${ANSI.reset}${totalNodes >= MAX_TOTAL_NODES ? `${ANSI.dim}+ (capped)${ANSI.reset}` : ''}   ${ANSI.dim}max depth${ANSI.reset} ${ANSI.yellow}${deepestLevel}${ANSI.reset}   ${ANSI.dim}distinct roles${ANSI.reset} ${ANSI.yellow}${roleHistogram.size}${ANSI.reset}`,
);
console.log();
console.log(`  ${ANSI.bold}Role histogram${ANSI.reset}`);
for (const [role, count] of topRoles) {
  const bar = '█'.repeat(Math.max(1, Math.round((count / maxRoleCount) * 28)));
  console.log(`    ${roleColor(role)}${roleText(role).padEnd(18)}${ANSI.reset} ${ANSI.dim}${String(count).padStart(4)}${ANSI.reset} ${ANSI.cyan}${bar}${ANSI.reset}`);
}
console.log();
console.log(`  ${ANSI.bold}Most common states${ANSI.reset}`);
for (const [mask, count] of topStates) {
  console.log(`    ${ANSI.magenta}${stateText(mask).padEnd(18)}${ANSI.reset} ${ANSI.dim}${String(count).padStart(4)} nodes${ANSI.reset}`);
}
console.log();

process.exit(0);
