import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  BYTE,
  DWORD,
  DWORD_PTR,
  HANDLE,
  HKEY,
  HMONITOR,
  HRESULT,
  HWND,
  INT,
  LONG_PTR,
  LPBOOL,
  LPBYTE,
  LPCSTR,
  LPCWSTR,
  LPDWORD,
  LPSTR,
  LPTHREAD_START_ROUTINE,
  LPVOID,
  LPWSTR,
  LSTATUS,
  NULL,
  PCWSTR,
  REFGUID,
  REFIID,
  UINT,
  VOID,
} from '../types/Shcore';

/**
 * Thin, lazy-loaded FFI bindings for `shcore.dll`.
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
 * import Shcore from './structs/Shcore';
 *
 * // Lazy: bind on first call
 * const hr = Shcore.SetProcessDpiAwareness(2);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Shcore.Preload(['GetDpiForMonitor', 'SetProcessDpiAwareness']);
 * ```
 */
class Shcore extends Win32 {
  protected static override name = 'shcore.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    CommandLineToArgvW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
    CreateRandomAccessStreamOnFile: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateRandomAccessStreamOverStream: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateStreamOverRandomAccessStream: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetCurrentProcessExplicitAppUserModelID: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetDpiForMonitor: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetDpiForShellUIComponent: { args: [FFIType.i32], returns: FFIType.u32 },
    GetProcessDpiAwareness: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetProcessReference: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetScaleFactorForDevice: { args: [FFIType.i32], returns: FFIType.i32 },
    GetScaleFactorForMonitor: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IsOS: { args: [FFIType.u32], returns: FFIType.i32 },
    IsProcessInIsolatedContainer: { args: [FFIType.ptr], returns: FFIType.i32 },
    IsProcessInWDAGContainer: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IStream_Copy: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    IStream_Read: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    IStream_ReadStr: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IStream_Reset: { args: [FFIType.u64], returns: FFIType.i32 },
    IStream_Size: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IStream_Write: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    IStream_WriteStr: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IUnknown_AtomicRelease: { args: [FFIType.ptr], returns: FFIType.void },
    IUnknown_GetSite: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IUnknown_QueryService: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IUnknown_Set: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.void },
    IUnknown_SetSite: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    RegisterScaleChangeEvent: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    RegisterScaleChangeNotifications: { args: [FFIType.i32, FFIType.u64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    RevokeScaleChangeNotifications: { args: [FFIType.i32, FFIType.u32], returns: FFIType.i32 },
    SetCurrentProcessExplicitAppUserModelID: { args: [FFIType.ptr], returns: FFIType.i32 },
    SetProcessDpiAwareness: { args: [FFIType.i32], returns: FFIType.i32 },
    SetProcessReference: { args: [FFIType.u64], returns: FFIType.void },
    SHAnsiToAnsi: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHAnsiToUnicode: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHCopyKeyA: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SHCopyKeyW: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SHCreateMemStream: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    SHCreateStreamOnFileA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SHCreateStreamOnFileEx: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SHCreateStreamOnFileW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SHCreateThread: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SHCreateThreadRef: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateThreadWithHandle: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHDeleteEmptyKeyA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SHDeleteEmptyKeyW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SHDeleteKeyA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SHDeleteKeyW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SHDeleteValueA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHDeleteValueW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHEnumKeyExA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHEnumKeyExW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHEnumValueA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHEnumValueW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetThreadRef: { args: [FFIType.ptr], returns: FFIType.i32 },
    SHGetValueA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetValueW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHOpenRegStream2A: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    SHOpenRegStream2W: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    SHOpenRegStreamA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    SHOpenRegStreamW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    SHQueryInfoKeyA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHQueryInfoKeyW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHQueryValueExA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHQueryValueExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHRegDuplicateHKey: { args: [FFIType.u64], returns: FFIType.u64 },
    SHRegGetIntW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHRegGetPathA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegGetPathW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegGetValueA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHRegGetValueFromHKCUHKLM: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHRegGetValueW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHRegSetPathA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegSetPathW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHReleaseThreadRef: { args: [], returns: FFIType.i32 },
    SHSetThreadRef: { args: [FFIType.u64], returns: FFIType.i32 },
    SHSetValueA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHSetValueW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHStrDupA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHStrDupW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHUnicodeToAnsi: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHUnicodeToUnicode: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    UnregisterScaleChangeEvent: { args: [FFIType.u64], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-commandlinetoargvw
  public static CommandLineToArgvW(lpCmdLine: LPCWSTR, pNumArgs: LPVOID): LPWSTR {
    return Shcore.Load('CommandLineToArgvW')(lpCmdLine, pNumArgs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shcore/nf-shcore-createrandomaccessstreamonfile
  public static CreateRandomAccessStreamOnFile(filePath: PCWSTR, accessMode: DWORD, riid: REFIID, ppv: LPVOID): HRESULT {
    return Shcore.Load('CreateRandomAccessStreamOnFile')(filePath, accessMode, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shcore/nf-shcore-createrandomaccessstreamoverstream
  public static CreateRandomAccessStreamOverStream(stream: HANDLE, options: DWORD, riid: REFIID, ppv: LPVOID): HRESULT {
    return Shcore.Load('CreateRandomAccessStreamOverStream')(stream, options, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shcore/nf-shcore-createstreamoverrandomaccessstream
  public static CreateStreamOverRandomAccessStream(randomAccessStream: HANDLE, riid: REFIID, ppv: LPVOID): HRESULT {
    return Shcore.Load('CreateStreamOverRandomAccessStream')(randomAccessStream, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-getcurrentprocessexplicitappusermodelid
  public static GetCurrentProcessExplicitAppUserModelID(AppID: LPVOID): HRESULT {
    return Shcore.Load('GetCurrentProcessExplicitAppUserModelID')(AppID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellscalingapi/nf-shellscalingapi-getdpiformonitor
  public static GetDpiForMonitor(hmonitor: HMONITOR, dpiType: DWORD, dpiX: LPVOID, dpiY: LPVOID): HRESULT {
    return Shcore.Load('GetDpiForMonitor')(hmonitor, dpiType, dpiX, dpiY);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellscalingapi/nf-shellscalingapi-getdpiforshelluicomponent
  public static GetDpiForShellUIComponent(shellUiComponent: DWORD): UINT {
    return Shcore.Load('GetDpiForShellUIComponent')(shellUiComponent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellscalingapi/nf-shellscalingapi-getprocessdpiawareness
  public static GetProcessDpiAwareness(hprocess: HANDLE | 0n, value: LPVOID): HRESULT {
    return Shcore.Load('GetProcessDpiAwareness')(hprocess, value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-getprocessreference
  public static GetProcessReference(punk: LPVOID): HRESULT {
    return Shcore.Load('GetProcessReference')(punk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellscalingapi/nf-shellscalingapi-getscalefactorfordevice
  public static GetScaleFactorForDevice(deviceType: DWORD): INT {
    return Shcore.Load('GetScaleFactorForDevice')(deviceType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellscalingapi/nf-shellscalingapi-getscalefactorformonitor
  public static GetScaleFactorForMonitor(hMon: HMONITOR, pScale: LPVOID): HRESULT {
    return Shcore.Load('GetScaleFactorForMonitor')(hMon, pScale);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-isos
  public static IsOS(dwOS: DWORD): BOOL {
    return Shcore.Load('IsOS')(dwOS);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/isolatedapplauncher/nf-isolatedapplauncher-isprocessinisolatedcontainer
  public static IsProcessInIsolatedContainer(isProcessInIsolatedContainer: LPBOOL): HRESULT {
    return Shcore.Load('IsProcessInIsolatedContainer')(isProcessInIsolatedContainer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/isolatedapplauncher/nf-isolatedapplauncher-isprocessinwdagcontainer
  public static IsProcessInWDAGContainer(Reserved: LPVOID, isProcessInWDAGContainer: LPBOOL): HRESULT {
    return Shcore.Load('IsProcessInWDAGContainer')(Reserved, isProcessInWDAGContainer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-istream_copy
  public static IStream_Copy(pstmFrom: HANDLE, pstmTo: HANDLE, cb: DWORD): HRESULT {
    return Shcore.Load('IStream_Copy')(pstmFrom, pstmTo, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-istream_read
  public static IStream_Read(pstm: HANDLE, pv: LPVOID, cb: DWORD): HRESULT {
    return Shcore.Load('IStream_Read')(pstm, pv, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-istream_readstr
  public static IStream_ReadStr(pstm: HANDLE, ppsz: LPVOID): HRESULT {
    return Shcore.Load('IStream_ReadStr')(pstm, ppsz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-istream_reset
  public static IStream_Reset(pstm: HANDLE): HRESULT {
    return Shcore.Load('IStream_Reset')(pstm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-istream_size
  public static IStream_Size(pstm: HANDLE, pui: LPVOID): HRESULT {
    return Shcore.Load('IStream_Size')(pstm, pui);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-istream_write
  public static IStream_Write(pstm: HANDLE, pv: LPVOID, cb: DWORD): HRESULT {
    return Shcore.Load('IStream_Write')(pstm, pv, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-istream_writestr
  public static IStream_WriteStr(pstm: HANDLE, psz: PCWSTR): HRESULT {
    return Shcore.Load('IStream_WriteStr')(pstm, psz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-iunknown_atomicrelease
  public static IUnknown_AtomicRelease(ppunk: LPVOID | NULL): VOID {
    return Shcore.Load('IUnknown_AtomicRelease')(ppunk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-iunknown_getsite
  public static IUnknown_GetSite(punk: HANDLE, riid: REFIID, ppv: LPVOID): HRESULT {
    return Shcore.Load('IUnknown_GetSite')(punk, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-iunknown_queryservice
  public static IUnknown_QueryService(punk: HANDLE | 0n, guidService: REFGUID, riid: REFIID, ppvOut: LPVOID): HRESULT {
    return Shcore.Load('IUnknown_QueryService')(punk, guidService, riid, ppvOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-iunknown_set
  public static IUnknown_Set(ppunk: LPVOID, punk: HANDLE | 0n): VOID {
    return Shcore.Load('IUnknown_Set')(ppunk, punk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-iunknown_setsite
  public static IUnknown_SetSite(punk: HANDLE, punkSite: HANDLE | 0n): HRESULT {
    return Shcore.Load('IUnknown_SetSite')(punk, punkSite);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellscalingapi/nf-shellscalingapi-registerscalechangeevent
  public static RegisterScaleChangeEvent(hEvent: HANDLE, pdwCookie: LPVOID): HRESULT {
    return Shcore.Load('RegisterScaleChangeEvent')(hEvent, pdwCookie);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellscalingapi/nf-shellscalingapi-registerscalechangenotifications
  public static RegisterScaleChangeNotifications(displayDevice: DWORD, hwndNotify: HWND, uMsgNotify: UINT, pdwCookie: LPDWORD): HRESULT {
    return Shcore.Load('RegisterScaleChangeNotifications')(displayDevice, hwndNotify, uMsgNotify, pdwCookie);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellscalingapi/nf-shellscalingapi-revokescalechangenotifications
  public static RevokeScaleChangeNotifications(displayDevice: DWORD, dwCookie: DWORD): HRESULT {
    return Shcore.Load('RevokeScaleChangeNotifications')(displayDevice, dwCookie);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-setcurrentprocessexplicitappusermodelid
  public static SetCurrentProcessExplicitAppUserModelID(AppID: PCWSTR): HRESULT {
    return Shcore.Load('SetCurrentProcessExplicitAppUserModelID')(AppID);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellscalingapi/nf-shellscalingapi-setprocessdpiawareness
  public static SetProcessDpiAwareness(value: DWORD): HRESULT {
    return Shcore.Load('SetProcessDpiAwareness')(value);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-setprocessreference
  public static SetProcessReference(punk: HANDLE | 0n): VOID {
    return Shcore.Load('SetProcessReference')(punk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shansitoansi
  public static SHAnsiToAnsi(pszSrc: LPCSTR, pszDst: LPSTR, cchBuf: INT): INT {
    return Shcore.Load('SHAnsiToAnsi')(pszSrc, pszDst, cchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shansitounicode
  public static SHAnsiToUnicode(pszSrc: LPCSTR, pwszDst: LPWSTR, cwchBuf: INT): INT {
    return Shcore.Load('SHAnsiToUnicode')(pszSrc, pwszDst, cwchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcopykeya
  public static SHCopyKeyA(hkeySrc: HKEY, pszSrcSubKey: LPCSTR | NULL, hkeyDest: HKEY, fReserved: DWORD): LSTATUS {
    return Shcore.Load('SHCopyKeyA')(hkeySrc, pszSrcSubKey, hkeyDest, fReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcopykeyw
  public static SHCopyKeyW(hkeySrc: HKEY, pszSrcSubKey: LPCWSTR | NULL, hkeyDest: HKEY, fReserved: DWORD): LSTATUS {
    return Shcore.Load('SHCopyKeyW')(hkeySrc, pszSrcSubKey, hkeyDest, fReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreatememstream
  public static SHCreateMemStream(pInit: LPBYTE | NULL, cbInit: UINT): LONG_PTR {
    return Shcore.Load('SHCreateMemStream')(pInit, cbInit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreatestreamonfilea
  public static SHCreateStreamOnFileA(pszFile: LPCSTR, grfMode: DWORD, ppstm: LPVOID): HRESULT {
    return Shcore.Load('SHCreateStreamOnFileA')(pszFile, grfMode, ppstm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreatestreamonfileex
  public static SHCreateStreamOnFileEx(pszFile: LPCWSTR, grfMode: DWORD, dwAttributes: DWORD, fCreate: BOOL, pstmTemplate: HANDLE | 0n, ppstm: LPVOID): HRESULT {
    return Shcore.Load('SHCreateStreamOnFileEx')(pszFile, grfMode, dwAttributes, fCreate, pstmTemplate, ppstm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreatestreamonfilew
  public static SHCreateStreamOnFileW(pszFile: LPCWSTR, grfMode: DWORD, ppstm: LPVOID): HRESULT {
    return Shcore.Load('SHCreateStreamOnFileW')(pszFile, grfMode, ppstm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreatethread
  public static SHCreateThread(pfnThreadProc: LPTHREAD_START_ROUTINE, pData: LPVOID | NULL, flags: DWORD, pfnCallback: LPTHREAD_START_ROUTINE | NULL): BOOL {
    return Shcore.Load('SHCreateThread')(pfnThreadProc, pData, flags, pfnCallback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreatethreadref
  public static SHCreateThreadRef(pcRef: LPVOID, ppunk: LPVOID): HRESULT {
    return Shcore.Load('SHCreateThreadRef')(pcRef, ppunk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreatethreadwithhandle
  public static SHCreateThreadWithHandle(pfnThreadProc: LPTHREAD_START_ROUTINE, pData: LPVOID | NULL, flags: DWORD, pfnCallback: LPTHREAD_START_ROUTINE | NULL, pHandle: LPVOID | NULL): BOOL {
    return Shcore.Load('SHCreateThreadWithHandle')(pfnThreadProc, pData, flags, pfnCallback, pHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shdeleteemptykeya
  public static SHDeleteEmptyKeyA(hkey: HKEY, pszSubKey: LPCSTR | NULL): LSTATUS {
    return Shcore.Load('SHDeleteEmptyKeyA')(hkey, pszSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shdeleteemptykeyw
  public static SHDeleteEmptyKeyW(hkey: HKEY, pszSubKey: LPCWSTR | NULL): LSTATUS {
    return Shcore.Load('SHDeleteEmptyKeyW')(hkey, pszSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shdeletekeya
  public static SHDeleteKeyA(hkey: HKEY, pszSubKey: LPCSTR | NULL): LSTATUS {
    return Shcore.Load('SHDeleteKeyA')(hkey, pszSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shdeletekeyw
  public static SHDeleteKeyW(hkey: HKEY, pszSubKey: LPCWSTR | NULL): LSTATUS {
    return Shcore.Load('SHDeleteKeyW')(hkey, pszSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shdeletevaluea
  public static SHDeleteValueA(hkey: HKEY, pszSubKey: LPCSTR | NULL, pszValue: LPCSTR): LSTATUS {
    return Shcore.Load('SHDeleteValueA')(hkey, pszSubKey, pszValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shdeletevaluew
  public static SHDeleteValueW(hkey: HKEY, pszSubKey: LPCWSTR | NULL, pszValue: LPCWSTR): LSTATUS {
    return Shcore.Load('SHDeleteValueW')(hkey, pszSubKey, pszValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shenumkeyexa
  public static SHEnumKeyExA(hkey: HKEY, dwIndex: DWORD, pszName: LPSTR, pcchName: LPDWORD): LSTATUS {
    return Shcore.Load('SHEnumKeyExA')(hkey, dwIndex, pszName, pcchName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shenumkeyexw
  public static SHEnumKeyExW(hkey: HKEY, dwIndex: DWORD, pszName: LPWSTR, pcchName: LPDWORD): LSTATUS {
    return Shcore.Load('SHEnumKeyExW')(hkey, dwIndex, pszName, pcchName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shenumvaluea
  public static SHEnumValueA(hkey: HKEY, dwIndex: DWORD, pszValueName: LPSTR | NULL, pcchValueName: LPDWORD | NULL, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL): LSTATUS {
    return Shcore.Load('SHEnumValueA')(hkey, dwIndex, pszValueName, pcchValueName, pdwType, pvData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shenumvaluew
  public static SHEnumValueW(hkey: HKEY, dwIndex: DWORD, pszValueName: LPWSTR | NULL, pcchValueName: LPDWORD | NULL, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL): LSTATUS {
    return Shcore.Load('SHEnumValueW')(hkey, dwIndex, pszValueName, pcchValueName, pdwType, pvData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shgetthreadref
  public static SHGetThreadRef(ppunk: LPVOID): HRESULT {
    return Shcore.Load('SHGetThreadRef')(ppunk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shgetvaluea
  public static SHGetValueA(hkey: HKEY, pszSubKey: LPCSTR | NULL, pszValue: LPCSTR | NULL, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL): LSTATUS {
    return Shcore.Load('SHGetValueA')(hkey, pszSubKey, pszValue, pdwType, pvData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shgetvaluew
  public static SHGetValueW(hkey: HKEY, pszSubKey: LPCWSTR | NULL, pszValue: LPCWSTR | NULL, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL): LSTATUS {
    return Shcore.Load('SHGetValueW')(hkey, pszSubKey, pszValue, pdwType, pvData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shopenregstream2a
  public static SHOpenRegStream2A(hkey: HKEY, pszSubkey: LPCSTR | NULL, pszValue: LPCSTR | NULL, grfMode: DWORD): LONG_PTR {
    return Shcore.Load('SHOpenRegStream2A')(hkey, pszSubkey, pszValue, grfMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shopenregstream2w
  public static SHOpenRegStream2W(hkey: HKEY, pszSubkey: LPCWSTR | NULL, pszValue: LPCWSTR | NULL, grfMode: DWORD): LONG_PTR {
    return Shcore.Load('SHOpenRegStream2W')(hkey, pszSubkey, pszValue, grfMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shopenregstreama
  public static SHOpenRegStreamA(hkey: HKEY, pszSubkey: LPCSTR | NULL, pszValue: LPCSTR | NULL, grfMode: DWORD): LONG_PTR {
    return Shcore.Load('SHOpenRegStreamA')(hkey, pszSubkey, pszValue, grfMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shopenregstreamw
  public static SHOpenRegStreamW(hkey: HKEY, pszSubkey: LPCWSTR | NULL, pszValue: LPCWSTR | NULL, grfMode: DWORD): LONG_PTR {
    return Shcore.Load('SHOpenRegStreamW')(hkey, pszSubkey, pszValue, grfMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shqueryinfokeya
  public static SHQueryInfoKeyA(hkey: HKEY, pcSubKeys: LPDWORD | NULL, pcchMaxSubKeyLen: LPDWORD | NULL, pcValues: LPDWORD | NULL, pcchMaxValueNameLen: LPDWORD | NULL): LSTATUS {
    return Shcore.Load('SHQueryInfoKeyA')(hkey, pcSubKeys, pcchMaxSubKeyLen, pcValues, pcchMaxValueNameLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shqueryinfokeyw
  public static SHQueryInfoKeyW(hkey: HKEY, pcSubKeys: LPDWORD | NULL, pcchMaxSubKeyLen: LPDWORD | NULL, pcValues: LPDWORD | NULL, pcchMaxValueNameLen: LPDWORD | NULL): LSTATUS {
    return Shcore.Load('SHQueryInfoKeyW')(hkey, pcSubKeys, pcchMaxSubKeyLen, pcValues, pcchMaxValueNameLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shqueryvalueexa
  public static SHQueryValueExA(hkey: HKEY, pszValue: LPCSTR | NULL, pdwReserved: LPDWORD | NULL, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL): LSTATUS {
    return Shcore.Load('SHQueryValueExA')(hkey, pszValue, pdwReserved, pdwType, pvData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shqueryvalueexw
  public static SHQueryValueExW(hkey: HKEY, pszValue: LPCWSTR | NULL, pdwReserved: LPDWORD | NULL, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL): LSTATUS {
    return Shcore.Load('SHQueryValueExW')(hkey, pszValue, pdwReserved, pdwType, pvData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregduplicatehkey
  public static SHRegDuplicateHKey(hkey: HKEY): HKEY {
    return Shcore.Load('SHRegDuplicateHKey')(hkey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreggetintw
  public static SHRegGetIntW(hk: HKEY, pwzKey: PCWSTR | NULL, iDefault: INT): INT {
    return Shcore.Load('SHRegGetIntW')(hk, pwzKey, iDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreggetpatha
  public static SHRegGetPathA(hKey: HKEY, pcszSubKey: LPCSTR | NULL, pcszValue: LPCSTR | NULL, pszPath: LPSTR, dwFlags: DWORD): LSTATUS {
    return Shcore.Load('SHRegGetPathA')(hKey, pcszSubKey, pcszValue, pszPath, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreggetpathw
  public static SHRegGetPathW(hKey: HKEY, pcszSubKey: LPCWSTR | NULL, pcszValue: LPCWSTR | NULL, pszPath: LPWSTR, dwFlags: DWORD): LSTATUS {
    return Shcore.Load('SHRegGetPathW')(hKey, pcszSubKey, pcszValue, pszPath, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreggetvaluea
  public static SHRegGetValueA(hkey: HKEY, pszSubKey: LPCSTR | NULL, pszValue: LPCSTR | NULL, srrfFlags: DWORD, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL): LSTATUS {
    return Shcore.Load('SHRegGetValueA')(hkey, pszSubKey, pszValue, srrfFlags, pdwType, pvData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreggetvaluefromhkcuhklm
  public static SHRegGetValueFromHKCUHKLM(pwszKey: PCWSTR, pwszValue: PCWSTR | NULL, srrfFlags: DWORD, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL): LSTATUS {
    return Shcore.Load('SHRegGetValueFromHKCUHKLM')(pwszKey, pwszValue, srrfFlags, pdwType, pvData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreggetvaluew
  public static SHRegGetValueW(hkey: HKEY, pszSubKey: LPCWSTR | NULL, pszValue: LPCWSTR | NULL, srrfFlags: DWORD, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL): LSTATUS {
    return Shcore.Load('SHRegGetValueW')(hkey, pszSubKey, pszValue, srrfFlags, pdwType, pvData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregsetpatha
  public static SHRegSetPathA(hKey: HKEY, pcszSubKey: LPCSTR | NULL, pcszValue: LPCSTR | NULL, pcszPath: LPCSTR, dwFlags: DWORD): LSTATUS {
    return Shcore.Load('SHRegSetPathA')(hKey, pcszSubKey, pcszValue, pcszPath, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregsetpathw
  public static SHRegSetPathW(hKey: HKEY, pcszSubKey: LPCWSTR | NULL, pcszValue: LPCWSTR | NULL, pcszPath: LPCWSTR, dwFlags: DWORD): LSTATUS {
    return Shcore.Load('SHRegSetPathW')(hKey, pcszSubKey, pcszValue, pcszPath, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreleasethreadref
  public static SHReleaseThreadRef(): HRESULT {
    return Shcore.Load('SHReleaseThreadRef')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shsetthreadref
  public static SHSetThreadRef(punk: HANDLE | 0n): HRESULT {
    return Shcore.Load('SHSetThreadRef')(punk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shsetvaluea
  public static SHSetValueA(hkey: HKEY, pszSubKey: LPCSTR | NULL, pszValue: LPCSTR | NULL, dwType: DWORD, pvData: LPVOID | NULL, cbData: DWORD): LSTATUS {
    return Shcore.Load('SHSetValueA')(hkey, pszSubKey, pszValue, dwType, pvData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shsetvaluew
  public static SHSetValueW(hkey: HKEY, pszSubKey: LPCWSTR | NULL, pszValue: LPCWSTR | NULL, dwType: DWORD, pvData: LPVOID | NULL, cbData: DWORD): LSTATUS {
    return Shcore.Load('SHSetValueW')(hkey, pszSubKey, pszValue, dwType, pvData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shstrdupa
  public static SHStrDupA(psz: LPCSTR, ppwsz: LPVOID): HRESULT {
    return Shcore.Load('SHStrDupA')(psz, ppwsz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shstrdupw
  public static SHStrDupW(psz: LPCWSTR, ppwsz: LPVOID): HRESULT {
    return Shcore.Load('SHStrDupW')(psz, ppwsz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shunicodetoansi
  public static SHUnicodeToAnsi(pwszSrc: PCWSTR, pszDst: LPSTR, cchBuf: INT): INT {
    return Shcore.Load('SHUnicodeToAnsi')(pwszSrc, pszDst, cchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shunicodetounicode
  public static SHUnicodeToUnicode(pwzSrc: PCWSTR, pwzDst: LPWSTR, cwchBuf: INT): INT {
    return Shcore.Load('SHUnicodeToUnicode')(pwzSrc, pwzDst, cwchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellscalingapi/nf-shellscalingapi-unregisterscalechangeevent
  public static UnregisterScaleChangeEvent(dwCookie: DWORD_PTR): HRESULT {
    return Shcore.Load('UnregisterScaleChangeEvent')(dwCookie);
  }
}

export default Shcore;
