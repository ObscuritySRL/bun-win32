# @bun-win32/wuapi

Zero-dependency, zero-overhead Win32 Wuapi bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/wuapi` exposes the `wuapi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Wuapi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

`wuapi.dll` is the **Windows Update Agent COM server**. Its only flat exports are the four standard in-process COM server entry points (`DllCanUnloadNow`, `DllGetClassObject`, `DllRegisterServer`, `DllUnregisterServer`). The Windows Update object model — `IUpdateSession`, `IUpdateSearcher`, `ISearchResult`, `IUpdateHistoryEntryCollection`, ... — is reached via `CoCreateInstance(CLSID_UpdateSession)` (ProgID `Microsoft.Update.Session`) and driven over the COM vtable. This package binds the flat exports and re-exports every relevant CLSID, IID, and result/operation enum from `types/Wuapi.ts` so consumers can drive the object model over FFI (see the examples).

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `wuapi.dll` (Windows Update Agent COM server).
- In-source docs in `structs/Wuapi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Wuapi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Wuapi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/wuapi
```

## Quick Start

```ts
import Wuapi, { CLSID_UpdateSession, IID_IUpdateSession } from '@bun-win32/wuapi';

// Flat export: ask the in-process server whether it can unload.
const hr = Wuapi.DllCanUnloadNow(); // 0 = S_OK, 1 = S_FALSE

// The Windows Update object model is reached via COM (CoCreateInstance of
// CLSID_UpdateSession), then driven over the interface vtable. The exported
// CLSID_*/IID_* GUID strings and the OperationResultCode / UpdateOperation /
// ServerSelection enums are all you need to walk it — see the examples for a
// complete, cast-free vtable invoker.
console.log(CLSID_UpdateSession, IID_IUpdateSession);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:update-history-forensics   # exhaustive read-only servicing-history audit
bun run example:patch-constellation        # live animated star map of update history
```

## Notes

- Either rely on lazy binding or call `Wuapi.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
