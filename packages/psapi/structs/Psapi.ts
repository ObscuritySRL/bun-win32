import { type FFIFunction, FFIType } from 'bun:ffi';
import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  DWORD,
  HANDLE,
  HMODULE,
  LPDWORD,
  LPHMODULE,
  LPMODULEINFO,
  LPSTR,
  LPVOID,
  LPWSTR,
  NULLABLE,
  OPTIONAL,
  PDWORD,
  PENUM_PAGE_FILE_CALLBACKA,
  PENUM_PAGE_FILE_CALLBACKW,
  PPERFORMANCE_INFORMATION,
  PPROCESS_MEMORY_COUNTERS,
  PPSAPI_WS_WATCH_INFORMATION,
  PPSAPI_WS_WATCH_INFORMATION_EX,
  PVOID,
} from '../types/Psapi';

/**
 * Thin, lazy-loaded FFI bindings for `psapi.dll`.
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
 * import Psapi from './structs/Psapi';
 *
 * // Lazy: bind on first call
 * const result = Psapi.EnumProcesses(buffer.ptr, buffer.byteLength, sizeNeeded.ptr);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Psapi.Preload(['EnumProcesses', 'GetModuleBaseNameW']);
 * ```
 */
class Psapi extends Win32 {
  protected static override name = 'psapi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    EmptyWorkingSet: { args: [FFIType.u64], returns: FFIType.i32 },
    EnumDeviceDrivers: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    EnumPageFilesA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumPageFilesW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    EnumProcessModules: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    EnumProcessModulesEx: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    EnumProcesses: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetDeviceDriverBaseNameA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetDeviceDriverBaseNameW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetDeviceDriverFileNameA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetDeviceDriverFileNameW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetMappedFileNameA: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetMappedFileNameW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetModuleBaseNameA: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetModuleBaseNameW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetModuleFileNameExA: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetModuleFileNameExW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetModuleInformation: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetPerformanceInfo: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetProcessImageFileNameA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetProcessImageFileNameW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    GetProcessMemoryInfo: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetWsChanges: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetWsChangesEx: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InitializeProcessForWsWatch: { args: [FFIType.u64], returns: FFIType.i32 },
    QueryWorkingSet: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    QueryWorkingSetEx: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-emptyworkingset
  public static EmptyWorkingSet(hProcess: HANDLE): BOOL {
    return Psapi.Load('EmptyWorkingSet')(hProcess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-enumdevicedrivers
  public static EnumDeviceDrivers(lpImageBase_out: LPVOID, cb: DWORD, lpcbNeeded_out: LPDWORD): BOOL {
    return Psapi.Load('EnumDeviceDrivers')(lpImageBase_out, cb, lpcbNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-enumpagefilesa
  public static EnumPageFilesA(pCallBackRoutine: PENUM_PAGE_FILE_CALLBACKA, pContext: NULLABLE<LPVOID>): BOOL {
    return Psapi.Load('EnumPageFilesA')(pCallBackRoutine, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-enumpagefilesw
  public static EnumPageFilesW(pCallBackRoutine: PENUM_PAGE_FILE_CALLBACKW, pContext: NULLABLE<LPVOID>): BOOL {
    return Psapi.Load('EnumPageFilesW')(pCallBackRoutine, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-enumprocessmodules
  public static EnumProcessModules(hProcess: HANDLE, lphModule_out: LPHMODULE, cb: DWORD, lpcbNeeded_out: LPDWORD): BOOL {
    return Psapi.Load('EnumProcessModules')(hProcess, lphModule_out, cb, lpcbNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-enumprocessmodulesex
  public static EnumProcessModulesEx(hProcess: HANDLE, lphModule_out: LPHMODULE, cb: DWORD, lpcbNeeded_out: LPDWORD, dwFilterFlag: DWORD): BOOL {
    return Psapi.Load('EnumProcessModulesEx')(hProcess, lphModule_out, cb, lpcbNeeded_out, dwFilterFlag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-enumprocesses
  public static EnumProcesses(lpidProcess_out: LPDWORD, cb: DWORD, lpcbNeeded_out: LPDWORD): BOOL {
    return Psapi.Load('EnumProcesses')(lpidProcess_out, cb, lpcbNeeded_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getdevicedriverbasenamea
  public static GetDeviceDriverBaseNameA(ImageBase: LPVOID<bigint>, lpBaseName_out: LPSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetDeviceDriverBaseNameA')(ImageBase, lpBaseName_out, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getdevicedriverbasenamew
  public static GetDeviceDriverBaseNameW(ImageBase: LPVOID<bigint>, lpBaseName_out: LPWSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetDeviceDriverBaseNameW')(ImageBase, lpBaseName_out, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getdevicedriverfilenamea
  public static GetDeviceDriverFileNameA(ImageBase: LPVOID<bigint>, lpFilename_out: LPSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetDeviceDriverFileNameA')(ImageBase, lpFilename_out, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getdevicedriverfilenamew
  public static GetDeviceDriverFileNameW(ImageBase: LPVOID<bigint>, lpFilename_out: LPWSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetDeviceDriverFileNameW')(ImageBase, lpFilename_out, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getmappedfilenamea
  public static GetMappedFileNameA(hProcess: HANDLE, lpv: LPVOID<bigint>, lpFilename_out: LPSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetMappedFileNameA')(hProcess, lpv, lpFilename_out, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getmappedfilenamew
  public static GetMappedFileNameW(hProcess: HANDLE, lpv: LPVOID<bigint>, lpFilename_out: LPWSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetMappedFileNameW')(hProcess, lpv, lpFilename_out, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getmodulebasenamea
  public static GetModuleBaseNameA(hProcess: HANDLE, hModule: OPTIONAL<HMODULE>, lpBaseName_out: LPSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetModuleBaseNameA')(hProcess, hModule, lpBaseName_out, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getmodulebasenamew
  public static GetModuleBaseNameW(hProcess: HANDLE, hModule: OPTIONAL<HMODULE>, lpBaseName_out: LPWSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetModuleBaseNameW')(hProcess, hModule, lpBaseName_out, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getmodulefilenameexa
  public static GetModuleFileNameExA(hProcess: OPTIONAL<HANDLE>, hModule: OPTIONAL<HMODULE>, lpFilename_out: LPSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetModuleFileNameExA')(hProcess, hModule, lpFilename_out, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getmodulefilenameexw
  public static GetModuleFileNameExW(hProcess: OPTIONAL<HANDLE>, hModule: OPTIONAL<HMODULE>, lpFilename_out: LPWSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetModuleFileNameExW')(hProcess, hModule, lpFilename_out, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getmoduleinformation
  public static GetModuleInformation(hProcess: HANDLE, hModule: HMODULE, lpmodinfo_out: LPMODULEINFO, cb: DWORD): BOOL {
    return Psapi.Load('GetModuleInformation')(hProcess, hModule, lpmodinfo_out, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getperformanceinfo
  public static GetPerformanceInfo(pPerformanceInformation_out: PPERFORMANCE_INFORMATION, cb: DWORD): BOOL {
    return Psapi.Load('GetPerformanceInfo')(pPerformanceInformation_out, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getprocessimagefilenamea
  public static GetProcessImageFileNameA(hProcess: HANDLE, lpImageFileName_out: LPSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetProcessImageFileNameA')(hProcess, lpImageFileName_out, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getprocessimagefilenamew
  public static GetProcessImageFileNameW(hProcess: HANDLE, lpImageFileName_out: LPWSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetProcessImageFileNameW')(hProcess, lpImageFileName_out, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getprocessmemoryinfo
  public static GetProcessMemoryInfo(Process: HANDLE, ppsmemCounters_out: PPROCESS_MEMORY_COUNTERS, cb: DWORD): BOOL {
    return Psapi.Load('GetProcessMemoryInfo')(Process, ppsmemCounters_out, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getwschanges
  public static GetWsChanges(hProcess: HANDLE, lpWatchInfo_out: PPSAPI_WS_WATCH_INFORMATION, cb: DWORD): BOOL {
    return Psapi.Load('GetWsChanges')(hProcess, lpWatchInfo_out, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getwschangesex
  public static GetWsChangesEx(hProcess: HANDLE, lpWatchInfoEx_out: PPSAPI_WS_WATCH_INFORMATION_EX, cb_in_out: PDWORD): BOOL {
    return Psapi.Load('GetWsChangesEx')(hProcess, lpWatchInfoEx_out, cb_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-initializeprocessforwswatch
  public static InitializeProcessForWsWatch(hProcess: HANDLE): BOOL {
    return Psapi.Load('InitializeProcessForWsWatch')(hProcess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-queryworkingset
  public static QueryWorkingSet(hProcess: HANDLE, pv_out: PVOID, cb: DWORD): BOOL {
    return Psapi.Load('QueryWorkingSet')(hProcess, pv_out, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-queryworkingsetex
  public static QueryWorkingSetEx(hProcess: HANDLE, pv_in_out: PVOID, cb: DWORD): BOOL {
    return Psapi.Load('QueryWorkingSetEx')(hProcess, pv_in_out, cb);
  }
}

export default Psapi;
