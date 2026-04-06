import type { Pointer } from 'bun:ffi';
import type { HANDLE } from '@bun-win32/core';

export type { ACCESS_MASK, BOOLEAN, DWORD, HANDLE, LONG, NULL, PHANDLE, PULONG, PVOID, SIZE_T, ULONG, ULONG_PTR, USHORT, VOID } from '@bun-win32/core';

export type NTSTATUS = number;

export const STATUS_ACCESS_DENIED: NTSTATUS = 0xc000_0022 | 0;
export const STATUS_BUFFER_OVERFLOW: NTSTATUS = 0x8000_0005 | 0;
export const STATUS_BUFFER_TOO_SMALL: NTSTATUS = 0xc000_0023 | 0;
export const STATUS_INFO_LENGTH_MISMATCH: NTSTATUS = 0xc000_0004 | 0;
export const STATUS_INVALID_HANDLE: NTSTATUS = 0xc000_0008 | 0;
export const STATUS_INVALID_PARAMETER: NTSTATUS = 0xc000_000d | 0;
export const STATUS_NOT_IMPLEMENTED: NTSTATUS = 0xc000_0002 | 0;
export const STATUS_NO_MEMORY: NTSTATUS = 0xc000_0017 | 0;
export const STATUS_NO_MORE_ENTRIES: NTSTATUS = 0x8000_001a | 0;
export const STATUS_OBJECT_NAME_COLLISION: NTSTATUS = 0xc000_0035 | 0;
export const STATUS_OBJECT_NAME_NOT_FOUND: NTSTATUS = 0xc000_0034 | 0;
export const STATUS_OBJECT_PATH_NOT_FOUND: NTSTATUS = 0xc000_003a | 0;
export const STATUS_OBJECT_TYPE_MISMATCH: NTSTATUS = 0xc000_0024 | 0;
export const STATUS_PENDING: NTSTATUS = 0x0000_0103;
export const STATUS_SUCCESS: NTSTATUS = 0x0000_0000;
export const STATUS_TIMEOUT: NTSTATUS = 0x0000_0102;
export const STATUS_UNSUCCESSFUL: NTSTATUS = 0xc000_0001 | 0;

export const NT_CURRENT_PROCESS = -1n as HANDLE;
export const NT_CURRENT_THREAD = -2n as HANDLE;

export enum EventType {
  NotificationEvent = 0x0000_0000,
  SynchronizationEvent = 0x0000_0001,
}

