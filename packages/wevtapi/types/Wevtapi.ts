import type { Pointer } from 'bun:ffi';

import type { DWORD, HANDLE } from '@bun-win32/core';
export type { BOOL, DWORD, HANDLE, LPCWSTR, LPWSTR, NULL, PDWORD, PVOID } from '@bun-win32/core';

export const EVT_ALL_ACCESS = 0x0000_0007;
export const EVT_CLEAR_ACCESS = 0x0000_0004;
export const EVT_READ_ACCESS = 0x0000_0001;
export const EVT_VARIANT_TYPE_ARRAY = 0x0080;
export const EVT_VARIANT_TYPE_MASK = 0x007f;
export const EVT_WRITE_ACCESS = 0x0000_0002;

export enum EvtChannelClockType {
  EvtChannelClockTypeSystemTime = 0,
  EvtChannelClockTypeQPC,
}

export enum EvtChannelConfigPropertyId {
  EvtChannelConfigEnabled = 0,
  EvtChannelConfigIsolation,
  EvtChannelConfigType,
  EvtChannelConfigOwningPublisher,
  EvtChannelConfigClassicEventlog,
  EvtChannelConfigAccess,
  EvtChannelLoggingConfigRetention,
  EvtChannelLoggingConfigAutoBackup,
  EvtChannelLoggingConfigMaxSize,
  EvtChannelLoggingConfigLogFilePath,
  EvtChannelPublishingConfigLevel,
  EvtChannelPublishingConfigKeywords,
  EvtChannelPublishingConfigControlGuid,
  EvtChannelPublishingConfigBufferSize,
  EvtChannelPublishingConfigMinBuffers,
  EvtChannelPublishingConfigMaxBuffers,
  EvtChannelPublishingConfigLatency,
  EvtChannelPublishingConfigClockType,
  EvtChannelPublishingConfigSidType,
  EvtChannelPublisherList,
  EvtChannelPublishingConfigFileMax,
  EvtChannelConfigPropertyIdEND,
}

export enum EvtChannelIsolationType {
  EvtChannelIsolationTypeApplication = 0,
  EvtChannelIsolationTypeSystem,
  EvtChannelIsolationTypeCustom,
}

export enum EvtChannelReferenceFlags {
  EvtChannelReferenceImported = 0x0000_0001,
}

export enum EvtChannelSidType {
  EvtChannelSidTypeNone = 0,
  EvtChannelSidTypePublishing,
}

export enum EvtChannelType {
  EvtChannelTypeAdmin = 0,
  EvtChannelTypeOperational,
  EvtChannelTypeAnalytic,
  EvtChannelTypeDebug,
}

export enum EvtEventMetadataPropertyId {
  EventMetadataEventID = 0,
  EventMetadataEventVersion,
  EventMetadataEventChannel,
  EventMetadataEventLevel,
  EventMetadataEventOpcode,
  EventMetadataEventTask,
  EventMetadataEventKeyword,
  EventMetadataEventMessageID,
  EventMetadataEventTemplate,
  EvtEventMetadataPropertyIdEND,
}

export enum EvtEventPropertyId {
  EvtEventQueryIDs = 0,
  EvtEventPath,
  EvtEventPropertyIdEND,
}

export enum EvtExportLogFlags {
  EvtExportLogChannelPath = 0x0000_0001,
  EvtExportLogFilePath = 0x0000_0002,
  EvtExportLogTolerateQueryErrors = 0x0000_1000,
  EvtExportLogOverwrite = 0x0000_2000,
}

export enum EvtFormatMessageFlags {
  EvtFormatMessageEvent = 1,
  EvtFormatMessageLevel,
  EvtFormatMessageTask,
  EvtFormatMessageOpcode,
  EvtFormatMessageKeyword,
  EvtFormatMessageChannel,
  EvtFormatMessageProvider,
  EvtFormatMessageId,
  EvtFormatMessageXml,
}

export enum EvtLoginClass {
  EvtRpcLogin = 1,
}

export enum EvtLogPropertyId {
  EvtLogCreationTime = 0,
  EvtLogLastAccessTime,
  EvtLogLastWriteTime,
  EvtLogFileSize,
  EvtLogAttributes,
  EvtLogNumberOfLogRecords,
  EvtLogOldestRecordNumber,
  EvtLogFull,
}

export enum EvtOpenLogFlags {
  EvtOpenChannelPath = 0x0000_0001,
  EvtOpenFilePath = 0x0000_0002,
}

