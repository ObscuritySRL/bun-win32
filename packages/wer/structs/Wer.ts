import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  DWORD,
  DWORD_PTR,
  HANDLE,
  HREPORT,
  HREPORTSTORE,
  HRESULT,
  HWCT,
  LPBOOL,
  LPDWORD,
  Optional,
  PCOGETACTIVATIONSTATE,
  PCOGETCALLSTATE,
  PCWSTR,
  PHREPORT,
  PHREPORTSTORE,
  PPCWSTR,
  PULONGLONG,
  PWAITCHAIN_NODE_INFO,
  PWAITCHAINCALLBACK,
  PWER_DUMP_CUSTOM_OPTIONS,
  PWER_EXCEPTION_INFORMATION,
  PWER_REPORT_INFORMATION,
  PWER_REPORT_METADATA_V2,
  PWER_REPORT_METADATA_V3,
  PWER_SUBMIT_RESULT,
  REPORT_STORE_TYPES,
  WER_CONSENT,
  WER_DUMP_TYPE,
  WER_FILE_TYPE,
  WER_REPORT_TYPE,
  WER_REPORT_UI,
} from '../types/Wer';

/**
 * Thin, lazy-loaded FFI bindings for `wer.dll`.
 *
 * Covers the Windows Error Reporting (WER) report-authoring and report-store
 * surface (`werapi.h`) plus the Wait Chain Traversal (WCT) deadlock-detection
 * surface (`wct.h`), both exported from `wer.dll`.
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
 * import Wer from './structs/Wer';
 *
 * // Lazy: bind on first call
 * const session = Wer.OpenThreadWaitChainSession(0, null);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Wer.Preload(['OpenThreadWaitChainSession', 'GetThreadWaitChain']);
 * ```
 */
