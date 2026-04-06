import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  DWORD,
  DWM_SHOWCONTACT,
  DWMTRANSITION_OWNEDWINDOW_TARGET,
  GESTURE_TYPE,
  HBITMAP,
  HRESULT,
  HTHUMBNAIL,
  HWND,
  INT,
  LPCVOID,
  LPBOOL,
  LPDWORD,
  LPARAM,
  NULL,
  PACKED_POINT,
  PDWM_BLURBEHIND,
  PDWM_PRESENT_PARAMETERS,
  PDWM_TAB_WINDOW_REQUIREMENTS,
  PDWM_THUMBNAIL_PROPERTIES,
  PDWM_TIMING_INFO,
  PHTHUMBNAIL,
  PLRESULT,
  PMARGINS,
  PPOINT,
  PSIZE,
  PVOID,
  UINT,
  WPARAM,
} from '../types/Dwmapi';

/**
 * Thin, lazy-loaded FFI bindings for `dwmapi.dll`.
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
 * import Dwmapi from './structs/Dwmapi';
 *
 * // Lazy: bind on first call
 * const result = Dwmapi.DwmIsCompositionEnabled(pEnabled.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Dwmapi.Preload(['DwmIsCompositionEnabled', 'DwmGetWindowAttribute', 'DwmSetWindowAttribute']);
 * ```
 */
