# @bun-win32/secur32

Zero-dependency, zero-overhead Win32 Secur32 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/secur32` exposes the `secur32.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Secur32`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `secur32.dll` (SSPI authentication, credential management, security context negotiation, LSA logon sessions, SASL, and more).
- In-source docs in `structs/Secur32.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Secur32.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Secur32.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/secur32
```

## Quick Start

```ts
import Secur32 from '@bun-win32/secur32';

// Optionally bind a subset up-front
Secur32.Preload(['InitSecurityInterfaceW', 'FreeContextBuffer']);

// Get the SSPI function table
const table = Secur32.InitSecurityInterfaceW();
console.log('SSPI function table:', Boolean(table));

// Connect to LSA
const hLsa = Buffer.alloc(8);
const status = Secur32.LsaConnectUntrusted(hLsa.ptr);
console.log('LsaConnectUntrusted:', status);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example              # SSPI function table + LSA connection
```

## Notes

- Either rely on lazy binding or call `Secur32.Preload()`.
- Windows only. Bun runtime required.
