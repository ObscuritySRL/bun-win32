# @bun-win32/winspool

Zero-dependency, zero-overhead Win32 Winspool bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/winspool` exposes the `winspool.drv` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Winspool`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `winspool.drv` (printer management, print jobs, spooler control, driver management, and more).
- In-source docs in `structs/Winspool.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Winspool.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Winspool.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/winspool
```

## Quick Start

```ts
import Winspool from '@bun-win32/winspool';

// Get the default printer name (sizing call, then read)
const sizeBuffer = Buffer.alloc(4);
Winspool.GetDefaultPrinterW(null, sizeBuffer.ptr);

const charsNeeded = sizeBuffer.readUInt32LE(0);
const nameBuffer = Buffer.alloc(charsNeeded * 2);
sizeBuffer.writeUInt32LE(charsNeeded, 0);

Winspool.GetDefaultPrinterW(nameBuffer.ptr, sizeBuffer.ptr);
const printerName = new TextDecoder('utf-16').decode(nameBuffer).replace(/\0.*$/, '');
console.log('Default printer:', printerName);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example              # Default printer + printer enumeration
```

## Notes

- Either rely on lazy binding or call `Winspool.Preload()`.
- Windows only. Bun runtime required.
