# @bun-win32/combase

Zero-dependency, zero-overhead Win32 Combase bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/combase` exposes the `combase.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Combase`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

This is the **Windows Runtime (WinRT) activation core**: the `Ro*` activation functions (`RoInitialize`, `RoActivateInstance`, `RoGetActivationFactory`), the full `HSTRING` string API (`WindowsCreateString`, `WindowsGetStringRawBuffer`, …), and the WinRT error-info surface (`RoOriginateError`, `GetRestrictedErrorInfo`, …). Combined with COM vtable invocation, this is the pure-FFI path to native toast notifications, System Media Transport Controls, sensors, and the rest of the WinRT projection — with no native build step.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `combase.dll` (WinRT activation, HSTRING strings, and Windows Runtime error APIs).
- In-source docs in `structs/Combase.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Combase.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Combase.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/combase
```

## Quick Start

```ts
import Combase, { RO_INIT_TYPE } from '@bun-win32/combase';

// Initialize the Windows Runtime on this thread.
Combase.RoInitialize(RO_INIT_TYPE.RO_INIT_MULTITHREADED);

// Create an HSTRING from a JS string.
const text = 'Windows.Globalization.Calendar';
const source = Buffer.from(text, 'utf16le');
const out = Buffer.alloc(8);
Combase.WindowsCreateString(source.ptr!, text.length, out.ptr!);
const hClassId = out.readBigUInt64LE(0);

// Activate the WinRT runtime class.
const instance = Buffer.alloc(8);
const hr = Combase.RoActivateInstance(hClassId, instance.ptr!);
console.log(`RoActivateInstance → 0x${(hr >>> 0).toString(16)}`);

Combase.WindowsDeleteString(hClassId);
Combase.RoUninitialize();
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example/toast-notification.ts
bun run example/winrt-diagnostic.ts
```

## Notes

- Either rely on lazy binding or call `Combase.Preload()`.
- `HSTRING`, `HSTRING_BUFFER`, and the registration cookies are opaque handle tokens (`bigint`); `HSTRING*` out-parameters are caller-allocated buffers (`Pointer`).
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
