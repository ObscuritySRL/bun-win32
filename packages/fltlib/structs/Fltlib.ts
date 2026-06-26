import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  DWORD,
  FILTER_INFORMATION_CLASS,
  FILTER_VOLUME_INFORMATION_CLASS,
  HANDLE,
  HFILTER,
  HFILTER_INSTANCE,
  HRESULT,
  INSTANCE_INFORMATION_CLASS,
  LPCVOID,
  LPCWSTR,
  LPDWORD,
  LPHANDLE,
  LPOVERLAPPED,
  LPSECURITY_ATTRIBUTES,
  LPVOID,
  LPWSTR,
  OPTIONAL,
  PFILTER_MESSAGE_HEADER,
  PFILTER_REPLY_HEADER,
  PHANDLE,
  PHFILTER,
  PHFILTER_INSTANCE,
  WORD,
} from '../types/Fltlib';

/**
 * Thin, lazy-loaded FFI bindings for `fltlib.dll` (the Filter Manager user-mode
 * library, `fltuser.h`).
 *
 * Covers the documented surface: minifilter / instance / volume / volume-instance
 * enumeration, per-filter and per-instance information queries, MS-DOS name
 * resolution, dynamic load/unload, attach/detach, handle creation, and the
 * minifilter communication-port message channel.
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
 * import Fltlib, { FILTER_INFORMATION_CLASS } from './structs/Fltlib';
 *
 * const findOut = Buffer.alloc(8);
 * const hr = Fltlib.FilterFindFirst(FILTER_INFORMATION_CLASS.FilterFullInformation, buf.ptr!, buf.length, bytes.ptr!, findOut.ptr!);
 * Fltlib.Preload(['FilterFindFirst', 'FilterFindNext', 'FilterFindClose']);
 * ```
 */
