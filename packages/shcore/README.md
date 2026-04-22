# @bun-win32/shcore

Zero-dependency, zero-overhead Win32 SHCORE bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/shcore` exposes the `shcore.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Shcore`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `shcore.dll` (DPI awareness, scale factors, AppUserModelID, random access streams, registry helpers, and more).
- In-source docs in `structs/Shcore.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Shcore.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Shcore.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/shcore
```

## Quick Start

```ts
import Shcore, { ProcessDpiAwareness } from '@bun-win32/shcore';

// Optionally bind a subset up-front
Shcore.Preload(['SetProcessDpiAwareness', 'GetScaleFactorForDevice']);

// Opt in to per-monitor DPI awareness (0 on success)
const hr = Shcore.SetProcessDpiAwareness(ProcessDpiAwareness.PROCESS_PER_MONITOR_DPI_AWARE);
console.log('SetProcessDpiAwareness hr: 0x%s', (hr >>> 0).toString(16));

// Read the preferred scale factor for the primary display (DEVICE_PRIMARY = 0)
const scale = Shcore.GetScaleFactorForDevice(0);
console.log('Primary display scale: %d%%', scale);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:dpi-scope     # Visualize DPI, scale, and shell UI sizing
bun run example:shcore        # Process DPI awareness + AppUserModelID roundtrip
```

## Notes

- Either rely on lazy binding or call `Shcore.Preload()`.
- Windows only. Bun runtime required.
