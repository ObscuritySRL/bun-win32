import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  GUID,
  HRESULT,
  HWND,
  IMFASFContentInfo,
  IMFASFProfile,
  IMFActivate,
  IMFAttributes,
  IMFByteStream,
  IMFMediaType,
  IMFPresentationDescriptor,
  IPropertyStore,
  IUnknown,
  LPCWSTR,
  LPLPVOID,
  NULL,
  PBYTE,
  PIMFASFContentInfo,
  PIMFASFIndexer,
  PIMFASFMultiplexer,
  PIMFASFProfile,
  PIMFASFSplitter,
  PIMFASFStreamSelector,
  PIMFActivate,
  PIMFByteStream,
  PIMFMediaSink,
  PIMFNetCredentialCache,
  PIMFNetProxyLocator,
  PIMFPresentationDescriptor,
  PIMFProtectedEnvironmentAccess,
  PIMFRemoteDesktopPlugin,
  PIMFSignedLibrary,
  PIMFSourceResolver,
  PIMFSystemId,
  PLPWSTR,
  PPROPVARIANT,
  QWORD,
  REFCLSID,
  REFIID,
  UINT32,
} from '../types/Mf';

/**
 * Thin, lazy-loaded FFI bindings for `mf.dll`.
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
 * import Mf from './structs/Mf';
 *
 * // Lazy: bind on first call
 * const ppResolver = Buffer.alloc(8);
 * const hr = Mf.MFCreateSourceResolver(ppResolver.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Mf.Preload(['MFCreateSourceResolver', 'MFCreateASFProfile']);
 * ```
 */