export enum FileInformationClass {
  FileDirectoryInformation = 0x0000_0001,
  FileFullDirectoryInformation = 0x0000_0002,
  FileBothDirectoryInformation = 0x0000_0003,
  FileBasicInformation = 0x0000_0004,
  FileStandardInformation = 0x0000_0005,
  FileInternalInformation = 0x0000_0006,
  FileEaInformation = 0x0000_0007,
  FileAccessInformation = 0x0000_0008,
  FileNameInformation = 0x0000_0009,
  FileRenameInformation = 0x0000_000a,
  FileLinkInformation = 0x0000_000b,
  FileNamesInformation = 0x0000_000c,
  FileDispositionInformation = 0x0000_000d,
  FilePositionInformation = 0x0000_000e,
  FileFullEaInformation = 0x0000_000f,
  FileModeInformation = 0x0000_0010,
  FileAlignmentInformation = 0x0000_0011,
  FileAllInformation = 0x0000_0012,
  FileAllocationInformation = 0x0000_0013,
  FileEndOfFileInformation = 0x0000_0014,
  FileAlternateNameInformation = 0x0000_0015,
  FileStreamInformation = 0x0000_0016,
  FilePipeInformation = 0x0000_0017,
  FilePipeLocalInformation = 0x0000_0018,
  FilePipeRemoteInformation = 0x0000_0019,
  FileMailslotQueryInformation = 0x0000_001a,
  FileMailslotSetInformation = 0x0000_001b,
  FileCompressionInformation = 0x0000_001c,
  FileObjectIdInformation = 0x0000_001d,
  FileCompletionInformation = 0x0000_001e,
  FileMoveClusterInformation = 0x0000_001f,
  FileQuotaInformation = 0x0000_0020,
  FileReparsePointInformation = 0x0000_0021,
  FileNetworkOpenInformation = 0x0000_0022,
  FileAttributeTagInformation = 0x0000_0023,
  FileTrackingInformation = 0x0000_0024,
  FileIdBothDirectoryInformation = 0x0000_0025,
  FileIdFullDirectoryInformation = 0x0000_0026,
  FileValidDataLengthInformation = 0x0000_0027,
  FileShortNameInformation = 0x0000_0028,
  FileIoCompletionNotificationInformation = 0x0000_0029,
  FileIoStatusBlockRangeInformation = 0x0000_002a,
  FileIoPriorityHintInformation = 0x0000_002b,
  FileSfioReserveInformation = 0x0000_002c,
  FileSfioVolumeInformation = 0x0000_002d,
  FileHardLinkInformation = 0x0000_002e,
  FileProcessIdsUsingFileInformation = 0x0000_002f,
  FileNormalizedNameInformation = 0x0000_0030,
  FileNetworkPhysicalNameInformation = 0x0000_0031,
  FileIdGlobalTxDirectoryInformation = 0x0000_0032,
  FileIsRemoteDeviceInformation = 0x0000_0033,
  FileUnusedInformation = 0x0000_0034,
  FileNumaNodeInformation = 0x0000_0035,
  FileStandardLinkInformation = 0x0000_0036,
  FileRemoteProtocolInformation = 0x0000_0037,
  FileRenameInformationBypassAccessCheck = 0x0000_0038,
  FileLinkInformationBypassAccessCheck = 0x0000_0039,
  FileVolumeNameInformation = 0x0000_003a,
  FileIdInformation = 0x0000_003b,
  FileIdExtdDirectoryInformation = 0x0000_003c,
  FileReplaceCompletionInformation = 0x0000_003d,
  FileHardLinkFullIdInformation = 0x0000_003e,
  FileIdExtdBothDirectoryInformation = 0x0000_003f,
  FileDispositionInformationEx = 0x0000_0040,
  FileRenameInformationEx = 0x0000_0041,
  FileRenameInformationExBypassAccessCheck = 0x0000_0042,
  FileDesiredStorageClassInformation = 0x0000_0043,
  FileStatInformation = 0x0000_0044,
  FileMemoryPartitionInformation = 0x0000_0045,
  FileStatLxInformation = 0x0000_0046,
  FileCaseSensitiveInformation = 0x0000_0047,
  FileLinkInformationEx = 0x0000_0048,
  FileLinkInformationExBypassAccessCheck = 0x0000_0049,
  FileStorageReserveIdInformation = 0x0000_004a,
  FileCaseSensitiveInformationForceAccessCheck = 0x0000_004b,
}

export enum FsInformationClass {
  FileFsAttributeInformation = 0x0000_0005,
  FileFsControlInformation = 0x0000_0006,
  FileFsDeviceInformation = 0x0000_0004,
  FileFsDriverPathInformation = 0x0000_0007,
  FileFsFullSizeInformation = 0x0000_0007,
  FileFsLabelInformation = 0x0000_0002,
  FileFsObjectIdInformation = 0x0000_0008,
  FileFsSizeInformation = 0x0000_0003,
  FileFsVolumeInformation = 0x0000_0001,
}

export enum KeyInformationClass {
  KeyBasicInformation = 0x0000_0000,
  KeyCachedInformation = 0x0000_0004,
  KeyFlagsInformation = 0x0000_0005,
  KeyFullInformation = 0x0000_0001,
  KeyHandleTagsInformation = 0x0000_0005,
  KeyNameInformation = 0x0000_0003,
  KeyNodeInformation = 0x0000_0002,
  KeyVirtualizationInformation = 0x0000_0006,
}

export enum KeyValueInformationClass {
  KeyValueBasicInformation = 0x0000_0000,
  KeyValueFullInformation = 0x0000_0001,
  KeyValueFullInformationAlign64 = 0x0000_0004,
  KeyValuePartialInformation = 0x0000_0002,
  KeyValuePartialInformationAlign64 = 0x0000_0003,
}

export enum MemoryInformationClass {
  MemoryBasicInformation = 0x0000_0000,
  MemoryWorkingSetInformation = 0x0000_0001,
  MemoryMappedFilenameInformation = 0x0000_0002,
  MemoryRegionInformation = 0x0000_0003,
  MemoryWorkingSetExInformation = 0x0000_0004,
}

