# @bun-win32/setupapi

Zero-dependency, zero-overhead Win32 Setupapi bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/setupapi` exposes the `setupapi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Setupapi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `setupapi.dll` (device installation, INF parsing, class and interface enumeration).
- In-source docs in `structs/Setupapi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Setupapi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Setupapi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/setupapi
```

## Quick Start

```ts
import Setupapi, { DIGCF, INVALID_HANDLE_VALUE } from '@bun-win32/setupapi';

Setupapi.Preload(['SetupDiDestroyDeviceInfoList', 'SetupDiGetClassDevsW']);

const deviceInfoSet = Setupapi.SetupDiGetClassDevsW(null, null, 0n, DIGCF.ALLCLASSES | DIGCF.PRESENT);
if (deviceInfoSet === INVALID_HANDLE_VALUE) {
  throw new Error('SetupDiGetClassDevsW failed');
}

try {
  console.log('Loaded present device set:', deviceInfoSet.toString());
} finally {
  Setupapi.SetupDiDestroyDeviceInfoList(deviceInfoSet);
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:device-census      # inventory present Plug and Play devices
bun run example:driver-deck        # inspect real compatible/class driver decks
```

## Notes

- Either rely on lazy binding or call `Setupapi.Preload()`.
- Windows only. Bun runtime required.
