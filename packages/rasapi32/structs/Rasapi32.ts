import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  DWORD,
  HANDLE,
  HRASCONN,
  HWND,
  LPBOOL,
  LPBYTE,
  LPCSTR,
  LPCWSTR,
  LPDWORD,
  LPHRASCONN,
  LPRASAUTODIALENTRYA,
  LPRASAUTODIALENTRYW,
  LPRASCONNA,
  LPRASCONNSTATUSA,
  LPRASCONNSTATUSW,
  LPRASCONNW,
  LPRASCREDENTIALSA,
  LPRASCREDENTIALSW,
  LPRASCTRYINFOA,
  LPRASCTRYINFOW,
  LPRASDEVINFOA,
  LPRASDEVINFOW,
  LPRASDIALEXTENSIONS,
  LPRASDIALPARAMSA,
  LPRASDIALPARAMSW,
  LPRASEAPUSERIDENTITYA,
  LPRASEAPUSERIDENTITYW,
  LPRASENTRYA,
  LPRASENTRYNAMEA,
  LPRASENTRYNAMEW,
  LPRASENTRYW,
  LPRASNAPSTATE,
  LPRASSUBENTRYA,
  LPRASSUBENTRYW,
  LPRASUPDATECONN,
  LPRAS_STATS,
  LPSTR,
  LPVOID,
  LPWSTR,
  OPTIONAL,
  PLPRASEAPUSERIDENTITYA,
  PLPRASEAPUSERIDENTITYW,
  PLPSTR,
  PLPWSTR,
  PRAS_PROJECTION_INFO,
  RASPROJECTION,
  UINT,
  VOID,
} from '../types/Rasapi32';

/**
 * Thin, lazy-loaded FFI bindings for `rasapi32.dll`.
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
 * import Rasapi32 from './structs/Rasapi32';
 *
 * // Lazy: bind on first call
 * const result = Rasapi32.RasEnumConnectionsW(null, lpcb.ptr, lpcConnections.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Rasapi32.Preload(['RasEnumConnectionsW', 'RasGetConnectStatusW']);
 * ```
 */
