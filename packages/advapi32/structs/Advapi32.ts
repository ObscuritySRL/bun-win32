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
  OPTIONAL,
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
  SC_LOCK,
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
    AccessCheckByTypeAndAuditAlarmA: {
      args: [
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.u64,
        FFIType.u32,
        FFIType.u32,
        FFIType.ptr,
        FFIType.u32,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.i32,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
      ],
      returns: FFIType.i32,
    },
    AccessCheckByTypeAndAuditAlarmW: {
      args: [
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.u64,
        FFIType.u32,
        FFIType.u32,
        FFIType.ptr,
        FFIType.u32,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.i32,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
      ],
      returns: FFIType.i32,
    },
    AccessCheckByTypeResultList: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AccessCheckByTypeResultListAndAuditAlarmA: {
      args: [
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.u64,
        FFIType.u32,
        FFIType.u32,
        FFIType.ptr,
        FFIType.u32,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.i32,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
      ],
      returns: FFIType.i32,
    },
    AccessCheckByTypeResultListAndAuditAlarmByHandleA: {
      args: [
        FFIType.ptr,
        FFIType.ptr,
        FFIType.u64,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.u64,
        FFIType.u32,
        FFIType.u32,
        FFIType.ptr,
        FFIType.u32,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.i32,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
      ],
      returns: FFIType.i32,
    },
    AccessCheckByTypeResultListAndAuditAlarmByHandleW: {
      args: [
        FFIType.ptr,
        FFIType.ptr,
        FFIType.u64,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.u64,
        FFIType.u32,
        FFIType.u32,
        FFIType.ptr,
        FFIType.u32,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.i32,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
      ],
      returns: FFIType.i32,
    },
    AccessCheckByTypeResultListAndAuditAlarmW: {
      args: [
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.u64,
        FFIType.u32,
        FFIType.u32,
        FFIType.ptr,
        FFIType.u32,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.i32,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
      ],
      returns: FFIType.i32,
    },
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
    GetMultipleTrusteeA: { args: [FFIType.ptr], returns: FFIType.ptr },
    GetMultipleTrusteeOperationA: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetMultipleTrusteeOperationW: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetMultipleTrusteeW: { args: [FFIType.ptr], returns: FFIType.ptr },
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
  public static AbortSystemShutdownA(lpMachineName: OPTIONAL<LPCSTR>): BOOL {
    return Advapi32.Load('AbortSystemShutdownA')(lpMachineName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-abortsystemshutdownw
  public static AbortSystemShutdownW(lpMachineName: OPTIONAL<LPCWSTR>): BOOL {
    return Advapi32.Load('AbortSystemShutdownW')(lpMachineName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-accesscheck
  public static AccessCheck(
    pSecurityDescriptor: PSECURITY_DESCRIPTOR,
    ClientToken: HANDLE,
    DesiredAccess: DWORD,
    GenericMapping: PGENERIC_MAPPING,
    PrivilegeSet_out: OPTIONAL<PPRIVILEGE_SET>,
    PrivilegeSetLength_in_out: LPDWORD,
    GrantedAccess_out: LPDWORD,
    AccessStatus_out: LPBOOL,
  ): BOOL {
    return Advapi32.Load('AccessCheck')(pSecurityDescriptor, ClientToken, DesiredAccess, GenericMapping, PrivilegeSet_out, PrivilegeSetLength_in_out, GrantedAccess_out, AccessStatus_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-accesscheckandauditalarma
  public static AccessCheckAndAuditAlarmA(
    SubsystemName: LPCSTR,
    HandleId: OPTIONAL<LPVOID>,
    ObjectTypeName: LPSTR,
    ObjectName: OPTIONAL<LPSTR>,
    SecurityDescriptor: PSECURITY_DESCRIPTOR,
    DesiredAccess: DWORD,
    GenericMapping: PGENERIC_MAPPING,
    ObjectCreation: BOOL,
    GrantedAccess_out: LPDWORD,
    AccessStatus_out: LPBOOL,
    pfGenerateOnClose_out: LPBOOL,
  ): BOOL {
    return Advapi32.Load('AccessCheckAndAuditAlarmA')(SubsystemName, HandleId, ObjectTypeName, ObjectName, SecurityDescriptor, DesiredAccess, GenericMapping, ObjectCreation, GrantedAccess_out, AccessStatus_out, pfGenerateOnClose_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-accesscheckandauditalarmw
  public static AccessCheckAndAuditAlarmW(
    SubsystemName: LPCWSTR,
    HandleId: OPTIONAL<LPVOID>,
    ObjectTypeName: LPWSTR,
    ObjectName: OPTIONAL<LPWSTR>,
    SecurityDescriptor: PSECURITY_DESCRIPTOR,
    DesiredAccess: DWORD,
    GenericMapping: PGENERIC_MAPPING,
    ObjectCreation: BOOL,
    GrantedAccess_out: LPDWORD,
    AccessStatus_out: LPBOOL,
    pfGenerateOnClose_out: LPBOOL,
  ): BOOL {
    return Advapi32.Load('AccessCheckAndAuditAlarmW')(SubsystemName, HandleId, ObjectTypeName, ObjectName, SecurityDescriptor, DesiredAccess, GenericMapping, ObjectCreation, GrantedAccess_out, AccessStatus_out, pfGenerateOnClose_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-accesscheckbytype
  public static AccessCheckByType(
    pSecurityDescriptor: PSECURITY_DESCRIPTOR,
    PrincipalSelfSid: OPTIONAL<PSID>,
    ClientToken: HANDLE,
    DesiredAccess: DWORD,
    ObjectTypeList_in_out: OPTIONAL<POBJECT_TYPE_LIST>,
    ObjectTypeListLength: DWORD,
    GenericMapping: PGENERIC_MAPPING,
    PrivilegeSet_out: OPTIONAL<PPRIVILEGE_SET>,
    PrivilegeSetLength_in_out: LPDWORD,
    GrantedAccess_out: LPDWORD,
    AccessStatus_out: LPBOOL,
  ): BOOL {
    return Advapi32.Load('AccessCheckByType')(
      pSecurityDescriptor,
      PrincipalSelfSid,
      ClientToken,
      DesiredAccess,
      ObjectTypeList_in_out,
      ObjectTypeListLength,
      GenericMapping,
      PrivilegeSet_out,
      PrivilegeSetLength_in_out,
      GrantedAccess_out,
      AccessStatus_out,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-accesscheckbytypeandauditalarma
  public static AccessCheckByTypeAndAuditAlarmA(
    SubsystemName: LPCSTR,
    HandleId: LPVOID,
    ObjectTypeName: LPCSTR,
    ObjectName: OPTIONAL<LPCSTR>,
    SecurityDescriptor: PSECURITY_DESCRIPTOR,
    PrincipalSelfSid: OPTIONAL<PSID>,
    ClientToken: HANDLE,
    DesiredAccess: DWORD,
    AuditType: AUDIT_EVENT_TYPE,
    ObjectTypeList_in_out: OPTIONAL<POBJECT_TYPE_LIST>,
    ObjectTypeListLength: DWORD,
    GenericMapping: PGENERIC_MAPPING,
    PrivilegeSet: PPRIVILEGE_SET,
    PrivilegeSetLength: LPDWORD,
    ObjectCreation: BOOL,
    GrantedAccess_out: LPDWORD,
    AccessStatus_out: LPBOOL,
    pfGenerateOnClose_out: LPBOOL,
  ): BOOL {
    return Advapi32.Load('AccessCheckByTypeAndAuditAlarmA')(
      SubsystemName,
      HandleId,
      ObjectTypeName,
      ObjectName,
      SecurityDescriptor,
      PrincipalSelfSid,
      ClientToken,
      DesiredAccess,
      AuditType,
      ObjectTypeList_in_out,
      ObjectTypeListLength,
      GenericMapping,
      PrivilegeSet,
      PrivilegeSetLength,
      ObjectCreation,
      GrantedAccess_out,
      AccessStatus_out,
      pfGenerateOnClose_out,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-accesscheckbytypeandauditalarmw
  public static AccessCheckByTypeAndAuditAlarmW(
    SubsystemName: LPCWSTR,
    HandleId: LPVOID,
    ObjectTypeName: LPCWSTR,
    ObjectName: OPTIONAL<LPCWSTR>,
    SecurityDescriptor: PSECURITY_DESCRIPTOR,
    PrincipalSelfSid: OPTIONAL<PSID>,
    ClientToken: HANDLE,
    DesiredAccess: DWORD,
    AuditType: AUDIT_EVENT_TYPE,
    ObjectTypeList_in_out: OPTIONAL<POBJECT_TYPE_LIST>,
    ObjectTypeListLength: DWORD,
    GenericMapping: PGENERIC_MAPPING,
    PrivilegeSet: PPRIVILEGE_SET,
    PrivilegeSetLength: LPDWORD,
    ObjectCreation: BOOL,
    GrantedAccess_out: LPDWORD,
    AccessStatus_out: LPBOOL,
    pfGenerateOnClose_out: LPBOOL,
  ): BOOL {
    return Advapi32.Load('AccessCheckByTypeAndAuditAlarmW')(
      SubsystemName,
      HandleId,
      ObjectTypeName,
      ObjectName,
      SecurityDescriptor,
      PrincipalSelfSid,
      ClientToken,
      DesiredAccess,
      AuditType,
      ObjectTypeList_in_out,
      ObjectTypeListLength,
      GenericMapping,
      PrivilegeSet,
      PrivilegeSetLength,
      ObjectCreation,
      GrantedAccess_out,
      AccessStatus_out,
      pfGenerateOnClose_out,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-accesscheckbytyperesultlist
  public static AccessCheckByTypeResultList(
    pSecurityDescriptor: PSECURITY_DESCRIPTOR,
    PrincipalSelfSid: OPTIONAL<PSID>,
    ClientToken: HANDLE,
    DesiredAccess: DWORD,
    ObjectTypeList_in_out: OPTIONAL<POBJECT_TYPE_LIST>,
    ObjectTypeListLength: DWORD,
    GenericMapping: PGENERIC_MAPPING,
    PrivilegeSet_out: OPTIONAL<PPRIVILEGE_SET>,
    PrivilegeSetLength_in_out: LPDWORD,
    GrantedAccessList_out: LPDWORD,
    AccessStatusList_out: LPDWORD,
  ): BOOL {
    return Advapi32.Load('AccessCheckByTypeResultList')(
      pSecurityDescriptor,
      PrincipalSelfSid,
      ClientToken,
      DesiredAccess,
      ObjectTypeList_in_out,
      ObjectTypeListLength,
      GenericMapping,
      PrivilegeSet_out,
      PrivilegeSetLength_in_out,
      GrantedAccessList_out,
      AccessStatusList_out,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-accesscheckbytyperesultlistandauditalarma
  public static AccessCheckByTypeResultListAndAuditAlarmA(
    SubsystemName: LPCSTR,
    HandleId: LPVOID,
    ObjectTypeName: LPCSTR,
    ObjectName: OPTIONAL<LPCSTR>,
    SecurityDescriptor: PSECURITY_DESCRIPTOR,
    PrincipalSelfSid: OPTIONAL<PSID>,
    ClientToken: HANDLE,
    DesiredAccess: DWORD,
    AuditType: AUDIT_EVENT_TYPE,
    ObjectTypeList_in_out: OPTIONAL<POBJECT_TYPE_LIST>,
    ObjectTypeListLength: DWORD,
    GenericMapping: PGENERIC_MAPPING,
    PrivilegeSet: PPRIVILEGE_SET,
    PrivilegeSetLength: LPDWORD,
    ObjectCreation: BOOL,
    GrantedAccessList: LPDWORD,
    AccessStatusList_out: LPDWORD,
    pfGenerateOnClose_out: LPBOOL,
  ): BOOL {
    return Advapi32.Load('AccessCheckByTypeResultListAndAuditAlarmA')(
      SubsystemName,
      HandleId,
      ObjectTypeName,
      ObjectName,
      SecurityDescriptor,
      PrincipalSelfSid,
      ClientToken,
      DesiredAccess,
      AuditType,
      ObjectTypeList_in_out,
      ObjectTypeListLength,
      GenericMapping,
      PrivilegeSet,
      PrivilegeSetLength,
      ObjectCreation,
      GrantedAccessList,
      AccessStatusList_out,
      pfGenerateOnClose_out,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-accesscheckbytyperesultlistandauditalarmbyhandlea
  public static AccessCheckByTypeResultListAndAuditAlarmByHandleA(
    SubsystemName: LPCSTR,
    HandleId: LPVOID,
    ClientToken: HANDLE,
    ObjectTypeName: LPCSTR,
    ObjectName: OPTIONAL<LPCSTR>,
    SecurityDescriptor: PSECURITY_DESCRIPTOR,
    PrincipalSelfSid: OPTIONAL<PSID>,
    ClientToken2: HANDLE,
    DesiredAccess: DWORD,
    AuditType: AUDIT_EVENT_TYPE,
    ObjectTypeList_in_out: OPTIONAL<POBJECT_TYPE_LIST>,
    ObjectTypeListLength: DWORD,
    GenericMapping: PGENERIC_MAPPING,
    PrivilegeSet: PPRIVILEGE_SET,
    PrivilegeSetLength: LPDWORD,
    ObjectCreation: BOOL,
    GrantedAccessList: LPDWORD,
    AccessStatusList_out: LPDWORD,
    pfGenerateOnClose_out: LPBOOL,
  ): BOOL {
    return Advapi32.Load('AccessCheckByTypeResultListAndAuditAlarmByHandleA')(
      SubsystemName,
      HandleId,
      ClientToken,
      ObjectTypeName,
      ObjectName,
      SecurityDescriptor,
      PrincipalSelfSid,
      ClientToken2,
      DesiredAccess,
      AuditType,
      ObjectTypeList_in_out,
      ObjectTypeListLength,
      GenericMapping,
      PrivilegeSet,
      PrivilegeSetLength,
      ObjectCreation,
      GrantedAccessList,
      AccessStatusList_out,
      pfGenerateOnClose_out,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-accesscheckbytyperesultlistandauditalarmbyhandlew
  public static AccessCheckByTypeResultListAndAuditAlarmByHandleW(
    SubsystemName: LPCWSTR,
    HandleId: LPVOID,
    ClientToken: HANDLE,
    ObjectTypeName: LPCWSTR,
    ObjectName: OPTIONAL<LPCWSTR>,
    SecurityDescriptor: PSECURITY_DESCRIPTOR,
    PrincipalSelfSid: OPTIONAL<PSID>,
    ClientToken2: HANDLE,
    DesiredAccess: DWORD,
    AuditType: AUDIT_EVENT_TYPE,
    ObjectTypeList_in_out: OPTIONAL<POBJECT_TYPE_LIST>,
    ObjectTypeListLength: DWORD,
    GenericMapping: PGENERIC_MAPPING,
    PrivilegeSet: PPRIVILEGE_SET,
    PrivilegeSetLength: LPDWORD,
    ObjectCreation: BOOL,
    GrantedAccessList_out: LPDWORD,
    AccessStatusList_out: LPDWORD,
    pfGenerateOnClose_out: LPBOOL,
  ): BOOL {
    return Advapi32.Load('AccessCheckByTypeResultListAndAuditAlarmByHandleW')(
      SubsystemName,
      HandleId,
      ClientToken,
      ObjectTypeName,
      ObjectName,
      SecurityDescriptor,
      PrincipalSelfSid,
      ClientToken2,
      DesiredAccess,
      AuditType,
      ObjectTypeList_in_out,
      ObjectTypeListLength,
      GenericMapping,
      PrivilegeSet,
      PrivilegeSetLength,
      ObjectCreation,
      GrantedAccessList_out,
      AccessStatusList_out,
      pfGenerateOnClose_out,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-accesscheckbytyperesultlistandauditalarmw
  public static AccessCheckByTypeResultListAndAuditAlarmW(
    SubsystemName: LPCWSTR,
    HandleId: LPVOID,
    ObjectTypeName: LPCWSTR,
    ObjectName: OPTIONAL<LPCWSTR>,
    SecurityDescriptor: PSECURITY_DESCRIPTOR,
    PrincipalSelfSid: OPTIONAL<PSID>,
    ClientToken: HANDLE,
    DesiredAccess: DWORD,
    AuditType: AUDIT_EVENT_TYPE,
    ObjectTypeList_in_out: OPTIONAL<POBJECT_TYPE_LIST>,
    ObjectTypeListLength: DWORD,
    GenericMapping: PGENERIC_MAPPING,
    PrivilegeSet: PPRIVILEGE_SET,
    PrivilegeSetLength: LPDWORD,
    ObjectCreation: BOOL,
    GrantedAccessList_out: LPDWORD,
    AccessStatusList_out: LPDWORD,
    pfGenerateOnClose_out: LPBOOL,
  ): BOOL {
    return Advapi32.Load('AccessCheckByTypeResultListAndAuditAlarmW')(
      SubsystemName,
      HandleId,
      ObjectTypeName,
      ObjectName,
      SecurityDescriptor,
      PrincipalSelfSid,
      ClientToken,
      DesiredAccess,
      AuditType,
      ObjectTypeList_in_out,
      ObjectTypeListLength,
      GenericMapping,
      PrivilegeSet,
      PrivilegeSetLength,
      ObjectCreation,
      GrantedAccessList_out,
      AccessStatusList_out,
      pfGenerateOnClose_out,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addaccessallowedace
  public static AddAccessAllowedAce(pAcl_in_out: PACL, dwAceRevision: DWORD, AccessMask: DWORD, pSid: PSID): BOOL {
    return Advapi32.Load('AddAccessAllowedAce')(pAcl_in_out, dwAceRevision, AccessMask, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addaccessallowedaceex
  public static AddAccessAllowedAceEx(pAcl_in_out: PACL, dwAceRevision: DWORD, AceFlags: DWORD, AccessMask: DWORD, pSid: PSID): BOOL {
    return Advapi32.Load('AddAccessAllowedAceEx')(pAcl_in_out, dwAceRevision, AceFlags, AccessMask, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addaccessallowedobjectace
  public static AddAccessAllowedObjectAce(pAcl_in_out: PACL, dwAceRevision: DWORD, AceFlags: DWORD, AccessMask: DWORD, ObjectTypeGuid: OPTIONAL<PVOID>, InheritedObjectTypeGuid: OPTIONAL<PVOID>, pSid: PSID): BOOL {
    return Advapi32.Load('AddAccessAllowedObjectAce')(pAcl_in_out, dwAceRevision, AceFlags, AccessMask, ObjectTypeGuid, InheritedObjectTypeGuid, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addaccessdeniedace
  public static AddAccessDeniedAce(pAcl_in_out: PACL, dwAceRevision: DWORD, AccessMask: DWORD, pSid: PSID): BOOL {
    return Advapi32.Load('AddAccessDeniedAce')(pAcl_in_out, dwAceRevision, AccessMask, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addaccessdeniedaceex
  public static AddAccessDeniedAceEx(pAcl_in_out: PACL, dwAceRevision: DWORD, AceFlags: DWORD, AccessMask: DWORD, pSid: PSID): BOOL {
    return Advapi32.Load('AddAccessDeniedAceEx')(pAcl_in_out, dwAceRevision, AceFlags, AccessMask, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addaccessdeniedobjectace
  public static AddAccessDeniedObjectAce(pAcl_in_out: PACL, dwAceRevision: DWORD, AceFlags: DWORD, AccessMask: DWORD, ObjectTypeGuid: OPTIONAL<PVOID>, InheritedObjectTypeGuid: OPTIONAL<PVOID>, pSid: PSID): BOOL {
    return Advapi32.Load('AddAccessDeniedObjectAce')(pAcl_in_out, dwAceRevision, AceFlags, AccessMask, ObjectTypeGuid, InheritedObjectTypeGuid, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addace
  public static AddAce(pAcl_in_out: PACL, dwAceRevision: DWORD, dwStartingAceIndex: DWORD, pAceList: LPVOID, nAceListLength: DWORD): BOOL {
    return Advapi32.Load('AddAce')(pAcl_in_out, dwAceRevision, dwStartingAceIndex, pAceList, nAceListLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addauditaccessace
  public static AddAuditAccessAce(pAcl_in_out: PACL, dwAceRevision: DWORD, dwAccessMask: DWORD, pSid: PSID, bAuditSuccess: BOOL, bAuditFailure: BOOL): BOOL {
    return Advapi32.Load('AddAuditAccessAce')(pAcl_in_out, dwAceRevision, dwAccessMask, pSid, bAuditSuccess, bAuditFailure);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addauditaccessaceex
  public static AddAuditAccessAceEx(pAcl_in_out: PACL, dwAceRevision: DWORD, AceFlags: DWORD, dwAccessMask: DWORD, pSid: PSID, bAuditSuccess: BOOL, bAuditFailure: BOOL): BOOL {
    return Advapi32.Load('AddAuditAccessAceEx')(pAcl_in_out, dwAceRevision, AceFlags, dwAccessMask, pSid, bAuditSuccess, bAuditFailure);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addauditaccessobjectace
  public static AddAuditAccessObjectAce(
    pAcl_in_out: PACL,
    dwAceRevision: DWORD,
    AceFlags: DWORD,
    AccessMask: DWORD,
    ObjectTypeGuid: OPTIONAL<PVOID>,
    InheritedObjectTypeGuid: OPTIONAL<PVOID>,
    pSid: PSID,
    bAuditSuccess: BOOL,
    bAuditFailure: BOOL,
  ): BOOL {
    return Advapi32.Load('AddAuditAccessObjectAce')(pAcl_in_out, dwAceRevision, AceFlags, AccessMask, ObjectTypeGuid, InheritedObjectTypeGuid, pSid, bAuditSuccess, bAuditFailure);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-addconditionalace
  public static AddConditionalAce(pAcl_in_out: PACL, dwAceRevision: DWORD, AceFlags: DWORD, AceType: BYTE, AccessMask: DWORD, pSid: PSID, ConditionStr: LPCWSTR, ReturnLength_out: LPDWORD): BOOL {
    return Advapi32.Load('AddConditionalAce')(pAcl_in_out, dwAceRevision, AceFlags, AceType, AccessMask, pSid, ConditionStr, ReturnLength_out);
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
  public static AdjustTokenGroups(TokenHandle: HANDLE, ResetToDefault: BOOL, NewState: OPTIONAL<PTOKEN_GROUPS>, BufferLength: DWORD, PreviousState_out: OPTIONAL<PTOKEN_GROUPS>, ReturnLength_out: OPTIONAL<LPDWORD>): BOOL {
    return Advapi32.Load('AdjustTokenGroups')(TokenHandle, ResetToDefault, NewState, BufferLength, PreviousState_out, ReturnLength_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-adjusttokenprivileges
  public static AdjustTokenPrivileges(TokenHandle: HANDLE, DisableAllPrivileges: BOOL, NewState: OPTIONAL<PTOKEN_PRIVILEGES>, BufferLength: DWORD, PreviousState_out: OPTIONAL<PTOKEN_PRIVILEGES>, ReturnLength_out: OPTIONAL<LPDWORD>): BOOL {
    return Advapi32.Load('AdjustTokenPrivileges')(TokenHandle, DisableAllPrivileges, NewState, BufferLength, PreviousState_out, ReturnLength_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-allocateandinitializesid
  public static AllocateAndInitializeSid(
    pIdentifierAuthority: PSID_IDENTIFIER_AUTHORITY,
    nSubAuthorityCount: BYTE,
    nSubAuthority0: DWORD,
    nSubAuthority1: DWORD,
    nSubAuthority2: DWORD,
    nSubAuthority3: DWORD,
    nSubAuthority4: DWORD,
    nSubAuthority5: DWORD,
    nSubAuthority6: DWORD,
    nSubAuthority7: DWORD,
    pSid_out: PVOID,
  ): BOOL {
    return Advapi32.Load('AllocateAndInitializeSid')(pIdentifierAuthority, nSubAuthorityCount, nSubAuthority0, nSubAuthority1, nSubAuthority2, nSubAuthority3, nSubAuthority4, nSubAuthority5, nSubAuthority6, nSubAuthority7, pSid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-allocatelocallyuniqueid
  public static AllocateLocallyUniqueId(Luid_out: PVOID): BOOL {
    return Advapi32.Load('AllocateLocallyUniqueId')(Luid_out);
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
  public static AuditComputeEffectivePolicyBySid(pSid: PSID, pSubCategoryGuids: PVOID, dwPolicyCount: ULONG, ppAuditPolicy_out: PVOID): BOOL {
    return Advapi32.Load('AuditComputeEffectivePolicyBySid')(pSid, pSubCategoryGuids, dwPolicyCount, ppAuditPolicy_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditcomputeeffectivepolicybytoken
  public static AuditComputeEffectivePolicyByToken(hTokenHandle: HANDLE, pSubCategoryGuids: PVOID, dwPolicyCount: ULONG, ppAuditPolicy_out: PVOID): BOOL {
    return Advapi32.Load('AuditComputeEffectivePolicyByToken')(hTokenHandle, pSubCategoryGuids, dwPolicyCount, ppAuditPolicy_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditenumeratecategories
  public static AuditEnumerateCategories(ppAuditCategoriesArray_out: PVOID, pdwCountReturned_out: PDWORD): BOOL {
    return Advapi32.Load('AuditEnumerateCategories')(ppAuditCategoriesArray_out, pdwCountReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditenumerateperuserpolicy
  public static AuditEnumeratePerUserPolicy(ppAuditSidArray_out: PVOID): BOOL {
    return Advapi32.Load('AuditEnumeratePerUserPolicy')(ppAuditSidArray_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditenumeratesubcategories
  public static AuditEnumerateSubCategories(pAuditCategoryGuid: OPTIONAL<PVOID>, bRetrieveAllSubCategories: BOOL, ppAuditSubCategoriesArray_out: PVOID, pdwCountReturned_out: PDWORD): BOOL {
    return Advapi32.Load('AuditEnumerateSubCategories')(pAuditCategoryGuid, bRetrieveAllSubCategories, ppAuditSubCategoriesArray_out, pdwCountReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditfree
  public static AuditFree(Buffer: PVOID): VOID {
    return Advapi32.Load('AuditFree')(Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditlookupcategoryguidfromcategoryid
  public static AuditLookupCategoryGuidFromCategoryId(AuditCategoryId: DWORD, pAuditCategoryGuid_out: PVOID): BOOL {
    return Advapi32.Load('AuditLookupCategoryGuidFromCategoryId')(AuditCategoryId, pAuditCategoryGuid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditlookupcategoryidfromcategoryguid
  public static AuditLookupCategoryIdFromCategoryGuid(pAuditCategoryGuid: PVOID, pAuditCategoryId_out: PVOID): BOOL {
    return Advapi32.Load('AuditLookupCategoryIdFromCategoryGuid')(pAuditCategoryGuid, pAuditCategoryId_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditlookupcategorynamea
  public static AuditLookupCategoryNameA(pAuditCategoryGuid: PVOID, ppszCategoryName_out: PVOID): BOOL {
    return Advapi32.Load('AuditLookupCategoryNameA')(pAuditCategoryGuid, ppszCategoryName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditlookupcategorynamew
  public static AuditLookupCategoryNameW(pAuditCategoryGuid: PVOID, ppszCategoryName_out: PVOID): BOOL {
    return Advapi32.Load('AuditLookupCategoryNameW')(pAuditCategoryGuid, ppszCategoryName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditlookupsubcategorynamea
  public static AuditLookupSubCategoryNameA(pAuditSubCategoryGuid: PVOID, ppszSubCategoryName_out: PVOID): BOOL {
    return Advapi32.Load('AuditLookupSubCategoryNameA')(pAuditSubCategoryGuid, ppszSubCategoryName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditlookupsubcategorynamew
  public static AuditLookupSubCategoryNameW(pAuditSubCategoryGuid: PVOID, ppszSubCategoryName_out: PVOID): BOOL {
    return Advapi32.Load('AuditLookupSubCategoryNameW')(pAuditSubCategoryGuid, ppszSubCategoryName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditqueryglobalsacla
  public static AuditQueryGlobalSaclA(ObjectTypeName: LPCSTR, Acl_out: PVOID): BOOL {
    return Advapi32.Load('AuditQueryGlobalSaclA')(ObjectTypeName, Acl_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditqueryglobalsaclw
  public static AuditQueryGlobalSaclW(ObjectTypeName: LPCWSTR, Acl_out: PVOID): BOOL {
    return Advapi32.Load('AuditQueryGlobalSaclW')(ObjectTypeName, Acl_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditqueryperuserpolicy
  public static AuditQueryPerUserPolicy(pSid: PSID, pSubCategoryGuids: PVOID, dwPolicyCount: ULONG, ppAuditPolicy_out: PVOID): BOOL {
    return Advapi32.Load('AuditQueryPerUserPolicy')(pSid, pSubCategoryGuids, dwPolicyCount, ppAuditPolicy_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditquerysecurity
  public static AuditQuerySecurity(SecurityInformation: SECURITY_INFORMATION, ppSecurityDescriptor_out: PVOID): BOOL {
    return Advapi32.Load('AuditQuerySecurity')(SecurityInformation, ppSecurityDescriptor_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditquerysystempolicy
  public static AuditQuerySystemPolicy(pSubCategoryGuids: PVOID, dwPolicyCount: ULONG, ppAuditPolicy_out: PVOID): BOOL {
    return Advapi32.Load('AuditQuerySystemPolicy')(pSubCategoryGuids, dwPolicyCount, ppAuditPolicy_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditsetglobalsacla
  public static AuditSetGlobalSaclA(ObjectTypeName: LPCSTR, Acl: OPTIONAL<PACL>): BOOL {
    return Advapi32.Load('AuditSetGlobalSaclA')(ObjectTypeName, Acl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-auditsetglobalsaclw
  public static AuditSetGlobalSaclW(ObjectTypeName: LPCWSTR, Acl: OPTIONAL<PACL>): BOOL {
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
  public static BaseRegCreateKey(
    hKey: PVOID,
    lpSubKey: PVOID,
    lpClass: PVOID,
    dwOptions: DWORD,
    lpSecurityAttributes: PVOID,
    samDesired: REGSAM,
    Reserved: DWORD,
    phkResult: PVOID,
    lpdwDisposition: LPDWORD,
    pExtendedParameter: PVOID,
  ): LSTATUS {
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
  public static BuildExplicitAccessWithNameA(pExplicitAccess_in_out: PEXPLICIT_ACCESSA, pTrusteeName: OPTIONAL<LPSTR>, AccessPermissions: DWORD, AccessMode: DWORD, Inheritance: DWORD): VOID {
    return Advapi32.Load('BuildExplicitAccessWithNameA')(pExplicitAccess_in_out, pTrusteeName, AccessPermissions, AccessMode, Inheritance);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildexplicitaccesswithnamew
  public static BuildExplicitAccessWithNameW(pExplicitAccess_in_out: PEXPLICIT_ACCESSW, pTrusteeName: OPTIONAL<LPWSTR>, AccessPermissions: DWORD, AccessMode: DWORD, Inheritance: DWORD): VOID {
    return Advapi32.Load('BuildExplicitAccessWithNameW')(pExplicitAccess_in_out, pTrusteeName, AccessPermissions, AccessMode, Inheritance);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildimpersonateexplicitaccesswithnamea
  public static BuildImpersonateExplicitAccessWithNameA(pExplicitAccess_in_out: PEXPLICIT_ACCESSA, pTrusteeName: OPTIONAL<LPSTR>, pTrustee: OPTIONAL<PTRUSTEE>, AccessPermissions: DWORD, AccessMode: DWORD, Inheritance: DWORD): VOID {
    return Advapi32.Load('BuildImpersonateExplicitAccessWithNameA')(pExplicitAccess_in_out, pTrusteeName, pTrustee, AccessPermissions, AccessMode, Inheritance);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildimpersonateexplicitaccesswithnamew
  public static BuildImpersonateExplicitAccessWithNameW(pExplicitAccess_in_out: PEXPLICIT_ACCESSW, pTrusteeName: OPTIONAL<LPWSTR>, pTrustee: OPTIONAL<PTRUSTEE>, AccessPermissions: DWORD, AccessMode: DWORD, Inheritance: DWORD): VOID {
    return Advapi32.Load('BuildImpersonateExplicitAccessWithNameW')(pExplicitAccess_in_out, pTrusteeName, pTrustee, AccessPermissions, AccessMode, Inheritance);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildimpersonatetrusteea
  public static BuildImpersonateTrusteeA(pTrustee_in_out: PTRUSTEE, pImpersonateTrustee: OPTIONAL<PTRUSTEE>): VOID {
    return Advapi32.Load('BuildImpersonateTrusteeA')(pTrustee_in_out, pImpersonateTrustee);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildimpersonatetrusteew
  public static BuildImpersonateTrusteeW(pTrustee_in_out: PTRUSTEE, pImpersonateTrustee: OPTIONAL<PTRUSTEE>): VOID {
    return Advapi32.Load('BuildImpersonateTrusteeW')(pTrustee_in_out, pImpersonateTrustee);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildsecuritydescriptora
  public static BuildSecurityDescriptorA(
    pOwner: OPTIONAL<PTRUSTEE>,
    pGroup: OPTIONAL<PTRUSTEE>,
    cCountOfAccessEntries: ULONG,
    pListOfAccessEntries: OPTIONAL<PEXPLICIT_ACCESSA>,
    cCountOfAuditEntries: ULONG,
    pListOfAuditEntries: OPTIONAL<PEXPLICIT_ACCESSA>,
    pOldSD: OPTIONAL<PSECURITY_DESCRIPTOR>,
    pSizeNewSD_out: PULONG,
    ppNewSD_out: PVOID,
  ): DWORD {
    return Advapi32.Load('BuildSecurityDescriptorA')(pOwner, pGroup, cCountOfAccessEntries, pListOfAccessEntries, cCountOfAuditEntries, pListOfAuditEntries, pOldSD, pSizeNewSD_out, ppNewSD_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildsecuritydescriptorw
  public static BuildSecurityDescriptorW(
    pOwner: OPTIONAL<PTRUSTEE>,
    pGroup: OPTIONAL<PTRUSTEE>,
    cCountOfAccessEntries: ULONG,
    pListOfAccessEntries: OPTIONAL<PEXPLICIT_ACCESSW>,
    cCountOfAuditEntries: ULONG,
    pListOfAuditEntries: OPTIONAL<PEXPLICIT_ACCESSW>,
    pOldSD: OPTIONAL<PSECURITY_DESCRIPTOR>,
    pSizeNewSD_out: PULONG,
    ppNewSD_out: PVOID,
  ): DWORD {
    return Advapi32.Load('BuildSecurityDescriptorW')(pOwner, pGroup, cCountOfAccessEntries, pListOfAccessEntries, cCountOfAuditEntries, pListOfAuditEntries, pOldSD, pSizeNewSD_out, ppNewSD_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildtrusteewithnamea
  public static BuildTrusteeWithNameA(pTrustee_in_out: PTRUSTEE, pName: OPTIONAL<LPSTR>): VOID {
    return Advapi32.Load('BuildTrusteeWithNameA')(pTrustee_in_out, pName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildtrusteewithnamew
  public static BuildTrusteeWithNameW(pTrustee_in_out: PTRUSTEE, pName: OPTIONAL<LPWSTR>): VOID {
    return Advapi32.Load('BuildTrusteeWithNameW')(pTrustee_in_out, pName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildtrusteewithobjectsandnamea
  public static BuildTrusteeWithObjectsAndNameA(pTrustee_in_out: PTRUSTEE, pObjName: OPTIONAL<PVOID>, ObjectType: DWORD, ObjectTypeName: OPTIONAL<LPSTR>, InheritedObjectTypeName: OPTIONAL<LPSTR>, Name: OPTIONAL<LPSTR>): VOID {
    return Advapi32.Load('BuildTrusteeWithObjectsAndNameA')(pTrustee_in_out, pObjName, ObjectType, ObjectTypeName, InheritedObjectTypeName, Name);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildtrusteewithobjectsandnamew
  public static BuildTrusteeWithObjectsAndNameW(pTrustee_in_out: PTRUSTEE, pObjName: OPTIONAL<PVOID>, ObjectType: DWORD, ObjectTypeName: OPTIONAL<LPWSTR>, InheritedObjectTypeName: OPTIONAL<LPWSTR>, Name: OPTIONAL<LPWSTR>): VOID {
    return Advapi32.Load('BuildTrusteeWithObjectsAndNameW')(pTrustee_in_out, pObjName, ObjectType, ObjectTypeName, InheritedObjectTypeName, Name);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildtrusteewithobjectsandsida
  public static BuildTrusteeWithObjectsAndSidA(pTrustee_in_out: PTRUSTEE, pObjSid: OPTIONAL<PVOID>, pObjectGuid: OPTIONAL<PVOID>, pInheritedObjectGuid: OPTIONAL<PVOID>, pSid: OPTIONAL<PSID>): VOID {
    return Advapi32.Load('BuildTrusteeWithObjectsAndSidA')(pTrustee_in_out, pObjSid, pObjectGuid, pInheritedObjectGuid, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildtrusteewithobjectsandsidw
  public static BuildTrusteeWithObjectsAndSidW(pTrustee_in_out: PTRUSTEE, pObjSid: OPTIONAL<PVOID>, pObjectGuid: OPTIONAL<PVOID>, pInheritedObjectGuid: OPTIONAL<PVOID>, pSid: OPTIONAL<PSID>): VOID {
    return Advapi32.Load('BuildTrusteeWithObjectsAndSidW')(pTrustee_in_out, pObjSid, pObjectGuid, pInheritedObjectGuid, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildtrusteewithsida
  public static BuildTrusteeWithSidA(pTrustee_in_out: PTRUSTEE, pSid: OPTIONAL<PSID>): VOID {
    return Advapi32.Load('BuildTrusteeWithSidA')(pTrustee_in_out, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-buildtrusteewithsidw
  public static BuildTrusteeWithSidW(pTrustee_in_out: PTRUSTEE, pSid: OPTIONAL<PSID>): VOID {
    return Advapi32.Load('BuildTrusteeWithSidW')(pTrustee_in_out, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-canceloverlappedaccess
  public static CancelOverlappedAccess(pOverlapped: PVOID): DWORD {
    return Advapi32.Load('CancelOverlappedAccess')(pOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-changeserviceconfig2a
  public static ChangeServiceConfig2A(hService: SC_HANDLE, dwInfoLevel: DWORD, lpInfo: OPTIONAL<LPVOID>): BOOL {
    return Advapi32.Load('ChangeServiceConfig2A')(hService, dwInfoLevel, lpInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-changeserviceconfig2w
  public static ChangeServiceConfig2W(hService: SC_HANDLE, dwInfoLevel: DWORD, lpInfo: OPTIONAL<LPVOID>): BOOL {
    return Advapi32.Load('ChangeServiceConfig2W')(hService, dwInfoLevel, lpInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-changeserviceconfiga
  public static ChangeServiceConfigA(
    hService: SC_HANDLE,
    dwServiceType: DWORD,
    dwStartType: DWORD,
    dwErrorControl: DWORD,
    lpBinaryPathName: OPTIONAL<LPCSTR>,
    lpLoadOrderGroup: OPTIONAL<LPCSTR>,
    lpdwTagId_out: OPTIONAL<LPDWORD>,
    lpDependencies: OPTIONAL<LPCSTR>,
    lpServiceStartName: OPTIONAL<LPCSTR>,
    lpPassword: OPTIONAL<LPCSTR>,
    lpDisplayName: OPTIONAL<LPCSTR>,
  ): BOOL {
    return Advapi32.Load('ChangeServiceConfigA')(hService, dwServiceType, dwStartType, dwErrorControl, lpBinaryPathName, lpLoadOrderGroup, lpdwTagId_out, lpDependencies, lpServiceStartName, lpPassword, lpDisplayName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-changeserviceconfigw
  public static ChangeServiceConfigW(
    hService: SC_HANDLE,
    dwServiceType: DWORD,
    dwStartType: DWORD,
    dwErrorControl: DWORD,
    lpBinaryPathName: OPTIONAL<LPCWSTR>,
    lpLoadOrderGroup: OPTIONAL<LPCWSTR>,
    lpdwTagId_out: OPTIONAL<LPDWORD>,
    lpDependencies: OPTIONAL<LPCWSTR>,
    lpServiceStartName: OPTIONAL<LPCWSTR>,
    lpPassword: OPTIONAL<LPCWSTR>,
    lpDisplayName: OPTIONAL<LPCWSTR>,
  ): BOOL {
    return Advapi32.Load('ChangeServiceConfigW')(hService, dwServiceType, dwStartType, dwErrorControl, lpBinaryPathName, lpLoadOrderGroup, lpdwTagId_out, lpDependencies, lpServiceStartName, lpPassword, lpDisplayName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-checkforhiberboot
  public static CheckForHiberboot(pHiberboot_in_out: PBOOL, bClearFlag: BOOL): DWORD {
    return Advapi32.Load('CheckForHiberboot')(pHiberboot_in_out, bClearFlag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-checktokenmembership
  public static CheckTokenMembership(TokenHandle: OPTIONAL<HANDLE>, SidToCheck: PSID, IsMember_out: PBOOL): BOOL {
    return Advapi32.Load('CheckTokenMembership')(TokenHandle, SidToCheck, IsMember_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-cleareventloga
  public static ClearEventLogA(hEventLog: HANDLE, lpBackupFileName: OPTIONAL<LPCSTR>): BOOL {
    return Advapi32.Load('ClearEventLogA')(hEventLog, lpBackupFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-cleareventlogw
  public static ClearEventLogW(hEventLog: HANDLE, lpBackupFileName: OPTIONAL<LPCWSTR>): BOOL {
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
  public static ControlService(hService: SC_HANDLE, dwControl: DWORD, lpServiceStatus_out: PVOID): BOOL {
    return Advapi32.Load('ControlService')(hService, dwControl, lpServiceStatus_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-controlserviceexa
  public static ControlServiceExA(hService: SC_HANDLE, dwControl: DWORD, dwInfoLevel: DWORD, pControlParams_in_out: PVOID): DWORD {
    return Advapi32.Load('ControlServiceExA')(hService, dwControl, dwInfoLevel, pControlParams_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-controlserviceexw
  public static ControlServiceExW(hService: SC_HANDLE, dwControl: DWORD, dwInfoLevel: DWORD, pControlParams_in_out: PVOID): DWORD {
    return Advapi32.Load('ControlServiceExW')(hService, dwControl, dwInfoLevel, pControlParams_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-controltracea
  public static ControlTraceA(TraceHandle: TRACEHANDLE, InstanceName: OPTIONAL<LPCSTR>, Properties_in_out: PVOID, ControlCode: ULONG): ULONG {
    return Advapi32.Load('ControlTraceA')(TraceHandle, InstanceName, Properties_in_out, ControlCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-controltracew
  public static ControlTraceW(TraceHandle: TRACEHANDLE, InstanceName: OPTIONAL<LPCWSTR>, Properties_in_out: PVOID, ControlCode: ULONG): ULONG {
    return Advapi32.Load('ControlTraceW')(TraceHandle, InstanceName, Properties_in_out, ControlCode);
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
  public static ConvertSDToStringSDDomainW(
    pSid: PSID,
    SecurityDescriptor: PSECURITY_DESCRIPTOR,
    RequestedStringSDRevision: DWORD,
    SecurityInformation: SECURITY_INFORMATION,
    StringSecurityDescriptor: PVOID,
    StringSecurityDescriptorLen: PULONG,
  ): BOOL {
    return Advapi32.Load('ConvertSDToStringSDDomainW')(pSid, SecurityDescriptor, RequestedStringSDRevision, SecurityInformation, StringSecurityDescriptor, StringSecurityDescriptorLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertsdtostringsdrootdomaina
  public static ConvertSDToStringSDRootDomainA(
    pSid: PSID,
    SecurityDescriptor: PSECURITY_DESCRIPTOR,
    RequestedStringSDRevision: DWORD,
    SecurityInformation: SECURITY_INFORMATION,
    StringSecurityDescriptor: PVOID,
    StringSecurityDescriptorLen: PULONG,
  ): BOOL {
    return Advapi32.Load('ConvertSDToStringSDRootDomainA')(pSid, SecurityDescriptor, RequestedStringSDRevision, SecurityInformation, StringSecurityDescriptor, StringSecurityDescriptorLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertsdtostringsdrootdomainw
  public static ConvertSDToStringSDRootDomainW(
    pSid: PSID,
    SecurityDescriptor: PSECURITY_DESCRIPTOR,
    RequestedStringSDRevision: DWORD,
    SecurityInformation: SECURITY_INFORMATION,
    StringSecurityDescriptor: PVOID,
    StringSecurityDescriptorLen: PULONG,
  ): BOOL {
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
  public static ConvertSecurityDescriptorToStringSecurityDescriptorA(
    SecurityDescriptor: PSECURITY_DESCRIPTOR,
    RequestedStringSDRevision: DWORD,
    SecurityInformation: SECURITY_INFORMATION,
    StringSecurityDescriptor_out: PVOID,
    StringSecurityDescriptorLen_out: OPTIONAL<PULONG>,
  ): BOOL {
    return Advapi32.Load('ConvertSecurityDescriptorToStringSecurityDescriptorA')(SecurityDescriptor, RequestedStringSDRevision, SecurityInformation, StringSecurityDescriptor_out, StringSecurityDescriptorLen_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertsecuritydescriptortostringsecuritydescriptorw
  public static ConvertSecurityDescriptorToStringSecurityDescriptorW(
    SecurityDescriptor: PSECURITY_DESCRIPTOR,
    RequestedStringSDRevision: DWORD,
    SecurityInformation: SECURITY_INFORMATION,
    StringSecurityDescriptor_out: PVOID,
    StringSecurityDescriptorLen_out: OPTIONAL<PULONG>,
  ): BOOL {
    return Advapi32.Load('ConvertSecurityDescriptorToStringSecurityDescriptorW')(SecurityDescriptor, RequestedStringSDRevision, SecurityInformation, StringSecurityDescriptor_out, StringSecurityDescriptorLen_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertsidtostringsida
  public static ConvertSidToStringSidA(Sid: PSID, StringSid_out: PVOID): BOOL {
    return Advapi32.Load('ConvertSidToStringSidA')(Sid, StringSid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertsidtostringsidw
  public static ConvertSidToStringSidW(Sid: PSID, StringSid_out: PVOID): BOOL {
    return Advapi32.Load('ConvertSidToStringSidW')(Sid, StringSid_out);
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
  public static ConvertStringSecurityDescriptorToSecurityDescriptorA(StringSecurityDescriptor: LPCSTR, StringSDRevision: DWORD, SecurityDescriptor_out: PVOID, SecurityDescriptorSize_out: OPTIONAL<PULONG>): BOOL {
    return Advapi32.Load('ConvertStringSecurityDescriptorToSecurityDescriptorA')(StringSecurityDescriptor, StringSDRevision, SecurityDescriptor_out, SecurityDescriptorSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertstringsecuritydescriptortosecuritydescriptorw
  public static ConvertStringSecurityDescriptorToSecurityDescriptorW(StringSecurityDescriptor: LPCWSTR, StringSDRevision: DWORD, SecurityDescriptor_out: PVOID, SecurityDescriptorSize_out: OPTIONAL<PULONG>): BOOL {
    return Advapi32.Load('ConvertStringSecurityDescriptorToSecurityDescriptorW')(StringSecurityDescriptor, StringSDRevision, SecurityDescriptor_out, SecurityDescriptorSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertstringsidtosida
  public static ConvertStringSidToSidA(StringSid: LPCSTR, Sid_out: PVOID): BOOL {
    return Advapi32.Load('ConvertStringSidToSidA')(StringSid, Sid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sddl/nf-sddl-convertstringsidtosidw
  public static ConvertStringSidToSidW(StringSid: LPCWSTR, Sid_out: PVOID): BOOL {
    return Advapi32.Load('ConvertStringSidToSidW')(StringSid, Sid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-converttoautoinheritprivateobjectsecurity
  public static ConvertToAutoInheritPrivateObjectSecurity(
    ParentDescriptor: OPTIONAL<PSECURITY_DESCRIPTOR>,
    CurrentSecurityDescriptor: PSECURITY_DESCRIPTOR,
    NewSecurityDescriptor_out: PVOID,
    ObjectType: OPTIONAL<PVOID>,
    IsDirectoryObject: BOOL,
    GenericMapping: PGENERIC_MAPPING,
  ): BOOL {
    return Advapi32.Load('ConvertToAutoInheritPrivateObjectSecurity')(ParentDescriptor, CurrentSecurityDescriptor, NewSecurityDescriptor_out, ObjectType, IsDirectoryObject, GenericMapping);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-copysid
  public static CopySid(nDestinationSidLength: DWORD, pDestinationSid_out: PSID, pSourceSid: PSID): BOOL {
    return Advapi32.Load('CopySid')(nDestinationSidLength, pDestinationSid_out, pSourceSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-createcodeauthzlevel
  public static CreateCodeAuthzLevel(dwLevelId: DWORD, InformationClass: DWORD, dwBufferSize: DWORD, pCodeAuthzLevelData: PVOID, pCodeAuthzLevelHandle: PVOID): BOOL {
    return Advapi32.Load('CreateCodeAuthzLevel')(dwLevelId, InformationClass, dwBufferSize, pCodeAuthzLevelData, pCodeAuthzLevelHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-createprivateobjectsecurity
  public static CreatePrivateObjectSecurity(
    ParentDescriptor: OPTIONAL<PSECURITY_DESCRIPTOR>,
    CreatorDescriptor: OPTIONAL<PSECURITY_DESCRIPTOR>,
    NewDescriptor_out: PVOID,
    IsDirectoryObject: BOOL,
    Token: OPTIONAL<HANDLE>,
    GenericMapping: PGENERIC_MAPPING,
  ): BOOL {
    return Advapi32.Load('CreatePrivateObjectSecurity')(ParentDescriptor, CreatorDescriptor, NewDescriptor_out, IsDirectoryObject, Token, GenericMapping);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-createprivateobjectsecurityex
  public static CreatePrivateObjectSecurityEx(
    ParentDescriptor: OPTIONAL<PSECURITY_DESCRIPTOR>,
    CreatorDescriptor: OPTIONAL<PSECURITY_DESCRIPTOR>,
    NewDescriptor_out: PVOID,
    ObjectType: OPTIONAL<PVOID>,
    IsContainerObject: BOOL,
    AutoInheritFlags: ULONG,
    Token: OPTIONAL<HANDLE>,
    GenericMapping: PGENERIC_MAPPING,
  ): BOOL {
    return Advapi32.Load('CreatePrivateObjectSecurityEx')(ParentDescriptor, CreatorDescriptor, NewDescriptor_out, ObjectType, IsContainerObject, AutoInheritFlags, Token, GenericMapping);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-createprivateobjectsecuritywithmultipleinheritance
  public static CreatePrivateObjectSecurityWithMultipleInheritance(
    ParentDescriptor: OPTIONAL<PSECURITY_DESCRIPTOR>,
    CreatorDescriptor: OPTIONAL<PSECURITY_DESCRIPTOR>,
    NewDescriptor_out: PVOID,
    ObjectTypes: OPTIONAL<PVOID>,
    GuidCount: ULONG,
    IsContainerObject: BOOL,
    AutoInheritFlags: ULONG,
    Token: OPTIONAL<HANDLE>,
    GenericMapping: PGENERIC_MAPPING,
  ): BOOL {
    return Advapi32.Load('CreatePrivateObjectSecurityWithMultipleInheritance')(ParentDescriptor, CreatorDescriptor, NewDescriptor_out, ObjectTypes, GuidCount, IsContainerObject, AutoInheritFlags, Token, GenericMapping);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessasusera
  public static CreateProcessAsUserA(
    hToken: OPTIONAL<HANDLE>,
    lpApplicationName: OPTIONAL<LPCSTR>,
    lpCommandLine_in_out: OPTIONAL<LPSTR>,
    lpProcessAttributes: OPTIONAL<PVOID>,
    lpThreadAttributes: OPTIONAL<PVOID>,
    bInheritHandles: BOOL,
    dwCreationFlags: DWORD,
    lpEnvironment: OPTIONAL<LPVOID>,
    lpCurrentDirectory: OPTIONAL<LPCSTR>,
    lpStartupInfo: PVOID,
    lpProcessInformation_out: PVOID,
  ): BOOL {
    return Advapi32.Load('CreateProcessAsUserA')(
      hToken,
      lpApplicationName,
      lpCommandLine_in_out,
      lpProcessAttributes,
      lpThreadAttributes,
      bInheritHandles,
      dwCreationFlags,
      lpEnvironment,
      lpCurrentDirectory,
      lpStartupInfo,
      lpProcessInformation_out,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessasuserw
  public static CreateProcessAsUserW(
    hToken: OPTIONAL<HANDLE>,
    lpApplicationName: OPTIONAL<LPCWSTR>,
    lpCommandLine_in_out: OPTIONAL<LPWSTR>,
    lpProcessAttributes: OPTIONAL<PVOID>,
    lpThreadAttributes: OPTIONAL<PVOID>,
    bInheritHandles: BOOL,
    dwCreationFlags: DWORD,
    lpEnvironment: OPTIONAL<LPVOID>,
    lpCurrentDirectory: OPTIONAL<LPCWSTR>,
    lpStartupInfo: PVOID,
    lpProcessInformation_out: PVOID,
  ): BOOL {
    return Advapi32.Load('CreateProcessAsUserW')(
      hToken,
      lpApplicationName,
      lpCommandLine_in_out,
      lpProcessAttributes,
      lpThreadAttributes,
      bInheritHandles,
      dwCreationFlags,
      lpEnvironment,
      lpCurrentDirectory,
      lpStartupInfo,
      lpProcessInformation_out,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createprocesswithlogonw
  public static CreateProcessWithLogonW(
    lpUsername: LPCWSTR,
    lpDomain: OPTIONAL<LPCWSTR>,
    lpPassword: LPCWSTR,
    dwLogonFlags: DWORD,
    lpApplicationName: OPTIONAL<LPCWSTR>,
    lpCommandLine_in_out: OPTIONAL<LPWSTR>,
    dwCreationFlags: DWORD,
    lpEnvironment: OPTIONAL<LPVOID>,
    lpCurrentDirectory: OPTIONAL<LPCWSTR>,
    lpStartupInfo: PVOID,
    lpProcessInformation_out: PVOID,
  ): BOOL {
    return Advapi32.Load('CreateProcessWithLogonW')(lpUsername, lpDomain, lpPassword, dwLogonFlags, lpApplicationName, lpCommandLine_in_out, dwCreationFlags, lpEnvironment, lpCurrentDirectory, lpStartupInfo, lpProcessInformation_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createprocesswithtokenw
  public static CreateProcessWithTokenW(
    hToken: HANDLE,
    dwLogonFlags: DWORD,
    lpApplicationName: OPTIONAL<LPCWSTR>,
    lpCommandLine_in_out: OPTIONAL<LPWSTR>,
    dwCreationFlags: DWORD,
    lpEnvironment: OPTIONAL<LPVOID>,
    lpCurrentDirectory: OPTIONAL<LPCWSTR>,
    lpStartupInfo: PVOID,
    lpProcessInformation_out: PVOID,
  ): BOOL {
    return Advapi32.Load('CreateProcessWithTokenW')(hToken, dwLogonFlags, lpApplicationName, lpCommandLine_in_out, dwCreationFlags, lpEnvironment, lpCurrentDirectory, lpStartupInfo, lpProcessInformation_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-createrestrictedtoken
  public static CreateRestrictedToken(
    ExistingTokenHandle: HANDLE,
    Flags: DWORD,
    DisableSidCount: DWORD,
    SidsToDisable: OPTIONAL<PVOID>,
    DeletePrivilegeCount: DWORD,
    PrivilegesToDelete: OPTIONAL<PVOID>,
    RestrictedSidCount: DWORD,
    SidsToRestrict: OPTIONAL<PVOID>,
    NewTokenHandle_out: PHANDLE,
  ): BOOL {
    return Advapi32.Load('CreateRestrictedToken')(ExistingTokenHandle, Flags, DisableSidCount, SidsToDisable, DeletePrivilegeCount, PrivilegesToDelete, RestrictedSidCount, SidsToRestrict, NewTokenHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-createservicea
  public static CreateServiceA(
    hSCManager: SC_HANDLE,
    lpServiceName: LPCSTR,
    lpDisplayName: OPTIONAL<LPCSTR>,
    dwDesiredAccess: DWORD,
    dwServiceType: DWORD,
    dwStartType: DWORD,
    dwErrorControl: DWORD,
    lpBinaryPathName: OPTIONAL<LPCSTR>,
    lpLoadOrderGroup: OPTIONAL<LPCSTR>,
    lpdwTagId_out: OPTIONAL<LPDWORD>,
    lpDependencies: OPTIONAL<LPCSTR>,
    lpServiceStartName: OPTIONAL<LPCSTR>,
    lpPassword: OPTIONAL<LPCSTR>,
  ): SC_HANDLE {
    return Advapi32.Load('CreateServiceA')(
      hSCManager,
      lpServiceName,
      lpDisplayName,
      dwDesiredAccess,
      dwServiceType,
      dwStartType,
      dwErrorControl,
      lpBinaryPathName,
      lpLoadOrderGroup,
      lpdwTagId_out,
      lpDependencies,
      lpServiceStartName,
      lpPassword,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-createserviceex
  public static CreateServiceEx(
    hSCManager: SC_HANDLE,
    lpServiceName: LPCWSTR,
    lpDisplayName: LPCWSTR,
    dwDesiredAccess: DWORD,
    dwServiceType: DWORD,
    dwStartType: DWORD,
    dwErrorControl: DWORD,
    lpBinaryPathName: LPCWSTR,
    lpLoadOrderGroup: LPCWSTR,
    lpdwTagId: LPDWORD,
    lpDependencies: LPCWSTR,
    lpServiceStartName: LPCWSTR,
    lpPassword: LPCWSTR,
    pvExtra: PVOID,
  ): SC_HANDLE {
    return Advapi32.Load('CreateServiceEx')(
      hSCManager,
      lpServiceName,
      lpDisplayName,
      dwDesiredAccess,
      dwServiceType,
      dwStartType,
      dwErrorControl,
      lpBinaryPathName,
      lpLoadOrderGroup,
      lpdwTagId,
      lpDependencies,
      lpServiceStartName,
      lpPassword,
      pvExtra,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-createservicew
  public static CreateServiceW(
    hSCManager: SC_HANDLE,
    lpServiceName: LPCWSTR,
    lpDisplayName: OPTIONAL<LPCWSTR>,
    dwDesiredAccess: DWORD,
    dwServiceType: DWORD,
    dwStartType: DWORD,
    dwErrorControl: DWORD,
    lpBinaryPathName: OPTIONAL<LPCWSTR>,
    lpLoadOrderGroup: OPTIONAL<LPCWSTR>,
    lpdwTagId_out: OPTIONAL<LPDWORD>,
    lpDependencies: OPTIONAL<LPCWSTR>,
    lpServiceStartName: OPTIONAL<LPCWSTR>,
    lpPassword: OPTIONAL<LPCWSTR>,
  ): SC_HANDLE {
    return Advapi32.Load('CreateServiceW')(
      hSCManager,
      lpServiceName,
      lpDisplayName,
      dwDesiredAccess,
      dwServiceType,
      dwStartType,
      dwErrorControl,
      lpBinaryPathName,
      lpLoadOrderGroup,
      lpdwTagId_out,
      lpDependencies,
      lpServiceStartName,
      lpPassword,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-createwellknownsid
  public static CreateWellKnownSid(WellKnownSidType: DWORD, DomainSid: OPTIONAL<PSID>, pSid_out: OPTIONAL<PSID>, cbSid_in_out: LPDWORD): BOOL {
    return Advapi32.Load('CreateWellKnownSid')(WellKnownSidType, DomainSid, pSid_out, cbSid_in_out);
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
  public static CredEnumerateA(Filter: OPTIONAL<LPCSTR>, Flags: DWORD, Count_out: LPDWORD, Credential_out: PVOID): BOOL {
    return Advapi32.Load('CredEnumerateA')(Filter, Flags, Count_out, Credential_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credenumeratew
  public static CredEnumerateW(Filter: OPTIONAL<LPCWSTR>, Flags: DWORD, Count_out: LPDWORD, Credential_out: PVOID): BOOL {
    return Advapi32.Load('CredEnumerateW')(Filter, Flags, Count_out, Credential_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credfindbestcredentiala
  public static CredFindBestCredentialA(TargetName: LPCSTR, Type: DWORD, Flags: DWORD, Credential_out: PVOID): BOOL {
    return Advapi32.Load('CredFindBestCredentialA')(TargetName, Type, Flags, Credential_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credfindbestcredentialw
  public static CredFindBestCredentialW(TargetName: LPCWSTR, Type: DWORD, Flags: DWORD, Credential_out: PVOID): BOOL {
    return Advapi32.Load('CredFindBestCredentialW')(TargetName, Type, Flags, Credential_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credfree
  public static CredFree(Buffer: PVOID): VOID {
    return Advapi32.Load('CredFree')(Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credgetsessiontypes
  public static CredGetSessionTypes(MaximumPersistCount: DWORD, MaximumPersist_out: LPDWORD): BOOL {
    return Advapi32.Load('CredGetSessionTypes')(MaximumPersistCount, MaximumPersist_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credgettargetinfoa
  public static CredGetTargetInfoA(TargetName: LPCSTR, Flags: DWORD, TargetInfo_out: PVOID): BOOL {
    return Advapi32.Load('CredGetTargetInfoA')(TargetName, Flags, TargetInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credgettargetinfow
  public static CredGetTargetInfoW(TargetName: LPCWSTR, Flags: DWORD, TargetInfo_out: PVOID): BOOL {
    return Advapi32.Load('CredGetTargetInfoW')(TargetName, Flags, TargetInfo_out);
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
  public static CredIsProtectedA(pszProtectedCredentials: LPSTR, pProtectionType_out: PVOID): BOOL {
    return Advapi32.Load('CredIsProtectedA')(pszProtectedCredentials, pProtectionType_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credisprotectedw
  public static CredIsProtectedW(pszProtectedCredentials: LPWSTR, pProtectionType_out: PVOID): BOOL {
    return Advapi32.Load('CredIsProtectedW')(pszProtectedCredentials, pProtectionType_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credmarshalcredentiala
  public static CredMarshalCredentialA(CredType: DWORD, Credential: PVOID, MarshaledCredential_out: PVOID): BOOL {
    return Advapi32.Load('CredMarshalCredentialA')(CredType, Credential, MarshaledCredential_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credmarshalcredentialw
  public static CredMarshalCredentialW(CredType: DWORD, Credential: PVOID, MarshaledCredential_out: PVOID): BOOL {
    return Advapi32.Load('CredMarshalCredentialW')(CredType, Credential, MarshaledCredential_out);
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
  public static CredProtectA(fAsSelf: BOOL, pszCredentials: LPSTR, cchCredentials: DWORD, pszProtectedCredentials_out: LPSTR, pcchMaxChars_in_out: LPDWORD, ProtectionType_out: OPTIONAL<PVOID>): BOOL {
    return Advapi32.Load('CredProtectA')(fAsSelf, pszCredentials, cchCredentials, pszProtectedCredentials_out, pcchMaxChars_in_out, ProtectionType_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credprotectw
  public static CredProtectW(fAsSelf: BOOL, pszCredentials: LPWSTR, cchCredentials: DWORD, pszProtectedCredentials_out: LPWSTR, pcchMaxChars_in_out: LPDWORD, ProtectionType_out: OPTIONAL<PVOID>): BOOL {
    return Advapi32.Load('CredProtectW')(fAsSelf, pszCredentials, cchCredentials, pszProtectedCredentials_out, pcchMaxChars_in_out, ProtectionType_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credreada
  public static CredReadA(TargetName: LPCSTR, Type: DWORD, Flags: DWORD, Credential_out: PVOID): BOOL {
    return Advapi32.Load('CredReadA')(TargetName, Type, Flags, Credential_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credreadbytokenhandle
  public static CredReadByTokenHandle(TokenHandle: HANDLE, TargetName: PVOID, Type: DWORD, Flags: DWORD, Credential: PVOID): BOOL {
    return Advapi32.Load('CredReadByTokenHandle')(TokenHandle, TargetName, Type, Flags, Credential);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credreaddomaincredentialsa
  public static CredReadDomainCredentialsA(TargetInfo: PCREDENTIAL_TARGET_INFORMATIONA, Flags: DWORD, Count_out: LPDWORD, Credential_out: PVOID): BOOL {
    return Advapi32.Load('CredReadDomainCredentialsA')(TargetInfo, Flags, Count_out, Credential_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credreaddomaincredentialsw
  public static CredReadDomainCredentialsW(TargetInfo: PCREDENTIAL_TARGET_INFORMATIONW, Flags: DWORD, Count_out: LPDWORD, Credential_out: PVOID): BOOL {
    return Advapi32.Load('CredReadDomainCredentialsW')(TargetInfo, Flags, Count_out, Credential_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credreadw
  public static CredReadW(TargetName: LPCWSTR, Type: DWORD, Flags: DWORD, Credential_out: PVOID): BOOL {
    return Advapi32.Load('CredReadW')(TargetName, Type, Flags, Credential_out);
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
  public static CredUnmarshalCredentialA(MarshaledCredential: LPCSTR, CredType_out: PVOID, Credential_out: PVOID): BOOL {
    return Advapi32.Load('CredUnmarshalCredentialA')(MarshaledCredential, CredType_out, Credential_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credunmarshalcredentialw
  public static CredUnmarshalCredentialW(MarshaledCredential: LPCWSTR, CredType_out: PVOID, Credential_out: PVOID): BOOL {
    return Advapi32.Load('CredUnmarshalCredentialW')(MarshaledCredential, CredType_out, Credential_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credunprotecta
  public static CredUnprotectA(fAsSelf: BOOL, pszProtectedCredentials: LPSTR, cchProtectedCredentials: DWORD, pszCredentials_out: OPTIONAL<LPSTR>, pcchMaxChars_in_out: LPDWORD): BOOL {
    return Advapi32.Load('CredUnprotectA')(fAsSelf, pszProtectedCredentials, cchProtectedCredentials, pszCredentials_out, pcchMaxChars_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincred/nf-wincred-credunprotectw
  public static CredUnprotectW(fAsSelf: BOOL, pszProtectedCredentials: LPWSTR, cchProtectedCredentials: DWORD, pszCredentials_out: OPTIONAL<LPWSTR>, pcchMaxChars_in_out: LPDWORD): BOOL {
    return Advapi32.Load('CredUnprotectW')(fAsSelf, pszProtectedCredentials, cchProtectedCredentials, pszCredentials_out, pcchMaxChars_in_out);
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
  public static CryptAcquireContextA(phProv_out: PVOID, szContainer: OPTIONAL<LPCSTR>, szProvider: OPTIONAL<LPCSTR>, dwProvType: DWORD, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptAcquireContextA')(phProv_out, szContainer, szProvider, dwProvType, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptacquirecontextw
  public static CryptAcquireContextW(phProv_out: PVOID, szContainer: OPTIONAL<LPCWSTR>, szProvider: OPTIONAL<LPCWSTR>, dwProvType: DWORD, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptAcquireContextW')(phProv_out, szContainer, szProvider, dwProvType, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptcontextaddref
  public static CryptContextAddRef(hProv: HCRYPTPROV, pdwReserved: NULL, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptContextAddRef')(hProv, pdwReserved, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptcreatehash
  public static CryptCreateHash(hProv: HCRYPTPROV, Algid: ALG_ID, hKey: HCRYPTKEY, dwFlags: DWORD, phHash_out: PVOID): BOOL {
    return Advapi32.Load('CryptCreateHash')(hProv, Algid, hKey, dwFlags, phHash_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptdecrypt
  public static CryptDecrypt(hKey: HCRYPTKEY, hHash: HCRYPTHASH, Final: BOOL, dwFlags: DWORD, pbData_in_out: PBYTE, pdwDataLen_in_out: LPDWORD): BOOL {
    return Advapi32.Load('CryptDecrypt')(hKey, hHash, Final, dwFlags, pbData_in_out, pdwDataLen_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptderivekey
  public static CryptDeriveKey(hProv: HCRYPTPROV, Algid: ALG_ID, hBaseData: HCRYPTHASH, dwFlags: DWORD, phKey_out: PVOID): BOOL {
    return Advapi32.Load('CryptDeriveKey')(hProv, Algid, hBaseData, dwFlags, phKey_out);
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
  public static CryptDuplicateHash(hHash: HCRYPTHASH, pdwReserved: NULL, dwFlags: DWORD, phHash_out: PVOID): BOOL {
    return Advapi32.Load('CryptDuplicateHash')(hHash, pdwReserved, dwFlags, phHash_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptduplicatekey
  public static CryptDuplicateKey(hKey: HCRYPTKEY, pdwReserved: NULL, dwFlags: DWORD, phKey_out: PVOID): BOOL {
    return Advapi32.Load('CryptDuplicateKey')(hKey, pdwReserved, dwFlags, phKey_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptencrypt
  public static CryptEncrypt(hKey: HCRYPTKEY, hHash: HCRYPTHASH, Final: BOOL, dwFlags: DWORD, pbData_in_out: OPTIONAL<PBYTE>, pdwDataLen_in_out: LPDWORD, dwBufLen: DWORD): BOOL {
    return Advapi32.Load('CryptEncrypt')(hKey, hHash, Final, dwFlags, pbData_in_out, pdwDataLen_in_out, dwBufLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptenumprovidertypesa
  public static CryptEnumProviderTypesA(dwIndex: DWORD, pdwReserved: NULL, dwFlags: DWORD, pdwProvType_out: LPDWORD, szTypeName_out: OPTIONAL<LPSTR>, pcbTypeName_in_out: LPDWORD): BOOL {
    return Advapi32.Load('CryptEnumProviderTypesA')(dwIndex, pdwReserved, dwFlags, pdwProvType_out, szTypeName_out, pcbTypeName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptenumprovidertypesw
  public static CryptEnumProviderTypesW(dwIndex: DWORD, pdwReserved: NULL, dwFlags: DWORD, pdwProvType_out: LPDWORD, szTypeName_out: OPTIONAL<LPWSTR>, pcbTypeName_in_out: LPDWORD): BOOL {
    return Advapi32.Load('CryptEnumProviderTypesW')(dwIndex, pdwReserved, dwFlags, pdwProvType_out, szTypeName_out, pcbTypeName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptenumprovidersa
  public static CryptEnumProvidersA(dwIndex: DWORD, pdwReserved: NULL, dwFlags: DWORD, pdwProvType_out: LPDWORD, szProvName_out: OPTIONAL<LPSTR>, pcbProvName_in_out: LPDWORD): BOOL {
    return Advapi32.Load('CryptEnumProvidersA')(dwIndex, pdwReserved, dwFlags, pdwProvType_out, szProvName_out, pcbProvName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptenumprovidersw
  public static CryptEnumProvidersW(dwIndex: DWORD, pdwReserved: NULL, dwFlags: DWORD, pdwProvType_out: LPDWORD, szProvName_out: OPTIONAL<LPWSTR>, pcbProvName_in_out: LPDWORD): BOOL {
    return Advapi32.Load('CryptEnumProvidersW')(dwIndex, pdwReserved, dwFlags, pdwProvType_out, szProvName_out, pcbProvName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptexportkey
  public static CryptExportKey(hKey: HCRYPTKEY, hExpKey: HCRYPTKEY, dwBlobType: DWORD, dwFlags: DWORD, pbData_out: OPTIONAL<PBYTE>, pdwDataLen_in_out: LPDWORD): BOOL {
    return Advapi32.Load('CryptExportKey')(hKey, hExpKey, dwBlobType, dwFlags, pbData_out, pdwDataLen_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgenkey
  public static CryptGenKey(hProv: HCRYPTPROV, Algid: ALG_ID, dwFlags: DWORD, phKey_out: PVOID): BOOL {
    return Advapi32.Load('CryptGenKey')(hProv, Algid, dwFlags, phKey_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgenrandom
  public static CryptGenRandom(hProv: HCRYPTPROV, dwLen: DWORD, pbBuffer_in_out: PBYTE): BOOL {
    return Advapi32.Load('CryptGenRandom')(hProv, dwLen, pbBuffer_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgetdefaultprovidera
  public static CryptGetDefaultProviderA(dwProvType: DWORD, pdwReserved: NULL, dwFlags: DWORD, pszProvName_out: OPTIONAL<LPSTR>, pcbProvName_in_out: LPDWORD): BOOL {
    return Advapi32.Load('CryptGetDefaultProviderA')(dwProvType, pdwReserved, dwFlags, pszProvName_out, pcbProvName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgetdefaultproviderw
  public static CryptGetDefaultProviderW(dwProvType: DWORD, pdwReserved: NULL, dwFlags: DWORD, pszProvName_out: OPTIONAL<LPWSTR>, pcbProvName_in_out: LPDWORD): BOOL {
    return Advapi32.Load('CryptGetDefaultProviderW')(dwProvType, pdwReserved, dwFlags, pszProvName_out, pcbProvName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgethashparam
  public static CryptGetHashParam(hHash: HCRYPTHASH, dwParam: DWORD, pbData_out: OPTIONAL<PBYTE>, pdwDataLen_in_out: LPDWORD, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptGetHashParam')(hHash, dwParam, pbData_out, pdwDataLen_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgetkeyparam
  public static CryptGetKeyParam(hKey: HCRYPTKEY, dwParam: DWORD, pbData_out: OPTIONAL<PBYTE>, pdwDataLen_in_out: LPDWORD, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptGetKeyParam')(hKey, dwParam, pbData_out, pdwDataLen_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgetprovparam
  public static CryptGetProvParam(hProv: HCRYPTPROV, dwParam: DWORD, pbData_out: OPTIONAL<PBYTE>, pdwDataLen_in_out: LPDWORD, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptGetProvParam')(hProv, dwParam, pbData_out, pdwDataLen_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptgetuserkey
  public static CryptGetUserKey(hProv: HCRYPTPROV, dwKeySpec: DWORD, phUserKey_out: PVOID): BOOL {
    return Advapi32.Load('CryptGetUserKey')(hProv, dwKeySpec, phUserKey_out);
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
  public static CryptImportKey(hProv: HCRYPTPROV, pbData: PBYTE, dwDataLen: DWORD, hPubKey: HCRYPTKEY, dwFlags: DWORD, phKey_out: PVOID): BOOL {
    return Advapi32.Load('CryptImportKey')(hProv, pbData, dwDataLen, hPubKey, dwFlags, phKey_out);
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
  public static CryptSetProviderExA(pszProvName: LPCSTR, dwProvType: DWORD, pdwReserved: NULL, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptSetProviderExA')(pszProvName, dwProvType, pdwReserved, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptsetproviderexw
  public static CryptSetProviderExW(pszProvName: LPCWSTR, dwProvType: DWORD, pdwReserved: NULL, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptSetProviderExW')(pszProvName, dwProvType, pdwReserved, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptsetproviderw
  public static CryptSetProviderW(pszProvName: LPCWSTR, dwProvType: DWORD): BOOL {
    return Advapi32.Load('CryptSetProviderW')(pszProvName, dwProvType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptsignhasha
  public static CryptSignHashA(hHash: HCRYPTHASH, dwKeySpec: DWORD, sDescription: OPTIONAL<LPCSTR>, dwFlags: DWORD, pbSignature_out: OPTIONAL<PBYTE>, pdwSigLen_in_out: LPDWORD): BOOL {
    return Advapi32.Load('CryptSignHashA')(hHash, dwKeySpec, sDescription, dwFlags, pbSignature_out, pdwSigLen_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptsignhashw
  public static CryptSignHashW(hHash: HCRYPTHASH, dwKeySpec: DWORD, sDescription: OPTIONAL<LPCWSTR>, dwFlags: DWORD, pbSignature_out: OPTIONAL<PBYTE>, pdwSigLen_in_out: LPDWORD): BOOL {
    return Advapi32.Load('CryptSignHashW')(hHash, dwKeySpec, sDescription, dwFlags, pbSignature_out, pdwSigLen_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptverifysignaturea
  public static CryptVerifySignatureA(hHash: HCRYPTHASH, pbSignature: PBYTE, dwSigLen: DWORD, hPubKey: HCRYPTKEY, sDescription: OPTIONAL<LPCSTR>, dwFlags: DWORD): BOOL {
    return Advapi32.Load('CryptVerifySignatureA')(hHash, pbSignature, dwSigLen, hPubKey, sDescription, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincrypt/nf-wincrypt-cryptverifysignaturew
  public static CryptVerifySignatureW(hHash: HCRYPTHASH, pbSignature: PBYTE, dwSigLen: DWORD, hPubKey: HCRYPTKEY, sDescription: OPTIONAL<LPCWSTR>, dwFlags: DWORD): BOOL {
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
  public static DeleteAce(pAcl_in_out: PACL, dwAceIndex: DWORD): BOOL {
    return Advapi32.Load('DeleteAce')(pAcl_in_out, dwAceIndex);
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
  public static DuplicateEncryptionInfoFile(SrcFileName: LPCWSTR, DstFileName: LPCWSTR, dwCreationDistribution: DWORD, dwAttributes: DWORD, lpSecurityAttributes: OPTIONAL<PVOID>): DWORD {
    return Advapi32.Load('DuplicateEncryptionInfoFile')(SrcFileName, DstFileName, dwCreationDistribution, dwAttributes, lpSecurityAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-duplicatetoken
  public static DuplicateToken(ExistingTokenHandle: HANDLE, ImpersonationLevel: SECURITY_IMPERSONATION_LEVEL, DuplicateTokenHandle_out: PHANDLE): BOOL {
    return Advapi32.Load('DuplicateToken')(ExistingTokenHandle, ImpersonationLevel, DuplicateTokenHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-duplicatetokenex
  public static DuplicateTokenEx(hExistingToken: HANDLE, dwDesiredAccess: DWORD, lpTokenAttributes: OPTIONAL<PVOID>, ImpersonationLevel: SECURITY_IMPERSONATION_LEVEL, TokenType: TOKEN_TYPE, phNewToken_out: PHANDLE): BOOL {
    return Advapi32.Load('DuplicateTokenEx')(hExistingToken, dwDesiredAccess, lpTokenAttributes, ImpersonationLevel, TokenType, phNewToken_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-enabletrace
  public static EnableTrace(Enable: ULONG, EnableFlag: ULONG, EnableLevel: ULONG, ControlGuid: PVOID, TraceHandle: TRACEHANDLE): ULONG {
    return Advapi32.Load('EnableTrace')(Enable, EnableFlag, EnableLevel, ControlGuid, TraceHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-enabletraceex
  public static EnableTraceEx(
    ProviderId: PVOID,
    SourceId: OPTIONAL<PVOID>,
    TraceHandle: TRACEHANDLE,
    IsEnabled: ULONG,
    Level: BYTE,
    MatchAnyKeyword: ULONG_PTR,
    MatchAllKeyword: ULONG_PTR,
    EnableProperty: ULONG,
    EnableFilterDesc: OPTIONAL<PVOID>,
  ): ULONG {
    return Advapi32.Load('EnableTraceEx')(ProviderId, SourceId, TraceHandle, IsEnabled, Level, MatchAnyKeyword, MatchAllKeyword, EnableProperty, EnableFilterDesc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-enabletraceex2
  public static EnableTraceEx2(TraceHandle: TRACEHANDLE, ProviderId: PVOID, ControlCode: ULONG, Level: BYTE, MatchAnyKeyword: ULONG_PTR, MatchAllKeyword: ULONG_PTR, Timeout: ULONG, EnableParameters: OPTIONAL<PVOID>): ULONG {
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
  public static EnumDependentServicesA(hService: SC_HANDLE, dwServiceState: DWORD, lpServices_out: OPTIONAL<LPBYTE>, cbBufSize: DWORD, pcbBytesNeeded_out: LPDWORD, lpServicesReturned_out: LPDWORD): BOOL {
    return Advapi32.Load('EnumDependentServicesA')(hService, dwServiceState, lpServices_out, cbBufSize, pcbBytesNeeded_out, lpServicesReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-enumdependentservicesw
  public static EnumDependentServicesW(hService: SC_HANDLE, dwServiceState: DWORD, lpServices_out: OPTIONAL<LPBYTE>, cbBufSize: DWORD, pcbBytesNeeded_out: LPDWORD, lpServicesReturned_out: LPDWORD): BOOL {
    return Advapi32.Load('EnumDependentServicesW')(hService, dwServiceState, lpServices_out, cbBufSize, pcbBytesNeeded_out, lpServicesReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/timezoneapi/nf-timezoneapi-enumdynamictimezoneinformation
  public static EnumDynamicTimeZoneInformation(dwIndex: DWORD, lpTimeZoneInformation_out: PVOID): DWORD {
    return Advapi32.Load('EnumDynamicTimeZoneInformation')(dwIndex, lpTimeZoneInformation_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-enumservicegroupw
  public static EnumServiceGroupW(
    hSCManager: SC_HANDLE,
    dwServiceType: DWORD,
    dwServiceState: DWORD,
    lpServices: LPBYTE,
    cbBufSize: DWORD,
    pcbBytesNeeded: LPDWORD,
    lpServicesReturned: LPDWORD,
    lpResumeHandle: LPDWORD,
    pszGroupName: LPCWSTR,
  ): BOOL {
    return Advapi32.Load('EnumServiceGroupW')(hSCManager, dwServiceType, dwServiceState, lpServices, cbBufSize, pcbBytesNeeded, lpServicesReturned, lpResumeHandle, pszGroupName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-enumservicesstatusa
  public static EnumServicesStatusA(
    hSCManager: SC_HANDLE,
    dwServiceType: DWORD,
    dwServiceState: DWORD,
    lpServices_out: OPTIONAL<LPBYTE>,
    cbBufSize: DWORD,
    pcbBytesNeeded_out: LPDWORD,
    lpServicesReturned_out: LPDWORD,
    lpResumeHandle_in_out: OPTIONAL<LPDWORD>,
  ): BOOL {
    return Advapi32.Load('EnumServicesStatusA')(hSCManager, dwServiceType, dwServiceState, lpServices_out, cbBufSize, pcbBytesNeeded_out, lpServicesReturned_out, lpResumeHandle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-enumservicesstatusexa
  public static EnumServicesStatusExA(
    hSCManager: SC_HANDLE,
    InfoLevel: DWORD,
    dwServiceType: DWORD,
    dwServiceState: DWORD,
    lpServices_out: OPTIONAL<LPBYTE>,
    cbBufSize: DWORD,
    pcbBytesNeeded_out: LPDWORD,
    lpServicesReturned_out: LPDWORD,
    lpResumeHandle_in_out: OPTIONAL<LPDWORD>,
    pszGroupName: OPTIONAL<LPCSTR>,
  ): BOOL {
    return Advapi32.Load('EnumServicesStatusExA')(hSCManager, InfoLevel, dwServiceType, dwServiceState, lpServices_out, cbBufSize, pcbBytesNeeded_out, lpServicesReturned_out, lpResumeHandle_in_out, pszGroupName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-enumservicesstatusexw
  public static EnumServicesStatusExW(
    hSCManager: SC_HANDLE,
    InfoLevel: DWORD,
    dwServiceType: DWORD,
    dwServiceState: DWORD,
    lpServices_out: OPTIONAL<LPBYTE>,
    cbBufSize: DWORD,
    pcbBytesNeeded_out: LPDWORD,
    lpServicesReturned_out: LPDWORD,
    lpResumeHandle_in_out: OPTIONAL<LPDWORD>,
    pszGroupName: OPTIONAL<LPCWSTR>,
  ): BOOL {
    return Advapi32.Load('EnumServicesStatusExW')(hSCManager, InfoLevel, dwServiceType, dwServiceState, lpServices_out, cbBufSize, pcbBytesNeeded_out, lpServicesReturned_out, lpResumeHandle_in_out, pszGroupName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-enumservicesstatusw
  public static EnumServicesStatusW(
    hSCManager: SC_HANDLE,
    dwServiceType: DWORD,
    dwServiceState: DWORD,
    lpServices_out: OPTIONAL<LPBYTE>,
    cbBufSize: DWORD,
    pcbBytesNeeded_out: LPDWORD,
    lpServicesReturned_out: LPDWORD,
    lpResumeHandle_in_out: OPTIONAL<LPDWORD>,
  ): BOOL {
    return Advapi32.Load('EnumServicesStatusW')(hSCManager, dwServiceType, dwServiceState, lpServices_out, cbBufSize, pcbBytesNeeded_out, lpServicesReturned_out, lpResumeHandle_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-enumeratetraceguids
  public static EnumerateTraceGuids(GuidPropertiesArray_in_out: PVOID, PropertyArrayCount: ULONG, GuidCount_out: PULONG): ULONG {
    return Advapi32.Load('EnumerateTraceGuids')(GuidPropertiesArray_in_out, PropertyArrayCount, GuidCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-enumeratetraceguidsex
  public static EnumerateTraceGuidsEx(TraceQueryInfoClass: DWORD, InBuffer: OPTIONAL<PVOID>, InBufferSize: ULONG, OutBuffer_out: OPTIONAL<PVOID>, OutBufferSize: ULONG, ReturnLength_out: PULONG): ULONG {
    return Advapi32.Load('EnumerateTraceGuidsEx')(TraceQueryInfoClass, InBuffer, InBufferSize, OutBuffer_out, OutBufferSize, ReturnLength_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-equaldomainsid
  public static EqualDomainSid(pSid1: PSID, pSid2: PSID, pfEqual_out: PBOOL): BOOL {
    return Advapi32.Load('EqualDomainSid')(pSid1, pSid2, pfEqual_out);
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
  public static EventAccessQuery(Guid: PVOID, Buffer_out: OPTIONAL<PSECURITY_DESCRIPTOR>, BufferSize_in_out: PULONG): ULONG {
    return Advapi32.Load('EventAccessQuery')(Guid, Buffer_out, BufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntcons/nf-evntcons-eventaccessremove
  public static EventAccessRemove(Guid: PVOID): ULONG {
    return Advapi32.Load('EventAccessRemove')(Guid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-fileencryptionstatusa
  public static FileEncryptionStatusA(lpFileName: LPCSTR, lpStatus_out: LPDWORD): BOOL {
    return Advapi32.Load('FileEncryptionStatusA')(lpFileName, lpStatus_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-fileencryptionstatusw
  public static FileEncryptionStatusW(lpFileName: LPCWSTR, lpStatus_out: LPDWORD): BOOL {
    return Advapi32.Load('FileEncryptionStatusW')(lpFileName, lpStatus_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-findfirstfreeace
  public static FindFirstFreeAce(pAcl: PACL, pAce_out: PVOID): BOOL {
    return Advapi32.Load('FindFirstFreeAce')(pAcl, pAce_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-flushefscache
  public static FlushEfsCache(dwFlags: DWORD): DWORD {
    return Advapi32.Load('FlushEfsCache')(dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-flushtracea
  public static FlushTraceA(TraceHandle: TRACEHANDLE, InstanceName: OPTIONAL<LPCSTR>, Properties_in_out: PVOID): ULONG {
    return Advapi32.Load('FlushTraceA')(TraceHandle, InstanceName, Properties_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-flushtracew
  public static FlushTraceW(TraceHandle: TRACEHANDLE, InstanceName: OPTIONAL<LPCWSTR>, Properties_in_out: PVOID): ULONG {
    return Advapi32.Load('FlushTraceW')(TraceHandle, InstanceName, Properties_in_out);
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
  public static FreeInheritedFromArray(pInheritArray: PVOID, AceCnt: USHORT, pfnArray: OPTIONAL<PVOID>): DWORD {
    return Advapi32.Load('FreeInheritedFromArray')(pInheritArray, AceCnt, pfnArray);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-freesid
  public static FreeSid(pSid: PSID): PVOID {
    return Advapi32.Load('FreeSid')(pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getaccesspermissionsforobjecta
  public static GetAccessPermissionsForObjectA(
    pObjectName: LPCSTR,
    ObjectType: DWORD,
    ObjectTypeName: LPCSTR,
    pTrustee: PTRUSTEE,
    pcCountOfExplicitEntries: PULONG,
    pListOfExplicitEntries: PVOID,
    pcCountOfPermissions: PULONG,
    ppPermissionList: PVOID,
    ppDefaultAccess: PVOID,
  ): DWORD {
    return Advapi32.Load('GetAccessPermissionsForObjectA')(pObjectName, ObjectType, ObjectTypeName, pTrustee, pcCountOfExplicitEntries, pListOfExplicitEntries, pcCountOfPermissions, ppPermissionList, ppDefaultAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getaccesspermissionsforobjectw
  public static GetAccessPermissionsForObjectW(
    pObjectName: LPCWSTR,
    ObjectType: DWORD,
    ObjectTypeName: LPCWSTR,
    pTrustee: PTRUSTEE,
    pcCountOfExplicitEntries: PULONG,
    pListOfExplicitEntries: PVOID,
    pcCountOfPermissions: PULONG,
    ppPermissionList: PVOID,
    ppDefaultAccess: PVOID,
  ): DWORD {
    return Advapi32.Load('GetAccessPermissionsForObjectW')(pObjectName, ObjectType, ObjectTypeName, pTrustee, pcCountOfExplicitEntries, pListOfExplicitEntries, pcCountOfPermissions, ppPermissionList, ppDefaultAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getace
  public static GetAce(pAcl: PACL, dwAceIndex: DWORD, pAce_out: PVOID): BOOL {
    return Advapi32.Load('GetAce')(pAcl, dwAceIndex, pAce_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getaclinformation
  public static GetAclInformation(pAcl: PACL, pAclInformation_out: LPVOID, nAclInformationLength: DWORD, dwAclInformationClass: DWORD): BOOL {
    return Advapi32.Load('GetAclInformation')(pAcl, pAclInformation_out, nAclInformationLength, dwAclInformationClass);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getauditedpermissionsfromacla
  public static GetAuditedPermissionsFromAclA(pacl: PACL, pTrustee: PTRUSTEE, pSuccessfulAuditedRights_out: LPDWORD, pFailedAuditRights_out: LPDWORD): DWORD {
    return Advapi32.Load('GetAuditedPermissionsFromAclA')(pacl, pTrustee, pSuccessfulAuditedRights_out, pFailedAuditRights_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getauditedpermissionsfromaclw
  public static GetAuditedPermissionsFromAclW(pacl: PACL, pTrustee: PTRUSTEE, pSuccessfulAuditedRights_out: LPDWORD, pFailedAuditRights_out: LPDWORD): DWORD {
    return Advapi32.Load('GetAuditedPermissionsFromAclW')(pacl, pTrustee, pSuccessfulAuditedRights_out, pFailedAuditRights_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcurrenthwprofilea
  public static GetCurrentHwProfileA(lpHwProfileInfo_out: PVOID): BOOL {
    return Advapi32.Load('GetCurrentHwProfileA')(lpHwProfileInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcurrenthwprofilew
  public static GetCurrentHwProfileW(lpHwProfileInfo_out: PVOID): BOOL {
    return Advapi32.Load('GetCurrentHwProfileW')(lpHwProfileInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/timezoneapi/nf-timezoneapi-getdynamictimezoneinformationeffectiveyears
  public static GetDynamicTimeZoneInformationEffectiveYears(lpTimeZoneInformation: PVOID, FirstYear_out: LPDWORD, LastYear_out: LPDWORD): DWORD {
    return Advapi32.Load('GetDynamicTimeZoneInformationEffectiveYears')(lpTimeZoneInformation, FirstYear_out, LastYear_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-geteffectiverightsfromacla
  public static GetEffectiveRightsFromAclA(pacl: PACL, pTrustee: PTRUSTEE, pAccessRights_out: LPDWORD): DWORD {
    return Advapi32.Load('GetEffectiveRightsFromAclA')(pacl, pTrustee, pAccessRights_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-geteffectiverightsfromaclw
  public static GetEffectiveRightsFromAclW(pacl: PACL, pTrustee: PTRUSTEE, pAccessRights_out: LPDWORD): DWORD {
    return Advapi32.Load('GetEffectiveRightsFromAclW')(pacl, pTrustee, pAccessRights_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-getencryptedfilemetadata
  public static GetEncryptedFileMetadata(lpFileName: LPCWSTR, pcbMetadata_out: LPDWORD, ppbMetadata_out: PVOID): DWORD {
    return Advapi32.Load('GetEncryptedFileMetadata')(lpFileName, pcbMetadata_out, ppbMetadata_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-geteventloginformation
  public static GetEventLogInformation(hEventLog: HANDLE, dwInfoLevel: DWORD, lpBuffer_out: LPVOID, cbBufSize: DWORD, pcbBytesNeeded_out: LPDWORD): BOOL {
    return Advapi32.Load('GetEventLogInformation')(hEventLog, dwInfoLevel, lpBuffer_out, cbBufSize, pcbBytesNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getexplicitentriesfromacla
  public static GetExplicitEntriesFromAclA(pacl: PACL, pcCountOfExplicitEntries_out: PULONG, pListOfExplicitEntries_out: PVOID): DWORD {
    return Advapi32.Load('GetExplicitEntriesFromAclA')(pacl, pcCountOfExplicitEntries_out, pListOfExplicitEntries_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getexplicitentriesfromaclw
  public static GetExplicitEntriesFromAclW(pacl: PACL, pcCountOfExplicitEntries_out: PULONG, pListOfExplicitEntries_out: PVOID): DWORD {
    return Advapi32.Load('GetExplicitEntriesFromAclW')(pacl, pcCountOfExplicitEntries_out, pListOfExplicitEntries_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getfilesecuritya
  public static GetFileSecurityA(lpFileName: LPCSTR, RequestedInformation: SECURITY_INFORMATION, pSecurityDescriptor_out: OPTIONAL<PSECURITY_DESCRIPTOR>, nLength: DWORD, lpnLengthNeeded_out: LPDWORD): BOOL {
    return Advapi32.Load('GetFileSecurityA')(lpFileName, RequestedInformation, pSecurityDescriptor_out, nLength, lpnLengthNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getfilesecurityw
  public static GetFileSecurityW(lpFileName: LPCWSTR, RequestedInformation: SECURITY_INFORMATION, pSecurityDescriptor_out: OPTIONAL<PSECURITY_DESCRIPTOR>, nLength: DWORD, lpnLengthNeeded_out: LPDWORD): BOOL {
    return Advapi32.Load('GetFileSecurityW')(lpFileName, RequestedInformation, pSecurityDescriptor_out, nLength, lpnLengthNeeded_out);
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
  public static GetInheritanceSourceA(
    pObjectName: LPCSTR,
    ObjectType: DWORD,
    SecurityInfo: SECURITY_INFORMATION,
    Container: BOOL,
    pObjectClassGuids: OPTIONAL<PVOID>,
    GuidCount: DWORD,
    pAcl: PACL,
    pfnArray: OPTIONAL<PVOID>,
    pGenericMapping: PGENERIC_MAPPING,
    pInheritArray_out: PVOID,
  ): DWORD {
    return Advapi32.Load('GetInheritanceSourceA')(pObjectName, ObjectType, SecurityInfo, Container, pObjectClassGuids, GuidCount, pAcl, pfnArray, pGenericMapping, pInheritArray_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getinheritancesourcew
  public static GetInheritanceSourceW(
    pObjectName: LPCWSTR,
    ObjectType: DWORD,
    SecurityInfo: SECURITY_INFORMATION,
    Container: BOOL,
    pObjectClassGuids: OPTIONAL<PVOID>,
    GuidCount: DWORD,
    pAcl: PACL,
    pfnArray: OPTIONAL<PVOID>,
    pGenericMapping: PGENERIC_MAPPING,
    pInheritArray_out: PVOID,
  ): DWORD {
    return Advapi32.Load('GetInheritanceSourceW')(pObjectName, ObjectType, SecurityInfo, Container, pObjectClassGuids, GuidCount, pAcl, pfnArray, pGenericMapping, pInheritArray_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getkernelobjectsecurity
  public static GetKernelObjectSecurity(Handle: HANDLE, RequestedInformation: SECURITY_INFORMATION, pSecurityDescriptor_out: OPTIONAL<PSECURITY_DESCRIPTOR>, nLength: DWORD, lpnLengthNeeded_out: LPDWORD): BOOL {
    return Advapi32.Load('GetKernelObjectSecurity')(Handle, RequestedInformation, pSecurityDescriptor_out, nLength, lpnLengthNeeded_out);
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
  public static GetMultipleTrusteeA(pTrustee: OPTIONAL<PTRUSTEE>): PVOID {
    return Advapi32.Load('GetMultipleTrusteeA')(pTrustee);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getmultipletrusteeoperationa
  public static GetMultipleTrusteeOperationA(pTrustee: OPTIONAL<PTRUSTEE>): DWORD {
    return Advapi32.Load('GetMultipleTrusteeOperationA')(pTrustee);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getmultipletrusteeoperationw
  public static GetMultipleTrusteeOperationW(pTrustee: OPTIONAL<PTRUSTEE>): DWORD {
    return Advapi32.Load('GetMultipleTrusteeOperationW')(pTrustee);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getmultipletrusteew
  public static GetMultipleTrusteeW(pTrustee: OPTIONAL<PTRUSTEE>): LPVOID {
    return Advapi32.Load('GetMultipleTrusteeW')(pTrustee);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getnamedsecurityinfoa
  public static GetNamedSecurityInfoA(
    pObjectName: LPCSTR,
    ObjectType: DWORD,
    SecurityInfo: SECURITY_INFORMATION,
    ppsidOwner_out: OPTIONAL<PVOID>,
    ppsidGroup_out: OPTIONAL<PVOID>,
    ppDacl_out: OPTIONAL<PVOID>,
    ppSacl_out: OPTIONAL<PVOID>,
    ppSecurityDescriptor_out: PVOID,
  ): DWORD {
    return Advapi32.Load('GetNamedSecurityInfoA')(pObjectName, ObjectType, SecurityInfo, ppsidOwner_out, ppsidGroup_out, ppDacl_out, ppSacl_out, ppSecurityDescriptor_out);
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
  public static GetNamedSecurityInfoW(
    pObjectName: LPCWSTR,
    ObjectType: DWORD,
    SecurityInfo: SECURITY_INFORMATION,
    ppsidOwner_out: OPTIONAL<PVOID>,
    ppsidGroup_out: OPTIONAL<PVOID>,
    ppDacl_out: OPTIONAL<PVOID>,
    ppSacl_out: OPTIONAL<PVOID>,
    ppSecurityDescriptor_out: PVOID,
  ): DWORD {
    return Advapi32.Load('GetNamedSecurityInfoW')(pObjectName, ObjectType, SecurityInfo, ppsidOwner_out, ppsidGroup_out, ppDacl_out, ppSacl_out, ppSecurityDescriptor_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getnumberofeventlogrecords
  public static GetNumberOfEventLogRecords(hEventLog: HANDLE, NumberOfRecords_out: LPDWORD): BOOL {
    return Advapi32.Load('GetNumberOfEventLogRecords')(hEventLog, NumberOfRecords_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getoldesteventlogrecord
  public static GetOldestEventLogRecord(hEventLog: HANDLE, OldestRecord_out: LPDWORD): BOOL {
    return Advapi32.Load('GetOldestEventLogRecord')(hEventLog, OldestRecord_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getoverlappedaccessresults
  public static GetOverlappedAccessResults(pOverlapped: PVOID, pResult: PVOID, pfPending: PVOID, bWait: BOOL): DWORD {
    return Advapi32.Load('GetOverlappedAccessResults')(pOverlapped, pResult, pfPending, bWait);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getprivateobjectsecurity
  public static GetPrivateObjectSecurity(ObjectDescriptor: PSECURITY_DESCRIPTOR, SecurityInformation: SECURITY_INFORMATION, ResultantDescriptor_out: OPTIONAL<PSECURITY_DESCRIPTOR>, DescriptorLength: DWORD, ReturnLength_out: LPDWORD): BOOL {
    return Advapi32.Load('GetPrivateObjectSecurity')(ObjectDescriptor, SecurityInformation, ResultantDescriptor_out, DescriptorLength, ReturnLength_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getsecuritydescriptorcontrol
  public static GetSecurityDescriptorControl(pSecurityDescriptor: PSECURITY_DESCRIPTOR, pControl_out: PVOID, lpdwRevision_out: LPDWORD): BOOL {
    return Advapi32.Load('GetSecurityDescriptorControl')(pSecurityDescriptor, pControl_out, lpdwRevision_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getsecuritydescriptordacl
  public static GetSecurityDescriptorDacl(pSecurityDescriptor: PSECURITY_DESCRIPTOR, lpbDaclPresent_out: LPBOOL, pDacl_out: PVOID, lpbDaclDefaulted_out: LPBOOL): BOOL {
    return Advapi32.Load('GetSecurityDescriptorDacl')(pSecurityDescriptor, lpbDaclPresent_out, pDacl_out, lpbDaclDefaulted_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getsecuritydescriptorgroup
  public static GetSecurityDescriptorGroup(pSecurityDescriptor: PSECURITY_DESCRIPTOR, pGroup_out: PVOID, lpbGroupDefaulted_out: LPBOOL): BOOL {
    return Advapi32.Load('GetSecurityDescriptorGroup')(pSecurityDescriptor, pGroup_out, lpbGroupDefaulted_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getsecuritydescriptorlength
  public static GetSecurityDescriptorLength(pSecurityDescriptor: PSECURITY_DESCRIPTOR): DWORD {
    return Advapi32.Load('GetSecurityDescriptorLength')(pSecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getsecuritydescriptorowner
  public static GetSecurityDescriptorOwner(pSecurityDescriptor: PSECURITY_DESCRIPTOR, pOwner_out: PVOID, lpbOwnerDefaulted_out: LPBOOL): BOOL {
    return Advapi32.Load('GetSecurityDescriptorOwner')(pSecurityDescriptor, pOwner_out, lpbOwnerDefaulted_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getsecuritydescriptorrmcontrol
  public static GetSecurityDescriptorRMControl(SecurityDescriptor: PSECURITY_DESCRIPTOR, RMControl_out: PUCHAR): DWORD {
    return Advapi32.Load('GetSecurityDescriptorRMControl')(SecurityDescriptor, RMControl_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getsecuritydescriptorsacl
  public static GetSecurityDescriptorSacl(pSecurityDescriptor: PSECURITY_DESCRIPTOR, lpbSaclPresent_out: LPBOOL, pSacl_out: PVOID, lpbSaclDefaulted_out: LPBOOL): BOOL {
    return Advapi32.Load('GetSecurityDescriptorSacl')(pSecurityDescriptor, lpbSaclPresent_out, pSacl_out, lpbSaclDefaulted_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getsecurityinfo
  public static GetSecurityInfo(
    handle: HANDLE,
    ObjectType: DWORD,
    SecurityInfo: SECURITY_INFORMATION,
    ppsidOwner_out: OPTIONAL<PVOID>,
    ppsidGroup_out: OPTIONAL<PVOID>,
    ppDacl_out: OPTIONAL<PVOID>,
    ppSacl_out: OPTIONAL<PVOID>,
    ppSecurityDescriptor_out: OPTIONAL<PVOID>,
  ): DWORD {
    return Advapi32.Load('GetSecurityInfo')(handle, ObjectType, SecurityInfo, ppsidOwner_out, ppsidGroup_out, ppDacl_out, ppSacl_out, ppSecurityDescriptor_out);
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
  public static GetServiceDisplayNameA(hSCManager: SC_HANDLE, lpServiceName: LPCSTR, lpDisplayName_out: OPTIONAL<LPSTR>, lpcchBuffer_in_out: LPDWORD): BOOL {
    return Advapi32.Load('GetServiceDisplayNameA')(hSCManager, lpServiceName, lpDisplayName_out, lpcchBuffer_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-getservicedisplaynamew
  public static GetServiceDisplayNameW(hSCManager: SC_HANDLE, lpServiceName: LPCWSTR, lpDisplayName_out: OPTIONAL<LPWSTR>, lpcchBuffer_in_out: LPDWORD): BOOL {
    return Advapi32.Load('GetServiceDisplayNameW')(hSCManager, lpServiceName, lpDisplayName_out, lpcchBuffer_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-getservicekeynamea
  public static GetServiceKeyNameA(hSCManager: SC_HANDLE, lpDisplayName: LPCSTR, lpServiceName_out: OPTIONAL<LPSTR>, lpcchBuffer_in_out: LPDWORD): BOOL {
    return Advapi32.Load('GetServiceKeyNameA')(hSCManager, lpDisplayName, lpServiceName_out, lpcchBuffer_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-getservicekeynamew
  public static GetServiceKeyNameW(hSCManager: SC_HANDLE, lpDisplayName: LPCWSTR, lpServiceName_out: OPTIONAL<LPWSTR>, lpcchBuffer_in_out: LPDWORD): BOOL {
    return Advapi32.Load('GetServiceKeyNameW')(hSCManager, lpDisplayName, lpServiceName_out, lpcchBuffer_in_out);
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
  public static GetThreadWaitChain(WctHandle: HWCT, Context: OPTIONAL<PVOID>, Flags: ULONG, ThreadId: DWORD, NodeCount_in_out: LPDWORD, NodeInfoArray_out: PVOID, IsCycle_out: LPBOOL): BOOL {
    return Advapi32.Load('GetThreadWaitChain')(WctHandle, Context, Flags, ThreadId, NodeCount_in_out, NodeInfoArray_out, IsCycle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-gettokeninformation
  public static GetTokenInformation(TokenHandle: HANDLE, TokenInformationClass: TOKEN_INFORMATION_CLASS, TokenInformation_out: OPTIONAL<LPVOID>, TokenInformationLength: DWORD, ReturnLength_out: LPDWORD): BOOL {
    return Advapi32.Load('GetTokenInformation')(TokenHandle, TokenInformationClass, TokenInformation_out, TokenInformationLength, ReturnLength_out);
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
  public static GetTrusteeTypeA(pTrustee: OPTIONAL<PTRUSTEE>): DWORD {
    return Advapi32.Load('GetTrusteeTypeA')(pTrustee);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-gettrusteetypew
  public static GetTrusteeTypeW(pTrustee: OPTIONAL<PTRUSTEE>): DWORD {
    return Advapi32.Load('GetTrusteeTypeW')(pTrustee);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getusernamea
  public static GetUserNameA(lpBuffer_out: OPTIONAL<LPSTR>, pcbBuffer_in_out: LPDWORD): BOOL {
    return Advapi32.Load('GetUserNameA')(lpBuffer_out, pcbBuffer_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getusernamew
  public static GetUserNameW(lpBuffer_out: OPTIONAL<LPWSTR>, pcbBuffer_in_out: LPDWORD): BOOL {
    return Advapi32.Load('GetUserNameW')(lpBuffer_out, pcbBuffer_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-getwindowsaccountdomainsid
  public static GetWindowsAccountDomainSid(pSid: PSID, pDomainSid_out: OPTIONAL<PSID>, cbDomainSid_in_out: LPDWORD): BOOL {
    return Advapi32.Load('GetWindowsAccountDomainSid')(pSid, pDomainSid_out, cbDomainSid_in_out);
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
  public static InitializeAcl(pAcl_out: PACL, nAclLength: DWORD, dwAclRevision: DWORD): BOOL {
    return Advapi32.Load('InitializeAcl')(pAcl_out, nAclLength, dwAclRevision);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-initializesecuritydescriptor
  public static InitializeSecurityDescriptor(pSecurityDescriptor_out: PSECURITY_DESCRIPTOR, dwRevision: DWORD): BOOL {
    return Advapi32.Load('InitializeSecurityDescriptor')(pSecurityDescriptor_out, dwRevision);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-initializesid
  public static InitializeSid(Sid_out: PSID, pIdentifierAuthority: PSID_IDENTIFIER_AUTHORITY, nSubAuthorityCount: BYTE): BOOL {
    return Advapi32.Load('InitializeSid')(Sid_out, pIdentifierAuthority, nSubAuthorityCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-initiateshutdowna
  public static InitiateShutdownA(lpMachineName: OPTIONAL<LPSTR>, lpMessage: OPTIONAL<LPSTR>, dwGracePeriod: DWORD, dwShutdownFlags: DWORD, dwReason: DWORD): DWORD {
    return Advapi32.Load('InitiateShutdownA')(lpMachineName, lpMessage, dwGracePeriod, dwShutdownFlags, dwReason);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-initiateshutdownw
  public static InitiateShutdownW(lpMachineName: OPTIONAL<LPWSTR>, lpMessage: OPTIONAL<LPWSTR>, dwGracePeriod: DWORD, dwShutdownFlags: DWORD, dwReason: DWORD): DWORD {
    return Advapi32.Load('InitiateShutdownW')(lpMachineName, lpMessage, dwGracePeriod, dwShutdownFlags, dwReason);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-initiatesystemshutdowna
  public static InitiateSystemShutdownA(lpMachineName: OPTIONAL<LPSTR>, lpMessage: OPTIONAL<LPSTR>, dwTimeout: DWORD, bForceAppsClosed: BOOL, bRebootAfterShutdown: BOOL): BOOL {
    return Advapi32.Load('InitiateSystemShutdownA')(lpMachineName, lpMessage, dwTimeout, bForceAppsClosed, bRebootAfterShutdown);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-initiatesystemshutdownexa
  public static InitiateSystemShutdownExA(lpMachineName: OPTIONAL<LPSTR>, lpMessage: OPTIONAL<LPSTR>, dwTimeout: DWORD, bForceAppsClosed: BOOL, bRebootAfterShutdown: BOOL, dwReason: DWORD): BOOL {
    return Advapi32.Load('InitiateSystemShutdownExA')(lpMachineName, lpMessage, dwTimeout, bForceAppsClosed, bRebootAfterShutdown, dwReason);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-initiatesystemshutdownexw
  public static InitiateSystemShutdownExW(lpMachineName: OPTIONAL<LPWSTR>, lpMessage: OPTIONAL<LPWSTR>, dwTimeout: DWORD, bForceAppsClosed: BOOL, bRebootAfterShutdown: BOOL, dwReason: DWORD): BOOL {
    return Advapi32.Load('InitiateSystemShutdownExW')(lpMachineName, lpMessage, dwTimeout, bForceAppsClosed, bRebootAfterShutdown, dwReason);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-initiatesystemshutdownw
  public static InitiateSystemShutdownW(lpMachineName: OPTIONAL<LPWSTR>, lpMessage: OPTIONAL<LPWSTR>, dwTimeout: DWORD, bForceAppsClosed: BOOL, bRebootAfterShutdown: BOOL): BOOL {
    return Advapi32.Load('InitiateSystemShutdownW')(lpMachineName, lpMessage, dwTimeout, bForceAppsClosed, bRebootAfterShutdown);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmgmt/nf-appmgmt-installapplication
  public static InstallApplication(pInstallInfo: PVOID): DWORD {
    return Advapi32.Load('InstallApplication')(pInstallInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-istextunicode
  public static IsTextUnicode(lpv: LPCVOID, iSize: INT, lpiResult_in_out: OPTIONAL<LPVOID>): BOOL {
    return Advapi32.Load('IsTextUnicode')(lpv, iSize, lpiResult_in_out);
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
  public static LogonUserA(lpszUsername: LPCSTR, lpszDomain: OPTIONAL<LPCSTR>, lpszPassword: OPTIONAL<LPCSTR>, dwLogonType: DWORD, dwLogonProvider: DWORD, phToken_out: PHANDLE): BOOL {
    return Advapi32.Load('LogonUserA')(lpszUsername, lpszDomain, lpszPassword, dwLogonType, dwLogonProvider, phToken_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-logonuserexa
  public static LogonUserExA(
    lpszUsername: LPCSTR,
    lpszDomain: OPTIONAL<LPCSTR>,
    lpszPassword: OPTIONAL<LPCSTR>,
    dwLogonType: DWORD,
    dwLogonProvider: DWORD,
    phToken_out: OPTIONAL<PHANDLE>,
    ppLogonSid_out: OPTIONAL<PVOID>,
    ppProfileBuffer_out: OPTIONAL<PVOID>,
    pdwProfileLength_out: OPTIONAL<LPDWORD>,
    pQuotaLimits_out: OPTIONAL<PVOID>,
  ): BOOL {
    return Advapi32.Load('LogonUserExA')(lpszUsername, lpszDomain, lpszPassword, dwLogonType, dwLogonProvider, phToken_out, ppLogonSid_out, ppProfileBuffer_out, pdwProfileLength_out, pQuotaLimits_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-logonuserexexw
  public static LogonUserExExW(
    lpszUsername: LPCWSTR,
    lpszDomain: LPCWSTR,
    lpszPassword: LPCWSTR,
    dwLogonType: DWORD,
    dwLogonProvider: DWORD,
    pTokenGroups: PTOKEN_GROUPS,
    phToken: PHANDLE,
    ppLogonSid: PVOID,
    ppProfileBuffer: PVOID,
    pdwProfileLength: LPDWORD,
    pQuotaLimits: PVOID,
  ): BOOL {
    return Advapi32.Load('LogonUserExExW')(lpszUsername, lpszDomain, lpszPassword, dwLogonType, dwLogonProvider, pTokenGroups, phToken, ppLogonSid, ppProfileBuffer, pdwProfileLength, pQuotaLimits);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-logonuserexw
  public static LogonUserExW(
    lpszUsername: LPCWSTR,
    lpszDomain: OPTIONAL<LPCWSTR>,
    lpszPassword: OPTIONAL<LPCWSTR>,
    dwLogonType: DWORD,
    dwLogonProvider: DWORD,
    phToken_out: OPTIONAL<PHANDLE>,
    ppLogonSid_out: OPTIONAL<PVOID>,
    ppProfileBuffer_out: OPTIONAL<PVOID>,
    pdwProfileLength_out: OPTIONAL<LPDWORD>,
    pQuotaLimits_out: OPTIONAL<PVOID>,
  ): BOOL {
    return Advapi32.Load('LogonUserExW')(lpszUsername, lpszDomain, lpszPassword, dwLogonType, dwLogonProvider, phToken_out, ppLogonSid_out, ppProfileBuffer_out, pdwProfileLength_out, pQuotaLimits_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-logonuserw
  public static LogonUserW(lpszUsername: LPCWSTR, lpszDomain: OPTIONAL<LPCWSTR>, lpszPassword: OPTIONAL<LPCWSTR>, dwLogonType: DWORD, dwLogonProvider: DWORD, phToken_out: PHANDLE): BOOL {
    return Advapi32.Load('LogonUserW')(lpszUsername, lpszDomain, lpszPassword, dwLogonType, dwLogonProvider, phToken_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lookupaccountnamea
  public static LookupAccountNameA(
    lpSystemName: OPTIONAL<LPCSTR>,
    lpAccountName: LPCSTR,
    Sid_out: OPTIONAL<PSID>,
    cbSid_in_out: LPDWORD,
    ReferencedDomainName_out: OPTIONAL<LPSTR>,
    cchReferencedDomainName_in_out: LPDWORD,
    peUse_out: PSID_NAME_USE,
  ): BOOL {
    return Advapi32.Load('LookupAccountNameA')(lpSystemName, lpAccountName, Sid_out, cbSid_in_out, ReferencedDomainName_out, cchReferencedDomainName_in_out, peUse_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lookupaccountnamew
  public static LookupAccountNameW(
    lpSystemName: OPTIONAL<LPCWSTR>,
    lpAccountName: LPCWSTR,
    Sid_out: OPTIONAL<PSID>,
    cbSid_in_out: LPDWORD,
    ReferencedDomainName_out: OPTIONAL<LPWSTR>,
    cchReferencedDomainName_in_out: LPDWORD,
    peUse_out: PSID_NAME_USE,
  ): BOOL {
    return Advapi32.Load('LookupAccountNameW')(lpSystemName, lpAccountName, Sid_out, cbSid_in_out, ReferencedDomainName_out, cchReferencedDomainName_in_out, peUse_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lookupaccountsida
  public static LookupAccountSidA(
    lpSystemName: OPTIONAL<LPCSTR>,
    Sid: PSID,
    Name_out: OPTIONAL<LPSTR>,
    cchName_in_out: LPDWORD,
    ReferencedDomainName_out: OPTIONAL<LPSTR>,
    cchReferencedDomainName_in_out: LPDWORD,
    peUse_out: PSID_NAME_USE,
  ): BOOL {
    return Advapi32.Load('LookupAccountSidA')(lpSystemName, Sid, Name_out, cchName_in_out, ReferencedDomainName_out, cchReferencedDomainName_in_out, peUse_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lookupaccountsidw
  public static LookupAccountSidW(
    lpSystemName: OPTIONAL<LPCWSTR>,
    Sid: PSID,
    Name_out: OPTIONAL<LPWSTR>,
    cchName_in_out: LPDWORD,
    ReferencedDomainName_out: OPTIONAL<LPWSTR>,
    cchReferencedDomainName_in_out: LPDWORD,
    peUse_out: PSID_NAME_USE,
  ): BOOL {
    return Advapi32.Load('LookupAccountSidW')(lpSystemName, Sid, Name_out, cchName_in_out, ReferencedDomainName_out, cchReferencedDomainName_in_out, peUse_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lookupprivilegedisplaynamea
  public static LookupPrivilegeDisplayNameA(lpSystemName: OPTIONAL<LPCSTR>, lpName: LPCSTR, lpDisplayName_out: OPTIONAL<LPSTR>, cchDisplayName_in_out: LPDWORD, lpLanguageId_out: LPDWORD): BOOL {
    return Advapi32.Load('LookupPrivilegeDisplayNameA')(lpSystemName, lpName, lpDisplayName_out, cchDisplayName_in_out, lpLanguageId_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lookupprivilegedisplaynamew
  public static LookupPrivilegeDisplayNameW(lpSystemName: OPTIONAL<LPCWSTR>, lpName: LPCWSTR, lpDisplayName_out: OPTIONAL<LPWSTR>, cchDisplayName_in_out: LPDWORD, lpLanguageId_out: LPDWORD): BOOL {
    return Advapi32.Load('LookupPrivilegeDisplayNameW')(lpSystemName, lpName, lpDisplayName_out, cchDisplayName_in_out, lpLanguageId_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lookupprivilegenamea
  public static LookupPrivilegeNameA(lpSystemName: OPTIONAL<LPCSTR>, lpLuid: PVOID, lpName_out: OPTIONAL<LPSTR>, cchName_in_out: LPDWORD): BOOL {
    return Advapi32.Load('LookupPrivilegeNameA')(lpSystemName, lpLuid, lpName_out, cchName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lookupprivilegenamew
  public static LookupPrivilegeNameW(lpSystemName: OPTIONAL<LPCWSTR>, lpLuid: PVOID, lpName_out: OPTIONAL<LPWSTR>, cchName_in_out: LPDWORD): BOOL {
    return Advapi32.Load('LookupPrivilegeNameW')(lpSystemName, lpLuid, lpName_out, cchName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lookupprivilegevaluea
  public static LookupPrivilegeValueA(lpSystemName: OPTIONAL<LPCSTR>, lpName: LPCSTR, lpLuid_out: PVOID): BOOL {
    return Advapi32.Load('LookupPrivilegeValueA')(lpSystemName, lpName, lpLuid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lookupprivilegevaluew
  public static LookupPrivilegeValueW(lpSystemName: OPTIONAL<LPCWSTR>, lpName: LPCWSTR, lpLuid_out: PVOID): BOOL {
    return Advapi32.Load('LookupPrivilegeValueW')(lpSystemName, lpName, lpLuid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-lookupsecuritydescriptorpartsa
  public static LookupSecurityDescriptorPartsA(
    pOwner_out: OPTIONAL<PVOID>,
    pGroup_out: OPTIONAL<PVOID>,
    cCountOfAccessEntries_out: OPTIONAL<PULONG>,
    pListOfAccessEntries_out: PVOID,
    cCountOfAuditEntries_out: OPTIONAL<PULONG>,
    pListOfAuditEntries_out: PVOID,
    pSD: PSECURITY_DESCRIPTOR,
  ): DWORD {
    return Advapi32.Load('LookupSecurityDescriptorPartsA')(pOwner_out, pGroup_out, cCountOfAccessEntries_out, pListOfAccessEntries_out, cCountOfAuditEntries_out, pListOfAuditEntries_out, pSD);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-lookupsecuritydescriptorpartsw
  public static LookupSecurityDescriptorPartsW(
    pOwner_out: OPTIONAL<PVOID>,
    pGroup_out: OPTIONAL<PVOID>,
    cCountOfAccessEntries_out: OPTIONAL<PULONG>,
    pListOfAccessEntries_out: PVOID,
    cCountOfAuditEntries_out: OPTIONAL<PULONG>,
    pListOfAuditEntries_out: PVOID,
    pSD: PSECURITY_DESCRIPTOR,
  ): DWORD {
    return Advapi32.Load('LookupSecurityDescriptorPartsW')(pOwner_out, pGroup_out, cCountOfAccessEntries_out, pListOfAccessEntries_out, cCountOfAuditEntries_out, pListOfAuditEntries_out, pSD);
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
  public static LsaCreateAccount(PolicyHandle: LSA_HANDLE, AccountSid: PSID, DesiredAccess: ACCESS_MASK, AccountHandle_out: PLSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaCreateAccount')(PolicyHandle, AccountSid, DesiredAccess, AccountHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsacreatesecret
  public static LsaCreateSecret(PolicyHandle: LSA_HANDLE, SecretName: PLSA_UNICODE_STRING, DesiredAccess: ACCESS_MASK, SecretHandle_out: PLSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaCreateSecret')(PolicyHandle, SecretName, DesiredAccess, SecretHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsacreatetrusteddomain
  public static LsaCreateTrustedDomain(PolicyHandle: LSA_HANDLE, TrustedDomainInformation: PLSA_TRUST_INFORMATION, DesiredAccess: ACCESS_MASK, TrustedDomainHandle_out: PLSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaCreateTrustedDomain')(PolicyHandle, TrustedDomainInformation, DesiredAccess, TrustedDomainHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsacreatetrusteddomainex
  public static LsaCreateTrustedDomainEx(PolicyHandle: LSA_HANDLE, TrustedDomainInformation: PVOID, AuthenticationInformation: PVOID, DesiredAccess: ACCESS_MASK, TrustedDomainHandle_out: PLSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaCreateTrustedDomainEx')(PolicyHandle, TrustedDomainInformation, AuthenticationInformation, DesiredAccess, TrustedDomainHandle_out);
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
  public static LsaEnumerateAccountRights(PolicyHandle: LSA_HANDLE, AccountSid: PSID, UserRights_out: PVOID, CountOfRights_out: PULONG): NTSTATUS {
    return Advapi32.Load('LsaEnumerateAccountRights')(PolicyHandle, AccountSid, UserRights_out, CountOfRights_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsaenumerateaccounts
  public static LsaEnumerateAccounts(PolicyHandle: LSA_HANDLE, EnumerationContext_in_out: PVOID, Buffer_out: PVOID, PreferedMaximumLength: ULONG, CountReturned_out: PULONG): NTSTATUS {
    return Advapi32.Load('LsaEnumerateAccounts')(PolicyHandle, EnumerationContext_in_out, Buffer_out, PreferedMaximumLength, CountReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaenumerateaccountswithuserright
  public static LsaEnumerateAccountsWithUserRight(PolicyHandle: LSA_HANDLE, UserRight: OPTIONAL<PLSA_UNICODE_STRING>, Buffer_out: PVOID, CountReturned_out: PULONG): NTSTATUS {
    return Advapi32.Load('LsaEnumerateAccountsWithUserRight')(PolicyHandle, UserRight, Buffer_out, CountReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsaenumerateprivileges
  public static LsaEnumeratePrivileges(PolicyHandle: LSA_HANDLE, EnumerationContext_in_out: PVOID, Buffer_out: PVOID, PreferedMaximumLength: ULONG, CountReturned_out: PULONG): NTSTATUS {
    return Advapi32.Load('LsaEnumeratePrivileges')(PolicyHandle, EnumerationContext_in_out, Buffer_out, PreferedMaximumLength, CountReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsaenumerateprivilegesofaccount
  public static LsaEnumeratePrivilegesOfAccount(AccountHandle: LSA_HANDLE, Privileges_out: PVOID): NTSTATUS {
    return Advapi32.Load('LsaEnumeratePrivilegesOfAccount')(AccountHandle, Privileges_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaenumeratetrusteddomains
  public static LsaEnumerateTrustedDomains(PolicyHandle: LSA_HANDLE, EnumerationContext_in_out: PVOID, Buffer_out: PVOID, PreferedMaximumLength: ULONG, CountReturned_out: PULONG): NTSTATUS {
    return Advapi32.Load('LsaEnumerateTrustedDomains')(PolicyHandle, EnumerationContext_in_out, Buffer_out, PreferedMaximumLength, CountReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaenumeratetrusteddomainsex
  public static LsaEnumerateTrustedDomainsEx(PolicyHandle: LSA_HANDLE, EnumerationContext_in_out: PVOID, Buffer_out: PVOID, PreferedMaximumLength: ULONG, CountReturned_out: PULONG): NTSTATUS {
    return Advapi32.Load('LsaEnumerateTrustedDomainsEx')(PolicyHandle, EnumerationContext_in_out, Buffer_out, PreferedMaximumLength, CountReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsafreememory
  public static LsaFreeMemory(Buffer: OPTIONAL<PVOID>): NTSTATUS {
    return Advapi32.Load('LsaFreeMemory')(Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsagetappliedcapids
  public static LsaGetAppliedCAPIDs(SystemName: OPTIONAL<PLSA_UNICODE_STRING>, CAPIDs_out: PVOID, CAPIDCount_out: PULONG): NTSTATUS {
    return Advapi32.Load('LsaGetAppliedCAPIDs')(SystemName, CAPIDs_out, CAPIDCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsagetdeviceregistrationinfo
  public static LsaGetDeviceRegistrationInfo(InformationClass: DWORD, ppDeviceInfo: PVOID): NTSTATUS {
    return Advapi32.Load('LsaGetDeviceRegistrationInfo')(InformationClass, ppDeviceInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsagetquotasforaccount
  public static LsaGetQuotasForAccount(AccountHandle: LSA_HANDLE, QuotaLimits_out: PVOID): NTSTATUS {
    return Advapi32.Load('LsaGetQuotasForAccount')(AccountHandle, QuotaLimits_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsagetremoteusername
  public static LsaGetRemoteUserName(SystemName: OPTIONAL<PLSA_UNICODE_STRING>, UserName_out: PVOID, DomainName_out: OPTIONAL<PVOID>): NTSTATUS {
    return Advapi32.Load('LsaGetRemoteUserName')(SystemName, UserName_out, DomainName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsagetsystemaccessaccount
  public static LsaGetSystemAccessAccount(AccountHandle: LSA_HANDLE, SystemAccess_out: PULONG): NTSTATUS {
    return Advapi32.Load('LsaGetSystemAccessAccount')(AccountHandle, SystemAccess_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsagetusername
  public static LsaGetUserName(UserName_out: PVOID, DomainName_out: OPTIONAL<PVOID>): NTSTATUS {
    return Advapi32.Load('LsaGetUserName')(UserName_out, DomainName_out);
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
  public static LsaLookupNames(PolicyHandle: LSA_HANDLE, Count: ULONG, Names: PLSA_UNICODE_STRING, ReferencedDomains_out: PVOID, Sids_out: PVOID): NTSTATUS {
    return Advapi32.Load('LsaLookupNames')(PolicyHandle, Count, Names, ReferencedDomains_out, Sids_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsalookupnames2
  public static LsaLookupNames2(PolicyHandle: LSA_HANDLE, Flags: ULONG, Count: ULONG, Names: PLSA_UNICODE_STRING, ReferencedDomains_out: PVOID, Sids_out: PVOID): NTSTATUS {
    return Advapi32.Load('LsaLookupNames2')(PolicyHandle, Flags, Count, Names, ReferencedDomains_out, Sids_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsalookupprivilegedisplayname
  public static LsaLookupPrivilegeDisplayName(PolicyHandle: LSA_HANDLE, Name: PLSA_UNICODE_STRING, DisplayName_out: PVOID, LanguageReturned_out: PVOID): NTSTATUS {
    return Advapi32.Load('LsaLookupPrivilegeDisplayName')(PolicyHandle, Name, DisplayName_out, LanguageReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsalookupprivilegename
  public static LsaLookupPrivilegeName(PolicyHandle: LSA_HANDLE, Value: PVOID, Name_out: PVOID): NTSTATUS {
    return Advapi32.Load('LsaLookupPrivilegeName')(PolicyHandle, Value, Name_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsalookupprivilegevalue
  public static LsaLookupPrivilegeValue(PolicyHandle: LSA_HANDLE, Name: PLSA_UNICODE_STRING, Value_out: PVOID): NTSTATUS {
    return Advapi32.Load('LsaLookupPrivilegeValue')(PolicyHandle, Name, Value_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsalookupsids
  public static LsaLookupSids(PolicyHandle: LSA_HANDLE, Count: ULONG, Sids: PVOID, ReferencedDomains_out: PVOID, Names_out: PVOID): NTSTATUS {
    return Advapi32.Load('LsaLookupSids')(PolicyHandle, Count, Sids, ReferencedDomains_out, Names_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsalookupsids2
  public static LsaLookupSids2(PolicyHandle: LSA_HANDLE, LookupOptions: ULONG, Count: ULONG, Sids: PVOID, ReferencedDomains_out: PVOID, Names_out: PVOID): NTSTATUS {
    return Advapi32.Load('LsaLookupSids2')(PolicyHandle, LookupOptions, Count, Sids, ReferencedDomains_out, Names_out);
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
  public static LsaOpenAccount(PolicyHandle: LSA_HANDLE, AccountSid: PSID, DesiredAccess: ACCESS_MASK, AccountHandle_out: PLSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaOpenAccount')(PolicyHandle, AccountSid, DesiredAccess, AccountHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaopenpolicy
  public static LsaOpenPolicy(SystemName: OPTIONAL<PLSA_UNICODE_STRING>, ObjectAttributes: PLSA_OBJECT_ATTRIBUTES, DesiredAccess: ACCESS_MASK, PolicyHandle_out: PLSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaOpenPolicy')(SystemName, ObjectAttributes, DesiredAccess, PolicyHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaopenpolicysce
  public static LsaOpenPolicySce(SystemName: OPTIONAL<PLSA_UNICODE_STRING>, ObjectAttributes: PLSA_OBJECT_ATTRIBUTES, DesiredAccess: ACCESS_MASK, PolicyHandle_out: PLSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaOpenPolicySce')(SystemName, ObjectAttributes, DesiredAccess, PolicyHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsaopensecret
  public static LsaOpenSecret(PolicyHandle: LSA_HANDLE, SecretName: PLSA_UNICODE_STRING, DesiredAccess: ACCESS_MASK, SecretHandle_out: PLSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaOpenSecret')(PolicyHandle, SecretName, DesiredAccess, SecretHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaopentrusteddomain
  public static LsaOpenTrustedDomain(PolicyHandle: LSA_HANDLE, TrustedDomainSid: PSID, DesiredAccess: ACCESS_MASK, TrustedDomainHandle_out: PLSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaOpenTrustedDomain')(PolicyHandle, TrustedDomainSid, DesiredAccess, TrustedDomainHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaopentrusteddomainbyname
  public static LsaOpenTrustedDomainByName(PolicyHandle: LSA_HANDLE, TrustedDomainName: PLSA_UNICODE_STRING, DesiredAccess: ACCESS_MASK, TrustedDomainHandle_out: PLSA_HANDLE): NTSTATUS {
    return Advapi32.Load('LsaOpenTrustedDomainByName')(PolicyHandle, TrustedDomainName, DesiredAccess, TrustedDomainHandle_out);
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
  public static LsaQueryCAPs(CAPIDs: OPTIONAL<PVOID>, CAPIDCount: ULONG, CAPs_out: PVOID, CAPCount_out: PULONG): NTSTATUS {
    return Advapi32.Load('LsaQueryCAPs')(CAPIDs, CAPIDCount, CAPs_out, CAPCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaquerydomaininformationpolicy
  public static LsaQueryDomainInformationPolicy(PolicyHandle: LSA_HANDLE, InformationClass: DWORD, Buffer_out: PVOID): NTSTATUS {
    return Advapi32.Load('LsaQueryDomainInformationPolicy')(PolicyHandle, InformationClass, Buffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaqueryforesttrustinformation
  public static LsaQueryForestTrustInformation(PolicyHandle: LSA_HANDLE, TrustedDomainName: PLSA_UNICODE_STRING, ForestTrustInfo_out: PVOID): NTSTATUS {
    return Advapi32.Load('LsaQueryForestTrustInformation')(PolicyHandle, TrustedDomainName, ForestTrustInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaqueryforesttrustinformation2
  public static LsaQueryForestTrustInformation2(PolicyHandle: LSA_HANDLE, TrustedDomainName: PLSA_UNICODE_STRING, HighestRecordType: DWORD, ForestTrustInfo_out: PVOID): NTSTATUS {
    return Advapi32.Load('LsaQueryForestTrustInformation2')(PolicyHandle, TrustedDomainName, HighestRecordType, ForestTrustInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaqueryinfotrusteddomain
  public static LsaQueryInfoTrustedDomain(TrustedDomainHandle: LSA_HANDLE, InformationClass: DWORD, Buffer_out: PVOID): NTSTATUS {
    return Advapi32.Load('LsaQueryInfoTrustedDomain')(TrustedDomainHandle, InformationClass, Buffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaqueryinformationpolicy
  public static LsaQueryInformationPolicy(PolicyHandle: LSA_HANDLE, InformationClass: DWORD, Buffer_out: PVOID): NTSTATUS {
    return Advapi32.Load('LsaQueryInformationPolicy')(PolicyHandle, InformationClass, Buffer_out);
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
  public static LsaQuerySecret(SecretHandle: LSA_HANDLE, CurrentValue_out: OPTIONAL<PVOID>, CurrentValueSetTime_out: OPTIONAL<PVOID>, OldValue_out: OPTIONAL<PVOID>, OldValueSetTime_out: OPTIONAL<PVOID>): NTSTATUS {
    return Advapi32.Load('LsaQuerySecret')(SecretHandle, CurrentValue_out, CurrentValueSetTime_out, OldValue_out, OldValueSetTime_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsaquerysecurityobject
  public static LsaQuerySecurityObject(ObjectHandle: LSA_HANDLE, SecurityInformation: SECURITY_INFORMATION, SecurityDescriptor_out: PVOID): NTSTATUS {
    return Advapi32.Load('LsaQuerySecurityObject')(ObjectHandle, SecurityInformation, SecurityDescriptor_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaquerytrusteddomaininfo
  public static LsaQueryTrustedDomainInfo(PolicyHandle: LSA_HANDLE, TrustedDomainSid: PSID, InformationClass: DWORD, Buffer_out: PVOID): NTSTATUS {
    return Advapi32.Load('LsaQueryTrustedDomainInfo')(PolicyHandle, TrustedDomainSid, InformationClass, Buffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaquerytrusteddomaininfobyname
  public static LsaQueryTrustedDomainInfoByName(PolicyHandle: LSA_HANDLE, TrustedDomainName: PLSA_UNICODE_STRING, InformationClass: DWORD, Buffer_out: PVOID): NTSTATUS {
    return Advapi32.Load('LsaQueryTrustedDomainInfoByName')(PolicyHandle, TrustedDomainName, InformationClass, Buffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaremoveaccountrights
  public static LsaRemoveAccountRights(PolicyHandle: LSA_HANDLE, AccountSid: PSID, AllRights: BOOL, UserRights: OPTIONAL<PLSA_UNICODE_STRING>, CountOfRights: ULONG): NTSTATUS {
    return Advapi32.Load('LsaRemoveAccountRights')(PolicyHandle, AccountSid, AllRights, UserRights, CountOfRights);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntlsa/nf-ntlsa-lsaremoveprivilegesfromaccount
  public static LsaRemovePrivilegesFromAccount(AccountHandle: LSA_HANDLE, AllPrivileges: BOOL, Privileges: OPTIONAL<PVOID>): NTSTATUS {
    return Advapi32.Load('LsaRemovePrivilegesFromAccount')(AccountHandle, AllPrivileges, Privileges);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsaretrieveprivatedata
  public static LsaRetrievePrivateData(PolicyHandle: LSA_HANDLE, KeyName: PLSA_UNICODE_STRING, PrivateData_out: PVOID): NTSTATUS {
    return Advapi32.Load('LsaRetrievePrivateData')(PolicyHandle, KeyName, PrivateData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsasetcaps
  public static LsaSetCAPs(CAPIDs: OPTIONAL<PVOID>, CAPIDCount: ULONG, Flags: DWORD): NTSTATUS {
    return Advapi32.Load('LsaSetCAPs')(CAPIDs, CAPIDCount, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsasetdomaininformationpolicy
  public static LsaSetDomainInformationPolicy(PolicyHandle: LSA_HANDLE, InformationClass: DWORD, Buffer: OPTIONAL<PVOID>): NTSTATUS {
    return Advapi32.Load('LsaSetDomainInformationPolicy')(PolicyHandle, InformationClass, Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsasetforesttrustinformation
  public static LsaSetForestTrustInformation(PolicyHandle: LSA_HANDLE, TrustedDomainName: PLSA_UNICODE_STRING, ForestTrustInfo: PVOID, CheckOnly: BOOL, CollisionInfo_out: PVOID): NTSTATUS {
    return Advapi32.Load('LsaSetForestTrustInformation')(PolicyHandle, TrustedDomainName, ForestTrustInfo, CheckOnly, CollisionInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/nf-ntsecapi-lsasetforesttrustinformation2
  public static LsaSetForestTrustInformation2(PolicyHandle: LSA_HANDLE, TrustedDomainName: PLSA_UNICODE_STRING, HighestRecordType: DWORD, ForestTrustInfo: PVOID, CheckOnly: BOOL, CollisionInfo_out: PVOID): NTSTATUS {
    return Advapi32.Load('LsaSetForestTrustInformation2')(PolicyHandle, TrustedDomainName, HighestRecordType, ForestTrustInfo, CheckOnly, CollisionInfo_out);
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
  public static LsaSetSecret(SecretHandle: LSA_HANDLE, CurrentValue: OPTIONAL<PLSA_UNICODE_STRING>, OldValue: OPTIONAL<PLSA_UNICODE_STRING>): NTSTATUS {
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
  public static LsaStorePrivateData(PolicyHandle: LSA_HANDLE, KeyName: PLSA_UNICODE_STRING, PrivateData: OPTIONAL<PLSA_UNICODE_STRING>): NTSTATUS {
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
  public static MSChapSrvChangePassword2(
    ServerName: LPWSTR,
    UserName: LPWSTR,
    NewPasswordEncryptedWithOldNtOwf: PVOID,
    OldNtOwfPasswordEncryptedWithNewNtOwf: PVOID,
    LmPresent: BOOL,
    NewPasswordEncryptedWithOldLmOwf: PVOID,
    OldLmOwfPasswordEncryptedWithNewLmNtOwf: PVOID,
  ): DWORD {
    return Advapi32.Load('MSChapSrvChangePassword2')(ServerName, UserName, NewPasswordEncryptedWithOldNtOwf, OldNtOwfPasswordEncryptedWithNewNtOwf, LmPresent, NewPasswordEncryptedWithOldLmOwf, OldLmOwfPasswordEncryptedWithNewLmNtOwf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-makeabsolutesd
  public static MakeAbsoluteSD(
    pSelfRelativeSD: PSECURITY_DESCRIPTOR,
    pAbsoluteSD_out: OPTIONAL<PSECURITY_DESCRIPTOR>,
    lpdwAbsoluteSDSize_in_out: LPDWORD,
    pDacl_out: OPTIONAL<PACL>,
    lpdwDaclSize_in_out: LPDWORD,
    pSacl_out: OPTIONAL<PACL>,
    lpdwSaclSize_in_out: LPDWORD,
    pOwner_out: OPTIONAL<PSID>,
    lpdwOwnerSize_in_out: LPDWORD,
    pPrimaryGroup_out: OPTIONAL<PSID>,
    lpdwPrimaryGroupSize_in_out: LPDWORD,
  ): BOOL {
    return Advapi32.Load('MakeAbsoluteSD')(
      pSelfRelativeSD,
      pAbsoluteSD_out,
      lpdwAbsoluteSDSize_in_out,
      pDacl_out,
      lpdwDaclSize_in_out,
      pSacl_out,
      lpdwSaclSize_in_out,
      pOwner_out,
      lpdwOwnerSize_in_out,
      pPrimaryGroup_out,
      lpdwPrimaryGroupSize_in_out,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-makeabsolutesd2
  public static MakeAbsoluteSD2(pSelfRelativeSecurityDescriptor: PSECURITY_DESCRIPTOR, lpdwBufferSize: LPDWORD): BOOL {
    return Advapi32.Load('MakeAbsoluteSD2')(pSelfRelativeSecurityDescriptor, lpdwBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-makeselfrelativesd
  public static MakeSelfRelativeSD(pAbsoluteSD: PSECURITY_DESCRIPTOR, pSelfRelativeSD_out: OPTIONAL<PSECURITY_DESCRIPTOR>, lpdwBufferLength_in_out: LPDWORD): BOOL {
    return Advapi32.Load('MakeSelfRelativeSD')(pAbsoluteSD, pSelfRelativeSD_out, lpdwBufferLength_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-mapgenericmask
  public static MapGenericMask(AccessMask_in_out: LPDWORD, GenericMapping: PGENERIC_MAPPING): VOID {
    return Advapi32.Load('MapGenericMask')(AccessMask_in_out, GenericMapping);
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
  public static ObjectOpenAuditAlarmA(
    SubsystemName: LPCSTR,
    HandleId: LPVOID,
    ObjectTypeName: LPSTR,
    ObjectName: OPTIONAL<LPSTR>,
    pSecurityDescriptor: PSECURITY_DESCRIPTOR,
    ClientToken: HANDLE,
    DesiredAccess: DWORD,
    GrantedAccess: DWORD,
    Privileges: OPTIONAL<PPRIVILEGE_SET>,
    ObjectCreation: BOOL,
    AccessGranted: BOOL,
    GenerateOnClose_out: LPBOOL,
  ): BOOL {
    return Advapi32.Load('ObjectOpenAuditAlarmA')(SubsystemName, HandleId, ObjectTypeName, ObjectName, pSecurityDescriptor, ClientToken, DesiredAccess, GrantedAccess, Privileges, ObjectCreation, AccessGranted, GenerateOnClose_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-objectopenauditalarmw
  public static ObjectOpenAuditAlarmW(
    SubsystemName: LPCWSTR,
    HandleId: LPVOID,
    ObjectTypeName: LPWSTR,
    ObjectName: OPTIONAL<LPWSTR>,
    pSecurityDescriptor: PSECURITY_DESCRIPTOR,
    ClientToken: HANDLE,
    DesiredAccess: DWORD,
    GrantedAccess: DWORD,
    Privileges: OPTIONAL<PPRIVILEGE_SET>,
    ObjectCreation: BOOL,
    AccessGranted: BOOL,
    GenerateOnClose_out: LPBOOL,
  ): BOOL {
    return Advapi32.Load('ObjectOpenAuditAlarmW')(SubsystemName, HandleId, ObjectTypeName, ObjectName, pSecurityDescriptor, ClientToken, DesiredAccess, GrantedAccess, Privileges, ObjectCreation, AccessGranted, GenerateOnClose_out);
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
  public static OpenBackupEventLogA(lpUNCServerName: OPTIONAL<LPCSTR>, lpFileName: LPCSTR): HANDLE {
    return Advapi32.Load('OpenBackupEventLogA')(lpUNCServerName, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-openbackupeventlogw
  public static OpenBackupEventLogW(lpUNCServerName: OPTIONAL<LPCWSTR>, lpFileName: LPCWSTR): HANDLE {
    return Advapi32.Load('OpenBackupEventLogW')(lpUNCServerName, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-openencryptedfilerawa
  public static OpenEncryptedFileRawA(lpFileName: LPCSTR, ulFlags: ULONG, pvContext_out: PVOID): DWORD {
    return Advapi32.Load('OpenEncryptedFileRawA')(lpFileName, ulFlags, pvContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-openencryptedfileraww
  public static OpenEncryptedFileRawW(lpFileName: LPCWSTR, ulFlags: ULONG, pvContext_out: PVOID): DWORD {
    return Advapi32.Load('OpenEncryptedFileRawW')(lpFileName, ulFlags, pvContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-openeventloga
  public static OpenEventLogA(lpUNCServerName: OPTIONAL<LPCSTR>, lpSourceName: LPCSTR): HANDLE {
    return Advapi32.Load('OpenEventLogA')(lpUNCServerName, lpSourceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-openeventlogw
  public static OpenEventLogW(lpUNCServerName: OPTIONAL<LPCWSTR>, lpSourceName: LPCWSTR): HANDLE {
    return Advapi32.Load('OpenEventLogW')(lpUNCServerName, lpSourceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-openprocesstoken
  public static OpenProcessToken(ProcessHandle: HANDLE, DesiredAccess: DWORD, TokenHandle_out: PHANDLE): BOOL {
    return Advapi32.Load('OpenProcessToken')(ProcessHandle, DesiredAccess, TokenHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-openscmanagera
  public static OpenSCManagerA(lpMachineName: OPTIONAL<LPCSTR>, lpDatabaseName: OPTIONAL<LPCSTR>, dwDesiredAccess: DWORD): SC_HANDLE {
    return Advapi32.Load('OpenSCManagerA')(lpMachineName, lpDatabaseName, dwDesiredAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-openscmanagerw
  public static OpenSCManagerW(lpMachineName: OPTIONAL<LPCWSTR>, lpDatabaseName: OPTIONAL<LPCWSTR>, dwDesiredAccess: DWORD): SC_HANDLE {
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
  public static OpenThreadToken(ThreadHandle: HANDLE, DesiredAccess: DWORD, OpenAsSelf: BOOL, TokenHandle_out: PHANDLE): BOOL {
    return Advapi32.Load('OpenThreadToken')(ThreadHandle, DesiredAccess, OpenAsSelf, TokenHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wct/nf-wct-openthreadwaitchainsession
  public static OpenThreadWaitChainSession(Flags: ULONG, callback: OPTIONAL<PVOID>): HWCT {
    return Advapi32.Load('OpenThreadWaitChainSession')(Flags, callback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-opentracea
  public static OpenTraceA(Logfile_in_out: PVOID): TRACEHANDLE {
    return Advapi32.Load('OpenTraceA')(Logfile_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-opentracew
  public static OpenTraceW(Logfile_in_out: PVOID): TRACEHANDLE {
    return Advapi32.Load('OpenTraceW')(Logfile_in_out);
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
  public static PerfAddCounters(hQuery: HANDLE, pCounters_in_out: PVOID, cbCounters: DWORD): ULONG {
    return Advapi32.Load('PerfAddCounters')(hQuery, pCounters_in_out, cbCounters);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/perflib/nf-perflib-perfclosequeryhandle
  public static PerfCloseQueryHandle(hQuery: HANDLE): ULONG {
    return Advapi32.Load('PerfCloseQueryHandle')(hQuery);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/perflib/nf-perflib-perfdeletecounters
  public static PerfDeleteCounters(hQuery: HANDLE, pCounters_in_out: PVOID, cbCounters: DWORD): ULONG {
    return Advapi32.Load('PerfDeleteCounters')(hQuery, pCounters_in_out, cbCounters);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/perflib/nf-perflib-perfenumeratecounterset
  public static PerfEnumerateCounterSet(szMachine: OPTIONAL<LPCWSTR>, pCounterSetIds_out: OPTIONAL<PVOID>, cCounterSetIds: DWORD, pcCounterSetIdsActual_out: LPDWORD): ULONG {
    return Advapi32.Load('PerfEnumerateCounterSet')(szMachine, pCounterSetIds_out, cCounterSetIds, pcCounterSetIdsActual_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/perflib/nf-perflib-perfenumeratecountersetinstances
  public static PerfEnumerateCounterSetInstances(szMachine: OPTIONAL<LPCWSTR>, pCounterSetId: PVOID, pInstances_out: OPTIONAL<PVOID>, cbInstances: DWORD, pcbInstancesActual_out: LPDWORD): ULONG {
    return Advapi32.Load('PerfEnumerateCounterSetInstances')(szMachine, pCounterSetId, pInstances_out, cbInstances, pcbInstancesActual_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/perflib/nf-perflib-perfopenqueryhandle
  public static PerfOpenQueryHandle(szMachine: OPTIONAL<LPCWSTR>, phQuery_out: PHANDLE): ULONG {
    return Advapi32.Load('PerfOpenQueryHandle')(szMachine, phQuery_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/perflib/nf-perflib-perfquerycounterdata
  public static PerfQueryCounterData(hQuery: HANDLE, pCounterBlock_out: OPTIONAL<PVOID>, cbCounterBlock: DWORD, pcbCounterBlockActual_out: LPDWORD): ULONG {
    return Advapi32.Load('PerfQueryCounterData')(hQuery, pCounterBlock_out, cbCounterBlock, pcbCounterBlockActual_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/perflib/nf-perflib-perfquerycounterinfo
  public static PerfQueryCounterInfo(hQuery: HANDLE, pCounters_out: OPTIONAL<PVOID>, cbCounters: DWORD, pcbCountersActual_out: LPDWORD): ULONG {
    return Advapi32.Load('PerfQueryCounterInfo')(hQuery, pCounters_out, cbCounters, pcbCountersActual_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/perflib/nf-perflib-perfquerycountersetregistrationinfo
  public static PerfQueryCounterSetRegistrationInfo(szMachine: OPTIONAL<LPCWSTR>, pCounterSetId: PVOID, requestCode: DWORD, requestLangId: DWORD, pbRegInfo_out: OPTIONAL<PVOID>, cbRegInfo: DWORD, pcbRegInfoActual_out: LPDWORD): ULONG {
    return Advapi32.Load('PerfQueryCounterSetRegistrationInfo')(szMachine, pCounterSetId, requestCode, requestLangId, pbRegInfo_out, cbRegInfo, pcbRegInfoActual_out);
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
  public static PerfRegQueryInfoKey(
    hKey: PVOID,
    lpClass: PVOID,
    lpcchClass: LPDWORD,
    lpReserved: LPDWORD,
    lpcSubKeys: LPDWORD,
    lpcbMaxSubKeyLen: LPDWORD,
    lpcbMaxClassLen: LPDWORD,
    lpcValues: LPDWORD,
    lpcbMaxValueNameLen: LPDWORD,
    lpcbMaxValueLen: LPDWORD,
    lpcbSecurityDescriptor: LPDWORD,
    lpftLastWriteTime: PVOID,
  ): LSTATUS {
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
  public static PrivilegeCheck(ClientToken: HANDLE, RequiredPrivileges_in_out: PPRIVILEGE_SET, pfResult_out: LPBOOL): BOOL {
    return Advapi32.Load('PrivilegeCheck')(ClientToken, RequiredPrivileges_in_out, pfResult_out);
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
  public static ProcessTrace(HandleArray: PVOID, HandleCount: ULONG, StartTime: OPTIONAL<PVOID>, EndTime: OPTIONAL<PVOID>): ULONG {
    return Advapi32.Load('ProcessTrace')(HandleArray, HandleCount, StartTime, EndTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-queryalltracesa
  public static QueryAllTracesA(PropertyArray_out: PVOID, PropertyArrayCount: ULONG, LoggerCount_out: PULONG): ULONG {
    return Advapi32.Load('QueryAllTracesA')(PropertyArray_out, PropertyArrayCount, LoggerCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-queryalltracesw
  public static QueryAllTracesW(PropertyArray_out: PVOID, PropertyArrayCount: ULONG, LoggerCount_out: PULONG): ULONG {
    return Advapi32.Load('QueryAllTracesW')(PropertyArray_out, PropertyArrayCount, LoggerCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-querylocaluserservicename
  public static QueryLocalUserServiceName(pvReserved: PVOID, pServiceName: PVOID): DWORD {
    return Advapi32.Load('QueryLocalUserServiceName')(pvReserved, pServiceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-queryrecoveryagentsonencryptedfile
  public static QueryRecoveryAgentsOnEncryptedFile(lpFileName: LPCWSTR, pRecoveryAgents_out: PVOID): DWORD {
    return Advapi32.Load('QueryRecoveryAgentsOnEncryptedFile')(lpFileName, pRecoveryAgents_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-querysecurityaccessmask
  public static QuerySecurityAccessMask(SecurityInformation: SECURITY_INFORMATION, DesiredAccess_out: LPDWORD): VOID {
    return Advapi32.Load('QuerySecurityAccessMask')(SecurityInformation, DesiredAccess_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryserviceconfig2a
  public static QueryServiceConfig2A(hService: SC_HANDLE, dwInfoLevel: DWORD, lpBuffer_out: OPTIONAL<LPBYTE>, cbBufSize: DWORD, pcbBytesNeeded_out: LPDWORD): BOOL {
    return Advapi32.Load('QueryServiceConfig2A')(hService, dwInfoLevel, lpBuffer_out, cbBufSize, pcbBytesNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryserviceconfig2w
  public static QueryServiceConfig2W(hService: SC_HANDLE, dwInfoLevel: DWORD, lpBuffer_out: OPTIONAL<LPBYTE>, cbBufSize: DWORD, pcbBytesNeeded_out: LPDWORD): BOOL {
    return Advapi32.Load('QueryServiceConfig2W')(hService, dwInfoLevel, lpBuffer_out, cbBufSize, pcbBytesNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryserviceconfiga
  public static QueryServiceConfigA(hService: SC_HANDLE, lpServiceConfig_out: OPTIONAL<PVOID>, cbBufSize: DWORD, pcbBytesNeeded_out: LPDWORD): BOOL {
    return Advapi32.Load('QueryServiceConfigA')(hService, lpServiceConfig_out, cbBufSize, pcbBytesNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryserviceconfigw
  public static QueryServiceConfigW(hService: SC_HANDLE, lpServiceConfig_out: OPTIONAL<PVOID>, cbBufSize: DWORD, pcbBytesNeeded_out: LPDWORD): BOOL {
    return Advapi32.Load('QueryServiceConfigW')(hService, lpServiceConfig_out, cbBufSize, pcbBytesNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryservicedynamicinformation
  public static QueryServiceDynamicInformation(hServiceStatus: SERVICE_STATUS_HANDLE, dwInfoLevel: DWORD, ppDynamicInfo_out: PVOID): BOOL {
    return Advapi32.Load('QueryServiceDynamicInformation')(hServiceStatus, dwInfoLevel, ppDynamicInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryservicelockstatusa
  public static QueryServiceLockStatusA(hSCManager: SC_HANDLE, lpLockStatus_out: OPTIONAL<PVOID>, cbBufSize: DWORD, pcbBytesNeeded_out: LPDWORD): BOOL {
    return Advapi32.Load('QueryServiceLockStatusA')(hSCManager, lpLockStatus_out, cbBufSize, pcbBytesNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryservicelockstatusw
  public static QueryServiceLockStatusW(hSCManager: SC_HANDLE, lpLockStatus_out: OPTIONAL<PVOID>, cbBufSize: DWORD, pcbBytesNeeded_out: LPDWORD): BOOL {
    return Advapi32.Load('QueryServiceLockStatusW')(hSCManager, lpLockStatus_out, cbBufSize, pcbBytesNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryserviceobjectsecurity
  public static QueryServiceObjectSecurity(hService: SC_HANDLE, dwSecurityInformation: SECURITY_INFORMATION, lpSecurityDescriptor_out: OPTIONAL<PSECURITY_DESCRIPTOR>, cbBufSize: DWORD, pcbBytesNeeded_out: LPDWORD): BOOL {
    return Advapi32.Load('QueryServiceObjectSecurity')(hService, dwSecurityInformation, lpSecurityDescriptor_out, cbBufSize, pcbBytesNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryservicestatus
  public static QueryServiceStatus(hService: SC_HANDLE, lpServiceStatus_out: PVOID): BOOL {
    return Advapi32.Load('QueryServiceStatus')(hService, lpServiceStatus_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-queryservicestatusex
  public static QueryServiceStatusEx(hService: SC_HANDLE, InfoLevel: DWORD, lpBuffer_out: OPTIONAL<LPBYTE>, cbBufSize: DWORD, pcbBytesNeeded_out: LPDWORD): BOOL {
    return Advapi32.Load('QueryServiceStatusEx')(hService, InfoLevel, lpBuffer_out, cbBufSize, pcbBytesNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-querytracea
  public static QueryTraceA(TraceHandle: TRACEHANDLE, InstanceName: OPTIONAL<LPCSTR>, Properties_in_out: PVOID): ULONG {
    return Advapi32.Load('QueryTraceA')(TraceHandle, InstanceName, Properties_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-querytraceprocessinghandle
  public static QueryTraceProcessingHandle(ProcessingHandle: TRACEHANDLE, InformationClass: DWORD, InBuffer: OPTIONAL<PVOID>, InBufferSize: ULONG, OutBuffer_out: OPTIONAL<PVOID>, OutBufferSize: ULONG, ReturnLength_in_out: PULONG): ULONG {
    return Advapi32.Load('QueryTraceProcessingHandle')(ProcessingHandle, InformationClass, InBuffer, InBufferSize, OutBuffer_out, OutBufferSize, ReturnLength_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-querytracew
  public static QueryTraceW(TraceHandle: TRACEHANDLE, InstanceName: OPTIONAL<LPCWSTR>, Properties_in_out: PVOID): ULONG {
    return Advapi32.Load('QueryTraceW')(TraceHandle, InstanceName, Properties_in_out);
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
  public static QueryUsersOnEncryptedFile(lpFileName: LPCWSTR, pUsers_out: PVOID): DWORD {
    return Advapi32.Load('QueryUsersOnEncryptedFile')(lpFileName, pUsers_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-readencryptedfileraw
  public static ReadEncryptedFileRaw(pfExportCallback: PVOID, pvCallbackContext: OPTIONAL<PVOID>, pvContext: PVOID): DWORD {
    return Advapi32.Load('ReadEncryptedFileRaw')(pfExportCallback, pvCallbackContext, pvContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-readeventloga
  public static ReadEventLogA(hEventLog: HANDLE, dwReadFlags: DWORD, dwRecordOffset: DWORD, lpBuffer_out: LPVOID, nNumberOfBytesToRead: DWORD, pnBytesRead_out: LPDWORD, pnMinNumberOfBytesNeeded_out: LPDWORD): BOOL {
    return Advapi32.Load('ReadEventLogA')(hEventLog, dwReadFlags, dwRecordOffset, lpBuffer_out, nNumberOfBytesToRead, pnBytesRead_out, pnMinNumberOfBytesNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-readeventlogw
  public static ReadEventLogW(hEventLog: HANDLE, dwReadFlags: DWORD, dwRecordOffset: DWORD, lpBuffer_out: LPVOID, nNumberOfBytesToRead: DWORD, pnBytesRead_out: LPDWORD, pnMinNumberOfBytesNeeded_out: LPDWORD): BOOL {
    return Advapi32.Load('ReadEventLogW')(hEventLog, dwReadFlags, dwRecordOffset, lpBuffer_out, nNumberOfBytesToRead, pnBytesRead_out, pnMinNumberOfBytesNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regclosekey
  public static RegCloseKey(hKey: HKEY): LSTATUS {
    return Advapi32.Load('RegCloseKey')(hKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regconnectregistrya
  public static RegConnectRegistryA(lpMachineName: OPTIONAL<LPCSTR>, hKey: HKEY, phkResult_out: PHKEY): LSTATUS {
    return Advapi32.Load('RegConnectRegistryA')(lpMachineName, hKey, phkResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regconnectregistryexa
  public static RegConnectRegistryExA(lpMachineName: OPTIONAL<LPCSTR>, hKey: HKEY, Flags: ULONG, phkResult_out: PHKEY): LSTATUS {
    return Advapi32.Load('RegConnectRegistryExA')(lpMachineName, hKey, Flags, phkResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regconnectregistryexw
  public static RegConnectRegistryExW(lpMachineName: OPTIONAL<LPCWSTR>, hKey: HKEY, Flags: ULONG, phkResult_out: PHKEY): LSTATUS {
    return Advapi32.Load('RegConnectRegistryExW')(lpMachineName, hKey, Flags, phkResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regconnectregistryw
  public static RegConnectRegistryW(lpMachineName: OPTIONAL<LPCWSTR>, hKey: HKEY, phkResult_out: PHKEY): LSTATUS {
    return Advapi32.Load('RegConnectRegistryW')(lpMachineName, hKey, phkResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regcopytreea
  public static RegCopyTreeA(hKeySrc: HKEY, lpSubKey: OPTIONAL<LPCSTR>, hKeyDest: HKEY): LSTATUS {
    return Advapi32.Load('RegCopyTreeA')(hKeySrc, lpSubKey, hKeyDest);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regcopytreew
  public static RegCopyTreeW(hKeySrc: HKEY, lpSubKey: OPTIONAL<LPCWSTR>, hKeyDest: HKEY): LSTATUS {
    return Advapi32.Load('RegCopyTreeW')(hKeySrc, lpSubKey, hKeyDest);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regcreatekeya
  public static RegCreateKeyA(hKey: HKEY, lpSubKey: OPTIONAL<LPCSTR>, phkResult_out: PHKEY): LSTATUS {
    return Advapi32.Load('RegCreateKeyA')(hKey, lpSubKey, phkResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regcreatekeyexa
  public static RegCreateKeyExA(
    hKey: HKEY,
    lpSubKey: LPCSTR,
    Reserved: DWORD,
    lpClass: OPTIONAL<LPSTR>,
    dwOptions: DWORD,
    samDesired: REGSAM,
    lpSecurityAttributes: OPTIONAL<PVOID>,
    phkResult_out: PHKEY,
    lpdwDisposition_out: OPTIONAL<LPDWORD>,
  ): LSTATUS {
    return Advapi32.Load('RegCreateKeyExA')(hKey, lpSubKey, Reserved, lpClass, dwOptions, samDesired, lpSecurityAttributes, phkResult_out, lpdwDisposition_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regcreatekeyexw
  public static RegCreateKeyExW(
    hKey: HKEY,
    lpSubKey: LPCWSTR,
    Reserved: DWORD,
    lpClass: OPTIONAL<LPWSTR>,
    dwOptions: DWORD,
    samDesired: REGSAM,
    lpSecurityAttributes: OPTIONAL<PVOID>,
    phkResult_out: PHKEY,
    lpdwDisposition_out: OPTIONAL<LPDWORD>,
  ): LSTATUS {
    return Advapi32.Load('RegCreateKeyExW')(hKey, lpSubKey, Reserved, lpClass, dwOptions, samDesired, lpSecurityAttributes, phkResult_out, lpdwDisposition_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regcreatekeytransacteda
  public static RegCreateKeyTransactedA(
    hKey: HKEY,
    lpSubKey: LPCSTR,
    Reserved: DWORD,
    lpClass: OPTIONAL<LPSTR>,
    dwOptions: DWORD,
    samDesired: REGSAM,
    lpSecurityAttributes: OPTIONAL<PVOID>,
    phkResult_out: PHKEY,
    lpdwDisposition_out: OPTIONAL<LPDWORD>,
    hTransaction: HANDLE,
    pExtendedParemeter: OPTIONAL<PVOID>,
  ): LSTATUS {
    return Advapi32.Load('RegCreateKeyTransactedA')(hKey, lpSubKey, Reserved, lpClass, dwOptions, samDesired, lpSecurityAttributes, phkResult_out, lpdwDisposition_out, hTransaction, pExtendedParemeter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regcreatekeytransactedw
  public static RegCreateKeyTransactedW(
    hKey: HKEY,
    lpSubKey: LPCWSTR,
    Reserved: DWORD,
    lpClass: OPTIONAL<LPWSTR>,
    dwOptions: DWORD,
    samDesired: REGSAM,
    lpSecurityAttributes: OPTIONAL<PVOID>,
    phkResult_out: PHKEY,
    lpdwDisposition_out: OPTIONAL<LPDWORD>,
    hTransaction: HANDLE,
    pExtendedParemeter: OPTIONAL<PVOID>,
  ): LSTATUS {
    return Advapi32.Load('RegCreateKeyTransactedW')(hKey, lpSubKey, Reserved, lpClass, dwOptions, samDesired, lpSecurityAttributes, phkResult_out, lpdwDisposition_out, hTransaction, pExtendedParemeter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regcreatekeyw
  public static RegCreateKeyW(hKey: HKEY, lpSubKey: OPTIONAL<LPCWSTR>, phkResult_out: PHKEY): LSTATUS {
    return Advapi32.Load('RegCreateKeyW')(hKey, lpSubKey, phkResult_out);
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
  public static RegDeleteKeyTransactedA(hKey: HKEY, lpSubKey: LPCSTR, samDesired: REGSAM, Reserved: DWORD, hTransaction: HANDLE, pExtendedParameter: OPTIONAL<PVOID>): LSTATUS {
    return Advapi32.Load('RegDeleteKeyTransactedA')(hKey, lpSubKey, samDesired, Reserved, hTransaction, pExtendedParameter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdeletekeytransactedw
  public static RegDeleteKeyTransactedW(hKey: HKEY, lpSubKey: LPCWSTR, samDesired: REGSAM, Reserved: DWORD, hTransaction: HANDLE, pExtendedParameter: OPTIONAL<PVOID>): LSTATUS {
    return Advapi32.Load('RegDeleteKeyTransactedW')(hKey, lpSubKey, samDesired, Reserved, hTransaction, pExtendedParameter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdeletekeyvaluea
  public static RegDeleteKeyValueA(hKey: HKEY, lpSubKey: OPTIONAL<LPCSTR>, lpValueName: OPTIONAL<LPCSTR>): LSTATUS {
    return Advapi32.Load('RegDeleteKeyValueA')(hKey, lpSubKey, lpValueName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdeletekeyvaluew
  public static RegDeleteKeyValueW(hKey: HKEY, lpSubKey: OPTIONAL<LPCWSTR>, lpValueName: OPTIONAL<LPCWSTR>): LSTATUS {
    return Advapi32.Load('RegDeleteKeyValueW')(hKey, lpSubKey, lpValueName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdeletekeyw
  public static RegDeleteKeyW(hKey: HKEY, lpSubKey: LPCWSTR): LSTATUS {
    return Advapi32.Load('RegDeleteKeyW')(hKey, lpSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdeletetreea
  public static RegDeleteTreeA(hKey: HKEY, lpSubKey: OPTIONAL<LPCSTR>): LSTATUS {
    return Advapi32.Load('RegDeleteTreeA')(hKey, lpSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdeletetreew
  public static RegDeleteTreeW(hKey: HKEY, lpSubKey: OPTIONAL<LPCWSTR>): LSTATUS {
    return Advapi32.Load('RegDeleteTreeW')(hKey, lpSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdeletevaluea
  public static RegDeleteValueA(hKey: HKEY, lpValueName: OPTIONAL<LPCSTR>): LSTATUS {
    return Advapi32.Load('RegDeleteValueA')(hKey, lpValueName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regdeletevaluew
  public static RegDeleteValueW(hKey: HKEY, lpValueName: OPTIONAL<LPCWSTR>): LSTATUS {
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
  public static RegEnumKeyA(hKey: HKEY, dwIndex: DWORD, lpName_out: OPTIONAL<LPSTR>, cchName: DWORD): LSTATUS {
    return Advapi32.Load('RegEnumKeyA')(hKey, dwIndex, lpName_out, cchName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regenumkeyexa
  public static RegEnumKeyExA(
    hKey: HKEY,
    dwIndex: DWORD,
    lpName_out: OPTIONAL<LPSTR>,
    lpcchName_in_out: LPDWORD,
    lpReserved: NULL,
    lpClass_out: OPTIONAL<LPSTR>,
    lpcchClass_in_out: OPTIONAL<LPDWORD>,
    lpftLastWriteTime_out: OPTIONAL<PVOID>,
  ): LSTATUS {
    return Advapi32.Load('RegEnumKeyExA')(hKey, dwIndex, lpName_out, lpcchName_in_out, lpReserved, lpClass_out, lpcchClass_in_out, lpftLastWriteTime_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regenumkeyexw
  public static RegEnumKeyExW(
    hKey: HKEY,
    dwIndex: DWORD,
    lpName_out: OPTIONAL<LPWSTR>,
    lpcchName_in_out: LPDWORD,
    lpReserved: NULL,
    lpClass_out: OPTIONAL<LPWSTR>,
    lpcchClass_in_out: OPTIONAL<LPDWORD>,
    lpftLastWriteTime_out: OPTIONAL<PVOID>,
  ): LSTATUS {
    return Advapi32.Load('RegEnumKeyExW')(hKey, dwIndex, lpName_out, lpcchName_in_out, lpReserved, lpClass_out, lpcchClass_in_out, lpftLastWriteTime_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regenumkeyw
  public static RegEnumKeyW(hKey: HKEY, dwIndex: DWORD, lpName_out: OPTIONAL<LPWSTR>, cchName: DWORD): LSTATUS {
    return Advapi32.Load('RegEnumKeyW')(hKey, dwIndex, lpName_out, cchName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regenumvaluea
  public static RegEnumValueA(
    hKey: HKEY,
    dwIndex: DWORD,
    lpValueName_out: OPTIONAL<LPSTR>,
    lpcchValueName_in_out: LPDWORD,
    lpReserved: NULL,
    lpType_out: OPTIONAL<LPDWORD>,
    lpData_out: OPTIONAL<LPBYTE>,
    lpcbData_in_out: OPTIONAL<LPDWORD>,
  ): LSTATUS {
    return Advapi32.Load('RegEnumValueA')(hKey, dwIndex, lpValueName_out, lpcchValueName_in_out, lpReserved, lpType_out, lpData_out, lpcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regenumvaluew
  public static RegEnumValueW(
    hKey: HKEY,
    dwIndex: DWORD,
    lpValueName_out: OPTIONAL<LPWSTR>,
    lpcchValueName_in_out: LPDWORD,
    lpReserved: NULL,
    lpType_out: OPTIONAL<LPDWORD>,
    lpData_out: OPTIONAL<LPBYTE>,
    lpcbData_in_out: OPTIONAL<LPDWORD>,
  ): LSTATUS {
    return Advapi32.Load('RegEnumValueW')(hKey, dwIndex, lpValueName_out, lpcchValueName_in_out, lpReserved, lpType_out, lpData_out, lpcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regflushkey
  public static RegFlushKey(hKey: HKEY): LSTATUS {
    return Advapi32.Load('RegFlushKey')(hKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-reggetkeysecurity
  public static RegGetKeySecurity(hKey: HKEY, SecurityInformation: SECURITY_INFORMATION, pSecurityDescriptor_out: OPTIONAL<PSECURITY_DESCRIPTOR>, lpcbSecurityDescriptor_in_out: LPDWORD): LSTATUS {
    return Advapi32.Load('RegGetKeySecurity')(hKey, SecurityInformation, pSecurityDescriptor_out, lpcbSecurityDescriptor_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-reggetvaluea
  public static RegGetValueA(hkey: HKEY, lpSubKey: OPTIONAL<LPCSTR>, lpValue: OPTIONAL<LPCSTR>, dwFlags: DWORD, pdwType_out: OPTIONAL<LPDWORD>, pvData_out: OPTIONAL<PVOID>, pcbData_in_out: OPTIONAL<LPDWORD>): LSTATUS {
    return Advapi32.Load('RegGetValueA')(hkey, lpSubKey, lpValue, dwFlags, pdwType_out, pvData_out, pcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-reggetvaluew
  public static RegGetValueW(hkey: HKEY, lpSubKey: OPTIONAL<LPCWSTR>, lpValue: OPTIONAL<LPCWSTR>, dwFlags: DWORD, pdwType_out: OPTIONAL<LPDWORD>, pvData_out: OPTIONAL<PVOID>, pcbData_in_out: OPTIONAL<LPDWORD>): LSTATUS {
    return Advapi32.Load('RegGetValueW')(hkey, lpSubKey, lpValue, dwFlags, pdwType_out, pvData_out, pcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regloadappkeya
  public static RegLoadAppKeyA(lpFile: LPCSTR, phkResult_out: PHKEY, samDesired: REGSAM, dwOptions: DWORD, Reserved: DWORD): LSTATUS {
    return Advapi32.Load('RegLoadAppKeyA')(lpFile, phkResult_out, samDesired, dwOptions, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regloadappkeyw
  public static RegLoadAppKeyW(lpFile: LPCWSTR, phkResult_out: PHKEY, samDesired: REGSAM, dwOptions: DWORD, Reserved: DWORD): LSTATUS {
    return Advapi32.Load('RegLoadAppKeyW')(lpFile, phkResult_out, samDesired, dwOptions, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regloadkeya
  public static RegLoadKeyA(hKey: HKEY, lpSubKey: OPTIONAL<LPCSTR>, lpFile: LPCSTR): LSTATUS {
    return Advapi32.Load('RegLoadKeyA')(hKey, lpSubKey, lpFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regloadkeyw
  public static RegLoadKeyW(hKey: HKEY, lpSubKey: OPTIONAL<LPCWSTR>, lpFile: LPCWSTR): LSTATUS {
    return Advapi32.Load('RegLoadKeyW')(hKey, lpSubKey, lpFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regloadmuistringa
  public static RegLoadMUIStringA(hKey: HKEY, pszValue: OPTIONAL<LPCSTR>, pszOutBuf_out: OPTIONAL<LPSTR>, cbOutBuf: DWORD, pcbData_out: OPTIONAL<LPDWORD>, Flags: DWORD, pszDirectory: OPTIONAL<LPCSTR>): LSTATUS {
    return Advapi32.Load('RegLoadMUIStringA')(hKey, pszValue, pszOutBuf_out, cbOutBuf, pcbData_out, Flags, pszDirectory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regloadmuistringw
  public static RegLoadMUIStringW(hKey: HKEY, pszValue: OPTIONAL<LPCWSTR>, pszOutBuf_out: OPTIONAL<LPWSTR>, cbOutBuf: DWORD, pcbData_out: OPTIONAL<LPDWORD>, Flags: DWORD, pszDirectory: OPTIONAL<LPCWSTR>): LSTATUS {
    return Advapi32.Load('RegLoadMUIStringW')(hKey, pszValue, pszOutBuf_out, cbOutBuf, pcbData_out, Flags, pszDirectory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regnotifychangekeyvalue
  public static RegNotifyChangeKeyValue(hKey: HKEY, bWatchSubtree: BOOL, dwNotifyFilter: DWORD, hEvent: OPTIONAL<HANDLE>, fAsynchronous: BOOL): LSTATUS {
    return Advapi32.Load('RegNotifyChangeKeyValue')(hKey, bWatchSubtree, dwNotifyFilter, hEvent, fAsynchronous);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regopencurrentuser
  public static RegOpenCurrentUser(samDesired: REGSAM, phkResult_out: PHKEY): LSTATUS {
    return Advapi32.Load('RegOpenCurrentUser')(samDesired, phkResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regopenkeya
  public static RegOpenKeyA(hKey: HKEY, lpSubKey: OPTIONAL<LPCSTR>, phkResult_out: PHKEY): LSTATUS {
    return Advapi32.Load('RegOpenKeyA')(hKey, lpSubKey, phkResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regopenkeyexa
  public static RegOpenKeyExA(hKey: HKEY, lpSubKey: OPTIONAL<LPCSTR>, ulOptions: DWORD, samDesired: REGSAM, phkResult_out: PHKEY): LSTATUS {
    return Advapi32.Load('RegOpenKeyExA')(hKey, lpSubKey, ulOptions, samDesired, phkResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regopenkeyexw
  public static RegOpenKeyExW(hKey: HKEY, lpSubKey: OPTIONAL<LPCWSTR>, ulOptions: DWORD, samDesired: REGSAM, phkResult_out: PHKEY): LSTATUS {
    return Advapi32.Load('RegOpenKeyExW')(hKey, lpSubKey, ulOptions, samDesired, phkResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regopenkeytransacteda
  public static RegOpenKeyTransactedA(hKey: HKEY, lpSubKey: OPTIONAL<LPCSTR>, ulOptions: DWORD, samDesired: REGSAM, phkResult_out: PHKEY, hTransaction: HANDLE, pExtendedParemeter: OPTIONAL<PVOID>): LSTATUS {
    return Advapi32.Load('RegOpenKeyTransactedA')(hKey, lpSubKey, ulOptions, samDesired, phkResult_out, hTransaction, pExtendedParemeter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regopenkeytransactedw
  public static RegOpenKeyTransactedW(hKey: HKEY, lpSubKey: OPTIONAL<LPCWSTR>, ulOptions: DWORD, samDesired: REGSAM, phkResult_out: PHKEY, hTransaction: HANDLE, pExtendedParemeter: OPTIONAL<PVOID>): LSTATUS {
    return Advapi32.Load('RegOpenKeyTransactedW')(hKey, lpSubKey, ulOptions, samDesired, phkResult_out, hTransaction, pExtendedParemeter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regopenkeyw
  public static RegOpenKeyW(hKey: HKEY, lpSubKey: OPTIONAL<LPCWSTR>, phkResult_out: PHKEY): LSTATUS {
    return Advapi32.Load('RegOpenKeyW')(hKey, lpSubKey, phkResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regopenuserclassesroot
  public static RegOpenUserClassesRoot(hToken: HANDLE, dwOptions: DWORD, samDesired: REGSAM, phkResult_out: PHKEY): LSTATUS {
    return Advapi32.Load('RegOpenUserClassesRoot')(hToken, dwOptions, samDesired, phkResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regoverridepredefkey
  public static RegOverridePredefKey(hKey: HKEY, hNewHKey: OPTIONAL<HKEY>): LSTATUS {
    return Advapi32.Load('RegOverridePredefKey')(hKey, hNewHKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regqueryinfokeya
  public static RegQueryInfoKeyA(
    hKey: HKEY,
    lpClass_out: OPTIONAL<LPSTR>,
    lpcchClass_in_out: OPTIONAL<LPDWORD>,
    lpReserved: NULL,
    lpcSubKeys_out: OPTIONAL<LPDWORD>,
    lpcbMaxSubKeyLen_out: OPTIONAL<LPDWORD>,
    lpcbMaxClassLen_out: OPTIONAL<LPDWORD>,
    lpcValues_out: OPTIONAL<LPDWORD>,
    lpcbMaxValueNameLen_out: OPTIONAL<LPDWORD>,
    lpcbMaxValueLen_out: OPTIONAL<LPDWORD>,
    lpcbSecurityDescriptor_out: OPTIONAL<LPDWORD>,
    lpftLastWriteTime_out: OPTIONAL<PVOID>,
  ): LSTATUS {
    return Advapi32.Load('RegQueryInfoKeyA')(
      hKey,
      lpClass_out,
      lpcchClass_in_out,
      lpReserved,
      lpcSubKeys_out,
      lpcbMaxSubKeyLen_out,
      lpcbMaxClassLen_out,
      lpcValues_out,
      lpcbMaxValueNameLen_out,
      lpcbMaxValueLen_out,
      lpcbSecurityDescriptor_out,
      lpftLastWriteTime_out,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regqueryinfokeyw
  public static RegQueryInfoKeyW(
    hKey: HKEY,
    lpClass_out: OPTIONAL<LPWSTR>,
    lpcchClass_in_out: OPTIONAL<LPDWORD>,
    lpReserved: NULL,
    lpcSubKeys_out: OPTIONAL<LPDWORD>,
    lpcbMaxSubKeyLen_out: OPTIONAL<LPDWORD>,
    lpcbMaxClassLen_out: OPTIONAL<LPDWORD>,
    lpcValues_out: OPTIONAL<LPDWORD>,
    lpcbMaxValueNameLen_out: OPTIONAL<LPDWORD>,
    lpcbMaxValueLen_out: OPTIONAL<LPDWORD>,
    lpcbSecurityDescriptor_out: OPTIONAL<LPDWORD>,
    lpftLastWriteTime_out: OPTIONAL<PVOID>,
  ): LSTATUS {
    return Advapi32.Load('RegQueryInfoKeyW')(
      hKey,
      lpClass_out,
      lpcchClass_in_out,
      lpReserved,
      lpcSubKeys_out,
      lpcbMaxSubKeyLen_out,
      lpcbMaxClassLen_out,
      lpcValues_out,
      lpcbMaxValueNameLen_out,
      lpcbMaxValueLen_out,
      lpcbSecurityDescriptor_out,
      lpftLastWriteTime_out,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regquerymultiplevaluesa
  public static RegQueryMultipleValuesA(hKey: HKEY, val_list_out: PVALENTA, num_vals: DWORD, lpValueBuf_out: OPTIONAL<LPSTR>, ldwTotsize_in_out: OPTIONAL<LPDWORD>): LSTATUS {
    return Advapi32.Load('RegQueryMultipleValuesA')(hKey, val_list_out, num_vals, lpValueBuf_out, ldwTotsize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regquerymultiplevaluesw
  public static RegQueryMultipleValuesW(hKey: HKEY, val_list_out: PVALENTW, num_vals: DWORD, lpValueBuf_out: OPTIONAL<LPWSTR>, ldwTotsize_in_out: OPTIONAL<LPDWORD>): LSTATUS {
    return Advapi32.Load('RegQueryMultipleValuesW')(hKey, val_list_out, num_vals, lpValueBuf_out, ldwTotsize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regqueryreflectionkey
  public static RegQueryReflectionKey(hBase: HKEY, bIsReflectionDisabled_out: PBOOL): LSTATUS {
    return Advapi32.Load('RegQueryReflectionKey')(hBase, bIsReflectionDisabled_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regqueryvaluea
  public static RegQueryValueA(hKey: HKEY, lpSubKey: OPTIONAL<LPCSTR>, lpData_out: OPTIONAL<LPSTR>, lpcbData_in_out: OPTIONAL<PLONG>): LSTATUS {
    return Advapi32.Load('RegQueryValueA')(hKey, lpSubKey, lpData_out, lpcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regqueryvalueexa
  public static RegQueryValueExA(hKey: HKEY, lpValueName: OPTIONAL<LPCSTR>, lpReserved: NULL, lpType_out: OPTIONAL<LPDWORD>, lpData_out: OPTIONAL<LPBYTE>, lpcbData_in_out: OPTIONAL<LPDWORD>): LSTATUS {
    return Advapi32.Load('RegQueryValueExA')(hKey, lpValueName, lpReserved, lpType_out, lpData_out, lpcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regqueryvalueexw
  public static RegQueryValueExW(hKey: HKEY, lpValueName: OPTIONAL<LPCWSTR>, lpReserved: NULL, lpType_out: OPTIONAL<LPDWORD>, lpData_out: OPTIONAL<LPBYTE>, lpcbData_in_out: OPTIONAL<LPDWORD>): LSTATUS {
    return Advapi32.Load('RegQueryValueExW')(hKey, lpValueName, lpReserved, lpType_out, lpData_out, lpcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regqueryvaluew
  public static RegQueryValueW(hKey: HKEY, lpSubKey: OPTIONAL<LPCWSTR>, lpData_out: OPTIONAL<LPWSTR>, lpcbData_in_out: OPTIONAL<PLONG>): LSTATUS {
    return Advapi32.Load('RegQueryValueW')(hKey, lpSubKey, lpData_out, lpcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regrenamekey
  public static RegRenameKey(hKey: HKEY, lpSubKeyName: OPTIONAL<LPCWSTR>, lpNewKeyName: LPCWSTR): LSTATUS {
    return Advapi32.Load('RegRenameKey')(hKey, lpSubKeyName, lpNewKeyName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regreplacekeya
  public static RegReplaceKeyA(hKey: HKEY, lpSubKey: OPTIONAL<LPCSTR>, lpNewFile: LPCSTR, lpOldFile: LPCSTR): LSTATUS {
    return Advapi32.Load('RegReplaceKeyA')(hKey, lpSubKey, lpNewFile, lpOldFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regreplacekeyw
  public static RegReplaceKeyW(hKey: HKEY, lpSubKey: OPTIONAL<LPCWSTR>, lpNewFile: LPCWSTR, lpOldFile: LPCWSTR): LSTATUS {
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
  public static RegSaveKeyA(hKey: HKEY, lpFile: LPCSTR, lpSecurityAttributes: OPTIONAL<PVOID>): LSTATUS {
    return Advapi32.Load('RegSaveKeyA')(hKey, lpFile, lpSecurityAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regsavekeyexa
  public static RegSaveKeyExA(hKey: HKEY, lpFile: LPCSTR, lpSecurityAttributes: OPTIONAL<PVOID>, Flags: DWORD): LSTATUS {
    return Advapi32.Load('RegSaveKeyExA')(hKey, lpFile, lpSecurityAttributes, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regsavekeyexw
  public static RegSaveKeyExW(hKey: HKEY, lpFile: LPCWSTR, lpSecurityAttributes: OPTIONAL<PVOID>, Flags: DWORD): LSTATUS {
    return Advapi32.Load('RegSaveKeyExW')(hKey, lpFile, lpSecurityAttributes, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regsavekeyw
  public static RegSaveKeyW(hKey: HKEY, lpFile: LPCWSTR, lpSecurityAttributes: OPTIONAL<PVOID>): LSTATUS {
    return Advapi32.Load('RegSaveKeyW')(hKey, lpFile, lpSecurityAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regsetkeysecurity
  public static RegSetKeySecurity(hKey: HKEY, SecurityInformation: SECURITY_INFORMATION, pSecurityDescriptor: PSECURITY_DESCRIPTOR): LSTATUS {
    return Advapi32.Load('RegSetKeySecurity')(hKey, SecurityInformation, pSecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regsetkeyvaluea
  public static RegSetKeyValueA(hKey: HKEY, lpSubKey: OPTIONAL<LPCSTR>, lpValueName: OPTIONAL<LPCSTR>, dwType: DWORD, lpData: OPTIONAL<LPCVOID>, cbData: DWORD): LSTATUS {
    return Advapi32.Load('RegSetKeyValueA')(hKey, lpSubKey, lpValueName, dwType, lpData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regsetkeyvaluew
  public static RegSetKeyValueW(hKey: HKEY, lpSubKey: OPTIONAL<LPCWSTR>, lpValueName: OPTIONAL<LPCWSTR>, dwType: DWORD, lpData: OPTIONAL<LPCVOID>, cbData: DWORD): LSTATUS {
    return Advapi32.Load('RegSetKeyValueW')(hKey, lpSubKey, lpValueName, dwType, lpData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regsetvaluea
  public static RegSetValueA(hKey: HKEY, lpSubKey: OPTIONAL<LPCSTR>, dwType: DWORD, lpData: OPTIONAL<LPCSTR>, cbData: DWORD): LSTATUS {
    return Advapi32.Load('RegSetValueA')(hKey, lpSubKey, dwType, lpData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regsetvalueexa
  public static RegSetValueExA(hKey: HKEY, lpValueName: OPTIONAL<LPCSTR>, Reserved: DWORD, dwType: DWORD, lpData: OPTIONAL<LPBYTE>, cbData: DWORD): LSTATUS {
    return Advapi32.Load('RegSetValueExA')(hKey, lpValueName, Reserved, dwType, lpData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regsetvalueexw
  public static RegSetValueExW(hKey: HKEY, lpValueName: OPTIONAL<LPCWSTR>, Reserved: DWORD, dwType: DWORD, lpData: OPTIONAL<LPBYTE>, cbData: DWORD): LSTATUS {
    return Advapi32.Load('RegSetValueExW')(hKey, lpValueName, Reserved, dwType, lpData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regsetvaluew
  public static RegSetValueW(hKey: HKEY, lpSubKey: OPTIONAL<LPCWSTR>, dwType: DWORD, lpData: OPTIONAL<LPCWSTR>, cbData: DWORD): LSTATUS {
    return Advapi32.Load('RegSetValueW')(hKey, lpSubKey, dwType, lpData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regunloadkeya
  public static RegUnLoadKeyA(hKey: HKEY, lpSubKey: OPTIONAL<LPCSTR>): LSTATUS {
    return Advapi32.Load('RegUnLoadKeyA')(hKey, lpSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regunloadkeyw
  public static RegUnLoadKeyW(hKey: HKEY, lpSubKey: OPTIONAL<LPCWSTR>): LSTATUS {
    return Advapi32.Load('RegUnLoadKeyW')(hKey, lpSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-registereventsourcea
  public static RegisterEventSourceA(lpUNCServerName: OPTIONAL<LPCSTR>, lpSourceName: LPCSTR): HANDLE {
    return Advapi32.Load('RegisterEventSourceA')(lpUNCServerName, lpSourceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-registereventsourcew
  public static RegisterEventSourceW(lpUNCServerName: OPTIONAL<LPCWSTR>, lpSourceName: LPCWSTR): HANDLE {
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
  public static RegisterServiceCtrlHandlerExA(lpServiceName: LPCSTR, lpHandlerProc: PVOID, lpContext: OPTIONAL<LPVOID>): SERVICE_STATUS_HANDLE {
    return Advapi32.Load('RegisterServiceCtrlHandlerExA')(lpServiceName, lpHandlerProc, lpContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-registerservicectrlhandlerexw
  public static RegisterServiceCtrlHandlerExW(lpServiceName: LPCWSTR, lpHandlerProc: PVOID, lpContext: OPTIONAL<LPVOID>): SERVICE_STATUS_HANDLE {
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
  public static RemoteRegQueryInfoKeyWrapper(
    hKey: PVOID,
    lpClass: PVOID,
    lpcchClass: LPDWORD,
    lpReserved: LPDWORD,
    lpcSubKeys: LPDWORD,
    lpcbMaxSubKeyLen: LPDWORD,
    lpcbMaxClassLen: LPDWORD,
    lpcValues: LPDWORD,
    lpcbMaxValueNameLen: LPDWORD,
    lpcbMaxValueLen: LPDWORD,
    lpcbSecurityDescriptor: LPDWORD,
    lpftLastWriteTime: PVOID,
  ): LSTATUS {
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
  public static ReportEventA(hEventLog: HANDLE, wType: WORD, wCategory: WORD, dwEventID: DWORD, lpUserSid: OPTIONAL<PSID>, wNumStrings: WORD, dwDataSize: DWORD, lpStrings: OPTIONAL<PVOID>, lpRawData: OPTIONAL<LPVOID>): BOOL {
    return Advapi32.Load('ReportEventA')(hEventLog, wType, wCategory, dwEventID, lpUserSid, wNumStrings, dwDataSize, lpStrings, lpRawData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-reporteventw
  public static ReportEventW(hEventLog: HANDLE, wType: WORD, wCategory: WORD, dwEventID: DWORD, lpUserSid: OPTIONAL<PSID>, wNumStrings: WORD, dwDataSize: DWORD, lpStrings: OPTIONAL<PVOID>, lpRawData: OPTIONAL<LPVOID>): BOOL {
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
  public static SaferComputeTokenFromLevel(LevelHandle: HANDLE, InAccessToken: OPTIONAL<HANDLE>, OutAccessToken_out: PHANDLE, dwFlags: DWORD, lpReserved_in_out: OPTIONAL<PVOID>): BOOL {
    return Advapi32.Load('SaferComputeTokenFromLevel')(LevelHandle, InAccessToken, OutAccessToken_out, dwFlags, lpReserved_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-safercreatelevel
  public static SaferCreateLevel(dwScopeId: DWORD, dwLevelId: DWORD, OpenFlags: DWORD, pLevelHandle_out: PVOID, lpReserved: NULL): BOOL {
    return Advapi32.Load('SaferCreateLevel')(dwScopeId, dwLevelId, OpenFlags, pLevelHandle_out, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-safergetlevelinformation
  public static SaferGetLevelInformation(LevelHandle: HANDLE, dwInfoType: DWORD, lpQueryBuffer_out: OPTIONAL<PVOID>, dwInBufferSize: DWORD, lpdwOutBufferSize_out: LPDWORD): BOOL {
    return Advapi32.Load('SaferGetLevelInformation')(LevelHandle, dwInfoType, lpQueryBuffer_out, dwInBufferSize, lpdwOutBufferSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-safergetpolicyinformation
  public static SaferGetPolicyInformation(dwScopeId: DWORD, SaferPolicyInfoClass: DWORD, InfoBufferSize: DWORD, InfoBuffer_out: PVOID, InfoBufferRetSize_out: LPDWORD, lpReserved: NULL): BOOL {
    return Advapi32.Load('SaferGetPolicyInformation')(dwScopeId, SaferPolicyInfoClass, InfoBufferSize, InfoBuffer_out, InfoBufferRetSize_out, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-saferidentifylevel
  public static SaferIdentifyLevel(dwNumProperties: DWORD, pCodeProperties: OPTIONAL<PVOID>, pLevelHandle_out: PVOID, lpReserved: OPTIONAL<PVOID>): BOOL {
    return Advapi32.Load('SaferIdentifyLevel')(dwNumProperties, pCodeProperties, pLevelHandle_out, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-saferrecordeventlogentry
  public static SaferRecordEventLogEntry(hLevel: HANDLE, szTargetPath: LPCWSTR, lpReserved: NULL): BOOL {
    return Advapi32.Load('SaferRecordEventLogEntry')(hLevel, szTargetPath, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-safersetlevelinformation
  public static SaferSetLevelInformation(LevelHandle: HANDLE, dwInfoType: DWORD, lpQueryBuffer: PVOID, dwInBufferSize: DWORD): BOOL {
    return Advapi32.Load('SaferSetLevelInformation')(LevelHandle, dwInfoType, lpQueryBuffer, dwInBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsafer/nf-winsafer-safersetpolicyinformation
  public static SaferSetPolicyInformation(dwScopeId: DWORD, SaferPolicyInfoClass: DWORD, InfoBufferSize: DWORD, InfoBuffer: PVOID, lpReserved: NULL): BOOL {
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
  public static SetAclInformation(pAcl_in_out: PACL, pAclInformation: LPVOID, nAclInformationLength: DWORD, dwAclInformationClass: DWORD): BOOL {
    return Advapi32.Load('SetAclInformation')(pAcl_in_out, pAclInformation, nAclInformationLength, dwAclInformationClass);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-setencryptedfilemetadata
  public static SetEncryptedFileMetadata(lpFileName: LPCWSTR, pbOldMetadata: OPTIONAL<PVOID>, pbNewMetadata: PVOID, pOwnerHash: PVOID, dwOperation: DWORD, pCertificatesAdded: OPTIONAL<PVOID>): DWORD {
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
  public static SetEntriesInAclA(cCountOfExplicitEntries: ULONG, pListOfExplicitEntries: OPTIONAL<PEXPLICIT_ACCESSA>, OldAcl: OPTIONAL<PACL>, NewAcl_out: PVOID): DWORD {
    return Advapi32.Load('SetEntriesInAclA')(cCountOfExplicitEntries, pListOfExplicitEntries, OldAcl, NewAcl_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-setentriesinaclw
  public static SetEntriesInAclW(cCountOfExplicitEntries: ULONG, pListOfExplicitEntries: OPTIONAL<PEXPLICIT_ACCESSW>, OldAcl: OPTIONAL<PACL>, NewAcl_out: PVOID): DWORD {
    return Advapi32.Load('SetEntriesInAclW')(cCountOfExplicitEntries, pListOfExplicitEntries, OldAcl, NewAcl_out);
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
  public static SetNamedSecurityInfoA(pObjectName: LPSTR, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, psidOwner: OPTIONAL<PSID>, psidGroup: OPTIONAL<PSID>, pDacl: OPTIONAL<PACL>, pSacl: OPTIONAL<PACL>): DWORD {
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
  public static SetNamedSecurityInfoW(pObjectName: LPWSTR, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, psidOwner: OPTIONAL<PSID>, psidGroup: OPTIONAL<PSID>, pDacl: OPTIONAL<PACL>, pSacl: OPTIONAL<PACL>): DWORD {
    return Advapi32.Load('SetNamedSecurityInfoW')(pObjectName, ObjectType, SecurityInfo, psidOwner, psidGroup, pDacl, pSacl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setprivateobjectsecurity
  public static SetPrivateObjectSecurity(SecurityInformation: SECURITY_INFORMATION, ModificationDescriptor: PSECURITY_DESCRIPTOR, ObjectsSecurityDescriptor_in_out: PVOID, GenericMapping: PGENERIC_MAPPING, Token: OPTIONAL<HANDLE>): BOOL {
    return Advapi32.Load('SetPrivateObjectSecurity')(SecurityInformation, ModificationDescriptor, ObjectsSecurityDescriptor_in_out, GenericMapping, Token);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setprivateobjectsecurityex
  public static SetPrivateObjectSecurityEx(
    SecurityInformation: SECURITY_INFORMATION,
    ModificationDescriptor: PSECURITY_DESCRIPTOR,
    ObjectsSecurityDescriptor_in_out: PVOID,
    AutoInheritFlags: ULONG,
    GenericMapping: PGENERIC_MAPPING,
    Token: OPTIONAL<HANDLE>,
  ): BOOL {
    return Advapi32.Load('SetPrivateObjectSecurityEx')(SecurityInformation, ModificationDescriptor, ObjectsSecurityDescriptor_in_out, AutoInheritFlags, GenericMapping, Token);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setsecurityaccessmask
  public static SetSecurityAccessMask(SecurityInformation: SECURITY_INFORMATION, DesiredAccess_out: LPDWORD): VOID {
    return Advapi32.Load('SetSecurityAccessMask')(SecurityInformation, DesiredAccess_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setsecuritydescriptorcontrol
  public static SetSecurityDescriptorControl(pSecurityDescriptor: PSECURITY_DESCRIPTOR, ControlBitsOfInterest: WORD, ControlBitsToSet: WORD): BOOL {
    return Advapi32.Load('SetSecurityDescriptorControl')(pSecurityDescriptor, ControlBitsOfInterest, ControlBitsToSet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setsecuritydescriptordacl
  public static SetSecurityDescriptorDacl(pSecurityDescriptor_in_out: PSECURITY_DESCRIPTOR, bDaclPresent: BOOL, pDacl: OPTIONAL<PACL>, bDaclDefaulted: BOOL): BOOL {
    return Advapi32.Load('SetSecurityDescriptorDacl')(pSecurityDescriptor_in_out, bDaclPresent, pDacl, bDaclDefaulted);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setsecuritydescriptorgroup
  public static SetSecurityDescriptorGroup(pSecurityDescriptor_in_out: PSECURITY_DESCRIPTOR, pGroup: OPTIONAL<PSID>, bGroupDefaulted: BOOL): BOOL {
    return Advapi32.Load('SetSecurityDescriptorGroup')(pSecurityDescriptor_in_out, pGroup, bGroupDefaulted);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setsecuritydescriptorowner
  public static SetSecurityDescriptorOwner(pSecurityDescriptor_in_out: PSECURITY_DESCRIPTOR, pOwner: OPTIONAL<PSID>, bOwnerDefaulted: BOOL): BOOL {
    return Advapi32.Load('SetSecurityDescriptorOwner')(pSecurityDescriptor_in_out, pOwner, bOwnerDefaulted);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setsecuritydescriptorrmcontrol
  public static SetSecurityDescriptorRMControl(SecurityDescriptor_in_out: PSECURITY_DESCRIPTOR, RMControl: OPTIONAL<PUCHAR>): DWORD {
    return Advapi32.Load('SetSecurityDescriptorRMControl')(SecurityDescriptor_in_out, RMControl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-setsecuritydescriptorsacl
  public static SetSecurityDescriptorSacl(pSecurityDescriptor_in_out: PSECURITY_DESCRIPTOR, bSaclPresent: BOOL, pSacl: OPTIONAL<PACL>, bSaclDefaulted: BOOL): BOOL {
    return Advapi32.Load('SetSecurityDescriptorSacl')(pSecurityDescriptor_in_out, bSaclPresent, pSacl, bSaclDefaulted);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-setsecurityinfo
  public static SetSecurityInfo(handle: HANDLE, ObjectType: DWORD, SecurityInfo: SECURITY_INFORMATION, psidOwner: OPTIONAL<PSID>, psidGroup: OPTIONAL<PSID>, pDacl: OPTIONAL<PACL>, pSacl: OPTIONAL<PACL>): DWORD {
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
  public static SetThreadToken(Thread: OPTIONAL<PHANDLE>, Token: OPTIONAL<HANDLE>): BOOL {
    return Advapi32.Load('SetThreadToken')(Thread, Token);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-settokeninformation
  public static SetTokenInformation(TokenHandle: HANDLE, TokenInformationClass: TOKEN_INFORMATION_CLASS, TokenInformation: LPVOID, TokenInformationLength: DWORD): BOOL {
    return Advapi32.Load('SetTokenInformation')(TokenHandle, TokenInformationClass, TokenInformation, TokenInformationLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-setuserfileencryptionkey
  public static SetUserFileEncryptionKey(pEncryptionCertificate: OPTIONAL<PVOID>): DWORD {
    return Advapi32.Load('SetUserFileEncryptionKey')(pEncryptionCertificate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winefs/nf-winefs-setuserfileencryptionkeyex
  public static SetUserFileEncryptionKeyEx(pEncryptionCertificate: OPTIONAL<PVOID>, dwCapabilities: DWORD, dwFlags: DWORD, pvReserved: NULL): DWORD {
    return Advapi32.Load('SetUserFileEncryptionKeyEx')(pEncryptionCertificate, dwCapabilities, dwFlags, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsvc/nf-winsvc-startservicea
  public static StartServiceA(hService: SC_HANDLE, dwNumServiceArgs: DWORD, lpServiceArgVectors: OPTIONAL<PVOID>): BOOL {
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
  public static StartServiceW(hService: SC_HANDLE, dwNumServiceArgs: DWORD, lpServiceArgVectors: OPTIONAL<PVOID>): BOOL {
    return Advapi32.Load('StartServiceW')(hService, dwNumServiceArgs, lpServiceArgVectors);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-starttracea
  public static StartTraceA(TraceHandle_out: PVOID, InstanceName: LPCSTR, Properties_in_out: PVOID): ULONG {
    return Advapi32.Load('StartTraceA')(TraceHandle_out, InstanceName, Properties_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-starttracew
  public static StartTraceW(TraceHandle_out: PVOID, InstanceName: LPCWSTR, Properties_in_out: PVOID): ULONG {
    return Advapi32.Load('StartTraceW')(TraceHandle_out, InstanceName, Properties_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-stoptracea
  public static StopTraceA(TraceHandle: TRACEHANDLE, InstanceName: OPTIONAL<LPCSTR>, Properties_in_out: PVOID): ULONG {
    return Advapi32.Load('StopTraceA')(TraceHandle, InstanceName, Properties_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-stoptracew
  public static StopTraceW(TraceHandle: TRACEHANDLE, InstanceName: OPTIONAL<LPCWSTR>, Properties_in_out: PVOID): ULONG {
    return Advapi32.Load('StopTraceW')(TraceHandle, InstanceName, Properties_in_out);
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
  public static TreeResetNamedSecurityInfoA(
    pObjectName: LPSTR,
    ObjectType: DWORD,
    SecurityInfo: SECURITY_INFORMATION,
    pOwner: OPTIONAL<PSID>,
    pGroup: OPTIONAL<PSID>,
    pDacl: OPTIONAL<PACL>,
    pSacl: OPTIONAL<PACL>,
    KeepExplicit: BOOL,
    fnProgress: OPTIONAL<PVOID>,
    ProgressInvokeSetting: DWORD,
    Args: OPTIONAL<PVOID>,
  ): DWORD {
    return Advapi32.Load('TreeResetNamedSecurityInfoA')(pObjectName, ObjectType, SecurityInfo, pOwner, pGroup, pDacl, pSacl, KeepExplicit, fnProgress, ProgressInvokeSetting, Args);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-treeresetnamedsecurityinfow
  public static TreeResetNamedSecurityInfoW(
    pObjectName: LPWSTR,
    ObjectType: DWORD,
    SecurityInfo: SECURITY_INFORMATION,
    pOwner: OPTIONAL<PSID>,
    pGroup: OPTIONAL<PSID>,
    pDacl: OPTIONAL<PACL>,
    pSacl: OPTIONAL<PACL>,
    KeepExplicit: BOOL,
    fnProgress: OPTIONAL<PVOID>,
    ProgressInvokeSetting: DWORD,
    Args: OPTIONAL<PVOID>,
  ): DWORD {
    return Advapi32.Load('TreeResetNamedSecurityInfoW')(pObjectName, ObjectType, SecurityInfo, pOwner, pGroup, pDacl, pSacl, KeepExplicit, fnProgress, ProgressInvokeSetting, Args);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-treesetnamedsecurityinfoa
  public static TreeSetNamedSecurityInfoA(
    pObjectName: LPSTR,
    ObjectType: DWORD,
    SecurityInfo: SECURITY_INFORMATION,
    pOwner: OPTIONAL<PSID>,
    pGroup: OPTIONAL<PSID>,
    pDacl: OPTIONAL<PACL>,
    pSacl: OPTIONAL<PACL>,
    dwAction: DWORD,
    fnProgress: OPTIONAL<PVOID>,
    ProgressInvokeSetting: DWORD,
    Args: OPTIONAL<PVOID>,
  ): DWORD {
    return Advapi32.Load('TreeSetNamedSecurityInfoA')(pObjectName, ObjectType, SecurityInfo, pOwner, pGroup, pDacl, pSacl, dwAction, fnProgress, ProgressInvokeSetting, Args);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-treesetnamedsecurityinfow
  public static TreeSetNamedSecurityInfoW(
    pObjectName: LPWSTR,
    ObjectType: DWORD,
    SecurityInfo: SECURITY_INFORMATION,
    pOwner: OPTIONAL<PSID>,
    pGroup: OPTIONAL<PSID>,
    pDacl: OPTIONAL<PACL>,
    pSacl: OPTIONAL<PACL>,
    dwAction: DWORD,
    fnProgress: OPTIONAL<PVOID>,
    ProgressInvokeSetting: DWORD,
    Args: OPTIONAL<PVOID>,
  ): DWORD {
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
  public static UnlockServiceDatabase(ScLock: SC_LOCK): BOOL {
    return Advapi32.Load('UnlockServiceDatabase')(ScLock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/advapi32/nf-advapi32-unregisteridletask
  public static UnregisterIdleTask(Guid: PVOID, pvReserved1: PVOID, pvReserved2: PVOID, pvReserved3: PVOID): DWORD {
    return Advapi32.Load('UnregisterIdleTask')(Guid, pvReserved1, pvReserved2, pvReserved3);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-updatetracea
  public static UpdateTraceA(TraceHandle: TRACEHANDLE, InstanceName: OPTIONAL<LPCSTR>, Properties_in_out: PVOID): ULONG {
    return Advapi32.Load('UpdateTraceA')(TraceHandle, InstanceName, Properties_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evntrace/nf-evntrace-updatetracew
  public static UpdateTraceW(TraceHandle: TRACEHANDLE, InstanceName: OPTIONAL<LPCWSTR>, Properties_in_out: PVOID): ULONG {
    return Advapi32.Load('UpdateTraceW')(TraceHandle, InstanceName, Properties_in_out);
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
  public static WaitServiceState(hService: SC_HANDLE, dwNotify: DWORD, dwTimeout: DWORD, hCancelEvent: OPTIONAL<HANDLE>): DWORD {
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
  public static WriteEncryptedFileRaw(pfImportCallback: PVOID, pvCallbackContext: OPTIONAL<PVOID>, pvContext: PVOID): DWORD {
    return Advapi32.Load('WriteEncryptedFileRaw')(pfImportCallback, pvCallbackContext, pvContext);
  }
}

export default Advapi32;
