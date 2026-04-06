# @bun-win32/opengl32

Zero-dependency, zero-overhead OpenGL 1.1 + WGL bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/opengl32` exposes the OpenGL 1.1 and WGL entry points exported by `opengl32.dll` using [Bun](https://bun.sh)'s FFI. It provides a single class, `OpenGL32`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `opengl32.dll` (OpenGL 1.1 + WGL).
- In-source docs in `structs/OpenGL32.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`OpenGL32.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/OpenGL32.ts`).

## Requirements

- A current OpenGL context for most `gl*` calls (via WGL or your windowing library)
- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/opengl32
```

## Quick Start

```ts
import OpenGL32, { GLenum } from '@bun-win32/opengl32';

// Option A: call methods directly (lazy bind on first use)
OpenGL32.glMatrixMode(GLenum.GL_MODELVIEW);

// Option B: bind a subset (or everything) up-front
OpenGL32.Preload(['glMatrixMode', 'glClear', 'wglGetProcAddress']);

// If you already have a current context, you can query strings:
// const vendorPtr = OpenGL32.glGetString(GLenum.GL_VENDOR);
// Convert the returned C string pointer to a JS string with your FFI helper.
```

## OpenGL Extensions

OpenGL extensions (OpenGL 1.5+, 2.0+, etc.) are not exported by `opengl32.dll` and must be loaded at runtime via `wglGetProcAddress`. This package provides built-in support for common extensions.

**Important**: Extensions require an active OpenGL context. Call `PreloadExtensions()` only after `wglMakeCurrent()` succeeds.

```ts
// 1. Create and activate an OpenGL context first
const hglrc = OpenGL32.wglCreateContext(hdc);
OpenGL32.wglMakeCurrent(hdc, hglrc);

// 2. Now preload extensions (context must be current!)
OpenGL32.PreloadExtensions(['wglSwapIntervalEXT', 'glGenBuffers', 'glCreateShader']);

// Or preload all available extensions at once
OpenGL32.PreloadExtensions();

// 3. Use extensions directly
OpenGL32.wglSwapIntervalEXT(1); // Enable VSync
```

### Available Extensions

- **WGL**: `wglSwapIntervalEXT`, `wglGetSwapIntervalEXT`, `wglChoosePixelFormatARB`, `wglCreateContextAttribsARB`, `wglGetExtensionsStringARB`, `wglGetExtensionsStringEXT`
- **VBO** (OpenGL 1.5+): `glGenBuffers`, `glBindBuffer`, `glBufferData`, `glDeleteBuffers`, `glMapBuffer`, `glUnmapBuffer`, etc.
- **Shaders** (OpenGL 2.0+): `glCreateShader`, `glCompileShader`, `glCreateProgram`, `glLinkProgram`, `glUseProgram`, `glUniform*`, etc.
- **VAO** (OpenGL 3.0+): `glGenVertexArrays`, `glBindVertexArray`, `glDeleteVertexArrays`
- **FBO** (OpenGL 3.0+): `glGenFramebuffers`, `glBindFramebuffer`, `glFramebufferTexture2D`, `glCheckFramebufferStatus`, etc.

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example              # Basic OpenGL32 usage
bun run example:circle       # Bouncing circle demo
bun run example:physics      # Physics simulation
bun run example:pendulum     # N-pendulum demo
```

## Notes

- Either rely on lazy binding or call `OpenGL32.Preload()`.
- Most `gl*` entry points require a current context; without one they may no-op or fail.
- Extensions and newer functionality must be loaded via `wglGetProcAddress`.
- Windows only. Bun runtime required.
