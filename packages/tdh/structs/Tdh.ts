import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOLEAN,
  DECODING_SOURCE,
  EVENT_FIELD_TYPE,
  LPCGUID,
  LPCVOID,
  LPGUID,
  Optional,
  PBOOLEAN,
  PBYTE,
  PCEVENT_DESCRIPTOR,
  PEVENT_DESCRIPTOR,
  PEVENT_FILTER_DESCRIPTOR,
  PEVENT_MAP_INFO,
  PEVENT_RECORD,
  PPAYLOAD_FILTER_PREDICATE,
  PPPROVIDER_FILTER_INFO,
  PPROPERTY_DATA_DESCRIPTOR,
  PPROVIDER_ENUMERATION_INFO,
  PPROVIDER_EVENT_INFO,
  PPROVIDER_FIELD_INFOARRAY,
  PPVOID,
  PTDH_CONTEXT,
  PTDH_HANDLE,
  PTRACE_EVENT_INFO,
  PULONG,
  PUSHORT,
  PWCHAR,
  PWSTR,
  TDH_HANDLE,
  TDHSTATUS,
  ULONG,
  ULONGLONG,
  USHORT,
} from '../types/Tdh';

/**
 * Thin, lazy-loaded FFI bindings for `tdh.dll`.
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
 * import Tdh from './structs/Tdh';
 *
 * // Lazy: bind on first call
 * const status = Tdh.TdhEnumerateProviders(buffer.ptr, size.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Tdh.Preload(['TdhGetEventInformation', 'TdhFormatProperty']);
 * ```
 */
