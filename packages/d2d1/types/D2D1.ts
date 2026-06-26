import type { Pointer } from 'bun:ffi';

export type { BOOL, HRESULT, NULL, Optional } from '@bun-win32/core';

export enum D2D1_COLOR_SPACE {
  D2D1_COLOR_SPACE_CUSTOM = 0,
  D2D1_COLOR_SPACE_FORCE_DWORD = 0xffff_ffff,
  D2D1_COLOR_SPACE_SCRGB = 2,
  D2D1_COLOR_SPACE_SRGB = 1,
}

export enum D2D1_DEBUG_LEVEL {
  D2D1_DEBUG_LEVEL_ERROR = 1,
  D2D1_DEBUG_LEVEL_FORCE_DWORD = 0xffff_ffff,
  D2D1_DEBUG_LEVEL_INFORMATION = 3,
  D2D1_DEBUG_LEVEL_NONE = 0,
  D2D1_DEBUG_LEVEL_WARNING = 2,
}

export enum D2D1_DEVICE_CONTEXT_OPTIONS {
  D2D1_DEVICE_CONTEXT_OPTIONS_ENABLE_MULTITHREADED_OPTIMIZATIONS = 1,
  D2D1_DEVICE_CONTEXT_OPTIONS_FORCE_DWORD = 0xffff_ffff,
  D2D1_DEVICE_CONTEXT_OPTIONS_NONE = 0,
}

export enum D2D1_FACTORY_TYPE {
  D2D1_FACTORY_TYPE_FORCE_DWORD = 0xffff_ffff,
  D2D1_FACTORY_TYPE_MULTI_THREADED = 1,
  D2D1_FACTORY_TYPE_SINGLE_THREADED = 0,
}

export enum D2D1_THREADING_MODE {
  D2D1_THREADING_MODE_MULTI_THREADED = 1,
  D2D1_THREADING_MODE_SINGLE_THREADED = 0,
}

export type FLOAT = number;
export type IDXGIDevice = Pointer;
export type IDXGISurface = Pointer;
export type LPLPVOID = Pointer;
export type PACKED_D2D1_POINT_2F = bigint;
export type PD2D1_COLOR_F = Pointer;
export type PD2D1_CREATION_PROPERTIES = Pointer;
export type PD2D1_FACTORY_OPTIONS = Pointer;
export type PD2D1_MATRIX_3X2_F = Pointer;
export type PD2D1_POINT_2F = Pointer;
export type PFLOAT = Pointer;
export type PID2D1Device = Pointer;
export type PID2D1DeviceContext = Pointer;
export type REFIID = Pointer;

const _packPointBuffer = Buffer.alloc(8);

/** Pack two `FLOAT` values into a `PACKED_D2D1_POINT_2F` for Win32 functions that take `D2D1_POINT_2F` by value (8 bytes, passed in a single x64 register). */
export function packD2D1_POINT_2F(x: number, y: number): PACKED_D2D1_POINT_2F {
  _packPointBuffer.writeFloatLE(x, 0);
  _packPointBuffer.writeFloatLE(y, 4);
  return _packPointBuffer.readBigUInt64LE(0);
}
