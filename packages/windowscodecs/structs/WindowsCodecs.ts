import { type FFIFunction, FFIType, type Pointer } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  DOUBLE,
  DWORD,
  HANDLE,
  HBITMAP,
  HICON,
  HPALETTE,
  HRESULT,
  IEnumString,
  IPropertyBag2,
  IStream,
  IWICBitmap,
  IWICBitmapClipper,
  IWICBitmapCodecInfo,
  IWICBitmapDecoder,
  IWICBitmapEncoder,
  IWICBitmapFlipRotator,
  IWICBitmapFrameDecode,
  IWICBitmapFrameEncode,
  IWICBitmapLock,
  IWICBitmapScaler,
  IWICBitmapSource,
  IWICColorContext,
  IWICComponentFactory,
  IWICComponentInfo,
  IWICFastMetadataEncoder,
  IWICFormatConverter,
  IWICImagingFactory,
  IWICMetadataBlockReader,
  IWICMetadataBlockWriter,
  IWICMetadataQueryReader,
  IWICMetadataQueryWriter,
  IWICMetadataReader,
  IWICMetadataWriter,
  IWICPalette,
  IWICPixelFormatInfo,
  IWICStream,
  LPBOOL,
  LPBYTE,
  LPCWSTR,
  LPDOUBLE,
  LPGUID,
  LPLPOLESTR,
  LPPROPBAG2,
  LPPROPVARIANT,
  LPUINT,
  LPULARGE_INTEGER,
  LPULONG,
  LPVARIANT,
  LPWICBitmapPaletteType,
  LPWICColor,
  LPWICInProcPointer,
  LPWICPixelFormatGUID,
  LPWICRect,
  LPWSTR,
  Optional,
  PCWSTR,
  REFCLSID,
  REFGUID,
  REFIID,
  REFWICPixelFormatGUID,
  UINT,
  ULONG,
  ULONG_PTR,
  WICBitmapAlphaChannelOption,
  WICBitmapCreateCacheOption,
  WICBitmapDitherType,
  WICBitmapEncoderCacheOption,
  WICBitmapInterpolationMode,
  WICBitmapPaletteType,
  WICBitmapTransformOptions,
  WICDecodeOptions,
  WICInProcPointer,
  WICSectionAccessLevel,
} from '../types/WindowsCodecs';

/**
 * Thin, lazy-loaded FFI bindings for `windowscodecs.dll` (Windows Imaging Component).
 *
 * Each static method corresponds one-to-one with a `windowscodecs.dll` export declared in
 * `Symbols`. WIC exposes its COM interfaces through flat `*_Proxy` exports — each proxy takes
 * the owning interface pointer as the first parameter, then the original method's parameters.
 * COM interface pointers are opaque tokens (`bigint`), obtained from the `**` out-parameters
 * of the create/get functions and passed back by value; you never dereference them locally.
 *
 * The first call to a method binds the underlying native symbol via `bun:ffi` and memoizes
 * it on the class for subsequent calls. For bulk, up-front binding, use `Preload`.
 *
 * @example
 * ```ts
 * import WindowsCodecs from './structs/WindowsCodecs';
 *
 * const out = Buffer.alloc(8);
 * WindowsCodecs.WICCreateImagingFactory_Proxy(0x0237, out.ptr!);
 * const factory = out.readBigUInt64LE(0);
 * ```
 */
