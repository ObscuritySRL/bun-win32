import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { HRESULT, ID3D12Device, LPLPVOID, Optional, REFIID } from '../types/DirectML';
import type { DML_CREATE_DEVICE_FLAGS, DML_FEATURE_LEVEL } from '../types/DirectML';

/**
 * Thin, lazy-loaded FFI bindings for `DirectML.dll`.
 *
 * Each static method corresponds one-to-one with a Win32 export declared in `Symbols`.
 * The first call to a method binds the underlying native symbol via `bun:ffi` and
 * memoizes it on the class for subsequent calls. For bulk, up-front binding, use `Preload`.
 *
 * Symbols are defined with explicit `FFIType` signatures and kept alphabetized.
 * You normally do not access `Symbols` directly; call the static methods or preload
 * a subset for hot paths.
 *
 * @example
 * ```ts
 * import DirectML, { DML_CREATE_DEVICE_FLAGS } from './structs/DirectML';
 *
 * // Lazy: bind on first call
 * const ppv = Buffer.alloc(8);
 * const hr = DirectML.DMLCreateDevice(d3d12Device, DML_CREATE_DEVICE_FLAGS.DML_CREATE_DEVICE_FLAG_NONE, riid.ptr, ppv.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * DirectML.Preload(['DMLCreateDevice', 'DMLCreateDevice1']);
 * ```
 */
class DirectML extends Win32 {
  protected static override name = 'DirectML.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DMLCreateDevice: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DMLCreateDevice1: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/directml/nf-directml-dmlcreatedevice
  public static DMLCreateDevice(d3d12Device: ID3D12Device, flags: DML_CREATE_DEVICE_FLAGS, riid: REFIID, ppv_out: Optional<LPLPVOID>): HRESULT {
    return DirectML.Load('DMLCreateDevice')(d3d12Device, flags, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/directml/nf-directml-dmlcreatedevice1
  public static DMLCreateDevice1(d3d12Device: ID3D12Device, flags: DML_CREATE_DEVICE_FLAGS, minimumFeatureLevel: DML_FEATURE_LEVEL, riid: REFIID, ppv_out: Optional<LPLPVOID>): HRESULT {
    return DirectML.Load('DMLCreateDevice1')(d3d12Device, flags, minimumFeatureLevel, riid, ppv_out);
  }
}

export default DirectML;
