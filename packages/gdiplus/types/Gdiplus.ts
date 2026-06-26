import type { Pointer } from 'bun:ffi';

export type {
  BOOL,
  BYTE,
  CHAR,
  DWORD,
  HANDLE,
  HINSTANCE,
  HMODULE,
  INT,
  LONG,
  LPBOOL,
  LPBYTE,
  LPCSTR,
  LPCWSTR,
  LPDWORD,
  LPSTR,
  LPVOID,
  LPWSTR,
  NULL,
  NULLABLE,
  OPTIONAL,
  SHORT,
  SIZE_T,
  UINT,
  ULONG,
  ULONG_PTR,
  USHORT,
  VOID,
  WCHAR,
  WORD,
} from '@bun-win32/core';

export enum BrushType {
  BrushTypeSolidColor = 0,
  BrushTypeHatchFill = 1,
  BrushTypeTextureFill = 2,
  BrushTypePathGradient = 3,
  BrushTypeLinearGradient = 4,
}

export enum ColorAdjustType {
  ColorAdjustTypeDefault = 0,
  ColorAdjustTypeBitmap = 1,
  ColorAdjustTypeBrush = 2,
  ColorAdjustTypePen = 3,
  ColorAdjustTypeText = 4,
  ColorAdjustTypeCount = 5,
  ColorAdjustTypeAny = 6,
}

export enum ColorChannelFlags {
  ColorChannelFlagsC = 0,
  ColorChannelFlagsM = 1,
  ColorChannelFlagsY = 2,
  ColorChannelFlagsK = 3,
  ColorChannelFlagsLast = 4,
}

export enum ColorMatrixFlags {
  ColorMatrixFlagsDefault = 0,
  ColorMatrixFlagsSkipGrays = 1,
  ColorMatrixFlagsAltGray = 2,
}

export enum CombineMode {
  CombineModeReplace = 0,
  CombineModeIntersect = 1,
  CombineModeUnion = 2,
  CombineModeXor = 3,
  CombineModeExclude = 4,
  CombineModeComplement = 5,
}

export enum CompositingMode {
  CompositingModeSourceOver = 0,
  CompositingModeSourceCopy = 1,
}

export enum CompositingQuality {
  CompositingQualityInvalid = -1,
  CompositingQualityDefault = 0,
  CompositingQualityHighSpeed = 1,
  CompositingQualityHighQuality = 2,
  CompositingQualityGammaCorrected = 3,
  CompositingQualityAssumeLinear = 4,
}

export enum CoordinateSpace {
  CoordinateSpaceWorld = 0,
  CoordinateSpacePage = 1,
  CoordinateSpaceDevice = 2,
}

export enum DashCap {
  DashCapFlat = 0,
  DashCapRound = 2,
  DashCapTriangle = 3,
}

export enum DashStyle {
  DashStyleSolid = 0,
  DashStyleDash = 1,
  DashStyleDot = 2,
  DashStyleDashDot = 3,
  DashStyleDashDotDot = 4,
  DashStyleCustom = 5,
}

export enum DitherType {
  DitherTypeNone = 0,
  DitherTypeSolid = 1,
  DitherTypeOrdered4x4 = 2,
  DitherTypeOrdered8x8 = 3,
  DitherTypeOrdered16x16 = 4,
  DitherTypeSpiral4x4 = 5,
  DitherTypeSpiral8x8 = 6,
  DitherTypeDualSpiral4x4 = 7,
  DitherTypeDualSpiral8x8 = 8,
  DitherTypeErrorDiffusion = 9,
  DitherTypeMax = 10,
}

export enum DriverStringOptions {
  DriverStringOptionsCmapLookup = 1,
  DriverStringOptionsVertical = 2,
  DriverStringOptionsRealizedAdvance = 4,
  DriverStringOptionsLimitSubpixel = 8,
}

export enum EmfType {
  EmfTypeEmfOnly = 3,
  EmfTypeEmfPlusOnly = 4,
  EmfTypeEmfPlusDual = 5,
}

export enum EncoderParameterValueType {
  EncoderParameterValueTypeByte = 1,
  EncoderParameterValueTypeASCII = 2,
  EncoderParameterValueTypeShort = 3,
  EncoderParameterValueTypeLong = 4,
  EncoderParameterValueTypeRational = 5,
  EncoderParameterValueTypeLongRange = 6,
  EncoderParameterValueTypeUndefined = 7,
  EncoderParameterValueTypeRationalRange = 8,
  EncoderParameterValueTypePointer = 9,
}

