import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { DWORD, HINSTANCE, HRESULT, LPCDIDATAFORMAT, LPLPVOID, LPUNKNOWN, Nullable, Optional, PPVOID, REFCLSID, REFIID } from '../types/Dinput8';

/**
 * Thin, lazy-loaded FFI bindings for `dinput8.dll`.
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
 * import Dinput8 from './structs/Dinput8';
 *
 * // Lazy: bind on first call
 * const iid = Buffer.alloc(16);
 * const ppDI = Buffer.alloc(8);
 * const hr = Dinput8.DirectInput8Create(hinst, 0x0800, iid.ptr, ppDI.ptr, null);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Dinput8.Preload(['DirectInput8Create', 'GetdfDIJoystick']);
 * ```
 */
class Dinput8 extends Win32 {
  protected static override name = 'dinput8.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DirectInput8Create: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DllCanUnloadNow: { args: [], returns: FFIType.i32 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DllRegisterServer: { args: [], returns: FFIType.i32 },
    DllUnregisterServer: { args: [], returns: FFIType.i32 },
    GetdfDIJoystick: { args: [], returns: FFIType.ptr },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/previous-versions/windows/desktop/ee416756(v=vs.85)
  public static DirectInput8Create(hinst: HINSTANCE, dwVersion: DWORD, riidltf: REFIID, ppvOut_out: LPLPVOID, punkOuter: Nullable<LPUNKNOWN>): HRESULT {
    return Dinput8.Load('DirectInput8Create')(hinst, dwVersion, riidltf, ppvOut_out, punkOuter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllcanunloadnow
  public static DllCanUnloadNow(): HRESULT {
    return Dinput8.Load('DllCanUnloadNow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllgetclassobject
  public static DllGetClassObject(rclsid: REFCLSID, riid: REFIID, ppv_out: PPVOID): HRESULT {
    return Dinput8.Load('DllGetClassObject')(rclsid, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllregisterserver
  public static DllRegisterServer(): HRESULT {
    return Dinput8.Load('DllRegisterServer')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllunregisterserver
  public static DllUnregisterServer(): HRESULT {
    return Dinput8.Load('DllUnregisterServer')();
  }

  // https://learn.microsoft.com/en-us/previous-versions/windows/desktop/ee416593(v=vs.85)
  public static GetdfDIJoystick(): LPCDIDATAFORMAT {
    return Dinput8.Load('GetdfDIJoystick')();
  }
}

export default Dinput8;
