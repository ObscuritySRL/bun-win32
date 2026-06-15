// The cast-free COM vtable invoker, GUID packing, and IUnknown teardown primitive.

import { CFunction, FFIType, type Pointer, read } from 'bun:ffi';

import Combase from '@bun-win32/combase';

import { IUNKNOWN_RELEASE, S_OK } from './constants';

// Keyed by the resolved method pointer (a plain number — user-mode addresses fit 2^53 and number
// Map keys hash faster than bigint in JSC). A COM method has exactly one signature, so the method
// pointer uniquely identifies it; the per-call vtable walk stays (an address can be reallocated to
// a different object — the method pointer cannot lie). Every UIA method returns HRESULT, so i32-only.
const invokers = new Map<number, ReturnType<typeof CFunction>>();

/**
 * Invoke the COM method at vtable `slot` on interface pointer `thisPtr`, returning its HRESULT.
 * `argTypes`/`args` EXCLUDE the implicit `this` — the invoker prepends `FFIType.u64` (a spurious
 * leading u64 segfaults multi-pointer calls). `argTypes` must match the method's real signature.
 */
export function vcall(thisPtr: bigint, slot: number, argTypes: readonly FFIType[], args: readonly unknown[]): number {
  if (thisPtr === 0n) throw new Error(`vcall: null interface pointer (slot ${slot})`); // predicted-not-taken; turns a segfault into a catchable error
  const vtable = read.ptr(Number(thisPtr) as Pointer, 0);
  const method = read.ptr(Number(vtable) as Pointer, slot * 8);
  let invoke = invokers.get(method);
  if (invoke === undefined) {
    invoke = CFunction({ ptr: Number(method) as Pointer, args: [FFIType.u64, ...argTypes], returns: FFIType.i32 });
    invokers.set(method, invoke);
  }
  // Arity-specialized dispatch — spreading into a native CFunction costs ~16 ns/call (measured).
  switch (args.length) {
    case 0:
      return Number(invoke(thisPtr));
    case 1:
      return Number(invoke(thisPtr, args[0]));
    case 2:
      return Number(invoke(thisPtr, args[0], args[1]));
    case 3:
      return Number(invoke(thisPtr, args[0], args[1], args[2]));
    case 4:
      return Number(invoke(thisPtr, args[0], args[1], args[2], args[3]));
    default:
      return Number(invoke(thisPtr, ...args));
  }
}

/** Release a COM interface (IUnknown::Release, slot 2). No-op on a null handle. */
export function comRelease(thisPtr: bigint): void {
  if (thisPtr !== 0n) vcall(thisPtr, IUNKNOWN_RELEASE, [], []);
}

/** Parse a `{...}` GUID string into a 16-byte little-endian CLSID/IID buffer via CLSIDFromString. */
export function guid(text: string): Buffer {
  const wide = Buffer.from(`${text}\0`, 'utf16le');
  const out = Buffer.alloc(16);
  const hr = Combase.CLSIDFromString(wide.ptr!, out.ptr!);
  if (hr !== S_OK) throw new Error(`CLSIDFromString(${text}) failed: ${hresult(hr)}`);
  return out;
}

/** Format an HRESULT as `0xXXXXXXXX`. */
export function hresult(hr: number): string {
  return `0x${(hr >>> 0).toString(16).padStart(8, '0')}`;
}
