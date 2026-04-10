# @bun-win32/dbghelp

Zero-dependency, zero-overhead Win32 Dbghelp bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/dbghelp` exposes the `dbghelp.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Dbghelp`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `dbghelp.dll` (symbol engine, stack walking, minidumps, image helpers, and source-level debugging).
- In-source docs in `structs/Dbghelp.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Dbghelp.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Dbghelp aliases, enums, and constants (see `types/Dbghelp.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/dbghelp
```

## Quick Start

```ts
import Dbghelp, { SYMOPT_UNDNAME, SYMOPT_DEFERRED_LOADS } from '@bun-win32/dbghelp';

const hProcess = BigInt(process.pid);

Dbghelp.SymSetOptions(SYMOPT_UNDNAME | SYMOPT_DEFERRED_LOADS);

if (!Dbghelp.SymInitialize(hProcess, null, 1)) {
  throw new Error('SymInitialize failed');
}

try {
  const opts = Dbghelp.SymGetOptions();
  console.log(`Symbol options: 0x${opts.toString(16).padStart(8, '0')}`);
} finally {
  Dbghelp.SymCleanup(hProcess);
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:symbol-explorer
bun run example:crash-report
```

## Notes

- Either rely on lazy binding or call `Dbghelp.Preload()`.
- `MiniDumpWriteDump` and `MiniDumpReadDumpStream` are forwarded to `dbgcore.dll` at the DLL level; the bindings load them from `dbghelp.dll` transparently.
- Windows only. Bun runtime required.
