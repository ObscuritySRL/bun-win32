import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { BOOL, DWORD, PRESTOREPOINTINFOA, PRESTOREPOINTINFOW, PSTATEMGRSTATUS } from '../types/Srclient';

/**
 * Thin, lazy-loaded FFI bindings for `srclient.dll`.
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
 * import Srclient from './structs/Srclient';
 *
 * // Lazy: bind on first call
 * const result = Srclient.SRSetRestorePointW(restorePtSpec.ptr, smgrStatus.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Srclient.Preload(['SRSetRestorePointW', 'SRRemoveRestorePoint']);
 * ```
 */
class Srclient extends Win32 {
  protected static override name = 'srclient.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    SRRemoveRestorePoint: { args: [FFIType.u32], returns: FFIType.u32 },
    SRSetRestorePointA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SRSetRestorePointW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/srrestoreptapi/nf-srrestoreptapi-srremoverestorepoint
  public static SRRemoveRestorePoint(dwRPNum: DWORD): DWORD {
    return Srclient.Load('SRRemoveRestorePoint')(dwRPNum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/srrestoreptapi/nf-srrestoreptapi-srsetrestorepointa
  public static SRSetRestorePointA(pRestorePtSpec: PRESTOREPOINTINFOA, pSMgrStatus_out: PSTATEMGRSTATUS): BOOL {
    return Srclient.Load('SRSetRestorePointA')(pRestorePtSpec, pSMgrStatus_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/srrestoreptapi/nf-srrestoreptapi-srsetrestorepointw
  public static SRSetRestorePointW(pRestorePtSpec: PRESTOREPOINTINFOW, pSMgrStatus_out: PSTATEMGRSTATUS): BOOL {
    return Srclient.Load('SRSetRestorePointW')(pRestorePtSpec, pSMgrStatus_out);
  }
}

export default Srclient;
