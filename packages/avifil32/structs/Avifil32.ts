import { type FFIFunction, FFIType, type Pointer } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  AVISAVECALLBACK,
  BOOL,
  DWORD,
  HANDLE,
  HRESULT,
  HWND,
  INT,
  INT_PTR,
  LONG,
  LPAVICOMPRESSOPTIONS,
  LPAVIFILEINFO,
  LPAVIFILEINFOA,
  LPAVIFILEINFOW,
  LPAVISTREAMINFO,
  LPAVISTREAMINFOA,
  LPAVISTREAMINFOW,
  LPBITMAPINFOHEADER,
  LPCLSID,
  LPCSTR,
  LPCTSTR,
  LPCWSTR,
  LPLONG,
  LPSTR,
  LPTSTR,
  LPVOID,
  LPWSTR,
  Nullable,
  Optional,
  PAVIFILE,
  PAVISTREAM,
  PGETFRAME,
  UINT,
  ULONG,
} from '../types/Avifil32';

/**
 * Thin, lazy-loaded FFI bindings for `avifil32.dll`.
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
 * import Avifil32 from './structs/Avifil32';
 *
 * // Lazy: bind on first call
 * const result = Avifil32.AVIFileOpenW(ppfile.ptr, szFile.ptr, OF_READ, null);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Avifil32.Preload(['AVIFileInit', 'AVIFileOpenW', 'AVIFileGetStream']);
 * ```
 */
