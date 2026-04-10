import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { BOOL, BYTE, DWORD, LPWSTR, NULL, PXINPUT_BATTERY_INFORMATION, PXINPUT_CAPABILITIES, PXINPUT_KEYSTROKE, PXINPUT_STATE, PXINPUT_VIBRATION, PUINT, VOID } from '../types/Xinput1_4';

/**
 * Thin, lazy-loaded FFI bindings for `xinput1_4.dll`.
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
 * import Xinput1_4 from './structs/Xinput1_4';
 *
 * // Lazy: bind on first call
 * const result = Xinput1_4.XInputGetState(0, state.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Xinput1_4.Preload(['XInputGetState', 'XInputSetState']);
 * ```
 */
class Xinput1_4 extends Win32 {
  protected static override name = 'xinput1_4.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    XInputEnable: { args: [FFIType.i32], returns: FFIType.void },
    XInputGetAudioDeviceIds: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    XInputGetBatteryInformation: { args: [FFIType.u32, FFIType.u8, FFIType.ptr], returns: FFIType.u32 },
    XInputGetCapabilities: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    XInputGetKeystroke: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    XInputGetState: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    XInputSetState: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/xinput/nf-xinput-xinputenable
  public static XInputEnable(enable: BOOL): VOID {
    return Xinput1_4.Load('XInputEnable')(enable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/xinput/nf-xinput-xinputgetaudiodeviceids
  public static XInputGetAudioDeviceIds(dwUserIndex: DWORD, pRenderDeviceId: LPWSTR | NULL, pRenderCount: PUINT | NULL, pCaptureDeviceId: LPWSTR | NULL, pCaptureCount: PUINT | NULL): DWORD {
    return Xinput1_4.Load('XInputGetAudioDeviceIds')(dwUserIndex, pRenderDeviceId, pRenderCount, pCaptureDeviceId, pCaptureCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/xinput/nf-xinput-xinputgetbatteryinformation
  public static XInputGetBatteryInformation(dwUserIndex: DWORD, devType: BYTE, pBatteryInformation: PXINPUT_BATTERY_INFORMATION): DWORD {
    return Xinput1_4.Load('XInputGetBatteryInformation')(dwUserIndex, devType, pBatteryInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/xinput/nf-xinput-xinputgetcapabilities
  public static XInputGetCapabilities(dwUserIndex: DWORD, dwFlags: DWORD, pCapabilities: PXINPUT_CAPABILITIES): DWORD {
    return Xinput1_4.Load('XInputGetCapabilities')(dwUserIndex, dwFlags, pCapabilities);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/xinput/nf-xinput-xinputgetkeystroke
  public static XInputGetKeystroke(dwUserIndex: DWORD, dwReserved: DWORD, pKeystroke: PXINPUT_KEYSTROKE): DWORD {
    return Xinput1_4.Load('XInputGetKeystroke')(dwUserIndex, dwReserved, pKeystroke);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/xinput/nf-xinput-xinputgetstate
  public static XInputGetState(dwUserIndex: DWORD, pState: PXINPUT_STATE): DWORD {
    return Xinput1_4.Load('XInputGetState')(dwUserIndex, pState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/xinput/nf-xinput-xinputsetstate
  public static XInputSetState(dwUserIndex: DWORD, pVibration: PXINPUT_VIBRATION): DWORD {
    return Xinput1_4.Load('XInputSetState')(dwUserIndex, pVibration);
  }
}

export default Xinput1_4;
