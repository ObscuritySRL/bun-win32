# @bun-win32/shlwapi

Zero-dependency, zero-overhead Win32 SHLWAPI bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/shlwapi` exposes the `shlwapi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Shlwapi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `shlwapi.dll` (paths, strings, URLs, registry, streams, and more).
- In-source docs in `structs/Shlwapi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Shlwapi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Shlwapi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/shlwapi
```

## Quick Start

```ts
import Shlwapi from '@bun-win32/shlwapi';

const encode = (str: string) => Buffer.from(`${str}\0`, 'utf16le');

// Optionally bind a subset up-front
Shlwapi.Preload(['PathFileExistsW', 'StrCmpLogicalW']);

const exists = Shlwapi.PathFileExistsW(encode('C:\\Windows').ptr);
console.log('C:\\Windows exists: %s', exists === 1);

const cmp = Shlwapi.StrCmpLogicalW(encode('file2.txt').ptr, encode('file10.txt').ptr);
console.log('file2.txt < file10.txt: %s', cmp < 0);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example              # Path and string utility demos
```

## Notes

- Either rely on lazy binding or call `Shlwapi.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
