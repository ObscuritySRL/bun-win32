import { type FFIFunction, FFIType } from 'bun:ffi';
import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  BSTR,
  BYTE,
  CHAR,
  COLORREF,
  DWORD,
  HANDLE,
  HDC,
  HINSTANCE,
  HKEY,
  HMENU,
  HMODULE,
  HPALETTE,
  HRESULT,
  HUSKEY,
  HWND,
  INT,
  LONG,
  LONGLONG,
  LONG_PTR,
  LPARAM,
  LPBYTE,
  LPCSTR,
  LPCWSTR,
  LPDWORD,
  LPSTR,
  LPVOID,
  LPWSTR,
  LRESULT,
  LPTHREAD_START_ROUTINE,
  NULL,
  PCSTR,
  PCUIDLIST_RELATIVE,
  PCWSTR,
  PHUSKEY,
  PIDLIST_ABSOLUTE,
  PSTR,
  PWSTR,
  REFIID,
  REGSAM,
  UINT,
  ULONG,
  ULONGLONG,
  VOID,
  WCHAR,
  WNDPROC,
  WORD,
  WPARAM,
} from '../types/Shlwapi';

/**
 * Thin, lazy-loaded FFI bindings for `shlwapi.dll`.
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
 * import Shlwapi from './structs/Shlwapi';
 *
 * // Lazy: bind on first call
 * const exists = Shlwapi.PathFileExistsW(encode('C:\\Windows'));
 *
 * // Or preload a subset to avoid per-symbol lazy binding cost
 * Shlwapi.Preload(['PathFileExistsW', 'PathIsDirectoryW']);
 * ```
 */
