# @bun-win32/shell32

Zero-dependency, zero-overhead Win32 SHELL32 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/shell32` exposes the `shell32.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Shell32`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `shell32.dll` (~250 bindings covering shell operations, file management, notifications, drag-and-drop, and more).
- In-source docs in `structs/Shell32.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Shell32.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Shell32.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/shell32
```

## Quick Start

```ts
import Shell32 from '@bun-win32/shell32';

// Optionally bind a subset up-front
Shell32.Preload(['SHGetFolderPathW', 'IsUserAnAdmin', 'CommandLineToArgvW']);

// Check admin status
const isAdmin = Shell32.IsUserAnAdmin();
console.log('Admin:', !!isAdmin);

// Get APPDATA path (CSIDL_APPDATA = 0x001A)
const pathBuf = Buffer.alloc(520);
Shell32.SHGetFolderPathW(0n, 0x001a, 0n, 0, pathBuf.ptr);
console.log('APPDATA:', pathBuf.toString('utf16le').replace(/\0+$/, ''));
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included example:

```sh
bun run example              # Admin check, folder paths, command-line parsing, recycle bin info
```

## Notes

- Either rely on lazy binding or call `Shell32.Preload()`.
- Windows only. Bun runtime required.
