# @bun-win32/xaudio2_9

Zero-dependency, zero-overhead Win32 XAudio2 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/xaudio2_9` exposes the `xaudio2_9.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Xaudio2_9`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `xaudio2_9.dll` (XAudio2 — low-latency audio engine creation, X3DAudio positional-audio math, and built-in XAPO effect instantiation).
- In-source docs in `structs/Xaudio2_9.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Xaudio2_9.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Xaudio2_9.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/xaudio2_9
```

## Quick Start

```ts
import Xaudio2_9, { S_OK, XAUDIO2_USE_DEFAULT_PROCESSOR } from '@bun-win32/xaudio2_9';

// Boot a real XAudio2 engine → an IXAudio2 COM interface pointer.
const ppXAudio2 = Buffer.alloc(8);
const hr = Xaudio2_9.XAudio2Create(ppXAudio2.ptr!, 0, XAUDIO2_USE_DEFAULT_PROCESSOR);
if (hr !== S_OK) throw new Error(`XAudio2Create failed: 0x${(hr >>> 0).toString(16)}`);

const engine = ppXAudio2.readBigUInt64LE(0);
console.log(`IXAudio2 @ 0x${engine.toString(16)}`);
// ... walk IXAudio2::CreateMasteringVoice / CreateSourceVoice / Release via the COM vtable.
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
# A real FM synth: synthesizes PCM in JS, plays a melody through an
# IXAudio2 mastering + source voice, and paints a play-locked ANSI scope
bun run example:xaudio2_9-fm-synth

# Full XAudio2 engine diagnostic: device details, performance counters,
# debug mask, X3DAudio listener/emitter solve, and every built-in XAPO
bun run example:xaudio2_9-engine-report
```

## Notes

- Either rely on lazy binding or call `Xaudio2_9.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
