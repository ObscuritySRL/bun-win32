import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  DWORD,
  DSROLE_PRIMARY_DOMAIN_INFO_LEVEL,
  HANDLE,
  HRESULT,
  LMCSTR,
  LMSTR,
  LPBOOL,
  LPBYTE,
  LPCSTR,
  LPCWSTR,
  LPDWORD,
  LPSOCKET_ADDRESS,
  LPSTR,
  LPVOID,
  LPWSTR,
  NET_API_STATUS,
  NET_COMPUTER_NAME_TYPE,
  NET_VALIDATE_PASSWORD_TYPE,
  NETSETUP_NAME_TYPE,
  NTSTATUS,
  NULL,
  PBYTE,
  PDOMAIN_CONTROLLER_INFOA,
  PDOMAIN_CONTROLLER_INFOW,
  PDWORD,
  PDWORD_PTR,
  PDS_DOMAIN_TRUSTSA,
  PDS_DOMAIN_TRUSTSW,
  PDSREG_JOIN_INFO,
  PGUID,
  PHANDLE,
  PLSA_FOREST_TRUST_INFORMATION,
  PNCB,
  PNETSETUP_JOIN_STATUS,
  PNETSETUP_PROVISIONING_PARAMS,
  PSID,
  PSOCKET_ADDRESS,
  PULONG,
  PVOID,
  PZPWSTR,
  UCHAR,
  ULONG,
  VOID,
} from '../types/Netapi32';

/**
 * Thin, lazy-loaded FFI bindings for `netapi32.dll`.
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
 * import Netapi32 from './structs/Netapi32';
 *
 * // Lazy: bind on first call
 * const buf = Buffer.alloc(8);
 * const status = Netapi32.NetWkstaGetInfo(null, 100, buf.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Netapi32.Preload(['NetWkstaGetInfo', 'NetApiBufferFree']);
 * ```
 */
