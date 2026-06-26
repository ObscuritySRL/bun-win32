import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  DWORD,
  EVT_HANDLE,
  EVT_OBJECT_ARRAY_PROPERTY_HANDLE,
  EVT_SUBSCRIBE_CALLBACK,
  EvtChannelConfigPropertyId,
  EvtEventMetadataPropertyId,
  EvtEventPropertyId,
  EvtExportLogFlags,
  EvtFormatMessageFlags,
  EvtLoginClass,
  EvtLogPropertyId,
  EvtOpenLogFlags,
  EvtPublisherMetadataPropertyId,
  EvtQueryFlags,
  EvtQueryPropertyId,
  EvtRenderContextFlags,
  EvtRenderFlags,
  EvtSeekFlags,
  EvtSubscribeFlags,
  HANDLE,
  LCID,
  LONGLONG,
  LPCWSTR,
  LPWSTR,
  Nullable,
  Optional,
  PDWORD,
  PEVT_HANDLE,
  PEVT_RPC_LOGIN,
  PEVT_VARIANT,
  PLPCWSTR,
  PVOID,
} from '../types/Wevtapi';

/**
 * Thin, lazy-loaded FFI bindings for `wevtapi.dll`.
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
 * import Wevtapi from './structs/Wevtapi';
 *
 * const channelPath = Buffer.from('System\0', 'utf16le');
 * const query = Buffer.from('*\0', 'utf16le');
 * const queryHandle = Wevtapi.EvtQuery(0n, channelPath.ptr, query.ptr, 0x0000_0001);
 * ```
 */
