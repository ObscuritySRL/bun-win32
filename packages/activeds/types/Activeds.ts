import type { Pointer } from 'bun:ffi';

export type { DWORD, HRESULT, LPCWSTR, LPDWORD, LPWSTR, NULL, PDWORD, ULONG } from '@bun-win32/core';

export enum ADS_AUTHENTICATION_ENUM {
  ADS_AUTH_RESERVED = 0x8000_0000,
  ADS_FAST_BIND = 0x0000_0020,
  ADS_NO_AUTHENTICATION = 0x0000_0010,
  ADS_NO_REFERRAL_CHASING = 0x0000_0400,
  ADS_PROMPT_CREDENTIALS = 0x0000_0008,
  ADS_READONLY_SERVER = 0x0000_0004,
  ADS_SECURE_AUTHENTICATION = 0x0000_0001,
  ADS_SERVER_BIND = 0x0000_0200,
  ADS_USE_DELEGATION = 0x0000_0100,
  ADS_USE_ENCRYPTION = 0x0000_0002,
  ADS_USE_SEALING = 0x0000_0080,
  ADS_USE_SIGNING = 0x0000_0040,
  ADS_USE_SSL = 0x0000_0002,
}

export type IADsContainer = bigint;
export type IEnumVARIANT = bigint;
export type LPLPWSTR = Pointer;
export type PIEnumVARIANT = Pointer;
export type PSECURITY_DESCRIPTOR = Pointer;
export type PPSECURITY_DESCRIPTOR = Pointer;
export type PVARIANT = Pointer;
export type PVOID = Pointer;
export type PPVOID = Pointer;
export type REFCLSID = Pointer;
export type REFIID = Pointer;
export type VARIANT = Pointer;
