import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  BOOLEAN,
  DWORD,
  DWORD_PTR,
  FILETIME,
  HANDLE,
  HWND,
  LPCSTR,
  LPCWSTR,
  LPDWORD,
  LPSTR,
  LPWSTR,
  LONG,
  Nullable,
  Optional,
  PDH_HCOUNTER,
  PDH_HLOG,
  PDH_HQUERY,
  PDH_STATUS,
  PLONGLONG,
  PPDH_BROWSE_DLG_CONFIG_A,
  PPDH_BROWSE_DLG_CONFIG_HA,
  PPDH_BROWSE_DLG_CONFIG_HW,
  PPDH_BROWSE_DLG_CONFIG_W,
  PPDH_COUNTER_INFO_A,
  PPDH_COUNTER_INFO_W,
  PPDH_COUNTER_PATH_ELEMENTS_A,
  PPDH_COUNTER_PATH_ELEMENTS_W,
  PPDH_FMT_COUNTERVALUE,
  PPDH_FMT_COUNTERVALUE_ITEM_A,
  PPDH_FMT_COUNTERVALUE_ITEM_W,
  PPDH_HCOUNTER,
  PPDH_HLOG,
  PPDH_HQUERY,
  PPDH_RAW_COUNTER,
  PPDH_RAW_COUNTER_ITEM_A,
  PPDH_RAW_COUNTER_ITEM_W,
  PPDH_RAW_LOG_RECORD,
  PPDH_STATISTICS,
  PPDH_TIME_INFO,
} from '../types/Pdh';

/**
 * Thin, lazy-loaded FFI bindings for `pdh.dll`.
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
 * import Pdh from './structs/Pdh';
 *
 * // Lazy: bind on first call
 * const status = Pdh.PdhOpenQueryW(null, 0n, queryBuf.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Pdh.Preload(['PdhOpenQueryW', 'PdhAddCounterW', 'PdhCollectQueryData']);
 * ```
 */
