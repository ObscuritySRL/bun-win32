import type { Pointer } from 'bun:ffi';

export type { ACCESS_MASK, BOOL, BOOLEAN, BYTE, CHAR, DWORD, DWORD_PTR, HANDLE, HINSTANCE, HMODULE, HRESULT, HWND, INT, INT_PTR, LONG, LONG_PTR, LPARAM, LPBOOL, LPBYTE, LPCSTR, LPCVOID, LPCWSTR, LPDWORD, LPHANDLE, LPSECURITY_ATTRIBUTES, LPSTR, LPVOID, LPWSTR, LRESULT, NULL, PBYTE, PDWORD, PHANDLE, PULONG, PVOID, SHORT, SIZE_T, UINT, UINT_PTR, ULONG, ULONG_PTR, USHORT, VOID, WCHAR, WORD, WPARAM } from '@bun-win32/core';

export const HKEY_CLASSES_ROOT = 0x8000_0000n as HKEY;
export const HKEY_CURRENT_CONFIG = 0x8000_0005n as HKEY;
export const HKEY_CURRENT_USER = 0x8000_0001n as HKEY;
export const HKEY_DYN_DATA = 0x8000_0006n as HKEY;
export const HKEY_LOCAL_MACHINE = 0x8000_0002n as HKEY;
export const HKEY_PERFORMANCE_DATA = 0x8000_0004n as HKEY;
export const HKEY_PERFORMANCE_NLSTEXT = 0x8000_0060n as HKEY;
export const HKEY_PERFORMANCE_TEXT = 0x8000_0050n as HKEY;
export const HKEY_USERS = 0x8000_0003n as HKEY;

export enum AccessMode {
  DENY_ACCESS = 3,
  GRANT_ACCESS = 1,
  NOT_USED_ACCESS = 0,
  REVOKE_ACCESS = 4,
  SET_ACCESS = 2,
  SET_AUDIT_FAILURE = 6,
  SET_AUDIT_SUCCESS = 5,
}

export enum AceFlags {
  CONTAINER_INHERIT_ACE = 0x0000_0002,
  FAILED_ACCESS_ACE_FLAG = 0x0000_0080,
  INHERIT_ONLY_ACE = 0x0000_0008,
  INHERITED_ACE = 0x0000_0010,
  NO_PROPAGATE_INHERIT_ACE = 0x0000_0004,
  OBJECT_INHERIT_ACE = 0x0000_0001,
  SUCCESSFUL_ACCESS_ACE_FLAG = 0x0000_0040,
}

export enum AclRevision {
  ACL_REVISION = 2,
  ACL_REVISION_DS = 4,
}

export enum CryptAcquireContextFlags {
  CRYPT_DELETEKEYSET = 0x0000_0010,
  CRYPT_MACHINE_KEYSET = 0x0000_0020,
  CRYPT_NEWKEYSET = 0x0000_0008,
  CRYPT_SILENT = 0x0000_0040,
  CRYPT_VERIFYCONTEXT = 0xf000_0000,
}

export enum CryptProviderType {
  PROV_DH_SCHANNEL = 18,
  PROV_DSS = 3,
  PROV_DSS_DH = 13,
  PROV_EC_ECDSA_FULL = 16,
  PROV_EC_ECDSA_SIG = 14,
  PROV_EC_ECNRA_FULL = 17,
  PROV_EC_ECNRA_SIG = 15,
  PROV_FORTEZZA = 4,
  PROV_INTEL_SEC = 22,
  PROV_MS_EXCHANGE = 5,
  PROV_REPLACE_OWF = 23,
  PROV_RNG = 21,
  PROV_RSA_AES = 24,
  PROV_RSA_FULL = 1,
  PROV_RSA_SCHANNEL = 12,
  PROV_RSA_SIG = 2,
  PROV_SPYRUS_LYNKS = 20,
  PROV_SSL = 6,
}

export enum EventLogFlags {
  EVENTLOG_AUDIT_FAILURE = 0x0000_0010,
  EVENTLOG_AUDIT_SUCCESS = 0x0000_0008,
  EVENTLOG_ERROR_TYPE = 0x0000_0001,
  EVENTLOG_INFORMATION_TYPE = 0x0000_0004,
  EVENTLOG_SUCCESS = 0x0000_0000,
  EVENTLOG_WARNING_TYPE = 0x0000_0002,
}

export enum LogonProvider {
  LOGON32_PROVIDER_DEFAULT = 0,
  LOGON32_PROVIDER_VIRTUAL = 4,
  LOGON32_PROVIDER_WINNT35 = 1,
  LOGON32_PROVIDER_WINNT40 = 2,
  LOGON32_PROVIDER_WINNT50 = 3,
}

