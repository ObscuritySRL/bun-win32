# @bun-win32/ws2_32

Zero-dependency, zero-overhead Win32 WS2_32 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/ws2_32` exposes the `ws2_32.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Ws2_32`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `ws2_32.dll` (BSD sockets, Winsock extensions, DNS resolution, provider catalog, and more).
- In-source docs in `structs/Ws2_32.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Ws2_32.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Ws2_32.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/ws2_32
```

## Quick Start

```ts
import Ws2_32, { AddressFamily, Protocol, SocketType } from '@bun-win32/ws2_32';

// Initialize Winsock
const wsaData = Buffer.alloc(408);
Ws2_32.WSAStartup(0x0202, wsaData.ptr);

// Create a TCP socket
const sock = Ws2_32.socket(AddressFamily.AF_INET, SocketType.SOCK_STREAM, Protocol.IPPROTO_TCP);
console.log('Socket: %s', sock);

// Clean up
Ws2_32.closesocket(sock);
Ws2_32.WSACleanup();
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example              # Winsock TCP socket demo
```

## Notes

- Either rely on lazy binding or call `Ws2_32.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
