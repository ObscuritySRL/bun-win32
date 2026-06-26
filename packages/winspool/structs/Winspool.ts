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
  Nullable,
  Optional,
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
  public static AddJobA(hPrinter: HANDLE, Level: DWORD, pData_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD): BOOL {
    return Winspool.Load('AddJobA')(hPrinter, Level, pData_out, cbBuf, pcbNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addjob
  public static AddJobW(hPrinter: HANDLE, Level: DWORD, pData_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD): BOOL {
    return Winspool.Load('AddJobW')(hPrinter, Level, pData_out, cbBuf, pcbNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addmonitor
  public static AddMonitorA(pName: Optional<LPSTR>, Level: DWORD, pMonitorInfo: Optional<LPBYTE>): BOOL {
    return Winspool.Load('AddMonitorA')(pName, Level, pMonitorInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addmonitor
  public static AddMonitorW(pName: Optional<LPWSTR>, Level: DWORD, pMonitorInfo: Optional<LPBYTE>): BOOL {
    return Winspool.Load('AddMonitorW')(pName, Level, pMonitorInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addport
  public static AddPortA(pName: Optional<LPSTR>, hWnd: HWND, pMonitorName: LPSTR): BOOL {
    return Winspool.Load('AddPortA')(pName, hWnd, pMonitorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addportex
  public static AddPortExA(pName: Optional<LPSTR>, dwLevel: DWORD, lpBuffer: LPBYTE, lpMonitorName: LPSTR): BOOL {
    return Winspool.Load('AddPortExA')(pName, dwLevel, lpBuffer, lpMonitorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addportex
  public static AddPortExW(pName: Optional<LPWSTR>, dwLevel: DWORD, lpBuffer: LPBYTE, lpMonitorName: LPWSTR): BOOL {
    return Winspool.Load('AddPortExW')(pName, dwLevel, lpBuffer, lpMonitorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addport
  public static AddPortW(pName: Optional<LPWSTR>, hWnd: HWND, pMonitorName: LPWSTR): BOOL {
    return Winspool.Load('AddPortW')(pName, hWnd, pMonitorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprintprocessor
  public static AddPrintProcessorA(pName: Optional<LPSTR>, pEnvironment: Optional<LPSTR>, pPathName: LPSTR, pPrintProcessorName: LPSTR): BOOL {
    return Winspool.Load('AddPrintProcessorA')(pName, pEnvironment, pPathName, pPrintProcessorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprintprocessor
  public static AddPrintProcessorW(pName: Optional<LPWSTR>, pEnvironment: Optional<LPWSTR>, pPathName: LPWSTR, pPrintProcessorName: LPWSTR): BOOL {
    return Winspool.Load('AddPrintProcessorW')(pName, pEnvironment, pPathName, pPrintProcessorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprintprovidor
  public static AddPrintProvidorA(pName: Optional<LPSTR>, Level: DWORD, pProviderInfo: LPBYTE): BOOL {
    return Winspool.Load('AddPrintProvidorA')(pName, Level, pProviderInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprintprovidor
  public static AddPrintProvidorW(pName: Optional<LPWSTR>, Level: DWORD, pProviderInfo: LPBYTE): BOOL {
    return Winspool.Load('AddPrintProvidorW')(pName, Level, pProviderInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprinter
  public static AddPrinterA(pName: Optional<LPSTR>, Level: DWORD, pPrinter: LPBYTE): HANDLE {
    return Winspool.Load('AddPrinterA')(pName, Level, pPrinter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprinterconnection2
  public static AddPrinterConnection2A(hWnd: Optional<HWND>, pszName: LPCSTR, dwLevel: DWORD, pConnectionInfo: PVOID): BOOL {
    return Winspool.Load('AddPrinterConnection2A')(hWnd, pszName, dwLevel, pConnectionInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprinterconnection2
  public static AddPrinterConnection2W(hWnd: Optional<HWND>, pszName: LPCWSTR, dwLevel: DWORD, pConnectionInfo: PVOID): BOOL {
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
  public static AddPrinterDriverA(pName: Optional<LPSTR>, Level: DWORD, pDriverInfo: LPBYTE): BOOL {
    return Winspool.Load('AddPrinterDriverA')(pName, Level, pDriverInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprinterdriverex
  public static AddPrinterDriverExA(pName: Optional<LPSTR>, Level: DWORD, pDriverInfo: LPBYTE, dwFileCopyFlags: DWORD): BOOL {
    return Winspool.Load('AddPrinterDriverExA')(pName, Level, pDriverInfo, dwFileCopyFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprinterdriverex
  public static AddPrinterDriverExW(pName: Optional<LPWSTR>, Level: DWORD, pDriverInfo: LPBYTE, dwFileCopyFlags: DWORD): BOOL {
    return Winspool.Load('AddPrinterDriverExW')(pName, Level, pDriverInfo, dwFileCopyFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprinterdriver
  public static AddPrinterDriverW(pName: Optional<LPWSTR>, Level: DWORD, pDriverInfo: LPBYTE): BOOL {
    return Winspool.Load('AddPrinterDriverW')(pName, Level, pDriverInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/addprinter
  public static AddPrinterW(pName: Optional<LPWSTR>, Level: DWORD, pPrinter: LPBYTE): HANDLE {
    return Winspool.Load('AddPrinterW')(pName, Level, pPrinter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/advanceddocumentproperties
  public static AdvancedDocumentPropertiesA(hWnd: HWND, hPrinter: HANDLE, pDeviceName: LPSTR, pDevModeOutput_in_out: Optional<PDEVMODEA>, pDevModeInput: Optional<PDEVMODEA>): LONG {
    return Winspool.Load('AdvancedDocumentPropertiesA')(hWnd, hPrinter, pDeviceName, pDevModeOutput_in_out, pDevModeInput);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/advanceddocumentproperties
  public static AdvancedDocumentPropertiesW(hWnd: HWND, hPrinter: HANDLE, pDeviceName: LPWSTR, pDevModeOutput_in_out: Optional<PDEVMODEW>, pDevModeInput: Optional<PDEVMODEW>): LONG {
    return Winspool.Load('AdvancedDocumentPropertiesW')(hWnd, hPrinter, pDeviceName, pDevModeOutput_in_out, pDevModeInput);
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
  public static ConfigurePortA(pName: Optional<LPSTR>, hWnd: HWND, pPortName: LPSTR): BOOL {
    return Winspool.Load('ConfigurePortA')(pName, hWnd, pPortName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/configureport
  public static ConfigurePortW(pName: Optional<LPWSTR>, hWnd: HWND, pPortName: LPWSTR): BOOL {
    return Winspool.Load('ConfigurePortW')(pName, hWnd, pPortName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/connecttoprinterdlg
  public static ConnectToPrinterDlg(hwnd: HWND, Flags: DWORD): HANDLE {
    return Winspool.Load('ConnectToPrinterDlg')(hwnd, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/coreprinterdriverinstalled
  public static CorePrinterDriverInstalledA(pszServer: Optional<LPCSTR>, pszEnvironment: Optional<LPCSTR>, CoreDriverGUID: LPVOID, ftDriverDate: FILETIME, dwlDriverVersion: DWORDLONG, pbDriverInstalled_out: PBOOL): HRESULT {
    return Winspool.Load('CorePrinterDriverInstalledA')(pszServer, pszEnvironment, CoreDriverGUID, ftDriverDate, dwlDriverVersion, pbDriverInstalled_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/coreprinterdriverinstalled
  public static CorePrinterDriverInstalledW(pszServer: Optional<LPCWSTR>, pszEnvironment: Optional<LPCWSTR>, CoreDriverGUID: LPVOID, ftDriverDate: FILETIME, dwlDriverVersion: DWORDLONG, pbDriverInstalled_out: PBOOL): HRESULT {
    return Winspool.Load('CorePrinterDriverInstalledW')(pszServer, pszEnvironment, CoreDriverGUID, ftDriverDate, dwlDriverVersion, pbDriverInstalled_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prnasnot/nf-prnasnot-createprintasyncnotifychannel
  public static CreatePrintAsyncNotifyChannel(pszName: Optional<LPCWSTR>, pNotificationType: LPVOID, eUserFilter: DWORD, eConversationStyle: DWORD, pCallback: Optional<LPVOID>, ppIAsynchNotification_out: LPVOID): HRESULT {
    return Winspool.Load('CreatePrintAsyncNotifyChannel')(pszName, pNotificationType, eUserFilter, eConversationStyle, pCallback, ppIAsynchNotification_out);
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
  public static DeleteMonitorA(pName: Optional<LPSTR>, pEnvironment: Optional<LPSTR>, pMonitorName: LPSTR): BOOL {
    return Winspool.Load('DeleteMonitorA')(pName, pEnvironment, pMonitorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deletemonitor
  public static DeleteMonitorW(pName: Optional<LPWSTR>, pEnvironment: Optional<LPWSTR>, pMonitorName: LPWSTR): BOOL {
    return Winspool.Load('DeleteMonitorW')(pName, pEnvironment, pMonitorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteport
  public static DeletePortA(pName: Optional<LPSTR>, hWnd: HWND, pPortName: LPSTR): BOOL {
    return Winspool.Load('DeletePortA')(pName, hWnd, pPortName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteport
  public static DeletePortW(pName: Optional<LPWSTR>, hWnd: HWND, pPortName: LPWSTR): BOOL {
    return Winspool.Load('DeletePortW')(pName, hWnd, pPortName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprintprocessor
  public static DeletePrintProcessorA(pName: Optional<LPSTR>, pEnvironment: Optional<LPSTR>, pPrintProcessorName: LPSTR): BOOL {
    return Winspool.Load('DeletePrintProcessorA')(pName, pEnvironment, pPrintProcessorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprintprocessor
  public static DeletePrintProcessorW(pName: Optional<LPWSTR>, pEnvironment: Optional<LPWSTR>, pPrintProcessorName: LPWSTR): BOOL {
    return Winspool.Load('DeletePrintProcessorW')(pName, pEnvironment, pPrintProcessorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprintprovidor
  public static DeletePrintProvidorA(pName: Optional<LPSTR>, pEnvironment: Optional<LPSTR>, pPrintProvidorName: LPSTR): BOOL {
    return Winspool.Load('DeletePrintProvidorA')(pName, pEnvironment, pPrintProvidorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprintprovidor
  public static DeletePrintProvidorW(pName: Optional<LPWSTR>, pEnvironment: Optional<LPWSTR>, pPrintProvidorName: LPWSTR): BOOL {
    return Winspool.Load('DeletePrintProvidorW')(pName, pEnvironment, pPrintProvidorName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprinter
  public static DeletePrinter(hPrinter_in_out: HANDLE): BOOL {
    return Winspool.Load('DeletePrinter')(hPrinter_in_out);
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
  public static DeletePrinterDriverA(pName: Optional<LPSTR>, pEnvironment: Optional<LPSTR>, pDriverName: LPSTR): BOOL {
    return Winspool.Load('DeletePrinterDriverA')(pName, pEnvironment, pDriverName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprinterdriverex
  public static DeletePrinterDriverExA(pName: Optional<LPSTR>, pEnvironment: Optional<LPSTR>, pDriverName: LPSTR, dwDeleteFlag: DWORD, dwVersionFlag: DWORD): BOOL {
    return Winspool.Load('DeletePrinterDriverExA')(pName, pEnvironment, pDriverName, dwDeleteFlag, dwVersionFlag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprinterdriverex
  public static DeletePrinterDriverExW(pName: Optional<LPWSTR>, pEnvironment: Optional<LPWSTR>, pDriverName: LPWSTR, dwDeleteFlag: DWORD, dwVersionFlag: DWORD): BOOL {
    return Winspool.Load('DeletePrinterDriverExW')(pName, pEnvironment, pDriverName, dwDeleteFlag, dwVersionFlag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprinterdriverpackage
  public static DeletePrinterDriverPackageA(pszServer: Optional<LPCSTR>, pszInfPath: LPCSTR, pszEnvironment: Optional<LPCSTR>): HRESULT {
    return Winspool.Load('DeletePrinterDriverPackageA')(pszServer, pszInfPath, pszEnvironment);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprinterdriverpackage
  public static DeletePrinterDriverPackageW(pszServer: Optional<LPCWSTR>, pszInfPath: LPCWSTR, pszEnvironment: Optional<LPCWSTR>): HRESULT {
    return Winspool.Load('DeletePrinterDriverPackageW')(pszServer, pszInfPath, pszEnvironment);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/deleteprinterdriver
  public static DeletePrinterDriverW(pName: Optional<LPWSTR>, pEnvironment: Optional<LPWSTR>, pDriverName: LPWSTR): BOOL {
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
  public static DeviceCapabilitiesA(pDevice: LPCSTR, pPort: Optional<LPCSTR>, fwCapability: WORD, pOutput_out: Optional<LPSTR>, pDevMode: Optional<PDEVMODEA>): INT {
    return Winspool.Load('DeviceCapabilitiesA')(pDevice, pPort, fwCapability, pOutput_out, pDevMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-devicecapabilitiesw
  public static DeviceCapabilitiesW(pDevice: LPCWSTR, pPort: Optional<LPCWSTR>, fwCapability: WORD, pOutput_out: Optional<LPWSTR>, pDevMode: Optional<PDEVMODEW>): INT {
    return Winspool.Load('DeviceCapabilitiesW')(pDevice, pPort, fwCapability, pOutput_out, pDevMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/documentproperties
  public static DocumentPropertiesA(hWnd: Optional<HWND>, hPrinter: HANDLE, pDeviceName: LPSTR, pDevModeOutput_out: Optional<PDEVMODEA>, pDevModeInput: Optional<PDEVMODEA>, fMode: DWORD): LONG {
    return Winspool.Load('DocumentPropertiesA')(hWnd, hPrinter, pDeviceName, pDevModeOutput_out, pDevModeInput, fMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/documentproperties
  public static DocumentPropertiesW(hWnd: Optional<HWND>, hPrinter: HANDLE, pDeviceName: LPWSTR, pDevModeOutput_out: Optional<PDEVMODEW>, pDevModeInput: Optional<PDEVMODEW>, fMode: DWORD): LONG {
    return Winspool.Load('DocumentPropertiesW')(hWnd, hPrinter, pDeviceName, pDevModeOutput_out, pDevModeInput, fMode);
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
  public static EnumFormsA(hPrinter: HANDLE, Level: DWORD, pForm_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD, pcReturned_out: LPDWORD): BOOL {
    return Winspool.Load('EnumFormsA')(hPrinter, Level, pForm_out, cbBuf, pcbNeeded_out, pcReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumforms
  public static EnumFormsW(hPrinter: HANDLE, Level: DWORD, pForm_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD, pcReturned_out: LPDWORD): BOOL {
    return Winspool.Load('EnumFormsW')(hPrinter, Level, pForm_out, cbBuf, pcbNeeded_out, pcReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumjobnamedproperties
  public static EnumJobNamedProperties(hPrinter: HANDLE, JobId: DWORD, pcProperties_out: LPDWORD, ppProperties_out: PPrintNamedProperty): DWORD {
    return Winspool.Load('EnumJobNamedProperties')(hPrinter, JobId, pcProperties_out, ppProperties_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumjobs
  public static EnumJobsA(hPrinter: HANDLE, FirstJob: DWORD, NoJobs: DWORD, Level: DWORD, pJob_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD, pcReturned_out: LPDWORD): BOOL {
    return Winspool.Load('EnumJobsA')(hPrinter, FirstJob, NoJobs, Level, pJob_out, cbBuf, pcbNeeded_out, pcReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumjobs
  public static EnumJobsW(hPrinter: HANDLE, FirstJob: DWORD, NoJobs: DWORD, Level: DWORD, pJob_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD, pcReturned_out: LPDWORD): BOOL {
    return Winspool.Load('EnumJobsW')(hPrinter, FirstJob, NoJobs, Level, pJob_out, cbBuf, pcbNeeded_out, pcReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enummonitors
  public static EnumMonitorsA(pName: Optional<LPSTR>, Level: DWORD, pMonitor_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD, pcReturned_out: LPDWORD): BOOL {
    return Winspool.Load('EnumMonitorsA')(pName, Level, pMonitor_out, cbBuf, pcbNeeded_out, pcReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enummonitors
  public static EnumMonitorsW(pName: Optional<LPWSTR>, Level: DWORD, pMonitor_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD, pcReturned_out: LPDWORD): BOOL {
    return Winspool.Load('EnumMonitorsW')(pName, Level, pMonitor_out, cbBuf, pcbNeeded_out, pcReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumports
  public static EnumPortsA(pName: Optional<LPSTR>, Level: DWORD, pPorts_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD, pcReturned_out: LPDWORD): BOOL {
    return Winspool.Load('EnumPortsA')(pName, Level, pPorts_out, cbBuf, pcbNeeded_out, pcReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumports
  public static EnumPortsW(pName: Optional<LPWSTR>, Level: DWORD, pPorts_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD, pcReturned_out: LPDWORD): BOOL {
    return Winspool.Load('EnumPortsW')(pName, Level, pPorts_out, cbBuf, pcbNeeded_out, pcReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprintprocessordatatypes
  public static EnumPrintProcessorDatatypesA(pName: Optional<LPSTR>, pPrintProcessorName: LPSTR, Level: DWORD, pDatatypes_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD, pcReturned_out: LPDWORD): BOOL {
    return Winspool.Load('EnumPrintProcessorDatatypesA')(pName, pPrintProcessorName, Level, pDatatypes_out, cbBuf, pcbNeeded_out, pcReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprintprocessordatatypes
  public static EnumPrintProcessorDatatypesW(pName: Optional<LPWSTR>, pPrintProcessorName: LPWSTR, Level: DWORD, pDatatypes_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD, pcReturned_out: LPDWORD): BOOL {
    return Winspool.Load('EnumPrintProcessorDatatypesW')(pName, pPrintProcessorName, Level, pDatatypes_out, cbBuf, pcbNeeded_out, pcReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprintprocessors
  public static EnumPrintProcessorsA(pName: Optional<LPSTR>, pEnvironment: Optional<LPSTR>, Level: DWORD, pPrintProcessorInfo_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD, pcReturned_out: LPDWORD): BOOL {
    return Winspool.Load('EnumPrintProcessorsA')(pName, pEnvironment, Level, pPrintProcessorInfo_out, cbBuf, pcbNeeded_out, pcReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprintprocessors
  public static EnumPrintProcessorsW(pName: Optional<LPWSTR>, pEnvironment: Optional<LPWSTR>, Level: DWORD, pPrintProcessorInfo_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD, pcReturned_out: LPDWORD): BOOL {
    return Winspool.Load('EnumPrintProcessorsW')(pName, pEnvironment, Level, pPrintProcessorInfo_out, cbBuf, pcbNeeded_out, pcReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprinterdata
  public static EnumPrinterDataA(
    hPrinter: HANDLE,
    dwIndex: DWORD,
    pValueName_out: LPSTR,
    cbValueName: DWORD,
    pcbValueName_out: LPDWORD,
    pType_out: Optional<LPDWORD>,
    pData_out: Optional<LPBYTE>,
    cbData: DWORD,
    pcbData_out: Optional<LPDWORD>,
  ): DWORD {
    return Winspool.Load('EnumPrinterDataA')(hPrinter, dwIndex, pValueName_out, cbValueName, pcbValueName_out, pType_out, pData_out, cbData, pcbData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprinterdataex
  public static EnumPrinterDataExA(hPrinter: HANDLE, pKeyName: LPCSTR, pEnumValues_out: Optional<LPBYTE>, cbEnumValues: DWORD, pcbEnumValues_out: LPDWORD, pnEnumValues_out: LPDWORD): DWORD {
    return Winspool.Load('EnumPrinterDataExA')(hPrinter, pKeyName, pEnumValues_out, cbEnumValues, pcbEnumValues_out, pnEnumValues_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprinterdataex
  public static EnumPrinterDataExW(hPrinter: HANDLE, pKeyName: LPCWSTR, pEnumValues_out: Optional<LPBYTE>, cbEnumValues: DWORD, pcbEnumValues_out: LPDWORD, pnEnumValues_out: LPDWORD): DWORD {
    return Winspool.Load('EnumPrinterDataExW')(hPrinter, pKeyName, pEnumValues_out, cbEnumValues, pcbEnumValues_out, pnEnumValues_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprinterdata
  public static EnumPrinterDataW(
    hPrinter: HANDLE,
    dwIndex: DWORD,
    pValueName_out: LPWSTR,
    cbValueName: DWORD,
    pcbValueName_out: LPDWORD,
    pType_out: Optional<LPDWORD>,
    pData_out: Optional<LPBYTE>,
    cbData: DWORD,
    pcbData_out: Optional<LPDWORD>,
  ): DWORD {
    return Winspool.Load('EnumPrinterDataW')(hPrinter, dwIndex, pValueName_out, cbValueName, pcbValueName_out, pType_out, pData_out, cbData, pcbData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprinterdrivers
  public static EnumPrinterDriversA(pName: Optional<LPSTR>, pEnvironment: Optional<LPSTR>, Level: DWORD, pDriverInfo_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD, pcReturned_out: LPDWORD): BOOL {
    return Winspool.Load('EnumPrinterDriversA')(pName, pEnvironment, Level, pDriverInfo_out, cbBuf, pcbNeeded_out, pcReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprinterdrivers
  public static EnumPrinterDriversW(pName: Optional<LPWSTR>, pEnvironment: Optional<LPWSTR>, Level: DWORD, pDriverInfo_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD, pcReturned_out: LPDWORD): BOOL {
    return Winspool.Load('EnumPrinterDriversW')(pName, pEnvironment, Level, pDriverInfo_out, cbBuf, pcbNeeded_out, pcReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprinterkey
  public static EnumPrinterKeyA(hPrinter: HANDLE, pKeyName: LPCSTR, pSubkey_out: Optional<LPSTR>, cbSubkey: DWORD, pcbSubkey_out: LPDWORD): DWORD {
    return Winspool.Load('EnumPrinterKeyA')(hPrinter, pKeyName, pSubkey_out, cbSubkey, pcbSubkey_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprinterkey
  public static EnumPrinterKeyW(hPrinter: HANDLE, pKeyName: LPCWSTR, pSubkey_out: Optional<LPWSTR>, cbSubkey: DWORD, pcbSubkey_out: LPDWORD): DWORD {
    return Winspool.Load('EnumPrinterKeyW')(hPrinter, pKeyName, pSubkey_out, cbSubkey, pcbSubkey_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprinters
  public static EnumPrintersA(Flags: DWORD, Name: Optional<LPSTR>, Level: DWORD, pPrinterEnum_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD, pcReturned_out: LPDWORD): BOOL {
    return Winspool.Load('EnumPrintersA')(Flags, Name, Level, pPrinterEnum_out, cbBuf, pcbNeeded_out, pcReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/enumprinters
  public static EnumPrintersW(Flags: DWORD, Name: Optional<LPWSTR>, Level: DWORD, pPrinterEnum_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD, pcReturned_out: LPDWORD): BOOL {
    return Winspool.Load('EnumPrintersW')(Flags, Name, Level, pPrinterEnum_out, cbBuf, pcbNeeded_out, pcReturned_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/findcloseprinterchangenotification
  public static FindClosePrinterChangeNotification(hChange: HANDLE): BOOL {
    return Winspool.Load('FindClosePrinterChangeNotification')(hChange);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/findfirstprinterchangenotification
  public static FindFirstPrinterChangeNotification(hPrinter: HANDLE, fdwFilter: DWORD, fdwOptions: DWORD, pPrinterNotifyOptions: Optional<PPRINTER_NOTIFY_OPTIONS>): HANDLE {
    return Winspool.Load('FindFirstPrinterChangeNotification')(hPrinter, fdwFilter, fdwOptions, pPrinterNotifyOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/findnextprinterchangenotification
  public static FindNextPrinterChangeNotification(hChange: HANDLE, pdwChange_out: Optional<PDWORD>, pPrinterNotifyOptions: Optional<LPVOID>, ppPrinterNotifyInfo_out: Optional<LPVOID>): BOOL {
    return Winspool.Load('FindNextPrinterChangeNotification')(hChange, pdwChange_out, pPrinterNotifyOptions, ppPrinterNotifyInfo_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/flushprinter
  public static FlushPrinter(hPrinter: HANDLE, pBuf: Optional<LPVOID>, cbBuf: DWORD, pcWritten_out: LPDWORD, cSleep: DWORD): BOOL {
    return Winspool.Load('FlushPrinter')(hPrinter, pBuf, cbBuf, pcWritten_out, cSleep);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/freeprintnamedpropertyarray
  public static FreePrintNamedPropertyArray(cProperties: DWORD, ppProperties_in_out: Optional<PPrintNamedProperty>): void {
    return Winspool.Load('FreePrintNamedPropertyArray')(cProperties, ppProperties_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/freeprintpropertyvalue
  public static FreePrintPropertyValue(pValue_in_out: PPrintPropertyValue): void {
    return Winspool.Load('FreePrintPropertyValue')(pValue_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/freeprinternotifyinfo
  public static FreePrinterNotifyInfo(pPrinterNotifyInfo: PPRINTER_NOTIFY_INFO): BOOL {
    return Winspool.Load('FreePrinterNotifyInfo')(pPrinterNotifyInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getcoreprinterdrivers
  public static GetCorePrinterDriversA(pszServer: Optional<LPCSTR>, pszEnvironment: Optional<LPCSTR>, pszzCoreDriverDependencies: LPCSTR, cCorePrinterDrivers: DWORD, pCorePrinterDrivers_out: PCORE_PRINTER_DRIVERA): HRESULT {
    return Winspool.Load('GetCorePrinterDriversA')(pszServer, pszEnvironment, pszzCoreDriverDependencies, cCorePrinterDrivers, pCorePrinterDrivers_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getcoreprinterdrivers
  public static GetCorePrinterDriversW(pszServer: Optional<LPCWSTR>, pszEnvironment: Optional<LPCWSTR>, pszzCoreDriverDependencies: LPCWSTR, cCorePrinterDrivers: DWORD, pCorePrinterDrivers_out: PCORE_PRINTER_DRIVERW): HRESULT {
    return Winspool.Load('GetCorePrinterDriversW')(pszServer, pszEnvironment, pszzCoreDriverDependencies, cCorePrinterDrivers, pCorePrinterDrivers_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getdefaultprinter
  public static GetDefaultPrinterA(pszBuffer_out: Optional<LPSTR>, pcchBuffer_in_out: LPDWORD): BOOL {
    return Winspool.Load('GetDefaultPrinterA')(pszBuffer_out, pcchBuffer_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getdefaultprinter
  public static GetDefaultPrinterW(pszBuffer_out: Optional<LPWSTR>, pcchBuffer_in_out: LPDWORD): BOOL {
    return Winspool.Load('GetDefaultPrinterW')(pszBuffer_out, pcchBuffer_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getform
  public static GetFormA(hPrinter: HANDLE, pFormName: LPSTR, Level: DWORD, pForm_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD): BOOL {
    return Winspool.Load('GetFormA')(hPrinter, pFormName, Level, pForm_out, cbBuf, pcbNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getform
  public static GetFormW(hPrinter: HANDLE, pFormName: LPWSTR, Level: DWORD, pForm_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD): BOOL {
    return Winspool.Load('GetFormW')(hPrinter, pFormName, Level, pForm_out, cbBuf, pcbNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getjob
  public static GetJobA(hPrinter: HANDLE, JobId: DWORD, Level: DWORD, pJob_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD): BOOL {
    return Winspool.Load('GetJobA')(hPrinter, JobId, Level, pJob_out, cbBuf, pcbNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getjobnamedpropertyvalue
  public static GetJobNamedPropertyValue(hPrinter: HANDLE, JobId: DWORD, pszName: LPCWSTR, pValue_out: PPrintPropertyValue): DWORD {
    return Winspool.Load('GetJobNamedPropertyValue')(hPrinter, JobId, pszName, pValue_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getjob
  public static GetJobW(hPrinter: HANDLE, JobId: DWORD, Level: DWORD, pJob_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD): BOOL {
    return Winspool.Load('GetJobW')(hPrinter, JobId, Level, pJob_out, cbBuf, pcbNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprintexecutiondata
  public static GetPrintExecutionData(pData_out: PPRINT_EXECUTION_DATA): BOOL {
    return Winspool.Load('GetPrintExecutionData')(pData_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprintoutputinfo
  public static GetPrintOutputInfo(hWnd: HWND, pszPrinter: LPCWSTR, phFile_out: LPHANDLE, ppszOutputFile_out: LPVOID): HRESULT {
    return Winspool.Load('GetPrintOutputInfo')(hWnd, pszPrinter, phFile_out, ppszOutputFile_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprintprocessordirectory
  public static GetPrintProcessorDirectoryA(pName: Optional<LPSTR>, pEnvironment: Optional<LPSTR>, Level: DWORD, pPrintProcessorInfo_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD): BOOL {
    return Winspool.Load('GetPrintProcessorDirectoryA')(pName, pEnvironment, Level, pPrintProcessorInfo_out, cbBuf, pcbNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprintprocessordirectory
  public static GetPrintProcessorDirectoryW(pName: Optional<LPWSTR>, pEnvironment: Optional<LPWSTR>, Level: DWORD, pPrintProcessorInfo_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD): BOOL {
    return Winspool.Load('GetPrintProcessorDirectoryW')(pName, pEnvironment, Level, pPrintProcessorInfo_out, cbBuf, pcbNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinter
  public static GetPrinterA(hPrinter: HANDLE, Level: DWORD, pPrinter_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD): BOOL {
    return Winspool.Load('GetPrinterA')(hPrinter, Level, pPrinter_out, cbBuf, pcbNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinterdata
  public static GetPrinterDataA(hPrinter: HANDLE, pValueName: LPSTR, pType_out: Optional<LPDWORD>, pData_out: Optional<LPBYTE>, nSize: DWORD, pcbNeeded_out: LPDWORD): DWORD {
    return Winspool.Load('GetPrinterDataA')(hPrinter, pValueName, pType_out, pData_out, nSize, pcbNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinterdataex
  public static GetPrinterDataExA(hPrinter: HANDLE, pKeyName: LPCSTR, pValueName: LPCSTR, pType_out: Optional<LPDWORD>, pData_out: Optional<LPBYTE>, nSize: DWORD, pcbNeeded_out: LPDWORD): DWORD {
    return Winspool.Load('GetPrinterDataExA')(hPrinter, pKeyName, pValueName, pType_out, pData_out, nSize, pcbNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinterdataex
  public static GetPrinterDataExW(hPrinter: HANDLE, pKeyName: LPCWSTR, pValueName: LPCWSTR, pType_out: Optional<LPDWORD>, pData_out: Optional<LPBYTE>, nSize: DWORD, pcbNeeded_out: LPDWORD): DWORD {
    return Winspool.Load('GetPrinterDataExW')(hPrinter, pKeyName, pValueName, pType_out, pData_out, nSize, pcbNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinterdata
  public static GetPrinterDataW(hPrinter: HANDLE, pValueName: LPWSTR, pType_out: Optional<LPDWORD>, pData_out: Optional<LPBYTE>, nSize: DWORD, pcbNeeded_out: LPDWORD): DWORD {
    return Winspool.Load('GetPrinterDataW')(hPrinter, pValueName, pType_out, pData_out, nSize, pcbNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinterdriver
  public static GetPrinterDriverA(hPrinter: HANDLE, pEnvironment: Optional<LPSTR>, Level: DWORD, pDriverInfo_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD): BOOL {
    return Winspool.Load('GetPrinterDriverA')(hPrinter, pEnvironment, Level, pDriverInfo_out, cbBuf, pcbNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinterdriverdirectory
  public static GetPrinterDriverDirectoryA(pName: Optional<LPSTR>, pEnvironment: Optional<LPSTR>, Level: DWORD, pDriverDirectory_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD): BOOL {
    return Winspool.Load('GetPrinterDriverDirectoryA')(pName, pEnvironment, Level, pDriverDirectory_out, cbBuf, pcbNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinterdriverdirectory
  public static GetPrinterDriverDirectoryW(pName: Optional<LPWSTR>, pEnvironment: Optional<LPWSTR>, Level: DWORD, pDriverDirectory_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD): BOOL {
    return Winspool.Load('GetPrinterDriverDirectoryW')(pName, pEnvironment, Level, pDriverDirectory_out, cbBuf, pcbNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinterdriverpackagepath
  public static GetPrinterDriverPackagePathA(
    pszServer: Optional<LPCSTR>,
    pszEnvironment: Optional<LPCSTR>,
    pszLanguage: Optional<LPCSTR>,
    pszPackageID: LPCSTR,
    pszDriverPackageCab_in_out: Optional<LPSTR>,
    cchDriverPackageCab: DWORD,
    pcchRequiredSize_out: LPDWORD,
  ): HRESULT {
    return Winspool.Load('GetPrinterDriverPackagePathA')(pszServer, pszEnvironment, pszLanguage, pszPackageID, pszDriverPackageCab_in_out, cchDriverPackageCab, pcchRequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinterdriverpackagepath
  public static GetPrinterDriverPackagePathW(
    pszServer: Optional<LPCWSTR>,
    pszEnvironment: Optional<LPCWSTR>,
    pszLanguage: Optional<LPCWSTR>,
    pszPackageID: LPCWSTR,
    pszDriverPackageCab_in_out: Optional<LPWSTR>,
    cchDriverPackageCab: DWORD,
    pcchRequiredSize_out: LPDWORD,
  ): HRESULT {
    return Winspool.Load('GetPrinterDriverPackagePathW')(pszServer, pszEnvironment, pszLanguage, pszPackageID, pszDriverPackageCab_in_out, cchDriverPackageCab, pcchRequiredSize_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinterdriver
  public static GetPrinterDriverW(hPrinter: HANDLE, pEnvironment: Optional<LPWSTR>, Level: DWORD, pDriverInfo_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD): BOOL {
    return Winspool.Load('GetPrinterDriverW')(hPrinter, pEnvironment, Level, pDriverInfo_out, cbBuf, pcbNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getprinter
  public static GetPrinterW(hPrinter: HANDLE, Level: DWORD, pPrinter_out: Optional<LPBYTE>, cbBuf: DWORD, pcbNeeded_out: LPDWORD): BOOL {
    return Winspool.Load('GetPrinterW')(hPrinter, Level, pPrinter_out, cbBuf, pcbNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/getspoolfilehandle
  public static GetSpoolFileHandle(hPrinter: HANDLE): HANDLE {
    return Winspool.Load('GetSpoolFileHandle')(hPrinter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/installprinterdriverfrompackage
  public static InstallPrinterDriverFromPackageA(pszServer: Optional<LPCSTR>, pszInfPath: Optional<LPCSTR>, pszDriverName: LPCSTR, pszEnvironment: Optional<LPCSTR>, dwFlags: DWORD): HRESULT {
    return Winspool.Load('InstallPrinterDriverFromPackageA')(pszServer, pszInfPath, pszDriverName, pszEnvironment, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/installprinterdriverfrompackage
  public static InstallPrinterDriverFromPackageW(pszServer: Optional<LPCWSTR>, pszInfPath: Optional<LPCWSTR>, pszDriverName: LPCWSTR, pszEnvironment: Optional<LPCWSTR>, dwFlags: DWORD): HRESULT {
    return Winspool.Load('InstallPrinterDriverFromPackageW')(pszServer, pszInfPath, pszDriverName, pszEnvironment, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/isvaliddevmode
  public static IsValidDevmodeA(pDevmode: Optional<PDEVMODEA>, DevmodeSize: SIZE_T): BOOL {
    return Winspool.Load('IsValidDevmodeA')(pDevmode, DevmodeSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/isvaliddevmode
  public static IsValidDevmodeW(pDevmode: Optional<PDEVMODEW>, DevmodeSize: SIZE_T): BOOL {
    return Winspool.Load('IsValidDevmodeW')(pDevmode, DevmodeSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/openprinter2
  public static OpenPrinter2A(pPrinterName: Optional<LPCSTR>, phPrinter_out: LPHANDLE, pDefault: Optional<LPPRINTER_DEFAULTSA>, pOptions: Optional<PPRINTER_OPTIONSA>): BOOL {
    return Winspool.Load('OpenPrinter2A')(pPrinterName, phPrinter_out, pDefault, pOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/openprinter2
  public static OpenPrinter2W(pPrinterName: Optional<LPCWSTR>, phPrinter_out: LPHANDLE, pDefault: Optional<LPPRINTER_DEFAULTSW>, pOptions: Optional<PPRINTER_OPTIONSW>): BOOL {
    return Winspool.Load('OpenPrinter2W')(pPrinterName, phPrinter_out, pDefault, pOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/openprinter
  public static OpenPrinterA(pPrinterName: Optional<LPSTR>, phPrinter_out: LPHANDLE, pDefault: Optional<LPPRINTER_DEFAULTSA>): BOOL {
    return Winspool.Load('OpenPrinterA')(pPrinterName, phPrinter_out, pDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/openprinter
  public static OpenPrinterW(pPrinterName: Optional<LPWSTR>, phPrinter_out: LPHANDLE, pDefault: Optional<LPPRINTER_DEFAULTSW>): BOOL {
    return Winspool.Load('OpenPrinterW')(pPrinterName, phPrinter_out, pDefault);
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
  public static ReadPrinter(hPrinter: HANDLE, pBuf_out: LPVOID, cbBuf: DWORD, pNoBytesRead_out: LPDWORD): BOOL {
    return Winspool.Load('ReadPrinter')(hPrinter, pBuf_out, cbBuf, pNoBytesRead_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/prnasnot/nf-prnasnot-registerforprintasyncnotifications
  public static RegisterForPrintAsyncNotifications(pszName: Optional<LPCWSTR>, pNotificationType: LPVOID, eUserFilter: DWORD, eConversationStyle: DWORD, pCallback: LPVOID, phNotify_out: LPHANDLE): HRESULT {
    return Winspool.Load('RegisterForPrintAsyncNotifications')(pszName, pNotificationType, eUserFilter, eConversationStyle, pCallback, phNotify_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/reportjobprocessingprogress
  public static ReportJobProcessingProgress(printerHandle: HANDLE, jobId: ULONG, jobOperation: DWORD, jobProgress: DWORD): HRESULT {
    return Winspool.Load('ReportJobProcessingProgress')(printerHandle, jobId, jobOperation, jobProgress);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/resetprinter
  public static ResetPrinterA(hPrinter: HANDLE, pDefault: Optional<LPPRINTER_DEFAULTSA>): BOOL {
    return Winspool.Load('ResetPrinterA')(hPrinter, pDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/resetprinter
  public static ResetPrinterW(hPrinter: HANDLE, pDefault: Optional<LPPRINTER_DEFAULTSW>): BOOL {
    return Winspool.Load('ResetPrinterW')(hPrinter, pDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/schedulejob
  public static ScheduleJob(hPrinter: HANDLE, JobId: DWORD): BOOL {
    return Winspool.Load('ScheduleJob')(hPrinter, JobId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/seekprinter
  public static SeekPrinter(hPrinter: HANDLE, liDistanceToMove: LARGE_INTEGER, pliNewPointer_out: Nullable<PLARGE_INTEGER>, dwMoveMethod: DWORD, bWrite: BOOL): BOOL {
    return Winspool.Load('SeekPrinter')(hPrinter, liDistanceToMove, pliNewPointer_out, dwMoveMethod, bWrite);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setdefaultprinter
  public static SetDefaultPrinterA(pszPrinter: Optional<LPCSTR>): BOOL {
    return Winspool.Load('SetDefaultPrinterA')(pszPrinter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setdefaultprinter
  public static SetDefaultPrinterW(pszPrinter: Optional<LPCWSTR>): BOOL {
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
  public static SetJobA(hPrinter: HANDLE, JobId: DWORD, Level: DWORD, pJob: Optional<LPBYTE>, Command: DWORD): BOOL {
    return Winspool.Load('SetJobA')(hPrinter, JobId, Level, pJob, Command);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setjobnamedproperty
  public static SetJobNamedProperty(hPrinter: HANDLE, JobId: DWORD, pProperty: PPrintNamedProperty): DWORD {
    return Winspool.Load('SetJobNamedProperty')(hPrinter, JobId, pProperty);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setjob
  public static SetJobW(hPrinter: HANDLE, JobId: DWORD, Level: DWORD, pJob: Optional<LPBYTE>, Command: DWORD): BOOL {
    return Winspool.Load('SetJobW')(hPrinter, JobId, Level, pJob, Command);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setport
  public static SetPortA(pName: Optional<LPSTR>, pPortName: LPSTR, dwLevel: DWORD, pPortInfo: LPBYTE): BOOL {
    return Winspool.Load('SetPortA')(pName, pPortName, dwLevel, pPortInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setport
  public static SetPortW(pName: Optional<LPWSTR>, pPortName: LPWSTR, dwLevel: DWORD, pPortInfo: LPBYTE): BOOL {
    return Winspool.Load('SetPortW')(pName, pPortName, dwLevel, pPortInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/setprinter
  public static SetPrinterA(hPrinter: HANDLE, Level: DWORD, pPrinter: Optional<LPBYTE>, Command: DWORD): BOOL {
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
  public static SetPrinterW(hPrinter: HANDLE, Level: DWORD, pPrinter: Optional<LPBYTE>, Command: DWORD): BOOL {
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
  public static UploadPrinterDriverPackageA(pszServer: Optional<LPCSTR>, pszInfPath: LPCSTR, pszEnvironment: Optional<LPCSTR>, dwFlags: DWORD, hwnd: Nullable<HWND>, pszDestInfPath_out: LPSTR, pcchDestInfPath_in_out: LPDWORD): HRESULT {
    return Winspool.Load('UploadPrinterDriverPackageA')(pszServer, pszInfPath, pszEnvironment, dwFlags, hwnd, pszDestInfPath_out, pcchDestInfPath_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/uploadprinterdriverpackage
  public static UploadPrinterDriverPackageW(pszServer: Optional<LPCWSTR>, pszInfPath: LPCWSTR, pszEnvironment: Optional<LPCWSTR>, dwFlags: DWORD, hwnd: Nullable<HWND>, pszDestInfPath_out: LPWSTR, pcchDestInfPath_in_out: LPDWORD): HRESULT {
    return Winspool.Load('UploadPrinterDriverPackageW')(pszServer, pszInfPath, pszEnvironment, dwFlags, hwnd, pszDestInfPath_out, pcchDestInfPath_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/waitforprinterchange
  public static WaitForPrinterChange(hPrinter: HANDLE, Flags: DWORD): DWORD {
    return Winspool.Load('WaitForPrinterChange')(hPrinter, Flags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/writeprinter
  public static WritePrinter(hPrinter: HANDLE, pBuf: LPVOID, cbBuf: DWORD, pcWritten_out: LPDWORD): BOOL {
    return Winspool.Load('WritePrinter')(hPrinter, pBuf, cbBuf, pcWritten_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/printdocs/xcvdata
  public static XcvDataW(hXcv: HANDLE, pszDataName: LPCWSTR, pInputData: Optional<PBYTE>, cbInputData: DWORD, pOutputData_out: Optional<PBYTE>, cbOutputData: DWORD, pcbOutputNeeded_out: PDWORD, pdwStatus_out: Optional<PDWORD>): BOOL {
    return Winspool.Load('XcvDataW')(hXcv, pszDataName, pInputData, cbInputData, pOutputData_out, cbOutputData, pcbOutputNeeded_out, pdwStatus_out);
  }
}

export default Winspool;
