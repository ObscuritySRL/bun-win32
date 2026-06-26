import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  ACCESS_MASK,
  BOOL,
  CLFS_BLOCK_ALLOCATION,
  CLFS_BLOCK_DEALLOCATION,
  CLFS_CONTAINER_ID,
  CLFS_CONTEXT_MODE,
  CLFS_IOSTATS_CLASS,
  CLFS_LOG_ARCHIVE_CONTEXT,
  CLFS_LOG_ARCHIVE_MODE,
  CLFS_LSN,
  CLFS_MARSHAL,
  CLFS_MGMT_POLICY_TYPE,
  CLFS_PRINT_RECORD_ROUTINE,
  CLFS_READ_CONTEXT,
  CLFS_RECORD_TYPE,
  CLFS_SCAN_MODE,
  DWORD,
  HANDLE,
  LPCWSTR,
  LPOVERLAPPED,
  LPSECURITY_ATTRIBUTES,
  LPVOID,
  LPWSTR,
  NULLABLE,
  OPTIONAL,
  PBYTE,
  PCLFS_ARCHIVE_DESCRIPTOR,
  PCLFS_INFORMATION,
  PCLFS_LOG_ARCHIVE_CONTEXT,
  PCLFS_LSN,
  PCLFS_MGMT_NOTIFICATION,
  PCLFS_MGMT_POLICY,
  PCLFS_RECORD_TYPE,
  PCLFS_SCAN_CONTEXT,
  PCLFS_WRITE_ENTRY,
  PFILE,
  PLOG_MANAGEMENT_CALLBACKS,
  PLONGLONG,
  PLPWSTR,
  PULONG,
  PULONGLONG,
  PVOID,
  PWSTR,
  ULONG,
  USHORT,
} from '../types/Clfsw32';

/**
 * Thin, lazy-loaded FFI bindings for `clfsw32.dll`.
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
 * import Clfsw32 from './structs/Clfsw32';
 *
 * // Lazy: bind on first call
 * const hLog = Clfsw32.CreateLogFile(name.ptr, access, share, null, OPEN_ALWAYS, 0);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Clfsw32.Preload(['CreateLogFile', 'CreateLogMarshallingArea', 'ReserveAndAppendLog']);
 * ```
 */
