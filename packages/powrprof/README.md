# @bun-win32/powrprof

Zero-dependency, zero-overhead Win32 PowrProf bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/powrprof` exposes the `powrprof.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `PowrProf`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `powrprof.dll` (power schemes, policies, sleep states, and battery management).
- In-source docs in `structs/PowrProf.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`PowrProf.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/PowrProf.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/powrprof
```

## Quick Start

```ts
import PowrProf, { POWER_INFORMATION_LEVEL } from '@bun-win32/powrprof';

// Get system battery state
const batteryState = Buffer.alloc(64);
const status = PowrProf.CallNtPowerInformation(
  POWER_INFORMATION_LEVEL.SystemBatteryState,
  null, 0,
  batteryState.ptr, batteryState.byteLength,
);

if (status === 0) {
  const view = new DataView(batteryState.buffer);
  const acOnLine = view.getUint8(0);
  const batteryPresent = view.getUint8(1);
  console.log(`AC: ${acOnLine ? 'plugged in' : 'battery'}`);
  console.log(`Battery present: ${batteryPresent ? 'yes' : 'no'}`);
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example/powrprof.ts
```

## Notes

- Either rely on lazy binding or call `PowrProf.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
