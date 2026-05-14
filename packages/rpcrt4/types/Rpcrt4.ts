import type { Pointer } from 'bun:ffi';

export type { BOOL, DWORD, HANDLE, LONG, LPSTR, LPVOID, LPWSTR, NULL, PVOID, ULONG, USHORT, VOID, WORD } from '@bun-win32/core';

export const RPC_C_AUTHN_DEFAULT = 0xffff_ffff;
export const RPC_C_AUTHZ_DEFAULT = 0xffff_ffff;
export const RPC_C_BINDING_INFINITE_TIMEOUT = 10;
export const RPC_C_BINDING_DEFAULT_TIMEOUT = 5;
export const RPC_C_BINDING_MIN_TIMEOUT = 0;
export const RPC_C_BINDING_MAX_TIMEOUT = 9;
export const RPC_C_CANCEL_INFINITE_TIMEOUT = 0xffff_ffff;
export const RPC_C_LISTEN_MAX_CALLS_DEFAULT = 1234;
export const RPC_C_PROTSEQ_MAX_REQS_DEFAULT = 10;
export const RPC_C_NO_GENERIC_RETRY = 0x0000_0001;
export const RPC_C_OPT_DONT_LINGER = 13;

export const RPC_C_MGMT_INQ_IF_IDS = 0;
export const RPC_C_MGMT_INQ_PRINC_NAME = 1;
export const RPC_C_MGMT_INQ_STATS = 2;
export const RPC_C_MGMT_IS_SERVER_LISTEN = 3;
export const RPC_C_MGMT_STOP_SERVER_LISTEN = 4;

export const RPC_C_STATS_CALLS_IN = 0;
export const RPC_C_STATS_CALLS_OUT = 1;
export const RPC_C_STATS_PKTS_IN = 2;
export const RPC_C_STATS_PKTS_OUT = 3;

export const RPC_C_AUTHN_INFO_NONE = 0;
export const RPC_C_AUTHN_INFO_TYPE_HTTP = 1;
export const RPC_C_HTTP_AUTHN_TARGET_SERVER = 1;
export const RPC_C_HTTP_AUTHN_TARGET_PROXY = 2;

export const RPC_C_AUTHN_LEVEL_DEFAULT = 0;

export const RPC_S_OK = 0;
export const RPC_S_INVALID_ARG = 87;
export const RPC_S_OUT_OF_MEMORY = 14;
export const RPC_S_OUT_OF_THREADS = 164;
export const RPC_S_INVALID_LEVEL = 87;
export const RPC_S_BUFFER_TOO_SMALL = 122;
export const RPC_S_ACCESS_DENIED = 5;
export const RPC_S_SERVER_TOO_BUSY = 1723;
export const RPC_S_CALL_FAILED = 1726;
export const RPC_S_NO_MORE_BINDINGS = 1806;
export const RPC_S_NOT_LISTENING = 1715;
export const RPC_S_NOTHING_TO_EXPORT = 1754;
export const RPC_S_NO_MORE_MEMBERS = 1773;
export const RPC_S_NO_INTERFACES = 1817;
export const RPC_S_CALL_CANCELLED = 1818;
export const RPC_S_ENTRY_ALREADY_EXISTS = 1760;
export const RPC_S_ENTRY_NOT_FOUND = 1761;
export const RPC_S_NAME_SERVICE_UNAVAILABLE = 1762;
export const RPC_S_BINDING_HAS_NO_AUTH = 1746;
export const RPC_S_UNKNOWN_AUTHN_SERVICE = 1747;
export const RPC_S_UNKNOWN_AUTHN_LEVEL = 1748;
export const RPC_S_UNKNOWN_AUTHN_TYPE = 1741;
export const RPC_S_INVALID_AUTH_IDENTITY = 1749;
export const RPC_S_UNKNOWN_AUTHZ_SERVICE = 1750;
export const RPC_S_TYPE_ALREADY_REGISTERED = 1713;
export const RPC_S_ALREADY_LISTENING = 1713;
export const RPC_S_NO_PROTSEQS_REGISTERED = 1714;
export const RPC_S_INVALID_BINDING = 1702;
export const RPC_S_PROTSEQ_NOT_SUPPORTED = 1703;
export const RPC_S_INVALID_RPC_PROTSEQ = 1704;
export const RPC_S_INVALID_STRING_UUID = 1705;
export const RPC_S_INVALID_ENDPOINT_FORMAT = 1706;
export const RPC_S_INVALID_NET_ADDR = 1707;
export const RPC_S_NO_ENDPOINT_FOUND = 1708;
export const RPC_S_INVALID_TIMEOUT = 1709;
export const RPC_S_OBJECT_NOT_FOUND = 1710;
export const RPC_S_ALREADY_REGISTERED = 1711;
export const RPC_S_TYPE_NOT_REGISTERED = 1712;
export const RPC_S_STRING_TOO_LONG = 1743;

