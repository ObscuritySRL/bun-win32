# @bun-win32/windowscodecs

Zero-dependency, zero-overhead Win32 WindowsCodecs bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/windowscodecs` exposes the `windowscodecs.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `WindowsCodecs`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

Windows Imaging Component (WIC) ships its C-callable surface as flat `*_Proxy` exports: each `IWICInterface_Method_Proxy` forwards to the matching COM vtable method, taking the interface pointer as the first argument. COM interface pointers are passed by value as `bigint` handles; the `**` out-parameters of the create/get functions are caller-allocated 8-byte buffers from which you read the new pointer.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `windowscodecs.dll` (Windows Imaging Component: image decode/encode, scaling, flip/rotate, pixel-format conversion, palettes, color contexts, and metadata).
- In-source docs in `structs/WindowsCodecs.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`WindowsCodecs.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/WindowsCodecs.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/windowscodecs
```

## Quick Start

```ts
import WindowsCodecs, { WICDecodeOptions, WINCODEC_SDK_VERSION } from '@bun-win32/windowscodecs';

// Read a COM interface pointer out of an 8-byte slot.
const slot = () => Buffer.alloc(8);
const ptrOf = (b: Buffer) => b.readBigUInt64LE(0);

// 1. Create the imaging factory (CoInitialize via @bun-win32/ole32 first).
const ppFactory = slot();
WindowsCodecs.WICCreateImagingFactory_Proxy(WINCODEC_SDK_VERSION, ppFactory.ptr!);
const factory = ptrOf(ppFactory);

// 2. Decode an image from a file.
const path = Buffer.from('C:\\Windows\\Web\\Wallpaper\\Windows\\img0.jpg\0', 'utf16le');
const ppDecoder = slot();
WindowsCodecs.IWICImagingFactory_CreateDecoderFromFilename_Proxy(factory, path.ptr!, null, 0x8000_0000, WICDecodeOptions.WICDecodeMetadataCacheOnDemand, ppDecoder.ptr!);
const decoder = ptrOf(ppDecoder);

// 3. Grab frame 0 and read its dimensions.
const ppFrame = slot();
WindowsCodecs.IWICBitmapDecoder_GetFrame_Proxy(decoder, 0, ppFrame.ptr!);
const frame = ptrOf(ppFrame);

const w = Buffer.alloc(4);
const h = Buffer.alloc(4);
WindowsCodecs.IWICBitmapSource_GetSize_Proxy(frame, w.ptr!, h.ptr!);
console.log(`${w.readUInt32LE(0)} x ${h.readUInt32LE(0)}`);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:plasma-forge      # creative: synthesize a plasma field, WIC-resample it, paint truecolor ANSI
bun run example:image-inspector   # professional: full decode + format conversion + codec/metadata diagnostic
```

## Notes

- WIC is COM-based. Initialize COM on the calling thread first (e.g. `Ole32.CoInitialize(null)` from `@bun-win32/ole32`) before creating the factory.
- Interface pointers are reference-counted. Release them with `IUnknown::Release` (via `@bun-win32/ole32`) when done; this package binds the documented WIC surface 1:1 and does not manage lifetimes.
- Either rely on lazy binding or call `WindowsCodecs.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
