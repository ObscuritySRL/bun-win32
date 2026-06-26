# @bun-win32/winmm

Zero-dependency, zero-overhead Win32 WinMM bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/winmm` exposes the `winmm.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Winmm`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `winmm.dll` (multimedia audio, MIDI, mixers, timers, joysticks, and MCI).
- In-source docs in `structs/Winmm.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Winmm.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases and a few common flag enums (see `types/Winmm.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/winmm
```

## Quick Start

```ts
import Winmm from '@bun-win32/winmm';

const tickCount = Winmm.timeGetTime();
const waveOutDeviceCount = Winmm.waveOutGetNumDevs();

console.log({ tickCount, waveOutDeviceCount });
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example/winmm.ts
bun run example/synth.ts
bun run example/seq.ts
bun run example/joystick.ts --duration-ms=10000
# or continuous polling
bun run example/joystick.ts --live
```

## Notes

- Either rely on lazy binding or call `Winmm.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
