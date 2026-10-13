// The three COM idioms Afterimage repeats everywhere: QueryInterface, "call a method whose last
// parameter is an out-pointer", and HRESULT checking. Built on @bun-win32/gpu's vcall.

import { FFIType, ptr } from 'bun:ffi';

import { guidBytes, hex, vcall } from '@bun-win32/gpu';

const guids = new Map<string, Buffer>();
const outSlot = new BigUint64Array(new ArrayBuffer(8));

export class ComError extends Error {
  readonly result: number;

  constructor(operation: string, result: number) {
    super(`${operation} failed with ${hex(result)}`);
    this.result = result >>> 0;
  }
}

/** Invoke a method whose final parameter is `void**`; returns what it wrote. Throws on a failed HRESULT. */
export function callOut(object: bigint, slot: number, argTypes: readonly FFIType[], args: readonly unknown[], operation: string): bigint {
  outSlot[0] = 0n;
  const result = vcall(object, slot, [...argTypes, FFIType.ptr], [...args, ptr(outSlot)]);
  if (result < 0) throw new ComError(operation, result);
  return outSlot[0]!;
}

export function check(result: number, operation: string): number {
  if (result < 0) throw new ComError(operation, result);
  return result;
}

/** The 16-byte GUID for `iid`, cached. Pass it as `ptr(guid(...))` at the call site — never cache the pointer. */
export function guid(iid: string): Buffer {
  let bytes = guids.get(iid);
  if (bytes === undefined) {
    bytes = guidBytes(iid);
    guids.set(iid, bytes);
  }
  return bytes;
}

export function queryInterface(object: bigint, iid: string): bigint {
  return callOut(object, 0x00, [FFIType.ptr], [ptr(guid(iid))], `QueryInterface(${iid})`);
}
