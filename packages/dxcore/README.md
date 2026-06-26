# @bun-win32/dxcore

Zero-dependency, zero-overhead Win32 DXCore bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/dxcore` exposes the `dxcore.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Dxcore`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

`dxcore.dll` exports exactly one flat function, `DXCoreCreateAdapterFactory` (every other ordinal is a forwarder to `win32u`). It bootstraps the `IDXCoreAdapterFactory` COM object; all DXCore adapter enumeration — discrete GPUs, integrated parts, the software render driver, and headless compute-only MCDM devices — is reached through its COM vtable. The package ships the well-known IIDs, attribute GUIDs, and DXCore enums; the examples demonstrate the full vtable-walk pattern.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `dxcore.dll` (DXGI-independent GPU/compute adapter enumeration, including MCDM).
- In-source docs in `structs/Dxcore.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Dxcore.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases, IIDs, attribute GUIDs, and DXCore enums (see `types/Dxcore.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 (version 1903+) or later

## Installation

```sh
bun add @bun-win32/dxcore
```

## Quick Start

```ts
import Dxcore, { IID_IDXCoreAdapterFactory } from '@bun-win32/dxcore';

// IID_IDXCoreAdapterFactory laid out as a 16-byte little-endian GUID.
function guid(text: string): Buffer {
  const h = text.replace(/[{}-]/g, '');
  const b = Buffer.alloc(16);
  b.writeUInt32LE(parseInt(h.slice(0, 8), 16), 0);
  b.writeUInt16LE(parseInt(h.slice(8, 12), 16), 4);
  b.writeUInt16LE(parseInt(h.slice(12, 16), 16), 6);
  for (let i = 0; i < 8; i += 1) b[8 + i] = parseInt(h.slice(16 + i * 2, 18 + i * 2), 16);
  return b;
}

const factory = Buffer.alloc(8);
const hr = Dxcore.DXCoreCreateAdapterFactory(guid(IID_IDXCoreAdapterFactory).ptr!, factory.ptr!);
// hr === 0 (S_OK): factory.readBigUInt64LE(0) is the IDXCoreAdapterFactory pointer.
// Walk its COM vtable to CreateAdapterList / GetAdapter — see example/.
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:gpu-constellation
bun run example:adapter-report
```

- **gpu-constellation** — every GPU and compute adapter charted as a glowing terminal constellation with vendor-tinted silicon dies and animated VRAM bars, purely over the COM vtable.
- **adapter-report** — an exhaustive per-adapter dossier: decoded hardware IDs, driver/WDDM versions, preemption granularity, every memory pool, and the full attribute matrix.

## Notes

- Either rely on lazy binding or call `Dxcore.Preload()`.
- DXCore has no "all adapters" call — adapters are enumerated by attribute (`DXCORE_ADAPTER_ATTRIBUTE_D3D12_GRAPHICS`, `_D3D12_CORE_COMPUTE`, `_D3D11_GRAPHICS`).
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