class Wevtapi extends Win32 {
  protected static override name = 'wevtapi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    EvtArchiveExportedLog: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    EvtCancel: { args: [FFIType.u64], returns: FFIType.i32 },
    EvtClearLog: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    EvtClose: { args: [FFIType.u64], returns: FFIType.i32 },
    EvtCreateBookmark: { args: [FFIType.ptr], returns: FFIType.u64 },
    EvtCreateRenderContext: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    EvtExportLog: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    EvtFormatMessage: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EvtGetChannelConfigProperty: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EvtGetEventInfo: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EvtGetEventMetadataProperty: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EvtGetExtendedStatus: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    EvtGetLogInfo: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EvtGetObjectArrayProperty: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EvtGetObjectArraySize: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    EvtGetPublisherMetadataProperty: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EvtGetQueryInfo: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EvtNext: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    EvtNextChannelPath: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EvtNextEventMetadata: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    EvtNextPublisherId: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EvtOpenChannelConfig: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    EvtOpenChannelEnum: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    EvtOpenEventMetadataEnum: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    EvtOpenLog: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    EvtOpenPublisherEnum: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    EvtOpenPublisherMetadata: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    EvtOpenSession: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    EvtQuery: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    EvtRender: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EvtSaveChannelConfig: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    EvtSeek: { args: [FFIType.u64, FFIType.i64, FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    EvtSetChannelConfigProperty: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    EvtSubscribe: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    EvtUpdateBookmark: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtarchiveexportedlog
  public static EvtArchiveExportedLog(Session: Optional<EVT_HANDLE>, LogFilePath: LPCWSTR, Locale: LCID, Flags: DWORD): BOOL {
    return Wevtapi.Load('EvtArchiveExportedLog')(Session, LogFilePath, Locale, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtcancel
  public static EvtCancel(Object: Optional<EVT_HANDLE>): BOOL {
    return Wevtapi.Load('EvtCancel')(Object);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtclearlog
  public static EvtClearLog(Session: Optional<EVT_HANDLE>, ChannelPath: LPCWSTR, TargetFilePath: Optional<LPCWSTR>, Flags: DWORD): BOOL {
    return Wevtapi.Load('EvtClearLog')(Session, ChannelPath, TargetFilePath, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtclose
  public static EvtClose(Object: EVT_HANDLE): BOOL {
    return Wevtapi.Load('EvtClose')(Object);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtcreatebookmark
  public static EvtCreateBookmark(BookmarkXml: Optional<LPCWSTR>): EVT_HANDLE {
    return Wevtapi.Load('EvtCreateBookmark')(BookmarkXml);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtcreaterendercontext
  public static EvtCreateRenderContext(ValuePathsCount: DWORD, ValuePaths: Optional<PLPCWSTR>, Flags: EvtRenderContextFlags): EVT_HANDLE {
    return Wevtapi.Load('EvtCreateRenderContext')(ValuePathsCount, ValuePaths, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtexportlog
  public static EvtExportLog(Session: Optional<EVT_HANDLE>, Path: Optional<LPCWSTR>, Query: Optional<LPCWSTR>, TargetFilePath: LPCWSTR, Flags: EvtExportLogFlags): BOOL {
    return Wevtapi.Load('EvtExportLog')(Session, Path, Query, TargetFilePath, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtformatmessage
  public static EvtFormatMessage(
    PublisherMetadata: Optional<EVT_HANDLE>,
    Event: Optional<EVT_HANDLE>,
    MessageId: DWORD,
    ValueCount: DWORD,
    Values: Optional<PEVT_VARIANT>,
    Flags: EvtFormatMessageFlags,
    BufferSize: DWORD,
    Buffer_out: Optional<LPWSTR>,
    BufferUsed_out: PDWORD,
  ): BOOL {
    return Wevtapi.Load('EvtFormatMessage')(PublisherMetadata, Event, MessageId, ValueCount, Values, Flags, BufferSize, Buffer_out, BufferUsed_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtgetchannelconfigproperty
  public static EvtGetChannelConfigProperty(
    ChannelConfig: EVT_HANDLE,
    PropertyId: EvtChannelConfigPropertyId,
    Flags: DWORD,
    PropertyValueBufferSize: DWORD,
    PropertyValueBuffer_out: Optional<PEVT_VARIANT>,
    PropertyValueBufferUsed_out: PDWORD,
  ): BOOL {
    return Wevtapi.Load('EvtGetChannelConfigProperty')(ChannelConfig, PropertyId, Flags, PropertyValueBufferSize, PropertyValueBuffer_out, PropertyValueBufferUsed_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtgeteventinfo
  public static EvtGetEventInfo(Event: EVT_HANDLE, PropertyId: EvtEventPropertyId, PropertyValueBufferSize: DWORD, PropertyValueBuffer_out: Optional<PEVT_VARIANT>, PropertyValueBufferUsed_out: PDWORD): BOOL {
    return Wevtapi.Load('EvtGetEventInfo')(Event, PropertyId, PropertyValueBufferSize, PropertyValueBuffer_out, PropertyValueBufferUsed_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtgeteventmetadataproperty
  public static EvtGetEventMetadataProperty(
    EventMetadata: EVT_HANDLE,
    PropertyId: EvtEventMetadataPropertyId,
    Flags: DWORD,
    EventMetadataPropertyBufferSize: DWORD,
    EventMetadataPropertyBuffer_out: Optional<PEVT_VARIANT>,
    EventMetadataPropertyBufferUsed_out: PDWORD,
  ): BOOL {
    return Wevtapi.Load('EvtGetEventMetadataProperty')(EventMetadata, PropertyId, Flags, EventMetadataPropertyBufferSize, EventMetadataPropertyBuffer_out, EventMetadataPropertyBufferUsed_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtgetextendedstatus
  public static EvtGetExtendedStatus(BufferSize: DWORD, Buffer_out: Optional<LPWSTR>, BufferUsed_out: PDWORD): DWORD {
    return Wevtapi.Load('EvtGetExtendedStatus')(BufferSize, Buffer_out, BufferUsed_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtgetloginfo
  public static EvtGetLogInfo(Log: EVT_HANDLE, PropertyId: EvtLogPropertyId, PropertyValueBufferSize: DWORD, PropertyValueBuffer_out: Optional<PEVT_VARIANT>, PropertyValueBufferUsed_out: PDWORD): BOOL {
    return Wevtapi.Load('EvtGetLogInfo')(Log, PropertyId, PropertyValueBufferSize, PropertyValueBuffer_out, PropertyValueBufferUsed_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtgetobjectarrayproperty
  public static EvtGetObjectArrayProperty(
    ObjectArray: EVT_OBJECT_ARRAY_PROPERTY_HANDLE,
    PropertyId: DWORD,
    ArrayIndex: DWORD,
    Flags: DWORD,
    PropertyValueBufferSize: DWORD,
    PropertyValueBuffer_out: Optional<PEVT_VARIANT>,
    PropertyValueBufferUsed_out: PDWORD,
  ): BOOL {
    return Wevtapi.Load('EvtGetObjectArrayProperty')(ObjectArray, PropertyId, ArrayIndex, Flags, PropertyValueBufferSize, PropertyValueBuffer_out, PropertyValueBufferUsed_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtgetobjectarraysize
  public static EvtGetObjectArraySize(ObjectArray: EVT_OBJECT_ARRAY_PROPERTY_HANDLE, ObjectArraySize_out: PDWORD): BOOL {
    return Wevtapi.Load('EvtGetObjectArraySize')(ObjectArray, ObjectArraySize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtgetpublishermetadataproperty
  public static EvtGetPublisherMetadataProperty(
    PublisherMetadata: EVT_HANDLE,
    PropertyId: EvtPublisherMetadataPropertyId,
    Flags: DWORD,
    PublisherMetadataPropertyBufferSize: DWORD,
    PublisherMetadataPropertyBuffer_out: Optional<PEVT_VARIANT>,
    PublisherMetadataPropertyBufferUsed_out: PDWORD,
  ): BOOL {
    return Wevtapi.Load('EvtGetPublisherMetadataProperty')(PublisherMetadata, PropertyId, Flags, PublisherMetadataPropertyBufferSize, PublisherMetadataPropertyBuffer_out, PublisherMetadataPropertyBufferUsed_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtgetqueryinfo
  public static EvtGetQueryInfo(QueryOrSubscription: EVT_HANDLE, PropertyId: EvtQueryPropertyId, PropertyValueBufferSize: DWORD, PropertyValueBuffer_out: Optional<PEVT_VARIANT>, PropertyValueBufferUsed_out: PDWORD): BOOL {
    return Wevtapi.Load('EvtGetQueryInfo')(QueryOrSubscription, PropertyId, PropertyValueBufferSize, PropertyValueBuffer_out, PropertyValueBufferUsed_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtnext
  public static EvtNext(ResultSet: EVT_HANDLE, EventsSize: DWORD, Events_out: PEVT_HANDLE, Timeout: DWORD, Flags: DWORD, Returned_out: PDWORD): BOOL {
    return Wevtapi.Load('EvtNext')(ResultSet, EventsSize, Events_out, Timeout, Flags, Returned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtnextchannelpath
  public static EvtNextChannelPath(ChannelEnum: EVT_HANDLE, ChannelPathBufferSize: DWORD, ChannelPathBuffer_out: Optional<LPWSTR>, ChannelPathBufferUsed_out: PDWORD): BOOL {
    return Wevtapi.Load('EvtNextChannelPath')(ChannelEnum, ChannelPathBufferSize, ChannelPathBuffer_out, ChannelPathBufferUsed_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtnexteventmetadata
  public static EvtNextEventMetadata(EventMetadataEnum: EVT_HANDLE, Flags: DWORD): EVT_HANDLE {
    return Wevtapi.Load('EvtNextEventMetadata')(EventMetadataEnum, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtnextpublisherid
  public static EvtNextPublisherId(PublisherEnum: EVT_HANDLE, PublisherIdBufferSize: DWORD, PublisherIdBuffer_out: Optional<LPWSTR>, PublisherIdBufferUsed_out: PDWORD): BOOL {
    return Wevtapi.Load('EvtNextPublisherId')(PublisherEnum, PublisherIdBufferSize, PublisherIdBuffer_out, PublisherIdBufferUsed_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtopenchannelconfig
  public static EvtOpenChannelConfig(Session: Optional<EVT_HANDLE>, ChannelPath: LPCWSTR, Flags: DWORD): EVT_HANDLE {
    return Wevtapi.Load('EvtOpenChannelConfig')(Session, ChannelPath, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtopenchannelenum
  public static EvtOpenChannelEnum(Session: Optional<EVT_HANDLE>, Flags: DWORD): EVT_HANDLE {
    return Wevtapi.Load('EvtOpenChannelEnum')(Session, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtopeneventmetadataenum
  public static EvtOpenEventMetadataEnum(PublisherMetadata: EVT_HANDLE, Flags: DWORD): EVT_HANDLE {
    return Wevtapi.Load('EvtOpenEventMetadataEnum')(PublisherMetadata, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtopenlog
  public static EvtOpenLog(Session: Optional<EVT_HANDLE>, Path: LPCWSTR, Flags: EvtOpenLogFlags): EVT_HANDLE {
    return Wevtapi.Load('EvtOpenLog')(Session, Path, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtopenpublisherenum
  public static EvtOpenPublisherEnum(Session: Optional<EVT_HANDLE>, Flags: DWORD): EVT_HANDLE {
    return Wevtapi.Load('EvtOpenPublisherEnum')(Session, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtopenpublishermetadata
  public static EvtOpenPublisherMetadata(Session: Optional<EVT_HANDLE>, PublisherId: LPCWSTR, LogFilePath: Optional<LPCWSTR>, Locale: LCID, Flags: DWORD): EVT_HANDLE {
    return Wevtapi.Load('EvtOpenPublisherMetadata')(Session, PublisherId, LogFilePath, Locale, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtopensession
  public static EvtOpenSession(LoginClass: EvtLoginClass, Login: PEVT_RPC_LOGIN, Timeout: DWORD, Flags: DWORD): EVT_HANDLE {
    return Wevtapi.Load('EvtOpenSession')(LoginClass, Login, Timeout, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtquery
  public static EvtQuery(Session: Optional<EVT_HANDLE>, Path: Optional<LPCWSTR>, Query: Optional<LPCWSTR>, Flags: EvtQueryFlags): EVT_HANDLE {
    return Wevtapi.Load('EvtQuery')(Session, Path, Query, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtrender
  public static EvtRender(Context: Optional<EVT_HANDLE>, Fragment: EVT_HANDLE, Flags: EvtRenderFlags, BufferSize: DWORD, Buffer_out: Optional<PVOID>, BufferUsed_out: PDWORD, PropertyCount_out: PDWORD): BOOL {
    return Wevtapi.Load('EvtRender')(Context, Fragment, Flags, BufferSize, Buffer_out, BufferUsed_out, PropertyCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtsavechannelconfig
  public static EvtSaveChannelConfig(ChannelConfig: EVT_HANDLE, Flags: DWORD): BOOL {
    return Wevtapi.Load('EvtSaveChannelConfig')(ChannelConfig, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtseek
  public static EvtSeek(ResultSet: EVT_HANDLE, Position: LONGLONG, Bookmark: Optional<EVT_HANDLE>, Timeout: DWORD, Flags: EvtSeekFlags): BOOL {
    return Wevtapi.Load('EvtSeek')(ResultSet, Position, Bookmark, Timeout, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtsetchannelconfigproperty
  public static EvtSetChannelConfigProperty(ChannelConfig: EVT_HANDLE, PropertyId: EvtChannelConfigPropertyId, Flags: DWORD, PropertyValue: PEVT_VARIANT): BOOL {
    return Wevtapi.Load('EvtSetChannelConfigProperty')(ChannelConfig, PropertyId, Flags, PropertyValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtsubscribe
  public static EvtSubscribe(
    Session: Optional<EVT_HANDLE>,
    SignalEvent: Optional<HANDLE>,
    ChannelPath: Optional<LPCWSTR>,
    Query: Optional<LPCWSTR>,
    Bookmark: Optional<EVT_HANDLE>,
    Context: Nullable<PVOID>,
    Callback: Nullable<EVT_SUBSCRIBE_CALLBACK>,
    Flags: EvtSubscribeFlags,
  ): EVT_HANDLE {
    return Wevtapi.Load('EvtSubscribe')(Session, SignalEvent, ChannelPath, Query, Bookmark, Context, Callback, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winevt/nf-winevt-evtupdatebookmark
  public static EvtUpdateBookmark(Bookmark: EVT_HANDLE, Event: EVT_HANDLE): BOOL {
    return Wevtapi.Load('EvtUpdateBookmark')(Bookmark, Event);
  }
}

export default Wevtapi;
