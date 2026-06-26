# @bun-win32/userenv

Zero-dependency, zero-overhead Win32 Userenv bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/userenv` exposes the `userenv.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Userenv`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `userenv.dll` (user profiles, environment blocks, and Group Policy).
- In-source docs in `structs/Userenv.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Userenv.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Userenv.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/userenv
```

## Quick Start

```ts
import Userenv from '@bun-win32/userenv';

// Get the profiles root directory (e.g. C:\Users)
const sizeBuf = Buffer.alloc(4);
sizeBuf.writeUInt32LE(0, 0);
Userenv.GetProfilesDirectoryW(null, sizeBuf.ptr);

const charCount = sizeBuf.readUInt32LE(0);
const pathBuf = Buffer.alloc(charCount * 2);
sizeBuf.writeUInt32LE(charCount, 0);
Userenv.GetProfilesDirectoryW(pathBuf.ptr, sizeBuf.ptr);

const profilesDir = pathBuf.toString('utf16le').replace(/\0.*$/, '');
console.log('Profiles directory:', profilesDir);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:profile-panorama
bun run example:env-block-inspector
```

## Notes

- Either rely on lazy binding or call `Userenv.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
