import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { HRESULT, PPVOID, REFCLSID, REFIID } from '../types/Wuapi';

/**
 * Thin, lazy-loaded FFI bindings for `wuapi.dll`.
 *
 * Each static method corresponds one-to-one with a Win32 export declared in `Symbols`.
 * The first call to a method binds the underlying native symbol via `bun:ffi` and
 * memoizes it on the class for subsequent calls. For bulk, up-front binding, use `Preload`.
 *
 * Symbols are defined with explicit `FFIType` signatures and kept alphabetized.
 * You normally do not access `Symbols` directly; call the static methods or preload
 * a subset for hot paths.
 *
 * `wuapi.dll` is the Windows Update Agent COM server. Its only flat exports are the
 * standard COM in-process server entry points (`Dll*`). The Windows Update object
 * model (`IUpdateSession`, `IUpdateSearcher`, `ISearchResult`, ...) is reached by
 * `CoCreateInstance` of `CLSID_UpdateSession` (ProgID `Microsoft.Update.Session`)
 * and driven over the COM vtable; the relevant CLSIDs/IIDs are exported from
 * `types/Wuapi.ts`.
 *
 * @example
 * ```ts
 * import Wuapi from './structs/Wuapi';
 *
 * // Lazy: bind on first call
 * const hr = Wuapi.DllGetClassObject(rclsid.ptr, riid.ptr, ppv.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Wuapi.Preload(['DllGetClassObject', 'DllCanUnloadNow']);
 * ```
 */
class Wuapi extends Win32 {
  protected static override name = 'wuapi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DllCanUnloadNow: { args: [], returns: FFIType.i32 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DllRegisterServer: { args: [], returns: FFIType.i32 },
    DllUnregisterServer: { args: [], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllcanunloadnow
  public static DllCanUnloadNow(): HRESULT {
    return Wuapi.Load('DllCanUnloadNow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllgetclassobject
  public static DllGetClassObject(rclsid: REFCLSID, riid: REFIID, ppv_out: PPVOID): HRESULT {
    return Wuapi.Load('DllGetClassObject')(rclsid, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllregisterserver
  public static DllRegisterServer(): HRESULT {
    return Wuapi.Load('DllRegisterServer')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllunregisterserver
  public static DllUnregisterServer(): HRESULT {
    return Wuapi.Load('DllUnregisterServer')();
  }
}

export default Wuapi;
