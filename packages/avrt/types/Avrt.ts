import type { Pointer } from 'bun:ffi';

export type { BOOL, HANDLE, LPCSTR, LPCWSTR, LPDWORD, NULL, OPTIONAL, PHANDLE, PULONG } from '@bun-win32/core';

export const THREAD_ORDER_GROUP_INFINITE_TIMEOUT = -1n;

export enum AVRT_PRIORITY {
  AVRT_PRIORITY_CRITICAL = 2,
  AVRT_PRIORITY_HIGH = 1,
  AVRT_PRIORITY_LOW = -1,
  AVRT_PRIORITY_NORMAL = 0,
  AVRT_PRIORITY_VERYLOW = -2,
}

export type LPGUID = Pointer;
export type PLARGE_INTEGER = Pointer;
