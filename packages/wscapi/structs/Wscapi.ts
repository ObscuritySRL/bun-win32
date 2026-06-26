import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { DWORD, HANDLE, HRESULT, LPTHREAD_START_ROUTINE, NULL, PHANDLE, PLPWSTR, PPVOID, PVOID, PWSC_SECURITY_PROVIDER_HEALTH, REFCLSID, REFIID } from '../types/Wscapi';

/**
 * Thin, lazy-loaded FFI bindings for `wscapi.dll`.
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
 * import Wscapi, { WSC_SECURITY_PROVIDER } from './structs/Wscapi';
 *
 * // Lazy: bind on first call
 * const health = Buffer.alloc(4);
 * Wscapi.WscGetSecurityProviderHealth(WSC_SECURITY_PROVIDER.WSC_SECURITY_PROVIDER_ANTIVIRUS, health.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Wscapi.Preload(['WscGetSecurityProviderHealth']);
 * ```
 */
class Wscapi extends Win32 {
  protected static override name = 'wscapi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DllCanUnloadNow: { args: [], returns: FFIType.i32 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WscGetAntiMalwareUri: { args: [FFIType.ptr], returns: FFIType.i32 },
    WscGetSecurityProviderHealth: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WscQueryAntiMalwareUri: { args: [], returns: FFIType.i32 },
    WscRegisterForChanges: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WscRegisterForUserNotifications: { args: [], returns: FFIType.i32 },
    WscUnRegisterChanges: { args: [FFIType.u64], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllcanunloadnow
  public static DllCanUnloadNow(): HRESULT {
    return Wscapi.Load('DllCanUnloadNow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllgetclassobject
  public static DllGetClassObject(rclsid: REFCLSID, riid: REFIID, ppv_out: PPVOID): HRESULT {
    return Wscapi.Load('DllGetClassObject')(rclsid, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wscapi/nf-wscapi-wscgetantimalwareuri
  public static WscGetAntiMalwareUri(ppszUri_out: PLPWSTR): HRESULT {
    return Wscapi.Load('WscGetAntiMalwareUri')(ppszUri_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wscapi/nf-wscapi-wscgetsecurityproviderhealth
  public static WscGetSecurityProviderHealth(Providers: DWORD, pHealth_out: PWSC_SECURITY_PROVIDER_HEALTH): HRESULT {
    return Wscapi.Load('WscGetSecurityProviderHealth')(Providers, pHealth_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wscapi/nf-wscapi-wscqueryantimalwareuri
  public static WscQueryAntiMalwareUri(): HRESULT {
    return Wscapi.Load('WscQueryAntiMalwareUri')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wscapi/nf-wscapi-wscregisterforchanges
  public static WscRegisterForChanges(Reserved: NULL, phCallbackRegistration_out: PHANDLE, lpCallbackAddress: LPTHREAD_START_ROUTINE, pContext: PVOID): HRESULT {
    return Wscapi.Load('WscRegisterForChanges')(Reserved, phCallbackRegistration_out, lpCallbackAddress, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wscapi/nf-wscapi-wscregisterforusernotifications
  public static WscRegisterForUserNotifications(): HRESULT {
    return Wscapi.Load('WscRegisterForUserNotifications')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wscapi/nf-wscapi-wscunregisterchanges
  public static WscUnRegisterChanges(hRegistrationHandle: HANDLE): HRESULT {
    return Wscapi.Load('WscUnRegisterChanges')(hRegistrationHandle);
  }
}

export default Wscapi;
