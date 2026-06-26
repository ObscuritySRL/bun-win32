# @bun-win32/windowsaccessbridge-64

Zero-dependency, zero-overhead Java Access Bridge bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/windowsaccessbridge-64` exposes the `WindowsAccessBridge-64.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `WindowsAccessBridge`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The Java Access Bridge is the bridge that lets Windows assistive technologies read and drive Swing/AWT applications. These bindings cover all 97 exports: window classification, AccessibleContext navigation, text/table/hypertext/value/selection accessors, and the event-callback registration functions.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `WindowsAccessBridge-64.dll` (window classification, accessible-context inspection, text/table/value queries, event callbacks).
- In-source docs in `structs/WindowsAccessBridge.ts` with links to the upstream OpenJDK headers.
- Lazy binding on first call; optional eager preload (`WindowsAccessBridge.Preload()`).
- No wrapper overhead; calls map 1:1 to native exports.
- Strongly-typed aliases (see `types/WindowsAccessBridge.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later
- `WindowsAccessBridge-64.dll` (installed with any Java runtime; on `PATH`/System32)
- A running Java application with the Access Bridge enabled (`jabswitch -enable`) to inspect live UI

## Installation

```sh
bun add @bun-win32/windowsaccessbridge-64
```

## Quick Start

```ts
import WindowsAccessBridge from '@bun-win32/windowsaccessbridge-64';

// 1. Initialize the bridge once.
WindowsAccessBridge.Windows_run();

// 2. Each Java VM registers its windows with this process by posting messages after
//    Windows_run. Pump the message queue (e.g. via User32 PeekMessageW/DispatchMessageW)
//    for ~1s so registration lands before you classify any window.

// 3. Classify a window and read its root AccessibleContext.
if (WindowsAccessBridge.isJavaWindow(hWnd)) {
  const vmID = Buffer.alloc(4);
  const context = Buffer.alloc(8);
  WindowsAccessBridge.getAccessibleContextFromHWND(hWnd, vmID.ptr, context.ptr);

  const info = Buffer.alloc(6188); // sizeof(AccessibleContextInfo)
  WindowsAccessBridge.getAccessibleContextInfo(vmID.readInt32LE(0), context.readBigUInt64LE(0), info.ptr);

  const name = info.toString('utf16le', 0, 2048).replace(/\0.*$/s, ''); // name[MAX_STRING_SIZE]
  const role = info.toString('utf16le', 4096, 4096 + 512).replace(/\0.*$/s, ''); // role[SHORT_STRING_SIZE]
  console.log(role, name);

  WindowsAccessBridge.releaseJavaObject(vmID.readInt32LE(0), context.readBigUInt64LE(0));
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example/jab-inspector.ts        # exhaustive Java accessibility-tree diagnostic
bun run example/accessibility-radar.ts  # animated radar that lights up Java windows live
```

## Notes

- Either rely on lazy binding or call `WindowsAccessBridge.Preload()`.
- The DLL exports use lower-camelCase internal names (`getAccessibleContextInfo`, `setFocusGainedFP`); signatures follow the OpenJDK `AccessBridgeCalls.h` / `AccessBridgePackages.h` headers.
- Most query functions round-trip to a live JVM over Windows messages — they need a running Java app and a pumped message loop in the calling process to return data.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
