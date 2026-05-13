# @bun-win32/dxva2

Zero-dependency, zero-overhead Win32 DXVA2 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/dxva2` exposes the `dxva2.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Dxva2`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `dxva2.dll` (DDC/CI monitor configuration — brightness, contrast, color temperature, RGB drive/gain, VCP features, physical monitor enumeration; plus DXVA2/DXVA-HD video acceleration and OPM/HDCP video output objects).
- In-source docs in `structs/Dxva2.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Dxva2.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Dxva2.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/dxva2
```

## Quick Start

```ts
import Dxva2, { PHYSICAL_MONITOR_SIZE } from '@bun-win32/dxva2';
import User32 from '@bun-win32/user32';

Dxva2.Preload(['GetNumberOfPhysicalMonitorsFromHMONITOR', 'GetPhysicalMonitorsFromHMONITOR', 'GetMonitorBrightness', 'SetMonitorBrightness', 'DestroyPhysicalMonitors']);

// 1. Pick the monitor under the primary window (or pass any HMONITOR from EnumDisplayMonitors).
const hwnd = User32.GetForegroundWindow();
const hMonitor = User32.MonitorFromWindow(hwnd, /* MONITOR_DEFAULTTOPRIMARY */ 1);

// 2. Resolve the underlying physical monitors (one HMONITOR may map to several).
const count = Buffer.alloc(4);
Dxva2.GetNumberOfPhysicalMonitorsFromHMONITOR(hMonitor, count.ptr);
const physicalCount = count.readUInt32LE(0);

const physicalMonitorArray = Buffer.alloc(PHYSICAL_MONITOR_SIZE * physicalCount);
Dxva2.GetPhysicalMonitorsFromHMONITOR(hMonitor, physicalCount, physicalMonitorArray.ptr);

// 3. The first 8 bytes of each PHYSICAL_MONITOR entry is the physical monitor HANDLE.
const physicalHandle = physicalMonitorArray.readBigUInt64LE(0);

// 4. Read the brightness range and current value.
const minBrightness = Buffer.alloc(4);
const curBrightness = Buffer.alloc(4);
const maxBrightness = Buffer.alloc(4);
Dxva2.GetMonitorBrightness(physicalHandle, minBrightness.ptr, curBrightness.ptr, maxBrightness.ptr);
console.log(`Brightness ${curBrightness.readUInt32LE(0)} / range ${minBrightness.readUInt32LE(0)}–${maxBrightness.readUInt32LE(0)}`);

// 5. Set a new brightness (clamped to the reported range).
Dxva2.SetMonitorBrightness(physicalHandle, 50);

// 6. ALWAYS release the physical monitor handles.
Dxva2.DestroyPhysicalMonitors(physicalCount, physicalMonitorArray.ptr);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:lumen-pulse
bun run example:monitor-inspector
```

## Notes

- Either rely on lazy binding or call `Dxva2.Preload()`.
- Windows only. Bun runtime required.
- The monitor configuration functions speak DDC/CI over I²C. Many displays only partially implement the VESA MCCS standard — calls may succeed but the monitor may not react, or may react in surprising ways. Always read the supported-capabilities bitmask from `GetMonitorCapabilities` before issuing a Set call, and pair every `GetPhysicalMonitors*` with a matching `DestroyPhysicalMonitors`.
- One `HMONITOR` (GDI display) can resolve to multiple `PHYSICAL_MONITOR` entries when the OS aggregates a tiled or multi-input display.
- Many of the DXVA2/DXVAHD/OPM exports require a `IDirect3DDevice9*` or related COM interface as input. Constructing those requires `d3d9.dll` bindings, which are out of scope for this package — the prototypes are still bound so callers that already have an interface pointer (for example from a Direct3D shim) can use them.
