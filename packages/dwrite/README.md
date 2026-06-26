# @bun-win32/dwrite

Zero-dependency, zero-overhead Win32 DirectWrite bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/dwrite` exposes the `dwrite.dll` export using [Bun](https://bun.sh)'s FFI. It provides a single class, `Dwrite`, which lazily binds the native symbol on first use. You can optionally preload it up-front via `Preload()`.

`dwrite.dll` exports exactly **one** flat function — `DWriteCreateFactory`. It hands back an `IDWriteFactory`, and the entire DirectWrite surface (font enumeration, text layout, glyph metrics, ClearType/grayscale rasterization, typography, shaping) lives behind that object's COM vtable. This package binds the factory entry point; the included examples demonstrate the hand-driven COM vtable pattern (`read.u64` + `CFunction`) for everything beyond it — the same proven approach used by `@bun-win32/dxgi` and `@bun-win32/combase`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `dwrite.dll` (DirectWrite font and text layout/typography engine).
- In-source docs in `structs/Dwrite.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Dwrite.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Dwrite.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/dwrite
```

## Quick Start

```ts
import Dwrite, { DWRITE_FACTORY_TYPE } from '@bun-win32/dwrite';

// __uuidof(IDWriteFactory) = b859ee5a-d838-4b5b-a2e8-1adc7d93db48
const iid = Buffer.from([0x5a, 0xee, 0x59, 0xb8, 0x38, 0xd8, 0x5b, 0x4b, 0xa2, 0xe8, 0x1a, 0xdc, 0x7d, 0x93, 0xdb, 0x48]);

const factory = Buffer.alloc(8);
const hr = Dwrite.DWriteCreateFactory(DWRITE_FACTORY_TYPE.DWRITE_FACTORY_TYPE_SHARED, iid.ptr!, factory.ptr!);
console.log(`DWriteCreateFactory → 0x${(hr >>> 0).toString(16)}`);

// factory.readBigUInt64LE(0) is now an IDWriteFactory*; walk its COM vtable
// with `read.u64` + `CFunction` (see example/font-observatory.ts).
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example/glyph-forge.ts
bun run example/font-observatory.ts
```

## Notes

- Either rely on lazy binding or call `Dwrite.Preload()`.
- `iid` is a caller-allocated 16-byte GUID buffer (`Pointer`); `factory` is a caller-allocated 8-byte slot (`Pointer`) that receives an `IUnknown*`/`IDWriteFactory*` interface pointer, read back as a `bigint`.
- All DirectWrite objects are COM interfaces — invoke their methods through the vtable and `Release` them when finished.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
