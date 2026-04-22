import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  HRESULT,
  IActivateAudioInterfaceCompletionHandler,
  LPCWSTR,
  NULL,
  PIActivateAudioInterfaceAsyncOperation,
  PPROPVARIANT,
  PPVOID,
  REFCLSID,
  REFIID,
} from '../types/Mmdevapi';

/**
 * Thin, lazy-loaded FFI bindings for `mmdevapi.dll`.
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
 * import Mmdevapi from './structs/Mmdevapi';
 *
 * // Lazy: bind on first call
 * const factoryOut = Buffer.alloc(8);
 * const hr = Mmdevapi.DllGetClassObject(clsid.ptr, iid.ptr, factoryOut.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Mmdevapi.Preload(['DllGetClassObject', 'ActivateAudioInterfaceAsync']);
 * ```
 */
class Mmdevapi extends Win32 {
  protected static override name = 'mmdevapi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    ActivateAudioInterfaceAsync: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DllCanUnloadNow: { args: [], returns: FFIType.i32 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DllRegisterServer: { args: [], returns: FFIType.i32 },
    DllUnregisterServer: { args: [], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/mmdeviceapi/nf-mmdeviceapi-activateaudiointerfaceasync
  public static ActivateAudioInterfaceAsync(
    deviceInterfacePath: LPCWSTR,
    riid: REFIID,
    activationParams: PPROPVARIANT | NULL,
    completionHandler: IActivateAudioInterfaceCompletionHandler,
    activationOperation: PIActivateAudioInterfaceAsyncOperation,
  ): HRESULT {
    return Mmdevapi.Load('ActivateAudioInterfaceAsync')(deviceInterfacePath, riid, activationParams, completionHandler, activationOperation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllcanunloadnow
  public static DllCanUnloadNow(): HRESULT {
    return Mmdevapi.Load('DllCanUnloadNow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllgetclassobject
  public static DllGetClassObject(rclsid: REFCLSID, riid: REFIID, ppv: PPVOID): HRESULT {
    return Mmdevapi.Load('DllGetClassObject')(rclsid, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllregisterserver
  public static DllRegisterServer(): HRESULT {
    return Mmdevapi.Load('DllRegisterServer')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllunregisterserver
  public static DllUnregisterServer(): HRESULT {
    return Mmdevapi.Load('DllUnregisterServer')();
  }
}

export default Mmdevapi;
