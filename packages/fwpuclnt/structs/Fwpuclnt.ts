import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { BOOL, DWORD, HANDLE, LPCWSTR, LPVOID, LPWSTR } from '../types/Fwpuclnt';

/**
 * Thin, lazy-loaded FFI bindings for `fwpuclnt.dll`.
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
 * import Fwpuclnt from './structs/Fwpuclnt';
 *
 * // Lazy: bind on first call
 * const result = Fwpuclnt.SomeFunctionW(buffer.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Fwpuclnt.Preload(['SomeFunctionW', 'AnotherFunctionW']);
 * ```
 */
class Fwpuclnt extends Win32 {
  protected static override name = 'fwpuclnt.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {} as const satisfies Record<string, FFIFunction>;
}

export default Fwpuclnt;
