# @bun-win32/Vssapi

Zero-dependency, zero-overhead Win32 Vssapi bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/Vssapi` exposes the `Vssapi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Vssapi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `Vssapi.dll` (Volume Shadow Copy Service backup and snapshot APIs).
- In-source docs in `structs/Vssapi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Vssapi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Vssapi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/Vssapi
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

- Either rely on lazy binding or call `Vssapi.Preload()`.
- Windows only. Bun runtime required.
