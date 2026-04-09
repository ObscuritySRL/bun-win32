import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  BYTE,
  DWORD,
  HANDLE,
  HRESULT,
  HWND,
  LPDWORD,
  LPSTR,
  LPWSTR,
  NULL,
  PBOOL,
  PBYTE,
  PCHAR,
  PHANDLE,
  PSECURITY_DESCRIPTOR,
  PULONG,
  PVOID,
  PWTSLISTENERCONFIGA,
  PWTSLISTENERCONFIGW,
  PWTSLISTENERNAMEA,
  PWTSLISTENERNAMEW,
  SECURITY_INFORMATION,
  ULONG,
  USHORT,
  WTS_CONFIG_CLASS,
  WTS_INFO_CLASS,
  WTS_TYPE_CLASS,
  WTS_VIRTUAL_CLASS,
} from '../types/Wtsapi32';

/**
 * Thin, lazy-loaded FFI bindings for `wtsapi32.dll`.
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
 * import Wtsapi32 from './structs/Wtsapi32';
 *
 * // Lazy: bind on first call
 * const result = Wtsapi32.WTSEnumerateSessionsW(0n, 0, 1, ppSessionInfo.ptr, pCount.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Wtsapi32.Preload(['WTSEnumerateSessionsW', 'WTSFreeMemory']);
 * ```
 */
