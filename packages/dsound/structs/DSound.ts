import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { DWORD, HRESULT, HWND, LPCDSBUFFERDESC, LPCDSCBUFFERDESC, LPCGUID, LPDSENUMCALLBACKA, LPDSENUMCALLBACKW, LPGUID, LPLPVOID, LPVOID, NULL, OPTIONAL, REFCLSID, REFIID } from '../types/DSound';

/**
 * Thin, lazy-loaded FFI bindings for `dsound.dll`.
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
 * import DSound from './structs/DSound';
 *
 * // Lazy: bind on first call
 * const ppDS8 = Buffer.alloc(8);
 * const hr = DSound.DirectSoundCreate8(null, ppDS8.ptr, null);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * DSound.Preload(['DirectSoundCreate8', 'DirectSoundEnumerateW']);
 * ```
 */
class DSound extends Win32 {
  protected static override name = 'dsound.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DirectSoundCaptureCreate: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DirectSoundCaptureCreate8: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DirectSoundCaptureEnumerateA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DirectSoundCaptureEnumerateW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DirectSoundCreate: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DirectSoundCreate8: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DirectSoundEnumerateA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DirectSoundEnumerateW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DirectSoundFullDuplexCreate: {
      args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr],
      returns: FFIType.i32,
    },
    DllCanUnloadNow: { args: [], returns: FFIType.i32 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetDeviceID: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/previous-versions/windows/desktop/ee416362(v=vs.85)
  public static DirectSoundCaptureCreate(pcGuidDevice: OPTIONAL<LPCGUID>, ppDSC_out: LPLPVOID, pUnkOuter: NULL): HRESULT {
    return DSound.Load('DirectSoundCaptureCreate')(pcGuidDevice, ppDSC_out, pUnkOuter);
  }

  // https://learn.microsoft.com/en-us/previous-versions/windows/desktop/ee416760(v=vs.85)
  public static DirectSoundCaptureCreate8(pcGuidDevice: OPTIONAL<LPCGUID>, ppDSC8_out: LPLPVOID, pUnkOuter: NULL): HRESULT {
    return DSound.Load('DirectSoundCaptureCreate8')(pcGuidDevice, ppDSC8_out, pUnkOuter);
  }

  // https://learn.microsoft.com/en-us/previous-versions/windows/desktop/ee416761(v=vs.85)
  public static DirectSoundCaptureEnumerateA(pDSEnumCallback: LPDSENUMCALLBACKA, pContext: OPTIONAL<LPVOID>): HRESULT {
    return DSound.Load('DirectSoundCaptureEnumerateA')(pDSEnumCallback, pContext);
  }

  // https://learn.microsoft.com/en-us/previous-versions/windows/desktop/ee416761(v=vs.85)
  public static DirectSoundCaptureEnumerateW(pDSEnumCallback: LPDSENUMCALLBACKW, pContext: OPTIONAL<LPVOID>): HRESULT {
    return DSound.Load('DirectSoundCaptureEnumerateW')(pDSEnumCallback, pContext);
  }

  // https://learn.microsoft.com/en-us/previous-versions/windows/desktop/mt708921(v=vs.85)
  public static DirectSoundCreate(pcGuidDevice: OPTIONAL<LPCGUID>, ppDS_out: LPLPVOID, pUnkOuter: NULL): HRESULT {
    return DSound.Load('DirectSoundCreate')(pcGuidDevice, ppDS_out, pUnkOuter);
  }

  // https://learn.microsoft.com/en-us/previous-versions/windows/desktop/ee416762(v=vs.85)
  public static DirectSoundCreate8(pcGuidDevice: OPTIONAL<LPCGUID>, ppDS8_out: LPLPVOID, pUnkOuter: NULL): HRESULT {
    return DSound.Load('DirectSoundCreate8')(pcGuidDevice, ppDS8_out, pUnkOuter);
  }

  // https://learn.microsoft.com/en-us/previous-versions/windows/desktop/ee416763(v=vs.85)
  public static DirectSoundEnumerateA(pDSEnumCallback: LPDSENUMCALLBACKA, pContext: OPTIONAL<LPVOID>): HRESULT {
    return DSound.Load('DirectSoundEnumerateA')(pDSEnumCallback, pContext);
  }

  // https://learn.microsoft.com/en-us/previous-versions/windows/desktop/ee416763(v=vs.85)
  public static DirectSoundEnumerateW(pDSEnumCallback: LPDSENUMCALLBACKW, pContext: OPTIONAL<LPVOID>): HRESULT {
    return DSound.Load('DirectSoundEnumerateW')(pDSEnumCallback, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/devnotes/directsoundfullduplexcreate
  public static DirectSoundFullDuplexCreate(
    pcGuidCaptureDevice: OPTIONAL<LPCGUID>,
    pcGuidRenderDevice: OPTIONAL<LPCGUID>,
    pcDSCBufferDesc: LPCDSCBUFFERDESC,
    pcDSBufferDesc: LPCDSBUFFERDESC,
    hWnd: HWND,
    dwLevel: DWORD,
    ppDSFD_out: LPLPVOID,
    ppDSCBuffer8_out: LPLPVOID,
    ppDSBuffer8_out: LPLPVOID,
    pUnkOuter: NULL,
  ): HRESULT {
    return DSound.Load('DirectSoundFullDuplexCreate')(pcGuidCaptureDevice, pcGuidRenderDevice, pcDSCBufferDesc, pcDSBufferDesc, hWnd, dwLevel, ppDSFD_out, ppDSCBuffer8_out, ppDSBuffer8_out, pUnkOuter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllcanunloadnow
  public static DllCanUnloadNow(): HRESULT {
    return DSound.Load('DllCanUnloadNow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllgetclassobject
  public static DllGetClassObject(rclsid: REFCLSID, riid: REFIID, ppv_out: LPLPVOID): HRESULT {
    return DSound.Load('DllGetClassObject')(rclsid, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/previous-versions/windows/desktop/ee417724(v=vs.85)
  public static GetDeviceID(pGuidSrc: OPTIONAL<LPCGUID>, pGuidDest_out: LPGUID): HRESULT {
    return DSound.Load('GetDeviceID')(pGuidSrc, pGuidDest_out);
  }
}

export default DSound;
