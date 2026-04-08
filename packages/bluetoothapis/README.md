# @bun-win32/bluetoothapis

Zero-dependency, zero-overhead Win32 BluetoothApis bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/bluetoothapis` exposes the `bluetoothapis.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `BluetoothApis`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `bluetoothapis.dll` (Bluetooth Classic radio/device discovery, BLE GATT, SDP, authentication).
- In-source docs in `structs/BluetoothApis.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`BluetoothApis.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/BluetoothApis.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/bluetoothapis
```

## Quick Start

```ts
import BluetoothApis from '@bun-win32/bluetoothapis';
import Kernel32 from '@bun-win32/kernel32';

// BLUETOOTH_FIND_RADIO_PARAMS: { dwSize: DWORD }
const params = Buffer.alloc(4);
params.writeUInt32LE(4, 0);

const hRadio = Buffer.alloc(8);
const hFind = BluetoothApis.BluetoothFindFirstRadio(params.ptr, hRadio.ptr);

if (hFind !== 0n) {
  const radioHandle = hRadio.readBigUInt64LE(0);
  console.log('Found radio handle:', radioHandle);

  // Get radio info
  const radioInfo = Buffer.alloc(520); // BLUETOOTH_RADIO_INFO size
  radioInfo.writeUInt32LE(520, 0);     // dwSize
  const err = BluetoothApis.BluetoothGetRadioInfo(radioHandle, radioInfo.ptr);
  if (err === 0) {
    const name = new TextDecoder('utf-16le').decode(radioInfo.subarray(264, 264 + 496)).replace(/\0.*$/, '');
    console.log('Radio name:', name);
  }

  Kernel32.CloseHandle(radioHandle);
  BluetoothApis.BluetoothFindRadioClose(hFind);
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
cd packages/bluetoothapis && bun run example/bluetoothapis.ts
```

## Notes

- Either rely on lazy binding or call `BluetoothApis.Preload()`.
- Windows only. Bun runtime required.
