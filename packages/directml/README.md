# @bun-win32/directml

Zero-dependency, zero-overhead Win32 DirectML bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/directml` exposes the `DirectML.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `DirectML`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `DirectML.dll` (vendor-neutral, Direct3D 12-backed machine-learning device creation).
- In-source docs in `structs/DirectML.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`DirectML.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/DirectML.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later
- A Direct3D 12-capable adapter (DirectML is created over an `ID3D12Device`)

## Installation

```sh
bun add @bun-win32/directml
```

## Quick Start

```ts
import DirectML, { DML_CREATE_DEVICE_FLAGS, DML_FEATURE_LEVEL } from '@bun-win32/directml';

// DirectML is created over an existing ID3D12Device. The d3d12 binding can
// produce one; pass its raw pointer value (a bigint) as d3d12Device.
//
// IID_IDMLDevice {6dbd6437-96fd-423f-a98c-ae5e7c2a573f}
const iidDmlDevice = Buffer.alloc(16);
iidDmlDevice.writeUInt32LE(0x6dbd6437, 0);
iidDmlDevice.writeUInt16LE(0x96fd, 4);
iidDmlDevice.writeUInt16LE(0x423f, 6);
Buffer.from([0xa9, 0x8c, 0xae, 0x5e, 0x7c, 0x2a, 0x57, 0x3f]).copy(iidDmlDevice, 8);

// d3d12Device is the bigint pointer to a live ID3D12Device.
const ppDmlDevice = Buffer.alloc(8);
const hr = DirectML.DMLCreateDevice1(
  d3d12Device,
  DML_CREATE_DEVICE_FLAGS.DML_CREATE_DEVICE_FLAG_NONE,
  DML_FEATURE_LEVEL.DML_FEATURE_LEVEL_1_0,
  iidDmlDevice.ptr,
  ppDmlDevice.ptr,
);
if (hr === 0) {
  const dmlDeviceAddress = ppDmlDevice.readBigUInt64LE(0);
  console.log(`IDMLDevice @ 0x${dmlDeviceAddress.toString(16)}`);
  // Drive IDMLDevice via its COM vtable, then Release when done.
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
# Thorough flat-FFI diagnostic: real D3D12 -> DirectML device creation via both
# entry points, CheckFeatureSupport, GetDeviceRemovedReason, and a verified
# GetParentDevice round-trip back to the ID3D12Device
bun run example:directml-device-report

# Creative: an animated capability "observatory" that fires a real
# DMLCreateDevice1 at every documented feature level and decodes the device's
# true max feature level live over the IDMLDevice COM vtable
bun run example:directml-capability-observatory
```

## Notes

- Either rely on lazy binding or call `DirectML.Preload()`.
- Windows only. Bun runtime required.
- DirectML requires an `ID3D12Device`; the examples use the sibling `@bun-win32/d3d12` binding to create one.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
