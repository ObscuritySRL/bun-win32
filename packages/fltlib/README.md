# @bun-win32/Fltlib

Zero-dependency, zero-overhead Win32 Fltlib bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/Fltlib` exposes the `fltlib.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Fltlib`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

`fltlib.dll` is the user-mode library for the Windows **Filter Manager** (`fltuser.h`) — the subsystem `fltmc.exe` drives. It covers minifilter / instance / volume / volume-instance enumeration, per-filter and per-instance information queries, MS-DOS volume-name resolution, dynamic minifilter load/unload, attach/detach, handle creation, and the kernel minifilter communication-port message channel.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `fltlib.dll` (Filter Manager minifilter/instance/volume enumeration and minifilter communication ports).
- In-source docs in `structs/Fltlib.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Fltlib.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Fltlib.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later
- Enumeration/management calls require an **elevated** (Administrator) process — the same restriction `fltmc` carries. Unelevated, calls execute and return `HRESULT_FROM_WIN32(ERROR_ACCESS_DENIED)` (`0x80070005`).

## Installation

```sh
bun add @bun-win32/fltlib
```

## Quick Start

```ts
import Fltlib, { FILTER_INFORMATION_CLASS } from '@bun-win32/fltlib';

// Enumerate every registered minifilter (run elevated).
const buf = Buffer.alloc(64 * 1024);
const bytes = Buffer.alloc(4);
const hFind = Buffer.alloc(8);

let hr = Fltlib.FilterFindFirst(FILTER_INFORMATION_CLASS.FilterFullInformation, buf.ptr!, buf.length, bytes.ptr!, hFind.ptr!);
while (hr === 0) {
  // FILTER_FULL_INFORMATION: FrameID@4, NumberOfInstances@8, FilterNameLength@12, name@14
  const nameLen = buf.readUInt16LE(12);
  console.log(buf.subarray(14, 14 + nameLen).toString('utf16le'));
  hr = Fltlib.FilterFindNext(hFind.readBigUInt64LE(0), FILTER_INFORMATION_CLASS.FilterFullInformation, buf.ptr!, buf.length, bytes.ptr!);
}
Fltlib.FilterFindClose(hFind.readBigUInt64LE(0));
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples (run elevated for the live data):

```sh
bun run example/filter-radar.ts
bun run example/minifilter-census.ts
```

- **`filter-radar.ts`** — a live animated ANSI radar of the file-system filter stack: every minifilter rendered as a vendor-tinted bar at its real altitude with a sweeping scan line. Unelevated, it honestly animates an access gate.
- **`minifilter-census.ts`** — a complete aligned forensic enumeration of every minifilter, its instances (volume + altitude + instance name), and every volume known to the Filter Manager — the picture `fltmc` paints, pure FFI.

## Notes

- Either rely on lazy binding or call `Fltlib.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
