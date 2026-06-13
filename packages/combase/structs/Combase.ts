import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  AgileReferenceOptions,
  BOOL,
  DWORD,
  HRESULT,
  HSTRING,
  HSTRING_BUFFER,
  IApartmentShutdown,
  IRestrictedErrorInfo,
  IRoMetaDataLocator,
  IUnknown,
  LPBOOL,
  LPCLSID,
  LPGUID,
  LPLPVOID,
  LPLPWSTR,
  LPPCWSTR,
  LPUNKNOWN,
  LPVOID,
  NULL,
  PAPARTMENT_SHUTDOWN_REGISTRATION_COOKIE,
  PCNZWCH,
  PCSTR,
  PCWSTR,
  PFNGETACTIVATIONFACTORY,
  PHSTRING,
  PHSTRING_BUFFER,
  PHSTRING_HEADER,
  PINSPECT_HSTRING_CALLBACK,
  PINSPECT_HSTRING_CALLBACK2,
  PINSPECT_MEMORY_CALLBACK,
  PINT32,
  PRO_REGISTRATION_COOKIE,
  PROPARAMIIDHANDLE,
  PUCHAR,
  PUINT32,
  PUINT64,
  PUINT_PTR,
  PULONG,
  PVOID,
  REFCLSID,
  REFIID,
  RO_INIT_TYPE,
  RO_REGISTRATION_COOKIE,
  ROPARAMIIDHANDLE,
  APARTMENT_SHUTDOWN_REGISTRATION_COOKIE,
  UINT,
  UINT32,
  UINT64,
  UINT_PTR,
  ULONG,
  USHORT,
} from '../types/Combase';

/**
 * Thin, lazy-loaded FFI bindings for `combase.dll`.
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
 * import Combase from './structs/Combase';
 *
 * // Lazy: bind on first call
 * const hr = Combase.RoInitialize(RO_INIT_TYPE.RO_INIT_MULTITHREADED);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Combase.Preload(['RoInitialize', 'RoGetActivationFactory']);
 * ```
 */
