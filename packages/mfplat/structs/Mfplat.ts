import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  DWORD,
  HANDLE,
  HRESULT,
  IClassFactory,
  IMFActivate,
  IMFAsyncCallback,
  IMFAsyncResult,
  IMFAttributes,
  IMFByteStream,
  IMFContentProtectionDevice,
  IMFDXGIDeviceManager,
  IMFMediaBuffer,
  IMFMediaType,
  IMFPresentationDescriptor,
  IMFSample,
  IPropertyStore,
  IStream,
  IUnknown,
  LONG,
  LPCVOID,
  LPCWSTR,
  LPDWORD,
  LPVOID,
  LPWSTR,
  INT64,
  LONGLONG,
  LPLPVOID,
  LPPROPVARIANT,
  MediaEventType,
  MFASYNC_WORKQUEUE_TYPE,
  MFPERIODICCALLBACK,
  MFStandardVideoFormat,
  MFTIME,
  MFVideoInterlaceMode,
  MFWORKITEM_KEY,
  MF_FILE_ACCESSMODE,
  MF_FILE_FLAGS,
  MF_FILE_OPENMODE,
  NULL,
  PCWSTR,
  PIMediaBuffer,
  PIMFActivate,
  PIMFAsyncResult,
  PIMFAttributes,
  PIMFAudioMediaType,
  PIMFByteStream,
  PIMFCollection,
  PIMFContentDecryptorContext,
  PIMFContentProtectionDevice,
  PIMFDXGIDeviceManager,
  PIMFMediaBuffer,
  PIMFMediaEvent,
  PIMFMediaEventQueue,
  PIMFMediaType,
  PIMFPluginControl,
  PIMFPresentationDescriptor,
  PIMFPresentationTimeSource,
  PIMFSample,
  PIMFSourceResolver,
  PIMFStreamDescriptor,
  PIMFVideoMediaType,
  PIPropertyStore,
  PIStream,
  PIUnknown,
  PMFVIDEOFORMAT,
  PMFWORKITEM_KEY,
  PPAMMEDIATYPE,
  PPMFVIDEOFORMAT,
  PPWAVEFORMATEX,
  PUINT32,
  QWORD,
  REFCLSID,
  REFGUID,
  REFIID,
  UINT,
  UINT32,
  UINT64,
  ULONG,
} from '../types/Mfplat';

/**
 * Thin, lazy-loaded FFI bindings for `mfplat.dll`.
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
 * import Mfplat from './structs/Mfplat';
 *
 * // Lazy: bind on first call
 * const hr = Mfplat.MFStartup(0x00020070, 0);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Mfplat.Preload(['MFStartup', 'MFCreateAttributes', 'MFShutdown']);
 * ```
 */
