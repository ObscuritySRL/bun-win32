# @bun-win32/uxtheme

Zero-dependency, zero-overhead Win32 UxTheme bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/uxtheme` exposes the `uxtheme.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Uxtheme`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `uxtheme.dll` (77 bindings covering visual styles, buffered painting, theme metrics, and themed drawing).
- In-source docs in `structs/Uxtheme.ts` with links to Microsoft Learn.
- Lazy binding on first call; optional eager preload (`Uxtheme.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases, enums, and constants (see `types/Uxtheme.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/uxtheme
```

## Quick Start

```ts
import Uxtheme, { MAX_THEMECOLOR, MAX_THEMESIZE } from '@bun-win32/uxtheme';

const themePath = Buffer.alloc(520 * 2);
const colorName = Buffer.alloc(MAX_THEMECOLOR * 2);
const sizeName = Buffer.alloc(MAX_THEMESIZE * 2);

const status = Uxtheme.GetCurrentThemeName(
  themePath.ptr,
  themePath.byteLength / 2,
  colorName.ptr,
  MAX_THEMECOLOR,
  sizeName.ptr,
  MAX_THEMESIZE,
);

if (status !== 0) {
  throw new Error(`GetCurrentThemeName failed: 0x${(status >>> 0).toString(16)}`);
}

console.log('Theme file:', themePath.toString('utf16le').replace(/\0.*$/, ''));
console.log('Color scheme:', colorName.toString('utf16le').replace(/\0.*$/, ''));
console.log('Size scheme:', sizeName.toString('utf16le').replace(/\0.*$/, ''));
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:button-cinema
bun run example:theme-audit
```

## Notes

- Either rely on lazy binding or call `Uxtheme.Preload()`.
- Windows only. Bun runtime required.
