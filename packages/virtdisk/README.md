# @bun-win32/virtdisk

Zero-dependency, zero-overhead Win32 Virtdisk bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/virtdisk` exposes the `virtdisk.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Virtdisk`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `virtdisk.dll` (VHD, VHDX, and ISO virtual disk management).
- In-source docs in `structs/Virtdisk.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Virtdisk.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Virtdisk.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/virtdisk
```

## Quick Start

```ts
import Virtdisk, {
  CREATE_VIRTUAL_DISK_FLAG,
  CREATE_VIRTUAL_DISK_VERSION,
  VIRTUAL_DISK_ACCESS_MASK,
  VIRTUAL_STORAGE_TYPE_DEVICE_VHDX,
} from '@bun-win32/virtdisk';

// Build VIRTUAL_STORAGE_TYPE for VHDX (Microsoft vendor)
const storageType = Buffer.alloc(20);
storageType.writeUInt32LE(VIRTUAL_STORAGE_TYPE_DEVICE_VHDX, 0);
storageType.writeUInt32LE(0xec984aec, 4);   // VIRTUAL_STORAGE_TYPE_VENDOR_MICROSOFT
storageType.writeUInt16LE(0xa0f9, 8);
storageType.writeUInt16LE(0x47e9, 10);
storageType.set([0x90, 0x1f, 0x71, 0x41, 0x5a, 0x66, 0x34, 0x5b], 12);

// Build CREATE_VIRTUAL_DISK_PARAMETERS Version1 (64 MB)
const params = Buffer.alloc(56);
params.writeUInt32LE(CREATE_VIRTUAL_DISK_VERSION.CREATE_VIRTUAL_DISK_VERSION_1, 0);
params.writeBigUInt64LE(64n * 1024n * 1024n, 24);

const path = Buffer.from('C:\\temp\\test.vhdx\0', 'utf16le');
const handle = Buffer.alloc(8);

const result = Virtdisk.CreateVirtualDisk(
  storageType.ptr!, path.ptr!,
  VIRTUAL_DISK_ACCESS_MASK.VIRTUAL_DISK_ACCESS_CREATE, null,
  CREATE_VIRTUAL_DISK_FLAG.CREATE_VIRTUAL_DISK_FLAG_NONE, 0,
  params.ptr!, null, handle.ptr!,
);

console.log(result === 0 ? 'Created' : `Error: ${result}`);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:vhd-forge
bun run example:disk-inspector
```

## Notes

- Either rely on lazy binding or call `Virtdisk.Preload()`.
- Windows only. Bun runtime required.