class Rasapi32 extends Win32 {
  protected static override name = 'rasapi32.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    RasClearConnectionStatistics: { args: [FFIType.u64], returns: FFIType.u32 },
    RasClearLinkStatistics: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    RasConnectionNotificationA: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    RasConnectionNotificationW: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    RasCreatePhonebookEntryA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    RasCreatePhonebookEntryW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    RasDeleteEntryA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasDeleteEntryW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasDeleteSubEntryA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    RasDeleteSubEntryW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    RasDialA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasDialW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasEditPhonebookEntryA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasEditPhonebookEntryW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasEnumAutodialAddressesA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasEnumAutodialAddressesW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasEnumConnectionsA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasEnumConnectionsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasEnumDevicesA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasEnumDevicesW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasEnumEntriesA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasEnumEntriesW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasFreeEapUserIdentityA: { args: [FFIType.ptr], returns: FFIType.void },
    RasFreeEapUserIdentityW: { args: [FFIType.ptr], returns: FFIType.void },
    RasGetAutodialAddressA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasGetAutodialAddressW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasGetAutodialEnableA: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    RasGetAutodialEnableW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    RasGetAutodialParamA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasGetAutodialParamW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasGetConnectStatusA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    RasGetConnectStatusW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    RasGetConnectionStatistics: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    RasGetCountryInfoA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasGetCountryInfoW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasGetCredentialsA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasGetCredentialsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasGetCustomAuthDataA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasGetCustomAuthDataW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasGetEapUserDataA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasGetEapUserDataW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasGetEapUserIdentityA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    RasGetEapUserIdentityW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    RasGetEntryDialParamsA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasGetEntryDialParamsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasGetEntryPropertiesA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasGetEntryPropertiesW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasGetErrorStringA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    RasGetErrorStringW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    RasGetLinkStatistics: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    RasGetNapStatus: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    RasGetProjectionInfoA: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasGetProjectionInfoEx: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasGetProjectionInfoW: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasGetSubEntryHandleA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    RasGetSubEntryHandleW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    RasGetSubEntryPropertiesA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasGetSubEntryPropertiesW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasHangUpA: { args: [FFIType.u64], returns: FFIType.u32 },
    RasHangUpW: { args: [FFIType.u64], returns: FFIType.u32 },
    RasInvokeEapUI: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u64], returns: FFIType.u32 },
    RasRenameEntryA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasRenameEntryW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasSetAutodialAddressA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    RasSetAutodialAddressW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    RasSetAutodialEnableA: { args: [FFIType.u32, FFIType.i32], returns: FFIType.u32 },
    RasSetAutodialEnableW: { args: [FFIType.u32, FFIType.i32], returns: FFIType.u32 },
    RasSetAutodialParamA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    RasSetAutodialParamW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    RasSetCredentialsA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    RasSetCredentialsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    RasSetCustomAuthDataA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    RasSetCustomAuthDataW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    RasSetEapUserDataA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    RasSetEapUserDataW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    RasSetEntryDialParamsA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    RasSetEntryDialParamsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    RasSetEntryPropertiesA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    RasSetEntryPropertiesW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    RasSetSubEntryPropertiesA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    RasSetSubEntryPropertiesW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    RasUpdateConnection: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    RasValidateEntryNameA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RasValidateEntryNameW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasclearconnectionstatistics
  public static RasClearConnectionStatistics(hRasConn: HRASCONN): DWORD {
    return Rasapi32.Load('RasClearConnectionStatistics')(hRasConn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasclearlinkstatistics
  public static RasClearLinkStatistics(hRasConn: HRASCONN, dwSubEntry: DWORD): DWORD {
    return Rasapi32.Load('RasClearLinkStatistics')(hRasConn, dwSubEntry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasconnectionnotificationa
  public static RasConnectionNotificationA(hrasconn: HRASCONN, hEvent: HANDLE, dwFlags: DWORD): DWORD {
    return Rasapi32.Load('RasConnectionNotificationA')(hrasconn, hEvent, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasconnectionnotificationw
  public static RasConnectionNotificationW(hrasconn: HRASCONN, hEvent: HANDLE, dwFlags: DWORD): DWORD {
    return Rasapi32.Load('RasConnectionNotificationW')(hrasconn, hEvent, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rascreatephonebookentrya
  public static RasCreatePhonebookEntryA(hwnd: HWND, lpszPhonebook: OPTIONAL<LPCSTR>): DWORD {
    return Rasapi32.Load('RasCreatePhonebookEntryA')(hwnd, lpszPhonebook);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rascreatephonebookentryw
  public static RasCreatePhonebookEntryW(hwnd: HWND, lpszPhonebook: OPTIONAL<LPCWSTR>): DWORD {
    return Rasapi32.Load('RasCreatePhonebookEntryW')(hwnd, lpszPhonebook);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasdeleteentrya
  public static RasDeleteEntryA(lpszPhonebook: OPTIONAL<LPCSTR>, lpszEntry: LPCSTR): DWORD {
    return Rasapi32.Load('RasDeleteEntryA')(lpszPhonebook, lpszEntry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasdeleteentryw
  public static RasDeleteEntryW(lpszPhonebook: OPTIONAL<LPCWSTR>, lpszEntry: LPCWSTR): DWORD {
    return Rasapi32.Load('RasDeleteEntryW')(lpszPhonebook, lpszEntry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasdeletesubentrya
  public static RasDeleteSubEntryA(pszPhonebook: OPTIONAL<LPCSTR>, pszEntry: LPCSTR, dwSubentryId: DWORD): DWORD {
    return Rasapi32.Load('RasDeleteSubEntryA')(pszPhonebook, pszEntry, dwSubentryId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasdeletesubentryw
  public static RasDeleteSubEntryW(pszPhonebook: OPTIONAL<LPCWSTR>, pszEntry: LPCWSTR, dwSubEntryId: DWORD): DWORD {
    return Rasapi32.Load('RasDeleteSubEntryW')(pszPhonebook, pszEntry, dwSubEntryId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasdiala
  public static RasDialA(lpRasDialExtensions: OPTIONAL<LPRASDIALEXTENSIONS>, lpszPhonebook: OPTIONAL<LPCSTR>, lpRasDialParams: LPRASDIALPARAMSA, dwNotifierType: DWORD, lpvNotifier: OPTIONAL<LPVOID>, lphRasConn_out: LPHRASCONN): DWORD {
    return Rasapi32.Load('RasDialA')(lpRasDialExtensions, lpszPhonebook, lpRasDialParams, dwNotifierType, lpvNotifier, lphRasConn_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasdialw
  public static RasDialW(lpRasDialExtensions: OPTIONAL<LPRASDIALEXTENSIONS>, lpszPhonebook: OPTIONAL<LPCWSTR>, lpRasDialParams: LPRASDIALPARAMSW, dwNotifierType: DWORD, lpvNotifier: OPTIONAL<LPVOID>, lphRasConn_out: LPHRASCONN): DWORD {
    return Rasapi32.Load('RasDialW')(lpRasDialExtensions, lpszPhonebook, lpRasDialParams, dwNotifierType, lpvNotifier, lphRasConn_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-raseditphonebookentrya
  public static RasEditPhonebookEntryA(hwnd: HWND, lpszPhonebook: OPTIONAL<LPCSTR>, lpszEntry: LPCSTR): DWORD {
    return Rasapi32.Load('RasEditPhonebookEntryA')(hwnd, lpszPhonebook, lpszEntry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-raseditphonebookentryw
  public static RasEditPhonebookEntryW(hwnd: HWND, lpszPhonebook: OPTIONAL<LPCWSTR>, lpszEntry: LPCWSTR): DWORD {
    return Rasapi32.Load('RasEditPhonebookEntryW')(hwnd, lpszPhonebook, lpszEntry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasenumautodialaddressesa
  public static RasEnumAutodialAddressesA(lppRasAutodialAddresses_in_out: OPTIONAL<PLPSTR>, lpdwcbRasAutodialAddresses_in_out: LPDWORD, lpdwcRasAutodialAddresses_out: LPDWORD): DWORD {
    return Rasapi32.Load('RasEnumAutodialAddressesA')(lppRasAutodialAddresses_in_out, lpdwcbRasAutodialAddresses_in_out, lpdwcRasAutodialAddresses_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasenumautodialaddressesw
  public static RasEnumAutodialAddressesW(lppRasAutodialAddresses_in_out: OPTIONAL<PLPWSTR>, lpdwcbRasAutodialAddresses_in_out: LPDWORD, lpdwcRasAutodialAddresses_out: LPDWORD): DWORD {
    return Rasapi32.Load('RasEnumAutodialAddressesW')(lppRasAutodialAddresses_in_out, lpdwcbRasAutodialAddresses_in_out, lpdwcRasAutodialAddresses_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasenumconnectionsa
  public static RasEnumConnectionsA(lprasconn_in_out: OPTIONAL<LPRASCONNA>, lpcb_in_out: LPDWORD, lpcConnections_out: LPDWORD): DWORD {
    return Rasapi32.Load('RasEnumConnectionsA')(lprasconn_in_out, lpcb_in_out, lpcConnections_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasenumconnectionsw
  public static RasEnumConnectionsW(lprasconn_in_out: OPTIONAL<LPRASCONNW>, lpcb_in_out: LPDWORD, lpcConnections_out: LPDWORD): DWORD {
    return Rasapi32.Load('RasEnumConnectionsW')(lprasconn_in_out, lpcb_in_out, lpcConnections_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasenumdevicesa
  public static RasEnumDevicesA(lpRasDevInfo_in_out: OPTIONAL<LPRASDEVINFOA>, lpcb_in_out: LPDWORD, lpcDevices_out: LPDWORD): DWORD {
    return Rasapi32.Load('RasEnumDevicesA')(lpRasDevInfo_in_out, lpcb_in_out, lpcDevices_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasenumdevicesw
  public static RasEnumDevicesW(lpRasDevInfo_in_out: OPTIONAL<LPRASDEVINFOW>, lpcb_in_out: LPDWORD, lpcDevices_out: LPDWORD): DWORD {
    return Rasapi32.Load('RasEnumDevicesW')(lpRasDevInfo_in_out, lpcb_in_out, lpcDevices_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasenumentriesa
  public static RasEnumEntriesA(reserved: OPTIONAL<LPCSTR>, lpszPhonebook: OPTIONAL<LPCSTR>, lprasentryname_in_out: OPTIONAL<LPRASENTRYNAMEA>, lpcb_in_out: LPDWORD, lpcEntries_out: LPDWORD): DWORD {
    return Rasapi32.Load('RasEnumEntriesA')(reserved, lpszPhonebook, lprasentryname_in_out, lpcb_in_out, lpcEntries_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasenumentriesw
  public static RasEnumEntriesW(reserved: OPTIONAL<LPCWSTR>, lpszPhonebook: OPTIONAL<LPCWSTR>, lprasentryname_in_out: OPTIONAL<LPRASENTRYNAMEW>, lpcb_in_out: LPDWORD, lpcEntries_out: LPDWORD): DWORD {
    return Rasapi32.Load('RasEnumEntriesW')(reserved, lpszPhonebook, lprasentryname_in_out, lpcb_in_out, lpcEntries_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasfreeeapuseridentitya
  public static RasFreeEapUserIdentityA(pRasEapUserIdentity: LPRASEAPUSERIDENTITYA): VOID {
    return Rasapi32.Load('RasFreeEapUserIdentityA')(pRasEapUserIdentity);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasfreeeapuseridentityw
  public static RasFreeEapUserIdentityW(pRasEapUserIdentity: LPRASEAPUSERIDENTITYW): VOID {
    return Rasapi32.Load('RasFreeEapUserIdentityW')(pRasEapUserIdentity);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetautodialaddressa
  public static RasGetAutodialAddressA(
    lpszAddress: OPTIONAL<LPCSTR>,
    lpdwReserved: OPTIONAL<LPDWORD>,
    lpAutoDialEntries_in_out: OPTIONAL<LPRASAUTODIALENTRYA>,
    lpdwcbAutoDialEntries_in_out: LPDWORD,
    lpdwcAutoDialEntries_out: LPDWORD,
  ): DWORD {
    return Rasapi32.Load('RasGetAutodialAddressA')(lpszAddress, lpdwReserved, lpAutoDialEntries_in_out, lpdwcbAutoDialEntries_in_out, lpdwcAutoDialEntries_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetautodialaddressw
  public static RasGetAutodialAddressW(
    lpszAddress: OPTIONAL<LPCWSTR>,
    lpdwReserved: OPTIONAL<LPDWORD>,
    lpAutoDialEntries_in_out: OPTIONAL<LPRASAUTODIALENTRYW>,
    lpdwcbAutoDialEntries_in_out: LPDWORD,
    lpdwcAutoDialEntries_out: LPDWORD,
  ): DWORD {
    return Rasapi32.Load('RasGetAutodialAddressW')(lpszAddress, lpdwReserved, lpAutoDialEntries_in_out, lpdwcbAutoDialEntries_in_out, lpdwcAutoDialEntries_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetautodialenablea
  public static RasGetAutodialEnableA(dwDialingLocation: DWORD, lpfEnabled_out: LPBOOL): DWORD {
    return Rasapi32.Load('RasGetAutodialEnableA')(dwDialingLocation, lpfEnabled_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetautodialenablew
  public static RasGetAutodialEnableW(dwDialingLocation: DWORD, lpfEnabled_out: LPBOOL): DWORD {
    return Rasapi32.Load('RasGetAutodialEnableW')(dwDialingLocation, lpfEnabled_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetautodialparama
  public static RasGetAutodialParamA(dwKey: DWORD, lpvValue_out: LPVOID, lpdwcbValue_in_out: LPDWORD): DWORD {
    return Rasapi32.Load('RasGetAutodialParamA')(dwKey, lpvValue_out, lpdwcbValue_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetautodialparamw
  public static RasGetAutodialParamW(dwKey: DWORD, lpvValue_out: LPVOID, lpdwcbValue_in_out: LPDWORD): DWORD {
    return Rasapi32.Load('RasGetAutodialParamW')(dwKey, lpvValue_out, lpdwcbValue_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetconnectstatusa
  public static RasGetConnectStatusA(hrasconn: HRASCONN, lprasconnstatus_in_out: LPRASCONNSTATUSA): DWORD {
    return Rasapi32.Load('RasGetConnectStatusA')(hrasconn, lprasconnstatus_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetconnectstatusw
  public static RasGetConnectStatusW(hrasconn: HRASCONN, lprasconnstatus_in_out: LPRASCONNSTATUSW): DWORD {
    return Rasapi32.Load('RasGetConnectStatusW')(hrasconn, lprasconnstatus_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetconnectionstatistics
  public static RasGetConnectionStatistics(hRasConn: HRASCONN, lpStatistics_in_out: LPRAS_STATS): DWORD {
    return Rasapi32.Load('RasGetConnectionStatistics')(hRasConn, lpStatistics_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetcountryinfoa
  public static RasGetCountryInfoA(lpRasCtryInfo_in_out: OPTIONAL<LPRASCTRYINFOA>, lpdwSize_in_out: LPDWORD): DWORD {
    return Rasapi32.Load('RasGetCountryInfoA')(lpRasCtryInfo_in_out, lpdwSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetcountryinfow
  public static RasGetCountryInfoW(lpRasCtryInfo_in_out: OPTIONAL<LPRASCTRYINFOW>, lpdwSize_in_out: LPDWORD): DWORD {
    return Rasapi32.Load('RasGetCountryInfoW')(lpRasCtryInfo_in_out, lpdwSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetcredentialsa
  public static RasGetCredentialsA(lpszPhonebook: OPTIONAL<LPCSTR>, lpszEntry: LPCSTR, lpCredentials_in_out: LPRASCREDENTIALSA): DWORD {
    return Rasapi32.Load('RasGetCredentialsA')(lpszPhonebook, lpszEntry, lpCredentials_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetcredentialsw
  public static RasGetCredentialsW(lpszPhonebook: OPTIONAL<LPCWSTR>, lpszEntry: LPCWSTR, lpCredentials_in_out: LPRASCREDENTIALSW): DWORD {
    return Rasapi32.Load('RasGetCredentialsW')(lpszPhonebook, lpszEntry, lpCredentials_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetcustomauthdataa
  public static RasGetCustomAuthDataA(pszPhonebook: OPTIONAL<LPCSTR>, pszEntry: LPCSTR, pbCustomAuthData_out: OPTIONAL<LPBYTE>, pdwSizeofCustomAuthData_in_out: LPDWORD): DWORD {
    return Rasapi32.Load('RasGetCustomAuthDataA')(pszPhonebook, pszEntry, pbCustomAuthData_out, pdwSizeofCustomAuthData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetcustomauthdataw
  public static RasGetCustomAuthDataW(pszPhonebook: OPTIONAL<LPCWSTR>, pszEntry: LPCWSTR, pbCustomAuthData_out: OPTIONAL<LPBYTE>, pdwSizeofCustomAuthData_in_out: LPDWORD): DWORD {
    return Rasapi32.Load('RasGetCustomAuthDataW')(pszPhonebook, pszEntry, pbCustomAuthData_out, pdwSizeofCustomAuthData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgeteapuserdataa
  public static RasGetEapUserDataA(hToken: OPTIONAL<HANDLE>, pszPhonebook: OPTIONAL<LPCSTR>, pszEntry: LPCSTR, pbEapData_out: OPTIONAL<LPBYTE>, pdwSizeofEapData_in_out: LPDWORD): DWORD {
    return Rasapi32.Load('RasGetEapUserDataA')(hToken, pszPhonebook, pszEntry, pbEapData_out, pdwSizeofEapData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgeteapuserdataw
  public static RasGetEapUserDataW(hToken: OPTIONAL<HANDLE>, pszPhonebook: OPTIONAL<LPCWSTR>, pszEntry: LPCWSTR, pbEapData_out: OPTIONAL<LPBYTE>, pdwSizeofEapData_in_out: LPDWORD): DWORD {
    return Rasapi32.Load('RasGetEapUserDataW')(hToken, pszPhonebook, pszEntry, pbEapData_out, pdwSizeofEapData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgeteapuseridentitya
  public static RasGetEapUserIdentityA(pszPhonebook: OPTIONAL<LPCSTR>, pszEntry: LPCSTR, dwFlags: DWORD, hwnd: HWND, ppRasEapUserIdentity_out: PLPRASEAPUSERIDENTITYA): DWORD {
    return Rasapi32.Load('RasGetEapUserIdentityA')(pszPhonebook, pszEntry, dwFlags, hwnd, ppRasEapUserIdentity_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgeteapuseridentityw
  public static RasGetEapUserIdentityW(pszPhonebook: OPTIONAL<LPCWSTR>, pszEntry: LPCWSTR, dwFlags: DWORD, hwnd: HWND, ppRasEapUserIdentity_out: PLPRASEAPUSERIDENTITYW): DWORD {
    return Rasapi32.Load('RasGetEapUserIdentityW')(pszPhonebook, pszEntry, dwFlags, hwnd, ppRasEapUserIdentity_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetentrydialparamsa
  public static RasGetEntryDialParamsA(lpszPhonebook: OPTIONAL<LPCSTR>, lpRasDialParams_in_out: LPRASDIALPARAMSA, lpfPassword_out: LPBOOL): DWORD {
    return Rasapi32.Load('RasGetEntryDialParamsA')(lpszPhonebook, lpRasDialParams_in_out, lpfPassword_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetentrydialparamsw
  public static RasGetEntryDialParamsW(lpszPhonebook: OPTIONAL<LPCWSTR>, lpRasDialParams_in_out: LPRASDIALPARAMSW, lpfPassword_out: LPBOOL): DWORD {
    return Rasapi32.Load('RasGetEntryDialParamsW')(lpszPhonebook, lpRasDialParams_in_out, lpfPassword_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetentrypropertiesa
  public static RasGetEntryPropertiesA(
    lpszPhonebook: OPTIONAL<LPCSTR>,
    lpszEntry: LPCSTR,
    lpRasEntry_in_out: OPTIONAL<LPRASENTRYA>,
    lpdwEntryInfoSize_in_out: LPDWORD,
    lpbDeviceInfo_out: OPTIONAL<LPBYTE>,
    lpdwDeviceInfoSize_in_out: OPTIONAL<LPDWORD>,
  ): DWORD {
    return Rasapi32.Load('RasGetEntryPropertiesA')(lpszPhonebook, lpszEntry, lpRasEntry_in_out, lpdwEntryInfoSize_in_out, lpbDeviceInfo_out, lpdwDeviceInfoSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetentrypropertiesw
  public static RasGetEntryPropertiesW(
    lpszPhonebook: OPTIONAL<LPCWSTR>,
    lpszEntry: LPCWSTR,
    lpRasEntry_in_out: OPTIONAL<LPRASENTRYW>,
    lpdwEntryInfoSize_in_out: LPDWORD,
    lpbDeviceInfo_out: OPTIONAL<LPBYTE>,
    lpdwDeviceInfoSize_in_out: OPTIONAL<LPDWORD>,
  ): DWORD {
    return Rasapi32.Load('RasGetEntryPropertiesW')(lpszPhonebook, lpszEntry, lpRasEntry_in_out, lpdwEntryInfoSize_in_out, lpbDeviceInfo_out, lpdwDeviceInfoSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgeterrorstringa
  public static RasGetErrorStringA(ResourceId: UINT, lpszString_out: LPSTR, InBufSize: DWORD): DWORD {
    return Rasapi32.Load('RasGetErrorStringA')(ResourceId, lpszString_out, InBufSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgeterrorstringw
  public static RasGetErrorStringW(ResourceId: UINT, lpszString_out: LPWSTR, InBufSize: DWORD): DWORD {
    return Rasapi32.Load('RasGetErrorStringW')(ResourceId, lpszString_out, InBufSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetlinkstatistics
  public static RasGetLinkStatistics(hRasConn: HRASCONN, dwSubEntry: DWORD, lpStatistics_in_out: LPRAS_STATS): DWORD {
    return Rasapi32.Load('RasGetLinkStatistics')(hRasConn, dwSubEntry, lpStatistics_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetnapstatus
  public static RasGetNapStatus(hRasconn: HRASCONN, pRasNapState_out: LPRASNAPSTATE): DWORD {
    return Rasapi32.Load('RasGetNapStatus')(hRasconn, pRasNapState_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetprojectioninfo
  public static RasGetProjectionInfoA(hrasconn: HRASCONN, rasprojection: RASPROJECTION, lpprojection_out: LPVOID, lpcb_in_out: LPDWORD): DWORD {
    return Rasapi32.Load('RasGetProjectionInfoA')(hrasconn, rasprojection, lpprojection_out, lpcb_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetprojectioninfoex
  public static RasGetProjectionInfoEx(hrasconn: HRASCONN, pRasProjection_in_out: OPTIONAL<PRAS_PROJECTION_INFO>, lpdwSize_in_out: LPDWORD): DWORD {
    return Rasapi32.Load('RasGetProjectionInfoEx')(hrasconn, pRasProjection_in_out, lpdwSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetprojectioninfo
  public static RasGetProjectionInfoW(hrasconn: HRASCONN, rasprojection: RASPROJECTION, lpprojection_out: LPVOID, lpcb_in_out: LPDWORD): DWORD {
    return Rasapi32.Load('RasGetProjectionInfoW')(hrasconn, rasprojection, lpprojection_out, lpcb_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetsubentryhandlea
  public static RasGetSubEntryHandleA(hrasconn: HRASCONN, dwSubEntry: DWORD, lphrasconn_out: LPHRASCONN): DWORD {
    return Rasapi32.Load('RasGetSubEntryHandleA')(hrasconn, dwSubEntry, lphrasconn_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetsubentryhandlew
  public static RasGetSubEntryHandleW(hrasconn: HRASCONN, dwSubEntry: DWORD, lphrasconn_out: LPHRASCONN): DWORD {
    return Rasapi32.Load('RasGetSubEntryHandleW')(hrasconn, dwSubEntry, lphrasconn_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetsubentrypropertiesa
  public static RasGetSubEntryPropertiesA(
    lpszPhonebook: OPTIONAL<LPCSTR>,
    lpszEntry: LPCSTR,
    dwSubEntry: DWORD,
    lpRasSubEntry_in_out: OPTIONAL<LPRASSUBENTRYA>,
    lpdwcb_in_out: OPTIONAL<LPDWORD>,
    lpbDeviceConfig_out: OPTIONAL<LPBYTE>,
    lpdwcbDeviceConfig_in_out: OPTIONAL<LPDWORD>,
  ): DWORD {
    return Rasapi32.Load('RasGetSubEntryPropertiesA')(lpszPhonebook, lpszEntry, dwSubEntry, lpRasSubEntry_in_out, lpdwcb_in_out, lpbDeviceConfig_out, lpdwcbDeviceConfig_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasgetsubentrypropertiesw
  public static RasGetSubEntryPropertiesW(
    lpszPhonebook: OPTIONAL<LPCWSTR>,
    lpszEntry: LPCWSTR,
    dwSubEntry: DWORD,
    lpRasSubEntry_in_out: OPTIONAL<LPRASSUBENTRYW>,
    lpdwcb_in_out: OPTIONAL<LPDWORD>,
    lpbDeviceConfig_out: OPTIONAL<LPBYTE>,
    lpdwcbDeviceConfig_in_out: OPTIONAL<LPDWORD>,
  ): DWORD {
    return Rasapi32.Load('RasGetSubEntryPropertiesW')(lpszPhonebook, lpszEntry, dwSubEntry, lpRasSubEntry_in_out, lpdwcb_in_out, lpbDeviceConfig_out, lpdwcbDeviceConfig_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rashangupa
  public static RasHangUpA(hrasconn: HRASCONN): DWORD {
    return Rasapi32.Load('RasHangUpA')(hrasconn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rashangupw
  public static RasHangUpW(hrasconn: HRASCONN): DWORD {
    return Rasapi32.Load('RasHangUpW')(hrasconn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasinvokeeapui
  public static RasInvokeEapUI(hrasconn: HRASCONN, dwSubEntry: DWORD, lpRasDialExtensions: LPRASDIALEXTENSIONS, hwnd: HWND): DWORD {
    return Rasapi32.Load('RasInvokeEapUI')(hrasconn, dwSubEntry, lpRasDialExtensions, hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasrenameentrya
  public static RasRenameEntryA(lpszPhonebook: OPTIONAL<LPCSTR>, lpszOldEntry: LPCSTR, lpszNewEntry: LPCSTR): DWORD {
    return Rasapi32.Load('RasRenameEntryA')(lpszPhonebook, lpszOldEntry, lpszNewEntry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasrenameentryw
  public static RasRenameEntryW(lpszPhonebook: OPTIONAL<LPCWSTR>, lpszOldEntry: LPCWSTR, lpszNewEntry: LPCWSTR): DWORD {
    return Rasapi32.Load('RasRenameEntryW')(lpszPhonebook, lpszOldEntry, lpszNewEntry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rassetautodialaddressa
  public static RasSetAutodialAddressA(lpszAddress: OPTIONAL<LPCSTR>, dwReserved: DWORD, lpAutoDialEntries: OPTIONAL<LPRASAUTODIALENTRYA>, dwcbAutoDialEntries: DWORD, dwcAutoDialEntries: DWORD): DWORD {
    return Rasapi32.Load('RasSetAutodialAddressA')(lpszAddress, dwReserved, lpAutoDialEntries, dwcbAutoDialEntries, dwcAutoDialEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rassetautodialaddressw
  public static RasSetAutodialAddressW(lpszAddress: OPTIONAL<LPCWSTR>, dwReserved: DWORD, lpAutoDialEntries: OPTIONAL<LPRASAUTODIALENTRYW>, dwcbAutoDialEntries: DWORD, dwcAutoDialEntries: DWORD): DWORD {
    return Rasapi32.Load('RasSetAutodialAddressW')(lpszAddress, dwReserved, lpAutoDialEntries, dwcbAutoDialEntries, dwcAutoDialEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rassetautodialenablea
  public static RasSetAutodialEnableA(dwDialingLocation: DWORD, fEnabled: BOOL): DWORD {
    return Rasapi32.Load('RasSetAutodialEnableA')(dwDialingLocation, fEnabled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rassetautodialenablew
  public static RasSetAutodialEnableW(dwDialingLocation: DWORD, fEnabled: BOOL): DWORD {
    return Rasapi32.Load('RasSetAutodialEnableW')(dwDialingLocation, fEnabled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rassetautodialparama
  public static RasSetAutodialParamA(dwKey: DWORD, lpvValue: LPVOID, dwcbValue: DWORD): DWORD {
    return Rasapi32.Load('RasSetAutodialParamA')(dwKey, lpvValue, dwcbValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rassetautodialparamw
  public static RasSetAutodialParamW(dwKey: DWORD, lpvValue: LPVOID, dwcbValue: DWORD): DWORD {
    return Rasapi32.Load('RasSetAutodialParamW')(dwKey, lpvValue, dwcbValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rassetcredentialsa
  public static RasSetCredentialsA(lpszPhonebook: OPTIONAL<LPCSTR>, lpszEntry: LPCSTR, lpCredentials: LPRASCREDENTIALSA, fClearCredentials: BOOL): DWORD {
    return Rasapi32.Load('RasSetCredentialsA')(lpszPhonebook, lpszEntry, lpCredentials, fClearCredentials);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rassetcredentialsw
  public static RasSetCredentialsW(lpszPhonebook: OPTIONAL<LPCWSTR>, lpszEntry: LPCWSTR, lpCredentials: LPRASCREDENTIALSW, fClearCredentials: BOOL): DWORD {
    return Rasapi32.Load('RasSetCredentialsW')(lpszPhonebook, lpszEntry, lpCredentials, fClearCredentials);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rassetcustomauthdataa
  public static RasSetCustomAuthDataA(pszPhonebook: OPTIONAL<LPCSTR>, pszEntry: LPCSTR, pbCustomAuthData: LPBYTE, dwSizeofCustomAuthData: DWORD): DWORD {
    return Rasapi32.Load('RasSetCustomAuthDataA')(pszPhonebook, pszEntry, pbCustomAuthData, dwSizeofCustomAuthData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rassetcustomauthdataw
  public static RasSetCustomAuthDataW(pszPhonebook: OPTIONAL<LPCWSTR>, pszEntry: LPCWSTR, pbCustomAuthData: LPBYTE, dwSizeofCustomAuthData: DWORD): DWORD {
    return Rasapi32.Load('RasSetCustomAuthDataW')(pszPhonebook, pszEntry, pbCustomAuthData, dwSizeofCustomAuthData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasseteapuserdataa
  public static RasSetEapUserDataA(hToken: OPTIONAL<HANDLE>, pszPhonebook: OPTIONAL<LPCSTR>, pszEntry: LPCSTR, pbEapData: LPBYTE, dwSizeofEapData: DWORD): DWORD {
    return Rasapi32.Load('RasSetEapUserDataA')(hToken, pszPhonebook, pszEntry, pbEapData, dwSizeofEapData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasseteapuserdataw
  public static RasSetEapUserDataW(hToken: OPTIONAL<HANDLE>, pszPhonebook: OPTIONAL<LPCWSTR>, pszEntry: LPCWSTR, pbEapData: LPBYTE, dwSizeofEapData: DWORD): DWORD {
    return Rasapi32.Load('RasSetEapUserDataW')(hToken, pszPhonebook, pszEntry, pbEapData, dwSizeofEapData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rassetentrydialparamsa
  public static RasSetEntryDialParamsA(lpszPhonebook: OPTIONAL<LPCSTR>, lpRasDialParams: LPRASDIALPARAMSA, fRemovePassword: BOOL): DWORD {
    return Rasapi32.Load('RasSetEntryDialParamsA')(lpszPhonebook, lpRasDialParams, fRemovePassword);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rassetentrydialparamsw
  public static RasSetEntryDialParamsW(lpszPhonebook: OPTIONAL<LPCWSTR>, lpRasDialParams: LPRASDIALPARAMSW, fRemovePassword: BOOL): DWORD {
    return Rasapi32.Load('RasSetEntryDialParamsW')(lpszPhonebook, lpRasDialParams, fRemovePassword);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rassetentrypropertiesa
  public static RasSetEntryPropertiesA(lpszPhonebook: OPTIONAL<LPCSTR>, lpszEntry: LPCSTR, lpRasEntry: LPRASENTRYA, dwEntryInfoSize: DWORD, lpbDeviceInfo: OPTIONAL<LPBYTE>, dwDeviceInfoSize: DWORD): DWORD {
    return Rasapi32.Load('RasSetEntryPropertiesA')(lpszPhonebook, lpszEntry, lpRasEntry, dwEntryInfoSize, lpbDeviceInfo, dwDeviceInfoSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rassetentrypropertiesw
  public static RasSetEntryPropertiesW(lpszPhonebook: OPTIONAL<LPCWSTR>, lpszEntry: LPCWSTR, lpRasEntry: LPRASENTRYW, dwEntryInfoSize: DWORD, lpbDeviceInfo: OPTIONAL<LPBYTE>, dwDeviceInfoSize: DWORD): DWORD {
    return Rasapi32.Load('RasSetEntryPropertiesW')(lpszPhonebook, lpszEntry, lpRasEntry, dwEntryInfoSize, lpbDeviceInfo, dwDeviceInfoSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rassetsubentrypropertiesa
  public static RasSetSubEntryPropertiesA(lpszPhonebook: OPTIONAL<LPCSTR>, lpszEntry: LPCSTR, dwSubEntry: DWORD, lpRasSubEntry: LPRASSUBENTRYA, dwcbRasSubEntry: DWORD, lpbDeviceConfig: OPTIONAL<LPBYTE>, dwcbDeviceConfig: DWORD): DWORD {
    return Rasapi32.Load('RasSetSubEntryPropertiesA')(lpszPhonebook, lpszEntry, dwSubEntry, lpRasSubEntry, dwcbRasSubEntry, lpbDeviceConfig, dwcbDeviceConfig);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rassetsubentrypropertiesw
  public static RasSetSubEntryPropertiesW(lpszPhonebook: OPTIONAL<LPCWSTR>, lpszEntry: LPCWSTR, dwSubEntry: DWORD, lpRasSubEntry: LPRASSUBENTRYW, dwcbRasSubEntry: DWORD, lpbDeviceConfig: OPTIONAL<LPBYTE>, dwcbDeviceConfig: DWORD): DWORD {
    return Rasapi32.Load('RasSetSubEntryPropertiesW')(lpszPhonebook, lpszEntry, dwSubEntry, lpRasSubEntry, dwcbRasSubEntry, lpbDeviceConfig, dwcbDeviceConfig);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasupdateconnection
  public static RasUpdateConnection(hrasconn: HRASCONN, lprasupdateconn: LPRASUPDATECONN): DWORD {
    return Rasapi32.Load('RasUpdateConnection')(hrasconn, lprasupdateconn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasvalidateentrynamea
  public static RasValidateEntryNameA(lpszPhonebook: OPTIONAL<LPCSTR>, lpszEntry: LPCSTR): DWORD {
    return Rasapi32.Load('RasValidateEntryNameA')(lpszPhonebook, lpszEntry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ras/nf-ras-rasvalidateentrynamew
  public static RasValidateEntryNameW(lpszPhonebook: OPTIONAL<LPCWSTR>, lpszEntry: LPCWSTR): DWORD {
    return Rasapi32.Load('RasValidateEntryNameW')(lpszPhonebook, lpszEntry);
  }
}

export default Rasapi32;
