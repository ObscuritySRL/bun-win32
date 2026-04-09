import type { Pointer } from 'bun:ffi';

import type { DWORD, HANDLE } from '@bun-win32/core';
export type { BOOL, BYTE, DWORD, HANDLE, HRESULT, HWND, LPDWORD, LPSTR, LPWSTR, NULL, PBYTE, PHANDLE, PULONG, PVOID, ULONG, USHORT } from '@bun-win32/core';

export const WTS_ANY_SESSION: DWORD = 0xffff_fffe;
export const WTS_CHANNEL_OPTION_DYNAMIC: DWORD = 0x0000_0001;
export const WTS_CURRENT_SERVER_HANDLE: HANDLE = 0n;
export const WTS_CURRENT_SESSION: DWORD = 0xffff_ffff;
export const WTS_LISTENER_CREATE: DWORD = 0x0000_0001;
export const WTS_LISTENER_UPDATE: DWORD = 0x0000_0010;

export enum WTS_CONFIG_CLASS {
  WTSUserConfigBrokenTimeoutSettings = 0x0000_000a,
  WTSUserConfigInitialProgram = 0x0000_0000,
  WTSUserConfigModemCallbackPhoneNumber = 0x0000_000d,
  WTSUserConfigModemCallbackSettings = 0x0000_000c,
  WTSUserConfigReconnectSettings = 0x0000_000b,
  WTSUserConfigShadowingSettings = 0x0000_000e,
  WTSUserConfigTerminalServerHomeDir = 0x0000_0010,
  WTSUserConfigTerminalServerHomeDirDrive = 0x0000_0011,
  WTSUserConfigTerminalServerProfilePath = 0x0000_000f,
  WTSUserConfigTimeoutSettingsConnections = 0x0000_0004,
  WTSUserConfigTimeoutSettingsDisconnections = 0x0000_0005,
  WTSUserConfigTimeoutSettingsIdle = 0x0000_0006,
  WTSUserConfigWorkingDirectory = 0x0000_0001,
  WTSUserConfigfAllowLogonTerminalServer = 0x0000_0003,
  WTSUserConfigfDeviceClientDefaultPrinter = 0x0000_0009,
  WTSUserConfigfDeviceClientDrives = 0x0000_0007,
  WTSUserConfigfDeviceClientPrinters = 0x0000_0008,
  WTSUserConfigfInheritInitialProgram = 0x0000_0002,
  WTSUserConfigfTerminalServerRemoteHomeDir = 0x0000_0012,
}

export enum WTS_CONNECTSTATE_CLASS {
  WTSActive = 0x0000_0000,
  WTSConnectQuery = 0x0000_0002,
  WTSConnected = 0x0000_0001,
  WTSDisconnected = 0x0000_0004,
  WTSDown = 0x0000_0008,
  WTSIdle = 0x0000_0005,
  WTSInit = 0x0000_0009,
  WTSListen = 0x0000_0006,
  WTSReset = 0x0000_0007,
  WTSShadow = 0x0000_0003,
}

export enum WTS_EVENT {
  WTS_EVENT_ALL = 0x7fff_ffff,
  WTS_EVENT_CONNECT = 0x0000_0008,
  WTS_EVENT_CREATE = 0x0000_0001,
  WTS_EVENT_DELETE = 0x0000_0002,
  WTS_EVENT_DISCONNECT = 0x0000_0010,
  WTS_EVENT_FLUSH = 0x8000_0000,
  WTS_EVENT_LICENSE = 0x0000_0100,
  WTS_EVENT_LOGOFF = 0x0000_0040,
  WTS_EVENT_LOGON = 0x0000_0020,
  WTS_EVENT_NONE = 0x0000_0000,
  WTS_EVENT_RENAME = 0x0000_0004,
  WTS_EVENT_STATECHANGE = 0x0000_0080,
}

export enum WTS_INFO_CLASS {
  WTSApplicationName = 0x0000_0001,
  WTSClientAddress = 0x0000_000e,
  WTSClientBuildNumber = 0x0000_0009,
  WTSClientDirectory = 0x0000_000b,
  WTSClientDisplay = 0x0000_000f,
  WTSClientHardwareId = 0x0000_000d,
  WTSClientInfo = 0x0000_0017,
  WTSClientName = 0x0000_000a,
  WTSClientProductId = 0x0000_000c,
  WTSClientProtocolType = 0x0000_0010,
  WTSConfigInfo = 0x0000_001a,
  WTSConnectState = 0x0000_0008,
  WTSDomainName = 0x0000_0007,
  WTSIdleTime = 0x0000_0011,
  WTSIncomingBytes = 0x0000_0013,
  WTSIncomingFrames = 0x0000_0015,
  WTSInitialProgram = 0x0000_0000,
  WTSIsRemoteSession = 0x0000_001d,
  WTSLogonTime = 0x0000_0012,
  WTSOEMId = 0x0000_0003,
  WTSOutgoingBytes = 0x0000_0014,
  WTSOutgoingFrames = 0x0000_0016,
  WTSSessionAddressV4 = 0x0000_001c,
  WTSSessionId = 0x0000_0004,
  WTSSessionInfo = 0x0000_0018,
  WTSSessionInfoEx = 0x0000_0019,
  WTSUserName = 0x0000_0005,
  WTSValidationInfo = 0x0000_001b,
  WTSWinStationName = 0x0000_0006,
  WTSWorkingDirectory = 0x0000_0002,
}

export enum WTS_NOTIFY {
  NOTIFY_FOR_ALL_SESSIONS = 0x0000_0001,
  NOTIFY_FOR_THIS_SESSION = 0x0000_0000,
}

export enum WTS_TYPE_CLASS {
  WTSTypeProcessInfoLevel0 = 0x0000_0000,
  WTSTypeProcessInfoLevel1 = 0x0000_0001,
  WTSTypeSessionInfoLevel1 = 0x0000_0002,
}

export enum WTS_VIRTUAL_CLASS {
  WTSVirtualClientData = 0x0000_0000,
  WTSVirtualFileHandle = 0x0000_0001,
}

export enum WTS_WSD {
  WTS_WSD_FASTREBOOT = 0x0000_0010,
  WTS_WSD_LOGOFF = 0x0000_0001,
  WTS_WSD_POWEROFF = 0x0000_0008,
  WTS_WSD_REBOOT = 0x0000_0004,
  WTS_WSD_SHUTDOWN = 0x0000_0002,
}

export type PBOOL = Pointer;
export type PCHAR = Pointer;
export type PSECURITY_DESCRIPTOR = Pointer;
export type PWTSLISTENERCONFIGA = Pointer;
export type PWTSLISTENERCONFIGW = Pointer;
export type PWTSLISTENERNAMEA = Pointer;
export type PWTSLISTENERNAMEW = Pointer;
export type SECURITY_INFORMATION = number;
