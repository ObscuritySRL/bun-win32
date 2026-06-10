# @bun-win32/all

Every Win32 FFI binding for [Bun](https://bun.sh) on Windows, in one install.

## Overview

`@bun-win32/all` re-exports the default class of every published `@bun-win32/*` binding package — `Kernel32`, `User32`, `D3d11`, `Xaudio2_9`, and 100+ more — plus the shared `Win32` namespace from `@bun-win32/core`. Each class lazily binds native symbols on first use; every call after that is a direct native pointer invocation.

The bindings are strongly typed for a smooth DX in TypeScript. The unscoped [`bun-win32`](../bun-win32) package is an alias that re-exports this surface verbatim.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- The entire `@bun-win32/*` ecosystem behind a single `bun add`.
- Zero runtime cost — an index of re-exports; importing only what you use stays tree-shakeable.
- Lazy binding on first call; optional eager preload per class (`Kernel32.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/all
```

## Quick Start

```ts
import { Kernel32, User32 } from '@bun-win32/all';

Kernel32.GetCurrentProcessId();
User32.GetForegroundWindow();
```

Types, enums, and packed-struct helpers are not re-exported (the namespace would collide); import those from the specific package:

```ts
import { User32 } from '@bun-win32/all';
import { ShowWindowCommand, WindowStyles } from '@bun-win32/user32';
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

`example/` is the repository's showcase — GPU compute and rendering, audio, terminal engines, emulation, and hardware/OS diagnostics, each demo a single `.ts` file:

```sh
bun run particle-galaxy       # 1,048,576 particles on a GPU compute shader
bun run gameboy               # a complete Game Boy emulated in pure TypeScript
bun run firmware-inventory    # your hardware identity parsed from the raw SMBIOS blob
```

## Notes

- Either rely on lazy binding or call `Preload()` on the classes you use.
- Windows only. Bun runtime required.

## License

MIT
