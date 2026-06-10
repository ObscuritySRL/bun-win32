// The cast-free COM vtable invoker and IUnknown/ID3DBlob teardown primitives.

import { CFunction, FFIType, read, type Pointer } from 'bun:ffi';

import { BLOB_RELEASE, IUNKNOWN_RELEASE } from './constants';
import { untrackResource } from './memory';

// Keyed by the resolved method pointer (a plain number — user-mode addresses fit
// 2^53, and number Map keys hash ~2.4× faster than bigint in JSC) — a COM method
// has one signature, and the per-call vtable walk stays (an address can be
// reallocated to a different object; the method pointer cannot lie).
const invokers = new Map<number, ReturnType<typeof CFunction>>();

/** Release an ID3DBlob. No-op on a null handle. */
export function blobRelease(blob: bigint): void {
  if (blob === 0n) return;
  vcall(blob, BLOB_RELEASE, [], [], FFIType.u32);
}

// pipeline.ts registers a hook so releasing a handle cached by the CS bind
// elision invalidates the cache (a new object can land on the same address).
let comReleaseHook: ((handle: bigint) => void) | null = null;

/** Internal: observe every comRelease (pipeline.ts uses this for bind-cache safety). */
export function setComReleaseHook(hook: (handle: bigint) => void): void {
  comReleaseHook = hook;
}

/** Release a COM interface (IUnknown::Release). No-op on a null handle. */
export function comRelease(thisPtr: bigint): void {
  if (thisPtr === 0n) return;
  vcall(thisPtr, IUNKNOWN_RELEASE, [], [], FFIType.u32);
  untrackResource(thisPtr);
  if (comReleaseHook !== null) comReleaseHook(thisPtr);
}

/** Pack a canonical GUID string into the 16-byte little-endian layout COM expects. */
export function guidBytes(value: string): Buffer {
  const match = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i.exec(value);
  if (match === null) throw new Error(`Invalid GUID: ${value}`);
  const [, d1, d2, d3, d4High, d4Low] = match;
  const buffer = Buffer.alloc(16);
  buffer.writeUInt32LE(parseInt(d1!, 16), 0);
  buffer.writeUInt16LE(parseInt(d2!, 16), 4);
  buffer.writeUInt16LE(parseInt(d3!, 16), 6);
  const data4 = `${d4High}${d4Low}`;
  for (let i = 0; i < 8; i += 1) buffer[8 + i] = parseInt(data4.slice(i * 2, i * 2 + 2), 16);
  return buffer;
}

/** Format an HRESULT as 0xXXXXXXXX. */
export function hex(hr: number): string {
  return `0x${(hr >>> 0).toString(16).padStart(8, '0')}`;
}

/** Invoke COM method `slot` on `thisPtr`; argTypes/args exclude the implicit `this`. Caveat: with returns=FFIType.u64 the runtime value is a bigint despite the number return type — convert with BigInt()/Number() deliberately at such call sites. */
export function vcall(thisPtr: bigint, slot: number, argTypes: readonly FFIType[], args: readonly unknown[], returns: FFIType = FFIType.i32): number {
  // read.ptr returns a plain number (no heap bigint per read); thisPtr stays bigint
  // into the invoke — Bun converts bigint→u64 faster than double→u64 (measured).
  const vtable = read.ptr(Number(thisPtr) as Pointer, 0);
  const method = read.ptr(vtable as Pointer, slot * 8);
  let invoke = invokers.get(method);
  if (invoke === undefined) {
    invoke = CFunction({ ptr: method as Pointer, args: [FFIType.u64, ...argTypes], returns });
    invokers.set(method, invoke);
  }
  // Arity-specialized dispatch — spread into a native CFunction costs ~16 ns extra
  // per call (measured); 6 is the package's max vcall arity (UpdateSubresource).
  switch (args.length) {
    case 0:
      return invoke(thisPtr) as number;
    case 1:
      return invoke(thisPtr, args[0]) as number;
    case 2:
      return invoke(thisPtr, args[0], args[1]) as number;
    case 3:
      return invoke(thisPtr, args[0], args[1], args[2]) as number;
    case 4:
      return invoke(thisPtr, args[0], args[1], args[2], args[3]) as number;
    case 5:
      return invoke(thisPtr, args[0], args[1], args[2], args[3], args[4]) as number;
    case 6:
      return invoke(thisPtr, args[0], args[1], args[2], args[3], args[4], args[5]) as number;
    default:
      return invoke(thisPtr, ...args) as number;
  }
}