class Pdh extends Win32 {
  protected static override name = 'pdh.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    PdhAddCounterA: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PdhAddCounterW: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PdhAddEnglishCounterA: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PdhAddEnglishCounterW: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PdhBindInputDataSourceA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhBindInputDataSourceW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhBrowseCountersA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PdhBrowseCountersHA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PdhBrowseCountersHW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PdhBrowseCountersW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PdhCalculateCounterFromRawValue: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhCloseLog: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    PdhCloseQuery: { args: [FFIType.u64], returns: FFIType.i32 },
    PdhCollectQueryData: { args: [FFIType.u64], returns: FFIType.i32 },
    PdhCollectQueryDataEx: { args: [FFIType.u64, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    PdhCollectQueryDataWithTime: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PdhComputeCounterStatistics: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhConnectMachineA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PdhConnectMachineW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PdhEnumLogSetNamesA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhEnumLogSetNamesW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhEnumMachinesA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhEnumMachinesHA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhEnumMachinesHW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhEnumMachinesW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhEnumObjectItemsA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    PdhEnumObjectItemsHA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    PdhEnumObjectItemsHW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    PdhEnumObjectItemsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    PdhEnumObjectsA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    PdhEnumObjectsHA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    PdhEnumObjectsHW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    PdhEnumObjectsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    PdhExpandCounterPathA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhExpandCounterPathW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhExpandWildCardPathA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PdhExpandWildCardPathHA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PdhExpandWildCardPathHW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PdhExpandWildCardPathW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PdhFormatFromRawValue: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhGetCounterInfoA: { args: [FFIType.u64, FFIType.u8, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhGetCounterInfoW: { args: [FFIType.u64, FFIType.u8, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhGetCounterTimeBase: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PdhGetDataSourceTimeRangeA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhGetDataSourceTimeRangeH: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhGetDataSourceTimeRangeW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhGetDefaultPerfCounterA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhGetDefaultPerfCounterHA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhGetDefaultPerfCounterHW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhGetDefaultPerfCounterW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhGetDefaultPerfObjectA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhGetDefaultPerfObjectHA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhGetDefaultPerfObjectHW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhGetDefaultPerfObjectW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhGetDllVersion: { args: [FFIType.ptr], returns: FFIType.i32 },
    PdhGetFormattedCounterArrayA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhGetFormattedCounterArrayW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhGetFormattedCounterValue: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhGetLogFileSize: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PdhGetRawCounterArrayA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhGetRawCounterArrayW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhGetRawCounterValue: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhIsRealTimeQuery: { args: [FFIType.u64], returns: FFIType.i32 },
    PdhLookupPerfIndexByNameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhLookupPerfIndexByNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhLookupPerfNameByIndexA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhLookupPerfNameByIndexW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhMakeCounterPathA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PdhMakeCounterPathW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PdhOpenLogA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhOpenLogW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhOpenQuery: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PdhOpenQueryA: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PdhOpenQueryH: { args: [FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PdhOpenQueryW: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PdhParseCounterPathA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PdhParseCounterPathW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PdhParseInstanceNameA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhParseInstanceNameW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhReadRawLogRecord: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhRemoveCounter: { args: [FFIType.u64], returns: FFIType.i32 },
    PdhSelectDataSourceA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhSelectDataSourceW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PdhSetCounterScaleFactor: { args: [FFIType.u64, FFIType.i32], returns: FFIType.i32 },
    PdhSetDefaultRealTimeDataSource: { args: [FFIType.u32], returns: FFIType.i32 },
    PdhSetQueryTimeRange: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PdhUpdateLogA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PdhUpdateLogFileCatalog: { args: [FFIType.u64], returns: FFIType.i32 },
    PdhUpdateLogW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PdhValidatePathA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PdhValidatePathExA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PdhValidatePathExW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    PdhValidatePathW: { args: [FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhaddcountera
  public static PdhAddCounterA(hQuery: PDH_HQUERY, szFullCounterPath: LPCSTR, dwUserData: DWORD_PTR, phCounter_out: PPDH_HCOUNTER): PDH_STATUS {
    return Pdh.Load('PdhAddCounterA')(hQuery, szFullCounterPath, dwUserData, phCounter_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhaddcounterw
  public static PdhAddCounterW(hQuery: PDH_HQUERY, szFullCounterPath: LPCWSTR, dwUserData: DWORD_PTR, phCounter_out: PPDH_HCOUNTER): PDH_STATUS {
    return Pdh.Load('PdhAddCounterW')(hQuery, szFullCounterPath, dwUserData, phCounter_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhaddenglishcountera
  public static PdhAddEnglishCounterA(hQuery: PDH_HQUERY, szFullCounterPath: LPCSTR, dwUserData: DWORD_PTR, phCounter_out: PPDH_HCOUNTER): PDH_STATUS {
    return Pdh.Load('PdhAddEnglishCounterA')(hQuery, szFullCounterPath, dwUserData, phCounter_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhaddenglishcounterw
  public static PdhAddEnglishCounterW(hQuery: PDH_HQUERY, szFullCounterPath: LPCWSTR, dwUserData: DWORD_PTR, phCounter_out: PPDH_HCOUNTER): PDH_STATUS {
    return Pdh.Load('PdhAddEnglishCounterW')(hQuery, szFullCounterPath, dwUserData, phCounter_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhbindinputdatasourcea
  public static PdhBindInputDataSourceA(phDataSource_out: PPDH_HLOG, LogFileNameList: Optional<LPCSTR>): PDH_STATUS {
    return Pdh.Load('PdhBindInputDataSourceA')(phDataSource_out, LogFileNameList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhbindinputdatasourcew
  public static PdhBindInputDataSourceW(phDataSource_out: PPDH_HLOG, LogFileNameList: Optional<LPCWSTR>): PDH_STATUS {
    return Pdh.Load('PdhBindInputDataSourceW')(phDataSource_out, LogFileNameList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhbrowsecountersa
  public static PdhBrowseCountersA(pBrowseDlgData: PPDH_BROWSE_DLG_CONFIG_A): PDH_STATUS {
    return Pdh.Load('PdhBrowseCountersA')(pBrowseDlgData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhbrowsecountersha
  public static PdhBrowseCountersHA(pBrowseDlgData: PPDH_BROWSE_DLG_CONFIG_HA): PDH_STATUS {
    return Pdh.Load('PdhBrowseCountersHA')(pBrowseDlgData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhbrowsecountershw
  public static PdhBrowseCountersHW(pBrowseDlgData: PPDH_BROWSE_DLG_CONFIG_HW): PDH_STATUS {
    return Pdh.Load('PdhBrowseCountersHW')(pBrowseDlgData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhbrowsecountersw
  public static PdhBrowseCountersW(pBrowseDlgData: PPDH_BROWSE_DLG_CONFIG_W): PDH_STATUS {
    return Pdh.Load('PdhBrowseCountersW')(pBrowseDlgData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhcalculatecounterfromrawvalue
  public static PdhCalculateCounterFromRawValue(hCounter: PDH_HCOUNTER, dwFormat: DWORD, rawValue1: PPDH_RAW_COUNTER, rawValue2: Nullable<PPDH_RAW_COUNTER>, fmtValue_out: PPDH_FMT_COUNTERVALUE): PDH_STATUS {
    return Pdh.Load('PdhCalculateCounterFromRawValue')(hCounter, dwFormat, rawValue1, rawValue2, fmtValue_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhcloselog
  public static PdhCloseLog(hLog: PDH_HLOG, dwFlags: DWORD): PDH_STATUS {
    return Pdh.Load('PdhCloseLog')(hLog, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhclosequery
  public static PdhCloseQuery(hQuery_in_out: PDH_HQUERY): PDH_STATUS {
    return Pdh.Load('PdhCloseQuery')(hQuery_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhcollectquerydata
  public static PdhCollectQueryData(hQuery_in_out: PDH_HQUERY): PDH_STATUS {
    return Pdh.Load('PdhCollectQueryData')(hQuery_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhcollectquerydataex
  public static PdhCollectQueryDataEx(hQuery: PDH_HQUERY, dwIntervalTime: DWORD, hNewDataEvent: HANDLE): PDH_STATUS {
    return Pdh.Load('PdhCollectQueryDataEx')(hQuery, dwIntervalTime, hNewDataEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhcollectquerydatawithtime
  public static PdhCollectQueryDataWithTime(hQuery_in_out: PDH_HQUERY, pllTimeStamp_out: PLONGLONG): PDH_STATUS {
    return Pdh.Load('PdhCollectQueryDataWithTime')(hQuery_in_out, pllTimeStamp_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhcomputecounterstatistics
  public static PdhComputeCounterStatistics(hCounter: PDH_HCOUNTER, dwFormat: DWORD, dwFirstEntry: DWORD, dwNumEntries: DWORD, lpRawValueArray: PPDH_RAW_COUNTER, data_out: PPDH_STATISTICS): PDH_STATUS {
    return Pdh.Load('PdhComputeCounterStatistics')(hCounter, dwFormat, dwFirstEntry, dwNumEntries, lpRawValueArray, data_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhconnectmachinea
  public static PdhConnectMachineA(szMachineName: Optional<LPCSTR>): PDH_STATUS {
    return Pdh.Load('PdhConnectMachineA')(szMachineName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhconnectmachinew
  public static PdhConnectMachineW(szMachineName: Optional<LPCWSTR>): PDH_STATUS {
    return Pdh.Load('PdhConnectMachineW')(szMachineName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenumlogsetnamesa
  public static PdhEnumLogSetNamesA(szDataSource: LPCSTR, mszDataSetNameList_out: Optional<LPSTR>, pcchBufferLength_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhEnumLogSetNamesA')(szDataSource, mszDataSetNameList_out, pcchBufferLength_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenumlogsetnamesw
  public static PdhEnumLogSetNamesW(szDataSource: LPCWSTR, mszDataSetNameList_out: Optional<LPWSTR>, pcchBufferLength_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhEnumLogSetNamesW')(szDataSource, mszDataSetNameList_out, pcchBufferLength_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenummachinesa
  public static PdhEnumMachinesA(szDataSource: Optional<LPCSTR>, mszMachineList_out: Optional<LPSTR>, pcchBufferSize_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhEnumMachinesA')(szDataSource, mszMachineList_out, pcchBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenummachinesha
  public static PdhEnumMachinesHA(hDataSource: Optional<PDH_HLOG>, mszMachineList_out: Optional<LPSTR>, pcchBufferSize_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhEnumMachinesHA')(hDataSource, mszMachineList_out, pcchBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenummachineshw
  public static PdhEnumMachinesHW(hDataSource: Optional<PDH_HLOG>, mszMachineList_out: Optional<LPWSTR>, pcchBufferSize_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhEnumMachinesHW')(hDataSource, mszMachineList_out, pcchBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenummachinesw
  public static PdhEnumMachinesW(szDataSource: Optional<LPCWSTR>, mszMachineList_out: Optional<LPWSTR>, pcchBufferSize_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhEnumMachinesW')(szDataSource, mszMachineList_out, pcchBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenumobjectitemsa
  public static PdhEnumObjectItemsA(
    szDataSource: Optional<LPCSTR>,
    szMachineName: Optional<LPCSTR>,
    szObjectName: LPCSTR,
    mszCounterList_out: Optional<LPSTR>,
    pcchCounterListLength_in_out: LPDWORD,
    mszInstanceList_out: Optional<LPSTR>,
    pcchInstanceListLength_in_out: LPDWORD,
    dwDetailLevel: DWORD,
    dwFlags: DWORD,
  ): PDH_STATUS {
    return Pdh.Load('PdhEnumObjectItemsA')(szDataSource, szMachineName, szObjectName, mszCounterList_out, pcchCounterListLength_in_out, mszInstanceList_out, pcchInstanceListLength_in_out, dwDetailLevel, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenumobjectitemsha
  public static PdhEnumObjectItemsHA(
    hDataSource: Optional<PDH_HLOG>,
    szMachineName: Optional<LPCSTR>,
    szObjectName: LPCSTR,
    mszCounterList_out: Optional<LPSTR>,
    pcchCounterListLength_in_out: LPDWORD,
    mszInstanceList_out: Optional<LPSTR>,
    pcchInstanceListLength_in_out: LPDWORD,
    dwDetailLevel: DWORD,
    dwFlags: DWORD,
  ): PDH_STATUS {
    return Pdh.Load('PdhEnumObjectItemsHA')(hDataSource, szMachineName, szObjectName, mszCounterList_out, pcchCounterListLength_in_out, mszInstanceList_out, pcchInstanceListLength_in_out, dwDetailLevel, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenumobjectitemshw
  public static PdhEnumObjectItemsHW(
    hDataSource: Optional<PDH_HLOG>,
    szMachineName: Optional<LPCWSTR>,
    szObjectName: LPCWSTR,
    mszCounterList_out: Optional<LPWSTR>,
    pcchCounterListLength_in_out: LPDWORD,
    mszInstanceList_out: Optional<LPWSTR>,
    pcchInstanceListLength_in_out: LPDWORD,
    dwDetailLevel: DWORD,
    dwFlags: DWORD,
  ): PDH_STATUS {
    return Pdh.Load('PdhEnumObjectItemsHW')(hDataSource, szMachineName, szObjectName, mszCounterList_out, pcchCounterListLength_in_out, mszInstanceList_out, pcchInstanceListLength_in_out, dwDetailLevel, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenumobjectitemsw
  public static PdhEnumObjectItemsW(
    szDataSource: Optional<LPCWSTR>,
    szMachineName: Optional<LPCWSTR>,
    szObjectName: LPCWSTR,
    mszCounterList_out: Optional<LPWSTR>,
    pcchCounterListLength_in_out: LPDWORD,
    mszInstanceList_out: Optional<LPWSTR>,
    pcchInstanceListLength_in_out: LPDWORD,
    dwDetailLevel: DWORD,
    dwFlags: DWORD,
  ): PDH_STATUS {
    return Pdh.Load('PdhEnumObjectItemsW')(szDataSource, szMachineName, szObjectName, mszCounterList_out, pcchCounterListLength_in_out, mszInstanceList_out, pcchInstanceListLength_in_out, dwDetailLevel, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenumobjectsa
  public static PdhEnumObjectsA(szDataSource: Optional<LPCSTR>, szMachineName: Optional<LPCSTR>, mszObjectList_out: Optional<LPSTR>, pcchBufferSize_in_out: LPDWORD, dwDetailLevel: DWORD, bRefresh: BOOL): PDH_STATUS {
    return Pdh.Load('PdhEnumObjectsA')(szDataSource, szMachineName, mszObjectList_out, pcchBufferSize_in_out, dwDetailLevel, bRefresh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenumobjectsha
  public static PdhEnumObjectsHA(hDataSource: Optional<PDH_HLOG>, szMachineName: Optional<LPCSTR>, mszObjectList_out: Optional<LPSTR>, pcchBufferSize_in_out: LPDWORD, dwDetailLevel: DWORD, bRefresh: BOOL): PDH_STATUS {
    return Pdh.Load('PdhEnumObjectsHA')(hDataSource, szMachineName, mszObjectList_out, pcchBufferSize_in_out, dwDetailLevel, bRefresh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenumobjectshw
  public static PdhEnumObjectsHW(hDataSource: Optional<PDH_HLOG>, szMachineName: Optional<LPCWSTR>, mszObjectList_out: Optional<LPWSTR>, pcchBufferSize_in_out: LPDWORD, dwDetailLevel: DWORD, bRefresh: BOOL): PDH_STATUS {
    return Pdh.Load('PdhEnumObjectsHW')(hDataSource, szMachineName, mszObjectList_out, pcchBufferSize_in_out, dwDetailLevel, bRefresh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenumobjectsw
  public static PdhEnumObjectsW(szDataSource: Optional<LPCWSTR>, szMachineName: Optional<LPCWSTR>, mszObjectList_out: Optional<LPWSTR>, pcchBufferSize_in_out: LPDWORD, dwDetailLevel: DWORD, bRefresh: BOOL): PDH_STATUS {
    return Pdh.Load('PdhEnumObjectsW')(szDataSource, szMachineName, mszObjectList_out, pcchBufferSize_in_out, dwDetailLevel, bRefresh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhexpandcounterpatha
  public static PdhExpandCounterPathA(szWildCardPath: LPCSTR, mszExpandedPathList_out: Optional<LPSTR>, pcchPathListLength_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhExpandCounterPathA')(szWildCardPath, mszExpandedPathList_out, pcchPathListLength_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhexpandcounterpathw
  public static PdhExpandCounterPathW(szWildCardPath: LPCWSTR, mszExpandedPathList_out: Optional<LPWSTR>, pcchPathListLength_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhExpandCounterPathW')(szWildCardPath, mszExpandedPathList_out, pcchPathListLength_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhexpandwildcardpatha
  public static PdhExpandWildCardPathA(szDataSource: Optional<LPCSTR>, szWildCardPath: LPCSTR, mszExpandedPathList_out: Optional<LPSTR>, pcchPathListLength_in_out: LPDWORD, dwFlags: DWORD): PDH_STATUS {
    return Pdh.Load('PdhExpandWildCardPathA')(szDataSource, szWildCardPath, mszExpandedPathList_out, pcchPathListLength_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhexpandwildcardpathha
  public static PdhExpandWildCardPathHA(hDataSource: Optional<PDH_HLOG>, szWildCardPath: LPCSTR, mszExpandedPathList_out: Optional<LPSTR>, pcchPathListLength_in_out: LPDWORD, dwFlags: DWORD): PDH_STATUS {
    return Pdh.Load('PdhExpandWildCardPathHA')(hDataSource, szWildCardPath, mszExpandedPathList_out, pcchPathListLength_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhexpandwildcardpathhw
  public static PdhExpandWildCardPathHW(hDataSource: Optional<PDH_HLOG>, szWildCardPath: LPCWSTR, mszExpandedPathList_out: Optional<LPWSTR>, pcchPathListLength_in_out: LPDWORD, dwFlags: DWORD): PDH_STATUS {
    return Pdh.Load('PdhExpandWildCardPathHW')(hDataSource, szWildCardPath, mszExpandedPathList_out, pcchPathListLength_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhexpandwildcardpathw
  public static PdhExpandWildCardPathW(szDataSource: Optional<LPCWSTR>, szWildCardPath: LPCWSTR, mszExpandedPathList_out: Optional<LPWSTR>, pcchPathListLength_in_out: LPDWORD, dwFlags: DWORD): PDH_STATUS {
    return Pdh.Load('PdhExpandWildCardPathW')(szDataSource, szWildCardPath, mszExpandedPathList_out, pcchPathListLength_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhformatfromrawvalue
  public static PdhFormatFromRawValue(dwCounterType: DWORD, dwFormat: DWORD, pTimeBase: Optional<PLONGLONG>, pRawValue1: PPDH_RAW_COUNTER, pRawValue2: Nullable<PPDH_RAW_COUNTER>, pFmtValue_out: PPDH_FMT_COUNTERVALUE): PDH_STATUS {
    return Pdh.Load('PdhFormatFromRawValue')(dwCounterType, dwFormat, pTimeBase, pRawValue1, pRawValue2, pFmtValue_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetcounterinfoa
  public static PdhGetCounterInfoA(hCounter: PDH_HCOUNTER, bRetrieveExplainText: BOOLEAN, pdwBufferSize_in_out: LPDWORD, lpBuffer_out: Optional<PPDH_COUNTER_INFO_A>): PDH_STATUS {
    return Pdh.Load('PdhGetCounterInfoA')(hCounter, bRetrieveExplainText, pdwBufferSize_in_out, lpBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetcounterinfow
  public static PdhGetCounterInfoW(hCounter: PDH_HCOUNTER, bRetrieveExplainText: BOOLEAN, pdwBufferSize_in_out: LPDWORD, lpBuffer_out: Optional<PPDH_COUNTER_INFO_W>): PDH_STATUS {
    return Pdh.Load('PdhGetCounterInfoW')(hCounter, bRetrieveExplainText, pdwBufferSize_in_out, lpBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetcountertimebase
  public static PdhGetCounterTimeBase(hCounter: PDH_HCOUNTER, pTimeBase_out: PLONGLONG): PDH_STATUS {
    return Pdh.Load('PdhGetCounterTimeBase')(hCounter, pTimeBase_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdatasourcetimerangea
  public static PdhGetDataSourceTimeRangeA(szDataSource: Optional<LPCSTR>, pdwNumEntries_out: LPDWORD, pInfo_out: PPDH_TIME_INFO, pdwBufferSize_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDataSourceTimeRangeA')(szDataSource, pdwNumEntries_out, pInfo_out, pdwBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdatasourcetimerangeh
  public static PdhGetDataSourceTimeRangeH(hDataSource_in_out: Optional<PDH_HLOG>, pdwNumEntries_out: LPDWORD, pInfo_out: PPDH_TIME_INFO, pdwBufferSize_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDataSourceTimeRangeH')(hDataSource_in_out, pdwNumEntries_out, pInfo_out, pdwBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdatasourcetimerangew
  public static PdhGetDataSourceTimeRangeW(szDataSource: Optional<LPCWSTR>, pdwNumEntries_out: LPDWORD, pInfo_out: PPDH_TIME_INFO, pdwBufferSize_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDataSourceTimeRangeW')(szDataSource, pdwNumEntries_out, pInfo_out, pdwBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdefaultperfcountera
  public static PdhGetDefaultPerfCounterA(szDataSource: Optional<LPCSTR>, szMachineName: Optional<LPCSTR>, szObjectName: LPCSTR, szDefaultCounterName_out: Optional<LPSTR>, pcchBufferSize_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDefaultPerfCounterA')(szDataSource, szMachineName, szObjectName, szDefaultCounterName_out, pcchBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdefaultperfcounterha
  public static PdhGetDefaultPerfCounterHA(hDataSource: Optional<PDH_HLOG>, szMachineName: Optional<LPCSTR>, szObjectName: LPCSTR, szDefaultCounterName_out: Optional<LPSTR>, pcchBufferSize_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDefaultPerfCounterHA')(hDataSource, szMachineName, szObjectName, szDefaultCounterName_out, pcchBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdefaultperfcounterhw
  public static PdhGetDefaultPerfCounterHW(hDataSource: Optional<PDH_HLOG>, szMachineName: Optional<LPCWSTR>, szObjectName: LPCWSTR, szDefaultCounterName_out: Optional<LPWSTR>, pcchBufferSize_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDefaultPerfCounterHW')(hDataSource, szMachineName, szObjectName, szDefaultCounterName_out, pcchBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdefaultperfcounterw
  public static PdhGetDefaultPerfCounterW(szDataSource: Optional<LPCWSTR>, szMachineName: Optional<LPCWSTR>, szObjectName: LPCWSTR, szDefaultCounterName_out: Optional<LPWSTR>, pcchBufferSize_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDefaultPerfCounterW')(szDataSource, szMachineName, szObjectName, szDefaultCounterName_out, pcchBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdefaultperfobjecta
  public static PdhGetDefaultPerfObjectA(szDataSource: Optional<LPCSTR>, szMachineName: Optional<LPCSTR>, szDefaultObjectName_out: Optional<LPSTR>, pcchBufferSize_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDefaultPerfObjectA')(szDataSource, szMachineName, szDefaultObjectName_out, pcchBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdefaultperfobjectha
  public static PdhGetDefaultPerfObjectHA(hDataSource: Optional<PDH_HLOG>, szMachineName: Optional<LPCSTR>, szDefaultObjectName_out: Optional<LPSTR>, pcchBufferSize_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDefaultPerfObjectHA')(hDataSource, szMachineName, szDefaultObjectName_out, pcchBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdefaultperfobjecthw
  public static PdhGetDefaultPerfObjectHW(hDataSource: Optional<PDH_HLOG>, szMachineName: Optional<LPCWSTR>, szDefaultObjectName_out: Optional<LPWSTR>, pcchBufferSize_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDefaultPerfObjectHW')(hDataSource, szMachineName, szDefaultObjectName_out, pcchBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdefaultperfobjectw
  public static PdhGetDefaultPerfObjectW(szDataSource: Optional<LPCWSTR>, szMachineName: Optional<LPCWSTR>, szDefaultObjectName_out: Optional<LPWSTR>, pcchBufferSize_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDefaultPerfObjectW')(szDataSource, szMachineName, szDefaultObjectName_out, pcchBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdllversion
  public static PdhGetDllVersion(lpdwVersion_out: Optional<LPDWORD>): PDH_STATUS {
    return Pdh.Load('PdhGetDllVersion')(lpdwVersion_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetformattedcounterarraya
  public static PdhGetFormattedCounterArrayA(hCounter: PDH_HCOUNTER, dwFormat: DWORD, lpdwBufferSize_in_out: LPDWORD, lpdwItemCount_out: LPDWORD, ItemBuffer_out: Optional<PPDH_FMT_COUNTERVALUE_ITEM_A>): PDH_STATUS {
    return Pdh.Load('PdhGetFormattedCounterArrayA')(hCounter, dwFormat, lpdwBufferSize_in_out, lpdwItemCount_out, ItemBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetformattedcounterarrayw
  public static PdhGetFormattedCounterArrayW(hCounter: PDH_HCOUNTER, dwFormat: DWORD, lpdwBufferSize_in_out: LPDWORD, lpdwItemCount_out: LPDWORD, ItemBuffer_out: Optional<PPDH_FMT_COUNTERVALUE_ITEM_W>): PDH_STATUS {
    return Pdh.Load('PdhGetFormattedCounterArrayW')(hCounter, dwFormat, lpdwBufferSize_in_out, lpdwItemCount_out, ItemBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetformattedcountervalue
  public static PdhGetFormattedCounterValue(hCounter: PDH_HCOUNTER, dwFormat: DWORD, lpdwType_out: Optional<LPDWORD>, pValue_out: PPDH_FMT_COUNTERVALUE): PDH_STATUS {
    return Pdh.Load('PdhGetFormattedCounterValue')(hCounter, dwFormat, lpdwType_out, pValue_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetlogfilesize
  public static PdhGetLogFileSize(hLog: PDH_HLOG, llSize_out: PLONGLONG): PDH_STATUS {
    return Pdh.Load('PdhGetLogFileSize')(hLog, llSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetrawcounterarraya
  public static PdhGetRawCounterArrayA(hCounter: PDH_HCOUNTER, lpdwBufferSize_in_out: LPDWORD, lpdwItemCount_out: LPDWORD, ItemBuffer_out: Optional<PPDH_RAW_COUNTER_ITEM_A>): PDH_STATUS {
    return Pdh.Load('PdhGetRawCounterArrayA')(hCounter, lpdwBufferSize_in_out, lpdwItemCount_out, ItemBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetrawcounterarrayw
  public static PdhGetRawCounterArrayW(hCounter: PDH_HCOUNTER, lpdwBufferSize_in_out: LPDWORD, lpdwItemCount_out: LPDWORD, ItemBuffer_out: Optional<PPDH_RAW_COUNTER_ITEM_W>): PDH_STATUS {
    return Pdh.Load('PdhGetRawCounterArrayW')(hCounter, lpdwBufferSize_in_out, lpdwItemCount_out, ItemBuffer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetrawcountervalue
  public static PdhGetRawCounterValue(hCounter: PDH_HCOUNTER, lpdwType_out: Optional<LPDWORD>, pValue_out: PPDH_RAW_COUNTER): PDH_STATUS {
    return Pdh.Load('PdhGetRawCounterValue')(hCounter, lpdwType_out, pValue_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhisrealtimequery
  public static PdhIsRealTimeQuery(hQuery: PDH_HQUERY): BOOL {
    return Pdh.Load('PdhIsRealTimeQuery')(hQuery);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhlookupperfindexbynamea
  public static PdhLookupPerfIndexByNameA(szMachineName: Optional<LPCSTR>, szNameBuffer: LPCSTR, pdwIndex_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhLookupPerfIndexByNameA')(szMachineName, szNameBuffer, pdwIndex_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhlookupperfindexbynamew
  public static PdhLookupPerfIndexByNameW(szMachineName: Optional<LPCWSTR>, szNameBuffer: LPCWSTR, pdwIndex_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhLookupPerfIndexByNameW')(szMachineName, szNameBuffer, pdwIndex_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhlookupperfnamebyindexa
  public static PdhLookupPerfNameByIndexA(szMachineName: Optional<LPCSTR>, dwNameIndex: DWORD, szNameBuffer_out: Optional<LPSTR>, pcchNameBufferSize_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhLookupPerfNameByIndexA')(szMachineName, dwNameIndex, szNameBuffer_out, pcchNameBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhlookupperfnamebyindexw
  public static PdhLookupPerfNameByIndexW(szMachineName: Optional<LPCWSTR>, dwNameIndex: DWORD, szNameBuffer_out: Optional<LPWSTR>, pcchNameBufferSize_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhLookupPerfNameByIndexW')(szMachineName, dwNameIndex, szNameBuffer_out, pcchNameBufferSize_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhmakecounterpatha
  public static PdhMakeCounterPathA(pCounterPathElements: PPDH_COUNTER_PATH_ELEMENTS_A, szFullPathBuffer_out: Optional<LPSTR>, pcchBufferSize_in_out: LPDWORD, dwFlags: DWORD): PDH_STATUS {
    return Pdh.Load('PdhMakeCounterPathA')(pCounterPathElements, szFullPathBuffer_out, pcchBufferSize_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhmakecounterpathw
  public static PdhMakeCounterPathW(pCounterPathElements: PPDH_COUNTER_PATH_ELEMENTS_W, szFullPathBuffer_out: Optional<LPWSTR>, pcchBufferSize_in_out: LPDWORD, dwFlags: DWORD): PDH_STATUS {
    return Pdh.Load('PdhMakeCounterPathW')(pCounterPathElements, szFullPathBuffer_out, pcchBufferSize_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhopenloga
  public static PdhOpenLogA(szLogFileName: LPCSTR, dwAccessFlags: DWORD, lpdwLogType_in_out: LPDWORD, hQuery: Optional<PDH_HQUERY>, dwMaxSize: DWORD, szUserCaption: Optional<LPCSTR>, phLog_out: PPDH_HLOG): PDH_STATUS {
    return Pdh.Load('PdhOpenLogA')(szLogFileName, dwAccessFlags, lpdwLogType_in_out, hQuery, dwMaxSize, szUserCaption, phLog_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhopenlogw
  public static PdhOpenLogW(szLogFileName: LPCWSTR, dwAccessFlags: DWORD, lpdwLogType_in_out: LPDWORD, hQuery: Optional<PDH_HQUERY>, dwMaxSize: DWORD, szUserCaption: Optional<LPCWSTR>, phLog_out: PPDH_HLOG): PDH_STATUS {
    return Pdh.Load('PdhOpenLogW')(szLogFileName, dwAccessFlags, lpdwLogType_in_out, hQuery, dwMaxSize, szUserCaption, phLog_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhopenqueryw
  public static PdhOpenQuery(szDataSource: Optional<LPCWSTR>, dwUserData: DWORD_PTR, phQuery_out: PPDH_HQUERY): PDH_STATUS {
    return Pdh.Load('PdhOpenQuery')(szDataSource, dwUserData, phQuery_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhopenquerya
  public static PdhOpenQueryA(szDataSource: Optional<LPCSTR>, dwUserData: DWORD_PTR, phQuery_out: PPDH_HQUERY): PDH_STATUS {
    return Pdh.Load('PdhOpenQueryA')(szDataSource, dwUserData, phQuery_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhopenqueryh
  public static PdhOpenQueryH(hDataSource: Optional<PDH_HLOG>, dwUserData: DWORD_PTR, phQuery_out: PPDH_HQUERY): PDH_STATUS {
    return Pdh.Load('PdhOpenQueryH')(hDataSource, dwUserData, phQuery_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhopenqueryw
  public static PdhOpenQueryW(szDataSource: Optional<LPCWSTR>, dwUserData: DWORD_PTR, phQuery_out: PPDH_HQUERY): PDH_STATUS {
    return Pdh.Load('PdhOpenQueryW')(szDataSource, dwUserData, phQuery_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhparsecounterpatha
  public static PdhParseCounterPathA(szFullPathBuffer: LPCSTR, pCounterPathElements_out: Optional<PPDH_COUNTER_PATH_ELEMENTS_A>, pdwBufferSize_in_out: LPDWORD, dwFlags: DWORD): PDH_STATUS {
    return Pdh.Load('PdhParseCounterPathA')(szFullPathBuffer, pCounterPathElements_out, pdwBufferSize_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhparsecounterpathw
  public static PdhParseCounterPathW(szFullPathBuffer: LPCWSTR, pCounterPathElements_out: Optional<PPDH_COUNTER_PATH_ELEMENTS_W>, pdwBufferSize_in_out: LPDWORD, dwFlags: DWORD): PDH_STATUS {
    return Pdh.Load('PdhParseCounterPathW')(szFullPathBuffer, pCounterPathElements_out, pdwBufferSize_in_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhparseinstancenamea
  public static PdhParseInstanceNameA(
    szInstanceString: LPCSTR,
    szInstanceName_out: Optional<LPSTR>,
    pcchInstanceNameLength_in_out: LPDWORD,
    szParentName_out: Optional<LPSTR>,
    pcchParentNameLength_in_out: LPDWORD,
    lpIndex_out: LPDWORD,
  ): PDH_STATUS {
    return Pdh.Load('PdhParseInstanceNameA')(szInstanceString, szInstanceName_out, pcchInstanceNameLength_in_out, szParentName_out, pcchParentNameLength_in_out, lpIndex_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhparseinstancenamew
  public static PdhParseInstanceNameW(
    szInstanceString: LPCWSTR,
    szInstanceName_out: Optional<LPWSTR>,
    pcchInstanceNameLength_in_out: LPDWORD,
    szParentName_out: Optional<LPWSTR>,
    pcchParentNameLength_in_out: LPDWORD,
    lpIndex_out: LPDWORD,
  ): PDH_STATUS {
    return Pdh.Load('PdhParseInstanceNameW')(szInstanceString, szInstanceName_out, pcchInstanceNameLength_in_out, szParentName_out, pcchParentNameLength_in_out, lpIndex_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhreadrawlogrecord
  public static PdhReadRawLogRecord(hLog: PDH_HLOG, ftRecord: FILETIME, pRawLogRecord_out: Optional<PPDH_RAW_LOG_RECORD>, pdwBufferLength_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhReadRawLogRecord')(hLog, ftRecord, pRawLogRecord_out, pdwBufferLength_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhremovecounter
  public static PdhRemoveCounter(hCounter: PDH_HCOUNTER): PDH_STATUS {
    return Pdh.Load('PdhRemoveCounter')(hCounter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhselectdatasourcea
  public static PdhSelectDataSourceA(hWndOwner: Nullable<HWND>, dwFlags: DWORD, szDataSource_in_out: LPSTR, pcchBufferLength_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhSelectDataSourceA')(hWndOwner, dwFlags, szDataSource_in_out, pcchBufferLength_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhselectdatasourcew
  public static PdhSelectDataSourceW(hWndOwner: Nullable<HWND>, dwFlags: DWORD, szDataSource_in_out: LPWSTR, pcchBufferLength_in_out: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhSelectDataSourceW')(hWndOwner, dwFlags, szDataSource_in_out, pcchBufferLength_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhsetcounterscalefactor
  public static PdhSetCounterScaleFactor(hCounter_in_out: PDH_HCOUNTER, lFactor: LONG): PDH_STATUS {
    return Pdh.Load('PdhSetCounterScaleFactor')(hCounter_in_out, lFactor);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhsetdefaultrealtimedatasource
  public static PdhSetDefaultRealTimeDataSource(dwDataSourceId: DWORD): PDH_STATUS {
    return Pdh.Load('PdhSetDefaultRealTimeDataSource')(dwDataSourceId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhsetquerytimerange
  public static PdhSetQueryTimeRange(hQuery: PDH_HQUERY, pInfo: PPDH_TIME_INFO): PDH_STATUS {
    return Pdh.Load('PdhSetQueryTimeRange')(hQuery, pInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhupdateloga
  public static PdhUpdateLogA(hLog: PDH_HLOG, szUserString: Optional<LPCSTR>): PDH_STATUS {
    return Pdh.Load('PdhUpdateLogA')(hLog, szUserString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhupdatelogfilecatalog
  public static PdhUpdateLogFileCatalog(hLog: PDH_HLOG): PDH_STATUS {
    return Pdh.Load('PdhUpdateLogFileCatalog')(hLog);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhupdatelogw
  public static PdhUpdateLogW(hLog: PDH_HLOG, szUserString: Optional<LPCWSTR>): PDH_STATUS {
    return Pdh.Load('PdhUpdateLogW')(hLog, szUserString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhvalidatepatha
  public static PdhValidatePathA(szFullPathBuffer: LPCSTR): PDH_STATUS {
    return Pdh.Load('PdhValidatePathA')(szFullPathBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhvalidatepathexa
  public static PdhValidatePathExA(hDataSource: Optional<PDH_HLOG>, szFullPathBuffer: LPCSTR): PDH_STATUS {
    return Pdh.Load('PdhValidatePathExA')(hDataSource, szFullPathBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhvalidatepathexw
  public static PdhValidatePathExW(hDataSource: Optional<PDH_HLOG>, szFullPathBuffer: LPCWSTR): PDH_STATUS {
    return Pdh.Load('PdhValidatePathExW')(hDataSource, szFullPathBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhvalidatepathw
  public static PdhValidatePathW(szFullPathBuffer: LPCWSTR): PDH_STATUS {
    return Pdh.Load('PdhValidatePathW')(szFullPathBuffer);
  }
}

export default Pdh;
