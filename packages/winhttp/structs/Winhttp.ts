import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  DWORD,
  DWORD_PTR,
  HINTERNET,
  INT,
  INTERNET_PORT,
  INTERNET_SCHEME,
  LPBOOL,
  LPCVOID,
  LPCWSTR,
  LPDWORD,
  LPHINTERNET,
  LPURL_COMPONENTS,
  LPVOID,
  LPWINHTTP_PROXY_INFO,
  LPWSTR,
  NULL,
  NULLABLE,
  OPTIONAL,
  PBYTE,
  PCWSTR,
  PDWORD,
  PSYSTEMTIME,
  PVOID,
  PWINHTTP_AUTOPROXY_OPTIONS,
  PWINHTTP_CURRENT_USER_IE_PROXY_CONFIG,
  PWINHTTP_EXTENDED_HEADER,
  PWINHTTP_HEADER_NAME,
  PWINHTTP_PROXY_INFO,
  PWINHTTP_PROXY_RESULT,
  PWINHTTP_PROXY_RESULT_EX,
  PWINHTTP_PROXY_SETTINGS,
  PWINHTTP_QUERY_CONNECTION_GROUP_RESULT,
  UINT,
  ULONGLONG,
  USHORT,
  WINHTTP_STATUS_CALLBACK,
} from '../types/Winhttp';

/**
 * Thin, lazy-loaded FFI bindings for `winhttp.dll`.
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
 * import Winhttp from './structs/Winhttp';
 * import { WinHttpAccessType, WinHttpFlag } from './types/Winhttp';
 *
 * const hSession = Winhttp.WinHttpOpen(
 *   Buffer.from('Bun WinHTTP/1.0\0', 'utf16le').ptr,
 *   WinHttpAccessType.AUTOMATIC_PROXY,
 *   null,
 *   null,
 *   0,
 * );
 *
 * Winhttp.Preload(['WinHttpConnect', 'WinHttpOpenRequest', 'WinHttpSendRequest']);
 * ```
 */
