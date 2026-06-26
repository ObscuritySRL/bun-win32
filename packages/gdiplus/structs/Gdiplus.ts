import { type FFIFunction, FFIType, type Pointer } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  ARGB,
  BOOL,
  CGpEffect,
  ColorAdjustType,
  ColorChannelFlags,
  ColorMatrixFlags,
  CombineMode,
  CompositingMode,
  CompositingQuality,
  CoordinateSpace,
  DashCap,
  DashStyle,
  DitherType,
  EmfPlusRecordType,
  EmfType,
  FillMode,
  FlushIntention,
  GpAdjustableArrowCap,
  GpBitmap,
  GpBrush,
  GpCachedBitmap,
  GpCustomLineCap,
  GpFont,
  GpFontCollection,
  GpFontFamily,
  GpGraphics,
  GpHatch,
  GpImage,
  GpImageAttributes,
  GpLineGradient,
  GpMatrix,
  GpMetafile,
  GpPath,
  GpPathGradient,
  GpPathIterator,
  GpPen,
  GpRegion,
  GpSolidFill,
  GpStringFormat,
  GpTexture,
  GraphicsContainer,
  GraphicsState,
  HANDLE,
  HBITMAP,
  HDC,
  HENHMETAFILE,
  HICON,
  HINSTANCE,
  HMETAFILE,
  HPALETTE,
  HRGN,
  HWND,
  HatchStyle,
  HistogramFormat,
  INT,
  IStream,
  InterpolationMode,
  LANGID,
  LPARGB,
  LPBOOL,
  LPBYTE,
  LPINT,
  LPLANGID,
  LPREAL,
  LPUINT,
  LPUINT16,
  LPULONG_PTR,
  LPVOID,
  LPWSTR,
  LineCap,
  LineJoin,
  LinearGradientMode,
  MatrixOrder,
  MetafileFrameUnit,
  NULLABLE,
  OPTIONAL,
  PROPID,
  PaletteType,
  PenAlignment,
  PixelFormat,
  PixelOffsetMode,
  REAL,
  RotateFlipType,
  SIZE_T,
  SmoothingMode,
  Status,
  StringAlignment,
  StringDigitSubstitute,
  StringTrimming,
  TextRenderingHint,
  UINT,
  ULONG_PTR,
  Unit,
  WarpMode,
  WrapMode,
} from '../types/Gdiplus';

/**
 * Thin, lazy-loaded FFI bindings for `gdiplus.dll`.
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
 * import Gdiplus from './structs/Gdiplus';
 *
 * // Lazy: bind on first call
 * const token = Buffer.alloc(8);
 * const input = Buffer.alloc(24);
 * input.writeUInt32LE(1, 0); // GdiplusVersion = 1
 * Gdiplus.GdiplusStartup(token.ptr, input.ptr, null);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Gdiplus.Preload(['GdipCreateBitmapFromFile', 'GdipDisposeImage']);
 * ```
 */
