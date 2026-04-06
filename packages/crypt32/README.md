# @bun-win32/crypt32

Zero-dependency, zero-overhead Win32 Crypt32 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/crypt32` exposes the `crypt32.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Crypt32`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `crypt32.dll` (certificate stores, certificate chains, encoding/decoding, data protection, signing, and more).
- In-source docs in `structs/Crypt32.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Crypt32.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Crypt32.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/crypt32
```

## Quick Start

```ts
import Crypt32 from '@bun-win32/crypt32';

// Open the current user's personal certificate store
const store = Crypt32.CertOpenSystemStoreW(0n, Buffer.from('MY\0', 'utf16le').ptr);

// Enumerate certificates
let cert = Crypt32.CertEnumCertificatesInStore(store, null);
let count = 0;
while (cert !== null) {
  count++;
  cert = Crypt32.CertEnumCertificatesInStore(store, cert);
}
console.log('Found %d certificates in MY store', count);

Crypt32.CertCloseStore(store, 0);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example
```

## Notes

- Either rely on lazy binding or call `Crypt32.Preload()`.
- Windows only. Bun runtime required.
