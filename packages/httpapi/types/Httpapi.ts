import type { Pointer } from 'bun:ffi';

import type { ULONG } from '@bun-win32/core';
export type {
  BOOL,
  BOOLEAN,
  BYTE,
  CHAR,
  DWORD,
  HANDLE,
  LONG,
  LPCSTR,
  LPCVOID,
  LPCWSTR,
  LPSECURITY_ATTRIBUTES,
  LPSTR,
  LPVOID,
  LPWSTR,
  NULL,
  NULLABLE,
  OPTIONAL,
  PBYTE,
  PDWORD,
  PHANDLE,
  PULONG,
  PVOID,
  SHORT,
  UINT,
  ULONG,
  USHORT,
  VOID,
  WCHAR,
  WORD,
} from '@bun-win32/core';

export const HTTP_BYTE_RANGE_TO_EOF = 0xffff_ffff_ffff_ffffn;
export const HTTP_LIMIT_INFINITE: ULONG = 0xffff_ffff;
export const HTTP_MAX_SERVER_QUEUE_LENGTH: ULONG = 0x7fff_ffff;
export const HTTP_MIN_ALLOWED_BANDWIDTH_THROTTLING_RATE: ULONG = 1024;
export const HTTP_MIN_SERVER_QUEUE_LENGTH: ULONG = 1;
export const HTTP_NULL_ID = 0n;
export const HTTPAPI_VERSION_1 = 0x0000_0001;
export const HTTPAPI_VERSION_2 = 0x0000_0002;

export enum HTTP_503_RESPONSE_VERBOSITY {
  Http503ResponseVerbosityBasic = 0,
  Http503ResponseVerbosityFull = 2,
  Http503ResponseVerbosityLimited = 1,
}

export enum HTTP_AUTH_STATUS {
  HttpAuthStatusFailure = 2,
  HttpAuthStatusNotAuthenticated = 1,
  HttpAuthStatusSuccess = 0,
}

export enum HTTP_AUTHENTICATION_HARDENING_LEVELS {
  HttpAuthenticationHardeningLegacy = 0,
  HttpAuthenticationHardeningMedium = 1,
  HttpAuthenticationHardeningStrict = 2,
}

export enum HTTP_CACHE_POLICY_TYPE {
  HttpCachePolicyMaximum = 3,
  HttpCachePolicyNocache = 0,
  HttpCachePolicyTimeToLive = 2,
  HttpCachePolicyUserInvalidates = 1,
}

export enum HTTP_CREATE_REQUEST_QUEUE_FLAG {
  HTTP_CREATE_REQUEST_QUEUE_FLAG_CONTROLLER = 0x0000_0002,
  HTTP_CREATE_REQUEST_QUEUE_FLAG_DELEGATION = 0x0000_0008,
  HTTP_CREATE_REQUEST_QUEUE_FLAG_OPEN_EXISTING = 0x0000_0001,
}

export enum HTTP_DATA_CHUNK_TYPE {
  HttpDataChunkFromFileHandle = 1,
  HttpDataChunkFromFragmentCache = 2,
  HttpDataChunkFromFragmentCacheEx = 3,
  HttpDataChunkFromMemory = 0,
  HttpDataChunkMaximum = 5,
  HttpDataChunkTrailers = 4,
}

export enum HTTP_DELEGATE_REQUEST_PROPERTY_ID {
  DelegateRequestDelegateUrlProperty = 1,
  DelegateRequestReservedProperty = 0,
}

export enum HTTP_ENABLED_STATE {
  HttpEnabledStateActive = 0,
  HttpEnabledStateInactive = 1,
}

export enum HTTP_FEATURE_ID {
  HttpFeatureApiTimings = 2,
  HttpFeatureDelegateEx = 3,
  HttpFeatureHttp3 = 4,
  HttpFeatureResponseTrailers = 1,
  HttpFeatureUnknown = 0,
  HttpFeaturemax = 0xffff_ffff,
}

export enum HTTP_FLUSH_RESPONSE_FLAG {
  HTTP_FLUSH_RESPONSE_FLAG_RECURSIVE = 0x0000_0001,
}

