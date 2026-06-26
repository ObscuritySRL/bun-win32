# @bun-win32/hid

Zero-dependency, zero-overhead Win32 HID bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/hid` exposes the `hid.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Hid`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `hid.dll` (HID device access, feature reports, preparsed data parsing, and more).
- In-source docs in `structs/Hid.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Hid.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Hid.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/hid
```

## Quick Start

```ts
import Hid from '@bun-win32/hid';

// Optionally bind a subset up-front
Hid.Preload(['HidD_GetHidGuid', 'HidP_GetCaps']);

// Get the HID device interface GUID
const guidBuf = Buffer.alloc(16);
Hid.HidD_GetHidGuid(guidBuf.ptr);

// Read GUID fields
const data1 = guidBuf.readUInt32LE(0);
const data2 = guidBuf.readUInt16LE(4);
const data3 = guidBuf.readUInt16LE(6);
const data4 = [...guidBuf.subarray(8, 16)].map((b) => b.toString(16).padStart(2, '0')).join('');
console.log('HID GUID: %08X-%04X-%04X-%s', data1, data2, data3, data4);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example              # HID GUID retrieval
```

## Notes

- Either rely on lazy binding or call `Hid.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
