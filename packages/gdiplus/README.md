# @bun-win32/gdiplus

Zero-dependency, zero-overhead Win32 GDI+ bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/gdiplus` exposes the `gdiplus.dll` flat C API using [Bun](https://bun.sh)'s FFI. It provides a single class, `Gdiplus`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

628 functions are bound — the complete documented surface of the GDI+ flat C API (`gdiplusflat.h`, plus the startup and memory helpers from `gdiplusinit.h`, `gdiplusmem.h`, `gdipluseffects.h`).

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `gdiplus.dll`: image loading and encoding (PNG, JPEG, BMP, GIF, TIFF, EMF, WMF, ICO), antialiased 2D drawing, paths, regions, gradients, brushes, fonts, custom line caps, color matrix effects, metafile recording.
- In-source docs in `structs/Gdiplus.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Gdiplus.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases, full `Status` / `Unit` / `PixelFormat` / `SmoothingMode` / `WrapMode` / etc. enums (see `types/Gdiplus.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/gdiplus
```

## Quick Start

```ts
import Gdiplus, {
  PixelFormat32bppARGB,
  SmoothingMode,
  Status,
} from '@bun-win32/gdiplus';

// 1. Bootstrap GDI+ (call once per process; pair with GdiplusShutdown).
const tokenBuffer = Buffer.alloc(8);
const startupInput = Buffer.alloc(16); // GdiplusStartupInput
startupInput.writeUInt32LE(1, 0); // GdiplusVersion = 1
Gdiplus.GdiplusStartup(tokenBuffer.ptr, startupInput.ptr, null);
const token = tokenBuffer.readBigUInt64LE(0);

// 2. Open an existing image from disk.
const path = Buffer.from('input.png\0', 'utf16le');
const imageHandle = Buffer.alloc(8);
Gdiplus.GdipLoadImageFromFile(path.ptr, imageHandle.ptr);
const image = imageHandle.readBigUInt64LE(0);

// 3. Query its dimensions.
const widthBuf = Buffer.alloc(4);
Gdiplus.GdipGetImageWidth(image, widthBuf.ptr);
console.log('width =', widthBuf.readUInt32LE(0));

// 4. Tear down.
Gdiplus.GdipDisposeImage(image);
Gdiplus.GdiplusShutdown(token);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:generative-poster   # procedurally render & save a 1200x900 PNG
bun run example:image-diagnostic    # enumerate codecs + inspect an image file
```

## Notes

- Always call `GdiplusStartup` before any other `Gdip*` function. `GdiplusShutdown` cleans up.
- Opaque GDI+ objects (`GpBitmap`, `GpImage`, `GpGraphics`, `GpPen`, `GpBrush`, `GpFont`, etc.) are modeled as `bigint` handles. Create them, capture the handle from the out-buffer, dispose them with the appropriate `GdipDispose*` / `GdipDelete*` call.
- The flat C API takes `Gp*` pointers by value. Out parameters (`Gp* *bitmap`) take a `Pointer` to an 8-byte buffer the caller reads after the call.
- Most functions return a `Status` enum — `Status.Ok` (0) is success; anything else is an error from the `Status` enum (`OutOfMemory`, `InvalidParameter`, `FileNotFound`, …).
- Either rely on lazy binding or call `Gdiplus.Preload()`.
- Windows only. Bun runtime required.