export enum HTTP_HEADER_ID {
  HttpHeaderAccept = 20,
  HttpHeaderAcceptCharset = 21,
  HttpHeaderAcceptEncoding = 22,
  HttpHeaderAcceptLanguage = 23,
  HttpHeaderAcceptRanges = 20,
  HttpHeaderAge = 21,
  HttpHeaderAllow = 10,
  HttpHeaderAuthorization = 24,
  HttpHeaderCacheControl = 0,
  HttpHeaderConnection = 1,
  HttpHeaderContentEncoding = 13,
  HttpHeaderContentLanguage = 14,
  HttpHeaderContentLength = 11,
  HttpHeaderContentLocation = 15,
  HttpHeaderContentMd5 = 16,
  HttpHeaderContentRange = 17,
  HttpHeaderContentType = 12,
  HttpHeaderCookie = 25,
  HttpHeaderDate = 2,
  HttpHeaderEtag = 22,
  HttpHeaderExpect = 26,
  HttpHeaderExpires = 18,
  HttpHeaderFrom = 27,
  HttpHeaderHost = 28,
  HttpHeaderIfMatch = 29,
  HttpHeaderIfModifiedSince = 30,
  HttpHeaderIfNoneMatch = 31,
  HttpHeaderIfRange = 32,
  HttpHeaderIfUnmodifiedSince = 33,
  HttpHeaderKeepAlive = 3,
  HttpHeaderLastModified = 19,
  HttpHeaderLocation = 23,
  HttpHeaderMaxForwards = 34,
  HttpHeaderMaximum = 41,
  HttpHeaderPragma = 4,
  HttpHeaderProxyAuthenticate = 24,
  HttpHeaderProxyAuthorization = 35,
  HttpHeaderRange = 37,
  HttpHeaderReferer = 36,
  HttpHeaderRequestMaximum = 41,
  HttpHeaderResponseMaximum = 30,
  HttpHeaderRetryAfter = 25,
  HttpHeaderServer = 26,
  HttpHeaderSetCookie = 27,
  HttpHeaderTe = 38,
  HttpHeaderTrailer = 5,
  HttpHeaderTransferEncoding = 6,
  HttpHeaderTranslate = 39,
  HttpHeaderUpgrade = 7,
  HttpHeaderUserAgent = 40,
  HttpHeaderVary = 28,
  HttpHeaderVia = 8,
  HttpHeaderWarning = 9,
  HttpHeaderWwwAuthenticate = 29,
}

export enum HTTP_INITIALIZE_FLAG {
  HTTP_DEMAND_CBT = 0x0000_0004,
  HTTP_INITIALIZE_CONFIG = 0x0000_0002,
  HTTP_INITIALIZE_SERVER = 0x0000_0001,
}

export enum HTTP_LOG_DATA_TYPE {
  HttpLogDataTypeFields = 0,
}

export enum HTTP_LOGGING_ROLLOVER_TYPE {
  HttpLoggingRolloverDaily = 1,
  HttpLoggingRolloverFileSize = 4,
  HttpLoggingRolloverHourly = 3,
  HttpLoggingRolloverMonthly = 2,
  HttpLoggingRolloverSize = 0,
}

export enum HTTP_LOGGING_TYPE {
  HttpLoggingTypeIIS = 1,
  HttpLoggingTypeNCSA = 2,
  HttpLoggingTypeRaw = 3,
  HttpLoggingTypeW3C = 0,
}

export enum HTTP_QOS_SETTING_TYPE {
  HttpQosSettingTypeBandwidth = 0,
  HttpQosSettingTypeConnectionLimit = 1,
  HttpQosSettingTypeFlowRate = 2,
}

export enum HTTP_RECEIVE_REQUEST_ENTITY_BODY_FLAG {
  HTTP_RECEIVE_REQUEST_ENTITY_BODY_FLAG_FILL_BUFFER = 0x0000_0001,
}

export enum HTTP_RECEIVE_REQUEST_FLAG {
  HTTP_RECEIVE_REQUEST_FLAG_COPY_BODY = 0x0000_0001,
  HTTP_RECEIVE_REQUEST_FLAG_FLUSH_BODY = 0x0000_0002,
}

export enum HTTP_RECEIVE_SECURE_FLAG {
  HTTP_RECEIVE_FULL_CHAIN = 0x2,
  HTTP_RECEIVE_SECURE_CHANNEL_TOKEN = 0x1,
}

export enum HTTP_REQUEST_AUTH_TYPE {
  HttpRequestAuthTypeBasic = 1,
  HttpRequestAuthTypeDigest = 2,
  HttpRequestAuthTypeKerberos = 5,
  HttpRequestAuthTypeNTLM = 3,
  HttpRequestAuthTypeNegotiate = 4,
  HttpRequestAuthTypeNone = 0,
}

