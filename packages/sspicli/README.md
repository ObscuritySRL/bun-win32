# @bun-win32/sspicli

Zero-dependency, zero-overhead Win32 SSPICLI bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/sspicli` exposes the `sspicli.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `SspiCli`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `sspicli.dll` (SSPI authentication, credential management, security context negotiation, LSA logon sessions, SASL, and more).
- In-source docs in `structs/SspiCli.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`SspiCli.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/SspiCli.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/sspicli
```

## Quick Start

```ts
import SspiCli from '@bun-win32/sspicli';

// Optionally bind a subset up-front
SspiCli.Preload(['GetUserNameExW', 'FreeContextBuffer']);

// Retrieve the current user's SAM-compatible name
const nameBuf = new Uint16Array(256);
const sizeBuf = new Uint32Array(1);
sizeBuf[0] = 256;

const ok = SspiCli.GetUserNameExW(2, nameBuf.ptr, sizeBuf.ptr);

if (ok) {
  console.log(String.fromCharCode(...nameBuf.subarray(0, sizeBuf[0])));
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example              # User name + security package enumeration
```

## Notes

- Either rely on lazy binding or call `SspiCli.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