class Combase extends Win32 {
  protected static override name = 'combase.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    // real combase exports, verified by dumpbin (ole32 only forwards these)
    CLSIDFromString: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CoCreateInstance: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CoInitializeEx: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CoUninitialize: { args: [], returns: FFIType.void },
    GetRestrictedErrorInfo: { args: [FFIType.ptr], returns: FFIType.i32 },
    HSTRING_UserFree: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    HSTRING_UserMarshal: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    HSTRING_UserSize: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    HSTRING_UserUnmarshal: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    IsErrorPropagationEnabled: { args: [], returns: FFIType.i32 },
    RoActivateInstance: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RoCaptureErrorContext: { args: [FFIType.i32], returns: FFIType.i32 },
    RoClearError: { args: [], returns: FFIType.void },
    RoFailFastWithErrorContext: { args: [FFIType.i32], returns: FFIType.void },
    RoFreeParameterizedTypeExtra: { args: [FFIType.u64], returns: FFIType.void },
    RoGetActivationFactory: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RoGetAgileReference: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RoGetApartmentIdentifier: { args: [FFIType.ptr], returns: FFIType.i32 },
    RoGetErrorReportingFlags: { args: [FFIType.ptr], returns: FFIType.i32 },
    RoGetMatchingRestrictedErrorInfo: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    RoGetParameterizedTypeInstanceIID: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RoInitialize: { args: [FFIType.i32], returns: FFIType.i32 },
    RoInspectCapturedStackBackTrace: { args: [FFIType.u64, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RoInspectThreadErrorInfo: { args: [FFIType.u64, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RoOriginateError: { args: [FFIType.i32, FFIType.u64], returns: FFIType.i32 },
    RoOriginateErrorW: { args: [FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RoOriginateLanguageException: { args: [FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RoParameterizedTypeExtraGetTypeSignature: { args: [FFIType.u64], returns: FFIType.ptr },
    RoRegisterActivationFactories: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RoRegisterForApartmentShutdown: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RoReportFailedDelegate: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RoReportUnhandledError: { args: [FFIType.ptr], returns: FFIType.i32 },
    RoResolveRestrictedErrorInfoReference: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RoRevokeActivationFactories: { args: [FFIType.u64], returns: FFIType.void },
    RoSetErrorReportingFlags: { args: [FFIType.u32], returns: FFIType.i32 },
    RoTransformError: { args: [FFIType.i32, FFIType.i32, FFIType.u64], returns: FFIType.i32 },
    RoTransformErrorW: { args: [FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RoUninitialize: { args: [], returns: FFIType.void },
    RoUnregisterForApartmentShutdown: { args: [FFIType.u64], returns: FFIType.i32 },
    SetRestrictedErrorInfo: { args: [FFIType.ptr], returns: FFIType.i32 },
    WindowsCompareStringOrdinal: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WindowsConcatString: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WindowsCreateString: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WindowsCreateStringReference: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WindowsDeleteString: { args: [FFIType.u64], returns: FFIType.i32 },
    WindowsDeleteStringBuffer: { args: [FFIType.u64], returns: FFIType.i32 },
    WindowsDuplicateString: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WindowsGetStringLen: { args: [FFIType.u64], returns: FFIType.u32 },
    WindowsGetStringRawBuffer: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    WindowsInspectString: { args: [FFIType.u64, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WindowsInspectString2: { args: [FFIType.u64, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WindowsIsStringEmpty: { args: [FFIType.u64], returns: FFIType.i32 },
    WindowsPreallocateStringBuffer: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WindowsPromoteStringBuffer: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WindowsReplaceString: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WindowsStringHasEmbeddedNull: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WindowsSubstring: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WindowsSubstringWithSpecifiedLength: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WindowsTrimStringEnd: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WindowsTrimStringStart: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-clsidfromstring
  public static CLSIDFromString(lpsz: PCWSTR, pclsid: LPCLSID): HRESULT {
    return Combase.Load('CLSIDFromString')(lpsz, pclsid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-cocreateinstance
  public static CoCreateInstance(rclsid: REFCLSID, pUnkOuter: LPUNKNOWN | 0n, dwClsContext: DWORD, riid: REFIID, ppv: LPLPVOID): HRESULT {
    return Combase.Load('CoCreateInstance')(rclsid, pUnkOuter, dwClsContext, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-coinitializeex
  public static CoInitializeEx(pvReserved: LPVOID | NULL, dwCoInit: DWORD): HRESULT {
    return Combase.Load('CoInitializeEx')(pvReserved, dwCoInit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-couninitialize
  public static CoUninitialize(): void {
    return Combase.Load('CoUninitialize')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roerrorapi/nf-roerrorapi-getrestrictederrorinfo
  public static GetRestrictedErrorInfo(ppRestrictedErrorInfo: LPLPVOID): HRESULT {
    return Combase.Load('GetRestrictedErrorInfo')(ppRestrictedErrorInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-hstring_userfree
  public static HSTRING_UserFree(pFlags: PULONG, ppidl: PHSTRING): void {
    return Combase.Load('HSTRING_UserFree')(pFlags, ppidl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-hstring_usermarshal
  public static HSTRING_UserMarshal(pFlags: PULONG, pBuffer: PUCHAR, ppidl: PHSTRING): PUCHAR {
    return Combase.Load('HSTRING_UserMarshal')(pFlags, pBuffer, ppidl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-hstring_usersize
  public static HSTRING_UserSize(pFlags: PULONG, StartingSize: ULONG, ppidl: PHSTRING): ULONG {
    return Combase.Load('HSTRING_UserSize')(pFlags, StartingSize, ppidl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-hstring_userunmarshal
  public static HSTRING_UserUnmarshal(pFlags: PULONG, pBuffer: PUCHAR, ppidl: PHSTRING): PUCHAR {
    return Combase.Load('HSTRING_UserUnmarshal')(pFlags, pBuffer, ppidl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roerrorapi/nf-roerrorapi-iserrorpropagationenabled
  public static IsErrorPropagationEnabled(): BOOL {
    return Combase.Load('IsErrorPropagationEnabled')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roapi/nf-roapi-roactivateinstance
  public static RoActivateInstance(activatableClassId: HSTRING, instance: LPLPVOID): HRESULT {
    return Combase.Load('RoActivateInstance')(activatableClassId, instance);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roerrorapi/nf-roerrorapi-rocaptureerrorcontext
  public static RoCaptureErrorContext(hr: HRESULT): HRESULT {
    return Combase.Load('RoCaptureErrorContext')(hr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roerrorapi/nf-roerrorapi-roclearerror
  public static RoClearError(): void {
    return Combase.Load('RoClearError')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roerrorapi/nf-roerrorapi-rofailfastwitherrorcontext
  public static RoFailFastWithErrorContext(hrError: HRESULT): void {
    return Combase.Load('RoFailFastWithErrorContext')(hrError);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roparameterizediid/nf-roparameterizediid-rofreeparameterizedtypeextra
  public static RoFreeParameterizedTypeExtra(extra: ROPARAMIIDHANDLE): void {
    return Combase.Load('RoFreeParameterizedTypeExtra')(extra);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roapi/nf-roapi-rogetactivationfactory
  public static RoGetActivationFactory(activatableClassId: HSTRING, iid: REFIID, factory: LPLPVOID): HRESULT {
    return Combase.Load('RoGetActivationFactory')(activatableClassId, iid, factory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-rogetagilereference
  public static RoGetAgileReference(options: AgileReferenceOptions, riid: REFIID, pUnk: IUnknown, ppAgileReference: LPLPVOID): HRESULT {
    return Combase.Load('RoGetAgileReference')(options, riid, pUnk, ppAgileReference);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roapi/nf-roapi-rogetapartmentidentifier
  public static RoGetApartmentIdentifier(apartmentIdentifier: PUINT64): HRESULT {
    return Combase.Load('RoGetApartmentIdentifier')(apartmentIdentifier);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roerrorapi/nf-roerrorapi-rogeterrorreportingflags
  public static RoGetErrorReportingFlags(pflags: PUINT32): HRESULT {
    return Combase.Load('RoGetErrorReportingFlags')(pflags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roerrorapi/nf-roerrorapi-rogetmatchingrestrictederrorinfo
  public static RoGetMatchingRestrictedErrorInfo(hrIn: HRESULT, ppRestrictedErrorInfo: LPLPVOID): HRESULT {
    return Combase.Load('RoGetMatchingRestrictedErrorInfo')(hrIn, ppRestrictedErrorInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roparameterizediid/nf-roparameterizediid-rogetparameterizedtypeinstanceiid
  public static RoGetParameterizedTypeInstanceIID(nameElementCount: UINT32, nameElements: LPPCWSTR, metaDataLocator: IRoMetaDataLocator, iid: LPGUID, pExtra: PROPARAMIIDHANDLE | NULL): HRESULT {
    return Combase.Load('RoGetParameterizedTypeInstanceIID')(nameElementCount, nameElements, metaDataLocator, iid, pExtra);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roapi/nf-roapi-roinitialize
  public static RoInitialize(initType: RO_INIT_TYPE): HRESULT {
    return Combase.Load('RoInitialize')(initType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roerrorapi/nf-roerrorapi-roinspectcapturedstackbacktrace
  public static RoInspectCapturedStackBackTrace(targetErrorInfoAddress: UINT_PTR, machine: USHORT, readMemoryCallback: PINSPECT_MEMORY_CALLBACK, context: PVOID | NULL, frameCount: PUINT32, targetBackTraceAddress: PUINT_PTR): HRESULT {
    return Combase.Load('RoInspectCapturedStackBackTrace')(targetErrorInfoAddress, machine, readMemoryCallback, context, frameCount, targetBackTraceAddress);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roerrorapi/nf-roerrorapi-roinspectthreaderrorinfo
  public static RoInspectThreadErrorInfo(targetTebAddress: UINT_PTR, machine: USHORT, readMemoryCallback: PINSPECT_MEMORY_CALLBACK, context: PVOID | NULL, targetErrorInfoAddress: PUINT_PTR): HRESULT {
    return Combase.Load('RoInspectThreadErrorInfo')(targetTebAddress, machine, readMemoryCallback, context, targetErrorInfoAddress);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roerrorapi/nf-roerrorapi-rooriginateerror
  public static RoOriginateError(error: HRESULT, message: HSTRING | 0n): BOOL {
    return Combase.Load('RoOriginateError')(error, message);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roerrorapi/nf-roerrorapi-rooriginateerrorw
  public static RoOriginateErrorW(error: HRESULT, cchMax: UINT, message: PCWSTR | NULL): BOOL {
    return Combase.Load('RoOriginateErrorW')(error, cchMax, message);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roerrorapi/nf-roerrorapi-rooriginatelanguageexception
  public static RoOriginateLanguageException(error: HRESULT, message: HSTRING | 0n, languageException: IUnknown | NULL): BOOL {
    return Combase.Load('RoOriginateLanguageException')(error, message, languageException);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roparameterizediid/nf-roparameterizediid-roparameterizedtypeextragettypesignature
  public static RoParameterizedTypeExtraGetTypeSignature(extra: ROPARAMIIDHANDLE): PCSTR {
    return Combase.Load('RoParameterizedTypeExtraGetTypeSignature')(extra);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roapi/nf-roapi-roregisteractivationfactories
  public static RoRegisterActivationFactories(activatableClassIds: PHSTRING, activationFactoryCallbacks: PFNGETACTIVATIONFACTORY, count: UINT32, cookie: PRO_REGISTRATION_COOKIE): HRESULT {
    return Combase.Load('RoRegisterActivationFactories')(activatableClassIds, activationFactoryCallbacks, count, cookie);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roapi/nf-roapi-roregisterforapartmentshutdown
  public static RoRegisterForApartmentShutdown(callbackObject: IApartmentShutdown, apartmentIdentifier: PUINT64, regCookie: PAPARTMENT_SHUTDOWN_REGISTRATION_COOKIE): HRESULT {
    return Combase.Load('RoRegisterForApartmentShutdown')(callbackObject, apartmentIdentifier, regCookie);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roerrorapi/nf-roerrorapi-roreportfaileddelegate
  public static RoReportFailedDelegate(punkDelegate: IUnknown, pRestrictedErrorInfo: IRestrictedErrorInfo): HRESULT {
    return Combase.Load('RoReportFailedDelegate')(punkDelegate, pRestrictedErrorInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roerrorapi/nf-roerrorapi-roreportunhandlederror
  public static RoReportUnhandledError(pRestrictedErrorInfo: IRestrictedErrorInfo): HRESULT {
    return Combase.Load('RoReportUnhandledError')(pRestrictedErrorInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roerrorapi/nf-roerrorapi-roresolverestrictederrorinforeference
  public static RoResolveRestrictedErrorInfoReference(reference: PCWSTR, ppRestrictedErrorInfo: LPLPVOID): HRESULT {
    return Combase.Load('RoResolveRestrictedErrorInfoReference')(reference, ppRestrictedErrorInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roapi/nf-roapi-rorevokeactivationfactories
  public static RoRevokeActivationFactories(cookie: RO_REGISTRATION_COOKIE): void {
    return Combase.Load('RoRevokeActivationFactories')(cookie);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roerrorapi/nf-roerrorapi-roseterrorreportingflags
  public static RoSetErrorReportingFlags(flags: UINT32): HRESULT {
    return Combase.Load('RoSetErrorReportingFlags')(flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roerrorapi/nf-roerrorapi-rotransformerror
  public static RoTransformError(oldError: HRESULT, newError: HRESULT, message: HSTRING | 0n): BOOL {
    return Combase.Load('RoTransformError')(oldError, newError, message);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roerrorapi/nf-roerrorapi-rotransformerrorw
  public static RoTransformErrorW(oldError: HRESULT, newError: HRESULT, cchMax: UINT, message: PCWSTR | NULL): BOOL {
    return Combase.Load('RoTransformErrorW')(oldError, newError, cchMax, message);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roapi/nf-roapi-rouninitialize
  public static RoUninitialize(): void {
    return Combase.Load('RoUninitialize')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roapi/nf-roapi-rounregisterforapartmentshutdown
  public static RoUnregisterForApartmentShutdown(regCookie: APARTMENT_SHUTDOWN_REGISTRATION_COOKIE): HRESULT {
    return Combase.Load('RoUnregisterForApartmentShutdown')(regCookie);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/roerrorapi/nf-roerrorapi-setrestrictederrorinfo
  public static SetRestrictedErrorInfo(pRestrictedErrorInfo: IRestrictedErrorInfo | NULL): HRESULT {
    return Combase.Load('SetRestrictedErrorInfo')(pRestrictedErrorInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-windowscomparestringordinal
  public static WindowsCompareStringOrdinal(string1: HSTRING | 0n, string2: HSTRING | 0n, result: PINT32): HRESULT {
    return Combase.Load('WindowsCompareStringOrdinal')(string1, string2, result);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-windowsconcatstring
  public static WindowsConcatString(string1: HSTRING | 0n, string2: HSTRING | 0n, newString: PHSTRING): HRESULT {
    return Combase.Load('WindowsConcatString')(string1, string2, newString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-windowscreatestring
  public static WindowsCreateString(sourceString: PCNZWCH | NULL, length: UINT32, string: PHSTRING): HRESULT {
    return Combase.Load('WindowsCreateString')(sourceString, length, string);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-windowscreatestringreference
  public static WindowsCreateStringReference(sourceString: PCWSTR | NULL, length: UINT32, hstringHeader: PHSTRING_HEADER, string: PHSTRING): HRESULT {
    return Combase.Load('WindowsCreateStringReference')(sourceString, length, hstringHeader, string);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-windowsdeletestring
  public static WindowsDeleteString(string: HSTRING | 0n): HRESULT {
    return Combase.Load('WindowsDeleteString')(string);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-windowsdeletestringbuffer
  public static WindowsDeleteStringBuffer(bufferHandle: HSTRING_BUFFER | 0n): HRESULT {
    return Combase.Load('WindowsDeleteStringBuffer')(bufferHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-windowsduplicatestring
  public static WindowsDuplicateString(string: HSTRING | 0n, newString: PHSTRING): HRESULT {
    return Combase.Load('WindowsDuplicateString')(string, newString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-windowsgetstringlen
  public static WindowsGetStringLen(string: HSTRING | 0n): UINT32 {
    return Combase.Load('WindowsGetStringLen')(string);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-windowsgetstringrawbuffer
  public static WindowsGetStringRawBuffer(string: HSTRING | 0n, length: PUINT32 | NULL): PCWSTR {
    return Combase.Load('WindowsGetStringRawBuffer')(string, length);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-windowsinspectstring
  public static WindowsInspectString(targetHString: UINT_PTR, machine: USHORT, callback: PINSPECT_HSTRING_CALLBACK, context: LPVOID | NULL, length: PUINT32, targetStringAddress: PUINT_PTR): HRESULT {
    return Combase.Load('WindowsInspectString')(targetHString, machine, callback, context, length, targetStringAddress);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-windowsinspectstring2
  public static WindowsInspectString2(targetHString: UINT64, machine: USHORT, callback: PINSPECT_HSTRING_CALLBACK2, context: LPVOID | NULL, length: PUINT32, targetStringAddress: PUINT64): HRESULT {
    return Combase.Load('WindowsInspectString2')(targetHString, machine, callback, context, length, targetStringAddress);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-windowsisstringempty
  public static WindowsIsStringEmpty(string: HSTRING | 0n): BOOL {
    return Combase.Load('WindowsIsStringEmpty')(string);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-windowspreallocatestringbuffer
  public static WindowsPreallocateStringBuffer(length: UINT32, charBuffer: LPLPWSTR, bufferHandle: PHSTRING_BUFFER): HRESULT {
    return Combase.Load('WindowsPreallocateStringBuffer')(length, charBuffer, bufferHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-windowspromotestringbuffer
  public static WindowsPromoteStringBuffer(bufferHandle: HSTRING_BUFFER, string: PHSTRING): HRESULT {
    return Combase.Load('WindowsPromoteStringBuffer')(bufferHandle, string);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-windowsreplacestring
  public static WindowsReplaceString(string: HSTRING | 0n, stringReplaced: HSTRING | 0n, stringReplaceWith: HSTRING | 0n, newString: PHSTRING): HRESULT {
    return Combase.Load('WindowsReplaceString')(string, stringReplaced, stringReplaceWith, newString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-windowsstringhasembeddednull
  public static WindowsStringHasEmbeddedNull(string: HSTRING | 0n, hasEmbedNull: LPBOOL): HRESULT {
    return Combase.Load('WindowsStringHasEmbeddedNull')(string, hasEmbedNull);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-windowssubstring
  public static WindowsSubstring(string: HSTRING | 0n, startIndex: UINT32, newString: PHSTRING): HRESULT {
    return Combase.Load('WindowsSubstring')(string, startIndex, newString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-windowssubstringwithspecifiedlength
  public static WindowsSubstringWithSpecifiedLength(string: HSTRING | 0n, startIndex: UINT32, length: UINT32, newString: PHSTRING): HRESULT {
    return Combase.Load('WindowsSubstringWithSpecifiedLength')(string, startIndex, length, newString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-windowstrimstringend
  public static WindowsTrimStringEnd(string: HSTRING | 0n, trimString: HSTRING | 0n, newString: PHSTRING): HRESULT {
    return Combase.Load('WindowsTrimStringEnd')(string, trimString, newString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winstring/nf-winstring-windowstrimstringstart
  public static WindowsTrimStringStart(string: HSTRING | 0n, trimString: HSTRING | 0n, newString: PHSTRING): HRESULT {
    return Combase.Load('WindowsTrimStringStart')(string, trimString, newString);
  }
}

export default Combase;