export enum HTTP_REQUEST_FLAG {
  HTTP_REQUEST_FLAG_HTTP2 = 0x0000_0004,
  HTTP_REQUEST_FLAG_HTTP3 = 0x0000_0008,
  HTTP_REQUEST_FLAG_IP_ROUTED = 0x0000_0002,
  HTTP_REQUEST_FLAG_MORE_ENTITY_BODY_EXISTS = 0x0000_0001,
}

export enum HTTP_REQUEST_INFO_TYPE {
  HttpRequestInfoTypeAuth = 0,
  HttpRequestInfoTypeChannelBind = 3,
  HttpRequestInfoTypeRequestTiming = 5,
  HttpRequestInfoTypeSslCertInfo = 2,
  HttpRequestInfoTypeSslProtocol = 1,
  HttpRequestInfoTypeTcpInfoV0 = 6,
  HttpRequestInfoTypeTcpInfoV1 = 8,
  HttpRequestInfoTypeTokenBinding = 4,
}

export enum HTTP_REQUEST_PROPERTY {
  HttpRequestPropertyIsb = 0,
  HttpRequestPropertyQuicApiTimings = 7,
  HttpRequestPropertyQuicStats = 2,
  HttpRequestPropertySni = 4,
  HttpRequestPropertyStreamError = 5,
  HttpRequestPropertyTcpInfoV0 = 1,
  HttpRequestPropertyTcpInfoV1 = 3,
  HttpRequestPropertyWskApiTimings = 6,
}

export enum HTTP_REQUEST_TIMING_TYPE {
  HttpRequestTimingTypeConnectionStart = 0,
  HttpRequestTimingTypeDataReception = 1,
  HttpRequestTimingTypeMax = 28,
  HttpRequestTimingTypeRequestHeaderParseEnd = 5,
  HttpRequestTimingTypeRequestHeaderParseStart = 4,
  HttpRequestTimingTypeRequestRoutingEnd = 7,
  HttpRequestTimingTypeRequestRoutingStart = 6,
  HttpRequestTimingTypeSslHandshakeLeg1End = 3,
  HttpRequestTimingTypeSslHandshakeLeg1Start = 2,
}

export enum HTTP_RESPONSE_FLAG {
  HTTP_RESPONSE_FLAG_MORE_ENTITY_BODY_EXISTS = 0x0000_0002,
  HTTP_RESPONSE_FLAG_MULTIPLE_ENCODINGS_AVAILABLE = 0x0000_0001,
}

export enum HTTP_RESPONSE_INFO_TYPE {
  HttpResponseInfoTypeAuthenticationProperty = 1,
  HttpResponseInfoTypeChannelBind = 3,
  HttpResponseInfoTypeMultipleKnownHeaders = 0,
  HttpResponseInfoTypeQoSProperty = 2,
}

export enum HTTP_SEND_RESPONSE_FLAG {
  HTTP_SEND_RESPONSE_FLAG_BUFFER_DATA = 0x0000_0004,
  HTTP_SEND_RESPONSE_FLAG_DISCONNECT = 0x0000_0001,
  HTTP_SEND_RESPONSE_FLAG_ENABLE_NAGLING = 0x0000_0008,
  HTTP_SEND_RESPONSE_FLAG_GOAWAY = 0x0000_0100,
  HTTP_SEND_RESPONSE_FLAG_MORE_DATA = 0x0000_0002,
  HTTP_SEND_RESPONSE_FLAG_OPAQUE = 0x0000_0040,
  HTTP_SEND_RESPONSE_FLAG_PROCESS_RANGES = 0x0000_0020,
}

export enum HTTP_SERVER_PROPERTY {
  HttpServer503VerbosityProperty = 6,
  HttpServerAuthenticationProperty = 0,
  HttpServerBindingProperty = 7,
  HttpServerChannelBindProperty = 10,
  HttpServerDelegationProperty = 16,
  HttpServerExtendedAuthenticationProperty = 8,
  HttpServerListenEndpointProperty = 9,
  HttpServerLoggingProperty = 1,
  HttpServerProtectionLevelProperty = 11,
  HttpServerQosProperty = 2,
  HttpServerQueueLengthProperty = 4,
  HttpServerStateProperty = 5,
  HttpServerTimeoutsProperty = 3,
}

