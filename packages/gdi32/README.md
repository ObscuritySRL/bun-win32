# @bun-win32/gdi32

Zero-dependency, zero-overhead Win32 GDI32 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/gdi32` exposes the `gdi32.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `GDI32`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `gdi32.dll` (device contexts, bitmaps, palettes, metrics, and painting helpers).
- In-source docs in `structs/GDI32.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`GDI32.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/GDI32.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/gdi32
```

## Quick Start

```ts
import GDI32 from '@bun-win32/gdi32';

// Preload a subset for hot paths (optional)
GDI32.Preload(['CreateCompatibleDC', 'DeleteDC']);

const hdc = GDI32.CreateCompatibleDC();

// ... do work with the device context ...

GDI32.DeleteDC(hdc);
```

## Examples

Run the included examples:

```sh
bun run example              # Basic GDI32 usage
```

## Notes

- Either rely on lazy binding or call `GDI32.Preload()`.
- Windows only. Bun runtime required.
