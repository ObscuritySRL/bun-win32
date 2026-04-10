# @bun-win32/WIN32_CLASS

Zero-dependency, zero-overhead Win32 WIN32_CLASS bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/WIN32_CLASS` exposes the `WIN32_CLASS.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `WIN32_CLASS`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `WIN32_CLASS.dll` ({description}).
- In-source docs in `structs/WIN32_CLASS.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`WIN32_CLASS.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/WIN32_CLASS.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/WIN32_CLASS
```

## Quick Start

```ts
{
  quickstart;
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
{examples}
```

## Notes

- Either rely on lazy binding or call `WIN32_CLASS.Preload()`.
- Windows only. Bun runtime required.
