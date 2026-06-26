# @bun-win32/Dcomp

Zero-dependency, zero-overhead Win32 Dcomp bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/Dcomp` exposes the `dcomp.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Dcomp`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

It covers the documented Microsoft **DirectComposition** flat surface (`dcomp.h`): device creation (`DCompositionCreateDevice`/`2`/`3`), composition surface handles, the Windows-11 compositor-clock frame/statistics APIs (`DCompositionGetFrameId`, `DCompositionGetStatistics`, `DCompositionWaitForCompositorClock`, `DCompositionBoostCompositorClock`), mouse-input redirection, and the COM in-proc-server entry points. The rest of DirectComposition — the `IDCompositionDevice`/`IDCompositionVisual` object graph — rides the COM vtable on top of the device created here.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `dcomp.dll` (DirectComposition device, surfaces, compositor clock).
- In-source docs in `structs/Dcomp.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Dcomp.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Dcomp.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later (compositor-clock APIs require Windows 11 build 22000+)

## Installation

```sh
bun add @bun-win32/dcomp
```

## Quick Start

```ts
import Dcomp, { COMPOSITION_FRAME_ID_TYPE } from '@bun-win32/dcomp';

// Create a device-only DirectComposition device (NULL renderer is allowed).
// IID_IDCompositionDevice = {C37EA93A-E7AA-450D-B16F-9746CB0407F3} (dcomp.h)
const iid = Buffer.from([0x3a, 0xe9, 0x7e, 0xc3, 0xaa, 0xe7, 0x0d, 0x45, 0xb1, 0x6f, 0x97, 0x46, 0xcb, 0x04, 0x07, 0xf3]);
const deviceOut = Buffer.alloc(8);
if (Dcomp.DCompositionCreateDevice2(null, iid.ptr!, deviceOut.ptr!) === 0) {
  const device = deviceOut.readBigUInt64LE(0); // IDCompositionDevice* — drive via the COM vtable

  // Read the latest completed compositor frame id.
  const frameId = Buffer.alloc(8);
  Dcomp.DCompositionGetFrameId(COMPOSITION_FRAME_ID_TYPE.COMPOSITION_FRAME_ID_COMPLETED, frameId.ptr!);
  console.log('latest composited frame', frameId.readBigUInt64LE(0));
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example/compositor-clock-scope.ts
bun run example/composition-device-diagnostic.ts
```

- **`compositor-clock-scope.ts`** — a live ANSI oscilloscope of the Windows desktop compositor's heartbeat: paces on `DCompositionWaitForCompositorClock`, reads the frame period from `DCompositionGetStatistics`, and plots a scrolling waveform with the measured effective refresh rate.
- **`composition-device-diagnostic.ts`** — creates a real DirectComposition device, proves it via its IUnknown vtable refcount, mints a composition surface handle, and reads the full compositor-clock frame-id/statistics surface into an aligned report.

## Notes

- Either rely on lazy binding or call `Dcomp.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
