import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { DWORD, HRESULT, LPSTR, LPWSTR, PPVOID, REFCLSID, REFIID } from '../types/Quartz';

/**
 * Thin, lazy-loaded FFI bindings for `quartz.dll`.
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
 * import Quartz from './structs/Quartz';
 *
 * // Lazy: bind on first call
 * const buffer = Buffer.alloc(320);
 * const len = Quartz.AMGetErrorTextW(0x80040217, buffer.ptr, 160);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Quartz.Preload(['AMGetErrorTextW', 'AMGetErrorTextA']);
 * ```
 */
class Quartz extends Win32 {
  protected static override name = 'quartz.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    AMGetErrorTextA: { args: [FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    AMGetErrorTextW: { args: [FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    DllCanUnloadNow: { args: [], returns: FFIType.i32 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DllRegisterServer: { args: [], returns: FFIType.i32 },
    DllUnregisterServer: { args: [], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/errors/nf-errors-amgeterrortexta
  public static AMGetErrorTextA(hr: HRESULT, pbuffer_out: LPSTR, MaxLen: DWORD): DWORD {
    return Quartz.Load('AMGetErrorTextA')(hr, pbuffer_out, MaxLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/errors/nf-errors-amgeterrortextw
  public static AMGetErrorTextW(hr: HRESULT, pbuffer_out: LPWSTR, MaxLen: DWORD): DWORD {
    return Quartz.Load('AMGetErrorTextW')(hr, pbuffer_out, MaxLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllcanunloadnow
  public static DllCanUnloadNow(): HRESULT {
    return Quartz.Load('DllCanUnloadNow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllgetclassobject
  public static DllGetClassObject(rclsid: REFCLSID, riid: REFIID, ppv_out: PPVOID): HRESULT {
    return Quartz.Load('DllGetClassObject')(rclsid, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllregisterserver
  public static DllRegisterServer(): HRESULT {
    return Quartz.Load('DllRegisterServer')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllunregisterserver
  public static DllUnregisterServer(): HRESULT {
    return Quartz.Load('DllUnregisterServer')();
  }
}

export default Quartz;
