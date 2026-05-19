# @bun-win32/cldapi

Zero-dependency, zero-overhead Win32 Cloud Filter API (`cldapi.dll`) bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/cldapi` exposes the `cldapi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Cldapi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

`cldapi.dll` is the Cloud Files API (header `cfapi.h`) — the platform behind OneDrive Files On-Demand. It lets a sync provider register a sync root, project **placeholder** files (files that appear with full size and metadata in Explorer but occupy no disk until hydrated), hydrate/dehydrate on demand, and inspect the placeholder/sync-root state of any file.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `cldapi.dll` (sync roots, placeholders, hydration, transfer keys, platform info).
- In-source docs in `structs/Cldapi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Cldapi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Cldapi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 version 1709 or later

## Installation

```sh
bun add @bun-win32/cldapi
```

## Quick Start

```ts
import Cldapi from '@bun-win32/cldapi';

// CF_PLATFORM_INFO { DWORD BuildNumber; DWORD RevisionNumber; DWORD IntegrationNumber; }
const info = Buffer.alloc(12);
const hr = Cldapi.CfGetPlatformInfo(info.ptr!);

if (hr === 0) {
  console.log('Build      :', info.readUInt32LE(0));
  console.log('Revision   :', info.readUInt32LE(4));
  console.log('Integration: 0x' + info.readUInt32LE(8).toString(16));
}

// Decode the placeholder state of any file straight from its attributes/reparse tag
const FILE_ATTRIBUTE_DIRECTORY = 0x10;
const state = Cldapi.CfGetPlaceholderStateFromAttributeTag(FILE_ATTRIBUTE_DIRECTORY, 0);
console.log('Placeholder state:', state);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example/cloud-mirage.ts
bun run example/placeholder-diagnostic.ts
```

- **cloud-mirage** — registers a real sync root in a temp directory and projects a catalog of multi-gigabyte placeholder "files" that occupy zero bytes on disk, then animates the reveal and decodes every placeholder's state. Pure FFI; no provider process.
- **placeholder-diagnostic** — a full Cloud Files report: platform version + integration capability gates, sync-root detection for any directory (OneDrive included), and per-file placeholder/pin/in-sync/on-disk-vs-logical analysis.

## Notes

- Either rely on lazy binding or call `Cldapi.Preload()`.
- `HRESULT` returns are `number`; `S_OK` is `0`. Negative-looking values are error HRESULTs — mask with `>>> 0` to print as hex.
- `CF_CONNECTION_KEY`, `CF_TRANSFER_KEY`, and `CF_REQUEST_KEY` are opaque 8-byte keys modeled as `bigint` (passed/returned by value); their `P*` pointer forms are `Pointer` out-params.
- Windows only. Bun runtime required.