export enum ObjectInformationClass {
  ObjectBasicInformation = 0x0000_0000,
  ObjectNameInformation = 0x0000_0001,
  ObjectTypeInformation = 0x0000_0002,
  ObjectTypesInformation = 0x0000_0003,
  ObjectHandleFlagInformation = 0x0000_0004,
}

export enum ProcessInformationClass {
  ProcessBasicInformation = 0x0000_0000,
  ProcessDebugPort = 0x0000_0007,
  ProcessWow64Information = 0x0000_001a,
  ProcessImageFileName = 0x0000_001b,
  ProcessBreakOnTermination = 0x0000_001d,
  ProcessSubsystemInformation = 0x0000_004b,
}

export enum SectionInformationClass {
  SectionBasicInformation = 0x0000_0000,
  SectionImageInformation = 0x0000_0001,
}

export enum SectionInherit {
  ViewShare = 0x0000_0001,
  ViewUnmap = 0x0000_0002,
}

export enum SystemInformationClass {
  SystemBasicInformation = 0x0000_0000,
  SystemProcessorInformation = 0x0000_0001,
  SystemPerformanceInformation = 0x0000_0002,
  SystemTimeOfDayInformation = 0x0000_0003,
  SystemPathInformation = 0x0000_0004,
  SystemProcessInformation = 0x0000_0005,
  SystemCallCountInformation = 0x0000_0006,
  SystemDeviceInformation = 0x0000_0007,
  SystemProcessorPerformanceInformation = 0x0000_0008,
  SystemFlagsInformation = 0x0000_0009,
  SystemCallTimeInformation = 0x0000_000a,
  SystemModuleInformation = 0x0000_000b,
  SystemHandleInformation = 0x0000_0010,
  SystemObjectInformation = 0x0000_0011,
  SystemPagefileInformation = 0x0000_0012,
  SystemInterruptInformation = 0x0000_0017,
  SystemExceptionInformation = 0x0000_0021,
  SystemRegistryQuotaInformation = 0x0000_0025,
  SystemLookasideInformation = 0x0000_002d,
  SystemCodeIntegrityInformation = 0x0000_0067,
  SystemPolicyInformation = 0x0000_0086,
  SystemKernelDebuggerInformation = 0x0000_0023,
  SystemKernelDebuggerInformationEx = 0x0000_0095,
  SystemExtendedHandleInformation = 0x0000_0040,
  SystemProcessIdInformation = 0x0000_0058,
  SystemFirmwareTableInformation = 0x0000_004c,
}

export enum ThreadInformationClass {
  ThreadBasicInformation = 0x0000_0000,
  ThreadTimes = 0x0000_0001,
  ThreadPriority = 0x0000_0002,
  ThreadBasePriority = 0x0000_0003,
  ThreadAffinityMask = 0x0000_0004,
  ThreadImpersonationToken = 0x0000_0005,
  ThreadDescriptorTableEntry = 0x0000_0006,
  ThreadEnableAlignmentFaultFixup = 0x0000_0007,
  ThreadEventPair = 0x0000_0008,
  ThreadQuerySetWin32StartAddress = 0x0000_0009,
  ThreadZeroTlsCell = 0x0000_000a,
  ThreadPerformanceCount = 0x0000_000b,
  ThreadAmILastThread = 0x0000_000c,
  ThreadIdealProcessor = 0x0000_000d,
  ThreadPriorityBoost = 0x0000_000e,
  ThreadSetTlsArrayAddress = 0x0000_000f,
  ThreadIsIoPending = 0x0000_0010,
  ThreadHideFromDebugger = 0x0000_0011,
  ThreadBreakOnTermination = 0x0000_0012,
  ThreadSwitchLegacyState = 0x0000_0013,
  ThreadIsTerminated = 0x0000_0014,
  ThreadNameInformation = 0x0000_0026,
}

export enum TimerType {
  NotificationTimer = 0x0000_0000,
  SynchronizationTimer = 0x0000_0001,
}

