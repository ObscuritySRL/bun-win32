import type { Pointer } from 'bun:ffi';

export type { HRESULT, LPCWSTR, OPTIONAL, PVOID, ULONG, VOID } from '@bun-win32/core';

export enum AMSI_RESULT {
  AMSI_RESULT_BLOCKED_BY_ADMIN_END = 0x4fff,
  AMSI_RESULT_BLOCKED_BY_ADMIN_START = 0x4000,
  AMSI_RESULT_CLEAN = 0,
  AMSI_RESULT_DETECTED = 32768,
  AMSI_RESULT_NOT_DETECTED = 1,
}

export type HAMSICONTEXT = bigint;
export type HAMSISESSION = bigint;
export type PAMSI_RESULT = Pointer;
export type PHAMSICONTEXT = Pointer;
export type PHAMSISESSION = Pointer;
export type PPVOID = Pointer;
export type REFCLSID = Pointer;
export type REFIID = Pointer;