export enum LogonType {
  LOGON32_LOGON_BATCH = 4,
  LOGON32_LOGON_INTERACTIVE = 2,
  LOGON32_LOGON_NETWORK = 3,
  LOGON32_LOGON_NETWORK_CLEARTEXT = 8,
  LOGON32_LOGON_NEW_CREDENTIALS = 9,
  LOGON32_LOGON_SERVICE = 5,
  LOGON32_LOGON_UNLOCK = 7,
}

export enum MultipleTrusteeOperation {
  NO_MULTIPLE_TRUSTEE = 0,
  TRUSTEE_IS_IMPERSONATE = 1,
}

export enum PrivilegeAttributes {
  SE_PRIVILEGE_ENABLED = 0x0000_0002,
  SE_PRIVILEGE_ENABLED_BY_DEFAULT = 0x0000_0001,
  SE_PRIVILEGE_REMOVED = 0x0000_0004,
  SE_PRIVILEGE_USED_FOR_ACCESS = 0x8000_0000,
}

export enum RegDisposition {
  REG_CREATED_NEW_KEY = 0x0000_0001,
  REG_OPENED_EXISTING_KEY = 0x0000_0002,
}

export enum RegKeyAccessRights {
  KEY_ALL_ACCESS = 0x000f_003f,
  KEY_CREATE_LINK = 0x0000_0020,
  KEY_CREATE_SUB_KEY = 0x0000_0004,
  KEY_ENUMERATE_SUB_KEYS = 0x0000_0008,
  KEY_EXECUTE = 0x0002_0019,
  KEY_NOTIFY = 0x0000_0010,
  KEY_QUERY_VALUE = 0x0000_0001,
  KEY_READ = 0x0002_0019,
  KEY_SET_VALUE = 0x0000_0002,
  KEY_WOW64_32KEY = 0x0000_0200,
  KEY_WOW64_64KEY = 0x0000_0100,
  KEY_WRITE = 0x0002_0006,
}

export enum RegNotifyFilter {
  REG_NOTIFY_CHANGE_ATTRIBUTES = 0x0000_0002,
  REG_NOTIFY_CHANGE_LAST_SET = 0x0000_0004,
  REG_NOTIFY_CHANGE_NAME = 0x0000_0001,
  REG_NOTIFY_CHANGE_SECURITY = 0x0000_0008,
  REG_NOTIFY_THREAD_AGNOSTIC = 0x1000_0000,
}

export enum RegOption {
  REG_OPTION_BACKUP_RESTORE = 0x0000_0004,
  REG_OPTION_CREATE_LINK = 0x0000_0002,
  REG_OPTION_NON_VOLATILE = 0x0000_0000,
  REG_OPTION_OPEN_LINK = 0x0000_0008,
  REG_OPTION_VOLATILE = 0x0000_0001,
}

export enum RegType {
  REG_BINARY = 3,
  REG_DWORD = 4,
  REG_DWORD_BIG_ENDIAN = 5,
  REG_EXPAND_SZ = 2,
  REG_FULL_RESOURCE_DESCRIPTOR = 9,
  REG_LINK = 6,
  REG_MULTI_SZ = 7,
  REG_NONE = 0,
  REG_QWORD = 11,
  REG_RESOURCE_LIST = 8,
  REG_RESOURCE_REQUIREMENTS_LIST = 10,
  REG_SZ = 1,
}

export enum SCManagerAccessRights {
  SC_MANAGER_ALL_ACCESS = 0x000f_003f,
  SC_MANAGER_CONNECT = 0x0000_0001,
  SC_MANAGER_CREATE_SERVICE = 0x0000_0002,
  SC_MANAGER_ENUMERATE_SERVICE = 0x0000_0004,
  SC_MANAGER_LOCK = 0x0000_0008,
  SC_MANAGER_MODIFY_BOOT_CONFIG = 0x0000_0020,
  SC_MANAGER_QUERY_LOCK_STATUS = 0x0000_0010,
}

export enum SecurityDescriptorControl {
  SE_DACL_AUTO_INHERIT_REQ = 0x0100,
  SE_DACL_AUTO_INHERITED = 0x0400,
  SE_DACL_DEFAULTED = 0x0008,
  SE_DACL_PRESENT = 0x0004,
  SE_DACL_PROTECTED = 0x1000,
  SE_GROUP_DEFAULTED = 0x0002,
  SE_OWNER_DEFAULTED = 0x0001,
  SE_RM_CONTROL_VALID = 0x4000,
  SE_SACL_AUTO_INHERIT_REQ = 0x0200,
  SE_SACL_AUTO_INHERITED = 0x0800,
  SE_SACL_DEFAULTED = 0x0020,
  SE_SACL_PRESENT = 0x0010,
  SE_SACL_PROTECTED = 0x2000,
  SE_SELF_RELATIVE = 0x8000,
}

