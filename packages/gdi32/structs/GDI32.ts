import { type FFIFunction, FFIType } from 'bun:ffi';
import { Win32 } from '@bun-win32/core';

import type {
  ABORTPROC,
  BITMAP_,
  BITMAPINFO_,
  BITMAPINFOHEADER_,
  BLENDFUNCTION,
  BOOL,
  BYTE_,
  COLORADJUSTMENT_,
  COLORREF,
  DEVMODEA_,
  DEVMODEW_,
  DOCINFOA_,
  DOCINFOW_,
  DWORD,
  DWORD_,
  ENHMETARECORD_,
  ENHMFENUMPROC,
  FLOAT,
  FONTENUMPROCA,
  FONTENUMPROCW,
  GOBJENUMPROC,
  HANDLE,
  HBITMAP,
  HBRUSH,
  HCOLORSPACE,
  HDC,
  HENHMETAFILE,
  HFONT,
  HGDIOBJ,
  HGLOBAL,
  HMETAFILE,
  HPALETTE,
  HPEN,
  HRGN,
  ICMENUMPROCA,
  ICMENUMPROCW,
  int,
  INT,
  INT_,
  LINEDDAPROC,
  LOGBRUSH_,
  LOGFONTA_,
  LOGFONTW_,
  LOGPALETTE_,
  LOGPEN_,
  LONG,
  LPABC,
  LPARAM,
  LPBITMAPINFO,
  LPBYTE,
  LPCHARSETINFO,
  LPCOLORADJUSTMENT,
  LPCSTR,
  LPCWSTR,
  LPDWORD,
  LPENHMETAHEADER,
  LPFONTSIGNATURE,
  LPGLYPHMETRICS,
  LPGLYPHSET,
  LPHANDLETABLE,
  LPINT,
  LPKERNINGPAIR,
  LPLOGCOLORSPACEA,
  LPLOGCOLORSPACEW,
  LPLOGFONTA,
  LPLOGFONTW,
  LPMETARECORD,
  LPPALETTEENTRY,
  LPPIXELFORMATDESCRIPTOR,
  LPPOINT,
  LPRECT,
  LPRGBTRIPLE,
  LPRGNDATA,
  LPSIZE,
  LPSTR,
  LPTEXTMETRICA,
  LPTEXTMETRICW,
  LPVOID,
  LPWORD,
  LPWSTR,
  LPXFORM,
  MAT2_,
  METAFILEPICT_,
  MFENUMPROC,
  NULL,
  PALETTEENTRY_,
  PFLOAT,
  PIXELFORMATDESCRIPTOR_,
  POINT_,
  POLYTEXTA_,
  POLYTEXTW_,
  PTRIVERTEX,
  PVOID,
  RECT_,
  RGBQUAD_,
  RGNDATA_,
  UINT,
  ULONG,
  XFORM_,
} from '../types/GDI32';

/**
 * Thin, lazy-loaded FFI bindings for `gdi32.dll`.
 *
 * Each static method maps directly to a Win32 export described in `Symbols`.
 * Callers normally rely on the lazy getters; those use `Load` to bind the native
 * function via `bun:ffi` and memoize it on the class. `Preload` binds an entire
 * subset (or all) of the exports up front.
 *
 * Symbols are defined with explicit `FFIType` signatures and kept alphabetized.
 * You normally do not access `Symbols` directly; call the static methods or preload
 * a subset for hot paths.
 *
 * @example
 * ```ts
 * import GDI32 from './structs/GDI32';
 *
 * const hdc = GDI32.CreateCompatibleDC();
 * GDI32.Preload(['CreateCompatibleDC', 'DeleteDC']);
 * ```
 */
