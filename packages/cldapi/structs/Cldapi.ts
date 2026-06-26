import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOLEAN,
  CF_CONNECTION_KEY,
  CF_CONNECT_FLAGS,
  CF_CONVERT_FLAGS,
  CF_CREATE_FLAGS,
  CF_HYDRATE_FLAGS,
  CF_IN_SYNC_STATE,
  CF_OPEN_FILE_FLAGS,
  CF_PIN_STATE,
  CF_PLACEHOLDER_INFO_CLASS,
  CF_PLACEHOLDER_RANGE_INFO_CLASS,
  CF_PLACEHOLDER_STATE,
  CF_REGISTER_FLAGS,
  CF_REQUEST_KEY,
  CF_REVERT_FLAGS,
  CF_SET_IN_SYNC_FLAGS,
  CF_SET_PIN_FLAGS,
  CF_SYNC_PROVIDER_STATUS,
  CF_SYNC_ROOT_INFO_CLASS,
  CF_TRANSFER_KEY,
  CF_UPDATE_FLAGS,
  DWORD,
  FILE_INFO_BY_HANDLE_CLASS,
  HANDLE,
  HRESULT,
  LARGE_INTEGER,
  LPCVOID,
  LPCWSTR,
  LPOVERLAPPED,
  OPTIONAL,
  PCF_CALLBACK_REGISTRATION,
  PCF_CONNECTION_KEY,
  PCF_FILE_RANGE,
  PCF_FS_METADATA,
  PCF_OPERATION_INFO,
  PCF_OPERATION_PARAMETERS,
  PCF_PLACEHOLDER_CREATE_INFO,
  PCF_PLATFORM_INFO,
  PCF_SYNC_POLICIES,
  PCF_SYNC_PROVIDER_STATUS,
  PCF_SYNC_REGISTRATION,
  PCF_SYNC_STATUS,
  PCF_TRANSFER_KEY,
  PCORRELATION_VECTOR,
  PDWORD,
  PHANDLE,
  PUSN,
  PVOID,
  PWIN32_FIND_DATAW,
  VOID,
} from '../types/Cldapi';

/**
 * Thin, lazy-loaded FFI bindings for `cldapi.dll`.
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
 * import Cldapi from './structs/Cldapi';
 *
 * // Lazy: bind on first call
 * const platformInfo = Buffer.alloc(12);
 * const hr = Cldapi.CfGetPlatformInfo(platformInfo.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Cldapi.Preload(['CfGetPlatformInfo', 'CfGetSyncRootInfoByPath']);
 * ```
 */
