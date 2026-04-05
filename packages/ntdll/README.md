# @bun-win32/ntdll

Zero-dependency, zero-overhead Win32 NTDLL bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/ntdll` exposes the `ntdll.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Ntdll`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `ntdll.dll` (native NT API, process/thread management, memory, registry, file I/O, synchronization, runtime library utilities, and more).
- In-source docs in `structs/Ntdll.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Ntdll.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Ntdll.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/ntdll
```

## Quick Start

```ts
import Ntdll, { STATUS_SUCCESS } from '@bun-win32/ntdll';

// Optionally bind a subset up-front
Ntdll.Preload(['RtlGetVersion', 'NtQuerySystemTime']);

// Query the OS version via RtlGetVersion
const versionInfo = Buffer.alloc(0x11C); // RTL_OSVERSIONINFOW
versionInfo.writeUInt32LE(0x11C, 0);     // dwOSVersionInfoSize

const status = Ntdll.RtlGetVersion(versionInfo.ptr);

if (status === STATUS_SUCCESS) {
  const major = versionInfo.readUInt32LE(4);
  const minor = versionInfo.readUInt32LE(8);
  const build = versionInfo.readUInt32LE(12);
  console.log('Windows %d.%d.%d', major, minor, build);
}
```

## Examples

Run the included examples:

```sh
bun run example              # OS version + system time
```

## Notes

- Either rely on lazy binding or call `Ntdll.Preload()`.
- Windows only. Bun runtime required.
