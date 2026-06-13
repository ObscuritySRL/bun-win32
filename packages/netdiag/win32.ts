import type { Pointer } from 'bun:ffi';

export { default as Dnsapi } from '@bun-win32/dnsapi';
export { default as Iphlpapi } from '@bun-win32/iphlpapi';
export { default as Kernel32 } from '@bun-win32/kernel32';
export { default as Wlanapi } from '@bun-win32/wlanapi';
export { default as Ws2_32 } from '@bun-win32/ws2_32';

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
