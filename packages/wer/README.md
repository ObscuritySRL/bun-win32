# @bun-win32/Wer

Zero-dependency, zero-overhead Win32 Wer bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/Wer` exposes the `wer.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Wer`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

It covers two surfaces, both exported from `wer.dll`:

- **Windows Error Reporting (`werapi.h`)** — author a crash/hang/event report (`WerReportCreate` → `WerReportSetParameter`/`WerReportAddDump`/`WerReportAddFile` → `WerReportSubmit`), and inspect the on-disk report stores (`WerStoreOpen`/`WerStoreGetReportCount`/`WerStoreGetFirstReportKey`/`WerStoreQueryReportMetadataV2`/…).
- **Wait Chain Traversal (`wct.h`)** — `OpenThreadWaitChainSession` + `GetThreadWaitChain` + `CloseThreadWaitChainSession`: the kernel deadlock-detection API that walks which thread is blocked on which lock and reports cycles.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `wer.dll` (Windows Error Reporting report authoring/stores and Wait Chain Traversal deadlock detection).
- In-source docs in `structs/Wer.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Wer.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Wer.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/wer
```

## Quick Start

```ts
import Wer, { REPORT_STORE_TYPES } from '@bun-win32/wer';

// How many crash reports are queued machine-wide, and how big are they?
const storeOut = Buffer.alloc(8);
if (Wer.WerStoreOpen(REPORT_STORE_TYPES.E_STORE_MACHINE_QUEUE, storeOut.ptr!) === 0) {
  const hStore = storeOut.readBigUInt64LE(0);

  const countOut = Buffer.alloc(4);
  Wer.WerStoreGetReportCount(hStore, countOut.ptr!);

  const sizeOut = Buffer.alloc(8);
  Wer.WerStoreGetSizeOnDisk(hStore, sizeOut.ptr!);

  console.log(`${countOut.readUInt32LE(0)} queued reports, ${sizeOut.readBigUInt64LE(0)} bytes`);
  Wer.WerStoreClose(hStore);
}

// Open a Wait Chain Traversal session (deadlock detection).
const session = Wer.OpenThreadWaitChainSession(0, null); // bigint; 0n on failure
if (session !== 0n) Wer.CloseThreadWaitChainSession(session);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example/deadlock-detector.ts
bun run example/crash-report-forensics.ts
```

- **`deadlock-detector.ts`** — spins up two real OS worker threads that wedge on a mutual mutex deadlock, then uses Wait Chain Traversal to X-ray every thread in the process live, rendering an animated ANSI thread radar and the wedged pair's wait chain.
- **`crash-report-forensics.ts`** — opens all four WER report stores, counts/measures every queued and archived crash report, enumerates each report key, and prints an aligned forensic dossier with a fault-family histogram.

## Notes

- Either rely on lazy binding or call `Wer.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
