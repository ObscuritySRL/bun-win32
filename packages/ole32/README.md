# @bun-win32/ole32

Zero-dependency, zero-overhead Win32 Ole32 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/ole32` exposes the `ole32.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Ole32`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript. The package intentionally stays flat-FFI only: it binds exports, pointer types, and handles, but it does not wrap COM vtables or automate reference counting for returned interface pointers.

## Features

- Bun-first ergonomics on Windows 10/11.
- Direct FFI to `ole32.dll` for COM/OLE helpers, monikers, structured storage, drag-drop, and property-set utilities.
- In-source docs in `structs/Ole32.ts` with Microsoft Learn links.
- Lazy binding on first call; optional eager preload with `Ole32.Preload()`.
- No wrapper overhead; calls map 1:1 to the underlying DLL export.
- Strongly-typed Win32 aliases for storage helpers, interface pointers, handles, and wide strings.

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/ole32
```

## Quick Start

```ts
import Ole32 from '@bun-win32/ole32';

const comVersion = Ole32.CoBuildVersion();
const oleVersion = Ole32.OleBuildVersion();

console.log({ comVersion, oleVersion });
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance.

## Examples

Run the included examples:

```sh
bun run example:property-set-galaxy
bun run example:storage-audit
```

## Notes

- Use `Ole32.Preload()` when you want to front-load symbol resolution.
- Interface pointers returned from APIs like `StgOpenStorage` are raw COM pointers; callers must manage any vtable-based lifetime and method invocation themselves.
- Windows only. Bun runtime required.
