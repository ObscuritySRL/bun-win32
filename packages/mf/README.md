# @bun-win32/mf

Zero-dependency, zero-overhead Win32 MF bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/mf` exposes the `mf.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Mf`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

`mf.dll` is the Media Foundation **pipeline** layer that sits on top of the already-shipped `@bun-win32/mfplat` (platform) and `@bun-win32/mfreadwrite` (source reader / sink writer): source resolution, the ASF authoring object graph, every container media sink (MP3/AAC-ADTS/AC-3/MPEG-4/fragmented-MP4/3GP), streaming sinks, the video renderer, network credential/proxy plumbing, and the protected-environment / signed-library surface.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `mf.dll` (source resolver, ASF profile/multiplexer/indexer/splitter, MP3/AC-3/ADTS/MPEG-4/3GP media sinks, video renderer, network credential/proxy, and more).
- In-source docs in `structs/Mf.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Mf.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Mf.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/mf
```

## Quick Start

```ts
import Mf from '@bun-win32/mf';
import Mfplat from '@bun-win32/mfplat';

// Media Foundation must be started before mf.dll factories are used.
Mfplat.MFStartup(0x0002_0070 /* MF_VERSION */, 0x1 /* MFSTARTUP_LITE */);

// Create a source resolver — the entry point that turns a URL or byte stream
// into an IMFMediaSource for the playback / transcode pipeline.
const ppResolver = Buffer.alloc(8); // IMFSourceResolver**
const hr = Mf.MFCreateSourceResolver(ppResolver.ptr);
if (hr === 0) {
  const pResolver = ppResolver.readBigUInt64LE(0); // live COM interface pointer
  // …walk the IMFSourceResolver vtable, then Release() it…
  void pResolver;
}

Mfplat.MFShutdown();
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:asf-pipeline-forge
bun run example:media-format-atlas
```

## Notes

- Either rely on lazy binding or call `Mf.Preload()`.
- `mf.dll` factories require Media Foundation to be initialized first — call `MFStartup` from `@bun-win32/mfplat` (and typically `CoInitializeEx`) before use.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