class Fltlib extends Win32 {
  protected static override name = 'fltlib.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    FilterAttach: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    FilterAttachAtAltitude: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    FilterClose: { args: [FFIType.u64], returns: FFIType.i32 },
    FilterConnectCommunicationPort: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u16, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FilterCreate: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FilterDetach: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FilterFindClose: { args: [FFIType.u64], returns: FFIType.i32 },
    FilterFindFirst: { args: [FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FilterFindNext: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    FilterGetDosName: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    FilterGetInformation: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    FilterGetMessage: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    FilterInstanceClose: { args: [FFIType.u64], returns: FFIType.i32 },
    FilterInstanceCreate: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FilterInstanceFindClose: { args: [FFIType.u64], returns: FFIType.i32 },
    FilterInstanceFindFirst: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FilterInstanceFindNext: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    FilterInstanceGetInformation: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    FilterLoad: { args: [FFIType.ptr], returns: FFIType.i32 },
    FilterReplyMessage: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    FilterSendMessage: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    FilterUnload: { args: [FFIType.ptr], returns: FFIType.i32 },
    FilterVolumeFindClose: { args: [FFIType.u64], returns: FFIType.i32 },
    FilterVolumeFindFirst: { args: [FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FilterVolumeFindNext: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    FilterVolumeInstanceFindClose: { args: [FFIType.u64], returns: FFIType.i32 },
    FilterVolumeInstanceFindFirst: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FilterVolumeInstanceFindNext: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filterattach
  public static FilterAttach(lpFilterName: LPCWSTR, lpVolumeName: LPCWSTR, lpInstanceName: OPTIONAL<LPCWSTR>, dwCreatedInstanceNameLength: DWORD, lpCreatedInstanceName_out: OPTIONAL<LPWSTR>): HRESULT {
    return Fltlib.Load('FilterAttach')(lpFilterName, lpVolumeName, lpInstanceName, dwCreatedInstanceNameLength, lpCreatedInstanceName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filterattachataltitude
  public static FilterAttachAtAltitude(lpFilterName: LPCWSTR, lpVolumeName: LPCWSTR, lpAltitude: LPCWSTR, lpInstanceName: OPTIONAL<LPCWSTR>, dwCreatedInstanceNameLength: DWORD, lpCreatedInstanceName_out: OPTIONAL<LPWSTR>): HRESULT {
    return Fltlib.Load('FilterAttachAtAltitude')(lpFilterName, lpVolumeName, lpAltitude, lpInstanceName, dwCreatedInstanceNameLength, lpCreatedInstanceName_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filterclose
  public static FilterClose(hFilter: HFILTER): HRESULT {
    return Fltlib.Load('FilterClose')(hFilter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filterconnectcommunicationport
  public static FilterConnectCommunicationPort(lpPortName: LPCWSTR, dwOptions: DWORD, lpContext: OPTIONAL<LPCVOID>, wSizeOfContext: WORD, lpSecurityAttributes: OPTIONAL<LPSECURITY_ATTRIBUTES>, hPort_out: PHANDLE): HRESULT {
    return Fltlib.Load('FilterConnectCommunicationPort')(lpPortName, dwOptions, lpContext, wSizeOfContext, lpSecurityAttributes, hPort_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filtercreate
  public static FilterCreate(lpFilterName: LPCWSTR, hFilter_out: PHFILTER): HRESULT {
    return Fltlib.Load('FilterCreate')(lpFilterName, hFilter_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filterdetach
  public static FilterDetach(lpFilterName: LPCWSTR, lpVolumeName: LPCWSTR, lpInstanceName: OPTIONAL<LPCWSTR>): HRESULT {
    return Fltlib.Load('FilterDetach')(lpFilterName, lpVolumeName, lpInstanceName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filterfindclose
  public static FilterFindClose(hFilterFind: HANDLE): HRESULT {
    return Fltlib.Load('FilterFindClose')(hFilterFind);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filterfindfirst
  public static FilterFindFirst(dwInformationClass: FILTER_INFORMATION_CLASS, lpBuffer_out: LPVOID, dwBufferSize: DWORD, lpBytesReturned_out: LPDWORD, lpFilterFind_out: LPHANDLE): HRESULT {
    return Fltlib.Load('FilterFindFirst')(dwInformationClass, lpBuffer_out, dwBufferSize, lpBytesReturned_out, lpFilterFind_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filterfindnext
  public static FilterFindNext(hFilterFind: HANDLE, dwInformationClass: FILTER_INFORMATION_CLASS, lpBuffer_out: LPVOID, dwBufferSize: DWORD, lpBytesReturned_out: LPDWORD): HRESULT {
    return Fltlib.Load('FilterFindNext')(hFilterFind, dwInformationClass, lpBuffer_out, dwBufferSize, lpBytesReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filtergetdosname
  public static FilterGetDosName(lpVolumeName: LPCWSTR, lpDosName_out: LPWSTR, dwDosNameBufferSize: DWORD): HRESULT {
    return Fltlib.Load('FilterGetDosName')(lpVolumeName, lpDosName_out, dwDosNameBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filtergetinformation
  public static FilterGetInformation(hFilter: HFILTER, dwInformationClass: FILTER_INFORMATION_CLASS, lpBuffer_out: LPVOID, dwBufferSize: DWORD, lpBytesReturned_out: LPDWORD): HRESULT {
    return Fltlib.Load('FilterGetInformation')(hFilter, dwInformationClass, lpBuffer_out, dwBufferSize, lpBytesReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filtergetmessage
  public static FilterGetMessage(hPort: HANDLE, lpMessageBuffer_out: PFILTER_MESSAGE_HEADER, dwMessageBufferSize: DWORD, lpOverlapped_in_out: OPTIONAL<LPOVERLAPPED>): HRESULT {
    return Fltlib.Load('FilterGetMessage')(hPort, lpMessageBuffer_out, dwMessageBufferSize, lpOverlapped_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filterinstanceclose
  public static FilterInstanceClose(hInstance: HFILTER_INSTANCE): HRESULT {
    return Fltlib.Load('FilterInstanceClose')(hInstance);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filterinstancecreate
  public static FilterInstanceCreate(lpFilterName: LPCWSTR, lpVolumeName: LPCWSTR, lpInstanceName: OPTIONAL<LPCWSTR>, hInstance_out: PHFILTER_INSTANCE): HRESULT {
    return Fltlib.Load('FilterInstanceCreate')(lpFilterName, lpVolumeName, lpInstanceName, hInstance_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filterinstancefindclose
  public static FilterInstanceFindClose(hFilterInstanceFind: HANDLE): HRESULT {
    return Fltlib.Load('FilterInstanceFindClose')(hFilterInstanceFind);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filterinstancefindfirst
  public static FilterInstanceFindFirst(lpFilterName: LPCWSTR, dwInformationClass: INSTANCE_INFORMATION_CLASS, lpBuffer_out: LPVOID, dwBufferSize: DWORD, lpBytesReturned_out: LPDWORD, lpFilterInstanceFind_out: LPHANDLE): HRESULT {
    return Fltlib.Load('FilterInstanceFindFirst')(lpFilterName, dwInformationClass, lpBuffer_out, dwBufferSize, lpBytesReturned_out, lpFilterInstanceFind_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filterinstancefindnext
  public static FilterInstanceFindNext(hFilterInstanceFind: HANDLE, dwInformationClass: INSTANCE_INFORMATION_CLASS, lpBuffer_out: LPVOID, dwBufferSize: DWORD, lpBytesReturned_out: LPDWORD): HRESULT {
    return Fltlib.Load('FilterInstanceFindNext')(hFilterInstanceFind, dwInformationClass, lpBuffer_out, dwBufferSize, lpBytesReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filterinstancegetinformation
  public static FilterInstanceGetInformation(hInstance: HFILTER_INSTANCE, dwInformationClass: INSTANCE_INFORMATION_CLASS, lpBuffer_out: LPVOID, dwBufferSize: DWORD, lpBytesReturned_out: LPDWORD): HRESULT {
    return Fltlib.Load('FilterInstanceGetInformation')(hInstance, dwInformationClass, lpBuffer_out, dwBufferSize, lpBytesReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filterload
  public static FilterLoad(lpFilterName: LPCWSTR): HRESULT {
    return Fltlib.Load('FilterLoad')(lpFilterName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filterreplymessage
  public static FilterReplyMessage(hPort: HANDLE, lpReplyBuffer: PFILTER_REPLY_HEADER, dwReplyBufferSize: DWORD): HRESULT {
    return Fltlib.Load('FilterReplyMessage')(hPort, lpReplyBuffer, dwReplyBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filtersendmessage
  public static FilterSendMessage(hPort: HANDLE, lpInBuffer: LPVOID, dwInBufferSize: DWORD, lpOutBuffer_out: OPTIONAL<LPVOID>, dwOutBufferSize: DWORD, lpBytesReturned_out: LPDWORD): HRESULT {
    return Fltlib.Load('FilterSendMessage')(hPort, lpInBuffer, dwInBufferSize, lpOutBuffer_out, dwOutBufferSize, lpBytesReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filterunload
  public static FilterUnload(lpFilterName: LPCWSTR): HRESULT {
    return Fltlib.Load('FilterUnload')(lpFilterName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filtervolumefindclose
  public static FilterVolumeFindClose(hVolumeFind: HANDLE): HRESULT {
    return Fltlib.Load('FilterVolumeFindClose')(hVolumeFind);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filtervolumefindfirst
  public static FilterVolumeFindFirst(dwInformationClass: FILTER_VOLUME_INFORMATION_CLASS, lpBuffer_out: LPVOID, dwBufferSize: DWORD, lpBytesReturned_out: LPDWORD, lpVolumeFind_out: PHANDLE): HRESULT {
    return Fltlib.Load('FilterVolumeFindFirst')(dwInformationClass, lpBuffer_out, dwBufferSize, lpBytesReturned_out, lpVolumeFind_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filtervolumefindnext
  public static FilterVolumeFindNext(hVolumeFind: HANDLE, dwInformationClass: FILTER_VOLUME_INFORMATION_CLASS, lpBuffer_out: LPVOID, dwBufferSize: DWORD, lpBytesReturned_out: LPDWORD): HRESULT {
    return Fltlib.Load('FilterVolumeFindNext')(hVolumeFind, dwInformationClass, lpBuffer_out, dwBufferSize, lpBytesReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filtervolumeinstancefindclose
  public static FilterVolumeInstanceFindClose(hVolumeInstanceFind: HANDLE): HRESULT {
    return Fltlib.Load('FilterVolumeInstanceFindClose')(hVolumeInstanceFind);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filtervolumeinstancefindfirst
  public static FilterVolumeInstanceFindFirst(lpVolumeName: LPCWSTR, dwInformationClass: INSTANCE_INFORMATION_CLASS, lpBuffer_out: LPVOID, dwBufferSize: DWORD, lpBytesReturned_out: LPDWORD, lpVolumeInstanceFind_out: LPHANDLE): HRESULT {
    return Fltlib.Load('FilterVolumeInstanceFindFirst')(lpVolumeName, dwInformationClass, lpBuffer_out, dwBufferSize, lpBytesReturned_out, lpVolumeInstanceFind_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fltuser/nf-fltuser-filtervolumeinstancefindnext
  public static FilterVolumeInstanceFindNext(hVolumeInstanceFind: HANDLE, dwInformationClass: INSTANCE_INFORMATION_CLASS, lpBuffer_out: LPVOID, dwBufferSize: DWORD, lpBytesReturned_out: LPDWORD): HRESULT {
    return Fltlib.Load('FilterVolumeInstanceFindNext')(hVolumeInstanceFind, dwInformationClass, lpBuffer_out, dwBufferSize, lpBytesReturned_out);
  }
}

export default Fltlib;
