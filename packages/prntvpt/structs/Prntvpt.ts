import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

/**
 * Thin, lazy-loaded FFI bindings for `prntvpt.dll`.
 *
 * Each static method corresponds one-to-one with a Win32 export declared in `Symbols`.
 * The first call to a method binds the underlying native symbol via `bun:ffi` and
 * memoizes it on the class for subsequent calls. For bulk, up-front binding, use `Preload`.
 *
 * Symbols are defined with explicit `FFIType` signatures and kept alphabetized.
 * You normally do not access `Symbols` directly; call the static methods or preload
 * a subset for hot paths.
 *
 * @example
 * ```ts
 * import Prntvpt from './structs/Prntvpt';
 *
 * // Lazy: bind on first call
 * const result = Prntvpt.PTOpenProvider(printerName.ptr, 1, handle.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Prntvpt.Preload(['PTOpenProvider', 'PTCloseProvider']);
 * ```
 */
class Prntvpt extends Win32 {
  protected static override name = 'prntvpt.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {} as const satisfies Record<string, FFIFunction>;
}

export default Prntvpt;
