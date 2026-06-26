# @bun-win32/cabinet

Zero-dependency, zero-overhead Win32 Cabinet bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/cabinet` exposes the `cabinet.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Cabinet`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `cabinet.dll` (Compression API — MSZIP / XPRESS / XPRESS-Huffman / LZMS — plus FCI/FDI Cabinet (.cab) archive creation and extraction).
- In-source docs in `structs/Cabinet.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Cabinet.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Cabinet.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/cabinet
```

## Quick Start

```ts
import Cabinet, { COMPRESS_ALGORITHM } from '@bun-win32/cabinet';

const input = Buffer.from('compress me '.repeat(64));

// Create an XPRESS-Huffman compressor (handle is returned through an out-buffer)
const hCompressor = Buffer.alloc(8);
Cabinet.CreateCompressor(COMPRESS_ALGORITHM.COMPRESS_ALGORITHM_XPRESS_HUFF, null, hCompressor.ptr);
const compressor = hCompressor.readBigUInt64LE(0);

// Sizing call: a NULL buffer reports the required size, then compress for real
const size = Buffer.alloc(8);
Cabinet.Compress(compressor, input.ptr, BigInt(input.length), null, 0n, size.ptr);
const compressed = Buffer.alloc(Number(size.readBigUInt64LE(0)));
Cabinet.Compress(compressor, input.ptr, BigInt(input.length), compressed.ptr, BigInt(compressed.length), size.ptr);
const compressedSize = Number(size.readBigUInt64LE(0));
Cabinet.CloseCompressor(compressor);

// Decompress back and verify the round trip
const hDecompressor = Buffer.alloc(8);
Cabinet.CreateDecompressor(COMPRESS_ALGORITHM.COMPRESS_ALGORITHM_XPRESS_HUFF, null, hDecompressor.ptr);
const decompressor = hDecompressor.readBigUInt64LE(0);
const restored = Buffer.alloc(input.length);
Cabinet.Decompress(decompressor, compressed.ptr, BigInt(compressedSize), restored.ptr, BigInt(restored.length), null);
Cabinet.CloseDecompressor(decompressor);

console.log(`${input.length} → ${compressedSize} bytes · round-trip ok: ${restored.equals(input)}`);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
# Live algorithm race: MSZIP vs XPRESS vs XPRESS-Huffman vs LZMS, animated
bun run example/compression-arena.ts

# Build a real .cab with FCI, then inspect + extract + verify it with FDI
bun run example/cabinet-workshop.ts
```

## Notes

- Either rely on lazy binding or call `Cabinet.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
