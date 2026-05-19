import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  DWORD,
  DS_KCC_TASKID,
  DS_NAME_FLAGS,
  DS_NAME_FORMAT,
  DS_REPL_INFO_TYPE,
  DS_SPN_NAME_TYPE,
  DS_SPN_WRITE_OP,
  HANDLE,
  LPBOOL,
  LPCSTR,
  LPCWSTR,
  LPGUID,
  LPSTR,
  LPVOID,
  LPWSTR,
  NULL,
  PDS_NAME_RESULTA,
  PDS_NAME_RESULTW,
  PDS_REPSYNCALL_ERRINFOA,
  PDS_REPSYNCALL_ERRINFOW,
  PDS_SCHEMA_GUID_MAPA,
  PDS_SCHEMA_GUID_MAPW,
  PDS_SITE_COST_INFO,
  PDWORD,
  PHANDLE,
  PRPC_AUTH_IDENTITY_HANDLE,
  PSCHEDULE,
  RPC_AUTH_IDENTITY_HANDLE,
  ULONG,
  USHORT,
} from '../types/Ntdsapi';

/**
 * Thin, lazy-loaded FFI bindings for `ntdsapi.dll`.
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
 * import Ntdsapi from './structs/Ntdsapi';
 *
 * // Lazy: bind on first call
 * const len = Buffer.alloc(4);
 * len.writeUInt32LE(0, 0);
 * Ntdsapi.DsClientMakeSpnForTargetServerW(serviceClass.ptr, serviceName.ptr, len.ptr, null);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Ntdsapi.Preload(['DsBindW', 'DsCrackNamesW', 'DsUnBindW']);
 * ```
 */