export enum EvtPublisherMetadataPropertyId {
  EvtPublisherMetadataPublisherGuid = 0,
  EvtPublisherMetadataResourceFilePath,
  EvtPublisherMetadataParameterFilePath,
  EvtPublisherMetadataMessageFilePath,
  EvtPublisherMetadataHelpLink,
  EvtPublisherMetadataPublisherMessageID,
  EvtPublisherMetadataChannelReferences,
  EvtPublisherMetadataChannelReferencePath,
  EvtPublisherMetadataChannelReferenceIndex,
  EvtPublisherMetadataChannelReferenceID,
  EvtPublisherMetadataChannelReferenceFlags,
  EvtPublisherMetadataChannelReferenceMessageID,
  EvtPublisherMetadataLevels,
  EvtPublisherMetadataLevelName,
  EvtPublisherMetadataLevelValue,
  EvtPublisherMetadataLevelMessageID,
  EvtPublisherMetadataTasks,
  EvtPublisherMetadataTaskName,
  EvtPublisherMetadataTaskEventGuid,
  EvtPublisherMetadataTaskValue,
  EvtPublisherMetadataTaskMessageID,
  EvtPublisherMetadataOpcodes,
  EvtPublisherMetadataOpcodeName,
  EvtPublisherMetadataOpcodeValue,
  EvtPublisherMetadataOpcodeMessageID,
  EvtPublisherMetadataKeywords,
  EvtPublisherMetadataKeywordName,
  EvtPublisherMetadataKeywordValue,
  EvtPublisherMetadataKeywordMessageID,
  EvtPublisherMetadataPropertyIdEND,
}

export enum EvtQueryFlags {
  EvtQueryChannelPath = 0x0000_0001,
  EvtQueryFilePath = 0x0000_0002,
  EvtQueryForwardDirection = 0x0000_0100,
  EvtQueryReverseDirection = 0x0000_0200,
  EvtQueryTolerateQueryErrors = 0x0000_1000,
}

export enum EvtQueryPropertyId {
  EvtQueryNames = 0,
  EvtQueryStatuses,
  EvtQueryPropertyIdEND,
}

export enum EvtRenderContextFlags {
  EvtRenderContextValues = 0,
  EvtRenderContextSystem,
  EvtRenderContextUser,
}

export enum EvtRenderFlags {
  EvtRenderEventValues = 0,
  EvtRenderEventXml,
  EvtRenderBookmark,
}

export enum EvtRpcLoginFlags {
  EvtRpcLoginAuthDefault = 0,
  EvtRpcLoginAuthNegotiate,
  EvtRpcLoginAuthKerberos,
  EvtRpcLoginAuthNTLM,
}

export enum EvtSeekFlags {
  EvtSeekRelativeToFirst = 1,
  EvtSeekRelativeToLast = 2,
  EvtSeekRelativeToCurrent = 3,
  EvtSeekRelativeToBookmark = 4,
  EvtSeekOriginMask = 7,
  EvtSeekStrict = 0x0001_0000,
}

export enum EvtSubscribeFlags {
  EvtSubscribeToFutureEvents = 1,
  EvtSubscribeStartAtOldestRecord = 2,
  EvtSubscribeStartAfterBookmark = 3,
  EvtSubscribeOriginMask = 3,
  EvtSubscribeTolerateQueryErrors = 0x0000_1000,
  EvtSubscribeStrict = 0x0001_0000,
}

export enum EvtSubscribeNotifyAction {
  EvtSubscribeActionError = 0,
  EvtSubscribeActionDeliver,
}

export enum EvtSystemPropertyId {
  EvtSystemProviderName = 0,
  EvtSystemProviderGuid,
  EvtSystemEventID,
  EvtSystemQualifiers,
  EvtSystemLevel,
  EvtSystemTask,
  EvtSystemOpcode,
  EvtSystemKeywords,
  EvtSystemTimeCreated,
  EvtSystemEventRecordId,
  EvtSystemActivityID,
  EvtSystemRelatedActivityID,
  EvtSystemProcessID,
  EvtSystemThreadID,
  EvtSystemChannel,
  EvtSystemComputer,
  EvtSystemUserID,
  EvtSystemVersion,
  EvtSystemPropertyIdEND,
}

export enum EvtVariantType {
  EvtVarTypeNull = 0,
  EvtVarTypeString,
  EvtVarTypeAnsiString,
  EvtVarTypeSByte,
  EvtVarTypeByte,
  EvtVarTypeInt16,
  EvtVarTypeUInt16,
  EvtVarTypeInt32,
  EvtVarTypeUInt32,
  EvtVarTypeInt64,
  EvtVarTypeUInt64,
  EvtVarTypeSingle,
  EvtVarTypeDouble,
  EvtVarTypeBoolean,
  EvtVarTypeBinary,
  EvtVarTypeGuid,
  EvtVarTypeSizeT,
  EvtVarTypeFileTime,
  EvtVarTypeSysTime,
  EvtVarTypeSid,
  EvtVarTypeHexInt32,
  EvtVarTypeHexInt64,
  EvtVarTypeEvtHandle = 32,
  EvtVarTypeEvtXml = 35,
}

export type EVT_HANDLE = HANDLE;
export type EVT_OBJECT_ARRAY_PROPERTY_HANDLE = HANDLE;
export type EVT_SUBSCRIBE_CALLBACK = Pointer;
export type LCID = DWORD;
export type LONGLONG = bigint;
export type PEVT_HANDLE = Pointer;
export type PEVT_RPC_LOGIN = Pointer;
export type PEVT_VARIANT = Pointer;
export type PLPCWSTR = Pointer;
