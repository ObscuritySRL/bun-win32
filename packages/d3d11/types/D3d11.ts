import type { Pointer } from 'bun:ffi';

export type { HMODULE, HRESULT, NULL, UINT } from '@bun-win32/core';

export const D3D11_SDK_VERSION = 7;

export enum D3D11_CREATE_DEVICE_FLAG {
  D3D11_CREATE_DEVICE_BGRA_SUPPORT = 0x20,
  D3D11_CREATE_DEVICE_DEBUG = 0x2,
  D3D11_CREATE_DEVICE_DEBUGGABLE = 0x40,
  D3D11_CREATE_DEVICE_DISABLE_GPU_TIMEOUT = 0x100,
  D3D11_CREATE_DEVICE_PREVENT_ALTERING_LAYER_SETTINGS_FROM_REGISTRY = 0x80,
  D3D11_CREATE_DEVICE_PREVENT_INTERNAL_THREADING_OPTIMIZATIONS = 0x8,
  D3D11_CREATE_DEVICE_SINGLETHREADED = 0x1,
  D3D11_CREATE_DEVICE_SWITCH_TO_REF = 0x4,
  D3D11_CREATE_DEVICE_VIDEO_SUPPORT = 0x800,
}

export enum D3D_DRIVER_TYPE {
  D3D_DRIVER_TYPE_HARDWARE = 1,
  D3D_DRIVER_TYPE_NULL = 3,
  D3D_DRIVER_TYPE_REFERENCE = 2,
  D3D_DRIVER_TYPE_SOFTWARE = 4,
  D3D_DRIVER_TYPE_UNKNOWN = 0,
  D3D_DRIVER_TYPE_WARP = 5,
}

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

export type ID3D11Device = Pointer;
export type ID3D11DeviceContext = Pointer;
export type IDXGIAdapter = Pointer;
export type IDXGIDevice = Pointer;
export type IDXGISurface = Pointer;
export type IDXGISwapChain = Pointer;
export type IInspectable = Pointer;
export type IUnknown = Pointer;
export type PD3D_FEATURE_LEVEL = Pointer;
export type PDXGI_SWAP_CHAIN_DESC = Pointer;
export type PID3D11Device = Pointer;
export type PID3D11DeviceContext = Pointer;
export type PIDXGISwapChain = Pointer;
export type PIInspectable = Pointer;
export type PIUnknown = Pointer;
