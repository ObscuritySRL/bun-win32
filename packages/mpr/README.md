# @bun-win32/mpr

Zero-dependency, zero-overhead Win32 MPR bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/mpr` exposes the `mpr.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Mpr`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `mpr.dll` (network drive mapping, UNC connections, resource enumeration).
- In-source docs in `structs/Mpr.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Mpr.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Mpr.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/mpr
```

## Quick Start

```ts
import Mpr, { WN_NO_ERROR } from '@bun-win32/mpr';

// Get the current network user
const userBuf = Buffer.alloc(512);
const sizeBuf = Buffer.alloc(4);
sizeBuf.writeUInt32LE(256, 0);

const result = Mpr.WNetGetUserW(null, userBuf.ptr, sizeBuf.ptr);

if (result === WN_NO_ERROR) {
  const user = userBuf.toString('utf16le').replace(/\0.*$/, '');
  console.log(`Network user: ${user}`);
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:net-explorer
bun run example:drive-audit
```

## Notes

- Either rely on lazy binding or call `Mpr.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
