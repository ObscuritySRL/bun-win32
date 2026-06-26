import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  DWORD,
  DWORD_PTR,
  FARPROC,
  GROUP,
  HANDLE,
  HWND,
  INT,
  LPCONDITIONPROC,
  LPCNSPV2_ROUTINE,
  LPBLOB,
  LPCSTR,
  LPCWSTR,
  LPDWORD,
  LPGUID,
  LPHANDLE,
  LPINT,
  LPLOOKUPSERVICE_COMPLETION_ROUTINE,
  LPOVERLAPPED,
  LPQOS,
  LPSOCKADDR,
  LPSTR,
  LPVOID,
  LPWSABUF,
  LPWSACOMPLETION,
  LPWSADATA,
  LPWSAMSG,
  LPWSANAMESPACE_INFOA,
  LPWSANAMESPACE_INFOW,
  LPWSANETWORKEVENTS,
  LPWSAOVERLAPPED,
  LPWSAOVERLAPPED_COMPLETION_ROUTINE,
  LPWSAPOLLFD,
  LPWSAPROTOCOL_INFOA,
  LPWSAPROTOCOL_INFOW,
  LPWSAQUERYSETA,
  LPWSAQUERYSETW,
  LPWSASERVICECLASSINFOA,
  LPWSASERVICECLASSINFOW,
  LPWSTR,
  NULL,
  NULLABLE,
  OPTIONAL,
  PADDRINFOA,
  PADDRINFOEXA,
  PADDRINFOEXW,
  PADDRINFOW,
  PBYTE,
  PHOSTENT,
  PPROTOENT,
  PSERVENT,
  PSOCKET_ADDRESS,
  PSOCKET_ADDRESS_LIST,
  PTIMEVAL,
  PVOID,
  SOCKET,
  UINT,
  ULONG,
  WORD,
  WSAEVENT,
  WSC_PROVIDER_INFO_TYPE,
} from '../types/Ws2_32';

/**
 * Thin, lazy-loaded FFI bindings for `ws2_32.dll`.
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
 * import Ws2_32 from './structs/Ws2_32';
 *
 * // Lazy: bind on first call
 * Ws2_32.WSAStartup(0x0202, wsaData.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Ws2_32.Preload(['WSAStartup', 'socket', 'bind', 'listen', 'accept']);
 * ```
 */
