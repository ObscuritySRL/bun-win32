# @bun-win32/clfsw32

Zero-dependency, zero-overhead Win32 Clfsw32 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/clfsw32` exposes the `clfsw32.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Clfsw32`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

It binds all 53 documented Common Log File System user-mode APIs — the `clfsw32.h` log/container/marshaling/archive surface plus the `clfsmgmtw32.h` management surface — for high-performance transactional write-ahead logging, the same engine that backs TxF, TxR, and Kernel Transaction Manager.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `clfsw32.dll` (Common Log File System: log files, containers, marshaling areas, records, LSN algebra, archival, and CLFS management policy).
- In-source docs in `structs/Clfsw32.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Clfsw32.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Clfsw32.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

> [!NOTE]
> `CreateLogFile`, `ValidateLog`, and the LSN-algebra functions work from a standard token. Creating containers and appending records (`AddLogContainer`, `CreateLogMarshallingArea`, `ReserveAndAppendLog`, the CLFS management APIs) flow through `CLFS.sys` and require an **elevated** process; unelevated they return `ERROR_ACCESS_DENIED`.

## Installation

```sh
bun add @bun-win32/clfsw32
```

## Quick Start

```ts
import Clfsw32, { GENERIC_READ, GENERIC_WRITE, INVALID_HANDLE_VALUE, OPEN_ALWAYS } from '@bun-win32/clfsw32';

// CLFS appends ".blf"; the "LOG:" prefix selects the dedicated-log namespace.
const name = Buffer.from('LOG:C:\\Temp\\demo\0', 'utf16le');

const hLog = Clfsw32.CreateLogFile(name.ptr, GENERIC_READ | GENERIC_WRITE, 0, null, OPEN_ALWAYS, 0);
if (hLog !== INVALID_HANDLE_VALUE) {
  // Validate the on-disk log metadata.
  console.log('valid:', Clfsw32.ValidateLog(name.ptr, null, null, Buffer.alloc(4).ptr) !== 0);

  // CLFS_LSN is an 8-byte value returned by value; compose then decompose one.
  const lsn = Clfsw32.LsnCreate(5, 0x2000, 7); // -> bigint
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(lsn, 0);
  console.log(Clfsw32.LsnContainer(buf.ptr), Clfsw32.LsnBlockOffset(buf.ptr), Clfsw32.LsnRecordSequence(buf.ptr));

  Clfsw32.DeleteLogFile(name.ptr, null);
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:diagnostic   # thorough CLFS subsystem diagnostic + LSN ABI proof
bun run example:ledger       # animated write-ahead-log / LSN cartographer
```

## Notes

- Either rely on lazy binding or call `Clfsw32.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