export enum FillMode {
  FillModeAlternate = 0,
  FillModeWinding = 1,
}

export enum FlushIntention {
  FlushIntentionFlush = 0,
  FlushIntentionSync = 1,
}

export enum FontStyle {
  FontStyleRegular = 0,
  FontStyleBold = 1,
  FontStyleItalic = 2,
  FontStyleBoldItalic = 3,
  FontStyleUnderline = 4,
  FontStyleStrikeout = 8,
}

export enum GenericFontFamily {
  GenericFontFamilySerif = 0,
  GenericFontFamilySansSerif = 1,
  GenericFontFamilyMonospace = 2,
}

export enum HatchStyle {
  HatchStyleHorizontal = 0,
  HatchStyleVertical = 1,
  HatchStyleForwardDiagonal = 2,
  HatchStyleBackwardDiagonal = 3,
  HatchStyleCross = 4,
  HatchStyleLargeGrid = 4,
  HatchStyleDiagonalCross = 5,
  HatchStyle05Percent = 6,
  HatchStyle10Percent = 7,
  HatchStyle20Percent = 8,
  HatchStyle25Percent = 9,
  HatchStyle30Percent = 10,
  HatchStyle40Percent = 11,
  HatchStyle50Percent = 12,
  HatchStyle60Percent = 13,
  HatchStyle70Percent = 14,
  HatchStyle75Percent = 15,
  HatchStyle80Percent = 16,
  HatchStyle90Percent = 17,
  HatchStyleLightDownwardDiagonal = 18,
  HatchStyleLightUpwardDiagonal = 19,
  HatchStyleDarkDownwardDiagonal = 20,
  HatchStyleDarkUpwardDiagonal = 21,
  HatchStyleWideDownwardDiagonal = 22,
  HatchStyleWideUpwardDiagonal = 23,
  HatchStyleLightVertical = 24,
  HatchStyleLightHorizontal = 25,
  HatchStyleNarrowVertical = 26,
  HatchStyleNarrowHorizontal = 27,
  HatchStyleDarkVertical = 28,
  HatchStyleDarkHorizontal = 29,
  HatchStyleDashedDownwardDiagonal = 30,
  HatchStyleDashedUpwardDiagonal = 31,
  HatchStyleDashedHorizontal = 32,
  HatchStyleDashedVertical = 33,
  HatchStyleSmallConfetti = 34,
  HatchStyleLargeConfetti = 35,
  HatchStyleZigZag = 36,
  HatchStyleWave = 37,
  HatchStyleDiagonalBrick = 38,
  HatchStyleHorizontalBrick = 39,
  HatchStyleWeave = 40,
  HatchStylePlaid = 41,
  HatchStyleDivot = 42,
  HatchStyleDottedGrid = 43,
  HatchStyleDottedDiamond = 44,
  HatchStyleShingle = 45,
  HatchStyleTrellis = 46,
  HatchStyleSphere = 47,
  HatchStyleSmallGrid = 48,
  HatchStyleSmallCheckerBoard = 49,
  HatchStyleLargeCheckerBoard = 50,
  HatchStyleOutlinedDiamond = 51,
  HatchStyleSolidDiamond = 52,
  HatchStyleTotal = 53,
}

export enum HistogramFormat {
  HistogramFormatARGB = 0,
  HistogramFormatPARGB = 1,
  HistogramFormatRGB = 2,
  HistogramFormatGray = 3,
  HistogramFormatB = 4,
  HistogramFormatG = 5,
  HistogramFormatR = 6,
  HistogramFormatA = 7,
}

export enum HotkeyPrefix {
  HotkeyPrefixNone = 0,
  HotkeyPrefixShow = 1,
  HotkeyPrefixHide = 2,
}

