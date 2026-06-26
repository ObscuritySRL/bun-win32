import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { FLOAT32, HRESULT, LPCVOID, LPCX3DAUDIO_EMITTER, LPCX3DAUDIO_LISTENER, LPLPVOID, LPX3DAUDIO_DSP_SETTINGS, OPTIONAL, REFCLSID, UINT32, VOID, X3DAUDIO_HANDLE, XAUDIO2_PROCESSOR } from '../types/Xaudio2_9';

/**
 * Thin, lazy-loaded FFI bindings for `xaudio2_9.dll`.
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
 * import Xaudio2_9 from './structs/Xaudio2_9';
 *
 * // Lazy: bind on first call → an IXAudio2 COM interface pointer
 * const ppXAudio2 = Buffer.alloc(8);
 * const hr = Xaudio2_9.XAudio2Create(ppXAudio2.ptr, 0, 0);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Xaudio2_9.Preload(['XAudio2Create', 'CreateAudioVolumeMeter']);
 * ```
 */
class Xaudio2_9 extends Win32 {
  protected static override name = 'xaudio2_9.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    CreateAudioReverb: { args: [FFIType.ptr], returns: FFIType.i32 },
    CreateAudioVolumeMeter: { args: [FFIType.ptr], returns: FFIType.i32 },
    CreateFX: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    X3DAudioCalculate: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    X3DAudioInitialize: { args: [FFIType.u32, FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    XAudio2Create: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/xaudio2fx/nf-xaudio2fx-createaudioreverb
  public static CreateAudioReverb(ppApo_out: LPLPVOID): HRESULT {
    return Xaudio2_9.Load('CreateAudioReverb')(ppApo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/xaudio2fx/nf-xaudio2fx-createaudiovolumemeter
  public static CreateAudioVolumeMeter(ppApo_out: LPLPVOID): HRESULT {
    return Xaudio2_9.Load('CreateAudioVolumeMeter')(ppApo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/xapofx/nf-xapofx-createfx
  public static CreateFX(clsid: REFCLSID, pEffect_out: LPLPVOID, pInitData: OPTIONAL<LPCVOID>, InitDataByteSize: UINT32): HRESULT {
    return Xaudio2_9.Load('CreateFX')(clsid, pEffect_out, pInitData, InitDataByteSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/x3daudio/nf-x3daudio-x3daudiocalculate
  public static X3DAudioCalculate(Instance: X3DAUDIO_HANDLE, pListener: LPCX3DAUDIO_LISTENER, pEmitter: LPCX3DAUDIO_EMITTER, Flags: UINT32, pDSPSettings_in_out: LPX3DAUDIO_DSP_SETTINGS): VOID {
    return Xaudio2_9.Load('X3DAudioCalculate')(Instance, pListener, pEmitter, Flags, pDSPSettings_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/x3daudio/nf-x3daudio-x3daudioinitialize
  public static X3DAudioInitialize(SpeakerChannelMask: UINT32, SpeedOfSound: FLOAT32, Instance_out: X3DAUDIO_HANDLE): HRESULT {
    return Xaudio2_9.Load('X3DAudioInitialize')(SpeakerChannelMask, SpeedOfSound, Instance_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/xaudio2/nf-xaudio2-xaudio2create
  public static XAudio2Create(ppXAudio2_out: LPLPVOID, Flags: UINT32, XAudio2Processor: XAUDIO2_PROCESSOR): HRESULT {
    return Xaudio2_9.Load('XAudio2Create')(ppXAudio2_out, Flags, XAudio2Processor);
  }
}

export default Xaudio2_9;
