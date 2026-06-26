# @bun-win32/tdh

Zero-dependency, zero-overhead Win32 TDH bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/tdh` exposes the `tdh.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Tdh`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

`tdh.dll` is the **Trace Data Helper** — the decoding layer for Event Tracing for Windows (ETW). It turns the opaque binary `EVENT_RECORD`s delivered by an ETW session into structured, named, human-readable data, and enumerates the providers and event schemas registered on the machine. Pair it with `@bun-win32/advapi32` (`StartTrace` / `OpenTrace` / `ProcessTrace`) to build a complete trace consumer.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `tdh.dll` (ETW event metadata, property formatting, provider/field/event-schema enumeration, value/bitmap decoding, manifest loading, and payload filters).
- In-source docs in `structs/Tdh.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Tdh.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Tdh.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/tdh
```

## Quick Start

```ts
import Tdh from '@bun-win32/tdh';

// Optionally bind a subset up-front
Tdh.Preload(['TdhEnumerateProviders']);

// Two-call sizing pattern: first NULL to learn the size, then allocate.
const bufferSize = Buffer.alloc(4);

// ERROR_INSUFFICIENT_BUFFER (122) on the sizing call is expected.
Tdh.TdhEnumerateProviders(null, bufferSize.ptr);

const buffer = Buffer.alloc(bufferSize.readUInt32LE(0));
const status = Tdh.TdhEnumerateProviders(buffer.ptr, bufferSize.ptr);

if (status === 0) {
  // PROVIDER_ENUMERATION_INFO: ULONG NumberOfProviders; ULONG Reserved; TRACE_PROVIDER_INFO[]
  console.log('Registered ETW providers: %d', buffer.readUInt32LE(0));
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:etw-live-monitor     # Live, color-coded ETW event stream (cross-package with advapi32)
bun run example:provider-explorer    # Full ETW provider + event-schema enumeration report
```

## Notes

- Either rely on lazy binding or call `Tdh.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