class Ws2_32 extends Win32 {
  protected static override name = 'ws2_32.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    FreeAddrInfoEx: { args: [FFIType.ptr], returns: FFIType.void },
    FreeAddrInfoExW: { args: [FFIType.ptr], returns: FFIType.void },
    FreeAddrInfoW: { args: [FFIType.ptr], returns: FFIType.void },
    GetAddrInfoExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetAddrInfoExCancel: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetAddrInfoExOverlappedResult: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetAddrInfoExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetAddrInfoW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetHostNameW: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetNameInfoW: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    InetNtopW: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.ptr },
    InetPtonW: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetAddrInfoExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetAddrInfoExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WPUCompleteOverlappedRequest: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WSAAccept: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.u64 },
    WSAAddressToStringA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSAAddressToStringW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSAAdvertiseProvider: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSAAsyncGetHostByAddr: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    WSAAsyncGetHostByName: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    WSAAsyncGetProtoByName: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    WSAAsyncGetProtoByNumber: { args: [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    WSAAsyncGetServByName: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    WSAAsyncGetServByPort: { args: [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    WSAAsyncSelect: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    WSACancelAsyncRequest: { args: [FFIType.u64], returns: FFIType.i32 },
    WSACancelBlockingCall: { args: [], returns: FFIType.i32 },
    WSACleanup: { args: [], returns: FFIType.i32 },
    WSACloseEvent: { args: [FFIType.u64], returns: FFIType.i32 },
    WSAConnect: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSAConnectByList: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSAConnectByNameA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSAConnectByNameW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSACreateEvent: { args: [], returns: FFIType.u64 },
    WSADuplicateSocketA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WSADuplicateSocketW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WSAEnumNameSpaceProvidersA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSAEnumNameSpaceProvidersExA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSAEnumNameSpaceProvidersExW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSAEnumNameSpaceProvidersW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSAEnumNetworkEvents: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WSAEnumProtocolsA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSAEnumProtocolsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSAEventSelect: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    WSAGetLastError: { args: [], returns: FFIType.i32 },
    WSAGetOverlappedResult: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    WSAGetQOSByName: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSAGetServiceClassInfoA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSAGetServiceClassInfoW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSAGetServiceClassNameByClassIdA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSAGetServiceClassNameByClassIdW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSAHtonl: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WSAHtons: { args: [FFIType.u64, FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    WSAInstallServiceClassA: { args: [FFIType.ptr], returns: FFIType.i32 },
    WSAInstallServiceClassW: { args: [FFIType.ptr], returns: FFIType.i32 },
    WSAIoctl: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSAIsBlocking: { args: [], returns: FFIType.i32 },
    WSAJoinLeaf: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    WSALookupServiceBeginA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WSALookupServiceBeginW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WSALookupServiceEnd: { args: [FFIType.u64], returns: FFIType.i32 },
    WSALookupServiceNextA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSALookupServiceNextW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSANSPIoctl: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSANtohl: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WSANtohs: { args: [FFIType.u64, FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    WSAPoll: { args: [FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    WSAProviderCompleteAsyncCall: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    WSAProviderConfigChange: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSARecv: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSARecvDisconnect: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WSARecvFrom: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSARemoveServiceClass: { args: [FFIType.ptr], returns: FFIType.i32 },
    WSAResetEvent: { args: [FFIType.u64], returns: FFIType.i32 },
    WSASend: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSASendDisconnect: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WSASendMsg: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSASendTo: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSASetBlockingHook: { args: [FFIType.ptr], returns: FFIType.ptr },
    WSASetEvent: { args: [FFIType.u64], returns: FFIType.i32 },
    WSASetLastError: { args: [FFIType.i32], returns: FFIType.void },
    WSASetServiceA: { args: [FFIType.ptr, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    WSASetServiceW: { args: [FFIType.ptr, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    WSASocketA: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    WSASocketW: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    WSAStartup: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    WSAStringToAddressA: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSAStringToAddressW: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSAUnadvertiseProvider: { args: [FFIType.ptr], returns: FFIType.i32 },
    WSAUnhookBlockingHook: { args: [], returns: FFIType.i32 },
    WSAWaitForMultipleEvents: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.i32], returns: FFIType.u32 },
    WSCDeinstallProvider: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSCDeinstallProvider32: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSCEnableNSProvider: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    WSCEnableNSProvider32: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    WSCEnumNameSpaceProviders32: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSCEnumNameSpaceProvidersEx32: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSCEnumProtocols: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSCEnumProtocols32: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSCGetApplicationCategory: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSCGetProviderInfo: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WSCGetProviderInfo32: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WSCGetProviderPath: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSCGetProviderPath32: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSCInstallNameSpace: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WSCInstallNameSpace32: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WSCInstallNameSpaceEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSCInstallNameSpaceEx32: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSCInstallProvider: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WSCInstallProvider64_32: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WSCInstallProviderAndChains64_32: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSCSetApplicationCategory: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WSCSetProviderInfo: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WSCSetProviderInfo32: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WSCUnInstallNameSpace: { args: [FFIType.ptr], returns: FFIType.i32 },
    WSCUnInstallNameSpace32: { args: [FFIType.ptr], returns: FFIType.i32 },
    WSCUpdateProvider: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WSCUpdateProvider32: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WSCWriteNameSpaceOrder: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WSCWriteNameSpaceOrder32: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WSCWriteProviderOrder: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WSCWriteProviderOrder32: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    accept: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    bind: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    closesocket: { args: [FFIType.u64], returns: FFIType.i32 },
    connect: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    freeaddrinfo: { args: [FFIType.ptr], returns: FFIType.void },
    getaddrinfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    gethostbyaddr: { args: [FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.ptr },
    gethostbyname: { args: [FFIType.ptr], returns: FFIType.ptr },
    gethostname: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    getnameinfo: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    getpeername: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    getprotobyname: { args: [FFIType.ptr], returns: FFIType.ptr },
    getprotobynumber: { args: [FFIType.i32], returns: FFIType.ptr },
    getservbyname: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    getservbyport: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.ptr },
    getsockname: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    getsockopt: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    htonl: { args: [FFIType.u32], returns: FFIType.u32 },
    htons: { args: [FFIType.u16], returns: FFIType.u16 },
    inet_addr: { args: [FFIType.ptr], returns: FFIType.u32 },
    inet_ntoa: { args: [FFIType.u32], returns: FFIType.ptr },
    inet_ntop: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.ptr },
    inet_pton: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ioctlsocket: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    listen: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    ntohl: { args: [FFIType.u32], returns: FFIType.u32 },
    ntohs: { args: [FFIType.u16], returns: FFIType.u16 },
    recv: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    recvfrom: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    select: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    send: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    sendto: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    setsockopt: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    shutdown: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    socket: { args: [FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.u64 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-freeaddrinfoex
  public static FreeAddrInfoEx(pAddrInfoEx: OPTIONAL<PADDRINFOEXA>): void {
    return Ws2_32.Load('FreeAddrInfoEx')(pAddrInfoEx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-freeaddrinfoexw
  public static FreeAddrInfoExW(pAddrInfoEx: OPTIONAL<PADDRINFOEXW>): void {
    return Ws2_32.Load('FreeAddrInfoExW')(pAddrInfoEx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-freeaddrinfow
  public static FreeAddrInfoW(pAddrInfo: OPTIONAL<PADDRINFOW>): void {
    return Ws2_32.Load('FreeAddrInfoW')(pAddrInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-getaddrinfoexa
  public static GetAddrInfoExA(
    pName: OPTIONAL<LPCSTR>,
    pServiceName: OPTIONAL<LPCSTR>,
    dwNameSpace: DWORD,
    lpNspId: OPTIONAL<LPGUID>,
    hints: OPTIONAL<PADDRINFOEXA>,
    ppResult_out: PVOID,
    timeout: OPTIONAL<PTIMEVAL>,
    lpOverlapped: OPTIONAL<LPOVERLAPPED>,
    lpCompletionRoutine: OPTIONAL<LPLOOKUPSERVICE_COMPLETION_ROUTINE>,
    lpNameHandle_out: OPTIONAL<LPHANDLE>,
  ): INT {
    return Ws2_32.Load('GetAddrInfoExA')(pName, pServiceName, dwNameSpace, lpNspId, hints, ppResult_out, timeout, lpOverlapped, lpCompletionRoutine, lpNameHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-getaddrinfoexcancel
  public static GetAddrInfoExCancel(lpHandle: LPHANDLE): INT {
    return Ws2_32.Load('GetAddrInfoExCancel')(lpHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-getaddrinfoexoverlappedresult
  public static GetAddrInfoExOverlappedResult(lpOverlapped: LPOVERLAPPED): INT {
    return Ws2_32.Load('GetAddrInfoExOverlappedResult')(lpOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-getaddrinfoexw
  public static GetAddrInfoExW(
    pName: OPTIONAL<LPCWSTR>,
    pServiceName: OPTIONAL<LPCWSTR>,
    dwNameSpace: DWORD,
    lpNspId: OPTIONAL<LPGUID>,
    hints: OPTIONAL<PADDRINFOEXW>,
    ppResult_out: PVOID,
    timeout: OPTIONAL<PTIMEVAL>,
    lpOverlapped: OPTIONAL<LPOVERLAPPED>,
    lpCompletionRoutine: OPTIONAL<LPLOOKUPSERVICE_COMPLETION_ROUTINE>,
    lpNameHandle_out: OPTIONAL<LPHANDLE>,
  ): INT {
    return Ws2_32.Load('GetAddrInfoExW')(pName, pServiceName, dwNameSpace, lpNspId, hints, ppResult_out, timeout, lpOverlapped, lpCompletionRoutine, lpNameHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-getaddrinfow
  public static GetAddrInfoW(pNodeName: OPTIONAL<LPCWSTR>, pServiceName: OPTIONAL<LPCWSTR>, pHints: OPTIONAL<PADDRINFOW>, ppResult_out: PVOID): INT {
    return Ws2_32.Load('GetAddrInfoW')(pNodeName, pServiceName, pHints, ppResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-gethostnamew
  public static GetHostNameW(name_out: LPWSTR, namelen: INT): INT {
    return Ws2_32.Load('GetHostNameW')(name_out, namelen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-getnameinfow
  public static GetNameInfoW(pSockaddr: LPSOCKADDR, SockaddrLength: INT, pNodeBuffer_out: OPTIONAL<LPWSTR>, NodeBufferSize: DWORD, pServiceBuffer_out: OPTIONAL<LPWSTR>, ServiceBufferSize: DWORD, Flags: INT): INT {
    return Ws2_32.Load('GetNameInfoW')(pSockaddr, SockaddrLength, pNodeBuffer_out, NodeBufferSize, pServiceBuffer_out, ServiceBufferSize, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-inetntopw
  public static InetNtopW(Family: INT, pAddr: PVOID, pStringBuf_out: LPWSTR, StringBufSize: DWORD_PTR): LPCWSTR {
    return Ws2_32.Load('InetNtopW')(Family, pAddr, pStringBuf_out, StringBufSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-inetptonw
  public static InetPtonW(Family: INT, pszAddrString: LPCWSTR, pAddrBuf_out: PVOID): INT {
    return Ws2_32.Load('InetPtonW')(Family, pszAddrString, pAddrBuf_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-setaddrinfoexw
  public static SetAddrInfoExA(
    pName: LPCSTR,
    pServiceName: OPTIONAL<LPCSTR>,
    pAddresses: OPTIONAL<PSOCKET_ADDRESS>,
    dwAddressCount: DWORD,
    lpBlob: OPTIONAL<LPBLOB>,
    dwFlags: DWORD,
    dwNameSpace: DWORD,
    lpNspId: OPTIONAL<LPGUID>,
    timeout: OPTIONAL<PTIMEVAL>,
    lpOverlapped: OPTIONAL<LPOVERLAPPED>,
    lpCompletionRoutine: OPTIONAL<LPLOOKUPSERVICE_COMPLETION_ROUTINE>,
    lpNameHandle_out: OPTIONAL<LPHANDLE>,
  ): INT {
    return Ws2_32.Load('SetAddrInfoExA')(pName, pServiceName, pAddresses, dwAddressCount, lpBlob, dwFlags, dwNameSpace, lpNspId, timeout, lpOverlapped, lpCompletionRoutine, lpNameHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-setaddrinfoexw
  public static SetAddrInfoExW(
    pName: LPCWSTR,
    pServiceName: OPTIONAL<LPCWSTR>,
    pAddresses: OPTIONAL<PSOCKET_ADDRESS>,
    dwAddressCount: DWORD,
    lpBlob: OPTIONAL<LPBLOB>,
    dwFlags: DWORD,
    dwNameSpace: DWORD,
    lpNspId: OPTIONAL<LPGUID>,
    timeout: OPTIONAL<PTIMEVAL>,
    lpOverlapped: OPTIONAL<LPOVERLAPPED>,
    lpCompletionRoutine: OPTIONAL<LPLOOKUPSERVICE_COMPLETION_ROUTINE>,
    lpNameHandle_out: OPTIONAL<LPHANDLE>,
  ): INT {
    return Ws2_32.Load('SetAddrInfoExW')(pName, pServiceName, pAddresses, dwAddressCount, lpBlob, dwFlags, dwNameSpace, lpNspId, timeout, lpOverlapped, lpCompletionRoutine, lpNameHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wpucompleteoverlappedrequest
  public static WPUCompleteOverlappedRequest(s: SOCKET, lpOverlapped_in_out: LPWSAOVERLAPPED, dwError: DWORD, cbTransferred: DWORD, lpErrno_out: LPINT): INT {
    return Ws2_32.Load('WPUCompleteOverlappedRequest')(s, lpOverlapped_in_out, dwError, cbTransferred, lpErrno_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaaccept
  public static WSAAccept(s: SOCKET, addr_out: OPTIONAL<LPSOCKADDR>, addrlen_in_out: OPTIONAL<LPINT>, lpfnCondition: OPTIONAL<LPCONDITIONPROC>, dwCallbackData: DWORD_PTR): SOCKET {
    return Ws2_32.Load('WSAAccept')(s, addr_out, addrlen_in_out, lpfnCondition, dwCallbackData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaaddresstostringa
  public static WSAAddressToStringA(lpsaAddress: LPSOCKADDR, dwAddressLength: DWORD, lpProtocolInfo: OPTIONAL<LPWSAPROTOCOL_INFOA>, lpszAddressString_out: LPSTR, lpdwAddressStringLength_in_out: LPDWORD): INT {
    return Ws2_32.Load('WSAAddressToStringA')(lpsaAddress, dwAddressLength, lpProtocolInfo, lpszAddressString_out, lpdwAddressStringLength_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaaddresstostringw
  public static WSAAddressToStringW(lpsaAddress: LPSOCKADDR, dwAddressLength: DWORD, lpProtocolInfo: OPTIONAL<LPWSAPROTOCOL_INFOW>, lpszAddressString_out: LPWSTR, lpdwAddressStringLength_in_out: LPDWORD): INT {
    return Ws2_32.Load('WSAAddressToStringW')(lpsaAddress, dwAddressLength, lpProtocolInfo, lpszAddressString_out, lpdwAddressStringLength_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wsaadvertiseprovider
  public static WSAAdvertiseProvider(puuidProviderId: LPGUID, pNSPv2Routine: LPCNSPV2_ROUTINE): INT {
    return Ws2_32.Load('WSAAdvertiseProvider')(puuidProviderId, pNSPv2Routine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-wsaasyncgethostbyaddr
  public static WSAAsyncGetHostByAddr(hWnd: HWND, wMsg: UINT, addr: LPCSTR, len: INT, type: INT, buf_out: LPSTR, buflen: INT): HANDLE {
    return Ws2_32.Load('WSAAsyncGetHostByAddr')(hWnd, wMsg, addr, len, type, buf_out, buflen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-wsaasyncgethostbyname
  public static WSAAsyncGetHostByName(hWnd: HWND, wMsg: UINT, name: LPCSTR, buf_out: LPSTR, buflen: INT): HANDLE {
    return Ws2_32.Load('WSAAsyncGetHostByName')(hWnd, wMsg, name, buf_out, buflen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-wsaasyncgetprotobyname
  public static WSAAsyncGetProtoByName(hWnd: HWND, wMsg: UINT, name: LPCSTR, buf_out: LPSTR, buflen: INT): HANDLE {
    return Ws2_32.Load('WSAAsyncGetProtoByName')(hWnd, wMsg, name, buf_out, buflen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-wsaasyncgetprotobynumber
  public static WSAAsyncGetProtoByNumber(hWnd: HWND, wMsg: UINT, number: INT, buf_out: LPSTR, buflen: INT): HANDLE {
    return Ws2_32.Load('WSAAsyncGetProtoByNumber')(hWnd, wMsg, number, buf_out, buflen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-wsaasyncgetservbyname
  public static WSAAsyncGetServByName(hWnd: HWND, wMsg: UINT, name: LPCSTR, proto: LPCSTR, buf_out: LPSTR, buflen: INT): HANDLE {
    return Ws2_32.Load('WSAAsyncGetServByName')(hWnd, wMsg, name, proto, buf_out, buflen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-wsaasyncgetservbyport
  public static WSAAsyncGetServByPort(hWnd: HWND, wMsg: UINT, port: INT, proto: NULLABLE<LPCSTR>, buf_out: LPSTR, buflen: INT): HANDLE {
    return Ws2_32.Load('WSAAsyncGetServByPort')(hWnd, wMsg, port, proto, buf_out, buflen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaasyncselect
  public static WSAAsyncSelect(s: SOCKET, hWnd: HWND, wMsg: UINT, lEvent: INT): INT {
    return Ws2_32.Load('WSAAsyncSelect')(s, hWnd, wMsg, lEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsacancelasyncrequest
  public static WSACancelAsyncRequest(hAsyncTaskHandle: HANDLE): INT {
    return Ws2_32.Load('WSACancelAsyncRequest')(hAsyncTaskHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsacancelblockingcall
  public static WSACancelBlockingCall(): INT {
    return Ws2_32.Load('WSACancelBlockingCall')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsacleanup
  public static WSACleanup(): INT {
    return Ws2_32.Load('WSACleanup')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsacloseevent
  public static WSACloseEvent(hEvent: WSAEVENT): BOOL {
    return Ws2_32.Load('WSACloseEvent')(hEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaconnect
  public static WSAConnect(s: SOCKET, name: LPSOCKADDR, namelen: INT, lpCallerData: OPTIONAL<LPWSABUF>, lpCalleeData_out: OPTIONAL<LPWSABUF>, lpSQOS: OPTIONAL<LPQOS>, lpGQOS: OPTIONAL<LPQOS>): INT {
    return Ws2_32.Load('WSAConnect')(s, name, namelen, lpCallerData, lpCalleeData_out, lpSQOS, lpGQOS);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaconnectbylist
  public static WSAConnectByList(
    s: SOCKET,
    SocketAddress: PSOCKET_ADDRESS_LIST,
    LocalAddressLength_in_out: OPTIONAL<LPDWORD>,
    LocalAddress_out: OPTIONAL<LPSOCKADDR>,
    RemoteAddressLength_in_out: OPTIONAL<LPDWORD>,
    RemoteAddress_out: OPTIONAL<LPSOCKADDR>,
    timeout: OPTIONAL<PTIMEVAL>,
    Reserved: NULL,
  ): BOOL {
    return Ws2_32.Load('WSAConnectByList')(s, SocketAddress, LocalAddressLength_in_out, LocalAddress_out, RemoteAddressLength_in_out, RemoteAddress_out, timeout, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaconnectbynamea
  public static WSAConnectByNameA(
    s: SOCKET,
    nodename: LPCSTR,
    servicename: LPCSTR,
    LocalAddressLength_in_out: OPTIONAL<LPDWORD>,
    LocalAddress_out: OPTIONAL<LPSOCKADDR>,
    RemoteAddressLength_in_out: OPTIONAL<LPDWORD>,
    RemoteAddress_out: OPTIONAL<LPSOCKADDR>,
    timeout: OPTIONAL<PTIMEVAL>,
    Reserved: OPTIONAL<LPWSAOVERLAPPED>,
  ): BOOL {
    return Ws2_32.Load('WSAConnectByNameA')(s, nodename, servicename, LocalAddressLength_in_out, LocalAddress_out, RemoteAddressLength_in_out, RemoteAddress_out, timeout, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaconnectbynamew
  public static WSAConnectByNameW(
    s: SOCKET,
    nodename: LPCWSTR,
    servicename: LPCWSTR,
    LocalAddressLength_in_out: OPTIONAL<LPDWORD>,
    LocalAddress_out: OPTIONAL<LPSOCKADDR>,
    RemoteAddressLength_in_out: OPTIONAL<LPDWORD>,
    RemoteAddress_out: OPTIONAL<LPSOCKADDR>,
    timeout: OPTIONAL<PTIMEVAL>,
    Reserved: OPTIONAL<LPWSAOVERLAPPED>,
  ): BOOL {
    return Ws2_32.Load('WSAConnectByNameW')(s, nodename, servicename, LocalAddressLength_in_out, LocalAddress_out, RemoteAddressLength_in_out, RemoteAddress_out, timeout, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsacreateevent
  public static WSACreateEvent(): WSAEVENT {
    return Ws2_32.Load('WSACreateEvent')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaduplicatesocketa
  public static WSADuplicateSocketA(s: SOCKET, dwProcessId: DWORD, lpProtocolInfo_out: LPWSAPROTOCOL_INFOA): INT {
    return Ws2_32.Load('WSADuplicateSocketA')(s, dwProcessId, lpProtocolInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaduplicatesocketw
  public static WSADuplicateSocketW(s: SOCKET, dwProcessId: DWORD, lpProtocolInfo_out: LPWSAPROTOCOL_INFOW): INT {
    return Ws2_32.Load('WSADuplicateSocketW')(s, dwProcessId, lpProtocolInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaenumnamespaceprovidersa
  public static WSAEnumNameSpaceProvidersA(lpdwBufferLength_in_out: LPDWORD, lpnspBuffer_out: LPWSANAMESPACE_INFOA): INT {
    return Ws2_32.Load('WSAEnumNameSpaceProvidersA')(lpdwBufferLength_in_out, lpnspBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaenumnamespaceprovidersexa
  public static WSAEnumNameSpaceProvidersExA(lpdwBufferLength_in_out: LPDWORD, lpnspBuffer_out: LPVOID): INT {
    return Ws2_32.Load('WSAEnumNameSpaceProvidersExA')(lpdwBufferLength_in_out, lpnspBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaenumnamespaceprovidersexw
  public static WSAEnumNameSpaceProvidersExW(lpdwBufferLength_in_out: LPDWORD, lpnspBuffer_out: LPVOID): INT {
    return Ws2_32.Load('WSAEnumNameSpaceProvidersExW')(lpdwBufferLength_in_out, lpnspBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaenumnamespaceprovidersw
  public static WSAEnumNameSpaceProvidersW(lpdwBufferLength_in_out: LPDWORD, lpnspBuffer_out: LPWSANAMESPACE_INFOW): INT {
    return Ws2_32.Load('WSAEnumNameSpaceProvidersW')(lpdwBufferLength_in_out, lpnspBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaenumnetworkevents
  public static WSAEnumNetworkEvents(s: SOCKET, hEventObject: NULLABLE<WSAEVENT>, lpNetworkEvents_out: LPWSANETWORKEVENTS): INT {
    return Ws2_32.Load('WSAEnumNetworkEvents')(s, hEventObject, lpNetworkEvents_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaenumprotocolsa
  public static WSAEnumProtocolsA(lpiProtocols: OPTIONAL<LPINT>, lpProtocolBuffer_out: OPTIONAL<LPWSAPROTOCOL_INFOA>, lpdwBufferLength_in_out: LPDWORD): INT {
    return Ws2_32.Load('WSAEnumProtocolsA')(lpiProtocols, lpProtocolBuffer_out, lpdwBufferLength_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaenumprotocolsw
  public static WSAEnumProtocolsW(lpiProtocols: OPTIONAL<LPINT>, lpProtocolBuffer_out: OPTIONAL<LPWSAPROTOCOL_INFOW>, lpdwBufferLength_in_out: LPDWORD): INT {
    return Ws2_32.Load('WSAEnumProtocolsW')(lpiProtocols, lpProtocolBuffer_out, lpdwBufferLength_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaeventselect
  public static WSAEventSelect(s: SOCKET, hEventObject: OPTIONAL<WSAEVENT>, lNetworkEvents: INT): INT {
    return Ws2_32.Load('WSAEventSelect')(s, hEventObject, lNetworkEvents);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsagetlasterror
  public static WSAGetLastError(): INT {
    return Ws2_32.Load('WSAGetLastError')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsagetoverlappedresult
  public static WSAGetOverlappedResult(s: SOCKET, lpOverlapped: LPWSAOVERLAPPED, lpcbTransfer_out: LPDWORD, fWait: BOOL, lpdwFlags_out: LPDWORD): BOOL {
    return Ws2_32.Load('WSAGetOverlappedResult')(s, lpOverlapped, lpcbTransfer_out, fWait, lpdwFlags_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsagetqosbyname
  public static WSAGetQOSByName(s: SOCKET, lpQOSName: LPWSABUF, lpQOS_out: LPQOS): BOOL {
    return Ws2_32.Load('WSAGetQOSByName')(s, lpQOSName, lpQOS_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsagetserviceclassinfoa
  public static WSAGetServiceClassInfoA(lpProviderId: LPGUID, lpServiceClassId: LPGUID, lpdwBufSize_in_out: LPDWORD, lpServiceClassInfo_out: LPWSASERVICECLASSINFOA): INT {
    return Ws2_32.Load('WSAGetServiceClassInfoA')(lpProviderId, lpServiceClassId, lpdwBufSize_in_out, lpServiceClassInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsagetserviceclassinfow
  public static WSAGetServiceClassInfoW(lpProviderId: LPGUID, lpServiceClassId: LPGUID, lpdwBufSize_in_out: LPDWORD, lpServiceClassInfo_out: LPWSASERVICECLASSINFOW): INT {
    return Ws2_32.Load('WSAGetServiceClassInfoW')(lpProviderId, lpServiceClassId, lpdwBufSize_in_out, lpServiceClassInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsagetserviceclassnamebyclassida
  public static WSAGetServiceClassNameByClassIdA(lpServiceClassId: LPGUID, lpszServiceClassName_out: LPSTR, lpdwBufferLength_in_out: LPDWORD): INT {
    return Ws2_32.Load('WSAGetServiceClassNameByClassIdA')(lpServiceClassId, lpszServiceClassName_out, lpdwBufferLength_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsagetserviceclassnamebyclassidw
  public static WSAGetServiceClassNameByClassIdW(lpServiceClassId: LPGUID, lpszServiceClassName_out: LPWSTR, lpdwBufferLength_in_out: LPDWORD): INT {
    return Ws2_32.Load('WSAGetServiceClassNameByClassIdW')(lpServiceClassId, lpszServiceClassName_out, lpdwBufferLength_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsahtonl
  public static WSAHtonl(s: SOCKET, hostlong: ULONG, lpnetlong_out: LPDWORD): INT {
    return Ws2_32.Load('WSAHtonl')(s, hostlong, lpnetlong_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsahtons
  public static WSAHtons(s: SOCKET, hostshort: WORD, lpnetshort_out: LPVOID): INT {
    return Ws2_32.Load('WSAHtons')(s, hostshort, lpnetshort_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsainstallserviceclassa
  public static WSAInstallServiceClassA(lpServiceClassInfo: LPWSASERVICECLASSINFOA): INT {
    return Ws2_32.Load('WSAInstallServiceClassA')(lpServiceClassInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsainstallserviceclassw
  public static WSAInstallServiceClassW(lpServiceClassInfo: LPWSASERVICECLASSINFOW): INT {
    return Ws2_32.Load('WSAInstallServiceClassW')(lpServiceClassInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaioctl
  public static WSAIoctl(
    s: SOCKET,
    dwIoControlCode: DWORD,
    lpvInBuffer: OPTIONAL<LPVOID>,
    cbInBuffer: DWORD,
    lpvOutBuffer_out: OPTIONAL<LPVOID>,
    cbOutBuffer: DWORD,
    lpcbBytesReturned_out: LPDWORD,
    lpOverlapped_in_out: OPTIONAL<LPWSAOVERLAPPED>,
    lpCompletionRoutine: OPTIONAL<LPWSAOVERLAPPED_COMPLETION_ROUTINE>,
  ): INT {
    return Ws2_32.Load('WSAIoctl')(s, dwIoControlCode, lpvInBuffer, cbInBuffer, lpvOutBuffer_out, cbOutBuffer, lpcbBytesReturned_out, lpOverlapped_in_out, lpCompletionRoutine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaisblocking
  public static WSAIsBlocking(): BOOL {
    return Ws2_32.Load('WSAIsBlocking')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsajoinleaf
  public static WSAJoinLeaf(s: SOCKET, name: LPSOCKADDR, namelen: INT, lpCallerData: OPTIONAL<LPWSABUF>, lpCalleeData_out: OPTIONAL<LPWSABUF>, lpSQOS: OPTIONAL<LPQOS>, lpGQOS: OPTIONAL<LPQOS>, dwFlags: DWORD): SOCKET {
    return Ws2_32.Load('WSAJoinLeaf')(s, name, namelen, lpCallerData, lpCalleeData_out, lpSQOS, lpGQOS, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsalookupservicebegina
  public static WSALookupServiceBeginA(lpqsRestrictions: LPWSAQUERYSETA, dwControlFlags: DWORD, lphLookup_out: LPHANDLE): INT {
    return Ws2_32.Load('WSALookupServiceBeginA')(lpqsRestrictions, dwControlFlags, lphLookup_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsalookupservicebeginw
  public static WSALookupServiceBeginW(lpqsRestrictions: LPWSAQUERYSETW, dwControlFlags: DWORD, lphLookup_out: LPHANDLE): INT {
    return Ws2_32.Load('WSALookupServiceBeginW')(lpqsRestrictions, dwControlFlags, lphLookup_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsalookupserviceend
  public static WSALookupServiceEnd(hLookup: HANDLE): INT {
    return Ws2_32.Load('WSALookupServiceEnd')(hLookup);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsalookupservicenexta
  public static WSALookupServiceNextA(hLookup: HANDLE, dwControlFlags: DWORD, lpdwBufferLength_in_out: LPDWORD, lpqsResults_out: LPWSAQUERYSETA): INT {
    return Ws2_32.Load('WSALookupServiceNextA')(hLookup, dwControlFlags, lpdwBufferLength_in_out, lpqsResults_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsalookupservicenextw
  public static WSALookupServiceNextW(hLookup: HANDLE, dwControlFlags: DWORD, lpdwBufferLength_in_out: LPDWORD, lpqsResults_out: OPTIONAL<LPWSAQUERYSETW>): INT {
    return Ws2_32.Load('WSALookupServiceNextW')(hLookup, dwControlFlags, lpdwBufferLength_in_out, lpqsResults_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsanspioctl
  public static WSANSPIoctl(
    hLookup: HANDLE,
    dwControlCode: DWORD,
    lpvInBuffer: OPTIONAL<LPVOID>,
    cbInBuffer: DWORD,
    lpvOutBuffer_out: OPTIONAL<LPVOID>,
    cbOutBuffer: DWORD,
    lpcbBytesReturned_out: LPDWORD,
    lpCompletion: OPTIONAL<LPWSACOMPLETION>,
  ): INT {
    return Ws2_32.Load('WSANSPIoctl')(hLookup, dwControlCode, lpvInBuffer, cbInBuffer, lpvOutBuffer_out, cbOutBuffer, lpcbBytesReturned_out, lpCompletion);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsantohl
  public static WSANtohl(s: SOCKET, netlong: ULONG, lphostlong_out: LPDWORD): INT {
    return Ws2_32.Load('WSANtohl')(s, netlong, lphostlong_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsantohs
  public static WSANtohs(s: SOCKET, netshort: WORD, lphostshort_out: LPVOID): INT {
    return Ws2_32.Load('WSANtohs')(s, netshort, lphostshort_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsapoll
  public static WSAPoll(fdArray_in_out: LPWSAPOLLFD, fds: ULONG, timeout: INT): INT {
    return Ws2_32.Load('WSAPoll')(fdArray_in_out, fds, timeout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wsaprovidercompleteasyccall
  public static WSAProviderCompleteAsyncCall(hAsyncCall: HANDLE, iRetCode: INT): INT {
    return Ws2_32.Load('WSAProviderCompleteAsyncCall')(hAsyncCall, iRetCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaproviderconfigchange
  public static WSAProviderConfigChange(lpNotificationHandle_in_out: LPHANDLE, lpOverlapped_in_out: OPTIONAL<LPWSAOVERLAPPED>, lpCompletionRoutine: OPTIONAL<LPWSAOVERLAPPED_COMPLETION_ROUTINE>): INT {
    return Ws2_32.Load('WSAProviderConfigChange')(lpNotificationHandle_in_out, lpOverlapped_in_out, lpCompletionRoutine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsarecv
  public static WSARecv(
    s: SOCKET,
    lpBuffers: LPWSABUF,
    dwBufferCount: DWORD,
    lpNumberOfBytesRecvd_out: OPTIONAL<LPDWORD>,
    lpFlags_in_out: LPDWORD,
    lpOverlapped_in_out: OPTIONAL<LPWSAOVERLAPPED>,
    lpCompletionRoutine: OPTIONAL<LPWSAOVERLAPPED_COMPLETION_ROUTINE>,
  ): INT {
    return Ws2_32.Load('WSARecv')(s, lpBuffers, dwBufferCount, lpNumberOfBytesRecvd_out, lpFlags_in_out, lpOverlapped_in_out, lpCompletionRoutine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsarecvdisconnect
  public static WSARecvDisconnect(s: SOCKET, lpInboundDisconnectData: OPTIONAL<LPWSABUF>): INT {
    return Ws2_32.Load('WSARecvDisconnect')(s, lpInboundDisconnectData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsarecvfrom
  public static WSARecvFrom(
    s: SOCKET,
    lpBuffers: LPWSABUF,
    dwBufferCount: DWORD,
    lpNumberOfBytesRecvd_out: OPTIONAL<LPDWORD>,
    lpFlags_in_out: LPDWORD,
    lpFrom_out: OPTIONAL<LPSOCKADDR>,
    lpFromlen_in_out: OPTIONAL<LPINT>,
    lpOverlapped_in_out: OPTIONAL<LPWSAOVERLAPPED>,
    lpCompletionRoutine: OPTIONAL<LPWSAOVERLAPPED_COMPLETION_ROUTINE>,
  ): INT {
    return Ws2_32.Load('WSARecvFrom')(s, lpBuffers, dwBufferCount, lpNumberOfBytesRecvd_out, lpFlags_in_out, lpFrom_out, lpFromlen_in_out, lpOverlapped_in_out, lpCompletionRoutine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaremoveserviceclass
  public static WSARemoveServiceClass(lpServiceClassId: LPGUID): INT {
    return Ws2_32.Load('WSARemoveServiceClass')(lpServiceClassId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaresetevent
  public static WSAResetEvent(hEvent: WSAEVENT): BOOL {
    return Ws2_32.Load('WSAResetEvent')(hEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsasend
  public static WSASend(
    s: SOCKET,
    lpBuffers: LPWSABUF,
    dwBufferCount: DWORD,
    lpNumberOfBytesSent_out: OPTIONAL<LPDWORD>,
    dwFlags: DWORD,
    lpOverlapped_in_out: OPTIONAL<LPWSAOVERLAPPED>,
    lpCompletionRoutine: OPTIONAL<LPWSAOVERLAPPED_COMPLETION_ROUTINE>,
  ): INT {
    return Ws2_32.Load('WSASend')(s, lpBuffers, dwBufferCount, lpNumberOfBytesSent_out, dwFlags, lpOverlapped_in_out, lpCompletionRoutine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsasenddisconnect
  public static WSASendDisconnect(s: SOCKET, lpOutboundDisconnectData: OPTIONAL<LPWSABUF>): INT {
    return Ws2_32.Load('WSASendDisconnect')(s, lpOutboundDisconnectData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsasendmsg
  public static WSASendMsg(
    Handle: SOCKET,
    lpMsg: LPWSAMSG,
    dwFlags: DWORD,
    lpNumberOfBytesSent_out: OPTIONAL<LPDWORD>,
    lpOverlapped_in_out: OPTIONAL<LPWSAOVERLAPPED>,
    lpCompletionRoutine: OPTIONAL<LPWSAOVERLAPPED_COMPLETION_ROUTINE>,
  ): INT {
    return Ws2_32.Load('WSASendMsg')(Handle, lpMsg, dwFlags, lpNumberOfBytesSent_out, lpOverlapped_in_out, lpCompletionRoutine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsasendto
  public static WSASendTo(
    s: SOCKET,
    lpBuffers: LPWSABUF,
    dwBufferCount: DWORD,
    lpNumberOfBytesSent_out: OPTIONAL<LPDWORD>,
    dwFlags: DWORD,
    lpTo: OPTIONAL<LPSOCKADDR>,
    iTolen: INT,
    lpOverlapped_in_out: OPTIONAL<LPWSAOVERLAPPED>,
    lpCompletionRoutine: OPTIONAL<LPWSAOVERLAPPED_COMPLETION_ROUTINE>,
  ): INT {
    return Ws2_32.Load('WSASendTo')(s, lpBuffers, dwBufferCount, lpNumberOfBytesSent_out, dwFlags, lpTo, iTolen, lpOverlapped_in_out, lpCompletionRoutine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsasetblockinghook
  public static WSASetBlockingHook(lpBlockFunc: FARPROC): FARPROC {
    return Ws2_32.Load('WSASetBlockingHook')(lpBlockFunc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsasetevent
  public static WSASetEvent(hEvent: WSAEVENT): BOOL {
    return Ws2_32.Load('WSASetEvent')(hEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsasetlasterror
  public static WSASetLastError(iError: INT): void {
    return Ws2_32.Load('WSASetLastError')(iError);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsasetservicea
  public static WSASetServiceA(lpqsRegInfo: LPWSAQUERYSETA, essOperation: INT, dwControlFlags: DWORD): INT {
    return Ws2_32.Load('WSASetServiceA')(lpqsRegInfo, essOperation, dwControlFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsasetservicew
  public static WSASetServiceW(lpqsRegInfo: LPWSAQUERYSETW, essOperation: INT, dwControlFlags: DWORD): INT {
    return Ws2_32.Load('WSASetServiceW')(lpqsRegInfo, essOperation, dwControlFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsasocketa
  public static WSASocketA(af: INT, type: INT, protocol: INT, lpProtocolInfo: OPTIONAL<LPWSAPROTOCOL_INFOA>, g: GROUP, dwFlags: DWORD): SOCKET {
    return Ws2_32.Load('WSASocketA')(af, type, protocol, lpProtocolInfo, g, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsasocketw
  public static WSASocketW(af: INT, type: INT, protocol: INT, lpProtocolInfo: OPTIONAL<LPWSAPROTOCOL_INFOW>, g: GROUP, dwFlags: DWORD): SOCKET {
    return Ws2_32.Load('WSASocketW')(af, type, protocol, lpProtocolInfo, g, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsastartup
  public static WSAStartup(wVersionRequested: WORD, lpWSAData_out: LPWSADATA): INT {
    return Ws2_32.Load('WSAStartup')(wVersionRequested, lpWSAData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsastringtoaddressa
  public static WSAStringToAddressA(AddressString: LPSTR, AddressFamily: INT, lpProtocolInfo: OPTIONAL<LPWSAPROTOCOL_INFOA>, lpAddress_out: LPSOCKADDR, lpAddressLength_in_out: LPINT): INT {
    return Ws2_32.Load('WSAStringToAddressA')(AddressString, AddressFamily, lpProtocolInfo, lpAddress_out, lpAddressLength_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsastringtoaddressw
  public static WSAStringToAddressW(AddressString: LPWSTR, AddressFamily: INT, lpProtocolInfo: OPTIONAL<LPWSAPROTOCOL_INFOW>, lpAddress_out: LPSOCKADDR, lpAddressLength_in_out: LPINT): INT {
    return Ws2_32.Load('WSAStringToAddressW')(AddressString, AddressFamily, lpProtocolInfo, lpAddress_out, lpAddressLength_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wsaunadvertiseprovider
  public static WSAUnadvertiseProvider(puuidProviderId: LPGUID): INT {
    return Ws2_32.Load('WSAUnadvertiseProvider')(puuidProviderId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsaunhookblockinghook
  public static WSAUnhookBlockingHook(): INT {
    return Ws2_32.Load('WSAUnhookBlockingHook')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsawaitformultipleevents
  public static WSAWaitForMultipleEvents(cEvents: DWORD, lphEvents: PVOID, fWaitAll: BOOL, dwTimeout: DWORD, fAlertable: BOOL): DWORD {
    return Ws2_32.Load('WSAWaitForMultipleEvents')(cEvents, lphEvents, fWaitAll, dwTimeout, fAlertable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscdeinstallprovider
  public static WSCDeinstallProvider(lpProviderId: LPGUID, lpErrno_out: LPINT): INT {
    return Ws2_32.Load('WSCDeinstallProvider')(lpProviderId, lpErrno_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscdeinstallprovider32
  public static WSCDeinstallProvider32(lpProviderId: LPGUID, lpErrno_out: LPINT): INT {
    return Ws2_32.Load('WSCDeinstallProvider32')(lpProviderId, lpErrno_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscenablensprovider
  public static WSCEnableNSProvider(lpProviderId: LPGUID, fEnable: BOOL): INT {
    return Ws2_32.Load('WSCEnableNSProvider')(lpProviderId, fEnable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscenablensprovider32
  public static WSCEnableNSProvider32(lpProviderId: LPGUID, fEnable: BOOL): INT {
    return Ws2_32.Load('WSCEnableNSProvider32')(lpProviderId, fEnable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscenumnamespaceproviders32
  public static WSCEnumNameSpaceProviders32(lpdwBufferLength_in_out: LPDWORD, lpnspBuffer_out: LPWSANAMESPACE_INFOW): INT {
    return Ws2_32.Load('WSCEnumNameSpaceProviders32')(lpdwBufferLength_in_out, lpnspBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscenumnamespaceprovidersex32
  public static WSCEnumNameSpaceProvidersEx32(lpdwBufferLength_in_out: LPDWORD, lpnspBuffer_out: LPVOID): INT {
    return Ws2_32.Load('WSCEnumNameSpaceProvidersEx32')(lpdwBufferLength_in_out, lpnspBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscenumprotocols
  public static WSCEnumProtocols(lpiProtocols: OPTIONAL<LPINT>, lpProtocolBuffer_out: OPTIONAL<LPWSAPROTOCOL_INFOW>, lpdwBufferLength_in_out: LPDWORD, lpErrno_out: LPINT): INT {
    return Ws2_32.Load('WSCEnumProtocols')(lpiProtocols, lpProtocolBuffer_out, lpdwBufferLength_in_out, lpErrno_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscenumprotocols32
  public static WSCEnumProtocols32(lpiProtocols: OPTIONAL<LPINT>, lpProtocolBuffer_out: LPWSAPROTOCOL_INFOW, lpdwBufferLength_in_out: LPDWORD, lpErrno_out: LPINT): INT {
    return Ws2_32.Load('WSCEnumProtocols32')(lpiProtocols, lpProtocolBuffer_out, lpdwBufferLength_in_out, lpErrno_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscgetapplicationcategory
  public static WSCGetApplicationCategory(Path: LPCWSTR, PathLength: DWORD, Extra: OPTIONAL<LPCWSTR>, ExtraLength: DWORD, pPermittedLspCategories_out: LPDWORD, lpErrno_out: LPINT): INT {
    return Ws2_32.Load('WSCGetApplicationCategory')(Path, PathLength, Extra, ExtraLength, pPermittedLspCategories_out, lpErrno_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscgetproviderinfo
  public static WSCGetProviderInfo(lpProviderId: LPGUID, InfoType: WSC_PROVIDER_INFO_TYPE, Info_out: PBYTE, InfoSize_in_out: PVOID, Flags: DWORD, lpErrno_out: LPINT): INT {
    return Ws2_32.Load('WSCGetProviderInfo')(lpProviderId, InfoType, Info_out, InfoSize_in_out, Flags, lpErrno_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscgetproviderinfo32
  public static WSCGetProviderInfo32(lpProviderId: LPGUID, InfoType: WSC_PROVIDER_INFO_TYPE, Info_out: PBYTE, InfoSize_in_out: PVOID, Flags: DWORD, lpErrno_out: LPINT): INT {
    return Ws2_32.Load('WSCGetProviderInfo32')(lpProviderId, InfoType, Info_out, InfoSize_in_out, Flags, lpErrno_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscgetproviderpath
  public static WSCGetProviderPath(lpProviderId: LPGUID, lpszProviderDllPath_out: LPWSTR, lpProviderDllPathLen_in_out: LPINT, lpErrno_out: LPINT): INT {
    return Ws2_32.Load('WSCGetProviderPath')(lpProviderId, lpszProviderDllPath_out, lpProviderDllPathLen_in_out, lpErrno_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscgetproviderpath32
  public static WSCGetProviderPath32(lpProviderId: LPGUID, lpszProviderDllPath_out: LPWSTR, lpProviderDllPathLen_in_out: LPINT, lpErrno_out: LPINT): INT {
    return Ws2_32.Load('WSCGetProviderPath32')(lpProviderId, lpszProviderDllPath_out, lpProviderDllPathLen_in_out, lpErrno_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscinstallnamespace
  public static WSCInstallNameSpace(lpszIdentifier: LPWSTR, lpszPathName: LPWSTR, dwNameSpace: DWORD, dwVersion: DWORD, lpProviderId: LPGUID): INT {
    return Ws2_32.Load('WSCInstallNameSpace')(lpszIdentifier, lpszPathName, dwNameSpace, dwVersion, lpProviderId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscinstallnamespace32
  public static WSCInstallNameSpace32(lpszIdentifier: LPWSTR, lpszPathName: LPWSTR, dwNameSpace: DWORD, dwVersion: DWORD, lpProviderId: LPGUID): INT {
    return Ws2_32.Load('WSCInstallNameSpace32')(lpszIdentifier, lpszPathName, dwNameSpace, dwVersion, lpProviderId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscinstallnamespaceex
  public static WSCInstallNameSpaceEx(lpszIdentifier: LPWSTR, lpszPathName: LPWSTR, dwNameSpace: DWORD, dwVersion: DWORD, lpProviderId: LPGUID, lpProviderSpecific: LPBLOB): INT {
    return Ws2_32.Load('WSCInstallNameSpaceEx')(lpszIdentifier, lpszPathName, dwNameSpace, dwVersion, lpProviderId, lpProviderSpecific);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscinstallnamespaceex32
  public static WSCInstallNameSpaceEx32(lpszIdentifier: LPWSTR, lpszPathName: LPWSTR, dwNameSpace: DWORD, dwVersion: DWORD, lpProviderId: LPGUID, lpProviderSpecific: LPBLOB): INT {
    return Ws2_32.Load('WSCInstallNameSpaceEx32')(lpszIdentifier, lpszPathName, dwNameSpace, dwVersion, lpProviderId, lpProviderSpecific);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscinstallprovider
  public static WSCInstallProvider(lpProviderId: LPGUID, lpszProviderDllPath: LPCWSTR, lpProtocolInfoList: LPWSAPROTOCOL_INFOW, dwNumberOfEntries: DWORD, lpErrno_out: LPINT): INT {
    return Ws2_32.Load('WSCInstallProvider')(lpProviderId, lpszProviderDllPath, lpProtocolInfoList, dwNumberOfEntries, lpErrno_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscinstallprovider64_32
  public static WSCInstallProvider64_32(lpProviderId: LPGUID, lpszProviderDllPath: LPCWSTR, lpProtocolInfoList: LPWSAPROTOCOL_INFOW, dwNumberOfEntries: DWORD, lpErrno_out: LPINT): INT {
    return Ws2_32.Load('WSCInstallProvider64_32')(lpProviderId, lpszProviderDllPath, lpProtocolInfoList, dwNumberOfEntries, lpErrno_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscinstallproviderandchains64_32
  public static WSCInstallProviderAndChains64_32(
    lpProviderId: LPGUID,
    lpszProviderDllPath: LPCWSTR,
    lpszProviderDllPath32: LPCWSTR,
    lpszLspName: LPCWSTR,
    dwServiceFlags: DWORD,
    lpProtocolInfoList_in_out: LPWSAPROTOCOL_INFOW,
    dwNumberOfEntries: DWORD,
    lpdwCatalogEntryId_out: OPTIONAL<LPDWORD>,
    lpErrno_out: LPINT,
  ): INT {
    return Ws2_32.Load('WSCInstallProviderAndChains64_32')(lpProviderId, lpszProviderDllPath, lpszProviderDllPath32, lpszLspName, dwServiceFlags, lpProtocolInfoList_in_out, dwNumberOfEntries, lpdwCatalogEntryId_out, lpErrno_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscsetapplicationcategory
  public static WSCSetApplicationCategory(Path: LPCWSTR, PathLength: DWORD, Extra: OPTIONAL<LPCWSTR>, ExtraLength: DWORD, dwPermittedLspCategories: DWORD, pPrevPermLspCat_out: OPTIONAL<LPDWORD>, lpErrno_out: LPINT): INT {
    return Ws2_32.Load('WSCSetApplicationCategory')(Path, PathLength, Extra, ExtraLength, dwPermittedLspCategories, pPrevPermLspCat_out, lpErrno_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscsetproviderinfo
  public static WSCSetProviderInfo(lpProviderId: LPGUID, InfoType: WSC_PROVIDER_INFO_TYPE, Info: PBYTE, InfoSize: DWORD_PTR, Flags: DWORD, lpErrno_out: LPINT): INT {
    return Ws2_32.Load('WSCSetProviderInfo')(lpProviderId, InfoType, Info, InfoSize, Flags, lpErrno_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscsetproviderinfo32
  public static WSCSetProviderInfo32(lpProviderId: LPGUID, InfoType: WSC_PROVIDER_INFO_TYPE, Info: PBYTE, InfoSize: DWORD_PTR, Flags: DWORD, lpErrno_out: LPINT): INT {
    return Ws2_32.Load('WSCSetProviderInfo32')(lpProviderId, InfoType, Info, InfoSize, Flags, lpErrno_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscuninstallnamespace
  public static WSCUnInstallNameSpace(lpProviderId: LPGUID): INT {
    return Ws2_32.Load('WSCUnInstallNameSpace')(lpProviderId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscuninstallnamespace32
  public static WSCUnInstallNameSpace32(lpProviderId: LPGUID): INT {
    return Ws2_32.Load('WSCUnInstallNameSpace32')(lpProviderId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscupdateprovider
  public static WSCUpdateProvider(lpProviderId: LPGUID, lpszProviderDllPath: LPCWSTR, lpProtocolInfoList: LPWSAPROTOCOL_INFOW, dwNumberOfEntries: DWORD, lpErrno_out: LPINT): INT {
    return Ws2_32.Load('WSCUpdateProvider')(lpProviderId, lpszProviderDllPath, lpProtocolInfoList, dwNumberOfEntries, lpErrno_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscupdateprovider32
  public static WSCUpdateProvider32(lpProviderId: LPGUID, lpszProviderDllPath: LPCWSTR, lpProtocolInfoList: LPWSAPROTOCOL_INFOW, dwNumberOfEntries: DWORD, lpErrno_out: LPINT): INT {
    return Ws2_32.Load('WSCUpdateProvider32')(lpProviderId, lpszProviderDllPath, lpProtocolInfoList, dwNumberOfEntries, lpErrno_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscwritenamespaceorder
  public static WSCWriteNameSpaceOrder(lpProviderId: LPGUID, dwNumberOfEntries: DWORD): INT {
    return Ws2_32.Load('WSCWriteNameSpaceOrder')(lpProviderId, dwNumberOfEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscwritenamespaceorder32
  public static WSCWriteNameSpaceOrder32(lpProviderId: LPGUID, dwNumberOfEntries: DWORD): INT {
    return Ws2_32.Load('WSCWriteNameSpaceOrder32')(lpProviderId, dwNumberOfEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscwriteproviderorder
  public static WSCWriteProviderOrder(lpwdCatalogEntryId: LPDWORD, dwNumberOfEntries: DWORD): INT {
    return Ws2_32.Load('WSCWriteProviderOrder')(lpwdCatalogEntryId, dwNumberOfEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2spi/nf-ws2spi-wscwriteproviderorder32
  public static WSCWriteProviderOrder32(lpwdCatalogEntryId: LPDWORD, dwNumberOfEntries: DWORD): INT {
    return Ws2_32.Load('WSCWriteProviderOrder32')(lpwdCatalogEntryId, dwNumberOfEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-accept
  public static accept(s: SOCKET, addr_out: OPTIONAL<LPSOCKADDR>, addrlen_in_out: OPTIONAL<LPINT>): SOCKET {
    return Ws2_32.Load('accept')(s, addr_out, addrlen_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-bind
  public static override bind(s: SOCKET, name: LPSOCKADDR, namelen: INT): INT {
    return Ws2_32.Load('bind')(s, name, namelen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-closesocket
  public static closesocket(s: SOCKET): INT {
    return Ws2_32.Load('closesocket')(s);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-connect
  public static connect(s: SOCKET, name: LPSOCKADDR, namelen: INT): INT {
    return Ws2_32.Load('connect')(s, name, namelen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-freeaddrinfo
  public static freeaddrinfo(pAddrInfo: OPTIONAL<PADDRINFOA>): void {
    return Ws2_32.Load('freeaddrinfo')(pAddrInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-getaddrinfo
  public static getaddrinfo(pNodeName: OPTIONAL<LPCSTR>, pServiceName: OPTIONAL<LPCSTR>, pHints: OPTIONAL<PADDRINFOA>, ppResult_out: PVOID): INT {
    return Ws2_32.Load('getaddrinfo')(pNodeName, pServiceName, pHints, ppResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-gethostbyaddr
  public static gethostbyaddr(addr: LPCSTR, len: INT, type: INT): PHOSTENT {
    return Ws2_32.Load('gethostbyaddr')(addr, len, type);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-gethostbyname
  public static gethostbyname(name: LPCSTR): PHOSTENT {
    return Ws2_32.Load('gethostbyname')(name);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-gethostname
  public static gethostname(name_out: LPSTR, namelen: INT): INT {
    return Ws2_32.Load('gethostname')(name_out, namelen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-getnameinfo
  public static getnameinfo(pSockaddr: LPSOCKADDR, SockaddrLength: INT, pNodeBuffer_out: OPTIONAL<LPSTR>, NodeBufferSize: DWORD, pServiceBuffer_out: OPTIONAL<LPSTR>, ServiceBufferSize: DWORD, Flags: INT): INT {
    return Ws2_32.Load('getnameinfo')(pSockaddr, SockaddrLength, pNodeBuffer_out, NodeBufferSize, pServiceBuffer_out, ServiceBufferSize, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-getpeername
  public static getpeername(s: SOCKET, name_out: LPSOCKADDR, namelen_in_out: LPINT): INT {
    return Ws2_32.Load('getpeername')(s, name_out, namelen_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-getprotobyname
  public static getprotobyname(name: LPCSTR): PPROTOENT {
    return Ws2_32.Load('getprotobyname')(name);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-getprotobynumber
  public static getprotobynumber(number: INT): PPROTOENT {
    return Ws2_32.Load('getprotobynumber')(number);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-getservbyname
  public static getservbyname(name: LPCSTR, proto: OPTIONAL<LPCSTR>): PSERVENT {
    return Ws2_32.Load('getservbyname')(name, proto);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-getservbyport
  public static getservbyport(port: INT, proto: OPTIONAL<LPCSTR>): PSERVENT {
    return Ws2_32.Load('getservbyport')(port, proto);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-getsockname
  public static getsockname(s: SOCKET, name_out: LPSOCKADDR, namelen_in_out: LPINT): INT {
    return Ws2_32.Load('getsockname')(s, name_out, namelen_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-getsockopt
  public static getsockopt(s: SOCKET, level: INT, optname: INT, optval_out: LPSTR, optlen_in_out: LPINT): INT {
    return Ws2_32.Load('getsockopt')(s, level, optname, optval_out, optlen_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-htonl
  public static htonl(hostlong: ULONG): ULONG {
    return Ws2_32.Load('htonl')(hostlong);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-htons
  public static htons(hostshort: WORD): WORD {
    return Ws2_32.Load('htons')(hostshort);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-inet_addr
  public static inet_addr(cp: LPCSTR): ULONG {
    return Ws2_32.Load('inet_addr')(cp);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-inet_ntoa
  public static inet_ntoa(inAddr: ULONG): LPSTR {
    return Ws2_32.Load('inet_ntoa')(inAddr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-inet_ntop
  public static inet_ntop(Family: INT, pAddr: PVOID, pStringBuf_out: LPSTR, StringBufSize: DWORD_PTR): LPCSTR {
    return Ws2_32.Load('inet_ntop')(Family, pAddr, pStringBuf_out, StringBufSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ws2tcpip/nf-ws2tcpip-inet_pton
  public static inet_pton(Family: INT, pszAddrString: LPCSTR, pAddrBuf_out: PVOID): INT {
    return Ws2_32.Load('inet_pton')(Family, pszAddrString, pAddrBuf_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-ioctlsocket
  public static ioctlsocket(s: SOCKET, cmd: INT, argp_in_out: LPDWORD): INT {
    return Ws2_32.Load('ioctlsocket')(s, cmd, argp_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-listen
  public static listen(s: SOCKET, backlog: INT): INT {
    return Ws2_32.Load('listen')(s, backlog);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-ntohl
  public static ntohl(netlong: ULONG): ULONG {
    return Ws2_32.Load('ntohl')(netlong);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-ntohs
  public static ntohs(netshort: WORD): WORD {
    return Ws2_32.Load('ntohs')(netshort);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-recv
  public static recv(s: SOCKET, buf_out: LPSTR, len: INT, flags: INT): INT {
    return Ws2_32.Load('recv')(s, buf_out, len, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-recvfrom
  public static recvfrom(s: SOCKET, buf_out: LPSTR, len: INT, flags: INT, from_out: OPTIONAL<LPSOCKADDR>, fromlen_in_out: OPTIONAL<LPINT>): INT {
    return Ws2_32.Load('recvfrom')(s, buf_out, len, flags, from_out, fromlen_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-select
  public static select(nfds: INT, readfds_in_out: OPTIONAL<LPVOID>, writefds_in_out: OPTIONAL<LPVOID>, exceptfds_in_out: OPTIONAL<LPVOID>, timeout: OPTIONAL<PTIMEVAL>): INT {
    return Ws2_32.Load('select')(nfds, readfds_in_out, writefds_in_out, exceptfds_in_out, timeout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-send
  public static send(s: SOCKET, buf: LPCSTR, len: INT, flags: INT): INT {
    return Ws2_32.Load('send')(s, buf, len, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-sendto
  public static sendto(s: SOCKET, buf: LPCSTR, len: INT, flags: INT, to: LPSOCKADDR, tolen: INT): INT {
    return Ws2_32.Load('sendto')(s, buf, len, flags, to, tolen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-setsockopt
  public static setsockopt(s: SOCKET, level: INT, optname: INT, optval: OPTIONAL<LPCSTR>, optlen: INT): INT {
    return Ws2_32.Load('setsockopt')(s, level, optname, optval, optlen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-shutdown
  public static shutdown(s: SOCKET, how: INT): INT {
    return Ws2_32.Load('shutdown')(s, how);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-socket
  public static socket(af: INT, type: INT, protocol: INT): SOCKET {
    return Ws2_32.Load('socket')(af, type, protocol);
  }
}

export default Ws2_32;