export enum RpcAuthnLevel {
  RPC_C_AUTHN_LEVEL_CALL = 3,
  RPC_C_AUTHN_LEVEL_CONNECT = 2,
  RPC_C_AUTHN_LEVEL_DEFAULT = 0,
  RPC_C_AUTHN_LEVEL_NONE = 1,
  RPC_C_AUTHN_LEVEL_PKT = 4,
  RPC_C_AUTHN_LEVEL_PKT_INTEGRITY = 5,
  RPC_C_AUTHN_LEVEL_PKT_PRIVACY = 6,
}

export enum RpcAuthnService {
  RPC_C_AUTHN_CLOUD_AP = 36,
  RPC_C_AUTHN_DCE_PRIVATE = 1,
  RPC_C_AUTHN_DCE_PUBLIC = 2,
  RPC_C_AUTHN_DEC_PUBLIC = 4,
  RPC_C_AUTHN_DIGEST = 21,
  RPC_C_AUTHN_DPA = 17,
  RPC_C_AUTHN_GSS_KERBEROS = 16,
  RPC_C_AUTHN_GSS_NEGOTIATE = 9,
  RPC_C_AUTHN_GSS_SCHANNEL = 14,
  RPC_C_AUTHN_KERNEL = 20,
  RPC_C_AUTHN_LIVE_SSP = 32,
  RPC_C_AUTHN_LIVEXP_SSP = 35,
  RPC_C_AUTHN_MQ = 100,
  RPC_C_AUTHN_MSN = 18,
  RPC_C_AUTHN_NEGO_EXTENDER = 30,
  RPC_C_AUTHN_NETLOGON = 68,
  RPC_C_AUTHN_NONE = 0,
  RPC_C_AUTHN_PKU2U = 31,
  RPC_C_AUTHN_VIRTUAL_ACCOUNT = 69,
  RPC_C_AUTHN_WINNT = 10,
}

export enum RpcAuthzService {
  RPC_C_AUTHZ_DCE = 2,
  RPC_C_AUTHZ_NAME = 1,
  RPC_C_AUTHZ_NONE = 0,
}

export enum RpcImpLevel {
  RPC_C_IMP_LEVEL_ANONYMOUS = 1,
  RPC_C_IMP_LEVEL_DEFAULT = 0,
  RPC_C_IMP_LEVEL_DELEGATE = 4,
  RPC_C_IMP_LEVEL_IDENTIFY = 2,
  RPC_C_IMP_LEVEL_IMPERSONATE = 3,
}

export enum RpcQosCapabilities {
  RPC_C_QOS_CAPABILITIES_DEFAULT = 0x0,
  RPC_C_QOS_CAPABILITIES_IGNORE_DELEGATE_FAILURE = 0x40,
  RPC_C_QOS_CAPABILITIES_LOCAL_MA_HINT = 0x80,
  RPC_C_QOS_CAPABILITIES_MAKE_FULLSIC = 0x2,
  RPC_C_QOS_CAPABILITIES_MUTUAL_AUTH = 0x1,
  RPC_C_QOS_CAPABILITIES_SCHANNEL_FULL_AUTH_IDENTITY = 0x100,
}

export enum RpcQosIdentity {
  RPC_C_QOS_IDENTITY_DYNAMIC = 0x1,
  RPC_C_QOS_IDENTITY_STATIC = 0x0,
}

