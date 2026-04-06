# @bun-win32/iphlpapi

Zero-dependency, zero-overhead Win32 IPHLPAPI bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/iphlpapi` exposes the `iphlpapi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Iphlpapi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `iphlpapi.dll` (network adapters, TCP/UDP tables, ICMP, IP routing, interface stats, and more).
- In-source docs in `structs/Iphlpapi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Iphlpapi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Iphlpapi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/iphlpapi
```

## Quick Start

```ts
import Iphlpapi from '@bun-win32/iphlpapi';

// Optionally bind a subset up-front
Iphlpapi.Preload(['GetNumberOfInterfaces', 'GetAdaptersInfo']);

// Get the number of network interfaces
const countBuf = Buffer.alloc(4);
Iphlpapi.GetNumberOfInterfaces(countBuf.ptr);
const count = countBuf.readUInt32LE(0);
console.log('Network interfaces: %d', count);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example              # Network adapter info
```

## Notes

- Either rely on lazy binding or call `Iphlpapi.Preload()`.
- Windows only. Bun runtime required.
