import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { BOOL, DWORD, HANDLE, LPCWSTR, LPVOID, LPWSTR } from '../types/WIN32_CLASS';

/**
 * Thin, lazy-loaded FFI bindings for `WIN32_DLL.dll`.
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
 * import WIN32_CLASS from './structs/WIN32_CLASS';
 *
 * // Lazy: bind on first call
 * const result = WIN32_CLASS.SomeFunctionW(buffer.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * WIN32_CLASS.Preload(['SomeFunctionW', 'AnotherFunctionW']);
 * ```
 */
class WIN32_CLASS extends Win32 {
  protected static override name = 'WIN32_DLL.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {} as const satisfies Record<string, FFIFunction>;
}

export default WIN32_CLASS;
