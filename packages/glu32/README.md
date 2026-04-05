# @bun-win32/glu32

Zero-dependency, zero-overhead Win32 GLU32 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/glu32` exposes the `glu32.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `GLU32`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `glu32.dll` (quadrics, tessellation, NURBS, sampling, and matrix helpers).
- In-source docs in `structs/GLU32.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`GLU32.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/GLU32.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/glu32
```

## Quick Start

```ts
import GLU32 from '@bun-win32/glu32';

GLU32.Preload(['gluSphere', 'gluDisk']);

// GLU32.gluNewQuadric() will be loaded here
const quadric = GLU32.gluNewQuadric();

// GLU32.gluSphere() was already loaded
GLU32.gluSphere(quadric, 1.0, 32, 32);

// GLU32.gluDeleteQuadric() will be loaded here
GLU32.gluDeleteQuadric(quadric);
```

## Examples

Run the included examples:

```sh
bun run example              # Basic GLU32 usage
bun run demo                 # Comprehensive demo (quadrics, tessellators, NURBS, projection)
```

## Notes

- Either rely on lazy binding or call `GLU32.Preload()`.
- Windows only. Bun runtime required.
