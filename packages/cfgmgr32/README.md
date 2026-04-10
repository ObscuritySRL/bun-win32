# @bun-win32/cfgmgr32

Zero-dependency, zero-overhead Win32 Cfgmgr32 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/cfgmgr32` exposes the `cfgmgr32.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Cfgmgr32`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `cfgmgr32.dll` (device tree traversal, configuration management, device properties, interfaces, and resources).
- In-source docs in `structs/Cfgmgr32.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Cfgmgr32.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Cfgmgr32.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/cfgmgr32
```

## Quick Start

```ts
import Cfgmgr32, { CR, CM_LOCATE_DEVNODE } from '@bun-win32/cfgmgr32';

Cfgmgr32.Preload(['CM_Locate_DevNodeW', 'CM_Get_Device_IDW', 'CM_Get_Device_ID_Size']);

const dnDevInst = Buffer.alloc(4);
let cr = Cfgmgr32.CM_Locate_DevNodeW(dnDevInst.ptr, null, CM_LOCATE_DEVNODE.NORMAL);

if (cr !== CR.SUCCESS) {
  throw new Error(`CM_Locate_DevNodeW failed: CR=${cr}`);
}

const devInst = dnDevInst.readUInt32LE(0);
const idLenBuf = Buffer.alloc(4);
cr = Cfgmgr32.CM_Get_Device_ID_Size(idLenBuf.ptr, devInst, 0);

if (cr !== CR.SUCCESS) {
  throw new Error(`CM_Get_Device_ID_Size failed: CR=${cr}`);
}

const idLen = idLenBuf.readUInt32LE(0);
const idBuf = Buffer.alloc((idLen + 1) * 2);
cr = Cfgmgr32.CM_Get_Device_IDW(devInst, idBuf.ptr, idLen + 1, 0);

if (cr !== CR.SUCCESS) {
  throw new Error(`CM_Get_Device_IDW failed: CR=${cr}`);
}

const rootDeviceID = new TextDecoder('utf-16le').decode(idBuf).replace(/\0.*$/, '');
console.log(`Root device: ${rootDeviceID}`);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:device-tree
bun run example:usb-inventory
```

## Notes

- Either rely on lazy binding or call `Cfgmgr32.Preload()`.
- Windows only. Bun runtime required.
