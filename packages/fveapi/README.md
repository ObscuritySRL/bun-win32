# @bun-win32/fveapi

Zero-dependency, zero-overhead Win32 FVEAPI (BitLocker / Full Volume Encryption) bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/fveapi` exposes the `fveapi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Fveapi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

`fveapi.dll` is the user-mode entry point to the kernel-mode BitLocker Drive Encryption (FVE) support. Microsoft does not publish per-function C prototypes or Microsoft Learn pages for these exports; the documented programmatic surface for the same operations is the [`Win32_EncryptableVolume`](https://learn.microsoft.com/en-us/windows/win32/secprov/win32-encryptablevolume) WMI provider. The volume-handle lifetime, the `HRESULT`-style return value, and the volume-handle-first calling pattern are verified empirically against the live DLL; remaining undocumented parameters are bound as opaque pointers. Treat every return value as an `HRESULT` and degrade gracefully when not elevated or on non-BitLocker volumes.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `fveapi.dll` (BitLocker volume status, protection, conversion, recovery, device encryption).
- In-source docs in `structs/Fveapi.ts` with links to Microsoft's documented BitLocker surface.
- Lazy binding on first call; optional eager preload (`Fveapi.Preload()`).
- No wrapper overhead; calls map 1:1 to native exports.
- Strongly-typed Win32 aliases (see `types/Fveapi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later
- Many operations require elevation (run as Administrator / SYSTEM); read-only status probes degrade gracefully without it.

## Installation

```sh
bun add @bun-win32/fveapi
```

## Quick Start

```ts
import Fveapi from '@bun-win32/fveapi';

// Open a volume handle (HRESULT-style return; 0 == S_OK)
const volume = Buffer.from('\\\\?\\Volume{00000000-0000-0000-0000-000000000000}\0', 'utf16le');
const handleOut = Buffer.alloc(8);
const hr = Fveapi.FveOpenVolumeW(volume.ptr, 0, handleOut.ptr);
if (hr === 0) {
  const hVolume = handleOut.readBigUInt64LE(0);
  const status = Buffer.alloc(64);
  Fveapi.FveGetStatus(hVolume, status.ptr);
  Fveapi.FveCloseVolume(hVolume);
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:bitlocker-vault-scope
bun run example:bitlocker-compliance-report
```

## Notes

- Either rely on lazy binding or call `Fveapi.Preload()`.
- Windows only. Bun runtime required.
- Return values are `HRESULT`-style codes (`0` = success). `fveapi.dll` rejects unsupported callers with `0x80070057` (`E_INVALIDARG`) or `0x80070005` (`E_ACCESSDENIED`) — handle these instead of assuming success.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
