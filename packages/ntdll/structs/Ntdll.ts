import { type FFIFunction, FFIType } from 'bun:ffi';
import { Win32 } from '@bun-win32/core';

import type {
  ACCESS_MASK,
  BOOLEAN,
  DWORD,
  HANDLE,
  LANGID,
  LARGE_INTEGER,
  LONG,
  NTSTATUS,
  NULL,
  PACCESS_MASK,
  PACL,
  PANSI_STRING,
  PBOOLEAN,
  PCANSI_STRING,
  PCLIENT_ID,
  PCONTEXT,
  PCUNICODE_STRING,
  PCWSTR,
  PDBGUI_WAIT_STATE_CHANGE,
  PEXCEPTION_RECORD,
  PEXCEPTION_ROUTINE,
  PFILE_BASIC_INFORMATION,
  PFILE_IO_COMPLETION_INFORMATION,
  PFILE_NETWORK_OPEN_INFORMATION,
  PFILE_SEGMENT_ELEMENT,
  PGENERIC_MAPPING,
  PGET_RUNTIME_FUNCTION_CALLBACK,
  PHANDLE,
  PIO_APC_ROUTINE,
  PIO_STATUS_BLOCK,
  PKEY_VALUE_ENTRY,
  PKNONVOLATILE_CONTEXT_POINTERS,
  PLARGE_INTEGER,
  PLCID,
  PLUID,
  PNTSTATUS,
  POBJECT_ATTRIBUTES,
  POEM_STRING,
  PPEB,
  PPRIVILEGE_SET,
  PPS_APC_ROUTINE,
  PPS_ATTRIBUTE_LIST,
  PRTL_BITMAP,
  PRTL_CONDITION_VARIABLE,
  PRTL_CRITICAL_SECTION,
  PRTL_HEAP_PARAMETERS,
  PRTL_OSVERSIONINFOEXW,
  PRTL_OSVERSIONINFOW,
  PRTL_RELATIVE_NAME_U,
  PRTL_SRWLOCK,
  PRTL_USER_PROCESS_PARAMETERS,
  PRUNTIME_FUNCTION,
  PSECURITY_DESCRIPTOR,
  PSECURITY_QUALITY_OF_SERVICE,
  PSID,
  PSID_IDENTIFIER_AUTHORITY,
  PSLIST_ENTRY,
  PSLIST_HEADER,
  PSIZE_T,
  PSTRING,
  PTOKEN_GROUPS,
  PTOKEN_PRIVILEGES,
  PTIMER_APC_ROUTINE,
  PULONG,
  PULONG_PTR,
  PUNICODE_STRING,
  PUNWIND_HISTORY_TABLE,
  PVECTORED_EXCEPTION_HANDLER,
  PVOID,
  PWSTR,
  SIZE_T,
  UCHAR,
  ULONG,
  ULONG_PTR,
  ULONGLONG,
  USHORT,
  VOID,
  WAITORTIMERCALLBACKFUNC,
  WORKERCALLBACKFUNC,
} from '../types/Ntdll';

/**
 * Thin, lazy-loaded FFI bindings for `ntdll.dll`.
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
 * import Ntdll from './structs/Ntdll';
 *
 * // Lazy: bind on first call
 * const status = Ntdll.NtClose(handle);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Ntdll.Preload(['NtClose', 'NtQueryInformationProcess']);
 * ```
 */
