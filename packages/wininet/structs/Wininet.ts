import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type {
  BOOL,
  DWORD,
  DWORD_PTR,
  GROUPID,
  HANDLE,
  HINTERNET,
  HWND,
  INTERNET_PORT,
  INTERNET_STATUS_CALLBACK,
  LONG,
  LPBYTE,
  LPCSTR,
  LPCVOID,
  LPCWSTR,
  LPDWORD,
  LPGROUPID,
  LPHINTERNET,
  LPINTERNET_BUFFERSA,
  LPINTERNET_BUFFERSW,
  LPINTERNET_CACHE_CONFIG_INFOA,
  LPINTERNET_CACHE_CONFIG_INFOW,
  LPINTERNET_CACHE_CONTAINER_INFOA,
  LPINTERNET_CACHE_CONTAINER_INFOW,
  LPINTERNET_CACHE_ENTRY_INFOA,
  LPINTERNET_CACHE_ENTRY_INFOW,
  LPINTERNET_CACHE_GROUP_INFOA,
  LPINTERNET_CACHE_GROUP_INFOW,
  LPSTR,
  LPURL_COMPONENTSA,
  LPURL_COMPONENTSW,
  LPVOID,
  LPWIN32_FIND_DATAA,
  LPWIN32_FIND_DATAW,
  LPWSTR,
  NULL,
  PACKED_FILETIME,
  PCWSTR,
  PDWORD,
  PFILETIME,
  PHANDLE,
  PINTERNET_COOKIE2,
  PPINTERNET_COOKIE2,
  PSYSTEMTIME,
  PWININET_PROXY_INFO_LIST,
  UINT,
  ULONGLONG,
} from '../types/Wininet';

/**
 * Thin, lazy-loaded FFI bindings for `wininet.dll`.
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
 * import Wininet, { InternetOpenType, InternetService } from '@bun-win32/wininet';
 *
 * const agent = Buffer.from('Bun WinINet/1.0\0', 'utf16le');
 * const hSession = Wininet.InternetOpenW(agent.ptr, InternetOpenType.PRECONFIG, null, null, 0);
 *
 * Wininet.Preload(['HttpOpenRequestW', 'HttpSendRequestW', 'InternetReadFile']);
 * ```
 */
class Wininet extends Win32 {
  protected static override name = 'wininet.dll';

