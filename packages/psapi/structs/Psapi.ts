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
  public static EnumDeviceDrivers(lpImageBase: LPVOID, cb: DWORD, lpcbNeeded: LPDWORD): BOOL {
    return Psapi.Load('EnumDeviceDrivers')(lpImageBase, cb, lpcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-enumpagefilesa
  public static EnumPageFilesA(pCallBackRoutine: PENUM_PAGE_FILE_CALLBACKA, pContext: LPVOID): BOOL {
    return Psapi.Load('EnumPageFilesA')(pCallBackRoutine, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-enumpagefilesw
  public static EnumPageFilesW(pCallBackRoutine: PENUM_PAGE_FILE_CALLBACKW, pContext: LPVOID): BOOL {
    return Psapi.Load('EnumPageFilesW')(pCallBackRoutine, pContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-enumprocessmodules
  public static EnumProcessModules(hProcess: HANDLE, lphModule: LPHMODULE, cb: DWORD, lpcbNeeded: LPDWORD): BOOL {
    return Psapi.Load('EnumProcessModules')(hProcess, lphModule, cb, lpcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-enumprocessmodulesex
  public static EnumProcessModulesEx(hProcess: HANDLE, lphModule: LPHMODULE, cb: DWORD, lpcbNeeded: LPDWORD, dwFilterFlag: DWORD): BOOL {
    return Psapi.Load('EnumProcessModulesEx')(hProcess, lphModule, cb, lpcbNeeded, dwFilterFlag);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-enumprocesses
  public static EnumProcesses(lpidProcess: LPDWORD, cb: DWORD, lpcbNeeded: LPDWORD): BOOL {
    return Psapi.Load('EnumProcesses')(lpidProcess, cb, lpcbNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getdevicedriverbasenamea
  public static GetDeviceDriverBaseNameA(ImageBase: bigint, lpBaseName: LPSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetDeviceDriverBaseNameA')(ImageBase, lpBaseName, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getdevicedriverbasenamew
  public static GetDeviceDriverBaseNameW(ImageBase: bigint, lpBaseName: LPWSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetDeviceDriverBaseNameW')(ImageBase, lpBaseName, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getdevicedriverfilenamea
  public static GetDeviceDriverFileNameA(ImageBase: bigint, lpFilename: LPSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetDeviceDriverFileNameA')(ImageBase, lpFilename, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getdevicedriverfilenamew
  public static GetDeviceDriverFileNameW(ImageBase: bigint, lpFilename: LPWSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetDeviceDriverFileNameW')(ImageBase, lpFilename, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getmappedfilenamea
  public static GetMappedFileNameA(hProcess: HANDLE, lpv: bigint, lpFilename: LPSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetMappedFileNameA')(hProcess, lpv, lpFilename, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getmappedfilenamew
  public static GetMappedFileNameW(hProcess: HANDLE, lpv: bigint, lpFilename: LPWSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetMappedFileNameW')(hProcess, lpv, lpFilename, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getmodulebasenamea
  public static GetModuleBaseNameA(hProcess: HANDLE, hModule: HMODULE | 0n, lpBaseName: LPSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetModuleBaseNameA')(hProcess, hModule, lpBaseName, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getmodulebasenamew
  public static GetModuleBaseNameW(hProcess: HANDLE, hModule: HMODULE | 0n, lpBaseName: LPWSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetModuleBaseNameW')(hProcess, hModule, lpBaseName, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getmodulefilenameexa
  public static GetModuleFileNameExA(hProcess: HANDLE | 0n, hModule: HMODULE | 0n, lpFilename: LPSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetModuleFileNameExA')(hProcess, hModule, lpFilename, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getmodulefilenameexw
  public static GetModuleFileNameExW(hProcess: HANDLE | 0n, hModule: HMODULE | 0n, lpFilename: LPWSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetModuleFileNameExW')(hProcess, hModule, lpFilename, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getmoduleinformation
  public static GetModuleInformation(hProcess: HANDLE, hModule: HMODULE, lpmodinfo: LPMODULEINFO, cb: DWORD): BOOL {
    return Psapi.Load('GetModuleInformation')(hProcess, hModule, lpmodinfo, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getperformanceinfo
  public static GetPerformanceInfo(pPerformanceInformation: PPERFORMANCE_INFORMATION, cb: DWORD): BOOL {
    return Psapi.Load('GetPerformanceInfo')(pPerformanceInformation, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getprocessimagefilenamea
  public static GetProcessImageFileNameA(hProcess: HANDLE, lpImageFileName: LPSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetProcessImageFileNameA')(hProcess, lpImageFileName, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getprocessimagefilenamew
  public static GetProcessImageFileNameW(hProcess: HANDLE, lpImageFileName: LPWSTR, nSize: DWORD): DWORD {
    return Psapi.Load('GetProcessImageFileNameW')(hProcess, lpImageFileName, nSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getprocessmemoryinfo
  public static GetProcessMemoryInfo(Process: HANDLE, ppsmemCounters: PPROCESS_MEMORY_COUNTERS, cb: DWORD): BOOL {
    return Psapi.Load('GetProcessMemoryInfo')(Process, ppsmemCounters, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getwschanges
  public static GetWsChanges(hProcess: HANDLE, lpWatchInfo: PPSAPI_WS_WATCH_INFORMATION, cb: DWORD): BOOL {
    return Psapi.Load('GetWsChanges')(hProcess, lpWatchInfo, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-getwschangesex
  public static GetWsChangesEx(hProcess: HANDLE, lpWatchInfoEx: PPSAPI_WS_WATCH_INFORMATION_EX, cb: PDWORD): BOOL {
    return Psapi.Load('GetWsChangesEx')(hProcess, lpWatchInfoEx, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-initializeprocessforwswatch
  public static InitializeProcessForWsWatch(hProcess: HANDLE): BOOL {
    return Psapi.Load('InitializeProcessForWsWatch')(hProcess);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-queryworkingset
  public static QueryWorkingSet(hProcess: HANDLE, pv: PVOID, cb: DWORD): BOOL {
    return Psapi.Load('QueryWorkingSet')(hProcess, pv, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/psapi/nf-psapi-queryworkingsetex
  public static QueryWorkingSetEx(hProcess: HANDLE, pv: PVOID, cb: DWORD): BOOL {
    return Psapi.Load('QueryWorkingSetEx')(hProcess, pv, cb);
  }
}

export default Psapi;
