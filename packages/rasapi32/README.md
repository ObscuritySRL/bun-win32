# @bun-win32/rasapi32

Zero-dependency, zero-overhead Win32 Rasapi32 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/rasapi32` exposes the `rasapi32.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Rasapi32`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `rasapi32.dll` (RAS dial-up, VPN, phonebook entries, connection management, projection info, and statistics).
- In-source docs in `structs/Rasapi32.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Rasapi32.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Rasapi32.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/rasapi32
```

## Quick Start

```ts
import Rasapi32 from '@bun-win32/rasapi32';

// Optionally bind a subset up-front
Rasapi32.Preload(['RasEnumConnectionsW', 'RasGetErrorStringW']);

// How many RAS (dial-up/VPN) connections are active right now?
const cb = Buffer.alloc(4);
const count = Buffer.alloc(4);
// First call with a NULL buffer: a return of 0 with count 0 means none active.
Rasapi32.RasEnumConnectionsW(null, cb.ptr, count.ptr);
console.log('Active RAS connections: %d', count.readUInt32LE(0));

// Translate a RAS error code (691 = bad username/password) to a message.
const msg = Buffer.alloc(512);
Rasapi32.RasGetErrorStringW(691, msg.ptr, 256);
console.log(new TextDecoder('utf-16le').decode(msg).replace(/\0.*$/, ''));
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:dialup-screech    # Animated retro dial-up handshake visualizer
bun run example:ras-diagnostic    # Full RAS subsystem diagnostic report
```

## Notes

- Either rely on lazy binding or call `Rasapi32.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
