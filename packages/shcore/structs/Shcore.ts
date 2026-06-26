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
  Optional,
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
  public static CommandLineToArgvW(lpCmdLine: LPCWSTR, pNumArgs_out: LPVOID): LPWSTR {
    return Shcore.Load('CommandLineToArgvW')(lpCmdLine, pNumArgs_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shcore/nf-shcore-createrandomaccessstreamonfile
  public static CreateRandomAccessStreamOnFile(filePath: PCWSTR, accessMode: DWORD, riid: REFIID, ppv_out: LPVOID): HRESULT {
    return Shcore.Load('CreateRandomAccessStreamOnFile')(filePath, accessMode, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shcore/nf-shcore-createrandomaccessstreamoverstream
  public static CreateRandomAccessStreamOverStream(stream: HANDLE, options: DWORD, riid: REFIID, ppv_out: LPVOID): HRESULT {
    return Shcore.Load('CreateRandomAccessStreamOverStream')(stream, options, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shcore/nf-shcore-createstreamoverrandomaccessstream
  public static CreateStreamOverRandomAccessStream(randomAccessStream: HANDLE, riid: REFIID, ppv_out: LPVOID): HRESULT {
    return Shcore.Load('CreateStreamOverRandomAccessStream')(randomAccessStream, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-getcurrentprocessexplicitappusermodelid
  public static GetCurrentProcessExplicitAppUserModelID(AppID_out: LPVOID): HRESULT {
    return Shcore.Load('GetCurrentProcessExplicitAppUserModelID')(AppID_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellscalingapi/nf-shellscalingapi-getdpiformonitor
  public static GetDpiForMonitor(hmonitor: HMONITOR, dpiType: DWORD, dpiX_out: LPVOID, dpiY_out: LPVOID): HRESULT {
    return Shcore.Load('GetDpiForMonitor')(hmonitor, dpiType, dpiX_out, dpiY_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellscalingapi/nf-shellscalingapi-getdpiforshelluicomponent
  public static GetDpiForShellUIComponent(shellUiComponent: DWORD): UINT {
    return Shcore.Load('GetDpiForShellUIComponent')(shellUiComponent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellscalingapi/nf-shellscalingapi-getprocessdpiawareness
  public static GetProcessDpiAwareness(hprocess: Optional<HANDLE>, value_out: LPVOID): HRESULT {
    return Shcore.Load('GetProcessDpiAwareness')(hprocess, value_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-getprocessreference
  public static GetProcessReference(punk_out: LPVOID): HRESULT {
    return Shcore.Load('GetProcessReference')(punk_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellscalingapi/nf-shellscalingapi-getscalefactorfordevice
  public static GetScaleFactorForDevice(deviceType: DWORD): INT {
    return Shcore.Load('GetScaleFactorForDevice')(deviceType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellscalingapi/nf-shellscalingapi-getscalefactorformonitor
  public static GetScaleFactorForMonitor(hMon: HMONITOR, pScale_out: LPVOID): HRESULT {
    return Shcore.Load('GetScaleFactorForMonitor')(hMon, pScale_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-isos
  public static IsOS(dwOS: DWORD): BOOL {
    return Shcore.Load('IsOS')(dwOS);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/isolatedapplauncher/nf-isolatedapplauncher-isprocessinisolatedcontainer
  public static IsProcessInIsolatedContainer(isProcessInIsolatedContainer_out: LPBOOL): HRESULT {
    return Shcore.Load('IsProcessInIsolatedContainer')(isProcessInIsolatedContainer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/isolatedapplauncher/nf-isolatedapplauncher-isprocessinwdagcontainer
  public static IsProcessInWDAGContainer(Reserved: NULL, isProcessInWDAGContainer_out: LPBOOL): HRESULT {
    return Shcore.Load('IsProcessInWDAGContainer')(Reserved, isProcessInWDAGContainer_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-istream_copy
  public static IStream_Copy(pstmFrom: HANDLE, pstmTo: HANDLE, cb: DWORD): HRESULT {
    return Shcore.Load('IStream_Copy')(pstmFrom, pstmTo, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-istream_read
  public static IStream_Read(pstm: HANDLE, pv_out: LPVOID, cb: DWORD): HRESULT {
    return Shcore.Load('IStream_Read')(pstm, pv_out, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-istream_readstr
  public static IStream_ReadStr(pstm: HANDLE, ppsz_out: LPVOID): HRESULT {
    return Shcore.Load('IStream_ReadStr')(pstm, ppsz_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-istream_reset
  public static IStream_Reset(pstm: HANDLE): HRESULT {
    return Shcore.Load('IStream_Reset')(pstm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-istream_size
  public static IStream_Size(pstm: HANDLE, pui_out: LPVOID): HRESULT {
    return Shcore.Load('IStream_Size')(pstm, pui_out);
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
  public static IUnknown_AtomicRelease(ppunk_in_out: Optional<LPVOID>): VOID {
    return Shcore.Load('IUnknown_AtomicRelease')(ppunk_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-iunknown_getsite
  public static IUnknown_GetSite(punk: HANDLE, riid: REFIID, ppv_out: LPVOID): HRESULT {
    return Shcore.Load('IUnknown_GetSite')(punk, riid, ppv_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-iunknown_queryservice
  public static IUnknown_QueryService(punk: Optional<HANDLE>, guidService: REFGUID, riid: REFIID, ppvOut_out: LPVOID): HRESULT {
    return Shcore.Load('IUnknown_QueryService')(punk, guidService, riid, ppvOut_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-iunknown_set
  public static IUnknown_Set(ppunk_in_out: LPVOID, punk: Optional<HANDLE>): VOID {
    return Shcore.Load('IUnknown_Set')(ppunk_in_out, punk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-iunknown_setsite
  public static IUnknown_SetSite(punk: HANDLE, punkSite: Optional<HANDLE>): HRESULT {
    return Shcore.Load('IUnknown_SetSite')(punk, punkSite);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellscalingapi/nf-shellscalingapi-registerscalechangeevent
  public static RegisterScaleChangeEvent(hEvent: HANDLE, pdwCookie_out: LPVOID): HRESULT {
    return Shcore.Load('RegisterScaleChangeEvent')(hEvent, pdwCookie_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellscalingapi/nf-shellscalingapi-registerscalechangenotifications
  public static RegisterScaleChangeNotifications(displayDevice: DWORD, hwndNotify: HWND, uMsgNotify: UINT, pdwCookie_out: LPDWORD): HRESULT {
    return Shcore.Load('RegisterScaleChangeNotifications')(displayDevice, hwndNotify, uMsgNotify, pdwCookie_out);
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
  public static SetProcessReference(punk: Optional<HANDLE>): VOID {
    return Shcore.Load('SetProcessReference')(punk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shansitoansi
  public static SHAnsiToAnsi(pszSrc: LPCSTR, pszDst_out: LPSTR, cchBuf: INT): INT {
    return Shcore.Load('SHAnsiToAnsi')(pszSrc, pszDst_out, cchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shansitounicode
  public static SHAnsiToUnicode(pszSrc: LPCSTR, pwszDst_out: LPWSTR, cwchBuf: INT): INT {
    return Shcore.Load('SHAnsiToUnicode')(pszSrc, pwszDst_out, cwchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcopykeya
  public static SHCopyKeyA(hkeySrc: HKEY, pszSrcSubKey: Optional<LPCSTR>, hkeyDest: HKEY, fReserved: DWORD): LSTATUS {
    return Shcore.Load('SHCopyKeyA')(hkeySrc, pszSrcSubKey, hkeyDest, fReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcopykeyw
  public static SHCopyKeyW(hkeySrc: HKEY, pszSrcSubKey: Optional<LPCWSTR>, hkeyDest: HKEY, fReserved: DWORD): LSTATUS {
    return Shcore.Load('SHCopyKeyW')(hkeySrc, pszSrcSubKey, hkeyDest, fReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreatememstream
  public static SHCreateMemStream(pInit: Optional<LPBYTE>, cbInit: UINT): LONG_PTR {
    return Shcore.Load('SHCreateMemStream')(pInit, cbInit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreatestreamonfilea
  public static SHCreateStreamOnFileA(pszFile: LPCSTR, grfMode: DWORD, ppstm_out: LPVOID): HRESULT {
    return Shcore.Load('SHCreateStreamOnFileA')(pszFile, grfMode, ppstm_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreatestreamonfileex
  public static SHCreateStreamOnFileEx(pszFile: LPCWSTR, grfMode: DWORD, dwAttributes: DWORD, fCreate: BOOL, pstmTemplate: Optional<HANDLE>, ppstm_out: LPVOID): HRESULT {
    return Shcore.Load('SHCreateStreamOnFileEx')(pszFile, grfMode, dwAttributes, fCreate, pstmTemplate, ppstm_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreatestreamonfilew
  public static SHCreateStreamOnFileW(pszFile: LPCWSTR, grfMode: DWORD, ppstm_out: LPVOID): HRESULT {
    return Shcore.Load('SHCreateStreamOnFileW')(pszFile, grfMode, ppstm_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreatethread
  public static SHCreateThread(pfnThreadProc: LPTHREAD_START_ROUTINE, pData: Optional<LPVOID>, flags: DWORD, pfnCallback: Optional<LPTHREAD_START_ROUTINE>): BOOL {
    return Shcore.Load('SHCreateThread')(pfnThreadProc, pData, flags, pfnCallback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreatethreadref
  public static SHCreateThreadRef(pcRef_in_out: LPVOID, ppunk_out: LPVOID): HRESULT {
    return Shcore.Load('SHCreateThreadRef')(pcRef_in_out, ppunk_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreatethreadwithhandle
  public static SHCreateThreadWithHandle(pfnThreadProc: LPTHREAD_START_ROUTINE, pData: Optional<LPVOID>, flags: DWORD, pfnCallback: Optional<LPTHREAD_START_ROUTINE>, pHandle_out: Optional<LPVOID>): BOOL {
    return Shcore.Load('SHCreateThreadWithHandle')(pfnThreadProc, pData, flags, pfnCallback, pHandle_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shdeleteemptykeya
  public static SHDeleteEmptyKeyA(hkey: HKEY, pszSubKey: Optional<LPCSTR>): LSTATUS {
    return Shcore.Load('SHDeleteEmptyKeyA')(hkey, pszSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shdeleteemptykeyw
  public static SHDeleteEmptyKeyW(hkey: HKEY, pszSubKey: Optional<LPCWSTR>): LSTATUS {
    return Shcore.Load('SHDeleteEmptyKeyW')(hkey, pszSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shdeletekeya
  public static SHDeleteKeyA(hkey: HKEY, pszSubKey: Optional<LPCSTR>): LSTATUS {
    return Shcore.Load('SHDeleteKeyA')(hkey, pszSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shdeletekeyw
  public static SHDeleteKeyW(hkey: HKEY, pszSubKey: Optional<LPCWSTR>): LSTATUS {
    return Shcore.Load('SHDeleteKeyW')(hkey, pszSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shdeletevaluea
  public static SHDeleteValueA(hkey: HKEY, pszSubKey: Optional<LPCSTR>, pszValue: LPCSTR): LSTATUS {
    return Shcore.Load('SHDeleteValueA')(hkey, pszSubKey, pszValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shdeletevaluew
  public static SHDeleteValueW(hkey: HKEY, pszSubKey: Optional<LPCWSTR>, pszValue: LPCWSTR): LSTATUS {
    return Shcore.Load('SHDeleteValueW')(hkey, pszSubKey, pszValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shenumkeyexa
  public static SHEnumKeyExA(hkey: HKEY, dwIndex: DWORD, pszName_out: LPSTR, pcchName_in_out: LPDWORD): LSTATUS {
    return Shcore.Load('SHEnumKeyExA')(hkey, dwIndex, pszName_out, pcchName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shenumkeyexw
  public static SHEnumKeyExW(hkey: HKEY, dwIndex: DWORD, pszName_out: LPWSTR, pcchName_in_out: LPDWORD): LSTATUS {
    return Shcore.Load('SHEnumKeyExW')(hkey, dwIndex, pszName_out, pcchName_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shenumvaluea
  public static SHEnumValueA(hkey: HKEY, dwIndex: DWORD, pszValueName_out: Optional<LPSTR>, pcchValueName_in_out: Optional<LPDWORD>, pdwType_out: Optional<LPDWORD>, pvData_out: Optional<LPVOID>, pcbData_in_out: Optional<LPDWORD>): LSTATUS {
    return Shcore.Load('SHEnumValueA')(hkey, dwIndex, pszValueName_out, pcchValueName_in_out, pdwType_out, pvData_out, pcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shenumvaluew
  public static SHEnumValueW(
    hkey: HKEY,
    dwIndex: DWORD,
    pszValueName_out: Optional<LPWSTR>,
    pcchValueName_in_out: Optional<LPDWORD>,
    pdwType_out: Optional<LPDWORD>,
    pvData_out: Optional<LPVOID>,
    pcbData_in_out: Optional<LPDWORD>,
  ): LSTATUS {
    return Shcore.Load('SHEnumValueW')(hkey, dwIndex, pszValueName_out, pcchValueName_in_out, pdwType_out, pvData_out, pcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shgetthreadref
  public static SHGetThreadRef(ppunk_out: LPVOID): HRESULT {
    return Shcore.Load('SHGetThreadRef')(ppunk_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shgetvaluea
  public static SHGetValueA(hkey: HKEY, pszSubKey: Optional<LPCSTR>, pszValue: Optional<LPCSTR>, pdwType_out: Optional<LPDWORD>, pvData_out: Optional<LPVOID>, pcbData_in_out: Optional<LPDWORD>): LSTATUS {
    return Shcore.Load('SHGetValueA')(hkey, pszSubKey, pszValue, pdwType_out, pvData_out, pcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shgetvaluew
  public static SHGetValueW(hkey: HKEY, pszSubKey: Optional<LPCWSTR>, pszValue: Optional<LPCWSTR>, pdwType_out: Optional<LPDWORD>, pvData_out: Optional<LPVOID>, pcbData_in_out: Optional<LPDWORD>): LSTATUS {
    return Shcore.Load('SHGetValueW')(hkey, pszSubKey, pszValue, pdwType_out, pvData_out, pcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shopenregstream2a
  public static SHOpenRegStream2A(hkey: HKEY, pszSubkey: Optional<LPCSTR>, pszValue: Optional<LPCSTR>, grfMode: DWORD): LONG_PTR {
    return Shcore.Load('SHOpenRegStream2A')(hkey, pszSubkey, pszValue, grfMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shopenregstream2w
  public static SHOpenRegStream2W(hkey: HKEY, pszSubkey: Optional<LPCWSTR>, pszValue: Optional<LPCWSTR>, grfMode: DWORD): LONG_PTR {
    return Shcore.Load('SHOpenRegStream2W')(hkey, pszSubkey, pszValue, grfMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shopenregstreama
  public static SHOpenRegStreamA(hkey: HKEY, pszSubkey: Optional<LPCSTR>, pszValue: Optional<LPCSTR>, grfMode: DWORD): LONG_PTR {
    return Shcore.Load('SHOpenRegStreamA')(hkey, pszSubkey, pszValue, grfMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shopenregstreamw
  public static SHOpenRegStreamW(hkey: HKEY, pszSubkey: Optional<LPCWSTR>, pszValue: Optional<LPCWSTR>, grfMode: DWORD): LONG_PTR {
    return Shcore.Load('SHOpenRegStreamW')(hkey, pszSubkey, pszValue, grfMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shqueryinfokeya
  public static SHQueryInfoKeyA(hkey: HKEY, pcSubKeys_out: Optional<LPDWORD>, pcchMaxSubKeyLen_out: Optional<LPDWORD>, pcValues_out: Optional<LPDWORD>, pcchMaxValueNameLen_out: Optional<LPDWORD>): LSTATUS {
    return Shcore.Load('SHQueryInfoKeyA')(hkey, pcSubKeys_out, pcchMaxSubKeyLen_out, pcValues_out, pcchMaxValueNameLen_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shqueryinfokeyw
  public static SHQueryInfoKeyW(hkey: HKEY, pcSubKeys_out: Optional<LPDWORD>, pcchMaxSubKeyLen_out: Optional<LPDWORD>, pcValues_out: Optional<LPDWORD>, pcchMaxValueNameLen_out: Optional<LPDWORD>): LSTATUS {
    return Shcore.Load('SHQueryInfoKeyW')(hkey, pcSubKeys_out, pcchMaxSubKeyLen_out, pcValues_out, pcchMaxValueNameLen_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shqueryvalueexa
  public static SHQueryValueExA(hkey: HKEY, pszValue: Optional<LPCSTR>, pdwReserved: Optional<LPDWORD>, pdwType_out: Optional<LPDWORD>, pvData_out: Optional<LPVOID>, pcbData_in_out: Optional<LPDWORD>): LSTATUS {
    return Shcore.Load('SHQueryValueExA')(hkey, pszValue, pdwReserved, pdwType_out, pvData_out, pcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shqueryvalueexw
  public static SHQueryValueExW(hkey: HKEY, pszValue: Optional<LPCWSTR>, pdwReserved: Optional<LPDWORD>, pdwType_out: Optional<LPDWORD>, pvData_out: Optional<LPVOID>, pcbData_in_out: Optional<LPDWORD>): LSTATUS {
    return Shcore.Load('SHQueryValueExW')(hkey, pszValue, pdwReserved, pdwType_out, pvData_out, pcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregduplicatehkey
  public static SHRegDuplicateHKey(hkey: HKEY): HKEY {
    return Shcore.Load('SHRegDuplicateHKey')(hkey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreggetintw
  public static SHRegGetIntW(hk: HKEY, pwzKey: Optional<PCWSTR>, iDefault: INT): INT {
    return Shcore.Load('SHRegGetIntW')(hk, pwzKey, iDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreggetpatha
  public static SHRegGetPathA(hKey: HKEY, pcszSubKey: Optional<LPCSTR>, pcszValue: Optional<LPCSTR>, pszPath_out: LPSTR, dwFlags: DWORD): LSTATUS {
    return Shcore.Load('SHRegGetPathA')(hKey, pcszSubKey, pcszValue, pszPath_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreggetpathw
  public static SHRegGetPathW(hKey: HKEY, pcszSubKey: Optional<LPCWSTR>, pcszValue: Optional<LPCWSTR>, pszPath_out: LPWSTR, dwFlags: DWORD): LSTATUS {
    return Shcore.Load('SHRegGetPathW')(hKey, pcszSubKey, pcszValue, pszPath_out, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreggetvaluea
  public static SHRegGetValueA(hkey: HKEY, pszSubKey: Optional<LPCSTR>, pszValue: Optional<LPCSTR>, srrfFlags: DWORD, pdwType_out: Optional<LPDWORD>, pvData_out: Optional<LPVOID>, pcbData_in_out: Optional<LPDWORD>): LSTATUS {
    return Shcore.Load('SHRegGetValueA')(hkey, pszSubKey, pszValue, srrfFlags, pdwType_out, pvData_out, pcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreggetvaluefromhkcuhklm
  public static SHRegGetValueFromHKCUHKLM(pwszKey: PCWSTR, pwszValue: Optional<PCWSTR>, srrfFlags: DWORD, pdwType_out: Optional<LPDWORD>, pvData_out: Optional<LPVOID>, pcbData_in_out: Optional<LPDWORD>): LSTATUS {
    return Shcore.Load('SHRegGetValueFromHKCUHKLM')(pwszKey, pwszValue, srrfFlags, pdwType_out, pvData_out, pcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreggetvaluew
  public static SHRegGetValueW(hkey: HKEY, pszSubKey: Optional<LPCWSTR>, pszValue: Optional<LPCWSTR>, srrfFlags: DWORD, pdwType_out: Optional<LPDWORD>, pvData_out: Optional<LPVOID>, pcbData_in_out: Optional<LPDWORD>): LSTATUS {
    return Shcore.Load('SHRegGetValueW')(hkey, pszSubKey, pszValue, srrfFlags, pdwType_out, pvData_out, pcbData_in_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregsetpatha
  public static SHRegSetPathA(hKey: HKEY, pcszSubKey: Optional<LPCSTR>, pcszValue: Optional<LPCSTR>, pcszPath: LPCSTR, dwFlags: DWORD): LSTATUS {
    return Shcore.Load('SHRegSetPathA')(hKey, pcszSubKey, pcszValue, pcszPath, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregsetpathw
  public static SHRegSetPathW(hKey: HKEY, pcszSubKey: Optional<LPCWSTR>, pcszValue: Optional<LPCWSTR>, pcszPath: LPCWSTR, dwFlags: DWORD): LSTATUS {
    return Shcore.Load('SHRegSetPathW')(hKey, pcszSubKey, pcszValue, pcszPath, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreleasethreadref
  public static SHReleaseThreadRef(): HRESULT {
    return Shcore.Load('SHReleaseThreadRef')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shsetthreadref
  public static SHSetThreadRef(punk: Optional<HANDLE>): HRESULT {
    return Shcore.Load('SHSetThreadRef')(punk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shsetvaluea
  public static SHSetValueA(hkey: HKEY, pszSubKey: Optional<LPCSTR>, pszValue: Optional<LPCSTR>, dwType: DWORD, pvData: Optional<LPVOID>, cbData: DWORD): LSTATUS {
    return Shcore.Load('SHSetValueA')(hkey, pszSubKey, pszValue, dwType, pvData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shsetvaluew
  public static SHSetValueW(hkey: HKEY, pszSubKey: Optional<LPCWSTR>, pszValue: Optional<LPCWSTR>, dwType: DWORD, pvData: Optional<LPVOID>, cbData: DWORD): LSTATUS {
    return Shcore.Load('SHSetValueW')(hkey, pszSubKey, pszValue, dwType, pvData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shstrdupa
  public static SHStrDupA(psz: LPCSTR, ppwsz_out: LPVOID): HRESULT {
    return Shcore.Load('SHStrDupA')(psz, ppwsz_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shstrdupw
  public static SHStrDupW(psz: LPCWSTR, ppwsz_out: LPVOID): HRESULT {
    return Shcore.Load('SHStrDupW')(psz, ppwsz_out);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shunicodetoansi
  public static SHUnicodeToAnsi(pwszSrc: PCWSTR, pszDst_out: LPSTR, cchBuf: INT): INT {
    return Shcore.Load('SHUnicodeToAnsi')(pwszSrc, pszDst_out, cchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shunicodetounicode
  public static SHUnicodeToUnicode(pwzSrc: PCWSTR, pwzDst_out: LPWSTR, cwchBuf: INT): INT {
    return Shcore.Load('SHUnicodeToUnicode')(pwzSrc, pwzDst_out, cwchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shellscalingapi/nf-shellscalingapi-unregisterscalechangeevent
  public static UnregisterScaleChangeEvent(dwCookie: DWORD_PTR): HRESULT {
    return Shcore.Load('UnregisterScaleChangeEvent')(dwCookie);
  }
}

export default Shcore;
