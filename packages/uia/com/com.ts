// The cast-free COM vtable invoker, GUID packing, and IUnknown teardown primitive.

import { CFunction, FFIType, type Pointer, read } from 'bun:ffi';

import Combase from '@bun-win32/combase';

import { IUNKNOWN_RELEASE, S_OK, UIA_E_ELEMENTNOTAVAILABLE, UIA_E_ELEMENTNOTENABLED, UIA_E_NOCLICKABLEPOINT, UIA_E_NOTSUPPORTED, UIA_E_PROXYASSEMBLYNOTLOADED } from './constants';

// The five well-known UI Automation HRESULTs (SDK um/UIAutomationCore.h), each paired with the exact
// next step a cold LLM should take — so a COM failure names its own recovery instead of leaking raw hex.
const UIA_HRESULTS = new Map<number, string>([
  [UIA_E_ELEMENTNOTENABLED, 'UIA_E_ELEMENTNOTENABLED (the control is disabled — wait_for {state:{enabled:true}} or pick an enabled target)'],
  [UIA_E_ELEMENTNOTAVAILABLE, 'UIA_E_ELEMENTNOTAVAILABLE (the element/window no longer exists — call list_windows then attach a live window)'],
  [UIA_E_NOCLICKABLEPOINT, 'UIA_E_NOCLICKABLEPOINT (no clickable point — act by pattern via invoke/select, or click_point at its bounds)'],
  [UIA_E_PROXYASSEMBLYNOTLOADED, 'UIA_E_PROXYASSEMBLYNOTLOADED (the legacy-control proxy failed to load — inspect_element and act by a supported pattern)'],
  [UIA_E_NOTSUPPORTED, 'UIA_E_NOTSUPPORTED (this control does not support that pattern — inspect_element to see its can: list and pick a supported verb)'],
]);

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
  if (thisPtr === 0n) throw new Error(`vcall: null interface pointer (slot ${slot})`); // predicted-not-taken; catches ONLY the literal-null case (a non-null-but-unmapped thisPtr still segfaults at the deref below — see note)
  // A non-null-but-unmapped thisPtr CANNOT be guarded here: Bun has no safe-read, so this deref segfaults the host
  // uncatchably (e.g. read.ptr(0xdead, 0) panics). Callers MUST pass only refcounted COM proxies from a successful
  // (pointer === 0n ? null : …) result — never a raw/garbage address. The guards below fire only once thisPtr is mapped.
  const vtable = read.ptr(Number(thisPtr) as Pointer, 0);
  if (!vtable) throw new Error(`vcall: null vtable at interface 0x${thisPtr.toString(16)} (slot ${slot}) — use-after-free or invalid interface pointer`); // a freed/zeroed object reads vtable 0; without this the next read segfaults uncatchably
  const method = read.ptr(Number(vtable) as Pointer, slot * 8);
  if (!method) throw new Error(`vcall: null method pointer at slot ${slot} (vtable 0x${vtable.toString(16)})`); // a corrupt/short vtable yields a null method; calling it would crash
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

/** Format an HRESULT as `0xXXXXXXXX`, appending the name + recovery hint for the five well-known UIA codes. */
export function hresult(hr: number): string {
  const hex = `0x${(hr >>> 0).toString(16).padStart(8, '0')}`;
  const named = UIA_HRESULTS.get(hr | 0);
  return named === undefined ? hex : `${hex} ${named}`;
}

/** Test hook: the number of memoized per-method CFunction invokers. The perf-regression gate asserts a
 *  repeated vcall to the SAME method does not grow this (the CFunction is reused, not rebuilt per call). */
export function invokerCacheSize(): number {
  return invokers.size;
}
