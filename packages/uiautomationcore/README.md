# @bun-win32/uiautomationcore

Zero-dependency, zero-overhead Win32 UIAutomationCore bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/uiautomationcore` exposes the documented flat `uiautomationcore.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `UIAutomationCore`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `uiautomationcore.dll` (UI Automation nodes, pattern objects, provider bridging, and event plumbing).
- In-source docs in `structs/UIAutomationCore.ts` with links to Microsoft Learn.
- Lazy binding on first call; optional eager preload (`UIAutomationCore.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/UIAutomationCore.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/uiautomationcore
```

## Quick Start

```ts
import UIAutomationCore from '@bun-win32/uiautomationcore';

UIAutomationCore.Preload(['UiaClientsAreListening', 'UiaGetRootNode', 'UiaNodeRelease']);

console.log('UIA clients listening:', UIAutomationCore.UiaClientsAreListening() !== 0);

const rootNodeBuffer = Buffer.alloc(8);
const result = UIAutomationCore.UiaGetRootNode(rootNodeBuffer.ptr!);

if (result !== 0) {
  throw new Error(`UiaGetRootNode failed: 0x${(result >>> 0).toString(16).padStart(8, '0')}`);
}

const rootNode = rootNodeBuffer.readBigUInt64LE(0);

try {
  console.log('Root node handle:', `0x${rootNode.toString(16)}`);
} finally {
  void UIAutomationCore.UiaNodeRelease(rootNode);
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:focus-radar      # animate UIA availability for the foreground window
bun run example:pattern-probe    # inspect common pattern providers on the active window
```

## Notes

- Either rely on lazy binding or call `UIAutomationCore.Preload()`.
- `VARIANT` and `UiaPoint` parameters are modeled as caller-packed buffers; allocate the native layout locally and pass `.ptr`.
- Windows only. Bun runtime required.
