# @bun-win32/rstrtmgr

Zero-dependency, zero-overhead Win32 Rstrtmgr bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/rstrtmgr` exposes the `rstrtmgr.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Rstrtmgr`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `rstrtmgr.dll` (Restart Manager sessions, resource registration, lock discovery, shutdown, and restart orchestration).
- In-source docs in `structs/Rstrtmgr.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Rstrtmgr.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Restart Manager aliases, enums, and constants (see `types/Rstrtmgr.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/rstrtmgr
```

## Quick Start

```ts
import Rstrtmgr, { CCH_RM_SESSION_KEY } from '@bun-win32/rstrtmgr';

const sessionHandleBuffer = Buffer.alloc(4);
const sessionKeyBuffer = Buffer.alloc((CCH_RM_SESSION_KEY + 1) * 2);

const status = Rstrtmgr.RmStartSession(sessionHandleBuffer.ptr, 0, sessionKeyBuffer.ptr);
if (status !== 0) {
  throw new Error(`RmStartSession failed: ${status}`);
}

const sessionHandle = sessionHandleBuffer.readUInt32LE(0);
const sessionKey = sessionKeyBuffer.toString('utf16le').replace(/\0.*$/, '');

console.log({ sessionHandle, sessionKey });

Rstrtmgr.RmEndSession(sessionHandle);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:lock-atlas
bun run example:session-audit
```

## Notes

- Either rely on lazy binding or call `Rstrtmgr.Preload()`.
- `RmReserveHeap` is exported by `rstrtmgr.dll` but omitted here because it is undocumented in `RestartManager.h` and Microsoft Learn.
- Windows only. Bun runtime required.
