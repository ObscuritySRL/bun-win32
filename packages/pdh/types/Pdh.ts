import type { Pointer } from 'bun:ffi';

export type { BOOL, BOOLEAN, DWORD, DWORD_PTR, HANDLE, HWND, LPCSTR, LPCWSTR, LPDWORD, LPSTR, LPWSTR, LONG, NULL } from '@bun-win32/core';

export enum PdhCounterFormat {
  PDH_FMT_1000 = 0x0000_2000,
  PDH_FMT_ANSI = 0x0000_0020,
  PDH_FMT_DOUBLE = 0x0000_0200,
  PDH_FMT_LARGE = 0x0000_0400,
  PDH_FMT_LONG = 0x0000_0100,
  PDH_FMT_NOCAP100 = 0x0000_8000,
  PDH_FMT_NODATA = 0x0000_4000,
  PDH_FMT_NOSCALE = 0x0000_1000,
  PDH_FMT_RAW = 0x0000_0010,
  PDH_FMT_UNICODE = 0x0000_0040,
}

export enum PdhDataSource {
  DATA_SOURCE_LOGFILE = 0x02,
  DATA_SOURCE_PDB = 0x03,
  DATA_SOURCE_REGISTRY = 0x01,
}

export enum PdhDetailLevel {
  PERF_DETAIL_ADVANCED = 200,
  PERF_DETAIL_EXPERT = 300,
  PERF_DETAIL_NOVICE = 100,
  PERF_DETAIL_WIZARD = 400,
}

export enum PdhLogAccess {
  PDH_LOG_CREATE_ALWAYS = 0x0000_0002,
  PDH_LOG_CREATE_NEW = 0x0000_0001,
  PDH_LOG_OPEN_ALWAYS = 0x0000_0003,
  PDH_LOG_OPEN_EXISTING = 0x0000_0004,
  PDH_LOG_OPT_APPEND = 0x0800_0000,
  PDH_LOG_OPT_CIRCULAR = 0x0200_0000,
  PDH_LOG_OPT_MAX_IS_BYTES = 0x0400_0000,
  PDH_LOG_OPT_USER_STRING = 0x0100_0000,
  PDH_LOG_READ_ACCESS = 0x0001_0000,
  PDH_LOG_UPDATE_ACCESS = 0x0004_0000,
  PDH_LOG_WRITE_ACCESS = 0x0002_0000,
}

export enum PdhLogType {
  PDH_LOG_TYPE_BINARY = 0x08,
  PDH_LOG_TYPE_CSV = 0x01,
  PDH_LOG_TYPE_PERFMON = 0x06,
  PDH_LOG_TYPE_SQL = 0x07,
  PDH_LOG_TYPE_TRACE_GENERIC = 0x05,
  PDH_LOG_TYPE_TRACE_KERNEL = 0x04,
  PDH_LOG_TYPE_TSV = 0x02,
  PDH_LOG_TYPE_UNDEFINED = 0x00,
}

export type FILETIME = bigint;
export type PDH_HCOUNTER = bigint;
export type PDH_HLOG = bigint;
export type PDH_HQUERY = bigint;
export type PDH_STATUS = number;
export type PLONGLONG = Pointer;
export type PPDH_BROWSE_DLG_CONFIG_A = Pointer;
export type PPDH_BROWSE_DLG_CONFIG_HA = Pointer;
export type PPDH_BROWSE_DLG_CONFIG_HW = Pointer;
export type PPDH_BROWSE_DLG_CONFIG_W = Pointer;
export type PPDH_COUNTER_INFO_A = Pointer;
export type PPDH_COUNTER_INFO_W = Pointer;
export type PPDH_COUNTER_PATH_ELEMENTS_A = Pointer;
export type PPDH_COUNTER_PATH_ELEMENTS_W = Pointer;
export type PPDH_FMT_COUNTERVALUE = Pointer;
export type PPDH_FMT_COUNTERVALUE_ITEM_A = Pointer;
export type PPDH_FMT_COUNTERVALUE_ITEM_W = Pointer;
export type PPDH_HCOUNTER = Pointer;
export type PPDH_HLOG = Pointer;
export type PPDH_HQUERY = Pointer;
export type PPDH_RAW_COUNTER = Pointer;
export type PPDH_RAW_COUNTER_ITEM_A = Pointer;
export type PPDH_RAW_COUNTER_ITEM_W = Pointer;
export type PPDH_RAW_LOG_RECORD = Pointer;
export type PPDH_STATISTICS = Pointer;
export type PPDH_TIME_INFO = Pointer;