class Gdiplus extends Win32 {
  protected static override name = 'gdiplus.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    GdipAddPathArc: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipAddPathArcI: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipAddPathBezier: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipAddPathBezierI: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipAddPathBeziers: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipAddPathBeziersI: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipAddPathClosedCurve: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipAddPathClosedCurve2: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.f32], returns: FFIType.i32 },
    GdipAddPathClosedCurve2I: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.f32], returns: FFIType.i32 },
    GdipAddPathClosedCurveI: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipAddPathCurve: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipAddPathCurve2: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.f32], returns: FFIType.i32 },
    GdipAddPathCurve2I: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.f32], returns: FFIType.i32 },
    GdipAddPathCurve3: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.f32], returns: FFIType.i32 },
    GdipAddPathCurve3I: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.f32], returns: FFIType.i32 },
    GdipAddPathCurveI: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipAddPathEllipse: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipAddPathEllipseI: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipAddPathLine: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipAddPathLine2: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipAddPathLine2I: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipAddPathLineI: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipAddPathPath: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipAddPathPie: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipAddPathPieI: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipAddPathPolygon: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipAddPathPolygonI: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipAddPathRectangle: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipAddPathRectangleI: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipAddPathRectangles: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipAddPathRectanglesI: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipAddPathString: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.u64, FFIType.i32, FFIType.f32, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GdipAddPathStringI: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.u64, FFIType.i32, FFIType.f32, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GdipAlloc: { args: [FFIType.u64], returns: FFIType.ptr },
    GdipBeginContainer: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipBeginContainer2: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipBeginContainerI: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipBitmapApplyEffect: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipBitmapConvertFormat: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.f32], returns: FFIType.i32 },
    GdipBitmapCreateApplyEffect: { args: [FFIType.ptr, FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipBitmapGetHistogram: { args: [FFIType.u64, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipBitmapGetHistogramSize: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipBitmapGetPixel: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipBitmapLockBits: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipBitmapSetPixel: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    GdipBitmapSetResolution: { args: [FFIType.u64, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipBitmapUnlockBits: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipClearPathMarkers: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipCloneBitmapArea: { args: [FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCloneBitmapAreaI: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCloneBrush: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCloneCustomLineCap: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCloneFont: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCloneFontFamily: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCloneImage: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCloneImageAttributes: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCloneMatrix: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipClonePath: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipClonePen: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCloneRegion: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCloneStringFormat: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipClosePathFigure: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipClosePathFigures: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipCombineRegionPath: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipCombineRegionRect: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipCombineRegionRectI: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipCombineRegionRegion: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipComment: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GdipConvertToEmfPlus: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipConvertToEmfPlusToFile: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipConvertToEmfPlusToStream: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateAdjustableArrowCap: { args: [FFIType.f32, FFIType.f32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateBitmapFromDirectDrawSurface: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateBitmapFromFile: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateBitmapFromFileICM: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateBitmapFromGdiDib: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateBitmapFromGraphics: { args: [FFIType.i32, FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateBitmapFromHBITMAP: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateBitmapFromHICON: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateBitmapFromResource: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateBitmapFromScan0: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateBitmapFromStream: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateBitmapFromStreamICM: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateCachedBitmap: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateCustomLineCap: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateEffect: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateFont: { args: [FFIType.u64, FFIType.f32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateFontFamilyFromName: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateFontFromDC: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateFontFromLogfontA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateFontFromLogfontW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateFromHDC: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateFromHDC2: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateFromHWND: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateFromHWNDICM: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateHBITMAPFromBitmap: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GdipCreateHICONFromBitmap: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateHalftonePalette: { args: [], returns: FFIType.i32 },
    GdipCreateHatchBrush: { args: [FFIType.i32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateImageAttributes: { args: [FFIType.ptr], returns: FFIType.i32 },
    GdipCreateLineBrush: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateLineBrushFromRect: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateLineBrushFromRectI: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateLineBrushFromRectWithAngle: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.f32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateLineBrushFromRectWithAngleI: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.f32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateLineBrushI: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateMatrix: { args: [FFIType.ptr], returns: FFIType.i32 },
    GdipCreateMatrix2: { args: [FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateMatrix3: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateMatrix3I: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateMetafileFromEmf: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateMetafileFromFile: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateMetafileFromStream: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateMetafileFromWmf: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateMetafileFromWmfFile: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipCreatePath: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreatePath2: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreatePath2I: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreatePathGradient: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreatePathGradientFromPath: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCreatePathGradientI: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreatePathIter: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GdipCreatePen1: { args: [FFIType.u32, FFIType.f32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreatePen2: { args: [FFIType.u64, FFIType.f32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateRegion: { args: [FFIType.ptr], returns: FFIType.i32 },
    GdipCreateRegionHrgn: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateRegionPath: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateRegionRect: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateRegionRectI: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateRegionRgnData: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateSolidFill: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateStreamOnFile: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateStringFormat: { args: [FFIType.i32, FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateTexture: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateTexture2: { args: [FFIType.u64, FFIType.i32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateTexture2I: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateTextureIA: { args: [FFIType.u64, FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    GdipCreateTextureIAI: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipDeleteBrush: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipDeleteCachedBitmap: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipDeleteCustomLineCap: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipDeleteEffect: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipDeleteFont: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipDeleteFontFamily: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipDeleteGraphics: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipDeleteMatrix: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipDeletePath: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipDeletePathIter: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipDeletePen: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipDeletePrivateFontCollection: { args: [FFIType.ptr], returns: FFIType.i32 },
    GdipDeleteRegion: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipDeleteStringFormat: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipDisposeImage: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipDisposeImageAttributes: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipDrawArc: { args: [FFIType.u64, FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipDrawArcI: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipDrawBezier: { args: [FFIType.u64, FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipDrawBezierI: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipDrawBeziers: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipDrawBeziersI: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipDrawCachedBitmap: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipDrawClosedCurve: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipDrawClosedCurve2: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.f32], returns: FFIType.i32 },
    GdipDrawClosedCurve2I: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.f32], returns: FFIType.i32 },
    GdipDrawClosedCurveI: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipDrawCurve: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipDrawCurve2: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.f32], returns: FFIType.i32 },
    GdipDrawCurve2I: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.f32], returns: FFIType.i32 },
    GdipDrawCurve3: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.f32], returns: FFIType.i32 },
    GdipDrawCurve3I: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.f32], returns: FFIType.i32 },
    GdipDrawCurveI: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipDrawDriverString: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.u64], returns: FFIType.i32 },
    GdipDrawEllipse: { args: [FFIType.u64, FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipDrawEllipseI: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipDrawImage: { args: [FFIType.u64, FFIType.u64, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipDrawImageFX: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipDrawImageI: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipDrawImagePointRect: { args: [FFIType.u64, FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipDrawImagePointRectI: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipDrawImagePoints: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipDrawImagePointsI: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipDrawImagePointsRect: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipDrawImagePointsRectI: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipDrawImageRect: { args: [FFIType.u64, FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipDrawImageRectI: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipDrawImageRectRect: {
      args: [FFIType.u64, FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.ptr],
      returns: FFIType.i32,
    },
    GdipDrawImageRectRectI: {
      args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.ptr],
      returns: FFIType.i32,
    },
    GdipDrawLine: { args: [FFIType.u64, FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipDrawLineI: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipDrawLines: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipDrawLinesI: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipDrawPath: { args: [FFIType.u64, FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipDrawPie: { args: [FFIType.u64, FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipDrawPieI: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipDrawPolygon: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipDrawPolygonI: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipDrawRectangle: { args: [FFIType.u64, FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipDrawRectangleI: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipDrawRectangles: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipDrawRectanglesI: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipDrawString: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipEmfToWmfBits: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.u32 },
    GdipEndContainer: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipEnumerateMetafileDestPoint: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GdipEnumerateMetafileDestPointI: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GdipEnumerateMetafileDestPoints: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GdipEnumerateMetafileDestPointsI: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GdipEnumerateMetafileDestRect: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GdipEnumerateMetafileDestRectI: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GdipEnumerateMetafileSrcRectDestPoint: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GdipEnumerateMetafileSrcRectDestPointI: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GdipEnumerateMetafileSrcRectDestPoints: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GdipEnumerateMetafileSrcRectDestPointsI: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GdipEnumerateMetafileSrcRectDestRect: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GdipEnumerateMetafileSrcRectDestRectI: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GdipFillClosedCurve: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipFillClosedCurve2: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipFillClosedCurve2I: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipFillClosedCurveI: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipFillEllipse: { args: [FFIType.u64, FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipFillEllipseI: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipFillPath: { args: [FFIType.u64, FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipFillPie: { args: [FFIType.u64, FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipFillPieI: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipFillPolygon: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipFillPolygon2: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipFillPolygon2I: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipFillPolygonI: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipFillRectangle: { args: [FFIType.u64, FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipFillRectangleI: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipFillRectangles: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipFillRectanglesI: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipFillRegion: { args: [FFIType.u64, FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipFindFirstImageItem: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipFindNextImageItem: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipFlattenPath: { args: [FFIType.u64, FFIType.u64, FFIType.f32], returns: FFIType.i32 },
    GdipFlush: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipFree: { args: [FFIType.ptr], returns: FFIType.void },
    GdipGetAdjustableArrowCapFillState: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetAdjustableArrowCapHeight: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetAdjustableArrowCapMiddleInset: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetAdjustableArrowCapWidth: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetAllPropertyItems: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GdipGetBrushType: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetCellAscent: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipGetCellDescent: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipGetClip: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipGetClipBounds: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetClipBoundsI: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetCompositingMode: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetCompositingQuality: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetCustomLineCapBaseCap: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetCustomLineCapBaseInset: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetCustomLineCapStrokeCaps: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipGetCustomLineCapStrokeJoin: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetCustomLineCapType: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetCustomLineCapWidthScale: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetDC: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetDpiX: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetDpiY: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetEffectParameterSize: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetEffectParameters: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipGetEmHeight: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipGetEncoderParameterList: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GdipGetEncoderParameterListSize: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipGetFamily: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetFamilyName: { args: [FFIType.u64, FFIType.ptr, FFIType.u16], returns: FFIType.i32 },
    GdipGetFontCollectionFamilyCount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetFontCollectionFamilyList: { args: [FFIType.u64, FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetFontHeight: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetFontHeightGivenDPI: { args: [FFIType.u64, FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    GdipGetFontSize: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetFontStyle: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetFontUnit: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetGenericFontFamilyMonospace: { args: [FFIType.ptr], returns: FFIType.i32 },
    GdipGetGenericFontFamilySansSerif: { args: [FFIType.ptr], returns: FFIType.i32 },
    GdipGetGenericFontFamilySerif: { args: [FFIType.ptr], returns: FFIType.i32 },
    GdipGetHatchBackgroundColor: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetHatchForegroundColor: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetHatchStyle: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetHemfFromMetafile: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetImageAttributesAdjustedPalette: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipGetImageBounds: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipGetImageDecoders: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GdipGetImageDecodersSize: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipGetImageDimension: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipGetImageEncoders: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GdipGetImageEncodersSize: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipGetImageFlags: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetImageGraphicsContext: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetImageHeight: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetImageHorizontalResolution: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetImageItemData: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetImagePalette: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipGetImagePaletteSize: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetImagePixelFormat: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetImageRawFormat: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetImageThumbnail: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipGetImageType: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetImageVerticalResolution: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetImageWidth: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetInterpolationMode: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetLineBlend: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipGetLineBlendCount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetLineColors: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetLineGammaCorrection: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetLinePresetBlend: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipGetLinePresetBlendCount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetLineRect: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetLineRectI: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetLineSpacing: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipGetLineTransform: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipGetLineWrapMode: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetLogFontA: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetLogFontW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetMatrixElements: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetMetafileDownLevelRasterizationLimit: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetMetafileHeaderFromEmf: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetMetafileHeaderFromFile: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipGetMetafileHeaderFromMetafile: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetMetafileHeaderFromStream: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetMetafileHeaderFromWmf: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipGetNearestColor: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPageScale: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPageUnit: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPathData: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPathFillMode: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPathGradientBlend: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipGetPathGradientBlendCount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPathGradientCenterColor: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPathGradientCenterPoint: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPathGradientCenterPointI: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPathGradientFocusScales: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPathGradientGammaCorrection: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPathGradientPath: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipGetPathGradientPointCount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPathGradientPresetBlend: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipGetPathGradientPresetBlendCount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPathGradientRect: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPathGradientRectI: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPathGradientSurroundColorCount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPathGradientSurroundColorsWithCount: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPathGradientTransform: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipGetPathGradientWrapMode: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPathLastPoint: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPathPoints: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipGetPathPointsI: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipGetPathTypes: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipGetPathWorldBounds: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipGetPathWorldBoundsI: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipGetPenBrushFill: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPenColor: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPenCompoundArray: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipGetPenCompoundCount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPenCustomEndCap: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPenCustomStartCap: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPenDashArray: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipGetPenDashCap197819: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPenDashCount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPenDashOffset: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPenDashStyle: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPenEndCap: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPenFillType: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPenLineJoin: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPenMiterLimit: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPenMode: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPenStartCap: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPenTransform: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipGetPenUnit: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPenWidth: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPixelOffsetMode: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPointCount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPropertyCount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPropertyIdList: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPropertyItem: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPropertyItemSize: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GdipGetPropertySize: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipGetRegionBounds: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetRegionBoundsI: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetRegionData: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GdipGetRegionDataSize: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetRegionHRgn: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetRegionScans: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GdipGetRegionScansCount: { args: [FFIType.u64, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GdipGetRegionScansI: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GdipGetRenderingOrigin: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipGetSmoothingMode: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetSolidFillColor: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetStringFormatAlign: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetStringFormatDigitSubstitution: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipGetStringFormatFlags: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetStringFormatHotkeyPrefix: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetStringFormatLineAlign: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetStringFormatMeasurableCharacterRangeCount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetStringFormatTabStopCount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetStringFormatTabStops: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipGetStringFormatTrimming: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetTextContrast: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetTextRenderingHint: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetTextureImage: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetTextureTransform: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipGetTextureWrapMode: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetVisibleClipBounds: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetVisibleClipBoundsI: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipGetWorldTransform: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipGraphicsClear: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    GdipGraphicsSetAbort: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipImageForceValidation: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipImageGetFrameCount: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipImageGetFrameDimensionsCount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipImageGetFrameDimensionsList: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GdipImageRotateFlip: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipImageSelectActiveFrame: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GdipImageSetAbort: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipInitializePalette: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u64], returns: FFIType.i32 },
    GdipInvertMatrix: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipIsClipEmpty: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipIsEmptyRegion: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipIsEqualRegion: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipIsInfiniteRegion: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipIsMatrixEqual: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipIsMatrixIdentity: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipIsMatrixInvertible: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipIsOutlineVisiblePathPoint: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipIsOutlineVisiblePathPointI: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipIsStyleAvailable: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipIsVisibleClipEmpty: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipIsVisiblePathPoint: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipIsVisiblePathPointI: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipIsVisiblePoint: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    GdipIsVisiblePointI: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipIsVisibleRect: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.ptr], returns: FFIType.i32 },
    GdipIsVisibleRectI: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipIsVisibleRegionPoint: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipIsVisibleRegionPointI: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipIsVisibleRegionRect: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipIsVisibleRegionRectI: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipLoadImageFromFile: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipLoadImageFromFileICM: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipLoadImageFromStream: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipLoadImageFromStreamICM: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipMeasureCharacterRanges: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipMeasureDriverString: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipMeasureString: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipMultiplyLineTransform: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipMultiplyMatrix: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipMultiplyPathGradientTransform: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipMultiplyPenTransform: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipMultiplyTextureTransform: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipMultiplyWorldTransform: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipNewInstalledFontCollection: { args: [FFIType.ptr], returns: FFIType.i32 },
    GdipNewPrivateFontCollection: { args: [FFIType.ptr], returns: FFIType.i32 },
    GdipPathIterCopyData: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipPathIterEnumerate: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipPathIterGetCount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipPathIterGetSubpathCount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipPathIterHasCurve: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipPathIterIsValid: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipPathIterNextMarker: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipPathIterNextMarkerPath: { args: [FFIType.u64, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GdipPathIterNextPathType: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipPathIterNextSubpath: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipPathIterNextSubpathPath: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipPathIterRewind: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipPlayMetafileRecord: { args: [FFIType.u64, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GdipPrivateAddFontFile: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipPrivateAddMemoryFont: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipRecordMetafile: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipRecordMetafileFileName: { args: [FFIType.ptr, FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipRecordMetafileFileNameI: { args: [FFIType.ptr, FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipRecordMetafileI: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipRecordMetafileStream: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipRecordMetafileStreamI: { args: [FFIType.u64, FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipReleaseDC: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipRemovePropertyItem: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    GdipResetClip: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipResetImageAttributes: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipResetLineTransform: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipResetPageTransform: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipResetPath: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipResetPathGradientTransform: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipResetPenTransform: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipResetTextureTransform: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipResetWorldTransform: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipRestoreGraphics: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipReversePath: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipRotateLineTransform: { args: [FFIType.u64, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipRotateMatrix: { args: [FFIType.u64, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipRotatePathGradientTransform: { args: [FFIType.u64, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipRotatePenTransform: { args: [FFIType.u64, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipRotateTextureTransform: { args: [FFIType.u64, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipRotateWorldTransform: { args: [FFIType.u64, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipSaveAdd: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipSaveAddImage: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipSaveGraphics: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipSaveImageToFile: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipSaveImageToStream: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipScaleLineTransform: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipScaleMatrix: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipScalePathGradientTransform: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipScalePenTransform: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipScaleTextureTransform: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipScaleWorldTransform: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipSetAdjustableArrowCapFillState: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetAdjustableArrowCapHeight: { args: [FFIType.u64, FFIType.f32], returns: FFIType.i32 },
    GdipSetAdjustableArrowCapMiddleInset: { args: [FFIType.u64, FFIType.f32], returns: FFIType.i32 },
    GdipSetAdjustableArrowCapWidth: { args: [FFIType.u64, FFIType.f32], returns: FFIType.i32 },
    GdipSetClipGraphics: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetClipHrgn: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetClipPath: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetClipRect: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipSetClipRectI: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipSetClipRegion: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetCompositingMode: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetCompositingQuality: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetCustomLineCapBaseCap: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetCustomLineCapBaseInset: { args: [FFIType.u64, FFIType.f32], returns: FFIType.i32 },
    GdipSetCustomLineCapStrokeCaps: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipSetCustomLineCapStrokeJoin: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetCustomLineCapWidthScale: { args: [FFIType.u64, FFIType.f32], returns: FFIType.i32 },
    GdipSetEffectParameters: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GdipSetEmpty: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipSetImageAttributesCachedBackground: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetImageAttributesColorKeys: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    GdipSetImageAttributesColorMatrix: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipSetImageAttributesGamma: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.f32], returns: FFIType.i32 },
    GdipSetImageAttributesNoOp: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipSetImageAttributesOutputChannel: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipSetImageAttributesOutputChannelColorProfile: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipSetImageAttributesRemapTable: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GdipSetImageAttributesThreshold: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.f32], returns: FFIType.i32 },
    GdipSetImageAttributesToIdentity: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetImageAttributesWrapMode: { args: [FFIType.u64, FFIType.i32, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    GdipSetImagePalette: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipSetInfinite: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipSetInterpolationMode: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetLineBlend: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipSetLineColors: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    GdipSetLineGammaCorrection: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetLineLinearBlend: { args: [FFIType.u64, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipSetLinePresetBlend: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipSetLineSigmaBlend: { args: [FFIType.u64, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipSetLineTransform: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipSetLineWrapMode: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetMatrixElements: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipSetMetafileDownLevelRasterizationLimit: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    GdipSetPageScale: { args: [FFIType.u64, FFIType.f32], returns: FFIType.i32 },
    GdipSetPageUnit: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetPathFillMode: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetPathGradientBlend: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipSetPathGradientCenterColor: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    GdipSetPathGradientCenterPoint: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipSetPathGradientCenterPointI: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipSetPathGradientFocusScales: { args: [FFIType.u64, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipSetPathGradientGammaCorrection: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetPathGradientLinearBlend: { args: [FFIType.u64, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipSetPathGradientPath: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipSetPathGradientPresetBlend: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipSetPathGradientSigmaBlend: { args: [FFIType.u64, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipSetPathGradientSurroundColorsWithCount: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GdipSetPathGradientTransform: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipSetPathGradientWrapMode: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetPathMarker: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipSetPenBrushFill: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipSetPenColor: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    GdipSetPenCompoundArray: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipSetPenCustomEndCap: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipSetPenCustomStartCap: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipSetPenDashArray: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipSetPenDashCap197819: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetPenDashOffset: { args: [FFIType.u64, FFIType.f32], returns: FFIType.i32 },
    GdipSetPenDashStyle: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetPenEndCap: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetPenLineCap197819: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipSetPenLineJoin: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetPenMiterLimit: { args: [FFIType.u64, FFIType.f32], returns: FFIType.i32 },
    GdipSetPenMode: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetPenStartCap: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetPenTransform: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipSetPenUnit: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetPenWidth: { args: [FFIType.u64, FFIType.f32], returns: FFIType.i32 },
    GdipSetPixelOffsetMode: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetPropertyItem: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GdipSetRenderingOrigin: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipSetSmoothingMode: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetSolidFillColor: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    GdipSetStringFormatAlign: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetStringFormatDigitSubstitution: { args: [FFIType.u64, FFIType.u16, FFIType.i32], returns: FFIType.i32 },
    GdipSetStringFormatFlags: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetStringFormatHotkeyPrefix: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetStringFormatLineAlign: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetStringFormatMeasurableCharacterRanges: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipSetStringFormatTabStops: { args: [FFIType.u64, FFIType.f32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GdipSetStringFormatTrimming: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetTextContrast: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    GdipSetTextRenderingHint: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetTextureTransform: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipSetTextureWrapMode: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    GdipSetWorldTransform: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipShearMatrix: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipStartPathFigure: { args: [FFIType.u64], returns: FFIType.i32 },
    GdipStringFormatGetGenericDefault: { args: [FFIType.ptr], returns: FFIType.i32 },
    GdipStringFormatGetGenericTypographic: { args: [FFIType.ptr], returns: FFIType.i32 },
    GdipTransformMatrixPoints: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipTransformMatrixPointsI: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipTransformPath: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipTransformPoints: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipTransformPointsI: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipTransformRegion: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    GdipTranslateClip: { args: [FFIType.u64, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipTranslateClipI: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipTranslateLineTransform: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipTranslateMatrix: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipTranslatePathGradientTransform: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipTranslatePenTransform: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipTranslateRegion: { args: [FFIType.u64, FFIType.f32, FFIType.f32], returns: FFIType.i32 },
    GdipTranslateRegionI: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    GdipTranslateTextureTransform: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipTranslateWorldTransform: { args: [FFIType.u64, FFIType.f32, FFIType.f32, FFIType.i32], returns: FFIType.i32 },
    GdipVectorTransformMatrixPoints: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipVectorTransformMatrixPointsI: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GdipWarpPath: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.i32, FFIType.f32], returns: FFIType.i32 },
    GdipWidenPath: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.f32], returns: FFIType.i32 },
    GdipWindingModeOutline: { args: [FFIType.u64, FFIType.u64, FFIType.f32], returns: FFIType.i32 },
    GdiplusNotificationHook: { args: [FFIType.ptr], returns: FFIType.i32 },
    GdiplusNotificationUnhook: { args: [FFIType.u64], returns: FFIType.void },
    GdiplusShutdown: { args: [FFIType.u64], returns: FFIType.void },
    GdiplusStartup: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpatharc
  public static GdipAddPathArc(path: GpPath, x: REAL, y: REAL, width: REAL, height: REAL, startAngle: REAL, sweepAngle: REAL): Status {
    return Gdiplus.Load('GdipAddPathArc')(path, x, y, width, height, startAngle, sweepAngle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpatharci
  public static GdipAddPathArcI(path: GpPath, x: INT, y: INT, width: INT, height: INT, startAngle: REAL, sweepAngle: REAL): Status {
    return Gdiplus.Load('GdipAddPathArcI')(path, x, y, width, height, startAngle, sweepAngle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathbezier
  public static GdipAddPathBezier(path: GpPath, x1: REAL, y1: REAL, x2: REAL, y2: REAL, x3: REAL, y3: REAL, x4: REAL, y4: REAL): Status {
    return Gdiplus.Load('GdipAddPathBezier')(path, x1, y1, x2, y2, x3, y3, x4, y4);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathbezieri
  public static GdipAddPathBezierI(path: GpPath, x1: INT, y1: INT, x2: INT, y2: INT, x3: INT, y3: INT, x4: INT, y4: INT): Status {
    return Gdiplus.Load('GdipAddPathBezierI')(path, x1, y1, x2, y2, x3, y3, x4, y4);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathbeziers
  public static GdipAddPathBeziers(path: GpPath, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipAddPathBeziers')(path, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathbeziersi
  public static GdipAddPathBeziersI(path: GpPath, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipAddPathBeziersI')(path, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathclosedcurve
  public static GdipAddPathClosedCurve(path: GpPath, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipAddPathClosedCurve')(path, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathclosedcurve2
  public static GdipAddPathClosedCurve2(path: GpPath, points: Pointer, count: INT, tension: REAL): Status {
    return Gdiplus.Load('GdipAddPathClosedCurve2')(path, points, count, tension);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathclosedcurve2i
  public static GdipAddPathClosedCurve2I(path: GpPath, points: Pointer, count: INT, tension: REAL): Status {
    return Gdiplus.Load('GdipAddPathClosedCurve2I')(path, points, count, tension);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathclosedcurvei
  public static GdipAddPathClosedCurveI(path: GpPath, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipAddPathClosedCurveI')(path, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathcurve
  public static GdipAddPathCurve(path: GpPath, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipAddPathCurve')(path, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathcurve2
  public static GdipAddPathCurve2(path: GpPath, points: Pointer, count: INT, tension: REAL): Status {
    return Gdiplus.Load('GdipAddPathCurve2')(path, points, count, tension);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathcurve2i
  public static GdipAddPathCurve2I(path: GpPath, points: Pointer, count: INT, tension: REAL): Status {
    return Gdiplus.Load('GdipAddPathCurve2I')(path, points, count, tension);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathcurve3
  public static GdipAddPathCurve3(path: GpPath, points: Pointer, count: INT, offset: INT, numberOfSegments: INT, tension: REAL): Status {
    return Gdiplus.Load('GdipAddPathCurve3')(path, points, count, offset, numberOfSegments, tension);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathcurve3i
  public static GdipAddPathCurve3I(path: GpPath, points: Pointer, count: INT, offset: INT, numberOfSegments: INT, tension: REAL): Status {
    return Gdiplus.Load('GdipAddPathCurve3I')(path, points, count, offset, numberOfSegments, tension);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathcurvei
  public static GdipAddPathCurveI(path: GpPath, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipAddPathCurveI')(path, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathellipse
  public static GdipAddPathEllipse(path: GpPath, x: REAL, y: REAL, width: REAL, height: REAL): Status {
    return Gdiplus.Load('GdipAddPathEllipse')(path, x, y, width, height);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathellipsei
  public static GdipAddPathEllipseI(path: GpPath, x: INT, y: INT, width: INT, height: INT): Status {
    return Gdiplus.Load('GdipAddPathEllipseI')(path, x, y, width, height);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathline
  public static GdipAddPathLine(path: GpPath, x1: REAL, y1: REAL, x2: REAL, y2: REAL): Status {
    return Gdiplus.Load('GdipAddPathLine')(path, x1, y1, x2, y2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathline2
  public static GdipAddPathLine2(path: GpPath, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipAddPathLine2')(path, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathline2i
  public static GdipAddPathLine2I(path: GpPath, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipAddPathLine2I')(path, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathlinei
  public static GdipAddPathLineI(path: GpPath, x1: INT, y1: INT, x2: INT, y2: INT): Status {
    return Gdiplus.Load('GdipAddPathLineI')(path, x1, y1, x2, y2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathpath
  public static GdipAddPathPath(path: GpPath, addingPath: GpPath, connect: BOOL): Status {
    return Gdiplus.Load('GdipAddPathPath')(path, addingPath, connect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathpie
  public static GdipAddPathPie(path: GpPath, x: REAL, y: REAL, width: REAL, height: REAL, startAngle: REAL, sweepAngle: REAL): Status {
    return Gdiplus.Load('GdipAddPathPie')(path, x, y, width, height, startAngle, sweepAngle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathpiei
  public static GdipAddPathPieI(path: GpPath, x: INT, y: INT, width: INT, height: INT, startAngle: REAL, sweepAngle: REAL): Status {
    return Gdiplus.Load('GdipAddPathPieI')(path, x, y, width, height, startAngle, sweepAngle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathpolygon
  public static GdipAddPathPolygon(path: GpPath, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipAddPathPolygon')(path, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathpolygoni
  public static GdipAddPathPolygonI(path: GpPath, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipAddPathPolygonI')(path, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathrectangle
  public static GdipAddPathRectangle(path: GpPath, x: REAL, y: REAL, width: REAL, height: REAL): Status {
    return Gdiplus.Load('GdipAddPathRectangle')(path, x, y, width, height);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathrectanglei
  public static GdipAddPathRectangleI(path: GpPath, x: INT, y: INT, width: INT, height: INT): Status {
    return Gdiplus.Load('GdipAddPathRectangleI')(path, x, y, width, height);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathrectangles
  public static GdipAddPathRectangles(path: GpPath, rects: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipAddPathRectangles')(path, rects, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathrectanglesi
  public static GdipAddPathRectanglesI(path: GpPath, rects: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipAddPathRectanglesI')(path, rects, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathstring
  public static GdipAddPathString(path: GpPath, string: LPWSTR, length: INT, family: GpFontFamily, style: INT, emSize: REAL, layoutRect: Pointer, format: GpStringFormat): Status {
    return Gdiplus.Load('GdipAddPathString')(path, string, length, family, style, emSize, layoutRect, format);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipaddpathstringi
  public static GdipAddPathStringI(path: GpPath, string: LPWSTR, length: INT, family: GpFontFamily, style: INT, emSize: REAL, layoutRect: Pointer, format: GpStringFormat): Status {
    return Gdiplus.Load('GdipAddPathStringI')(path, string, length, family, style, emSize, layoutRect, format);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipalloc
  public static GdipAlloc(size: SIZE_T): LPVOID {
    return Gdiplus.Load('GdipAlloc')(size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipbegincontainer
  public static GdipBeginContainer(graphics: GpGraphics, dstrect: Pointer, srcrect: Pointer, unit: Unit, state_out: Pointer): Status {
    return Gdiplus.Load('GdipBeginContainer')(graphics, dstrect, srcrect, unit, state_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipbegincontainer2
  public static GdipBeginContainer2(graphics: GpGraphics, state_out: Pointer): Status {
    return Gdiplus.Load('GdipBeginContainer2')(graphics, state_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipbegincontaineri
  public static GdipBeginContainerI(graphics: GpGraphics, dstrect: Pointer, srcrect: Pointer, unit: Unit, state_out: Pointer): Status {
    return Gdiplus.Load('GdipBeginContainerI')(graphics, dstrect, srcrect, unit, state_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipbitmapapplyeffect
  public static GdipBitmapApplyEffect(bitmap: GpBitmap, effect: CGpEffect, roi: Pointer, useAuxData: BOOL, auxData_out: LPVOID, auxDataSize_out: LPINT): Status {
    return Gdiplus.Load('GdipBitmapApplyEffect')(bitmap, effect, roi, useAuxData, auxData_out, auxDataSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipbitmapconvertformat
  public static GdipBitmapConvertFormat(pInputBitmap: GpBitmap, format: PixelFormat, dithertype: DitherType, palettetype: PaletteType, palette: Pointer, alphaThresholdPercent: REAL): Status {
    return Gdiplus.Load('GdipBitmapConvertFormat')(pInputBitmap, format, dithertype, palettetype, palette, alphaThresholdPercent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipbitmapcreateapplyeffect
  public static GdipBitmapCreateApplyEffect(inputBitmaps: Pointer, numInputs: INT, effect: CGpEffect, roi: Pointer, outputRect_out: Pointer, outputBitmap_out: Pointer, useAuxData: BOOL, auxData_out: LPVOID, auxDataSize_out: LPINT): Status {
    return Gdiplus.Load('GdipBitmapCreateApplyEffect')(inputBitmaps, numInputs, effect, roi, outputRect_out, outputBitmap_out, useAuxData, auxData_out, auxDataSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipbitmapgethistogram
  public static GdipBitmapGetHistogram(bitmap: GpBitmap, format: HistogramFormat, NumberOfEntries: UINT, channel0_out: LPVOID, channel1_out: LPVOID, channel2_out: LPVOID, channel3_out: LPVOID): Status {
    return Gdiplus.Load('GdipBitmapGetHistogram')(bitmap, format, NumberOfEntries, channel0_out, channel1_out, channel2_out, channel3_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipbitmapgethistogramsize
  public static GdipBitmapGetHistogramSize(format: HistogramFormat, NumberOfEntries_out: LPUINT): Status {
    return Gdiplus.Load('GdipBitmapGetHistogramSize')(format, NumberOfEntries_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipbitmapgetpixel
  public static GdipBitmapGetPixel(bitmap: GpBitmap, x: INT, y: INT, color_out: LPARGB): Status {
    return Gdiplus.Load('GdipBitmapGetPixel')(bitmap, x, y, color_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipbitmaplockbits
  public static GdipBitmapLockBits(bitmap: GpBitmap, rect: NULLABLE<Pointer>, flags: UINT, format: PixelFormat, lockedBitmapData_in_out: Pointer): Status {
    return Gdiplus.Load('GdipBitmapLockBits')(bitmap, rect, flags, format, lockedBitmapData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipbitmapsetpixel
  public static GdipBitmapSetPixel(bitmap: GpBitmap, x: INT, y: INT, color: ARGB): Status {
    return Gdiplus.Load('GdipBitmapSetPixel')(bitmap, x, y, color);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipbitmapsetresolution
  public static GdipBitmapSetResolution(bitmap: GpBitmap, xdpi: REAL, ydpi: REAL): Status {
    return Gdiplus.Load('GdipBitmapSetResolution')(bitmap, xdpi, ydpi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipbitmapunlockbits
  public static GdipBitmapUnlockBits(bitmap: GpBitmap, lockedBitmapData: Pointer): Status {
    return Gdiplus.Load('GdipBitmapUnlockBits')(bitmap, lockedBitmapData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipclearpathmarkers
  public static GdipClearPathMarkers(path: GpPath): Status {
    return Gdiplus.Load('GdipClearPathMarkers')(path);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipclonebitmaparea
  public static GdipCloneBitmapArea(x: REAL, y: REAL, width: REAL, height: REAL, format: PixelFormat, srcBitmap: GpBitmap, dstBitmap_out: Pointer): Status {
    return Gdiplus.Load('GdipCloneBitmapArea')(x, y, width, height, format, srcBitmap, dstBitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipclonebitmapareai
  public static GdipCloneBitmapAreaI(x: INT, y: INT, width: INT, height: INT, format: PixelFormat, srcBitmap: GpBitmap, dstBitmap_out: Pointer): Status {
    return Gdiplus.Load('GdipCloneBitmapAreaI')(x, y, width, height, format, srcBitmap, dstBitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipclonebrush
  public static GdipCloneBrush(brush: GpBrush, cloneBrush_out: Pointer): Status {
    return Gdiplus.Load('GdipCloneBrush')(brush, cloneBrush_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipclonecustomlinecap
  public static GdipCloneCustomLineCap(customCap: GpCustomLineCap, clonedCap_out: Pointer): Status {
    return Gdiplus.Load('GdipCloneCustomLineCap')(customCap, clonedCap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipclonefont
  public static GdipCloneFont(font: GpFont, cloneFont_out: Pointer): Status {
    return Gdiplus.Load('GdipCloneFont')(font, cloneFont_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipclonefontfamily
  public static GdipCloneFontFamily(fontFamily: GpFontFamily, clonedFontFamily_out: Pointer): Status {
    return Gdiplus.Load('GdipCloneFontFamily')(fontFamily, clonedFontFamily_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcloneimage
  public static GdipCloneImage(image: GpImage, cloneImage_out: Pointer): Status {
    return Gdiplus.Load('GdipCloneImage')(image, cloneImage_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcloneimageattributes
  public static GdipCloneImageAttributes(imageattr: GpImageAttributes, cloneImageattr_out: Pointer): Status {
    return Gdiplus.Load('GdipCloneImageAttributes')(imageattr, cloneImageattr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipclonematrix
  public static GdipCloneMatrix(matrix: GpMatrix, cloneMatrix_out: Pointer): Status {
    return Gdiplus.Load('GdipCloneMatrix')(matrix, cloneMatrix_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipclonepath
  public static GdipClonePath(path: GpPath, clonePath_out: Pointer): Status {
    return Gdiplus.Load('GdipClonePath')(path, clonePath_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipclonepen
  public static GdipClonePen(pen: GpPen, clonepen_out: Pointer): Status {
    return Gdiplus.Load('GdipClonePen')(pen, clonepen_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcloneregion
  public static GdipCloneRegion(region: GpRegion, cloneRegion_out: Pointer): Status {
    return Gdiplus.Load('GdipCloneRegion')(region, cloneRegion_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipclonestringformat
  public static GdipCloneStringFormat(format: GpStringFormat, newFormat_out: Pointer): Status {
    return Gdiplus.Load('GdipCloneStringFormat')(format, newFormat_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipclosepathfigure
  public static GdipClosePathFigure(path: GpPath): Status {
    return Gdiplus.Load('GdipClosePathFigure')(path);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipclosepathfigures
  public static GdipClosePathFigures(path: GpPath): Status {
    return Gdiplus.Load('GdipClosePathFigures')(path);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcombineregionpath
  public static GdipCombineRegionPath(region: GpRegion, path: GpPath, combineMode: CombineMode): Status {
    return Gdiplus.Load('GdipCombineRegionPath')(region, path, combineMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcombineregionrect
  public static GdipCombineRegionRect(region: GpRegion, rect: Pointer, combineMode: CombineMode): Status {
    return Gdiplus.Load('GdipCombineRegionRect')(region, rect, combineMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcombineregionrecti
  public static GdipCombineRegionRectI(region: GpRegion, rect: Pointer, combineMode: CombineMode): Status {
    return Gdiplus.Load('GdipCombineRegionRectI')(region, rect, combineMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcombineregionregion
  public static GdipCombineRegionRegion(region: GpRegion, region2: GpRegion, combineMode: CombineMode): Status {
    return Gdiplus.Load('GdipCombineRegionRegion')(region, region2, combineMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcomment
  public static GdipComment(graphics: GpGraphics, sizeData: UINT, data: LPBYTE): Status {
    return Gdiplus.Load('GdipComment')(graphics, sizeData, data);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipconverttoemfplus
  public static GdipConvertToEmfPlus(refGraphics: GpGraphics, metafile: GpMetafile, conversionFailureFlag_out: LPINT, emfType: EmfType, description: LPWSTR, out_metafile_out: Pointer): Status {
    return Gdiplus.Load('GdipConvertToEmfPlus')(refGraphics, metafile, conversionFailureFlag_out, emfType, description, out_metafile_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipconverttoemfplustofile
  public static GdipConvertToEmfPlusToFile(refGraphics: GpGraphics, metafile: GpMetafile, conversionFailureFlag_out: LPINT, filename: LPWSTR, emfType: EmfType, description: LPWSTR, out_metafile_out: Pointer): Status {
    return Gdiplus.Load('GdipConvertToEmfPlusToFile')(refGraphics, metafile, conversionFailureFlag_out, filename, emfType, description, out_metafile_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipconverttoemfplustostream
  public static GdipConvertToEmfPlusToStream(refGraphics: GpGraphics, metafile: GpMetafile, conversionFailureFlag_out: LPINT, stream: IStream, emfType: EmfType, description: LPWSTR, out_metafile_out: Pointer): Status {
    return Gdiplus.Load('GdipConvertToEmfPlusToStream')(refGraphics, metafile, conversionFailureFlag_out, stream, emfType, description, out_metafile_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreateadjustablearrowcap
  public static GdipCreateAdjustableArrowCap(height: REAL, width: REAL, isFilled: BOOL, cap_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateAdjustableArrowCap')(height, width, isFilled, cap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatebitmapfromdirectdrawsurface
  public static GdipCreateBitmapFromDirectDrawSurface(surface: LPVOID, bitmap_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateBitmapFromDirectDrawSurface')(surface, bitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatebitmapfromfile
  public static GdipCreateBitmapFromFile(filename: LPWSTR, bitmap_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateBitmapFromFile')(filename, bitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatebitmapfromfileicm
  public static GdipCreateBitmapFromFileICM(filename: LPWSTR, bitmap_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateBitmapFromFileICM')(filename, bitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatebitmapfromgdidib
  public static GdipCreateBitmapFromGdiDib(gdiBitmapInfo: LPVOID, gdiBitmapData: LPVOID, bitmap_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateBitmapFromGdiDib')(gdiBitmapInfo, gdiBitmapData, bitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatebitmapfromgraphics
  public static GdipCreateBitmapFromGraphics(width: INT, height: INT, target: GpGraphics, bitmap_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateBitmapFromGraphics')(width, height, target, bitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatebitmapfromhbitmap
  public static GdipCreateBitmapFromHBITMAP(hbm: HBITMAP, hpal: HPALETTE, bitmap_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateBitmapFromHBITMAP')(hbm, hpal, bitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatebitmapfromhicon
  public static GdipCreateBitmapFromHICON(hicon: HICON, bitmap_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateBitmapFromHICON')(hicon, bitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatebitmapfromresource
  public static GdipCreateBitmapFromResource(hInstance: HINSTANCE, lpBitmapName: LPWSTR, bitmap_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateBitmapFromResource')(hInstance, lpBitmapName, bitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatebitmapfromscan0
  public static GdipCreateBitmapFromScan0(width: INT, height: INT, stride: INT, format: PixelFormat, scan0: OPTIONAL<LPVOID>, bitmap_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateBitmapFromScan0')(width, height, stride, format, scan0, bitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatebitmapfromstream
  public static GdipCreateBitmapFromStream(stream: IStream, bitmap_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateBitmapFromStream')(stream, bitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatebitmapfromstreamicm
  public static GdipCreateBitmapFromStreamICM(stream: IStream, bitmap_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateBitmapFromStreamICM')(stream, bitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatecachedbitmap
  public static GdipCreateCachedBitmap(bitmap: GpBitmap, graphics: GpGraphics, cachedBitmap_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateCachedBitmap')(bitmap, graphics, cachedBitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatecustomlinecap
  public static GdipCreateCustomLineCap(fillPath: GpPath, strokePath: GpPath, baseCap: LineCap, baseInset: REAL, customCap_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateCustomLineCap')(fillPath, strokePath, baseCap, baseInset, customCap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreateeffect
  public static GdipCreateEffect(guid: Pointer, effect_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateEffect')(guid, effect_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatefont
  public static GdipCreateFont(fontFamily: GpFontFamily, emSize: REAL, style: INT, unit: Unit, font_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateFont')(fontFamily, emSize, style, unit, font_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatefontfamilyfromname
  public static GdipCreateFontFamilyFromName(name: LPWSTR, fontCollection: GpFontCollection, fontFamily_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateFontFamilyFromName')(name, fontCollection, fontFamily_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatefontfromdc
  public static GdipCreateFontFromDC(hdc: HDC, font_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateFontFromDC')(hdc, font_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatefontfromlogfonta
  public static GdipCreateFontFromLogfontA(hdc: HDC, logfont: Pointer, font_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateFontFromLogfontA')(hdc, logfont, font_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatefontfromlogfontw
  public static GdipCreateFontFromLogfontW(hdc: HDC, logfont: Pointer, font_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateFontFromLogfontW')(hdc, logfont, font_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatefromhdc
  public static GdipCreateFromHDC(hdc: HDC, graphics_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateFromHDC')(hdc, graphics_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatefromhdc2
  public static GdipCreateFromHDC2(hdc: HDC, hDevice: HANDLE, graphics_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateFromHDC2')(hdc, hDevice, graphics_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatefromhwnd
  public static GdipCreateFromHWND(hwnd: HWND, graphics_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateFromHWND')(hwnd, graphics_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatefromhwndicm
  public static GdipCreateFromHWNDICM(hwnd: HWND, graphics_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateFromHWNDICM')(hwnd, graphics_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatehbitmapfrombitmap
  public static GdipCreateHBITMAPFromBitmap(bitmap: GpBitmap, hbmReturn_out: Pointer, background: ARGB): Status {
    return Gdiplus.Load('GdipCreateHBITMAPFromBitmap')(bitmap, hbmReturn_out, background);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatehiconfrombitmap
  public static GdipCreateHICONFromBitmap(bitmap: GpBitmap, hbmReturn_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateHICONFromBitmap')(bitmap, hbmReturn_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatehalftonepalette
  public static GdipCreateHalftonePalette(): Status {
    return Gdiplus.Load('GdipCreateHalftonePalette')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatehatchbrush
  public static GdipCreateHatchBrush(hatchstyle: HatchStyle, forecol: ARGB, backcol: ARGB, brush_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateHatchBrush')(hatchstyle, forecol, backcol, brush_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreateimageattributes
  public static GdipCreateImageAttributes(imageattr_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateImageAttributes')(imageattr_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatelinebrush
  public static GdipCreateLineBrush(point1: Pointer, point2: Pointer, color1: ARGB, color2: ARGB, wrapMode: WrapMode, lineGradient_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateLineBrush')(point1, point2, color1, color2, wrapMode, lineGradient_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatelinebrushfromrect
  public static GdipCreateLineBrushFromRect(rect: Pointer, color1: ARGB, color2: ARGB, mode: LinearGradientMode, wrapMode: WrapMode, lineGradient_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateLineBrushFromRect')(rect, color1, color2, mode, wrapMode, lineGradient_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatelinebrushfromrecti
  public static GdipCreateLineBrushFromRectI(rect: Pointer, color1: ARGB, color2: ARGB, mode: LinearGradientMode, wrapMode: WrapMode, lineGradient_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateLineBrushFromRectI')(rect, color1, color2, mode, wrapMode, lineGradient_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatelinebrushfromrectwithangle
  public static GdipCreateLineBrushFromRectWithAngle(rect: Pointer, color1: ARGB, color2: ARGB, angle: REAL, isAngleScalable: BOOL, wrapMode: WrapMode, lineGradient_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateLineBrushFromRectWithAngle')(rect, color1, color2, angle, isAngleScalable, wrapMode, lineGradient_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatelinebrushfromrectwithanglei
  public static GdipCreateLineBrushFromRectWithAngleI(rect: Pointer, color1: ARGB, color2: ARGB, angle: REAL, isAngleScalable: BOOL, wrapMode: WrapMode, lineGradient_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateLineBrushFromRectWithAngleI')(rect, color1, color2, angle, isAngleScalable, wrapMode, lineGradient_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatelinebrushi
  public static GdipCreateLineBrushI(point1: Pointer, point2: Pointer, color1: ARGB, color2: ARGB, wrapMode: WrapMode, lineGradient_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateLineBrushI')(point1, point2, color1, color2, wrapMode, lineGradient_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatematrix
  public static GdipCreateMatrix(matrix_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateMatrix')(matrix_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatematrix2
  public static GdipCreateMatrix2(m11: REAL, m12: REAL, m21: REAL, m22: REAL, dx: REAL, dy: REAL, matrix_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateMatrix2')(m11, m12, m21, m22, dx, dy, matrix_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatematrix3
  public static GdipCreateMatrix3(rect: Pointer, dstplg: Pointer, matrix_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateMatrix3')(rect, dstplg, matrix_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatematrix3i
  public static GdipCreateMatrix3I(rect: Pointer, dstplg: Pointer, matrix_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateMatrix3I')(rect, dstplg, matrix_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatemetafilefromemf
  public static GdipCreateMetafileFromEmf(hEmf: HENHMETAFILE, deleteEmf: BOOL, metafile_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateMetafileFromEmf')(hEmf, deleteEmf, metafile_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatemetafilefromfile
  public static GdipCreateMetafileFromFile(file: LPWSTR, metafile_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateMetafileFromFile')(file, metafile_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatemetafilefromstream
  public static GdipCreateMetafileFromStream(stream: IStream, metafile_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateMetafileFromStream')(stream, metafile_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatemetafilefromwmf
  public static GdipCreateMetafileFromWmf(hWmf: HMETAFILE, deleteWmf: BOOL, wmfPlaceableFileHeader: Pointer, metafile_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateMetafileFromWmf')(hWmf, deleteWmf, wmfPlaceableFileHeader, metafile_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatemetafilefromwmffile
  public static GdipCreateMetafileFromWmfFile(file: LPWSTR, wmfPlaceableFileHeader: Pointer, metafile_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateMetafileFromWmfFile')(file, wmfPlaceableFileHeader, metafile_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatepath
  public static GdipCreatePath(brushMode: FillMode, path_out: Pointer): Status {
    return Gdiplus.Load('GdipCreatePath')(brushMode, path_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatepath2
  public static GdipCreatePath2(pointF: Pointer, bYTE: LPBYTE, iNT: INT, fillMode: FillMode, path_out: Pointer): Status {
    return Gdiplus.Load('GdipCreatePath2')(pointF, bYTE, iNT, fillMode, path_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatepath2i
  public static GdipCreatePath2I(point: Pointer, bYTE: LPBYTE, iNT: INT, fillMode: FillMode, path_out: Pointer): Status {
    return Gdiplus.Load('GdipCreatePath2I')(point, bYTE, iNT, fillMode, path_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatepathgradient
  public static GdipCreatePathGradient(points: Pointer, count: INT, wrapMode: WrapMode, polyGradient_out: Pointer): Status {
    return Gdiplus.Load('GdipCreatePathGradient')(points, count, wrapMode, polyGradient_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatepathgradientfrompath
  public static GdipCreatePathGradientFromPath(path: GpPath, polyGradient_out: Pointer): Status {
    return Gdiplus.Load('GdipCreatePathGradientFromPath')(path, polyGradient_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatepathgradienti
  public static GdipCreatePathGradientI(points: Pointer, count: INT, wrapMode: WrapMode, polyGradient_out: Pointer): Status {
    return Gdiplus.Load('GdipCreatePathGradientI')(points, count, wrapMode, polyGradient_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatepathiter
  public static GdipCreatePathIter(iterator_out: Pointer, path: GpPath): Status {
    return Gdiplus.Load('GdipCreatePathIter')(iterator_out, path);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatepen1
  public static GdipCreatePen1(color: ARGB, width: REAL, unit: Unit, pen_out: Pointer): Status {
    return Gdiplus.Load('GdipCreatePen1')(color, width, unit, pen_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatepen2
  public static GdipCreatePen2(brush: GpBrush, width: REAL, unit: Unit, pen_out: Pointer): Status {
    return Gdiplus.Load('GdipCreatePen2')(brush, width, unit, pen_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreateregion
  public static GdipCreateRegion(region_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateRegion')(region_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreateregionhrgn
  public static GdipCreateRegionHrgn(hRgn: HRGN, region_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateRegionHrgn')(hRgn, region_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreateregionpath
  public static GdipCreateRegionPath(path: GpPath, region_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateRegionPath')(path, region_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreateregionrect
  public static GdipCreateRegionRect(rect: Pointer, region_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateRegionRect')(rect, region_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreateregionrecti
  public static GdipCreateRegionRectI(rect: Pointer, region_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateRegionRectI')(rect, region_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreateregionrgndata
  public static GdipCreateRegionRgnData(regionData: LPBYTE, size: INT, region_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateRegionRgnData')(regionData, size, region_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatesolidfill
  public static GdipCreateSolidFill(color: ARGB, brush_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateSolidFill')(color, brush_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatestreamonfile
  public static GdipCreateStreamOnFile(filename: LPWSTR, access: UINT, stream_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateStreamOnFile')(filename, access, stream_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatestringformat
  public static GdipCreateStringFormat(formatAttributes: INT, language: LANGID, format_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateStringFormat')(formatAttributes, language, format_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatetexture
  public static GdipCreateTexture(image: GpImage, wrapmode: WrapMode, texture_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateTexture')(image, wrapmode, texture_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatetexture2
  public static GdipCreateTexture2(image: GpImage, wrapmode: WrapMode, x: REAL, y: REAL, width: REAL, height: REAL, texture_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateTexture2')(image, wrapmode, x, y, width, height, texture_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatetexture2i
  public static GdipCreateTexture2I(image: GpImage, wrapmode: WrapMode, x: INT, y: INT, width: INT, height: INT, texture_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateTexture2I')(image, wrapmode, x, y, width, height, texture_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatetextureia
  public static GdipCreateTextureIA(image: GpImage, imageAttributes: GpImageAttributes, x: REAL, y: REAL, width: REAL, height: REAL, texture_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateTextureIA')(image, imageAttributes, x, y, width, height, texture_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipcreatetextureiai
  public static GdipCreateTextureIAI(image: GpImage, imageAttributes: GpImageAttributes, x: INT, y: INT, width: INT, height: INT, texture_out: Pointer): Status {
    return Gdiplus.Load('GdipCreateTextureIAI')(image, imageAttributes, x, y, width, height, texture_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdeletebrush
  public static GdipDeleteBrush(brush: GpBrush): Status {
    return Gdiplus.Load('GdipDeleteBrush')(brush);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdeletecachedbitmap
  public static GdipDeleteCachedBitmap(cachedBitmap: GpCachedBitmap): Status {
    return Gdiplus.Load('GdipDeleteCachedBitmap')(cachedBitmap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdeletecustomlinecap
  public static GdipDeleteCustomLineCap(customCap: GpCustomLineCap): Status {
    return Gdiplus.Load('GdipDeleteCustomLineCap')(customCap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdeleteeffect
  public static GdipDeleteEffect(effect: CGpEffect): Status {
    return Gdiplus.Load('GdipDeleteEffect')(effect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdeletefont
  public static GdipDeleteFont(font: GpFont): Status {
    return Gdiplus.Load('GdipDeleteFont')(font);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdeletefontfamily
  public static GdipDeleteFontFamily(fontFamily: GpFontFamily): Status {
    return Gdiplus.Load('GdipDeleteFontFamily')(fontFamily);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdeletegraphics
  public static GdipDeleteGraphics(graphics: GpGraphics): Status {
    return Gdiplus.Load('GdipDeleteGraphics')(graphics);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdeletematrix
  public static GdipDeleteMatrix(matrix: GpMatrix): Status {
    return Gdiplus.Load('GdipDeleteMatrix')(matrix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdeletepath
  public static GdipDeletePath(path: GpPath): Status {
    return Gdiplus.Load('GdipDeletePath')(path);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdeletepathiter
  public static GdipDeletePathIter(iterator: GpPathIterator): Status {
    return Gdiplus.Load('GdipDeletePathIter')(iterator);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdeletepen
  public static GdipDeletePen(pen: GpPen): Status {
    return Gdiplus.Load('GdipDeletePen')(pen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdeleteprivatefontcollection
  public static GdipDeletePrivateFontCollection(fontCollection_out: Pointer): Status {
    return Gdiplus.Load('GdipDeletePrivateFontCollection')(fontCollection_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdeleteregion
  public static GdipDeleteRegion(region: GpRegion): Status {
    return Gdiplus.Load('GdipDeleteRegion')(region);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdeletestringformat
  public static GdipDeleteStringFormat(format: GpStringFormat): Status {
    return Gdiplus.Load('GdipDeleteStringFormat')(format);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdisposeimage
  public static GdipDisposeImage(image: GpImage): Status {
    return Gdiplus.Load('GdipDisposeImage')(image);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdisposeimageattributes
  public static GdipDisposeImageAttributes(imageattr: GpImageAttributes): Status {
    return Gdiplus.Load('GdipDisposeImageAttributes')(imageattr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawarc
  public static GdipDrawArc(graphics: GpGraphics, pen: GpPen, x: REAL, y: REAL, width: REAL, height: REAL, startAngle: REAL, sweepAngle: REAL): Status {
    return Gdiplus.Load('GdipDrawArc')(graphics, pen, x, y, width, height, startAngle, sweepAngle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawarci
  public static GdipDrawArcI(graphics: GpGraphics, pen: GpPen, x: INT, y: INT, width: INT, height: INT, startAngle: REAL, sweepAngle: REAL): Status {
    return Gdiplus.Load('GdipDrawArcI')(graphics, pen, x, y, width, height, startAngle, sweepAngle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawbezier
  public static GdipDrawBezier(graphics: GpGraphics, pen: GpPen, x1: REAL, y1: REAL, x2: REAL, y2: REAL, x3: REAL, y3: REAL, x4: REAL, y4: REAL): Status {
    return Gdiplus.Load('GdipDrawBezier')(graphics, pen, x1, y1, x2, y2, x3, y3, x4, y4);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawbezieri
  public static GdipDrawBezierI(graphics: GpGraphics, pen: GpPen, x1: INT, y1: INT, x2: INT, y2: INT, x3: INT, y3: INT, x4: INT, y4: INT): Status {
    return Gdiplus.Load('GdipDrawBezierI')(graphics, pen, x1, y1, x2, y2, x3, y3, x4, y4);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawbeziers
  public static GdipDrawBeziers(graphics: GpGraphics, pen: GpPen, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipDrawBeziers')(graphics, pen, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawbeziersi
  public static GdipDrawBeziersI(graphics: GpGraphics, pen: GpPen, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipDrawBeziersI')(graphics, pen, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawcachedbitmap
  public static GdipDrawCachedBitmap(graphics: GpGraphics, cachedBitmap: GpCachedBitmap, x: INT, y: INT): Status {
    return Gdiplus.Load('GdipDrawCachedBitmap')(graphics, cachedBitmap, x, y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawclosedcurve
  public static GdipDrawClosedCurve(graphics: GpGraphics, pen: GpPen, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipDrawClosedCurve')(graphics, pen, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawclosedcurve2
  public static GdipDrawClosedCurve2(graphics: GpGraphics, pen: GpPen, points: Pointer, count: INT, tension: REAL): Status {
    return Gdiplus.Load('GdipDrawClosedCurve2')(graphics, pen, points, count, tension);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawclosedcurve2i
  public static GdipDrawClosedCurve2I(graphics: GpGraphics, pen: GpPen, points: Pointer, count: INT, tension: REAL): Status {
    return Gdiplus.Load('GdipDrawClosedCurve2I')(graphics, pen, points, count, tension);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawclosedcurvei
  public static GdipDrawClosedCurveI(graphics: GpGraphics, pen: GpPen, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipDrawClosedCurveI')(graphics, pen, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawcurve
  public static GdipDrawCurve(graphics: GpGraphics, pen: GpPen, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipDrawCurve')(graphics, pen, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawcurve2
  public static GdipDrawCurve2(graphics: GpGraphics, pen: GpPen, points: Pointer, count: INT, tension: REAL): Status {
    return Gdiplus.Load('GdipDrawCurve2')(graphics, pen, points, count, tension);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawcurve2i
  public static GdipDrawCurve2I(graphics: GpGraphics, pen: GpPen, points: Pointer, count: INT, tension: REAL): Status {
    return Gdiplus.Load('GdipDrawCurve2I')(graphics, pen, points, count, tension);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawcurve3
  public static GdipDrawCurve3(graphics: GpGraphics, pen: GpPen, points: Pointer, count: INT, offset: INT, numberOfSegments: INT, tension: REAL): Status {
    return Gdiplus.Load('GdipDrawCurve3')(graphics, pen, points, count, offset, numberOfSegments, tension);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawcurve3i
  public static GdipDrawCurve3I(graphics: GpGraphics, pen: GpPen, points: Pointer, count: INT, offset: INT, numberOfSegments: INT, tension: REAL): Status {
    return Gdiplus.Load('GdipDrawCurve3I')(graphics, pen, points, count, offset, numberOfSegments, tension);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawcurvei
  public static GdipDrawCurveI(graphics: GpGraphics, pen: GpPen, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipDrawCurveI')(graphics, pen, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawdriverstring
  public static GdipDrawDriverString(graphics: GpGraphics, text: LPUINT16, length: INT, font: GpFont, brush: GpBrush, positions: Pointer, flags: INT, matrix: GpMatrix): Status {
    return Gdiplus.Load('GdipDrawDriverString')(graphics, text, length, font, brush, positions, flags, matrix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawellipse
  public static GdipDrawEllipse(graphics: GpGraphics, pen: GpPen, x: REAL, y: REAL, width: REAL, height: REAL): Status {
    return Gdiplus.Load('GdipDrawEllipse')(graphics, pen, x, y, width, height);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawellipsei
  public static GdipDrawEllipseI(graphics: GpGraphics, pen: GpPen, x: INT, y: INT, width: INT, height: INT): Status {
    return Gdiplus.Load('GdipDrawEllipseI')(graphics, pen, x, y, width, height);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawimage
  public static GdipDrawImage(graphics: GpGraphics, image: GpImage, x: REAL, y: REAL): Status {
    return Gdiplus.Load('GdipDrawImage')(graphics, image, x, y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawimagefx
  public static GdipDrawImageFX(graphics: GpGraphics, image: GpImage, source: Pointer, xForm: GpMatrix, effect: CGpEffect, imageAttributes: GpImageAttributes, srcUnit: Unit): Status {
    return Gdiplus.Load('GdipDrawImageFX')(graphics, image, source, xForm, effect, imageAttributes, srcUnit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawimagei
  public static GdipDrawImageI(graphics: GpGraphics, image: GpImage, x: INT, y: INT): Status {
    return Gdiplus.Load('GdipDrawImageI')(graphics, image, x, y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawimagepointrect
  public static GdipDrawImagePointRect(graphics: GpGraphics, image: GpImage, x: REAL, y: REAL, srcx: REAL, srcy: REAL, srcwidth: REAL, srcheight: REAL, srcUnit: Unit): Status {
    return Gdiplus.Load('GdipDrawImagePointRect')(graphics, image, x, y, srcx, srcy, srcwidth, srcheight, srcUnit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawimagepointrecti
  public static GdipDrawImagePointRectI(graphics: GpGraphics, image: GpImage, x: INT, y: INT, srcx: INT, srcy: INT, srcwidth: INT, srcheight: INT, srcUnit: Unit): Status {
    return Gdiplus.Load('GdipDrawImagePointRectI')(graphics, image, x, y, srcx, srcy, srcwidth, srcheight, srcUnit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawimagepoints
  public static GdipDrawImagePoints(graphics: GpGraphics, image: GpImage, dstpoints: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipDrawImagePoints')(graphics, image, dstpoints, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawimagepointsi
  public static GdipDrawImagePointsI(graphics: GpGraphics, image: GpImage, dstpoints: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipDrawImagePointsI')(graphics, image, dstpoints, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawimagepointsrect
  public static GdipDrawImagePointsRect(
    graphics: GpGraphics,
    image: GpImage,
    points: Pointer,
    count: INT,
    srcx: REAL,
    srcy: REAL,
    srcwidth: REAL,
    srcheight: REAL,
    srcUnit: Unit,
    imageAttributes: GpImageAttributes,
    callback: Pointer,
    callbackData: LPVOID,
  ): Status {
    return Gdiplus.Load('GdipDrawImagePointsRect')(graphics, image, points, count, srcx, srcy, srcwidth, srcheight, srcUnit, imageAttributes, callback, callbackData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawimagepointsrecti
  public static GdipDrawImagePointsRectI(
    graphics: GpGraphics,
    image: GpImage,
    points: Pointer,
    count: INT,
    srcx: INT,
    srcy: INT,
    srcwidth: INT,
    srcheight: INT,
    srcUnit: Unit,
    imageAttributes: GpImageAttributes,
    callback: Pointer,
    callbackData: LPVOID,
  ): Status {
    return Gdiplus.Load('GdipDrawImagePointsRectI')(graphics, image, points, count, srcx, srcy, srcwidth, srcheight, srcUnit, imageAttributes, callback, callbackData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawimagerect
  public static GdipDrawImageRect(graphics: GpGraphics, image: GpImage, x: REAL, y: REAL, width: REAL, height: REAL): Status {
    return Gdiplus.Load('GdipDrawImageRect')(graphics, image, x, y, width, height);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawimagerecti
  public static GdipDrawImageRectI(graphics: GpGraphics, image: GpImage, x: INT, y: INT, width: INT, height: INT): Status {
    return Gdiplus.Load('GdipDrawImageRectI')(graphics, image, x, y, width, height);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawimagerectrect
  public static GdipDrawImageRectRect(
    graphics: GpGraphics,
    image: GpImage,
    dstx: REAL,
    dsty: REAL,
    dstwidth: REAL,
    dstheight: REAL,
    srcx: REAL,
    srcy: REAL,
    srcwidth: REAL,
    srcheight: REAL,
    srcUnit: Unit,
    imageAttributes: GpImageAttributes,
    callback: Pointer,
    callbackData: LPVOID,
  ): Status {
    return Gdiplus.Load('GdipDrawImageRectRect')(graphics, image, dstx, dsty, dstwidth, dstheight, srcx, srcy, srcwidth, srcheight, srcUnit, imageAttributes, callback, callbackData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawimagerectrecti
  public static GdipDrawImageRectRectI(
    graphics: GpGraphics,
    image: GpImage,
    dstx: INT,
    dsty: INT,
    dstwidth: INT,
    dstheight: INT,
    srcx: INT,
    srcy: INT,
    srcwidth: INT,
    srcheight: INT,
    srcUnit: Unit,
    imageAttributes: GpImageAttributes,
    callback: Pointer,
    callbackData: LPVOID,
  ): Status {
    return Gdiplus.Load('GdipDrawImageRectRectI')(graphics, image, dstx, dsty, dstwidth, dstheight, srcx, srcy, srcwidth, srcheight, srcUnit, imageAttributes, callback, callbackData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawline
  public static GdipDrawLine(graphics: GpGraphics, pen: GpPen, x1: REAL, y1: REAL, x2: REAL, y2: REAL): Status {
    return Gdiplus.Load('GdipDrawLine')(graphics, pen, x1, y1, x2, y2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawlinei
  public static GdipDrawLineI(graphics: GpGraphics, pen: GpPen, x1: INT, y1: INT, x2: INT, y2: INT): Status {
    return Gdiplus.Load('GdipDrawLineI')(graphics, pen, x1, y1, x2, y2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawlines
  public static GdipDrawLines(graphics: GpGraphics, pen: GpPen, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipDrawLines')(graphics, pen, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawlinesi
  public static GdipDrawLinesI(graphics: GpGraphics, pen: GpPen, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipDrawLinesI')(graphics, pen, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawpath
  public static GdipDrawPath(graphics: GpGraphics, pen: GpPen, path: GpPath): Status {
    return Gdiplus.Load('GdipDrawPath')(graphics, pen, path);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawpie
  public static GdipDrawPie(graphics: GpGraphics, pen: GpPen, x: REAL, y: REAL, width: REAL, height: REAL, startAngle: REAL, sweepAngle: REAL): Status {
    return Gdiplus.Load('GdipDrawPie')(graphics, pen, x, y, width, height, startAngle, sweepAngle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawpiei
  public static GdipDrawPieI(graphics: GpGraphics, pen: GpPen, x: INT, y: INT, width: INT, height: INT, startAngle: REAL, sweepAngle: REAL): Status {
    return Gdiplus.Load('GdipDrawPieI')(graphics, pen, x, y, width, height, startAngle, sweepAngle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawpolygon
  public static GdipDrawPolygon(graphics: GpGraphics, pen: GpPen, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipDrawPolygon')(graphics, pen, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawpolygoni
  public static GdipDrawPolygonI(graphics: GpGraphics, pen: GpPen, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipDrawPolygonI')(graphics, pen, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawrectangle
  public static GdipDrawRectangle(graphics: GpGraphics, pen: GpPen, x: REAL, y: REAL, width: REAL, height: REAL): Status {
    return Gdiplus.Load('GdipDrawRectangle')(graphics, pen, x, y, width, height);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawrectanglei
  public static GdipDrawRectangleI(graphics: GpGraphics, pen: GpPen, x: INT, y: INT, width: INT, height: INT): Status {
    return Gdiplus.Load('GdipDrawRectangleI')(graphics, pen, x, y, width, height);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawrectangles
  public static GdipDrawRectangles(graphics: GpGraphics, pen: GpPen, rects: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipDrawRectangles')(graphics, pen, rects, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawrectanglesi
  public static GdipDrawRectanglesI(graphics: GpGraphics, pen: GpPen, rects: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipDrawRectanglesI')(graphics, pen, rects, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipdrawstring
  public static GdipDrawString(graphics: GpGraphics, string: LPWSTR, length: INT, font: GpFont, layoutRect: Pointer, stringFormat: GpStringFormat, brush: GpBrush): Status {
    return Gdiplus.Load('GdipDrawString')(graphics, string, length, font, layoutRect, stringFormat, brush);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipemftowmfbits
  public static GdipEmfToWmfBits(hemf: HENHMETAFILE, cbData16: UINT, pData16_out: OPTIONAL<LPBYTE>, iMapMode: INT, eFlags: INT): UINT {
    return Gdiplus.Load('GdipEmfToWmfBits')(hemf, cbData16, pData16_out, iMapMode, eFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipendcontainer
  public static GdipEndContainer(graphics: GpGraphics, state: GraphicsContainer): Status {
    return Gdiplus.Load('GdipEndContainer')(graphics, state);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipenumeratemetafiledestpoint
  public static GdipEnumerateMetafileDestPoint(graphics: GpGraphics, metafile: GpMetafile, destPoint: Pointer, callback: Pointer, callbackData: LPVOID, imageAttributes: GpImageAttributes): Status {
    return Gdiplus.Load('GdipEnumerateMetafileDestPoint')(graphics, metafile, destPoint, callback, callbackData, imageAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipenumeratemetafiledestpointi
  public static GdipEnumerateMetafileDestPointI(graphics: GpGraphics, metafile: GpMetafile, destPoint: Pointer, callback: Pointer, callbackData: LPVOID, imageAttributes: GpImageAttributes): Status {
    return Gdiplus.Load('GdipEnumerateMetafileDestPointI')(graphics, metafile, destPoint, callback, callbackData, imageAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipenumeratemetafiledestpoints
  public static GdipEnumerateMetafileDestPoints(graphics: GpGraphics, metafile: GpMetafile, destPoints: Pointer, count: INT, callback: Pointer, callbackData: LPVOID, imageAttributes: GpImageAttributes): Status {
    return Gdiplus.Load('GdipEnumerateMetafileDestPoints')(graphics, metafile, destPoints, count, callback, callbackData, imageAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipenumeratemetafiledestpointsi
  public static GdipEnumerateMetafileDestPointsI(graphics: GpGraphics, metafile: GpMetafile, destPoints: Pointer, count: INT, callback: Pointer, callbackData: LPVOID, imageAttributes: GpImageAttributes): Status {
    return Gdiplus.Load('GdipEnumerateMetafileDestPointsI')(graphics, metafile, destPoints, count, callback, callbackData, imageAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipenumeratemetafiledestrect
  public static GdipEnumerateMetafileDestRect(graphics: GpGraphics, metafile: GpMetafile, destRect: Pointer, callback: Pointer, callbackData: LPVOID, imageAttributes: GpImageAttributes): Status {
    return Gdiplus.Load('GdipEnumerateMetafileDestRect')(graphics, metafile, destRect, callback, callbackData, imageAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipenumeratemetafiledestrecti
  public static GdipEnumerateMetafileDestRectI(graphics: GpGraphics, metafile: GpMetafile, destRect: Pointer, callback: Pointer, callbackData: LPVOID, imageAttributes: GpImageAttributes): Status {
    return Gdiplus.Load('GdipEnumerateMetafileDestRectI')(graphics, metafile, destRect, callback, callbackData, imageAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipenumeratemetafilesrcrectdestpoint
  public static GdipEnumerateMetafileSrcRectDestPoint(graphics: GpGraphics, metafile: GpMetafile, destPoint: Pointer, srcRect: Pointer, srcUnit: Unit, callback: Pointer, callbackData: LPVOID, imageAttributes: GpImageAttributes): Status {
    return Gdiplus.Load('GdipEnumerateMetafileSrcRectDestPoint')(graphics, metafile, destPoint, srcRect, srcUnit, callback, callbackData, imageAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipenumeratemetafilesrcrectdestpointi
  public static GdipEnumerateMetafileSrcRectDestPointI(graphics: GpGraphics, metafile: GpMetafile, destPoint: Pointer, srcRect: Pointer, srcUnit: Unit, callback: Pointer, callbackData: LPVOID, imageAttributes: GpImageAttributes): Status {
    return Gdiplus.Load('GdipEnumerateMetafileSrcRectDestPointI')(graphics, metafile, destPoint, srcRect, srcUnit, callback, callbackData, imageAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipenumeratemetafilesrcrectdestpoints
  public static GdipEnumerateMetafileSrcRectDestPoints(
    graphics: GpGraphics,
    metafile: GpMetafile,
    destPoints: Pointer,
    count: INT,
    srcRect: Pointer,
    srcUnit: Unit,
    callback: Pointer,
    callbackData: LPVOID,
    imageAttributes: GpImageAttributes,
  ): Status {
    return Gdiplus.Load('GdipEnumerateMetafileSrcRectDestPoints')(graphics, metafile, destPoints, count, srcRect, srcUnit, callback, callbackData, imageAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipenumeratemetafilesrcrectdestpointsi
  public static GdipEnumerateMetafileSrcRectDestPointsI(
    graphics: GpGraphics,
    metafile: GpMetafile,
    destPoints: Pointer,
    count: INT,
    srcRect: Pointer,
    srcUnit: Unit,
    callback: Pointer,
    callbackData: LPVOID,
    imageAttributes: GpImageAttributes,
  ): Status {
    return Gdiplus.Load('GdipEnumerateMetafileSrcRectDestPointsI')(graphics, metafile, destPoints, count, srcRect, srcUnit, callback, callbackData, imageAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipenumeratemetafilesrcrectdestrect
  public static GdipEnumerateMetafileSrcRectDestRect(graphics: GpGraphics, metafile: GpMetafile, destRect: Pointer, srcRect: Pointer, srcUnit: Unit, callback: Pointer, callbackData: LPVOID, imageAttributes: GpImageAttributes): Status {
    return Gdiplus.Load('GdipEnumerateMetafileSrcRectDestRect')(graphics, metafile, destRect, srcRect, srcUnit, callback, callbackData, imageAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipenumeratemetafilesrcrectdestrecti
  public static GdipEnumerateMetafileSrcRectDestRectI(graphics: GpGraphics, metafile: GpMetafile, destRect: Pointer, srcRect: Pointer, srcUnit: Unit, callback: Pointer, callbackData: LPVOID, imageAttributes: GpImageAttributes): Status {
    return Gdiplus.Load('GdipEnumerateMetafileSrcRectDestRectI')(graphics, metafile, destRect, srcRect, srcUnit, callback, callbackData, imageAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipfillclosedcurve
  public static GdipFillClosedCurve(graphics: GpGraphics, brush: GpBrush, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipFillClosedCurve')(graphics, brush, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipfillclosedcurve2
  public static GdipFillClosedCurve2(graphics: GpGraphics, brush: GpBrush, points: Pointer, count: INT, tension: REAL, fillMode: FillMode): Status {
    return Gdiplus.Load('GdipFillClosedCurve2')(graphics, brush, points, count, tension, fillMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipfillclosedcurve2i
  public static GdipFillClosedCurve2I(graphics: GpGraphics, brush: GpBrush, points: Pointer, count: INT, tension: REAL, fillMode: FillMode): Status {
    return Gdiplus.Load('GdipFillClosedCurve2I')(graphics, brush, points, count, tension, fillMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipfillclosedcurvei
  public static GdipFillClosedCurveI(graphics: GpGraphics, brush: GpBrush, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipFillClosedCurveI')(graphics, brush, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipfillellipse
  public static GdipFillEllipse(graphics: GpGraphics, brush: GpBrush, x: REAL, y: REAL, width: REAL, height: REAL): Status {
    return Gdiplus.Load('GdipFillEllipse')(graphics, brush, x, y, width, height);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipfillellipsei
  public static GdipFillEllipseI(graphics: GpGraphics, brush: GpBrush, x: INT, y: INT, width: INT, height: INT): Status {
    return Gdiplus.Load('GdipFillEllipseI')(graphics, brush, x, y, width, height);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipfillpath
  public static GdipFillPath(graphics: GpGraphics, brush: GpBrush, path: GpPath): Status {
    return Gdiplus.Load('GdipFillPath')(graphics, brush, path);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipfillpie
  public static GdipFillPie(graphics: GpGraphics, brush: GpBrush, x: REAL, y: REAL, width: REAL, height: REAL, startAngle: REAL, sweepAngle: REAL): Status {
    return Gdiplus.Load('GdipFillPie')(graphics, brush, x, y, width, height, startAngle, sweepAngle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipfillpiei
  public static GdipFillPieI(graphics: GpGraphics, brush: GpBrush, x: INT, y: INT, width: INT, height: INT, startAngle: REAL, sweepAngle: REAL): Status {
    return Gdiplus.Load('GdipFillPieI')(graphics, brush, x, y, width, height, startAngle, sweepAngle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipfillpolygon
  public static GdipFillPolygon(graphics: GpGraphics, brush: GpBrush, points: Pointer, count: INT, fillMode: FillMode): Status {
    return Gdiplus.Load('GdipFillPolygon')(graphics, brush, points, count, fillMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipfillpolygon2
  public static GdipFillPolygon2(graphics: GpGraphics, brush: GpBrush, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipFillPolygon2')(graphics, brush, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipfillpolygon2i
  public static GdipFillPolygon2I(graphics: GpGraphics, brush: GpBrush, points: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipFillPolygon2I')(graphics, brush, points, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipfillpolygoni
  public static GdipFillPolygonI(graphics: GpGraphics, brush: GpBrush, points: Pointer, count: INT, fillMode: FillMode): Status {
    return Gdiplus.Load('GdipFillPolygonI')(graphics, brush, points, count, fillMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipfillrectangle
  public static GdipFillRectangle(graphics: GpGraphics, brush: GpBrush, x: REAL, y: REAL, width: REAL, height: REAL): Status {
    return Gdiplus.Load('GdipFillRectangle')(graphics, brush, x, y, width, height);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipfillrectanglei
  public static GdipFillRectangleI(graphics: GpGraphics, brush: GpBrush, x: INT, y: INT, width: INT, height: INT): Status {
    return Gdiplus.Load('GdipFillRectangleI')(graphics, brush, x, y, width, height);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipfillrectangles
  public static GdipFillRectangles(graphics: GpGraphics, brush: GpBrush, rects: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipFillRectangles')(graphics, brush, rects, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipfillrectanglesi
  public static GdipFillRectanglesI(graphics: GpGraphics, brush: GpBrush, rects: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipFillRectanglesI')(graphics, brush, rects, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipfillregion
  public static GdipFillRegion(graphics: GpGraphics, brush: GpBrush, region: GpRegion): Status {
    return Gdiplus.Load('GdipFillRegion')(graphics, brush, region);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipfindfirstimageitem
  public static GdipFindFirstImageItem(image: GpImage, item_out: Pointer): Status {
    return Gdiplus.Load('GdipFindFirstImageItem')(image, item_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipfindnextimageitem
  public static GdipFindNextImageItem(image: GpImage, item_out: Pointer): Status {
    return Gdiplus.Load('GdipFindNextImageItem')(image, item_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipflattenpath
  public static GdipFlattenPath(path: GpPath, matrix: GpMatrix, flatness: REAL): Status {
    return Gdiplus.Load('GdipFlattenPath')(path, matrix, flatness);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipflush
  public static GdipFlush(graphics: GpGraphics, intention: FlushIntention): Status {
    return Gdiplus.Load('GdipFlush')(graphics, intention);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipfree
  public static GdipFree(ptr: LPVOID): void {
    return Gdiplus.Load('GdipFree')(ptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetadjustablearrowcapfillstate
  public static GdipGetAdjustableArrowCapFillState(cap: GpAdjustableArrowCap, fillState_out: LPBOOL): Status {
    return Gdiplus.Load('GdipGetAdjustableArrowCapFillState')(cap, fillState_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetadjustablearrowcapheight
  public static GdipGetAdjustableArrowCapHeight(cap: GpAdjustableArrowCap, height_out: LPREAL): Status {
    return Gdiplus.Load('GdipGetAdjustableArrowCapHeight')(cap, height_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetadjustablearrowcapmiddleinset
  public static GdipGetAdjustableArrowCapMiddleInset(cap: GpAdjustableArrowCap, middleInset_out: LPREAL): Status {
    return Gdiplus.Load('GdipGetAdjustableArrowCapMiddleInset')(cap, middleInset_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetadjustablearrowcapwidth
  public static GdipGetAdjustableArrowCapWidth(cap: GpAdjustableArrowCap, width_out: LPREAL): Status {
    return Gdiplus.Load('GdipGetAdjustableArrowCapWidth')(cap, width_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetallpropertyitems
  public static GdipGetAllPropertyItems(image: GpImage, totalBufferSize: UINT, numProperties: UINT, allItems_out: Pointer): Status {
    return Gdiplus.Load('GdipGetAllPropertyItems')(image, totalBufferSize, numProperties, allItems_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetbrushtype
  public static GdipGetBrushType(brush: GpBrush, type_out: LPVOID): Status {
    return Gdiplus.Load('GdipGetBrushType')(brush, type_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetcellascent
  public static GdipGetCellAscent(family: GpFontFamily, style: INT, CellAscent_out: LPUINT16): Status {
    return Gdiplus.Load('GdipGetCellAscent')(family, style, CellAscent_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetcelldescent
  public static GdipGetCellDescent(family: GpFontFamily, style: INT, CellDescent_out: LPUINT16): Status {
    return Gdiplus.Load('GdipGetCellDescent')(family, style, CellDescent_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetclip
  public static GdipGetClip(graphics: GpGraphics, region: GpRegion): Status {
    return Gdiplus.Load('GdipGetClip')(graphics, region);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetclipbounds
  public static GdipGetClipBounds(graphics: GpGraphics, rect_out: Pointer): Status {
    return Gdiplus.Load('GdipGetClipBounds')(graphics, rect_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetclipboundsi
  public static GdipGetClipBoundsI(graphics: GpGraphics, rect_out: Pointer): Status {
    return Gdiplus.Load('GdipGetClipBoundsI')(graphics, rect_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetcompositingmode
  public static GdipGetCompositingMode(graphics: GpGraphics, compositingMode_out: Pointer): Status {
    return Gdiplus.Load('GdipGetCompositingMode')(graphics, compositingMode_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetcompositingquality
  public static GdipGetCompositingQuality(graphics: GpGraphics, compositingQuality_out: Pointer): Status {
    return Gdiplus.Load('GdipGetCompositingQuality')(graphics, compositingQuality_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetcustomlinecapbasecap
  public static GdipGetCustomLineCapBaseCap(customCap: GpCustomLineCap, baseCap_out: Pointer): Status {
    return Gdiplus.Load('GdipGetCustomLineCapBaseCap')(customCap, baseCap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetcustomlinecapbaseinset
  public static GdipGetCustomLineCapBaseInset(customCap: GpCustomLineCap, inset_out: LPREAL): Status {
    return Gdiplus.Load('GdipGetCustomLineCapBaseInset')(customCap, inset_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetcustomlinecapstrokecaps
  public static GdipGetCustomLineCapStrokeCaps(customCap: GpCustomLineCap, startCap_out: Pointer, endCap_out: Pointer): Status {
    return Gdiplus.Load('GdipGetCustomLineCapStrokeCaps')(customCap, startCap_out, endCap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetcustomlinecapstrokejoin
  public static GdipGetCustomLineCapStrokeJoin(customCap: GpCustomLineCap, lineJoin_out: Pointer): Status {
    return Gdiplus.Load('GdipGetCustomLineCapStrokeJoin')(customCap, lineJoin_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetcustomlinecaptype
  public static GdipGetCustomLineCapType(customCap: GpCustomLineCap, capType_out: Pointer): Status {
    return Gdiplus.Load('GdipGetCustomLineCapType')(customCap, capType_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetcustomlinecapwidthscale
  public static GdipGetCustomLineCapWidthScale(customCap: GpCustomLineCap, widthScale_out: LPREAL): Status {
    return Gdiplus.Load('GdipGetCustomLineCapWidthScale')(customCap, widthScale_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetdc
  public static GdipGetDC(graphics: GpGraphics, hdc_out: Pointer): Status {
    return Gdiplus.Load('GdipGetDC')(graphics, hdc_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetdpix
  public static GdipGetDpiX(graphics: GpGraphics, dpi_out: LPREAL): Status {
    return Gdiplus.Load('GdipGetDpiX')(graphics, dpi_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetdpiy
  public static GdipGetDpiY(graphics: GpGraphics, dpi_out: LPREAL): Status {
    return Gdiplus.Load('GdipGetDpiY')(graphics, dpi_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgeteffectparametersize
  public static GdipGetEffectParameterSize(effect: CGpEffect, size_out: LPUINT): Status {
    return Gdiplus.Load('GdipGetEffectParameterSize')(effect, size_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgeteffectparameters
  public static GdipGetEffectParameters(effect: CGpEffect, size: LPUINT, params_out: LPVOID): Status {
    return Gdiplus.Load('GdipGetEffectParameters')(effect, size, params_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetemheight
  public static GdipGetEmHeight(family: GpFontFamily, style: INT, EmHeight_out: LPUINT16): Status {
    return Gdiplus.Load('GdipGetEmHeight')(family, style, EmHeight_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetencoderparameterlist
  public static GdipGetEncoderParameterList(image: GpImage, clsidEncoder: Pointer, size: UINT, buffer_out: Pointer): Status {
    return Gdiplus.Load('GdipGetEncoderParameterList')(image, clsidEncoder, size, buffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetencoderparameterlistsize
  public static GdipGetEncoderParameterListSize(image: GpImage, clsidEncoder: Pointer, size_out: LPUINT): Status {
    return Gdiplus.Load('GdipGetEncoderParameterListSize')(image, clsidEncoder, size_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetfamily
  public static GdipGetFamily(font: GpFont, family_out: Pointer): Status {
    return Gdiplus.Load('GdipGetFamily')(font, family_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetfamilyname
  public static GdipGetFamilyName(family: GpFontFamily, name_out: LPWSTR, language: LANGID): Status {
    return Gdiplus.Load('GdipGetFamilyName')(family, name_out, language);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetfontcollectionfamilycount
  public static GdipGetFontCollectionFamilyCount(fontCollection: GpFontCollection, numFound_out: LPINT): Status {
    return Gdiplus.Load('GdipGetFontCollectionFamilyCount')(fontCollection, numFound_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetfontcollectionfamilylist
  public static GdipGetFontCollectionFamilyList(fontCollection: GpFontCollection, numSought: INT, gpfamilies_out: GpFontFamily, numFound_out: LPINT): Status {
    return Gdiplus.Load('GdipGetFontCollectionFamilyList')(fontCollection, numSought, gpfamilies_out, numFound_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetfontheight
  public static GdipGetFontHeight(font: GpFont, graphics: GpGraphics, height_out: LPREAL): Status {
    return Gdiplus.Load('GdipGetFontHeight')(font, graphics, height_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetfontheightgivendpi
  public static GdipGetFontHeightGivenDPI(font: GpFont, dpi: REAL, height_out: LPREAL): Status {
    return Gdiplus.Load('GdipGetFontHeightGivenDPI')(font, dpi, height_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetfontsize
  public static GdipGetFontSize(font: GpFont, size_out: LPREAL): Status {
    return Gdiplus.Load('GdipGetFontSize')(font, size_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetfontstyle
  public static GdipGetFontStyle(font: GpFont, style_out: LPINT): Status {
    return Gdiplus.Load('GdipGetFontStyle')(font, style_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetfontunit
  public static GdipGetFontUnit(font: GpFont, unit_out: Pointer): Status {
    return Gdiplus.Load('GdipGetFontUnit')(font, unit_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetgenericfontfamilymonospace
  public static GdipGetGenericFontFamilyMonospace(nativeFamily_out: Pointer): Status {
    return Gdiplus.Load('GdipGetGenericFontFamilyMonospace')(nativeFamily_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetgenericfontfamilysansserif
  public static GdipGetGenericFontFamilySansSerif(nativeFamily_out: Pointer): Status {
    return Gdiplus.Load('GdipGetGenericFontFamilySansSerif')(nativeFamily_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetgenericfontfamilyserif
  public static GdipGetGenericFontFamilySerif(nativeFamily_out: Pointer): Status {
    return Gdiplus.Load('GdipGetGenericFontFamilySerif')(nativeFamily_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgethatchbackgroundcolor
  public static GdipGetHatchBackgroundColor(brush: GpHatch, backcol_out: LPARGB): Status {
    return Gdiplus.Load('GdipGetHatchBackgroundColor')(brush, backcol_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgethatchforegroundcolor
  public static GdipGetHatchForegroundColor(brush: GpHatch, forecol_out: LPARGB): Status {
    return Gdiplus.Load('GdipGetHatchForegroundColor')(brush, forecol_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgethatchstyle
  public static GdipGetHatchStyle(brush: GpHatch, hatchstyle_out: Pointer): Status {
    return Gdiplus.Load('GdipGetHatchStyle')(brush, hatchstyle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgethemffrommetafile
  public static GdipGetHemfFromMetafile(metafile: GpMetafile, hEmf_out: Pointer): Status {
    return Gdiplus.Load('GdipGetHemfFromMetafile')(metafile, hEmf_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetimageattributesadjustedpalette
  public static GdipGetImageAttributesAdjustedPalette(imageAttr: GpImageAttributes, colorPalette_in_out: Pointer, colorAdjustType: ColorAdjustType): Status {
    return Gdiplus.Load('GdipGetImageAttributesAdjustedPalette')(imageAttr, colorPalette_in_out, colorAdjustType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetimagebounds
  public static GdipGetImageBounds(image: GpImage, srcRect_out: Pointer, srcUnit_out: Pointer): Status {
    return Gdiplus.Load('GdipGetImageBounds')(image, srcRect_out, srcUnit_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetimagedecoders
  public static GdipGetImageDecoders(numDecoders: UINT, size: UINT, decoders_out: Pointer): Status {
    return Gdiplus.Load('GdipGetImageDecoders')(numDecoders, size, decoders_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetimagedecoderssize
  public static GdipGetImageDecodersSize(numDecoders_out: LPUINT, size_out: LPVOID): Status {
    return Gdiplus.Load('GdipGetImageDecodersSize')(numDecoders_out, size_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetimagedimension
  public static GdipGetImageDimension(image: GpImage, width_out: LPREAL, height_out: LPREAL): Status {
    return Gdiplus.Load('GdipGetImageDimension')(image, width_out, height_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetimageencoders
  public static GdipGetImageEncoders(numEncoders: UINT, size: UINT, encoders_out: Pointer): Status {
    return Gdiplus.Load('GdipGetImageEncoders')(numEncoders, size, encoders_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetimageencoderssize
  public static GdipGetImageEncodersSize(numEncoders_out: LPUINT, size_out: LPVOID): Status {
    return Gdiplus.Load('GdipGetImageEncodersSize')(numEncoders_out, size_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetimageflags
  public static GdipGetImageFlags(image: GpImage, flags_out: LPUINT): Status {
    return Gdiplus.Load('GdipGetImageFlags')(image, flags_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetimagegraphicscontext
  public static GdipGetImageGraphicsContext(image: GpImage, graphics_out: Pointer): Status {
    return Gdiplus.Load('GdipGetImageGraphicsContext')(image, graphics_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetimageheight
  public static GdipGetImageHeight(image: GpImage, height_out: LPUINT): Status {
    return Gdiplus.Load('GdipGetImageHeight')(image, height_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetimagehorizontalresolution
  public static GdipGetImageHorizontalResolution(image: GpImage, resolution_out: LPREAL): Status {
    return Gdiplus.Load('GdipGetImageHorizontalResolution')(image, resolution_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetimageitemdata
  public static GdipGetImageItemData(image: GpImage, item_out: Pointer): Status {
    return Gdiplus.Load('GdipGetImageItemData')(image, item_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetimagepalette
  public static GdipGetImagePalette(image: GpImage, palette_out: Pointer, size: INT): Status {
    return Gdiplus.Load('GdipGetImagePalette')(image, palette_out, size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetimagepalettesize
  public static GdipGetImagePaletteSize(image: GpImage, size_out: LPINT): Status {
    return Gdiplus.Load('GdipGetImagePaletteSize')(image, size_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetimagepixelformat
  public static GdipGetImagePixelFormat(image: GpImage, format_out: Pointer): Status {
    return Gdiplus.Load('GdipGetImagePixelFormat')(image, format_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetimagerawformat
  public static GdipGetImageRawFormat(image: GpImage, format_out: Pointer): Status {
    return Gdiplus.Load('GdipGetImageRawFormat')(image, format_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetimagethumbnail
  public static GdipGetImageThumbnail(image: GpImage, thumbWidth: UINT, thumbHeight: UINT, thumbImage_out: Pointer, callback: Pointer, callbackData: LPVOID): Status {
    return Gdiplus.Load('GdipGetImageThumbnail')(image, thumbWidth, thumbHeight, thumbImage_out, callback, callbackData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetimagetype
  public static GdipGetImageType(image: GpImage, type_out: Pointer): Status {
    return Gdiplus.Load('GdipGetImageType')(image, type_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetimageverticalresolution
  public static GdipGetImageVerticalResolution(image: GpImage, resolution_out: LPREAL): Status {
    return Gdiplus.Load('GdipGetImageVerticalResolution')(image, resolution_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetimagewidth
  public static GdipGetImageWidth(image: GpImage, width_out: LPUINT): Status {
    return Gdiplus.Load('GdipGetImageWidth')(image, width_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetinterpolationmode
  public static GdipGetInterpolationMode(graphics: GpGraphics, interpolationMode_out: Pointer): Status {
    return Gdiplus.Load('GdipGetInterpolationMode')(graphics, interpolationMode_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetlineblend
  public static GdipGetLineBlend(brush: GpLineGradient, blend_out: LPREAL, positions_out: LPREAL, count: INT): Status {
    return Gdiplus.Load('GdipGetLineBlend')(brush, blend_out, positions_out, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetlineblendcount
  public static GdipGetLineBlendCount(brush: GpLineGradient, count_out: LPINT): Status {
    return Gdiplus.Load('GdipGetLineBlendCount')(brush, count_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetlinecolors
  public static GdipGetLineColors(brush: GpLineGradient, colors_out: LPARGB): Status {
    return Gdiplus.Load('GdipGetLineColors')(brush, colors_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetlinegammacorrection
  public static GdipGetLineGammaCorrection(brush: GpLineGradient, useGammaCorrection_out: LPBOOL): Status {
    return Gdiplus.Load('GdipGetLineGammaCorrection')(brush, useGammaCorrection_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetlinepresetblend
  public static GdipGetLinePresetBlend(brush: GpLineGradient, blend_out: LPARGB, positions_out: LPREAL, count: INT): Status {
    return Gdiplus.Load('GdipGetLinePresetBlend')(brush, blend_out, positions_out, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetlinepresetblendcount
  public static GdipGetLinePresetBlendCount(brush: GpLineGradient, count_out: LPINT): Status {
    return Gdiplus.Load('GdipGetLinePresetBlendCount')(brush, count_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetlinerect
  public static GdipGetLineRect(brush: GpLineGradient, rect_out: Pointer): Status {
    return Gdiplus.Load('GdipGetLineRect')(brush, rect_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetlinerecti
  public static GdipGetLineRectI(brush: GpLineGradient, rect_out: Pointer): Status {
    return Gdiplus.Load('GdipGetLineRectI')(brush, rect_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetlinespacing
  public static GdipGetLineSpacing(family: GpFontFamily, style: INT, LineSpacing_out: LPUINT16): Status {
    return Gdiplus.Load('GdipGetLineSpacing')(family, style, LineSpacing_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetlinetransform
  public static GdipGetLineTransform(brush: GpLineGradient, matrix: GpMatrix): Status {
    return Gdiplus.Load('GdipGetLineTransform')(brush, matrix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetlinewrapmode
  public static GdipGetLineWrapMode(brush: GpLineGradient, wrapmode_out: Pointer): Status {
    return Gdiplus.Load('GdipGetLineWrapMode')(brush, wrapmode_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetlogfonta
  public static GdipGetLogFontA(font: GpFont, graphics: GpGraphics, logfontA_out: Pointer): Status {
    return Gdiplus.Load('GdipGetLogFontA')(font, graphics, logfontA_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetlogfontw
  public static GdipGetLogFontW(font: GpFont, graphics: GpGraphics, logfontW_out: Pointer): Status {
    return Gdiplus.Load('GdipGetLogFontW')(font, graphics, logfontW_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetmatrixelements
  public static GdipGetMatrixElements(matrix: GpMatrix, matrixOut_out: LPREAL): Status {
    return Gdiplus.Load('GdipGetMatrixElements')(matrix, matrixOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetmetafiledownlevelrasterizationlimit
  public static GdipGetMetafileDownLevelRasterizationLimit(metafile: GpMetafile, metafileRasterizationLimitDpi_out: LPUINT): Status {
    return Gdiplus.Load('GdipGetMetafileDownLevelRasterizationLimit')(metafile, metafileRasterizationLimitDpi_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetmetafileheaderfromemf
  public static GdipGetMetafileHeaderFromEmf(hEmf: HENHMETAFILE, header_out: Pointer): Status {
    return Gdiplus.Load('GdipGetMetafileHeaderFromEmf')(hEmf, header_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetmetafileheaderfromfile
  public static GdipGetMetafileHeaderFromFile(filename: LPWSTR, header_out: Pointer): Status {
    return Gdiplus.Load('GdipGetMetafileHeaderFromFile')(filename, header_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetmetafileheaderfrommetafile
  public static GdipGetMetafileHeaderFromMetafile(metafile: GpMetafile, header_out: Pointer): Status {
    return Gdiplus.Load('GdipGetMetafileHeaderFromMetafile')(metafile, header_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetmetafileheaderfromstream
  public static GdipGetMetafileHeaderFromStream(stream: IStream, header_out: Pointer): Status {
    return Gdiplus.Load('GdipGetMetafileHeaderFromStream')(stream, header_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetmetafileheaderfromwmf
  public static GdipGetMetafileHeaderFromWmf(hWmf: HMETAFILE, wmfPlaceableFileHeader: Pointer, header_out: Pointer): Status {
    return Gdiplus.Load('GdipGetMetafileHeaderFromWmf')(hWmf, wmfPlaceableFileHeader, header_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetnearestcolor
  public static GdipGetNearestColor(graphics: GpGraphics, argb_out: LPARGB): Status {
    return Gdiplus.Load('GdipGetNearestColor')(graphics, argb_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpagescale
  public static GdipGetPageScale(graphics: GpGraphics, scale_out: LPREAL): Status {
    return Gdiplus.Load('GdipGetPageScale')(graphics, scale_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpageunit
  public static GdipGetPageUnit(graphics: GpGraphics, unit_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPageUnit')(graphics, unit_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathdata
  public static GdipGetPathData(path: GpPath, pathData_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPathData')(path, pathData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathfillmode
  public static GdipGetPathFillMode(path: GpPath, fillmode_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPathFillMode')(path, fillmode_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathgradientblend
  public static GdipGetPathGradientBlend(brush: GpPathGradient, blend_out: LPREAL, positions_out: LPREAL, count: INT): Status {
    return Gdiplus.Load('GdipGetPathGradientBlend')(brush, blend_out, positions_out, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathgradientblendcount
  public static GdipGetPathGradientBlendCount(brush: GpPathGradient, count_out: LPINT): Status {
    return Gdiplus.Load('GdipGetPathGradientBlendCount')(brush, count_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathgradientcentercolor
  public static GdipGetPathGradientCenterColor(brush: GpPathGradient, colors_out: LPARGB): Status {
    return Gdiplus.Load('GdipGetPathGradientCenterColor')(brush, colors_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathgradientcenterpoint
  public static GdipGetPathGradientCenterPoint(brush: GpPathGradient, points_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPathGradientCenterPoint')(brush, points_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathgradientcenterpointi
  public static GdipGetPathGradientCenterPointI(brush: GpPathGradient, points_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPathGradientCenterPointI')(brush, points_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathgradientfocusscales
  public static GdipGetPathGradientFocusScales(brush: GpPathGradient, xScale_out: LPREAL, yScale_out: LPREAL): Status {
    return Gdiplus.Load('GdipGetPathGradientFocusScales')(brush, xScale_out, yScale_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathgradientgammacorrection
  public static GdipGetPathGradientGammaCorrection(brush: GpPathGradient, useGammaCorrection_out: LPBOOL): Status {
    return Gdiplus.Load('GdipGetPathGradientGammaCorrection')(brush, useGammaCorrection_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathgradientpath
  public static GdipGetPathGradientPath(brush: GpPathGradient, path: GpPath): Status {
    return Gdiplus.Load('GdipGetPathGradientPath')(brush, path);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathgradientpointcount
  public static GdipGetPathGradientPointCount(brush: GpPathGradient, count_out: LPINT): Status {
    return Gdiplus.Load('GdipGetPathGradientPointCount')(brush, count_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathgradientpresetblend
  public static GdipGetPathGradientPresetBlend(brush: GpPathGradient, blend_out: LPARGB, positions_out: LPREAL, count: INT): Status {
    return Gdiplus.Load('GdipGetPathGradientPresetBlend')(brush, blend_out, positions_out, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathgradientpresetblendcount
  public static GdipGetPathGradientPresetBlendCount(brush: GpPathGradient, count_out: LPINT): Status {
    return Gdiplus.Load('GdipGetPathGradientPresetBlendCount')(brush, count_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathgradientrect
  public static GdipGetPathGradientRect(brush: GpPathGradient, rect_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPathGradientRect')(brush, rect_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathgradientrecti
  public static GdipGetPathGradientRectI(brush: GpPathGradient, rect_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPathGradientRectI')(brush, rect_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathgradientsurroundcolorcount
  public static GdipGetPathGradientSurroundColorCount(brush: GpPathGradient, count_out: LPINT): Status {
    return Gdiplus.Load('GdipGetPathGradientSurroundColorCount')(brush, count_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathgradientsurroundcolorswithcount
  public static GdipGetPathGradientSurroundColorsWithCount(brush: GpPathGradient, color_out: LPARGB, count_in_out: LPINT): Status {
    return Gdiplus.Load('GdipGetPathGradientSurroundColorsWithCount')(brush, color_out, count_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathgradienttransform
  public static GdipGetPathGradientTransform(brush: GpPathGradient, matrix: GpMatrix): Status {
    return Gdiplus.Load('GdipGetPathGradientTransform')(brush, matrix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathgradientwrapmode
  public static GdipGetPathGradientWrapMode(brush: GpPathGradient, wrapmode_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPathGradientWrapMode')(brush, wrapmode_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathlastpoint
  public static GdipGetPathLastPoint(path: GpPath, lastPoint_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPathLastPoint')(path, lastPoint_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathpoints
  public static GdipGetPathPoints(path: GpPath, points_out: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipGetPathPoints')(path, points_out, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathpointsi
  public static GdipGetPathPointsI(path: GpPath, points_out: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipGetPathPointsI')(path, points_out, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathtypes
  public static GdipGetPathTypes(path: GpPath, types_out: LPBYTE, count: INT): Status {
    return Gdiplus.Load('GdipGetPathTypes')(path, types_out, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathworldbounds
  public static GdipGetPathWorldBounds(path: GpPath, bounds_out: Pointer, matrix: GpMatrix, pen: GpPen): Status {
    return Gdiplus.Load('GdipGetPathWorldBounds')(path, bounds_out, matrix, pen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpathworldboundsi
  public static GdipGetPathWorldBoundsI(path: GpPath, bounds_out: Pointer, matrix: GpMatrix, pen: GpPen): Status {
    return Gdiplus.Load('GdipGetPathWorldBoundsI')(path, bounds_out, matrix, pen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpenbrushfill
  public static GdipGetPenBrushFill(pen: GpPen, brush_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPenBrushFill')(pen, brush_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpencolor
  public static GdipGetPenColor(pen: GpPen, argb_out: LPARGB): Status {
    return Gdiplus.Load('GdipGetPenColor')(pen, argb_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpencompoundarray
  public static GdipGetPenCompoundArray(pen: GpPen, dash_out: LPREAL, count: INT): Status {
    return Gdiplus.Load('GdipGetPenCompoundArray')(pen, dash_out, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpencompoundcount
  public static GdipGetPenCompoundCount(pen: GpPen, count_out: LPINT): Status {
    return Gdiplus.Load('GdipGetPenCompoundCount')(pen, count_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpencustomendcap
  public static GdipGetPenCustomEndCap(pen: GpPen, customCap_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPenCustomEndCap')(pen, customCap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpencustomstartcap
  public static GdipGetPenCustomStartCap(pen: GpPen, customCap_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPenCustomStartCap')(pen, customCap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpendasharray
  public static GdipGetPenDashArray(pen: GpPen, dash_out: LPREAL, count: INT): Status {
    return Gdiplus.Load('GdipGetPenDashArray')(pen, dash_out, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpendashcap197819
  public static GdipGetPenDashCap197819(pen: GpPen, dashCap_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPenDashCap197819')(pen, dashCap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpendashcount
  public static GdipGetPenDashCount(pen: GpPen, count_out: LPINT): Status {
    return Gdiplus.Load('GdipGetPenDashCount')(pen, count_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpendashoffset
  public static GdipGetPenDashOffset(pen: GpPen, offset_out: LPREAL): Status {
    return Gdiplus.Load('GdipGetPenDashOffset')(pen, offset_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpendashstyle
  public static GdipGetPenDashStyle(pen: GpPen, dashstyle_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPenDashStyle')(pen, dashstyle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpenendcap
  public static GdipGetPenEndCap(pen: GpPen, endCap_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPenEndCap')(pen, endCap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpenfilltype
  public static GdipGetPenFillType(pen: GpPen, type_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPenFillType')(pen, type_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpenlinejoin
  public static GdipGetPenLineJoin(pen: GpPen, lineJoin_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPenLineJoin')(pen, lineJoin_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpenmiterlimit
  public static GdipGetPenMiterLimit(pen: GpPen, miterLimit_out: LPREAL): Status {
    return Gdiplus.Load('GdipGetPenMiterLimit')(pen, miterLimit_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpenmode
  public static GdipGetPenMode(pen: GpPen, penMode_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPenMode')(pen, penMode_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpenstartcap
  public static GdipGetPenStartCap(pen: GpPen, startCap_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPenStartCap')(pen, startCap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpentransform
  public static GdipGetPenTransform(pen: GpPen, matrix: GpMatrix): Status {
    return Gdiplus.Load('GdipGetPenTransform')(pen, matrix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpenunit
  public static GdipGetPenUnit(pen: GpPen, unit_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPenUnit')(pen, unit_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpenwidth
  public static GdipGetPenWidth(pen: GpPen, width_out: LPREAL): Status {
    return Gdiplus.Load('GdipGetPenWidth')(pen, width_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpixeloffsetmode
  public static GdipGetPixelOffsetMode(graphics: GpGraphics, pixelOffsetMode_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPixelOffsetMode')(graphics, pixelOffsetMode_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpointcount
  public static GdipGetPointCount(path: GpPath, count_out: LPINT): Status {
    return Gdiplus.Load('GdipGetPointCount')(path, count_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpropertycount
  public static GdipGetPropertyCount(image: GpImage, numOfProperty_out: LPUINT): Status {
    return Gdiplus.Load('GdipGetPropertyCount')(image, numOfProperty_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpropertyidlist
  public static GdipGetPropertyIdList(image: GpImage, numOfProperty: UINT, list_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPropertyIdList')(image, numOfProperty, list_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpropertyitem
  public static GdipGetPropertyItem(image: GpImage, propId: PROPID, propSize: UINT, buffer_out: Pointer): Status {
    return Gdiplus.Load('GdipGetPropertyItem')(image, propId, propSize, buffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpropertyitemsize
  public static GdipGetPropertyItemSize(image: GpImage, propId: PROPID, size_out: LPUINT): Status {
    return Gdiplus.Load('GdipGetPropertyItemSize')(image, propId, size_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetpropertysize
  public static GdipGetPropertySize(image: GpImage, totalBufferSize_out: LPUINT, numProperties_out: LPUINT): Status {
    return Gdiplus.Load('GdipGetPropertySize')(image, totalBufferSize_out, numProperties_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetregionbounds
  public static GdipGetRegionBounds(region: GpRegion, graphics: GpGraphics, rect_out: Pointer): Status {
    return Gdiplus.Load('GdipGetRegionBounds')(region, graphics, rect_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetregionboundsi
  public static GdipGetRegionBoundsI(region: GpRegion, graphics: GpGraphics, rect_out: Pointer): Status {
    return Gdiplus.Load('GdipGetRegionBoundsI')(region, graphics, rect_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetregiondata
  public static GdipGetRegionData(region: GpRegion, buffer_out: LPBYTE, bufferSize: UINT, sizeFilled_out: OPTIONAL<LPUINT>): Status {
    return Gdiplus.Load('GdipGetRegionData')(region, buffer_out, bufferSize, sizeFilled_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetregiondatasize
  public static GdipGetRegionDataSize(region: GpRegion, bufferSize_out: LPUINT): Status {
    return Gdiplus.Load('GdipGetRegionDataSize')(region, bufferSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetregionhrgn
  public static GdipGetRegionHRgn(region: GpRegion, graphics: GpGraphics, hRgn_out: Pointer): Status {
    return Gdiplus.Load('GdipGetRegionHRgn')(region, graphics, hRgn_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetregionscans
  public static GdipGetRegionScans(region: GpRegion, rects_out: Pointer, count_out: LPINT, matrix: GpMatrix): Status {
    return Gdiplus.Load('GdipGetRegionScans')(region, rects_out, count_out, matrix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetregionscanscount
  public static GdipGetRegionScansCount(region: GpRegion, count_out: LPUINT, matrix: GpMatrix): Status {
    return Gdiplus.Load('GdipGetRegionScansCount')(region, count_out, matrix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetregionscansi
  public static GdipGetRegionScansI(region: GpRegion, rects_out: Pointer, count_out: LPINT, matrix: GpMatrix): Status {
    return Gdiplus.Load('GdipGetRegionScansI')(region, rects_out, count_out, matrix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetrenderingorigin
  public static GdipGetRenderingOrigin(graphics: GpGraphics, x_out: LPINT, y_out: LPINT): Status {
    return Gdiplus.Load('GdipGetRenderingOrigin')(graphics, x_out, y_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetsmoothingmode
  public static GdipGetSmoothingMode(graphics: GpGraphics, smoothingMode_out: Pointer): Status {
    return Gdiplus.Load('GdipGetSmoothingMode')(graphics, smoothingMode_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetsolidfillcolor
  public static GdipGetSolidFillColor(brush: GpSolidFill, color_out: LPARGB): Status {
    return Gdiplus.Load('GdipGetSolidFillColor')(brush, color_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetstringformatalign
  public static GdipGetStringFormatAlign(format: GpStringFormat, align_out: Pointer): Status {
    return Gdiplus.Load('GdipGetStringFormatAlign')(format, align_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetstringformatdigitsubstitution
  public static GdipGetStringFormatDigitSubstitution(format: GpStringFormat, language_out: LPLANGID, substitute_out: Pointer): Status {
    return Gdiplus.Load('GdipGetStringFormatDigitSubstitution')(format, language_out, substitute_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetstringformatflags
  public static GdipGetStringFormatFlags(format: GpStringFormat, flags_out: LPINT): Status {
    return Gdiplus.Load('GdipGetStringFormatFlags')(format, flags_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetstringformathotkeyprefix
  public static GdipGetStringFormatHotkeyPrefix(format: GpStringFormat, hotkeyPrefix_out: LPINT): Status {
    return Gdiplus.Load('GdipGetStringFormatHotkeyPrefix')(format, hotkeyPrefix_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetstringformatlinealign
  public static GdipGetStringFormatLineAlign(format: GpStringFormat, align_out: Pointer): Status {
    return Gdiplus.Load('GdipGetStringFormatLineAlign')(format, align_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetstringformatmeasurablecharacterrangecount
  public static GdipGetStringFormatMeasurableCharacterRangeCount(format: GpStringFormat, count_out: LPINT): Status {
    return Gdiplus.Load('GdipGetStringFormatMeasurableCharacterRangeCount')(format, count_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetstringformattabstopcount
  public static GdipGetStringFormatTabStopCount(format: GpStringFormat, count_out: LPINT): Status {
    return Gdiplus.Load('GdipGetStringFormatTabStopCount')(format, count_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetstringformattabstops
  public static GdipGetStringFormatTabStops(format: GpStringFormat, count: INT, firstTabOffset_out: LPREAL, tabStops_out: LPREAL): Status {
    return Gdiplus.Load('GdipGetStringFormatTabStops')(format, count, firstTabOffset_out, tabStops_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetstringformattrimming
  public static GdipGetStringFormatTrimming(format: GpStringFormat, trimming_out: Pointer): Status {
    return Gdiplus.Load('GdipGetStringFormatTrimming')(format, trimming_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgettextcontrast
  public static GdipGetTextContrast(graphics: GpGraphics, contrast_out: LPUINT): Status {
    return Gdiplus.Load('GdipGetTextContrast')(graphics, contrast_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgettextrenderinghint
  public static GdipGetTextRenderingHint(graphics: GpGraphics, mode_out: Pointer): Status {
    return Gdiplus.Load('GdipGetTextRenderingHint')(graphics, mode_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgettextureimage
  public static GdipGetTextureImage(brush: GpTexture, image_out: Pointer): Status {
    return Gdiplus.Load('GdipGetTextureImage')(brush, image_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgettexturetransform
  public static GdipGetTextureTransform(brush: GpTexture, matrix: GpMatrix): Status {
    return Gdiplus.Load('GdipGetTextureTransform')(brush, matrix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgettexturewrapmode
  public static GdipGetTextureWrapMode(brush: GpTexture, wrapmode_out: Pointer): Status {
    return Gdiplus.Load('GdipGetTextureWrapMode')(brush, wrapmode_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetvisibleclipbounds
  public static GdipGetVisibleClipBounds(graphics: GpGraphics, rect_out: Pointer): Status {
    return Gdiplus.Load('GdipGetVisibleClipBounds')(graphics, rect_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetvisibleclipboundsi
  public static GdipGetVisibleClipBoundsI(graphics: GpGraphics, rect_out: Pointer): Status {
    return Gdiplus.Load('GdipGetVisibleClipBoundsI')(graphics, rect_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgetworldtransform
  public static GdipGetWorldTransform(graphics: GpGraphics, matrix: GpMatrix): Status {
    return Gdiplus.Load('GdipGetWorldTransform')(graphics, matrix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgraphicsclear
  public static GdipGraphicsClear(graphics: GpGraphics, color: ARGB): Status {
    return Gdiplus.Load('GdipGraphicsClear')(graphics, color);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipgraphicssetabort
  public static GdipGraphicsSetAbort(pGraphics: GpGraphics, pIAbort: Pointer): Status {
    return Gdiplus.Load('GdipGraphicsSetAbort')(pGraphics, pIAbort);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipimageforcevalidation
  public static GdipImageForceValidation(image: GpImage): Status {
    return Gdiplus.Load('GdipImageForceValidation')(image);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipimagegetframecount
  public static GdipImageGetFrameCount(image: GpImage, dimensionID: Pointer, count_out: LPUINT): Status {
    return Gdiplus.Load('GdipImageGetFrameCount')(image, dimensionID, count_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipimagegetframedimensionscount
  public static GdipImageGetFrameDimensionsCount(image: GpImage, count_out: LPUINT): Status {
    return Gdiplus.Load('GdipImageGetFrameDimensionsCount')(image, count_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipimagegetframedimensionslist
  public static GdipImageGetFrameDimensionsList(image: GpImage, dimensionIDs_out: Pointer, count: UINT): Status {
    return Gdiplus.Load('GdipImageGetFrameDimensionsList')(image, dimensionIDs_out, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipimagerotateflip
  public static GdipImageRotateFlip(image: GpImage, rfType: RotateFlipType): Status {
    return Gdiplus.Load('GdipImageRotateFlip')(image, rfType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipimageselectactiveframe
  public static GdipImageSelectActiveFrame(image: GpImage, dimensionID: Pointer, frameIndex: UINT): Status {
    return Gdiplus.Load('GdipImageSelectActiveFrame')(image, dimensionID, frameIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipimagesetabort
  public static GdipImageSetAbort(pImage: GpImage, pIAbort: Pointer): Status {
    return Gdiplus.Load('GdipImageSetAbort')(pImage, pIAbort);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipinitializepalette
  public static GdipInitializePalette(palette_out: Pointer, palettetype: PaletteType, optimalColors: INT, useTransparentColor: BOOL, bitmap: NULLABLE<GpBitmap>): Status {
    return Gdiplus.Load('GdipInitializePalette')(palette_out, palettetype, optimalColors, useTransparentColor, bitmap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipinvertmatrix
  public static GdipInvertMatrix(matrix: GpMatrix): Status {
    return Gdiplus.Load('GdipInvertMatrix')(matrix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipisclipempty
  public static GdipIsClipEmpty(graphics: GpGraphics, result_out: LPBOOL): Status {
    return Gdiplus.Load('GdipIsClipEmpty')(graphics, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipisemptyregion
  public static GdipIsEmptyRegion(region: GpRegion, graphics: GpGraphics, result_out: LPBOOL): Status {
    return Gdiplus.Load('GdipIsEmptyRegion')(region, graphics, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipisequalregion
  public static GdipIsEqualRegion(region: GpRegion, region2: GpRegion, graphics: GpGraphics, result_out: LPBOOL): Status {
    return Gdiplus.Load('GdipIsEqualRegion')(region, region2, graphics, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipisinfiniteregion
  public static GdipIsInfiniteRegion(region: GpRegion, graphics: GpGraphics, result_out: LPBOOL): Status {
    return Gdiplus.Load('GdipIsInfiniteRegion')(region, graphics, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipismatrixequal
  public static GdipIsMatrixEqual(matrix: GpMatrix, matrix2: GpMatrix, result_out: LPBOOL): Status {
    return Gdiplus.Load('GdipIsMatrixEqual')(matrix, matrix2, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipismatrixidentity
  public static GdipIsMatrixIdentity(matrix: GpMatrix, result_out: LPBOOL): Status {
    return Gdiplus.Load('GdipIsMatrixIdentity')(matrix, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipismatrixinvertible
  public static GdipIsMatrixInvertible(matrix: GpMatrix, result_out: LPBOOL): Status {
    return Gdiplus.Load('GdipIsMatrixInvertible')(matrix, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipisoutlinevisiblepathpoint
  public static GdipIsOutlineVisiblePathPoint(path: GpPath, x: REAL, y: REAL, pen: GpPen, graphics: GpGraphics, result_out: LPBOOL): Status {
    return Gdiplus.Load('GdipIsOutlineVisiblePathPoint')(path, x, y, pen, graphics, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipisoutlinevisiblepathpointi
  public static GdipIsOutlineVisiblePathPointI(path: GpPath, x: INT, y: INT, pen: GpPen, graphics: GpGraphics, result_out: LPBOOL): Status {
    return Gdiplus.Load('GdipIsOutlineVisiblePathPointI')(path, x, y, pen, graphics, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipisstyleavailable
  public static GdipIsStyleAvailable(family: GpFontFamily, style: INT, IsStyleAvailable_out: LPBOOL): Status {
    return Gdiplus.Load('GdipIsStyleAvailable')(family, style, IsStyleAvailable_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipisvisibleclipempty
  public static GdipIsVisibleClipEmpty(graphics: GpGraphics, result_out: LPBOOL): Status {
    return Gdiplus.Load('GdipIsVisibleClipEmpty')(graphics, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipisvisiblepathpoint
  public static GdipIsVisiblePathPoint(path: GpPath, x: REAL, y: REAL, graphics: GpGraphics, result_out: LPBOOL): Status {
    return Gdiplus.Load('GdipIsVisiblePathPoint')(path, x, y, graphics, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipisvisiblepathpointi
  public static GdipIsVisiblePathPointI(path: GpPath, x: INT, y: INT, graphics: GpGraphics, result_out: LPBOOL): Status {
    return Gdiplus.Load('GdipIsVisiblePathPointI')(path, x, y, graphics, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipisvisiblepoint
  public static GdipIsVisiblePoint(graphics: GpGraphics, x: REAL, y: REAL, result_out: LPBOOL): Status {
    return Gdiplus.Load('GdipIsVisiblePoint')(graphics, x, y, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipisvisiblepointi
  public static GdipIsVisiblePointI(graphics: GpGraphics, x: INT, y: INT, result_out: LPBOOL): Status {
    return Gdiplus.Load('GdipIsVisiblePointI')(graphics, x, y, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipisvisiblerect
  public static GdipIsVisibleRect(graphics: GpGraphics, x: REAL, y: REAL, width: REAL, height: REAL, result_out: LPBOOL): Status {
    return Gdiplus.Load('GdipIsVisibleRect')(graphics, x, y, width, height, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipisvisiblerecti
  public static GdipIsVisibleRectI(graphics: GpGraphics, x: INT, y: INT, width: INT, height: INT, result_out: LPBOOL): Status {
    return Gdiplus.Load('GdipIsVisibleRectI')(graphics, x, y, width, height, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipisvisibleregionpoint
  public static GdipIsVisibleRegionPoint(region: GpRegion, x: REAL, y: REAL, graphics: GpGraphics, result_out: LPBOOL): Status {
    return Gdiplus.Load('GdipIsVisibleRegionPoint')(region, x, y, graphics, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipisvisibleregionpointi
  public static GdipIsVisibleRegionPointI(region: GpRegion, x: INT, y: INT, graphics: GpGraphics, result_out: LPBOOL): Status {
    return Gdiplus.Load('GdipIsVisibleRegionPointI')(region, x, y, graphics, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipisvisibleregionrect
  public static GdipIsVisibleRegionRect(region: GpRegion, x: REAL, y: REAL, width: REAL, height: REAL, graphics: GpGraphics, result_out: LPBOOL): Status {
    return Gdiplus.Load('GdipIsVisibleRegionRect')(region, x, y, width, height, graphics, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipisvisibleregionrecti
  public static GdipIsVisibleRegionRectI(region: GpRegion, x: INT, y: INT, width: INT, height: INT, graphics: GpGraphics, result_out: LPBOOL): Status {
    return Gdiplus.Load('GdipIsVisibleRegionRectI')(region, x, y, width, height, graphics, result_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiploadimagefromfile
  public static GdipLoadImageFromFile(filename: LPWSTR, image_out: Pointer): Status {
    return Gdiplus.Load('GdipLoadImageFromFile')(filename, image_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiploadimagefromfileicm
  public static GdipLoadImageFromFileICM(filename: LPWSTR, image_out: Pointer): Status {
    return Gdiplus.Load('GdipLoadImageFromFileICM')(filename, image_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiploadimagefromstream
  public static GdipLoadImageFromStream(stream: IStream, image_out: Pointer): Status {
    return Gdiplus.Load('GdipLoadImageFromStream')(stream, image_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiploadimagefromstreamicm
  public static GdipLoadImageFromStreamICM(stream: IStream, image_out: Pointer): Status {
    return Gdiplus.Load('GdipLoadImageFromStreamICM')(stream, image_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipmeasurecharacterranges
  public static GdipMeasureCharacterRanges(graphics: GpGraphics, string: LPWSTR, length: INT, font: GpFont, layoutRect: Pointer, stringFormat: GpStringFormat, regionCount: INT, regions_out: Pointer): Status {
    return Gdiplus.Load('GdipMeasureCharacterRanges')(graphics, string, length, font, layoutRect, stringFormat, regionCount, regions_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipmeasuredriverstring
  public static GdipMeasureDriverString(graphics: GpGraphics, text: LPUINT16, length: INT, font: GpFont, positions: Pointer, flags: INT, matrix: GpMatrix, boundingBox_out: Pointer): Status {
    return Gdiplus.Load('GdipMeasureDriverString')(graphics, text, length, font, positions, flags, matrix, boundingBox_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipmeasurestring
  public static GdipMeasureString(graphics: GpGraphics, string: LPWSTR, length: INT, font: GpFont, layoutRect: Pointer, stringFormat: GpStringFormat, boundingBox_out: Pointer, codepointsFitted_out: LPINT, linesFilled_out: LPINT): Status {
    return Gdiplus.Load('GdipMeasureString')(graphics, string, length, font, layoutRect, stringFormat, boundingBox_out, codepointsFitted_out, linesFilled_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipmultiplylinetransform
  public static GdipMultiplyLineTransform(brush: GpLineGradient, matrix: GpMatrix, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipMultiplyLineTransform')(brush, matrix, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipmultiplymatrix
  public static GdipMultiplyMatrix(matrix: GpMatrix, matrix2: GpMatrix, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipMultiplyMatrix')(matrix, matrix2, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipmultiplypathgradienttransform
  public static GdipMultiplyPathGradientTransform(brush: GpPathGradient, matrix: GpMatrix, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipMultiplyPathGradientTransform')(brush, matrix, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipmultiplypentransform
  public static GdipMultiplyPenTransform(pen: GpPen, matrix: GpMatrix, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipMultiplyPenTransform')(pen, matrix, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipmultiplytexturetransform
  public static GdipMultiplyTextureTransform(brush: GpTexture, matrix: GpMatrix, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipMultiplyTextureTransform')(brush, matrix, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipmultiplyworldtransform
  public static GdipMultiplyWorldTransform(graphics: GpGraphics, matrix: GpMatrix, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipMultiplyWorldTransform')(graphics, matrix, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipnewinstalledfontcollection
  public static GdipNewInstalledFontCollection(fontCollection_out: Pointer): Status {
    return Gdiplus.Load('GdipNewInstalledFontCollection')(fontCollection_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipnewprivatefontcollection
  public static GdipNewPrivateFontCollection(fontCollection_out: Pointer): Status {
    return Gdiplus.Load('GdipNewPrivateFontCollection')(fontCollection_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdippathitercopydata
  public static GdipPathIterCopyData(iterator: GpPathIterator, resultCount_out: LPINT, points_out: Pointer, types_out: LPBYTE, startIndex: INT, endIndex: INT): Status {
    return Gdiplus.Load('GdipPathIterCopyData')(iterator, resultCount_out, points_out, types_out, startIndex, endIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdippathiterenumerate
  public static GdipPathIterEnumerate(iterator: GpPathIterator, resultCount_out: LPINT, points_out: Pointer, types_out: LPBYTE, count: INT): Status {
    return Gdiplus.Load('GdipPathIterEnumerate')(iterator, resultCount_out, points_out, types_out, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdippathitergetcount
  public static GdipPathIterGetCount(iterator: GpPathIterator, count_out: LPINT): Status {
    return Gdiplus.Load('GdipPathIterGetCount')(iterator, count_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdippathitergetsubpathcount
  public static GdipPathIterGetSubpathCount(iterator: GpPathIterator, count_out: LPINT): Status {
    return Gdiplus.Load('GdipPathIterGetSubpathCount')(iterator, count_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdippathiterhascurve
  public static GdipPathIterHasCurve(iterator: GpPathIterator, hasCurve_out: LPBOOL): Status {
    return Gdiplus.Load('GdipPathIterHasCurve')(iterator, hasCurve_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdippathiterisvalid
  public static GdipPathIterIsValid(iterator: GpPathIterator, valid_out: LPBOOL): Status {
    return Gdiplus.Load('GdipPathIterIsValid')(iterator, valid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdippathiternextmarker
  public static GdipPathIterNextMarker(iterator: GpPathIterator, resultCount_out: LPINT, startIndex_out: LPINT, endIndex_out: LPINT): Status {
    return Gdiplus.Load('GdipPathIterNextMarker')(iterator, resultCount_out, startIndex_out, endIndex_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdippathiternextmarkerpath
  public static GdipPathIterNextMarkerPath(iterator: GpPathIterator, resultCount_out: LPINT, path: GpPath): Status {
    return Gdiplus.Load('GdipPathIterNextMarkerPath')(iterator, resultCount_out, path);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdippathiternextpathtype
  public static GdipPathIterNextPathType(iterator: GpPathIterator, resultCount_out: LPINT, pathType_out: LPBYTE, startIndex_out: LPINT, endIndex_out: LPINT): Status {
    return Gdiplus.Load('GdipPathIterNextPathType')(iterator, resultCount_out, pathType_out, startIndex_out, endIndex_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdippathiternextsubpath
  public static GdipPathIterNextSubpath(iterator: GpPathIterator, resultCount_out: LPINT, startIndex_out: LPINT, endIndex_out: LPINT, isClosed_out: LPBOOL): Status {
    return Gdiplus.Load('GdipPathIterNextSubpath')(iterator, resultCount_out, startIndex_out, endIndex_out, isClosed_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdippathiternextsubpathpath
  public static GdipPathIterNextSubpathPath(iterator: GpPathIterator, resultCount_out: LPINT, path: GpPath, isClosed_out: LPBOOL): Status {
    return Gdiplus.Load('GdipPathIterNextSubpathPath')(iterator, resultCount_out, path, isClosed_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdippathiterrewind
  public static GdipPathIterRewind(iterator: GpPathIterator): Status {
    return Gdiplus.Load('GdipPathIterRewind')(iterator);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipplaymetafilerecord
  public static GdipPlayMetafileRecord(metafile: GpMetafile, recordType: EmfPlusRecordType, flags: UINT, dataSize: UINT, data: LPBYTE): Status {
    return Gdiplus.Load('GdipPlayMetafileRecord')(metafile, recordType, flags, dataSize, data);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipprivateaddfontfile
  public static GdipPrivateAddFontFile(fontCollection: GpFontCollection, filename: LPWSTR): Status {
    return Gdiplus.Load('GdipPrivateAddFontFile')(fontCollection, filename);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipprivateaddmemoryfont
  public static GdipPrivateAddMemoryFont(fontCollection: GpFontCollection, memory: LPVOID, length: INT): Status {
    return Gdiplus.Load('GdipPrivateAddMemoryFont')(fontCollection, memory, length);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiprecordmetafile
  public static GdipRecordMetafile(referenceHdc: HDC, type: EmfType, frameRect: Pointer, frameUnit: MetafileFrameUnit, description: LPWSTR, metafile_out: Pointer): Status {
    return Gdiplus.Load('GdipRecordMetafile')(referenceHdc, type, frameRect, frameUnit, description, metafile_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiprecordmetafilefilename
  public static GdipRecordMetafileFileName(fileName: LPWSTR, referenceHdc: HDC, type: EmfType, frameRect: Pointer, frameUnit: MetafileFrameUnit, description: LPWSTR, metafile_out: Pointer): Status {
    return Gdiplus.Load('GdipRecordMetafileFileName')(fileName, referenceHdc, type, frameRect, frameUnit, description, metafile_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiprecordmetafilefilenamei
  public static GdipRecordMetafileFileNameI(fileName: LPWSTR, referenceHdc: HDC, type: EmfType, frameRect: Pointer, frameUnit: MetafileFrameUnit, description: LPWSTR, metafile_out: Pointer): Status {
    return Gdiplus.Load('GdipRecordMetafileFileNameI')(fileName, referenceHdc, type, frameRect, frameUnit, description, metafile_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiprecordmetafilei
  public static GdipRecordMetafileI(referenceHdc: HDC, type: EmfType, frameRect: Pointer, frameUnit: MetafileFrameUnit, description: LPWSTR, metafile_out: Pointer): Status {
    return Gdiplus.Load('GdipRecordMetafileI')(referenceHdc, type, frameRect, frameUnit, description, metafile_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiprecordmetafilestream
  public static GdipRecordMetafileStream(stream: IStream, referenceHdc: HDC, type: EmfType, frameRect: Pointer, frameUnit: MetafileFrameUnit, description: LPWSTR, metafile_out: Pointer): Status {
    return Gdiplus.Load('GdipRecordMetafileStream')(stream, referenceHdc, type, frameRect, frameUnit, description, metafile_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiprecordmetafilestreami
  public static GdipRecordMetafileStreamI(stream: IStream, referenceHdc: HDC, type: EmfType, frameRect: Pointer, frameUnit: MetafileFrameUnit, description: LPWSTR, metafile_out: Pointer): Status {
    return Gdiplus.Load('GdipRecordMetafileStreamI')(stream, referenceHdc, type, frameRect, frameUnit, description, metafile_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipreleasedc
  public static GdipReleaseDC(graphics: GpGraphics, hdc: HDC): Status {
    return Gdiplus.Load('GdipReleaseDC')(graphics, hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipremovepropertyitem
  public static GdipRemovePropertyItem(image: GpImage, propId: PROPID): Status {
    return Gdiplus.Load('GdipRemovePropertyItem')(image, propId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipresetclip
  public static GdipResetClip(graphics: GpGraphics): Status {
    return Gdiplus.Load('GdipResetClip')(graphics);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipresetimageattributes
  public static GdipResetImageAttributes(imageattr: GpImageAttributes, type: ColorAdjustType): Status {
    return Gdiplus.Load('GdipResetImageAttributes')(imageattr, type);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipresetlinetransform
  public static GdipResetLineTransform(brush: GpLineGradient): Status {
    return Gdiplus.Load('GdipResetLineTransform')(brush);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipresetpagetransform
  public static GdipResetPageTransform(graphics: GpGraphics): Status {
    return Gdiplus.Load('GdipResetPageTransform')(graphics);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipresetpath
  public static GdipResetPath(path: GpPath): Status {
    return Gdiplus.Load('GdipResetPath')(path);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipresetpathgradienttransform
  public static GdipResetPathGradientTransform(brush: GpPathGradient): Status {
    return Gdiplus.Load('GdipResetPathGradientTransform')(brush);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipresetpentransform
  public static GdipResetPenTransform(pen: GpPen): Status {
    return Gdiplus.Load('GdipResetPenTransform')(pen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipresettexturetransform
  public static GdipResetTextureTransform(brush: GpTexture): Status {
    return Gdiplus.Load('GdipResetTextureTransform')(brush);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipresetworldtransform
  public static GdipResetWorldTransform(graphics: GpGraphics): Status {
    return Gdiplus.Load('GdipResetWorldTransform')(graphics);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiprestoregraphics
  public static GdipRestoreGraphics(graphics: GpGraphics, state: GraphicsState): Status {
    return Gdiplus.Load('GdipRestoreGraphics')(graphics, state);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipreversepath
  public static GdipReversePath(path: GpPath): Status {
    return Gdiplus.Load('GdipReversePath')(path);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiprotatelinetransform
  public static GdipRotateLineTransform(brush: GpLineGradient, angle: REAL, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipRotateLineTransform')(brush, angle, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiprotatematrix
  public static GdipRotateMatrix(matrix: GpMatrix, angle: REAL, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipRotateMatrix')(matrix, angle, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiprotatepathgradienttransform
  public static GdipRotatePathGradientTransform(brush: GpPathGradient, angle: REAL, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipRotatePathGradientTransform')(brush, angle, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiprotatepentransform
  public static GdipRotatePenTransform(pen: GpPen, angle: REAL, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipRotatePenTransform')(pen, angle, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiprotatetexturetransform
  public static GdipRotateTextureTransform(brush: GpTexture, angle: REAL, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipRotateTextureTransform')(brush, angle, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiprotateworldtransform
  public static GdipRotateWorldTransform(graphics: GpGraphics, angle: REAL, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipRotateWorldTransform')(graphics, angle, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsaveadd
  public static GdipSaveAdd(image: GpImage, encoderParams: Pointer): Status {
    return Gdiplus.Load('GdipSaveAdd')(image, encoderParams);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsaveaddimage
  public static GdipSaveAddImage(image: GpImage, newImage: GpImage, encoderParams: Pointer): Status {
    return Gdiplus.Load('GdipSaveAddImage')(image, newImage, encoderParams);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsavegraphics
  public static GdipSaveGraphics(graphics: GpGraphics, state_out: Pointer): Status {
    return Gdiplus.Load('GdipSaveGraphics')(graphics, state_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsaveimagetofile
  public static GdipSaveImageToFile(image: GpImage, filename: LPWSTR, clsidEncoder: Pointer, encoderParams: NULLABLE<Pointer>): Status {
    return Gdiplus.Load('GdipSaveImageToFile')(image, filename, clsidEncoder, encoderParams);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsaveimagetostream
  public static GdipSaveImageToStream(image: GpImage, stream: IStream, clsidEncoder: Pointer, encoderParams: NULLABLE<Pointer>): Status {
    return Gdiplus.Load('GdipSaveImageToStream')(image, stream, clsidEncoder, encoderParams);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipscalelinetransform
  public static GdipScaleLineTransform(brush: GpLineGradient, sx: REAL, sy: REAL, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipScaleLineTransform')(brush, sx, sy, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipscalematrix
  public static GdipScaleMatrix(matrix: GpMatrix, scaleX: REAL, scaleY: REAL, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipScaleMatrix')(matrix, scaleX, scaleY, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipscalepathgradienttransform
  public static GdipScalePathGradientTransform(brush: GpPathGradient, sx: REAL, sy: REAL, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipScalePathGradientTransform')(brush, sx, sy, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipscalepentransform
  public static GdipScalePenTransform(pen: GpPen, sx: REAL, sy: REAL, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipScalePenTransform')(pen, sx, sy, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipscaletexturetransform
  public static GdipScaleTextureTransform(brush: GpTexture, sx: REAL, sy: REAL, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipScaleTextureTransform')(brush, sx, sy, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipscaleworldtransform
  public static GdipScaleWorldTransform(graphics: GpGraphics, sx: REAL, sy: REAL, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipScaleWorldTransform')(graphics, sx, sy, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetadjustablearrowcapfillstate
  public static GdipSetAdjustableArrowCapFillState(cap: GpAdjustableArrowCap, fillState: BOOL): Status {
    return Gdiplus.Load('GdipSetAdjustableArrowCapFillState')(cap, fillState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetadjustablearrowcapheight
  public static GdipSetAdjustableArrowCapHeight(cap: GpAdjustableArrowCap, height: REAL): Status {
    return Gdiplus.Load('GdipSetAdjustableArrowCapHeight')(cap, height);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetadjustablearrowcapmiddleinset
  public static GdipSetAdjustableArrowCapMiddleInset(cap: GpAdjustableArrowCap, middleInset: REAL): Status {
    return Gdiplus.Load('GdipSetAdjustableArrowCapMiddleInset')(cap, middleInset);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetadjustablearrowcapwidth
  public static GdipSetAdjustableArrowCapWidth(cap: GpAdjustableArrowCap, width: REAL): Status {
    return Gdiplus.Load('GdipSetAdjustableArrowCapWidth')(cap, width);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetclipgraphics
  public static GdipSetClipGraphics(graphics: GpGraphics, srcgraphics: GpGraphics, combineMode: CombineMode): Status {
    return Gdiplus.Load('GdipSetClipGraphics')(graphics, srcgraphics, combineMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetcliphrgn
  public static GdipSetClipHrgn(graphics: GpGraphics, hRgn: HRGN, combineMode: CombineMode): Status {
    return Gdiplus.Load('GdipSetClipHrgn')(graphics, hRgn, combineMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetclippath
  public static GdipSetClipPath(graphics: GpGraphics, path: GpPath, combineMode: CombineMode): Status {
    return Gdiplus.Load('GdipSetClipPath')(graphics, path, combineMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetcliprect
  public static GdipSetClipRect(graphics: GpGraphics, x: REAL, y: REAL, width: REAL, height: REAL, combineMode: CombineMode): Status {
    return Gdiplus.Load('GdipSetClipRect')(graphics, x, y, width, height, combineMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetcliprecti
  public static GdipSetClipRectI(graphics: GpGraphics, x: INT, y: INT, width: INT, height: INT, combineMode: CombineMode): Status {
    return Gdiplus.Load('GdipSetClipRectI')(graphics, x, y, width, height, combineMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetclipregion
  public static GdipSetClipRegion(graphics: GpGraphics, region: GpRegion, combineMode: CombineMode): Status {
    return Gdiplus.Load('GdipSetClipRegion')(graphics, region, combineMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetcompositingmode
  public static GdipSetCompositingMode(graphics: GpGraphics, compositingMode: CompositingMode): Status {
    return Gdiplus.Load('GdipSetCompositingMode')(graphics, compositingMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetcompositingquality
  public static GdipSetCompositingQuality(graphics: GpGraphics, compositingQuality: CompositingQuality): Status {
    return Gdiplus.Load('GdipSetCompositingQuality')(graphics, compositingQuality);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetcustomlinecapbasecap
  public static GdipSetCustomLineCapBaseCap(customCap: GpCustomLineCap, baseCap: LineCap): Status {
    return Gdiplus.Load('GdipSetCustomLineCapBaseCap')(customCap, baseCap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetcustomlinecapbaseinset
  public static GdipSetCustomLineCapBaseInset(customCap: GpCustomLineCap, inset: REAL): Status {
    return Gdiplus.Load('GdipSetCustomLineCapBaseInset')(customCap, inset);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetcustomlinecapstrokecaps
  public static GdipSetCustomLineCapStrokeCaps(customCap: GpCustomLineCap, startCap: LineCap, endCap: LineCap): Status {
    return Gdiplus.Load('GdipSetCustomLineCapStrokeCaps')(customCap, startCap, endCap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetcustomlinecapstrokejoin
  public static GdipSetCustomLineCapStrokeJoin(customCap: GpCustomLineCap, lineJoin: LineJoin): Status {
    return Gdiplus.Load('GdipSetCustomLineCapStrokeJoin')(customCap, lineJoin);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetcustomlinecapwidthscale
  public static GdipSetCustomLineCapWidthScale(customCap: GpCustomLineCap, widthScale: REAL): Status {
    return Gdiplus.Load('GdipSetCustomLineCapWidthScale')(customCap, widthScale);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipseteffectparameters
  public static GdipSetEffectParameters(effect: CGpEffect, params: LPVOID, size: UINT): Status {
    return Gdiplus.Load('GdipSetEffectParameters')(effect, params, size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetempty
  public static GdipSetEmpty(region: GpRegion): Status {
    return Gdiplus.Load('GdipSetEmpty')(region);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetimageattributescachedbackground
  public static GdipSetImageAttributesCachedBackground(imageattr: GpImageAttributes, enableFlag: BOOL): Status {
    return Gdiplus.Load('GdipSetImageAttributesCachedBackground')(imageattr, enableFlag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetimageattributescolorkeys
  public static GdipSetImageAttributesColorKeys(imageattr: GpImageAttributes, type: ColorAdjustType, enableFlag: BOOL, colorLow: ARGB, colorHigh: ARGB): Status {
    return Gdiplus.Load('GdipSetImageAttributesColorKeys')(imageattr, type, enableFlag, colorLow, colorHigh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetimageattributescolormatrix
  public static GdipSetImageAttributesColorMatrix(imageattr: GpImageAttributes, type: ColorAdjustType, enableFlag: BOOL, colorMatrix: Pointer, grayMatrix: Pointer, flags: ColorMatrixFlags): Status {
    return Gdiplus.Load('GdipSetImageAttributesColorMatrix')(imageattr, type, enableFlag, colorMatrix, grayMatrix, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetimageattributesgamma
  public static GdipSetImageAttributesGamma(imageattr: GpImageAttributes, type: ColorAdjustType, enableFlag: BOOL, gamma: REAL): Status {
    return Gdiplus.Load('GdipSetImageAttributesGamma')(imageattr, type, enableFlag, gamma);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetimageattributesnoop
  public static GdipSetImageAttributesNoOp(imageattr: GpImageAttributes, type: ColorAdjustType, enableFlag: BOOL): Status {
    return Gdiplus.Load('GdipSetImageAttributesNoOp')(imageattr, type, enableFlag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetimageattributesoutputchannel
  public static GdipSetImageAttributesOutputChannel(imageattr: GpImageAttributes, type: ColorAdjustType, enableFlag: BOOL, channelFlags: ColorChannelFlags): Status {
    return Gdiplus.Load('GdipSetImageAttributesOutputChannel')(imageattr, type, enableFlag, channelFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetimageattributesoutputchannelcolorprofile
  public static GdipSetImageAttributesOutputChannelColorProfile(imageattr: GpImageAttributes, type: ColorAdjustType, enableFlag: BOOL, colorProfileFilename: LPWSTR): Status {
    return Gdiplus.Load('GdipSetImageAttributesOutputChannelColorProfile')(imageattr, type, enableFlag, colorProfileFilename);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetimageattributesremaptable
  public static GdipSetImageAttributesRemapTable(imageattr: GpImageAttributes, type: ColorAdjustType, enableFlag: BOOL, mapSize: UINT, map: Pointer): Status {
    return Gdiplus.Load('GdipSetImageAttributesRemapTable')(imageattr, type, enableFlag, mapSize, map);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetimageattributesthreshold
  public static GdipSetImageAttributesThreshold(imageattr: GpImageAttributes, type: ColorAdjustType, enableFlag: BOOL, threshold: REAL): Status {
    return Gdiplus.Load('GdipSetImageAttributesThreshold')(imageattr, type, enableFlag, threshold);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetimageattributestoidentity
  public static GdipSetImageAttributesToIdentity(imageattr: GpImageAttributes, type: ColorAdjustType): Status {
    return Gdiplus.Load('GdipSetImageAttributesToIdentity')(imageattr, type);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetimageattributeswrapmode
  public static GdipSetImageAttributesWrapMode(imageAttr: GpImageAttributes, wrap: WrapMode, argb: ARGB, clamp: BOOL): Status {
    return Gdiplus.Load('GdipSetImageAttributesWrapMode')(imageAttr, wrap, argb, clamp);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetimagepalette
  public static GdipSetImagePalette(image: GpImage, palette: Pointer): Status {
    return Gdiplus.Load('GdipSetImagePalette')(image, palette);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetinfinite
  public static GdipSetInfinite(region: GpRegion): Status {
    return Gdiplus.Load('GdipSetInfinite')(region);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetinterpolationmode
  public static GdipSetInterpolationMode(graphics: GpGraphics, interpolationMode: InterpolationMode): Status {
    return Gdiplus.Load('GdipSetInterpolationMode')(graphics, interpolationMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetlineblend
  public static GdipSetLineBlend(brush: GpLineGradient, blend: LPREAL, positions: LPREAL, count: INT): Status {
    return Gdiplus.Load('GdipSetLineBlend')(brush, blend, positions, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetlinecolors
  public static GdipSetLineColors(brush: GpLineGradient, color1: ARGB, color2: ARGB): Status {
    return Gdiplus.Load('GdipSetLineColors')(brush, color1, color2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetlinegammacorrection
  public static GdipSetLineGammaCorrection(brush: GpLineGradient, useGammaCorrection: BOOL): Status {
    return Gdiplus.Load('GdipSetLineGammaCorrection')(brush, useGammaCorrection);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetlinelinearblend
  public static GdipSetLineLinearBlend(brush: GpLineGradient, focus: REAL, scale: REAL): Status {
    return Gdiplus.Load('GdipSetLineLinearBlend')(brush, focus, scale);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetlinepresetblend
  public static GdipSetLinePresetBlend(brush: GpLineGradient, blend: LPARGB, positions: LPREAL, count: INT): Status {
    return Gdiplus.Load('GdipSetLinePresetBlend')(brush, blend, positions, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetlinesigmablend
  public static GdipSetLineSigmaBlend(brush: GpLineGradient, focus: REAL, scale: REAL): Status {
    return Gdiplus.Load('GdipSetLineSigmaBlend')(brush, focus, scale);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetlinetransform
  public static GdipSetLineTransform(brush: GpLineGradient, matrix: GpMatrix): Status {
    return Gdiplus.Load('GdipSetLineTransform')(brush, matrix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetlinewrapmode
  public static GdipSetLineWrapMode(brush: GpLineGradient, wrapmode: WrapMode): Status {
    return Gdiplus.Load('GdipSetLineWrapMode')(brush, wrapmode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetmatrixelements
  public static GdipSetMatrixElements(matrix: GpMatrix, m11: REAL, m12: REAL, m21: REAL, m22: REAL, dx: REAL, dy: REAL): Status {
    return Gdiplus.Load('GdipSetMatrixElements')(matrix, m11, m12, m21, m22, dx, dy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetmetafiledownlevelrasterizationlimit
  public static GdipSetMetafileDownLevelRasterizationLimit(metafile: GpMetafile, metafileRasterizationLimitDpi: UINT): Status {
    return Gdiplus.Load('GdipSetMetafileDownLevelRasterizationLimit')(metafile, metafileRasterizationLimitDpi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpagescale
  public static GdipSetPageScale(graphics: GpGraphics, scale: REAL): Status {
    return Gdiplus.Load('GdipSetPageScale')(graphics, scale);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpageunit
  public static GdipSetPageUnit(graphics: GpGraphics, unit: Unit): Status {
    return Gdiplus.Load('GdipSetPageUnit')(graphics, unit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpathfillmode
  public static GdipSetPathFillMode(path: GpPath, fillmode: FillMode): Status {
    return Gdiplus.Load('GdipSetPathFillMode')(path, fillmode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpathgradientblend
  public static GdipSetPathGradientBlend(brush: GpPathGradient, blend: LPREAL, positions: LPREAL, count: INT): Status {
    return Gdiplus.Load('GdipSetPathGradientBlend')(brush, blend, positions, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpathgradientcentercolor
  public static GdipSetPathGradientCenterColor(brush: GpPathGradient, colors: ARGB): Status {
    return Gdiplus.Load('GdipSetPathGradientCenterColor')(brush, colors);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpathgradientcenterpoint
  public static GdipSetPathGradientCenterPoint(brush: GpPathGradient, points: Pointer): Status {
    return Gdiplus.Load('GdipSetPathGradientCenterPoint')(brush, points);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpathgradientcenterpointi
  public static GdipSetPathGradientCenterPointI(brush: GpPathGradient, points: Pointer): Status {
    return Gdiplus.Load('GdipSetPathGradientCenterPointI')(brush, points);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpathgradientfocusscales
  public static GdipSetPathGradientFocusScales(brush: GpPathGradient, xScale: REAL, yScale: REAL): Status {
    return Gdiplus.Load('GdipSetPathGradientFocusScales')(brush, xScale, yScale);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpathgradientgammacorrection
  public static GdipSetPathGradientGammaCorrection(brush: GpPathGradient, useGammaCorrection: BOOL): Status {
    return Gdiplus.Load('GdipSetPathGradientGammaCorrection')(brush, useGammaCorrection);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpathgradientlinearblend
  public static GdipSetPathGradientLinearBlend(brush: GpPathGradient, focus: REAL, scale: REAL): Status {
    return Gdiplus.Load('GdipSetPathGradientLinearBlend')(brush, focus, scale);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpathgradientpath
  public static GdipSetPathGradientPath(brush: GpPathGradient, path: GpPath): Status {
    return Gdiplus.Load('GdipSetPathGradientPath')(brush, path);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpathgradientpresetblend
  public static GdipSetPathGradientPresetBlend(brush: GpPathGradient, blend: LPARGB, positions: LPREAL, count: INT): Status {
    return Gdiplus.Load('GdipSetPathGradientPresetBlend')(brush, blend, positions, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpathgradientsigmablend
  public static GdipSetPathGradientSigmaBlend(brush: GpPathGradient, focus: REAL, scale: REAL): Status {
    return Gdiplus.Load('GdipSetPathGradientSigmaBlend')(brush, focus, scale);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpathgradientsurroundcolorswithcount
  public static GdipSetPathGradientSurroundColorsWithCount(brush: GpPathGradient, color: LPARGB, count_in_out: LPINT): Status {
    return Gdiplus.Load('GdipSetPathGradientSurroundColorsWithCount')(brush, color, count_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpathgradienttransform
  public static GdipSetPathGradientTransform(brush: GpPathGradient, matrix: GpMatrix): Status {
    return Gdiplus.Load('GdipSetPathGradientTransform')(brush, matrix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpathgradientwrapmode
  public static GdipSetPathGradientWrapMode(brush: GpPathGradient, wrapmode: WrapMode): Status {
    return Gdiplus.Load('GdipSetPathGradientWrapMode')(brush, wrapmode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpathmarker
  public static GdipSetPathMarker(path: GpPath): Status {
    return Gdiplus.Load('GdipSetPathMarker')(path);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpenbrushfill
  public static GdipSetPenBrushFill(pen: GpPen, brush: GpBrush): Status {
    return Gdiplus.Load('GdipSetPenBrushFill')(pen, brush);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpencolor
  public static GdipSetPenColor(pen: GpPen, argb: ARGB): Status {
    return Gdiplus.Load('GdipSetPenColor')(pen, argb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpencompoundarray
  public static GdipSetPenCompoundArray(pen: GpPen, dash: LPREAL, count: INT): Status {
    return Gdiplus.Load('GdipSetPenCompoundArray')(pen, dash, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpencustomendcap
  public static GdipSetPenCustomEndCap(pen: GpPen, customCap: GpCustomLineCap): Status {
    return Gdiplus.Load('GdipSetPenCustomEndCap')(pen, customCap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpencustomstartcap
  public static GdipSetPenCustomStartCap(pen: GpPen, customCap: GpCustomLineCap): Status {
    return Gdiplus.Load('GdipSetPenCustomStartCap')(pen, customCap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpendasharray
  public static GdipSetPenDashArray(pen: GpPen, dash: LPREAL, count: INT): Status {
    return Gdiplus.Load('GdipSetPenDashArray')(pen, dash, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpendashcap197819
  public static GdipSetPenDashCap197819(pen: GpPen, dashCap: DashCap): Status {
    return Gdiplus.Load('GdipSetPenDashCap197819')(pen, dashCap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpendashoffset
  public static GdipSetPenDashOffset(pen: GpPen, offset: REAL): Status {
    return Gdiplus.Load('GdipSetPenDashOffset')(pen, offset);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpendashstyle
  public static GdipSetPenDashStyle(pen: GpPen, dashstyle: DashStyle): Status {
    return Gdiplus.Load('GdipSetPenDashStyle')(pen, dashstyle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpenendcap
  public static GdipSetPenEndCap(pen: GpPen, endCap: LineCap): Status {
    return Gdiplus.Load('GdipSetPenEndCap')(pen, endCap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpenlinecap197819
  public static GdipSetPenLineCap197819(pen: GpPen, startCap: LineCap, endCap: LineCap, dashCap: DashCap): Status {
    return Gdiplus.Load('GdipSetPenLineCap197819')(pen, startCap, endCap, dashCap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpenlinejoin
  public static GdipSetPenLineJoin(pen: GpPen, lineJoin: LineJoin): Status {
    return Gdiplus.Load('GdipSetPenLineJoin')(pen, lineJoin);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpenmiterlimit
  public static GdipSetPenMiterLimit(pen: GpPen, miterLimit: REAL): Status {
    return Gdiplus.Load('GdipSetPenMiterLimit')(pen, miterLimit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpenmode
  public static GdipSetPenMode(pen: GpPen, penMode: PenAlignment): Status {
    return Gdiplus.Load('GdipSetPenMode')(pen, penMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpenstartcap
  public static GdipSetPenStartCap(pen: GpPen, startCap: LineCap): Status {
    return Gdiplus.Load('GdipSetPenStartCap')(pen, startCap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpentransform
  public static GdipSetPenTransform(pen: GpPen, matrix: GpMatrix): Status {
    return Gdiplus.Load('GdipSetPenTransform')(pen, matrix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpenunit
  public static GdipSetPenUnit(pen: GpPen, unit: Unit): Status {
    return Gdiplus.Load('GdipSetPenUnit')(pen, unit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpenwidth
  public static GdipSetPenWidth(pen: GpPen, width: REAL): Status {
    return Gdiplus.Load('GdipSetPenWidth')(pen, width);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpixeloffsetmode
  public static GdipSetPixelOffsetMode(graphics: GpGraphics, pixelOffsetMode: PixelOffsetMode): Status {
    return Gdiplus.Load('GdipSetPixelOffsetMode')(graphics, pixelOffsetMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetpropertyitem
  public static GdipSetPropertyItem(image: GpImage, item: Pointer): Status {
    return Gdiplus.Load('GdipSetPropertyItem')(image, item);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetrenderingorigin
  public static GdipSetRenderingOrigin(graphics: GpGraphics, x: INT, y: INT): Status {
    return Gdiplus.Load('GdipSetRenderingOrigin')(graphics, x, y);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetsmoothingmode
  public static GdipSetSmoothingMode(graphics: GpGraphics, smoothingMode: SmoothingMode): Status {
    return Gdiplus.Load('GdipSetSmoothingMode')(graphics, smoothingMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetsolidfillcolor
  public static GdipSetSolidFillColor(brush: GpSolidFill, color: ARGB): Status {
    return Gdiplus.Load('GdipSetSolidFillColor')(brush, color);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetstringformatalign
  public static GdipSetStringFormatAlign(format: GpStringFormat, align: StringAlignment): Status {
    return Gdiplus.Load('GdipSetStringFormatAlign')(format, align);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetstringformatdigitsubstitution
  public static GdipSetStringFormatDigitSubstitution(format: GpStringFormat, language: LANGID, substitute: StringDigitSubstitute): Status {
    return Gdiplus.Load('GdipSetStringFormatDigitSubstitution')(format, language, substitute);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetstringformatflags
  public static GdipSetStringFormatFlags(format: GpStringFormat, flags: INT): Status {
    return Gdiplus.Load('GdipSetStringFormatFlags')(format, flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetstringformathotkeyprefix
  public static GdipSetStringFormatHotkeyPrefix(format: GpStringFormat, hotkeyPrefix: INT): Status {
    return Gdiplus.Load('GdipSetStringFormatHotkeyPrefix')(format, hotkeyPrefix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetstringformatlinealign
  public static GdipSetStringFormatLineAlign(format: GpStringFormat, align: StringAlignment): Status {
    return Gdiplus.Load('GdipSetStringFormatLineAlign')(format, align);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetstringformatmeasurablecharacterranges
  public static GdipSetStringFormatMeasurableCharacterRanges(format: GpStringFormat, rangeCount: INT, ranges: Pointer): Status {
    return Gdiplus.Load('GdipSetStringFormatMeasurableCharacterRanges')(format, rangeCount, ranges);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetstringformattabstops
  public static GdipSetStringFormatTabStops(format: GpStringFormat, firstTabOffset: REAL, count: INT, tabStops: LPREAL): Status {
    return Gdiplus.Load('GdipSetStringFormatTabStops')(format, firstTabOffset, count, tabStops);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetstringformattrimming
  public static GdipSetStringFormatTrimming(format: GpStringFormat, trimming: StringTrimming): Status {
    return Gdiplus.Load('GdipSetStringFormatTrimming')(format, trimming);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsettextcontrast
  public static GdipSetTextContrast(graphics: GpGraphics, contrast: UINT): Status {
    return Gdiplus.Load('GdipSetTextContrast')(graphics, contrast);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsettextrenderinghint
  public static GdipSetTextRenderingHint(graphics: GpGraphics, mode: TextRenderingHint): Status {
    return Gdiplus.Load('GdipSetTextRenderingHint')(graphics, mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsettexturetransform
  public static GdipSetTextureTransform(brush: GpTexture, matrix: GpMatrix): Status {
    return Gdiplus.Load('GdipSetTextureTransform')(brush, matrix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsettexturewrapmode
  public static GdipSetTextureWrapMode(brush: GpTexture, wrapmode: WrapMode): Status {
    return Gdiplus.Load('GdipSetTextureWrapMode')(brush, wrapmode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipsetworldtransform
  public static GdipSetWorldTransform(graphics: GpGraphics, matrix: GpMatrix): Status {
    return Gdiplus.Load('GdipSetWorldTransform')(graphics, matrix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipshearmatrix
  public static GdipShearMatrix(matrix: GpMatrix, shearX: REAL, shearY: REAL, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipShearMatrix')(matrix, shearX, shearY, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipstartpathfigure
  public static GdipStartPathFigure(path: GpPath): Status {
    return Gdiplus.Load('GdipStartPathFigure')(path);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipstringformatgetgenericdefault
  public static GdipStringFormatGetGenericDefault(format_out: Pointer): Status {
    return Gdiplus.Load('GdipStringFormatGetGenericDefault')(format_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipstringformatgetgenerictypographic
  public static GdipStringFormatGetGenericTypographic(format_out: Pointer): Status {
    return Gdiplus.Load('GdipStringFormatGetGenericTypographic')(format_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiptransformmatrixpoints
  public static GdipTransformMatrixPoints(matrix: GpMatrix, pts_in_out: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipTransformMatrixPoints')(matrix, pts_in_out, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiptransformmatrixpointsi
  public static GdipTransformMatrixPointsI(matrix: GpMatrix, pts_in_out: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipTransformMatrixPointsI')(matrix, pts_in_out, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiptransformpath
  public static GdipTransformPath(path: GpPath, matrix: GpMatrix): Status {
    return Gdiplus.Load('GdipTransformPath')(path, matrix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiptransformpoints
  public static GdipTransformPoints(graphics: GpGraphics, destSpace: CoordinateSpace, srcSpace: CoordinateSpace, points_in_out: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipTransformPoints')(graphics, destSpace, srcSpace, points_in_out, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiptransformpointsi
  public static GdipTransformPointsI(graphics: GpGraphics, destSpace: CoordinateSpace, srcSpace: CoordinateSpace, points_in_out: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipTransformPointsI')(graphics, destSpace, srcSpace, points_in_out, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiptransformregion
  public static GdipTransformRegion(region: GpRegion, matrix: GpMatrix): Status {
    return Gdiplus.Load('GdipTransformRegion')(region, matrix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiptranslateclip
  public static GdipTranslateClip(graphics: GpGraphics, dx: REAL, dy: REAL): Status {
    return Gdiplus.Load('GdipTranslateClip')(graphics, dx, dy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiptranslateclipi
  public static GdipTranslateClipI(graphics: GpGraphics, dx: INT, dy: INT): Status {
    return Gdiplus.Load('GdipTranslateClipI')(graphics, dx, dy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiptranslatelinetransform
  public static GdipTranslateLineTransform(brush: GpLineGradient, dx: REAL, dy: REAL, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipTranslateLineTransform')(brush, dx, dy, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiptranslatematrix
  public static GdipTranslateMatrix(matrix: GpMatrix, offsetX: REAL, offsetY: REAL, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipTranslateMatrix')(matrix, offsetX, offsetY, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiptranslatepathgradienttransform
  public static GdipTranslatePathGradientTransform(brush: GpPathGradient, dx: REAL, dy: REAL, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipTranslatePathGradientTransform')(brush, dx, dy, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiptranslatepentransform
  public static GdipTranslatePenTransform(pen: GpPen, dx: REAL, dy: REAL, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipTranslatePenTransform')(pen, dx, dy, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiptranslateregion
  public static GdipTranslateRegion(region: GpRegion, dx: REAL, dy: REAL): Status {
    return Gdiplus.Load('GdipTranslateRegion')(region, dx, dy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiptranslateregioni
  public static GdipTranslateRegionI(region: GpRegion, dx: INT, dy: INT): Status {
    return Gdiplus.Load('GdipTranslateRegionI')(region, dx, dy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiptranslatetexturetransform
  public static GdipTranslateTextureTransform(brush: GpTexture, dx: REAL, dy: REAL, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipTranslateTextureTransform')(brush, dx, dy, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiptranslateworldtransform
  public static GdipTranslateWorldTransform(graphics: GpGraphics, dx: REAL, dy: REAL, order: MatrixOrder): Status {
    return Gdiplus.Load('GdipTranslateWorldTransform')(graphics, dx, dy, order);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipvectortransformmatrixpoints
  public static GdipVectorTransformMatrixPoints(matrix: GpMatrix, pts_in_out: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipVectorTransformMatrixPoints')(matrix, pts_in_out, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipvectortransformmatrixpointsi
  public static GdipVectorTransformMatrixPointsI(matrix: GpMatrix, pts_in_out: Pointer, count: INT): Status {
    return Gdiplus.Load('GdipVectorTransformMatrixPointsI')(matrix, pts_in_out, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipwarppath
  public static GdipWarpPath(path: GpPath, matrix: GpMatrix, points: Pointer, count: INT, srcx: REAL, srcy: REAL, srcwidth: REAL, srcheight: REAL, warpMode: WarpMode, flatness: REAL): Status {
    return Gdiplus.Load('GdipWarpPath')(path, matrix, points, count, srcx, srcy, srcwidth, srcheight, warpMode, flatness);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipwidenpath
  public static GdipWidenPath(nativePath: GpPath, pen: GpPen, matrix: GpMatrix, flatness: REAL): Status {
    return Gdiplus.Load('GdipWidenPath')(nativePath, pen, matrix, flatness);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdipwindingmodeoutline
  public static GdipWindingModeOutline(path: GpPath, matrix: GpMatrix, flatness: REAL): Status {
    return Gdiplus.Load('GdipWindingModeOutline')(path, matrix, flatness);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiplusnotificationhook
  public static GdiplusNotificationHook(token_out: LPULONG_PTR): Status {
    return Gdiplus.Load('GdiplusNotificationHook')(token_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiplusnotificationunhook
  public static GdiplusNotificationUnhook(token: ULONG_PTR): void {
    return Gdiplus.Load('GdiplusNotificationUnhook')(token);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiplusshutdown
  public static GdiplusShutdown(token: ULONG_PTR): void {
    return Gdiplus.Load('GdiplusShutdown')(token);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/gdiplusflat/nf-gdiplusflat-gdiplusstartup
  public static GdiplusStartup(token_out: LPULONG_PTR, input: Pointer, output_out: NULLABLE<Pointer>): Status {
    return Gdiplus.Load('GdiplusStartup')(token_out, input, output_out);
  }
}

export default Gdiplus;
