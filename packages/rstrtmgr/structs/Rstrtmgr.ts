import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { DWORD, LPCWSTR, LPDWORD, LPWSTR, NULL, PBYTE, PLPCWSTR, PRM_PROCESS_INFO, PRM_UNIQUE_PROCESS, RM_FILTER_ACTION, RM_WRITE_STATUS_CALLBACK, UINT, ULONG } from '../types/Rstrtmgr';

/**
 * Thin, lazy-loaded FFI bindings for `rstrtmgr.dll`.
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
 * import Rstrtmgr from './structs/Rstrtmgr';
 *
 * const sessionHandleBuffer = Buffer.alloc(4);
 * const sessionKeyBuffer = Buffer.alloc(66);
 *
 * const result = Rstrtmgr.RmStartSession(sessionHandleBuffer.ptr, 0, sessionKeyBuffer.ptr);
 *
 * if (result === 0) {
 *   const sessionHandle = sessionHandleBuffer.readUInt32LE(0);
 *   Rstrtmgr.RmEndSession(sessionHandle);
 * }
 * ```
 */
class Rstrtmgr extends Win32 {
  protected static override name = 'rstrtmgr.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    RmAddFilter: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    RmCancelCurrentTask: { args: [FFIType.u32], returns: FFIType.u32 },
    RmEndSession: { args: [FFIType.u32], returns: FFIType.u32 },
    RmGetFilterList: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    RmGetList: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RmJoinSession: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RmRegisterResources: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    RmRemoveFilter: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    RmRestart: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    RmShutdown: { args: [FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    RmStartSession: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/restartmanager/nf-restartmanager-rmaddfilter
  public static RmAddFilter(dwSessionHandle: DWORD, strModuleName: LPCWSTR | NULL, pProcess: PRM_UNIQUE_PROCESS | NULL, strServiceShortName: LPCWSTR | NULL, FilterAction: RM_FILTER_ACTION): DWORD {
    return Rstrtmgr.Load('RmAddFilter')(dwSessionHandle, strModuleName, pProcess, strServiceShortName, FilterAction);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/restartmanager/nf-restartmanager-rmcancelcurrenttask
  public static RmCancelCurrentTask(dwSessionHandle: DWORD): DWORD {
    return Rstrtmgr.Load('RmCancelCurrentTask')(dwSessionHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/restartmanager/nf-restartmanager-rmendsession
  public static RmEndSession(dwSessionHandle: DWORD): DWORD {
    return Rstrtmgr.Load('RmEndSession')(dwSessionHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/restartmanager/nf-restartmanager-rmgetfilterlist
  public static RmGetFilterList(dwSessionHandle: DWORD, pbFilterBuf: PBYTE | NULL, cbFilterBuf: DWORD, cbFilterBufNeeded: LPDWORD): DWORD {
    return Rstrtmgr.Load('RmGetFilterList')(dwSessionHandle, pbFilterBuf, cbFilterBuf, cbFilterBufNeeded);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/restartmanager/nf-restartmanager-rmgetlist
  public static RmGetList(dwSessionHandle: DWORD, pnProcInfoNeeded: LPDWORD, pnProcInfo: LPDWORD, rgAffectedApps: PRM_PROCESS_INFO | NULL, lpdwRebootReasons: LPDWORD): DWORD {
    return Rstrtmgr.Load('RmGetList')(dwSessionHandle, pnProcInfoNeeded, pnProcInfo, rgAffectedApps, lpdwRebootReasons);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/restartmanager/nf-restartmanager-rmjoinsession
  public static RmJoinSession(pSessionHandle: LPDWORD, strSessionKey: LPCWSTR): DWORD {
    return Rstrtmgr.Load('RmJoinSession')(pSessionHandle, strSessionKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/restartmanager/nf-restartmanager-rmregisterresources
  public static RmRegisterResources(dwSessionHandle: DWORD, nFiles: UINT, rgsFileNames: PLPCWSTR | NULL, nApplications: UINT, rgApplications: PRM_UNIQUE_PROCESS | NULL, nServices: UINT, rgsServiceNames: PLPCWSTR | NULL): DWORD {
    return Rstrtmgr.Load('RmRegisterResources')(dwSessionHandle, nFiles, rgsFileNames, nApplications, rgApplications, nServices, rgsServiceNames);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/restartmanager/nf-restartmanager-rmremovefilter
  public static RmRemoveFilter(dwSessionHandle: DWORD, strModuleName: LPCWSTR | NULL, pProcess: PRM_UNIQUE_PROCESS | NULL, strServiceShortName: LPCWSTR | NULL): DWORD {
    return Rstrtmgr.Load('RmRemoveFilter')(dwSessionHandle, strModuleName, pProcess, strServiceShortName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/restartmanager/nf-restartmanager-rmrestart
  public static RmRestart(dwSessionHandle: DWORD, dwRestartFlags: DWORD, fnStatus: RM_WRITE_STATUS_CALLBACK | NULL): DWORD {
    return Rstrtmgr.Load('RmRestart')(dwSessionHandle, dwRestartFlags, fnStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/restartmanager/nf-restartmanager-rmshutdown
  public static RmShutdown(dwSessionHandle: DWORD, lActionFlags: ULONG, fnStatus: RM_WRITE_STATUS_CALLBACK | NULL): DWORD {
    return Rstrtmgr.Load('RmShutdown')(dwSessionHandle, lActionFlags, fnStatus);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/restartmanager/nf-restartmanager-rmstartsession
  public static RmStartSession(pSessionHandle: LPDWORD, dwSessionFlags: DWORD, strSessionKey: LPWSTR): DWORD {
    return Rstrtmgr.Load('RmStartSession')(pSessionHandle, dwSessionFlags, strSessionKey);
  }
}

export default Rstrtmgr;
