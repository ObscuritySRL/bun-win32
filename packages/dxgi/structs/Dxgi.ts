import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { HRESULT, LPLPVOID, REFIID, UINT } from '../types/Dxgi';

/**
 * Thin, lazy-loaded FFI bindings for `dxgi.dll`.
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
 * import Dxgi from './structs/Dxgi';
 *
 * // Lazy: bind on first call
 * const iidFactory1 = Buffer.alloc(16);
 * const ppFactory = Buffer.alloc(8);
 * const hr = Dxgi.CreateDXGIFactory1(iidFactory1.ptr, ppFactory.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Dxgi.Preload(['CreateDXGIFactory1', 'CreateDXGIFactory2']);
 * ```
 */
class Dxgi extends Win32 {
  protected static override name = 'dxgi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    CreateDXGIFactory: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateDXGIFactory1: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateDXGIFactory2: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DXGIDeclareAdapterRemovalSupport: { args: [], returns: FFIType.i32 },
    DXGIGetDebugInterface1: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/dxgi/nf-dxgi-createdxgifactory
  public static CreateDXGIFactory(riid: REFIID, ppFactory: LPLPVOID): HRESULT {
    return Dxgi.Load('CreateDXGIFactory')(riid, ppFactory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dxgi/nf-dxgi-createdxgifactory1
  public static CreateDXGIFactory1(riid: REFIID, ppFactory: LPLPVOID): HRESULT {
    return Dxgi.Load('CreateDXGIFactory1')(riid, ppFactory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dxgi1_3/nf-dxgi1_3-createdxgifactory2
  public static CreateDXGIFactory2(Flags: UINT, riid: REFIID, ppFactory: LPLPVOID): HRESULT {
    return Dxgi.Load('CreateDXGIFactory2')(Flags, riid, ppFactory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dxgi1_6/nf-dxgi1_6-dxgideclareadapterremovalsupport
  public static DXGIDeclareAdapterRemovalSupport(): HRESULT {
    return Dxgi.Load('DXGIDeclareAdapterRemovalSupport')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dxgi1_3/nf-dxgi1_3-dxgigetdebuginterface1
  public static DXGIGetDebugInterface1(Flags: UINT, riid: REFIID, pDebug: LPLPVOID): HRESULT {
    return Dxgi.Load('DXGIGetDebugInterface1')(Flags, riid, pDebug);
  }
}

export default Dxgi;