export enum ImageCodecFlags {
  ImageCodecFlagsEncoder = 0x0000_0001,
  ImageCodecFlagsDecoder = 0x0000_0002,
  ImageCodecFlagsSupportBitmap = 0x0000_0004,
  ImageCodecFlagsSupportVector = 0x0000_0008,
  ImageCodecFlagsSeekableEncode = 0x0000_0010,
  ImageCodecFlagsBlockingDecode = 0x0000_0020,
  ImageCodecFlagsBuiltin = 0x0001_0000,
  ImageCodecFlagsSystem = 0x0002_0000,
  ImageCodecFlagsUser = 0x0004_0000,
}

export enum ImageFlags {
  ImageFlagsNone = 0,
  ImageFlagsScalable = 0x0001,
  ImageFlagsHasAlpha = 0x0002,
  ImageFlagsHasTranslucent = 0x0004,
  ImageFlagsPartiallyScalable = 0x0008,
  ImageFlagsColorSpaceRGB = 0x0010,
  ImageFlagsColorSpaceCMYK = 0x0020,
  ImageFlagsColorSpaceGRAY = 0x0040,
  ImageFlagsColorSpaceYCBCR = 0x0080,
  ImageFlagsColorSpaceYCCK = 0x0100,
  ImageFlagsHasRealDPI = 0x1000,
  ImageFlagsHasRealPixelSize = 0x2000,
  ImageFlagsReadOnly = 0x0001_0000,
  ImageFlagsCaching = 0x0002_0000,
}

export enum ImageLockMode {
  ImageLockModeRead = 0x0001,
  ImageLockModeWrite = 0x0002,
  ImageLockModeUserInputBuf = 0x0004,
}

export enum ImageType {
  ImageTypeUnknown = 0,
  ImageTypeBitmap = 1,
  ImageTypeMetafile = 2,
}

export enum InterpolationMode {
  InterpolationModeInvalid = -1,
  InterpolationModeDefault = 0,
  InterpolationModeLowQuality = 1,
  InterpolationModeHighQuality = 2,
  InterpolationModeBilinear = 3,
  InterpolationModeBicubic = 4,
  InterpolationModeNearestNeighbor = 5,
  InterpolationModeHighQualityBilinear = 6,
  InterpolationModeHighQualityBicubic = 7,
}

export enum LinearGradientMode {
  LinearGradientModeHorizontal = 0,
  LinearGradientModeVertical = 1,
  LinearGradientModeForwardDiagonal = 2,
  LinearGradientModeBackwardDiagonal = 3,
}

export enum LineCap {
  LineCapFlat = 0x00,
  LineCapSquare = 0x01,
  LineCapRound = 0x02,
  LineCapTriangle = 0x03,
  LineCapNoAnchor = 0x10,
  LineCapSquareAnchor = 0x11,
  LineCapRoundAnchor = 0x12,
  LineCapDiamondAnchor = 0x13,
  LineCapArrowAnchor = 0x14,
  LineCapCustom = 0xff,
  LineCapAnchorMask = 0xf0,
}

export enum LineJoin {
  LineJoinMiter = 0,
  LineJoinBevel = 1,
  LineJoinRound = 2,
  LineJoinMiterClipped = 3,
}

export enum MatrixOrder {
  MatrixOrderPrepend = 0,
  MatrixOrderAppend = 1,
}

export enum MetafileFrameUnit {
  MetafileFrameUnitPixel = 2,
  MetafileFrameUnitPoint = 3,
  MetafileFrameUnitInch = 4,
  MetafileFrameUnitDocument = 5,
  MetafileFrameUnitMillimeter = 6,
  MetafileFrameUnitGdi = 7,
}

export enum PaletteType {
  PaletteTypeCustom = 0,
  PaletteTypeOptimal = 1,
  PaletteTypeFixedBW = 2,
  PaletteTypeFixedHalftone8 = 3,
  PaletteTypeFixedHalftone27 = 4,
  PaletteTypeFixedHalftone64 = 5,
  PaletteTypeFixedHalftone125 = 6,
  PaletteTypeFixedHalftone216 = 7,
  PaletteTypeFixedHalftone252 = 8,
  PaletteTypeFixedHalftone256 = 9,
}

export enum PenAlignment {
  PenAlignmentCenter = 0,
  PenAlignmentInset = 1,
}

export enum PenType {
  PenTypeUnknown = -1,
  PenTypeSolidColor = 0,
  PenTypeHatchFill = 1,
  PenTypeTextureFill = 2,
  PenTypePathGradient = 3,
  PenTypeLinearGradient = 4,
}

