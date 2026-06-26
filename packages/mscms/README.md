# @bun-win32/mscms

Zero-dependency, zero-overhead Win32 MSCMS bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/mscms` exposes the `mscms.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Mscms`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `mscms.dll` (ICC color profiles, color transforms, color space conversion, display calibration, and Windows Color System).
- In-source docs in `structs/Mscms.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Mscms.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Mscms.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/mscms
```

## Quick Start

```ts
import Mscms, { PROFILE_ACCESS, PROFILE_TYPE } from '@bun-win32/mscms';

// Preload the symbols you'll use
Mscms.Preload(['OpenColorProfileW', 'GetColorProfileHeader', 'CloseColorProfile']);

// Build a PROFILE struct that points at a filename
const path = Buffer.from('C:\\Windows\\System32\\spool\\drivers\\color\\sRGB Color Space Profile.icm\0', 'utf16le');
const profile = Buffer.alloc(24);
profile.writeUInt32LE(PROFILE_TYPE.PROFILE_FILENAME, 0);
profile.writeBigUInt64LE(BigInt(path.ptr!), 8);
profile.writeUInt32LE(path.byteLength, 16);

const hProfile = Mscms.OpenColorProfileW(profile.ptr!, PROFILE_ACCESS.PROFILE_READ, 0, 3 /* OPEN_EXISTING */);
if (hProfile !== 0n) {
  // 128-byte ICC profile header
  const header = Buffer.alloc(128);
  if (Mscms.GetColorProfileHeader(hProfile, header.ptr!)) {
    console.log('Profile size:', header.readUInt32LE(0));
  }
  Mscms.CloseColorProfile(hProfile);
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:color-spectrum     # Animated sRGB <-> Adobe RGB gamut visualization
bun run example:profile-inspector  # Full ICC profile dump for every installed display profile
```

## Notes

- Either rely on lazy binding or call `Mscms.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
