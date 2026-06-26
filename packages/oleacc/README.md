# @bun-win32/oleacc

Zero-dependency, zero-overhead Win32 Oleacc bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/oleacc` exposes the `oleacc.dll` exports — Microsoft Active Accessibility (MSAA) — using [Bun](https://bun.sh)'s FFI. It provides a single class, `Oleacc`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

MSAA complements UI Automation: `AccessibleObjectFromWindow` / `AccessibleObjectFromPoint` resolve an `IAccessible` for legacy and modern apps alike — the foundation for UI scraping, RPA, QA automation, and assistive tooling.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `oleacc.dll` (IAccessible from a window/point, role & state text decoding, object↔LRESULT marshaling).
- In-source docs in `structs/Oleacc.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Oleacc.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases plus `ROLE_SYSTEM`, `STATE_SYSTEM`, `OBJID` enums and the `IID_IAccessible` GUID (see `types/Oleacc.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/oleacc
```

## Quick Start

```ts
import Oleacc, { IID_IAccessible, OBJID, ROLE_SYSTEM } from '@bun-win32/oleacc';
import User32 from '@bun-win32/user32';

// Build the IID_IAccessible GUID bytes the API expects.
function guidBytes(value: string): Buffer {
  const m = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i.exec(value)!;
  const [, d1, d2, d3, d4h, d4l] = m;
  const b = Buffer.alloc(16);
  b.writeUInt32LE(parseInt(d1, 16), 0);
  b.writeUInt16LE(parseInt(d2, 16), 4);
  b.writeUInt16LE(parseInt(d3, 16), 6);
  const tail = `${d4h}${d4l}`;
  for (let i = 0; i < 8; i += 1) b[8 + i] = parseInt(tail.slice(i * 2, i * 2 + 2), 16);
  return b;
}

const iid = guidBytes(IID_IAccessible);
const ppAcc = Buffer.alloc(8);

// Resolve the IAccessible for the foreground window.
const hr = Oleacc.AccessibleObjectFromWindow(User32.GetForegroundWindow(), OBJID.OBJID_WINDOW >>> 0, iid.ptr!, ppAcc.ptr!);
const pAcc = ppAcc.readBigUInt64LE(0); // an IAccessible* token — call its vtable

// Decode any ROLE_SYSTEM_* / STATE_SYSTEM_* value to text.
const roleName = Buffer.alloc(128);
const n = Oleacc.GetRoleTextW(ROLE_SYSTEM.ROLE_SYSTEM_PUSHBUTTON, roleName.ptr!, 64);
console.log(roleName.toString('utf16le', 0, n * 2)); // "push button"
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:accessibility-radar
bun run example:ui-tree-inspector
```

- **accessibility-radar** — a live ANSI dashboard that follows your mouse, resolving the `IAccessible` under the pointer with `AccessibleObjectFromPoint` and rendering a scaled screen radar with the focused element's bounding box.
- **ui-tree-inspector** — a thorough diagnostic that resolves the foreground window's root `IAccessible` and recursively walks the whole accessibility tree (name / role / state / rectangle) with a role histogram summary.

## Notes

- COM interface pointers (`IAccessible*`, `IUnknown*`) are opaque `bigint` tokens. Read the address back from the out-buffer and invoke its vtable directly.
- `IAccessible` extends `IDispatch`; its property accessors take a `VARIANT varChild` by value — on x64 that 24-byte struct is passed as a pointer to a caller-allocated copy.
- Either rely on lazy binding or call `Oleacc.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
