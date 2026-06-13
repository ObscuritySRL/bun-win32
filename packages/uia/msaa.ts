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
const VARIANT_SIZE = 16;
const CHILDID_SELF = 0;

export interface MsaaNode {
  name: string;
  role: number;
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

function accChildCount(accessible: bigint): number {
  const out = Buffer.alloc(4);
  if (vcall(accessible, IACC_GET_ACCCHILDCOUNT, [FFIType.ptr], [out.ptr!]) !== S_OK) return 0;
  return out.readInt32LE(0);
}

/** Acquire the root IAccessible for a window via MSAA (OBJID_WINDOW). Returns 0n on failure. */
export function accessibleFromWindow(hWnd: bigint): bigint {
  const out = Buffer.alloc(8);
  if (Oleacc.AccessibleObjectFromWindow(hWnd, OBJID.OBJID_WINDOW >>> 0, guid(`{${IID_IAccessible}}`).ptr!, out.ptr!) !== S_OK) return 0n;
  return out.readBigUInt64LE(0);
}

function walk(accessible: bigint, childId: number, maxDepth: number, depth: number): MsaaNode {
  const node: MsaaNode = { name: accName(accessible, childId), role: accRole(accessible, childId), children: [] };
  if (childId !== CHILDID_SELF || depth >= maxDepth) return node;
  const count = accChildCount(accessible);
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
      const queried = vcall(dispatch, IACC_QUERYINTERFACE, [FFIType.ptr, FFIType.ptr], [guid(`{${IID_IAccessible}}`).ptr!, childOut.ptr!]);
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
