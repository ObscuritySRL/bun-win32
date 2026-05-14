# @bun-win32/oleaut32

Zero-dependency, zero-overhead Win32 OLEAUT32 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/oleaut32` exposes the `oleaut32.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Oleaut32`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

`oleaut32.dll` is the foundation of OLE Automation. It is the canonical companion to `ole32` and a hard dependency of nearly every COM client — IDispatch consumers, Active Scripting hosts, scripting bridges, type-library loaders, ActiveX containers, and anything that traffics in `VARIANT`, `BSTR`, `SAFEARRAY`, `DECIMAL`, or `CURRENCY` values.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `oleaut32.dll` (BSTR, VARIANT, SAFEARRAY, type libraries, IDispatch helpers, OLE pictures, currency/decimal math, format and parse, and the full Var\*From\* conversion family).
- 417 documented exports bound — every BSTR, VARIANT, SAFEARRAY, type-library, picture, error-info, active-object, dispatch-helper, marshaling, and Var conversion entry point.
- In-source docs in `structs/Oleaut32.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Oleaut32.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Oleaut32.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/oleaut32
```

## Quick Start

```ts
import Oleaut32, { VarEnum } from '@bun-win32/oleaut32';

// Optionally bind a subset up-front
Oleaut32.Preload(['SysAllocString', 'SysFreeString', 'VariantInit', 'VariantClear', 'VariantChangeType']);

// Allocate a BSTR from a UTF-16LE buffer
const wide = Buffer.from('Hello, OLE!\0', 'utf16le');
const bstr = Oleaut32.SysAllocString(wide.ptr);

const charCount = Oleaut32.SysStringLen(bstr);
const byteCount = Oleaut32.SysStringByteLen(bstr);
console.log(`Length: ${charCount} chars, ${byteCount} bytes`);

// Always free what you allocated
Oleaut32.SysFreeString(bstr);

// Initialize a VARIANT, then clear it
const variant = Buffer.alloc(24); // VARIANT is 24 bytes on x64
Oleaut32.VariantInit(variant.ptr);
console.log('VT:', variant.readUInt16LE(0), '== VT_EMPTY:', VarEnum.VT_EMPTY);
Oleaut32.VariantClear(variant.ptr);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:variant-conversion-matrix  # Animated grid of Var*From* type coercions
bun run example:typelib-explorer           # Full type-library inspection report
```

## Notes

- Either rely on lazy binding or call `Oleaut32.Preload()`.
- Windows only. Bun runtime required.
- `BSTR` is a length-prefixed UTF-16LE string allocated by `SysAllocString*`. Always pair it with `SysFreeString` (or `SysReleaseString`).
- `VARIANT` is 24 bytes on x64. Use `VariantInit` before populating and `VariantClear` before reuse/drop.
- `CY` (currency) is a 64-bit fixed-point integer (10,000 units = 1 currency unit). Passed by value as `bigint`.
- `DECIMAL` is a 16-byte struct passed by pointer in every API; allocate a 16-byte `Buffer`.