export enum PixelOffsetMode {
  PixelOffsetModeInvalid = -1,
  PixelOffsetModeDefault = 0,
  PixelOffsetModeHighSpeed = 1,
  PixelOffsetModeHighQuality = 2,
  PixelOffsetModeNone = 3,
  PixelOffsetModeHalf = 4,
}

export enum RotateFlipType {
  RotateNoneFlipNone = 0,
  Rotate90FlipNone = 1,
  Rotate180FlipNone = 2,
  Rotate270FlipNone = 3,
  RotateNoneFlipX = 4,
  Rotate90FlipX = 5,
  Rotate180FlipX = 6,
  Rotate270FlipX = 7,
}

export enum SmoothingMode {
  SmoothingModeInvalid = -1,
  SmoothingModeDefault = 0,
  SmoothingModeHighSpeed = 1,
  SmoothingModeHighQuality = 2,
  SmoothingModeNone = 3,
  SmoothingModeAntiAlias = 4,
  SmoothingModeAntiAlias8x8 = 5,
}

export enum Status {
  Ok = 0,
  GenericError = 1,
  InvalidParameter = 2,
  OutOfMemory = 3,
  ObjectBusy = 4,
  InsufficientBuffer = 5,
  NotImplemented = 6,
  Win32Error = 7,
  WrongState = 8,
  Aborted = 9,
  FileNotFound = 10,
  ValueOverflow = 11,
  AccessDenied = 12,
  UnknownImageFormat = 13,
  FontFamilyNotFound = 14,
  FontStyleNotFound = 15,
  NotTrueTypeFont = 16,
  UnsupportedGdiplusVersion = 17,
  GdiplusNotInitialized = 18,
  PropertyNotFound = 19,
  PropertyNotSupported = 20,
  ProfileNotFound = 21,
}

export enum StringAlignment {
  StringAlignmentNear = 0,
  StringAlignmentCenter = 1,
  StringAlignmentFar = 2,
}

export enum StringDigitSubstitute {
  StringDigitSubstituteUser = 0,
  StringDigitSubstituteNone = 1,
  StringDigitSubstituteNational = 2,
  StringDigitSubstituteTraditional = 3,
}

export enum StringFormatFlags {
  StringFormatFlagsDirectionRightToLeft = 0x0000_0001,
  StringFormatFlagsDirectionVertical = 0x0000_0002,
  StringFormatFlagsNoFitBlackBox = 0x0000_0004,
  StringFormatFlagsDisplayFormatControl = 0x0000_0020,
  StringFormatFlagsNoFontFallback = 0x0000_0400,
  StringFormatFlagsMeasureTrailingSpaces = 0x0000_0800,
  StringFormatFlagsNoWrap = 0x0000_1000,
  StringFormatFlagsLineLimit = 0x0000_2000,
  StringFormatFlagsNoClip = 0x0000_4000,
}

export enum StringTrimming {
  StringTrimmingNone = 0,
  StringTrimmingCharacter = 1,
  StringTrimmingWord = 2,
  StringTrimmingEllipsisCharacter = 3,
  StringTrimmingEllipsisWord = 4,
  StringTrimmingEllipsisPath = 5,
}

export enum TextRenderingHint {
  TextRenderingHintSystemDefault = 0,
  TextRenderingHintSingleBitPerPixelGridFit = 1,
  TextRenderingHintSingleBitPerPixel = 2,
  TextRenderingHintAntiAliasGridFit = 3,
  TextRenderingHintAntiAlias = 4,
  TextRenderingHintClearTypeGridFit = 5,
}

export enum Unit {
  UnitWorld = 0,
  UnitDisplay = 1,
  UnitPixel = 2,
  UnitPoint = 3,
  UnitInch = 4,
  UnitDocument = 5,
  UnitMillimeter = 6,
}

export enum WarpMode {
  WarpModePerspective = 0,
  WarpModeBilinear = 1,
}

export enum WrapMode {
  WrapModeTile = 0,
  WrapModeTileFlipX = 1,
  WrapModeTileFlipY = 2,
  WrapModeTileFlipXY = 3,
  WrapModeClamp = 4,
}

export const ALPHA_MASK = 0xff_00_00_00;
export const ALPHA_SHIFT = 24;
export const BLUE_SHIFT = 0;
export const GREEN_SHIFT = 8;
export const RED_SHIFT = 16;

