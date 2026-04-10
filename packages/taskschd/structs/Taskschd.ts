import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { HRESULT, PPVOID, REFCLSID, REFIID } from '../types/Taskschd';

/**
 * Thin, lazy-loaded FFI bindings for `taskschd.dll`.
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
 * import Taskschd from './structs/Taskschd';
 *
 * const canUnload = Taskschd.DllCanUnloadNow();
 *
 * Taskschd.Preload(['DllCanUnloadNow', 'DllGetClassObject']);
 * ```
 */
class Taskschd extends Win32 {
  protected static override name = 'taskschd.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DllCanUnloadNow: { args: [], returns: FFIType.i32 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DllRegisterServer: { args: [], returns: FFIType.i32 },
    DllUnregisterServer: { args: [], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllcanunloadnow
  public static DllCanUnloadNow(): HRESULT {
    return Taskschd.Load('DllCanUnloadNow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllgetclassobject
  public static DllGetClassObject(rclsid: REFCLSID, riid: REFIID, ppv: PPVOID): HRESULT {
    return Taskschd.Load('DllGetClassObject')(rclsid, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllregisterserver
  public static DllRegisterServer(): HRESULT {
    return Taskschd.Load('DllRegisterServer')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllunregisterserver
  public static DllUnregisterServer(): HRESULT {
    return Taskschd.Load('DllUnregisterServer')();
  }
}

export default Taskschd;
