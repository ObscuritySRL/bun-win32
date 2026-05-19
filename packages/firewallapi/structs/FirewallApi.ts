import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  DWORD,
  HANDLE,
  HRESULT,
  LPCWSTR,
  NULL,
  PAC_CHANGES_CALLBACK_FN,
  PDWORD,
  PHANDLE,
  PINET_FIREWALL_APP_CONTAINER,
  PLPCWSTR,
  PNETISO_ERROR_TYPE,
  PPINET_FIREWALL_APP_CONTAINER,
  PPSID_AND_ATTRIBUTES,
  PPVOID,
  PSID,
  PSID_AND_ATTRIBUTES,
  PVOID,
  REFCLSID,
  REFIID,
} from '../types/FirewallApi';

/**
 * Thin, lazy-loaded FFI bindings for `firewallapi.dll`.
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
 * import FirewallApi from './structs/FirewallApi';
 *
 * // Lazy: bind on first call
 * const result = FirewallApi.NetworkIsolationEnumAppContainers(0, count.ptr, list.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * FirewallApi.Preload(['NetworkIsolationEnumAppContainers', 'NetworkIsolationFreeAppContainers']);
 * ```
 */
class FirewallApi extends Win32 {
  protected static override name = 'firewallapi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DllCanUnloadNow: { args: [], returns: FFIType.i32 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DllRegisterServer: { args: [], returns: FFIType.i32 },
    DllUnregisterServer: { args: [], returns: FFIType.i32 },
    NetworkIsolationDiagnoseConnectFailure: { args: [FFIType.ptr], returns: FFIType.u32 },
    NetworkIsolationDiagnoseConnectFailureAndGetInfo: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetworkIsolationEnumAppContainers: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetworkIsolationFreeAppContainers: { args: [FFIType.u64], returns: FFIType.u32 },
    NetworkIsolationGetAppContainerConfig: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetworkIsolationRegisterForAppContainerChanges: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetworkIsolationSetAppContainerConfig: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetworkIsolationSetupAppContainerBinaries: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NetworkIsolationUnregisterForAppContainerChanges: { args: [FFIType.u64], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllcanunloadnow
  public static DllCanUnloadNow(): HRESULT {
    return FirewallApi.Load('DllCanUnloadNow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllgetclassobject
  public static DllGetClassObject(rclsid: REFCLSID, riid: REFIID, ppv: PPVOID): HRESULT {
    return FirewallApi.Load('DllGetClassObject')(rclsid, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllregisterserver
  public static DllRegisterServer(): HRESULT {
    return FirewallApi.Load('DllRegisterServer')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/olectl/nf-olectl-dllunregisterserver
  public static DllUnregisterServer(): HRESULT {
    return FirewallApi.Load('DllUnregisterServer')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/networkisolation/nf-networkisolation-networkisolationdiagnoseconnectfailure
  public static NetworkIsolationDiagnoseConnectFailure(wszServerName: LPCWSTR): DWORD {
    return FirewallApi.Load('NetworkIsolationDiagnoseConnectFailure')(wszServerName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/networkisolation/nf-networkisolation-networkisolationdiagnoseconnectfailureandgetinfo
  public static NetworkIsolationDiagnoseConnectFailureAndGetInfo(wszServerName: LPCWSTR, netIsoError: PNETISO_ERROR_TYPE): DWORD {
    return FirewallApi.Load('NetworkIsolationDiagnoseConnectFailureAndGetInfo')(wszServerName, netIsoError);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/networkisolation/nf-networkisolation-networkisolationenumappcontainers
  public static NetworkIsolationEnumAppContainers(Flags: DWORD, pdwNumPublicAppCs: PDWORD, ppPublicAppCs: PPINET_FIREWALL_APP_CONTAINER): DWORD {
    return FirewallApi.Load('NetworkIsolationEnumAppContainers')(Flags, pdwNumPublicAppCs, ppPublicAppCs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/networkisolation/nf-networkisolation-networkisolationfreeappcontainers
  public static NetworkIsolationFreeAppContainers(pPublicAppCs: PINET_FIREWALL_APP_CONTAINER): DWORD {
    return FirewallApi.Load('NetworkIsolationFreeAppContainers')(pPublicAppCs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/networkisolation/nf-networkisolation-networkisolationgetappcontainerconfig
  public static NetworkIsolationGetAppContainerConfig(pdwNumPublicAppCs: PDWORD, appContainerSids: PPSID_AND_ATTRIBUTES): DWORD {
    return FirewallApi.Load('NetworkIsolationGetAppContainerConfig')(pdwNumPublicAppCs, appContainerSids);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/networkisolation/nf-networkisolation-networkisolationregisterforappcontainerchanges
  public static NetworkIsolationRegisterForAppContainerChanges(flags: DWORD, callback: PAC_CHANGES_CALLBACK_FN, context: PVOID | NULL, registrationObject: PHANDLE): DWORD {
    return FirewallApi.Load('NetworkIsolationRegisterForAppContainerChanges')(flags, callback, context, registrationObject);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/networkisolation/nf-networkisolation-networkisolationsetappcontainerconfig
  public static NetworkIsolationSetAppContainerConfig(dwNumPublicAppCs: DWORD, appContainerSids: PSID_AND_ATTRIBUTES): DWORD {
    return FirewallApi.Load('NetworkIsolationSetAppContainerConfig')(dwNumPublicAppCs, appContainerSids);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/networkisolation/nf-networkisolation-networkisolationsetupappcontainerbinaries
  public static NetworkIsolationSetupAppContainerBinaries(
    applicationContainerSid: PSID,
    packageFullName: LPCWSTR,
    packageFolder: LPCWSTR,
    displayName: LPCWSTR,
    bBinariesFullyComputed: BOOL,
    binaries: PLPCWSTR,
    binariesCount: DWORD,
  ): HRESULT {
    return FirewallApi.Load('NetworkIsolationSetupAppContainerBinaries')(applicationContainerSid, packageFullName, packageFolder, displayName, bBinariesFullyComputed, binaries, binariesCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/networkisolation/nf-networkisolation-networkisolationunregisterforappcontainerchanges
  public static NetworkIsolationUnregisterForAppContainerChanges(registrationObject: HANDLE): DWORD {
    return FirewallApi.Load('NetworkIsolationUnregisterForAppContainerChanges')(registrationObject);
  }
}

export default FirewallApi;
