# @bun-win32/wlanapi

Zero-dependency, zero-overhead Win32 Wlanapi bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/wlanapi` exposes the `wlanapi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Wlanapi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `wlanapi.dll` (Native Wifi, hosted network, and Wi-Fi Direct APIs).
- In-source docs in `structs/Wlanapi.ts` with links to Microsoft Learn.
- Lazy binding on first call; optional eager preload (`Wlanapi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases, enums, and constants (see `types/Wlanapi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/wlanapi
```

## Quick Start

```ts
import { type Pointer, read, toArrayBuffer } from 'bun:ffi';

import Wlanapi, { WLAN_API_VERSION_2_0 } from '@bun-win32/wlanapi';

const negotiatedVersion = Buffer.alloc(4);
const clientHandle = Buffer.alloc(8);

const openStatus = Wlanapi.WlanOpenHandle(WLAN_API_VERSION_2_0, null, negotiatedVersion.ptr, clientHandle.ptr);

if (openStatus !== 0) {
  throw new Error(`WlanOpenHandle failed with status ${openStatus}`);
}

const handle = clientHandle.readBigUInt64LE(0);
const interfaceList = Buffer.alloc(8);

try {
  const enumStatus = Wlanapi.WlanEnumInterfaces(handle, null, interfaceList.ptr);

  if (enumStatus !== 0) {
    throw new Error(`WlanEnumInterfaces failed with status ${enumStatus}`);
  }

  const listPointer = read.ptr(interfaceList.ptr) as Pointer;

  if (listPointer) {
    const listHeader = new DataView(toArrayBuffer(listPointer, 0, 8));
    const interfaceCount = listHeader.getUint32(0, true);

    console.log(`Wireless interfaces: ${interfaceCount}`);

    Wlanapi.WlanFreeMemory(listPointer);
  }
} finally {
  Wlanapi.WlanCloseHandle(handle, null);
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included example:

```sh
bun run example
```

## Notes

- Either rely on lazy binding or call `Wlanapi.Preload()`.
- Windows only. Bun runtime required.
