# @bun-win32/quartz

Zero-dependency, zero-overhead Win32 Quartz bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/quartz` exposes the `quartz.dll` exports — the legacy **DirectShow** runtime — using [Bun](https://bun.sh)'s FFI. It provides a single class, `Quartz`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

DirectShow is a legacy API (superseded by Media Foundation), but `quartz.dll` is still the only path that reaches a large fleet of older webcams, capture cards, virtual cameras, and codecs that never gained Media Foundation support. `quartz.dll` is also the in-process COM server for the DirectShow Filter Graph Manager (`CLSID_FilterGraph` → `IGraphBuilder`), so its `DllGetClassObject` export lets you spin up a real filter graph without `CoCreateInstance`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `quartz.dll` (DirectShow error-text lookup + the standard `Dll*` COM-server entry points for the Filter Graph Manager).
- All documented `quartz.dll` exports are bound: `AMGetErrorTextA/W` plus the four `Dll*` COM-server functions.
- In-source docs in `structs/Quartz.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Quartz.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases plus the `MAX_ERROR_TEXT_LEN` constant (see `types/Quartz.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/quartz
```

## Quick Start

```ts
import Quartz, { MAX_ERROR_TEXT_LEN } from '@bun-win32/quartz';

// Decode any DirectShow HRESULT into human-readable text.
const buffer = Buffer.alloc(MAX_ERROR_TEXT_LEN * 2); // WCHARs
const written = Quartz.AMGetErrorTextW(0x80040217, buffer.ptr!, MAX_ERROR_TEXT_LEN);
console.log(buffer.toString('utf16le', 0, written * 2)); // "No combination of intermediate filters..."

// quartz.dll is the COM server for the DirectShow Filter Graph Manager.
// Resolve its class factory straight from the bound DllGetClassObject export.
function guid(v: string): Buffer {
  const m = /^(\w{8})-(\w{4})-(\w{4})-(\w{4})-(\w{12})$/.exec(v)!;
  const b = Buffer.alloc(16);
  b.writeUInt32LE(parseInt(m[1], 16), 0);
  b.writeUInt16LE(parseInt(m[2], 16), 4);
  b.writeUInt16LE(parseInt(m[3], 16), 6);
  const d = m[4] + m[5];
  for (let i = 0; i < 8; i++) b[8 + i] = parseInt(d.slice(i * 2, i * 2 + 2), 16);
  return b;
}

const CLSID_FilterGraph = guid('e436ebb3-524f-11ce-9f53-0020af0ba770');
const IID_IClassFactory = guid('00000001-0000-0000-c000-000000000046');
const factoryOut = Buffer.alloc(8);
const hr = Quartz.DllGetClassObject(CLSID_FilterGraph.ptr!, IID_IClassFactory.ptr!, factoryOut.ptr!);
console.log('IClassFactory @', factoryOut.readBigUInt64LE(0).toString(16), '(hr 0x' + (hr >>> 0).toString(16) + ')');
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:directshow-device-census
bun run example:capture-radar
```

- **directshow-device-census** — a thorough diagnostic: resolves the System Device Enumerator, walks every video and audio capture moniker, reads each device's `FriendlyName` / `DevicePath` / `Description` from its `IPropertyBag`, then for each video device materializes `quartz.dll`'s own `CLSID_FilterGraph` COM server via the bound `DllGetClassObject` export, binds the source filter into the graph with `IGraphBuilder::AddFilter`, and enumerates its pins — with every HRESULT decoded by name through `AMGetErrorTextW`.
- **capture-radar** — a live, animated radar console: a rotating ASCII sweep "pings" each discovered capture device, lighting it up with a signal-strength blip derived from how far its source filter gets when bound into a real `quartz.dll` filter graph (moniker → IPropertyBag → IBaseFilter → AddFilter → pins), with every HRESULT narrated live through `AMGetErrorTextW`.

## Notes

- DirectShow is a **legacy** API. Microsoft recommends Media Foundation for new code. Use `quartz.dll` when you must reach older webcams / capture hardware / codecs that Media Foundation does not surface.
- `AMGetErrorTextW` takes a buffer sized in **WCHARs** and returns the number of characters written (0 on failure). `MAX_ERROR_TEXT_LEN` (160) is the documented maximum.
- `DllGetClassObject` is `quartz.dll`'s in-process COM-server entry point. It serves DirectShow CLSIDs such as `CLSID_FilterGraph`; pass `IID_IClassFactory` and then call `IClassFactory::CreateInstance` over the returned vtable (the System Device Enumerator itself lives in `devenum.dll`, not `quartz.dll`).
- `DllRegisterServer` / `DllUnregisterServer` mutate `HKLM` and require elevation; they are bound but should not be called from a normal process.
- Call `CoInitializeEx` (e.g. via `@bun-win32/ole32`) before using any COM object obtained through `DllGetClassObject`.
- COM interface pointers are opaque addresses; drive them through their vtables (resolve method slots with `ReadProcessMemory`, then `linkSymbols`).
- Either rely on lazy binding or call `Quartz.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
