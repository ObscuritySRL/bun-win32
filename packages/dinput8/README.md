# @bun-win32/dinput8

Zero-dependency, zero-overhead Win32 Dinput8 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/dinput8` exposes the `dinput8.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Dinput8`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

`dinput8.dll` is the DirectInput 8 runtime — the path to **every non-Xbox controller**: racing wheels, flight sticks / HOTAS, generic USB gamepads, and legacy adapters that `XInput` (Xbox-class only) cannot see. The flat `DirectInput8Create` export hands you an `IDirectInput8` COM object; from there device enumeration, acquisition, and polling are driven over the COM vtable (see the examples). `GetdfDIJoystick` returns the predefined joystick data format used with `IDirectInputDevice8::SetDataFormat`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `dinput8.dll` (DirectInput 8 object creation, COM class factory, and the predefined joystick data format).
- In-source docs in `structs/Dinput8.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Dinput8.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Dinput8.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/dinput8
```

## Quick Start

```ts
import Dinput8, { DIRECTINPUT_VERSION, IID_IDirectInput8W } from '@bun-win32/dinput8';

// IID_IDirectInput8W → 16-byte little-endian GUID buffer
const guid = (s: string): Buffer => {
  const m = /^(.{8})-(.{4})-(.{4})-(.{4})-(.{12})$/.exec(s)!;
  const b = Buffer.alloc(16);
  b.writeUInt32LE(parseInt(m[1], 16), 0);
  b.writeUInt16LE(parseInt(m[2], 16), 4);
  b.writeUInt16LE(parseInt(m[3], 16), 6);
  const tail = m[4] + m[5];
  for (let i = 0; i < 8; i += 1) b[8 + i] = parseInt(tail.slice(i * 2, i * 2 + 2), 16);
  return b;
};

const iid = guid(IID_IDirectInput8W);
const ppDI = Buffer.alloc(8);

// hinst may be 0n — DirectInput uses it only for app-certification heuristics
const hr = Dinput8.DirectInput8Create(0n, DIRECTINPUT_VERSION, iid.ptr!, ppDI.ptr!, null);
if (hr === 0) {
  const pIDirectInput8 = ppDI.readBigUInt64LE(0);
  console.log(`IDirectInput8 @ 0x${pIDirectInput8.toString(16)}`);
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:controller-scope
bun run example:device-census
```

## Notes

- Either rely on lazy binding or call `Dinput8.Preload()`.
- Windows only. Bun runtime required.
