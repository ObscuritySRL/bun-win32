# @bun-win32/mfplat

Zero-dependency, zero-overhead Win32 Mfplat bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/mfplat` exposes the documented `mfplat.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Mfplat`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

`mfplat.dll` is the platform layer of Microsoft Media Foundation — it owns the MF runtime lifecycle (`MFStartup` / `MFShutdown`), the system clock (`MFGetSystemTime`), the MF work-queue thread pool (`MFAllocateWorkQueue`, `MFPutWorkItem`), and the foundational factory entry points for media types, attributes, samples, byte streams, events, async results, and the Media Foundation Transform (MFT) registry (`MFTEnumEx`, `MFTRegister*`). The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `mfplat.dll` (Media Foundation platform layer: lifecycle, clock, work queues, MFT registry, media-type / sample / byte-stream / event factories).
- In-source docs in `structs/Mfplat.ts` with links to Microsoft Learn.
- Lazy binding on first call; optional eager preload (`Mfplat.Preload()`).
- No wrapper overhead; calls map 1:1 to native exports.
- Strongly-typed COM pointer aliases for `IMFAttributes`, `IMFMediaType`, `IMFSample`, `IMFMediaBuffer`, `IMFByteStream`, `IMFActivate`, `IMFAsyncResult`, `IMFMediaEvent`, `IMFDXGIDeviceManager`, and factory parameters (see `types/Mfplat.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/mfplat
```

## Quick Start

```ts
import Mfplat from '@bun-win32/mfplat';

Mfplat.Preload(['MFStartup', 'MFShutdown', 'MFCreateAttributes']);

const MF_VERSION = 0x0002_0070;
const MFSTARTUP_LITE = 0x1;

const startHr = Mfplat.MFStartup(MF_VERSION, MFSTARTUP_LITE);
if (startHr === 0) {
  const attrsOut = Buffer.alloc(8);
  const createHr = Mfplat.MFCreateAttributes(attrsOut.ptr, 4);
  if (createHr === 0) {
    const attributes = attrsOut.readBigUInt64LE(0);
    console.log(`IMFAttributes @ 0x${attributes.toString(16)}`);
  }
  Mfplat.MFShutdown();
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:mft-transform-census
bun run example:mfplat-platform-probe
```

## Notes

- Either rely on lazy binding or call `Mfplat.Preload()`.
- Most `MFCreate*` / `MFT*` / work-queue entry points require `ole32!CoInitializeEx` (STA or MTA) and `Mfplat.MFStartup(MF_VERSION)` up-front. Pair them with `MFShutdown` + `CoUninitialize` on exit.
- Constants: `MF_VERSION = 0x0002_0070`, `MFSTARTUP_LITE = 0x1` (or `MFSTARTUP_FULL = 0x0` to include socket/network activation). See `types/Mfplat.ts`.
- The returned `IMFAttributes` / `IMFMediaType` / `IMFSample` / `IMFActivate` / `IMFByteStream` objects are COM interfaces. Drive them through their vtable (see `example/mft-transform-census.ts` for a `GetAllocatedString` walkthrough and `example/mfplat-platform-probe.ts` for `IMFAttributes::Set/GetUINT32` and `IMFSample::AddBuffer`).
- `MFTEnumEx` returns a `CoTaskMemAlloc`'d array of `IMFActivate*`. Release each activate via its vtable, then free the outer array with `ole32!CoTaskMemFree`.
- 25 exports from `mfplat.dll` are forwarders into `RTWorkQ.dll` (MFAllocateWorkQueue, MFScheduleWorkItem, etc.). Bun's loader resolves them transparently — no special handling required.
- Windows only. Bun runtime required.