export enum RpcQosVersion {
  RPC_C_SECURITY_QOS_VERSION = 1,
  RPC_C_SECURITY_QOS_VERSION_2 = 2,
  RPC_C_SECURITY_QOS_VERSION_3 = 3,
  RPC_C_SECURITY_QOS_VERSION_4 = 4,
  RPC_C_SECURITY_QOS_VERSION_5 = 5,
}

export enum MidlEsCode {
  MES_DECODE = 1,
  MES_ENCODE = 0,
  MES_ENCODE_NDR64 = 2,
}

export enum MidlEsHandleStyle {
  MES_DYNAMIC_BUFFER_HANDLE = 1,
  MES_FIXED_BUFFER_HANDLE = 0,
  MES_INCREMENTAL_HANDLE = 2,
}

export type DCERPC_ERROR_CODE = number;
export type MIDL_ES_HANDLE = bigint;
export type PCCERT_CONTEXT = bigint;
export type PMIDL_ES_HANDLE = Pointer;
export type PRPC_ASYNC_NOTIFICATION_INFO = Pointer;
export type PRPC_ASYNC_STATE = Pointer;
export type PRPC_AUTH_IDENTITY_HANDLE = Pointer;
export type PRPC_AUTHZ_HANDLE = Pointer;
export type PRPC_BINDING_HANDLE = Pointer;
export type PRPC_BINDING_HANDLE_OPTIONS_V1 = Pointer;
export type PRPC_BINDING_HANDLE_SECURITY_V1_A = Pointer;
export type PRPC_BINDING_HANDLE_SECURITY_V1_W = Pointer;
export type PRPC_BINDING_HANDLE_TEMPLATE_V1_A = Pointer;
export type PRPC_BINDING_HANDLE_TEMPLATE_V1_W = Pointer;
export type PRPC_BINDING_VECTOR = Pointer;
export type PRPC_CALL_ATTRIBUTES_V2_A = Pointer;
export type PRPC_CALL_ATTRIBUTES_V2_W = Pointer;
export type PRPC_CSTR = Pointer;
export type PRPC_ENDPOINT_TEMPLATEA = Pointer;
export type PRPC_ENDPOINT_TEMPLATEW = Pointer;
export type PRPC_HTTP_TRANSPORT_CREDENTIALS_V1_A = Pointer;
export type PRPC_HTTP_TRANSPORT_CREDENTIALS_V1_W = Pointer;
export type PRPC_IF_HANDLE = Pointer;
export type PRPC_IF_ID = Pointer;
export type PRPC_IF_ID_VECTOR = Pointer;
export type PRPC_INTERFACE_TEMPLATEA = Pointer;
export type PRPC_INTERFACE_TEMPLATEW = Pointer;
export type PRPC_MGR_EPV = Pointer;
export type PRPC_NS_HANDLE = Pointer;
export type PRPC_POLICY = Pointer;
export type PRPC_PROTSEQ_VECTORA = Pointer;
export type PRPC_PROTSEQ_VECTORW = Pointer;
export type PRPC_SECURITY_QOS = Pointer;
export type PRPC_SERVER_INTERFACE = Pointer;
export type PRPC_STATS_VECTOR = Pointer;
export type PRPC_STATUS = Pointer;
export type PRPC_VERSION = Pointer;
export type PRPC_WSTR = Pointer;
export type PSEC_WINNT_AUTH_IDENTITY_A = Pointer;
export type PSEC_WINNT_AUTH_IDENTITY_W = Pointer;
export type PUUID = Pointer;
export type PUUID_VECTOR = Pointer;
export type RPC_AUTH_IDENTITY_HANDLE = Pointer;
export type RPC_AUTH_KEY_RETRIEVAL_FN = Pointer;
export type RPC_AUTHZ_HANDLE = bigint;
export type RPC_BINDING_HANDLE = bigint;
export type RPC_CSTR = Pointer;
export type RPC_IF_CALLBACK_FN = Pointer;
export type RPC_IF_HANDLE = Pointer;
export type RPC_INTERFACE_GROUP = bigint;
export type RPC_MGMT_AUTHORIZATION_FN = Pointer;
export type RPC_NS_HANDLE = bigint;
export type RPC_NOTIFICATION_CALLBACK = Pointer;
export type RPC_OBJECT_INQ_FN = Pointer;
export type RPC_STATUS = number;
export type RPC_WSTR = Pointer;