export const PixelFormatAlpha = 0x0004_0000;
export const PixelFormatCanonical = 0x0020_0000;
export const PixelFormatDontCare = 0;
export const PixelFormatExtended = 0x0010_0000;
export const PixelFormatGDI = 0x0002_0000;
export const PixelFormatIndexed = 0x0001_0000;
export const PixelFormatMax = 16;
export const PixelFormatPAlpha = 0x0008_0000;
export const PixelFormatUndefined = 0;

export const PixelFormat1bppIndexed = 1 | (1 << 8) | PixelFormatIndexed | PixelFormatGDI;
export const PixelFormat4bppIndexed = 2 | (4 << 8) | PixelFormatIndexed | PixelFormatGDI;
export const PixelFormat8bppIndexed = 3 | (8 << 8) | PixelFormatIndexed | PixelFormatGDI;
export const PixelFormat16bppARGB1555 = 7 | (16 << 8) | PixelFormatAlpha | PixelFormatGDI;
export const PixelFormat16bppGrayScale = 4 | (16 << 8) | PixelFormatExtended;
export const PixelFormat16bppRGB555 = 5 | (16 << 8) | PixelFormatGDI;
export const PixelFormat16bppRGB565 = 6 | (16 << 8) | PixelFormatGDI;
export const PixelFormat24bppRGB = 8 | (24 << 8) | PixelFormatGDI;
export const PixelFormat32bppARGB = 10 | (32 << 8) | PixelFormatAlpha | PixelFormatGDI | PixelFormatCanonical;
export const PixelFormat32bppCMYK = 15 | (32 << 8);
export const PixelFormat32bppPARGB = 11 | (32 << 8) | PixelFormatAlpha | PixelFormatPAlpha | PixelFormatGDI;
export const PixelFormat32bppRGB = 9 | (32 << 8) | PixelFormatGDI;
export const PixelFormat48bppRGB = 12 | (48 << 8) | PixelFormatExtended;
export const PixelFormat64bppARGB = 13 | (64 << 8) | PixelFormatAlpha | PixelFormatCanonical | PixelFormatExtended;
export const PixelFormat64bppPARGB = 14 | (64 << 8) | PixelFormatAlpha | PixelFormatPAlpha | PixelFormatExtended;

export type ARGB = number;
export type CGpEffect = bigint;
export type EmfPlusRecordType = number;
export type GpAdjustableArrowCap = bigint;
export type GpBitmap = bigint;
export type GpBrush = bigint;
export type GpCachedBitmap = bigint;
export type GpCustomLineCap = bigint;
export type GpFont = bigint;
export type GpFontCollection = bigint;
export type GpFontFamily = bigint;
export type GpGraphics = bigint;
export type GpHatch = bigint;
export type GpImage = bigint;
export type GpImageAttributes = bigint;
export type GpLineGradient = bigint;
export type GpMatrix = bigint;
export type GpMetafile = bigint;
export type GpPath = bigint;
export type GpPathGradient = bigint;
export type GpPathIterator = bigint;
export type GpPen = bigint;
export type GpRegion = bigint;
export type GpSolidFill = bigint;
export type GpStringFormat = bigint;
export type GpTexture = bigint;
export type GraphicsContainer = number;
export type GraphicsState = number;
export type HBITMAP = bigint;
export type HBRUSH = bigint;
export type HDC = bigint;
export type HENHMETAFILE = bigint;
export type HFONT = bigint;
export type HICON = bigint;
export type HMETAFILE = bigint;
export type HPALETTE = bigint;
export type HPEN = bigint;
export type HRGN = bigint;
export type HWND = bigint;
export type IStream = bigint;
export type LANGID = number;
export type LPARGB = Pointer;
export type LPINT = Pointer;
export type LPLANGID = Pointer;
export type LPLONG = Pointer;
export type LPREAL = Pointer;
export type LPSHORT = Pointer;
export type LPUINT = Pointer;
export type LPUINT16 = Pointer;
export type LPULONG_PTR = Pointer;
export type LPUSHORT = Pointer;
export type LPWORD = Pointer;
export type PROPID = number;
export type PixelFormat = number;
export type REAL = number;
export type UINT16 = number;
