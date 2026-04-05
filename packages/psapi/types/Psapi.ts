import type { Pointer } from 'bun:ffi';
export type { BOOL, DWORD, HANDLE, HMODULE, LPCSTR, LPCWSTR, LPDWORD, LPSTR, LPVOID, LPWSTR, PDWORD, PVOID } from '@bun-win32/core';

export enum ListModulesFilterFlag {
  LIST_MODULES_32BIT = 0x01,
  LIST_MODULES_64BIT = 0x02,
  LIST_MODULES_ALL = 0x03,
  LIST_MODULES_DEFAULT = 0x00,
}

export type LPHMODULE = Pointer;
export type LPMODULEINFO = Pointer;
export type PENUM_PAGE_FILE_CALLBACKA = Pointer;
export type PENUM_PAGE_FILE_CALLBACKW = Pointer;
export type PPERFORMANCE_INFORMATION = Pointer;
export type PPROCESS_MEMORY_COUNTERS = Pointer;
export type PPSAPI_WS_WATCH_INFORMATION = Pointer;
export type PPSAPI_WS_WATCH_INFORMATION_EX = Pointer;
