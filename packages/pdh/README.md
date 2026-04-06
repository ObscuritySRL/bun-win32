# @bun-win32/pdh

Zero-dependency, zero-overhead Win32 PDH bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/pdh` exposes the `pdh.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Pdh`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `pdh.dll` (performance counter queries, logs, formatting, enumeration, and more).
- In-source docs in `structs/Pdh.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Pdh.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Pdh.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/pdh
```

## Quick Start

```ts
import Pdh from '@bun-win32/pdh';

// Optionally bind a subset up-front
Pdh.Preload(['PdhOpenQueryW', 'PdhAddEnglishCounterW', 'PdhCollectQueryData', 'PdhGetFormattedCounterValue', 'PdhCloseQuery']);

// Open a real-time query
const hQuery = Buffer.alloc(8);
Pdh.PdhOpenQueryW(null, 0n, hQuery.ptr);
const query = hQuery.readBigUInt64LE(0);

// Add a CPU usage counter (English, locale-independent)
const hCounter = Buffer.alloc(8);
const counterPath = Buffer.from('\\Processor(_Total)\\% Processor Time\0', 'utf16le');
Pdh.PdhAddEnglishCounterW(query, counterPath.ptr, 0n, hCounter.ptr);
const counter = hCounter.readBigUInt64LE(0);

// Collect and format
Pdh.PdhCollectQueryData(query);

const value = Buffer.alloc(24); // PDH_FMT_COUNTERVALUE
Pdh.PdhGetFormattedCounterValue(counter, 0x0000_0200, null, value.ptr); // PDH_FMT_DOUBLE
console.log('CPU: %.1f%%', value.readDoubleLE(8));

Pdh.PdhCloseQuery(query);
```

## Examples

Run the included examples:

```sh
bun run example              # Performance counter query
```

## Notes

- Either rely on lazy binding or call `Pdh.Preload()`.
- Windows only. Bun runtime required.