class Winhttp extends Win32 {
  protected static override name = 'winhttp.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    WinHttpAddRequestHeaders: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    WinHttpAddRequestHeadersEx: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    WinHttpCheckPlatform: { args: [], returns: FFIType.i32 },
    WinHttpCloseHandle: { args: [FFIType.u64], returns: FFIType.i32 },
    WinHttpConnect: { args: [FFIType.u64, FFIType.ptr, FFIType.u16, FFIType.u32], returns: FFIType.u64 },
    WinHttpCrackUrl: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WinHttpCreateProxyResolver: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    WinHttpCreateUrl: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WinHttpDetectAutoProxyConfigUrl: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WinHttpFreeProxyResult: { args: [FFIType.ptr], returns: FFIType.void },
    WinHttpFreeProxyResultEx: { args: [FFIType.ptr], returns: FFIType.void },
    WinHttpFreeProxySettings: { args: [FFIType.ptr], returns: FFIType.void },
    WinHttpFreeQueryConnectionGroupResult: { args: [FFIType.ptr], returns: FFIType.void },
    WinHttpGetDefaultProxyConfiguration: { args: [FFIType.ptr], returns: FFIType.i32 },
    WinHttpGetIEProxyConfigForCurrentUser: { args: [FFIType.ptr], returns: FFIType.i32 },
    WinHttpGetProxyForUrl: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WinHttpGetProxyForUrlEx: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.u32 },
    WinHttpGetProxyForUrlEx2: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64], returns: FFIType.u32 },
    WinHttpGetProxyResult: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    WinHttpGetProxyResultEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    WinHttpGetProxySettingsVersion: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    WinHttpIsHostInProxyBypassList: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u16, FFIType.ptr], returns: FFIType.u32 },
    WinHttpOpen: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    WinHttpOpenRequest: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    WinHttpQueryAuthParams: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WinHttpQueryAuthSchemes: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WinHttpQueryConnectionGroup: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    WinHttpQueryDataAvailable: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WinHttpQueryHeaders: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WinHttpQueryHeadersEx: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WinHttpQueryOption: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WinHttpReadData: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WinHttpReadDataEx: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    WinHttpReadProxySettings: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WinHttpReceiveResponse: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WinHttpResetAutoProxy: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    WinHttpSendRequest: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    WinHttpSetCredentials: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WinHttpSetDefaultProxyConfiguration: { args: [FFIType.ptr], returns: FFIType.i32 },
    WinHttpSetOption: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WinHttpSetProxySettingsPerUser: { args: [FFIType.i32], returns: FFIType.u32 },
    WinHttpSetStatusCallback: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.ptr },
    WinHttpSetTimeouts: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    WinHttpTimeFromSystemTime: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WinHttpTimeToSystemTime: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WinHttpWebSocketClose: { args: [FFIType.u64, FFIType.u16, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    WinHttpWebSocketCompleteUpgrade: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    WinHttpWebSocketQueryCloseStatus: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    WinHttpWebSocketReceive: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WinHttpWebSocketSend: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    WinHttpWebSocketShutdown: { args: [FFIType.u64, FFIType.u16, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    WinHttpWriteData: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WinHttpWriteProxySettings: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpaddrequestheaders
  public static WinHttpAddRequestHeaders(hRequest: HINTERNET, lpszHeaders: LPCWSTR, dwHeadersLength: DWORD, dwModifiers: DWORD): BOOL {
    return Winhttp.Load('WinHttpAddRequestHeaders')(hRequest, lpszHeaders, dwHeadersLength, dwModifiers);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpaddrequestheadersex
  public static WinHttpAddRequestHeadersEx(hRequest: HINTERNET, dwModifiers: DWORD, ullFlags: ULONGLONG, ullExtra: ULONGLONG, cHeaders: DWORD, pHeaders: PWINHTTP_EXTENDED_HEADER): DWORD {
    return Winhttp.Load('WinHttpAddRequestHeadersEx')(hRequest, dwModifiers, ullFlags, ullExtra, cHeaders, pHeaders);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpcheckplatform
  public static WinHttpCheckPlatform(): BOOL {
    return Winhttp.Load('WinHttpCheckPlatform')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpclosehandle
  public static WinHttpCloseHandle(hInternet: HINTERNET): BOOL {
    return Winhttp.Load('WinHttpCloseHandle')(hInternet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpconnect
  public static WinHttpConnect(hSession: HINTERNET, pswzServerName: LPCWSTR, nServerPort: INTERNET_PORT, dwReserved: DWORD): HINTERNET {
    return Winhttp.Load('WinHttpConnect')(hSession, pswzServerName, nServerPort, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpcrackurl
  public static WinHttpCrackUrl(pwszUrl: LPCWSTR, dwUrlLength: DWORD, dwFlags: DWORD, lpUrlComponents_in_out: LPURL_COMPONENTS): BOOL {
    return Winhttp.Load('WinHttpCrackUrl')(pwszUrl, dwUrlLength, dwFlags, lpUrlComponents_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpcreateproxyresolver
  public static WinHttpCreateProxyResolver(hSession: HINTERNET, phResolver: LPHINTERNET): DWORD {
    return Winhttp.Load('WinHttpCreateProxyResolver')(hSession, phResolver);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpcreateurl
  public static WinHttpCreateUrl(lpUrlComponents: LPURL_COMPONENTS, dwFlags: DWORD, pwszUrl_out: OPTIONAL<LPWSTR>, pdwUrlLength_in_out: LPDWORD): BOOL {
    return Winhttp.Load('WinHttpCreateUrl')(lpUrlComponents, dwFlags, pwszUrl_out, pdwUrlLength_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpdetectautoproxyconfigurl
  public static WinHttpDetectAutoProxyConfigUrl(dwAutoDetectFlags: DWORD, ppwstrAutoConfigUrl_out: LPVOID): BOOL {
    return Winhttp.Load('WinHttpDetectAutoProxyConfigUrl')(dwAutoDetectFlags, ppwstrAutoConfigUrl_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpfreeproxyresult
  public static WinHttpFreeProxyResult(pProxyResult_in_out: PWINHTTP_PROXY_RESULT): void {
    return Winhttp.Load('WinHttpFreeProxyResult')(pProxyResult_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpfreeproxyresultex
  public static WinHttpFreeProxyResultEx(pProxyResultEx_in_out: PWINHTTP_PROXY_RESULT_EX): void {
    return Winhttp.Load('WinHttpFreeProxyResultEx')(pProxyResultEx_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpfreeproxysettings
  public static WinHttpFreeProxySettings(pWinHttpProxySettings: PWINHTTP_PROXY_SETTINGS): void {
    return Winhttp.Load('WinHttpFreeProxySettings')(pWinHttpProxySettings);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpfreequeryconnectiongroupresult
  public static WinHttpFreeQueryConnectionGroupResult(pResult_in_out: PWINHTTP_QUERY_CONNECTION_GROUP_RESULT): void {
    return Winhttp.Load('WinHttpFreeQueryConnectionGroupResult')(pResult_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpgetdefaultproxyconfiguration
  public static WinHttpGetDefaultProxyConfiguration(pProxyInfo_in_out: LPWINHTTP_PROXY_INFO): BOOL {
    return Winhttp.Load('WinHttpGetDefaultProxyConfiguration')(pProxyInfo_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpgetieproxyconfigforcurrentuser
  public static WinHttpGetIEProxyConfigForCurrentUser(pProxyConfig_in_out: PWINHTTP_CURRENT_USER_IE_PROXY_CONFIG): BOOL {
    return Winhttp.Load('WinHttpGetIEProxyConfigForCurrentUser')(pProxyConfig_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpgetproxyforurl
  public static WinHttpGetProxyForUrl(hSession: HINTERNET, lpcwszUrl: LPCWSTR, pAutoProxyOptions: PWINHTTP_AUTOPROXY_OPTIONS, pProxyInfo_out: PWINHTTP_PROXY_INFO): BOOL {
    return Winhttp.Load('WinHttpGetProxyForUrl')(hSession, lpcwszUrl, pAutoProxyOptions, pProxyInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpgetproxyforurlex
  public static WinHttpGetProxyForUrlEx(hResolver: HINTERNET, pcwszUrl: PCWSTR, pAutoProxyOptions: PWINHTTP_AUTOPROXY_OPTIONS, pContext: OPTIONAL<DWORD_PTR>): DWORD {
    return Winhttp.Load('WinHttpGetProxyForUrlEx')(hResolver, pcwszUrl, pAutoProxyOptions, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpgetproxyforurlex2
  public static WinHttpGetProxyForUrlEx2(
    hResolver: HINTERNET,
    pcwszUrl: PCWSTR,
    pAutoProxyOptions: PWINHTTP_AUTOPROXY_OPTIONS,
    cbInterfaceSelectionContext: DWORD,
    pInterfaceSelectionContext: OPTIONAL<PBYTE>,
    pContext: OPTIONAL<DWORD_PTR>,
  ): DWORD {
    return Winhttp.Load('WinHttpGetProxyForUrlEx2')(hResolver, pcwszUrl, pAutoProxyOptions, cbInterfaceSelectionContext, pInterfaceSelectionContext, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpgetproxyresult
  public static WinHttpGetProxyResult(hResolver: HINTERNET, pProxyResult_out: PWINHTTP_PROXY_RESULT): DWORD {
    return Winhttp.Load('WinHttpGetProxyResult')(hResolver, pProxyResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpgetproxyresultex
  public static WinHttpGetProxyResultEx(hResolver: HINTERNET, pProxyResultEx_out: PWINHTTP_PROXY_RESULT_EX): DWORD {
    return Winhttp.Load('WinHttpGetProxyResultEx')(hResolver, pProxyResultEx_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpgetproxysettingsversion
  public static WinHttpGetProxySettingsVersion(hSession: HINTERNET, pdwProxySettingsVersion_out: PDWORD): DWORD {
    return Winhttp.Load('WinHttpGetProxySettingsVersion')(hSession, pdwProxySettingsVersion_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpishostinproxybypasslist
  public static WinHttpIsHostInProxyBypassList(pProxyInfo: PWINHTTP_PROXY_INFO, pwszHost: PCWSTR, tScheme: INTERNET_SCHEME, nPort: INTERNET_PORT, pfIsInBypassList_out: LPBOOL): DWORD {
    return Winhttp.Load('WinHttpIsHostInProxyBypassList')(pProxyInfo, pwszHost, tScheme, nPort, pfIsInBypassList_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpopen
  public static WinHttpOpen(pszAgentW: OPTIONAL<LPCWSTR>, dwAccessType: DWORD, pszProxyW: OPTIONAL<LPCWSTR>, pszProxyBypassW: OPTIONAL<LPCWSTR>, dwFlags: DWORD): HINTERNET {
    return Winhttp.Load('WinHttpOpen')(pszAgentW, dwAccessType, pszProxyW, pszProxyBypassW, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpopenrequest
  public static WinHttpOpenRequest(hConnect: HINTERNET, pwszVerb: NULLABLE<LPCWSTR>, pwszObjectName: LPCWSTR, pwszVersion: NULLABLE<LPCWSTR>, pwszReferrer: OPTIONAL<LPCWSTR>, ppwszAcceptTypes: OPTIONAL<LPVOID>, dwFlags: DWORD): HINTERNET {
    return Winhttp.Load('WinHttpOpenRequest')(hConnect, pwszVerb, pwszObjectName, pwszVersion, pwszReferrer, ppwszAcceptTypes, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpqueryauthparams
  public static WinHttpQueryAuthParams(hRequest: HINTERNET, AuthScheme: DWORD, pAuthParams_out: LPVOID): BOOL {
    return Winhttp.Load('WinHttpQueryAuthParams')(hRequest, AuthScheme, pAuthParams_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpqueryauthschemes
  public static WinHttpQueryAuthSchemes(hRequest: HINTERNET, lpdwSupportedSchemes_out: LPDWORD, lpdwFirstScheme_out: LPDWORD, pdwAuthTarget_out: LPDWORD): BOOL {
    return Winhttp.Load('WinHttpQueryAuthSchemes')(hRequest, lpdwSupportedSchemes_out, lpdwFirstScheme_out, pdwAuthTarget_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpqueryconnectiongroup
  public static WinHttpQueryConnectionGroup(hInternet: HINTERNET, pGuidConnection: OPTIONAL<LPCVOID>, ullFlags: ULONGLONG, ppResult_in_out: LPVOID): DWORD {
    return Winhttp.Load('WinHttpQueryConnectionGroup')(hInternet, pGuidConnection, ullFlags, ppResult_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpquerydataavailable
  public static WinHttpQueryDataAvailable(hRequest: HINTERNET, lpdwNumberOfBytesAvailable_out: NULLABLE<LPDWORD>): BOOL {
    return Winhttp.Load('WinHttpQueryDataAvailable')(hRequest, lpdwNumberOfBytesAvailable_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpqueryheaders
  public static WinHttpQueryHeaders(hRequest: HINTERNET, dwInfoLevel: DWORD, pwszName: OPTIONAL<LPCWSTR>, lpBuffer_out: OPTIONAL<LPVOID>, lpdwBufferLength_in_out: LPDWORD, lpdwIndex_in_out: OPTIONAL<LPDWORD>): BOOL {
    return Winhttp.Load('WinHttpQueryHeaders')(hRequest, dwInfoLevel, pwszName, lpBuffer_out, lpdwBufferLength_in_out, lpdwIndex_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpqueryheadersex
  public static WinHttpQueryHeadersEx(
    hRequest: HINTERNET,
    dwInfoLevel: DWORD,
    ullFlags: ULONGLONG,
    uiCodePage: UINT,
    pdwIndex_in_out: OPTIONAL<PDWORD>,
    pHeaderName: OPTIONAL<PWINHTTP_HEADER_NAME>,
    pBuffer_out: OPTIONAL<PVOID>,
    pdwBufferLength_in_out: PDWORD,
    ppHeaders_out: OPTIONAL<LPVOID>,
    pdwHeadersCount_out: PDWORD,
  ): DWORD {
    return Winhttp.Load('WinHttpQueryHeadersEx')(hRequest, dwInfoLevel, ullFlags, uiCodePage, pdwIndex_in_out, pHeaderName, pBuffer_out, pdwBufferLength_in_out, ppHeaders_out, pdwHeadersCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpqueryoption
  public static WinHttpQueryOption(hInternet: HINTERNET, dwOption: DWORD, lpBuffer_out: OPTIONAL<LPVOID>, lpdwBufferLength_in_out: LPDWORD): BOOL {
    return Winhttp.Load('WinHttpQueryOption')(hInternet, dwOption, lpBuffer_out, lpdwBufferLength_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpreaddata
  public static WinHttpReadData(hRequest: HINTERNET, lpBuffer_out: LPVOID, dwNumberOfBytesToRead: DWORD, lpdwNumberOfBytesRead_out: NULLABLE<LPDWORD>): BOOL {
    return Winhttp.Load('WinHttpReadData')(hRequest, lpBuffer_out, dwNumberOfBytesToRead, lpdwNumberOfBytesRead_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpreaddataex
  public static WinHttpReadDataEx(hRequest: HINTERNET, lpBuffer_out: LPVOID, dwNumberOfBytesToRead: DWORD, lpdwNumberOfBytesRead_out: LPDWORD, ullFlags: ULONGLONG, cbProperty: DWORD, pvProperty: OPTIONAL<PVOID>): DWORD {
    return Winhttp.Load('WinHttpReadDataEx')(hRequest, lpBuffer_out, dwNumberOfBytesToRead, lpdwNumberOfBytesRead_out, ullFlags, cbProperty, pvProperty);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpreadproxysettings
  public static WinHttpReadProxySettings(
    hSession: HINTERNET,
    pcwszConnectionName: OPTIONAL<PCWSTR>,
    fFallBackToDefaultSettings: BOOL,
    fSetAutoDiscoverForDefaultSettings: BOOL,
    pdwSettingsVersion_out: PDWORD,
    pfDefaultSettingsAreReturned_out: LPBOOL,
    pWinHttpProxySettings_out: PWINHTTP_PROXY_SETTINGS,
  ): DWORD {
    return Winhttp.Load('WinHttpReadProxySettings')(hSession, pcwszConnectionName, fFallBackToDefaultSettings, fSetAutoDiscoverForDefaultSettings, pdwSettingsVersion_out, pfDefaultSettingsAreReturned_out, pWinHttpProxySettings_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpreceiveresponse
  public static WinHttpReceiveResponse(hRequest: HINTERNET, lpReserved: LPVOID | NULL): BOOL {
    return Winhttp.Load('WinHttpReceiveResponse')(hRequest, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpresetautoproxy
  public static WinHttpResetAutoProxy(hSession: HINTERNET, dwFlags: DWORD): DWORD {
    return Winhttp.Load('WinHttpResetAutoProxy')(hSession, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpsendrequest
  public static WinHttpSendRequest(hRequest: HINTERNET, lpszHeaders: OPTIONAL<LPCWSTR>, dwHeadersLength: DWORD, lpOptional: OPTIONAL<LPVOID>, dwOptionalLength: DWORD, dwTotalLength: DWORD, dwContext: DWORD_PTR): BOOL {
    return Winhttp.Load('WinHttpSendRequest')(hRequest, lpszHeaders, dwHeadersLength, lpOptional, dwOptionalLength, dwTotalLength, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpsetcredentials
  public static WinHttpSetCredentials(hRequest: HINTERNET, AuthTargets: DWORD, AuthScheme: DWORD, pwszUserName: NULLABLE<LPCWSTR>, pwszPassword: NULLABLE<LPCWSTR>, pAuthParams: LPVOID | NULL): BOOL {
    return Winhttp.Load('WinHttpSetCredentials')(hRequest, AuthTargets, AuthScheme, pwszUserName, pwszPassword, pAuthParams);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpsetdefaultproxyconfiguration
  public static WinHttpSetDefaultProxyConfiguration(pProxyInfo: PWINHTTP_PROXY_INFO): BOOL {
    return Winhttp.Load('WinHttpSetDefaultProxyConfiguration')(pProxyInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpsetoption
  public static WinHttpSetOption(hInternet: OPTIONAL<HINTERNET>, dwOption: DWORD, lpBuffer: NULLABLE<LPVOID>, dwBufferLength: DWORD): BOOL {
    return Winhttp.Load('WinHttpSetOption')(hInternet, dwOption, lpBuffer, dwBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpsetproxysettingsperuser
  public static WinHttpSetProxySettingsPerUser(fProxySettingsPerUser: BOOL): DWORD {
    return Winhttp.Load('WinHttpSetProxySettingsPerUser')(fProxySettingsPerUser);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpsetstatuscallback
  public static WinHttpSetStatusCallback(hInternet: HINTERNET, lpfnInternetCallback: NULLABLE<WINHTTP_STATUS_CALLBACK>, dwNotificationFlags: DWORD, dwReserved: DWORD_PTR | 0n): WINHTTP_STATUS_CALLBACK | NULL {
    return Winhttp.Load('WinHttpSetStatusCallback')(hInternet, lpfnInternetCallback, dwNotificationFlags, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpsettimeouts
  public static WinHttpSetTimeouts(hInternet: HINTERNET, nResolveTimeout: INT, nConnectTimeout: INT, nSendTimeout: INT, nReceiveTimeout: INT): BOOL {
    return Winhttp.Load('WinHttpSetTimeouts')(hInternet, nResolveTimeout, nConnectTimeout, nSendTimeout, nReceiveTimeout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttptimefromsystemtime
  public static WinHttpTimeFromSystemTime(pst: PSYSTEMTIME, pwszTime_out: LPWSTR): BOOL {
    return Winhttp.Load('WinHttpTimeFromSystemTime')(pst, pwszTime_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttptimetosystemtime
  public static WinHttpTimeToSystemTime(pwszTime: LPCWSTR, pst_out: PSYSTEMTIME): BOOL {
    return Winhttp.Load('WinHttpTimeToSystemTime')(pwszTime, pst_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpwebsocketclose
  public static WinHttpWebSocketClose(hWebSocket: HINTERNET, usStatus: USHORT, pvReason: OPTIONAL<PVOID>, dwReasonLength: DWORD): DWORD {
    return Winhttp.Load('WinHttpWebSocketClose')(hWebSocket, usStatus, pvReason, dwReasonLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpwebsocketcompleteupgrade
  public static WinHttpWebSocketCompleteUpgrade(hRequest: HINTERNET, pContext: OPTIONAL<DWORD_PTR>): HINTERNET {
    return Winhttp.Load('WinHttpWebSocketCompleteUpgrade')(hRequest, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpwebsocketqueryclosestatus
  public static WinHttpWebSocketQueryCloseStatus(hWebSocket: HINTERNET, pusStatus_out: PVOID, pvReason_out: OPTIONAL<PVOID>, dwReasonLength: DWORD, pdwReasonLengthConsumed_out: PDWORD): DWORD {
    return Winhttp.Load('WinHttpWebSocketQueryCloseStatus')(hWebSocket, pusStatus_out, pvReason_out, dwReasonLength, pdwReasonLengthConsumed_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpwebsocketreceive
  public static WinHttpWebSocketReceive(hWebSocket: HINTERNET, pvBuffer_out: PVOID, dwBufferLength: DWORD, pdwBytesRead_out: PDWORD, peBufferType_out: PDWORD): DWORD {
    return Winhttp.Load('WinHttpWebSocketReceive')(hWebSocket, pvBuffer_out, dwBufferLength, pdwBytesRead_out, peBufferType_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpwebsocketsend
  public static WinHttpWebSocketSend(hWebSocket: HINTERNET, eBufferType: INT, pvBuffer: OPTIONAL<PVOID>, dwBufferLength: DWORD): DWORD {
    return Winhttp.Load('WinHttpWebSocketSend')(hWebSocket, eBufferType, pvBuffer, dwBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpwebsocketshutdown
  public static WinHttpWebSocketShutdown(hWebSocket: HINTERNET, usStatus: USHORT, pvReason: OPTIONAL<PVOID>, dwReasonLength: DWORD): DWORD {
    return Winhttp.Load('WinHttpWebSocketShutdown')(hWebSocket, usStatus, pvReason, dwReasonLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpwritedata
  public static WinHttpWriteData(hRequest: HINTERNET, lpBuffer: OPTIONAL<LPCVOID>, dwNumberOfBytesToWrite: DWORD, lpdwNumberOfBytesWritten_out: NULLABLE<LPDWORD>): BOOL {
    return Winhttp.Load('WinHttpWriteData')(hRequest, lpBuffer, dwNumberOfBytesToWrite, lpdwNumberOfBytesWritten_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winhttp/nf-winhttp-winhttpwriteproxysettings
  public static WinHttpWriteProxySettings(hSession: HINTERNET, fForceUpdate: BOOL, pWinHttpProxySettings: PWINHTTP_PROXY_SETTINGS): DWORD {
    return Winhttp.Load('WinHttpWriteProxySettings')(hSession, fForceUpdate, pWinHttpProxySettings);
  }
}

export default Winhttp;