class Ntdsapi extends Win32 {
  protected static override name = 'ntdsapi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DsAddSidHistoryA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsAddSidHistoryW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsBindA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsBindByInstanceA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    DsBindByInstanceW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    DsBindToISTGA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsBindToISTGW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsBindW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsBindWithCredA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    DsBindWithCredW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    DsBindWithSpnA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsBindWithSpnExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    DsBindWithSpnExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    DsBindWithSpnW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsBindingSetTimeout: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    DsClientMakeSpnForTargetServerA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsClientMakeSpnForTargetServerW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsCrackNamesA: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsCrackNamesW: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsFreeDomainControllerInfoA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    DsFreeDomainControllerInfoW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    DsFreeNameResultA: { args: [FFIType.ptr], returns: FFIType.void },
    DsFreeNameResultW: { args: [FFIType.ptr], returns: FFIType.void },
    DsFreePasswordCredentials: { args: [FFIType.u64], returns: FFIType.void },
    DsFreeSchemaGuidMapA: { args: [FFIType.ptr], returns: FFIType.void },
    DsFreeSchemaGuidMapW: { args: [FFIType.ptr], returns: FFIType.void },
    DsFreeSpnArrayA: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    DsFreeSpnArrayW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    DsGetDomainControllerInfoA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsGetDomainControllerInfoW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsGetSpnA: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u16, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsGetSpnW: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u16, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsInheritSecurityIdentityA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsInheritSecurityIdentityW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsListDomainsInSiteA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsListDomainsInSiteW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsListInfoForServerA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsListInfoForServerW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsListRolesA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    DsListRolesW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    DsListServersForDomainInSiteA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsListServersForDomainInSiteW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsListServersInSiteA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsListServersInSiteW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsListSitesA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    DsListSitesW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    DsMakePasswordCredentialsA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsMakePasswordCredentialsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsMapSchemaGuidsA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsMapSchemaGuidsW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsQuerySitesByCostA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    DsQuerySitesByCostW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    DsQuerySitesFree: { args: [FFIType.ptr], returns: FFIType.void },
    DsRemoveDsDomainA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    DsRemoveDsDomainW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    DsRemoveDsServerA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    DsRemoveDsServerW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    DsReplicaAddA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    DsReplicaAddW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    DsReplicaConsistencyCheck: { args: [FFIType.u64, FFIType.i32, FFIType.u32], returns: FFIType.u32 },
    DsReplicaDelA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    DsReplicaDelW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    DsReplicaFreeInfo: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.void },
    DsReplicaGetInfo2W: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    DsReplicaGetInfoW: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsReplicaModifyA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    DsReplicaModifyW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    DsReplicaSyncA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    DsReplicaSyncAllA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsReplicaSyncAllW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsReplicaSyncW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    DsReplicaUpdateRefsA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    DsReplicaUpdateRefsW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    DsReplicaVerifyObjectsA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    DsReplicaVerifyObjectsW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    DsServerRegisterSpnA: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsServerRegisterSpnW: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DsUnBindA: { args: [FFIType.ptr], returns: FFIType.u32 },
    DsUnBindW: { args: [FFIType.ptr], returns: FFIType.u32 },
    DsWriteAccountSpnA: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    DsWriteAccountSpnW: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsaddsidhistorya
  public static DsAddSidHistoryA(hDS: HANDLE, Flags: DWORD, SrcDomain: LPCSTR, SrcPrincipal: LPCSTR, SrcDomainController: LPCSTR | NULL, SrcDomainCreds: RPC_AUTH_IDENTITY_HANDLE | 0n, DstDomain: LPCSTR, DstPrincipal: LPCSTR): DWORD {
    return Ntdsapi.Load('DsAddSidHistoryA')(hDS, Flags, SrcDomain, SrcPrincipal, SrcDomainController, SrcDomainCreds, DstDomain, DstPrincipal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsaddsidhistoryw
  public static DsAddSidHistoryW(hDS: HANDLE, Flags: DWORD, SrcDomain: LPCWSTR, SrcPrincipal: LPCWSTR, SrcDomainController: LPCWSTR | NULL, SrcDomainCreds: RPC_AUTH_IDENTITY_HANDLE | 0n, DstDomain: LPCWSTR, DstPrincipal: LPCWSTR): DWORD {
    return Ntdsapi.Load('DsAddSidHistoryW')(hDS, Flags, SrcDomain, SrcPrincipal, SrcDomainController, SrcDomainCreds, DstDomain, DstPrincipal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsbinda
  public static DsBindA(DomainControllerName: LPCSTR | NULL, DnsDomainName: LPCSTR | NULL, phDS: PHANDLE): DWORD {
    return Ntdsapi.Load('DsBindA')(DomainControllerName, DnsDomainName, phDS);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsbindbyinstancea
  public static DsBindByInstanceA(ServerName: LPCSTR | NULL, Annotation: LPCSTR | NULL, InstanceGuid: LPGUID | NULL, DnsDomainName: LPCSTR | NULL, AuthIdentity: RPC_AUTH_IDENTITY_HANDLE | 0n, ServicePrincipalName: LPCSTR | NULL, BindFlags: DWORD, phDS: PHANDLE): DWORD {
    return Ntdsapi.Load('DsBindByInstanceA')(ServerName, Annotation, InstanceGuid, DnsDomainName, AuthIdentity, ServicePrincipalName, BindFlags, phDS);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsbindbyinstancew
  public static DsBindByInstanceW(ServerName: LPCWSTR | NULL, Annotation: LPCWSTR | NULL, InstanceGuid: LPGUID | NULL, DnsDomainName: LPCWSTR | NULL, AuthIdentity: RPC_AUTH_IDENTITY_HANDLE | 0n, ServicePrincipalName: LPCWSTR | NULL, BindFlags: DWORD, phDS: PHANDLE): DWORD {
    return Ntdsapi.Load('DsBindByInstanceW')(ServerName, Annotation, InstanceGuid, DnsDomainName, AuthIdentity, ServicePrincipalName, BindFlags, phDS);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsbindtoistga
  public static DsBindToISTGA(SiteName: LPCSTR | NULL, phDS: PHANDLE): DWORD {
    return Ntdsapi.Load('DsBindToISTGA')(SiteName, phDS);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsbindtoistgw
  public static DsBindToISTGW(SiteName: LPCWSTR | NULL, phDS: PHANDLE): DWORD {
    return Ntdsapi.Load('DsBindToISTGW')(SiteName, phDS);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsbindw
  public static DsBindW(DomainControllerName: LPCWSTR | NULL, DnsDomainName: LPCWSTR | NULL, phDS: PHANDLE): DWORD {
    return Ntdsapi.Load('DsBindW')(DomainControllerName, DnsDomainName, phDS);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsbindwithcreda
  public static DsBindWithCredA(DomainControllerName: LPCSTR | NULL, DnsDomainName: LPCSTR | NULL, AuthIdentity: RPC_AUTH_IDENTITY_HANDLE | 0n, phDS: PHANDLE): DWORD {
    return Ntdsapi.Load('DsBindWithCredA')(DomainControllerName, DnsDomainName, AuthIdentity, phDS);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsbindwithcredw
  public static DsBindWithCredW(DomainControllerName: LPCWSTR | NULL, DnsDomainName: LPCWSTR | NULL, AuthIdentity: RPC_AUTH_IDENTITY_HANDLE | 0n, phDS: PHANDLE): DWORD {
    return Ntdsapi.Load('DsBindWithCredW')(DomainControllerName, DnsDomainName, AuthIdentity, phDS);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsbindwithspna
  public static DsBindWithSpnA(DomainControllerName: LPCSTR | NULL, DnsDomainName: LPCSTR | NULL, AuthIdentity: RPC_AUTH_IDENTITY_HANDLE | 0n, ServicePrincipalName: LPCSTR | NULL, phDS: PHANDLE): DWORD {
    return Ntdsapi.Load('DsBindWithSpnA')(DomainControllerName, DnsDomainName, AuthIdentity, ServicePrincipalName, phDS);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsbindwithspnexa
  public static DsBindWithSpnExA(DomainControllerName: LPCSTR | NULL, DnsDomainName: LPCSTR | NULL, AuthIdentity: RPC_AUTH_IDENTITY_HANDLE | 0n, ServicePrincipalName: LPCSTR | NULL, BindFlags: DWORD, phDS: PHANDLE): DWORD {
    return Ntdsapi.Load('DsBindWithSpnExA')(DomainControllerName, DnsDomainName, AuthIdentity, ServicePrincipalName, BindFlags, phDS);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsbindwithspnexw
  public static DsBindWithSpnExW(DomainControllerName: LPCWSTR | NULL, DnsDomainName: LPCWSTR | NULL, AuthIdentity: RPC_AUTH_IDENTITY_HANDLE | 0n, ServicePrincipalName: LPCWSTR | NULL, BindFlags: DWORD, phDS: PHANDLE): DWORD {
    return Ntdsapi.Load('DsBindWithSpnExW')(DomainControllerName, DnsDomainName, AuthIdentity, ServicePrincipalName, BindFlags, phDS);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsbindwithspnw
  public static DsBindWithSpnW(DomainControllerName: LPCWSTR | NULL, DnsDomainName: LPCWSTR | NULL, AuthIdentity: RPC_AUTH_IDENTITY_HANDLE | 0n, ServicePrincipalName: LPCWSTR | NULL, phDS: PHANDLE): DWORD {
    return Ntdsapi.Load('DsBindWithSpnW')(DomainControllerName, DnsDomainName, AuthIdentity, ServicePrincipalName, phDS);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsbindingsettimeout
  public static DsBindingSetTimeout(hDS: HANDLE, cTimeoutSecs: ULONG): DWORD {
    return Ntdsapi.Load('DsBindingSetTimeout')(hDS, cTimeoutSecs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsclientmakespnfortargetservera
  public static DsClientMakeSpnForTargetServerA(ServiceClass: LPCSTR, ServiceName: LPCSTR, pcSpnLength: PDWORD, pszSpn: LPSTR): DWORD {
    return Ntdsapi.Load('DsClientMakeSpnForTargetServerA')(ServiceClass, ServiceName, pcSpnLength, pszSpn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsclientmakespnfortargetserverw
  public static DsClientMakeSpnForTargetServerW(ServiceClass: LPCWSTR, ServiceName: LPCWSTR, pcSpnLength: PDWORD, pszSpn: LPWSTR): DWORD {
    return Ntdsapi.Load('DsClientMakeSpnForTargetServerW')(ServiceClass, ServiceName, pcSpnLength, pszSpn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dscracknamesa
  public static DsCrackNamesA(hDS: HANDLE | 0n, flags: DS_NAME_FLAGS, formatOffered: DS_NAME_FORMAT, formatDesired: DS_NAME_FORMAT, cNames: DWORD, rpNames: LPVOID, ppResult: PDS_NAME_RESULTA): DWORD {
    return Ntdsapi.Load('DsCrackNamesA')(hDS, flags, formatOffered, formatDesired, cNames, rpNames, ppResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dscracknamesw
  public static DsCrackNamesW(hDS: HANDLE | 0n, flags: DS_NAME_FLAGS, formatOffered: DS_NAME_FORMAT, formatDesired: DS_NAME_FORMAT, cNames: DWORD, rpNames: LPVOID, ppResult: PDS_NAME_RESULTW): DWORD {
    return Ntdsapi.Load('DsCrackNamesW')(hDS, flags, formatOffered, formatDesired, cNames, rpNames, ppResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsfreedomaincontrollerinfoa
  public static DsFreeDomainControllerInfoA(InfoLevel: DWORD, cInfo: DWORD, pInfo: LPVOID): void {
    return Ntdsapi.Load('DsFreeDomainControllerInfoA')(InfoLevel, cInfo, pInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsfreedomaincontrollerinfow
  public static DsFreeDomainControllerInfoW(InfoLevel: DWORD, cInfo: DWORD, pInfo: LPVOID): void {
    return Ntdsapi.Load('DsFreeDomainControllerInfoW')(InfoLevel, cInfo, pInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsfreenameresulta
  public static DsFreeNameResultA(pResult: PDS_NAME_RESULTA): void {
    return Ntdsapi.Load('DsFreeNameResultA')(pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsfreenameresultw
  public static DsFreeNameResultW(pResult: PDS_NAME_RESULTW): void {
    return Ntdsapi.Load('DsFreeNameResultW')(pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsfreepasswordcredentials
  public static DsFreePasswordCredentials(AuthIdentity: RPC_AUTH_IDENTITY_HANDLE): void {
    return Ntdsapi.Load('DsFreePasswordCredentials')(AuthIdentity);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsfreeschemaguidmapa
  public static DsFreeSchemaGuidMapA(pGuidMap: PDS_SCHEMA_GUID_MAPA): void {
    return Ntdsapi.Load('DsFreeSchemaGuidMapA')(pGuidMap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsfreeschemaguidmapw
  public static DsFreeSchemaGuidMapW(pGuidMap: PDS_SCHEMA_GUID_MAPW): void {
    return Ntdsapi.Load('DsFreeSchemaGuidMapW')(pGuidMap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsfreespnarraya
  public static DsFreeSpnArrayA(cSpn: DWORD, rpszSpn: LPVOID): void {
    return Ntdsapi.Load('DsFreeSpnArrayA')(cSpn, rpszSpn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsfreespnarrayw
  public static DsFreeSpnArrayW(cSpn: DWORD, rpszSpn: LPVOID): void {
    return Ntdsapi.Load('DsFreeSpnArrayW')(cSpn, rpszSpn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsgetdomaincontrollerinfoa
  public static DsGetDomainControllerInfoA(hDs: HANDLE, DomainName: LPCSTR, InfoLevel: DWORD, pcOut: PDWORD, ppInfo: LPVOID): DWORD {
    return Ntdsapi.Load('DsGetDomainControllerInfoA')(hDs, DomainName, InfoLevel, pcOut, ppInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsgetdomaincontrollerinfow
  public static DsGetDomainControllerInfoW(hDs: HANDLE, DomainName: LPCWSTR, InfoLevel: DWORD, pcOut: PDWORD, ppInfo: LPVOID): DWORD {
    return Ntdsapi.Load('DsGetDomainControllerInfoW')(hDs, DomainName, InfoLevel, pcOut, ppInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsgetspna
  public static DsGetSpnA(ServiceType: DS_SPN_NAME_TYPE, ServiceClass: LPCSTR, ServiceName: LPCSTR | NULL, InstancePort: USHORT, cInstanceNames: USHORT, pInstanceNames: LPVOID | NULL, pInstancePorts: LPVOID | NULL, pcSpn: PDWORD, prpszSpn: LPVOID): DWORD {
    return Ntdsapi.Load('DsGetSpnA')(ServiceType, ServiceClass, ServiceName, InstancePort, cInstanceNames, pInstanceNames, pInstancePorts, pcSpn, prpszSpn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsgetspnw
  public static DsGetSpnW(ServiceType: DS_SPN_NAME_TYPE, ServiceClass: LPCWSTR, ServiceName: LPCWSTR | NULL, InstancePort: USHORT, cInstanceNames: USHORT, pInstanceNames: LPVOID | NULL, pInstancePorts: LPVOID | NULL, pcSpn: PDWORD, prpszSpn: LPVOID): DWORD {
    return Ntdsapi.Load('DsGetSpnW')(ServiceType, ServiceClass, ServiceName, InstancePort, cInstanceNames, pInstanceNames, pInstancePorts, pcSpn, prpszSpn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsinheritsecurityidentitya
  public static DsInheritSecurityIdentityA(hDS: HANDLE, Flags: DWORD, SrcPrincipal: LPCSTR, DstPrincipal: LPCSTR): DWORD {
    return Ntdsapi.Load('DsInheritSecurityIdentityA')(hDS, Flags, SrcPrincipal, DstPrincipal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsinheritsecurityidentityw
  public static DsInheritSecurityIdentityW(hDS: HANDLE, Flags: DWORD, SrcPrincipal: LPCWSTR, DstPrincipal: LPCWSTR): DWORD {
    return Ntdsapi.Load('DsInheritSecurityIdentityW')(hDS, Flags, SrcPrincipal, DstPrincipal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dslistdomainsinsitea
  public static DsListDomainsInSiteA(hDs: HANDLE, site: LPCSTR, ppDomains: PDS_NAME_RESULTA): DWORD {
    return Ntdsapi.Load('DsListDomainsInSiteA')(hDs, site, ppDomains);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dslistdomainsinsitew
  public static DsListDomainsInSiteW(hDs: HANDLE, site: LPCWSTR, ppDomains: PDS_NAME_RESULTW): DWORD {
    return Ntdsapi.Load('DsListDomainsInSiteW')(hDs, site, ppDomains);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dslistinfoforservera
  public static DsListInfoForServerA(hDs: HANDLE, server: LPCSTR, ppInfo: PDS_NAME_RESULTA): DWORD {
    return Ntdsapi.Load('DsListInfoForServerA')(hDs, server, ppInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dslistinfoforserverw
  public static DsListInfoForServerW(hDs: HANDLE, server: LPCWSTR, ppInfo: PDS_NAME_RESULTW): DWORD {
    return Ntdsapi.Load('DsListInfoForServerW')(hDs, server, ppInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dslistrolesa
  public static DsListRolesA(hDs: HANDLE, ppRoles: PDS_NAME_RESULTA): DWORD {
    return Ntdsapi.Load('DsListRolesA')(hDs, ppRoles);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dslistrolesw
  public static DsListRolesW(hDs: HANDLE, ppRoles: PDS_NAME_RESULTW): DWORD {
    return Ntdsapi.Load('DsListRolesW')(hDs, ppRoles);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dslistserversfordomaininsitea
  public static DsListServersForDomainInSiteA(hDs: HANDLE, domain: LPCSTR, site: LPCSTR, ppServers: PDS_NAME_RESULTA): DWORD {
    return Ntdsapi.Load('DsListServersForDomainInSiteA')(hDs, domain, site, ppServers);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dslistserversfordomaininsitew
  public static DsListServersForDomainInSiteW(hDs: HANDLE, domain: LPCWSTR, site: LPCWSTR, ppServers: PDS_NAME_RESULTW): DWORD {
    return Ntdsapi.Load('DsListServersForDomainInSiteW')(hDs, domain, site, ppServers);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dslistserversinsitea
  public static DsListServersInSiteA(hDs: HANDLE, site: LPCSTR, ppServers: PDS_NAME_RESULTA): DWORD {
    return Ntdsapi.Load('DsListServersInSiteA')(hDs, site, ppServers);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dslistserversinsitew
  public static DsListServersInSiteW(hDs: HANDLE, site: LPCWSTR, ppServers: PDS_NAME_RESULTW): DWORD {
    return Ntdsapi.Load('DsListServersInSiteW')(hDs, site, ppServers);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dslistsitesa
  public static DsListSitesA(hDs: HANDLE, ppSites: PDS_NAME_RESULTA): DWORD {
    return Ntdsapi.Load('DsListSitesA')(hDs, ppSites);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dslistsitesw
  public static DsListSitesW(hDs: HANDLE, ppSites: PDS_NAME_RESULTW): DWORD {
    return Ntdsapi.Load('DsListSitesW')(hDs, ppSites);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsmakepasswordcredentialsa
  public static DsMakePasswordCredentialsA(User: LPCSTR | NULL, Domain: LPCSTR | NULL, Password: LPCSTR | NULL, pAuthIdentity: PRPC_AUTH_IDENTITY_HANDLE): DWORD {
    return Ntdsapi.Load('DsMakePasswordCredentialsA')(User, Domain, Password, pAuthIdentity);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsmakepasswordcredentialsw
  public static DsMakePasswordCredentialsW(User: LPCWSTR | NULL, Domain: LPCWSTR | NULL, Password: LPCWSTR | NULL, pAuthIdentity: PRPC_AUTH_IDENTITY_HANDLE): DWORD {
    return Ntdsapi.Load('DsMakePasswordCredentialsW')(User, Domain, Password, pAuthIdentity);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsmapschemaguidsa
  public static DsMapSchemaGuidsA(hDs: HANDLE, cGuids: DWORD, rGuids: LPGUID, ppGuidMap: PDS_SCHEMA_GUID_MAPA): DWORD {
    return Ntdsapi.Load('DsMapSchemaGuidsA')(hDs, cGuids, rGuids, ppGuidMap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsmapschemaguidsw
  public static DsMapSchemaGuidsW(hDs: HANDLE, cGuids: DWORD, rGuids: LPGUID, ppGuidMap: PDS_SCHEMA_GUID_MAPW): DWORD {
    return Ntdsapi.Load('DsMapSchemaGuidsW')(hDs, cGuids, rGuids, ppGuidMap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsquerysitesbycosta
  public static DsQuerySitesByCostA(hDS: HANDLE, pszFromSite: LPSTR, rgszToSites: LPVOID, cToSites: DWORD, dwFlags: DWORD, prgSiteInfo: LPVOID): DWORD {
    return Ntdsapi.Load('DsQuerySitesByCostA')(hDS, pszFromSite, rgszToSites, cToSites, dwFlags, prgSiteInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsquerysitesbycostw
  public static DsQuerySitesByCostW(hDS: HANDLE, pwszFromSite: LPWSTR, rgwszToSites: LPVOID, cToSites: DWORD, dwFlags: DWORD, prgSiteInfo: LPVOID): DWORD {
    return Ntdsapi.Load('DsQuerySitesByCostW')(hDS, pwszFromSite, rgwszToSites, cToSites, dwFlags, prgSiteInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsquerysitesfree
  public static DsQuerySitesFree(rgSiteInfo: PDS_SITE_COST_INFO): void {
    return Ntdsapi.Load('DsQuerySitesFree')(rgSiteInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsremovedsdomaina
  public static DsRemoveDsDomainA(hDs: HANDLE, DomainDN: LPSTR): DWORD {
    return Ntdsapi.Load('DsRemoveDsDomainA')(hDs, DomainDN);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsremovedsdomainw
  public static DsRemoveDsDomainW(hDs: HANDLE, DomainDN: LPWSTR): DWORD {
    return Ntdsapi.Load('DsRemoveDsDomainW')(hDs, DomainDN);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsremovedsservera
  public static DsRemoveDsServerA(hDs: HANDLE, ServerDN: LPSTR, DomainDN: LPSTR | NULL, fLastDcInDomain: LPBOOL | NULL, fCommit: BOOL): DWORD {
    return Ntdsapi.Load('DsRemoveDsServerA')(hDs, ServerDN, DomainDN, fLastDcInDomain, fCommit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsremovedsserverw
  public static DsRemoveDsServerW(hDs: HANDLE, ServerDN: LPWSTR, DomainDN: LPWSTR | NULL, fLastDcInDomain: LPBOOL | NULL, fCommit: BOOL): DWORD {
    return Ntdsapi.Load('DsRemoveDsServerW')(hDs, ServerDN, DomainDN, fLastDcInDomain, fCommit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsreplicaadda
  public static DsReplicaAddA(hDS: HANDLE, NameContext: LPCSTR, SourceDsaDn: LPCSTR, TransportDn: LPCSTR, SourceDsaAddress: LPCSTR, pSchedule: PSCHEDULE | NULL, Options: DWORD): DWORD {
    return Ntdsapi.Load('DsReplicaAddA')(hDS, NameContext, SourceDsaDn, TransportDn, SourceDsaAddress, pSchedule, Options);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsreplicaaddw
  public static DsReplicaAddW(hDS: HANDLE, NameContext: LPCWSTR, SourceDsaDn: LPCWSTR, TransportDn: LPCWSTR, SourceDsaAddress: LPCWSTR, pSchedule: PSCHEDULE | NULL, Options: DWORD): DWORD {
    return Ntdsapi.Load('DsReplicaAddW')(hDS, NameContext, SourceDsaDn, TransportDn, SourceDsaAddress, pSchedule, Options);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsreplicaconsistencycheck
  public static DsReplicaConsistencyCheck(hDS: HANDLE, TaskID: DS_KCC_TASKID, dwFlags: DWORD): DWORD {
    return Ntdsapi.Load('DsReplicaConsistencyCheck')(hDS, TaskID, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsreplicadela
  public static DsReplicaDelA(hDS: HANDLE, NameContext: LPCSTR, DsaSrc: LPCSTR, Options: ULONG): DWORD {
    return Ntdsapi.Load('DsReplicaDelA')(hDS, NameContext, DsaSrc, Options);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsreplicadelw
  public static DsReplicaDelW(hDS: HANDLE, NameContext: LPCWSTR, DsaSrc: LPCWSTR, Options: ULONG): DWORD {
    return Ntdsapi.Load('DsReplicaDelW')(hDS, NameContext, DsaSrc, Options);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsreplicafreeinfo
  public static DsReplicaFreeInfo(InfoType: DS_REPL_INFO_TYPE, pInfo: LPVOID): void {
    return Ntdsapi.Load('DsReplicaFreeInfo')(InfoType, pInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsreplicagetinfo2w
  public static DsReplicaGetInfo2W(hDS: HANDLE, InfoType: DS_REPL_INFO_TYPE, pszObject: LPCWSTR | NULL, puuidForSourceDsaObjGuid: LPGUID | NULL, pszAttributeName: LPCWSTR | NULL, pszValue: LPCWSTR | NULL, dwFlags: DWORD, dwEnumerationContext: DWORD, ppInfo: LPVOID): DWORD {
    return Ntdsapi.Load('DsReplicaGetInfo2W')(hDS, InfoType, pszObject, puuidForSourceDsaObjGuid, pszAttributeName, pszValue, dwFlags, dwEnumerationContext, ppInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsreplicagetinfow
  public static DsReplicaGetInfoW(hDS: HANDLE, InfoType: DS_REPL_INFO_TYPE, pszObject: LPCWSTR | NULL, puuidForSourceDsaObjGuid: LPGUID | NULL, ppInfo: LPVOID): DWORD {
    return Ntdsapi.Load('DsReplicaGetInfoW')(hDS, InfoType, pszObject, puuidForSourceDsaObjGuid, ppInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsreplicamodifya
  public static DsReplicaModifyA(hDS: HANDLE, NameContext: LPCSTR, pUuidSourceDsa: LPGUID | NULL, TransportDn: LPCSTR | NULL, SourceDsaAddress: LPCSTR, pSchedule: PSCHEDULE | NULL, ReplicaFlags: DWORD, ModifyFields: DWORD, Options: DWORD): DWORD {
    return Ntdsapi.Load('DsReplicaModifyA')(hDS, NameContext, pUuidSourceDsa, TransportDn, SourceDsaAddress, pSchedule, ReplicaFlags, ModifyFields, Options);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsreplicamodifyw
  public static DsReplicaModifyW(hDS: HANDLE, NameContext: LPCWSTR, pUuidSourceDsa: LPGUID | NULL, TransportDn: LPCWSTR | NULL, SourceDsaAddress: LPCWSTR, pSchedule: PSCHEDULE | NULL, ReplicaFlags: DWORD, ModifyFields: DWORD, Options: DWORD): DWORD {
    return Ntdsapi.Load('DsReplicaModifyW')(hDS, NameContext, pUuidSourceDsa, TransportDn, SourceDsaAddress, pSchedule, ReplicaFlags, ModifyFields, Options);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsreplicasynca
  public static DsReplicaSyncA(hDS: HANDLE, NameContext: LPCSTR, pUuidDsaSrc: LPGUID, Options: ULONG): DWORD {
    return Ntdsapi.Load('DsReplicaSyncA')(hDS, NameContext, pUuidDsaSrc, Options);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsreplicasyncalla
  public static DsReplicaSyncAllA(hDS: HANDLE, pszNameContext: LPCSTR | NULL, ulFlags: ULONG, pFnCallBack: LPVOID, pCallbackData: LPVOID | NULL, pErrors: PDS_REPSYNCALL_ERRINFOA | NULL): DWORD {
    return Ntdsapi.Load('DsReplicaSyncAllA')(hDS, pszNameContext, ulFlags, pFnCallBack, pCallbackData, pErrors);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsreplicasyncallw
  public static DsReplicaSyncAllW(hDS: HANDLE, pszNameContext: LPCWSTR | NULL, ulFlags: ULONG, pFnCallBack: LPVOID, pCallbackData: LPVOID | NULL, pErrors: PDS_REPSYNCALL_ERRINFOW | NULL): DWORD {
    return Ntdsapi.Load('DsReplicaSyncAllW')(hDS, pszNameContext, ulFlags, pFnCallBack, pCallbackData, pErrors);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsreplicasyncw
  public static DsReplicaSyncW(hDS: HANDLE, NameContext: LPCWSTR, pUuidDsaSrc: LPGUID, Options: ULONG): DWORD {
    return Ntdsapi.Load('DsReplicaSyncW')(hDS, NameContext, pUuidDsaSrc, Options);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsreplicaupdaterefsa
  public static DsReplicaUpdateRefsA(hDS: HANDLE, NameContext: LPCSTR, DsaDest: LPCSTR, pUuidDsaDest: LPGUID, Options: ULONG): DWORD {
    return Ntdsapi.Load('DsReplicaUpdateRefsA')(hDS, NameContext, DsaDest, pUuidDsaDest, Options);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsreplicaupdaterefsw
  public static DsReplicaUpdateRefsW(hDS: HANDLE, NameContext: LPCWSTR, DsaDest: LPCWSTR, pUuidDsaDest: LPGUID, Options: ULONG): DWORD {
    return Ntdsapi.Load('DsReplicaUpdateRefsW')(hDS, NameContext, DsaDest, pUuidDsaDest, Options);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsreplicaverifyobjectsa
  public static DsReplicaVerifyObjectsA(hDS: HANDLE, NameContext: LPCSTR, pUuidDsaSrc: LPGUID, ulOptions: ULONG): DWORD {
    return Ntdsapi.Load('DsReplicaVerifyObjectsA')(hDS, NameContext, pUuidDsaSrc, ulOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsreplicaverifyobjectsw
  public static DsReplicaVerifyObjectsW(hDS: HANDLE, NameContext: LPCWSTR, pUuidDsaSrc: LPGUID, ulOptions: ULONG): DWORD {
    return Ntdsapi.Load('DsReplicaVerifyObjectsW')(hDS, NameContext, pUuidDsaSrc, ulOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsserverregisterspna
  public static DsServerRegisterSpnA(Operation: DS_SPN_WRITE_OP, ServiceClass: LPCSTR, UserObjectDN: LPCSTR | NULL): DWORD {
    return Ntdsapi.Load('DsServerRegisterSpnA')(Operation, ServiceClass, UserObjectDN);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsserverregisterspnw
  public static DsServerRegisterSpnW(Operation: DS_SPN_WRITE_OP, ServiceClass: LPCWSTR, UserObjectDN: LPCWSTR | NULL): DWORD {
    return Ntdsapi.Load('DsServerRegisterSpnW')(Operation, ServiceClass, UserObjectDN);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsunbinda
  public static DsUnBindA(phDS: PHANDLE): DWORD {
    return Ntdsapi.Load('DsUnBindA')(phDS);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dsunbindw
  public static DsUnBindW(phDS: PHANDLE): DWORD {
    return Ntdsapi.Load('DsUnBindW')(phDS);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dswriteaccountspna
  public static DsWriteAccountSpnA(hDS: HANDLE, Operation: DS_SPN_WRITE_OP, pszAccount: LPCSTR, cSpn: DWORD, rpszSpn: LPVOID): DWORD {
    return Ntdsapi.Load('DsWriteAccountSpnA')(hDS, Operation, pszAccount, cSpn, rpszSpn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntdsapi/nf-ntdsapi-dswriteaccountspnw
  public static DsWriteAccountSpnW(hDS: HANDLE, Operation: DS_SPN_WRITE_OP, pszAccount: LPCWSTR, cSpn: DWORD, rpszSpn: LPVOID): DWORD {
    return Ntdsapi.Load('DsWriteAccountSpnW')(hDS, Operation, pszAccount, cSpn, rpszSpn);
  }
}

export default Ntdsapi;
