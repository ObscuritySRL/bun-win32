# @bun-win32/version

Zero-dependency, zero-overhead Win32 Version bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/version` exposes the `version.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Version`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `version.dll` (file version resources, translation tables, and installer helpers).
- In-source docs in `structs/Version.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Version.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Version.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/version
```

## Quick Start

```ts
import { read, toArrayBuffer } from 'bun:ffi';

import Version from '@bun-win32/version';

Version.Preload(['GetFileVersionInfoSizeW', 'GetFileVersionInfoW', 'VerQueryValueW']);

const filePath = Buffer.from(process.execPath + '\0', 'utf16le');
const versionInfoSize = Version.GetFileVersionInfoSizeW(filePath.ptr, null);

if (versionInfoSize === 0) {
  throw new Error('GetFileVersionInfoSizeW failed');
}

const versionInfoBuffer = Buffer.alloc(versionInfoSize);
const loaded = Version.GetFileVersionInfoW(filePath.ptr, 0, versionInfoSize, versionInfoBuffer.ptr);

if (loaded === 0) {
  throw new Error('GetFileVersionInfoW failed');
}

const fixedInfoPointerBuffer = Buffer.alloc(8);
const fixedInfoLengthBuffer = Buffer.alloc(4);
const rootSubBlock = Buffer.from('\\\0', 'utf16le');
const queried = Version.VerQueryValueW(versionInfoBuffer.ptr, rootSubBlock.ptr, fixedInfoPointerBuffer.ptr, fixedInfoLengthBuffer.ptr);

if (queried === 0) {
  throw new Error('VerQueryValueW failed');
}

const fixedInfoPointer = read.ptr(fixedInfoPointerBuffer.ptr);

if (fixedInfoPointer === null) {
  throw new Error('VerQueryValueW returned a null pointer');
}

const fixedInfoBuffer = Buffer.from(toArrayBuffer(fixedInfoPointer, 0, fixedInfoLengthBuffer.readUInt32LE(0)));
const fileVersionMajor = fixedInfoBuffer.readUInt16LE(10);
const fileVersionMinor = fixedInfoBuffer.readUInt16LE(8);
const fileVersionBuild = fixedInfoBuffer.readUInt16LE(14);
const fileVersionRevision = fixedInfoBuffer.readUInt16LE(12);

console.log(`Version resource: ${fileVersionMajor}.${fileVersionMinor}.${fileVersionBuild}.${fileVersionRevision}`);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:file-version-audit
bun run example:version-skyline
```

## Notes

- Either rely on lazy binding or call `Version.Preload()`.
- Windows only. Bun runtime required.