class Mf extends Win32 {
  protected static override name = 'mf.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DllCanUnloadNow: { args: [], returns: FFIType.i32 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreate3GPMediaSink: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateAC3MediaSink: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateADTSMediaSink: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateASFContentInfo: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFCreateASFIndexer: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFCreateASFIndexerByteStream: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    MFCreateASFMediaSink: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateASFMediaSinkActivate: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateASFMultiplexer: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFCreateASFProfile: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFCreateASFProfileFromPresentationDescriptor: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateASFSplitter: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFCreateASFStreamSelector: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateASFStreamingMediaSink: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateASFStreamingMediaSinkActivate: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateCredentialCache: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFCreateFMPEG4MediaSink: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateMP3MediaSink: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateMPEG4MediaSink: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateMuxSink: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreatePresentationDescriptorFromASFProfile: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateProtectedEnvironmentAccess: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFCreateProxyLocator: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateRemoteDesktopPlugin: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFCreateSourceResolver: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFCreateVideoRenderer: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateVideoRendererActivate: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    MFGetLocalId: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MFGetSupportedMimeTypes: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFGetSupportedSchemes: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFGetSystemId: { args: [FFIType.ptr], returns: FFIType.i32 },
    MFLoadSignedLibrary: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFShutdownObject: { args: [FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllcanunloadnow
  public static DllCanUnloadNow(): HRESULT {
    return Mf.Load('DllCanUnloadNow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllgetclassobject
  public static DllGetClassObject(rclsid: REFCLSID, riid: REFIID, ppv: LPLPVOID): HRESULT {
    return Mf.Load('DllGetClassObject')(rclsid, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfcreate3gpmediasink
  public static MFCreate3GPMediaSink(pIByteStream: IMFByteStream, pVideoMediaType: IMFMediaType | NULL, pAudioMediaType: IMFMediaType | NULL, ppIMediaSink: PIMFMediaSink): HRESULT {
    return Mf.Load('MFCreate3GPMediaSink')(pIByteStream, pVideoMediaType, pAudioMediaType, ppIMediaSink);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfcreateac3mediasink
  public static MFCreateAC3MediaSink(pTargetByteStream: IMFByteStream, pAudioMediaType: IMFMediaType, ppMediaSink: PIMFMediaSink): HRESULT {
    return Mf.Load('MFCreateAC3MediaSink')(pTargetByteStream, pAudioMediaType, ppMediaSink);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfcreateadtsmediasink
  public static MFCreateADTSMediaSink(pTargetByteStream: IMFByteStream, pAudioMediaType: IMFMediaType, ppMediaSink: PIMFMediaSink): HRESULT {
    return Mf.Load('MFCreateADTSMediaSink')(pTargetByteStream, pAudioMediaType, ppMediaSink);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmcontainer/nf-wmcontainer-mfcreateasfcontentinfo
  public static MFCreateASFContentInfo(ppIContentInfo: PIMFASFContentInfo): HRESULT {
    return Mf.Load('MFCreateASFContentInfo')(ppIContentInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmcontainer/nf-wmcontainer-mfcreateasfindexer
  public static MFCreateASFIndexer(ppIIndexer: PIMFASFIndexer): HRESULT {
    return Mf.Load('MFCreateASFIndexer')(ppIIndexer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmcontainer/nf-wmcontainer-mfcreateasfindexerbytestream
  public static MFCreateASFIndexerByteStream(pIContentByteStream: IMFByteStream, cbIndexStartOffset: QWORD, pIIndexByteStream: PIMFByteStream): HRESULT {
    return Mf.Load('MFCreateASFIndexerByteStream')(pIContentByteStream, cbIndexStartOffset, pIIndexByteStream);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmcontainer/nf-wmcontainer-mfcreateasfmediasink
  public static MFCreateASFMediaSink(pIByteStream: IMFByteStream, ppIMediaSink: PIMFMediaSink): HRESULT {
    return Mf.Load('MFCreateASFMediaSink')(pIByteStream, ppIMediaSink);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmcontainer/nf-wmcontainer-mfcreateasfmediasinkactivate
  public static MFCreateASFMediaSinkActivate(pwszFileName: LPCWSTR, pContentInfo: IMFASFContentInfo, ppIActivate: PIMFActivate): HRESULT {
    return Mf.Load('MFCreateASFMediaSinkActivate')(pwszFileName, pContentInfo, ppIActivate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmcontainer/nf-wmcontainer-mfcreateasfmultiplexer
  public static MFCreateASFMultiplexer(ppIMultiplexer: PIMFASFMultiplexer): HRESULT {
    return Mf.Load('MFCreateASFMultiplexer')(ppIMultiplexer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmcontainer/nf-wmcontainer-mfcreateasfprofile
  public static MFCreateASFProfile(ppIProfile: PIMFASFProfile): HRESULT {
    return Mf.Load('MFCreateASFProfile')(ppIProfile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmcontainer/nf-wmcontainer-mfcreateasfprofilefrompresentationdescriptor
  public static MFCreateASFProfileFromPresentationDescriptor(pIPD: IMFPresentationDescriptor, ppIProfile: PIMFASFProfile): HRESULT {
    return Mf.Load('MFCreateASFProfileFromPresentationDescriptor')(pIPD, ppIProfile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmcontainer/nf-wmcontainer-mfcreateasfsplitter
  public static MFCreateASFSplitter(ppISplitter: PIMFASFSplitter): HRESULT {
    return Mf.Load('MFCreateASFSplitter')(ppISplitter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmcontainer/nf-wmcontainer-mfcreateasfstreamselector
  public static MFCreateASFStreamSelector(pIASFProfile: IMFASFProfile, ppSelector: PIMFASFStreamSelector): HRESULT {
    return Mf.Load('MFCreateASFStreamSelector')(pIASFProfile, ppSelector);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmcontainer/nf-wmcontainer-mfcreateasfstreamingmediasink
  public static MFCreateASFStreamingMediaSink(pIByteStream: IMFByteStream, ppIMediaSink: PIMFMediaSink): HRESULT {
    return Mf.Load('MFCreateASFStreamingMediaSink')(pIByteStream, ppIMediaSink);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmcontainer/nf-wmcontainer-mfcreateasfstreamingmediasinkactivate
  public static MFCreateASFStreamingMediaSinkActivate(pByteStreamActivate: IMFActivate, pContentInfo: IMFASFContentInfo, ppIActivate: PIMFActivate): HRESULT {
    return Mf.Load('MFCreateASFStreamingMediaSinkActivate')(pByteStreamActivate, pContentInfo, ppIActivate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfcreatecredentialcache
  public static MFCreateCredentialCache(ppCache: PIMFNetCredentialCache): HRESULT {
    return Mf.Load('MFCreateCredentialCache')(ppCache);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfcreatefmpeg4mediasink
  public static MFCreateFMPEG4MediaSink(pIByteStream: IMFByteStream, pVideoMediaType: IMFMediaType | NULL, pAudioMediaType: IMFMediaType | NULL, ppIMediaSink: PIMFMediaSink): HRESULT {
    return Mf.Load('MFCreateFMPEG4MediaSink')(pIByteStream, pVideoMediaType, pAudioMediaType, ppIMediaSink);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfcreatemp3mediasink
  public static MFCreateMP3MediaSink(pTargetByteStream: IMFByteStream, ppMediaSink: PIMFMediaSink): HRESULT {
    return Mf.Load('MFCreateMP3MediaSink')(pTargetByteStream, ppMediaSink);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfcreatempeg4mediasink
  public static MFCreateMPEG4MediaSink(pIByteStream: IMFByteStream, pVideoMediaType: IMFMediaType | NULL, pAudioMediaType: IMFMediaType | NULL, ppIMediaSink: PIMFMediaSink): HRESULT {
    return Mf.Load('MFCreateMPEG4MediaSink')(pIByteStream, pVideoMediaType, pAudioMediaType, ppIMediaSink);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfcreatemuxsink
  public static MFCreateMuxSink(guidOutputSubType: GUID, pOutputAttributes: IMFAttributes | NULL, pOutputByteStream: IMFByteStream | NULL, ppMuxSink: PIMFMediaSink): HRESULT {
    return Mf.Load('MFCreateMuxSink')(guidOutputSubType, pOutputAttributes, pOutputByteStream, ppMuxSink);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wmcontainer/nf-wmcontainer-mfcreatepresentationdescriptorfromasfprofile
  public static MFCreatePresentationDescriptorFromASFProfile(pIProfile: IMFASFProfile, ppIPD: PIMFPresentationDescriptor): HRESULT {
    return Mf.Load('MFCreatePresentationDescriptorFromASFProfile')(pIProfile, ppIPD);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfcreateprotectedenvironmentaccess
  public static MFCreateProtectedEnvironmentAccess(ppAccess: PIMFProtectedEnvironmentAccess): HRESULT {
    return Mf.Load('MFCreateProtectedEnvironmentAccess')(ppAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfcreateproxylocator
  public static MFCreateProxyLocator(pszProtocol: LPCWSTR, pProxyConfig: IPropertyStore, ppProxyLocator: PIMFNetProxyLocator): HRESULT {
    return Mf.Load('MFCreateProxyLocator')(pszProtocol, pProxyConfig, ppProxyLocator);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfcreateremotedesktopplugin
  public static MFCreateRemoteDesktopPlugin(ppPlugin: PIMFRemoteDesktopPlugin): HRESULT {
    return Mf.Load('MFCreateRemoteDesktopPlugin')(ppPlugin);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfcreatesourceresolver
  public static MFCreateSourceResolver(ppISourceResolver: PIMFSourceResolver): HRESULT {
    return Mf.Load('MFCreateSourceResolver')(ppISourceResolver);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/evr/nf-evr-mfcreatevideorenderer
  public static MFCreateVideoRenderer(riidRenderer: REFIID, ppVideoRenderer: LPLPVOID): HRESULT {
    return Mf.Load('MFCreateVideoRenderer')(riidRenderer, ppVideoRenderer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfcreatevideorendereractivate
  public static MFCreateVideoRendererActivate(hwndVideo: HWND | 0n, ppActivate: PIMFActivate): HRESULT {
    return Mf.Load('MFCreateVideoRendererActivate')(hwndVideo, ppActivate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfgetlocalid
  public static MFGetLocalId(verifier: PBYTE, size: UINT32, id: PLPWSTR): HRESULT {
    return Mf.Load('MFGetLocalId')(verifier, size, id);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfgetsupportedmimetypes
  public static MFGetSupportedMimeTypes(pPropVarMimeTypeArray: PPROPVARIANT): HRESULT {
    return Mf.Load('MFGetSupportedMimeTypes')(pPropVarMimeTypeArray);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfgetsupportedschemes
  public static MFGetSupportedSchemes(pPropVarSchemeArray: PPROPVARIANT): HRESULT {
    return Mf.Load('MFGetSupportedSchemes')(pPropVarSchemeArray);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfgetsystemid
  public static MFGetSystemId(ppId: PIMFSystemId): HRESULT {
    return Mf.Load('MFGetSystemId')(ppId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfloadsignedlibrary
  public static MFLoadSignedLibrary(pszName: LPCWSTR, ppLib: PIMFSignedLibrary): HRESULT {
    return Mf.Load('MFLoadSignedLibrary')(pszName, ppLib);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfidl/nf-mfidl-mfshutdownobject
  public static MFShutdownObject(pUnk: IUnknown): HRESULT {
    return Mf.Load('MFShutdownObject')(pUnk);
  }
}

export default Mf;
