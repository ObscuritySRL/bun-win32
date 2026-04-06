# @bun-win32/psapi

Zero-dependency, zero-overhead Win32 PSAPI bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/psapi` exposes the `psapi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Psapi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `psapi.dll` (process enumeration, module info, memory stats, working sets, device drivers, and more).
- In-source docs in `structs/Psapi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Psapi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Psapi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/psapi
```

## Quick Start

```ts
import Psapi from '@bun-win32/psapi';

// Optionally bind a subset up-front
Psapi.Preload(['EnumProcesses', 'GetModuleBaseNameW']);

// Enumerate all process IDs
const idBuffer = Buffer.alloc(4096);
const sizeNeeded = Buffer.alloc(4);

Psapi.EnumProcesses(idBuffer.ptr, idBuffer.byteLength, sizeNeeded.ptr);

const count = sizeNeeded.readUInt32LE(0) / 4;
console.log('Processes: %d', count);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example              # Process enumeration + performance info
```

## Notes

- Either rely on lazy binding or call `Psapi.Preload()`.
- Windows only. Bun runtime required.
