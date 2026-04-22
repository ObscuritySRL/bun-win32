import type { Pointer } from 'bun:ffi';

export type { BOOL, DWORD, DWORD_PTR, HANDLE, HINSTANCE, HRESULT, HWND, INT, INT_PTR, LONG, LONG_PTR, LPARAM, LPCSTR, LPCVOID, LPCWSTR, LPDWORD, LPSTR, LPVOID, LPWSTR, LRESULT, NULL, PVOID, UINT, UINT_PTR, ULONG_PTR, USHORT, VOID, WORD, WPARAM } from '@bun-win32/core';

// ── Handle types ────────────────────────────────────────────────────────────

export type HBITMAP = bigint;
export type HDC = bigint;
export type HDPA = bigint;
export type HDSA = bigint;
export type HICON = bigint;
export type HIMAGELIST = bigint;
export type HMENU = bigint;
export type HPROPSHEETPAGE = bigint;

// ── Scalar types ────────────────────────────────────────────────────────────

export type COLORREF = number;
export type LANGID = number;

// ── Pointer types ───────────────────────────────────────────────────────────

export type LPCOLORMAP = Pointer;
export type LPCPROPSHEETHEADERA = Pointer;
export type LPCPROPSHEETHEADERW = Pointer;
export type LPCPROPSHEETPAGEA = Pointer;
export type LPCPROPSHEETPAGEW = Pointer;
export type LPCRECT = Pointer;
export type LPCTBBUTTON = Pointer;
export type LPDLLVERSIONINFO = Pointer;
export type LPIMAGEINFO = Pointer;
export type LPIMAGELISTDRAWPARAMS = Pointer;
export type LPINITCOMMONCONTROLSEX = Pointer;
export type LPINT = Pointer;
export type LPPOINT = Pointer;
export type LPRECT = Pointer;
export type LPSCROLLINFO = Pointer;
export type LPTRACKMOUSEEVENT = Pointer;
export type PFNDACOMPARE = Pointer;
export type PFNDAENUMCALLBACK = Pointer;
export type PFNDPAMERGE = Pointer;
export type PFNDPASTREAM = Pointer;
export type PINT_PTR = Pointer;
export type PLPWSTR = Pointer;
export type PREFIID = Pointer;
export type PSTREAM = Pointer;
export type SUBCLASSPROC = Pointer;

/**
 * A POINT struct packed into a 64-bit integer for by-value passing in the x64 ABI.
 *
 * On x64, `POINT` (8 bytes: two `LONG`s) is passed in a single register.
 * Use `packPOINT(x, y)` to create one.
 */
export type PACKED_POINT = bigint;

const _packBuf = Buffer.alloc(8);

/** Pack two `LONG` values into a `PACKED_POINT` for Win32 functions that take `POINT` by value. */
export function packPOINT(x: number, y: number): PACKED_POINT {
  _packBuf.writeInt32LE(x, 0);
  _packBuf.writeInt32LE(y, 4);
  return _packBuf.readBigUInt64LE(0);
}

// ── Enums and constants ─────────────────────────────────────────────────────

export enum DllVersionPlatform {
  DLLVER_PLATFORM_NT = 0x0000_0002,
  DLLVER_PLATFORM_WINDOWS = 0x0000_0001,
}

export enum DpaMergeFlags {
  DPAM_INTERSECT = 0x0000_0008,
  DPAM_NORMAL = 0x0000_0002,
  DPAM_SORTED = 0x0000_0001,
  DPAM_UNION = 0x0000_0004,
}

export enum DpaMergeMessages {
  DPAMM_DELETE = 2,
  DPAMM_INSERT = 3,
  DPAMM_MERGE = 1,
}

export enum DpaSortedFlags {
  DPAS_INSERTAFTER = 0x0004,
  DPAS_INSERTBEFORE = 0x0002,
  DPAS_SORTED = 0x0001,
}

export enum FlatScrollBarMode {
  FSB_ENCARTA_MODE = 1,
  FSB_FLAT_MODE = 2,
  FSB_REGULAR_MODE = 0,
}

