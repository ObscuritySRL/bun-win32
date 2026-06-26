import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { HRESULT, LPLPVOID, REFIID } from '../types/Dxcore';

/**
 * Thin, lazy-loaded FFI bindings for `dxcore.dll`.
 *
 * Each static method corresponds one-to-one with a Win32 export declared in `Symbols`.
 * The first call to a method binds the underlying native symbol via `bun:ffi` and
 * memoizes it on the class for subsequent calls. For bulk, up-front binding, use `Preload`.
 *
 * Symbols are defined with explicit `FFIType` signatures and kept alphabetized.
 * You normally do not access `Symbols` directly; call the static methods or preload
 * a subset for hot paths.
 *
 * `dxcore.dll` exports exactly one flat function, `DXCoreCreateAdapterFactory`
 * (every other ordinal is a forwarder to `win32u`). All DXCore adapter
 * enumeration is reached through the COM vtable of the `IDXCoreAdapterFactory`
 * it returns (see the package examples for the vtable-walk pattern).
 *
 * @example
 * ```ts
 * import Dxcore, { IID_IDXCoreAdapterFactory } from './structs/Dxcore';
 *
 * // Lazy: bind on first call
 * const iid = Buffer.alloc(16); // IID_IDXCoreAdapterFactory
 * const factory = Buffer.alloc(8);
 * const hr = Dxcore.DXCoreCreateAdapterFactory(iid.ptr, factory.ptr);
 *
 * // Or preload to avoid per-symbol lazy binding cost
 * Dxcore.Preload('DXCoreCreateAdapterFactory');
 * ```
 */
class Dxcore extends Win32 {
  protected static override name = 'dxcore.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DXCoreCreateAdapterFactory: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/dxcore/nf-dxcore-dxcorecreateadapterfactory
  public static DXCoreCreateAdapterFactory(riid: REFIID, ppvFactory_out: LPLPVOID): HRESULT {
    return Dxcore.Load('DXCoreCreateAdapterFactory')(riid, ppvFactory_out);
  }
}

export default Dxcore;
