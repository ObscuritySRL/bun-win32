# @bun-win32/dwmapi

Zero-dependency, zero-overhead Win32 DWMAPI bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/dwmapi` exposes the `dwmapi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Dwmapi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `dwmapi.dll` (27 bindings covering Desktop Window Manager composition, blur, thumbnails, and window attributes).
- In-source docs in `structs/Dwmapi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Dwmapi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Dwmapi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/dwmapi
```

## Quick Start

```ts
import Dwmapi, { WindowAttribute } from '@bun-win32/dwmapi';

// Optionally bind a subset up-front
Dwmapi.Preload(['DwmIsCompositionEnabled', 'DwmGetWindowAttribute', 'DwmSetWindowAttribute']);

// Check if DWM composition is enabled
const enabledBuf = Buffer.alloc(4);
Dwmapi.DwmIsCompositionEnabled(enabledBuf.ptr);
console.log('Composition enabled:', !!enabledBuf.readInt32LE(0));

// Get the system colorization color
const colorBuf = Buffer.alloc(4);
const opaqueBuf = Buffer.alloc(4);
Dwmapi.DwmGetColorizationColor(colorBuf.ptr, opaqueBuf.ptr);
console.log('Color:', '0x' + colorBuf.readUInt32LE(0).toString(16));

// Enable immersive dark mode on a window (requires a valid HWND)
// const darkMode = Buffer.alloc(4);
// darkMode.writeInt32LE(1, 0);
// Dwmapi.DwmSetWindowAttribute(hwnd, WindowAttribute.DWMWA_USE_IMMERSIVE_DARK_MODE, darkMode.ptr, 4);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included example:

```sh
bun run example
```

## Notes

- Either rely on lazy binding or call `Dwmapi.Preload()`.
- Windows only. Bun runtime required.