class Ntdll extends Win32 {
  protected static override name = 'ntdll.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    DbgBreakPoint: { args: [], returns: FFIType.void },
    NtAccessCheck: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtAdjustGroupsToken: { args: [FFIType.u64, FFIType.u8, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtAdjustPrivilegesToken: { args: [FFIType.u64, FFIType.u8, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtAlertResumeThread: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtAlertThread: { args: [FFIType.u64], returns: FFIType.i32 },
    NtAllocateLocallyUniqueId: { args: [FFIType.ptr], returns: FFIType.i32 },
    NtAllocateVirtualMemory: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    NtAssignProcessToJobObject: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    NtCancelIoFile: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtCancelIoFileEx: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtCancelSynchronousIoFile: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtCancelTimer: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtClearEvent: { args: [FFIType.u64], returns: FFIType.i32 },
    NtClose: { args: [FFIType.u64], returns: FFIType.i32 },
    NtCompactKeys: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtCompareObjects: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    NtCompressKey: { args: [FFIType.u64], returns: FFIType.i32 },
    NtCreateDebugObject: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NtCreateDirectoryObject: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtCreateEvent: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u8], returns: FFIType.i32 },
    NtCreateFile: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NtCreateIoCompletion: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NtCreateJobObject: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtCreateKey: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtCreateMailslotFile: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtCreateMutant: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u8], returns: FFIType.i32 },
    NtCreateNamedPipeFile: {
      args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr],
      returns: FFIType.i32,
    },
    NtCreateSection: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    NtCreateSemaphore: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    NtCreateSymbolicLinkObject: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtCreateThreadEx: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtCreateTimer: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NtDebugActiveProcess: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    NtDebugContinue: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    NtDelayExecution: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    NtDeleteFile: { args: [FFIType.ptr], returns: FFIType.i32 },
    NtDeleteKey: { args: [FFIType.u64], returns: FFIType.i32 },
    NtDeleteValueKey: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtDeviceIoControlFile: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NtDuplicateObject: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    NtDuplicateToken: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u8, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtEnumerateKey: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtEnumerateValueKey: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtExtendSection: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtFilterToken: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtFlushBuffersFile: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtFlushBuffersFileEx: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtFlushInstructionCache: { args: [FFIType.u64, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    NtFlushKey: { args: [FFIType.u64], returns: FFIType.i32 },
    NtFlushVirtualMemory: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtFreeVirtualMemory: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NtFsControlFile: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NtGetContextThread: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtGetCurrentProcessorNumber: { args: [], returns: FFIType.u32 },
    NtGetNextProcess: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtGetNextThread: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtImpersonateAnonymousToken: { args: [FFIType.u64], returns: FFIType.i32 },
    NtImpersonateThread: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtIsProcessInJob: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    NtLoadKey: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtLockFile: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u8, FFIType.u8], returns: FFIType.i32 },
    NtLockVirtualMemory: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NtMakePermanentObject: { args: [FFIType.u64], returns: FFIType.i32 },
    NtMakeTemporaryObject: { args: [FFIType.u64], returns: FFIType.i32 },
    NtMapViewOfSection: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    NtNotifyChangeDirectoryFile: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u8], returns: FFIType.i32 },
    NtNotifyChangeKey: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u8, FFIType.ptr, FFIType.u32, FFIType.u8], returns: FFIType.i32 },
    NtNotifyChangeMultipleKeys: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u8, FFIType.ptr, FFIType.u32, FFIType.u8], returns: FFIType.i32 },
    NtOpenDirectoryObject: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtOpenEvent: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtOpenFile: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    NtOpenIoCompletion: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtOpenJobObject: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtOpenKey: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtOpenKeyEx: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NtOpenMutant: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtOpenProcess: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtOpenProcessToken: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtOpenProcessTokenEx: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtOpenSection: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtOpenSemaphore: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtOpenSymbolicLinkObject: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtOpenThread: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtOpenThreadToken: { args: [FFIType.u64, FFIType.u32, FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    NtOpenThreadTokenEx: { args: [FFIType.u64, FFIType.u32, FFIType.u8, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtOpenTimer: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtPowerInformation: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NtPrivilegeCheck: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtProtectVirtualMemory: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtPulseEvent: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtQueryAttributesFile: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtQueryDefaultLocale: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    NtQueryDefaultUILanguage: { args: [FFIType.ptr], returns: FFIType.i32 },
    NtQueryDirectoryFile: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u8, FFIType.ptr, FFIType.u8], returns: FFIType.i32 },
    NtQueryDirectoryObject: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u8, FFIType.u8, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtQueryEaFile: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u8, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u8], returns: FFIType.i32 },
    NtQueryEvent: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtQueryFullAttributesFile: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtQueryInformationFile: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    NtQueryInformationJobObject: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtQueryInformationProcess: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtQueryInformationThread: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtQueryInformationToken: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtQueryInstallUILanguage: { args: [FFIType.ptr], returns: FFIType.i32 },
    NtQueryIoCompletion: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtQueryKey: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtQueryMultipleValueKey: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtQueryMutant: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtQueryObject: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtQueryPerformanceCounter: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtQuerySection: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtQuerySecurityObject: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtQuerySemaphore: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtQuerySymbolicLinkObject: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtQuerySystemInformation: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtQuerySystemInformationEx: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtQuerySystemTime: { args: [FFIType.ptr], returns: FFIType.i32 },
    NtQueryTimer: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtQueryTimerResolution: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtQueryValueKey: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtQueryVirtualMemory: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtQueryVolumeInformationFile: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    NtQueueApcThread: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtQueueApcThreadEx: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtRaiseHardError: { args: [FFIType.i32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtReadFile: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtReadFileScatter: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtReadVirtualMemory: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtReleaseMutant: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtReleaseSemaphore: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    NtRemoveIoCompletion: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtRemoveIoCompletionEx: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u8], returns: FFIType.i32 },
    NtRemoveProcessDebug: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    NtRenameKey: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtResetEvent: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtRestoreKey: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    NtResumeProcess: { args: [FFIType.u64], returns: FFIType.i32 },
    NtResumeThread: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtSaveKey: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    NtSaveKeyEx: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    NtSetContextThread: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtSetDefaultLocale: { args: [FFIType.u8, FFIType.u32], returns: FFIType.i32 },
    NtSetDefaultUILanguage: { args: [FFIType.u16], returns: FFIType.i32 },
    NtSetEaFile: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NtSetEvent: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtSetInformationFile: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    NtSetInformationJobObject: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NtSetInformationObject: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NtSetInformationProcess: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NtSetInformationThread: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NtSetInformationToken: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NtSetIoCompletion: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u64], returns: FFIType.i32 },
    NtSetSecurityObject: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    NtSetSystemInformation: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NtSetTimer: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u8, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    NtSetTimerResolution: { args: [FFIType.u32, FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    NtSetValueKey: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NtSetVolumeInformationFile: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    NtShutdownSystem: { args: [FFIType.u32], returns: FFIType.i32 },
    NtSignalAndWaitForSingleObject: { args: [FFIType.u64, FFIType.u64, FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    NtSuspendProcess: { args: [FFIType.u64], returns: FFIType.i32 },
    NtSuspendThread: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtTerminateJobObject: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    NtTerminateProcess: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    NtTerminateThread: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    NtTestAlert: { args: [], returns: FFIType.i32 },
    NtUnloadKey: { args: [FFIType.ptr], returns: FFIType.i32 },
    NtUnlockFile: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NtUnlockVirtualMemory: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NtUnmapViewOfSection: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtUnmapViewOfSectionEx: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    NtWaitForDebugEvent: { args: [FFIType.u64, FFIType.u8, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtWaitForMultipleObjects: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    NtWaitForSingleObject: { args: [FFIType.u64, FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    NtWriteFile: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtWriteFileGather: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    NtWriteVirtualMemory: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    NtYieldExecution: { args: [], returns: FFIType.i32 },
    RtlAbsoluteToSelfRelativeSD: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RtlAcquireSRWLockExclusive: { args: [FFIType.ptr], returns: FFIType.void },
    RtlAcquireSRWLockShared: { args: [FFIType.ptr], returns: FFIType.void },
    RtlAddAccessAllowedAce: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RtlAddAccessAllowedAceEx: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RtlAddAccessDeniedAce: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RtlAddAccessDeniedAceEx: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RtlAddAce: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RtlAddFunctionTable: { args: [FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u8 },
    RtlAddVectoredContinueHandler: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.ptr },
    RtlAddVectoredExceptionHandler: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.ptr },
    RtlAdjustPrivilege: { args: [FFIType.u32, FFIType.u8, FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    RtlAllocateAndInitializeSid: { args: [FFIType.ptr, FFIType.u8, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RtlAllocateHeap: { args: [FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.ptr },
    RtlAnsiStringToUnicodeString: { args: [FFIType.ptr, FFIType.ptr, FFIType.u8], returns: FFIType.i32 },
    RtlAppendUnicodeStringToString: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RtlAppendUnicodeToString: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RtlAreBitsClear: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u8 },
    RtlAreBitsSet: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u8 },
    RtlCaptureContext: { args: [FFIType.ptr], returns: FFIType.void },
    RtlCaptureStackBackTrace: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u16 },
    RtlCharToInteger: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RtlClearAllBits: { args: [FFIType.ptr], returns: FFIType.void },
    RtlClearBit: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.void },
    RtlClearBits: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.void },
    RtlCompareMemory: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.u64 },
    RtlCompareUnicodeString: { args: [FFIType.ptr, FFIType.ptr, FFIType.u8], returns: FFIType.i32 },
    RtlComputeCrc32: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    RtlConvertSidToUnicodeString: { args: [FFIType.ptr, FFIType.ptr, FFIType.u8], returns: FFIType.i32 },
    RtlCopyMemory: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.void },
    RtlCopySid: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RtlCopyUnicodeString: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    RtlCreateAcl: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    RtlCreateEnvironment: { args: [FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    RtlCreateHeap: { args: [FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    RtlCreateProcessParametersEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RtlCreateSecurityDescriptor: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RtlCreateTimer: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    RtlCreateTimerQueue: { args: [FFIType.ptr], returns: FFIType.i32 },
    RtlDeleteAce: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RtlDeleteCriticalSection: { args: [FFIType.ptr], returns: FFIType.i32 },
    RtlDeleteFunctionTable: { args: [FFIType.ptr], returns: FFIType.u8 },
    RtlDeleteTimer: { args: [FFIType.u64, FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    RtlDeleteTimerQueue: { args: [FFIType.u64], returns: FFIType.i32 },
    RtlDeleteTimerQueueEx: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    RtlDeregisterWait: { args: [FFIType.u64], returns: FFIType.i32 },
    RtlDeregisterWaitEx: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    RtlDestroyEnvironment: { args: [FFIType.ptr], returns: FFIType.i32 },
    RtlDestroyHeap: { args: [FFIType.ptr], returns: FFIType.ptr },
    RtlDestroyProcessParameters: { args: [FFIType.ptr], returns: FFIType.i32 },
    RtlDosPathNameToNtPathName_U_WithStatus: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RtlDowncaseUnicodeString: { args: [FFIType.ptr, FFIType.ptr, FFIType.u8], returns: FFIType.i32 },
    RtlDuplicateUnicodeString: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RtlEnterCriticalSection: { args: [FFIType.ptr], returns: FFIType.i32 },
    RtlEqualSid: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u8 },
    RtlEqualUnicodeString: { args: [FFIType.ptr, FFIType.ptr, FFIType.u8], returns: FFIType.u8 },
    RtlExpandEnvironmentStrings_U: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RtlFillMemory: { args: [FFIType.ptr, FFIType.u64, FFIType.u8], returns: FFIType.void },
    RtlFindClearBits: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    RtlFindClearBitsAndSet: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    RtlFindSetBits: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    RtlFindSetBitsAndClear: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    RtlFirstEntrySList: { args: [FFIType.ptr], returns: FFIType.ptr },
    RtlFreeAnsiString: { args: [FFIType.ptr], returns: FFIType.void },
    RtlFreeHeap: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RtlFreeOemString: { args: [FFIType.ptr], returns: FFIType.void },
    RtlFreeSid: { args: [FFIType.ptr], returns: FFIType.ptr },
    RtlFreeUnicodeString: { args: [FFIType.ptr], returns: FFIType.void },
    RtlGetAce: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RtlGetCurrentDirectory_U: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    RtlGetCurrentPeb: { args: [], returns: FFIType.ptr },
    RtlGetFullPathName_U: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RtlGetNtVersionNumbers: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    RtlGetProcessHeaps: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    RtlGetVersion: { args: [FFIType.ptr], returns: FFIType.i32 },
    RtlHashUnicodeString: { args: [FFIType.ptr, FFIType.u8, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RtlInitAnsiString: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    RtlInitString: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    RtlInitUnicodeString: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    RtlInitializeBitMap: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.void },
    RtlInitializeConditionVariable: { args: [FFIType.ptr], returns: FFIType.void },
    RtlInitializeCriticalSection: { args: [FFIType.ptr], returns: FFIType.i32 },
    RtlInitializeCriticalSectionAndSpinCount: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RtlInitializeCriticalSectionEx: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    RtlInitializeSListHead: { args: [FFIType.ptr], returns: FFIType.void },
    RtlInitializeSRWLock: { args: [FFIType.ptr], returns: FFIType.void },
    RtlInstallFunctionTableCallback: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u8 },
    RtlInt64ToUnicodeString: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RtlIntegerToUnicodeString: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RtlInterlockedFlushSList: { args: [FFIType.ptr], returns: FFIType.ptr },
    RtlInterlockedPopEntrySList: { args: [FFIType.ptr], returns: FFIType.ptr },
    RtlInterlockedPushEntrySList: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    RtlLeaveCriticalSection: { args: [FFIType.ptr], returns: FFIType.i32 },
    RtlLengthSecurityDescriptor: { args: [FFIType.ptr], returns: FFIType.u32 },
    RtlLengthSid: { args: [FFIType.ptr], returns: FFIType.u32 },
    RtlLockHeap: { args: [FFIType.ptr], returns: FFIType.u8 },
    RtlLookupFunctionEntry: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    RtlMoveMemory: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.void },
    RtlNtStatusToDosError: { args: [FFIType.i32], returns: FFIType.u32 },
    RtlNumberOfClearBits: { args: [FFIType.ptr], returns: FFIType.u32 },
    RtlNumberOfSetBits: { args: [FFIType.ptr], returns: FFIType.u32 },
    RtlQueryDepthSList: { args: [FFIType.ptr], returns: FFIType.u16 },
    RtlQueryEnvironmentVariable_U: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RtlQueueWorkItem: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RtlRaiseException: { args: [FFIType.ptr], returns: FFIType.void },
    RtlRaiseStatus: { args: [FFIType.i32], returns: FFIType.void },
    RtlRandom: { args: [FFIType.ptr], returns: FFIType.u32 },
    RtlRandomEx: { args: [FFIType.ptr], returns: FFIType.u32 },
    RtlReAllocateHeap: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64], returns: FFIType.ptr },
    RtlRegisterWait: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    RtlReleaseSRWLockExclusive: { args: [FFIType.ptr], returns: FFIType.void },
    RtlReleaseSRWLockShared: { args: [FFIType.ptr], returns: FFIType.void },
    RtlRemoveVectoredContinueHandler: { args: [FFIType.ptr], returns: FFIType.u32 },
    RtlRemoveVectoredExceptionHandler: { args: [FFIType.ptr], returns: FFIType.u32 },
    RtlRestoreContext: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    RtlSetAllBits: { args: [FFIType.ptr], returns: FFIType.void },
    RtlSetBit: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.void },
    RtlSetBits: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.void },
    RtlSetCurrentDirectory_U: { args: [FFIType.ptr], returns: FFIType.i32 },
    RtlSetDaclSecurityDescriptor: { args: [FFIType.ptr, FFIType.u8, FFIType.ptr, FFIType.u8], returns: FFIType.i32 },
    RtlSetEnvironmentVariable: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RtlSetIoCompletionCallback: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RtlSizeHeap: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    RtlSleepConditionVariableCS: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RtlSleepConditionVariableSRW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RtlTestBit: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u8 },
    RtlTryAcquireSRWLockExclusive: { args: [FFIType.ptr], returns: FFIType.u8 },
    RtlTryAcquireSRWLockShared: { args: [FFIType.ptr], returns: FFIType.u8 },
    RtlTryEnterCriticalSection: { args: [FFIType.ptr], returns: FFIType.u8 },
    RtlUnicodeStringToAnsiString: { args: [FFIType.ptr, FFIType.ptr, FFIType.u8], returns: FFIType.i32 },
    RtlUnicodeStringToInteger: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RtlUniform: { args: [FFIType.ptr], returns: FFIType.u32 },
    RtlUnlockHeap: { args: [FFIType.ptr], returns: FFIType.u8 },
    RtlUnwind: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    RtlUnwindEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    RtlUpcaseUnicodeString: { args: [FFIType.ptr, FFIType.ptr, FFIType.u8], returns: FFIType.i32 },
    RtlUpdateTimer: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    RtlValidAcl: { args: [FFIType.ptr], returns: FFIType.u8 },
    RtlValidSecurityDescriptor: { args: [FFIType.ptr], returns: FFIType.u8 },
    RtlValidSid: { args: [FFIType.ptr], returns: FFIType.u8 },
    RtlValidateHeap: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u8 },
    RtlVerifyVersionInfo: { args: [FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    RtlVirtualUnwind: { args: [FFIType.u32, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    RtlWakeAllConditionVariable: { args: [FFIType.ptr], returns: FFIType.void },
    RtlWakeConditionVariable: { args: [FFIType.ptr], returns: FFIType.void },
    RtlZeroMemory: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.void },
    VerSetConditionMask: { args: [FFIType.u64, FFIType.u32, FFIType.u8], returns: FFIType.u64 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/dbgbreakpoint
  public static DbgBreakPoint(): VOID {
    return Ntdll.Load('DbgBreakPoint')();
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwAccessCheckandauditalarm (NtAccessCheck)
  public static NtAccessCheck(
    SecurityDescriptor: PSECURITY_DESCRIPTOR,
    ClientToken: HANDLE,
    DesiredAccess: ACCESS_MASK,
    GenericMapping: PGENERIC_MAPPING,
    PrivilegeSet: PPRIVILEGE_SET,
    PrivilegeSetLength: PULONG,
    GrantedAccess: PACCESS_MASK,
    AccessStatus: PNTSTATUS,
  ): NTSTATUS {
    return Ntdll.Load('NtAccessCheck')(SecurityDescriptor, ClientToken, DesiredAccess, GenericMapping, PrivilegeSet, PrivilegeSetLength, GrantedAccess, AccessStatus);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntadjustgroupstoken
  public static NtAdjustGroupsToken(TokenHandle: HANDLE, ResetToDefault: BOOLEAN, NewState: PTOKEN_GROUPS | NULL, BufferLength: ULONG, PreviousState: PTOKEN_GROUPS | NULL, ReturnLength: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtAdjustGroupsToken')(TokenHandle, ResetToDefault, NewState, BufferLength, PreviousState, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntadjustprivilegestoken
  public static NtAdjustPrivilegesToken(TokenHandle: HANDLE, DisableAllPrivileges: BOOLEAN, NewState: PTOKEN_PRIVILEGES | NULL, BufferLength: ULONG, PreviousState: PTOKEN_PRIVILEGES | NULL, ReturnLength: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtAdjustPrivilegesToken')(TokenHandle, DisableAllPrivileges, NewState, BufferLength, PreviousState, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntalertresumethread
  public static NtAlertResumeThread(ThreadHandle: HANDLE, PreviousSuspendCount: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtAlertResumeThread')(ThreadHandle, PreviousSuspendCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntalertthread
  public static NtAlertThread(ThreadHandle: HANDLE): NTSTATUS {
    return Ntdll.Load('NtAlertThread')(ThreadHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntallocatelocallyuniqueid
  public static NtAllocateLocallyUniqueId(Luid: PLUID): NTSTATUS {
    return Ntdll.Load('NtAllocateLocallyUniqueId')(Luid);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntallocatevirtualmemory
  public static NtAllocateVirtualMemory(ProcessHandle: HANDLE, BaseAddress: PVOID, ZeroBits: ULONG_PTR, RegionSize: PSIZE_T, AllocationType: ULONG, Protect: ULONG): NTSTATUS {
    return Ntdll.Load('NtAllocateVirtualMemory')(ProcessHandle, BaseAddress, ZeroBits, RegionSize, AllocationType, Protect);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwassignprocesstojobobject
  public static NtAssignProcessToJobObject(JobHandle: HANDLE, ProcessHandle: HANDLE): NTSTATUS {
    return Ntdll.Load('NtAssignProcessToJobObject')(JobHandle, ProcessHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntcanceliofile
  public static NtCancelIoFile(FileHandle: HANDLE, IoStatusBlock: PIO_STATUS_BLOCK): NTSTATUS {
    return Ntdll.Load('NtCancelIoFile')(FileHandle, IoStatusBlock);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntcanceliofileex
  public static NtCancelIoFileEx(FileHandle: HANDLE, IoRequestToCancel: PIO_STATUS_BLOCK | NULL, IoStatusBlock: PIO_STATUS_BLOCK): NTSTATUS {
    return Ntdll.Load('NtCancelIoFileEx')(FileHandle, IoRequestToCancel, IoStatusBlock);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntcancelsynchronousiofile
  public static NtCancelSynchronousIoFile(ThreadHandle: HANDLE, IoRequestToCancel: PIO_STATUS_BLOCK | NULL, IoStatusBlock: PIO_STATUS_BLOCK): NTSTATUS {
    return Ntdll.Load('NtCancelSynchronousIoFile')(ThreadHandle, IoRequestToCancel, IoStatusBlock);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwcanceltimer
  public static NtCancelTimer(TimerHandle: HANDLE, CurrentState: PBOOLEAN | NULL): NTSTATUS {
    return Ntdll.Load('NtCancelTimer')(TimerHandle, CurrentState);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntclearevent
  public static NtClearEvent(EventHandle: HANDLE): NTSTATUS {
    return Ntdll.Load('NtClearEvent')(EventHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntclose
  public static NtClose(Handle: HANDLE): NTSTATUS {
    return Ntdll.Load('NtClose')(Handle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntcompactkeys
  public static NtCompactKeys(Count: ULONG, KeyArray: PHANDLE): NTSTATUS {
    return Ntdll.Load('NtCompactKeys')(Count, KeyArray);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntcompareobjects
  public static NtCompareObjects(FirstObjectHandle: HANDLE, SecondObjectHandle: HANDLE): NTSTATUS {
    return Ntdll.Load('NtCompareObjects')(FirstObjectHandle, SecondObjectHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntcompresskey
  public static NtCompressKey(Key: HANDLE): NTSTATUS {
    return Ntdll.Load('NtCompressKey')(Key);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntcreatedebugobject
  public static NtCreateDebugObject(DebugObjectHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES | NULL, Flags: ULONG): NTSTATUS {
    return Ntdll.Load('NtCreateDebugObject')(DebugObjectHandle, DesiredAccess, ObjectAttributes, Flags);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwcreatedirectoryobject
  public static NtCreateDirectoryObject(DirectoryHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES): NTSTATUS {
    return Ntdll.Load('NtCreateDirectoryObject')(DirectoryHandle, DesiredAccess, ObjectAttributes);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-zwcreateevent
  public static NtCreateEvent(EventHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES | NULL, EventType: ULONG, InitialState: BOOLEAN): NTSTATUS {
    return Ntdll.Load('NtCreateEvent')(EventHandle, DesiredAccess, ObjectAttributes, EventType, InitialState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntcreatefile
  public static NtCreateFile(
    FileHandle: PHANDLE,
    DesiredAccess: ACCESS_MASK,
    ObjectAttributes: POBJECT_ATTRIBUTES,
    IoStatusBlock: PIO_STATUS_BLOCK,
    AllocationSize: PLARGE_INTEGER | NULL,
    FileAttributes: ULONG,
    ShareAccess: ULONG,
    CreateDisposition: ULONG,
    CreateOptions: ULONG,
    EaBuffer: PVOID | NULL,
    EaLength: ULONG,
  ): NTSTATUS {
    return Ntdll.Load('NtCreateFile')(FileHandle, DesiredAccess, ObjectAttributes, IoStatusBlock, AllocationSize, FileAttributes, ShareAccess, CreateDisposition, CreateOptions, EaBuffer, EaLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwcreateiocompletion
  public static NtCreateIoCompletion(IoCompletionHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES | NULL, Count: ULONG): NTSTATUS {
    return Ntdll.Load('NtCreateIoCompletion')(IoCompletionHandle, DesiredAccess, ObjectAttributes, Count);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwcreatejobobject
  public static NtCreateJobObject(JobHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES | NULL): NTSTATUS {
    return Ntdll.Load('NtCreateJobObject')(JobHandle, DesiredAccess, ObjectAttributes);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwcreatekey
  public static NtCreateKey(KeyHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES, TitleIndex: ULONG, Class: PUNICODE_STRING | NULL, CreateOptions: ULONG, Disposition: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtCreateKey')(KeyHandle, DesiredAccess, ObjectAttributes, TitleIndex, Class, CreateOptions, Disposition);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntcreatemailslotfile
  public static NtCreateMailslotFile(
    FileHandle: PHANDLE,
    DesiredAccess: ULONG,
    ObjectAttributes: POBJECT_ATTRIBUTES,
    IoStatusBlock: PIO_STATUS_BLOCK,
    CreateOptions: ULONG,
    MailslotQuota: ULONG,
    MaximumMessageSize: ULONG,
    ReadTimeout: PLARGE_INTEGER | NULL,
  ): NTSTATUS {
    return Ntdll.Load('NtCreateMailslotFile')(FileHandle, DesiredAccess, ObjectAttributes, IoStatusBlock, CreateOptions, MailslotQuota, MaximumMessageSize, ReadTimeout);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwcreatemutant
  public static NtCreateMutant(MutantHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES | NULL, InitialOwner: BOOLEAN): NTSTATUS {
    return Ntdll.Load('NtCreateMutant')(MutantHandle, DesiredAccess, ObjectAttributes, InitialOwner);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntcreatenamedpipefile
  public static NtCreateNamedPipeFile(
    FileHandle: PHANDLE,
    DesiredAccess: ULONG,
    ObjectAttributes: POBJECT_ATTRIBUTES,
    IoStatusBlock: PIO_STATUS_BLOCK,
    ShareAccess: ULONG,
    CreateDisposition: ULONG,
    CreateOptions: ULONG,
    NamedPipeType: ULONG,
    ReadMode: ULONG,
    CompletionMode: ULONG,
    MaximumInstances: ULONG,
    InboundQuota: ULONG,
    OutboundQuota: ULONG,
    DefaultTimeout: PLARGE_INTEGER | NULL,
  ): NTSTATUS {
    return Ntdll.Load('NtCreateNamedPipeFile')(
      FileHandle,
      DesiredAccess,
      ObjectAttributes,
      IoStatusBlock,
      ShareAccess,
      CreateDisposition,
      CreateOptions,
      NamedPipeType,
      ReadMode,
      CompletionMode,
      MaximumInstances,
      InboundQuota,
      OutboundQuota,
      DefaultTimeout,
    );
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwcreatesection
  public static NtCreateSection(
    SectionHandle: PHANDLE,
    DesiredAccess: ACCESS_MASK,
    ObjectAttributes: POBJECT_ATTRIBUTES | NULL,
    MaximumSize: PLARGE_INTEGER | NULL,
    SectionPageProtection: ULONG,
    AllocationAttributes: ULONG,
    FileHandle: HANDLE | 0n,
  ): NTSTATUS {
    return Ntdll.Load('NtCreateSection')(SectionHandle, DesiredAccess, ObjectAttributes, MaximumSize, SectionPageProtection, AllocationAttributes, FileHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwcreatesemaphore
  public static NtCreateSemaphore(SemaphoreHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES | NULL, InitialCount: LONG, MaximumCount: LONG): NTSTATUS {
    return Ntdll.Load('NtCreateSemaphore')(SemaphoreHandle, DesiredAccess, ObjectAttributes, InitialCount, MaximumCount);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwcreatesymboliclinkobject
  public static NtCreateSymbolicLinkObject(LinkHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES, LinkTarget: PUNICODE_STRING): NTSTATUS {
    return Ntdll.Load('NtCreateSymbolicLinkObject')(LinkHandle, DesiredAccess, ObjectAttributes, LinkTarget);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntcreatethreadex
  public static NtCreateThreadEx(
    ThreadHandle: PHANDLE,
    DesiredAccess: ACCESS_MASK,
    ObjectAttributes: POBJECT_ATTRIBUTES | NULL,
    ProcessHandle: HANDLE,
    StartRoutine: PVOID,
    Argument: PVOID | NULL,
    CreateFlags: ULONG,
    ZeroBits: SIZE_T,
    StackSize: SIZE_T,
    MaximumStackSize: SIZE_T,
    AttributeList: PPS_ATTRIBUTE_LIST | NULL,
  ): NTSTATUS {
    return Ntdll.Load('NtCreateThreadEx')(ThreadHandle, DesiredAccess, ObjectAttributes, ProcessHandle, StartRoutine, Argument, CreateFlags, ZeroBits, StackSize, MaximumStackSize, AttributeList);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwcreatetimer
  public static NtCreateTimer(TimerHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES | NULL, TimerType: ULONG): NTSTATUS {
    return Ntdll.Load('NtCreateTimer')(TimerHandle, DesiredAccess, ObjectAttributes, TimerType);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntdebugactiveprocess
  public static NtDebugActiveProcess(ProcessHandle: HANDLE, DebugObjectHandle: HANDLE): NTSTATUS {
    return Ntdll.Load('NtDebugActiveProcess')(ProcessHandle, DebugObjectHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntdebugcontinue
  public static NtDebugContinue(DebugObjectHandle: HANDLE, ClientId: PCLIENT_ID, ContinueStatus: NTSTATUS): NTSTATUS {
    return Ntdll.Load('NtDebugContinue')(DebugObjectHandle, ClientId, ContinueStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntdelayexecution
  public static NtDelayExecution(Alertable: BOOLEAN, DelayInterval: PLARGE_INTEGER): NTSTATUS {
    return Ntdll.Load('NtDelayExecution')(Alertable, DelayInterval);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntdeletefile
  public static NtDeleteFile(ObjectAttributes: POBJECT_ATTRIBUTES): NTSTATUS {
    return Ntdll.Load('NtDeleteFile')(ObjectAttributes);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwdeletekey
  public static NtDeleteKey(KeyHandle: HANDLE): NTSTATUS {
    return Ntdll.Load('NtDeleteKey')(KeyHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwdeletevaluekey
  public static NtDeleteValueKey(KeyHandle: HANDLE, ValueName: PUNICODE_STRING): NTSTATUS {
    return Ntdll.Load('NtDeleteValueKey')(KeyHandle, ValueName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntdeviceiocontrolfile
  public static NtDeviceIoControlFile(
    FileHandle: HANDLE,
    Event: HANDLE | 0n,
    ApcRoutine: PIO_APC_ROUTINE | NULL,
    ApcContext: PVOID | NULL,
    IoStatusBlock: PIO_STATUS_BLOCK,
    IoControlCode: ULONG,
    InputBuffer: PVOID | NULL,
    InputBufferLength: ULONG,
    OutputBuffer: PVOID | NULL,
    OutputBufferLength: ULONG,
  ): NTSTATUS {
    return Ntdll.Load('NtDeviceIoControlFile')(FileHandle, Event, ApcRoutine, ApcContext, IoStatusBlock, IoControlCode, InputBuffer, InputBufferLength, OutputBuffer, OutputBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntduplicateobject
  public static NtDuplicateObject(SourceProcessHandle: HANDLE, SourceHandle: HANDLE, TargetProcessHandle: HANDLE | 0n, TargetHandle: PHANDLE | NULL, DesiredAccess: ACCESS_MASK, HandleAttributes: ULONG, Options: ULONG): NTSTATUS {
    return Ntdll.Load('NtDuplicateObject')(SourceProcessHandle, SourceHandle, TargetProcessHandle, TargetHandle, DesiredAccess, HandleAttributes, Options);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntduplicatetoken
  public static NtDuplicateToken(ExistingTokenHandle: HANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES | NULL, EffectiveOnly: BOOLEAN, TokenType: ULONG, NewTokenHandle: PHANDLE): NTSTATUS {
    return Ntdll.Load('NtDuplicateToken')(ExistingTokenHandle, DesiredAccess, ObjectAttributes, EffectiveOnly, TokenType, NewTokenHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwenumeratekey
  public static NtEnumerateKey(KeyHandle: HANDLE, Index: ULONG, KeyInformationClass: ULONG, KeyInformation: PVOID, Length: ULONG, ResultLength: PULONG): NTSTATUS {
    return Ntdll.Load('NtEnumerateKey')(KeyHandle, Index, KeyInformationClass, KeyInformation, Length, ResultLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwenumeratevaluekey
  public static NtEnumerateValueKey(KeyHandle: HANDLE, Index: ULONG, KeyValueInformationClass: ULONG, KeyValueInformation: PVOID, Length: ULONG, ResultLength: PULONG): NTSTATUS {
    return Ntdll.Load('NtEnumerateValueKey')(KeyHandle, Index, KeyValueInformationClass, KeyValueInformation, Length, ResultLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntextendsection
  public static NtExtendSection(SectionHandle: HANDLE, NewSectionSize: PLARGE_INTEGER): NTSTATUS {
    return Ntdll.Load('NtExtendSection')(SectionHandle, NewSectionSize);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntfiltertoken
  public static NtFilterToken(ExistingTokenHandle: HANDLE, Flags: ULONG, SidsToDisable: PTOKEN_GROUPS | NULL, PrivilegesToDelete: PTOKEN_PRIVILEGES | NULL, RestrictedSids: PTOKEN_GROUPS | NULL, NewTokenHandle: PHANDLE): NTSTATUS {
    return Ntdll.Load('NtFilterToken')(ExistingTokenHandle, Flags, SidsToDisable, PrivilegesToDelete, RestrictedSids, NewTokenHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntflushbuffersfile
  public static NtFlushBuffersFile(FileHandle: HANDLE, IoStatusBlock: PIO_STATUS_BLOCK): NTSTATUS {
    return Ntdll.Load('NtFlushBuffersFile')(FileHandle, IoStatusBlock);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntflushbuffersfileex
  public static NtFlushBuffersFileEx(FileHandle: HANDLE, Flags: ULONG, Parameters: PVOID, ParametersSize: ULONG, IoStatusBlock: PIO_STATUS_BLOCK): NTSTATUS {
    return Ntdll.Load('NtFlushBuffersFileEx')(FileHandle, Flags, Parameters, ParametersSize, IoStatusBlock);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntflushinstructioncache
  public static NtFlushInstructionCache(ProcessHandle: HANDLE, BaseAddress: PVOID | NULL, Length: SIZE_T): NTSTATUS {
    return Ntdll.Load('NtFlushInstructionCache')(ProcessHandle, BaseAddress, Length);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwflushkey
  public static NtFlushKey(KeyHandle: HANDLE): NTSTATUS {
    return Ntdll.Load('NtFlushKey')(KeyHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntflushvirtualmemory
  public static NtFlushVirtualMemory(ProcessHandle: HANDLE, BaseAddress: PVOID, RegionSize: PSIZE_T, IoStatus: PIO_STATUS_BLOCK): NTSTATUS {
    return Ntdll.Load('NtFlushVirtualMemory')(ProcessHandle, BaseAddress, RegionSize, IoStatus);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntfreevirtualmemory
  public static NtFreeVirtualMemory(ProcessHandle: HANDLE, BaseAddress: PVOID, RegionSize: PSIZE_T, FreeType: ULONG): NTSTATUS {
    return Ntdll.Load('NtFreeVirtualMemory')(ProcessHandle, BaseAddress, RegionSize, FreeType);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntfscontrolfile
  public static NtFsControlFile(
    FileHandle: HANDLE,
    Event: HANDLE | 0n,
    ApcRoutine: PIO_APC_ROUTINE | NULL,
    ApcContext: PVOID | NULL,
    IoStatusBlock: PIO_STATUS_BLOCK,
    FsControlCode: ULONG,
    InputBuffer: PVOID | NULL,
    InputBufferLength: ULONG,
    OutputBuffer: PVOID | NULL,
    OutputBufferLength: ULONG,
  ): NTSTATUS {
    return Ntdll.Load('NtFsControlFile')(FileHandle, Event, ApcRoutine, ApcContext, IoStatusBlock, FsControlCode, InputBuffer, InputBufferLength, OutputBuffer, OutputBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntgetcontextthread
  public static NtGetContextThread(ThreadHandle: HANDLE, ThreadContext: PCONTEXT): NTSTATUS {
    return Ntdll.Load('NtGetContextThread')(ThreadHandle, ThreadContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntgetcurrentprocessornumber
  public static NtGetCurrentProcessorNumber(): ULONG {
    return Ntdll.Load('NtGetCurrentProcessorNumber')();
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntgetnextprocess
  public static NtGetNextProcess(ProcessHandle: HANDLE, DesiredAccess: ACCESS_MASK, HandleAttributes: ULONG, Flags: ULONG, NewProcessHandle: PHANDLE): NTSTATUS {
    return Ntdll.Load('NtGetNextProcess')(ProcessHandle, DesiredAccess, HandleAttributes, Flags, NewProcessHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntgetnextthread
  public static NtGetNextThread(ProcessHandle: HANDLE, ThreadHandle: HANDLE, DesiredAccess: ACCESS_MASK, HandleAttributes: ULONG, Flags: ULONG, NewThreadHandle: PHANDLE): NTSTATUS {
    return Ntdll.Load('NtGetNextThread')(ProcessHandle, ThreadHandle, DesiredAccess, HandleAttributes, Flags, NewThreadHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntimpersonateanonymoustoken
  public static NtImpersonateAnonymousToken(ThreadHandle: HANDLE): NTSTATUS {
    return Ntdll.Load('NtImpersonateAnonymousToken')(ThreadHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntimpersonatethread
  public static NtImpersonateThread(ServerThreadHandle: HANDLE, ClientThreadHandle: HANDLE, SecurityQos: PSECURITY_QUALITY_OF_SERVICE): NTSTATUS {
    return Ntdll.Load('NtImpersonateThread')(ServerThreadHandle, ClientThreadHandle, SecurityQos);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwisprocessinjob
  public static NtIsProcessInJob(ProcessHandle: HANDLE, JobHandle: HANDLE | 0n): NTSTATUS {
    return Ntdll.Load('NtIsProcessInJob')(ProcessHandle, JobHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwloadkey
  public static NtLoadKey(TargetKey: POBJECT_ATTRIBUTES, SourceFile: POBJECT_ATTRIBUTES): NTSTATUS {
    return Ntdll.Load('NtLoadKey')(TargetKey, SourceFile);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntlockfile
  public static NtLockFile(
    FileHandle: HANDLE,
    Event: HANDLE | 0n,
    ApcRoutine: PIO_APC_ROUTINE | NULL,
    ApcContext: PVOID | NULL,
    IoStatusBlock: PIO_STATUS_BLOCK,
    ByteOffset: PLARGE_INTEGER,
    Length: PLARGE_INTEGER,
    Key: ULONG,
    FailImmediately: BOOLEAN,
    ExclusiveLock: BOOLEAN,
  ): NTSTATUS {
    return Ntdll.Load('NtLockFile')(FileHandle, Event, ApcRoutine, ApcContext, IoStatusBlock, ByteOffset, Length, Key, FailImmediately, ExclusiveLock);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntlockvirtualmemory
  public static NtLockVirtualMemory(ProcessHandle: HANDLE, BaseAddress: PVOID, RegionSize: PSIZE_T, MapType: ULONG): NTSTATUS {
    return Ntdll.Load('NtLockVirtualMemory')(ProcessHandle, BaseAddress, RegionSize, MapType);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwmakepermanentobject
  public static NtMakePermanentObject(Handle: HANDLE): NTSTATUS {
    return Ntdll.Load('NtMakePermanentObject')(Handle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwmaketemporaryobject
  public static NtMakeTemporaryObject(Handle: HANDLE): NTSTATUS {
    return Ntdll.Load('NtMakeTemporaryObject')(Handle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwmapviewofsection
  public static NtMapViewOfSection(
    SectionHandle: HANDLE,
    ProcessHandle: HANDLE,
    BaseAddress: PVOID,
    ZeroBits: ULONG_PTR,
    CommitSize: SIZE_T,
    SectionOffset: PLARGE_INTEGER | NULL,
    ViewSize: PSIZE_T,
    InheritDisposition: ULONG,
    AllocationType: ULONG,
    Win32Protect: ULONG,
  ): NTSTATUS {
    return Ntdll.Load('NtMapViewOfSection')(SectionHandle, ProcessHandle, BaseAddress, ZeroBits, CommitSize, SectionOffset, ViewSize, InheritDisposition, AllocationType, Win32Protect);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntnotifychangedirectoryfile
  public static NtNotifyChangeDirectoryFile(
    FileHandle: HANDLE,
    Event: HANDLE | 0n,
    ApcRoutine: PIO_APC_ROUTINE | NULL,
    ApcContext: PVOID | NULL,
    IoStatusBlock: PIO_STATUS_BLOCK,
    Buffer: PVOID,
    Length: ULONG,
    CompletionFilter: ULONG,
    WatchTree: BOOLEAN,
  ): NTSTATUS {
    return Ntdll.Load('NtNotifyChangeDirectoryFile')(FileHandle, Event, ApcRoutine, ApcContext, IoStatusBlock, Buffer, Length, CompletionFilter, WatchTree);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntnotifychangekey
  public static NtNotifyChangeKey(
    KeyHandle: HANDLE,
    Event: HANDLE | 0n,
    ApcRoutine: PIO_APC_ROUTINE | NULL,
    ApcContext: PVOID | NULL,
    IoStatusBlock: PIO_STATUS_BLOCK,
    CompletionFilter: ULONG,
    WatchTree: BOOLEAN,
    Buffer: PVOID | NULL,
    BufferSize: ULONG,
    Asynchronous: BOOLEAN,
  ): NTSTATUS {
    return Ntdll.Load('NtNotifyChangeKey')(KeyHandle, Event, ApcRoutine, ApcContext, IoStatusBlock, CompletionFilter, WatchTree, Buffer, BufferSize, Asynchronous);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntnotifychangemultiplekeys
  public static NtNotifyChangeMultipleKeys(
    MasterKeyHandle: HANDLE,
    Count: ULONG,
    SubordinateObjects: POBJECT_ATTRIBUTES | NULL,
    Event: HANDLE | 0n,
    ApcRoutine: PIO_APC_ROUTINE | NULL,
    ApcContext: PVOID | NULL,
    IoStatusBlock: PIO_STATUS_BLOCK,
    CompletionFilter: ULONG,
    WatchTree: BOOLEAN,
    Buffer: PVOID | NULL,
    BufferSize: ULONG,
    Asynchronous: BOOLEAN,
  ): NTSTATUS {
    return Ntdll.Load('NtNotifyChangeMultipleKeys')(MasterKeyHandle, Count, SubordinateObjects, Event, ApcRoutine, ApcContext, IoStatusBlock, CompletionFilter, WatchTree, Buffer, BufferSize, Asynchronous);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwopenDirectoryobject
  public static NtOpenDirectoryObject(DirectoryHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES): NTSTATUS {
    return Ntdll.Load('NtOpenDirectoryObject')(DirectoryHandle, DesiredAccess, ObjectAttributes);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwopenevent
  public static NtOpenEvent(EventHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES): NTSTATUS {
    return Ntdll.Load('NtOpenEvent')(EventHandle, DesiredAccess, ObjectAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntopenfile
  public static NtOpenFile(FileHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES, IoStatusBlock: PIO_STATUS_BLOCK, ShareAccess: ULONG, OpenOptions: ULONG): NTSTATUS {
    return Ntdll.Load('NtOpenFile')(FileHandle, DesiredAccess, ObjectAttributes, IoStatusBlock, ShareAccess, OpenOptions);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwopeniocompletion
  public static NtOpenIoCompletion(IoCompletionHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES): NTSTATUS {
    return Ntdll.Load('NtOpenIoCompletion')(IoCompletionHandle, DesiredAccess, ObjectAttributes);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwopenjobobject
  public static NtOpenJobObject(JobHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES): NTSTATUS {
    return Ntdll.Load('NtOpenJobObject')(JobHandle, DesiredAccess, ObjectAttributes);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwopenkey
  public static NtOpenKey(KeyHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES): NTSTATUS {
    return Ntdll.Load('NtOpenKey')(KeyHandle, DesiredAccess, ObjectAttributes);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwopenkeyex
  public static NtOpenKeyEx(KeyHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES, OpenOptions: ULONG): NTSTATUS {
    return Ntdll.Load('NtOpenKeyEx')(KeyHandle, DesiredAccess, ObjectAttributes, OpenOptions);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwopenmutant
  public static NtOpenMutant(MutantHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES): NTSTATUS {
    return Ntdll.Load('NtOpenMutant')(MutantHandle, DesiredAccess, ObjectAttributes);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntopenprocess
  public static NtOpenProcess(ProcessHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES, ClientId: PCLIENT_ID | NULL): NTSTATUS {
    return Ntdll.Load('NtOpenProcess')(ProcessHandle, DesiredAccess, ObjectAttributes, ClientId);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntopenprocesstoken
  public static NtOpenProcessToken(ProcessHandle: HANDLE, DesiredAccess: ACCESS_MASK, TokenHandle: PHANDLE): NTSTATUS {
    return Ntdll.Load('NtOpenProcessToken')(ProcessHandle, DesiredAccess, TokenHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntopenprocesstokenex
  public static NtOpenProcessTokenEx(ProcessHandle: HANDLE, DesiredAccess: ACCESS_MASK, HandleAttributes: ULONG, TokenHandle: PHANDLE): NTSTATUS {
    return Ntdll.Load('NtOpenProcessTokenEx')(ProcessHandle, DesiredAccess, HandleAttributes, TokenHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwopensection
  public static NtOpenSection(SectionHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES): NTSTATUS {
    return Ntdll.Load('NtOpenSection')(SectionHandle, DesiredAccess, ObjectAttributes);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwopensemaphore
  public static NtOpenSemaphore(SemaphoreHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES): NTSTATUS {
    return Ntdll.Load('NtOpenSemaphore')(SemaphoreHandle, DesiredAccess, ObjectAttributes);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwopensymboliclinkobject
  public static NtOpenSymbolicLinkObject(LinkHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES): NTSTATUS {
    return Ntdll.Load('NtOpenSymbolicLinkObject')(LinkHandle, DesiredAccess, ObjectAttributes);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntopenthread
  public static NtOpenThread(ThreadHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES, ClientId: PCLIENT_ID): NTSTATUS {
    return Ntdll.Load('NtOpenThread')(ThreadHandle, DesiredAccess, ObjectAttributes, ClientId);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntopenthreadtoken
  public static NtOpenThreadToken(ThreadHandle: HANDLE, DesiredAccess: ACCESS_MASK, OpenAsSelf: BOOLEAN, TokenHandle: PHANDLE): NTSTATUS {
    return Ntdll.Load('NtOpenThreadToken')(ThreadHandle, DesiredAccess, OpenAsSelf, TokenHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntopenthreadtokenex
  public static NtOpenThreadTokenEx(ThreadHandle: HANDLE, DesiredAccess: ACCESS_MASK, OpenAsSelf: BOOLEAN, HandleAttributes: ULONG, TokenHandle: PHANDLE): NTSTATUS {
    return Ntdll.Load('NtOpenThreadTokenEx')(ThreadHandle, DesiredAccess, OpenAsSelf, HandleAttributes, TokenHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwopentimer
  public static NtOpenTimer(TimerHandle: PHANDLE, DesiredAccess: ACCESS_MASK, ObjectAttributes: POBJECT_ATTRIBUTES): NTSTATUS {
    return Ntdll.Load('NtOpenTimer')(TimerHandle, DesiredAccess, ObjectAttributes);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwpowerinformation
  public static NtPowerInformation(InformationLevel: ULONG, InputBuffer: PVOID | NULL, InputBufferLength: ULONG, OutputBuffer: PVOID | NULL, OutputBufferLength: ULONG): NTSTATUS {
    return Ntdll.Load('NtPowerInformation')(InformationLevel, InputBuffer, InputBufferLength, OutputBuffer, OutputBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntprivilegecheck
  public static NtPrivilegeCheck(ClientToken: HANDLE, RequiredPrivileges: PPRIVILEGE_SET, Result: PBOOLEAN): NTSTATUS {
    return Ntdll.Load('NtPrivilegeCheck')(ClientToken, RequiredPrivileges, Result);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntprotectvirtualmemory
  public static NtProtectVirtualMemory(ProcessHandle: HANDLE, BaseAddress: PVOID, RegionSize: PSIZE_T, NewProtect: ULONG, OldProtect: PULONG): NTSTATUS {
    return Ntdll.Load('NtProtectVirtualMemory')(ProcessHandle, BaseAddress, RegionSize, NewProtect, OldProtect);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntpulseevent
  public static NtPulseEvent(EventHandle: HANDLE, PreviousState: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtPulseEvent')(EventHandle, PreviousState);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwqueryattributesfile
  public static NtQueryAttributesFile(ObjectAttributes: POBJECT_ATTRIBUTES, FileInformation: PFILE_BASIC_INFORMATION): NTSTATUS {
    return Ntdll.Load('NtQueryAttributesFile')(ObjectAttributes, FileInformation);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntquerydefaultlocale
  public static NtQueryDefaultLocale(UserProfile: BOOLEAN, DefaultLocaleId: PLCID): NTSTATUS {
    return Ntdll.Load('NtQueryDefaultLocale')(UserProfile, DefaultLocaleId);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntquerydefaultuilanguage
  public static NtQueryDefaultUILanguage(DefaultUILanguageId: PVOID): NTSTATUS {
    return Ntdll.Load('NtQueryDefaultUILanguage')(DefaultUILanguageId);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntquerydirectoryfile
  public static NtQueryDirectoryFile(
    FileHandle: HANDLE,
    Event: HANDLE | 0n,
    ApcRoutine: PIO_APC_ROUTINE | NULL,
    ApcContext: PVOID | NULL,
    IoStatusBlock: PIO_STATUS_BLOCK,
    FileInformation: PVOID,
    Length: ULONG,
    FileInformationClass: ULONG,
    ReturnSingleEntry: BOOLEAN,
    FileName: PUNICODE_STRING | NULL,
    RestartScan: BOOLEAN,
  ): NTSTATUS {
    return Ntdll.Load('NtQueryDirectoryFile')(FileHandle, Event, ApcRoutine, ApcContext, IoStatusBlock, FileInformation, Length, FileInformationClass, ReturnSingleEntry, FileName, RestartScan);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntquerydirectoryobject
  public static NtQueryDirectoryObject(DirectoryHandle: HANDLE, Buffer: PVOID, Length: ULONG, ReturnSingleEntry: BOOLEAN, RestartScan: BOOLEAN, Context: PULONG, ReturnLength: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtQueryDirectoryObject')(DirectoryHandle, Buffer, Length, ReturnSingleEntry, RestartScan, Context, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntqueryeafile
  public static NtQueryEaFile(
    FileHandle: HANDLE,
    IoStatusBlock: PIO_STATUS_BLOCK,
    Buffer: PVOID,
    Length: ULONG,
    ReturnSingleEntry: BOOLEAN,
    EaList: PVOID | NULL,
    EaListLength: ULONG,
    EaIndex: PULONG | NULL,
    RestartScan: BOOLEAN,
  ): NTSTATUS {
    return Ntdll.Load('NtQueryEaFile')(FileHandle, IoStatusBlock, Buffer, Length, ReturnSingleEntry, EaList, EaListLength, EaIndex, RestartScan);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntqueryevent
  public static NtQueryEvent(EventHandle: HANDLE, EventInformationClass: ULONG, EventInformation: PVOID, EventInformationLength: ULONG, ReturnLength: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtQueryEvent')(EventHandle, EventInformationClass, EventInformation, EventInformationLength, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwqueryfullattributesfile
  public static NtQueryFullAttributesFile(ObjectAttributes: POBJECT_ATTRIBUTES, FileInformation: PFILE_NETWORK_OPEN_INFORMATION): NTSTATUS {
    return Ntdll.Load('NtQueryFullAttributesFile')(ObjectAttributes, FileInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntqueryinformationfile
  public static NtQueryInformationFile(FileHandle: HANDLE, IoStatusBlock: PIO_STATUS_BLOCK, FileInformation: PVOID, Length: ULONG, FileInformationClass: ULONG): NTSTATUS {
    return Ntdll.Load('NtQueryInformationFile')(FileHandle, IoStatusBlock, FileInformation, Length, FileInformationClass);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwqueryinformationjobobject
  public static NtQueryInformationJobObject(JobHandle: HANDLE, JobObjectInformationClass: ULONG, JobObjectInformation: PVOID, JobObjectInformationLength: ULONG, ReturnLength: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtQueryInformationJobObject')(JobHandle, JobObjectInformationClass, JobObjectInformation, JobObjectInformationLength, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntqueryinformationprocess
  public static NtQueryInformationProcess(ProcessHandle: HANDLE, ProcessInformationClass: ULONG, ProcessInformation: PVOID, ProcessInformationLength: ULONG, ReturnLength: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtQueryInformationProcess')(ProcessHandle, ProcessInformationClass, ProcessInformation, ProcessInformationLength, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntqueryinformationthread
  public static NtQueryInformationThread(ThreadHandle: HANDLE, ThreadInformationClass: ULONG, ThreadInformation: PVOID, ThreadInformationLength: ULONG, ReturnLength: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtQueryInformationThread')(ThreadHandle, ThreadInformationClass, ThreadInformation, ThreadInformationLength, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntqueryinformationtoken
  public static NtQueryInformationToken(TokenHandle: HANDLE, TokenInformationClass: ULONG, TokenInformation: PVOID, TokenInformationLength: ULONG, ReturnLength: PULONG): NTSTATUS {
    return Ntdll.Load('NtQueryInformationToken')(TokenHandle, TokenInformationClass, TokenInformation, TokenInformationLength, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntqueryinstalluilanguage
  public static NtQueryInstallUILanguage(InstallUILanguageId: PVOID): NTSTATUS {
    return Ntdll.Load('NtQueryInstallUILanguage')(InstallUILanguageId);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwqueryiocompletion
  public static NtQueryIoCompletion(IoCompletionHandle: HANDLE, IoCompletionInformationClass: ULONG, IoCompletionInformation: PVOID, IoCompletionInformationLength: ULONG, ReturnLength: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtQueryIoCompletion')(IoCompletionHandle, IoCompletionInformationClass, IoCompletionInformation, IoCompletionInformationLength, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwquerykey
  public static NtQueryKey(KeyHandle: HANDLE, KeyInformationClass: ULONG, KeyInformation: PVOID, Length: ULONG, ResultLength: PULONG): NTSTATUS {
    return Ntdll.Load('NtQueryKey')(KeyHandle, KeyInformationClass, KeyInformation, Length, ResultLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwquerymultiplevaluekey
  public static NtQueryMultipleValueKey(KeyHandle: HANDLE, ValueEntries: PKEY_VALUE_ENTRY, EntryCount: ULONG, ValueBuffer: PVOID, BufferLength: PULONG, RequiredBufferLength: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtQueryMultipleValueKey')(KeyHandle, ValueEntries, EntryCount, ValueBuffer, BufferLength, RequiredBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntquerymutant
  public static NtQueryMutant(MutantHandle: HANDLE, MutantInformationClass: ULONG, MutantInformation: PVOID, MutantInformationLength: ULONG, ReturnLength: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtQueryMutant')(MutantHandle, MutantInformationClass, MutantInformation, MutantInformationLength, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntqueryobject
  public static NtQueryObject(Handle: HANDLE | 0n, ObjectInformationClass: ULONG, ObjectInformation: PVOID | NULL, ObjectInformationLength: ULONG, ReturnLength: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtQueryObject')(Handle, ObjectInformationClass, ObjectInformation, ObjectInformationLength, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntqueryperformancecounter
  public static NtQueryPerformanceCounter(PerformanceCounter: PLARGE_INTEGER, PerformanceFrequency: PLARGE_INTEGER | NULL): NTSTATUS {
    return Ntdll.Load('NtQueryPerformanceCounter')(PerformanceCounter, PerformanceFrequency);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntquerysection
  public static NtQuerySection(SectionHandle: HANDLE, SectionInformationClass: ULONG, SectionInformation: PVOID, SectionInformationLength: SIZE_T, ReturnLength: PSIZE_T | NULL): NTSTATUS {
    return Ntdll.Load('NtQuerySection')(SectionHandle, SectionInformationClass, SectionInformation, SectionInformationLength, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntquerysecurityobject
  public static NtQuerySecurityObject(Handle: HANDLE, SecurityInformation: ULONG, SecurityDescriptor: PSECURITY_DESCRIPTOR, Length: ULONG, LengthNeeded: PULONG): NTSTATUS {
    return Ntdll.Load('NtQuerySecurityObject')(Handle, SecurityInformation, SecurityDescriptor, Length, LengthNeeded);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntquerysemaphore
  public static NtQuerySemaphore(SemaphoreHandle: HANDLE, SemaphoreInformationClass: ULONG, SemaphoreInformation: PVOID, SemaphoreInformationLength: ULONG, ReturnLength: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtQuerySemaphore')(SemaphoreHandle, SemaphoreInformationClass, SemaphoreInformation, SemaphoreInformationLength, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwquerysymboliclinkobject
  public static NtQuerySymbolicLinkObject(LinkHandle: HANDLE, LinkTarget: PUNICODE_STRING, ReturnedLength: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtQuerySymbolicLinkObject')(LinkHandle, LinkTarget, ReturnedLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntquerysysteminformation
  public static NtQuerySystemInformation(SystemInformationClass: ULONG, SystemInformation: PVOID, SystemInformationLength: ULONG, ReturnLength: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtQuerySystemInformation')(SystemInformationClass, SystemInformation, SystemInformationLength, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntquerysysteminformationex
  public static NtQuerySystemInformationEx(SystemInformationClass: ULONG, InputBuffer: PVOID, InputBufferLength: ULONG, SystemInformation: PVOID, SystemInformationLength: ULONG, ReturnLength: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtQuerySystemInformationEx')(SystemInformationClass, InputBuffer, InputBufferLength, SystemInformation, SystemInformationLength, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntquerysystemtime
  public static NtQuerySystemTime(SystemTime: PLARGE_INTEGER): NTSTATUS {
    return Ntdll.Load('NtQuerySystemTime')(SystemTime);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwquerytimer
  public static NtQueryTimer(TimerHandle: HANDLE, TimerInformationClass: ULONG, TimerInformation: PVOID, TimerInformationLength: ULONG, ReturnLength: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtQueryTimer')(TimerHandle, TimerInformationClass, TimerInformation, TimerInformationLength, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntquerytimerresolution
  public static NtQueryTimerResolution(MaximumTime: PULONG, MinimumTime: PULONG, CurrentTime: PULONG): NTSTATUS {
    return Ntdll.Load('NtQueryTimerResolution')(MaximumTime, MinimumTime, CurrentTime);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwqueryvaluekey
  public static NtQueryValueKey(KeyHandle: HANDLE, ValueName: PUNICODE_STRING, KeyValueInformationClass: ULONG, KeyValueInformation: PVOID, Length: ULONG, ResultLength: PULONG): NTSTATUS {
    return Ntdll.Load('NtQueryValueKey')(KeyHandle, ValueName, KeyValueInformationClass, KeyValueInformation, Length, ResultLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntqueryvirtualmemory
  public static NtQueryVirtualMemory(ProcessHandle: HANDLE, BaseAddress: PVOID, MemoryInformationClass: ULONG, MemoryInformation: PVOID, MemoryInformationLength: SIZE_T, ReturnLength: PSIZE_T | NULL): NTSTATUS {
    return Ntdll.Load('NtQueryVirtualMemory')(ProcessHandle, BaseAddress, MemoryInformationClass, MemoryInformation, MemoryInformationLength, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntqueryvolumeinformationfile
  public static NtQueryVolumeInformationFile(FileHandle: HANDLE, IoStatusBlock: PIO_STATUS_BLOCK, FsInformation: PVOID, Length: ULONG, FsInformationClass: ULONG): NTSTATUS {
    return Ntdll.Load('NtQueryVolumeInformationFile')(FileHandle, IoStatusBlock, FsInformation, Length, FsInformationClass);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntqueueapcthread
  public static NtQueueApcThread(ThreadHandle: HANDLE, ApcRoutine: PPS_APC_ROUTINE, ApcArgument1: PVOID | NULL, ApcArgument2: PVOID | NULL, ApcArgument3: PVOID | NULL): NTSTATUS {
    return Ntdll.Load('NtQueueApcThread')(ThreadHandle, ApcRoutine, ApcArgument1, ApcArgument2, ApcArgument3);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntqueueapcthreadex
  public static NtQueueApcThreadEx(ThreadHandle: HANDLE, ReserveHandle: HANDLE | 0n, ApcRoutine: PPS_APC_ROUTINE, ApcArgument1: PVOID | NULL, ApcArgument2: PVOID | NULL, ApcArgument3: PVOID | NULL): NTSTATUS {
    return Ntdll.Load('NtQueueApcThreadEx')(ThreadHandle, ReserveHandle, ApcRoutine, ApcArgument1, ApcArgument2, ApcArgument3);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntraiseharderror
  public static NtRaiseHardError(ErrorStatus: NTSTATUS, NumberOfParameters: ULONG, UnicodeStringParameterMask: ULONG, Parameters: PULONG_PTR, ValidResponseOptions: ULONG, Response: PULONG): NTSTATUS {
    return Ntdll.Load('NtRaiseHardError')(ErrorStatus, NumberOfParameters, UnicodeStringParameterMask, Parameters, ValidResponseOptions, Response);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntreadfile
  public static NtReadFile(
    FileHandle: HANDLE,
    Event: HANDLE | 0n,
    ApcRoutine: PIO_APC_ROUTINE | NULL,
    ApcContext: PVOID | NULL,
    IoStatusBlock: PIO_STATUS_BLOCK,
    Buffer: PVOID,
    Length: ULONG,
    ByteOffset: PLARGE_INTEGER | NULL,
    Key: PULONG | NULL,
  ): NTSTATUS {
    return Ntdll.Load('NtReadFile')(FileHandle, Event, ApcRoutine, ApcContext, IoStatusBlock, Buffer, Length, ByteOffset, Key);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntreadfilescatter
  public static NtReadFileScatter(
    FileHandle: HANDLE,
    Event: HANDLE | 0n,
    ApcRoutine: PIO_APC_ROUTINE | NULL,
    ApcContext: PVOID | NULL,
    IoStatusBlock: PIO_STATUS_BLOCK,
    SegmentArray: PFILE_SEGMENT_ELEMENT,
    Length: ULONG,
    ByteOffset: PLARGE_INTEGER | NULL,
    Key: PULONG | NULL,
  ): NTSTATUS {
    return Ntdll.Load('NtReadFileScatter')(FileHandle, Event, ApcRoutine, ApcContext, IoStatusBlock, SegmentArray, Length, ByteOffset, Key);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntreadvirtualmemory
  public static NtReadVirtualMemory(ProcessHandle: HANDLE, BaseAddress: ULONG_PTR, Buffer: PVOID, BufferSize: SIZE_T, NumberOfBytesRead: PSIZE_T | NULL): NTSTATUS {
    return Ntdll.Load('NtReadVirtualMemory')(ProcessHandle, BaseAddress, Buffer, BufferSize, NumberOfBytesRead);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwreleasemutant
  public static NtReleaseMutant(MutantHandle: HANDLE, PreviousCount: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtReleaseMutant')(MutantHandle, PreviousCount);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwreleasesemaphore
  public static NtReleaseSemaphore(SemaphoreHandle: HANDLE, ReleaseCount: LONG, PreviousCount: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtReleaseSemaphore')(SemaphoreHandle, ReleaseCount, PreviousCount);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwremoveiocompletion
  public static NtRemoveIoCompletion(IoCompletionHandle: HANDLE, KeyContext: PVOID, ApcContext: PVOID, IoStatusBlock: PIO_STATUS_BLOCK, Timeout: PLARGE_INTEGER | NULL): NTSTATUS {
    return Ntdll.Load('NtRemoveIoCompletion')(IoCompletionHandle, KeyContext, ApcContext, IoStatusBlock, Timeout);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwremoveiocompletionex
  public static NtRemoveIoCompletionEx(IoCompletionHandle: HANDLE, IoCompletionInformation: PFILE_IO_COMPLETION_INFORMATION, Count: ULONG, NumEntriesRemoved: PULONG, Timeout: PLARGE_INTEGER | NULL, Alertable: BOOLEAN): NTSTATUS {
    return Ntdll.Load('NtRemoveIoCompletionEx')(IoCompletionHandle, IoCompletionInformation, Count, NumEntriesRemoved, Timeout, Alertable);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntremoveprocessdebug
  public static NtRemoveProcessDebug(ProcessHandle: HANDLE, DebugObjectHandle: HANDLE): NTSTATUS {
    return Ntdll.Load('NtRemoveProcessDebug')(ProcessHandle, DebugObjectHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntrenamekey
  public static NtRenameKey(KeyHandle: HANDLE, NewName: PUNICODE_STRING): NTSTATUS {
    return Ntdll.Load('NtRenameKey')(KeyHandle, NewName);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntresetevent
  public static NtResetEvent(EventHandle: HANDLE, PreviousState: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtResetEvent')(EventHandle, PreviousState);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntrestorekey
  public static NtRestoreKey(KeyHandle: HANDLE, FileHandle: HANDLE, Flags: ULONG): NTSTATUS {
    return Ntdll.Load('NtRestoreKey')(KeyHandle, FileHandle, Flags);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntresumeprocess
  public static NtResumeProcess(ProcessHandle: HANDLE): NTSTATUS {
    return Ntdll.Load('NtResumeProcess')(ProcessHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntresumethread
  public static NtResumeThread(ThreadHandle: HANDLE, PreviousSuspendCount: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtResumeThread')(ThreadHandle, PreviousSuspendCount);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntsavekey
  public static NtSaveKey(KeyHandle: HANDLE, FileHandle: HANDLE): NTSTATUS {
    return Ntdll.Load('NtSaveKey')(KeyHandle, FileHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntsavekeyex
  public static NtSaveKeyEx(KeyHandle: HANDLE, FileHandle: HANDLE, Format: ULONG): NTSTATUS {
    return Ntdll.Load('NtSaveKeyEx')(KeyHandle, FileHandle, Format);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntsetcontextthread
  public static NtSetContextThread(ThreadHandle: HANDLE, ThreadContext: PCONTEXT): NTSTATUS {
    return Ntdll.Load('NtSetContextThread')(ThreadHandle, ThreadContext);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntsetdefaultlocale
  public static NtSetDefaultLocale(UserProfile: BOOLEAN, DefaultLocaleId: ULONG): NTSTATUS {
    return Ntdll.Load('NtSetDefaultLocale')(UserProfile, DefaultLocaleId);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntsetdefaultuilanguage
  public static NtSetDefaultUILanguage(DefaultUILanguageId: LANGID): NTSTATUS {
    return Ntdll.Load('NtSetDefaultUILanguage')(DefaultUILanguageId);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntseteafile
  public static NtSetEaFile(FileHandle: HANDLE, IoStatusBlock: PIO_STATUS_BLOCK, Buffer: PVOID, Length: ULONG): NTSTATUS {
    return Ntdll.Load('NtSetEaFile')(FileHandle, IoStatusBlock, Buffer, Length);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntsetevent
  public static NtSetEvent(EventHandle: HANDLE, PreviousState: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtSetEvent')(EventHandle, PreviousState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntsetinformationfile
  public static NtSetInformationFile(FileHandle: HANDLE, IoStatusBlock: PIO_STATUS_BLOCK, FileInformation: PVOID, Length: ULONG, FileInformationClass: ULONG): NTSTATUS {
    return Ntdll.Load('NtSetInformationFile')(FileHandle, IoStatusBlock, FileInformation, Length, FileInformationClass);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwsetinformationjobobject
  public static NtSetInformationJobObject(JobHandle: HANDLE, JobObjectInformationClass: ULONG, JobObjectInformation: PVOID, JobObjectInformationLength: ULONG): NTSTATUS {
    return Ntdll.Load('NtSetInformationJobObject')(JobHandle, JobObjectInformationClass, JobObjectInformation, JobObjectInformationLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntsetinformationobject
  public static NtSetInformationObject(Handle: HANDLE, ObjectInformationClass: ULONG, ObjectInformation: PVOID, ObjectInformationLength: ULONG): NTSTATUS {
    return Ntdll.Load('NtSetInformationObject')(Handle, ObjectInformationClass, ObjectInformation, ObjectInformationLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntsetinformationprocess
  public static NtSetInformationProcess(ProcessHandle: HANDLE, ProcessInformationClass: ULONG, ProcessInformation: PVOID, ProcessInformationLength: ULONG): NTSTATUS {
    return Ntdll.Load('NtSetInformationProcess')(ProcessHandle, ProcessInformationClass, ProcessInformation, ProcessInformationLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntsetinformationthread
  public static NtSetInformationThread(ThreadHandle: HANDLE, ThreadInformationClass: ULONG, ThreadInformation: PVOID, ThreadInformationLength: ULONG): NTSTATUS {
    return Ntdll.Load('NtSetInformationThread')(ThreadHandle, ThreadInformationClass, ThreadInformation, ThreadInformationLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntsetinformationtoken
  public static NtSetInformationToken(TokenHandle: HANDLE, TokenInformationClass: ULONG, TokenInformation: PVOID, TokenInformationLength: ULONG): NTSTATUS {
    return Ntdll.Load('NtSetInformationToken')(TokenHandle, TokenInformationClass, TokenInformation, TokenInformationLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwsetiocompletion
  public static NtSetIoCompletion(IoCompletionHandle: HANDLE, KeyContext: PVOID, ApcContext: PVOID, IoStatus: NTSTATUS, IoStatusInformation: ULONG_PTR): NTSTATUS {
    return Ntdll.Load('NtSetIoCompletion')(IoCompletionHandle, KeyContext, ApcContext, IoStatus, IoStatusInformation);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntsetsecurityobject
  public static NtSetSecurityObject(Handle: HANDLE, SecurityInformation: ULONG, SecurityDescriptor: PSECURITY_DESCRIPTOR): NTSTATUS {
    return Ntdll.Load('NtSetSecurityObject')(Handle, SecurityInformation, SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwsetsysteminformation
  public static NtSetSystemInformation(SystemInformationClass: ULONG, SystemInformation: PVOID, SystemInformationLength: ULONG): NTSTATUS {
    return Ntdll.Load('NtSetSystemInformation')(SystemInformationClass, SystemInformation, SystemInformationLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwsettimer
  public static NtSetTimer(TimerHandle: HANDLE, DueTime: PLARGE_INTEGER, TimerApcRoutine: PTIMER_APC_ROUTINE | NULL, TimerContext: PVOID | NULL, ResumeTimer: BOOLEAN, Period: LONG, PreviousState: PBOOLEAN | NULL): NTSTATUS {
    return Ntdll.Load('NtSetTimer')(TimerHandle, DueTime, TimerApcRoutine, TimerContext, ResumeTimer, Period, PreviousState);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntsettimerresolution
  public static NtSetTimerResolution(DesiredTime: ULONG, SetResolution: BOOLEAN, ActualTime: PULONG): NTSTATUS {
    return Ntdll.Load('NtSetTimerResolution')(DesiredTime, SetResolution, ActualTime);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwsetvaluekey
  public static NtSetValueKey(KeyHandle: HANDLE, ValueName: PUNICODE_STRING, TitleIndex: ULONG, Type: ULONG, Data: PVOID, DataSize: ULONG): NTSTATUS {
    return Ntdll.Load('NtSetValueKey')(KeyHandle, ValueName, TitleIndex, Type, Data, DataSize);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntsetvolumeinformationfile
  public static NtSetVolumeInformationFile(FileHandle: HANDLE, IoStatusBlock: PIO_STATUS_BLOCK, FsInformation: PVOID, Length: ULONG, FsInformationClass: ULONG): NTSTATUS {
    return Ntdll.Load('NtSetVolumeInformationFile')(FileHandle, IoStatusBlock, FsInformation, Length, FsInformationClass);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntshutdownsystem
  public static NtShutdownSystem(Action: ULONG): NTSTATUS {
    return Ntdll.Load('NtShutdownSystem')(Action);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntsignalandwaitforsingleobject
  public static NtSignalAndWaitForSingleObject(SignalHandle: HANDLE, WaitHandle: HANDLE, Alertable: BOOLEAN, Timeout: PLARGE_INTEGER | NULL): NTSTATUS {
    return Ntdll.Load('NtSignalAndWaitForSingleObject')(SignalHandle, WaitHandle, Alertable, Timeout);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntsuspendprocess
  public static NtSuspendProcess(ProcessHandle: HANDLE): NTSTATUS {
    return Ntdll.Load('NtSuspendProcess')(ProcessHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntsuspendthread
  public static NtSuspendThread(ThreadHandle: HANDLE, PreviousSuspendCount: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('NtSuspendThread')(ThreadHandle, PreviousSuspendCount);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwterminatejobobject
  public static NtTerminateJobObject(JobHandle: HANDLE, ExitStatus: NTSTATUS): NTSTATUS {
    return Ntdll.Load('NtTerminateJobObject')(JobHandle, ExitStatus);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntterminateprocess
  public static NtTerminateProcess(ProcessHandle: HANDLE | 0n, ExitStatus: NTSTATUS): NTSTATUS {
    return Ntdll.Load('NtTerminateProcess')(ProcessHandle, ExitStatus);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntterminatethread
  public static NtTerminateThread(ThreadHandle: HANDLE | 0n, ExitStatus: NTSTATUS): NTSTATUS {
    return Ntdll.Load('NtTerminateThread')(ThreadHandle, ExitStatus);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-nttestalert
  public static NtTestAlert(): NTSTATUS {
    return Ntdll.Load('NtTestAlert')();
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwunloadkey
  public static NtUnloadKey(TargetKey: POBJECT_ATTRIBUTES): NTSTATUS {
    return Ntdll.Load('NtUnloadKey')(TargetKey);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntunlockfile
  public static NtUnlockFile(FileHandle: HANDLE, IoStatusBlock: PIO_STATUS_BLOCK, ByteOffset: PLARGE_INTEGER, Length: PLARGE_INTEGER, Key: ULONG): NTSTATUS {
    return Ntdll.Load('NtUnlockFile')(FileHandle, IoStatusBlock, ByteOffset, Length, Key);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntunlockvirtualmemory
  public static NtUnlockVirtualMemory(ProcessHandle: HANDLE, BaseAddress: PVOID, RegionSize: PSIZE_T, MapType: ULONG): NTSTATUS {
    return Ntdll.Load('NtUnlockVirtualMemory')(ProcessHandle, BaseAddress, RegionSize, MapType);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwunmapviewofsection
  public static NtUnmapViewOfSection(ProcessHandle: HANDLE, BaseAddress: PVOID): NTSTATUS {
    return Ntdll.Load('NtUnmapViewOfSection')(ProcessHandle, BaseAddress);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-zwunmapviewofsectionex
  public static NtUnmapViewOfSectionEx(ProcessHandle: HANDLE, BaseAddress: PVOID, Flags: ULONG): NTSTATUS {
    return Ntdll.Load('NtUnmapViewOfSectionEx')(ProcessHandle, BaseAddress, Flags);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntwaitfordebugevent
  public static NtWaitForDebugEvent(DebugObjectHandle: HANDLE, Alertable: BOOLEAN, Timeout: PLARGE_INTEGER | NULL, WaitStateChange: PDBGUI_WAIT_STATE_CHANGE): NTSTATUS {
    return Ntdll.Load('NtWaitForDebugEvent')(DebugObjectHandle, Alertable, Timeout, WaitStateChange);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntwaitformultipleobjects
  public static NtWaitForMultipleObjects(Count: ULONG, Handles: PHANDLE, WaitType: ULONG, Alertable: BOOLEAN, Timeout: PLARGE_INTEGER | NULL): NTSTATUS {
    return Ntdll.Load('NtWaitForMultipleObjects')(Count, Handles, WaitType, Alertable, Timeout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntwaitforsingleobject
  public static NtWaitForSingleObject(Handle: HANDLE, Alertable: BOOLEAN, Timeout: PLARGE_INTEGER | NULL): NTSTATUS {
    return Ntdll.Load('NtWaitForSingleObject')(Handle, Alertable, Timeout);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntwritefile
  public static NtWriteFile(
    FileHandle: HANDLE,
    Event: HANDLE | 0n,
    ApcRoutine: PIO_APC_ROUTINE | NULL,
    ApcContext: PVOID | NULL,
    IoStatusBlock: PIO_STATUS_BLOCK,
    Buffer: PVOID,
    Length: ULONG,
    ByteOffset: PLARGE_INTEGER | NULL,
    Key: PULONG | NULL,
  ): NTSTATUS {
    return Ntdll.Load('NtWriteFile')(FileHandle, Event, ApcRoutine, ApcContext, IoStatusBlock, Buffer, Length, ByteOffset, Key);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntwritefilegather
  public static NtWriteFileGather(
    FileHandle: HANDLE,
    Event: HANDLE | 0n,
    ApcRoutine: PIO_APC_ROUTINE | NULL,
    ApcContext: PVOID | NULL,
    IoStatusBlock: PIO_STATUS_BLOCK,
    SegmentArray: PFILE_SEGMENT_ELEMENT,
    Length: ULONG,
    ByteOffset: PLARGE_INTEGER | NULL,
    Key: PULONG | NULL,
  ): NTSTATUS {
    return Ntdll.Load('NtWriteFileGather')(FileHandle, Event, ApcRoutine, ApcContext, IoStatusBlock, SegmentArray, Length, ByteOffset, Key);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntwritevirtualmemory
  public static NtWriteVirtualMemory(ProcessHandle: HANDLE, BaseAddress: ULONG_PTR, Buffer: PVOID, BufferSize: SIZE_T, NumberOfBytesWritten: PSIZE_T | NULL): NTSTATUS {
    return Ntdll.Load('NtWriteVirtualMemory')(ProcessHandle, BaseAddress, Buffer, BufferSize, NumberOfBytesWritten);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntyieldexecution
  public static NtYieldExecution(): NTSTATUS {
    return Ntdll.Load('NtYieldExecution')();
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlabsolutetoselfrelativesd
  public static RtlAbsoluteToSelfRelativeSD(AbsoluteSecurityDescriptor: PSECURITY_DESCRIPTOR, SelfRelativeSecurityDescriptor: PSECURITY_DESCRIPTOR, BufferLength: PULONG): NTSTATUS {
    return Ntdll.Load('RtlAbsoluteToSelfRelativeSD')(AbsoluteSecurityDescriptor, SelfRelativeSecurityDescriptor, BufferLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlacquiresrwlockexclusive
  public static RtlAcquireSRWLockExclusive(SRWLock: PRTL_SRWLOCK): VOID {
    return Ntdll.Load('RtlAcquireSRWLockExclusive')(SRWLock);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlacquiresrwlockshared
  public static RtlAcquireSRWLockShared(SRWLock: PRTL_SRWLOCK): VOID {
    return Ntdll.Load('RtlAcquireSRWLockShared')(SRWLock);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtladdaccessallowedace
  public static RtlAddAccessAllowedAce(Acl: PACL, AceRevision: ULONG, AccessMask: ACCESS_MASK, Sid: PSID): NTSTATUS {
    return Ntdll.Load('RtlAddAccessAllowedAce')(Acl, AceRevision, AccessMask, Sid);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtladdaccessallowedaceex
  public static RtlAddAccessAllowedAceEx(Acl: PACL, AceRevision: ULONG, AceFlags: ULONG, AccessMask: ACCESS_MASK, Sid: PSID): NTSTATUS {
    return Ntdll.Load('RtlAddAccessAllowedAceEx')(Acl, AceRevision, AceFlags, AccessMask, Sid);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtladdaccessdeniedace
  public static RtlAddAccessDeniedAce(Acl: PACL, AceRevision: ULONG, AccessMask: ACCESS_MASK, Sid: PSID): NTSTATUS {
    return Ntdll.Load('RtlAddAccessDeniedAce')(Acl, AceRevision, AccessMask, Sid);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtladdaccessdeniedaceex
  public static RtlAddAccessDeniedAceEx(Acl: PACL, AceRevision: ULONG, AceFlags: ULONG, AccessMask: ACCESS_MASK, Sid: PSID): NTSTATUS {
    return Ntdll.Load('RtlAddAccessDeniedAceEx')(Acl, AceRevision, AceFlags, AccessMask, Sid);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtladdace
  public static RtlAddAce(Acl: PACL, AceRevision: ULONG, StartingAceIndex: ULONG, AceList: PVOID, AceListLength: ULONG): NTSTATUS {
    return Ntdll.Load('RtlAddAce')(Acl, AceRevision, StartingAceIndex, AceList, AceListLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnt/nf-winnt-rtladdfunctiontable
  public static RtlAddFunctionTable(FunctionTable: PRUNTIME_FUNCTION, EntryCount: DWORD, BaseAddress: ULONG_PTR): BOOLEAN {
    return Ntdll.Load('RtlAddFunctionTable')(FunctionTable, EntryCount, BaseAddress);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/errhandlingapi/nf-errhandlingapi-addvectoredcontinuehandler
  public static RtlAddVectoredContinueHandler(First: ULONG, Handler: PVECTORED_EXCEPTION_HANDLER): PVOID {
    return Ntdll.Load('RtlAddVectoredContinueHandler')(First, Handler);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/errhandlingapi/nf-errhandlingapi-addvectoredexceptionhandler
  public static RtlAddVectoredExceptionHandler(First: ULONG, Handler: PVECTORED_EXCEPTION_HANDLER): PVOID {
    return Ntdll.Load('RtlAddVectoredExceptionHandler')(First, Handler);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtladjustprivilege
  public static RtlAdjustPrivilege(Privilege: ULONG, Enable: BOOLEAN, Client: BOOLEAN, WasEnabled: PBOOLEAN): NTSTATUS {
    return Ntdll.Load('RtlAdjustPrivilege')(Privilege, Enable, Client, WasEnabled);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlallocateandinitializesid
  public static RtlAllocateAndInitializeSid(
    IdentifierAuthority: PSID_IDENTIFIER_AUTHORITY,
    SubAuthorityCount: UCHAR,
    SubAuthority0: ULONG,
    SubAuthority1: ULONG,
    SubAuthority2: ULONG,
    SubAuthority3: ULONG,
    SubAuthority4: ULONG,
    SubAuthority5: ULONG,
    SubAuthority6: ULONG,
    SubAuthority7: ULONG,
    Sid: PVOID,
  ): NTSTATUS {
    return Ntdll.Load('RtlAllocateAndInitializeSid')(IdentifierAuthority, SubAuthorityCount, SubAuthority0, SubAuthority1, SubAuthority2, SubAuthority3, SubAuthority4, SubAuthority5, SubAuthority6, SubAuthority7, Sid);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlallocateheap
  public static RtlAllocateHeap(HeapHandle: PVOID, Flags: ULONG, Size: SIZE_T): PVOID {
    return Ntdll.Load('RtlAllocateHeap')(HeapHandle, Flags, Size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-rtlansistringtounicodestring
  public static RtlAnsiStringToUnicodeString(DestinationString: PUNICODE_STRING, SourceString: PCANSI_STRING, AllocateDestinationString: BOOLEAN): NTSTATUS {
    return Ntdll.Load('RtlAnsiStringToUnicodeString')(DestinationString, SourceString, AllocateDestinationString);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlappendunicodestringtostring
  public static RtlAppendUnicodeStringToString(Destination: PUNICODE_STRING, Source: PCUNICODE_STRING): NTSTATUS {
    return Ntdll.Load('RtlAppendUnicodeStringToString')(Destination, Source);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlappendunicodetostring
  public static RtlAppendUnicodeToString(Destination: PUNICODE_STRING, Source: PCWSTR): NTSTATUS {
    return Ntdll.Load('RtlAppendUnicodeToString')(Destination, Source);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlarebitsclear
  public static RtlAreBitsClear(BitMapHeader: PRTL_BITMAP, StartingIndex: ULONG, Length: ULONG): BOOLEAN {
    return Ntdll.Load('RtlAreBitsClear')(BitMapHeader, StartingIndex, Length);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlarebitsset
  public static RtlAreBitsSet(BitMapHeader: PRTL_BITMAP, StartingIndex: ULONG, Length: ULONG): BOOLEAN {
    return Ntdll.Load('RtlAreBitsSet')(BitMapHeader, StartingIndex, Length);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnt/nf-winnt-rtlcapturecontext
  public static RtlCaptureContext(ContextRecord: PCONTEXT): VOID {
    return Ntdll.Load('RtlCaptureContext')(ContextRecord);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnt/nf-winnt-rtlcapturestackbacktrace
  public static RtlCaptureStackBackTrace(FramesToSkip: ULONG, FramesToCapture: ULONG, BackTrace: PVOID, BackTraceHash: PULONG | NULL): USHORT {
    return Ntdll.Load('RtlCaptureStackBackTrace')(FramesToSkip, FramesToCapture, BackTrace, BackTraceHash);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-rtlchartointeger
  public static RtlCharToInteger(String: PVOID, Base: ULONG, Value: PULONG): NTSTATUS {
    return Ntdll.Load('RtlCharToInteger')(String, Base, Value);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlclearallbits
  public static RtlClearAllBits(BitMapHeader: PRTL_BITMAP): VOID {
    return Ntdll.Load('RtlClearAllBits')(BitMapHeader);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlclearbit
  public static RtlClearBit(BitMapHeader: PRTL_BITMAP, BitNumber: ULONG): VOID {
    return Ntdll.Load('RtlClearBit')(BitMapHeader, BitNumber);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlclearbits
  public static RtlClearBits(BitMapHeader: PRTL_BITMAP, StartingIndex: ULONG, NumberToClear: ULONG): VOID {
    return Ntdll.Load('RtlClearBits')(BitMapHeader, StartingIndex, NumberToClear);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlcomparememory
  public static RtlCompareMemory(Source1: PVOID, Source2: PVOID, Length: SIZE_T): SIZE_T {
    return Ntdll.Load('RtlCompareMemory')(Source1, Source2, Length);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlcompareunicodestring
  public static RtlCompareUnicodeString(String1: PCUNICODE_STRING, String2: PCUNICODE_STRING, CaseInSensitive: BOOLEAN): LONG {
    return Ntdll.Load('RtlCompareUnicodeString')(String1, String2, CaseInSensitive);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlcomputecrc32
  public static RtlComputeCrc32(PartialCrc: ULONG, Buffer: PVOID, Length: ULONG): ULONG {
    return Ntdll.Load('RtlComputeCrc32')(PartialCrc, Buffer, Length);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlconvertsidtounicodestring
  public static RtlConvertSidToUnicodeString(UnicodeString: PUNICODE_STRING, Sid: PSID, AllocateDestinationString: BOOLEAN): NTSTATUS {
    return Ntdll.Load('RtlConvertSidToUnicodeString')(UnicodeString, Sid, AllocateDestinationString);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlcopymemory
  public static RtlCopyMemory(Destination: PVOID, Source: PVOID, Length: SIZE_T): VOID {
    return Ntdll.Load('RtlCopyMemory')(Destination, Source, Length);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlcopysid
  public static RtlCopySid(DestinationSidLength: ULONG, DestinationSid: PSID, SourceSid: PSID): NTSTATUS {
    return Ntdll.Load('RtlCopySid')(DestinationSidLength, DestinationSid, SourceSid);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlcopyunicodestring
  public static RtlCopyUnicodeString(DestinationString: PUNICODE_STRING, SourceString: PCUNICODE_STRING | NULL): VOID {
    return Ntdll.Load('RtlCopyUnicodeString')(DestinationString, SourceString);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlcreateacl
  public static RtlCreateAcl(Acl: PACL, AclLength: ULONG, AclRevision: ULONG): NTSTATUS {
    return Ntdll.Load('RtlCreateAcl')(Acl, AclLength, AclRevision);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlcreateenvironment
  public static RtlCreateEnvironment(CloneCurrentEnvironment: BOOLEAN, Environment: PVOID): NTSTATUS {
    return Ntdll.Load('RtlCreateEnvironment')(CloneCurrentEnvironment, Environment);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlcreateheap
  public static RtlCreateHeap(Flags: ULONG, HeapBase: PVOID | NULL, ReserveSize: SIZE_T, CommitSize: SIZE_T, Lock: PVOID | NULL, Parameters: PRTL_HEAP_PARAMETERS | NULL): PVOID {
    return Ntdll.Load('RtlCreateHeap')(Flags, HeapBase, ReserveSize, CommitSize, Lock, Parameters);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlcreateprocessparametersex
  public static RtlCreateProcessParametersEx(
    pProcessParameters: PVOID,
    ImagePathName: PUNICODE_STRING,
    DllPath: PUNICODE_STRING | NULL,
    CurrentDirectory: PUNICODE_STRING | NULL,
    CommandLine: PUNICODE_STRING | NULL,
    Environment: PVOID | NULL,
    WindowTitle: PUNICODE_STRING | NULL,
    DesktopInfo: PUNICODE_STRING | NULL,
    ShellInfo: PUNICODE_STRING | NULL,
    RuntimeData: PUNICODE_STRING | NULL,
    Flags: ULONG,
  ): NTSTATUS {
    return Ntdll.Load('RtlCreateProcessParametersEx')(pProcessParameters, ImagePathName, DllPath, CurrentDirectory, CommandLine, Environment, WindowTitle, DesktopInfo, ShellInfo, RuntimeData, Flags);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlcreatesecuritydescriptor
  public static RtlCreateSecurityDescriptor(SecurityDescriptor: PSECURITY_DESCRIPTOR, Revision: ULONG): NTSTATUS {
    return Ntdll.Load('RtlCreateSecurityDescriptor')(SecurityDescriptor, Revision);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/threadpoolapiset/nf-threadpoolapiset-createtimerqueuetimer
  public static RtlCreateTimer(TimerQueueHandle: HANDLE, Handle: PHANDLE, Function: WAITORTIMERCALLBACKFUNC, Context: PVOID | NULL, DueTime: ULONG, Period: ULONG, Flags: ULONG): NTSTATUS {
    return Ntdll.Load('RtlCreateTimer')(TimerQueueHandle, Handle, Function, Context, DueTime, Period, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/threadpoolapiset/nf-threadpoolapiset-createtimerqueue
  public static RtlCreateTimerQueue(TimerQueueHandle: PHANDLE): NTSTATUS {
    return Ntdll.Load('RtlCreateTimerQueue')(TimerQueueHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtldeleteace
  public static RtlDeleteAce(Acl: PACL, AceIndex: ULONG): NTSTATUS {
    return Ntdll.Load('RtlDeleteAce')(Acl, AceIndex);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtldeletecriticalsection
  public static RtlDeleteCriticalSection(CriticalSection: PRTL_CRITICAL_SECTION): NTSTATUS {
    return Ntdll.Load('RtlDeleteCriticalSection')(CriticalSection);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnt/nf-winnt-rtldeletefunctiontable
  public static RtlDeleteFunctionTable(FunctionTable: PRUNTIME_FUNCTION): BOOLEAN {
    return Ntdll.Load('RtlDeleteFunctionTable')(FunctionTable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/threadpoolapiset/nf-threadpoolapiset-deletetimerqueuetimer
  public static RtlDeleteTimer(TimerQueueHandle: HANDLE, TimerToCancel: HANDLE, CompletionEvent: HANDLE | 0n): NTSTATUS {
    return Ntdll.Load('RtlDeleteTimer')(TimerQueueHandle, TimerToCancel, CompletionEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/threadpoolapiset/nf-threadpoolapiset-deletetimerqueue
  public static RtlDeleteTimerQueue(TimerQueueHandle: HANDLE): NTSTATUS {
    return Ntdll.Load('RtlDeleteTimerQueue')(TimerQueueHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/threadpoolapiset/nf-threadpoolapiset-deletetimerqueueex
  public static RtlDeleteTimerQueueEx(TimerQueueHandle: HANDLE, CompletionEvent: HANDLE | 0n): NTSTATUS {
    return Ntdll.Load('RtlDeleteTimerQueueEx')(TimerQueueHandle, CompletionEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/threadpoolapiset/nf-threadpoolapiset-unregisterwait
  public static RtlDeregisterWait(WaitHandle: HANDLE): NTSTATUS {
    return Ntdll.Load('RtlDeregisterWait')(WaitHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/threadpoolapiset/nf-threadpoolapiset-unregisterwaitex
  public static RtlDeregisterWaitEx(WaitHandle: HANDLE, CompletionEvent: HANDLE | 0n): NTSTATUS {
    return Ntdll.Load('RtlDeregisterWaitEx')(WaitHandle, CompletionEvent);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtldestroyenvironment
  public static RtlDestroyEnvironment(Environment: PVOID): NTSTATUS {
    return Ntdll.Load('RtlDestroyEnvironment')(Environment);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtldestroyheap
  public static RtlDestroyHeap(HeapHandle: PVOID): PVOID {
    return Ntdll.Load('RtlDestroyHeap')(HeapHandle);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtldestroyprocessparameters
  public static RtlDestroyProcessParameters(ProcessParameters: PRTL_USER_PROCESS_PARAMETERS): NTSTATUS {
    return Ntdll.Load('RtlDestroyProcessParameters')(ProcessParameters);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtldospathnametontpathname_u_withstatus
  public static RtlDosPathNameToNtPathName_U_WithStatus(DosFileName: PCWSTR, NtFileName: PUNICODE_STRING, FilePart: PVOID | NULL, RelativeName: PRTL_RELATIVE_NAME_U | NULL): NTSTATUS {
    return Ntdll.Load('RtlDosPathNameToNtPathName_U_WithStatus')(DosFileName, NtFileName, FilePart, RelativeName);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtldowncaseunicodestring
  public static RtlDowncaseUnicodeString(DestinationString: PUNICODE_STRING, SourceString: PCUNICODE_STRING, AllocateDestinationString: BOOLEAN): NTSTATUS {
    return Ntdll.Load('RtlDowncaseUnicodeString')(DestinationString, SourceString, AllocateDestinationString);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlduplicateunicodestring
  public static RtlDuplicateUnicodeString(Flags: ULONG, SourceString: PCUNICODE_STRING, DestinationString: PUNICODE_STRING): NTSTATUS {
    return Ntdll.Load('RtlDuplicateUnicodeString')(Flags, SourceString, DestinationString);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlentercriticalsection
  public static RtlEnterCriticalSection(CriticalSection: PRTL_CRITICAL_SECTION): NTSTATUS {
    return Ntdll.Load('RtlEnterCriticalSection')(CriticalSection);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlequalsid
  public static RtlEqualSid(Sid1: PSID, Sid2: PSID): BOOLEAN {
    return Ntdll.Load('RtlEqualSid')(Sid1, Sid2);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlequalunicodestring
  public static RtlEqualUnicodeString(String1: PCUNICODE_STRING, String2: PCUNICODE_STRING, CaseInSensitive: BOOLEAN): BOOLEAN {
    return Ntdll.Load('RtlEqualUnicodeString')(String1, String2, CaseInSensitive);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlexpandenvironmentstrings_u
  public static RtlExpandEnvironmentStrings_U(Environment: PVOID | NULL, Source: PUNICODE_STRING, Destination: PUNICODE_STRING, ReturnedLength: PULONG | NULL): NTSTATUS {
    return Ntdll.Load('RtlExpandEnvironmentStrings_U')(Environment, Source, Destination, ReturnedLength);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlfillmemory
  public static RtlFillMemory(Destination: PVOID, Length: SIZE_T, Fill: UCHAR): VOID {
    return Ntdll.Load('RtlFillMemory')(Destination, Length, Fill);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlfindclearbits
  public static RtlFindClearBits(BitMapHeader: PRTL_BITMAP, NumberToFind: ULONG, HintIndex: ULONG): ULONG {
    return Ntdll.Load('RtlFindClearBits')(BitMapHeader, NumberToFind, HintIndex);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlfindclearbitsandset
  public static RtlFindClearBitsAndSet(BitMapHeader: PRTL_BITMAP, NumberToFind: ULONG, HintIndex: ULONG): ULONG {
    return Ntdll.Load('RtlFindClearBitsAndSet')(BitMapHeader, NumberToFind, HintIndex);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlfindsetbits
  public static RtlFindSetBits(BitMapHeader: PRTL_BITMAP, NumberToFind: ULONG, HintIndex: ULONG): ULONG {
    return Ntdll.Load('RtlFindSetBits')(BitMapHeader, NumberToFind, HintIndex);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlfindsetbitsandclear
  public static RtlFindSetBitsAndClear(BitMapHeader: PRTL_BITMAP, NumberToFind: ULONG, HintIndex: ULONG): ULONG {
    return Ntdll.Load('RtlFindSetBitsAndClear')(BitMapHeader, NumberToFind, HintIndex);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlfirstentryslist
  public static RtlFirstEntrySList(ListHead: PSLIST_HEADER): PSLIST_ENTRY {
    return Ntdll.Load('RtlFirstEntrySList')(ListHead);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-rtlfreeansistring
  public static RtlFreeAnsiString(AnsiString: PANSI_STRING): VOID {
    return Ntdll.Load('RtlFreeAnsiString')(AnsiString);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlfreeheap
  public static RtlFreeHeap(HeapHandle: PVOID, Flags: ULONG, BaseAddress: PVOID | NULL): BOOLEAN {
    return Ntdll.Load('RtlFreeHeap')(HeapHandle, Flags, BaseAddress);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-rtlfreeoemstring
  public static RtlFreeOemString(OemString: POEM_STRING): VOID {
    return Ntdll.Load('RtlFreeOemString')(OemString);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlfreesid
  public static RtlFreeSid(Sid: PSID): PVOID {
    return Ntdll.Load('RtlFreeSid')(Sid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-rtlfreeunicodestring
  public static RtlFreeUnicodeString(UnicodeString: PUNICODE_STRING): VOID {
    return Ntdll.Load('RtlFreeUnicodeString')(UnicodeString);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlgetace
  public static RtlGetAce(Acl: PACL, AceIndex: ULONG, Ace: PVOID): NTSTATUS {
    return Ntdll.Load('RtlGetAce')(Acl, AceIndex, Ace);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlgetcurrentdirectory_u
  public static RtlGetCurrentDirectory_U(BufferLength: ULONG, Buffer: PWSTR): ULONG {
    return Ntdll.Load('RtlGetCurrentDirectory_U')(BufferLength, Buffer);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlgetcurrentpeb
  public static RtlGetCurrentPeb(): PPEB {
    return Ntdll.Load('RtlGetCurrentPeb')();
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlgetfullpathname_u
  public static RtlGetFullPathName_U(FileName: PCWSTR, BufferLength: ULONG, Buffer: PWSTR, FilePart: PVOID | NULL): ULONG {
    return Ntdll.Load('RtlGetFullPathName_U')(FileName, BufferLength, Buffer, FilePart);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlgetntversionumbers
  public static RtlGetNtVersionNumbers(MajorVersion: PULONG, MinorVersion: PULONG, BuildNumber: PULONG): VOID {
    return Ntdll.Load('RtlGetNtVersionNumbers')(MajorVersion, MinorVersion, BuildNumber);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlgetprocessheaps
  public static RtlGetProcessHeaps(NumberOfHeaps: ULONG, ProcessHeaps: PVOID): ULONG {
    return Ntdll.Load('RtlGetProcessHeaps')(NumberOfHeaps, ProcessHeaps);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlgetversion
  public static RtlGetVersion(lpVersionInformation: PRTL_OSVERSIONINFOW): NTSTATUS {
    return Ntdll.Load('RtlGetVersion')(lpVersionInformation);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlhashunicodestring
  public static RtlHashUnicodeString(String: PCUNICODE_STRING, CaseInSensitive: BOOLEAN, HashAlgorithm: ULONG, HashValue: PULONG): NTSTATUS {
    return Ntdll.Load('RtlHashUnicodeString')(String, CaseInSensitive, HashAlgorithm, HashValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-rtlinitansistring
  public static RtlInitAnsiString(DestinationString: PANSI_STRING, SourceString: PVOID | NULL): VOID {
    return Ntdll.Load('RtlInitAnsiString')(DestinationString, SourceString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-rtlinitstring
  public static RtlInitString(DestinationString: PSTRING, SourceString: PVOID | NULL): VOID {
    return Ntdll.Load('RtlInitString')(DestinationString, SourceString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-rtlinitunicodestring
  public static RtlInitUnicodeString(DestinationString: PUNICODE_STRING, SourceString: PCWSTR | NULL): VOID {
    return Ntdll.Load('RtlInitUnicodeString')(DestinationString, SourceString);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlinitializebitmap
  public static RtlInitializeBitMap(BitMapHeader: PRTL_BITMAP, BitMapBuffer: PULONG, SizeOfBitMap: ULONG): VOID {
    return Ntdll.Load('RtlInitializeBitMap')(BitMapHeader, BitMapBuffer, SizeOfBitMap);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlinitializeconditionvariable
  public static RtlInitializeConditionVariable(ConditionVariable: PRTL_CONDITION_VARIABLE): VOID {
    return Ntdll.Load('RtlInitializeConditionVariable')(ConditionVariable);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlinitializecriticalsection
  public static RtlInitializeCriticalSection(CriticalSection: PRTL_CRITICAL_SECTION): NTSTATUS {
    return Ntdll.Load('RtlInitializeCriticalSection')(CriticalSection);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlinitializecriticalsectionandspincount
  public static RtlInitializeCriticalSectionAndSpinCount(CriticalSection: PRTL_CRITICAL_SECTION, SpinCount: ULONG): NTSTATUS {
    return Ntdll.Load('RtlInitializeCriticalSectionAndSpinCount')(CriticalSection, SpinCount);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlinitializecriticalsectionex
  public static RtlInitializeCriticalSectionEx(CriticalSection: PRTL_CRITICAL_SECTION, SpinCount: ULONG, Flags: ULONG): NTSTATUS {
    return Ntdll.Load('RtlInitializeCriticalSectionEx')(CriticalSection, SpinCount, Flags);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlinitializeslisthead
  public static RtlInitializeSListHead(ListHead: PSLIST_HEADER): VOID {
    return Ntdll.Load('RtlInitializeSListHead')(ListHead);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlinitializesrwlock
  public static RtlInitializeSRWLock(SRWLock: PRTL_SRWLOCK): VOID {
    return Ntdll.Load('RtlInitializeSRWLock')(SRWLock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnt/nf-winnt-rtlinstallfunctiontablecallback
  public static RtlInstallFunctionTableCallback(TableIdentifier: ULONG_PTR, BaseAddress: ULONG_PTR, Length: DWORD, Callback: PGET_RUNTIME_FUNCTION_CALLBACK, Context: PVOID | NULL, OutOfProcessCallbackDll: PCWSTR | NULL): BOOLEAN {
    return Ntdll.Load('RtlInstallFunctionTableCallback')(TableIdentifier, BaseAddress, Length, Callback, Context, OutOfProcessCallbackDll);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlint64tounicodestring
  public static RtlInt64ToUnicodeString(Value: ULONGLONG, Base: ULONG, String: PUNICODE_STRING): NTSTATUS {
    return Ntdll.Load('RtlInt64ToUnicodeString')(Value, Base, String);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlintegertounicodestring
  public static RtlIntegerToUnicodeString(Value: ULONG, Base: ULONG, String: PUNICODE_STRING): NTSTATUS {
    return Ntdll.Load('RtlIntegerToUnicodeString')(Value, Base, String);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlinterlockedflushslist
  public static RtlInterlockedFlushSList(ListHead: PSLIST_HEADER): PSLIST_ENTRY {
    return Ntdll.Load('RtlInterlockedFlushSList')(ListHead);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlinterlockedpopentryslist
  public static RtlInterlockedPopEntrySList(ListHead: PSLIST_HEADER): PSLIST_ENTRY {
    return Ntdll.Load('RtlInterlockedPopEntrySList')(ListHead);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlinterlockedpushentryslist
  public static RtlInterlockedPushEntrySList(ListHead: PSLIST_HEADER, ListEntry: PSLIST_ENTRY): PSLIST_ENTRY {
    return Ntdll.Load('RtlInterlockedPushEntrySList')(ListHead, ListEntry);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlleavecriticalsection
  public static RtlLeaveCriticalSection(CriticalSection: PRTL_CRITICAL_SECTION): NTSTATUS {
    return Ntdll.Load('RtlLeaveCriticalSection')(CriticalSection);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtllengthsecuritydescriptor
  public static RtlLengthSecurityDescriptor(SecurityDescriptor: PSECURITY_DESCRIPTOR): ULONG {
    return Ntdll.Load('RtlLengthSecurityDescriptor')(SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtllengthsid
  public static RtlLengthSid(Sid: PSID): ULONG {
    return Ntdll.Load('RtlLengthSid')(Sid);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtllockheap
  public static RtlLockHeap(HeapHandle: PVOID): BOOLEAN {
    return Ntdll.Load('RtlLockHeap')(HeapHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnt/nf-winnt-rtllookupfunctionentry
  public static RtlLookupFunctionEntry(ControlPc: ULONG_PTR, ImageBase: PULONG_PTR, HistoryTable: PUNWIND_HISTORY_TABLE | NULL): PRUNTIME_FUNCTION {
    return Ntdll.Load('RtlLookupFunctionEntry')(ControlPc, ImageBase, HistoryTable);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlmovememory
  public static RtlMoveMemory(Destination: PVOID, Source: PVOID, Length: SIZE_T): VOID {
    return Ntdll.Load('RtlMoveMemory')(Destination, Source, Length);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-rtlntstatustodoserror
  public static RtlNtStatusToDosError(Status: NTSTATUS): ULONG {
    return Ntdll.Load('RtlNtStatusToDosError')(Status);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlnumberofclearbits
  public static RtlNumberOfClearBits(BitMapHeader: PRTL_BITMAP): ULONG {
    return Ntdll.Load('RtlNumberOfClearBits')(BitMapHeader);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlnumberofsetbits
  public static RtlNumberOfSetBits(BitMapHeader: PRTL_BITMAP): ULONG {
    return Ntdll.Load('RtlNumberOfSetBits')(BitMapHeader);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlquerydepthslist
  public static RtlQueryDepthSList(ListHead: PSLIST_HEADER): USHORT {
    return Ntdll.Load('RtlQueryDepthSList')(ListHead);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlqueryenvironmentvariable_u
  public static RtlQueryEnvironmentVariable_U(Environment: PVOID | NULL, Name: PUNICODE_STRING, Value: PUNICODE_STRING): NTSTATUS {
    return Ntdll.Load('RtlQueryEnvironmentVariable_U')(Environment, Name, Value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/threadpoolapiset/nf-threadpoolapiset-queueuserworkitem
  public static RtlQueueWorkItem(Function: WORKERCALLBACKFUNC, Context: PVOID | NULL, Flags: ULONG): NTSTATUS {
    return Ntdll.Load('RtlQueueWorkItem')(Function, Context, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnt/nf-winnt-rtlraiseexception
  public static RtlRaiseException(ExceptionRecord: PEXCEPTION_RECORD): VOID {
    return Ntdll.Load('RtlRaiseException')(ExceptionRecord);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlraisestatus
  public static RtlRaiseStatus(Status: NTSTATUS): VOID {
    return Ntdll.Load('RtlRaiseStatus')(Status);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlrandom
  public static RtlRandom(Seed: PULONG): ULONG {
    return Ntdll.Load('RtlRandom')(Seed);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlrandomex
  public static RtlRandomEx(Seed: PULONG): ULONG {
    return Ntdll.Load('RtlRandomEx')(Seed);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlreallocateheap
  public static RtlReAllocateHeap(HeapHandle: PVOID, Flags: ULONG, BaseAddress: PVOID, Size: SIZE_T): PVOID {
    return Ntdll.Load('RtlReAllocateHeap')(HeapHandle, Flags, BaseAddress, Size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/threadpoolapiset/nf-threadpoolapiset-registerwaitforsingleobject
  public static RtlRegisterWait(WaitHandle: PHANDLE, ObjectHandle: HANDLE, Callback: WAITORTIMERCALLBACKFUNC, Context: PVOID | NULL, Milliseconds: ULONG, Flags: ULONG): NTSTATUS {
    return Ntdll.Load('RtlRegisterWait')(WaitHandle, ObjectHandle, Callback, Context, Milliseconds, Flags);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlreleasesrwlockexclusive
  public static RtlReleaseSRWLockExclusive(SRWLock: PRTL_SRWLOCK): VOID {
    return Ntdll.Load('RtlReleaseSRWLockExclusive')(SRWLock);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlreleasesrwlockshared
  public static RtlReleaseSRWLockShared(SRWLock: PRTL_SRWLOCK): VOID {
    return Ntdll.Load('RtlReleaseSRWLockShared')(SRWLock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/errhandlingapi/nf-errhandlingapi-removevectoredcontinuehandler
  public static RtlRemoveVectoredContinueHandler(Handle: PVOID): ULONG {
    return Ntdll.Load('RtlRemoveVectoredContinueHandler')(Handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/errhandlingapi/nf-errhandlingapi-removevectoredexceptionhandler
  public static RtlRemoveVectoredExceptionHandler(Handle: PVOID): ULONG {
    return Ntdll.Load('RtlRemoveVectoredExceptionHandler')(Handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnt/nf-winnt-rtlrestorecontext
  public static RtlRestoreContext(ContextRecord: PCONTEXT, ExceptionRecord: PEXCEPTION_RECORD | NULL): VOID {
    return Ntdll.Load('RtlRestoreContext')(ContextRecord, ExceptionRecord);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlsetallbits
  public static RtlSetAllBits(BitMapHeader: PRTL_BITMAP): VOID {
    return Ntdll.Load('RtlSetAllBits')(BitMapHeader);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlsetbit
  public static RtlSetBit(BitMapHeader: PRTL_BITMAP, BitNumber: ULONG): VOID {
    return Ntdll.Load('RtlSetBit')(BitMapHeader, BitNumber);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlsetbits
  public static RtlSetBits(BitMapHeader: PRTL_BITMAP, StartingIndex: ULONG, NumberToSet: ULONG): VOID {
    return Ntdll.Load('RtlSetBits')(BitMapHeader, StartingIndex, NumberToSet);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlsetcurrentdirectory_u
  public static RtlSetCurrentDirectory_U(PathName: PUNICODE_STRING): NTSTATUS {
    return Ntdll.Load('RtlSetCurrentDirectory_U')(PathName);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlsetdaclsecuritydescriptor
  public static RtlSetDaclSecurityDescriptor(SecurityDescriptor: PSECURITY_DESCRIPTOR, DaclPresent: BOOLEAN, Dacl: PACL | NULL, DaclDefaulted: BOOLEAN): NTSTATUS {
    return Ntdll.Load('RtlSetDaclSecurityDescriptor')(SecurityDescriptor, DaclPresent, Dacl, DaclDefaulted);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlsetenvironmentvariable
  public static RtlSetEnvironmentVariable(Environment: PVOID, Name: PUNICODE_STRING, Value: PUNICODE_STRING | NULL): NTSTATUS {
    return Ntdll.Load('RtlSetEnvironmentVariable')(Environment, Name, Value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-bindiocompletioncallback
  public static RtlSetIoCompletionCallback(FileHandle: HANDLE, Function: PIO_APC_ROUTINE, Flags: ULONG): NTSTATUS {
    return Ntdll.Load('RtlSetIoCompletionCallback')(FileHandle, Function, Flags);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlsizeheap
  public static RtlSizeHeap(HeapHandle: PVOID, Flags: ULONG, BaseAddress: PVOID): SIZE_T {
    return Ntdll.Load('RtlSizeHeap')(HeapHandle, Flags, BaseAddress);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlsleepconditionvariablecs
  public static RtlSleepConditionVariableCS(ConditionVariable: PRTL_CONDITION_VARIABLE, CriticalSection: PRTL_CRITICAL_SECTION, Timeout: PLARGE_INTEGER | NULL): NTSTATUS {
    return Ntdll.Load('RtlSleepConditionVariableCS')(ConditionVariable, CriticalSection, Timeout);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlsleepconditionvariablesrw
  public static RtlSleepConditionVariableSRW(ConditionVariable: PRTL_CONDITION_VARIABLE, SRWLock: PRTL_SRWLOCK, Timeout: PLARGE_INTEGER | NULL, Flags: ULONG): NTSTATUS {
    return Ntdll.Load('RtlSleepConditionVariableSRW')(ConditionVariable, SRWLock, Timeout, Flags);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtltestbit
  public static RtlTestBit(BitMapHeader: PRTL_BITMAP, BitNumber: ULONG): BOOLEAN {
    return Ntdll.Load('RtlTestBit')(BitMapHeader, BitNumber);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtltryacquiresrwlockexclusive
  public static RtlTryAcquireSRWLockExclusive(SRWLock: PRTL_SRWLOCK): BOOLEAN {
    return Ntdll.Load('RtlTryAcquireSRWLockExclusive')(SRWLock);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtltryacquiresrwlockshared
  public static RtlTryAcquireSRWLockShared(SRWLock: PRTL_SRWLOCK): BOOLEAN {
    return Ntdll.Load('RtlTryAcquireSRWLockShared')(SRWLock);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtltryentercriticalsection
  public static RtlTryEnterCriticalSection(CriticalSection: PRTL_CRITICAL_SECTION): BOOLEAN {
    return Ntdll.Load('RtlTryEnterCriticalSection')(CriticalSection);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-rtlunicodestringtoansistring
  public static RtlUnicodeStringToAnsiString(DestinationString: PANSI_STRING, SourceString: PCUNICODE_STRING, AllocateDestinationString: BOOLEAN): NTSTATUS {
    return Ntdll.Load('RtlUnicodeStringToAnsiString')(DestinationString, SourceString, AllocateDestinationString);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlunicodestringtointeger
  public static RtlUnicodeStringToInteger(String: PCUNICODE_STRING, Base: ULONG, Value: PULONG): NTSTATUS {
    return Ntdll.Load('RtlUnicodeStringToInteger')(String, Base, Value);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtluniform
  public static RtlUniform(Seed: PULONG): ULONG {
    return Ntdll.Load('RtlUniform')(Seed);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlunlockheap
  public static RtlUnlockHeap(HeapHandle: PVOID): BOOLEAN {
    return Ntdll.Load('RtlUnlockHeap')(HeapHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnt/nf-winnt-rtlunwind
  public static RtlUnwind(TargetFrame: PVOID | NULL, TargetIp: PVOID | NULL, ExceptionRecord: PEXCEPTION_RECORD | NULL, ReturnValue: PVOID): VOID {
    return Ntdll.Load('RtlUnwind')(TargetFrame, TargetIp, ExceptionRecord, ReturnValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnt/nf-winnt-rtlunwindex
  public static RtlUnwindEx(TargetFrame: PVOID | NULL, TargetIp: PVOID | NULL, ExceptionRecord: PEXCEPTION_RECORD | NULL, ReturnValue: PVOID, ContextRecord: PCONTEXT, HistoryTable: PUNWIND_HISTORY_TABLE | NULL): VOID {
    return Ntdll.Load('RtlUnwindEx')(TargetFrame, TargetIp, ExceptionRecord, ReturnValue, ContextRecord, HistoryTable);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlupcaseunicodestring
  public static RtlUpcaseUnicodeString(DestinationString: PUNICODE_STRING, SourceString: PCUNICODE_STRING, AllocateDestinationString: BOOLEAN): NTSTATUS {
    return Ntdll.Load('RtlUpcaseUnicodeString')(DestinationString, SourceString, AllocateDestinationString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/threadpoolapiset/nf-threadpoolapiset-changetimerqueuetimer
  public static RtlUpdateTimer(TimerQueueHandle: HANDLE, TimerHandle: HANDLE, DueTime: ULONG, Period: ULONG): NTSTATUS {
    return Ntdll.Load('RtlUpdateTimer')(TimerQueueHandle, TimerHandle, DueTime, Period);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlvalidacl
  public static RtlValidAcl(Acl: PACL): BOOLEAN {
    return Ntdll.Load('RtlValidAcl')(Acl);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlvalidsecuritydescriptor
  public static RtlValidSecurityDescriptor(SecurityDescriptor: PSECURITY_DESCRIPTOR): BOOLEAN {
    return Ntdll.Load('RtlValidSecurityDescriptor')(SecurityDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlvalidsid
  public static RtlValidSid(Sid: PSID): BOOLEAN {
    return Ntdll.Load('RtlValidSid')(Sid);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-rtlvalidateheap
  public static RtlValidateHeap(HeapHandle: PVOID, Flags: ULONG, BaseAddress: PVOID | NULL): BOOLEAN {
    return Ntdll.Load('RtlValidateHeap')(HeapHandle, Flags, BaseAddress);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlverifyversioninfo
  public static RtlVerifyVersionInfo(VersionInfo: PRTL_OSVERSIONINFOEXW, TypeMask: ULONG, ConditionMask: ULONGLONG): NTSTATUS {
    return Ntdll.Load('RtlVerifyVersionInfo')(VersionInfo, TypeMask, ConditionMask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnt/nf-winnt-rtlvirtualunwind
  public static RtlVirtualUnwind(
    HandlerType: ULONG,
    ImageBase: ULONG_PTR,
    ControlPc: ULONG_PTR,
    FunctionEntry: PRUNTIME_FUNCTION,
    ContextRecord: PCONTEXT,
    HandlerData: PVOID,
    EstablisherFrame: PULONG_PTR,
    ContextPointers: PKNONVOLATILE_CONTEXT_POINTERS | NULL,
  ): PEXCEPTION_ROUTINE {
    return Ntdll.Load('RtlVirtualUnwind')(HandlerType, ImageBase, ControlPc, FunctionEntry, ContextRecord, HandlerData, EstablisherFrame, ContextPointers);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlwakeallconditionvariable
  public static RtlWakeAllConditionVariable(ConditionVariable: PRTL_CONDITION_VARIABLE): VOID {
    return Ntdll.Load('RtlWakeAllConditionVariable')(ConditionVariable);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlwakeconditionvariable
  public static RtlWakeConditionVariable(ConditionVariable: PRTL_CONDITION_VARIABLE): VOID {
    return Ntdll.Load('RtlWakeConditionVariable')(ConditionVariable);
  }

  // https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-rtlzeromemory
  public static RtlZeroMemory(Destination: PVOID, Length: SIZE_T): VOID {
    return Ntdll.Load('RtlZeroMemory')(Destination, Length);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnt/nf-winnt-versetconditionmask
  public static VerSetConditionMask(ConditionMask: ULONGLONG, TypeMask: ULONG, Condition: UCHAR): ULONGLONG {
    return Ntdll.Load('VerSetConditionMask')(ConditionMask, TypeMask, Condition);
  }
}

export default Ntdll;