  /** @inheritdoc */
  protected static override readonly Symbols = {
    CommitUrlCacheEntryA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CommitUrlCacheEntryW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateUrlCacheContainerA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateUrlCacheContainerW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    CreateUrlCacheEntryA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CreateUrlCacheEntryW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    CreateUrlCacheGroup: { args: [FFIType.u32, FFIType.ptr], returns: FFIType.i64 },
    DeleteUrlCacheContainerA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    DeleteUrlCacheContainerW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    DeleteUrlCacheEntry: { args: [FFIType.ptr], returns: FFIType.i32 },
    DeleteUrlCacheEntryA: { args: [FFIType.ptr], returns: FFIType.i32 },
    DeleteUrlCacheEntryW: { args: [FFIType.ptr], returns: FFIType.i32 },
    DeleteUrlCacheGroup: { args: [FFIType.i64, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    DetectAutoProxyUrl: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    FindCloseUrlCache: { args: [FFIType.u64], returns: FFIType.i32 },
    FindFirstUrlCacheContainerA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    FindFirstUrlCacheContainerW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    FindFirstUrlCacheEntryA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    FindFirstUrlCacheEntryExA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.i64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    FindFirstUrlCacheEntryExW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.i64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    FindFirstUrlCacheEntryW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    FindFirstUrlCacheGroup: { args: [FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u64 },
    FindNextUrlCacheContainerA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FindNextUrlCacheContainerW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FindNextUrlCacheEntryA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FindNextUrlCacheEntryExA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FindNextUrlCacheEntryExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FindNextUrlCacheEntryW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FindNextUrlCacheGroup: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FreeUrlCacheSpaceA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    FreeUrlCacheSpaceW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    FtpCommandA: { args: [FFIType.u64, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    FtpCommandW: { args: [FFIType.u64, FFIType.i32, FFIType.u32, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    FtpCreateDirectoryA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    FtpCreateDirectoryW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    FtpDeleteFileA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    FtpDeleteFileW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    FtpFindFirstFileA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u64 },
    FtpFindFirstFileW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u64 },
    FtpGetCurrentDirectoryA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FtpGetCurrentDirectoryW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FtpGetFileA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    FtpGetFileSize: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.u32 },
    FtpGetFileW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    FtpOpenFileA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u64 },
    FtpOpenFileW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u64 },
    FtpPutFileA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    FtpPutFileW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    FtpRemoveDirectoryA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    FtpRemoveDirectoryW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    FtpRenameFileA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FtpRenameFileW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    FtpSetCurrentDirectoryA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    FtpSetCurrentDirectoryW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    GetUrlCacheConfigInfoA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetUrlCacheConfigInfoW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetUrlCacheEntryInfoA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetUrlCacheEntryInfoExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetUrlCacheEntryInfoExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    GetUrlCacheEntryInfoW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetUrlCacheGroupAttributeA: { args: [FFIType.i64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    GetUrlCacheGroupAttributeW: { args: [FFIType.i64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    HttpAddRequestHeadersA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    HttpAddRequestHeadersW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    HttpEndRequestA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    HttpEndRequestW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    HttpOpenRequestA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u64 },
    HttpOpenRequestW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u64 },
    HttpQueryInfoA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    HttpQueryInfoW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    HttpSendRequestA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    HttpSendRequestExA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    HttpSendRequestExW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    HttpSendRequestW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InternetAttemptConnect: { args: [FFIType.u32], returns: FFIType.u32 },
    InternetAutodial: { args: [FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    InternetAutodialHangup: { args: [FFIType.u32], returns: FFIType.i32 },
    InternetCanonicalizeUrlA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InternetCanonicalizeUrlW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InternetCheckConnectionA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    InternetCheckConnectionW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    InternetClearAllPerSiteCookieDecisions: { args: [], returns: FFIType.i32 },
    InternetCloseHandle: { args: [FFIType.u64], returns: FFIType.i32 },
    InternetCombineUrlA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InternetCombineUrlW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InternetConfirmZoneCrossing: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    InternetConfirmZoneCrossingA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    InternetConfirmZoneCrossingW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32], returns: FFIType.u32 },
    InternetConnectA: { args: [FFIType.u64, FFIType.ptr, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u64 },
    InternetConnectW: { args: [FFIType.u64, FFIType.ptr, FFIType.u16, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u64 },
    InternetCrackUrlA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InternetCrackUrlW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InternetCreateUrlA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InternetCreateUrlW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InternetDial: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    InternetDialA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    InternetDialW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.u32 },
    InternetEnumPerSiteCookieDecisionA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InternetEnumPerSiteCookieDecisionW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InternetErrorDlg: { args: [FFIType.u64, FFIType.u64, FFIType.u32, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    InternetFindNextFileA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    InternetFindNextFileW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    InternetFreeCookies: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.void },
    InternetFreeProxyInfoList: { args: [FFIType.ptr], returns: FFIType.void },
    InternetGetConnectedState: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InternetGetConnectedStateEx: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    InternetGetConnectedStateExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    InternetGetConnectedStateExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    InternetGetCookieA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InternetGetCookieEx2: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.u32 },
    InternetGetCookieExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InternetGetCookieExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InternetGetCookieW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InternetGetLastResponseInfoA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InternetGetLastResponseInfoW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InternetGetPerSiteCookieDecisionA: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InternetGetPerSiteCookieDecisionW: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InternetGetProxyForUrl: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InternetGoOnline: { args: [FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    InternetGoOnlineA: { args: [FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    InternetGoOnlineW: { args: [FFIType.ptr, FFIType.u64, FFIType.u32], returns: FFIType.i32 },
    InternetHangUp: { args: [FFIType.u64, FFIType.u32], returns: FFIType.u32 },
    InternetLockRequestFile: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
    InternetOpenA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    InternetOpenUrlA: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u64 },
    InternetOpenUrlW: { args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u32, FFIType.u64], returns: FFIType.u64 },
    InternetOpenW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.u64 },
    InternetQueryDataAvailable: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    InternetQueryOptionA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InternetQueryOptionW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InternetReadFile: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    InternetReadFileExA: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    InternetReadFileExW: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.i32 },
    InternetSetCookieA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InternetSetCookieEx2: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.u32 },
    InternetSetCookieExA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    InternetSetCookieExW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    InternetSetCookieW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    InternetSetDialState: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    InternetSetDialStateA: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    InternetSetDialStateW: { args: [FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.u32 },
    InternetSetFilePointer: { args: [FFIType.u64, FFIType.i32, FFIType.ptr, FFIType.u32, FFIType.u64], returns: FFIType.u32 },
    InternetSetOptionA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InternetSetOptionExA: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    InternetSetOptionExW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    InternetSetOptionW: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InternetSetPerSiteCookieDecisionA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InternetSetPerSiteCookieDecisionW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InternetSetStatusCallback: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    InternetSetStatusCallbackA: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    InternetSetStatusCallbackW: { args: [FFIType.u64, FFIType.ptr], returns: FFIType.ptr },
    InternetTimeFromSystemTime: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InternetTimeFromSystemTimeA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InternetTimeFromSystemTimeW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InternetTimeToSystemTime: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InternetTimeToSystemTimeA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InternetTimeToSystemTimeW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    InternetUnlockRequestFile: { args: [FFIType.u64], returns: FFIType.i32 },
    InternetWriteFile: { args: [FFIType.u64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    IsUrlCacheEntryExpiredA: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    IsUrlCacheEntryExpiredW: { args: [FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    ReadUrlCacheEntryStream: { args: [FFIType.u64, FFIType.u32, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    ReadUrlCacheEntryStreamEx: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    RegisterUrlCacheNotification: { args: [FFIType.u64, FFIType.u32, FFIType.i64, FFIType.u32, FFIType.u32], returns: FFIType.i32 },
    RetrieveUrlCacheEntryFileA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RetrieveUrlCacheEntryFileW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    RetrieveUrlCacheEntryStreamA: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u32], returns: FFIType.u64 },
    RetrieveUrlCacheEntryStreamW: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.u32], returns: FFIType.u64 },
    SetUrlCacheConfigInfoA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetUrlCacheConfigInfoW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetUrlCacheEntryGroup: { args: [FFIType.ptr, FFIType.u32, FFIType.i64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetUrlCacheEntryGroupA: { args: [FFIType.ptr, FFIType.u32, FFIType.i64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetUrlCacheEntryGroupW: { args: [FFIType.ptr, FFIType.u32, FFIType.i64, FFIType.ptr, FFIType.u32, FFIType.ptr], returns: FFIType.i32 },
    SetUrlCacheEntryInfoA: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetUrlCacheEntryInfoW: { args: [FFIType.ptr, FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    SetUrlCacheGroupAttributeA: { args: [FFIType.i64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    SetUrlCacheGroupAttributeW: { args: [FFIType.i64, FFIType.u32, FFIType.u32, FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    UnlockUrlCacheEntryFile: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UnlockUrlCacheEntryFileA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UnlockUrlCacheEntryFileW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
    UnlockUrlCacheEntryStream: { args: [FFIType.u64, FFIType.u32], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-commiturlcacheentrya
  public static CommitUrlCacheEntryA(
    lpszUrlName: LPCSTR,
    lpszLocalFileName: LPCSTR | NULL,
    ExpireTime: PACKED_FILETIME,
    LastModifiedTime: PACKED_FILETIME,
    CacheEntryType: DWORD,
    lpHeaderInfo: LPBYTE | NULL,
    cchHeaderInfo: DWORD,
    lpszFileExtension: LPCSTR | NULL,
    lpszOriginalUrl: LPCSTR | NULL,
  ): BOOL {
    return Wininet.Load('CommitUrlCacheEntryA')(lpszUrlName, lpszLocalFileName, ExpireTime, LastModifiedTime, CacheEntryType, lpHeaderInfo, cchHeaderInfo, lpszFileExtension, lpszOriginalUrl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-commiturlcacheentryw
  public static CommitUrlCacheEntryW(
    lpszUrlName: LPCWSTR,
    lpszLocalFileName: LPCWSTR | NULL,
    ExpireTime: PACKED_FILETIME,
    LastModifiedTime: PACKED_FILETIME,
    CacheEntryType: DWORD,
    lpszHeaderInfo: LPWSTR | NULL,
    cchHeaderInfo: DWORD,
    lpszFileExtension: LPCWSTR | NULL,
    lpszOriginalUrl: LPCWSTR | NULL,
  ): BOOL {
    return Wininet.Load('CommitUrlCacheEntryW')(lpszUrlName, lpszLocalFileName, ExpireTime, LastModifiedTime, CacheEntryType, lpszHeaderInfo, cchHeaderInfo, lpszFileExtension, lpszOriginalUrl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-createurlcachecontainera
  public static CreateUrlCacheContainerA(Name: LPCSTR, lpCachePrefix: LPCSTR, lpszCachePath: LPCSTR | NULL, KBCacheLimit: DWORD, dwContainerType: DWORD, dwOptions: DWORD, pvBuffer: LPVOID | NULL, cbBuffer: LPDWORD | NULL): BOOL {
    return Wininet.Load('CreateUrlCacheContainerA')(Name, lpCachePrefix, lpszCachePath, KBCacheLimit, dwContainerType, dwOptions, pvBuffer, cbBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-createurlcachecontainerw
  public static CreateUrlCacheContainerW(Name: LPCWSTR, lpCachePrefix: LPCWSTR, lpszCachePath: LPCWSTR | NULL, KBCacheLimit: DWORD, dwContainerType: DWORD, dwOptions: DWORD, pvBuffer: LPVOID | NULL, cbBuffer: LPDWORD | NULL): BOOL {
    return Wininet.Load('CreateUrlCacheContainerW')(Name, lpCachePrefix, lpszCachePath, KBCacheLimit, dwContainerType, dwOptions, pvBuffer, cbBuffer);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-createurlcacheentrya
  public static CreateUrlCacheEntryA(lpszUrlName: LPCSTR, dwExpectedFileSize: DWORD, lpszFileExtension: LPCSTR | NULL, lpszFileName: LPSTR, dwReserved: DWORD): BOOL {
    return Wininet.Load('CreateUrlCacheEntryA')(lpszUrlName, dwExpectedFileSize, lpszFileExtension, lpszFileName, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-createurlcacheentryw
  public static CreateUrlCacheEntryW(lpszUrlName: LPCWSTR, dwExpectedFileSize: DWORD, lpszFileExtension: LPCWSTR | NULL, lpszFileName: LPWSTR, dwReserved: DWORD): BOOL {
    return Wininet.Load('CreateUrlCacheEntryW')(lpszUrlName, dwExpectedFileSize, lpszFileExtension, lpszFileName, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-createurlcachegroup
  public static CreateUrlCacheGroup(dwFlags: DWORD, lpReserved: LPVOID | NULL): GROUPID {
    return Wininet.Load('CreateUrlCacheGroup')(dwFlags, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-deleteurlcachecontainera
  public static DeleteUrlCacheContainerA(Name: LPCSTR, dwOptions: DWORD): BOOL {
    return Wininet.Load('DeleteUrlCacheContainerA')(Name, dwOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-deleteurlcachecontainerw
  public static DeleteUrlCacheContainerW(Name: LPCWSTR, dwOptions: DWORD): BOOL {
    return Wininet.Load('DeleteUrlCacheContainerW')(Name, dwOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-deleteurlcacheentry
  public static DeleteUrlCacheEntry(lpszUrlName: LPCSTR): BOOL {
    return Wininet.Load('DeleteUrlCacheEntry')(lpszUrlName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-deleteurlcacheentry
  public static DeleteUrlCacheEntryA(lpszUrlName: LPCSTR): BOOL {
    return Wininet.Load('DeleteUrlCacheEntryA')(lpszUrlName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-deleteurlcacheentry
  public static DeleteUrlCacheEntryW(lpszUrlName: LPCWSTR): BOOL {
    return Wininet.Load('DeleteUrlCacheEntryW')(lpszUrlName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-deleteurlcachegroup
  public static DeleteUrlCacheGroup(GroupId: GROUPID, dwFlags: DWORD, lpReserved: LPVOID | NULL): BOOL {
    return Wininet.Load('DeleteUrlCacheGroup')(GroupId, dwFlags, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-detectautoproxyurl
  public static DetectAutoProxyUrl(pszAutoProxyUrl: LPSTR, cchAutoProxyUrl: DWORD, dwDetectFlags: DWORD): BOOL {
    return Wininet.Load('DetectAutoProxyUrl')(pszAutoProxyUrl, cchAutoProxyUrl, dwDetectFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-findcloseurlcache
  public static FindCloseUrlCache(hEnumHandle: HANDLE): BOOL {
    return Wininet.Load('FindCloseUrlCache')(hEnumHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-findfirsturlcachecontainera
  public static FindFirstUrlCacheContainerA(pdwModified: LPDWORD | NULL, lpContainerInfo: LPINTERNET_CACHE_CONTAINER_INFOA, lpcbContainerInfo: LPDWORD, dwOptions: DWORD): HANDLE {
    return Wininet.Load('FindFirstUrlCacheContainerA')(pdwModified, lpContainerInfo, lpcbContainerInfo, dwOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-findfirsturlcachecontainerw
  public static FindFirstUrlCacheContainerW(pdwModified: LPDWORD | NULL, lpContainerInfo: LPINTERNET_CACHE_CONTAINER_INFOW, lpcbContainerInfo: LPDWORD, dwOptions: DWORD): HANDLE {
    return Wininet.Load('FindFirstUrlCacheContainerW')(pdwModified, lpContainerInfo, lpcbContainerInfo, dwOptions);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-findfirsturlcacheentrya
  public static FindFirstUrlCacheEntryA(lpszUrlSearchPattern: LPCSTR | NULL, lpFirstCacheEntryInfo: LPINTERNET_CACHE_ENTRY_INFOA | NULL, lpcbCacheEntryInfo: LPDWORD): HANDLE {
    return Wininet.Load('FindFirstUrlCacheEntryA')(lpszUrlSearchPattern, lpFirstCacheEntryInfo, lpcbCacheEntryInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-findfirsturlcacheentryexa
  public static FindFirstUrlCacheEntryExA(
    lpszUrlSearchPattern: LPCSTR | NULL,
    dwFlags: DWORD,
    dwFilter: DWORD,
    GroupId: GROUPID,
    lpFirstCacheEntryInfo: LPINTERNET_CACHE_ENTRY_INFOA | NULL,
    lpcbCacheEntryInfo: LPDWORD,
    lpGroupAttributes: LPVOID | NULL,
    lpcbGroupAttributes: LPDWORD | NULL,
    lpReserved: LPVOID | NULL,
  ): HANDLE {
    return Wininet.Load('FindFirstUrlCacheEntryExA')(lpszUrlSearchPattern, dwFlags, dwFilter, GroupId, lpFirstCacheEntryInfo, lpcbCacheEntryInfo, lpGroupAttributes, lpcbGroupAttributes, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-findfirsturlcacheentryexw
  public static FindFirstUrlCacheEntryExW(
    lpszUrlSearchPattern: LPCWSTR | NULL,
    dwFlags: DWORD,
    dwFilter: DWORD,
    GroupId: GROUPID,
    lpFirstCacheEntryInfo: LPINTERNET_CACHE_ENTRY_INFOW | NULL,
    lpcbCacheEntryInfo: LPDWORD,
    lpGroupAttributes: LPVOID | NULL,
    lpcbGroupAttributes: LPDWORD | NULL,
    lpReserved: LPVOID | NULL,
  ): HANDLE {
    return Wininet.Load('FindFirstUrlCacheEntryExW')(lpszUrlSearchPattern, dwFlags, dwFilter, GroupId, lpFirstCacheEntryInfo, lpcbCacheEntryInfo, lpGroupAttributes, lpcbGroupAttributes, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-findfirsturlcacheentryw
  public static FindFirstUrlCacheEntryW(lpszUrlSearchPattern: LPCWSTR | NULL, lpFirstCacheEntryInfo: LPINTERNET_CACHE_ENTRY_INFOW | NULL, lpcbCacheEntryInfo: LPDWORD): HANDLE {
    return Wininet.Load('FindFirstUrlCacheEntryW')(lpszUrlSearchPattern, lpFirstCacheEntryInfo, lpcbCacheEntryInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-findfirsturlcachegroup
  public static FindFirstUrlCacheGroup(dwFlags: DWORD, dwFilter: DWORD, lpSearchCondition: LPVOID | NULL, dwSearchCondition: DWORD, lpGroupId: LPGROUPID, lpReserved: LPVOID | NULL): HANDLE {
    return Wininet.Load('FindFirstUrlCacheGroup')(dwFlags, dwFilter, lpSearchCondition, dwSearchCondition, lpGroupId, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-findnexturlcachecontainera
  public static FindNextUrlCacheContainerA(hEnumHandle: HANDLE, lpContainerInfo: LPINTERNET_CACHE_CONTAINER_INFOA, lpcbContainerInfo: LPDWORD): BOOL {
    return Wininet.Load('FindNextUrlCacheContainerA')(hEnumHandle, lpContainerInfo, lpcbContainerInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-findnexturlcachecontainerw
  public static FindNextUrlCacheContainerW(hEnumHandle: HANDLE, lpContainerInfo: LPINTERNET_CACHE_CONTAINER_INFOW, lpcbContainerInfo: LPDWORD): BOOL {
    return Wininet.Load('FindNextUrlCacheContainerW')(hEnumHandle, lpContainerInfo, lpcbContainerInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-findnexturlcacheentrya
  public static FindNextUrlCacheEntryA(hEnumHandle: HANDLE, lpNextCacheEntryInfo: LPINTERNET_CACHE_ENTRY_INFOA | NULL, lpcbCacheEntryInfo: LPDWORD): BOOL {
    return Wininet.Load('FindNextUrlCacheEntryA')(hEnumHandle, lpNextCacheEntryInfo, lpcbCacheEntryInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-findnexturlcacheentryexa
  public static FindNextUrlCacheEntryExA(
    hEnumHandle: HANDLE,
    lpNextCacheEntryInfo: LPINTERNET_CACHE_ENTRY_INFOA | NULL,
    lpcbCacheEntryInfo: LPDWORD,
    lpGroupAttributes: LPVOID | NULL,
    lpcbGroupAttributes: LPDWORD | NULL,
    lpReserved: LPVOID | NULL,
  ): BOOL {
    return Wininet.Load('FindNextUrlCacheEntryExA')(hEnumHandle, lpNextCacheEntryInfo, lpcbCacheEntryInfo, lpGroupAttributes, lpcbGroupAttributes, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-findnexturlcacheentryexw
  public static FindNextUrlCacheEntryExW(
    hEnumHandle: HANDLE,
    lpNextCacheEntryInfo: LPINTERNET_CACHE_ENTRY_INFOW | NULL,
    lpcbCacheEntryInfo: LPDWORD,
    lpGroupAttributes: LPVOID | NULL,
    lpcbGroupAttributes: LPDWORD | NULL,
    lpReserved: LPVOID | NULL,
  ): BOOL {
    return Wininet.Load('FindNextUrlCacheEntryExW')(hEnumHandle, lpNextCacheEntryInfo, lpcbCacheEntryInfo, lpGroupAttributes, lpcbGroupAttributes, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-findnexturlcacheentryw
  public static FindNextUrlCacheEntryW(hEnumHandle: HANDLE, lpNextCacheEntryInfo: LPINTERNET_CACHE_ENTRY_INFOW | NULL, lpcbCacheEntryInfo: LPDWORD): BOOL {
    return Wininet.Load('FindNextUrlCacheEntryW')(hEnumHandle, lpNextCacheEntryInfo, lpcbCacheEntryInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-findnexturlcachegroup
  public static FindNextUrlCacheGroup(hFind: HANDLE, lpGroupId: LPGROUPID, lpReserved: LPVOID | NULL): BOOL {
    return Wininet.Load('FindNextUrlCacheGroup')(hFind, lpGroupId, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-freeurlcachespacea
  public static FreeUrlCacheSpaceA(lpszCachePath: LPCSTR | NULL, dwSize: DWORD, dwFilter: DWORD): BOOL {
    return Wininet.Load('FreeUrlCacheSpaceA')(lpszCachePath, dwSize, dwFilter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-freeurlcachespacew
  public static FreeUrlCacheSpaceW(lpszCachePath: LPCWSTR | NULL, dwSize: DWORD, dwFilter: DWORD): BOOL {
    return Wininet.Load('FreeUrlCacheSpaceW')(lpszCachePath, dwSize, dwFilter);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftpcommanda
  public static FtpCommandA(hConnect: HINTERNET, fExpectResponse: BOOL, dwFlags: DWORD, lpszCommand: LPCSTR, dwContext: DWORD_PTR | 0n, phFtpCommand: LPHINTERNET | NULL): BOOL {
    return Wininet.Load('FtpCommandA')(hConnect, fExpectResponse, dwFlags, lpszCommand, dwContext, phFtpCommand);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftpcommandw
  public static FtpCommandW(hConnect: HINTERNET, fExpectResponse: BOOL, dwFlags: DWORD, lpszCommand: LPCWSTR, dwContext: DWORD_PTR | 0n, phFtpCommand: LPHINTERNET | NULL): BOOL {
    return Wininet.Load('FtpCommandW')(hConnect, fExpectResponse, dwFlags, lpszCommand, dwContext, phFtpCommand);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftpcreatedirectorya
  public static FtpCreateDirectoryA(hConnect: HINTERNET, lpszDirectory: LPCSTR): BOOL {
    return Wininet.Load('FtpCreateDirectoryA')(hConnect, lpszDirectory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftpcreatedirectoryw
  public static FtpCreateDirectoryW(hConnect: HINTERNET, lpszDirectory: LPCWSTR): BOOL {
    return Wininet.Load('FtpCreateDirectoryW')(hConnect, lpszDirectory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftpdeletefilea
  public static FtpDeleteFileA(hConnect: HINTERNET, lpszFileName: LPCSTR): BOOL {
    return Wininet.Load('FtpDeleteFileA')(hConnect, lpszFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftpdeletefilew
  public static FtpDeleteFileW(hConnect: HINTERNET, lpszFileName: LPCWSTR): BOOL {
    return Wininet.Load('FtpDeleteFileW')(hConnect, lpszFileName);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftpfindfirstfilea
  public static FtpFindFirstFileA(hConnect: HINTERNET, lpszSearchFile: LPCSTR | NULL, lpFindFileData: LPWIN32_FIND_DATAA | NULL, dwFlags: DWORD, dwContext: DWORD_PTR | 0n): HINTERNET {
    return Wininet.Load('FtpFindFirstFileA')(hConnect, lpszSearchFile, lpFindFileData, dwFlags, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftpfindfirstfilew
  public static FtpFindFirstFileW(hConnect: HINTERNET, lpszSearchFile: LPCWSTR | NULL, lpFindFileData: LPWIN32_FIND_DATAW | NULL, dwFlags: DWORD, dwContext: DWORD_PTR | 0n): HINTERNET {
    return Wininet.Load('FtpFindFirstFileW')(hConnect, lpszSearchFile, lpFindFileData, dwFlags, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftpgetcurrentdirectorya
  public static FtpGetCurrentDirectoryA(hConnect: HINTERNET, lpszCurrentDirectory: LPSTR, lpdwCurrentDirectory: LPDWORD): BOOL {
    return Wininet.Load('FtpGetCurrentDirectoryA')(hConnect, lpszCurrentDirectory, lpdwCurrentDirectory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftpgetcurrentdirectoryw
  public static FtpGetCurrentDirectoryW(hConnect: HINTERNET, lpszCurrentDirectory: LPWSTR, lpdwCurrentDirectory: LPDWORD): BOOL {
    return Wininet.Load('FtpGetCurrentDirectoryW')(hConnect, lpszCurrentDirectory, lpdwCurrentDirectory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftpgetfilea
  public static FtpGetFileA(hConnect: HINTERNET, lpszRemoteFile: LPCSTR, lpszNewFile: LPCSTR, fFailIfExists: BOOL, dwFlagsAndAttributes: DWORD, dwFlags: DWORD, dwContext: DWORD_PTR | 0n): BOOL {
    return Wininet.Load('FtpGetFileA')(hConnect, lpszRemoteFile, lpszNewFile, fFailIfExists, dwFlagsAndAttributes, dwFlags, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftpgetfilesize
  public static FtpGetFileSize(hFile: HINTERNET, lpdwFileSizeHigh: LPDWORD | NULL): DWORD {
    return Wininet.Load('FtpGetFileSize')(hFile, lpdwFileSizeHigh);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftpgetfilew
  public static FtpGetFileW(hConnect: HINTERNET, lpszRemoteFile: LPCWSTR, lpszNewFile: LPCWSTR, fFailIfExists: BOOL, dwFlagsAndAttributes: DWORD, dwFlags: DWORD, dwContext: DWORD_PTR | 0n): BOOL {
    return Wininet.Load('FtpGetFileW')(hConnect, lpszRemoteFile, lpszNewFile, fFailIfExists, dwFlagsAndAttributes, dwFlags, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftpopenfilea
  public static FtpOpenFileA(hConnect: HINTERNET, lpszFileName: LPCSTR, dwAccess: DWORD, dwFlags: DWORD, dwContext: DWORD_PTR | 0n): HINTERNET {
    return Wininet.Load('FtpOpenFileA')(hConnect, lpszFileName, dwAccess, dwFlags, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftpopenfilew
  public static FtpOpenFileW(hConnect: HINTERNET, lpszFileName: LPCWSTR, dwAccess: DWORD, dwFlags: DWORD, dwContext: DWORD_PTR | 0n): HINTERNET {
    return Wininet.Load('FtpOpenFileW')(hConnect, lpszFileName, dwAccess, dwFlags, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftpputfilea
  public static FtpPutFileA(hConnect: HINTERNET, lpszLocalFile: LPCSTR, lpszNewRemoteFile: LPCSTR, dwFlags: DWORD, dwContext: DWORD_PTR | 0n): BOOL {
    return Wininet.Load('FtpPutFileA')(hConnect, lpszLocalFile, lpszNewRemoteFile, dwFlags, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftpputfilew
  public static FtpPutFileW(hConnect: HINTERNET, lpszLocalFile: LPCWSTR, lpszNewRemoteFile: LPCWSTR, dwFlags: DWORD, dwContext: DWORD_PTR | 0n): BOOL {
    return Wininet.Load('FtpPutFileW')(hConnect, lpszLocalFile, lpszNewRemoteFile, dwFlags, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftpremovedirectorya
  public static FtpRemoveDirectoryA(hConnect: HINTERNET, lpszDirectory: LPCSTR): BOOL {
    return Wininet.Load('FtpRemoveDirectoryA')(hConnect, lpszDirectory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftpremovedirectoryw
  public static FtpRemoveDirectoryW(hConnect: HINTERNET, lpszDirectory: LPCWSTR): BOOL {
    return Wininet.Load('FtpRemoveDirectoryW')(hConnect, lpszDirectory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftprenamefilea
  public static FtpRenameFileA(hConnect: HINTERNET, lpszExisting: LPCSTR, lpszNew: LPCSTR): BOOL {
    return Wininet.Load('FtpRenameFileA')(hConnect, lpszExisting, lpszNew);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftprenamefilew
  public static FtpRenameFileW(hConnect: HINTERNET, lpszExisting: LPCWSTR, lpszNew: LPCWSTR): BOOL {
    return Wininet.Load('FtpRenameFileW')(hConnect, lpszExisting, lpszNew);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftpsetcurrentdirectorya
  public static FtpSetCurrentDirectoryA(hConnect: HINTERNET, lpszDirectory: LPCSTR): BOOL {
    return Wininet.Load('FtpSetCurrentDirectoryA')(hConnect, lpszDirectory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-ftpsetcurrentdirectoryw
  public static FtpSetCurrentDirectoryW(hConnect: HINTERNET, lpszDirectory: LPCWSTR): BOOL {
    return Wininet.Load('FtpSetCurrentDirectoryW')(hConnect, lpszDirectory);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-geturlcacheconfiginfoa
  public static GetUrlCacheConfigInfoA(lpCacheConfigInfo: LPINTERNET_CACHE_CONFIG_INFOA, lpcbCacheConfigInfo: LPDWORD | NULL, dwFieldControl: DWORD): BOOL {
    return Wininet.Load('GetUrlCacheConfigInfoA')(lpCacheConfigInfo, lpcbCacheConfigInfo, dwFieldControl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-geturlcacheconfiginfow
  public static GetUrlCacheConfigInfoW(lpCacheConfigInfo: LPINTERNET_CACHE_CONFIG_INFOW, lpcbCacheConfigInfo: LPDWORD | NULL, dwFieldControl: DWORD): BOOL {
    return Wininet.Load('GetUrlCacheConfigInfoW')(lpCacheConfigInfo, lpcbCacheConfigInfo, dwFieldControl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-geturlcacheentryinfoa
  public static GetUrlCacheEntryInfoA(lpszUrlName: LPCSTR, lpCacheEntryInfo: LPINTERNET_CACHE_ENTRY_INFOA | NULL, lpcbCacheEntryInfo: LPDWORD | NULL): BOOL {
    return Wininet.Load('GetUrlCacheEntryInfoA')(lpszUrlName, lpCacheEntryInfo, lpcbCacheEntryInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-geturlcacheentryinfoexa
  public static GetUrlCacheEntryInfoExA(
    lpszUrl: LPCSTR,
    lpCacheEntryInfo: LPINTERNET_CACHE_ENTRY_INFOA | NULL,
    lpcbCacheEntryInfo: LPDWORD | NULL,
    lpszRedirectUrl: LPSTR | NULL,
    lpcbRedirectUrl: LPDWORD | NULL,
    lpReserved: LPVOID | NULL,
    dwFlags: DWORD,
  ): BOOL {
    return Wininet.Load('GetUrlCacheEntryInfoExA')(lpszUrl, lpCacheEntryInfo, lpcbCacheEntryInfo, lpszRedirectUrl, lpcbRedirectUrl, lpReserved, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-geturlcacheentryinfoexw
  public static GetUrlCacheEntryInfoExW(
    lpszUrl: LPCWSTR,
    lpCacheEntryInfo: LPINTERNET_CACHE_ENTRY_INFOW | NULL,
    lpcbCacheEntryInfo: LPDWORD | NULL,
    lpszRedirectUrl: LPWSTR | NULL,
    lpcbRedirectUrl: LPDWORD | NULL,
    lpReserved: LPVOID | NULL,
    dwFlags: DWORD,
  ): BOOL {
    return Wininet.Load('GetUrlCacheEntryInfoExW')(lpszUrl, lpCacheEntryInfo, lpcbCacheEntryInfo, lpszRedirectUrl, lpcbRedirectUrl, lpReserved, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-geturlcacheentryinfow
  public static GetUrlCacheEntryInfoW(lpszUrlName: LPCWSTR, lpCacheEntryInfo: LPINTERNET_CACHE_ENTRY_INFOW | NULL, lpcbCacheEntryInfo: LPDWORD | NULL): BOOL {
    return Wininet.Load('GetUrlCacheEntryInfoW')(lpszUrlName, lpCacheEntryInfo, lpcbCacheEntryInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-geturlcachegroupattributea
  public static GetUrlCacheGroupAttributeA(gid: GROUPID, dwFlags: DWORD, dwAttributes: DWORD, lpGroupInfo: LPINTERNET_CACHE_GROUP_INFOA, lpcbGroupInfo: LPDWORD, lpReserved: LPVOID | NULL): BOOL {
    return Wininet.Load('GetUrlCacheGroupAttributeA')(gid, dwFlags, dwAttributes, lpGroupInfo, lpcbGroupInfo, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-geturlcachegroupattributew
  public static GetUrlCacheGroupAttributeW(gid: GROUPID, dwFlags: DWORD, dwAttributes: DWORD, lpGroupInfo: LPINTERNET_CACHE_GROUP_INFOW, lpcbGroupInfo: LPDWORD, lpReserved: LPVOID | NULL): BOOL {
    return Wininet.Load('GetUrlCacheGroupAttributeW')(gid, dwFlags, dwAttributes, lpGroupInfo, lpcbGroupInfo, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-httpaddrequestheadersa
  public static HttpAddRequestHeadersA(hRequest: HINTERNET, lpszHeaders: LPCSTR, dwHeadersLength: DWORD, dwModifiers: DWORD): BOOL {
    return Wininet.Load('HttpAddRequestHeadersA')(hRequest, lpszHeaders, dwHeadersLength, dwModifiers);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-httpaddrequestheadersw
  public static HttpAddRequestHeadersW(hRequest: HINTERNET, lpszHeaders: LPCWSTR, dwHeadersLength: DWORD, dwModifiers: DWORD): BOOL {
    return Wininet.Load('HttpAddRequestHeadersW')(hRequest, lpszHeaders, dwHeadersLength, dwModifiers);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-httpendrequesta
  public static HttpEndRequestA(hRequest: HINTERNET, lpBuffersOut: LPINTERNET_BUFFERSA | NULL, dwFlags: DWORD, dwContext: DWORD_PTR | 0n): BOOL {
    return Wininet.Load('HttpEndRequestA')(hRequest, lpBuffersOut, dwFlags, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-httpendrequestw
  public static HttpEndRequestW(hRequest: HINTERNET, lpBuffersOut: LPINTERNET_BUFFERSW | NULL, dwFlags: DWORD, dwContext: DWORD_PTR | 0n): BOOL {
    return Wininet.Load('HttpEndRequestW')(hRequest, lpBuffersOut, dwFlags, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-httpopenrequesta
  public static HttpOpenRequestA(
    hConnect: HINTERNET,
    lpszVerb: LPCSTR | NULL,
    lpszObjectName: LPCSTR | NULL,
    lpszVersion: LPCSTR | NULL,
    lpszReferrer: LPCSTR | NULL,
    lplpszAcceptTypes: LPVOID | NULL,
    dwFlags: DWORD,
    dwContext: DWORD_PTR | 0n,
  ): HINTERNET {
    return Wininet.Load('HttpOpenRequestA')(hConnect, lpszVerb, lpszObjectName, lpszVersion, lpszReferrer, lplpszAcceptTypes, dwFlags, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-httpopenrequestw
  public static HttpOpenRequestW(
    hConnect: HINTERNET,
    lpszVerb: LPCWSTR | NULL,
    lpszObjectName: LPCWSTR | NULL,
    lpszVersion: LPCWSTR | NULL,
    lpszReferrer: LPCWSTR | NULL,
    lplpszAcceptTypes: LPVOID | NULL,
    dwFlags: DWORD,
    dwContext: DWORD_PTR | 0n,
  ): HINTERNET {
    return Wininet.Load('HttpOpenRequestW')(hConnect, lpszVerb, lpszObjectName, lpszVersion, lpszReferrer, lplpszAcceptTypes, dwFlags, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-httpqueryinfoa
  public static HttpQueryInfoA(hRequest: HINTERNET, dwInfoLevel: DWORD, lpBuffer: LPVOID | NULL, lpdwBufferLength: LPDWORD, lpdwIndex: LPDWORD | NULL): BOOL {
    return Wininet.Load('HttpQueryInfoA')(hRequest, dwInfoLevel, lpBuffer, lpdwBufferLength, lpdwIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-httpqueryinfow
  public static HttpQueryInfoW(hRequest: HINTERNET, dwInfoLevel: DWORD, lpBuffer: LPVOID | NULL, lpdwBufferLength: LPDWORD, lpdwIndex: LPDWORD | NULL): BOOL {
    return Wininet.Load('HttpQueryInfoW')(hRequest, dwInfoLevel, lpBuffer, lpdwBufferLength, lpdwIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-httpsendrequesta
  public static HttpSendRequestA(hRequest: HINTERNET, lpszHeaders: LPCSTR | NULL, dwHeadersLength: DWORD, lpOptional: LPVOID | NULL, dwOptionalLength: DWORD): BOOL {
    return Wininet.Load('HttpSendRequestA')(hRequest, lpszHeaders, dwHeadersLength, lpOptional, dwOptionalLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-httpsendrequestexa
  public static HttpSendRequestExA(hRequest: HINTERNET, lpBuffersIn: LPINTERNET_BUFFERSA | NULL, lpBuffersOut: LPINTERNET_BUFFERSA | NULL, dwFlags: DWORD, dwContext: DWORD_PTR | 0n): BOOL {
    return Wininet.Load('HttpSendRequestExA')(hRequest, lpBuffersIn, lpBuffersOut, dwFlags, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-httpsendrequestexw
  public static HttpSendRequestExW(hRequest: HINTERNET, lpBuffersIn: LPINTERNET_BUFFERSW | NULL, lpBuffersOut: LPINTERNET_BUFFERSW | NULL, dwFlags: DWORD, dwContext: DWORD_PTR | 0n): BOOL {
    return Wininet.Load('HttpSendRequestExW')(hRequest, lpBuffersIn, lpBuffersOut, dwFlags, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-httpsendrequestw
  public static HttpSendRequestW(hRequest: HINTERNET, lpszHeaders: LPCWSTR | NULL, dwHeadersLength: DWORD, lpOptional: LPVOID | NULL, dwOptionalLength: DWORD): BOOL {
    return Wininet.Load('HttpSendRequestW')(hRequest, lpszHeaders, dwHeadersLength, lpOptional, dwOptionalLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetattemptconnect
  public static InternetAttemptConnect(dwReserved: DWORD): DWORD {
    return Wininet.Load('InternetAttemptConnect')(dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetautodial
  public static InternetAutodial(dwFlags: DWORD, hwndParent: HWND | 0n): BOOL {
    return Wininet.Load('InternetAutodial')(dwFlags, hwndParent);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetautodialhangup
  public static InternetAutodialHangup(dwReserved: DWORD): BOOL {
    return Wininet.Load('InternetAutodialHangup')(dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetcanonicalizeurla
  public static InternetCanonicalizeUrlA(lpszUrl: LPCSTR, lpszBuffer: LPSTR, lpdwBufferLength: LPDWORD, dwFlags: DWORD): BOOL {
    return Wininet.Load('InternetCanonicalizeUrlA')(lpszUrl, lpszBuffer, lpdwBufferLength, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetcanonicalizeurlw
  public static InternetCanonicalizeUrlW(lpszUrl: LPCWSTR, lpszBuffer: LPWSTR, lpdwBufferLength: LPDWORD, dwFlags: DWORD): BOOL {
    return Wininet.Load('InternetCanonicalizeUrlW')(lpszUrl, lpszBuffer, lpdwBufferLength, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetcheckconnectiona
  public static InternetCheckConnectionA(lpszUrl: LPCSTR | NULL, dwFlags: DWORD, dwReserved: DWORD): BOOL {
    return Wininet.Load('InternetCheckConnectionA')(lpszUrl, dwFlags, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetcheckconnectionw
  public static InternetCheckConnectionW(lpszUrl: LPCWSTR | NULL, dwFlags: DWORD, dwReserved: DWORD): BOOL {
    return Wininet.Load('InternetCheckConnectionW')(lpszUrl, dwFlags, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetclearallpersitecookiedecisions
  public static InternetClearAllPerSiteCookieDecisions(): BOOL {
    return Wininet.Load('InternetClearAllPerSiteCookieDecisions')();
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetclosehandle
  public static InternetCloseHandle(hInternet: HINTERNET): BOOL {
    return Wininet.Load('InternetCloseHandle')(hInternet);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetcombineurla
  public static InternetCombineUrlA(lpszBaseUrl: LPCSTR, lpszRelativeUrl: LPCSTR, lpszBuffer: LPSTR | NULL, lpdwBufferLength: LPDWORD, dwFlags: DWORD): BOOL {
    return Wininet.Load('InternetCombineUrlA')(lpszBaseUrl, lpszRelativeUrl, lpszBuffer, lpdwBufferLength, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetcombineurlw
  public static InternetCombineUrlW(lpszBaseUrl: LPCWSTR, lpszRelativeUrl: LPCWSTR, lpszBuffer: LPWSTR | NULL, lpdwBufferLength: LPDWORD, dwFlags: DWORD): BOOL {
    return Wininet.Load('InternetCombineUrlW')(lpszBaseUrl, lpszRelativeUrl, lpszBuffer, lpdwBufferLength, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetconfirmzonecrossing
  public static InternetConfirmZoneCrossing(hWnd: HWND, szUrlPrev: LPSTR, szUrlNew: LPSTR, bPost: BOOL): DWORD {
    return Wininet.Load('InternetConfirmZoneCrossing')(hWnd, szUrlPrev, szUrlNew, bPost);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetconfirmzonecrossinga
  public static InternetConfirmZoneCrossingA(hWnd: HWND, szUrlPrev: LPSTR, szUrlNew: LPSTR, bPost: BOOL): DWORD {
    return Wininet.Load('InternetConfirmZoneCrossingA')(hWnd, szUrlPrev, szUrlNew, bPost);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetconfirmzonecrossingw
  public static InternetConfirmZoneCrossingW(hWnd: HWND, szUrlPrev: LPWSTR, szUrlNew: LPWSTR, bPost: BOOL): DWORD {
    return Wininet.Load('InternetConfirmZoneCrossingW')(hWnd, szUrlPrev, szUrlNew, bPost);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetconnecta
  public static InternetConnectA(hInternet: HINTERNET, lpszServerName: LPCSTR, nServerPort: INTERNET_PORT, lpszUserName: LPCSTR | NULL, lpszPassword: LPCSTR | NULL, dwService: DWORD, dwFlags: DWORD, dwContext: DWORD_PTR | 0n): HINTERNET {
    return Wininet.Load('InternetConnectA')(hInternet, lpszServerName, nServerPort, lpszUserName, lpszPassword, dwService, dwFlags, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetconnectw
  public static InternetConnectW(
    hInternet: HINTERNET,
    lpszServerName: LPCWSTR,
    nServerPort: INTERNET_PORT,
    lpszUserName: LPCWSTR | NULL,
    lpszPassword: LPCWSTR | NULL,
    dwService: DWORD,
    dwFlags: DWORD,
    dwContext: DWORD_PTR | 0n,
  ): HINTERNET {
    return Wininet.Load('InternetConnectW')(hInternet, lpszServerName, nServerPort, lpszUserName, lpszPassword, dwService, dwFlags, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetcrackurla
  public static InternetCrackUrlA(lpszUrl: LPCSTR, dwUrlLength: DWORD, dwFlags: DWORD, lpUrlComponents: LPURL_COMPONENTSA): BOOL {
    return Wininet.Load('InternetCrackUrlA')(lpszUrl, dwUrlLength, dwFlags, lpUrlComponents);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetcrackurlw
  public static InternetCrackUrlW(lpszUrl: LPCWSTR, dwUrlLength: DWORD, dwFlags: DWORD, lpUrlComponents: LPURL_COMPONENTSW): BOOL {
    return Wininet.Load('InternetCrackUrlW')(lpszUrl, dwUrlLength, dwFlags, lpUrlComponents);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetcreateurla
  public static InternetCreateUrlA(lpUrlComponents: LPURL_COMPONENTSA, dwFlags: DWORD, lpszUrl: LPSTR | NULL, lpdwUrlLength: LPDWORD): BOOL {
    return Wininet.Load('InternetCreateUrlA')(lpUrlComponents, dwFlags, lpszUrl, lpdwUrlLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetcreateurlw
  public static InternetCreateUrlW(lpUrlComponents: LPURL_COMPONENTSW, dwFlags: DWORD, lpszUrl: LPWSTR | NULL, lpdwUrlLength: LPDWORD): BOOL {
    return Wininet.Load('InternetCreateUrlW')(lpUrlComponents, dwFlags, lpszUrl, lpdwUrlLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetdial
  public static InternetDial(hwndParent: HWND | 0n, lpszConnectoid: LPSTR | NULL, dwFlags: DWORD, lpdwConnection: PDWORD, dwReserved: DWORD): DWORD {
    return Wininet.Load('InternetDial')(hwndParent, lpszConnectoid, dwFlags, lpdwConnection, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetdiala
  public static InternetDialA(hwndParent: HWND | 0n, lpszConnectoid: LPSTR | NULL, dwFlags: DWORD, lpdwConnection: PDWORD, dwReserved: DWORD): DWORD {
    return Wininet.Load('InternetDialA')(hwndParent, lpszConnectoid, dwFlags, lpdwConnection, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetdialw
  public static InternetDialW(hwndParent: HWND | 0n, lpszConnectoid: LPWSTR | NULL, dwFlags: DWORD, lpdwConnection: PDWORD, dwReserved: DWORD): DWORD {
    return Wininet.Load('InternetDialW')(hwndParent, lpszConnectoid, dwFlags, lpdwConnection, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetenumpersitecookiedecisiona
  public static InternetEnumPerSiteCookieDecisionA(pszSiteName: LPSTR, pcSiteNameSize: LPDWORD, pdwDecision: LPDWORD, dwIndex: DWORD): BOOL {
    return Wininet.Load('InternetEnumPerSiteCookieDecisionA')(pszSiteName, pcSiteNameSize, pdwDecision, dwIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetenumpersitecookiedecisionw
  public static InternetEnumPerSiteCookieDecisionW(pszSiteName: LPWSTR, pcSiteNameSize: LPDWORD, pdwDecision: LPDWORD, dwIndex: DWORD): BOOL {
    return Wininet.Load('InternetEnumPerSiteCookieDecisionW')(pszSiteName, pcSiteNameSize, pdwDecision, dwIndex);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-interneterrordlg
  public static InternetErrorDlg(hWnd: HWND, hRequest: HINTERNET, dwError: DWORD, dwFlags: DWORD, lppvData: LPVOID | NULL): DWORD {
    return Wininet.Load('InternetErrorDlg')(hWnd, hRequest, dwError, dwFlags, lppvData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetfindnextfilea
  public static InternetFindNextFileA(hFind: HINTERNET, lpvFindData: LPVOID): BOOL {
    return Wininet.Load('InternetFindNextFileA')(hFind, lpvFindData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetfindnextfilew
  public static InternetFindNextFileW(hFind: HINTERNET, lpvFindData: LPVOID): BOOL {
    return Wininet.Load('InternetFindNextFileW')(hFind, lpvFindData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetfreecookies
  public static InternetFreeCookies(pCookies: PINTERNET_COOKIE2, dwCookieCount: DWORD): void {
    return Wininet.Load('InternetFreeCookies')(pCookies, dwCookieCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetfreeproxyinfolist
  public static InternetFreeProxyInfoList(ProxyInfoList: PWININET_PROXY_INFO_LIST): void {
    return Wininet.Load('InternetFreeProxyInfoList')(ProxyInfoList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetgetconnectedstate
  public static InternetGetConnectedState(lpdwFlags: LPDWORD, dwReserved: DWORD): BOOL {
    return Wininet.Load('InternetGetConnectedState')(lpdwFlags, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetgetconnectedstateex
  public static InternetGetConnectedStateEx(lpdwFlags: LPDWORD | NULL, lpszConnectionName: LPSTR | NULL, cchNameLen: DWORD, dwReserved: DWORD): BOOL {
    return Wininet.Load('InternetGetConnectedStateEx')(lpdwFlags, lpszConnectionName, cchNameLen, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetgetconnectedstateexa
  public static InternetGetConnectedStateExA(lpdwFlags: LPDWORD | NULL, lpszConnectionName: LPSTR | NULL, cchNameLen: DWORD, dwReserved: DWORD): BOOL {
    return Wininet.Load('InternetGetConnectedStateExA')(lpdwFlags, lpszConnectionName, cchNameLen, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetgetconnectedstateexw
  public static InternetGetConnectedStateExW(lpdwFlags: LPDWORD | NULL, lpszConnectionName: LPWSTR | NULL, cchNameLen: DWORD, dwReserved: DWORD): BOOL {
    return Wininet.Load('InternetGetConnectedStateExW')(lpdwFlags, lpszConnectionName, cchNameLen, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetgetcookiea
  public static InternetGetCookieA(lpszUrl: LPCSTR, lpszCookieName: LPCSTR | NULL, lpszCookieData: LPSTR | NULL, lpdwSize: LPDWORD): BOOL {
    return Wininet.Load('InternetGetCookieA')(lpszUrl, lpszCookieName, lpszCookieData, lpdwSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetgetcookieex2
  public static InternetGetCookieEx2(pcwszUrl: PCWSTR, pcwszCookieName: PCWSTR | NULL, dwFlags: DWORD, ppCookies: PPINTERNET_COOKIE2, pdwCookieCount: PDWORD): DWORD {
    return Wininet.Load('InternetGetCookieEx2')(pcwszUrl, pcwszCookieName, dwFlags, ppCookies, pdwCookieCount);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetgetcookieexa
  public static InternetGetCookieExA(lpszUrl: LPCSTR, lpszCookieName: LPCSTR | NULL, lpszCookieData: LPSTR | NULL, lpdwSize: LPDWORD, dwFlags: DWORD, lpReserved: LPVOID | NULL): BOOL {
    return Wininet.Load('InternetGetCookieExA')(lpszUrl, lpszCookieName, lpszCookieData, lpdwSize, dwFlags, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetgetcookieexw
  public static InternetGetCookieExW(lpszUrl: LPCWSTR, lpszCookieName: LPCWSTR | NULL, lpszCookieData: LPWSTR | NULL, lpdwSize: LPDWORD, dwFlags: DWORD, lpReserved: LPVOID | NULL): BOOL {
    return Wininet.Load('InternetGetCookieExW')(lpszUrl, lpszCookieName, lpszCookieData, lpdwSize, dwFlags, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetgetcookiew
  public static InternetGetCookieW(lpszUrl: LPCWSTR, lpszCookieName: LPCWSTR | NULL, lpszCookieData: LPWSTR | NULL, lpdwSize: LPDWORD): BOOL {
    return Wininet.Load('InternetGetCookieW')(lpszUrl, lpszCookieName, lpszCookieData, lpdwSize);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetgetlastresponseinfoa
  public static InternetGetLastResponseInfoA(lpdwError: LPDWORD, lpszBuffer: LPSTR | NULL, lpdwBufferLength: LPDWORD): BOOL {
    return Wininet.Load('InternetGetLastResponseInfoA')(lpdwError, lpszBuffer, lpdwBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetgetlastresponseinfow
  public static InternetGetLastResponseInfoW(lpdwError: LPDWORD, lpszBuffer: LPWSTR | NULL, lpdwBufferLength: LPDWORD): BOOL {
    return Wininet.Load('InternetGetLastResponseInfoW')(lpdwError, lpszBuffer, lpdwBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetgetpersitecookiedecisiona
  public static InternetGetPerSiteCookieDecisionA(pchHostName: LPCSTR, pResult: LPDWORD): BOOL {
    return Wininet.Load('InternetGetPerSiteCookieDecisionA')(pchHostName, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetgetpersitecookiedecisionw
  public static InternetGetPerSiteCookieDecisionW(pchHostName: LPCWSTR, pResult: LPDWORD): BOOL {
    return Wininet.Load('InternetGetPerSiteCookieDecisionW')(pchHostName, pResult);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetgetproxyforurl
  public static InternetGetProxyForUrl(hInternet: HINTERNET, lpszUrl: LPCWSTR, pProxyInfoList: PWININET_PROXY_INFO_LIST): BOOL {
    return Wininet.Load('InternetGetProxyForUrl')(hInternet, lpszUrl, pProxyInfoList);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetgoonline
  public static InternetGoOnline(lpszURL: LPSTR | NULL, hwndParent: HWND | 0n, dwReserved: DWORD): BOOL {
    return Wininet.Load('InternetGoOnline')(lpszURL, hwndParent, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetgoonlinea
  public static InternetGoOnlineA(lpszURL: LPSTR | NULL, hwndParent: HWND | 0n, dwReserved: DWORD): BOOL {
    return Wininet.Load('InternetGoOnlineA')(lpszURL, hwndParent, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetgoonlinew
  public static InternetGoOnlineW(lpszURL: LPWSTR | NULL, hwndParent: HWND | 0n, dwReserved: DWORD): BOOL {
    return Wininet.Load('InternetGoOnlineW')(lpszURL, hwndParent, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internethangup
  public static InternetHangUp(dwConnection: DWORD_PTR, dwReserved: DWORD): DWORD {
    return Wininet.Load('InternetHangUp')(dwConnection, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetlockrequestfile
  public static InternetLockRequestFile(hInternet: HINTERNET, lphLockRequestInfo: PHANDLE): BOOL {
    return Wininet.Load('InternetLockRequestFile')(hInternet, lphLockRequestInfo);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetopena
  public static InternetOpenA(lpszAgent: LPCSTR, dwAccessType: DWORD, lpszProxy: LPCSTR | NULL, lpszProxyBypass: LPCSTR | NULL, dwFlags: DWORD): HINTERNET {
    return Wininet.Load('InternetOpenA')(lpszAgent, dwAccessType, lpszProxy, lpszProxyBypass, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetopenurla
  public static InternetOpenUrlA(hInternet: HINTERNET, lpszUrl: LPCSTR, lpszHeaders: LPCSTR | NULL, dwHeadersLength: DWORD, dwFlags: DWORD, dwContext: DWORD_PTR | 0n): HINTERNET {
    return Wininet.Load('InternetOpenUrlA')(hInternet, lpszUrl, lpszHeaders, dwHeadersLength, dwFlags, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetopenurlw
  public static InternetOpenUrlW(hInternet: HINTERNET, lpszUrl: LPCWSTR, lpszHeaders: LPCWSTR | NULL, dwHeadersLength: DWORD, dwFlags: DWORD, dwContext: DWORD_PTR | 0n): HINTERNET {
    return Wininet.Load('InternetOpenUrlW')(hInternet, lpszUrl, lpszHeaders, dwHeadersLength, dwFlags, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetopenw
  public static InternetOpenW(lpszAgent: LPCWSTR, dwAccessType: DWORD, lpszProxy: LPCWSTR | NULL, lpszProxyBypass: LPCWSTR | NULL, dwFlags: DWORD): HINTERNET {
    return Wininet.Load('InternetOpenW')(lpszAgent, dwAccessType, lpszProxy, lpszProxyBypass, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetquerydataavailable
  public static InternetQueryDataAvailable(hFile: HINTERNET, lpdwNumberOfBytesAvailable: LPDWORD | NULL, dwFlags: DWORD, dwContext: DWORD_PTR | 0n): BOOL {
    return Wininet.Load('InternetQueryDataAvailable')(hFile, lpdwNumberOfBytesAvailable, dwFlags, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetqueryoptiona
  public static InternetQueryOptionA(hInternet: HINTERNET | 0n, dwOption: DWORD, lpBuffer: LPVOID | NULL, lpdwBufferLength: LPDWORD): BOOL {
    return Wininet.Load('InternetQueryOptionA')(hInternet, dwOption, lpBuffer, lpdwBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetqueryoptionw
  public static InternetQueryOptionW(hInternet: HINTERNET | 0n, dwOption: DWORD, lpBuffer: LPVOID | NULL, lpdwBufferLength: LPDWORD): BOOL {
    return Wininet.Load('InternetQueryOptionW')(hInternet, dwOption, lpBuffer, lpdwBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetreadfile
  public static InternetReadFile(hFile: HINTERNET, lpBuffer: LPVOID, dwNumberOfBytesToRead: DWORD, lpdwNumberOfBytesRead: LPDWORD): BOOL {
    return Wininet.Load('InternetReadFile')(hFile, lpBuffer, dwNumberOfBytesToRead, lpdwNumberOfBytesRead);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetreadfileexa
  public static InternetReadFileExA(hFile: HINTERNET, lpBuffersOut: LPINTERNET_BUFFERSA, dwFlags: DWORD, dwContext: DWORD_PTR | 0n): BOOL {
    return Wininet.Load('InternetReadFileExA')(hFile, lpBuffersOut, dwFlags, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetreadfileexw
  public static InternetReadFileExW(hFile: HINTERNET, lpBuffersOut: LPINTERNET_BUFFERSW, dwFlags: DWORD, dwContext: DWORD_PTR | 0n): BOOL {
    return Wininet.Load('InternetReadFileExW')(hFile, lpBuffersOut, dwFlags, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetsetcookiea
  public static InternetSetCookieA(lpszUrl: LPCSTR, lpszCookieName: LPCSTR | NULL, lpszCookieData: LPCSTR): BOOL {
    return Wininet.Load('InternetSetCookieA')(lpszUrl, lpszCookieName, lpszCookieData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetsetcookieex2
  public static InternetSetCookieEx2(pcwszUrl: PCWSTR, pCookie: PINTERNET_COOKIE2, pcwszP3PPolicy: PCWSTR | NULL, dwFlags: DWORD, pdwCookieState: PDWORD): DWORD {
    return Wininet.Load('InternetSetCookieEx2')(pcwszUrl, pCookie, pcwszP3PPolicy, dwFlags, pdwCookieState);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetsetcookieexa
  public static InternetSetCookieExA(lpszUrl: LPCSTR, lpszCookieName: LPCSTR | NULL, lpszCookieData: LPCSTR, dwFlags: DWORD, dwReserved: DWORD_PTR | 0n): DWORD {
    return Wininet.Load('InternetSetCookieExA')(lpszUrl, lpszCookieName, lpszCookieData, dwFlags, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetsetcookieexw
  public static InternetSetCookieExW(lpszUrl: LPCWSTR, lpszCookieName: LPCWSTR | NULL, lpszCookieData: LPCWSTR, dwFlags: DWORD, dwReserved: DWORD_PTR | 0n): DWORD {
    return Wininet.Load('InternetSetCookieExW')(lpszUrl, lpszCookieName, lpszCookieData, dwFlags, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetsetcookiew
  public static InternetSetCookieW(lpszUrl: LPCWSTR, lpszCookieName: LPCWSTR | NULL, lpszCookieData: LPCWSTR): BOOL {
    return Wininet.Load('InternetSetCookieW')(lpszUrl, lpszCookieName, lpszCookieData);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetsetdialstate
  public static InternetSetDialState(lpszConnectoid: LPCSTR | NULL, dwState: DWORD, dwReserved: DWORD): DWORD {
    return Wininet.Load('InternetSetDialState')(lpszConnectoid, dwState, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetsetdialstatea
  public static InternetSetDialStateA(lpszConnectoid: LPCSTR | NULL, dwState: DWORD, dwReserved: DWORD): DWORD {
    return Wininet.Load('InternetSetDialStateA')(lpszConnectoid, dwState, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetsetdialstatew
  public static InternetSetDialStateW(lpszConnectoid: LPCWSTR | NULL, dwState: DWORD, dwReserved: DWORD): DWORD {
    return Wininet.Load('InternetSetDialStateW')(lpszConnectoid, dwState, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetsetfilepointer
  public static InternetSetFilePointer(hFile: HINTERNET, lDistanceToMove: LONG, pReserved: LPVOID | NULL, dwMoveContext: DWORD, dwContext: DWORD_PTR | 0n): DWORD {
    return Wininet.Load('InternetSetFilePointer')(hFile, lDistanceToMove, pReserved, dwMoveContext, dwContext);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetsetoptiona
  public static InternetSetOptionA(hInternet: HINTERNET | 0n, dwOption: DWORD, lpBuffer: LPVOID | NULL, dwBufferLength: DWORD): BOOL {
    return Wininet.Load('InternetSetOptionA')(hInternet, dwOption, lpBuffer, dwBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetsetoptionexa
  public static InternetSetOptionExA(hInternet: HINTERNET | 0n, dwOption: DWORD, lpBuffer: LPVOID | NULL, dwBufferLength: DWORD, dwFlags: DWORD): BOOL {
    return Wininet.Load('InternetSetOptionExA')(hInternet, dwOption, lpBuffer, dwBufferLength, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetsetoptionexw
  public static InternetSetOptionExW(hInternet: HINTERNET | 0n, dwOption: DWORD, lpBuffer: LPVOID | NULL, dwBufferLength: DWORD, dwFlags: DWORD): BOOL {
    return Wininet.Load('InternetSetOptionExW')(hInternet, dwOption, lpBuffer, dwBufferLength, dwFlags);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetsetoptionw
  public static InternetSetOptionW(hInternet: HINTERNET | 0n, dwOption: DWORD, lpBuffer: LPVOID | NULL, dwBufferLength: DWORD): BOOL {
    return Wininet.Load('InternetSetOptionW')(hInternet, dwOption, lpBuffer, dwBufferLength);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetsetpersitecookiedecisiona
  public static InternetSetPerSiteCookieDecisionA(pchHostName: LPCSTR, dwDecision: DWORD): BOOL {
    return Wininet.Load('InternetSetPerSiteCookieDecisionA')(pchHostName, dwDecision);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetsetpersitecookiedecisionw
  public static InternetSetPerSiteCookieDecisionW(pchHostName: LPCWSTR, dwDecision: DWORD): BOOL {
    return Wininet.Load('InternetSetPerSiteCookieDecisionW')(pchHostName, dwDecision);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetsetstatuscallback
  public static InternetSetStatusCallback(hInternet: HINTERNET, lpfnInternetCallback: INTERNET_STATUS_CALLBACK | NULL): INTERNET_STATUS_CALLBACK | NULL {
    return Wininet.Load('InternetSetStatusCallback')(hInternet, lpfnInternetCallback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetsetstatuscallbacka
  public static InternetSetStatusCallbackA(hInternet: HINTERNET, lpfnInternetCallback: INTERNET_STATUS_CALLBACK | NULL): INTERNET_STATUS_CALLBACK | NULL {
    return Wininet.Load('InternetSetStatusCallbackA')(hInternet, lpfnInternetCallback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetsetstatuscallbackw
  public static InternetSetStatusCallbackW(hInternet: HINTERNET, lpfnInternetCallback: INTERNET_STATUS_CALLBACK | NULL): INTERNET_STATUS_CALLBACK | NULL {
    return Wininet.Load('InternetSetStatusCallbackW')(hInternet, lpfnInternetCallback);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internettimefromsystemtime
  public static InternetTimeFromSystemTime(pst: PSYSTEMTIME, dwRFC: DWORD, lpszTime: LPSTR, cbTime: DWORD): BOOL {
    return Wininet.Load('InternetTimeFromSystemTime')(pst, dwRFC, lpszTime, cbTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internettimefromsystemtimea
  public static InternetTimeFromSystemTimeA(pst: PSYSTEMTIME, dwRFC: DWORD, lpszTime: LPSTR, cbTime: DWORD): BOOL {
    return Wininet.Load('InternetTimeFromSystemTimeA')(pst, dwRFC, lpszTime, cbTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internettimefromsystemtimew
  public static InternetTimeFromSystemTimeW(pst: PSYSTEMTIME, dwRFC: DWORD, lpszTime: LPWSTR, cbTime: DWORD): BOOL {
    return Wininet.Load('InternetTimeFromSystemTimeW')(pst, dwRFC, lpszTime, cbTime);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internettimetosystemtime
  public static InternetTimeToSystemTime(lpszTime: LPCSTR, pst: PSYSTEMTIME, dwReserved: DWORD): BOOL {
    return Wininet.Load('InternetTimeToSystemTime')(lpszTime, pst, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internettimetosystemtimea
  public static InternetTimeToSystemTimeA(lpszTime: LPCSTR, pst: PSYSTEMTIME, dwReserved: DWORD): BOOL {
    return Wininet.Load('InternetTimeToSystemTimeA')(lpszTime, pst, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internettimetosystemtimew
  public static InternetTimeToSystemTimeW(lpszTime: LPCWSTR, pst: PSYSTEMTIME, dwReserved: DWORD): BOOL {
    return Wininet.Load('InternetTimeToSystemTimeW')(lpszTime, pst, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetunlockrequestfile
  public static InternetUnlockRequestFile(hLockHandle: HANDLE): BOOL {
    return Wininet.Load('InternetUnlockRequestFile')(hLockHandle);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-internetwritefile
  public static InternetWriteFile(hFile: HINTERNET, lpBuffer: LPCVOID, dwNumberOfBytesToWrite: DWORD, lpdwNumberOfBytesWritten: LPDWORD): BOOL {
    return Wininet.Load('InternetWriteFile')(hFile, lpBuffer, dwNumberOfBytesToWrite, lpdwNumberOfBytesWritten);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-isurlcacheentryexpireda
  public static IsUrlCacheEntryExpiredA(lpszUrlName: LPCSTR, dwFlags: DWORD, pftLastModified: PFILETIME): BOOL {
    return Wininet.Load('IsUrlCacheEntryExpiredA')(lpszUrlName, dwFlags, pftLastModified);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-isurlcacheentryexpiredw
  public static IsUrlCacheEntryExpiredW(lpszUrlName: LPCWSTR, dwFlags: DWORD, pftLastModified: PFILETIME): BOOL {
    return Wininet.Load('IsUrlCacheEntryExpiredW')(lpszUrlName, dwFlags, pftLastModified);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-readurlcacheentrystream
  public static ReadUrlCacheEntryStream(hUrlCacheStream: HANDLE, dwLocation: DWORD, lpBuffer: LPVOID, lpdwLen: LPDWORD, Reserved: DWORD): BOOL {
    return Wininet.Load('ReadUrlCacheEntryStream')(hUrlCacheStream, dwLocation, lpBuffer, lpdwLen, Reserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-readurlcacheentrystreamex
  public static ReadUrlCacheEntryStreamEx(hUrlCacheStream: HANDLE, qwLocation: ULONGLONG, lpBuffer: LPVOID, lpdwLen: LPDWORD): BOOL {
    return Wininet.Load('ReadUrlCacheEntryStreamEx')(hUrlCacheStream, qwLocation, lpBuffer, lpdwLen);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-registerurlcachenotification
  public static RegisterUrlCacheNotification(hWnd: HWND | 0n, uMsg: UINT, gid: GROUPID, dwOpsFilter: DWORD, dwReserved: DWORD): BOOL {
    return Wininet.Load('RegisterUrlCacheNotification')(hWnd, uMsg, gid, dwOpsFilter, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-retrieveurlcacheentryfilea
  public static RetrieveUrlCacheEntryFileA(lpszUrlName: LPCSTR, lpCacheEntryInfo: LPINTERNET_CACHE_ENTRY_INFOA | NULL, lpcbCacheEntryInfo: LPDWORD, dwReserved: DWORD): BOOL {
    return Wininet.Load('RetrieveUrlCacheEntryFileA')(lpszUrlName, lpCacheEntryInfo, lpcbCacheEntryInfo, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-retrieveurlcacheentryfilew
  public static RetrieveUrlCacheEntryFileW(lpszUrlName: LPCWSTR, lpCacheEntryInfo: LPINTERNET_CACHE_ENTRY_INFOW | NULL, lpcbCacheEntryInfo: LPDWORD, dwReserved: DWORD): BOOL {
    return Wininet.Load('RetrieveUrlCacheEntryFileW')(lpszUrlName, lpCacheEntryInfo, lpcbCacheEntryInfo, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-retrieveurlcacheentrystreama
  public static RetrieveUrlCacheEntryStreamA(lpszUrlName: LPCSTR, lpCacheEntryInfo: LPINTERNET_CACHE_ENTRY_INFOA | NULL, lpcbCacheEntryInfo: LPDWORD, fRandomRead: BOOL, dwReserved: DWORD): HANDLE {
    return Wininet.Load('RetrieveUrlCacheEntryStreamA')(lpszUrlName, lpCacheEntryInfo, lpcbCacheEntryInfo, fRandomRead, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-retrieveurlcacheentrystreamw
  public static RetrieveUrlCacheEntryStreamW(lpszUrlName: LPCWSTR, lpCacheEntryInfo: LPINTERNET_CACHE_ENTRY_INFOW | NULL, lpcbCacheEntryInfo: LPDWORD, fRandomRead: BOOL, dwReserved: DWORD): HANDLE {
    return Wininet.Load('RetrieveUrlCacheEntryStreamW')(lpszUrlName, lpCacheEntryInfo, lpcbCacheEntryInfo, fRandomRead, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-seturlcacheconfiginfoa
  public static SetUrlCacheConfigInfoA(lpCacheConfigInfo: LPINTERNET_CACHE_CONFIG_INFOA, dwFieldControl: DWORD): BOOL {
    return Wininet.Load('SetUrlCacheConfigInfoA')(lpCacheConfigInfo, dwFieldControl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-seturlcacheconfiginfow
  public static SetUrlCacheConfigInfoW(lpCacheConfigInfo: LPINTERNET_CACHE_CONFIG_INFOW, dwFieldControl: DWORD): BOOL {
    return Wininet.Load('SetUrlCacheConfigInfoW')(lpCacheConfigInfo, dwFieldControl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-seturlcacheentrygroup
  public static SetUrlCacheEntryGroup(lpszUrlName: LPCSTR, dwFlags: DWORD, GroupId: GROUPID, pbGroupAttributes: LPBYTE | NULL, cbGroupAttributes: DWORD, lpReserved: LPVOID | NULL): BOOL {
    return Wininet.Load('SetUrlCacheEntryGroup')(lpszUrlName, dwFlags, GroupId, pbGroupAttributes, cbGroupAttributes, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-seturlcacheentrygroupa
  public static SetUrlCacheEntryGroupA(lpszUrlName: LPCSTR, dwFlags: DWORD, GroupId: GROUPID, pbGroupAttributes: LPBYTE | NULL, cbGroupAttributes: DWORD, lpReserved: LPVOID | NULL): BOOL {
    return Wininet.Load('SetUrlCacheEntryGroupA')(lpszUrlName, dwFlags, GroupId, pbGroupAttributes, cbGroupAttributes, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-seturlcacheentrygroupw
  public static SetUrlCacheEntryGroupW(lpszUrlName: LPCWSTR, dwFlags: DWORD, GroupId: GROUPID, pbGroupAttributes: LPBYTE | NULL, cbGroupAttributes: DWORD, lpReserved: LPVOID | NULL): BOOL {
    return Wininet.Load('SetUrlCacheEntryGroupW')(lpszUrlName, dwFlags, GroupId, pbGroupAttributes, cbGroupAttributes, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-seturlcacheentryinfoa
  public static SetUrlCacheEntryInfoA(lpszUrlName: LPCSTR, lpCacheEntryInfo: LPINTERNET_CACHE_ENTRY_INFOA, dwFieldControl: DWORD): BOOL {
    return Wininet.Load('SetUrlCacheEntryInfoA')(lpszUrlName, lpCacheEntryInfo, dwFieldControl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-seturlcacheentryinfow
  public static SetUrlCacheEntryInfoW(lpszUrlName: LPCWSTR, lpCacheEntryInfo: LPINTERNET_CACHE_ENTRY_INFOW, dwFieldControl: DWORD): BOOL {
    return Wininet.Load('SetUrlCacheEntryInfoW')(lpszUrlName, lpCacheEntryInfo, dwFieldControl);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-seturlcachegroupattributea
  public static SetUrlCacheGroupAttributeA(gid: GROUPID, dwFlags: DWORD, dwAttributes: DWORD, lpGroupInfo: LPINTERNET_CACHE_GROUP_INFOA, lpReserved: LPVOID | NULL): BOOL {
    return Wininet.Load('SetUrlCacheGroupAttributeA')(gid, dwFlags, dwAttributes, lpGroupInfo, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-seturlcachegroupattributew
  public static SetUrlCacheGroupAttributeW(gid: GROUPID, dwFlags: DWORD, dwAttributes: DWORD, lpGroupInfo: LPINTERNET_CACHE_GROUP_INFOW, lpReserved: LPVOID | NULL): BOOL {
    return Wininet.Load('SetUrlCacheGroupAttributeW')(gid, dwFlags, dwAttributes, lpGroupInfo, lpReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-unlockurlcacheentryfile
  public static UnlockUrlCacheEntryFile(lpszUrlName: LPCSTR, dwReserved: DWORD): BOOL {
    return Wininet.Load('UnlockUrlCacheEntryFile')(lpszUrlName, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-unlockurlcacheentryfilea
  public static UnlockUrlCacheEntryFileA(lpszUrlName: LPCSTR, dwReserved: DWORD): BOOL {
    return Wininet.Load('UnlockUrlCacheEntryFileA')(lpszUrlName, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-unlockurlcacheentryfilew
  public static UnlockUrlCacheEntryFileW(lpszUrlName: LPCWSTR, dwReserved: DWORD): BOOL {
    return Wininet.Load('UnlockUrlCacheEntryFileW')(lpszUrlName, dwReserved);
  }

  // https://learn.microsoft.com/en-us/windows/win32/api/wininet/nf-wininet-unlockurlcacheentrystream
  public static UnlockUrlCacheEntryStream(hUrlCacheStream: HANDLE, Reserved: DWORD): BOOL {
    return Wininet.Load('UnlockUrlCacheEntryStream')(hUrlCacheStream, Reserved);
  }
}

export default Wininet;
