# @bun-win32/d3d11

Zero-dependency, zero-overhead Win32 D3D11 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/d3d11` exposes the `d3d11.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `D3d11`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `d3d11.dll` (Direct3D 11 device / swap-chain creation, D3D11-on-12 interop, and WinRT `IDirect3DDevice` / `IDirect3DSurface` interop).
- In-source docs in `structs/D3d11.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`D3d11.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/D3d11.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/d3d11
```

## Quick Start

```ts
import D3d11, { D3D11_SDK_VERSION, D3D_DRIVER_TYPE } from '@bun-win32/d3d11';

const ppDevice = Buffer.alloc(8);
const pFeatureLevel = Buffer.alloc(4);
const ppContext = Buffer.alloc(8);

const hr = D3d11.D3D11CreateDevice(
  null,
  D3D_DRIVER_TYPE.D3D_DRIVER_TYPE_HARDWARE,
  0n,
  0,
  null,
  0,
  D3D11_SDK_VERSION,
  ppDevice.ptr,
  pFeatureLevel.ptr,
  ppContext.ptr,
);
if (hr !== 0) throw new Error(`D3D11CreateDevice failed: 0x${(hr >>> 0).toString(16)}`);

const deviceAddress = ppDevice.readBigUInt64LE(0);
const featureLevel = pFeatureLevel.readUInt32LE(0);
console.log(`ID3D11Device @ 0x${deviceAddress.toString(16)}, FL 0x${featureLevel.toString(16)}`);
// ... drive the device via its COM vtable and call Release when done.
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
# Device-creation matrix (driver types × feature levels × flags)
bun run example:d3d11-device-probe

# Interop probe (WinRT IDirect3DDevice/IDirect3DSurface and D3D11-on-12)
bun run example:d3d11-interop-probe
```

## Notes

- Either rely on lazy binding or call `D3d11.Preload()`.
- Windows only. Bun runtime required.