class Netapi32 extends Win32 {
  protected static override name = 'netapi32.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DavAddConnection: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    DavDeleteConnection: { args: [FFIType.u64], returns: FFIType.u32 },
    DavFlushFile: { args: [FFIType.u64], returns: FFIType.u32 },
    DavGetExtendedError: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DavGetHTTPFromUNCPath: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DavGetUNCFromHTTPPath: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsAddressToSiteNamesA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsAddressToSiteNamesExA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsAddressToSiteNamesExW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsAddressToSiteNamesW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsDeregisterDnsHostRecordsA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsDeregisterDnsHostRecordsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsEnumerateDomainTrustsA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsEnumerateDomainTrustsW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsGetDcCloseW: { args: [FFIType.u64], returns: FFIType.void },
    DsGetDcNameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    DsGetDcNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    DsGetDcNextA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsGetDcNextW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsGetDcOpenA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    DsGetDcOpenW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    DsGetDcSiteCoverageA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsGetDcSiteCoverageW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsGetForestTrustInformationW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    DsGetSiteNameA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsGetSiteNameW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsMergeForestTrustInformationW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsRoleFreeMemory: { args: [FFIType.ptr], returns: FFIType.void },
    DsRoleGetPrimaryDomainInformation: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    DsValidateSubnetNameA: { args: [FFIType.ptr], returns: FFIType.u32 },
    DsValidateSubnetNameW: { args: [FFIType.ptr], returns: FFIType.u32 },
    NetAddAlternateComputerName: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    NetAddServiceAccount: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NetApiBufferAllocate: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetApiBufferFree: { args: [FFIType.ptr], returns: FFIType.u32 },
    NetApiBufferReallocate: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetApiBufferSize: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetConnectionEnum: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetCreateProvisioningPackage: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetEnumerateComputerNames: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetEnumerateServiceAccounts: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NetEnumerateTrustedDomains: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NetFileClose: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    NetFileEnum: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetFileGetInfo: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetFreeAadJoinInformation: { args: [FFIType.ptr], returns: FFIType.void },
    NetGetAadJoinInformation: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NetGetAnyDCName: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetGetDCName: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetGetDisplayInformationIndex: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetGetJoinInformation: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetGetJoinableOUs: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetGroupAdd: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetGroupAddUser: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetGroupDel: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetGroupDelUser: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetGroupEnum: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetGroupGetInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetGroupGetUsers: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetGroupSetInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetGroupSetUsers: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    NetIsServiceAccount: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NetJoinDomain: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    NetLocalGroupAdd: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetLocalGroupAddMember: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetLocalGroupAddMembers: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    NetLocalGroupDel: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetLocalGroupDelMember: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetLocalGroupDelMembers: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    NetLocalGroupEnum: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetLocalGroupGetInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetLocalGroupGetMembers: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetLocalGroupSetInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetLocalGroupSetMembers: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    NetProvisionComputerAccount: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetQueryDisplayInformation: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetQueryServiceAccount: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NetRegisterDomainNameChangeNotification: { args: [FFIType.ptr], returns: FFIType.u32 },
    NetRemoteComputerSupports: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetRemoteTOD: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetRemoveAlternateComputerName: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    NetRemoveServiceAccount: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NetRenameMachineInDomain: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    NetRequestOfflineDomainJoin: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetScheduleJobAdd: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetScheduleJobDel: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    NetScheduleJobEnum: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetScheduleJobGetInfo: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetServerDiskEnum: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetServerEnum: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetServerGetInfo: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetServerSetInfo: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetServerTransportAdd: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetServerTransportAddEx: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetServerTransportDel: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetServerTransportEnum: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetServiceControl: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetServiceEnum: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetServiceGetInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetServiceInstall: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetSessionDel: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetSessionEnum: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetSessionGetInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetShareAdd: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetShareCheck: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetShareDel: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    NetShareDelEx: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetShareDelSticky: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    NetShareEnum: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetShareEnumSticky: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetShareGetInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetShareSetInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetStatisticsGet: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetUnjoinDomain: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    NetUnregisterDomainNameChangeNotification: { args: [FFIType.u64], returns: FFIType.u32 },
    NetUseAdd: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetUseDel: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    NetUseEnum: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetUseGetInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetUserAdd: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetUserChangePassword: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetUserDel: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetUserEnum: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetUserGetGroups: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetUserGetInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetUserGetLocalGroups: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetUserModalsGet: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetUserModalsSet: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetUserSetGroups: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    NetUserSetInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetValidateName: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    NetValidatePasswordPolicy: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetValidatePasswordPolicyFree: { args: [FFIType.ptr], returns: FFIType.u32 },
    NetWkstaGetInfo: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetWkstaSetInfo: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetWkstaTransportAdd: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetWkstaTransportDel: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    NetWkstaTransportEnum: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetWkstaUserEnum: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    NetWkstaUserGetInfo: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NetWkstaUserSetInfo: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    Netbios: { args: [FFIType.ptr], returns: FFIType.u8 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/davclnt/nf-davclnt-davaddconnection
  public static DavAddConnection(ConnectionHandle: PHANDLE, RemoteName: LPCWSTR, UserName: LPCWSTR | NULL, Password: LPCWSTR | NULL, ClientCert: PBYTE | NULL, CertSize: DWORD): DWORD {
    return Netapi32.Load('DavAddConnection')(ConnectionHandle, RemoteName, UserName, Password, ClientCert, CertSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/davclnt/nf-davclnt-davdeleteconnection
  public static DavDeleteConnection(ConnectionHandle: HANDLE): DWORD {
    return Netapi32.Load('DavDeleteConnection')(ConnectionHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/davclnt/nf-davclnt-davflushfile
  public static DavFlushFile(hFile: HANDLE): DWORD {
    return Netapi32.Load('DavFlushFile')(hFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/davclnt/nf-davclnt-davgetextendederror
  public static DavGetExtendedError(hFile: HANDLE, ExtError: PDWORD, ExtErrorString: LPWSTR, cChSize: PDWORD): DWORD {
    return Netapi32.Load('DavGetExtendedError')(hFile, ExtError, ExtErrorString, cChSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/davclnt/nf-davclnt-davgethttpfromuncpath
  public static DavGetHTTPFromUNCPath(UncPath: LPCWSTR, Url: LPWSTR, lpSize: LPDWORD): DWORD {
    return Netapi32.Load('DavGetHTTPFromUNCPath')(UncPath, Url, lpSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/davclnt/nf-davclnt-davgetuncfromhttppath
  public static DavGetUNCFromHTTPPath(Url: LPCWSTR, UncPath: LPWSTR, lpSize: LPDWORD): DWORD {
    return Netapi32.Load('DavGetUNCFromHTTPPath')(Url, UncPath, lpSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsaddresstositenamesa
  public static DsAddressToSiteNamesA(ComputerName: LPCSTR | NULL, EntryCount: DWORD, SocketAddresses: PSOCKET_ADDRESS, SiteNames: LPSTR): DWORD {
    return Netapi32.Load('DsAddressToSiteNamesA')(ComputerName, EntryCount, SocketAddresses, SiteNames);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsaddresstositenamesexa
  public static DsAddressToSiteNamesExA(ComputerName: LPCSTR | NULL, EntryCount: DWORD, SocketAddresses: PSOCKET_ADDRESS, SiteNames: LPSTR, SubnetNames: LPSTR): DWORD {
    return Netapi32.Load('DsAddressToSiteNamesExA')(ComputerName, EntryCount, SocketAddresses, SiteNames, SubnetNames);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsaddresstositenamesexw
  public static DsAddressToSiteNamesExW(ComputerName: LPCWSTR | NULL, EntryCount: DWORD, SocketAddresses: PSOCKET_ADDRESS, SiteNames: LPWSTR, SubnetNames: LPWSTR): DWORD {
    return Netapi32.Load('DsAddressToSiteNamesExW')(ComputerName, EntryCount, SocketAddresses, SiteNames, SubnetNames);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsaddresstositenamesw
  public static DsAddressToSiteNamesW(ComputerName: LPCWSTR | NULL, EntryCount: DWORD, SocketAddresses: PSOCKET_ADDRESS, SiteNames: LPWSTR): DWORD {
    return Netapi32.Load('DsAddressToSiteNamesW')(ComputerName, EntryCount, SocketAddresses, SiteNames);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsderegisterdnshostrecordsa
  public static DsDeregisterDnsHostRecordsA(ServerName: LPSTR | NULL, DnsDomainName: LPSTR | NULL, DomainGuid: PGUID | NULL, DsaGuid: PGUID | NULL, DnsHostName: LPSTR): DWORD {
    return Netapi32.Load('DsDeregisterDnsHostRecordsA')(ServerName, DnsDomainName, DomainGuid, DsaGuid, DnsHostName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsderegisterdnshostrecordsw
  public static DsDeregisterDnsHostRecordsW(ServerName: LPWSTR | NULL, DnsDomainName: LPWSTR | NULL, DomainGuid: PGUID | NULL, DsaGuid: PGUID | NULL, DnsHostName: LPWSTR): DWORD {
    return Netapi32.Load('DsDeregisterDnsHostRecordsW')(ServerName, DnsDomainName, DomainGuid, DsaGuid, DnsHostName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsenumeratedomaintrustsa
  public static DsEnumerateDomainTrustsA(ServerName: LPSTR | NULL, Flags: ULONG, Domains: PDS_DOMAIN_TRUSTSA, DomainCount: PULONG): DWORD {
    return Netapi32.Load('DsEnumerateDomainTrustsA')(ServerName, Flags, Domains, DomainCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsenumeratedomaintrustsw
  public static DsEnumerateDomainTrustsW(ServerName: LPWSTR | NULL, Flags: ULONG, Domains: PDS_DOMAIN_TRUSTSW, DomainCount: PULONG): DWORD {
    return Netapi32.Load('DsEnumerateDomainTrustsW')(ServerName, Flags, Domains, DomainCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetdcclosew
  public static DsGetDcCloseW(GetDcContextHandle: HANDLE): VOID {
    return Netapi32.Load('DsGetDcCloseW')(GetDcContextHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetdcnamea
  public static DsGetDcNameA(ComputerName: LPCSTR | NULL, DomainName: LPCSTR | NULL, DomainGuid: PGUID | NULL, SiteName: LPCSTR | NULL, Flags: ULONG, DomainControllerInfo: PDOMAIN_CONTROLLER_INFOA): DWORD {
    return Netapi32.Load('DsGetDcNameA')(ComputerName, DomainName, DomainGuid, SiteName, Flags, DomainControllerInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetdcnamew
  public static DsGetDcNameW(ComputerName: LPCWSTR | NULL, DomainName: LPCWSTR | NULL, DomainGuid: PGUID | NULL, SiteName: LPCWSTR | NULL, Flags: ULONG, DomainControllerInfo: PDOMAIN_CONTROLLER_INFOW): DWORD {
    return Netapi32.Load('DsGetDcNameW')(ComputerName, DomainName, DomainGuid, SiteName, Flags, DomainControllerInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetdcnexta
  public static DsGetDcNextA(GetDcContextHandle: HANDLE, SockAddressCount: PULONG | NULL, SockAddresses: LPSOCKET_ADDRESS | NULL, DnsHostName: LPSTR | NULL): DWORD {
    return Netapi32.Load('DsGetDcNextA')(GetDcContextHandle, SockAddressCount, SockAddresses, DnsHostName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetdcnextw
  public static DsGetDcNextW(GetDcContextHandle: HANDLE, SockAddressCount: PULONG | NULL, SockAddresses: LPSOCKET_ADDRESS | NULL, DnsHostName: LPWSTR | NULL): DWORD {
    return Netapi32.Load('DsGetDcNextW')(GetDcContextHandle, SockAddressCount, SockAddresses, DnsHostName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetdcopena
  public static DsGetDcOpenA(DnsName: LPCSTR, OptionFlags: ULONG, SiteName: LPCSTR | NULL, DomainGuid: PGUID | NULL, DnsForestName: LPCSTR | NULL, DcFlags: ULONG, RetGetDcContext: PHANDLE): DWORD {
    return Netapi32.Load('DsGetDcOpenA')(DnsName, OptionFlags, SiteName, DomainGuid, DnsForestName, DcFlags, RetGetDcContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetdcopenw
  public static DsGetDcOpenW(DnsName: LPCWSTR, OptionFlags: ULONG, SiteName: LPCWSTR | NULL, DomainGuid: PGUID | NULL, DnsForestName: LPCWSTR | NULL, DcFlags: ULONG, RetGetDcContext: PHANDLE): DWORD {
    return Netapi32.Load('DsGetDcOpenW')(DnsName, OptionFlags, SiteName, DomainGuid, DnsForestName, DcFlags, RetGetDcContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetdcsitecoveragea
  public static DsGetDcSiteCoverageA(ServerName: LPCSTR | NULL, EntryCount: PULONG, SiteNames: LPSTR): DWORD {
    return Netapi32.Load('DsGetDcSiteCoverageA')(ServerName, EntryCount, SiteNames);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetdcsitecoveragew
  public static DsGetDcSiteCoverageW(ServerName: LPCWSTR | NULL, EntryCount: PULONG, SiteNames: LPWSTR): DWORD {
    return Netapi32.Load('DsGetDcSiteCoverageW')(ServerName, EntryCount, SiteNames);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetforesttrustinformationw
  public static DsGetForestTrustInformationW(ServerName: LPCWSTR | NULL, TrustedDomainName: LPCWSTR | NULL, Flags: DWORD, ForestTrustInfo: PLSA_FOREST_TRUST_INFORMATION): DWORD {
    return Netapi32.Load('DsGetForestTrustInformationW')(ServerName, TrustedDomainName, Flags, ForestTrustInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetsitenamea
  public static DsGetSiteNameA(ComputerName: LPCSTR | NULL, SiteName: LPSTR): DWORD {
    return Netapi32.Load('DsGetSiteNameA')(ComputerName, SiteName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetsitenamew
  public static DsGetSiteNameW(ComputerName: LPCWSTR | NULL, SiteName: LPWSTR): DWORD {
    return Netapi32.Load('DsGetSiteNameW')(ComputerName, SiteName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsmergeforesttrustinformationw
  public static DsMergeForestTrustInformationW(DomainName: LPCWSTR, NewForestTrustInfo: PLSA_FOREST_TRUST_INFORMATION, OldForestTrustInfo: PLSA_FOREST_TRUST_INFORMATION | NULL, MergedForestTrustInfo: PLSA_FOREST_TRUST_INFORMATION): DWORD {
    return Netapi32.Load('DsMergeForestTrustInformationW')(DomainName, NewForestTrustInfo, OldForestTrustInfo, MergedForestTrustInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsrole/nf-dsrole-dsrolefreememory
  public static DsRoleFreeMemory(Buffer: PVOID): VOID {
    return Netapi32.Load('DsRoleFreeMemory')(Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsrole/nf-dsrole-dsrolegetprimarydomaininformation
  public static DsRoleGetPrimaryDomainInformation(lpServer: LPCWSTR | NULL, InfoLevel: DSROLE_PRIMARY_DOMAIN_INFO_LEVEL, Buffer: PBYTE): DWORD {
    return Netapi32.Load('DsRoleGetPrimaryDomainInformation')(lpServer, InfoLevel, Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsvalidatesubnetnamea
  public static DsValidateSubnetNameA(SubnetName: LPCSTR): DWORD {
    return Netapi32.Load('DsValidateSubnetNameA')(SubnetName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsvalidatesubnetnamew
  public static DsValidateSubnetNameW(SubnetName: LPCWSTR): DWORD {
    return Netapi32.Load('DsValidateSubnetNameW')(SubnetName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netaddalternatecomputername
  public static NetAddAlternateComputerName(Server: LPCWSTR | NULL, AlternateName: LPCWSTR, DomainAccount: LPCWSTR | NULL, DomainAccountPassword: LPCWSTR | NULL, Reserved: ULONG): NET_API_STATUS {
    return Netapi32.Load('NetAddAlternateComputerName')(Server, AlternateName, DomainAccount, DomainAccountPassword, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netaddserviceaccount
  public static NetAddServiceAccount(ServerName: LPWSTR | NULL, AccountName: LPWSTR, Password: LPWSTR | NULL, Flags: DWORD): NTSTATUS {
    return Netapi32.Load('NetAddServiceAccount')(ServerName, AccountName, Password, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmapibuf/nf-lmapibuf-netapibufferallocate
  public static NetApiBufferAllocate(ByteCount: DWORD, Buffer: LPVOID): NET_API_STATUS {
    return Netapi32.Load('NetApiBufferAllocate')(ByteCount, Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmapibuf/nf-lmapibuf-netapibufferfree
  public static NetApiBufferFree(Buffer: LPVOID | NULL): NET_API_STATUS {
    return Netapi32.Load('NetApiBufferFree')(Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmapibuf/nf-lmapibuf-netapibufferreallocate
  public static NetApiBufferReallocate(OldBuffer: LPVOID | NULL, NewByteCount: DWORD, NewBuffer: LPVOID): NET_API_STATUS {
    return Netapi32.Load('NetApiBufferReallocate')(OldBuffer, NewByteCount, NewBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmapibuf/nf-lmapibuf-netapibuffersize
  public static NetApiBufferSize(Buffer: LPVOID, ByteCount: LPDWORD): NET_API_STATUS {
    return Netapi32.Load('NetApiBufferSize')(Buffer, ByteCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netconnectionenum
  public static NetConnectionEnum(servername: LMSTR | NULL, qualifier: LMSTR, level: DWORD, bufptr: LPBYTE, prefmaxlen: DWORD, entriesread: LPDWORD, totalentries: LPDWORD, resume_handle: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetConnectionEnum')(servername, qualifier, level, bufptr, prefmaxlen, entriesread, totalentries, resume_handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netcreateprovisioningpackage
  public static NetCreateProvisioningPackage(pProvisioningParams: PNETSETUP_PROVISIONING_PARAMS, ppPackageBinData: PBYTE | NULL, pdwPackageBinDataSize: LPDWORD | NULL, ppPackageTextData: LPWSTR | NULL): NET_API_STATUS {
    return Netapi32.Load('NetCreateProvisioningPackage')(pProvisioningParams, ppPackageBinData, pdwPackageBinDataSize, ppPackageTextData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netenumeratecomputernames
  public static NetEnumerateComputerNames(Server: LPCWSTR | NULL, NameType: NET_COMPUTER_NAME_TYPE, Reserved: ULONG, EntryCount: LPDWORD, ComputerNames: LPWSTR): NET_API_STATUS {
    return Netapi32.Load('NetEnumerateComputerNames')(Server, NameType, Reserved, EntryCount, ComputerNames);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netenumerateserviceaccounts
  public static NetEnumerateServiceAccounts(ServerName: LPWSTR | NULL, Flags: DWORD, AccountsCount: LPDWORD, Accounts: PZPWSTR): NTSTATUS {
    return Netapi32.Load('NetEnumerateServiceAccounts')(ServerName, Flags, AccountsCount, Accounts);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-netenumeratetrusteddomains
  public static NetEnumerateTrustedDomains(ServerName: LPWSTR | NULL, DomainNames: LPWSTR): NTSTATUS {
    return Netapi32.Load('NetEnumerateTrustedDomains')(ServerName, DomainNames);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netfileclose
  public static NetFileClose(servername: LMSTR | NULL, fileid: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetFileClose')(servername, fileid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netfileenum
  public static NetFileEnum(
    servername: LMSTR | NULL,
    basepath: LMSTR | NULL,
    username: LMSTR | NULL,
    level: DWORD,
    bufptr: LPBYTE,
    prefmaxlen: DWORD,
    entriesread: LPDWORD,
    totalentries: LPDWORD,
    resume_handle: PDWORD_PTR | NULL,
  ): NET_API_STATUS {
    return Netapi32.Load('NetFileEnum')(servername, basepath, username, level, bufptr, prefmaxlen, entriesread, totalentries, resume_handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netfilegetinfo
  public static NetFileGetInfo(servername: LMSTR | NULL, fileid: DWORD, level: DWORD, bufptr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetFileGetInfo')(servername, fileid, level, bufptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netfreeaadjoininformation
  public static NetFreeAadJoinInformation(pJoinInfo: PDSREG_JOIN_INFO | NULL): VOID {
    return Netapi32.Load('NetFreeAadJoinInformation')(pJoinInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netgetaadjoininformation
  public static NetGetAadJoinInformation(pcszTenantId: LPCWSTR | NULL, ppJoinInfo: PDSREG_JOIN_INFO): HRESULT {
    return Netapi32.Load('NetGetAadJoinInformation')(pcszTenantId, ppJoinInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgetanydcname
  public static NetGetAnyDCName(servername: LPCWSTR | NULL, domainname: LPCWSTR | NULL, bufptr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetGetAnyDCName')(servername, domainname, bufptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgetdcname
  public static NetGetDCName(servername: LPCWSTR | NULL, domainname: LPCWSTR | NULL, bufptr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetGetDCName')(servername, domainname, bufptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgetdisplayinformationindex
  public static NetGetDisplayInformationIndex(ServerName: LPCWSTR | NULL, Level: DWORD, Prefix: LPCWSTR, Index: LPDWORD): NET_API_STATUS {
    return Netapi32.Load('NetGetDisplayInformationIndex')(ServerName, Level, Prefix, Index);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netgetjoininformation
  public static NetGetJoinInformation(lpServer: LPCWSTR | NULL, lpNameBuffer: LPWSTR, BufferType: PNETSETUP_JOIN_STATUS): NET_API_STATUS {
    return Netapi32.Load('NetGetJoinInformation')(lpServer, lpNameBuffer, BufferType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netgetjoinableous
  public static NetGetJoinableOUs(lpServer: LPCWSTR | NULL, lpDomain: LPCWSTR, lpAccount: LPCWSTR | NULL, lpPassword: LPCWSTR | NULL, OUCount: LPDWORD, OUs: LPWSTR): NET_API_STATUS {
    return Netapi32.Load('NetGetJoinableOUs')(lpServer, lpDomain, lpAccount, lpPassword, OUCount, OUs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgroupadd
  public static NetGroupAdd(servername: LPCWSTR | NULL, level: DWORD, buf: LPBYTE, parm_err: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetGroupAdd')(servername, level, buf, parm_err);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgroupadduser
  public static NetGroupAddUser(servername: LPCWSTR | NULL, GroupName: LPCWSTR, username: LPCWSTR): NET_API_STATUS {
    return Netapi32.Load('NetGroupAddUser')(servername, GroupName, username);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgroupdel
  public static NetGroupDel(servername: LPCWSTR | NULL, groupname: LPCWSTR): NET_API_STATUS {
    return Netapi32.Load('NetGroupDel')(servername, groupname);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgroupdeluser
  public static NetGroupDelUser(servername: LPCWSTR | NULL, GroupName: LPCWSTR, Username: LPCWSTR): NET_API_STATUS {
    return Netapi32.Load('NetGroupDelUser')(servername, GroupName, Username);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgroupenum
  public static NetGroupEnum(servername: LPCWSTR | NULL, level: DWORD, bufptr: LPBYTE, prefmaxlen: DWORD, entriesread: LPDWORD, totalentries: LPDWORD, resume_handle: PDWORD_PTR | NULL): NET_API_STATUS {
    return Netapi32.Load('NetGroupEnum')(servername, level, bufptr, prefmaxlen, entriesread, totalentries, resume_handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgroupgetinfo
  public static NetGroupGetInfo(servername: LPCWSTR | NULL, groupname: LPCWSTR, level: DWORD, bufptr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetGroupGetInfo')(servername, groupname, level, bufptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgroupgetusers
  public static NetGroupGetUsers(servername: LPCWSTR | NULL, groupname: LPCWSTR, level: DWORD, bufptr: LPBYTE, prefmaxlen: DWORD, entriesread: LPDWORD, totalentries: LPDWORD, ResumeHandle: PDWORD_PTR | NULL): NET_API_STATUS {
    return Netapi32.Load('NetGroupGetUsers')(servername, groupname, level, bufptr, prefmaxlen, entriesread, totalentries, ResumeHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgroupsetinfo
  public static NetGroupSetInfo(servername: LPCWSTR | NULL, groupname: LPCWSTR, level: DWORD, buf: LPBYTE, parm_err: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetGroupSetInfo')(servername, groupname, level, buf, parm_err);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgroupsetusers
  public static NetGroupSetUsers(servername: LPCWSTR | NULL, groupname: LPCWSTR, level: DWORD, buf: LPBYTE, totalentries: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetGroupSetUsers')(servername, groupname, level, buf, totalentries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netisserviceaccount
  public static NetIsServiceAccount(ServerName: LPWSTR | NULL, AccountName: LPWSTR, IsService: LPBOOL): NTSTATUS {
    return Netapi32.Load('NetIsServiceAccount')(ServerName, AccountName, IsService);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netjoindomain
  public static NetJoinDomain(lpServer: LPCWSTR | NULL, lpDomain: LPCWSTR, lpMachineAccountOU: LPCWSTR | NULL, lpAccount: LPCWSTR | NULL, lpPassword: LPCWSTR | NULL, fJoinOptions: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetJoinDomain')(lpServer, lpDomain, lpMachineAccountOU, lpAccount, lpPassword, fJoinOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupadd
  public static NetLocalGroupAdd(servername: LPCWSTR | NULL, level: DWORD, buf: LPBYTE, parm_err: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupAdd')(servername, level, buf, parm_err);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupaddmember
  public static NetLocalGroupAddMember(servername: LPCWSTR | NULL, groupname: LPCWSTR, membersid: PSID): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupAddMember')(servername, groupname, membersid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupaddmembers
  public static NetLocalGroupAddMembers(servername: LPCWSTR | NULL, groupname: LPCWSTR, level: DWORD, buf: LPBYTE, totalentries: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupAddMembers')(servername, groupname, level, buf, totalentries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupdel
  public static NetLocalGroupDel(servername: LPCWSTR | NULL, groupname: LPCWSTR): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupDel')(servername, groupname);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupdelmember
  public static NetLocalGroupDelMember(servername: LPCWSTR | NULL, groupname: LPCWSTR, membersid: PSID): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupDelMember')(servername, groupname, membersid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupdelmembers
  public static NetLocalGroupDelMembers(servername: LPCWSTR | NULL, groupname: LPCWSTR, level: DWORD, buf: LPBYTE, totalentries: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupDelMembers')(servername, groupname, level, buf, totalentries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupenum
  public static NetLocalGroupEnum(servername: LPCWSTR | NULL, level: DWORD, bufptr: LPBYTE, prefmaxlen: DWORD, entriesread: LPDWORD, totalentries: LPDWORD, resumehandle: PDWORD_PTR | NULL): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupEnum')(servername, level, bufptr, prefmaxlen, entriesread, totalentries, resumehandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupgetinfo
  public static NetLocalGroupGetInfo(servername: LPCWSTR | NULL, groupname: LPCWSTR, level: DWORD, bufptr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupGetInfo')(servername, groupname, level, bufptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupgetmembers
  public static NetLocalGroupGetMembers(servername: LPCWSTR | NULL, localgroupname: LPCWSTR, level: DWORD, bufptr: LPBYTE, prefmaxlen: DWORD, entriesread: LPDWORD, totalentries: LPDWORD, resumehandle: PDWORD_PTR | NULL): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupGetMembers')(servername, localgroupname, level, bufptr, prefmaxlen, entriesread, totalentries, resumehandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupsetinfo
  public static NetLocalGroupSetInfo(servername: LPCWSTR | NULL, groupname: LPCWSTR, level: DWORD, buf: LPBYTE, parm_err: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupSetInfo')(servername, groupname, level, buf, parm_err);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupsetmembers
  public static NetLocalGroupSetMembers(servername: LPCWSTR | NULL, groupname: LPCWSTR, level: DWORD, buf: LPBYTE, totalentries: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupSetMembers')(servername, groupname, level, buf, totalentries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netprovisioncomputeraccount
  public static NetProvisionComputerAccount(
    lpDomain: LPCWSTR,
    lpMachineName: LPCWSTR,
    lpMachineAccountOU: LPCWSTR | NULL,
    lpDcName: LPCWSTR | NULL,
    dwOptions: DWORD,
    pProvisionBinData: PBYTE | NULL,
    pdwProvisionBinDataSize: LPDWORD | NULL,
    pProvisionTextData: LPWSTR | NULL,
  ): NET_API_STATUS {
    return Netapi32.Load('NetProvisionComputerAccount')(lpDomain, lpMachineName, lpMachineAccountOU, lpDcName, dwOptions, pProvisionBinData, pdwProvisionBinDataSize, pProvisionTextData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netquerydisplayinformation
  public static NetQueryDisplayInformation(ServerName: LPCWSTR | NULL, Level: DWORD, Index: DWORD, EntriesRequested: DWORD, PreferredMaximumLength: DWORD, ReturnedEntryCount: LPDWORD, SortedBuffer: PVOID): NET_API_STATUS {
    return Netapi32.Load('NetQueryDisplayInformation')(ServerName, Level, Index, EntriesRequested, PreferredMaximumLength, ReturnedEntryCount, SortedBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netqueryserviceaccount
  public static NetQueryServiceAccount(ServerName: LPWSTR | NULL, AccountName: LPWSTR, InfoLevel: DWORD, Buffer: PBYTE): NTSTATUS {
    return Netapi32.Load('NetQueryServiceAccount')(ServerName, AccountName, InfoLevel, Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netregisterdomainnamechangenotification
  public static NetRegisterDomainNameChangeNotification(NotificationEventHandle: PHANDLE): NET_API_STATUS {
    return Netapi32.Load('NetRegisterDomainNameChangeNotification')(NotificationEventHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmremutl/nf-lmremutl-netremotecomputersupports
  public static NetRemoteComputerSupports(UncServerName: LPCWSTR | NULL, OptionsWanted: DWORD, OptionsSupported: LPDWORD): NET_API_STATUS {
    return Netapi32.Load('NetRemoteComputerSupports')(UncServerName, OptionsWanted, OptionsSupported);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmremutl/nf-lmremutl-netremotetod
  public static NetRemoteTOD(UncServerName: LPCWSTR | NULL, BufferPtr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetRemoteTOD')(UncServerName, BufferPtr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netremovealternatecomputername
  public static NetRemoveAlternateComputerName(Server: LPCWSTR | NULL, AlternateName: LPCWSTR, DomainAccount: LPCWSTR | NULL, DomainAccountPassword: LPCWSTR | NULL, Reserved: ULONG): NET_API_STATUS {
    return Netapi32.Load('NetRemoveAlternateComputerName')(Server, AlternateName, DomainAccount, DomainAccountPassword, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netremoveserviceaccount
  public static NetRemoveServiceAccount(ServerName: LPWSTR | NULL, AccountName: LPWSTR, Flags: DWORD): NTSTATUS {
    return Netapi32.Load('NetRemoveServiceAccount')(ServerName, AccountName, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netrenamemachineindomain
  public static NetRenameMachineInDomain(lpServer: LPCWSTR | NULL, lpNewMachineName: LPCWSTR | NULL, lpAccount: LPCWSTR | NULL, lpPassword: LPCWSTR | NULL, fRenameOptions: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetRenameMachineInDomain')(lpServer, lpNewMachineName, lpAccount, lpPassword, fRenameOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netrequestofflinedomainjoin
  public static NetRequestOfflineDomainJoin(pProvisionBinData: PBYTE, cbProvisionBinDataSize: DWORD, dwOptions: DWORD, lpWindowsPath: LPCWSTR | NULL): NET_API_STATUS {
    return Netapi32.Load('NetRequestOfflineDomainJoin')(pProvisionBinData, cbProvisionBinDataSize, dwOptions, lpWindowsPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmat/nf-lmat-netschedulejobadd
  public static NetScheduleJobAdd(Servername: LPCWSTR | NULL, Buffer: LPBYTE, JobId: LPDWORD): NET_API_STATUS {
    return Netapi32.Load('NetScheduleJobAdd')(Servername, Buffer, JobId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmat/nf-lmat-netschedulejobdel
  public static NetScheduleJobDel(Servername: LPCWSTR | NULL, MinJobId: DWORD, MaxJobId: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetScheduleJobDel')(Servername, MinJobId, MaxJobId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmat/nf-lmat-netschedulejobenum
  public static NetScheduleJobEnum(Servername: LPCWSTR | NULL, PointerToBuffer: LPBYTE, PreferredMaximumLength: DWORD, EntriesRead: LPDWORD, TotalEntries: LPDWORD, ResumeHandle: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetScheduleJobEnum')(Servername, PointerToBuffer, PreferredMaximumLength, EntriesRead, TotalEntries, ResumeHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmat/nf-lmat-netschedulejobgetinfo
  public static NetScheduleJobGetInfo(Servername: LPCWSTR | NULL, JobId: DWORD, PointerToBuffer: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetScheduleJobGetInfo')(Servername, JobId, PointerToBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmserver/nf-lmserver-netserverdiskenum
  public static NetServerDiskEnum(servername: LPCWSTR | NULL, level: DWORD, bufptr: LPBYTE, prefmaxlen: DWORD, entriesread: LPDWORD, totalentries: LPDWORD, resume_handle: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetServerDiskEnum')(servername, level, bufptr, prefmaxlen, entriesread, totalentries, resume_handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmserver/nf-lmserver-netserverenum
  public static NetServerEnum(
    servername: LMCSTR | NULL,
    level: DWORD,
    bufptr: LPBYTE,
    prefmaxlen: DWORD,
    entriesread: LPDWORD,
    totalentries: LPDWORD,
    servertype: DWORD,
    domain: LMCSTR | NULL,
    resume_handle: LPDWORD | NULL,
  ): NET_API_STATUS {
    return Netapi32.Load('NetServerEnum')(servername, level, bufptr, prefmaxlen, entriesread, totalentries, servertype, domain, resume_handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmserver/nf-lmserver-netservergetinfo
  public static NetServerGetInfo(servername: LMSTR | NULL, level: DWORD, bufptr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetServerGetInfo')(servername, level, bufptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmserver/nf-lmserver-netserversetinfo
  public static NetServerSetInfo(servername: LMSTR | NULL, level: DWORD, buf: LPBYTE, ParmError: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetServerSetInfo')(servername, level, buf, ParmError);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmserver/nf-lmserver-netservertransportadd
  public static NetServerTransportAdd(servername: LMSTR | NULL, level: DWORD, bufptr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetServerTransportAdd')(servername, level, bufptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmserver/nf-lmserver-netservertransportaddex
  public static NetServerTransportAddEx(servername: LMSTR | NULL, level: DWORD, bufptr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetServerTransportAddEx')(servername, level, bufptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmserver/nf-lmserver-netservertransportdel
  public static NetServerTransportDel(servername: LMSTR | NULL, level: DWORD, bufptr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetServerTransportDel')(servername, level, bufptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmserver/nf-lmserver-netservertransportenum
  public static NetServerTransportEnum(servername: LMSTR | NULL, level: DWORD, bufptr: LPBYTE, prefmaxlen: DWORD, entriesread: LPDWORD, totalentries: LPDWORD, resume_handle: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetServerTransportEnum')(servername, level, bufptr, prefmaxlen, entriesread, totalentries, resume_handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmsvc/nf-lmsvc-netservicecontrol
  public static NetServiceControl(servername: LPCWSTR | NULL, service: LPCWSTR, opcode: DWORD, arg: DWORD, bufptr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetServiceControl')(servername, service, opcode, arg, bufptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmsvc/nf-lmsvc-netserviceenum
  public static NetServiceEnum(servername: LPCWSTR | NULL, level: DWORD, bufptr: LPBYTE, prefmaxlen: DWORD, entriesread: LPDWORD, totalentries: LPDWORD, resume_handle: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetServiceEnum')(servername, level, bufptr, prefmaxlen, entriesread, totalentries, resume_handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmsvc/nf-lmsvc-netservicegetinfo
  public static NetServiceGetInfo(servername: LPCWSTR | NULL, service: LPCWSTR, level: DWORD, bufptr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetServiceGetInfo')(servername, service, level, bufptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmsvc/nf-lmsvc-netserviceinstall
  public static NetServiceInstall(servername: LPCWSTR | NULL, service: LPCWSTR, argc: DWORD, argv: LPCWSTR, bufptr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetServiceInstall')(servername, service, argc, argv, bufptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netsessiondel
  public static NetSessionDel(servername: LMSTR | NULL, UncClientName: LMSTR | NULL, username: LMSTR | NULL): NET_API_STATUS {
    return Netapi32.Load('NetSessionDel')(servername, UncClientName, username);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netsessionenum
  public static NetSessionEnum(
    servername: LMSTR | NULL,
    UncClientName: LMSTR | NULL,
    username: LMSTR | NULL,
    level: DWORD,
    bufptr: LPBYTE,
    prefmaxlen: DWORD,
    entriesread: LPDWORD,
    totalentries: LPDWORD,
    resume_handle: LPDWORD | NULL,
  ): NET_API_STATUS {
    return Netapi32.Load('NetSessionEnum')(servername, UncClientName, username, level, bufptr, prefmaxlen, entriesread, totalentries, resume_handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netsessiongetinfo
  public static NetSessionGetInfo(servername: LMSTR | NULL, UncClientName: LMSTR, username: LMSTR, level: DWORD, bufptr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetSessionGetInfo')(servername, UncClientName, username, level, bufptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netshareadd
  public static NetShareAdd(servername: LMSTR | NULL, level: DWORD, buf: LPBYTE, parm_err: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetShareAdd')(servername, level, buf, parm_err);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netsharecheck
  public static NetShareCheck(servername: LMSTR | NULL, device: LMSTR, type: LPDWORD): NET_API_STATUS {
    return Netapi32.Load('NetShareCheck')(servername, device, type);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netsharedel
  public static NetShareDel(servername: LMSTR | NULL, netname: LMSTR, reserved: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetShareDel')(servername, netname, reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netsharedelex
  public static NetShareDelEx(servername: LMSTR | NULL, level: DWORD, buf: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetShareDelEx')(servername, level, buf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netsharedelsticky
  public static NetShareDelSticky(servername: LMSTR | NULL, netname: LMSTR, reserved: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetShareDelSticky')(servername, netname, reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netshareenum
  public static NetShareEnum(servername: LMSTR | NULL, level: DWORD, bufptr: LPBYTE, prefmaxlen: DWORD, entriesread: LPDWORD, totalentries: LPDWORD, resume_handle: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetShareEnum')(servername, level, bufptr, prefmaxlen, entriesread, totalentries, resume_handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netshareenumsticky
  public static NetShareEnumSticky(servername: LMSTR | NULL, level: DWORD, bufptr: LPBYTE, prefmaxlen: DWORD, entriesread: LPDWORD, totalentries: LPDWORD, resume_handle: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetShareEnumSticky')(servername, level, bufptr, prefmaxlen, entriesread, totalentries, resume_handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netsharegetinfo
  public static NetShareGetInfo(servername: LMSTR | NULL, netname: LMSTR, level: DWORD, bufptr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetShareGetInfo')(servername, netname, level, bufptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netsharesetinfo
  public static NetShareSetInfo(servername: LMSTR | NULL, netname: LMSTR, level: DWORD, buf: LPBYTE, parm_err: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetShareSetInfo')(servername, netname, level, buf, parm_err);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmstats/nf-lmstats-netstatisticsget
  public static NetStatisticsGet(ServerName: LMSTR | NULL, Service: LMSTR, Level: DWORD, Options: DWORD, Buffer: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetStatisticsGet')(ServerName, Service, Level, Options, Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netunjoindomain
  public static NetUnjoinDomain(lpServer: LPCWSTR | NULL, lpAccount: LPCWSTR | NULL, lpPassword: LPCWSTR | NULL, fUnjoinOptions: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetUnjoinDomain')(lpServer, lpAccount, lpPassword, fUnjoinOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netunregisterdomainnamechangenotification
  public static NetUnregisterDomainNameChangeNotification(NotificationEventHandle: HANDLE): NET_API_STATUS {
    return Netapi32.Load('NetUnregisterDomainNameChangeNotification')(NotificationEventHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmuse/nf-lmuse-netuseadd
  public static NetUseAdd(UncServerName: LMSTR | NULL, Level: DWORD, Buf: LPBYTE, ParmError: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetUseAdd')(UncServerName, Level, Buf, ParmError);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmuse/nf-lmuse-netusedel
  public static NetUseDel(UncServerName: LMSTR | NULL, UseName: LMSTR, ForceCond: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetUseDel')(UncServerName, UseName, ForceCond);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmuse/nf-lmuse-netuseenum
  public static NetUseEnum(UncServerName: LMSTR | NULL, LevelFlags: DWORD, BufPtr: LPBYTE, PreferedMaximumSize: DWORD, EntriesRead: LPDWORD, TotalEntries: LPDWORD, ResumeHandle: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetUseEnum')(UncServerName, LevelFlags, BufPtr, PreferedMaximumSize, EntriesRead, TotalEntries, ResumeHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmuse/nf-lmuse-netusegetinfo
  public static NetUseGetInfo(UncServerName: LMSTR | NULL, UseName: LMSTR, LevelFlags: DWORD, BufPtr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetUseGetInfo')(UncServerName, UseName, LevelFlags, BufPtr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netuseradd
  public static NetUserAdd(servername: LPCWSTR | NULL, level: DWORD, buf: LPBYTE, parm_err: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetUserAdd')(servername, level, buf, parm_err);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netuserchangepassword
  public static NetUserChangePassword(domainname: LPCWSTR | NULL, username: LPCWSTR | NULL, oldpassword: LPCWSTR, newpassword: LPCWSTR): NET_API_STATUS {
    return Netapi32.Load('NetUserChangePassword')(domainname, username, oldpassword, newpassword);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netuserdel
  public static NetUserDel(servername: LPCWSTR | NULL, username: LPCWSTR): NET_API_STATUS {
    return Netapi32.Load('NetUserDel')(servername, username);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netuserenum
  public static NetUserEnum(servername: LPCWSTR | NULL, level: DWORD, filter: DWORD, bufptr: LPBYTE, prefmaxlen: DWORD, entriesread: LPDWORD, totalentries: LPDWORD, resume_handle: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetUserEnum')(servername, level, filter, bufptr, prefmaxlen, entriesread, totalentries, resume_handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netusergetgroups
  public static NetUserGetGroups(servername: LPCWSTR | NULL, username: LPCWSTR, level: DWORD, bufptr: LPBYTE, prefmaxlen: DWORD, entriesread: LPDWORD, totalentries: LPDWORD): NET_API_STATUS {
    return Netapi32.Load('NetUserGetGroups')(servername, username, level, bufptr, prefmaxlen, entriesread, totalentries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netusergetinfo
  public static NetUserGetInfo(servername: LPCWSTR | NULL, username: LPCWSTR, level: DWORD, bufptr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetUserGetInfo')(servername, username, level, bufptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netusergetlocalgroups
  public static NetUserGetLocalGroups(servername: LPCWSTR | NULL, username: LPCWSTR, level: DWORD, flags: DWORD, bufptr: LPBYTE, prefmaxlen: DWORD, entriesread: LPDWORD, totalentries: LPDWORD): NET_API_STATUS {
    return Netapi32.Load('NetUserGetLocalGroups')(servername, username, level, flags, bufptr, prefmaxlen, entriesread, totalentries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netusermodalsget
  public static NetUserModalsGet(servername: LPCWSTR | NULL, level: DWORD, bufptr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetUserModalsGet')(servername, level, bufptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netusermodalsset
  public static NetUserModalsSet(servername: LPCWSTR | NULL, level: DWORD, buf: LPBYTE, parm_err: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetUserModalsSet')(servername, level, buf, parm_err);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netusersetgroups
  public static NetUserSetGroups(servername: LPCWSTR | NULL, username: LPCWSTR, level: DWORD, buf: LPBYTE, num_entries: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetUserSetGroups')(servername, username, level, buf, num_entries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netusersetinfo
  public static NetUserSetInfo(servername: LPCWSTR | NULL, username: LPCWSTR, level: DWORD, buf: LPBYTE, parm_err: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetUserSetInfo')(servername, username, level, buf, parm_err);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netvalidatename
  public static NetValidateName(lpServer: LPCWSTR | NULL, lpName: LPCWSTR, lpAccount: LPCWSTR | NULL, lpPassword: LPCWSTR | NULL, NameType: NETSETUP_NAME_TYPE): NET_API_STATUS {
    return Netapi32.Load('NetValidateName')(lpServer, lpName, lpAccount, lpPassword, NameType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netvalidatepasswordpolicy
  public static NetValidatePasswordPolicy(ServerName: LPCWSTR | NULL, Qualifier: LPVOID | NULL, ValidationType: NET_VALIDATE_PASSWORD_TYPE, InputArg: LPVOID, OutputArg: LPVOID): NET_API_STATUS {
    return Netapi32.Load('NetValidatePasswordPolicy')(ServerName, Qualifier, ValidationType, InputArg, OutputArg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netvalidatepasswordpolicyfree
  public static NetValidatePasswordPolicyFree(OutputArg: LPVOID): NET_API_STATUS {
    return Netapi32.Load('NetValidatePasswordPolicyFree')(OutputArg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmwksta/nf-lmwksta-netwkstagetinfo
  public static NetWkstaGetInfo(servername: LMSTR | NULL, level: DWORD, bufptr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetWkstaGetInfo')(servername, level, bufptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmwksta/nf-lmwksta-netwkstasetinfo
  public static NetWkstaSetInfo(servername: LMSTR | NULL, level: DWORD, buf: LPBYTE, parm_err: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetWkstaSetInfo')(servername, level, buf, parm_err);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmwksta/nf-lmwksta-netwkstatransportadd
  public static NetWkstaTransportAdd(servername: LMSTR | NULL, level: DWORD, buf: LPBYTE, parm_err: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetWkstaTransportAdd')(servername, level, buf, parm_err);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmwksta/nf-lmwksta-netwkstatransportdel
  public static NetWkstaTransportDel(servername: LMSTR | NULL, transportname: LMSTR, ucond: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetWkstaTransportDel')(servername, transportname, ucond);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmwksta/nf-lmwksta-netwkstatransportenum
  public static NetWkstaTransportEnum(servername: LMSTR | NULL, level: DWORD, bufptr: LPBYTE, prefmaxlen: DWORD, entriesread: LPDWORD, totalentries: LPDWORD, resume_handle: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetWkstaTransportEnum')(servername, level, bufptr, prefmaxlen, entriesread, totalentries, resume_handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmwksta/nf-lmwksta-netwkstauserenum
  public static NetWkstaUserEnum(servername: LMSTR | NULL, level: DWORD, bufptr: LPBYTE, prefmaxlen: DWORD, entriesread: LPDWORD, totalentries: LPDWORD, resumehandle: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetWkstaUserEnum')(servername, level, bufptr, prefmaxlen, entriesread, totalentries, resumehandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmwksta/nf-lmwksta-netwkstausergetinfo
  public static NetWkstaUserGetInfo(reserved: LMSTR | NULL, level: DWORD, bufptr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetWkstaUserGetInfo')(reserved, level, bufptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmwksta/nf-lmwksta-netwkstausersetinfo
  public static NetWkstaUserSetInfo(reserved: LMSTR | NULL, level: DWORD, buf: LPBYTE, parm_err: LPDWORD | NULL): NET_API_STATUS {
    return Netapi32.Load('NetWkstaUserSetInfo')(reserved, level, buf, parm_err);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/nb30/nf-nb30-netbios
  public static Netbios(pncb: PNCB): UCHAR {
    return Netapi32.Load('Netbios')(pncb);
  }
}

export default Netapi32;
