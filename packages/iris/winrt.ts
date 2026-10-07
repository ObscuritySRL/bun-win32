// WinRT + COM plumbing shared by capture, OCR, text, and the indexer worker: HSTRINGs, activation factories,
// QueryInterface, IClosable, and IAsyncInfo polling. Every call is synchronous on the calling thread — WinRT async
// operations are POLLED (never a completion delegate), so no native thread ever re-enters JavaScript.

import { FFIType, toArrayBuffer } from 'bun:ffi';

import Combase from '@bun-win32/combase';
import { comRelease, guidBytes, hex, vcall } from '@bun-win32/gpu';

export { comRelease, guidBytes, hex, vcall };

export const IID_IAsyncInfo = '00000036-0000-0000-c000-000000000046';
export const IID_IClosable = '30d5a829-7fa4-4026-83bb-d75bae4ea99e';

const ASYNC_INFO_GET_STATUS = 7;
const CLOSABLE_CLOSE = 6;

/** Create an HSTRING (caller deletes it with Combase.WindowsDeleteString). */
export function createHString(text: string): bigint {
  const source = Buffer.from(`${text}\0`, 'utf16le');
  const out = Buffer.alloc(8);
  const result = Combase.WindowsCreateString(source.ptr, text.length, out.ptr);
  if (result !== 0) throw new Error(`WindowsCreateString failed: ${hex(result)}`);
  return out.readBigUInt64LE(0);
}

/** Copy an HSTRING into a JS string and delete it. */
export function consumeHString(handle: bigint): string {
  if (handle === 0n) return '';
  const lengthOut = Buffer.alloc(4);
  const characters = Combase.WindowsGetStringRawBuffer(handle, lengthOut.ptr);
  const length = lengthOut.readUInt32LE(0);
  const text = characters === null || length === 0 ? '' : Buffer.from(toArrayBuffer(characters, 0, length * 2)).toString('utf16le');
  Combase.WindowsDeleteString(handle);
  return text;
}

export function activationFactory(runtimeClass: string, iid: string): bigint {
  const out = Buffer.alloc(8);
  const handle = createHString(runtimeClass);
  const result = Combase.RoGetActivationFactory(handle, guidBytes(iid).ptr, out.ptr);
  Combase.WindowsDeleteString(handle);
  const factory = out.readBigUInt64LE(0);
  if (result !== 0 || factory === 0n) throw new Error(`RoGetActivationFactory(${runtimeClass}) failed: ${hex(result)}`);
  return factory;
}

export function queryInterface(unknown: bigint, iid: string): bigint {
  const out = Buffer.alloc(8);
  if (vcall(unknown, 0, [FFIType.ptr, FFIType.ptr], [guidBytes(iid).ptr, out.ptr]) !== 0) return 0n;
  return out.readBigUInt64LE(0);
}

/** Call a `[out] T**` method and return the interface pointer (0n on failure). */
export function getInterface(thisPointer: bigint, slot: number): bigint {
  const out = Buffer.alloc(8);
  if (vcall(thisPointer, slot, [FFIType.ptr], [out.ptr]) !== 0) return 0n;
  return out.readBigUInt64LE(0);
}

/** IClosable::Close then Release — WinRT capture objects keep running until closed, not merely released. */
export function closeAndRelease(object: bigint): void {
  if (object === 0n) return;
  const closable = queryInterface(object, IID_IClosable);
  if (closable !== 0n) {
    vcall(closable, CLOSABLE_CLOSE, [], []);
    comRelease(closable);
  }
  comRelease(object);
}

/** AsyncStatus of an IAsyncOperation: 0 started, 1 completed, 2 canceled, 3 error. */
export function asyncStatus(asyncInfo: bigint): number {
  const out = Buffer.alloc(4);
  if (vcall(asyncInfo, ASYNC_INFO_GET_STATUS, [FFIType.ptr], [out.ptr]) !== 0) return 3;
  return out.readInt32LE(0);
}
