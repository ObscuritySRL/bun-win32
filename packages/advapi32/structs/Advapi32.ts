import { type FFIFunction, FFIType } from 'bun:ffi';
import { Win32 } from '@bun-win32/core';

import type {
  ACCESS_MASK,
  ALG_ID,
  AUDIT_EVENT_TYPE,
  BOOL,
  BYTE,
  DWORD,
  HANDLE,
  HCRYPTHASH,
  HCRYPTKEY,
  HCRYPTPROV,
  HKEY,
  HWCT,
  INT,
  LONG,
  LPBOOL,
  LPBYTE,
  LPCSTR,
  LPCVOID,
  LPCWSTR,
  LPDWORD,
  LPSTR,
  NULL,
  LPVOID,
  LPWSTR,
  LSA_HANDLE,
  LSTATUS,
  NTSTATUS,
  PACL,
  PBOOL,
  PBYTE,
  PCREDENTIALA,
  PCREDENTIALW,
  PCREDENTIAL_TARGET_INFORMATIONA,
  PCREDENTIAL_TARGET_INFORMATIONW,
  PDWORD,
  PENCRYPTION_CERTIFICATE_HASH_LIST,
  PEXPLICIT_ACCESSA,
  PEXPLICIT_ACCESSW,
  PGENERIC_MAPPING,
  PHANDLE,
  PHKEY,
  PLSA_HANDLE,
  PLSA_OBJECT_ATTRIBUTES,
  PLSA_TRUST_INFORMATION,
  PLSA_UNICODE_STRING,
  PLONG,
  POBJECT_TYPE_LIST,
  PPRIVILEGE_SET,
  PSECURITY_DESCRIPTOR,
  PSID,
  PSID_IDENTIFIER_AUTHORITY,
  PSID_NAME_USE,
  PTOKEN_GROUPS,
  PTOKEN_PRIVILEGES,
  PTRUSTEE,
  PUCHAR,
  PULONG,
  PVOID,
  PVALENTA,
  PVALENTW,
  REGSAM,
  SC_HANDLE,
  SECURITY_IMPERSONATION_LEVEL,
  SECURITY_INFORMATION,
  SERVICE_STATUS_HANDLE,
  TOKEN_INFORMATION_CLASS,
  TOKEN_TYPE,
  TRACEHANDLE,
  ULONG,
  ULONG_PTR,
  USHORT,
  VOID,
  WORD,
} from '../types/Advapi32';

/**
 * Thin, lazy-loaded FFI bindings for `advapi32.dll`.
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
 * import Advapi32 from './structs/Advapi32';
 *
 * // Lazy: bind on first call
 * const result = Advapi32.RegCloseKey(hKey);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Advapi32.Preload(['RegOpenKeyExW', 'RegQueryValueExW']);
 * ```
 */