export enum TokenInformationClass {
  TokenUser = 0x0000_0001,
  TokenGroups = 0x0000_0002,
  TokenPrivileges = 0x0000_0003,
  TokenOwner = 0x0000_0004,
  TokenPrimaryGroup = 0x0000_0005,
  TokenDefaultDacl = 0x0000_0006,
  TokenSource = 0x0000_0007,
  TokenType = 0x0000_0008,
  TokenImpersonationLevel = 0x0000_0009,
  TokenStatistics = 0x0000_000a,
  TokenRestrictedSids = 0x0000_000b,
  TokenSessionId = 0x0000_000c,
  TokenGroupsAndPrivileges = 0x0000_000d,
  TokenSessionReference = 0x0000_000e,
  TokenSandBoxInert = 0x0000_000f,
  TokenElevationType = 0x0000_0012,
  TokenLinkedToken = 0x0000_0013,
  TokenElevation = 0x0000_0014,
  TokenIntegrityLevel = 0x0000_0019,
}

export enum WaitType {
  WaitAll = 0x0000_0000,
  WaitAny = 0x0000_0001,
}

export type LANGID = number;
export type LARGE_INTEGER = bigint;
export type UCHAR = number;
export type ULONGLONG = bigint;

export type PACCESS_MASK = Pointer;
export type PACL = Pointer;
export type PANSI_STRING = Pointer;
export type PBOOLEAN = Pointer;
export type PCANSI_STRING = Pointer;
export type PCLIENT_ID = Pointer;
export type PCONTEXT = Pointer;
export type PCUNICODE_STRING = Pointer;
export type PCWSTR = Pointer;
export type PDBGUI_WAIT_STATE_CHANGE = Pointer;
export type PEXCEPTION_RECORD = Pointer;
export type PEXCEPTION_ROUTINE = Pointer;
export type PFILE_BASIC_INFORMATION = Pointer;
export type PFILE_IO_COMPLETION_INFORMATION = Pointer;
export type PFILE_NETWORK_OPEN_INFORMATION = Pointer;
export type PFILE_SEGMENT_ELEMENT = Pointer;
export type PGENERIC_MAPPING = Pointer;
export type PGET_RUNTIME_FUNCTION_CALLBACK = Pointer;
export type PIO_APC_ROUTINE = Pointer;
export type PIO_STATUS_BLOCK = Pointer;
export type PKEY_VALUE_ENTRY = Pointer;
export type PKNONVOLATILE_CONTEXT_POINTERS = Pointer;
export type PLARGE_INTEGER = Pointer;
export type PLCID = Pointer;
export type PLUID = Pointer;
export type PNTSTATUS = Pointer;
export type POBJECT_ATTRIBUTES = Pointer;
export type POEM_STRING = Pointer;
export type PPEB = Pointer;
export type PPRIVILEGE_SET = Pointer;
export type PPS_APC_ROUTINE = Pointer;
export type PPS_ATTRIBUTE_LIST = Pointer;
export type PRTL_BITMAP = Pointer;
export type PRTL_CONDITION_VARIABLE = Pointer;
export type PRTL_CRITICAL_SECTION = Pointer;
export type PRTL_HEAP_PARAMETERS = Pointer;
export type PRTL_OSVERSIONINFOEXW = Pointer;
export type PRTL_OSVERSIONINFOW = Pointer;
export type PRTL_RELATIVE_NAME_U = Pointer;
export type PRTL_SRWLOCK = Pointer;
export type PRTL_USER_PROCESS_PARAMETERS = Pointer;
export type PRUNTIME_FUNCTION = Pointer;
export type PSECURITY_DESCRIPTOR = Pointer;
export type PSECURITY_QUALITY_OF_SERVICE = Pointer;
export type PSID = Pointer;
export type PSID_IDENTIFIER_AUTHORITY = Pointer;
export type PSLIST_ENTRY = Pointer;
export type PSLIST_HEADER = Pointer;
export type PSIZE_T = Pointer;
export type PSTRING = Pointer;
export type PTOKEN_GROUPS = Pointer;
export type PTOKEN_PRIVILEGES = Pointer;
export type PTIMER_APC_ROUTINE = Pointer;
export type PULONG_PTR = Pointer;
export type PUNICODE_STRING = Pointer;
export type PUNWIND_HISTORY_TABLE = Pointer;
export type PVECTORED_EXCEPTION_HANDLER = Pointer;
export type PWSTR = Pointer;
export type WAITORTIMERCALLBACKFUNC = Pointer;
export type WORKERCALLBACKFUNC = Pointer;
