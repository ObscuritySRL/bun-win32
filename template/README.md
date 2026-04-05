# @bun-win32/{name}

Zero-dependency, zero-overhead Win32 {Name} bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/{name}` exposes the `{name}.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `{Class}`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `{name}.dll` ({description}).
- In-source docs in `structs/{Class}.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`{Class}.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/{Class}.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/{name}
```

## Quick Start

```ts
{quickstart}
```

## Examples

Run the included examples:

```sh
{examples}
```

## Notes

- Either rely on lazy binding or call `{Class}.Preload()`.
- Windows only. Bun runtime required.