export enum SecurityImpersonationLevel {
  SecurityAnonymous = 0,
  SecurityDelegation = 3,
  SecurityIdentification = 1,
  SecurityImpersonation = 2,
}

export enum SecurityObjectType {
  SE_DS_OBJECT = 8,
  SE_DS_OBJECT_ALL = 9,
  SE_FILE_OBJECT = 1,
  SE_KERNEL_OBJECT = 6,
  SE_LMSHARE = 5,
  SE_PRINTER = 3,
  SE_PROVIDER_DEFINED_OBJECT = 10,
  SE_REGISTRY_KEY = 4,
  SE_REGISTRY_WOW64_32KEY = 12,
  SE_REGISTRY_WOW64_64KEY = 13,
  SE_SERVICE = 2,
  SE_UNKNOWN_OBJECT_TYPE = 0,
  SE_WINDOW_OBJECT = 7,
  SE_WMIGUID_OBJECT = 11,
}

export enum ServiceAccessRights {
  SERVICE_ALL_ACCESS = 0x000f_01ff,
  SERVICE_CHANGE_CONFIG = 0x0000_0002,
  SERVICE_ENUMERATE_DEPENDENTS = 0x0000_0008,
  SERVICE_INTERROGATE = 0x0000_0080,
  SERVICE_PAUSE_CONTINUE = 0x0000_0040,
  SERVICE_QUERY_CONFIG = 0x0000_0001,
  SERVICE_QUERY_STATUS = 0x0000_0004,
  SERVICE_START = 0x0000_0010,
  SERVICE_STOP = 0x0000_0020,
  SERVICE_USER_DEFINED_CONTROL = 0x0000_0100,
}

export enum ServiceControlCodes {
  SERVICE_CONTROL_CONTINUE = 0x0000_0003,
  SERVICE_CONTROL_INTERROGATE = 0x0000_0004,
  SERVICE_CONTROL_NETBINDADD = 0x0000_0007,
  SERVICE_CONTROL_NETBINDDISABLE = 0x0000_000a,
  SERVICE_CONTROL_NETBINDENABLE = 0x0000_0009,
  SERVICE_CONTROL_NETBINDREMOVE = 0x0000_0008,
  SERVICE_CONTROL_PARAMCHANGE = 0x0000_0006,
  SERVICE_CONTROL_PAUSE = 0x0000_0002,
  SERVICE_CONTROL_PRESHUTDOWN = 0x0000_000f,
  SERVICE_CONTROL_SHUTDOWN = 0x0000_0005,
  SERVICE_CONTROL_STOP = 0x0000_0001,
}

export enum ServiceCurrentState {
  SERVICE_CONTINUE_PENDING = 0x0000_0005,
  SERVICE_PAUSE_PENDING = 0x0000_0006,
  SERVICE_PAUSED = 0x0000_0007,
  SERVICE_RUNNING = 0x0000_0004,
  SERVICE_START_PENDING = 0x0000_0002,
  SERVICE_STOP_PENDING = 0x0000_0003,
  SERVICE_STOPPED = 0x0000_0001,
}

export enum ServiceErrorControl {
  SERVICE_ERROR_CRITICAL = 0x0000_0003,
  SERVICE_ERROR_IGNORE = 0x0000_0000,
  SERVICE_ERROR_NORMAL = 0x0000_0001,
  SERVICE_ERROR_SEVERE = 0x0000_0002,
}

export enum ServiceStartType {
  SERVICE_AUTO_START = 0x0000_0002,
  SERVICE_BOOT_START = 0x0000_0000,
  SERVICE_DEMAND_START = 0x0000_0003,
  SERVICE_DISABLED = 0x0000_0004,
  SERVICE_SYSTEM_START = 0x0000_0001,
}

export enum ServiceState {
  SERVICE_ACTIVE = 0x0000_0001,
  SERVICE_INACTIVE = 0x0000_0002,
  SERVICE_STATE_ALL = 0x0000_0003,
}

