# @bun-win32/ncrypt

Zero-dependency, zero-overhead Win32 Ncrypt bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/ncrypt` exposes the `ncrypt.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Ncrypt`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `ncrypt.dll` (CNG key storage, persisted keys, signing, attestation, and DPAPI-NG data protection).
- In-source docs in `structs/Ncrypt.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Ncrypt.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Ncrypt.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/ncrypt
```

## Quick Start

```ts
import { read } from 'bun:ffi';
import Ncrypt, { MS_KEY_STORAGE_PROVIDER, NCRYPT_RSA_ALGORITHM } from '@bun-win32/ncrypt';

// Open the Microsoft Software KSP.
const provBuf = Buffer.alloc(8);
const provName = Buffer.from(MS_KEY_STORAGE_PROVIDER + '\0', 'utf16le');
Ncrypt.NCryptOpenStorageProvider(provBuf.ptr!, provName.ptr!, 0);
const hProv = BigInt(read.u64(provBuf.ptr!, 0));

// Ask whether RSA is supported.
const alg = Buffer.from(NCRYPT_RSA_ALGORITHM + '\0', 'utf16le');
const status = Ncrypt.NCryptIsAlgSupported(hProv, alg.ptr!, 0);
console.log('RSA supported:', status === 0);

Ncrypt.NCryptFreeObject(hProv);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:provider-audit "secret message"
bun run example:rsa-sign-verify
```

## Notes

- Either rely on lazy binding or call `Ncrypt.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
