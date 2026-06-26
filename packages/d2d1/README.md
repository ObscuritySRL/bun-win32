# @bun-win32/d2d1

Zero-dependency, zero-overhead Win32 D2D1 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/d2d1` exposes the `d2d1.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `D2D1`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

`d2d1.dll` exports only thirteen flat C functions: the factory/device entry points (`D2D1CreateFactory`, `D2D1CreateDevice`, `D2D1CreateDeviceContext`) and Direct2D's native transform/color math (`D2D1MakeRotateMatrix`, `D2D1MakeSkewMatrix`, `D2D1InvertMatrix`, `D2D1IsMatrixInvertible`, `D2D1ComputeMaximumScaleFactor`, `D2D1ConvertColorSpace`, `D2D1SinCos`, `D2D1Tan`, `D2D1Vec3Length`, `D2D1GetGradientMeshInteriorPointsFromCoonsPatch`). The rest of Direct2D — render targets, brushes, geometry, drawing — is reached through the COM vtable of the `ID2D1Factory` returned by `D2D1CreateFactory`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `d2d1.dll` (Direct2D — GPU-accelerated 2D: factory/device creation plus the native matrix, color-space, and gradient-mesh math).
- In-source docs in `structs/D2D1.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`D2D1.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/D2D1.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/d2d1
```

## Quick Start

```ts
import D2D1, { D2D1_FACTORY_TYPE } from '@bun-win32/d2d1';

// IID_ID2D1Factory = 06152247-6f50-465a-9245-118bfd3b6007
const iid = Buffer.from([
  0x47, 0x22, 0x15, 0x06, 0x50, 0x6f, 0x5a, 0x46,
  0x92, 0x45, 0x11, 0x8b, 0xfd, 0x3b, 0x60, 0x07,
]);
const ppFactory = Buffer.alloc(8);

const hr = D2D1.D2D1CreateFactory(D2D1_FACTORY_TYPE.D2D1_FACTORY_TYPE_SINGLE_THREADED, iid.ptr, null, ppFactory.ptr);
if (hr !== 0) throw new Error(`D2D1CreateFactory failed: 0x${(hr >>> 0).toString(16)}`);

const factory = ppFactory.readBigUInt64LE(0);
console.log(`ID2D1Factory @ 0x${factory.toString(16)}`);
// ... walk ID2D1Factory::CreateWicBitmapRenderTarget / GetDesktopDpi / Release via the COM vtable.

// Direct2D's native transform engine — no COM required:
const matrix = Buffer.alloc(24); // D2D1_MATRIX_3X2_F = 6 floats
D2D1.D2D1MakeRotateMatrix(45, 0n, matrix.ptr); // rotate 45° about the origin
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
# Real-time animated 3D wireframe driven entirely by Direct2D's native matrix/color math
bun run example:d2d1-matrix-engine

# Factory creation + DPI probe + exhaustive transform / color-space / Coons-patch report
bun run example:d2d1-factory-probe
```

## Notes

- Either rely on lazy binding or call `D2D1.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
