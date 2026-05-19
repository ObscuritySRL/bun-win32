import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { DWORD, HRESULT, IADsContainer, IEnumVARIANT, LPCWSTR, LPDWORD, LPLPWSTR, NULL, PDWORD, PIEnumVARIANT, PPSECURITY_DESCRIPTOR, PPVOID, PSECURITY_DESCRIPTOR, PVARIANT, REFCLSID, REFIID, ULONG, VARIANT } from '../types/Activeds';

/**
 * Thin, lazy-loaded FFI bindings for `activeds.dll`.
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
 * import Activeds from './structs/Activeds';
 *
 * // Lazy: bind on first call
 * const result = Activeds.ADsGetObject(path.ptr, iid.ptr, ppObject.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Activeds.Preload(['ADsGetObject', 'ADsOpenObject']);
 * ```
 */
class Activeds extends Win32 {
  protected static override name = 'activeds.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    ADsBuildEnumerator: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ADsBuildVarArrayInt: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ADsBuildVarArrayStr: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ADsEnumerateNext: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ADsFreeEnumerator: { args: [FFIType.u64], returns: FFIType.i32 },
    ADsGetObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ADsOpenObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BinarySDToSecurityDescriptor: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    DllCanUnloadNow: { args: [], returns: FFIType.i32 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SecurityDescriptorToBinarySD: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/adshlp/nf-adshlp-adsbuildenumerator
  public static ADsBuildEnumerator(pADsContainer: IADsContainer, ppEnumVariant: PIEnumVARIANT): HRESULT {
    return Activeds.Load('ADsBuildEnumerator')(pADsContainer, ppEnumVariant);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/adshlp/nf-adshlp-adsbuildvararrayint
  public static ADsBuildVarArrayInt(lpdwObjectTypes: LPDWORD, dwObjectTypes: DWORD, pVar: PVARIANT): HRESULT {
    return Activeds.Load('ADsBuildVarArrayInt')(lpdwObjectTypes, dwObjectTypes, pVar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/adshlp/nf-adshlp-adsbuildvararraystr
  public static ADsBuildVarArrayStr(lppPathNames: LPLPWSTR, dwPathNames: DWORD, pVar: PVARIANT): HRESULT {
    return Activeds.Load('ADsBuildVarArrayStr')(lppPathNames, dwPathNames, pVar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/adshlp/nf-adshlp-adsenumeratenext
  public static ADsEnumerateNext(pEnumVariant: IEnumVARIANT, cElements: ULONG, pvar: PVARIANT, pcElementsFetched: PDWORD): HRESULT {
    return Activeds.Load('ADsEnumerateNext')(pEnumVariant, cElements, pvar, pcElementsFetched);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/adshlp/nf-adshlp-adsfreeenumerator
  public static ADsFreeEnumerator(pEnumVariant: IEnumVARIANT): HRESULT {
    return Activeds.Load('ADsFreeEnumerator')(pEnumVariant);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/adshlp/nf-adshlp-adsgetobject
  public static ADsGetObject(lpszPathName: LPCWSTR, riid: REFIID, ppObject: PPVOID): HRESULT {
    return Activeds.Load('ADsGetObject')(lpszPathName, riid, ppObject);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/adshlp/nf-adshlp-adsopenobject
  public static ADsOpenObject(lpszPathName: LPCWSTR, lpszUserName: LPCWSTR | NULL, lpszPassword: LPCWSTR | NULL, dwReserved: DWORD, riid: REFIID, ppObject: PPVOID): HRESULT {
    return Activeds.Load('ADsOpenObject')(lpszPathName, lpszUserName, lpszPassword, dwReserved, riid, ppObject);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/adshlp/nf-adshlp-binarysdtosecuritydescriptor
  public static BinarySDToSecurityDescriptor(pSecurityDescriptor: PSECURITY_DESCRIPTOR, pVarsec: PVARIANT, pszServerName: LPCWSTR | NULL, userName: LPCWSTR | NULL, passWord: LPCWSTR | NULL, dwFlags: DWORD): HRESULT {
    return Activeds.Load('BinarySDToSecurityDescriptor')(pSecurityDescriptor, pVarsec, pszServerName, userName, passWord, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllcanunloadnow
  public static DllCanUnloadNow(): HRESULT {
    return Activeds.Load('DllCanUnloadNow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllgetclassobject
  public static DllGetClassObject(rclsid: REFCLSID, riid: REFIID, ppv: PPVOID): HRESULT {
    return Activeds.Load('DllGetClassObject')(rclsid, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/adshlp/nf-adshlp-securitydescriptortobinarysd
  public static SecurityDescriptorToBinarySD(
    vVarSecDes: VARIANT,
    ppSecurityDescriptor: PPSECURITY_DESCRIPTOR,
    pdwSDLength: PDWORD,
    pszServerName: LPCWSTR | NULL,
    userName: LPCWSTR | NULL,
    passWord: LPCWSTR | NULL,
    dwFlags: DWORD,
  ): HRESULT {
    return Activeds.Load('SecurityDescriptorToBinarySD')(vVarSecDes, ppSecurityDescriptor, pdwSDLength, pszServerName, userName, passWord, dwFlags);
  }
}

export default Activeds;
