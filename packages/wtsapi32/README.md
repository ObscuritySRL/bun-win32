# @bun-win32/wtsapi32

Zero-dependency, zero-overhead Win32 Wtsapi32 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/wtsapi32` exposes the `wtsapi32.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Wtsapi32`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `wtsapi32.dll` (sessions, processes, virtual channels, remote desktop, and more).
- In-source docs in `structs/Wtsapi32.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Wtsapi32.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Wtsapi32.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/wtsapi32
```

## Quick Start

```ts
import { ptr, read } from 'bun:ffi';
import Wtsapi32, { WTS_CURRENT_SERVER_HANDLE, WTS_INFO_CLASS } from '@bun-win32/wtsapi32';

// Enumerate sessions on the local machine
const ppSessionInfo = Buffer.alloc(8);
const pCount = Buffer.alloc(4);

Wtsapi32.WTSEnumerateSessionsW(WTS_CURRENT_SERVER_HANDLE, 0, 1, ppSessionInfo.ptr, pCount.ptr);
const sessionCount = pCount.readUInt32LE(0);
console.log(`Found ${sessionCount} sessions`);

// Query user name for the current session
const ppBuffer = Buffer.alloc(8);
const pBytes = Buffer.alloc(4);
Wtsapi32.WTSQuerySessionInformationW(
  WTS_CURRENT_SERVER_HANDLE,
  0xFFFFFFFF, // WTS_CURRENT_SESSION
  WTS_INFO_CLASS.WTSUserName,
  ppBuffer.ptr,
  pBytes.ptr,
);
const bufPtr = ppBuffer.readBigUInt64LE(0);
const userName = new TextDecoder('utf-16le')
  .decode(Buffer.from(read.ptr(ptr(bufPtr)!, 0, pBytes.readUInt32LE(0))!))
  .replace(/\0.*$/, '');
console.log(`Current user: ${userName}`);

// Cleanup
Wtsapi32.WTSFreeMemory(ptr(ppSessionInfo.readBigUInt64LE(0))!);
Wtsapi32.WTSFreeMemory(ptr(bufPtr)!);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:session-diagnostic
bun run example:session-monitor
```

## Notes

- Either rely on lazy binding or call `Wtsapi32.Preload()`.
- Windows only. Bun runtime required.