class Avifil32 extends Win32 {
  protected static override name = 'avifil32.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    AVIBuildFilter: { args: [FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    AVIBuildFilterA: { args: [FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    AVIBuildFilterW: { args: [FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    AVIClearClipboard: { args: [], returns: FFIType.i32 },
    AVIFileAddRef: { args: [FFIType.u64], returns: FFIType.u32 },
    AVIFileCreateStream: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AVIFileCreateStreamA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AVIFileCreateStreamW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AVIFileEndRecord: { args: [FFIType.u64], returns: FFIType.i32 },
    AVIFileExit: { args: [], returns: FFIType.void },
    AVIFileGetStream: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    AVIFileInfo: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    AVIFileInfoA: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    AVIFileInfoW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    AVIFileInit: { args: [], returns: FFIType.void },
    AVIFileOpen: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AVIFileOpenA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AVIFileOpenW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AVIFileReadData: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AVIFileRelease: { args: [FFIType.u64], returns: FFIType.u32 },
    AVIFileWriteData: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    AVIGetFromClipboard: { args: [FFIType.ptr], returns: FFIType.i32 },
    AVIMakeCompressedStream: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AVIMakeFileFromStreams: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    AVIMakeStreamFromClipboard: { args: [FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    AVIPutFileOnClipboard: { args: [FFIType.u64], returns: FFIType.i32 },
    AVISave: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    AVISaveA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    AVISaveOptions: { args: [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i64 },
    AVISaveOptionsFree: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    AVISaveV: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AVISaveVA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AVISaveVW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AVISaveW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    AVIStreamAddRef: { args: [FFIType.u64], returns: FFIType.u32 },
    AVIStreamBeginStreaming: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    AVIStreamCreate: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    AVIStreamEndStreaming: { args: [FFIType.u64], returns: FFIType.i32 },
    AVIStreamFindSample: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    AVIStreamGetFrame: { args: [FFIType.u64, FFIType.i32], returns: FFIType.ptr },
    AVIStreamGetFrameClose: { args: [FFIType.u64], returns: FFIType.i32 },
    AVIStreamGetFrameOpen: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    AVIStreamInfo: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    AVIStreamInfoA: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    AVIStreamInfoW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    AVIStreamLength: { args: [FFIType.u64], returns: FFIType.i32 },
    AVIStreamOpenFromFile: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AVIStreamOpenFromFileA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AVIStreamOpenFromFileW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AVIStreamRead: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AVIStreamReadData: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AVIStreamReadFormat: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AVIStreamRelease: { args: [FFIType.u64], returns: FFIType.u32 },
    AVIStreamSampleToTime: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    AVIStreamSetFormat: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    AVIStreamStart: { args: [FFIType.u64], returns: FFIType.i32 },
    AVIStreamTimeToSample: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    AVIStreamWrite: { args: [FFIType.u64, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AVIStreamWriteData: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    CreateEditableStream: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    EditStreamClone: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    EditStreamCopy: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EditStreamCut: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EditStreamPaste: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    EditStreamSetInfo: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    EditStreamSetInfoA: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    EditStreamSetInfoW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    EditStreamSetName: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    EditStreamSetNameA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    EditStreamSetNameW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avibuildfilter
  public static AVIBuildFilter(lpszFilter_out: LPTSTR, cbFilter: LONG, fSaving: BOOL): HRESULT {
    return Avifil32.Load('AVIBuildFilter')(lpszFilter_out, cbFilter, fSaving);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avibuildfiltera
  public static AVIBuildFilterA(lpszFilter_out: LPSTR, cbFilter: LONG, fSaving: BOOL): HRESULT {
    return Avifil32.Load('AVIBuildFilterA')(lpszFilter_out, cbFilter, fSaving);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avibuildfilterw
  public static AVIBuildFilterW(lpszFilter_out: LPWSTR, cbFilter: LONG, fSaving: BOOL): HRESULT {
    return Avifil32.Load('AVIBuildFilterW')(lpszFilter_out, cbFilter, fSaving);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-aviclearclipboard
  public static AVIClearClipboard(): HRESULT {
    return Avifil32.Load('AVIClearClipboard')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avifileaddref
  public static AVIFileAddRef(pfile: PAVIFILE): ULONG {
    return Avifil32.Load('AVIFileAddRef')(pfile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avifilecreatestream
  public static AVIFileCreateStream(pfile: PAVIFILE, ppavi_out: Pointer, psi: LPAVISTREAMINFO): HRESULT {
    return Avifil32.Load('AVIFileCreateStream')(pfile, ppavi_out, psi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avifilecreatestreama
  public static AVIFileCreateStreamA(pfile: PAVIFILE, ppavi_out: Pointer, psi: LPAVISTREAMINFOA): HRESULT {
    return Avifil32.Load('AVIFileCreateStreamA')(pfile, ppavi_out, psi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avifilecreatestreamw
  public static AVIFileCreateStreamW(pfile: PAVIFILE, ppavi_out: Pointer, psi: LPAVISTREAMINFOW): HRESULT {
    return Avifil32.Load('AVIFileCreateStreamW')(pfile, ppavi_out, psi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avifileendrecord
  public static AVIFileEndRecord(pfile: PAVIFILE): HRESULT {
    return Avifil32.Load('AVIFileEndRecord')(pfile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avifileexit
  public static AVIFileExit(): void {
    return Avifil32.Load('AVIFileExit')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avifilegetstream
  public static AVIFileGetStream(pfile: PAVIFILE, ppavi_out: Pointer, fccType: DWORD, lParam: LONG): HRESULT {
    return Avifil32.Load('AVIFileGetStream')(pfile, ppavi_out, fccType, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avifileinfo
  public static AVIFileInfo(pfile: PAVIFILE, pfi_out: LPAVIFILEINFO, lSize: LONG): HRESULT {
    return Avifil32.Load('AVIFileInfo')(pfile, pfi_out, lSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avifileinfoa
  public static AVIFileInfoA(pfile: PAVIFILE, pfi_out: LPAVIFILEINFOA, lSize: LONG): HRESULT {
    return Avifil32.Load('AVIFileInfoA')(pfile, pfi_out, lSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avifileinfow
  public static AVIFileInfoW(pfile: PAVIFILE, pfi_out: LPAVIFILEINFOW, lSize: LONG): HRESULT {
    return Avifil32.Load('AVIFileInfoW')(pfile, pfi_out, lSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avifileinit
  public static AVIFileInit(): void {
    return Avifil32.Load('AVIFileInit')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avifileopen
  public static AVIFileOpen(ppfile_out: Pointer, szFile: LPCTSTR, uMode: UINT, lpHandler: Optional<LPCLSID>): HRESULT {
    return Avifil32.Load('AVIFileOpen')(ppfile_out, szFile, uMode, lpHandler);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avifileopena
  public static AVIFileOpenA(ppfile_out: Pointer, szFile: LPCSTR, uMode: UINT, lpHandler: Optional<LPCLSID>): HRESULT {
    return Avifil32.Load('AVIFileOpenA')(ppfile_out, szFile, uMode, lpHandler);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avifileopenw
  public static AVIFileOpenW(ppfile_out: Pointer, szFile: LPCWSTR, uMode: UINT, lpHandler: Optional<LPCLSID>): HRESULT {
    return Avifil32.Load('AVIFileOpenW')(ppfile_out, szFile, uMode, lpHandler);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avifilereaddata
  public static AVIFileReadData(pfile: PAVIFILE, ckid: DWORD, lpData_out: Nullable<LPVOID>, lpcbData_in_out: LPLONG): HRESULT {
    return Avifil32.Load('AVIFileReadData')(pfile, ckid, lpData_out, lpcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avifilerelease
  public static AVIFileRelease(pfile: PAVIFILE): ULONG {
    return Avifil32.Load('AVIFileRelease')(pfile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avifilewritedata
  public static AVIFileWriteData(pfile: PAVIFILE, ckid: DWORD, lpData: LPVOID, cbData: LONG): HRESULT {
    return Avifil32.Load('AVIFileWriteData')(pfile, ckid, lpData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avigetfromclipboard
  public static AVIGetFromClipboard(lppf_out: Pointer): HRESULT {
    return Avifil32.Load('AVIGetFromClipboard')(lppf_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avimakecompressedstream
  public static AVIMakeCompressedStream(ppsCompressed_out: Pointer, ppsSource: PAVISTREAM, lpOptions: LPAVICOMPRESSOPTIONS, pclsidHandler: Optional<LPCLSID>): HRESULT {
    return Avifil32.Load('AVIMakeCompressedStream')(ppsCompressed_out, ppsSource, lpOptions, pclsidHandler);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avimakefilefromstreams
  public static AVIMakeFileFromStreams(ppfile_out: Pointer, nStreams: INT, papStreams: Pointer): HRESULT {
    return Avifil32.Load('AVIMakeFileFromStreams')(ppfile_out, nStreams, papStreams);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avimakestreamfromclipboard
  public static AVIMakeStreamFromClipboard(cfFormat: UINT, hGlobal: HANDLE, ppstream_out: Pointer): HRESULT {
    return Avifil32.Load('AVIMakeStreamFromClipboard')(cfFormat, hGlobal, ppstream_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-aviputfileonclipboard
  public static AVIPutFileOnClipboard(pf: PAVIFILE): HRESULT {
    return Avifil32.Load('AVIPutFileOnClipboard')(pf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avisave
  public static AVISave(szFile: LPCTSTR, pclsidHandler: Optional<LPCLSID>, lpfnCallback: Nullable<AVISAVECALLBACK>, nStreams: INT, pfile: PAVISTREAM, lpOptions: Nullable<LPAVICOMPRESSOPTIONS>): HRESULT {
    return Avifil32.Load('AVISave')(szFile, pclsidHandler, lpfnCallback, nStreams, pfile, lpOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avisavea
  public static AVISaveA(szFile: LPCSTR, pclsidHandler: Optional<LPCLSID>, lpfnCallback: Nullable<AVISAVECALLBACK>, nStreams: INT, pfile: PAVISTREAM, lpOptions: Nullable<LPAVICOMPRESSOPTIONS>): HRESULT {
    return Avifil32.Load('AVISaveA')(szFile, pclsidHandler, lpfnCallback, nStreams, pfile, lpOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avisaveoptions
  public static AVISaveOptions(hwnd: HWND, uiFlags: UINT, nStreams: INT, ppavi: Pointer, plpOptions_in_out: Pointer): INT_PTR {
    return Avifil32.Load('AVISaveOptions')(hwnd, uiFlags, nStreams, ppavi, plpOptions_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avisaveoptionsfree
  public static AVISaveOptionsFree(nStreams: INT, plpOptions: Pointer): HRESULT {
    return Avifil32.Load('AVISaveOptionsFree')(nStreams, plpOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avisavev
  public static AVISaveV(szFile: LPCTSTR, pclsidHandler: Optional<LPCLSID>, lpfnCallback: Nullable<AVISAVECALLBACK>, nStreams: INT, ppavi: Pointer, plpOptions: Nullable<Pointer>): HRESULT {
    return Avifil32.Load('AVISaveV')(szFile, pclsidHandler, lpfnCallback, nStreams, ppavi, plpOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avisaveva
  public static AVISaveVA(szFile: LPCSTR, pclsidHandler: Optional<LPCLSID>, lpfnCallback: Nullable<AVISAVECALLBACK>, nStreams: INT, ppavi: Pointer, plpOptions: Pointer): HRESULT {
    return Avifil32.Load('AVISaveVA')(szFile, pclsidHandler, lpfnCallback, nStreams, ppavi, plpOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avisavevw
  public static AVISaveVW(szFile: LPCWSTR, pclsidHandler: Optional<LPCLSID>, lpfnCallback: Nullable<AVISAVECALLBACK>, nStreams: INT, ppavi: Pointer, plpOptions: Pointer): HRESULT {
    return Avifil32.Load('AVISaveVW')(szFile, pclsidHandler, lpfnCallback, nStreams, ppavi, plpOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avisavew
  public static AVISaveW(szFile: LPCWSTR, pclsidHandler: Optional<LPCLSID>, lpfnCallback: Nullable<AVISAVECALLBACK>, nStreams: INT, pfile: PAVISTREAM, lpOptions: Nullable<LPAVICOMPRESSOPTIONS>): HRESULT {
    return Avifil32.Load('AVISaveW')(szFile, pclsidHandler, lpfnCallback, nStreams, pfile, lpOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreamaddref
  public static AVIStreamAddRef(pavi: PAVISTREAM): ULONG {
    return Avifil32.Load('AVIStreamAddRef')(pavi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreambeginstreaming
  public static AVIStreamBeginStreaming(pavi: PAVISTREAM, lStart: LONG, lEnd: LONG, lRate: LONG): HRESULT {
    return Avifil32.Load('AVIStreamBeginStreaming')(pavi, lStart, lEnd, lRate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreamcreate
  public static AVIStreamCreate(ppavi_out: Pointer, lParam1: LONG, lParam2: LONG, pclsidHandler: Optional<LPCLSID>): HRESULT {
    return Avifil32.Load('AVIStreamCreate')(ppavi_out, lParam1, lParam2, pclsidHandler);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreamendstreaming
  public static AVIStreamEndStreaming(pavi: PAVISTREAM): HRESULT {
    return Avifil32.Load('AVIStreamEndStreaming')(pavi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreamfindsample
  public static AVIStreamFindSample(pavi: PAVISTREAM, lPos: LONG, lFlags: LONG): LONG {
    return Avifil32.Load('AVIStreamFindSample')(pavi, lPos, lFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreamgetframe
  public static AVIStreamGetFrame(pg: PGETFRAME, lPos: LONG): LPVOID {
    return Avifil32.Load('AVIStreamGetFrame')(pg, lPos);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreamgetframeclose
  public static AVIStreamGetFrameClose(pg: PGETFRAME): HRESULT {
    return Avifil32.Load('AVIStreamGetFrameClose')(pg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreamgetframeopen
  public static AVIStreamGetFrameOpen(pavi: PAVISTREAM, lpbiWanted: Optional<LPBITMAPINFOHEADER>): PGETFRAME {
    return Avifil32.Load('AVIStreamGetFrameOpen')(pavi, lpbiWanted);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreaminfo
  public static AVIStreamInfo(pavi: PAVISTREAM, psi_out: LPAVISTREAMINFO, lSize: LONG): HRESULT {
    return Avifil32.Load('AVIStreamInfo')(pavi, psi_out, lSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreaminfoa
  public static AVIStreamInfoA(pavi: PAVISTREAM, psi_out: LPAVISTREAMINFOA, lSize: LONG): HRESULT {
    return Avifil32.Load('AVIStreamInfoA')(pavi, psi_out, lSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreaminfow
  public static AVIStreamInfoW(pavi: PAVISTREAM, psi_out: LPAVISTREAMINFOW, lSize: LONG): HRESULT {
    return Avifil32.Load('AVIStreamInfoW')(pavi, psi_out, lSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreamlength
  public static AVIStreamLength(pavi: PAVISTREAM): LONG {
    return Avifil32.Load('AVIStreamLength')(pavi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreamopenfromfile
  public static AVIStreamOpenFromFile(ppavi_out: Pointer, szFile: LPCTSTR, fccType: DWORD, lParam: LONG, mode: UINT, pclsidHandler: Optional<LPCLSID>): HRESULT {
    return Avifil32.Load('AVIStreamOpenFromFile')(ppavi_out, szFile, fccType, lParam, mode, pclsidHandler);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreamopenfromfilea
  public static AVIStreamOpenFromFileA(ppavi_out: Pointer, szFile: LPCSTR, fccType: DWORD, lParam: LONG, mode: UINT, pclsidHandler: Optional<LPCLSID>): HRESULT {
    return Avifil32.Load('AVIStreamOpenFromFileA')(ppavi_out, szFile, fccType, lParam, mode, pclsidHandler);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreamopenfromfilew
  public static AVIStreamOpenFromFileW(ppavi_out: Pointer, szFile: LPCWSTR, fccType: DWORD, lParam: LONG, mode: UINT, pclsidHandler: Optional<LPCLSID>): HRESULT {
    return Avifil32.Load('AVIStreamOpenFromFileW')(ppavi_out, szFile, fccType, lParam, mode, pclsidHandler);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreamread
  public static AVIStreamRead(pavi: PAVISTREAM, lStart: LONG, lSamples: LONG, lpBuffer_out: Optional<LPVOID>, cbBuffer: LONG, plBytes_out: Optional<LPLONG>, plSamples_out: Optional<LPLONG>): HRESULT {
    return Avifil32.Load('AVIStreamRead')(pavi, lStart, lSamples, lpBuffer_out, cbBuffer, plBytes_out, plSamples_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreamreaddata
  public static AVIStreamReadData(pavi: PAVISTREAM, fcc: DWORD, lp_out: Optional<LPVOID>, lpcb_in_out: LPLONG): HRESULT {
    return Avifil32.Load('AVIStreamReadData')(pavi, fcc, lp_out, lpcb_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreamreadformat
  public static AVIStreamReadFormat(pavi: PAVISTREAM, lPos: LONG, lpFormat_out: Optional<LPVOID>, lpcbFormat_in_out: LPLONG): HRESULT {
    return Avifil32.Load('AVIStreamReadFormat')(pavi, lPos, lpFormat_out, lpcbFormat_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreamrelease
  public static AVIStreamRelease(pavi: PAVISTREAM): ULONG {
    return Avifil32.Load('AVIStreamRelease')(pavi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreamsampletotime
  public static AVIStreamSampleToTime(pavi: PAVISTREAM, lSample: LONG): LONG {
    return Avifil32.Load('AVIStreamSampleToTime')(pavi, lSample);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreamsetformat
  public static AVIStreamSetFormat(pavi: PAVISTREAM, lPos: LONG, lpFormat: LPVOID, cbFormat: LONG): HRESULT {
    return Avifil32.Load('AVIStreamSetFormat')(pavi, lPos, lpFormat, cbFormat);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreamstart
  public static AVIStreamStart(pavi: PAVISTREAM): LONG {
    return Avifil32.Load('AVIStreamStart')(pavi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreamtimetosample
  public static AVIStreamTimeToSample(pavi: PAVISTREAM, lTime: LONG): LONG {
    return Avifil32.Load('AVIStreamTimeToSample')(pavi, lTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreamwrite
  public static AVIStreamWrite(pavi: PAVISTREAM, lStart: LONG, lSamples: LONG, lpBuffer: LPVOID, cbBuffer: LONG, dwFlags: DWORD, plSampWritten_out: Optional<LPLONG>, plBytesWritten_out: Optional<LPLONG>): HRESULT {
    return Avifil32.Load('AVIStreamWrite')(pavi, lStart, lSamples, lpBuffer, cbBuffer, dwFlags, plSampWritten_out, plBytesWritten_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-avistreamwritedata
  public static AVIStreamWriteData(pavi: PAVISTREAM, fcc: DWORD, lp: LPVOID, cb: LONG): HRESULT {
    return Avifil32.Load('AVIStreamWriteData')(pavi, fcc, lp, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-createeditablestream
  public static CreateEditableStream(ppsEditable_out: Pointer, psSource: Nullable<PAVISTREAM>): HRESULT {
    return Avifil32.Load('CreateEditableStream')(ppsEditable_out, psSource);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-editstreamclone
  public static EditStreamClone(pavi: PAVISTREAM, ppResult_out: Pointer): HRESULT {
    return Avifil32.Load('EditStreamClone')(pavi, ppResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-editstreamcopy
  public static EditStreamCopy(pavi: PAVISTREAM, plStart_in_out: LPLONG, plLength_in_out: LPLONG, ppResult_out: Pointer): HRESULT {
    return Avifil32.Load('EditStreamCopy')(pavi, plStart_in_out, plLength_in_out, ppResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-editstreamcut
  public static EditStreamCut(pavi: PAVISTREAM, plStart_in_out: LPLONG, plLength_in_out: LPLONG, ppResult_out: Pointer): HRESULT {
    return Avifil32.Load('EditStreamCut')(pavi, plStart_in_out, plLength_in_out, ppResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-editstreampaste
  public static EditStreamPaste(pavi: PAVISTREAM, plPos_in_out: LPLONG, plLength_in_out: LPLONG, pstream: PAVISTREAM, lStart: LONG, lEnd: LONG): HRESULT {
    return Avifil32.Load('EditStreamPaste')(pavi, plPos_in_out, plLength_in_out, pstream, lStart, lEnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-editstreamsetinfo
  public static EditStreamSetInfo(pavi: PAVISTREAM, lpInfo: LPAVISTREAMINFO, cbInfo: LONG): HRESULT {
    return Avifil32.Load('EditStreamSetInfo')(pavi, lpInfo, cbInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-editstreamsetinfoa
  public static EditStreamSetInfoA(pavi: PAVISTREAM, lpInfo: LPAVISTREAMINFOA, cbInfo: LONG): HRESULT {
    return Avifil32.Load('EditStreamSetInfoA')(pavi, lpInfo, cbInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-editstreamsetinfow
  public static EditStreamSetInfoW(pavi: PAVISTREAM, lpInfo: LPAVISTREAMINFOW, cbInfo: LONG): HRESULT {
    return Avifil32.Load('EditStreamSetInfoW')(pavi, lpInfo, cbInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-editstreamsetname
  public static EditStreamSetName(pavi: PAVISTREAM, lpszName: LPCTSTR): HRESULT {
    return Avifil32.Load('EditStreamSetName')(pavi, lpszName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-editstreamsetnamea
  public static EditStreamSetNameA(pavi: PAVISTREAM, lpszName: LPCSTR): HRESULT {
    return Avifil32.Load('EditStreamSetNameA')(pavi, lpszName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/vfw/nf-vfw-editstreamsetnamew
  public static EditStreamSetNameW(pavi: PAVISTREAM, lpszName: LPCWSTR): HRESULT {
    return Avifil32.Load('EditStreamSetNameW')(pavi, lpszName);
  }
}

export default Avifil32;
