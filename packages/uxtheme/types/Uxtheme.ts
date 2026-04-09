import type { Pointer } from 'bun:ffi';

export type { BOOL, BYTE, DWORD, HINSTANCE, HRESULT, HWND, INT, LONG, LPCWSTR, LPDWORD, LPVOID, LPWSTR, NULL, PVOID, UINT, ULONG, WORD } from '@bun-win32/core';

export const BPBF_COMPOSITED = 2;
export const MAX_INTLIST_COUNT = 402;
export const MAX_THEMECOLOR = 64;
export const MAX_THEMESIZE = 64;
export const SZ_THDOCPROP_AUTHOR = 'author';
export const SZ_THDOCPROP_CANONICALNAME = 'ThemeName';
export const SZ_THDOCPROP_DISPLAYNAME = 'DisplayName';
export const SZ_THDOCPROP_TOOLTIP = 'ToolTip';

export enum AnimationProperty {
  TAP_FLAGS = 0,
  TAP_STAGGERDELAY = 2,
  TAP_STAGGERDELAYCAP = 3,
  TAP_STAGGERDELAYFACTOR = 4,
  TAP_TRANSFORMCOUNT = 1,
  TAP_ZORDER = 5,
}

export enum AnimationPropertyFlag {
  TAPF_ALLOWCOLLECTION = 0x0000_0004,
  TAPF_HASBACKGROUND = 0x0000_0008,
  TAPF_HASPERSPECTIVE = 0x0000_0010,
  TAPF_HASSTAGGER = 0x0000_0001,
  TAPF_ISRTLAWARE = 0x0000_0002,
  TAPF_NONE = 0x0000_0000,
}

export enum AnimationStyle {
  BPAS_CUBIC = 2,
  BPAS_LINEAR = 1,
  BPAS_NONE = 0,
  BPAS_SINE = 3,
}

export enum AnimationTimingFunctionType {
  TTFT_CUBIC_BEZIER = 1,
  TTFT_UNDEFINED = 0,
}

export enum AnimationTransformFlag {
  TATF_HASINITIALVALUES = 0x0000_0002,
  TATF_HASORIGINVALUES = 0x0000_0004,
  TATF_NONE = 0x0000_0000,
  TATF_TARGETVALUES_USER = 0x0000_0001,
}

export enum AnimationTransformType {
  TATT_CLIP = 3,
  TATT_OPACITY = 2,
  TATT_SCALE_2D = 1,
  TATT_TRANSLATE_2D = 0,
}

export enum BufferFormat {
  BPBF_COMPATIBLEBITMAP = 0,
  BPBF_DIB = 1,
  BPBF_TOPDOWNDIB = 2,
  BPBF_TOPDOWNMONODIB = 3,
}

export enum DrawThemeBackgroundOptionFlag {
  DTBG_CLIPRECT = 0x0000_0001,
  DTBG_COMPUTINGREGION = 0x0000_0010,
  DTBG_DRAWSOLID = 0x0000_0002,
  DTBG_MIRRORDC = 0x0000_0020,
  DTBG_NOMIRROR = 0x0000_0040,
  DTBG_OMITBORDER = 0x0000_0004,
  DTBG_OMITCONTENT = 0x0000_0008,
}

export enum DrawThemeParentBackgroundFlag {
  DTPB_USECTLCOLORSTATIC = 0x0000_0002,
  DTPB_USEERASEBKGND = 0x0000_0004,
  DTPB_WINDOWDC = 0x0000_0001,
}

export enum DrawThemeTextExOptionFlag {
  DTT_APPLYOVERLAY = 0x0000_0400,
  DTT_BORDERCOLOR = 0x0000_0002,
  DTT_BORDERSIZE = 0x0000_0020,
  DTT_CALLBACK = 0x0000_1000,
  DTT_CALCRECT = 0x0000_0200,
  DTT_COLORPROP = 0x0000_0080,
  DTT_COMPOSITED = 0x0000_2000,
  DTT_FONTPROP = 0x0000_0040,
  DTT_GLOWSIZE = 0x0000_0800,
  DTT_SHADOWCOLOR = 0x0000_0004,
  DTT_SHADOWOFFSET = 0x0000_0010,
  DTT_SHADOWTYPE = 0x0000_0008,
  DTT_STATEID = 0x0000_0100,
  DTT_TEXTCOLOR = 0x0000_0001,
}

