import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { BOOL, COLORREF, DWORD, DWORD_PTR, HANDLE, HBITMAP, HDC, HDPA, HDSA, HICON, HIMAGELIST, HINSTANCE, HMENU, HPROPSHEETPAGE, HRESULT, HWND, INT, INT_PTR, LANGID, LONG, LPARAM, LPCOLORMAP, LPCPROPSHEETHEADERA, LPCPROPSHEETHEADERW, LPCPROPSHEETPAGEA, LPCPROPSHEETPAGEW, LPCRECT, LPCSTR, LPCTBBUTTON, LPCVOID, LPCWSTR, LPDLLVERSIONINFO, LPIMAGEINFO, LPIMAGELISTDRAWPARAMS, LPINITCOMMONCONTROLSEX, LPINT, LPPOINT, LPRECT, LPSCROLLINFO, LPTRACKMOUSEEVENT, LPVOID, LPWSTR, LRESULT, NULL, PACKED_POINT, PFNDACOMPARE, PFNDAENUMCALLBACK, PFNDPAMERGE, PFNDPASTREAM, PINT_PTR, PLPWSTR, PSTREAM, SUBCLASSPROC, UINT, UINT_PTR, VOID, WPARAM } from '../types/Comctl32';

/**
 * Thin, lazy-loaded FFI bindings for `comctl32.dll`.
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
 * import Comctl32 from './structs/Comctl32';
 *
 * // Lazy: bind on first call
 * Comctl32.InitCommonControls();
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Comctl32.Preload(['ImageList_Create', 'ImageList_Destroy']);
 * ```
 */
