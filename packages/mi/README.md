# @bun-win32/mi

Zero-dependency, zero-overhead Win32 Windows Management Infrastructure bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/mi` exposes the documented callable export from `mi.dll` using [Bun](https://bun.sh)'s FFI. It provides a single class, `Mi`, which lazily binds native symbols on first use. You can optionally preload the export up-front via `Preload()`.

The package intentionally binds the callable bootstrap entry point, `MI_Application_InitializeV1`. The global `mi_clientFT_V1` symbol is also exported by `mi.dll`, but it is exported data rather than a callable function, so it is documented and inspected in the examples instead of being surfaced as a `Win32.Load()` method.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `mi.dll` (Windows Management Infrastructure client bootstrap).
- In-source docs in `structs/Mi.ts` with links to Microsoft Learn.
- Lazy binding on first call; optional eager preload (`Mi.Preload()`).
- No wrapper overhead; calls map 1:1 to native exports.
- Strongly-typed MI result codes and pointer aliases (see `types/Mi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/mi @bun-win32/kernel32
```

`@bun-win32/kernel32` is used in the runnable examples below to follow the inline `MI_Application_Close` path from `mi.h`.

## Quick Start

```ts
import { FFIType, linkSymbols } from 'bun:ffi';

import Mi, { MI_Result } from '@bun-win32/mi';
import Kernel32 from '@bun-win32/kernel32';

const MI_APPLICATION_FUNCTION_TABLE_OFFSET = 0x10;
const MI_APPLICATION_SIZE = 0x18;
const POINTER_SIZE = 0x08;
const currentProcessHandle = Kernel32.GetCurrentProcess();

function createWideStringBuffer(value: string): Buffer {
  return Buffer.from(value + '\0', 'utf16le');
}

function readPointerValue(address: bigint): bigint {
  const buffer = Buffer.alloc(POINTER_SIZE);
  const readResult = Kernel32.ReadProcessMemory(currentProcessHandle, address, buffer.ptr, BigInt(buffer.length), 0n);

  if (readResult === 0) {
    throw new Error(`ReadProcessMemory failed with ${Kernel32.GetLastError()}`);
  }

  return buffer.readBigUInt64LE(0);
}

function closeApplication(applicationBuffer: Buffer): MI_Result {
  const applicationFunctionTableAddress = applicationBuffer.readBigUInt64LE(MI_APPLICATION_FUNCTION_TABLE_OFFSET);
  const closeProcedureAddress = readPointerValue(applicationFunctionTableAddress);
  const closeLibrary = linkSymbols({
    Close: {
      ptr: closeProcedureAddress,
      args: [FFIType.ptr],
      returns: FFIType.u32,
    },
  });

  try {
    return closeLibrary.symbols.Close(applicationBuffer.ptr);
  } finally {
    closeLibrary.close();
  }
}

Mi.Preload('MI_Application_InitializeV1');
Kernel32.Preload(['GetCurrentProcess', 'GetLastError', 'ReadProcessMemory']);

const applicationID = createWideStringBuffer('example/bun-win32/mi');
const extendedErrorBuffer = Buffer.alloc(POINTER_SIZE);
const applicationBuffer = Buffer.alloc(MI_APPLICATION_SIZE);
const initializeStatus = Mi.MI_Application_InitializeV1(0, applicationID.ptr, extendedErrorBuffer.ptr, applicationBuffer.ptr);

if (initializeStatus !== MI_Result.MI_RESULT_OK) {
  throw new Error(`MI_Application_InitializeV1 failed with ${initializeStatus}`);
}

const closeStatus = closeApplication(applicationBuffer);
console.log(`Initialize: ${MI_Result[initializeStatus]}`);
console.log(`Close: ${MI_Result[closeStatus]}`);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:mi-bootstrap-beacon
bun run example:mi-client-audit
```

## Notes

- `MI_Application_InitializeV1` is the only callable export in `mi.dll`.
- `MI_Application_Close` is inline in `mi.h`, so shutdown happens through the returned `MI_Application.ft` function table rather than a second DLL export.
- `mi_clientFT_V1` is exported data. `GetProcAddress` returns the address of the exported pointer variable, so dereference it once to reach the actual `MI_ClientFT_V1` table, as shown in `example/mi-client-audit.ts`.
- Windows only. Bun runtime required.
