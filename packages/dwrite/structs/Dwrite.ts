import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { DWRITE_FACTORY_TYPE, HRESULT, LPLPVOID, REFIID } from '../types/Dwrite';

/**
 * Thin, lazy-loaded FFI bindings for `dwrite.dll`.
 *
 * Each static method corresponds one-to-one with a Win32 export declared in `Symbols`.
 * The first call to a method binds the underlying native symbol via `bun:ffi` and
 * memoizes it on the class for subsequent calls. For bulk, up-front binding, use `Preload`.
 *
 * Symbols are defined with explicit `FFIType` signatures and kept alphabetized.
 * You normally do not access `Symbols` directly; call the static methods or preload
 * a subset for hot paths.
 *
 * `dwrite.dll` exports exactly one flat function, `DWriteCreateFactory`. Every other
 * DirectWrite capability is reached through the COM vtable of the `IDWriteFactory`
 * it returns (see the package examples for the vtable-walk pattern).
 *
 * @example
 * ```ts
 * import Dwrite, { DWRITE_FACTORY_TYPE } from './structs/Dwrite';
 *
 * // Lazy: bind on first call
 * const iid = Buffer.alloc(16); // __uuidof(IDWriteFactory)
 * const factory = Buffer.alloc(8);
 * const hr = Dwrite.DWriteCreateFactory(DWRITE_FACTORY_TYPE.DWRITE_FACTORY_TYPE_SHARED, iid.ptr, factory.ptr);
 *
 * // Or preload to avoid per-symbol lazy binding cost
 * Dwrite.Preload('DWriteCreateFactory');
 * ```
 */
class Dwrite extends Win32 {
  protected static override name = 'dwrite.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DWriteCreateFactory: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/dwrite/nf-dwrite-dwritecreatefactory
  public static DWriteCreateFactory(factoryType: DWRITE_FACTORY_TYPE, iid: REFIID, factory_out: LPLPVOID): HRESULT {
    return Dwrite.Load('DWriteCreateFactory')(factoryType, iid, factory_out);
  }
}

export default Dwrite;
