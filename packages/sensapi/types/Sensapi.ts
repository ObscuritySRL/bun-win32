import type { Pointer } from 'bun:ffi';

export type { BOOL, DWORD, LPCSTR, LPCWSTR, LPDWORD, NULL, NULLABLE } from '@bun-win32/core';

export enum NetworkAliveFlags {
  NETWORK_ALIVE_AOL = 0x0000_0004,
  NETWORK_ALIVE_INTERNET = 0x0000_0008,
  NETWORK_ALIVE_LAN = 0x0000_0001,
  NETWORK_ALIVE_WAN = 0x0000_0002,
}

export const QOCINFO_SIZE = 16;

export type LPQOCINFO = Pointer;
export type QOCINFO = Pointer;