export enum ServiceType {
  SERVICE_ADAPTER = 0x0000_0004,
  SERVICE_FILE_SYSTEM_DRIVER = 0x0000_0002,
  SERVICE_INTERACTIVE_PROCESS = 0x0000_0100,
  SERVICE_KERNEL_DRIVER = 0x0000_0001,
  SERVICE_RECOGNIZER_DRIVER = 0x0000_0008,
  SERVICE_TYPE_ALL = 0x0000_013f,
  SERVICE_WIN32_OWN_PROCESS = 0x0000_0010,
  SERVICE_WIN32_SHARE_PROCESS = 0x0000_0020,
}

export enum TokenAccessRights {
  TOKEN_ADJUST_DEFAULT = 0x0000_0080,
  TOKEN_ADJUST_GROUPS = 0x0000_0040,
  TOKEN_ADJUST_PRIVILEGES = 0x0000_0020,
  TOKEN_ADJUST_SESSIONID = 0x0000_0100,
  TOKEN_ALL_ACCESS = 0x000f_01ff,
  TOKEN_ASSIGN_PRIMARY = 0x0000_0001,
  TOKEN_DUPLICATE = 0x0000_0002,
  TOKEN_EXECUTE = 0x0002_0000,
  TOKEN_IMPERSONATE = 0x0000_0004,
  TOKEN_QUERY = 0x0000_0008,
  TOKEN_QUERY_SOURCE = 0x0000_0010,
  TOKEN_READ = 0x0002_0008,
  TOKEN_WRITE = 0x0002_00e0,
}

export enum TokenInformationClass {
  TokenAccessInformation = 22,
  TokenAuditPolicy = 16,
  TokenDefaultDacl = 6,
  TokenElevation = 20,
  TokenElevationType = 18,
  TokenGroups = 2,
  TokenGroupsAndPrivileges = 13,
  TokenHasRestrictions = 21,
  TokenImpersonationLevel = 9,
  TokenIntegrityLevel = 25,
  TokenIsAppContainer = 29,
  TokenLinkedToken = 19,
  TokenLogonSid = 28,
  TokenMandatoryPolicy = 27,
  TokenOrigin = 17,
  TokenOwner = 4,
  TokenPrimaryGroup = 5,
  TokenPrivileges = 3,
  TokenRestrictedSids = 11,
  TokenSandBoxInert = 15,
  TokenSessionId = 12,
  TokenSessionReference = 14,
  TokenSource = 7,
  TokenStatistics = 10,
  TokenType = 8,
  TokenUIAccess = 26,
  TokenUser = 1,
  TokenVirtualizationAllowed = 23,
  TokenVirtualizationEnabled = 24,
}

export enum TokenType {
  TokenImpersonation = 2,
  TokenPrimary = 1,
}

export enum TrusteeForm {
  TRUSTEE_BAD_FORM = 2,
  TRUSTEE_IS_NAME = 1,
  TRUSTEE_IS_OBJECTS_AND_NAME = 4,
  TRUSTEE_IS_OBJECTS_AND_SID = 3,
  TRUSTEE_IS_SID = 0,
}

export enum TrusteeType {
  TRUSTEE_IS_ALIAS = 4,
  TRUSTEE_IS_COMPUTER = 8,
  TRUSTEE_IS_DELETED = 6,
  TRUSTEE_IS_DOMAIN = 3,
  TRUSTEE_IS_GROUP = 2,
  TRUSTEE_IS_INVALID = 7,
  TRUSTEE_IS_UNKNOWN = 0,
  TRUSTEE_IS_USER = 1,
  TRUSTEE_IS_WELL_KNOWN_GROUP = 5,
}