class Clfsw32 extends Win32 {
  protected static override name = 'clfsw32.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    AddLogContainer: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AddLogContainerSet: { args: [FFIType.u64, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AdvanceLogBase: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AlignReservedLog: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AllocReservedLog: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    CloseAndResetLogFile: { args: [FFIType.u64], returns: FFIType.i32 },
    CreateLogContainerScanContext: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u8, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateLogFile: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    CreateLogMarshallingArea: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    DeleteLogByHandle: { args: [FFIType.u64], returns: FFIType.i32 },
    DeleteLogFile: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DeleteLogMarshallingArea: { args: [FFIType.u64], returns: FFIType.i32 },
    DeregisterManageableLogClient: { args: [FFIType.u64], returns: FFIType.i32 },
    DumpLogRecords: { args: [FFIType.ptr, FFIType.u8, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    FlushLogBuffers: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    FlushLogToLsn: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FreeReservedLog: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetLogContainerName: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetLogFileInformation: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetLogIoStatistics: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetNextLogArchiveExtent: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    HandleLogFull: { args: [FFIType.u64], returns: FFIType.i32 },
    InstallLogPolicy: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    LogTailAdvanceFailure: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    LsnBlockOffset: { args: [FFIType.ptr], returns: FFIType.u32 },
    LsnContainer: { args: [FFIType.ptr], returns: FFIType.u32 },
    LsnCreate: { args: [FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    LsnRecordSequence: { args: [FFIType.ptr], returns: FFIType.u32 },
    PrepareLogArchive: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    QueryLogPolicy: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReadLogArchiveMetadata: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReadLogNotification: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReadLogRecord: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReadLogRestartArea: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReadNextLogRecord: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReadPreviousLogRestartArea: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegisterForLogWriteNotification: { args: [FFIType.u64, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    RegisterManageableLogClient: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RemoveLogContainer: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    RemoveLogContainerSet: { args: [FFIType.u64, FFIType.u16, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    RemoveLogPolicy: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    ReserveAndAppendLog: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReserveAndAppendLogAligned: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ScanLogContainers: { args: [FFIType.ptr, FFIType.u8, FFIType.ptr], returns: FFIType.i32 },
    SetEndOfLog: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetLogArchiveMode: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SetLogArchiveTail: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetLogFileSizeWithPolicy: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    TerminateLogArchive: { args: [FFIType.u64], returns: FFIType.i32 },
    TerminateReadLog: { args: [FFIType.u64], returns: FFIType.i32 },
    TruncateLog: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ValidateLog: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WriteLogRestartArea: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-addlogcontainer
  public static AddLogContainer(hLog: HANDLE, pcbContainer: OPTIONAL<PULONGLONG>, pwszContainerPath: LPWSTR, pReserved_in_out: OPTIONAL<LPVOID>): BOOL {
    return Clfsw32.Load('AddLogContainer')(hLog, pcbContainer, pwszContainerPath, pReserved_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-addlogcontainerset
  public static AddLogContainerSet(hLog: HANDLE, cContainer: USHORT, pcbContainer: OPTIONAL<PULONGLONG>, rgwszContainerPath: PLPWSTR, pReserved_in_out: OPTIONAL<LPVOID>): BOOL {
    return Clfsw32.Load('AddLogContainerSet')(hLog, cContainer, pcbContainer, rgwszContainerPath, pReserved_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-advancelogbase
  public static AdvanceLogBase(pvMarshal_in_out: CLFS_MARSHAL, plsnBase: PCLFS_LSN, fFlags: ULONG, pOverlapped_in_out: OPTIONAL<LPOVERLAPPED>): BOOL {
    return Clfsw32.Load('AdvanceLogBase')(pvMarshal_in_out, plsnBase, fFlags, pOverlapped_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-alignreservedlog
  public static AlignReservedLog(pvMarshal_in_out: CLFS_MARSHAL, cReservedRecords: ULONG, rgcbReservation: PLONGLONG, pcbAlignReservation_out: PLONGLONG): BOOL {
    return Clfsw32.Load('AlignReservedLog')(pvMarshal_in_out, cReservedRecords, rgcbReservation, pcbAlignReservation_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-allocreservedlog
  public static AllocReservedLog(pvMarshal_in_out: CLFS_MARSHAL, cReservedRecords: ULONG, pcbAdjustment_in_out: PLONGLONG): BOOL {
    return Clfsw32.Load('AllocReservedLog')(pvMarshal_in_out, cReservedRecords, pcbAdjustment_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-closeandresetlogfile
  public static CloseAndResetLogFile(hLog: HANDLE): BOOL {
    return Clfsw32.Load('CloseAndResetLogFile')(hLog);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-createlogcontainerscancontext
  public static CreateLogContainerScanContext(hLog: HANDLE, cFromContainer: ULONG, cContainers: ULONG, eScanMode: CLFS_SCAN_MODE, pcxScan_in_out: PCLFS_SCAN_CONTEXT, pOverlapped_in_out: OPTIONAL<LPOVERLAPPED>): BOOL {
    return Clfsw32.Load('CreateLogContainerScanContext')(hLog, cFromContainer, cContainers, eScanMode, pcxScan_in_out, pOverlapped_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-createlogfile
  public static CreateLogFile(pszLogFileName: LPCWSTR, fDesiredAccess: ACCESS_MASK, dwShareMode: DWORD, psaLogFile: OPTIONAL<LPSECURITY_ATTRIBUTES>, fCreateDisposition: ULONG, fFlagsAndAttributes: ULONG): HANDLE {
    return Clfsw32.Load('CreateLogFile')(pszLogFileName, fDesiredAccess, dwShareMode, psaLogFile, fCreateDisposition, fFlagsAndAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-createlogmarshallingarea
  public static CreateLogMarshallingArea(
    hLog: HANDLE,
    pfnAllocBuffer: OPTIONAL<CLFS_BLOCK_ALLOCATION>,
    pfnFreeBuffer: OPTIONAL<CLFS_BLOCK_DEALLOCATION>,
    pvBlockAllocContext: OPTIONAL<LPVOID>,
    cbMarshallingBuffer: ULONG,
    cMaxWriteBuffers: ULONG,
    cMaxReadBuffers: ULONG,
    ppvMarshal_out: PVOID,
  ): BOOL {
    return Clfsw32.Load('CreateLogMarshallingArea')(hLog, pfnAllocBuffer, pfnFreeBuffer, pvBlockAllocContext, cbMarshallingBuffer, cMaxWriteBuffers, cMaxReadBuffers, ppvMarshal_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-deletelogbyhandle
  public static DeleteLogByHandle(hLog: HANDLE): BOOL {
    return Clfsw32.Load('DeleteLogByHandle')(hLog);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-deletelogfile
  public static DeleteLogFile(pszLogFileName: LPCWSTR, pvReserved: OPTIONAL<LPVOID>): BOOL {
    return Clfsw32.Load('DeleteLogFile')(pszLogFileName, pvReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-deletelogmarshallingarea
  public static DeleteLogMarshallingArea(pvMarshal: CLFS_MARSHAL): BOOL {
    return Clfsw32.Load('DeleteLogMarshallingArea')(pvMarshal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsmgmtw32/nf-clfsmgmtw32-deregistermanageablelogclient
  public static DeregisterManageableLogClient(hLog: HANDLE): BOOL {
    return Clfsw32.Load('DeregisterManageableLogClient')(hLog);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-dumplogrecords
  public static DumpLogRecords(
    pwszLogFileName: PWSTR,
    fRecordType: CLFS_RECORD_TYPE,
    plsnStart: OPTIONAL<PCLFS_LSN>,
    plsnEnd: OPTIONAL<PCLFS_LSN>,
    pstrmOut: OPTIONAL<PFILE>,
    pfnPrintRecord: OPTIONAL<CLFS_PRINT_RECORD_ROUTINE>,
    pfnAllocBlock: OPTIONAL<CLFS_BLOCK_ALLOCATION>,
    pfnFreeBlock: OPTIONAL<CLFS_BLOCK_DEALLOCATION>,
    pvBlockAllocContext: OPTIONAL<LPVOID>,
    cbBlock: ULONG,
    cMaxBlocks: ULONG,
  ): BOOL {
    return Clfsw32.Load('DumpLogRecords')(pwszLogFileName, fRecordType, plsnStart, plsnEnd, pstrmOut, pfnPrintRecord, pfnAllocBlock, pfnFreeBlock, pvBlockAllocContext, cbBlock, cMaxBlocks);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-flushlogbuffers
  public static FlushLogBuffers(pvMarshal: CLFS_MARSHAL, pOverlapped_in_out: OPTIONAL<LPOVERLAPPED>): BOOL {
    return Clfsw32.Load('FlushLogBuffers')(pvMarshal, pOverlapped_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-flushlogtolsn
  public static FlushLogToLsn(pvMarshalContext: CLFS_MARSHAL, plsnFlush: PCLFS_LSN, plsnLastFlushed_out: OPTIONAL<PCLFS_LSN>, pOverlapped_in_out: OPTIONAL<LPOVERLAPPED>): BOOL {
    return Clfsw32.Load('FlushLogToLsn')(pvMarshalContext, plsnFlush, plsnLastFlushed_out, pOverlapped_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-freereservedlog
  public static FreeReservedLog(pvMarshal_in_out: CLFS_MARSHAL, cReservedRecords: ULONG, pcbAdjustment_in_out: PLONGLONG): BOOL {
    return Clfsw32.Load('FreeReservedLog')(pvMarshal_in_out, cReservedRecords, pcbAdjustment_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-getlogcontainername
  public static GetLogContainerName(hLog: HANDLE, cidLogicalContainer: CLFS_CONTAINER_ID, pwstrContainerName_in_out: LPCWSTR, cLenContainerName: ULONG, pcActualLenContainerName_in_out: OPTIONAL<PULONG>): BOOL {
    return Clfsw32.Load('GetLogContainerName')(hLog, cidLogicalContainer, pwstrContainerName_in_out, cLenContainerName, pcActualLenContainerName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-getlogfileinformation
  public static GetLogFileInformation(hLog: HANDLE, pinfoBuffer_in_out: PCLFS_INFORMATION, cbBuffer_in_out: PULONG): BOOL {
    return Clfsw32.Load('GetLogFileInformation')(hLog, pinfoBuffer_in_out, cbBuffer_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-getlogiostatistics
  public static GetLogIoStatistics(hLog: HANDLE, pvStatsBuffer_in_out: PVOID, cbStatsBuffer: ULONG, eStatsClass: CLFS_IOSTATS_CLASS, pcbStatsWritten_out: OPTIONAL<PULONG>): BOOL {
    return Clfsw32.Load('GetLogIoStatistics')(hLog, pvStatsBuffer_in_out, cbStatsBuffer, eStatsClass, pcbStatsWritten_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-getnextlogarchiveextent
  public static GetNextLogArchiveExtent(pvArchiveContext: CLFS_LOG_ARCHIVE_CONTEXT, rgadExtent_in_out: PCLFS_ARCHIVE_DESCRIPTOR, cDescriptors: ULONG, pcDescriptorsReturned_out: PULONG): BOOL {
    return Clfsw32.Load('GetNextLogArchiveExtent')(pvArchiveContext, rgadExtent_in_out, cDescriptors, pcDescriptorsReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsmgmtw32/nf-clfsmgmtw32-handlelogfull
  public static HandleLogFull(hLog: HANDLE): BOOL {
    return Clfsw32.Load('HandleLogFull')(hLog);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsmgmtw32/nf-clfsmgmtw32-installlogpolicy
  public static InstallLogPolicy(hLog: HANDLE, pPolicy: PCLFS_MGMT_POLICY): BOOL {
    return Clfsw32.Load('InstallLogPolicy')(hLog, pPolicy);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsmgmtw32/nf-clfsmgmtw32-logtailadvancefailure
  public static LogTailAdvanceFailure(hLog: HANDLE, dwReason: DWORD): BOOL {
    return Clfsw32.Load('LogTailAdvanceFailure')(hLog, dwReason);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-lsnblockoffset
  public static LsnBlockOffset(plsn: PCLFS_LSN): ULONG {
    return Clfsw32.Load('LsnBlockOffset')(plsn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-lsncontainer
  public static LsnContainer(plsn: PCLFS_LSN): CLFS_CONTAINER_ID {
    return Clfsw32.Load('LsnContainer')(plsn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-lsncreate
  public static LsnCreate(cidContainer: CLFS_CONTAINER_ID, offBlock: ULONG, cRecord: ULONG): CLFS_LSN {
    return Clfsw32.Load('LsnCreate')(cidContainer, offBlock, cRecord);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-lsnrecordsequence
  public static LsnRecordSequence(plsn: PCLFS_LSN): ULONG {
    return Clfsw32.Load('LsnRecordSequence')(plsn);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-preparelogarchive
  public static PrepareLogArchive(
    hLog: HANDLE,
    pszBaseLogFileName_in_out: PWSTR,
    cLen: ULONG,
    plsnLow: OPTIONAL<PCLFS_LSN>,
    plsnHigh: OPTIONAL<PCLFS_LSN>,
    pcActualLength_out: OPTIONAL<PULONG>,
    poffBaseLogFileData_out: PULONGLONG,
    pcbBaseLogFileLength_out: PULONGLONG,
    plsnBase_out: PCLFS_LSN,
    plsnLast_out: PCLFS_LSN,
    plsnCurrentArchiveTail_out: PCLFS_LSN,
    ppvArchiveContext_out: PCLFS_LOG_ARCHIVE_CONTEXT,
  ): BOOL {
    return Clfsw32.Load('PrepareLogArchive')(
      hLog,
      pszBaseLogFileName_in_out,
      cLen,
      plsnLow,
      plsnHigh,
      pcActualLength_out,
      poffBaseLogFileData_out,
      pcbBaseLogFileLength_out,
      plsnBase_out,
      plsnLast_out,
      plsnCurrentArchiveTail_out,
      ppvArchiveContext_out,
    );
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsmgmtw32/nf-clfsmgmtw32-querylogpolicy
  public static QueryLogPolicy(hLog: HANDLE, ePolicyType: CLFS_MGMT_POLICY_TYPE, pPolicyBuffer_out: PCLFS_MGMT_POLICY, pcbPolicyBuffer_in_out: PULONG): BOOL {
    return Clfsw32.Load('QueryLogPolicy')(hLog, ePolicyType, pPolicyBuffer_out, pcbPolicyBuffer_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-readlogarchivemetadata
  public static ReadLogArchiveMetadata(pvArchiveContext: CLFS_LOG_ARCHIVE_CONTEXT, cbOffset: ULONG, cbBytesToRead: ULONG, pbReadBuffer_in_out: PBYTE, pcbBytesRead_out: PULONG): BOOL {
    return Clfsw32.Load('ReadLogArchiveMetadata')(pvArchiveContext, cbOffset, cbBytesToRead, pbReadBuffer_in_out, pcbBytesRead_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsmgmtw32/nf-clfsmgmtw32-readlognotification
  public static ReadLogNotification(hLog: HANDLE, pNotification_out: PCLFS_MGMT_NOTIFICATION, lpOverlapped: NULLABLE<LPOVERLAPPED>): BOOL {
    return Clfsw32.Load('ReadLogNotification')(hLog, pNotification_out, lpOverlapped);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-readlogrecord
  public static ReadLogRecord(
    pvMarshal: CLFS_MARSHAL,
    plsnFirst: PCLFS_LSN,
    eContextMode: CLFS_CONTEXT_MODE,
    ppvReadBuffer_out: PVOID,
    pcbReadBuffer_out: PULONG,
    peRecordType_out: PCLFS_RECORD_TYPE,
    plsnUndoNext_out: PCLFS_LSN,
    plsnPrevious_out: PCLFS_LSN,
    ppvReadContext_out: PVOID,
    pOverlapped_in_out: OPTIONAL<LPOVERLAPPED>,
  ): BOOL {
    return Clfsw32.Load('ReadLogRecord')(pvMarshal, plsnFirst, eContextMode, ppvReadBuffer_out, pcbReadBuffer_out, peRecordType_out, plsnUndoNext_out, plsnPrevious_out, ppvReadContext_out, pOverlapped_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-readlogrestartarea
  public static ReadLogRestartArea(pvMarshal: CLFS_MARSHAL, ppvRestartBuffer_out: PVOID, pcbRestartBuffer_out: PULONG, plsn_out: PCLFS_LSN, ppvContext_out: PVOID, pOverlapped_in_out: OPTIONAL<LPOVERLAPPED>): BOOL {
    return Clfsw32.Load('ReadLogRestartArea')(pvMarshal, ppvRestartBuffer_out, pcbRestartBuffer_out, plsn_out, ppvContext_out, pOverlapped_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-readnextlogrecord
  public static ReadNextLogRecord(
    pvReadContext_in_out: CLFS_READ_CONTEXT,
    ppvBuffer_out: PVOID,
    pcbBuffer_out: PULONG,
    peRecordType_in_out: PCLFS_RECORD_TYPE,
    plsnUser: OPTIONAL<PCLFS_LSN>,
    plsnUndoNext_out: PCLFS_LSN,
    plsnPrevious_out: PCLFS_LSN,
    plsnRecord_out: PCLFS_LSN,
    pOverlapped_in_out: OPTIONAL<LPOVERLAPPED>,
  ): BOOL {
    return Clfsw32.Load('ReadNextLogRecord')(pvReadContext_in_out, ppvBuffer_out, pcbBuffer_out, peRecordType_in_out, plsnUser, plsnUndoNext_out, plsnPrevious_out, plsnRecord_out, pOverlapped_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-readpreviouslogrestartarea
  public static ReadPreviousLogRestartArea(pvReadContext: CLFS_READ_CONTEXT, ppvRestartBuffer_out: PVOID, pcbRestartBuffer_out: PULONG, plsnRestart_out: PCLFS_LSN, pOverlapped_in_out: OPTIONAL<LPOVERLAPPED>): BOOL {
    return Clfsw32.Load('ReadPreviousLogRestartArea')(pvReadContext, ppvRestartBuffer_out, pcbRestartBuffer_out, plsnRestart_out, pOverlapped_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsmgmtw32/nf-clfsmgmtw32-registerforlogwritenotification
  public static RegisterForLogWriteNotification(hLog: HANDLE, cbThreshold: ULONG, fEnable: BOOL): BOOL {
    return Clfsw32.Load('RegisterForLogWriteNotification')(hLog, cbThreshold, fEnable);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsmgmtw32/nf-clfsmgmtw32-registermanageablelogclient
  public static RegisterManageableLogClient(hLog: HANDLE, pCallbacks: NULLABLE<PLOG_MANAGEMENT_CALLBACKS>): BOOL {
    return Clfsw32.Load('RegisterManageableLogClient')(hLog, pCallbacks);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-removelogcontainer
  public static RemoveLogContainer(hLog: HANDLE, pwszContainerPath: LPWSTR, fForce: BOOL, pReserved_in_out: OPTIONAL<LPVOID>): BOOL {
    return Clfsw32.Load('RemoveLogContainer')(hLog, pwszContainerPath, fForce, pReserved_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-removelogcontainerset
  public static RemoveLogContainerSet(hLog: HANDLE, cContainer: USHORT, rgwszContainerPath: PLPWSTR, fForce: BOOL, pReserved_in_out: OPTIONAL<LPVOID>): BOOL {
    return Clfsw32.Load('RemoveLogContainerSet')(hLog, cContainer, rgwszContainerPath, fForce, pReserved_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsmgmtw32/nf-clfsmgmtw32-removelogpolicy
  public static RemoveLogPolicy(hLog: HANDLE, ePolicyType: CLFS_MGMT_POLICY_TYPE): BOOL {
    return Clfsw32.Load('RemoveLogPolicy')(hLog, ePolicyType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-reserveandappendlog
  public static ReserveAndAppendLog(
    pvMarshal: CLFS_MARSHAL,
    rgWriteEntries: OPTIONAL<PCLFS_WRITE_ENTRY>,
    cWriteEntries: ULONG,
    plsnUndoNext: OPTIONAL<PCLFS_LSN>,
    plsnPrevious: OPTIONAL<PCLFS_LSN>,
    cReserveRecords: ULONG,
    rgcbReservation_in_out: OPTIONAL<PLONGLONG>,
    fFlags: ULONG,
    plsn_out: OPTIONAL<PCLFS_LSN>,
    pOverlapped_in_out: OPTIONAL<LPOVERLAPPED>,
  ): BOOL {
    return Clfsw32.Load('ReserveAndAppendLog')(pvMarshal, rgWriteEntries, cWriteEntries, plsnUndoNext, plsnPrevious, cReserveRecords, rgcbReservation_in_out, fFlags, plsn_out, pOverlapped_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-reserveandappendlogaligned
  public static ReserveAndAppendLogAligned(
    pvMarshal: CLFS_MARSHAL,
    rgWriteEntries: OPTIONAL<PCLFS_WRITE_ENTRY>,
    cWriteEntries: ULONG,
    cbEntryAlignment: ULONG,
    plsnUndoNext: OPTIONAL<PCLFS_LSN>,
    plsnPrevious: OPTIONAL<PCLFS_LSN>,
    cReserveRecords: ULONG,
    rgcbReservation_in_out: OPTIONAL<PLONGLONG>,
    fFlags: ULONG,
    plsn_out: OPTIONAL<PCLFS_LSN>,
    pOverlapped_in_out: OPTIONAL<LPOVERLAPPED>,
  ): BOOL {
    return Clfsw32.Load('ReserveAndAppendLogAligned')(pvMarshal, rgWriteEntries, cWriteEntries, cbEntryAlignment, plsnUndoNext, plsnPrevious, cReserveRecords, rgcbReservation_in_out, fFlags, plsn_out, pOverlapped_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-scanlogcontainers
  public static ScanLogContainers(pcxScan_in_out: PCLFS_SCAN_CONTEXT, eScanMode: CLFS_SCAN_MODE, pReserved_in_out: OPTIONAL<LPVOID>): BOOL {
    return Clfsw32.Load('ScanLogContainers')(pcxScan_in_out, eScanMode, pReserved_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-setendoflog
  public static SetEndOfLog(hLog: HANDLE, plsnEnd: PCLFS_LSN, lpOverlapped_in_out: NULLABLE<LPOVERLAPPED>): BOOL {
    return Clfsw32.Load('SetEndOfLog')(hLog, plsnEnd, lpOverlapped_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-setlogarchivemode
  public static SetLogArchiveMode(hLog: HANDLE, eMode: CLFS_LOG_ARCHIVE_MODE): BOOL {
    return Clfsw32.Load('SetLogArchiveMode')(hLog, eMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-setlogarchivetail
  public static SetLogArchiveTail(hLog: HANDLE, plsnArchiveTail: PCLFS_LSN, pReserved_in_out: OPTIONAL<LPVOID>): BOOL {
    return Clfsw32.Load('SetLogArchiveTail')(hLog, plsnArchiveTail, pReserved_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsmgmtw32/nf-clfsmgmtw32-setlogfilesizewithpolicy
  public static SetLogFileSizeWithPolicy(hLog: HANDLE, pDesiredSize: PULONGLONG, pResultingSize_out: PULONGLONG): BOOL {
    return Clfsw32.Load('SetLogFileSizeWithPolicy')(hLog, pDesiredSize, pResultingSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-terminatelogarchive
  public static TerminateLogArchive(pvArchiveContext: CLFS_LOG_ARCHIVE_CONTEXT): BOOL {
    return Clfsw32.Load('TerminateLogArchive')(pvArchiveContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-terminatereadlog
  public static TerminateReadLog(pvCursorContext: CLFS_READ_CONTEXT): BOOL {
    return Clfsw32.Load('TerminateReadLog')(pvCursorContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-truncatelog
  public static TruncateLog(pvMarshal: CLFS_MARSHAL, plsnEnd: PCLFS_LSN, lpOverlapped_in_out: OPTIONAL<LPOVERLAPPED>): BOOL {
    return Clfsw32.Load('TruncateLog')(pvMarshal, plsnEnd, lpOverlapped_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-validatelog
  public static ValidateLog(pszLogFileName: LPCWSTR, psaLogFile: OPTIONAL<LPSECURITY_ATTRIBUTES>, pinfoBuffer_out: OPTIONAL<PCLFS_INFORMATION>, pcbBuffer_in_out: PULONG): BOOL {
    return Clfsw32.Load('ValidateLog')(pszLogFileName, psaLogFile, pinfoBuffer_out, pcbBuffer_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/clfsw32/nf-clfsw32-writelogrestartarea
  public static WriteLogRestartArea(
    pvMarshal_in_out: CLFS_MARSHAL,
    pvRestartBuffer: PVOID,
    cbRestartBuffer: ULONG,
    plsnBase: OPTIONAL<PCLFS_LSN>,
    fFlags: ULONG,
    pcbWritten_out: OPTIONAL<PULONG>,
    plsnNext_out: OPTIONAL<PCLFS_LSN>,
    pOverlapped_in_out: OPTIONAL<LPOVERLAPPED>,
  ): BOOL {
    return Clfsw32.Load('WriteLogRestartArea')(pvMarshal_in_out, pvRestartBuffer, cbRestartBuffer, plsnBase, fFlags, pcbWritten_out, plsnNext_out, pOverlapped_in_out);
  }
}

export default Clfsw32;
