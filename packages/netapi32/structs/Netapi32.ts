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
  NULLABLE,
  OPTIONAL,
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
  public static DavAddConnection(ConnectionHandle_in_out: PHANDLE, RemoteName: LPCWSTR, UserName: OPTIONAL<LPCWSTR>, Password: OPTIONAL<LPCWSTR>, ClientCert: PBYTE, CertSize: DWORD): DWORD {
    return Netapi32.Load('DavAddConnection')(ConnectionHandle_in_out, RemoteName, UserName, Password, ClientCert, CertSize);
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
  public static DavGetExtendedError(hFile: HANDLE, ExtError_out: PDWORD, ExtErrorString_out: LPWSTR, cChSize_in_out: PDWORD): DWORD {
    return Netapi32.Load('DavGetExtendedError')(hFile, ExtError_out, ExtErrorString_out, cChSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/davclnt/nf-davclnt-davgethttpfromuncpath
  public static DavGetHTTPFromUNCPath(UncPath: LPCWSTR, Url_out: OPTIONAL<LPWSTR>, lpSize_in_out: LPDWORD): DWORD {
    return Netapi32.Load('DavGetHTTPFromUNCPath')(UncPath, Url_out, lpSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/davclnt/nf-davclnt-davgetuncfromhttppath
  public static DavGetUNCFromHTTPPath(Url: LPCWSTR, UncPath_out: OPTIONAL<LPWSTR>, lpSize_in_out: LPDWORD): DWORD {
    return Netapi32.Load('DavGetUNCFromHTTPPath')(Url, UncPath_out, lpSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsaddresstositenamesa
  public static DsAddressToSiteNamesA(ComputerName: OPTIONAL<LPCSTR>, EntryCount: DWORD, SocketAddresses: PSOCKET_ADDRESS, SiteNames_out: LPSTR): DWORD {
    return Netapi32.Load('DsAddressToSiteNamesA')(ComputerName, EntryCount, SocketAddresses, SiteNames_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsaddresstositenamesexa
  public static DsAddressToSiteNamesExA(ComputerName: OPTIONAL<LPCSTR>, EntryCount: DWORD, SocketAddresses: PSOCKET_ADDRESS, SiteNames_out: LPSTR, SubnetNames_out: LPSTR): DWORD {
    return Netapi32.Load('DsAddressToSiteNamesExA')(ComputerName, EntryCount, SocketAddresses, SiteNames_out, SubnetNames_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsaddresstositenamesexw
  public static DsAddressToSiteNamesExW(ComputerName: OPTIONAL<LPCWSTR>, EntryCount: DWORD, SocketAddresses: PSOCKET_ADDRESS, SiteNames_out: LPWSTR, SubnetNames_out: LPWSTR): DWORD {
    return Netapi32.Load('DsAddressToSiteNamesExW')(ComputerName, EntryCount, SocketAddresses, SiteNames_out, SubnetNames_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsaddresstositenamesw
  public static DsAddressToSiteNamesW(ComputerName: OPTIONAL<LPCWSTR>, EntryCount: DWORD, SocketAddresses: PSOCKET_ADDRESS, SiteNames_out: LPWSTR): DWORD {
    return Netapi32.Load('DsAddressToSiteNamesW')(ComputerName, EntryCount, SocketAddresses, SiteNames_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsderegisterdnshostrecordsa
  public static DsDeregisterDnsHostRecordsA(ServerName: OPTIONAL<LPSTR>, DnsDomainName: OPTIONAL<LPSTR>, DomainGuid: OPTIONAL<PGUID>, DsaGuid: OPTIONAL<PGUID>, DnsHostName: LPSTR): DWORD {
    return Netapi32.Load('DsDeregisterDnsHostRecordsA')(ServerName, DnsDomainName, DomainGuid, DsaGuid, DnsHostName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsderegisterdnshostrecordsw
  public static DsDeregisterDnsHostRecordsW(ServerName: OPTIONAL<LPWSTR>, DnsDomainName: OPTIONAL<LPWSTR>, DomainGuid: OPTIONAL<PGUID>, DsaGuid: OPTIONAL<PGUID>, DnsHostName: LPWSTR): DWORD {
    return Netapi32.Load('DsDeregisterDnsHostRecordsW')(ServerName, DnsDomainName, DomainGuid, DsaGuid, DnsHostName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsenumeratedomaintrustsa
  public static DsEnumerateDomainTrustsA(ServerName: OPTIONAL<LPSTR>, Flags: ULONG, Domains_out: PDS_DOMAIN_TRUSTSA, DomainCount_out: PULONG): DWORD {
    return Netapi32.Load('DsEnumerateDomainTrustsA')(ServerName, Flags, Domains_out, DomainCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsenumeratedomaintrustsw
  public static DsEnumerateDomainTrustsW(ServerName: OPTIONAL<LPWSTR>, Flags: ULONG, Domains_out: PDS_DOMAIN_TRUSTSW, DomainCount_out: PULONG): DWORD {
    return Netapi32.Load('DsEnumerateDomainTrustsW')(ServerName, Flags, Domains_out, DomainCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetdcclosew
  public static DsGetDcCloseW(GetDcContextHandle: HANDLE): VOID {
    return Netapi32.Load('DsGetDcCloseW')(GetDcContextHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetdcnamea
  public static DsGetDcNameA(ComputerName: OPTIONAL<LPCSTR>, DomainName: OPTIONAL<LPCSTR>, DomainGuid: OPTIONAL<PGUID>, SiteName: OPTIONAL<LPCSTR>, Flags: ULONG, DomainControllerInfo_out: PDOMAIN_CONTROLLER_INFOA): DWORD {
    return Netapi32.Load('DsGetDcNameA')(ComputerName, DomainName, DomainGuid, SiteName, Flags, DomainControllerInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetdcnamew
  public static DsGetDcNameW(ComputerName: OPTIONAL<LPCWSTR>, DomainName: OPTIONAL<LPCWSTR>, DomainGuid: OPTIONAL<PGUID>, SiteName: OPTIONAL<LPCWSTR>, Flags: ULONG, DomainControllerInfo_out: PDOMAIN_CONTROLLER_INFOW): DWORD {
    return Netapi32.Load('DsGetDcNameW')(ComputerName, DomainName, DomainGuid, SiteName, Flags, DomainControllerInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetdcnexta
  public static DsGetDcNextA(GetDcContextHandle: HANDLE, SockAddressCount_out: OPTIONAL<PULONG>, SockAddresses_out: OPTIONAL<LPSOCKET_ADDRESS>, DnsHostName_out: OPTIONAL<LPSTR>): DWORD {
    return Netapi32.Load('DsGetDcNextA')(GetDcContextHandle, SockAddressCount_out, SockAddresses_out, DnsHostName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetdcnextw
  public static DsGetDcNextW(GetDcContextHandle: HANDLE, SockAddressCount_out: OPTIONAL<PULONG>, SockAddresses_out: OPTIONAL<LPSOCKET_ADDRESS>, DnsHostName_out: OPTIONAL<LPWSTR>): DWORD {
    return Netapi32.Load('DsGetDcNextW')(GetDcContextHandle, SockAddressCount_out, SockAddresses_out, DnsHostName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetdcopena
  public static DsGetDcOpenA(DnsName: LPCSTR, OptionFlags: ULONG, SiteName: OPTIONAL<LPCSTR>, DomainGuid: OPTIONAL<PGUID>, DnsForestName: OPTIONAL<LPCSTR>, DcFlags: ULONG, RetGetDcContext_out: PHANDLE): DWORD {
    return Netapi32.Load('DsGetDcOpenA')(DnsName, OptionFlags, SiteName, DomainGuid, DnsForestName, DcFlags, RetGetDcContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetdcopenw
  public static DsGetDcOpenW(DnsName: LPCWSTR, OptionFlags: ULONG, SiteName: OPTIONAL<LPCWSTR>, DomainGuid: OPTIONAL<PGUID>, DnsForestName: OPTIONAL<LPCWSTR>, DcFlags: ULONG, RetGetDcContext_out: PHANDLE): DWORD {
    return Netapi32.Load('DsGetDcOpenW')(DnsName, OptionFlags, SiteName, DomainGuid, DnsForestName, DcFlags, RetGetDcContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetdcsitecoveragea
  public static DsGetDcSiteCoverageA(ServerName: OPTIONAL<LPCSTR>, EntryCount_out: PULONG, SiteNames_out: LPSTR): DWORD {
    return Netapi32.Load('DsGetDcSiteCoverageA')(ServerName, EntryCount_out, SiteNames_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetdcsitecoveragew
  public static DsGetDcSiteCoverageW(ServerName: OPTIONAL<LPCWSTR>, EntryCount_out: PULONG, SiteNames_out: LPWSTR): DWORD {
    return Netapi32.Load('DsGetDcSiteCoverageW')(ServerName, EntryCount_out, SiteNames_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetforesttrustinformationw
  public static DsGetForestTrustInformationW(ServerName: OPTIONAL<LPCWSTR>, TrustedDomainName: OPTIONAL<LPCWSTR>, Flags: DWORD, ForestTrustInfo_out: PLSA_FOREST_TRUST_INFORMATION): DWORD {
    return Netapi32.Load('DsGetForestTrustInformationW')(ServerName, TrustedDomainName, Flags, ForestTrustInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetsitenamea
  public static DsGetSiteNameA(ComputerName: OPTIONAL<LPCSTR>, SiteName_out: LPSTR): DWORD {
    return Netapi32.Load('DsGetSiteNameA')(ComputerName, SiteName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsgetsitenamew
  public static DsGetSiteNameW(ComputerName: OPTIONAL<LPCWSTR>, SiteName_out: LPWSTR): DWORD {
    return Netapi32.Load('DsGetSiteNameW')(ComputerName, SiteName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-dsmergeforesttrustinformationw
  public static DsMergeForestTrustInformationW(
    DomainName: LPCWSTR,
    NewForestTrustInfo: PLSA_FOREST_TRUST_INFORMATION,
    OldForestTrustInfo: OPTIONAL<PLSA_FOREST_TRUST_INFORMATION>,
    MergedForestTrustInfo_out: PLSA_FOREST_TRUST_INFORMATION,
  ): DWORD {
    return Netapi32.Load('DsMergeForestTrustInformationW')(DomainName, NewForestTrustInfo, OldForestTrustInfo, MergedForestTrustInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsrole/nf-dsrole-dsrolefreememory
  public static DsRoleFreeMemory(Buffer: PVOID): VOID {
    return Netapi32.Load('DsRoleFreeMemory')(Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsrole/nf-dsrole-dsrolegetprimarydomaininformation
  public static DsRoleGetPrimaryDomainInformation(lpServer: OPTIONAL<LPCWSTR>, InfoLevel: DSROLE_PRIMARY_DOMAIN_INFO_LEVEL, Buffer_out: PBYTE): DWORD {
    return Netapi32.Load('DsRoleGetPrimaryDomainInformation')(lpServer, InfoLevel, Buffer_out);
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
  public static NetAddAlternateComputerName(Server: OPTIONAL<LPCWSTR>, AlternateName: LPCWSTR, DomainAccount: OPTIONAL<LPCWSTR>, DomainAccountPassword: OPTIONAL<LPCWSTR>, Reserved: ULONG): NET_API_STATUS {
    return Netapi32.Load('NetAddAlternateComputerName')(Server, AlternateName, DomainAccount, DomainAccountPassword, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netaddserviceaccount
  public static NetAddServiceAccount(ServerName: OPTIONAL<LPWSTR>, AccountName: LPWSTR, Password: LPWSTR, Flags: DWORD): NTSTATUS {
    return Netapi32.Load('NetAddServiceAccount')(ServerName, AccountName, Password, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmapibuf/nf-lmapibuf-netapibufferallocate
  public static NetApiBufferAllocate(ByteCount: DWORD, Buffer_out: LPVOID): NET_API_STATUS {
    return Netapi32.Load('NetApiBufferAllocate')(ByteCount, Buffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmapibuf/nf-lmapibuf-netapibufferfree
  public static NetApiBufferFree(Buffer: OPTIONAL<LPVOID>): NET_API_STATUS {
    return Netapi32.Load('NetApiBufferFree')(Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmapibuf/nf-lmapibuf-netapibufferreallocate
  public static NetApiBufferReallocate(OldBuffer: OPTIONAL<LPVOID>, NewByteCount: DWORD, NewBuffer_out: LPVOID): NET_API_STATUS {
    return Netapi32.Load('NetApiBufferReallocate')(OldBuffer, NewByteCount, NewBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmapibuf/nf-lmapibuf-netapibuffersize
  public static NetApiBufferSize(Buffer: LPVOID, ByteCount_out: LPDWORD): NET_API_STATUS {
    return Netapi32.Load('NetApiBufferSize')(Buffer, ByteCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netconnectionenum
  public static NetConnectionEnum(
    servername: OPTIONAL<LMSTR>,
    qualifier: LMSTR,
    level: DWORD,
    bufptr_out: LPBYTE,
    prefmaxlen: DWORD,
    entriesread_out: LPDWORD,
    totalentries_out: LPDWORD,
    resume_handle_in_out: OPTIONAL<LPDWORD>,
  ): NET_API_STATUS {
    return Netapi32.Load('NetConnectionEnum')(servername, qualifier, level, bufptr_out, prefmaxlen, entriesread_out, totalentries_out, resume_handle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netcreateprovisioningpackage
  public static NetCreateProvisioningPackage(pProvisioningParams: PNETSETUP_PROVISIONING_PARAMS, ppPackageBinData_out: OPTIONAL<PBYTE>, pdwPackageBinDataSize_out: OPTIONAL<LPDWORD>, ppPackageTextData_out: OPTIONAL<LPWSTR>): NET_API_STATUS {
    return Netapi32.Load('NetCreateProvisioningPackage')(pProvisioningParams, ppPackageBinData_out, pdwPackageBinDataSize_out, ppPackageTextData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netenumeratecomputernames
  public static NetEnumerateComputerNames(Server: OPTIONAL<LPCWSTR>, NameType: NET_COMPUTER_NAME_TYPE, Reserved: ULONG, EntryCount_out: LPDWORD, ComputerNames_out: LPWSTR): NET_API_STATUS {
    return Netapi32.Load('NetEnumerateComputerNames')(Server, NameType, Reserved, EntryCount_out, ComputerNames_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netenumerateserviceaccounts
  public static NetEnumerateServiceAccounts(ServerName: OPTIONAL<LPWSTR>, Flags: DWORD, AccountsCount_out: LPDWORD, Accounts_out: PZPWSTR): NTSTATUS {
    return Netapi32.Load('NetEnumerateServiceAccounts')(ServerName, Flags, AccountsCount_out, Accounts_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dsgetdc/nf-dsgetdc-netenumeratetrusteddomains
  public static NetEnumerateTrustedDomains(ServerName: OPTIONAL<LPWSTR>, DomainNames_out: LPWSTR): NTSTATUS {
    return Netapi32.Load('NetEnumerateTrustedDomains')(ServerName, DomainNames_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netfileclose
  public static NetFileClose(servername: OPTIONAL<LMSTR>, fileid: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetFileClose')(servername, fileid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netfileenum
  public static NetFileEnum(
    servername: OPTIONAL<LMSTR>,
    basepath: OPTIONAL<LMSTR>,
    username: OPTIONAL<LMSTR>,
    level: DWORD,
    bufptr_out: LPBYTE,
    prefmaxlen: DWORD,
    entriesread_out: LPDWORD,
    totalentries_out: LPDWORD,
    resume_handle_in_out: OPTIONAL<PDWORD_PTR>,
  ): NET_API_STATUS {
    return Netapi32.Load('NetFileEnum')(servername, basepath, username, level, bufptr_out, prefmaxlen, entriesread_out, totalentries_out, resume_handle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netfilegetinfo
  public static NetFileGetInfo(servername: OPTIONAL<LMSTR>, fileid: DWORD, level: DWORD, bufptr_out: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetFileGetInfo')(servername, fileid, level, bufptr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netfreeaadjoininformation
  public static NetFreeAadJoinInformation(pJoinInfo: OPTIONAL<PDSREG_JOIN_INFO>): VOID {
    return Netapi32.Load('NetFreeAadJoinInformation')(pJoinInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netgetaadjoininformation
  public static NetGetAadJoinInformation(pcszTenantId: OPTIONAL<LPCWSTR>, ppJoinInfo_out: PDSREG_JOIN_INFO): HRESULT {
    return Netapi32.Load('NetGetAadJoinInformation')(pcszTenantId, ppJoinInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgetanydcname
  public static NetGetAnyDCName(servername: OPTIONAL<LPCWSTR>, domainname: OPTIONAL<LPCWSTR>, bufptr_out: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetGetAnyDCName')(servername, domainname, bufptr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgetdcname
  public static NetGetDCName(servername: OPTIONAL<LPCWSTR>, domainname: OPTIONAL<LPCWSTR>, bufptr_out: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetGetDCName')(servername, domainname, bufptr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgetdisplayinformationindex
  public static NetGetDisplayInformationIndex(ServerName: OPTIONAL<LPCWSTR>, Level: DWORD, Prefix: LPCWSTR, Index_out: LPDWORD): NET_API_STATUS {
    return Netapi32.Load('NetGetDisplayInformationIndex')(ServerName, Level, Prefix, Index_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netgetjoininformation
  public static NetGetJoinInformation(lpServer: OPTIONAL<LPCWSTR>, lpNameBuffer_out: LPWSTR, BufferType_out: PNETSETUP_JOIN_STATUS): NET_API_STATUS {
    return Netapi32.Load('NetGetJoinInformation')(lpServer, lpNameBuffer_out, BufferType_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netgetjoinableous
  public static NetGetJoinableOUs(lpServer: NULLABLE<LPCWSTR>, lpDomain: LPCWSTR, lpAccount: OPTIONAL<LPCWSTR>, lpPassword: OPTIONAL<LPCWSTR>, OUCount_out: LPDWORD, OUs_out: LPWSTR): NET_API_STATUS {
    return Netapi32.Load('NetGetJoinableOUs')(lpServer, lpDomain, lpAccount, lpPassword, OUCount_out, OUs_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgroupadd
  public static NetGroupAdd(servername: OPTIONAL<LPCWSTR>, level: DWORD, buf: LPBYTE, parm_err_out: OPTIONAL<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetGroupAdd')(servername, level, buf, parm_err_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgroupadduser
  public static NetGroupAddUser(servername: OPTIONAL<LPCWSTR>, GroupName: LPCWSTR, username: LPCWSTR): NET_API_STATUS {
    return Netapi32.Load('NetGroupAddUser')(servername, GroupName, username);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgroupdel
  public static NetGroupDel(servername: OPTIONAL<LPCWSTR>, groupname: LPCWSTR): NET_API_STATUS {
    return Netapi32.Load('NetGroupDel')(servername, groupname);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgroupdeluser
  public static NetGroupDelUser(servername: OPTIONAL<LPCWSTR>, GroupName: LPCWSTR, Username: LPCWSTR): NET_API_STATUS {
    return Netapi32.Load('NetGroupDelUser')(servername, GroupName, Username);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgroupenum
  public static NetGroupEnum(servername: OPTIONAL<LPCWSTR>, level: DWORD, bufptr_out: LPBYTE, prefmaxlen: DWORD, entriesread_out: LPDWORD, totalentries_out: LPDWORD, resume_handle_in_out: OPTIONAL<PDWORD_PTR>): NET_API_STATUS {
    return Netapi32.Load('NetGroupEnum')(servername, level, bufptr_out, prefmaxlen, entriesread_out, totalentries_out, resume_handle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgroupgetinfo
  public static NetGroupGetInfo(servername: OPTIONAL<LPCWSTR>, groupname: LPCWSTR, level: DWORD, bufptr_out: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetGroupGetInfo')(servername, groupname, level, bufptr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgroupgetusers
  public static NetGroupGetUsers(
    servername: OPTIONAL<LPCWSTR>,
    groupname: LPCWSTR,
    level: DWORD,
    bufptr_out: LPBYTE,
    prefmaxlen: DWORD,
    entriesread_out: LPDWORD,
    totalentries_out: LPDWORD,
    ResumeHandle_in_out: OPTIONAL<PDWORD_PTR>,
  ): NET_API_STATUS {
    return Netapi32.Load('NetGroupGetUsers')(servername, groupname, level, bufptr_out, prefmaxlen, entriesread_out, totalentries_out, ResumeHandle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgroupsetinfo
  public static NetGroupSetInfo(servername: OPTIONAL<LPCWSTR>, groupname: LPCWSTR, level: DWORD, buf: LPBYTE, parm_err_out: OPTIONAL<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetGroupSetInfo')(servername, groupname, level, buf, parm_err_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netgroupsetusers
  public static NetGroupSetUsers(servername: OPTIONAL<LPCWSTR>, groupname: LPCWSTR, level: DWORD, buf: LPBYTE, totalentries: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetGroupSetUsers')(servername, groupname, level, buf, totalentries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netisserviceaccount
  public static NetIsServiceAccount(ServerName: OPTIONAL<LPWSTR>, AccountName: LPWSTR, IsService_out: LPBOOL): NTSTATUS {
    return Netapi32.Load('NetIsServiceAccount')(ServerName, AccountName, IsService_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netjoindomain
  public static NetJoinDomain(lpServer: OPTIONAL<LPCWSTR>, lpDomain: LPCWSTR, lpMachineAccountOU: OPTIONAL<LPCWSTR>, lpAccount: OPTIONAL<LPCWSTR>, lpPassword: OPTIONAL<LPCWSTR>, fJoinOptions: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetJoinDomain')(lpServer, lpDomain, lpMachineAccountOU, lpAccount, lpPassword, fJoinOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupadd
  public static NetLocalGroupAdd(servername: OPTIONAL<LPCWSTR>, level: DWORD, buf: LPBYTE, parm_err_out: OPTIONAL<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupAdd')(servername, level, buf, parm_err_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupaddmember
  public static NetLocalGroupAddMember(servername: OPTIONAL<LPCWSTR>, groupname: LPCWSTR, membersid: PSID): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupAddMember')(servername, groupname, membersid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupaddmembers
  public static NetLocalGroupAddMembers(servername: OPTIONAL<LPCWSTR>, groupname: LPCWSTR, level: DWORD, buf: LPBYTE, totalentries: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupAddMembers')(servername, groupname, level, buf, totalentries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupdel
  public static NetLocalGroupDel(servername: OPTIONAL<LPCWSTR>, groupname: LPCWSTR): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupDel')(servername, groupname);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupdelmember
  public static NetLocalGroupDelMember(servername: OPTIONAL<LPCWSTR>, groupname: LPCWSTR, membersid: PSID): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupDelMember')(servername, groupname, membersid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupdelmembers
  public static NetLocalGroupDelMembers(servername: OPTIONAL<LPCWSTR>, groupname: LPCWSTR, level: DWORD, buf: LPBYTE, totalentries: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupDelMembers')(servername, groupname, level, buf, totalentries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupenum
  public static NetLocalGroupEnum(servername: OPTIONAL<LPCWSTR>, level: DWORD, bufptr_out: LPBYTE, prefmaxlen: DWORD, entriesread_out: LPDWORD, totalentries_out: LPDWORD, resumehandle_in_out: OPTIONAL<PDWORD_PTR>): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupEnum')(servername, level, bufptr_out, prefmaxlen, entriesread_out, totalentries_out, resumehandle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupgetinfo
  public static NetLocalGroupGetInfo(servername: OPTIONAL<LPCWSTR>, groupname: LPCWSTR, level: DWORD, bufptr_out: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupGetInfo')(servername, groupname, level, bufptr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupgetmembers
  public static NetLocalGroupGetMembers(
    servername: OPTIONAL<LPCWSTR>,
    localgroupname: LPCWSTR,
    level: DWORD,
    bufptr_out: LPBYTE,
    prefmaxlen: DWORD,
    entriesread_out: LPDWORD,
    totalentries_out: LPDWORD,
    resumehandle_in_out: OPTIONAL<PDWORD_PTR>,
  ): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupGetMembers')(servername, localgroupname, level, bufptr_out, prefmaxlen, entriesread_out, totalentries_out, resumehandle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupsetinfo
  public static NetLocalGroupSetInfo(servername: OPTIONAL<LPCWSTR>, groupname: LPCWSTR, level: DWORD, buf: LPBYTE, parm_err_out: OPTIONAL<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupSetInfo')(servername, groupname, level, buf, parm_err_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netlocalgroupsetmembers
  public static NetLocalGroupSetMembers(servername: OPTIONAL<LPCWSTR>, groupname: LPCWSTR, level: DWORD, buf: LPBYTE, totalentries: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetLocalGroupSetMembers')(servername, groupname, level, buf, totalentries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netprovisioncomputeraccount
  public static NetProvisionComputerAccount(
    lpDomain: LPCWSTR,
    lpMachineName: LPCWSTR,
    lpMachineAccountOU: OPTIONAL<LPCWSTR>,
    lpDcName: OPTIONAL<LPCWSTR>,
    dwOptions: DWORD,
    pProvisionBinData_out: OPTIONAL<PBYTE>,
    pdwProvisionBinDataSize_out: OPTIONAL<LPDWORD>,
    pProvisionTextData_out: OPTIONAL<LPWSTR>,
  ): NET_API_STATUS {
    return Netapi32.Load('NetProvisionComputerAccount')(lpDomain, lpMachineName, lpMachineAccountOU, lpDcName, dwOptions, pProvisionBinData_out, pdwProvisionBinDataSize_out, pProvisionTextData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netquerydisplayinformation
  public static NetQueryDisplayInformation(ServerName: OPTIONAL<LPCWSTR>, Level: DWORD, Index: DWORD, EntriesRequested: DWORD, PreferredMaximumLength: DWORD, ReturnedEntryCount_out: LPDWORD, SortedBuffer_out: PVOID): NET_API_STATUS {
    return Netapi32.Load('NetQueryDisplayInformation')(ServerName, Level, Index, EntriesRequested, PreferredMaximumLength, ReturnedEntryCount_out, SortedBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netqueryserviceaccount
  public static NetQueryServiceAccount(ServerName: OPTIONAL<LPWSTR>, AccountName: LPWSTR, InfoLevel: DWORD, Buffer_out: PBYTE): NTSTATUS {
    return Netapi32.Load('NetQueryServiceAccount')(ServerName, AccountName, InfoLevel, Buffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netregisterdomainnamechangenotification
  public static NetRegisterDomainNameChangeNotification(NotificationEventHandle_out: PHANDLE): NET_API_STATUS {
    return Netapi32.Load('NetRegisterDomainNameChangeNotification')(NotificationEventHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmremutl/nf-lmremutl-netremotecomputersupports
  public static NetRemoteComputerSupports(UncServerName: OPTIONAL<LPCWSTR>, OptionsWanted: DWORD, OptionsSupported_out: LPDWORD): NET_API_STATUS {
    return Netapi32.Load('NetRemoteComputerSupports')(UncServerName, OptionsWanted, OptionsSupported_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmremutl/nf-lmremutl-netremotetod
  public static NetRemoteTOD(UncServerName: OPTIONAL<LPCWSTR>, BufferPtr_out: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetRemoteTOD')(UncServerName, BufferPtr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netremovealternatecomputername
  public static NetRemoveAlternateComputerName(Server: OPTIONAL<LPCWSTR>, AlternateName: LPCWSTR, DomainAccount: OPTIONAL<LPCWSTR>, DomainAccountPassword: OPTIONAL<LPCWSTR>, Reserved: ULONG): NET_API_STATUS {
    return Netapi32.Load('NetRemoveAlternateComputerName')(Server, AlternateName, DomainAccount, DomainAccountPassword, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netremoveserviceaccount
  public static NetRemoveServiceAccount(ServerName: OPTIONAL<LPWSTR>, AccountName: LPWSTR, Flags: DWORD): NTSTATUS {
    return Netapi32.Load('NetRemoveServiceAccount')(ServerName, AccountName, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netrenamemachineindomain
  public static NetRenameMachineInDomain(lpServer: OPTIONAL<LPCWSTR>, lpNewMachineName: OPTIONAL<LPCWSTR>, lpAccount: OPTIONAL<LPCWSTR>, lpPassword: OPTIONAL<LPCWSTR>, fRenameOptions: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetRenameMachineInDomain')(lpServer, lpNewMachineName, lpAccount, lpPassword, fRenameOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netrequestofflinedomainjoin
  public static NetRequestOfflineDomainJoin(pProvisionBinData: PBYTE, cbProvisionBinDataSize: DWORD, dwOptions: DWORD, lpWindowsPath: LPCWSTR): NET_API_STATUS {
    return Netapi32.Load('NetRequestOfflineDomainJoin')(pProvisionBinData, cbProvisionBinDataSize, dwOptions, lpWindowsPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmat/nf-lmat-netschedulejobadd
  public static NetScheduleJobAdd(Servername: OPTIONAL<LPCWSTR>, Buffer: LPBYTE, JobId_out: LPDWORD): NET_API_STATUS {
    return Netapi32.Load('NetScheduleJobAdd')(Servername, Buffer, JobId_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmat/nf-lmat-netschedulejobdel
  public static NetScheduleJobDel(Servername: OPTIONAL<LPCWSTR>, MinJobId: DWORD, MaxJobId: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetScheduleJobDel')(Servername, MinJobId, MaxJobId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmat/nf-lmat-netschedulejobenum
  public static NetScheduleJobEnum(Servername: OPTIONAL<LPCWSTR>, PointerToBuffer_out: LPBYTE, PreferredMaximumLength: DWORD, EntriesRead_out: LPDWORD, TotalEntries_out: LPDWORD, ResumeHandle_in_out: NULLABLE<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetScheduleJobEnum')(Servername, PointerToBuffer_out, PreferredMaximumLength, EntriesRead_out, TotalEntries_out, ResumeHandle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmat/nf-lmat-netschedulejobgetinfo
  public static NetScheduleJobGetInfo(Servername: OPTIONAL<LPCWSTR>, JobId: DWORD, PointerToBuffer_out: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetScheduleJobGetInfo')(Servername, JobId, PointerToBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmserver/nf-lmserver-netserverdiskenum
  public static NetServerDiskEnum(servername: OPTIONAL<LPCWSTR>, level: DWORD, bufptr_out: LPBYTE, prefmaxlen: DWORD, entriesread_out: LPDWORD, totalentries_out: LPDWORD, resume_handle_in_out: OPTIONAL<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetServerDiskEnum')(servername, level, bufptr_out, prefmaxlen, entriesread_out, totalentries_out, resume_handle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmserver/nf-lmserver-netserverenum
  public static NetServerEnum(
    servername: OPTIONAL<LMCSTR>,
    level: DWORD,
    bufptr_out: LPBYTE,
    prefmaxlen: DWORD,
    entriesread_out: LPDWORD,
    totalentries_out: LPDWORD,
    servertype: DWORD,
    domain: OPTIONAL<LMCSTR>,
    resume_handle_in_out: OPTIONAL<LPDWORD>,
  ): NET_API_STATUS {
    return Netapi32.Load('NetServerEnum')(servername, level, bufptr_out, prefmaxlen, entriesread_out, totalentries_out, servertype, domain, resume_handle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmserver/nf-lmserver-netservergetinfo
  public static NetServerGetInfo(servername: OPTIONAL<LMSTR>, level: DWORD, bufptr_out: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetServerGetInfo')(servername, level, bufptr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmserver/nf-lmserver-netserversetinfo
  public static NetServerSetInfo(servername: OPTIONAL<LMSTR>, level: DWORD, buf: LPBYTE, ParmError_out: OPTIONAL<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetServerSetInfo')(servername, level, buf, ParmError_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmserver/nf-lmserver-netservertransportadd
  public static NetServerTransportAdd(servername: OPTIONAL<LMSTR>, level: DWORD, bufptr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetServerTransportAdd')(servername, level, bufptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmserver/nf-lmserver-netservertransportaddex
  public static NetServerTransportAddEx(servername: OPTIONAL<LMSTR>, level: DWORD, bufptr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetServerTransportAddEx')(servername, level, bufptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmserver/nf-lmserver-netservertransportdel
  public static NetServerTransportDel(servername: OPTIONAL<LMSTR>, level: DWORD, bufptr: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetServerTransportDel')(servername, level, bufptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmserver/nf-lmserver-netservertransportenum
  public static NetServerTransportEnum(servername: OPTIONAL<LMSTR>, level: DWORD, bufptr_out: LPBYTE, prefmaxlen: DWORD, entriesread_out: LPDWORD, totalentries_out: LPDWORD, resume_handle_in_out: OPTIONAL<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetServerTransportEnum')(servername, level, bufptr_out, prefmaxlen, entriesread_out, totalentries_out, resume_handle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmsvc/nf-lmsvc-netservicecontrol
  public static NetServiceControl(servername: OPTIONAL<LPCWSTR>, service: LPCWSTR, opcode: DWORD, arg: DWORD, bufptr_out: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetServiceControl')(servername, service, opcode, arg, bufptr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmsvc/nf-lmsvc-netserviceenum
  public static NetServiceEnum(servername: OPTIONAL<LPCWSTR>, level: DWORD, bufptr_out: LPBYTE, prefmaxlen: DWORD, entriesread_out: LPDWORD, totalentries_out: LPDWORD, resume_handle_in_out: OPTIONAL<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetServiceEnum')(servername, level, bufptr_out, prefmaxlen, entriesread_out, totalentries_out, resume_handle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmsvc/nf-lmsvc-netservicegetinfo
  public static NetServiceGetInfo(servername: OPTIONAL<LPCWSTR>, service: LPCWSTR, level: DWORD, bufptr_out: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetServiceGetInfo')(servername, service, level, bufptr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmsvc/nf-lmsvc-netserviceinstall
  public static NetServiceInstall(servername: OPTIONAL<LPCWSTR>, service: LPCWSTR, argc: DWORD, argv: LPCWSTR, bufptr_out: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetServiceInstall')(servername, service, argc, argv, bufptr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netsessiondel
  public static NetSessionDel(servername: OPTIONAL<LMSTR>, UncClientName: OPTIONAL<LMSTR>, username: OPTIONAL<LMSTR>): NET_API_STATUS {
    return Netapi32.Load('NetSessionDel')(servername, UncClientName, username);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netsessionenum
  public static NetSessionEnum(
    servername: OPTIONAL<LMSTR>,
    UncClientName: OPTIONAL<LMSTR>,
    username: OPTIONAL<LMSTR>,
    level: DWORD,
    bufptr_out: LPBYTE,
    prefmaxlen: DWORD,
    entriesread_out: LPDWORD,
    totalentries_out: LPDWORD,
    resume_handle_in_out: OPTIONAL<LPDWORD>,
  ): NET_API_STATUS {
    return Netapi32.Load('NetSessionEnum')(servername, UncClientName, username, level, bufptr_out, prefmaxlen, entriesread_out, totalentries_out, resume_handle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netsessiongetinfo
  public static NetSessionGetInfo(servername: OPTIONAL<LMSTR>, UncClientName: LMSTR, username: LMSTR, level: DWORD, bufptr_out: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetSessionGetInfo')(servername, UncClientName, username, level, bufptr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netshareadd
  public static NetShareAdd(servername: OPTIONAL<LMSTR>, level: DWORD, buf: LPBYTE, parm_err_out: OPTIONAL<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetShareAdd')(servername, level, buf, parm_err_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netsharecheck
  public static NetShareCheck(servername: OPTIONAL<LMSTR>, device: LMSTR, type_out: LPDWORD): NET_API_STATUS {
    return Netapi32.Load('NetShareCheck')(servername, device, type_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netsharedel
  public static NetShareDel(servername: OPTIONAL<LMSTR>, netname: LMSTR, reserved: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetShareDel')(servername, netname, reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netsharedelex
  public static NetShareDelEx(servername: OPTIONAL<LMSTR>, level: DWORD, buf: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetShareDelEx')(servername, level, buf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netsharedelsticky
  public static NetShareDelSticky(servername: OPTIONAL<LMSTR>, netname: LMSTR, reserved: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetShareDelSticky')(servername, netname, reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netshareenum
  public static NetShareEnum(servername: OPTIONAL<LMSTR>, level: DWORD, bufptr_out: LPBYTE, prefmaxlen: DWORD, entriesread_out: LPDWORD, totalentries_out: LPDWORD, resume_handle_in_out: OPTIONAL<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetShareEnum')(servername, level, bufptr_out, prefmaxlen, entriesread_out, totalentries_out, resume_handle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netshareenumsticky
  public static NetShareEnumSticky(servername: OPTIONAL<LMSTR>, level: DWORD, bufptr_out: LPBYTE, prefmaxlen: DWORD, entriesread_out: LPDWORD, totalentries_out: LPDWORD, resume_handle_in_out: OPTIONAL<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetShareEnumSticky')(servername, level, bufptr_out, prefmaxlen, entriesread_out, totalentries_out, resume_handle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netsharegetinfo
  public static NetShareGetInfo(servername: OPTIONAL<LMSTR>, netname: LMSTR, level: DWORD, bufptr_out: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetShareGetInfo')(servername, netname, level, bufptr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmshare/nf-lmshare-netsharesetinfo
  public static NetShareSetInfo(servername: OPTIONAL<LMSTR>, netname: LMSTR, level: DWORD, buf: LPBYTE, parm_err_out: OPTIONAL<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetShareSetInfo')(servername, netname, level, buf, parm_err_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmstats/nf-lmstats-netstatisticsget
  public static NetStatisticsGet(ServerName: NULLABLE<LMSTR>, Service: LMSTR, Level: DWORD, Options: DWORD, Buffer_out: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetStatisticsGet')(ServerName, Service, Level, Options, Buffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netunjoindomain
  public static NetUnjoinDomain(lpServer: OPTIONAL<LPCWSTR>, lpAccount: OPTIONAL<LPCWSTR>, lpPassword: OPTIONAL<LPCWSTR>, fUnjoinOptions: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetUnjoinDomain')(lpServer, lpAccount, lpPassword, fUnjoinOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netunregisterdomainnamechangenotification
  public static NetUnregisterDomainNameChangeNotification(NotificationEventHandle: HANDLE): NET_API_STATUS {
    return Netapi32.Load('NetUnregisterDomainNameChangeNotification')(NotificationEventHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmuse/nf-lmuse-netuseadd
  public static NetUseAdd(UncServerName: OPTIONAL<LMSTR>, Level: DWORD, Buf: LPBYTE, ParmError_out: OPTIONAL<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetUseAdd')(UncServerName, Level, Buf, ParmError_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmuse/nf-lmuse-netusedel
  public static NetUseDel(UncServerName: OPTIONAL<LMSTR>, UseName: LMSTR, ForceCond: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetUseDel')(UncServerName, UseName, ForceCond);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmuse/nf-lmuse-netuseenum
  public static NetUseEnum(
    UncServerName: OPTIONAL<LMSTR>,
    LevelFlags: DWORD,
    BufPtr_out: OPTIONAL<LPBYTE>,
    PreferedMaximumSize: DWORD,
    EntriesRead_out: OPTIONAL<LPDWORD>,
    TotalEntries_out: LPDWORD,
    ResumeHandle_in_out: OPTIONAL<LPDWORD>,
  ): NET_API_STATUS {
    return Netapi32.Load('NetUseEnum')(UncServerName, LevelFlags, BufPtr_out, PreferedMaximumSize, EntriesRead_out, TotalEntries_out, ResumeHandle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmuse/nf-lmuse-netusegetinfo
  public static NetUseGetInfo(UncServerName: OPTIONAL<LMSTR>, UseName: LMSTR, LevelFlags: DWORD, BufPtr_out: OPTIONAL<LPBYTE>): NET_API_STATUS {
    return Netapi32.Load('NetUseGetInfo')(UncServerName, UseName, LevelFlags, BufPtr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netuseradd
  public static NetUserAdd(servername: OPTIONAL<LPCWSTR>, level: DWORD, buf: LPBYTE, parm_err_out: OPTIONAL<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetUserAdd')(servername, level, buf, parm_err_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netuserchangepassword
  public static NetUserChangePassword(domainname: OPTIONAL<LPCWSTR>, username: OPTIONAL<LPCWSTR>, oldpassword: LPCWSTR, newpassword: LPCWSTR): NET_API_STATUS {
    return Netapi32.Load('NetUserChangePassword')(domainname, username, oldpassword, newpassword);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netuserdel
  public static NetUserDel(servername: OPTIONAL<LPCWSTR>, username: LPCWSTR): NET_API_STATUS {
    return Netapi32.Load('NetUserDel')(servername, username);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netuserenum
  public static NetUserEnum(servername: OPTIONAL<LPCWSTR>, level: DWORD, filter: DWORD, bufptr_out: LPBYTE, prefmaxlen: DWORD, entriesread_out: LPDWORD, totalentries_out: LPDWORD, resume_handle_in_out: OPTIONAL<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetUserEnum')(servername, level, filter, bufptr_out, prefmaxlen, entriesread_out, totalentries_out, resume_handle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netusergetgroups
  public static NetUserGetGroups(servername: OPTIONAL<LPCWSTR>, username: LPCWSTR, level: DWORD, bufptr_out: LPBYTE, prefmaxlen: DWORD, entriesread_out: LPDWORD, totalentries_out: LPDWORD): NET_API_STATUS {
    return Netapi32.Load('NetUserGetGroups')(servername, username, level, bufptr_out, prefmaxlen, entriesread_out, totalentries_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netusergetinfo
  public static NetUserGetInfo(servername: OPTIONAL<LPCWSTR>, username: LPCWSTR, level: DWORD, bufptr_out: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetUserGetInfo')(servername, username, level, bufptr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netusergetlocalgroups
  public static NetUserGetLocalGroups(servername: OPTIONAL<LPCWSTR>, username: LPCWSTR, level: DWORD, flags: DWORD, bufptr_out: LPBYTE, prefmaxlen: DWORD, entriesread_out: LPDWORD, totalentries_out: LPDWORD): NET_API_STATUS {
    return Netapi32.Load('NetUserGetLocalGroups')(servername, username, level, flags, bufptr_out, prefmaxlen, entriesread_out, totalentries_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netusermodalsget
  public static NetUserModalsGet(servername: OPTIONAL<LPCWSTR>, level: DWORD, bufptr_out: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetUserModalsGet')(servername, level, bufptr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netusermodalsset
  public static NetUserModalsSet(servername: OPTIONAL<LPCWSTR>, level: DWORD, buf: LPBYTE, parm_err_out: OPTIONAL<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetUserModalsSet')(servername, level, buf, parm_err_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netusersetgroups
  public static NetUserSetGroups(servername: OPTIONAL<LPCWSTR>, username: LPCWSTR, level: DWORD, buf: LPBYTE, num_entries: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetUserSetGroups')(servername, username, level, buf, num_entries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netusersetinfo
  public static NetUserSetInfo(servername: OPTIONAL<LPCWSTR>, username: LPCWSTR, level: DWORD, buf: LPBYTE, parm_err_out: OPTIONAL<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetUserSetInfo')(servername, username, level, buf, parm_err_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmjoin/nf-lmjoin-netvalidatename
  public static NetValidateName(lpServer: OPTIONAL<LPCWSTR>, lpName: LPCWSTR, lpAccount: OPTIONAL<LPCWSTR>, lpPassword: OPTIONAL<LPCWSTR>, NameType: NETSETUP_NAME_TYPE): NET_API_STATUS {
    return Netapi32.Load('NetValidateName')(lpServer, lpName, lpAccount, lpPassword, NameType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netvalidatepasswordpolicy
  public static NetValidatePasswordPolicy(ServerName: NULLABLE<LPCWSTR>, Qualifier: NULL, ValidationType: NET_VALIDATE_PASSWORD_TYPE, InputArg: LPVOID, OutputArg_out: LPVOID): NET_API_STATUS {
    return Netapi32.Load('NetValidatePasswordPolicy')(ServerName, Qualifier, ValidationType, InputArg, OutputArg_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmaccess/nf-lmaccess-netvalidatepasswordpolicyfree
  public static NetValidatePasswordPolicyFree(OutputArg: LPVOID): NET_API_STATUS {
    return Netapi32.Load('NetValidatePasswordPolicyFree')(OutputArg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmwksta/nf-lmwksta-netwkstagetinfo
  public static NetWkstaGetInfo(servername: OPTIONAL<LMSTR>, level: DWORD, bufptr_out: OPTIONAL<LPBYTE>): NET_API_STATUS {
    return Netapi32.Load('NetWkstaGetInfo')(servername, level, bufptr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmwksta/nf-lmwksta-netwkstasetinfo
  public static NetWkstaSetInfo(servername: OPTIONAL<LMSTR>, level: DWORD, buf: LPBYTE, parm_err_out: OPTIONAL<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetWkstaSetInfo')(servername, level, buf, parm_err_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmwksta/nf-lmwksta-netwkstatransportadd
  public static NetWkstaTransportAdd(servername: OPTIONAL<LMSTR>, level: DWORD, buf: LPBYTE, parm_err_out: OPTIONAL<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetWkstaTransportAdd')(servername, level, buf, parm_err_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmwksta/nf-lmwksta-netwkstatransportdel
  public static NetWkstaTransportDel(servername: OPTIONAL<LMSTR>, transportname: OPTIONAL<LMSTR>, ucond: DWORD): NET_API_STATUS {
    return Netapi32.Load('NetWkstaTransportDel')(servername, transportname, ucond);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmwksta/nf-lmwksta-netwkstatransportenum
  public static NetWkstaTransportEnum(servername: OPTIONAL<LMSTR>, level: DWORD, bufptr_out: LPBYTE, prefmaxlen: DWORD, entriesread_out: LPDWORD, totalentries_out: LPDWORD, resume_handle_in_out: OPTIONAL<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetWkstaTransportEnum')(servername, level, bufptr_out, prefmaxlen, entriesread_out, totalentries_out, resume_handle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmwksta/nf-lmwksta-netwkstauserenum
  public static NetWkstaUserEnum(
    servername: OPTIONAL<LMSTR>,
    level: DWORD,
    bufptr_out: OPTIONAL<LPBYTE>,
    prefmaxlen: DWORD,
    entriesread_out: OPTIONAL<LPDWORD>,
    totalentries_out: LPDWORD,
    resumehandle_in_out: OPTIONAL<LPDWORD>,
  ): NET_API_STATUS {
    return Netapi32.Load('NetWkstaUserEnum')(servername, level, bufptr_out, prefmaxlen, entriesread_out, totalentries_out, resumehandle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmwksta/nf-lmwksta-netwkstausergetinfo
  public static NetWkstaUserGetInfo(reserved: OPTIONAL<LMSTR>, level: DWORD, bufptr_out: LPBYTE): NET_API_STATUS {
    return Netapi32.Load('NetWkstaUserGetInfo')(reserved, level, bufptr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lmwksta/nf-lmwksta-netwkstausersetinfo
  public static NetWkstaUserSetInfo(reserved: OPTIONAL<LMSTR>, level: DWORD, buf: LPBYTE, parm_err_out: OPTIONAL<LPDWORD>): NET_API_STATUS {
    return Netapi32.Load('NetWkstaUserSetInfo')(reserved, level, buf, parm_err_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/nb30/nf-nb30-netbios
  public static Netbios(pncb_in_out: PNCB): UCHAR {
    return Netapi32.Load('Netbios')(pncb_in_out);
  }
}

export default Netapi32;