class Wtsapi32 extends Win32 {
  protected static override name = 'wtsapi32.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    WTSCloseServer: { args: [FFIType.u64], returns: FFIType.void },
    WTSConnectSessionA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    WTSConnectSessionW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    WTSCreateListenerA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WTSCreateListenerW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WTSDisconnectSession: { args: [FFIType.u64, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    WTSEnableChildSessions: { args: [FFIType.i32], returns: FFIType.i32 },
    WTSEnumerateListenersA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WTSEnumerateListenersW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WTSEnumerateProcessesA: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WTSEnumerateProcessesExA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WTSEnumerateProcessesExW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WTSEnumerateProcessesW: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WTSEnumerateServersA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WTSEnumerateServersW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WTSEnumerateSessionsA: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WTSEnumerateSessionsExA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WTSEnumerateSessionsExW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WTSEnumerateSessionsW: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WTSFreeMemory: { args: [FFIType.ptr], returns: FFIType.void },
    WTSFreeMemoryExA: { args: [FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WTSFreeMemoryExW: { args: [FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WTSGetChildSessionId: { args: [FFIType.ptr], returns: FFIType.i32 },
    WTSGetListenerSecurityA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WTSGetListenerSecurityW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WTSIsChildSessionsEnabled: { args: [FFIType.ptr], returns: FFIType.i32 },
    WTSLogoffSession: { args: [FFIType.u64, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    WTSOpenServerA: { args: [FFIType.ptr], returns: FFIType.u64 },
    WTSOpenServerExA: { args: [FFIType.ptr], returns: FFIType.u64 },
    WTSOpenServerExW: { args: [FFIType.ptr], returns: FFIType.u64 },
    WTSOpenServerW: { args: [FFIType.ptr], returns: FFIType.u64 },
    WTSQueryListenerConfigA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WTSQueryListenerConfigW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WTSQuerySessionInformationA: { args: [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WTSQuerySessionInformationW: { args: [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WTSQueryUserConfigA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WTSQueryUserConfigW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WTSQueryUserToken: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WTSRegisterSessionNotification: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    WTSRegisterSessionNotificationEx: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    WTSSendMessageA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    WTSSendMessageW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    WTSSetListenerSecurityA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WTSSetListenerSecurityW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WTSSetRenderHint: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WTSSetSessionInformationA: { args: [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WTSSetSessionInformationW: { args: [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WTSSetUserConfigA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WTSSetUserConfigW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WTSShutdownSystem: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    WTSStartRemoteControlSessionA: { args: [FFIType.ptr, FFIType.u32, FFIType.u8, FFIType.u16], returns: FFIType.i32 },
    WTSStartRemoteControlSessionW: { args: [FFIType.ptr, FFIType.u32, FFIType.u8, FFIType.u16], returns: FFIType.i32 },
    WTSStopRemoteControlSession: { args: [FFIType.u32], returns: FFIType.i32 },
    WTSTerminateProcess: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    WTSUnRegisterSessionNotification: { args: [FFIType.u64], returns: FFIType.i32 },
    WTSUnRegisterSessionNotificationEx: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    WTSVirtualChannelClose: { args: [FFIType.u64], returns: FFIType.i32 },
    WTSVirtualChannelOpen: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    WTSVirtualChannelOpenEx: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    WTSVirtualChannelPurgeInput: { args: [FFIType.u64], returns: FFIType.i32 },
    WTSVirtualChannelPurgeOutput: { args: [FFIType.u64], returns: FFIType.i32 },
    WTSVirtualChannelQuery: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WTSVirtualChannelRead: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WTSVirtualChannelWrite: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WTSWaitSystemEvent: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtscloseserver
  public static WTSCloseServer(hServer: HANDLE): void {
    return Wtsapi32.Load('WTSCloseServer')(hServer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsconnectsessiona
  public static WTSConnectSessionA(LogonId: ULONG, TargetLogonId: ULONG, pPassword: LPSTR, bWait: BOOL): BOOL {
    return Wtsapi32.Load('WTSConnectSessionA')(LogonId, TargetLogonId, pPassword, bWait);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsconnectsessionw
  public static WTSConnectSessionW(LogonId: ULONG, TargetLogonId: ULONG, pPassword: LPWSTR, bWait: BOOL): BOOL {
    return Wtsapi32.Load('WTSConnectSessionW')(LogonId, TargetLogonId, pPassword, bWait);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtscreatelistenera
  public static WTSCreateListenerA(hServer: HANDLE, pReserved: PVOID | NULL, Reserved: DWORD, pListenerName: LPSTR, pBuffer: PWTSLISTENERCONFIGA, flag: DWORD): BOOL {
    return Wtsapi32.Load('WTSCreateListenerA')(hServer, pReserved, Reserved, pListenerName, pBuffer, flag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtscreatelistenerw
  public static WTSCreateListenerW(hServer: HANDLE, pReserved: PVOID | NULL, Reserved: DWORD, pListenerName: LPWSTR, pBuffer: PWTSLISTENERCONFIGW, flag: DWORD): BOOL {
    return Wtsapi32.Load('WTSCreateListenerW')(hServer, pReserved, Reserved, pListenerName, pBuffer, flag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsdisconnectsession
  public static WTSDisconnectSession(hServer: HANDLE, SessionId: DWORD, bWait: BOOL): BOOL {
    return Wtsapi32.Load('WTSDisconnectSession')(hServer, SessionId, bWait);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsenablechildsessions
  public static WTSEnableChildSessions(bEnable: BOOL): BOOL {
    return Wtsapi32.Load('WTSEnableChildSessions')(bEnable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsenumeratelistenersa
  public static WTSEnumerateListenersA(hServer: HANDLE, pReserved: PVOID | NULL, Reserved: DWORD, pListeners: PWTSLISTENERNAMEA | NULL, pCount: LPDWORD): BOOL {
    return Wtsapi32.Load('WTSEnumerateListenersA')(hServer, pReserved, Reserved, pListeners, pCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsenumeratelistenersw
  public static WTSEnumerateListenersW(hServer: HANDLE, pReserved: PVOID | NULL, Reserved: DWORD, pListeners: PWTSLISTENERNAMEW | NULL, pCount: LPDWORD): BOOL {
    return Wtsapi32.Load('WTSEnumerateListenersW')(hServer, pReserved, Reserved, pListeners, pCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsenumerateprocessesa
  public static WTSEnumerateProcessesA(hServer: HANDLE, Reserved: DWORD, Version: DWORD, ppProcessInfo: PVOID, pCount: LPDWORD): BOOL {
    return Wtsapi32.Load('WTSEnumerateProcessesA')(hServer, Reserved, Version, ppProcessInfo, pCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsenumerateprocessesexa
  public static WTSEnumerateProcessesExA(hServer: HANDLE, pLevel: LPDWORD, SessionId: DWORD, ppProcessInfo: PVOID, pCount: LPDWORD): BOOL {
    return Wtsapi32.Load('WTSEnumerateProcessesExA')(hServer, pLevel, SessionId, ppProcessInfo, pCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsenumerateprocessesexw
  public static WTSEnumerateProcessesExW(hServer: HANDLE, pLevel: LPDWORD, SessionId: DWORD, ppProcessInfo: PVOID, pCount: LPDWORD): BOOL {
    return Wtsapi32.Load('WTSEnumerateProcessesExW')(hServer, pLevel, SessionId, ppProcessInfo, pCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsenumerateprocessesw
  public static WTSEnumerateProcessesW(hServer: HANDLE, Reserved: DWORD, Version: DWORD, ppProcessInfo: PVOID, pCount: LPDWORD): BOOL {
    return Wtsapi32.Load('WTSEnumerateProcessesW')(hServer, Reserved, Version, ppProcessInfo, pCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsenumerateserversa
  public static WTSEnumerateServersA(pDomainName: LPSTR | NULL, Reserved: DWORD, Version: DWORD, ppServerInfo: PVOID, pCount: LPDWORD): BOOL {
    return Wtsapi32.Load('WTSEnumerateServersA')(pDomainName, Reserved, Version, ppServerInfo, pCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsenumerateserversw
  public static WTSEnumerateServersW(pDomainName: LPWSTR | NULL, Reserved: DWORD, Version: DWORD, ppServerInfo: PVOID, pCount: LPDWORD): BOOL {
    return Wtsapi32.Load('WTSEnumerateServersW')(pDomainName, Reserved, Version, ppServerInfo, pCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsenumeratesessionsa
  public static WTSEnumerateSessionsA(hServer: HANDLE, Reserved: DWORD, Version: DWORD, ppSessionInfo: PVOID, pCount: LPDWORD): BOOL {
    return Wtsapi32.Load('WTSEnumerateSessionsA')(hServer, Reserved, Version, ppSessionInfo, pCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsenumeratesessionsexa
  public static WTSEnumerateSessionsExA(hServer: HANDLE, pLevel: LPDWORD, Filter: DWORD, ppSessionInfo: PVOID, pCount: LPDWORD): BOOL {
    return Wtsapi32.Load('WTSEnumerateSessionsExA')(hServer, pLevel, Filter, ppSessionInfo, pCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsenumeratesessionsexw
  public static WTSEnumerateSessionsExW(hServer: HANDLE, pLevel: LPDWORD, Filter: DWORD, ppSessionInfo: PVOID, pCount: LPDWORD): BOOL {
    return Wtsapi32.Load('WTSEnumerateSessionsExW')(hServer, pLevel, Filter, ppSessionInfo, pCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsenumeratesessionsw
  public static WTSEnumerateSessionsW(hServer: HANDLE, Reserved: DWORD, Version: DWORD, ppSessionInfo: PVOID, pCount: LPDWORD): BOOL {
    return Wtsapi32.Load('WTSEnumerateSessionsW')(hServer, Reserved, Version, ppSessionInfo, pCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsfreememory
  public static WTSFreeMemory(pMemory: PVOID): void {
    return Wtsapi32.Load('WTSFreeMemory')(pMemory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsfreememoryexa
  public static WTSFreeMemoryExA(WTSTypeClass: WTS_TYPE_CLASS, pMemory: PVOID, NumberOfEntries: ULONG): BOOL {
    return Wtsapi32.Load('WTSFreeMemoryExA')(WTSTypeClass, pMemory, NumberOfEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsfreememoryexw
  public static WTSFreeMemoryExW(WTSTypeClass: WTS_TYPE_CLASS, pMemory: PVOID, NumberOfEntries: ULONG): BOOL {
    return Wtsapi32.Load('WTSFreeMemoryExW')(WTSTypeClass, pMemory, NumberOfEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsgetchildsessionid
  public static WTSGetChildSessionId(pSessionId: PULONG): BOOL {
    return Wtsapi32.Load('WTSGetChildSessionId')(pSessionId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsgetlistenersecuritya
  public static WTSGetListenerSecurityA(
    hServer: HANDLE,
    pReserved: PVOID | NULL,
    Reserved: DWORD,
    pListenerName: LPSTR,
    SecurityInformation: SECURITY_INFORMATION,
    pSecurityDescriptor: PSECURITY_DESCRIPTOR | NULL,
    nLength: DWORD,
    lpnLengthNeeded: LPDWORD,
  ): BOOL {
    return Wtsapi32.Load('WTSGetListenerSecurityA')(hServer, pReserved, Reserved, pListenerName, SecurityInformation, pSecurityDescriptor, nLength, lpnLengthNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsgetlistenersecurityw
  public static WTSGetListenerSecurityW(
    hServer: HANDLE,
    pReserved: PVOID | NULL,
    Reserved: DWORD,
    pListenerName: LPWSTR,
    SecurityInformation: SECURITY_INFORMATION,
    pSecurityDescriptor: PSECURITY_DESCRIPTOR | NULL,
    nLength: DWORD,
    lpnLengthNeeded: LPDWORD,
  ): BOOL {
    return Wtsapi32.Load('WTSGetListenerSecurityW')(hServer, pReserved, Reserved, pListenerName, SecurityInformation, pSecurityDescriptor, nLength, lpnLengthNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsischildsessionsenabled
  public static WTSIsChildSessionsEnabled(pbEnabled: PBOOL): BOOL {
    return Wtsapi32.Load('WTSIsChildSessionsEnabled')(pbEnabled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtslogoffsession
  public static WTSLogoffSession(hServer: HANDLE, SessionId: DWORD, bWait: BOOL): BOOL {
    return Wtsapi32.Load('WTSLogoffSession')(hServer, SessionId, bWait);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsopenservera
  public static WTSOpenServerA(pServerName: LPSTR): HANDLE {
    return Wtsapi32.Load('WTSOpenServerA')(pServerName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsopenserverexa
  public static WTSOpenServerExA(pServerName: LPSTR): HANDLE {
    return Wtsapi32.Load('WTSOpenServerExA')(pServerName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsopenserverexw
  public static WTSOpenServerExW(pServerName: LPWSTR): HANDLE {
    return Wtsapi32.Load('WTSOpenServerExW')(pServerName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsopenserverw
  public static WTSOpenServerW(pServerName: LPWSTR): HANDLE {
    return Wtsapi32.Load('WTSOpenServerW')(pServerName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsquerylistenerconfiga
  public static WTSQueryListenerConfigA(hServer: HANDLE, pReserved: PVOID | NULL, Reserved: DWORD, pListenerName: LPSTR, pBuffer: PWTSLISTENERCONFIGA): BOOL {
    return Wtsapi32.Load('WTSQueryListenerConfigA')(hServer, pReserved, Reserved, pListenerName, pBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsquerylistenerconfigw
  public static WTSQueryListenerConfigW(hServer: HANDLE, pReserved: PVOID | NULL, Reserved: DWORD, pListenerName: LPWSTR, pBuffer: PWTSLISTENERCONFIGW): BOOL {
    return Wtsapi32.Load('WTSQueryListenerConfigW')(hServer, pReserved, Reserved, pListenerName, pBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsquerysessioninformationa
  public static WTSQuerySessionInformationA(hServer: HANDLE, SessionId: DWORD, WTSInfoClass: WTS_INFO_CLASS, ppBuffer: PVOID, pBytesReturned: LPDWORD): BOOL {
    return Wtsapi32.Load('WTSQuerySessionInformationA')(hServer, SessionId, WTSInfoClass, ppBuffer, pBytesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsquerysessioninformationw
  public static WTSQuerySessionInformationW(hServer: HANDLE, SessionId: DWORD, WTSInfoClass: WTS_INFO_CLASS, ppBuffer: PVOID, pBytesReturned: LPDWORD): BOOL {
    return Wtsapi32.Load('WTSQuerySessionInformationW')(hServer, SessionId, WTSInfoClass, ppBuffer, pBytesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsqueryuserconfiga
  public static WTSQueryUserConfigA(pServerName: LPSTR, pUserName: LPSTR, WTSConfigClass: WTS_CONFIG_CLASS, ppBuffer: PVOID, pBytesReturned: LPDWORD): BOOL {
    return Wtsapi32.Load('WTSQueryUserConfigA')(pServerName, pUserName, WTSConfigClass, ppBuffer, pBytesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsqueryuserconfigw
  public static WTSQueryUserConfigW(pServerName: LPWSTR, pUserName: LPWSTR, WTSConfigClass: WTS_CONFIG_CLASS, ppBuffer: PVOID, pBytesReturned: LPDWORD): BOOL {
    return Wtsapi32.Load('WTSQueryUserConfigW')(pServerName, pUserName, WTSConfigClass, ppBuffer, pBytesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsqueryusertoken
  public static WTSQueryUserToken(SessionId: ULONG, phToken: PHANDLE): BOOL {
    return Wtsapi32.Load('WTSQueryUserToken')(SessionId, phToken);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsregistersessionnotification
  public static WTSRegisterSessionNotification(hWnd: HWND, dwFlags: DWORD): BOOL {
    return Wtsapi32.Load('WTSRegisterSessionNotification')(hWnd, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsregistersessionnotificationex
  public static WTSRegisterSessionNotificationEx(hServer: HANDLE, hWnd: HWND, dwFlags: DWORD): BOOL {
    return Wtsapi32.Load('WTSRegisterSessionNotificationEx')(hServer, hWnd, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtssendmessagea
  public static WTSSendMessageA(hServer: HANDLE, SessionId: DWORD, pTitle: LPSTR, TitleLength: DWORD, pMessage: LPSTR, MessageLength: DWORD, Style: DWORD, Timeout: DWORD, pResponse: LPDWORD, bWait: BOOL): BOOL {
    return Wtsapi32.Load('WTSSendMessageA')(hServer, SessionId, pTitle, TitleLength, pMessage, MessageLength, Style, Timeout, pResponse, bWait);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtssendmessagew
  public static WTSSendMessageW(hServer: HANDLE, SessionId: DWORD, pTitle: LPWSTR, TitleLength: DWORD, pMessage: LPWSTR, MessageLength: DWORD, Style: DWORD, Timeout: DWORD, pResponse: LPDWORD, bWait: BOOL): BOOL {
    return Wtsapi32.Load('WTSSendMessageW')(hServer, SessionId, pTitle, TitleLength, pMessage, MessageLength, Style, Timeout, pResponse, bWait);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtssetlistenersecuritya
  public static WTSSetListenerSecurityA(hServer: HANDLE, pReserved: PVOID | NULL, Reserved: DWORD, pListenerName: LPSTR, SecurityInformation: SECURITY_INFORMATION, pSecurityDescriptor: PSECURITY_DESCRIPTOR): BOOL {
    return Wtsapi32.Load('WTSSetListenerSecurityA')(hServer, pReserved, Reserved, pListenerName, SecurityInformation, pSecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtssetlistenersecurityw
  public static WTSSetListenerSecurityW(hServer: HANDLE, pReserved: PVOID | NULL, Reserved: DWORD, pListenerName: LPWSTR, SecurityInformation: SECURITY_INFORMATION, pSecurityDescriptor: PSECURITY_DESCRIPTOR): BOOL {
    return Wtsapi32.Load('WTSSetListenerSecurityW')(hServer, pReserved, Reserved, pListenerName, SecurityInformation, pSecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtshintapi/nf-wtshintapi-wtssetrenderhint
  public static WTSSetRenderHint(pRenderHintID: PVOID, hwndOwner: HWND, renderHintType: DWORD, cbHintDataLength: DWORD, pHintData: PBYTE | NULL): HRESULT {
    return Wtsapi32.Load('WTSSetRenderHint')(pRenderHintID, hwndOwner, renderHintType, cbHintDataLength, pHintData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtssetsessioninformationa
  public static WTSSetSessionInformationA(hServer: HANDLE, SessionId: DWORD, WTSInfoClass: WTS_INFO_CLASS, pBuffer: LPSTR, DataLength: DWORD): BOOL {
    return Wtsapi32.Load('WTSSetSessionInformationA')(hServer, SessionId, WTSInfoClass, pBuffer, DataLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtssetsessioninformationw
  public static WTSSetSessionInformationW(hServer: HANDLE, SessionId: DWORD, WTSInfoClass: WTS_INFO_CLASS, pBuffer: LPWSTR, DataLength: DWORD): BOOL {
    return Wtsapi32.Load('WTSSetSessionInformationW')(hServer, SessionId, WTSInfoClass, pBuffer, DataLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtssetuserconfiga
  public static WTSSetUserConfigA(pServerName: LPSTR, pUserName: LPSTR, WTSConfigClass: WTS_CONFIG_CLASS, pBuffer: LPSTR, DataLength: DWORD): BOOL {
    return Wtsapi32.Load('WTSSetUserConfigA')(pServerName, pUserName, WTSConfigClass, pBuffer, DataLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtssetuserconfigw
  public static WTSSetUserConfigW(pServerName: LPWSTR, pUserName: LPWSTR, WTSConfigClass: WTS_CONFIG_CLASS, pBuffer: LPWSTR, DataLength: DWORD): BOOL {
    return Wtsapi32.Load('WTSSetUserConfigW')(pServerName, pUserName, WTSConfigClass, pBuffer, DataLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsshutdownsystem
  public static WTSShutdownSystem(hServer: HANDLE, ShutdownFlag: DWORD): BOOL {
    return Wtsapi32.Load('WTSShutdownSystem')(hServer, ShutdownFlag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsstartremotecontrolsessiona
  public static WTSStartRemoteControlSessionA(pTargetServerName: LPSTR, TargetLogonId: ULONG, HotkeyVk: BYTE, HotkeyModifiers: USHORT): BOOL {
    return Wtsapi32.Load('WTSStartRemoteControlSessionA')(pTargetServerName, TargetLogonId, HotkeyVk, HotkeyModifiers);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsstartremotecontrolsessionw
  public static WTSStartRemoteControlSessionW(pTargetServerName: LPWSTR, TargetLogonId: ULONG, HotkeyVk: BYTE, HotkeyModifiers: USHORT): BOOL {
    return Wtsapi32.Load('WTSStartRemoteControlSessionW')(pTargetServerName, TargetLogonId, HotkeyVk, HotkeyModifiers);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsstopremotecontrolsession
  public static WTSStopRemoteControlSession(LogonId: ULONG): BOOL {
    return Wtsapi32.Load('WTSStopRemoteControlSession')(LogonId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsterminateprocess
  public static WTSTerminateProcess(hServer: HANDLE, ProcessId: DWORD, ExitCode: DWORD): BOOL {
    return Wtsapi32.Load('WTSTerminateProcess')(hServer, ProcessId, ExitCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsunregistersessionnotification
  public static WTSUnRegisterSessionNotification(hWnd: HWND): BOOL {
    return Wtsapi32.Load('WTSUnRegisterSessionNotification')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsunregistersessionnotificationex
  public static WTSUnRegisterSessionNotificationEx(hServer: HANDLE, hWnd: HWND): BOOL {
    return Wtsapi32.Load('WTSUnRegisterSessionNotificationEx')(hServer, hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsvirtualchannelclose
  public static WTSVirtualChannelClose(hChannelHandle: HANDLE): BOOL {
    return Wtsapi32.Load('WTSVirtualChannelClose')(hChannelHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsvirtualchannelopen
  public static WTSVirtualChannelOpen(hServer: HANDLE, SessionId: DWORD, pVirtualName: LPSTR): HANDLE {
    return Wtsapi32.Load('WTSVirtualChannelOpen')(hServer, SessionId, pVirtualName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsvirtualchannelopenex
  public static WTSVirtualChannelOpenEx(SessionId: DWORD, pVirtualName: LPSTR, flags: DWORD): HANDLE {
    return Wtsapi32.Load('WTSVirtualChannelOpenEx')(SessionId, pVirtualName, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsvirtualchannelpurgeinput
  public static WTSVirtualChannelPurgeInput(hChannelHandle: HANDLE): BOOL {
    return Wtsapi32.Load('WTSVirtualChannelPurgeInput')(hChannelHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsvirtualchannelpurgeoutput
  public static WTSVirtualChannelPurgeOutput(hChannelHandle: HANDLE): BOOL {
    return Wtsapi32.Load('WTSVirtualChannelPurgeOutput')(hChannelHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsvirtualchannelquery
  public static WTSVirtualChannelQuery(hChannelHandle: HANDLE, WTSVirtualClass: WTS_VIRTUAL_CLASS, ppBuffer: PVOID, pBytesReturned: LPDWORD): BOOL {
    return Wtsapi32.Load('WTSVirtualChannelQuery')(hChannelHandle, WTSVirtualClass, ppBuffer, pBytesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsvirtualchannelread
  public static WTSVirtualChannelRead(hChannelHandle: HANDLE, TimeOut: ULONG, Buffer: PCHAR, BufferSize: ULONG, pBytesRead: PULONG): BOOL {
    return Wtsapi32.Load('WTSVirtualChannelRead')(hChannelHandle, TimeOut, Buffer, BufferSize, pBytesRead);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtsvirtualchannelwrite
  public static WTSVirtualChannelWrite(hChannelHandle: HANDLE, Buffer: PCHAR, Length: ULONG, pBytesWritten: PULONG): BOOL {
    return Wtsapi32.Load('WTSVirtualChannelWrite')(hChannelHandle, Buffer, Length, pBytesWritten);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wtsapi32/nf-wtsapi32-wtswaitsystemevent
  public static WTSWaitSystemEvent(hServer: HANDLE, EventMask: DWORD, pEventFlags: LPDWORD): BOOL {
    return Wtsapi32.Load('WTSWaitSystemEvent')(hServer, EventMask, pEventFlags);
  }
}

export default Wtsapi32;
