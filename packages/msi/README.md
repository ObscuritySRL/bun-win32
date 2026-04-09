# @bun-win32/msi

Zero-dependency, zero-overhead Win32 MSI bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/msi` exposes the `msi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Msi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `msi.dll` (product enumeration, install state queries, database access, patching, source lists, and more).
- In-source docs in `structs/Msi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Msi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Msi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/msi
```

## Quick Start

```ts
import Msi, { INSTALLSTATE } from '@bun-win32/msi';

// Enumerate installed products
const productBuf = Buffer.alloc(78); // 39 WCHARs (GUID + NUL)
let index = 0;

while (Msi.MsiEnumProductsW(index, productBuf.ptr) === 0) {
  const productCode = new TextDecoder('utf-16le')
    .decode(productBuf)
    .replace(/\0.*$/, '');

  const state = Msi.MsiQueryProductStateW(
    Buffer.from(productCode + '\0', 'utf16le').ptr,
  );

  if (state === INSTALLSTATE.INSTALLSTATE_DEFAULT) {
    console.log(productCode);
  }

  index++;
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:installer-audit    # Full audit of every installed product
bun run example:package-watcher    # Live product installation monitor
```

## Notes

- Either rely on lazy binding or call `Msi.Preload()`.
- `MSIHANDLE` is `number` (32-bit), **not** `bigint`. Do not confuse with kernel `HANDLE`.
- Windows only. Bun runtime required.
