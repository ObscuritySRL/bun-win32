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
  public static HttpAddFragmentToCache(RequestQueueHandle: HANDLE, UrlPrefix: PCWSTR, DataChunk: PHTTP_DATA_CHUNK, CachePolicy: PHTTP_CACHE_POLICY, Overlapped: LPOVERLAPPED | NULL): ULONG {
    return Httpapi.Load('HttpAddFragmentToCache')(RequestQueueHandle, UrlPrefix, DataChunk, CachePolicy, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpaddurl
  public static HttpAddUrl(RequestQueueHandle: HANDLE, FullyQualifiedUrl: PCWSTR, Reserved: PVOID | NULL): ULONG {
    return Httpapi.Load('HttpAddUrl')(RequestQueueHandle, FullyQualifiedUrl, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpaddurltourlgroup
  public static HttpAddUrlToUrlGroup(UrlGroupId: HTTP_URL_GROUP_ID, pFullyQualifiedUrl: PCWSTR, UrlContext: HTTP_URL_CONTEXT | 0n, Reserved: ULONG): ULONG {
    return Httpapi.Load('HttpAddUrlToUrlGroup')(UrlGroupId, pFullyQualifiedUrl, UrlContext, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpcancelhttprequest
  public static HttpCancelHttpRequest(RequestQueueHandle: HANDLE, RequestId: HTTP_REQUEST_ID, Overlapped: LPOVERLAPPED | NULL): ULONG {
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
  public static HttpCreateHttpHandle(RequestQueueHandle: PHANDLE, Reserved: ULONG): ULONG {
    return Httpapi.Load('HttpCreateHttpHandle')(RequestQueueHandle, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpcreaterequestqueue
  public static HttpCreateRequestQueue(Version: HTTPAPI_VERSION, Name: PCWSTR | NULL, SecurityAttributes: LPSECURITY_ATTRIBUTES | NULL, Flags: ULONG, RequestQueueHandle: PHANDLE): ULONG {
    return Httpapi.Load('HttpCreateRequestQueue')(Version, Name, SecurityAttributes, Flags, RequestQueueHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpcreateserversession
  public static HttpCreateServerSession(Version: HTTPAPI_VERSION, ServerSessionId: PHTTP_SERVER_SESSION_ID, Reserved: ULONG): ULONG {
    return Httpapi.Load('HttpCreateServerSession')(Version, ServerSessionId, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpcreateurlgroup
  public static HttpCreateUrlGroup(ServerSessionId: HTTP_SERVER_SESSION_ID, pUrlGroupId: PHTTP_URL_GROUP_ID, Reserved: ULONG): ULONG {
    return Httpapi.Load('HttpCreateUrlGroup')(ServerSessionId, pUrlGroupId, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpdeclarepush
  public static HttpDeclarePush(RequestQueueHandle: HANDLE, RequestId: HTTP_REQUEST_ID, Verb: HTTP_VERB, Path: PCWSTR, Query: LPCSTR | NULL, Headers: PHTTP_REQUEST_HEADERS | NULL): ULONG {
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
  public static HttpDeleteServiceConfiguration(ServiceHandle: HANDLE | 0n, ConfigId: HTTP_SERVICE_CONFIG_ID, pConfigInformation: PVOID, ConfigInformationLength: ULONG, pOverlapped: LPOVERLAPPED | NULL): ULONG {
    return Httpapi.Load('HttpDeleteServiceConfiguration')(ServiceHandle, ConfigId, pConfigInformation, ConfigInformationLength, pOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpfindurlgroupid
  public static HttpFindUrlGroupId(FullyQualifiedUrl: PCWSTR, RequestQueueHandle: HANDLE, UrlGroupId: PHTTP_URL_GROUP_ID): ULONG {
    return Httpapi.Load('HttpFindUrlGroupId')(FullyQualifiedUrl, RequestQueueHandle, UrlGroupId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpflushresponsecache
  public static HttpFlushResponseCache(RequestQueueHandle: HANDLE, UrlPrefix: PCWSTR, Flags: ULONG, Overlapped: LPOVERLAPPED | NULL): ULONG {
    return Httpapi.Load('HttpFlushResponseCache')(RequestQueueHandle, UrlPrefix, Flags, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpinitialize
  public static HttpInitialize(Version: HTTPAPI_VERSION, Flags: ULONG, pReserved: PVOID | NULL): ULONG {
    return Httpapi.Load('HttpInitialize')(Version, Flags, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpisfeaturesupported
  public static HttpIsFeatureSupported(FeatureId: HTTP_FEATURE_ID): BOOL {
    return Httpapi.Load('HttpIsFeatureSupported')(FeatureId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpprepareurl
  public static HttpPrepareUrl(Reserved: PVOID | NULL, Flags: ULONG, Url: PCWSTR, PreparedUrl: PVOID): ULONG {
    return Httpapi.Load('HttpPrepareUrl')(Reserved, Flags, Url, PreparedUrl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpqueryrequestqueueproperty
  public static HttpQueryRequestQueueProperty(
    RequestQueueHandle: HANDLE,
    Property: HTTP_SERVER_PROPERTY,
    PropertyInformation: PVOID | NULL,
    PropertyInformationLength: ULONG,
    Reserved1: ULONG,
    ReturnLength: PULONG | NULL,
    Reserved2: PVOID | NULL,
  ): ULONG {
    return Httpapi.Load('HttpQueryRequestQueueProperty')(RequestQueueHandle, Property, PropertyInformation, PropertyInformationLength, Reserved1, ReturnLength, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpqueryserversessionproperty
  public static HttpQueryServerSessionProperty(ServerSessionId: HTTP_SERVER_SESSION_ID, Property: HTTP_SERVER_PROPERTY, PropertyInformation: PVOID | NULL, PropertyInformationLength: ULONG, ReturnLength: PULONG | NULL): ULONG {
    return Httpapi.Load('HttpQueryServerSessionProperty')(ServerSessionId, Property, PropertyInformation, PropertyInformationLength, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpqueryserviceconfiguration
  public static HttpQueryServiceConfiguration(
    ServiceHandle: HANDLE | 0n,
    ConfigId: HTTP_SERVICE_CONFIG_ID,
    pInput: PVOID | NULL,
    InputLength: ULONG,
    pOutput: PVOID | NULL,
    OutputLength: ULONG,
    pReturnLength: PULONG | NULL,
    pOverlapped: LPOVERLAPPED | NULL,
  ): ULONG {
    return Httpapi.Load('HttpQueryServiceConfiguration')(ServiceHandle, ConfigId, pInput, InputLength, pOutput, OutputLength, pReturnLength, pOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpqueryurlgroupproperty
  public static HttpQueryUrlGroupProperty(UrlGroupId: HTTP_URL_GROUP_ID, Property: HTTP_SERVER_PROPERTY, PropertyInformation: PVOID | NULL, PropertyInformationLength: ULONG, ReturnLength: PULONG | NULL): ULONG {
    return Httpapi.Load('HttpQueryUrlGroupProperty')(UrlGroupId, Property, PropertyInformation, PropertyInformationLength, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpreadfragmentfromcache
  public static HttpReadFragmentFromCache(RequestQueueHandle: HANDLE, UrlPrefix: PCWSTR, ByteRange: PHTTP_BYTE_RANGE | NULL, Buffer: PVOID, BufferLength: ULONG, BytesRead: PULONG | NULL, Overlapped: LPOVERLAPPED | NULL): ULONG {
    return Httpapi.Load('HttpReadFragmentFromCache')(RequestQueueHandle, UrlPrefix, ByteRange, Buffer, BufferLength, BytesRead, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpreceiveclientcertificate
  public static HttpReceiveClientCertificate(
    RequestQueueHandle: HANDLE,
    ConnectionId: HTTP_CONNECTION_ID,
    Flags: ULONG,
    SslClientCertInfo: PHTTP_SSL_CLIENT_CERT_INFO,
    SslClientCertInfoSize: ULONG,
    BytesReceived: PULONG | NULL,
    Overlapped: LPOVERLAPPED | NULL,
  ): ULONG {
    return Httpapi.Load('HttpReceiveClientCertificate')(RequestQueueHandle, ConnectionId, Flags, SslClientCertInfo, SslClientCertInfoSize, BytesReceived, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpreceivehttprequest
  public static HttpReceiveHttpRequest(RequestQueueHandle: HANDLE, RequestId: HTTP_REQUEST_ID, Flags: ULONG, RequestBuffer: PHTTP_REQUEST, RequestBufferLength: ULONG, BytesReturned: PULONG | NULL, Overlapped: LPOVERLAPPED | NULL): ULONG {
    return Httpapi.Load('HttpReceiveHttpRequest')(RequestQueueHandle, RequestId, Flags, RequestBuffer, RequestBufferLength, BytesReturned, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpreceiverequestentitybody
  public static HttpReceiveRequestEntityBody(RequestQueueHandle: HANDLE, RequestId: HTTP_REQUEST_ID, Flags: ULONG, EntityBuffer: PVOID, EntityBufferLength: ULONG, BytesReturned: PULONG | NULL, Overlapped: LPOVERLAPPED | NULL): ULONG {
    return Httpapi.Load('HttpReceiveRequestEntityBody')(RequestQueueHandle, RequestId, Flags, EntityBuffer, EntityBufferLength, BytesReturned, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpremoveurl
  public static HttpRemoveUrl(RequestQueueHandle: HANDLE, FullyQualifiedUrl: PCWSTR): ULONG {
    return Httpapi.Load('HttpRemoveUrl')(RequestQueueHandle, FullyQualifiedUrl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpremoveurlfromurlgroup
  public static HttpRemoveUrlFromUrlGroup(UrlGroupId: HTTP_URL_GROUP_ID, pFullyQualifiedUrl: PCWSTR | NULL, Flags: ULONG): ULONG {
    return Httpapi.Load('HttpRemoveUrlFromUrlGroup')(UrlGroupId, pFullyQualifiedUrl, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpsendhttpresponse
  public static HttpSendHttpResponse(
    RequestQueueHandle: HANDLE,
    RequestId: HTTP_REQUEST_ID,
    Flags: ULONG,
    HttpResponse: PHTTP_RESPONSE,
    CachePolicy: PHTTP_CACHE_POLICY | NULL,
    BytesSent: PULONG | NULL,
    Reserved1: PVOID | NULL,
    Reserved2: ULONG,
    Overlapped: LPOVERLAPPED | NULL,
    LogData: PHTTP_LOG_DATA | NULL,
  ): ULONG {
    return Httpapi.Load('HttpSendHttpResponse')(RequestQueueHandle, RequestId, Flags, HttpResponse, CachePolicy, BytesSent, Reserved1, Reserved2, Overlapped, LogData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpsendresponseentitybody
  public static HttpSendResponseEntityBody(
    RequestQueueHandle: HANDLE,
    RequestId: HTTP_REQUEST_ID,
    Flags: ULONG,
    EntityChunkCount: USHORT,
    EntityChunks: PHTTP_DATA_CHUNK | NULL,
    BytesSent: PULONG | NULL,
    Reserved1: PVOID | NULL,
    Reserved2: ULONG,
    Overlapped: LPOVERLAPPED | NULL,
    LogData: PHTTP_LOG_DATA | NULL,
  ): ULONG {
    return Httpapi.Load('HttpSendResponseEntityBody')(RequestQueueHandle, RequestId, Flags, EntityChunkCount, EntityChunks, BytesSent, Reserved1, Reserved2, Overlapped, LogData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpsetrequestproperty
  public static HttpSetRequestProperty(RequestQueueHandle: HANDLE, Id: HTTP_OPAQUE_ID, PropertyId: HTTP_REQUEST_PROPERTY, Input: PVOID | NULL, InputPropertySize: ULONG, Overlapped: LPOVERLAPPED): ULONG {
    return Httpapi.Load('HttpSetRequestProperty')(RequestQueueHandle, Id, PropertyId, Input, InputPropertySize, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpsetrequestqueueproperty
  public static HttpSetRequestQueueProperty(RequestQueueHandle: HANDLE, Property: HTTP_SERVER_PROPERTY, PropertyInformation: PVOID, PropertyInformationLength: ULONG, Reserved1: ULONG, Reserved2: PVOID | NULL): ULONG {
    return Httpapi.Load('HttpSetRequestQueueProperty')(RequestQueueHandle, Property, PropertyInformation, PropertyInformationLength, Reserved1, Reserved2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpsetserversessionproperty
  public static HttpSetServerSessionProperty(ServerSessionId: HTTP_SERVER_SESSION_ID, Property: HTTP_SERVER_PROPERTY, PropertyInformation: PVOID, PropertyInformationLength: ULONG): ULONG {
    return Httpapi.Load('HttpSetServerSessionProperty')(ServerSessionId, Property, PropertyInformation, PropertyInformationLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpsetserviceconfiguration
  public static HttpSetServiceConfiguration(ServiceHandle: HANDLE | 0n, ConfigId: HTTP_SERVICE_CONFIG_ID, pConfigInformation: PVOID, ConfigInformationLength: ULONG, pOverlapped: LPOVERLAPPED | NULL): ULONG {
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
  public static HttpTerminate(Flags: ULONG, pReserved: PVOID | NULL): ULONG {
    return Httpapi.Load('HttpTerminate')(Flags, pReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpupdateserviceconfiguration
  public static HttpUpdateServiceConfiguration(Handle: HANDLE | 0n, ConfigId: HTTP_SERVICE_CONFIG_ID, ConfigInfo: PVOID, ConfigInfoLength: ULONG, Overlapped: LPOVERLAPPED | NULL): ULONG {
    return Httpapi.Load('HttpUpdateServiceConfiguration')(Handle, ConfigId, ConfigInfo, ConfigInfoLength, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpwaitfordemandstart
  public static HttpWaitForDemandStart(RequestQueueHandle: HANDLE, Overlapped: LPOVERLAPPED | NULL): ULONG {
    return Httpapi.Load('HttpWaitForDemandStart')(RequestQueueHandle, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpwaitfordisconnect
  public static HttpWaitForDisconnect(RequestQueueHandle: HANDLE, ConnectionId: HTTP_CONNECTION_ID, Overlapped: LPOVERLAPPED | NULL): ULONG {
    return Httpapi.Load('HttpWaitForDisconnect')(RequestQueueHandle, ConnectionId, Overlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/http/nf-http-httpwaitfordisconnectex
  public static HttpWaitForDisconnectEx(RequestQueueHandle: HANDLE, ConnectionId: HTTP_CONNECTION_ID, Reserved: ULONG, Overlapped: LPOVERLAPPED | NULL): ULONG {
    return Httpapi.Load('HttpWaitForDisconnectEx')(RequestQueueHandle, ConnectionId, Reserved, Overlapped);
  }
}

export default Httpapi;
