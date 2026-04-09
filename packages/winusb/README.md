# @bun-win32/winusb

Zero-dependency, zero-overhead Win32 WinUSB bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/winusb` exposes the public `winusb.dll` API using [Bun](https://bun.sh)'s FFI. It provides a single class, `WinUsb`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `winusb.dll` (USB device I/O, control transfers, pipe management, isochronous transfers, and more).
- In-source docs in `structs/WinUsb.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`WinUsb.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/WinUsb.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/winusb
```

## Quick Start

```ts
import Kernel32, {
  FileAccess,
  FileCreationDisposition,
  FileShareMode,
  INVALID_HANDLE_VALUE,
} from '@bun-win32/kernel32';
import WinUsb, { DeviceInformationType } from '@bun-win32/winusb';

// Open a WinUSB device (path from SetupAPI device enumeration)
const devicePath = Buffer.from('\\\\.\\USB#VID_XXXX&PID_XXXX#...\\{GUID}\0', 'utf16le');
const deviceHandle = Kernel32.CreateFileW(
  devicePath.ptr,
  FileAccess.GENERIC_READ | FileAccess.GENERIC_WRITE,
  FileShareMode.FILE_SHARE_READ | FileShareMode.FILE_SHARE_WRITE,
  null!,
  FileCreationDisposition.OPEN_EXISTING,
  0,
  0n,
);

if (deviceHandle === INVALID_HANDLE_VALUE) {
  throw new Error(`CreateFileW failed: ${Kernel32.GetLastError()}`);
}

// Initialize WinUSB on the device
const handleBuf = Buffer.alloc(8);
if (WinUsb.WinUsb_Initialize(deviceHandle, handleBuf.ptr)) {
  const interfaceHandle = handleBuf.readBigUInt64LE(0);

  // Query device speed
  const speedBuf = Buffer.alloc(1);
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(1, 0);
  WinUsb.WinUsb_QueryDeviceInformation(interfaceHandle, DeviceInformationType.DEVICE_SPEED, lenBuf.ptr, speedBuf.ptr);
  console.log('Device speed:', speedBuf.readUInt8(0));

  WinUsb.WinUsb_Free(interfaceHandle);
}
Kernel32.CloseHandle(deviceHandle);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:descriptor-visualizer
bun run example:usb-device-inspector
```

## Notes

- Either rely on lazy binding or call `WinUsb.Preload()`.
- Windows only. Bun runtime required.
