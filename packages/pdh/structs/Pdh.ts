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
  NULL,
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
  public static PdhAddCounterA(hQuery: PDH_HQUERY, szFullCounterPath: LPCSTR, dwUserData: DWORD_PTR, phCounter: PPDH_HCOUNTER): PDH_STATUS {
    return Pdh.Load('PdhAddCounterA')(hQuery, szFullCounterPath, dwUserData, phCounter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhaddcounterw
  public static PdhAddCounterW(hQuery: PDH_HQUERY, szFullCounterPath: LPCWSTR, dwUserData: DWORD_PTR, phCounter: PPDH_HCOUNTER): PDH_STATUS {
    return Pdh.Load('PdhAddCounterW')(hQuery, szFullCounterPath, dwUserData, phCounter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhaddenglishcountera
  public static PdhAddEnglishCounterA(hQuery: PDH_HQUERY, szFullCounterPath: LPCSTR, dwUserData: DWORD_PTR, phCounter: PPDH_HCOUNTER): PDH_STATUS {
    return Pdh.Load('PdhAddEnglishCounterA')(hQuery, szFullCounterPath, dwUserData, phCounter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhaddenglishcounterw
  public static PdhAddEnglishCounterW(hQuery: PDH_HQUERY, szFullCounterPath: LPCWSTR, dwUserData: DWORD_PTR, phCounter: PPDH_HCOUNTER): PDH_STATUS {
    return Pdh.Load('PdhAddEnglishCounterW')(hQuery, szFullCounterPath, dwUserData, phCounter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhbindinputdatasourcea
  public static PdhBindInputDataSourceA(phDataSource: PPDH_HLOG, LogFileNameList: LPCSTR | NULL): PDH_STATUS {
    return Pdh.Load('PdhBindInputDataSourceA')(phDataSource, LogFileNameList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhbindinputdatasourcew
  public static PdhBindInputDataSourceW(phDataSource: PPDH_HLOG, LogFileNameList: LPCWSTR | NULL): PDH_STATUS {
    return Pdh.Load('PdhBindInputDataSourceW')(phDataSource, LogFileNameList);
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
  public static PdhCalculateCounterFromRawValue(hCounter: PDH_HCOUNTER, dwFormat: DWORD, rawValue1: PPDH_RAW_COUNTER, rawValue2: PPDH_RAW_COUNTER | NULL, fmtValue: PPDH_FMT_COUNTERVALUE): PDH_STATUS {
    return Pdh.Load('PdhCalculateCounterFromRawValue')(hCounter, dwFormat, rawValue1, rawValue2, fmtValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhcloselog
  public static PdhCloseLog(hLog: PDH_HLOG, dwFlags: DWORD): PDH_STATUS {
    return Pdh.Load('PdhCloseLog')(hLog, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhclosequery
  public static PdhCloseQuery(hQuery: PDH_HQUERY): PDH_STATUS {
    return Pdh.Load('PdhCloseQuery')(hQuery);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhcollectquerydata
  public static PdhCollectQueryData(hQuery: PDH_HQUERY): PDH_STATUS {
    return Pdh.Load('PdhCollectQueryData')(hQuery);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhcollectquerydataex
  public static PdhCollectQueryDataEx(hQuery: PDH_HQUERY, dwIntervalTime: DWORD, hNewDataEvent: HANDLE): PDH_STATUS {
    return Pdh.Load('PdhCollectQueryDataEx')(hQuery, dwIntervalTime, hNewDataEvent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhcollectquerydatawithtime
  public static PdhCollectQueryDataWithTime(hQuery: PDH_HQUERY, pllTimeStamp: PLONGLONG): PDH_STATUS {
    return Pdh.Load('PdhCollectQueryDataWithTime')(hQuery, pllTimeStamp);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhcomputecounterstatistics
  public static PdhComputeCounterStatistics(hCounter: PDH_HCOUNTER, dwFormat: DWORD, dwFirstEntry: DWORD, dwNumEntries: DWORD, lpRawValueArray: PPDH_RAW_COUNTER, data: PPDH_STATISTICS): PDH_STATUS {
    return Pdh.Load('PdhComputeCounterStatistics')(hCounter, dwFormat, dwFirstEntry, dwNumEntries, lpRawValueArray, data);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhconnectmachinea
  public static PdhConnectMachineA(szMachineName: LPCSTR | NULL): PDH_STATUS {
    return Pdh.Load('PdhConnectMachineA')(szMachineName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhconnectmachinew
  public static PdhConnectMachineW(szMachineName: LPCWSTR | NULL): PDH_STATUS {
    return Pdh.Load('PdhConnectMachineW')(szMachineName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenumlogsetnamesa
  public static PdhEnumLogSetNamesA(szDataSource: LPCSTR, mszDataSetNameList: LPSTR | NULL, pcchBufferLength: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhEnumLogSetNamesA')(szDataSource, mszDataSetNameList, pcchBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenumlogsetnamesw
  public static PdhEnumLogSetNamesW(szDataSource: LPCWSTR, mszDataSetNameList: LPWSTR | NULL, pcchBufferLength: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhEnumLogSetNamesW')(szDataSource, mszDataSetNameList, pcchBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenummachinesa
  public static PdhEnumMachinesA(szDataSource: LPCSTR | NULL, mszMachineList: LPSTR | NULL, pcchBufferSize: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhEnumMachinesA')(szDataSource, mszMachineList, pcchBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenummachinesha
  public static PdhEnumMachinesHA(hDataSource: PDH_HLOG | 0n, mszMachineList: LPSTR | NULL, pcchBufferSize: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhEnumMachinesHA')(hDataSource, mszMachineList, pcchBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenummachineshw
  public static PdhEnumMachinesHW(hDataSource: PDH_HLOG | 0n, mszMachineList: LPWSTR | NULL, pcchBufferSize: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhEnumMachinesHW')(hDataSource, mszMachineList, pcchBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenummachinesw
  public static PdhEnumMachinesW(szDataSource: LPCWSTR | NULL, mszMachineList: LPWSTR | NULL, pcchBufferSize: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhEnumMachinesW')(szDataSource, mszMachineList, pcchBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenumobjectitemsa
  public static PdhEnumObjectItemsA(
    szDataSource: LPCSTR | NULL,
    szMachineName: LPCSTR | NULL,
    szObjectName: LPCSTR,
    mszCounterList: LPSTR | NULL,
    pcchCounterListLength: LPDWORD,
    mszInstanceList: LPSTR | NULL,
    pcchInstanceListLength: LPDWORD,
    dwDetailLevel: DWORD,
    dwFlags: DWORD,
  ): PDH_STATUS {
    return Pdh.Load('PdhEnumObjectItemsA')(szDataSource, szMachineName, szObjectName, mszCounterList, pcchCounterListLength, mszInstanceList, pcchInstanceListLength, dwDetailLevel, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenumobjectitemsha
  public static PdhEnumObjectItemsHA(
    hDataSource: PDH_HLOG | 0n,
    szMachineName: LPCSTR | NULL,
    szObjectName: LPCSTR,
    mszCounterList: LPSTR | NULL,
    pcchCounterListLength: LPDWORD,
    mszInstanceList: LPSTR | NULL,
    pcchInstanceListLength: LPDWORD,
    dwDetailLevel: DWORD,
    dwFlags: DWORD,
  ): PDH_STATUS {
    return Pdh.Load('PdhEnumObjectItemsHA')(hDataSource, szMachineName, szObjectName, mszCounterList, pcchCounterListLength, mszInstanceList, pcchInstanceListLength, dwDetailLevel, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenumobjectitemshw
  public static PdhEnumObjectItemsHW(
    hDataSource: PDH_HLOG | 0n,
    szMachineName: LPCWSTR | NULL,
    szObjectName: LPCWSTR,
    mszCounterList: LPWSTR | NULL,
    pcchCounterListLength: LPDWORD,
    mszInstanceList: LPWSTR | NULL,
    pcchInstanceListLength: LPDWORD,
    dwDetailLevel: DWORD,
    dwFlags: DWORD,
  ): PDH_STATUS {
    return Pdh.Load('PdhEnumObjectItemsHW')(hDataSource, szMachineName, szObjectName, mszCounterList, pcchCounterListLength, mszInstanceList, pcchInstanceListLength, dwDetailLevel, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenumobjectitemsw
  public static PdhEnumObjectItemsW(
    szDataSource: LPCWSTR | NULL,
    szMachineName: LPCWSTR | NULL,
    szObjectName: LPCWSTR,
    mszCounterList: LPWSTR | NULL,
    pcchCounterListLength: LPDWORD,
    mszInstanceList: LPWSTR | NULL,
    pcchInstanceListLength: LPDWORD,
    dwDetailLevel: DWORD,
    dwFlags: DWORD,
  ): PDH_STATUS {
    return Pdh.Load('PdhEnumObjectItemsW')(szDataSource, szMachineName, szObjectName, mszCounterList, pcchCounterListLength, mszInstanceList, pcchInstanceListLength, dwDetailLevel, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenumobjectsa
  public static PdhEnumObjectsA(szDataSource: LPCSTR | NULL, szMachineName: LPCSTR | NULL, mszObjectList: LPSTR | NULL, pcchBufferSize: LPDWORD, dwDetailLevel: DWORD, bRefresh: BOOL): PDH_STATUS {
    return Pdh.Load('PdhEnumObjectsA')(szDataSource, szMachineName, mszObjectList, pcchBufferSize, dwDetailLevel, bRefresh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenumobjectsha
  public static PdhEnumObjectsHA(hDataSource: PDH_HLOG | 0n, szMachineName: LPCSTR | NULL, mszObjectList: LPSTR | NULL, pcchBufferSize: LPDWORD, dwDetailLevel: DWORD, bRefresh: BOOL): PDH_STATUS {
    return Pdh.Load('PdhEnumObjectsHA')(hDataSource, szMachineName, mszObjectList, pcchBufferSize, dwDetailLevel, bRefresh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenumobjectshw
  public static PdhEnumObjectsHW(hDataSource: PDH_HLOG | 0n, szMachineName: LPCWSTR | NULL, mszObjectList: LPWSTR | NULL, pcchBufferSize: LPDWORD, dwDetailLevel: DWORD, bRefresh: BOOL): PDH_STATUS {
    return Pdh.Load('PdhEnumObjectsHW')(hDataSource, szMachineName, mszObjectList, pcchBufferSize, dwDetailLevel, bRefresh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhenumobjectsw
  public static PdhEnumObjectsW(szDataSource: LPCWSTR | NULL, szMachineName: LPCWSTR | NULL, mszObjectList: LPWSTR | NULL, pcchBufferSize: LPDWORD, dwDetailLevel: DWORD, bRefresh: BOOL): PDH_STATUS {
    return Pdh.Load('PdhEnumObjectsW')(szDataSource, szMachineName, mszObjectList, pcchBufferSize, dwDetailLevel, bRefresh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhexpandcounterpatha
  public static PdhExpandCounterPathA(szWildCardPath: LPCSTR, mszExpandedPathList: LPSTR | NULL, pcchPathListLength: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhExpandCounterPathA')(szWildCardPath, mszExpandedPathList, pcchPathListLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhexpandcounterpathw
  public static PdhExpandCounterPathW(szWildCardPath: LPCWSTR, mszExpandedPathList: LPWSTR | NULL, pcchPathListLength: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhExpandCounterPathW')(szWildCardPath, mszExpandedPathList, pcchPathListLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhexpandwildcardpatha
  public static PdhExpandWildCardPathA(szDataSource: LPCSTR | NULL, szWildCardPath: LPCSTR, mszExpandedPathList: LPSTR | NULL, pcchPathListLength: LPDWORD, dwFlags: DWORD): PDH_STATUS {
    return Pdh.Load('PdhExpandWildCardPathA')(szDataSource, szWildCardPath, mszExpandedPathList, pcchPathListLength, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhexpandwildcardpathha
  public static PdhExpandWildCardPathHA(hDataSource: PDH_HLOG | 0n, szWildCardPath: LPCSTR, mszExpandedPathList: LPSTR | NULL, pcchPathListLength: LPDWORD, dwFlags: DWORD): PDH_STATUS {
    return Pdh.Load('PdhExpandWildCardPathHA')(hDataSource, szWildCardPath, mszExpandedPathList, pcchPathListLength, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhexpandwildcardpathhw
  public static PdhExpandWildCardPathHW(hDataSource: PDH_HLOG | 0n, szWildCardPath: LPCWSTR, mszExpandedPathList: LPWSTR | NULL, pcchPathListLength: LPDWORD, dwFlags: DWORD): PDH_STATUS {
    return Pdh.Load('PdhExpandWildCardPathHW')(hDataSource, szWildCardPath, mszExpandedPathList, pcchPathListLength, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhexpandwildcardpathw
  public static PdhExpandWildCardPathW(szDataSource: LPCWSTR | NULL, szWildCardPath: LPCWSTR, mszExpandedPathList: LPWSTR | NULL, pcchPathListLength: LPDWORD, dwFlags: DWORD): PDH_STATUS {
    return Pdh.Load('PdhExpandWildCardPathW')(szDataSource, szWildCardPath, mszExpandedPathList, pcchPathListLength, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhformatfromrawvalue
  public static PdhFormatFromRawValue(dwCounterType: DWORD, dwFormat: DWORD, pTimeBase: PLONGLONG | NULL, pRawValue1: PPDH_RAW_COUNTER, pRawValue2: PPDH_RAW_COUNTER | NULL, pFmtValue: PPDH_FMT_COUNTERVALUE): PDH_STATUS {
    return Pdh.Load('PdhFormatFromRawValue')(dwCounterType, dwFormat, pTimeBase, pRawValue1, pRawValue2, pFmtValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetcounterinfoa
  public static PdhGetCounterInfoA(hCounter: PDH_HCOUNTER, bRetrieveExplainText: BOOLEAN, pdwBufferSize: LPDWORD, lpBuffer: PPDH_COUNTER_INFO_A | NULL): PDH_STATUS {
    return Pdh.Load('PdhGetCounterInfoA')(hCounter, bRetrieveExplainText, pdwBufferSize, lpBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetcounterinfow
  public static PdhGetCounterInfoW(hCounter: PDH_HCOUNTER, bRetrieveExplainText: BOOLEAN, pdwBufferSize: LPDWORD, lpBuffer: PPDH_COUNTER_INFO_W | NULL): PDH_STATUS {
    return Pdh.Load('PdhGetCounterInfoW')(hCounter, bRetrieveExplainText, pdwBufferSize, lpBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetcountertimebase
  public static PdhGetCounterTimeBase(hCounter: PDH_HCOUNTER, pTimeBase: PLONGLONG): PDH_STATUS {
    return Pdh.Load('PdhGetCounterTimeBase')(hCounter, pTimeBase);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdatasourcetimerangea
  public static PdhGetDataSourceTimeRangeA(szDataSource: LPCSTR | NULL, pdwNumEntries: LPDWORD, pInfo: PPDH_TIME_INFO, pdwBufferSize: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDataSourceTimeRangeA')(szDataSource, pdwNumEntries, pInfo, pdwBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdatasourcetimerangeh
  public static PdhGetDataSourceTimeRangeH(hDataSource: PDH_HLOG | 0n, pdwNumEntries: LPDWORD, pInfo: PPDH_TIME_INFO, pdwBufferSize: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDataSourceTimeRangeH')(hDataSource, pdwNumEntries, pInfo, pdwBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdatasourcetimerangew
  public static PdhGetDataSourceTimeRangeW(szDataSource: LPCWSTR | NULL, pdwNumEntries: LPDWORD, pInfo: PPDH_TIME_INFO, pdwBufferSize: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDataSourceTimeRangeW')(szDataSource, pdwNumEntries, pInfo, pdwBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdefaultperfcountera
  public static PdhGetDefaultPerfCounterA(szDataSource: LPCSTR | NULL, szMachineName: LPCSTR | NULL, szObjectName: LPCSTR, szDefaultCounterName: LPSTR | NULL, pcchBufferSize: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDefaultPerfCounterA')(szDataSource, szMachineName, szObjectName, szDefaultCounterName, pcchBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdefaultperfcounterha
  public static PdhGetDefaultPerfCounterHA(hDataSource: PDH_HLOG | 0n, szMachineName: LPCSTR | NULL, szObjectName: LPCSTR, szDefaultCounterName: LPSTR | NULL, pcchBufferSize: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDefaultPerfCounterHA')(hDataSource, szMachineName, szObjectName, szDefaultCounterName, pcchBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdefaultperfcounterhw
  public static PdhGetDefaultPerfCounterHW(hDataSource: PDH_HLOG | 0n, szMachineName: LPCWSTR | NULL, szObjectName: LPCWSTR, szDefaultCounterName: LPWSTR | NULL, pcchBufferSize: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDefaultPerfCounterHW')(hDataSource, szMachineName, szObjectName, szDefaultCounterName, pcchBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdefaultperfcounterw
  public static PdhGetDefaultPerfCounterW(szDataSource: LPCWSTR | NULL, szMachineName: LPCWSTR | NULL, szObjectName: LPCWSTR, szDefaultCounterName: LPWSTR | NULL, pcchBufferSize: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDefaultPerfCounterW')(szDataSource, szMachineName, szObjectName, szDefaultCounterName, pcchBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdefaultperfobjecta
  public static PdhGetDefaultPerfObjectA(szDataSource: LPCSTR | NULL, szMachineName: LPCSTR | NULL, szDefaultObjectName: LPSTR | NULL, pcchBufferSize: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDefaultPerfObjectA')(szDataSource, szMachineName, szDefaultObjectName, pcchBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdefaultperfobjectha
  public static PdhGetDefaultPerfObjectHA(hDataSource: PDH_HLOG | 0n, szMachineName: LPCSTR | NULL, szDefaultObjectName: LPSTR | NULL, pcchBufferSize: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDefaultPerfObjectHA')(hDataSource, szMachineName, szDefaultObjectName, pcchBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdefaultperfobjecthw
  public static PdhGetDefaultPerfObjectHW(hDataSource: PDH_HLOG | 0n, szMachineName: LPCWSTR | NULL, szDefaultObjectName: LPWSTR | NULL, pcchBufferSize: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDefaultPerfObjectHW')(hDataSource, szMachineName, szDefaultObjectName, pcchBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdefaultperfobjectw
  public static PdhGetDefaultPerfObjectW(szDataSource: LPCWSTR | NULL, szMachineName: LPCWSTR | NULL, szDefaultObjectName: LPWSTR | NULL, pcchBufferSize: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhGetDefaultPerfObjectW')(szDataSource, szMachineName, szDefaultObjectName, pcchBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetdllversion
  public static PdhGetDllVersion(lpdwVersion: LPDWORD | NULL): PDH_STATUS {
    return Pdh.Load('PdhGetDllVersion')(lpdwVersion);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetformattedcounterarraya
  public static PdhGetFormattedCounterArrayA(hCounter: PDH_HCOUNTER, dwFormat: DWORD, lpdwBufferSize: LPDWORD, lpdwItemCount: LPDWORD, ItemBuffer: PPDH_FMT_COUNTERVALUE_ITEM_A | NULL): PDH_STATUS {
    return Pdh.Load('PdhGetFormattedCounterArrayA')(hCounter, dwFormat, lpdwBufferSize, lpdwItemCount, ItemBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetformattedcounterarrayw
  public static PdhGetFormattedCounterArrayW(hCounter: PDH_HCOUNTER, dwFormat: DWORD, lpdwBufferSize: LPDWORD, lpdwItemCount: LPDWORD, ItemBuffer: PPDH_FMT_COUNTERVALUE_ITEM_W | NULL): PDH_STATUS {
    return Pdh.Load('PdhGetFormattedCounterArrayW')(hCounter, dwFormat, lpdwBufferSize, lpdwItemCount, ItemBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetformattedcountervalue
  public static PdhGetFormattedCounterValue(hCounter: PDH_HCOUNTER, dwFormat: DWORD, lpdwType: LPDWORD | NULL, pValue: PPDH_FMT_COUNTERVALUE): PDH_STATUS {
    return Pdh.Load('PdhGetFormattedCounterValue')(hCounter, dwFormat, lpdwType, pValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetlogfilesize
  public static PdhGetLogFileSize(hLog: PDH_HLOG, llSize: PLONGLONG): PDH_STATUS {
    return Pdh.Load('PdhGetLogFileSize')(hLog, llSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetrawcounterarraya
  public static PdhGetRawCounterArrayA(hCounter: PDH_HCOUNTER, lpdwBufferSize: LPDWORD, lpdwItemCount: LPDWORD, ItemBuffer: PPDH_RAW_COUNTER_ITEM_A | NULL): PDH_STATUS {
    return Pdh.Load('PdhGetRawCounterArrayA')(hCounter, lpdwBufferSize, lpdwItemCount, ItemBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetrawcounterarrayw
  public static PdhGetRawCounterArrayW(hCounter: PDH_HCOUNTER, lpdwBufferSize: LPDWORD, lpdwItemCount: LPDWORD, ItemBuffer: PPDH_RAW_COUNTER_ITEM_W | NULL): PDH_STATUS {
    return Pdh.Load('PdhGetRawCounterArrayW')(hCounter, lpdwBufferSize, lpdwItemCount, ItemBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhgetrawcountervalue
  public static PdhGetRawCounterValue(hCounter: PDH_HCOUNTER, lpdwType: LPDWORD | NULL, pValue: PPDH_RAW_COUNTER): PDH_STATUS {
    return Pdh.Load('PdhGetRawCounterValue')(hCounter, lpdwType, pValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhisrealtimequery
  public static PdhIsRealTimeQuery(hQuery: PDH_HQUERY): BOOL {
    return Pdh.Load('PdhIsRealTimeQuery')(hQuery);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhlookupperfindexbynamea
  public static PdhLookupPerfIndexByNameA(szMachineName: LPCSTR | NULL, szNameBuffer: LPCSTR, pdwIndex: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhLookupPerfIndexByNameA')(szMachineName, szNameBuffer, pdwIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhlookupperfindexbynamew
  public static PdhLookupPerfIndexByNameW(szMachineName: LPCWSTR | NULL, szNameBuffer: LPCWSTR, pdwIndex: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhLookupPerfIndexByNameW')(szMachineName, szNameBuffer, pdwIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhlookupperfnamebyindexa
  public static PdhLookupPerfNameByIndexA(szMachineName: LPCSTR | NULL, dwNameIndex: DWORD, szNameBuffer: LPSTR | NULL, pcchNameBufferSize: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhLookupPerfNameByIndexA')(szMachineName, dwNameIndex, szNameBuffer, pcchNameBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhlookupperfnamebyindexw
  public static PdhLookupPerfNameByIndexW(szMachineName: LPCWSTR | NULL, dwNameIndex: DWORD, szNameBuffer: LPWSTR | NULL, pcchNameBufferSize: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhLookupPerfNameByIndexW')(szMachineName, dwNameIndex, szNameBuffer, pcchNameBufferSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhmakecounterpatha
  public static PdhMakeCounterPathA(pCounterPathElements: PPDH_COUNTER_PATH_ELEMENTS_A, szFullPathBuffer: LPSTR | NULL, pcchBufferSize: LPDWORD, dwFlags: DWORD): PDH_STATUS {
    return Pdh.Load('PdhMakeCounterPathA')(pCounterPathElements, szFullPathBuffer, pcchBufferSize, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhmakecounterpathw
  public static PdhMakeCounterPathW(pCounterPathElements: PPDH_COUNTER_PATH_ELEMENTS_W, szFullPathBuffer: LPWSTR | NULL, pcchBufferSize: LPDWORD, dwFlags: DWORD): PDH_STATUS {
    return Pdh.Load('PdhMakeCounterPathW')(pCounterPathElements, szFullPathBuffer, pcchBufferSize, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhopenloga
  public static PdhOpenLogA(szLogFileName: LPCSTR, dwAccessFlags: DWORD, lpdwLogType: LPDWORD, hQuery: PDH_HQUERY | 0n, dwMaxSize: DWORD, szUserCaption: LPCSTR | NULL, phLog: PPDH_HLOG): PDH_STATUS {
    return Pdh.Load('PdhOpenLogA')(szLogFileName, dwAccessFlags, lpdwLogType, hQuery, dwMaxSize, szUserCaption, phLog);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhopenlogw
  public static PdhOpenLogW(szLogFileName: LPCWSTR, dwAccessFlags: DWORD, lpdwLogType: LPDWORD, hQuery: PDH_HQUERY | 0n, dwMaxSize: DWORD, szUserCaption: LPCWSTR | NULL, phLog: PPDH_HLOG): PDH_STATUS {
    return Pdh.Load('PdhOpenLogW')(szLogFileName, dwAccessFlags, lpdwLogType, hQuery, dwMaxSize, szUserCaption, phLog);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhopenqueryw
  public static PdhOpenQuery(szDataSource: LPCWSTR | NULL, dwUserData: DWORD_PTR, phQuery: PPDH_HQUERY): PDH_STATUS {
    return Pdh.Load('PdhOpenQuery')(szDataSource, dwUserData, phQuery);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhopenquerya
  public static PdhOpenQueryA(szDataSource: LPCSTR | NULL, dwUserData: DWORD_PTR, phQuery: PPDH_HQUERY): PDH_STATUS {
    return Pdh.Load('PdhOpenQueryA')(szDataSource, dwUserData, phQuery);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhopenqueryh
  public static PdhOpenQueryH(hDataSource: PDH_HLOG | 0n, dwUserData: DWORD_PTR, phQuery: PPDH_HQUERY): PDH_STATUS {
    return Pdh.Load('PdhOpenQueryH')(hDataSource, dwUserData, phQuery);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhopenqueryw
  public static PdhOpenQueryW(szDataSource: LPCWSTR | NULL, dwUserData: DWORD_PTR, phQuery: PPDH_HQUERY): PDH_STATUS {
    return Pdh.Load('PdhOpenQueryW')(szDataSource, dwUserData, phQuery);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhparsecounterpatha
  public static PdhParseCounterPathA(szFullPathBuffer: LPCSTR, pCounterPathElements: PPDH_COUNTER_PATH_ELEMENTS_A | NULL, pdwBufferSize: LPDWORD, dwFlags: DWORD): PDH_STATUS {
    return Pdh.Load('PdhParseCounterPathA')(szFullPathBuffer, pCounterPathElements, pdwBufferSize, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhparsecounterpathw
  public static PdhParseCounterPathW(szFullPathBuffer: LPCWSTR, pCounterPathElements: PPDH_COUNTER_PATH_ELEMENTS_W | NULL, pdwBufferSize: LPDWORD, dwFlags: DWORD): PDH_STATUS {
    return Pdh.Load('PdhParseCounterPathW')(szFullPathBuffer, pCounterPathElements, pdwBufferSize, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhparseinstancenamea
  public static PdhParseInstanceNameA(szInstanceString: LPCSTR, szInstanceName: LPSTR | NULL, pcchInstanceNameLength: LPDWORD, szParentName: LPSTR | NULL, pcchParentNameLength: LPDWORD, lpIndex: LPDWORD | NULL): PDH_STATUS {
    return Pdh.Load('PdhParseInstanceNameA')(szInstanceString, szInstanceName, pcchInstanceNameLength, szParentName, pcchParentNameLength, lpIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhparseinstancenamew
  public static PdhParseInstanceNameW(szInstanceString: LPCWSTR, szInstanceName: LPWSTR | NULL, pcchInstanceNameLength: LPDWORD, szParentName: LPWSTR | NULL, pcchParentNameLength: LPDWORD, lpIndex: LPDWORD | NULL): PDH_STATUS {
    return Pdh.Load('PdhParseInstanceNameW')(szInstanceString, szInstanceName, pcchInstanceNameLength, szParentName, pcchParentNameLength, lpIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhreadrawlogrecord
  public static PdhReadRawLogRecord(hLog: PDH_HLOG, ftRecord: FILETIME, pRawLogRecord: PPDH_RAW_LOG_RECORD | NULL, pdwBufferLength: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhReadRawLogRecord')(hLog, ftRecord, pRawLogRecord, pdwBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhremovecounter
  public static PdhRemoveCounter(hCounter: PDH_HCOUNTER): PDH_STATUS {
    return Pdh.Load('PdhRemoveCounter')(hCounter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhselectdatasourcea
  public static PdhSelectDataSourceA(hWndOwner: HWND | 0n, dwFlags: DWORD, szDataSource: LPSTR, pcchBufferLength: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhSelectDataSourceA')(hWndOwner, dwFlags, szDataSource, pcchBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhselectdatasourcew
  public static PdhSelectDataSourceW(hWndOwner: HWND | 0n, dwFlags: DWORD, szDataSource: LPWSTR, pcchBufferLength: LPDWORD): PDH_STATUS {
    return Pdh.Load('PdhSelectDataSourceW')(hWndOwner, dwFlags, szDataSource, pcchBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhsetcounterscalefactor
  public static PdhSetCounterScaleFactor(hCounter: PDH_HCOUNTER, lFactor: LONG): PDH_STATUS {
    return Pdh.Load('PdhSetCounterScaleFactor')(hCounter, lFactor);
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
  public static PdhUpdateLogA(hLog: PDH_HLOG, szUserString: LPCSTR | NULL): PDH_STATUS {
    return Pdh.Load('PdhUpdateLogA')(hLog, szUserString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhupdatelogfilecatalog
  public static PdhUpdateLogFileCatalog(hLog: PDH_HLOG): PDH_STATUS {
    return Pdh.Load('PdhUpdateLogFileCatalog')(hLog);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhupdatelogw
  public static PdhUpdateLogW(hLog: PDH_HLOG, szUserString: LPCWSTR | NULL): PDH_STATUS {
    return Pdh.Load('PdhUpdateLogW')(hLog, szUserString);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhvalidatepatha
  public static PdhValidatePathA(szFullPathBuffer: LPCSTR): PDH_STATUS {
    return Pdh.Load('PdhValidatePathA')(szFullPathBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhvalidatepathexa
  public static PdhValidatePathExA(hDataSource: PDH_HLOG | 0n, szFullPathBuffer: LPCSTR): PDH_STATUS {
    return Pdh.Load('PdhValidatePathExA')(hDataSource, szFullPathBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhvalidatepathexw
  public static PdhValidatePathExW(hDataSource: PDH_HLOG | 0n, szFullPathBuffer: LPCWSTR): PDH_STATUS {
    return Pdh.Load('PdhValidatePathExW')(hDataSource, szFullPathBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/pdh/nf-pdh-pdhvalidatepathw
  public static PdhValidatePathW(szFullPathBuffer: LPCWSTR): PDH_STATUS {
    return Pdh.Load('PdhValidatePathW')(szFullPathBuffer);
  }
}

export default Pdh;
