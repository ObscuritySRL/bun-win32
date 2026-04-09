# @bun-win32/wevtapi

Zero-dependency, zero-overhead Win32 Wevtapi bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/wevtapi` exposes the `wevtapi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Wevtapi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `wevtapi.dll` (Windows Event Log queries, rendering, subscriptions, channel configuration, and publisher metadata).
- In-source docs in `structs/Wevtapi.ts` with links to Microsoft Learn.
- Lazy binding on first call; optional eager preload (`Wevtapi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases, enums, and constants (see `types/Wevtapi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/wevtapi
```

## Quick Start

```ts
import Wevtapi, { EvtQueryFlags } from '@bun-win32/wevtapi';

const channelPath = Buffer.from('System\0', 'utf16le');
const query = Buffer.from('*\0', 'utf16le');
const resultSet = Wevtapi.EvtQuery(0n, channelPath.ptr, query.ptr, EvtQueryFlags.EvtQueryChannelPath);

if (resultSet === 0n) {
  throw new Error('EvtQuery failed');
}

Wevtapi.EvtClose(resultSet);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:event-tail
bun run example:channel-report
```

## Notes

- Either rely on lazy binding or call `Wevtapi.Preload()`.
- Windows only. Bun runtime required.