class WindowsCodecs extends Win32 {
  protected static override name = 'windowscodecs.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DllCanUnloadNow: { args: [], returns: FFIType.i32 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IEnumString_Next_WIC_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IEnumString_Reset_WIC_Proxy: { args: [FFIType.u64], returns: FFIType.i32 },
    IPropertyBag2_Write_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapClipper_Initialize_Proxy: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapCodecInfo_DoesSupportAnimation_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapCodecInfo_DoesSupportLossless_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapCodecInfo_DoesSupportMultiframe_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapCodecInfo_GetContainerFormat_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapCodecInfo_GetDeviceManufacturer_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapCodecInfo_GetDeviceModels_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapCodecInfo_GetFileExtensions_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapCodecInfo_GetMimeTypes_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapDecoder_CopyPalette_Proxy: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    IWICBitmapDecoder_GetColorContexts_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapDecoder_GetDecoderInfo_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapDecoder_GetFrameCount_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapDecoder_GetFrame_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapDecoder_GetMetadataQueryReader_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapDecoder_GetPreview_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapDecoder_GetThumbnail_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapEncoder_Commit_Proxy: { args: [FFIType.u64], returns: FFIType.i32 },
    IWICBitmapEncoder_CreateNewFrame_Proxy: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapEncoder_GetEncoderInfo_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapEncoder_GetMetadataQueryWriter_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapEncoder_Initialize_Proxy: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    IWICBitmapEncoder_SetPalette_Proxy: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    IWICBitmapEncoder_SetThumbnail_Proxy: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    IWICBitmapFlipRotator_Initialize_Proxy: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    IWICBitmapFrameDecode_GetColorContexts_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapFrameDecode_GetMetadataQueryReader_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapFrameDecode_GetThumbnail_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapFrameEncode_Commit_Proxy: { args: [FFIType.u64], returns: FFIType.i32 },
    IWICBitmapFrameEncode_GetMetadataQueryWriter_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapFrameEncode_Initialize_Proxy: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    IWICBitmapFrameEncode_SetColorContexts_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapFrameEncode_SetResolution_Proxy: { args: [FFIType.u64, FFIType.f64, FFIType.f64], returns: FFIType.i32 },
    IWICBitmapFrameEncode_SetSize_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    IWICBitmapFrameEncode_SetThumbnail_Proxy: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    IWICBitmapFrameEncode_WriteSource_Proxy: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapLock_GetDataPointer_STA_Proxy: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapLock_GetStride_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapScaler_Initialize_Proxy: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    IWICBitmapSource_CopyPalette_Proxy: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    IWICBitmapSource_CopyPixels_Proxy: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapSource_GetPixelFormat_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapSource_GetResolution_Proxy: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmapSource_GetSize_Proxy: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmap_Lock_Proxy: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    IWICBitmap_SetPalette_Proxy: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    IWICBitmap_SetResolution_Proxy: { args: [FFIType.u64, FFIType.f64, FFIType.f64], returns: FFIType.i32 },
    IWICColorContext_InitializeFromMemory_Proxy: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    IWICComponentFactory_CreateMetadataWriterFromReader_Proxy: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICComponentFactory_CreateQueryWriterFromBlockWriter_Proxy: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICComponentInfo_GetAuthor_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICComponentInfo_GetCLSID_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICComponentInfo_GetFriendlyName_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICComponentInfo_GetSpecVersion_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICComponentInfo_GetVersion_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICFastMetadataEncoder_Commit_Proxy: { args: [FFIType.u64], returns: FFIType.i32 },
    IWICFastMetadataEncoder_GetMetadataQueryWriter_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICFormatConverter_Initialize_Proxy: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.f64, FFIType.u32], returns: FFIType.i32 },
    IWICImagingFactory_CreateBitmapClipper_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICImagingFactory_CreateBitmapFlipRotator_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICImagingFactory_CreateBitmapFromHBITMAP_Proxy: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    IWICImagingFactory_CreateBitmapFromHICON_Proxy: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICImagingFactory_CreateBitmapFromMemory_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICImagingFactory_CreateBitmapFromSource_Proxy: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    IWICImagingFactory_CreateBitmapScaler_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICImagingFactory_CreateBitmap_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    IWICImagingFactory_CreateComponentInfo_Proxy: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICImagingFactory_CreateDecoderFromFileHandle_Proxy: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    IWICImagingFactory_CreateDecoderFromFilename_Proxy: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    IWICImagingFactory_CreateDecoderFromStream_Proxy: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    IWICImagingFactory_CreateEncoder_Proxy: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICImagingFactory_CreateFastMetadataEncoderFromDecoder_Proxy: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICImagingFactory_CreateFastMetadataEncoderFromFrameDecode_Proxy: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICImagingFactory_CreateFormatConverter_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICImagingFactory_CreatePalette_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICImagingFactory_CreateQueryWriterFromReader_Proxy: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICImagingFactory_CreateQueryWriter_Proxy: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICImagingFactory_CreateStream_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICMetadataBlockReader_GetCount_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICMetadataBlockReader_GetReaderByIndex_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    IWICMetadataQueryReader_GetContainerFormat_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICMetadataQueryReader_GetEnumerator_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICMetadataQueryReader_GetLocation_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICMetadataQueryReader_GetMetadataByName_Proxy: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICMetadataQueryWriter_RemoveMetadataByName_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICMetadataQueryWriter_SetMetadataByName_Proxy: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICPalette_GetColorCount_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICPalette_GetColors_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICPalette_GetType_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICPalette_HasAlpha_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICPalette_InitializeCustom_Proxy: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    IWICPalette_InitializeFromBitmap_Proxy: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    IWICPalette_InitializeFromPalette_Proxy: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    IWICPalette_InitializePredefined_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    IWICPixelFormatInfo_GetBitsPerPixel_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICPixelFormatInfo_GetChannelCount_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IWICPixelFormatInfo_GetChannelMask_Proxy: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IWICStream_InitializeFromIStream_Proxy: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    IWICStream_InitializeFromMemory_Proxy: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WICConvertBitmapSource: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WICCreateBitmapFromSection: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WICCreateBitmapFromSectionEx: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WICCreateColorContext_Proxy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WICCreateImagingFactory_Proxy: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WICGetMetadataContentSize: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WICMapGuidToShortName: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WICMapSchemaToName: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WICMapShortNameToGuid: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WICMatchMetadataContent: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WICSerializeMetadataContent: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    WICSetEncoderFormat_Proxy: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllcanunloadnow
  public static DllCanUnloadNow(): HRESULT {
    return WindowsCodecs.Load('DllCanUnloadNow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllgetclassobject
  public static DllGetClassObject(rclsid: REFCLSID, riid: REFIID, ppv_out: Pointer): HRESULT {
    return WindowsCodecs.Load('DllGetClassObject')(rclsid, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-ienumstring-next-wic-proxy
  public static IEnumString_Next_WIC_Proxy(This: IEnumString, celt: ULONG, rgelt_out: LPLPOLESTR, pceltFetched_out: Optional<LPULONG>): HRESULT {
    return WindowsCodecs.Load('IEnumString_Next_WIC_Proxy')(This, celt, rgelt_out, pceltFetched_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-ienumstring-reset-wic-proxy
  public static IEnumString_Reset_WIC_Proxy(This: IEnumString): HRESULT {
    return WindowsCodecs.Load('IEnumString_Reset_WIC_Proxy')(This);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-ipropertybag2-write-proxy
  public static IPropertyBag2_Write_Proxy(This: IPropertyBag2, cProperties: ULONG, ppropBag: LPPROPBAG2, pvarValue: LPVARIANT): HRESULT {
    return WindowsCodecs.Load('IPropertyBag2_Write_Proxy')(This, cProperties, ppropBag, pvarValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapclipper-initialize-proxy
  public static IWICBitmapClipper_Initialize_Proxy(This: IWICBitmapClipper, pISource: Optional<IWICBitmapSource>, prc: LPWICRect): HRESULT {
    return WindowsCodecs.Load('IWICBitmapClipper_Initialize_Proxy')(This, pISource, prc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapcodecinfo-doessupportanimation-proxy
  public static IWICBitmapCodecInfo_DoesSupportAnimation_Proxy(This: IWICBitmapCodecInfo, pfSupportAnimation_out: LPBOOL): HRESULT {
    return WindowsCodecs.Load('IWICBitmapCodecInfo_DoesSupportAnimation_Proxy')(This, pfSupportAnimation_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapcodecinfo-doessupportlossless-proxy
  public static IWICBitmapCodecInfo_DoesSupportLossless_Proxy(This: IWICBitmapCodecInfo, pfSupportLossless_out: LPBOOL): HRESULT {
    return WindowsCodecs.Load('IWICBitmapCodecInfo_DoesSupportLossless_Proxy')(This, pfSupportLossless_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapcodecinfo-doessupportmultiframe-proxy
  public static IWICBitmapCodecInfo_DoesSupportMultiframe_Proxy(This: IWICBitmapCodecInfo, pfSupportMultiframe_out: LPBOOL): HRESULT {
    return WindowsCodecs.Load('IWICBitmapCodecInfo_DoesSupportMultiframe_Proxy')(This, pfSupportMultiframe_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapcodecinfo-getcontainerformat-proxy
  public static IWICBitmapCodecInfo_GetContainerFormat_Proxy(This: IWICBitmapCodecInfo, pguidContainerFormat_out: LPGUID): HRESULT {
    return WindowsCodecs.Load('IWICBitmapCodecInfo_GetContainerFormat_Proxy')(This, pguidContainerFormat_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapcodecinfo-getdevicemanufacturer-proxy
  public static IWICBitmapCodecInfo_GetDeviceManufacturer_Proxy(This: IWICBitmapCodecInfo, cchDeviceManufacturer: UINT, wzDeviceManufacturer_in_out: Optional<LPWSTR>, pcchActual_in_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('IWICBitmapCodecInfo_GetDeviceManufacturer_Proxy')(This, cchDeviceManufacturer, wzDeviceManufacturer_in_out, pcchActual_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapcodecinfo-getdevicemodels-proxy
  public static IWICBitmapCodecInfo_GetDeviceModels_Proxy(This: IWICBitmapCodecInfo, cchDeviceModels: UINT, wzDeviceModels_in_out: Optional<LPWSTR>, pcchActual_in_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('IWICBitmapCodecInfo_GetDeviceModels_Proxy')(This, cchDeviceModels, wzDeviceModels_in_out, pcchActual_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapcodecinfo-getfileextensions-proxy
  public static IWICBitmapCodecInfo_GetFileExtensions_Proxy(This: IWICBitmapCodecInfo, cchFileExtensions: UINT, wzFileExtensions_in_out: Optional<LPWSTR>, pcchActual_in_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('IWICBitmapCodecInfo_GetFileExtensions_Proxy')(This, cchFileExtensions, wzFileExtensions_in_out, pcchActual_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapcodecinfo-getmimetypes-proxy
  public static IWICBitmapCodecInfo_GetMimeTypes_Proxy(This: IWICBitmapCodecInfo, cchMimeTypes: UINT, wzMimeTypes_out: Optional<LPWSTR>, pcchActual_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('IWICBitmapCodecInfo_GetMimeTypes_Proxy')(This, cchMimeTypes, wzMimeTypes_out, pcchActual_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapdecoder-copypalette-proxy
  public static IWICBitmapDecoder_CopyPalette_Proxy(This: IWICBitmapDecoder, pIPalette: Optional<IWICPalette>): HRESULT {
    return WindowsCodecs.Load('IWICBitmapDecoder_CopyPalette_Proxy')(This, pIPalette);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapdecoder-getcolorcontexts-proxy
  public static IWICBitmapDecoder_GetColorContexts_Proxy(This: IWICBitmapDecoder, cCount: UINT, ppIColorContexts_in_out: Optional<Pointer>, pcActualCount_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('IWICBitmapDecoder_GetColorContexts_Proxy')(This, cCount, ppIColorContexts_in_out, pcActualCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapdecoder-getdecoderinfo-proxy
  public static IWICBitmapDecoder_GetDecoderInfo_Proxy(This: IWICBitmapDecoder, ppIDecoderInfo_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICBitmapDecoder_GetDecoderInfo_Proxy')(This, ppIDecoderInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapdecoder-getframecount-proxy
  public static IWICBitmapDecoder_GetFrameCount_Proxy(This: IWICBitmapDecoder, pCount_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('IWICBitmapDecoder_GetFrameCount_Proxy')(This, pCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapdecoder-getframe-proxy
  public static IWICBitmapDecoder_GetFrame_Proxy(This: IWICBitmapDecoder, index: UINT, ppIBitmapFrame_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICBitmapDecoder_GetFrame_Proxy')(This, index, ppIBitmapFrame_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapdecoder-getmetadataqueryreader-proxy
  public static IWICBitmapDecoder_GetMetadataQueryReader_Proxy(This: IWICBitmapDecoder, ppIMetadataQueryReader_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICBitmapDecoder_GetMetadataQueryReader_Proxy')(This, ppIMetadataQueryReader_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapdecoder-getpreview-proxy
  public static IWICBitmapDecoder_GetPreview_Proxy(This: IWICBitmapDecoder, ppIBitmapSource_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICBitmapDecoder_GetPreview_Proxy')(This, ppIBitmapSource_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapdecoder-getthumbnail-proxy
  public static IWICBitmapDecoder_GetThumbnail_Proxy(This: IWICBitmapDecoder, ppIThumbnail_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICBitmapDecoder_GetThumbnail_Proxy')(This, ppIThumbnail_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapencoder-commit-proxy
  public static IWICBitmapEncoder_Commit_Proxy(This: IWICBitmapEncoder): HRESULT {
    return WindowsCodecs.Load('IWICBitmapEncoder_Commit_Proxy')(This);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapencoder-createnewframe-proxy
  public static IWICBitmapEncoder_CreateNewFrame_Proxy(This: IWICBitmapEncoder, ppIFrameEncode_out: Pointer, ppIEncoderOptions_in_out: Optional<Pointer>): HRESULT {
    return WindowsCodecs.Load('IWICBitmapEncoder_CreateNewFrame_Proxy')(This, ppIFrameEncode_out, ppIEncoderOptions_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapencoder-getencoderinfo-proxy
  public static IWICBitmapEncoder_GetEncoderInfo_Proxy(This: IWICBitmapEncoder, ppIEncoderInfo_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICBitmapEncoder_GetEncoderInfo_Proxy')(This, ppIEncoderInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapencoder-getmetadataquerywriter-proxy
  public static IWICBitmapEncoder_GetMetadataQueryWriter_Proxy(This: IWICBitmapEncoder, ppIMetadataQueryWriter_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICBitmapEncoder_GetMetadataQueryWriter_Proxy')(This, ppIMetadataQueryWriter_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapencoder-initialize-proxy
  public static IWICBitmapEncoder_Initialize_Proxy(This: IWICBitmapEncoder, pIStream: Optional<IStream>, cacheOption: WICBitmapEncoderCacheOption): HRESULT {
    return WindowsCodecs.Load('IWICBitmapEncoder_Initialize_Proxy')(This, pIStream, cacheOption);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapencoder-setpalette-proxy
  public static IWICBitmapEncoder_SetPalette_Proxy(This: IWICBitmapEncoder, pIPalette: Optional<IWICPalette>): HRESULT {
    return WindowsCodecs.Load('IWICBitmapEncoder_SetPalette_Proxy')(This, pIPalette);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapencoder-setthumbnail-proxy
  public static IWICBitmapEncoder_SetThumbnail_Proxy(This: IWICBitmapEncoder, pIThumbnail: Optional<IWICBitmapSource>): HRESULT {
    return WindowsCodecs.Load('IWICBitmapEncoder_SetThumbnail_Proxy')(This, pIThumbnail);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapfliprotator-initialize-proxy
  public static IWICBitmapFlipRotator_Initialize_Proxy(This: IWICBitmapFlipRotator, pISource: Optional<IWICBitmapSource>, options: WICBitmapTransformOptions): HRESULT {
    return WindowsCodecs.Load('IWICBitmapFlipRotator_Initialize_Proxy')(This, pISource, options);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapframedecode-getcolorcontexts-proxy
  public static IWICBitmapFrameDecode_GetColorContexts_Proxy(This: IWICBitmapFrameDecode, cCount: UINT, ppIColorContexts_in_out: Optional<Pointer>, pcActualCount_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('IWICBitmapFrameDecode_GetColorContexts_Proxy')(This, cCount, ppIColorContexts_in_out, pcActualCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapframedecode-getmetadataqueryreader-proxy
  public static IWICBitmapFrameDecode_GetMetadataQueryReader_Proxy(This: IWICBitmapFrameDecode, ppIMetadataQueryReader_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICBitmapFrameDecode_GetMetadataQueryReader_Proxy')(This, ppIMetadataQueryReader_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapframedecode-getthumbnail-proxy
  public static IWICBitmapFrameDecode_GetThumbnail_Proxy(This: IWICBitmapFrameDecode, ppIThumbnail_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICBitmapFrameDecode_GetThumbnail_Proxy')(This, ppIThumbnail_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapframeencode-commit-proxy
  public static IWICBitmapFrameEncode_Commit_Proxy(This: IWICBitmapFrameEncode): HRESULT {
    return WindowsCodecs.Load('IWICBitmapFrameEncode_Commit_Proxy')(This);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapframeencode-getmetadataquerywriter-proxy
  public static IWICBitmapFrameEncode_GetMetadataQueryWriter_Proxy(This: IWICBitmapFrameEncode, ppIMetadataQueryWriter_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICBitmapFrameEncode_GetMetadataQueryWriter_Proxy')(This, ppIMetadataQueryWriter_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapframeencode-initialize-proxy
  public static IWICBitmapFrameEncode_Initialize_Proxy(This: IWICBitmapFrameEncode, pIEncoderOptions: Optional<IPropertyBag2>): HRESULT {
    return WindowsCodecs.Load('IWICBitmapFrameEncode_Initialize_Proxy')(This, pIEncoderOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapframeencode-setcolorcontexts-proxy
  public static IWICBitmapFrameEncode_SetColorContexts_Proxy(This: IWICBitmapFrameEncode, cCount: UINT, ppIColorContext: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICBitmapFrameEncode_SetColorContexts_Proxy')(This, cCount, ppIColorContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapframeencode-setresolution-proxy
  public static IWICBitmapFrameEncode_SetResolution_Proxy(This: IWICBitmapFrameEncode, dpiX: DOUBLE, dpiY: DOUBLE): HRESULT {
    return WindowsCodecs.Load('IWICBitmapFrameEncode_SetResolution_Proxy')(This, dpiX, dpiY);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapframeencode-setsize-proxy
  public static IWICBitmapFrameEncode_SetSize_Proxy(This: IWICBitmapFrameEncode, uiWidth: UINT, uiHeight: UINT): HRESULT {
    return WindowsCodecs.Load('IWICBitmapFrameEncode_SetSize_Proxy')(This, uiWidth, uiHeight);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapframeencode-setthumbnail-proxy
  public static IWICBitmapFrameEncode_SetThumbnail_Proxy(This: IWICBitmapFrameEncode, pIThumbnail: Optional<IWICBitmapSource>): HRESULT {
    return WindowsCodecs.Load('IWICBitmapFrameEncode_SetThumbnail_Proxy')(This, pIThumbnail);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapframeencode-writesource-proxy
  public static IWICBitmapFrameEncode_WriteSource_Proxy(This: IWICBitmapFrameEncode, pIBitmapSource: Optional<IWICBitmapSource>, prc: Optional<LPWICRect>): HRESULT {
    return WindowsCodecs.Load('IWICBitmapFrameEncode_WriteSource_Proxy')(This, pIBitmapSource, prc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmaplock-getdatapointer-sta-proxy
  public static IWICBitmapLock_GetDataPointer_STA_Proxy(This: IWICBitmapLock, pcbBufferSize_out: LPUINT, ppbData_out: LPWICInProcPointer): HRESULT {
    return WindowsCodecs.Load('IWICBitmapLock_GetDataPointer_STA_Proxy')(This, pcbBufferSize_out, ppbData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmaplock-getstride-proxy
  public static IWICBitmapLock_GetStride_Proxy(This: IWICBitmapLock, pcbStride_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('IWICBitmapLock_GetStride_Proxy')(This, pcbStride_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapscaler-initialize-proxy
  public static IWICBitmapScaler_Initialize_Proxy(This: IWICBitmapScaler, pISource: Optional<IWICBitmapSource>, uiWidth: UINT, uiHeight: UINT, mode: WICBitmapInterpolationMode): HRESULT {
    return WindowsCodecs.Load('IWICBitmapScaler_Initialize_Proxy')(This, pISource, uiWidth, uiHeight, mode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapsource-copypalette-proxy
  public static IWICBitmapSource_CopyPalette_Proxy(This: IWICBitmapSource, pIPalette: Optional<IWICPalette>): HRESULT {
    return WindowsCodecs.Load('IWICBitmapSource_CopyPalette_Proxy')(This, pIPalette);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapsource-copypixels-proxy
  public static IWICBitmapSource_CopyPixels_Proxy(This: IWICBitmapSource, prc: Optional<LPWICRect>, cbStride: UINT, cbBufferSize: UINT, pbBuffer_out: LPBYTE): HRESULT {
    return WindowsCodecs.Load('IWICBitmapSource_CopyPixels_Proxy')(This, prc, cbStride, cbBufferSize, pbBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapsource-getpixelformat-proxy
  public static IWICBitmapSource_GetPixelFormat_Proxy(This: IWICBitmapSource, pPixelFormat_out: LPWICPixelFormatGUID): HRESULT {
    return WindowsCodecs.Load('IWICBitmapSource_GetPixelFormat_Proxy')(This, pPixelFormat_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapsource-getresolution-proxy
  public static IWICBitmapSource_GetResolution_Proxy(This: IWICBitmapSource, pDpiX_out: LPDOUBLE, pDpiY_out: LPDOUBLE): HRESULT {
    return WindowsCodecs.Load('IWICBitmapSource_GetResolution_Proxy')(This, pDpiX_out, pDpiY_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmapsource-getsize-proxy
  public static IWICBitmapSource_GetSize_Proxy(This: IWICBitmapSource, puiWidth_out: LPUINT, puiHeight_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('IWICBitmapSource_GetSize_Proxy')(This, puiWidth_out, puiHeight_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmap-lock-proxy
  public static IWICBitmap_Lock_Proxy(This: IWICBitmap, prcLock: Optional<LPWICRect>, flags: DWORD, ppILock_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICBitmap_Lock_Proxy')(This, prcLock, flags, ppILock_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmap-setpalette-proxy
  public static IWICBitmap_SetPalette_Proxy(This: IWICBitmap, pIPalette: Optional<IWICPalette>): HRESULT {
    return WindowsCodecs.Load('IWICBitmap_SetPalette_Proxy')(This, pIPalette);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicbitmap-setresolution-proxy
  public static IWICBitmap_SetResolution_Proxy(This: IWICBitmap, dpiX: DOUBLE, dpiY: DOUBLE): HRESULT {
    return WindowsCodecs.Load('IWICBitmap_SetResolution_Proxy')(This, dpiX, dpiY);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwiccolorcontext-initializefrommemory-proxy
  public static IWICColorContext_InitializeFromMemory_Proxy(This: IWICColorContext, pbBuffer: LPBYTE, cbBufferSize: UINT): HRESULT {
    return WindowsCodecs.Load('IWICColorContext_InitializeFromMemory_Proxy')(This, pbBuffer, cbBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwiccomponentfactory-createmetadatawriterfromreader-proxy
  public static IWICComponentFactory_CreateMetadataWriterFromReader_Proxy(This: IWICComponentFactory, pIReader: Optional<IWICMetadataReader>, pguidVendor: Optional<LPGUID>, ppIWriter_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICComponentFactory_CreateMetadataWriterFromReader_Proxy')(This, pIReader, pguidVendor, ppIWriter_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwiccomponentfactory-createquerywriterfromblockwriter-proxy
  public static IWICComponentFactory_CreateQueryWriterFromBlockWriter_Proxy(This: IWICComponentFactory, pIBlockWriter: Optional<IWICMetadataBlockWriter>, ppIQueryWriter_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICComponentFactory_CreateQueryWriterFromBlockWriter_Proxy')(This, pIBlockWriter, ppIQueryWriter_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwiccomponentinfo-getauthor-proxy
  public static IWICComponentInfo_GetAuthor_Proxy(This: IWICComponentInfo, cchAuthor: UINT, wzAuthor_in_out: Optional<LPWSTR>, pcchActual_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('IWICComponentInfo_GetAuthor_Proxy')(This, cchAuthor, wzAuthor_in_out, pcchActual_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwiccomponentinfo-getclsid-proxy
  public static IWICComponentInfo_GetCLSID_Proxy(This: IWICComponentInfo, pclsid_out: LPGUID): HRESULT {
    return WindowsCodecs.Load('IWICComponentInfo_GetCLSID_Proxy')(This, pclsid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwiccomponentinfo-getfriendlyname-proxy
  public static IWICComponentInfo_GetFriendlyName_Proxy(This: IWICComponentInfo, cchFriendlyName: UINT, wzFriendlyName_in_out: Optional<LPWSTR>, pcchActual_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('IWICComponentInfo_GetFriendlyName_Proxy')(This, cchFriendlyName, wzFriendlyName_in_out, pcchActual_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwiccomponentinfo-getspecversion-proxy
  public static IWICComponentInfo_GetSpecVersion_Proxy(This: IWICComponentInfo, cchSpecVersion: UINT, wzSpecVersion_in_out: Optional<LPWSTR>, pcchActual_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('IWICComponentInfo_GetSpecVersion_Proxy')(This, cchSpecVersion, wzSpecVersion_in_out, pcchActual_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwiccomponentinfo-getversion-proxy
  public static IWICComponentInfo_GetVersion_Proxy(This: IWICComponentInfo, cchVersion: UINT, wzVersion_in_out: Optional<LPWSTR>, pcchActual_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('IWICComponentInfo_GetVersion_Proxy')(This, cchVersion, wzVersion_in_out, pcchActual_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicfastmetadataencoder-commit-proxy
  public static IWICFastMetadataEncoder_Commit_Proxy(This: IWICFastMetadataEncoder): HRESULT {
    return WindowsCodecs.Load('IWICFastMetadataEncoder_Commit_Proxy')(This);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicfastmetadataencoder-getmetadataquerywriter-proxy
  public static IWICFastMetadataEncoder_GetMetadataQueryWriter_Proxy(This: IWICFastMetadataEncoder, ppIMetadataQueryWriter_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICFastMetadataEncoder_GetMetadataQueryWriter_Proxy')(This, ppIMetadataQueryWriter_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicformatconverter-initialize-proxy
  public static IWICFormatConverter_Initialize_Proxy(
    This: IWICFormatConverter,
    pISource: Optional<IWICBitmapSource>,
    dstFormat: REFWICPixelFormatGUID,
    dither: WICBitmapDitherType,
    pIPalette: Optional<IWICPalette>,
    alphaThresholdPercent: DOUBLE,
    paletteTranslate: WICBitmapPaletteType,
  ): HRESULT {
    return WindowsCodecs.Load('IWICFormatConverter_Initialize_Proxy')(This, pISource, dstFormat, dither, pIPalette, alphaThresholdPercent, paletteTranslate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicimagingfactory-createbitmapclipper-proxy
  public static IWICImagingFactory_CreateBitmapClipper_Proxy(pFactory: IWICImagingFactory, ppIBitmapClipper_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICImagingFactory_CreateBitmapClipper_Proxy')(pFactory, ppIBitmapClipper_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicimagingfactory-createbitmapfliprotator-proxy
  public static IWICImagingFactory_CreateBitmapFlipRotator_Proxy(pFactory: IWICImagingFactory, ppIBitmapFlipRotator_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICImagingFactory_CreateBitmapFlipRotator_Proxy')(pFactory, ppIBitmapFlipRotator_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicimagingfactory-createbitmapfromhbitmap-proxy
  public static IWICImagingFactory_CreateBitmapFromHBITMAP_Proxy(pFactory: IWICImagingFactory, hBitmap: HBITMAP, hPalette: Optional<HPALETTE>, options: WICBitmapAlphaChannelOption, ppIBitmap_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICImagingFactory_CreateBitmapFromHBITMAP_Proxy')(pFactory, hBitmap, hPalette, options, ppIBitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicimagingfactory-createbitmapfromhicon-proxy
  public static IWICImagingFactory_CreateBitmapFromHICON_Proxy(pFactory: IWICImagingFactory, hIcon: HICON, ppIBitmap_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICImagingFactory_CreateBitmapFromHICON_Proxy')(pFactory, hIcon, ppIBitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicimagingfactory-createbitmapfrommemory-proxy
  public static IWICImagingFactory_CreateBitmapFromMemory_Proxy(
    pFactory: IWICImagingFactory,
    uiWidth: UINT,
    uiHeight: UINT,
    pixelFormat: REFWICPixelFormatGUID,
    cbStride: UINT,
    cbBufferSize: UINT,
    pbBuffer: LPBYTE,
    ppIBitmap_out: Pointer,
  ): HRESULT {
    return WindowsCodecs.Load('IWICImagingFactory_CreateBitmapFromMemory_Proxy')(pFactory, uiWidth, uiHeight, pixelFormat, cbStride, cbBufferSize, pbBuffer, ppIBitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicimagingfactory-createbitmapfromsource-proxy
  public static IWICImagingFactory_CreateBitmapFromSource_Proxy(pFactory: IWICImagingFactory, pIBitmapSource: Optional<IWICBitmapSource>, option: WICBitmapCreateCacheOption, ppIBitmap_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICImagingFactory_CreateBitmapFromSource_Proxy')(pFactory, pIBitmapSource, option, ppIBitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicimagingfactory-createbitmapscaler-proxy
  public static IWICImagingFactory_CreateBitmapScaler_Proxy(pFactory: IWICImagingFactory, ppIBitmapScaler_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICImagingFactory_CreateBitmapScaler_Proxy')(pFactory, ppIBitmapScaler_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicimagingfactory-createbitmap-proxy
  public static IWICImagingFactory_CreateBitmap_Proxy(pFactory: IWICImagingFactory, uiWidth: UINT, uiHeight: UINT, pixelFormat: REFWICPixelFormatGUID, option: WICBitmapCreateCacheOption, ppIBitmap_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICImagingFactory_CreateBitmap_Proxy')(pFactory, uiWidth, uiHeight, pixelFormat, option, ppIBitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicimagingfactory-createcomponentinfo-proxy
  public static IWICImagingFactory_CreateComponentInfo_Proxy(pFactory: IWICImagingFactory, clsidComponent: REFCLSID, ppIInfo_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICImagingFactory_CreateComponentInfo_Proxy')(pFactory, clsidComponent, ppIInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicimagingfactory-createdecoderfromfilehandle-proxy
  public static IWICImagingFactory_CreateDecoderFromFileHandle_Proxy(pFactory: IWICImagingFactory, hFile: ULONG_PTR, pguidVendor: Optional<LPGUID>, metadataOptions: WICDecodeOptions, ppIDecoder_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICImagingFactory_CreateDecoderFromFileHandle_Proxy')(pFactory, hFile, pguidVendor, metadataOptions, ppIDecoder_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicimagingfactory-createdecoderfromfilename-proxy
  public static IWICImagingFactory_CreateDecoderFromFilename_Proxy(
    pFactory: IWICImagingFactory,
    wzFilename: LPCWSTR,
    pguidVendor: Optional<LPGUID>,
    dwDesiredAccess: DWORD,
    metadataOptions: WICDecodeOptions,
    ppIDecoder_out: Pointer,
  ): HRESULT {
    return WindowsCodecs.Load('IWICImagingFactory_CreateDecoderFromFilename_Proxy')(pFactory, wzFilename, pguidVendor, dwDesiredAccess, metadataOptions, ppIDecoder_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicimagingfactory-createdecoderfromstream-proxy
  public static IWICImagingFactory_CreateDecoderFromStream_Proxy(pFactory: IWICImagingFactory, pIStream: Optional<IStream>, pguidVendor: Optional<LPGUID>, metadataOptions: WICDecodeOptions, ppIDecoder_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICImagingFactory_CreateDecoderFromStream_Proxy')(pFactory, pIStream, pguidVendor, metadataOptions, ppIDecoder_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicimagingfactory-createencoder-proxy
  public static IWICImagingFactory_CreateEncoder_Proxy(pFactory: IWICImagingFactory, guidContainerFormat: REFGUID, pguidVendor: Optional<LPGUID>, ppIEncoder_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICImagingFactory_CreateEncoder_Proxy')(pFactory, guidContainerFormat, pguidVendor, ppIEncoder_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicimagingfactory-createfastmetadataencoderfromdecoder-proxy
  public static IWICImagingFactory_CreateFastMetadataEncoderFromDecoder_Proxy(pFactory: IWICImagingFactory, pIDecoder: Optional<IWICBitmapDecoder>, ppIFME_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICImagingFactory_CreateFastMetadataEncoderFromDecoder_Proxy')(pFactory, pIDecoder, ppIFME_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicimagingfactory-createfastmetadataencoderfromframedecode-proxy
  public static IWICImagingFactory_CreateFastMetadataEncoderFromFrameDecode_Proxy(pFactory: IWICImagingFactory, pIFrameDecoder: Optional<IWICBitmapFrameDecode>, ppIFME_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICImagingFactory_CreateFastMetadataEncoderFromFrameDecode_Proxy')(pFactory, pIFrameDecoder, ppIFME_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicimagingfactory-createformatconverter-proxy
  public static IWICImagingFactory_CreateFormatConverter_Proxy(pFactory: IWICImagingFactory, ppIFormatConverter_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICImagingFactory_CreateFormatConverter_Proxy')(pFactory, ppIFormatConverter_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicimagingfactory-createpalette-proxy
  public static IWICImagingFactory_CreatePalette_Proxy(pFactory: IWICImagingFactory, ppIPalette_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICImagingFactory_CreatePalette_Proxy')(pFactory, ppIPalette_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicimagingfactory-createquerywriterfromreader-proxy
  public static IWICImagingFactory_CreateQueryWriterFromReader_Proxy(pFactory: IWICImagingFactory, pIQueryReader: Optional<IWICMetadataQueryReader>, pguidVendor: Optional<LPGUID>, ppIQueryWriter_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICImagingFactory_CreateQueryWriterFromReader_Proxy')(pFactory, pIQueryReader, pguidVendor, ppIQueryWriter_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicimagingfactory-createquerywriter-proxy
  public static IWICImagingFactory_CreateQueryWriter_Proxy(pFactory: IWICImagingFactory, guidMetadataFormat: REFGUID, pguidVendor: Optional<LPGUID>, ppIQueryWriter_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICImagingFactory_CreateQueryWriter_Proxy')(pFactory, guidMetadataFormat, pguidVendor, ppIQueryWriter_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicimagingfactory-createstream-proxy
  public static IWICImagingFactory_CreateStream_Proxy(pFactory: IWICImagingFactory, ppIWICStream_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICImagingFactory_CreateStream_Proxy')(pFactory, ppIWICStream_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicmetadatablockreader-getcount-proxy
  public static IWICMetadataBlockReader_GetCount_Proxy(This: IWICMetadataBlockReader, pcCount_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('IWICMetadataBlockReader_GetCount_Proxy')(This, pcCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicmetadatablockreader-getreaderbyindex-proxy
  public static IWICMetadataBlockReader_GetReaderByIndex_Proxy(This: IWICMetadataBlockReader, nIndex: UINT, ppIMetadataReader_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICMetadataBlockReader_GetReaderByIndex_Proxy')(This, nIndex, ppIMetadataReader_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicmetadataqueryreader-getcontainerformat-proxy
  public static IWICMetadataQueryReader_GetContainerFormat_Proxy(This: IWICMetadataQueryReader, pguidContainerFormat_out: LPGUID): HRESULT {
    return WindowsCodecs.Load('IWICMetadataQueryReader_GetContainerFormat_Proxy')(This, pguidContainerFormat_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicmetadataqueryreader-getenumerator-proxy
  public static IWICMetadataQueryReader_GetEnumerator_Proxy(This: IWICMetadataQueryReader, ppIEnumString_out: Pointer): HRESULT {
    return WindowsCodecs.Load('IWICMetadataQueryReader_GetEnumerator_Proxy')(This, ppIEnumString_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicmetadataqueryreader-getlocation-proxy
  public static IWICMetadataQueryReader_GetLocation_Proxy(This: IWICMetadataQueryReader, cchMaxLength: UINT, wzNamespace_in_out: Optional<LPWSTR>, pcchActualLength_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('IWICMetadataQueryReader_GetLocation_Proxy')(This, cchMaxLength, wzNamespace_in_out, pcchActualLength_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicmetadataqueryreader-getmetadatabyname-proxy
  public static IWICMetadataQueryReader_GetMetadataByName_Proxy(This: IWICMetadataQueryReader, wzName: LPCWSTR, pvarValue_in_out: Optional<LPPROPVARIANT>): HRESULT {
    return WindowsCodecs.Load('IWICMetadataQueryReader_GetMetadataByName_Proxy')(This, wzName, pvarValue_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicmetadataquerywriter-removemetadatabyname-proxy
  public static IWICMetadataQueryWriter_RemoveMetadataByName_Proxy(This: IWICMetadataQueryWriter, wzName: LPCWSTR): HRESULT {
    return WindowsCodecs.Load('IWICMetadataQueryWriter_RemoveMetadataByName_Proxy')(This, wzName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicmetadataquerywriter-setmetadatabyname-proxy
  public static IWICMetadataQueryWriter_SetMetadataByName_Proxy(This: IWICMetadataQueryWriter, wzName: LPCWSTR, pvarValue: LPPROPVARIANT): HRESULT {
    return WindowsCodecs.Load('IWICMetadataQueryWriter_SetMetadataByName_Proxy')(This, wzName, pvarValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicpalette-getcolorcount-proxy
  public static IWICPalette_GetColorCount_Proxy(This: IWICPalette, pcCount_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('IWICPalette_GetColorCount_Proxy')(This, pcCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicpalette-getcolors-proxy
  public static IWICPalette_GetColors_Proxy(This: IWICPalette, colorCount: UINT, pColors_out: LPWICColor, pcActualColors_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('IWICPalette_GetColors_Proxy')(This, colorCount, pColors_out, pcActualColors_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicpalette-gettype-proxy
  public static IWICPalette_GetType_Proxy(This: IWICPalette, pePaletteType_out: LPWICBitmapPaletteType): HRESULT {
    return WindowsCodecs.Load('IWICPalette_GetType_Proxy')(This, pePaletteType_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicpalette-hasalpha-proxy
  public static IWICPalette_HasAlpha_Proxy(This: IWICPalette, pfHasAlpha_out: LPBOOL): HRESULT {
    return WindowsCodecs.Load('IWICPalette_HasAlpha_Proxy')(This, pfHasAlpha_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicpalette-initializecustom-proxy
  public static IWICPalette_InitializeCustom_Proxy(This: IWICPalette, pColors: LPWICColor, colorCount: UINT): HRESULT {
    return WindowsCodecs.Load('IWICPalette_InitializeCustom_Proxy')(This, pColors, colorCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicpalette-initializefrombitmap-proxy
  public static IWICPalette_InitializeFromBitmap_Proxy(This: IWICPalette, pISurface: Optional<IWICBitmapSource>, colorCount: UINT, fAddTransparentColor: BOOL): HRESULT {
    return WindowsCodecs.Load('IWICPalette_InitializeFromBitmap_Proxy')(This, pISurface, colorCount, fAddTransparentColor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicpalette-initializefrompalette-proxy
  public static IWICPalette_InitializeFromPalette_Proxy(This: IWICPalette, pIMILPalette: Optional<IWICPalette>): HRESULT {
    return WindowsCodecs.Load('IWICPalette_InitializeFromPalette_Proxy')(This, pIMILPalette);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicpalette-initializepredefined-proxy
  public static IWICPalette_InitializePredefined_Proxy(This: IWICPalette, ePaletteType: WICBitmapPaletteType, fAddTransparentColor: BOOL): HRESULT {
    return WindowsCodecs.Load('IWICPalette_InitializePredefined_Proxy')(This, ePaletteType, fAddTransparentColor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicpixelformatinfo-getbitsperpixel-proxy
  public static IWICPixelFormatInfo_GetBitsPerPixel_Proxy(This: IWICPixelFormatInfo, puiBitsPerPixel_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('IWICPixelFormatInfo_GetBitsPerPixel_Proxy')(This, puiBitsPerPixel_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicpixelformatinfo-getchannelcount-proxy
  public static IWICPixelFormatInfo_GetChannelCount_Proxy(This: IWICPixelFormatInfo, puiChannelCount_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('IWICPixelFormatInfo_GetChannelCount_Proxy')(This, puiChannelCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicpixelformatinfo-getchannelmask-proxy
  public static IWICPixelFormatInfo_GetChannelMask_Proxy(This: IWICPixelFormatInfo, uiChannelIndex: UINT, cbMaskBuffer: UINT, pbMaskBuffer_in_out: Optional<LPBYTE>, pcbActual_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('IWICPixelFormatInfo_GetChannelMask_Proxy')(This, uiChannelIndex, cbMaskBuffer, pbMaskBuffer_in_out, pcbActual_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicstream-initializefromistream-proxy
  public static IWICStream_InitializeFromIStream_Proxy(This: IWICStream, pIStream: Optional<IStream>): HRESULT {
    return WindowsCodecs.Load('IWICStream_InitializeFromIStream_Proxy')(This, pIStream);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-iwicstream-initializefrommemory-proxy
  public static IWICStream_InitializeFromMemory_Proxy(This: IWICStream, pbBuffer: WICInProcPointer, cbBufferSize: DWORD): HRESULT {
    return WindowsCodecs.Load('IWICStream_InitializeFromMemory_Proxy')(This, pbBuffer, cbBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincodec/nf-wincodec-wicconvertbitmapsource
  public static WICConvertBitmapSource(dstFormat: REFWICPixelFormatGUID, pISrc: IWICBitmapSource, ppIDst_out: Pointer): HRESULT {
    return WindowsCodecs.Load('WICConvertBitmapSource')(dstFormat, pISrc, ppIDst_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincodec/nf-wincodec-wiccreatebitmapfromsection
  public static WICCreateBitmapFromSection(width: UINT, height: UINT, pixelFormat: REFWICPixelFormatGUID, hSection: HANDLE, stride: UINT, offset: UINT, ppIBitmap_out: Pointer): HRESULT {
    return WindowsCodecs.Load('WICCreateBitmapFromSection')(width, height, pixelFormat, hSection, stride, offset, ppIBitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincodec/nf-wincodec-wiccreatebitmapfromsectionex
  public static WICCreateBitmapFromSectionEx(width: UINT, height: UINT, pixelFormat: REFWICPixelFormatGUID, hSection: HANDLE, stride: UINT, offset: UINT, desiredAccessLevel: WICSectionAccessLevel, ppIBitmap_out: Pointer): HRESULT {
    return WindowsCodecs.Load('WICCreateBitmapFromSectionEx')(width, height, pixelFormat, hSection, stride, offset, desiredAccessLevel, ppIBitmap_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-wiccreatecolorcontext-proxy
  public static WICCreateColorContext_Proxy(pICodecFactory: IWICImagingFactory, ppIColorContext_out: Pointer): HRESULT {
    return WindowsCodecs.Load('WICCreateColorContext_Proxy')(pICodecFactory, ppIColorContext_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-wiccreateimagingfactory-proxy
  public static WICCreateImagingFactory_Proxy(SDKVersion: UINT, ppIImagingFactory_out: Pointer): HRESULT {
    return WindowsCodecs.Load('WICCreateImagingFactory_Proxy')(SDKVersion, ppIImagingFactory_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincodecsdk/nf-wincodecsdk-wicgetmetadatacontentsize
  public static WICGetMetadataContentSize(guidContainerFormat: REFGUID, pIWriter: IWICMetadataWriter, pcbSize_out: LPULARGE_INTEGER): HRESULT {
    return WindowsCodecs.Load('WICGetMetadataContentSize')(guidContainerFormat, pIWriter, pcbSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincodec/nf-wincodec-wicmapguidtoshortname
  public static WICMapGuidToShortName(guid: REFGUID, cchName: UINT, wzName_in_out: Optional<LPWSTR>, pcchActual_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('WICMapGuidToShortName')(guid, cchName, wzName_in_out, pcchActual_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincodec/nf-wincodec-wicmapschematoname
  public static WICMapSchemaToName(guidMetadataFormat: REFGUID, pwzSchema: LPWSTR, cchName: UINT, wzName_in_out: Optional<LPWSTR>, pcchActual_out: LPUINT): HRESULT {
    return WindowsCodecs.Load('WICMapSchemaToName')(guidMetadataFormat, pwzSchema, cchName, wzName_in_out, pcchActual_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincodec/nf-wincodec-wicmapshortnametoguid
  public static WICMapShortNameToGuid(wzName: PCWSTR, pguid_out: LPGUID): HRESULT {
    return WindowsCodecs.Load('WICMapShortNameToGuid')(wzName, pguid_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincodecsdk/nf-wincodecsdk-wicmatchmetadatacontent
  public static WICMatchMetadataContent(guidContainerFormat: REFGUID, pguidVendor: Optional<LPGUID>, pIStream: IStream, pguidMetadataFormat_out: LPGUID): HRESULT {
    return WindowsCodecs.Load('WICMatchMetadataContent')(guidContainerFormat, pguidVendor, pIStream, pguidMetadataFormat_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wincodecsdk/nf-wincodecsdk-wicserializemetadatacontent
  public static WICSerializeMetadataContent(guidContainerFormat: REFGUID, pIWriter: IWICMetadataWriter, dwPersistOptions: DWORD, pIStream: IStream): HRESULT {
    return WindowsCodecs.Load('WICSerializeMetadataContent')(guidContainerFormat, pIWriter, dwPersistOptions, pIStream);
  }

  // https://learn.microsoft.com/en-us/windows/win32/wic/-wic-codec-wicsetencoderformat-proxy
  public static WICSetEncoderFormat_Proxy(pSourceIn: IWICBitmapSource, pIPalette: IWICPalette, pIFrameEncode: IWICBitmapFrameEncode, ppSourceOut_out: Pointer): HRESULT {
    return WindowsCodecs.Load('WICSetEncoderFormat_Proxy')(pSourceIn, pIPalette, pIFrameEncode, ppSourceOut_out);
  }
}

export default WindowsCodecs;
