// Typed property readers built on the COM vtable invoker. Out-parameters use hoisted, reused scratch
// buffers (no per-read allocation); each value is read out immediately so the buffers never alias a
// live value, and `.ptr` is read inline at each call (small Buffers relocate — never cache it). BSTR
// names are bulk-copied in one operation BEFORE SysFreeString (never per-character, never after free).

import { FFIType, type Pointer, toArrayBuffer } from 'bun:ffi';

import Oleaut32 from '@bun-win32/oleaut32';

import { vcall } from './com';
import { S_OK, SLOT, VT_BOOL, VT_BSTR, VT_I4, VT_R8 } from './constants';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const scratch8 = Buffer.alloc(8);
const scratch4 = Buffer.alloc(4);
const scratch16 = Buffer.alloc(16);
const scratch24 = Buffer.alloc(24); // a full x64 VARIANT out-param, reused across property reads (the snapshot state-walk does ~12/ref'd node)

/** Bulk-copy a BSTR's UTF-16 region into a string in one operation, then free it. No-op on null. */
export function decodeBstr(bstr: bigint): string {
  if (bstr === 0n) return '';
  const pointer = Number(bstr) as Pointer;
  const length = Oleaut32.SysStringLen(pointer); // characters, not bytes
  const text = length === 0 ? '' : Buffer.from(toArrayBuffer(pointer, 0, length * 2)).toString('utf16le');
  Oleaut32.SysFreeString(pointer);
  return text;
}

/** Read a `[propget] BSTR*` accessor, bulk-copying the UTF-16 region before freeing the BSTR. */
export function getBstr(ptr: bigint, slot: number): string {
  if (vcall(ptr, slot, [FFIType.ptr], [scratch8.ptr!]) !== S_OK) return '';
  return decodeBstr(scratch8.readBigUInt64LE(0));
}

/** Read a `[propget] LONG*` (or BOOL*) accessor. */
export function getLong(ptr: bigint, slot: number): number {
  if (vcall(ptr, slot, [FFIType.ptr], [scratch4.ptr!]) !== S_OK) return 0;
  return scratch4.readInt32LE(0);
}

/** Read a `[propget] double*` accessor (e.g. RangeValuePattern values). */
export function getDouble(ptr: bigint, slot: number): number {
  if (vcall(ptr, slot, [FFIType.ptr], [scratch8.ptr!]) !== S_OK) return Number.NaN;
  return scratch8.readDoubleLE(0);
}

/** Read a `[propget] UIA_HWND*` / handle accessor. */
export function getHandle(ptr: bigint, slot: number): bigint {
  if (vcall(ptr, slot, [FFIType.ptr], [scratch8.ptr!]) !== S_OK) return 0n;
  return scratch8.readBigUInt64LE(0);
}

/** A decoded VARIANT scalar — the subset of property-value types worth surfacing (the rest decode to null). */
export type VariantValue = string | number | boolean | null;

/** Read a property by id via `slot` (GetCurrentPropertyValue=10 live, GetCachedPropertyValue=12 cached),
 *  decoding the 24-byte x64 VARIANT by its `vt` tag (NOT condition.ts's 16-byte input VARIANT). Always
 *  VariantClear's it — frees a returned BSTR (copied out first, never freed twice) / releases an interface. */
function readVariantProperty(ptr: bigint, slot: number, propertyId: number): VariantValue {
  scratch24.writeUInt16LE(0, 0); // clear only the vt tag — UIA writes the full value on S_OK; VariantClear keys off vt; value bytes are never read after a scalar return, so a failed call / prior VT_BSTR can't leave a stale vt for VariantClear to mis-free
  if (vcall(ptr, slot, [FFIType.i32, FFIType.ptr], [propertyId, scratch24.ptr!]) !== S_OK) return null;
  const vt = scratch24.readUInt16LE(0);
  // A scalar VARIANT (I4/R8/BOOL) owns no resource, so VariantClear is a no-op for it (MSDN) — skip the cross-DLL FFI
  // call and return directly. These are ~94% of cached state reads (toggle/selected/password bools, scroll percents),
  // so skipping VariantClear here is the snapshot hot-path win; the scalar value bytes are never read again (the next call re-clears vt and UIA rewrites the value).
  if (vt === VT_I4) return scratch24.readInt32LE(8);
  if (vt === VT_R8) return scratch24.readDoubleLE(8);
  if (vt === VT_BOOL) return scratch24.readInt16LE(8) !== 0; // VARIANT_BOOL: 0 false, -1 true
  let value: VariantValue = null;
  if (vt === VT_BSTR) {
    const bstr = scratch24.readBigUInt64LE(8);
    if (bstr === 0n) value = '';
    else {
      const pointer = Number(bstr) as Pointer;
      const length = Oleaut32.SysStringLen(pointer);
      value = length === 0 ? '' : Buffer.from(toArrayBuffer(pointer, 0, length * 2)).toString('utf16le'); // copy, don't free — VariantClear frees the BSTR (.ptr read inline below survives the copy's possible relocation)
    }
  }
  Oleaut32.VariantClear(scratch24.ptr!); // frees a returned BSTR (copied out above), releases an interface, or clears any resource-owning vt we did not decode
  return value;
}

/**
 * Read ANY property by id via GetCurrentPropertyValue (live) — one binding for HelpText, IsOffscreen,
 * HasKeyboardFocus, ItemStatus, FrameworkId, … and pattern-state-via-propertyId. Returns null for
 * empty/unsupported/non-scalar values.
 */
export function getPropertyValue(ptr: bigint, propertyId: number): VariantValue {
  return readVariantProperty(ptr, SLOT.GetCurrentPropertyValue, propertyId);
}

/** Read a property by id from the element's CACHE (GetCachedPropertyValue) — zero round-trips; the property
 *  must have been in the CacheRequest. Used to read pattern-state for a whole snapshot in one round-trip. */
export function getCachedPropertyValue(ptr: bigint, propertyId: number): VariantValue {
  return readVariantProperty(ptr, SLOT.GetCachedPropertyValue, propertyId);
}

/** Read a `[propget] RECT*` accessor (4× LONG) into an {x,y,width,height} rectangle. */
export function getRect(ptr: bigint, slot: number): Rect {
  if (vcall(ptr, slot, [FFIType.ptr], [scratch16.ptr!]) !== S_OK) return { x: 0, y: 0, width: 0, height: 0 };
  const left = scratch16.readInt32LE(0);
  const top = scratch16.readInt32LE(4);
  const right = scratch16.readInt32LE(8);
  const bottom = scratch16.readInt32LE(12);
  return { x: left, y: top, width: right - left, height: bottom - top };
}
