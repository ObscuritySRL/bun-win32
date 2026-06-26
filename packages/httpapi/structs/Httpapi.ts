import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  HANDLE,
  HTTP_CONNECTION_ID,
  HTTP_FEATURE_ID,
  HTTP_OPAQUE_ID,
  HTTP_REQUEST_ID,
  HTTP_REQUEST_PROPERTY,
  HTTP_SERVER_PROPERTY,
  HTTP_SERVER_SESSION_ID,
  HTTP_SERVICE_CONFIG_ID,
  HTTP_URL_CONTEXT,
  HTTP_URL_GROUP_ID,
  HTTP_VERB,
  HTTPAPI_VERSION,
  LPCSTR,
  LPCWSTR,
  LPOVERLAPPED,
  LPSECURITY_ATTRIBUTES,
  LPVOID,
  NULL,
  NULLABLE,
  OPTIONAL,
  PCWSTR,
  PHANDLE,
  PHTTP_BYTE_RANGE,
  PHTTP_CACHE_POLICY,
  PHTTP_DATA_CHUNK,
  PHTTP_DELEGATE_REQUEST_PROPERTY_INFO,
  PHTTP_LOG_DATA,
  PHTTP_REQUEST,
  PHTTP_REQUEST_HEADERS,
  PHTTP_RESPONSE,
  PHTTP_SERVER_SESSION_ID,
  PHTTP_SSL_CLIENT_CERT_INFO,
  PHTTP_URL_GROUP_ID,
  PULONG,
  PVOID,
  ULONG,
  USHORT,
} from '../types/Httpapi';

/**
 * Thin, lazy-loaded FFI bindings for `httpapi.dll`.
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
 * import Httpapi from './structs/Httpapi';
 *
 * // Lazy: bind on first call
 * const status = Httpapi.HttpInitialize(HTTPAPI_VERSION_2, HTTP_INITIALIZE_FLAG.HTTP_INITIALIZE_SERVER, null);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Httpapi.Preload(['HttpInitialize', 'HttpReceiveHttpRequest', 'HttpSendHttpResponse']);
 * ```
 */