export enum DrawThemeTextFlag2 {
  DTT_GRAYED = 0x0000_0001,
}

export enum EnableThemeDialogTextureFlag {
  ETDT_DISABLE = 0x0000_0001,
  ETDT_ENABLE = 0x0000_0002,
  ETDT_ENABLEAEROWIZARDTAB = 0x0000_000a,
  ETDT_ENABLETAB = 0x0000_0006,
  ETDT_USEAEROWIZARDTABTEXTURE = 0x0000_0008,
  ETDT_USETABTEXTURE = 0x0000_0004,
}

export enum HitTestThemeBackgroundOption {
  HTTB_BACKGROUNDSEG = 0x0000_0000,
  HTTB_CAPTION = 0x0000_0004,
  HTTB_FIXEDBORDER = 0x0000_0002,
  HTTB_RESIZINGBORDER = 0x0000_00f0,
  HTTB_RESIZINGBORDER_BOTTOM = 0x0000_0080,
  HTTB_RESIZINGBORDER_LEFT = 0x0000_0010,
  HTTB_RESIZINGBORDER_RIGHT = 0x0000_0040,
  HTTB_RESIZINGBORDER_TOP = 0x0000_0020,
  HTTB_SIZINGTEMPLATE = 0x0000_0100,
  HTTB_SYSTEMSIZINGMARGINS = 0x0000_0200,
}

export enum OpenThemeDataFlag {
  OTD_FORCE_RECT_SIZING = 0x0000_0001,
  OTD_NONCLIENT = 0x0000_0002,
}

export enum PropertyOrigin {
  PO_CLASS = 2,
  PO_GLOBAL = 3,
  PO_NOTFOUND = 4,
  PO_PART = 1,
  PO_STATE = 0,
}

export enum ThemeAppProperty {
  STAP_ALLOW_CONTROLS = 0x0000_0002,
  STAP_ALLOW_NONCLIENT = 0x0000_0001,
  STAP_ALLOW_WEBCONTENT = 0x0000_0004,
}

export enum ThemeSize {
  TS_DRAW = 2,
  TS_MIN = 0,
  TS_TRUE = 1,
}

export enum WindowThemeAttributeType {
  WTA_NONCLIENT = 1,
}

export enum WindowThemeNonClientAttribute {
  WTNCA_NODRAWCAPTION = 0x0000_0001,
  WTNCA_NODRAWICON = 0x0000_0002,
  WTNCA_NOMIRRORHELP = 0x0000_0008,
  WTNCA_NOSYSMENU = 0x0000_0004,
}

export type BP_BUFFERFORMAT = number;
export type COLORREF = number;
export type HANIMATIONBUFFER = bigint;
export type HBITMAP = bigint;
export type HBRUSH = bigint;
export type HDC = bigint;
export type HIMAGELIST = bigint;
export type HPAINTBUFFER = bigint;
export type HRGN = bigint;
export type HTHEME = bigint;
export type LPCRECT = Pointer;
export type LPRECT = Pointer;
export type PACKED_POINT = bigint;
export type PBP_ANIMATIONPARAMS = Pointer;
export type PBP_PAINTPARAMS = Pointer;
export type PCOLORREF = Pointer;
export type PDTBGOPTS = Pointer;
export type PDTTOPTS = Pointer;
export type PHBITMAP = Pointer;
export type PHDC = Pointer;
export type PHRGN = Pointer;
export type PINT = Pointer;
export type PINTLIST = Pointer;
export type PLOGFONTW = Pointer;
export type PMARGINS = Pointer;
export type PPOINT = Pointer;
export type PPROPERTYORIGIN = Pointer;
export type PPRGBQUAD = Pointer;
export type PPVOID = Pointer;
export type PROPERTYORIGIN = number;
export type PSIZE = Pointer;
export type PTA_TIMINGFUNCTION = Pointer;
export type PTA_TRANSFORM = Pointer;
export type PTEXTMETRICW = Pointer;
export type PWORD = Pointer;
export type TA_PROPERTY = number;
export type THEMESIZE = number;
export type WINDOWTHEMEATTRIBUTETYPE = number;

const packPointBuffer = Buffer.alloc(8);

export function packPOINT(x: number, y: number): PACKED_POINT {
  packPointBuffer.writeInt32LE(x, 0);
  packPointBuffer.writeInt32LE(y, 4);
  return packPointBuffer.readBigUInt64LE(0);
}
