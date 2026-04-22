# @bun-win32/comctl32

Zero-dependency, zero-overhead Win32 Comctl32 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/comctl32` exposes the `comctl32.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Comctl32`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `comctl32.dll` (common controls, image lists, property sheets, DPA/DSA dynamic arrays, flat scroll bars, window subclassing).
- In-source docs in `structs/Comctl32.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Comctl32.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Comctl32.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/comctl32
```

## Quick Start

```ts
import Comctl32, { DllVersionPlatform, ImageListCreateFlags } from '@bun-win32/comctl32';

Comctl32.Preload(['DllGetVersion', 'ImageList_Create', 'ImageList_Destroy', 'ImageList_GetImageCount', 'InitCommonControls']);

Comctl32.InitCommonControls();

const dllVersionInfoBuffer = Buffer.alloc(20);
dllVersionInfoBuffer.writeUInt32LE(20, 0);

if (Comctl32.DllGetVersion(dllVersionInfoBuffer.ptr) !== 0) {
  throw new Error('DllGetVersion failed');
}

const majorVersion = dllVersionInfoBuffer.readUInt32LE(4);
const minorVersion = dllVersionInfoBuffer.readUInt32LE(8);
const buildNumber = dllVersionInfoBuffer.readUInt32LE(12);
const platform = DllVersionPlatform[dllVersionInfoBuffer.readUInt32LE(16)];

console.log(`comctl32 v${majorVersion}.${minorVersion}.${buildNumber} (${platform})`);

const imageListHandle = Comctl32.ImageList_Create(16, 16, ImageListCreateFlags.ILC_COLOR32 | ImageListCreateFlags.ILC_MASK, 8, 4);

if (imageListHandle === 0n) {
  throw new Error('ImageList_Create failed');
}

console.log(`ImageList handle 0x${imageListHandle.toString(16)} — ${Comctl32.ImageList_GetImageCount(imageListHandle)} images`);

Comctl32.ImageList_Destroy(imageListHandle);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:common-controls-inspector
bun run example:dpa-sort-race
```

## Notes

- Either rely on lazy binding or call `Comctl32.Preload()`.
- Windows only. Bun runtime required.