class Shlwapi extends Win32 {
  protected static override name = 'shlwapi.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    AssocCreate: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AssocGetPerceivedType: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AssocIsDangerous: { args: [FFIType.ptr], returns: FFIType.i32 },
    AssocQueryKeyA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AssocQueryKeyW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AssocQueryStringA: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AssocQueryStringByKeyA: { args: [FFIType.u32, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AssocQueryStringByKeyW: { args: [FFIType.u32, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    AssocQueryStringW: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ChrCmpIA: { args: [FFIType.u16, FFIType.u16], returns: FFIType.i32 },
    ChrCmpIW: { args: [FFIType.u16, FFIType.u16], returns: FFIType.i32 },
    ColorAdjustLuma: { args: [FFIType.u32, FFIType.i32, FFIType.i32], returns: FFIType.u32 },
    ColorHLSToRGB: { args: [FFIType.u16, FFIType.u16, FFIType.u16], returns: FFIType.u32 },
    ColorRGBToHLS: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.void },
    ConnectToConnectionPoint: { args: [FFIType.u64, FFIType.ptr, FFIType.i32, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DelayLoadFailureHook: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    DllGetClassObject: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    DllGetVersion: { args: [FFIType.ptr], returns: FFIType.i32 },
    GetAcceptLanguagesA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetAcceptLanguagesW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetMenuPosFromID: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    GUIDFromStringW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    HashData: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    IntlStrEqWorkerA: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    IntlStrEqWorkerW: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    IsCharSpaceA: { args: [FFIType.u8], returns: FFIType.i32 },
    IsCharSpaceW: { args: [FFIType.u16], returns: FFIType.i32 },
    IsInternetESCEnabled: { args: [], returns: FFIType.i32 },
    IsOS: { args: [FFIType.u32], returns: FFIType.i32 },
    IStream_Copy: { args: [FFIType.u64, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    IStream_Read: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    IStream_ReadPidl: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IStream_ReadStr: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IStream_Reset: { args: [FFIType.u64], returns: FFIType.i32 },
    IStream_Size: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IStream_Write: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    IStream_WritePidl: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IStream_WriteStr: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IUnknown_AtomicRelease: { args: [FFIType.ptr], returns: FFIType.void },
    IUnknown_Exec: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IUnknown_GetSite: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IUnknown_GetWindow: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    IUnknown_QueryService: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IUnknown_QueryStatus: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    IUnknown_Set: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.void },
    IUnknown_SetSite: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    MLLoadLibraryA: { args: [FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    MLLoadLibraryW: { args: [FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    ParseURLA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ParseURLW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathAddBackslashA: { args: [FFIType.ptr], returns: FFIType.u64 },
    PathAddBackslashW: { args: [FFIType.ptr], returns: FFIType.u64 },
    PathAddExtensionA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathAddExtensionW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathAppendA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathAppendW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathBuildRootA: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    PathBuildRootW: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    PathCanonicalizeA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathCanonicalizeW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathCombineA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    PathCombineW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    PathCommonPrefixA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathCommonPrefixW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathCompactPathA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PathCompactPathExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    PathCompactPathExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    PathCompactPathW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PathCreateFromUrlA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PathCreateFromUrlAlloc: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PathCreateFromUrlW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PathFileExistsA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathFileExistsAndAttributesW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathFileExistsW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathFindExtensionA: { args: [FFIType.ptr], returns: FFIType.u64 },
    PathFindExtensionW: { args: [FFIType.ptr], returns: FFIType.u64 },
    PathFindFileNameA: { args: [FFIType.ptr], returns: FFIType.u64 },
    PathFindFileNameW: { args: [FFIType.ptr], returns: FFIType.u64 },
    PathFindNextComponentA: { args: [FFIType.ptr], returns: FFIType.u64 },
    PathFindNextComponentW: { args: [FFIType.ptr], returns: FFIType.u64 },
    PathFindOnPathA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathFindOnPathW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathFindSuffixArrayA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    PathFindSuffixArrayW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    PathGetArgsA: { args: [FFIType.ptr], returns: FFIType.u64 },
    PathGetArgsW: { args: [FFIType.ptr], returns: FFIType.u64 },
    PathGetCharTypeA: { args: [FFIType.u8], returns: FFIType.u32 },
    PathGetCharTypeW: { args: [FFIType.u16], returns: FFIType.u32 },
    PathGetDriveNumberA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathGetDriveNumberW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsContentTypeA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathIsContentTypeW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathIsDirectoryA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsDirectoryEmptyA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsDirectoryEmptyW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsDirectoryW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsFileSpecA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsFileSpecW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsLFNFileSpecA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsLFNFileSpecW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsNetworkPathA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsNetworkPathW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsPrefixA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathIsPrefixW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathIsRelativeA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsRelativeW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsRootA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsRootW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsSameRootA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathIsSameRootW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathIsSystemFolderA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PathIsSystemFolderW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PathIsUNCA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsUNCServerA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsUNCServerShareA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsUNCServerShareW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsUNCServerW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsUNCW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsURLA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathIsURLW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathMakePrettyA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathMakePrettyW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathMakeSystemFolderA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathMakeSystemFolderW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathMatchSpecA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathMatchSpecExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PathMatchSpecExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PathMatchSpecW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathParseIconLocationA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathParseIconLocationW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathQuoteSpacesA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathQuoteSpacesW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathRelativePathToA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PathRelativePathToW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PathRemoveArgsA: { args: [FFIType.ptr], returns: FFIType.void },
    PathRemoveArgsW: { args: [FFIType.ptr], returns: FFIType.void },
    PathRemoveBackslashA: { args: [FFIType.ptr], returns: FFIType.u64 },
    PathRemoveBackslashW: { args: [FFIType.ptr], returns: FFIType.u64 },
    PathRemoveBlanksA: { args: [FFIType.ptr], returns: FFIType.void },
    PathRemoveBlanksW: { args: [FFIType.ptr], returns: FFIType.void },
    PathRemoveExtensionA: { args: [FFIType.ptr], returns: FFIType.void },
    PathRemoveExtensionW: { args: [FFIType.ptr], returns: FFIType.void },
    PathRemoveFileSpecA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathRemoveFileSpecW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathRenameExtensionA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathRenameExtensionW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    PathSearchAndQualifyA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PathSearchAndQualifyW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PathSetDlgItemPathA: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    PathSetDlgItemPathW: { args: [FFIType.u64, FFIType.i32, FFIType.ptr], returns: FFIType.void },
    PathSkipRootA: { args: [FFIType.ptr], returns: FFIType.u64 },
    PathSkipRootW: { args: [FFIType.ptr], returns: FFIType.u64 },
    PathStripPathA: { args: [FFIType.ptr], returns: FFIType.void },
    PathStripPathW: { args: [FFIType.ptr], returns: FFIType.void },
    PathStripToRootA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathStripToRootW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathUnExpandEnvStringsA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PathUnExpandEnvStringsW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    PathUndecorateA: { args: [FFIType.ptr], returns: FFIType.void },
    PathUndecorateW: { args: [FFIType.ptr], returns: FFIType.void },
    PathUnmakeSystemFolderA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathUnmakeSystemFolderW: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathUnquoteSpacesA: { args: [FFIType.ptr], returns: FFIType.i32 },
    PathUnquoteSpacesW: { args: [FFIType.ptr], returns: FFIType.i32 },
    QISearch: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHAllocShared: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u64 },
    SHAnsiToAnsi: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHAnsiToUnicode: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHAutoComplete: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SHCopyKeyA: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SHCopyKeyW: { args: [FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SHCreateMemStream: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    SHCreateShellPalette: { args: [FFIType.u64], returns: FFIType.u64 },
    SHCreateStreamOnFileA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SHCreateStreamOnFileEx: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.i32, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SHCreateStreamOnFileW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SHCreateStreamWrapper: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateThread: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SHCreateThreadRef: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateThreadWithHandle: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHCreateWorkerWindowW: { args: [FFIType.ptr, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    SHDeleteEmptyKeyA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SHDeleteEmptyKeyW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SHDeleteKeyA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SHDeleteKeyW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SHDeleteOrphanKeyA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SHDeleteOrphanKeyW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SHDeleteValueA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHDeleteValueW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHEnumKeyExA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHEnumKeyExW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHEnumValueA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHEnumValueW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHFormatDateTimeA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHFormatDateTimeW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHFreeShared: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    SHGetInverseCMAP: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHGetThreadRef: { args: [FFIType.ptr], returns: FFIType.i32 },
    SHGetValueA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetValueW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHGetViewStatePropertyBag: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    ShellMessageBoxA: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    ShellMessageBoxInternal: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    ShellMessageBoxW: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHIsChildOrSelf: { args: [FFIType.u64, FFIType.u64], returns: FFIType.i32 },
    SHIsLowMemoryMachine: { args: [FFIType.u32], returns: FFIType.i32 },
    SHLoadIndirectString: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SHLockShared: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u64 },
    SHMessageBoxCheckA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    SHMessageBoxCheckW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    SHOpenRegStream2A: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    SHOpenRegStream2W: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    SHOpenRegStreamA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    SHOpenRegStreamW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    SHPackDispParamsV: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SHPinDllOfCLSID: { args: [FFIType.ptr], returns: FFIType.i32 },
    SHPropertyBag_ReadStrAlloc: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHPropertyBag_WriteBSTR: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHQueryInfoKeyA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHQueryInfoKeyW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHQueryValueExA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHQueryValueExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHRegCloseUSKey: { args: [FFIType.u64], returns: FFIType.i32 },
    SHRegCreateUSKeyA: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegCreateUSKeyW: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegDeleteEmptyUSKeyA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegDeleteEmptyUSKeyW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegDeleteUSValueA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegDeleteUSValueW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegDuplicateHKey: { args: [FFIType.u64], returns: FFIType.u64 },
    SHRegEnumUSKeyA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegEnumUSKeyW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegEnumUSValueA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegEnumUSValueW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegGetBoolUSValueA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    SHRegGetBoolUSValueW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
    SHRegGetBoolValueFromHKCUHKLM: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHRegGetIntW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHRegGetPathA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegGetPathW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegGetUSValueA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegGetUSValueW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegGetValueA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHRegGetValueFromHKCUHKLM: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHRegGetValueW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHRegisterValidateTemplate: { args: [FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHRegOpenUSKeyA: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHRegOpenUSKeyW: { args: [FFIType.ptr, FFIType.u32, FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHRegQueryInfoUSKeyA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegQueryInfoUSKeyW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegQueryUSValueA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegQueryUSValueW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegSetPathA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegSetPathW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHRegSetUSValueA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SHRegSetUSValueW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SHRegWriteUSValueA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SHRegWriteUSValueW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    SHReleaseThreadRef: { args: [], returns: FFIType.i32 },
    SHRunIndirectRegClientCommand: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SHSendMessageBroadcastA: { args: [FFIType.u32, FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    SHSendMessageBroadcastW: { args: [FFIType.u32, FFIType.u64, FFIType.u64], returns: FFIType.u64 },
    SHSetThreadRef: { args: [FFIType.u64], returns: FFIType.i32 },
    SHSetValueA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHSetValueW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SHSkipJunction: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    SHStrDupA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHStrDupW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SHStripMneumonicA: { args: [FFIType.ptr], returns: FFIType.u8 },
    SHStripMneumonicW: { args: [FFIType.ptr], returns: FFIType.u16 },
    SHUnicodeToAnsi: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHUnicodeToAnsiCP: { args: [FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHUnicodeToUnicode: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    SHUnlockShared: { args: [FFIType.u64], returns: FFIType.i32 },
    StrCatBuffA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    StrCatBuffW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    StrCatChainW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    StrCatW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    StrChrA: { args: [FFIType.ptr, FFIType.u16], returns: FFIType.u64 },
    StrChrIA: { args: [FFIType.ptr, FFIType.u16], returns: FFIType.u64 },
    StrChrIW: { args: [FFIType.ptr, FFIType.u16], returns: FFIType.u64 },
    StrChrNIW: { args: [FFIType.ptr, FFIType.u16, FFIType.u32], returns: FFIType.u64 },
    StrChrNW: { args: [FFIType.ptr, FFIType.u16, FFIType.u32], returns: FFIType.u64 },
    StrChrW: { args: [FFIType.ptr, FFIType.u16], returns: FFIType.u64 },
    StrCmpCA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StrCmpCW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StrCmpICA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StrCmpICW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StrCmpIW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StrCmpLogicalW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StrCmpNA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    StrCmpNCA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    StrCmpNCW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    StrCmpNIA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    StrCmpNICA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    StrCmpNICW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    StrCmpNIW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    StrCmpNW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    StrCmpW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StrCpyNW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    StrCpyW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    StrCSpnA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StrCSpnIA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StrCSpnIW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StrCSpnW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StrDupA: { args: [FFIType.ptr], returns: FFIType.u64 },
    StrDupW: { args: [FFIType.ptr], returns: FFIType.u64 },
    StrFormatByteSize64A: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    StrFormatByteSizeA: { args: [FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    StrFormatByteSizeEx: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    StrFormatByteSizeW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    StrFormatKBSizeA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    StrFormatKBSizeW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    StrFromTimeIntervalA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    StrFromTimeIntervalW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.i32], returns: FFIType.i32 },
    StrIsIntlEqualA: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    StrIsIntlEqualW: { args: [FFIType.i32, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    StrNCatA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    StrNCatW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u64 },
    StrPBrkA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    StrPBrkW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    StrRChrA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u16], returns: FFIType.u64 },
    StrRChrIA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u16], returns: FFIType.u64 },
    StrRChrIW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u16], returns: FFIType.u64 },
    StrRChrW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u16], returns: FFIType.u64 },
    StrRetToBSTR: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StrRetToBufA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    StrRetToBufW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    StrRetToStrA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StrRetToStrW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StrRStrIA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    StrRStrIW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    StrSpnA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StrSpnW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StrStrA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    StrStrIA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    StrStrIW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    StrStrNIW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    StrStrNW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    StrStrW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    StrToInt64ExA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    StrToInt64ExW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    StrToIntA: { args: [FFIType.ptr], returns: FFIType.i32 },
    StrToIntExA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    StrToIntExW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    StrToIntW: { args: [FFIType.ptr], returns: FFIType.i32 },
    StrTrimA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    StrTrimW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UrlApplySchemeA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UrlApplySchemeW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UrlCanonicalizeA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UrlCanonicalizeW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UrlCombineA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UrlCombineW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UrlCompareA: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    UrlCompareW: { args: [FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
    UrlCreateFromPathA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UrlCreateFromPathW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UrlEscapeA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UrlEscapeW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UrlFixupW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UrlGetLocationA: { args: [FFIType.ptr], returns: FFIType.u64 },
    UrlGetLocationW: { args: [FFIType.ptr], returns: FFIType.u64 },
    UrlGetPartA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    UrlGetPartW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    UrlHashA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UrlHashW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UrlIsA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UrlIsNoHistoryA: { args: [FFIType.ptr], returns: FFIType.i32 },
    UrlIsNoHistoryW: { args: [FFIType.ptr], returns: FFIType.i32 },
    UrlIsOpaqueA: { args: [FFIType.ptr], returns: FFIType.i32 },
    UrlIsOpaqueW: { args: [FFIType.ptr], returns: FFIType.i32 },
    UrlIsW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UrlUnescapeA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UrlUnescapeW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    WhichPlatform: { args: [], returns: FFIType.u32 },
    wnsprintfA: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    wnsprintfW: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
    wvnsprintfA: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    wvnsprintfW: { args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-assoccreate
  public static AssocCreate(clsid: LPVOID, riid: REFIID, ppv: LPVOID): HRESULT {
    return Shlwapi.Load('AssocCreate')(clsid, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-assocgetperceivedtype
  public static AssocGetPerceivedType(pszExt: LPCWSTR, ptype: LPVOID, pflag: LPVOID, ppszType: LPVOID | NULL): HRESULT {
    return Shlwapi.Load('AssocGetPerceivedType')(pszExt, ptype, pflag, ppszType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-associsdangerous
  public static AssocIsDangerous(pszAssoc: LPCWSTR): BOOL {
    return Shlwapi.Load('AssocIsDangerous')(pszAssoc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-assocquerykeya
  public static AssocQueryKeyA(flags: DWORD, key: DWORD, pszAssoc: LPCSTR, pszExtra: LPCSTR | NULL, phkeyOut: LPVOID): HRESULT {
    return Shlwapi.Load('AssocQueryKeyA')(flags, key, pszAssoc, pszExtra, phkeyOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-assocquerykeyw
  public static AssocQueryKeyW(flags: DWORD, key: DWORD, pszAssoc: LPCWSTR, pszExtra: LPCWSTR | NULL, phkeyOut: LPVOID): HRESULT {
    return Shlwapi.Load('AssocQueryKeyW')(flags, key, pszAssoc, pszExtra, phkeyOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-assocquerystringa
  public static AssocQueryStringA(flags: DWORD, str: DWORD, pszAssoc: LPCSTR, pszExtra: LPCSTR | NULL, pszOut: LPSTR | NULL, pcchOut: LPDWORD): HRESULT {
    return Shlwapi.Load('AssocQueryStringA')(flags, str, pszAssoc, pszExtra, pszOut, pcchOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-assocquerystringbykeya
  public static AssocQueryStringByKeyA(flags: DWORD, str: DWORD, hkAssoc: HKEY, pszExtra: LPCSTR | NULL, pszOut: LPSTR | NULL, pcchOut: LPDWORD): HRESULT {
    return Shlwapi.Load('AssocQueryStringByKeyA')(flags, str, hkAssoc, pszExtra, pszOut, pcchOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-assocquerystringbykeyw
  public static AssocQueryStringByKeyW(flags: DWORD, str: DWORD, hkAssoc: HKEY, pszExtra: LPCWSTR | NULL, pszOut: LPWSTR | NULL, pcchOut: LPDWORD): HRESULT {
    return Shlwapi.Load('AssocQueryStringByKeyW')(flags, str, hkAssoc, pszExtra, pszOut, pcchOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-assocquerystringw
  public static AssocQueryStringW(flags: DWORD, str: DWORD, pszAssoc: LPCWSTR, pszExtra: LPCWSTR | NULL, pszOut: LPWSTR | NULL, pcchOut: LPDWORD): HRESULT {
    return Shlwapi.Load('AssocQueryStringW')(flags, str, pszAssoc, pszExtra, pszOut, pcchOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-chrcmpia
  public static ChrCmpIA(w1: WORD, w2: WORD): BOOL {
    return Shlwapi.Load('ChrCmpIA')(w1, w2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-chrcmpiw
  public static ChrCmpIW(w1: WCHAR, w2: WCHAR): BOOL {
    return Shlwapi.Load('ChrCmpIW')(w1, w2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-coloradjustluma
  public static ColorAdjustLuma(clrRGB: COLORREF, n: INT, fScale: BOOL): COLORREF {
    return Shlwapi.Load('ColorAdjustLuma')(clrRGB, n, fScale);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-colorhlstorgb
  public static ColorHLSToRGB(wHue: WORD, wLuminance: WORD, wSaturation: WORD): COLORREF {
    return Shlwapi.Load('ColorHLSToRGB')(wHue, wLuminance, wSaturation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-colorrgbtohls
  public static ColorRGBToHLS(clrRGB: COLORREF, pwHue: LPVOID, pwLuminance: LPVOID, pwSaturation: LPVOID): VOID {
    return Shlwapi.Load('ColorRGBToHLS')(clrRGB, pwHue, pwLuminance, pwSaturation);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-connecttoconnectionpoint
  public static ConnectToConnectionPoint(punk: HANDLE | 0n, riidEvent: REFIID, fConnect: BOOL, punkTarget: HANDLE, pdwCookie: LPDWORD, ppcpOut: LPVOID | NULL): HRESULT {
    return Shlwapi.Load('ConnectToConnectionPoint')(punk, riidEvent, fConnect, punkTarget, pdwCookie, ppcpOut);
  }

  public static DelayLoadFailureHook(pszDllName: LPCSTR, pszProcName: LPCSTR): LONG_PTR {
    return Shlwapi.Load('DelayLoadFailureHook')(pszDllName, pszProcName);
  }

  public static DllGetClassObject(rclsid: REFIID, riid: REFIID, ppv: LPVOID): HRESULT {
    return Shlwapi.Load('DllGetClassObject')(rclsid, riid, ppv);
  }

  public static DllGetVersion(pdvi: LPVOID): HRESULT {
    return Shlwapi.Load('DllGetVersion')(pdvi);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-getacceptlanguagesa
  public static GetAcceptLanguagesA(pszLanguages: LPSTR, pcchLanguages: LPDWORD): HRESULT {
    return Shlwapi.Load('GetAcceptLanguagesA')(pszLanguages, pcchLanguages);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-getacceptlanguagesw
  public static GetAcceptLanguagesW(pszLanguages: LPWSTR, pcchLanguages: LPDWORD): HRESULT {
    return Shlwapi.Load('GetAcceptLanguagesW')(pszLanguages, pcchLanguages);
  }

  public static GetMenuPosFromID(hMenu: HMENU, wID: UINT): INT {
    return Shlwapi.Load('GetMenuPosFromID')(hMenu, wID);
  }

  public static GUIDFromStringW(psz: LPCWSTR, pguid: LPVOID): BOOL {
    return Shlwapi.Load('GUIDFromStringW')(psz, pguid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-hashdata
  public static HashData(pbData: LPBYTE, cbData: DWORD, pbHash: LPBYTE, cbHash: DWORD): HRESULT {
    return Shlwapi.Load('HashData')(pbData, cbData, pbHash, cbHash);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-intlstreqworkera
  public static IntlStrEqWorkerA(fCaseSens: BOOL, lpString1: LPCSTR, lpString2: LPCSTR, nChar: INT): BOOL {
    return Shlwapi.Load('IntlStrEqWorkerA')(fCaseSens, lpString1, lpString2, nChar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-intlstreqworkerw
  public static IntlStrEqWorkerW(fCaseSens: BOOL, lpString1: LPCWSTR, lpString2: LPCWSTR, nChar: INT): BOOL {
    return Shlwapi.Load('IntlStrEqWorkerW')(fCaseSens, lpString1, lpString2, nChar);
  }

  public static IsCharSpaceA(wch: BYTE): BOOL {
    return Shlwapi.Load('IsCharSpaceA')(wch);
  }

  public static IsCharSpaceW(wch: WCHAR): BOOL {
    return Shlwapi.Load('IsCharSpaceW')(wch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-isinternetescenabled
  public static IsInternetESCEnabled(): BOOL {
    return Shlwapi.Load('IsInternetESCEnabled')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-isos
  public static IsOS(dwOS: DWORD): BOOL {
    return Shlwapi.Load('IsOS')(dwOS);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-istream_copy
  public static IStream_Copy(pstmFrom: HANDLE, pstmTo: HANDLE, cb: DWORD): HRESULT {
    return Shlwapi.Load('IStream_Copy')(pstmFrom, pstmTo, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-istream_read
  public static IStream_Read(pstm: HANDLE, pv: LPVOID, cb: ULONG): HRESULT {
    return Shlwapi.Load('IStream_Read')(pstm, pv, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-istream_readpidl
  public static IStream_ReadPidl(pstm: HANDLE, ppidlOut: LPVOID): HRESULT {
    return Shlwapi.Load('IStream_ReadPidl')(pstm, ppidlOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-istream_readstr
  public static IStream_ReadStr(pstm: HANDLE, ppsz: LPVOID): HRESULT {
    return Shlwapi.Load('IStream_ReadStr')(pstm, ppsz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-istream_reset
  public static IStream_Reset(pstm: HANDLE): HRESULT {
    return Shlwapi.Load('IStream_Reset')(pstm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-istream_size
  public static IStream_Size(pstm: HANDLE, pui: LPVOID): HRESULT {
    return Shlwapi.Load('IStream_Size')(pstm, pui);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-istream_write
  public static IStream_Write(pstm: HANDLE, pv: LPVOID, cb: ULONG): HRESULT {
    return Shlwapi.Load('IStream_Write')(pstm, pv, cb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-istream_writepidl
  public static IStream_WritePidl(pstm: HANDLE, pidlWrite: PCUIDLIST_RELATIVE): HRESULT {
    return Shlwapi.Load('IStream_WritePidl')(pstm, pidlWrite);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-istream_writestr
  public static IStream_WriteStr(pstm: HANDLE, psz: PCWSTR): HRESULT {
    return Shlwapi.Load('IStream_WriteStr')(pstm, psz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-iunknown_atomicrelease
  public static IUnknown_AtomicRelease(ppunk: LPVOID): VOID {
    return Shlwapi.Load('IUnknown_AtomicRelease')(ppunk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-iunknown_exec
  public static IUnknown_Exec(punk: HANDLE, pguidCmdGroup: LPVOID | NULL, nCmdID: DWORD, nCmdexecopt: DWORD, pvarargIn: LPVOID | NULL, pvarargOut: LPVOID | NULL): HRESULT {
    return Shlwapi.Load('IUnknown_Exec')(punk, pguidCmdGroup, nCmdID, nCmdexecopt, pvarargIn, pvarargOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-iunknown_getsite
  public static IUnknown_GetSite(punk: HANDLE, riid: REFIID, ppv: LPVOID): HRESULT {
    return Shlwapi.Load('IUnknown_GetSite')(punk, riid, ppv);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-iunknown_getwindow
  public static IUnknown_GetWindow(punk: HANDLE, phwnd: LPVOID): HRESULT {
    return Shlwapi.Load('IUnknown_GetWindow')(punk, phwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-iunknown_queryservice
  public static IUnknown_QueryService(punk: HANDLE, guidService: REFIID, riid: REFIID, ppvOut: LPVOID): HRESULT {
    return Shlwapi.Load('IUnknown_QueryService')(punk, guidService, riid, ppvOut);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-iunknown_querystatus
  public static IUnknown_QueryStatus(punk: HANDLE, pguidCmdGroup: LPVOID | NULL, cCmds: ULONG, prgCmds: LPVOID, pCmdText: LPVOID | NULL): HRESULT {
    return Shlwapi.Load('IUnknown_QueryStatus')(punk, pguidCmdGroup, cCmds, prgCmds, pCmdText);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-iunknown_set
  public static IUnknown_Set(ppunk: LPVOID, punk: HANDLE): VOID {
    return Shlwapi.Load('IUnknown_Set')(ppunk, punk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-iunknown_setsite
  public static IUnknown_SetSite(punk: HANDLE, punkSite: HANDLE): HRESULT {
    return Shlwapi.Load('IUnknown_SetSite')(punk, punkSite);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-mlloadlibrarya
  public static MLLoadLibraryA(lpszLibFileName: LPCSTR, hModule: HMODULE, dwCrossCodePage: DWORD): HINSTANCE {
    return Shlwapi.Load('MLLoadLibraryA')(lpszLibFileName, hModule, dwCrossCodePage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-mlloadlibraryw
  public static MLLoadLibraryW(lpszLibFileName: LPCWSTR, hModule: HMODULE, dwCrossCodePage: DWORD): HINSTANCE {
    return Shlwapi.Load('MLLoadLibraryW')(lpszLibFileName, hModule, dwCrossCodePage);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-parseurla
  public static ParseURLA(pcszURL: LPCSTR, ppu: LPVOID): HRESULT {
    return Shlwapi.Load('ParseURLA')(pcszURL, ppu);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-parseurlw
  public static ParseURLW(pcszURL: LPCWSTR, ppu: LPVOID): HRESULT {
    return Shlwapi.Load('ParseURLW')(pcszURL, ppu);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathaddbackslasha
  public static PathAddBackslashA(pszPath: LPSTR): LONG_PTR {
    return Shlwapi.Load('PathAddBackslashA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathaddbackslashw
  public static PathAddBackslashW(pszPath: LPWSTR): LONG_PTR {
    return Shlwapi.Load('PathAddBackslashW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathaddextensiona
  public static PathAddExtensionA(pszPath: LPSTR, pszExt: LPCSTR | NULL): BOOL {
    return Shlwapi.Load('PathAddExtensionA')(pszPath, pszExt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathaddextensionw
  public static PathAddExtensionW(pszPath: LPWSTR, pszExt: LPCWSTR | NULL): BOOL {
    return Shlwapi.Load('PathAddExtensionW')(pszPath, pszExt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathappenda
  public static PathAppendA(pszPath: LPSTR, pszMore: LPCSTR): BOOL {
    return Shlwapi.Load('PathAppendA')(pszPath, pszMore);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathappendw
  public static PathAppendW(pszPath: LPWSTR, pszMore: LPCWSTR): BOOL {
    return Shlwapi.Load('PathAppendW')(pszPath, pszMore);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathbuildroota
  public static PathBuildRootA(pszRoot: LPSTR, iDrive: INT): LONG_PTR {
    return Shlwapi.Load('PathBuildRootA')(pszRoot, iDrive);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathbuildrootw
  public static PathBuildRootW(pszRoot: LPWSTR, iDrive: INT): LONG_PTR {
    return Shlwapi.Load('PathBuildRootW')(pszRoot, iDrive);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathcanonicalizea
  public static PathCanonicalizeA(pszBuf: LPSTR, pszPath: LPCSTR): BOOL {
    return Shlwapi.Load('PathCanonicalizeA')(pszBuf, pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathcanonicalizew
  public static PathCanonicalizeW(pszBuf: LPWSTR, pszPath: LPCWSTR): BOOL {
    return Shlwapi.Load('PathCanonicalizeW')(pszBuf, pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathcombinea
  public static PathCombineA(pszDest: LPSTR, pszDir: LPCSTR | NULL, pszFile: LPCSTR | NULL): LONG_PTR {
    return Shlwapi.Load('PathCombineA')(pszDest, pszDir, pszFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathcombinew
  public static PathCombineW(pszDest: LPWSTR, pszDir: LPCWSTR | NULL, pszFile: LPCWSTR | NULL): LONG_PTR {
    return Shlwapi.Load('PathCombineW')(pszDest, pszDir, pszFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathcommonprefixa
  public static PathCommonPrefixA(pszFile1: LPCSTR, pszFile2: LPCSTR, achPath: LPSTR | NULL): INT {
    return Shlwapi.Load('PathCommonPrefixA')(pszFile1, pszFile2, achPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathcommonprefixw
  public static PathCommonPrefixW(pszFile1: LPCWSTR, pszFile2: LPCWSTR, achPath: LPWSTR | NULL): INT {
    return Shlwapi.Load('PathCommonPrefixW')(pszFile1, pszFile2, achPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathcompactpatha
  public static PathCompactPathA(hDC: HDC | 0n, pszPath: LPSTR, dx: UINT): BOOL {
    return Shlwapi.Load('PathCompactPathA')(hDC, pszPath, dx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathcompactpathexa
  public static PathCompactPathExA(pszOut: LPSTR, pszSrc: LPCSTR, cchMax: UINT, dwFlags: DWORD): BOOL {
    return Shlwapi.Load('PathCompactPathExA')(pszOut, pszSrc, cchMax, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathcompactpathexw
  public static PathCompactPathExW(pszOut: LPWSTR, pszSrc: LPCWSTR, cchMax: UINT, dwFlags: DWORD): BOOL {
    return Shlwapi.Load('PathCompactPathExW')(pszOut, pszSrc, cchMax, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathcompactpathw
  public static PathCompactPathW(hDC: HDC | 0n, pszPath: LPWSTR, dx: UINT): BOOL {
    return Shlwapi.Load('PathCompactPathW')(hDC, pszPath, dx);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathcreatefromurla
  public static PathCreateFromUrlA(pszUrl: LPCSTR, pszPath: LPSTR, pcchPath: LPDWORD, dwFlags: DWORD): HRESULT {
    return Shlwapi.Load('PathCreateFromUrlA')(pszUrl, pszPath, pcchPath, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathcreatefromurlalloc
  public static PathCreateFromUrlAlloc(pszIn: LPCWSTR, ppszOut: LPVOID, dwFlags: DWORD): HRESULT {
    return Shlwapi.Load('PathCreateFromUrlAlloc')(pszIn, ppszOut, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathcreatefromurlw
  public static PathCreateFromUrlW(pszUrl: LPCWSTR, pszPath: LPWSTR, pcchPath: LPDWORD, dwFlags: DWORD): HRESULT {
    return Shlwapi.Load('PathCreateFromUrlW')(pszUrl, pszPath, pcchPath, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathfileexistsa
  public static PathFileExistsA(pszPath: LPCSTR): BOOL {
    return Shlwapi.Load('PathFileExistsA')(pszPath);
  }

  public static PathFileExistsAndAttributesW(pszPath: LPCWSTR, pdwAttributes: LPDWORD): BOOL {
    return Shlwapi.Load('PathFileExistsAndAttributesW')(pszPath, pdwAttributes);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathfileexistsw
  public static PathFileExistsW(pszPath: LPCWSTR): BOOL {
    return Shlwapi.Load('PathFileExistsW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathfindextensiona
  public static PathFindExtensionA(pszPath: LPCSTR): LONG_PTR {
    return Shlwapi.Load('PathFindExtensionA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathfindextensionw
  public static PathFindExtensionW(pszPath: LPCWSTR): LONG_PTR {
    return Shlwapi.Load('PathFindExtensionW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathfindfilenamea
  public static PathFindFileNameA(pszPath: LPCSTR): LONG_PTR {
    return Shlwapi.Load('PathFindFileNameA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathfindfilenamew
  public static PathFindFileNameW(pszPath: LPCWSTR): LONG_PTR {
    return Shlwapi.Load('PathFindFileNameW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathfindnextcomponenta
  public static PathFindNextComponentA(pszPath: LPCSTR): LONG_PTR {
    return Shlwapi.Load('PathFindNextComponentA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathfindnextcomponentw
  public static PathFindNextComponentW(pszPath: LPCWSTR): LONG_PTR {
    return Shlwapi.Load('PathFindNextComponentW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathfindonpatha
  public static PathFindOnPathA(pszPath: LPSTR, ppszOtherDirs: LPVOID | NULL): BOOL {
    return Shlwapi.Load('PathFindOnPathA')(pszPath, ppszOtherDirs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathfindonpathw
  public static PathFindOnPathW(pszPath: LPWSTR, ppszOtherDirs: LPVOID | NULL): BOOL {
    return Shlwapi.Load('PathFindOnPathW')(pszPath, ppszOtherDirs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathfindsuffixarraya
  public static PathFindSuffixArrayA(pszPath: LPCSTR, apszSuffix: LPVOID, iArraySize: INT): LONG_PTR {
    return Shlwapi.Load('PathFindSuffixArrayA')(pszPath, apszSuffix, iArraySize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathfindsuffixarrayw
  public static PathFindSuffixArrayW(pszPath: LPCWSTR, apszSuffix: LPVOID, iArraySize: INT): LONG_PTR {
    return Shlwapi.Load('PathFindSuffixArrayW')(pszPath, apszSuffix, iArraySize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathgetargsa
  public static PathGetArgsA(pszPath: LPCSTR): LONG_PTR {
    return Shlwapi.Load('PathGetArgsA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathgetargsw
  public static PathGetArgsW(pszPath: LPCWSTR): LONG_PTR {
    return Shlwapi.Load('PathGetArgsW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathgetchartypea
  public static PathGetCharTypeA(ch: BYTE): UINT {
    return Shlwapi.Load('PathGetCharTypeA')(ch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathgetchartypew
  public static PathGetCharTypeW(ch: WCHAR): UINT {
    return Shlwapi.Load('PathGetCharTypeW')(ch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathgetdrivenumbera
  public static PathGetDriveNumberA(pszPath: LPCSTR): INT {
    return Shlwapi.Load('PathGetDriveNumberA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathgetdrivenumberw
  public static PathGetDriveNumberW(pszPath: LPCWSTR): INT {
    return Shlwapi.Load('PathGetDriveNumberW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathiscontenttypea
  public static PathIsContentTypeA(pszPath: LPCSTR, pszContentType: LPCSTR): BOOL {
    return Shlwapi.Load('PathIsContentTypeA')(pszPath, pszContentType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathiscontenttypew
  public static PathIsContentTypeW(pszPath: LPCWSTR, pszContentType: LPCWSTR): BOOL {
    return Shlwapi.Load('PathIsContentTypeW')(pszPath, pszContentType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisdirectorya
  public static PathIsDirectoryA(pszPath: LPCSTR): BOOL {
    return Shlwapi.Load('PathIsDirectoryA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisdirectoryemptya
  public static PathIsDirectoryEmptyA(pszPath: LPCSTR): BOOL {
    return Shlwapi.Load('PathIsDirectoryEmptyA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisdirectoryemptyw
  public static PathIsDirectoryEmptyW(pszPath: LPCWSTR): BOOL {
    return Shlwapi.Load('PathIsDirectoryEmptyW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisdirectoryw
  public static PathIsDirectoryW(pszPath: LPCWSTR): BOOL {
    return Shlwapi.Load('PathIsDirectoryW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisfilespeca
  public static PathIsFileSpecA(pszPath: LPCSTR): BOOL {
    return Shlwapi.Load('PathIsFileSpecA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisfilespecw
  public static PathIsFileSpecW(pszPath: LPCWSTR): BOOL {
    return Shlwapi.Load('PathIsFileSpecW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathislfnfilespeca
  public static PathIsLFNFileSpecA(pszName: LPCSTR): BOOL {
    return Shlwapi.Load('PathIsLFNFileSpecA')(pszName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathislfnfilespecw
  public static PathIsLFNFileSpecW(pszName: LPCWSTR): BOOL {
    return Shlwapi.Load('PathIsLFNFileSpecW')(pszName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisnetworkpatha
  public static PathIsNetworkPathA(pszPath: LPCSTR): BOOL {
    return Shlwapi.Load('PathIsNetworkPathA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisnetworkpathw
  public static PathIsNetworkPathW(pszPath: LPCWSTR): BOOL {
    return Shlwapi.Load('PathIsNetworkPathW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisprefixa
  public static PathIsPrefixA(pszPrefix: LPCSTR, pszPath: LPCSTR): BOOL {
    return Shlwapi.Load('PathIsPrefixA')(pszPrefix, pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisprefixw
  public static PathIsPrefixW(pszPrefix: LPCWSTR, pszPath: LPCWSTR): BOOL {
    return Shlwapi.Load('PathIsPrefixW')(pszPrefix, pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisrelativea
  public static PathIsRelativeA(pszPath: LPCSTR): BOOL {
    return Shlwapi.Load('PathIsRelativeA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisrelativew
  public static PathIsRelativeW(pszPath: LPCWSTR): BOOL {
    return Shlwapi.Load('PathIsRelativeW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisroota
  public static PathIsRootA(pszPath: LPCSTR): BOOL {
    return Shlwapi.Load('PathIsRootA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisrootw
  public static PathIsRootW(pszPath: LPCWSTR): BOOL {
    return Shlwapi.Load('PathIsRootW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathissameroota
  public static PathIsSameRootA(pszPath1: LPCSTR, pszPath2: LPCSTR): BOOL {
    return Shlwapi.Load('PathIsSameRootA')(pszPath1, pszPath2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathissamerootw
  public static PathIsSameRootW(pszPath1: LPCWSTR, pszPath2: LPCWSTR): BOOL {
    return Shlwapi.Load('PathIsSameRootW')(pszPath1, pszPath2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathissystemfoldera
  public static PathIsSystemFolderA(pszPath: LPCSTR, dwAttrb: DWORD): BOOL {
    return Shlwapi.Load('PathIsSystemFolderA')(pszPath, dwAttrb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathissystemfolderw
  public static PathIsSystemFolderW(pszPath: LPCWSTR, dwAttrb: DWORD): BOOL {
    return Shlwapi.Load('PathIsSystemFolderW')(pszPath, dwAttrb);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisunca
  public static PathIsUNCA(pszPath: LPCSTR): BOOL {
    return Shlwapi.Load('PathIsUNCA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisuncservera
  public static PathIsUNCServerA(pszPath: LPCSTR): BOOL {
    return Shlwapi.Load('PathIsUNCServerA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisuncserversharea
  public static PathIsUNCServerShareA(pszPath: LPCSTR): BOOL {
    return Shlwapi.Load('PathIsUNCServerShareA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisuncserversharew
  public static PathIsUNCServerShareW(pszPath: LPCWSTR): BOOL {
    return Shlwapi.Load('PathIsUNCServerShareW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisuncserverw
  public static PathIsUNCServerW(pszPath: LPCWSTR): BOOL {
    return Shlwapi.Load('PathIsUNCServerW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisuncw
  public static PathIsUNCW(pszPath: LPCWSTR): BOOL {
    return Shlwapi.Load('PathIsUNCW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisurla
  public static PathIsURLA(pszPath: LPCSTR): BOOL {
    return Shlwapi.Load('PathIsURLA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathisurlw
  public static PathIsURLW(pszPath: LPCWSTR): BOOL {
    return Shlwapi.Load('PathIsURLW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathmakeprettya
  public static PathMakePrettyA(pszPath: LPSTR): BOOL {
    return Shlwapi.Load('PathMakePrettyA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathmakeprettyw
  public static PathMakePrettyW(pszPath: LPWSTR): BOOL {
    return Shlwapi.Load('PathMakePrettyW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathmakesystemfoldera
  public static PathMakeSystemFolderA(pszPath: LPCSTR): BOOL {
    return Shlwapi.Load('PathMakeSystemFolderA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathmakesystemfolderw
  public static PathMakeSystemFolderW(pszPath: LPCWSTR): BOOL {
    return Shlwapi.Load('PathMakeSystemFolderW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathmatchspeca
  public static PathMatchSpecA(pszFile: LPCSTR, pszSpec: LPCSTR): BOOL {
    return Shlwapi.Load('PathMatchSpecA')(pszFile, pszSpec);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathmatchspecexa
  public static PathMatchSpecExA(pszFile: LPCSTR, pszSpec: LPCSTR, dwFlags: DWORD): HRESULT {
    return Shlwapi.Load('PathMatchSpecExA')(pszFile, pszSpec, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathmatchspecexw
  public static PathMatchSpecExW(pszFile: LPCWSTR, pszSpec: LPCWSTR, dwFlags: DWORD): HRESULT {
    return Shlwapi.Load('PathMatchSpecExW')(pszFile, pszSpec, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathmatchspecw
  public static PathMatchSpecW(pszFile: LPCWSTR, pszSpec: LPCWSTR): BOOL {
    return Shlwapi.Load('PathMatchSpecW')(pszFile, pszSpec);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathparseiconlocationa
  public static PathParseIconLocationA(pszIconFile: LPSTR): INT {
    return Shlwapi.Load('PathParseIconLocationA')(pszIconFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathparseiconlocationw
  public static PathParseIconLocationW(pszIconFile: LPWSTR): INT {
    return Shlwapi.Load('PathParseIconLocationW')(pszIconFile);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathquotespacesa
  public static PathQuoteSpacesA(lpsz: LPSTR): BOOL {
    return Shlwapi.Load('PathQuoteSpacesA')(lpsz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathquotespacesw
  public static PathQuoteSpacesW(lpsz: LPWSTR): BOOL {
    return Shlwapi.Load('PathQuoteSpacesW')(lpsz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathrelativepathtoa
  public static PathRelativePathToA(pszPath: LPSTR, pszFrom: LPCSTR, dwAttrFrom: DWORD, pszTo: LPCSTR, dwAttrTo: DWORD): BOOL {
    return Shlwapi.Load('PathRelativePathToA')(pszPath, pszFrom, dwAttrFrom, pszTo, dwAttrTo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathrelativepathtow
  public static PathRelativePathToW(pszPath: LPWSTR, pszFrom: LPCWSTR, dwAttrFrom: DWORD, pszTo: LPCWSTR, dwAttrTo: DWORD): BOOL {
    return Shlwapi.Load('PathRelativePathToW')(pszPath, pszFrom, dwAttrFrom, pszTo, dwAttrTo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathremoveargsa
  public static PathRemoveArgsA(pszPath: LPSTR): VOID {
    return Shlwapi.Load('PathRemoveArgsA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathremoveargsw
  public static PathRemoveArgsW(pszPath: LPWSTR): VOID {
    return Shlwapi.Load('PathRemoveArgsW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathremovebackslasha
  public static PathRemoveBackslashA(pszPath: LPSTR): LONG_PTR {
    return Shlwapi.Load('PathRemoveBackslashA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathremovebackslashw
  public static PathRemoveBackslashW(pszPath: LPWSTR): LONG_PTR {
    return Shlwapi.Load('PathRemoveBackslashW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathremoveblanksa
  public static PathRemoveBlanksA(pszPath: LPSTR): VOID {
    return Shlwapi.Load('PathRemoveBlanksA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathremoveblanksw
  public static PathRemoveBlanksW(pszPath: LPWSTR): VOID {
    return Shlwapi.Load('PathRemoveBlanksW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathremoveextensiona
  public static PathRemoveExtensionA(pszPath: LPSTR): VOID {
    return Shlwapi.Load('PathRemoveExtensionA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathremoveextensionw
  public static PathRemoveExtensionW(pszPath: LPWSTR): VOID {
    return Shlwapi.Load('PathRemoveExtensionW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathremovefilespeca
  public static PathRemoveFileSpecA(pszPath: LPSTR): BOOL {
    return Shlwapi.Load('PathRemoveFileSpecA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathremovefilespecw
  public static PathRemoveFileSpecW(pszPath: LPWSTR): BOOL {
    return Shlwapi.Load('PathRemoveFileSpecW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathrenameextensiona
  public static PathRenameExtensionA(pszPath: LPSTR, pszExt: LPCSTR): BOOL {
    return Shlwapi.Load('PathRenameExtensionA')(pszPath, pszExt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathrenameextensionw
  public static PathRenameExtensionW(pszPath: LPWSTR, pszExt: LPCWSTR): BOOL {
    return Shlwapi.Load('PathRenameExtensionW')(pszPath, pszExt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathsearchandqualifya
  public static PathSearchAndQualifyA(pszPath: LPCSTR, pszBuf: LPSTR, cchBuf: UINT): BOOL {
    return Shlwapi.Load('PathSearchAndQualifyA')(pszPath, pszBuf, cchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathsearchandqualifyw
  public static PathSearchAndQualifyW(pszPath: LPCWSTR, pszBuf: LPWSTR, cchBuf: UINT): BOOL {
    return Shlwapi.Load('PathSearchAndQualifyW')(pszPath, pszBuf, cchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathsetdlgitempatha
  public static PathSetDlgItemPathA(hDlg: HWND, id: INT, pszPath: LPCSTR): VOID {
    return Shlwapi.Load('PathSetDlgItemPathA')(hDlg, id, pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathsetdlgitempathw
  public static PathSetDlgItemPathW(hDlg: HWND, id: INT, pszPath: LPCWSTR): VOID {
    return Shlwapi.Load('PathSetDlgItemPathW')(hDlg, id, pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathskiproota
  public static PathSkipRootA(pszPath: LPCSTR): LONG_PTR {
    return Shlwapi.Load('PathSkipRootA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathskiprootw
  public static PathSkipRootW(pszPath: LPCWSTR): LONG_PTR {
    return Shlwapi.Load('PathSkipRootW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathstrippatha
  public static PathStripPathA(pszPath: LPSTR): VOID {
    return Shlwapi.Load('PathStripPathA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathstrippathw
  public static PathStripPathW(pszPath: LPWSTR): VOID {
    return Shlwapi.Load('PathStripPathW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathstriptoroota
  public static PathStripToRootA(pszPath: LPSTR): BOOL {
    return Shlwapi.Load('PathStripToRootA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathstriptorootw
  public static PathStripToRootW(pszPath: LPWSTR): BOOL {
    return Shlwapi.Load('PathStripToRootW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathunexpandenvstringsa
  public static PathUnExpandEnvStringsA(pszPath: LPCSTR, pszBuf: LPSTR, cchBuf: UINT): BOOL {
    return Shlwapi.Load('PathUnExpandEnvStringsA')(pszPath, pszBuf, cchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathunexpandenvstringsw
  public static PathUnExpandEnvStringsW(pszPath: LPCWSTR, pszBuf: LPWSTR, cchBuf: UINT): BOOL {
    return Shlwapi.Load('PathUnExpandEnvStringsW')(pszPath, pszBuf, cchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathundecoratea
  public static PathUndecorateA(pszPath: LPSTR): VOID {
    return Shlwapi.Load('PathUndecorateA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathundecoratew
  public static PathUndecorateW(pszPath: LPWSTR): VOID {
    return Shlwapi.Load('PathUndecorateW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathunmakesystemfoldera
  public static PathUnmakeSystemFolderA(pszPath: LPCSTR): BOOL {
    return Shlwapi.Load('PathUnmakeSystemFolderA')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathunmakesystemfolderw
  public static PathUnmakeSystemFolderW(pszPath: LPCWSTR): BOOL {
    return Shlwapi.Load('PathUnmakeSystemFolderW')(pszPath);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathunquotespacesa
  public static PathUnquoteSpacesA(lpsz: LPSTR): BOOL {
    return Shlwapi.Load('PathUnquoteSpacesA')(lpsz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-pathunquotespacesw
  public static PathUnquoteSpacesW(lpsz: LPWSTR): BOOL {
    return Shlwapi.Load('PathUnquoteSpacesW')(lpsz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-qisearch
  public static QISearch(that: HANDLE, pqit: LPVOID, riid: REFIID, ppv: LPVOID): HRESULT {
    return Shlwapi.Load('QISearch')(that, pqit, riid, ppv);
  }

  public static SHAllocShared(pvData: LPVOID | NULL, dwSize: DWORD, dwProcessId: DWORD): HANDLE {
    return Shlwapi.Load('SHAllocShared')(pvData, dwSize, dwProcessId);
  }

  public static SHAnsiToAnsi(pszSrc: LPCSTR, pszDst: LPSTR, cchBuf: INT): INT {
    return Shlwapi.Load('SHAnsiToAnsi')(pszSrc, pszDst, cchBuf);
  }

  public static SHAnsiToUnicode(pszSrc: LPCSTR, pwszDst: LPWSTR, cwchBuf: INT): INT {
    return Shlwapi.Load('SHAnsiToUnicode')(pszSrc, pwszDst, cwchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shautocomplete
  public static SHAutoComplete(hwndEdit: HWND, dwFlags: DWORD): HRESULT {
    return Shlwapi.Load('SHAutoComplete')(hwndEdit, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcopykeya
  public static SHCopyKeyA(hkeySrc: HKEY, pszSrcSubKey: LPCSTR | NULL, hkeyDest: HKEY, fReserved: DWORD): LONG {
    return Shlwapi.Load('SHCopyKeyA')(hkeySrc, pszSrcSubKey, hkeyDest, fReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcopykeyw
  public static SHCopyKeyW(hkeySrc: HKEY, pszSrcSubKey: LPCWSTR | NULL, hkeyDest: HKEY, fReserved: DWORD): LONG {
    return Shlwapi.Load('SHCopyKeyW')(hkeySrc, pszSrcSubKey, hkeyDest, fReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreatememstream
  public static SHCreateMemStream(pInit: LPBYTE | NULL, cbInit: UINT): LONG_PTR {
    return Shlwapi.Load('SHCreateMemStream')(pInit, cbInit);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreateshellpalette
  public static SHCreateShellPalette(hdc: HDC | 0n): HPALETTE {
    return Shlwapi.Load('SHCreateShellPalette')(hdc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreatestreamonfilea
  public static SHCreateStreamOnFileA(pszFile: LPCSTR, grfMode: DWORD, ppstm: LPVOID): HRESULT {
    return Shlwapi.Load('SHCreateStreamOnFileA')(pszFile, grfMode, ppstm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreatestreamonfileex
  public static SHCreateStreamOnFileEx(pszFile: LPCWSTR, grfMode: DWORD, dwAttributes: DWORD, fCreate: BOOL, pstmTemplate: HANDLE | 0n, ppstm: LPVOID): HRESULT {
    return Shlwapi.Load('SHCreateStreamOnFileEx')(pszFile, grfMode, dwAttributes, fCreate, pstmTemplate, ppstm);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreatestreamonfilew
  public static SHCreateStreamOnFileW(pszFile: LPCWSTR, grfMode: DWORD, ppstm: LPVOID): HRESULT {
    return Shlwapi.Load('SHCreateStreamOnFileW')(pszFile, grfMode, ppstm);
  }

  public static SHCreateStreamWrapper(pStream: HANDLE, pStreamWrapper: LPVOID, ppStreamResult: LPVOID): HRESULT {
    return Shlwapi.Load('SHCreateStreamWrapper')(pStream, pStreamWrapper, ppStreamResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreatethread
  public static SHCreateThread(pfnThreadProc: LPTHREAD_START_ROUTINE, pData: LPVOID | NULL, dwFlags: DWORD, pfnCallback: LPTHREAD_START_ROUTINE | NULL): BOOL {
    return Shlwapi.Load('SHCreateThread')(pfnThreadProc, pData, dwFlags, pfnCallback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreatethreadref
  public static SHCreateThreadRef(pcRef: LPVOID, ppunk: LPVOID): HRESULT {
    return Shlwapi.Load('SHCreateThreadRef')(pcRef, ppunk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shcreatethreadwithhandle
  public static SHCreateThreadWithHandle(pfnThreadProc: LPTHREAD_START_ROUTINE, pData: LPVOID | NULL, dwFlags: DWORD, pfnCallback: LPTHREAD_START_ROUTINE | NULL, pHandle: LPVOID | NULL): BOOL {
    return Shlwapi.Load('SHCreateThreadWithHandle')(pfnThreadProc, pData, dwFlags, pfnCallback, pHandle);
  }

  public static SHCreateWorkerWindowW(pfnWndProc: WNDPROC | NULL, hwndParent: HWND, dwExStyle: DWORD, dwFlags: DWORD, hMenu: HMENU | 0n, lParam: LONG_PTR): HWND {
    return Shlwapi.Load('SHCreateWorkerWindowW')(pfnWndProc, hwndParent, dwExStyle, dwFlags, hMenu, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shdeleteemptykeya
  public static SHDeleteEmptyKeyA(hkey: HKEY, pszSubKey: LPCSTR): LONG {
    return Shlwapi.Load('SHDeleteEmptyKeyA')(hkey, pszSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shdeleteemptykeyw
  public static SHDeleteEmptyKeyW(hkey: HKEY, pszSubKey: LPCWSTR): LONG {
    return Shlwapi.Load('SHDeleteEmptyKeyW')(hkey, pszSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shdeletekeya
  public static SHDeleteKeyA(hkey: HKEY, pszSubKey: LPCSTR): LONG {
    return Shlwapi.Load('SHDeleteKeyA')(hkey, pszSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shdeletekeyw
  public static SHDeleteKeyW(hkey: HKEY, pszSubKey: LPCWSTR): LONG {
    return Shlwapi.Load('SHDeleteKeyW')(hkey, pszSubKey);
  }

  public static SHDeleteOrphanKeyA(hkey: HKEY, pszSubKey: LPCSTR): LONG {
    return Shlwapi.Load('SHDeleteOrphanKeyA')(hkey, pszSubKey);
  }

  public static SHDeleteOrphanKeyW(hkey: HKEY, pszSubKey: LPCWSTR): LONG {
    return Shlwapi.Load('SHDeleteOrphanKeyW')(hkey, pszSubKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shdeletevaluea
  public static SHDeleteValueA(hkey: HKEY, pszSubKey: LPCSTR, pszValue: LPCSTR): LONG {
    return Shlwapi.Load('SHDeleteValueA')(hkey, pszSubKey, pszValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shdeletevaluew
  public static SHDeleteValueW(hkey: HKEY, pszSubKey: LPCWSTR, pszValue: LPCWSTR): LONG {
    return Shlwapi.Load('SHDeleteValueW')(hkey, pszSubKey, pszValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shenumkeyexa
  public static SHEnumKeyExA(hkey: HKEY, dwIndex: DWORD, pszName: LPSTR, pcchName: LPDWORD): LONG {
    return Shlwapi.Load('SHEnumKeyExA')(hkey, dwIndex, pszName, pcchName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shenumkeyexw
  public static SHEnumKeyExW(hkey: HKEY, dwIndex: DWORD, pszName: LPWSTR, pcchName: LPDWORD): LONG {
    return Shlwapi.Load('SHEnumKeyExW')(hkey, dwIndex, pszName, pcchName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shenumvaluea
  public static SHEnumValueA(hkey: HKEY, dwIndex: DWORD, pszValueName: LPSTR, pcchValueName: LPDWORD | NULL, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL): LONG {
    return Shlwapi.Load('SHEnumValueA')(hkey, dwIndex, pszValueName, pcchValueName, pdwType, pvData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shenumvaluew
  public static SHEnumValueW(hkey: HKEY, dwIndex: DWORD, pszValueName: LPWSTR, pcchValueName: LPDWORD | NULL, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL): LONG {
    return Shlwapi.Load('SHEnumValueW')(hkey, dwIndex, pszValueName, pcchValueName, pdwType, pvData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shformatdatetimea
  public static SHFormatDateTimeA(pft: LPVOID, pdwFlags: LPDWORD | NULL, pszBuf: LPSTR, cchBuf: UINT): INT {
    return Shlwapi.Load('SHFormatDateTimeA')(pft, pdwFlags, pszBuf, cchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shformatdatetimew
  public static SHFormatDateTimeW(pft: LPVOID, pdwFlags: LPDWORD | NULL, pszBuf: LPWSTR, cchBuf: UINT): INT {
    return Shlwapi.Load('SHFormatDateTimeW')(pft, pdwFlags, pszBuf, cchBuf);
  }

  public static SHFreeShared(hData: HANDLE, dwProcessId: DWORD): BOOL {
    return Shlwapi.Load('SHFreeShared')(hData, dwProcessId);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shgetinversecmap
  public static SHGetInverseCMAP(pbMap: LPBYTE, cbMap: ULONG): HRESULT {
    return Shlwapi.Load('SHGetInverseCMAP')(pbMap, cbMap);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shgetthreadref
  public static SHGetThreadRef(ppunk: LPVOID): HRESULT {
    return Shlwapi.Load('SHGetThreadRef')(ppunk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shgetvaluea
  public static SHGetValueA(hkey: HKEY, pszSubKey: LPCSTR | NULL, pszValue: LPCSTR | NULL, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL): LONG {
    return Shlwapi.Load('SHGetValueA')(hkey, pszSubKey, pszValue, pdwType, pvData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shgetvaluew
  public static SHGetValueW(hkey: HKEY, pszSubKey: LPCWSTR | NULL, pszValue: LPCWSTR | NULL, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL): LONG {
    return Shlwapi.Load('SHGetValueW')(hkey, pszSubKey, pszValue, pdwType, pvData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shgetviewstatepropertybag
  public static SHGetViewStatePropertyBag(pidl: PIDLIST_ABSOLUTE | NULL, pszBagName: PCWSTR | NULL, dwFlags: DWORD, riid: REFIID, ppv: LPVOID): HRESULT {
    return Shlwapi.Load('SHGetViewStatePropertyBag')(pidl, pszBagName, dwFlags, riid, ppv);
  }

  public static ShellMessageBoxA(hAppInst: HINSTANCE, hWnd: HWND | 0n, lpcText: LPCSTR, lpcTitle: LPCSTR | NULL, fuStyle: UINT): INT {
    return Shlwapi.Load('ShellMessageBoxA')(hAppInst, hWnd, lpcText, lpcTitle, fuStyle);
  }

  public static ShellMessageBoxInternal(hAppInst: HINSTANCE, hWnd: HWND | 0n, lpcText: LPCWSTR, lpcTitle: LPCWSTR | NULL, fuStyle: UINT, bUnicode: BOOL): INT {
    return Shlwapi.Load('ShellMessageBoxInternal')(hAppInst, hWnd, lpcText, lpcTitle, fuStyle, bUnicode);
  }

  public static ShellMessageBoxW(hAppInst: HINSTANCE, hWnd: HWND | 0n, lpcText: LPCWSTR, lpcTitle: LPCWSTR | NULL, fuStyle: UINT): INT {
    return Shlwapi.Load('ShellMessageBoxW')(hAppInst, hWnd, lpcText, lpcTitle, fuStyle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shischildorself
  public static SHIsChildOrSelf(hwndParent: HWND, hwnd: HWND): HRESULT {
    return Shlwapi.Load('SHIsChildOrSelf')(hwndParent, hwnd);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shislowmemorymachine
  public static SHIsLowMemoryMachine(dwType: DWORD): BOOL {
    return Shlwapi.Load('SHIsLowMemoryMachine')(dwType);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shloadindirectstring
  public static SHLoadIndirectString(pszSource: PCWSTR, pszOutBuf: PWSTR, cchOutBuf: UINT, ppvReserved: LPVOID | NULL): HRESULT {
    return Shlwapi.Load('SHLoadIndirectString')(pszSource, pszOutBuf, cchOutBuf, ppvReserved);
  }

  public static SHLockShared(hData: HANDLE, dwProcessId: DWORD): LONG_PTR {
    return Shlwapi.Load('SHLockShared')(hData, dwProcessId);
  }

  public static SHMessageBoxCheckA(hwnd: HWND | 0n, pszText: LPCSTR, pszTitle: LPCSTR | NULL, uType: UINT, iDefault: INT, pszRegVal: LPCSTR): INT {
    return Shlwapi.Load('SHMessageBoxCheckA')(hwnd, pszText, pszTitle, uType, iDefault, pszRegVal);
  }

  public static SHMessageBoxCheckW(hwnd: HWND | 0n, pszText: LPCWSTR, pszTitle: LPCWSTR | NULL, uType: UINT, iDefault: INT, pszRegVal: LPCWSTR): INT {
    return Shlwapi.Load('SHMessageBoxCheckW')(hwnd, pszText, pszTitle, uType, iDefault, pszRegVal);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shopenregstream2a
  public static SHOpenRegStream2A(hkey: HKEY, pszSubkey: LPCSTR | NULL, pszValue: LPCSTR | NULL, grfMode: DWORD): LONG_PTR {
    return Shlwapi.Load('SHOpenRegStream2A')(hkey, pszSubkey, pszValue, grfMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shopenregstream2w
  public static SHOpenRegStream2W(hkey: HKEY, pszSubkey: LPCWSTR | NULL, pszValue: LPCWSTR | NULL, grfMode: DWORD): LONG_PTR {
    return Shlwapi.Load('SHOpenRegStream2W')(hkey, pszSubkey, pszValue, grfMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shopenregstreama
  public static SHOpenRegStreamA(hkey: HKEY, pszSubkey: LPCSTR | NULL, pszValue: LPCSTR | NULL, grfMode: DWORD): LONG_PTR {
    return Shlwapi.Load('SHOpenRegStreamA')(hkey, pszSubkey, pszValue, grfMode);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shopenregstreamw
  public static SHOpenRegStreamW(hkey: HKEY, pszSubkey: LPCWSTR | NULL, pszValue: LPCWSTR | NULL, grfMode: DWORD): LONG_PTR {
    return Shlwapi.Load('SHOpenRegStreamW')(hkey, pszSubkey, pszValue, grfMode);
  }

  public static SHPackDispParamsV(pdparams: LPVOID, rgvt: LPVOID, cArgs: UINT, argList: LPVOID): HRESULT {
    return Shlwapi.Load('SHPackDispParamsV')(pdparams, rgvt, cArgs, argList);
  }

  public static SHPinDllOfCLSID(pclsid: REFIID): HRESULT {
    return Shlwapi.Load('SHPinDllOfCLSID')(pclsid);
  }

  public static SHPropertyBag_ReadStrAlloc(ppb: HANDLE, pszPropName: PCWSTR, ppszOut: LPVOID): HRESULT {
    return Shlwapi.Load('SHPropertyBag_ReadStrAlloc')(ppb, pszPropName, ppszOut);
  }

  public static SHPropertyBag_WriteBSTR(ppb: HANDLE, pszPropName: PCWSTR, bstrValue: BSTR): HRESULT {
    return Shlwapi.Load('SHPropertyBag_WriteBSTR')(ppb, pszPropName, bstrValue);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shqueryinfokeya
  public static SHQueryInfoKeyA(hkey: HKEY, pcSubKeys: LPDWORD | NULL, pcchMaxSubKeyLen: LPDWORD | NULL, pcValues: LPDWORD | NULL, pcchMaxValueNameLen: LPDWORD | NULL): LONG {
    return Shlwapi.Load('SHQueryInfoKeyA')(hkey, pcSubKeys, pcchMaxSubKeyLen, pcValues, pcchMaxValueNameLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shqueryinfokeyw
  public static SHQueryInfoKeyW(hkey: HKEY, pcSubKeys: LPDWORD | NULL, pcchMaxSubKeyLen: LPDWORD | NULL, pcValues: LPDWORD | NULL, pcchMaxValueNameLen: LPDWORD | NULL): LONG {
    return Shlwapi.Load('SHQueryInfoKeyW')(hkey, pcSubKeys, pcchMaxSubKeyLen, pcValues, pcchMaxValueNameLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shqueryvalueexa
  public static SHQueryValueExA(hkey: HKEY, pszValue: LPCSTR | NULL, pdwReserved: LPDWORD | NULL, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL): LONG {
    return Shlwapi.Load('SHQueryValueExA')(hkey, pszValue, pdwReserved, pdwType, pvData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shqueryvalueexw
  public static SHQueryValueExW(hkey: HKEY, pszValue: LPCWSTR | NULL, pdwReserved: LPDWORD | NULL, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL): LONG {
    return Shlwapi.Load('SHQueryValueExW')(hkey, pszValue, pdwReserved, pdwType, pvData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregcloseuskey
  public static SHRegCloseUSKey(hUSKey: HUSKEY): LONG {
    return Shlwapi.Load('SHRegCloseUSKey')(hUSKey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregcreateuskeya
  public static SHRegCreateUSKeyA(pszPath: LPCSTR, samDesired: REGSAM, hRelativeUSKey: HUSKEY | 0n, phNewUSKey: PHUSKEY, dwFlags: DWORD): LONG {
    return Shlwapi.Load('SHRegCreateUSKeyA')(pszPath, samDesired, hRelativeUSKey, phNewUSKey, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregcreateuskeyw
  public static SHRegCreateUSKeyW(pszPath: LPCWSTR, samDesired: REGSAM, hRelativeUSKey: HUSKEY | 0n, phNewUSKey: PHUSKEY, dwFlags: DWORD): LONG {
    return Shlwapi.Load('SHRegCreateUSKeyW')(pszPath, samDesired, hRelativeUSKey, phNewUSKey, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregdeleteemptyuskeya
  public static SHRegDeleteEmptyUSKeyA(hUSKey: HUSKEY, pszSubKey: LPCSTR, delRegFlags: DWORD): LONG {
    return Shlwapi.Load('SHRegDeleteEmptyUSKeyA')(hUSKey, pszSubKey, delRegFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregdeleteemptyuskeyw
  public static SHRegDeleteEmptyUSKeyW(hUSKey: HUSKEY, pszSubKey: LPCWSTR, delRegFlags: DWORD): LONG {
    return Shlwapi.Load('SHRegDeleteEmptyUSKeyW')(hUSKey, pszSubKey, delRegFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregdeleteusvaluea
  public static SHRegDeleteUSValueA(hUSKey: HUSKEY, pszValue: LPCSTR, delRegFlags: DWORD): LONG {
    return Shlwapi.Load('SHRegDeleteUSValueA')(hUSKey, pszValue, delRegFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregdeleteusvaluew
  public static SHRegDeleteUSValueW(hUSKey: HUSKEY, pszValue: LPCWSTR, delRegFlags: DWORD): LONG {
    return Shlwapi.Load('SHRegDeleteUSValueW')(hUSKey, pszValue, delRegFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregduplicatehkey
  public static SHRegDuplicateHKey(hkey: HKEY): HKEY {
    return Shlwapi.Load('SHRegDuplicateHKey')(hkey);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregenummuskeya
  public static SHRegEnumUSKeyA(hUSKey: HUSKEY, dwIndex: DWORD, pszName: LPSTR, pcchName: LPDWORD, enumRegFlags: DWORD): LONG {
    return Shlwapi.Load('SHRegEnumUSKeyA')(hUSKey, dwIndex, pszName, pcchName, enumRegFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregenummuskeyw
  public static SHRegEnumUSKeyW(hUSKey: HUSKEY, dwIndex: DWORD, pszName: LPWSTR, pcchName: LPDWORD, enumRegFlags: DWORD): LONG {
    return Shlwapi.Load('SHRegEnumUSKeyW')(hUSKey, dwIndex, pszName, pcchName, enumRegFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregenumvaluea
  public static SHRegEnumUSValueA(hUSKey: HUSKEY, dwIndex: DWORD, pszValueName: LPSTR, pcchValueName: LPDWORD, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL, enumRegFlags: DWORD): LONG {
    return Shlwapi.Load('SHRegEnumUSValueA')(hUSKey, dwIndex, pszValueName, pcchValueName, pdwType, pvData, pcbData, enumRegFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregenumvaluew
  public static SHRegEnumUSValueW(hUSKey: HUSKEY, dwIndex: DWORD, pszValueName: LPWSTR, pcchValueName: LPDWORD, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL, enumRegFlags: DWORD): LONG {
    return Shlwapi.Load('SHRegEnumUSValueW')(hUSKey, dwIndex, pszValueName, pcchValueName, pdwType, pvData, pcbData, enumRegFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreggetboolusvaluea
  public static SHRegGetBoolUSValueA(pszSubKey: LPCSTR, pszValue: LPCSTR | NULL, fIgnoreHKCU: BOOL, fDefault: BOOL): BOOL {
    return Shlwapi.Load('SHRegGetBoolUSValueA')(pszSubKey, pszValue, fIgnoreHKCU, fDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreggetboolusvaluew
  public static SHRegGetBoolUSValueW(pszSubKey: LPCWSTR, pszValue: LPCWSTR | NULL, fIgnoreHKCU: BOOL, fDefault: BOOL): BOOL {
    return Shlwapi.Load('SHRegGetBoolUSValueW')(pszSubKey, pszValue, fIgnoreHKCU, fDefault);
  }

  public static SHRegGetBoolValueFromHKCUHKLM(pszKey: PCWSTR, pszValue: PCWSTR, fDefault: BOOL): BOOL {
    return Shlwapi.Load('SHRegGetBoolValueFromHKCUHKLM')(pszKey, pszValue, fDefault);
  }

  public static SHRegGetIntW(hk: HKEY, pszValue: PCWSTR, iDefault: INT): INT {
    return Shlwapi.Load('SHRegGetIntW')(hk, pszValue, iDefault);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreggetpatha
  public static SHRegGetPathA(hKey: HKEY, pcszSubKey: LPCSTR, pcszValue: LPCSTR, pszPath: LPSTR, dwFlags: DWORD): LONG {
    return Shlwapi.Load('SHRegGetPathA')(hKey, pcszSubKey, pcszValue, pszPath, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreggetpathw
  public static SHRegGetPathW(hKey: HKEY, pcszSubKey: LPCWSTR, pcszValue: LPCWSTR, pszPath: LPWSTR, dwFlags: DWORD): LONG {
    return Shlwapi.Load('SHRegGetPathW')(hKey, pcszSubKey, pcszValue, pszPath, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreggetusvaluea
  public static SHRegGetUSValueA(pszSubKey: LPCSTR, pszValue: LPCSTR | NULL, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL, fIgnoreHKCU: BOOL, pvDefaultData: LPVOID | NULL, dwDefaultDataSize: DWORD): LONG {
    return Shlwapi.Load('SHRegGetUSValueA')(pszSubKey, pszValue, pdwType, pvData, pcbData, fIgnoreHKCU, pvDefaultData, dwDefaultDataSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreggetusvaluew
  public static SHRegGetUSValueW(pszSubKey: LPCWSTR, pszValue: LPCWSTR | NULL, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL, fIgnoreHKCU: BOOL, pvDefaultData: LPVOID | NULL, dwDefaultDataSize: DWORD): LONG {
    return Shlwapi.Load('SHRegGetUSValueW')(pszSubKey, pszValue, pdwType, pvData, pcbData, fIgnoreHKCU, pvDefaultData, dwDefaultDataSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreggetvaluea
  public static SHRegGetValueA(hkey: HKEY, pszSubKey: LPCSTR | NULL, pszValue: LPCSTR | NULL, srrfFlags: DWORD, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL): LONG {
    return Shlwapi.Load('SHRegGetValueA')(hkey, pszSubKey, pszValue, srrfFlags, pdwType, pvData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreggetvaluefromhkcuhklm
  public static SHRegGetValueFromHKCUHKLM(pwszKey: PCWSTR, pwszValue: PCWSTR | NULL, srrfFlags: DWORD, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL): LONG {
    return Shlwapi.Load('SHRegGetValueFromHKCUHKLM')(pwszKey, pwszValue, srrfFlags, pdwType, pvData, pcbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreggetvaluew
  public static SHRegGetValueW(hkey: HKEY, pszSubKey: LPCWSTR | NULL, pszValue: LPCWSTR | NULL, srrfFlags: DWORD, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL): LONG {
    return Shlwapi.Load('SHRegGetValueW')(hkey, pszSubKey, pszValue, srrfFlags, pdwType, pvData, pcbData);
  }

  public static SHRegisterValidateTemplate(pcszTemplate: PCWSTR, bOkToAddToGlobalTemplate: BOOL): HRESULT {
    return Shlwapi.Load('SHRegisterValidateTemplate')(pcszTemplate, bOkToAddToGlobalTemplate);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregopenuskeya
  public static SHRegOpenUSKeyA(pszPath: LPCSTR, samDesired: REGSAM, hRelativeUSKey: HUSKEY | 0n, phNewUSKey: PHUSKEY, fIgnoreHKCU: BOOL): LONG {
    return Shlwapi.Load('SHRegOpenUSKeyA')(pszPath, samDesired, hRelativeUSKey, phNewUSKey, fIgnoreHKCU);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregopenuskeyw
  public static SHRegOpenUSKeyW(pszPath: LPCWSTR, samDesired: REGSAM, hRelativeUSKey: HUSKEY | 0n, phNewUSKey: PHUSKEY, fIgnoreHKCU: BOOL): LONG {
    return Shlwapi.Load('SHRegOpenUSKeyW')(pszPath, samDesired, hRelativeUSKey, phNewUSKey, fIgnoreHKCU);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregqueryinfouskeya
  public static SHRegQueryInfoUSKeyA(hUSKey: HUSKEY, pcSubKeys: LPDWORD | NULL, pcchMaxSubKeyLen: LPDWORD | NULL, pcValues: LPDWORD | NULL, pcchMaxValueNameLen: LPDWORD | NULL, enumRegFlags: DWORD): LONG {
    return Shlwapi.Load('SHRegQueryInfoUSKeyA')(hUSKey, pcSubKeys, pcchMaxSubKeyLen, pcValues, pcchMaxValueNameLen, enumRegFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregqueryinfouskeyw
  public static SHRegQueryInfoUSKeyW(hUSKey: HUSKEY, pcSubKeys: LPDWORD | NULL, pcchMaxSubKeyLen: LPDWORD | NULL, pcValues: LPDWORD | NULL, pcchMaxValueNameLen: LPDWORD | NULL, enumRegFlags: DWORD): LONG {
    return Shlwapi.Load('SHRegQueryInfoUSKeyW')(hUSKey, pcSubKeys, pcchMaxSubKeyLen, pcValues, pcchMaxValueNameLen, enumRegFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregqueryusvaluea
  public static SHRegQueryUSValueA(hUSKey: HUSKEY, pszValue: LPCSTR | NULL, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL, fIgnoreHKCU: BOOL, pvDefaultData: LPVOID | NULL, dwDefaultDataSize: DWORD): LONG {
    return Shlwapi.Load('SHRegQueryUSValueA')(hUSKey, pszValue, pdwType, pvData, pcbData, fIgnoreHKCU, pvDefaultData, dwDefaultDataSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregqueryusvaluew
  public static SHRegQueryUSValueW(hUSKey: HUSKEY, pszValue: LPCWSTR | NULL, pdwType: LPDWORD | NULL, pvData: LPVOID | NULL, pcbData: LPDWORD | NULL, fIgnoreHKCU: BOOL, pvDefaultData: LPVOID | NULL, dwDefaultDataSize: DWORD): LONG {
    return Shlwapi.Load('SHRegQueryUSValueW')(hUSKey, pszValue, pdwType, pvData, pcbData, fIgnoreHKCU, pvDefaultData, dwDefaultDataSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregsetpatha
  public static SHRegSetPathA(hKey: HKEY, pcszSubKey: LPCSTR, pcszValue: LPCSTR, pcszPath: LPCSTR, dwFlags: DWORD): LONG {
    return Shlwapi.Load('SHRegSetPathA')(hKey, pcszSubKey, pcszValue, pcszPath, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregsetpathw
  public static SHRegSetPathW(hKey: HKEY, pcszSubKey: LPCWSTR, pcszValue: LPCWSTR, pcszPath: LPCWSTR, dwFlags: DWORD): LONG {
    return Shlwapi.Load('SHRegSetPathW')(hKey, pcszSubKey, pcszValue, pcszPath, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregsetusvaluea
  public static SHRegSetUSValueA(pszSubKey: LPCSTR, pszValue: LPCSTR, dwType: DWORD, pvData: LPVOID | NULL, cbData: DWORD, dwFlags: DWORD): LONG {
    return Shlwapi.Load('SHRegSetUSValueA')(pszSubKey, pszValue, dwType, pvData, cbData, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregsetusvaluew
  public static SHRegSetUSValueW(pszSubKey: LPCWSTR, pszValue: LPCWSTR, dwType: DWORD, pvData: LPVOID | NULL, cbData: DWORD, dwFlags: DWORD): LONG {
    return Shlwapi.Load('SHRegSetUSValueW')(pszSubKey, pszValue, dwType, pvData, cbData, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregwriteusvaluea
  public static SHRegWriteUSValueA(hUSKey: HUSKEY, pszValue: LPCSTR | NULL, dwType: DWORD, pvData: LPVOID, cbData: DWORD, dwFlags: DWORD): LONG {
    return Shlwapi.Load('SHRegWriteUSValueA')(hUSKey, pszValue, dwType, pvData, cbData, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shregwriteusvaluew
  public static SHRegWriteUSValueW(hUSKey: HUSKEY, pszValue: LPCWSTR | NULL, dwType: DWORD, pvData: LPVOID, cbData: DWORD, dwFlags: DWORD): LONG {
    return Shlwapi.Load('SHRegWriteUSValueW')(hUSKey, pszValue, dwType, pvData, cbData, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shreleasethreadref
  public static SHReleaseThreadRef(): HRESULT {
    return Shlwapi.Load('SHReleaseThreadRef')();
  }

  public static SHRunIndirectRegClientCommand(hwnd: HWND, pszClientType: LPCWSTR): HRESULT {
    return Shlwapi.Load('SHRunIndirectRegClientCommand')(hwnd, pszClientType);
  }

  public static SHSendMessageBroadcastA(uMsg: UINT, wParam: WPARAM, lParam: LPARAM): LRESULT {
    return Shlwapi.Load('SHSendMessageBroadcastA')(uMsg, wParam, lParam);
  }

  public static SHSendMessageBroadcastW(uMsg: UINT, wParam: WPARAM, lParam: LPARAM): LRESULT {
    return Shlwapi.Load('SHSendMessageBroadcastW')(uMsg, wParam, lParam);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shsetthreadref
  public static SHSetThreadRef(punk: HANDLE): HRESULT {
    return Shlwapi.Load('SHSetThreadRef')(punk);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shsetvaluea
  public static SHSetValueA(hkey: HKEY, pszSubKey: LPCSTR | NULL, pszValue: LPCSTR | NULL, dwType: DWORD, pvData: LPVOID | NULL, cbData: DWORD): LONG {
    return Shlwapi.Load('SHSetValueA')(hkey, pszSubKey, pszValue, dwType, pvData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shsetvaluew
  public static SHSetValueW(hkey: HKEY, pszSubKey: LPCWSTR | NULL, pszValue: LPCWSTR | NULL, dwType: DWORD, pvData: LPVOID | NULL, cbData: DWORD): LONG {
    return Shlwapi.Load('SHSetValueW')(hkey, pszSubKey, pszValue, dwType, pvData, cbData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shskipjunction
  public static SHSkipJunction(pbc: HANDLE, pclsid: LPVOID): BOOL {
    return Shlwapi.Load('SHSkipJunction')(pbc, pclsid);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shstrdupa
  public static SHStrDupA(psz: LPCSTR, ppwsz: LPVOID): HRESULT {
    return Shlwapi.Load('SHStrDupA')(psz, ppwsz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-shstrdupw
  public static SHStrDupW(psz: LPCWSTR, ppwsz: LPVOID): HRESULT {
    return Shlwapi.Load('SHStrDupW')(psz, ppwsz);
  }

  public static SHStripMneumonicA(pszMenu: LPSTR): CHAR {
    return Shlwapi.Load('SHStripMneumonicA')(pszMenu);
  }

  public static SHStripMneumonicW(pszMenu: LPWSTR): WCHAR {
    return Shlwapi.Load('SHStripMneumonicW')(pszMenu);
  }

  public static SHUnicodeToAnsi(pwszSrc: PCWSTR, pszDst: LPSTR, cchBuf: INT): INT {
    return Shlwapi.Load('SHUnicodeToAnsi')(pwszSrc, pszDst, cchBuf);
  }

  public static SHUnicodeToAnsiCP(uiCodePage: UINT, pwszSrc: PCWSTR, pszDst: LPSTR, cchBuf: INT): INT {
    return Shlwapi.Load('SHUnicodeToAnsiCP')(uiCodePage, pwszSrc, pszDst, cchBuf);
  }

  public static SHUnicodeToUnicode(pwszSrc: PCWSTR, pwszDst: LPWSTR, cwchBuf: INT): INT {
    return Shlwapi.Load('SHUnicodeToUnicode')(pwszSrc, pwszDst, cwchBuf);
  }

  public static SHUnlockShared(pvData: LONG_PTR): BOOL {
    return Shlwapi.Load('SHUnlockShared')(pvData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strcatbuffa
  public static StrCatBuffA(pszDest: LPSTR, pszSrc: LPCSTR, cchDestBuffSize: INT): LONG_PTR {
    return Shlwapi.Load('StrCatBuffA')(pszDest, pszSrc, cchDestBuffSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strcatbuffw
  public static StrCatBuffW(pszDest: LPWSTR, pszSrc: LPCWSTR, cchDestBuffSize: INT): LONG_PTR {
    return Shlwapi.Load('StrCatBuffW')(pszDest, pszSrc, cchDestBuffSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strcatchainw
  public static StrCatChainW(pszDst: LPWSTR, cchDst: DWORD, ichAt: DWORD, pszSrc: LPCWSTR): DWORD {
    return Shlwapi.Load('StrCatChainW')(pszDst, cchDst, ichAt, pszSrc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strcatw
  public static StrCatW(psz1: LPWSTR, psz2: LPCWSTR): LONG_PTR {
    return Shlwapi.Load('StrCatW')(psz1, psz2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strchra
  public static StrChrA(pszStart: LPCSTR, wMatch: WORD): LONG_PTR {
    return Shlwapi.Load('StrChrA')(pszStart, wMatch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strchria
  public static StrChrIA(pszStart: LPCSTR, wMatch: WORD): LONG_PTR {
    return Shlwapi.Load('StrChrIA')(pszStart, wMatch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strchriw
  public static StrChrIW(pszStart: LPCWSTR, wMatch: WCHAR): LONG_PTR {
    return Shlwapi.Load('StrChrIW')(pszStart, wMatch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strchrniw
  public static StrChrNIW(pszStart: LPCWSTR, wMatch: WCHAR, cchMax: UINT): LONG_PTR {
    return Shlwapi.Load('StrChrNIW')(pszStart, wMatch, cchMax);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strchrnw
  public static StrChrNW(pszStart: LPCWSTR, wMatch: WCHAR, cchMax: UINT): LONG_PTR {
    return Shlwapi.Load('StrChrNW')(pszStart, wMatch, cchMax);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strchrw
  public static StrChrW(pszStart: LPCWSTR, wMatch: WCHAR): LONG_PTR {
    return Shlwapi.Load('StrChrW')(pszStart, wMatch);
  }

  public static StrCmpCA(pszStr1: LPCSTR, pszStr2: LPCSTR): INT {
    return Shlwapi.Load('StrCmpCA')(pszStr1, pszStr2);
  }

  public static StrCmpCW(pszStr1: LPCWSTR, pszStr2: LPCWSTR): INT {
    return Shlwapi.Load('StrCmpCW')(pszStr1, pszStr2);
  }

  public static StrCmpICA(pszStr1: LPCSTR, pszStr2: LPCSTR): INT {
    return Shlwapi.Load('StrCmpICA')(pszStr1, pszStr2);
  }

  public static StrCmpICW(pszStr1: LPCWSTR, pszStr2: LPCWSTR): INT {
    return Shlwapi.Load('StrCmpICW')(pszStr1, pszStr2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strcmpiw
  public static StrCmpIW(psz1: LPCWSTR, psz2: LPCWSTR): INT {
    return Shlwapi.Load('StrCmpIW')(psz1, psz2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strcmplogicalw
  public static StrCmpLogicalW(psz1: LPCWSTR, psz2: LPCWSTR): INT {
    return Shlwapi.Load('StrCmpLogicalW')(psz1, psz2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strcmpna
  public static StrCmpNA(psz1: LPCSTR, psz2: LPCSTR, nChar: INT): INT {
    return Shlwapi.Load('StrCmpNA')(psz1, psz2, nChar);
  }

  public static StrCmpNCA(pszStr1: LPCSTR, pszStr2: LPCSTR, nChar: INT): INT {
    return Shlwapi.Load('StrCmpNCA')(pszStr1, pszStr2, nChar);
  }

  public static StrCmpNCW(pszStr1: LPCWSTR, pszStr2: LPCWSTR, nChar: INT): INT {
    return Shlwapi.Load('StrCmpNCW')(pszStr1, pszStr2, nChar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strcmpnia
  public static StrCmpNIA(psz1: LPCSTR, psz2: LPCSTR, nChar: INT): INT {
    return Shlwapi.Load('StrCmpNIA')(psz1, psz2, nChar);
  }

  public static StrCmpNICA(pszStr1: LPCSTR, pszStr2: LPCSTR, nChar: INT): INT {
    return Shlwapi.Load('StrCmpNICA')(pszStr1, pszStr2, nChar);
  }

  public static StrCmpNICW(pszStr1: LPCWSTR, pszStr2: LPCWSTR, nChar: INT): INT {
    return Shlwapi.Load('StrCmpNICW')(pszStr1, pszStr2, nChar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strcmpniw
  public static StrCmpNIW(psz1: LPCWSTR, psz2: LPCWSTR, nChar: INT): INT {
    return Shlwapi.Load('StrCmpNIW')(psz1, psz2, nChar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strcmpnw
  public static StrCmpNW(psz1: LPCWSTR, psz2: LPCWSTR, nChar: INT): INT {
    return Shlwapi.Load('StrCmpNW')(psz1, psz2, nChar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strcmpw
  public static StrCmpW(psz1: LPCWSTR, psz2: LPCWSTR): INT {
    return Shlwapi.Load('StrCmpW')(psz1, psz2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strcpynw
  public static StrCpyNW(pszDst: LPWSTR, pszSrc: LPCWSTR, cchMax: INT): LONG_PTR {
    return Shlwapi.Load('StrCpyNW')(pszDst, pszSrc, cchMax);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strcpyw
  public static StrCpyW(psz1: LPWSTR, psz2: LPCWSTR): LONG_PTR {
    return Shlwapi.Load('StrCpyW')(psz1, psz2);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strcspna
  public static StrCSpnA(pszStr: LPCSTR, pszSet: LPCSTR): INT {
    return Shlwapi.Load('StrCSpnA')(pszStr, pszSet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strcspnia
  public static StrCSpnIA(pszStr: LPCSTR, pszSet: LPCSTR): INT {
    return Shlwapi.Load('StrCSpnIA')(pszStr, pszSet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strcspniw
  public static StrCSpnIW(pszStr: LPCWSTR, pszSet: LPCWSTR): INT {
    return Shlwapi.Load('StrCSpnIW')(pszStr, pszSet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strcspnw
  public static StrCSpnW(pszStr: LPCWSTR, pszSet: LPCWSTR): INT {
    return Shlwapi.Load('StrCSpnW')(pszStr, pszSet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strdupa
  public static StrDupA(pszSrch: LPCSTR): LONG_PTR {
    return Shlwapi.Load('StrDupA')(pszSrch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strdupw
  public static StrDupW(pszSrch: LPCWSTR): LONG_PTR {
    return Shlwapi.Load('StrDupW')(pszSrch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strformatbytesize64a
  public static StrFormatByteSize64A(qdw: LONGLONG, pszBuf: LPSTR, cchBuf: UINT): LONG_PTR {
    return Shlwapi.Load('StrFormatByteSize64A')(qdw, pszBuf, cchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strformatbytesizea
  public static StrFormatByteSizeA(dw: DWORD, pszBuf: LPSTR, cchBuf: UINT): LONG_PTR {
    return Shlwapi.Load('StrFormatByteSizeA')(dw, pszBuf, cchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strformatbytesizeex
  public static StrFormatByteSizeEx(ull: ULONGLONG, flags: DWORD, pszBuf: LPWSTR, cchBuf: UINT): HRESULT {
    return Shlwapi.Load('StrFormatByteSizeEx')(ull, flags, pszBuf, cchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strformatbytesizew
  public static StrFormatByteSizeW(qdw: LONGLONG, pszBuf: LPWSTR, cchBuf: UINT): LONG_PTR {
    return Shlwapi.Load('StrFormatByteSizeW')(qdw, pszBuf, cchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strformatkbsizea
  public static StrFormatKBSizeA(qdw: LONGLONG, pszBuf: LPSTR, cchBuf: UINT): LONG_PTR {
    return Shlwapi.Load('StrFormatKBSizeA')(qdw, pszBuf, cchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strformatkbsizew
  public static StrFormatKBSizeW(qdw: LONGLONG, pszBuf: LPWSTR, cchBuf: UINT): LONG_PTR {
    return Shlwapi.Load('StrFormatKBSizeW')(qdw, pszBuf, cchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strfromtimeintervala
  public static StrFromTimeIntervalA(pszOut: LPSTR, cchMax: UINT, dwTimeMS: DWORD, digits: INT): INT {
    return Shlwapi.Load('StrFromTimeIntervalA')(pszOut, cchMax, dwTimeMS, digits);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strfromtimeintervalw
  public static StrFromTimeIntervalW(pszOut: LPWSTR, cchMax: UINT, dwTimeMS: DWORD, digits: INT): INT {
    return Shlwapi.Load('StrFromTimeIntervalW')(pszOut, cchMax, dwTimeMS, digits);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strisintlequala
  public static StrIsIntlEqualA(fCaseSens: BOOL, pszString1: LPCSTR, pszString2: LPCSTR, nChar: INT): BOOL {
    return Shlwapi.Load('StrIsIntlEqualA')(fCaseSens, pszString1, pszString2, nChar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strisintlequalw
  public static StrIsIntlEqualW(fCaseSens: BOOL, pszString1: LPCWSTR, pszString2: LPCWSTR, nChar: INT): BOOL {
    return Shlwapi.Load('StrIsIntlEqualW')(fCaseSens, pszString1, pszString2, nChar);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strncata
  public static StrNCatA(psz1: LPSTR, psz2: LPCSTR, cchMax: INT): LONG_PTR {
    return Shlwapi.Load('StrNCatA')(psz1, psz2, cchMax);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strncatw
  public static StrNCatW(psz1: LPWSTR, psz2: LPCWSTR, cchMax: INT): LONG_PTR {
    return Shlwapi.Load('StrNCatW')(psz1, psz2, cchMax);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strpbrka
  public static StrPBrkA(psz: LPCSTR, pszSet: LPCSTR): LONG_PTR {
    return Shlwapi.Load('StrPBrkA')(psz, pszSet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strpbrkw
  public static StrPBrkW(psz: LPCWSTR, pszSet: LPCWSTR): LONG_PTR {
    return Shlwapi.Load('StrPBrkW')(psz, pszSet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strrchra
  public static StrRChrA(pszStart: LPCSTR, pszEnd: LPCSTR | NULL, wMatch: WORD): LONG_PTR {
    return Shlwapi.Load('StrRChrA')(pszStart, pszEnd, wMatch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strrchria
  public static StrRChrIA(pszStart: LPCSTR, pszEnd: LPCSTR | NULL, wMatch: WORD): LONG_PTR {
    return Shlwapi.Load('StrRChrIA')(pszStart, pszEnd, wMatch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strrchriw
  public static StrRChrIW(pszStart: LPCWSTR, pszEnd: LPCWSTR | NULL, wMatch: WCHAR): LONG_PTR {
    return Shlwapi.Load('StrRChrIW')(pszStart, pszEnd, wMatch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strrchrw
  public static StrRChrW(pszStart: LPCWSTR, pszEnd: LPCWSTR | NULL, wMatch: WCHAR): LONG_PTR {
    return Shlwapi.Load('StrRChrW')(pszStart, pszEnd, wMatch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strrettobstr
  public static StrRetToBSTR(pstr: LPVOID, pidl: LPVOID | NULL, pbstr: LPVOID): HRESULT {
    return Shlwapi.Load('StrRetToBSTR')(pstr, pidl, pbstr);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strrettobufa
  public static StrRetToBufA(pstr: LPVOID, pidl: LPVOID | NULL, pszBuf: LPSTR, cchBuf: UINT): HRESULT {
    return Shlwapi.Load('StrRetToBufA')(pstr, pidl, pszBuf, cchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strrettobufw
  public static StrRetToBufW(pstr: LPVOID, pidl: LPVOID | NULL, pszBuf: LPWSTR, cchBuf: UINT): HRESULT {
    return Shlwapi.Load('StrRetToBufW')(pstr, pidl, pszBuf, cchBuf);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strrettostra
  public static StrRetToStrA(pstr: LPVOID, pidl: LPVOID | NULL, ppsz: LPVOID): HRESULT {
    return Shlwapi.Load('StrRetToStrA')(pstr, pidl, ppsz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strrettostrw
  public static StrRetToStrW(pstr: LPVOID, pidl: LPVOID | NULL, ppsz: LPVOID): HRESULT {
    return Shlwapi.Load('StrRetToStrW')(pstr, pidl, ppsz);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strrstria
  public static StrRStrIA(pszSource: LPCSTR, pszLast: LPCSTR | NULL, pszSrch: LPCSTR): LONG_PTR {
    return Shlwapi.Load('StrRStrIA')(pszSource, pszLast, pszSrch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strrstriw
  public static StrRStrIW(pszSource: LPCWSTR, pszLast: LPCWSTR | NULL, pszSrch: LPCWSTR): LONG_PTR {
    return Shlwapi.Load('StrRStrIW')(pszSource, pszLast, pszSrch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strspna
  public static StrSpnA(psz: LPCSTR, pszSet: LPCSTR): INT {
    return Shlwapi.Load('StrSpnA')(psz, pszSet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strspnw
  public static StrSpnW(psz: LPCWSTR, pszSet: LPCWSTR): INT {
    return Shlwapi.Load('StrSpnW')(psz, pszSet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strstra
  public static StrStrA(pszFirst: LPCSTR, pszSrch: LPCSTR): LONG_PTR {
    return Shlwapi.Load('StrStrA')(pszFirst, pszSrch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strstria
  public static StrStrIA(pszFirst: LPCSTR, pszSrch: LPCSTR): LONG_PTR {
    return Shlwapi.Load('StrStrIA')(pszFirst, pszSrch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strstriw
  public static StrStrIW(pszFirst: LPCWSTR, pszSrch: LPCWSTR): LONG_PTR {
    return Shlwapi.Load('StrStrIW')(pszFirst, pszSrch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strstrniw
  public static StrStrNIW(pszFirst: LPCWSTR, pszSrch: LPCWSTR, cchMax: UINT): LONG_PTR {
    return Shlwapi.Load('StrStrNIW')(pszFirst, pszSrch, cchMax);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strstrnw
  public static StrStrNW(pszFirst: LPCWSTR, pszSrch: LPCWSTR, cchMax: UINT): LONG_PTR {
    return Shlwapi.Load('StrStrNW')(pszFirst, pszSrch, cchMax);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strstrw
  public static StrStrW(pszFirst: LPCWSTR, pszSrch: LPCWSTR): LONG_PTR {
    return Shlwapi.Load('StrStrW')(pszFirst, pszSrch);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strtoint64exa
  public static StrToInt64ExA(pszString: LPCSTR, dwFlags: DWORD, pllRet: LPVOID): BOOL {
    return Shlwapi.Load('StrToInt64ExA')(pszString, dwFlags, pllRet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strtoint64exw
  public static StrToInt64ExW(pszString: LPCWSTR, dwFlags: DWORD, pllRet: LPVOID): BOOL {
    return Shlwapi.Load('StrToInt64ExW')(pszString, dwFlags, pllRet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strtointa
  public static StrToIntA(pszSrc: LPCSTR): INT {
    return Shlwapi.Load('StrToIntA')(pszSrc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strtointexa
  public static StrToIntExA(pszString: LPCSTR, dwFlags: DWORD, piRet: LPVOID): BOOL {
    return Shlwapi.Load('StrToIntExA')(pszString, dwFlags, piRet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strtointexw
  public static StrToIntExW(pszString: LPCWSTR, dwFlags: DWORD, piRet: LPVOID): BOOL {
    return Shlwapi.Load('StrToIntExW')(pszString, dwFlags, piRet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strtointw
  public static StrToIntW(pszSrc: LPCWSTR): INT {
    return Shlwapi.Load('StrToIntW')(pszSrc);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strtrima
  public static StrTrimA(psz: LPSTR, pszTrimChars: LPCSTR): BOOL {
    return Shlwapi.Load('StrTrimA')(psz, pszTrimChars);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-strtrimw
  public static StrTrimW(psz: LPWSTR, pszTrimChars: LPCWSTR): BOOL {
    return Shlwapi.Load('StrTrimW')(psz, pszTrimChars);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlapplyschemea
  public static UrlApplySchemeA(pszIn: LPCSTR, pszOut: LPSTR, pcchOut: LPDWORD, dwFlags: DWORD): HRESULT {
    return Shlwapi.Load('UrlApplySchemeA')(pszIn, pszOut, pcchOut, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlapplyschemew
  public static UrlApplySchemeW(pszIn: LPCWSTR, pszOut: LPWSTR, pcchOut: LPDWORD, dwFlags: DWORD): HRESULT {
    return Shlwapi.Load('UrlApplySchemeW')(pszIn, pszOut, pcchOut, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlcanonicalizea
  public static UrlCanonicalizeA(pszUrl: LPCSTR, pszCanonicalized: LPSTR, pcchCanonicalized: LPDWORD, dwFlags: DWORD): HRESULT {
    return Shlwapi.Load('UrlCanonicalizeA')(pszUrl, pszCanonicalized, pcchCanonicalized, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlcanonicalizew
  public static UrlCanonicalizeW(pszUrl: LPCWSTR, pszCanonicalized: LPWSTR, pcchCanonicalized: LPDWORD, dwFlags: DWORD): HRESULT {
    return Shlwapi.Load('UrlCanonicalizeW')(pszUrl, pszCanonicalized, pcchCanonicalized, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlcombinea
  public static UrlCombineA(pszBase: LPCSTR, pszRelative: LPCSTR, pszCombined: LPSTR, pcchCombined: LPDWORD, dwFlags: DWORD): HRESULT {
    return Shlwapi.Load('UrlCombineA')(pszBase, pszRelative, pszCombined, pcchCombined, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlcombinew
  public static UrlCombineW(pszBase: LPCWSTR, pszRelative: LPCWSTR, pszCombined: LPWSTR, pcchCombined: LPDWORD, dwFlags: DWORD): HRESULT {
    return Shlwapi.Load('UrlCombineW')(pszBase, pszRelative, pszCombined, pcchCombined, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlcomparea
  public static UrlCompareA(psz1: LPCSTR, psz2: LPCSTR, fIgnoreSlash: BOOL): INT {
    return Shlwapi.Load('UrlCompareA')(psz1, psz2, fIgnoreSlash);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlcomparew
  public static UrlCompareW(psz1: LPCWSTR, psz2: LPCWSTR, fIgnoreSlash: BOOL): INT {
    return Shlwapi.Load('UrlCompareW')(psz1, psz2, fIgnoreSlash);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlcreatefrompatha
  public static UrlCreateFromPathA(pszPath: LPCSTR, pszUrl: LPSTR, pcchUrl: LPDWORD, dwFlags: DWORD): HRESULT {
    return Shlwapi.Load('UrlCreateFromPathA')(pszPath, pszUrl, pcchUrl, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlcreatefrompathw
  public static UrlCreateFromPathW(pszPath: LPCWSTR, pszUrl: LPWSTR, pcchUrl: LPDWORD, dwFlags: DWORD): HRESULT {
    return Shlwapi.Load('UrlCreateFromPathW')(pszPath, pszUrl, pcchUrl, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlescapea
  public static UrlEscapeA(pszUrl: LPCSTR, pszEscaped: LPSTR, pcchEscaped: LPDWORD, dwFlags: DWORD): HRESULT {
    return Shlwapi.Load('UrlEscapeA')(pszUrl, pszEscaped, pcchEscaped, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlescapew
  public static UrlEscapeW(pszUrl: LPCWSTR, pszEscaped: LPWSTR, pcchEscaped: LPDWORD, dwFlags: DWORD): HRESULT {
    return Shlwapi.Load('UrlEscapeW')(pszUrl, pszEscaped, pcchEscaped, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlfixupw
  public static UrlFixupW(pcszUrl: LPCWSTR, pszTranslatedUrl: LPWSTR, cchMax: DWORD): HRESULT {
    return Shlwapi.Load('UrlFixupW')(pcszUrl, pszTranslatedUrl, cchMax);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlgetlocationa
  public static UrlGetLocationA(pszURL: LPCSTR): LONG_PTR {
    return Shlwapi.Load('UrlGetLocationA')(pszURL);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlgetlocationw
  public static UrlGetLocationW(pszURL: LPCWSTR): LONG_PTR {
    return Shlwapi.Load('UrlGetLocationW')(pszURL);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlgetparta
  public static UrlGetPartA(pszIn: LPCSTR, pszOut: LPSTR, pcchOut: LPDWORD, dwPart: DWORD, dwFlags: DWORD): HRESULT {
    return Shlwapi.Load('UrlGetPartA')(pszIn, pszOut, pcchOut, dwPart, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlgetpartw
  public static UrlGetPartW(pszIn: LPCWSTR, pszOut: LPWSTR, pcchOut: LPDWORD, dwPart: DWORD, dwFlags: DWORD): HRESULT {
    return Shlwapi.Load('UrlGetPartW')(pszIn, pszOut, pcchOut, dwPart, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlhasha
  public static UrlHashA(pszUrl: LPCSTR, pbHash: LPBYTE, cbHash: DWORD): HRESULT {
    return Shlwapi.Load('UrlHashA')(pszUrl, pbHash, cbHash);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlhashw
  public static UrlHashW(pszUrl: LPCWSTR, pbHash: LPBYTE, cbHash: DWORD): HRESULT {
    return Shlwapi.Load('UrlHashW')(pszUrl, pbHash, cbHash);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlisa
  public static UrlIsA(pszUrl: LPCSTR, UrlIs: DWORD): BOOL {
    return Shlwapi.Load('UrlIsA')(pszUrl, UrlIs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlisnohistorya
  public static UrlIsNoHistoryA(pszURL: LPCSTR): BOOL {
    return Shlwapi.Load('UrlIsNoHistoryA')(pszURL);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlisnohistoryw
  public static UrlIsNoHistoryW(pszURL: LPCWSTR): BOOL {
    return Shlwapi.Load('UrlIsNoHistoryW')(pszURL);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlisopaquea
  public static UrlIsOpaqueA(pszURL: LPCSTR): BOOL {
    return Shlwapi.Load('UrlIsOpaqueA')(pszURL);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlisopaquew
  public static UrlIsOpaqueW(pszURL: LPCWSTR): BOOL {
    return Shlwapi.Load('UrlIsOpaqueW')(pszURL);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlisw
  public static UrlIsW(pszUrl: LPCWSTR, UrlIs: DWORD): BOOL {
    return Shlwapi.Load('UrlIsW')(pszUrl, UrlIs);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlunescapea
  public static UrlUnescapeA(pszUrl: LPSTR, pszUnescaped: LPSTR | NULL, pcchUnescaped: LPDWORD | NULL, dwFlags: DWORD): HRESULT {
    return Shlwapi.Load('UrlUnescapeA')(pszUrl, pszUnescaped, pcchUnescaped, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-urlunescapew
  public static UrlUnescapeW(pszUrl: LPWSTR, pszUnescaped: LPWSTR | NULL, pcchUnescaped: LPDWORD | NULL, dwFlags: DWORD): HRESULT {
    return Shlwapi.Load('UrlUnescapeW')(pszUrl, pszUnescaped, pcchUnescaped, dwFlags);
  }

  public static WhichPlatform(): UINT {
    return Shlwapi.Load('WhichPlatform')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-wnsprintfa
  public static wnsprintfA(pszDest: LPSTR, cchDest: INT, pszFmt: LPCSTR): INT {
    return Shlwapi.Load('wnsprintfA')(pszDest, cchDest, pszFmt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-wnsprintfw
  public static wnsprintfW(pszDest: LPWSTR, cchDest: INT, pszFmt: LPCWSTR): INT {
    return Shlwapi.Load('wnsprintfW')(pszDest, cchDest, pszFmt);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-wvnsprintfa
  public static wvnsprintfA(pszDest: LPSTR, cchDest: INT, pszFmt: LPCSTR, arglist: LPVOID): INT {
    return Shlwapi.Load('wvnsprintfA')(pszDest, cchDest, pszFmt, arglist);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/shlwapi/nf-shlwapi-wvnsprintfw
  public static wvnsprintfW(pszDest: LPWSTR, cchDest: INT, pszFmt: LPCWSTR, arglist: LPVOID): INT {
    return Shlwapi.Load('wvnsprintfW')(pszDest, cchDest, pszFmt, arglist);
  }
}

export default Shlwapi;