export enum HTTP_SERVICE_BINDING_TYPE {
  HttpServiceBindingTypeA = 2,
  HttpServiceBindingTypeNone = 0,
  HttpServiceBindingTypeW = 1,
}

export enum HTTP_SERVICE_CONFIG_CACHE_KEY {
  MaxCacheResponseSize = 0,
  MaxCacheSize = 1,
}

export enum HTTP_SERVICE_CONFIG_ID {
  HttpServiceConfigCache = 4,
  HttpServiceConfigIPListenList = 0,
  HttpServiceConfigMax = 13,
  HttpServiceConfigSetting = 7,
  HttpServiceConfigSslCcsCertInfo = 6,
  HttpServiceConfigSslCcsCertInfoEx = 10,
  HttpServiceConfigSslCertInfoEx = 8,
  HttpServiceConfigSslScopedCcsCertInfo = 11,
  HttpServiceConfigSslScopedCcsCertInfoEx = 12,
  HttpServiceConfigSslSniCertInfo = 5,
  HttpServiceConfigSslSniCertInfoEx = 9,
  HttpServiceConfigSSLCertInfo = 1,
  HttpServiceConfigTimeout = 3,
  HttpServiceConfigUrlAclInfo = 2,
}

export enum HTTP_SERVICE_CONFIG_QUERY_TYPE {
  HttpServiceConfigQueryExact = 0,
  HttpServiceConfigQueryMax = 2,
  HttpServiceConfigQueryNext = 1,
}

export enum HTTP_SERVICE_CONFIG_TIMEOUT_KEY {
  HeaderWaitTimeout = 1,
  IdleConnectionTimeout = 0,
}

export enum HTTP_URL_FLAG {
  HTTP_URL_FLAG_REMOVE_ALL = 0x0000_0001,
}

export enum HTTP_VERB {
  HttpVerbCONNECT = 10,
  HttpVerbCOPY = 13,
  HttpVerbDELETE = 8,
  HttpVerbGET = 4,
  HttpVerbHEAD = 5,
  HttpVerbInvalid = 2,
  HttpVerbLOCK = 17,
  HttpVerbMKCOL = 16,
  HttpVerbMOVE = 12,
  HttpVerbMaximum = 20,
  HttpVerbOPTIONS = 3,
  HttpVerbPOST = 6,
  HttpVerbPROPFIND = 14,
  HttpVerbPROPPATCH = 15,
  HttpVerbPUT = 7,
  HttpVerbSEARCH = 19,
  HttpVerbTRACE = 9,
  HttpVerbTRACK = 11,
  HttpVerbUNLOCK = 18,
  HttpVerbUnknown = 1,
  HttpVerbUnparsed = 0,
}

export type HTTP_CONNECTION_ID = bigint;
export type HTTP_OPAQUE_ID = bigint;
export type HTTP_RAW_CONNECTION_ID = bigint;
export type HTTP_REQUEST_ID = bigint;
export type HTTP_SERVER_SESSION_ID = bigint;
export type HTTP_URL_CONTEXT = bigint;
export type HTTP_URL_GROUP_ID = bigint;
export type HTTPAPI_VERSION = number;
export type LPOVERLAPPED = Pointer;
export type PCSTR = Pointer;
export type PCWSTR = Pointer;
export type PHTTP_BYTE_RANGE = Pointer;
export type PHTTP_CACHE_POLICY = Pointer;
export type PHTTP_DATA_CHUNK = Pointer;
export type PHTTP_DELEGATE_REQUEST_PROPERTY_INFO = Pointer;
export type PHTTP_LOG_DATA = Pointer;
export type PHTTP_REQUEST = Pointer;
export type PHTTP_REQUEST_HEADERS = Pointer;
export type PHTTP_RESPONSE = Pointer;
export type PHTTP_SERVER_SESSION_ID = Pointer;
export type PHTTP_SSL_CLIENT_CERT_INFO = Pointer;
export type PHTTP_URL_GROUP_ID = Pointer;

const _versionBuffer = Buffer.alloc(4);

/** Pack an `HTTPAPI_VERSION` for by-value passing in the x64 ABI (major in low 16 bits, minor in high 16 bits). */
export function packHTTPAPI_VERSION(major: number, minor: number): HTTPAPI_VERSION {
  _versionBuffer.writeUInt16LE(major, 0);
  _versionBuffer.writeUInt16LE(minor, 2);
  return _versionBuffer.readUInt32LE(0);
}