export enum FlatScrollBarProperty {
  WSB_PROP_CXHSCROLL = 0x0000_0002,
  WSB_PROP_CXHTHUMB = 0x0000_0010,
  WSB_PROP_CXVSCROLL = 0x0000_0008,
  WSB_PROP_CYHSCROLL = 0x0000_0004,
  WSB_PROP_CYVSCROLL = 0x0000_0001,
  WSB_PROP_CYVTHUMB = 0x0000_0020,
  WSB_PROP_HBKGCOLOR = 0x0000_0080,
  WSB_PROP_HSTYLE = 0x0000_0200,
  WSB_PROP_MASK = 0x0000_0fff,
  WSB_PROP_PALETTE = 0x0000_0800,
  WSB_PROP_VBKGCOLOR = 0x0000_0040,
  WSB_PROP_VSTYLE = 0x0000_0100,
  WSB_PROP_WINSTYLE = 0x0000_0400,
}

export enum ImageListCreateFlags {
  ILC_COLOR = 0x0000_0000,
  ILC_COLOR4 = 0x0000_0004,
  ILC_COLOR8 = 0x0000_0008,
  ILC_COLOR16 = 0x0000_0010,
  ILC_COLOR24 = 0x0000_0018,
  ILC_COLOR32 = 0x0000_0020,
  ILC_COLORDDB = 0x0000_00fe,
  ILC_HIGHQUALITYSCALE = 0x0002_0000,
  ILC_MASK = 0x0000_0001,
  ILC_MIRROR = 0x0000_2000,
  ILC_ORIGINALSIZE = 0x0001_0000,
  ILC_PALETTE = 0x0000_0800,
  ILC_PERITEMMIRROR = 0x0000_8000,
}

export enum ImageListDrawFlags {
  ILD_BLEND = 0x0000_0004,
  ILD_BLEND25 = 0x0000_0002,
  ILD_BLEND50 = 0x0000_0004,
  ILD_FOCUS = 0x0000_0002,
  ILD_IMAGE = 0x0000_0020,
  ILD_MASK = 0x0000_0010,
  ILD_NORMAL = 0x0000_0000,
  ILD_OVERLAYMASK = 0x0000_0f00,
  ILD_PRESERVEALPHA = 0x0000_1000,
  ILD_ROP = 0x0000_0040,
  ILD_SCALE = 0x0000_2000,
  ILD_SELECTED = 0x0000_0004,
  ILD_TRANSPARENT = 0x0000_0001,
}

export enum InitCommonControlsFlags {
  ICC_ANIMATE_CLASS = 0x0000_0080,
  ICC_BAR_CLASSES = 0x0000_0004,
  ICC_COOL_CLASSES = 0x0000_0400,
  ICC_DATE_CLASSES = 0x0000_0100,
  ICC_HOTKEY_CLASS = 0x0000_0040,
  ICC_INTERNET_CLASSES = 0x0000_0800,
  ICC_LINK_CLASS = 0x0000_8000,
  ICC_LISTVIEW_CLASSES = 0x0000_0001,
  ICC_NATIVEFNTCTL_CLASS = 0x0000_2000,
  ICC_PAGESCROLLER_CLASS = 0x0000_1000,
  ICC_PROGRESS_CLASS = 0x0000_0020,
  ICC_STANDARD_CLASSES = 0x0000_4000,
  ICC_TAB_CLASSES = 0x0000_0008,
  ICC_TREEVIEW_CLASSES = 0x0000_0002,
  ICC_UPDOWN_CLASS = 0x0000_0010,
  ICC_USEREX_CLASSES = 0x0000_0200,
  ICC_WIN95_CLASSES = 0x0000_00ff,
}

export enum LoadImageFlags {
  LR_CREATEDIBSECTION = 0x0000_2000,
  LR_DEFAULTCOLOR = 0x0000_0000,
  LR_DEFAULTSIZE = 0x0000_0040,
  LR_LOADFROMFILE = 0x0000_0010,
  LR_LOADMAP3DCOLORS = 0x0000_1000,
  LR_LOADTRANSPARENT = 0x0000_0020,
  LR_MONOCHROME = 0x0000_0001,
  LR_SHARED = 0x0000_8000,
  LR_VGACOLOR = 0x0000_0080,
}

export const DA_ERR = -1;
export const DA_LAST = 0x7fff_ffff;
export const DPA_APPEND = DA_LAST;
export const DPA_ERR = DA_ERR;
export const DSA_APPEND = DA_LAST;
export const DSA_ERR = DA_ERR;
