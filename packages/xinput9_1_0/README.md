# @bun-win32/xinput9_1_0

Zero-dependency, zero-overhead Win32 XInput 9.1.0 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/xinput9_1_0` exposes the `xinput9_1_0.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Xinput9_1_0`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `xinput9_1_0.dll` (legacy Xbox controller input and vibration).
- In-source docs in `structs/Xinput9_1_0.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Xinput9_1_0.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Xinput9_1_0.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/xinput9_1_0
```

## Quick Start

```ts
import Xinput9_1_0 from '@bun-win32/xinput9_1_0';

const ERROR_SUCCESS = 0;
const state = Buffer.alloc(16); // XINPUT_STATE

const result = Xinput9_1_0.XInputGetState(0, state.ptr);

if (result === ERROR_SUCCESS) {
  const buttons = state.readUInt16LE(4);
  const lx = state.readInt16LE(8);
  const ly = state.readInt16LE(10);
  console.log(`Buttons: 0x${buttons.toString(16)}, Left stick: (${lx}, ${ly})`);
} else {
  console.log('No controller on slot 0');
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:gamepad-monitor
bun run example:controller-report
```

## Notes

- Either rely on lazy binding or call `Xinput9_1_0.Preload()`.
- Windows only. Bun runtime required.
- For new projects, prefer `@bun-win32/xinput1_4` which provides additional APIs (battery, keystroke, audio device IDs).
