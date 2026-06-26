# @bun-win32/srclient

Zero-dependency, zero-overhead Win32 SRCLIENT bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/srclient` exposes the `srclient.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Srclient`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `srclient.dll` (System Restore: create restore points, remove restore points).
- In-source docs in `structs/Srclient.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Srclient.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Srclient.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/srclient
```

## Quick Start

```ts
import Srclient, { MAX_DESC_W, RestorePointEventType, RestorePointType } from '@bun-win32/srclient';

// RESTOREPOINTINFOW: DWORD dwEventType; DWORD dwRestorePtType; INT64 llSequenceNumber; WCHAR szDescription[256]
// Struct is #pragma pack(1) — 4 + 4 + 8 + (256 * 2) = 528 bytes, no padding.
const restorePtSpec = Buffer.alloc(4 + 4 + 8 + MAX_DESC_W * 2);
restorePtSpec.writeUInt32LE(RestorePointEventType.BEGIN_SYSTEM_CHANGE, 0);
restorePtSpec.writeUInt32LE(RestorePointType.MODIFY_SETTINGS, 4);
restorePtSpec.writeBigInt64LE(0n, 8); // llSequenceNumber = 0 to begin
Buffer.from('My checkpoint\0', 'utf16le').copy(restorePtSpec, 16);

// STATEMGRSTATUS: DWORD nStatus; INT64 llSequenceNumber  (pack(1) → 4 + 8 = 12 bytes)
const smgrStatus = Buffer.alloc(12);

const ok = Srclient.SRSetRestorePointW(restorePtSpec.ptr, smgrStatus.ptr);
const nStatus = smgrStatus.readUInt32LE(0);
const sequenceNumber = smgrStatus.readBigInt64LE(4);
console.log('SRSetRestorePointW -> %d, nStatus=%d, seq=%d', ok, nStatus, sequenceNumber);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:restore-point-observatory   # Live System Restore status dashboard
bun run example:restore-diagnostic          # Full System Restore configuration audit
```

> Both examples are read-only: they query System Restore state and decode return codes
> without creating or deleting restore points. They degrade gracefully when System
> Restore is disabled or access is denied.

## Notes

- Either rely on lazy binding or call `Srclient.Preload()`.
- `SRSetRestorePoint*` requires COM security initialization and an elevated context; it
  fails (returning `FALSE` with `nStatus` set) in safe mode or when System Restore is
  disabled. Applications must load `srclient.dll` dynamically (never load-time linking) —
  Bun's FFI `dlopen` already satisfies this.
- `RESTOREPOINTINFOA/W` and `STATEMGRSTATUS` are `#pragma pack(1)` — pack fields with no
  alignment padding.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
