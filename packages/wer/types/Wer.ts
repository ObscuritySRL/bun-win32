import type { Pointer } from 'bun:ffi';

export type { BOOL, DWORD, DWORD_PTR, HANDLE, HRESULT, LPBOOL, LPDWORD, OPTIONAL } from '@bun-win32/core';

export const WCT_ASYNC_OPEN_FLAG = 0x0000_0001;
export const WCT_MAX_NODE_COUNT = 16;
export const WCT_NETWORK_IO_FLAG = 0x0000_0008;
export const WCT_OBJNAME_LENGTH = 128;
export const WCT_OUT_OF_PROC_COM_FLAG = 0x0000_0002;
export const WCT_OUT_OF_PROC_CS_FLAG = 0x0000_0004;
export const WCT_OUT_OF_PROC_FLAG = 0x0000_0001;
export const WER_DUMP_NOHEAP_ONQUEUE = 0x0000_0001;
export const WER_FILE_ANONYMOUS_DATA = 0x0000_0002;
export const WER_FILE_DELETE_WHEN_DONE = 0x0000_0001;
export const WER_P0 = 0;
export const WER_P1 = 1;
export const WER_P2 = 2;
export const WER_P3 = 3;
export const WER_P4 = 4;
export const WER_P5 = 5;
export const WER_P6 = 6;
export const WER_P7 = 7;
export const WER_P8 = 8;
export const WER_P9 = 9;
export const WER_SUBMIT_ADD_REGISTERED_DATA = 0x0000_0010;
export const WER_SUBMIT_ARCHIVE_PARAMETERS_ONLY = 0x0000_1000;
export const WER_SUBMIT_BYPASS_DATA_THROTTLING = 0x0000_0800;
export const WER_SUBMIT_HONOR_RECOVERY = 0x0000_0001;
export const WER_SUBMIT_HONOR_RESTART = 0x0000_0002;
export const WER_SUBMIT_NO_ARCHIVE = 0x0000_0100;
export const WER_SUBMIT_NO_CLOSE_UI = 0x0000_0040;
export const WER_SUBMIT_NO_QUEUE = 0x0000_0080;
export const WER_SUBMIT_OUTOFPROCESS = 0x0000_0020;
export const WER_SUBMIT_OUTOFPROCESS_ASYNC = 0x0000_0400;
export const WER_SUBMIT_QUEUE = 0x0000_0004;
export const WER_SUBMIT_REPORT_MACHINE_ID = 0x0000_2000;
export const WER_SUBMIT_SHOW_DEBUG = 0x0000_0008;
export const WER_SUBMIT_START_MINIMIZED = 0x0000_0200;

export enum REPORT_STORE_TYPES {
  E_STORE_INVALID = 4,
  E_STORE_MACHINE_ARCHIVE = 2,
  E_STORE_MACHINE_QUEUE = 3,
  E_STORE_USER_ARCHIVE = 0,
  E_STORE_USER_QUEUE = 1,
}

export enum WCT_OBJECT_STATUS {
  WctStatusAbandoned = 8,
  WctStatusBlocked = 3,
  WctStatusError = 10,
  WctStatusNoAccess = 1,
  WctStatusNotOwned = 7,
  WctStatusOwned = 6,
  WctStatusPidOnly = 4,
  WctStatusPidOnlyRpcss = 5,
  WctStatusRunning = 2,
  WctStatusUnknown = 9,
}

export enum WCT_OBJECT_TYPE {
  WctAlpcType = 4,
  WctComActivationType = 9,
  WctComType = 5,
  WctCriticalSectionType = 1,
  WctMutexType = 3,
  WctProcessWaitType = 7,
  WctSendMessageType = 2,
  WctThreadType = 8,
  WctThreadWaitType = 6,
  WctUnknownType = 10,
}

export enum WER_CONSENT {
  WerConsentAlwaysPrompt = 4,
  WerConsentApproved = 2,
  WerConsentDenied = 3,
  WerConsentMax = 5,
  WerConsentNotAsked = 1,
}

export enum WER_DUMP_TYPE {
  WerDumpTypeHeapDump = 3,
  WerDumpTypeMax = 5,
  WerDumpTypeMicroDump = 1,
  WerDumpTypeMiniDump = 2,
  WerDumpTypeNone = 0,
  WerDumpTypeTriageDump = 4,
}

export enum WER_FILE_TYPE {
  WerFileTypeAuxiliaryDump = 7,
  WerFileTypeAuxiliaryHeapDump = 9,
  WerFileTypeCustomDump = 6,
  WerFileTypeEtlTrace = 8,
  WerFileTypeHeapdump = 2,
  WerFileTypeMax = 10,
  WerFileTypeMicrodump = 0,
  WerFileTypeMinidump = 1,
  WerFileTypeOther = 4,
  WerFileTypeTriagedump = 5,
  WerFileTypeUserDocument = 3,
}

export enum WER_REPORT_TYPE {
  WerReportApplicationCrash = 2,
  WerReportApplicationHang = 3,
  WerReportCritical = 1,
  WerReportInvalid = 5,
  WerReportKernel = 4,
  WerReportNonCritical = 0,
}

export enum WER_REPORT_UI {
  WerUIAdditionalDataDlgHeader = 0,
  WerUICloseDlgBody = 8,
  WerUICloseDlgButtonText = 9,
  WerUICloseDlgHeader = 7,
  WerUICloseText = 6,
  WerUIConsentDlgBody = 3,
  WerUIConsentDlgHeader = 2,
  WerUIIconFilePath = 1,
  WerUIMax = 10,
  WerUIOfflineSolutionCheckText = 5,
  WerUIOnlineSolutionCheckText = 4,
}

export enum WER_SUBMIT_RESULT {
  WerCustomAction = 9,
  WerDisabled = 5,
  WerDisabledQueue = 7,
  WerReportAsync = 8,
  WerReportCancelled = 6,
  WerReportDebug = 3,
  WerReportFailed = 4,
  WerReportQueued = 1,
  WerReportUploaded = 2,
}

export type HREPORT = bigint;
export type HREPORTSTORE = bigint;
export type HWCT = bigint;
export type PCOGETACTIVATIONSTATE = Pointer;
export type PCOGETCALLSTATE = Pointer;
export type PCWSTR = Pointer;
export type PHREPORT = Pointer;
export type PHREPORTSTORE = Pointer;
export type PPCWSTR = Pointer;
export type PULONGLONG = Pointer;
export type PWAITCHAINCALLBACK = Pointer;
export type PWAITCHAIN_NODE_INFO = Pointer;
export type PWER_DUMP_CUSTOM_OPTIONS = Pointer;
export type PWER_EXCEPTION_INFORMATION = Pointer;
export type PWER_REPORT_INFORMATION = Pointer;
export type PWER_REPORT_METADATA_V2 = Pointer;
export type PWER_REPORT_METADATA_V3 = Pointer;
export type PWER_SUBMIT_RESULT = Pointer;