class Advapi32 extends Win32 {
  protected static override name = 'advapi32.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    AbortSystemShutdownA: { args: [FFIType.ptr], returns: FFIType.i32 },
    AbortSystemShutdownW: { args: [FFIType.ptr], returns: FFIType.i32 },
    AccessCheck: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AccessCheckAndAuditAlarmA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AccessCheckAndAuditAlarmW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AccessCheckByType: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AccessCheckByTypeAndAuditAlarmA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AccessCheckByTypeAndAuditAlarmW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AccessCheckByTypeResultList: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AccessCheckByTypeResultListAndAuditAlarmA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AccessCheckByTypeResultListAndAuditAlarmByHandleA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AccessCheckByTypeResultListAndAuditAlarmByHandleW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AccessCheckByTypeResultListAndAuditAlarmW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AddAccessAllowedAce: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AddAccessAllowedAceEx: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AddAccessAllowedObjectAce: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AddAccessDeniedAce: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AddAccessDeniedAceEx: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AddAccessDeniedObjectAce: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AddAce: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    AddAuditAccessAce: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    AddAuditAccessAceEx: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    AddAuditAccessObjectAce: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    AddConditionalAce: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u8, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AddUsersToEncryptedFile: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    AddUsersToEncryptedFileEx: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    AdjustTokenGroups: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AdjustTokenPrivileges: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AllocateAndInitializeSid: { args: [FFIType.ptr, FFIType.u8, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AllocateLocallyUniqueId: { args: [FFIType.ptr], returns: FFIType.i32 },
    AreAllAccessesGranted: { args: [FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    AreAnyAccessesGranted: { args: [FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    AuditComputeEffectivePolicyBySid: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AuditComputeEffectivePolicyByToken: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AuditEnumerateCategories: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AuditEnumeratePerUserPolicy: { args: [FFIType.ptr], returns: FFIType.i32 },
    AuditEnumerateSubCategories: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AuditFree: { args: [FFIType.ptr], returns: FFIType.void },
    AuditLookupCategoryGuidFromCategoryId: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AuditLookupCategoryIdFromCategoryGuid: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AuditLookupCategoryNameA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AuditLookupCategoryNameW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AuditLookupSubCategoryNameA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AuditLookupSubCategoryNameW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AuditQueryGlobalSaclA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AuditQueryGlobalSaclW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AuditQueryPerUserPolicy: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AuditQuerySecurity: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AuditQuerySystemPolicy: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AuditSetGlobalSaclA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AuditSetGlobalSaclW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AuditSetPerUserPolicy: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    AuditSetSecurity: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AuditSetSystemPolicy: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BackupEventLogA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    BackupEventLogW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    BaseRegCloseKey: { args: [FFIType.ptr], returns: FFIType.i32 },
    BaseRegCreateKey: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BaseRegDeleteKeyEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    BaseRegDeleteValue: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BaseRegFlushKey: { args: [FFIType.ptr], returns: FFIType.i32 },
    BaseRegGetVersion: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BaseRegLoadKey: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BaseRegOpenKey: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    BaseRegRestoreKey: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BaseRegSaveKeyEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BaseRegSetKeySecurity: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    BaseRegSetValue: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BaseRegUnLoadKey: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BuildExplicitAccessWithNameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.void },
    BuildExplicitAccessWithNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.void },
    BuildImpersonateExplicitAccessWithNameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.void },
    BuildImpersonateExplicitAccessWithNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.void },
    BuildImpersonateTrusteeA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    BuildImpersonateTrusteeW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    BuildSecurityDescriptorA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    BuildSecurityDescriptorW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    BuildTrusteeWithNameA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    BuildTrusteeWithNameW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    BuildTrusteeWithObjectsAndNameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    BuildTrusteeWithObjectsAndNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    BuildTrusteeWithObjectsAndSidA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    BuildTrusteeWithObjectsAndSidW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    BuildTrusteeWithSidA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    BuildTrusteeWithSidW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    CancelOverlappedAccess: { args: [FFIType.ptr], returns: FFIType.u32 },
    ChangeServiceConfig2A: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ChangeServiceConfig2W: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ChangeServiceConfigA: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ChangeServiceConfigW: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CheckForHiberboot: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    CheckTokenMembership: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ClearEventLogA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ClearEventLogW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    CloseCodeAuthzLevel: { args: [FFIType.u64], returns: FFIType.i32 },
    CloseEncryptedFileRaw: { args: [FFIType.ptr], returns: FFIType.void },
    CloseEventLog: { args: [FFIType.u64], returns: FFIType.i32 },
    CloseServiceHandle: { args: [FFIType.u64], returns: FFIType.i32 },
    CloseThreadWaitChainSession: { args: [FFIType.u64], returns: FFIType.void },
    CloseTrace: { args: [FFIType.u64], returns: FFIType.u32 },
    CommandLineFromMsiDescriptor: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ComputeAccessTokenFromCodeAuthzLevel: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ControlService: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ControlServiceExA: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ControlServiceExW: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ControlTraceA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ControlTraceW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ConvertAccessToSecurityDescriptorA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ConvertAccessToSecurityDescriptorW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ConvertSDToStringSDDomainW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ConvertSDToStringSDRootDomainA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ConvertSDToStringSDRootDomainW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ConvertSecurityDescriptorToAccessA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ConvertSecurityDescriptorToAccessNamedA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ConvertSecurityDescriptorToAccessNamedW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ConvertSecurityDescriptorToAccessW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ConvertSecurityDescriptorToStringSecurityDescriptorA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ConvertSecurityDescriptorToStringSecurityDescriptorW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ConvertSidToStringSidA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ConvertSidToStringSidW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ConvertStringSDToSDDomainA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ConvertStringSDToSDDomainW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ConvertStringSDToSDRootDomainA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ConvertStringSDToSDRootDomainW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ConvertStringSecurityDescriptorToSecurityDescriptorA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ConvertStringSecurityDescriptorToSecurityDescriptorW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ConvertStringSidToSidA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ConvertStringSidToSidW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ConvertToAutoInheritPrivateObjectSecurity: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    CopySid: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateCodeAuthzLevel: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreatePrivateObjectSecurity: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    CreatePrivateObjectSecurityEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    CreatePrivateObjectSecurityWithMultipleInheritance: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    CreateProcessAsUserA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateProcessAsUserW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateProcessWithLogonW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateProcessWithTokenW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateRestrictedToken: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateServiceA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CreateServiceEx: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CreateServiceW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CreateWellKnownSid: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CredBackupCredentials: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    CredDeleteA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    CredDeleteW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    CredEncryptAndMarshalBinaryBlob: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CredEnumerateA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CredEnumerateW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CredFindBestCredentialA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CredFindBestCredentialW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CredFree: { args: [FFIType.ptr], returns: FFIType.void },
    CredGetSessionTypes: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CredGetTargetInfoA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CredGetTargetInfoW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CredIsMarshaledCredentialA: { args: [FFIType.ptr], returns: FFIType.i32 },
    CredIsMarshaledCredentialW: { args: [FFIType.ptr], returns: FFIType.i32 },
    CredIsProtectedA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CredIsProtectedW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CredMarshalCredentialA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CredMarshalCredentialW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CredProfileLoaded: { args: [], returns: FFIType.i32 },
    CredProfileLoadedEx: { args: [FFIType.ptr], returns: FFIType.i32 },
    CredProfileUnloaded: { args: [], returns: FFIType.i32 },
    CredProtectA: { args: [FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CredProtectW: { args: [FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CredReadA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CredReadByTokenHandle: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CredReadDomainCredentialsA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CredReadDomainCredentialsW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CredReadW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CredRenameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    CredRenameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    CredRestoreCredentials: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    CredUnmarshalCredentialA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CredUnmarshalCredentialW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CredUnprotectA: { args: [FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CredUnprotectW: { args: [FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CredWriteA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CredWriteDomainCredentialsA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CredWriteDomainCredentialsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CredWriteW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CredpConvertCredential: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CredpConvertOneCredentialSize: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CredpConvertTargetInfo: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CredpDecodeCredential: { args: [FFIType.ptr], returns: FFIType.i32 },
    CredpEncodeCredential: { args: [FFIType.ptr], returns: FFIType.i32 },
    CredpEncodeSecret: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptAcquireContextA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    CryptAcquireContextW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    CryptContextAddRef: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptCreateHash: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptDecrypt: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptDeriveKey: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptDestroyHash: { args: [FFIType.u64], returns: FFIType.i32 },
    CryptDestroyKey: { args: [FFIType.u64], returns: FFIType.i32 },
    CryptDuplicateHash: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptDuplicateKey: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptEncrypt: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptEnumProviderTypesA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptEnumProviderTypesW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptEnumProvidersA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptEnumProvidersW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptExportKey: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptGenKey: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptGenRandom: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptGetDefaultProviderA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptGetDefaultProviderW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptGetHashParam: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptGetKeyParam: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptGetProvParam: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptGetUserKey: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptHashData: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    CryptHashSessionKey: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    CryptImportKey: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CryptReleaseContext: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    CryptSetHashParam: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptSetKeyParam: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptSetProvParam: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptSetProviderA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptSetProviderExA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptSetProviderExW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptSetProviderW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptSignHashA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptSignHashW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CryptVerifySignatureA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CryptVerifySignatureW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    DecryptFileA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    DecryptFileW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    DeleteAce: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    DeleteService: { args: [FFIType.u64], returns: FFIType.i32 },
    DeregisterEventSource: { args: [FFIType.u64], returns: FFIType.i32 },
    DestroyPrivateObjectSecurity: { args: [FFIType.ptr], returns: FFIType.i32 },
    DuplicateEncryptionInfoFile: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    DuplicateToken: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    DuplicateTokenEx: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    EnableTrace: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u64], returns: FFIType.u32 },
    EnableTraceEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u8, FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    EnableTraceEx2: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u8, FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    EncryptFileA: { args: [FFIType.ptr], returns: FFIType.i32 },
    EncryptFileW: { args: [FFIType.ptr], returns: FFIType.i32 },
    EncryptedFileKeyInfo: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    EncryptionDisable: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    EnumDependentServicesA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumDependentServicesW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumDynamicTimeZoneInformation: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    EnumServiceGroupW: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumServicesStatusA: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumServicesStatusExA: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumServicesStatusExW: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumServicesStatusW: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumerateTraceGuids: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    EnumerateTraceGuidsEx: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    EqualDomainSid: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EqualPrefixSid: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EqualSid: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EventAccessControl: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.u32 },
    EventAccessQuery: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    EventAccessRemove: { args: [FFIType.ptr], returns: FFIType.u32 },
    FileEncryptionStatusA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FileEncryptionStatusW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FindFirstFreeAce: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FlushEfsCache: { args: [FFIType.u32], returns: FFIType.u32 },
    FlushTraceA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FlushTraceW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FreeEncryptedFileKeyInfo: { args: [FFIType.ptr], returns: FFIType.void },
    FreeEncryptedFileMetadata: { args: [FFIType.ptr], returns: FFIType.void },
    FreeEncryptionCertificateHashList: { args: [FFIType.ptr], returns: FFIType.void },
    FreeInheritedFromArray: { args: [FFIType.ptr, FFIType.u16, FFIType.ptr], returns: FFIType.u32 },
    FreeSid: { args: [FFIType.ptr], returns: FFIType.ptr },
    GetAccessPermissionsForObjectA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetAccessPermissionsForObjectW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetAce: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetAclInformation: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    GetAuditedPermissionsFromAclA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetAuditedPermissionsFromAclW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetCurrentHwProfileA: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetCurrentHwProfileW: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetDynamicTimeZoneInformationEffectiveYears: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetEffectiveRightsFromAclA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetEffectiveRightsFromAclW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetEncryptedFileMetadata: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetEventLogInformation: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetExplicitEntriesFromAclA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetExplicitEntriesFromAclW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetFileSecurityA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetFileSecurityW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetInformationCodeAuthzLevelW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetInformationCodeAuthzPolicyW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetInheritanceSourceA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetInheritanceSourceW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetKernelObjectSecurity: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetLengthSid: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetLocalManagedApplicationData: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    GetLocalManagedApplications: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetManagedApplicationCategories: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetManagedApplications: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetMultipleTrusteeA: { args: [FFIType.ptr], returns: FFIType.u64 },
    GetMultipleTrusteeOperationA: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetMultipleTrusteeOperationW: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetMultipleTrusteeW: { args: [FFIType.ptr], returns: FFIType.u64 },
    GetNamedSecurityInfoA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetNamedSecurityInfoExA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetNamedSecurityInfoExW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetNamedSecurityInfoW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetNumberOfEventLogRecords: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetOldestEventLogRecord: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetOverlappedAccessResults: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    GetPrivateObjectSecurity: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetSecurityDescriptorControl: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetSecurityDescriptorDacl: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetSecurityDescriptorGroup: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetSecurityDescriptorLength: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetSecurityDescriptorOwner: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetSecurityDescriptorRMControl: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetSecurityDescriptorSacl: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetSecurityInfo: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetSecurityInfoExA: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetSecurityInfoExW: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetServiceDisplayNameA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetServiceDisplayNameW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetServiceKeyNameA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetServiceKeyNameW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetSidIdentifierAuthority: { args: [FFIType.ptr], returns: FFIType.ptr },
    GetSidLengthRequired: { args: [FFIType.u8], returns: FFIType.u32 },
    GetSidSubAuthority: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.ptr },
    GetSidSubAuthorityCount: { args: [FFIType.ptr], returns: FFIType.ptr },
    GetStringConditionFromBinary: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetThreadWaitChain: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetTokenInformation: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetTrusteeFormA: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetTrusteeFormW: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetTrusteeNameA: { args: [FFIType.ptr], returns: FFIType.ptr },
    GetTrusteeNameW: { args: [FFIType.ptr], returns: FFIType.ptr },
    GetTrusteeTypeA: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetTrusteeTypeW: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetUserNameA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetUserNameW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetWindowsAccountDomainSid: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    I_ScGetCurrentGroupStateW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    I_ScReparseServiceDatabase: { args: [], returns: FFIType.u32 },
    I_ScSetServiceBitsA: { args: [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    I_ScSetServiceBitsW: { args: [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    IdentifyCodeAuthzLevelW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ImpersonateAnonymousToken: { args: [FFIType.u64], returns: FFIType.i32 },
    ImpersonateLoggedOnUser: { args: [FFIType.u64], returns: FFIType.i32 },
    ImpersonateNamedPipeClient: { args: [FFIType.u64], returns: FFIType.i32 },
    ImpersonateSelf: { args: [FFIType.i32], returns: FFIType.i32 },
    InitializeAcl: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    InitializeSecurityDescriptor: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InitializeSid: { args: [FFIType.ptr, FFIType.ptr, FFIType.u8], returns: FFIType.i32 },
    InitiateShutdownA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    InitiateShutdownW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    InitiateSystemShutdownA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    InitiateSystemShutdownExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    InitiateSystemShutdownExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    InitiateSystemShutdownW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    InstallApplication: { args: [FFIType.ptr], returns: FFIType.u32 },
    IsTextUnicode: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    IsTokenRestricted: { args: [FFIType.u64], returns: FFIType.i32 },
    IsTokenUntrusted: { args: [FFIType.u64], returns: FFIType.i32 },
    IsValidAcl: { args: [FFIType.ptr], returns: FFIType.i32 },
    IsValidSecurityDescriptor: { args: [FFIType.ptr], returns: FFIType.i32 },
    IsValidSid: { args: [FFIType.ptr], returns: FFIType.i32 },
    IsWellKnownSid: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    LockServiceDatabase: { args: [FFIType.u64], returns: FFIType.ptr },
    LogonSecondaryUserIntoSessionW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    LogonUserA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LogonUserExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LogonUserExExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LogonUserExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LogonUserW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LookupAccountNameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LookupAccountNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LookupAccountSidA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LookupAccountSidW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LookupPrivilegeDisplayNameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LookupPrivilegeDisplayNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LookupPrivilegeNameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LookupPrivilegeNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LookupPrivilegeValueA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LookupPrivilegeValueW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LookupSecurityDescriptorPartsA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    LookupSecurityDescriptorPartsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    LsaAddAccountRights: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    LsaAddPrivilegesToAccount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    LsaClearAuditLog: { args: [FFIType.u64], returns: FFIType.i32 },
    LsaClose: { args: [FFIType.u64], returns: FFIType.i32 },
    LsaConfigureAutoLogonCredentials: { args: [FFIType.ptr], returns: FFIType.i32 },
    LsaCreateAccount: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaCreateSecret: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaCreateTrustedDomain: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaCreateTrustedDomainEx: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaDelete: { args: [FFIType.u64], returns: FFIType.i32 },
    LsaDeleteTrustedDomain: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    LsaDisableUserArso: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    LsaEnableUserArso: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    LsaEnumerateAccountRights: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaEnumerateAccounts: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaEnumerateAccountsWithUserRight: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaEnumeratePrivileges: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaEnumeratePrivilegesOfAccount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    LsaEnumerateTrustedDomains: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaEnumerateTrustedDomainsEx: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaFreeMemory: { args: [FFIType.ptr], returns: FFIType.i32 },
    LsaGetAppliedCAPIDs: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaGetDeviceRegistrationInfo: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaGetQuotasForAccount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    LsaGetRemoteUserName: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaGetSystemAccessAccount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    LsaGetUserName: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaICLookupNames: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    LsaICLookupNamesWithCreds: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    LsaICLookupSids: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    LsaICLookupSidsWithCreds: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    LsaInvokeTrustScanner: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    LsaIsUserArsoAllowed: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaIsUserArsoEnabled: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaLookupNames: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaLookupNames2: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaLookupPrivilegeDisplayName: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaLookupPrivilegeName: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaLookupPrivilegeValue: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaLookupSids: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaLookupSids2: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaManageSidNameMapping: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaNtStatusToWinError: { args: [FFIType.i32], returns: FFIType.u32 },
    LsaOpenAccount: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaOpenPolicy: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaOpenPolicySce: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaOpenSecret: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaOpenTrustedDomain: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaOpenTrustedDomainByName: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaProfileDeleted: { args: [FFIType.u64], returns: FFIType.i32 },
    LsaPurgeLocalSystemAccessTable: { args: [FFIType.u64], returns: FFIType.i32 },
    LsaQueryCAPs: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaQueryDomainInformationPolicy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaQueryForestTrustInformation: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaQueryForestTrustInformation2: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaQueryInfoTrustedDomain: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaQueryInformationPolicy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaQueryLocalSystemAccess: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    LsaQueryLocalSystemAccessAll: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    LsaQuerySecret: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaQuerySecurityObject: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaQueryTrustedDomainInfo: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaQueryTrustedDomainInfoByName: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaRemoveAccountRights: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    LsaRemovePrivilegesFromAccount: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    LsaRetrievePrivateData: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaSetCAPs: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    LsaSetDomainInformationPolicy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaSetForestTrustInformation: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    LsaSetForestTrustInformation2: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    LsaSetInformationPolicy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaSetInformationTrustedDomain: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaSetLocalSystemAccess: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    LsaSetQuotasForAccount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    LsaSetSecret: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaSetSecurityObject: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaSetSystemAccessAccount: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    LsaSetTrustedDomainInfoByName: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaSetTrustedDomainInformation: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LsaStorePrivateData: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LsaValidateProcUniqueLuid: { args: [], returns: FFIType.i32 },
    MIDL_user_free_Ext: { args: [FFIType.ptr], returns: FFIType.void },
    MSChapSrvChangePassword: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MSChapSrvChangePassword2: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    MakeAbsoluteSD: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MakeAbsoluteSD2: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MakeSelfRelativeSD: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MapGenericMask: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    NotifyBootConfigStatus: { args: [FFIType.i32], returns: FFIType.i32 },
    NotifyChangeEventLog: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    NotifyServiceStatusChange: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NotifyServiceStatusChangeA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NotifyServiceStatusChangeW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    NpGetUserName: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ObjectCloseAuditAlarmA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    ObjectCloseAuditAlarmW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    ObjectDeleteAuditAlarmA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    ObjectDeleteAuditAlarmW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    ObjectOpenAuditAlarmA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    ObjectOpenAuditAlarmW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    ObjectPrivilegeAuditAlarmA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    ObjectPrivilegeAuditAlarmW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    OpenBackupEventLogA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    OpenBackupEventLogW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    OpenEncryptedFileRawA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    OpenEncryptedFileRawW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    OpenEventLogA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    OpenEventLogW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    OpenProcessToken: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    OpenSCManagerA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    OpenSCManagerW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    OpenServiceA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    OpenServiceW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    OpenThreadToken: { args: [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    OpenThreadWaitChainSession: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    OpenTraceA: { args: [FFIType.ptr], returns: FFIType.u64 },
    OpenTraceW: { args: [FFIType.ptr], returns: FFIType.u64 },
    OperationEnd: { args: [FFIType.ptr], returns: FFIType.i32 },
    OperationStart: { args: [FFIType.ptr], returns: FFIType.i32 },
    PerfAddCounters: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PerfCloseQueryHandle: { args: [FFIType.u64], returns: FFIType.u32 },
    PerfDeleteCounters: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PerfEnumerateCounterSet: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    PerfEnumerateCounterSetInstances: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    PerfOpenQueryHandle: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PerfQueryCounterData: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    PerfQueryCounterInfo: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    PerfQueryCounterSetRegistrationInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    PerfRegCloseKey: { args: [FFIType.ptr], returns: FFIType.i32 },
    PerfRegEnumKey: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PerfRegEnumValue: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PerfRegQueryInfoKey: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PerfRegQueryValue: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PerfRegSetValue: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PrivilegeCheck: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PrivilegedServiceAuditAlarmA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    PrivilegedServiceAuditAlarmW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    ProcessIdleTasks: { args: [], returns: FFIType.u32 },
    ProcessIdleTasksW: { args: [FFIType.u32], returns: FFIType.u32 },
    ProcessTrace: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    QueryAllTracesA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    QueryAllTracesW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    QueryLocalUserServiceName: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    QueryRecoveryAgentsOnEncryptedFile: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    QuerySecurityAccessMask: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    QueryServiceConfig2A: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    QueryServiceConfig2W: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    QueryServiceConfigA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    QueryServiceConfigW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    QueryServiceDynamicInformation: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    QueryServiceLockStatusA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    QueryServiceLockStatusW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    QueryServiceObjectSecurity: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    QueryServiceStatus: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    QueryServiceStatusEx: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    QueryTraceA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    QueryTraceProcessingHandle: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    QueryTraceW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    QueryUserServiceName: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    QueryUserServiceNameForContext: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    QueryUsersOnEncryptedFile: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ReadEncryptedFileRaw: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ReadEventLogA: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReadEventLogW: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegCloseKey: { args: [FFIType.u64], returns: FFIType.i32 },
    RegConnectRegistryA: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RegConnectRegistryExA: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RegConnectRegistryExW: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RegConnectRegistryW: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RegCopyTreeA: { args: [FFIType.u64, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    RegCopyTreeW: { args: [FFIType.u64, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    RegCreateKeyA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegCreateKeyExA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegCreateKeyExW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegCreateKeyTransactedA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RegCreateKeyTransactedW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RegCreateKeyW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegDeleteKeyA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RegDeleteKeyExA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    RegDeleteKeyExW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    RegDeleteKeyTransactedA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RegDeleteKeyTransactedW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RegDeleteKeyValueA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegDeleteKeyValueW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegDeleteKeyW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RegDeleteTreeA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RegDeleteTreeW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RegDeleteValueA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RegDeleteValueW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RegDisablePredefinedCache: { args: [], returns: FFIType.i32 },
    RegDisablePredefinedCacheEx: { args: [], returns: FFIType.i32 },
    RegDisableReflectionKey: { args: [FFIType.u64], returns: FFIType.i32 },
    RegEnableReflectionKey: { args: [FFIType.u64], returns: FFIType.i32 },
    RegEnumKeyA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RegEnumKeyExA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegEnumKeyExW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegEnumKeyW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RegEnumValueA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegEnumValueW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegFlushKey: { args: [FFIType.u64], returns: FFIType.i32 },
    RegGetKeySecurity: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegGetValueA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegGetValueW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegLoadAppKeyA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    RegLoadAppKeyW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    RegLoadKeyA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegLoadKeyW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegLoadMUIStringA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RegLoadMUIStringW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RegNotifyChangeKeyValue: { args: [FFIType.u64, FFIType.i32, FFIType.u32, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    RegOpenCurrentUser: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RegOpenKeyA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegOpenKeyExA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RegOpenKeyExW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RegOpenKeyTransactedA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RegOpenKeyTransactedW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RegOpenKeyW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegOpenUserClassesRoot: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RegOverridePredefKey: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    RegQueryInfoKeyA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegQueryInfoKeyW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegQueryMultipleValuesA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegQueryMultipleValuesW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegQueryReflectionKey: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RegQueryValueA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegQueryValueExA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegQueryValueExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegQueryValueW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegRenameKey: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegReplaceKeyA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegReplaceKeyW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegRestoreKeyA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RegRestoreKeyW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RegSaveKeyA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegSaveKeyExA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RegSaveKeyExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RegSaveKeyW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegSetKeySecurity: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RegSetKeyValueA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RegSetKeyValueW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RegSetValueA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RegSetValueExA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RegSetValueExW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RegSetValueW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RegUnLoadKeyA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RegUnLoadKeyW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RegisterEventSourceA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    RegisterEventSourceW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    RegisterIdleTask: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RegisterServiceCtrlHandlerA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    RegisterServiceCtrlHandlerExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    RegisterServiceCtrlHandlerExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    RegisterServiceCtrlHandlerW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    RegisterWaitChainCOMCallback: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    RemoteRegEnumKeyWrapper: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RemoteRegEnumValueWrapper: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RemoteRegQueryInfoKeyWrapper: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RemoteRegQueryMultipleValues2Wrapper: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RemoteRegQueryMultipleValuesWrapper: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RemoteRegQueryValueWrapper: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RemoveUsersFromEncryptedFile: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ReportEventA: { args: [FFIType.u64, FFIType.u16, FFIType.u16, FFIType.u32, FFIType.ptr, FFIType.u16, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReportEventW: { args: [FFIType.u64, FFIType.u16, FFIType.u16, FFIType.u32, FFIType.ptr, FFIType.u16, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RevertToSelf: { args: [], returns: FFIType.i32 },
    SafeBaseRegGetKeySecurity: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SaferCloseLevel: { args: [FFIType.u64], returns: FFIType.i32 },
    SaferComputeTokenFromLevel: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SaferCreateLevel: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SaferGetLevelInformation: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SaferGetPolicyInformation: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SaferIdentifyLevel: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SaferRecordEventLogEntry: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SaferSetLevelInformation: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SaferSetPolicyInformation: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SaferiChangeRegistryScope: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SaferiCompareTokenLevels: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SaferiIsDllAllowed: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SaferiIsExecutableFileType: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SaferiPopulateDefaultsInRegistry: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SaferiRecordEventLogEntry: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SaferiSearchMatchingHashRules: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetAclInformation: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetEncryptedFileMetadata: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    SetEntriesInAccessListA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetEntriesInAccessListW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetEntriesInAclA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetEntriesInAclW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetEntriesInAuditListA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetEntriesInAuditListW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetFileSecurityA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetFileSecurityW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetInformationCodeAuthzLevelW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetInformationCodeAuthzPolicyW: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetKernelObjectSecurity: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetNamedSecurityInfoA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetNamedSecurityInfoExA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetNamedSecurityInfoExW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetNamedSecurityInfoW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetPrivateObjectSecurity: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    SetPrivateObjectSecurityEx: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    SetSecurityAccessMask: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    SetSecurityDescriptorControl: { args: [FFIType.ptr, FFIType.u16, FFIType.u16], returns: FFIType.i32 },
    SetSecurityDescriptorDacl: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SetSecurityDescriptorGroup: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SetSecurityDescriptorOwner: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SetSecurityDescriptorRMControl: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetSecurityDescriptorSacl: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SetSecurityInfo: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetSecurityInfoExA: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetSecurityInfoExW: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetServiceBits: { args: [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    SetServiceObjectSecurity: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetServiceStatus: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetThreadToken: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    SetTokenInformation: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetUserFileEncryptionKey: { args: [FFIType.ptr], returns: FFIType.u32 },
    SetUserFileEncryptionKeyEx: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    StartServiceA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    StartServiceCtrlDispatcherA: { args: [FFIType.ptr], returns: FFIType.i32 },
    StartServiceCtrlDispatcherW: { args: [FFIType.ptr], returns: FFIType.i32 },
    StartServiceW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    StartTraceA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    StartTraceW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    StopTraceA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    StopTraceW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SystemFunction017: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SystemFunction019: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    TraceSetInformation: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    TreeResetNamedSecurityInfoA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    TreeResetNamedSecurityInfoW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    TreeSetNamedSecurityInfoA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    TreeSetNamedSecurityInfoW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    TrusteeAccessToObjectA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    TrusteeAccessToObjectW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    UninstallApplication: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    UnlockServiceDatabase: { args: [FFIType.ptr], returns: FFIType.i32 },
    UnregisterIdleTask: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    UpdateTraceA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    UpdateTraceW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    UsePinForEncryptedFilesA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    UsePinForEncryptedFilesW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    WaitServiceState: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    WmiCloseBlock: { args: [FFIType.u64], returns: FFIType.u32 },
    WmiDevInstToInstanceNameA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WmiDevInstToInstanceNameW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WmiEnumerateGuids: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WmiExecuteMethodA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WmiExecuteMethodW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WmiFileHandleToInstanceNameA: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WmiFileHandleToInstanceNameW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WmiFreeBuffer: { args: [FFIType.ptr], returns: FFIType.void },
    WmiMofEnumerateResourcesA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WmiMofEnumerateResourcesW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WmiNotificationRegistrationA: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    WmiNotificationRegistrationW: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    WmiOpenBlock: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    WmiQueryAllDataA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WmiQueryAllDataMultipleA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WmiQueryAllDataMultipleW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WmiQueryAllDataW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WmiQueryGuidInformation: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    WmiQuerySingleInstanceA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WmiQuerySingleInstanceMultipleA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WmiQuerySingleInstanceMultipleW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WmiQuerySingleInstanceW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WmiReceiveNotificationsA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WmiReceiveNotificationsW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WmiSetSingleInstanceA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    WmiSetSingleInstanceW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    WmiSetSingleItemA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    WmiSetSingleItemW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    WriteEncryptedFileRaw: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-abortsystemshutdowna
  public static AbortSystemShutdownA(lpMachineName: LPCSTR): BOOL {
    return Advapi32.Load('AbortSystemShutdownA')(lpMachineName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-abortsystemshutdownw
  public static AbortSystemShutdownW(lpMachineName: LPCWSTR): BOOL {
    return Advapi32.Load('AbortSystemShutdownW')(lpMachineName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-accesscheck
  public static AccessCheck(pSecurityDescriptor: PSECURITY_DESCRIPTOR, ClientToken: HANDLE, DesiredAccess: DWORD, GenericMapping: PGENERIC_MAPPING, PrivilegeSet: PPRIVILEGE_SET, PrivilegeSetLength: LPDWORD, GrantedAccess: LPDWORD, AccessStatus: LPBOOL): BOOL {
    return Advapi32.Load('AccessCheck')(pSecurityDescriptor, ClientToken, DesiredAccess, GenericMapping, PrivilegeSet, PrivilegeSetLength, GrantedAccess, AccessStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-accesscheckandauditalarma
  public static AccessCheckAndAuditAlarmA(SubsystemName: LPCSTR, HandleId: LPVOID, ObjectTypeName: LPSTR, ObjectName: LPSTR, SecurityDescriptor: PSECURITY_DESCRIPTOR, DesiredAccess: DWORD, GenericMapping: PGENERIC_MAPPING, ObjectCreation: BOOL, GrantedAccess: LPDWORD, AccessStatus: LPBOOL, pfGenerateOnClose: LPBOOL): BOOL {
    return Advapi32.Load('AccessCheckAndAuditAlarmA')(SubsystemName, HandleId, ObjectTypeName, ObjectName, SecurityDescriptor, DesiredAccess, GenericMapping, ObjectCreation, GrantedAccess, AccessStatus, pfGenerateOnClose);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-accesscheckandauditalarmw
  public static AccessCheckAndAuditAlarmW(SubsystemName: LPCWSTR, HandleId: LPVOID, ObjectTypeName: LPWSTR, ObjectName: LPWSTR, SecurityDescriptor: PSECURITY_DESCRIPTOR, DesiredAccess: DWORD, GenericMapping: PGENERIC_MAPPING, ObjectCreation: BOOL, GrantedAccess: LPDWORD, AccessStatus: LPBOOL, pfGenerateOnClose: LPBOOL): BOOL {
    return Advapi32.Load('AccessCheckAndAuditAlarmW')(SubsystemName, HandleId, ObjectTypeName, ObjectName, SecurityDescriptor, DesiredAccess, GenericMapping, ObjectCreation, GrantedAccess, AccessStatus, pfGenerateOnClose);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-accesscheckbytype
  public static AccessCheckByType(pSecurityDescriptor: PSECURITY_DESCRIPTOR, PrincipalSelfSid: PSID, ClientToken: HANDLE, DesiredAccess: DWORD, ObjectTypeList: POBJECT_TYPE_LIST, ObjectTypeListLength: DWORD, GenericMapping: PGENERIC_MAPPING, PrivilegeSet: PPRIVILEGE_SET, PrivilegeSetLength: LPDWORD, GrantedAccess: LPDWORD, AccessStatus: LPBOOL): BOOL {
    return Advapi32.Load('AccessCheckByType')(pSecurityDescriptor, PrincipalSelfSid, ClientToken, DesiredAccess, ObjectTypeList, ObjectTypeListLength, GenericMapping, PrivilegeSet, PrivilegeSetLength, GrantedAccess, AccessStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-accesscheckbytypeandauditalarma
  public static AccessCheckByTypeAndAuditAlarmA(SubsystemName: LPCSTR, HandleId: LPVOID, ObjectTypeName: LPCSTR, ObjectName: LPCSTR, SecurityDescriptor: PSECURITY_DESCRIPTOR, PrincipalSelfSid: PSID, ClientToken: HANDLE, DesiredAccess: DWORD, AuditType: AUDIT_EVENT_TYPE, ObjectTypeList: POBJECT_TYPE_LIST, ObjectTypeListLength: DWORD, GenericMapping: PGENERIC_MAPPING, PrivilegeSet: PPRIVILEGE_SET, PrivilegeSetLength: LPDWORD, ObjectCreation: BOOL, GrantedAccess: LPDWORD, AccessStatus: LPBOOL, pfGenerateOnClose: LPBOOL): BOOL {
    return Advapi32.Load('AccessCheckByTypeAndAuditAlarmA')(SubsystemName, HandleId, ObjectTypeName, ObjectName, SecurityDescriptor, PrincipalSelfSid, ClientToken, DesiredAccess, AuditType, ObjectTypeList, ObjectTypeListLength, GenericMapping, PrivilegeSet, PrivilegeSetLength, ObjectCreation, GrantedAccess, AccessStatus, pfGenerateOnClose);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-accesscheckbytypeandauditalarmw
  public static AccessCheckByTypeAndAuditAlarmW(SubsystemName: LPCWSTR, HandleId: LPVOID, ObjectTypeName: LPCWSTR, ObjectName: LPCWSTR, SecurityDescriptor: PSECURITY_DESCRIPTOR, PrincipalSelfSid: PSID, ClientToken: HANDLE, DesiredAccess: DWORD, AuditType: AUDIT_EVENT_TYPE, ObjectTypeList: POBJECT_TYPE_LIST, ObjectTypeListLength: DWORD, GenericMapping: PGENERIC_MAPPING, PrivilegeSet: PPRIVILEGE_SET, PrivilegeSetLength: LPDWORD, ObjectCreation: BOOL, GrantedAccess: LPDWORD, AccessStatus: LPBOOL, pfGenerateOnClose: LPBOOL): BOOL {
    return Advapi32.Load('AccessCheckByTypeAndAuditAlarmW')(SubsystemName, HandleId, ObjectTypeName, ObjectName, SecurityDescriptor, PrincipalSelfSid, ClientToken, DesiredAccess, AuditType, ObjectTypeList, ObjectTypeListLength, GenericMapping, PrivilegeSet, PrivilegeSetLength, ObjectCreation, GrantedAccess, AccessStatus, pfGenerateOnClose);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-accesscheckbytyperesultlist
  public static AccessCheckByTypeResultList(pSecurityDescriptor: PSECURITY_DESCRIPTOR, PrincipalSelfSid: PSID, ClientToken: HANDLE, DesiredAccess: DWORD, ObjectTypeList: POBJECT_TYPE_LIST, ObjectTypeListLength: DWORD, GenericMapping: PGENERIC_MAPPING, PrivilegeSet: PPRIVILEGE_SET, PrivilegeSetLength: LPDWORD, GrantedAccessList: LPDWORD, AccessStatusList: LPDWORD): BOOL {
    return Advapi32.Load('AccessCheckByTypeResultList')(pSecurityDescriptor, PrincipalSelfSid, ClientToken, DesiredAccess, ObjectTypeList, ObjectTypeListLength, GenericMapping, PrivilegeSet, PrivilegeSetLength, GrantedAccessList, AccessStatusList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-accesscheckbytyperesultlistandauditalarma
  public static AccessCheckByTypeResultListAndAuditAlarmA(SubsystemName: LPCSTR, HandleId: LPVOID, ObjectTypeName: LPCSTR, ObjectName: LPCSTR, SecurityDescriptor: PSECURITY_DESCRIPTOR, PrincipalSelfSid: PSID, ClientToken: HANDLE, DesiredAccess: DWORD, AuditType: AUDIT_EVENT_TYPE, ObjectTypeList: POBJECT_TYPE_LIST, ObjectTypeListLength: DWORD, GenericMapping: PGENERIC_MAPPING, PrivilegeSet: PPRIVILEGE_SET, PrivilegeSetLength: LPDWORD, ObjectCreation: BOOL, GrantedAccessList: LPDWORD, AccessStatusList: LPDWORD, pfGenerateOnClose: LPBOOL): BOOL {
    return Advapi32.Load('AccessCheckByTypeResultListAndAuditAlarmA')(SubsystemName, HandleId, ObjectTypeName, ObjectName, SecurityDescriptor, PrincipalSelfSid, ClientToken, DesiredAccess, AuditType, ObjectTypeList, ObjectTypeListLength, GenericMapping, PrivilegeSet, PrivilegeSetLength, ObjectCreation, GrantedAccessList, AccessStatusList, pfGenerateOnClose);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-accesscheckbytyperesultlistandauditalarmbyhandlea
  public static AccessCheckByTypeResultListAndAuditAlarmByHandleA(SubsystemName: LPCSTR, HandleId: LPVOID, ClientToken: HANDLE, ObjectTypeName: LPCSTR, ObjectName: LPCSTR, SecurityDescriptor: PSECURITY_DESCRIPTOR, PrincipalSelfSid: PSID, ClientToken2: HANDLE, DesiredAccess: DWORD, AuditType: AUDIT_EVENT_TYPE, ObjectTypeList: POBJECT_TYPE_LIST, ObjectTypeListLength: DWORD, GenericMapping: PGENERIC_MAPPING, PrivilegeSet: PPRIVILEGE_SET, PrivilegeSetLength: LPDWORD, ObjectCreation: BOOL, GrantedAccessList: LPDWORD, AccessStatusList: LPDWORD, pfGenerateOnClose: LPBOOL): BOOL {
    return Advapi32.Load('AccessCheckByTypeResultListAndAuditAlarmByHandleA')(SubsystemName, HandleId, ClientToken, ObjectTypeName, ObjectName, SecurityDescriptor, PrincipalSelfSid, ClientToken2, DesiredAccess, AuditType, ObjectTypeList, ObjectTypeListLength, GenericMapping, PrivilegeSet, PrivilegeSetLength, ObjectCreation, GrantedAccessList, AccessStatusList, pfGenerateOnClose);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-accesscheckbytyperesultlistandauditalarmbyhandlew
  public static AccessCheckByTypeResultListAndAuditAlarmByHandleW(SubsystemName: LPCWSTR, HandleId: LPVOID, ClientToken: HANDLE, ObjectTypeName: LPCWSTR, ObjectName: LPCWSTR, SecurityDescriptor: PSECURITY_DESCRIPTOR, PrincipalSelfSid: PSID, ClientToken2: HANDLE, DesiredAccess: DWORD, AuditType: AUDIT_EVENT_TYPE, ObjectTypeList: POBJECT_TYPE_LIST, ObjectTypeListLength: DWORD, GenericMapping: PGENERIC_MAPPING, PrivilegeSet: PPRIVILEGE_SET, PrivilegeSetLength: LPDWORD, ObjectCreation: BOOL, GrantedAccessList: LPDWORD, AccessStatusList: LPDWORD, pfGenerateOnClose: LPBOOL): BOOL {
    return Advapi32.Load('AccessCheckByTypeResultListAndAuditAlarmByHandleW')(SubsystemName, HandleId, ClientToken, ObjectTypeName, ObjectName, SecurityDescriptor, PrincipalSelfSid, ClientToken2, DesiredAccess, AuditType, ObjectTypeList, ObjectTypeListLength, GenericMapping, PrivilegeSet, PrivilegeSetLength, ObjectCreation, GrantedAccessList, AccessStatusList, pfGenerateOnClose);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-accesscheckbytyperesultlistandauditalarmw
  public static AccessCheckByTypeResultListAndAuditAlarmW(SubsystemName: LPCWSTR, HandleId: LPVOID, ObjectTypeName: LPCWSTR, ObjectName: LPCWSTR, SecurityDescriptor: PSECURITY_DESCRIPTOR, PrincipalSelfSid: PSID, ClientToken: HANDLE, DesiredAccess: DWORD, AuditType: AUDIT_EVENT_TYPE, ObjectTypeList: POBJECT_TYPE_LIST, ObjectTypeListLength: DWORD, GenericMapping: PGENERIC_MAPPING, PrivilegeSet: PPRIVILEGE_SET, PrivilegeSetLength: LPDWORD, ObjectCreation: BOOL, GrantedAccessList: LPDWORD, AccessStatusList: LPDWORD, pfGenerateOnClose: LPBOOL): BOOL {
    return Advapi32.Load('AccessCheckByTypeResultListAndAuditAlarmW')(SubsystemName, HandleId, ObjectTypeName, ObjectName, SecurityDescriptor, PrincipalSelfSid, ClientToken, DesiredAccess, AuditType, ObjectTypeList, ObjectTypeListLength, GenericMapping, PrivilegeSet, PrivilegeSetLength, ObjectCreation, GrantedAccessList, AccessStatusList, pfGenerateOnClose);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addaccessallowedace
  public static AddAccessAllowedAce(pAcl: PACL, dwAceRevision: DWORD, AccessMask: DWORD, pSid: PSID): BOOL {
    return Advapi32.Load('AddAccessAllowedAce')(pAcl, dwAceRevision, AccessMask, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addaccessallowedaceex
  public static AddAccessAllowedAceEx(pAcl: PACL, dwAceRevision: DWORD, AceFlags: DWORD, AccessMask: DWORD, pSid: PSID): BOOL {
    return Advapi32.Load('AddAccessAllowedAceEx')(pAcl, dwAceRevision, AceFlags, AccessMask, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addaccessallowedobjectace
  public static AddAccessAllowedObjectAce(pAcl: PACL, dwAceRevision: DWORD, AceFlags: DWORD, AccessMask: DWORD, ObjectTypeGuid: PVOID, InheritedObjectTypeGuid: PVOID, pSid: PSID): BOOL {
    return Advapi32.Load('AddAccessAllowedObjectAce')(pAcl, dwAceRevision, AceFlags, AccessMask, ObjectTypeGuid, InheritedObjectTypeGuid, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addaccessdeniedace
  public static AddAccessDeniedAce(pAcl: PACL, dwAceRevision: DWORD, AccessMask: DWORD, pSid: PSID): BOOL {
    return Advapi32.Load('AddAccessDeniedAce')(pAcl, dwAceRevision, AccessMask, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addaccessdeniedaceex
  public static AddAccessDeniedAceEx(pAcl: PACL, dwAceRevision: DWORD, AceFlags: DWORD, AccessMask: DWORD, pSid: PSID): BOOL {
    return Advapi32.Load('AddAccessDeniedAceEx')(pAcl, dwAceRevision, AceFlags, AccessMask, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addaccessdeniedobjectace
  public static AddAccessDeniedObjectAce(pAcl: PACL, dwAceRevision: DWORD, AceFlags: DWORD, AccessMask: DWORD, ObjectTypeGuid: PVOID, InheritedObjectTypeGuid: PVOID, pSid: PSID): BOOL {
    return Advapi32.Load('AddAccessDeniedObjectAce')(pAcl, dwAceRevision, AceFlags, AccessMask, ObjectTypeGuid, InheritedObjectTypeGuid, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addace
  public static AddAce(pAcl: PACL, dwAceRevision: DWORD, dwStartingAceIndex: DWORD, pAceList: LPVOID, nAceListLength: DWORD): BOOL {
    return Advapi32.Load('AddAce')(pAcl, dwAceRevision, dwStartingAceIndex, pAceList, nAceListLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addauditaccessace
  public static AddAuditAccessAce(pAcl: PACL, dwAceRevision: DWORD, dwAccessMask: DWORD, pSid: PSID, bAuditSuccess: BOOL, bAuditFailure: BOOL): BOOL {
    return Advapi32.Load('AddAuditAccessAce')(pAcl, dwAceRevision, dwAccessMask, pSid, bAuditSuccess, bAuditFailure);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addauditaccessaceex
  public static AddAuditAccessAceEx(pAcl: PACL, dwAceRevision: DWORD, AceFlags: DWORD, dwAccessMask: DWORD, pSid: PSID, bAuditSuccess: BOOL, bAuditFailure: BOOL): BOOL {
    return Advapi32.Load('AddAuditAccessAceEx')(pAcl, dwAceRevision, AceFlags, dwAccessMask, pSid, bAuditSuccess, bAuditFailure);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addauditaccessobjectace
  public static AddAuditAccessObjectAce(pAcl: PACL, dwAceRevision: DWORD, AceFlags: DWORD, AccessMask: DWORD, ObjectTypeGuid: PVOID, InheritedObjectTypeGuid: PVOID, pSid: PSID, bAuditSuccess: BOOL, bAuditFailure: BOOL): BOOL {
    return Advapi32.Load('AddAuditAccessObjectAce')(pAcl, dwAceRevision, AceFlags, AccessMask, ObjectTypeGuid, InheritedObjectTypeGuid, pSid, bAuditSuccess, bAuditFailure);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addconditionalace
  public static AddConditionalAce(pAcl: PACL, dwAceRevision: DWORD, AceFlags: DWORD, AceType: BYTE, AccessMask: DWORD, pSid: PSID, ConditionStr: LPCWSTR, ReturnLength: LPDWORD): BOOL {
    return Advapi32.Load('AddConditionalAce')(pAcl, dwAceRevision, AceFlags, AceType, AccessMask, pSid, ConditionStr, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-adduserstoencryptedfile
  public static AddUsersToEncryptedFile(lpFileName: LPCWSTR, pEncryptionCertificates: PENCRYPTION_CERTIFICATE_HASH_LIST): DWORD {
    return Advapi32.Load('AddUsersToEncryptedFile')(lpFileName, pEncryptionCertificates);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-adduserstoencryptedfileex
  public static AddUsersToEncryptedFileEx(lpFileName: LPCWSTR, dwFlags: DWORD, pEncryptionCertificates: PENCRYPTION_CERTIFICATE_HASH_LIST, pvReserved: PVOID): DWORD {
    return Advapi32.Load('AddUsersToEncryptedFileEx')(lpFileName, dwFlags, pEncryptionCertificates, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-adjusttokengroups
  public static AdjustTokenGroups(TokenHandle: HANDLE, ResetToDefault: BOOL, NewState: PTOKEN_GROUPS, BufferLength: DWORD, PreviousState: PTOKEN_GROUPS, ReturnLength: LPDWORD): BOOL {
    return Advapi32.Load('AdjustTokenGroups')(TokenHandle, ResetToDefault, NewState, BufferLength, PreviousState, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-adjusttokenprivileges
  public static AdjustTokenPrivileges(TokenHandle: HANDLE, DisableAllPrivileges: BOOL, NewState: PTOKEN_PRIVILEGES, BufferLength: DWORD, PreviousState: PTOKEN_PRIVILEGES | NULL, ReturnLength: LPDWORD | NULL): BOOL {
    return Advapi32.Load('AdjustTokenPrivileges')(TokenHandle, DisableAllPrivileges, NewState, BufferLength, PreviousState, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-allocateandinitializesid
  public static AllocateAndInitializeSid(pIdentifierAuthority: PSID_IDENTIFIER_AUTHORITY, nSubAuthorityCount: BYTE, nSubAuthority0: DWORD, nSubAuthority1: DWORD, nSubAuthority2: DWORD, nSubAuthority3: DWORD, nSubAuthority4: DWORD, nSubAuthority5: DWORD, nSubAuthority6: DWORD, nSubAuthority7: DWORD, pSid: PVOID): BOOL {
    return Advapi32.Load('AllocateAndInitializeSid')(pIdentifierAuthority, nSubAuthorityCount, nSubAuthority0, nSubAuthority1, nSubAuthority2, nSubAuthority3, nSubAuthority4, nSubAuthority5, nSubAuthority6, nSubAuthority7, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-allocatelocallyuniqueid
  public static AllocateLocallyUniqueId(Luid: PVOID): BOOL {
    return Advapi32.Load('AllocateLocallyUniqueId')(Luid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-areallaccessesgranted
  public static AreAllAccessesGranted(GrantedAccess: DWORD, DesiredAccess: DWORD): BOOL {
    return Advapi32.Load('AreAllAccessesGranted')(GrantedAccess, DesiredAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-areanyaccessesgranted
  public static AreAnyAccessesGranted(GrantedAccess: DWORD, DesiredAccess: DWORD): BOOL {
    return Advapi32.Load('AreAnyAccessesGranted')(GrantedAccess, DesiredAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditcomputeeffectivepolicybysid
  public static AuditComputeEffectivePolicyBySid(pSid: PSID, pSubCategoryGuids: PVOID, dwPolicyCount: ULONG, ppAuditPolicy: PVOID): BOOL {
    return Advapi32.Load('AuditComputeEffectivePolicyBySid')(pSid, pSubCategoryGuids, dwPolicyCount, ppAuditPolicy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditcomputeeffectivepolicybytoken
  public static AuditComputeEffectivePolicyByToken(hTokenHandle: HANDLE, pSubCategoryGuids: PVOID, dwPolicyCount: ULONG, ppAuditPolicy: PVOID): BOOL {
    return Advapi32.Load('AuditComputeEffectivePolicyByToken')(hTokenHandle, pSubCategoryGuids, dwPolicyCount, ppAuditPolicy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditenumeratecategories
  public static AuditEnumerateCategories(ppAuditCategoriesArray: PVOID, pdwCountReturned: PDWORD): BOOL {
    return Advapi32.Load('AuditEnumerateCategories')(ppAuditCategoriesArray, pdwCountReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditenumerateperuserpolicy
  public static AuditEnumeratePerUserPolicy(ppAuditSidArray: PVOID): BOOL {
    return Advapi32.Load('AuditEnumeratePerUserPolicy')(ppAuditSidArray);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditenumeratesubcategories
  public static AuditEnumerateSubCategories(pAuditCategoryGuid: PVOID, bRetrieveAllSubCategories: BOOL, ppAuditSubCategoriesArray: PVOID, pdwCountReturned: PDWORD): BOOL {
    return Advapi32.Load('AuditEnumerateSubCategories')(pAuditCategoryGuid, bRetrieveAllSubCategories, ppAuditSubCategoriesArray, pdwCountReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditfree
  public static AuditFree(Buffer: PVOID): VOID {
    return Advapi32.Load('AuditFree')(Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditlookupcategoryguidfromcategoryid
  public static AuditLookupCategoryGuidFromCategoryId(AuditCategoryId: DWORD, pAuditCategoryGuid: PVOID): BOOL {
    return Advapi32.Load('AuditLookupCategoryGuidFromCategoryId')(AuditCategoryId, pAuditCategoryGuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditlookupcategoryidfromcategoryguid
  public static AuditLookupCategoryIdFromCategoryGuid(pAuditCategoryGuid: PVOID, pAuditCategoryId: PVOID): BOOL {
    return Advapi32.Load('AuditLookupCategoryIdFromCategoryGuid')(pAuditCategoryGuid, pAuditCategoryId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditlookupcategorynamea
  public static AuditLookupCategoryNameA(pAuditCategoryGuid: PVOID, ppszCategoryName: PVOID): BOOL {
    return Advapi32.Load('AuditLookupCategoryNameA')(pAuditCategoryGuid, ppszCategoryName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditlookupcategorynamew
  public static AuditLookupCategoryNameW(pAuditCategoryGuid: PVOID, ppszCategoryName: PVOID): BOOL {
    return Advapi32.Load('AuditLookupCategoryNameW')(pAuditCategoryGuid, ppszCategoryName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditlookupsubcategorynamea
  public static AuditLookupSubCategoryNameA(pAuditSubCategoryGuid: PVOID, ppszSubCategoryName: PVOID): BOOL {
    return Advapi32.Load('AuditLookupSubCategoryNameA')(pAuditSubCategoryGuid, ppszSubCategoryName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditlookupsubcategorynamew
  public static AuditLookupSubCategoryNameW(pAuditSubCategoryGuid: PVOID, ppszSubCategoryName: PVOID): BOOL {
    return Advapi32.Load('AuditLookupSubCategoryNameW')(pAuditSubCategoryGuid, ppszSubCategoryName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditqueryglobalsacla
  public static AuditQueryGlobalSaclA(ObjectTypeName: LPCSTR, Acl: PVOID): BOOL {
    return Advapi32.Load('AuditQueryGlobalSaclA')(ObjectTypeName, Acl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditqueryglobalsaclw
  public static AuditQueryGlobalSaclW(ObjectTypeName: LPCWSTR, Acl: PVOID): BOOL {
    return Advapi32.Load('AuditQueryGlobalSaclW')(ObjectTypeName, Acl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditqueryperuserpolicy
  public static AuditQueryPerUserPolicy(pSid: PSID, pSubCategoryGuids: PVOID, dwPolicyCount: ULONG, ppAuditPolicy: PVOID): BOOL {
    return Advapi32.Load('AuditQueryPerUserPolicy')(pSid, pSubCategoryGuids, dwPolicyCount, ppAuditPolicy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditquerysecurity
  public static AuditQuerySecurity(SecurityInformation: SECURITY_INFORMATION, ppSecurityDescriptor: PVOID): BOOL {
    return Advapi32.Load('AuditQuerySecurity')(SecurityInformation, ppSecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditquerysystempolicy
  public static AuditQuerySystemPolicy(pSubCategoryGuids: PVOID, dwPolicyCount: ULONG, ppAuditPolicy: PVOID): BOOL {
    return Advapi32.Load('AuditQuerySystemPolicy')(pSubCategoryGuids, dwPolicyCount, ppAuditPolicy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditsetglobalsacla
  public static AuditSetGlobalSaclA(ObjectTypeName: LPCSTR, Acl: PACL): BOOL {
    return Advapi32.Load('AuditSetGlobalSaclA')(ObjectTypeName, Acl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditsetglobalsaclw
  public static AuditSetGlobalSaclW(ObjectTypeName: LPCWSTR, Acl: PACL): BOOL {
    return Advapi32.Load('AuditSetGlobalSaclW')(ObjectTypeName, Acl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditsetperuserpolicy
  public static AuditSetPerUserPolicy(pSid: PSID, pAuditPolicy: PVOID, dwPolicyCount: ULONG): BOOL {
    return Advapi32.Load('AuditSetPerUserPolicy')(pSid, pAuditPolicy, dwPolicyCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditsetsecurity
  public static AuditSetSecurity(SecurityInformation: SECURITY_INFORMATION, pSecurityDescriptor: PSECURITY_DESCRIPTOR): BOOL {
    return Advapi32.Load('AuditSetSecurity')(SecurityInformation, pSecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditsetsystempolicy
  public static AuditSetSystemPolicy(pAuditPolicy: PVOID, dwPolicyCount: ULONG): BOOL {
    return Advapi32.Load('AuditSetSystemPolicy')(pAuditPolicy, dwPolicyCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-backupeventloga
  public static BackupEventLogA(hEventLog: HANDLE, lpBackupFileName: LPCSTR): BOOL {
    return Advapi32.Load('BackupEventLogA')(hEventLog, lpBackupFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-backupeventlogw
  public static BackupEventLogW(hEventLog: HANDLE, lpBackupFileName: LPCWSTR): BOOL {
    return Advapi32.Load('BackupEventLogW')(hEventLog, lpBackupFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-baseregclosekey
  public static BaseRegCloseKey(hKey: PVOID): LSTATUS {
    return Advapi32.Load('BaseRegCloseKey')(hKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-baseregcreatekey
  public static BaseRegCreateKey(hKey: PVOID, lpSubKey: PVOID, lpClass: PVOID, dwOptions: DWORD, lpSecurityAttributes: PVOID, samDesired: REGSAM, Reserved: DWORD, phkResult: PVOID, lpdwDisposition: LPDWORD, pExtendedParameter: PVOID): LSTATUS {
    return Advapi32.Load('BaseRegCreateKey')(hKey, lpSubKey, lpClass, dwOptions, lpSecurityAttributes, samDesired, Reserved, phkResult, lpdwDisposition, pExtendedParameter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-baseregdeletekeyex
  public static BaseRegDeleteKeyEx(hKey: PVOID, lpSubKey: PVOID, samDesired: REGSAM, Reserved: DWORD): LSTATUS {
    return Advapi32.Load('BaseRegDeleteKeyEx')(hKey, lpSubKey, samDesired, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-baseregdeletevalue
  public static BaseRegDeleteValue(hKey: PVOID, lpValueName: PVOID): LSTATUS {
    return Advapi32.Load('BaseRegDeleteValue')(hKey, lpValueName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-baseregflushkey
  public static BaseRegFlushKey(hKey: PVOID): LSTATUS {
    return Advapi32.Load('BaseRegFlushKey')(hKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-basereggetversion
  public static BaseRegGetVersion(hKey: PVOID, pdwVersion: LPDWORD): LSTATUS {
    return Advapi32.Load('BaseRegGetVersion')(hKey, pdwVersion);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-baseregloadkey
  public static BaseRegLoadKey(hKey: PVOID, lpSubKey: PVOID, lpFile: PVOID): LSTATUS {
    return Advapi32.Load('BaseRegLoadKey')(hKey, lpSubKey, lpFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-baseregopenkey
  public static BaseRegOpenKey(hKey: PVOID, lpSubKey: PVOID, dwOptions: DWORD, samDesired: REGSAM, phkResult: PVOID): LSTATUS {
    return Advapi32.Load('BaseRegOpenKey')(hKey, lpSubKey, dwOptions, samDesired, phkResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-baseregrestorekey
  public static BaseRegRestoreKey(hKey: PVOID, lpFile: PVOID, dwFlags: DWORD): LSTATUS {
    return Advapi32.Load('BaseRegRestoreKey')(hKey, lpFile, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-baseregsavekeyex
  public static BaseRegSaveKeyEx(hKey: PVOID, lpFile: PVOID, lpSecurityAttributes: PVOID, Flags: DWORD): LSTATUS {
    return Advapi32.Load('BaseRegSaveKeyEx')(hKey, lpFile, lpSecurityAttributes, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-baseregsetkeysecurity
  public static BaseRegSetKeySecurity(hKey: PVOID, SecurityInformation: SECURITY_INFORMATION, pSecurityDescriptor: PSECURITY_DESCRIPTOR): LSTATUS {
    return Advapi32.Load('BaseRegSetKeySecurity')(hKey, SecurityInformation, pSecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-baseregsetvalue
  public static BaseRegSetValue(hKey: PVOID, lpValueName: PVOID, dwType: DWORD, lpData: PVOID, cbData: DWORD): LSTATUS {
    return Advapi32.Load('BaseRegSetValue')(hKey, lpValueName, dwType, lpData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-baseregunloadkey
  public static BaseRegUnLoadKey(hKey: PVOID, lpSubKey: PVOID): LSTATUS {
    return Advapi32.Load('BaseRegUnLoadKey')(hKey, lpSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildexplicitaccesswithnamea
  public static BuildExplicitAccessWithNameA(pExplicitAccess: PEXPLICIT_ACCESSA, pTrusteeName: LPSTR, AccessPermissions: DWORD, AccessMode: DWORD, Inheritance: DWORD): VOID {
    return Advapi32.Load('BuildExplicitAccessWithNameA')(pExplicitAccess, pTrusteeName, AccessPermissions, AccessMode, Inheritance);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildexplicitaccesswithnamew
  public static BuildExplicitAccessWithNameW(pExplicitAccess: PEXPLICIT_ACCESSW, pTrusteeName: LPWSTR, AccessPermissions: DWORD, AccessMode: DWORD, Inheritance: DWORD): VOID {
    return Advapi32.Load('BuildExplicitAccessWithNameW')(pExplicitAccess, pTrusteeName, AccessPermissions, AccessMode, Inheritance);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildimpersonateexplicitaccesswithnamea
  public static BuildImpersonateExplicitAccessWithNameA(pExplicitAccess: PEXPLICIT_ACCESSA, pTrusteeName: LPSTR, pTrustee: PTRUSTEE, AccessPermissions: DWORD, AccessMode: DWORD, Inheritance: DWORD): VOID {
    return Advapi32.Load('BuildImpersonateExplicitAccessWithNameA')(pExplicitAccess, pTrusteeName, pTrustee, AccessPermissions, AccessMode, Inheritance);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildimpersonateexplicitaccesswithnamew
  public static BuildImpersonateExplicitAccessWithNameW(pExplicitAccess: PEXPLICIT_ACCESSW, pTrusteeName: LPWSTR, pTrustee: PTRUSTEE, AccessPermissions: DWORD, AccessMode: DWORD, Inheritance: DWORD): VOID {
    return Advapi32.Load('BuildImpersonateExplicitAccessWithNameW')(pExplicitAccess, pTrusteeName, pTrustee, AccessPermissions, AccessMode, Inheritance);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildimpersonatetrusteea
  public static BuildImpersonateTrusteeA(pTrustee: PTRUSTEE, pImpersonateTrustee: PTRUSTEE): VOID {
    return Advapi32.Load('BuildImpersonateTrusteeA')(pTrustee, pImpersonateTrustee);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildimpersonatetrusteew
  public static BuildImpersonateTrusteeW(pTrustee: PTRUSTEE, pImpersonateTrustee: PTRUSTEE): VOID {
    return Advapi32.Load('BuildImpersonateTrusteeW')(pTrustee, pImpersonateTrustee);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildsecuritydescriptora
  public static BuildSecurityDescriptorA(pOwner: PTRUSTEE, pGroup: PTRUSTEE, cCountOfAccessEntries: ULONG, pListOfAccessEntries: PEXPLICIT_ACCESSA, cCountOfAuditEntries: ULONG, pListOfAuditEntries: PEXPLICIT_ACCESSA, pOldSD: PSECURITY_DESCRIPTOR, pSizeNewSD: PULONG, ppNewSD: PVOID): DWORD {
    return Advapi32.Load('BuildSecurityDescriptorA')(pOwner, pGroup, cCountOfAccessEntries, pListOfAccessEntries, cCountOfAuditEntries, pListOfAuditEntries, pOldSD, pSizeNewSD, ppNewSD);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildsecuritydescriptorw
  public static BuildSecurityDescriptorW(pOwner: PTRUSTEE, pGroup: PTRUSTEE, cCountOfAccessEntries: ULONG, pListOfAccessEntries: PEXPLICIT_ACCESSW, cCountOfAuditEntries: ULONG, pListOfAuditEntries: PEXPLICIT_ACCESSW, pOldSD: PSECURITY_DESCRIPTOR, pSizeNewSD: PULONG, ppNewSD: PVOID): DWORD {
    return Advapi32.Load('BuildSecurityDescriptorW')(pOwner, pGroup, cCountOfAccessEntries, pListOfAccessEntries, cCountOfAuditEntries, pListOfAuditEntries, pOldSD, pSizeNewSD, ppNewSD);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildtrusteewithnamea
  public static BuildTrusteeWithNameA(pTrustee: PTRUSTEE, pName: LPSTR): VOID {
    return Advapi32.Load('BuildTrusteeWithNameA')(pTrustee, pName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildtrusteewithnamew
  public static BuildTrusteeWithNameW(pTrustee: PTRUSTEE, pName: LPWSTR): VOID {
    return Advapi32.Load('BuildTrusteeWithNameW')(pTrustee, pName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildtrusteewithobjectsandnamea
  public static BuildTrusteeWithObjectsAndNameA(pTrustee: PTRUSTEE, pObjName: PVOID, ObjectType: DWORD, ObjectTypeName: LPSTR, InheritedObjectTypeName: LPSTR, Name: LPSTR): VOID {
    return Advapi32.Load('BuildTrusteeWithObjectsAndNameA')(pTrustee, pObjName, ObjectType, ObjectTypeName, InheritedObjectTypeName, Name);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildtrusteewithobjectsandnamew
  public static BuildTrusteeWithObjectsAndNameW(pTrustee: PTRUSTEE, pObjName: PVOID, ObjectType: DWORD, ObjectTypeName: LPWSTR, InheritedObjectTypeName: LPWSTR, Name: LPWSTR): VOID {
    return Advapi32.Load('BuildTrusteeWithObjectsAndNameW')(pTrustee, pObjName, ObjectType, ObjectTypeName, InheritedObjectTypeName, Name);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildtrusteewithobjectsandsida
  public static BuildTrusteeWithObjectsAndSidA(pTrustee: PTRUSTEE, pObjSid: PVOID, pObjectGuid: PVOID, pInheritedObjectGuid: PVOID, pSid: PSID): VOID {
    return Advapi32.Load('BuildTrusteeWithObjectsAndSidA')(pTrustee, pObjSid, pObjectGuid, pInheritedObjectGuid, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildtrusteewithobjectsandsidw
  public static BuildTrusteeWithObjectsAndSidW(pTrustee: PTRUSTEE, pObjSid: PVOID, pObjectGuid: PVOID, pInheritedObjectGuid: PVOID, pSid: PSID): VOID {
    return Advapi32.Load('BuildTrusteeWithObjectsAndSidW')(pTrustee, pObjSid, pObjectGuid, pInheritedObjectGuid, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildtrusteewithsida
  public static BuildTrusteeWithSidA(pTrustee: PTRUSTEE, pSid: PSID): VOID {
    return Advapi32.Load('BuildTrusteeWithSidA')(pTrustee, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildtrusteewithsidw
  public static BuildTrusteeWithSidW(pTrustee: PTRUSTEE, pSid: PSID): VOID {
    return Advapi32.Load('BuildTrusteeWithSidW')(pTrustee, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-canceloverlappedaccess
  public static CancelOverlappedAccess(pOverlapped: PVOID): DWORD {
    return Advapi32.Load('CancelOverlappedAccess')(pOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-changeserviceconfig2a
  public static ChangeServiceConfig2A(hService: SC_HANDLE, dwInfoLevel: DWORD, lpInfo: LPVOID): BOOL {
    return Advapi32.Load('ChangeServiceConfig2A')(hService, dwInfoLevel, lpInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-changeserviceconfig2w
  public static ChangeServiceConfig2W(hService: SC_HANDLE, dwInfoLevel: DWORD, lpInfo: LPVOID): BOOL {
    return Advapi32.Load('ChangeServiceConfig2W')(hService, dwInfoLevel, lpInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-changeserviceconfiga
  public static ChangeServiceConfigA(hService: SC_HANDLE, dwServiceType: DWORD, dwStartType: DWORD, dwErrorControl: DWORD, lpBinaryPathName: LPCSTR, lpLoadOrderGroup: LPCSTR, lpdwTagId: LPDWORD, lpDependencies: LPCSTR, lpServiceStartName: LPCSTR, lpPassword: LPCSTR, lpDisplayName: LPCSTR): BOOL {
    return Advapi32.Load('ChangeServiceConfigA')(hService, dwServiceType, dwStartType, dwErrorControl, lpBinaryPathName, lpLoadOrderGroup, lpdwTagId, lpDependencies, lpServiceStartName, lpPassword, lpDisplayName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-changeserviceconfigw
  public static ChangeServiceConfigW(hService: SC_HANDLE, dwServiceType: DWORD, dwStartType: DWORD, dwErrorControl: DWORD, lpBinaryPathName: LPCWSTR, lpLoadOrderGroup: LPCWSTR, lpdwTagId: LPDWORD, lpDependencies: LPCWSTR, lpServiceStartName: LPCWSTR, lpPassword: LPCWSTR, lpDisplayName: LPCWSTR): BOOL {
    return Advapi32.Load('ChangeServiceConfigW')(hService, dwServiceType, dwStartType, dwErrorControl, lpBinaryPathName, lpLoadOrderGroup, lpdwTagId, lpDependencies, lpServiceStartName, lpPassword, lpDisplayName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-checkforhiberboot
  public static CheckForHiberboot(pHiberboot: PBOOL, bClearFlag: BOOL): DWORD {
    return Advapi32.Load('CheckForHiberboot')(pHiberboot, bClearFlag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-checktokenmembership
  public static CheckTokenMembership(TokenHandle: HANDLE, SidToCheck: PSID, IsMember: PBOOL): BOOL {
    return Advapi32.Load('CheckTokenMembership')(TokenHandle, SidToCheck, IsMember);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-cleareventloga
  public static ClearEventLogA(hEventLog: HANDLE, lpBackupFileName: LPCSTR): BOOL {
    return Advapi32.Load('ClearEventLogA')(hEventLog, lpBackupFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-cleareventlogw
  public static ClearEventLogW(hEventLog: HANDLE, lpBackupFileName: LPCWSTR): BOOL {
    return Advapi32.Load('ClearEventLogW')(hEventLog, lpBackupFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-closecodeauthzlevel
  public static CloseCodeAuthzLevel(hLevelHandle: HANDLE): BOOL {
    return Advapi32.Load('CloseCodeAuthzLevel')(hLevelHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-closeencryptedfileraw
  public static CloseEncryptedFileRaw(pvContext: PVOID): VOID {
    return Advapi32.Load('CloseEncryptedFileRaw')(pvContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-closeeventlog
  public static CloseEventLog(hEventLog: HANDLE): BOOL {
    return Advapi32.Load('CloseEventLog')(hEventLog);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-closeservicehandle
  public static CloseServiceHandle(hSCObject: SC_HANDLE): BOOL {
    return Advapi32.Load('CloseServiceHandle')(hSCObject);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wct/nf-wct-closethreadwaitchainsession
  public static CloseThreadWaitChainSession(WctHandle: HWCT): VOID {
    return Advapi32.Load('CloseThreadWaitChainSession')(WctHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-closetrace
  public static CloseTrace(TraceHandle: TRACEHANDLE): ULONG {
    return Advapi32.Load('CloseTrace')(TraceHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmgmt/nf-appmgmt-commandlinefrommsidescriptor
  public static CommandLineFromMsiDescriptor(Descriptor: LPCWSTR, CommandLine: LPWSTR, CommandLineLength: LPDWORD): DWORD {
    return Advapi32.Load('CommandLineFromMsiDescriptor')(Descriptor, CommandLine, CommandLineLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-computeaccesstokenfromcodeauthzlevel
  public static ComputeAccessTokenFromCodeAuthzLevel(hLevel: HANDLE, InAccessToken: HANDLE, OutAccessToken: PHANDLE, dwFlags: DWORD, pvReserved: PVOID): BOOL {
    return Advapi32.Load('ComputeAccessTokenFromCodeAuthzLevel')(hLevel, InAccessToken, OutAccessToken, dwFlags, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-controlservice
  public static ControlService(hService: SC_HANDLE, dwControl: DWORD, lpServiceStatus: PVOID): BOOL {
    return Advapi32.Load('ControlService')(hService, dwControl, lpServiceStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-controlserviceexa
  public static ControlServiceExA(hService: SC_HANDLE, dwControl: DWORD, dwInfoLevel: DWORD, pControlParams: PVOID): DWORD {
    return Advapi32.Load('ControlServiceExA')(hService, dwControl, dwInfoLevel, pControlParams);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-controlserviceexw
  public static ControlServiceExW(hService: SC_HANDLE, dwControl: DWORD, dwInfoLevel: DWORD, pControlParams: PVOID): DWORD {
    return Advapi32.Load('ControlServiceExW')(hService, dwControl, dwInfoLevel, pControlParams);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-controltracea
  public static ControlTraceA(TraceHandle: TRACEHANDLE, InstanceName: LPCSTR, Properties: PVOID, ControlCode: ULONG): ULONG {
    return Advapi32.Load('ControlTraceA')(TraceHandle, InstanceName, Properties, ControlCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-controltracew
  public static ControlTraceW(TraceHandle: TRACEHANDLE, InstanceName: LPCWSTR, Properties: PVOID, ControlCode: ULONG): ULONG {
    return Advapi32.Load('ControlTraceW')(TraceHandle, InstanceName, Properties, ControlCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-convertaccesstosecuritydescriptora
  public static ConvertAccessToSecurityDescriptorA(pAccessList: PVOID, pAuditList: PVOID, lpOwner: LPCSTR, lpGroup: LPCSTR, ppSecurityDescriptor: PVOID): DWORD {
    return Advapi32.Load('ConvertAccessToSecurityDescriptorA')(pAccessList, pAuditList, lpOwner, lpGroup, ppSecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-convertaccesstosecuritydescriptorw
  public static ConvertAccessToSecurityDescriptorW(pAccessList: PVOID, pAuditList: PVOID, lpOwner: LPCWSTR, lpGroup: LPCWSTR, ppSecurityDescriptor: PVOID): DWORD {
    return Advapi32.Load('ConvertAccessToSecurityDescriptorW')(pAccessList, pAuditList, lpOwner, lpGroup, ppSecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertsdtostringsddomainw
  public static ConvertSDToStringSDDomainW(pSid: PSID, SecurityDescriptor: PSECURITY_DESCRIPTOR, RequestedStringSDRevision: DWORD, SecurityInformation: SECURITY_INFORMATION, StringSecurityDescriptor: PVOID, StringSecurityDescriptorLen: PULONG): BOOL {
    return Advapi32.Load('ConvertSDToStringSDDomainW')(pSid, SecurityDescriptor, RequestedStringSDRevision, SecurityInformation, StringSecurityDescriptor, StringSecurityDescriptorLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertsdtostringsdrootdomaina
  public static ConvertSDToStringSDRootDomainA(pSid: PSID, SecurityDescriptor: PSECURITY_DESCRIPTOR, RequestedStringSDRevision: DWORD, SecurityInformation: SECURITY_INFORMATION, StringSecurityDescriptor: PVOID, StringSecurityDescriptorLen: PULONG): BOOL {
    return Advapi32.Load('ConvertSDToStringSDRootDomainA')(pSid, SecurityDescriptor, RequestedStringSDRevision, SecurityInformation, StringSecurityDescriptor, StringSecurityDescriptorLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertsdtostringsdrootdomainw
  public static ConvertSDToStringSDRootDomainW(pSid: PSID, SecurityDescriptor: PSECURITY_DESCRIPTOR, RequestedStringSDRevision: DWORD, SecurityInformation: SECURITY_INFORMATION, StringSecurityDescriptor: PVOID, StringSecurityDescriptorLen: PULONG): BOOL {
    return Advapi32.Load('ConvertSDToStringSDRootDomainW')(pSid, SecurityDescriptor, RequestedStringSDRevision, SecurityInformation, StringSecurityDescriptor, StringSecurityDescriptorLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-convertsecuritydescriptortoaccessa
  public static ConvertSecurityDescriptorToAccessA(pSD: PSECURITY_DESCRIPTOR, ppAccessList: PVOID, ppAuditList: PVOID, lpOwner: PVOID, lpGroup: PVOID, pvReserved: PVOID): DWORD {
    return Advapi32.Load('ConvertSecurityDescriptorToAccessA')(pSD, ppAccessList, ppAuditList, lpOwner, lpGroup, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-convertsecuritydescriptortoaccessnameda
  public static ConvertSecurityDescriptorToAccessNamedA(pObjectName: LPCSTR, pSD: PSECURITY_DESCRIPTOR, ppAccessList: PVOID, ppAuditList: PVOID, lpOwner: PVOID, lpGroup: PVOID, pvReserved: PVOID): DWORD {
    return Advapi32.Load('ConvertSecurityDescriptorToAccessNamedA')(pObjectName, pSD, ppAccessList, ppAuditList, lpOwner, lpGroup, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-convertsecuritydescriptortoaccessnamedw
  public static ConvertSecurityDescriptorToAccessNamedW(pObjectName: LPCWSTR, pSD: PSECURITY_DESCRIPTOR, ppAccessList: PVOID, ppAuditList: PVOID, lpOwner: PVOID, lpGroup: PVOID, pvReserved: PVOID): DWORD {
    return Advapi32.Load('ConvertSecurityDescriptorToAccessNamedW')(pObjectName, pSD, ppAccessList, ppAuditList, lpOwner, lpGroup, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-convertsecuritydescriptortoaccessw
  public static ConvertSecurityDescriptorToAccessW(pSD: PSECURITY_DESCRIPTOR, ppAccessList: PVOID, ppAuditList: PVOID, lpOwner: PVOID, lpGroup: PVOID, pvReserved: PVOID): DWORD {
    return Advapi32.Load('ConvertSecurityDescriptorToAccessW')(pSD, ppAccessList, ppAuditList, lpOwner, lpGroup, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertsecuritydescriptortostringsecuritydescriptora
  public static ConvertSecurityDescriptorToStringSecurityDescriptorA(SecurityDescriptor: PSECURITY_DESCRIPTOR, RequestedStringSDRevision: DWORD, SecurityInformation: SECURITY_INFORMATION, StringSecurityDescriptor: PVOID, StringSecurityDescriptorLen: PULONG): BOOL {
    return Advapi32.Load('ConvertSecurityDescriptorToStringSecurityDescriptorA')(SecurityDescriptor, RequestedStringSDRevision, SecurityInformation, StringSecurityDescriptor, StringSecurityDescriptorLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertsecuritydescriptortostringsecuritydescriptorw
  public static ConvertSecurityDescriptorToStringSecurityDescriptorW(SecurityDescriptor: PSECURITY_DESCRIPTOR, RequestedStringSDRevision: DWORD, SecurityInformation: SECURITY_INFORMATION, StringSecurityDescriptor: PVOID, StringSecurityDescriptorLen: PULONG): BOOL {
    return Advapi32.Load('ConvertSecurityDescriptorToStringSecurityDescriptorW')(SecurityDescriptor, RequestedStringSDRevision, SecurityInformation, StringSecurityDescriptor, StringSecurityDescriptorLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertsidtostringsida
  public static ConvertSidToStringSidA(Sid: PSID, StringSid: PVOID): BOOL {
    return Advapi32.Load('ConvertSidToStringSidA')(Sid, StringSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertsidtostringsidw
  public static ConvertSidToStringSidW(Sid: PSID, StringSid: PVOID): BOOL {
    return Advapi32.Load('ConvertSidToStringSidW')(Sid, StringSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertstringsdtosddomaina
  public static ConvertStringSDToSDDomainA(pSid: PSID, StringSecurityDescriptor: LPCSTR, StringSDRevision: DWORD, SecurityDescriptor: PVOID, SecurityDescriptorSize: PULONG): BOOL {
    return Advapi32.Load('ConvertStringSDToSDDomainA')(pSid, StringSecurityDescriptor, StringSDRevision, SecurityDescriptor, SecurityDescriptorSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertstringsdtosddomainw
  public static ConvertStringSDToSDDomainW(pSid: PSID, StringSecurityDescriptor: LPCWSTR, StringSDRevision: DWORD, SecurityDescriptor: PVOID, SecurityDescriptorSize: PULONG): BOOL {
    return Advapi32.Load('ConvertStringSDToSDDomainW')(pSid, StringSecurityDescriptor, StringSDRevision, SecurityDescriptor, SecurityDescriptorSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertstringsdtosdrootdomaina
  public static ConvertStringSDToSDRootDomainA(pSid: PSID, StringSecurityDescriptor: LPCSTR, StringSDRevision: DWORD, SecurityDescriptor: PVOID, SecurityDescriptorSize: PULONG): BOOL {
    return Advapi32.Load('ConvertStringSDToSDRootDomainA')(pSid, StringSecurityDescriptor, StringSDRevision, SecurityDescriptor, SecurityDescriptorSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertstringsdtosdrootdomainw
  public static ConvertStringSDToSDRootDomainW(pSid: PSID, StringSecurityDescriptor: LPCWSTR, StringSDRevision: DWORD, SecurityDescriptor: PVOID, SecurityDescriptorSize: PULONG): BOOL {
    return Advapi32.Load('ConvertStringSDToSDRootDomainW')(pSid, StringSecurityDescriptor, StringSDRevision, SecurityDescriptor, SecurityDescriptorSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertstringsecuritydescriptortosecuritydescriptora
  public static ConvertStringSecurityDescriptorToSecurityDescriptorA(StringSecurityDescriptor: LPCSTR, StringSDRevision: DWORD, SecurityDescriptor: PVOID, SecurityDescriptorSize: PULONG): BOOL {
    return Advapi32.Load('ConvertStringSecurityDescriptorToSecurityDescriptorA')(StringSecurityDescriptor, StringSDRevision, SecurityDescriptor, SecurityDescriptorSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertstringsecuritydescriptortosecuritydescriptorw
  public static ConvertStringSecurityDescriptorToSecurityDescriptorW(StringSecurityDescriptor: LPCWSTR, StringSDRevision: DWORD, SecurityDescriptor: PVOID, SecurityDescriptorSize: PULONG): BOOL {
    return Advapi32.Load('ConvertStringSecurityDescriptorToSecurityDescriptorW')(StringSecurityDescriptor, StringSDRevision, SecurityDescriptor, SecurityDescriptorSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertstringsidtosida
  public static ConvertStringSidToSidA(StringSid: LPCSTR, Sid: PVOID): BOOL {
    return Advapi32.Load('ConvertStringSidToSidA')(StringSid, Sid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertstringsidtosidw
  public static ConvertStringSidToSidW(StringSid: LPCWSTR, Sid: PVOID): BOOL {
    return Advapi32.Load('ConvertStringSidToSidW')(StringSid, Sid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-converttoautoinheritprivateobjectsecurity
  public static ConvertToAutoInheritPrivateObjectSecurity(ParentDescriptor: PSECURITY_DESCRIPTOR, CurrentSecurityDescriptor: PSECURITY_DESCRIPTOR, NewSecurityDescriptor: PVOID, ObjectType: PVOID, IsDirectoryObject: BOOL, GenericMapping: PGENERIC_MAPPING): BOOL {
    return Advapi32.Load('ConvertToAutoInheritPrivateObjectSecurity')(ParentDescriptor, CurrentSecurityDescriptor, NewSecurityDescriptor, ObjectType, IsDirectoryObject, GenericMapping);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-copysid
  public static CopySid(nDestinationSidLength: DWORD, pDestinationSid: PSID, pSourceSid: PSID): BOOL {
    return Advapi32.Load('CopySid')(nDestinationSidLength, pDestinationSid, pSourceSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-createcodeauthzlevel
  public static CreateCodeAuthzLevel(dwLevelId: DWORD, InformationClass: DWORD, dwBufferSize: DWORD, pCodeAuthzLevelData: PVOID, pCodeAuthzLevelHandle: PVOID): BOOL {
    return Advapi32.Load('CreateCodeAuthzLevel')(dwLevelId, InformationClass, dwBufferSize, pCodeAuthzLevelData, pCodeAuthzLevelHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-createprivateobjectsecurity
  public static CreatePrivateObjectSecurity(ParentDescriptor: PSECURITY_DESCRIPTOR, CreatorDescriptor: PSECURITY_DESCRIPTOR, NewDescriptor: PVOID, IsDirectoryObject: BOOL, Token: HANDLE, GenericMapping: PGENERIC_MAPPING): BOOL {
    return Advapi32.Load('CreatePrivateObjectSecurity')(ParentDescriptor, CreatorDescriptor, NewDescriptor, IsDirectoryObject, Token, GenericMapping);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-createprivateobjectsecurityex
  public static CreatePrivateObjectSecurityEx(ParentDescriptor: PSECURITY_DESCRIPTOR, CreatorDescriptor: PSECURITY_DESCRIPTOR, NewDescriptor: PVOID, ObjectType: PVOID, IsContainerObject: BOOL, AutoInheritFlags: ULONG, Token: HANDLE, GenericMapping: PGENERIC_MAPPING): BOOL {
    return Advapi32.Load('CreatePrivateObjectSecurityEx')(ParentDescriptor, CreatorDescriptor, NewDescriptor, ObjectType, IsContainerObject, AutoInheritFlags, Token, GenericMapping);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-createprivateobjectsecuritywithmultipleinheritance
  public static CreatePrivateObjectSecurityWithMultipleInheritance(ParentDescriptor: PSECURITY_DESCRIPTOR, CreatorDescriptor: PSECURITY_DESCRIPTOR, NewDescriptor: PVOID, ObjectTypes: PVOID, GuidCount: ULONG, IsContainerObject: BOOL, AutoInheritFlags: ULONG, Token: HANDLE, GenericMapping: PGENERIC_MAPPING): BOOL {
    return Advapi32.Load('CreatePrivateObjectSecurityWithMultipleInheritance')(ParentDescriptor, CreatorDescriptor, NewDescriptor, ObjectTypes, GuidCount, IsContainerObject, AutoInheritFlags, Token, GenericMapping);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessasusera
  public static CreateProcessAsUserA(hToken: HANDLE, lpApplicationName: LPCSTR, lpCommandLine: LPSTR, lpProcessAttributes: PVOID, lpThreadAttributes: PVOID, bInheritHandles: BOOL, dwCreationFlags: DWORD, lpEnvironment: LPVOID, lpCurrentDirectory: LPCSTR, lpStartupInfo: PVOID, lpProcessInformation: PVOID): BOOL {
    return Advapi32.Load('CreateProcessAsUserA')(hToken, lpApplicationName, lpCommandLine, lpProcessAttributes, lpThreadAttributes, bInheritHandles, dwCreationFlags, lpEnvironment, lpCurrentDirectory, lpStartupInfo, lpProcessInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessasuserw
  public static CreateProcessAsUserW(hToken: HANDLE, lpApplicationName: LPCWSTR, lpCommandLine: LPWSTR, lpProcessAttributes: PVOID, lpThreadAttributes: PVOID, bInheritHandles: BOOL, dwCreationFlags: DWORD, lpEnvironment: LPVOID, lpCurrentDirectory: LPCWSTR, lpStartupInfo: PVOID, lpProcessInformation: PVOID): BOOL {
    return Advapi32.Load('CreateProcessAsUserW')(hToken, lpApplicationName, lpCommandLine, lpProcessAttributes, lpThreadAttributes, bInheritHandles, dwCreationFlags, lpEnvironment, lpCurrentDirectory, lpStartupInfo, lpProcessInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createprocesswithlogonw
  public static CreateProcessWithLogonW(lpUsername: LPCWSTR, lpDomain: LPCWSTR, lpPassword: LPCWSTR, dwLogonFlags: DWORD, lpApplicationName: LPCWSTR, lpCommandLine: LPWSTR, dwCreationFlags: DWORD, lpEnvironment: LPVOID, lpCurrentDirectory: LPCWSTR, lpStartupInfo: PVOID, lpProcessInformation: PVOID): BOOL {
    return Advapi32.Load('CreateProcessWithLogonW')(lpUsername, lpDomain, lpPassword, dwLogonFlags, lpApplicationName, lpCommandLine, dwCreationFlags, lpEnvironment, lpCurrentDirectory, lpStartupInfo, lpProcessInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createprocesswithtokenw
  public static CreateProcessWithTokenW(hToken: HANDLE, dwLogonFlags: DWORD, lpApplicationName: LPCWSTR, lpCommandLine: LPWSTR, dwCreationFlags: DWORD, lpEnvironment: LPVOID, lpCurrentDirectory: LPCWSTR, lpStartupInfo: PVOID, lpProcessInformation: PVOID): BOOL {
    return Advapi32.Load('CreateProcessWithTokenW')(hToken, dwLogonFlags, lpApplicationName, lpCommandLine, dwCreationFlags, lpEnvironment, lpCurrentDirectory, lpStartupInfo, lpProcessInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-createrestrictedtoken
  public static CreateRestrictedToken(ExistingTokenHandle: HANDLE, Flags: DWORD, DisableSidCount: DWORD, SidsToDisable: PVOID, DeletePrivilegeCount: DWORD, PrivilegesToDelete: PVOID, RestrictedSidCount: DWORD, SidsToRestrict: PVOID, NewTokenHandle: PHANDLE): BOOL {
    return Advapi32.Load('CreateRestrictedToken')(ExistingTokenHandle, Flags, DisableSidCount, SidsToDisable, DeletePrivilegeCount, PrivilegesToDelete, RestrictedSidCount, SidsToRestrict, NewTokenHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-createservicea
  public static CreateServiceA(hSCManager: SC_HANDLE, lpServiceName: LPCSTR, lpDisplayName: LPCSTR, dwDesiredAccess: DWORD, dwServiceType: DWORD, dwStartType: DWORD, dwErrorControl: DWORD, lpBinaryPathName: LPCSTR, lpLoadOrderGroup: LPCSTR, lpdwTagId: LPDWORD, lpDependencies: LPCSTR, lpServiceStartName: LPCSTR, lpPassword: LPCSTR): SC_HANDLE {
    return Advapi32.Load('CreateServiceA')(hSCManager, lpServiceName, lpDisplayName, dwDesiredAccess, dwServiceType, dwStartType, dwErrorControl, lpBinaryPathName, lpLoadOrderGroup, lpdwTagId, lpDependencies, lpServiceStartName, lpPassword);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-createserviceex
  public static CreateServiceEx(hSCManager: SC_HANDLE, lpServiceName: LPCWSTR, lpDisplayName: LPCWSTR, dwDesiredAccess: DWORD, dwServiceType: DWORD, dwStartType: DWORD, dwErrorControl: DWORD, lpBinaryPathName: LPCWSTR, lpLoadOrderGroup: LPCWSTR, lpdwTagId: LPDWORD, lpDependencies: LPCWSTR, lpServiceStartName: LPCWSTR, lpPassword: LPCWSTR, pvExtra: PVOID): SC_HANDLE {
    return Advapi32.Load('CreateServiceEx')(hSCManager, lpServiceName, lpDisplayName, dwDesiredAccess, dwServiceType, dwStartType, dwErrorControl, lpBinaryPathName, lpLoadOrderGroup, lpdwTagId, lpDependencies, lpServiceStartName, lpPassword, pvExtra);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-createservicew
  public static CreateServiceW(hSCManager: SC_HANDLE, lpServiceName: LPCWSTR, lpDisplayName: LPCWSTR, dwDesiredAccess: DWORD, dwServiceType: DWORD, dwStartType: DWORD, dwErrorControl: DWORD, lpBinaryPathName: LPCWSTR, lpLoadOrderGroup: LPCWSTR, lpdwTagId: LPDWORD, lpDependencies: LPCWSTR, lpServiceStartName: LPCWSTR, lpPassword: LPCWSTR): SC_HANDLE {
    return Advapi32.Load('CreateServiceW')(hSCManager, lpServiceName, lpDisplayName, dwDesiredAccess, dwServiceType, dwStartType, dwErrorControl, lpBinaryPathName, lpLoadOrderGroup, lpdwTagId, lpDependencies, lpServiceStartName, lpPassword);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-createwellknownsid
  public static CreateWellKnownSid(WellKnownSidType: DWORD, DomainSid: PSID, pSid: PSID, cbSid: LPDWORD): BOOL {
    return Advapi32.Load('CreateWellKnownSid')(WellKnownSidType, DomainSid, pSid, cbSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credbackupcredentials
  public static CredBackupCredentials(Token: HANDLE, pvReserved: PVOID): BOOL {
    return Advapi32.Load('CredBackupCredentials')(Token, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creddeletea
  public static CredDeleteA(TargetName: LPCSTR, Type: DWORD, Flags: DWORD): BOOL {
    return Advapi32.Load('CredDeleteA')(TargetName, Type, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-creddeletew
  public static CredDeleteW(TargetName: LPCWSTR, Type: DWORD, Flags: DWORD): BOOL {
    return Advapi32.Load('CredDeleteW')(TargetName, Type, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credencryptandmarshalbinaryblob
  public static CredEncryptAndMarshalBinaryBlob(CredType: DWORD, pbData: PBYTE, cbData: DWORD, ppszMarshaledBlob: PVOID): BOOL {
    return Advapi32.Load('CredEncryptAndMarshalBinaryBlob')(CredType, pbData, cbData, ppszMarshaledBlob);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credenumeratea
  public static CredEnumerateA(Filter: LPCSTR, Flags: DWORD, Count: LPDWORD, Credential: PVOID): BOOL {
    return Advapi32.Load('CredEnumerateA')(Filter, Flags, Count, Credential);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credenumeratew
  public static CredEnumerateW(Filter: LPCWSTR, Flags: DWORD, Count: LPDWORD, Credential: PVOID): BOOL {
    return Advapi32.Load('CredEnumerateW')(Filter, Flags, Count, Credential);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credfindbestcredentiala
  public static CredFindBestCredentialA(TargetName: LPCSTR, Type: DWORD, Flags: DWORD, Credential: PVOID): BOOL {
    return Advapi32.Load('CredFindBestCredentialA')(TargetName, Type, Flags, Credential);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credfindbestcredentialw
  public static CredFindBestCredentialW(TargetName: LPCWSTR, Type: DWORD, Flags: DWORD, Credential: PVOID): BOOL {
    return Advapi32.Load('CredFindBestCredentialW')(TargetName, Type, Flags, Credential);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credfree
  public static CredFree(Buffer: PVOID): VOID {
    return Advapi32.Load('CredFree')(Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credgetsessiontypes
  public static CredGetSessionTypes(MaximumPersistCount: DWORD, MaximumPersist: LPDWORD): BOOL {
    return Advapi32.Load('CredGetSessionTypes')(MaximumPersistCount, MaximumPersist);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credgettargetinfoa
  public static CredGetTargetInfoA(TargetName: LPCSTR, Flags: DWORD, TargetInfo: PVOID): BOOL {
    return Advapi32.Load('CredGetTargetInfoA')(TargetName, Flags, TargetInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credgettargetinfow
  public static CredGetTargetInfoW(TargetName: LPCWSTR, Flags: DWORD, TargetInfo: PVOID): BOOL {
    return Advapi32.Load('CredGetTargetInfoW')(TargetName, Flags, TargetInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credismarshaledcredentiala
  public static CredIsMarshaledCredentialA(MarshaledCredential: LPCSTR): BOOL {
    return Advapi32.Load('CredIsMarshaledCredentialA')(MarshaledCredential);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credismarshaledcredentialw
  public static CredIsMarshaledCredentialW(MarshaledCredential: LPCWSTR): BOOL {
    return Advapi32.Load('CredIsMarshaledCredentialW')(MarshaledCredential);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credisprotecteda
  public static CredIsProtectedA(pszProtectedCredentials: LPSTR, pProtectionType: PVOID): BOOL {
    return Advapi32.Load('CredIsProtectedA')(pszProtectedCredentials, pProtectionType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credisprotectedw
  public static CredIsProtectedW(pszProtectedCredentials: LPWSTR, pProtectionType: PVOID): BOOL {
    return Advapi32.Load('CredIsProtectedW')(pszProtectedCredentials, pProtectionType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credmarshalcredentiala
  public static CredMarshalCredentialA(CredType: DWORD, Credential: PVOID, MarshaledCredential: PVOID): BOOL {
    return Advapi32.Load('CredMarshalCredentialA')(CredType, Credential, MarshaledCredential);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credmarshalcredentialw
  public static CredMarshalCredentialW(CredType: DWORD, Credential: PVOID, MarshaledCredential: PVOID): BOOL {
    return Advapi32.Load('CredMarshalCredentialW')(CredType, Credential, MarshaledCredential);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credprofileloaded
  public static CredProfileLoaded(): BOOL {
    return Advapi32.Load('CredProfileLoaded')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credprofileloadedex
  public static CredProfileLoadedEx(pvReserved: PVOID): BOOL {
    return Advapi32.Load('CredProfileLoadedEx')(pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credprofileunloaded
  public static CredProfileUnloaded(): BOOL {
    return Advapi32.Load('CredProfileUnloaded')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credprotecta
  public static CredProtectA(fAsSelf: BOOL, pszCredentials: LPSTR, cchCredentials: DWORD, pszProtectedCredentials: LPSTR, pcchMaxChars: LPDWORD, ProtectionType: PVOID): BOOL {
    return Advapi32.Load('CredProtectA')(fAsSelf, pszCredentials, cchCredentials, pszProtectedCredentials, pcchMaxChars, ProtectionType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credprotectw
  public static CredProtectW(fAsSelf: BOOL, pszCredentials: LPWSTR, cchCredentials: DWORD, pszProtectedCredentials: LPWSTR, pcchMaxChars: LPDWORD, ProtectionType: PVOID): BOOL {
    return Advapi32.Load('CredProtectW')(fAsSelf, pszCredentials, cchCredentials, pszProtectedCredentials, pcchMaxChars, ProtectionType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credreada
  public static CredReadA(TargetName: LPCSTR, Type: DWORD, Flags: DWORD, Credential: PVOID): BOOL {
    return Advapi32.Load('CredReadA')(TargetName, Type, Flags, Credential);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credreadbytokenhandle
  public static CredReadByTokenHandle(TokenHandle: HANDLE, TargetName: PVOID, Type: DWORD, Flags: DWORD, Credential: PVOID): BOOL {
    return Advapi32.Load('CredReadByTokenHandle')(TokenHandle, TargetName, Type, Flags, Credential);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credreaddomaincredentialsa
  public static CredReadDomainCredentialsA(TargetInfo: PCREDENTIAL_TARGET_INFORMATIONA, Flags: DWORD, Count: LPDWORD, Credential: PVOID): BOOL {
    return Advapi32.Load('CredReadDomainCredentialsA')(TargetInfo, Flags, Count, Credential);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credreaddomaincredentialsw
  public static CredReadDomainCredentialsW(TargetInfo: PCREDENTIAL_TARGET_INFORMATIONW, Flags: DWORD, Count: LPDWORD, Credential: PVOID): BOOL {
    return Advapi32.Load('CredReadDomainCredentialsW')(TargetInfo, Flags, Count, Credential);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credreadw
  public static CredReadW(TargetName: LPCWSTR, Type: DWORD, Flags: DWORD, Credential: PVOID): BOOL {
    return Advapi32.Load('CredReadW')(TargetName, Type, Flags, Credential);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credrenamea
  public static CredRenameA(OldTargetName: LPCSTR, NewTargetName: LPCSTR, Type: DWORD, Flags: DWORD): BOOL {
    return Advapi32.Load('CredRenameA')(OldTargetName, NewTargetName, Type, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credrenamew
  public static CredRenameW(OldTargetName: LPCWSTR, NewTargetName: LPCWSTR, Type: DWORD, Flags: DWORD): BOOL {
    return Advapi32.Load('CredRenameW')(OldTargetName, NewTargetName, Type, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credrestorecredentials
  public static CredRestoreCredentials(Token: HANDLE, pvReserved: PVOID): BOOL {
    return Advapi32.Load('CredRestoreCredentials')(Token, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credunmarshalcredentiala
  public static CredUnmarshalCredentialA(MarshaledCredential: LPCSTR, CredType: PVOID, Credential: PVOID): BOOL {
    return Advapi32.Load('CredUnmarshalCredentialA')(MarshaledCredential, CredType, Credential);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credunmarshalcredentialw
  public static CredUnmarshalCredentialW(MarshaledCredential: LPCWSTR, CredType: PVOID, Credential: PVOID): BOOL {
    return Advapi32.Load('CredUnmarshalCredentialW')(MarshaledCredential, CredType, Credential);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credunprotecta
  public static CredUnprotectA(fAsSelf: BOOL, pszProtectedCredentials: LPSTR, cchProtectedCredentials: DWORD, pszCredentials: LPSTR, pcchMaxChars: LPDWORD): BOOL {
    return Advapi32.Load('CredUnprotectA')(fAsSelf, pszProtectedCredentials, cchProtectedCredentials, pszCredentials, pcchMaxChars);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credunprotectw
  public static CredUnprotectW(fAsSelf: BOOL, pszProtectedCredentials: LPWSTR, cchProtectedCredentials: DWORD, pszCredentials: LPWSTR, pcchMaxChars: LPDWORD): BOOL {
    return Advapi32.Load('CredUnprotectW')(fAsSelf, pszProtectedCredentials, cchProtectedCredentials, pszCredentials, pcchMaxChars);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credwritea
  public static CredWriteA(Credential: PCREDENTIALA, Flags: DWORD): BOOL {
    return Advapi32.Load('CredWriteA')(Credential, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credwritedomaincredentialsa
  public static CredWriteDomainCredentialsA(TargetInfo: PCREDENTIAL_TARGET_INFORMATIONA, Credential: PCREDENTIALA, Flags: DWORD): BOOL {
    return Advapi32.Load('CredWriteDomainCredentialsA')(TargetInfo, Credential, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credwritedomaincredentialsw
  public static CredWriteDomainCredentialsW(TargetInfo: PCREDENTIAL_TARGET_INFORMATIONW, Credential: PCREDENTIALW, Flags: DWORD): BOOL {
    return Advapi32.Load('CredWriteDomainCredentialsW')(TargetInfo, Credential, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credwritew
  public static CredWriteW(Credential: PCREDENTIALW, Flags: DWORD): BOOL {
    return Advapi32.Load('CredWriteW')(Credential, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credpconvertcredential
  public static CredpConvertCredential(pCredential: PVOID, dwVersion: DWORD, ppResult: PVOID): BOOL {
    return Advapi32.Load('CredpConvertCredential')(pCredential, dwVersion, ppResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credpconvertonecredentialsize
  public static CredpConvertOneCredentialSize(pCredential: PVOID, pSize: PVOID): BOOL {
    return Advapi32.Load('CredpConvertOneCredentialSize')(pCredential, pSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credpconverttargetinfo
  public static CredpConvertTargetInfo(pTargetInfo: PVOID, dwVersion: DWORD, ppResult: PVOID): BOOL {
    return Advapi32.Load('CredpConvertTargetInfo')(pTargetInfo, dwVersion, ppResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credpdecodecredential
  public static CredpDecodeCredential(pCredential: PVOID): BOOL {
    return Advapi32.Load('CredpDecodeCredential')(pCredential);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credpencodecredential
  public static CredpEncodeCredential(pCredential: PVOID): BOOL {
    return Advapi32.Load('CredpEncodeCredential')(pCredential);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credpencodesecret
  public static CredpEncodeSecret(pInput: PVOID, pOutput: PVOID, pOutputSize: PVOID): BOOL {
    return Advapi32.Load('CredpEncodeSecret')(pInput, pOutput, pOutputSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptacquirecontexta
  public static CryptAcquireContextA(phProv: PVOID, szContainer: LPCSTR, szProvider: LPCSTR, dwProvType: DWORD, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptAcquireContextA')(phProv, szContainer, szProvider, dwProvType, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptacquirecontextw
  public static CryptAcquireContextW(phProv: PVOID, szContainer: LPCWSTR, szProvider: LPCWSTR, dwProvType: DWORD, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptAcquireContextW')(phProv, szContainer, szProvider, dwProvType, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptcontextaddref
  public static CryptContextAddRef(hProv: HCRYPTPROV, pdwReserved: LPDWORD, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptContextAddRef')(hProv, pdwReserved, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptcreatehash
  public static CryptCreateHash(hProv: HCRYPTPROV, Algid: ALG_ID, hKey: HCRYPTKEY, dwFlags: DWORD, phHash: PVOID): BOOL {
    return Advapi32.Load('CryptCreateHash')(hProv, Algid, hKey, dwFlags, phHash);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptdecrypt
  public static CryptDecrypt(hKey: HCRYPTKEY, hHash: HCRYPTHASH, Final: BOOL, dwFlags: DWORD, pbData: PBYTE, pdwDataLen: LPDWORD): BOOL {
    return Advapi32.Load('CryptDecrypt')(hKey, hHash, Final, dwFlags, pbData, pdwDataLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptderivekey
  public static CryptDeriveKey(hProv: HCRYPTPROV, Algid: ALG_ID, hBaseData: HCRYPTHASH, dwFlags: DWORD, phKey: PVOID): BOOL {
    return Advapi32.Load('CryptDeriveKey')(hProv, Algid, hBaseData, dwFlags, phKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptdestroyhash
  public static CryptDestroyHash(hHash: HCRYPTHASH): BOOL {
    return Advapi32.Load('CryptDestroyHash')(hHash);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptdestroykey
  public static CryptDestroyKey(hKey: HCRYPTKEY): BOOL {
    return Advapi32.Load('CryptDestroyKey')(hKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptduplicatehash
  public static CryptDuplicateHash(hHash: HCRYPTHASH, pdwReserved: LPDWORD, dwFlags: DWORD, phHash: PVOID): BOOL {
    return Advapi32.Load('CryptDuplicateHash')(hHash, pdwReserved, dwFlags, phHash);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptduplicatekey
  public static CryptDuplicateKey(hKey: HCRYPTKEY, pdwReserved: LPDWORD, dwFlags: DWORD, phKey: PVOID): BOOL {
    return Advapi32.Load('CryptDuplicateKey')(hKey, pdwReserved, dwFlags, phKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptencrypt
  public static CryptEncrypt(hKey: HCRYPTKEY, hHash: HCRYPTHASH, Final: BOOL, dwFlags: DWORD, pbData: PBYTE, pdwDataLen: LPDWORD, dwBufLen: DWORD): BOOL {
    return Advapi32.Load('CryptEncrypt')(hKey, hHash, Final, dwFlags, pbData, pdwDataLen, dwBufLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptenumprovidertypesa
  public static CryptEnumProviderTypesA(dwIndex: DWORD, pdwReserved: PDWORD, dwFlags: DWORD, pdwProvType: LPDWORD, szTypeName: LPSTR, pcbTypeName: LPDWORD): BOOL {
    return Advapi32.Load('CryptEnumProviderTypesA')(dwIndex, pdwReserved, dwFlags, pdwProvType, szTypeName, pcbTypeName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptenumprovidertypesw
  public static CryptEnumProviderTypesW(dwIndex: DWORD, pdwReserved: PDWORD, dwFlags: DWORD, pdwProvType: LPDWORD, szTypeName: LPWSTR, pcbTypeName: LPDWORD): BOOL {
    return Advapi32.Load('CryptEnumProviderTypesW')(dwIndex, pdwReserved, dwFlags, pdwProvType, szTypeName, pcbTypeName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptenumprovidersa
  public static CryptEnumProvidersA(dwIndex: DWORD, pdwReserved: PDWORD, dwFlags: DWORD, pdwProvType: LPDWORD, szProvName: LPSTR, pcbProvName: LPDWORD): BOOL {
    return Advapi32.Load('CryptEnumProvidersA')(dwIndex, pdwReserved, dwFlags, pdwProvType, szProvName, pcbProvName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptenumprovidersw
  public static CryptEnumProvidersW(dwIndex: DWORD, pdwReserved: PDWORD, dwFlags: DWORD, pdwProvType: LPDWORD, szProvName: LPWSTR, pcbProvName: LPDWORD): BOOL {
    return Advapi32.Load('CryptEnumProvidersW')(dwIndex, pdwReserved, dwFlags, pdwProvType, szProvName, pcbProvName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptexportkey
  public static CryptExportKey(hKey: HCRYPTKEY, hExpKey: HCRYPTKEY, dwBlobType: DWORD, dwFlags: DWORD, pbData: PBYTE, pdwDataLen: LPDWORD): BOOL {
    return Advapi32.Load('CryptExportKey')(hKey, hExpKey, dwBlobType, dwFlags, pbData, pdwDataLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgenkey
  public static CryptGenKey(hProv: HCRYPTPROV, Algid: ALG_ID, dwFlags: DWORD, phKey: PVOID): BOOL {
    return Advapi32.Load('CryptGenKey')(hProv, Algid, dwFlags, phKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgenrandom
  public static CryptGenRandom(hProv: HCRYPTPROV, dwLen: DWORD, pbBuffer: PBYTE): BOOL {
    return Advapi32.Load('CryptGenRandom')(hProv, dwLen, pbBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgetdefaultprovidera
  public static CryptGetDefaultProviderA(dwProvType: DWORD, pdwReserved: LPDWORD, dwFlags: DWORD, pszProvName: LPSTR, pcbProvName: LPDWORD): BOOL {
    return Advapi32.Load('CryptGetDefaultProviderA')(dwProvType, pdwReserved, dwFlags, pszProvName, pcbProvName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgetdefaultproviderw
  public static CryptGetDefaultProviderW(dwProvType: DWORD, pdwReserved: LPDWORD, dwFlags: DWORD, pszProvName: LPWSTR, pcbProvName: LPDWORD): BOOL {
    return Advapi32.Load('CryptGetDefaultProviderW')(dwProvType, pdwReserved, dwFlags, pszProvName, pcbProvName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgethashparam
  public static CryptGetHashParam(hHash: HCRYPTHASH, dwParam: DWORD, pbData: PBYTE, pdwDataLen: LPDWORD, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptGetHashParam')(hHash, dwParam, pbData, pdwDataLen, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgetkeyparam
  public static CryptGetKeyParam(hKey: HCRYPTKEY, dwParam: DWORD, pbData: PBYTE, pdwDataLen: LPDWORD, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptGetKeyParam')(hKey, dwParam, pbData, pdwDataLen, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgetprovparam
  public static CryptGetProvParam(hProv: HCRYPTPROV, dwParam: DWORD, pbData: PBYTE, pdwDataLen: LPDWORD, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptGetProvParam')(hProv, dwParam, pbData, pdwDataLen, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgetuserkey
  public static CryptGetUserKey(hProv: HCRYPTPROV, dwKeySpec: DWORD, phUserKey: PVOID): BOOL {
    return Advapi32.Load('CryptGetUserKey')(hProv, dwKeySpec, phUserKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-crypthashdata
  public static CryptHashData(hHash: HCRYPTHASH, pbData: PBYTE, dwDataLen: DWORD, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptHashData')(hHash, pbData, dwDataLen, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-crypthashsessionkey
  public static CryptHashSessionKey(hHash: HCRYPTHASH, hKey: HCRYPTKEY, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptHashSessionKey')(hHash, hKey, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptimportkey
  public static CryptImportKey(hProv: HCRYPTPROV, pbData: PBYTE, dwDataLen: DWORD, hPubKey: HCRYPTKEY, dwFlags: DWORD, phKey: PVOID): BOOL {
    return Advapi32.Load('CryptImportKey')(hProv, pbData, dwDataLen, hPubKey, dwFlags, phKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptreleasecontext
  public static CryptReleaseContext(hProv: HCRYPTPROV, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptReleaseContext')(hProv, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptsethashparam
  public static CryptSetHashParam(hHash: HCRYPTHASH, dwParam: DWORD, pbData: PBYTE, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptSetHashParam')(hHash, dwParam, pbData, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptsetkeyparam
  public static CryptSetKeyParam(hKey: HCRYPTKEY, dwParam: DWORD, pbData: PBYTE, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptSetKeyParam')(hKey, dwParam, pbData, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptsetprovparam
  public static CryptSetProvParam(hProv: HCRYPTPROV, dwParam: DWORD, pbData: PBYTE, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptSetProvParam')(hProv, dwParam, pbData, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptsetprovidera
  public static CryptSetProviderA(pszProvName: LPCSTR, dwProvType: DWORD): BOOL {
    return Advapi32.Load('CryptSetProviderA')(pszProvName, dwProvType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptsetproviderexa
  public static CryptSetProviderExA(pszProvName: LPCSTR, dwProvType: DWORD, pdwReserved: LPDWORD, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptSetProviderExA')(pszProvName, dwProvType, pdwReserved, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptsetproviderexw
  public static CryptSetProviderExW(pszProvName: LPCWSTR, dwProvType: DWORD, pdwReserved: LPDWORD, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptSetProviderExW')(pszProvName, dwProvType, pdwReserved, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptsetproviderw
  public static CryptSetProviderW(pszProvName: LPCWSTR, dwProvType: DWORD): BOOL {
    return Advapi32.Load('CryptSetProviderW')(pszProvName, dwProvType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptsignhasha
  public static CryptSignHashA(hHash: HCRYPTHASH, dwKeySpec: DWORD, sDescription: LPCSTR, dwFlags: DWORD, pbSignature: PBYTE, pdwSigLen: LPDWORD): BOOL {
    return Advapi32.Load('CryptSignHashA')(hHash, dwKeySpec, sDescription, dwFlags, pbSignature, pdwSigLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptsignhashw
  public static CryptSignHashW(hHash: HCRYPTHASH, dwKeySpec: DWORD, sDescription: LPCWSTR, dwFlags: DWORD, pbSignature: PBYTE, pdwSigLen: LPDWORD): BOOL {
    return Advapi32.Load('CryptSignHashW')(hHash, dwKeySpec, sDescription, dwFlags, pbSignature, pdwSigLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptverifysignaturea
  public static CryptVerifySignatureA(hHash: HCRYPTHASH, pbSignature: PBYTE, dwSigLen: DWORD, hPubKey: HCRYPTKEY, sDescription: LPCSTR, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptVerifySignatureA')(hHash, pbSignature, dwSigLen, hPubKey, sDescription, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptverifysignaturew
  public static CryptVerifySignatureW(hHash: HCRYPTHASH, pbSignature: PBYTE, dwSigLen: DWORD, hPubKey: HCRYPTKEY, sDescription: LPCWSTR, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptVerifySignatureW')(hHash, pbSignature, dwSigLen, hPubKey, sDescription, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-decryptfilea
  public static DecryptFileA(lpFileName: LPCSTR, dwReserved: DWORD): BOOL {
    return Advapi32.Load('DecryptFileA')(lpFileName, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-decryptfilew
  public static DecryptFileW(lpFileName: LPCWSTR, dwReserved: DWORD): BOOL {
    return Advapi32.Load('DecryptFileW')(lpFileName, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-deleteace
  public static DeleteAce(pAcl: PACL, dwAceIndex: DWORD): BOOL {
    return Advapi32.Load('DeleteAce')(pAcl, dwAceIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-deleteservice
  public static DeleteService(hService: SC_HANDLE): BOOL {
    return Advapi32.Load('DeleteService')(hService);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-deregistereventsource
  public static DeregisterEventSource(hEventLog: HANDLE): BOOL {
    return Advapi32.Load('DeregisterEventSource')(hEventLog);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-destroyprivateobjectsecurity
  public static DestroyPrivateObjectSecurity(ObjectDescriptor: PVOID): BOOL {
    return Advapi32.Load('DestroyPrivateObjectSecurity')(ObjectDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-duplicateencryptioninfofile
  public static DuplicateEncryptionInfoFile(SrcFileName: LPCWSTR, DstFileName: LPCWSTR, dwCreationDistribution: DWORD, dwAttributes: DWORD, lpSecurityAttributes: PVOID): DWORD {
    return Advapi32.Load('DuplicateEncryptionInfoFile')(SrcFileName, DstFileName, dwCreationDistribution, dwAttributes, lpSecurityAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-duplicatetoken
  public static DuplicateToken(ExistingTokenHandle: HANDLE, ImpersonationLevel: SECURITY_IMPERSONATION_LEVEL, DuplicateTokenHandle: PHANDLE): BOOL {
    return Advapi32.Load('DuplicateToken')(ExistingTokenHandle, ImpersonationLevel, DuplicateTokenHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-duplicatetokenex
  public static DuplicateTokenEx(hExistingToken: HANDLE, dwDesiredAccess: DWORD, lpTokenAttributes: PVOID, ImpersonationLevel: SECURITY_IMPERSONATION_LEVEL, TokenType: TOKEN_TYPE, phNewToken: PHANDLE): BOOL {
    return Advapi32.Load('DuplicateTokenEx')(hExistingToken, dwDesiredAccess, lpTokenAttributes, ImpersonationLevel, TokenType, phNewToken);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-enabletrace
  public static EnableTrace(Enable: ULONG, EnableFlag: ULONG, EnableLevel: ULONG, ControlGuid: PVOID, TraceHandle: TRACEHANDLE): ULONG {
    return Advapi32.Load('EnableTrace')(Enable, EnableFlag, EnableLevel, ControlGuid, TraceHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-enabletraceex
  public static EnableTraceEx(ProviderId: PVOID, SourceId: PVOID, TraceHandle: TRACEHANDLE, IsEnabled: ULONG, Level: BYTE, MatchAnyKeyword: ULONG_PTR, MatchAllKeyword: ULONG_PTR, EnableProperty: ULONG, EnableFilterDesc: PVOID): ULONG {
    return Advapi32.Load('EnableTraceEx')(ProviderId, SourceId, TraceHandle, IsEnabled, Level, MatchAnyKeyword, MatchAllKeyword, EnableProperty, EnableFilterDesc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-enabletraceex2
  public static EnableTraceEx2(TraceHandle: TRACEHANDLE, ProviderId: PVOID, ControlCode: ULONG, Level: BYTE, MatchAnyKeyword: ULONG_PTR, MatchAllKeyword: ULONG_PTR, Timeout: ULONG, EnableParameters: PVOID): ULONG {
    return Advapi32.Load('EnableTraceEx2')(TraceHandle, ProviderId, ControlCode, Level, MatchAnyKeyword, MatchAllKeyword, Timeout, EnableParameters);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-encryptfilea
  public static EncryptFileA(lpFileName: LPCSTR): BOOL {
    return Advapi32.Load('EncryptFileA')(lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-encryptfilew
  public static EncryptFileW(lpFileName: LPCWSTR): BOOL {
    return Advapi32.Load('EncryptFileW')(lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-encryptedfilekeyinfo
  public static EncryptedFileKeyInfo(lpFileName: LPCWSTR, dwFlags: DWORD, ppKeyInfo: PVOID): DWORD {
    return Advapi32.Load('EncryptedFileKeyInfo')(lpFileName, dwFlags, ppKeyInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-encryptiondisable
  public static EncryptionDisable(DirPath: LPCWSTR, Disable: BOOL): BOOL {
    return Advapi32.Load('EncryptionDisable')(DirPath, Disable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-enumdependentservicesa
  public static EnumDependentServicesA(hService: SC_HANDLE, dwServiceState: DWORD, lpServices: LPBYTE, cbBufSize: DWORD, pcbBytesNeeded: LPDWORD, lpServicesReturned: LPDWORD): BOOL {
    return Advapi32.Load('EnumDependentServicesA')(hService, dwServiceState, lpServices, cbBufSize, pcbBytesNeeded, lpServicesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-enumdependentservicesw
  public static EnumDependentServicesW(hService: SC_HANDLE, dwServiceState: DWORD, lpServices: LPBYTE, cbBufSize: DWORD, pcbBytesNeeded: LPDWORD, lpServicesReturned: LPDWORD): BOOL {
    return Advapi32.Load('EnumDependentServicesW')(hService, dwServiceState, lpServices, cbBufSize, pcbBytesNeeded, lpServicesReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/timezoneapi/nf-timezoneapi-enumdynamictimezoneinformation
  public static EnumDynamicTimeZoneInformation(dwIndex: DWORD, lpTimeZoneInformation: PVOID): DWORD {
    return Advapi32.Load('EnumDynamicTimeZoneInformation')(dwIndex, lpTimeZoneInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-enumservicegroupw
  public static EnumServiceGroupW(hSCManager: SC_HANDLE, dwServiceType: DWORD, dwServiceState: DWORD, lpServices: LPBYTE, cbBufSize: DWORD, pcbBytesNeeded: LPDWORD, lpServicesReturned: LPDWORD, lpResumeHandle: LPDWORD, pszGroupName: LPCWSTR): BOOL {
    return Advapi32.Load('EnumServiceGroupW')(hSCManager, dwServiceType, dwServiceState, lpServices, cbBufSize, pcbBytesNeeded, lpServicesReturned, lpResumeHandle, pszGroupName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-enumservicesstatusa
  public static EnumServicesStatusA(hSCManager: SC_HANDLE, dwServiceType: DWORD, dwServiceState: DWORD, lpServices: LPBYTE, cbBufSize: DWORD, pcbBytesNeeded: LPDWORD, lpServicesReturned: LPDWORD, lpResumeHandle: LPDWORD): BOOL {
    return Advapi32.Load('EnumServicesStatusA')(hSCManager, dwServiceType, dwServiceState, lpServices, cbBufSize, pcbBytesNeeded, lpServicesReturned, lpResumeHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-enumservicesstatusexa
  public static EnumServicesStatusExA(hSCManager: SC_HANDLE, InfoLevel: DWORD, dwServiceType: DWORD, dwServiceState: DWORD, lpServices: LPBYTE, cbBufSize: DWORD, pcbBytesNeeded: LPDWORD, lpServicesReturned: LPDWORD, lpResumeHandle: LPDWORD, pszGroupName: LPCSTR): BOOL {
    return Advapi32.Load('EnumServicesStatusExA')(hSCManager, InfoLevel, dwServiceType, dwServiceState, lpServices, cbBufSize, pcbBytesNeeded, lpServicesReturned, lpResumeHandle, pszGroupName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-enumservicesstatusexw
  public static EnumServicesStatusExW(hSCManager: SC_HANDLE, InfoLevel: DWORD, dwServiceType: DWORD, dwServiceState: DWORD, lpServices: LPBYTE, cbBufSize: DWORD, pcbBytesNeeded: LPDWORD, lpServicesReturned: LPDWORD, lpResumeHandle: LPDWORD, pszGroupName: LPCWSTR): BOOL {
    return Advapi32.Load('EnumServicesStatusExW')(hSCManager, InfoLevel, dwServiceType, dwServiceState, lpServices, cbBufSize, pcbBytesNeeded, lpServicesReturned, lpResumeHandle, pszGroupName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-enumservicesstatusw
  public static EnumServicesStatusW(hSCManager: SC_HANDLE, dwServiceType: DWORD, dwServiceState: DWORD, lpServices: LPBYTE, cbBufSize: DWORD, pcbBytesNeeded: LPDWORD, lpServicesReturned: LPDWORD, lpResumeHandle: LPDWORD): BOOL {
    return Advapi32.Load('EnumServicesStatusW')(hSCManager, dwServiceType, dwServiceState, lpServices, cbBufSize, pcbBytesNeeded, lpServicesReturned, lpResumeHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-enumeratetraceguids
  public static EnumerateTraceGuids(GuidPropertiesArray: PVOID, PropertyArrayCount: ULONG, GuidCount: PULONG): ULONG {
    return Advapi32.Load('EnumerateTraceGuids')(GuidPropertiesArray, PropertyArrayCount, GuidCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-enumeratetraceguidsex
  public static EnumerateTraceGuidsEx(TraceQueryInfoClass: DWORD, InBuffer: PVOID, InBufferSize: ULONG, OutBuffer: PVOID, OutBufferSize: ULONG, ReturnLength: PULONG): ULONG {
    return Advapi32.Load('EnumerateTraceGuidsEx')(TraceQueryInfoClass, InBuffer, InBufferSize, OutBuffer, OutBufferSize, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-equaldomainsid
  public static EqualDomainSid(pSid1: PSID, pSid2: PSID, pfEqual: PBOOL): BOOL {
    return Advapi32.Load('EqualDomainSid')(pSid1, pSid2, pfEqual);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-equalprefixsid
  public static EqualPrefixSid(pSid1: PSID, pSid2: PSID): BOOL {
    return Advapi32.Load('EqualPrefixSid')(pSid1, pSid2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-equalsid
  public static EqualSid(pSid1: PSID, pSid2: PSID): BOOL {
    return Advapi32.Load('EqualSid')(pSid1, pSid2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntcons/nf-evntcons-eventaccesscontrol
  public static EventAccessControl(Guid: PVOID, Operation: ULONG, Sid: PSID, Rights: ULONG, AllowOrDeny: BOOL): ULONG {
    return Advapi32.Load('EventAccessControl')(Guid, Operation, Sid, Rights, AllowOrDeny);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntcons/nf-evntcons-eventaccessquery
  public static EventAccessQuery(Guid: PVOID, Buffer: PSECURITY_DESCRIPTOR, BufferSize: PULONG): ULONG {
    return Advapi32.Load('EventAccessQuery')(Guid, Buffer, BufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntcons/nf-evntcons-eventaccessremove
  public static EventAccessRemove(Guid: PVOID): ULONG {
    return Advapi32.Load('EventAccessRemove')(Guid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-fileencryptionstatusa
  public static FileEncryptionStatusA(lpFileName: LPCSTR, lpStatus: LPDWORD): BOOL {
    return Advapi32.Load('FileEncryptionStatusA')(lpFileName, lpStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-fileencryptionstatusw
  public static FileEncryptionStatusW(lpFileName: LPCWSTR, lpStatus: LPDWORD): BOOL {
    return Advapi32.Load('FileEncryptionStatusW')(lpFileName, lpStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-findfirstfreeace
  public static FindFirstFreeAce(pAcl: PACL, pAce: PVOID): BOOL {
    return Advapi32.Load('FindFirstFreeAce')(pAcl, pAce);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-flushefscache
  public static FlushEfsCache(dwFlags: DWORD): DWORD {
    return Advapi32.Load('FlushEfsCache')(dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-flushtracea
  public static FlushTraceA(TraceHandle: TRACEHANDLE, InstanceName: LPCSTR, Properties: PVOID): ULONG {
    return Advapi32.Load('FlushTraceA')(TraceHandle, InstanceName, Properties);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-flushtracew
  public static FlushTraceW(TraceHandle: TRACEHANDLE, InstanceName: LPCWSTR, Properties: PVOID): ULONG {
    return Advapi32.Load('FlushTraceW')(TraceHandle, InstanceName, Properties);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-freeencryptedfilekeyinfo
  public static FreeEncryptedFileKeyInfo(pvKeyInfo: PVOID): VOID {
    return Advapi32.Load('FreeEncryptedFileKeyInfo')(pvKeyInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-freeencryptedfilemetadata
  public static FreeEncryptedFileMetadata(pbMetadata: PVOID): VOID {
    return Advapi32.Load('FreeEncryptedFileMetadata')(pbMetadata);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-freeencryptioncertificatehashlist
  public static FreeEncryptionCertificateHashList(pUsers: PENCRYPTION_CERTIFICATE_HASH_LIST): VOID {
    return Advapi32.Load('FreeEncryptionCertificateHashList')(pUsers);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-freeinheritedfromarray
  public static FreeInheritedFromArray(pInheritArray: PVOID, AceCnt: USHORT, pfnArray: PVOID): DWORD {
    return Advapi32.Load('FreeInheritedFromArray')(pInheritArray, AceCnt, pfnArray);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-freesid
  public static FreeSid(pSid: PSID): PVOID {
    return Advapi32.Load('FreeSid')(pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getaccesspermissionsforobjecta
  public static GetAccessPermissionsForObjectA(pObjectName: LPCSTR, ObjectType: DWORD, ObjectTypeName: LPCSTR, pTrustee: PTRUSTEE, pcCountOfExplicitEntries: PULONG, pListOfExplicitEntries: PVOID, pcCountOfPermissions: PULONG, ppPermissionList: PVOID, ppDefaultAccess: PVOID): DWORD {
    return Advapi32.Load('GetAccessPermissionsForObjectA')(pObjectName, ObjectType, ObjectTypeName, pTrustee, pcCountOfExplicitEntries, pListOfExplicitEntries, pcCountOfPermissions, ppPermissionList, ppDefaultAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getaccesspermissionsforobjectw
  public static GetAccessPermissionsForObjectW(pObjectName: LPCWSTR, ObjectType: DWORD, ObjectTypeName: LPCWSTR, pTrustee: PTRUSTEE, pcCountOfExplicitEntries: PULONG, pListOfExplicitEntries: PVOID, pcCountOfPermissions: PULONG, ppPermissionList: PVOID, ppDefaultAccess: PVOID): DWORD {
    return Advapi32.Load('GetAccessPermissionsForObjectW')(pObjectName, ObjectType, ObjectTypeName, pTrustee, pcCountOfExplicitEntries, pListOfExplicitEntries, pcCountOfPermissions, ppPermissionList, ppDefaultAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getace
  public static GetAce(pAcl: PACL, dwAceIndex: DWORD, pAce: PVOID): BOOL {
    return Advapi32.Load('GetAce')(pAcl, dwAceIndex, pAce);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getaclinformation
  public static GetAclInformation(pAcl: PACL, pAclInformation: LPVOID, nAclInformationLength: DWORD, dwAclInformationClass: DWORD): BOOL {
    return Advapi32.Load('GetAclInformation')(pAcl, pAclInformation, nAclInformationLength, dwAclInformationClass);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getauditedpermissionsfromacla
  public static GetAuditedPermissionsFromAclA(pacl: PACL, pTrustee: PTRUSTEE, pSuccessfulAuditedRights: LPDWORD, pFailedAuditRights: LPDWORD): DWORD {
    return Advapi32.Load('GetAuditedPermissionsFromAclA')(pacl, pTrustee, pSuccessfulAuditedRights, pFailedAuditRights);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getauditedpermissionsfromaclw
  public static GetAuditedPermissionsFromAclW(pacl: PACL, pTrustee: PTRUSTEE, pSuccessfulAuditedRights: LPDWORD, pFailedAuditRights: LPDWORD): DWORD {
    return Advapi32.Load('GetAuditedPermissionsFromAclW')(pacl, pTrustee, pSuccessfulAuditedRights, pFailedAuditRights);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcurrenthwprofilea
  public static GetCurrentHwProfileA(lpHwProfileInfo: PVOID): BOOL {
    return Advapi32.Load('GetCurrentHwProfileA')(lpHwProfileInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcurrenthwprofilew
  public static GetCurrentHwProfileW(lpHwProfileInfo: PVOID): BOOL {
    return Advapi32.Load('GetCurrentHwProfileW')(lpHwProfileInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/timezoneapi/nf-timezoneapi-getdynamictimezoneinformationeffectiveyears
  public static GetDynamicTimeZoneInformationEffectiveYears(lpTimeZoneInformation: PVOID, FirstYear: LPDWORD, LastYear: LPDWORD): DWORD {
    return Advapi32.Load('GetDynamicTimeZoneInformationEffectiveYears')(lpTimeZoneInformation, FirstYear, LastYear);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-geteffectiverightsfromacla
  public static GetEffectiveRightsFromAclA(pacl: PACL, pTrustee: PTRUSTEE, pAccessRights: LPDWORD): DWORD {
    return Advapi32.Load('GetEffectiveRightsFromAclA')(pacl, pTrustee, pAccessRights);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-geteffectiverightsfromaclw
  public static GetEffectiveRightsFromAclW(pacl: PACL, pTrustee: PTRUSTEE, pAccessRights: LPDWORD): DWORD {
    return Advapi32.Load('GetEffectiveRightsFromAclW')(pacl, pTrustee, pAccessRights);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-getencryptedfilemetadata
  public static GetEncryptedFileMetadata(lpFileName: LPCWSTR, pcbMetadata: LPDWORD, ppbMetadata: PVOID): DWORD {
    return Advapi32.Load('GetEncryptedFileMetadata')(lpFileName, pcbMetadata, ppbMetadata);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-geteventloginformation
  public static GetEventLogInformation(hEventLog: HANDLE, dwInfoLevel: DWORD, lpBuffer: LPVOID, cbBufSize: DWORD, pcbBytesNeeded: LPDWORD): BOOL {
    return Advapi32.Load('GetEventLogInformation')(hEventLog, dwInfoLevel, lpBuffer, cbBufSize, pcbBytesNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getexplicitentriesfromacla
  public static GetExplicitEntriesFromAclA(pacl: PACL, pcCountOfExplicitEntries: PULONG, pListOfExplicitEntries: PVOID): DWORD {
    return Advapi32.Load('GetExplicitEntriesFromAclA')(pacl, pcCountOfExplicitEntries, pListOfExplicitEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getexplicitentriesfromaclw
  public static GetExplicitEntriesFromAclW(pacl: PACL, pcCountOfExplicitEntries: PULONG, pListOfExplicitEntries: PVOID): DWORD {
    return Advapi32.Load('GetExplicitEntriesFromAclW')(pacl, pcCountOfExplicitEntries, pListOfExplicitEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getfilesecuritya
  public static GetFileSecurityA(lpFileName: LPCSTR, RequestedInformation: SECURITY_INFORMATION, pSecurityDescriptor: PSECURITY_DESCRIPTOR, nLength: DWORD, lpnLengthNeeded: LPDWORD): BOOL {
    return Advapi32.Load('GetFileSecurityA')(lpFileName, RequestedInformation, pSecurityDescriptor, nLength, lpnLengthNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getfilesecurityw
  public static GetFileSecurityW(lpFileName: LPCWSTR, RequestedInformation: SECURITY_INFORMATION, pSecurityDescriptor: PSECURITY_DESCRIPTOR, nLength: DWORD, lpnLengthNeeded: LPDWORD): BOOL {
    return Advapi32.Load('GetFileSecurityW')(lpFileName, RequestedInformation, pSecurityDescriptor, nLength, lpnLengthNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-getinformationcodeauthzlevelw
  public static GetInformationCodeAuthzLevelW(hLevel: HANDLE, dwInfoType: DWORD, lpQueryBuffer: PVOID, dwInBufferSize: DWORD, lpdwOutBufferSize: LPDWORD): BOOL {
    return Advapi32.Load('GetInformationCodeAuthzLevelW')(hLevel, dwInfoType, lpQueryBuffer, dwInBufferSize, lpdwOutBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-getinformationcodeauthzpolicyw
  public static GetInformationCodeAuthzPolicyW(dwScopeId: DWORD, SaferPolicyInfoClass: DWORD, InfoBuffer: PVOID, InfoBufferSize: DWORD, InfoBufferRetSize: LPDWORD): BOOL {
    return Advapi32.Load('GetInformationCodeAuthzPolicyW')(dwScopeId, SaferPolicyInfoClass, InfoBuffer, InfoBufferSize, InfoBufferRetSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getinheritancesourcea
  public static GetInheritanceSourceA(pObjectName: LPCSTR, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, Container: BOOL, pObjectClassGuids: PVOID, GuidCount: DWORD, pAcl: PACL, pfnArray: PVOID, pGenericMapping: PGENERIC_MAPPING, pInheritArray: PVOID): DWORD {
    return Advapi32.Load('GetInheritanceSourceA')(pObjectName, ObjectType, SecurityInfo, Container, pObjectClassGuids, GuidCount, pAcl, pfnArray, pGenericMapping, pInheritArray);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getinheritancesourcew
  public static GetInheritanceSourceW(pObjectName: LPCWSTR, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, Container: BOOL, pObjectClassGuids: PVOID, GuidCount: DWORD, pAcl: PACL, pfnArray: PVOID, pGenericMapping: PGENERIC_MAPPING, pInheritArray: PVOID): DWORD {
    return Advapi32.Load('GetInheritanceSourceW')(pObjectName, ObjectType, SecurityInfo, Container, pObjectClassGuids, GuidCount, pAcl, pfnArray, pGenericMapping, pInheritArray);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getkernelobjectsecurity
  public static GetKernelObjectSecurity(Handle: HANDLE, RequestedInformation: SECURITY_INFORMATION, pSecurityDescriptor: PSECURITY_DESCRIPTOR, nLength: DWORD, lpnLengthNeeded: LPDWORD): BOOL {
    return Advapi32.Load('GetKernelObjectSecurity')(Handle, RequestedInformation, pSecurityDescriptor, nLength, lpnLengthNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getlengthsid
  public static GetLengthSid(pSid: PSID): DWORD {
    return Advapi32.Load('GetLengthSid')(pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmgmt/nf-appmgmt-getlocalmanagedapplicationdata
  public static GetLocalManagedApplicationData(ProductCode: LPCWSTR, DisplayName: PVOID, SupportUrl: LPDWORD): VOID {
    return Advapi32.Load('GetLocalManagedApplicationData')(ProductCode, DisplayName, SupportUrl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmgmt/nf-appmgmt-getlocalmanagedapplications
  public static GetLocalManagedApplications(bUserApps: BOOL, pdwApps: LPDWORD, prgLocalApps: PVOID): DWORD {
    return Advapi32.Load('GetLocalManagedApplications')(bUserApps, pdwApps, prgLocalApps);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmgmt/nf-appmgmt-getmanagedapplicationcategories
  public static GetManagedApplicationCategories(dwReserved: DWORD, pAppCategory: PVOID): DWORD {
    return Advapi32.Load('GetManagedApplicationCategories')(dwReserved, pAppCategory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmgmt/nf-appmgmt-getmanagedapplications
  public static GetManagedApplications(pCategory: PVOID, dwQueryFlags: DWORD, dwInfoLevel: DWORD, pdwApps: LPDWORD, prgManagedApps: PVOID): DWORD {
    return Advapi32.Load('GetManagedApplications')(pCategory, dwQueryFlags, dwInfoLevel, pdwApps, prgManagedApps);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getmultipletrusteea
  public static GetMultipleTrusteeA(pTrustee: PTRUSTEE): PVOID {
    return Advapi32.Load('GetMultipleTrusteeA')(pTrustee);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getmultipletrusteeoperationa
  public static GetMultipleTrusteeOperationA(pTrustee: PTRUSTEE): DWORD {
    return Advapi32.Load('GetMultipleTrusteeOperationA')(pTrustee);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getmultipletrusteeoperationw
  public static GetMultipleTrusteeOperationW(pTrustee: PTRUSTEE): DWORD {
    return Advapi32.Load('GetMultipleTrusteeOperationW')(pTrustee);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getmultipletrusteew
  public static GetMultipleTrusteeW(pTrustee: PTRUSTEE): PVOID {
    return Advapi32.Load('GetMultipleTrusteeW')(pTrustee);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getnamedsecurityinfoa
  public static GetNamedSecurityInfoA(pObjectName: LPCSTR, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, ppsidOwner: PVOID, ppsidGroup: PVOID, ppDacl: PVOID, ppSacl: PVOID, ppSecurityDescriptor: PVOID): DWORD {
    return Advapi32.Load('GetNamedSecurityInfoA')(pObjectName, ObjectType, SecurityInfo, ppsidOwner, ppsidGroup, ppDacl, ppSacl, ppSecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getnamedsecurityinfoexa
  public static GetNamedSecurityInfoExA(pObjectName: LPCSTR, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, lpProvider: LPCSTR, lpProperty: LPCSTR, ppAccessList: PVOID, ppAuditList: PVOID, lpOwner: PVOID, lpGroup: PVOID): DWORD {
    return Advapi32.Load('GetNamedSecurityInfoExA')(pObjectName, ObjectType, SecurityInfo, lpProvider, lpProperty, ppAccessList, ppAuditList, lpOwner, lpGroup);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getnamedsecurityinfoexw
  public static GetNamedSecurityInfoExW(pObjectName: LPCWSTR, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, lpProvider: LPCWSTR, lpProperty: LPCWSTR, ppAccessList: PVOID, ppAuditList: PVOID, lpOwner: PVOID, lpGroup: PVOID): DWORD {
    return Advapi32.Load('GetNamedSecurityInfoExW')(pObjectName, ObjectType, SecurityInfo, lpProvider, lpProperty, ppAccessList, ppAuditList, lpOwner, lpGroup);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getnamedsecurityinfow
  public static GetNamedSecurityInfoW(pObjectName: LPCWSTR, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, ppsidOwner: PVOID, ppsidGroup: PVOID, ppDacl: PVOID, ppSacl: PVOID, ppSecurityDescriptor: PVOID): DWORD {
    return Advapi32.Load('GetNamedSecurityInfoW')(pObjectName, ObjectType, SecurityInfo, ppsidOwner, ppsidGroup, ppDacl, ppSacl, ppSecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getnumberofeventlogrecords
  public static GetNumberOfEventLogRecords(hEventLog: HANDLE, NumberOfRecords: LPDWORD): BOOL {
    return Advapi32.Load('GetNumberOfEventLogRecords')(hEventLog, NumberOfRecords);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getoldesteventlogrecord
  public static GetOldestEventLogRecord(hEventLog: HANDLE, OldestRecord: LPDWORD): BOOL {
    return Advapi32.Load('GetOldestEventLogRecord')(hEventLog, OldestRecord);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getoverlappedaccessresults
  public static GetOverlappedAccessResults(pOverlapped: PVOID, pResult: PVOID, pfPending: PVOID, bWait: BOOL): DWORD {
    return Advapi32.Load('GetOverlappedAccessResults')(pOverlapped, pResult, pfPending, bWait);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getprivateobjectsecurity
  public static GetPrivateObjectSecurity(ObjectDescriptor: PSECURITY_DESCRIPTOR, SecurityInformation: SECURITY_INFORMATION, ResultantDescriptor: PSECURITY_DESCRIPTOR, DescriptorLength: DWORD, ReturnLength: LPDWORD): BOOL {
    return Advapi32.Load('GetPrivateObjectSecurity')(ObjectDescriptor, SecurityInformation, ResultantDescriptor, DescriptorLength, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getsecuritydescriptorcontrol
  public static GetSecurityDescriptorControl(pSecurityDescriptor: PSECURITY_DESCRIPTOR, pControl: PVOID, lpdwRevision: LPDWORD): BOOL {
    return Advapi32.Load('GetSecurityDescriptorControl')(pSecurityDescriptor, pControl, lpdwRevision);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getsecuritydescriptordacl
  public static GetSecurityDescriptorDacl(pSecurityDescriptor: PSECURITY_DESCRIPTOR, lpbDaclPresent: LPBOOL, pDacl: PVOID, lpbDaclDefaulted: LPBOOL): BOOL {
    return Advapi32.Load('GetSecurityDescriptorDacl')(pSecurityDescriptor, lpbDaclPresent, pDacl, lpbDaclDefaulted);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getsecuritydescriptorgroup
  public static GetSecurityDescriptorGroup(pSecurityDescriptor: PSECURITY_DESCRIPTOR, pGroup: PVOID, lpbGroupDefaulted: LPBOOL): BOOL {
    return Advapi32.Load('GetSecurityDescriptorGroup')(pSecurityDescriptor, pGroup, lpbGroupDefaulted);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getsecuritydescriptorlength
  public static GetSecurityDescriptorLength(pSecurityDescriptor: PSECURITY_DESCRIPTOR): DWORD {
    return Advapi32.Load('GetSecurityDescriptorLength')(pSecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getsecuritydescriptorowner
  public static GetSecurityDescriptorOwner(pSecurityDescriptor: PSECURITY_DESCRIPTOR, pOwner: PVOID, lpbOwnerDefaulted: LPBOOL): BOOL {
    return Advapi32.Load('GetSecurityDescriptorOwner')(pSecurityDescriptor, pOwner, lpbOwnerDefaulted);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getsecuritydescriptorrmcontrol
  public static GetSecurityDescriptorRMControl(SecurityDescriptor: PSECURITY_DESCRIPTOR, RMControl: PUCHAR): DWORD {
    return Advapi32.Load('GetSecurityDescriptorRMControl')(SecurityDescriptor, RMControl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getsecuritydescriptorsacl
  public static GetSecurityDescriptorSacl(pSecurityDescriptor: PSECURITY_DESCRIPTOR, lpbSaclPresent: LPBOOL, pSacl: PVOID, lpbSaclDefaulted: LPBOOL): BOOL {
    return Advapi32.Load('GetSecurityDescriptorSacl')(pSecurityDescriptor, lpbSaclPresent, pSacl, lpbSaclDefaulted);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getsecurityinfo
  public static GetSecurityInfo(handle: HANDLE, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, ppsidOwner: PVOID, ppsidGroup: PVOID, ppDacl: PVOID, ppSacl: PVOID, ppSecurityDescriptor: PVOID): DWORD {
    return Advapi32.Load('GetSecurityInfo')(handle, ObjectType, SecurityInfo, ppsidOwner, ppsidGroup, ppDacl, ppSacl, ppSecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getsecurityinfoexa
  public static GetSecurityInfoExA(handle: HANDLE, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, lpProvider: LPCSTR, lpProperty: LPCSTR, ppAccessList: PVOID, ppAuditList: PVOID, lpOwner: PVOID, lpGroup: PVOID): DWORD {
    return Advapi32.Load('GetSecurityInfoExA')(handle, ObjectType, SecurityInfo, lpProvider, lpProperty, ppAccessList, ppAuditList, lpOwner, lpGroup);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getsecurityinfoexw
  public static GetSecurityInfoExW(handle: HANDLE, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, lpProvider: LPCWSTR, lpProperty: LPCWSTR, ppAccessList: PVOID, ppAuditList: PVOID, lpOwner: PVOID, lpGroup: PVOID): DWORD {
    return Advapi32.Load('GetSecurityInfoExW')(handle, ObjectType, SecurityInfo, lpProvider, lpProperty, ppAccessList, ppAuditList, lpOwner, lpGroup);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-getservicedisplaynamea
  public static GetServiceDisplayNameA(hSCManager: SC_HANDLE, lpServiceName: LPCSTR, lpDisplayName: LPSTR, lpcchBuffer: LPDWORD): BOOL {
    return Advapi32.Load('GetServiceDisplayNameA')(hSCManager, lpServiceName, lpDisplayName, lpcchBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-getservicedisplaynamew
  public static GetServiceDisplayNameW(hSCManager: SC_HANDLE, lpServiceName: LPCWSTR, lpDisplayName: LPWSTR, lpcchBuffer: LPDWORD): BOOL {
    return Advapi32.Load('GetServiceDisplayNameW')(hSCManager, lpServiceName, lpDisplayName, lpcchBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-getservicekeynamea
  public static GetServiceKeyNameA(hSCManager: SC_HANDLE, lpDisplayName: LPCSTR, lpServiceName: LPSTR, lpcchBuffer: LPDWORD): BOOL {
    return Advapi32.Load('GetServiceKeyNameA')(hSCManager, lpDisplayName, lpServiceName, lpcchBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-getservicekeynamew
  public static GetServiceKeyNameW(hSCManager: SC_HANDLE, lpDisplayName: LPCWSTR, lpServiceName: LPWSTR, lpcchBuffer: LPDWORD): BOOL {
    return Advapi32.Load('GetServiceKeyNameW')(hSCManager, lpDisplayName, lpServiceName, lpcchBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getsididentifierauthority
  public static GetSidIdentifierAuthority(pSid: PSID): PVOID {
    return Advapi32.Load('GetSidIdentifierAuthority')(pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getsidlengthrequired
  public static GetSidLengthRequired(nSubAuthorityCount: BYTE): DWORD {
    return Advapi32.Load('GetSidLengthRequired')(nSubAuthorityCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getsidsubauthority
  public static GetSidSubAuthority(pSid: PSID, nSubAuthority: DWORD): PDWORD {
    return Advapi32.Load('GetSidSubAuthority')(pSid, nSubAuthority);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getsidsubauthoritycount
  public static GetSidSubAuthorityCount(pSid: PSID): PUCHAR {
    return Advapi32.Load('GetSidSubAuthorityCount')(pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getstringconditionfrombinary
  public static GetStringConditionFromBinary(pCondition: PVOID, cbCondition: DWORD, dwFlags: DWORD, pStringCondition: PVOID): DWORD {
    return Advapi32.Load('GetStringConditionFromBinary')(pCondition, cbCondition, dwFlags, pStringCondition);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wct/nf-wct-getthreadwaitchain
  public static GetThreadWaitChain(WctHandle: HWCT, Context: PVOID, Flags: ULONG, ThreadId: DWORD, NodeCount: LPDWORD, NodeInfoArray: PVOID, IsCycle: LPBOOL): BOOL {
    return Advapi32.Load('GetThreadWaitChain')(WctHandle, Context, Flags, ThreadId, NodeCount, NodeInfoArray, IsCycle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-gettokeninformation
  public static GetTokenInformation(TokenHandle: HANDLE, TokenInformationClass: TOKEN_INFORMATION_CLASS, TokenInformation: LPVOID, TokenInformationLength: DWORD, ReturnLength: LPDWORD): BOOL {
    return Advapi32.Load('GetTokenInformation')(TokenHandle, TokenInformationClass, TokenInformation, TokenInformationLength, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-gettrusteeforma
  public static GetTrusteeFormA(pTrustee: PTRUSTEE): DWORD {
    return Advapi32.Load('GetTrusteeFormA')(pTrustee);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-gettrusteeformw
  public static GetTrusteeFormW(pTrustee: PTRUSTEE): DWORD {
    return Advapi32.Load('GetTrusteeFormW')(pTrustee);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-gettrusteenamea
  public static GetTrusteeNameA(pTrustee: PTRUSTEE): PVOID {
    return Advapi32.Load('GetTrusteeNameA')(pTrustee);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-gettrusteenamew
  public static GetTrusteeNameW(pTrustee: PTRUSTEE): PVOID {
    return Advapi32.Load('GetTrusteeNameW')(pTrustee);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-gettrusteetypea
  public static GetTrusteeTypeA(pTrustee: PTRUSTEE): DWORD {
    return Advapi32.Load('GetTrusteeTypeA')(pTrustee);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-gettrusteetypew
  public static GetTrusteeTypeW(pTrustee: PTRUSTEE): DWORD {
    return Advapi32.Load('GetTrusteeTypeW')(pTrustee);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getusernamea
  public static GetUserNameA(lpBuffer: LPSTR, pcbBuffer: LPDWORD): BOOL {
    return Advapi32.Load('GetUserNameA')(lpBuffer, pcbBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getusernamew
  public static GetUserNameW(lpBuffer: LPWSTR, pcbBuffer: LPDWORD): BOOL {
    return Advapi32.Load('GetUserNameW')(lpBuffer, pcbBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getwindowsaccountdomainsid
  public static GetWindowsAccountDomainSid(pSid: PSID, pDomainSid: PSID, cbDomainSid: LPDWORD): BOOL {
    return Advapi32.Load('GetWindowsAccountDomainSid')(pSid, pDomainSid, cbDomainSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-i_scgetcurrentgroupstatew
  public static I_ScGetCurrentGroupStateW(hSCManager: SC_HANDLE, lpGroupName: LPCWSTR, pdwCurrentState: LPDWORD): DWORD {
    return Advapi32.Load('I_ScGetCurrentGroupStateW')(hSCManager, lpGroupName, pdwCurrentState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-i_screparseservicedatabase
  public static I_ScReparseServiceDatabase(): DWORD {
    return Advapi32.Load('I_ScReparseServiceDatabase')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-i_scsetservicebitsa
  public static I_ScSetServiceBitsA(hServiceStatus: SERVICE_STATUS_HANDLE, dwServiceBits: DWORD, bSetBitsOn: BOOL, bUpdateImmediately: BOOL, lpServiceName: LPCSTR): BOOL {
    return Advapi32.Load('I_ScSetServiceBitsA')(hServiceStatus, dwServiceBits, bSetBitsOn, bUpdateImmediately, lpServiceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-i_scsetservicebitsw
  public static I_ScSetServiceBitsW(hServiceStatus: SERVICE_STATUS_HANDLE, dwServiceBits: DWORD, bSetBitsOn: BOOL, bUpdateImmediately: BOOL, lpServiceName: LPCWSTR): BOOL {
    return Advapi32.Load('I_ScSetServiceBitsW')(hServiceStatus, dwServiceBits, bSetBitsOn, bUpdateImmediately, lpServiceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-identifycodeauthzlevelw
  public static IdentifyCodeAuthzLevelW(dwNumProperties: DWORD, pCodeProperties: PVOID, pLevelHandle: PVOID, lpReserved: PVOID): BOOL {
    return Advapi32.Load('IdentifyCodeAuthzLevelW')(dwNumProperties, pCodeProperties, pLevelHandle, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-impersonateanonymoustoken
  public static ImpersonateAnonymousToken(ThreadHandle: HANDLE): BOOL {
    return Advapi32.Load('ImpersonateAnonymousToken')(ThreadHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-impersonateloggedonuser
  public static ImpersonateLoggedOnUser(hToken: HANDLE): BOOL {
    return Advapi32.Load('ImpersonateLoggedOnUser')(hToken);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-impersonatenamedpipeclient
  public static ImpersonateNamedPipeClient(hNamedPipe: HANDLE): BOOL {
    return Advapi32.Load('ImpersonateNamedPipeClient')(hNamedPipe);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-impersonateself
  public static ImpersonateSelf(ImpersonationLevel: SECURITY_IMPERSONATION_LEVEL): BOOL {
    return Advapi32.Load('ImpersonateSelf')(ImpersonationLevel);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-initializeacl
  public static InitializeAcl(pAcl: PACL, nAclLength: DWORD, dwAclRevision: DWORD): BOOL {
    return Advapi32.Load('InitializeAcl')(pAcl, nAclLength, dwAclRevision);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-initializesecuritydescriptor
  public static InitializeSecurityDescriptor(pSecurityDescriptor: PSECURITY_DESCRIPTOR, dwRevision: DWORD): BOOL {
    return Advapi32.Load('InitializeSecurityDescriptor')(pSecurityDescriptor, dwRevision);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-initializesid
  public static InitializeSid(Sid: PSID, pIdentifierAuthority: PSID_IDENTIFIER_AUTHORITY, nSubAuthorityCount: BYTE): BOOL {
    return Advapi32.Load('InitializeSid')(Sid, pIdentifierAuthority, nSubAuthorityCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-initiateshutdowna
  public static InitiateShutdownA(lpMachineName: LPSTR, lpMessage: LPSTR, dwGracePeriod: DWORD, dwShutdownFlags: DWORD, dwReason: DWORD): DWORD {
    return Advapi32.Load('InitiateShutdownA')(lpMachineName, lpMessage, dwGracePeriod, dwShutdownFlags, dwReason);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-initiateshutdownw
  public static InitiateShutdownW(lpMachineName: LPWSTR, lpMessage: LPWSTR, dwGracePeriod: DWORD, dwShutdownFlags: DWORD, dwReason: DWORD): DWORD {
    return Advapi32.Load('InitiateShutdownW')(lpMachineName, lpMessage, dwGracePeriod, dwShutdownFlags, dwReason);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-initiatesystemshutdowna
  public static InitiateSystemShutdownA(lpMachineName: LPSTR, lpMessage: LPSTR, dwTimeout: DWORD, bForceAppsClosed: BOOL, bRebootAfterShutdown: BOOL): BOOL {
    return Advapi32.Load('InitiateSystemShutdownA')(lpMachineName, lpMessage, dwTimeout, bForceAppsClosed, bRebootAfterShutdown);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-initiatesystemshutdownexa
  public static InitiateSystemShutdownExA(lpMachineName: LPSTR, lpMessage: LPSTR, dwTimeout: DWORD, bForceAppsClosed: BOOL, bRebootAfterShutdown: BOOL, dwReason: DWORD): BOOL {
    return Advapi32.Load('InitiateSystemShutdownExA')(lpMachineName, lpMessage, dwTimeout, bForceAppsClosed, bRebootAfterShutdown, dwReason);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-initiatesystemshutdownexw
  public static InitiateSystemShutdownExW(lpMachineName: LPWSTR, lpMessage: LPWSTR, dwTimeout: DWORD, bForceAppsClosed: BOOL, bRebootAfterShutdown: BOOL, dwReason: DWORD): BOOL {
    return Advapi32.Load('InitiateSystemShutdownExW')(lpMachineName, lpMessage, dwTimeout, bForceAppsClosed, bRebootAfterShutdown, dwReason);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-initiatesystemshutdownw
  public static InitiateSystemShutdownW(lpMachineName: LPWSTR, lpMessage: LPWSTR, dwTimeout: DWORD, bForceAppsClosed: BOOL, bRebootAfterShutdown: BOOL): BOOL {
    return Advapi32.Load('InitiateSystemShutdownW')(lpMachineName, lpMessage, dwTimeout, bForceAppsClosed, bRebootAfterShutdown);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmgmt/nf-appmgmt-installapplication
  public static InstallApplication(pInstallInfo: PVOID): DWORD {
    return Advapi32.Load('InstallApplication')(pInstallInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-istextunicode
  public static IsTextUnicode(lpv: LPCVOID, iSize: INT, lpiResult: LPVOID): BOOL {
    return Advapi32.Load('IsTextUnicode')(lpv, iSize, lpiResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-istokenrestricted
  public static IsTokenRestricted(TokenHandle: HANDLE): BOOL {
    return Advapi32.Load('IsTokenRestricted')(TokenHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-istokenuntrusted
  public static IsTokenUntrusted(TokenHandle: HANDLE): BOOL {
    return Advapi32.Load('IsTokenUntrusted')(TokenHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-isvalidacl
  public static IsValidAcl(pAcl: PACL): BOOL {
    return Advapi32.Load('IsValidAcl')(pAcl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-isvalidsecuritydescriptor
  public static IsValidSecurityDescriptor(pSecurityDescriptor: PSECURITY_DESCRIPTOR): BOOL {
    return Advapi32.Load('IsValidSecurityDescriptor')(pSecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-isvalidsid
  public static IsValidSid(pSid: PSID): BOOL {
    return Advapi32.Load('IsValidSid')(pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-iswellknownsid
  public static IsWellKnownSid(pSid: PSID, WellKnownSidType: DWORD): BOOL {
    return Advapi32.Load('IsWellKnownSid')(pSid, WellKnownSidType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-lockservicedatabase
  public static LockServiceDatabase(hSCManager: SC_HANDLE): PVOID {
    return Advapi32.Load('LockServiceDatabase')(hSCManager);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-logonsecondaryuserintosessionw
  public static LogonSecondaryUserIntoSessionW(lpUsername: PVOID, lpDomain: PVOID, lpPassword: PVOID): DWORD {
    return Advapi32.Load('LogonSecondaryUserIntoSessionW')(lpUsername, lpDomain, lpPassword);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-logonusera
  public static LogonUserA(lpszUsername: LPCSTR, lpszDomain: LPCSTR, lpszPassword: LPCSTR, dwLogonType: DWORD, dwLogonProvider: DWORD, phToken: PHANDLE): BOOL {
    return Advapi32.Load('LogonUserA')(lpszUsername, lpszDomain, lpszPassword, dwLogonType, dwLogonProvider, phToken);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-logonuserexa
  public static LogonUserExA(lpszUsername: LPCSTR, lpszDomain: LPCSTR, lpszPassword: LPCSTR, dwLogonType: DWORD, dwLogonProvider: DWORD, phToken: PHANDLE, ppLogonSid: PVOID, ppProfileBuffer: PVOID, pdwProfileLength: LPDWORD, pQuotaLimits: PVOID): BOOL {
    return Advapi32.Load('LogonUserExA')(lpszUsername, lpszDomain, lpszPassword, dwLogonType, dwLogonProvider, phToken, ppLogonSid, ppProfileBuffer, pdwProfileLength, pQuotaLimits);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-logonuserexexw
  public static LogonUserExExW(lpszUsername: LPCWSTR, lpszDomain: LPCWSTR, lpszPassword: LPCWSTR, dwLogonType: DWORD, dwLogonProvider: DWORD, pTokenGroups: PTOKEN_GROUPS, phToken: PHANDLE, ppLogonSid: PVOID, ppProfileBuffer: PVOID, pdwProfileLength: LPDWORD, pQuotaLimits: PVOID): BOOL {
    return Advapi32.Load('LogonUserExExW')(lpszUsername, lpszDomain, lpszPassword, dwLogonType, dwLogonProvider, pTokenGroups, phToken, ppLogonSid, ppProfileBuffer, pdwProfileLength, pQuotaLimits);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-logonuserexw
  public static LogonUserExW(lpszUsername: LPCWSTR, lpszDomain: LPCWSTR, lpszPassword: LPCWSTR, dwLogonType: DWORD, dwLogonProvider: DWORD, phToken: PHANDLE, ppLogonSid: PVOID, ppProfileBuffer: PVOID, pdwProfileLength: LPDWORD, pQuotaLimits: PVOID): BOOL {
    return Advapi32.Load('LogonUserExW')(lpszUsername, lpszDomain, lpszPassword, dwLogonType, dwLogonProvider, phToken, ppLogonSid, ppProfileBuffer, pdwProfileLength, pQuotaLimits);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-logonuserw
  public static LogonUserW(lpszUsername: LPCWSTR, lpszDomain: LPCWSTR, lpszPassword: LPCWSTR, dwLogonType: DWORD, dwLogonProvider: DWORD, phToken: PHANDLE): BOOL {
    return Advapi32.Load('LogonUserW')(lpszUsername, lpszDomain, lpszPassword, dwLogonType, dwLogonProvider, phToken);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lookupaccountnamea
  public static LookupAccountNameA(lpSystemName: LPCSTR, lpAccountName: LPCSTR, Sid: PSID, cbSid: LPDWORD, ReferencedDomainName: LPSTR, cchReferencedDomainName: LPDWORD, peUse: PSID_NAME_USE): BOOL {
    return Advapi32.Load('LookupAccountNameA')(lpSystemName, lpAccountName, Sid, cbSid, ReferencedDomainName, cchReferencedDomainName, peUse);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lookupaccountnamew
  public static LookupAccountNameW(lpSystemName: LPCWSTR, lpAccountName: LPCWSTR, Sid: PSID, cbSid: LPDWORD, ReferencedDomainName: LPWSTR, cchReferencedDomainName: LPDWORD, peUse: PSID_NAME_USE): BOOL {
    return Advapi32.Load('LookupAccountNameW')(lpSystemName, lpAccountName, Sid, cbSid, ReferencedDomainName, cchReferencedDomainName, peUse);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lookupaccountsida
  public static LookupAccountSidA(lpSystemName: LPCSTR, Sid: PSID, Name: LPSTR, cchName: LPDWORD, ReferencedDomainName: LPSTR, cchReferencedDomainName: LPDWORD, peUse: PSID_NAME_USE): BOOL {
    return Advapi32.Load('LookupAccountSidA')(lpSystemName, Sid, Name, cchName, ReferencedDomainName, cchReferencedDomainName, peUse);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lookupaccountsidw
  public static LookupAccountSidW(lpSystemName: LPCWSTR, Sid: PSID, Name: LPWSTR, cchName: LPDWORD, ReferencedDomainName: LPWSTR, cchReferencedDomainName: LPDWORD, peUse: PSID_NAME_USE): BOOL {
    return Advapi32.Load('LookupAccountSidW')(lpSystemName, Sid, Name, cchName, ReferencedDomainName, cchReferencedDomainName, peUse);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lookupprivilegedisplaynamea
  public static LookupPrivilegeDisplayNameA(lpSystemName: LPCSTR, lpName: LPCSTR, lpDisplayName: LPSTR, cchDisplayName: LPDWORD, lpLanguageId: LPDWORD): BOOL {
    return Advapi32.Load('LookupPrivilegeDisplayNameA')(lpSystemName, lpName, lpDisplayName, cchDisplayName, lpLanguageId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lookupprivilegedisplaynamew
  public static LookupPrivilegeDisplayNameW(lpSystemName: LPCWSTR, lpName: LPCWSTR, lpDisplayName: LPWSTR, cchDisplayName: LPDWORD, lpLanguageId: LPDWORD): BOOL {
    return Advapi32.Load('LookupPrivilegeDisplayNameW')(lpSystemName, lpName, lpDisplayName, cchDisplayName, lpLanguageId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lookupprivilegenamea
  public static LookupPrivilegeNameA(lpSystemName: LPCSTR, lpLuid: PVOID, lpName: LPSTR, cchName: LPDWORD): BOOL {
    return Advapi32.Load('LookupPrivilegeNameA')(lpSystemName, lpLuid, lpName, cchName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lookupprivilegenamew
  public static LookupPrivilegeNameW(lpSystemName: LPCWSTR, lpLuid: PVOID, lpName: LPWSTR, cchName: LPDWORD): BOOL {
    return Advapi32.Load('LookupPrivilegeNameW')(lpSystemName, lpLuid, lpName, cchName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lookupprivilegevaluea
  public static LookupPrivilegeValueA(lpSystemName: LPCSTR, lpName: LPCSTR, lpLuid: PVOID): BOOL {
    return Advapi32.Load('LookupPrivilegeValueA')(lpSystemName, lpName, lpLuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lookupprivilegevaluew
  public static LookupPrivilegeValueW(lpSystemName: LPCWSTR | NULL, lpName: LPCWSTR, lpLuid: PVOID): BOOL {
    return Advapi32.Load('LookupPrivilegeValueW')(lpSystemName, lpName, lpLuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-lookupsecuritydescriptorpartsa
  public static LookupSecurityDescriptorPartsA(pOwner: PVOID, pGroup: PVOID, cCountOfAccessEntries: PULONG, pListOfAccessEntries: PVOID, cCountOfAuditEntries: PULONG, pListOfAuditEntries: PVOID, pSD: PSECURITY_DESCRIPTOR): DWORD {
    return Advapi32.Load('LookupSecurityDescriptorPartsA')(pOwner, pGroup, cCountOfAccessEntries, pListOfAccessEntries, cCountOfAuditEntries, pListOfAuditEntries, pSD);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-lookupsecuritydescriptorpartsw
  public static LookupSecurityDescriptorPartsW(pOwner: PVOID, pGroup: PVOID, cCountOfAccessEntries: PULONG, pListOfAccessEntries: PVOID, cCountOfAuditEntries: PULONG, pListOfAuditEntries: PVOID, pSD: PSECURITY_DESCRIPTOR): DWORD {
    return Advapi32.Load('LookupSecurityDescriptorPartsW')(pOwner, pGroup, cCountOfAccessEntries, pListOfAccessEntries, cCountOfAuditEntries, pListOfAuditEntries, pSD);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaaddaccountrights
  public static LsaAddAccountRights(PolicyHandle: LSA_HANDLE, AccountSid: PSID, UserRights: PLSA_UNICODE_STRING, CountOfRights: ULONG): NTSTATUS {
    return Advapi32.Load('LsaAddAccountRights')(PolicyHandle, AccountSid, UserRights, CountOfRights);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsaaddprivilegestoaccount
  public static LsaAddPrivilegesToAccount(AccountHandle: LSA_HANDLE, Privileges: PVOID): NTSTATUS {
    return Advapi32.Load('LsaAddPrivilegesToAccount')(AccountHandle, Privileges);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsaclearauditlog
  public static LsaClearAuditLog(PolicyHandle: LSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaClearAuditLog')(PolicyHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaclose
  public static LsaClose(ObjectHandle: LSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaClose')(ObjectHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaconfigureautologoncredentials
  public static LsaConfigureAutoLogonCredentials(pvReserved: PVOID): NTSTATUS {
    return Advapi32.Load('LsaConfigureAutoLogonCredentials')(pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsacreateaccount
  public static LsaCreateAccount(PolicyHandle: LSA_HANDLE, AccountSid: PSID, DesiredAccess: ACCESS_MASK, AccountHandle: PLSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaCreateAccount')(PolicyHandle, AccountSid, DesiredAccess, AccountHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsacreatesecret
  public static LsaCreateSecret(PolicyHandle: LSA_HANDLE, SecretName: PLSA_UNICODE_STRING, DesiredAccess: ACCESS_MASK, SecretHandle: PLSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaCreateSecret')(PolicyHandle, SecretName, DesiredAccess, SecretHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsacreatetrusteddomain
  public static LsaCreateTrustedDomain(PolicyHandle: LSA_HANDLE, TrustedDomainInformation: PLSA_TRUST_INFORMATION, DesiredAccess: ACCESS_MASK, TrustedDomainHandle: PLSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaCreateTrustedDomain')(PolicyHandle, TrustedDomainInformation, DesiredAccess, TrustedDomainHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsacreatetrusteddomainex
  public static LsaCreateTrustedDomainEx(PolicyHandle: LSA_HANDLE, TrustedDomainInformation: PVOID, AuthenticationInformation: PVOID, DesiredAccess: ACCESS_MASK, TrustedDomainHandle: PLSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaCreateTrustedDomainEx')(PolicyHandle, TrustedDomainInformation, AuthenticationInformation, DesiredAccess, TrustedDomainHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsadelete
  public static LsaDelete(ObjectHandle: LSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaDelete')(ObjectHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsadeletetrusteddomain
  public static LsaDeleteTrustedDomain(PolicyHandle: LSA_HANDLE, TrustedDomainSid: PSID): NTSTATUS {
    return Advapi32.Load('LsaDeleteTrustedDomain')(PolicyHandle, TrustedDomainSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsadisableuserarso
  public static LsaDisableUserArso(PolicyHandle: LSA_HANDLE, UserSid: PSID): NTSTATUS {
    return Advapi32.Load('LsaDisableUserArso')(PolicyHandle, UserSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaenableuserarso
  public static LsaEnableUserArso(PolicyHandle: LSA_HANDLE, UserSid: PSID, CredData: PVOID, CredDataSize: ULONG): NTSTATUS {
    return Advapi32.Load('LsaEnableUserArso')(PolicyHandle, UserSid, CredData, CredDataSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaenumerateaccountrights
  public static LsaEnumerateAccountRights(PolicyHandle: LSA_HANDLE, AccountSid: PSID, UserRights: PVOID, CountOfRights: PULONG): NTSTATUS {
    return Advapi32.Load('LsaEnumerateAccountRights')(PolicyHandle, AccountSid, UserRights, CountOfRights);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsaenumerateaccounts
  public static LsaEnumerateAccounts(PolicyHandle: LSA_HANDLE, EnumerationContext: PVOID, Buffer: PVOID, PreferedMaximumLength: ULONG, CountReturned: PULONG): NTSTATUS {
    return Advapi32.Load('LsaEnumerateAccounts')(PolicyHandle, EnumerationContext, Buffer, PreferedMaximumLength, CountReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaenumerateaccountswithuserright
  public static LsaEnumerateAccountsWithUserRight(PolicyHandle: LSA_HANDLE, UserRight: PLSA_UNICODE_STRING, Buffer: PVOID, CountReturned: PULONG): NTSTATUS {
    return Advapi32.Load('LsaEnumerateAccountsWithUserRight')(PolicyHandle, UserRight, Buffer, CountReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsaenumerateprivileges
  public static LsaEnumeratePrivileges(PolicyHandle: LSA_HANDLE, EnumerationContext: PVOID, Buffer: PVOID, PreferedMaximumLength: ULONG, CountReturned: PULONG): NTSTATUS {
    return Advapi32.Load('LsaEnumeratePrivileges')(PolicyHandle, EnumerationContext, Buffer, PreferedMaximumLength, CountReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsaenumerateprivilegesofaccount
  public static LsaEnumeratePrivilegesOfAccount(AccountHandle: LSA_HANDLE, Privileges: PVOID): NTSTATUS {
    return Advapi32.Load('LsaEnumeratePrivilegesOfAccount')(AccountHandle, Privileges);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaenumeratetrusteddomains
  public static LsaEnumerateTrustedDomains(PolicyHandle: LSA_HANDLE, EnumerationContext: PVOID, Buffer: PVOID, PreferedMaximumLength: ULONG, CountReturned: PULONG): NTSTATUS {
    return Advapi32.Load('LsaEnumerateTrustedDomains')(PolicyHandle, EnumerationContext, Buffer, PreferedMaximumLength, CountReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaenumeratetrusteddomainsex
  public static LsaEnumerateTrustedDomainsEx(PolicyHandle: LSA_HANDLE, EnumerationContext: PVOID, Buffer: PVOID, PreferedMaximumLength: ULONG, CountReturned: PULONG): NTSTATUS {
    return Advapi32.Load('LsaEnumerateTrustedDomainsEx')(PolicyHandle, EnumerationContext, Buffer, PreferedMaximumLength, CountReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsafreememory
  public static LsaFreeMemory(Buffer: PVOID): NTSTATUS {
    return Advapi32.Load('LsaFreeMemory')(Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsagetappliedcapids
  public static LsaGetAppliedCAPIDs(SystemName: PLSA_UNICODE_STRING, CAPIDs: PVOID, CAPIDCount: PULONG): NTSTATUS {
    return Advapi32.Load('LsaGetAppliedCAPIDs')(SystemName, CAPIDs, CAPIDCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsagetdeviceregistrationinfo
  public static LsaGetDeviceRegistrationInfo(InformationClass: DWORD, ppDeviceInfo: PVOID): NTSTATUS {
    return Advapi32.Load('LsaGetDeviceRegistrationInfo')(InformationClass, ppDeviceInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsagetquotasforaccount
  public static LsaGetQuotasForAccount(AccountHandle: LSA_HANDLE, QuotaLimits: PVOID): NTSTATUS {
    return Advapi32.Load('LsaGetQuotasForAccount')(AccountHandle, QuotaLimits);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsagetremoteusername
  public static LsaGetRemoteUserName(SystemName: PLSA_UNICODE_STRING, UserName: PVOID, DomainName: PVOID): NTSTATUS {
    return Advapi32.Load('LsaGetRemoteUserName')(SystemName, UserName, DomainName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsagetsystemaccessaccount
  public static LsaGetSystemAccessAccount(AccountHandle: LSA_HANDLE, SystemAccess: PULONG): NTSTATUS {
    return Advapi32.Load('LsaGetSystemAccessAccount')(AccountHandle, SystemAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsagetusername
  public static LsaGetUserName(UserName: PVOID, DomainName: PVOID): NTSTATUS {
    return Advapi32.Load('LsaGetUserName')(UserName, DomainName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaiclookupnames
  public static LsaICLookupNames(PolicyHandle: LSA_HANDLE, Count: ULONG, Names: PLSA_UNICODE_STRING, ReferencedDomains: PVOID, Sids: PVOID, LookupLevel: DWORD, MappedCount: PULONG, LookupOptions: DWORD): NTSTATUS {
    return Advapi32.Load('LsaICLookupNames')(PolicyHandle, Count, Names, ReferencedDomains, Sids, LookupLevel, MappedCount, LookupOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaiclookupnameswithcreds
  public static LsaICLookupNamesWithCreds(ServerName: PVOID, Count: ULONG, Names: PLSA_UNICODE_STRING, ReferencedDomains: PVOID, Sids: PVOID, LookupLevel: DWORD, MappedCount: PULONG, LookupOptions: DWORD): NTSTATUS {
    return Advapi32.Load('LsaICLookupNamesWithCreds')(ServerName, Count, Names, ReferencedDomains, Sids, LookupLevel, MappedCount, LookupOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaiclookupsids
  public static LsaICLookupSids(PolicyHandle: LSA_HANDLE, Count: ULONG, Sids: PVOID, ReferencedDomains: PVOID, Names: PVOID, LookupLevel: DWORD, MappedCount: PULONG, LookupOptions: DWORD): NTSTATUS {
    return Advapi32.Load('LsaICLookupSids')(PolicyHandle, Count, Sids, ReferencedDomains, Names, LookupLevel, MappedCount, LookupOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaiclookupsidswithcreds
  public static LsaICLookupSidsWithCreds(ServerName: PVOID, Count: ULONG, Sids: PVOID, ReferencedDomains: PVOID, Names: PVOID, LookupLevel: DWORD, MappedCount: PULONG, LookupOptions: DWORD): NTSTATUS {
    return Advapi32.Load('LsaICLookupSidsWithCreds')(ServerName, Count, Sids, ReferencedDomains, Names, LookupLevel, MappedCount, LookupOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsainvoketrustscanner
  public static LsaInvokeTrustScanner(PolicyHandle: LSA_HANDLE, pvReserved: PVOID): NTSTATUS {
    return Advapi32.Load('LsaInvokeTrustScanner')(PolicyHandle, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaisuserarsoallowed
  public static LsaIsUserArsoAllowed(PolicyHandle: LSA_HANDLE, UserSid: PSID, pbAllowed: PVOID): NTSTATUS {
    return Advapi32.Load('LsaIsUserArsoAllowed')(PolicyHandle, UserSid, pbAllowed);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaisuserarsoenabled
  public static LsaIsUserArsoEnabled(PolicyHandle: LSA_HANDLE, UserSid: PSID, pbEnabled: PVOID): NTSTATUS {
    return Advapi32.Load('LsaIsUserArsoEnabled')(PolicyHandle, UserSid, pbEnabled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsalookupnames
  public static LsaLookupNames(PolicyHandle: LSA_HANDLE, Count: ULONG, Names: PLSA_UNICODE_STRING, ReferencedDomains: PVOID, Sids: PVOID): NTSTATUS {
    return Advapi32.Load('LsaLookupNames')(PolicyHandle, Count, Names, ReferencedDomains, Sids);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsalookupnames2
  public static LsaLookupNames2(PolicyHandle: LSA_HANDLE, Flags: ULONG, Count: ULONG, Names: PLSA_UNICODE_STRING, ReferencedDomains: PVOID, Sids: PVOID): NTSTATUS {
    return Advapi32.Load('LsaLookupNames2')(PolicyHandle, Flags, Count, Names, ReferencedDomains, Sids);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsalookupprivilegedisplayname
  public static LsaLookupPrivilegeDisplayName(PolicyHandle: LSA_HANDLE, Name: PLSA_UNICODE_STRING, DisplayName: PVOID, LanguageReturned: PVOID): NTSTATUS {
    return Advapi32.Load('LsaLookupPrivilegeDisplayName')(PolicyHandle, Name, DisplayName, LanguageReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsalookupprivilegename
  public static LsaLookupPrivilegeName(PolicyHandle: LSA_HANDLE, Value: PVOID, Name: PVOID): NTSTATUS {
    return Advapi32.Load('LsaLookupPrivilegeName')(PolicyHandle, Value, Name);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsalookupprivilegevalue
  public static LsaLookupPrivilegeValue(PolicyHandle: LSA_HANDLE, Name: PLSA_UNICODE_STRING, Value: PVOID): NTSTATUS {
    return Advapi32.Load('LsaLookupPrivilegeValue')(PolicyHandle, Name, Value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsalookupsids
  public static LsaLookupSids(PolicyHandle: LSA_HANDLE, Count: ULONG, Sids: PVOID, ReferencedDomains: PVOID, Names: PVOID): NTSTATUS {
    return Advapi32.Load('LsaLookupSids')(PolicyHandle, Count, Sids, ReferencedDomains, Names);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsalookupsids2
  public static LsaLookupSids2(PolicyHandle: LSA_HANDLE, LookupOptions: ULONG, Count: ULONG, Sids: PVOID, ReferencedDomains: PVOID, Names: PVOID): NTSTATUS {
    return Advapi32.Load('LsaLookupSids2')(PolicyHandle, LookupOptions, Count, Sids, ReferencedDomains, Names);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsamanagesidnamemapping
  public static LsaManageSidNameMapping(OperationType: DWORD, OperationInput: PVOID, OperationOutput: PVOID): NTSTATUS {
    return Advapi32.Load('LsaManageSidNameMapping')(OperationType, OperationInput, OperationOutput);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsantstatustowinerror
  public static LsaNtStatusToWinError(Status: NTSTATUS): ULONG {
    return Advapi32.Load('LsaNtStatusToWinError')(Status);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsaopenaccount
  public static LsaOpenAccount(PolicyHandle: LSA_HANDLE, AccountSid: PSID, DesiredAccess: ACCESS_MASK, AccountHandle: PLSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaOpenAccount')(PolicyHandle, AccountSid, DesiredAccess, AccountHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaopenpolicy
  public static LsaOpenPolicy(SystemName: PLSA_UNICODE_STRING, ObjectAttributes: PLSA_OBJECT_ATTRIBUTES, DesiredAccess: ACCESS_MASK, PolicyHandle: PLSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaOpenPolicy')(SystemName, ObjectAttributes, DesiredAccess, PolicyHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaopenpolicysce
  public static LsaOpenPolicySce(SystemName: PLSA_UNICODE_STRING, ObjectAttributes: PLSA_OBJECT_ATTRIBUTES, DesiredAccess: ACCESS_MASK, PolicyHandle: PLSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaOpenPolicySce')(SystemName, ObjectAttributes, DesiredAccess, PolicyHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsaopensecret
  public static LsaOpenSecret(PolicyHandle: LSA_HANDLE, SecretName: PLSA_UNICODE_STRING, DesiredAccess: ACCESS_MASK, SecretHandle: PLSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaOpenSecret')(PolicyHandle, SecretName, DesiredAccess, SecretHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaopentrusteddomain
  public static LsaOpenTrustedDomain(PolicyHandle: LSA_HANDLE, TrustedDomainSid: PSID, DesiredAccess: ACCESS_MASK, TrustedDomainHandle: PLSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaOpenTrustedDomain')(PolicyHandle, TrustedDomainSid, DesiredAccess, TrustedDomainHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaopentrusteddomainbyname
  public static LsaOpenTrustedDomainByName(PolicyHandle: LSA_HANDLE, TrustedDomainName: PLSA_UNICODE_STRING, DesiredAccess: ACCESS_MASK, TrustedDomainHandle: PLSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaOpenTrustedDomainByName')(PolicyHandle, TrustedDomainName, DesiredAccess, TrustedDomainHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaprofiledeleted
  public static LsaProfileDeleted(PolicyHandle: LSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaProfileDeleted')(PolicyHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsapurgelocalsystemaccesstable
  public static LsaPurgeLocalSystemAccessTable(PolicyHandle: LSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaPurgeLocalSystemAccessTable')(PolicyHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaquerycaps
  public static LsaQueryCAPs(CAPIDs: PVOID, CAPIDCount: ULONG, CAPs: PVOID, CAPCount: PULONG): NTSTATUS {
    return Advapi32.Load('LsaQueryCAPs')(CAPIDs, CAPIDCount, CAPs, CAPCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaquerydomaininformationpolicy
  public static LsaQueryDomainInformationPolicy(PolicyHandle: LSA_HANDLE, InformationClass: DWORD, Buffer: PVOID): NTSTATUS {
    return Advapi32.Load('LsaQueryDomainInformationPolicy')(PolicyHandle, InformationClass, Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaqueryforesttrustinformation
  public static LsaQueryForestTrustInformation(PolicyHandle: LSA_HANDLE, TrustedDomainName: PLSA_UNICODE_STRING, ForestTrustInfo: PVOID): NTSTATUS {
    return Advapi32.Load('LsaQueryForestTrustInformation')(PolicyHandle, TrustedDomainName, ForestTrustInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaqueryforesttrustinformation2
  public static LsaQueryForestTrustInformation2(PolicyHandle: LSA_HANDLE, TrustedDomainName: PLSA_UNICODE_STRING, HighestRecordType: DWORD, ForestTrustInfo: PVOID): NTSTATUS {
    return Advapi32.Load('LsaQueryForestTrustInformation2')(PolicyHandle, TrustedDomainName, HighestRecordType, ForestTrustInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaqueryinfotrusteddomain
  public static LsaQueryInfoTrustedDomain(TrustedDomainHandle: LSA_HANDLE, InformationClass: DWORD, Buffer: PVOID): NTSTATUS {
    return Advapi32.Load('LsaQueryInfoTrustedDomain')(TrustedDomainHandle, InformationClass, Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaqueryinformationpolicy
  public static LsaQueryInformationPolicy(PolicyHandle: LSA_HANDLE, InformationClass: DWORD, Buffer: PVOID): NTSTATUS {
    return Advapi32.Load('LsaQueryInformationPolicy')(PolicyHandle, InformationClass, Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsaquerylocalsystemaccess
  public static LsaQueryLocalSystemAccess(AccountHandle: LSA_HANDLE, SystemAccess: PULONG): NTSTATUS {
    return Advapi32.Load('LsaQueryLocalSystemAccess')(AccountHandle, SystemAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsaquerylocalsystemaccessall
  public static LsaQueryLocalSystemAccessAll(PolicyHandle: LSA_HANDLE, SystemAccess: PULONG): NTSTATUS {
    return Advapi32.Load('LsaQueryLocalSystemAccessAll')(PolicyHandle, SystemAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsaquerysecret
  public static LsaQuerySecret(SecretHandle: LSA_HANDLE, CurrentValue: PVOID, CurrentValueSetTime: PVOID, OldValue: PVOID, OldValueSetTime: PVOID): NTSTATUS {
    return Advapi32.Load('LsaQuerySecret')(SecretHandle, CurrentValue, CurrentValueSetTime, OldValue, OldValueSetTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsaquerysecurityobject
  public static LsaQuerySecurityObject(ObjectHandle: LSA_HANDLE, SecurityInformation: SECURITY_INFORMATION, SecurityDescriptor: PVOID): NTSTATUS {
    return Advapi32.Load('LsaQuerySecurityObject')(ObjectHandle, SecurityInformation, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaquerytrusteddomaininfo
  public static LsaQueryTrustedDomainInfo(PolicyHandle: LSA_HANDLE, TrustedDomainSid: PSID, InformationClass: DWORD, Buffer: PVOID): NTSTATUS {
    return Advapi32.Load('LsaQueryTrustedDomainInfo')(PolicyHandle, TrustedDomainSid, InformationClass, Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaquerytrusteddomaininfobyname
  public static LsaQueryTrustedDomainInfoByName(PolicyHandle: LSA_HANDLE, TrustedDomainName: PLSA_UNICODE_STRING, InformationClass: DWORD, Buffer: PVOID): NTSTATUS {
    return Advapi32.Load('LsaQueryTrustedDomainInfoByName')(PolicyHandle, TrustedDomainName, InformationClass, Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaremoveaccountrights
  public static LsaRemoveAccountRights(PolicyHandle: LSA_HANDLE, AccountSid: PSID, AllRights: BOOL, UserRights: PLSA_UNICODE_STRING, CountOfRights: ULONG): NTSTATUS {
    return Advapi32.Load('LsaRemoveAccountRights')(PolicyHandle, AccountSid, AllRights, UserRights, CountOfRights);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsaremoveprivilegesfromaccount
  public static LsaRemovePrivilegesFromAccount(AccountHandle: LSA_HANDLE, AllPrivileges: BOOL, Privileges: PVOID): NTSTATUS {
    return Advapi32.Load('LsaRemovePrivilegesFromAccount')(AccountHandle, AllPrivileges, Privileges);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaretrieveprivatedata
  public static LsaRetrievePrivateData(PolicyHandle: LSA_HANDLE, KeyName: PLSA_UNICODE_STRING, PrivateData: PVOID): NTSTATUS {
    return Advapi32.Load('LsaRetrievePrivateData')(PolicyHandle, KeyName, PrivateData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsasetcaps
  public static LsaSetCAPs(CAPIDs: PVOID, CAPIDCount: ULONG, Flags: DWORD): NTSTATUS {
    return Advapi32.Load('LsaSetCAPs')(CAPIDs, CAPIDCount, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsasetdomaininformationpolicy
  public static LsaSetDomainInformationPolicy(PolicyHandle: LSA_HANDLE, InformationClass: DWORD, Buffer: PVOID): NTSTATUS {
    return Advapi32.Load('LsaSetDomainInformationPolicy')(PolicyHandle, InformationClass, Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsasetforesttrustinformation
  public static LsaSetForestTrustInformation(PolicyHandle: LSA_HANDLE, TrustedDomainName: PLSA_UNICODE_STRING, ForestTrustInfo: PVOID, CheckOnly: BOOL, CollisionInfo: PVOID): NTSTATUS {
    return Advapi32.Load('LsaSetForestTrustInformation')(PolicyHandle, TrustedDomainName, ForestTrustInfo, CheckOnly, CollisionInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsasetforesttrustinformation2
  public static LsaSetForestTrustInformation2(PolicyHandle: LSA_HANDLE, TrustedDomainName: PLSA_UNICODE_STRING, HighestRecordType: DWORD, ForestTrustInfo: PVOID, CheckOnly: BOOL, CollisionInfo: PVOID): NTSTATUS {
    return Advapi32.Load('LsaSetForestTrustInformation2')(PolicyHandle, TrustedDomainName, HighestRecordType, ForestTrustInfo, CheckOnly, CollisionInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsasetinformationpolicy
  public static LsaSetInformationPolicy(PolicyHandle: LSA_HANDLE, InformationClass: DWORD, Buffer: PVOID): NTSTATUS {
    return Advapi32.Load('LsaSetInformationPolicy')(PolicyHandle, InformationClass, Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsasetinformationtrusteddomain
  public static LsaSetInformationTrustedDomain(TrustedDomainHandle: LSA_HANDLE, InformationClass: DWORD, Buffer: PVOID): NTSTATUS {
    return Advapi32.Load('LsaSetInformationTrustedDomain')(TrustedDomainHandle, InformationClass, Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsasetlocalsystemaccess
  public static LsaSetLocalSystemAccess(AccountHandle: LSA_HANDLE, SystemAccess: ULONG): NTSTATUS {
    return Advapi32.Load('LsaSetLocalSystemAccess')(AccountHandle, SystemAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsasetquotasforaccount
  public static LsaSetQuotasForAccount(AccountHandle: LSA_HANDLE, QuotaLimits: PVOID): NTSTATUS {
    return Advapi32.Load('LsaSetQuotasForAccount')(AccountHandle, QuotaLimits);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsasetsecret
  public static LsaSetSecret(SecretHandle: LSA_HANDLE, CurrentValue: PLSA_UNICODE_STRING, OldValue: PLSA_UNICODE_STRING): NTSTATUS {
    return Advapi32.Load('LsaSetSecret')(SecretHandle, CurrentValue, OldValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsasetsecurityobject
  public static LsaSetSecurityObject(ObjectHandle: LSA_HANDLE, SecurityInformation: SECURITY_INFORMATION, SecurityDescriptor: PSECURITY_DESCRIPTOR): NTSTATUS {
    return Advapi32.Load('LsaSetSecurityObject')(ObjectHandle, SecurityInformation, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsasetsystemaccessaccount
  public static LsaSetSystemAccessAccount(AccountHandle: LSA_HANDLE, SystemAccess: ULONG): NTSTATUS {
    return Advapi32.Load('LsaSetSystemAccessAccount')(AccountHandle, SystemAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsasettrusteddomaininfobyname
  public static LsaSetTrustedDomainInfoByName(PolicyHandle: LSA_HANDLE, TrustedDomainName: PLSA_UNICODE_STRING, InformationClass: DWORD, Buffer: PVOID): NTSTATUS {
    return Advapi32.Load('LsaSetTrustedDomainInfoByName')(PolicyHandle, TrustedDomainName, InformationClass, Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsasettrusteddomaininformation
  public static LsaSetTrustedDomainInformation(PolicyHandle: LSA_HANDLE, TrustedDomainSid: PSID, InformationClass: DWORD, Buffer: PVOID): NTSTATUS {
    return Advapi32.Load('LsaSetTrustedDomainInformation')(PolicyHandle, TrustedDomainSid, InformationClass, Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsastoreprivatedata
  public static LsaStorePrivateData(PolicyHandle: LSA_HANDLE, KeyName: PLSA_UNICODE_STRING, PrivateData: PLSA_UNICODE_STRING): NTSTATUS {
    return Advapi32.Load('LsaStorePrivateData')(PolicyHandle, KeyName, PrivateData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsavalidateprocuniqueluid
  public static LsaValidateProcUniqueLuid(): NTSTATUS {
    return Advapi32.Load('LsaValidateProcUniqueLuid')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/rpcndr/nf-rpcndr-midl_user_free_ext
  public static MIDL_user_free_Ext(pMem: PVOID): VOID {
    return Advapi32.Load('MIDL_user_free_Ext')(pMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mschapp/nf-mschapp-mschapsrvchangepassword
  public static MSChapSrvChangePassword(ServerName: LPWSTR, UserName: LPWSTR, LmOldOwfPassword: BOOL, LmOldOwfPasswordData: PVOID, LmNewOwfPasswordData: PVOID, NtNewOwfPasswordData: PVOID): DWORD {
    return Advapi32.Load('MSChapSrvChangePassword')(ServerName, UserName, LmOldOwfPassword, LmOldOwfPasswordData, LmNewOwfPasswordData, NtNewOwfPasswordData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mschapp/nf-mschapp-mschapsrvchangepassword2
  public static MSChapSrvChangePassword2(ServerName: LPWSTR, UserName: LPWSTR, NewPasswordEncryptedWithOldNtOwf: PVOID, OldNtOwfPasswordEncryptedWithNewNtOwf: PVOID, LmPresent: BOOL, NewPasswordEncryptedWithOldLmOwf: PVOID, OldLmOwfPasswordEncryptedWithNewLmNtOwf: PVOID): DWORD {
    return Advapi32.Load('MSChapSrvChangePassword2')(ServerName, UserName, NewPasswordEncryptedWithOldNtOwf, OldNtOwfPasswordEncryptedWithNewNtOwf, LmPresent, NewPasswordEncryptedWithOldLmOwf, OldLmOwfPasswordEncryptedWithNewLmNtOwf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-makeabsolutesd
  public static MakeAbsoluteSD(pSelfRelativeSD: PSECURITY_DESCRIPTOR, pAbsoluteSD: PSECURITY_DESCRIPTOR, lpdwAbsoluteSDSize: LPDWORD, pDacl: PACL, lpdwDaclSize: LPDWORD, pSacl: PACL, lpdwSaclSize: LPDWORD, pOwner: PSID, lpdwOwnerSize: LPDWORD, pPrimaryGroup: PSID, lpdwPrimaryGroupSize: LPDWORD): BOOL {
    return Advapi32.Load('MakeAbsoluteSD')(pSelfRelativeSD, pAbsoluteSD, lpdwAbsoluteSDSize, pDacl, lpdwDaclSize, pSacl, lpdwSaclSize, pOwner, lpdwOwnerSize, pPrimaryGroup, lpdwPrimaryGroupSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-makeabsolutesd2
  public static MakeAbsoluteSD2(pSelfRelativeSecurityDescriptor: PSECURITY_DESCRIPTOR, lpdwBufferSize: LPDWORD): BOOL {
    return Advapi32.Load('MakeAbsoluteSD2')(pSelfRelativeSecurityDescriptor, lpdwBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-makeselfrelativesd
  public static MakeSelfRelativeSD(pAbsoluteSD: PSECURITY_DESCRIPTOR, pSelfRelativeSD: PSECURITY_DESCRIPTOR, lpdwBufferLength: LPDWORD): BOOL {
    return Advapi32.Load('MakeSelfRelativeSD')(pAbsoluteSD, pSelfRelativeSD, lpdwBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-mapgenericmask
  public static MapGenericMask(AccessMask: LPDWORD, GenericMapping: PGENERIC_MAPPING): VOID {
    return Advapi32.Load('MapGenericMask')(AccessMask, GenericMapping);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-notifybootconfigstatus
  public static NotifyBootConfigStatus(BootAcceptable: BOOL): BOOL {
    return Advapi32.Load('NotifyBootConfigStatus')(BootAcceptable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-notifychangeeventlog
  public static NotifyChangeEventLog(hEventLog: HANDLE, hEvent: HANDLE): BOOL {
    return Advapi32.Load('NotifyChangeEventLog')(hEventLog, hEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-notifyservicestatuschange
  public static NotifyServiceStatusChange(hService: SC_HANDLE, dwNotifyMask: DWORD, pNotifyBuffer: PVOID): DWORD {
    return Advapi32.Load('NotifyServiceStatusChange')(hService, dwNotifyMask, pNotifyBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-notifyservicestatuschangea
  public static NotifyServiceStatusChangeA(hService: SC_HANDLE, dwNotifyMask: DWORD, pNotifyBuffer: PVOID): DWORD {
    return Advapi32.Load('NotifyServiceStatusChangeA')(hService, dwNotifyMask, pNotifyBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-notifyservicestatuschangew
  public static NotifyServiceStatusChangeW(hService: SC_HANDLE, dwNotifyMask: DWORD, pNotifyBuffer: PVOID): DWORD {
    return Advapi32.Load('NotifyServiceStatusChangeW')(hService, dwNotifyMask, pNotifyBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-npgetusername
  public static NpGetUserName(pUserName: PVOID, pcbUserName: LPDWORD): BOOL {
    return Advapi32.Load('NpGetUserName')(pUserName, pcbUserName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-objectcloseauditalarma
  public static ObjectCloseAuditAlarmA(SubsystemName: LPCSTR, HandleId: LPVOID, GenerateOnClose: BOOL): BOOL {
    return Advapi32.Load('ObjectCloseAuditAlarmA')(SubsystemName, HandleId, GenerateOnClose);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-objectcloseauditalarmw
  public static ObjectCloseAuditAlarmW(SubsystemName: LPCWSTR, HandleId: LPVOID, GenerateOnClose: BOOL): BOOL {
    return Advapi32.Load('ObjectCloseAuditAlarmW')(SubsystemName, HandleId, GenerateOnClose);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-objectdeleteauditalarma
  public static ObjectDeleteAuditAlarmA(SubsystemName: LPCSTR, HandleId: LPVOID, GenerateOnClose: BOOL): BOOL {
    return Advapi32.Load('ObjectDeleteAuditAlarmA')(SubsystemName, HandleId, GenerateOnClose);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-objectdeleteauditalarmw
  public static ObjectDeleteAuditAlarmW(SubsystemName: LPCWSTR, HandleId: LPVOID, GenerateOnClose: BOOL): BOOL {
    return Advapi32.Load('ObjectDeleteAuditAlarmW')(SubsystemName, HandleId, GenerateOnClose);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-objectopenauditalarma
  public static ObjectOpenAuditAlarmA(SubsystemName: LPCSTR, HandleId: LPVOID, ObjectTypeName: LPSTR, ObjectName: LPSTR, pSecurityDescriptor: PSECURITY_DESCRIPTOR, ClientToken: HANDLE, DesiredAccess: DWORD, GrantedAccess: DWORD, Privileges: PPRIVILEGE_SET, ObjectCreation: BOOL, AccessGranted: BOOL, GenerateOnClose: LPBOOL): BOOL {
    return Advapi32.Load('ObjectOpenAuditAlarmA')(SubsystemName, HandleId, ObjectTypeName, ObjectName, pSecurityDescriptor, ClientToken, DesiredAccess, GrantedAccess, Privileges, ObjectCreation, AccessGranted, GenerateOnClose);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-objectopenauditalarmw
  public static ObjectOpenAuditAlarmW(SubsystemName: LPCWSTR, HandleId: LPVOID, ObjectTypeName: LPWSTR, ObjectName: LPWSTR, pSecurityDescriptor: PSECURITY_DESCRIPTOR, ClientToken: HANDLE, DesiredAccess: DWORD, GrantedAccess: DWORD, Privileges: PPRIVILEGE_SET, ObjectCreation: BOOL, AccessGranted: BOOL, GenerateOnClose: LPBOOL): BOOL {
    return Advapi32.Load('ObjectOpenAuditAlarmW')(SubsystemName, HandleId, ObjectTypeName, ObjectName, pSecurityDescriptor, ClientToken, DesiredAccess, GrantedAccess, Privileges, ObjectCreation, AccessGranted, GenerateOnClose);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-objectprivilegeauditalarma
  public static ObjectPrivilegeAuditAlarmA(SubsystemName: LPCSTR, HandleId: LPVOID, ClientToken: HANDLE, DesiredAccess: DWORD, Privileges: PPRIVILEGE_SET, AccessGranted: BOOL): BOOL {
    return Advapi32.Load('ObjectPrivilegeAuditAlarmA')(SubsystemName, HandleId, ClientToken, DesiredAccess, Privileges, AccessGranted);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-objectprivilegeauditalarmw
  public static ObjectPrivilegeAuditAlarmW(SubsystemName: LPCWSTR, HandleId: LPVOID, ClientToken: HANDLE, DesiredAccess: DWORD, Privileges: PPRIVILEGE_SET, AccessGranted: BOOL): BOOL {
    return Advapi32.Load('ObjectPrivilegeAuditAlarmW')(SubsystemName, HandleId, ClientToken, DesiredAccess, Privileges, AccessGranted);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-openbackupeventloga
  public static OpenBackupEventLogA(lpUNCServerName: LPCSTR, lpFileName: LPCSTR): HANDLE {
    return Advapi32.Load('OpenBackupEventLogA')(lpUNCServerName, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-openbackupeventlogw
  public static OpenBackupEventLogW(lpUNCServerName: LPCWSTR, lpFileName: LPCWSTR): HANDLE {
    return Advapi32.Load('OpenBackupEventLogW')(lpUNCServerName, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-openencryptedfilerawa
  public static OpenEncryptedFileRawA(lpFileName: LPCSTR, ulFlags: ULONG, pvContext: PVOID): DWORD {
    return Advapi32.Load('OpenEncryptedFileRawA')(lpFileName, ulFlags, pvContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-openencryptedfileraww
  public static OpenEncryptedFileRawW(lpFileName: LPCWSTR, ulFlags: ULONG, pvContext: PVOID): DWORD {
    return Advapi32.Load('OpenEncryptedFileRawW')(lpFileName, ulFlags, pvContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-openeventloga
  public static OpenEventLogA(lpUNCServerName: LPCSTR, lpSourceName: LPCSTR): HANDLE {
    return Advapi32.Load('OpenEventLogA')(lpUNCServerName, lpSourceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-openeventlogw
  public static OpenEventLogW(lpUNCServerName: LPCWSTR, lpSourceName: LPCWSTR): HANDLE {
    return Advapi32.Load('OpenEventLogW')(lpUNCServerName, lpSourceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-openprocesstoken
  public static OpenProcessToken(ProcessHandle: HANDLE, DesiredAccess: DWORD, TokenHandle: PHANDLE): BOOL {
    return Advapi32.Load('OpenProcessToken')(ProcessHandle, DesiredAccess, TokenHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-openscmanagera
  public static OpenSCManagerA(lpMachineName: LPCSTR, lpDatabaseName: LPCSTR, dwDesiredAccess: DWORD): SC_HANDLE {
    return Advapi32.Load('OpenSCManagerA')(lpMachineName, lpDatabaseName, dwDesiredAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-openscmanagerw
  public static OpenSCManagerW(lpMachineName: LPCWSTR, lpDatabaseName: LPCWSTR, dwDesiredAccess: DWORD): SC_HANDLE {
    return Advapi32.Load('OpenSCManagerW')(lpMachineName, lpDatabaseName, dwDesiredAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-openservicea
  public static OpenServiceA(hSCManager: SC_HANDLE, lpServiceName: LPCSTR, dwDesiredAccess: DWORD): SC_HANDLE {
    return Advapi32.Load('OpenServiceA')(hSCManager, lpServiceName, dwDesiredAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-openservicew
  public static OpenServiceW(hSCManager: SC_HANDLE, lpServiceName: LPCWSTR, dwDesiredAccess: DWORD): SC_HANDLE {
    return Advapi32.Load('OpenServiceW')(hSCManager, lpServiceName, dwDesiredAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-openthreadtoken
  public static OpenThreadToken(ThreadHandle: HANDLE, DesiredAccess: DWORD, OpenAsSelf: BOOL, TokenHandle: PHANDLE): BOOL {
    return Advapi32.Load('OpenThreadToken')(ThreadHandle, DesiredAccess, OpenAsSelf, TokenHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wct/nf-wct-openthreadwaitchainsession
  public static OpenThreadWaitChainSession(Flags: ULONG, callback: PVOID): HWCT {
    return Advapi32.Load('OpenThreadWaitChainSession')(Flags, callback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-opentracea
  public static OpenTraceA(Logfile: PVOID): TRACEHANDLE {
    return Advapi32.Load('OpenTraceA')(Logfile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-opentracew
  public static OpenTraceW(Logfile: PVOID): TRACEHANDLE {
    return Advapi32.Load('OpenTraceW')(Logfile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-operationend
  public static OperationEnd(OperationEndParams: PVOID): BOOL {
    return Advapi32.Load('OperationEnd')(OperationEndParams);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-operationstart
  public static OperationStart(OperationStartParams: PVOID): BOOL {
    return Advapi32.Load('OperationStart')(OperationStartParams);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/perflib/nf-perflib-perfaddcounters
  public static PerfAddCounters(hQuery: HANDLE, pCounters: PVOID, cbCounters: DWORD): ULONG {
    return Advapi32.Load('PerfAddCounters')(hQuery, pCounters, cbCounters);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/perflib/nf-perflib-perfclosequeryhandle
  public static PerfCloseQueryHandle(hQuery: HANDLE): ULONG {
    return Advapi32.Load('PerfCloseQueryHandle')(hQuery);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/perflib/nf-perflib-perfdeletecounters
  public static PerfDeleteCounters(hQuery: HANDLE, pCounters: PVOID, cbCounters: DWORD): ULONG {
    return Advapi32.Load('PerfDeleteCounters')(hQuery, pCounters, cbCounters);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/perflib/nf-perflib-perfenumeratecounterset
  public static PerfEnumerateCounterSet(szMachine: LPCWSTR, pCounterSetIds: PVOID, cCounterSetIds: DWORD, pcCounterSetIdsActual: LPDWORD): ULONG {
    return Advapi32.Load('PerfEnumerateCounterSet')(szMachine, pCounterSetIds, cCounterSetIds, pcCounterSetIdsActual);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/perflib/nf-perflib-perfenumeratecountersetinstances
  public static PerfEnumerateCounterSetInstances(szMachine: LPCWSTR, pCounterSetId: PVOID, pInstances: PVOID, cbInstances: DWORD, pcbInstancesActual: LPDWORD): ULONG {
    return Advapi32.Load('PerfEnumerateCounterSetInstances')(szMachine, pCounterSetId, pInstances, cbInstances, pcbInstancesActual);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/perflib/nf-perflib-perfopenqueryhandle
  public static PerfOpenQueryHandle(szMachine: LPCWSTR, phQuery: PHANDLE): ULONG {
    return Advapi32.Load('PerfOpenQueryHandle')(szMachine, phQuery);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/perflib/nf-perflib-perfquerycounterdata
  public static PerfQueryCounterData(hQuery: HANDLE, pCounterBlock: PVOID, cbCounterBlock: DWORD, pcbCounterBlockActual: LPDWORD): ULONG {
    return Advapi32.Load('PerfQueryCounterData')(hQuery, pCounterBlock, cbCounterBlock, pcbCounterBlockActual);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/perflib/nf-perflib-perfquerycounterinfo
  public static PerfQueryCounterInfo(hQuery: HANDLE, pCounters: PVOID, cbCounters: DWORD, pcbCountersActual: LPDWORD): ULONG {
    return Advapi32.Load('PerfQueryCounterInfo')(hQuery, pCounters, cbCounters, pcbCountersActual);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/perflib/nf-perflib-perfquerycountersetregistrationinfo
  public static PerfQueryCounterSetRegistrationInfo(szMachine: LPCWSTR, pCounterSetId: PVOID, requestCode: DWORD, requestLangId: DWORD, pbRegInfo: PVOID, cbRegInfo: DWORD, pcbRegInfoActual: LPDWORD): ULONG {
    return Advapi32.Load('PerfQueryCounterSetRegistrationInfo')(szMachine, pCounterSetId, requestCode, requestLangId, pbRegInfo, cbRegInfo, pcbRegInfoActual);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-perfregclosekey
  public static PerfRegCloseKey(hKey: PVOID): LSTATUS {
    return Advapi32.Load('PerfRegCloseKey')(hKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-perfregenumkey
  public static PerfRegEnumKey(hKey: PVOID, dwIndex: DWORD, lpName: PVOID, lpcchName: LPDWORD, lpReserved: LPDWORD, lpClass: PVOID, lpcchClass: LPDWORD, lpftLastWriteTime: PVOID): LSTATUS {
    return Advapi32.Load('PerfRegEnumKey')(hKey, dwIndex, lpName, lpcchName, lpReserved, lpClass, lpcchClass, lpftLastWriteTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-perfregenumvalue
  public static PerfRegEnumValue(hKey: PVOID, dwIndex: DWORD, lpValueName: PVOID, lpcchValueName: LPDWORD, lpReserved: LPDWORD, lpType: LPDWORD, lpData: PVOID, lpcbData: LPDWORD): LSTATUS {
    return Advapi32.Load('PerfRegEnumValue')(hKey, dwIndex, lpValueName, lpcchValueName, lpReserved, lpType, lpData, lpcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-perfregqueryinfokey
  public static PerfRegQueryInfoKey(hKey: PVOID, lpClass: PVOID, lpcchClass: LPDWORD, lpReserved: LPDWORD, lpcSubKeys: LPDWORD, lpcbMaxSubKeyLen: LPDWORD, lpcbMaxClassLen: LPDWORD, lpcValues: LPDWORD, lpcbMaxValueNameLen: LPDWORD, lpcbMaxValueLen: LPDWORD, lpcbSecurityDescriptor: LPDWORD, lpftLastWriteTime: PVOID): LSTATUS {
    return Advapi32.Load('PerfRegQueryInfoKey')(hKey, lpClass, lpcchClass, lpReserved, lpcSubKeys, lpcbMaxSubKeyLen, lpcbMaxClassLen, lpcValues, lpcbMaxValueNameLen, lpcbMaxValueLen, lpcbSecurityDescriptor, lpftLastWriteTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-perfregqueryvalue
  public static PerfRegQueryValue(hKey: PVOID, lpValueName: PVOID, lpReserved: LPDWORD, lpType: LPDWORD, lpData: PVOID): LSTATUS {
    return Advapi32.Load('PerfRegQueryValue')(hKey, lpValueName, lpReserved, lpType, lpData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-perfregsetvalue
  public static PerfRegSetValue(hKey: PVOID, lpValueName: PVOID, dwType: DWORD, lpData: PVOID, cbData: DWORD): LSTATUS {
    return Advapi32.Load('PerfRegSetValue')(hKey, lpValueName, dwType, lpData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-privilegecheck
  public static PrivilegeCheck(ClientToken: HANDLE, RequiredPrivileges: PPRIVILEGE_SET, pfResult: LPBOOL): BOOL {
    return Advapi32.Load('PrivilegeCheck')(ClientToken, RequiredPrivileges, pfResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-privilegedserviceauditalarma
  public static PrivilegedServiceAuditAlarmA(SubsystemName: LPCSTR, ServiceName: LPCSTR, ClientToken: HANDLE, Privileges: PPRIVILEGE_SET, AccessGranted: BOOL): BOOL {
    return Advapi32.Load('PrivilegedServiceAuditAlarmA')(SubsystemName, ServiceName, ClientToken, Privileges, AccessGranted);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-privilegedserviceauditalarmw
  public static PrivilegedServiceAuditAlarmW(SubsystemName: LPCWSTR, ServiceName: LPCWSTR, ClientToken: HANDLE, Privileges: PPRIVILEGE_SET, AccessGranted: BOOL): BOOL {
    return Advapi32.Load('PrivilegedServiceAuditAlarmW')(SubsystemName, ServiceName, ClientToken, Privileges, AccessGranted);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/advapi32/nf-advapi32-processidletasks
  public static ProcessIdleTasks(): DWORD {
    return Advapi32.Load('ProcessIdleTasks')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/advapi32/nf-advapi32-processidletasksw
  public static ProcessIdleTasksW(dwFlags: DWORD): DWORD {
    return Advapi32.Load('ProcessIdleTasksW')(dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-processtrace
  public static ProcessTrace(HandleArray: PVOID, HandleCount: ULONG, StartTime: PVOID, EndTime: PVOID): ULONG {
    return Advapi32.Load('ProcessTrace')(HandleArray, HandleCount, StartTime, EndTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-queryalltracesa
  public static QueryAllTracesA(PropertyArray: PVOID, PropertyArrayCount: ULONG, LoggerCount: PULONG): ULONG {
    return Advapi32.Load('QueryAllTracesA')(PropertyArray, PropertyArrayCount, LoggerCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-queryalltracesw
  public static QueryAllTracesW(PropertyArray: PVOID, PropertyArrayCount: ULONG, LoggerCount: PULONG): ULONG {
    return Advapi32.Load('QueryAllTracesW')(PropertyArray, PropertyArrayCount, LoggerCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-querylocaluserservicename
  public static QueryLocalUserServiceName(pvReserved: PVOID, pServiceName: PVOID): DWORD {
    return Advapi32.Load('QueryLocalUserServiceName')(pvReserved, pServiceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-queryrecoveryagentsonencryptedfile
  public static QueryRecoveryAgentsOnEncryptedFile(lpFileName: LPCWSTR, pRecoveryAgents: PVOID): DWORD {
    return Advapi32.Load('QueryRecoveryAgentsOnEncryptedFile')(lpFileName, pRecoveryAgents);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-querysecurityaccessmask
  public static QuerySecurityAccessMask(SecurityInformation: SECURITY_INFORMATION, DesiredAccess: LPDWORD): VOID {
    return Advapi32.Load('QuerySecurityAccessMask')(SecurityInformation, DesiredAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryserviceconfig2a
  public static QueryServiceConfig2A(hService: SC_HANDLE, dwInfoLevel: DWORD, lpBuffer: LPBYTE, cbBufSize: DWORD, pcbBytesNeeded: LPDWORD): BOOL {
    return Advapi32.Load('QueryServiceConfig2A')(hService, dwInfoLevel, lpBuffer, cbBufSize, pcbBytesNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryserviceconfig2w
  public static QueryServiceConfig2W(hService: SC_HANDLE, dwInfoLevel: DWORD, lpBuffer: LPBYTE, cbBufSize: DWORD, pcbBytesNeeded: LPDWORD): BOOL {
    return Advapi32.Load('QueryServiceConfig2W')(hService, dwInfoLevel, lpBuffer, cbBufSize, pcbBytesNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryserviceconfiga
  public static QueryServiceConfigA(hService: SC_HANDLE, lpServiceConfig: PVOID, cbBufSize: DWORD, pcbBytesNeeded: LPDWORD): BOOL {
    return Advapi32.Load('QueryServiceConfigA')(hService, lpServiceConfig, cbBufSize, pcbBytesNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryserviceconfigw
  public static QueryServiceConfigW(hService: SC_HANDLE, lpServiceConfig: PVOID, cbBufSize: DWORD, pcbBytesNeeded: LPDWORD): BOOL {
    return Advapi32.Load('QueryServiceConfigW')(hService, lpServiceConfig, cbBufSize, pcbBytesNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryservicedynamicinformation
  public static QueryServiceDynamicInformation(hServiceStatus: SERVICE_STATUS_HANDLE, dwInfoLevel: DWORD, ppDynamicInfo: PVOID): BOOL {
    return Advapi32.Load('QueryServiceDynamicInformation')(hServiceStatus, dwInfoLevel, ppDynamicInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryservicelockstatusa
  public static QueryServiceLockStatusA(hSCManager: SC_HANDLE, lpLockStatus: PVOID, cbBufSize: DWORD, pcbBytesNeeded: LPDWORD): BOOL {
    return Advapi32.Load('QueryServiceLockStatusA')(hSCManager, lpLockStatus, cbBufSize, pcbBytesNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryservicelockstatusw
  public static QueryServiceLockStatusW(hSCManager: SC_HANDLE, lpLockStatus: PVOID, cbBufSize: DWORD, pcbBytesNeeded: LPDWORD): BOOL {
    return Advapi32.Load('QueryServiceLockStatusW')(hSCManager, lpLockStatus, cbBufSize, pcbBytesNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryserviceobjectsecurity
  public static QueryServiceObjectSecurity(hService: SC_HANDLE, dwSecurityInformation: SECURITY_INFORMATION, lpSecurityDescriptor: PSECURITY_DESCRIPTOR, cbBufSize: DWORD, pcbBytesNeeded: LPDWORD): BOOL {
    return Advapi32.Load('QueryServiceObjectSecurity')(hService, dwSecurityInformation, lpSecurityDescriptor, cbBufSize, pcbBytesNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryservicestatus
  public static QueryServiceStatus(hService: SC_HANDLE, lpServiceStatus: PVOID): BOOL {
    return Advapi32.Load('QueryServiceStatus')(hService, lpServiceStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryservicestatusex
  public static QueryServiceStatusEx(hService: SC_HANDLE, InfoLevel: DWORD, lpBuffer: LPBYTE, cbBufSize: DWORD, pcbBytesNeeded: LPDWORD): BOOL {
    return Advapi32.Load('QueryServiceStatusEx')(hService, InfoLevel, lpBuffer, cbBufSize, pcbBytesNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-querytracea
  public static QueryTraceA(TraceHandle: TRACEHANDLE, InstanceName: LPCSTR, Properties: PVOID): ULONG {
    return Advapi32.Load('QueryTraceA')(TraceHandle, InstanceName, Properties);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-querytraceprocessinghandle
  public static QueryTraceProcessingHandle(ProcessingHandle: TRACEHANDLE, InformationClass: DWORD, InBuffer: PVOID, InBufferSize: ULONG, OutBuffer: PVOID, OutBufferSize: ULONG, ReturnLength: PULONG): ULONG {
    return Advapi32.Load('QueryTraceProcessingHandle')(ProcessingHandle, InformationClass, InBuffer, InBufferSize, OutBuffer, OutBufferSize, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-querytracew
  public static QueryTraceW(TraceHandle: TRACEHANDLE, InstanceName: LPCWSTR, Properties: PVOID): ULONG {
    return Advapi32.Load('QueryTraceW')(TraceHandle, InstanceName, Properties);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryuserservicename
  public static QueryUserServiceName(pvReserved: PVOID, pServiceName: PVOID): DWORD {
    return Advapi32.Load('QueryUserServiceName')(pvReserved, pServiceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryuserservicenameforcontext
  public static QueryUserServiceNameForContext(pvReserved: PVOID, pvContext: PVOID, pServiceName: PVOID): DWORD {
    return Advapi32.Load('QueryUserServiceNameForContext')(pvReserved, pvContext, pServiceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-queryusersonencryptedfile
  public static QueryUsersOnEncryptedFile(lpFileName: LPCWSTR, pUsers: PVOID): DWORD {
    return Advapi32.Load('QueryUsersOnEncryptedFile')(lpFileName, pUsers);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-readencryptedfileraw
  public static ReadEncryptedFileRaw(pfExportCallback: PVOID, pvCallbackContext: PVOID, pvContext: PVOID): DWORD {
    return Advapi32.Load('ReadEncryptedFileRaw')(pfExportCallback, pvCallbackContext, pvContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-readeventloga
  public static ReadEventLogA(hEventLog: HANDLE, dwReadFlags: DWORD, dwRecordOffset: DWORD, lpBuffer: LPVOID, nNumberOfBytesToRead: DWORD, pnBytesRead: LPDWORD, pnMinNumberOfBytesNeeded: LPDWORD): BOOL {
    return Advapi32.Load('ReadEventLogA')(hEventLog, dwReadFlags, dwRecordOffset, lpBuffer, nNumberOfBytesToRead, pnBytesRead, pnMinNumberOfBytesNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-readeventlogw
  public static ReadEventLogW(hEventLog: HANDLE, dwReadFlags: DWORD, dwRecordOffset: DWORD, lpBuffer: LPVOID, nNumberOfBytesToRead: DWORD, pnBytesRead: LPDWORD, pnMinNumberOfBytesNeeded: LPDWORD): BOOL {
    return Advapi32.Load('ReadEventLogW')(hEventLog, dwReadFlags, dwRecordOffset, lpBuffer, nNumberOfBytesToRead, pnBytesRead, pnMinNumberOfBytesNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regclosekey
  public static RegCloseKey(hKey: HKEY): LSTATUS {
    return Advapi32.Load('RegCloseKey')(hKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regconnectregistrya
  public static RegConnectRegistryA(lpMachineName: LPCSTR, hKey: HKEY, phkResult: PHKEY): LSTATUS {
    return Advapi32.Load('RegConnectRegistryA')(lpMachineName, hKey, phkResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regconnectregistryexa
  public static RegConnectRegistryExA(lpMachineName: LPCSTR, hKey: HKEY, Flags: ULONG, phkResult: PHKEY): LSTATUS {
    return Advapi32.Load('RegConnectRegistryExA')(lpMachineName, hKey, Flags, phkResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regconnectregistryexw
  public static RegConnectRegistryExW(lpMachineName: LPCWSTR, hKey: HKEY, Flags: ULONG, phkResult: PHKEY): LSTATUS {
    return Advapi32.Load('RegConnectRegistryExW')(lpMachineName, hKey, Flags, phkResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regconnectregistryw
  public static RegConnectRegistryW(lpMachineName: LPCWSTR, hKey: HKEY, phkResult: PHKEY): LSTATUS {
    return Advapi32.Load('RegConnectRegistryW')(lpMachineName, hKey, phkResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regcopytreea
  public static RegCopyTreeA(hKeySrc: HKEY, lpSubKey: LPCSTR, hKeyDest: HKEY): LSTATUS {
    return Advapi32.Load('RegCopyTreeA')(hKeySrc, lpSubKey, hKeyDest);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regcopytreew
  public static RegCopyTreeW(hKeySrc: HKEY, lpSubKey: LPCWSTR, hKeyDest: HKEY): LSTATUS {
    return Advapi32.Load('RegCopyTreeW')(hKeySrc, lpSubKey, hKeyDest);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regcreatekeya
  public static RegCreateKeyA(hKey: HKEY, lpSubKey: LPCSTR, phkResult: PHKEY): LSTATUS {
    return Advapi32.Load('RegCreateKeyA')(hKey, lpSubKey, phkResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regcreatekeyexa
  public static RegCreateKeyExA(hKey: HKEY, lpSubKey: LPCSTR, Reserved: DWORD, lpClass: LPSTR, dwOptions: DWORD, samDesired: REGSAM, lpSecurityAttributes: PVOID, phkResult: PHKEY, lpdwDisposition: LPDWORD): LSTATUS {
    return Advapi32.Load('RegCreateKeyExA')(hKey, lpSubKey, Reserved, lpClass, dwOptions, samDesired, lpSecurityAttributes, phkResult, lpdwDisposition);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regcreatekeyexw
  public static RegCreateKeyExW(hKey: HKEY, lpSubKey: LPCWSTR, Reserved: DWORD, lpClass: LPWSTR, dwOptions: DWORD, samDesired: REGSAM, lpSecurityAttributes: PVOID, phkResult: PHKEY, lpdwDisposition: LPDWORD): LSTATUS {
    return Advapi32.Load('RegCreateKeyExW')(hKey, lpSubKey, Reserved, lpClass, dwOptions, samDesired, lpSecurityAttributes, phkResult, lpdwDisposition);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regcreatekeytransacteda
  public static RegCreateKeyTransactedA(hKey: HKEY, lpSubKey: LPCSTR, Reserved: DWORD, lpClass: LPSTR, dwOptions: DWORD, samDesired: REGSAM, lpSecurityAttributes: PVOID, phkResult: PHKEY, lpdwDisposition: LPDWORD, hTransaction: HANDLE, pExtendedParemeter: PVOID): LSTATUS {
    return Advapi32.Load('RegCreateKeyTransactedA')(hKey, lpSubKey, Reserved, lpClass, dwOptions, samDesired, lpSecurityAttributes, phkResult, lpdwDisposition, hTransaction, pExtendedParemeter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regcreatekeytransactedw
  public static RegCreateKeyTransactedW(hKey: HKEY, lpSubKey: LPCWSTR, Reserved: DWORD, lpClass: LPWSTR, dwOptions: DWORD, samDesired: REGSAM, lpSecurityAttributes: PVOID, phkResult: PHKEY, lpdwDisposition: LPDWORD, hTransaction: HANDLE, pExtendedParemeter: PVOID): LSTATUS {
    return Advapi32.Load('RegCreateKeyTransactedW')(hKey, lpSubKey, Reserved, lpClass, dwOptions, samDesired, lpSecurityAttributes, phkResult, lpdwDisposition, hTransaction, pExtendedParemeter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regcreatekeyw
  public static RegCreateKeyW(hKey: HKEY, lpSubKey: LPCWSTR, phkResult: PHKEY): LSTATUS {
    return Advapi32.Load('RegCreateKeyW')(hKey, lpSubKey, phkResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdeletekeya
  public static RegDeleteKeyA(hKey: HKEY, lpSubKey: LPCSTR): LSTATUS {
    return Advapi32.Load('RegDeleteKeyA')(hKey, lpSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdeletekeyexa
  public static RegDeleteKeyExA(hKey: HKEY, lpSubKey: LPCSTR, samDesired: REGSAM, Reserved: DWORD): LSTATUS {
    return Advapi32.Load('RegDeleteKeyExA')(hKey, lpSubKey, samDesired, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdeletekeyexw
  public static RegDeleteKeyExW(hKey: HKEY, lpSubKey: LPCWSTR, samDesired: REGSAM, Reserved: DWORD): LSTATUS {
    return Advapi32.Load('RegDeleteKeyExW')(hKey, lpSubKey, samDesired, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdeletekeytransacteda
  public static RegDeleteKeyTransactedA(hKey: HKEY, lpSubKey: LPCSTR, samDesired: REGSAM, Reserved: DWORD, hTransaction: HANDLE, pExtendedParameter: PVOID): LSTATUS {
    return Advapi32.Load('RegDeleteKeyTransactedA')(hKey, lpSubKey, samDesired, Reserved, hTransaction, pExtendedParameter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdeletekeytransactedw
  public static RegDeleteKeyTransactedW(hKey: HKEY, lpSubKey: LPCWSTR, samDesired: REGSAM, Reserved: DWORD, hTransaction: HANDLE, pExtendedParameter: PVOID): LSTATUS {
    return Advapi32.Load('RegDeleteKeyTransactedW')(hKey, lpSubKey, samDesired, Reserved, hTransaction, pExtendedParameter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdeletekeyvaluea
  public static RegDeleteKeyValueA(hKey: HKEY, lpSubKey: LPCSTR, lpValueName: LPCSTR): LSTATUS {
    return Advapi32.Load('RegDeleteKeyValueA')(hKey, lpSubKey, lpValueName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdeletekeyvaluew
  public static RegDeleteKeyValueW(hKey: HKEY, lpSubKey: LPCWSTR, lpValueName: LPCWSTR): LSTATUS {
    return Advapi32.Load('RegDeleteKeyValueW')(hKey, lpSubKey, lpValueName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdeletekeyw
  public static RegDeleteKeyW(hKey: HKEY, lpSubKey: LPCWSTR): LSTATUS {
    return Advapi32.Load('RegDeleteKeyW')(hKey, lpSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdeletetreea
  public static RegDeleteTreeA(hKey: HKEY, lpSubKey: LPCSTR): LSTATUS {
    return Advapi32.Load('RegDeleteTreeA')(hKey, lpSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdeletetreew
  public static RegDeleteTreeW(hKey: HKEY, lpSubKey: LPCWSTR): LSTATUS {
    return Advapi32.Load('RegDeleteTreeW')(hKey, lpSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdeletevaluea
  public static RegDeleteValueA(hKey: HKEY, lpValueName: LPCSTR): LSTATUS {
    return Advapi32.Load('RegDeleteValueA')(hKey, lpValueName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdeletevaluew
  public static RegDeleteValueW(hKey: HKEY, lpValueName: LPCWSTR): LSTATUS {
    return Advapi32.Load('RegDeleteValueW')(hKey, lpValueName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdisablepredefinedcache
  public static RegDisablePredefinedCache(): LSTATUS {
    return Advapi32.Load('RegDisablePredefinedCache')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdisablepredefinedcacheex
  public static RegDisablePredefinedCacheEx(): LSTATUS {
    return Advapi32.Load('RegDisablePredefinedCacheEx')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdisablereflectionkey
  public static RegDisableReflectionKey(hBase: HKEY): LSTATUS {
    return Advapi32.Load('RegDisableReflectionKey')(hBase);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regenablereflectionkey
  public static RegEnableReflectionKey(hBase: HKEY): LSTATUS {
    return Advapi32.Load('RegEnableReflectionKey')(hBase);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regenumkeya
  public static RegEnumKeyA(hKey: HKEY, dwIndex: DWORD, lpName: LPSTR, cchName: DWORD): LSTATUS {
    return Advapi32.Load('RegEnumKeyA')(hKey, dwIndex, lpName, cchName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regenumkeyexa
  public static RegEnumKeyExA(hKey: HKEY, dwIndex: DWORD, lpName: LPSTR, lpcchName: LPDWORD, lpReserved: LPDWORD, lpClass: LPSTR, lpcchClass: LPDWORD, lpftLastWriteTime: PVOID): LSTATUS {
    return Advapi32.Load('RegEnumKeyExA')(hKey, dwIndex, lpName, lpcchName, lpReserved, lpClass, lpcchClass, lpftLastWriteTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regenumkeyexw
  public static RegEnumKeyExW(hKey: HKEY, dwIndex: DWORD, lpName: LPWSTR, lpcchName: LPDWORD, lpReserved: LPDWORD, lpClass: LPWSTR, lpcchClass: LPDWORD, lpftLastWriteTime: PVOID): LSTATUS {
    return Advapi32.Load('RegEnumKeyExW')(hKey, dwIndex, lpName, lpcchName, lpReserved, lpClass, lpcchClass, lpftLastWriteTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regenumkeyw
  public static RegEnumKeyW(hKey: HKEY, dwIndex: DWORD, lpName: LPWSTR, cchName: DWORD): LSTATUS {
    return Advapi32.Load('RegEnumKeyW')(hKey, dwIndex, lpName, cchName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regenumvaluea
  public static RegEnumValueA(hKey: HKEY, dwIndex: DWORD, lpValueName: LPSTR, lpcchValueName: LPDWORD, lpReserved: LPDWORD, lpType: LPDWORD, lpData: LPBYTE, lpcbData: LPDWORD): LSTATUS {
    return Advapi32.Load('RegEnumValueA')(hKey, dwIndex, lpValueName, lpcchValueName, lpReserved, lpType, lpData, lpcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regenumvaluew
  public static RegEnumValueW(hKey: HKEY, dwIndex: DWORD, lpValueName: LPWSTR, lpcchValueName: LPDWORD, lpReserved: LPDWORD, lpType: LPDWORD, lpData: LPBYTE, lpcbData: LPDWORD): LSTATUS {
    return Advapi32.Load('RegEnumValueW')(hKey, dwIndex, lpValueName, lpcchValueName, lpReserved, lpType, lpData, lpcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regflushkey
  public static RegFlushKey(hKey: HKEY): LSTATUS {
    return Advapi32.Load('RegFlushKey')(hKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-reggetkeysecurity
  public static RegGetKeySecurity(hKey: HKEY, SecurityInformation: SECURITY_INFORMATION, pSecurityDescriptor: PSECURITY_DESCRIPTOR, lpcbSecurityDescriptor: LPDWORD): LSTATUS {
    return Advapi32.Load('RegGetKeySecurity')(hKey, SecurityInformation, pSecurityDescriptor, lpcbSecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-reggetvaluea
  public static RegGetValueA(hkey: HKEY, lpSubKey: LPCSTR, lpValue: LPCSTR, dwFlags: DWORD, pdwType: LPDWORD, pvData: PVOID, pcbData: LPDWORD): LSTATUS {
    return Advapi32.Load('RegGetValueA')(hkey, lpSubKey, lpValue, dwFlags, pdwType, pvData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-reggetvaluew
  public static RegGetValueW(hkey: HKEY, lpSubKey: LPCWSTR, lpValue: LPCWSTR, dwFlags: DWORD, pdwType: LPDWORD, pvData: PVOID, pcbData: LPDWORD): LSTATUS {
    return Advapi32.Load('RegGetValueW')(hkey, lpSubKey, lpValue, dwFlags, pdwType, pvData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regloadappkeya
  public static RegLoadAppKeyA(lpFile: LPCSTR, phkResult: PHKEY, samDesired: REGSAM, dwOptions: DWORD, Reserved: DWORD): LSTATUS {
    return Advapi32.Load('RegLoadAppKeyA')(lpFile, phkResult, samDesired, dwOptions, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regloadappkeyw
  public static RegLoadAppKeyW(lpFile: LPCWSTR, phkResult: PHKEY, samDesired: REGSAM, dwOptions: DWORD, Reserved: DWORD): LSTATUS {
    return Advapi32.Load('RegLoadAppKeyW')(lpFile, phkResult, samDesired, dwOptions, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regloadkeya
  public static RegLoadKeyA(hKey: HKEY, lpSubKey: LPCSTR, lpFile: LPCSTR): LSTATUS {
    return Advapi32.Load('RegLoadKeyA')(hKey, lpSubKey, lpFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regloadkeyw
  public static RegLoadKeyW(hKey: HKEY, lpSubKey: LPCWSTR, lpFile: LPCWSTR): LSTATUS {
    return Advapi32.Load('RegLoadKeyW')(hKey, lpSubKey, lpFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regloadmuistringa
  public static RegLoadMUIStringA(hKey: HKEY, pszValue: LPCSTR, pszOutBuf: LPSTR, cbOutBuf: DWORD, pcbData: LPDWORD, Flags: DWORD, pszDirectory: LPCSTR): LSTATUS {
    return Advapi32.Load('RegLoadMUIStringA')(hKey, pszValue, pszOutBuf, cbOutBuf, pcbData, Flags, pszDirectory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regloadmuistringw
  public static RegLoadMUIStringW(hKey: HKEY, pszValue: LPCWSTR, pszOutBuf: LPWSTR, cbOutBuf: DWORD, pcbData: LPDWORD, Flags: DWORD, pszDirectory: LPCWSTR): LSTATUS {
    return Advapi32.Load('RegLoadMUIStringW')(hKey, pszValue, pszOutBuf, cbOutBuf, pcbData, Flags, pszDirectory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regnotifychangekeyvalue
  public static RegNotifyChangeKeyValue(hKey: HKEY, bWatchSubtree: BOOL, dwNotifyFilter: DWORD, hEvent: HANDLE, fAsynchronous: BOOL): LSTATUS {
    return Advapi32.Load('RegNotifyChangeKeyValue')(hKey, bWatchSubtree, dwNotifyFilter, hEvent, fAsynchronous);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regopencurrentuser
  public static RegOpenCurrentUser(samDesired: REGSAM, phkResult: PHKEY): LSTATUS {
    return Advapi32.Load('RegOpenCurrentUser')(samDesired, phkResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regopenkeya
  public static RegOpenKeyA(hKey: HKEY, lpSubKey: LPCSTR, phkResult: PHKEY): LSTATUS {
    return Advapi32.Load('RegOpenKeyA')(hKey, lpSubKey, phkResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regopenkeyexa
  public static RegOpenKeyExA(hKey: HKEY, lpSubKey: LPCSTR, ulOptions: DWORD, samDesired: REGSAM, phkResult: PHKEY): LSTATUS {
    return Advapi32.Load('RegOpenKeyExA')(hKey, lpSubKey, ulOptions, samDesired, phkResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regopenkeyexw
  public static RegOpenKeyExW(hKey: HKEY, lpSubKey: LPCWSTR, ulOptions: DWORD, samDesired: REGSAM, phkResult: PHKEY): LSTATUS {
    return Advapi32.Load('RegOpenKeyExW')(hKey, lpSubKey, ulOptions, samDesired, phkResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regopenkeytransacteda
  public static RegOpenKeyTransactedA(hKey: HKEY, lpSubKey: LPCSTR, ulOptions: DWORD, samDesired: REGSAM, phkResult: PHKEY, hTransaction: HANDLE, pExtendedParemeter: PVOID): LSTATUS {
    return Advapi32.Load('RegOpenKeyTransactedA')(hKey, lpSubKey, ulOptions, samDesired, phkResult, hTransaction, pExtendedParemeter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regopenkeytransactedw
  public static RegOpenKeyTransactedW(hKey: HKEY, lpSubKey: LPCWSTR, ulOptions: DWORD, samDesired: REGSAM, phkResult: PHKEY, hTransaction: HANDLE, pExtendedParemeter: PVOID): LSTATUS {
    return Advapi32.Load('RegOpenKeyTransactedW')(hKey, lpSubKey, ulOptions, samDesired, phkResult, hTransaction, pExtendedParemeter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regopenkeyw
  public static RegOpenKeyW(hKey: HKEY, lpSubKey: LPCWSTR, phkResult: PHKEY): LSTATUS {
    return Advapi32.Load('RegOpenKeyW')(hKey, lpSubKey, phkResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regopenuserclassesroot
  public static RegOpenUserClassesRoot(hToken: HANDLE, dwOptions: DWORD, samDesired: REGSAM, phkResult: PHKEY): LSTATUS {
    return Advapi32.Load('RegOpenUserClassesRoot')(hToken, dwOptions, samDesired, phkResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regoverridepredefkey
  public static RegOverridePredefKey(hKey: HKEY, hNewHKey: HKEY): LSTATUS {
    return Advapi32.Load('RegOverridePredefKey')(hKey, hNewHKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regqueryinfokeya
  public static RegQueryInfoKeyA(hKey: HKEY, lpClass: LPSTR, lpcchClass: LPDWORD, lpReserved: LPDWORD, lpcSubKeys: LPDWORD, lpcbMaxSubKeyLen: LPDWORD, lpcbMaxClassLen: LPDWORD, lpcValues: LPDWORD, lpcbMaxValueNameLen: LPDWORD, lpcbMaxValueLen: LPDWORD, lpcbSecurityDescriptor: LPDWORD, lpftLastWriteTime: PVOID): LSTATUS {
    return Advapi32.Load('RegQueryInfoKeyA')(hKey, lpClass, lpcchClass, lpReserved, lpcSubKeys, lpcbMaxSubKeyLen, lpcbMaxClassLen, lpcValues, lpcbMaxValueNameLen, lpcbMaxValueLen, lpcbSecurityDescriptor, lpftLastWriteTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regqueryinfokeyw
  public static RegQueryInfoKeyW(hKey: HKEY, lpClass: LPWSTR, lpcchClass: LPDWORD, lpReserved: LPDWORD, lpcSubKeys: LPDWORD, lpcbMaxSubKeyLen: LPDWORD, lpcbMaxClassLen: LPDWORD, lpcValues: LPDWORD, lpcbMaxValueNameLen: LPDWORD, lpcbMaxValueLen: LPDWORD, lpcbSecurityDescriptor: LPDWORD, lpftLastWriteTime: PVOID): LSTATUS {
    return Advapi32.Load('RegQueryInfoKeyW')(hKey, lpClass, lpcchClass, lpReserved, lpcSubKeys, lpcbMaxSubKeyLen, lpcbMaxClassLen, lpcValues, lpcbMaxValueNameLen, lpcbMaxValueLen, lpcbSecurityDescriptor, lpftLastWriteTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regquerymultiplevaluesa
  public static RegQueryMultipleValuesA(hKey: HKEY, val_list: PVALENTA, num_vals: DWORD, lpValueBuf: LPSTR, ldwTotsize: LPDWORD): LSTATUS {
    return Advapi32.Load('RegQueryMultipleValuesA')(hKey, val_list, num_vals, lpValueBuf, ldwTotsize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regquerymultiplevaluesw
  public static RegQueryMultipleValuesW(hKey: HKEY, val_list: PVALENTW, num_vals: DWORD, lpValueBuf: LPWSTR, ldwTotsize: LPDWORD): LSTATUS {
    return Advapi32.Load('RegQueryMultipleValuesW')(hKey, val_list, num_vals, lpValueBuf, ldwTotsize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regqueryreflectionkey
  public static RegQueryReflectionKey(hBase: HKEY, bIsReflectionDisabled: PBOOL): LSTATUS {
    return Advapi32.Load('RegQueryReflectionKey')(hBase, bIsReflectionDisabled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regqueryvaluea
  public static RegQueryValueA(hKey: HKEY, lpSubKey: LPCSTR, lpData: LPSTR, lpcbData: PLONG): LSTATUS {
    return Advapi32.Load('RegQueryValueA')(hKey, lpSubKey, lpData, lpcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regqueryvalueexa
  public static RegQueryValueExA(hKey: HKEY, lpValueName: LPCSTR, lpReserved: LPDWORD, lpType: LPDWORD, lpData: LPBYTE, lpcbData: LPDWORD): LSTATUS {
    return Advapi32.Load('RegQueryValueExA')(hKey, lpValueName, lpReserved, lpType, lpData, lpcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regqueryvalueexw
  public static RegQueryValueExW(hKey: HKEY, lpValueName: LPCWSTR, lpReserved: LPDWORD, lpType: LPDWORD, lpData: LPBYTE, lpcbData: LPDWORD): LSTATUS {
    return Advapi32.Load('RegQueryValueExW')(hKey, lpValueName, lpReserved, lpType, lpData, lpcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regqueryvaluew
  public static RegQueryValueW(hKey: HKEY, lpSubKey: LPCWSTR, lpData: LPWSTR, lpcbData: PLONG): LSTATUS {
    return Advapi32.Load('RegQueryValueW')(hKey, lpSubKey, lpData, lpcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regrenamekey
  public static RegRenameKey(hKey: HKEY, lpSubKeyName: LPCWSTR, lpNewKeyName: LPCWSTR): LSTATUS {
    return Advapi32.Load('RegRenameKey')(hKey, lpSubKeyName, lpNewKeyName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regreplacekeya
  public static RegReplaceKeyA(hKey: HKEY, lpSubKey: LPCSTR, lpNewFile: LPCSTR, lpOldFile: LPCSTR): LSTATUS {
    return Advapi32.Load('RegReplaceKeyA')(hKey, lpSubKey, lpNewFile, lpOldFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regreplacekeyw
  public static RegReplaceKeyW(hKey: HKEY, lpSubKey: LPCWSTR, lpNewFile: LPCWSTR, lpOldFile: LPCWSTR): LSTATUS {
    return Advapi32.Load('RegReplaceKeyW')(hKey, lpSubKey, lpNewFile, lpOldFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regrestorekeya
  public static RegRestoreKeyA(hKey: HKEY, lpFile: LPCSTR, dwFlags: DWORD): LSTATUS {
    return Advapi32.Load('RegRestoreKeyA')(hKey, lpFile, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regrestorekeyw
  public static RegRestoreKeyW(hKey: HKEY, lpFile: LPCWSTR, dwFlags: DWORD): LSTATUS {
    return Advapi32.Load('RegRestoreKeyW')(hKey, lpFile, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regsavekeya
  public static RegSaveKeyA(hKey: HKEY, lpFile: LPCSTR, lpSecurityAttributes: PVOID): LSTATUS {
    return Advapi32.Load('RegSaveKeyA')(hKey, lpFile, lpSecurityAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regsavekeyexa
  public static RegSaveKeyExA(hKey: HKEY, lpFile: LPCSTR, lpSecurityAttributes: PVOID, Flags: DWORD): LSTATUS {
    return Advapi32.Load('RegSaveKeyExA')(hKey, lpFile, lpSecurityAttributes, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regsavekeyexw
  public static RegSaveKeyExW(hKey: HKEY, lpFile: LPCWSTR, lpSecurityAttributes: PVOID, Flags: DWORD): LSTATUS {
    return Advapi32.Load('RegSaveKeyExW')(hKey, lpFile, lpSecurityAttributes, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regsavekeyw
  public static RegSaveKeyW(hKey: HKEY, lpFile: LPCWSTR, lpSecurityAttributes: PVOID): LSTATUS {
    return Advapi32.Load('RegSaveKeyW')(hKey, lpFile, lpSecurityAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regsetkeysecurity
  public static RegSetKeySecurity(hKey: HKEY, SecurityInformation: SECURITY_INFORMATION, pSecurityDescriptor: PSECURITY_DESCRIPTOR): LSTATUS {
    return Advapi32.Load('RegSetKeySecurity')(hKey, SecurityInformation, pSecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regsetkeyvaluea
  public static RegSetKeyValueA(hKey: HKEY, lpSubKey: LPCSTR, lpValueName: LPCSTR, dwType: DWORD, lpData: LPCVOID, cbData: DWORD): LSTATUS {
    return Advapi32.Load('RegSetKeyValueA')(hKey, lpSubKey, lpValueName, dwType, lpData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regsetkeyvaluew
  public static RegSetKeyValueW(hKey: HKEY, lpSubKey: LPCWSTR, lpValueName: LPCWSTR, dwType: DWORD, lpData: LPCVOID, cbData: DWORD): LSTATUS {
    return Advapi32.Load('RegSetKeyValueW')(hKey, lpSubKey, lpValueName, dwType, lpData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regsetvaluea
  public static RegSetValueA(hKey: HKEY, lpSubKey: LPCSTR, dwType: DWORD, lpData: LPCSTR, cbData: DWORD): LSTATUS {
    return Advapi32.Load('RegSetValueA')(hKey, lpSubKey, dwType, lpData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regsetvalueexa
  public static RegSetValueExA(hKey: HKEY, lpValueName: LPCSTR, Reserved: DWORD, dwType: DWORD, lpData: LPBYTE, cbData: DWORD): LSTATUS {
    return Advapi32.Load('RegSetValueExA')(hKey, lpValueName, Reserved, dwType, lpData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regsetvalueexw
  public static RegSetValueExW(hKey: HKEY, lpValueName: LPCWSTR, Reserved: DWORD, dwType: DWORD, lpData: LPBYTE, cbData: DWORD): LSTATUS {
    return Advapi32.Load('RegSetValueExW')(hKey, lpValueName, Reserved, dwType, lpData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regsetvaluew
  public static RegSetValueW(hKey: HKEY, lpSubKey: LPCWSTR, dwType: DWORD, lpData: LPCWSTR, cbData: DWORD): LSTATUS {
    return Advapi32.Load('RegSetValueW')(hKey, lpSubKey, dwType, lpData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regunloadkeya
  public static RegUnLoadKeyA(hKey: HKEY, lpSubKey: LPCSTR): LSTATUS {
    return Advapi32.Load('RegUnLoadKeyA')(hKey, lpSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regunloadkeyw
  public static RegUnLoadKeyW(hKey: HKEY, lpSubKey: LPCWSTR): LSTATUS {
    return Advapi32.Load('RegUnLoadKeyW')(hKey, lpSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-registereventsourcea
  public static RegisterEventSourceA(lpUNCServerName: LPCSTR, lpSourceName: LPCSTR): HANDLE {
    return Advapi32.Load('RegisterEventSourceA')(lpUNCServerName, lpSourceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-registereventsourcew
  public static RegisterEventSourceW(lpUNCServerName: LPCWSTR, lpSourceName: LPCWSTR): HANDLE {
    return Advapi32.Load('RegisterEventSourceW')(lpUNCServerName, lpSourceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/advapi32/nf-advapi32-registeridletask
  public static RegisterIdleTask(Guid: PVOID, pvReserved1: PVOID, pvReserved2: PVOID, pvReserved3: PVOID): DWORD {
    return Advapi32.Load('RegisterIdleTask')(Guid, pvReserved1, pvReserved2, pvReserved3);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-registerservicectrlhandlera
  public static RegisterServiceCtrlHandlerA(lpServiceName: LPCSTR, lpHandlerProc: PVOID): SERVICE_STATUS_HANDLE {
    return Advapi32.Load('RegisterServiceCtrlHandlerA')(lpServiceName, lpHandlerProc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-registerservicectrlhandlerexa
  public static RegisterServiceCtrlHandlerExA(lpServiceName: LPCSTR, lpHandlerProc: PVOID, lpContext: LPVOID): SERVICE_STATUS_HANDLE {
    return Advapi32.Load('RegisterServiceCtrlHandlerExA')(lpServiceName, lpHandlerProc, lpContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-registerservicectrlhandlerexw
  public static RegisterServiceCtrlHandlerExW(lpServiceName: LPCWSTR, lpHandlerProc: PVOID, lpContext: LPVOID): SERVICE_STATUS_HANDLE {
    return Advapi32.Load('RegisterServiceCtrlHandlerExW')(lpServiceName, lpHandlerProc, lpContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-registerservicectrlhandlerw
  public static RegisterServiceCtrlHandlerW(lpServiceName: LPCWSTR, lpHandlerProc: PVOID): SERVICE_STATUS_HANDLE {
    return Advapi32.Load('RegisterServiceCtrlHandlerW')(lpServiceName, lpHandlerProc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wct/nf-wct-registerwaitchaincomcallback
  public static RegisterWaitChainCOMCallback(CallStateCallback: PVOID, ActivationStateCallback: PVOID): VOID {
    return Advapi32.Load('RegisterWaitChainCOMCallback')(CallStateCallback, ActivationStateCallback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-remoteregenumkeywrapper
  public static RemoteRegEnumKeyWrapper(hKey: PVOID, dwIndex: DWORD, lpName: PVOID, lpcchName: LPDWORD, lpReserved: LPDWORD, lpClass: PVOID, lpcchClass: LPDWORD, lpftLastWriteTime: PVOID): LSTATUS {
    return Advapi32.Load('RemoteRegEnumKeyWrapper')(hKey, dwIndex, lpName, lpcchName, lpReserved, lpClass, lpcchClass, lpftLastWriteTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-remoteregenumvaluewrapper
  public static RemoteRegEnumValueWrapper(hKey: PVOID, dwIndex: DWORD, lpValueName: PVOID, lpcchValueName: LPDWORD, lpReserved: LPDWORD, lpType: LPDWORD, lpData: PVOID, lpcbData: LPDWORD): LSTATUS {
    return Advapi32.Load('RemoteRegEnumValueWrapper')(hKey, dwIndex, lpValueName, lpcchValueName, lpReserved, lpType, lpData, lpcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-remoteregqueryinfokeywrapper
  public static RemoteRegQueryInfoKeyWrapper(hKey: PVOID, lpClass: PVOID, lpcchClass: LPDWORD, lpReserved: LPDWORD, lpcSubKeys: LPDWORD, lpcbMaxSubKeyLen: LPDWORD, lpcbMaxClassLen: LPDWORD, lpcValues: LPDWORD, lpcbMaxValueNameLen: LPDWORD, lpcbMaxValueLen: LPDWORD, lpcbSecurityDescriptor: LPDWORD, lpftLastWriteTime: PVOID): LSTATUS {
    return Advapi32.Load('RemoteRegQueryInfoKeyWrapper')(hKey, lpClass, lpcchClass, lpReserved, lpcSubKeys, lpcbMaxSubKeyLen, lpcbMaxClassLen, lpcValues, lpcbMaxValueNameLen, lpcbMaxValueLen, lpcbSecurityDescriptor, lpftLastWriteTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-remoteregquerymultiplevalues2wrapper
  public static RemoteRegQueryMultipleValues2Wrapper(hKey: PVOID, val_list: PVOID, num_vals: DWORD, lpValueBuf: PVOID, ldwTotsize: LPDWORD, ldwRequiredSize: LPDWORD): LSTATUS {
    return Advapi32.Load('RemoteRegQueryMultipleValues2Wrapper')(hKey, val_list, num_vals, lpValueBuf, ldwTotsize, ldwRequiredSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-remoteregquerymultiplevalueswrapper
  public static RemoteRegQueryMultipleValuesWrapper(hKey: PVOID, val_list: PVOID, num_vals: DWORD, lpValueBuf: PVOID, ldwTotsize: LPDWORD): LSTATUS {
    return Advapi32.Load('RemoteRegQueryMultipleValuesWrapper')(hKey, val_list, num_vals, lpValueBuf, ldwTotsize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-remoteregqueryvaluewrapper
  public static RemoteRegQueryValueWrapper(hKey: PVOID, lpValueName: PVOID, lpReserved: LPDWORD, lpType: LPDWORD, lpData: PVOID, lpcbData: LPDWORD): LSTATUS {
    return Advapi32.Load('RemoteRegQueryValueWrapper')(hKey, lpValueName, lpReserved, lpType, lpData, lpcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-removeusersfromencryptedfile
  public static RemoveUsersFromEncryptedFile(lpFileName: LPCWSTR, pHashes: PENCRYPTION_CERTIFICATE_HASH_LIST): DWORD {
    return Advapi32.Load('RemoveUsersFromEncryptedFile')(lpFileName, pHashes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-reporteventa
  public static ReportEventA(hEventLog: HANDLE, wType: WORD, wCategory: WORD, dwEventID: DWORD, lpUserSid: PSID, wNumStrings: WORD, dwDataSize: DWORD, lpStrings: PVOID, lpRawData: LPVOID): BOOL {
    return Advapi32.Load('ReportEventA')(hEventLog, wType, wCategory, dwEventID, lpUserSid, wNumStrings, dwDataSize, lpStrings, lpRawData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-reporteventw
  public static ReportEventW(hEventLog: HANDLE, wType: WORD, wCategory: WORD, dwEventID: DWORD, lpUserSid: PSID, wNumStrings: WORD, dwDataSize: DWORD, lpStrings: PVOID, lpRawData: LPVOID): BOOL {
    return Advapi32.Load('ReportEventW')(hEventLog, wType, wCategory, dwEventID, lpUserSid, wNumStrings, dwDataSize, lpStrings, lpRawData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-reverttoself
  public static RevertToSelf(): BOOL {
    return Advapi32.Load('RevertToSelf')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-safebasereggetkeysecurity
  public static SafeBaseRegGetKeySecurity(hKey: PVOID, SecurityInformation: SECURITY_INFORMATION, pSecurityDescriptor: PSECURITY_DESCRIPTOR, lpcbSecurityDescriptor: LPDWORD): LSTATUS {
    return Advapi32.Load('SafeBaseRegGetKeySecurity')(hKey, SecurityInformation, pSecurityDescriptor, lpcbSecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-safercloselevel
  public static SaferCloseLevel(hLevelHandle: HANDLE): BOOL {
    return Advapi32.Load('SaferCloseLevel')(hLevelHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-safercomputetokenfromlevel
  public static SaferComputeTokenFromLevel(LevelHandle: HANDLE, InAccessToken: HANDLE, OutAccessToken: PHANDLE, dwFlags: DWORD, lpReserved: PVOID): BOOL {
    return Advapi32.Load('SaferComputeTokenFromLevel')(LevelHandle, InAccessToken, OutAccessToken, dwFlags, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-safercreatelevel
  public static SaferCreateLevel(dwScopeId: DWORD, dwLevelId: DWORD, OpenFlags: DWORD, pLevelHandle: PVOID, lpReserved: PVOID): BOOL {
    return Advapi32.Load('SaferCreateLevel')(dwScopeId, dwLevelId, OpenFlags, pLevelHandle, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-safergetlevelinformation
  public static SaferGetLevelInformation(LevelHandle: HANDLE, dwInfoType: DWORD, lpQueryBuffer: PVOID, dwInBufferSize: DWORD, lpdwOutBufferSize: LPDWORD): BOOL {
    return Advapi32.Load('SaferGetLevelInformation')(LevelHandle, dwInfoType, lpQueryBuffer, dwInBufferSize, lpdwOutBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-safergetpolicyinformation
  public static SaferGetPolicyInformation(dwScopeId: DWORD, SaferPolicyInfoClass: DWORD, InfoBufferSize: DWORD, InfoBuffer: PVOID, InfoBufferRetSize: LPDWORD, lpReserved: PVOID): BOOL {
    return Advapi32.Load('SaferGetPolicyInformation')(dwScopeId, SaferPolicyInfoClass, InfoBufferSize, InfoBuffer, InfoBufferRetSize, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-saferidentifylevel
  public static SaferIdentifyLevel(dwNumProperties: DWORD, pCodeProperties: PVOID, pLevelHandle: PVOID, lpReserved: PVOID): BOOL {
    return Advapi32.Load('SaferIdentifyLevel')(dwNumProperties, pCodeProperties, pLevelHandle, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-saferrecordeventlogentry
  public static SaferRecordEventLogEntry(hLevel: HANDLE, szTargetPath: LPCWSTR, lpReserved: PVOID): BOOL {
    return Advapi32.Load('SaferRecordEventLogEntry')(hLevel, szTargetPath, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-safersetlevelinformation
  public static SaferSetLevelInformation(LevelHandle: HANDLE, dwInfoType: DWORD, lpQueryBuffer: PVOID, dwInBufferSize: DWORD): BOOL {
    return Advapi32.Load('SaferSetLevelInformation')(LevelHandle, dwInfoType, lpQueryBuffer, dwInBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-safersetpolicyinformation
  public static SaferSetPolicyInformation(dwScopeId: DWORD, SaferPolicyInfoClass: DWORD, InfoBufferSize: DWORD, InfoBuffer: PVOID, lpReserved: PVOID): BOOL {
    return Advapi32.Load('SaferSetPolicyInformation')(dwScopeId, SaferPolicyInfoClass, InfoBufferSize, InfoBuffer, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-saferichangeregistryscope
  public static SaferiChangeRegistryScope(pScopeId: PVOID, dwOperationFlags: DWORD): BOOL {
    return Advapi32.Load('SaferiChangeRegistryScope')(pScopeId, dwOperationFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-safericomparetokenlevels
  public static SaferiCompareTokenLevels(FirstTokenHandle: HANDLE, SecondTokenHandle: HANDLE, pdwResult: LPDWORD): BOOL {
    return Advapi32.Load('SaferiCompareTokenLevels')(FirstTokenHandle, SecondTokenHandle, pdwResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-saferiisdllallowed
  public static SaferiIsDllAllowed(lpFileName: LPCWSTR, LogHandle: HANDLE, lpReserved: PVOID): BOOL {
    return Advapi32.Load('SaferiIsDllAllowed')(lpFileName, LogHandle, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-saferiisexecutablefiletype
  public static SaferiIsExecutableFileType(szFullPathname: LPCWSTR, bFromShellExecute: BOOL): BOOL {
    return Advapi32.Load('SaferiIsExecutableFileType')(szFullPathname, bFromShellExecute);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-saferipopulatedefaultsinregistry
  public static SaferiPopulateDefaultsInRegistry(hKeyBase: HKEY, lpReserved: PVOID): BOOL {
    return Advapi32.Load('SaferiPopulateDefaultsInRegistry')(hKeyBase, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-saferirecordeventlogentry
  public static SaferiRecordEventLogEntry(hLevel: HANDLE, szTargetPath: LPCWSTR, lpReserved: PVOID): BOOL {
    return Advapi32.Load('SaferiRecordEventLogEntry')(hLevel, szTargetPath, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-saferisearchmatchinghashrules
  public static SaferiSearchMatchingHashRules(szTargetPath: LPCWSTR, pvReserved: PVOID, pHashInformation: PVOID): DWORD {
    return Advapi32.Load('SaferiSearchMatchingHashRules')(szTargetPath, pvReserved, pHashInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setaclinformation
  public static SetAclInformation(pAcl: PACL, pAclInformation: LPVOID, nAclInformationLength: DWORD, dwAclInformationClass: DWORD): BOOL {
    return Advapi32.Load('SetAclInformation')(pAcl, pAclInformation, nAclInformationLength, dwAclInformationClass);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-setencryptedfilemetadata
  public static SetEncryptedFileMetadata(lpFileName: LPCWSTR, pbOldMetadata: PVOID, pbNewMetadata: PVOID, pOwnerHash: PVOID, dwOperation: DWORD, pCertificatesAdded: PVOID): DWORD {
    return Advapi32.Load('SetEncryptedFileMetadata')(lpFileName, pbOldMetadata, pbNewMetadata, pOwnerHash, dwOperation, pCertificatesAdded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-setentriesinaccesslista
  public static SetEntriesInAccessListA(cCountOfExplicitEntries: ULONG, pListOfExplicitEntries: PVOID, OldAcl: PACL, lpProperty: LPCSTR, NewAcl: PVOID): DWORD {
    return Advapi32.Load('SetEntriesInAccessListA')(cCountOfExplicitEntries, pListOfExplicitEntries, OldAcl, lpProperty, NewAcl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-setentriesinaccesslistw
  public static SetEntriesInAccessListW(cCountOfExplicitEntries: ULONG, pListOfExplicitEntries: PVOID, OldAcl: PACL, lpProperty: LPCWSTR, NewAcl: PVOID): DWORD {
    return Advapi32.Load('SetEntriesInAccessListW')(cCountOfExplicitEntries, pListOfExplicitEntries, OldAcl, lpProperty, NewAcl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-setentriesinacla
  public static SetEntriesInAclA(cCountOfExplicitEntries: ULONG, pListOfExplicitEntries: PEXPLICIT_ACCESSA, OldAcl: PACL, NewAcl: PVOID): DWORD {
    return Advapi32.Load('SetEntriesInAclA')(cCountOfExplicitEntries, pListOfExplicitEntries, OldAcl, NewAcl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-setentriesinaclw
  public static SetEntriesInAclW(cCountOfExplicitEntries: ULONG, pListOfExplicitEntries: PEXPLICIT_ACCESSW, OldAcl: PACL, NewAcl: PVOID): DWORD {
    return Advapi32.Load('SetEntriesInAclW')(cCountOfExplicitEntries, pListOfExplicitEntries, OldAcl, NewAcl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-setentriesinauditlista
  public static SetEntriesInAuditListA(cCountOfExplicitEntries: ULONG, pListOfExplicitEntries: PVOID, OldAcl: PACL, lpProperty: LPCSTR, NewAcl: PVOID): DWORD {
    return Advapi32.Load('SetEntriesInAuditListA')(cCountOfExplicitEntries, pListOfExplicitEntries, OldAcl, lpProperty, NewAcl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-setentriesinauditlistw
  public static SetEntriesInAuditListW(cCountOfExplicitEntries: ULONG, pListOfExplicitEntries: PVOID, OldAcl: PACL, lpProperty: LPCWSTR, NewAcl: PVOID): DWORD {
    return Advapi32.Load('SetEntriesInAuditListW')(cCountOfExplicitEntries, pListOfExplicitEntries, OldAcl, lpProperty, NewAcl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setfilesecuritya
  public static SetFileSecurityA(lpFileName: LPCSTR, SecurityInformation: SECURITY_INFORMATION, pSecurityDescriptor: PSECURITY_DESCRIPTOR): BOOL {
    return Advapi32.Load('SetFileSecurityA')(lpFileName, SecurityInformation, pSecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setfilesecurityw
  public static SetFileSecurityW(lpFileName: LPCWSTR, SecurityInformation: SECURITY_INFORMATION, pSecurityDescriptor: PSECURITY_DESCRIPTOR): BOOL {
    return Advapi32.Load('SetFileSecurityW')(lpFileName, SecurityInformation, pSecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-setinformationcodeauthzlevelw
  public static SetInformationCodeAuthzLevelW(hLevel: HANDLE, dwInfoType: DWORD, lpQueryBuffer: PVOID, dwInBufferSize: DWORD): BOOL {
    return Advapi32.Load('SetInformationCodeAuthzLevelW')(hLevel, dwInfoType, lpQueryBuffer, dwInBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-setinformationcodeauthzpolicyw
  public static SetInformationCodeAuthzPolicyW(dwScopeId: DWORD, SaferPolicyInfoClass: DWORD, InfoBufferSize: DWORD, InfoBuffer: PVOID, lpReserved: PVOID): BOOL {
    return Advapi32.Load('SetInformationCodeAuthzPolicyW')(dwScopeId, SaferPolicyInfoClass, InfoBufferSize, InfoBuffer, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setkernelobjectsecurity
  public static SetKernelObjectSecurity(Handle: HANDLE, SecurityInformation: SECURITY_INFORMATION, SecurityDescriptor: PSECURITY_DESCRIPTOR): BOOL {
    return Advapi32.Load('SetKernelObjectSecurity')(Handle, SecurityInformation, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-setnamedsecurityinfoa
  public static SetNamedSecurityInfoA(pObjectName: LPSTR, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, psidOwner: PSID, psidGroup: PSID, pDacl: PACL, pSacl: PACL): DWORD {
    return Advapi32.Load('SetNamedSecurityInfoA')(pObjectName, ObjectType, SecurityInfo, psidOwner, psidGroup, pDacl, pSacl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-setnamedsecurityinfoexa
  public static SetNamedSecurityInfoExA(pObjectName: LPCSTR, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, lpProvider: LPCSTR, pAccessList: PVOID, pAuditList: PVOID, lpOwner: PVOID, lpGroup: PVOID): DWORD {
    return Advapi32.Load('SetNamedSecurityInfoExA')(pObjectName, ObjectType, SecurityInfo, lpProvider, pAccessList, pAuditList, lpOwner, lpGroup);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-setnamedsecurityinfoexw
  public static SetNamedSecurityInfoExW(pObjectName: LPCWSTR, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, lpProvider: LPCWSTR, pAccessList: PVOID, pAuditList: PVOID, lpOwner: PVOID, lpGroup: PVOID): DWORD {
    return Advapi32.Load('SetNamedSecurityInfoExW')(pObjectName, ObjectType, SecurityInfo, lpProvider, pAccessList, pAuditList, lpOwner, lpGroup);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-setnamedsecurityinfow
  public static SetNamedSecurityInfoW(pObjectName: LPWSTR, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, psidOwner: PSID, psidGroup: PSID, pDacl: PACL, pSacl: PACL): DWORD {
    return Advapi32.Load('SetNamedSecurityInfoW')(pObjectName, ObjectType, SecurityInfo, psidOwner, psidGroup, pDacl, pSacl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setprivateobjectsecurity
  public static SetPrivateObjectSecurity(SecurityInformation: SECURITY_INFORMATION, ModificationDescriptor: PSECURITY_DESCRIPTOR, ObjectsSecurityDescriptor: PVOID, GenericMapping: PGENERIC_MAPPING, Token: HANDLE): BOOL {
    return Advapi32.Load('SetPrivateObjectSecurity')(SecurityInformation, ModificationDescriptor, ObjectsSecurityDescriptor, GenericMapping, Token);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setprivateobjectsecurityex
  public static SetPrivateObjectSecurityEx(SecurityInformation: SECURITY_INFORMATION, ModificationDescriptor: PSECURITY_DESCRIPTOR, ObjectsSecurityDescriptor: PVOID, AutoInheritFlags: ULONG, GenericMapping: PGENERIC_MAPPING, Token: HANDLE): BOOL {
    return Advapi32.Load('SetPrivateObjectSecurityEx')(SecurityInformation, ModificationDescriptor, ObjectsSecurityDescriptor, AutoInheritFlags, GenericMapping, Token);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setsecurityaccessmask
  public static SetSecurityAccessMask(SecurityInformation: SECURITY_INFORMATION, DesiredAccess: LPDWORD): VOID {
    return Advapi32.Load('SetSecurityAccessMask')(SecurityInformation, DesiredAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setsecuritydescriptorcontrol
  public static SetSecurityDescriptorControl(pSecurityDescriptor: PSECURITY_DESCRIPTOR, ControlBitsOfInterest: WORD, ControlBitsToSet: WORD): BOOL {
    return Advapi32.Load('SetSecurityDescriptorControl')(pSecurityDescriptor, ControlBitsOfInterest, ControlBitsToSet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setsecuritydescriptordacl
  public static SetSecurityDescriptorDacl(pSecurityDescriptor: PSECURITY_DESCRIPTOR, bDaclPresent: BOOL, pDacl: PACL, bDaclDefaulted: BOOL): BOOL {
    return Advapi32.Load('SetSecurityDescriptorDacl')(pSecurityDescriptor, bDaclPresent, pDacl, bDaclDefaulted);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setsecuritydescriptorgroup
  public static SetSecurityDescriptorGroup(pSecurityDescriptor: PSECURITY_DESCRIPTOR, pGroup: PSID, bGroupDefaulted: BOOL): BOOL {
    return Advapi32.Load('SetSecurityDescriptorGroup')(pSecurityDescriptor, pGroup, bGroupDefaulted);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setsecuritydescriptorowner
  public static SetSecurityDescriptorOwner(pSecurityDescriptor: PSECURITY_DESCRIPTOR, pOwner: PSID, bOwnerDefaulted: BOOL): BOOL {
    return Advapi32.Load('SetSecurityDescriptorOwner')(pSecurityDescriptor, pOwner, bOwnerDefaulted);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setsecuritydescriptorrmcontrol
  public static SetSecurityDescriptorRMControl(SecurityDescriptor: PSECURITY_DESCRIPTOR, RMControl: PUCHAR): DWORD {
    return Advapi32.Load('SetSecurityDescriptorRMControl')(SecurityDescriptor, RMControl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setsecuritydescriptorsacl
  public static SetSecurityDescriptorSacl(pSecurityDescriptor: PSECURITY_DESCRIPTOR, bSaclPresent: BOOL, pSacl: PACL, bSaclDefaulted: BOOL): BOOL {
    return Advapi32.Load('SetSecurityDescriptorSacl')(pSecurityDescriptor, bSaclPresent, pSacl, bSaclDefaulted);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-setsecurityinfo
  public static SetSecurityInfo(handle: HANDLE, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, psidOwner: PSID, psidGroup: PSID, pDacl: PACL, pSacl: PACL): DWORD {
    return Advapi32.Load('SetSecurityInfo')(handle, ObjectType, SecurityInfo, psidOwner, psidGroup, pDacl, pSacl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-setsecurityinfoexa
  public static SetSecurityInfoExA(handle: HANDLE, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, lpProvider: LPCSTR, pAccessList: PVOID, pAuditList: PVOID, lpOwner: PVOID, lpGroup: PVOID, pOverlapped: PVOID): DWORD {
    return Advapi32.Load('SetSecurityInfoExA')(handle, ObjectType, SecurityInfo, lpProvider, pAccessList, pAuditList, lpOwner, lpGroup, pOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-setsecurityinfoexw
  public static SetSecurityInfoExW(handle: HANDLE, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, lpProvider: LPCWSTR, pAccessList: PVOID, pAuditList: PVOID, lpOwner: PVOID, lpGroup: PVOID, pOverlapped: PVOID): DWORD {
    return Advapi32.Load('SetSecurityInfoExW')(handle, ObjectType, SecurityInfo, lpProvider, pAccessList, pAuditList, lpOwner, lpGroup, pOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-setservicebits
  public static SetServiceBits(hServiceStatus: SERVICE_STATUS_HANDLE, dwServiceBits: DWORD, bSetBitsOn: BOOL, bUpdateImmediately: BOOL): BOOL {
    return Advapi32.Load('SetServiceBits')(hServiceStatus, dwServiceBits, bSetBitsOn, bUpdateImmediately);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-setserviceobjectsecurity
  public static SetServiceObjectSecurity(hService: SC_HANDLE, dwSecurityInformation: SECURITY_INFORMATION, lpSecurityDescriptor: PSECURITY_DESCRIPTOR): BOOL {
    return Advapi32.Load('SetServiceObjectSecurity')(hService, dwSecurityInformation, lpSecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-setservicestatus
  public static SetServiceStatus(hServiceStatus: SERVICE_STATUS_HANDLE, lpServiceStatus: PVOID): BOOL {
    return Advapi32.Load('SetServiceStatus')(hServiceStatus, lpServiceStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-setthreadtoken
  public static SetThreadToken(Thread: PHANDLE, Token: HANDLE): BOOL {
    return Advapi32.Load('SetThreadToken')(Thread, Token);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-settokeninformation
  public static SetTokenInformation(TokenHandle: HANDLE, TokenInformationClass: TOKEN_INFORMATION_CLASS, TokenInformation: LPVOID, TokenInformationLength: DWORD): BOOL {
    return Advapi32.Load('SetTokenInformation')(TokenHandle, TokenInformationClass, TokenInformation, TokenInformationLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-setuserfileencryptionkey
  public static SetUserFileEncryptionKey(pEncryptionCertificate: PVOID): DWORD {
    return Advapi32.Load('SetUserFileEncryptionKey')(pEncryptionCertificate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-setuserfileencryptionkeyex
  public static SetUserFileEncryptionKeyEx(pEncryptionCertificate: PVOID, dwCapabilities: DWORD, dwFlags: DWORD, pvReserved: PVOID): DWORD {
    return Advapi32.Load('SetUserFileEncryptionKeyEx')(pEncryptionCertificate, dwCapabilities, dwFlags, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-startservicea
  public static StartServiceA(hService: SC_HANDLE, dwNumServiceArgs: DWORD, lpServiceArgVectors: PVOID): BOOL {
    return Advapi32.Load('StartServiceA')(hService, dwNumServiceArgs, lpServiceArgVectors);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-startservicectrldispatchera
  public static StartServiceCtrlDispatcherA(lpServiceStartTable: PVOID): BOOL {
    return Advapi32.Load('StartServiceCtrlDispatcherA')(lpServiceStartTable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-startservicectrldispatcherw
  public static StartServiceCtrlDispatcherW(lpServiceStartTable: PVOID): BOOL {
    return Advapi32.Load('StartServiceCtrlDispatcherW')(lpServiceStartTable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-startservicew
  public static StartServiceW(hService: SC_HANDLE, dwNumServiceArgs: DWORD, lpServiceArgVectors: PVOID): BOOL {
    return Advapi32.Load('StartServiceW')(hService, dwNumServiceArgs, lpServiceArgVectors);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-starttracea
  public static StartTraceA(TraceHandle: PVOID, InstanceName: LPCSTR, Properties: PVOID): ULONG {
    return Advapi32.Load('StartTraceA')(TraceHandle, InstanceName, Properties);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-starttracew
  public static StartTraceW(TraceHandle: PVOID, InstanceName: LPCWSTR, Properties: PVOID): ULONG {
    return Advapi32.Load('StartTraceW')(TraceHandle, InstanceName, Properties);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-stoptracea
  public static StopTraceA(TraceHandle: TRACEHANDLE, InstanceName: LPCSTR, Properties: PVOID): ULONG {
    return Advapi32.Load('StopTraceA')(TraceHandle, InstanceName, Properties);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-stoptracew
  public static StopTraceW(TraceHandle: TRACEHANDLE, InstanceName: LPCWSTR, Properties: PVOID): ULONG {
    return Advapi32.Load('StopTraceW')(TraceHandle, InstanceName, Properties);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/advapi32/nf-advapi32-systemfunction017
  public static SystemFunction017(pvData: PVOID, pvKey: PVOID): NTSTATUS {
    return Advapi32.Load('SystemFunction017')(pvData, pvKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/advapi32/nf-advapi32-systemfunction019
  public static SystemFunction019(pvData: PVOID, pvKey: PVOID): NTSTATUS {
    return Advapi32.Load('SystemFunction019')(pvData, pvKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-tracesetinformation
  public static TraceSetInformation(SessionHandle: TRACEHANDLE, InformationClass: DWORD, TraceInformation: PVOID, InformationLength: ULONG): ULONG {
    return Advapi32.Load('TraceSetInformation')(SessionHandle, InformationClass, TraceInformation, InformationLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-treeresetnamedsecurityinfoa
  public static TreeResetNamedSecurityInfoA(pObjectName: LPSTR, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, pOwner: PSID, pGroup: PSID, pDacl: PACL, pSacl: PACL, KeepExplicit: BOOL, fnProgress: PVOID, ProgressInvokeSetting: DWORD, Args: PVOID): DWORD {
    return Advapi32.Load('TreeResetNamedSecurityInfoA')(pObjectName, ObjectType, SecurityInfo, pOwner, pGroup, pDacl, pSacl, KeepExplicit, fnProgress, ProgressInvokeSetting, Args);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-treeresetnamedsecurityinfow
  public static TreeResetNamedSecurityInfoW(pObjectName: LPWSTR, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, pOwner: PSID, pGroup: PSID, pDacl: PACL, pSacl: PACL, KeepExplicit: BOOL, fnProgress: PVOID, ProgressInvokeSetting: DWORD, Args: PVOID): DWORD {
    return Advapi32.Load('TreeResetNamedSecurityInfoW')(pObjectName, ObjectType, SecurityInfo, pOwner, pGroup, pDacl, pSacl, KeepExplicit, fnProgress, ProgressInvokeSetting, Args);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-treesetnamedsecurityinfoa
  public static TreeSetNamedSecurityInfoA(pObjectName: LPSTR, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, pOwner: PSID, pGroup: PSID, pDacl: PACL, pSacl: PACL, dwAction: DWORD, fnProgress: PVOID, ProgressInvokeSetting: DWORD, Args: PVOID): DWORD {
    return Advapi32.Load('TreeSetNamedSecurityInfoA')(pObjectName, ObjectType, SecurityInfo, pOwner, pGroup, pDacl, pSacl, dwAction, fnProgress, ProgressInvokeSetting, Args);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-treesetnamedsecurityinfow
  public static TreeSetNamedSecurityInfoW(pObjectName: LPWSTR, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, pOwner: PSID, pGroup: PSID, pDacl: PACL, pSacl: PACL, dwAction: DWORD, fnProgress: PVOID, ProgressInvokeSetting: DWORD, Args: PVOID): DWORD {
    return Advapi32.Load('TreeSetNamedSecurityInfoW')(pObjectName, ObjectType, SecurityInfo, pOwner, pGroup, pDacl, pSacl, dwAction, fnProgress, ProgressInvokeSetting, Args);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-trusteeaccesstoobjecta
  public static TrusteeAccessToObjectA(pObjectName: LPCSTR, ObjectType: DWORD, pTrustee: PTRUSTEE, pAccessList: PVOID, pAuditList: PVOID, pvResult: PVOID): DWORD {
    return Advapi32.Load('TrusteeAccessToObjectA')(pObjectName, ObjectType, pTrustee, pAccessList, pAuditList, pvResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-trusteeaccesstoobjectw
  public static TrusteeAccessToObjectW(pObjectName: LPCWSTR, ObjectType: DWORD, pTrustee: PTRUSTEE, pAccessList: PVOID, pAuditList: PVOID, pvResult: PVOID): DWORD {
    return Advapi32.Load('TrusteeAccessToObjectW')(pObjectName, ObjectType, pTrustee, pAccessList, pAuditList, pvResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmgmt/nf-appmgmt-uninstallapplication
  public static UninstallApplication(ProductCode: LPCWSTR, dwStatus: DWORD): DWORD {
    return Advapi32.Load('UninstallApplication')(ProductCode, dwStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-unlockservicedatabase
  public static UnlockServiceDatabase(ScLock: PVOID): BOOL {
    return Advapi32.Load('UnlockServiceDatabase')(ScLock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/advapi32/nf-advapi32-unregisteridletask
  public static UnregisterIdleTask(Guid: PVOID, pvReserved1: PVOID, pvReserved2: PVOID, pvReserved3: PVOID): DWORD {
    return Advapi32.Load('UnregisterIdleTask')(Guid, pvReserved1, pvReserved2, pvReserved3);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-updatetracea
  public static UpdateTraceA(TraceHandle: TRACEHANDLE, InstanceName: LPCSTR, Properties: PVOID): ULONG {
    return Advapi32.Load('UpdateTraceA')(TraceHandle, InstanceName, Properties);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-updatetracew
  public static UpdateTraceW(TraceHandle: TRACEHANDLE, InstanceName: LPCWSTR, Properties: PVOID): ULONG {
    return Advapi32.Load('UpdateTraceW')(TraceHandle, InstanceName, Properties);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-usepinforencryptedfilesa
  public static UsePinForEncryptedFilesA(pszPin: PVOID, dwFlags: DWORD, pvReserved: PVOID): DWORD {
    return Advapi32.Load('UsePinForEncryptedFilesA')(pszPin, dwFlags, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-usepinforencryptedfilesw
  public static UsePinForEncryptedFilesW(pszPin: PVOID, dwFlags: DWORD, pvReserved: PVOID): DWORD {
    return Advapi32.Load('UsePinForEncryptedFilesW')(pszPin, dwFlags, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-waitservicestate
  public static WaitServiceState(hService: SC_HANDLE, dwNotify: DWORD, dwTimeout: DWORD, hCancelEvent: HANDLE): DWORD {
    return Advapi32.Load('WaitServiceState')(hService, dwNotify, dwTimeout, hCancelEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmicloseblock
  public static WmiCloseBlock(DataBlockObject: HANDLE): ULONG {
    return Advapi32.Load('WmiCloseBlock')(DataBlockObject);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmidevinsttoinstancenamea
  public static WmiDevInstToInstanceNameA(InstanceName: LPSTR, cchInstanceNameLength: ULONG, szDevInst: LPCSTR, InstanceIndex: ULONG): BOOL {
    return Advapi32.Load('WmiDevInstToInstanceNameA')(InstanceName, cchInstanceNameLength, szDevInst, InstanceIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmidevinsttoinstancenamew
  public static WmiDevInstToInstanceNameW(InstanceName: LPWSTR, cchInstanceNameLength: ULONG, szDevInst: LPCWSTR, InstanceIndex: ULONG): BOOL {
    return Advapi32.Load('WmiDevInstToInstanceNameW')(InstanceName, cchInstanceNameLength, szDevInst, InstanceIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmienumerateguids
  public static WmiEnumerateGuids(GuidList: PVOID, GuidCount: PULONG): ULONG {
    return Advapi32.Load('WmiEnumerateGuids')(GuidList, GuidCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmiexecutemethoda
  public static WmiExecuteMethodA(DataBlockObject: HANDLE, InstanceName: LPCSTR, MethodId: ULONG, InputValueBufferSize: ULONG, InputValueBuffer: PVOID, OutputBufferSize: PULONG, OutputBuffer: PVOID): ULONG {
    return Advapi32.Load('WmiExecuteMethodA')(DataBlockObject, InstanceName, MethodId, InputValueBufferSize, InputValueBuffer, OutputBufferSize, OutputBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmiexecutemethodw
  public static WmiExecuteMethodW(DataBlockObject: HANDLE, InstanceName: LPCWSTR, MethodId: ULONG, InputValueBufferSize: ULONG, InputValueBuffer: PVOID, OutputBufferSize: PULONG, OutputBuffer: PVOID): ULONG {
    return Advapi32.Load('WmiExecuteMethodW')(DataBlockObject, InstanceName, MethodId, InputValueBufferSize, InputValueBuffer, OutputBufferSize, OutputBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmifilehandletoinstancenamea
  public static WmiFileHandleToInstanceNameA(DataBlockObject: HANDLE, FileHandle: HANDLE, InstanceName: PVOID, InstanceNameLength: PULONG): ULONG {
    return Advapi32.Load('WmiFileHandleToInstanceNameA')(DataBlockObject, FileHandle, InstanceName, InstanceNameLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmifilehandletoinstancenamew
  public static WmiFileHandleToInstanceNameW(DataBlockObject: HANDLE, FileHandle: HANDLE, InstanceName: PVOID, InstanceNameLength: PULONG): ULONG {
    return Advapi32.Load('WmiFileHandleToInstanceNameW')(DataBlockObject, FileHandle, InstanceName, InstanceNameLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmifreebuffer
  public static WmiFreeBuffer(Buffer: PVOID): VOID {
    return Advapi32.Load('WmiFreeBuffer')(Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmimofenumerateresourcesa
  public static WmiMofEnumerateResourcesA(MofResourceHandle: HANDLE, MofResourceCount: PULONG, MofResourceList: PVOID): ULONG {
    return Advapi32.Load('WmiMofEnumerateResourcesA')(MofResourceHandle, MofResourceCount, MofResourceList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmimofenumerateresourcesw
  public static WmiMofEnumerateResourcesW(MofResourceHandle: HANDLE, MofResourceCount: PULONG, MofResourceList: PVOID): ULONG {
    return Advapi32.Load('WmiMofEnumerateResourcesW')(MofResourceHandle, MofResourceCount, MofResourceList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wminotificationregistrationa
  public static WmiNotificationRegistrationA(DataBlockGuid: PVOID, Enable: BOOL, DeliveryInfo: PVOID, DeliveryContext: ULONG_PTR, Flags: ULONG): ULONG {
    return Advapi32.Load('WmiNotificationRegistrationA')(DataBlockGuid, Enable, DeliveryInfo, DeliveryContext, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wminotificationregistrationw
  public static WmiNotificationRegistrationW(DataBlockGuid: PVOID, Enable: BOOL, DeliveryInfo: PVOID, DeliveryContext: ULONG_PTR, Flags: ULONG): ULONG {
    return Advapi32.Load('WmiNotificationRegistrationW')(DataBlockGuid, Enable, DeliveryInfo, DeliveryContext, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmiopenblock
  public static WmiOpenBlock(DataBlockGuid: PVOID, DesiredAccess: ULONG, DataBlockObject: PVOID): ULONG {
    return Advapi32.Load('WmiOpenBlock')(DataBlockGuid, DesiredAccess, DataBlockObject);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmiqueryalldataa
  public static WmiQueryAllDataA(DataBlockObject: HANDLE, InOutBufferSize: PULONG, OutBuffer: PVOID): ULONG {
    return Advapi32.Load('WmiQueryAllDataA')(DataBlockObject, InOutBufferSize, OutBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmiqueryalldatamultiplea
  public static WmiQueryAllDataMultipleA(HandleList: PVOID, HandleCount: ULONG, InOutBufferSize: PULONG, OutBuffer: PVOID): ULONG {
    return Advapi32.Load('WmiQueryAllDataMultipleA')(HandleList, HandleCount, InOutBufferSize, OutBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmiqueryalldatamultiplew
  public static WmiQueryAllDataMultipleW(HandleList: PVOID, HandleCount: ULONG, InOutBufferSize: PULONG, OutBuffer: PVOID): ULONG {
    return Advapi32.Load('WmiQueryAllDataMultipleW')(HandleList, HandleCount, InOutBufferSize, OutBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmiqueryalldataw
  public static WmiQueryAllDataW(DataBlockObject: HANDLE, InOutBufferSize: PULONG, OutBuffer: PVOID): ULONG {
    return Advapi32.Load('WmiQueryAllDataW')(DataBlockObject, InOutBufferSize, OutBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmiqueryguidinformation
  public static WmiQueryGuidInformation(DataBlockObject: HANDLE, GuidInfo: PVOID): ULONG {
    return Advapi32.Load('WmiQueryGuidInformation')(DataBlockObject, GuidInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmiquerysingleinstancea
  public static WmiQuerySingleInstanceA(DataBlockObject: HANDLE, InstanceName: LPCSTR, InOutBufferSize: PULONG, OutBuffer: PVOID): ULONG {
    return Advapi32.Load('WmiQuerySingleInstanceA')(DataBlockObject, InstanceName, InOutBufferSize, OutBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmiquerysingleinstancemultiplea
  public static WmiQuerySingleInstanceMultipleA(HandleList: PVOID, InstanceNames: PVOID, HandleCount: ULONG, InOutBufferSize: PULONG, OutBuffer: PVOID): ULONG {
    return Advapi32.Load('WmiQuerySingleInstanceMultipleA')(HandleList, InstanceNames, HandleCount, InOutBufferSize, OutBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmiquerysingleinstancemultiplew
  public static WmiQuerySingleInstanceMultipleW(HandleList: PVOID, InstanceNames: PVOID, HandleCount: ULONG, InOutBufferSize: PULONG, OutBuffer: PVOID): ULONG {
    return Advapi32.Load('WmiQuerySingleInstanceMultipleW')(HandleList, InstanceNames, HandleCount, InOutBufferSize, OutBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmiquerysingleinstancew
  public static WmiQuerySingleInstanceW(DataBlockObject: HANDLE, InstanceName: LPCWSTR, InOutBufferSize: PULONG, OutBuffer: PVOID): ULONG {
    return Advapi32.Load('WmiQuerySingleInstanceW')(DataBlockObject, InstanceName, InOutBufferSize, OutBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmireceivenotificationsa
  public static WmiReceiveNotificationsA(HandleCount: ULONG, HandleList: PVOID, Callback: PVOID, DeliveryContext: PVOID): ULONG {
    return Advapi32.Load('WmiReceiveNotificationsA')(HandleCount, HandleList, Callback, DeliveryContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmireceivenotificationsw
  public static WmiReceiveNotificationsW(HandleCount: ULONG, HandleList: PVOID, Callback: PVOID, DeliveryContext: PVOID): ULONG {
    return Advapi32.Load('WmiReceiveNotificationsW')(HandleCount, HandleList, Callback, DeliveryContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmisetsingleinstancea
  public static WmiSetSingleInstanceA(DataBlockObject: HANDLE, InstanceName: LPCSTR, Reserved: ULONG, ValueBufferSize: ULONG, ValueBuffer: PVOID): ULONG {
    return Advapi32.Load('WmiSetSingleInstanceA')(DataBlockObject, InstanceName, Reserved, ValueBufferSize, ValueBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmisetsingleinstancew
  public static WmiSetSingleInstanceW(DataBlockObject: HANDLE, InstanceName: LPCWSTR, Reserved: ULONG, ValueBufferSize: ULONG, ValueBuffer: PVOID): ULONG {
    return Advapi32.Load('WmiSetSingleInstanceW')(DataBlockObject, InstanceName, Reserved, ValueBufferSize, ValueBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmisetsingleitema
  public static WmiSetSingleItemA(DataBlockObject: HANDLE, InstanceName: LPCSTR, DataItemId: ULONG, Reserved: ULONG, ValueBufferSize: ULONG, ValueBuffer: PVOID): ULONG {
    return Advapi32.Load('WmiSetSingleItemA')(DataBlockObject, InstanceName, DataItemId, Reserved, ValueBufferSize, ValueBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmium/nf-wmium-wmisetsingleitemw
  public static WmiSetSingleItemW(DataBlockObject: HANDLE, InstanceName: LPCWSTR, DataItemId: ULONG, Reserved: ULONG, ValueBufferSize: ULONG, ValueBuffer: PVOID): ULONG {
    return Advapi32.Load('WmiSetSingleItemW')(DataBlockObject, InstanceName, DataItemId, Reserved, ValueBufferSize, ValueBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-writeencryptedfileraw
  public static WriteEncryptedFileRaw(pfImportCallback: PVOID, pvCallbackContext: PVOID, pvContext: PVOID): DWORD {
    return Advapi32.Load('WriteEncryptedFileRaw')(pfImportCallback, pvCallbackContext, pvContext);
  }

}

export default Advapi32;
