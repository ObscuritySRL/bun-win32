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
  Optional,
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
  public static BeginBufferedAnimation(
    hwnd: HWND,
    hdcTarget: HDC,
    prcTarget: LPCRECT,
    dwFormat: BP_BUFFERFORMAT,
    pPaintParams: Optional<PBP_PAINTPARAMS>,
    pAnimationParams: PBP_ANIMATIONPARAMS,
    phdcFrom_out: PHDC,
    phdcTo_out: PHDC,
  ): HANIMATIONBUFFER {
    return Uxtheme.Load('BeginBufferedAnimation')(hwnd, hdcTarget, prcTarget, dwFormat, pPaintParams, pAnimationParams, phdcFrom_out, phdcTo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-beginbufferedpaint
  public static BeginBufferedPaint(hdcTarget: HDC, prcTarget: LPCRECT, dwFormat: BP_BUFFERFORMAT, pPaintParams: Optional<PBP_PAINTPARAMS>, phdc_out: PHDC): HPAINTBUFFER {
    return Uxtheme.Load('BeginBufferedPaint')(hdcTarget, prcTarget, dwFormat, pPaintParams, phdc_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-beginpanningfeedback
  public static BeginPanningFeedback(hwnd: HWND): BOOL {
    return Uxtheme.Load('BeginPanningFeedback')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-bufferedpaintclear
  public static BufferedPaintClear(hBufferedPaint: HPAINTBUFFER, prc: Optional<LPCRECT>): HRESULT {
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
  public static BufferedPaintSetAlpha(hBufferedPaint: HPAINTBUFFER, prc: Optional<LPCRECT>, alpha: BYTE): HRESULT {
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
  public static DrawThemeBackground(hTheme: HTHEME, hdc: HDC, iPartId: INT, iStateId: INT, pRect: LPCRECT, pClipRect: Optional<LPCRECT>): HRESULT {
    return Uxtheme.Load('DrawThemeBackground')(hTheme, hdc, iPartId, iStateId, pRect, pClipRect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-drawthemebackgroundex
  public static DrawThemeBackgroundEx(hTheme: HTHEME, hdc: HDC, iPartId: INT, iStateId: INT, pRect: LPCRECT, pOptions: Optional<PDTBGOPTS>): HRESULT {
    return Uxtheme.Load('DrawThemeBackgroundEx')(hTheme, hdc, iPartId, iStateId, pRect, pOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-drawthemeedge
  public static DrawThemeEdge(hTheme: HTHEME, hdc: HDC, iPartId: INT, iStateId: INT, pDestRect: LPCRECT, uEdge: UINT, uFlags: UINT, pContentRect_out: Optional<LPRECT>): HRESULT {
    return Uxtheme.Load('DrawThemeEdge')(hTheme, hdc, iPartId, iStateId, pDestRect, uEdge, uFlags, pContentRect_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-drawthemeicon
  public static DrawThemeIcon(hTheme: HTHEME, hdc: HDC, iPartId: INT, iStateId: INT, pRect: LPCRECT, himl: HIMAGELIST, iImageIndex: INT): HRESULT {
    return Uxtheme.Load('DrawThemeIcon')(hTheme, hdc, iPartId, iStateId, pRect, himl, iImageIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-drawthemeparentbackground
  public static DrawThemeParentBackground(hwnd: HWND, hdc: HDC, prc: Optional<LPCRECT>): HRESULT {
    return Uxtheme.Load('DrawThemeParentBackground')(hwnd, hdc, prc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-drawthemeparentbackgroundex
  public static DrawThemeParentBackgroundEx(hwnd: HWND, hdc: HDC, dwFlags: DWORD, prc: Optional<LPCRECT>): HRESULT {
    return Uxtheme.Load('DrawThemeParentBackgroundEx')(hwnd, hdc, dwFlags, prc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-drawthemetext
  public static DrawThemeText(hTheme: HTHEME, hdc: HDC, iPartId: INT, iStateId: INT, pszText: LPCWSTR, cchText: INT, dwTextFlags: DWORD, dwTextFlags2: DWORD, pRect: LPCRECT): HRESULT {
    return Uxtheme.Load('DrawThemeText')(hTheme, hdc, iPartId, iStateId, pszText, cchText, dwTextFlags, dwTextFlags2, pRect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-drawthemetextex
  public static DrawThemeTextEx(hTheme: HTHEME, hdc: HDC, iPartId: INT, iStateId: INT, pszText: LPCWSTR, cchText: INT, dwTextFlags: DWORD, pRect_in_out: LPRECT, pOptions: Optional<PDTTOPTS>): HRESULT {
    return Uxtheme.Load('DrawThemeTextEx')(hTheme, hdc, iPartId, iStateId, pszText, cchText, dwTextFlags, pRect_in_out, pOptions);
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
  public static GetBufferedPaintBits(hBufferedPaint: HPAINTBUFFER, ppbBuffer_out: PPRGBQUAD, pcxRow_out: PINT): HRESULT {
    return Uxtheme.Load('GetBufferedPaintBits')(hBufferedPaint, ppbBuffer_out, pcxRow_out);
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
  public static GetBufferedPaintTargetRect(hBufferedPaint: HPAINTBUFFER, prc_out: LPRECT): HRESULT {
    return Uxtheme.Load('GetBufferedPaintTargetRect')(hBufferedPaint, prc_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getcurrentthemename
  public static GetCurrentThemeName(pszThemeFileName_out: LPWSTR, cchMaxNameChars: INT, pszColorBuff_out: Optional<LPWSTR>, cchMaxColorChars: INT, pszSizeBuff_out: Optional<LPWSTR>, cchMaxSizeChars: INT): HRESULT {
    return Uxtheme.Load('GetCurrentThemeName')(pszThemeFileName_out, cchMaxNameChars, pszColorBuff_out, cchMaxColorChars, pszSizeBuff_out, cchMaxSizeChars);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemeanimationproperty
  public static GetThemeAnimationProperty(hTheme: HTHEME, iStoryboardId: INT, iTargetId: INT, eProperty: TA_PROPERTY, pvProperty_out: Optional<LPVOID>, cbSize: DWORD, pcbSizeOut_out: LPDWORD): HRESULT {
    return Uxtheme.Load('GetThemeAnimationProperty')(hTheme, iStoryboardId, iTargetId, eProperty, pvProperty_out, cbSize, pcbSizeOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemeanimationtransform
  public static GetThemeAnimationTransform(hTheme: HTHEME, iStoryboardId: INT, iTargetId: INT, dwTransformIndex: DWORD, pTransform_out: Optional<PTA_TRANSFORM>, cbSize: DWORD, pcbSizeOut_out: LPDWORD): HRESULT {
    return Uxtheme.Load('GetThemeAnimationTransform')(hTheme, iStoryboardId, iTargetId, dwTransformIndex, pTransform_out, cbSize, pcbSizeOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemeappproperties
  public static GetThemeAppProperties(): DWORD {
    return Uxtheme.Load('GetThemeAppProperties')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemebackgroundcontentrect
  public static GetThemeBackgroundContentRect(hTheme: HTHEME, hdc: Optional<HDC>, iPartId: INT, iStateId: INT, pBoundingRect: LPCRECT, pContentRect_out: LPRECT): HRESULT {
    return Uxtheme.Load('GetThemeBackgroundContentRect')(hTheme, hdc, iPartId, iStateId, pBoundingRect, pContentRect_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemebackgroundextent
  public static GetThemeBackgroundExtent(hTheme: HTHEME, hdc: Optional<HDC>, iPartId: INT, iStateId: INT, pContentRect: LPCRECT, pExtentRect_out: LPRECT): HRESULT {
    return Uxtheme.Load('GetThemeBackgroundExtent')(hTheme, hdc, iPartId, iStateId, pContentRect, pExtentRect_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemebackgroundregion
  public static GetThemeBackgroundRegion(hTheme: HTHEME, hdc: Optional<HDC>, iPartId: INT, iStateId: INT, pRect: LPCRECT, pRegion_out: PHRGN): HRESULT {
    return Uxtheme.Load('GetThemeBackgroundRegion')(hTheme, hdc, iPartId, iStateId, pRect, pRegion_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemebitmap
  public static GetThemeBitmap(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, dwFlags: ULONG, phBitmap_out: PHBITMAP): HRESULT {
    return Uxtheme.Load('GetThemeBitmap')(hTheme, iPartId, iStateId, iPropId, dwFlags, phBitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemebool
  public static GetThemeBool(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, pfVal_out: LPVOID): HRESULT {
    return Uxtheme.Load('GetThemeBool')(hTheme, iPartId, iStateId, iPropId, pfVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemecolor
  public static GetThemeColor(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, pColor_out: PCOLORREF): HRESULT {
    return Uxtheme.Load('GetThemeColor')(hTheme, iPartId, iStateId, iPropId, pColor_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemedocumentationproperty
  public static GetThemeDocumentationProperty(pszThemeName: LPCWSTR, pszPropertyName: LPCWSTR, pszValueBuff_out: LPWSTR, cchMaxValChars: INT): HRESULT {
    return Uxtheme.Load('GetThemeDocumentationProperty')(pszThemeName, pszPropertyName, pszValueBuff_out, cchMaxValChars);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemeenumvalue
  public static GetThemeEnumValue(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, piVal_out: PINT): HRESULT {
    return Uxtheme.Load('GetThemeEnumValue')(hTheme, iPartId, iStateId, iPropId, piVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemefilename
  public static GetThemeFilename(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, pszThemeFileName_out: LPWSTR, cchMaxBuffChars: INT): HRESULT {
    return Uxtheme.Load('GetThemeFilename')(hTheme, iPartId, iStateId, iPropId, pszThemeFileName_out, cchMaxBuffChars);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemefont
  public static GetThemeFont(hTheme: HTHEME, hdc: Optional<HDC>, iPartId: INT, iStateId: INT, iPropId: INT, pFont_out: PLOGFONTW): HRESULT {
    return Uxtheme.Load('GetThemeFont')(hTheme, hdc, iPartId, iStateId, iPropId, pFont_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemeint
  public static GetThemeInt(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, piVal_out: PINT): HRESULT {
    return Uxtheme.Load('GetThemeInt')(hTheme, iPartId, iStateId, iPropId, piVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemeintlist
  public static GetThemeIntList(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, pIntList_out: PINTLIST): HRESULT {
    return Uxtheme.Load('GetThemeIntList')(hTheme, iPartId, iStateId, iPropId, pIntList_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthememargins
  public static GetThemeMargins(hTheme: HTHEME, hdc: Optional<HDC>, iPartId: INT, iStateId: INT, iPropId: INT, prc: Optional<LPCRECT>, pMargins_out: PMARGINS): HRESULT {
    return Uxtheme.Load('GetThemeMargins')(hTheme, hdc, iPartId, iStateId, iPropId, prc, pMargins_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthememetric
  public static GetThemeMetric(hTheme: HTHEME, hdc: Optional<HDC>, iPartId: INT, iStateId: INT, iPropId: INT, piVal_out: PINT): HRESULT {
    return Uxtheme.Load('GetThemeMetric')(hTheme, hdc, iPartId, iStateId, iPropId, piVal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemepartsize
  public static GetThemePartSize(hTheme: HTHEME, hdc: Optional<HDC>, iPartId: INT, iStateId: INT, prc: Optional<LPCRECT>, eSize: THEMESIZE, psz_out: PSIZE): HRESULT {
    return Uxtheme.Load('GetThemePartSize')(hTheme, hdc, iPartId, iStateId, prc, eSize, psz_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemeposition
  public static GetThemePosition(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, pPoint_out: PPOINT): HRESULT {
    return Uxtheme.Load('GetThemePosition')(hTheme, iPartId, iStateId, iPropId, pPoint_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemepropertyorigin
  public static GetThemePropertyOrigin(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, pOrigin_out: PPROPERTYORIGIN): HRESULT {
    return Uxtheme.Load('GetThemePropertyOrigin')(hTheme, iPartId, iStateId, iPropId, pOrigin_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemerect
  public static GetThemeRect(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, pRect_out: LPRECT): HRESULT {
    return Uxtheme.Load('GetThemeRect')(hTheme, iPartId, iStateId, iPropId, pRect_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemestream
  public static GetThemeStream(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, ppvStream_out: PPVOID, pcbStream_out: Optional<LPDWORD>, hInst: Optional<HINSTANCE>): HRESULT {
    return Uxtheme.Load('GetThemeStream')(hTheme, iPartId, iStateId, iPropId, ppvStream_out, pcbStream_out, hInst);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemestring
  public static GetThemeString(hTheme: HTHEME, iPartId: INT, iStateId: INT, iPropId: INT, pszBuff_out: LPWSTR, cchMaxBuffChars: INT): HRESULT {
    return Uxtheme.Load('GetThemeString')(hTheme, iPartId, iStateId, iPropId, pszBuff_out, cchMaxBuffChars);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemesysbool
  public static GetThemeSysBool(hTheme: Optional<HTHEME>, iBoolId: INT): BOOL {
    return Uxtheme.Load('GetThemeSysBool')(hTheme, iBoolId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemesyscolor
  public static GetThemeSysColor(hTheme: Optional<HTHEME>, iColorId: INT): COLORREF {
    return Uxtheme.Load('GetThemeSysColor')(hTheme, iColorId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemesyscolorbrush
  public static GetThemeSysColorBrush(hTheme: Optional<HTHEME>, iColorId: INT): HBRUSH {
    return Uxtheme.Load('GetThemeSysColorBrush')(hTheme, iColorId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemesysfont
  public static GetThemeSysFont(hTheme: Optional<HTHEME>, iFontId: INT, plf_out: PLOGFONTW): HRESULT {
    return Uxtheme.Load('GetThemeSysFont')(hTheme, iFontId, plf_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemesysint
  public static GetThemeSysInt(hTheme: HTHEME, iIntId: INT, piValue_out: PINT): HRESULT {
    return Uxtheme.Load('GetThemeSysInt')(hTheme, iIntId, piValue_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemesyssize
  public static GetThemeSysSize(hTheme: Optional<HTHEME>, iSizeId: INT): INT {
    return Uxtheme.Load('GetThemeSysSize')(hTheme, iSizeId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemesysstring
  public static GetThemeSysString(hTheme: HTHEME, iStringId: INT, pszStringBuff_out: LPWSTR, cchMaxStringChars: INT): HRESULT {
    return Uxtheme.Load('GetThemeSysString')(hTheme, iStringId, pszStringBuff_out, cchMaxStringChars);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemetextextent
  public static GetThemeTextExtent(hTheme: HTHEME, hdc: HDC, iPartId: INT, iStateId: INT, pszText: LPCWSTR, cchCharCount: INT, dwTextFlags: DWORD, pBoundingRect: Optional<LPCRECT>, pExtentRect_out: LPRECT): HRESULT {
    return Uxtheme.Load('GetThemeTextExtent')(hTheme, hdc, iPartId, iStateId, pszText, cchCharCount, dwTextFlags, pBoundingRect, pExtentRect_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemetextmetrics
  public static GetThemeTextMetrics(hTheme: HTHEME, hdc: HDC, iPartId: INT, iStateId: INT, ptm_out: PTEXTMETRICW): HRESULT {
    return Uxtheme.Load('GetThemeTextMetrics')(hTheme, hdc, iPartId, iStateId, ptm_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemetimingfunction
  public static GetThemeTimingFunction(hTheme: HTHEME, iTimingFunctionId: INT, pTimingFunction_out: Optional<PTA_TIMINGFUNCTION>, cbSize: DWORD, pcbSizeOut_out: LPDWORD): HRESULT {
    return Uxtheme.Load('GetThemeTimingFunction')(hTheme, iTimingFunctionId, pTimingFunction_out, cbSize, pcbSizeOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getthemetransitionduration
  public static GetThemeTransitionDuration(hTheme: HTHEME, iPartId: INT, iStateIdFrom: INT, iStateIdTo: INT, iPropId: INT, pdwDuration_out: LPDWORD): HRESULT {
    return Uxtheme.Load('GetThemeTransitionDuration')(hTheme, iPartId, iStateIdFrom, iStateIdTo, iPropId, pdwDuration_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-getwindowtheme
  public static GetWindowTheme(hwnd: HWND): HTHEME {
    return Uxtheme.Load('GetWindowTheme')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-hittestthemebackground
  public static HitTestThemeBackground(hTheme: HTHEME, hdc: Optional<HDC>, iPartId: INT, iStateId: INT, dwOptions: DWORD, pRect: LPCRECT, hrgn: Optional<HRGN>, ptTest: PACKED_POINT, pwHitTestCode_out: PWORD): HRESULT {
    return Uxtheme.Load('HitTestThemeBackground')(hTheme, hdc, iPartId, iStateId, dwOptions, pRect, hrgn, ptTest, pwHitTestCode_out);
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
  public static OpenThemeData(hwnd: Optional<HWND>, pszClassList: LPCWSTR): HTHEME {
    return Uxtheme.Load('OpenThemeData')(hwnd, pszClassList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-openthemedataex
  public static OpenThemeDataEx(hwnd: Optional<HWND>, pszClassList: LPCWSTR, dwFlags: DWORD): HTHEME {
    return Uxtheme.Load('OpenThemeDataEx')(hwnd, pszClassList, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-openthemedatafordpi
  public static OpenThemeDataForDpi(hwnd: Optional<HWND>, pszClassList: LPCWSTR, dpi: UINT): HTHEME {
    return Uxtheme.Load('OpenThemeDataForDpi')(hwnd, pszClassList, dpi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-setthemeappproperties
  public static SetThemeAppProperties(dwFlags: DWORD): void {
    return Uxtheme.Load('SetThemeAppProperties')(dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-setwindowtheme
  public static SetWindowTheme(hwnd: HWND, pszSubAppName: Optional<LPCWSTR>, pszSubIdList: Optional<LPCWSTR>): HRESULT {
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