class Mfplat extends Win32 {
  protected static override name = 'mfplat.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    MFAddPeriodicCallback: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFAllocateSerialWorkQueue: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFAllocateWorkQueue: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFAllocateWorkQueueEx: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFAverageTimePerFrameToFrameRate: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFBeginCreateFile: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFBeginRegisterWorkQueueWithMMCSS: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFBeginRegisterWorkQueueWithMMCSSEx: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFBeginUnregisterWorkQueueWithMMCSS: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCalculateBitmapImageSize: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCalculateImageSize: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFCancelCreateFile: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFCancelWorkItem: { args: [FFIType.u64], returns: FFIType.i32 },
    MFCombineSamples: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFCompareFullToPartialMediaType: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFConvertColorInfoFromDXVA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    MFConvertColorInfoToDXVA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFConvertFromFP16Array: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    MFConvertToFP16Array: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    MFCopyImage: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    MFCreate2DMediaBuffer: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    MFCreateAMMediaTypeFromMFMediaType: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateAlignedMemoryBuffer: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFCreateAsyncResult: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateAttributes: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    MFCreateAudioMediaType: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateCollection: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFCreateContentDecryptorContext: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateContentProtectionDevice: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateDXGIDeviceManager: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateDXGISurfaceBuffer: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    MFCreateDXSurfaceBuffer: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    MFCreateEventQueue: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFCreateFile: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateLegacyMediaBufferOnMFMediaBuffer: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFCreateMFByteStreamOnStream: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateMFByteStreamOnStreamEx: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateMFByteStreamWrapper: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateMFVideoFormatFromMFMediaType: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateMediaBufferFromMediaType: { args: [FFIType.ptr, FFIType.i64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFCreateMediaBufferWrapper: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFCreateMediaEvent: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateMediaExtensionActivate: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateMediaType: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFCreateMediaTypeFromProperties: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateMediaTypeFromRepresentation: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateMemoryBuffer: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFCreateMuxStreamAttributes: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFCreateMuxStreamMediaType: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateMuxStreamSample: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFCreatePresentationDescriptor: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreatePropertiesFromMediaType: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateSample: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFCreateSourceResolver: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFCreateStreamDescriptor: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateStreamOnMFByteStream: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateStreamOnMFByteStreamEx: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateSystemTimeSource: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFCreateTempFile: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFCreateTrackedSample: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFCreateTransformActivate: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFCreateVideoMediaType: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateVideoMediaTypeFromBitMapInfoHeader: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFCreateVideoMediaTypeFromBitMapInfoHeaderEx: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFCreateVideoMediaTypeFromSubtype: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateVideoMediaTypeFromVideoInfoHeader: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateVideoMediaTypeFromVideoInfoHeader2: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateVideoSampleAllocatorEx: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateWICBitmapBuffer: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateWaveFormatExFromMFMediaType: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    MFDeserializeAttributesFromStream: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFDeserializePresentationDescriptor: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFEndCreateFile: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFEndRegisterWorkQueueWithMMCSS: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFEndUnregisterWorkQueueWithMMCSS: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFFrameRateToAverageTimePerFrame: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFGetAttributesAsBlob: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    MFGetAttributesAsBlobSize: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFGetContentProtectionSystemCLSID: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFGetMFTMerit: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFGetPlaneSize: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFGetPluginControl: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFGetStrideForBitmapInfoHeader: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFGetSupportedMimeTypes: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFGetSupportedSchemes: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFGetSystemTime: { args: [], returns: FFIType.i64 },
    MFGetTimerPeriodicity: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFGetUncompressedVideoFormat: { args: [FFIType.ptr], returns: FFIType.u32 },
    MFGetWorkQueueMMCSSClass: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFGetWorkQueueMMCSSPriority: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFGetWorkQueueMMCSSTaskId: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFInitAMMediaTypeFromMFMediaType: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFInitAttributesFromBlob: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    MFInitMediaTypeFromAMMediaType: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFInitMediaTypeFromMFVideoFormat: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    MFInitMediaTypeFromMPEG1VideoInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFInitMediaTypeFromMPEG2VideoInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFInitMediaTypeFromVideoInfoHeader: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFInitMediaTypeFromVideoInfoHeader2: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFInitMediaTypeFromWaveFormatEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    MFInitVideoFormat: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    MFInitVideoFormat_RGB: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    MFInvokeCallback: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFIsContentProtectionDeviceSupported: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFLockDXGIDeviceManager: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFLockPlatform: { args: [], returns: FFIType.i32 },
    MFLockSharedWorkQueue: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFLockWorkQueue: { args: [FFIType.u32], returns: FFIType.i32 },
    MFMapDX9FormatToDXGIFormat: { args: [FFIType.u32], returns: FFIType.u32 },
    MFMapDXGIFormatToDX9Format: { args: [FFIType.u32], returns: FFIType.u32 },
    MFPutWaitingWorkItem: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFPutWorkItem: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFPutWorkItem2: { args: [FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFPutWorkItemEx: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFPutWorkItemEx2: { args: [FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    MFRegisterLocalByteStreamHandler: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFRegisterLocalSchemeHandler: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFRegisterPlatformWithMMCSS: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    MFRemovePeriodicCallback: { args: [FFIType.u32], returns: FFIType.i32 },
    MFScheduleWorkItem: { args: [FFIType.ptr, FFIType.ptr, FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    MFScheduleWorkItemEx: { args: [FFIType.ptr, FFIType.i64, FFIType.ptr], returns: FFIType.i32 },
    MFSerializeAttributesToStream: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFSerializePresentationDescriptor: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFShutdown: { args: [], returns: FFIType.i32 },
    MFSplitSample: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFStartup: { args: [FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    MFTEnum: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFTEnum2: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFTEnumEx: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFTGetInfo: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFTRegister: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFTRegisterLocal: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFTRegisterLocalByCLSID: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFTUnregister: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFTUnregisterLocal: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFTUnregisterLocalByCLSID: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFTranscodeGetAudioOutputAvailableTypes: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFUnlockDXGIDeviceManager: { args: [], returns: FFIType.i32 },
    MFUnlockPlatform: { args: [], returns: FFIType.i32 },
    MFUnlockWorkQueue: { args: [FFIType.u32], returns: FFIType.i32 },
    MFUnregisterPlatformFromMMCSS: { args: [], returns: FFIType.i32 },
    MFUnwrapMediaType: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFValidateMediaTypeSize: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    MFWrapMediaType: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfaddperiodiccallback
  public static MFAddPeriodicCallback(Callback: MFPERIODICCALLBACK, pContext: IUnknown | NULL, pdwKey: LPDWORD | NULL): HRESULT {
    return Mfplat.Load('MFAddPeriodicCallback')(Callback, pContext, pdwKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfallocateserialworkqueue
  public static MFAllocateSerialWorkQueue(dwWorkQueue: DWORD, pdwWorkQueue: LPDWORD): HRESULT {
    return Mfplat.Load('MFAllocateSerialWorkQueue')(dwWorkQueue, pdwWorkQueue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfallocateworkqueue
  public static MFAllocateWorkQueue(pdwWorkQueue: LPDWORD): HRESULT {
    return Mfplat.Load('MFAllocateWorkQueue')(pdwWorkQueue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfallocateworkqueueex
  public static MFAllocateWorkQueueEx(WorkQueueType: MFASYNC_WORKQUEUE_TYPE, pdwWorkQueue: LPDWORD): HRESULT {
    return Mfplat.Load('MFAllocateWorkQueueEx')(WorkQueueType, pdwWorkQueue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfaveragetimeperframetoframerate
  public static MFAverageTimePerFrameToFrameRate(unAverageTimePerFrame: UINT64, punNumerator: PUINT32, punDenominator: PUINT32): HRESULT {
    return Mfplat.Load('MFAverageTimePerFrameToFrameRate')(unAverageTimePerFrame, punNumerator, punDenominator);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfbegincreatefile
  public static MFBeginCreateFile(AccessMode: MF_FILE_ACCESSMODE, OpenMode: MF_FILE_OPENMODE, fFlags: MF_FILE_FLAGS, pwszFilePath: LPCWSTR, pCallback: IMFAsyncCallback, pState: IUnknown | NULL, ppCancelCookie: PIUnknown): HRESULT {
    return Mfplat.Load('MFBeginCreateFile')(AccessMode, OpenMode, fFlags, pwszFilePath, pCallback, pState, ppCancelCookie);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfbeginregisterworkqueuewithmmcss
  public static MFBeginRegisterWorkQueueWithMMCSS(dwWorkQueueId: DWORD, wszClass: LPCWSTR, dwTaskId: DWORD, pDoneCallback: IMFAsyncCallback, pDoneState: IUnknown): HRESULT {
    return Mfplat.Load('MFBeginRegisterWorkQueueWithMMCSS')(dwWorkQueueId, wszClass, dwTaskId, pDoneCallback, pDoneState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfbeginregisterworkqueuewithmmcssex
  public static MFBeginRegisterWorkQueueWithMMCSSEx(dwWorkQueueId: DWORD, wszClass: LPCWSTR, dwTaskId: DWORD, lPriority: LONG, pDoneCallback: IMFAsyncCallback, pDoneState: IUnknown): HRESULT {
    return Mfplat.Load('MFBeginRegisterWorkQueueWithMMCSSEx')(dwWorkQueueId, wszClass, dwTaskId, lPriority, pDoneCallback, pDoneState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfbeginunregisterworkqueuewithmmcss
  public static MFBeginUnregisterWorkQueueWithMMCSS(dwWorkQueueId: DWORD, pDoneCallback: IMFAsyncCallback, pDoneState: IUnknown): HRESULT {
    return Mfplat.Load('MFBeginUnregisterWorkQueueWithMMCSS')(dwWorkQueueId, pDoneCallback, pDoneState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcalculatebitmapimagesize
  public static MFCalculateBitmapImageSize(pBMIH: LPCVOID, cbBufSize: UINT32, pcbImageSize: PUINT32, pbKnown: LPVOID | NULL): HRESULT {
    return Mfplat.Load('MFCalculateBitmapImageSize')(pBMIH, cbBufSize, pcbImageSize, pbKnown);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcalculateimagesize
  public static MFCalculateImageSize(guidSubtype: REFGUID, unWidth: UINT32, unHeight: UINT32, pcbImageSize: PUINT32): HRESULT {
    return Mfplat.Load('MFCalculateImageSize')(guidSubtype, unWidth, unHeight, pcbImageSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcancelcreatefile
  public static MFCancelCreateFile(pCancelCookie: IUnknown): HRESULT {
    return Mfplat.Load('MFCancelCreateFile')(pCancelCookie);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcancelworkitem
  public static MFCancelWorkItem(Key: MFWORKITEM_KEY): HRESULT {
    return Mfplat.Load('MFCancelWorkItem')(Key);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcombinesamples
  public static MFCombineSamples(pSample: IMFSample, pSampleToAdd: IMFSample, dwMaxMergedDurationInMS: DWORD, pMerged: LPVOID): HRESULT {
    return Mfplat.Load('MFCombineSamples')(pSample, pSampleToAdd, dwMaxMergedDurationInMS, pMerged);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcomparefulltopartialmediatype
  public static MFCompareFullToPartialMediaType(pMFTypeFull: IMFMediaType, pMFTypePartial: IMFMediaType): BOOL {
    return Mfplat.Load('MFCompareFullToPartialMediaType')(pMFTypeFull, pMFTypePartial);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfconvertcolorinfofromdxva
  public static MFConvertColorInfoFromDXVA(pToFormat: PMFVIDEOFORMAT, dwFromDXVA: DWORD): HRESULT {
    return Mfplat.Load('MFConvertColorInfoFromDXVA')(pToFormat, dwFromDXVA);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfconvertcolorinfotodxva
  public static MFConvertColorInfoToDXVA(pdwToDXVA: LPDWORD, pFromFormat: PMFVIDEOFORMAT): HRESULT {
    return Mfplat.Load('MFConvertColorInfoToDXVA')(pdwToDXVA, pFromFormat);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfconvertfromfp16array
  public static MFConvertFromFP16Array(pDest: LPVOID, pSrc: LPCVOID, dwCount: DWORD): HRESULT {
    return Mfplat.Load('MFConvertFromFP16Array')(pDest, pSrc, dwCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfconverttofp16array
  public static MFConvertToFP16Array(pDest: LPVOID, pSrc: LPCVOID, dwCount: DWORD): HRESULT {
    return Mfplat.Load('MFConvertToFP16Array')(pDest, pSrc, dwCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcopyimage
  public static MFCopyImage(pDest: LPVOID, lDestStride: LONG, pSrc: LPCVOID, lSrcStride: LONG, dwWidthInBytes: DWORD, dwLines: DWORD): HRESULT {
    return Mfplat.Load('MFCopyImage')(pDest, lDestStride, pSrc, lSrcStride, dwWidthInBytes, dwLines);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreate2dmediabuffer
  public static MFCreate2DMediaBuffer(dwWidth: DWORD, dwHeight: DWORD, dwFourCC: DWORD, fBottomUp: BOOL, ppBuffer: PIMFMediaBuffer): HRESULT {
    return Mfplat.Load('MFCreate2DMediaBuffer')(dwWidth, dwHeight, dwFourCC, fBottomUp, ppBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreateammediatypefrommfmediatype
  public static MFCreateAMMediaTypeFromMFMediaType(pMFType: IMFMediaType, guidFormatBlockType: REFGUID, ppAMType: PPAMMEDIATYPE): HRESULT {
    return Mfplat.Load('MFCreateAMMediaTypeFromMFMediaType')(pMFType, guidFormatBlockType, ppAMType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatealignedmemorybuffer
  public static MFCreateAlignedMemoryBuffer(cbMaxLength: DWORD, cbAlignment: DWORD, ppBuffer: PIMFMediaBuffer): HRESULT {
    return Mfplat.Load('MFCreateAlignedMemoryBuffer')(cbMaxLength, cbAlignment, ppBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreateasyncresult
  public static MFCreateAsyncResult(punkObject: IUnknown | NULL, pCallback: IMFAsyncCallback, punkState: IUnknown | NULL, ppAsyncResult: PIMFAsyncResult): HRESULT {
    return Mfplat.Load('MFCreateAsyncResult')(punkObject, pCallback, punkState, ppAsyncResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreateattributes
  public static MFCreateAttributes(ppMFAttributes: PIMFAttributes, cInitialSize: UINT32): HRESULT {
    return Mfplat.Load('MFCreateAttributes')(ppMFAttributes, cInitialSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreateaudiomediatype
  public static MFCreateAudioMediaType(pAudioFormat: LPCVOID, ppIAudioMediaType: PIMFAudioMediaType): HRESULT {
    return Mfplat.Load('MFCreateAudioMediaType')(pAudioFormat, ppIAudioMediaType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfobjects/nf-mfobjects-mfcreatecollection
  public static MFCreateCollection(ppIMFCollection: PIMFCollection): HRESULT {
    return Mfplat.Load('MFCreateCollection')(ppIMFCollection);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatecontentdecryptorcontext
  public static MFCreateContentDecryptorContext(guidMediaProtectionSystemId: REFGUID, pD3DManager: IMFDXGIDeviceManager | NULL, pContentProtectionDevice: IMFContentProtectionDevice, ppContentDecryptorContext: PIMFContentDecryptorContext): HRESULT {
    return Mfplat.Load('MFCreateContentDecryptorContext')(guidMediaProtectionSystemId, pD3DManager, pContentProtectionDevice, ppContentDecryptorContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatecontentprotectiondevice
  public static MFCreateContentProtectionDevice(ProtectionSystemId: REFGUID, ContentProtectionDevice: PIMFContentProtectionDevice): HRESULT {
    return Mfplat.Load('MFCreateContentProtectionDevice')(ProtectionSystemId, ContentProtectionDevice);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatedxgidevicemanager
  public static MFCreateDXGIDeviceManager(resetToken: PUINT32, ppDeviceManager: PIMFDXGIDeviceManager): HRESULT {
    return Mfplat.Load('MFCreateDXGIDeviceManager')(resetToken, ppDeviceManager);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatedxgisurfacebuffer
  public static MFCreateDXGISurfaceBuffer(riid: REFIID, punkSurface: IUnknown, uSubresourceIndex: UINT, fBottomUpWhenLinear: BOOL, ppBuffer: PIMFMediaBuffer): HRESULT {
    return Mfplat.Load('MFCreateDXGISurfaceBuffer')(riid, punkSurface, uSubresourceIndex, fBottomUpWhenLinear, ppBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatedxsurfacebuffer
  public static MFCreateDXSurfaceBuffer(riid: REFIID, punkSurface: IUnknown, fBottomUpWhenLinear: BOOL, ppBuffer: PIMFMediaBuffer): HRESULT {
    return Mfplat.Load('MFCreateDXSurfaceBuffer')(riid, punkSurface, fBottomUpWhenLinear, ppBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfobjects/nf-mfobjects-mfcreateeventqueue
  public static MFCreateEventQueue(ppMediaEventQueue: PIMFMediaEventQueue): HRESULT {
    return Mfplat.Load('MFCreateEventQueue')(ppMediaEventQueue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatefile
  public static MFCreateFile(AccessMode: MF_FILE_ACCESSMODE, OpenMode: MF_FILE_OPENMODE, fFlags: MF_FILE_FLAGS, pwszFileURL: LPCWSTR, ppIByteStream: PIMFByteStream): HRESULT {
    return Mfplat.Load('MFCreateFile')(AccessMode, OpenMode, fFlags, pwszFileURL, ppIByteStream);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatelegacymediabufferonmfmediabuffer
  public static MFCreateLegacyMediaBufferOnMFMediaBuffer(pSample: IMFSample | NULL, pMFMediaBuffer: IMFMediaBuffer, cbOffset: DWORD, ppMediaBuffer: PIMediaBuffer): HRESULT {
    return Mfplat.Load('MFCreateLegacyMediaBufferOnMFMediaBuffer')(pSample, pMFMediaBuffer, cbOffset, ppMediaBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatemfbytestreamonstream
  public static MFCreateMFByteStreamOnStream(pStream: IStream, ppByteStream: PIMFByteStream): HRESULT {
    return Mfplat.Load('MFCreateMFByteStreamOnStream')(pStream, ppByteStream);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatemfbytestreamonstreamex
  public static MFCreateMFByteStreamOnStreamEx(pStream: IUnknown, ppByteStream: PIMFByteStream): HRESULT {
    return Mfplat.Load('MFCreateMFByteStreamOnStreamEx')(pStream, ppByteStream);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatemfbytestreamwrapper
  public static MFCreateMFByteStreamWrapper(pStream: IMFByteStream, ppStreamWrapper: PIMFByteStream): HRESULT {
    return Mfplat.Load('MFCreateMFByteStreamWrapper')(pStream, ppStreamWrapper);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatemfvideoformatfrommfmediatype
  public static MFCreateMFVideoFormatFromMFMediaType(pMFType: IMFMediaType, ppMFVF: PPMFVIDEOFORMAT, pcbSize: PUINT32 | NULL): HRESULT {
    return Mfplat.Load('MFCreateMFVideoFormatFromMFMediaType')(pMFType, ppMFVF, pcbSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatemediabufferfrommediatype
  public static MFCreateMediaBufferFromMediaType(pMediaType: IMFMediaType, llDuration: LONGLONG, dwMinLength: DWORD, dwMinAlignment: DWORD, ppBuffer: PIMFMediaBuffer): HRESULT {
    return Mfplat.Load('MFCreateMediaBufferFromMediaType')(pMediaType, llDuration, dwMinLength, dwMinAlignment, ppBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatemediabufferwrapper
  public static MFCreateMediaBufferWrapper(pBuffer: IMFMediaBuffer, cbOffset: DWORD, dwLength: DWORD, ppBuffer: PIMFMediaBuffer): HRESULT {
    return Mfplat.Load('MFCreateMediaBufferWrapper')(pBuffer, cbOffset, dwLength, ppBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfobjects/nf-mfobjects-mfcreatemediaevent
  public static MFCreateMediaEvent(met: MediaEventType, guidExtendedType: REFGUID, hrStatus: HRESULT, pvValue: LPPROPVARIANT | NULL, ppEvent: PIMFMediaEvent): HRESULT {
    return Mfplat.Load('MFCreateMediaEvent')(met, guidExtendedType, hrStatus, pvValue, ppEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatemediaextensionactivate
  public static MFCreateMediaExtensionActivate(szActivatableClassId: PCWSTR, pConfiguration: IUnknown | NULL, riid: REFIID, ppvObject: LPLPVOID): HRESULT {
    return Mfplat.Load('MFCreateMediaExtensionActivate')(szActivatableClassId, pConfiguration, riid, ppvObject);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatemediatype
  public static MFCreateMediaType(ppMFType: PIMFMediaType): HRESULT {
    return Mfplat.Load('MFCreateMediaType')(ppMFType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatemediatypefromproperties
  public static MFCreateMediaTypeFromProperties(pPropStore: IPropertyStore, ppMediaType: PIMFMediaType): HRESULT {
    return Mfplat.Load('MFCreateMediaTypeFromProperties')(pPropStore, ppMediaType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatemediatypefromrepresentation
  public static MFCreateMediaTypeFromRepresentation(guidRepresentation: REFGUID, pvRepresentation: LPVOID, ppIMediaType: PIMFMediaType): HRESULT {
    return Mfplat.Load('MFCreateMediaTypeFromRepresentation')(guidRepresentation, pvRepresentation, ppIMediaType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatememorybuffer
  public static MFCreateMemoryBuffer(cbMaxLength: DWORD, ppBuffer: PIMFMediaBuffer): HRESULT {
    return Mfplat.Load('MFCreateMemoryBuffer')(cbMaxLength, ppBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatemuxstreamattributes
  public static MFCreateMuxStreamAttributes(ppMuxStreamAttributes: PIMFAttributes): HRESULT {
    return Mfplat.Load('MFCreateMuxStreamAttributes')(ppMuxStreamAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatemuxstreammediatype
  public static MFCreateMuxStreamMediaType(pAttributes: IMFAttributes | NULL, ppMediaType: PIMFMediaType): HRESULT {
    return Mfplat.Load('MFCreateMuxStreamMediaType')(pAttributes, ppMediaType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatemuxstreamsample
  public static MFCreateMuxStreamSample(ppSample: PIMFSample): HRESULT {
    return Mfplat.Load('MFCreateMuxStreamSample')(ppSample);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfcreatepresentationdescriptor
  public static MFCreatePresentationDescriptor(cStreamDescriptors: DWORD, apStreamDescriptors: LPVOID | NULL, ppPresentationDescriptor: PIMFPresentationDescriptor): HRESULT {
    return Mfplat.Load('MFCreatePresentationDescriptor')(cStreamDescriptors, apStreamDescriptors, ppPresentationDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatepropertiesfrommediatype
  public static MFCreatePropertiesFromMediaType(pMediaType: IMFMediaType, ppPropStore: PIPropertyStore): HRESULT {
    return Mfplat.Load('MFCreatePropertiesFromMediaType')(pMediaType, ppPropStore);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatesample
  public static MFCreateSample(ppIMFSample: PIMFSample): HRESULT {
    return Mfplat.Load('MFCreateSample')(ppIMFSample);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfcreatesourceresolver
  public static MFCreateSourceResolver(ppISourceResolver: PIMFSourceResolver): HRESULT {
    return Mfplat.Load('MFCreateSourceResolver')(ppISourceResolver);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfcreatestreamdescriptor
  public static MFCreateStreamDescriptor(dwStreamIdentifier: DWORD, cMediaTypes: DWORD, apMediaTypes: LPVOID, ppDescriptor: PIMFStreamDescriptor): HRESULT {
    return Mfplat.Load('MFCreateStreamDescriptor')(dwStreamIdentifier, cMediaTypes, apMediaTypes, ppDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatestreamonmfbytestream
  public static MFCreateStreamOnMFByteStream(pByteStream: IMFByteStream, ppStream: PIStream): HRESULT {
    return Mfplat.Load('MFCreateStreamOnMFByteStream')(pByteStream, ppStream);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatestreamonmfbytestreamex
  public static MFCreateStreamOnMFByteStreamEx(pByteStream: IMFByteStream, ppStream: PIUnknown): HRESULT {
    return Mfplat.Load('MFCreateStreamOnMFByteStreamEx')(pByteStream, ppStream);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfcreatesystemtimesource
  public static MFCreateSystemTimeSource(ppSystemTimeSource: PIMFPresentationTimeSource): HRESULT {
    return Mfplat.Load('MFCreateSystemTimeSource')(ppSystemTimeSource);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatetempfile
  public static MFCreateTempFile(AccessMode: MF_FILE_ACCESSMODE, OpenMode: MF_FILE_OPENMODE, fFlags: MF_FILE_FLAGS, ppIByteStream: PIMFByteStream): HRESULT {
    return Mfplat.Load('MFCreateTempFile')(AccessMode, OpenMode, fFlags, ppIByteStream);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatetrackedsample
  public static MFCreateTrackedSample(ppSample: PIMFSample): HRESULT {
    return Mfplat.Load('MFCreateTrackedSample')(ppSample);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatetransformactivate
  public static MFCreateTransformActivate(ppActivate: PIMFActivate): HRESULT {
    return Mfplat.Load('MFCreateTransformActivate')(ppActivate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatevideomediatype
  public static MFCreateVideoMediaType(pVideoFormat: PMFVIDEOFORMAT, ppIVideoMediaType: PIMFVideoMediaType): HRESULT {
    return Mfplat.Load('MFCreateVideoMediaType')(pVideoFormat, ppIVideoMediaType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatevideomediatypefrombitmapinfoheader
  public static MFCreateVideoMediaTypeFromBitMapInfoHeader(pbmihBitMapInfoHeader: LPCVOID, dwPixelAspectRatioX: DWORD, dwPixelAspectRatioY: DWORD, InterlaceMode: MFVideoInterlaceMode, VideoFlags: QWORD, qwFramesPerSecondNumerator: QWORD, qwFramesPerSecondDenominator: QWORD, dwMaxBitRate: DWORD, ppIVideoMediaType: PIMFVideoMediaType): HRESULT {
    return Mfplat.Load('MFCreateVideoMediaTypeFromBitMapInfoHeader')(pbmihBitMapInfoHeader, dwPixelAspectRatioX, dwPixelAspectRatioY, InterlaceMode, VideoFlags, qwFramesPerSecondNumerator, qwFramesPerSecondDenominator, dwMaxBitRate, ppIVideoMediaType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatevideomediatypefrombitmapinfoheaderex
  public static MFCreateVideoMediaTypeFromBitMapInfoHeaderEx(pbmihBitMapInfoHeader: LPCVOID, cbBitMapInfoHeader: UINT32, dwPixelAspectRatioX: DWORD, dwPixelAspectRatioY: DWORD, InterlaceMode: MFVideoInterlaceMode, VideoFlags: QWORD, dwFramesPerSecondNumerator: DWORD, dwFramesPerSecondDenominator: DWORD, dwMaxBitRate: DWORD, ppIVideoMediaType: PIMFVideoMediaType): HRESULT {
    return Mfplat.Load('MFCreateVideoMediaTypeFromBitMapInfoHeaderEx')(pbmihBitMapInfoHeader, cbBitMapInfoHeader, dwPixelAspectRatioX, dwPixelAspectRatioY, InterlaceMode, VideoFlags, dwFramesPerSecondNumerator, dwFramesPerSecondDenominator, dwMaxBitRate, ppIVideoMediaType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatevideomediatypefromsubtype
  public static MFCreateVideoMediaTypeFromSubtype(pAMSubtype: REFGUID, ppIVideoMediaType: PIMFVideoMediaType): HRESULT {
    return Mfplat.Load('MFCreateVideoMediaTypeFromSubtype')(pAMSubtype, ppIVideoMediaType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatevideomediatypefromvideoinfoheader
  public static MFCreateVideoMediaTypeFromVideoInfoHeader(pVideoInfoHeader: LPCVOID, cbVideoInfoHeader: DWORD, dwPixelAspectRatioX: DWORD, dwPixelAspectRatioY: DWORD, InterlaceMode: MFVideoInterlaceMode, VideoFlags: QWORD, pSubtype: REFGUID | NULL, ppIVideoMediaType: PIMFVideoMediaType): HRESULT {
    return Mfplat.Load('MFCreateVideoMediaTypeFromVideoInfoHeader')(pVideoInfoHeader, cbVideoInfoHeader, dwPixelAspectRatioX, dwPixelAspectRatioY, InterlaceMode, VideoFlags, pSubtype, ppIVideoMediaType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatevideomediatypefromvideoinfoheader2
  public static MFCreateVideoMediaTypeFromVideoInfoHeader2(pVideoInfoHeader: LPCVOID, cbVideoInfoHeader: DWORD, AdditionalVideoFlags: QWORD, pSubtype: REFGUID | NULL, ppIVideoMediaType: PIMFVideoMediaType): HRESULT {
    return Mfplat.Load('MFCreateVideoMediaTypeFromVideoInfoHeader2')(pVideoInfoHeader, cbVideoInfoHeader, AdditionalVideoFlags, pSubtype, ppIVideoMediaType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatevideosampleallocatorex
  public static MFCreateVideoSampleAllocatorEx(riid: REFIID, ppSampleAllocator: LPLPVOID): HRESULT {
    return Mfplat.Load('MFCreateVideoSampleAllocatorEx')(riid, ppSampleAllocator);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatewicbitmapbuffer
  public static MFCreateWICBitmapBuffer(riid: REFIID, punkSurface: IUnknown, ppBuffer: PIMFMediaBuffer): HRESULT {
    return Mfplat.Load('MFCreateWICBitmapBuffer')(riid, punkSurface, ppBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfcreatewaveformatexfrommfmediatype
  public static MFCreateWaveFormatExFromMFMediaType(pMFType: IMFMediaType, ppWF: PPWAVEFORMATEX, pcbSize: PUINT32 | NULL, Flags: UINT32): HRESULT {
    return Mfplat.Load('MFCreateWaveFormatExFromMFMediaType')(pMFType, ppWF, pcbSize, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfdeserializeattributesfromstream
  public static MFDeserializeAttributesFromStream(pAttr: IMFAttributes, dwOptions: DWORD, pStm: IStream): HRESULT {
    return Mfplat.Load('MFDeserializeAttributesFromStream')(pAttr, dwOptions, pStm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfdeserializepresentationdescriptor
  public static MFDeserializePresentationDescriptor(cbData: DWORD, pbData: LPVOID, ppPD: PIMFPresentationDescriptor): HRESULT {
    return Mfplat.Load('MFDeserializePresentationDescriptor')(cbData, pbData, ppPD);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfendcreatefile
  public static MFEndCreateFile(pResult: IMFAsyncResult, ppFile: PIMFByteStream): HRESULT {
    return Mfplat.Load('MFEndCreateFile')(pResult, ppFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfendregisterworkqueuewithmmcss
  public static MFEndRegisterWorkQueueWithMMCSS(pResult: IMFAsyncResult, pdwTaskId: LPDWORD): HRESULT {
    return Mfplat.Load('MFEndRegisterWorkQueueWithMMCSS')(pResult, pdwTaskId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfendunregisterworkqueuewithmmcss
  public static MFEndUnregisterWorkQueueWithMMCSS(pResult: IMFAsyncResult): HRESULT {
    return Mfplat.Load('MFEndUnregisterWorkQueueWithMMCSS')(pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfframeratetoaveragetimeperframe
  public static MFFrameRateToAverageTimePerFrame(unNumerator: UINT32, unDenominator: UINT32, punAverageTimePerFrame: LPVOID): HRESULT {
    return Mfplat.Load('MFFrameRateToAverageTimePerFrame')(unNumerator, unDenominator, punAverageTimePerFrame);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfgetattributesasblob
  public static MFGetAttributesAsBlob(pAttributes: IMFAttributes, pBuf: LPVOID, cbBufSize: UINT): HRESULT {
    return Mfplat.Load('MFGetAttributesAsBlob')(pAttributes, pBuf, cbBufSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfgetattributesasblobsize
  public static MFGetAttributesAsBlobSize(pAttributes: IMFAttributes, pcbBufSize: PUINT32): HRESULT {
    return Mfplat.Load('MFGetAttributesAsBlobSize')(pAttributes, pcbBufSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfgetcontentprotectionsystemclsid
  public static MFGetContentProtectionSystemCLSID(guidProtectionSystemID: REFGUID, pclsid: LPVOID): HRESULT {
    return Mfplat.Load('MFGetContentProtectionSystemCLSID')(guidProtectionSystemID, pclsid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfgetmftmerit
  public static MFGetMFTMerit(pMFT: IUnknown, cbVerifier: UINT32, verifier: LPCVOID, merit: LPDWORD): HRESULT {
    return Mfplat.Load('MFGetMFTMerit')(pMFT, cbVerifier, verifier, merit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfgetplanesize
  public static MFGetPlaneSize(format: DWORD, dwWidth: DWORD, dwHeight: DWORD, pdwPlaneSize: LPDWORD): HRESULT {
    return Mfplat.Load('MFGetPlaneSize')(format, dwWidth, dwHeight, pdwPlaneSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfgetplugincontrol
  public static MFGetPluginControl(ppPluginControl: PIMFPluginControl): HRESULT {
    return Mfplat.Load('MFGetPluginControl')(ppPluginControl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfgetstrideforbitmapinfoheader
  public static MFGetStrideForBitmapInfoHeader(format: DWORD, dwWidth: DWORD, pStride: LPVOID): HRESULT {
    return Mfplat.Load('MFGetStrideForBitmapInfoHeader')(format, dwWidth, pStride);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfgetsupportedmimetypes
  public static MFGetSupportedMimeTypes(pPropVarMimeTypeArray: LPPROPVARIANT): HRESULT {
    return Mfplat.Load('MFGetSupportedMimeTypes')(pPropVarMimeTypeArray);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfgetsupportedschemes
  public static MFGetSupportedSchemes(pPropVarSchemeArray: LPPROPVARIANT): HRESULT {
    return Mfplat.Load('MFGetSupportedSchemes')(pPropVarSchemeArray);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfgetsystemtime
  public static MFGetSystemTime(): MFTIME {
    return Mfplat.Load('MFGetSystemTime')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfgettimerperiodicity
  public static MFGetTimerPeriodicity(Periodicity: LPDWORD): HRESULT {
    return Mfplat.Load('MFGetTimerPeriodicity')(Periodicity);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfgetuncompressedvideoformat
  public static MFGetUncompressedVideoFormat(pVideoFormat: PMFVIDEOFORMAT): DWORD {
    return Mfplat.Load('MFGetUncompressedVideoFormat')(pVideoFormat);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfgetworkqueuemmcssclass
  public static MFGetWorkQueueMMCSSClass(dwWorkQueueId: DWORD, pwszClass: LPWSTR | NULL, pcchClass: LPDWORD): HRESULT {
    return Mfplat.Load('MFGetWorkQueueMMCSSClass')(dwWorkQueueId, pwszClass, pcchClass);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfgetworkqueuemmcsspriority
  public static MFGetWorkQueueMMCSSPriority(dwWorkQueueId: DWORD, lPriority: LPVOID): HRESULT {
    return Mfplat.Load('MFGetWorkQueueMMCSSPriority')(dwWorkQueueId, lPriority);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfgetworkqueuemmcsstaskid
  public static MFGetWorkQueueMMCSSTaskId(dwWorkQueueId: DWORD, pdwTaskId: LPDWORD): HRESULT {
    return Mfplat.Load('MFGetWorkQueueMMCSSTaskId')(dwWorkQueueId, pdwTaskId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfinitammediatypefrommfmediatype
  public static MFInitAMMediaTypeFromMFMediaType(pMFType: IMFMediaType, guidFormatBlockType: REFGUID, pAMType: LPVOID): HRESULT {
    return Mfplat.Load('MFInitAMMediaTypeFromMFMediaType')(pMFType, guidFormatBlockType, pAMType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfinitattributesfromblob
  public static MFInitAttributesFromBlob(pAttributes: IMFAttributes, pBuf: LPCVOID, cbBufSize: UINT): HRESULT {
    return Mfplat.Load('MFInitAttributesFromBlob')(pAttributes, pBuf, cbBufSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfinitmediatypefromammediatype
  public static MFInitMediaTypeFromAMMediaType(pMFType: IMFMediaType, pAMType: LPCVOID): HRESULT {
    return Mfplat.Load('MFInitMediaTypeFromAMMediaType')(pMFType, pAMType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfinitmediatypefrommfvideoformat
  public static MFInitMediaTypeFromMFVideoFormat(pMFType: IMFMediaType, pMFVF: PMFVIDEOFORMAT, cbBufSize: UINT32): HRESULT {
    return Mfplat.Load('MFInitMediaTypeFromMFVideoFormat')(pMFType, pMFVF, cbBufSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfinitmediatypefrommpeg1videoinfo
  public static MFInitMediaTypeFromMPEG1VideoInfo(pMFType: IMFMediaType, pMP1VI: LPCVOID, cbBufSize: UINT32, pSubtype: REFGUID | NULL): HRESULT {
    return Mfplat.Load('MFInitMediaTypeFromMPEG1VideoInfo')(pMFType, pMP1VI, cbBufSize, pSubtype);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfinitmediatypefrommpeg2videoinfo
  public static MFInitMediaTypeFromMPEG2VideoInfo(pMFType: IMFMediaType, pMP2VI: LPCVOID, cbBufSize: UINT32, pSubtype: REFGUID | NULL): HRESULT {
    return Mfplat.Load('MFInitMediaTypeFromMPEG2VideoInfo')(pMFType, pMP2VI, cbBufSize, pSubtype);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfinitmediatypefromvideoinfoheader
  public static MFInitMediaTypeFromVideoInfoHeader(pMFType: IMFMediaType, pVIH: LPCVOID, cbBufSize: UINT32, pSubtype: REFGUID | NULL): HRESULT {
    return Mfplat.Load('MFInitMediaTypeFromVideoInfoHeader')(pMFType, pVIH, cbBufSize, pSubtype);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfinitmediatypefromvideoinfoheader2
  public static MFInitMediaTypeFromVideoInfoHeader2(pMFType: IMFMediaType, pVIH2: LPCVOID, cbBufSize: UINT32, pSubtype: REFGUID | NULL): HRESULT {
    return Mfplat.Load('MFInitMediaTypeFromVideoInfoHeader2')(pMFType, pVIH2, cbBufSize, pSubtype);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfinitmediatypefromwaveformatex
  public static MFInitMediaTypeFromWaveFormatEx(pMFType: IMFMediaType, pWaveFormat: LPCVOID, cbBufSize: UINT32): HRESULT {
    return Mfplat.Load('MFInitMediaTypeFromWaveFormatEx')(pMFType, pWaveFormat, cbBufSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfinitvideoformat
  public static MFInitVideoFormat(pVideoFormat: PMFVIDEOFORMAT, type: MFStandardVideoFormat): HRESULT {
    return Mfplat.Load('MFInitVideoFormat')(pVideoFormat, type);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfinitvideoformat_rgb
  public static MFInitVideoFormat_RGB(pVideoFormat: PMFVIDEOFORMAT, dwWidth: DWORD, dwHeight: DWORD, D3Dfmt: DWORD): HRESULT {
    return Mfplat.Load('MFInitVideoFormat_RGB')(pVideoFormat, dwWidth, dwHeight, D3Dfmt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfinvokecallback
  public static MFInvokeCallback(pAsyncResult: IMFAsyncResult): HRESULT {
    return Mfplat.Load('MFInvokeCallback')(pAsyncResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfiscontentprotectiondevicesupported
  public static MFIsContentProtectionDeviceSupported(ProtectionSystemId: REFGUID, isSupported: LPVOID): HRESULT {
    return Mfplat.Load('MFIsContentProtectionDeviceSupported')(ProtectionSystemId, isSupported);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mflockdxgidevicemanager
  public static MFLockDXGIDeviceManager(pResetToken: PUINT32 | NULL, ppManager: PIMFDXGIDeviceManager): HRESULT {
    return Mfplat.Load('MFLockDXGIDeviceManager')(pResetToken, ppManager);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mflockplatform
  public static MFLockPlatform(): HRESULT {
    return Mfplat.Load('MFLockPlatform')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mflocksharedworkqueue
  public static MFLockSharedWorkQueue(wszClass: PCWSTR, BasePriority: LONG, pdwTaskId: LPDWORD, pID: LPDWORD): HRESULT {
    return Mfplat.Load('MFLockSharedWorkQueue')(wszClass, BasePriority, pdwTaskId, pID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mflockworkqueue
  public static MFLockWorkQueue(dwWorkQueue: DWORD): HRESULT {
    return Mfplat.Load('MFLockWorkQueue')(dwWorkQueue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfmapdx9formattodxgiformat
  public static MFMapDX9FormatToDXGIFormat(dx9: DWORD): DWORD {
    return Mfplat.Load('MFMapDX9FormatToDXGIFormat')(dx9);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfmapdxgiformattodx9format
  public static MFMapDXGIFormatToDX9Format(dx11: DWORD): DWORD {
    return Mfplat.Load('MFMapDXGIFormatToDX9Format')(dx11);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfputwaitingworkitem
  public static MFPutWaitingWorkItem(hEvent: HANDLE, Priority: LONG, pResult: IMFAsyncResult, pKey: PMFWORKITEM_KEY | NULL): HRESULT {
    return Mfplat.Load('MFPutWaitingWorkItem')(hEvent, Priority, pResult, pKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfputworkitem
  public static MFPutWorkItem(dwQueue: DWORD, pCallback: IMFAsyncCallback, pState: IUnknown | NULL): HRESULT {
    return Mfplat.Load('MFPutWorkItem')(dwQueue, pCallback, pState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfputworkitem2
  public static MFPutWorkItem2(dwQueue: DWORD, Priority: LONG, pCallback: IMFAsyncCallback, pState: IUnknown | NULL): HRESULT {
    return Mfplat.Load('MFPutWorkItem2')(dwQueue, Priority, pCallback, pState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfputworkitemex
  public static MFPutWorkItemEx(dwQueue: DWORD, pResult: IMFAsyncResult): HRESULT {
    return Mfplat.Load('MFPutWorkItemEx')(dwQueue, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfputworkitemex2
  public static MFPutWorkItemEx2(dwQueue: DWORD, Priority: LONG, pResult: IMFAsyncResult): HRESULT {
    return Mfplat.Load('MFPutWorkItemEx2')(dwQueue, Priority, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfregisterlocalbytestreamhandler
  public static MFRegisterLocalByteStreamHandler(szFileExtension: PCWSTR, szMimeType: PCWSTR, pActivate: IMFActivate): HRESULT {
    return Mfplat.Load('MFRegisterLocalByteStreamHandler')(szFileExtension, szMimeType, pActivate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfregisterlocalschemehandler
  public static MFRegisterLocalSchemeHandler(szScheme: PCWSTR, pActivate: IMFActivate): HRESULT {
    return Mfplat.Load('MFRegisterLocalSchemeHandler')(szScheme, pActivate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfregisterplatformwithmmcss
  public static MFRegisterPlatformWithMMCSS(wszClass: PCWSTR, pdwTaskId: LPDWORD, lPriority: LONG): HRESULT {
    return Mfplat.Load('MFRegisterPlatformWithMMCSS')(wszClass, pdwTaskId, lPriority);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfremoveperiodiccallback
  public static MFRemovePeriodicCallback(dwKey: DWORD): HRESULT {
    return Mfplat.Load('MFRemovePeriodicCallback')(dwKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfscheduleworkitem
  public static MFScheduleWorkItem(pCallback: IMFAsyncCallback, pState: IUnknown | NULL, Timeout: INT64, pKey: PMFWORKITEM_KEY | NULL): HRESULT {
    return Mfplat.Load('MFScheduleWorkItem')(pCallback, pState, Timeout, pKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfscheduleworkitemex
  public static MFScheduleWorkItemEx(pResult: IMFAsyncResult, Timeout: INT64, pKey: PMFWORKITEM_KEY | NULL): HRESULT {
    return Mfplat.Load('MFScheduleWorkItemEx')(pResult, Timeout, pKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfserializeattributestostream
  public static MFSerializeAttributesToStream(pAttr: IMFAttributes, dwOptions: DWORD, pStm: IStream): HRESULT {
    return Mfplat.Load('MFSerializeAttributesToStream')(pAttr, dwOptions, pStm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfserializepresentationdescriptor
  public static MFSerializePresentationDescriptor(pPD: IMFPresentationDescriptor, pcbData: LPDWORD, ppbData: LPVOID): HRESULT {
    return Mfplat.Load('MFSerializePresentationDescriptor')(pPD, pcbData, ppbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfshutdown
  public static MFShutdown(): HRESULT {
    return Mfplat.Load('MFShutdown')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfsplitsample
  public static MFSplitSample(pSample: IMFSample, pOutputSamples: LPVOID, dwOutputSampleMaxCount: DWORD, pdwOutputSampleCount: LPDWORD): HRESULT {
    return Mfplat.Load('MFSplitSample')(pSample, pOutputSamples, dwOutputSampleMaxCount, pdwOutputSampleCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfstartup
  public static MFStartup(Version: ULONG, dwFlags: DWORD): HRESULT {
    return Mfplat.Load('MFStartup')(Version, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mftenum
  public static MFTEnum(guidCategory: REFGUID, Flags: UINT32, pInputType: LPVOID | NULL, pOutputType: LPVOID | NULL, pAttributes: IMFAttributes | NULL, ppclsidMFT: LPVOID, pcMFTs: PUINT32): HRESULT {
    return Mfplat.Load('MFTEnum')(guidCategory, Flags, pInputType, pOutputType, pAttributes, ppclsidMFT, pcMFTs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mftenum2
  public static MFTEnum2(guidCategory: REFGUID, Flags: UINT32, pInputType: LPCVOID | NULL, pOutputType: LPCVOID | NULL, pAttributes: IMFAttributes | NULL, pppMFTActivate: LPVOID, pnumMFTActivate: PUINT32): HRESULT {
    return Mfplat.Load('MFTEnum2')(guidCategory, Flags, pInputType, pOutputType, pAttributes, pppMFTActivate, pnumMFTActivate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mftenumex
  public static MFTEnumEx(guidCategory: REFGUID, Flags: UINT32, pInputType: LPCVOID | NULL, pOutputType: LPCVOID | NULL, pppMFTActivate: LPVOID, pnumMFTActivate: PUINT32): HRESULT {
    return Mfplat.Load('MFTEnumEx')(guidCategory, Flags, pInputType, pOutputType, pppMFTActivate, pnumMFTActivate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mftgetinfo
  public static MFTGetInfo(clsidMFT: REFCLSID, pszName: LPVOID | NULL, ppInputTypes: LPVOID | NULL, pcInputTypes: PUINT32 | NULL, ppOutputTypes: LPVOID | NULL, pcOutputTypes: PUINT32 | NULL, ppAttributes: PIMFAttributes | NULL): HRESULT {
    return Mfplat.Load('MFTGetInfo')(clsidMFT, pszName, ppInputTypes, pcInputTypes, ppOutputTypes, pcOutputTypes, ppAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mftregister
  public static MFTRegister(clsidMFT: REFCLSID, guidCategory: REFGUID, pszName: LPWSTR, Flags: UINT32, cInputTypes: UINT32, pInputTypes: LPVOID | NULL, cOutputTypes: UINT32, pOutputTypes: LPVOID | NULL, pAttributes: IMFAttributes | NULL): HRESULT {
    return Mfplat.Load('MFTRegister')(clsidMFT, guidCategory, pszName, Flags, cInputTypes, pInputTypes, cOutputTypes, pOutputTypes, pAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mftregisterlocal
  public static MFTRegisterLocal(pClassFactory: IClassFactory, guidCategory: REFGUID, pszName: LPCWSTR, Flags: UINT32, cInputTypes: UINT32, pInputTypes: LPCVOID | NULL, cOutputTypes: UINT32, pOutputTypes: LPCVOID | NULL): HRESULT {
    return Mfplat.Load('MFTRegisterLocal')(pClassFactory, guidCategory, pszName, Flags, cInputTypes, pInputTypes, cOutputTypes, pOutputTypes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mftregisterlocalbyclsid
  public static MFTRegisterLocalByCLSID(clsidMFT: REFCLSID, guidCategory: REFGUID, pszName: LPCWSTR, Flags: UINT32, cInputTypes: UINT32, pInputTypes: LPCVOID | NULL, cOutputTypes: UINT32, pOutputTypes: LPCVOID | NULL): HRESULT {
    return Mfplat.Load('MFTRegisterLocalByCLSID')(clsidMFT, guidCategory, pszName, Flags, cInputTypes, pInputTypes, cOutputTypes, pOutputTypes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mftunregister
  public static MFTUnregister(clsidMFT: REFCLSID): HRESULT {
    return Mfplat.Load('MFTUnregister')(clsidMFT);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mftunregisterlocal
  public static MFTUnregisterLocal(pClassFactory: IClassFactory | NULL): HRESULT {
    return Mfplat.Load('MFTUnregisterLocal')(pClassFactory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mftunregisterlocalbyclsid
  public static MFTUnregisterLocalByCLSID(clsidMFT: REFCLSID): HRESULT {
    return Mfplat.Load('MFTUnregisterLocalByCLSID')(clsidMFT);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mftranscodegetaudiooutputavailabletypes
  public static MFTranscodeGetAudioOutputAvailableTypes(guidSubType: REFGUID, dwMFTFlags: DWORD, pCodecConfig: IMFAttributes | NULL, ppAvailableTypes: PIMFCollection): HRESULT {
    return Mfplat.Load('MFTranscodeGetAudioOutputAvailableTypes')(guidSubType, dwMFTFlags, pCodecConfig, ppAvailableTypes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfunlockdxgidevicemanager
  public static MFUnlockDXGIDeviceManager(): HRESULT {
    return Mfplat.Load('MFUnlockDXGIDeviceManager')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfunlockplatform
  public static MFUnlockPlatform(): HRESULT {
    return Mfplat.Load('MFUnlockPlatform')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfunlockworkqueue
  public static MFUnlockWorkQueue(dwWorkQueue: DWORD): HRESULT {
    return Mfplat.Load('MFUnlockWorkQueue')(dwWorkQueue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfunregisterplatformfrommmcss
  public static MFUnregisterPlatformFromMMCSS(): HRESULT {
    return Mfplat.Load('MFUnregisterPlatformFromMMCSS')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfunwrapmediatype
  public static MFUnwrapMediaType(pWrap: IMFMediaType, ppOrig: PIMFMediaType): HRESULT {
    return Mfplat.Load('MFUnwrapMediaType')(pWrap, ppOrig);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfvalidatemediatypesize
  public static MFValidateMediaTypeSize(FormatType: REFGUID, pBlock: LPCVOID | NULL, cbSize: UINT32): HRESULT {
    return Mfplat.Load('MFValidateMediaTypeSize')(FormatType, pBlock, cbSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfapi/nf-mfapi-mfwrapmediatype
  public static MFWrapMediaType(pOrig: IMFMediaType, MajorType: REFGUID, SubType: REFGUID, ppWrap: PIMFMediaType): HRESULT {
    return Mfplat.Load('MFWrapMediaType')(pOrig, MajorType, SubType, ppWrap);
  }
}

export default Mfplat;
