import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { HRESULT, IMFAttributes, IMFByteStream, IMFMediaSink, IMFMediaSource, LPCWSTR, LPLPVOID, Optional, PIMFSinkWriter, PIMFSourceReader, REFCLSID, REFIID } from '../types/Mfreadwrite';

/**
 * Thin, lazy-loaded FFI bindings for `mfreadwrite.dll`.
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
 * import Mfreadwrite from './structs/Mfreadwrite';
 *
 * // Lazy: bind on first call
 * const url = Buffer.from('C:\\\\video.mp4\0', 'utf16le');
 * const ppReader = Buffer.alloc(8);
 * const hr = Mfreadwrite.MFCreateSourceReaderFromURL(url.ptr, null, ppReader.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Mfreadwrite.Preload(['MFCreateSourceReaderFromURL', 'MFCreateSinkWriterFromURL']);
 * ```
 */
class Mfreadwrite extends Win32 {
  protected static override name = 'mfreadwrite.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DllCanUnloadNow: { args: [], returns: FFIType.i32 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateSinkWriterFromMediaSink: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateSinkWriterFromURL: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateSourceReaderFromByteStream: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateSourceReaderFromMediaSource: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MFCreateSourceReaderFromURL: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllcanunloadnow
  public static DllCanUnloadNow(): HRESULT {
    return Mfreadwrite.Load('DllCanUnloadNow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/combaseapi/nf-combaseapi-dllgetclassobject
  public static DllGetClassObject(rclsid: REFCLSID, riid: REFIID, ppv_out: LPLPVOID): HRESULT {
    return Mfreadwrite.Load('DllGetClassObject')(rclsid, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfreadwrite/nf-mfreadwrite-mfcreatesinkwriterfrommediasink
  public static MFCreateSinkWriterFromMediaSink(pMediaSink: IMFMediaSink, pAttributes: Optional<IMFAttributes>, ppSinkWriter_out: PIMFSinkWriter): HRESULT {
    return Mfreadwrite.Load('MFCreateSinkWriterFromMediaSink')(pMediaSink, pAttributes, ppSinkWriter_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfreadwrite/nf-mfreadwrite-mfcreatesinkwriterfromurl
  public static MFCreateSinkWriterFromURL(pwszOutputURL: Optional<LPCWSTR>, pByteStream: Optional<IMFByteStream>, pAttributes: Optional<IMFAttributes>, ppSinkWriter_out: PIMFSinkWriter): HRESULT {
    return Mfreadwrite.Load('MFCreateSinkWriterFromURL')(pwszOutputURL, pByteStream, pAttributes, ppSinkWriter_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfreadwrite/nf-mfreadwrite-mfcreatesourcereaderfrombytestream
  public static MFCreateSourceReaderFromByteStream(pByteStream: IMFByteStream, pAttributes: Optional<IMFAttributes>, ppSourceReader_out: PIMFSourceReader): HRESULT {
    return Mfreadwrite.Load('MFCreateSourceReaderFromByteStream')(pByteStream, pAttributes, ppSourceReader_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfreadwrite/nf-mfreadwrite-mfcreatesourcereaderfrommediasource
  public static MFCreateSourceReaderFromMediaSource(pMediaSource: IMFMediaSource, pAttributes: Optional<IMFAttributes>, ppSourceReader_out: PIMFSourceReader): HRESULT {
    return Mfreadwrite.Load('MFCreateSourceReaderFromMediaSource')(pMediaSource, pAttributes, ppSourceReader_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/mfreadwrite/nf-mfreadwrite-mfcreatesourcereaderfromurl
  public static MFCreateSourceReaderFromURL(pwszURL: LPCWSTR, pAttributes: Optional<IMFAttributes>, ppSourceReader_out: PIMFSourceReader): HRESULT {
    return Mfreadwrite.Load('MFCreateSourceReaderFromURL')(pwszURL, pAttributes, ppSourceReader_out);
  }
}

export default Mfreadwrite;
