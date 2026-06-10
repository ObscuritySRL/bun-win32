// The cast-free COM vtable invoker and IUnknown/ID3DBlob teardown primitives.

import { CFunction, FFIType, read, type Pointer } from 'bun:ffi';

import { BLOB_RELEASE, IUNKNOWN_RELEASE } from './constants';

const invokers = new Map<string, ReturnType<typeof CFunction>>();

/** Release an ID3DBlob. No-op on a null handle. */
export function blobRelease(blob: bigint): void {
  if (blob === 0n) return;
  const vtable = read.u64(Number(blob) as Pointer, 0);
  const fn = read.u64(Number(vtable) as Pointer, BLOB_RELEASE * 8);
  CFunction({ ptr: Number(fn) as Pointer, args: [FFIType.u64], returns: FFIType.u32 })(blob);
}

/** Release a COM interface (IUnknown::Release). No-op on a null handle. */
export function comRelease(thisPtr: bigint): void {
  if (thisPtr !== 0n) vcall(thisPtr, IUNKNOWN_RELEASE, [], [], FFIType.u32);
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

/** Invoke COM method `slot` on `thisPtr`; argTypes/args exclude the implicit `this`. */
export function vcall(thisPtr: bigint, slot: number, argTypes: readonly FFIType[], args: readonly unknown[], returns: FFIType = FFIType.i32): number {
  const vtable = read.u64(Number(thisPtr) as Pointer, 0);
  const method = read.u64(Number(vtable) as Pointer, slot * 8);
  const key = `${method}|${returns}|${argTypes.join(',')}`;
  let invoke = invokers.get(key);
  if (invoke === undefined) {
    invoke = CFunction({ ptr: Number(method) as Pointer, args: [FFIType.u64, ...argTypes], returns });
    invokers.set(key, invoke);
  }
  return invoke(thisPtr, ...args) as number;
}
