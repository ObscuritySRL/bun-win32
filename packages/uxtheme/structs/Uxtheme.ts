import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  BP_BUFFERFORMAT,
  BYTE,
  COLORREF,
  DWORD,
  HANIMATIONBUFFER,
  HBITMAP,
  HBRUSH,
  HDC,
  HIMAGELIST,
  HINSTANCE,
  HPAINTBUFFER,
  HRESULT,
  HRGN,
  HTHEME,
  HWND,
  INT,
  LONG,
  LPCRECT,
  LPCWSTR,
  LPDWORD,
  LPRECT,
  LPVOID,
  LPWSTR,
  NULL,
  PACKED_POINT,
  PBP_ANIMATIONPARAMS,
  PBP_PAINTPARAMS,
  PCOLORREF,
  PDTBGOPTS,
  PDTTOPTS,
  PHBITMAP,
  PHDC,
  PHRGN,
  PINT,
  PINTLIST,
  PLOGFONTW,
  PMARGINS,
  PPOINT,
  PPROPERTYORIGIN,
  PPRGBQUAD,
  PPVOID,
  PSIZE,
  PTA_TIMINGFUNCTION,
  PTA_TRANSFORM,
  PTEXTMETRICW,
  PVOID,
  PWORD,
  TA_PROPERTY,
  THEMESIZE,
  UINT,
  ULONG,
  WINDOWTHEMEATTRIBUTETYPE,
} from '../types/Uxtheme';

/**
 * Thin, lazy-loaded FFI bindings for `uxtheme.dll`.
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
 * import Uxtheme from './structs/Uxtheme';
 *
 * // Lazy: bind on first call
 * const themeIsActive = Uxtheme.IsThemeActive();
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Uxtheme.Preload(['GetCurrentThemeName', 'IsThemeActive']);
 * ```
 */
