# @bun-win32/netapi32

Zero-dependency, zero-overhead Win32 NETAPI32 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/netapi32` exposes the `netapi32.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Netapi32`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `netapi32.dll` (users, groups, shares, sessions, servers, workstations, domain joins, WebDAV, DC locator, and more).
- In-source docs in `structs/Netapi32.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Netapi32.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Netapi32.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/netapi32
```

## Quick Start

```ts
import Netapi32, { NERR_Success } from '@bun-win32/netapi32';

// Optionally bind a subset up-front
Netapi32.Preload(['NetWkstaGetInfo', 'NetApiBufferFree']);

// Query workstation info
const buf = Buffer.alloc(8);
const status = Netapi32.NetWkstaGetInfo(null, 100, buf.ptr);

if (status === NERR_Success) {
  console.log('NetWkstaGetInfo succeeded.');
}

Netapi32.NetApiBufferFree(buf.ptr);
```

## Examples

Run the included examples:

```sh
bun run example              # Workstation info + user enumeration
```

## Notes

- Either rely on lazy binding or call `Netapi32.Preload()`.
- Windows only. Bun runtime required.
