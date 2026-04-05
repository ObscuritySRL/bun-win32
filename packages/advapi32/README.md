# @bun-win32/advapi32

Zero-dependency, zero-overhead Win32 Advapi32 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/advapi32` exposes the `advapi32.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Advapi32`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `advapi32.dll` (registry, security, services, cryptography, event logging, and more).
- In-source docs in `structs/Advapi32.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Advapi32.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Advapi32.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/advapi32
```

## Quick Start

```ts
import Advapi32, { HKEY_LOCAL_MACHINE } from '@bun-win32/advapi32';

// Optionally bind a subset up-front
Advapi32.Preload(['GetUserNameW', 'RegOpenKeyExW', 'RegCloseKey']);

// Get current username
const size = new Uint32Array([256]);
const buf = new Uint16Array(256);

Advapi32.GetUserNameW(buf.ptr, size.ptr);

const username = String.fromCharCode(...buf.subarray(0, size[0]! - 1));
console.log('User: %s', username);
```

## Examples

Run the included examples:

```sh
bun run example              # Registry, username, and privilege lookups
```

## Notes

- Either rely on lazy binding or call `Advapi32.Preload()`.
- Windows only. Bun runtime required.
