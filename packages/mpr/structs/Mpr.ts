import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  DWORD,
  HANDLE,
  HWND,
  LPCONNECTDLGSTRUCTW,
  LPCWSTR,
  LPDISCDLGSTRUCTW,
  LPDWORD,
  LPHANDLE,
  LPLPWSTR,
  LPNETCONNECTINFOSTRUCT,
  LPNETINFOSTRUCT,
  LPNETRESOURCEW,
  LPVOID,
  LPWSTR,
  NULL,
  PBYTE,
  PVOID,
} from '../types/Mpr';

class Mpr extends Win32 {
  protected static override name = 'mpr.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    MultinetGetConnectionPerformanceW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WNetAddConnection2W: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    WNetAddConnection3W: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    WNetAddConnection4W: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    WNetAddConnectionW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WNetCancelConnection2W: { args: [FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.u32 },
    WNetCancelConnectionW: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    WNetCloseEnum: { args: [FFIType.u64], returns: FFIType.u32 },
    WNetConnectionDialog: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    WNetConnectionDialog1W: { args: [FFIType.ptr], returns: FFIType.u32 },
    WNetDisconnectDialog: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    WNetDisconnectDialog1W: { args: [FFIType.ptr], returns: FFIType.u32 },
    WNetEnumResourceW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WNetGetConnectionW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WNetGetLastErrorW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    WNetGetNetworkInformationW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WNetGetProviderNameW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WNetGetResourceInformationW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WNetGetResourceParentW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WNetGetUniversalNameW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WNetGetUserW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WNetOpenEnumW: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WNetRestoreSingleConnectionW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    WNetUseConnection4W: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WNetUseConnectionW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-multinetgetconnectionperformancew
  public static MultinetGetConnectionPerformanceW(lpNetResource: LPNETRESOURCEW, lpNetConnectInfoStruct: LPNETCONNECTINFOSTRUCT): DWORD {
    return Mpr.Load('MultinetGetConnectionPerformanceW')(lpNetResource, lpNetConnectInfoStruct);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetaddconnection2w
  public static WNetAddConnection2W(lpNetResource: LPNETRESOURCEW, lpPassword: LPCWSTR | NULL, lpUserName: LPCWSTR | NULL, dwFlags: DWORD): DWORD {
    return Mpr.Load('WNetAddConnection2W')(lpNetResource, lpPassword, lpUserName, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetaddconnection3w
  public static WNetAddConnection3W(hwndOwner: HWND | 0n, lpNetResource: LPNETRESOURCEW, lpPassword: LPCWSTR | NULL, lpUserName: LPCWSTR | NULL, dwFlags: DWORD): DWORD {
    return Mpr.Load('WNetAddConnection3W')(hwndOwner, lpNetResource, lpPassword, lpUserName, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetaddconnection4w
  public static WNetAddConnection4W(hwndOwner: HWND | 0n, lpNetResource: LPNETRESOURCEW, pAuthBuffer: PVOID, cbAuthBuffer: DWORD, dwFlags: DWORD, lpUseOptions: PBYTE, cbUseOptions: DWORD): DWORD {
    return Mpr.Load('WNetAddConnection4W')(hwndOwner, lpNetResource, pAuthBuffer, cbAuthBuffer, dwFlags, lpUseOptions, cbUseOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetaddconnectionw
  public static WNetAddConnectionW(lpRemoteName: LPCWSTR, lpPassword: LPCWSTR | NULL, lpLocalName: LPCWSTR | NULL): DWORD {
    return Mpr.Load('WNetAddConnectionW')(lpRemoteName, lpPassword, lpLocalName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetcancelconnection2w
  public static WNetCancelConnection2W(lpName: LPCWSTR, dwFlags: DWORD, fForce: BOOL): DWORD {
    return Mpr.Load('WNetCancelConnection2W')(lpName, dwFlags, fForce);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetcancelconnectionw
  public static WNetCancelConnectionW(lpName: LPCWSTR, fForce: BOOL): DWORD {
    return Mpr.Load('WNetCancelConnectionW')(lpName, fForce);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetcloseenum
  public static WNetCloseEnum(hEnum: HANDLE): DWORD {
    return Mpr.Load('WNetCloseEnum')(hEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetconnectiondialog
  public static WNetConnectionDialog(hwnd: HWND, dwType: DWORD): DWORD {
    return Mpr.Load('WNetConnectionDialog')(hwnd, dwType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetconnectiondialog1w
  public static WNetConnectionDialog1W(lpConnDlgStruct: LPCONNECTDLGSTRUCTW): DWORD {
    return Mpr.Load('WNetConnectionDialog1W')(lpConnDlgStruct);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetdisconnectdialog
  public static WNetDisconnectDialog(hwnd: HWND | 0n, dwType: DWORD): DWORD {
    return Mpr.Load('WNetDisconnectDialog')(hwnd, dwType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetdisconnectdialog1w
  public static WNetDisconnectDialog1W(lpConnDlgStruct: LPDISCDLGSTRUCTW): DWORD {
    return Mpr.Load('WNetDisconnectDialog1W')(lpConnDlgStruct);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetenumresourcew
  public static WNetEnumResourceW(hEnum: HANDLE, lpcCount: LPDWORD, lpBuffer: LPVOID, lpBufferSize: LPDWORD): DWORD {
    return Mpr.Load('WNetEnumResourceW')(hEnum, lpcCount, lpBuffer, lpBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetgetconnectionw
  public static WNetGetConnectionW(lpLocalName: LPCWSTR, lpRemoteName: LPWSTR | NULL, lpnLength: LPDWORD): DWORD {
    return Mpr.Load('WNetGetConnectionW')(lpLocalName, lpRemoteName, lpnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetgetlasterrorw
  public static WNetGetLastErrorW(lpError: LPDWORD, lpErrorBuf: LPWSTR, nErrorBufSize: DWORD, lpNameBuf: LPWSTR, nNameBufSize: DWORD): DWORD {
    return Mpr.Load('WNetGetLastErrorW')(lpError, lpErrorBuf, nErrorBufSize, lpNameBuf, nNameBufSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetgetnetworkinformationw
  public static WNetGetNetworkInformationW(lpProvider: LPCWSTR, lpNetInfoStruct: LPNETINFOSTRUCT): DWORD {
    return Mpr.Load('WNetGetNetworkInformationW')(lpProvider, lpNetInfoStruct);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetgetprovidernamew
  public static WNetGetProviderNameW(dwNetType: DWORD, lpProviderName: LPWSTR, lpBufferSize: LPDWORD): DWORD {
    return Mpr.Load('WNetGetProviderNameW')(dwNetType, lpProviderName, lpBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetgetresourceinformationw
  public static WNetGetResourceInformationW(lpNetResource: LPNETRESOURCEW, lpBuffer: LPVOID, lpcbBuffer: LPDWORD, lplpSystem: LPLPWSTR): DWORD {
    return Mpr.Load('WNetGetResourceInformationW')(lpNetResource, lpBuffer, lpcbBuffer, lplpSystem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetgetresourceparentw
  public static WNetGetResourceParentW(lpNetResource: LPNETRESOURCEW, lpBuffer: LPVOID, lpcbBuffer: LPDWORD): DWORD {
    return Mpr.Load('WNetGetResourceParentW')(lpNetResource, lpBuffer, lpcbBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetgetuniversalnamew
  public static WNetGetUniversalNameW(lpLocalPath: LPCWSTR, dwInfoLevel: DWORD, lpBuffer: LPVOID, lpBufferSize: LPDWORD): DWORD {
    return Mpr.Load('WNetGetUniversalNameW')(lpLocalPath, dwInfoLevel, lpBuffer, lpBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetgetuserw
  public static WNetGetUserW(lpName: LPCWSTR | NULL, lpUserName: LPWSTR, lpnLength: LPDWORD): DWORD {
    return Mpr.Load('WNetGetUserW')(lpName, lpUserName, lpnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetopenenumw
  public static WNetOpenEnumW(dwScope: DWORD, dwType: DWORD, dwUsage: DWORD, lpNetResource: LPNETRESOURCEW | NULL, lphEnum: LPHANDLE): DWORD {
    return Mpr.Load('WNetOpenEnumW')(dwScope, dwType, dwUsage, lpNetResource, lphEnum);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetrestoresingleconnectionw
  public static WNetRestoreSingleConnectionW(hwndParent: HWND | 0n, lpDevice: LPCWSTR, fUseUI: BOOL): DWORD {
    return Mpr.Load('WNetRestoreSingleConnectionW')(hwndParent, lpDevice, fUseUI);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetuseconnection4w
  public static WNetUseConnection4W(hwndOwner: HWND | 0n, lpNetResource: LPNETRESOURCEW, pAuthBuffer: PVOID | NULL, cbAuthBuffer: DWORD, dwFlags: DWORD, lpUseOptions: PBYTE | NULL, cbUseOptions: DWORD, lpAccessName: LPWSTR | NULL, lpBufferSize: LPDWORD | NULL, lpResult: LPDWORD | NULL): DWORD {
    return Mpr.Load('WNetUseConnection4W')(hwndOwner, lpNetResource, pAuthBuffer, cbAuthBuffer, dwFlags, lpUseOptions, cbUseOptions, lpAccessName, lpBufferSize, lpResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnetwk/nf-winnetwk-wnetuseconnectionw
  public static WNetUseConnectionW(hwndOwner: HWND | 0n, lpNetResource: LPNETRESOURCEW, lpPassword: LPCWSTR | NULL, lpUserId: LPCWSTR | NULL, dwFlags: DWORD, lpAccessName: LPWSTR | NULL, lpBufferSize: LPDWORD | NULL, lpResult: LPDWORD | NULL): DWORD {
    return Mpr.Load('WNetUseConnectionW')(hwndOwner, lpNetResource, lpPassword, lpUserId, dwFlags, lpAccessName, lpBufferSize, lpResult);
  }
}

export default Mpr;
