import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  DWORD,
  DWORDLONG,
  FILETIME,
  HANDLE,
  HRESULT,
  HWND,
  INT,
  LARGE_INTEGER,
  LONG,
  LPBYTE,
  LPCSTR,
  LPCWSTR,
  LPDWORD,
  LPHANDLE,
  LPPRINTER_DEFAULTSA,
  LPPRINTER_DEFAULTSW,
  LPSTR,
  LPVOID,
  LPWSTR,
  NULL,
  PBOOL,
  PBYTE,
  PCORE_PRINTER_DRIVERA,
  PCORE_PRINTER_DRIVERW,
  PDWORD,
  PDEVMODEA,
  PDEVMODEW,
  PLARGE_INTEGER,
  PPrintNamedProperty,
  PPrintPropertyValue,
  PPRINT_EXECUTION_DATA,
  PPRINTER_NOTIFY_INFO,
  PPRINTER_NOTIFY_OPTIONS,
  PPRINTER_OPTIONSA,
  PPRINTER_OPTIONSW,
  PVOID,
  SIZE_T,
  ULONG,
  WORD,
} from '../types/Winspool';

/**
 * Thin, lazy-loaded FFI bindings for `winspool.drv`.
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
 * import Winspool from './structs/Winspool';
 *
 * // Lazy: bind on first call
 * const result = Winspool.OpenPrinterW(name.ptr, handle.ptr, null);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Winspool.Preload(['OpenPrinterW', 'ClosePrinter', 'EnumPrintersW']);
 * ```
 */
