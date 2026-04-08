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
```

## Notes

- Either rely on lazy binding or call `Winmm.Preload()`.
- Windows only. Bun runtime required.
