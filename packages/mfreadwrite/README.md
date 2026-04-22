# @bun-win32/mfreadwrite

Zero-dependency, zero-overhead Win32 Mfreadwrite bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/mfreadwrite` exposes the documented `mfreadwrite.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Mfreadwrite`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The package intentionally stays export-accurate: `mfreadwrite.dll` exports the `MFCreateSourceReader*` / `MFCreateSinkWriter*` factory entry points plus the COM server shims (`DllGetClassObject`, `DllCanUnloadNow`). It does not expose the `IMFSourceReader` / `IMFSinkWriter` vtables themselves. The runnable examples show how to call the factories and drive the returned COM objects through their vtables.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `mfreadwrite.dll` (Media Foundation source reader / sink writer factory entry points).
- In-source docs in `structs/Mfreadwrite.ts` with links to Microsoft Learn.
- Lazy binding on first call; optional eager preload (`Mfreadwrite.Preload()`).
- No wrapper overhead; calls map 1:1 to native exports.
- Strongly-typed COM pointer aliases for `IMFSourceReader`, `IMFSinkWriter`, `IMFByteStream`, and factory parameters (see `types/Mfreadwrite.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/mfreadwrite
```

## Quick Start

```ts
import Mfreadwrite from '@bun-win32/mfreadwrite';

Mfreadwrite.Preload(['MFCreateSourceReaderFromURL']);

// MF requires ole32!CoInitializeEx + mfplat!MFStartup before use.
const url = Buffer.from('C:\\Windows\\Media\\chimes.wav\0', 'utf16le');
const readerOut = Buffer.alloc(8);
const hr = Mfreadwrite.MFCreateSourceReaderFromURL(url.ptr, null, readerOut.ptr);
if (hr === 0) {
  const reader = readerOut.readBigUInt64LE(0);
  console.log(`IMFSourceReader @ 0x${reader.toString(16)}`);
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:media-library-dashboard
bun run example:mfreadwrite-factory-probe
```

## Notes

- Either rely on lazy binding or call `Mfreadwrite.Preload()`.
- `mfreadwrite.dll` exports `DllCanUnloadNow`, `DllGetClassObject`, `MFCreateSinkWriterFromMediaSink`, `MFCreateSinkWriterFromURL`, `MFCreateSourceReaderFromByteStream`, `MFCreateSourceReaderFromMediaSource`, and `MFCreateSourceReaderFromURL`.
- Media Foundation requires `ole32!CoInitializeEx` (STA or MTA) and `mfplat!MFStartup(MF_VERSION)` before the `MFCreate*` factories work. Pair them with `MFShutdown` + `CoUninitialize` on exit.
- `CLSID_MFSourceReader` and `CLSID_MFSinkWriter` are documented CLSIDs but are **not** exposed as class factories by `mfreadwrite.dll`; `DllGetClassObject` returns `CLASS_E_CLASSNOTAVAILABLE` for both. Use the dedicated `MFCreate*` factories instead — `example/mfreadwrite-factory-probe.ts` demonstrates this behavior.
- The returned `IMFSourceReader` / `IMFSinkWriter` objects are COM interfaces. Drive them through their vtable (see `example/media-library-dashboard.ts` for a `GetPresentationAttribute` / `Release` walkthrough).
- Windows only. Bun runtime required.
