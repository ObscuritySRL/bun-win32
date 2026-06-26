# @bun-win32/amsi

Zero-dependency, zero-overhead Win32 AMSI bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/amsi` exposes the `amsi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Amsi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The Antimalware Scan Interface (AMSI) lets an application submit arbitrary content — scripts, buffers, downloaded payloads — to the registered antivirus provider (Windows Defender by default) for in-process scanning, with no temp files and no shelling out. It is the same pipeline PowerShell, WScript, and Office use.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `amsi.dll` (in-process malware scanning via the registered AV provider).
- In-source docs in `structs/Amsi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Amsi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Amsi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/amsi
```

## Quick Start

```ts
import Amsi, { AMSI_RESULT } from '@bun-win32/amsi';

const ctxBuf = Buffer.alloc(8);
if (Amsi.AmsiInitialize(Buffer.from('MyApp\0', 'utf16le').ptr, ctxBuf.ptr) === 0) {
  const ctx = ctxBuf.readBigUInt64LE(0);

  const result = Buffer.alloc(4);
  const content = Buffer.from('console.log("hello")\0', 'utf16le');
  Amsi.AmsiScanString(ctx, content.ptr, Buffer.from('snippet\0', 'utf16le').ptr, 0n, result.ptr);

  const code = result.readInt32LE(0);
  const isMalware = code >= AMSI_RESULT.AMSI_RESULT_DETECTED;
  console.log(isMalware ? 'BLOCK' : 'allow', `(AMSI_RESULT=${code})`);

  Amsi.AmsiUninitialize(ctx); // always pair with AmsiInitialize
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example/malware-scanner.ts
bun run example/amsi-diagnostic.ts
```

## Notes

- Either rely on lazy binding or call `Amsi.Preload()`.
- Always pair `AmsiInitialize` with `AmsiUninitialize`, and `AmsiOpenSession` with `AmsiCloseSession`.
- `result` is an out-pointer to an `AMSI_RESULT` (`Int32`): use `AmsiResultIsMalware` semantics — `code >= AMSI_RESULT_DETECTED` (32768) means block.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
