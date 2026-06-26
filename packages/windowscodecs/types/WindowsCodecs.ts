import type { Pointer } from 'bun:ffi';

export type { BOOL, DWORD, HANDLE, HRESULT, LPCWSTR, LPWSTR, NULL, Optional, UINT, ULONG, ULONG_PTR } from '@bun-win32/core';

export const WINCODEC_SDK_VERSION = 0x0237;

export enum WICBitmapAlphaChannelOption {
  WICBitmapIgnoreAlpha = 0x0000_0002,
  WICBitmapUseAlpha = 0x0000_0000,
  WICBitmapUsePremultipliedAlpha = 0x0000_0001,
}

export enum WICBitmapCreateCacheOption {
  WICBitmapCacheOnDemand = 0x0000_0001,
  WICBitmapCacheOnLoad = 0x0000_0002,
  WICBitmapNoCache = 0x0000_0000,
}

export enum WICBitmapDitherType {
  WICBitmapDitherTypeDualSpiral4x4 = 0x0000_0006,
  WICBitmapDitherTypeDualSpiral8x8 = 0x0000_0007,
  WICBitmapDitherTypeErrorDiffusion = 0x0000_0008,
  WICBitmapDitherTypeNone = 0x0000_0000,
  WICBitmapDitherTypeOrdered16x16 = 0x0000_0003,
  WICBitmapDitherTypeOrdered4x4 = 0x0000_0001,
  WICBitmapDitherTypeOrdered8x8 = 0x0000_0002,
  WICBitmapDitherTypeSolid = 0x0000_0000,
  WICBitmapDitherTypeSpiral4x4 = 0x0000_0004,
  WICBitmapDitherTypeSpiral8x8 = 0x0000_0005,
}

export enum WICBitmapEncoderCacheOption {
  WICBitmapEncoderCacheInMemory = 0x0000_0000,
  WICBitmapEncoderCacheTempFile = 0x0000_0001,
  WICBitmapEncoderNoCache = 0x0000_0002,
}

export enum WICBitmapInterpolationMode {
  WICBitmapInterpolationModeCubic = 0x0000_0002,
  WICBitmapInterpolationModeFant = 0x0000_0003,
  WICBitmapInterpolationModeHighQualityCubic = 0x0000_0004,
  WICBitmapInterpolationModeLinear = 0x0000_0001,
  WICBitmapInterpolationModeNearestNeighbor = 0x0000_0000,
}

export enum WICBitmapPaletteType {
  WICBitmapPaletteTypeCustom = 0x0000_0000,
  WICBitmapPaletteTypeFixedBW = 0x0000_0002,
  WICBitmapPaletteTypeFixedGray16 = 0x0000_000b,
  WICBitmapPaletteTypeFixedGray256 = 0x0000_000c,
  WICBitmapPaletteTypeFixedGray4 = 0x0000_000a,
  WICBitmapPaletteTypeFixedHalftone125 = 0x0000_0006,
  WICBitmapPaletteTypeFixedHalftone216 = 0x0000_0007,
  WICBitmapPaletteTypeFixedHalftone252 = 0x0000_0008,
  WICBitmapPaletteTypeFixedHalftone256 = 0x0000_0009,
  WICBitmapPaletteTypeFixedHalftone27 = 0x0000_0004,
  WICBitmapPaletteTypeFixedHalftone64 = 0x0000_0005,
  WICBitmapPaletteTypeFixedHalftone8 = 0x0000_0003,
  WICBitmapPaletteTypeFixedWebPalette = 0x0000_0007,
  WICBitmapPaletteTypeMedianCut = 0x0000_0001,
}

export enum WICBitmapTransformOptions {
  WICBitmapTransformFlipHorizontal = 0x0000_0008,
  WICBitmapTransformFlipVertical = 0x0000_0010,
  WICBitmapTransformRotate0 = 0x0000_0000,
  WICBitmapTransformRotate180 = 0x0000_0002,
  WICBitmapTransformRotate270 = 0x0000_0003,
  WICBitmapTransformRotate90 = 0x0000_0001,
}

