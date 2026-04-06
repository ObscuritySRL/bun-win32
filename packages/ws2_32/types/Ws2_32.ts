import type { Pointer } from 'bun:ffi';

export type { BOOL, DWORD, DWORD_PTR, HANDLE, HWND, INT, LPCSTR, LPCWSTR, LPDWORD, LPHANDLE, LPSTR, LPVOID, LPWSTR, NULL, PBYTE, PVOID, UINT, ULONG, WORD } from '@bun-win32/core';

export const INVALID_SOCKET = -1n as SOCKET;
export const SOCKET_ERROR = -1;

export enum AddressFamily {
  AF_APPLETALK = 0x0000_0010,
  AF_BTH = 0x0000_0020,
  AF_INET = 0x0000_0002,
  AF_INET6 = 0x0000_0017,
  AF_IPX = 0x0000_0006,
  AF_IRDA = 0x0000_001a,
  AF_NETBIOS = 0x0000_0011,
  AF_UNSPEC = 0x0000_0000,
}

export enum MessageFlags {
  MSG_DONTROUTE = 0x0000_0004,
  MSG_OOB = 0x0000_0001,
  MSG_PEEK = 0x0000_0002,
  MSG_WAITALL = 0x0000_0008,
}

export enum NetworkEvents {
  FD_ACCEPT = 0x0000_0008,
  FD_CLOSE = 0x0000_0020,
  FD_CONNECT = 0x0000_0010,
  FD_OOB = 0x0000_0004,
  FD_READ = 0x0000_0001,
  FD_WRITE = 0x0000_0002,
}

export enum Protocol {
  IPPROTO_ICMP = 0x0000_0001,
  IPPROTO_ICMPV6 = 0x0000_003a,
  IPPROTO_IGMP = 0x0000_0002,
  IPPROTO_IP = 0x0000_0000,
  IPPROTO_IPV6 = 0x0000_0029,
  IPPROTO_RAW = 0x0000_00ff,
  IPPROTO_RM = 0x0000_0071,
  IPPROTO_TCP = 0x0000_0006,
  IPPROTO_UDP = 0x0000_0011,
}

export enum ServiceOperation {
  RNRSERVICE_DELETE = 0x0000_0002,
  RNRSERVICE_DEREGISTER = 0x0000_0001,
  RNRSERVICE_REGISTER = 0x0000_0000,
}

export enum ShutdownHow {
  SD_BOTH = 0x0000_0002,
  SD_RECEIVE = 0x0000_0000,
  SD_SEND = 0x0000_0001,
}

export enum SocketOption {
  SO_ACCEPTCONN = 0x0000_0002,
  SO_BROADCAST = 0x0000_0020,
  SO_DEBUG = 0x0000_0001,
  SO_DONTROUTE = 0x0000_0010,
  SO_ERROR = 0x0000_1007,
  SO_KEEPALIVE = 0x0000_0008,
  SO_LINGER = 0x0000_0080,
  SO_OOBINLINE = 0x0000_0100,
  SO_RCVBUF = 0x0000_1002,
  SO_RCVLOWAT = 0x0000_1004,
  SO_RCVTIMEO = 0x0000_1006,
  SO_REUSEADDR = 0x0000_0004,
  SO_SNDBUF = 0x0000_1001,
  SO_SNDLOWAT = 0x0000_1003,
  SO_SNDTIMEO = 0x0000_1005,
  SO_TYPE = 0x0000_1008,
  SO_USELOOPBACK = 0x0000_0040,
}

export enum SocketOptionLevel {
  SOL_SOCKET = 0x0000_ffff,
}

export enum SocketType {
  SOCK_DGRAM = 0x0000_0002,
  SOCK_RAW = 0x0000_0003,
  SOCK_RDM = 0x0000_0004,
  SOCK_SEQPACKET = 0x0000_0005,
  SOCK_STREAM = 0x0000_0001,
}

export enum WSAFlags {
  WSA_FLAG_MULTIPOINT_C_LEAF = 0x0000_0004,
  WSA_FLAG_MULTIPOINT_C_ROOT = 0x0000_0002,
  WSA_FLAG_MULTIPOINT_D_LEAF = 0x0000_0010,
  WSA_FLAG_MULTIPOINT_D_ROOT = 0x0000_0008,
  WSA_FLAG_NO_HANDLE_INHERIT = 0x0000_0080,
  WSA_FLAG_OVERLAPPED = 0x0000_0001,
}

export type FARPROC = Pointer;
export type GROUP = number;
export type LPBLOB = Pointer;
export type LPCONDITIONPROC = Pointer;
export type LPCNSPV2_ROUTINE = Pointer;
export type LPGUID = Pointer;
export type LPINT = Pointer;
export type LPLOOKUPSERVICE_COMPLETION_ROUTINE = Pointer;
export type LPOVERLAPPED = Pointer;
export type LPQOS = Pointer;
export type LPSOCKADDR = Pointer;
export type LPWSABUF = Pointer;
export type LPWSACOMPLETION = Pointer;
export type LPWSADATA = Pointer;
export type LPWSAMSG = Pointer;
export type LPWSANAMESPACE_INFOA = Pointer;
export type LPWSANAMESPACE_INFOW = Pointer;
export type LPWSANETWORKEVENTS = Pointer;
export type LPWSAOVERLAPPED = Pointer;
export type LPWSAOVERLAPPED_COMPLETION_ROUTINE = Pointer;
export type LPWSAPOLLFD = Pointer;
export type LPWSAPROTOCOL_INFOA = Pointer;
export type LPWSAPROTOCOL_INFOW = Pointer;
export type LPWSAQUERYSETA = Pointer;
export type LPWSAQUERYSETW = Pointer;
export type LPWSASERVICECLASSINFOA = Pointer;
export type LPWSASERVICECLASSINFOW = Pointer;
export type PADDRINFOA = Pointer;
export type PADDRINFOEXA = Pointer;
export type PADDRINFOEXW = Pointer;
export type PADDRINFOW = Pointer;
export type PHOSTENT = Pointer;
export type PPROTOENT = Pointer;
export type PSERVENT = Pointer;
export type PSOCKET_ADDRESS = Pointer;
export type PSOCKET_ADDRESS_LIST = Pointer;
export type PTIMEVAL = Pointer;
export type SOCKET = bigint;
export type WSAEVENT = bigint;
export type WSC_PROVIDER_INFO_TYPE = number;
