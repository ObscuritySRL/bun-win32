import type { Pointer } from 'bun:ffi';

export type { BOOL, DWORD, HANDLE, HRESULT, HWND, LPSECURITY_ATTRIBUTES, NULL, PHANDLE, UINT } from '@bun-win32/core';

export const COMPOSITIONOBJECT_ALL_ACCESS = 0x0000_0003;
export const COMPOSITIONOBJECT_READ = 0x0000_0001;
export const COMPOSITIONOBJECT_WRITE = 0x0000_0002;

export enum COMPOSITION_FRAME_ID_TYPE {
  COMPOSITION_FRAME_ID_COMPLETED = 2,
  COMPOSITION_FRAME_ID_CONFIRMED = 1,
  COMPOSITION_FRAME_ID_CREATED = 0,
}

export type COMPOSITION_FRAME_ID = bigint;
export type IDCompositionVisual = Pointer;
export type IDXGIDevice = Pointer;
export type IUnknown = Pointer;
export type LPLPVOID = Pointer;
export type PCOMPOSITION_FRAME_ID = Pointer;
export type PCOMPOSITION_FRAME_STATS = Pointer;
export type PCOMPOSITION_TARGET_ID = Pointer;
export type PCOMPOSITION_TARGET_STATS = Pointer;
export type PUINT = Pointer;
export type REFCLSID = Pointer;
export type REFIID = Pointer;
