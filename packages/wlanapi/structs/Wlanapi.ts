import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';
import type {
  BOOL,
  DWORD,
  Dot11BssType,
  EAP_METHOD_TYPE,
  HANDLE,
  LPCGUID,
  LPCWSTR,
  LPGUID,
  NULL,
  PBOOL,
  PBYTE,
  PDOT11_MAC_ADDRESS,
  PDOT11_NETWORK_LIST,
  PDOT11_SSID,
  PDWORD,
  PHANDLE,
  PLPCWSTR,
  PPBYTE,
  PPVOID,
  PVOID,
  PWCHAR,
  PWLAN_AVAILABLE_NETWORK_LIST,
  PWLAN_BSS_LIST,
  PWLAN_CONNECTION_PARAMETERS,
  PWLAN_DEVICE_SERVICE_GUID_LIST,
  PWLAN_HOSTED_NETWORK_REASON,
  PWLAN_HOSTED_NETWORK_STATUS,
  PWLAN_INTERFACE_CAPABILITY,
  PWLAN_INTERFACE_INFO_LIST,
  PWLAN_OPCODE_VALUE_TYPE,
  PWLAN_PROFILE_INFO_LIST,
  PWLAN_RAW_DATA,
  PWLAN_RAW_DATA_LIST,
  PZPWSTR,
  VOID,
  WFD_OPEN_SESSION_COMPLETE_CALLBACK,
  WLAN_NOTIFICATION_CALLBACK,
  WLAN_REASON_CODE,
  WlanAutoconfOpcode,
  WlanFilterListType,
  WlanHostedNetworkOpcode,
  WlanIhvControlType,
  WlanIntfOpcode,
  WlanSecurableObject,
} from '../types/Wlanapi';

/**
 * Thin, lazy-loaded FFI bindings for `wlanapi.dll`.
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
 * import Wlanapi from './structs/Wlanapi';
 *
 * const negotiatedVersion = Buffer.alloc(4);
 * const clientHandle = Buffer.alloc(8);
 *
 * Wlanapi.WlanOpenHandle(0x0000_0002, null, negotiatedVersion.ptr, clientHandle.ptr);
 * ```
 */
