import type { Pointer } from 'bun:ffi';

export type { DWORD, HRESULT, LPCWSTR, NULLABLE, OPTIONAL, PDWORD, PULONG, PVOID, ULONG } from '@bun-win32/core';

export const E_DELTA_PRINTTICKET_FORMAT = 0x8004_0005;
export const E_PRINTCAPABILITIES_FORMAT = 0x8004_0004;
export const E_PRINTDEVICECAPABILITIES_FORMAT = 0x8004_0006;
export const E_PRINTTICKET_FORMAT = 0x8004_0003;
export const S_PT_CONFLICT_RESOLVED = 0x0004_0002;
export const S_PT_NO_CONFLICT = 0x0004_0001;

export enum EDefaultDevmodeType {
  kPrinterDefaultDevmode = 1,
  kUserDefaultDevmode = 0,
}

export enum EPrintTicketScope {
  kPTDocumentScope = 1,
  kPTJobScope = 2,
  kPTPageScope = 0,
}

export type HPTPROVIDER = bigint;
export type IStream = bigint;
export type PBSTR = Pointer;
export type PCWSTR = Pointer;
export type PDEVMODE = Pointer;
export type PHPTPROVIDER = Pointer;
export type PPDEVMODE = Pointer;
export type PPVOID = Pointer;
export type PTBUFFER = bigint;
export type REFCLSID = Pointer;
export type REFIID = Pointer;
