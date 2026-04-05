# @bun-win32/kernel32

Zero-dependency, zero-overhead Win32 Kernel32 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/kernel32` exposes the `kernel32.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Kernel32`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `kernel32.dll` (process, memory, files, console, time, and more).
- In-source docs in `structs/Kernel32.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Kernel32.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Kernel32.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/kernel32
```

## Quick Start

```ts
import Kernel32 from '@bun-win32/kernel32';

// Optionally bind a subset up-front
Kernel32.Preload(['GetCurrentProcessId', 'GetTickCount64']);

const pid = Kernel32.GetCurrentProcessId();
const ticks = Kernel32.GetTickCount64();

console.log('PID=%s Ticks=%s', pid, ticks.toString());
```

## Examples

Run the included examples:

```sh
bun run example              # Basic usage
bun run example:sysinfo      # System information dashboard
bun run example:processes    # Process explorer (like Task Manager)
bun run example:watcher      # File system watcher
bun run example:console      # Console color demo
```

## Notes

- Either rely on lazy binding or call `Kernel32.Preload()`.
- Windows only. Bun runtime required.
