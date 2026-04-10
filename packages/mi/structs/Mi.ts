import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { DWORD, LPCWSTR, MI_Result, NULL, PMI_Application, PPMI_Instance } from '../types/Mi';

/**
 * Thin, lazy-loaded FFI bindings for `mi.dll` (Windows Management Infrastructure bootstrap).
 *
 * Each static method corresponds one-to-one with a callable Win32 export declared in `Symbols`.
 * The first call to a method binds the underlying native symbol via `bun:ffi` and
 * memoizes it on the class for subsequent calls. For bulk, up-front binding, use `Preload`.
 *
 * Symbols are defined with explicit `FFIType` signatures and kept alphabetized.
 * You normally do not access `Symbols` directly; call the static methods or preload
 * a subset for hot paths.
 *
 * @example
 * ```ts
 * import Mi from './structs/Mi';
 *
 * const applicationID = Buffer.from('bun-win32/mi\0', 'utf16le');
 * const extendedError = Buffer.alloc(8);
 * const application = Buffer.alloc(0x18);
 * const status = Mi.MI_Application_InitializeV1(0, applicationID.ptr, extendedError.ptr, application.ptr);
 * ```
 */
class Mi extends Win32 {
  protected static override name = 'mi.dll';

  // `mi_clientFT_V1` is an exported data symbol, not a callable DLL entry point.
  protected static override readonly Symbols = {
    MI_Application_InitializeV1: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/mi/nf-mi-mi_application_initializev1
  public static MI_Application_InitializeV1(flags: DWORD, applicationID: LPCWSTR | NULL, extendedError: PPMI_Instance | NULL, application: PMI_Application): MI_Result {
    return Mi.Load('MI_Application_InitializeV1')(flags, applicationID, extendedError, application);
  }
}

export default Mi;
