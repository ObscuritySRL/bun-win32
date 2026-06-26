import type { Pointer } from 'bun:ffi';

export type { HRESULT, LPCVOID, LPVOID, NULL, OPTIONAL, SIZE_T, UINT } from '@bun-win32/core';

export enum D3D_FEATURE_LEVEL {
  D3D_FEATURE_LEVEL_10_0 = 0xa000,
  D3D_FEATURE_LEVEL_10_1 = 0xa100,
  D3D_FEATURE_LEVEL_11_0 = 0xb000,
  D3D_FEATURE_LEVEL_11_1 = 0xb100,
  D3D_FEATURE_LEVEL_12_0 = 0xc000,
  D3D_FEATURE_LEVEL_12_1 = 0xc100,
  D3D_FEATURE_LEVEL_12_2 = 0xc200,
  D3D_FEATURE_LEVEL_1_0_CORE = 0x1000,
  D3D_FEATURE_LEVEL_9_1 = 0x9100,
  D3D_FEATURE_LEVEL_9_2 = 0x9200,
  D3D_FEATURE_LEVEL_9_3 = 0x9300,
}

export enum D3D_ROOT_SIGNATURE_VERSION {
  D3D_ROOT_SIGNATURE_VERSION_1 = 0x1,
  D3D_ROOT_SIGNATURE_VERSION_1_0 = 0x1,
  D3D_ROOT_SIGNATURE_VERSION_1_1 = 0x2,
}

export type IUnknown = Pointer;
export type LPLPVOID = Pointer;
export type PD3D12_ROOT_SIGNATURE_DESC = Pointer;
export type PD3D12_VERSIONED_ROOT_SIGNATURE_DESC = Pointer;
export type PID3DBlob = Pointer;
export type PUINT = Pointer;
export type REFCLSID = Pointer;
export type REFIID = Pointer;
