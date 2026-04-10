# @bun-win32/normaliz

Zero-dependency, zero-overhead Win32 Normaliz bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/normaliz` exposes the `normaliz.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Normaliz`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `normaliz.dll` (internationalized domain names, Nameprep, and Unicode normalization).
- In-source docs in `structs/Normaliz.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Normaliz.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Normaliz.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/normaliz
```

## Quick Start

```ts
import Normaliz, { NormalizationForm } from '@bun-win32/normaliz';

const source = Buffer.from('e\u0301\0', 'utf16le');
const bufferLengthEstimate = Normaliz.NormalizeString(NormalizationForm.NormalizationC, source.ptr!, -1, null, 0);

if (bufferLengthEstimate <= 0) {
  throw new Error('NormalizeString sizing call failed');
}

const destination = Buffer.alloc(bufferLengthEstimate * 2);
const writtenLength = Normaliz.NormalizeString(NormalizationForm.NormalizationC, source.ptr!, -1, destination.ptr!, bufferLengthEstimate);

if (writtenLength <= 0) {
  throw new Error('NormalizeString failed');
}

const normalized = destination.toString('utf16le').replace(/\0.*$/, '');
console.log(normalized); // "é"
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:address-bar-pipeline
bun run example:normalization-audit
```

## Notes

- Either rely on lazy binding or call `Normaliz.Preload()`.
- Windows only. Bun runtime required.