export enum WICDecodeOptions {
  WICDecodeMetadataCacheOnDemand = 0x0000_0000,
  WICDecodeMetadataCacheOnLoad = 0x0000_0001,
}

export enum WICSectionAccessLevel {
  WICSectionAccessLevelRead = 0x0000_0001,
  WICSectionAccessLevelReadWrite = 0x0000_0003,
}

export type DOUBLE = number;
export type HBITMAP = bigint;
export type HICON = bigint;
export type HPALETTE = bigint;
export type IEnumString = bigint;
export type IPropertyBag2 = bigint;
export type IStream = bigint;
export type IWICBitmap = bigint;
export type IWICBitmapClipper = bigint;
export type IWICBitmapCodecInfo = bigint;
export type IWICBitmapDecoder = bigint;
export type IWICBitmapEncoder = bigint;
export type IWICBitmapFlipRotator = bigint;
export type IWICBitmapFrameDecode = bigint;
export type IWICBitmapFrameEncode = bigint;
export type IWICBitmapLock = bigint;
export type IWICBitmapScaler = bigint;
export type IWICBitmapSource = bigint;
export type IWICColorContext = bigint;
export type IWICComponentFactory = bigint;
export type IWICComponentInfo = bigint;
export type IWICFastMetadataEncoder = bigint;
export type IWICFormatConverter = bigint;
export type IWICImagingFactory = bigint;
export type IWICMetadataBlockReader = bigint;
export type IWICMetadataBlockWriter = bigint;
export type IWICMetadataQueryReader = bigint;
export type IWICMetadataQueryWriter = bigint;
export type IWICMetadataReader = bigint;
export type IWICMetadataWriter = bigint;
export type IWICPalette = bigint;
export type IWICPixelFormatInfo = bigint;
export type IWICStream = bigint;
export type LPBOOL = Pointer;
export type LPBYTE = Pointer;
export type LPDOUBLE = Pointer;
export type LPGUID = Pointer;
export type LPIEnumString = Pointer;
export type LPIPropertyBag2 = Pointer;
export type LPIWICBitmap = Pointer;
export type LPIWICBitmapClipper = Pointer;
export type LPIWICBitmapDecoder = Pointer;
export type LPIWICBitmapDecoderInfo = Pointer;
export type LPIWICBitmapEncoder = Pointer;
export type LPIWICBitmapEncoderInfo = Pointer;
export type LPIWICBitmapFlipRotator = Pointer;
export type LPIWICBitmapFrameDecode = Pointer;
export type LPIWICBitmapFrameEncode = Pointer;
export type LPIWICBitmapLock = Pointer;
export type LPIWICBitmapScaler = Pointer;
export type LPIWICBitmapSource = Pointer;
export type LPIWICColorContext = Pointer;
export type LPIWICComponentInfo = Pointer;
export type LPIWICFastMetadataEncoder = Pointer;
export type LPIWICFormatConverter = Pointer;
export type LPIWICImagingFactory = Pointer;
export type LPIWICMetadataQueryReader = Pointer;
export type LPIWICMetadataQueryWriter = Pointer;
export type LPIWICMetadataReader = Pointer;
export type LPIWICMetadataWriter = Pointer;
export type LPIWICPalette = Pointer;
export type LPIWICStream = Pointer;
export type LPLPOLESTR = Pointer;
export type LPLPVOID = Pointer;
export type LPPROPBAG2 = Pointer;
export type LPPROPVARIANT = Pointer;
export type LPUINT = Pointer;
export type LPULARGE_INTEGER = Pointer;
export type LPULONG = Pointer;
export type LPVARIANT = Pointer;
export type LPWICBitmapPaletteType = Pointer;
export type LPWICColor = Pointer;
export type LPWICInProcPointer = Pointer;
export type LPWICPixelFormatGUID = Pointer;
export type LPWICRect = Pointer;
export type PCWSTR = Pointer;
export type REFCLSID = Pointer;
export type REFGUID = Pointer;
export type REFIID = Pointer;
export type REFWICPixelFormatGUID = Pointer;
export type WICInProcPointer = Pointer;
