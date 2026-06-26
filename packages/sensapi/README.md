# @bun-win32/sensapi

Zero-dependency, zero-overhead Win32 Sensapi bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/sensapi` exposes the `sensapi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Sensapi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `sensapi.dll` (System Event Notification Service connectivity checks — `IsNetworkAlive`, `IsDestinationReachable`).
- In-source docs in `structs/Sensapi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Sensapi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Sensapi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/sensapi
```

## Quick Start

```ts
import Sensapi, { NetworkAliveFlags } from '@bun-win32/sensapi';

Sensapi.Preload(['IsNetworkAlive']);

const flagsBuffer = Buffer.alloc(4);
const alive = Sensapi.IsNetworkAlive(flagsBuffer.ptr);
const flags = flagsBuffer.readUInt32LE(0);

if (alive === 0) {
  console.log('No active network connection');
} else {
  const parts: string[] = [];

  if ((flags & NetworkAliveFlags.NETWORK_ALIVE_LAN) !== 0) parts.push('LAN');
  if ((flags & NetworkAliveFlags.NETWORK_ALIVE_WAN) !== 0) parts.push('WAN');
  if ((flags & NetworkAliveFlags.NETWORK_ALIVE_AOL) !== 0) parts.push('AOL');
  if ((flags & NetworkAliveFlags.NETWORK_ALIVE_INTERNET) !== 0) parts.push('Internet');

  console.log(`Network alive: ${parts.join(', ') || '(unknown)'} (flags=0x${flags.toString(16).padStart(8, '0')})`);
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:network-diag
bun run example:link-sentinel
```

## Notes

- Either rely on lazy binding or call `Sensapi.Preload()`.
- Windows only. Bun runtime required.
- `IsDestinationReachable[AW]` is documented as unsupported on Windows Vista and later — Microsoft's guidance is to use the Network List Manager for new code. The binding is still exposed because the export exists and the call is still well-defined (`GetLastError` returns `ERROR_CALL_NOT_IMPLEMENTED`).
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