class Tdh extends Win32 {
  protected static override name = 'tdh.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    TdhAggregatePayloadFilters: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    TdhCleanupPayloadEventFilterDescriptor: { args: [FFIType.ptr], returns: FFIType.u32 },
    TdhCloseDecodingHandle: { args: [FFIType.u64], returns: FFIType.u32 },
    TdhCreatePayloadFilter: { args: [FFIType.ptr, FFIType.ptr, FFIType.u8, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    TdhDeletePayloadFilter: { args: [FFIType.ptr], returns: FFIType.u32 },
    TdhEnumerateManifestProviderEvents: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    TdhEnumerateProviderFieldInformation: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    TdhEnumerateProviderFilters: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    TdhEnumerateProviders: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    TdhEnumerateProvidersForDecodingSource: { args: [FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    TdhFormatProperty: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u16, FFIType.u16, FFIType.u16, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    TdhGetDecodingParameter: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    TdhGetEventInformation: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    TdhGetEventMapInformation: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    TdhGetManifestEventInformation: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    TdhGetProperty: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    TdhGetPropertySize: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    TdhGetWppMessage: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    TdhGetWppProperty: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    TdhLoadManifest: { args: [FFIType.ptr], returns: FFIType.u32 },
    TdhLoadManifestFromBinary: { args: [FFIType.ptr], returns: FFIType.u32 },
    TdhLoadManifestFromMemory: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    TdhOpenDecodingHandle: { args: [FFIType.ptr], returns: FFIType.u32 },
    TdhQueryProviderFieldInformation: { args: [FFIType.ptr, FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    TdhSetDecodingParameter: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    TdhUnloadManifest: { args: [FFIType.ptr], returns: FFIType.u32 },
    TdhUnloadManifestFromMemory: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhaggregatepayloadfilters
  public static TdhAggregatePayloadFilters(PayloadFilterCount: ULONG, PayloadFilterPtrs: PPVOID, EventMatchALLFlags: Optional<PBOOLEAN>, EventFilterDescriptor_out: PEVENT_FILTER_DESCRIPTOR): TDHSTATUS {
    return Tdh.Load('TdhAggregatePayloadFilters')(PayloadFilterCount, PayloadFilterPtrs, EventMatchALLFlags, EventFilterDescriptor_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhcleanuppayloadeventfilterdescriptor
  public static TdhCleanupPayloadEventFilterDescriptor(EventFilterDescriptor_in_out: PEVENT_FILTER_DESCRIPTOR): TDHSTATUS {
    return Tdh.Load('TdhCleanupPayloadEventFilterDescriptor')(EventFilterDescriptor_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhclosedecodinghandle
  public static TdhCloseDecodingHandle(Handle: TDH_HANDLE): TDHSTATUS {
    return Tdh.Load('TdhCloseDecodingHandle')(Handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhcreatepayloadfilter
  public static TdhCreatePayloadFilter(ProviderGuid: LPCGUID, EventDescriptor: PCEVENT_DESCRIPTOR, EventMatchANY: BOOLEAN, PayloadPredicateCount: ULONG, PayloadPredicates: PPAYLOAD_FILTER_PREDICATE, PayloadFilter_out: PPVOID): TDHSTATUS {
    return Tdh.Load('TdhCreatePayloadFilter')(ProviderGuid, EventDescriptor, EventMatchANY, PayloadPredicateCount, PayloadPredicates, PayloadFilter_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhdeletepayloadfilter
  public static TdhDeletePayloadFilter(PayloadFilter_in_out: PPVOID): TDHSTATUS {
    return Tdh.Load('TdhDeletePayloadFilter')(PayloadFilter_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhenumeratemanifestproviderevents
  public static TdhEnumerateManifestProviderEvents(ProviderGuid: LPGUID, Buffer_out: Optional<PPROVIDER_EVENT_INFO>, BufferSize_in_out: PULONG): TDHSTATUS {
    return Tdh.Load('TdhEnumerateManifestProviderEvents')(ProviderGuid, Buffer_out, BufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhenumerateproviderfieldinformation
  public static TdhEnumerateProviderFieldInformation(pGuid: LPGUID, EventFieldType: EVENT_FIELD_TYPE, pBuffer_out: Optional<PPROVIDER_FIELD_INFOARRAY>, pBufferSize_in_out: PULONG): TDHSTATUS {
    return Tdh.Load('TdhEnumerateProviderFieldInformation')(pGuid, EventFieldType, pBuffer_out, pBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhenumerateproviderfilters
  public static TdhEnumerateProviderFilters(Guid: LPGUID, TdhContextCount: ULONG, TdhContext: Optional<PTDH_CONTEXT>, FilterCount_out: PULONG, Buffer_out: Optional<PPPROVIDER_FILTER_INFO>, BufferSize_in_out: PULONG): TDHSTATUS {
    return Tdh.Load('TdhEnumerateProviderFilters')(Guid, TdhContextCount, TdhContext, FilterCount_out, Buffer_out, BufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhenumerateproviders
  public static TdhEnumerateProviders(pBuffer_out: Optional<PPROVIDER_ENUMERATION_INFO>, pBufferSize_in_out: PULONG): TDHSTATUS {
    return Tdh.Load('TdhEnumerateProviders')(pBuffer_out, pBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhenumerateprovidersfordecodingsource
  public static TdhEnumerateProvidersForDecodingSource(filter: DECODING_SOURCE, buffer_out: Optional<PPROVIDER_ENUMERATION_INFO>, bufferSize: ULONG, bufferRequired_out: PULONG): TDHSTATUS {
    return Tdh.Load('TdhEnumerateProvidersForDecodingSource')(filter, buffer_out, bufferSize, bufferRequired_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhformatproperty
  public static TdhFormatProperty(
    EventInfo: PTRACE_EVENT_INFO,
    MapInfo: Optional<PEVENT_MAP_INFO>,
    PointerSize: ULONG,
    PropertyInType: USHORT,
    PropertyOutType: USHORT,
    PropertyLength: USHORT,
    UserDataLength: USHORT,
    UserData: PBYTE,
    BufferSize_in_out: PULONG,
    Buffer_out: Optional<PWCHAR>,
    UserDataConsumed_out: PUSHORT,
  ): TDHSTATUS {
    return Tdh.Load('TdhFormatProperty')(EventInfo, MapInfo, PointerSize, PropertyInType, PropertyOutType, PropertyLength, UserDataLength, UserData, BufferSize_in_out, Buffer_out, UserDataConsumed_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhgetdecodingparameter
  public static TdhGetDecodingParameter(Handle: TDH_HANDLE, TdhContext_in_out: PTDH_CONTEXT): TDHSTATUS {
    return Tdh.Load('TdhGetDecodingParameter')(Handle, TdhContext_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhgeteventinformation
  public static TdhGetEventInformation(Event: PEVENT_RECORD, TdhContextCount: ULONG, TdhContext: Optional<PTDH_CONTEXT>, Buffer_out: Optional<PTRACE_EVENT_INFO>, BufferSize_in_out: PULONG): TDHSTATUS {
    return Tdh.Load('TdhGetEventInformation')(Event, TdhContextCount, TdhContext, Buffer_out, BufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhgeteventmapinformation
  public static TdhGetEventMapInformation(pEvent: PEVENT_RECORD, pMapName: PWSTR, pBuffer_out: Optional<PEVENT_MAP_INFO>, pBufferSize_in_out: PULONG): TDHSTATUS {
    return Tdh.Load('TdhGetEventMapInformation')(pEvent, pMapName, pBuffer_out, pBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhgetmanifesteventinformation
  public static TdhGetManifestEventInformation(ProviderGuid: LPGUID, EventDescriptor: PEVENT_DESCRIPTOR, Buffer_out: Optional<PTRACE_EVENT_INFO>, BufferSize_in_out: PULONG): TDHSTATUS {
    return Tdh.Load('TdhGetManifestEventInformation')(ProviderGuid, EventDescriptor, Buffer_out, BufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhgetproperty
  public static TdhGetProperty(pEvent: PEVENT_RECORD, TdhContextCount: ULONG, pTdhContext: Optional<PTDH_CONTEXT>, PropertyDataCount: ULONG, pPropertyData: PPROPERTY_DATA_DESCRIPTOR, BufferSize: ULONG, pBuffer_out: PBYTE): TDHSTATUS {
    return Tdh.Load('TdhGetProperty')(pEvent, TdhContextCount, pTdhContext, PropertyDataCount, pPropertyData, BufferSize, pBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhgetpropertysize
  public static TdhGetPropertySize(pEvent: PEVENT_RECORD, TdhContextCount: ULONG, pTdhContext: Optional<PTDH_CONTEXT>, PropertyDataCount: ULONG, pPropertyData: PPROPERTY_DATA_DESCRIPTOR, pPropertySize_out: PULONG): TDHSTATUS {
    return Tdh.Load('TdhGetPropertySize')(pEvent, TdhContextCount, pTdhContext, PropertyDataCount, pPropertyData, pPropertySize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhgetwppmessage
  public static TdhGetWppMessage(Handle: TDH_HANDLE, EventRecord: PEVENT_RECORD, BufferSize_in_out: PULONG, Buffer_out: PBYTE): TDHSTATUS {
    return Tdh.Load('TdhGetWppMessage')(Handle, EventRecord, BufferSize_in_out, Buffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhgetwppproperty
  public static TdhGetWppProperty(Handle: TDH_HANDLE, EventRecord: PEVENT_RECORD, PropertyName: PWSTR, BufferSize_in_out: PULONG, Buffer_out: PBYTE): TDHSTATUS {
    return Tdh.Load('TdhGetWppProperty')(Handle, EventRecord, PropertyName, BufferSize_in_out, Buffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhloadmanifest
  public static TdhLoadManifest(Manifest: PWSTR): TDHSTATUS {
    return Tdh.Load('TdhLoadManifest')(Manifest);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhloadmanifestfrombinary
  public static TdhLoadManifestFromBinary(BinaryPath: PWSTR): TDHSTATUS {
    return Tdh.Load('TdhLoadManifestFromBinary')(BinaryPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhloadmanifestfrommemory
  public static TdhLoadManifestFromMemory(pData: LPCVOID, cbData: ULONG): TDHSTATUS {
    return Tdh.Load('TdhLoadManifestFromMemory')(pData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhopendecodinghandle
  public static TdhOpenDecodingHandle(Handle_out: PTDH_HANDLE): TDHSTATUS {
    return Tdh.Load('TdhOpenDecodingHandle')(Handle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhqueryproviderfieldinformation
  public static TdhQueryProviderFieldInformation(pGuid: LPGUID, EventFieldValue: ULONGLONG, EventFieldType: EVENT_FIELD_TYPE, pBuffer_out: Optional<PPROVIDER_FIELD_INFOARRAY>, pBufferSize_in_out: PULONG): TDHSTATUS {
    return Tdh.Load('TdhQueryProviderFieldInformation')(pGuid, EventFieldValue, EventFieldType, pBuffer_out, pBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhsetdecodingparameter
  public static TdhSetDecodingParameter(Handle: TDH_HANDLE, TdhContext: PTDH_CONTEXT): TDHSTATUS {
    return Tdh.Load('TdhSetDecodingParameter')(Handle, TdhContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhunloadmanifest
  public static TdhUnloadManifest(Manifest: PWSTR): TDHSTATUS {
    return Tdh.Load('TdhUnloadManifest')(Manifest);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tdh/nf-tdh-tdhunloadmanifestfrommemory
  public static TdhUnloadManifestFromMemory(pData: LPCVOID, cbData: ULONG): TDHSTATUS {
    return Tdh.Load('TdhUnloadManifestFromMemory')(pData, cbData);
  }
}

export default Tdh;
