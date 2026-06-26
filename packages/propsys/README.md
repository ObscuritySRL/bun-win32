# @bun-win32/propsys

Zero-dependency, zero-overhead Win32 Propsys bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/propsys` exposes the `propsys.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Propsys`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `propsys.dll` (PROPVARIANT/VARIANT helpers, property keys, and property stores).
- In-source docs in `structs/Propsys.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Propsys.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Propsys.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/propsys
```

## Quick Start

```ts
import Propsys from '@bun-win32/propsys';

// Resolve a canonical property name to its binary PROPERTYKEY
// (GUID fmtid + DWORD pid = 20 bytes), then format it back to a string.
const name = Buffer.from('System.Title\0', 'utf16le');
const key = Buffer.alloc(20);

if (Propsys.PSGetPropertyKeyFromName(name.ptr, key.ptr) === 0) {
  const text = Buffer.alloc(256 * 2); // wide chars
  Propsys.PSStringFromPropertyKey(key.ptr, text.ptr, 256);
  console.log(text.toString('utf16le').replace(/\0.*$/, ''));
  // {F29F85E0-4FF9-1068-AB91-08002B27B3D9} 2
}
```

> [!NOTE]
> `PSGetPropertyKeyFromName` resolves names through the COM-based property
> schema, so call `CoInitialize`/`CoInitializeEx` on the thread first. The
> `PropVariant*`/`Variant*` value helpers and `PropVariantCompareEx` do not
> require COM.

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
# Thorough diagnostic: property-key dictionary + PROPVARIANT conversion matrix
bun run example/property-system-diagnostic.ts

# Animated: a deck sorted live by Windows' own PropVariantCompareEx, three ways
bun run example/windows-sort-visualizer.ts
```

## Notes

- Either rely on lazy binding or call `Propsys.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