class Httpapi extends Win32 {
  protected static override name = 'httpapi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    HttpAddFragmentToCache: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    HttpAddUrl: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    HttpAddUrlToUrlGroup: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    HttpCancelHttpRequest: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    HttpCloseRequestQueue: { args: [FFIType.u64], returns: FFIType.u32 },
    HttpCloseServerSession: { args: [FFIType.u64], returns: FFIType.u32 },
    HttpCloseUrlGroup: { args: [FFIType.u64], returns: FFIType.u32 },
    HttpCreateHttpHandle: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    HttpCreateRequestQueue: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    HttpCreateServerSession: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    HttpCreateUrlGroup: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    HttpDeclarePush: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    HttpDelegateRequestEx: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    HttpDeleteServiceConfiguration: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    HttpFindUrlGroupId: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    HttpFlushResponseCache: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    HttpInitialize: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    HttpIsFeatureSupported: { args: [FFIType.i32], returns: FFIType.i32 },
    HttpPrepareUrl: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    HttpQueryRequestQueueProperty: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    HttpQueryServerSessionProperty: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    HttpQueryServiceConfiguration: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    HttpQueryUrlGroupProperty: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    HttpReadFragmentFromCache: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    HttpReceiveClientCertificate: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    HttpReceiveHttpRequest: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    HttpReceiveRequestEntityBody: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    HttpRemoveUrl: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    HttpRemoveUrlFromUrlGroup: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    HttpSendHttpResponse: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    HttpSendResponseEntityBody: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    HttpSetRequestProperty: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    HttpSetRequestQueueProperty: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    HttpSetServerSessionProperty: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    HttpSetServiceConfiguration: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    HttpSetUrlGroupProperty: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    HttpShutdownRequestQueue: { args: [FFIType.u64], returns: FFIType.u32 },
    HttpTerminate: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    HttpUpdateServiceConfiguration: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    HttpWaitForDemandStart: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    HttpWaitForDisconnect: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    HttpWaitForDisconnectEx: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpaddfragmenttocache
  public static HttpAddFragmentToCache(RequestQueueHandle: HANDLE, UrlPrefix: PCWSTR, DataChunk: PHTTP_DATA_CHUNK, CachePolicy: PHTTP_CACHE_POLICY, Overlapped: OPTIONAL<LPOVERLAPPED>): ULONG {
    return Httpapi.Load('HttpAddFragmentToCache')(RequestQueueHandle, UrlPrefix, DataChunk, CachePolicy, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpaddurl
  public static HttpAddUrl(RequestQueueHandle: HANDLE, FullyQualifiedUrl: PCWSTR, Reserved: NULL): ULONG {
    return Httpapi.Load('HttpAddUrl')(RequestQueueHandle, FullyQualifiedUrl, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpaddurltourlgroup
  public static HttpAddUrlToUrlGroup(UrlGroupId: HTTP_URL_GROUP_ID, pFullyQualifiedUrl: PCWSTR, UrlContext: OPTIONAL<HTTP_URL_CONTEXT>, Reserved: ULONG): ULONG {
    return Httpapi.Load('HttpAddUrlToUrlGroup')(UrlGroupId, pFullyQualifiedUrl, UrlContext, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpcancelhttprequest
  public static HttpCancelHttpRequest(RequestQueueHandle: HANDLE, RequestId: HTTP_REQUEST_ID, Overlapped: OPTIONAL<LPOVERLAPPED>): ULONG {
    return Httpapi.Load('HttpCancelHttpRequest')(RequestQueueHandle, RequestId, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpcloserequestqueue
  public static HttpCloseRequestQueue(RequestQueueHandle: HANDLE): ULONG {
    return Httpapi.Load('HttpCloseRequestQueue')(RequestQueueHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpcloseserversession
  public static HttpCloseServerSession(ServerSessionId: HTTP_SERVER_SESSION_ID): ULONG {
    return Httpapi.Load('HttpCloseServerSession')(ServerSessionId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpcloseurlgroup
  public static HttpCloseUrlGroup(UrlGroupId: HTTP_URL_GROUP_ID): ULONG {
    return Httpapi.Load('HttpCloseUrlGroup')(UrlGroupId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpcreatehttphandle
  public static HttpCreateHttpHandle(RequestQueueHandle_out: PHANDLE, Reserved: ULONG): ULONG {
    return Httpapi.Load('HttpCreateHttpHandle')(RequestQueueHandle_out, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpcreaterequestqueue
  public static HttpCreateRequestQueue(Version: HTTPAPI_VERSION, Name: OPTIONAL<PCWSTR>, SecurityAttributes: OPTIONAL<LPSECURITY_ATTRIBUTES>, Flags: ULONG, RequestQueueHandle_out: PHANDLE): ULONG {
    return Httpapi.Load('HttpCreateRequestQueue')(Version, Name, SecurityAttributes, Flags, RequestQueueHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpcreateserversession
  public static HttpCreateServerSession(Version: HTTPAPI_VERSION, ServerSessionId_out: PHTTP_SERVER_SESSION_ID, Reserved: ULONG): ULONG {
    return Httpapi.Load('HttpCreateServerSession')(Version, ServerSessionId_out, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpcreateurlgroup
  public static HttpCreateUrlGroup(ServerSessionId: HTTP_SERVER_SESSION_ID, pUrlGroupId_out: PHTTP_URL_GROUP_ID, Reserved: ULONG): ULONG {
    return Httpapi.Load('HttpCreateUrlGroup')(ServerSessionId, pUrlGroupId_out, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpdeclarepush
  public static HttpDeclarePush(RequestQueueHandle: HANDLE, RequestId: HTTP_REQUEST_ID, Verb: HTTP_VERB, Path: PCWSTR, Query: OPTIONAL<LPCSTR>, Headers: OPTIONAL<PHTTP_REQUEST_HEADERS>): ULONG {
    return Httpapi.Load('HttpDeclarePush')(RequestQueueHandle, RequestId, Verb, Path, Query, Headers);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpdelegaterequestex
  public static HttpDelegateRequestEx(
    RequestQueueHandle: HANDLE,
    DelegateQueueHandle: HANDLE,
    RequestId: HTTP_REQUEST_ID,
    DelegateUrlGroupId: HTTP_URL_GROUP_ID,
    PropertyInfoSetSize: ULONG,
    PropertyInfoSet: PHTTP_DELEGATE_REQUEST_PROPERTY_INFO,
  ): ULONG {
    return Httpapi.Load('HttpDelegateRequestEx')(RequestQueueHandle, DelegateQueueHandle, RequestId, DelegateUrlGroupId, PropertyInfoSetSize, PropertyInfoSet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpdeleteserviceconfiguration
  public static HttpDeleteServiceConfiguration(ServiceHandle: 0n, ConfigId: HTTP_SERVICE_CONFIG_ID, pConfigInformation: PVOID, ConfigInformationLength: ULONG, pOverlapped: NULL): ULONG {
    return Httpapi.Load('HttpDeleteServiceConfiguration')(ServiceHandle, ConfigId, pConfigInformation, ConfigInformationLength, pOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpfindurlgroupid
  public static HttpFindUrlGroupId(FullyQualifiedUrl: PCWSTR, RequestQueueHandle: HANDLE, UrlGroupId_out: PHTTP_URL_GROUP_ID): ULONG {
    return Httpapi.Load('HttpFindUrlGroupId')(FullyQualifiedUrl, RequestQueueHandle, UrlGroupId_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpflushresponsecache
  public static HttpFlushResponseCache(RequestQueueHandle: HANDLE, UrlPrefix: PCWSTR, Flags: ULONG, Overlapped: OPTIONAL<LPOVERLAPPED>): ULONG {
    return Httpapi.Load('HttpFlushResponseCache')(RequestQueueHandle, UrlPrefix, Flags, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpinitialize
  public static HttpInitialize(Version: HTTPAPI_VERSION, Flags: ULONG, pReserved_in_out: NULL): ULONG {
    return Httpapi.Load('HttpInitialize')(Version, Flags, pReserved_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpisfeaturesupported
  public static HttpIsFeatureSupported(FeatureId: HTTP_FEATURE_ID): BOOL {
    return Httpapi.Load('HttpIsFeatureSupported')(FeatureId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpprepareurl
  public static HttpPrepareUrl(Reserved: NULL, Flags: ULONG, Url: PCWSTR, PreparedUrl_out: PVOID): ULONG {
    return Httpapi.Load('HttpPrepareUrl')(Reserved, Flags, Url, PreparedUrl_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpqueryrequestqueueproperty
  public static HttpQueryRequestQueueProperty(
    RequestQueueHandle: HANDLE,
    Property: HTTP_SERVER_PROPERTY,
    PropertyInformation_out: OPTIONAL<PVOID>,
    PropertyInformationLength: ULONG,
    Reserved1: ULONG,
    ReturnLength_out: OPTIONAL<PULONG>,
    Reserved2: NULL,
  ): ULONG {
    return Httpapi.Load('HttpQueryRequestQueueProperty')(RequestQueueHandle, Property, PropertyInformation_out, PropertyInformationLength, Reserved1, ReturnLength_out, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpqueryserversessionproperty
  public static HttpQueryServerSessionProperty(ServerSessionId: HTTP_SERVER_SESSION_ID, Property: HTTP_SERVER_PROPERTY, PropertyInformation_out: OPTIONAL<PVOID>, PropertyInformationLength: ULONG, ReturnLength_out: OPTIONAL<PULONG>): ULONG {
    return Httpapi.Load('HttpQueryServerSessionProperty')(ServerSessionId, Property, PropertyInformation_out, PropertyInformationLength, ReturnLength_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpqueryserviceconfiguration
  public static HttpQueryServiceConfiguration(
    ServiceHandle: 0n,
    ConfigId: HTTP_SERVICE_CONFIG_ID,
    pInput: OPTIONAL<PVOID>,
    InputLength: ULONG,
    pOutput_out: OPTIONAL<PVOID>,
    OutputLength: ULONG,
    pReturnLength_out: OPTIONAL<PULONG>,
    pOverlapped: NULL,
  ): ULONG {
    return Httpapi.Load('HttpQueryServiceConfiguration')(ServiceHandle, ConfigId, pInput, InputLength, pOutput_out, OutputLength, pReturnLength_out, pOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpqueryurlgroupproperty
  public static HttpQueryUrlGroupProperty(UrlGroupId: HTTP_URL_GROUP_ID, Property: HTTP_SERVER_PROPERTY, PropertyInformation_out: OPTIONAL<PVOID>, PropertyInformationLength: ULONG, ReturnLength_out: OPTIONAL<PULONG>): ULONG {
    return Httpapi.Load('HttpQueryUrlGroupProperty')(UrlGroupId, Property, PropertyInformation_out, PropertyInformationLength, ReturnLength_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpreadfragmentfromcache
  public static HttpReadFragmentFromCache(
    RequestQueueHandle: HANDLE,
    UrlPrefix: PCWSTR,
    ByteRange: OPTIONAL<PHTTP_BYTE_RANGE>,
    Buffer_out: PVOID,
    BufferLength: ULONG,
    BytesRead_out: OPTIONAL<PULONG>,
    Overlapped: OPTIONAL<LPOVERLAPPED>,
  ): ULONG {
    return Httpapi.Load('HttpReadFragmentFromCache')(RequestQueueHandle, UrlPrefix, ByteRange, Buffer_out, BufferLength, BytesRead_out, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpreceiveclientcertificate
  public static HttpReceiveClientCertificate(
    RequestQueueHandle: HANDLE,
    ConnectionId: HTTP_CONNECTION_ID,
    Flags: ULONG,
    SslClientCertInfo_out: PHTTP_SSL_CLIENT_CERT_INFO,
    SslClientCertInfoSize: ULONG,
    BytesReceived_out: OPTIONAL<PULONG>,
    Overlapped: OPTIONAL<LPOVERLAPPED>,
  ): ULONG {
    return Httpapi.Load('HttpReceiveClientCertificate')(RequestQueueHandle, ConnectionId, Flags, SslClientCertInfo_out, SslClientCertInfoSize, BytesReceived_out, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpreceivehttprequest
  public static HttpReceiveHttpRequest(
    RequestQueueHandle: HANDLE,
    RequestId: HTTP_REQUEST_ID,
    Flags: ULONG,
    RequestBuffer_out: PHTTP_REQUEST,
    RequestBufferLength: ULONG,
    BytesReturned_out: OPTIONAL<PULONG>,
    Overlapped: OPTIONAL<LPOVERLAPPED>,
  ): ULONG {
    return Httpapi.Load('HttpReceiveHttpRequest')(RequestQueueHandle, RequestId, Flags, RequestBuffer_out, RequestBufferLength, BytesReturned_out, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpreceiverequestentitybody
  public static HttpReceiveRequestEntityBody(
    RequestQueueHandle: HANDLE,
    RequestId: HTTP_REQUEST_ID,
    Flags: ULONG,
    EntityBuffer_out: PVOID,
    EntityBufferLength: ULONG,
    BytesReturned_out: OPTIONAL<PULONG>,
    Overlapped: OPTIONAL<LPOVERLAPPED>,
  ): ULONG {
    return Httpapi.Load('HttpReceiveRequestEntityBody')(RequestQueueHandle, RequestId, Flags, EntityBuffer_out, EntityBufferLength, BytesReturned_out, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpremoveurl
  public static HttpRemoveUrl(RequestQueueHandle: HANDLE, FullyQualifiedUrl: PCWSTR): ULONG {
    return Httpapi.Load('HttpRemoveUrl')(RequestQueueHandle, FullyQualifiedUrl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpremoveurlfromurlgroup
  public static HttpRemoveUrlFromUrlGroup(UrlGroupId: HTTP_URL_GROUP_ID, pFullyQualifiedUrl: NULLABLE<PCWSTR>, Flags: ULONG): ULONG {
    return Httpapi.Load('HttpRemoveUrlFromUrlGroup')(UrlGroupId, pFullyQualifiedUrl, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpsendhttpresponse
  public static HttpSendHttpResponse(
    RequestQueueHandle: HANDLE,
    RequestId: HTTP_REQUEST_ID,
    Flags: ULONG,
    HttpResponse: PHTTP_RESPONSE,
    CachePolicy: OPTIONAL<PHTTP_CACHE_POLICY>,
    BytesSent_out: OPTIONAL<PULONG>,
    Reserved1: NULL,
    Reserved2: ULONG,
    Overlapped: OPTIONAL<LPOVERLAPPED>,
    LogData: OPTIONAL<PHTTP_LOG_DATA>,
  ): ULONG {
    return Httpapi.Load('HttpSendHttpResponse')(RequestQueueHandle, RequestId, Flags, HttpResponse, CachePolicy, BytesSent_out, Reserved1, Reserved2, Overlapped, LogData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpsendresponseentitybody
  public static HttpSendResponseEntityBody(
    RequestQueueHandle: HANDLE,
    RequestId: HTTP_REQUEST_ID,
    Flags: ULONG,
    EntityChunkCount: USHORT,
    EntityChunks: OPTIONAL<PHTTP_DATA_CHUNK>,
    BytesSent_out: OPTIONAL<PULONG>,
    Reserved1: NULL,
    Reserved2: ULONG,
    Overlapped: OPTIONAL<LPOVERLAPPED>,
    LogData: OPTIONAL<PHTTP_LOG_DATA>,
  ): ULONG {
    return Httpapi.Load('HttpSendResponseEntityBody')(RequestQueueHandle, RequestId, Flags, EntityChunkCount, EntityChunks, BytesSent_out, Reserved1, Reserved2, Overlapped, LogData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpsetrequestproperty
  public static HttpSetRequestProperty(RequestQueueHandle: HANDLE, Id: HTTP_OPAQUE_ID, PropertyId: HTTP_REQUEST_PROPERTY, Input: OPTIONAL<PVOID>, InputPropertySize: ULONG, Overlapped: LPOVERLAPPED): ULONG {
    return Httpapi.Load('HttpSetRequestProperty')(RequestQueueHandle, Id, PropertyId, Input, InputPropertySize, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpsetrequestqueueproperty
  public static HttpSetRequestQueueProperty(RequestQueueHandle: HANDLE, Property: HTTP_SERVER_PROPERTY, PropertyInformation: PVOID, PropertyInformationLength: ULONG, Reserved1: ULONG, Reserved2: NULL): ULONG {
    return Httpapi.Load('HttpSetRequestQueueProperty')(RequestQueueHandle, Property, PropertyInformation, PropertyInformationLength, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpsetserversessionproperty
  public static HttpSetServerSessionProperty(ServerSessionId: HTTP_SERVER_SESSION_ID, Property: HTTP_SERVER_PROPERTY, PropertyInformation: PVOID, PropertyInformationLength: ULONG): ULONG {
    return Httpapi.Load('HttpSetServerSessionProperty')(ServerSessionId, Property, PropertyInformation, PropertyInformationLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpsetserviceconfiguration
  public static HttpSetServiceConfiguration(ServiceHandle: 0n, ConfigId: HTTP_SERVICE_CONFIG_ID, pConfigInformation: PVOID, ConfigInformationLength: ULONG, pOverlapped: NULL): ULONG {
    return Httpapi.Load('HttpSetServiceConfiguration')(ServiceHandle, ConfigId, pConfigInformation, ConfigInformationLength, pOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpseturlgroupproperty
  public static HttpSetUrlGroupProperty(UrlGroupId: HTTP_URL_GROUP_ID, Property: HTTP_SERVER_PROPERTY, PropertyInformation: PVOID, PropertyInformationLength: ULONG): ULONG {
    return Httpapi.Load('HttpSetUrlGroupProperty')(UrlGroupId, Property, PropertyInformation, PropertyInformationLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpshutdownrequestqueue
  public static HttpShutdownRequestQueue(RequestQueueHandle: HANDLE): ULONG {
    return Httpapi.Load('HttpShutdownRequestQueue')(RequestQueueHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpterminate
  public static HttpTerminate(Flags: ULONG, pReserved: NULL): ULONG {
    return Httpapi.Load('HttpTerminate')(Flags, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpupdateserviceconfiguration
  public static HttpUpdateServiceConfiguration(Handle: 0n, ConfigId: HTTP_SERVICE_CONFIG_ID, ConfigInfo: PVOID, ConfigInfoLength: ULONG, Overlapped: NULL): ULONG {
    return Httpapi.Load('HttpUpdateServiceConfiguration')(Handle, ConfigId, ConfigInfo, ConfigInfoLength, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpwaitfordemandstart
  public static HttpWaitForDemandStart(RequestQueueHandle: HANDLE, Overlapped: OPTIONAL<LPOVERLAPPED>): ULONG {
    return Httpapi.Load('HttpWaitForDemandStart')(RequestQueueHandle, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpwaitfordisconnect
  public static HttpWaitForDisconnect(RequestQueueHandle: HANDLE, ConnectionId: HTTP_CONNECTION_ID, Overlapped: OPTIONAL<LPOVERLAPPED>): ULONG {
    return Httpapi.Load('HttpWaitForDisconnect')(RequestQueueHandle, ConnectionId, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpwaitfordisconnectex
  public static HttpWaitForDisconnectEx(RequestQueueHandle: HANDLE, ConnectionId: HTTP_CONNECTION_ID, Reserved: ULONG, Overlapped: OPTIONAL<LPOVERLAPPED>): ULONG {
    return Httpapi.Load('HttpWaitForDisconnectEx')(RequestQueueHandle, ConnectionId, Reserved, Overlapped);
  }
}

export default Httpapi;
