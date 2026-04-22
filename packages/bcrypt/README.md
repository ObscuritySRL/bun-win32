# @bun-win32/bcrypt

Zero-dependency, zero-overhead Win32 Bcrypt bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/bcrypt` exposes the `bcrypt.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Bcrypt`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `bcrypt.dll` (CNG primitives: ciphers, hashes, HMAC, PBKDF2, signatures, random bytes, and key agreement).
- In-source docs in `structs/Bcrypt.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Bcrypt.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Bcrypt.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/bcrypt
```

## Quick Start

```ts
import { read } from 'bun:ffi';

import Bcrypt, { BCRYPT_SHA256_ALG_HANDLE } from '@bun-win32/bcrypt';

Bcrypt.Preload(['BCryptCreateHash', 'BCryptDestroyHash', 'BCryptFinishHash', 'BCryptHashData']);

const message = Buffer.from('hello', 'utf8');
const hashHandleBuffer = Buffer.alloc(8);

const created = Bcrypt.BCryptCreateHash(BCRYPT_SHA256_ALG_HANDLE, hashHandleBuffer.ptr!, null, 0, null, 0, 0);
if (created < 0) throw new Error(`BCryptCreateHash failed (0x${(created >>> 0).toString(16)})`);

const hashHandle = BigInt(read.u64(hashHandleBuffer.ptr!, 0));

try {
  const hashed = Bcrypt.BCryptHashData(hashHandle, message.ptr!, message.byteLength, 0);
  if (hashed < 0) throw new Error(`BCryptHashData failed (0x${(hashed >>> 0).toString(16)})`);

  const digest = Buffer.alloc(32);
  const finished = Bcrypt.BCryptFinishHash(hashHandle, digest.ptr!, digest.byteLength, 0);
  if (finished < 0) throw new Error(`BCryptFinishHash failed (0x${(finished >>> 0).toString(16)})`);

  console.log(`SHA-256("hello") = ${digest.toString('hex')}`);
} finally {
  Bcrypt.BCryptDestroyHash(hashHandle);
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:algorithm-inventory
bun run example:secret-capsule
```

## Notes

- Either rely on lazy binding or call `Bcrypt.Preload()`.
- Windows only. Bun runtime required.