export enum WellKnownSidType {
  WinAccountAdministratorSid = 38,
  WinAccountCertAdminsSid = 46,
  WinAccountComputersSid = 44,
  WinAccountControllersSid = 45,
  WinAccountDomainAdminsSid = 41,
  WinAccountDomainGuestsSid = 43,
  WinAccountDomainUsersSid = 42,
  WinAccountEnterpriseAdminsSid = 48,
  WinAccountGuestSid = 39,
  WinAccountKrbtgtSid = 40,
  WinAccountPolicyAdminsSid = 49,
  WinAccountRasAndIasServersSid = 50,
  WinAccountSchemaAdminsSid = 47,
  WinAnonymousSid = 13,
  WinAuthenticatedUserSid = 17,
  WinBatchSid = 10,
  WinBuiltinAccountOperatorsSid = 30,
  WinBuiltinAdministratorsSid = 26,
  WinBuiltinAuthorizationAccessSid = 59,
  WinBuiltinBackupOperatorsSid = 33,
  WinBuiltinDomainSid = 25,
  WinBuiltinGuestsSid = 28,
  WinBuiltinIncomingForestTrustBuildersSid = 56,
  WinBuiltinNetworkConfigurationOperatorsSid = 37,
  WinBuiltinPerfLoggingUsersSid = 58,
  WinBuiltinPerfMonitoringUsersSid = 57,
  WinBuiltinPowerUsersSid = 29,
  WinBuiltinPreWindows2000CompatibleAccessSid = 35,
  WinBuiltinPrintOperatorsSid = 32,
  WinBuiltinRemoteDesktopUsersSid = 36,
  WinBuiltinReplicatorSid = 34,
  WinBuiltinSystemOperatorsSid = 31,
  WinBuiltinTerminalServerLicenseServersSid = 60,
  WinBuiltinUsersSid = 27,
  WinCreatorGroupServerSid = 6,
  WinCreatorGroupSid = 4,
  WinCreatorOwnerServerSid = 5,
  WinCreatorOwnerSid = 3,
  WinDialupSid = 8,
  WinDigestAuthenticationSid = 52,
  WinEnterpriseControllersSid = 15,
  WinHighLabelSid = 68,
  WinInteractiveSid = 11,
  WinLocalServiceSid = 23,
  WinLocalSid = 2,
  WinLocalSystemSid = 22,
  WinLogonIdsSid = 21,
  WinLowLabelSid = 66,
  WinMediumLabelSid = 67,
  WinNTAuthoritySid = 7,
  WinNTLMAuthenticationSid = 51,
  WinNetworkServiceSid = 24,
  WinNetworkSid = 9,
  WinNullSid = 0,
  WinOtherOrganizationSid = 55,
  WinProxySid = 14,
  WinRemoteLogonIdSid = 20,
  WinRestrictedCodeSid = 18,
  WinSChannelAuthenticationSid = 53,
  WinSelfSid = 16,
  WinServiceSid = 12,
  WinSystemLabelSid = 69,
  WinTerminalServerSid = 19,
  WinThisOrganizationSid = 54,
  WinWorldSid = 1,
}

export type ALG_ID = number;
export type AUDIT_EVENT_TYPE = number;
export type HCRYPTHASH = bigint;
export type HCRYPTKEY = bigint;
export type HCRYPTPROV = bigint;
export type HKEY = bigint;
export type HWCT = bigint;
export type LPLONG = Pointer;
export type LSA_HANDLE = bigint;
export type LSTATUS = number;
export type NTSTATUS = number;
export type PACL = Pointer;
export type PBOOL = Pointer;
export type PCREDENTIALA = Pointer;
export type PCREDENTIALW = Pointer;
export type PCREDENTIAL_TARGET_INFORMATIONA = Pointer;
export type PCREDENTIAL_TARGET_INFORMATIONW = Pointer;
export type PENCRYPTION_CERTIFICATE_HASH_LIST = Pointer;
export type PEXPLICIT_ACCESSA = Pointer;
export type PEXPLICIT_ACCESSW = Pointer;
export type PGENERIC_MAPPING = Pointer;
export type PHKEY = Pointer;
export type PLSA_ENUMERATION_INFORMATION = Pointer;
export type PLSA_HANDLE = Pointer;
export type PLSA_OBJECT_ATTRIBUTES = Pointer;
export type PLSA_REFERENCED_DOMAIN_LIST = Pointer;
export type PLSA_TRANSLATED_NAME = Pointer;
export type PLSA_TRANSLATED_SID = Pointer;
export type PLSA_TRANSLATED_SID2 = Pointer;
export type PLSA_TRUST_INFORMATION = Pointer;
export type PLSA_UNICODE_STRING = Pointer;
export type PLONG = Pointer;
export type POBJECT_TYPE_LIST = Pointer;
export type PPRIVILEGE_SET = Pointer;
export type PSECURITY_DESCRIPTOR = Pointer;
export type PSID = Pointer;
export type PSID_IDENTIFIER_AUTHORITY = Pointer;
export type PSID_NAME_USE = Pointer;
export type PTOKEN_GROUPS = Pointer;
export type PTOKEN_PRIVILEGES = Pointer;
export type PTRUSTEE = Pointer;
export type PUCHAR = Pointer;
export type PVALENTA = Pointer;
export type PVALENTW = Pointer;
export type REGSAM = number;
export type SC_HANDLE = bigint;
export type SECURITY_IMPERSONATION_LEVEL = number;
export type SECURITY_INFORMATION = number;
export type SERVICE_STATUS_HANDLE = bigint;
export type TOKEN_INFORMATION_CLASS = number;
export type TOKEN_TYPE = number;
export type TRACEHANDLE = bigint;