class Dwmapi extends Win32 {
  protected static override name = 'dwmapi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DwmDefWindowProc: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    DwmEnableBlurBehindWindow: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    DwmEnableComposition: { args: [FFIType.u32], returns: FFIType.i32 },
    DwmEnableMMCSS: { args: [FFIType.i32], returns: FFIType.i32 },
    DwmExtendFrameIntoClientArea: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    DwmFlush: { args: [], returns: FFIType.i32 },
    DwmGetColorizationColor: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DwmGetCompositionTimingInfo: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    DwmGetTransportAttributes: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DwmGetUnmetTabRequirements: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    DwmGetWindowAttribute: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    DwmInvalidateIconicBitmaps: { args: [FFIType.u64], returns: FFIType.i32 },
    DwmIsCompositionEnabled: { args: [FFIType.ptr], returns: FFIType.i32 },
    DwmModifyPreviousDxFrameDuration: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    DwmQueryThumbnailSourceSize: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    DwmRegisterThumbnail: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    DwmRenderGesture: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DwmSetDxFrameDuration: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    DwmSetIconicLivePreviewBitmap: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    DwmSetIconicThumbnail: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    DwmSetPresentParameters: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    DwmSetWindowAttribute: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    DwmShowContact: { args: [FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    DwmTetherContact: { args: [FFIType.u32, FFIType.i32, FFIType.u64], returns: FFIType.i32 },
    DwmTransitionOwnedWindow: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    DwmUnregisterThumbnail: { args: [FFIType.u64], returns: FFIType.i32 },
    DwmUpdateThumbnailProperties: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmdefwindowproc
  public static DwmDefWindowProc(hWnd: HWND, msg: UINT, wParam: WPARAM, lParam: LPARAM, plResult: PLRESULT): BOOL {
    return Dwmapi.Load('DwmDefWindowProc')(hWnd, msg, wParam, lParam, plResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmenableblurbehindwindow
  public static DwmEnableBlurBehindWindow(hWnd: HWND, pBlurBehind: PDWM_BLURBEHIND): HRESULT {
    return Dwmapi.Load('DwmEnableBlurBehindWindow')(hWnd, pBlurBehind);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmenablecomposition
  public static DwmEnableComposition(uCompositionAction: UINT): HRESULT {
    return Dwmapi.Load('DwmEnableComposition')(uCompositionAction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmenablemmcss
  public static DwmEnableMMCSS(fEnableMMCSS: BOOL): HRESULT {
    return Dwmapi.Load('DwmEnableMMCSS')(fEnableMMCSS);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmextendframeintoclientarea
  public static DwmExtendFrameIntoClientArea(hWnd: HWND, pMarInset: PMARGINS): HRESULT {
    return Dwmapi.Load('DwmExtendFrameIntoClientArea')(hWnd, pMarInset);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmflush
  public static DwmFlush(): HRESULT {
    return Dwmapi.Load('DwmFlush')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmgetcolorizationcolor
  public static DwmGetColorizationColor(pcrColorization: LPDWORD, pfOpaqueBlend: LPBOOL): HRESULT {
    return Dwmapi.Load('DwmGetColorizationColor')(pcrColorization, pfOpaqueBlend);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmgetcompositiontiminginfo
  public static DwmGetCompositionTimingInfo(hwnd: HWND | 0n, pTimingInfo: PDWM_TIMING_INFO): HRESULT {
    return Dwmapi.Load('DwmGetCompositionTimingInfo')(hwnd, pTimingInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmgettransportattributes
  public static DwmGetTransportAttributes(pfIsRemoting: LPBOOL, pfIsConnected: LPBOOL, pDwGeneration: LPDWORD): HRESULT {
    return Dwmapi.Load('DwmGetTransportAttributes')(pfIsRemoting, pfIsConnected, pDwGeneration);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmgetunmettabrequirements
  public static DwmGetUnmetTabRequirements(appWindow: HWND | 0n, value: PDWM_TAB_WINDOW_REQUIREMENTS): HRESULT {
    return Dwmapi.Load('DwmGetUnmetTabRequirements')(appWindow, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmgetwindowattribute
  public static DwmGetWindowAttribute(hwnd: HWND, dwAttribute: DWORD, pvAttribute: PVOID, cbAttribute: DWORD): HRESULT {
    return Dwmapi.Load('DwmGetWindowAttribute')(hwnd, dwAttribute, pvAttribute, cbAttribute);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwminvalidateiconicbitmaps
  public static DwmInvalidateIconicBitmaps(hwnd: HWND): HRESULT {
    return Dwmapi.Load('DwmInvalidateIconicBitmaps')(hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmiscompositionenabled
  public static DwmIsCompositionEnabled(pfEnabled: LPBOOL): HRESULT {
    return Dwmapi.Load('DwmIsCompositionEnabled')(pfEnabled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmmodifypreviousdxframeduration
  public static DwmModifyPreviousDxFrameDuration(hwnd: HWND, cRefreshes: INT, fRelative: BOOL): HRESULT {
    return Dwmapi.Load('DwmModifyPreviousDxFrameDuration')(hwnd, cRefreshes, fRelative);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmquerythumbnailsourcesize
  public static DwmQueryThumbnailSourceSize(hThumbnail: HTHUMBNAIL, pSize: PSIZE): HRESULT {
    return Dwmapi.Load('DwmQueryThumbnailSourceSize')(hThumbnail, pSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmregisterthumbnail
  public static DwmRegisterThumbnail(hwndDestination: HWND, hwndSource: HWND, phThumbnailId: PHTHUMBNAIL): HRESULT {
    return Dwmapi.Load('DwmRegisterThumbnail')(hwndDestination, hwndSource, phThumbnailId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmrendergesture
  public static DwmRenderGesture(gt: GESTURE_TYPE, cContacts: UINT, pdwPointerID: LPDWORD, pPoints: PPOINT): HRESULT {
    return Dwmapi.Load('DwmRenderGesture')(gt, cContacts, pdwPointerID, pPoints);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmsetdxframeduration
  public static DwmSetDxFrameDuration(hwnd: HWND, cRefreshes: INT): HRESULT {
    return Dwmapi.Load('DwmSetDxFrameDuration')(hwnd, cRefreshes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmseticoniclivepreviewbitmap
  public static DwmSetIconicLivePreviewBitmap(hwnd: HWND, hbmp: HBITMAP, pptClient: PPOINT | NULL, dwSITFlags: DWORD): HRESULT {
    return Dwmapi.Load('DwmSetIconicLivePreviewBitmap')(hwnd, hbmp, pptClient, dwSITFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmseticonicthumbnail
  public static DwmSetIconicThumbnail(hwnd: HWND, hbmp: HBITMAP, dwSITFlags: DWORD): HRESULT {
    return Dwmapi.Load('DwmSetIconicThumbnail')(hwnd, hbmp, dwSITFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmsetpresentparameters
  public static DwmSetPresentParameters(hwnd: HWND, pPresentParams: PDWM_PRESENT_PARAMETERS): HRESULT {
    return Dwmapi.Load('DwmSetPresentParameters')(hwnd, pPresentParams);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmsetwindowattribute
  public static DwmSetWindowAttribute(hwnd: HWND, dwAttribute: DWORD, pvAttribute: LPCVOID, cbAttribute: DWORD): HRESULT {
    return Dwmapi.Load('DwmSetWindowAttribute')(hwnd, dwAttribute, pvAttribute, cbAttribute);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmshowcontact
  public static DwmShowContact(dwPointerID: DWORD, showContact: DWM_SHOWCONTACT): HRESULT {
    return Dwmapi.Load('DwmShowContact')(dwPointerID, showContact);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmtethercontact
  public static DwmTetherContact(dwPointerID: DWORD, fEnable: BOOL, ptTether: PACKED_POINT): HRESULT {
    return Dwmapi.Load('DwmTetherContact')(dwPointerID, fEnable, ptTether);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmtransitionownedwindow
  public static DwmTransitionOwnedWindow(hwnd: HWND, target: DWMTRANSITION_OWNEDWINDOW_TARGET): HRESULT {
    return Dwmapi.Load('DwmTransitionOwnedWindow')(hwnd, target);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmunregisterthumbnail
  public static DwmUnregisterThumbnail(hThumbnailId: HTHUMBNAIL): HRESULT {
    return Dwmapi.Load('DwmUnregisterThumbnail')(hThumbnailId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmupdatethumbnailproperties
  public static DwmUpdateThumbnailProperties(hThumbnailId: HTHUMBNAIL, ptnProperties: PDWM_THUMBNAIL_PROPERTIES): HRESULT {
    return Dwmapi.Load('DwmUpdateThumbnailProperties')(hThumbnailId, ptnProperties);
  }
}

export default Dwmapi;
