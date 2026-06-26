import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { HRESULT, PIGameInput, PPVOID, REFCLSID, REFIID } from '../types/GameInput';

/**
 * Thin, lazy-loaded FFI bindings for `gameinput.dll`.
 *
 * Each static method corresponds one-to-one with a Win32 export declared in `Symbols`.
 * The first call to a method binds the underlying native symbol via `bun:ffi` and
 * memoizes it on the class for subsequent calls. For bulk, up-front binding, use `Preload`.
 *
 * Symbols are defined with explicit `FFIType` signatures and kept alphabetized.
 * You normally do not access `Symbols` directly; call the static methods or preload
 * a subset for hot paths.
 *
 * `GameInputCreate` is a Nano-COM factory: it returns the per-process `IGameInput`
 * singleton through an out-pointer. The rest of the GameInput surface (readings,
 * devices, callbacks) is reached by invoking that interface's COM vtable directly.
 *
 * @example
 * ```ts
 * import GameInput from './structs/GameInput';
 *
 * // Lazy: bind on first call
 * const ppGameInput = Buffer.alloc(8);
 * const hr = GameInput.GameInputCreate(ppGameInput.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * GameInput.Preload(['GameInputCreate']);
 * ```
 */
class GameInput extends Win32 {
  protected static override name = 'gameinput.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DllCanUnloadNow: { args: [], returns: FFIType.i32 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GameInputCreate: { args: [FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllcanunloadnow
  public static DllCanUnloadNow(): HRESULT {
    return GameInput.Load('DllCanUnloadNow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllgetclassobject
  public static DllGetClassObject(rclsid: REFCLSID, riid: REFIID, ppv_out: PPVOID): HRESULT {
    return GameInput.Load('DllGetClassObject')(rclsid, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/gaming/gdk/_content/gc/reference/input/gameinput/functions/gameinputcreate
  public static GameInputCreate(gameInput_out: PIGameInput): HRESULT {
    return GameInput.Load('GameInputCreate')(gameInput_out);
  }
}

export default GameInput;
