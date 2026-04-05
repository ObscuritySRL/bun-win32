# @bun-win32/user32

Zero-dependency, zero-overhead Win32 User32 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/user32` exposes the `user32.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `User32`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `user32.dll` (windows, input, clipboard, monitors, and more).
- In-source docs in `structs/User32.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`User32.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/User32.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/user32
```

## Quick Start

```ts
import type { Pointer } from 'bun:ffi';
import User32, { MessageBoxType } from '@bun-win32/user32';

// Helper: UTF-16LE null-terminated string
const encode = (str: string) => Buffer.from(`${str}\0`, 'utf16le');

// Null pointer for optional HWND
const NULL = null as unknown as Pointer;

// Show a message box
User32.MessageBoxW(
  NULL,
  encode('Hello from @bun-win32/user32!').ptr,
  encode('Welcome').ptr,
  MessageBoxType.MB_OK | MessageBoxType.MB_ICONINFORMATION
);
```

## Examples

Run the included examples:

```sh
bun run example              # Basic User32 usage
bun run example:mouse        # Mouse stalker demo
bun run example:hotkey       # Hotkey registration demo
bun run example:countdown    # Countdown dialog demo
```

## Notes

- Either rely on lazy binding or call `User32.Preload()`.
- User32 wide-string (`*W`) functions expect UTF-16LE + null terminator. Use a helper like `encode()` and pass `.ptr`.
- Windows only. Bun runtime required.
