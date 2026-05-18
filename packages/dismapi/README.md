# @bun-win32/dismapi

Zero-dependency, zero-overhead Win32 DISM API bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/dismapi` exposes the `dismapi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Dismapi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The Deployment Image Servicing and Management (DISM) API is the supported, in-process way to install/uninstall/configure/update Windows features, packages, drivers, and capabilities in an online or offline Windows image (`.wim`/`.vhd`/`.vhdx`) — the same engine `DISM.exe` drives, with no process spawn.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `dismapi.dll` (image servicing: sessions, features, packages, drivers, capabilities, health, mount).
- In-source docs in `structs/Dismapi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Dismapi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Dismapi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later
- An **elevated** process (the DISM API returns `ERROR_ELEVATION_REQUIRED` otherwise)

## Installation

```sh
bun add @bun-win32/dismapi
```

## Quick Start

```ts
import Dismapi, { DISM_ONLINE_IMAGE, DismLogLevel, DismPackageIdentifier } from '@bun-win32/dismapi';

if (Dismapi.DismInitialize(DismLogLevel.DismLogErrorsWarnings, null, null) === 0) {
  const sess = Buffer.alloc(4); // DismSession is a UINT
  const online = Buffer.from(DISM_ONLINE_IMAGE + '\0', 'utf16le');
  if (Dismapi.DismOpenSession(online.ptr, null, null, sess.ptr) === 0) {
    const session = sess.readUInt32LE(0);

    const arr = Buffer.alloc(8); // receives a DISM-allocated array pointer
    const count = Buffer.alloc(4);
    Dismapi.DismGetFeatures(session, null, DismPackageIdentifier.DismPackageNone, arr.ptr, count.ptr);
    console.log('optional features:', count.readUInt32LE(0));

    Dismapi.DismCloseSession(session);
  }
  Dismapi.DismShutdown(); // always pair with DismInitialize
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples (run elevated for full output):

```sh
bun run example/servicing-inventory.ts
bun run example/image-health-report.ts
```

## Notes

- Either rely on lazy binding or call `Dismapi.Preload()`.
- `DismSession` is a `UINT` (`number`), not a handle — read it from a 4-byte buffer after `DismOpenSession`.
- `DismGet*` functions return a **DISM-allocated** array via a `T**` out-pointer plus a `UINT` count; you read the count from your own buffer, then walk the returned pointer and **must** free it with `DismDelete`.
- Long-running functions accept an optional `CancelEvent` (event `HANDLE`, `0n` for none), `Progress` (`DISM_PROGRESS_CALLBACK`, `null` for none), and `UserData` (`null` for none).
- Always pair `DismInitialize`/`DismShutdown` and `DismOpenSession`/`DismCloseSession`.
- Six `dismapi.dll` exports (`DismAddLanguage`, `DismAddProvisionedAppxPackage`, `DismGetPackageInfoEx`, `DismGetProvisionedAppxPackages`, `DismRemoveLanguage`, `DismRemoveProvisionedAppxPackage`) are undocumented and intentionally not bound.
- Windows only. Bun runtime required.
