import type { Pointer } from 'bun:ffi';

export type { BOOLEAN, CHAR, HANDLE, INT, LPCSTR, LPCWSTR, LPSTR, LPVOID, LPWSTR, NULL, Nullable, Optional, PHANDLE, PVOID, ULONG, USHORT } from '@bun-win32/core';

export const LBER_DEFAULT = 0xffff_ffff;
export const LBER_ERROR = 0xffff_ffff;
export const LDAP_GC_PORT = 3268;
export const LDAP_NO_LIMIT = 0;
export const LDAP_PORT = 389;
export const LDAP_SSL_GC_PORT = 3269;
export const LDAP_SSL_PORT = 636;

export enum LdapAuth {
  Digest = 0x4086,
  Dpa = 0x2086,
  External = 0x00a6,
  Msn = 0x0886,
  Negotiate = 0x0486,
  Ntlm = 0x1086,
  Otherkind = 0x0086,
  Sasl = 0x0083,
  Sicily = 0x0286,
  Simple = 0x0080,
  Sspi = 0x0486,
}

export enum LdapDeref {
  Always = 3,
  Finding = 2,
  Never = 0,
  Searching = 1,
}

export enum LdapModOp {
  Add = 0x00,
  Bvalues = 0x80,
  Delete = 0x01,
  Replace = 0x02,
}

export enum LdapMsg {
  All = 1,
  One = 0,
  Received = 2,
}

export enum LdapOption {
  ApiFeatureInfo = 0x15,
  ApiInfo = 0x00,
  ArecExclusive = 0x98,
  AutoReconnect = 0x91,
  CacheEnable = 0x0f,
  CacheFnPtrs = 0x0d,
  CacheStrategy = 0x0e,
  ClientCertificate = 0x80,
  Deref = 0x02,
  Desc = 0x01,
  DnsDomainName = 0x3b,
  Encrypt = 0x96,
  ErrorNumber = 0x31,
  ErrorString = 0x32,
  FastConcurrentBind = 0x41,
  GetDsNameFlags = 0x3d,
  HostName = 0x30,
  HostReachable = 0x3e,
  IoFnPtrs = 0x0b,
  PingKeepAlive = 0x36,
  PingLimit = 0x38,
  PingWaitTime = 0x37,
  PromptCredentials = 0x3f,
  ProtocolVersion = 0x11,
  RebindArg = 0x07,
  RebindFn = 0x06,
  RefDerefConnPerMsg = 0x94,
  ReferralCallback = 0x70,
  ReferralHopLimit = 0x10,
  Referrals = 0x08,
  Restart = 0x09,
  RootDseCache = 0x9a,
  SaslMethod = 0x97,
  SchFlags = 0x43,
  SecurityContext = 0x99,
  SendTimeout = 0x42,
  ServerCertificate = 0x81,
  ServerError = 0x33,
  ServerExtError = 0x34,
  Sign = 0x95,
  SizeLimit = 0x03,
  SocketBindAddresses = 0x44,
  Ssl = 0x0a,
  SslInfo = 0x93,
  SspiFlags = 0x92,
  TcpKeepAlive = 0x40,
  ThreadFnPtrs = 0x05,
  TimeLimit = 0x04,
  Version = 0x11,
}

export enum LdapRetcode {
  AdminLimitExceeded = 0x0b,
  AffectsMultipleDsas = 0x47,
  AliasDerefProblem = 0x24,
  AliasProblem = 0x21,
  AlreadyExists = 0x44,
  AttributeOrValueExists = 0x14,
  AuthMethodNotSupported = 0x07,
  AuthUnknown = 0x56,
  Busy = 0x33,
  ClientLoop = 0x60,
  CompareFalse = 0x05,
  CompareTrue = 0x06,
  ConfidentialityRequired = 0x0d,
  ConnectError = 0x5b,
  ConstraintViolation = 0x13,
  ControlNotFound = 0x5d,
  DecodingError = 0x54,
  EncodingError = 0x53,
  FilterError = 0x57,
  InappropriateAuth = 0x30,
  InappropriateMatching = 0x12,
  InsufficientRights = 0x32,
  InvalidCredentials = 0x31,
  InvalidDnSyntax = 0x22,
  InvalidSyntax = 0x15,
  IsLeaf = 0x23,
  LocalError = 0x52,
  LoopDetect = 0x36,
  MoreResultsToReturn = 0x5f,
  NamingViolation = 0x40,
  NoMemory = 0x5a,
  NoObjectClassMods = 0x45,
  NoResultsReturned = 0x5e,
  NoSuchAttribute = 0x10,
  NoSuchObject = 0x20,
  NotAllowedOnNonleaf = 0x42,
  NotAllowedOnRdn = 0x43,
  NotSupported = 0x5c,
  ObjectClassViolation = 0x41,
  OffsetRangeError = 0x3d,
  OperationsError = 0x01,
  Other = 0x50,
  ParamError = 0x59,
  PartialResults = 0x09,
  ProtocolError = 0x02,
  Referral = 0x0a,
  ReferralLimitExceeded = 0x61,
  ResultsTooLarge = 0x46,
  SaslBindInProgress = 0x0e,
  ServerDown = 0x51,
  SizelimitExceeded = 0x04,
  SortControlMissing = 0x3c,
  StrongAuthRequired = 0x08,
  Success = 0x00,
  TimelimitExceeded = 0x03,
  Timeout = 0x55,
  Unavailable = 0x34,
  UnavailableCritExtension = 0x0c,
  UndefinedType = 0x11,
  UnwillingToPerform = 0x35,
  UserCancelled = 0x58,
  VirtualListViewError = 0x4c,
}

export enum LdapScope {
  Base = 0x00,
  OneLevel = 0x01,
  Subtree = 0x02,
}

export enum LdapVersion {
  One = 1,
  Three = 3,
  Two = 2,
}

export type DBGPRINT = Pointer;
export type PBERVAL = Pointer;
export type PBerElement = bigint;
export type PCHAR = Pointer;
export type PINT = Pointer;
export type PLDAP = bigint;
export type PLDAPControlA = Pointer;
export type PLDAPControlW = Pointer;
export type PLDAPMessage = bigint;
export type PLDAPSearch = bigint;
export type PLDAPVLVInfo = Pointer;
export type PLDAP_TIMEVAL = Pointer;
export type PLDAP_VERSION_INFO = Pointer;
export type PPBERVAL = Pointer;
export type PPBerElement = Pointer;
export type PPCHAR = Pointer;
export type PPLDAPControlA = Pointer;
export type PPLDAPControlW = Pointer;
export type PPLDAPMessage = Pointer;
export type PPLDAPModA = Pointer;
export type PPLDAPModW = Pointer;
export type PPLDAPSortKeyA = Pointer;
export type PPLDAPSortKeyW = Pointer;
export type PPPLDAPControlA = Pointer;
export type PPPLDAPControlW = Pointer;
export type PPZPSTR = Pointer;
export type PPZPWSTR = Pointer;
export type PSTR = Pointer;
export type PULONG = Pointer;
export type PWCHAR = Pointer;
export type PWSTR = Pointer;
export type PZPSTR = Pointer;
export type PZPWSTR = Pointer;
export type UCHAR = number;
