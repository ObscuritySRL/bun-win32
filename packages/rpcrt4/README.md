# @bun-win32/rpcrt4

Zero-dependency, zero-overhead Win32 RPCRT4 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/rpcrt4` exposes the `rpcrt4.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Rpcrt4`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `rpcrt4.dll` (UUID generation, RPC client/server, string bindings, endpoint mapping, authentication, error enumeration, and MES pickling).
- In-source docs in `structs/Rpcrt4.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Rpcrt4.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Rpcrt4.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/rpcrt4
```

## Quick Start

```ts
import Rpcrt4 from '@bun-win32/rpcrt4';
import { read, toArrayBuffer, type Pointer } from 'bun:ffi';

// Generate a fresh UUID
const uuid = Buffer.alloc(16);
Rpcrt4.UuidCreate(uuid.ptr!);

// Convert to canonical string form
const stringOut = Buffer.alloc(8);
Rpcrt4.UuidToStringW(uuid.ptr!, stringOut.ptr!);
const strPtr = read.ptr(stringOut.ptr!) as Pointer;
const text = new TextDecoder('utf-16').decode(toArrayBuffer(strPtr, 0, 80)).replace(/\0.*$/, '');
console.log(text); // e.g. 7e8f0c30-1d8a-4b7e-9f12-2c3d4e5f6789

// Free the wide string when done
Rpcrt4.RpcStringFreeW(stringOut.ptr!);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:uuid-cascade
bun run example:rpc-diagnostic
```

## Notes

- Either rely on lazy binding or call `Rpcrt4.Preload()`.
- Windows only. Bun runtime required.
