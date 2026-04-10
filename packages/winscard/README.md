# @bun-win32/winscard

Zero-dependency, zero-overhead Win32 WinSCard bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/winscard` exposes the `winscard.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `WinSCard`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `winscard.dll` (smart cards, readers, contexts, status changes, and APDU transport).
- In-source docs in `structs/WinSCard.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`WinSCard.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed WinSCard aliases (see `types/WinSCard.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/winscard
```

## Quick Start

```ts
import WinSCard, { SCARD_SCOPE } from '@bun-win32/winscard';

const contextHandleBuffer = Buffer.alloc(8);
const status = WinSCard.SCardEstablishContext(SCARD_SCOPE.SYSTEM, null, null, contextHandleBuffer.ptr);

if (status !== 0) {
  throw new Error(`SCardEstablishContext failed: 0x${status.toString(16)}`);
}

const contextHandle = contextHandleBuffer.readBigUInt64LE(0);
console.log({ contextHandle });

WinSCard.SCardReleaseContext(contextHandle);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:reader-radar
bun run example:smart-card-diagnostic
```

## Notes

- Either rely on lazy binding or call `WinSCard.Preload()`.
- The documented `g_rgSCard*Pci` data exports are not surfaced as callable bindings; construct your own `SCARD_IO_REQUEST` buffer when calling `SCardTransmit`.
- Windows only. Bun runtime required.
