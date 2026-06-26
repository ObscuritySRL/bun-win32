# @bun-win32/winhttp

Zero-dependency, zero-overhead Win32 WinHTTP bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/winhttp` exposes the `winhttp.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Winhttp`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `winhttp.dll` (HTTP/HTTPS client, WebSockets, proxy auto-detect, PAC discovery, TLS configuration, and request tracing).
- In-source docs in `structs/Winhttp.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Winhttp.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Winhttp.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/winhttp
```

## Quick Start

```ts
import Winhttp, { WinHttpAccessType, WinHttpFlag, WinHttpQuery } from '@bun-win32/winhttp';

Winhttp.Preload(['WinHttpOpen', 'WinHttpConnect', 'WinHttpOpenRequest', 'WinHttpSendRequest', 'WinHttpReceiveResponse', 'WinHttpQueryHeaders', 'WinHttpReadData', 'WinHttpCloseHandle']);

const agent = Buffer.from('bun-win32/1.0\0', 'utf16le');
const hSession = Winhttp.WinHttpOpen(agent.ptr, WinHttpAccessType.AUTOMATIC_PROXY, null, null, 0);

const host = Buffer.from('learn.microsoft.com\0', 'utf16le');
const hConnect = Winhttp.WinHttpConnect(hSession, host.ptr, 443, 0);

const path = Buffer.from('/en-us/windows/win32/winhttp/about-winhttp\0', 'utf16le');
const hRequest = Winhttp.WinHttpOpenRequest(hConnect, null, path.ptr, null, null, null, WinHttpFlag.SECURE);

Winhttp.WinHttpSendRequest(hRequest, null, 0, null, 0, 0, 0n);
Winhttp.WinHttpReceiveResponse(hRequest, null);

// Read the HTTP status code as a number.
const statusBuf = Buffer.alloc(4);
const lenBuf = Buffer.alloc(4);
lenBuf.writeUInt32LE(4, 0);
Winhttp.WinHttpQueryHeaders(hRequest, WinHttpQuery.STATUS_CODE | 0x2000_0000 /* FLAG_NUMBER */, null, statusBuf.ptr, lenBuf.ptr, null);
console.log('Status:', statusBuf.readUInt32LE(0));

Winhttp.WinHttpCloseHandle(hRequest);
Winhttp.WinHttpCloseHandle(hConnect);
Winhttp.WinHttpCloseHandle(hSession);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:url-radar
bun run example:request-inspector
```

## Notes

- Either rely on lazy binding or call `Winhttp.Preload()`.
- Windows only. Bun runtime required.
- Handles returned by `WinHttpOpen`, `WinHttpConnect`, and `WinHttpOpenRequest` are `HINTERNET` (`bigint`). Always close them with `WinHttpCloseHandle`.
- Strings are UTF-16LE (`LPCWSTR`); allocate them with `Buffer.from('...\0', 'utf16le')` and pass `.ptr`.
- WebSocket support requires Windows 8+ and uses `WinHttpWebSocketCompleteUpgrade` after a request opened with `WinHttpSetOption(..., WINHTTP_OPTION_UPGRADE_TO_WEB_SOCKET, ...)`.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
