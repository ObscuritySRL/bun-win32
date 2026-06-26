# @bun-win32/avifil32

Zero-dependency, zero-overhead Win32 Avifil32 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/avifil32` exposes the `avifil32.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Avifil32`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `avifil32.dll` (Video for Windows AVIFile API: open/create `.avi` files, enumerate and read/write video, audio, MIDI, and text streams, decode frames to DIBs, mux files from streams, and edit streams).
- In-source docs in `structs/Avifil32.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Avifil32.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Avifil32.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/avifil32
```

## Quick Start

```ts
import Avifil32, { OpenFileFlags, StreamType } from '@bun-win32/avifil32';

// Optionally bind a subset up-front
Avifil32.Preload(['AVIFileInit', 'AVIFileOpenW', 'AVIFileInfoW', 'AVIFileRelease', 'AVIFileExit']);

Avifil32.AVIFileInit();

// AVIFileOpenW writes the IAVIFile pointer into a caller-allocated buffer
const ppfile = Buffer.alloc(8);
const path = Buffer.from('C:\\\\sample.avi\0', 'utf16le');
const hr = Avifil32.AVIFileOpenW(ppfile.ptr, path.ptr, OpenFileFlags.OF_READ | OpenFileFlags.OF_SHARE_DENY_NONE, null);

if (hr === 0) {
  const pfile = ppfile.readBigUInt64LE(0);

  // AVIFILEINFOW is 172 bytes on x64; dwStreams is at offset 12
  const info = Buffer.alloc(172);
  Avifil32.AVIFileInfoW(pfile, info.ptr, info.byteLength);
  console.log('Streams: %d', info.readUInt32LE(12));

  Avifil32.AVIFileRelease(pfile);
}

Avifil32.AVIFileExit();
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
# Decode a synthesized .avi and play it back in the terminal with 24-bit ANSI
bun run example/terminal-cinema.ts

# Thorough AVI container diagnostic (pass a path, or a sample is synthesized)
bun run example/avi-inspector.ts [path-to.avi]
```

## Notes

- Either rely on lazy binding or call `Avifil32.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
