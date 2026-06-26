import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { BOOL, LPCSTR, LPCWSTR, LPDWORD, LPQOCINFO, NULLABLE } from '../types/Sensapi';

/**
 * Thin, lazy-loaded FFI bindings for `sensapi.dll`.
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
 * import Sensapi from './structs/Sensapi';
 *
 * // Lazy: bind on first call
 * const flagsBuffer = Buffer.alloc(4);
 * const alive = Sensapi.IsNetworkAlive(flagsBuffer.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Sensapi.Preload(['IsDestinationReachableW', 'IsNetworkAlive']);
 * ```
 */
class Sensapi extends Win32 {
  protected static override name = 'sensapi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    IsDestinationReachableA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IsDestinationReachableW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IsNetworkAlive: { args: [FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/sensapi/nf-sensapi-isdestinationreachablea
  public static IsDestinationReachableA(lpszDestination: LPCSTR, lpQOCInfo_in_out: NULLABLE<LPQOCINFO>): BOOL {
    return Sensapi.Load('IsDestinationReachableA')(lpszDestination, lpQOCInfo_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sensapi/nf-sensapi-isdestinationreachablew
  public static IsDestinationReachableW(lpszDestination: LPCWSTR, lpQOCInfo_in_out: NULLABLE<LPQOCINFO>): BOOL {
    return Sensapi.Load('IsDestinationReachableW')(lpszDestination, lpQOCInfo_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sensapi/nf-sensapi-isnetworkalive
  public static IsNetworkAlive(lpdwFlags_out: LPDWORD): BOOL {
    return Sensapi.Load('IsNetworkAlive')(lpdwFlags_out);
  }
}

export default Sensapi;
