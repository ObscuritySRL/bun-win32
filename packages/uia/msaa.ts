// MSAA (oleacc IAccessible) fallback for legacy / owner-draw windows that expose no useful UIA tree.
// IAccessible is IDispatch-derived (IUnknown 0-2, IDispatch 3-6, then its members): get_accChildCount
// 8, get_accName 10, get_accRole 13. The VARIANT child-id is passed by pointer (the 16-byte aggregate
// goes by hidden reference). AccessibleChildren returns VARIANTs: VT_DISPATCH → QI to IAccessible;
// VT_I4 → a simple child-id leaf of the same parent (never a pointer).

import { FFIType } from 'bun:ffi';

import Oleacc, { IID_IAccessible, OBJID } from '@bun-win32/oleacc';

import { comRelease, guid, vcall } from './com';
import { S_OK, VT_DISPATCH, VT_I4 } from './constants';
import { decodeBstr } from './reads';

const IACC_QUERYINTERFACE = 0;
const IACC_GET_ACCCHILDCOUNT = 8;
const IACC_GET_ACCNAME = 10;
const IACC_GET_ACCROLE = 13;
const IACC_ACCLOCATION = 22; // IAccessible::accLocation (after IDispatch 3-6: parent7 childCount8 child9 name10 value11 desc12 role13 state14 help15 helpTopic16 kbd17 focus18 sel19 defAction20 select21 LOCATION22) — verified vs oleacc V_ACCLOCATION=0xb0
const VARIANT_SIZE = 16;
const CHILDID_SELF = 0;
const MAX_ACC_CHILDREN = 0x0001_0000; // 65536 — generous for any real container; bounds a hostile/buggy provider's child count

// The IAccessible IID is a compile-time constant — parse it once, not per node (the walk recurses).
const IID_IACCESSIBLE_GUID = guid(`{${IID_IAccessible}}`);

export interface MsaaNode {
  name: string;
  role: number;
  /** Screen rect from IAccessible::accLocation — present when the element exposes a usable location. Lets an agent
   *  act on MSAA-only (owner-draw/legacy) content via the cursor-free click_point, which UIA/native trees can't reach. */
  bounds?: { x: number; y: number; width: number; height: number };
  children: MsaaNode[];
}

function childVariant(childId: number): Buffer {
  const variant = Buffer.alloc(VARIANT_SIZE);
  variant.writeUInt16LE(VT_I4, 0);
  variant.writeInt32LE(childId, 8);
  return variant;
}

function accName(accessible: bigint, childId: number): string {
  const out = Buffer.alloc(8);
  if (vcall(accessible, IACC_GET_ACCNAME, [FFIType.ptr, FFIType.ptr], [childVariant(childId).ptr!, out.ptr!]) !== S_OK) return '';
  return decodeBstr(out.readBigUInt64LE(0));
}

function accRole(accessible: bigint, childId: number): number {
  const roleVariant = Buffer.alloc(VARIANT_SIZE);
  if (vcall(accessible, IACC_GET_ACCROLE, [FFIType.ptr, FFIType.ptr], [childVariant(childId).ptr!, roleVariant.ptr!]) !== S_OK) return -1;
  return roleVariant.readUInt16LE(0) === VT_I4 ? roleVariant.readInt32LE(8) : -1;
}

function accLocation(accessible: bigint, childId: number): { x: number; y: number; width: number; height: number } | undefined {
  // Allocate ALL out-buffers + the child VARIANT BEFORE the call, then read .ptr inline in the args array with no
  // intervening allocation — a later Buffer.alloc can relocate an earlier small buffer's storage (the .ptr hazard).
  const cv = childVariant(childId);
  const left = Buffer.alloc(4);
  const top = Buffer.alloc(4);
  const width = Buffer.alloc(4);
  const height = Buffer.alloc(4);
  if (vcall(accessible, IACC_ACCLOCATION, [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], [left.ptr!, top.ptr!, width.ptr!, height.ptr!, cv.ptr!]) !== S_OK) return undefined;
  const w = width.readInt32LE(0);
  const h = height.readInt32LE(0);
  if (w <= 0 || h <= 0) return undefined; // no usable on-screen rect (0×0 / off-screen / unsupported)
  return { x: left.readInt32LE(0), y: top.readInt32LE(0), width: w, height: h };
}

function accChildCount(accessible: bigint): number {
  const out = Buffer.alloc(4);
  if (vcall(accessible, IACC_GET_ACCCHILDCOUNT, [FFIType.ptr], [out.ptr!]) !== S_OK) return 0;
  return out.readInt32LE(0);
}

/** Acquire the root IAccessible for a window via MSAA (OBJID_WINDOW). Returns 0n on failure. */
export function accessibleFromWindow(hWnd: bigint): bigint {
  const out = Buffer.alloc(8);
  if (Oleacc.AccessibleObjectFromWindow(hWnd, OBJID.OBJID_WINDOW >>> 0, IID_IACCESSIBLE_GUID.ptr!, out.ptr!) !== S_OK) return 0n;
  return out.readBigUInt64LE(0);
}

function walk(accessible: bigint, childId: number, maxDepth: number, depth: number): MsaaNode {
  const node: MsaaNode = { name: accName(accessible, childId), role: accRole(accessible, childId), children: [] };
  const bounds = accLocation(accessible, childId);
  if (bounds !== undefined) node.bounds = bounds;
  if (childId !== CHILDID_SELF || depth >= maxDepth) return node;
  const count = Math.min(accChildCount(accessible), MAX_ACC_CHILDREN);
  if (count <= 0) return node;
  const children = Buffer.alloc(VARIANT_SIZE * count);
  const obtained = Buffer.alloc(4);
  if (Oleacc.AccessibleChildren(accessible, 0, count, children.ptr!, obtained.ptr!) !== S_OK) return node;
  const got = obtained.readInt32LE(0);
  for (let index = 0; index < got; index += 1) {
    const base = index * VARIANT_SIZE;
    const variantType = children.readUInt16LE(base);
    if (variantType === VT_DISPATCH) {
      const dispatch = children.readBigUInt64LE(base + 8);
      if (dispatch === 0n) continue;
      const childOut = Buffer.alloc(8);
      const queried = vcall(dispatch, IACC_QUERYINTERFACE, [FFIType.ptr, FFIType.ptr], [IID_IACCESSIBLE_GUID.ptr!, childOut.ptr!]);
      const childAccessible = childOut.readBigUInt64LE(0);
      if (queried === S_OK && childAccessible !== 0n) {
        node.children.push(walk(childAccessible, CHILDID_SELF, maxDepth, depth + 1));
        comRelease(childAccessible);
      }
      comRelease(dispatch);
    } else if (variantType === VT_I4) {
      node.children.push(walk(accessible, children.readInt32LE(base + 8), maxDepth, depth + 1));
    }
  }
  return node;
}

/** Walk a window's MSAA (IAccessible) tree — the legacy/owner-draw fallback. Null when MSAA is absent. */
export function msaaTree(hWnd: bigint, maxDepth = 8): MsaaNode | null {
  const root = accessibleFromWindow(hWnd);
  if (root === 0n) return null;
  try {
    return walk(root, CHILDID_SELF, maxDepth, 0);
  } finally {
    comRelease(root);
  }
}
