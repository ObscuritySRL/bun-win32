import type { Pointer } from 'bun:ffi';

export type { BOOLEAN, HANDLE, LPSTR, LPWSTR, NULL, PHANDLE, PULONG, PVOID, ULONG, VOID } from '@bun-win32/core';

export enum CredentialUse {
  SECPKG_CRED_BOTH = 0x0000_0003,
  SECPKG_CRED_INBOUND = 0x0000_0001,
  SECPKG_CRED_OUTBOUND = 0x0000_0002,
}

export enum ExtendedNameFormat {
  NameCanonical = 0x0000_0007,
  NameCanonicalEx = 0x0000_0009,
  NameDisplay = 0x0000_0003,
  NameDnsDomain = 0x0000_000c,
  NameFullyQualifiedDN = 0x0000_0001,
  NameGivenName = 0x0000_000d,
  NameSamCompatible = 0x0000_0002,
  NameServicePrincipal = 0x0000_000a,
  NameSurname = 0x0000_000e,
  NameUniqueId = 0x0000_0006,
  NameUnknown = 0x0000_0000,
  NameUserPrincipal = 0x0000_0008,
}

export enum PolicyNotificationInformationClass {
  PolicyNotifyAccountDomainInformation = 0x0000_0002,
  PolicyNotifyAuditEventsInformation = 0x0000_0001,
  PolicyNotifyDnsDomainInformation = 0x0000_0004,
  PolicyNotifyDomainEcsInformation = 0x0000_0005,
  PolicyNotifyDomainKerberosTicketInformation = 0x0000_0006,
  PolicyNotifyGlobalSaslNameInformation = 0x0000_0008,
  PolicyNotifyMachineAccountPasswordInformation = 0x0000_0007,
  PolicyNotifyServerRoleInformation = 0x0000_0003,
}

export enum SecurityLogonType {
  Batch = 0x0000_0004,
  CachedInteractive = 0x0000_000b,
  CachedRemoteInteractive = 0x0000_000c,
  CachedUnlock = 0x0000_000d,
  Interactive = 0x0000_0002,
  Network = 0x0000_0003,
  NetworkCleartext = 0x0000_0008,
  NewCredentials = 0x0000_0009,
  Proxy = 0x0000_0006,
  RemoteInteractive = 0x0000_000a,
  Service = 0x0000_0005,
  UndefinedLogonType = 0x0000_0000,
  Unlock = 0x0000_0007,
}

export type EXTENDED_NAME_FORMAT = number;
export type NTSTATUS = number;
export type PBOOLEAN = Pointer;
export type PCREDENTIAL_TARGET_INFORMATIONW = Pointer;
export type PCWSTR = Pointer;
export type PCredHandle = Pointer;
export type PCtxtHandle = Pointer;
export type PLSA_OPERATIONAL_MODE = Pointer;
export type PLSA_STRING = Pointer;
export type PLUID = Pointer;
export type PNTSTATUS = Pointer;
export type POLICY_NOTIFICATION_INFORMATION_CLASS = number;
export type PQUOTA_LIMITS = Pointer;
export type PSECURITY_LOGON_SESSION_DATA = Pointer;
export type PSECURITY_PACKAGE_OPTIONS = Pointer;
export type PSEC_WINNT_AUTH_IDENTITY_OPAQUE = Pointer;
export type PSecBuffer = Pointer;
export type PSecBufferDesc = Pointer;
export type PSecPkgInfoA = Pointer;
export type PSecPkgInfoW = Pointer;
export type PSecurityFunctionTableA = Pointer;
export type PSecurityFunctionTableW = Pointer;
export type PSecurityUserData = Pointer;
export type PTOKEN_GROUPS = Pointer;
export type PTOKEN_SOURCE = Pointer;
export type PTimeStamp = Pointer;
export type PUCHAR = Pointer;
export type PUSHORT = Pointer;
export type SECURITY_LOGON_TYPE = number;
export type SECURITY_STATUS = number;
export type SEC_GET_KEY_FN = Pointer;
