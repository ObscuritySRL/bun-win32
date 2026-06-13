import Iphlpapi from '@bun-win32/iphlpapi';
import { read, toArrayBuffer, type Pointer } from 'bun:ffi';

export { default as Dnsapi } from '@bun-win32/dnsapi';
export { default as Kernel32 } from '@bun-win32/kernel32';
export { default as Wlanapi } from '@bun-win32/wlanapi';
export { default as Ws2_32 } from '@bun-win32/ws2_32';
export { Iphlpapi };

const ERROR_SUCCESS = 0x0000_0000;
const ERROR_BUFFER_OVERFLOW = 0x0000_006f; // 111 — Table sizing return
const ERROR_INSUFFICIENT_BUFFER = 0x0000_007a; // 122 — GetExtended*Table sizing return

const WIN32_ERROR_MESSAGES: ReadonlyMap<number, string> = new Map([
  [5, 'access denied — this operation requires Administrator'],
  [50, 'the request is not supported on this system'],
  [87, 'invalid parameter — likely a malformed request struct or address family'],
  [232, 'no data is available'],
  [1168, 'element not found'],
  [1314, 'a required privilege is not held by the client — this operation requires Administrator'],
  [1722, 'the RPC server is unavailable'],
]);

export function win32ErrorMessage(code: number): string {
  return WIN32_ERROR_MESSAGES.get(code) ?? `Win32 error ${code}`;
}

export class Win32Error extends Error {
  readonly code: number;
  constructor(code: number) {
    super(`${win32ErrorMessage(code)} (code ${code})`);
    this.code = code;
    this.name = 'Win32Error';
  }
}

/**
 * The Win32 sizing-call idiom, encapsulated. Nearly every IP Helper table API is
 * called twice: once to learn the byte count, once to fill a buffer. This holds
 * one growable data buffer + one persistent DataView + a stable 4-byte size
 * buffer, reused across polls — never allocate per sample.
 *
 * The data buffer is always > 4096 bytes ⇒ an own (off-heap) ArrayBuffer with a
 * stable address: pooled small buffers relocate under GC and dangle their `.ptr`
 * (and the kernel writes absolute in-buffer pointers that a relocation would
 * invalidate). `.ptr` is read INLINE at each call.
 */
export class SizedBufferState {
  #buffer: Buffer;
  #view: DataView;
  readonly #sizeBuffer: Buffer;

  constructor(initialBytes = 0x0000_4000) {
    this.#buffer = Buffer.allocUnsafe(initialBytes);
    this.#view = new DataView(this.#buffer.buffer, this.#buffer.byteOffset, this.#buffer.byteLength);
    this.#sizeBuffer = Buffer.allocUnsafeSlow(4);
  }

  get buffer(): Buffer {
    return this.#buffer;
  }

  get view(): DataView {
    return this.#view;
  }

  /**
   * Invoke with the current buffer; on ERROR_INSUFFICIENT_BUFFER/ERROR_BUFFER_OVERFLOW
   * grow geometrically-by-need and retry once. `invoke(dataPointer, sizePointer)`
   * returns a Win32 error code. Returns the (possibly regrown) DataView.
   */
  fill(invoke: (dataPointer: Pointer, sizePointer: Pointer) => number): DataView {
    this.#sizeBuffer.writeUInt32LE(this.#buffer.byteLength, 0);
    let error = invoke(this.#buffer.ptr, this.#sizeBuffer.ptr);
    if (error === ERROR_INSUFFICIENT_BUFFER || error === ERROR_BUFFER_OVERFLOW) {
      const required = this.#sizeBuffer.readUInt32LE(0);
      if (required > this.#buffer.byteLength) {
        this.#buffer = Buffer.allocUnsafe(required);
        this.#view = new DataView(this.#buffer.buffer, this.#buffer.byteOffset, this.#buffer.byteLength);
      }
      this.#sizeBuffer.writeUInt32LE(this.#buffer.byteLength, 0);
      error = invoke(this.#buffer.ptr, this.#sizeBuffer.ptr); // re-read .ptr: the buffer may have moved
    }
    if (error !== ERROR_SUCCESS) throw new Win32Error(error);
    return this.#view;
  }
}

/**
 * Walk an in-buffer singly-linked list (the GetAdaptersAddresses shape): every
 * node lives inside one stable buffer, chained by an absolute `Next` pointer at
 * `nextOffset`. Yields each node's byte offset within `base`. `headPointer` is
 * the absolute address of the first node (0 ⇒ empty list); for a top-level list
 * whose first node sits at the buffer start pass `Number(base.ptr)`.
 */
export function* walkList(base: Buffer, headPointer: number, nextOffset: number): Generator<number> {
  const baseAddress = Number(base.ptr);
  let pointer = headPointer;
  while (pointer !== 0) {
    const offset = pointer - baseAddress;
    yield offset;
    pointer = Number(base.readBigUInt64LE(offset + nextOffset));
  }
}

/** ASCII string from `offset` up to NUL (or buffer end). Negative offset ⇒ ''. */
export function readAnsiAt(base: Buffer, offset: number): string {
  if (offset < 0) return '';
  const end = base.indexOf(0, offset);
  return base.toString('ascii', offset, end < 0 ? base.byteLength : end);
}

/** UTF-16LE string from `offset` up to the NUL terminator. Negative offset ⇒ '' (repo memory: Bun's TextDecoder rejects 'utf-16le'; use Buffer). */
export function readWideAt(base: Buffer, offset: number): string {
  if (offset < 0) return '';
  let end = offset;
  while (end + 1 < base.byteLength && base.readUInt16LE(end) !== 0) end += 2;
  return base.toString('utf16le', offset, end);
}

const mibTableOut = Buffer.allocUnsafeSlow(8);

/**
 * Decode a self-allocating Table2 API (GetIpForwardTable2 / GetIpNetTable2): the
 * API allocates the table and writes its pointer into the out buffer; we read
 * NumEntries, wrap the row region in ONE Buffer over native memory, decode each
 * row, and ALWAYS FreeMibTable in `finally` (or leak native memory every poll).
 * `invoke(tablePointer)` receives the reused 8-byte out buffer pointer and
 * returns a Win32 error code.
 */
export function mibTable<T>(invoke: (tablePointer: Pointer) => number, firstRowOffset: number, rowSize: number, decodeRow: (table: Buffer, rowOffset: number) => T): T[] {
  const error = invoke(mibTableOut.ptr);
  if (error !== ERROR_SUCCESS) throw new Win32Error(error);
  const tablePointer = Number(mibTableOut.readBigUInt64LE(0)) as Pointer;
  try {
    const numEntries = read.u32(tablePointer, 0);
    const table = Buffer.from(toArrayBuffer(tablePointer, 0, firstRowOffset + numEntries * rowSize));
    const rows: T[] = new Array(numEntries);
    for (let index = 0; index < numEntries; index++) rows[index] = decodeRow(table, firstRowOffset + index * rowSize);
    return rows;
  } finally {
    Iphlpapi.FreeMibTable(tablePointer);
  }
}