class Wer extends Win32 {
  protected static override name = 'wer.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    CloseThreadWaitChainSession: { args: [FFIType.u64], returns: FFIType.void },
    GetThreadWaitChain: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OpenThreadWaitChainSession: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    RegisterWaitChainCOMCallback: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    WerAddExcludedApplication: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    WerFreeString: { args: [FFIType.ptr], returns: FFIType.void },
    WerRemoveExcludedApplication: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    WerReportAddDump: { args: [FFIType.u64, FFIType.u64, FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WerReportAddFile: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    WerReportCloseHandle: { args: [FFIType.u64], returns: FFIType.i32 },
    WerReportCreate: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WerReportSetParameter: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WerReportSetUIOption: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    WerReportSubmit: { args: [FFIType.u64, FFIType.i32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    WerStoreClose: { args: [FFIType.u64], returns: FFIType.void },
    WerStoreGetFirstReportKey: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WerStoreGetNextReportKey: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WerStoreGetReportCount: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WerStoreGetSizeOnDisk: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    WerStoreOpen: { args: [FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    WerStorePurge: { args: [], returns: FFIType.i32 },
    WerStoreQueryReportMetadataV2: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WerStoreQueryReportMetadataV3: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WerStoreUploadReport: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/wct/nf-wct-closethreadwaitchainsession
  public static CloseThreadWaitChainSession(WctHandle: HWCT): void {
    return Wer.Load('CloseThreadWaitChainSession')(WctHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wct/nf-wct-getthreadwaitchain
  public static GetThreadWaitChain(WctHandle: HWCT, Context: Optional<DWORD_PTR>, Flags: DWORD, ThreadId: DWORD, NodeCount_in_out: LPDWORD, NodeInfoArray_out: PWAITCHAIN_NODE_INFO, IsCycle_out: LPBOOL): BOOL {
    return Wer.Load('GetThreadWaitChain')(WctHandle, Context, Flags, ThreadId, NodeCount_in_out, NodeInfoArray_out, IsCycle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wct/nf-wct-openthreadwaitchainsession
  public static OpenThreadWaitChainSession(Flags: DWORD, callback: Optional<PWAITCHAINCALLBACK>): HWCT {
    return Wer.Load('OpenThreadWaitChainSession')(Flags, callback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wct/nf-wct-registerwaitchaincomcallback
  public static RegisterWaitChainCOMCallback(CallStateCallback: PCOGETCALLSTATE, ActivationStateCallback: PCOGETACTIVATIONSTATE): void {
    return Wer.Load('RegisterWaitChainCOMCallback')(CallStateCallback, ActivationStateCallback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/werapi/nf-werapi-weraddexcludedapplication
  public static WerAddExcludedApplication(pwzExeName: PCWSTR, bAllUsers: BOOL): HRESULT {
    return Wer.Load('WerAddExcludedApplication')(pwzExeName, bAllUsers);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/werapi/nf-werapi-werfreestring
  public static WerFreeString(pwszStr: PCWSTR): void {
    return Wer.Load('WerFreeString')(pwszStr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/werapi/nf-werapi-werremoveexcludedapplication
  public static WerRemoveExcludedApplication(pwzExeName: PCWSTR, bAllUsers: BOOL): HRESULT {
    return Wer.Load('WerRemoveExcludedApplication')(pwzExeName, bAllUsers);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/werapi/nf-werapi-werreportadddump
  public static WerReportAddDump(
    hReportHandle: HREPORT,
    hProcess: HANDLE,
    hThread: Optional<HANDLE>,
    dumpType: WER_DUMP_TYPE,
    pExceptionParam: Optional<PWER_EXCEPTION_INFORMATION>,
    pDumpCustomOptions: Optional<PWER_DUMP_CUSTOM_OPTIONS>,
    dwFlags: DWORD,
  ): HRESULT {
    return Wer.Load('WerReportAddDump')(hReportHandle, hProcess, hThread, dumpType, pExceptionParam, pDumpCustomOptions, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/werapi/nf-werapi-werreportaddfile
  public static WerReportAddFile(hReportHandle: HREPORT, pwzPath: PCWSTR, repFileType: WER_FILE_TYPE, dwFileFlags: DWORD): HRESULT {
    return Wer.Load('WerReportAddFile')(hReportHandle, pwzPath, repFileType, dwFileFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/werapi/nf-werapi-werreportclosehandle
  public static WerReportCloseHandle(hReportHandle: HREPORT): HRESULT {
    return Wer.Load('WerReportCloseHandle')(hReportHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/werapi/nf-werapi-werreportcreate
  public static WerReportCreate(pwzEventType: PCWSTR, repType: WER_REPORT_TYPE, pReportInformation: Optional<PWER_REPORT_INFORMATION>, phReportHandle_out: PHREPORT): HRESULT {
    return Wer.Load('WerReportCreate')(pwzEventType, repType, pReportInformation, phReportHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/werapi/nf-werapi-werreportsetparameter
  public static WerReportSetParameter(hReportHandle: HREPORT, dwparamID: DWORD, pwzName: Optional<PCWSTR>, pwzValue: PCWSTR): HRESULT {
    return Wer.Load('WerReportSetParameter')(hReportHandle, dwparamID, pwzName, pwzValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/werapi/nf-werapi-werreportsetuioption
  public static WerReportSetUIOption(hReportHandle: HREPORT, repUITypeID: WER_REPORT_UI, pwzValue: PCWSTR): HRESULT {
    return Wer.Load('WerReportSetUIOption')(hReportHandle, repUITypeID, pwzValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/werapi/nf-werapi-werreportsubmit
  public static WerReportSubmit(hReportHandle: HREPORT, consent: WER_CONSENT, dwFlags: DWORD, pSubmitResult_out: Optional<PWER_SUBMIT_RESULT>): HRESULT {
    return Wer.Load('WerReportSubmit')(hReportHandle, consent, dwFlags, pSubmitResult_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/werapi/nf-werapi-werstoreclose
  public static WerStoreClose(hReportStore: Optional<HREPORTSTORE>): void {
    return Wer.Load('WerStoreClose')(hReportStore);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/werapi/nf-werapi-werstoregetfirstreportkey
  public static WerStoreGetFirstReportKey(hReportStore: HREPORTSTORE, ppszReportKey_out: PPCWSTR): HRESULT {
    return Wer.Load('WerStoreGetFirstReportKey')(hReportStore, ppszReportKey_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/werapi/nf-werapi-werstoregetnextreportkey
  public static WerStoreGetNextReportKey(hReportStore: HREPORTSTORE, ppszReportKey_out: PPCWSTR): HRESULT {
    return Wer.Load('WerStoreGetNextReportKey')(hReportStore, ppszReportKey_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/werapi/nf-werapi-werstoregetreportcount
  public static WerStoreGetReportCount(hReportStore: HREPORTSTORE, pdwReportCount_out: LPDWORD): HRESULT {
    return Wer.Load('WerStoreGetReportCount')(hReportStore, pdwReportCount_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/werapi/nf-werapi-werstoregetsizeondisk
  public static WerStoreGetSizeOnDisk(hReportStore: HREPORTSTORE, pqwSizeInBytes_out: PULONGLONG): HRESULT {
    return Wer.Load('WerStoreGetSizeOnDisk')(hReportStore, pqwSizeInBytes_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/werapi/nf-werapi-werstoreopen
  public static WerStoreOpen(repStoreType: REPORT_STORE_TYPES, phReportStore_out: PHREPORTSTORE): HRESULT {
    return Wer.Load('WerStoreOpen')(repStoreType, phReportStore_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/werapi/nf-werapi-werstorepurge
  public static WerStorePurge(): HRESULT {
    return Wer.Load('WerStorePurge')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/werapi/nf-werapi-werstorequeryreportmetadatav2
  public static WerStoreQueryReportMetadataV2(hReportStore: HREPORTSTORE, pszReportKey: PCWSTR, pReportMetadata_out: PWER_REPORT_METADATA_V2): HRESULT {
    return Wer.Load('WerStoreQueryReportMetadataV2')(hReportStore, pszReportKey, pReportMetadata_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/werapi/nf-werapi-werstorequeryreportmetadatav3
  public static WerStoreQueryReportMetadataV3(hReportStore: HREPORTSTORE, pszReportKey: PCWSTR, pReportMetadata_out: PWER_REPORT_METADATA_V3): HRESULT {
    return Wer.Load('WerStoreQueryReportMetadataV3')(hReportStore, pszReportKey, pReportMetadata_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/werapi/nf-werapi-werstoreuploadreport
  public static WerStoreUploadReport(hReportStore: HREPORTSTORE, pszReportKey: PCWSTR, dwFlags: DWORD, pSubmitResult_out: Optional<PWER_SUBMIT_RESULT>): HRESULT {
    return Wer.Load('WerStoreUploadReport')(hReportStore, pszReportKey, dwFlags, pSubmitResult_out);
  }
}

export default Wer;
