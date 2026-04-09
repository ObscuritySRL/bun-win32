import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { BOOL, DWORD, HANDLE, LPDWORD, LPLPVOID, LPCSTR, LPCVOID, LPCWSTR, LPSTR, LPVOID, LPWSTR, NULL, PDWORD, PUINT } from '../types/Version';

/**
 * Thin, lazy-loaded FFI bindings for `version.dll`.
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
 * import Version from './structs/Version';
 *
 * // Lazy: bind on first call
 * const size = Version.GetFileVersionInfoSizeW(filePath.ptr, null);
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Version.Preload(['GetFileVersionInfoW', 'VerQueryValueW']);
 * ```
 */
class Version extends Win32 {
  protected static override name = 'version.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    GetFileVersionInfoA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetFileVersionInfoByHandle: { args: [FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetFileVersionInfoExA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetFileVersionInfoExW: { args: [FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    GetFileVersionInfoSizeA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetFileVersionInfoSizeExA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetFileVersionInfoSizeExW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetFileVersionInfoSizeW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    GetFileVersionInfoW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    VerFindFileA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    VerFindFileW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    VerInstallFileA: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    VerInstallFileW: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    VerQueryValueA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    VerQueryValueW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/winver/nf-winver-getfileversioninfoa
  public static GetFileVersionInfoA(lptstrFilename: LPCSTR, dwHandle: DWORD, dwLen: DWORD, lpData: LPVOID): BOOL {
    return Version.Load('GetFileVersionInfoA')(lptstrFilename, dwHandle, dwLen, lpData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/menurc/getfileversioninfobyhandle
  public static GetFileVersionInfoByHandle(dwFlags: DWORD, hFile: HANDLE, lplpData: LPLPVOID, pdwLen: PDWORD): BOOL {
    return Version.Load('GetFileVersionInfoByHandle')(dwFlags, hFile, lplpData, pdwLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winver/nf-winver-getfileversioninfoexa
  public static GetFileVersionInfoExA(dwFlags: DWORD, lpwstrFilename: LPCSTR, dwHandle: DWORD, dwLen: DWORD, lpData: LPVOID): BOOL {
    return Version.Load('GetFileVersionInfoExA')(dwFlags, lpwstrFilename, dwHandle, dwLen, lpData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winver/nf-winver-getfileversioninfoexw
  public static GetFileVersionInfoExW(dwFlags: DWORD, lpwstrFilename: LPCWSTR, dwHandle: DWORD, dwLen: DWORD, lpData: LPVOID): BOOL {
    return Version.Load('GetFileVersionInfoExW')(dwFlags, lpwstrFilename, dwHandle, dwLen, lpData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winver/nf-winver-getfileversioninfosizea
  public static GetFileVersionInfoSizeA(lptstrFilename: LPCSTR, lpdwHandle: LPDWORD | NULL): DWORD {
    return Version.Load('GetFileVersionInfoSizeA')(lptstrFilename, lpdwHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winver/nf-winver-getfileversioninfosizeexa
  public static GetFileVersionInfoSizeExA(dwFlags: DWORD, lpwstrFilename: LPCSTR, lpdwHandle: LPDWORD): DWORD {
    return Version.Load('GetFileVersionInfoSizeExA')(dwFlags, lpwstrFilename, lpdwHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winver/nf-winver-getfileversioninfosizeexw
  public static GetFileVersionInfoSizeExW(dwFlags: DWORD, lpwstrFilename: LPCWSTR, lpdwHandle: LPDWORD): DWORD {
    return Version.Load('GetFileVersionInfoSizeExW')(dwFlags, lpwstrFilename, lpdwHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winver/nf-winver-getfileversioninfosizew
  public static GetFileVersionInfoSizeW(lptstrFilename: LPCWSTR, lpdwHandle: LPDWORD | NULL): DWORD {
    return Version.Load('GetFileVersionInfoSizeW')(lptstrFilename, lpdwHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winver/nf-winver-getfileversioninfow
  public static GetFileVersionInfoW(lptstrFilename: LPCWSTR, dwHandle: DWORD, dwLen: DWORD, lpData: LPVOID): BOOL {
    return Version.Load('GetFileVersionInfoW')(lptstrFilename, dwHandle, dwLen, lpData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winver/nf-winver-verfindfilea
  public static VerFindFileA(uFlags: DWORD, szFileName: LPCSTR, szWinDir: LPCSTR | NULL, szAppDir: LPCSTR, szCurDir: LPSTR, puCurDirLen: PUINT, szDestDir: LPSTR, puDestDirLen: PUINT): DWORD {
    return Version.Load('VerFindFileA')(uFlags, szFileName, szWinDir, szAppDir, szCurDir, puCurDirLen, szDestDir, puDestDirLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winver/nf-winver-verfindfilew
  public static VerFindFileW(uFlags: DWORD, szFileName: LPCWSTR, szWinDir: LPCWSTR | NULL, szAppDir: LPCWSTR, szCurDir: LPWSTR, puCurDirLen: PUINT, szDestDir: LPWSTR, puDestDirLen: PUINT): DWORD {
    return Version.Load('VerFindFileW')(uFlags, szFileName, szWinDir, szAppDir, szCurDir, puCurDirLen, szDestDir, puDestDirLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winver/nf-winver-verinstallfilea
  public static VerInstallFileA(uFlags: DWORD, szSrcFileName: LPCSTR, szDestFileName: LPCSTR, szSrcDir: LPCSTR, szDestDir: LPCSTR, szCurDir: LPCSTR, szTmpFile: LPSTR, puTmpFileLen: PUINT): DWORD {
    return Version.Load('VerInstallFileA')(uFlags, szSrcFileName, szDestFileName, szSrcDir, szDestDir, szCurDir, szTmpFile, puTmpFileLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winver/nf-winver-verinstallfilew
  public static VerInstallFileW(uFlags: DWORD, szSrcFileName: LPCWSTR, szDestFileName: LPCWSTR, szSrcDir: LPCWSTR, szDestDir: LPCWSTR, szCurDir: LPCWSTR, szTmpFile: LPWSTR, puTmpFileLen: PUINT): DWORD {
    return Version.Load('VerInstallFileW')(uFlags, szSrcFileName, szDestFileName, szSrcDir, szDestDir, szCurDir, szTmpFile, puTmpFileLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winver/nf-winver-verqueryvaluea
  public static VerQueryValueA(pBlock: LPCVOID, lpSubBlock: LPCSTR, lplpBuffer: LPLPVOID, puLen: PUINT): BOOL {
    return Version.Load('VerQueryValueA')(pBlock, lpSubBlock, lplpBuffer, puLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/winver/nf-winver-verqueryvaluew
  public static VerQueryValueW(pBlock: LPCVOID, lpSubBlock: LPCWSTR, lplpBuffer: LPLPVOID, puLen: PUINT): BOOL {
    return Version.Load('VerQueryValueW')(pBlock, lpSubBlock, lplpBuffer, puLen);
  }
}

export default Version;
