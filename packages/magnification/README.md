# @bun-win32/magnification

Zero-dependency, zero-overhead Win32 Magnification bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/magnification` exposes the `magnification.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Magnification`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `magnification.dll` (full-screen color effects, magnifier transforms, window filtering, and pen/touch input remapping).
- In-source docs in `structs/Magnification.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Magnification.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Magnification.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/magnification
```

## Quick Start

```ts
import Magnification from '@bun-win32/magnification';

// Create the magnifier runtime objects.
Magnification.MagInitialize();

// Recolor the ENTIRE desktop with a 5x5 color-transform matrix
// (MAGCOLOREFFECT = float transform[5][5], row-major, 100 bytes).
// This one converts the whole screen to grayscale.
const grayscale = Buffer.from(new Float32Array([0.3, 0.3, 0.3, 0, 0, 0.59, 0.59, 0.59, 0, 0, 0.11, 0.11, 0.11, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1]).buffer);
Magnification.MagSetFullscreenColorEffect(grayscale.ptr);

// Read the current full-screen zoom factor and pan offsets.
const magLevel = Buffer.alloc(4);
const xOffset = Buffer.alloc(4);
const yOffset = Buffer.alloc(4);
Magnification.MagGetFullscreenTransform(magLevel.ptr, xOffset.ptr, yOffset.ptr);
console.log(magLevel.readFloatLE(0), xOffset.readInt32LE(0), yOffset.readInt32LE(0));

// Pass null to MagSetColorEffect to remove a magnifier-control color effect.
// Always undo a full-screen effect when done (identity matrix restores colors).
Magnification.MagUninitialize();
```

> [!NOTE]
> `MagSetWindowSource` takes a `RECT` **by value**. On the x64 ABI a 16-byte
> aggregate is passed by a pointer to a caller-allocated copy, so allocate a
> 16-byte `Buffer` (`LONG left, top, right, bottom`) and pass `.ptr`.

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example/screen-color-lab.ts          # creative: recolor the whole desktop live
bun run example/magnification-diagnostic.ts  # professional: full read-only audit
```

## Notes

- Either rely on lazy binding or call `Magnification.Preload()`.
- Full-screen effects (`MagSetFullscreenColorEffect`, `MagSetFullscreenTransform`) require Windows 8+ and a local desktop session; they are typically rejected over RDP.
- `MagSetInputTransform` requires the calling process to have UIAccess privileges.
- `MagSetImageScalingCallback` / `MagGetImageScalingCallback` are deprecated since Windows 7 and only function with DWM off.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