class Comctl32 extends Win32 {
  protected static override name = 'comctl32.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    CreateMappedBitmap: { args: [FFIType.u64, FFIType.i64, FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    CreatePropertySheetPage: { args: [FFIType.ptr], returns: FFIType.u64 },
    CreatePropertySheetPageA: { args: [FFIType.ptr], returns: FFIType.u64 },
    CreatePropertySheetPageW: { args: [FFIType.ptr], returns: FFIType.u64 },
    CreateStatusWindow: { args: [FFIType.i32, FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    CreateStatusWindowA: { args: [FFIType.i32, FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    CreateStatusWindowW: { args: [FFIType.i32, FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    CreateToolbarEx: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.i32, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.u64 },
    CreateUpDownControl: { args: [FFIType.u32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.i32, FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.u64 },
    DPA_Clone: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    DPA_Create: { args: [FFIType.i32], returns: FFIType.u64 },
    DPA_CreateEx: { args: [FFIType.i32, FFIType.u64], returns: FFIType.u64 },
    DPA_DeleteAllPtrs: { args: [FFIType.u64], returns: FFIType.i32 },
    DPA_DeletePtr: { args: [FFIType.u64, FFIType.i32], returns: FFIType.ptr },
    DPA_Destroy: { args: [FFIType.u64], returns: FFIType.i32 },
    DPA_DestroyCallback: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    DPA_EnumCallback: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    DPA_GetPtr: { args: [FFIType.u64, FFIType.i64], returns: FFIType.ptr },
    DPA_GetPtrIndex: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    DPA_Grow: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    DPA_InsertPtr: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    DPA_LoadStream: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DPA_Merge: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.i64], returns: FFIType.i32 },
    DPA_SaveStream: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DPA_Search: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i64, FFIType.u32], returns: FFIType.i32 },
    DPA_SetPtr: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    DPA_Sort: { args: [FFIType.u64, FFIType.ptr, FFIType.i64], returns: FFIType.i32 },
    DSA_Create: { args: [FFIType.i32, FFIType.i32], returns: FFIType.u64 },
    DSA_DeleteAllItems: { args: [FFIType.u64], returns: FFIType.i32 },
    DSA_DeleteItem: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    DSA_Destroy: { args: [FFIType.u64], returns: FFIType.i32 },
    DSA_DestroyCallback: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    DSA_EnumCallback: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    DSA_GetItem: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    DSA_GetItemPtr: { args: [FFIType.u64, FFIType.i32], returns: FFIType.ptr },
    DSA_InsertItem: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    DSA_SetItem: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    DefSubclassProc: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.i64], returns: FFIType.i64 },
    DestroyPropertySheetPage: { args: [FFIType.u64], returns: FFIType.i32 },
    DllGetVersion: { args: [FFIType.ptr], returns: FFIType.i32 },
    DrawInsert: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.void },
    DrawStatusText: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.void },
    DrawStatusTextA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.void },
    DrawStatusTextW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.void },
    FlatSB_EnableScrollBar: { args: [FFIType.u64, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    FlatSB_GetScrollInfo: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    FlatSB_GetScrollPos: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    FlatSB_GetScrollProp: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    FlatSB_GetScrollPropPtr: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    FlatSB_GetScrollRange: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FlatSB_SetScrollInfo: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    FlatSB_SetScrollPos: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    FlatSB_SetScrollProp: { args: [FFIType.u64, FFIType.u32, FFIType.i64, FFIType.i32], returns: FFIType.i32 },
    FlatSB_SetScrollRange: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    FlatSB_ShowScrollBar: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GetEffectiveClientRect: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    GetMUILanguage: { args: [], returns: FFIType.u16 },
    ImageList_Add: { args: [FFIType.u64, FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    ImageList_AddIcon: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    ImageList_AddMasked: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    ImageList_BeginDrag: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    ImageList_Copy: { args: [FFIType.u64, FFIType.i32, FFIType.u64, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    ImageList_Create: { args: [FFIType.i32, FFIType.i32, FFIType.u32, FFIType.i32, FFIType.i32], returns: FFIType.u64 },
    ImageList_Destroy: { args: [FFIType.u64], returns: FFIType.i32 },
    ImageList_DragEnter: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    ImageList_DragLeave: { args: [FFIType.u64], returns: FFIType.i32 },
    ImageList_DragMove: { args: [FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    ImageList_DragShowNolock: { args: [FFIType.i32], returns: FFIType.i32 },
    ImageList_Draw: { args: [FFIType.u64, FFIType.i32, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    ImageList_DrawEx: { args: [FFIType.u64, FFIType.i32, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    ImageList_DrawIndirect: { args: [FFIType.ptr], returns: FFIType.i32 },
    ImageList_Duplicate: { args: [FFIType.u64], returns: FFIType.u64 },
    ImageList_EndDrag: { args: [], returns: FFIType.void },
    ImageList_GetBkColor: { args: [FFIType.u64], returns: FFIType.u32 },
    ImageList_GetDragImage: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    ImageList_GetIcon: { args: [FFIType.u64, FFIType.i32, FFIType.u32], returns: FFIType.u64 },
    ImageList_GetIconSize: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ImageList_GetImageCount: { args: [FFIType.u64], returns: FFIType.i32 },
    ImageList_GetImageInfo: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    ImageList_LoadImage: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    ImageList_LoadImageA: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    ImageList_LoadImageW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    ImageList_Merge: { args: [FFIType.u64, FFIType.i32, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.u64 },
    ImageList_Read: { args: [FFIType.ptr], returns: FFIType.u64 },
    ImageList_Remove: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    ImageList_Replace: { args: [FFIType.u64, FFIType.i32, FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    ImageList_ReplaceIcon: { args: [FFIType.u64, FFIType.i32, FFIType.u64], returns: FFIType.i32 },
    ImageList_SetBkColor: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    ImageList_SetDragCursorImage: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    ImageList_SetIconSize: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    ImageList_SetImageCount: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    ImageList_SetOverlayImage: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    ImageList_Write: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    InitCommonControls: { args: [], returns: FFIType.void },
    InitCommonControlsEx: { args: [FFIType.ptr], returns: FFIType.i32 },
    InitMUILanguage: { args: [FFIType.u16], returns: FFIType.void },
    InitializeFlatSB: { args: [FFIType.u64], returns: FFIType.i32 },
    LBItemFromPt: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    MakeDragList: { args: [FFIType.u64], returns: FFIType.i32 },
    MenuHelp: { args: [FFIType.u32, FFIType.u64, FFIType.i64, FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.void },
    PropertySheet: { args: [FFIType.ptr], returns: FFIType.i64 },
    PropertySheetA: { args: [FFIType.ptr], returns: FFIType.i64 },
    PropertySheetW: { args: [FFIType.ptr], returns: FFIType.i64 },
    RemoveWindowSubclass: { args: [FFIType.u64, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    SetWindowSubclass: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    ShowHideMenuCtl: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    Str_SetPtrW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UninitializeFlatSB: { args: [FFIType.u64], returns: FFIType.i32 },
    _TrackMouseEvent: { args: [FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-createmappedbitmap
  public static CreateMappedBitmap(hInstance: HINSTANCE, idBitmap: INT_PTR, wFlags: UINT, lpColorMap: LPCOLORMAP | NULL, iNumMaps: INT): HBITMAP {
    return Comctl32.Load('CreateMappedBitmap')(hInstance, idBitmap, wFlags, lpColorMap, iNumMaps);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prsht/nf-prsht-createpropertysheetpagea
  public static CreatePropertySheetPage(constPropSheetPagePointer: LPCPROPSHEETPAGEA): HPROPSHEETPAGE {
    return Comctl32.Load('CreatePropertySheetPage')(constPropSheetPagePointer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prsht/nf-prsht-createpropertysheetpagea
  public static CreatePropertySheetPageA(constPropSheetPagePointer: LPCPROPSHEETPAGEA): HPROPSHEETPAGE {
    return Comctl32.Load('CreatePropertySheetPageA')(constPropSheetPagePointer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prsht/nf-prsht-createpropertysheetpagew
  public static CreatePropertySheetPageW(constPropSheetPagePointer: LPCPROPSHEETPAGEW): HPROPSHEETPAGE {
    return Comctl32.Load('CreatePropertySheetPageW')(constPropSheetPagePointer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-createstatuswindowa
  public static CreateStatusWindow(style: LONG, lpszText: LPCSTR, hwndParent: HWND, wID: UINT): HWND {
    return Comctl32.Load('CreateStatusWindow')(style, lpszText, hwndParent, wID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-createstatuswindowa
  public static CreateStatusWindowA(style: LONG, lpszText: LPCSTR, hwndParent: HWND, wID: UINT): HWND {
    return Comctl32.Load('CreateStatusWindowA')(style, lpszText, hwndParent, wID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-createstatuswindoww
  public static CreateStatusWindowW(style: LONG, lpszText: LPCWSTR, hwndParent: HWND, wID: UINT): HWND {
    return Comctl32.Load('CreateStatusWindowW')(style, lpszText, hwndParent, wID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-createtoolbarex
  public static CreateToolbarEx(hwnd: HWND, ws: DWORD, wID: UINT, nBitmaps: INT, hBMInst: HINSTANCE, wBMID: UINT_PTR, lpButtons: LPCTBBUTTON, iNumButtons: INT, dxButton: INT, dyButton: INT, dxBitmap: INT, dyBitmap: INT, uStructSize: UINT): HWND {
    return Comctl32.Load('CreateToolbarEx')(hwnd, ws, wID, nBitmaps, hBMInst, wBMID, lpButtons, iNumButtons, dxButton, dyButton, dxBitmap, dyBitmap, uStructSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-createupdowncontrol
  public static CreateUpDownControl(dwStyle: DWORD, x: INT, y: INT, cx: INT, cy: INT, hParent: HWND, nID: INT, hInst: HINSTANCE, hBuddy: HWND, nUpper: INT, nLower: INT, nPos: INT): HWND {
    return Comctl32.Load('CreateUpDownControl')(dwStyle, x, y, cx, cy, hParent, nID, hInst, hBuddy, nUpper, nLower, nPos);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dpa_clone
  public static DPA_Clone(hdpa: HDPA, hdpaNew: HDPA | 0n): HDPA {
    return Comctl32.Load('DPA_Clone')(hdpa, hdpaNew);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dpa_create
  public static DPA_Create(cItemGrow: INT): HDPA {
    return Comctl32.Load('DPA_Create')(cItemGrow);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dpa_createex
  public static DPA_CreateEx(cpGrow: INT, hheap: HANDLE | 0n): HDPA {
    return Comctl32.Load('DPA_CreateEx')(cpGrow, hheap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dpa_deleteallptrs
  public static DPA_DeleteAllPtrs(hdpa: HDPA): BOOL {
    return Comctl32.Load('DPA_DeleteAllPtrs')(hdpa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dpa_deleteptr
  public static DPA_DeletePtr(hdpa: HDPA, i: INT): LPVOID {
    return Comctl32.Load('DPA_DeletePtr')(hdpa, i);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dpa_destroy
  public static DPA_Destroy(hdpa: HDPA | 0n): BOOL {
    return Comctl32.Load('DPA_Destroy')(hdpa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dpa_destroycallback
  public static DPA_DestroyCallback(hdpa: HDPA | 0n, pfnCB: PFNDAENUMCALLBACK, pData: LPVOID | NULL): VOID {
    return Comctl32.Load('DPA_DestroyCallback')(hdpa, pfnCB, pData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dpa_enumcallback
  public static DPA_EnumCallback(hdpa: HDPA | 0n, pfnCB: PFNDAENUMCALLBACK | NULL, pData: LPVOID | NULL): VOID {
    return Comctl32.Load('DPA_EnumCallback')(hdpa, pfnCB, pData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dpa_getptr
  public static DPA_GetPtr(hdpa: HDPA, i: INT_PTR): LPVOID {
    return Comctl32.Load('DPA_GetPtr')(hdpa, i);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dpa_getptrindex
  public static DPA_GetPtrIndex(hdpa: HDPA, p: LPCVOID | NULL): INT {
    return Comctl32.Load('DPA_GetPtrIndex')(hdpa, p);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dpa_grow
  public static DPA_Grow(pdpa: HDPA, cp: INT): BOOL {
    return Comctl32.Load('DPA_Grow')(pdpa, cp);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dpa_insertptr
  public static DPA_InsertPtr(hdpa: HDPA, i: INT, p: LPVOID | NULL): INT {
    return Comctl32.Load('DPA_InsertPtr')(hdpa, i, p);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dpa_loadstream
  public static DPA_LoadStream(phdpa: LPVOID, pfn: PFNDPASTREAM, pstream: PSTREAM, pvInstData: LPVOID | NULL): HRESULT {
    return Comctl32.Load('DPA_LoadStream')(phdpa, pfn, pstream, pvInstData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dpa_merge
  public static DPA_Merge(hdpaDest: HDPA, hdpaSrc: HDPA, dwFlags: DWORD, pfnCompare: PFNDACOMPARE, pfnMerge: PFNDPAMERGE, lParam: LPARAM): BOOL {
    return Comctl32.Load('DPA_Merge')(hdpaDest, hdpaSrc, dwFlags, pfnCompare, pfnMerge, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dpa_savestream
  public static DPA_SaveStream(hdpa: HDPA, pfn: PFNDPASTREAM, pstream: PSTREAM, pvInstData: LPVOID | NULL): HRESULT {
    return Comctl32.Load('DPA_SaveStream')(hdpa, pfn, pstream, pvInstData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dpa_search
  public static DPA_Search(hdpa: HDPA, pFind: LPVOID | NULL, iStart: INT, pfnCompare: PFNDACOMPARE, lParam: LPARAM, options: UINT): INT {
    return Comctl32.Load('DPA_Search')(hdpa, pFind, iStart, pfnCompare, lParam, options);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dpa_setptr
  public static DPA_SetPtr(hdpa: HDPA, i: INT, p: LPVOID | NULL): BOOL {
    return Comctl32.Load('DPA_SetPtr')(hdpa, i, p);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dpa_sort
  public static DPA_Sort(hdpa: HDPA, pfnCompare: PFNDACOMPARE, lParam: LPARAM): BOOL {
    return Comctl32.Load('DPA_Sort')(hdpa, pfnCompare, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dsa_create
  public static DSA_Create(cbItem: INT, cItemGrow: INT): HDSA {
    return Comctl32.Load('DSA_Create')(cbItem, cItemGrow);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dsa_deleteallitems
  public static DSA_DeleteAllItems(hdsa: HDSA): BOOL {
    return Comctl32.Load('DSA_DeleteAllItems')(hdsa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dsa_deleteitem
  public static DSA_DeleteItem(hdsa: HDSA, i: INT): BOOL {
    return Comctl32.Load('DSA_DeleteItem')(hdsa, i);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dsa_destroy
  public static DSA_Destroy(hdsa: HDSA | 0n): BOOL {
    return Comctl32.Load('DSA_Destroy')(hdsa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dsa_destroycallback
  public static DSA_DestroyCallback(hdsa: HDSA | 0n, pfnCB: PFNDAENUMCALLBACK, pData: LPVOID | NULL): VOID {
    return Comctl32.Load('DSA_DestroyCallback')(hdsa, pfnCB, pData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dsa_enumcallback
  public static DSA_EnumCallback(hdsa: HDSA, pfnCB: PFNDAENUMCALLBACK, pData: LPVOID | NULL): VOID {
    return Comctl32.Load('DSA_EnumCallback')(hdsa, pfnCB, pData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dsa_getitem
  public static DSA_GetItem(hdsa: HDSA, i: INT, pitem: LPVOID): BOOL {
    return Comctl32.Load('DSA_GetItem')(hdsa, i, pitem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dsa_getitemptr
  public static DSA_GetItemPtr(hdsa: HDSA, i: INT): LPVOID {
    return Comctl32.Load('DSA_GetItemPtr')(hdsa, i);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dsa_insertitem
  public static DSA_InsertItem(hdsa: HDSA, i: INT, pitem: LPCVOID): INT {
    return Comctl32.Load('DSA_InsertItem')(hdsa, i, pitem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-dsa_setitem
  public static DSA_SetItem(hdsa: HDSA, i: INT, pitem: LPCVOID): BOOL {
    return Comctl32.Load('DSA_SetItem')(hdsa, i, pitem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-defsubclassproc
  public static DefSubclassProc(hWnd: HWND, uMsg: UINT, wParam: WPARAM, lParam: LPARAM): LRESULT {
    return Comctl32.Load('DefSubclassProc')(hWnd, uMsg, wParam, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prsht/nf-prsht-destroypropertysheetpage
  public static DestroyPropertySheetPage(hPSP: HPROPSHEETPAGE): BOOL {
    return Comctl32.Load('DestroyPropertySheetPage')(hPSP);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nc-shlwapi-dllgetversionproc
  public static DllGetVersion(pdvi: LPDLLVERSIONINFO): HRESULT {
    return Comctl32.Load('DllGetVersion')(pdvi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-drawinsert
  public static DrawInsert(handParent: HWND, hLB: HWND, nItem: INT): VOID {
    return Comctl32.Load('DrawInsert')(handParent, hLB, nItem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-drawstatustexta
  public static DrawStatusText(hDC: HDC, lprc: LPCRECT, pszText: LPCSTR, uFlags: UINT): VOID {
    return Comctl32.Load('DrawStatusText')(hDC, lprc, pszText, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-drawstatustexta
  public static DrawStatusTextA(hDC: HDC, lprc: LPCRECT, pszText: LPCSTR, uFlags: UINT): VOID {
    return Comctl32.Load('DrawStatusTextA')(hDC, lprc, pszText, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-drawstatustextw
  public static DrawStatusTextW(hDC: HDC, lprc: LPCRECT, pszText: LPCWSTR, uFlags: UINT): VOID {
    return Comctl32.Load('DrawStatusTextW')(hDC, lprc, pszText, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-flatsb_enablescrollbar
  public static FlatSB_EnableScrollBar(hWnd: HWND, wSBflags: INT, wArrows: UINT): BOOL {
    return Comctl32.Load('FlatSB_EnableScrollBar')(hWnd, wSBflags, wArrows);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-flatsb_getscrollinfo
  public static FlatSB_GetScrollInfo(hWnd: HWND, code: INT, lpsi: LPSCROLLINFO): BOOL {
    return Comctl32.Load('FlatSB_GetScrollInfo')(hWnd, code, lpsi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-flatsb_getscrollpos
  public static FlatSB_GetScrollPos(hWnd: HWND, code: INT): INT {
    return Comctl32.Load('FlatSB_GetScrollPos')(hWnd, code);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-flatsb_getscrollprop
  public static FlatSB_GetScrollProp(hWnd: HWND, propIndex: INT, pValue: LPINT): BOOL {
    return Comctl32.Load('FlatSB_GetScrollProp')(hWnd, propIndex, pValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-flatsb_getscrollprop
  public static FlatSB_GetScrollPropPtr(hWnd: HWND, propIndex: INT, pValue: PINT_PTR): BOOL {
    return Comctl32.Load('FlatSB_GetScrollPropPtr')(hWnd, propIndex, pValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-flatsb_getscrollrange
  public static FlatSB_GetScrollRange(hWnd: HWND, code: INT, lpMinPos: LPINT, lpMaxPos: LPINT): BOOL {
    return Comctl32.Load('FlatSB_GetScrollRange')(hWnd, code, lpMinPos, lpMaxPos);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-flatsb_setscrollinfo
  public static FlatSB_SetScrollInfo(hWnd: HWND, code: INT, psi: LPSCROLLINFO, fRedraw: BOOL): INT {
    return Comctl32.Load('FlatSB_SetScrollInfo')(hWnd, code, psi, fRedraw);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-flatsb_setscrollpos
  public static FlatSB_SetScrollPos(hWnd: HWND, code: INT, pos: INT, fRedraw: BOOL): INT {
    return Comctl32.Load('FlatSB_SetScrollPos')(hWnd, code, pos, fRedraw);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-flatsb_setscrollprop
  public static FlatSB_SetScrollProp(hWnd: HWND, index: UINT, newValue: INT_PTR, fRedraw: BOOL): BOOL {
    return Comctl32.Load('FlatSB_SetScrollProp')(hWnd, index, newValue, fRedraw);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-flatsb_setscrollrange
  public static FlatSB_SetScrollRange(hWnd: HWND, code: INT, min: INT, max: INT, fRedraw: BOOL): INT {
    return Comctl32.Load('FlatSB_SetScrollRange')(hWnd, code, min, max, fRedraw);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-flatsb_showscrollbar
  public static FlatSB_ShowScrollBar(hWnd: HWND, code: INT, fShow: BOOL): BOOL {
    return Comctl32.Load('FlatSB_ShowScrollBar')(hWnd, code, fShow);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-geteffectiveclientrect
  public static GetEffectiveClientRect(hWnd: HWND, lprc: LPRECT, lpInfo: LPINT): VOID {
    return Comctl32.Load('GetEffectiveClientRect')(hWnd, lprc, lpInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-getmuilanguage
  public static GetMUILanguage(): LANGID {
    return Comctl32.Load('GetMUILanguage')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_add
  public static ImageList_Add(himl: HIMAGELIST, hbmImage: HBITMAP, hbmMask: HBITMAP | 0n): INT {
    return Comctl32.Load('ImageList_Add')(himl, hbmImage, hbmMask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_addicon
  public static ImageList_AddIcon(himl: HIMAGELIST, hicon: HICON): INT {
    return Comctl32.Load('ImageList_AddIcon')(himl, hicon);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_addmasked
  public static ImageList_AddMasked(himl: HIMAGELIST, hbmImage: HBITMAP, crMask: COLORREF): INT {
    return Comctl32.Load('ImageList_AddMasked')(himl, hbmImage, crMask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_begindrag
  public static ImageList_BeginDrag(himlTrack: HIMAGELIST, iTrack: INT, dxHotspot: INT, dyHotspot: INT): BOOL {
    return Comctl32.Load('ImageList_BeginDrag')(himlTrack, iTrack, dxHotspot, dyHotspot);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_copy
  public static ImageList_Copy(himlDst: HIMAGELIST, iDst: INT, himlSrc: HIMAGELIST, iSrc: INT, uFlags: UINT): BOOL {
    return Comctl32.Load('ImageList_Copy')(himlDst, iDst, himlSrc, iSrc, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_create
  public static ImageList_Create(cx: INT, cy: INT, flags: UINT, cInitial: INT, cGrow: INT): HIMAGELIST {
    return Comctl32.Load('ImageList_Create')(cx, cy, flags, cInitial, cGrow);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_destroy
  public static ImageList_Destroy(himl: HIMAGELIST | 0n): BOOL {
    return Comctl32.Load('ImageList_Destroy')(himl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_dragenter
  public static ImageList_DragEnter(hwndLock: HWND, x: INT, y: INT): BOOL {
    return Comctl32.Load('ImageList_DragEnter')(hwndLock, x, y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_dragleave
  public static ImageList_DragLeave(hwndLock: HWND): BOOL {
    return Comctl32.Load('ImageList_DragLeave')(hwndLock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_dragmove
  public static ImageList_DragMove(x: INT, y: INT): BOOL {
    return Comctl32.Load('ImageList_DragMove')(x, y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_dragshownolock
  public static ImageList_DragShowNolock(fShow: BOOL): BOOL {
    return Comctl32.Load('ImageList_DragShowNolock')(fShow);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_draw
  public static ImageList_Draw(himl: HIMAGELIST, i: INT, hdcDst: HDC, x: INT, y: INT, fStyle: UINT): BOOL {
    return Comctl32.Load('ImageList_Draw')(himl, i, hdcDst, x, y, fStyle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_drawex
  public static ImageList_DrawEx(himl: HIMAGELIST, i: INT, hdcDst: HDC, x: INT, y: INT, dx: INT, dy: INT, rgbBk: COLORREF, rgbFg: COLORREF, fStyle: UINT): BOOL {
    return Comctl32.Load('ImageList_DrawEx')(himl, i, hdcDst, x, y, dx, dy, rgbBk, rgbFg, fStyle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_drawindirect
  public static ImageList_DrawIndirect(pimldp: LPIMAGELISTDRAWPARAMS): BOOL {
    return Comctl32.Load('ImageList_DrawIndirect')(pimldp);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_duplicate
  public static ImageList_Duplicate(himl: HIMAGELIST): HIMAGELIST {
    return Comctl32.Load('ImageList_Duplicate')(himl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_enddrag
  public static ImageList_EndDrag(): VOID {
    return Comctl32.Load('ImageList_EndDrag')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_getbkcolor
  public static ImageList_GetBkColor(himl: HIMAGELIST): COLORREF {
    return Comctl32.Load('ImageList_GetBkColor')(himl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_getdragimage
  public static ImageList_GetDragImage(ppt: LPPOINT | NULL, pptHotspot: LPPOINT | NULL): HIMAGELIST {
    return Comctl32.Load('ImageList_GetDragImage')(ppt, pptHotspot);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_geticon
  public static ImageList_GetIcon(himl: HIMAGELIST, i: INT, flags: UINT): HICON {
    return Comctl32.Load('ImageList_GetIcon')(himl, i, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_geticonsize
  public static ImageList_GetIconSize(himl: HIMAGELIST, cx: LPINT | NULL, cy: LPINT | NULL): BOOL {
    return Comctl32.Load('ImageList_GetIconSize')(himl, cx, cy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_getimagecount
  public static ImageList_GetImageCount(himl: HIMAGELIST): INT {
    return Comctl32.Load('ImageList_GetImageCount')(himl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_getimageinfo
  public static ImageList_GetImageInfo(himl: HIMAGELIST, i: INT, pImageInfo: LPIMAGEINFO): BOOL {
    return Comctl32.Load('ImageList_GetImageInfo')(himl, i, pImageInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_loadimagea
  public static ImageList_LoadImage(hi: HINSTANCE, lpbmp: LPCSTR, cx: INT, cGrow: INT, crMask: COLORREF, uType: UINT, uFlags: UINT): HIMAGELIST {
    return Comctl32.Load('ImageList_LoadImage')(hi, lpbmp, cx, cGrow, crMask, uType, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_loadimagea
  public static ImageList_LoadImageA(hi: HINSTANCE, lpbmp: LPCSTR, cx: INT, cGrow: INT, crMask: COLORREF, uType: UINT, uFlags: UINT): HIMAGELIST {
    return Comctl32.Load('ImageList_LoadImageA')(hi, lpbmp, cx, cGrow, crMask, uType, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_loadimagew
  public static ImageList_LoadImageW(hi: HINSTANCE, lpbmp: LPCWSTR, cx: INT, cGrow: INT, crMask: COLORREF, uType: UINT, uFlags: UINT): HIMAGELIST {
    return Comctl32.Load('ImageList_LoadImageW')(hi, lpbmp, cx, cGrow, crMask, uType, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_merge
  public static ImageList_Merge(himl1: HIMAGELIST, i1: INT, himl2: HIMAGELIST, i2: INT, dx: INT, dy: INT): HIMAGELIST {
    return Comctl32.Load('ImageList_Merge')(himl1, i1, himl2, i2, dx, dy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_read
  public static ImageList_Read(pstm: PSTREAM): HIMAGELIST {
    return Comctl32.Load('ImageList_Read')(pstm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_remove
  public static ImageList_Remove(himl: HIMAGELIST, i: INT): BOOL {
    return Comctl32.Load('ImageList_Remove')(himl, i);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_replace
  public static ImageList_Replace(himl: HIMAGELIST, i: INT, hbmImage: HBITMAP, hbmMask: HBITMAP | 0n): BOOL {
    return Comctl32.Load('ImageList_Replace')(himl, i, hbmImage, hbmMask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_replaceicon
  public static ImageList_ReplaceIcon(himl: HIMAGELIST, i: INT, hicon: HICON): INT {
    return Comctl32.Load('ImageList_ReplaceIcon')(himl, i, hicon);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_setbkcolor
  public static ImageList_SetBkColor(himl: HIMAGELIST, clrBk: COLORREF): COLORREF {
    return Comctl32.Load('ImageList_SetBkColor')(himl, clrBk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_setdragcursorimage
  public static ImageList_SetDragCursorImage(himlDrag: HIMAGELIST, iDrag: INT, dxHotspot: INT, dyHotspot: INT): BOOL {
    return Comctl32.Load('ImageList_SetDragCursorImage')(himlDrag, iDrag, dxHotspot, dyHotspot);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_seticonsize
  public static ImageList_SetIconSize(himl: HIMAGELIST, cx: INT, cy: INT): BOOL {
    return Comctl32.Load('ImageList_SetIconSize')(himl, cx, cy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_setimagecount
  public static ImageList_SetImageCount(himl: HIMAGELIST, uNewCount: UINT): BOOL {
    return Comctl32.Load('ImageList_SetImageCount')(himl, uNewCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_setoverlayimage
  public static ImageList_SetOverlayImage(himl: HIMAGELIST, iImage: INT, iOverlay: INT): BOOL {
    return Comctl32.Load('ImageList_SetOverlayImage')(himl, iImage, iOverlay);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-imagelist_write
  public static ImageList_Write(himl: HIMAGELIST, pstm: PSTREAM): BOOL {
    return Comctl32.Load('ImageList_Write')(himl, pstm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-initcommoncontrols
  public static InitCommonControls(): VOID {
    return Comctl32.Load('InitCommonControls')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-initcommoncontrolsex
  public static InitCommonControlsEx(picce: LPINITCOMMONCONTROLSEX): BOOL {
    return Comctl32.Load('InitCommonControlsEx')(picce);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-initmuilanguage
  public static InitMUILanguage(uiLang: LANGID): VOID {
    return Comctl32.Load('InitMUILanguage')(uiLang);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-initializeflatsb
  public static InitializeFlatSB(hWnd: HWND): BOOL {
    return Comctl32.Load('InitializeFlatSB')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-lbitemfrompt
  public static LBItemFromPt(hLB: HWND, pt: PACKED_POINT, bAutoScroll: BOOL): INT {
    return Comctl32.Load('LBItemFromPt')(hLB, pt, bAutoScroll);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-makedraglist
  public static MakeDragList(hLB: HWND): BOOL {
    return Comctl32.Load('MakeDragList')(hLB);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-menuhelp
  public static MenuHelp(uMsg: UINT, wParam: WPARAM, lParam: LPARAM, hMainMenu: HMENU, hInst: HINSTANCE, hwndStatus: HWND, lpwIDs: LPVOID): VOID {
    return Comctl32.Load('MenuHelp')(uMsg, wParam, lParam, hMainMenu, hInst, hwndStatus, lpwIDs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prsht/nf-prsht-propertysheeta
  public static PropertySheet(lppsph: LPCPROPSHEETHEADERA): INT_PTR {
    return Comctl32.Load('PropertySheet')(lppsph);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prsht/nf-prsht-propertysheeta
  public static PropertySheetA(lppsph: LPCPROPSHEETHEADERA): INT_PTR {
    return Comctl32.Load('PropertySheetA')(lppsph);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prsht/nf-prsht-propertysheetw
  public static PropertySheetW(lppsph: LPCPROPSHEETHEADERW): INT_PTR {
    return Comctl32.Load('PropertySheetW')(lppsph);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-removewindowsubclass
  public static RemoveWindowSubclass(hWnd: HWND, pfnSubclass: SUBCLASSPROC, uIdSubclass: UINT_PTR): BOOL {
    return Comctl32.Load('RemoveWindowSubclass')(hWnd, pfnSubclass, uIdSubclass);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-setwindowsubclass
  public static SetWindowSubclass(hWnd: HWND, pfnSubclass: SUBCLASSPROC, uIdSubclass: UINT_PTR, dwRefData: DWORD_PTR): BOOL {
    return Comctl32.Load('SetWindowSubclass')(hWnd, pfnSubclass, uIdSubclass, dwRefData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-showhidemenuctl
  public static ShowHideMenuCtl(hWnd: HWND, uFlags: UINT_PTR, lpInfo: LPINT): BOOL {
    return Comctl32.Load('ShowHideMenuCtl')(hWnd, uFlags, lpInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/dpa_dsa/nf-dpa_dsa-str_setptrw
  public static Str_SetPtrW(ppsz: PLPWSTR, psz: LPCWSTR | NULL): BOOL {
    return Comctl32.Load('Str_SetPtrW')(ppsz, psz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-uninitializeflatsb
  public static UninitializeFlatSB(hWnd: HWND): HRESULT {
    return Comctl32.Load('UninitializeFlatSB')(hWnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-_trackmouseevent
  public static _TrackMouseEvent(lpEventTrack: LPTRACKMOUSEEVENT): BOOL {
    return Comctl32.Load('_TrackMouseEvent')(lpEventTrack);
  }
}

export default Comctl32;
