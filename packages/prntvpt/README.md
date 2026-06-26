# @bun-win32/prntvpt

Zero-dependency, zero-overhead Win32 Prntvpt bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/prntvpt` exposes the `prntvpt.dll` exports — the Print Ticket / Print Schema API — using [Bun](https://bun.sh)'s FFI. It provides a single class, `Prntvpt`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The Print Ticket API is the modern, XML Print Schema way to inspect and manipulate print settings: query a printer's full PrintCapabilities, convert between the legacy `DEVMODE` blob and a Print Ticket, and merge + validate delta tickets against the live driver. No more shelling out to PowerShell or hand-rolling `DEVMODE` structs.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `prntvpt.dll` (Print Ticket providers, PrintCapabilities, DEVMODE ⇄ Print Ticket conversion, merge & validate, schema-version query).
- All 11 documented `prntvpt.h` functions plus the standard `Dll*` COM-server entries.
- In-source docs in `structs/Prntvpt.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Prntvpt.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases plus the `EPrintTicketScope` / `EDefaultDevmodeType` enums and the Print Ticket `HRESULT` constants (see `types/Prntvpt.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/prntvpt
```

## Quick Start

```ts
import Prntvpt from '@bun-win32/prntvpt';
import Shlwapi from '@bun-win32/shlwapi';
import Ole32 from '@bun-win32/ole32';

Ole32.CoInitialize(null);

const printer = Buffer.from('Microsoft Print to PDF\0', 'utf16le');

// Highest Print Schema version this queue supports.
const maxVer = Buffer.alloc(4);
Prntvpt.PTQuerySchemaVersionSupport(printer.ptr!, maxVer.ptr!);
console.log('Print Schema version:', maxVer.readUInt32LE(0));

// Open a provider and pull the driver's PrintCapabilities XML.
const phProvider = Buffer.alloc(8);
Prntvpt.PTOpenProvider(printer.ptr!, maxVer.readUInt32LE(0) || 1, phProvider.ptr!);
const hProvider = phProvider.readBigUInt64LE(0);

// IStream* tokens are opaque bigints; SHCreateMemStream gives us one.
const caps = BigInt(Shlwapi.SHCreateMemStream(null, 0));
const hr = Prntvpt.PTGetPrintCapabilities(hProvider, 0n, caps, null);
console.log('PTGetPrintCapabilities → 0x' + (hr >>> 0).toString(16));

Prntvpt.PTCloseProvider(hProvider);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:print-capabilities-report
bun run example:print-ticket-studio
```

- **print-capabilities-report** — a thorough diagnostic: enumerates the printer roster, then for the default printer queries its Print Schema version and decodes the full driver-authored `PrintCapabilities` (and Win10 1703+ `PrintDeviceCapabilities`) document into aligned Feature / Option / ParameterDef tables, with every HRESULT decoded by name.
- **print-ticket-studio** — a live, animated round-trip: takes the default printer's real `DEVMODE`, converts it to a Print Ticket and X-rays the syntax-highlighted Print Schema XML, forges a delta ticket that flips the page to Landscape, merges + validates it (decoding the `S_PT_CONFLICT_RESOLVED` / `S_PT_NO_CONFLICT` verdict), then converts the merged ticket back into a fresh driver-allocated `DEVMODE` read out with `ReadProcessMemory` and freed with `PTReleaseMemory`.

## Notes

- COM `IStream*` parameters are opaque `bigint` tokens. Create one with `Shlwapi.SHCreateMemStream` (or `ole32`); read produced XML back by invoking the stream's vtable (`Seek` + `Read`).
- Call `Ole32.CoInitialize` (or `CoInitializeEx`) before using a Print Ticket provider.
- `PTConvertPrintTicketToDevMode` returns a `DEVMODE` the **driver** allocated. It comes back as a `bigint` address — read it with `ReadProcessMemory` and release it with `PTReleaseMemory`.
- `PTOpenProvider` handles are thread-affine: open, use, and close on the same thread.
- Either rely on lazy binding or call `Prntvpt.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