class Cldapi extends Win32 {
  protected static override name = 'cldapi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    CfCloseHandle: { args: [FFIType.u64], returns: FFIType.void },
    CfConnectSyncRoot: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CfConvertToPlaceholder: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CfCreatePlaceholders: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CfDisconnectSyncRoot: { args: [FFIType.u64], returns: FFIType.i32 },
    CfExecute: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CfGetCorrelationVector: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    CfGetPlaceholderInfo: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CfGetPlaceholderRangeInfo: { args: [FFIType.u64, FFIType.u32, FFIType.i64, FFIType.i64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CfGetPlaceholderRangeInfoForHydration: { args: [FFIType.u64, FFIType.u64, FFIType.i64, FFIType.u32, FFIType.i64, FFIType.i64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CfGetPlaceholderStateFromAttributeTag: { args: [FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    CfGetPlaceholderStateFromFileInfo: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    CfGetPlaceholderStateFromFindData: { args: [FFIType.ptr], returns: FFIType.u32 },
    CfGetPlatformInfo: { args: [FFIType.ptr], returns: FFIType.i32 },
    CfGetSyncRootInfoByHandle: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CfGetSyncRootInfoByPath: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CfGetTransferKey: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    CfGetWin32HandleFromProtectedHandle: { args: [FFIType.u64], returns: FFIType.u64 },
    CfHydratePlaceholder: { args: [FFIType.u64, FFIType.i64, FFIType.i64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CfOpenFileWithOplock: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CfQuerySyncProviderStatus: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    CfReferenceProtectedHandle: { args: [FFIType.u64], returns: FFIType.u8 },
    CfRegisterSyncRoot: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CfReleaseProtectedHandle: { args: [FFIType.u64], returns: FFIType.void },
    CfReleaseTransferKey: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.void },
    CfReportProviderProgress: { args: [FFIType.u64, FFIType.u64, FFIType.i64, FFIType.i64], returns: FFIType.i32 },
    CfReportProviderProgress2: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.i64, FFIType.i64, FFIType.u32], returns: FFIType.i32 },
    CfReportSyncStatus: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CfRevertPlaceholder: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CfSetCorrelationVector: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    CfSetInSyncState: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CfSetPinState: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CfUnregisterSyncRoot: { args: [FFIType.ptr], returns: FFIType.i32 },
    CfUpdatePlaceholder: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CfUpdateSyncProviderStatus: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfclosehandle
  public static CfCloseHandle(FileHandle: HANDLE): VOID {
    return Cldapi.Load('CfCloseHandle')(FileHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfconnectsyncroot
  public static CfConnectSyncRoot(SyncRootPath: LPCWSTR, CallbackTable: PCF_CALLBACK_REGISTRATION, CallbackContext: OPTIONAL<LPCVOID>, ConnectFlags: CF_CONNECT_FLAGS, ConnectionKey_out: PCF_CONNECTION_KEY): HRESULT {
    return Cldapi.Load('CfConnectSyncRoot')(SyncRootPath, CallbackTable, CallbackContext, ConnectFlags, ConnectionKey_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfconverttoplaceholder
  public static CfConvertToPlaceholder(FileHandle: HANDLE, FileIdentity: OPTIONAL<LPCVOID>, FileIdentityLength: DWORD, ConvertFlags: CF_CONVERT_FLAGS, ConvertUsn_out: OPTIONAL<PUSN>, Overlapped_in_out: OPTIONAL<LPOVERLAPPED>): HRESULT {
    return Cldapi.Load('CfConvertToPlaceholder')(FileHandle, FileIdentity, FileIdentityLength, ConvertFlags, ConvertUsn_out, Overlapped_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfcreateplaceholders
  public static CfCreatePlaceholders(BaseDirectoryPath: LPCWSTR, PlaceholderArray_in_out: PCF_PLACEHOLDER_CREATE_INFO, PlaceholderCount: DWORD, CreateFlags: CF_CREATE_FLAGS, EntriesProcessed_out: OPTIONAL<PDWORD>): HRESULT {
    return Cldapi.Load('CfCreatePlaceholders')(BaseDirectoryPath, PlaceholderArray_in_out, PlaceholderCount, CreateFlags, EntriesProcessed_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfdisconnectsyncroot
  public static CfDisconnectSyncRoot(ConnectionKey: CF_CONNECTION_KEY): HRESULT {
    return Cldapi.Load('CfDisconnectSyncRoot')(ConnectionKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfexecute
  public static CfExecute(OpInfo: PCF_OPERATION_INFO, OpParams_in_out: PCF_OPERATION_PARAMETERS): HRESULT {
    return Cldapi.Load('CfExecute')(OpInfo, OpParams_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfgetcorrelationvector
  public static CfGetCorrelationVector(FileHandle: HANDLE, CorrelationVector_out: PCORRELATION_VECTOR): HRESULT {
    return Cldapi.Load('CfGetCorrelationVector')(FileHandle, CorrelationVector_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfgetplaceholderinfo
  public static CfGetPlaceholderInfo(FileHandle: HANDLE, InfoClass: CF_PLACEHOLDER_INFO_CLASS, InfoBuffer_out: PVOID, InfoBufferLength: DWORD, ReturnedLength_out: OPTIONAL<PDWORD>): HRESULT {
    return Cldapi.Load('CfGetPlaceholderInfo')(FileHandle, InfoClass, InfoBuffer_out, InfoBufferLength, ReturnedLength_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfgetplaceholderrangeinfo
  public static CfGetPlaceholderRangeInfo(
    FileHandle: HANDLE,
    InfoClass: CF_PLACEHOLDER_RANGE_INFO_CLASS,
    StartingOffset: LARGE_INTEGER,
    Length: LARGE_INTEGER,
    InfoBuffer_out: PVOID,
    InfoBufferLength: DWORD,
    ReturnedLength_out: OPTIONAL<PDWORD>,
  ): HRESULT {
    return Cldapi.Load('CfGetPlaceholderRangeInfo')(FileHandle, InfoClass, StartingOffset, Length, InfoBuffer_out, InfoBufferLength, ReturnedLength_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfgetplaceholderrangeinfoforhydration
  public static CfGetPlaceholderRangeInfoForHydration(
    ConnectionKey: CF_CONNECTION_KEY,
    TransferKey: CF_TRANSFER_KEY,
    FileId: LARGE_INTEGER,
    InfoClass: CF_PLACEHOLDER_RANGE_INFO_CLASS,
    StartingOffset: LARGE_INTEGER,
    RangeLength: LARGE_INTEGER,
    InfoBuffer_out: PVOID,
    InfoBufferSize: DWORD,
    InfoBufferWritten_out: OPTIONAL<PDWORD>,
  ): HRESULT {
    return Cldapi.Load('CfGetPlaceholderRangeInfoForHydration')(ConnectionKey, TransferKey, FileId, InfoClass, StartingOffset, RangeLength, InfoBuffer_out, InfoBufferSize, InfoBufferWritten_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfgetplaceholderstatefromattributetag
  public static CfGetPlaceholderStateFromAttributeTag(FileAttributes: DWORD, ReparseTag: DWORD): CF_PLACEHOLDER_STATE {
    return Cldapi.Load('CfGetPlaceholderStateFromAttributeTag')(FileAttributes, ReparseTag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfgetplaceholderstatefromfileinfo
  public static CfGetPlaceholderStateFromFileInfo(InfoBuffer: LPCVOID, InfoClass: FILE_INFO_BY_HANDLE_CLASS): CF_PLACEHOLDER_STATE {
    return Cldapi.Load('CfGetPlaceholderStateFromFileInfo')(InfoBuffer, InfoClass);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfgetplaceholderstatefromfinddata
  public static CfGetPlaceholderStateFromFindData(FindData: PWIN32_FIND_DATAW): CF_PLACEHOLDER_STATE {
    return Cldapi.Load('CfGetPlaceholderStateFromFindData')(FindData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfgetplatforminfo
  public static CfGetPlatformInfo(PlatformVersion_out: PCF_PLATFORM_INFO): HRESULT {
    return Cldapi.Load('CfGetPlatformInfo')(PlatformVersion_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfgetsyncrootinfobyhandle
  public static CfGetSyncRootInfoByHandle(FileHandle: HANDLE, InfoClass: CF_SYNC_ROOT_INFO_CLASS, InfoBuffer_out: PVOID, InfoBufferLength: DWORD, ReturnedLength_out: OPTIONAL<PDWORD>): HRESULT {
    return Cldapi.Load('CfGetSyncRootInfoByHandle')(FileHandle, InfoClass, InfoBuffer_out, InfoBufferLength, ReturnedLength_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfgetsyncrootinfobypath
  public static CfGetSyncRootInfoByPath(FilePath: LPCWSTR, InfoClass: CF_SYNC_ROOT_INFO_CLASS, InfoBuffer_out: PVOID, InfoBufferLength: DWORD, ReturnedLength_out: OPTIONAL<PDWORD>): HRESULT {
    return Cldapi.Load('CfGetSyncRootInfoByPath')(FilePath, InfoClass, InfoBuffer_out, InfoBufferLength, ReturnedLength_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfgettransferkey
  public static CfGetTransferKey(FileHandle: HANDLE, TransferKey_out: PCF_TRANSFER_KEY): HRESULT {
    return Cldapi.Load('CfGetTransferKey')(FileHandle, TransferKey_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfgetwin32handlefromprotectedhandle
  public static CfGetWin32HandleFromProtectedHandle(ProtectedHandle: HANDLE): HANDLE {
    return Cldapi.Load('CfGetWin32HandleFromProtectedHandle')(ProtectedHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfhydrateplaceholder
  public static CfHydratePlaceholder(FileHandle: HANDLE, StartingOffset: LARGE_INTEGER, Length: LARGE_INTEGER, HydrateFlags: CF_HYDRATE_FLAGS, Overlapped_in_out: OPTIONAL<LPOVERLAPPED>): HRESULT {
    return Cldapi.Load('CfHydratePlaceholder')(FileHandle, StartingOffset, Length, HydrateFlags, Overlapped_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfopenfilewithoplock
  public static CfOpenFileWithOplock(FilePath: LPCWSTR, Flags: CF_OPEN_FILE_FLAGS, ProtectedHandle_out: PHANDLE): HRESULT {
    return Cldapi.Load('CfOpenFileWithOplock')(FilePath, Flags, ProtectedHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfquerysyncproviderstatus
  public static CfQuerySyncProviderStatus(ConnectionKey: CF_CONNECTION_KEY, ProviderStatus_out: PCF_SYNC_PROVIDER_STATUS): HRESULT {
    return Cldapi.Load('CfQuerySyncProviderStatus')(ConnectionKey, ProviderStatus_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfreferenceprotectedhandle
  public static CfReferenceProtectedHandle(ProtectedHandle: HANDLE): BOOLEAN {
    return Cldapi.Load('CfReferenceProtectedHandle')(ProtectedHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfregistersyncroot
  public static CfRegisterSyncRoot(SyncRootPath: LPCWSTR, Registration: PCF_SYNC_REGISTRATION, Policies: PCF_SYNC_POLICIES, RegisterFlags: CF_REGISTER_FLAGS): HRESULT {
    return Cldapi.Load('CfRegisterSyncRoot')(SyncRootPath, Registration, Policies, RegisterFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfreleaseprotectedhandle
  public static CfReleaseProtectedHandle(ProtectedHandle: HANDLE): VOID {
    return Cldapi.Load('CfReleaseProtectedHandle')(ProtectedHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfreleasetransferkey
  public static CfReleaseTransferKey(FileHandle: HANDLE, TransferKey_out: PCF_TRANSFER_KEY): VOID {
    return Cldapi.Load('CfReleaseTransferKey')(FileHandle, TransferKey_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfreportproviderprogress
  public static CfReportProviderProgress(ConnectionKey: CF_CONNECTION_KEY, TransferKey: CF_TRANSFER_KEY, ProviderProgressTotal: LARGE_INTEGER, ProviderProgressCompleted: LARGE_INTEGER): HRESULT {
    return Cldapi.Load('CfReportProviderProgress')(ConnectionKey, TransferKey, ProviderProgressTotal, ProviderProgressCompleted);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfreportproviderprogress2
  public static CfReportProviderProgress2(
    ConnectionKey: CF_CONNECTION_KEY,
    TransferKey: CF_TRANSFER_KEY,
    RequestKey: CF_REQUEST_KEY,
    ProviderProgressTotal: LARGE_INTEGER,
    ProviderProgressCompleted: LARGE_INTEGER,
    TargetSessionId: DWORD,
  ): HRESULT {
    return Cldapi.Load('CfReportProviderProgress2')(ConnectionKey, TransferKey, RequestKey, ProviderProgressTotal, ProviderProgressCompleted, TargetSessionId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfreportsyncstatus
  public static CfReportSyncStatus(SyncRootPath: LPCWSTR, SyncStatus: OPTIONAL<PCF_SYNC_STATUS>): HRESULT {
    return Cldapi.Load('CfReportSyncStatus')(SyncRootPath, SyncStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfrevertplaceholder
  public static CfRevertPlaceholder(FileHandle: HANDLE, RevertFlags: CF_REVERT_FLAGS, Overlapped_in_out: OPTIONAL<LPOVERLAPPED>): HRESULT {
    return Cldapi.Load('CfRevertPlaceholder')(FileHandle, RevertFlags, Overlapped_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfsetcorrelationvector
  public static CfSetCorrelationVector(FileHandle: HANDLE, CorrelationVector: PCORRELATION_VECTOR): HRESULT {
    return Cldapi.Load('CfSetCorrelationVector')(FileHandle, CorrelationVector);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfsetinsyncstate
  public static CfSetInSyncState(FileHandle: HANDLE, InSyncState: CF_IN_SYNC_STATE, InSyncFlags: CF_SET_IN_SYNC_FLAGS, InSyncUsn_in_out: OPTIONAL<PUSN>): HRESULT {
    return Cldapi.Load('CfSetInSyncState')(FileHandle, InSyncState, InSyncFlags, InSyncUsn_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfsetpinstate
  public static CfSetPinState(FileHandle: HANDLE, PinState: CF_PIN_STATE, PinFlags: CF_SET_PIN_FLAGS, Overlapped_in_out: OPTIONAL<LPOVERLAPPED>): HRESULT {
    return Cldapi.Load('CfSetPinState')(FileHandle, PinState, PinFlags, Overlapped_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfunregistersyncroot
  public static CfUnregisterSyncRoot(SyncRootPath: LPCWSTR): HRESULT {
    return Cldapi.Load('CfUnregisterSyncRoot')(SyncRootPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfupdateplaceholder
  public static CfUpdatePlaceholder(
    FileHandle: HANDLE,
    FsMetadata: OPTIONAL<PCF_FS_METADATA>,
    FileIdentity: OPTIONAL<LPCVOID>,
    FileIdentityLength: DWORD,
    DehydrateRangeArray: OPTIONAL<PCF_FILE_RANGE>,
    DehydrateRangeCount: DWORD,
    UpdateFlags: CF_UPDATE_FLAGS,
    UpdateUsn_in_out: OPTIONAL<PUSN>,
    Overlapped_in_out: OPTIONAL<LPOVERLAPPED>,
  ): HRESULT {
    return Cldapi.Load('CfUpdatePlaceholder')(FileHandle, FsMetadata, FileIdentity, FileIdentityLength, DehydrateRangeArray, DehydrateRangeCount, UpdateFlags, UpdateUsn_in_out, Overlapped_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/cfapi/nf-cfapi-cfupdatesyncproviderstatus
  public static CfUpdateSyncProviderStatus(ConnectionKey: CF_CONNECTION_KEY, ProviderStatus: CF_SYNC_PROVIDER_STATUS): HRESULT {
    return Cldapi.Load('CfUpdateSyncProviderStatus')(ConnectionKey, ProviderStatus);
  }
}

export default Cldapi;