class Wlanapi extends Win32 {
  protected static override name = 'wlanapi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    WFDCancelOpenSession: { args: [FFIType.u64], returns: FFIType.u32 },
    WFDCloseHandle: { args: [FFIType.u64], returns: FFIType.u32 },
    WFDCloseSession: { args: [FFIType.u64], returns: FFIType.u32 },
    WFDOpenHandle: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WFDOpenLegacySession: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WFDStartOpenSession: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WFDUpdateDeviceVisibility: { args: [FFIType.ptr], returns: FFIType.u32 },
    WlanAllocateMemory: { args: [FFIType.u32], returns: FFIType.ptr },
    WlanCloseHandle: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    WlanConnect: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanDeleteProfile: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanDeviceServiceCommand: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanDisconnect: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanEnumInterfaces: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanExtractPsdIEDataList: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanFreeMemory: { args: [FFIType.ptr], returns: FFIType.void },
    WlanGetAvailableNetworkList: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanGetFilterList: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanGetInterfaceCapability: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanGetNetworkBssList: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanGetProfile: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanGetProfileCustomUserData: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanGetProfileList: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanGetSecuritySettings: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanGetSupportedDeviceServices: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanHostedNetworkForceStart: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanHostedNetworkForceStop: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanHostedNetworkInitSettings: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanHostedNetworkQueryProperty: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanHostedNetworkQuerySecondaryKey: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanHostedNetworkQueryStatus: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanHostedNetworkRefreshSecuritySettings: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanHostedNetworkSetProperty: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanHostedNetworkSetSecondaryKey: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanHostedNetworkStartUsing: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanHostedNetworkStopUsing: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanIhvControl: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanOpenHandle: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanQueryAutoConfigParameter: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanQueryInterface: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanReasonCodeToString: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanRegisterDeviceServiceNotification: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    WlanRegisterNotification: { args: [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanRegisterVirtualStationNotification: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    WlanRenameProfile: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanSaveTemporaryProfile: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    WlanScan: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanSetAutoConfigParameter: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanSetFilterList: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanSetInterface: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanSetProfile: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanSetProfileCustomUserData: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanSetProfileEapUserData: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanSetProfileEapXmlUserData: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanSetProfileList: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanSetProfilePosition: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    WlanSetPsdIEDataList: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WlanSetSecuritySettings: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wfdcancelopensession
  public static WFDCancelOpenSession(hSessionHandle: HANDLE): DWORD {
    return Wlanapi.Load('WFDCancelOpenSession')(hSessionHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wfdclosehandle
  public static WFDCloseHandle(hClientHandle: HANDLE): DWORD {
    return Wlanapi.Load('WFDCloseHandle')(hClientHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wfdclosesession
  public static WFDCloseSession(hSessionHandle: HANDLE): DWORD {
    return Wlanapi.Load('WFDCloseSession')(hSessionHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wfdopenhandle
  public static WFDOpenHandle(dwClientVersion: DWORD, pdwNegotiatedVersion: PDWORD, phClientHandle: PHANDLE): DWORD {
    return Wlanapi.Load('WFDOpenHandle')(dwClientVersion, pdwNegotiatedVersion, phClientHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wfdopenlegacysession
  public static WFDOpenLegacySession(hClientHandle: HANDLE, pLegacyMacAddress: PDOT11_MAC_ADDRESS, phSessionHandle: PHANDLE, pGuidSessionInterface: LPGUID): DWORD {
    return Wlanapi.Load('WFDOpenLegacySession')(hClientHandle, pLegacyMacAddress, phSessionHandle, pGuidSessionInterface);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wfdstartopensession
  public static WFDStartOpenSession(hClientHandle: HANDLE, pDeviceAddress: PDOT11_MAC_ADDRESS, pvContext: PVOID | NULL, pfnCallback: WFD_OPEN_SESSION_COMPLETE_CALLBACK, phSessionHandle: PHANDLE): DWORD {
    return Wlanapi.Load('WFDStartOpenSession')(hClientHandle, pDeviceAddress, pvContext, pfnCallback, phSessionHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wfdupdatedevicevisibility
  public static WFDUpdateDeviceVisibility(pDeviceAddress: PDOT11_MAC_ADDRESS): DWORD {
    return Wlanapi.Load('WFDUpdateDeviceVisibility')(pDeviceAddress);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanallocatememory
  public static WlanAllocateMemory(dwMemorySize: DWORD): PVOID {
    return Wlanapi.Load('WlanAllocateMemory')(dwMemorySize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanclosehandle
  public static WlanCloseHandle(hClientHandle: HANDLE, pReserved: NULL): DWORD {
    return Wlanapi.Load('WlanCloseHandle')(hClientHandle, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanconnect
  public static WlanConnect(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, pConnectionParameters: PWLAN_CONNECTION_PARAMETERS, pReserved: NULL): DWORD {
    return Wlanapi.Load('WlanConnect')(hClientHandle, pInterfaceGuid, pConnectionParameters, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlandeleteprofile
  public static WlanDeleteProfile(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, strProfileName: LPCWSTR, pReserved: NULL): DWORD {
    return Wlanapi.Load('WlanDeleteProfile')(hClientHandle, pInterfaceGuid, strProfileName, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlandeviceservicecommand
  public static WlanDeviceServiceCommand(
    hClientHandle: HANDLE,
    pInterfaceGuid: LPCGUID,
    pDeviceServiceGuid: LPGUID,
    dwOpCode: DWORD,
    dwInBufferSize: DWORD,
    pInBuffer: PVOID | NULL,
    dwOutBufferSize: DWORD,
    pOutBuffer: PVOID | NULL,
    pdwBytesReturned: PDWORD,
  ): DWORD {
    return Wlanapi.Load('WlanDeviceServiceCommand')(hClientHandle, pInterfaceGuid, pDeviceServiceGuid, dwOpCode, dwInBufferSize, pInBuffer, dwOutBufferSize, pOutBuffer, pdwBytesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlandisconnect
  public static WlanDisconnect(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, pReserved: NULL): DWORD {
    return Wlanapi.Load('WlanDisconnect')(hClientHandle, pInterfaceGuid, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanenuminterfaces
  public static WlanEnumInterfaces(hClientHandle: HANDLE, pReserved: NULL, ppInterfaceList: PWLAN_INTERFACE_INFO_LIST): DWORD {
    return Wlanapi.Load('WlanEnumInterfaces')(hClientHandle, pReserved, ppInterfaceList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanextractpsdiedatalist
  public static WlanExtractPsdIEDataList(hClientHandle: HANDLE, dwIeDataSize: DWORD, pRawIeData: PBYTE, strFormat: LPCWSTR, pReserved: NULL, ppPsdIEDataList: PWLAN_RAW_DATA_LIST): DWORD {
    return Wlanapi.Load('WlanExtractPsdIEDataList')(hClientHandle, dwIeDataSize, pRawIeData, strFormat, pReserved, ppPsdIEDataList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanfreememory
  public static WlanFreeMemory(pMemory: PVOID): VOID {
    return Wlanapi.Load('WlanFreeMemory')(pMemory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlangetavailablenetworklist
  public static WlanGetAvailableNetworkList(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, dwFlags: DWORD, pReserved: NULL, ppAvailableNetworkList: PWLAN_AVAILABLE_NETWORK_LIST): DWORD {
    return Wlanapi.Load('WlanGetAvailableNetworkList')(hClientHandle, pInterfaceGuid, dwFlags, pReserved, ppAvailableNetworkList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlangetfilterlist
  public static WlanGetFilterList(hClientHandle: HANDLE, wlanFilterListType: WlanFilterListType, pReserved: NULL, ppNetworkList: PDOT11_NETWORK_LIST): DWORD {
    return Wlanapi.Load('WlanGetFilterList')(hClientHandle, wlanFilterListType, pReserved, ppNetworkList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlangetinterfacecapability
  public static WlanGetInterfaceCapability(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, pReserved: NULL, ppCapability: PWLAN_INTERFACE_CAPABILITY): DWORD {
    return Wlanapi.Load('WlanGetInterfaceCapability')(hClientHandle, pInterfaceGuid, pReserved, ppCapability);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlangetnetworkbsslist
  public static WlanGetNetworkBssList(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, pDot11Ssid: PDOT11_SSID | NULL, dot11BssType: Dot11BssType, bSecurityEnabled: BOOL, pReserved: NULL, ppWlanBssList: PWLAN_BSS_LIST): DWORD {
    return Wlanapi.Load('WlanGetNetworkBssList')(hClientHandle, pInterfaceGuid, pDot11Ssid, dot11BssType, bSecurityEnabled, pReserved, ppWlanBssList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlangetprofile
  public static WlanGetProfile(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, strProfileName: LPCWSTR, pReserved: NULL, pstrProfileXml: PZPWSTR, pdwFlags: PDWORD | NULL, pdwGrantedAccess: PDWORD | NULL): DWORD {
    return Wlanapi.Load('WlanGetProfile')(hClientHandle, pInterfaceGuid, strProfileName, pReserved, pstrProfileXml, pdwFlags, pdwGrantedAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlangetprofilecustomuserdata
  public static WlanGetProfileCustomUserData(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, strProfileName: LPCWSTR, pReserved: NULL, pdwDataSize: PDWORD, ppData: PPBYTE): DWORD {
    return Wlanapi.Load('WlanGetProfileCustomUserData')(hClientHandle, pInterfaceGuid, strProfileName, pReserved, pdwDataSize, ppData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlangetprofilelist
  public static WlanGetProfileList(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, pReserved: NULL, ppProfileList: PWLAN_PROFILE_INFO_LIST): DWORD {
    return Wlanapi.Load('WlanGetProfileList')(hClientHandle, pInterfaceGuid, pReserved, ppProfileList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlangetsecuritysettings
  public static WlanGetSecuritySettings(hClientHandle: HANDLE, SecurableObject: WlanSecurableObject, pValueType: PWLAN_OPCODE_VALUE_TYPE | NULL, pstrCurrentSDDL: PZPWSTR, pdwGrantedAccess: PDWORD): DWORD {
    return Wlanapi.Load('WlanGetSecuritySettings')(hClientHandle, SecurableObject, pValueType, pstrCurrentSDDL, pdwGrantedAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlangetsupporteddeviceservices
  public static WlanGetSupportedDeviceServices(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, ppDevSvcGuidList: PWLAN_DEVICE_SERVICE_GUID_LIST): DWORD {
    return Wlanapi.Load('WlanGetSupportedDeviceServices')(hClientHandle, pInterfaceGuid, ppDevSvcGuidList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanhostednetworkforcestart
  public static WlanHostedNetworkForceStart(hClientHandle: HANDLE, pFailReason: PWLAN_HOSTED_NETWORK_REASON | NULL, pvReserved: NULL): DWORD {
    return Wlanapi.Load('WlanHostedNetworkForceStart')(hClientHandle, pFailReason, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanhostednetworkforcestop
  public static WlanHostedNetworkForceStop(hClientHandle: HANDLE, pFailReason: PWLAN_HOSTED_NETWORK_REASON | NULL, pvReserved: NULL): DWORD {
    return Wlanapi.Load('WlanHostedNetworkForceStop')(hClientHandle, pFailReason, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanhostednetworkinitsettings
  public static WlanHostedNetworkInitSettings(hClientHandle: HANDLE, pFailReason: PWLAN_HOSTED_NETWORK_REASON | NULL, pvReserved: NULL): DWORD {
    return Wlanapi.Load('WlanHostedNetworkInitSettings')(hClientHandle, pFailReason, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanhostednetworkqueryproperty
  public static WlanHostedNetworkQueryProperty(hClientHandle: HANDLE, OpCode: WlanHostedNetworkOpcode, pdwDataSize: PDWORD, ppvData: PPVOID, pWlanOpcodeValueType: PWLAN_OPCODE_VALUE_TYPE, pvReserved: NULL): DWORD {
    return Wlanapi.Load('WlanHostedNetworkQueryProperty')(hClientHandle, OpCode, pdwDataSize, ppvData, pWlanOpcodeValueType, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanhostednetworkquerysecondarykey
  public static WlanHostedNetworkQuerySecondaryKey(hClientHandle: HANDLE, pdwKeyLength: PDWORD, ppucKeyData: PPBYTE, pbIsPassPhrase: PBOOL, pbPersistent: PBOOL, pFailReason: PWLAN_HOSTED_NETWORK_REASON | NULL, pvReserved: NULL): DWORD {
    return Wlanapi.Load('WlanHostedNetworkQuerySecondaryKey')(hClientHandle, pdwKeyLength, ppucKeyData, pbIsPassPhrase, pbPersistent, pFailReason, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanhostednetworkquerystatus
  public static WlanHostedNetworkQueryStatus(hClientHandle: HANDLE, ppWlanHostedNetworkStatus: PWLAN_HOSTED_NETWORK_STATUS, pvReserved: NULL): DWORD {
    return Wlanapi.Load('WlanHostedNetworkQueryStatus')(hClientHandle, ppWlanHostedNetworkStatus, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanhostednetworkrefreshsecuritysettings
  public static WlanHostedNetworkRefreshSecuritySettings(hClientHandle: HANDLE, pFailReason: PWLAN_HOSTED_NETWORK_REASON | NULL, pvReserved: NULL): DWORD {
    return Wlanapi.Load('WlanHostedNetworkRefreshSecuritySettings')(hClientHandle, pFailReason, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanhostednetworksetproperty
  public static WlanHostedNetworkSetProperty(hClientHandle: HANDLE, OpCode: WlanHostedNetworkOpcode, dwDataSize: DWORD, pvData: PVOID, pFailReason: PWLAN_HOSTED_NETWORK_REASON | NULL, pvReserved: NULL): DWORD {
    return Wlanapi.Load('WlanHostedNetworkSetProperty')(hClientHandle, OpCode, dwDataSize, pvData, pFailReason, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanhostednetworksetsecondarykey
  public static WlanHostedNetworkSetSecondaryKey(hClientHandle: HANDLE, dwKeyLength: DWORD, pucKeyData: PBYTE, bIsPassPhrase: BOOL, bPersistent: BOOL, pFailReason: PWLAN_HOSTED_NETWORK_REASON | NULL, pvReserved: NULL): DWORD {
    return Wlanapi.Load('WlanHostedNetworkSetSecondaryKey')(hClientHandle, dwKeyLength, pucKeyData, bIsPassPhrase, bPersistent, pFailReason, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanhostednetworkstartusing
  public static WlanHostedNetworkStartUsing(hClientHandle: HANDLE, pFailReason: PWLAN_HOSTED_NETWORK_REASON | NULL, pvReserved: NULL): DWORD {
    return Wlanapi.Load('WlanHostedNetworkStartUsing')(hClientHandle, pFailReason, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanhostednetworkstopusing
  public static WlanHostedNetworkStopUsing(hClientHandle: HANDLE, pFailReason: PWLAN_HOSTED_NETWORK_REASON | NULL, pvReserved: NULL): DWORD {
    return Wlanapi.Load('WlanHostedNetworkStopUsing')(hClientHandle, pFailReason, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanihvcontrol
  public static WlanIhvControl(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, Type: WlanIhvControlType, dwInBufferSize: DWORD, pInBuffer: PVOID, dwOutBufferSize: DWORD, pOutBuffer: PVOID | NULL, pdwBytesReturned: PDWORD): DWORD {
    return Wlanapi.Load('WlanIhvControl')(hClientHandle, pInterfaceGuid, Type, dwInBufferSize, pInBuffer, dwOutBufferSize, pOutBuffer, pdwBytesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanopenhandle
  public static WlanOpenHandle(dwClientVersion: DWORD, pReserved: NULL, pdwNegotiatedVersion: PDWORD, phClientHandle: PHANDLE): DWORD {
    return Wlanapi.Load('WlanOpenHandle')(dwClientVersion, pReserved, pdwNegotiatedVersion, phClientHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanqueryautoconfigparameter
  public static WlanQueryAutoConfigParameter(hClientHandle: HANDLE, OpCode: WlanAutoconfOpcode, pReserved: NULL, pdwDataSize: PDWORD, ppData: PPVOID, pWlanOpcodeValueType: PWLAN_OPCODE_VALUE_TYPE | NULL): DWORD {
    return Wlanapi.Load('WlanQueryAutoConfigParameter')(hClientHandle, OpCode, pReserved, pdwDataSize, ppData, pWlanOpcodeValueType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanqueryinterface
  public static WlanQueryInterface(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, OpCode: WlanIntfOpcode, pReserved: NULL, pdwDataSize: PDWORD, ppData: PPVOID, pWlanOpcodeValueType: PWLAN_OPCODE_VALUE_TYPE | NULL): DWORD {
    return Wlanapi.Load('WlanQueryInterface')(hClientHandle, pInterfaceGuid, OpCode, pReserved, pdwDataSize, ppData, pWlanOpcodeValueType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanreasoncodetostring
  public static WlanReasonCodeToString(dwReasonCode: WLAN_REASON_CODE, dwBufferSize: DWORD, pStringBuffer: PWCHAR, pReserved: NULL): DWORD {
    return Wlanapi.Load('WlanReasonCodeToString')(dwReasonCode, dwBufferSize, pStringBuffer, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanregisterdeviceservicenotification
  public static WlanRegisterDeviceServiceNotification(hClientHandle: HANDLE, pDevSvcGuidList: PWLAN_DEVICE_SERVICE_GUID_LIST | NULL): DWORD {
    return Wlanapi.Load('WlanRegisterDeviceServiceNotification')(hClientHandle, pDevSvcGuidList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanregisternotification
  public static WlanRegisterNotification(
    hClientHandle: HANDLE,
    dwNotifSource: DWORD,
    bIgnoreDuplicate: BOOL,
    funcCallback: WLAN_NOTIFICATION_CALLBACK | NULL,
    pCallbackContext: PVOID | NULL,
    pReserved: NULL,
    pdwPrevNotifSource: PDWORD | NULL,
  ): DWORD {
    return Wlanapi.Load('WlanRegisterNotification')(hClientHandle, dwNotifSource, bIgnoreDuplicate, funcCallback, pCallbackContext, pReserved, pdwPrevNotifSource);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanregistervirtualstationnotification
  public static WlanRegisterVirtualStationNotification(hClientHandle: HANDLE, bRegister: BOOL, pReserved: NULL): DWORD {
    return Wlanapi.Load('WlanRegisterVirtualStationNotification')(hClientHandle, bRegister, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanrenameprofile
  public static WlanRenameProfile(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, strOldProfileName: LPCWSTR, strNewProfileName: LPCWSTR, pReserved: NULL): DWORD {
    return Wlanapi.Load('WlanRenameProfile')(hClientHandle, pInterfaceGuid, strOldProfileName, strNewProfileName, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlansavetemporaryprofile
  public static WlanSaveTemporaryProfile(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, strProfileName: LPCWSTR, strAllUserProfileSecurity: LPCWSTR | NULL, dwFlags: DWORD, bOverWrite: BOOL, pReserved: NULL): DWORD {
    return Wlanapi.Load('WlanSaveTemporaryProfile')(hClientHandle, pInterfaceGuid, strProfileName, strAllUserProfileSecurity, dwFlags, bOverWrite, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlanscan
  public static WlanScan(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, pDot11Ssid: PDOT11_SSID | NULL, pIeData: PWLAN_RAW_DATA | NULL, pReserved: NULL): DWORD {
    return Wlanapi.Load('WlanScan')(hClientHandle, pInterfaceGuid, pDot11Ssid, pIeData, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlansetautoconfigparameter
  public static WlanSetAutoConfigParameter(hClientHandle: HANDLE, OpCode: WlanAutoconfOpcode, dwDataSize: DWORD, pData: PVOID, pReserved: NULL): DWORD {
    return Wlanapi.Load('WlanSetAutoConfigParameter')(hClientHandle, OpCode, dwDataSize, pData, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlansetfilterlist
  public static WlanSetFilterList(hClientHandle: HANDLE, wlanFilterListType: WlanFilterListType, pNetworkList: PDOT11_NETWORK_LIST | NULL, pReserved: NULL): DWORD {
    return Wlanapi.Load('WlanSetFilterList')(hClientHandle, wlanFilterListType, pNetworkList, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlansetinterface
  public static WlanSetInterface(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, OpCode: WlanIntfOpcode, dwDataSize: DWORD, pData: PVOID, pReserved: NULL): DWORD {
    return Wlanapi.Load('WlanSetInterface')(hClientHandle, pInterfaceGuid, OpCode, dwDataSize, pData, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlansetprofile
  public static WlanSetProfile(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, dwFlags: DWORD, strProfileXml: LPCWSTR, strAllUserProfileSecurity: LPCWSTR | NULL, bOverwrite: BOOL, pReserved: NULL, pdwReasonCode: PDWORD): DWORD {
    return Wlanapi.Load('WlanSetProfile')(hClientHandle, pInterfaceGuid, dwFlags, strProfileXml, strAllUserProfileSecurity, bOverwrite, pReserved, pdwReasonCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlansetprofilecustomuserdata
  public static WlanSetProfileCustomUserData(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, strProfileName: LPCWSTR, dwDataSize: DWORD, pData: PBYTE, pReserved: NULL): DWORD {
    return Wlanapi.Load('WlanSetProfileCustomUserData')(hClientHandle, pInterfaceGuid, strProfileName, dwDataSize, pData, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlansetprofileeapuserdata
  public static WlanSetProfileEapUserData(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, strProfileName: LPCWSTR, eapType: EAP_METHOD_TYPE, dwFlags: DWORD, dwEapUserDataSize: DWORD, pbEapUserData: PBYTE | NULL, pReserved: NULL): DWORD {
    return Wlanapi.Load('WlanSetProfileEapUserData')(hClientHandle, pInterfaceGuid, strProfileName, eapType, dwFlags, dwEapUserDataSize, pbEapUserData, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlansetprofileeapxmluserdata
  public static WlanSetProfileEapXmlUserData(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, strProfileName: LPCWSTR, dwFlags: DWORD, strEapXmlUserData: LPCWSTR, pReserved: NULL): DWORD {
    return Wlanapi.Load('WlanSetProfileEapXmlUserData')(hClientHandle, pInterfaceGuid, strProfileName, dwFlags, strEapXmlUserData, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlansetprofilelist
  public static WlanSetProfileList(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, dwItems: DWORD, strProfileNames: PLPCWSTR, pReserved: NULL): DWORD {
    return Wlanapi.Load('WlanSetProfileList')(hClientHandle, pInterfaceGuid, dwItems, strProfileNames, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlansetprofileposition
  public static WlanSetProfilePosition(hClientHandle: HANDLE, pInterfaceGuid: LPCGUID, strProfileName: LPCWSTR, dwPosition: DWORD, pReserved: NULL): DWORD {
    return Wlanapi.Load('WlanSetProfilePosition')(hClientHandle, pInterfaceGuid, strProfileName, dwPosition, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlansetpsdiedatalist
  public static WlanSetPsdIEDataList(hClientHandle: HANDLE, strFormat: LPCWSTR | NULL, pPsdIEDataList: PWLAN_RAW_DATA_LIST | NULL, pReserved: NULL): DWORD {
    return Wlanapi.Load('WlanSetPsdIEDataList')(hClientHandle, strFormat, pPsdIEDataList, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wlanapi/nf-wlanapi-wlansetsecuritysettings
  public static WlanSetSecuritySettings(hClientHandle: HANDLE, SecurableObject: WlanSecurableObject, strModifiedSDDL: LPCWSTR): DWORD {
    return Wlanapi.Load('WlanSetSecuritySettings')(hClientHandle, SecurableObject, strModifiedSDDL);
  }
}

export default Wlanapi;
