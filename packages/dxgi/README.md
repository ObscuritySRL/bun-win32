# @bun-win32/dxgi

Zero-dependency, zero-overhead Win32 Dxgi bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/dxgi` exposes the `dxgi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Dxgi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `dxgi.dll` (DirectX Graphics Infrastructure — adapter enumeration, factory creation, and the debug interface used by Direct3D 10/11/12).
- In-source docs in `structs/Dxgi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Dxgi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Dxgi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/dxgi
```

## Quick Start

```ts
import Dxgi from '@bun-win32/dxgi';

// IID_IDXGIFactory1 = 770aae78-f26f-4dba-a829-253c83d1b387
const iid = Buffer.from([
  0x78, 0xae, 0x0a, 0x77, 0x6f, 0xf2, 0xba, 0x4d,
  0xa8, 0x29, 0x25, 0x3c, 0x83, 0xd1, 0xb3, 0x87,
]);
const ppFactory = Buffer.alloc(8);

const hr = Dxgi.CreateDXGIFactory1(iid.ptr, ppFactory.ptr);
if (hr !== 0) throw new Error(`CreateDXGIFactory1 failed: 0x${(hr >>> 0).toString(16)}`);

const factoryAddress = ppFactory.readBigUInt64LE(0);
console.log(`IDXGIFactory1 @ 0x${factoryAddress.toString(16)}`);
// ... walk IDXGIFactory1::EnumAdapters1 / Release via the COM vtable.
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
# GPU inventory dashboard (adapters, VRAM, vendor, outputs)
bun run example:gpu-observatory

# Factory / debug / adapter-removal compatibility matrix
bun run example:dxgi-factory-probe
```

## Notes

- Either rely on lazy binding or call `Dxgi.Preload()`.
- Windows only. Bun runtime required.
