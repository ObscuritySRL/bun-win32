import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { DWORD, PGUID, PXINPUT_CAPABILITIES, PXINPUT_STATE, PXINPUT_VIBRATION } from '../types/Xinput9_1_0';

/**
 * Thin, lazy-loaded FFI bindings for `xinput9_1_0.dll`.
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
 * import Xinput9_1_0 from './structs/Xinput9_1_0';
 *
 * // Lazy: bind on first call
 * const result = Xinput9_1_0.XInputGetState(0, state.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Xinput9_1_0.Preload(['XInputGetState', 'XInputSetState']);
 * ```
 */
class Xinput9_1_0 extends Win32 {
  protected static override name = 'xinput9_1_0.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    XInputGetCapabilities: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    XInputGetDSoundAudioDeviceGuids: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    XInputGetState: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    XInputSetState: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/xinput/nf-xinput-xinputgetcapabilities
  public static XInputGetCapabilities(dwUserIndex: DWORD, dwFlags: DWORD, pCapabilities: PXINPUT_CAPABILITIES): DWORD {
    return Xinput9_1_0.Load('XInputGetCapabilities')(dwUserIndex, dwFlags, pCapabilities);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/xinput/nf-xinput-xinputgetdsoundaudiodeviceguids
  public static XInputGetDSoundAudioDeviceGuids(dwUserIndex: DWORD, pDSoundRenderGuid: PGUID, pDSoundCaptureGuid: PGUID): DWORD {
    return Xinput9_1_0.Load('XInputGetDSoundAudioDeviceGuids')(dwUserIndex, pDSoundRenderGuid, pDSoundCaptureGuid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/xinput/nf-xinput-xinputgetstate
  public static XInputGetState(dwUserIndex: DWORD, pState: PXINPUT_STATE): DWORD {
    return Xinput9_1_0.Load('XInputGetState')(dwUserIndex, pState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/xinput/nf-xinput-xinputsetstate
  public static XInputSetState(dwUserIndex: DWORD, pVibration: PXINPUT_VIBRATION): DWORD {
    return Xinput9_1_0.Load('XInputSetState')(dwUserIndex, pVibration);
  }
}

export default Xinput9_1_0;