class Uxtheme extends Win32 {
  protected static override readonly name = 'uxtheme.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    BeginBufferedAnimation: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    BeginBufferedPaint: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    BeginPanningFeedback: { args: [FFIType.u64], returns: FFIType.i32 },
    BufferedPaintClear: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    BufferedPaintInit: { args: [], returns: FFIType.i32 },
    BufferedPaintRenderAnimation: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    BufferedPaintSetAlpha: { args: [FFIType.u64, FFIType.ptr, FFIType.u8], returns: FFIType.i32 },
    BufferedPaintStopAllAnimations: { args: [FFIType.u64], returns: FFIType.i32 },
    BufferedPaintUnInit: { args: [], returns: FFIType.i32 },
    CloseThemeData: { args: [FFIType.u64], returns: FFIType.i32 },
    DrawThemeBackground: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DrawThemeBackgroundEx: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DrawThemeEdge: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    DrawThemeIcon: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    DrawThemeParentBackground: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    DrawThemeParentBackgroundEx: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    DrawThemeText: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    DrawThemeTextEx: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnableThemeDialogTexture: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    EnableTheming: { args: [FFIType.i32], returns: FFIType.i32 },
    EndBufferedAnimation: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    EndBufferedPaint: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    EndPanningFeedback: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GetBufferedPaintBits: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetBufferedPaintDC: { args: [FFIType.u64], returns: FFIType.u64 },
    GetBufferedPaintTargetDC: { args: [FFIType.u64], returns: FFIType.u64 },
    GetBufferedPaintTargetRect: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetCurrentThemeName: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetThemeAnimationProperty: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetThemeAnimationTransform: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetThemeAppProperties: { args: [], returns: FFIType.u32 },
    GetThemeBackgroundContentRect: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetThemeBackgroundExtent: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetThemeBackgroundRegion: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetThemeBitmap: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetThemeBool: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetThemeColor: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetThemeDocumentationProperty: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetThemeEnumValue: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetThemeFilename: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetThemeFont: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetThemeInt: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetThemeIntList: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetThemeMargins: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetThemeMetric: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetThemePartSize: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetThemePosition: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetThemePropertyOrigin: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetThemeRect: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetThemeStream: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GetThemeString: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetThemeSysBool: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GetThemeSysColor: { args: [FFIType.u64, FFIType.i32], returns: FFIType.u32 },
    GetThemeSysColorBrush: { args: [FFIType.u64, FFIType.i32], returns: FFIType.u64 },
    GetThemeSysFont: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetThemeSysInt: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetThemeSysSize: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GetThemeSysString: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetThemeTextExtent: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetThemeTextMetrics: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetThemeTimingFunction: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetThemeTransitionDuration: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetWindowTheme: { args: [FFIType.u64], returns: FFIType.u64 },
    HitTestThemeBackground: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IsAppThemed: { args: [], returns: FFIType.i32 },
    IsCompositionActive: { args: [], returns: FFIType.i32 },
    IsThemeActive: { args: [], returns: FFIType.i32 },
    IsThemeBackgroundPartiallyTransparent: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    IsThemeDialogTextureEnabled: { args: [FFIType.u64], returns: FFIType.i32 },
    IsThemePartDefined: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    OpenThemeData: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    OpenThemeDataEx: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    OpenThemeDataForDpi: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    SetThemeAppProperties: { args: [FFIType.u32], returns: FFIType.void },
    SetWindowTheme: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetWindowThemeAttribute: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UpdatePanningFeedback: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-beginbufferedanimation
  public static BeginBufferedAnimation(hwnd: HWND, hdcTarget: HDC, prcTarget: LPCRECT, dwFormat: BP_BUFFERFORMAT, pPaintParams: PBP_PAINTPARAMS | NULL, pAnimationParams: PBP_ANIMATIONPARAMS, phdcFrom: PHDC, phdcTo: PHDC): HANIMATIONBUFFER {
    return Uxtheme.Load('BeginBufferedAnimation')(hwnd, hdcTarget, prcTarget, dwFormat, pPaintParams, pAnimationParams, phdcFrom, phdcTo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-beginbufferedpaint
  public static BeginBufferedPaint(hdcTarget: HDC, prcTarget: LPCRECT, dwFormat: BP_BUFFERFORMAT, pPaintParams: PBP_PAINTPARAMS | NULL, phdc: PHDC): HPAINTBUFFER {
    return Uxtheme.Load('BeginBufferedPaint')(hdcTarget, prcTarget, dwFormat, pPaintParams, phdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-beginpanningfeedback
  public static BeginPanningFeedback(hwnd: HWND): BOOL {
    return Uxtheme.Load('BeginPanningFeedback')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-bufferedpaintclear
  public static BufferedPaintClear(hBufferedPaint: HPAINTBUFFER, prc: LPCRECT | NULL): HRESULT {
    return Uxtheme.Load('BufferedPaintClear')(hBufferedPaint, prc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-bufferedpaintinit
  public static BufferedPaintInit(): HRESULT {
    return Uxtheme.Load('BufferedPaintInit')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-bufferedpaintrenderanimation
  public static BufferedPaintRenderAnimation(hwnd: HWND, hdcTarget: HDC): BOOL {
    return Uxtheme.Load('BufferedPaintRenderAnimation')(hwnd, hdcTarget);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-bufferedpaintsetalpha
  public static BufferedPaintSetAlpha(hBufferedPaint: HPAINTBUFFER, prc: LPCRECT | NULL, alpha: BYTE): HRESULT {
    return Uxtheme.Load('BufferedPaintSetAlpha')(hBufferedPaint, prc, alpha);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-bufferedpaintstopallanimations
  public static BufferedPaintStopAllAnimations(hwnd: HWND): HRESULT {
    return Uxtheme.Load('BufferedPaintStopAllAnimations')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-bufferedpaintuninit
  public static BufferedPaintUnInit(): HRESULT {
    return Uxtheme.Load('BufferedPaintUnInit')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-closethemedata
  public static CloseThemeData(hTheme: HTHEME): HRESULT {
    return Uxtheme.Load('CloseThemeData')(hTheme);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-drawthemebackground
  public static DrawThemeBackground(hTheme: HTHEME, hdc: HDC, iPartId: INT, iStateId: INT, pRect: LPCRECT, pClipRect: LPCRECT | NULL): HRESULT {
    return Uxtheme.Load('DrawThemeBackground')(hTheme, hdc, iPartId, iStateId, pRect, pClipRect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-drawthemebackgroundex
  public static DrawThemeBackgroundEx(hTheme: HTHEME, hdc: HDC, iPartId: INT, iStateId: INT, pRect: LPCRECT, pOptions: PDTBGOPTS | NULL): HRESULT {
    return Uxtheme.Load('DrawThemeBackgroundEx')(hTheme, hdc, iPartId, iStateId, pRect, pOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-drawthemeedge
  public static DrawThemeEdge(hTheme: HTHEME, hdc: HDC, iPartId: INT, iStateId: INT, pDestRect: LPCRECT, uEdge: UINT, uFlags: UINT, pContentRect: LPRECT | NULL): HRESULT {
    return Uxtheme.Load('DrawThemeEdge')(hTheme, hdc, iPartId, iStateId, pDestRect, uEdge, uFlags, pContentRect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-drawthemeicon
  public static DrawThemeIcon(hTheme: HTHEME, hdc: HDC, iPartId: INT, iStateId: INT, pRect: LPCRECT, himl: HIMAGELIST, iImageIndex: INT): HRESULT {
    return Uxtheme.Load('DrawThemeIcon')(hTheme, hdc, iPartId, iStateId, pRect, himl, iImageIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-drawthemeparentbackground
  public static DrawThemeParentBackground(hwnd: HWND, hdc: HDC, prc: LPCRECT | NULL): HRESULT {
    return Uxtheme.Load('DrawThemeParentBackground')(hwnd, hdc, prc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-drawthemeparentbackgroundex
  public static DrawThemeParentBackgroundEx(hwnd: HWND, hdc: HDC, dwFlags: DWORD, prc: LPCRECT | NULL): HRESULT {
    return Uxtheme.Load('DrawThemeParentBackgroundEx')(hwnd, hdc, dwFlags, prc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-drawthemetext
  public static DrawThemeText(hTheme: HTHEME, hdc: HDC, iPartId: INT, iStateId: INT, pszText: LPCWSTR, cchText: INT, dwTextFlags: DWORD, dwTextFlags2: DWORD, pRect: LPCRECT): HRESULT {
    return Uxtheme.Load('DrawThemeText')(hTheme, hdc, iPartId, iStateId, pszText, cchText, dwTextFlags, dwTextFlags2, pRect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-drawthemetextex
  public static DrawThemeTextEx(hTheme: HTHEME, hdc: HDC, iPartId: INT, iStateId: INT, pszText: LPCWSTR, cchText: INT, dwTextFlags: DWORD, pRect: LPRECT, pOptions: PDTTOPTS | NULL): HRESULT {
    return Uxtheme.Load('DrawThemeTextEx')(hTheme, hdc, iPartId, iStateId, pszText, cchText, dwTextFlags, pRect, pOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-enablethemedialogtexture
  public static EnableThemeDialogTexture(hwnd: HWND, dwFlags: DWORD): HRESULT {
    return Uxtheme.Load('EnableThemeDialogTexture')(hwnd, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-enabletheming
  public static EnableTheming(fEnable: BOOL): HRESULT {
    return Uxtheme.Load('EnableTheming')(fEnable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-endbufferedanimation
  public static EndBufferedAnimation(hbpAnimation: HANIMATIONBUFFER, fUpdateTarget: BOOL): HRESULT {
    return Uxtheme.Load('EndBufferedAnimation')(hbpAnimation, fUpdateTarget);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-endbufferedpaint
  public static EndBufferedPaint(hBufferedPaint: HPAINTBUFFER, fUpdateTarget: BOOL): HRESULT {
    return Uxtheme.Load('EndBufferedPaint')(hBufferedPaint, fUpdateTarget);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-endpanningfeedback
  public static EndPanningFeedback(hwnd: HWND, fAnimateBack: BOOL): BOOL {
    return Uxtheme.Load('EndPanningFeedback')(hwnd, fAnimateBack);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getbufferedpaintbits
  public static GetBufferedPaintBits(hBufferedPaint: HPAINTBUFFER, ppbBuffer: PPRGBQUAD, pcxRow: PINT): HRESULT {
    return Uxtheme.Load('GetBufferedPaintBits')(hBufferedPaint, ppbBuffer, pcxRow);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getbufferedpaintdc
  public static GetBufferedPaintDC(hBufferedPaint: HPAINTBUFFER): HDC {
    return Uxtheme.Load('GetBufferedPaintDC')(hBufferedPaint);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getbufferedpainttargetdc
  public static GetBufferedPaintTargetDC(hBufferedPaint: HPAINTBUFFER): HDC {
    return Uxtheme.Load('GetBufferedPaintTargetDC')(hBufferedPaint);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getbufferedpainttargetrect
  public static GetBufferedPaintTargetRect(hBufferedPaint: HPAINTBUFFER, prc: LPRECT): HRESULT {
    return Uxtheme.Load('GetBufferedPaintTargetRect')(hBufferedPaint, prc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getcurrentthemename
  public static GetCurrentThemeName(pszThemeFileName: LPWSTR, cchMaxNameChars: INT, pszColorBuff: LPWSTR | NULL, cchMaxColorChars: INT, pszSizeBuff: LPWSTR | NULL, cchMaxSizeChars: INT): HRESULT {
    return Uxtheme.Load('GetCurrentThemeName')(pszThemeFileName, cchMaxNameChars, pszColorBuff, cchMaxColorChars, pszSizeBuff, cchMaxSizeChars);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemeanimationproperty
  public static GetThemeAnimationProperty(hTheme: HTHEME, iStoryboardId: INT, iTargetId: INT, eProperty: TA_PROPERTY, pvProperty: LPVOID | NULL, cbSize: DWORD, pcbSizeOut: LPDWORD): HRESULT {
    return Uxtheme.Load('GetThemeAnimationProperty')(hTheme, iStoryboardId, iTargetId, eProperty, pvProperty, cbSize, pcbSizeOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemeanimationtransform
  public static GetThemeAnimationTransform(hTheme: HTHEME, iStoryboardId: INT, iTargetId: INT, dwTransformIndex: DWORD, pTransform: PTA_TRANSFORM | NULL, cbSize: DWORD, pcbSizeOut: LPDWORD): HRESULT {
    return Uxtheme.Load('GetThemeAnimationTransform')(hTheme, iStoryboardId, iTargetId, dwTransformIndex, pTransform, cbSize, pcbSizeOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemeappproperties
  public static GetThemeAppProperties(): DWORD {
    return Uxtheme.Load('GetThemeAppProperties')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemebackgroundcontentrect
  public static GetThemeBackgroundContentRect(hTheme: HTHEME, hdc: HDC | 0n, iPartId: INT, iStateId: INT, pBoundingRect: LPCRECT, pContentRect: LPRECT): HRESULT {
    return Uxtheme.Load('GetThemeBackgroundContentRect')(hTheme, hdc, iPartId, iStateId, pBoundingRect, pContentRect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemebackgroundextent
  public static GetThemeBackgroundExtent(hTheme: HTHEME, hdc: HDC | 0n, iPartId: INT, iStateId: INT, pContentRect: LPCRECT, pExtentRect: LPRECT): HRESULT {
    return Uxtheme.Load('GetThemeBackgroundExtent')(hTheme, hdc, iPartId, iStateId, pContentRect, pExtentRect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemebackgroundregion
  public static GetThemeBackgroundRegion(hTheme: HTHEME, hdc: HDC | 0n, iPartId: INT, iStateId: INT, pRect: LPCRECT, pRegion: PHRGN): HRESULT {
    return Uxtheme.Load('GetThemeBackgroundRegion')(hTheme, hdc, iPartId, iStateId, pRect, pRegion);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemebitmap
  public static GetThemeBitmap(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, dwFlags: ULONG, phBitmap: PHBITMAP): HRESULT {
    return Uxtheme.Load('GetThemeBitmap')(hTheme, iPartId, iStateId, iPropId, dwFlags, phBitmap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemebool
  public static GetThemeBool(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, pfVal: LPVOID): HRESULT {
    return Uxtheme.Load('GetThemeBool')(hTheme, iPartId, iStateId, iPropId, pfVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemecolor
  public static GetThemeColor(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, pColor: PCOLORREF): HRESULT {
    return Uxtheme.Load('GetThemeColor')(hTheme, iPartId, iStateId, iPropId, pColor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemedocumentationproperty
  public static GetThemeDocumentationProperty(pszThemeName: LPCWSTR, pszPropertyName: LPCWSTR, pszValueBuff: LPWSTR, cchMaxValChars: INT): HRESULT {
    return Uxtheme.Load('GetThemeDocumentationProperty')(pszThemeName, pszPropertyName, pszValueBuff, cchMaxValChars);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemeenumvalue
  public static GetThemeEnumValue(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, piVal: PINT): HRESULT {
    return Uxtheme.Load('GetThemeEnumValue')(hTheme, iPartId, iStateId, iPropId, piVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemefilename
  public static GetThemeFilename(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, pszThemeFileName: LPWSTR, cchMaxBuffChars: INT): HRESULT {
    return Uxtheme.Load('GetThemeFilename')(hTheme, iPartId, iStateId, iPropId, pszThemeFileName, cchMaxBuffChars);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemefont
  public static GetThemeFont(hTheme: HTHEME, hdc: HDC | 0n, iPartId: INT, iStateId: INT, iPropId: INT, pFont: PLOGFONTW): HRESULT {
    return Uxtheme.Load('GetThemeFont')(hTheme, hdc, iPartId, iStateId, iPropId, pFont);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemeint
  public static GetThemeInt(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, piVal: PINT): HRESULT {
    return Uxtheme.Load('GetThemeInt')(hTheme, iPartId, iStateId, iPropId, piVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemeintlist
  public static GetThemeIntList(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, pIntList: PINTLIST): HRESULT {
    return Uxtheme.Load('GetThemeIntList')(hTheme, iPartId, iStateId, iPropId, pIntList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthememargins
  public static GetThemeMargins(hTheme: HTHEME, hdc: HDC | 0n, iPartId: INT, iStateId: INT, iPropId: INT, prc: LPCRECT | NULL, pMargins: PMARGINS): HRESULT {
    return Uxtheme.Load('GetThemeMargins')(hTheme, hdc, iPartId, iStateId, iPropId, prc, pMargins);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthememetric
  public static GetThemeMetric(hTheme: HTHEME, hdc: HDC | 0n, iPartId: INT, iStateId: INT, iPropId: INT, piVal: PINT): HRESULT {
    return Uxtheme.Load('GetThemeMetric')(hTheme, hdc, iPartId, iStateId, iPropId, piVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemepartsize
  public static GetThemePartSize(hTheme: HTHEME, hdc: HDC | 0n, iPartId: INT, iStateId: INT, prc: LPCRECT | NULL, eSize: THEMESIZE, psz: PSIZE): HRESULT {
    return Uxtheme.Load('GetThemePartSize')(hTheme, hdc, iPartId, iStateId, prc, eSize, psz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemeposition
  public static GetThemePosition(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, pPoint: PPOINT): HRESULT {
    return Uxtheme.Load('GetThemePosition')(hTheme, iPartId, iStateId, iPropId, pPoint);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemepropertyorigin
  public static GetThemePropertyOrigin(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, pOrigin: PPROPERTYORIGIN): HRESULT {
    return Uxtheme.Load('GetThemePropertyOrigin')(hTheme, iPartId, iStateId, iPropId, pOrigin);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemerect
  public static GetThemeRect(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, pRect: LPRECT): HRESULT {
    return Uxtheme.Load('GetThemeRect')(hTheme, iPartId, iStateId, iPropId, pRect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemestream
  public static GetThemeStream(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, ppvStream: PPVOID, pcbStream: LPDWORD | NULL, hInst: HINSTANCE | 0n): HRESULT {
    return Uxtheme.Load('GetThemeStream')(hTheme, iPartId, iStateId, iPropId, ppvStream, pcbStream, hInst);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemestring
  public static GetThemeString(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, pszBuff: LPWSTR, cchMaxBuffChars: INT): HRESULT {
    return Uxtheme.Load('GetThemeString')(hTheme, iPartId, iStateId, iPropId, pszBuff, cchMaxBuffChars);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemesysbool
  public static GetThemeSysBool(hTheme: HTHEME | 0n, iBoolId: INT): BOOL {
    return Uxtheme.Load('GetThemeSysBool')(hTheme, iBoolId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemesyscolor
  public static GetThemeSysColor(hTheme: HTHEME | 0n, iColorId: INT): COLORREF {
    return Uxtheme.Load('GetThemeSysColor')(hTheme, iColorId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemesyscolorbrush
  public static GetThemeSysColorBrush(hTheme: HTHEME | 0n, iColorId: INT): HBRUSH {
    return Uxtheme.Load('GetThemeSysColorBrush')(hTheme, iColorId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemesysfont
  public static GetThemeSysFont(hTheme: HTHEME | 0n, iFontId: INT, plf: PLOGFONTW): HRESULT {
    return Uxtheme.Load('GetThemeSysFont')(hTheme, iFontId, plf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemesysint
  public static GetThemeSysInt(hTheme: HTHEME, iIntId: INT, piValue: PINT): HRESULT {
    return Uxtheme.Load('GetThemeSysInt')(hTheme, iIntId, piValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemesyssize
  public static GetThemeSysSize(hTheme: HTHEME | 0n, iSizeId: INT): INT {
    return Uxtheme.Load('GetThemeSysSize')(hTheme, iSizeId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemesysstring
  public static GetThemeSysString(hTheme: HTHEME, iStringId: INT, pszStringBuff: LPWSTR, cchMaxStringChars: INT): HRESULT {
    return Uxtheme.Load('GetThemeSysString')(hTheme, iStringId, pszStringBuff, cchMaxStringChars);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemetextextent
  public static GetThemeTextExtent(hTheme: HTHEME, hdc: HDC, iPartId: INT, iStateId: INT, pszText: LPCWSTR, cchCharCount: INT, dwTextFlags: DWORD, pBoundingRect: LPCRECT | NULL, pExtentRect: LPRECT): HRESULT {
    return Uxtheme.Load('GetThemeTextExtent')(hTheme, hdc, iPartId, iStateId, pszText, cchCharCount, dwTextFlags, pBoundingRect, pExtentRect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemetextmetrics
  public static GetThemeTextMetrics(hTheme: HTHEME, hdc: HDC, iPartId: INT, iStateId: INT, ptm: PTEXTMETRICW): HRESULT {
    return Uxtheme.Load('GetThemeTextMetrics')(hTheme, hdc, iPartId, iStateId, ptm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemetimingfunction
  public static GetThemeTimingFunction(hTheme: HTHEME, iTimingFunctionId: INT, pTimingFunction: PTA_TIMINGFUNCTION | NULL, cbSize: DWORD, pcbSizeOut: LPDWORD): HRESULT {
    return Uxtheme.Load('GetThemeTimingFunction')(hTheme, iTimingFunctionId, pTimingFunction, cbSize, pcbSizeOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemetransitionduration
  public static GetThemeTransitionDuration(hTheme: HTHEME, iPartId: INT, iStateIdFrom: INT, iStateIdTo: INT, iPropId: INT, pdwDuration: LPDWORD): HRESULT {
    return Uxtheme.Load('GetThemeTransitionDuration')(hTheme, iPartId, iStateIdFrom, iStateIdTo, iPropId, pdwDuration);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getwindowtheme
  public static GetWindowTheme(hwnd: HWND): HTHEME {
    return Uxtheme.Load('GetWindowTheme')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-hittestthemebackground
  public static HitTestThemeBackground(hTheme: HTHEME, hdc: HDC | 0n, iPartId: INT, iStateId: INT, dwOptions: DWORD, pRect: LPCRECT, hrgn: HRGN | 0n, ptTest: PACKED_POINT, pwHitTestCode: PWORD): HRESULT {
    return Uxtheme.Load('HitTestThemeBackground')(hTheme, hdc, iPartId, iStateId, dwOptions, pRect, hrgn, ptTest, pwHitTestCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-isappthemed
  public static IsAppThemed(): BOOL {
    return Uxtheme.Load('IsAppThemed')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-iscompositionactive
  public static IsCompositionActive(): BOOL {
    return Uxtheme.Load('IsCompositionActive')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-isthemeactive
  public static IsThemeActive(): BOOL {
    return Uxtheme.Load('IsThemeActive')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-isthemebackgroundpartiallytransparent
  public static IsThemeBackgroundPartiallyTransparent(hTheme: HTHEME, iPartId: INT, iStateId: INT): BOOL {
    return Uxtheme.Load('IsThemeBackgroundPartiallyTransparent')(hTheme, iPartId, iStateId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-isthemedialogtextureenabled
  public static IsThemeDialogTextureEnabled(hwnd: HWND): BOOL {
    return Uxtheme.Load('IsThemeDialogTextureEnabled')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-isthemepartdefined
  public static IsThemePartDefined(hTheme: HTHEME, iPartId: INT, iStateId: INT): BOOL {
    return Uxtheme.Load('IsThemePartDefined')(hTheme, iPartId, iStateId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-openthemedata
  public static OpenThemeData(hwnd: HWND | 0n, pszClassList: LPCWSTR): HTHEME {
    return Uxtheme.Load('OpenThemeData')(hwnd, pszClassList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-openthemedataex
  public static OpenThemeDataEx(hwnd: HWND | 0n, pszClassList: LPCWSTR, dwFlags: DWORD): HTHEME {
    return Uxtheme.Load('OpenThemeDataEx')(hwnd, pszClassList, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-openthemedatafordpi
  public static OpenThemeDataForDpi(hwnd: HWND | 0n, pszClassList: LPCWSTR, dpi: UINT): HTHEME {
    return Uxtheme.Load('OpenThemeDataForDpi')(hwnd, pszClassList, dpi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-setthemeappproperties
  public static SetThemeAppProperties(dwFlags: DWORD): void {
    return Uxtheme.Load('SetThemeAppProperties')(dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-setwindowtheme
  public static SetWindowTheme(hwnd: HWND, pszSubAppName: LPCWSTR | NULL, pszSubIdList: LPCWSTR | NULL): HRESULT {
    return Uxtheme.Load('SetWindowTheme')(hwnd, pszSubAppName, pszSubIdList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-setwindowthemeattribute
  public static SetWindowThemeAttribute(hwnd: HWND, eAttribute: WINDOWTHEMEATTRIBUTETYPE, pvAttribute: PVOID, cbAttribute: DWORD): HRESULT {
    return Uxtheme.Load('SetWindowThemeAttribute')(hwnd, eAttribute, pvAttribute, cbAttribute);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-updatepanningfeedback
  public static UpdatePanningFeedback(hwnd: HWND, lTotalOverpanOffsetX: LONG, lTotalOverpanOffsetY: LONG, fInInertia: BOOL): BOOL {
    return Uxtheme.Load('UpdatePanningFeedback')(hwnd, lTotalOverpanOffsetX, lTotalOverpanOffsetY, fInInertia);
  }
}

export default Uxtheme;
