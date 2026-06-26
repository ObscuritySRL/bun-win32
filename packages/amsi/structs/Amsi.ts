import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { HAMSICONTEXT, HAMSISESSION, HRESULT, LPCWSTR, Optional, PAMSI_RESULT, PHAMSICONTEXT, PHAMSISESSION, PPVOID, PVOID, REFCLSID, REFIID, ULONG, VOID } from '../types/Amsi';

/**
 * Thin, lazy-loaded FFI bindings for `amsi.dll`.
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
 * import Amsi from './structs/Amsi';
 *
 * // Lazy: bind on first call
 * const ctx = Buffer.alloc(8);
 * Amsi.AmsiInitialize(Buffer.from('MyApp\0', 'utf16le').ptr, ctx.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Amsi.Preload(['AmsiInitialize', 'AmsiScanBuffer', 'AmsiUninitialize']);
 * ```
 */
class Amsi extends Win32 {
  protected static override name = 'amsi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    AmsiCloseSession: { args: [FFIType.u64, FFIType.u64], returns: FFIType.void },
    AmsiInitialize: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AmsiNotifyOperation: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AmsiOpenSession: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    AmsiScanBuffer: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    AmsiScanString: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    AmsiUninitialize: { args: [FFIType.u64], returns: FFIType.void },
    DllCanUnloadNow: { args: [], returns: FFIType.i32 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DllRegisterServer: { args: [], returns: FFIType.i32 },
    DllUnregisterServer: { args: [], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/amsi/nf-amsi-amsiclosesession
  public static AmsiCloseSession(amsiContext: HAMSICONTEXT, amsiSession: HAMSISESSION): VOID {
    return Amsi.Load('AmsiCloseSession')(amsiContext, amsiSession);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/amsi/nf-amsi-amsiinitialize
  public static AmsiInitialize(appName: LPCWSTR, amsiContext_out: PHAMSICONTEXT): HRESULT {
    return Amsi.Load('AmsiInitialize')(appName, amsiContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/amsi/nf-amsi-amsinotifyoperation
  public static AmsiNotifyOperation(amsiContext: HAMSICONTEXT, buffer: PVOID, length: ULONG, contentName: Optional<LPCWSTR>, result_out: PAMSI_RESULT): HRESULT {
    return Amsi.Load('AmsiNotifyOperation')(amsiContext, buffer, length, contentName, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/amsi/nf-amsi-amsiopensession
  public static AmsiOpenSession(amsiContext: HAMSICONTEXT, amsiSession_out: PHAMSISESSION): HRESULT {
    return Amsi.Load('AmsiOpenSession')(amsiContext, amsiSession_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/amsi/nf-amsi-amsiscanbuffer
  public static AmsiScanBuffer(amsiContext: HAMSICONTEXT, buffer: PVOID, length: ULONG, contentName: Optional<LPCWSTR>, amsiSession: Optional<HAMSISESSION>, result_out: PAMSI_RESULT): HRESULT {
    return Amsi.Load('AmsiScanBuffer')(amsiContext, buffer, length, contentName, amsiSession, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/amsi/nf-amsi-amsiscanstring
  public static AmsiScanString(amsiContext: HAMSICONTEXT, string: LPCWSTR, contentName: Optional<LPCWSTR>, amsiSession: Optional<HAMSISESSION>, result_out: PAMSI_RESULT): HRESULT {
    return Amsi.Load('AmsiScanString')(amsiContext, string, contentName, amsiSession, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/amsi/nf-amsi-amsiuninitialize
  public static AmsiUninitialize(amsiContext: HAMSICONTEXT): VOID {
    return Amsi.Load('AmsiUninitialize')(amsiContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllcanunloadnow
  public static DllCanUnloadNow(): HRESULT {
    return Amsi.Load('DllCanUnloadNow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllgetclassobject
  public static DllGetClassObject(rclsid: REFCLSID, riid: REFIID, ppv_out: PPVOID): HRESULT {
    return Amsi.Load('DllGetClassObject')(rclsid, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllregisterserver
  public static DllRegisterServer(): HRESULT {
    return Amsi.Load('DllRegisterServer')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllunregisterserver
  public static DllUnregisterServer(): HRESULT {
    return Amsi.Load('DllUnregisterServer')();
  }
}

export default Amsi;
