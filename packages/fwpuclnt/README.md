# @bun-win32/fwpuclnt

Zero-dependency, zero-overhead Win32 FWPUCLNT (Windows Filtering Platform) bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/fwpuclnt` exposes the `fwpuclnt.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Fwpuclnt`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

FWPUCLNT is the user-mode Windows Filtering Platform management surface: open a session against the Base Filtering Engine (`FwpmEngineOpen0`), run explicit transactions (`FwpmTransactionBegin0` / `FwpmTransactionCommit0` / `FwpmTransactionAbort0`), and create, delete, query, enumerate, and subscribe to changes for every WFP object class — providers, provider contexts, sub-layers, layers, callouts, and filters. It also covers IPsec SA / tunnel / key-manager management, IKE/AuthIP security associations, IPsec DoS protection, ALE endpoint enumeration, net-event diagnostics, vSwitch events, dynamic keyword and system-port tracking, and the Winsock secure-socket extensions (`WSASetSocketSecurity`, `WSAQuerySocketSecurity`, …). All 199 documented `fwpmu.h` / `fwpsu.h` / `ws2tcpip.h` exports are bound.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `fwpuclnt.dll` (filter engine, providers, sub-layers, layers, callouts, filters, IPsec/IKE SAs, net-event diagnostics, secure sockets).
- In-source docs in `structs/Fwpuclnt.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Fwpuclnt.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases and enums (see `types/Fwpuclnt.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later
- Most Base Filtering Engine reads/writes require an **elevated** process.

## Installation

```sh
bun add @bun-win32/fwpuclnt
```

## Quick Start

```ts
import Fwpuclnt, { RPC_C_AUTHN_WINNT } from '@bun-win32/fwpuclnt';

const ERROR_SUCCESS = 0;

// Open a session against the Base Filtering Engine.
const engineHandleBuf = Buffer.alloc(8);
if (Fwpuclnt.FwpmEngineOpen0(null, RPC_C_AUTHN_WINNT, null, null, engineHandleBuf.ptr) === ERROR_SUCCESS) {
  const engineHandle = engineHandleBuf.readBigUInt64LE(0);

  // Enumerate every installed filter using the documented enum pattern.
  const enumHandleBuf = Buffer.alloc(8);
  Fwpuclnt.FwpmFilterCreateEnumHandle0(engineHandle, null, enumHandleBuf.ptr);
  const enumHandle = enumHandleBuf.readBigUInt64LE(0);

  const entries = Buffer.alloc(8); // receives a DLL-allocated array pointer
  const numReturned = Buffer.alloc(4);
  Fwpuclnt.FwpmFilterEnum0(engineHandle, enumHandle, 512, entries.ptr, numReturned.ptr);
  console.log('Filters in this batch:', numReturned.readUInt32LE(0));

  if (entries.readBigUInt64LE(0) !== 0n) Fwpuclnt.FwpmFreeMemory0(entries.ptr); // free DLL memory
  Fwpuclnt.FwpmFilterDestroyEnumHandle0(engineHandle, enumHandle);
  Fwpuclnt.FwpmEngineClose0(engineHandle); // always pair with FwpmEngineOpen0
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example/bfe-inventory.ts
bun run example/filter-radar.ts
```

## Notes

- Either rely on lazy binding or call `Fwpuclnt.Preload()`.
- Most functions return a Win32 / `FWP_E_*` status (`0` = `ERROR_SUCCESS`); `FwpmFreeMemory0` returns `void`.
- `FwpmEngineOpen0` returns an engine handle via an out-parameter; always release it with `FwpmEngineClose0`.
- Enumeration is a three-call pattern: `*CreateEnumHandle0` → `*Enum0` (paged) → `*DestroyEnumHandle0`. `*Enum0` allocates the result array in the DLL — free it with `FwpmFreeMemory0`.
- Reading or modifying the Base Filtering Engine generally requires elevation; non-elevated calls return `ERROR_ACCESS_DENIED` — the binding still round-trips correctly.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
