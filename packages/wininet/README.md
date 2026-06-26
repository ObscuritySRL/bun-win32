# @bun-win32/wininet

Zero-dependency, zero-overhead Win32 WinINet bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/wininet` exposes the `wininet.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Wininet`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

WinINet predates and is distinct from WinHTTP. It is the Internet stack Internet Explorer and the legacy Edge engine were built on. It still exposes things `winhttp` does not: **FTP**, the **persistent URL cache** (`CommitUrlCacheEntry*`, `FindFirstUrlCacheEntry*`), the **IE/Edge-legacy cookie jar** (`InternetGetCookie*`, `InternetSetCookieEx2`), and IE-style **per-site cookie decisions**.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `wininet.dll` — HTTP/HTTPS client, FTP client, persistent URL cache, cookie jar, autodial, proxy/auto-detect, and IE-compatible session options.
- In-source docs in `structs/Wininet.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Wininet.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Wininet.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/wininet
```

## Quick Start

```ts
import Wininet, { InternetOpenType, InternetService, InternetFlag, HttpQuery } from '@bun-win32/wininet';

Wininet.Preload(['InternetOpenW', 'InternetConnectW', 'HttpOpenRequestW', 'HttpSendRequestW', 'HttpQueryInfoW', 'InternetReadFile', 'InternetCloseHandle']);

const agent = Buffer.from('bun-win32/1.0\0', 'utf16le');
const hSession = Wininet.InternetOpenW(agent.ptr!, InternetOpenType.PRECONFIG, null, null, 0);

const host = Buffer.from('learn.microsoft.com\0', 'utf16le');
const hConnect = Wininet.InternetConnectW(hSession, host.ptr!, 443, null, null, InternetService.HTTP, 0, 0n);

const verb = Buffer.from('GET\0', 'utf16le');
const path = Buffer.from('/en-us/windows/win32/wininet/about-wininet\0', 'utf16le');
const hRequest = Wininet.HttpOpenRequestW(hConnect, verb.ptr!, path.ptr!, null, null, null, InternetFlag.SECURE, 0n);

Wininet.HttpSendRequestW(hRequest, null, 0, null, 0);

// Read the HTTP status code as a number.
const statusBuf = Buffer.alloc(4);
const lenBuf = Buffer.alloc(4);
lenBuf.writeUInt32LE(4, 0);
Wininet.HttpQueryInfoW(hRequest, HttpQuery.STATUS_CODE | HttpQuery.FLAG_NUMBER, statusBuf.ptr!, lenBuf.ptr!, null);
console.log('Status:', statusBuf.readUInt32LE(0));

Wininet.InternetCloseHandle(hRequest);
Wininet.InternetCloseHandle(hConnect);
Wininet.InternetCloseHandle(hSession);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:cache-heatmap
bun run example:http-inspector
```

## Notes

- Either rely on lazy binding or call `Wininet.Preload()`.
- Windows only. Bun runtime required.
- Handles returned by `InternetOpenW`, `InternetConnectW`, `HttpOpenRequestW`, `FtpOpenFileW`, and the cache enumerators are `HINTERNET` / `HANDLE` (`bigint`). Always close them with `InternetCloseHandle` (for HINTERNET) or `FindCloseUrlCache` (for URL-cache enumerators).
- Strings are UTF-16LE (`LPCWSTR`); allocate with `Buffer.from('...\0', 'utf16le')` and pass `.ptr`.
- `InternetSetStatusCallback` requires a `JSCallback` whose pointer remains live for the lifetime of the handle. Free it only after `InternetCloseHandle` returns.
- The URL cache APIs operate on the Windows-wide WinINet/IE legacy cache (`%LOCALAPPDATA%\Microsoft\Windows\INetCache`). Modern Chromium-based Edge does not write to it.
- `CommitUrlCacheEntry*` takes `FILETIME` by value; use the `packFILETIME(low, high)` helper from `types/Wininet.ts`.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