class GDI32 extends Win32 {
  protected static override name = 'gdi32.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    AbortDoc: { args: [FFIType.u64], returns: FFIType.i32 },
    AbortPath: { args: [FFIType.u64], returns: FFIType.i32 },
    AddFontMemResourceEx: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    AddFontResourceA: { args: [FFIType.ptr], returns: FFIType.i32 },
    AddFontResourceExA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AddFontResourceExW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AddFontResourceW: { args: [FFIType.ptr], returns: FFIType.i32 },
    AngleArc: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    AnimatePalette: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    Arc: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    ArcTo: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    BeginPath: { args: [FFIType.u64], returns: FFIType.i32 },
    BitBlt: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    CancelDC: { args: [FFIType.u64], returns: FFIType.i32 },
    CheckColorsInGamut: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    ChoosePixelFormat: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    Chord: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    CloseEnhMetaFile: { args: [FFIType.u64], returns: FFIType.u64 },
    CloseFigure: { args: [FFIType.u64], returns: FFIType.i32 },
    CloseMetaFile: { args: [FFIType.u64], returns: FFIType.u64 },
    ColorCorrectPalette: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    ColorMatchToTarget: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    CombineRgn: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    CombineTransform: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CopyEnhMetaFileA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    CopyEnhMetaFileW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    CopyMetaFileA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    CopyMetaFileW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    CreateBitmap: { args: [FFIType.i32, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreateBitmapIndirect: { args: [FFIType.ptr], returns: FFIType.u64 },
    CreateBrushIndirect: { args: [FFIType.ptr], returns: FFIType.u64 },
    CreateColorSpaceA: { args: [FFIType.ptr], returns: FFIType.u64 },
    CreateColorSpaceW: { args: [FFIType.ptr], returns: FFIType.u64 },
    CreateCompatibleBitmap: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.u64 },
    CreateCompatibleDC: { args: [FFIType.u64], returns: FFIType.u64 },
    CreateDCA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CreateDCW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CreateDIBitmap: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    CreateDIBPatternBrush: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    CreateDIBPatternBrushPt: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    CreateDIBSection: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    CreateDiscardableBitmap: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.u64 },
    CreateEllipticRgn: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.u64 },
    CreateEllipticRgnIndirect: { args: [FFIType.ptr], returns: FFIType.u64 },
    CreateEnhMetaFileA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CreateEnhMetaFileW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CreateFontA: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreateFontIndirectA: { args: [FFIType.ptr], returns: FFIType.u64 },
    CreateFontIndirectExA: { args: [FFIType.ptr], returns: FFIType.u64 },
    CreateFontIndirectExW: { args: [FFIType.ptr], returns: FFIType.u64 },
    CreateFontIndirectW: { args: [FFIType.ptr], returns: FFIType.u64 },
    CreateFontW: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreateHalftonePalette: { args: [FFIType.u64], returns: FFIType.u64 },
    CreateHatchBrush: { args: [FFIType.i32, FFIType.u32], returns: FFIType.u64 },
    CreateICA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CreateICW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CreateMetaFileA: { args: [FFIType.ptr], returns: FFIType.u64 },
    CreateMetaFileW: { args: [FFIType.ptr], returns: FFIType.u64 },
    CreatePalette: { args: [FFIType.ptr], returns: FFIType.u64 },
    CreatePatternBrush: { args: [FFIType.u64], returns: FFIType.u64 },
    CreatePen: { args: [FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.u64 },
    CreatePenIndirect: { args: [FFIType.ptr], returns: FFIType.u64 },
    CreatePolygonRgn: { args: [FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.u64 },
    CreatePolyPolygonRgn: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.u64 },
    CreateRectRgn: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.u64 },
    CreateRectRgnIndirect: { args: [FFIType.ptr], returns: FFIType.u64 },
    CreateRoundRectRgn: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.u64 },
    CreateScalableFontResourceA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateScalableFontResourceW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateSolidBrush: { args: [FFIType.u32], returns: FFIType.u64 },
    DeleteColorSpace: { args: [FFIType.u64], returns: FFIType.i32 },
    DeleteDC: { args: [FFIType.u64], returns: FFIType.i32 },
    DeleteEnhMetaFile: { args: [FFIType.u64], returns: FFIType.i32 },
    DeleteMetaFile: { args: [FFIType.u64], returns: FFIType.i32 },
    DeleteObject: { args: [FFIType.u64], returns: FFIType.i32 },
    DescribePixelFormat: { args: [FFIType.u64, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    DPtoLP: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    DrawEscape: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    Ellipse: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    EndDoc: { args: [FFIType.u64], returns: FFIType.i32 },
    EndPage: { args: [FFIType.u64], returns: FFIType.i32 },
    EndPath: { args: [FFIType.u64], returns: FFIType.i32 },
    EnumEnhMetaFile: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumFontFamiliesA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumFontFamiliesExA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    EnumFontFamiliesExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    EnumFontFamiliesW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumFontsA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumFontsW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumICMProfilesA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumICMProfilesW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumMetaFile: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumObjects: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EqualRgn: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    Escape: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ExcludeClipRect: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    ExtCreatePen: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    ExtCreateRegion: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    ExtEscape: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    ExtFloodFill: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    ExtSelectClipRgn: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    ExtTextOutA: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ExtTextOutW: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    FillPath: { args: [FFIType.u64], returns: FFIType.i32 },
    FillRgn: { args: [FFIType.u64, FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    FixBrushOrgEx: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    FlattenPath: { args: [FFIType.u64], returns: FFIType.i32 },
    FloodFill: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    FrameRgn: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdiAlphaBlend: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdiComment: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GdiFlush: { args: [], returns: FFIType.i32 },
    GdiGetBatchLimit: { args: [], returns: FFIType.u32 },
    GdiGradientFill: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    GdiSetBatchLimit: { args: [FFIType.u32], returns: FFIType.u32 },
    GdiTransparentBlt: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    GetArcDirection: { args: [FFIType.u64], returns: FFIType.i32 },
    GetAspectRatioFilterEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetBitmapBits: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetBitmapDimensionEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetBkColor: { args: [FFIType.u64], returns: FFIType.u32 },
    GetBkMode: { args: [FFIType.u64], returns: FFIType.i32 },
    GetBoundsRect: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetBrushOrgEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetCharABCWidthsI: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetCharacterPlacementA: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.u32 },
    GetCharacterPlacementW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.u32 },
    GetCharWidth32A: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetCharWidth32W: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetCharWidthA: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetCharWidthI: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetCharWidthW: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetClipBox: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetClipRgn: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GetColorAdjustment: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetColorSpace: { args: [FFIType.u64], returns: FFIType.u64 },
    GetCurrentObject: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    GetCurrentPositionEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetDCBrushColor: { args: [FFIType.u64], returns: FFIType.u32 },
    GetDCOrgEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetDCPenColor: { args: [FFIType.u64], returns: FFIType.u32 },
    GetDeviceCaps: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GetDeviceGammaRamp: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetDIBColorTable: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetDIBits: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetEnhMetaFileA: { args: [FFIType.ptr], returns: FFIType.u64 },
    GetEnhMetaFileBits: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetEnhMetaFileDescriptionA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetEnhMetaFileDescriptionW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetEnhMetaFileHeader: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetEnhMetaFilePaletteEntries: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetEnhMetaFilePixelFormat: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetEnhMetaFileW: { args: [FFIType.ptr], returns: FFIType.u64 },
    GetFontData: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetFontLanguageInfo: { args: [FFIType.u64], returns: FFIType.u32 },
    GetFontUnicodeRanges: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    GetGlyphIndicesA: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetGlyphIndicesW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetGlyphOutlineA: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetGlyphOutlineW: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetGraphicsMode: { args: [FFIType.u64], returns: FFIType.i32 },
    GetICMProfileA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetICMProfileW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetKerningPairsA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetKerningPairsW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetLayout: { args: [FFIType.u64], returns: FFIType.u32 },
    GetLogColorSpaceA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetLogColorSpaceW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetMapMode: { args: [FFIType.u64], returns: FFIType.i32 },
    GetMetaFileA: { args: [FFIType.ptr], returns: FFIType.u64 },
    GetMetaFileBitsEx: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetMetaFileW: { args: [FFIType.ptr], returns: FFIType.u64 },
    GetMetaRgn: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GetMiterLimit: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetNearestColor: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    GetNearestPaletteIndex: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    GetObjectA: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetObjectType: { args: [FFIType.u64], returns: FFIType.u32 },
    GetObjectW: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetPaletteEntries: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetPath: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetPixel: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.u32 },
    GetPixelFormat: { args: [FFIType.u64], returns: FFIType.i32 },
    GetPolyFillMode: { args: [FFIType.u64], returns: FFIType.i32 },
    GetRandomRgn: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GetRasterizerCaps: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetRegionData: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetRgnBox: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetROP2: { args: [FFIType.u64], returns: FFIType.i32 },
    GetStockObject: { args: [FFIType.i32], returns: FFIType.u64 },
    GetStretchBltMode: { args: [FFIType.u64], returns: FFIType.i32 },
    GetSystemPaletteEntries: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetSystemPaletteUse: { args: [FFIType.u64], returns: FFIType.u32 },
    GetTextAlign: { args: [FFIType.u64], returns: FFIType.u32 },
    GetTextCharacterExtra: { args: [FFIType.u64], returns: FFIType.i32 },
    GetTextCharset: { args: [FFIType.u64], returns: FFIType.i32 },
    GetTextCharsetInfo: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetTextColor: { args: [FFIType.u64], returns: FFIType.u32 },
    GetTextExtentExPointI: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetTextExtentPointI: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetTextFaceA: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetTextFaceW: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetTextMetricsA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetTextMetricsW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetViewportExtEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetViewportOrgEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetWindowExtEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetWindowOrgEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetWinMetaFileBits: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.u64], returns: FFIType.u32 },
    GetWorldTransform: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IntersectClipRect: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    InvertRgn: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    LineDDA: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LineTo: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    LPtoDP: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    MaskBlt: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    ModifyWorldTransform: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    MoveToEx: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    OffsetClipRgn: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    OffsetRgn: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    OffsetViewportOrgEx: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    OffsetWindowOrgEx: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    PaintRgn: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    PatBlt: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    PathToRegion: { args: [FFIType.u64], returns: FFIType.u64 },
    Pie: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    PlayEnhMetaFile: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PlayEnhMetaFileRecord: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PlayMetaFile: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    PlayMetaFileRecord: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PlgBlt: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    PolyBezier: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PolyBezierTo: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PolyDraw: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    Polygon: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    Polyline: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    PolylineTo: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PolyPolygon: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    PolyPolyline: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PolyTextOutA: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    PolyTextOutW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    PtInRegion: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    PtVisible: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    RealizePalette: { args: [FFIType.u64], returns: FFIType.u32 },
    Rectangle: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    RectInRegion: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RectVisible: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RemoveFontMemResourceEx: { args: [FFIType.u64], returns: FFIType.i32 },
    RemoveFontResourceA: { args: [FFIType.ptr], returns: FFIType.i32 },
    RemoveFontResourceExA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RemoveFontResourceExW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RemoveFontResourceW: { args: [FFIType.ptr], returns: FFIType.i32 },
    ResetDCA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    ResetDCW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    ResizePalette: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    RestoreDC: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    RoundRect: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    SaveDC: { args: [FFIType.u64], returns: FFIType.i32 },
    ScaleViewportExtEx: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    ScaleWindowExtEx: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    SelectClipPath: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    SelectClipRgn: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    SelectObject: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    SelectPalette: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.u64 },
    SetAbortProc: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetArcDirection: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    SetBitmapBits: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetBitmapDimensionEx: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    SetBkColor: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    SetBkMode: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    SetBoundsRect: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    SetBrushOrgEx: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    SetColorAdjustment: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetColorSpace: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    SetDCBrushColor: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    SetDCPenColor: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    SetDeviceGammaRamp: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetDIBColorTable: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    SetDIBits: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetDIBitsToDevice: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetEnhMetaFileBits: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    SetGraphicsMode: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    SetICMMode: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    SetICMProfileA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetICMProfileW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetLayout: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    SetMapMode: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    SetMapperFlags: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    SetMetaFileBitsEx: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    SetMetaRgn: { args: [FFIType.u64], returns: FFIType.i32 },
    SetMiterLimit: { args: [FFIType.u64, FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    SetPaletteEntries: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    SetPixel: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.u32 },
    SetPixelFormat: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    SetPixelV: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    SetPolyFillMode: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    SetRectRgn: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    SetROP2: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    SetStretchBltMode: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    SetSystemPaletteUse: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    SetTextAlign: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    SetTextCharacterExtra: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    SetTextColor: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    SetTextJustification: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    SetViewportExtEx: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    SetViewportOrgEx: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    SetWindowExtEx: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    SetWindowOrgEx: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    SetWinMetaFileBits: { args: [FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    SetWorldTransform: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    StartDocA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    StartDocW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    StartPage: { args: [FFIType.u64], returns: FFIType.i32 },
    StretchBlt: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    StretchDIBits: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    StrokeAndFillPath: { args: [FFIType.u64], returns: FFIType.i32 },
    StrokePath: { args: [FFIType.u64], returns: FFIType.i32 },
    SwapBuffers: { args: [FFIType.u64], returns: FFIType.i32 },
    TextOutA: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    TextOutW: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    TranslateCharsetInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UnrealizeObject: { args: [FFIType.u64], returns: FFIType.i32 },
    UpdateColors: { args: [FFIType.u64], returns: FFIType.i32 },
    UpdateICMRegKeyA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UpdateICMRegKeyW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WidenPath: { args: [FFIType.u64], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-abortdoc
  public static AbortDoc(hdc: HDC): int {
    return GDI32.Load('AbortDoc')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-abortpath
  public static AbortPath(hdc: HDC): BOOL {
    return GDI32.Load('AbortPath')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-addfontmemresourceex
  public static AddFontMemResourceEx(pFileView: PVOID, cjSize: DWORD, pvResrved: PVOID | NULL, pNumFonts: DWORD_): HANDLE {
    return GDI32.Load('AddFontMemResourceEx')(pFileView, cjSize, pvResrved, pNumFonts);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-addfontresourcea
  public static AddFontResourceA(lpFileName: LPCSTR): int {
    return GDI32.Load('AddFontResourceA')(lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-addfontresourceexa
  public static AddFontResourceExA(name: LPCSTR, fl: DWORD, res: PVOID | NULL): int {
    return GDI32.Load('AddFontResourceExA')(name, fl, res);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-addfontresourceexw
  public static AddFontResourceExW(name: LPCWSTR, fl: DWORD, res: PVOID | NULL): int {
    return GDI32.Load('AddFontResourceExW')(name, fl, res);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-addfontresourcew
  public static AddFontResourceW(lpFileName: LPCWSTR): int {
    return GDI32.Load('AddFontResourceW')(lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-anglearc
  public static AngleArc(hdc: HDC, x: int, y: int, r: DWORD, StartAngle: FLOAT, SweepAngle: FLOAT): BOOL {
    return GDI32.Load('AngleArc')(hdc, x, y, r, StartAngle, SweepAngle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-animatepalette
  public static AnimatePalette(hPal: HPALETTE, iStartIndex: UINT, cEntries: UINT, ppe: PALETTEENTRY_): BOOL {
    return GDI32.Load('AnimatePalette')(hPal, iStartIndex, cEntries, ppe);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-arc
  public static Arc(hdc: HDC, x1: int, y1: int, x2: int, y2: int, x3: int, y3: int, x4: int, y4: int): BOOL {
    return GDI32.Load('Arc')(hdc, x1, y1, x2, y2, x3, y3, x4, y4);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-arcto
  public static ArcTo(hdc: HDC, left: int, top: int, right: int, bottom: int, xr1: int, yr1: int, xr2: int, yr2: int): BOOL {
    return GDI32.Load('ArcTo')(hdc, left, top, right, bottom, xr1, yr1, xr2, yr2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-beginpath
  public static BeginPath(hdc: HDC): BOOL {
    return GDI32.Load('BeginPath')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-bitblt
  public static BitBlt(hdc: HDC, x: int, y: int, cx: int, cy: int, hdcSrc: HDC, x1: int, y1: int, rop: DWORD): BOOL {
    return GDI32.Load('BitBlt')(hdc, x, y, cx, cy, hdcSrc, x1, y1, rop);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-canceldc
  public static CancelDC(hdc: HDC): BOOL {
    return GDI32.Load('CancelDC')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-checkcolorsingamut
  public static CheckColorsInGamut(hdc: HDC, lpRGBTriple: LPRGBTRIPLE, dlpBuffer: LPVOID, nCount: DWORD): BOOL {
    return GDI32.Load('CheckColorsInGamut')(hdc, lpRGBTriple, dlpBuffer, nCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-choosepixelformat
  public static ChoosePixelFormat(hdc: HDC, ppfd: PIXELFORMATDESCRIPTOR_): int {
    return GDI32.Load('ChoosePixelFormat')(hdc, ppfd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-chord
  public static Chord(hdc: HDC, x1: int, y1: int, x2: int, y2: int, x3: int, y3: int, x4: int, y4: int): BOOL {
    return GDI32.Load('Chord')(hdc, x1, y1, x2, y2, x3, y3, x4, y4);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-closeenhmetafile
  public static CloseEnhMetaFile(hdc: HDC): HENHMETAFILE {
    return GDI32.Load('CloseEnhMetaFile')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-closefigure
  public static CloseFigure(hdc: HDC): BOOL {
    return GDI32.Load('CloseFigure')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-closemetafile
  public static CloseMetaFile(hdc: HDC): HMETAFILE {
    return GDI32.Load('CloseMetaFile')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-colorcorrectpalette
  public static ColorCorrectPalette(hdc: HDC, hPal: HPALETTE, deFirst: DWORD, num: DWORD): BOOL {
    return GDI32.Load('ColorCorrectPalette')(hdc, hPal, deFirst, num);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-colormatchtotarget
  public static ColorMatchToTarget(hdc: HDC, hdcTarget: HDC, action: DWORD): BOOL {
    return GDI32.Load('ColorMatchToTarget')(hdc, hdcTarget, action);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-combinergn
  public static CombineRgn(hrgnDst: HRGN, hrgnSrc1: HRGN, hrgnSrc2: HRGN, iMode: int): int {
    return GDI32.Load('CombineRgn')(hrgnDst, hrgnSrc1, hrgnSrc2, iMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-combinetransform
  public static CombineTransform(lpxfOut: LPXFORM, lpxf1: XFORM_, lpxf2: XFORM_): BOOL {
    return GDI32.Load('CombineTransform')(lpxfOut, lpxf1, lpxf2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-copyenhmetafilea
  public static CopyEnhMetaFileA(hEnh: HENHMETAFILE, lpFileName: LPCSTR | NULL): HENHMETAFILE {
    return GDI32.Load('CopyEnhMetaFileA')(hEnh, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-copyenhmetafilew
  public static CopyEnhMetaFileW(hEnh: HENHMETAFILE, lpFileName: LPCWSTR | NULL): HENHMETAFILE {
    return GDI32.Load('CopyEnhMetaFileW')(hEnh, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-copymetafilea
  public static CopyMetaFileA(hmf: HMETAFILE, lpFileName: LPCSTR | NULL): HMETAFILE {
    return GDI32.Load('CopyMetaFileA')(hmf, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-copymetafilew
  public static CopyMetaFileW(hmf: HMETAFILE, lpFileName: LPCWSTR | NULL): HMETAFILE {
    return GDI32.Load('CopyMetaFileW')(hmf, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createbitmap
  public static CreateBitmap(nWidth: int, nHeight: int, nPlanes: UINT, nBitCount: UINT, lpBits: LPVOID | NULL): HBITMAP {
    return GDI32.Load('CreateBitmap')(nWidth, nHeight, nPlanes, nBitCount, lpBits);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createbitmapindirect
  public static CreateBitmapIndirect(pbm: BITMAP_): HBITMAP {
    return GDI32.Load('CreateBitmapIndirect')(pbm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createbrushindirect
  public static CreateBrushIndirect(plbrush: LOGBRUSH_): HBRUSH {
    return GDI32.Load('CreateBrushIndirect')(plbrush);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createcolorspacea
  public static CreateColorSpaceA(lplcs: LPLOGCOLORSPACEA): HCOLORSPACE {
    return GDI32.Load('CreateColorSpaceA')(lplcs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createcolorspacew
  public static CreateColorSpaceW(lplcs: LPLOGCOLORSPACEW): HCOLORSPACE {
    return GDI32.Load('CreateColorSpaceW')(lplcs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createcompatiblebitmap
  public static CreateCompatibleBitmap(hdc: HDC, cx: int, cy: int): HBITMAP {
    return GDI32.Load('CreateCompatibleBitmap')(hdc, cx, cy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createcompatibledc
  public static CreateCompatibleDC(hdc: HDC | 0n): HDC {
    return GDI32.Load('CreateCompatibleDC')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createdca
  public static CreateDCA(pwszDriver: LPCSTR | NULL, pwszDevice: LPCSTR | NULL, pszPort: LPCSTR | NULL, pdm: DEVMODEA_ | NULL): HDC {
    return GDI32.Load('CreateDCA')(pwszDriver, pwszDevice, pszPort, pdm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createdcw
  public static CreateDCW(pwszDriver: LPCWSTR | NULL, pwszDevice: LPCWSTR | NULL, pszPort: LPCWSTR | NULL, pdm: DEVMODEW_ | NULL): HDC {
    return GDI32.Load('CreateDCW')(pwszDriver, pwszDevice, pszPort, pdm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createdibitmap
  public static CreateDIBitmap(hdc: HDC, pbmih: BITMAPINFOHEADER_, flInit: DWORD, pjBits: LPVOID, pbmi: BITMAPINFO_, iUsage: UINT): HBITMAP {
    return GDI32.Load('CreateDIBitmap')(hdc, pbmih, flInit, pjBits, pbmi, iUsage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createdibpatternbrush
  public static CreateDIBPatternBrush(h: HGLOBAL, iUsage: UINT): HBRUSH {
    return GDI32.Load('CreateDIBPatternBrush')(h, iUsage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createdibpatternbrushpt
  public static CreateDIBPatternBrushPt(lpPackedDIB: LPVOID, iUsage: UINT): HBRUSH {
    return GDI32.Load('CreateDIBPatternBrushPt')(lpPackedDIB, iUsage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createdibsection
  public static CreateDIBSection(hdc: HDC, pbmi: BITMAPINFO_, usage: UINT, ppvBits: LPVOID, hSection: HANDLE | 0n, offset: DWORD): HBITMAP {
    return GDI32.Load('CreateDIBSection')(hdc, pbmi, usage, ppvBits, hSection, offset);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-creatediscardablebitmap
  public static CreateDiscardableBitmap(hdc: HDC, cx: int, cy: int): HBITMAP {
    return GDI32.Load('CreateDiscardableBitmap')(hdc, cx, cy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createellipticrgn
  public static CreateEllipticRgn(x1: int, y1: int, x2: int, y2: int): HRGN {
    return GDI32.Load('CreateEllipticRgn')(x1, y1, x2, y2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createellipticrgnindirect
  public static CreateEllipticRgnIndirect(lprect: RECT_): HRGN {
    return GDI32.Load('CreateEllipticRgnIndirect')(lprect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createenhmetafilea
  public static CreateEnhMetaFileA(hdc: HDC | 0n, lpFilename: LPCSTR | NULL, lprc: RECT_ | NULL, lpDesc: LPCSTR | NULL): HDC {
    return GDI32.Load('CreateEnhMetaFileA')(hdc, lpFilename, lprc, lpDesc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createenhmetafilew
  public static CreateEnhMetaFileW(hdc: HDC | 0n, lpFilename: LPCWSTR | NULL, lprc: RECT_ | NULL, lpDesc: LPCWSTR | NULL): HDC {
    return GDI32.Load('CreateEnhMetaFileW')(hdc, lpFilename, lprc, lpDesc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createfonta
  public static CreateFontA(
    cHeight: int,
    cWidth: int,
    cEscapement: int,
    cOrientation: int,
    cWeight: int,
    bItalic: DWORD,
    bUnderline: DWORD,
    bStrikeOut: DWORD,
    iCharSet: DWORD,
    iOutPrecision: DWORD,
    iClipPrecision: DWORD,
    iQuality: DWORD,
    iPitchAndFamily: DWORD,
    pszFaceName: LPCSTR,
  ): HFONT {
    return GDI32.Load('CreateFontA')(cHeight, cWidth, cEscapement, cOrientation, cWeight, bItalic, bUnderline, bStrikeOut, iCharSet, iOutPrecision, iClipPrecision, iQuality, iPitchAndFamily, pszFaceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createfontindirecta
  public static CreateFontIndirectA(lplf: LOGFONTA_): HFONT {
    return GDI32.Load('CreateFontIndirectA')(lplf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createfontindirectexa
  public static CreateFontIndirectExA(lpelfe: LPVOID): HFONT {
    return GDI32.Load('CreateFontIndirectExA')(lpelfe);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createfontindirectexw
  public static CreateFontIndirectExW(lpelfe: LPVOID): HFONT {
    return GDI32.Load('CreateFontIndirectExW')(lpelfe);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createfontindirectw
  public static CreateFontIndirectW(lplf: LOGFONTW_): HFONT {
    return GDI32.Load('CreateFontIndirectW')(lplf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createfontw
  public static CreateFontW(
    cHeight: int,
    cWidth: int,
    cEscapement: int,
    cOrientation: int,
    cWeight: int,
    bItalic: DWORD,
    bUnderline: DWORD,
    bStrikeOut: DWORD,
    iCharSet: DWORD,
    iOutPrecision: DWORD,
    iClipPrecision: DWORD,
    iQuality: DWORD,
    iPitchAndFamily: DWORD,
    pszFaceName: LPCWSTR,
  ): HFONT {
    return GDI32.Load('CreateFontW')(cHeight, cWidth, cEscapement, cOrientation, cWeight, bItalic, bUnderline, bStrikeOut, iCharSet, iOutPrecision, iClipPrecision, iQuality, iPitchAndFamily, pszFaceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createhalftonepalette
  public static CreateHalftonePalette(hdc: HDC): HPALETTE {
    return GDI32.Load('CreateHalftonePalette')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createhatchbrush
  public static CreateHatchBrush(iHatch: int, color: COLORREF): HBRUSH {
    return GDI32.Load('CreateHatchBrush')(iHatch, color);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createica
  public static CreateICA(pszDriver: LPCSTR, pszDevice: LPCSTR, pszPort: LPCSTR | NULL, pdm: DEVMODEA_ | NULL): HDC {
    return GDI32.Load('CreateICA')(pszDriver, pszDevice, pszPort, pdm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createicw
  public static CreateICW(pszDriver: LPCWSTR, pszDevice: LPCWSTR, pszPort: LPCWSTR | NULL, pdm: DEVMODEW_ | NULL): HDC {
    return GDI32.Load('CreateICW')(pszDriver, pszDevice, pszPort, pdm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createmetafilea
  public static CreateMetaFileA(pszFile: LPCSTR | NULL): HDC {
    return GDI32.Load('CreateMetaFileA')(pszFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createmetafilew
  public static CreateMetaFileW(pszFile: LPCWSTR | NULL): HDC {
    return GDI32.Load('CreateMetaFileW')(pszFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createpalette
  public static CreatePalette(plpal: LOGPALETTE_): HPALETTE {
    return GDI32.Load('CreatePalette')(plpal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createpatternbrush
  public static CreatePatternBrush(hbm: HBITMAP): HBRUSH {
    return GDI32.Load('CreatePatternBrush')(hbm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createpen
  public static CreatePen(iStyle: int, cWidth: int, color: COLORREF): HPEN {
    return GDI32.Load('CreatePen')(iStyle, cWidth, color);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createpenindirect
  public static CreatePenIndirect(plpen: LOGPEN_): HPEN {
    return GDI32.Load('CreatePenIndirect')(plpen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createpolygonrgn
  public static CreatePolygonRgn(pptl: POINT_, cPoint: int, iMode: int): HRGN {
    return GDI32.Load('CreatePolygonRgn')(pptl, cPoint, iMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createpolypolygonrgn
  public static CreatePolyPolygonRgn(pptl: POINT_, pc: INT_, cPoly: int, iMode: int): HRGN {
    return GDI32.Load('CreatePolyPolygonRgn')(pptl, pc, cPoly, iMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createrectrgn
  public static CreateRectRgn(x1: int, y1: int, x2: int, y2: int): HRGN {
    return GDI32.Load('CreateRectRgn')(x1, y1, x2, y2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createrectrgnindirect
  public static CreateRectRgnIndirect(lprect: RECT_): HRGN {
    return GDI32.Load('CreateRectRgnIndirect')(lprect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createroundrectrgn
  public static CreateRoundRectRgn(x1: int, y1: int, x2: int, y2: int, w: int, h: int): HRGN {
    return GDI32.Load('CreateRoundRectRgn')(x1, y1, x2, y2, w, h);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createscalablefontresourcea
  public static CreateScalableFontResourceA(fdwHidden: DWORD, lpszFont: LPCSTR, lpszFile: LPCSTR, lpszPath: LPCSTR | NULL): BOOL {
    return GDI32.Load('CreateScalableFontResourceA')(fdwHidden, lpszFont, lpszFile, lpszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createscalablefontresourcew
  public static CreateScalableFontResourceW(fdwHidden: DWORD, lpszFont: LPCWSTR, lpszFile: LPCWSTR, lpszPath: LPCWSTR | NULL): BOOL {
    return GDI32.Load('CreateScalableFontResourceW')(fdwHidden, lpszFont, lpszFile, lpszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createsolidbrush
  public static CreateSolidBrush(color: COLORREF): HBRUSH {
    return GDI32.Load('CreateSolidBrush')(color);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-deletecolorspace
  public static DeleteColorSpace(hcs: HCOLORSPACE): BOOL {
    return GDI32.Load('DeleteColorSpace')(hcs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-deletedc
  public static DeleteDC(hdc: HDC): BOOL {
    return GDI32.Load('DeleteDC')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-deleteenhmetafile
  public static DeleteEnhMetaFile(hmf: HENHMETAFILE): BOOL {
    return GDI32.Load('DeleteEnhMetaFile')(hmf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-deletemetafile
  public static DeleteMetaFile(hmf: HMETAFILE): BOOL {
    return GDI32.Load('DeleteMetaFile')(hmf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-deleteobject
  public static DeleteObject(ho: HGDIOBJ): BOOL {
    return GDI32.Load('DeleteObject')(ho);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-describepixelformat
  public static DescribePixelFormat(hdc: HDC, iPixelFormat: int, nBytes: UINT, ppfd: LPPIXELFORMATDESCRIPTOR | NULL): int {
    return GDI32.Load('DescribePixelFormat')(hdc, iPixelFormat, nBytes, ppfd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-dptolp
  public static DPtoLP(hdc: HDC, lppt: LPPOINT, c: int): BOOL {
    return GDI32.Load('DPtoLP')(hdc, lppt, c);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-drawescape
  public static DrawEscape(hdc: HDC, iEscape: int, cjIn: int, lpIn: LPCSTR): int {
    return GDI32.Load('DrawEscape')(hdc, iEscape, cjIn, lpIn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-ellipse
  public static Ellipse(hdc: HDC, left: int, top: int, right: int, bottom: int): BOOL {
    return GDI32.Load('Ellipse')(hdc, left, top, right, bottom);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-enddoc
  public static EndDoc(hdc: HDC): int {
    return GDI32.Load('EndDoc')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-endpage
  public static EndPage(hdc: HDC): int {
    return GDI32.Load('EndPage')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-endpath
  public static EndPath(hdc: HDC): BOOL {
    return GDI32.Load('EndPath')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-enumenhmetafile
  public static EnumEnhMetaFile(hdc: HDC | 0n, hmf: HENHMETAFILE, proc: ENHMFENUMPROC, param: LPVOID | NULL, lpRect: RECT_ | NULL): BOOL {
    return GDI32.Load('EnumEnhMetaFile')(hdc, hmf, proc, param, lpRect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-enumfontfamiliesa
  public static EnumFontFamiliesA(hdc: HDC, lpLogfont: LPCSTR | NULL, lpProc: FONTENUMPROCA, lParam: LPARAM): int {
    return GDI32.Load('EnumFontFamiliesA')(hdc, lpLogfont, lpProc, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-enumfontfamiliesexa
  public static EnumFontFamiliesExA(hdc: HDC, lpLogfont: LPLOGFONTA, lpProc: FONTENUMPROCA, lParam: LPARAM, dwFlags: DWORD): int {
    return GDI32.Load('EnumFontFamiliesExA')(hdc, lpLogfont, lpProc, lParam, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-enumfontfamiliesexw
  public static EnumFontFamiliesExW(hdc: HDC, lpLogfont: LPLOGFONTW, lpProc: FONTENUMPROCW, lParam: LPARAM, dwFlags: DWORD): int {
    return GDI32.Load('EnumFontFamiliesExW')(hdc, lpLogfont, lpProc, lParam, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-enumfontfamiliesw
  public static EnumFontFamiliesW(hdc: HDC, lpLogfont: LPCWSTR | NULL, lpProc: FONTENUMPROCW, lParam: LPARAM): int {
    return GDI32.Load('EnumFontFamiliesW')(hdc, lpLogfont, lpProc, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-enumfontsa
  public static EnumFontsA(hdc: HDC, lpLogfont: LPCSTR | NULL, lpProc: FONTENUMPROCA, lParam: LPARAM): int {
    return GDI32.Load('EnumFontsA')(hdc, lpLogfont, lpProc, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-enumfontsw
  public static EnumFontsW(hdc: HDC, lpLogfont: LPCWSTR | NULL, lpProc: FONTENUMPROCW, lParam: LPARAM): int {
    return GDI32.Load('EnumFontsW')(hdc, lpLogfont, lpProc, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-enumicmprofilesa
  public static EnumICMProfilesA(hdc: HDC, proc: ICMENUMPROCA, param: LPARAM): int {
    return GDI32.Load('EnumICMProfilesA')(hdc, proc, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-enumicmprofilesw
  public static EnumICMProfilesW(hdc: HDC, proc: ICMENUMPROCW, param: LPARAM): int {
    return GDI32.Load('EnumICMProfilesW')(hdc, proc, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-enummetafile
  public static EnumMetaFile(hdc: HDC, hmf: HMETAFILE, proc: MFENUMPROC, param: LPARAM): BOOL {
    return GDI32.Load('EnumMetaFile')(hdc, hmf, proc, param);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-enumobjects
  public static EnumObjects(hdc: HDC, nType: int, lpFunc: GOBJENUMPROC, lParam: LPVOID): int {
    return GDI32.Load('EnumObjects')(hdc, nType, lpFunc, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-equalrgn
  public static EqualRgn(hrgn1: HRGN, hrgn2: HRGN): BOOL {
    return GDI32.Load('EqualRgn')(hrgn1, hrgn2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-escape
  public static Escape(hdc: HDC, iEscape: int, cjIn: int, pvIn: LPCSTR, pvOut: LPVOID | NULL): int {
    return GDI32.Load('Escape')(hdc, iEscape, cjIn, pvIn, pvOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-excludecliprect
  public static ExcludeClipRect(hdc: HDC, left: int, top: int, right: int, bottom: int): int {
    return GDI32.Load('ExcludeClipRect')(hdc, left, top, right, bottom);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-extcreatepen
  public static ExtCreatePen(iPenStyle: DWORD, cWidth: DWORD, plbrush: LOGBRUSH_, cStyle: DWORD, pstyle: DWORD_ | NULL): HPEN {
    return GDI32.Load('ExtCreatePen')(iPenStyle, cWidth, plbrush, cStyle, pstyle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-extcreateregion
  public static ExtCreateRegion(lpx: XFORM_ | NULL, nCount: DWORD, lpData: RGNDATA_): HRGN {
    return GDI32.Load('ExtCreateRegion')(lpx, nCount, lpData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-extescape
  public static ExtEscape(hdc: HDC, iEscape: int, cjInput: int, lpInData: LPCSTR, cjOutput: int, lpOutData: LPSTR): int {
    return GDI32.Load('ExtEscape')(hdc, iEscape, cjInput, lpInData, cjOutput, lpOutData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-extfloodfill
  public static ExtFloodFill(hdc: HDC, x: int, y: int, color: COLORREF, type: UINT): BOOL {
    return GDI32.Load('ExtFloodFill')(hdc, x, y, color, type);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-extselectcliprgn
  public static ExtSelectClipRgn(hdc: HDC, hrgn: HRGN | 0n, mode: int): int {
    return GDI32.Load('ExtSelectClipRgn')(hdc, hrgn, mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-exttextouta
  public static ExtTextOutA(hdc: HDC, x: int, y: int, options: UINT, lprect: RECT_ | NULL, lpString: LPCSTR, c: UINT, lpDx: INT_ | NULL): BOOL {
    return GDI32.Load('ExtTextOutA')(hdc, x, y, options, lprect, lpString, c, lpDx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-exttextoutw
  public static ExtTextOutW(hdc: HDC, x: int, y: int, options: UINT, lprect: RECT_ | NULL, lpString: LPCWSTR, c: UINT, lpDx: INT_ | NULL): BOOL {
    return GDI32.Load('ExtTextOutW')(hdc, x, y, options, lprect, lpString, c, lpDx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-fillpath
  public static FillPath(hdc: HDC): BOOL {
    return GDI32.Load('FillPath')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-fillrgn
  public static FillRgn(hdc: HDC, hrgn: HRGN, hbr: HBRUSH): BOOL {
    return GDI32.Load('FillRgn')(hdc, hrgn, hbr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-fixbrushorgex
  public static FixBrushOrgEx(hdc: HDC, x: int, y: int, ptl: LPPOINT): BOOL {
    return GDI32.Load('FixBrushOrgEx')(hdc, x, y, ptl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-flattenpath
  public static FlattenPath(hdc: HDC): BOOL {
    return GDI32.Load('FlattenPath')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-floodfill
  public static FloodFill(hdc: HDC, x: int, y: int, color: COLORREF): BOOL {
    return GDI32.Load('FloodFill')(hdc, x, y, color);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-framergn
  public static FrameRgn(hdc: HDC, hrgn: HRGN, hbr: HBRUSH, w: int, h: int): BOOL {
    return GDI32.Load('FrameRgn')(hdc, hrgn, hbr, w, h);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-gdialphablend
  public static GdiAlphaBlend(hdcDest: HDC, xoriginDest: int, yoriginDest: int, wDest: int, hDest: int, hdcSrc: HDC, xoriginSrc: int, yoriginSrc: int, wSrc: int, hSrc: int, ftn: BLENDFUNCTION): BOOL {
    return GDI32.Load('GdiAlphaBlend')(hdcDest, xoriginDest, yoriginDest, wDest, hDest, hdcSrc, xoriginSrc, yoriginSrc, wSrc, hSrc, ftn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-gdicomment
  public static GdiComment(hdc: HDC, nSize: UINT, lpData: BYTE_): BOOL {
    return GDI32.Load('GdiComment')(hdc, nSize, lpData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-gdiflush
  public static GdiFlush(): BOOL {
    return GDI32.Load('GdiFlush')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-gdigetbatchlimit
  public static GdiGetBatchLimit(): DWORD {
    return GDI32.Load('GdiGetBatchLimit')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-gdigradientfill
  public static GdiGradientFill(hdc: HDC, pVertex: PTRIVERTEX, nVertex: ULONG, pMesh: PVOID, nCount: ULONG, ulMode: ULONG): BOOL {
    return GDI32.Load('GdiGradientFill')(hdc, pVertex, nVertex, pMesh, nCount, ulMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-gdisetbatchlimit
  public static GdiSetBatchLimit(dw: DWORD): DWORD {
    return GDI32.Load('GdiSetBatchLimit')(dw);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-gditransparentblt
  public static GdiTransparentBlt(hdcDest: HDC, xoriginDest: int, yoriginDest: int, wDest: int, hDest: int, hdcSrc: HDC, xoriginSrc: int, yoriginSrc: int, wSrc: int, hSrc: int, crTransparent: UINT): BOOL {
    return GDI32.Load('GdiTransparentBlt')(hdcDest, xoriginDest, yoriginDest, wDest, hDest, hdcSrc, xoriginSrc, yoriginSrc, wSrc, hSrc, crTransparent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getarcdirection
  public static GetArcDirection(hdc: HDC): int {
    return GDI32.Load('GetArcDirection')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getaspectratiofilterex
  public static GetAspectRatioFilterEx(hdc: HDC, lpsize: LPSIZE): BOOL {
    return GDI32.Load('GetAspectRatioFilterEx')(hdc, lpsize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getbitmapbits
  public static GetBitmapBits(hbit: HBITMAP, cb: LONG, lpvBits: LPVOID): LONG {
    return GDI32.Load('GetBitmapBits')(hbit, cb, lpvBits);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getbitmapdimensionex
  public static GetBitmapDimensionEx(hbit: HBITMAP, lpsize: LPSIZE): BOOL {
    return GDI32.Load('GetBitmapDimensionEx')(hbit, lpsize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getbkcolor
  public static GetBkColor(hdc: HDC): COLORREF {
    return GDI32.Load('GetBkColor')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getbkmode
  public static GetBkMode(hdc: HDC): int {
    return GDI32.Load('GetBkMode')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getboundsrect
  public static GetBoundsRect(hdc: HDC, lprect: LPRECT, flags: UINT): UINT {
    return GDI32.Load('GetBoundsRect')(hdc, lprect, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getbrushorgex
  public static GetBrushOrgEx(hdc: HDC, lppt: LPPOINT): BOOL {
    return GDI32.Load('GetBrushOrgEx')(hdc, lppt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getcharabcwidthsi
  public static GetCharABCWidthsI(hdc: HDC, giFirst: UINT, cgi: UINT, pgi: LPWORD | NULL, pabc: LPABC): BOOL {
    return GDI32.Load('GetCharABCWidthsI')(hdc, giFirst, cgi, pgi, pabc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getcharacterplacementa
  public static GetCharacterPlacementA(hdc: HDC, lpString: LPCSTR, nCount: int, nMexExtent: int, dwFlags: DWORD): DWORD {
    return GDI32.Load('GetCharacterPlacementA')(hdc, lpString, nCount, nMexExtent, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getcharacterplacementw
  public static GetCharacterPlacementW(hdc: HDC, lpString: LPCWSTR, nCount: int, nMexExtent: int, dwFlags: DWORD): DWORD {
    return GDI32.Load('GetCharacterPlacementW')(hdc, lpString, nCount, nMexExtent, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getcharwidth32a
  public static GetCharWidth32A(hdc: HDC, iFirst: UINT, iLast: UINT, lpBuffer: LPINT): BOOL {
    return GDI32.Load('GetCharWidth32A')(hdc, iFirst, iLast, lpBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getcharwidth32w
  public static GetCharWidth32W(hdc: HDC, iFirst: UINT, iLast: UINT, lpBuffer: LPINT): BOOL {
    return GDI32.Load('GetCharWidth32W')(hdc, iFirst, iLast, lpBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getcharwidtha
  public static GetCharWidthA(hdc: HDC, iFirst: UINT, iLast: UINT, lpBuffer: LPINT): BOOL {
    return GDI32.Load('GetCharWidthA')(hdc, iFirst, iLast, lpBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getcharwidthi
  public static GetCharWidthI(hdc: HDC, giFirst: UINT, cgi: UINT, pgi: LPWORD | NULL, piWidths: LPINT): BOOL {
    return GDI32.Load('GetCharWidthI')(hdc, giFirst, cgi, pgi, piWidths);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getcharwidthw
  public static GetCharWidthW(hdc: HDC, iFirst: UINT, iLast: UINT, lpBuffer: LPINT): BOOL {
    return GDI32.Load('GetCharWidthW')(hdc, iFirst, iLast, lpBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getclipbox
  public static GetClipBox(hdc: HDC, lprect: LPRECT): int {
    return GDI32.Load('GetClipBox')(hdc, lprect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getcliprgn
  public static GetClipRgn(hdc: HDC, hrgn: HRGN): int {
    return GDI32.Load('GetClipRgn')(hdc, hrgn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getcoloradjustment
  public static GetColorAdjustment(hdc: HDC, lpca: LPCOLORADJUSTMENT): BOOL {
    return GDI32.Load('GetColorAdjustment')(hdc, lpca);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getcolorspace
  public static GetColorSpace(hdc: HDC): HCOLORSPACE {
    return GDI32.Load('GetColorSpace')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getcurrentobject
  public static GetCurrentObject(hdc: HDC, type: UINT): HGDIOBJ {
    return GDI32.Load('GetCurrentObject')(hdc, type);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getcurrentpositionex
  public static GetCurrentPositionEx(hdc: HDC, lppt: LPPOINT): BOOL {
    return GDI32.Load('GetCurrentPositionEx')(hdc, lppt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getdcbrushcolor
  public static GetDCBrushColor(hdc: HDC): COLORREF {
    return GDI32.Load('GetDCBrushColor')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getdcorgex
  public static GetDCOrgEx(hdc: HDC, lppt: LPPOINT): BOOL {
    return GDI32.Load('GetDCOrgEx')(hdc, lppt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getdcpencolor
  public static GetDCPenColor(hdc: HDC): COLORREF {
    return GDI32.Load('GetDCPenColor')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getdevicecaps
  public static GetDeviceCaps(hdc: HDC, index: int): int {
    return GDI32.Load('GetDeviceCaps')(hdc, index);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getdevicegammaramp
  public static GetDeviceGammaRamp(hdc: HDC, lpRamp: LPVOID): BOOL {
    return GDI32.Load('GetDeviceGammaRamp')(hdc, lpRamp);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getdibcolortable
  public static GetDIBColorTable(hdc: HDC, iStart: UINT, cEntries: UINT, prgbq: RGBQUAD_): UINT {
    return GDI32.Load('GetDIBColorTable')(hdc, iStart, cEntries, prgbq);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getdibits
  public static GetDIBits(hdc: HDC, hbm: HBITMAP, start: UINT, cLines: UINT, lpvBits: LPVOID | NULL, lpbmi: LPBITMAPINFO, usage: UINT): int {
    return GDI32.Load('GetDIBits')(hdc, hbm, start, cLines, lpvBits, lpbmi, usage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getenhmetafilea
  public static GetEnhMetaFileA(lpName: LPCSTR): HENHMETAFILE {
    return GDI32.Load('GetEnhMetaFileA')(lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getenhmetafilebits
  public static GetEnhMetaFileBits(hEMF: HENHMETAFILE, nSize: UINT, lpData: LPBYTE | NULL): UINT {
    return GDI32.Load('GetEnhMetaFileBits')(hEMF, nSize, lpData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getenhmetafiledescriptiona
  public static GetEnhMetaFileDescriptionA(hemf: HENHMETAFILE, cchBuffer: UINT, lpDescription: LPSTR | NULL): UINT {
    return GDI32.Load('GetEnhMetaFileDescriptionA')(hemf, cchBuffer, lpDescription);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getenhmetafiledescriptionw
  public static GetEnhMetaFileDescriptionW(hemf: HENHMETAFILE, cchBuffer: UINT, lpDescription: LPWSTR | NULL): UINT {
    return GDI32.Load('GetEnhMetaFileDescriptionW')(hemf, cchBuffer, lpDescription);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getenhmetafileheader
  public static GetEnhMetaFileHeader(hemf: HENHMETAFILE, nSize: UINT, lpEnhMetaHeader: LPENHMETAHEADER | NULL): UINT {
    return GDI32.Load('GetEnhMetaFileHeader')(hemf, nSize, lpEnhMetaHeader);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getenhmetafilepaletteentries
  public static GetEnhMetaFilePaletteEntries(hemf: HENHMETAFILE, nNumEntries: UINT, lpPaletteEntries: LPPALETTEENTRY | NULL): UINT {
    return GDI32.Load('GetEnhMetaFilePaletteEntries')(hemf, nNumEntries, lpPaletteEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getenhmetafilepixelformat
  public static GetEnhMetaFilePixelFormat(hemf: HENHMETAFILE, cbBuffer: UINT, ppfd: PIXELFORMATDESCRIPTOR_): UINT {
    return GDI32.Load('GetEnhMetaFilePixelFormat')(hemf, cbBuffer, ppfd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getenhmetafilew
  public static GetEnhMetaFileW(lpName: LPCWSTR): HENHMETAFILE {
    return GDI32.Load('GetEnhMetaFileW')(lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getfontdata
  public static GetFontData(hdc: HDC, dwTable: DWORD, dwOffset: DWORD, pvBuffer: PVOID | NULL, cjBuffer: DWORD): DWORD {
    return GDI32.Load('GetFontData')(hdc, dwTable, dwOffset, pvBuffer, cjBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getfontlanguageinfo
  public static GetFontLanguageInfo(hdc: HDC): DWORD {
    return GDI32.Load('GetFontLanguageInfo')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getfontunicoderanges
  public static GetFontUnicodeRanges(hdc: HDC, lpgs: LPGLYPHSET | NULL): DWORD {
    return GDI32.Load('GetFontUnicodeRanges')(hdc, lpgs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getglyphindicesa
  public static GetGlyphIndicesA(hdc: HDC, lpstr: LPCSTR, c: int, pgi: LPWORD, fl: DWORD): DWORD {
    return GDI32.Load('GetGlyphIndicesA')(hdc, lpstr, c, pgi, fl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getglyphindicesw
  public static GetGlyphIndicesW(hdc: HDC, lpstr: LPCWSTR, c: int, pgi: LPWORD, fl: DWORD): DWORD {
    return GDI32.Load('GetGlyphIndicesW')(hdc, lpstr, c, pgi, fl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getglyphoutlinea
  public static GetGlyphOutlineA(hdc: HDC, uChar: UINT, fuFormat: UINT, lpgm: LPGLYPHMETRICS, cjBuffer: DWORD, pvBuffer: LPVOID | NULL, lpmat2: MAT2_): DWORD {
    return GDI32.Load('GetGlyphOutlineA')(hdc, uChar, fuFormat, lpgm, cjBuffer, pvBuffer, lpmat2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getglyphoutlinew
  public static GetGlyphOutlineW(hdc: HDC, uChar: UINT, fuFormat: UINT, lpgm: LPGLYPHMETRICS, cjBuffer: DWORD, pvBuffer: LPVOID | NULL, lpmat2: MAT2_): DWORD {
    return GDI32.Load('GetGlyphOutlineW')(hdc, uChar, fuFormat, lpgm, cjBuffer, pvBuffer, lpmat2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getgraphicsmode
  public static GetGraphicsMode(hdc: HDC): int {
    return GDI32.Load('GetGraphicsMode')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-geticmprofilea
  public static GetICMProfileA(hdc: HDC, pBufSize: LPDWORD, pszFilename: LPSTR): BOOL {
    return GDI32.Load('GetICMProfileA')(hdc, pBufSize, pszFilename);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-geticmprofilew
  public static GetICMProfileW(hdc: HDC, pBufSize: LPDWORD, pszFilename: LPWSTR): BOOL {
    return GDI32.Load('GetICMProfileW')(hdc, pBufSize, pszFilename);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getkerningpairsa
  public static GetKerningPairsA(hdc: HDC, nPairs: DWORD, lpKernPair: LPKERNINGPAIR | NULL): DWORD {
    return GDI32.Load('GetKerningPairsA')(hdc, nPairs, lpKernPair);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getkerningpairsw
  public static GetKerningPairsW(hdc: HDC, nPairs: DWORD, lpKernPair: LPKERNINGPAIR | NULL): DWORD {
    return GDI32.Load('GetKerningPairsW')(hdc, nPairs, lpKernPair);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getlayout
  public static GetLayout(hdc: HDC): DWORD {
    return GDI32.Load('GetLayout')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getlogcolorspacea
  public static GetLogColorSpaceA(hColorSpace: HCOLORSPACE, lpBuffer: LPLOGCOLORSPACEA, nSize: DWORD): BOOL {
    return GDI32.Load('GetLogColorSpaceA')(hColorSpace, lpBuffer, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getlogcolorspacew
  public static GetLogColorSpaceW(hColorSpace: HCOLORSPACE, lpBuffer: LPLOGCOLORSPACEW, nSize: DWORD): BOOL {
    return GDI32.Load('GetLogColorSpaceW')(hColorSpace, lpBuffer, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getmapmode
  public static GetMapMode(hdc: HDC): int {
    return GDI32.Load('GetMapMode')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getmetafilea
  public static GetMetaFileA(lpName: LPCSTR): HMETAFILE {
    return GDI32.Load('GetMetaFileA')(lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getmetafilebitsex
  public static GetMetaFileBitsEx(hMF: HMETAFILE, cbBuffer: UINT, lpData: LPVOID | NULL): UINT {
    return GDI32.Load('GetMetaFileBitsEx')(hMF, cbBuffer, lpData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getmetafilew
  public static GetMetaFileW(lpName: LPCWSTR): HMETAFILE {
    return GDI32.Load('GetMetaFileW')(lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getmetargn
  public static GetMetaRgn(hdc: HDC, hrgn: HRGN): int {
    return GDI32.Load('GetMetaRgn')(hdc, hrgn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getmiterlimit
  public static GetMiterLimit(hdc: HDC, plimit: PFLOAT): BOOL {
    return GDI32.Load('GetMiterLimit')(hdc, plimit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getnearestcolor
  public static GetNearestColor(hdc: HDC, color: COLORREF): COLORREF {
    return GDI32.Load('GetNearestColor')(hdc, color);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getnearestpaletteindex
  public static GetNearestPaletteIndex(h: HPALETTE, color: COLORREF): UINT {
    return GDI32.Load('GetNearestPaletteIndex')(h, color);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getobjecta
  public static GetObjectA(h: HANDLE, c: int, pv: LPVOID | NULL): int {
    return GDI32.Load('GetObjectA')(h, c, pv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getobjecttype
  public static GetObjectType(h: HGDIOBJ): DWORD {
    return GDI32.Load('GetObjectType')(h);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getobjectw
  public static GetObjectW(h: HANDLE, c: int, pv: LPVOID | NULL): int {
    return GDI32.Load('GetObjectW')(h, c, pv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getpaletteentries
  public static GetPaletteEntries(hpal: HPALETTE, iStart: UINT, cEntries: UINT, pPalEntries: LPPALETTEENTRY): UINT {
    return GDI32.Load('GetPaletteEntries')(hpal, iStart, cEntries, pPalEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getpath
  public static GetPath(hdc: HDC, apt: LPPOINT, aj: LPBYTE, cpt: int): int {
    return GDI32.Load('GetPath')(hdc, apt, aj, cpt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getpixel
  public static GetPixel(hdc: HDC, x: int, y: int): COLORREF {
    return GDI32.Load('GetPixel')(hdc, x, y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getpixelformat
  public static GetPixelFormat(hdc: HDC): int {
    return GDI32.Load('GetPixelFormat')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getpolyfillmode
  public static GetPolyFillMode(hdc: HDC): int {
    return GDI32.Load('GetPolyFillMode')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getrandomrgn
  public static GetRandomRgn(hdc: HDC, hrgn: HRGN, i: INT): int {
    return GDI32.Load('GetRandomRgn')(hdc, hrgn, i);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getrasterizercaps
  public static GetRasterizerCaps(lpraststat: LPVOID, cjBytes: UINT): BOOL {
    return GDI32.Load('GetRasterizerCaps')(lpraststat, cjBytes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getregiondata
  public static GetRegionData(hrgn: HRGN, nCount: DWORD, lpRgnData: LPRGNDATA | NULL): DWORD {
    return GDI32.Load('GetRegionData')(hrgn, nCount, lpRgnData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getrgnbox
  public static GetRgnBox(hrgn: HRGN, lprc: LPRECT): int {
    return GDI32.Load('GetRgnBox')(hrgn, lprc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getrop2
  public static GetROP2(hdc: HDC): int {
    return GDI32.Load('GetROP2')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getstockobject
  public static GetStockObject(i: int): HGDIOBJ {
    return GDI32.Load('GetStockObject')(i);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getstretchbltmode
  public static GetStretchBltMode(hdc: HDC): int {
    return GDI32.Load('GetStretchBltMode')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getsystempaletteentries
  public static GetSystemPaletteEntries(hdc: HDC, iStart: UINT, cEntries: UINT, pPalEntries: LPPALETTEENTRY | NULL): UINT {
    return GDI32.Load('GetSystemPaletteEntries')(hdc, iStart, cEntries, pPalEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getsystempaletteuse
  public static GetSystemPaletteUse(hdc: HDC): UINT {
    return GDI32.Load('GetSystemPaletteUse')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-gettextalign
  public static GetTextAlign(hdc: HDC): UINT {
    return GDI32.Load('GetTextAlign')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-gettextcharacterextra
  public static GetTextCharacterExtra(hdc: HDC): int {
    return GDI32.Load('GetTextCharacterExtra')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-gettextcharset
  public static GetTextCharset(hdc: HDC): int {
    return GDI32.Load('GetTextCharset')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-gettextcharsetinfo
  public static GetTextCharsetInfo(hdc: HDC, lpSig: LPFONTSIGNATURE | NULL, dwFlags: DWORD): int {
    return GDI32.Load('GetTextCharsetInfo')(hdc, lpSig, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-gettextcolor
  public static GetTextColor(hdc: HDC): COLORREF {
    return GDI32.Load('GetTextColor')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-gettextextentexpointi
  public static GetTextExtentExPointI(hdc: HDC, lpwszString: LPWORD, cwchString: int, nMaxExtent: int, lpnFit: LPINT | NULL, lpnDx: LPINT | NULL, lpSize: LPSIZE): BOOL {
    return GDI32.Load('GetTextExtentExPointI')(hdc, lpwszString, cwchString, nMaxExtent, lpnFit, lpnDx, lpSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-gettextextentpointi
  public static GetTextExtentPointI(hdc: HDC, pgiIn: LPWORD, cgi: int, psize: LPSIZE): BOOL {
    return GDI32.Load('GetTextExtentPointI')(hdc, pgiIn, cgi, psize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-gettextfacea
  public static GetTextFaceA(hdc: HDC, c: int, lpName: LPSTR): int {
    return GDI32.Load('GetTextFaceA')(hdc, c, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-gettextfacew
  public static GetTextFaceW(hdc: HDC, c: int, lpName: LPWSTR): int {
    return GDI32.Load('GetTextFaceW')(hdc, c, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-gettextmetricsa
  public static GetTextMetricsA(hdc: HDC, lptm: LPTEXTMETRICA): BOOL {
    return GDI32.Load('GetTextMetricsA')(hdc, lptm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-gettextmetricsw
  public static GetTextMetricsW(hdc: HDC, lptm: LPTEXTMETRICW): BOOL {
    return GDI32.Load('GetTextMetricsW')(hdc, lptm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getviewportextex
  public static GetViewportExtEx(hdc: HDC, lpsize: LPSIZE): BOOL {
    return GDI32.Load('GetViewportExtEx')(hdc, lpsize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getviewportorgex
  public static GetViewportOrgEx(hdc: HDC, lppoint: LPPOINT): BOOL {
    return GDI32.Load('GetViewportOrgEx')(hdc, lppoint);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getwindowextex
  public static GetWindowExtEx(hdc: HDC, lpsize: LPSIZE): BOOL {
    return GDI32.Load('GetWindowExtEx')(hdc, lpsize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getwindoworgex
  public static GetWindowOrgEx(hdc: HDC, lppoint: LPPOINT): BOOL {
    return GDI32.Load('GetWindowOrgEx')(hdc, lppoint);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getwinmetafilebits
  public static GetWinMetaFileBits(hemf: HENHMETAFILE, cbData16: UINT, pData16: LPBYTE | NULL, iMapMode: INT, hdcRef: HDC): UINT {
    return GDI32.Load('GetWinMetaFileBits')(hemf, cbData16, pData16, iMapMode, hdcRef);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getworldtransform
  public static GetWorldTransform(hdc: HDC, lpxf: LPXFORM): BOOL {
    return GDI32.Load('GetWorldTransform')(hdc, lpxf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-intersectcliprect
  public static IntersectClipRect(hdc: HDC, left: int, top: int, right: int, bottom: int): int {
    return GDI32.Load('IntersectClipRect')(hdc, left, top, right, bottom);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-invertrgn
  public static InvertRgn(hdc: HDC, hrgn: HRGN): BOOL {
    return GDI32.Load('InvertRgn')(hdc, hrgn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-linedda
  public static LineDDA(xStart: int, yStart: int, xEnd: int, yEnd: int, lpProc: LINEDDAPROC, data: LPARAM): BOOL {
    return GDI32.Load('LineDDA')(xStart, yStart, xEnd, yEnd, lpProc, data);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-lineto
  public static LineTo(hdc: HDC, x: int, y: int): BOOL {
    return GDI32.Load('LineTo')(hdc, x, y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-lptodp
  public static LPtoDP(hdc: HDC, lppt: LPPOINT, c: int): BOOL {
    return GDI32.Load('LPtoDP')(hdc, lppt, c);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-maskblt
  public static MaskBlt(hdcDest: HDC, xDest: int, yDest: int, width: int, height: int, hdcSrc: HDC, xSrc: int, ySrc: int, hbmMask: HBITMAP | 0n, xMask: int, yMask: int, rop: DWORD): BOOL {
    return GDI32.Load('MaskBlt')(hdcDest, xDest, yDest, width, height, hdcSrc, xSrc, ySrc, hbmMask, xMask, yMask, rop);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-modifyworldtransform
  public static ModifyWorldTransform(hdc: HDC, lpxf: XFORM_ | NULL, mode: DWORD): BOOL {
    return GDI32.Load('ModifyWorldTransform')(hdc, lpxf, mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-movetoex
  public static MoveToEx(hdc: HDC, x: int, y: int, lppt: LPPOINT | NULL): BOOL {
    return GDI32.Load('MoveToEx')(hdc, x, y, lppt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-offsetcliprgn
  public static OffsetClipRgn(hdc: HDC, x: int, y: int): int {
    return GDI32.Load('OffsetClipRgn')(hdc, x, y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-offsetrgn
  public static OffsetRgn(hrgn: HRGN, x: int, y: int): int {
    return GDI32.Load('OffsetRgn')(hrgn, x, y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-offsetviewportorgex
  public static OffsetViewportOrgEx(hdc: HDC, x: int, y: int, lppt: LPPOINT | NULL): BOOL {
    return GDI32.Load('OffsetViewportOrgEx')(hdc, x, y, lppt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-offsetwindoworgex
  public static OffsetWindowOrgEx(hdc: HDC, x: int, y: int, lppt: LPPOINT | NULL): BOOL {
    return GDI32.Load('OffsetWindowOrgEx')(hdc, x, y, lppt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-paintrgn
  public static PaintRgn(hdc: HDC, hrgn: HRGN): BOOL {
    return GDI32.Load('PaintRgn')(hdc, hrgn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-patblt
  public static PatBlt(hdc: HDC, x: int, y: int, w: int, h: int, rop: DWORD): BOOL {
    return GDI32.Load('PatBlt')(hdc, x, y, w, h, rop);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-pathtoregion
  public static PathToRegion(hdc: HDC): HRGN {
    return GDI32.Load('PathToRegion')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-pie
  public static Pie(hdc: HDC, left: int, top: int, right: int, bottom: int, xr1: int, yr1: int, xr2: int, yr2: int): BOOL {
    return GDI32.Load('Pie')(hdc, left, top, right, bottom, xr1, yr1, xr2, yr2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-playenhmetafile
  public static PlayEnhMetaFile(hdc: HDC, hmf: HENHMETAFILE, lprect: RECT_): BOOL {
    return GDI32.Load('PlayEnhMetaFile')(hdc, hmf, lprect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-playenhmetafilerecord
  public static PlayEnhMetaFileRecord(hdc: HDC, pht: LPHANDLETABLE, pmr: ENHMETARECORD_, cht: UINT): BOOL {
    return GDI32.Load('PlayEnhMetaFileRecord')(hdc, pht, pmr, cht);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-playmetafile
  public static PlayMetaFile(hdc: HDC, hmf: HMETAFILE): BOOL {
    return GDI32.Load('PlayMetaFile')(hdc, hmf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-playmetafilerecord
  public static PlayMetaFileRecord(hdc: HDC, lpHandleTable: LPHANDLETABLE, lpMR: LPMETARECORD, noObjs: UINT): BOOL {
    return GDI32.Load('PlayMetaFileRecord')(hdc, lpHandleTable, lpMR, noObjs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-plgblt
  public static PlgBlt(hdcDest: HDC, lpPoint: POINT_, hdcSrc: HDC, xSrc: int, ySrc: int, width: int, height: int, hbmMask: HBITMAP | 0n, xMask: int, yMask: int): BOOL {
    return GDI32.Load('PlgBlt')(hdcDest, lpPoint, hdcSrc, xSrc, ySrc, width, height, hbmMask, xMask, yMask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-polybezier
  public static PolyBezier(hdc: HDC, apt: POINT_, cpt: DWORD): BOOL {
    return GDI32.Load('PolyBezier')(hdc, apt, cpt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-polybezierto
  public static PolyBezierTo(hdc: HDC, apt: POINT_, cpt: DWORD): BOOL {
    return GDI32.Load('PolyBezierTo')(hdc, apt, cpt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-polydraw
  public static PolyDraw(hdc: HDC, apt: POINT_, aj: BYTE_, cpt: int): BOOL {
    return GDI32.Load('PolyDraw')(hdc, apt, aj, cpt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-polygon
  public static Polygon(hdc: HDC, apt: POINT_, cpt: int): BOOL {
    return GDI32.Load('Polygon')(hdc, apt, cpt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-polyline
  public static Polyline(hdc: HDC, apt: POINT_, cpt: int): BOOL {
    return GDI32.Load('Polyline')(hdc, apt, cpt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-polylineto
  public static PolylineTo(hdc: HDC, apt: POINT_, cpt: DWORD): BOOL {
    return GDI32.Load('PolylineTo')(hdc, apt, cpt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-polypolygon
  public static PolyPolygon(hdc: HDC, apt: POINT_, asz: INT_, csz: int): BOOL {
    return GDI32.Load('PolyPolygon')(hdc, apt, asz, csz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-polypolyline
  public static PolyPolyline(hdc: HDC, apt: POINT_, asz: DWORD_, csz: DWORD): BOOL {
    return GDI32.Load('PolyPolyline')(hdc, apt, asz, csz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-polytextouta
  public static PolyTextOutA(hdc: HDC, ppt: POLYTEXTA_, nstrings: int): BOOL {
    return GDI32.Load('PolyTextOutA')(hdc, ppt, nstrings);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-polytextoutw
  public static PolyTextOutW(hdc: HDC, ppt: POLYTEXTW_, nstrings: int): BOOL {
    return GDI32.Load('PolyTextOutW')(hdc, ppt, nstrings);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-ptinregion
  public static PtInRegion(hrgn: HRGN, x: int, y: int): BOOL {
    return GDI32.Load('PtInRegion')(hrgn, x, y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-ptvisible
  public static PtVisible(hdc: HDC, x: int, y: int): BOOL {
    return GDI32.Load('PtVisible')(hdc, x, y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-realizepalette
  public static RealizePalette(hdc: HDC): UINT {
    return GDI32.Load('RealizePalette')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-rectangle
  public static Rectangle(hdc: HDC, left: int, top: int, right: int, bottom: int): BOOL {
    return GDI32.Load('Rectangle')(hdc, left, top, right, bottom);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-rectinregion
  public static RectInRegion(hrgn: HRGN, lprect: RECT_): BOOL {
    return GDI32.Load('RectInRegion')(hrgn, lprect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-rectvisible
  public static RectVisible(hdc: HDC, lprect: RECT_): BOOL {
    return GDI32.Load('RectVisible')(hdc, lprect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-removefontmemresourceex
  public static RemoveFontMemResourceEx(h: HANDLE): BOOL {
    return GDI32.Load('RemoveFontMemResourceEx')(h);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-removefontresourcea
  public static RemoveFontResourceA(lpFileName: LPCSTR): BOOL {
    return GDI32.Load('RemoveFontResourceA')(lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-removefontresourceexa
  public static RemoveFontResourceExA(name: LPCSTR, fl: DWORD, pdv: PVOID | NULL): BOOL {
    return GDI32.Load('RemoveFontResourceExA')(name, fl, pdv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-removefontresourceexw
  public static RemoveFontResourceExW(name: LPCWSTR, fl: DWORD, pdv: PVOID | NULL): BOOL {
    return GDI32.Load('RemoveFontResourceExW')(name, fl, pdv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-removefontresourcew
  public static RemoveFontResourceW(lpFileName: LPCWSTR): BOOL {
    return GDI32.Load('RemoveFontResourceW')(lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-resetdca
  public static ResetDCA(hdc: HDC, lpdm: DEVMODEA_): HDC {
    return GDI32.Load('ResetDCA')(hdc, lpdm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-resetdcw
  public static ResetDCW(hdc: HDC, lpdm: DEVMODEW_): HDC {
    return GDI32.Load('ResetDCW')(hdc, lpdm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-resizepalette
  public static ResizePalette(hpal: HPALETTE, n: UINT): BOOL {
    return GDI32.Load('ResizePalette')(hpal, n);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-restoredc
  public static RestoreDC(hdc: HDC, nSavedDC: int): BOOL {
    return GDI32.Load('RestoreDC')(hdc, nSavedDC);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-roundrect
  public static RoundRect(hdc: HDC, left: int, top: int, right: int, bottom: int, width: int, height: int): BOOL {
    return GDI32.Load('RoundRect')(hdc, left, top, right, bottom, width, height);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-savedc
  public static SaveDC(hdc: HDC): int {
    return GDI32.Load('SaveDC')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-scaleviewportextex
  public static ScaleViewportExtEx(hdc: HDC, xn: int, dx: int, yn: int, yd: int, lpsz: LPSIZE | NULL): BOOL {
    return GDI32.Load('ScaleViewportExtEx')(hdc, xn, dx, yn, yd, lpsz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-scalewindowextex
  public static ScaleWindowExtEx(hdc: HDC, xn: int, xd: int, yn: int, yd: int, lpsz: LPSIZE | NULL): BOOL {
    return GDI32.Load('ScaleWindowExtEx')(hdc, xn, xd, yn, yd, lpsz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-selectclippath
  public static SelectClipPath(hdc: HDC, mode: int): BOOL {
    return GDI32.Load('SelectClipPath')(hdc, mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-selectcliprgn
  public static SelectClipRgn(hdc: HDC, hrgn: HRGN | 0n): int {
    return GDI32.Load('SelectClipRgn')(hdc, hrgn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-selectobject
  public static SelectObject(hdc: HDC, h: HGDIOBJ): HGDIOBJ {
    return GDI32.Load('SelectObject')(hdc, h);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-selectpalette
  public static SelectPalette(hdc: HDC, hPal: HPALETTE, bForceBkgd: BOOL): HPALETTE {
    return GDI32.Load('SelectPalette')(hdc, hPal, bForceBkgd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setabortproc
  public static SetAbortProc(hdc: HDC, proc: ABORTPROC): int {
    return GDI32.Load('SetAbortProc')(hdc, proc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setarcdirection
  public static SetArcDirection(hdc: HDC, dir: int): int {
    return GDI32.Load('SetArcDirection')(hdc, dir);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setbitmapbits
  public static SetBitmapBits(hbm: HBITMAP, cb: DWORD, pvBits: LPVOID): LONG {
    return GDI32.Load('SetBitmapBits')(hbm, cb, pvBits);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setbitmapdimensionex
  public static SetBitmapDimensionEx(hbm: HBITMAP, w: int, h: int, lpsz: LPSIZE | NULL): BOOL {
    return GDI32.Load('SetBitmapDimensionEx')(hbm, w, h, lpsz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setbkcolor
  public static SetBkColor(hdc: HDC, color: COLORREF): COLORREF {
    return GDI32.Load('SetBkColor')(hdc, color);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setbkmode
  public static SetBkMode(hdc: HDC, mode: int): int {
    return GDI32.Load('SetBkMode')(hdc, mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setboundsrect
  public static SetBoundsRect(hdc: HDC, lprect: RECT_ | NULL, flags: UINT): UINT {
    return GDI32.Load('SetBoundsRect')(hdc, lprect, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setbrushorgex
  public static SetBrushOrgEx(hdc: HDC, x: int, y: int, lppt: LPPOINT | NULL): BOOL {
    return GDI32.Load('SetBrushOrgEx')(hdc, x, y, lppt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setcoloradjustment
  public static SetColorAdjustment(hdc: HDC, lpca: COLORADJUSTMENT_): BOOL {
    return GDI32.Load('SetColorAdjustment')(hdc, lpca);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setcolorspace
  public static SetColorSpace(hdc: HDC, hcs: HCOLORSPACE): HCOLORSPACE {
    return GDI32.Load('SetColorSpace')(hdc, hcs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setdcbrushcolor
  public static SetDCBrushColor(hdc: HDC, color: COLORREF): COLORREF {
    return GDI32.Load('SetDCBrushColor')(hdc, color);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setdcpencolor
  public static SetDCPenColor(hdc: HDC, color: COLORREF): COLORREF {
    return GDI32.Load('SetDCPenColor')(hdc, color);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setdevicegammaramp
  public static SetDeviceGammaRamp(hdc: HDC, lpRamp: LPVOID): BOOL {
    return GDI32.Load('SetDeviceGammaRamp')(hdc, lpRamp);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setdibcolortable
  public static SetDIBColorTable(hdc: HDC, iStart: UINT, cEntries: UINT, prgbq: RGBQUAD_): UINT {
    return GDI32.Load('SetDIBColorTable')(hdc, iStart, cEntries, prgbq);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setdibits
  public static SetDIBits(hdc: HDC, hbm: HBITMAP, start: UINT, cLines: UINT, lpBits: LPVOID, lpbmi: BITMAPINFO_, ColorUse: UINT): int {
    return GDI32.Load('SetDIBits')(hdc, hbm, start, cLines, lpBits, lpbmi, ColorUse);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setdibitstodevice
  public static SetDIBitsToDevice(hdc: HDC, xDest: int, yDest: int, w: DWORD, h: DWORD, xSrc: int, ySrc: int, StartScan: UINT, cLines: UINT, lpvBits: LPVOID, lpbmi: BITMAPINFO_, ColorUse: UINT): int {
    return GDI32.Load('SetDIBitsToDevice')(hdc, xDest, yDest, w, h, xSrc, ySrc, StartScan, cLines, lpvBits, lpbmi, ColorUse);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setenhmetafilebits
  public static SetEnhMetaFileBits(nSize: UINT, pb: BYTE_): HENHMETAFILE {
    return GDI32.Load('SetEnhMetaFileBits')(nSize, pb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setgraphicsmode
  public static SetGraphicsMode(hdc: HDC, iMode: int): int {
    return GDI32.Load('SetGraphicsMode')(hdc, iMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-seticmmode
  public static SetICMMode(hdc: HDC, mode: int): int {
    return GDI32.Load('SetICMMode')(hdc, mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-seticmprofilea
  public static SetICMProfileA(hdc: HDC, lpFileName: LPSTR): BOOL {
    return GDI32.Load('SetICMProfileA')(hdc, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-seticmprofilew
  public static SetICMProfileW(hdc: HDC, lpFileName: LPWSTR): BOOL {
    return GDI32.Load('SetICMProfileW')(hdc, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setlayout
  public static SetLayout(hdc: HDC, l: DWORD): DWORD {
    return GDI32.Load('SetLayout')(hdc, l);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setmapmode
  public static SetMapMode(hdc: HDC, iMode: int): int {
    return GDI32.Load('SetMapMode')(hdc, iMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setmapperflags
  public static SetMapperFlags(hdc: HDC, flags: DWORD): DWORD {
    return GDI32.Load('SetMapperFlags')(hdc, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setmetafilebitsex
  public static SetMetaFileBitsEx(cbBuffer: UINT, lpData: BYTE_): HMETAFILE {
    return GDI32.Load('SetMetaFileBitsEx')(cbBuffer, lpData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setmetargn
  public static SetMetaRgn(hdc: HDC): int {
    return GDI32.Load('SetMetaRgn')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setmiterlimit
  public static SetMiterLimit(hdc: HDC, limit: FLOAT, old: PFLOAT | NULL): BOOL {
    return GDI32.Load('SetMiterLimit')(hdc, limit, old);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setpaletteentries
  public static SetPaletteEntries(hpal: HPALETTE, iStart: UINT, cEntries: UINT, pPalEntries: PALETTEENTRY_): UINT {
    return GDI32.Load('SetPaletteEntries')(hpal, iStart, cEntries, pPalEntries);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setpixel
  public static SetPixel(hdc: HDC, x: int, y: int, color: COLORREF): COLORREF {
    return GDI32.Load('SetPixel')(hdc, x, y, color);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setpixelformat
  public static SetPixelFormat(hdc: HDC, format: int, ppfd: PIXELFORMATDESCRIPTOR_): BOOL {
    return GDI32.Load('SetPixelFormat')(hdc, format, ppfd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setpixelv
  public static SetPixelV(hdc: HDC, x: int, y: int, color: COLORREF): BOOL {
    return GDI32.Load('SetPixelV')(hdc, x, y, color);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setpolyfillmode
  public static SetPolyFillMode(hdc: HDC, mode: int): int {
    return GDI32.Load('SetPolyFillMode')(hdc, mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setrectrgn
  public static SetRectRgn(hrgn: HRGN, left: int, top: int, right: int, bottom: int): BOOL {
    return GDI32.Load('SetRectRgn')(hrgn, left, top, right, bottom);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setrop2
  public static SetROP2(hdc: HDC, rop2: int): int {
    return GDI32.Load('SetROP2')(hdc, rop2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setstretchbltmode
  public static SetStretchBltMode(hdc: HDC, mode: int): int {
    return GDI32.Load('SetStretchBltMode')(hdc, mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setsystempaletteuse
  public static SetSystemPaletteUse(hdc: HDC, use: UINT): UINT {
    return GDI32.Load('SetSystemPaletteUse')(hdc, use);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-settextalign
  public static SetTextAlign(hdc: HDC, align: UINT): UINT {
    return GDI32.Load('SetTextAlign')(hdc, align);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-settextcharacterextra
  public static SetTextCharacterExtra(hdc: HDC, extra: int): int {
    return GDI32.Load('SetTextCharacterExtra')(hdc, extra);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-settextcolor
  public static SetTextColor(hdc: HDC, color: COLORREF): COLORREF {
    return GDI32.Load('SetTextColor')(hdc, color);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-settextjustification
  public static SetTextJustification(hdc: HDC, extra: int, count: int): BOOL {
    return GDI32.Load('SetTextJustification')(hdc, extra, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setviewportextex
  public static SetViewportExtEx(hdc: HDC, x: int, y: int, lpsz: LPSIZE | NULL): BOOL {
    return GDI32.Load('SetViewportExtEx')(hdc, x, y, lpsz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setviewportorgex
  public static SetViewportOrgEx(hdc: HDC, x: int, y: int, lppt: LPPOINT | NULL): BOOL {
    return GDI32.Load('SetViewportOrgEx')(hdc, x, y, lppt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setwindowextex
  public static SetWindowExtEx(hdc: HDC, x: int, y: int, lpsz: LPSIZE | NULL): BOOL {
    return GDI32.Load('SetWindowExtEx')(hdc, x, y, lpsz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setwindoworgex
  public static SetWindowOrgEx(hdc: HDC, x: int, y: int, lppt: LPPOINT | NULL): BOOL {
    return GDI32.Load('SetWindowOrgEx')(hdc, x, y, lppt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setwinmetafilebits
  public static SetWinMetaFileBits(nSize: UINT, lpMeta16Data: BYTE_, hdcRef: HDC | 0n, lpMFP: METAFILEPICT_ | NULL): HENHMETAFILE {
    return GDI32.Load('SetWinMetaFileBits')(nSize, lpMeta16Data, hdcRef, lpMFP);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setworldtransform
  public static SetWorldTransform(hdc: HDC, lpxf: XFORM_): BOOL {
    return GDI32.Load('SetWorldTransform')(hdc, lpxf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-startdoca
  public static StartDocA(hdc: HDC, lpdi: DOCINFOA_): int {
    return GDI32.Load('StartDocA')(hdc, lpdi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-startdocw
  public static StartDocW(hdc: HDC, lpdi: DOCINFOW_): int {
    return GDI32.Load('StartDocW')(hdc, lpdi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-startpage
  public static StartPage(hdc: HDC): int {
    return GDI32.Load('StartPage')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-stretchblt
  public static StretchBlt(hdcDest: HDC, xDest: int, yDest: int, wDest: int, hDest: int, hdcSrc: HDC, xSrc: int, ySrc: int, wSrc: int, hSrc: int, rop: DWORD): BOOL {
    return GDI32.Load('StretchBlt')(hdcDest, xDest, yDest, wDest, hDest, hdcSrc, xSrc, ySrc, wSrc, hSrc, rop);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-stretchdibits
  public static StretchDIBits(hdc: HDC, xDest: int, yDest: int, DestWidth: int, DestHeight: int, xSrc: int, ySrc: int, SrcWidth: int, SrcHeight: int, lpBits: LPVOID, lpbmi: BITMAPINFO_, iUsage: UINT, rop: DWORD): int {
    return GDI32.Load('StretchDIBits')(hdc, xDest, yDest, DestWidth, DestHeight, xSrc, ySrc, SrcWidth, SrcHeight, lpBits, lpbmi, iUsage, rop);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-strokeandfillpath
  public static StrokeAndFillPath(hdc: HDC): BOOL {
    return GDI32.Load('StrokeAndFillPath')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-strokepath
  public static StrokePath(hdc: HDC): BOOL {
    return GDI32.Load('StrokePath')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-swapbuffers
  public static SwapBuffers(hdc: HDC): BOOL {
    return GDI32.Load('SwapBuffers')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-textouta
  public static TextOutA(hdc: HDC, x: int, y: int, lpString: LPCSTR, c: int): BOOL {
    return GDI32.Load('TextOutA')(hdc, x, y, lpString, c);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-textoutw
  public static TextOutW(hdc: HDC, x: int, y: int, lpString: LPCWSTR, c: int): BOOL {
    return GDI32.Load('TextOutW')(hdc, x, y, lpString, c);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-translatecharsetinfo
  public static TranslateCharsetInfo(lpSrc: DWORD_, lpCs: LPCHARSETINFO, dwFlags: DWORD): BOOL {
    return GDI32.Load('TranslateCharsetInfo')(lpSrc, lpCs, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-unrealizeobject
  public static UnrealizeObject(h: HGDIOBJ): BOOL {
    return GDI32.Load('UnrealizeObject')(h);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-updatecolors
  public static UpdateColors(hdc: HDC): BOOL {
    return GDI32.Load('UpdateColors')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-updateicmregkeya
  public static UpdateICMRegKeyA(reserved: DWORD, lpszCMID: LPSTR, lpszFileName: LPSTR, command: UINT): BOOL {
    return GDI32.Load('UpdateICMRegKeyA')(reserved, lpszCMID, lpszFileName, command);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-updateicmregkeyw
  public static UpdateICMRegKeyW(reserved: DWORD, lpszCMID: LPWSTR, lpszFileName: LPWSTR, command: UINT): BOOL {
    return GDI32.Load('UpdateICMRegKeyW')(reserved, lpszCMID, lpszFileName, command);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-widenpath
  public static WidenPath(hdc: HDC): BOOL {
    return GDI32.Load('WidenPath')(hdc);
  }
}

export default GDI32;
