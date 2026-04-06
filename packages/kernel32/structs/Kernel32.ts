import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  BOOLEAN,
  CODEPAGE_ENUMPROC,
  COORD,
  DWORD,
  ENUMRESLANGPROCA,
  ENUMRESLANGPROCW,
  ENUMRESNAMEPROCA,
  ENUMRESNAMEPROCW,
  ENUMRESTYPEPROCA,
  ENUMRESTYPEPROCW,
  GEO_ENUMNAMEPROC,
  GEO_ENUMPROC,
  HANDLE,
  HGLOBAL,
  HMODULE,
  HRESULT,
  HRSRC,
  HWND,
  INT,
  LANGUAGEGROUP_ENUMPROCA,
  LANGUAGEGROUP_ENUMPROCW,
  LCID,
  LOCALE_ENUMPROCA,
  LOCALE_ENUMPROCEX,
  LOCALE_ENUMPROCW,
  LONG,
  LONG_PTR,
  LPARAM,
  LPBOOL,
  LPBYTE,
  LPCPINFO,
  LPCPINFOEXA,
  LPCPINFOEXW,
  LPCSTR,
  LPCURRENCYFMTA,
  LPCURRENCYFMTW,
  LPCWSTR,
  LPDWORD,
  LPHANDLE,
  LPNLSVERSIONINFO,
  LPPROC_THREAD_ATTRIBUTE_LIST,
  LPPROCESS_INFORMATION,
  LPSECURITY_ATTRIBUTES,
  LPSTARTUPINFOA,
  LPSTARTUPINFOW,
  LPSTR,
  LPTHREAD_START_ROUTINE,
  LPVOID,
  LPWSTR,
  NULL,
  PCONSOLE_CURSOR_INFO,
  PCONSOLE_FONT_INFO,
  PCONSOLE_FONT_INFOEX,
  PCONSOLE_HISTORY_INFO,
  PCONSOLE_SCREEN_BUFFER_INFO,
  PCONSOLE_SCREEN_BUFFER_INFOEX,
  PCONSOLE_SELECTION_INFO,
  PHANDLE,
  PHPCON,
  PULONG,
  SIZE_T,
  TIMEFMT_ENUMPROCA,
  TIMEFMT_ENUMPROCEX,
  TIMEFMT_ENUMPROCW,
  UILANGUAGE_ENUMPROCA,
  UILANGUAGE_ENUMPROCW,
  UINT,
  ULONGLONG,
  USHORT,
  VOID,
} from '../types/Kernel32';

/**
 * Thin, lazy-loaded FFI bindings for `kernel32.dll`.
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
 * import Kernel32 from './structs/Kernel32';
 *
 * // Lazy: bind on first call
 * const ticks = Kernel32.GetTickCount64();
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Kernel32.Preload(['GetTickCount64', 'GetLastError']);
 * ```
 */
class Kernel32 extends Win32 {
  protected static override name = 'kernel32.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    _hread: { args: [FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    _hwrite: { args: [FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    _lclose: { args: [FFIType.i32], returns: FFIType.i32 },
    _lcreat: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    _llseek: { args: [FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    _lopen: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    _lread: { args: [FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    _lwrite: { args: [FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    AcquireSRWLockExclusive: { args: [FFIType.ptr], returns: FFIType.void },
    AcquireSRWLockShared: { args: [FFIType.ptr], returns: FFIType.void },
    ActivateActCtx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ActivatePackageVirtualizationContext: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    AddAtomA: { args: [FFIType.ptr], returns: FFIType.u16 },
    AddAtomW: { args: [FFIType.ptr], returns: FFIType.u16 },
    AddConsoleAliasA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AddConsoleAliasW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AddDllDirectory: { args: [FFIType.ptr], returns: FFIType.u64 },
    AddIntegrityLabelToBoundaryDescriptor: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    AddRefActCtx: { args: [FFIType.u64], returns: FFIType.void },
    AddResourceAttributeAce: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AddScopedPolicyIDAce: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AddSecureMemoryCacheCallback: { args: [FFIType.ptr], returns: FFIType.i32 },
    AddSIDToBoundaryDescriptor: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AddVectoredContinueHandler: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.ptr },
    AddVectoredExceptionHandler: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.ptr },
    AdjustCalendarDate: { args: [FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    AllocateUserPhysicalPages: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AllocateUserPhysicalPagesNuma: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    AllocConsole: { args: [], returns: FFIType.i32 },
    AllocConsoleWithOptions: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ApplicationRecoveryFinished: { args: [FFIType.i32], returns: FFIType.void },
    ApplicationRecoveryInProgress: { args: [FFIType.ptr], returns: FFIType.u32 },
    AppPolicyGetClrCompat: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    AppPolicyGetCreateFileAccess: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    AppPolicyGetLifecycleManagement: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    AppPolicyGetMediaFoundationCodecLoading: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    AppPolicyGetProcessTerminationMethod: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    AppPolicyGetShowDeveloperDiagnostic: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    AppPolicyGetThreadInitializationType: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    AppPolicyGetWindowingModel: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    AreFileApisANSI: { args: [], returns: FFIType.i32 },
    AreShortNamesEnabled: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AssignProcessToJobObject: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    AttachConsole: { args: [FFIType.u32], returns: FFIType.i32 },
    BackupRead: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    BackupSeek: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BackupWrite: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    Beep: { args: [FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    BeginUpdateResourceA: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    BeginUpdateResourceW: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    BindIoCompletionCallback: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    BuildCommDCBA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BuildCommDCBAndTimeoutsA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BuildCommDCBAndTimeoutsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BuildCommDCBW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    BuildIoRingFlushFile: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    BuildIoRingReadFileScatter: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    BuildIoRingWriteFile: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    BuildIoRingWriteFileGather: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CallbackMayRunLong: { args: [FFIType.ptr], returns: FFIType.i32 },
    CallNamedPipeA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CallNamedPipeW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CancelDeviceWakeupRequest: { args: [FFIType.u64], returns: FFIType.i32 },
    CancelIo: { args: [FFIType.u64], returns: FFIType.i32 },
    CancelIoEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    CancelSynchronousIo: { args: [FFIType.u64], returns: FFIType.i32 },
    CancelThreadpoolIo: { args: [FFIType.ptr], returns: FFIType.void },
    CancelTimerQueueTimer: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    CancelWaitableTimer: { args: [FFIType.u64], returns: FFIType.i32 },
    CeipIsOptedIn: { args: [], returns: FFIType.i32 },
    ChangeTimerQueueTimer: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    // CheckIsMSIXPackage: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    CheckNameLegalDOS8Dot3A: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CheckNameLegalDOS8Dot3W: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CheckRemoteDebuggerPresent: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    CheckTokenCapability: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CheckTokenMembershipEx: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ClearCommBreak: { args: [FFIType.u64], returns: FFIType.i32 },
    ClearCommError: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CloseConsoleHandle: { args: [FFIType.u64], returns: FFIType.i32 },
    CloseHandle: { args: [FFIType.u64], returns: FFIType.i32 },
    ClosePackageInfo: { args: [FFIType.ptr], returns: FFIType.u32 },
    ClosePrivateNamespace: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    ClosePseudoConsole: { args: [FFIType.u64], returns: FFIType.void },
    CloseThreadpool: { args: [FFIType.ptr], returns: FFIType.void },
    CloseThreadpoolCleanupGroup: { args: [FFIType.ptr], returns: FFIType.void },
    CloseThreadpoolCleanupGroupMembers: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    CloseThreadpoolIo: { args: [FFIType.ptr], returns: FFIType.void },
    CloseThreadpoolTimer: { args: [FFIType.ptr], returns: FFIType.void },
    CloseThreadpoolWait: { args: [FFIType.ptr], returns: FFIType.void },
    CloseThreadpoolWork: { args: [FFIType.ptr], returns: FFIType.void },
    CommConfigDialogA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CommConfigDialogW: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    CompareFileTime: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CompareStringA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    CompareStringEx: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CompareStringOrdinal: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.u32 },
    CompareStringW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    ConnectNamedPipe: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ConsoleMenuControl: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    ContinueDebugEvent: { args: [FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    ConvertCalDateTimeToSystemTime: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ConvertDefaultLocale: { args: [FFIType.u32], returns: FFIType.u32 },
    ConvertFiberToThread: { args: [], returns: FFIType.i32 },
    ConvertSystemTimeToCalDateTime: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ConvertThreadToFiber: { args: [FFIType.ptr], returns: FFIType.u64 },
    ConvertThreadToFiberEx: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    CopyContext: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CopyFile2: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    CopyFileA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    CopyFileExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CopyFileExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CopyFileTransactedA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CopyFileTransactedW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CopyFileW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    CopyLZFile: { args: [FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    CreateActCtxA: { args: [FFIType.ptr], returns: FFIType.u64 },
    CreateActCtxW: { args: [FFIType.ptr], returns: FFIType.u64 },
    CreateBoundaryDescriptorA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    CreateBoundaryDescriptorW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    CreateConsoleScreenBuffer: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreateDirectory2A: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreateDirectory2W: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreateDirectoryA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateDirectoryExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateDirectoryExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateDirectoryTransactedA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    CreateDirectoryTransactedW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    CreateDirectoryW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateEnclave: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreateEventA: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.u64 },
    CreateEventExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    CreateEventExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    CreateEventW: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.u64 },
    CreateFiber: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CreateFiberEx: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CreateFile2: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreateFile3: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreateFileA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u64 },
    CreateFileMappingA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreateFileMappingFromApp: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.u64 },
    CreateFileMappingNumaA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    CreateFileMappingNumaW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    CreateFileMappingW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreateFileTransactedA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CreateFileTransactedW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CreateFileW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u64 },
    CreateHardLinkA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateHardLinkTransactedA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    CreateHardLinkTransactedW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    CreateHardLinkW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateIoCompletionPort: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    CreateJobObjectA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CreateJobObjectW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CreateJobSet: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CreateMailslotA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreateMailslotW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreateMemoryResourceNotification: { args: [FFIType.u32], returns: FFIType.u64 },
    CreateMutexA: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.u64 },
    CreateMutexExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    CreateMutexExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    CreateMutexW: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.u64 },
    CreateNamedPipeA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreateNamedPipeW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreatePackageVirtualizationContext: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    CreatePipe: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CreatePrivateNamespaceA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CreatePrivateNamespaceW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    CreateProcessA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateProcessW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreatePseudoConsole: { args: [FFIType.u32, FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    CreateRemoteThread: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreateRemoteThreadEx: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreateSemaphoreA: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.u64 },
    CreateSemaphoreExA: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    CreateSemaphoreExW: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    CreateSemaphoreW: { args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.ptr], returns: FFIType.u64 },
    CreateSymbolicLinkA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CreateSymbolicLinkTransactedA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CreateSymbolicLinkTransactedW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    CreateSymbolicLinkW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CreateTapePartition: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CreateThread: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    CreateThreadpool: { args: [FFIType.ptr], returns: FFIType.ptr },
    CreateThreadpoolCleanupGroup: { args: [], returns: FFIType.ptr },
    CreateThreadpoolIo: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    CreateThreadpoolTimer: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    CreateThreadpoolWait: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    CreateThreadpoolWork: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    CreateTimerQueue: { args: [], returns: FFIType.u64 },
    CreateTimerQueueTimer: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    CreateToolhelp32Snapshot: { args: [FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    CreateUmsCompletionList: { args: [FFIType.ptr], returns: FFIType.i32 },
    CreateUmsThreadContext: { args: [FFIType.ptr], returns: FFIType.i32 },
    CreateWaitableTimerA: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.u64 },
    CreateWaitableTimerExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    CreateWaitableTimerExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    CreateWaitableTimerW: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.u64 },
    DeactivateActCtx: { args: [FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    DeactivatePackageVirtualizationContext: { args: [FFIType.ptr], returns: FFIType.void },
    DebugActiveProcess: { args: [FFIType.u32], returns: FFIType.i32 },
    DebugActiveProcessStop: { args: [FFIType.u32], returns: FFIType.i32 },
    DebugBreak: { args: [], returns: FFIType.void },
    DebugBreakProcess: { args: [FFIType.u64], returns: FFIType.i32 },
    DebugSetProcessKillOnExit: { args: [FFIType.i32], returns: FFIType.i32 },
    DecodePointer: { args: [FFIType.ptr], returns: FFIType.ptr },
    DecodeSystemPointer: { args: [FFIType.ptr], returns: FFIType.ptr },
    DefineDosDeviceA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DefineDosDeviceW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DeleteAtom: { args: [FFIType.u16], returns: FFIType.u16 },
    DeleteBoundaryDescriptor: { args: [FFIType.u64], returns: FFIType.void },
    DeleteCriticalSection: { args: [FFIType.ptr], returns: FFIType.void },
    DeleteFiber: { args: [FFIType.u64], returns: FFIType.void },
    DeleteFile2A: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    DeleteFile2W: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    DeleteFileA: { args: [FFIType.ptr], returns: FFIType.i32 },
    DeleteFileTransactedA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DeleteFileTransactedW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DeleteFileW: { args: [FFIType.ptr], returns: FFIType.i32 },
    DeleteProcThreadAttributeList: { args: [FFIType.ptr], returns: FFIType.void },
    DeleteSynchronizationBarrier: { args: [FFIType.ptr], returns: FFIType.i32 },
    DeleteTimerQueue: { args: [FFIType.u64], returns: FFIType.i32 },
    DeleteTimerQueueEx: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    DeleteTimerQueueTimer: { args: [FFIType.u64, FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    DeleteUmsCompletionList: { args: [FFIType.ptr], returns: FFIType.i32 },
    DeleteUmsThreadContext: { args: [FFIType.ptr], returns: FFIType.i32 },
    DeleteVolumeMountPointA: { args: [FFIType.ptr], returns: FFIType.i32 },
    DeleteVolumeMountPointW: { args: [FFIType.ptr], returns: FFIType.i32 },
    DequeueUmsCompletionListItems: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    DeviceIoControl: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DisableThreadLibraryCalls: { args: [FFIType.u64], returns: FFIType.i32 },
    DisableThreadProfiling: { args: [FFIType.u64], returns: FFIType.u32 },
    DisassociateCurrentThreadFromCallback: { args: [FFIType.ptr], returns: FFIType.void },
    DiscardVirtualMemory: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    DisconnectNamedPipe: { args: [FFIType.u64], returns: FFIType.i32 },
    DnsHostnameToComputerNameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsHostnameToComputerNameExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DnsHostnameToComputerNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DosDateTimeToFileTime: { args: [FFIType.u16, FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    DuplicateConsoleHandle: { args: [FFIType.u64, FFIType.u32, FFIType.i32, FFIType.u32], returns: FFIType.u64 },
    DuplicateHandle: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    DuplicatePackageVirtualizationContext: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    EnableProcessOptionalXStateFeatures: { args: [FFIType.u64], returns: FFIType.i32 },
    EnableThreadProfiling: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    EncodePointer: { args: [FFIType.ptr], returns: FFIType.ptr },
    EncodeSystemPointer: { args: [FFIType.ptr], returns: FFIType.ptr },
    EndUpdateResourceA: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    EndUpdateResourceW: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    EnterCriticalSection: { args: [FFIType.ptr], returns: FFIType.void },
    EnterSynchronizationBarrier: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    EnterUmsSchedulingMode: { args: [FFIType.ptr], returns: FFIType.i32 },
    EnumCalendarInfoA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    EnumCalendarInfoExA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    EnumCalendarInfoExEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    EnumCalendarInfoExW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    EnumCalendarInfoW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    EnumDateFormatsA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    EnumDateFormatsExA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    EnumDateFormatsExEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    EnumDateFormatsExW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    EnumDateFormatsW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    EnumLanguageGroupLocalesA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    EnumLanguageGroupLocalesW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    EnumResourceLanguagesA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumResourceLanguagesExA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u16], returns: FFIType.i32 },
    EnumResourceLanguagesExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u16], returns: FFIType.i32 },
    EnumResourceLanguagesW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumResourceNamesA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumResourceNamesExA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u16], returns: FFIType.i32 },
    EnumResourceNamesExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u16], returns: FFIType.i32 },
    EnumResourceNamesW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumResourceTypesA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumResourceTypesExA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u16], returns: FFIType.i32 },
    EnumResourceTypesExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u16], returns: FFIType.i32 },
    EnumResourceTypesW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumSystemCodePagesA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    EnumSystemCodePagesW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    EnumSystemFirmwareTables: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    EnumSystemGeoID: { args: [FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    EnumSystemGeoNames: { args: [FFIType.u32, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    EnumSystemLanguageGroupsA: { args: [FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    EnumSystemLanguageGroupsW: { args: [FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    EnumSystemLocalesA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    EnumSystemLocalesEx: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    EnumSystemLocalesW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    EnumTimeFormatsA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    EnumTimeFormatsEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    EnumTimeFormatsW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    EnumUILanguagesA: { args: [FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    EnumUILanguagesW: { args: [FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    EraseTape: { args: [FFIType.u64, FFIType.u32, FFIType.i32], returns: FFIType.u32 },
    EscapeCommFunction: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    ExecuteUmsThread: { args: [FFIType.ptr], returns: FFIType.i32 },
    ExitProcess: { args: [FFIType.u32], returns: FFIType.void },
    ExitThread: { args: [FFIType.u32], returns: FFIType.void },
    ExpandEnvironmentStringsA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ExpandEnvironmentStringsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    ExpungeConsoleCommandHistoryA: { args: [FFIType.ptr], returns: FFIType.void },
    ExpungeConsoleCommandHistoryW: { args: [FFIType.ptr], returns: FFIType.void },
    FatalAppExitA: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    FatalAppExitW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    FatalExit: { args: [FFIType.i32], returns: FFIType.void },
    FileTimeToDosDateTime: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FileTimeToLocalFileTime: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FileTimeToSystemTime: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FillConsoleOutputAttribute: { args: [FFIType.u64, FFIType.u16, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    FillConsoleOutputCharacterA: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    FillConsoleOutputCharacterW: { args: [FFIType.u64, FFIType.u16, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    FindActCtxSectionGuid: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FindActCtxSectionStringA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FindActCtxSectionStringW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FindAtomA: { args: [FFIType.ptr], returns: FFIType.u16 },
    FindAtomW: { args: [FFIType.ptr], returns: FFIType.u16 },
    FindClose: { args: [FFIType.u64], returns: FFIType.i32 },
    FindCloseChangeNotification: { args: [FFIType.u64], returns: FFIType.i32 },
    FindFirstChangeNotificationA: { args: [FFIType.ptr, FFIType.i32, FFIType.u32], returns: FFIType.u64 },
    FindFirstChangeNotificationW: { args: [FFIType.ptr, FFIType.i32, FFIType.u32], returns: FFIType.u64 },
    FindFirstFileA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    FindFirstFileExA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    FindFirstFileExW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    FindFirstFileNameTransactedW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.u64 },
    FindFirstFileNameW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    FindFirstFileTransactedA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u64 },
    FindFirstFileTransactedW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u64 },
    FindFirstFileW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    FindFirstStreamTransactedW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u64 },
    FindFirstStreamW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    FindFirstVolumeA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    FindFirstVolumeMountPointA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    FindFirstVolumeMountPointW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    FindFirstVolumeW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    FindNextChangeNotification: { args: [FFIType.u64], returns: FFIType.i32 },
    FindNextFileA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    FindNextFileNameW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FindNextFileW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    FindNextStreamW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    FindNextVolumeA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    FindNextVolumeMountPointA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    FindNextVolumeMountPointW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    FindNextVolumeW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    FindNLSString: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    FindNLSStringEx: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    FindPackagesByPackageFamily: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FindResourceA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    FindResourceExA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u16], returns: FFIType.u64 },
    FindResourceExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u16], returns: FFIType.u64 },
    FindResourceW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    FindStringOrdinal: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    FindVolumeClose: { args: [FFIType.u64], returns: FFIType.i32 },
    FindVolumeMountPointClose: { args: [FFIType.u64], returns: FFIType.i32 },
    FlsAlloc: { args: [FFIType.ptr], returns: FFIType.u32 },
    FlsFree: { args: [FFIType.u32], returns: FFIType.i32 },
    FlsGetValue: { args: [FFIType.u32], returns: FFIType.ptr },
    FlsSetValue: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    FlushConsoleInputBuffer: { args: [FFIType.u64], returns: FFIType.i32 },
    FlushFileBuffers: { args: [FFIType.u64], returns: FFIType.i32 },
    FlushInstructionCache: { args: [FFIType.u64, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    FlushProcessWriteBuffers: { args: [], returns: FFIType.void },
    FlushViewOfFile: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    FoldStringA: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    FoldStringW: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    FormatApplicationUserModelId: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    FormatMessageA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    FormatMessageW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    FreeConsole: { args: [], returns: FFIType.i32 },
    FreeEnvironmentStringsA: { args: [FFIType.ptr], returns: FFIType.i32 },
    FreeEnvironmentStringsW: { args: [FFIType.ptr], returns: FFIType.i32 },
    FreeLibrary: { args: [FFIType.u64], returns: FFIType.i32 },
    FreeLibraryAndExitThread: { args: [FFIType.u64, FFIType.u32], returns: FFIType.void },
    FreeLibraryWhenCallbackReturns: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.void },
    FreeMemoryJobObject: { args: [FFIType.ptr], returns: FFIType.void },
    FreeResource: { args: [FFIType.u64], returns: FFIType.i32 },
    FreeUserPhysicalPages: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GenerateConsoleCtrlEvent: { args: [FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    GetACP: { args: [], returns: FFIType.u32 },
    GetActiveProcessorCount: { args: [FFIType.u16], returns: FFIType.u32 },
    GetActiveProcessorGroupCount: { args: [], returns: FFIType.u16 },
    GetAppContainerAce: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetAppContainerNamedObjectPath: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetApplicationRecoveryCallback: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetApplicationRestartSettings: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetApplicationUserModelId: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetAtomNameA: { args: [FFIType.u16, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    GetAtomNameW: { args: [FFIType.u16, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    GetBinaryTypeA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetBinaryTypeW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetCachedSigningLevel: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetCalendarDateFormatEx: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetCalendarInfoA: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetCalendarInfoEx: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetCalendarInfoW: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetCalendarSupportedDateRange: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetCommandLineA: { args: [], returns: FFIType.ptr },
    GetCommandLineW: { args: [], returns: FFIType.ptr },
    GetCommConfig: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetCommMask: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetCommModemStatus: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetCommProperties: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetCommState: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetCommTimeouts: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetCompressedFileSizeA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetCompressedFileSizeTransactedA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetCompressedFileSizeTransactedW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetCompressedFileSizeW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetComputerNameA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetComputerNameExA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetComputerNameExW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetComputerNameW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetConsoleAliasA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetConsoleAliasesA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetConsoleAliasesLengthA: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetConsoleAliasesLengthW: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetConsoleAliasesW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetConsoleAliasExesA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetConsoleAliasExesLengthA: { args: [], returns: FFIType.u32 },
    GetConsoleAliasExesLengthW: { args: [], returns: FFIType.u32 },
    GetConsoleAliasExesW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetConsoleAliasW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetConsoleCharType: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetConsoleCommandHistoryA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetConsoleCommandHistoryLengthA: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetConsoleCommandHistoryLengthW: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetConsoleCommandHistoryW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetConsoleCP: { args: [], returns: FFIType.u32 },
    GetConsoleCursorInfo: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetConsoleCursorMode: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetConsoleDisplayMode: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetConsoleFontInfo: { args: [FFIType.u64, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetConsoleFontSize: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    GetConsoleHardwareState: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetConsoleHistoryInfo: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetConsoleInputExeNameA: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetConsoleInputExeNameW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetConsoleInputWaitHandle: { args: [], returns: FFIType.u64 },
    GetConsoleMode: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetConsoleNlsMode: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetConsoleOriginalTitleA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetConsoleOriginalTitleW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetConsoleOutputCP: { args: [], returns: FFIType.u32 },
    GetConsoleProcessList: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetConsoleScreenBufferInfo: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetConsoleScreenBufferInfoEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetConsoleSelectionInfo: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetConsoleTitleA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetConsoleTitleW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetConsoleWindow: { args: [], returns: FFIType.u64 },
    GetCPInfo: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetCPInfoExA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetCPInfoExW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetCurrencyFormatA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetCurrencyFormatEx: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetCurrencyFormatW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetCurrentActCtx: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetCurrentApplicationUserModelId: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetCurrentConsoleFont: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetCurrentConsoleFontEx: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetCurrentDirectoryA: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetCurrentDirectoryW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetCurrentPackageFamilyName: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetCurrentPackageFullName: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetCurrentPackageId: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetCurrentPackageInfo: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    // GetCurrentPackageInfo3: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetCurrentPackagePath: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetCurrentPackageVirtualizationContext: { args: [], returns: FFIType.u32 },
    GetCurrentProcess: { args: [], returns: FFIType.u64 },
    GetCurrentProcessId: { args: [], returns: FFIType.u32 },
    GetCurrentProcessorNumber: { args: [], returns: FFIType.u32 },
    GetCurrentProcessorNumberEx: { args: [FFIType.ptr], returns: FFIType.void },
    GetCurrentThread: { args: [], returns: FFIType.u64 },
    GetCurrentThreadId: { args: [], returns: FFIType.u32 },
    GetCurrentThreadStackLimits: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    GetCurrentUmsThread: { args: [], returns: FFIType.ptr },
    GetDateFormatA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetDateFormatEx: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetDateFormatW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetDefaultCommConfigA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetDefaultCommConfigW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetDevicePowerState: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetDiskFreeSpaceA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetDiskFreeSpaceExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetDiskFreeSpaceExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetDiskFreeSpaceW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetDiskSpaceInformationA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetDiskSpaceInformationW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetDllDirectoryA: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetDllDirectoryW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetDriveTypeA: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetDriveTypeW: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetDurationFormat: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetDurationFormatEx: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetDynamicTimeZoneInformation: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetEnabledXStateFeatures: { args: [], returns: FFIType.u64 },
    GetEnvironmentStrings: { args: [], returns: FFIType.ptr },
    GetEnvironmentStringsW: { args: [], returns: FFIType.ptr },
    GetEnvironmentVariableA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetEnvironmentVariableW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetErrorMode: { args: [], returns: FFIType.u32 },
    GetExitCodeProcess: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetExitCodeThread: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetExpandedNameA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetExpandedNameW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetFileAttributesA: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetFileAttributesExA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetFileAttributesExW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetFileAttributesTransactedA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GetFileAttributesTransactedW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GetFileAttributesW: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetFileBandwidthReservation: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetFileInformationByHandle: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetFileInformationByHandleEx: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetFileInformationByName: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetFileMUIInfo: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetFileMUIPath: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetFileSize: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    GetFileSizeEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetFileTime: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetFileType: { args: [FFIType.u64], returns: FFIType.u32 },
    GetFinalPathNameByHandleA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    GetFinalPathNameByHandleW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    GetFirmwareEnvironmentVariableA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetFirmwareEnvironmentVariableExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetFirmwareEnvironmentVariableExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetFirmwareEnvironmentVariableW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetFirmwareType: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetFullPathNameA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetFullPathNameTransactedA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.u32 },
    GetFullPathNameTransactedW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.u32 },
    GetFullPathNameW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetGeoInfoA: { args: [FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.u16], returns: FFIType.i32 },
    GetGeoInfoEx: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetGeoInfoW: { args: [FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.u16], returns: FFIType.i32 },
    GetHandleInformation: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetLargePageMinimum: { args: [], returns: FFIType.u64 },
    GetLargestConsoleWindowSize: { args: [FFIType.u64], returns: FFIType.u32 },
    GetLastError: { args: [], returns: FFIType.u32 },
    GetLocaleInfoA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetLocaleInfoEx: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetLocaleInfoW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetLocalTime: { args: [FFIType.ptr], returns: FFIType.void },
    GetLogicalDrives: { args: [], returns: FFIType.u32 },
    GetLogicalDriveStringsA: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetLogicalDriveStringsW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetLogicalProcessorInformation: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetLogicalProcessorInformationEx: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetLongPathNameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetLongPathNameTransactedA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    GetLongPathNameTransactedW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    GetLongPathNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetMachineTypeAttributes: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.u32 },
    GetMailslotInfo: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetMaximumProcessorCount: { args: [FFIType.u16], returns: FFIType.u32 },
    GetMaximumProcessorGroupCount: { args: [], returns: FFIType.u16 },
    GetMemoryErrorHandlingCapabilities: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetModuleFileNameA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetModuleFileNameW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetModuleHandleA: { args: [FFIType.ptr], returns: FFIType.u64 },
    GetModuleHandleExA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetModuleHandleExW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetModuleHandleW: { args: [FFIType.ptr], returns: FFIType.u64 },
    GetNamedPipeClientComputerNameA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetNamedPipeClientComputerNameW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetNamedPipeClientProcessId: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetNamedPipeClientSessionId: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetNamedPipeHandleStateA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetNamedPipeHandleStateW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetNamedPipeInfo: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetNamedPipeServerProcessId: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetNamedPipeServerSessionId: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetNativeSystemInfo: { args: [FFIType.ptr], returns: FFIType.void },
    GetNextUmsListItem: { args: [FFIType.ptr], returns: FFIType.ptr },
    GetNLSVersion: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetNLSVersionEx: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetNumaAvailableMemoryNode: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetNumaAvailableMemoryNodeEx: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    GetNumaHighestNodeNumber: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetNumaNodeNumberFromHandle: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetNumaNodeProcessorMask: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetNumaNodeProcessorMask2: { args: [FFIType.u16, FFIType.ptr, FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    GetNumaNodeProcessorMaskEx: { args: [FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    GetNumaProcessorNode: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetNumaProcessorNodeEx: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetNumaProximityNode: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetNumaProximityNodeEx: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetNumberFormatA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetNumberFormatEx: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetNumberFormatW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetNumberOfConsoleFonts: { args: [], returns: FFIType.u32 },
    GetNumberOfConsoleInputEvents: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetNumberOfConsoleMouseButtons: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetOEMCP: { args: [], returns: FFIType.u32 },
    GetOverlappedResult: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetOverlappedResultEx: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    GetPackageApplicationIds: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetPackageFamilyName: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetPackageFullName: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetPackageId: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetPackageInfo: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetPackagePath: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetPackagePathByFullName: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetPackagesByPackageFamily: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetPhysicallyInstalledSystemMemory: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetPriorityClass: { args: [FFIType.u64], returns: FFIType.u32 },
    GetPrivateProfileIntA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    GetPrivateProfileIntW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.u32 },
    GetPrivateProfileSectionA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetPrivateProfileSectionNamesA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetPrivateProfileSectionNamesW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetPrivateProfileSectionW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetPrivateProfileStringA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetPrivateProfileStringW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetPrivateProfileStructA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetPrivateProfileStructW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetProcAddress: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    GetProcessAffinityMask: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetProcessDefaultCpuSetMasks: { args: [FFIType.ptr, FFIType.ptr, FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    GetProcessDefaultCpuSets: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetProcessDEPPolicy: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetProcessesInVirtualizationContext: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetProcessGroupAffinity: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetProcessHandleCount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetProcessHeap: { args: [], returns: FFIType.u64 },
    GetProcessHeaps: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetProcessId: { args: [FFIType.u64], returns: FFIType.u32 },
    GetProcessIdOfThread: { args: [FFIType.u64], returns: FFIType.u32 },
    GetProcessInformation: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetProcessIoCounters: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetProcessMitigationPolicy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    GetProcessorSystemCycleTime: { args: [FFIType.u16, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetProcessPreferredUILanguages: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetProcessPriorityBoost: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetProcessShutdownParameters: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetProcessTimes: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetProcessVersion: { args: [FFIType.u32], returns: FFIType.u32 },
    GetProcessWorkingSetSize: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetProcessWorkingSetSizeEx: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetProductInfo: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetProfileIntA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    GetProfileIntW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    GetProfileSectionA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetProfileSectionW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetProfileStringA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetProfileStringW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetQueuedCompletionStatus: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetQueuedCompletionStatusEx: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    GetShortPathNameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetShortPathNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetStagedPackagePathByFullName: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetStartupInfoA: { args: [FFIType.ptr], returns: FFIType.void },
    GetStartupInfoW: { args: [FFIType.ptr], returns: FFIType.void },
    GetStdHandle: { args: [FFIType.u32], returns: FFIType.u64 },
    GetStringScripts: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetStringTypeA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetStringTypeExA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetStringTypeExW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetStringTypeW: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    GetSystemCpuSetInformation: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetSystemDefaultLangID: { args: [], returns: FFIType.u16 },
    GetSystemDefaultLCID: { args: [], returns: FFIType.u32 },
    GetSystemDefaultLocaleName: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetSystemDefaultUILanguage: { args: [], returns: FFIType.u16 },
    GetSystemDEPPolicy: { args: [], returns: FFIType.u32 },
    GetSystemDirectoryA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetSystemDirectoryW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetSystemFileCacheSize: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetSystemFirmwareTable: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetSystemInfo: { args: [FFIType.ptr], returns: FFIType.void },
    // GetSystemLeapSecondInformation: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetSystemPowerStatus: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetSystemPreferredUILanguages: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetSystemRegistryQuota: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetSystemTime: { args: [FFIType.ptr], returns: FFIType.void },
    GetSystemTimeAdjustment: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetSystemTimeAsFileTime: { args: [FFIType.ptr], returns: FFIType.void },
    GetSystemTimePreciseAsFileTime: { args: [FFIType.ptr], returns: FFIType.void },
    GetSystemTimes: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetSystemWindowsDirectoryA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetSystemWindowsDirectoryW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetSystemWow64DirectoryA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetSystemWow64DirectoryW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetTapeParameters: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetTapePosition: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetTapeStatus: { args: [FFIType.u64], returns: FFIType.u32 },
    GetTempFileNameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetTempFileNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetTempPath2A: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetTempPath2W: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetTempPathA: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetTempPathW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetThreadContext: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetThreadDescription: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    GetThreadEnabledXStateFeatures: { args: [], returns: FFIType.u64 },
    GetThreadErrorMode: { args: [], returns: FFIType.u32 },
    GetThreadGroupAffinity: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetThreadId: { args: [FFIType.u64], returns: FFIType.u32 },
    GetThreadIdealProcessorEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetThreadInformation: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetThreadIOPendingFlag: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetThreadLocale: { args: [], returns: FFIType.u32 },
    GetThreadPreferredUILanguages: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetThreadPriority: { args: [FFIType.u64], returns: FFIType.i32 },
    GetThreadPriorityBoost: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetThreadSelectedCpuSetMasks: { args: [FFIType.u64, FFIType.ptr, FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    GetThreadSelectedCpuSets: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetThreadSelectorEntry: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetThreadTimes: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetThreadUILanguage: { args: [], returns: FFIType.u16 },
    GetTickCount: { args: [], returns: FFIType.u32 },
    GetTickCount64: { args: [], returns: FFIType.u64 },
    GetTimeFormatA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetTimeFormatEx: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetTimeFormatW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetTimeZoneInformation: { args: [FFIType.ptr], returns: FFIType.u32 },
    GetTimeZoneInformationForYear: { args: [FFIType.u16, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetUILanguageInfo: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetUmsCompletionListEvent: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetUmsSystemThreadInformation: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetUserDefaultGeoName: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetUserDefaultLangID: { args: [], returns: FFIType.u16 },
    GetUserDefaultLCID: { args: [], returns: FFIType.u32 },
    GetUserDefaultLocaleName: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    GetUserDefaultUILanguage: { args: [], returns: FFIType.u16 },
    GetUserGeoID: { args: [FFIType.u32], returns: FFIType.i32 },
    GetUserPreferredUILanguages: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetVersion: { args: [], returns: FFIType.u32 },
    GetVersionExA: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetVersionExW: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetVolumeInformationA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetVolumeInformationByHandleW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetVolumeInformationW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetVolumeNameForVolumeMountPointA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetVolumeNameForVolumeMountPointW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetVolumePathNameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetVolumePathNamesForVolumeNameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetVolumePathNamesForVolumeNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetVolumePathNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetWindowsDirectoryA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetWindowsDirectoryW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetWriteWatch: { args: [FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetXStateFeaturesMask: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GlobalAddAtomA: { args: [FFIType.ptr], returns: FFIType.u16 },
    GlobalAddAtomExA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u16 },
    GlobalAddAtomExW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u16 },
    GlobalAddAtomW: { args: [FFIType.ptr], returns: FFIType.u16 },
    GlobalAlloc: { args: [FFIType.u32, FFIType.u64], returns: FFIType.u64 },
    GlobalCompact: { args: [FFIType.u32], returns: FFIType.ptr },
    GlobalDeleteAtom: { args: [FFIType.u16], returns: FFIType.u16 },
    GlobalFindAtomA: { args: [FFIType.ptr], returns: FFIType.u16 },
    GlobalFindAtomW: { args: [FFIType.ptr], returns: FFIType.u16 },
    GlobalFix: { args: [FFIType.u64], returns: FFIType.void },
    GlobalFlags: { args: [FFIType.u64], returns: FFIType.u32 },
    GlobalFree: { args: [FFIType.u64], returns: FFIType.u64 },
    GlobalGetAtomNameA: { args: [FFIType.u16, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    GlobalGetAtomNameW: { args: [FFIType.u16, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    GlobalHandle: { args: [FFIType.ptr], returns: FFIType.u64 },
    GlobalLock: { args: [FFIType.u64], returns: FFIType.ptr },
    GlobalMemoryStatus: { args: [FFIType.ptr], returns: FFIType.void },
    GlobalMemoryStatusEx: { args: [FFIType.ptr], returns: FFIType.i32 },
    GlobalReAlloc: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    GlobalSize: { args: [FFIType.u64], returns: FFIType.u64 },
    GlobalUnfix: { args: [FFIType.u64], returns: FFIType.void },
    GlobalUnlock: { args: [FFIType.u64], returns: FFIType.i32 },
    GlobalUnWire: { args: [FFIType.u64], returns: FFIType.i32 },
    GlobalWire: { args: [FFIType.u64], returns: FFIType.ptr },
    Heap32First: { args: [FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    Heap32ListFirst: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    Heap32ListNext: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    Heap32Next: { args: [FFIType.ptr], returns: FFIType.i32 },
    HeapAlloc: { args: [FFIType.u64, FFIType.u32, FFIType.u64], returns: FFIType.ptr },
    HeapCompact: { args: [FFIType.u64, FFIType.u32], returns: FFIType.ptr },
    HeapCreate: { args: [FFIType.u32, FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    HeapDestroy: { args: [FFIType.u64], returns: FFIType.i32 },
    HeapFree: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    HeapLock: { args: [FFIType.u64], returns: FFIType.i32 },
    HeapQueryInformation: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    HeapReAlloc: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u64], returns: FFIType.ptr },
    HeapSetInformation: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    HeapSize: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    HeapSummary: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    HeapUnlock: { args: [FFIType.u64], returns: FFIType.i32 },
    HeapValidate: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    HeapWalk: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IdnToNameprepUnicode: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    InitAtomTable: { args: [FFIType.u32], returns: FFIType.i32 },
    InitializeConditionVariable: { args: [FFIType.ptr], returns: FFIType.void },
    InitializeContext: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InitializeContext2: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    InitializeCriticalSection: { args: [FFIType.ptr], returns: FFIType.void },
    InitializeCriticalSectionAndSpinCount: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InitializeCriticalSectionEx: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    InitializeEnclave: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitializeProcThreadAttributeList: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitializeSListHead: { args: [FFIType.ptr], returns: FFIType.void },
    InitializeSRWLock: { args: [FFIType.ptr], returns: FFIType.void },
    InitializeSynchronizationBarrier: { args: [FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    InitOnceBeginInitialize: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InitOnceComplete: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InitOnceExecuteOnce: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InitOnceInitialize: { args: [FFIType.ptr], returns: FFIType.void },
    InstallELAMCertificateInfo: { args: [FFIType.ptr], returns: FFIType.i32 },
    InterlockedFlushSList: { args: [FFIType.ptr], returns: FFIType.ptr },
    InterlockedPopEntrySList: { args: [FFIType.ptr], returns: FFIType.ptr },
    InterlockedPushEntrySList: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    InterlockedPushListSListEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.ptr },
    InvalidateConsoleDIBits: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IsBadCodePtr: { args: [FFIType.ptr], returns: FFIType.i32 },
    IsBadHugeReadPtr: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IsBadHugeWritePtr: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IsBadReadPtr: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IsBadStringPtrA: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    IsBadStringPtrW: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    IsBadWritePtr: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IsCalendarLeapYear: { args: [FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    IsDBCSLeadByte: { args: [FFIType.u8], returns: FFIType.i32 },
    IsDBCSLeadByteEx: { args: [FFIType.u32, FFIType.u8], returns: FFIType.i32 },
    IsDebuggerPresent: { args: [], returns: FFIType.i32 },
    IsEnclaveTypeSupported: { args: [FFIType.u32], returns: FFIType.i32 },
    IsNativeVhdBoot: { args: [FFIType.ptr], returns: FFIType.i32 },
    IsNLSDefinedString: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    IsNormalizedString: { args: [FFIType.u32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    IsProcessCritical: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IsProcessInJob: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IsProcessorFeaturePresent: { args: [FFIType.u32], returns: FFIType.i32 },
    IsSystemResumeAutomatic: { args: [], returns: FFIType.i32 },
    IsThreadAFiber: { args: [], returns: FFIType.i32 },
    IsThreadpoolTimerSet: { args: [FFIType.ptr], returns: FFIType.i32 },
    IsUserCetAvailableInEnvironment: { args: [FFIType.u32], returns: FFIType.i32 },
    IsValidCodePage: { args: [FFIType.u32], returns: FFIType.i32 },
    IsValidLanguageGroup: { args: [FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    IsValidLocale: { args: [FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    IsValidLocaleName: { args: [FFIType.ptr], returns: FFIType.i32 },
    IsValidNLSVersion: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    IsWow64GuestMachineSupported: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    IsWow64Process: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IsWow64Process2: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    K32EmptyWorkingSet: { args: [FFIType.u64], returns: FFIType.i32 },
    K32EnumDeviceDrivers: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    K32EnumPageFilesA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    K32EnumPageFilesW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    K32EnumProcesses: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    K32EnumProcessModules: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    K32EnumProcessModulesEx: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    K32GetDeviceDriverBaseNameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    K32GetDeviceDriverBaseNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    K32GetDeviceDriverFileNameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    K32GetDeviceDriverFileNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    K32GetMappedFileNameA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    K32GetMappedFileNameW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    K32GetModuleBaseNameA: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    K32GetModuleBaseNameW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    K32GetModuleFileNameExA: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    K32GetModuleFileNameExW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    K32GetModuleInformation: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    K32GetPerformanceInfo: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    K32GetProcessImageFileNameA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    K32GetProcessImageFileNameW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    K32GetProcessMemoryInfo: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    K32GetWsChanges: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    K32GetWsChangesEx: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    K32InitializeProcessForWsWatch: { args: [FFIType.u64], returns: FFIType.i32 },
    K32QueryWorkingSet: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    K32QueryWorkingSetEx: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    LCIDToLocaleName: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    LCMapStringA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    LCMapStringEx: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    LCMapStringW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    LeaveCriticalSection: { args: [FFIType.ptr], returns: FFIType.void },
    LeaveCriticalSectionWhenCallbackReturns: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    LoadEnclaveData: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LoadLibraryA: { args: [FFIType.ptr], returns: FFIType.u64 },
    LoadLibraryExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    LoadLibraryExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    LoadLibraryW: { args: [FFIType.ptr], returns: FFIType.u64 },
    LoadModule: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    LoadPackagedLibrary: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    LoadResource: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    LocalAlloc: { args: [FFIType.u32, FFIType.u64], returns: FFIType.u64 },
    LocalCompact: { args: [FFIType.u32], returns: FFIType.ptr },
    LocaleNameToLCID: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    LocalFileTimeToFileTime: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LocalFileTimeToLocalSystemTime: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LocalFlags: { args: [FFIType.u64], returns: FFIType.u32 },
    LocalFree: { args: [FFIType.u64], returns: FFIType.u64 },
    LocalHandle: { args: [FFIType.ptr], returns: FFIType.u64 },
    LocalLock: { args: [FFIType.u64], returns: FFIType.ptr },
    LocalReAlloc: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    LocalShrink: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    LocalSize: { args: [FFIType.u64], returns: FFIType.u64 },
    LocalSystemTimeToLocalFileTime: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    LocalUnlock: { args: [FFIType.u64], returns: FFIType.i32 },
    LocateXStateFeature: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.ptr },
    LockFile: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    LockFileEx: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    LockResource: { args: [FFIType.u64], returns: FFIType.ptr },
    LZClose: { args: [FFIType.i32], returns: FFIType.void },
    LZCopy: { args: [FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    LZDone: { args: [], returns: FFIType.void },
    LZInit: { args: [FFIType.i32], returns: FFIType.i32 },
    LZOpenFileA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    LZOpenFileW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    LZRead: { args: [FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    LZSeek: { args: [FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    LZStart: { args: [], returns: FFIType.i32 },
    MapUserPhysicalPages: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    MapUserPhysicalPagesScatter: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    MapViewOfFile: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u64 },
    MapViewOfFileEx: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    MapViewOfFileExNuma: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    MapViewOfFileFromApp: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    Module32First: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    Module32FirstW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    Module32Next: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    Module32NextW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    MoveFileA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MoveFileExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    MoveFileExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    MoveFileTransactedA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MoveFileTransactedW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    MoveFileW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    MoveFileWithProgressA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    MoveFileWithProgressW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    MulDiv: { args: [FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    MultiByteToWideChar: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    NeedCurrentDirectoryForExePathA: { args: [FFIType.ptr], returns: FFIType.i32 },
    NeedCurrentDirectoryForExePathW: { args: [FFIType.ptr], returns: FFIType.i32 },
    NormalizeString: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    NotifyUILanguageChange: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    OfferVirtualMemory: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    OOBEComplete: { args: [FFIType.ptr], returns: FFIType.i32 },
    OpenConsoleW: { args: [FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.u32], returns: FFIType.u64 },
    OpenEventA: { args: [FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.u64 },
    OpenEventW: { args: [FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.u64 },
    OpenFile: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    OpenFileById: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    OpenFileMappingA: { args: [FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.u64 },
    OpenFileMappingW: { args: [FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.u64 },
    OpenJobObjectA: { args: [FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.u64 },
    OpenJobObjectW: { args: [FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.u64 },
    OpenMutexA: { args: [FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.u64 },
    OpenMutexW: { args: [FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.u64 },
    OpenPackageInfoByFullName: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    OpenPrivateNamespaceA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    OpenPrivateNamespaceW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    OpenProcess: { args: [FFIType.u32, FFIType.i32, FFIType.u32], returns: FFIType.u64 },
    OpenSemaphoreA: { args: [FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.u64 },
    OpenSemaphoreW: { args: [FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.u64 },
    OpenThread: { args: [FFIType.u32, FFIType.i32, FFIType.u32], returns: FFIType.u64 },
    OpenWaitableTimerA: { args: [FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.u64 },
    OpenWaitableTimerW: { args: [FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.u64 },
    OutputDebugStringA: { args: [FFIType.ptr], returns: FFIType.void },
    OutputDebugStringW: { args: [FFIType.ptr], returns: FFIType.void },
    PackageFamilyNameFromFullName: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PackageFamilyNameFromId: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PackageFullNameFromId: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PackageIdFromFullName: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PackageNameAndPublisherIdFromFamilyName: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ParseApplicationUserModelId: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PeekConsoleInputA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PeekConsoleInputW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PeekNamedPipe: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PostQueuedCompletionStatus: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PowerClearRequest: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    PowerCreateRequest: { args: [FFIType.ptr], returns: FFIType.u64 },
    PowerSetRequest: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    PrefetchVirtualMemory: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PrepareTape: { args: [FFIType.u64, FFIType.u32, FFIType.i32], returns: FFIType.u32 },
    Process32First: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    Process32FirstW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    Process32Next: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    Process32NextW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ProcessIdToSessionId: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    PssCaptureSnapshot: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    PssDuplicateSnapshot: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PssFreeSnapshot: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    PssQuerySnapshot: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PssWalkMarkerCreate: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    PssWalkMarkerFree: { args: [FFIType.u64], returns: FFIType.u32 },
    PssWalkMarkerGetPosition: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    PssWalkMarkerSeekToBeginning: { args: [FFIType.u64], returns: FFIType.u32 },
    PssWalkMarkerSetPosition: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    PssWalkSnapshot: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PulseEvent: { args: [FFIType.u64], returns: FFIType.i32 },
    PurgeComm: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    QueryActCtxSettingsW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    QueryActCtxW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    QueryDepthSList: { args: [FFIType.ptr], returns: FFIType.u16 },
    QueryDosDeviceA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    QueryDosDeviceW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    QueryFullProcessImageNameA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    QueryFullProcessImageNameW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    QueryIdleProcessorCycleTime: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    QueryIdleProcessorCycleTimeEx: { args: [FFIType.u16, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    QueryInformationJobObject: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    QueryIoRateControlInformationJobObject: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    QueryMemoryResourceNotification: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    QueryPerformanceCounter: { args: [FFIType.ptr], returns: FFIType.i32 },
    QueryPerformanceFrequency: { args: [FFIType.ptr], returns: FFIType.i32 },
    QueryProcessAffinityUpdateMode: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    QueryProcessCycleTime: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    QueryProtectedPolicy: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    QueryThreadCycleTime: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    QueryThreadpoolStackInformation: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    QueryThreadProfiling: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    QueryUmsThreadInformation: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    QueryUnbiasedInterruptTime: { args: [FFIType.ptr], returns: FFIType.i32 },
    QueueUserAPC: { args: [FFIType.ptr, FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    QueueUserAPC2: { args: [FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    QueueUserWorkItem: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RaiseException: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.void },
    RaiseFailFastException: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.void },
    ReadConsoleA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReadConsoleInputA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ReadConsoleInputExA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u16], returns: FFIType.i32 },
    ReadConsoleInputExW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u16], returns: FFIType.i32 },
    ReadConsoleInputW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ReadConsoleOutputA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ReadConsoleOutputAttribute: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ReadConsoleOutputCharacterA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ReadConsoleOutputCharacterW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ReadConsoleOutputW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ReadConsoleW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReadDirectoryChangesExW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    ReadDirectoryChangesW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReadFile: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReadFileEx: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReadFileScatter: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReadProcessMemory: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ReadThreadProfilingData: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    ReclaimVirtualMemory: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    RegisterApplicationRecoveryCallback: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    RegisterApplicationRestart: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    RegisterBadMemoryNotification: { args: [FFIType.ptr], returns: FFIType.u64 },
    RegisterConsoleIME: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RegisterConsoleOS2: { args: [FFIType.i32], returns: FFIType.i32 },
    RegisterConsoleVDM: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RegisterWaitForSingleObject: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    RegisterWaitUntilOOBECompleted: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReleaseActCtx: { args: [FFIType.u64], returns: FFIType.void },
    ReleaseMutex: { args: [FFIType.u64], returns: FFIType.i32 },
    ReleaseMutexWhenCallbackReturns: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.void },
    ReleasePackageVirtualizationContext: { args: [FFIType.u64], returns: FFIType.void },
    ReleasePseudoConsole: { args: [FFIType.u64], returns: FFIType.u32 },
    ReleaseSemaphore: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    ReleaseSemaphoreWhenCallbackReturns: { args: [FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.void },
    ReleaseSRWLockExclusive: { args: [FFIType.ptr], returns: FFIType.void },
    ReleaseSRWLockShared: { args: [FFIType.ptr], returns: FFIType.void },
    RemoveDirectory2A: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RemoveDirectory2W: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RemoveDirectoryA: { args: [FFIType.ptr], returns: FFIType.i32 },
    RemoveDirectoryTransactedA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RemoveDirectoryTransactedW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RemoveDirectoryW: { args: [FFIType.ptr], returns: FFIType.i32 },
    RemoveDllDirectory: { args: [FFIType.ptr], returns: FFIType.i32 },
    RemoveSecureMemoryCacheCallback: { args: [FFIType.ptr], returns: FFIType.i32 },
    RemoveVectoredContinueHandler: { args: [FFIType.ptr], returns: FFIType.u32 },
    RemoveVectoredExceptionHandler: { args: [FFIType.ptr], returns: FFIType.u32 },
    ReOpenFile: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    ReplaceFileA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReplaceFileW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReplacePartitionUnit: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RequestDeviceWakeup: { args: [FFIType.u64], returns: FFIType.i32 },
    RequestWakeupLatency: { args: [FFIType.u32], returns: FFIType.i32 },
    ResetEvent: { args: [FFIType.u64], returns: FFIType.i32 },
    ResetWriteWatch: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    ResizePseudoConsole: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    ResolveLocaleName: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    // RestoreThreadPreferredUILanguages: { args: [FFIType.u32], returns: FFIType.void },
    ResumeThread: { args: [FFIType.u64], returns: FFIType.u32 },
    RtlAddFunctionTable: { args: [FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    RtlCaptureContext: { args: [FFIType.ptr], returns: FFIType.void },
    // RtlCaptureContext2: { args: [FFIType.ptr], returns: FFIType.void },
    RtlCaptureStackBackTrace: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u16 },
    RtlCompareMemory: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    RtlDeleteFunctionTable: { args: [FFIType.ptr], returns: FFIType.u32 },
    RtlInstallFunctionTableCallback: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RtlLookupFunctionEntry: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    RtlPcToFileHeader: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    RtlRaiseException: { args: [FFIType.ptr], returns: FFIType.void },
    RtlRestoreContext: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    RtlUnwind: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    RtlUnwindEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    RtlVirtualUnwind: { args: [FFIType.u32, FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    ScrollConsoleScreenBufferA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ScrollConsoleScreenBufferW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SearchPathA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SearchPathW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    SetCachedSigningLevel: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetCalendarInfoA: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetCalendarInfoW: { args: [FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetCommBreak: { args: [FFIType.u64], returns: FFIType.i32 },
    SetCommConfig: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetCommMask: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SetCommState: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetCommTimeouts: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetComputerNameA: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetComputerNameEx2W: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetComputerNameExA: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetComputerNameExW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetComputerNameW: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetConsoleActiveScreenBuffer: { args: [FFIType.u64], returns: FFIType.i32 },
    SetConsoleCP: { args: [FFIType.u32], returns: FFIType.i32 },
    SetConsoleCtrlHandler: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SetConsoleCursor: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SetConsoleCursorInfo: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetConsoleCursorMode: { args: [FFIType.u64, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    SetConsoleCursorPosition: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SetConsoleDisplayMode: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetConsoleFont: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SetConsoleHardwareState: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetConsoleHistoryInfo: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetConsoleIcon: { args: [FFIType.u64], returns: FFIType.i32 },
    SetConsoleInputExeNameA: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetConsoleInputExeNameW: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetConsoleKeyShortcuts: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetConsoleLocalEUDC: { args: [FFIType.ptr, FFIType.u16, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetConsoleMenuClose: { args: [FFIType.i32], returns: FFIType.i32 },
    SetConsoleMode: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SetConsoleNlsMode: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SetConsoleNumberOfCommandsA: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetConsoleNumberOfCommandsW: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetConsoleOS2OemFormat: { args: [FFIType.i32], returns: FFIType.i32 },
    SetConsoleOutputCP: { args: [FFIType.u32], returns: FFIType.i32 },
    SetConsolePalette: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetConsoleScreenBufferInfoEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetConsoleScreenBufferSize: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SetConsoleTextAttribute: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SetConsoleTitleA: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetConsoleTitleW: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetConsoleWindowInfo: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    SetCriticalSectionSpinCount: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    SetCurrentConsoleFontEx: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    SetCurrentDirectoryA: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetCurrentDirectoryW: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetDefaultCommConfigA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetDefaultCommConfigW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetDefaultDllDirectories: { args: [FFIType.u32], returns: FFIType.i32 },
    SetDllDirectoryA: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetDllDirectoryW: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetDynamicTimeZoneInformation: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetEndOfFile: { args: [FFIType.u64], returns: FFIType.i32 },
    SetEnvironmentStringsA: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetEnvironmentStringsW: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetEnvironmentVariableA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetEnvironmentVariableW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetErrorMode: { args: [FFIType.u32], returns: FFIType.u32 },
    SetEvent: { args: [FFIType.u64], returns: FFIType.i32 },
    SetEventWhenCallbackReturns: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.void },
    SetFileApisToANSI: { args: [], returns: FFIType.void },
    SetFileApisToOEM: { args: [], returns: FFIType.void },
    SetFileAttributesA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetFileAttributesTransactedA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetFileAttributesTransactedW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetFileAttributesW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetFileBandwidthReservation: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetFileCompletionNotificationModes: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetFileInformationByHandle: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetFileIoOverlappedRange: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetFilePointer: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    SetFilePointerEx: { args: [FFIType.u64, FFIType.i64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetFileShortNameA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetFileShortNameW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetFileTime: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetFileValidData: { args: [FFIType.u64, FFIType.i64], returns: FFIType.i32 },
    SetFirmwareEnvironmentVariableA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetFirmwareEnvironmentVariableExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetFirmwareEnvironmentVariableExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetFirmwareEnvironmentVariableW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetHandleCount: { args: [FFIType.u32], returns: FFIType.u32 },
    SetHandleInformation: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetInformationJobObject: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetIoRateControlInformationJobObject: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    SetLastConsoleEventActive: { args: [], returns: FFIType.void },
    SetLastError: { args: [FFIType.u32], returns: FFIType.void },
    SetLocaleInfoA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetLocaleInfoW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetLocalTime: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetMailslotInfo: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SetMessageWaitingIndicator: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SetNamedPipeHandleState: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetPriorityClass: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SetProcessAffinityMask: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetProcessAffinityUpdateMode: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SetProcessDefaultCpuSetMasks: { args: [FFIType.u64, FFIType.ptr, FFIType.u16], returns: FFIType.i32 },
    SetProcessDefaultCpuSets: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetProcessDEPPolicy: { args: [FFIType.u32], returns: FFIType.i32 },
    SetProcessDynamicEHContinuationTargets: { args: [FFIType.u64, FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    SetProcessDynamicEnforcedCetCompatibleRanges: { args: [FFIType.u64, FFIType.u16, FFIType.ptr], returns: FFIType.i32 },
    SetProcessInformation: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetProcessMitigationPolicy: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetProcessPreferredUILanguages: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetProcessPriorityBoost: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    SetProcessShutdownParameters: { args: [FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetProcessWorkingSetSize: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetProcessWorkingSetSizeEx: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetProtectedPolicy: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetSearchPathMode: { args: [FFIType.u32], returns: FFIType.i32 },
    SetStdHandle: { args: [FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    SetStdHandleEx: { args: [FFIType.u32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetSystemFileCacheSize: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetSystemPowerState: { args: [FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    SetSystemTime: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetSystemTimeAdjustment: { args: [FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    SetTapeParameters: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    SetTapePosition: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.i32], returns: FFIType.u32 },
    SetThreadAffinityMask: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    SetThreadContext: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SetThreadDescription: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    SetThreadErrorMode: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetThreadExecutionState: { args: [FFIType.u32], returns: FFIType.u32 },
    SetThreadGroupAffinity: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetThreadIdealProcessor: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    SetThreadIdealProcessorEx: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetThreadInformation: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetThreadLocale: { args: [FFIType.u32], returns: FFIType.i32 },
    SetThreadpoolStackInformation: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetThreadpoolThreadMaximum: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.void },
    SetThreadpoolThreadMinimum: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetThreadpoolTimer: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.void },
    SetThreadpoolTimerEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetThreadpoolWait: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.void },
    SetThreadpoolWaitEx: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetThreadPreferredUILanguages: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    // SetThreadPreferredUILanguages2: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetThreadPriority: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    SetThreadPriorityBoost: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    SetThreadSelectedCpuSetMasks: { args: [FFIType.u64, FFIType.ptr, FFIType.u16], returns: FFIType.i32 },
    SetThreadSelectedCpuSets: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetThreadStackGuarantee: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetThreadUILanguage: { args: [FFIType.u16], returns: FFIType.u16 },
    SetTimerQueueTimer: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.i32], returns: FFIType.u64 },
    SetTimeZoneInformation: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetUmsThreadInformation: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetUnhandledExceptionFilter: { args: [FFIType.ptr], returns: FFIType.ptr },
    SetupComm: { args: [FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SetUserGeoID: { args: [FFIType.i32], returns: FFIType.i32 },
    SetUserGeoName: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetVolumeLabelA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetVolumeLabelW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetVolumeMountPointA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetVolumeMountPointW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetWaitableTimer: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SetWaitableTimerEx: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetXStateFeaturesMask: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    ShowConsoleCursor: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    SignalObjectAndWait: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.i32], returns: FFIType.u32 },
    SizeofResource: { args: [FFIType.u64, FFIType.u64], returns: FFIType.u32 },
    Sleep: { args: [FFIType.u32], returns: FFIType.void },
    SleepConditionVariableCS: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SleepConditionVariableSRW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SleepEx: { args: [FFIType.u32, FFIType.i32], returns: FFIType.u32 },
    StartThreadpoolIo: { args: [FFIType.ptr], returns: FFIType.void },
    SubmitThreadpoolWork: { args: [FFIType.ptr], returns: FFIType.void },
    SuspendThread: { args: [FFIType.u64], returns: FFIType.u32 },
    SwitchToFiber: { args: [FFIType.u64], returns: FFIType.void },
    SwitchToThread: { args: [], returns: FFIType.i32 },
    SystemTimeToFileTime: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SystemTimeToTzSpecificLocalTime: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SystemTimeToTzSpecificLocalTimeEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    TerminateJobObject: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    TerminateProcess: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    TerminateThread: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    Thread32First: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    Thread32Next: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    TlsAlloc: { args: [], returns: FFIType.u32 },
    TlsFree: { args: [FFIType.u32], returns: FFIType.i32 },
    TlsGetValue: { args: [FFIType.u32], returns: FFIType.ptr },
    TlsGetValue2: { args: [FFIType.u32], returns: FFIType.ptr },
    TlsSetValue: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    Toolhelp32ReadProcessMemory: { args: [FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    TransactNamedPipe: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    TransmitCommChar: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    TryAcquireSRWLockExclusive: { args: [FFIType.ptr], returns: FFIType.u32 },
    TryAcquireSRWLockShared: { args: [FFIType.ptr], returns: FFIType.u32 },
    TryEnterCriticalSection: { args: [FFIType.ptr], returns: FFIType.i32 },
    TrySubmitThreadpoolCallback: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    TzSpecificLocalTimeToSystemTime: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    TzSpecificLocalTimeToSystemTimeEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UmsThreadYield: { args: [FFIType.ptr], returns: FFIType.i32 },
    UnhandledExceptionFilter: { args: [FFIType.ptr], returns: FFIType.i32 },
    UnlockFile: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    UnlockFileEx: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    UnmapViewOfFile: { args: [FFIType.u64], returns: FFIType.i32 },
    UnmapViewOfFileEx: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    UnregisterApplicationRecoveryCallback: { args: [], returns: FFIType.u32 },
    UnregisterApplicationRestart: { args: [], returns: FFIType.u32 },
    UnregisterBadMemoryNotification: { args: [FFIType.ptr], returns: FFIType.i32 },
    UnregisterConsoleIME: { args: [], returns: FFIType.i32 },
    UnregisterWait: { args: [FFIType.u64], returns: FFIType.i32 },
    UnregisterWaitEx: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    UnregisterWaitUntilOOBECompleted: { args: [FFIType.ptr], returns: FFIType.i32 },
    UpdateCalendarDayOfWeek: { args: [FFIType.ptr], returns: FFIType.i32 },
    UpdateProcThreadAttribute: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UpdateResourceA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u16, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UpdateResourceW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u16, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    VDMConsoleOperation: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VerifyConsoleIoHandle: { args: [FFIType.u64], returns: FFIType.i32 },
    VerifyScripts: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    VerifyVersionInfoA: { args: [FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    VerifyVersionInfoW: { args: [FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    VerLanguageNameA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    VerLanguageNameW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    VerSetConditionMask: { args: [FFIType.u64, FFIType.u32, FFIType.u8], returns: FFIType.u64 },
    VirtualAlloc: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    VirtualAllocEx: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    VirtualAllocExNuma: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    VirtualFree: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    VirtualFreeEx: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    VirtualLock: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    VirtualProtect: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VirtualProtectEx: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VirtualQuery: { args: [FFIType.u64, FFIType.ptr, FFIType.u64], returns: FFIType.u64 },
    VirtualQueryEx: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64], returns: FFIType.u64 },
    VirtualUnlock: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    WaitCommEvent: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WaitForDebugEvent: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WaitForDebugEventEx: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WaitForMultipleObjects: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.u32], returns: FFIType.u32 },
    WaitForMultipleObjectsEx: { args: [FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.i32], returns: FFIType.u32 },
    WaitForSingleObject: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    WaitForSingleObjectEx: { args: [FFIType.u64, FFIType.u32, FFIType.i32], returns: FFIType.u32 },
    WaitForThreadpoolIoCallbacks: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.void },
    WaitForThreadpoolTimerCallbacks: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.void },
    WaitForThreadpoolWaitCallbacks: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.void },
    WaitForThreadpoolWorkCallbacks: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.void },
    WaitNamedPipeA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WaitNamedPipeW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WakeAllConditionVariable: { args: [FFIType.ptr], returns: FFIType.void },
    WakeConditionVariable: { args: [FFIType.ptr], returns: FFIType.void },
    WerGetFlags: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    WerRegisterAdditionalProcess: { args: [FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    WerRegisterAppLocalDump: { args: [FFIType.ptr], returns: FFIType.u32 },
    WerRegisterCustomMetadata: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WerRegisterExcludedMemoryBlock: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    WerRegisterFile: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    WerRegisterMemoryBlock: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    WerRegisterRuntimeExceptionModule: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WerSetFlags: { args: [FFIType.u32], returns: FFIType.u32 },
    WerUnregisterAdditionalProcess: { args: [FFIType.u32], returns: FFIType.u32 },
    WerUnregisterAppLocalDump: { args: [], returns: FFIType.u32 },
    WerUnregisterCustomMetadata: { args: [FFIType.ptr], returns: FFIType.u32 },
    WerUnregisterExcludedMemoryBlock: { args: [FFIType.ptr], returns: FFIType.u32 },
    WerUnregisterFile: { args: [FFIType.ptr], returns: FFIType.u32 },
    WerUnregisterMemoryBlock: { args: [FFIType.ptr], returns: FFIType.u32 },
    WerUnregisterRuntimeExceptionModule: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    WideCharToMultiByte: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WinExec: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    Wow64DisableWow64FsRedirection: { args: [FFIType.ptr], returns: FFIType.i32 },
    Wow64EnableWow64FsRedirection: { args: [FFIType.u32], returns: FFIType.u32 },
    Wow64GetThreadContext: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    Wow64GetThreadSelectorEntry: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    Wow64RevertWow64FsRedirection: { args: [FFIType.ptr], returns: FFIType.i32 },
    Wow64SetThreadContext: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    Wow64SuspendThread: { args: [FFIType.u64], returns: FFIType.u32 },
    WriteConsoleA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WriteConsoleInputA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WriteConsoleInputVDMA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WriteConsoleInputVDMW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WriteConsoleInputW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WriteConsoleOutputA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WriteConsoleOutputAttribute: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WriteConsoleOutputCharacterA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WriteConsoleOutputCharacterW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WriteConsoleOutputW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WriteConsoleW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WriteFile: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WriteFileEx: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WriteFileGather: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WritePrivateProfileSectionA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WritePrivateProfileSectionW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WritePrivateProfileStringA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WritePrivateProfileStringW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WritePrivateProfileStructA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WritePrivateProfileStructW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WriteProcessMemory: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WriteProfileSectionA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WriteProfileSectionW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WriteProfileStringA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WriteProfileStringW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WriteTapemark: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.i32], returns: FFIType.u32 },
    WTSGetActiveConsoleSessionId: { args: [], returns: FFIType.u32 },
    ZombifyActCtx: { args: [FFIType.ptr], returns: FFIType.i32 },
    lstrcatA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    lstrcatW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    lstrcmpA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    lstrcmpiA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    lstrcmpiW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    lstrcmpW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    lstrcpyA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    lstrcpynA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.ptr },
    lstrcpynW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.ptr },
    lstrcpyW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    lstrlenA: { args: [FFIType.ptr], returns: FFIType.i32 },
    lstrlenW: { args: [FFIType.ptr], returns: FFIType.i32 },
    uaw_lstrcmpiW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    uaw_lstrcmpW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    uaw_lstrlenW: { args: [FFIType.ptr], returns: FFIType.i32 },
    uaw_wcschr: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    uaw_wcscpy: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    uaw_wcsicmp: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    uaw_wcslen: { args: [FFIType.ptr], returns: FFIType.ptr },
    uaw_wcsrchr: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-_hread
  public static _hread(hFile: INT, lpBuffer: LPVOID, lBytes: INT): INT {
    return Kernel32.Load('_hread')(hFile, lpBuffer, lBytes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-_hwrite
  public static _hwrite(hFile: INT, lpBuffer: LPSTR, lBytes: INT): INT {
    return Kernel32.Load('_hwrite')(hFile, lpBuffer, lBytes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-_lclose
  public static _lclose(hFile: INT): INT {
    return Kernel32.Load('_lclose')(hFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-_lcreat
  public static _lcreat(lpPathName: LPSTR, iAttribute: INT): INT {
    return Kernel32.Load('_lcreat')(lpPathName, iAttribute);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-_llseek
  public static _llseek(hFile: INT, lOffset: INT, iOrigin: INT): INT {
    return Kernel32.Load('_llseek')(hFile, lOffset, iOrigin);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-_lopen
  public static _lopen(lpPathName: LPSTR, iReadWrite: INT): INT {
    return Kernel32.Load('_lopen')(lpPathName, iReadWrite);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-_lread
  public static _lread(hFile: INT, lpBuffer: LPVOID, uBytes: DWORD): DWORD {
    return Kernel32.Load('_lread')(hFile, lpBuffer, uBytes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-_lwrite
  public static _lwrite(hFile: INT, lpBuffer: LPSTR, uBytes: DWORD): DWORD {
    return Kernel32.Load('_lwrite')(hFile, lpBuffer, uBytes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-acquiresrwlockexclusive
  public static AcquireSRWLockExclusive(SRWLock: LPVOID): VOID {
    return Kernel32.Load('AcquireSRWLockExclusive')(SRWLock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-acquiresrwlockshared
  public static AcquireSRWLockShared(SRWLock: LPVOID): VOID {
    return Kernel32.Load('AcquireSRWLockShared')(SRWLock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-activateactctx
  public static ActivateActCtx(hActCtx: HANDLE, lpCookie: LPVOID): BOOL {
    return Kernel32.Load('ActivateActCtx')(hActCtx, lpCookie);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-activatepackagevirtualizationcontext
  public static ActivatePackageVirtualizationContext(context: DWORD, cookie: LPVOID): DWORD {
    return Kernel32.Load('ActivatePackageVirtualizationContext')(context, cookie);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-addatoma
  public static AddAtomA(lpString: LPSTR): USHORT {
    return Kernel32.Load('AddAtomA')(lpString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-addatomw
  public static AddAtomW(lpString: LPWSTR): USHORT {
    return Kernel32.Load('AddAtomW')(lpString);
  }

  // https://learn.microsoft.com/en-us/windows/console/addconsolealias
  public static AddConsoleAliasA(Source: LPSTR, Target: LPSTR, ExeName: LPSTR): BOOL {
    return Kernel32.Load('AddConsoleAliasA')(Source, Target, ExeName);
  }

  // https://learn.microsoft.com/en-us/windows/console/addconsolealias
  public static AddConsoleAliasW(Source: LPWSTR, Target: LPWSTR, ExeName: LPWSTR): BOOL {
    return Kernel32.Load('AddConsoleAliasW')(Source, Target, ExeName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-adddlldirectory
  public static AddDllDirectory(NewDirectory: LPWSTR): LPVOID {
    return Kernel32.Load('AddDllDirectory')(NewDirectory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-addintegritylabeltoboundarydescriptor
  public static AddIntegrityLabelToBoundaryDescriptor(BoundaryDescriptor: LPVOID, IntegrityLabel: DWORD): BOOL {
    return Kernel32.Load('AddIntegrityLabelToBoundaryDescriptor')(BoundaryDescriptor, IntegrityLabel);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-addrefactctx
  public static AddRefActCtx(hActCtx: HANDLE): VOID {
    return Kernel32.Load('AddRefActCtx')(hActCtx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-addresourceattributeace
  public static AddResourceAttributeAce(pAcl: LPVOID, dwAceRevision: DWORD, AceFlags: DWORD, AccessMask: DWORD, pSid: DWORD, pAttributeInfo: LPVOID, pReturnLength: LPVOID): BOOL {
    return Kernel32.Load('AddResourceAttributeAce')(pAcl, dwAceRevision, AceFlags, AccessMask, pSid, pAttributeInfo, pReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-addscopedpolicyidace
  public static AddScopedPolicyIDAce(pAcl: LPVOID, dwAceRevision: DWORD, AceFlags: DWORD, AccessMask: DWORD, pSid: DWORD): BOOL {
    return Kernel32.Load('AddScopedPolicyIDAce')(pAcl, dwAceRevision, AceFlags, AccessMask, pSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-addsecurememorycachecallback
  public static AddSecureMemoryCacheCallback(pfnCallBack: DWORD): BOOL {
    return Kernel32.Load('AddSecureMemoryCacheCallback')(pfnCallBack);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-addsidtoboundarydescriptor
  public static AddSIDToBoundaryDescriptor(BoundaryDescriptor: LPVOID, RequiredSid: DWORD): BOOL {
    return Kernel32.Load('AddSIDToBoundaryDescriptor')(BoundaryDescriptor, RequiredSid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/errhandlingapi/nf-errhandlingapi-addvectoredcontinuehandler
  public static AddVectoredContinueHandler(First: DWORD, Handler: DWORD): LPVOID {
    return Kernel32.Load('AddVectoredContinueHandler')(First, Handler);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/errhandlingapi/nf-errhandlingapi-addvectoredexceptionhandler
  public static AddVectoredExceptionHandler(First: DWORD, Handler: DWORD): LPVOID {
    return Kernel32.Load('AddVectoredExceptionHandler')(First, Handler);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-adjustcalendardate
  public static AdjustCalendarDate(lpCalDateTime: LPVOID, calUnit: DWORD, amount: INT): BOOL {
    return Kernel32.Load('AdjustCalendarDate')(lpCalDateTime, calUnit, amount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-allocateuserphysicalpages
  public static AllocateUserPhysicalPages(hProcess: HANDLE, NumberOfPages: LPVOID, PageArray: LPVOID): BOOL {
    return Kernel32.Load('AllocateUserPhysicalPages')(hProcess, NumberOfPages, PageArray);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-allocateuserphysicalpagesnuma
  public static AllocateUserPhysicalPagesNuma(hProcess: HANDLE, NumberOfPages: LPVOID, PageArray: LPVOID, nndPreferred: DWORD): BOOL {
    return Kernel32.Load('AllocateUserPhysicalPagesNuma')(hProcess, NumberOfPages, PageArray, nndPreferred);
  }

  // https://learn.microsoft.com/en-us/windows/console/allocconsole
  public static AllocConsole(): BOOL {
    return Kernel32.Load('AllocConsole')();
  }

  public static AllocConsoleWithOptions(options: LPVOID, result: LPVOID): DWORD {
    return Kernel32.Load('AllocConsoleWithOptions')(options, result);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-applicationrecoveryfinished
  public static ApplicationRecoveryFinished(bSuccess: BOOL): VOID {
    return Kernel32.Load('ApplicationRecoveryFinished')(bSuccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-applicationrecoveryinprogress
  public static ApplicationRecoveryInProgress(pbCancelled: LPVOID): DWORD {
    return Kernel32.Load('ApplicationRecoveryInProgress')(pbCancelled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmodel/nf-appmodel-apppolicygetclrcompat
  public static AppPolicyGetClrCompat(processToken: HANDLE, policy: LPVOID): DWORD {
    return Kernel32.Load('AppPolicyGetClrCompat')(processToken, policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmodel/nf-appmodel-apppolicygetcreatefileaccess
  public static AppPolicyGetCreateFileAccess(processToken: HANDLE, policy: LPVOID): DWORD {
    return Kernel32.Load('AppPolicyGetCreateFileAccess')(processToken, policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmodel/nf-appmodel-apppolicygetlifecyclemanagement
  public static AppPolicyGetLifecycleManagement(processToken: HANDLE, policy: LPVOID): DWORD {
    return Kernel32.Load('AppPolicyGetLifecycleManagement')(processToken, policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmodel/nf-appmodel-apppolicygetmediafoundationcodecloading
  public static AppPolicyGetMediaFoundationCodecLoading(processToken: HANDLE, policy: LPVOID): DWORD {
    return Kernel32.Load('AppPolicyGetMediaFoundationCodecLoading')(processToken, policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmodel/nf-appmodel-apppolicygetprocessterminationmethod
  public static AppPolicyGetProcessTerminationMethod(processToken: HANDLE, policy: LPVOID): DWORD {
    return Kernel32.Load('AppPolicyGetProcessTerminationMethod')(processToken, policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmodel/nf-appmodel-apppolicygetshowdeveloperdiagnostic
  public static AppPolicyGetShowDeveloperDiagnostic(processToken: HANDLE, policy: LPVOID): DWORD {
    return Kernel32.Load('AppPolicyGetShowDeveloperDiagnostic')(processToken, policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmodel/nf-appmodel-apppolicygetthreadinitializationtype
  public static AppPolicyGetThreadInitializationType(processToken: HANDLE, policy: LPVOID): DWORD {
    return Kernel32.Load('AppPolicyGetThreadInitializationType')(processToken, policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmodel/nf-appmodel-apppolicygetwindowingmodel
  public static AppPolicyGetWindowingModel(processToken: HANDLE, policy: LPVOID): DWORD {
    return Kernel32.Load('AppPolicyGetWindowingModel')(processToken, policy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-arefileapisansi
  public static AreFileApisANSI(): BOOL {
    return Kernel32.Load('AreFileApisANSI')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-areshortnamesenabled
  public static AreShortNamesEnabled(Handle: HANDLE, Enabled: LPVOID): BOOL {
    return Kernel32.Load('AreShortNamesEnabled')(Handle, Enabled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/jobapi/nf-jobapi-assignprocesstojobobject
  public static AssignProcessToJobObject(hJob: HANDLE, hProcess: HANDLE): BOOL {
    return Kernel32.Load('AssignProcessToJobObject')(hJob, hProcess);
  }

  // https://learn.microsoft.com/en-us/windows/console/attachconsole
  public static AttachConsole(dwProcessId: DWORD): BOOL {
    return Kernel32.Load('AttachConsole')(dwProcessId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-backupread
  public static BackupRead(hFile: HANDLE, lpBuffer: LPVOID, nNumberOfBytesToRead: DWORD, lpNumberOfBytesRead: LPVOID, bAbort: BOOL, bProcessSecurity: BOOL, lpContext: LPVOID): BOOL {
    return Kernel32.Load('BackupRead')(hFile, lpBuffer, nNumberOfBytesToRead, lpNumberOfBytesRead, bAbort, bProcessSecurity, lpContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-backupseek
  public static BackupSeek(hFile: HANDLE, dwLowBytesToSeek: DWORD, dwHighBytesToSeek: DWORD, lpdwLowByteSeeked: LPVOID, lpdwHighByteSeeked: LPVOID, lpContext: LPVOID): BOOL {
    return Kernel32.Load('BackupSeek')(hFile, dwLowBytesToSeek, dwHighBytesToSeek, lpdwLowByteSeeked, lpdwHighByteSeeked, lpContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-backupwrite
  public static BackupWrite(hFile: HANDLE, lpBuffer: LPVOID, nNumberOfBytesToWrite: DWORD, lpNumberOfBytesWritten: LPVOID, bAbort: BOOL, bProcessSecurity: BOOL, lpContext: LPVOID): BOOL {
    return Kernel32.Load('BackupWrite')(hFile, lpBuffer, nNumberOfBytesToWrite, lpNumberOfBytesWritten, bAbort, bProcessSecurity, lpContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-beep
  public static Beep(dwFreq: DWORD, dwDuration: DWORD): BOOL {
    return Kernel32.Load('Beep')(dwFreq, dwDuration);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-beginupdateresourcea
  public static BeginUpdateResourceA(pFileName: LPSTR, bDeleteExistingResources: BOOL): HANDLE {
    return Kernel32.Load('BeginUpdateResourceA')(pFileName, bDeleteExistingResources);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-beginupdateresourcew
  public static BeginUpdateResourceW(pFileName: LPWSTR, bDeleteExistingResources: BOOL): HANDLE {
    return Kernel32.Load('BeginUpdateResourceW')(pFileName, bDeleteExistingResources);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-bindiocompletioncallback
  public static BindIoCompletionCallback(FileHandle: HANDLE, _Function: DWORD, Flags: DWORD): BOOL {
    return Kernel32.Load('BindIoCompletionCallback')(FileHandle, _Function, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-buildcommdcba
  public static BuildCommDCBA(lpDef: LPSTR, lpDCB: LPVOID): BOOL {
    return Kernel32.Load('BuildCommDCBA')(lpDef, lpDCB);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-buildcommdcbandtimeoutsa
  public static BuildCommDCBAndTimeoutsA(lpDef: LPSTR, lpDCB: LPVOID, lpCommTimeouts: LPVOID): BOOL {
    return Kernel32.Load('BuildCommDCBAndTimeoutsA')(lpDef, lpDCB, lpCommTimeouts);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-buildcommdcbandtimeoutsw
  public static BuildCommDCBAndTimeoutsW(lpDef: LPWSTR, lpDCB: LPVOID, lpCommTimeouts: LPVOID): BOOL {
    return Kernel32.Load('BuildCommDCBAndTimeoutsW')(lpDef, lpDCB, lpCommTimeouts);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-buildcommdcbw
  public static BuildCommDCBW(lpDef: LPWSTR, lpDCB: LPVOID): BOOL {
    return Kernel32.Load('BuildCommDCBW')(lpDef, lpDCB);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-buildioringflushfile
  public static BuildIoRingFlushFile(ioRing: DWORD, fileRef: DWORD, flushMode: DWORD, userData: LPVOID, sqeFlags: DWORD): DWORD {
    return Kernel32.Load('BuildIoRingFlushFile')(ioRing, fileRef, flushMode, userData, sqeFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-buildioringreadfilescatter
  public static BuildIoRingReadFileScatter(ioRing: DWORD, fileRef: DWORD, segmentCount: DWORD, segmentArray: LPVOID, numberOfBytesToRead: DWORD, fileOffset: ULONGLONG, userData: LPVOID, sqeFlags: DWORD): DWORD {
    return Kernel32.Load('BuildIoRingReadFileScatter')(ioRing, fileRef, segmentCount, segmentArray, numberOfBytesToRead, fileOffset, userData, sqeFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-buildioringwritefile
  public static BuildIoRingWriteFile(ioRing: DWORD, fileRef: DWORD, bufferRef: DWORD, numberOfBytesToWrite: DWORD, fileOffset: ULONGLONG, writeFlags: DWORD, userData: LPVOID, sqeFlags: DWORD): DWORD {
    return Kernel32.Load('BuildIoRingWriteFile')(ioRing, fileRef, bufferRef, numberOfBytesToWrite, fileOffset, writeFlags, userData, sqeFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-buildioringwritefilegather
  public static BuildIoRingWriteFileGather(ioRing: DWORD, fileRef: DWORD, segmentCount: DWORD, segmentArray: LPVOID, numberOfBytesToWrite: DWORD, fileOffset: ULONGLONG, writeFlags: DWORD, userData: LPVOID, sqeFlags: DWORD): DWORD {
    return Kernel32.Load('BuildIoRingWriteFileGather')(ioRing, fileRef, segmentCount, segmentArray, numberOfBytesToWrite, fileOffset, writeFlags, userData, sqeFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-callbackmayrunlong
  public static CallbackMayRunLong(pci: DWORD): BOOL {
    return Kernel32.Load('CallbackMayRunLong')(pci);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-callnamedpipea
  public static CallNamedPipeA(lpNamedPipeName: LPSTR, lpInBuffer: LPVOID, nInBufferSize: DWORD, lpOutBuffer: LPVOID, nOutBufferSize: DWORD, lpBytesRead: LPVOID, nTimeOut: DWORD): BOOL {
    return Kernel32.Load('CallNamedPipeA')(lpNamedPipeName, lpInBuffer, nInBufferSize, lpOutBuffer, nOutBufferSize, lpBytesRead, nTimeOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-callnamedpipew
  public static CallNamedPipeW(lpNamedPipeName: LPWSTR, lpInBuffer: LPVOID, nInBufferSize: DWORD, lpOutBuffer: LPVOID, nOutBufferSize: DWORD, lpBytesRead: LPVOID, nTimeOut: DWORD): BOOL {
    return Kernel32.Load('CallNamedPipeW')(lpNamedPipeName, lpInBuffer, nInBufferSize, lpOutBuffer, nOutBufferSize, lpBytesRead, nTimeOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-canceldevicewakeuprequest
  public static CancelDeviceWakeupRequest(hDevice: HANDLE): BOOL {
    return Kernel32.Load('CancelDeviceWakeupRequest')(hDevice);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-cancelio
  public static CancelIo(hFile: HANDLE): BOOL {
    return Kernel32.Load('CancelIo')(hFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-cancelioex
  public static CancelIoEx(hFile: HANDLE, lpOverlapped: LPVOID): BOOL {
    return Kernel32.Load('CancelIoEx')(hFile, lpOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-cancelsynchronousio
  public static CancelSynchronousIo(hThread: HANDLE): BOOL {
    return Kernel32.Load('CancelSynchronousIo')(hThread);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/threadpoolapiset/nf-threadpoolapiset-cancelthreadpoolio
  public static CancelThreadpoolIo(pio: DWORD): VOID {
    return Kernel32.Load('CancelThreadpoolIo')(pio);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-canceltimerqueuetimer
  public static CancelTimerQueueTimer(TimerQueue: HANDLE, Timer: HANDLE): BOOL {
    return Kernel32.Load('CancelTimerQueueTimer')(TimerQueue, Timer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-cancelwaitabletimer
  public static CancelWaitableTimer(hTimer: HANDLE): BOOL {
    return Kernel32.Load('CancelWaitableTimer')(hTimer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-ceipisoptedin
  public static CeipIsOptedIn(): BOOL {
    return Kernel32.Load('CeipIsOptedIn')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-changetimerqueuetimer
  public static ChangeTimerQueueTimer(TimerQueue: HANDLE, Timer: HANDLE, DueTime: DWORD, Period: DWORD): BOOL {
    return Kernel32.Load('ChangeTimerQueueTimer')(TimerQueue, Timer, DueTime, Period);
  }

  // public static CheckIsMSIXPackage(packageFullName: LPWSTR, isMSIXPackage: LPVOID): DWORD {
  //   return Kernel32.Load('CheckIsMSIXPackage')(packageFullName, isMSIXPackage);
  // }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-checknamelegaldos8dot3a
  public static CheckNameLegalDOS8Dot3A(lpName: LPSTR, lpOemName: LPSTR, OemNameSize: DWORD, pbNameContainsSpaces: LPVOID, pbNameLegal: LPVOID): BOOL {
    return Kernel32.Load('CheckNameLegalDOS8Dot3A')(lpName, lpOemName, OemNameSize, pbNameContainsSpaces, pbNameLegal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-checknamelegaldos8dot3w
  public static CheckNameLegalDOS8Dot3W(lpName: LPWSTR, lpOemName: LPSTR, OemNameSize: DWORD, pbNameContainsSpaces: LPVOID, pbNameLegal: LPVOID): BOOL {
    return Kernel32.Load('CheckNameLegalDOS8Dot3W')(lpName, lpOemName, OemNameSize, pbNameContainsSpaces, pbNameLegal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-checkremotedebuggerpresent
  public static CheckRemoteDebuggerPresent(hProcess: HANDLE, pbDebuggerPresent: LPVOID): BOOL {
    return Kernel32.Load('CheckRemoteDebuggerPresent')(hProcess, pbDebuggerPresent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-checktokencapability
  public static CheckTokenCapability(TokenHandle: HANDLE, CapabilitySidToCheck: DWORD, HasCapability: LPVOID): BOOL {
    return Kernel32.Load('CheckTokenCapability')(TokenHandle, CapabilitySidToCheck, HasCapability);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-checktokenmembershipex
  public static CheckTokenMembershipEx(TokenHandle: HANDLE, SidToCheck: DWORD, Flags: DWORD, IsMember: LPVOID): BOOL {
    return Kernel32.Load('CheckTokenMembershipEx')(TokenHandle, SidToCheck, Flags, IsMember);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-clearcommbreak
  public static ClearCommBreak(hFile: HANDLE): BOOL {
    return Kernel32.Load('ClearCommBreak')(hFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-clearcommerror
  public static ClearCommError(hFile: HANDLE, lpErrors: LPVOID, lpStat: LPVOID): BOOL {
    return Kernel32.Load('ClearCommError')(hFile, lpErrors, lpStat);
  }

  // https://learn.microsoft.com/en-us/windows/console/closeconsolehandle
  public static CloseConsoleHandle(hConsole: HANDLE): BOOL {
    return Kernel32.Load('CloseConsoleHandle')(hConsole);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/handleapi/nf-handleapi-closehandle
  public static CloseHandle(hObject: HANDLE): BOOL {
    return Kernel32.Load('CloseHandle')(hObject);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmodel/nf-appmodel-closepackageinfo
  public static ClosePackageInfo(packageInfoReference: LPVOID): DWORD {
    return Kernel32.Load('ClosePackageInfo')(packageInfoReference);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-closeprivatenamespace
  public static ClosePrivateNamespace(Handle: HANDLE, Flags: DWORD): DWORD {
    return Kernel32.Load('ClosePrivateNamespace')(Handle, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/console/closepseudoconsole
  public static ClosePseudoConsole(hPC: DWORD): VOID {
    return Kernel32.Load('ClosePseudoConsole')(hPC);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/threadpoolapiset/nf-threadpoolapiset-closethreadpool
  public static CloseThreadpool(ptpp: DWORD): VOID {
    return Kernel32.Load('CloseThreadpool')(ptpp);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-closethreadpoolcleanupgroup
  public static CloseThreadpoolCleanupGroup(ptpcg: DWORD): VOID {
    return Kernel32.Load('CloseThreadpoolCleanupGroup')(ptpcg);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-closethreadpoolcleanupgroupmembers
  public static CloseThreadpoolCleanupGroupMembers(ptpcg: DWORD, fCancelPendingCallbacks: BOOL, pvCleanupContext: LPVOID): VOID {
    return Kernel32.Load('CloseThreadpoolCleanupGroupMembers')(ptpcg, fCancelPendingCallbacks, pvCleanupContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-closethreadpoolio
  public static CloseThreadpoolIo(pio: DWORD): VOID {
    return Kernel32.Load('CloseThreadpoolIo')(pio);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-closethreadpooltimer
  public static CloseThreadpoolTimer(pti: DWORD): VOID {
    return Kernel32.Load('CloseThreadpoolTimer')(pti);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-closethreadpoolwait
  public static CloseThreadpoolWait(pwa: DWORD): VOID {
    return Kernel32.Load('CloseThreadpoolWait')(pwa);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-closethreadpoolwork
  public static CloseThreadpoolWork(pwk: DWORD): VOID {
    return Kernel32.Load('CloseThreadpoolWork')(pwk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-commconfigdialoga
  public static CommConfigDialogA(lpszName: LPSTR, hWnd: DWORD, lpCC: LPVOID): BOOL {
    return Kernel32.Load('CommConfigDialogA')(lpszName, hWnd, lpCC);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-commconfigdialogw
  public static CommConfigDialogW(lpszName: LPWSTR, hWnd: DWORD, lpCC: LPVOID): BOOL {
    return Kernel32.Load('CommConfigDialogW')(lpszName, hWnd, lpCC);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-comparefiletime
  public static CompareFileTime(lpFileTime1: LPVOID, lpFileTime2: LPVOID): INT {
    return Kernel32.Load('CompareFileTime')(lpFileTime1, lpFileTime2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-comparestringa
  public static CompareStringA(Locale: LCID, dwCmpFlags: DWORD, lpString1: LPCSTR, cchCount1: INT, lpString2: LPCSTR, cchCount2: INT): INT {
    return Kernel32.Load('CompareStringA')(Locale, dwCmpFlags, lpString1, cchCount1, lpString2, cchCount2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-comparestringex
  public static CompareStringEx(lpLocaleName: LPCWSTR, dwCmpFlags: DWORD, lpString1: LPCWSTR, cchCount1: INT, lpString2: LPCWSTR, cchCount2: INT, lpVersionInformation: LPNLSVERSIONINFO, lpReserved: LPVOID, lParam: LPARAM): INT {
    return Kernel32.Load('CompareStringEx')(lpLocaleName, dwCmpFlags, lpString1, cchCount1, lpString2, cchCount2, lpVersionInformation, lpReserved, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-comparestringordinal
  public static CompareStringOrdinal(lpString1: LPCWSTR, cchCount1: INT, lpString2: LPCWSTR, cchCount2: INT, bIgnoreCase: BOOL): INT {
    return Kernel32.Load('CompareStringOrdinal')(lpString1, cchCount1, lpString2, cchCount2, bIgnoreCase);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-comparestringw
  public static CompareStringW(Locale: LCID, dwCmpFlags: DWORD, lpString1: LPCWSTR, cchCount1: INT, lpString2: LPCWSTR, cchCount2: INT): INT {
    return Kernel32.Load('CompareStringW')(Locale, dwCmpFlags, lpString1, cchCount1, lpString2, cchCount2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-connectnamedpipe
  public static ConnectNamedPipe(hNamedPipe: HANDLE, lpOverlapped: LPVOID): BOOL {
    return Kernel32.Load('ConnectNamedPipe')(hNamedPipe, lpOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/console/consolemenucontrol
  public static ConsoleMenuControl(hConsoleOutput: HANDLE, dwCommandIdLow: DWORD, dwCommandIdHigh: DWORD): DWORD {
    return Kernel32.Load('ConsoleMenuControl')(hConsoleOutput, dwCommandIdLow, dwCommandIdHigh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-continuedebugevent
  public static ContinueDebugEvent(dwProcessId: DWORD, dwThreadId: DWORD, dwContinueStatus: DWORD): BOOL {
    return Kernel32.Load('ContinueDebugEvent')(dwProcessId, dwThreadId, dwContinueStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-convertcaldatetimetosystemtime
  public static ConvertCalDateTimeToSystemTime(lpCalDateTime: LPVOID, lpSysTime: LPVOID): BOOL {
    return Kernel32.Load('ConvertCalDateTimeToSystemTime')(lpCalDateTime, lpSysTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-convertdefaultlocale
  public static ConvertDefaultLocale(Locale: DWORD): DWORD {
    return Kernel32.Load('ConvertDefaultLocale')(Locale);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-convertfibertothread
  public static ConvertFiberToThread(): BOOL {
    return Kernel32.Load('ConvertFiberToThread')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-convertsystemtimetocaldatetime
  public static ConvertSystemTimeToCalDateTime(lpSysTime: LPVOID, calId: DWORD, lpCalDateTime: LPVOID): BOOL {
    return Kernel32.Load('ConvertSystemTimeToCalDateTime')(lpSysTime, calId, lpCalDateTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-convertthreadtofiber
  public static ConvertThreadToFiber(lpParameter: LPVOID): LPVOID {
    return Kernel32.Load('ConvertThreadToFiber')(lpParameter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-convertthreadtofiberex
  public static ConvertThreadToFiberEx(lpParameter: LPVOID, dwFlags: DWORD): LPVOID {
    return Kernel32.Load('ConvertThreadToFiberEx')(lpParameter, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-copycontext
  public static CopyContext(Destination: LPVOID, ContextFlags: DWORD, Source: LPVOID): BOOL {
    return Kernel32.Load('CopyContext')(Destination, ContextFlags, Source);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-copyfile2
  public static CopyFile2(pwszExistingFileName: LPWSTR, pwszNewFileName: LPWSTR, pExtendedParameters: LPVOID): DWORD {
    return Kernel32.Load('CopyFile2')(pwszExistingFileName, pwszNewFileName, pExtendedParameters);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-copyfilea
  public static CopyFileA(lpExistingFileName: LPSTR, lpNewFileName: LPSTR, bFailIfExists: BOOL): BOOL {
    return Kernel32.Load('CopyFileA')(lpExistingFileName, lpNewFileName, bFailIfExists);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-copyfileexa
  public static CopyFileExA(lpExistingFileName: LPSTR, lpNewFileName: LPSTR, lpProgressRoutine: DWORD, lpData: LPVOID, pbCancel: LPVOID, dwCopyFlags: DWORD): BOOL {
    return Kernel32.Load('CopyFileExA')(lpExistingFileName, lpNewFileName, lpProgressRoutine, lpData, pbCancel, dwCopyFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-copyfileexw
  public static CopyFileExW(lpExistingFileName: LPWSTR, lpNewFileName: LPWSTR, lpProgressRoutine: DWORD, lpData: LPVOID, pbCancel: LPVOID, dwCopyFlags: DWORD): BOOL {
    return Kernel32.Load('CopyFileExW')(lpExistingFileName, lpNewFileName, lpProgressRoutine, lpData, pbCancel, dwCopyFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-copyfiletransacteda
  public static CopyFileTransactedA(lpExistingFileName: LPSTR, lpNewFileName: LPSTR, lpProgressRoutine: DWORD, lpData: LPVOID, pbCancel: LPVOID, dwCopyFlags: DWORD, hTransaction: HANDLE): BOOL {
    return Kernel32.Load('CopyFileTransactedA')(lpExistingFileName, lpNewFileName, lpProgressRoutine, lpData, pbCancel, dwCopyFlags, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-copyfiletransactedw
  public static CopyFileTransactedW(lpExistingFileName: LPWSTR, lpNewFileName: LPWSTR, lpProgressRoutine: DWORD, lpData: LPVOID, pbCancel: LPVOID, dwCopyFlags: DWORD, hTransaction: HANDLE): BOOL {
    return Kernel32.Load('CopyFileTransactedW')(lpExistingFileName, lpNewFileName, lpProgressRoutine, lpData, pbCancel, dwCopyFlags, hTransaction);
  }
  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-copyfilew
  public static CopyFileW(lpExistingFileName: LPWSTR, lpNewFileName: LPWSTR, bFailIfExists: BOOL): BOOL {
    return Kernel32.Load('CopyFileW')(lpExistingFileName, lpNewFileName, bFailIfExists);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lzexpand/nf-lzexpand-copylzfile
  public static CopyLZFile(hfSource: INT, hfDest: INT): INT {
    return Kernel32.Load('CopyLZFile')(hfSource, hfDest);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createactctxa
  public static CreateActCtxA(pActCtx: LPVOID): HANDLE {
    return Kernel32.Load('CreateActCtxA')(pActCtx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createactctxw
  public static CreateActCtxW(pActCtx: LPVOID): HANDLE {
    return Kernel32.Load('CreateActCtxW')(pActCtx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createboundarydescriptora
  public static CreateBoundaryDescriptorA(Name: LPSTR, Flags: DWORD): HANDLE {
    return Kernel32.Load('CreateBoundaryDescriptorA')(Name, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createboundarydescriptorw
  public static CreateBoundaryDescriptorW(Name: LPWSTR, Flags: DWORD): HANDLE {
    return Kernel32.Load('CreateBoundaryDescriptorW')(Name, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/console/createconsolescreenbuffer
  public static CreateConsoleScreenBuffer(dwDesiredAccess: DWORD, dwShareMode: DWORD, lpSecurityAttributes: LPVOID, dwFlags: DWORD, lpScreenBufferData: LPVOID): HANDLE {
    return Kernel32.Load('CreateConsoleScreenBuffer')(dwDesiredAccess, dwShareMode, lpSecurityAttributes, dwFlags, lpScreenBufferData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createdirectory2a
  public static CreateDirectory2A(lpPathName: LPSTR, dwDesiredAccess: DWORD, dwShareMode: DWORD, DirectoryFlags: DWORD, lpSecurityAttributes: LPVOID): HANDLE {
    return Kernel32.Load('CreateDirectory2A')(lpPathName, dwDesiredAccess, dwShareMode, DirectoryFlags, lpSecurityAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createdirectory2w
  public static CreateDirectory2W(lpPathName: LPWSTR, dwDesiredAccess: DWORD, dwShareMode: DWORD, DirectoryFlags: DWORD, lpSecurityAttributes: LPVOID): HANDLE {
    return Kernel32.Load('CreateDirectory2W')(lpPathName, dwDesiredAccess, dwShareMode, DirectoryFlags, lpSecurityAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createdirectorya
  public static CreateDirectoryA(lpPathName: LPSTR, lpSecurityAttributes: LPVOID): BOOL {
    return Kernel32.Load('CreateDirectoryA')(lpPathName, lpSecurityAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createdirectoryexa
  public static CreateDirectoryExA(lpTemplateDirectory: LPSTR, lpNewDirectory: LPSTR, lpSecurityAttributes: LPVOID): BOOL {
    return Kernel32.Load('CreateDirectoryExA')(lpTemplateDirectory, lpNewDirectory, lpSecurityAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createdirectoryexw
  public static CreateDirectoryExW(lpTemplateDirectory: LPWSTR, lpNewDirectory: LPWSTR, lpSecurityAttributes: LPVOID): BOOL {
    return Kernel32.Load('CreateDirectoryExW')(lpTemplateDirectory, lpNewDirectory, lpSecurityAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createdirectorytransacteda
  public static CreateDirectoryTransactedA(lpTemplateDirectory: LPSTR, lpNewDirectory: LPSTR, lpSecurityAttributes: LPVOID, hTransaction: HANDLE): BOOL {
    return Kernel32.Load('CreateDirectoryTransactedA')(lpTemplateDirectory, lpNewDirectory, lpSecurityAttributes, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createdirectorytransactedw
  public static CreateDirectoryTransactedW(lpTemplateDirectory: LPWSTR, lpNewDirectory: LPWSTR, lpSecurityAttributes: LPVOID, hTransaction: HANDLE): BOOL {
    return Kernel32.Load('CreateDirectoryTransactedW')(lpTemplateDirectory, lpNewDirectory, lpSecurityAttributes, hTransaction);
  }
  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createdirectoryw
  public static CreateDirectoryW(lpPathName: LPWSTR, lpSecurityAttributes: LPVOID): BOOL {
    return Kernel32.Load('CreateDirectoryW')(lpPathName, lpSecurityAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createenclave
  public static CreateEnclave(hProcess: HANDLE, lpAddress: LPVOID, dwSize: LPVOID, dwInitialCommitment: LPVOID, flEnclaveType: DWORD, lpEnclaveInformation: LPVOID, dwInfoLength: DWORD, lpEnclaveError: LPVOID): LPVOID {
    return Kernel32.Load('CreateEnclave')(hProcess, lpAddress, dwSize, dwInitialCommitment, flEnclaveType, lpEnclaveInformation, dwInfoLength, lpEnclaveError);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-createeventa
  public static CreateEventA(lpEventAttributes: LPVOID, bManualReset: BOOL, bInitialState: BOOL, lpName: LPSTR): HANDLE {
    return Kernel32.Load('CreateEventA')(lpEventAttributes, bManualReset, bInitialState, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-createeventexa
  public static CreateEventExA(lpEventAttributes: LPVOID, lpName: LPSTR, dwFlags: DWORD, dwDesiredAccess: DWORD): HANDLE {
    return Kernel32.Load('CreateEventExA')(lpEventAttributes, lpName, dwFlags, dwDesiredAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-createeventexw
  public static CreateEventExW(lpEventAttributes: LPVOID, lpName: LPWSTR, dwFlags: DWORD, dwDesiredAccess: DWORD): HANDLE {
    return Kernel32.Load('CreateEventExW')(lpEventAttributes, lpName, dwFlags, dwDesiredAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-createeventw
  public static CreateEventW(lpEventAttributes: LPVOID, bManualReset: BOOL, bInitialState: BOOL, lpName: LPWSTR): HANDLE {
    return Kernel32.Load('CreateEventW')(lpEventAttributes, bManualReset, bInitialState, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createfiber
  public static CreateFiber(dwStackSize: LPVOID, lpStartAddress: DWORD, lpParameter: LPVOID): LPVOID {
    return Kernel32.Load('CreateFiber')(dwStackSize, lpStartAddress, lpParameter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createfiberex
  public static CreateFiberEx(dwStackCommitSize: LPVOID, dwStackReserveSize: LPVOID, dwFlags: DWORD, lpStartAddress: DWORD, lpParameter: LPVOID): LPVOID {
    return Kernel32.Load('CreateFiberEx')(dwStackCommitSize, dwStackReserveSize, dwFlags, lpStartAddress, lpParameter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfile2
  public static CreateFile2(lpFileName: LPWSTR, dwDesiredAccess: DWORD, dwShareMode: DWORD, dwCreationDisposition: DWORD, pCreateExParams: LPVOID): HANDLE {
    return Kernel32.Load('CreateFile2')(lpFileName, dwDesiredAccess, dwShareMode, dwCreationDisposition, pCreateExParams);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfile3
  public static CreateFile3(lpFileName: LPWSTR, dwDesiredAccess: DWORD, dwShareMode: DWORD, dwCreationDisposition: DWORD, pCreateExParams: LPVOID): HANDLE {
    return Kernel32.Load('CreateFile3')(lpFileName, dwDesiredAccess, dwShareMode, dwCreationDisposition, pCreateExParams);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilea
  public static CreateFileA(lpFileName: LPSTR, dwDesiredAccess: DWORD, dwShareMode: DWORD, lpSecurityAttributes: LPVOID, dwCreationDisposition: DWORD, dwFlagsAndAttributes: DWORD, hTemplateFile: HANDLE): HANDLE {
    return Kernel32.Load('CreateFileA')(lpFileName, dwDesiredAccess, dwShareMode, lpSecurityAttributes, dwCreationDisposition, dwFlagsAndAttributes, hTemplateFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilemappinga
  public static CreateFileMappingA(hFile: HANDLE, lpFileMappingAttributes: LPVOID, flProtect: DWORD, dwMaximumSizeHigh: DWORD, dwMaximumSizeLow: DWORD, lpName: LPSTR): HANDLE {
    return Kernel32.Load('CreateFileMappingA')(hFile, lpFileMappingAttributes, flProtect, dwMaximumSizeHigh, dwMaximumSizeLow, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilemappingfromapp
  public static CreateFileMappingFromApp(hFile: HANDLE, SecurityAttributes: LPVOID, PageProtection: DWORD, MaximumSize: ULONGLONG, Name: LPWSTR): HANDLE {
    return Kernel32.Load('CreateFileMappingFromApp')(hFile, SecurityAttributes, PageProtection, MaximumSize, Name);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilemappingnumaa
  public static CreateFileMappingNumaA(hFile: HANDLE, lpFileMappingAttributes: LPVOID, flProtect: DWORD, dwMaximumSizeHigh: DWORD, dwMaximumSizeLow: DWORD, lpName: LPSTR, nndPreferred: DWORD): HANDLE {
    return Kernel32.Load('CreateFileMappingNumaA')(hFile, lpFileMappingAttributes, flProtect, dwMaximumSizeHigh, dwMaximumSizeLow, lpName, nndPreferred);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilemappingnumaw
  public static CreateFileMappingNumaW(hFile: HANDLE, lpFileMappingAttributes: LPVOID, flProtect: DWORD, dwMaximumSizeHigh: DWORD, dwMaximumSizeLow: DWORD, lpName: LPWSTR, nndPreferred: DWORD): HANDLE {
    return Kernel32.Load('CreateFileMappingNumaW')(hFile, lpFileMappingAttributes, flProtect, dwMaximumSizeHigh, dwMaximumSizeLow, lpName, nndPreferred);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-createfilemappingw
  public static CreateFileMappingW(hFile: HANDLE, lpFileMappingAttributes: LPVOID, flProtect: DWORD, dwMaximumSizeHigh: DWORD, dwMaximumSizeLow: DWORD, lpName: LPWSTR): HANDLE {
    return Kernel32.Load('CreateFileMappingW')(hFile, lpFileMappingAttributes, flProtect, dwMaximumSizeHigh, dwMaximumSizeLow, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfiletransacteda
  public static CreateFileTransactedA(
    lpFileName: LPSTR,
    dwDesiredAccess: DWORD,
    dwShareMode: DWORD,
    lpSecurityAttributes: LPVOID,
    dwCreationDisposition: DWORD,
    dwFlagsAndAttributes: DWORD,
    hTemplateFile: HANDLE,
    hTransaction: HANDLE,
    pusMiniVersion: LPVOID,
    lpExtendedParameter: LPVOID,
  ): HANDLE {
    return Kernel32.Load('CreateFileTransactedA')(lpFileName, dwDesiredAccess, dwShareMode, lpSecurityAttributes, dwCreationDisposition, dwFlagsAndAttributes, hTemplateFile, hTransaction, pusMiniVersion, lpExtendedParameter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfiletransactedw
  public static CreateFileTransactedW(
    lpFileName: LPWSTR,
    dwDesiredAccess: DWORD,
    dwShareMode: DWORD,
    lpSecurityAttributes: LPVOID,
    dwCreationDisposition: DWORD,
    dwFlagsAndAttributes: DWORD,
    hTemplateFile: HANDLE,
    hTransaction: HANDLE,
    pusMiniVersion: LPVOID,
    lpExtendedParameter: LPVOID,
  ): HANDLE {
    return Kernel32.Load('CreateFileTransactedW')(lpFileName, dwDesiredAccess, dwShareMode, lpSecurityAttributes, dwCreationDisposition, dwFlagsAndAttributes, hTemplateFile, hTransaction, pusMiniVersion, lpExtendedParameter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew
  public static CreateFileW(lpFileName: LPWSTR, dwDesiredAccess: DWORD, dwShareMode: DWORD, lpSecurityAttributes: LPVOID, dwCreationDisposition: DWORD, dwFlagsAndAttributes: DWORD, hTemplateFile: HANDLE): HANDLE {
    return Kernel32.Load('CreateFileW')(lpFileName, dwDesiredAccess, dwShareMode, lpSecurityAttributes, dwCreationDisposition, dwFlagsAndAttributes, hTemplateFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createhardlinka
  public static CreateHardLinkA(lpFileName: LPSTR, lpExistingFileName: LPSTR, lpSecurityAttributes: LPVOID): BOOL {
    return Kernel32.Load('CreateHardLinkA')(lpFileName, lpExistingFileName, lpSecurityAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createhardlinktransacteda
  public static CreateHardLinkTransactedA(lpFileName: LPSTR, lpExistingFileName: LPSTR, lpSecurityAttributes: LPVOID, hTransaction: HANDLE): BOOL {
    return Kernel32.Load('CreateHardLinkTransactedA')(lpFileName, lpExistingFileName, lpSecurityAttributes, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createhardlinktransactedw
  public static CreateHardLinkTransactedW(lpFileName: LPWSTR, lpExistingFileName: LPWSTR, lpSecurityAttributes: LPVOID, hTransaction: HANDLE): BOOL {
    return Kernel32.Load('CreateHardLinkTransactedW')(lpFileName, lpExistingFileName, lpSecurityAttributes, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createhardlinkw
  public static CreateHardLinkW(lpFileName: LPWSTR, lpExistingFileName: LPWSTR, lpSecurityAttributes: LPVOID): BOOL {
    return Kernel32.Load('CreateHardLinkW')(lpFileName, lpExistingFileName, lpSecurityAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-createiocompletionport
  public static CreateIoCompletionPort(FileHandle: HANDLE, ExistingCompletionPort: HANDLE, CompletionKey: LPVOID, NumberOfConcurrentThreads: DWORD): HANDLE {
    return Kernel32.Load('CreateIoCompletionPort')(FileHandle, ExistingCompletionPort, CompletionKey, NumberOfConcurrentThreads);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/jobapi/nf-jobapi-createjobobjecta
  public static CreateJobObjectA(lpJobAttributes: LPVOID, lpName: LPSTR): HANDLE {
    return Kernel32.Load('CreateJobObjectA')(lpJobAttributes, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/jobapi/nf-jobapi-createjobobjectw
  public static CreateJobObjectW(lpJobAttributes: LPVOID, lpName: LPWSTR): HANDLE {
    return Kernel32.Load('CreateJobObjectW')(lpJobAttributes, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createjobset
  public static CreateJobSet(NumJob: DWORD, UserJobSet: LPVOID, Flags: DWORD): BOOL {
    return Kernel32.Load('CreateJobSet')(NumJob, UserJobSet, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createmailslota
  public static CreateMailslotA(lpName: LPCSTR, nMaxMessageSize: DWORD, lReadTimeout: DWORD, lpSecurityAttributes: LPSECURITY_ATTRIBUTES): HANDLE {
    return Kernel32.Load('CreateMailslotA')(lpName, nMaxMessageSize, lReadTimeout, lpSecurityAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createmailslotw
  public static CreateMailslotW(lpName: LPCWSTR, nMaxMessageSize: DWORD, lReadTimeout: DWORD, lpSecurityAttributes: LPSECURITY_ATTRIBUTES): HANDLE {
    return Kernel32.Load('CreateMailslotW')(lpName, nMaxMessageSize, lReadTimeout, lpSecurityAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-creatememoryresourcenotification
  public static CreateMemoryResourceNotification(NotificationType: DWORD): HANDLE {
    return Kernel32.Load('CreateMemoryResourceNotification')(NotificationType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-createmutexa
  public static CreateMutexA(lpMutexAttributes: LPSECURITY_ATTRIBUTES, bInitialOwner: BOOL, lpName: LPCSTR): HANDLE {
    return Kernel32.Load('CreateMutexA')(lpMutexAttributes, bInitialOwner, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-createmutexexa
  public static CreateMutexExA(lpMutexAttributes: LPSECURITY_ATTRIBUTES, lpName: LPCSTR, dwFlags: DWORD, dwDesiredAccess: DWORD): HANDLE {
    return Kernel32.Load('CreateMutexExA')(lpMutexAttributes, lpName, dwFlags, dwDesiredAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-createmutexexw
  public static CreateMutexExW(lpMutexAttributes: LPSECURITY_ATTRIBUTES, lpName: LPCWSTR, dwFlags: DWORD, dwDesiredAccess: DWORD): HANDLE {
    return Kernel32.Load('CreateMutexExW')(lpMutexAttributes, lpName, dwFlags, dwDesiredAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-createmutexw
  public static CreateMutexW(lpMutexAttributes: LPSECURITY_ATTRIBUTES, bInitialOwner: BOOL, lpName: LPCWSTR): HANDLE {
    return Kernel32.Load('CreateMutexW')(lpMutexAttributes, bInitialOwner, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-createnamedpipea
  public static CreateNamedPipeA(lpName: LPCSTR, dwOpenMode: DWORD, dwPipeMode: DWORD, nMaxInstances: DWORD, nOutBufferSize: DWORD, nInBufferSize: DWORD, nDefaultTimeOut: DWORD, lpSecurityAttributes: LPSECURITY_ATTRIBUTES): HANDLE {
    return Kernel32.Load('CreateNamedPipeA')(lpName, dwOpenMode, dwPipeMode, nMaxInstances, nOutBufferSize, nInBufferSize, nDefaultTimeOut, lpSecurityAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-createnamedpipew
  public static CreateNamedPipeW(lpName: LPCWSTR, dwOpenMode: DWORD, dwPipeMode: DWORD, nMaxInstances: DWORD, nOutBufferSize: DWORD, nInBufferSize: DWORD, nDefaultTimeOut: DWORD, lpSecurityAttributes: LPSECURITY_ATTRIBUTES): HANDLE {
    return Kernel32.Load('CreateNamedPipeW')(lpName, dwOpenMode, dwPipeMode, nMaxInstances, nOutBufferSize, nInBufferSize, nDefaultTimeOut, lpSecurityAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createpackagevirtualizationcontext
  public static CreatePackageVirtualizationContext(packageFamilyName: LPWSTR, context: LPVOID): DWORD {
    return Kernel32.Load('CreatePackageVirtualizationContext')(packageFamilyName, context);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-createpipe
  public static CreatePipe(hReadPipe: LPHANDLE, hWritePipe: LPHANDLE, lpPipeAttributes: LPSECURITY_ATTRIBUTES, nSize: DWORD): BOOL {
    return Kernel32.Load('CreatePipe')(hReadPipe, hWritePipe, lpPipeAttributes, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createprivatenamespacea
  public static CreatePrivateNamespaceA(lpPrivateNamespaceAttributes: LPSECURITY_ATTRIBUTES, lpBoundaryDescriptor: LPVOID, lpAliasPrefix: LPCSTR): HANDLE {
    return Kernel32.Load('CreatePrivateNamespaceA')(lpPrivateNamespaceAttributes, lpBoundaryDescriptor, lpAliasPrefix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createprivatenamespacew
  public static CreatePrivateNamespaceW(lpPrivateNamespaceAttributes: LPSECURITY_ATTRIBUTES, lpBoundaryDescriptor: LPVOID, lpAliasPrefix: LPCWSTR): HANDLE {
    return Kernel32.Load('CreatePrivateNamespaceW')(lpPrivateNamespaceAttributes, lpBoundaryDescriptor, lpAliasPrefix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessa
  public static CreateProcessA(
    lpApplicationName: LPCSTR,
    lpCommandLine: LPSTR,
    lpProcessAttributes: LPSECURITY_ATTRIBUTES,
    lpThreadAttributes: LPSECURITY_ATTRIBUTES,
    bInheritHandles: BOOL,
    dwCreationFlags: DWORD,
    lpEnvironment: LPVOID,
    lpCurrentDirectory: LPCSTR,
    lpStartupInfo: LPSTARTUPINFOA,
    lpProcessInformation: LPPROCESS_INFORMATION,
  ): BOOL {
    return Kernel32.Load('CreateProcessA')(lpApplicationName, lpCommandLine, lpProcessAttributes, lpThreadAttributes, bInheritHandles, dwCreationFlags, lpEnvironment, lpCurrentDirectory, lpStartupInfo, lpProcessInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessw
  public static CreateProcessW(
    lpApplicationName: LPCWSTR,
    lpCommandLine: LPWSTR,
    lpProcessAttributes: LPSECURITY_ATTRIBUTES,
    lpThreadAttributes: LPSECURITY_ATTRIBUTES,
    bInheritHandles: BOOL,
    dwCreationFlags: DWORD,
    lpEnvironment: LPVOID,
    lpCurrentDirectory: LPCWSTR,
    lpStartupInfo: LPSTARTUPINFOW,
    lpProcessInformation: LPPROCESS_INFORMATION,
  ): BOOL {
    return Kernel32.Load('CreateProcessW')(lpApplicationName, lpCommandLine, lpProcessAttributes, lpThreadAttributes, bInheritHandles, dwCreationFlags, lpEnvironment, lpCurrentDirectory, lpStartupInfo, lpProcessInformation);
  }

  // https://learn.microsoft.com/en-us/windows/console/createpseudoconsole
  public static CreatePseudoConsole(size: COORD, hInput: HANDLE, hOutput: HANDLE, dwFlags: DWORD, phPC: PHPCON): HRESULT {
    return Kernel32.Load('CreatePseudoConsole')(size, hInput, hOutput, dwFlags, phPC);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createremotethread
  public static CreateRemoteThread(
    hProcess: HANDLE,
    lpThreadAttributes: LPSECURITY_ATTRIBUTES | NULL,
    dwStackSize: SIZE_T,
    lpStartAddress: LPTHREAD_START_ROUTINE,
    lpParameter: bigint,
    dwCreationFlags: DWORD,
    lpThreadId: LPDWORD | NULL,
  ): HANDLE {
    return Kernel32.Load('CreateRemoteThread')(hProcess, lpThreadAttributes, dwStackSize, lpStartAddress, lpParameter, dwCreationFlags, lpThreadId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createremotethreadex
  public static CreateRemoteThreadEx(
    hProcess: HANDLE,
    lpThreadAttributes: LPSECURITY_ATTRIBUTES,
    dwStackSize: SIZE_T,
    lpStartAddress: LPTHREAD_START_ROUTINE,
    lpParameter: bigint,
    dwCreationFlags: DWORD,
    lpAttributeList: LPPROC_THREAD_ATTRIBUTE_LIST,
    lpThreadId: LPDWORD,
  ): HANDLE {
    return Kernel32.Load('CreateRemoteThreadEx')(hProcess, lpThreadAttributes, dwStackSize, lpStartAddress, lpParameter, dwCreationFlags, lpAttributeList, lpThreadId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-createsemaphorea
  public static CreateSemaphoreA(lpSemaphoreAttributes: LPSECURITY_ATTRIBUTES, lInitialCount: LONG, lMaximumCount: LONG, lpName: LPCSTR): HANDLE {
    return Kernel32.Load('CreateSemaphoreA')(lpSemaphoreAttributes, lInitialCount, lMaximumCount, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-createsemaphoreexa
  public static CreateSemaphoreExA(lpSemaphoreAttributes: LPSECURITY_ATTRIBUTES, lInitialCount: LONG, lMaximumCount: LONG, lpName: LPCSTR, dwFlags: DWORD, dwDesiredAccess: DWORD): HANDLE {
    return Kernel32.Load('CreateSemaphoreExA')(lpSemaphoreAttributes, lInitialCount, lMaximumCount, lpName, dwFlags, dwDesiredAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-createsemaphoreexw
  public static CreateSemaphoreExW(lpSemaphoreAttributes: LPSECURITY_ATTRIBUTES, lInitialCount: LONG, lMaximumCount: LONG, lpName: LPCWSTR, dwFlags: DWORD, dwDesiredAccess: DWORD): HANDLE {
    return Kernel32.Load('CreateSemaphoreExW')(lpSemaphoreAttributes, lInitialCount, lMaximumCount, lpName, dwFlags, dwDesiredAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-createsemaphorew
  public static CreateSemaphoreW(lpSemaphoreAttributes: LPSECURITY_ATTRIBUTES, lInitialCount: LONG, lMaximumCount: LONG, lpName: LPCWSTR): HANDLE {
    return Kernel32.Load('CreateSemaphoreW')(lpSemaphoreAttributes, lInitialCount, lMaximumCount, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createsymboliclinka
  public static CreateSymbolicLinkA(lpSymlinkFileName: LPCSTR, lpTargetFileName: LPCSTR, dwFlags: DWORD): BOOLEAN {
    return Kernel32.Load('CreateSymbolicLinkA')(lpSymlinkFileName, lpTargetFileName, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createsymboliclinktransacteda
  public static CreateSymbolicLinkTransactedA(lpSymlinkFileName: LPCSTR, lpTargetFileName: LPCSTR, dwFlags: DWORD, hTransaction: HANDLE): BOOLEAN {
    return Kernel32.Load('CreateSymbolicLinkTransactedA')(lpSymlinkFileName, lpTargetFileName, dwFlags, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createsymboliclinktransactedw
  public static CreateSymbolicLinkTransactedW(lpSymlinkFileName: LPCWSTR, lpTargetFileName: LPCWSTR, dwFlags: DWORD, hTransaction: HANDLE): BOOLEAN {
    return Kernel32.Load('CreateSymbolicLinkTransactedW')(lpSymlinkFileName, lpTargetFileName, dwFlags, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createsymboliclinkw
  public static CreateSymbolicLinkW(lpSymlinkFileName: LPCWSTR, lpTargetFileName: LPCWSTR, dwFlags: DWORD): BOOLEAN {
    return Kernel32.Load('CreateSymbolicLinkW')(lpSymlinkFileName, lpTargetFileName, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createtapepartition
  public static CreateTapePartition(hDevice: HANDLE, dwPartitionMethod: DWORD, dwCount: DWORD, dwSize: DWORD): DWORD {
    return Kernel32.Load('CreateTapePartition')(hDevice, dwPartitionMethod, dwCount, dwSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createthread
  public static CreateThread(lpThreadAttributes: LPSECURITY_ATTRIBUTES, dwStackSize: SIZE_T, lpStartAddress: LPTHREAD_START_ROUTINE, lpParameter: LPVOID, dwCreationFlags: DWORD, lpThreadId: LPDWORD): HANDLE {
    return Kernel32.Load('CreateThread')(lpThreadAttributes, dwStackSize, lpStartAddress, lpParameter, dwCreationFlags, lpThreadId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createthreadpool
  public static CreateThreadpool(reserved: LPVOID): DWORD {
    return Kernel32.Load('CreateThreadpool')(reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createthreadpoolcleanupgroup
  public static CreateThreadpoolCleanupGroup(): DWORD {
    return Kernel32.Load('CreateThreadpoolCleanupGroup')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createthreadpoolio
  public static CreateThreadpoolIo(fl: HANDLE, pfnio: DWORD, pv: LPVOID, pcbe: LPVOID): DWORD {
    return Kernel32.Load('CreateThreadpoolIo')(fl, pfnio, pv, pcbe);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createthreadpooltimer
  public static CreateThreadpoolTimer(pfnti: DWORD, pv: LPVOID, pcbe: LPVOID): DWORD {
    return Kernel32.Load('CreateThreadpoolTimer')(pfnti, pv, pcbe);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createthreadpoolwait
  public static CreateThreadpoolWait(pfnwa: DWORD, pv: LPVOID, pcbe: LPVOID): DWORD {
    return Kernel32.Load('CreateThreadpoolWait')(pfnwa, pv, pcbe);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createthreadpoolwork
  public static CreateThreadpoolWork(pfnwk: DWORD, pv: LPVOID, pcbe: LPVOID): DWORD {
    return Kernel32.Load('CreateThreadpoolWork')(pfnwk, pv, pcbe);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createtimerqueue
  public static CreateTimerQueue(): HANDLE {
    return Kernel32.Load('CreateTimerQueue')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createtimerqueuetimer
  public static CreateTimerQueueTimer(phNewTimer: LPVOID, TimerQueue: HANDLE, Callback: DWORD, Parameter: LPVOID, DueTime: DWORD, Period: DWORD, Flags: DWORD): BOOL {
    return Kernel32.Load('CreateTimerQueueTimer')(phNewTimer, TimerQueue, Callback, Parameter, DueTime, Period, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tlhelp32/nf-tlhelp32-createtoolhelp32snapshot
  public static CreateToolhelp32Snapshot(dwFlags: DWORD, th32ProcessID: DWORD): HANDLE {
    return Kernel32.Load('CreateToolhelp32Snapshot')(dwFlags, th32ProcessID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createumscompletionlist
  public static CreateUmsCompletionList(UmsCompletionList: LPVOID): BOOL {
    return Kernel32.Load('CreateUmsCompletionList')(UmsCompletionList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createumsthreadcontext
  public static CreateUmsThreadContext(lpUmsThread: LPVOID): BOOL {
    return Kernel32.Load('CreateUmsThreadContext')(lpUmsThread);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createwaitabletimera
  public static CreateWaitableTimerA(lpTimerAttributes: LPVOID, bManualReset: BOOL, lpTimerName: LPSTR): HANDLE {
    return Kernel32.Load('CreateWaitableTimerA')(lpTimerAttributes, bManualReset, lpTimerName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createwaitabletimerexa
  public static CreateWaitableTimerExA(lpTimerAttributes: LPVOID, lpTimerName: LPSTR, dwFlags: DWORD, dwDesiredAccess: DWORD): HANDLE {
    return Kernel32.Load('CreateWaitableTimerExA')(lpTimerAttributes, lpTimerName, dwFlags, dwDesiredAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createwaitabletimerexw
  public static CreateWaitableTimerExW(lpTimerAttributes: LPVOID, lpTimerName: LPWSTR, dwFlags: DWORD, dwDesiredAccess: DWORD): HANDLE {
    return Kernel32.Load('CreateWaitableTimerExW')(lpTimerAttributes, lpTimerName, dwFlags, dwDesiredAccess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createwaitabletimerw
  public static CreateWaitableTimerW(lpTimerAttributes: LPVOID, bManualReset: BOOL, lpTimerName: LPWSTR): HANDLE {
    return Kernel32.Load('CreateWaitableTimerW')(lpTimerAttributes, bManualReset, lpTimerName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-deactivateactctx
  public static DeactivateActCtx(dwFlags: DWORD, ulCookie: LPVOID): BOOL {
    return Kernel32.Load('DeactivateActCtx')(dwFlags, ulCookie);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-deactivatepackagevirtualizationcontext
  public static DeactivatePackageVirtualizationContext(cookie: LPVOID): VOID {
    return Kernel32.Load('DeactivatePackageVirtualizationContext')(cookie);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-debugactiveprocess
  public static DebugActiveProcess(dwProcessId: DWORD): BOOL {
    return Kernel32.Load('DebugActiveProcess')(dwProcessId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-debugactiveprocessstop
  public static DebugActiveProcessStop(dwProcessId: DWORD): BOOL {
    return Kernel32.Load('DebugActiveProcessStop')(dwProcessId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-debugbreak
  public static DebugBreak(): VOID {
    return Kernel32.Load('DebugBreak')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-debugbreakprocess
  public static DebugBreakProcess(Process: HANDLE): BOOL {
    return Kernel32.Load('DebugBreakProcess')(Process);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-debugsetprocesskillonexit
  public static DebugSetProcessKillOnExit(KillOnExit: BOOL): BOOL {
    return Kernel32.Load('DebugSetProcessKillOnExit')(KillOnExit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-decodepointer
  public static DecodePointer(Ptr: LPVOID): LPVOID {
    return Kernel32.Load('DecodePointer')(Ptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-decodesystempointer
  public static DecodeSystemPointer(Ptr: LPVOID): LPVOID {
    return Kernel32.Load('DecodeSystemPointer')(Ptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-definedosdevicea
  public static DefineDosDeviceA(dwFlags: DWORD, lpDeviceName: LPSTR, lpTargetPath: LPSTR): BOOL {
    return Kernel32.Load('DefineDosDeviceA')(dwFlags, lpDeviceName, lpTargetPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-definedosdevicew
  public static DefineDosDeviceW(dwFlags: DWORD, lpDeviceName: LPWSTR, lpTargetPath: LPWSTR): BOOL {
    return Kernel32.Load('DefineDosDeviceW')(dwFlags, lpDeviceName, lpTargetPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-deleteatom
  public static DeleteAtom(nAtom: USHORT): USHORT {
    return Kernel32.Load('DeleteAtom')(nAtom);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-deleteboundarydescriptor
  public static DeleteBoundaryDescriptor(BoundaryDescriptor: HANDLE): VOID {
    return Kernel32.Load('DeleteBoundaryDescriptor')(BoundaryDescriptor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-deletecriticalsection
  public static DeleteCriticalSection(lpCriticalSection: LPVOID): VOID {
    return Kernel32.Load('DeleteCriticalSection')(lpCriticalSection);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-deletefiber
  public static DeleteFiber(lpFiber: LPVOID): VOID {
    return Kernel32.Load('DeleteFiber')(lpFiber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-deletefile2a
  public static DeleteFile2A(lpFileName: LPSTR, Flags: DWORD): BOOL {
    return Kernel32.Load('DeleteFile2A')(lpFileName, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-deletefile2w
  public static DeleteFile2W(lpFileName: LPWSTR, Flags: DWORD): BOOL {
    return Kernel32.Load('DeleteFile2W')(lpFileName, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-deletefilea
  public static DeleteFileA(lpFileName: LPSTR): BOOL {
    return Kernel32.Load('DeleteFileA')(lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-deletefiletransacteda
  public static DeleteFileTransactedA(lpFileName: LPSTR, hTransaction: HANDLE): BOOL {
    return Kernel32.Load('DeleteFileTransactedA')(lpFileName, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-deletefiletransactedw
  public static DeleteFileTransactedW(lpFileName: LPWSTR, hTransaction: HANDLE): BOOL {
    return Kernel32.Load('DeleteFileTransactedW')(lpFileName, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-deletefilew
  public static DeleteFileW(lpFileName: LPWSTR): BOOL {
    return Kernel32.Load('DeleteFileW')(lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-deleteprocthreadattributelist
  public static DeleteProcThreadAttributeList(lpAttributeList: DWORD): VOID {
    return Kernel32.Load('DeleteProcThreadAttributeList')(lpAttributeList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-deletesynchronizationbarrier
  public static DeleteSynchronizationBarrier(lpBarrier: LPVOID): BOOL {
    return Kernel32.Load('DeleteSynchronizationBarrier')(lpBarrier);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-deletetimerqueue
  public static DeleteTimerQueue(TimerQueue: HANDLE): BOOL {
    return Kernel32.Load('DeleteTimerQueue')(TimerQueue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-deletetimerqueueex
  public static DeleteTimerQueueEx(TimerQueue: HANDLE, CompletionEvent: HANDLE): BOOL {
    return Kernel32.Load('DeleteTimerQueueEx')(TimerQueue, CompletionEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-deletetimerqueuetimer
  public static DeleteTimerQueueTimer(TimerQueue: HANDLE, Timer: HANDLE, CompletionEvent: HANDLE): BOOL {
    return Kernel32.Load('DeleteTimerQueueTimer')(TimerQueue, Timer, CompletionEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-deleteumscompletionlist
  public static DeleteUmsCompletionList(UmsCompletionList: LPVOID): BOOL {
    return Kernel32.Load('DeleteUmsCompletionList')(UmsCompletionList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-deleteumsthreadcontext
  public static DeleteUmsThreadContext(UmsThread: LPVOID): BOOL {
    return Kernel32.Load('DeleteUmsThreadContext')(UmsThread);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-deletevolumemountpointa
  public static DeleteVolumeMountPointA(lpszVolumeMountPoint: LPSTR): BOOL {
    return Kernel32.Load('DeleteVolumeMountPointA')(lpszVolumeMountPoint);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-deletevolumemountpointw
  public static DeleteVolumeMountPointW(lpszVolumeMountPoint: LPWSTR): BOOL {
    return Kernel32.Load('DeleteVolumeMountPointW')(lpszVolumeMountPoint);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-dequeueumscompletionlistitems
  public static DequeueUmsCompletionListItems(UmsCompletionList: LPVOID, WaitTimeOut: DWORD, UmsThreadList: LPVOID): BOOL {
    return Kernel32.Load('DequeueUmsCompletionListItems')(UmsCompletionList, WaitTimeOut, UmsThreadList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-deviceiocontrol
  public static DeviceIoControl(hDevice: HANDLE, dwIoControlCode: DWORD, lpInBuffer: LPVOID, nInBufferSize: DWORD, lpOutBuffer: LPVOID, nOutBufferSize: DWORD, lpBytesReturned: LPVOID, lpOverlapped: LPVOID): BOOL {
    return Kernel32.Load('DeviceIoControl')(hDevice, dwIoControlCode, lpInBuffer, nInBufferSize, lpOutBuffer, nOutBufferSize, lpBytesReturned, lpOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-disablethreadlibrarycalls
  public static DisableThreadLibraryCalls(hLibModule: HMODULE): BOOL {
    return Kernel32.Load('DisableThreadLibraryCalls')(hLibModule);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-disablethreadprofiling
  public static DisableThreadProfiling(PerformanceDataHandle: HANDLE): DWORD {
    return Kernel32.Load('DisableThreadProfiling')(PerformanceDataHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-disassociatecurrentthreadfromcallback
  public static DisassociateCurrentThreadFromCallback(pci: DWORD): VOID {
    return Kernel32.Load('DisassociateCurrentThreadFromCallback')(pci);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-discardvirtualmemory
  public static DiscardVirtualMemory(VirtualAddress: bigint, Size: bigint): DWORD {
    return Kernel32.Load('DiscardVirtualMemory')(VirtualAddress, Size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-disconnectnamedpipe
  public static DisconnectNamedPipe(hNamedPipe: HANDLE): BOOL {
    return Kernel32.Load('DisconnectNamedPipe')(hNamedPipe);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-dnshostnametocomputernamea
  public static DnsHostnameToComputerNameA(Hostname: LPSTR, ComputerName: LPSTR, nSize: LPVOID): BOOL {
    return Kernel32.Load('DnsHostnameToComputerNameA')(Hostname, ComputerName, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-dnshostnametocomputernameexw
  public static DnsHostnameToComputerNameExW(Hostname: LPWSTR, ComputerName: LPWSTR, nSize: LPVOID): BOOL {
    return Kernel32.Load('DnsHostnameToComputerNameExW')(Hostname, ComputerName, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-dnshostnametocomputernamew
  public static DnsHostnameToComputerNameW(Hostname: LPWSTR, ComputerName: LPWSTR, nSize: LPVOID): BOOL {
    return Kernel32.Load('DnsHostnameToComputerNameW')(Hostname, ComputerName, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-dosdatetimetofiletime
  public static DosDateTimeToFileTime(wFatDate: USHORT, wFatTime: USHORT, lpFileTime: LPVOID): BOOL {
    return Kernel32.Load('DosDateTimeToFileTime')(wFatDate, wFatTime, lpFileTime);
  }

  // https://learn.microsoft.com/en-us/windows/console/duplicateconsolehandle
  public static DuplicateConsoleHandle(hSourceHandle: HANDLE, dwDesiredAccess: DWORD, bInheritHandle: BOOL, dwOptions: DWORD): HANDLE {
    return Kernel32.Load('DuplicateConsoleHandle')(hSourceHandle, dwDesiredAccess, bInheritHandle, dwOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/handleapi/nf-handleapi-duplicatehandle
  public static DuplicateHandle(hSourceProcessHandle: HANDLE, hSourceHandle: HANDLE, hTargetProcessHandle: HANDLE, lpTargetHandle: LPVOID, dwDesiredAccess: DWORD, bInheritHandle: BOOL, dwOptions: DWORD): BOOL {
    return Kernel32.Load('DuplicateHandle')(hSourceProcessHandle, hSourceHandle, hTargetProcessHandle, lpTargetHandle, dwDesiredAccess, bInheritHandle, dwOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-duplicatepackagevirtualizationcontext
  public static DuplicatePackageVirtualizationContext(sourceContext: DWORD, destContext: LPVOID): DWORD {
    return Kernel32.Load('DuplicatePackageVirtualizationContext')(sourceContext, destContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enableprocessoptionalxstatefeatures
  public static EnableProcessOptionalXStateFeatures(Features: ULONGLONG): BOOL {
    return Kernel32.Load('EnableProcessOptionalXStateFeatures')(Features);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enablethreadprofiling
  public static EnableThreadProfiling(ThreadHandle: HANDLE, Flags: DWORD, HardwareCounters: ULONGLONG, PerformanceDataHandle: LPVOID): DWORD {
    return Kernel32.Load('EnableThreadProfiling')(ThreadHandle, Flags, HardwareCounters, PerformanceDataHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-encodepointer
  public static EncodePointer(Ptr: LPVOID): LPVOID {
    return Kernel32.Load('EncodePointer')(Ptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-encodesystempointer
  public static EncodeSystemPointer(Ptr: LPVOID): LPVOID {
    return Kernel32.Load('EncodeSystemPointer')(Ptr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-endupdateresourcea
  public static EndUpdateResourceA(hUpdate: HANDLE, fDiscard: BOOL): BOOL {
    return Kernel32.Load('EndUpdateResourceA')(hUpdate, fDiscard);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-endupdateresourcew
  public static EndUpdateResourceW(hUpdate: HANDLE, fDiscard: BOOL): BOOL {
    return Kernel32.Load('EndUpdateResourceW')(hUpdate, fDiscard);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-entercriticalsection
  public static EnterCriticalSection(lpCriticalSection: LPVOID): VOID {
    return Kernel32.Load('EnterCriticalSection')(lpCriticalSection);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-entersynchronizationbarrier
  public static EnterSynchronizationBarrier(lpBarrier: LPVOID, dwFlags: DWORD): BOOL {
    return Kernel32.Load('EnterSynchronizationBarrier')(lpBarrier, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enterumsschedulingmode
  public static EnterUmsSchedulingMode(SchedulerStartupInfo: LPVOID): BOOL {
    return Kernel32.Load('EnterUmsSchedulingMode')(SchedulerStartupInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-enumcalendarinfoa
  public static EnumCalendarInfoA(lpCalInfoEnumProc: DWORD, Locale: DWORD, Calendar: DWORD, CalType: DWORD): BOOL {
    return Kernel32.Load('EnumCalendarInfoA')(lpCalInfoEnumProc, Locale, Calendar, CalType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enumcalendarinfoexa
  public static EnumCalendarInfoExA(lpCalInfoEnumProcEx: DWORD, Locale: DWORD, Calendar: DWORD, CalType: DWORD): BOOL {
    return Kernel32.Load('EnumCalendarInfoExA')(lpCalInfoEnumProcEx, Locale, Calendar, CalType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enumcalendarinfoexex
  public static EnumCalendarInfoExEx(pCalInfoEnumProcExEx: DWORD, lpLocaleName: LPWSTR, Calendar: DWORD, lpReserved: LPWSTR, CalType: DWORD, lParam: DWORD): BOOL {
    return Kernel32.Load('EnumCalendarInfoExEx')(pCalInfoEnumProcExEx, lpLocaleName, Calendar, lpReserved, CalType, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enumcalendarinfoexw
  public static EnumCalendarInfoExW(lpCalInfoEnumProcEx: DWORD, Locale: DWORD, Calendar: DWORD, CalType: DWORD): BOOL {
    return Kernel32.Load('EnumCalendarInfoExW')(lpCalInfoEnumProcEx, Locale, Calendar, CalType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-enumcalendarinfow
  public static EnumCalendarInfoW(lpCalInfoEnumProc: DWORD, Locale: DWORD, Calendar: DWORD, CalType: DWORD): BOOL {
    return Kernel32.Load('EnumCalendarInfoW')(lpCalInfoEnumProc, Locale, Calendar, CalType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-enumdateformatsa
  public static EnumDateFormatsA(lpDateFmtEnumProc: DWORD, Locale: DWORD, dwFlags: DWORD): BOOL {
    return Kernel32.Load('EnumDateFormatsA')(lpDateFmtEnumProc, Locale, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enumdateformatsexa
  public static EnumDateFormatsExA(lpDateFmtEnumProcEx: DWORD, Locale: DWORD, dwFlags: DWORD): BOOL {
    return Kernel32.Load('EnumDateFormatsExA')(lpDateFmtEnumProcEx, Locale, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enumdateformatsexex
  public static EnumDateFormatsExEx(lpDateFmtEnumProcExEx: DWORD, lpLocaleName: LPWSTR, dwFlags: DWORD, lParam: DWORD): BOOL {
    return Kernel32.Load('EnumDateFormatsExEx')(lpDateFmtEnumProcExEx, lpLocaleName, dwFlags, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enumdateformatsexw
  public static EnumDateFormatsExW(lpDateFmtEnumProcEx: DWORD, Locale: DWORD, dwFlags: DWORD): BOOL {
    return Kernel32.Load('EnumDateFormatsExW')(lpDateFmtEnumProcEx, Locale, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-enumdateformatsw
  public static EnumDateFormatsW(lpDateFmtEnumProc: DWORD, Locale: DWORD, dwFlags: DWORD): BOOL {
    return Kernel32.Load('EnumDateFormatsW')(lpDateFmtEnumProc, Locale, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enumlanguagegrouplocalesa
  public static EnumLanguageGroupLocalesA(lpLangGroupLocaleEnumProc: DWORD, LanguageGroup: DWORD, dwFlags: DWORD, lParam: LPVOID): BOOL {
    return Kernel32.Load('EnumLanguageGroupLocalesA')(lpLangGroupLocaleEnumProc, LanguageGroup, dwFlags, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enumlanguagegrouplocalesw
  public static EnumLanguageGroupLocalesW(lpLangGroupLocaleEnumProc: DWORD, LanguageGroup: DWORD, dwFlags: DWORD, lParam: LPVOID): BOOL {
    return Kernel32.Load('EnumLanguageGroupLocalesW')(lpLangGroupLocaleEnumProc, LanguageGroup, dwFlags, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-enumresourcelanguagesa
  public static EnumResourceLanguagesA(hModule: HMODULE, lpType: LPCSTR, lpName: LPCSTR, lpEnumFunc: ENUMRESLANGPROCA, lParam: LONG_PTR): BOOL {
    return Kernel32.Load('EnumResourceLanguagesA')(hModule, lpType, lpName, lpEnumFunc, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-enumresourcelanguagesexa
  public static EnumResourceLanguagesExA(hModule: HMODULE, lpType: LPCSTR, lpName: LPCSTR, lpEnumFunc: ENUMRESLANGPROCA, lParam: LONG_PTR, dwFlags: DWORD, LangId: USHORT): BOOL {
    return Kernel32.Load('EnumResourceLanguagesExA')(hModule, lpType, lpName, lpEnumFunc, lParam, dwFlags, LangId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-enumresourcelanguagesexw
  public static EnumResourceLanguagesExW(hModule: HMODULE, lpType: LPCWSTR, lpName: LPCWSTR, lpEnumFunc: ENUMRESLANGPROCW, lParam: LONG_PTR, dwFlags: DWORD, LangId: USHORT): BOOL {
    return Kernel32.Load('EnumResourceLanguagesExW')(hModule, lpType, lpName, lpEnumFunc, lParam, dwFlags, LangId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-enumresourcelanguagesw
  public static EnumResourceLanguagesW(hModule: HMODULE, lpType: LPCWSTR, lpName: LPCWSTR, lpEnumFunc: ENUMRESLANGPROCW, lParam: LONG_PTR): BOOL {
    return Kernel32.Load('EnumResourceLanguagesW')(hModule, lpType, lpName, lpEnumFunc, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-enumresourcenamesa
  public static EnumResourceNamesA(hModule: HMODULE, lpType: LPCSTR, lpEnumFunc: ENUMRESNAMEPROCA, lParam: LONG_PTR): BOOL {
    return Kernel32.Load('EnumResourceNamesA')(hModule, lpType, lpEnumFunc, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-enumresourcenamesexa
  public static EnumResourceNamesExA(hModule: HMODULE, lpType: LPCSTR, lpEnumFunc: ENUMRESNAMEPROCA, lParam: LONG_PTR, dwFlags: DWORD, LangId: USHORT): BOOL {
    return Kernel32.Load('EnumResourceNamesExA')(hModule, lpType, lpEnumFunc, lParam, dwFlags, LangId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-enumresourcenamesexw
  public static EnumResourceNamesExW(hModule: HMODULE, lpType: LPCWSTR, lpEnumFunc: ENUMRESNAMEPROCW, lParam: LONG_PTR, dwFlags: DWORD, LangId: USHORT): BOOL {
    return Kernel32.Load('EnumResourceNamesExW')(hModule, lpType, lpEnumFunc, lParam, dwFlags, LangId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-enumresourcenamesw
  public static EnumResourceNamesW(hModule: HMODULE, lpType: LPCWSTR, lpEnumFunc: ENUMRESNAMEPROCW, lParam: LONG_PTR): BOOL {
    return Kernel32.Load('EnumResourceNamesW')(hModule, lpType, lpEnumFunc, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-enumresourcetypesa
  public static EnumResourceTypesA(hModule: HMODULE, lpEnumFunc: ENUMRESTYPEPROCA, lParam: LONG_PTR): BOOL {
    return Kernel32.Load('EnumResourceTypesA')(hModule, lpEnumFunc, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-enumresourcetypesexa
  public static EnumResourceTypesExA(hModule: HMODULE, lpEnumFunc: ENUMRESTYPEPROCA, lParam: LONG_PTR, dwFlags: DWORD, LangId: USHORT): BOOL {
    return Kernel32.Load('EnumResourceTypesExA')(hModule, lpEnumFunc, lParam, dwFlags, LangId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-enumresourcetypesexw
  public static EnumResourceTypesExW(hModule: HMODULE, lpEnumFunc: ENUMRESTYPEPROCW, lParam: LONG_PTR, dwFlags: DWORD, LangId: USHORT): BOOL {
    return Kernel32.Load('EnumResourceTypesExW')(hModule, lpEnumFunc, lParam, dwFlags, LangId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-enumresourcetypesw
  public static EnumResourceTypesW(hModule: HMODULE, lpEnumFunc: ENUMRESTYPEPROCW, lParam: LONG_PTR): BOOL {
    return Kernel32.Load('EnumResourceTypesW')(hModule, lpEnumFunc, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enumsystemcodepagesa
  public static EnumSystemCodePagesA(lpCodePageEnumProc: CODEPAGE_ENUMPROC, dwFlags: DWORD): BOOL {
    return Kernel32.Load('EnumSystemCodePagesA')(lpCodePageEnumProc, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enumsystemcodepagesw
  public static EnumSystemCodePagesW(lpCodePageEnumProc: CODEPAGE_ENUMPROC, dwFlags: DWORD): BOOL {
    return Kernel32.Load('EnumSystemCodePagesW')(lpCodePageEnumProc, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enumsystemfirmwaretables
  public static EnumSystemFirmwareTables(FirmwareTableProviderSignature: DWORD, pFirmwareTableEnumBuffer: LPVOID, BufferSize: DWORD): DWORD {
    return Kernel32.Load('EnumSystemFirmwareTables')(FirmwareTableProviderSignature, pFirmwareTableEnumBuffer, BufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enumsystemgeoid
  public static EnumSystemGeoID(GeoClass: DWORD, ParentGeoId: INT, lpGeoEnumProc: GEO_ENUMPROC): BOOL {
    return Kernel32.Load('EnumSystemGeoID')(GeoClass, ParentGeoId, lpGeoEnumProc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enumsystemgeonames
  public static EnumSystemGeoNames(geoClass: DWORD, geoEnumProc: GEO_ENUMNAMEPROC, data: LONG_PTR): BOOL {
    return Kernel32.Load('EnumSystemGeoNames')(geoClass, geoEnumProc, data);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enumsystemlanguagegroupsa
  public static EnumSystemLanguageGroupsA(lpLanguageGroupEnumProc: LANGUAGEGROUP_ENUMPROCA, dwFlags: DWORD, lParam: LONG_PTR): BOOL {
    return Kernel32.Load('EnumSystemLanguageGroupsA')(lpLanguageGroupEnumProc, dwFlags, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enumsystemlanguagegroupsw
  public static EnumSystemLanguageGroupsW(lpLanguageGroupEnumProc: LANGUAGEGROUP_ENUMPROCW, dwFlags: DWORD, lParam: LONG_PTR): BOOL {
    return Kernel32.Load('EnumSystemLanguageGroupsW')(lpLanguageGroupEnumProc, dwFlags, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-enumsystemlocalesa
  public static EnumSystemLocalesA(lpLocaleEnumProc: LOCALE_ENUMPROCA, dwFlags: DWORD): BOOL {
    return Kernel32.Load('EnumSystemLocalesA')(lpLocaleEnumProc, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-enumsystemlocalesex
  public static EnumSystemLocalesEx(lpLocaleEnumProcEx: LOCALE_ENUMPROCEX, dwFlags: DWORD, lParam: LPARAM, lpReserved: LPVOID): BOOL {
    return Kernel32.Load('EnumSystemLocalesEx')(lpLocaleEnumProcEx, dwFlags, lParam, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-enumsystemlocalesw
  public static EnumSystemLocalesW(lpLocaleEnumProc: LOCALE_ENUMPROCW, dwFlags: DWORD): BOOL {
    return Kernel32.Load('EnumSystemLocalesW')(lpLocaleEnumProc, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enumtimeformatsa
  public static EnumTimeFormatsA(lpTimeFmtEnumProc: TIMEFMT_ENUMPROCA, Locale: LCID, dwFlags: DWORD): BOOL {
    return Kernel32.Load('EnumTimeFormatsA')(lpTimeFmtEnumProc, Locale, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enumtimeformatsex
  public static EnumTimeFormatsEx(lpTimeFmtEnumProcEx: TIMEFMT_ENUMPROCEX, lpLocaleName: LPCWSTR, dwFlags: DWORD, lParam: LPARAM): BOOL {
    return Kernel32.Load('EnumTimeFormatsEx')(lpTimeFmtEnumProcEx, lpLocaleName, dwFlags, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enumtimeformatsw
  public static EnumTimeFormatsW(lpTimeFmtEnumProc: TIMEFMT_ENUMPROCW, Locale: LCID, dwFlags: DWORD): BOOL {
    return Kernel32.Load('EnumTimeFormatsW')(lpTimeFmtEnumProc, Locale, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enumuilanguagesa
  public static EnumUILanguagesA(lpUILanguageEnumProc: UILANGUAGE_ENUMPROCA, dwFlags: DWORD, lParam: LONG_PTR): BOOL {
    return Kernel32.Load('EnumUILanguagesA')(lpUILanguageEnumProc, dwFlags, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-enumuilanguagesw
  public static EnumUILanguagesW(lpUILanguageEnumProc: UILANGUAGE_ENUMPROCW, dwFlags: DWORD, lParam: LONG_PTR): BOOL {
    return Kernel32.Load('EnumUILanguagesW')(lpUILanguageEnumProc, dwFlags, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-erasetape
  public static EraseTape(hDevice: HANDLE, dwEraseType: DWORD, bImmediate: BOOL): DWORD {
    return Kernel32.Load('EraseTape')(hDevice, dwEraseType, bImmediate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-escapecommfunction
  public static EscapeCommFunction(hFile: HANDLE, dwFunc: DWORD): BOOL {
    return Kernel32.Load('EscapeCommFunction')(hFile, dwFunc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-executeumsthread
  public static ExecuteUmsThread(UmsThread: LPVOID): BOOL {
    return Kernel32.Load('ExecuteUmsThread')(UmsThread);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-exitprocess
  public static ExitProcess(uExitCode: DWORD): VOID {
    return Kernel32.Load('ExitProcess')(uExitCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-exitthread
  public static ExitThread(dwExitCode: DWORD): VOID {
    return Kernel32.Load('ExitThread')(dwExitCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-expandenvironmentstringsa
  public static ExpandEnvironmentStringsA(lpSrc: LPSTR, lpDst: LPSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('ExpandEnvironmentStringsA')(lpSrc, lpDst, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-expandenvironmentstringsw
  public static ExpandEnvironmentStringsW(lpSrc: LPWSTR, lpDst: LPWSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('ExpandEnvironmentStringsW')(lpSrc, lpDst, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/console/expungeconsolecommandhistory
  public static ExpungeConsoleCommandHistoryA(ExeName: LPSTR): VOID {
    return Kernel32.Load('ExpungeConsoleCommandHistoryA')(ExeName);
  }

  // https://learn.microsoft.com/en-us/windows/console/expungeconsolecommandhistory
  public static ExpungeConsoleCommandHistoryW(ExeName: LPWSTR): VOID {
    return Kernel32.Load('ExpungeConsoleCommandHistoryW')(ExeName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-fatalappexita
  public static FatalAppExitA(uAction: DWORD, lpMessageText: LPSTR): VOID {
    return Kernel32.Load('FatalAppExitA')(uAction, lpMessageText);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-fatalappexitw
  public static FatalAppExitW(uAction: DWORD, lpMessageText: LPWSTR): VOID {
    return Kernel32.Load('FatalAppExitW')(uAction, lpMessageText);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-fatalexit
  public static FatalExit(ExitCode: INT): VOID {
    return Kernel32.Load('FatalExit')(ExitCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-filetimetodosdatetime
  public static FileTimeToDosDateTime(lpFileTime: LPVOID, lpFatDate: LPVOID, lpFatTime: LPVOID): BOOL {
    return Kernel32.Load('FileTimeToDosDateTime')(lpFileTime, lpFatDate, lpFatTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-filetimetolocalfiletime
  public static FileTimeToLocalFileTime(lpFileTime: LPVOID, lpLocalFileTime: LPVOID): BOOL {
    return Kernel32.Load('FileTimeToLocalFileTime')(lpFileTime, lpLocalFileTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/timezoneapi/nf-timezoneapi-filetimetosystemtime
  public static FileTimeToSystemTime(lpFileTime: LPVOID, lpSystemTime: LPVOID): BOOL {
    return Kernel32.Load('FileTimeToSystemTime')(lpFileTime, lpSystemTime);
  }

  // https://learn.microsoft.com/en-us/windows/console/fillconsoleoutputattribute
  public static FillConsoleOutputAttribute(hConsoleOutput: HANDLE, wAttribute: USHORT, nLength: DWORD, dwWriteCoord: DWORD, lpNumberOfAttrsWritten: LPVOID): BOOL {
    return Kernel32.Load('FillConsoleOutputAttribute')(hConsoleOutput, wAttribute, nLength, dwWriteCoord, lpNumberOfAttrsWritten);
  }

  // https://learn.microsoft.com/en-us/windows/console/fillconsoleoutputcharacter
  public static FillConsoleOutputCharacterA(hConsoleOutput: HANDLE, cCharacter: DWORD, nLength: DWORD, dwWriteCoord: DWORD, lpNumberOfCharsWritten: LPVOID): BOOL {
    return Kernel32.Load('FillConsoleOutputCharacterA')(hConsoleOutput, cCharacter, nLength, dwWriteCoord, lpNumberOfCharsWritten);
  }

  // https://learn.microsoft.com/en-us/windows/console/fillconsoleoutputcharacter
  public static FillConsoleOutputCharacterW(hConsoleOutput: HANDLE, cCharacter: LPVOID, nLength: DWORD, dwWriteCoord: DWORD, lpNumberOfCharsWritten: LPVOID): BOOL {
    return Kernel32.Load('FillConsoleOutputCharacterW')(hConsoleOutput, cCharacter, nLength, dwWriteCoord, lpNumberOfCharsWritten);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findactctxsectionguid
  public static FindActCtxSectionGuid(dwFlags: DWORD, lpExtensionGuid: LPVOID, ulSectionId: DWORD, lpGuidToFind: LPVOID, ReturnedData: LPVOID): BOOL {
    return Kernel32.Load('FindActCtxSectionGuid')(dwFlags, lpExtensionGuid, ulSectionId, lpGuidToFind, ReturnedData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findactctxsectionstringa
  public static FindActCtxSectionStringA(dwFlags: DWORD, lpExtensionGuid: LPVOID, ulSectionId: DWORD, lpStringToFind: LPSTR, ReturnedData: LPVOID): BOOL {
    return Kernel32.Load('FindActCtxSectionStringA')(dwFlags, lpExtensionGuid, ulSectionId, lpStringToFind, ReturnedData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findactctxsectionstringw
  public static FindActCtxSectionStringW(dwFlags: DWORD, lpExtensionGuid: LPVOID, ulSectionId: DWORD, lpStringToFind: LPWSTR, ReturnedData: LPVOID): BOOL {
    return Kernel32.Load('FindActCtxSectionStringW')(dwFlags, lpExtensionGuid, ulSectionId, lpStringToFind, ReturnedData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findatoma
  public static FindAtomA(lpString: LPSTR): USHORT {
    return Kernel32.Load('FindAtomA')(lpString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findatomw
  public static FindAtomW(lpString: LPWSTR): USHORT {
    return Kernel32.Load('FindAtomW')(lpString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findclose
  public static FindClose(hFindFile: HANDLE): BOOL {
    return Kernel32.Load('FindClose')(hFindFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findclosechangenotification
  public static FindCloseChangeNotification(hChangeHandle: HANDLE): BOOL {
    return Kernel32.Load('FindCloseChangeNotification')(hChangeHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findfirstchangenotificationa
  public static FindFirstChangeNotificationA(lpPathName: LPSTR, bWatchSubtree: BOOL, dwNotifyFilter: DWORD): HANDLE {
    return Kernel32.Load('FindFirstChangeNotificationA')(lpPathName, bWatchSubtree, dwNotifyFilter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findfirstchangenotificationw
  public static FindFirstChangeNotificationW(lpPathName: LPWSTR, bWatchSubtree: BOOL, dwNotifyFilter: DWORD): HANDLE {
    return Kernel32.Load('FindFirstChangeNotificationW')(lpPathName, bWatchSubtree, dwNotifyFilter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findfirstfilea
  public static FindFirstFileA(lpFileName: LPSTR, lpFindFileData: LPVOID): HANDLE {
    return Kernel32.Load('FindFirstFileA')(lpFileName, lpFindFileData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findfirstfileexa
  public static FindFirstFileExA(lpFileName: LPSTR, fInfoLevelId: DWORD, lpFindFileData: LPVOID, fSearchOp: DWORD, lpSearchFilter: LPVOID, dwAdditionalFlags: DWORD): HANDLE {
    return Kernel32.Load('FindFirstFileExA')(lpFileName, fInfoLevelId, lpFindFileData, fSearchOp, lpSearchFilter, dwAdditionalFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findfirstfileexw
  public static FindFirstFileExW(lpFileName: LPWSTR, fInfoLevelId: DWORD, lpFindFileData: LPVOID, fSearchOp: DWORD, lpSearchFilter: LPVOID, dwAdditionalFlags: DWORD): HANDLE {
    return Kernel32.Load('FindFirstFileExW')(lpFileName, fInfoLevelId, lpFindFileData, fSearchOp, lpSearchFilter, dwAdditionalFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findfirstfilenametransactedw
  public static FindFirstFileNameTransactedW(lpFileName: LPWSTR, dwFlags: DWORD, StringLength: LPVOID, LinkName: LPWSTR, hTransaction: HANDLE): HANDLE {
    return Kernel32.Load('FindFirstFileNameTransactedW')(lpFileName, dwFlags, StringLength, LinkName, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findfirstfilenamew
  public static FindFirstFileNameW(lpFileName: LPWSTR, dwFlags: DWORD, StringLength: LPVOID, LinkName: LPWSTR): HANDLE {
    return Kernel32.Load('FindFirstFileNameW')(lpFileName, dwFlags, StringLength, LinkName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findfirstfiletransacteda
  public static FindFirstFileTransactedA(lpFileName: LPSTR, fInfoLevelId: DWORD, lpFindFileData: LPVOID, fSearchOp: DWORD, lpSearchFilter: LPVOID, dwAdditionalFlags: DWORD, hTransaction: HANDLE): HANDLE {
    return Kernel32.Load('FindFirstFileTransactedA')(lpFileName, fInfoLevelId, lpFindFileData, fSearchOp, lpSearchFilter, dwAdditionalFlags, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findfirstfiletransactedw
  public static FindFirstFileTransactedW(lpFileName: LPWSTR, fInfoLevelId: DWORD, lpFindFileData: LPVOID, fSearchOp: DWORD, lpSearchFilter: LPVOID, dwAdditionalFlags: DWORD, hTransaction: HANDLE): HANDLE {
    return Kernel32.Load('FindFirstFileTransactedW')(lpFileName, fInfoLevelId, lpFindFileData, fSearchOp, lpSearchFilter, dwAdditionalFlags, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findfirstfilew
  public static FindFirstFileW(lpFileName: LPWSTR, lpFindFileData: LPVOID): HANDLE {
    return Kernel32.Load('FindFirstFileW')(lpFileName, lpFindFileData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findfirststreamtransactedw
  public static FindFirstStreamTransactedW(lpFileName: LPWSTR, InfoLevel: DWORD, lpFindStreamData: LPVOID, dwFlags: DWORD, hTransaction: HANDLE): HANDLE {
    return Kernel32.Load('FindFirstStreamTransactedW')(lpFileName, InfoLevel, lpFindStreamData, dwFlags, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findfirststreamw
  public static FindFirstStreamW(lpFileName: LPWSTR, InfoLevel: DWORD, lpFindStreamData: LPVOID, dwFlags: DWORD): HANDLE {
    return Kernel32.Load('FindFirstStreamW')(lpFileName, InfoLevel, lpFindStreamData, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findfirstvolumea
  public static FindFirstVolumeA(lpszVolumeName: LPSTR, cchBufferLength: DWORD): HANDLE {
    return Kernel32.Load('FindFirstVolumeA')(lpszVolumeName, cchBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findfirstvolumemountpointa
  public static FindFirstVolumeMountPointA(lpszRootPathName: LPSTR, lpszVolumeMountPoint: LPSTR, cchBufferLength: DWORD): HANDLE {
    return Kernel32.Load('FindFirstVolumeMountPointA')(lpszRootPathName, lpszVolumeMountPoint, cchBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findfirstvolumemountpointw
  public static FindFirstVolumeMountPointW(lpszRootPathName: LPWSTR, lpszVolumeMountPoint: LPWSTR, cchBufferLength: DWORD): HANDLE {
    return Kernel32.Load('FindFirstVolumeMountPointW')(lpszRootPathName, lpszVolumeMountPoint, cchBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findfirstvolumew
  public static FindFirstVolumeW(lpszVolumeName: LPWSTR, cchBufferLength: DWORD): HANDLE {
    return Kernel32.Load('FindFirstVolumeW')(lpszVolumeName, cchBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findnextchangenotification
  public static FindNextChangeNotification(hChangeHandle: HANDLE): BOOL {
    return Kernel32.Load('FindNextChangeNotification')(hChangeHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findnextfilea
  public static FindNextFileA(hFindFile: HANDLE, lpFindFileData: LPVOID): BOOL {
    return Kernel32.Load('FindNextFileA')(hFindFile, lpFindFileData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findnextfilenamew
  public static FindNextFileNameW(hFindStream: HANDLE, StringLength: LPVOID, LinkName: LPWSTR): BOOL {
    return Kernel32.Load('FindNextFileNameW')(hFindStream, StringLength, LinkName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findnextfilew
  public static FindNextFileW(hFindFile: HANDLE, lpFindFileData: LPVOID): BOOL {
    return Kernel32.Load('FindNextFileW')(hFindFile, lpFindFileData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findnextstreamw
  public static FindNextStreamW(hFindStream: HANDLE, lpFindStreamData: LPVOID): BOOL {
    return Kernel32.Load('FindNextStreamW')(hFindStream, lpFindStreamData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findnextvolumea
  public static FindNextVolumeA(hFindVolume: HANDLE, lpszVolumeName: LPSTR, cchBufferLength: DWORD): BOOL {
    return Kernel32.Load('FindNextVolumeA')(hFindVolume, lpszVolumeName, cchBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findnextvolumemountpointa
  public static FindNextVolumeMountPointA(hFindVolumeMountPoint: HANDLE, lpszVolumeMountPoint: LPSTR, cchBufferLength: DWORD): BOOL {
    return Kernel32.Load('FindNextVolumeMountPointA')(hFindVolumeMountPoint, lpszVolumeMountPoint, cchBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findnextvolumemountpointw
  public static FindNextVolumeMountPointW(hFindVolumeMountPoint: HANDLE, lpszVolumeMountPoint: LPWSTR, cchBufferLength: DWORD): BOOL {
    return Kernel32.Load('FindNextVolumeMountPointW')(hFindVolumeMountPoint, lpszVolumeMountPoint, cchBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findnextvolumew
  public static FindNextVolumeW(hFindVolume: HANDLE, lpszVolumeName: LPWSTR, cchBufferLength: DWORD): BOOL {
    return Kernel32.Load('FindNextVolumeW')(hFindVolume, lpszVolumeName, cchBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findnlsstring
  public static FindNLSString(Locale: DWORD, dwFindNLSStringFlags: DWORD, lpStringSource: LPWSTR, cchSource: INT, lpStringValue: LPWSTR, cchValue: INT, pcchFound: LPVOID): INT {
    return Kernel32.Load('FindNLSString')(Locale, dwFindNLSStringFlags, lpStringSource, cchSource, lpStringValue, cchValue, pcchFound);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findnlsstringex
  public static FindNLSStringEx(
    lpLocaleName: LPWSTR,
    dwFindNLSStringFlags: DWORD,
    lpStringSource: LPWSTR,
    cchSource: INT,
    lpStringValue: LPWSTR,
    cchValue: INT,
    pcchFound: LPVOID,
    lpVersionInformation: LPVOID,
    lpReserved: LPVOID,
    sortHandle: DWORD,
  ): INT {
    return Kernel32.Load('FindNLSStringEx')(lpLocaleName, dwFindNLSStringFlags, lpStringSource, cchSource, lpStringValue, cchValue, pcchFound, lpVersionInformation, lpReserved, sortHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findpackagesbypackagefamily
  public static FindPackagesByPackageFamily(packageFamilyName: LPWSTR, packageFilters: DWORD, count: LPVOID, packageFullNames: LPVOID, bufferLength: LPVOID, buffer: LPWSTR, packageProperties: LPVOID): DWORD {
    return Kernel32.Load('FindPackagesByPackageFamily')(packageFamilyName, packageFilters, count, packageFullNames, bufferLength, buffer, packageProperties);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findresourcea
  public static FindResourceA(hModule: HMODULE, lpName: LPCSTR, lpType: LPCSTR): HRSRC {
    return Kernel32.Load('FindResourceA')(hModule, lpName, lpType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findresourceexa
  public static FindResourceExA(hModule: HMODULE, lpType: LPCSTR, lpName: LPCSTR, wLanguage: USHORT): HRSRC {
    return Kernel32.Load('FindResourceExA')(hModule, lpType, lpName, wLanguage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findresourceexw
  public static FindResourceExW(hModule: HMODULE, lpType: LPCWSTR, lpName: LPCWSTR, wLanguage: USHORT): HRSRC {
    return Kernel32.Load('FindResourceExW')(hModule, lpType, lpName, wLanguage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-findresourcew
  public static FindResourceW(hModule: HMODULE, lpName: LPCWSTR, lpType: LPCWSTR): HRSRC {
    return Kernel32.Load('FindResourceW')(hModule, lpName, lpType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findstringordinal
  public static FindStringOrdinal(dwFindStringOrdinalFlags: DWORD, lpStringSource: LPWSTR, cchSource: INT, lpStringValue: LPWSTR, cchValue: INT, bIgnoreCase: BOOL): INT {
    return Kernel32.Load('FindStringOrdinal')(dwFindStringOrdinalFlags, lpStringSource, cchSource, lpStringValue, cchValue, bIgnoreCase);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findvolumeclose
  public static FindVolumeClose(hFindVolume: HANDLE): BOOL {
    return Kernel32.Load('FindVolumeClose')(hFindVolume);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-findvolumemountpointclose
  public static FindVolumeMountPointClose(hFindVolumeMountPoint: HANDLE): BOOL {
    return Kernel32.Load('FindVolumeMountPointClose')(hFindVolumeMountPoint);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-flsalloc
  public static FlsAlloc(lpCallback: DWORD): DWORD {
    return Kernel32.Load('FlsAlloc')(lpCallback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-flsfree
  public static FlsFree(dwFlsIndex: DWORD): BOOL {
    return Kernel32.Load('FlsFree')(dwFlsIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-flsgetvalue
  public static FlsGetValue(dwFlsIndex: DWORD): LPVOID {
    return Kernel32.Load('FlsGetValue')(dwFlsIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-flssetvalue
  public static FlsSetValue(dwFlsIndex: DWORD, lpFlsData: LPVOID): BOOL {
    return Kernel32.Load('FlsSetValue')(dwFlsIndex, lpFlsData);
  }

  // https://learn.microsoft.com/en-us/windows/console/flushconsoleinputbuffer
  public static FlushConsoleInputBuffer(hConsoleInput: HANDLE): BOOL {
    return Kernel32.Load('FlushConsoleInputBuffer')(hConsoleInput);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-flushfilebuffers
  public static FlushFileBuffers(hFile: HANDLE): BOOL {
    return Kernel32.Load('FlushFileBuffers')(hFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-flushinstructioncache
  public static FlushInstructionCache(hProcess: HANDLE, lpBaseAddress: LPVOID, dwSize: LPVOID): BOOL {
    return Kernel32.Load('FlushInstructionCache')(hProcess, lpBaseAddress, dwSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-flushprocesswritebuffers
  public static FlushProcessWriteBuffers(): VOID {
    return Kernel32.Load('FlushProcessWriteBuffers')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-flushviewoffile
  public static FlushViewOfFile(lpBaseAddress: LPVOID, dwNumberOfBytesToFlush: LPVOID): BOOL {
    return Kernel32.Load('FlushViewOfFile')(lpBaseAddress, dwNumberOfBytesToFlush);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-foldstringa
  public static FoldStringA(dwMapFlags: DWORD, lpSrcStr: LPCSTR, cchSrc: INT, lpDestStr: LPSTR, cchDest: INT): INT {
    return Kernel32.Load('FoldStringA')(dwMapFlags, lpSrcStr, cchSrc, lpDestStr, cchDest);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-foldstringw
  public static FoldStringW(dwMapFlags: DWORD, lpSrcStr: LPCWSTR, cchSrc: INT, lpDestStr: LPWSTR, cchDest: INT): INT {
    return Kernel32.Load('FoldStringW')(dwMapFlags, lpSrcStr, cchSrc, lpDestStr, cchDest);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-formatapplicationusermodelid
  public static FormatApplicationUserModelId(packageFamilyName: LPWSTR, packageRelativeApplicationId: LPWSTR, applicationUserModelIdLength: LPVOID, applicationUserModelId: LPWSTR): DWORD {
    return Kernel32.Load('FormatApplicationUserModelId')(packageFamilyName, packageRelativeApplicationId, applicationUserModelIdLength, applicationUserModelId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-formatmessagea
  public static FormatMessageA(dwFlags: DWORD, lpSource: LPVOID, dwMessageId: DWORD, dwLanguageId: DWORD, lpBuffer: LPSTR, nSize: DWORD, Arguments: LPVOID): DWORD {
    return Kernel32.Load('FormatMessageA')(dwFlags, lpSource, dwMessageId, dwLanguageId, lpBuffer, nSize, Arguments);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-formatmessagew
  public static FormatMessageW(dwFlags: DWORD, lpSource: LPVOID, dwMessageId: DWORD, dwLanguageId: DWORD, lpBuffer: LPWSTR, nSize: DWORD, Arguments: LPVOID): DWORD {
    return Kernel32.Load('FormatMessageW')(dwFlags, lpSource, dwMessageId, dwLanguageId, lpBuffer, nSize, Arguments);
  }

  // https://learn.microsoft.com/en-us/windows/console/freeconsole
  public static FreeConsole(): BOOL {
    return Kernel32.Load('FreeConsole')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-freeenvironmentstringsa
  public static FreeEnvironmentStringsA(penv: LPSTR): BOOL {
    return Kernel32.Load('FreeEnvironmentStringsA')(penv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-freeenvironmentstringsw
  public static FreeEnvironmentStringsW(penv: LPWSTR): BOOL {
    return Kernel32.Load('FreeEnvironmentStringsW')(penv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-freelibrary
  public static FreeLibrary(hLibModule: HMODULE): BOOL {
    return Kernel32.Load('FreeLibrary')(hLibModule);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-freelibraryandexitthread
  public static FreeLibraryAndExitThread(hLibModule: HMODULE, dwExitCode: DWORD): VOID {
    return Kernel32.Load('FreeLibraryAndExitThread')(hLibModule, dwExitCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-freelibrarywhencallbackreturns
  public static FreeLibraryWhenCallbackReturns(pci: DWORD, mod: HMODULE): VOID {
    return Kernel32.Load('FreeLibraryWhenCallbackReturns')(pci, mod);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-freememoryjobobject
  public static FreeMemoryJobObject(Buffer: LPVOID): VOID {
    return Kernel32.Load('FreeMemoryJobObject')(Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-freeresource
  public static FreeResource(hResData: DWORD): BOOL {
    return Kernel32.Load('FreeResource')(hResData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-freeuserphysicalpages
  public static FreeUserPhysicalPages(hProcess: HANDLE, NumberOfPages: LPVOID, PageArray: LPVOID): BOOL {
    return Kernel32.Load('FreeUserPhysicalPages')(hProcess, NumberOfPages, PageArray);
  }

  // https://learn.microsoft.com/en-us/windows/console/generateconsolectrlevent
  public static GenerateConsoleCtrlEvent(dwCtrlEvent: DWORD, dwProcessGroupId: DWORD): BOOL {
    return Kernel32.Load('GenerateConsoleCtrlEvent')(dwCtrlEvent, dwProcessGroupId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getacp
  public static GetACP(): DWORD {
    return Kernel32.Load('GetACP')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getactiveprocessorcount
  public static GetActiveProcessorCount(GroupNumber: USHORT): DWORD {
    return Kernel32.Load('GetActiveProcessorCount')(GroupNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processtopologyapi/nf-processtopologyapi-getactiveprocessorgroupcount
  public static GetActiveProcessorGroupCount(): USHORT {
    return Kernel32.Load('GetActiveProcessorGroupCount')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getappcontainerace
  public static GetAppContainerAce(Acl: LPVOID, StartingAceIndex: DWORD, AppContainerAce: LPVOID, AppContainerAceIndex: LPVOID): BOOL {
    return Kernel32.Load('GetAppContainerAce')(Acl, StartingAceIndex, AppContainerAce, AppContainerAceIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getappcontainernamedobjectpath
  public static GetAppContainerNamedObjectPath(Token: HANDLE, AppContainerSid: DWORD, ObjectPathLength: DWORD, ObjectPath: LPWSTR, ReturnLength: LPVOID): BOOL {
    return Kernel32.Load('GetAppContainerNamedObjectPath')(Token, AppContainerSid, ObjectPathLength, ObjectPath, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getapplicationrecoverycallback
  public static GetApplicationRecoveryCallback(hProcess: HANDLE, pRecoveryCallback: LPVOID, ppvParameter: LPVOID, pdwPingInterval: LPVOID, pdwFlags: LPVOID): DWORD {
    return Kernel32.Load('GetApplicationRecoveryCallback')(hProcess, pRecoveryCallback, ppvParameter, pdwPingInterval, pdwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getapplicationrestartsettings
  public static GetApplicationRestartSettings(hProcess: HANDLE, pwzCommandline: LPWSTR, pcchSize: LPVOID, pdwFlags: LPVOID): DWORD {
    return Kernel32.Load('GetApplicationRestartSettings')(hProcess, pwzCommandline, pcchSize, pdwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getapplicationusermodelid
  public static GetApplicationUserModelId(hProcess: HANDLE, applicationUserModelIdLength: LPVOID, applicationUserModelId: LPWSTR): DWORD {
    return Kernel32.Load('GetApplicationUserModelId')(hProcess, applicationUserModelIdLength, applicationUserModelId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getatomnamea
  public static GetAtomNameA(nAtom: USHORT, lpBuffer: LPSTR, nSize: INT): DWORD {
    return Kernel32.Load('GetAtomNameA')(nAtom, lpBuffer, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getatomnamew
  public static GetAtomNameW(nAtom: USHORT, lpBuffer: LPWSTR, nSize: INT): DWORD {
    return Kernel32.Load('GetAtomNameW')(nAtom, lpBuffer, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getbinarytypea
  public static GetBinaryTypeA(lpApplicationName: LPSTR, lpBinaryType: LPVOID): BOOL {
    return Kernel32.Load('GetBinaryTypeA')(lpApplicationName, lpBinaryType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getbinarytypew
  public static GetBinaryTypeW(lpApplicationName: LPWSTR, lpBinaryType: LPVOID): BOOL {
    return Kernel32.Load('GetBinaryTypeW')(lpApplicationName, lpBinaryType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcachedsigninglevel
  public static GetCachedSigningLevel(File: HANDLE, Flags: LPVOID, SigningLevel: LPVOID, Thumbprint: LPVOID, ThumbprintSize: LPVOID, ThumbprintAlgorithm: LPVOID): BOOL {
    return Kernel32.Load('GetCachedSigningLevel')(File, Flags, SigningLevel, Thumbprint, ThumbprintSize, ThumbprintAlgorithm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcalendardateformatex
  public static GetCalendarDateFormatEx(lpszLocale: LPWSTR, dwFlags: DWORD, lpCalDateTime: LPVOID, lpFormat: LPWSTR, lpDateStr: LPWSTR, cchDate: INT): BOOL {
    return Kernel32.Load('GetCalendarDateFormatEx')(lpszLocale, dwFlags, lpCalDateTime, lpFormat, lpDateStr, cchDate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcalendarinfoa
  public static GetCalendarInfoA(Locale: DWORD, Calendar: DWORD, CalType: DWORD, lpCalData: LPSTR, cchData: INT, lpValue: LPVOID): INT {
    return Kernel32.Load('GetCalendarInfoA')(Locale, Calendar, CalType, lpCalData, cchData, lpValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcalendarinfoex
  public static GetCalendarInfoEx(lpLocaleName: LPWSTR, Calendar: DWORD, lpReserved: LPWSTR, CalType: DWORD, lpCalData: LPWSTR, cchData: INT, lpValue: LPVOID): INT {
    return Kernel32.Load('GetCalendarInfoEx')(lpLocaleName, Calendar, lpReserved, CalType, lpCalData, cchData, lpValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcalendarinfow
  public static GetCalendarInfoW(Locale: DWORD, Calendar: DWORD, CalType: DWORD, lpCalData: LPWSTR, cchData: INT, lpValue: LPVOID): INT {
    return Kernel32.Load('GetCalendarInfoW')(Locale, Calendar, CalType, lpCalData, cchData, lpValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcalendarsupporteddaterange
  public static GetCalendarSupportedDateRange(Calendar: DWORD, lpCalMinDateTime: LPVOID, lpCalMaxDateTime: LPVOID): BOOL {
    return Kernel32.Load('GetCalendarSupportedDateRange')(Calendar, lpCalMinDateTime, lpCalMaxDateTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-getcommandlinea
  public static GetCommandLineA(): LPSTR {
    return Kernel32.Load('GetCommandLineA')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-getcommandlinew
  public static GetCommandLineW(): LPWSTR {
    return Kernel32.Load('GetCommandLineW')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcommconfig
  public static GetCommConfig(hCommDev: HANDLE, lpCC: LPVOID, lpdwSize: LPVOID): BOOL {
    return Kernel32.Load('GetCommConfig')(hCommDev, lpCC, lpdwSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcommmask
  public static GetCommMask(hFile: HANDLE, lpEvtMask: LPVOID): BOOL {
    return Kernel32.Load('GetCommMask')(hFile, lpEvtMask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcommmodemstatus
  public static GetCommModemStatus(hFile: HANDLE, lpModemStat: LPVOID): BOOL {
    return Kernel32.Load('GetCommModemStatus')(hFile, lpModemStat);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcommproperties
  public static GetCommProperties(hFile: HANDLE, lpCommProp: LPVOID): BOOL {
    return Kernel32.Load('GetCommProperties')(hFile, lpCommProp);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcommstate
  public static GetCommState(hFile: HANDLE, lpDCB: LPVOID): BOOL {
    return Kernel32.Load('GetCommState')(hFile, lpDCB);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcommtimeouts
  public static GetCommTimeouts(hFile: HANDLE, lpCommTimeouts: LPVOID): BOOL {
    return Kernel32.Load('GetCommTimeouts')(hFile, lpCommTimeouts);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getcompressedfilesizea
  public static GetCompressedFileSizeA(lpFileName: LPSTR, lpFileSizeHigh: LPVOID): DWORD {
    return Kernel32.Load('GetCompressedFileSizeA')(lpFileName, lpFileSizeHigh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getcompressedfilesizetransacteda
  public static GetCompressedFileSizeTransactedA(lpFileName: LPSTR, lpFileSizeHigh: LPVOID, hTransaction: HANDLE): DWORD {
    return Kernel32.Load('GetCompressedFileSizeTransactedA')(lpFileName, lpFileSizeHigh, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getcompressedfilesizetransactedw
  public static GetCompressedFileSizeTransactedW(lpFileName: LPWSTR, lpFileSizeHigh: LPVOID, hTransaction: HANDLE): DWORD {
    return Kernel32.Load('GetCompressedFileSizeTransactedW')(lpFileName, lpFileSizeHigh, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getcompressedfilesizew
  public static GetCompressedFileSizeW(lpFileName: LPWSTR, lpFileSizeHigh: LPVOID): DWORD {
    return Kernel32.Load('GetCompressedFileSizeW')(lpFileName, lpFileSizeHigh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcomputernamea
  public static GetComputerNameA(lpBuffer: LPSTR, nSize: LPDWORD): BOOL {
    return Kernel32.Load('GetComputerNameA')(lpBuffer, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcomputernameexa
  public static GetComputerNameExA(NameType: DWORD, lpBuffer: LPSTR, nSize: LPDWORD): BOOL {
    return Kernel32.Load('GetComputerNameExA')(NameType, lpBuffer, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-getcomputernameexw
  public static GetComputerNameExW(NameType: DWORD, lpBuffer: LPWSTR, nSize: LPDWORD): BOOL {
    return Kernel32.Load('GetComputerNameExW')(NameType, lpBuffer, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcomputernamew
  public static GetComputerNameW(lpBuffer: LPWSTR, nSize: LPDWORD): BOOL {
    return Kernel32.Load('GetComputerNameW')(lpBuffer, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolealias
  public static GetConsoleAliasA(Source: LPSTR, TargetBuffer: LPSTR, TargetBufferLength: DWORD, ExeName: LPSTR): DWORD {
    return Kernel32.Load('GetConsoleAliasA')(Source, TargetBuffer, TargetBufferLength, ExeName);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolealiases
  public static GetConsoleAliasesA(AliasBuffer: LPSTR, AliasBufferLength: DWORD, ExeName: LPSTR): DWORD {
    return Kernel32.Load('GetConsoleAliasesA')(AliasBuffer, AliasBufferLength, ExeName);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolealiaseslength
  public static GetConsoleAliasesLengthA(ExeName: LPSTR): DWORD {
    return Kernel32.Load('GetConsoleAliasesLengthA')(ExeName);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolealiaseslength
  public static GetConsoleAliasesLengthW(ExeName: LPWSTR): DWORD {
    return Kernel32.Load('GetConsoleAliasesLengthW')(ExeName);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolealiases
  public static GetConsoleAliasesW(AliasBuffer: LPWSTR, AliasBufferLength: DWORD, ExeName: LPWSTR): DWORD {
    return Kernel32.Load('GetConsoleAliasesW')(AliasBuffer, AliasBufferLength, ExeName);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolealiasexes
  public static GetConsoleAliasExesA(ExeNameBuffer: LPSTR, ExeNameBufferLength: DWORD): DWORD {
    return Kernel32.Load('GetConsoleAliasExesA')(ExeNameBuffer, ExeNameBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolealiasexeslength
  public static GetConsoleAliasExesLengthA(): DWORD {
    return Kernel32.Load('GetConsoleAliasExesLengthA')();
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolealiasexeslength
  public static GetConsoleAliasExesLengthW(): DWORD {
    return Kernel32.Load('GetConsoleAliasExesLengthW')();
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolealiasexes
  public static GetConsoleAliasExesW(ExeNameBuffer: LPWSTR, ExeNameBufferLength: DWORD): DWORD {
    return Kernel32.Load('GetConsoleAliasExesW')(ExeNameBuffer, ExeNameBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolealias
  public static GetConsoleAliasW(Source: LPWSTR, TargetBuffer: LPWSTR, TargetBufferLength: DWORD, ExeName: LPWSTR): DWORD {
    return Kernel32.Load('GetConsoleAliasW')(Source, TargetBuffer, TargetBufferLength, ExeName);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolechartype
  public static GetConsoleCharType(hConsole: HANDLE, coordCheck: DWORD, pdwType: LPDWORD): BOOL {
    return Kernel32.Load('GetConsoleCharType')(hConsole, coordCheck, pdwType);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolecommandhistory
  public static GetConsoleCommandHistoryA(Commands: LPSTR, CommandBufferLength: DWORD, ExeName: LPSTR): DWORD {
    return Kernel32.Load('GetConsoleCommandHistoryA')(Commands, CommandBufferLength, ExeName);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolecommandhistorylength
  public static GetConsoleCommandHistoryLengthA(ExeName: LPSTR): DWORD {
    return Kernel32.Load('GetConsoleCommandHistoryLengthA')(ExeName);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolecommandhistorylength
  public static GetConsoleCommandHistoryLengthW(ExeName: LPWSTR): DWORD {
    return Kernel32.Load('GetConsoleCommandHistoryLengthW')(ExeName);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolecommandhistory
  public static GetConsoleCommandHistoryW(Commands: LPWSTR, CommandBufferLength: DWORD, ExeName: LPWSTR): DWORD {
    return Kernel32.Load('GetConsoleCommandHistoryW')(Commands, CommandBufferLength, ExeName);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolecp
  public static GetConsoleCP(): DWORD {
    return Kernel32.Load('GetConsoleCP')();
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolecursorinfo
  public static GetConsoleCursorInfo(hConsoleOutput: HANDLE, lpConsoleCursorInfo: PCONSOLE_CURSOR_INFO): BOOL {
    return Kernel32.Load('GetConsoleCursorInfo')(hConsoleOutput, lpConsoleCursorInfo);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolecursormode
  public static GetConsoleCursorMode(hConsoleHandle: HANDLE, pbBlink: LPVOID, pbDBEnable: LPVOID): BOOL {
    return Kernel32.Load('GetConsoleCursorMode')(hConsoleHandle, pbBlink, pbDBEnable);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsoledisplaymode
  public static GetConsoleDisplayMode(lpModeFlags: LPDWORD): BOOL {
    return Kernel32.Load('GetConsoleDisplayMode')(lpModeFlags);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolefontinfo
  public static GetConsoleFontInfo(hConsoleOutput: HANDLE, bMaximumWindow: BOOL, nLength: DWORD, lpConsoleFontInfo: PCONSOLE_FONT_INFO): BOOL {
    return Kernel32.Load('GetConsoleFontInfo')(hConsoleOutput, bMaximumWindow, nLength, lpConsoleFontInfo);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolefontsize
  public static GetConsoleFontSize(hConsoleOutput: HANDLE, nFont: DWORD): COORD {
    return Kernel32.Load('GetConsoleFontSize')(hConsoleOutput, nFont);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolehardwarestate
  public static GetConsoleHardwareState(hConsoleOutput: HANDLE, lpResolution: LPVOID, lpFontSize: LPVOID): BOOL {
    return Kernel32.Load('GetConsoleHardwareState')(hConsoleOutput, lpResolution, lpFontSize);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolehistoryinfo
  public static GetConsoleHistoryInfo(lpConsoleHistoryInfo: PCONSOLE_HISTORY_INFO): BOOL {
    return Kernel32.Load('GetConsoleHistoryInfo')(lpConsoleHistoryInfo);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsoleinputexename
  public static GetConsoleInputExeNameA(nBufferLength: DWORD, lpBuffer: LPSTR): DWORD {
    return Kernel32.Load('GetConsoleInputExeNameA')(nBufferLength, lpBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsoleinputexename
  public static GetConsoleInputExeNameW(nBufferLength: DWORD, lpBuffer: LPWSTR): DWORD {
    return Kernel32.Load('GetConsoleInputExeNameW')(nBufferLength, lpBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsoleinputwaithandle
  public static GetConsoleInputWaitHandle(): HANDLE {
    return Kernel32.Load('GetConsoleInputWaitHandle')();
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolemode
  public static GetConsoleMode(hConsoleHandle: HANDLE, lpMode: LPDWORD): BOOL {
    return Kernel32.Load('GetConsoleMode')(hConsoleHandle, lpMode);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolenlsmode
  public static GetConsoleNlsMode(hConsole: HANDLE, lpdwNlsMode: LPDWORD): BOOL {
    return Kernel32.Load('GetConsoleNlsMode')(hConsole, lpdwNlsMode);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsoleoriginaltitle
  public static GetConsoleOriginalTitleA(lpConsoleTitle: LPSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('GetConsoleOriginalTitleA')(lpConsoleTitle, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsoleoriginaltitle
  public static GetConsoleOriginalTitleW(lpConsoleTitle: LPWSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('GetConsoleOriginalTitleW')(lpConsoleTitle, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsoleoutputcp
  public static GetConsoleOutputCP(): DWORD {
    return Kernel32.Load('GetConsoleOutputCP')();
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsoleprocesslist
  public static GetConsoleProcessList(lpdwProcessList: LPDWORD, dwProcessCount: DWORD): DWORD {
    return Kernel32.Load('GetConsoleProcessList')(lpdwProcessList, dwProcessCount);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolescreenbufferinfo
  public static GetConsoleScreenBufferInfo(hConsoleOutput: HANDLE, lpConsoleScreenBufferInfo: PCONSOLE_SCREEN_BUFFER_INFO): BOOL {
    return Kernel32.Load('GetConsoleScreenBufferInfo')(hConsoleOutput, lpConsoleScreenBufferInfo);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolescreenbufferinfoex
  public static GetConsoleScreenBufferInfoEx(hConsoleOutput: HANDLE, lpConsoleScreenBufferInfoEx: PCONSOLE_SCREEN_BUFFER_INFOEX): BOOL {
    return Kernel32.Load('GetConsoleScreenBufferInfoEx')(hConsoleOutput, lpConsoleScreenBufferInfoEx);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsoleselectioninfo
  public static GetConsoleSelectionInfo(lpConsoleSelectionInfo: PCONSOLE_SELECTION_INFO): BOOL {
    return Kernel32.Load('GetConsoleSelectionInfo')(lpConsoleSelectionInfo);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsoletitle
  public static GetConsoleTitleA(lpConsoleTitle: LPSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('GetConsoleTitleA')(lpConsoleTitle, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsoletitle
  public static GetConsoleTitleW(lpConsoleTitle: LPWSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('GetConsoleTitleW')(lpConsoleTitle, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/console/getconsolewindow
  public static GetConsoleWindow(): HWND {
    return Kernel32.Load('GetConsoleWindow')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcpinfo
  public static GetCPInfo(CodePage: UINT, lpCPInfo: LPCPINFO): BOOL {
    return Kernel32.Load('GetCPInfo')(CodePage, lpCPInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcpinfoexa
  public static GetCPInfoExA(CodePage: UINT, dwFlags: DWORD, lpCPInfoEx: LPCPINFOEXA): BOOL {
    return Kernel32.Load('GetCPInfoExA')(CodePage, dwFlags, lpCPInfoEx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcpinfoexw
  public static GetCPInfoExW(CodePage: UINT, dwFlags: DWORD, lpCPInfoEx: LPCPINFOEXW): BOOL {
    return Kernel32.Load('GetCPInfoExW')(CodePage, dwFlags, lpCPInfoEx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcurrencyformata
  public static GetCurrencyFormatA(Locale: DWORD, dwFlags: DWORD, lpValue: LPSTR, lpFormat: LPCURRENCYFMTA, lpCurrencyStr: LPSTR, cchCurrency: INT): INT {
    return Kernel32.Load('GetCurrencyFormatA')(Locale, dwFlags, lpValue, lpFormat, lpCurrencyStr, cchCurrency);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcurrencyformatex
  public static GetCurrencyFormatEx(lpLocaleName: LPWSTR, dwFlags: DWORD, lpValue: LPWSTR, lpFormat: LPCURRENCYFMTW, lpCurrencyStr: LPWSTR, cchCurrency: INT): INT {
    return Kernel32.Load('GetCurrencyFormatEx')(lpLocaleName, dwFlags, lpValue, lpFormat, lpCurrencyStr, cchCurrency);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcurrencyformatw
  public static GetCurrencyFormatW(Locale: DWORD, dwFlags: DWORD, lpValue: LPWSTR, lpFormat: LPCURRENCYFMTW, lpCurrencyStr: LPWSTR, cchCurrency: INT): INT {
    return Kernel32.Load('GetCurrencyFormatW')(Locale, dwFlags, lpValue, lpFormat, lpCurrencyStr, cchCurrency);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcurrentactctx
  public static GetCurrentActCtx(lphActCtx: PHANDLE): BOOL {
    return Kernel32.Load('GetCurrentActCtx')(lphActCtx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcurrentapplicationusermodelid
  public static GetCurrentApplicationUserModelId(applicationUserModelIdLength: PULONG, applicationUserModelId: LPWSTR): DWORD {
    return Kernel32.Load('GetCurrentApplicationUserModelId')(applicationUserModelIdLength, applicationUserModelId);
  }

  // https://learn.microsoft.com/en-us/windows/console/getcurrentconsolefont
  public static GetCurrentConsoleFont(hConsoleOutput: HANDLE, bMaximumWindow: BOOL, lpConsoleCurrentFont: PCONSOLE_FONT_INFO): BOOL {
    return Kernel32.Load('GetCurrentConsoleFont')(hConsoleOutput, bMaximumWindow, lpConsoleCurrentFont);
  }

  // https://learn.microsoft.com/en-us/windows/console/getcurrentconsolefontex
  public static GetCurrentConsoleFontEx(hConsoleOutput: HANDLE, bMaximumWindow: BOOL, lpConsoleCurrentFontEx: PCONSOLE_FONT_INFOEX): BOOL {
    return Kernel32.Load('GetCurrentConsoleFontEx')(hConsoleOutput, bMaximumWindow, lpConsoleCurrentFontEx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-getcurrentdirectorya
  public static GetCurrentDirectoryA(nBufferLength: DWORD, lpBuffer: LPSTR): DWORD {
    return Kernel32.Load('GetCurrentDirectoryA')(nBufferLength, lpBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-getcurrentdirectoryw
  public static GetCurrentDirectoryW(nBufferLength: DWORD, lpBuffer: LPWSTR): DWORD {
    return Kernel32.Load('GetCurrentDirectoryW')(nBufferLength, lpBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcurrentpackagefamilyname
  public static GetCurrentPackageFamilyName(packageFamilyNameLength: PULONG, packageFamilyName: LPWSTR): DWORD {
    return Kernel32.Load('GetCurrentPackageFamilyName')(packageFamilyNameLength, packageFamilyName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcurrentpackagefullname
  public static GetCurrentPackageFullName(packageFullNameLength: PULONG, packageFullName: LPWSTR): DWORD {
    return Kernel32.Load('GetCurrentPackageFullName')(packageFullNameLength, packageFullName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcurrentpackageid
  public static GetCurrentPackageId(bufferLength: PULONG, buffer: LPBYTE): DWORD {
    return Kernel32.Load('GetCurrentPackageId')(bufferLength, buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcurrentpackageinfo
  public static GetCurrentPackageInfo(flags: DWORD, bufferLength: PULONG, buffer: LPBYTE, count: PULONG): DWORD {
    return Kernel32.Load('GetCurrentPackageInfo')(flags, bufferLength, buffer, count);
  }

  // public static GetCurrentPackageInfo3(flags: DWORD, packageInfoType: DWORD, bufferLength: LPVOID, buffer: LPVOID, count: LPVOID): DWORD {
  //   return Kernel32.Load('GetCurrentPackageInfo3')(flags, packageInfoType, bufferLength, buffer, count);
  // }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcurrentpackagepath
  public static GetCurrentPackagePath(pathLength: LPVOID, path: LPWSTR): DWORD {
    return Kernel32.Load('GetCurrentPackagePath')(pathLength, path);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcurrentpackagevirtualizationcontext
  public static GetCurrentPackageVirtualizationContext(): DWORD {
    return Kernel32.Load('GetCurrentPackageVirtualizationContext')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getcurrentprocess
  public static GetCurrentProcess(): HANDLE {
    return Kernel32.Load('GetCurrentProcess')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getcurrentprocessid
  public static GetCurrentProcessId(): DWORD {
    return Kernel32.Load('GetCurrentProcessId')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcurrentprocessornumber
  public static GetCurrentProcessorNumber(): DWORD {
    return Kernel32.Load('GetCurrentProcessorNumber')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcurrentprocessornumberex
  public static GetCurrentProcessorNumberEx(ProcNumber: LPVOID): VOID {
    return Kernel32.Load('GetCurrentProcessorNumberEx')(ProcNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getcurrentthread
  public static GetCurrentThread(): HANDLE {
    return Kernel32.Load('GetCurrentThread')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getcurrentthreadid
  public static GetCurrentThreadId(): DWORD {
    return Kernel32.Load('GetCurrentThreadId')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcurrentthreadstacklimits
  public static GetCurrentThreadStackLimits(LowLimit: LPVOID, HighLimit: LPVOID): VOID {
    return Kernel32.Load('GetCurrentThreadStackLimits')(LowLimit, HighLimit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getcurrentumsthread
  public static GetCurrentUmsThread(): LPVOID {
    return Kernel32.Load('GetCurrentUmsThread')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-getdateformata
  public static GetDateFormatA(Locale: DWORD, dwFlags: DWORD, lpDate: LPVOID, lpFormat: LPSTR, lpDateStr: LPSTR, cchDate: INT): INT {
    return Kernel32.Load('GetDateFormatA')(Locale, dwFlags, lpDate, lpFormat, lpDateStr, cchDate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-getdateformatex
  public static GetDateFormatEx(lpLocaleName: LPWSTR, dwFlags: DWORD, lpDate: LPVOID, lpFormat: LPWSTR, lpDateStr: LPWSTR, cchDate: INT, lpCalendar: LPWSTR): INT {
    return Kernel32.Load('GetDateFormatEx')(lpLocaleName, dwFlags, lpDate, lpFormat, lpDateStr, cchDate, lpCalendar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-getdateformatw
  public static GetDateFormatW(Locale: DWORD, dwFlags: DWORD, lpDate: LPVOID, lpFormat: LPWSTR, lpDateStr: LPWSTR, cchDate: INT): INT {
    return Kernel32.Load('GetDateFormatW')(Locale, dwFlags, lpDate, lpFormat, lpDateStr, cchDate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getdefaultcommconfiga
  public static GetDefaultCommConfigA(lpszName: LPSTR, lpCC: LPVOID, lpdwSize: LPVOID): BOOL {
    return Kernel32.Load('GetDefaultCommConfigA')(lpszName, lpCC, lpdwSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getdefaultcommconfigw
  public static GetDefaultCommConfigW(lpszName: LPWSTR, lpCC: LPVOID, lpdwSize: LPVOID): BOOL {
    return Kernel32.Load('GetDefaultCommConfigW')(lpszName, lpCC, lpdwSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getdevicepowerstate
  public static GetDevicePowerState(hDevice: HANDLE, pfOn: LPVOID): BOOL {
    return Kernel32.Load('GetDevicePowerState')(hDevice, pfOn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getdiskfreespacea
  public static GetDiskFreeSpaceA(lpRootPathName: LPSTR, lpSectorsPerCluster: LPVOID, lpBytesPerSector: LPVOID, lpNumberOfFreeClusters: LPVOID, lpTotalNumberOfClusters: LPVOID): BOOL {
    return Kernel32.Load('GetDiskFreeSpaceA')(lpRootPathName, lpSectorsPerCluster, lpBytesPerSector, lpNumberOfFreeClusters, lpTotalNumberOfClusters);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getdiskfreespaceexa
  public static GetDiskFreeSpaceExA(lpDirectoryName: LPSTR, lpFreeBytesAvailableToCaller: LPVOID, lpTotalNumberOfBytes: LPVOID, lpTotalNumberOfFreeBytes: LPVOID): BOOL {
    return Kernel32.Load('GetDiskFreeSpaceExA')(lpDirectoryName, lpFreeBytesAvailableToCaller, lpTotalNumberOfBytes, lpTotalNumberOfFreeBytes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getdiskfreespaceexw
  public static GetDiskFreeSpaceExW(lpDirectoryName: LPWSTR, lpFreeBytesAvailableToCaller: LPVOID, lpTotalNumberOfBytes: LPVOID, lpTotalNumberOfFreeBytes: LPVOID): BOOL {
    return Kernel32.Load('GetDiskFreeSpaceExW')(lpDirectoryName, lpFreeBytesAvailableToCaller, lpTotalNumberOfBytes, lpTotalNumberOfFreeBytes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getdiskfreespacew
  public static GetDiskFreeSpaceW(lpRootPathName: LPWSTR, lpSectorsPerCluster: LPVOID, lpBytesPerSector: LPVOID, lpNumberOfFreeClusters: LPVOID, lpTotalNumberOfClusters: LPVOID): BOOL {
    return Kernel32.Load('GetDiskFreeSpaceW')(lpRootPathName, lpSectorsPerCluster, lpBytesPerSector, lpNumberOfFreeClusters, lpTotalNumberOfClusters);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getdiskspaceinformationa
  public static GetDiskSpaceInformationA(rootPath: LPSTR, diskSpaceInfo: LPVOID): DWORD {
    return Kernel32.Load('GetDiskSpaceInformationA')(rootPath, diskSpaceInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getdiskspaceinformationw
  public static GetDiskSpaceInformationW(rootPath: LPWSTR, diskSpaceInfo: LPVOID): DWORD {
    return Kernel32.Load('GetDiskSpaceInformationW')(rootPath, diskSpaceInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getdlldirectorya
  public static GetDllDirectoryA(nBufferLength: DWORD, lpBuffer: LPSTR): DWORD {
    return Kernel32.Load('GetDllDirectoryA')(nBufferLength, lpBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getdlldirectoryw
  public static GetDllDirectoryW(nBufferLength: DWORD, lpBuffer: LPWSTR): DWORD {
    return Kernel32.Load('GetDllDirectoryW')(nBufferLength, lpBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getdrivetypea
  public static GetDriveTypeA(lpRootPathName: LPSTR): DWORD {
    return Kernel32.Load('GetDriveTypeA')(lpRootPathName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getdrivetypew
  public static GetDriveTypeW(lpRootPathName: LPWSTR): DWORD {
    return Kernel32.Load('GetDriveTypeW')(lpRootPathName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getdurationformat
  public static GetDurationFormat(Locale: DWORD, dwFlags: DWORD, lpDuration: LPVOID, ullDuration: ULONGLONG, lpFormat: LPWSTR, lpDurationStr: LPWSTR, cchDuration: INT): INT {
    return Kernel32.Load('GetDurationFormat')(Locale, dwFlags, lpDuration, ullDuration, lpFormat, lpDurationStr, cchDuration);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getdurationformatex
  public static GetDurationFormatEx(lpLocaleName: LPWSTR, dwFlags: DWORD, lpDuration: LPVOID, ullDuration: ULONGLONG, lpFormat: LPWSTR, lpDurationStr: LPWSTR, cchDuration: INT): INT {
    return Kernel32.Load('GetDurationFormatEx')(lpLocaleName, dwFlags, lpDuration, ullDuration, lpFormat, lpDurationStr, cchDuration);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/timezoneapi/nf-timezoneapi-getdynamictimezoneinformation
  public static GetDynamicTimeZoneInformation(pTimeZoneInformation: LPVOID): DWORD {
    return Kernel32.Load('GetDynamicTimeZoneInformation')(pTimeZoneInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getenabledxstatefeatures
  public static GetEnabledXStateFeatures(): ULONGLONG {
    return Kernel32.Load('GetEnabledXStateFeatures')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-getenvironmentstrings
  public static GetEnvironmentStrings(): LPSTR {
    return Kernel32.Load('GetEnvironmentStrings')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-getenvironmentstringsw
  public static GetEnvironmentStringsW(): LPWSTR {
    return Kernel32.Load('GetEnvironmentStringsW')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-getenvironmentvariablea
  public static GetEnvironmentVariableA(lpName: LPSTR, lpBuffer: LPSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('GetEnvironmentVariableA')(lpName, lpBuffer, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-getenvironmentvariablew
  public static GetEnvironmentVariableW(lpName: LPWSTR, lpBuffer: LPWSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('GetEnvironmentVariableW')(lpName, lpBuffer, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/errhandlingapi/nf-errhandlingapi-geterrormode
  public static GetErrorMode(): DWORD {
    return Kernel32.Load('GetErrorMode')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getexitcodeprocess
  public static GetExitCodeProcess(hProcess: HANDLE, lpExitCode: LPVOID): BOOL {
    return Kernel32.Load('GetExitCodeProcess')(hProcess, lpExitCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getexitcodethread
  public static GetExitCodeThread(hThread: HANDLE, lpExitCode: LPVOID): BOOL {
    return Kernel32.Load('GetExitCodeThread')(hThread, lpExitCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lzexpand/nf-lzexpand-getexpandednamea
  public static GetExpandedNameA(lpszSource: LPSTR, lpszBuffer: LPSTR): INT {
    return Kernel32.Load('GetExpandedNameA')(lpszSource, lpszBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lzexpand/nf-lzexpand-getexpandednamew
  public static GetExpandedNameW(lpszSource: LPWSTR, lpszBuffer: LPWSTR): INT {
    return Kernel32.Load('GetExpandedNameW')(lpszSource, lpszBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfileattributesa
  public static GetFileAttributesA(lpFileName: LPSTR): DWORD {
    return Kernel32.Load('GetFileAttributesA')(lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfileattributesexa
  public static GetFileAttributesExA(lpFileName: LPSTR, fInfoLevelId: DWORD, lpFileInformation: LPVOID): BOOL {
    return Kernel32.Load('GetFileAttributesExA')(lpFileName, fInfoLevelId, lpFileInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfileattributesexw
  public static GetFileAttributesExW(lpFileName: LPWSTR, fInfoLevelId: DWORD, lpFileInformation: LPVOID): BOOL {
    return Kernel32.Load('GetFileAttributesExW')(lpFileName, fInfoLevelId, lpFileInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfileattributestransacteda
  public static GetFileAttributesTransactedA(lpFileName: LPSTR, fInfoLevelId: DWORD, lpFileInformation: LPVOID, hTransaction: HANDLE): BOOL {
    return Kernel32.Load('GetFileAttributesTransactedA')(lpFileName, fInfoLevelId, lpFileInformation, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfileattributestransactedw
  public static GetFileAttributesTransactedW(lpFileName: LPWSTR, fInfoLevelId: DWORD, lpFileInformation: LPVOID, hTransaction: HANDLE): BOOL {
    return Kernel32.Load('GetFileAttributesTransactedW')(lpFileName, fInfoLevelId, lpFileInformation, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfileattributesw
  public static GetFileAttributesW(lpFileName: LPWSTR): DWORD {
    return Kernel32.Load('GetFileAttributesW')(lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfilebandwidthreservation
  public static GetFileBandwidthReservation(hFile: HANDLE, lpPeriodMilliseconds: LPVOID, lpBytesPerPeriod: LPVOID, pDiscardable: LPVOID, lpTransferSize: LPVOID, lpNumOutstandingRequests: LPVOID): BOOL {
    return Kernel32.Load('GetFileBandwidthReservation')(hFile, lpPeriodMilliseconds, lpBytesPerPeriod, pDiscardable, lpTransferSize, lpNumOutstandingRequests);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfileinformationbyhandle
  public static GetFileInformationByHandle(hFile: HANDLE, lpFileInformation: LPVOID): BOOL {
    return Kernel32.Load('GetFileInformationByHandle')(hFile, lpFileInformation);
  }
  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfileinformationbyhandleex
  public static GetFileInformationByHandleEx(hFile: HANDLE, FileInformationClass: DWORD, lpFileInformation: LPVOID, dwBufferSize: DWORD): BOOL {
    return Kernel32.Load('GetFileInformationByHandleEx')(hFile, FileInformationClass, lpFileInformation, dwBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfileinformationbyname
  public static GetFileInformationByName(FileName: LPWSTR, FileInformationClass: DWORD, FileInfoBuffer: LPVOID, FileInfoBufferSize: DWORD): BOOL {
    return Kernel32.Load('GetFileInformationByName')(FileName, FileInformationClass, FileInfoBuffer, FileInfoBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfilemuiinfo
  public static GetFileMUIInfo(dwFlags: DWORD, pcwszFilePath: LPWSTR, pFileMUIInfo: LPVOID, pcbFileMUIInfo: LPVOID): BOOL {
    return Kernel32.Load('GetFileMUIInfo')(dwFlags, pcwszFilePath, pFileMUIInfo, pcbFileMUIInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfilemuipath
  public static GetFileMUIPath(dwFlags: DWORD, pcwszFilePath: LPWSTR, pwszLanguage: LPWSTR, pcchLanguage: LPVOID, pwszFileMUIPath: LPWSTR, pcchFileMUIPath: LPVOID, pululEnumerator: LPVOID): BOOL {
    return Kernel32.Load('GetFileMUIPath')(dwFlags, pcwszFilePath, pwszLanguage, pcchLanguage, pwszFileMUIPath, pcchFileMUIPath, pululEnumerator);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfilesize
  public static GetFileSize(hFile: HANDLE, lpFileSizeHigh: LPVOID): DWORD {
    return Kernel32.Load('GetFileSize')(hFile, lpFileSizeHigh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfilesizeex
  public static GetFileSizeEx(hFile: HANDLE, lpFileSize: LPVOID): BOOL {
    return Kernel32.Load('GetFileSizeEx')(hFile, lpFileSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfiletime
  public static GetFileTime(hFile: HANDLE, lpCreationTime: LPVOID, lpLastAccessTime: LPVOID, lpLastWriteTime: LPVOID): BOOL {
    return Kernel32.Load('GetFileTime')(hFile, lpCreationTime, lpLastAccessTime, lpLastWriteTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfiletype
  public static GetFileType(hFile: HANDLE): DWORD {
    return Kernel32.Load('GetFileType')(hFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfinalpathnamebyhandlea
  public static GetFinalPathNameByHandleA(hFile: HANDLE, lpszFilePath: LPSTR, cchFilePath: DWORD, dwFlags: DWORD): DWORD {
    return Kernel32.Load('GetFinalPathNameByHandleA')(hFile, lpszFilePath, cchFilePath, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfinalpathnamebyhandlew
  public static GetFinalPathNameByHandleW(hFile: HANDLE, lpszFilePath: LPWSTR, cchFilePath: DWORD, dwFlags: DWORD): DWORD {
    return Kernel32.Load('GetFinalPathNameByHandleW')(hFile, lpszFilePath, cchFilePath, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getfirmwareenvironmentvariablea
  public static GetFirmwareEnvironmentVariableA(lpName: LPSTR, lpGuid: LPSTR, pBuffer: LPVOID, nSize: DWORD): DWORD {
    return Kernel32.Load('GetFirmwareEnvironmentVariableA')(lpName, lpGuid, pBuffer, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getfirmwareenvironmentvariableexa
  public static GetFirmwareEnvironmentVariableExA(lpName: LPSTR, lpGuid: LPSTR, pBuffer: LPVOID, nSize: DWORD, pdwAttribubutes: LPVOID): DWORD {
    return Kernel32.Load('GetFirmwareEnvironmentVariableExA')(lpName, lpGuid, pBuffer, nSize, pdwAttribubutes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getfirmwareenvironmentvariableexw
  public static GetFirmwareEnvironmentVariableExW(lpName: LPWSTR, lpGuid: LPWSTR, pBuffer: LPVOID, nSize: DWORD, pdwAttribubutes: LPVOID): DWORD {
    return Kernel32.Load('GetFirmwareEnvironmentVariableExW')(lpName, lpGuid, pBuffer, nSize, pdwAttribubutes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getfirmwareenvironmentvariablew
  public static GetFirmwareEnvironmentVariableW(lpName: LPWSTR, lpGuid: LPWSTR, pBuffer: LPVOID, nSize: DWORD): DWORD {
    return Kernel32.Load('GetFirmwareEnvironmentVariableW')(lpName, lpGuid, pBuffer, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getfirmwaretype
  public static GetFirmwareType(FirmwareType: LPVOID): BOOL {
    return Kernel32.Load('GetFirmwareType')(FirmwareType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfullpathnamea
  public static GetFullPathNameA(lpFileName: LPSTR, nBufferLength: DWORD, lpBuffer: LPSTR, lpFilePart: LPVOID): DWORD {
    return Kernel32.Load('GetFullPathNameA')(lpFileName, nBufferLength, lpBuffer, lpFilePart);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfullpathnametransacteda
  public static GetFullPathNameTransactedA(lpFileName: LPSTR, nBufferLength: DWORD, lpBuffer: LPSTR, lpFilePart: LPVOID, hTransaction: HANDLE): DWORD {
    return Kernel32.Load('GetFullPathNameTransactedA')(lpFileName, nBufferLength, lpBuffer, lpFilePart, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfullpathnametransactedw
  public static GetFullPathNameTransactedW(lpFileName: LPWSTR, nBufferLength: DWORD, lpBuffer: LPWSTR, lpFilePart: LPVOID, hTransaction: HANDLE): DWORD {
    return Kernel32.Load('GetFullPathNameTransactedW')(lpFileName, nBufferLength, lpBuffer, lpFilePart, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfullpathnamew
  public static GetFullPathNameW(lpFileName: LPWSTR, nBufferLength: DWORD, lpBuffer: LPWSTR, lpFilePart: LPVOID | NULL): DWORD {
    return Kernel32.Load('GetFullPathNameW')(lpFileName, nBufferLength, lpBuffer, lpFilePart);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getgeoinfoa
  public static GetGeoInfoA(Location: INT, GeoType: DWORD, lpGeoData: LPSTR, cchData: INT, LangId: USHORT): INT {
    return Kernel32.Load('GetGeoInfoA')(Location, GeoType, lpGeoData, cchData, LangId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getgeoinfoex
  public static GetGeoInfoEx(location: LPWSTR, geoType: DWORD, geoData: LPWSTR, geoDataCount: INT): INT {
    return Kernel32.Load('GetGeoInfoEx')(location, geoType, geoData, geoDataCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getgeoinfow
  public static GetGeoInfoW(Location: INT, GeoType: DWORD, lpGeoData: LPWSTR, cchData: INT, LangId: USHORT): INT {
    return Kernel32.Load('GetGeoInfoW')(Location, GeoType, lpGeoData, cchData, LangId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/handleapi/nf-handleapi-gethandleinformation
  public static GetHandleInformation(hObject: HANDLE, lpdwFlags: LPVOID): BOOL {
    return Kernel32.Load('GetHandleInformation')(hObject, lpdwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-getlargepageminimum
  public static GetLargePageMinimum(): LPVOID {
    return Kernel32.Load('GetLargePageMinimum')();
  }

  // https://learn.microsoft.com/en-us/windows/console/getlargestconsolewindowsize
  public static GetLargestConsoleWindowSize(hConsoleOutput: HANDLE): DWORD {
    return Kernel32.Load('GetLargestConsoleWindowSize')(hConsoleOutput);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/errhandlingapi/nf-errhandlingapi-getlasterror
  public static GetLastError(): DWORD {
    return Kernel32.Load('GetLastError')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-getlocaleinfoa
  public static GetLocaleInfoA(Locale: LCID, LCType: DWORD, lpLCData: LPSTR, cchData: INT): INT {
    return Kernel32.Load('GetLocaleInfoA')(Locale, LCType, lpLCData, cchData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-getlocaleinfoex
  public static GetLocaleInfoEx(lpLocaleName: LPCWSTR, LCType: DWORD, lpLCData: LPWSTR, cchData: INT): INT {
    return Kernel32.Load('GetLocaleInfoEx')(lpLocaleName, LCType, lpLCData, cchData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-getlocaleinfow
  public static GetLocaleInfoW(Locale: LCID, LCType: DWORD, lpLCData: LPWSTR, cchData: INT): INT {
    return Kernel32.Load('GetLocaleInfoW')(Locale, LCType, lpLCData, cchData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-getlocaltime
  public static GetLocalTime(lpSystemTime: LPVOID): VOID {
    return Kernel32.Load('GetLocalTime')(lpSystemTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getlogicaldrives
  public static GetLogicalDrives(): DWORD {
    return Kernel32.Load('GetLogicalDrives')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getlogicaldrivestringsa
  public static GetLogicalDriveStringsA(nBufferLength: DWORD, lpBuffer: LPSTR): DWORD {
    return Kernel32.Load('GetLogicalDriveStringsA')(nBufferLength, lpBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getlogicaldrivestringsw
  public static GetLogicalDriveStringsW(nBufferLength: DWORD, lpBuffer: LPWSTR): DWORD {
    return Kernel32.Load('GetLogicalDriveStringsW')(nBufferLength, lpBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processtopologyapi/nf-processtopologyapi-getlogicalprocessorinformation
  public static GetLogicalProcessorInformation(Buffer: LPVOID, ReturnedLength: LPVOID): BOOL {
    return Kernel32.Load('GetLogicalProcessorInformation')(Buffer, ReturnedLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processtopologyapi/nf-processtopologyapi-getlogicalprocessorinformationex
  public static GetLogicalProcessorInformationEx(RelationshipType: DWORD, Buffer: LPVOID, ReturnedLength: LPVOID): BOOL {
    return Kernel32.Load('GetLogicalProcessorInformationEx')(RelationshipType, Buffer, ReturnedLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getlongpathnamea
  public static GetLongPathNameA(lpszShortPath: LPSTR, lpszLongPath: LPSTR, cchBuffer: DWORD): DWORD {
    return Kernel32.Load('GetLongPathNameA')(lpszShortPath, lpszLongPath, cchBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getlongpathnametransacteda
  public static GetLongPathNameTransactedA(lpszShortPath: LPSTR, lpszLongPath: LPSTR, cchBuffer: DWORD, hTransaction: HANDLE): DWORD {
    return Kernel32.Load('GetLongPathNameTransactedA')(lpszShortPath, lpszLongPath, cchBuffer, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getlongpathnametransactedw
  public static GetLongPathNameTransactedW(lpszShortPath: LPWSTR, lpszLongPath: LPWSTR, cchBuffer: DWORD, hTransaction: HANDLE): DWORD {
    return Kernel32.Load('GetLongPathNameTransactedW')(lpszShortPath, lpszLongPath, cchBuffer, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getlongpathnamew
  public static GetLongPathNameW(lpszShortPath: LPWSTR, lpszLongPath: LPWSTR, cchBuffer: DWORD): DWORD {
    return Kernel32.Load('GetLongPathNameW')(lpszShortPath, lpszLongPath, cchBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getmachinetypeattributes
  public static GetMachineTypeAttributes(Machine: USHORT, MachineTypeAttributes: LPVOID): DWORD {
    return Kernel32.Load('GetMachineTypeAttributes')(Machine, MachineTypeAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getmailslotinfo
  public static GetMailslotInfo(hMailslot: HANDLE, lpMaxMessageSize: LPVOID, lpNextSize: LPVOID, lpMessageCount: LPVOID, lpReadTimeout: LPVOID): BOOL {
    return Kernel32.Load('GetMailslotInfo')(hMailslot, lpMaxMessageSize, lpNextSize, lpMessageCount, lpReadTimeout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getmaximumprocessorcount
  public static GetMaximumProcessorCount(GroupNumber: USHORT): DWORD {
    return Kernel32.Load('GetMaximumProcessorCount')(GroupNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processtopologyapi/nf-processtopologyapi-getmaximumprocessorgroupcount
  public static GetMaximumProcessorGroupCount(): USHORT {
    return Kernel32.Load('GetMaximumProcessorGroupCount')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getmemoryerrorhandlingcapabilities
  public static GetMemoryErrorHandlingCapabilities(Capabilities: LPVOID): BOOL {
    return Kernel32.Load('GetMemoryErrorHandlingCapabilities')(Capabilities);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-getmodulefilenamea
  public static GetModuleFileNameA(hModule: HMODULE, lpFilename: LPSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('GetModuleFileNameA')(hModule, lpFilename, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-getmodulefilenamew
  public static GetModuleFileNameW(hModule: HMODULE, lpFilename: LPWSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('GetModuleFileNameW')(hModule, lpFilename, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-getmodulehandlea
  public static GetModuleHandleA(lpModuleName: LPSTR): HMODULE {
    return Kernel32.Load('GetModuleHandleA')(lpModuleName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-getmodulehandleexa
  public static GetModuleHandleExA(dwFlags: DWORD, lpModuleName: LPSTR, phModule: LPVOID): BOOL {
    return Kernel32.Load('GetModuleHandleExA')(dwFlags, lpModuleName, phModule);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-getmodulehandleexw
  public static GetModuleHandleExW(dwFlags: DWORD, lpModuleName: LPWSTR, phModule: LPVOID): BOOL {
    return Kernel32.Load('GetModuleHandleExW')(dwFlags, lpModuleName, phModule);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-getmodulehandlew
  public static GetModuleHandleW(lpModuleName: LPWSTR): HMODULE {
    return Kernel32.Load('GetModuleHandleW')(lpModuleName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-getnamedpipeclientcomputernamea
  public static GetNamedPipeClientComputerNameA(Pipe: HANDLE, ClientComputerName: LPSTR, ClientComputerNameLength: DWORD): BOOL {
    return Kernel32.Load('GetNamedPipeClientComputerNameA')(Pipe, ClientComputerName, ClientComputerNameLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-getnamedpipeclientcomputernamew
  public static GetNamedPipeClientComputerNameW(Pipe: HANDLE, ClientComputerName: LPWSTR, ClientComputerNameLength: DWORD): BOOL {
    return Kernel32.Load('GetNamedPipeClientComputerNameW')(Pipe, ClientComputerName, ClientComputerNameLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-getnamedpipeclientprocessid
  public static GetNamedPipeClientProcessId(Pipe: HANDLE, ClientProcessId: LPVOID): BOOL {
    return Kernel32.Load('GetNamedPipeClientProcessId')(Pipe, ClientProcessId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-getnamedpipeclientsessionid
  public static GetNamedPipeClientSessionId(Pipe: HANDLE, ClientSessionId: LPVOID): BOOL {
    return Kernel32.Load('GetNamedPipeClientSessionId')(Pipe, ClientSessionId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-getnamedpipehandlestatea
  public static GetNamedPipeHandleStateA(hNamedPipe: HANDLE, lpState: LPVOID, lpCurInstances: LPVOID, lpMaxCollectionCount: LPVOID, lpCollectDataTimeout: LPVOID, lpUserName: LPSTR, nMaxUserNameSize: DWORD): BOOL {
    return Kernel32.Load('GetNamedPipeHandleStateA')(hNamedPipe, lpState, lpCurInstances, lpMaxCollectionCount, lpCollectDataTimeout, lpUserName, nMaxUserNameSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-getnamedpipehandlestatew
  public static GetNamedPipeHandleStateW(hNamedPipe: HANDLE, lpState: LPVOID, lpCurInstances: LPVOID, lpMaxCollectionCount: LPVOID, lpCollectDataTimeout: LPVOID, lpUserName: LPWSTR, nMaxUserNameSize: DWORD): BOOL {
    return Kernel32.Load('GetNamedPipeHandleStateW')(hNamedPipe, lpState, lpCurInstances, lpMaxCollectionCount, lpCollectDataTimeout, lpUserName, nMaxUserNameSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-getnamedpipeinfo
  public static GetNamedPipeInfo(hNamedPipe: HANDLE, lpFlags: LPVOID, lpOutBufferSize: LPVOID, lpInBufferSize: LPVOID, lpMaxInstances: LPVOID): BOOL {
    return Kernel32.Load('GetNamedPipeInfo')(hNamedPipe, lpFlags, lpOutBufferSize, lpInBufferSize, lpMaxInstances);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-getnamedpipeserverprocessid
  public static GetNamedPipeServerProcessId(Pipe: HANDLE, ServerProcessId: LPVOID): BOOL {
    return Kernel32.Load('GetNamedPipeServerProcessId')(Pipe, ServerProcessId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-getnamedpipeserversessionid
  public static GetNamedPipeServerSessionId(Pipe: HANDLE, ServerSessionId: LPVOID): BOOL {
    return Kernel32.Load('GetNamedPipeServerSessionId')(Pipe, ServerSessionId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-getnativesysteminfo
  public static GetNativeSystemInfo(lpSystemInfo: LPVOID): VOID {
    return Kernel32.Load('GetNativeSystemInfo')(lpSystemInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getnextumslistitem
  public static GetNextUmsListItem(UmsContext: LPVOID): LPVOID {
    return Kernel32.Load('GetNextUmsListItem')(UmsContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getnlsversion
  public static GetNLSVersion(_Function: DWORD, Locale: DWORD, lpVersionInformation: LPVOID): BOOL {
    return Kernel32.Load('GetNLSVersion')(_Function, Locale, lpVersionInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getnlsversionex
  public static GetNLSVersionEx(_function: DWORD, lpLocaleName: LPWSTR, lpVersionInformation: LPVOID): BOOL {
    return Kernel32.Load('GetNLSVersionEx')(_function, lpLocaleName, lpVersionInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getnumaavailablememorynode
  public static GetNumaAvailableMemoryNode(Node: LPVOID, AvailableBytes: LPVOID): BOOL {
    return Kernel32.Load('GetNumaAvailableMemoryNode')(Node, AvailableBytes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getnumaavailablememorynodeex
  public static GetNumaAvailableMemoryNodeEx(Node: USHORT, AvailableBytes: LPVOID): BOOL {
    return Kernel32.Load('GetNumaAvailableMemoryNodeEx')(Node, AvailableBytes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getnumahighestnodenumber
  public static GetNumaHighestNodeNumber(HighestNodeNumber: LPVOID): BOOL {
    return Kernel32.Load('GetNumaHighestNodeNumber')(HighestNodeNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getnumanodenumberfromhandle
  public static GetNumaNodeNumberFromHandle(hFile: HANDLE, NodeNumber: LPVOID): BOOL {
    return Kernel32.Load('GetNumaNodeNumberFromHandle')(hFile, NodeNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getnumanodeprocessormask
  public static GetNumaNodeProcessorMask(Node: LPVOID, ProcessorMask: LPVOID): BOOL {
    return Kernel32.Load('GetNumaNodeProcessorMask')(Node, ProcessorMask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getnumanodeprocessormask2
  public static GetNumaNodeProcessorMask2(NodeNumber: USHORT, ProcessorMasks: LPVOID, ProcessorMaskCount: USHORT, RequiredMaskCount: LPVOID): BOOL {
    return Kernel32.Load('GetNumaNodeProcessorMask2')(NodeNumber, ProcessorMasks, ProcessorMaskCount, RequiredMaskCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getnumanodeprocessormaskex
  public static GetNumaNodeProcessorMaskEx(Node: USHORT, ProcessorMask: LPVOID): BOOL {
    return Kernel32.Load('GetNumaNodeProcessorMaskEx')(Node, ProcessorMask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getnumaprocessornode
  public static GetNumaProcessorNode(Processor: LPVOID, NodeNumber: LPVOID): BOOL {
    return Kernel32.Load('GetNumaProcessorNode')(Processor, NodeNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getnumaprocessornodeex
  public static GetNumaProcessorNodeEx(Processor: LPVOID, NodeNumber: LPVOID): BOOL {
    return Kernel32.Load('GetNumaProcessorNodeEx')(Processor, NodeNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getnumaproximitynode
  public static GetNumaProximityNode(ProximityId: DWORD, NodeNumber: LPVOID): BOOL {
    return Kernel32.Load('GetNumaProximityNode')(ProximityId, NodeNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getnumaproximitynodeex
  public static GetNumaProximityNodeEx(ProximityId: DWORD, NodeNumber: LPVOID): BOOL {
    return Kernel32.Load('GetNumaProximityNodeEx')(ProximityId, NodeNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-getnumberformata
  public static GetNumberFormatA(Locale: DWORD, dwFlags: DWORD, lpValue: LPSTR, lpFormat: LPVOID, lpNumberStr: LPSTR, cchNumber: INT): INT {
    return Kernel32.Load('GetNumberFormatA')(Locale, dwFlags, lpValue, lpFormat, lpNumberStr, cchNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-getnumberformatex
  public static GetNumberFormatEx(lpLocaleName: LPWSTR, dwFlags: DWORD, lpValue: LPWSTR, lpFormat: LPVOID, lpNumberStr: LPWSTR, cchNumber: INT): INT {
    return Kernel32.Load('GetNumberFormatEx')(lpLocaleName, dwFlags, lpValue, lpFormat, lpNumberStr, cchNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-getnumberformatw
  public static GetNumberFormatW(Locale: DWORD, dwFlags: DWORD, lpValue: LPWSTR, lpFormat: LPVOID, lpNumberStr: LPWSTR, cchNumber: INT): INT {
    return Kernel32.Load('GetNumberFormatW')(Locale, dwFlags, lpValue, lpFormat, lpNumberStr, cchNumber);
  }

  // https://learn.microsoft.com/en-us/windows/console/getnumberofconsolefonts
  public static GetNumberOfConsoleFonts(): DWORD {
    return Kernel32.Load('GetNumberOfConsoleFonts')();
  }

  // https://learn.microsoft.com/en-us/windows/console/getnumberofconsoleinputevents
  public static GetNumberOfConsoleInputEvents(hConsoleInput: HANDLE, lpNumberOfEvents: LPVOID): BOOL {
    return Kernel32.Load('GetNumberOfConsoleInputEvents')(hConsoleInput, lpNumberOfEvents);
  }

  // https://learn.microsoft.com/en-us/windows/console/getnumberofconsolemousebuttons
  public static GetNumberOfConsoleMouseButtons(lpNumberOfMouseButtons: LPVOID): BOOL {
    return Kernel32.Load('GetNumberOfConsoleMouseButtons')(lpNumberOfMouseButtons);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getoemcp
  public static GetOEMCP(): DWORD {
    return Kernel32.Load('GetOEMCP')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-getoverlappedresult
  public static GetOverlappedResult(hFile: HANDLE, lpOverlapped: LPVOID, lpNumberOfBytesTransferred: LPVOID, bWait: BOOL): BOOL {
    return Kernel32.Load('GetOverlappedResult')(hFile, lpOverlapped, lpNumberOfBytesTransferred, bWait);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-getoverlappedresultex
  public static GetOverlappedResultEx(hFile: HANDLE, lpOverlapped: LPVOID, lpNumberOfBytesTransferred: LPVOID, dwMilliseconds: DWORD, bAlertable: BOOL): BOOL {
    return Kernel32.Load('GetOverlappedResultEx')(hFile, lpOverlapped, lpNumberOfBytesTransferred, dwMilliseconds, bAlertable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmodel/nf-appmodel-getpackageapplicationids
  public static GetPackageApplicationIds(packageInfoReference: LPVOID, bufferLength: LPVOID, buffer: LPVOID, count: LPVOID): DWORD {
    return Kernel32.Load('GetPackageApplicationIds')(packageInfoReference, bufferLength, buffer, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmodel/nf-appmodel-getpackagefamilyname
  public static GetPackageFamilyName(hProcess: HANDLE, packageFamilyNameLength: LPVOID, packageFamilyName: LPWSTR): DWORD {
    return Kernel32.Load('GetPackageFamilyName')(hProcess, packageFamilyNameLength, packageFamilyName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmodel/nf-appmodel-getpackagefullname
  public static GetPackageFullName(hProcess: HANDLE, packageFullNameLength: LPVOID, packageFullName: LPWSTR): DWORD {
    return Kernel32.Load('GetPackageFullName')(hProcess, packageFullNameLength, packageFullName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmodel/nf-appmodel-getpackageid
  public static GetPackageId(hProcess: HANDLE, bufferLength: LPVOID, buffer: LPVOID): DWORD {
    return Kernel32.Load('GetPackageId')(hProcess, bufferLength, buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmodel/nf-appmodel-getpackageinfo
  public static GetPackageInfo(packageInfoReference: LPVOID, flags: DWORD, bufferLength: LPVOID, buffer: LPVOID, count: LPVOID): DWORD {
    return Kernel32.Load('GetPackageInfo')(packageInfoReference, flags, bufferLength, buffer, count);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmodel/nf-appmodel-getpackagepath
  public static GetPackagePath(packageId: LPVOID, reserved: DWORD, pathLength: LPVOID, path: LPWSTR): DWORD {
    return Kernel32.Load('GetPackagePath')(packageId, reserved, pathLength, path);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmodel/nf-appmodel-getpackagepathbyfullname
  public static GetPackagePathByFullName(packageFullName: LPWSTR, pathLength: LPVOID, path: LPWSTR): DWORD {
    return Kernel32.Load('GetPackagePathByFullName')(packageFullName, pathLength, path);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmodel/nf-appmodel-getpackagesbypackagefamily
  public static GetPackagesByPackageFamily(packageFamilyName: LPWSTR, count: LPVOID, packageFullNames: LPVOID, bufferLength: LPVOID, buffer: LPWSTR): DWORD {
    return Kernel32.Load('GetPackagesByPackageFamily')(packageFamilyName, count, packageFullNames, bufferLength, buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getphysicallyinstalledsystemmemory
  public static GetPhysicallyInstalledSystemMemory(TotalMemoryInKilobytes: LPVOID): BOOL {
    return Kernel32.Load('GetPhysicallyInstalledSystemMemory')(TotalMemoryInKilobytes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getpriorityclass
  public static GetPriorityClass(hProcess: HANDLE): DWORD {
    return Kernel32.Load('GetPriorityClass')(hProcess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprivateprofileinta
  public static GetPrivateProfileIntA(lpAppName: LPSTR, lpKeyName: LPSTR, nDefault: INT, lpFileName: LPSTR): DWORD {
    return Kernel32.Load('GetPrivateProfileIntA')(lpAppName, lpKeyName, nDefault, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprivateprofileintw
  public static GetPrivateProfileIntW(lpAppName: LPWSTR, lpKeyName: LPWSTR, nDefault: INT, lpFileName: LPWSTR): INT {
    return Kernel32.Load('GetPrivateProfileIntW')(lpAppName, lpKeyName, nDefault, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprivateprofilesectiona
  public static GetPrivateProfileSectionA(lpAppName: LPSTR, lpReturnedString: LPSTR, nSize: DWORD, lpFileName: LPSTR): DWORD {
    return Kernel32.Load('GetPrivateProfileSectionA')(lpAppName, lpReturnedString, nSize, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprivateprofilesectionnamesa
  public static GetPrivateProfileSectionNamesA(lpszReturnBuffer: LPSTR, nSize: DWORD, lpFileName: LPSTR): DWORD {
    return Kernel32.Load('GetPrivateProfileSectionNamesA')(lpszReturnBuffer, nSize, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprivateprofilesectionnamesw
  public static GetPrivateProfileSectionNamesW(lpszReturnBuffer: LPWSTR, nSize: DWORD, lpFileName: LPWSTR): DWORD {
    return Kernel32.Load('GetPrivateProfileSectionNamesW')(lpszReturnBuffer, nSize, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprivateprofilesectionw
  public static GetPrivateProfileSectionW(lpAppName: LPWSTR, lpReturnedString: LPWSTR, nSize: DWORD, lpFileName: LPWSTR): DWORD {
    return Kernel32.Load('GetPrivateProfileSectionW')(lpAppName, lpReturnedString, nSize, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprivateprofilestringa
  public static GetPrivateProfileStringA(lpAppName: LPSTR, lpKeyName: LPSTR, lpDefault: LPSTR, lpReturnedString: LPSTR, nSize: DWORD, lpFileName: LPSTR): DWORD {
    return Kernel32.Load('GetPrivateProfileStringA')(lpAppName, lpKeyName, lpDefault, lpReturnedString, nSize, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprivateprofilestringw
  public static GetPrivateProfileStringW(lpAppName: LPWSTR, lpKeyName: LPWSTR, lpDefault: LPWSTR, lpReturnedString: LPWSTR, nSize: DWORD, lpFileName: LPWSTR): DWORD {
    return Kernel32.Load('GetPrivateProfileStringW')(lpAppName, lpKeyName, lpDefault, lpReturnedString, nSize, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprivateprofilestructa
  public static GetPrivateProfileStructA(lpszSection: LPSTR, lpszKey: LPSTR, lpStruct: LPVOID, uSizeStruct: DWORD, szFile: LPSTR): BOOL {
    return Kernel32.Load('GetPrivateProfileStructA')(lpszSection, lpszKey, lpStruct, uSizeStruct, szFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprivateprofilestructw
  public static GetPrivateProfileStructW(lpszSection: LPWSTR, lpszKey: LPWSTR, lpStruct: LPVOID, uSizeStruct: DWORD, szFile: LPWSTR): BOOL {
    return Kernel32.Load('GetPrivateProfileStructW')(lpszSection, lpszKey, lpStruct, uSizeStruct, szFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-getprocaddress
  public static GetProcAddress(hModule: HMODULE, lpProcName: LPSTR): LPVOID {
    return Kernel32.Load('GetProcAddress')(hModule, lpProcName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprocessaffinitymask
  public static GetProcessAffinityMask(hProcess: HANDLE, lpProcessAffinityMask: LPVOID, lpSystemAffinityMask: LPVOID): BOOL {
    return Kernel32.Load('GetProcessAffinityMask')(hProcess, lpProcessAffinityMask, lpSystemAffinityMask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprocessdefaultcpusetmasks
  public static GetProcessDefaultCpuSetMasks(Process: HANDLE, CpuSetMasks: LPVOID, CpuSetMaskCount: USHORT, RequiredMaskCount: LPVOID): BOOL {
    return Kernel32.Load('GetProcessDefaultCpuSetMasks')(Process, CpuSetMasks, CpuSetMaskCount, RequiredMaskCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprocessdefaultcpusets
  public static GetProcessDefaultCpuSets(Process: HANDLE, CpuSetIds: LPVOID, CpuSetIdCount: DWORD, RequiredIdCount: LPVOID): BOOL {
    return Kernel32.Load('GetProcessDefaultCpuSets')(Process, CpuSetIds, CpuSetIdCount, RequiredIdCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprocessdeppolicy
  public static GetProcessDEPPolicy(hProcess: HANDLE, lpFlags: LPVOID, lpPermanent: LPVOID): BOOL {
    return Kernel32.Load('GetProcessDEPPolicy')(hProcess, lpFlags, lpPermanent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprocessesinvirtualizationcontext
  public static GetProcessesInVirtualizationContext(packageFamilyName: LPWSTR, count: LPVOID, processes: LPVOID): DWORD {
    return Kernel32.Load('GetProcessesInVirtualizationContext')(packageFamilyName, count, processes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processtopologyapi/nf-processtopologyapi-getprocessgroupaffinity
  public static GetProcessGroupAffinity(hProcess: HANDLE, GroupCount: LPVOID, GroupArray: LPVOID): BOOL {
    return Kernel32.Load('GetProcessGroupAffinity')(hProcess, GroupCount, GroupArray);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprocesshandlecount
  public static GetProcessHandleCount(hProcess: HANDLE, pdwHandleCount: LPVOID): BOOL {
    return Kernel32.Load('GetProcessHandleCount')(hProcess, pdwHandleCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprocessheap
  public static GetProcessHeap(): HANDLE {
    return Kernel32.Load('GetProcessHeap')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprocessheaps
  public static GetProcessHeaps(NumberOfHeaps: DWORD, ProcessHeaps: LPVOID): DWORD {
    return Kernel32.Load('GetProcessHeaps')(NumberOfHeaps, ProcessHeaps);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getprocessid
  public static GetProcessId(Process: HANDLE): DWORD {
    return Kernel32.Load('GetProcessId')(Process);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprocessidofthread
  public static GetProcessIdOfThread(Thread: HANDLE): DWORD {
    return Kernel32.Load('GetProcessIdOfThread')(Thread);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprocessinformation
  public static GetProcessInformation(hProcess: HANDLE, ProcessInformationClass: DWORD, ProcessInformation: LPVOID, ProcessInformationSize: DWORD): BOOL {
    return Kernel32.Load('GetProcessInformation')(hProcess, ProcessInformationClass, ProcessInformation, ProcessInformationSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprocessiocounters
  public static GetProcessIoCounters(hProcess: HANDLE, lpIoCounters: LPVOID): BOOL {
    return Kernel32.Load('GetProcessIoCounters')(hProcess, lpIoCounters);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprocessmitigationpolicy
  public static GetProcessMitigationPolicy(hProcess: HANDLE, MitigationPolicy: DWORD, lpBuffer: LPVOID, dwLength: LPVOID): BOOL {
    return Kernel32.Load('GetProcessMitigationPolicy')(hProcess, MitigationPolicy, lpBuffer, dwLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprocessorsystemcycletime
  public static GetProcessorSystemCycleTime(Group: USHORT, Buffer: LPVOID, ReturnedLength: LPVOID): BOOL {
    return Kernel32.Load('GetProcessorSystemCycleTime')(Group, Buffer, ReturnedLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprocesspreferreduilanguages
  public static GetProcessPreferredUILanguages(dwFlags: DWORD, pulNumLanguages: LPVOID, pwszLanguagesBuffer: LPWSTR, pcchLanguagesBuffer: LPVOID): BOOL {
    return Kernel32.Load('GetProcessPreferredUILanguages')(dwFlags, pulNumLanguages, pwszLanguagesBuffer, pcchLanguagesBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprocesspriorityboost
  public static GetProcessPriorityBoost(hProcess: HANDLE, pDisablePriorityBoost: LPVOID): BOOL {
    return Kernel32.Load('GetProcessPriorityBoost')(hProcess, pDisablePriorityBoost);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprocessshutdownparameters
  public static GetProcessShutdownParameters(lpdwLevel: LPVOID, lpdwFlags: LPVOID): BOOL {
    return Kernel32.Load('GetProcessShutdownParameters')(lpdwLevel, lpdwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprocesstimes
  public static GetProcessTimes(hProcess: HANDLE, lpCreationTime: LPVOID, lpExitTime: LPVOID, lpKernelTime: LPVOID, lpUserTime: LPVOID): BOOL {
    return Kernel32.Load('GetProcessTimes')(hProcess, lpCreationTime, lpExitTime, lpKernelTime, lpUserTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprocessversion
  public static GetProcessVersion(ProcessId: DWORD): DWORD {
    return Kernel32.Load('GetProcessVersion')(ProcessId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprocessworkingsetsize
  public static GetProcessWorkingSetSize(hProcess: HANDLE, lpMinimumWorkingSetSize: LPVOID, lpMaximumWorkingSetSize: LPVOID): BOOL {
    return Kernel32.Load('GetProcessWorkingSetSize')(hProcess, lpMinimumWorkingSetSize, lpMaximumWorkingSetSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprocessworkingsetsizeex
  public static GetProcessWorkingSetSizeEx(hProcess: HANDLE, lpMinimumWorkingSetSize: LPVOID, lpMaximumWorkingSetSize: LPVOID, Flags: LPVOID): BOOL {
    return Kernel32.Load('GetProcessWorkingSetSizeEx')(hProcess, lpMinimumWorkingSetSize, lpMaximumWorkingSetSize, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-getproductinfo
  public static GetProductInfo(dwOSMajorVersion: DWORD, dwOSMinorVersion: DWORD, dwSpMajorVersion: DWORD, dwSpMinorVersion: DWORD, pdwReturnedProductType: LPVOID): BOOL {
    return Kernel32.Load('GetProductInfo')(dwOSMajorVersion, dwOSMinorVersion, dwSpMajorVersion, dwSpMinorVersion, pdwReturnedProductType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprofileinta
  public static GetProfileIntA(lpAppName: LPSTR, lpKeyName: LPSTR, nDefault: INT): DWORD {
    return Kernel32.Load('GetProfileIntA')(lpAppName, lpKeyName, nDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprofileintw
  public static GetProfileIntW(lpAppName: LPWSTR, lpKeyName: LPWSTR, nDefault: INT): DWORD {
    return Kernel32.Load('GetProfileIntW')(lpAppName, lpKeyName, nDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprofilesectiona
  public static GetProfileSectionA(lpAppName: LPSTR, lpReturnedString: LPSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('GetProfileSectionA')(lpAppName, lpReturnedString, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprofilesectionw
  public static GetProfileSectionW(lpAppName: LPWSTR, lpReturnedString: LPWSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('GetProfileSectionW')(lpAppName, lpReturnedString, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprofilestringa
  public static GetProfileStringA(lpAppName: LPSTR, lpKeyName: LPSTR, lpDefault: LPSTR, lpReturnedString: LPSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('GetProfileStringA')(lpAppName, lpKeyName, lpDefault, lpReturnedString, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getprofilestringw
  public static GetProfileStringW(lpAppName: LPWSTR, lpKeyName: LPWSTR, lpDefault: LPWSTR, lpReturnedString: LPWSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('GetProfileStringW')(lpAppName, lpKeyName, lpDefault, lpReturnedString, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-getqueuedcompletionstatus
  public static GetQueuedCompletionStatus(CompletionPort: HANDLE, lpNumberOfBytesTransferred: LPVOID, lpCompletionKey: LPVOID, lpOverlapped: LPVOID, dwMilliseconds: DWORD): BOOL {
    return Kernel32.Load('GetQueuedCompletionStatus')(CompletionPort, lpNumberOfBytesTransferred, lpCompletionKey, lpOverlapped, dwMilliseconds);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-getqueuedcompletionstatusex
  public static GetQueuedCompletionStatusEx(CompletionPort: HANDLE, lpCompletionPortEntries: LPVOID, ulCount: DWORD, ulNumEntriesRemoved: LPVOID, dwMilliseconds: DWORD, fAlertable: BOOL): BOOL {
    return Kernel32.Load('GetQueuedCompletionStatusEx')(CompletionPort, lpCompletionPortEntries, ulCount, ulNumEntriesRemoved, dwMilliseconds, fAlertable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getshortpathnamea
  public static GetShortPathNameA(lpszLongPath: LPSTR, lpszShortPath: LPSTR, cchBuffer: DWORD): DWORD {
    return Kernel32.Load('GetShortPathNameA')(lpszLongPath, lpszShortPath, cchBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getshortpathnamew
  public static GetShortPathNameW(lpszLongPath: LPWSTR, lpszShortPath: LPWSTR, cchBuffer: DWORD): DWORD {
    return Kernel32.Load('GetShortPathNameW')(lpszLongPath, lpszShortPath, cchBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getstagedpackagepathbyfullname
  public static GetStagedPackagePathByFullName(packageFullName: LPWSTR, pathLength: LPVOID, path: LPWSTR): DWORD {
    return Kernel32.Load('GetStagedPackagePathByFullName')(packageFullName, pathLength, path);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getstartupinfoa
  public static GetStartupInfoA(lpStartupInfo: LPVOID): VOID {
    return Kernel32.Load('GetStartupInfoA')(lpStartupInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getstartupinfow
  public static GetStartupInfoW(lpStartupInfo: LPVOID): VOID {
    return Kernel32.Load('GetStartupInfoW')(lpStartupInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-getstdhandle
  public static GetStdHandle(nStdHandle: DWORD): HANDLE {
    return Kernel32.Load('GetStdHandle')(nStdHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getstringscripts
  public static GetStringScripts(dwFlags: DWORD, lpString: LPWSTR, cchString: INT, lpScripts: LPWSTR, cchScripts: INT): INT {
    return Kernel32.Load('GetStringScripts')(dwFlags, lpString, cchString, lpScripts, cchScripts);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getstringtypea
  public static GetStringTypeA(Locale: DWORD, dwInfoType: DWORD, lpSrcStr: LPSTR, cchSrc: INT, lpCharType: LPVOID): BOOL {
    return Kernel32.Load('GetStringTypeA')(Locale, dwInfoType, lpSrcStr, cchSrc, lpCharType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getstringtypeexa
  public static GetStringTypeExA(Locale: DWORD, dwInfoType: DWORD, lpSrcStr: LPSTR, cchSrc: INT, lpCharType: LPVOID): BOOL {
    return Kernel32.Load('GetStringTypeExA')(Locale, dwInfoType, lpSrcStr, cchSrc, lpCharType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getstringtypeexw
  public static GetStringTypeExW(Locale: DWORD, dwInfoType: DWORD, lpSrcStr: LPWSTR, cchSrc: INT, lpCharType: LPVOID): BOOL {
    return Kernel32.Load('GetStringTypeExW')(Locale, dwInfoType, lpSrcStr, cchSrc, lpCharType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getstringtypew
  public static GetStringTypeW(dwInfoType: DWORD, lpSrcStr: LPWSTR, cchSrc: INT, lpCharType: LPVOID): BOOL {
    return Kernel32.Load('GetStringTypeW')(dwInfoType, lpSrcStr, cchSrc, lpCharType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getsystemcpusetinformation
  public static GetSystemCpuSetInformation(Information: LPVOID, BufferLength: DWORD, ReturnedLength: LPVOID, Process: HANDLE, Flags: DWORD): BOOL {
    return Kernel32.Load('GetSystemCpuSetInformation')(Information, BufferLength, ReturnedLength, Process, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getsystemdefaultlangid
  public static GetSystemDefaultLangID(): USHORT {
    return Kernel32.Load('GetSystemDefaultLangID')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getsystemdefaultlcid
  public static GetSystemDefaultLCID(): DWORD {
    return Kernel32.Load('GetSystemDefaultLCID')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getsystemdefaultlocalename
  public static GetSystemDefaultLocaleName(lpLocaleName: LPWSTR, cchLocaleName: INT): INT {
    return Kernel32.Load('GetSystemDefaultLocaleName')(lpLocaleName, cchLocaleName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getsystemdefaultuilanguage
  public static GetSystemDefaultUILanguage(): USHORT {
    return Kernel32.Load('GetSystemDefaultUILanguage')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getsystemdeppolicy
  public static GetSystemDEPPolicy(): DWORD {
    return Kernel32.Load('GetSystemDEPPolicy')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getsystemdirectorya
  public static GetSystemDirectoryA(lpBuffer: LPSTR, uSize: DWORD): DWORD {
    return Kernel32.Load('GetSystemDirectoryA')(lpBuffer, uSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getsystemdirectoryw
  public static GetSystemDirectoryW(lpBuffer: LPWSTR, uSize: DWORD): DWORD {
    return Kernel32.Load('GetSystemDirectoryW')(lpBuffer, uSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-getsystemfilecachesize
  public static GetSystemFileCacheSize(lpMinimumFileCacheSize: LPVOID, lpMaximumFileCacheSize: LPVOID, lpFlags: LPVOID): BOOL {
    return Kernel32.Load('GetSystemFileCacheSize')(lpMinimumFileCacheSize, lpMaximumFileCacheSize, lpFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getsystemfirmwaretable
  public static GetSystemFirmwareTable(FirmwareTableProviderSignature: DWORD, FirmwareTableID: DWORD, pFirmwareTableBuffer: LPVOID, BufferSize: DWORD): DWORD {
    return Kernel32.Load('GetSystemFirmwareTable')(FirmwareTableProviderSignature, FirmwareTableID, pFirmwareTableBuffer, BufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-getsysteminfo
  public static GetSystemInfo(lpSystemInfo: LPVOID): VOID {
    return Kernel32.Load('GetSystemInfo')(lpSystemInfo);
  }

  // public static GetSystemLeapSecondInformation(Enabled: LPVOID, Flags: LPVOID): BOOL {
  //   return Kernel32.Load('GetSystemLeapSecondInformation')(Enabled, Flags);
  // }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getsystempowerstatus
  public static GetSystemPowerStatus(lpSystemPowerStatus: LPVOID): BOOL {
    return Kernel32.Load('GetSystemPowerStatus')(lpSystemPowerStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getsystempreferreduilanguages
  public static GetSystemPreferredUILanguages(dwFlags: DWORD, pulNumLanguages: LPVOID, pwszLanguagesBuffer: LPWSTR, pcchLanguagesBuffer: LPVOID): BOOL {
    return Kernel32.Load('GetSystemPreferredUILanguages')(dwFlags, pulNumLanguages, pwszLanguagesBuffer, pcchLanguagesBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getsystemregistryquota
  public static GetSystemRegistryQuota(pdwQuotaAllowed: LPVOID, pdwQuotaUsed: LPVOID): BOOL {
    return Kernel32.Load('GetSystemRegistryQuota')(pdwQuotaAllowed, pdwQuotaUsed);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-getsystemtime
  public static GetSystemTime(lpSystemTime: LPVOID): VOID {
    return Kernel32.Load('GetSystemTime')(lpSystemTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-getsystemtimeadjustment
  public static GetSystemTimeAdjustment(lpTimeAdjustment: LPVOID, lpTimeIncrement: LPVOID, lpTimeAdjustmentDisabled: LPVOID): BOOL {
    return Kernel32.Load('GetSystemTimeAdjustment')(lpTimeAdjustment, lpTimeIncrement, lpTimeAdjustmentDisabled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-getsystemtimeasfiletime
  public static GetSystemTimeAsFileTime(lpSystemTimeAsFileTime: LPVOID): VOID {
    return Kernel32.Load('GetSystemTimeAsFileTime')(lpSystemTimeAsFileTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getsystemtimepreciseasfiletime
  public static GetSystemTimePreciseAsFileTime(lpSystemTimeAsFileTime: LPVOID): VOID {
    return Kernel32.Load('GetSystemTimePreciseAsFileTime')(lpSystemTimeAsFileTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getsystemtimes
  public static GetSystemTimes(lpIdleTime: LPVOID, lpKernelTime: LPVOID, lpUserTime: LPVOID): BOOL {
    return Kernel32.Load('GetSystemTimes')(lpIdleTime, lpKernelTime, lpUserTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getsystemwindowsdirectorya
  public static GetSystemWindowsDirectoryA(lpBuffer: LPSTR, uSize: DWORD): DWORD {
    return Kernel32.Load('GetSystemWindowsDirectoryA')(lpBuffer, uSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getsystemwindowsdirectoryw
  public static GetSystemWindowsDirectoryW(lpBuffer: LPWSTR, uSize: DWORD): DWORD {
    return Kernel32.Load('GetSystemWindowsDirectoryW')(lpBuffer, uSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getsystemwow64directorya
  public static GetSystemWow64DirectoryA(lpBuffer: LPSTR, uSize: DWORD): DWORD {
    return Kernel32.Load('GetSystemWow64DirectoryA')(lpBuffer, uSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getsystemwow64directoryw
  public static GetSystemWow64DirectoryW(lpBuffer: LPWSTR, uSize: DWORD): DWORD {
    return Kernel32.Load('GetSystemWow64DirectoryW')(lpBuffer, uSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-gettapeparameters
  public static GetTapeParameters(hDevice: HANDLE, dwOperation: DWORD, lpdwSize: LPVOID, lpTapeInformation: LPVOID): DWORD {
    return Kernel32.Load('GetTapeParameters')(hDevice, dwOperation, lpdwSize, lpTapeInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-gettapeposition
  public static GetTapePosition(hDevice: HANDLE, dwPositionType: DWORD, lpdwPartition: LPVOID, lpdwOffsetLow: LPVOID, lpdwOffsetHigh: LPVOID): DWORD {
    return Kernel32.Load('GetTapePosition')(hDevice, dwPositionType, lpdwPartition, lpdwOffsetLow, lpdwOffsetHigh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-gettapestatus
  public static GetTapeStatus(hDevice: HANDLE): DWORD {
    return Kernel32.Load('GetTapeStatus')(hDevice);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-gettempfilenamea
  public static GetTempFileNameA(lpPathName: LPSTR, lpPrefixString: LPSTR, uUnique: DWORD, lpTempFileName: LPSTR): DWORD {
    return Kernel32.Load('GetTempFileNameA')(lpPathName, lpPrefixString, uUnique, lpTempFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-gettempfilenamew
  public static GetTempFileNameW(lpPathName: LPWSTR, lpPrefixString: LPWSTR, uUnique: DWORD, lpTempFileName: LPWSTR): DWORD {
    return Kernel32.Load('GetTempFileNameW')(lpPathName, lpPrefixString, uUnique, lpTempFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-gettemppath2a
  public static GetTempPath2A(BufferLength: DWORD, Buffer: LPSTR): DWORD {
    return Kernel32.Load('GetTempPath2A')(BufferLength, Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-gettemppath2w
  public static GetTempPath2W(BufferLength: DWORD, Buffer: LPWSTR): DWORD {
    return Kernel32.Load('GetTempPath2W')(BufferLength, Buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-gettemppatha
  public static GetTempPathA(nBufferLength: DWORD, lpBuffer: LPSTR): DWORD {
    return Kernel32.Load('GetTempPathA')(nBufferLength, lpBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-gettemppathw
  public static GetTempPathW(nBufferLength: DWORD, lpBuffer: LPWSTR): DWORD {
    return Kernel32.Load('GetTempPathW')(nBufferLength, lpBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getthreadcontext
  public static GetThreadContext(hThread: HANDLE, lpContext: LPVOID): BOOL {
    return Kernel32.Load('GetThreadContext')(hThread, lpContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getthreaddescription
  public static GetThreadDescription(hThread: HANDLE, ppszThreadDescription: LPVOID): DWORD {
    return Kernel32.Load('GetThreadDescription')(hThread, ppszThreadDescription);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getthreadenabledxstatefeatures
  public static GetThreadEnabledXStateFeatures(): ULONGLONG {
    return Kernel32.Load('GetThreadEnabledXStateFeatures')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/errhandlingapi/nf-errhandlingapi-getthreaderrormode
  public static GetThreadErrorMode(): DWORD {
    return Kernel32.Load('GetThreadErrorMode')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processtopologyapi/nf-processtopologyapi-getthreadgroupaffinity
  public static GetThreadGroupAffinity(hThread: HANDLE, GroupAffinity: LPVOID): BOOL {
    return Kernel32.Load('GetThreadGroupAffinity')(hThread, GroupAffinity);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getthreadid
  public static GetThreadId(Thread: HANDLE): DWORD {
    return Kernel32.Load('GetThreadId')(Thread);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getthreadidealprocessorex
  public static GetThreadIdealProcessorEx(hThread: HANDLE, lpIdealProcessor: LPVOID): BOOL {
    return Kernel32.Load('GetThreadIdealProcessorEx')(hThread, lpIdealProcessor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getthreadinformation
  public static GetThreadInformation(hThread: HANDLE, ThreadInformationClass: DWORD, ThreadInformation: LPVOID, ThreadInformationSize: DWORD): BOOL {
    return Kernel32.Load('GetThreadInformation')(hThread, ThreadInformationClass, ThreadInformation, ThreadInformationSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getthreadiopendingflag
  public static GetThreadIOPendingFlag(hThread: HANDLE, lpIOIsPending: LPVOID): BOOL {
    return Kernel32.Load('GetThreadIOPendingFlag')(hThread, lpIOIsPending);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getthreadlocale
  public static GetThreadLocale(): DWORD {
    return Kernel32.Load('GetThreadLocale')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getthreadpreferreduilanguages
  public static GetThreadPreferredUILanguages(dwFlags: DWORD, pulNumLanguages: LPVOID, pwszLanguagesBuffer: LPWSTR, pcchLanguagesBuffer: LPVOID): BOOL {
    return Kernel32.Load('GetThreadPreferredUILanguages')(dwFlags, pulNumLanguages, pwszLanguagesBuffer, pcchLanguagesBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getthreadpriority
  public static GetThreadPriority(hThread: HANDLE): INT {
    return Kernel32.Load('GetThreadPriority')(hThread);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getthreadpriorityboost
  public static GetThreadPriorityBoost(hThread: HANDLE, pDisablePriorityBoost: LPVOID): BOOL {
    return Kernel32.Load('GetThreadPriorityBoost')(hThread, pDisablePriorityBoost);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getthreadselectedcpusetmasks
  public static GetThreadSelectedCpuSetMasks(Thread: HANDLE, CpuSetMasks: LPVOID, CpuSetMaskCount: USHORT, RequiredMaskCount: LPVOID): BOOL {
    return Kernel32.Load('GetThreadSelectedCpuSetMasks')(Thread, CpuSetMasks, CpuSetMaskCount, RequiredMaskCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getthreadselectedcpusets
  public static GetThreadSelectedCpuSets(Thread: HANDLE, CpuSetIds: LPVOID, CpuSetIdCount: DWORD, RequiredIdCount: LPVOID): BOOL {
    return Kernel32.Load('GetThreadSelectedCpuSets')(Thread, CpuSetIds, CpuSetIdCount, RequiredIdCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getthreadselectorentry
  public static GetThreadSelectorEntry(hThread: HANDLE, dwSelector: DWORD, lpSelectorEntry: LPVOID): BOOL {
    return Kernel32.Load('GetThreadSelectorEntry')(hThread, dwSelector, lpSelectorEntry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getthreadtimes
  public static GetThreadTimes(hThread: HANDLE, lpCreationTime: LPVOID, lpExitTime: LPVOID, lpKernelTime: LPVOID, lpUserTime: LPVOID): BOOL {
    return Kernel32.Load('GetThreadTimes')(hThread, lpCreationTime, lpExitTime, lpKernelTime, lpUserTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getthreaduilanguage
  public static GetThreadUILanguage(): USHORT {
    return Kernel32.Load('GetThreadUILanguage')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-gettickcount
  public static GetTickCount(): DWORD {
    return Kernel32.Load('GetTickCount')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-gettickcount64
  public static GetTickCount64(): ULONGLONG {
    return Kernel32.Load('GetTickCount64')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-gettimeformata
  public static GetTimeFormatA(Locale: DWORD, dwFlags: DWORD, lpTime: LPVOID, lpFormat: LPSTR, lpTimeStr: LPSTR, cchTime: INT): INT {
    return Kernel32.Load('GetTimeFormatA')(Locale, dwFlags, lpTime, lpFormat, lpTimeStr, cchTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-gettimeformatex
  public static GetTimeFormatEx(lpLocaleName: LPWSTR, dwFlags: DWORD, lpTime: LPVOID, lpFormat: LPWSTR, lpTimeStr: LPWSTR, cchTime: INT): INT {
    return Kernel32.Load('GetTimeFormatEx')(lpLocaleName, dwFlags, lpTime, lpFormat, lpTimeStr, cchTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-gettimeformatw
  public static GetTimeFormatW(Locale: DWORD, dwFlags: DWORD, lpTime: LPVOID, lpFormat: LPWSTR, lpTimeStr: LPWSTR, cchTime: INT): INT {
    return Kernel32.Load('GetTimeFormatW')(Locale, dwFlags, lpTime, lpFormat, lpTimeStr, cchTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/timezoneapi/nf-timezoneapi-gettimezoneinformation
  public static GetTimeZoneInformation(lpTimeZoneInformation: LPVOID): DWORD {
    return Kernel32.Load('GetTimeZoneInformation')(lpTimeZoneInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-gettimezoneinformationforyear
  public static GetTimeZoneInformationForYear(wYear: USHORT, pdtzi: LPVOID, ptzi: LPVOID): BOOL {
    return Kernel32.Load('GetTimeZoneInformationForYear')(wYear, pdtzi, ptzi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getuilanguageinfo
  public static GetUILanguageInfo(dwFlags: DWORD, pwmszLanguage: LPWSTR, pwszFallbackLanguages: LPWSTR, pcchFallbackLanguages: LPVOID, pAttributes: LPVOID): BOOL {
    return Kernel32.Load('GetUILanguageInfo')(dwFlags, pwmszLanguage, pwszFallbackLanguages, pcchFallbackLanguages, pAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getumscompletionlistevent
  public static GetUmsCompletionListEvent(UmsCompletionList: LPVOID, UmsCompletionEvent: LPVOID): BOOL {
    return Kernel32.Load('GetUmsCompletionListEvent')(UmsCompletionList, UmsCompletionEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getumssystemthreadinformation
  public static GetUmsSystemThreadInformation(ThreadHandle: HANDLE, SystemThreadInfo: LPVOID): BOOL {
    return Kernel32.Load('GetUmsSystemThreadInformation')(ThreadHandle, SystemThreadInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getuserdefaultgeoname
  public static GetUserDefaultGeoName(geoName: LPWSTR, geoNameCount: INT): INT {
    return Kernel32.Load('GetUserDefaultGeoName')(geoName, geoNameCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getuserdefaultlangid
  public static GetUserDefaultLangID(): USHORT {
    return Kernel32.Load('GetUserDefaultLangID')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getuserdefaultlcid
  public static GetUserDefaultLCID(): DWORD {
    return Kernel32.Load('GetUserDefaultLCID')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-getuserdefaultlocalename
  public static GetUserDefaultLocaleName(lpLocaleName: LPWSTR, cchLocaleName: INT): INT {
    return Kernel32.Load('GetUserDefaultLocaleName')(lpLocaleName, cchLocaleName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getuserdefaultuilanguage
  public static GetUserDefaultUILanguage(): USHORT {
    return Kernel32.Load('GetUserDefaultUILanguage')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getusergeoid
  public static GetUserGeoID(GeoClass: DWORD): INT {
    return Kernel32.Load('GetUserGeoID')(GeoClass);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getuserpreferreduilanguages
  public static GetUserPreferredUILanguages(dwFlags: DWORD, pulNumLanguages: LPVOID, pwszLanguagesBuffer: LPWSTR, pcchLanguagesBuffer: LPVOID): BOOL {
    return Kernel32.Load('GetUserPreferredUILanguages')(dwFlags, pulNumLanguages, pwszLanguagesBuffer, pcchLanguagesBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-getversion
  public static GetVersion(): DWORD {
    return Kernel32.Load('GetVersion')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getversionexa
  public static GetVersionExA(lpVersionInformation: LPVOID): BOOL {
    return Kernel32.Load('GetVersionExA')(lpVersionInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-getversionexw
  public static GetVersionExW(lpVersionInformation: LPVOID): BOOL {
    return Kernel32.Load('GetVersionExW')(lpVersionInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getvolumeinformationa
  public static GetVolumeInformationA(
    lpRootPathName: LPSTR,
    lpVolumeNameBuffer: LPSTR,
    nVolumeNameSize: DWORD,
    lpVolumeSerialNumber: LPVOID,
    lpMaximumComponentLength: LPVOID,
    lpFileSystemFlags: LPVOID,
    lpFileSystemNameBuffer: LPSTR,
    nFileSystemNameSize: DWORD,
  ): BOOL {
    return Kernel32.Load('GetVolumeInformationA')(lpRootPathName, lpVolumeNameBuffer, nVolumeNameSize, lpVolumeSerialNumber, lpMaximumComponentLength, lpFileSystemFlags, lpFileSystemNameBuffer, nFileSystemNameSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getvolumeinformationbyhandlew
  public static GetVolumeInformationByHandleW(
    hFile: HANDLE,
    lpVolumeNameBuffer: LPWSTR,
    nVolumeNameSize: DWORD,
    lpVolumeSerialNumber: LPVOID,
    lpMaximumComponentLength: LPVOID,
    lpFileSystemFlags: LPVOID,
    lpFileSystemNameBuffer: LPWSTR,
    nFileSystemNameSize: DWORD,
  ): BOOL {
    return Kernel32.Load('GetVolumeInformationByHandleW')(hFile, lpVolumeNameBuffer, nVolumeNameSize, lpVolumeSerialNumber, lpMaximumComponentLength, lpFileSystemFlags, lpFileSystemNameBuffer, nFileSystemNameSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getvolumeinformationw
  public static GetVolumeInformationW(
    lpRootPathName: LPWSTR,
    lpVolumeNameBuffer: LPWSTR,
    nVolumeNameSize: DWORD,
    lpVolumeSerialNumber: LPVOID,
    lpMaximumComponentLength: LPVOID,
    lpFileSystemFlags: LPVOID,
    lpFileSystemNameBuffer: LPWSTR,
    nFileSystemNameSize: DWORD,
  ): BOOL {
    return Kernel32.Load('GetVolumeInformationW')(lpRootPathName, lpVolumeNameBuffer, nVolumeNameSize, lpVolumeSerialNumber, lpMaximumComponentLength, lpFileSystemFlags, lpFileSystemNameBuffer, nFileSystemNameSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getvolumenameforvolumemountpointa
  public static GetVolumeNameForVolumeMountPointA(lpszVolumeMountPoint: LPSTR, lpszVolumeName: LPSTR, cchBufferLength: DWORD): BOOL {
    return Kernel32.Load('GetVolumeNameForVolumeMountPointA')(lpszVolumeMountPoint, lpszVolumeName, cchBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getvolumenameforvolumemountpointw
  public static GetVolumeNameForVolumeMountPointW(lpszVolumeMountPoint: LPWSTR, lpszVolumeName: LPWSTR, cchBufferLength: DWORD): BOOL {
    return Kernel32.Load('GetVolumeNameForVolumeMountPointW')(lpszVolumeMountPoint, lpszVolumeName, cchBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getvolumepathnamea
  public static GetVolumePathNameA(lpszFileName: LPSTR, lpszVolumePathName: LPSTR, cchBufferLength: DWORD): BOOL {
    return Kernel32.Load('GetVolumePathNameA')(lpszFileName, lpszVolumePathName, cchBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getvolumepathnamesforvolumenamea
  public static GetVolumePathNamesForVolumeNameA(lpszVolumeName: LPSTR, lpszVolumePathNames: LPSTR, cchBufferLength: DWORD, lpcchReturnLength: LPVOID): BOOL {
    return Kernel32.Load('GetVolumePathNamesForVolumeNameA')(lpszVolumeName, lpszVolumePathNames, cchBufferLength, lpcchReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getvolumepathnamesforvolumenamew
  public static GetVolumePathNamesForVolumeNameW(lpszVolumeName: LPWSTR, lpszVolumePathNames: LPWSTR, cchBufferLength: DWORD, lpcchReturnLength: LPVOID): BOOL {
    return Kernel32.Load('GetVolumePathNamesForVolumeNameW')(lpszVolumeName, lpszVolumePathNames, cchBufferLength, lpcchReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getvolumepathnamew
  public static GetVolumePathNameW(lpszFileName: LPWSTR, lpszVolumePathName: LPWSTR, cchBufferLength: DWORD): BOOL {
    return Kernel32.Load('GetVolumePathNameW')(lpszFileName, lpszVolumePathName, cchBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getwindowsdirectorya
  public static GetWindowsDirectoryA(lpBuffer: LPSTR, uSize: DWORD): DWORD {
    return Kernel32.Load('GetWindowsDirectoryA')(lpBuffer, uSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getwindowsdirectoryw
  public static GetWindowsDirectoryW(lpBuffer: LPWSTR, uSize: DWORD): DWORD {
    return Kernel32.Load('GetWindowsDirectoryW')(lpBuffer, uSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getwritewatch
  public static GetWriteWatch(dwFlags: DWORD, lpBaseAddress: LPVOID, dwRegionSize: LPVOID, lpAddresses: LPVOID, lpdwCount: LPVOID, lpdwGranularity: LPVOID): DWORD {
    return Kernel32.Load('GetWriteWatch')(dwFlags, lpBaseAddress, dwRegionSize, lpAddresses, lpdwCount, lpdwGranularity);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getxstatefeaturesmask
  public static GetXStateFeaturesMask(Context: LPVOID, FeatureMask: LPVOID): BOOL {
    return Kernel32.Load('GetXStateFeaturesMask')(Context, FeatureMask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globaladdatoma
  public static GlobalAddAtomA(lpString: LPSTR): USHORT {
    return Kernel32.Load('GlobalAddAtomA')(lpString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globaladdatomexa
  public static GlobalAddAtomExA(lpString: LPSTR, Flags: DWORD): USHORT {
    return Kernel32.Load('GlobalAddAtomExA')(lpString, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globaladdatomexw
  public static GlobalAddAtomExW(lpString: LPWSTR, Flags: DWORD): USHORT {
    return Kernel32.Load('GlobalAddAtomExW')(lpString, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globaladdatomw
  public static GlobalAddAtomW(lpString: LPWSTR): USHORT {
    return Kernel32.Load('GlobalAddAtomW')(lpString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globalalloc
  public static GlobalAlloc(uFlags: DWORD, dwBytes: LPVOID): DWORD {
    return Kernel32.Load('GlobalAlloc')(uFlags, dwBytes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globalcompact
  public static GlobalCompact(dwMinFree: DWORD): LPVOID {
    return Kernel32.Load('GlobalCompact')(dwMinFree);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globaldeleteatom
  public static GlobalDeleteAtom(nAtom: USHORT): USHORT {
    return Kernel32.Load('GlobalDeleteAtom')(nAtom);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globalfindatoma
  public static GlobalFindAtomA(lpString: LPSTR): USHORT {
    return Kernel32.Load('GlobalFindAtomA')(lpString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globalfindatomw
  public static GlobalFindAtomW(lpString: LPWSTR): USHORT {
    return Kernel32.Load('GlobalFindAtomW')(lpString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globalfix
  public static GlobalFix(hMem: DWORD): VOID {
    return Kernel32.Load('GlobalFix')(hMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globalflags
  public static GlobalFlags(hMem: DWORD): DWORD {
    return Kernel32.Load('GlobalFlags')(hMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globalfree
  public static GlobalFree(hMem: DWORD): DWORD {
    return Kernel32.Load('GlobalFree')(hMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globalgetatomnamea
  public static GlobalGetAtomNameA(nAtom: USHORT, lpBuffer: LPSTR, nSize: INT): DWORD {
    return Kernel32.Load('GlobalGetAtomNameA')(nAtom, lpBuffer, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globalgetatomnamew
  public static GlobalGetAtomNameW(nAtom: USHORT, lpBuffer: LPWSTR, nSize: INT): DWORD {
    return Kernel32.Load('GlobalGetAtomNameW')(nAtom, lpBuffer, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globalhandle
  public static GlobalHandle(pMem: LPVOID): DWORD {
    return Kernel32.Load('GlobalHandle')(pMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globallock
  public static GlobalLock(hMem: DWORD): LPVOID {
    return Kernel32.Load('GlobalLock')(hMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-globalmemorystatus
  public static GlobalMemoryStatus(lpBuffer: LPVOID): VOID {
    return Kernel32.Load('GlobalMemoryStatus')(lpBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-globalmemorystatusex
  public static GlobalMemoryStatusEx(lpBuffer: LPVOID): BOOL {
    return Kernel32.Load('GlobalMemoryStatusEx')(lpBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globalrealloc
  public static GlobalReAlloc(hMem: DWORD, dwBytes: LPVOID, uFlags: DWORD): DWORD {
    return Kernel32.Load('GlobalReAlloc')(hMem, dwBytes, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globalsize
  public static GlobalSize(hMem: DWORD): LPVOID {
    return Kernel32.Load('GlobalSize')(hMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globalunfix
  public static GlobalUnfix(hMem: DWORD): VOID {
    return Kernel32.Load('GlobalUnfix')(hMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globalunlock
  public static GlobalUnlock(hMem: DWORD): BOOL {
    return Kernel32.Load('GlobalUnlock')(hMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globalunwire
  public static GlobalUnWire(hMem: DWORD): BOOL {
    return Kernel32.Load('GlobalUnWire')(hMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-globalwire
  public static GlobalWire(hMem: DWORD): LPVOID {
    return Kernel32.Load('GlobalWire')(hMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/heapapi/nf-heapapi-heap32first
  public static Heap32First(lphe: LPVOID, th32ProcessID: DWORD, th32HeapID: LPVOID): BOOL {
    return Kernel32.Load('Heap32First')(lphe, th32ProcessID, th32HeapID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/heapapi/nf-heapapi-heap32listfirst
  public static Heap32ListFirst(hSnapshot: HANDLE, lphl: LPVOID): BOOL {
    return Kernel32.Load('Heap32ListFirst')(hSnapshot, lphl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/heapapi/nf-heapapi-heap32listnext
  public static Heap32ListNext(hSnapshot: HANDLE, lphl: LPVOID): BOOL {
    return Kernel32.Load('Heap32ListNext')(hSnapshot, lphl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/heapapi/nf-heapapi-heap32next
  public static Heap32Next(lphe: LPVOID): BOOL {
    return Kernel32.Load('Heap32Next')(lphe);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/heapapi/nf-heapapi-heapalloc
  public static HeapAlloc(hHeap: HANDLE, dwFlags: DWORD, dwBytes: LPVOID): LPVOID {
    return Kernel32.Load('HeapAlloc')(hHeap, dwFlags, dwBytes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/heapapi/nf-heapapi-heapcompact
  public static HeapCompact(hHeap: HANDLE, dwFlags: DWORD): LPVOID {
    return Kernel32.Load('HeapCompact')(hHeap, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/heapapi/nf-heapapi-heapcreate
  public static HeapCreate(flOptions: DWORD, dwInitialSize: LPVOID, dwMaximumSize: LPVOID): HANDLE {
    return Kernel32.Load('HeapCreate')(flOptions, dwInitialSize, dwMaximumSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/heapapi/nf-heapapi-heapdestroy
  public static HeapDestroy(hHeap: HANDLE): BOOL {
    return Kernel32.Load('HeapDestroy')(hHeap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/heapapi/nf-heapapi-heapfree
  public static HeapFree(hHeap: HANDLE, dwFlags: DWORD, lpMem: LPVOID): BOOL {
    return Kernel32.Load('HeapFree')(hHeap, dwFlags, lpMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/heapapi/nf-heapapi-heaplock
  public static HeapLock(hHeap: HANDLE): BOOL {
    return Kernel32.Load('HeapLock')(hHeap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/heapapi/nf-heapapi-heapqueryinformation
  public static HeapQueryInformation(HeapHandle: HANDLE, HeapInformationClass: DWORD, HeapInformation: LPVOID, HeapInformationLength: LPVOID, ReturnLength: LPVOID): BOOL {
    return Kernel32.Load('HeapQueryInformation')(HeapHandle, HeapInformationClass, HeapInformation, HeapInformationLength, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/heapapi/nf-heapapi-heaprealloc
  public static HeapReAlloc(hHeap: HANDLE, dwFlags: DWORD, lpMem: LPVOID, dwBytes: LPVOID): LPVOID {
    return Kernel32.Load('HeapReAlloc')(hHeap, dwFlags, lpMem, dwBytes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/heapapi/nf-heapapi-heapsetinformation
  public static HeapSetInformation(HeapHandle: HANDLE, HeapInformationClass: DWORD, HeapInformation: LPVOID, HeapInformationLength: LPVOID): BOOL {
    return Kernel32.Load('HeapSetInformation')(HeapHandle, HeapInformationClass, HeapInformation, HeapInformationLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/heapapi/nf-heapapi-heapsize
  public static HeapSize(hHeap: HANDLE, dwFlags: DWORD, lpMem: LPVOID): LPVOID {
    return Kernel32.Load('HeapSize')(hHeap, dwFlags, lpMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/heapapi/nf-heapapi-heapsummary
  public static HeapSummary(hHeap: HANDLE, dwFlags: DWORD, lpSummary: LPVOID): BOOL {
    return Kernel32.Load('HeapSummary')(hHeap, dwFlags, lpSummary);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/heapapi/nf-heapapi-heapunlock
  public static HeapUnlock(hHeap: HANDLE): BOOL {
    return Kernel32.Load('HeapUnlock')(hHeap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/heapapi/nf-heapapi-heapvalidate
  public static HeapValidate(hHeap: HANDLE, dwFlags: DWORD, lpMem: LPVOID): BOOL {
    return Kernel32.Load('HeapValidate')(hHeap, dwFlags, lpMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/heapapi/nf-heapapi-heapwalk
  public static HeapWalk(hHeap: HANDLE, lpEntry: LPVOID): BOOL {
    return Kernel32.Load('HeapWalk')(hHeap, lpEntry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-idntonameprepunicode
  public static IdnToNameprepUnicode(dwFlags: DWORD, lpUnicodeCharStr: LPWSTR, cchUnicodeChar: INT, lpNameprepCharStr: LPWSTR, cchNameprepChar: INT): INT {
    return Kernel32.Load('IdnToNameprepUnicode')(dwFlags, lpUnicodeCharStr, cchUnicodeChar, lpNameprepCharStr, cchNameprepChar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-initatomtable
  public static InitAtomTable(nSize: DWORD): BOOL {
    return Kernel32.Load('InitAtomTable')(nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-initializeconditionvariable
  public static InitializeConditionVariable(ConditionVariable: LPVOID): VOID {
    return Kernel32.Load('InitializeConditionVariable')(ConditionVariable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-initializecontext
  public static InitializeContext(Buffer: LPVOID, ContextFlags: DWORD, Context: LPVOID, ContextLength: LPVOID): BOOL {
    return Kernel32.Load('InitializeContext')(Buffer, ContextFlags, Context, ContextLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-initializecontext2
  public static InitializeContext2(Buffer: LPVOID, ContextFlags: DWORD, Context: LPVOID, ContextLength: LPVOID, XStateCompactionMask: ULONGLONG): BOOL {
    return Kernel32.Load('InitializeContext2')(Buffer, ContextFlags, Context, ContextLength, XStateCompactionMask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-initializecriticalsection
  public static InitializeCriticalSection(lpCriticalSection: LPVOID): VOID {
    return Kernel32.Load('InitializeCriticalSection')(lpCriticalSection);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-initializecriticalsectionandspincount
  public static InitializeCriticalSectionAndSpinCount(lpCriticalSection: LPVOID, dwSpinCount: DWORD): BOOL {
    return Kernel32.Load('InitializeCriticalSectionAndSpinCount')(lpCriticalSection, dwSpinCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-initializecriticalsectionex
  public static InitializeCriticalSectionEx(lpCriticalSection: LPVOID, dwSpinCount: DWORD, Flags: DWORD): BOOL {
    return Kernel32.Load('InitializeCriticalSectionEx')(lpCriticalSection, dwSpinCount, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-initializeenclave
  public static InitializeEnclave(hProcess: HANDLE, lpAddress: LPVOID, lpEnclaveInformation: LPVOID, dwInfoLength: DWORD, lpEnclaveError: LPVOID): BOOL {
    return Kernel32.Load('InitializeEnclave')(hProcess, lpAddress, lpEnclaveInformation, dwInfoLength, lpEnclaveError);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-initializeprocthreadattributelist
  public static InitializeProcThreadAttributeList(lpAttributeList: DWORD, dwAttributeCount: DWORD, dwFlags: DWORD, lpSize: LPVOID): BOOL {
    return Kernel32.Load('InitializeProcThreadAttributeList')(lpAttributeList, dwAttributeCount, dwFlags, lpSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-initializeslisthead
  public static InitializeSListHead(ListHead: LPVOID): VOID {
    return Kernel32.Load('InitializeSListHead')(ListHead);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-initializesrwlock
  public static InitializeSRWLock(SRWLock: LPVOID): VOID {
    return Kernel32.Load('InitializeSRWLock')(SRWLock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-initializesynchronizationbarrier
  public static InitializeSynchronizationBarrier(lpBarrier: LPVOID, lTotalThreads: INT, lSpinCount: INT): BOOL {
    return Kernel32.Load('InitializeSynchronizationBarrier')(lpBarrier, lTotalThreads, lSpinCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-initoncebegininitialize
  public static InitOnceBeginInitialize(lpInitOnce: LPVOID, dwFlags: DWORD, fPending: LPVOID, lpContext: LPVOID): BOOL {
    return Kernel32.Load('InitOnceBeginInitialize')(lpInitOnce, dwFlags, fPending, lpContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-initoncecomplete
  public static InitOnceComplete(lpInitOnce: LPVOID, dwFlags: DWORD, lpContext: LPVOID): BOOL {
    return Kernel32.Load('InitOnceComplete')(lpInitOnce, dwFlags, lpContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-initonceexecuteonce
  public static InitOnceExecuteOnce(InitOnce: LPVOID, InitFn: DWORD, Parameter: LPVOID, Context: LPVOID): BOOL {
    return Kernel32.Load('InitOnceExecuteOnce')(InitOnce, InitFn, Parameter, Context);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-initonceinitialize
  public static InitOnceInitialize(InitOnce: LPVOID): VOID {
    return Kernel32.Load('InitOnceInitialize')(InitOnce);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-installelamcertificateinfo
  public static InstallELAMCertificateInfo(ELAMFile: HANDLE): BOOL {
    return Kernel32.Load('InstallELAMCertificateInfo')(ELAMFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-interlockedflushslist
  public static InterlockedFlushSList(ListHead: LPVOID): LPVOID {
    return Kernel32.Load('InterlockedFlushSList')(ListHead);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-interlockedpopentryslist
  public static InterlockedPopEntrySList(ListHead: LPVOID): LPVOID {
    return Kernel32.Load('InterlockedPopEntrySList')(ListHead);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-interlockedpushentryslist
  public static InterlockedPushEntrySList(ListHead: LPVOID, ListEntry: LPVOID): LPVOID {
    return Kernel32.Load('InterlockedPushEntrySList')(ListHead, ListEntry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-interlockedpushlistslistex
  public static InterlockedPushListSListEx(ListHead: LPVOID, List: LPVOID, ListEnd: LPVOID, Count: DWORD): LPVOID {
    return Kernel32.Load('InterlockedPushListSListEx')(ListHead, List, ListEnd, Count);
  }

  // https://learn.microsoft.com/en-us/windows/console/invalidateconsoledibits
  public static InvalidateConsoleDIBits(hConsoleOutput: HANDLE, lpRect: LPVOID): BOOL {
    return Kernel32.Load('InvalidateConsoleDIBits')(hConsoleOutput, lpRect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isbadcodeptr
  public static IsBadCodePtr(lpfn: LPVOID): BOOL {
    return Kernel32.Load('IsBadCodePtr')(lpfn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isbadhugereadptr
  public static IsBadHugeReadPtr(lp: LPVOID, ucb: LPVOID): BOOL {
    return Kernel32.Load('IsBadHugeReadPtr')(lp, ucb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isbadhugewriteptr
  public static IsBadHugeWritePtr(lp: LPVOID, ucb: LPVOID): BOOL {
    return Kernel32.Load('IsBadHugeWritePtr')(lp, ucb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isbadreadptr
  public static IsBadReadPtr(lp: LPVOID, ucb: LPVOID): BOOL {
    return Kernel32.Load('IsBadReadPtr')(lp, ucb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isbadstringptra
  public static IsBadStringPtrA(lpsz: LPSTR, ucchMax: LPVOID): BOOL {
    return Kernel32.Load('IsBadStringPtrA')(lpsz, ucchMax);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isbadstringptrw
  public static IsBadStringPtrW(lpsz: LPWSTR, ucchMax: LPVOID): BOOL {
    return Kernel32.Load('IsBadStringPtrW')(lpsz, ucchMax);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isbadwriteptr
  public static IsBadWritePtr(lp: LPVOID, ucb: LPVOID): BOOL {
    return Kernel32.Load('IsBadWritePtr')(lp, ucb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-iscalendarleapyear
  public static IsCalendarLeapYear(calId: DWORD, year: DWORD, era: DWORD): BOOL {
    return Kernel32.Load('IsCalendarLeapYear')(calId, year, era);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isdbcsleadbyte
  public static IsDBCSLeadByte(TestChar: LPVOID): BOOL {
    return Kernel32.Load('IsDBCSLeadByte')(TestChar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isdbcsleadbyteex
  public static IsDBCSLeadByteEx(CodePage: DWORD, TestChar: LPVOID): BOOL {
    return Kernel32.Load('IsDBCSLeadByteEx')(CodePage, TestChar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isdebuggerpresent
  public static IsDebuggerPresent(): BOOL {
    return Kernel32.Load('IsDebuggerPresent')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-isenclavetypesupported
  public static IsEnclaveTypeSupported(flEnclaveType: DWORD): BOOL {
    return Kernel32.Load('IsEnclaveTypeSupported')(flEnclaveType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isnativevhdboot
  public static IsNativeVhdBoot(NativeVhdBoot: LPVOID): BOOL {
    return Kernel32.Load('IsNativeVhdBoot')(NativeVhdBoot);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isnlsdefinedstring
  public static IsNLSDefinedString(_Function: DWORD, dwFlags: DWORD, lpVersionInformation: LPVOID, lpString: LPWSTR, cchStr: INT): BOOL {
    return Kernel32.Load('IsNLSDefinedString')(_Function, dwFlags, lpVersionInformation, lpString, cchStr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isnormalizedstring
  public static IsNormalizedString(NormForm: DWORD, lpString: LPWSTR, cwLength: INT): BOOL {
    return Kernel32.Load('IsNormalizedString')(NormForm, lpString, cwLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isprocesscritical
  public static IsProcessCritical(hProcess: HANDLE, Critical: LPVOID): BOOL {
    return Kernel32.Load('IsProcessCritical')(hProcess, Critical);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/jobapi/nf-jobapi-isprocessinjob
  public static IsProcessInJob(ProcessHandle: HANDLE, JobHandle: HANDLE, Result: LPVOID): BOOL {
    return Kernel32.Load('IsProcessInJob')(ProcessHandle, JobHandle, Result);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isprocessorfeaturepresent
  public static IsProcessorFeaturePresent(ProcessorFeature: DWORD): BOOL {
    return Kernel32.Load('IsProcessorFeaturePresent')(ProcessorFeature);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-issystemresumeautomatic
  public static IsSystemResumeAutomatic(): BOOL {
    return Kernel32.Load('IsSystemResumeAutomatic')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isthreadafiber
  public static IsThreadAFiber(): BOOL {
    return Kernel32.Load('IsThreadAFiber')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isthreadpooltimerset
  public static IsThreadpoolTimerSet(pti: DWORD): BOOL {
    return Kernel32.Load('IsThreadpoolTimerSet')(pti);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isusercetavailableinenvironment
  public static IsUserCetAvailableInEnvironment(UserCetEnvironment: DWORD): BOOL {
    return Kernel32.Load('IsUserCetAvailableInEnvironment')(UserCetEnvironment);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isvalidcodepage
  public static IsValidCodePage(CodePage: DWORD): BOOL {
    return Kernel32.Load('IsValidCodePage')(CodePage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isvalidlanguagegroup
  public static IsValidLanguageGroup(LanguageGroup: DWORD, dwFlags: DWORD): BOOL {
    return Kernel32.Load('IsValidLanguageGroup')(LanguageGroup, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isvalidlocale
  public static IsValidLocale(Locale: DWORD, dwFlags: DWORD): BOOL {
    return Kernel32.Load('IsValidLocale')(Locale, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isvalidlocalename
  public static IsValidLocaleName(lpLocaleName: LPWSTR): BOOL {
    return Kernel32.Load('IsValidLocaleName')(lpLocaleName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-isvalidnlsversion
  public static IsValidNLSVersion(_function: DWORD, lpLocaleName: LPWSTR, lpVersionInformation: LPVOID): DWORD {
    return Kernel32.Load('IsValidNLSVersion')(_function, lpLocaleName, lpVersionInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-iswow64guestmachinesupported
  public static IsWow64GuestMachineSupported(WowGuestMachine: DWORD, MachineIsSupported: LPVOID): DWORD {
    return Kernel32.Load('IsWow64GuestMachineSupported')(WowGuestMachine, MachineIsSupported);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wow64apiset/nf-wow64apiset-iswow64process
  public static IsWow64Process(hProcess: HANDLE, Wow64Process: LPVOID): BOOL {
    return Kernel32.Load('IsWow64Process')(hProcess, Wow64Process);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wow64apiset/nf-wow64apiset-iswow64process2
  public static IsWow64Process2(hProcess: HANDLE, pProcessMachine: LPVOID, pNativeMachine: LPVOID): BOOL {
    return Kernel32.Load('IsWow64Process2')(hProcess, pProcessMachine, pNativeMachine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32emptyworkingset
  public static K32EmptyWorkingSet(hProcess: HANDLE): BOOL {
    return Kernel32.Load('K32EmptyWorkingSet')(hProcess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32enumdevicedrivers
  public static K32EnumDeviceDrivers(lpImageBase: LPVOID, cb: DWORD, lpcbNeeded: LPVOID): BOOL {
    return Kernel32.Load('K32EnumDeviceDrivers')(lpImageBase, cb, lpcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32enumpagefilesa
  public static K32EnumPageFilesA(pCallBackRoutine: DWORD, pContext: LPVOID): BOOL {
    return Kernel32.Load('K32EnumPageFilesA')(pCallBackRoutine, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32enumpagefilesw
  public static K32EnumPageFilesW(pCallBackRoutine: DWORD, pContext: LPVOID): BOOL {
    return Kernel32.Load('K32EnumPageFilesW')(pCallBackRoutine, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32enumprocesses
  public static K32EnumProcesses(lpidProcess: LPVOID, cb: DWORD, lpcbNeeded: LPVOID): BOOL {
    return Kernel32.Load('K32EnumProcesses')(lpidProcess, cb, lpcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32enumprocessmodules
  public static K32EnumProcessModules(hProcess: HANDLE, lphModule: LPVOID, cb: DWORD, lpcbNeeded: LPVOID): BOOL {
    return Kernel32.Load('K32EnumProcessModules')(hProcess, lphModule, cb, lpcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32enumprocessmodulesex
  public static K32EnumProcessModulesEx(hProcess: HANDLE, lphModule: LPVOID, cb: DWORD, lpcbNeeded: LPVOID, dwFilterFlag: DWORD): BOOL {
    return Kernel32.Load('K32EnumProcessModulesEx')(hProcess, lphModule, cb, lpcbNeeded, dwFilterFlag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32getdevicedriverbasenamea
  public static K32GetDeviceDriverBaseNameA(ImageBase: LPVOID, lpFilename: LPSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('K32GetDeviceDriverBaseNameA')(ImageBase, lpFilename, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32getdevicedriverbasenamew
  public static K32GetDeviceDriverBaseNameW(ImageBase: LPVOID, lpBaseName: LPWSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('K32GetDeviceDriverBaseNameW')(ImageBase, lpBaseName, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32getdevicedriverfilenamea
  public static K32GetDeviceDriverFileNameA(ImageBase: LPVOID, lpFilename: LPSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('K32GetDeviceDriverFileNameA')(ImageBase, lpFilename, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32getdevicedriverfilenamew
  public static K32GetDeviceDriverFileNameW(ImageBase: LPVOID, lpFilename: LPWSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('K32GetDeviceDriverFileNameW')(ImageBase, lpFilename, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32getmappedfilenamea
  public static K32GetMappedFileNameA(hProcess: HANDLE, lpv: LPVOID, lpFilename: LPSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('K32GetMappedFileNameA')(hProcess, lpv, lpFilename, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32getmappedfilenamew
  public static K32GetMappedFileNameW(hProcess: HANDLE, lpv: LPVOID, lpFilename: LPWSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('K32GetMappedFileNameW')(hProcess, lpv, lpFilename, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32getmodulebasenamea
  public static K32GetModuleBaseNameA(hProcess: HANDLE, hModule: HMODULE, lpBaseName: LPSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('K32GetModuleBaseNameA')(hProcess, hModule, lpBaseName, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32getmodulebasenamew
  public static K32GetModuleBaseNameW(hProcess: HANDLE, hModule: HMODULE, lpBaseName: LPWSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('K32GetModuleBaseNameW')(hProcess, hModule, lpBaseName, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32getmodulefilenameexa
  public static K32GetModuleFileNameExA(hProcess: HANDLE, hModule: HMODULE, lpFilename: LPSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('K32GetModuleFileNameExA')(hProcess, hModule, lpFilename, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32getmodulefilenameexw
  public static K32GetModuleFileNameExW(hProcess: HANDLE, hModule: HMODULE, lpFilename: LPWSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('K32GetModuleFileNameExW')(hProcess, hModule, lpFilename, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32getmoduleinformation
  public static K32GetModuleInformation(hProcess: HANDLE, hModule: HMODULE, lpmodinfo: LPVOID, cb: DWORD): BOOL {
    return Kernel32.Load('K32GetModuleInformation')(hProcess, hModule, lpmodinfo, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32getperformanceinfo
  public static K32GetPerformanceInfo(pPerformanceInformation: LPVOID, cb: DWORD): BOOL {
    return Kernel32.Load('K32GetPerformanceInfo')(pPerformanceInformation, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32getprocessimagefilenamea
  public static K32GetProcessImageFileNameA(hProcess: HANDLE, lpImageFileName: LPSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('K32GetProcessImageFileNameA')(hProcess, lpImageFileName, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32getprocessimagefilenamew
  public static K32GetProcessImageFileNameW(hProcess: HANDLE, lpImageFileName: LPWSTR, nSize: DWORD): DWORD {
    return Kernel32.Load('K32GetProcessImageFileNameW')(hProcess, lpImageFileName, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32getprocessmemoryinfo
  public static K32GetProcessMemoryInfo(Process: HANDLE, ppsmemCounters: LPVOID, cb: DWORD): BOOL {
    return Kernel32.Load('K32GetProcessMemoryInfo')(Process, ppsmemCounters, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32getwschanges
  public static K32GetWsChanges(hProcess: HANDLE, lpWatchInfo: LPVOID, cb: DWORD): BOOL {
    return Kernel32.Load('K32GetWsChanges')(hProcess, lpWatchInfo, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32getwschangesex
  public static K32GetWsChangesEx(hProcess: HANDLE, lpWatchInfoEx: LPVOID, cb: LPVOID): BOOL {
    return Kernel32.Load('K32GetWsChangesEx')(hProcess, lpWatchInfoEx, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32initializeprocessforwswatch
  public static K32InitializeProcessForWsWatch(hProcess: HANDLE): BOOL {
    return Kernel32.Load('K32InitializeProcessForWsWatch')(hProcess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32queryworkingset
  public static K32QueryWorkingSet(hProcess: HANDLE, pv: LPVOID, cb: DWORD): BOOL {
    return Kernel32.Load('K32QueryWorkingSet')(hProcess, pv, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-k32queryworkingsetex
  public static K32QueryWorkingSetEx(hProcess: HANDLE, pv: LPVOID, cb: DWORD): BOOL {
    return Kernel32.Load('K32QueryWorkingSetEx')(hProcess, pv, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-lcidtolocalename
  public static LCIDToLocaleName(Locale: DWORD, lpName: LPWSTR, cchName: INT, dwFlags: DWORD): INT {
    return Kernel32.Load('LCIDToLocaleName')(Locale, lpName, cchName, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-lcmapstringa
  public static LCMapStringA(Locale: LCID, dwMapFlags: DWORD, lpSrcStr: LPCSTR, cchSrc: INT, lpDestStr: LPSTR, cchDest: INT): INT {
    return Kernel32.Load('LCMapStringA')(Locale, dwMapFlags, lpSrcStr, cchSrc, lpDestStr, cchDest);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-lcmapstringex
  public static LCMapStringEx(lpLocaleName: LPCWSTR, dwMapFlags: DWORD, lpSrcStr: LPCWSTR, cchSrc: INT, lpDestStr: LPWSTR, cchDest: INT, lpVersionInformation: LPNLSVERSIONINFO, lpReserved: LPVOID, sortHandle: LPARAM): INT {
    return Kernel32.Load('LCMapStringEx')(lpLocaleName, dwMapFlags, lpSrcStr, cchSrc, lpDestStr, cchDest, lpVersionInformation, lpReserved, sortHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-lcmapstringw
  public static LCMapStringW(Locale: LCID, dwMapFlags: DWORD, lpSrcStr: LPCWSTR, cchSrc: INT, lpDestStr: LPWSTR, cchDest: INT): INT {
    return Kernel32.Load('LCMapStringW')(Locale, dwMapFlags, lpSrcStr, cchSrc, lpDestStr, cchDest);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-leavecriticalsection
  public static LeaveCriticalSection(lpCriticalSection: LPVOID): VOID {
    return Kernel32.Load('LeaveCriticalSection')(lpCriticalSection);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-leavecriticalsectionwhencallbackreturns
  public static LeaveCriticalSectionWhenCallbackReturns(pci: DWORD, pcs: LPVOID): VOID {
    return Kernel32.Load('LeaveCriticalSectionWhenCallbackReturns')(pci, pcs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-loadenclavedata
  public static LoadEnclaveData(hProcess: HANDLE, lpAddress: LPVOID, lpBuffer: LPVOID, nSize: LPVOID, flProtect: DWORD, lpPageInformation: LPVOID, dwInfoLength: DWORD, lpNumberOfBytesWritten: LPVOID, lpEnclaveError: LPVOID): BOOL {
    return Kernel32.Load('LoadEnclaveData')(hProcess, lpAddress, lpBuffer, nSize, flProtect, lpPageInformation, dwInfoLength, lpNumberOfBytesWritten, lpEnclaveError);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-loadlibrarya
  public static LoadLibraryA(lpLibFileName: LPSTR): HMODULE {
    return Kernel32.Load('LoadLibraryA')(lpLibFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-loadlibraryexa
  public static LoadLibraryExA(lpLibFileName: LPSTR, hFile: HANDLE, dwFlags: DWORD): HMODULE {
    return Kernel32.Load('LoadLibraryExA')(lpLibFileName, hFile, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-loadlibraryexw
  public static LoadLibraryExW(lpLibFileName: LPWSTR, hFile: HANDLE, dwFlags: DWORD): HMODULE {
    return Kernel32.Load('LoadLibraryExW')(lpLibFileName, hFile, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-loadlibraryw
  public static LoadLibraryW(lpLibFileName: LPWSTR): HMODULE {
    return Kernel32.Load('LoadLibraryW')(lpLibFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-loadmodule
  public static LoadModule(lpModuleName: LPSTR, lpParameterBlock: LPVOID): DWORD {
    return Kernel32.Load('LoadModule')(lpModuleName, lpParameterBlock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-loadpackagedlibrary
  public static LoadPackagedLibrary(lpwLibFileName: LPWSTR, Reserved: DWORD): HMODULE {
    return Kernel32.Load('LoadPackagedLibrary')(lpwLibFileName, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-loadresource
  public static LoadResource(hModule: HMODULE, hResInfo: HRSRC): HGLOBAL {
    return Kernel32.Load('LoadResource')(hModule, hResInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-localalloc
  public static LocalAlloc(uFlags: DWORD, uBytes: LPVOID): DWORD {
    return Kernel32.Load('LocalAlloc')(uFlags, uBytes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-localcompact
  public static LocalCompact(uMinFree: DWORD): LPVOID {
    return Kernel32.Load('LocalCompact')(uMinFree);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-localenametolcid
  public static LocaleNameToLCID(lpName: LPWSTR, dwFlags: DWORD): DWORD {
    return Kernel32.Load('LocaleNameToLCID')(lpName, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-localfiletimetofiletime
  public static LocalFileTimeToFileTime(lpLocalFileTime: LPVOID, lpFileTime: LPVOID): BOOL {
    return Kernel32.Load('LocalFileTimeToFileTime')(lpLocalFileTime, lpFileTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-localfiletimetolocalsystemtime
  public static LocalFileTimeToLocalSystemTime(timeZoneInformation: LPVOID, localFileTime: LPVOID, localSystemTime: LPVOID): BOOL {
    return Kernel32.Load('LocalFileTimeToLocalSystemTime')(timeZoneInformation, localFileTime, localSystemTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-localflags
  public static LocalFlags(hMem: DWORD): DWORD {
    return Kernel32.Load('LocalFlags')(hMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-localfree
  public static LocalFree(hMem: DWORD): DWORD {
    return Kernel32.Load('LocalFree')(hMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-localhandle
  public static LocalHandle(pMem: LPVOID): DWORD {
    return Kernel32.Load('LocalHandle')(pMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-locallock
  public static LocalLock(hMem: DWORD): LPVOID {
    return Kernel32.Load('LocalLock')(hMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-localrealloc
  public static LocalReAlloc(hMem: DWORD, uBytes: LPVOID, uFlags: DWORD): DWORD {
    return Kernel32.Load('LocalReAlloc')(hMem, uBytes, uFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-localshrink
  public static LocalShrink(hMem: DWORD, cbNewSize: DWORD): LPVOID {
    return Kernel32.Load('LocalShrink')(hMem, cbNewSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-localsize
  public static LocalSize(hMem: DWORD): LPVOID {
    return Kernel32.Load('LocalSize')(hMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-localsystemtimetolocalfiletime
  public static LocalSystemTimeToLocalFileTime(timeZoneInformation: LPVOID, localSystemTime: LPVOID, localFileTime: LPVOID): BOOL {
    return Kernel32.Load('LocalSystemTimeToLocalFileTime')(timeZoneInformation, localSystemTime, localFileTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-localunlock
  public static LocalUnlock(hMem: DWORD): BOOL {
    return Kernel32.Load('LocalUnlock')(hMem);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-locatexstatefeature
  public static LocateXStateFeature(Context: LPVOID, FeatureId: DWORD, Length: LPVOID): LPVOID {
    return Kernel32.Load('LocateXStateFeature')(Context, FeatureId, Length);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-lockfile
  public static LockFile(hFile: HANDLE, dwFileOffsetLow: DWORD, dwFileOffsetHigh: DWORD, nNumberOfBytesToLockLow: DWORD, nNumberOfBytesToLockHigh: DWORD): BOOL {
    return Kernel32.Load('LockFile')(hFile, dwFileOffsetLow, dwFileOffsetHigh, nNumberOfBytesToLockLow, nNumberOfBytesToLockHigh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-lockfileex
  public static LockFileEx(hFile: HANDLE, dwFlags: DWORD, dwReserved: DWORD, nNumberOfBytesToLockLow: DWORD, nNumberOfBytesToLockHigh: DWORD, lpOverlapped: LPVOID): BOOL {
    return Kernel32.Load('LockFileEx')(hFile, dwFlags, dwReserved, nNumberOfBytesToLockLow, nNumberOfBytesToLockHigh, lpOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-lockresource
  public static LockResource(hResData: HGLOBAL): LPVOID {
    return Kernel32.Load('LockResource')(hResData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lzexpand/nf-lzexpand-lzclose
  public static LZClose(hFile: INT): VOID {
    return Kernel32.Load('LZClose')(hFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lzexpand/nf-lzexpand-lzcopy
  public static LZCopy(hfSource: INT, hfDest: INT): INT {
    return Kernel32.Load('LZCopy')(hfSource, hfDest);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lzexpand/nf-lzexpand-lzdone
  public static LZDone(): VOID {
    return Kernel32.Load('LZDone')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lzexpand/nf-lzexpand-lzinit
  public static LZInit(hfSource: INT): INT {
    return Kernel32.Load('LZInit')(hfSource);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lzexpand/nf-lzexpand-lzopenfilea
  public static LZOpenFileA(lpFileName: LPSTR, lpReOpenBuf: LPVOID, wStyle: DWORD): INT {
    return Kernel32.Load('LZOpenFileA')(lpFileName, lpReOpenBuf, wStyle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lzexpand/nf-lzexpand-lzopenfilew
  public static LZOpenFileW(lpFileName: LPWSTR, lpReOpenBuf: LPVOID, wStyle: DWORD): INT {
    return Kernel32.Load('LZOpenFileW')(lpFileName, lpReOpenBuf, wStyle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lzexpand/nf-lzexpand-lzread
  public static LZRead(hFile: INT, lpBuffer: LPSTR, cbRead: INT): INT {
    return Kernel32.Load('LZRead')(hFile, lpBuffer, cbRead);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lzexpand/nf-lzexpand-lzseek
  public static LZSeek(hFile: INT, lOffset: INT, iOrigin: INT): INT {
    return Kernel32.Load('LZSeek')(hFile, lOffset, iOrigin);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/lzexpand/nf-lzexpand-lzstart
  public static LZStart(): INT {
    return Kernel32.Load('LZStart')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-mapuserphysicalpages
  public static MapUserPhysicalPages(VirtualAddress: bigint, NumberOfPages: bigint, PageArray: LPVOID): BOOL {
    return Kernel32.Load('MapUserPhysicalPages')(VirtualAddress, NumberOfPages, PageArray);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-mapuserphysicalpagesscatter
  public static MapUserPhysicalPagesScatter(VirtualAddresses: LPVOID, NumberOfPages: bigint, PageArray: LPVOID): BOOL {
    return Kernel32.Load('MapUserPhysicalPagesScatter')(VirtualAddresses, NumberOfPages, PageArray);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-mapviewoffile
  public static MapViewOfFile(hFileMappingObject: HANDLE, dwDesiredAccess: DWORD, dwFileOffsetHigh: DWORD, dwFileOffsetLow: DWORD, dwNumberOfBytesToMap: bigint): bigint {
    return Kernel32.Load('MapViewOfFile')(hFileMappingObject, dwDesiredAccess, dwFileOffsetHigh, dwFileOffsetLow, dwNumberOfBytesToMap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-mapviewoffileex
  public static MapViewOfFileEx(hFileMappingObject: HANDLE, dwDesiredAccess: DWORD, dwFileOffsetHigh: DWORD, dwFileOffsetLow: DWORD, dwNumberOfBytesToMap: bigint, lpBaseAddress: bigint): bigint {
    return Kernel32.Load('MapViewOfFileEx')(hFileMappingObject, dwDesiredAccess, dwFileOffsetHigh, dwFileOffsetLow, dwNumberOfBytesToMap, lpBaseAddress);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-mapviewoffileexnuma
  public static MapViewOfFileExNuma(hFileMappingObject: HANDLE, dwDesiredAccess: DWORD, dwFileOffsetHigh: DWORD, dwFileOffsetLow: DWORD, dwNumberOfBytesToMap: bigint, lpBaseAddress: bigint, nndPreferred: DWORD): bigint {
    return Kernel32.Load('MapViewOfFileExNuma')(hFileMappingObject, dwDesiredAccess, dwFileOffsetHigh, dwFileOffsetLow, dwNumberOfBytesToMap, lpBaseAddress, nndPreferred);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-mapviewoffilefromapp
  public static MapViewOfFileFromApp(hFileMappingObject: HANDLE, DesiredAccess: DWORD, FileOffset: ULONGLONG, NumberOfBytesToMap: bigint): bigint {
    return Kernel32.Load('MapViewOfFileFromApp')(hFileMappingObject, DesiredAccess, FileOffset, NumberOfBytesToMap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-module32first
  public static Module32First(hSnapshot: HANDLE, lpme: LPVOID): BOOL {
    return Kernel32.Load('Module32First')(hSnapshot, lpme);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tlhelp32/nf-tlhelp32-module32firstw
  public static Module32FirstW(hSnapshot: HANDLE, lpme: LPVOID): BOOL {
    return Kernel32.Load('Module32FirstW')(hSnapshot, lpme);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-module32next
  public static Module32Next(hSnapshot: HANDLE, lpme: LPVOID): BOOL {
    return Kernel32.Load('Module32Next')(hSnapshot, lpme);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tlhelp32/nf-tlhelp32-module32nextw
  public static Module32NextW(hSnapshot: HANDLE, lpme: LPVOID): BOOL {
    return Kernel32.Load('Module32NextW')(hSnapshot, lpme);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-movefilea
  public static MoveFileA(lpExistingFileName: LPSTR, lpNewFileName: LPSTR): BOOL {
    return Kernel32.Load('MoveFileA')(lpExistingFileName, lpNewFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-movefileexa
  public static MoveFileExA(lpExistingFileName: LPSTR, lpNewFileName: LPSTR, dwFlags: DWORD): BOOL {
    return Kernel32.Load('MoveFileExA')(lpExistingFileName, lpNewFileName, dwFlags);
  }
  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-movefileexw
  public static MoveFileExW(lpExistingFileName: LPWSTR, lpNewFileName: LPWSTR, dwFlags: DWORD): BOOL {
    return Kernel32.Load('MoveFileExW')(lpExistingFileName, lpNewFileName, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-movefiletransacteda
  public static MoveFileTransactedA(lpExistingFileName: LPSTR, lpNewFileName: LPSTR, lpProgressRoutine: DWORD, lpData: LPVOID, dwFlags: DWORD, hTransaction: HANDLE): BOOL {
    return Kernel32.Load('MoveFileTransactedA')(lpExistingFileName, lpNewFileName, lpProgressRoutine, lpData, dwFlags, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-movefiletransactedw
  public static MoveFileTransactedW(lpExistingFileName: LPWSTR, lpNewFileName: LPWSTR, lpProgressRoutine: DWORD, lpData: LPVOID, dwFlags: DWORD, hTransaction: HANDLE): BOOL {
    return Kernel32.Load('MoveFileTransactedW')(lpExistingFileName, lpNewFileName, lpProgressRoutine, lpData, dwFlags, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-movefilew
  public static MoveFileW(lpExistingFileName: LPWSTR, lpNewFileName: LPWSTR): BOOL {
    return Kernel32.Load('MoveFileW')(lpExistingFileName, lpNewFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-movefilewithprogressa
  public static MoveFileWithProgressA(lpExistingFileName: LPSTR, lpNewFileName: LPSTR, lpProgressRoutine: DWORD, lpData: LPVOID, dwFlags: DWORD): BOOL {
    return Kernel32.Load('MoveFileWithProgressA')(lpExistingFileName, lpNewFileName, lpProgressRoutine, lpData, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-movefilewithprogressw
  public static MoveFileWithProgressW(lpExistingFileName: LPWSTR, lpNewFileName: LPWSTR, lpProgressRoutine: DWORD, lpData: LPVOID, dwFlags: DWORD): BOOL {
    return Kernel32.Load('MoveFileWithProgressW')(lpExistingFileName, lpNewFileName, lpProgressRoutine, lpData, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-muldiv
  public static MulDiv(nNumber: INT, nNumerator: INT, nDenominator: INT): INT {
    return Kernel32.Load('MulDiv')(nNumber, nNumerator, nDenominator);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-multibytetowidechar
  public static MultiByteToWideChar(CodePage: UINT, dwFlags: DWORD, lpMultiByteStr: LPCSTR, cbMultiByte: INT, lpWideCharStr: LPWSTR, cchWideChar: INT): INT {
    return Kernel32.Load('MultiByteToWideChar')(CodePage, dwFlags, lpMultiByteStr, cbMultiByte, lpWideCharStr, cchWideChar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-needcurrentdirectoryforexepatha
  public static NeedCurrentDirectoryForExePathA(ExeName: LPSTR): BOOL {
    return Kernel32.Load('NeedCurrentDirectoryForExePathA')(ExeName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-needcurrentdirectoryforexepathw
  public static NeedCurrentDirectoryForExePathW(ExeName: LPWSTR): BOOL {
    return Kernel32.Load('NeedCurrentDirectoryForExePathW')(ExeName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-normalizestring
  public static NormalizeString(NormForm: DWORD, lpSrcString: LPWSTR, cwSrcLength: INT, lpDstString: LPWSTR, cwDstLength: INT): INT {
    return Kernel32.Load('NormalizeString')(NormForm, lpSrcString, cwSrcLength, lpDstString, cwDstLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-notifyuilanguagechange
  public static NotifyUILanguageChange(dwFlags: DWORD, pcwstrNewLanguage: LPWSTR, pcwstrPreviousLanguage: LPWSTR, dwReserved: DWORD, pdwStatusRtrn: LPVOID): BOOL {
    return Kernel32.Load('NotifyUILanguageChange')(dwFlags, pcwstrNewLanguage, pcwstrPreviousLanguage, dwReserved, pdwStatusRtrn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-offervirtualmemory
  public static OfferVirtualMemory(VirtualAddress: bigint, Size: bigint, Priority: DWORD): DWORD {
    return Kernel32.Load('OfferVirtualMemory')(VirtualAddress, Size, Priority);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-oobecomplete
  public static OOBEComplete(isOOBEComplete: LPVOID): BOOL {
    return Kernel32.Load('OOBEComplete')(isOOBEComplete);
  }

  // https://learn.microsoft.com/en-us/windows/console/openconsole
  public static OpenConsoleW(lpConsoleDevice: LPWSTR, dwDesiredAccess: DWORD, bInheritHandle: BOOL, dwShareMode: DWORD): HANDLE {
    return Kernel32.Load('OpenConsoleW')(lpConsoleDevice, dwDesiredAccess, bInheritHandle, dwShareMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-openeventa
  public static OpenEventA(dwDesiredAccess: DWORD, bInheritHandle: BOOL, lpName: LPSTR): HANDLE {
    return Kernel32.Load('OpenEventA')(dwDesiredAccess, bInheritHandle, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-openeventw
  public static OpenEventW(dwDesiredAccess: DWORD, bInheritHandle: BOOL, lpName: LPWSTR): HANDLE {
    return Kernel32.Load('OpenEventW')(dwDesiredAccess, bInheritHandle, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-openfile
  public static OpenFile(lpFileName: LPSTR, lpReOpenBuff: LPVOID, uStyle: DWORD): INT {
    return Kernel32.Load('OpenFile')(lpFileName, lpReOpenBuff, uStyle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-openfilebyid
  public static OpenFileById(hVolumeHint: HANDLE, lpFileId: LPVOID, dwDesiredAccess: DWORD, dwShareMode: DWORD, lpSecurityAttributes: LPVOID, dwFlagsAndAttributes: DWORD): HANDLE {
    return Kernel32.Load('OpenFileById')(hVolumeHint, lpFileId, dwDesiredAccess, dwShareMode, lpSecurityAttributes, dwFlagsAndAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-openfilemappinga
  public static OpenFileMappingA(dwDesiredAccess: DWORD, bInheritHandle: BOOL, lpName: LPSTR): HANDLE {
    return Kernel32.Load('OpenFileMappingA')(dwDesiredAccess, bInheritHandle, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-openfilemappingw
  public static OpenFileMappingW(dwDesiredAccess: DWORD, bInheritHandle: BOOL, lpName: LPWSTR): HANDLE {
    return Kernel32.Load('OpenFileMappingW')(dwDesiredAccess, bInheritHandle, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/jobapi/nf-jobapi-openjobobjecta
  public static OpenJobObjectA(dwDesiredAccess: DWORD, bInheritHandle: BOOL, lpName: LPSTR): HANDLE {
    return Kernel32.Load('OpenJobObjectA')(dwDesiredAccess, bInheritHandle, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/jobapi/nf-jobapi-openjobobjectw
  public static OpenJobObjectW(dwDesiredAccess: DWORD, bInheritHandle: BOOL, lpName: LPWSTR): HANDLE {
    return Kernel32.Load('OpenJobObjectW')(dwDesiredAccess, bInheritHandle, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-openmutexa
  public static OpenMutexA(dwDesiredAccess: DWORD, bInheritHandle: BOOL, lpName: LPSTR): HANDLE {
    return Kernel32.Load('OpenMutexA')(dwDesiredAccess, bInheritHandle, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-openmutexw
  public static OpenMutexW(dwDesiredAccess: DWORD, bInheritHandle: BOOL, lpName: LPWSTR): HANDLE {
    return Kernel32.Load('OpenMutexW')(dwDesiredAccess, bInheritHandle, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmodel/nf-appmodel-openpackageinfobyfullname
  public static OpenPackageInfoByFullName(packageFullName: LPWSTR, reserved: DWORD, packageInfoReference: LPVOID): DWORD {
    return Kernel32.Load('OpenPackageInfoByFullName')(packageFullName, reserved, packageInfoReference);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-openprivatenamespacea
  public static OpenPrivateNamespaceA(lpBoundaryDescriptor: LPVOID, lpAliasPrefix: LPSTR): HANDLE {
    return Kernel32.Load('OpenPrivateNamespaceA')(lpBoundaryDescriptor, lpAliasPrefix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-openprivatenamespacew
  public static OpenPrivateNamespaceW(lpBoundaryDescriptor: LPVOID, lpAliasPrefix: LPWSTR): HANDLE {
    return Kernel32.Load('OpenPrivateNamespaceW')(lpBoundaryDescriptor, lpAliasPrefix);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-openprocess
  public static OpenProcess(dwDesiredAccess: DWORD, bInheritHandle: BOOL, dwProcessId: DWORD): HANDLE {
    return Kernel32.Load('OpenProcess')(dwDesiredAccess, bInheritHandle, dwProcessId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-opensemaphorea
  public static OpenSemaphoreA(dwDesiredAccess: DWORD, bInheritHandle: BOOL, lpName: LPSTR): HANDLE {
    return Kernel32.Load('OpenSemaphoreA')(dwDesiredAccess, bInheritHandle, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-opensemaphorew
  public static OpenSemaphoreW(dwDesiredAccess: DWORD, bInheritHandle: BOOL, lpName: LPWSTR): HANDLE {
    return Kernel32.Load('OpenSemaphoreW')(dwDesiredAccess, bInheritHandle, lpName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-openthread
  public static OpenThread(dwDesiredAccess: DWORD, bInheritHandle: BOOL, dwThreadId: DWORD): HANDLE {
    return Kernel32.Load('OpenThread')(dwDesiredAccess, bInheritHandle, dwThreadId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-openwaitabletimera
  public static OpenWaitableTimerA(dwDesiredAccess: DWORD, bInheritHandle: BOOL, lpTimerName: LPSTR): HANDLE {
    return Kernel32.Load('OpenWaitableTimerA')(dwDesiredAccess, bInheritHandle, lpTimerName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-openwaitabletimerw
  public static OpenWaitableTimerW(dwDesiredAccess: DWORD, bInheritHandle: BOOL, lpTimerName: LPWSTR): HANDLE {
    return Kernel32.Load('OpenWaitableTimerW')(dwDesiredAccess, bInheritHandle, lpTimerName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-outputdebugstringa
  public static OutputDebugStringA(lpOutputString: LPSTR): VOID {
    return Kernel32.Load('OutputDebugStringA')(lpOutputString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-outputdebugstringw
  public static OutputDebugStringW(lpOutputString: LPWSTR): VOID {
    return Kernel32.Load('OutputDebugStringW')(lpOutputString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-packagefamilynamefromfullname
  public static PackageFamilyNameFromFullName(packageFullName: LPWSTR, packageFamilyNameLength: LPVOID, packageFamilyName: LPWSTR): DWORD {
    return Kernel32.Load('PackageFamilyNameFromFullName')(packageFullName, packageFamilyNameLength, packageFamilyName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-packagefamilynamefromid
  public static PackageFamilyNameFromId(packageId: LPVOID, packageFamilyNameLength: LPVOID, packageFamilyName: LPWSTR): DWORD {
    return Kernel32.Load('PackageFamilyNameFromId')(packageId, packageFamilyNameLength, packageFamilyName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-packagefullnamefromid
  public static PackageFullNameFromId(packageId: LPVOID, packageFullNameLength: LPVOID, packageFullName: LPWSTR): DWORD {
    return Kernel32.Load('PackageFullNameFromId')(packageId, packageFullNameLength, packageFullName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/appmodel/nf-appmodel-packageidfromfullname
  public static PackageIdFromFullName(packageFullName: LPWSTR, flags: DWORD, bufferLength: LPVOID, buffer: LPVOID): DWORD {
    return Kernel32.Load('PackageIdFromFullName')(packageFullName, flags, bufferLength, buffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-packagenameandpublisheridfromfamilyname
  public static PackageNameAndPublisherIdFromFamilyName(packageFamilyName: LPWSTR, packageNameLength: LPVOID, packageName: LPWSTR, packagePublisherIdLength: LPVOID, packagePublisherId: LPWSTR): DWORD {
    return Kernel32.Load('PackageNameAndPublisherIdFromFamilyName')(packageFamilyName, packageNameLength, packageName, packagePublisherIdLength, packagePublisherId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-parseapplicationusermodelid
  public static ParseApplicationUserModelId(applicationUserModelId: LPWSTR, packageFamilyNameLength: LPVOID, packageFamilyName: LPWSTR, packageRelativeApplicationIdLength: LPVOID, packageRelativeApplicationId: LPWSTR): DWORD {
    return Kernel32.Load('ParseApplicationUserModelId')(applicationUserModelId, packageFamilyNameLength, packageFamilyName, packageRelativeApplicationIdLength, packageRelativeApplicationId);
  }

  // https://learn.microsoft.com/en-us/windows/console/peekconsoleinput
  public static PeekConsoleInputA(hConsoleInput: HANDLE, lpBuffer: LPVOID, nLength: DWORD, lpNumberOfEventsRead: LPVOID): BOOL {
    return Kernel32.Load('PeekConsoleInputA')(hConsoleInput, lpBuffer, nLength, lpNumberOfEventsRead);
  }

  // https://learn.microsoft.com/en-us/windows/console/peekconsoleinput
  public static PeekConsoleInputW(hConsoleInput: HANDLE, lpBuffer: LPVOID, nLength: DWORD, lpNumberOfEventsRead: LPVOID): BOOL {
    return Kernel32.Load('PeekConsoleInputW')(hConsoleInput, lpBuffer, nLength, lpNumberOfEventsRead);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-peeknamedpipe
  public static PeekNamedPipe(hNamedPipe: HANDLE, lpBuffer: LPVOID, nBufferSize: DWORD, lpBytesRead: LPVOID, lpTotalBytesAvail: LPVOID, lpBytesLeftThisMessage: LPVOID): BOOL {
    return Kernel32.Load('PeekNamedPipe')(hNamedPipe, lpBuffer, nBufferSize, lpBytesRead, lpTotalBytesAvail, lpBytesLeftThisMessage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-postqueuedcompletionstatus
  public static PostQueuedCompletionStatus(CompletionPort: HANDLE, dwNumberOfBytesTransferred: DWORD, dwCompletionKey: LPVOID, lpOverlapped: LPVOID): BOOL {
    return Kernel32.Load('PostQueuedCompletionStatus')(CompletionPort, dwNumberOfBytesTransferred, dwCompletionKey, lpOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-powerclearrequest
  public static PowerClearRequest(PowerRequest: HANDLE, RequestType: DWORD): BOOL {
    return Kernel32.Load('PowerClearRequest')(PowerRequest, RequestType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-powercreaterequest
  public static PowerCreateRequest(Context: LPVOID): HANDLE {
    return Kernel32.Load('PowerCreateRequest')(Context);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-powersetrequest
  public static PowerSetRequest(PowerRequest: HANDLE, RequestType: DWORD): BOOL {
    return Kernel32.Load('PowerSetRequest')(PowerRequest, RequestType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-prefetchvirtualmemory
  public static PrefetchVirtualMemory(hProcess: HANDLE, NumberOfEntries: bigint, VirtualAddresses: LPVOID, Flags: DWORD): BOOL {
    return Kernel32.Load('PrefetchVirtualMemory')(hProcess, NumberOfEntries, VirtualAddresses, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-preparetape
  public static PrepareTape(hDevice: HANDLE, dwOperation: DWORD, bImmediate: BOOL): DWORD {
    return Kernel32.Load('PrepareTape')(hDevice, dwOperation, bImmediate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-process32first
  public static Process32First(hSnapshot: HANDLE, lppe: LPVOID): BOOL {
    return Kernel32.Load('Process32First')(hSnapshot, lppe);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tlhelp32/nf-tlhelp32-process32firstw
  public static Process32FirstW(hSnapshot: HANDLE, lppe: LPVOID): BOOL {
    return Kernel32.Load('Process32FirstW')(hSnapshot, lppe);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-process32next
  public static Process32Next(hSnapshot: HANDLE, lppe: LPVOID): BOOL {
    return Kernel32.Load('Process32Next')(hSnapshot, lppe);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/tlhelp32/nf-tlhelp32-process32nextw
  public static Process32NextW(hSnapshot: HANDLE, lppe: LPVOID): BOOL {
    return Kernel32.Load('Process32NextW')(hSnapshot, lppe);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-processidtosessionid
  public static ProcessIdToSessionId(dwProcessId: DWORD, pSessionId: LPVOID): BOOL {
    return Kernel32.Load('ProcessIdToSessionId')(dwProcessId, pSessionId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-psscapturesnapshot
  public static PssCaptureSnapshot(ProcessHandle: HANDLE, CaptureFlags: DWORD, ThreadContextFlags: DWORD, SnapshotHandle: LPVOID): DWORD {
    return Kernel32.Load('PssCaptureSnapshot')(ProcessHandle, CaptureFlags, ThreadContextFlags, SnapshotHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-pssduplicatesnapshot
  public static PssDuplicateSnapshot(SourceProcessHandle: HANDLE, SnapshotHandle: DWORD, TargetProcessHandle: HANDLE, TargetSnapshotHandle: LPVOID, Flags: DWORD): DWORD {
    return Kernel32.Load('PssDuplicateSnapshot')(SourceProcessHandle, SnapshotHandle, TargetProcessHandle, TargetSnapshotHandle, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-pssfreesnapshot
  public static PssFreeSnapshot(ProcessHandle: HANDLE, SnapshotHandle: DWORD): DWORD {
    return Kernel32.Load('PssFreeSnapshot')(ProcessHandle, SnapshotHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-pssquerysnapshot
  public static PssQuerySnapshot(SnapshotHandle: DWORD, InformationClass: DWORD, Buffer: LPVOID, BufferLength: DWORD): DWORD {
    return Kernel32.Load('PssQuerySnapshot')(SnapshotHandle, InformationClass, Buffer, BufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-psswalkmarkercreate
  public static PssWalkMarkerCreate(Allocator: LPVOID, WalkMarkerHandle: LPVOID): DWORD {
    return Kernel32.Load('PssWalkMarkerCreate')(Allocator, WalkMarkerHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-psswalkmarkerfree
  public static PssWalkMarkerFree(WalkMarkerHandle: DWORD): DWORD {
    return Kernel32.Load('PssWalkMarkerFree')(WalkMarkerHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-psswalkmarkergetposition
  public static PssWalkMarkerGetPosition(WalkMarkerHandle: DWORD, Position: LPVOID): DWORD {
    return Kernel32.Load('PssWalkMarkerGetPosition')(WalkMarkerHandle, Position);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-psswalkmarkerseektobeginning
  public static PssWalkMarkerSeekToBeginning(WalkMarkerHandle: DWORD): DWORD {
    return Kernel32.Load('PssWalkMarkerSeekToBeginning')(WalkMarkerHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-psswalkmarkersetposition
  public static PssWalkMarkerSetPosition(WalkMarkerHandle: DWORD, Position: LPVOID): DWORD {
    return Kernel32.Load('PssWalkMarkerSetPosition')(WalkMarkerHandle, Position);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-psswalksnapshot
  public static PssWalkSnapshot(SnapshotHandle: DWORD, InformationClass: DWORD, WalkMarkerHandle: DWORD, Buffer: LPVOID, BufferLength: DWORD): DWORD {
    return Kernel32.Load('PssWalkSnapshot')(SnapshotHandle, InformationClass, WalkMarkerHandle, Buffer, BufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-pulseevent
  public static PulseEvent(hEvent: HANDLE): BOOL {
    return Kernel32.Load('PulseEvent')(hEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-purgecomm
  public static PurgeComm(hFile: HANDLE, dwFlags: DWORD): BOOL {
    return Kernel32.Load('PurgeComm')(hFile, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-queryactctxsettingsw
  public static QueryActCtxSettingsW(dwFlags: DWORD, hActCtx: HANDLE, settingsNameSpace: LPWSTR, settingName: LPWSTR, pvBuffer: LPWSTR, dwBuffer: LPVOID, pdwWrittenOrRequired: LPVOID): BOOL {
    return Kernel32.Load('QueryActCtxSettingsW')(dwFlags, hActCtx, settingsNameSpace, settingName, pvBuffer, dwBuffer, pdwWrittenOrRequired);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-queryactctxw
  public static QueryActCtxW(dwFlags: DWORD, hActCtx: HANDLE, pvSubInstance: LPVOID, ulInfoClass: DWORD, pvBuffer: LPVOID, cbBuffer: LPVOID, pcbWrittenOrRequired: LPVOID): BOOL {
    return Kernel32.Load('QueryActCtxW')(dwFlags, hActCtx, pvSubInstance, ulInfoClass, pvBuffer, cbBuffer, pcbWrittenOrRequired);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-querydepthslist
  public static QueryDepthSList(ListHead: LPVOID): USHORT {
    return Kernel32.Load('QueryDepthSList')(ListHead);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-querydosdevicea
  public static QueryDosDeviceA(lpDeviceName: LPSTR, lpTargetPath: LPSTR, ucchMax: DWORD): DWORD {
    return Kernel32.Load('QueryDosDeviceA')(lpDeviceName, lpTargetPath, ucchMax);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-querydosdevicew
  public static QueryDosDeviceW(lpDeviceName: LPWSTR, lpTargetPath: LPWSTR, ucchMax: DWORD): DWORD {
    return Kernel32.Load('QueryDosDeviceW')(lpDeviceName, lpTargetPath, ucchMax);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-queryfullprocessimagenamea
  public static QueryFullProcessImageNameA(hProcess: HANDLE, dwFlags: DWORD, lpExeName: LPSTR, lpdwSize: LPVOID): BOOL {
    return Kernel32.Load('QueryFullProcessImageNameA')(hProcess, dwFlags, lpExeName, lpdwSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-queryfullprocessimagenamew
  public static QueryFullProcessImageNameW(hProcess: HANDLE, dwFlags: DWORD, lpExeName: LPWSTR, lpdwSize: LPVOID): BOOL {
    return Kernel32.Load('QueryFullProcessImageNameW')(hProcess, dwFlags, lpExeName, lpdwSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-queryidleprocessorcycletime
  public static QueryIdleProcessorCycleTime(BufferLength: LPVOID, ProcessorIdleCycleTime: LPVOID): BOOL {
    return Kernel32.Load('QueryIdleProcessorCycleTime')(BufferLength, ProcessorIdleCycleTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-queryidleprocessorcycletimeex
  public static QueryIdleProcessorCycleTimeEx(Group: USHORT, BufferLength: LPVOID, ProcessorIdleCycleTime: LPVOID): BOOL {
    return Kernel32.Load('QueryIdleProcessorCycleTimeEx')(Group, BufferLength, ProcessorIdleCycleTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/jobapi/nf-jobapi-queryinformationjobobject
  public static QueryInformationJobObject(hJob: HANDLE, JobObjectInformationClass: DWORD, lpJobObjectInformation: LPVOID, cbJobObjectInformationLength: DWORD, lpReturnLength: LPVOID): BOOL {
    return Kernel32.Load('QueryInformationJobObject')(hJob, JobObjectInformationClass, lpJobObjectInformation, cbJobObjectInformationLength, lpReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-queryioratecontrolinformationjobobject
  public static QueryIoRateControlInformationJobObject(hJob: HANDLE, VolumeName: LPWSTR, InfoBlocks: LPVOID, InfoBlockCount: LPVOID): DWORD {
    return Kernel32.Load('QueryIoRateControlInformationJobObject')(hJob, VolumeName, InfoBlocks, InfoBlockCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-querymemoryresourcenotification
  public static QueryMemoryResourceNotification(ResourceNotificationHandle: HANDLE, ResourceState: LPVOID): BOOL {
    return Kernel32.Load('QueryMemoryResourceNotification')(ResourceNotificationHandle, ResourceState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/profileapi/nf-profileapi-queryperformancecounter
  public static QueryPerformanceCounter(lpPerformanceCount: LPVOID): BOOL {
    return Kernel32.Load('QueryPerformanceCounter')(lpPerformanceCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/profileapi/nf-profileapi-queryperformancefrequency
  public static QueryPerformanceFrequency(lpFrequency: LPVOID): BOOL {
    return Kernel32.Load('QueryPerformanceFrequency')(lpFrequency);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-queryprocessaffinityupdatemode
  public static QueryProcessAffinityUpdateMode(hProcess: HANDLE, lpdwFlags: LPVOID): BOOL {
    return Kernel32.Load('QueryProcessAffinityUpdateMode')(hProcess, lpdwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-queryprocesscycletime
  public static QueryProcessCycleTime(ProcessHandle: HANDLE, CycleTime: LPVOID): BOOL {
    return Kernel32.Load('QueryProcessCycleTime')(ProcessHandle, CycleTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-queryprotectedpolicy
  public static QueryProtectedPolicy(PolicyGuid: LPVOID, PolicyValue: LPVOID): BOOL {
    return Kernel32.Load('QueryProtectedPolicy')(PolicyGuid, PolicyValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-querythreadcycletime
  public static QueryThreadCycleTime(ThreadHandle: HANDLE, CycleTime: LPVOID): BOOL {
    return Kernel32.Load('QueryThreadCycleTime')(ThreadHandle, CycleTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-querythreadpoolstackinformation
  public static QueryThreadpoolStackInformation(ptpp: DWORD, ptpsi: LPVOID): BOOL {
    return Kernel32.Load('QueryThreadpoolStackInformation')(ptpp, ptpsi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-querythreadprofiling
  public static QueryThreadProfiling(ThreadHandle: HANDLE, Enabled: LPVOID): DWORD {
    return Kernel32.Load('QueryThreadProfiling')(ThreadHandle, Enabled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-queryumsthreadinformation
  public static QueryUmsThreadInformation(UmsThread: LPVOID, UmsThreadInfoClass: DWORD, UmsThreadInformation: LPVOID, UmsThreadInformationLength: DWORD, ReturnLength: LPVOID): BOOL {
    return Kernel32.Load('QueryUmsThreadInformation')(UmsThread, UmsThreadInfoClass, UmsThreadInformation, UmsThreadInformationLength, ReturnLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-queryunbiasedinterrupttime
  public static QueryUnbiasedInterruptTime(UnbiasedTime: LPVOID): BOOL {
    return Kernel32.Load('QueryUnbiasedInterruptTime')(UnbiasedTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-queueuserapc
  public static QueueUserAPC(pfnAPC: DWORD, hThread: HANDLE, dwData: LPVOID): DWORD {
    return Kernel32.Load('QueueUserAPC')(pfnAPC, hThread, dwData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-queueuserapc2
  public static QueueUserAPC2(ApcRoutine: DWORD, Thread: HANDLE, Data: LPVOID, Flags: DWORD): BOOL {
    return Kernel32.Load('QueueUserAPC2')(ApcRoutine, Thread, Data, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-queueuserworkitem
  public static QueueUserWorkItem(_Function: DWORD, Context: LPVOID, Flags: DWORD): BOOL {
    return Kernel32.Load('QueueUserWorkItem')(_Function, Context, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/errhandlingapi/nf-errhandlingapi-raiseexception
  public static RaiseException(dwExceptionCode: DWORD, dwExceptionFlags: DWORD, nNumberOfArguments: DWORD, lpArguments: LPVOID): VOID {
    return Kernel32.Load('RaiseException')(dwExceptionCode, dwExceptionFlags, nNumberOfArguments, lpArguments);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/errhandlingapi/nf-errhandlingapi-raisefailfastexception
  public static RaiseFailFastException(pExceptionRecord: LPVOID, pContextRecord: LPVOID, dwFlags: DWORD): VOID {
    return Kernel32.Load('RaiseFailFastException')(pExceptionRecord, pContextRecord, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/console/readconsole
  public static ReadConsoleA(hConsoleInput: HANDLE, lpBuffer: LPVOID, nNumberOfCharsToRead: DWORD, lpNumberOfCharsRead: LPVOID, pInputControl: LPVOID): BOOL {
    return Kernel32.Load('ReadConsoleA')(hConsoleInput, lpBuffer, nNumberOfCharsToRead, lpNumberOfCharsRead, pInputControl);
  }

  // https://learn.microsoft.com/en-us/windows/console/readconsoleinput
  public static ReadConsoleInputA(hConsoleInput: HANDLE, lpBuffer: LPVOID, nLength: DWORD, lpNumberOfEventsRead: LPVOID): BOOL {
    return Kernel32.Load('ReadConsoleInputA')(hConsoleInput, lpBuffer, nLength, lpNumberOfEventsRead);
  }

  // https://learn.microsoft.com/en-us/windows/console/readconsoleinputex
  public static ReadConsoleInputExA(hConsoleInput: HANDLE, lpBuffer: LPVOID, nLength: DWORD, lpNumberOfEventsRead: LPVOID, wFlags: USHORT): BOOL {
    return Kernel32.Load('ReadConsoleInputExA')(hConsoleInput, lpBuffer, nLength, lpNumberOfEventsRead, wFlags);
  }

  // https://learn.microsoft.com/en-us/windows/console/readconsoleinputex
  public static ReadConsoleInputExW(hConsoleInput: HANDLE, lpBuffer: LPVOID, nLength: DWORD, lpNumberOfEventsRead: LPVOID, wFlags: USHORT): BOOL {
    return Kernel32.Load('ReadConsoleInputExW')(hConsoleInput, lpBuffer, nLength, lpNumberOfEventsRead, wFlags);
  }

  // https://learn.microsoft.com/en-us/windows/console/readconsoleinput
  public static ReadConsoleInputW(hConsoleInput: HANDLE, lpBuffer: LPVOID, nLength: DWORD, lpNumberOfEventsRead: LPVOID): BOOL {
    return Kernel32.Load('ReadConsoleInputW')(hConsoleInput, lpBuffer, nLength, lpNumberOfEventsRead);
  }

  // https://learn.microsoft.com/en-us/windows/console/readconsoleoutput
  public static ReadConsoleOutputA(hConsoleOutput: HANDLE, lpBuffer: LPVOID, dwBufferSize: DWORD, dwBufferCoord: DWORD, lpReadRegion: LPVOID): BOOL {
    return Kernel32.Load('ReadConsoleOutputA')(hConsoleOutput, lpBuffer, dwBufferSize, dwBufferCoord, lpReadRegion);
  }

  // https://learn.microsoft.com/en-us/windows/console/readconsoleoutputattribute
  public static ReadConsoleOutputAttribute(hConsoleOutput: HANDLE, lpAttribute: LPVOID, nLength: DWORD, dwReadCoord: DWORD, lpNumberOfAttrsRead: LPVOID): BOOL {
    return Kernel32.Load('ReadConsoleOutputAttribute')(hConsoleOutput, lpAttribute, nLength, dwReadCoord, lpNumberOfAttrsRead);
  }

  // https://learn.microsoft.com/en-us/windows/console/readconsoleoutputcharacter
  public static ReadConsoleOutputCharacterA(hConsoleOutput: HANDLE, lpCharacter: LPSTR, nLength: DWORD, dwReadCoord: DWORD, lpNumberOfCharsRead: LPVOID): BOOL {
    return Kernel32.Load('ReadConsoleOutputCharacterA')(hConsoleOutput, lpCharacter, nLength, dwReadCoord, lpNumberOfCharsRead);
  }

  // https://learn.microsoft.com/en-us/windows/console/readconsoleoutputcharacter
  public static ReadConsoleOutputCharacterW(hConsoleOutput: HANDLE, lpCharacter: LPWSTR, nLength: DWORD, dwReadCoord: DWORD, lpNumberOfCharsRead: LPVOID): BOOL {
    return Kernel32.Load('ReadConsoleOutputCharacterW')(hConsoleOutput, lpCharacter, nLength, dwReadCoord, lpNumberOfCharsRead);
  }

  // https://learn.microsoft.com/en-us/windows/console/readconsoleoutput
  public static ReadConsoleOutputW(hConsoleOutput: HANDLE, lpBuffer: LPVOID, dwBufferSize: DWORD, dwBufferCoord: DWORD, lpReadRegion: LPVOID): BOOL {
    return Kernel32.Load('ReadConsoleOutputW')(hConsoleOutput, lpBuffer, dwBufferSize, dwBufferCoord, lpReadRegion);
  }

  // https://learn.microsoft.com/en-us/windows/console/readconsole
  public static ReadConsoleW(hConsoleInput: HANDLE, lpBuffer: LPVOID, nNumberOfCharsToRead: DWORD, lpNumberOfCharsRead: LPVOID, pInputControl: LPVOID): BOOL {
    return Kernel32.Load('ReadConsoleW')(hConsoleInput, lpBuffer, nNumberOfCharsToRead, lpNumberOfCharsRead, pInputControl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-readdirectorychangesexw
  public static ReadDirectoryChangesExW(
    hDirectory: HANDLE,
    lpBuffer: LPVOID,
    nBufferLength: DWORD,
    bWatchSubtree: BOOL,
    dwNotifyFilter: DWORD,
    lpBytesReturned: LPVOID,
    lpOverlapped: LPVOID,
    lpCompletionRoutine: DWORD,
    ReadDirectoryNotifyInformationClass: DWORD,
  ): BOOL {
    return Kernel32.Load('ReadDirectoryChangesExW')(hDirectory, lpBuffer, nBufferLength, bWatchSubtree, dwNotifyFilter, lpBytesReturned, lpOverlapped, lpCompletionRoutine, ReadDirectoryNotifyInformationClass);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-readdirectorychangesw
  public static ReadDirectoryChangesW(hDirectory: HANDLE, lpBuffer: LPVOID, nBufferLength: DWORD, bWatchSubtree: BOOL, dwNotifyFilter: DWORD, lpBytesReturned: LPVOID, lpOverlapped: LPVOID, lpCompletionRoutine: DWORD): BOOL {
    return Kernel32.Load('ReadDirectoryChangesW')(hDirectory, lpBuffer, nBufferLength, bWatchSubtree, dwNotifyFilter, lpBytesReturned, lpOverlapped, lpCompletionRoutine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-readfile
  public static ReadFile(hFile: HANDLE, lpBuffer: LPVOID, nNumberOfBytesToRead: DWORD, lpNumberOfBytesRead: LPVOID, lpOverlapped: LPVOID): BOOL {
    return Kernel32.Load('ReadFile')(hFile, lpBuffer, nNumberOfBytesToRead, lpNumberOfBytesRead, lpOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-readfileex
  public static ReadFileEx(hFile: HANDLE, lpBuffer: LPVOID, nNumberOfBytesToRead: DWORD, lpOverlapped: LPVOID, lpCompletionRoutine: DWORD): BOOL {
    return Kernel32.Load('ReadFileEx')(hFile, lpBuffer, nNumberOfBytesToRead, lpOverlapped, lpCompletionRoutine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-readfilescatter
  public static ReadFileScatter(hFile: HANDLE, aSegmentArray: LPVOID, nNumberOfBytesToRead: DWORD, lpReserved: LPVOID, lpOverlapped: LPVOID): BOOL {
    return Kernel32.Load('ReadFileScatter')(hFile, aSegmentArray, nNumberOfBytesToRead, lpReserved, lpOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-readprocessmemory
  public static ReadProcessMemory(hProcess: HANDLE, lpBaseAddress: bigint, lpBuffer: LPVOID, nSize: bigint, lpNumberOfBytesRead: bigint): BOOL {
    return Kernel32.Load('ReadProcessMemory')(hProcess, lpBaseAddress, lpBuffer, nSize, lpNumberOfBytesRead);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-readthreadprofilingdata
  public static ReadThreadProfilingData(PerformanceDataHandle: HANDLE, Flags: DWORD, PerformanceData: LPVOID): DWORD {
    return Kernel32.Load('ReadThreadProfilingData')(PerformanceDataHandle, Flags, PerformanceData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-reclaimvirtualmemory
  public static ReclaimVirtualMemory(VirtualAddress: bigint, Size: bigint): DWORD {
    return Kernel32.Load('ReclaimVirtualMemory')(VirtualAddress, Size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-registerapplicationrecoverycallback
  public static RegisterApplicationRecoveryCallback(pRecoveyCallback: DWORD, pvParameter: LPVOID, dwPingInterval: DWORD, dwFlags: DWORD): DWORD {
    return Kernel32.Load('RegisterApplicationRecoveryCallback')(pRecoveyCallback, pvParameter, dwPingInterval, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-registerapplicationrestart
  public static RegisterApplicationRestart(pwzCommandline: LPWSTR, dwFlags: DWORD): DWORD {
    return Kernel32.Load('RegisterApplicationRestart')(pwzCommandline, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-registerbadmemorynotification
  public static RegisterBadMemoryNotification(Callback: DWORD): LPVOID {
    return Kernel32.Load('RegisterBadMemoryNotification')(Callback);
  }

  // https://learn.microsoft.com/en-us/windows/console/registerconsoleime
  public static RegisterConsoleIME(hWndConsoleIME: DWORD, lpdwConsoleThreadId: LPVOID): BOOL {
    return Kernel32.Load('RegisterConsoleIME')(hWndConsoleIME, lpdwConsoleThreadId);
  }

  // https://learn.microsoft.com/en-us/windows/console/registerconsoleos2
  public static RegisterConsoleOS2(fOs2Register: BOOL): BOOL {
    return Kernel32.Load('RegisterConsoleOS2')(fOs2Register);
  }

  // https://learn.microsoft.com/en-us/windows/console/registerconsolevdm
  public static RegisterConsoleVDM(
    dwRegisterFlags: DWORD,
    hStartHardwareEvent: HANDLE,
    hEndHardwareEvent: HANDLE,
    hErrorhardwareEvent: HANDLE,
    Reserved: DWORD,
    lpStateLength: LPVOID,
    lpState: LPVOID,
    VDMBufferSize: DWORD,
    lpVDMBuffer: LPVOID,
  ): BOOL {
    return Kernel32.Load('RegisterConsoleVDM')(dwRegisterFlags, hStartHardwareEvent, hEndHardwareEvent, hErrorhardwareEvent, Reserved, lpStateLength, lpState, VDMBufferSize, lpVDMBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-registerwaitforsingleobject
  public static RegisterWaitForSingleObject(phNewWaitObject: LPVOID, hObject: HANDLE, Callback: DWORD, Context: LPVOID, dwMilliseconds: DWORD, dwFlags: DWORD): BOOL {
    return Kernel32.Load('RegisterWaitForSingleObject')(phNewWaitObject, hObject, Callback, Context, dwMilliseconds, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-registerwaituntiloobecompleted
  public static RegisterWaitUntilOOBECompleted(OOBECompletedCallback: DWORD, CallbackContext: LPVOID, WaitHandle: LPVOID): BOOL {
    return Kernel32.Load('RegisterWaitUntilOOBECompleted')(OOBECompletedCallback, CallbackContext, WaitHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-releaseactctx
  public static ReleaseActCtx(hActCtx: HANDLE): VOID {
    return Kernel32.Load('ReleaseActCtx')(hActCtx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-releasemutex
  public static ReleaseMutex(hMutex: HANDLE): BOOL {
    return Kernel32.Load('ReleaseMutex')(hMutex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-releasemutexwhencallbackreturns
  public static ReleaseMutexWhenCallbackReturns(pci: DWORD, mut: HANDLE): VOID {
    return Kernel32.Load('ReleaseMutexWhenCallbackReturns')(pci, mut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-releasepackagevirtualizationcontext
  public static ReleasePackageVirtualizationContext(context: DWORD): VOID {
    return Kernel32.Load('ReleasePackageVirtualizationContext')(context);
  }

  // https://learn.microsoft.com/en-us/windows/console/releasepseudoconsole
  public static ReleasePseudoConsole(hPC: DWORD): DWORD {
    return Kernel32.Load('ReleasePseudoConsole')(hPC);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-releasesemaphore
  public static ReleaseSemaphore(hSemaphore: HANDLE, lReleaseCount: INT, lpPreviousCount: LPVOID): BOOL {
    return Kernel32.Load('ReleaseSemaphore')(hSemaphore, lReleaseCount, lpPreviousCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-releasesemaphorewhencallbackreturns
  public static ReleaseSemaphoreWhenCallbackReturns(pci: DWORD, sem: HANDLE, crel: DWORD): VOID {
    return Kernel32.Load('ReleaseSemaphoreWhenCallbackReturns')(pci, sem, crel);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-releasesrwlockexclusive
  public static ReleaseSRWLockExclusive(SRWLock: LPVOID): VOID {
    return Kernel32.Load('ReleaseSRWLockExclusive')(SRWLock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-releasesrwlockshared
  public static ReleaseSRWLockShared(SRWLock: LPVOID): VOID {
    return Kernel32.Load('ReleaseSRWLockShared')(SRWLock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-removedirectory2a
  public static RemoveDirectory2A(lpPathName: LPSTR, DirectoryFlags: DWORD): BOOL {
    return Kernel32.Load('RemoveDirectory2A')(lpPathName, DirectoryFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-removedirectory2w
  public static RemoveDirectory2W(lpPathName: LPWSTR, DirectoryFlags: DWORD): BOOL {
    return Kernel32.Load('RemoveDirectory2W')(lpPathName, DirectoryFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-removedirectorya
  public static RemoveDirectoryA(lpPathName: LPSTR): BOOL {
    return Kernel32.Load('RemoveDirectoryA')(lpPathName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-removedirectorytransacteda
  public static RemoveDirectoryTransactedA(lpPathName: LPSTR, hTransaction: HANDLE): BOOL {
    return Kernel32.Load('RemoveDirectoryTransactedA')(lpPathName, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-removedirectorytransactedw
  public static RemoveDirectoryTransactedW(lpPathName: LPWSTR, hTransaction: HANDLE): BOOL {
    return Kernel32.Load('RemoveDirectoryTransactedW')(lpPathName, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-removedirectoryw
  public static RemoveDirectoryW(lpPathName: LPWSTR): BOOL {
    return Kernel32.Load('RemoveDirectoryW')(lpPathName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-removedlldirectory
  public static RemoveDllDirectory(Cookie: LPVOID): BOOL {
    return Kernel32.Load('RemoveDllDirectory')(Cookie);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-removesecurememorycachecallback
  public static RemoveSecureMemoryCacheCallback(pfnCallBack: DWORD): BOOL {
    return Kernel32.Load('RemoveSecureMemoryCacheCallback')(pfnCallBack);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/errhandlingapi/nf-errhandlingapi-removevectoredcontinuehandler
  public static RemoveVectoredContinueHandler(Handle: LPVOID): DWORD {
    return Kernel32.Load('RemoveVectoredContinueHandler')(Handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/errhandlingapi/nf-errhandlingapi-removevectoredexceptionhandler
  public static RemoveVectoredExceptionHandler(Handle: LPVOID): DWORD {
    return Kernel32.Load('RemoveVectoredExceptionHandler')(Handle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-reopenfile
  public static ReOpenFile(hOriginalFile: HANDLE, dwDesiredAccess: DWORD, dwShareMode: DWORD, dwFlagsAndAttributes: DWORD): HANDLE {
    return Kernel32.Load('ReOpenFile')(hOriginalFile, dwDesiredAccess, dwShareMode, dwFlagsAndAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-replacefilea
  public static ReplaceFileA(lpReplacedFileName: LPSTR, lpReplacementFileName: LPSTR, lpBackupFileName: LPSTR, dwReplaceFlags: DWORD, lpExclude: LPVOID, lpReserved: LPVOID): BOOL {
    return Kernel32.Load('ReplaceFileA')(lpReplacedFileName, lpReplacementFileName, lpBackupFileName, dwReplaceFlags, lpExclude, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-replacefilew
  public static ReplaceFileW(lpReplacedFileName: LPWSTR, lpReplacementFileName: LPWSTR, lpBackupFileName: LPWSTR, dwReplaceFlags: DWORD, lpExclude: LPVOID, lpReserved: LPVOID): BOOL {
    return Kernel32.Load('ReplaceFileW')(lpReplacedFileName, lpReplacementFileName, lpBackupFileName, dwReplaceFlags, lpExclude, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-replacepartitionunit
  public static ReplacePartitionUnit(TargetPartition: LPWSTR, SparePartition: LPWSTR, Flags: DWORD): BOOL {
    return Kernel32.Load('ReplacePartitionUnit')(TargetPartition, SparePartition, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-requestdevicewakeup
  public static RequestDeviceWakeup(hDevice: HANDLE): BOOL {
    return Kernel32.Load('RequestDeviceWakeup')(hDevice);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-requestwakeuplatency
  public static RequestWakeupLatency(latency: DWORD): BOOL {
    return Kernel32.Load('RequestWakeupLatency')(latency);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-resetevent
  public static ResetEvent(hEvent: HANDLE): BOOL {
    return Kernel32.Load('ResetEvent')(hEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-resetwritewatch
  public static ResetWriteWatch(lpBaseAddress: LPVOID, dwRegionSize: LPVOID): DWORD {
    return Kernel32.Load('ResetWriteWatch')(lpBaseAddress, dwRegionSize);
  }

  // https://learn.microsoft.com/en-us/windows/console/resizepseudoconsole
  public static ResizePseudoConsole(hPC: DWORD, size: DWORD): DWORD {
    return Kernel32.Load('ResizePseudoConsole')(hPC, size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-resolvelocalename
  public static ResolveLocaleName(lpNameToResolve: LPWSTR, lpLocaleName: LPWSTR, cchLocaleName: INT): INT {
    return Kernel32.Load('ResolveLocaleName')(lpNameToResolve, lpLocaleName, cchLocaleName);
  }

  // public static RestoreThreadPreferredUILanguages(snapshot: DWORD): VOID {
  //   return Kernel32.Load('RestoreThreadPreferredUILanguages')(snapshot);
  // }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-resumethread
  public static ResumeThread(hThread: HANDLE): DWORD {
    return Kernel32.Load('ResumeThread')(hThread);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-rtladdfunctiontable
  public static RtlAddFunctionTable(FunctionTable: LPVOID, EntryCount: DWORD, BaseAddress: ULONGLONG): DWORD {
    return Kernel32.Load('RtlAddFunctionTable')(FunctionTable, EntryCount, BaseAddress);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-rtlcapturecontext
  public static RtlCaptureContext(ContextRecord: LPVOID): VOID {
    return Kernel32.Load('RtlCaptureContext')(ContextRecord);
  }

  // public static RtlCaptureContext2(ContextRecord: LPVOID): VOID {
  //   return Kernel32.Load('RtlCaptureContext2')(ContextRecord);
  // }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-rtlcapturestackbacktrace
  public static RtlCaptureStackBackTrace(FramesToSkip: DWORD, FramesToCapture: DWORD, BackTrace: LPVOID, BackTraceHash: LPVOID): USHORT {
    return Kernel32.Load('RtlCaptureStackBackTrace')(FramesToSkip, FramesToCapture, BackTrace, BackTraceHash);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-rtlcomparememory
  public static RtlCompareMemory(Source1: LPVOID, Source2: LPVOID, Length: LPVOID): LPVOID {
    return Kernel32.Load('RtlCompareMemory')(Source1, Source2, Length);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-rtldeletefunctiontable
  public static RtlDeleteFunctionTable(FunctionTable: LPVOID): DWORD {
    return Kernel32.Load('RtlDeleteFunctionTable')(FunctionTable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-rtlinstallfunctiontablecallback
  public static RtlInstallFunctionTableCallback(TableIdentifier: ULONGLONG, BaseAddress: ULONGLONG, Length: DWORD, Callback: DWORD, Context: LPVOID, OutOfProcessCallbackDll: LPWSTR): DWORD {
    return Kernel32.Load('RtlInstallFunctionTableCallback')(TableIdentifier, BaseAddress, Length, Callback, Context, OutOfProcessCallbackDll);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-rtllookupfunctionentry
  public static RtlLookupFunctionEntry(ControlPc: ULONGLONG, ImageBase: LPVOID, HistoryTable: LPVOID): LPVOID {
    return Kernel32.Load('RtlLookupFunctionEntry')(ControlPc, ImageBase, HistoryTable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-rtlpctofileheader
  public static RtlPcToFileHeader(PcValue: LPVOID, BaseOfImage: LPVOID): LPVOID {
    return Kernel32.Load('RtlPcToFileHeader')(PcValue, BaseOfImage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-rtlraiseexception
  public static RtlRaiseException(ExceptionRecord: LPVOID): VOID {
    return Kernel32.Load('RtlRaiseException')(ExceptionRecord);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-rtlrestorecontext
  public static RtlRestoreContext(ContextRecord: LPVOID, ExceptionRecord: LPVOID): VOID {
    return Kernel32.Load('RtlRestoreContext')(ContextRecord, ExceptionRecord);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-rtlunwind
  public static RtlUnwind(TargetFrame: LPVOID, TargetIp: LPVOID, ExceptionRecord: LPVOID, ReturnValue: LPVOID): VOID {
    return Kernel32.Load('RtlUnwind')(TargetFrame, TargetIp, ExceptionRecord, ReturnValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-rtlunwindex
  public static RtlUnwindEx(TargetFrame: LPVOID, TargetIp: LPVOID, ExceptionRecord: LPVOID, ReturnValue: LPVOID, ContextRecord: LPVOID, HistoryTable: LPVOID): VOID {
    return Kernel32.Load('RtlUnwindEx')(TargetFrame, TargetIp, ExceptionRecord, ReturnValue, ContextRecord, HistoryTable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-rtlvirtualunwind
  public static RtlVirtualUnwind(HandlerType: DWORD, ImageBase: ULONGLONG, ControlPc: ULONGLONG, FunctionEntry: LPVOID, ContextRecord: LPVOID, HandlerData: LPVOID, EstablisherFrame: LPVOID, ContextPointers: LPVOID): DWORD {
    return Kernel32.Load('RtlVirtualUnwind')(HandlerType, ImageBase, ControlPc, FunctionEntry, ContextRecord, HandlerData, EstablisherFrame, ContextPointers);
  }

  // https://learn.microsoft.com/en-us/windows/console/scrollconsolescreenbuffer
  public static ScrollConsoleScreenBufferA(hConsoleOutput: HANDLE, lpScrollRectangle: LPVOID, lpClipRectangle: LPVOID, dwDestinationOrigin: DWORD, lpFill: LPVOID): BOOL {
    return Kernel32.Load('ScrollConsoleScreenBufferA')(hConsoleOutput, lpScrollRectangle, lpClipRectangle, dwDestinationOrigin, lpFill);
  }

  // https://learn.microsoft.com/en-us/windows/console/scrollconsolescreenbuffer
  public static ScrollConsoleScreenBufferW(hConsoleOutput: HANDLE, lpScrollRectangle: LPVOID, lpClipRectangle: LPVOID, dwDestinationOrigin: DWORD, lpFill: LPVOID): BOOL {
    return Kernel32.Load('ScrollConsoleScreenBufferW')(hConsoleOutput, lpScrollRectangle, lpClipRectangle, dwDestinationOrigin, lpFill);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-searchpatha
  public static SearchPathA(lpPath: LPSTR, lpFileName: LPSTR, lpExtension: LPSTR, nBufferLength: DWORD, lpBuffer: LPSTR, lpFilePart: LPVOID): DWORD {
    return Kernel32.Load('SearchPathA')(lpPath, lpFileName, lpExtension, nBufferLength, lpBuffer, lpFilePart);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-searchpathw
  public static SearchPathW(lpPath: LPWSTR, lpFileName: LPWSTR, lpExtension: LPWSTR, nBufferLength: DWORD, lpBuffer: LPWSTR, lpFilePart: LPVOID): DWORD {
    return Kernel32.Load('SearchPathW')(lpPath, lpFileName, lpExtension, nBufferLength, lpBuffer, lpFilePart);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setcachedsigninglevel
  public static SetCachedSigningLevel(SourceFiles: LPVOID, SourceFileCount: DWORD, Flags: DWORD, TargetFile: HANDLE): BOOL {
    return Kernel32.Load('SetCachedSigningLevel')(SourceFiles, SourceFileCount, Flags, TargetFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setcalendarinfoa
  public static SetCalendarInfoA(Locale: DWORD, Calendar: DWORD, CalType: DWORD, lpCalData: LPSTR): BOOL {
    return Kernel32.Load('SetCalendarInfoA')(Locale, Calendar, CalType, lpCalData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setcalendarinfow
  public static SetCalendarInfoW(Locale: DWORD, Calendar: DWORD, CalType: DWORD, lpCalData: LPWSTR): BOOL {
    return Kernel32.Load('SetCalendarInfoW')(Locale, Calendar, CalType, lpCalData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setcommbreak
  public static SetCommBreak(hFile: HANDLE): BOOL {
    return Kernel32.Load('SetCommBreak')(hFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setcommconfig
  public static SetCommConfig(hCommDev: HANDLE, lpCC: LPVOID, dwSize: DWORD): BOOL {
    return Kernel32.Load('SetCommConfig')(hCommDev, lpCC, dwSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setcommmask
  public static SetCommMask(hFile: HANDLE, dwEvtMask: DWORD): BOOL {
    return Kernel32.Load('SetCommMask')(hFile, dwEvtMask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setcommstate
  public static SetCommState(hFile: HANDLE, lpDCB: LPVOID): BOOL {
    return Kernel32.Load('SetCommState')(hFile, lpDCB);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setcommtimeouts
  public static SetCommTimeouts(hFile: HANDLE, lpCommTimeouts: LPVOID): BOOL {
    return Kernel32.Load('SetCommTimeouts')(hFile, lpCommTimeouts);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setcomputernamea
  public static SetComputerNameA(lpComputerName: LPSTR): BOOL {
    return Kernel32.Load('SetComputerNameA')(lpComputerName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setcomputernameex2w
  public static SetComputerNameEx2W(NameType: DWORD, Flags: DWORD, lpBuffer: LPWSTR): BOOL {
    return Kernel32.Load('SetComputerNameEx2W')(NameType, Flags, lpBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setcomputernameexa
  public static SetComputerNameExA(NameType: DWORD, lpBuffer: LPSTR): BOOL {
    return Kernel32.Load('SetComputerNameExA')(NameType, lpBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setcomputernameexw
  public static SetComputerNameExW(NameType: DWORD, lpBuffer: LPWSTR): BOOL {
    return Kernel32.Load('SetComputerNameExW')(NameType, lpBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setcomputernamew
  public static SetComputerNameW(lpComputerName: LPWSTR): BOOL {
    return Kernel32.Load('SetComputerNameW')(lpComputerName);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsoleactivescreenbuffer
  public static SetConsoleActiveScreenBuffer(hConsoleOutput: HANDLE): BOOL {
    return Kernel32.Load('SetConsoleActiveScreenBuffer')(hConsoleOutput);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsolecp
  public static SetConsoleCP(wCodePageID: DWORD): BOOL {
    return Kernel32.Load('SetConsoleCP')(wCodePageID);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsolectrlhandler
  public static SetConsoleCtrlHandler(HandlerRoutine: DWORD, Add: BOOL): BOOL {
    return Kernel32.Load('SetConsoleCtrlHandler')(HandlerRoutine, Add);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsolecursor
  public static SetConsoleCursor(hConsoleOutput: HANDLE, hCursor: DWORD): BOOL {
    return Kernel32.Load('SetConsoleCursor')(hConsoleOutput, hCursor);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsolecursorinfo
  public static SetConsoleCursorInfo(hConsoleOutput: HANDLE, lpConsoleCursorInfo: LPVOID): BOOL {
    return Kernel32.Load('SetConsoleCursorInfo')(hConsoleOutput, lpConsoleCursorInfo);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsolecursormode
  public static SetConsoleCursorMode(hConsoleHandle: HANDLE, Blink: BOOL, DBEnable: BOOL): BOOL {
    return Kernel32.Load('SetConsoleCursorMode')(hConsoleHandle, Blink, DBEnable);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsolecursorposition
  public static SetConsoleCursorPosition(hConsoleOutput: HANDLE, dwCursorPosition: DWORD): BOOL {
    return Kernel32.Load('SetConsoleCursorPosition')(hConsoleOutput, dwCursorPosition);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsoledisplaymode
  public static SetConsoleDisplayMode(hConsoleOutput: HANDLE, dwFlags: DWORD, lpNewScreenBufferDimensions: LPVOID): BOOL {
    return Kernel32.Load('SetConsoleDisplayMode')(hConsoleOutput, dwFlags, lpNewScreenBufferDimensions);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsolefont
  public static SetConsoleFont(hConsoleOutput: HANDLE, nFont: DWORD): BOOL {
    return Kernel32.Load('SetConsoleFont')(hConsoleOutput, nFont);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsolehardwarestate
  public static SetConsoleHardwareState(hConsoleOutput: HANDLE, dwResolution: DWORD, dwFontSize: DWORD): BOOL {
    return Kernel32.Load('SetConsoleHardwareState')(hConsoleOutput, dwResolution, dwFontSize);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsolehistoryinfo
  public static SetConsoleHistoryInfo(lpConsoleHistoryInfo: LPVOID): BOOL {
    return Kernel32.Load('SetConsoleHistoryInfo')(lpConsoleHistoryInfo);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsoleicon
  public static SetConsoleIcon(hIcon: DWORD): BOOL {
    return Kernel32.Load('SetConsoleIcon')(hIcon);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsoleinputexename
  public static SetConsoleInputExeNameA(lpExeName: LPSTR): BOOL {
    return Kernel32.Load('SetConsoleInputExeNameA')(lpExeName);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsoleinputexename
  public static SetConsoleInputExeNameW(lpExeName: LPWSTR): BOOL {
    return Kernel32.Load('SetConsoleInputExeNameW')(lpExeName);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsolekeyshortcuts
  public static SetConsoleKeyShortcuts(bSet: BOOL, bReserveKeys: LPVOID, lpAppKeys: LPVOID, dwNumAppKeys: DWORD): BOOL {
    return Kernel32.Load('SetConsoleKeyShortcuts')(bSet, bReserveKeys, lpAppKeys, dwNumAppKeys);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsolelocaleudc
  public static SetConsoleLocalEUDC(hConsoleHandle: HANDLE, wCodePoint: USHORT, cFontSize: DWORD, lpSB: LPSTR): BOOL {
    return Kernel32.Load('SetConsoleLocalEUDC')(hConsoleHandle, wCodePoint, cFontSize, lpSB);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsolemenuclose
  public static SetConsoleMenuClose(bEnable: BOOL): BOOL {
    return Kernel32.Load('SetConsoleMenuClose')(bEnable);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsolemode
  public static SetConsoleMode(hConsoleHandle: HANDLE, dwMode: DWORD): BOOL {
    return Kernel32.Load('SetConsoleMode')(hConsoleHandle, dwMode);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsolenlsmode
  public static SetConsoleNlsMode(hConsole: HANDLE, fdwNlsMode: DWORD): BOOL {
    return Kernel32.Load('SetConsoleNlsMode')(hConsole, fdwNlsMode);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsolenumberofcommands
  public static SetConsoleNumberOfCommandsA(Number: DWORD, ExeName: LPSTR): BOOL {
    return Kernel32.Load('SetConsoleNumberOfCommandsA')(Number, ExeName);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsolenumberofcommands
  public static SetConsoleNumberOfCommandsW(Number: DWORD, ExeName: LPWSTR): BOOL {
    return Kernel32.Load('SetConsoleNumberOfCommandsW')(Number, ExeName);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsoleos2oemformat
  public static SetConsoleOS2OemFormat(fOs2OemFormat: BOOL): BOOL {
    return Kernel32.Load('SetConsoleOS2OemFormat')(fOs2OemFormat);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsoleoutputcp
  public static SetConsoleOutputCP(wCodePageID: DWORD): BOOL {
    return Kernel32.Load('SetConsoleOutputCP')(wCodePageID);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsolepalette
  public static SetConsolePalette(hConsoleOutput: HANDLE, hPalette: DWORD, dwUsage: DWORD): BOOL {
    return Kernel32.Load('SetConsolePalette')(hConsoleOutput, hPalette, dwUsage);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsolescreenbufferinfoex
  public static SetConsoleScreenBufferInfoEx(hConsoleOutput: HANDLE, lpConsoleScreenBufferInfoEx: LPVOID): BOOL {
    return Kernel32.Load('SetConsoleScreenBufferInfoEx')(hConsoleOutput, lpConsoleScreenBufferInfoEx);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsolescreenbuffersize
  public static SetConsoleScreenBufferSize(hConsoleOutput: HANDLE, dwSize: DWORD): BOOL {
    return Kernel32.Load('SetConsoleScreenBufferSize')(hConsoleOutput, dwSize);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsoletextattribute
  public static SetConsoleTextAttribute(hConsoleOutput: HANDLE, wAttributes: DWORD): BOOL {
    return Kernel32.Load('SetConsoleTextAttribute')(hConsoleOutput, wAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsoletitle
  public static SetConsoleTitleA(lpConsoleTitle: LPSTR): BOOL {
    return Kernel32.Load('SetConsoleTitleA')(lpConsoleTitle);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsoletitle
  public static SetConsoleTitleW(lpConsoleTitle: LPWSTR): BOOL {
    return Kernel32.Load('SetConsoleTitleW')(lpConsoleTitle);
  }

  // https://learn.microsoft.com/en-us/windows/console/setconsolewindowinfo
  public static SetConsoleWindowInfo(hConsoleOutput: HANDLE, bAbsolute: BOOL, lpConsoleWindow: LPVOID): BOOL {
    return Kernel32.Load('SetConsoleWindowInfo')(hConsoleOutput, bAbsolute, lpConsoleWindow);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setcriticalsectionspincount
  public static SetCriticalSectionSpinCount(lpCriticalSection: LPVOID, dwSpinCount: DWORD): DWORD {
    return Kernel32.Load('SetCriticalSectionSpinCount')(lpCriticalSection, dwSpinCount);
  }

  // https://learn.microsoft.com/en-us/windows/console/setcurrentconsolefontex
  public static SetCurrentConsoleFontEx(hConsoleOutput: HANDLE, bMaximumWindow: BOOL, lpConsoleCurrentFontEx: LPVOID): BOOL {
    return Kernel32.Load('SetCurrentConsoleFontEx')(hConsoleOutput, bMaximumWindow, lpConsoleCurrentFontEx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-setcurrentdirectorya
  public static SetCurrentDirectoryA(lpPathName: LPSTR): BOOL {
    return Kernel32.Load('SetCurrentDirectoryA')(lpPathName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-setcurrentdirectoryw
  public static SetCurrentDirectoryW(lpPathName: LPWSTR): BOOL {
    return Kernel32.Load('SetCurrentDirectoryW')(lpPathName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setdefaultcommconfiga
  public static SetDefaultCommConfigA(lpszName: LPSTR, lpCC: LPVOID, dwSize: DWORD): BOOL {
    return Kernel32.Load('SetDefaultCommConfigA')(lpszName, lpCC, dwSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setdefaultcommconfigw
  public static SetDefaultCommConfigW(lpszName: LPWSTR, lpCC: LPVOID, dwSize: DWORD): BOOL {
    return Kernel32.Load('SetDefaultCommConfigW')(lpszName, lpCC, dwSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-setdefaultdlldirectories
  public static SetDefaultDllDirectories(DirectoryFlags: DWORD): BOOL {
    return Kernel32.Load('SetDefaultDllDirectories')(DirectoryFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-setdlldirectorya
  public static SetDllDirectoryA(lpPathName: LPSTR): BOOL {
    return Kernel32.Load('SetDllDirectoryA')(lpPathName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-setdlldirectoryw
  public static SetDllDirectoryW(lpPathName: LPWSTR): BOOL {
    return Kernel32.Load('SetDllDirectoryW')(lpPathName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setdynamictimezoneinformation
  public static SetDynamicTimeZoneInformation(lpTimeZoneInformation: LPVOID): BOOL {
    return Kernel32.Load('SetDynamicTimeZoneInformation')(lpTimeZoneInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setendoffile
  public static SetEndOfFile(hFile: HANDLE): BOOL {
    return Kernel32.Load('SetEndOfFile')(hFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-setenvironmentstringsa
  public static SetEnvironmentStringsA(NewEnvironment: LPSTR): BOOL {
    return Kernel32.Load('SetEnvironmentStringsA')(NewEnvironment);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-setenvironmentstringsw
  public static SetEnvironmentStringsW(NewEnvironment: LPWSTR): BOOL {
    return Kernel32.Load('SetEnvironmentStringsW')(NewEnvironment);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-setenvironmentvariablea
  public static SetEnvironmentVariableA(lpName: LPSTR, lpValue: LPSTR): BOOL {
    return Kernel32.Load('SetEnvironmentVariableA')(lpName, lpValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-setenvironmentvariablew
  public static SetEnvironmentVariableW(lpName: LPWSTR, lpValue: LPWSTR): BOOL {
    return Kernel32.Load('SetEnvironmentVariableW')(lpName, lpValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/errhandlingapi/nf-errhandlingapi-seterrormode
  public static SetErrorMode(uMode: DWORD): DWORD {
    return Kernel32.Load('SetErrorMode')(uMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-setevent
  public static SetEvent(hEvent: HANDLE): BOOL {
    return Kernel32.Load('SetEvent')(hEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-seteventwhencallbackreturns
  public static SetEventWhenCallbackReturns(pci: DWORD, evt: HANDLE): VOID {
    return Kernel32.Load('SetEventWhenCallbackReturns')(pci, evt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfileapistoansi
  public static SetFileApisToANSI(): VOID {
    return Kernel32.Load('SetFileApisToANSI')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfileapistooem
  public static SetFileApisToOEM(): VOID {
    return Kernel32.Load('SetFileApisToOEM')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfileattributesa
  public static SetFileAttributesA(lpFileName: LPSTR, dwFileAttributes: DWORD): BOOL {
    return Kernel32.Load('SetFileAttributesA')(lpFileName, dwFileAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfileattributestransacteda
  public static SetFileAttributesTransactedA(lpFileName: LPSTR, dwFileAttributes: DWORD, hTransaction: HANDLE): BOOL {
    return Kernel32.Load('SetFileAttributesTransactedA')(lpFileName, dwFileAttributes, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfileattributestransactedw
  public static SetFileAttributesTransactedW(lpFileName: LPWSTR, dwFileAttributes: DWORD, hTransaction: HANDLE): BOOL {
    return Kernel32.Load('SetFileAttributesTransactedW')(lpFileName, dwFileAttributes, hTransaction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfileattributesw
  public static SetFileAttributesW(lpFileName: LPWSTR, dwFileAttributes: DWORD): BOOL {
    return Kernel32.Load('SetFileAttributesW')(lpFileName, dwFileAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfilebandwidthreservation
  public static SetFileBandwidthReservation(hFile: HANDLE, nPeriodMilliseconds: DWORD, nBytesPerPeriod: DWORD, bDiscardable: BOOL, lpTransferSize: LPVOID, lpNumOutstandingRequests: LPVOID): BOOL {
    return Kernel32.Load('SetFileBandwidthReservation')(hFile, nPeriodMilliseconds, nBytesPerPeriod, bDiscardable, lpTransferSize, lpNumOutstandingRequests);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfilecompletionnotificationmodes
  public static SetFileCompletionNotificationModes(FileHandle: HANDLE, Flags: LPVOID): BOOL {
    return Kernel32.Load('SetFileCompletionNotificationModes')(FileHandle, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfileinformationbyhandle
  public static SetFileInformationByHandle(hFile: HANDLE, FileInformationClass: DWORD, lpFileInformation: LPVOID, dwBufferSize: DWORD): BOOL {
    return Kernel32.Load('SetFileInformationByHandle')(hFile, FileInformationClass, lpFileInformation, dwBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfileiooverlappedrange
  public static SetFileIoOverlappedRange(FileHandle: HANDLE, OverlappedRangeStart: LPVOID, Length: DWORD): BOOL {
    return Kernel32.Load('SetFileIoOverlappedRange')(FileHandle, OverlappedRangeStart, Length);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfilepointer
  public static SetFilePointer(hFile: HANDLE, lDistanceToMove: INT, lpDistanceToMoveHigh: LPVOID, dwMoveMethod: DWORD): DWORD {
    return Kernel32.Load('SetFilePointer')(hFile, lDistanceToMove, lpDistanceToMoveHigh, dwMoveMethod);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfilepointerex
  public static SetFilePointerEx(hFile: HANDLE, liDistanceToMove: LPVOID, lpNewFilePointer: LPVOID, dwMoveMethod: DWORD): BOOL {
    return Kernel32.Load('SetFilePointerEx')(hFile, liDistanceToMove, lpNewFilePointer, dwMoveMethod);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfileshortnamea
  public static SetFileShortNameA(hFile: HANDLE, lpShortName: LPSTR): BOOL {
    return Kernel32.Load('SetFileShortNameA')(hFile, lpShortName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfileshortnamew
  public static SetFileShortNameW(hFile: HANDLE, lpShortName: LPWSTR): BOOL {
    return Kernel32.Load('SetFileShortNameW')(hFile, lpShortName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfiletime
  public static SetFileTime(hFile: HANDLE, lpCreationTime: LPVOID, lpLastAccessTime: LPVOID, lpLastWriteTime: LPVOID): BOOL {
    return Kernel32.Load('SetFileTime')(hFile, lpCreationTime, lpLastAccessTime, lpLastWriteTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfilevaliddata
  public static SetFileValidData(hFile: HANDLE, ValidDataLength: LPVOID): BOOL {
    return Kernel32.Load('SetFileValidData')(hFile, ValidDataLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setfirmwareenvironmentvariablea
  public static SetFirmwareEnvironmentVariableA(lpName: LPSTR, lpGuid: LPSTR, pValue: LPVOID, nSize: DWORD): BOOL {
    return Kernel32.Load('SetFirmwareEnvironmentVariableA')(lpName, lpGuid, pValue, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setfirmwareenvironmentvariableexa
  public static SetFirmwareEnvironmentVariableExA(lpName: LPSTR, lpGuid: LPSTR, pValue: LPVOID, nSize: DWORD, dwAttributes: DWORD): BOOL {
    return Kernel32.Load('SetFirmwareEnvironmentVariableExA')(lpName, lpGuid, pValue, nSize, dwAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setfirmwareenvironmentvariableexw
  public static SetFirmwareEnvironmentVariableExW(lpName: LPWSTR, lpGuid: LPWSTR, pValue: LPVOID, nSize: DWORD, dwAttributes: DWORD): BOOL {
    return Kernel32.Load('SetFirmwareEnvironmentVariableExW')(lpName, lpGuid, pValue, nSize, dwAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setfirmwareenvironmentvariablew
  public static SetFirmwareEnvironmentVariableW(lpName: LPWSTR, lpGuid: LPWSTR, pValue: LPVOID, nSize: DWORD): BOOL {
    return Kernel32.Load('SetFirmwareEnvironmentVariableW')(lpName, lpGuid, pValue, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-sethandlecount
  public static SetHandleCount(uNumber: DWORD): DWORD {
    return Kernel32.Load('SetHandleCount')(uNumber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/handleapi/nf-handleapi-sethandleinformation
  public static SetHandleInformation(hObject: HANDLE, dwMask: DWORD, dwFlags: DWORD): BOOL {
    return Kernel32.Load('SetHandleInformation')(hObject, dwMask, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/jobapi/nf-jobapi-setinformationjobobject
  public static SetInformationJobObject(hJob: HANDLE, JobObjectInformationClass: DWORD, lpJobObjectInformation: LPVOID, cbJobObjectInformationLength: DWORD): BOOL {
    return Kernel32.Load('SetInformationJobObject')(hJob, JobObjectInformationClass, lpJobObjectInformation, cbJobObjectInformationLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setioratecontrolinformationjobobject
  public static SetIoRateControlInformationJobObject(hJob: HANDLE, IoRateControlInfo: LPVOID): DWORD {
    return Kernel32.Load('SetIoRateControlInformationJobObject')(hJob, IoRateControlInfo);
  }

  // https://learn.microsoft.com/en-us/windows/console/setlastconsoleeventactive
  public static SetLastConsoleEventActive(): VOID {
    return Kernel32.Load('SetLastConsoleEventActive')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/errhandlingapi/nf-errhandlingapi-setlasterror
  public static SetLastError(dwErrCode: DWORD): VOID {
    return Kernel32.Load('SetLastError')(dwErrCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setlocaleinfoa
  public static SetLocaleInfoA(Locale: DWORD, LCType: DWORD, lpLCData: LPSTR): BOOL {
    return Kernel32.Load('SetLocaleInfoA')(Locale, LCType, lpLCData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setlocaleinfow
  public static SetLocaleInfoW(Locale: DWORD, LCType: DWORD, lpLCData: LPWSTR): BOOL {
    return Kernel32.Load('SetLocaleInfoW')(Locale, LCType, lpLCData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setlocaltime
  public static SetLocalTime(lpSystemTime: LPVOID): BOOL {
    return Kernel32.Load('SetLocalTime')(lpSystemTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setmailslotinfo
  public static SetMailslotInfo(hMailslot: HANDLE, lReadTimeout: DWORD): BOOL {
    return Kernel32.Load('SetMailslotInfo')(hMailslot, lReadTimeout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setmessagewaitingindicator
  public static SetMessageWaitingIndicator(hMsgIndicator: HANDLE, ulMsgCount: DWORD): BOOL {
    return Kernel32.Load('SetMessageWaitingIndicator')(hMsgIndicator, ulMsgCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-setnamedpipehandlestate
  public static SetNamedPipeHandleState(hNamedPipe: HANDLE, lpMode: LPVOID, lpMaxCollectionCount: LPVOID, lpCollectDataTimeout: LPVOID): BOOL {
    return Kernel32.Load('SetNamedPipeHandleState')(hNamedPipe, lpMode, lpMaxCollectionCount, lpCollectDataTimeout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-setpriorityclass
  public static SetPriorityClass(hProcess: HANDLE, dwPriorityClass: DWORD): BOOL {
    return Kernel32.Load('SetPriorityClass')(hProcess, dwPriorityClass);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setprocessaffinitymask
  public static SetProcessAffinityMask(hProcess: HANDLE, dwProcessAffinityMask: LPVOID): BOOL {
    return Kernel32.Load('SetProcessAffinityMask')(hProcess, dwProcessAffinityMask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setprocessaffinityupdatemode
  public static SetProcessAffinityUpdateMode(hProcess: HANDLE, dwFlags: DWORD): BOOL {
    return Kernel32.Load('SetProcessAffinityUpdateMode')(hProcess, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setprocessdefaultcpusetmasks
  public static SetProcessDefaultCpuSetMasks(Process: HANDLE, CpuSetMasks: LPVOID, CpuSetMaskCount: USHORT): BOOL {
    return Kernel32.Load('SetProcessDefaultCpuSetMasks')(Process, CpuSetMasks, CpuSetMaskCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setprocessdefaultcpusets
  public static SetProcessDefaultCpuSets(Process: HANDLE, CpuSetIds: LPVOID, CpuSetIdCount: DWORD): BOOL {
    return Kernel32.Load('SetProcessDefaultCpuSets')(Process, CpuSetIds, CpuSetIdCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setprocessdeppolicy
  public static SetProcessDEPPolicy(dwFlags: DWORD): BOOL {
    return Kernel32.Load('SetProcessDEPPolicy')(dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setprocessdynamicehcontinuationtargets
  public static SetProcessDynamicEHContinuationTargets(Process: HANDLE, NumberOfTargets: USHORT, Targets: LPVOID): BOOL {
    return Kernel32.Load('SetProcessDynamicEHContinuationTargets')(Process, NumberOfTargets, Targets);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setprocessdynamicenforcedcetcompatibleranges
  public static SetProcessDynamicEnforcedCetCompatibleRanges(Process: HANDLE, NumberOfRanges: USHORT, Ranges: LPVOID): BOOL {
    return Kernel32.Load('SetProcessDynamicEnforcedCetCompatibleRanges')(Process, NumberOfRanges, Ranges);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setprocessinformation
  public static SetProcessInformation(hProcess: HANDLE, ProcessInformationClass: DWORD, ProcessInformation: LPVOID, ProcessInformationSize: DWORD): BOOL {
    return Kernel32.Load('SetProcessInformation')(hProcess, ProcessInformationClass, ProcessInformation, ProcessInformationSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setprocessmitigationpolicy
  public static SetProcessMitigationPolicy(MitigationPolicy: DWORD, lpBuffer: LPVOID, dwLength: LPVOID): BOOL {
    return Kernel32.Load('SetProcessMitigationPolicy')(MitigationPolicy, lpBuffer, dwLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setprocesspreferreduilanguages
  public static SetProcessPreferredUILanguages(dwFlags: DWORD, pwszLanguagesBuffer: LPWSTR, pulNumLanguages: LPVOID): BOOL {
    return Kernel32.Load('SetProcessPreferredUILanguages')(dwFlags, pwszLanguagesBuffer, pulNumLanguages);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setprocesspriorityboost
  public static SetProcessPriorityBoost(hProcess: HANDLE, bDisablePriorityBoost: BOOL): BOOL {
    return Kernel32.Load('SetProcessPriorityBoost')(hProcess, bDisablePriorityBoost);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setprocessshutdownparameters
  public static SetProcessShutdownParameters(dwLevel: DWORD, dwFlags: DWORD): BOOL {
    return Kernel32.Load('SetProcessShutdownParameters')(dwLevel, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setprocessworkingsetsize
  public static SetProcessWorkingSetSize(hProcess: HANDLE, dwMinimumWorkingSetSize: LPVOID, dwMaximumWorkingSetSize: LPVOID): BOOL {
    return Kernel32.Load('SetProcessWorkingSetSize')(hProcess, dwMinimumWorkingSetSize, dwMaximumWorkingSetSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setprocessworkingsetsizeex
  public static SetProcessWorkingSetSizeEx(hProcess: HANDLE, dwMinimumWorkingSetSize: LPVOID, dwMaximumWorkingSetSize: LPVOID, Flags: DWORD): BOOL {
    return Kernel32.Load('SetProcessWorkingSetSizeEx')(hProcess, dwMinimumWorkingSetSize, dwMaximumWorkingSetSize, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setprotectedpolicy
  public static SetProtectedPolicy(PolicyGuid: LPVOID, PolicyValue: LPVOID, OldPolicyValue: LPVOID): BOOL {
    return Kernel32.Load('SetProtectedPolicy')(PolicyGuid, PolicyValue, OldPolicyValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setsearchpathmode
  public static SetSearchPathMode(Flags: DWORD): BOOL {
    return Kernel32.Load('SetSearchPathMode')(Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processenv/nf-processenv-setstdhandle
  public static SetStdHandle(nStdHandle: DWORD, hHandle: HANDLE): BOOL {
    return Kernel32.Load('SetStdHandle')(nStdHandle, hHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setstdhandleex
  public static SetStdHandleEx(nStdHandle: DWORD, hHandle: HANDLE, phPrevValue: LPVOID): BOOL {
    return Kernel32.Load('SetStdHandleEx')(nStdHandle, hHandle, phPrevValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-setsystemfilecachesize
  public static SetSystemFileCacheSize(MinimumFileCacheSize: LPVOID, MaximumFileCacheSize: LPVOID, Flags: DWORD): BOOL {
    return Kernel32.Load('SetSystemFileCacheSize')(MinimumFileCacheSize, MaximumFileCacheSize, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setsystempowerstate
  public static SetSystemPowerState(fSuspend: BOOL, fForce: BOOL): BOOL {
    return Kernel32.Load('SetSystemPowerState')(fSuspend, fForce);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-setsystemtime
  public static SetSystemTime(lpSystemTime: LPVOID): BOOL {
    return Kernel32.Load('SetSystemTime')(lpSystemTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-setsystemtimeadjustment
  public static SetSystemTimeAdjustment(dwTimeAdjustment: DWORD, bTimeAdjustmentDisabled: BOOL): BOOL {
    return Kernel32.Load('SetSystemTimeAdjustment')(dwTimeAdjustment, bTimeAdjustmentDisabled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-settapeparameters
  public static SetTapeParameters(hDevice: HANDLE, dwOperation: DWORD, lpTapeInformation: LPVOID): DWORD {
    return Kernel32.Load('SetTapeParameters')(hDevice, dwOperation, lpTapeInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-settapeposition
  public static SetTapePosition(hDevice: HANDLE, dwPositionMethod: DWORD, dwPartition: DWORD, dwOffsetLow: DWORD, dwOffsetHigh: DWORD, bImmediate: BOOL): DWORD {
    return Kernel32.Load('SetTapePosition')(hDevice, dwPositionMethod, dwPartition, dwOffsetLow, dwOffsetHigh, bImmediate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setthreadaffinitymask
  public static SetThreadAffinityMask(hThread: HANDLE, dwThreadAffinityMask: LPVOID): LPVOID {
    return Kernel32.Load('SetThreadAffinityMask')(hThread, dwThreadAffinityMask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setthreadcontext
  public static SetThreadContext(hThread: HANDLE, lpContext: LPVOID): BOOL {
    return Kernel32.Load('SetThreadContext')(hThread, lpContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setthreaddescription
  public static SetThreadDescription(hThread: HANDLE, lpThreadDescription: LPWSTR): DWORD {
    return Kernel32.Load('SetThreadDescription')(hThread, lpThreadDescription);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/errhandlingapi/nf-errhandlingapi-setthreaderrormode
  public static SetThreadErrorMode(dwNewMode: DWORD, lpOldMode: LPVOID): BOOL {
    return Kernel32.Load('SetThreadErrorMode')(dwNewMode, lpOldMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setthreadexecutionstate
  public static SetThreadExecutionState(esFlags: DWORD): DWORD {
    return Kernel32.Load('SetThreadExecutionState')(esFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processtopologyapi/nf-processtopologyapi-setthreadgroupaffinity
  public static SetThreadGroupAffinity(hThread: HANDLE, GroupAffinity: LPVOID, PreviousGroupAffinity: LPVOID): BOOL {
    return Kernel32.Load('SetThreadGroupAffinity')(hThread, GroupAffinity, PreviousGroupAffinity);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-setthreadidealprocessor
  public static SetThreadIdealProcessor(hThread: HANDLE, dwIdealProcessor: DWORD): DWORD {
    return Kernel32.Load('SetThreadIdealProcessor')(hThread, dwIdealProcessor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-setthreadidealprocessorex
  public static SetThreadIdealProcessorEx(hThread: HANDLE, lpIdealProcessor: LPVOID, lpPreviousIdealProcessor: LPVOID): BOOL {
    return Kernel32.Load('SetThreadIdealProcessorEx')(hThread, lpIdealProcessor, lpPreviousIdealProcessor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setthreadinformation
  public static SetThreadInformation(hThread: HANDLE, ThreadInformationClass: DWORD, ThreadInformation: LPVOID, ThreadInformationSize: DWORD): BOOL {
    return Kernel32.Load('SetThreadInformation')(hThread, ThreadInformationClass, ThreadInformation, ThreadInformationSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setthreadlocale
  public static SetThreadLocale(Locale: DWORD): BOOL {
    return Kernel32.Load('SetThreadLocale')(Locale);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setthreadpoolstackinformation
  public static SetThreadpoolStackInformation(ptpp: DWORD, ptpsi: LPVOID): BOOL {
    return Kernel32.Load('SetThreadpoolStackInformation')(ptpp, ptpsi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/threadpoolapiset/nf-threadpoolapiset-setthreadpoolthreadmaximum
  public static SetThreadpoolThreadMaximum(ptpp: DWORD, cthrdMost: DWORD): VOID {
    return Kernel32.Load('SetThreadpoolThreadMaximum')(ptpp, cthrdMost);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/threadpoolapiset/nf-threadpoolapiset-setthreadpoolthreadminimum
  public static SetThreadpoolThreadMinimum(ptpp: DWORD, cthrdMic: DWORD): BOOL {
    return Kernel32.Load('SetThreadpoolThreadMinimum')(ptpp, cthrdMic);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/threadpoolapiset/nf-threadpoolapiset-setthreadpooltimer
  public static SetThreadpoolTimer(pti: DWORD, pftDueTime: LPVOID, msPeriod: DWORD, msWindowLength: DWORD): VOID {
    return Kernel32.Load('SetThreadpoolTimer')(pti, pftDueTime, msPeriod, msWindowLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setthreadpooltimerex
  public static SetThreadpoolTimerEx(pti: DWORD, pftDueTime: LPVOID, msPeriod: DWORD, msWindowLength: DWORD): BOOL {
    return Kernel32.Load('SetThreadpoolTimerEx')(pti, pftDueTime, msPeriod, msWindowLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setthreadpoolwait
  public static SetThreadpoolWait(pwa: DWORD, h: HANDLE, pftTimeout: LPVOID): VOID {
    return Kernel32.Load('SetThreadpoolWait')(pwa, h, pftTimeout);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setthreadpoolwaitex
  public static SetThreadpoolWaitEx(pwa: DWORD, h: HANDLE, pftTimeout: LPVOID, Reserved: LPVOID): BOOL {
    return Kernel32.Load('SetThreadpoolWaitEx')(pwa, h, pftTimeout, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setthreadpreferreduilanguages
  public static SetThreadPreferredUILanguages(dwFlags: DWORD, pwszLanguagesBuffer: LPWSTR, pulNumLanguages: LPVOID): BOOL {
    return Kernel32.Load('SetThreadPreferredUILanguages')(dwFlags, pwszLanguagesBuffer, pulNumLanguages);
  }

  // public static SetThreadPreferredUILanguages2(flags: DWORD, languages: LPWSTR, numLanguagesSet: LPVOID, snapshot: LPVOID): BOOL {
  //   return Kernel32.Load('SetThreadPreferredUILanguages2')(flags, languages, numLanguagesSet, snapshot);
  // }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-setthreadpriority
  public static SetThreadPriority(hThread: HANDLE, nPriority: DWORD): BOOL {
    return Kernel32.Load('SetThreadPriority')(hThread, nPriority);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setthreadpriorityboost
  public static SetThreadPriorityBoost(hThread: HANDLE, bDisablePriorityBoost: BOOL): BOOL {
    return Kernel32.Load('SetThreadPriorityBoost')(hThread, bDisablePriorityBoost);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setthreadselectedcpusetmasks
  public static SetThreadSelectedCpuSetMasks(Thread: HANDLE, CpuSetMasks: LPVOID, CpuSetMaskCount: USHORT): BOOL {
    return Kernel32.Load('SetThreadSelectedCpuSetMasks')(Thread, CpuSetMasks, CpuSetMaskCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setthreadselectedcpusets
  public static SetThreadSelectedCpuSets(Thread: HANDLE, CpuSetIds: LPVOID, CpuSetIdCount: DWORD): BOOL {
    return Kernel32.Load('SetThreadSelectedCpuSets')(Thread, CpuSetIds, CpuSetIdCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setthreadstackguarantee
  public static SetThreadStackGuarantee(StackSizeInBytes: LPVOID): BOOL {
    return Kernel32.Load('SetThreadStackGuarantee')(StackSizeInBytes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-setthreaduilanguage
  public static SetThreadUILanguage(LangId: USHORT): USHORT {
    return Kernel32.Load('SetThreadUILanguage')(LangId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-settimerqueuetimer
  public static SetTimerQueueTimer(TimerQueue: HANDLE, Callback: DWORD, Parameter: LPVOID, DueTime: DWORD, Period: DWORD, PreferIo: BOOL): HANDLE {
    return Kernel32.Load('SetTimerQueueTimer')(TimerQueue, Callback, Parameter, DueTime, Period, PreferIo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/timezoneapi/nf-timezoneapi-settimezoneinformation
  public static SetTimeZoneInformation(lpTimeZoneInformation: LPVOID): BOOL {
    return Kernel32.Load('SetTimeZoneInformation')(lpTimeZoneInformation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setumsthreadinformation
  public static SetUmsThreadInformation(UmsThread: LPVOID, UmsThreadInfoClass: DWORD, UmsThreadInformation: LPVOID, UmsThreadInformationLength: DWORD): BOOL {
    return Kernel32.Load('SetUmsThreadInformation')(UmsThread, UmsThreadInfoClass, UmsThreadInformation, UmsThreadInformationLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setunhandledexceptionfilter
  public static SetUnhandledExceptionFilter(lpTopLevelExceptionFilter: DWORD): DWORD {
    return Kernel32.Load('SetUnhandledExceptionFilter')(lpTopLevelExceptionFilter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setupcomm
  public static SetupComm(hFile: HANDLE, dwInQueue: DWORD, dwOutQueue: DWORD): BOOL {
    return Kernel32.Load('SetupComm')(hFile, dwInQueue, dwOutQueue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setusergeoid
  public static SetUserGeoID(GeoId: INT): BOOL {
    return Kernel32.Load('SetUserGeoID')(GeoId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setusergeoname
  public static SetUserGeoName(geoName: LPWSTR): BOOL {
    return Kernel32.Load('SetUserGeoName')(geoName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setvolumelabela
  public static SetVolumeLabelA(lpRootPathName: LPSTR, lpVolumeName: LPSTR): BOOL {
    return Kernel32.Load('SetVolumeLabelA')(lpRootPathName, lpVolumeName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setvolumelabelw
  public static SetVolumeLabelW(lpRootPathName: LPWSTR, lpVolumeName: LPWSTR): BOOL {
    return Kernel32.Load('SetVolumeLabelW')(lpRootPathName, lpVolumeName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setvolumemountpointa
  public static SetVolumeMountPointA(lpszVolumeMountPoint: LPSTR, lpszVolumeName: LPSTR): BOOL {
    return Kernel32.Load('SetVolumeMountPointA')(lpszVolumeMountPoint, lpszVolumeName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setvolumemountpointw
  public static SetVolumeMountPointW(lpszVolumeMountPoint: LPWSTR, lpszVolumeName: LPWSTR): BOOL {
    return Kernel32.Load('SetVolumeMountPointW')(lpszVolumeMountPoint, lpszVolumeName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setwaitabletimer
  public static SetWaitableTimer(hTimer: HANDLE, lpDueTime: LPVOID, lPeriod: INT, pfnCompletionRoutine: DWORD, lpArgToCompletionRoutine: LPVOID, fResume: BOOL): BOOL {
    return Kernel32.Load('SetWaitableTimer')(hTimer, lpDueTime, lPeriod, pfnCompletionRoutine, lpArgToCompletionRoutine, fResume);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setwaitabletimerex
  public static SetWaitableTimerEx(hTimer: HANDLE, lpDueTime: LPVOID, lPeriod: INT, pfnCompletionRoutine: DWORD, lpArgToCompletionRoutine: LPVOID, WakeContext: LPVOID, TolerableDelay: DWORD): BOOL {
    return Kernel32.Load('SetWaitableTimerEx')(hTimer, lpDueTime, lPeriod, pfnCompletionRoutine, lpArgToCompletionRoutine, WakeContext, TolerableDelay);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setxstatefeaturesmask
  public static SetXStateFeaturesMask(Context: LPVOID, FeatureMask: ULONGLONG): BOOL {
    return Kernel32.Load('SetXStateFeaturesMask')(Context, FeatureMask);
  }

  // https://learn.microsoft.com/en-us/windows/console/showconsolecursor
  public static ShowConsoleCursor(hConsoleOutput: HANDLE, bShow: BOOL): INT {
    return Kernel32.Load('ShowConsoleCursor')(hConsoleOutput, bShow);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-signalobjectandwait
  public static SignalObjectAndWait(hObjectToSignal: HANDLE, hObjectToWaitOn: HANDLE, dwMilliseconds: DWORD, bAlertable: BOOL): DWORD {
    return Kernel32.Load('SignalObjectAndWait')(hObjectToSignal, hObjectToWaitOn, dwMilliseconds, bAlertable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-sizeofresource
  public static SizeofResource(hModule: HMODULE, hResInfo: DWORD): DWORD {
    return Kernel32.Load('SizeofResource')(hModule, hResInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-sleep
  public static Sleep(dwMilliseconds: DWORD): VOID {
    return Kernel32.Load('Sleep')(dwMilliseconds);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-sleepconditionvariablecs
  public static SleepConditionVariableCS(ConditionVariable: LPVOID, CriticalSection: LPVOID, dwMilliseconds: DWORD): BOOL {
    return Kernel32.Load('SleepConditionVariableCS')(ConditionVariable, CriticalSection, dwMilliseconds);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-sleepconditionvariablesrw
  public static SleepConditionVariableSRW(ConditionVariable: LPVOID, SRWLock: LPVOID, dwMilliseconds: DWORD, Flags: DWORD): BOOL {
    return Kernel32.Load('SleepConditionVariableSRW')(ConditionVariable, SRWLock, dwMilliseconds, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-sleepex
  public static SleepEx(dwMilliseconds: DWORD, bAlertable: BOOL): DWORD {
    return Kernel32.Load('SleepEx')(dwMilliseconds, bAlertable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/threadpoolapiset/nf-threadpoolapiset-startthreadpoolio
  public static StartThreadpoolIo(pio: DWORD): VOID {
    return Kernel32.Load('StartThreadpoolIo')(pio);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-submitthreadpoolwork
  public static SubmitThreadpoolWork(pwk: DWORD): VOID {
    return Kernel32.Load('SubmitThreadpoolWork')(pwk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-suspendthread
  public static SuspendThread(hThread: HANDLE): DWORD {
    return Kernel32.Load('SuspendThread')(hThread);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-switchtofiber
  public static SwitchToFiber(lpFiber: LPVOID): VOID {
    return Kernel32.Load('SwitchToFiber')(lpFiber);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-switchtothread
  public static SwitchToThread(): BOOL {
    return Kernel32.Load('SwitchToThread')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/sysinfoapi/nf-sysinfoapi-systemtimetofiletime
  public static SystemTimeToFileTime(lpSystemTime: LPVOID, lpFileTime: LPVOID): BOOL {
    return Kernel32.Load('SystemTimeToFileTime')(lpSystemTime, lpFileTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/timezoneapi/nf-timezoneapi-systemtimetotzspecificlocaltime
  public static SystemTimeToTzSpecificLocalTime(lpTimeZoneInformation: LPVOID, lpUniversalTime: LPVOID, lpLocalTime: LPVOID): BOOL {
    return Kernel32.Load('SystemTimeToTzSpecificLocalTime')(lpTimeZoneInformation, lpUniversalTime, lpLocalTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/timezoneapi/nf-timezoneapi-systemtimetotzspecificlocaltimeex
  public static SystemTimeToTzSpecificLocalTimeEx(lpTimeZoneInformation: LPVOID, lpUniversalTime: LPVOID, lpLocalTime: LPVOID): BOOL {
    return Kernel32.Load('SystemTimeToTzSpecificLocalTimeEx')(lpTimeZoneInformation, lpUniversalTime, lpLocalTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/jobapi/nf-jobapi-terminatejobobject
  public static TerminateJobObject(hJob: HANDLE, uExitCode: DWORD): BOOL {
    return Kernel32.Load('TerminateJobObject')(hJob, uExitCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-terminateprocess
  public static TerminateProcess(hProcess: HANDLE, uExitCode: DWORD): BOOL {
    return Kernel32.Load('TerminateProcess')(hProcess, uExitCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-terminatethread
  public static TerminateThread(hThread: HANDLE, dwExitCode: DWORD): BOOL {
    return Kernel32.Load('TerminateThread')(hThread, dwExitCode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-thread32first
  public static Thread32First(hSnapshot: HANDLE, lpte: LPVOID): BOOL {
    return Kernel32.Load('Thread32First')(hSnapshot, lpte);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-thread32next
  public static Thread32Next(hSnapshot: HANDLE, lpte: LPVOID): BOOL {
    return Kernel32.Load('Thread32Next')(hSnapshot, lpte);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-tlsalloc
  public static TlsAlloc(): DWORD {
    return Kernel32.Load('TlsAlloc')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-tlsfree
  public static TlsFree(dwTlsIndex: DWORD): BOOL {
    return Kernel32.Load('TlsFree')(dwTlsIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-tlsgetvalue
  public static TlsGetValue(dwTlsIndex: DWORD): LPVOID {
    return Kernel32.Load('TlsGetValue')(dwTlsIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-tlsgetvalue2
  public static TlsGetValue2(dwTlsIndex: DWORD): LPVOID {
    return Kernel32.Load('TlsGetValue2')(dwTlsIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-tlssetvalue
  public static TlsSetValue(dwTlsIndex: DWORD, lpTlsValue: LPVOID): BOOL {
    return Kernel32.Load('TlsSetValue')(dwTlsIndex, lpTlsValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-toolhelp32readprocessmemory
  public static Toolhelp32ReadProcessMemory(th32ProcessID: DWORD, lpBaseAddress: bigint, lpBuffer: LPVOID, cbRead: bigint, lpNumberOfBytesRead: bigint): BOOL {
    return Kernel32.Load('Toolhelp32ReadProcessMemory')(th32ProcessID, lpBaseAddress, lpBuffer, cbRead, lpNumberOfBytesRead);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-transactnamedpipe
  public static TransactNamedPipe(hNamedPipe: HANDLE, lpInBuffer: LPVOID, nInBufferSize: DWORD, lpOutBuffer: LPVOID, nOutBufferSize: DWORD, lpBytesRead: LPVOID, lpOverlapped: LPVOID): BOOL {
    return Kernel32.Load('TransactNamedPipe')(hNamedPipe, lpInBuffer, nInBufferSize, lpOutBuffer, nOutBufferSize, lpBytesRead, lpOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-transmitcommchar
  public static TransmitCommChar(hFile: HANDLE, cChar: DWORD): BOOL {
    return Kernel32.Load('TransmitCommChar')(hFile, cChar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-tryacquiresrwlockexclusive
  public static TryAcquireSRWLockExclusive(SRWLock: LPVOID): DWORD {
    return Kernel32.Load('TryAcquireSRWLockExclusive')(SRWLock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-tryacquiresrwlockshared
  public static TryAcquireSRWLockShared(SRWLock: LPVOID): DWORD {
    return Kernel32.Load('TryAcquireSRWLockShared')(SRWLock);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-tryentercriticalsection
  public static TryEnterCriticalSection(lpCriticalSection: LPVOID): BOOL {
    return Kernel32.Load('TryEnterCriticalSection')(lpCriticalSection);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-trysubmitthreadpoolcallback
  public static TrySubmitThreadpoolCallback(pfns: DWORD, pv: LPVOID, pcbe: LPVOID): BOOL {
    return Kernel32.Load('TrySubmitThreadpoolCallback')(pfns, pv, pcbe);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/timezoneapi/nf-timezoneapi-tzspecificlocaltimetosystemtime
  public static TzSpecificLocalTimeToSystemTime(lpTimeZoneInformation: LPVOID, lpLocalTime: LPVOID, lpUniversalTime: LPVOID): BOOL {
    return Kernel32.Load('TzSpecificLocalTimeToSystemTime')(lpTimeZoneInformation, lpLocalTime, lpUniversalTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/timezoneapi/nf-timezoneapi-tzspecificlocaltimetosystemtimeex
  public static TzSpecificLocalTimeToSystemTimeEx(lpTimeZoneInformation: LPVOID, lpLocalTime: LPVOID, lpUniversalTime: LPVOID): BOOL {
    return Kernel32.Load('TzSpecificLocalTimeToSystemTimeEx')(lpTimeZoneInformation, lpLocalTime, lpUniversalTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-umsthreadyield
  public static UmsThreadYield(SchedulerParam: LPVOID): BOOL {
    return Kernel32.Load('UmsThreadYield')(SchedulerParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-unhandledexceptionfilter
  public static UnhandledExceptionFilter(ExceptionInfo: LPVOID): INT {
    return Kernel32.Load('UnhandledExceptionFilter')(ExceptionInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-unlockfile
  public static UnlockFile(hFile: HANDLE, dwFileOffsetLow: DWORD, dwFileOffsetHigh: DWORD, nNumberOfBytesToUnlockLow: DWORD, nNumberOfBytesToUnlockHigh: DWORD): BOOL {
    return Kernel32.Load('UnlockFile')(hFile, dwFileOffsetLow, dwFileOffsetHigh, nNumberOfBytesToUnlockLow, nNumberOfBytesToUnlockHigh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-unlockfileex
  public static UnlockFileEx(hFile: HANDLE, dwReserved: DWORD, nNumberOfBytesToUnlockLow: DWORD, nNumberOfBytesToUnlockHigh: DWORD, lpOverlapped: LPVOID): BOOL {
    return Kernel32.Load('UnlockFileEx')(hFile, dwReserved, nNumberOfBytesToUnlockLow, nNumberOfBytesToUnlockHigh, lpOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-unmapviewoffile
  public static UnmapViewOfFile(lpBaseAddress: bigint): BOOL {
    return Kernel32.Load('UnmapViewOfFile')(lpBaseAddress);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-unmapviewoffileex
  public static UnmapViewOfFileEx(BaseAddress: bigint, UnmapFlags: DWORD): BOOL {
    return Kernel32.Load('UnmapViewOfFileEx')(BaseAddress, UnmapFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-unregisterapplicationrecoverycallback
  public static UnregisterApplicationRecoveryCallback(): DWORD {
    return Kernel32.Load('UnregisterApplicationRecoveryCallback')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-unregisterapplicationrestart
  public static UnregisterApplicationRestart(): DWORD {
    return Kernel32.Load('UnregisterApplicationRestart')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-unregisterbadmemorynotification
  public static UnregisterBadMemoryNotification(RegistrationHandle: LPVOID): BOOL {
    return Kernel32.Load('UnregisterBadMemoryNotification')(RegistrationHandle);
  }

  // https://learn.microsoft.com/en-us/windows/console/unregisterconsoleime
  public static UnregisterConsoleIME(): BOOL {
    return Kernel32.Load('UnregisterConsoleIME')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-unregisterwait
  public static UnregisterWait(WaitHandle: HANDLE): BOOL {
    return Kernel32.Load('UnregisterWait')(WaitHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-unregisterwaitex
  public static UnregisterWaitEx(WaitHandle: HANDLE, CompletionEvent: HANDLE): BOOL {
    return Kernel32.Load('UnregisterWaitEx')(WaitHandle, CompletionEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-unregisterwaituntiloobecompleted
  public static UnregisterWaitUntilOOBECompleted(WaitHandle: LPVOID): BOOL {
    return Kernel32.Load('UnregisterWaitUntilOOBECompleted')(WaitHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-updatecalendardayofweek
  public static UpdateCalendarDayOfWeek(lpCalDateTime: LPVOID): BOOL {
    return Kernel32.Load('UpdateCalendarDayOfWeek')(lpCalDateTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-updateprocthreadattribute
  public static UpdateProcThreadAttribute(lpAttributeList: DWORD, dwFlags: DWORD, Attribute: LPVOID, lpValue: LPVOID, cbSize: LPVOID, lpPreviousValue: LPVOID, lpReturnSize: LPVOID): BOOL {
    return Kernel32.Load('UpdateProcThreadAttribute')(lpAttributeList, dwFlags, Attribute, lpValue, cbSize, lpPreviousValue, lpReturnSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-updateresourcea
  public static UpdateResourceA(hUpdate: HANDLE, lpType: LPSTR, lpName: LPSTR, wLanguage: USHORT, lpData: LPVOID, cb: DWORD): BOOL {
    return Kernel32.Load('UpdateResourceA')(hUpdate, lpType, lpName, wLanguage, lpData, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-updateresourcew
  public static UpdateResourceW(hUpdate: HANDLE, lpType: LPWSTR, lpName: LPWSTR, wLanguage: USHORT, lpData: LPVOID, cb: DWORD): BOOL {
    return Kernel32.Load('UpdateResourceW')(hUpdate, lpType, lpName, wLanguage, lpData, cb);
  }

  // https://learn.microsoft.com/en-us/windows/console/vdmconsoleoperation
  public static VDMConsoleOperation(iFunction: DWORD, lpData: LPVOID): BOOL {
    return Kernel32.Load('VDMConsoleOperation')(iFunction, lpData);
  }

  // https://learn.microsoft.com/en-us/windows/console/verifyconsoleiohandle
  public static VerifyConsoleIoHandle(hIoHandle: HANDLE): BOOL {
    return Kernel32.Load('VerifyConsoleIoHandle')(hIoHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-verifyscripts
  public static VerifyScripts(dwFlags: DWORD, lpLocaleScripts: LPWSTR, cchLocaleScripts: INT, lpTestScripts: LPWSTR, cchTestScripts: INT): BOOL {
    return Kernel32.Load('VerifyScripts')(dwFlags, lpLocaleScripts, cchLocaleScripts, lpTestScripts, cchTestScripts);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-verifyversioninfoa
  public static VerifyVersionInfoA(lpVersionInformation: LPVOID, dwTypeMask: DWORD, dwlConditionMask: ULONGLONG): BOOL {
    return Kernel32.Load('VerifyVersionInfoA')(lpVersionInformation, dwTypeMask, dwlConditionMask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-verifyversioninfow
  public static VerifyVersionInfoW(lpVersionInformation: LPVOID, dwTypeMask: DWORD, dwlConditionMask: ULONGLONG): BOOL {
    return Kernel32.Load('VerifyVersionInfoW')(lpVersionInformation, dwTypeMask, dwlConditionMask);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-verlanguagenamea
  public static VerLanguageNameA(wLang: DWORD, szLang: LPSTR, cchLang: DWORD): DWORD {
    return Kernel32.Load('VerLanguageNameA')(wLang, szLang, cchLang);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-verlanguagenamew
  public static VerLanguageNameW(wLang: DWORD, szLang: LPWSTR, cchLang: DWORD): DWORD {
    return Kernel32.Load('VerLanguageNameW')(wLang, szLang, cchLang);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-versetconditionmask
  public static VerSetConditionMask(ConditionMask: ULONGLONG, TypeMask: DWORD, Condition: LPVOID): ULONGLONG {
    return Kernel32.Load('VerSetConditionMask')(ConditionMask, TypeMask, Condition);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-virtualalloc
  public static VirtualAlloc(lpAddress: bigint, dwSize: bigint, flAllocationType: DWORD, flProtect: DWORD): bigint {
    return Kernel32.Load('VirtualAlloc')(lpAddress, dwSize, flAllocationType, flProtect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-virtualallocex
  public static VirtualAllocEx(hProcess: HANDLE, lpAddress: bigint, dwSize: bigint, flAllocationType: DWORD, flProtect: DWORD): bigint {
    return Kernel32.Load('VirtualAllocEx')(hProcess, lpAddress, dwSize, flAllocationType, flProtect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-virtualallocexnuma
  public static VirtualAllocExNuma(hProcess: HANDLE, lpAddress: bigint, dwSize: bigint, flAllocationType: DWORD, flProtect: DWORD, nndPreferred: DWORD): bigint {
    return Kernel32.Load('VirtualAllocExNuma')(hProcess, lpAddress, dwSize, flAllocationType, flProtect, nndPreferred);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-virtualfree
  public static VirtualFree(lpAddress: bigint, dwSize: bigint, dwFreeType: DWORD): BOOL {
    return Kernel32.Load('VirtualFree')(lpAddress, dwSize, dwFreeType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-virtualfreeex
  public static VirtualFreeEx(hProcess: HANDLE, lpAddress: bigint, dwSize: bigint, dwFreeType: DWORD): BOOL {
    return Kernel32.Load('VirtualFreeEx')(hProcess, lpAddress, dwSize, dwFreeType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-virtuallock
  public static VirtualLock(lpAddress: bigint, dwSize: bigint): BOOL {
    return Kernel32.Load('VirtualLock')(lpAddress, dwSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-virtualprotect
  public static VirtualProtect(lpAddress: bigint, dwSize: bigint, flNewProtect: DWORD, lpflOldProtect: LPVOID): BOOL {
    return Kernel32.Load('VirtualProtect')(lpAddress, dwSize, flNewProtect, lpflOldProtect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-virtualprotectex
  public static VirtualProtectEx(hProcess: HANDLE, lpAddress: bigint, dwSize: bigint, flNewProtect: DWORD, lpflOldProtect: LPVOID): BOOL {
    return Kernel32.Load('VirtualProtectEx')(hProcess, lpAddress, dwSize, flNewProtect, lpflOldProtect);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-virtualquery
  public static VirtualQuery(lpAddress: bigint, lpBuffer: LPVOID, dwLength: bigint): bigint {
    return Kernel32.Load('VirtualQuery')(lpAddress, lpBuffer, dwLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-virtualqueryex
  public static VirtualQueryEx(hProcess: HANDLE, lpAddress: bigint, lpBuffer: LPVOID, dwLength: bigint): bigint {
    return Kernel32.Load('VirtualQueryEx')(hProcess, lpAddress, lpBuffer, dwLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-virtualunlock
  public static VirtualUnlock(lpAddress: bigint, dwSize: bigint): BOOL {
    return Kernel32.Load('VirtualUnlock')(lpAddress, dwSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-waitcommevent
  public static WaitCommEvent(hFile: HANDLE, lpEvtMask: LPVOID, lpOverlapped: LPVOID): BOOL {
    return Kernel32.Load('WaitCommEvent')(hFile, lpEvtMask, lpOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-waitfordebugevent
  public static WaitForDebugEvent(lpDebugEvent: LPVOID, dwMilliseconds: DWORD): BOOL {
    return Kernel32.Load('WaitForDebugEvent')(lpDebugEvent, dwMilliseconds);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-waitfordebugeventex
  public static WaitForDebugEventEx(lpDebugEvent: LPVOID, dwMilliseconds: DWORD): BOOL {
    return Kernel32.Load('WaitForDebugEventEx')(lpDebugEvent, dwMilliseconds);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-waitformultipleobjects
  public static WaitForMultipleObjects(nCount: DWORD, lpHandles: LPVOID, bWaitAll: BOOL, dwMilliseconds: DWORD): DWORD {
    return Kernel32.Load('WaitForMultipleObjects')(nCount, lpHandles, bWaitAll, dwMilliseconds);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-waitformultipleobjectsex
  public static WaitForMultipleObjectsEx(nCount: DWORD, lpHandles: LPVOID, bWaitAll: BOOL, dwMilliseconds: DWORD, bAlertable: BOOL): DWORD {
    return Kernel32.Load('WaitForMultipleObjectsEx')(nCount, lpHandles, bWaitAll, dwMilliseconds, bAlertable);
  }
  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-waitforsingleobject
  public static WaitForSingleObject(hHandle: HANDLE, dwMilliseconds: DWORD): DWORD {
    return Kernel32.Load('WaitForSingleObject')(hHandle, dwMilliseconds);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-waitforsingleobjectex
  public static WaitForSingleObjectEx(hHandle: HANDLE, dwMilliseconds: DWORD, bAlertable: BOOL): DWORD {
    return Kernel32.Load('WaitForSingleObjectEx')(hHandle, dwMilliseconds, bAlertable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-waitforthreadpooliocallbacks
  public static WaitForThreadpoolIoCallbacks(pio: DWORD, fCancelPendingCallbacks: BOOL): VOID {
    return Kernel32.Load('WaitForThreadpoolIoCallbacks')(pio, fCancelPendingCallbacks);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-waitforthreadpooltimercallbacks
  public static WaitForThreadpoolTimerCallbacks(pti: DWORD, fCancelPendingCallbacks: BOOL): VOID {
    return Kernel32.Load('WaitForThreadpoolTimerCallbacks')(pti, fCancelPendingCallbacks);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-waitforthreadpoolwaitcallbacks
  public static WaitForThreadpoolWaitCallbacks(pwa: DWORD, fCancelPendingCallbacks: BOOL): VOID {
    return Kernel32.Load('WaitForThreadpoolWaitCallbacks')(pwa, fCancelPendingCallbacks);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-waitforthreadpoolworkcallbacks
  public static WaitForThreadpoolWorkCallbacks(pwk: DWORD, fCancelPendingCallbacks: BOOL): VOID {
    return Kernel32.Load('WaitForThreadpoolWorkCallbacks')(pwk, fCancelPendingCallbacks);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-waitnamedpipea
  public static WaitNamedPipeA(lpNamedPipeName: LPSTR, nTimeOut: DWORD): BOOL {
    return Kernel32.Load('WaitNamedPipeA')(lpNamedPipeName, nTimeOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-waitnamedpipew
  public static WaitNamedPipeW(lpNamedPipeName: LPWSTR, nTimeOut: DWORD): BOOL {
    return Kernel32.Load('WaitNamedPipeW')(lpNamedPipeName, nTimeOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-wakeallconditionvariable
  public static WakeAllConditionVariable(ConditionVariable: LPVOID): VOID {
    return Kernel32.Load('WakeAllConditionVariable')(ConditionVariable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-wakeconditionvariable
  public static WakeConditionVariable(ConditionVariable: LPVOID): VOID {
    return Kernel32.Load('WakeConditionVariable')(ConditionVariable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-wergetflags
  public static WerGetFlags(hProcess: HANDLE, pdwFlags: LPVOID): DWORD {
    return Kernel32.Load('WerGetFlags')(hProcess, pdwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-werregisteradditionalprocess
  public static WerRegisterAdditionalProcess(processId: DWORD, captureExtraInfoForThreadId: DWORD): DWORD {
    return Kernel32.Load('WerRegisterAdditionalProcess')(processId, captureExtraInfoForThreadId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-werregisterapplocaldump
  public static WerRegisterAppLocalDump(localAppDataRelativePath: LPWSTR): DWORD {
    return Kernel32.Load('WerRegisterAppLocalDump')(localAppDataRelativePath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-werregistercustommetadata
  public static WerRegisterCustomMetadata(key: LPWSTR, value: LPWSTR): DWORD {
    return Kernel32.Load('WerRegisterCustomMetadata')(key, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-werregisterexcludedmemoryblock
  public static WerRegisterExcludedMemoryBlock(address: LPVOID, size: DWORD): DWORD {
    return Kernel32.Load('WerRegisterExcludedMemoryBlock')(address, size);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-werregisterfile
  public static WerRegisterFile(pwzFile: LPWSTR, regFileType: DWORD, dwFlags: DWORD): DWORD {
    return Kernel32.Load('WerRegisterFile')(pwzFile, regFileType, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-werregistermemoryblock
  public static WerRegisterMemoryBlock(pvAddress: LPVOID, dwSize: DWORD): DWORD {
    return Kernel32.Load('WerRegisterMemoryBlock')(pvAddress, dwSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-werregisterruntimeexceptionmodule
  public static WerRegisterRuntimeExceptionModule(pwszOutOfProcessCallbackDll: LPWSTR, pContext: LPVOID): DWORD {
    return Kernel32.Load('WerRegisterRuntimeExceptionModule')(pwszOutOfProcessCallbackDll, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-wersetflags
  public static WerSetFlags(dwFlags: DWORD): DWORD {
    return Kernel32.Load('WerSetFlags')(dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-werunregisteradditionalprocess
  public static WerUnregisterAdditionalProcess(processId: DWORD): DWORD {
    return Kernel32.Load('WerUnregisterAdditionalProcess')(processId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-werunregisterapplocaldump
  public static WerUnregisterAppLocalDump(): DWORD {
    return Kernel32.Load('WerUnregisterAppLocalDump')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-werunregistercustommetadata
  public static WerUnregisterCustomMetadata(key: LPWSTR): DWORD {
    return Kernel32.Load('WerUnregisterCustomMetadata')(key);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-werunregisterexcludedmemoryblock
  public static WerUnregisterExcludedMemoryBlock(address: LPVOID): DWORD {
    return Kernel32.Load('WerUnregisterExcludedMemoryBlock')(address);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-werunregisterfile
  public static WerUnregisterFile(pwzFilePath: LPWSTR): DWORD {
    return Kernel32.Load('WerUnregisterFile')(pwzFilePath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-werunregistermemoryblock
  public static WerUnregisterMemoryBlock(pvAddress: LPVOID): DWORD {
    return Kernel32.Load('WerUnregisterMemoryBlock')(pvAddress);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-werunregisterruntimeexceptionmodule
  public static WerUnregisterRuntimeExceptionModule(pwszOutOfProcessCallbackDll: LPWSTR, pContext: LPVOID): DWORD {
    return Kernel32.Load('WerUnregisterRuntimeExceptionModule')(pwszOutOfProcessCallbackDll, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winnls/nf-winnls-widechartomultibyte
  public static WideCharToMultiByte(CodePage: UINT, dwFlags: DWORD, lpWideCharStr: LPCWSTR, cchWideChar: INT, lpMultiByteStr: LPSTR, cbMultiByte: INT, lpDefaultChar: LPCSTR, lpUsedDefaultChar: LPBOOL): INT {
    return Kernel32.Load('WideCharToMultiByte')(CodePage, dwFlags, lpWideCharStr, cchWideChar, lpMultiByteStr, cbMultiByte, lpDefaultChar, lpUsedDefaultChar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-winexec
  public static WinExec(lpCmdLine: LPSTR, uCmdShow: DWORD): DWORD {
    return Kernel32.Load('WinExec')(lpCmdLine, uCmdShow);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wow64apiset/nf-wow64apiset-wow64disablewow64fsredirection
  public static Wow64DisableWow64FsRedirection(OldValue: LPVOID): BOOL {
    return Kernel32.Load('Wow64DisableWow64FsRedirection')(OldValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wow64apiset/nf-wow64apiset-wow64enablewow64fsredirection
  public static Wow64EnableWow64FsRedirection(Wow64FsEnableRedirection: DWORD): DWORD {
    return Kernel32.Load('Wow64EnableWow64FsRedirection')(Wow64FsEnableRedirection);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-wow64getthreadcontext
  public static Wow64GetThreadContext(hThread: HANDLE, lpContext: LPVOID): BOOL {
    return Kernel32.Load('Wow64GetThreadContext')(hThread, lpContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-wow64getthreadselectorentry
  public static Wow64GetThreadSelectorEntry(hThread: HANDLE, dwSelector: DWORD, lpSelectorEntry: LPVOID): BOOL {
    return Kernel32.Load('Wow64GetThreadSelectorEntry')(hThread, dwSelector, lpSelectorEntry);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wow64apiset/nf-wow64apiset-wow64revertwow64fsredirection
  public static Wow64RevertWow64FsRedirection(OlValue: LPVOID): BOOL {
    return Kernel32.Load('Wow64RevertWow64FsRedirection')(OlValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-wow64setthreadcontext
  public static Wow64SetThreadContext(hThread: HANDLE, lpContext: LPVOID): BOOL {
    return Kernel32.Load('Wow64SetThreadContext')(hThread, lpContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-wow64suspendthread
  public static Wow64SuspendThread(hThread: HANDLE): DWORD {
    return Kernel32.Load('Wow64SuspendThread')(hThread);
  }

  // https://learn.microsoft.com/en-us/windows/console/writeconsole
  public static WriteConsoleA(hConsoleOutput: HANDLE, lpBuffer: LPSTR, nNumberOfCharsToWrite: DWORD, lpNumberOfCharsWritten: LPVOID, lpReserved: LPVOID): BOOL {
    return Kernel32.Load('WriteConsoleA')(hConsoleOutput, lpBuffer, nNumberOfCharsToWrite, lpNumberOfCharsWritten, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/console/writeconsoleinput
  public static WriteConsoleInputA(hConsoleInput: HANDLE, lpBuffer: LPVOID, nLength: DWORD, lpNumberOfEventsWritten: LPVOID): BOOL {
    return Kernel32.Load('WriteConsoleInputA')(hConsoleInput, lpBuffer, nLength, lpNumberOfEventsWritten);
  }

  // https://learn.microsoft.com/en-us/windows/console/writeconsoleinputvdm
  public static WriteConsoleInputVDMA(hConsoleInput: HANDLE, lpBuffer: LPVOID, nLength: DWORD, lpNumberOfEventsWritten: LPVOID): BOOL {
    return Kernel32.Load('WriteConsoleInputVDMA')(hConsoleInput, lpBuffer, nLength, lpNumberOfEventsWritten);
  }

  // https://learn.microsoft.com/en-us/windows/console/writeconsoleinputvdm
  public static WriteConsoleInputVDMW(hConsoleInput: HANDLE, lpBuffer: LPVOID, nLength: DWORD, lpNumberOfEventsWritten: LPVOID): BOOL {
    return Kernel32.Load('WriteConsoleInputVDMW')(hConsoleInput, lpBuffer, nLength, lpNumberOfEventsWritten);
  }

  // https://learn.microsoft.com/en-us/windows/console/writeconsoleinput
  public static WriteConsoleInputW(hConsoleInput: HANDLE, lpBuffer: LPVOID, nLength: DWORD, lpNumberOfEventsWritten: LPVOID): BOOL {
    return Kernel32.Load('WriteConsoleInputW')(hConsoleInput, lpBuffer, nLength, lpNumberOfEventsWritten);
  }

  // https://learn.microsoft.com/en-us/windows/console/writeconsoleoutput
  public static WriteConsoleOutputA(hConsoleOutput: HANDLE, lpBuffer: LPVOID, dwBufferSize: DWORD, dwBufferCoord: DWORD, lpWriteRegion: LPVOID): BOOL {
    return Kernel32.Load('WriteConsoleOutputA')(hConsoleOutput, lpBuffer, dwBufferSize, dwBufferCoord, lpWriteRegion);
  }

  // https://learn.microsoft.com/en-us/windows/console/writeconsoleoutputattribute
  public static WriteConsoleOutputAttribute(hConsoleOutput: HANDLE, lpAttribute: LPVOID, nLength: DWORD, dwWriteCoord: DWORD, lpNumberOfAttrsWritten: LPVOID): BOOL {
    return Kernel32.Load('WriteConsoleOutputAttribute')(hConsoleOutput, lpAttribute, nLength, dwWriteCoord, lpNumberOfAttrsWritten);
  }

  // https://learn.microsoft.com/en-us/windows/console/writeconsoleoutputcharacter
  public static WriteConsoleOutputCharacterA(hConsoleOutput: HANDLE, lpCharacter: LPSTR, nLength: DWORD, dwWriteCoord: DWORD, lpNumberOfCharsWritten: LPVOID): BOOL {
    return Kernel32.Load('WriteConsoleOutputCharacterA')(hConsoleOutput, lpCharacter, nLength, dwWriteCoord, lpNumberOfCharsWritten);
  }

  // https://learn.microsoft.com/en-us/windows/console/writeconsoleoutputcharacter
  public static WriteConsoleOutputCharacterW(hConsoleOutput: HANDLE, lpCharacter: LPWSTR, nLength: DWORD, dwWriteCoord: DWORD, lpNumberOfCharsWritten: LPVOID): BOOL {
    return Kernel32.Load('WriteConsoleOutputCharacterW')(hConsoleOutput, lpCharacter, nLength, dwWriteCoord, lpNumberOfCharsWritten);
  }

  // https://learn.microsoft.com/en-us/windows/console/writeconsoleoutput
  public static WriteConsoleOutputW(hConsoleOutput: HANDLE, lpBuffer: LPVOID, dwBufferSize: DWORD, dwBufferCoord: DWORD, lpWriteRegion: LPVOID): BOOL {
    return Kernel32.Load('WriteConsoleOutputW')(hConsoleOutput, lpBuffer, dwBufferSize, dwBufferCoord, lpWriteRegion);
  }

  // https://learn.microsoft.com/en-us/windows/console/writeconsole
  public static WriteConsoleW(hConsoleOutput: HANDLE, lpBuffer: LPWSTR, nNumberOfCharsToWrite: DWORD, lpNumberOfCharsWritten: LPVOID, lpReserved: LPVOID): BOOL {
    return Kernel32.Load('WriteConsoleW')(hConsoleOutput, lpBuffer, nNumberOfCharsToWrite, lpNumberOfCharsWritten, lpReserved);
  }
  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-writefile
  public static WriteFile(hFile: HANDLE, lpBuffer: LPVOID, nNumberOfBytesToWrite: DWORD, lpNumberOfBytesWritten: LPVOID, lpOverlapped: LPVOID): BOOL {
    return Kernel32.Load('WriteFile')(hFile, lpBuffer, nNumberOfBytesToWrite, lpNumberOfBytesWritten, lpOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-writefileex
  public static WriteFileEx(hFile: HANDLE, lpBuffer: LPVOID, nNumberOfBytesToWrite: DWORD, lpOverlapped: LPVOID, lpCompletionRoutine: DWORD): BOOL {
    return Kernel32.Load('WriteFileEx')(hFile, lpBuffer, nNumberOfBytesToWrite, lpOverlapped, lpCompletionRoutine);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-writefilegather
  public static WriteFileGather(hFile: HANDLE, aSegmentArray: LPVOID, nNumberOfBytesToWrite: DWORD, lpReserved: LPVOID, lpOverlapped: LPVOID): BOOL {
    return Kernel32.Load('WriteFileGather')(hFile, aSegmentArray, nNumberOfBytesToWrite, lpReserved, lpOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-writeprivateprofilesectiona
  public static WritePrivateProfileSectionA(lpAppName: LPSTR, lpString: LPSTR, lpFileName: LPSTR): BOOL {
    return Kernel32.Load('WritePrivateProfileSectionA')(lpAppName, lpString, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-writeprivateprofilesectionw
  public static WritePrivateProfileSectionW(lpAppName: LPWSTR, lpString: LPWSTR, lpFileName: LPWSTR): BOOL {
    return Kernel32.Load('WritePrivateProfileSectionW')(lpAppName, lpString, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-writeprivateprofilestringa
  public static WritePrivateProfileStringA(lpAppName: LPSTR, lpKeyName: LPSTR, lpString: LPSTR, lpFileName: LPSTR): BOOL {
    return Kernel32.Load('WritePrivateProfileStringA')(lpAppName, lpKeyName, lpString, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-writeprivateprofilestringw
  public static WritePrivateProfileStringW(lpAppName: LPWSTR, lpKeyName: LPWSTR, lpString: LPWSTR, lpFileName: LPWSTR): BOOL {
    return Kernel32.Load('WritePrivateProfileStringW')(lpAppName, lpKeyName, lpString, lpFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-writeprivateprofilestructa
  public static WritePrivateProfileStructA(lpszSection: LPSTR, lpszKey: LPSTR, lpStruct: LPVOID, uSizeStruct: DWORD, szFile: LPSTR): BOOL {
    return Kernel32.Load('WritePrivateProfileStructA')(lpszSection, lpszKey, lpStruct, uSizeStruct, szFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-writeprivateprofilestructw
  public static WritePrivateProfileStructW(lpszSection: LPWSTR, lpszKey: LPWSTR, lpStruct: LPVOID, uSizeStruct: DWORD, szFile: LPWSTR): BOOL {
    return Kernel32.Load('WritePrivateProfileStructW')(lpszSection, lpszKey, lpStruct, uSizeStruct, szFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-writeprocessmemory
  public static WriteProcessMemory(hProcess: HANDLE, lpBaseAddress: bigint, lpBuffer: LPVOID, nSize: bigint, lpNumberOfBytesWritten: bigint): BOOL {
    return Kernel32.Load('WriteProcessMemory')(hProcess, lpBaseAddress, lpBuffer, nSize, lpNumberOfBytesWritten);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-writeprofilesectiona
  public static WriteProfileSectionA(lpAppName: LPSTR, lpString: LPSTR): BOOL {
    return Kernel32.Load('WriteProfileSectionA')(lpAppName, lpString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-writeprofilesectionw
  public static WriteProfileSectionW(lpAppName: LPWSTR, lpString: LPWSTR): BOOL {
    return Kernel32.Load('WriteProfileSectionW')(lpAppName, lpString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-writeprofilestringa
  public static WriteProfileStringA(lpAppName: LPSTR, lpKeyName: LPSTR, lpString: LPSTR): BOOL {
    return Kernel32.Load('WriteProfileStringA')(lpAppName, lpKeyName, lpString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-writeprofilestringw
  public static WriteProfileStringW(lpAppName: LPWSTR, lpKeyName: LPWSTR, lpString: LPWSTR): BOOL {
    return Kernel32.Load('WriteProfileStringW')(lpAppName, lpKeyName, lpString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-writetapemark
  public static WriteTapemark(hDevice: HANDLE, dwTapemarkType: DWORD, dwTapemarkCount: DWORD, bImmediate: BOOL): DWORD {
    return Kernel32.Load('WriteTapemark')(hDevice, dwTapemarkType, dwTapemarkCount, bImmediate);
  }

  // https://learn.microsoft.com/en-us/windows/console/wtsgetactiveconsolesessionid
  public static WTSGetActiveConsoleSessionId(): DWORD {
    return Kernel32.Load('WTSGetActiveConsoleSessionId')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-zombifyactctx
  public static ZombifyActCtx(hActCtx: HANDLE): BOOL {
    return Kernel32.Load('ZombifyActCtx')(hActCtx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/stringapiset/nf-stringapiset-lstrcata
  public static lstrcatA(lpString1: LPSTR, lpString2: LPSTR): LPSTR {
    return Kernel32.Load('lstrcatA')(lpString1, lpString2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/stringapiset/nf-stringapiset-lstrcatw
  public static lstrcatW(lpString1: LPWSTR, lpString2: LPWSTR): LPWSTR {
    return Kernel32.Load('lstrcatW')(lpString1, lpString2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/stringapiset/nf-stringapiset-lstrcmpa
  public static lstrcmpA(lpString1: LPSTR, lpString2: LPSTR): INT {
    return Kernel32.Load('lstrcmpA')(lpString1, lpString2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/stringapiset/nf-stringapiset-lstrcmpia
  public static lstrcmpiA(lpString1: LPSTR, lpString2: LPSTR): INT {
    return Kernel32.Load('lstrcmpiA')(lpString1, lpString2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/stringapiset/nf-stringapiset-lstrcmpiw
  public static lstrcmpiW(lpString1: LPWSTR, lpString2: LPWSTR): INT {
    return Kernel32.Load('lstrcmpiW')(lpString1, lpString2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/stringapiset/nf-stringapiset-lstrcmpw
  public static lstrcmpW(lpString1: LPWSTR, lpString2: LPWSTR): INT {
    return Kernel32.Load('lstrcmpW')(lpString1, lpString2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/stringapiset/nf-stringapiset-lstrcpya
  public static lstrcpyA(lpString1: LPSTR, lpString2: LPSTR): LPSTR {
    return Kernel32.Load('lstrcpyA')(lpString1, lpString2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/stringapiset/nf-stringapiset-lstrcpyna
  public static lstrcpynA(lpString1: LPSTR, lpString2: LPSTR, iMaxLength: INT): LPSTR {
    return Kernel32.Load('lstrcpynA')(lpString1, lpString2, iMaxLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/stringapiset/nf-stringapiset-lstrcpynw
  public static lstrcpynW(lpString1: LPWSTR, lpString2: LPWSTR, iMaxLength: INT): LPWSTR {
    return Kernel32.Load('lstrcpynW')(lpString1, lpString2, iMaxLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/stringapiset/nf-stringapiset-lstrcpyw
  public static lstrcpyW(lpString1: LPWSTR, lpString2: LPWSTR): LPWSTR {
    return Kernel32.Load('lstrcpyW')(lpString1, lpString2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/stringapiset/nf-stringapiset-lstrlena
  public static lstrlenA(lpString: LPSTR): INT {
    return Kernel32.Load('lstrlenA')(lpString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/stringapiset/nf-stringapiset-lstrlenw
  public static lstrlenW(lpString: LPWSTR): INT {
    return Kernel32.Load('lstrlenW')(lpString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-uaw_lstrcmpiw
  public static uaw_lstrcmpiW(String1: LPVOID, String2: LPVOID): INT {
    return Kernel32.Load('uaw_lstrcmpiW')(String1, String2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-uaw_lstrcmpw
  public static uaw_lstrcmpW(String1: LPVOID, String2: LPVOID): INT {
    return Kernel32.Load('uaw_lstrcmpW')(String1, String2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-uaw_lstrlenw
  public static uaw_lstrlenW(String: LPVOID): INT {
    return Kernel32.Load('uaw_lstrlenW')(String);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-uaw_wcschr
  public static uaw_wcschr(String: LPVOID, Character: LPVOID): LPVOID {
    return Kernel32.Load('uaw_wcschr')(String, Character);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-uaw_wcscpy
  public static uaw_wcscpy(Destination: LPVOID, Source: LPVOID): LPVOID {
    return Kernel32.Load('uaw_wcscpy')(Destination, Source);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-uaw_wcsicmp
  public static uaw_wcsicmp(String1: LPVOID, String2: LPVOID): INT {
    return Kernel32.Load('uaw_wcsicmp')(String1, String2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-uaw_wcslen
  public static uaw_wcslen(String: LPVOID): LPVOID {
    return Kernel32.Load('uaw_wcslen')(String);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-uaw_wcsrchr
  public static uaw_wcsrchr(String: LPVOID, Character: LPVOID): LPVOID {
    return Kernel32.Load('uaw_wcsrchr')(String, Character);
  }
}

export default Kernel32;
