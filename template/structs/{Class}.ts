import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { BOOL, DWORD, HANDLE, LPCWSTR, LPVOID, LPWSTR } from '../types/{Class}';

/**
 * Thin, lazy-loaded FFI bindings for `{name}.dll`.
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
 * import {Class} from './structs/{Class}';
 *
 * // Lazy: bind on first call
 * const result = {Class}.SomeFunctionW(buffer.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * {Class}.Preload(['SomeFunctionW', 'AnotherFunctionW']);
 * ```
 */
class {Class} extends Win32 {
  protected static override name = '{name}.dll';

  // ---------------------------------------------------------------------------
  // FFI symbol declarations — alphabetized
  //
  // FFIType reference:
  //   FFIType.i32   → BOOL, int, LONG
  //   FFIType.u32   → DWORD, UINT, ULONG
  //   FFIType.u64   → HANDLE, HWND, HMODULE (returned as bigint)
  //   FFIType.ptr   → any pointer parameter (LPVOID, LPWSTR, LPCWSTR, etc.)
  //   FFIType.void  → void return
  //
  // Consult the Win32 docs for each function's exact signature:
  //   https://learn.microsoft.com/en-us/windows/win32/api/{header}/nf-{header}-{functionname}
  // ---------------------------------------------------------------------------
  protected static override readonly Symbols = {
    // Add symbols here in alphabetical order.
    // Each entry maps a Win32 export name to its FFI signature.
    //
    // Example entries:
    //
    // SomeFunctionA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    // SomeFunctionW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // ---------------------------------------------------------------------------
  // Public methods — alphabetized, one per symbol
  //
  // Each method:
  //   1. Has a Microsoft Docs link as a comment above it.
  //   2. Uses Win32 parameter names as-is (hWnd, lpBuffer, dwSize, etc.).
  //   3. Delegates to Load() which lazy-binds on first call.
  //   4. Is typed with aliases from ../types/{Class}.ts.
  //
  // Example methods:
  //
  // // https://learn.microsoft.com/en-us/windows/win32/api/{header}/nf-{header}-somefunctionw
  // public static SomeFunctionW(hObject: HANDLE, lpBuffer: LPWSTR, nSize: DWORD): DWORD {
  //   return {Class}.Load('SomeFunctionW')(hObject, lpBuffer, nSize);
  // }
  // ---------------------------------------------------------------------------
}

export default {Class};
