# @bun-win32/d3d12

Zero-dependency, zero-overhead Win32 D3D12 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/d3d12` exposes the `d3d12.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `D3d12`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `d3d12.dll` (Direct3D 12 device creation, debug-layer access, global interface retrieval, and root-signature serialize/deserialize).
- In-source docs in `structs/D3d12.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`D3d12.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/D3d12.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/d3d12
```

## Quick Start

```ts
import D3d12, { D3D_FEATURE_LEVEL } from '@bun-win32/d3d12';

// IID_ID3D12Device {189819f1-1db6-4b57-be54-1821339b85f7}
const iidDevice = Buffer.alloc(16);
iidDevice.writeUInt32LE(0x189819f1, 0);
iidDevice.writeUInt16LE(0x1db6, 4);
iidDevice.writeUInt16LE(0x4b57, 6);
Buffer.from([0xbe, 0x54, 0x18, 0x21, 0x33, 0x9b, 0x85, 0xf7]).copy(iidDevice, 8);

// Pass NULL for ppDevice to test support without creating the device:
// S_OK / S_FALSE means a D3D12-capable adapter exists at this feature level.
const hr = D3d12.D3D12CreateDevice(null, D3D_FEATURE_LEVEL.D3D_FEATURE_LEVEL_11_0, iidDevice.ptr, null);
if (hr === 0 || hr === 1) {
  console.log('D3D12 supported at feature level 11_0');
}

// Allocate an 8-byte slot and pass its .ptr to actually receive the device,
// then drive ID3D12Device via its COM vtable and call Release when done.
const ppDevice = Buffer.alloc(8);
const created = D3d12.D3D12CreateDevice(null, D3D_FEATURE_LEVEL.D3D_FEATURE_LEVEL_11_0, iidDevice.ptr, ppDevice.ptr);
if (created === 0) {
  const deviceAddress = ppDevice.readBigUInt64LE(0);
  console.log(`ID3D12Device @ 0x${deviceAddress.toString(16)}`);
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
# Thorough flat-FFI diagnostic: feature-level ladder, debug/SDK interfaces,
# and root-signature serialize -> deserialize round-trips
bun run example:d3d12-device-probe

# Creative: create a real ID3D12Device and x-ray its hidden capability
# matrix (ray tracing, mesh shaders, wave ops, ...) via CheckFeatureSupport
bun run example:d3d12-capability-xray
```

## Notes

- Either rely on lazy binding or call `D3d12.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
