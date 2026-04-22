# @bun-win32/mmdevapi

Zero-dependency, zero-overhead Win32 Mmdevapi bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/mmdevapi` exposes the `mmdevapi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Mmdevapi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `mmdevapi.dll` (MMDevice / Core Audio endpoint enumeration and WASAPI activation).
- In-source docs in `structs/Mmdevapi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Mmdevapi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Mmdevapi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/mmdevapi
```

## Quick Start

```ts
import { ptr } from 'bun:ffi';

import Mmdevapi, { CLSID_MMDeviceEnumerator, IID_IMMDeviceEnumerator } from '@bun-win32/mmdevapi';

function guidBytes(guid: string): Buffer {
  const [, d1, d2, d3, d4High, d4Low] = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i.exec(guid)!;
  const buffer = Buffer.alloc(16);
  buffer.writeUInt32LE(parseInt(d1, 16), 0);
  buffer.writeUInt16LE(parseInt(d2, 16), 4);
  buffer.writeUInt16LE(parseInt(d3, 16), 6);
  const data4 = `${d4High}${d4Low}`;
  for (let i = 0; i < 8; i += 1) buffer[8 + i] = parseInt(data4.slice(i * 2, i * 2 + 2), 16);
  return buffer;
}

// Resolve the MMDevice class factory without CoCreateInstance.
const clsid = guidBytes(CLSID_MMDeviceEnumerator);
const iidFactory = guidBytes('00000001-0000-0000-c000-000000000046'); // IID_IClassFactory
const factoryOut = Buffer.alloc(8);

const hr = Mmdevapi.DllGetClassObject(ptr(clsid), ptr(iidFactory), ptr(factoryOut));
console.log('DllGetClassObject →', `0x${(hr >>> 0).toString(16).padStart(8, '0')}`);
console.log('IClassFactory *   →', `0x${factoryOut.readBigUInt64LE(0).toString(16).padStart(16, '0')}`);

// Preload for hot paths (optional):
Mmdevapi.Preload(['DllGetClassObject', 'ActivateAudioInterfaceAsync']);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:audio-device-radar
bun run example:mmdevapi-factory-probe
```

## Notes

- Either rely on lazy binding or call `Mmdevapi.Preload()`.
- Windows only. Bun runtime required.
