import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { BOOL, DWORD, FLOAT, HWND, INT, LPDWORD, LPRECT, MagImageScalingCallback, NULL, Nullable, PBOOL, PFLOAT, PHWND, PINT, PMAGCOLOREFFECT, PMAGTRANSFORM, PRECT, RECT } from '../types/Magnification';

/**
 * Thin, lazy-loaded FFI bindings for `magnification.dll`.
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
 * import Magnification from './structs/Magnification';
 *
 * // Lazy: bind on first call
 * Magnification.MagInitialize();
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Magnification.Preload(['MagInitialize', 'MagSetFullscreenColorEffect']);
 * ```
 */
class Magnification extends Win32 {
  protected static override name = 'magnification.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    MagGetColorEffect: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    MagGetFullscreenColorEffect: { args: [FFIType.ptr], returns: FFIType.i32 },
    MagGetFullscreenTransform: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MagGetImageScalingCallback: { args: [FFIType.u64], returns: FFIType.ptr },
    MagGetInputTransform: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MagGetWindowFilterList: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    MagGetWindowSource: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    MagGetWindowTransform: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    MagInitialize: { args: [], returns: FFIType.i32 },
    MagSetColorEffect: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    MagSetFullscreenColorEffect: { args: [FFIType.ptr], returns: FFIType.i32 },
    MagSetFullscreenTransform: { args: [FFIType.f32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    MagSetImageScalingCallback: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    MagSetInputTransform: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MagSetWindowFilterList: { args: [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    MagSetWindowSource: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    MagSetWindowTransform: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    MagShowSystemCursor: { args: [FFIType.i32], returns: FFIType.i32 },
    MagUninitialize: { args: [], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/magnification/nf-magnification-maggetcoloreffect
  public static MagGetColorEffect(hwnd: HWND, pEffect_out: PMAGCOLOREFFECT): BOOL {
    return Magnification.Load('MagGetColorEffect')(hwnd, pEffect_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/magnification/nf-magnification-maggetfullscreencoloreffect
  public static MagGetFullscreenColorEffect(pEffect_out: PMAGCOLOREFFECT): BOOL {
    return Magnification.Load('MagGetFullscreenColorEffect')(pEffect_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/magnification/nf-magnification-maggetfullscreentransform
  public static MagGetFullscreenTransform(pMagLevel_out: PFLOAT, pxOffset_out: PINT, pyOffset_out: PINT): BOOL {
    return Magnification.Load('MagGetFullscreenTransform')(pMagLevel_out, pxOffset_out, pyOffset_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/magnification/nf-magnification-maggetimagescalingcallback
  public static MagGetImageScalingCallback(hwnd: HWND): MagImageScalingCallback | NULL {
    return Magnification.Load('MagGetImageScalingCallback')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/magnification/nf-magnification-maggetinputtransform
  public static MagGetInputTransform(pfEnabled_out: PBOOL, pRectSource_out: LPRECT, pRectDest_out: LPRECT): BOOL {
    return Magnification.Load('MagGetInputTransform')(pfEnabled_out, pRectSource_out, pRectDest_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/magnification/nf-magnification-maggetwindowfilterlist
  public static MagGetWindowFilterList(hwnd: HWND, pdwFilterMode_out: LPDWORD, count: INT, pHWND_out: PHWND): INT {
    return Magnification.Load('MagGetWindowFilterList')(hwnd, pdwFilterMode_out, count, pHWND_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/magnification/nf-magnification-maggetwindowsource
  public static MagGetWindowSource(hwnd: HWND, pRect_out: PRECT): BOOL {
    return Magnification.Load('MagGetWindowSource')(hwnd, pRect_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/magnification/nf-magnification-maggetwindowtransform
  public static MagGetWindowTransform(hwnd: HWND, pTransform_out: PMAGTRANSFORM): BOOL {
    return Magnification.Load('MagGetWindowTransform')(hwnd, pTransform_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/magnification/nf-magnification-maginitialize
  public static MagInitialize(): BOOL {
    return Magnification.Load('MagInitialize')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/magnification/nf-magnification-magsetcoloreffect
  public static MagSetColorEffect(hwnd: HWND, pEffect: Nullable<PMAGCOLOREFFECT>): BOOL {
    return Magnification.Load('MagSetColorEffect')(hwnd, pEffect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/magnification/nf-magnification-magsetfullscreencoloreffect
  public static MagSetFullscreenColorEffect(pEffect: PMAGCOLOREFFECT): BOOL {
    return Magnification.Load('MagSetFullscreenColorEffect')(pEffect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/magnification/nf-magnification-magsetfullscreentransform
  public static MagSetFullscreenTransform(magLevel: FLOAT, xOffset: INT, yOffset: INT): BOOL {
    return Magnification.Load('MagSetFullscreenTransform')(magLevel, xOffset, yOffset);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/magnification/nf-magnification-magsetimagescalingcallback
  public static MagSetImageScalingCallback(hwnd: HWND, callback: Nullable<MagImageScalingCallback>): BOOL {
    return Magnification.Load('MagSetImageScalingCallback')(hwnd, callback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/magnification/nf-magnification-magsetinputtransform
  public static MagSetInputTransform(fEnabled: BOOL, pRectSource: LPRECT, pRectDest: LPRECT): BOOL {
    return Magnification.Load('MagSetInputTransform')(fEnabled, pRectSource, pRectDest);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/magnification/nf-magnification-magsetwindowfilterlist
  public static MagSetWindowFilterList(hwnd: HWND, dwFilterMode: DWORD, count: INT, pHWND: PHWND): BOOL {
    return Magnification.Load('MagSetWindowFilterList')(hwnd, dwFilterMode, count, pHWND);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/magnification/nf-magnification-magsetwindowsource
  public static MagSetWindowSource(hwnd: HWND, rect: RECT): BOOL {
    return Magnification.Load('MagSetWindowSource')(hwnd, rect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/magnification/nf-magnification-magsetwindowtransform
  public static MagSetWindowTransform(hwnd: HWND, pTransform: PMAGTRANSFORM): BOOL {
    return Magnification.Load('MagSetWindowTransform')(hwnd, pTransform);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/magnification/nf-magnification-magshowsystemcursor
  public static MagShowSystemCursor(fShowCursor: BOOL): BOOL {
    return Magnification.Load('MagShowSystemCursor')(fShowCursor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/magnification/nf-magnification-maguninitialize
  public static MagUninitialize(): BOOL {
    return Magnification.Load('MagUninitialize')();
  }
}

export default Magnification;