class Winspool extends Win32 {
  protected static override name = 'winspool.drv';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    AbortPrinter: { args: [FFIType.u64], returns: FFIType.i32 },
    AddFormA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AddFormW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AddJobA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AddJobW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AddMonitorA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AddMonitorW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AddPortA: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    AddPortExA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AddPortExW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AddPortW: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    AddPrintProcessorA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AddPrintProcessorW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AddPrintProvidorA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AddPrintProvidorW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AddPrinterA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    AddPrinterConnection2A: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AddPrinterConnection2W: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AddPrinterConnectionA: { args: [FFIType.ptr], returns: FFIType.i32 },
    AddPrinterConnectionW: { args: [FFIType.ptr], returns: FFIType.i32 },
    AddPrinterDriverA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AddPrinterDriverExA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    AddPrinterDriverExW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    AddPrinterDriverW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    AddPrinterW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    AdvancedDocumentPropertiesA: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AdvancedDocumentPropertiesW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ClosePrinter: { args: [FFIType.u64], returns: FFIType.i32 },
    CloseSpoolFileHandle: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    CommitSpoolData: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    ConfigurePortA: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ConfigurePortW: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ConnectToPrinterDlg: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    CorePrinterDriverInstalledA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    CorePrinterDriverInstalledW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    CreatePrintAsyncNotifyChannel: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DeleteFormA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    DeleteFormW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    DeleteJobNamedProperty: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    DeleteMonitorA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DeleteMonitorW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DeletePortA: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    DeletePortW: { args: [FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    DeletePrintProcessorA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DeletePrintProcessorW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DeletePrintProvidorA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DeletePrintProvidorW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DeletePrinter: { args: [FFIType.u64], returns: FFIType.i32 },
    DeletePrinterConnectionA: { args: [FFIType.ptr], returns: FFIType.i32 },
    DeletePrinterConnectionW: { args: [FFIType.ptr], returns: FFIType.i32 },
    DeletePrinterDataA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    DeletePrinterDataExA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DeletePrinterDataExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    DeletePrinterDataW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    DeletePrinterDriverA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DeletePrinterDriverExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    DeletePrinterDriverExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    DeletePrinterDriverPackageA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DeletePrinterDriverPackageW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DeletePrinterDriverW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DeletePrinterKeyA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    DeletePrinterKeyW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    DeviceCapabilitiesA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u16, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DeviceCapabilitiesW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u16, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DocumentPropertiesA: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    DocumentPropertiesW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    EndDocPrinter: { args: [FFIType.u64], returns: FFIType.i32 },
    EndPagePrinter: { args: [FFIType.u64], returns: FFIType.i32 },
    EnumFormsA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumFormsW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumJobNamedProperties: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    EnumJobsA: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumJobsW: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumMonitorsA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumMonitorsW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumPortsA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumPortsW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumPrintProcessorDatatypesA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumPrintProcessorDatatypesW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumPrintProcessorsA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumPrintProcessorsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumPrinterDataA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    EnumPrinterDataExA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    EnumPrinterDataExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    EnumPrinterDataW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    EnumPrinterDriversA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumPrinterDriversW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumPrinterKeyA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    EnumPrinterKeyW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    EnumPrintersA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumPrintersW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FindClosePrinterChangeNotification: { args: [FFIType.u64], returns: FFIType.i32 },
    FindFirstPrinterChangeNotification: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u64 },
    FindNextPrinterChangeNotification: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FlushPrinter: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    FreePrintNamedPropertyArray: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.void },
    FreePrintPropertyValue: { args: [FFIType.ptr], returns: FFIType.void },
    FreePrinterNotifyInfo: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetCorePrinterDriversA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetCorePrinterDriversW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetDefaultPrinterA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetDefaultPrinterW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetFormA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetFormW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetJobA: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetJobNamedPropertyValue: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetJobW: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetPrintExecutionData: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetPrintOutputInfo: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetPrintProcessorDirectoryA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetPrintProcessorDirectoryW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetPrinterA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetPrinterDataA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetPrinterDataExA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetPrinterDataExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetPrinterDataW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    GetPrinterDriverA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetPrinterDriverDirectoryA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetPrinterDriverDirectoryW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetPrinterDriverPackagePathA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetPrinterDriverPackagePathW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetPrinterDriverW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetPrinterW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetSpoolFileHandle: { args: [FFIType.u64], returns: FFIType.u64 },
    InstallPrinterDriverFromPackageA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InstallPrinterDriverFromPackageW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    IsValidDevmodeA: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    IsValidDevmodeW: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.i32 },
    OpenPrinter2A: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OpenPrinter2W: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OpenPrinterA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    OpenPrinterW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PrinterMessageBoxA: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PrinterMessageBoxW: { args: [FFIType.u64, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    PrinterProperties: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    ReadPrinter: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RegisterForPrintAsyncNotifications: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ReportJobProcessingProgress: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    ResetPrinterA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ResetPrinterW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    ScheduleJob: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SeekPrinter: { args: [FFIType.u64, FFIType.i64, FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    SetDefaultPrinterA: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetDefaultPrinterW: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetFormA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetFormW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetJobA: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetJobNamedProperty: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    SetJobW: { args: [FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetPortA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetPortW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetPrinterA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetPrinterDataA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    SetPrinterDataExA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    SetPrinterDataExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    SetPrinterDataW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    SetPrinterW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    StartDocPrinterA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    StartDocPrinterW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    StartPagePrinter: { args: [FFIType.u64], returns: FFIType.i32 },
    UnRegisterForPrintAsyncNotifications: { args: [FFIType.u64], returns: FFIType.i32 },
    UploadPrinterDriverPackageA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UploadPrinterDriverPackageW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    WaitForPrinterChange: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    WritePrinter: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    XcvDataW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/abortprinter
  public static AbortPrinter(hPrinter: HANDLE): BOOL {
    return Winspool.Load('AbortPrinter')(hPrinter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addform
  public static AddFormA(hPrinter: HANDLE, Level: DWORD, pForm: LPBYTE): BOOL {
    return Winspool.Load('AddFormA')(hPrinter, Level, pForm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addform
  public static AddFormW(hPrinter: HANDLE, Level: DWORD, pForm: LPBYTE): BOOL {
    return Winspool.Load('AddFormW')(hPrinter, Level, pForm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addjob
  public static AddJobA(hPrinter: HANDLE, Level: DWORD, pData: LPBYTE, cbBuf: DWORD, pcbNeeded: LPDWORD): BOOL {
    return Winspool.Load('AddJobA')(hPrinter, Level, pData, cbBuf, pcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addjob
  public static AddJobW(hPrinter: HANDLE, Level: DWORD, pData: LPBYTE, cbBuf: DWORD, pcbNeeded: LPDWORD): BOOL {
    return Winspool.Load('AddJobW')(hPrinter, Level, pData, cbBuf, pcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addmonitor
  public static AddMonitorA(pName: LPSTR | NULL, Level: DWORD, pMonitorInfo: LPBYTE): BOOL {
    return Winspool.Load('AddMonitorA')(pName, Level, pMonitorInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addmonitor
  public static AddMonitorW(pName: LPWSTR | NULL, Level: DWORD, pMonitorInfo: LPBYTE): BOOL {
    return Winspool.Load('AddMonitorW')(pName, Level, pMonitorInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addport
  public static AddPortA(pName: LPSTR | NULL, hWnd: HWND, pMonitorName: LPSTR): BOOL {
    return Winspool.Load('AddPortA')(pName, hWnd, pMonitorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addportex
  public static AddPortExA(pName: LPSTR | NULL, dwLevel: DWORD, lpBuffer: LPBYTE, lpMonitorName: LPSTR): BOOL {
    return Winspool.Load('AddPortExA')(pName, dwLevel, lpBuffer, lpMonitorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addportex
  public static AddPortExW(pName: LPWSTR | NULL, dwLevel: DWORD, lpBuffer: LPBYTE, lpMonitorName: LPWSTR): BOOL {
    return Winspool.Load('AddPortExW')(pName, dwLevel, lpBuffer, lpMonitorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addport
  public static AddPortW(pName: LPWSTR | NULL, hWnd: HWND, pMonitorName: LPWSTR): BOOL {
    return Winspool.Load('AddPortW')(pName, hWnd, pMonitorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprintprocessor
  public static AddPrintProcessorA(pName: LPSTR | NULL, pEnvironment: LPSTR, pPathName: LPSTR, pPrintProcessorName: LPSTR): BOOL {
    return Winspool.Load('AddPrintProcessorA')(pName, pEnvironment, pPathName, pPrintProcessorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprintprocessor
  public static AddPrintProcessorW(pName: LPWSTR | NULL, pEnvironment: LPWSTR, pPathName: LPWSTR, pPrintProcessorName: LPWSTR): BOOL {
    return Winspool.Load('AddPrintProcessorW')(pName, pEnvironment, pPathName, pPrintProcessorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprintprovidor
  public static AddPrintProvidorA(pName: LPSTR | NULL, Level: DWORD, pProviderInfo: LPBYTE): BOOL {
    return Winspool.Load('AddPrintProvidorA')(pName, Level, pProviderInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprintprovidor
  public static AddPrintProvidorW(pName: LPWSTR | NULL, Level: DWORD, pProviderInfo: LPBYTE): BOOL {
    return Winspool.Load('AddPrintProvidorW')(pName, Level, pProviderInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprinter
  public static AddPrinterA(pName: LPSTR | NULL, Level: DWORD, pPrinter: LPBYTE): HANDLE {
    return Winspool.Load('AddPrinterA')(pName, Level, pPrinter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprinterconnection2
  public static AddPrinterConnection2A(hWnd: HWND | 0n, pszName: LPCSTR, dwLevel: DWORD, pConnectionInfo: PVOID): BOOL {
    return Winspool.Load('AddPrinterConnection2A')(hWnd, pszName, dwLevel, pConnectionInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprinterconnection2
  public static AddPrinterConnection2W(hWnd: HWND | 0n, pszName: LPCWSTR, dwLevel: DWORD, pConnectionInfo: PVOID): BOOL {
    return Winspool.Load('AddPrinterConnection2W')(hWnd, pszName, dwLevel, pConnectionInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprinterconnection
  public static AddPrinterConnectionA(pName: LPSTR): BOOL {
    return Winspool.Load('AddPrinterConnectionA')(pName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprinterconnection
  public static AddPrinterConnectionW(pName: LPWSTR): BOOL {
    return Winspool.Load('AddPrinterConnectionW')(pName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprinterdriver
  public static AddPrinterDriverA(pName: LPSTR | NULL, Level: DWORD, pDriverInfo: LPBYTE): BOOL {
    return Winspool.Load('AddPrinterDriverA')(pName, Level, pDriverInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprinterdriverex
  public static AddPrinterDriverExA(pName: LPSTR | NULL, Level: DWORD, pDriverInfo: LPBYTE, dwFileCopyFlags: DWORD): BOOL {
    return Winspool.Load('AddPrinterDriverExA')(pName, Level, pDriverInfo, dwFileCopyFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprinterdriverex
  public static AddPrinterDriverExW(pName: LPWSTR | NULL, Level: DWORD, pDriverInfo: LPBYTE, dwFileCopyFlags: DWORD): BOOL {
    return Winspool.Load('AddPrinterDriverExW')(pName, Level, pDriverInfo, dwFileCopyFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprinterdriver
  public static AddPrinterDriverW(pName: LPWSTR | NULL, Level: DWORD, pDriverInfo: LPBYTE): BOOL {
    return Winspool.Load('AddPrinterDriverW')(pName, Level, pDriverInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprinter
  public static AddPrinterW(pName: LPWSTR | NULL, Level: DWORD, pPrinter: LPBYTE): HANDLE {
    return Winspool.Load('AddPrinterW')(pName, Level, pPrinter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/advanceddocumentproperties
  public static AdvancedDocumentPropertiesA(hWnd: HWND, hPrinter: HANDLE, pDeviceName: LPSTR, pDevModeOutput: PDEVMODEA, pDevModeInput: PDEVMODEA | NULL): LONG {
    return Winspool.Load('AdvancedDocumentPropertiesA')(hWnd, hPrinter, pDeviceName, pDevModeOutput, pDevModeInput);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/advanceddocumentproperties
  public static AdvancedDocumentPropertiesW(hWnd: HWND, hPrinter: HANDLE, pDeviceName: LPWSTR, pDevModeOutput: PDEVMODEW, pDevModeInput: PDEVMODEW | NULL): LONG {
    return Winspool.Load('AdvancedDocumentPropertiesW')(hWnd, hPrinter, pDeviceName, pDevModeOutput, pDevModeInput);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/closeprinter
  public static ClosePrinter(hPrinter: HANDLE): BOOL {
    return Winspool.Load('ClosePrinter')(hPrinter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/closespoolfilehandle
  public static CloseSpoolFileHandle(hPrinter: HANDLE, hSpoolFile: HANDLE): BOOL {
    return Winspool.Load('CloseSpoolFileHandle')(hPrinter, hSpoolFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/commitspooldata
  public static CommitSpoolData(hPrinter: HANDLE, hSpoolFile: HANDLE, cbCommit: DWORD): HANDLE {
    return Winspool.Load('CommitSpoolData')(hPrinter, hSpoolFile, cbCommit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/configureport
  public static ConfigurePortA(pName: LPSTR | NULL, hWnd: HWND, pPortName: LPSTR): BOOL {
    return Winspool.Load('ConfigurePortA')(pName, hWnd, pPortName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/configureport
  public static ConfigurePortW(pName: LPWSTR | NULL, hWnd: HWND, pPortName: LPWSTR): BOOL {
    return Winspool.Load('ConfigurePortW')(pName, hWnd, pPortName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/connecttoprinterdlg
  public static ConnectToPrinterDlg(hwnd: HWND, Flags: DWORD): HANDLE {
    return Winspool.Load('ConnectToPrinterDlg')(hwnd, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/coreprinterdriverinstalled
  public static CorePrinterDriverInstalledA(pszServer: LPCSTR | NULL, pszEnvironment: LPCSTR, CoreDriverGUID: LPVOID, ftDriverDate: FILETIME, dwlDriverVersion: DWORDLONG, pbDriverInstalled: PBOOL): HRESULT {
    return Winspool.Load('CorePrinterDriverInstalledA')(pszServer, pszEnvironment, CoreDriverGUID, ftDriverDate, dwlDriverVersion, pbDriverInstalled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/coreprinterdriverinstalled
  public static CorePrinterDriverInstalledW(pszServer: LPCWSTR | NULL, pszEnvironment: LPCWSTR, CoreDriverGUID: LPVOID, ftDriverDate: FILETIME, dwlDriverVersion: DWORDLONG, pbDriverInstalled: PBOOL): HRESULT {
    return Winspool.Load('CorePrinterDriverInstalledW')(pszServer, pszEnvironment, CoreDriverGUID, ftDriverDate, dwlDriverVersion, pbDriverInstalled);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prnasnot/nf-prnasnot-createprintasyncnotifychannel
  public static CreatePrintAsyncNotifyChannel(pszName: LPCWSTR, pNotificationType: LPVOID, eUserFilter: DWORD, eConversationStyle: DWORD, pCallback: LPVOID, ppIAsynchNotification: LPVOID): HRESULT {
    return Winspool.Load('CreatePrintAsyncNotifyChannel')(pszName, pNotificationType, eUserFilter, eConversationStyle, pCallback, ppIAsynchNotification);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteform
  public static DeleteFormA(hPrinter: HANDLE, pFormName: LPSTR): BOOL {
    return Winspool.Load('DeleteFormA')(hPrinter, pFormName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteform
  public static DeleteFormW(hPrinter: HANDLE, pFormName: LPWSTR): BOOL {
    return Winspool.Load('DeleteFormW')(hPrinter, pFormName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deletejobnamedproperty
  public static DeleteJobNamedProperty(hPrinter: HANDLE, JobId: DWORD, pszName: LPCWSTR): DWORD {
    return Winspool.Load('DeleteJobNamedProperty')(hPrinter, JobId, pszName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deletemonitor
  public static DeleteMonitorA(pName: LPSTR | NULL, pEnvironment: LPSTR | NULL, pMonitorName: LPSTR): BOOL {
    return Winspool.Load('DeleteMonitorA')(pName, pEnvironment, pMonitorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deletemonitor
  public static DeleteMonitorW(pName: LPWSTR | NULL, pEnvironment: LPWSTR | NULL, pMonitorName: LPWSTR): BOOL {
    return Winspool.Load('DeleteMonitorW')(pName, pEnvironment, pMonitorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteport
  public static DeletePortA(pName: LPSTR | NULL, hWnd: HWND, pPortName: LPSTR): BOOL {
    return Winspool.Load('DeletePortA')(pName, hWnd, pPortName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteport
  public static DeletePortW(pName: LPWSTR | NULL, hWnd: HWND, pPortName: LPWSTR): BOOL {
    return Winspool.Load('DeletePortW')(pName, hWnd, pPortName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprintprocessor
  public static DeletePrintProcessorA(pName: LPSTR | NULL, pEnvironment: LPSTR | NULL, pPrintProcessorName: LPSTR): BOOL {
    return Winspool.Load('DeletePrintProcessorA')(pName, pEnvironment, pPrintProcessorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprintprocessor
  public static DeletePrintProcessorW(pName: LPWSTR | NULL, pEnvironment: LPWSTR | NULL, pPrintProcessorName: LPWSTR): BOOL {
    return Winspool.Load('DeletePrintProcessorW')(pName, pEnvironment, pPrintProcessorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprintprovidor
  public static DeletePrintProvidorA(pName: LPSTR | NULL, pEnvironment: LPSTR | NULL, pPrintProvidorName: LPSTR): BOOL {
    return Winspool.Load('DeletePrintProvidorA')(pName, pEnvironment, pPrintProvidorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprintprovidor
  public static DeletePrintProvidorW(pName: LPWSTR | NULL, pEnvironment: LPWSTR | NULL, pPrintProvidorName: LPWSTR): BOOL {
    return Winspool.Load('DeletePrintProvidorW')(pName, pEnvironment, pPrintProvidorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprinter
  public static DeletePrinter(hPrinter: HANDLE): BOOL {
    return Winspool.Load('DeletePrinter')(hPrinter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprinterconnection
  public static DeletePrinterConnectionA(pName: LPSTR): BOOL {
    return Winspool.Load('DeletePrinterConnectionA')(pName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprinterconnection
  public static DeletePrinterConnectionW(pName: LPWSTR): BOOL {
    return Winspool.Load('DeletePrinterConnectionW')(pName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprinterdata
  public static DeletePrinterDataA(hPrinter: HANDLE, pValueName: LPSTR): DWORD {
    return Winspool.Load('DeletePrinterDataA')(hPrinter, pValueName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprinterdataex
  public static DeletePrinterDataExA(hPrinter: HANDLE, pKeyName: LPCSTR, pValueName: LPCSTR): DWORD {
    return Winspool.Load('DeletePrinterDataExA')(hPrinter, pKeyName, pValueName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprinterdataex
  public static DeletePrinterDataExW(hPrinter: HANDLE, pKeyName: LPCWSTR, pValueName: LPCWSTR): DWORD {
    return Winspool.Load('DeletePrinterDataExW')(hPrinter, pKeyName, pValueName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprinterdata
  public static DeletePrinterDataW(hPrinter: HANDLE, pValueName: LPWSTR): DWORD {
    return Winspool.Load('DeletePrinterDataW')(hPrinter, pValueName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprinterdriver
  public static DeletePrinterDriverA(pName: LPSTR | NULL, pEnvironment: LPSTR | NULL, pDriverName: LPSTR): BOOL {
    return Winspool.Load('DeletePrinterDriverA')(pName, pEnvironment, pDriverName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprinterdriverex
  public static DeletePrinterDriverExA(pName: LPSTR | NULL, pEnvironment: LPSTR | NULL, pDriverName: LPSTR, dwDeleteFlag: DWORD, dwVersionFlag: DWORD): BOOL {
    return Winspool.Load('DeletePrinterDriverExA')(pName, pEnvironment, pDriverName, dwDeleteFlag, dwVersionFlag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprinterdriverex
  public static DeletePrinterDriverExW(pName: LPWSTR | NULL, pEnvironment: LPWSTR | NULL, pDriverName: LPWSTR, dwDeleteFlag: DWORD, dwVersionFlag: DWORD): BOOL {
    return Winspool.Load('DeletePrinterDriverExW')(pName, pEnvironment, pDriverName, dwDeleteFlag, dwVersionFlag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprinterdriverpackage
  public static DeletePrinterDriverPackageA(pszServer: LPCSTR | NULL, pszInfPath: LPCSTR, pszEnvironment: LPCSTR | NULL): HRESULT {
    return Winspool.Load('DeletePrinterDriverPackageA')(pszServer, pszInfPath, pszEnvironment);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprinterdriverpackage
  public static DeletePrinterDriverPackageW(pszServer: LPCWSTR | NULL, pszInfPath: LPCWSTR, pszEnvironment: LPCWSTR | NULL): HRESULT {
    return Winspool.Load('DeletePrinterDriverPackageW')(pszServer, pszInfPath, pszEnvironment);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprinterdriver
  public static DeletePrinterDriverW(pName: LPWSTR | NULL, pEnvironment: LPWSTR | NULL, pDriverName: LPWSTR): BOOL {
    return Winspool.Load('DeletePrinterDriverW')(pName, pEnvironment, pDriverName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprinterkey
  public static DeletePrinterKeyA(hPrinter: HANDLE, pKeyName: LPCSTR): DWORD {
    return Winspool.Load('DeletePrinterKeyA')(hPrinter, pKeyName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprinterkey
  public static DeletePrinterKeyW(hPrinter: HANDLE, pKeyName: LPCWSTR): DWORD {
    return Winspool.Load('DeletePrinterKeyW')(hPrinter, pKeyName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-devicecapabilitiesa
  public static DeviceCapabilitiesA(pDevice: LPCSTR, pPort: LPCSTR, fwCapability: WORD, pOutput: LPSTR | NULL, pDevMode: PDEVMODEA | NULL): INT {
    return Winspool.Load('DeviceCapabilitiesA')(pDevice, pPort, fwCapability, pOutput, pDevMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-devicecapabilitiesw
  public static DeviceCapabilitiesW(pDevice: LPCWSTR, pPort: LPCWSTR, fwCapability: WORD, pOutput: LPWSTR | NULL, pDevMode: PDEVMODEW | NULL): INT {
    return Winspool.Load('DeviceCapabilitiesW')(pDevice, pPort, fwCapability, pOutput, pDevMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/documentproperties
  public static DocumentPropertiesA(hWnd: HWND | 0n, hPrinter: HANDLE, pDeviceName: LPSTR, pDevModeOutput: PDEVMODEA | NULL, pDevModeInput: PDEVMODEA | NULL, fMode: DWORD): LONG {
    return Winspool.Load('DocumentPropertiesA')(hWnd, hPrinter, pDeviceName, pDevModeOutput, pDevModeInput, fMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/documentproperties
  public static DocumentPropertiesW(hWnd: HWND | 0n, hPrinter: HANDLE, pDeviceName: LPWSTR, pDevModeOutput: PDEVMODEW | NULL, pDevModeInput: PDEVMODEW | NULL, fMode: DWORD): LONG {
    return Winspool.Load('DocumentPropertiesW')(hWnd, hPrinter, pDeviceName, pDevModeOutput, pDevModeInput, fMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enddocprinter
  public static EndDocPrinter(hPrinter: HANDLE): BOOL {
    return Winspool.Load('EndDocPrinter')(hPrinter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/endpageprinter
  public static EndPagePrinter(hPrinter: HANDLE): BOOL {
    return Winspool.Load('EndPagePrinter')(hPrinter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumforms
  public static EnumFormsA(hPrinter: HANDLE, Level: DWORD, pForm: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD, pcReturned: LPDWORD): BOOL {
    return Winspool.Load('EnumFormsA')(hPrinter, Level, pForm, cbBuf, pcbNeeded, pcReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumforms
  public static EnumFormsW(hPrinter: HANDLE, Level: DWORD, pForm: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD, pcReturned: LPDWORD): BOOL {
    return Winspool.Load('EnumFormsW')(hPrinter, Level, pForm, cbBuf, pcbNeeded, pcReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumjobnamedproperties
  public static EnumJobNamedProperties(hPrinter: HANDLE, JobId: DWORD, pcProperties: LPDWORD, ppProperties: PPrintNamedProperty): DWORD {
    return Winspool.Load('EnumJobNamedProperties')(hPrinter, JobId, pcProperties, ppProperties);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumjobs
  public static EnumJobsA(hPrinter: HANDLE, FirstJob: DWORD, NoJobs: DWORD, Level: DWORD, pJob: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD, pcReturned: LPDWORD): BOOL {
    return Winspool.Load('EnumJobsA')(hPrinter, FirstJob, NoJobs, Level, pJob, cbBuf, pcbNeeded, pcReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumjobs
  public static EnumJobsW(hPrinter: HANDLE, FirstJob: DWORD, NoJobs: DWORD, Level: DWORD, pJob: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD, pcReturned: LPDWORD): BOOL {
    return Winspool.Load('EnumJobsW')(hPrinter, FirstJob, NoJobs, Level, pJob, cbBuf, pcbNeeded, pcReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enummonitors
  public static EnumMonitorsA(pName: LPSTR | NULL, Level: DWORD, pMonitor: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD, pcReturned: LPDWORD): BOOL {
    return Winspool.Load('EnumMonitorsA')(pName, Level, pMonitor, cbBuf, pcbNeeded, pcReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enummonitors
  public static EnumMonitorsW(pName: LPWSTR | NULL, Level: DWORD, pMonitor: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD, pcReturned: LPDWORD): BOOL {
    return Winspool.Load('EnumMonitorsW')(pName, Level, pMonitor, cbBuf, pcbNeeded, pcReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumports
  public static EnumPortsA(pName: LPSTR | NULL, Level: DWORD, pPorts: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD, pcReturned: LPDWORD): BOOL {
    return Winspool.Load('EnumPortsA')(pName, Level, pPorts, cbBuf, pcbNeeded, pcReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumports
  public static EnumPortsW(pName: LPWSTR | NULL, Level: DWORD, pPorts: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD, pcReturned: LPDWORD): BOOL {
    return Winspool.Load('EnumPortsW')(pName, Level, pPorts, cbBuf, pcbNeeded, pcReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprintprocessordatatypes
  public static EnumPrintProcessorDatatypesA(pName: LPSTR | NULL, pPrintProcessorName: LPSTR, Level: DWORD, pDatatypes: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD, pcReturned: LPDWORD): BOOL {
    return Winspool.Load('EnumPrintProcessorDatatypesA')(pName, pPrintProcessorName, Level, pDatatypes, cbBuf, pcbNeeded, pcReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprintprocessordatatypes
  public static EnumPrintProcessorDatatypesW(pName: LPWSTR | NULL, pPrintProcessorName: LPWSTR, Level: DWORD, pDatatypes: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD, pcReturned: LPDWORD): BOOL {
    return Winspool.Load('EnumPrintProcessorDatatypesW')(pName, pPrintProcessorName, Level, pDatatypes, cbBuf, pcbNeeded, pcReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprintprocessors
  public static EnumPrintProcessorsA(pName: LPSTR | NULL, pEnvironment: LPSTR | NULL, Level: DWORD, pPrintProcessorInfo: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD, pcReturned: LPDWORD): BOOL {
    return Winspool.Load('EnumPrintProcessorsA')(pName, pEnvironment, Level, pPrintProcessorInfo, cbBuf, pcbNeeded, pcReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprintprocessors
  public static EnumPrintProcessorsW(pName: LPWSTR | NULL, pEnvironment: LPWSTR | NULL, Level: DWORD, pPrintProcessorInfo: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD, pcReturned: LPDWORD): BOOL {
    return Winspool.Load('EnumPrintProcessorsW')(pName, pEnvironment, Level, pPrintProcessorInfo, cbBuf, pcbNeeded, pcReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprinterdata
  public static EnumPrinterDataA(hPrinter: HANDLE, dwIndex: DWORD, pValueName: LPSTR, cbValueName: DWORD, pcbValueName: LPDWORD, pType: LPDWORD | NULL, pData: LPBYTE | NULL, cbData: DWORD, pcbData: LPDWORD): DWORD {
    return Winspool.Load('EnumPrinterDataA')(hPrinter, dwIndex, pValueName, cbValueName, pcbValueName, pType, pData, cbData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprinterdataex
  public static EnumPrinterDataExA(hPrinter: HANDLE, pKeyName: LPCSTR, pEnumValues: LPBYTE | NULL, cbEnumValues: DWORD, pcbEnumValues: LPDWORD, pnEnumValues: LPDWORD): DWORD {
    return Winspool.Load('EnumPrinterDataExA')(hPrinter, pKeyName, pEnumValues, cbEnumValues, pcbEnumValues, pnEnumValues);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprinterdataex
  public static EnumPrinterDataExW(hPrinter: HANDLE, pKeyName: LPCWSTR, pEnumValues: LPBYTE | NULL, cbEnumValues: DWORD, pcbEnumValues: LPDWORD, pnEnumValues: LPDWORD): DWORD {
    return Winspool.Load('EnumPrinterDataExW')(hPrinter, pKeyName, pEnumValues, cbEnumValues, pcbEnumValues, pnEnumValues);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprinterdata
  public static EnumPrinterDataW(hPrinter: HANDLE, dwIndex: DWORD, pValueName: LPWSTR, cbValueName: DWORD, pcbValueName: LPDWORD, pType: LPDWORD | NULL, pData: LPBYTE | NULL, cbData: DWORD, pcbData: LPDWORD): DWORD {
    return Winspool.Load('EnumPrinterDataW')(hPrinter, dwIndex, pValueName, cbValueName, pcbValueName, pType, pData, cbData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprinterdrivers
  public static EnumPrinterDriversA(pName: LPSTR | NULL, pEnvironment: LPSTR | NULL, Level: DWORD, pDriverInfo: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD, pcReturned: LPDWORD): BOOL {
    return Winspool.Load('EnumPrinterDriversA')(pName, pEnvironment, Level, pDriverInfo, cbBuf, pcbNeeded, pcReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprinterdrivers
  public static EnumPrinterDriversW(pName: LPWSTR | NULL, pEnvironment: LPWSTR | NULL, Level: DWORD, pDriverInfo: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD, pcReturned: LPDWORD): BOOL {
    return Winspool.Load('EnumPrinterDriversW')(pName, pEnvironment, Level, pDriverInfo, cbBuf, pcbNeeded, pcReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprinterkey
  public static EnumPrinterKeyA(hPrinter: HANDLE, pKeyName: LPCSTR, pSubkey: LPSTR | NULL, cbSubkey: DWORD, pcbSubkey: LPDWORD): DWORD {
    return Winspool.Load('EnumPrinterKeyA')(hPrinter, pKeyName, pSubkey, cbSubkey, pcbSubkey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprinterkey
  public static EnumPrinterKeyW(hPrinter: HANDLE, pKeyName: LPCWSTR, pSubkey: LPWSTR | NULL, cbSubkey: DWORD, pcbSubkey: LPDWORD): DWORD {
    return Winspool.Load('EnumPrinterKeyW')(hPrinter, pKeyName, pSubkey, cbSubkey, pcbSubkey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprinters
  public static EnumPrintersA(Flags: DWORD, Name: LPSTR | NULL, Level: DWORD, pPrinterEnum: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD, pcReturned: LPDWORD): BOOL {
    return Winspool.Load('EnumPrintersA')(Flags, Name, Level, pPrinterEnum, cbBuf, pcbNeeded, pcReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprinters
  public static EnumPrintersW(Flags: DWORD, Name: LPWSTR | NULL, Level: DWORD, pPrinterEnum: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD, pcReturned: LPDWORD): BOOL {
    return Winspool.Load('EnumPrintersW')(Flags, Name, Level, pPrinterEnum, cbBuf, pcbNeeded, pcReturned);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/findcloseprinterchangenotification
  public static FindClosePrinterChangeNotification(hChange: HANDLE): BOOL {
    return Winspool.Load('FindClosePrinterChangeNotification')(hChange);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/findfirstprinterchangenotification
  public static FindFirstPrinterChangeNotification(hPrinter: HANDLE, fdwFilter: DWORD, fdwOptions: DWORD, pPrinterNotifyOptions: PPRINTER_NOTIFY_OPTIONS | NULL): HANDLE {
    return Winspool.Load('FindFirstPrinterChangeNotification')(hPrinter, fdwFilter, fdwOptions, pPrinterNotifyOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/findnextprinterchangenotification
  public static FindNextPrinterChangeNotification(hChange: HANDLE, pdwChange: PDWORD | NULL, pPrinterNotifyOptions: LPVOID | NULL, ppPrinterNotifyInfo: LPVOID | NULL): BOOL {
    return Winspool.Load('FindNextPrinterChangeNotification')(hChange, pdwChange, pPrinterNotifyOptions, ppPrinterNotifyInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/flushprinter
  public static FlushPrinter(hPrinter: HANDLE, pBuf: LPVOID, cbBuf: DWORD, pcWritten: LPDWORD, cSleep: DWORD): BOOL {
    return Winspool.Load('FlushPrinter')(hPrinter, pBuf, cbBuf, pcWritten, cSleep);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/freeprintnamedpropertyarray
  public static FreePrintNamedPropertyArray(cProperties: DWORD, ppProperties: PPrintNamedProperty): void {
    return Winspool.Load('FreePrintNamedPropertyArray')(cProperties, ppProperties);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/freeprintpropertyvalue
  public static FreePrintPropertyValue(pValue: PPrintPropertyValue): void {
    return Winspool.Load('FreePrintPropertyValue')(pValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/freeprinternotifyinfo
  public static FreePrinterNotifyInfo(pPrinterNotifyInfo: PPRINTER_NOTIFY_INFO): BOOL {
    return Winspool.Load('FreePrinterNotifyInfo')(pPrinterNotifyInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getcoreprinterdrivers
  public static GetCorePrinterDriversA(pszServer: LPCSTR | NULL, pszEnvironment: LPCSTR, pszzCoreDriverDependencies: LPCSTR, cCorePrinterDrivers: DWORD, pCorePrinterDrivers: PCORE_PRINTER_DRIVERA): HRESULT {
    return Winspool.Load('GetCorePrinterDriversA')(pszServer, pszEnvironment, pszzCoreDriverDependencies, cCorePrinterDrivers, pCorePrinterDrivers);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getcoreprinterdrivers
  public static GetCorePrinterDriversW(pszServer: LPCWSTR | NULL, pszEnvironment: LPCWSTR, pszzCoreDriverDependencies: LPCWSTR, cCorePrinterDrivers: DWORD, pCorePrinterDrivers: PCORE_PRINTER_DRIVERW): HRESULT {
    return Winspool.Load('GetCorePrinterDriversW')(pszServer, pszEnvironment, pszzCoreDriverDependencies, cCorePrinterDrivers, pCorePrinterDrivers);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getdefaultprinter
  public static GetDefaultPrinterA(pszBuffer: LPSTR | NULL, pcchBuffer: LPDWORD): BOOL {
    return Winspool.Load('GetDefaultPrinterA')(pszBuffer, pcchBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getdefaultprinter
  public static GetDefaultPrinterW(pszBuffer: LPWSTR | NULL, pcchBuffer: LPDWORD): BOOL {
    return Winspool.Load('GetDefaultPrinterW')(pszBuffer, pcchBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getform
  public static GetFormA(hPrinter: HANDLE, pFormName: LPSTR, Level: DWORD, pForm: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD): BOOL {
    return Winspool.Load('GetFormA')(hPrinter, pFormName, Level, pForm, cbBuf, pcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getform
  public static GetFormW(hPrinter: HANDLE, pFormName: LPWSTR, Level: DWORD, pForm: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD): BOOL {
    return Winspool.Load('GetFormW')(hPrinter, pFormName, Level, pForm, cbBuf, pcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getjob
  public static GetJobA(hPrinter: HANDLE, JobId: DWORD, Level: DWORD, pJob: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD): BOOL {
    return Winspool.Load('GetJobA')(hPrinter, JobId, Level, pJob, cbBuf, pcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getjobnamedpropertyvalue
  public static GetJobNamedPropertyValue(hPrinter: HANDLE, JobId: DWORD, pszName: LPCWSTR, pValue: PPrintPropertyValue): DWORD {
    return Winspool.Load('GetJobNamedPropertyValue')(hPrinter, JobId, pszName, pValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getjob
  public static GetJobW(hPrinter: HANDLE, JobId: DWORD, Level: DWORD, pJob: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD): BOOL {
    return Winspool.Load('GetJobW')(hPrinter, JobId, Level, pJob, cbBuf, pcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprintexecutiondata
  public static GetPrintExecutionData(pData: PPRINT_EXECUTION_DATA): BOOL {
    return Winspool.Load('GetPrintExecutionData')(pData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprintoutputinfo
  public static GetPrintOutputInfo(hWnd: HWND, pszPrinter: LPCWSTR, phFile: LPHANDLE, ppszOutputFile: LPVOID): HRESULT {
    return Winspool.Load('GetPrintOutputInfo')(hWnd, pszPrinter, phFile, ppszOutputFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprintprocessordirectory
  public static GetPrintProcessorDirectoryA(pName: LPSTR | NULL, pEnvironment: LPSTR | NULL, Level: DWORD, pPrintProcessorInfo: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD): BOOL {
    return Winspool.Load('GetPrintProcessorDirectoryA')(pName, pEnvironment, Level, pPrintProcessorInfo, cbBuf, pcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprintprocessordirectory
  public static GetPrintProcessorDirectoryW(pName: LPWSTR | NULL, pEnvironment: LPWSTR | NULL, Level: DWORD, pPrintProcessorInfo: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD): BOOL {
    return Winspool.Load('GetPrintProcessorDirectoryW')(pName, pEnvironment, Level, pPrintProcessorInfo, cbBuf, pcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinter
  public static GetPrinterA(hPrinter: HANDLE, Level: DWORD, pPrinter: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD): BOOL {
    return Winspool.Load('GetPrinterA')(hPrinter, Level, pPrinter, cbBuf, pcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinterdata
  public static GetPrinterDataA(hPrinter: HANDLE, pValueName: LPSTR, pType: LPDWORD | NULL, pData: LPBYTE | NULL, nSize: DWORD, pcbNeeded: LPDWORD): DWORD {
    return Winspool.Load('GetPrinterDataA')(hPrinter, pValueName, pType, pData, nSize, pcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinterdataex
  public static GetPrinterDataExA(hPrinter: HANDLE, pKeyName: LPCSTR, pValueName: LPCSTR, pType: LPDWORD | NULL, pData: LPBYTE | NULL, nSize: DWORD, pcbNeeded: LPDWORD): DWORD {
    return Winspool.Load('GetPrinterDataExA')(hPrinter, pKeyName, pValueName, pType, pData, nSize, pcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinterdataex
  public static GetPrinterDataExW(hPrinter: HANDLE, pKeyName: LPCWSTR, pValueName: LPCWSTR, pType: LPDWORD | NULL, pData: LPBYTE | NULL, nSize: DWORD, pcbNeeded: LPDWORD): DWORD {
    return Winspool.Load('GetPrinterDataExW')(hPrinter, pKeyName, pValueName, pType, pData, nSize, pcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinterdata
  public static GetPrinterDataW(hPrinter: HANDLE, pValueName: LPWSTR, pType: LPDWORD | NULL, pData: LPBYTE | NULL, nSize: DWORD, pcbNeeded: LPDWORD): DWORD {
    return Winspool.Load('GetPrinterDataW')(hPrinter, pValueName, pType, pData, nSize, pcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinterdriver
  public static GetPrinterDriverA(hPrinter: HANDLE, pEnvironment: LPSTR | NULL, Level: DWORD, pDriverInfo: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD): BOOL {
    return Winspool.Load('GetPrinterDriverA')(hPrinter, pEnvironment, Level, pDriverInfo, cbBuf, pcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinterdriverdirectory
  public static GetPrinterDriverDirectoryA(pName: LPSTR | NULL, pEnvironment: LPSTR | NULL, Level: DWORD, pDriverDirectory: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD): BOOL {
    return Winspool.Load('GetPrinterDriverDirectoryA')(pName, pEnvironment, Level, pDriverDirectory, cbBuf, pcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinterdriverdirectory
  public static GetPrinterDriverDirectoryW(pName: LPWSTR | NULL, pEnvironment: LPWSTR | NULL, Level: DWORD, pDriverDirectory: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD): BOOL {
    return Winspool.Load('GetPrinterDriverDirectoryW')(pName, pEnvironment, Level, pDriverDirectory, cbBuf, pcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinterdriverpackagepath
  public static GetPrinterDriverPackagePathA(
    pszServer: LPCSTR | NULL,
    pszEnvironment: LPCSTR | NULL,
    pszLanguage: LPCSTR | NULL,
    pszPackageID: LPCSTR,
    pszDriverPackageCab: LPSTR | NULL,
    cchDriverPackageCab: DWORD,
    pcchRequiredSize: LPDWORD,
  ): HRESULT {
    return Winspool.Load('GetPrinterDriverPackagePathA')(pszServer, pszEnvironment, pszLanguage, pszPackageID, pszDriverPackageCab, cchDriverPackageCab, pcchRequiredSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinterdriverpackagepath
  public static GetPrinterDriverPackagePathW(
    pszServer: LPCWSTR | NULL,
    pszEnvironment: LPCWSTR | NULL,
    pszLanguage: LPCWSTR | NULL,
    pszPackageID: LPCWSTR,
    pszDriverPackageCab: LPWSTR | NULL,
    cchDriverPackageCab: DWORD,
    pcchRequiredSize: LPDWORD,
  ): HRESULT {
    return Winspool.Load('GetPrinterDriverPackagePathW')(pszServer, pszEnvironment, pszLanguage, pszPackageID, pszDriverPackageCab, cchDriverPackageCab, pcchRequiredSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinterdriver
  public static GetPrinterDriverW(hPrinter: HANDLE, pEnvironment: LPWSTR | NULL, Level: DWORD, pDriverInfo: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD): BOOL {
    return Winspool.Load('GetPrinterDriverW')(hPrinter, pEnvironment, Level, pDriverInfo, cbBuf, pcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinter
  public static GetPrinterW(hPrinter: HANDLE, Level: DWORD, pPrinter: LPBYTE | NULL, cbBuf: DWORD, pcbNeeded: LPDWORD): BOOL {
    return Winspool.Load('GetPrinterW')(hPrinter, Level, pPrinter, cbBuf, pcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getspoolfilehandle
  public static GetSpoolFileHandle(hPrinter: HANDLE): HANDLE {
    return Winspool.Load('GetSpoolFileHandle')(hPrinter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/installprinterdriverfrompackage
  public static InstallPrinterDriverFromPackageA(pszServer: LPCSTR | NULL, pszInfPath: LPCSTR, pszDriverName: LPCSTR, pszEnvironment: LPCSTR, dwFlags: DWORD): HRESULT {
    return Winspool.Load('InstallPrinterDriverFromPackageA')(pszServer, pszInfPath, pszDriverName, pszEnvironment, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/installprinterdriverfrompackage
  public static InstallPrinterDriverFromPackageW(pszServer: LPCWSTR | NULL, pszInfPath: LPCWSTR, pszDriverName: LPCWSTR, pszEnvironment: LPCWSTR, dwFlags: DWORD): HRESULT {
    return Winspool.Load('InstallPrinterDriverFromPackageW')(pszServer, pszInfPath, pszDriverName, pszEnvironment, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/isvaliddevmode
  public static IsValidDevmodeA(pDevmode: PDEVMODEA, DevmodeSize: SIZE_T): BOOL {
    return Winspool.Load('IsValidDevmodeA')(pDevmode, DevmodeSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/isvaliddevmode
  public static IsValidDevmodeW(pDevmode: PDEVMODEW, DevmodeSize: SIZE_T): BOOL {
    return Winspool.Load('IsValidDevmodeW')(pDevmode, DevmodeSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/openprinter2
  public static OpenPrinter2A(pPrinterName: LPCSTR, phPrinter: LPHANDLE, pDefault: LPPRINTER_DEFAULTSA | NULL, pOptions: PPRINTER_OPTIONSA | NULL): BOOL {
    return Winspool.Load('OpenPrinter2A')(pPrinterName, phPrinter, pDefault, pOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/openprinter2
  public static OpenPrinter2W(pPrinterName: LPCWSTR, phPrinter: LPHANDLE, pDefault: LPPRINTER_DEFAULTSW | NULL, pOptions: PPRINTER_OPTIONSW | NULL): BOOL {
    return Winspool.Load('OpenPrinter2W')(pPrinterName, phPrinter, pDefault, pOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/openprinter
  public static OpenPrinterA(pPrinterName: LPSTR, phPrinter: LPHANDLE, pDefault: LPPRINTER_DEFAULTSA | NULL): BOOL {
    return Winspool.Load('OpenPrinterA')(pPrinterName, phPrinter, pDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/openprinter
  public static OpenPrinterW(pPrinterName: LPWSTR, phPrinter: LPHANDLE, pDefault: LPPRINTER_DEFAULTSW | NULL): BOOL {
    return Winspool.Load('OpenPrinterW')(pPrinterName, phPrinter, pDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/printermessagebox
  public static PrinterMessageBoxA(hPrinter: HANDLE, Error: DWORD, hWnd: HWND, pText: LPSTR, pCaption: LPSTR, dwType: DWORD): DWORD {
    return Winspool.Load('PrinterMessageBoxA')(hPrinter, Error, hWnd, pText, pCaption, dwType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/printermessagebox
  public static PrinterMessageBoxW(hPrinter: HANDLE, Error: DWORD, hWnd: HWND, pText: LPWSTR, pCaption: LPWSTR, dwType: DWORD): DWORD {
    return Winspool.Load('PrinterMessageBoxW')(hPrinter, Error, hWnd, pText, pCaption, dwType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/printerproperties
  public static PrinterProperties(hWnd: HWND, hPrinter: HANDLE): BOOL {
    return Winspool.Load('PrinterProperties')(hWnd, hPrinter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/readprinter
  public static ReadPrinter(hPrinter: HANDLE, pBuf: LPVOID, cbBuf: DWORD, pNoBytesRead: LPDWORD): BOOL {
    return Winspool.Load('ReadPrinter')(hPrinter, pBuf, cbBuf, pNoBytesRead);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prnasnot/nf-prnasnot-registerforprintasyncnotifications
  public static RegisterForPrintAsyncNotifications(pszName: LPCWSTR, pNotificationType: LPVOID, eUserFilter: DWORD, eConversationStyle: DWORD, pCallback: LPVOID, phNotify: LPHANDLE): HRESULT {
    return Winspool.Load('RegisterForPrintAsyncNotifications')(pszName, pNotificationType, eUserFilter, eConversationStyle, pCallback, phNotify);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/reportjobprocessingprogress
  public static ReportJobProcessingProgress(printerHandle: HANDLE, jobId: ULONG, jobOperation: DWORD, jobProgress: DWORD): HRESULT {
    return Winspool.Load('ReportJobProcessingProgress')(printerHandle, jobId, jobOperation, jobProgress);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/resetprinter
  public static ResetPrinterA(hPrinter: HANDLE, pDefault: LPPRINTER_DEFAULTSA | NULL): BOOL {
    return Winspool.Load('ResetPrinterA')(hPrinter, pDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/resetprinter
  public static ResetPrinterW(hPrinter: HANDLE, pDefault: LPPRINTER_DEFAULTSW | NULL): BOOL {
    return Winspool.Load('ResetPrinterW')(hPrinter, pDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/schedulejob
  public static ScheduleJob(hPrinter: HANDLE, JobId: DWORD): BOOL {
    return Winspool.Load('ScheduleJob')(hPrinter, JobId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/seekprinter
  public static SeekPrinter(hPrinter: HANDLE, liDistanceToMove: LARGE_INTEGER, pliNewPointer: PLARGE_INTEGER | NULL, dwMoveMethod: DWORD, bWrite: BOOL): BOOL {
    return Winspool.Load('SeekPrinter')(hPrinter, liDistanceToMove, pliNewPointer, dwMoveMethod, bWrite);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setdefaultprinter
  public static SetDefaultPrinterA(pszPrinter: LPCSTR): BOOL {
    return Winspool.Load('SetDefaultPrinterA')(pszPrinter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setdefaultprinter
  public static SetDefaultPrinterW(pszPrinter: LPCWSTR): BOOL {
    return Winspool.Load('SetDefaultPrinterW')(pszPrinter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setform
  public static SetFormA(hPrinter: HANDLE, pFormName: LPSTR, Level: DWORD, pForm: LPBYTE): BOOL {
    return Winspool.Load('SetFormA')(hPrinter, pFormName, Level, pForm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setform
  public static SetFormW(hPrinter: HANDLE, pFormName: LPWSTR, Level: DWORD, pForm: LPBYTE): BOOL {
    return Winspool.Load('SetFormW')(hPrinter, pFormName, Level, pForm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setjob
  public static SetJobA(hPrinter: HANDLE, JobId: DWORD, Level: DWORD, pJob: LPBYTE | NULL, Command: DWORD): BOOL {
    return Winspool.Load('SetJobA')(hPrinter, JobId, Level, pJob, Command);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setjobnamedproperty
  public static SetJobNamedProperty(hPrinter: HANDLE, JobId: DWORD, pProperty: PPrintNamedProperty): DWORD {
    return Winspool.Load('SetJobNamedProperty')(hPrinter, JobId, pProperty);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setjob
  public static SetJobW(hPrinter: HANDLE, JobId: DWORD, Level: DWORD, pJob: LPBYTE | NULL, Command: DWORD): BOOL {
    return Winspool.Load('SetJobW')(hPrinter, JobId, Level, pJob, Command);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setport
  public static SetPortA(pName: LPSTR, pPortName: LPSTR, dwLevel: DWORD, pPortInfo: LPBYTE): BOOL {
    return Winspool.Load('SetPortA')(pName, pPortName, dwLevel, pPortInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setport
  public static SetPortW(pName: LPWSTR, pPortName: LPWSTR, dwLevel: DWORD, pPortInfo: LPBYTE): BOOL {
    return Winspool.Load('SetPortW')(pName, pPortName, dwLevel, pPortInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setprinter
  public static SetPrinterA(hPrinter: HANDLE, Level: DWORD, pPrinter: LPBYTE | NULL, Command: DWORD): BOOL {
    return Winspool.Load('SetPrinterA')(hPrinter, Level, pPrinter, Command);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setprinterdata
  public static SetPrinterDataA(hPrinter: HANDLE, pValueName: LPSTR, Type: DWORD, pData: LPBYTE, cbData: DWORD): DWORD {
    return Winspool.Load('SetPrinterDataA')(hPrinter, pValueName, Type, pData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setprinterdataex
  public static SetPrinterDataExA(hPrinter: HANDLE, pKeyName: LPCSTR, pValueName: LPCSTR, Type: DWORD, pData: LPBYTE, cbData: DWORD): DWORD {
    return Winspool.Load('SetPrinterDataExA')(hPrinter, pKeyName, pValueName, Type, pData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setprinterdataex
  public static SetPrinterDataExW(hPrinter: HANDLE, pKeyName: LPCWSTR, pValueName: LPCWSTR, Type: DWORD, pData: LPBYTE, cbData: DWORD): DWORD {
    return Winspool.Load('SetPrinterDataExW')(hPrinter, pKeyName, pValueName, Type, pData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setprinterdata
  public static SetPrinterDataW(hPrinter: HANDLE, pValueName: LPWSTR, Type: DWORD, pData: LPBYTE, cbData: DWORD): DWORD {
    return Winspool.Load('SetPrinterDataW')(hPrinter, pValueName, Type, pData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setprinter
  public static SetPrinterW(hPrinter: HANDLE, Level: DWORD, pPrinter: LPBYTE | NULL, Command: DWORD): BOOL {
    return Winspool.Load('SetPrinterW')(hPrinter, Level, pPrinter, Command);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/startdocprinter
  public static StartDocPrinterA(hPrinter: HANDLE, Level: DWORD, pDocInfo: LPBYTE): DWORD {
    return Winspool.Load('StartDocPrinterA')(hPrinter, Level, pDocInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/startdocprinter
  public static StartDocPrinterW(hPrinter: HANDLE, Level: DWORD, pDocInfo: LPBYTE): DWORD {
    return Winspool.Load('StartDocPrinterW')(hPrinter, Level, pDocInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/startpageprinter
  public static StartPagePrinter(hPrinter: HANDLE): BOOL {
    return Winspool.Load('StartPagePrinter')(hPrinter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prnasnot/nf-prnasnot-unregisterforprintasyncnotifications
  public static UnRegisterForPrintAsyncNotifications(hNotify: HANDLE): HRESULT {
    return Winspool.Load('UnRegisterForPrintAsyncNotifications')(hNotify);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/uploadprinterdriverpackage
  public static UploadPrinterDriverPackageA(pszServer: LPCSTR | NULL, pszInfPath: LPCSTR, pszEnvironment: LPCSTR, dwFlags: DWORD, hwnd: HWND | 0n, pszDestInfPath: LPSTR, pcchDestInfPath: LPDWORD): HRESULT {
    return Winspool.Load('UploadPrinterDriverPackageA')(pszServer, pszInfPath, pszEnvironment, dwFlags, hwnd, pszDestInfPath, pcchDestInfPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/uploadprinterdriverpackage
  public static UploadPrinterDriverPackageW(pszServer: LPCWSTR | NULL, pszInfPath: LPCWSTR, pszEnvironment: LPCWSTR, dwFlags: DWORD, hwnd: HWND | 0n, pszDestInfPath: LPWSTR, pcchDestInfPath: LPDWORD): HRESULT {
    return Winspool.Load('UploadPrinterDriverPackageW')(pszServer, pszInfPath, pszEnvironment, dwFlags, hwnd, pszDestInfPath, pcchDestInfPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/waitforprinterchange
  public static WaitForPrinterChange(hPrinter: HANDLE, Flags: DWORD): DWORD {
    return Winspool.Load('WaitForPrinterChange')(hPrinter, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/writeprinter
  public static WritePrinter(hPrinter: HANDLE, pBuf: LPVOID, cbBuf: DWORD, pcWritten: LPDWORD): BOOL {
    return Winspool.Load('WritePrinter')(hPrinter, pBuf, cbBuf, pcWritten);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/xcvdata
  public static XcvDataW(hXcv: HANDLE, pszDataName: LPCWSTR, pInputData: PBYTE, cbInputData: DWORD, pOutputData: PBYTE, cbOutputData: DWORD, pcbOutputNeeded: PDWORD, pdwStatus: PDWORD): BOOL {
    return Winspool.Load('XcvDataW')(hXcv, pszDataName, pInputData, cbInputData, pOutputData, cbOutputData, pcbOutputNeeded, pdwStatus);
  }
}

export default Winspool;
