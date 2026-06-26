# @bun-win32/comdlg32

Zero-dependency, zero-overhead Win32 Comdlg32 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/comdlg32` exposes the `comdlg32.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Comdlg32`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `comdlg32.dll` (native Open/Save file dialogs, Color picker, Font picker, Print dialog, Page Setup, Find/Replace, and last-error reporting).
- In-source docs in `structs/Comdlg32.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Comdlg32.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Comdlg32.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/comdlg32
```

## Quick Start

```ts
import Comdlg32, { OpenFileNameFlag } from '@bun-win32/comdlg32';

// Build an OPENFILENAMEW struct (152 bytes on x64) for GetOpenFileNameW
const OPENFILENAMEW_SIZE = 152;
const ofn = Buffer.alloc(OPENFILENAMEW_SIZE);
const view = new DataView(ofn.buffer);

// Filter: pipe-separated label/pattern pairs, NUL-terminated, double-NUL at end
const filter = Buffer.from('All Files (*.*)\0*.*\0\0', 'utf16le');

// Output buffer for the chosen path (260 wide chars)
const fileBuf = Buffer.alloc(260 * 2);

view.setUint32(0x00, OPENFILENAMEW_SIZE, true);            // lStructSize
view.setBigUint64(0x18, BigInt(filter.ptr!), true);        // lpstrFilter
view.setBigUint64(0x30, BigInt(fileBuf.ptr!), true);       // lpstrFile
view.setUint32(0x38, 260, true);                           // nMaxFile
view.setUint32(0x60, OpenFileNameFlag.OFN_EXPLORER | OpenFileNameFlag.OFN_FILEMUSTEXIST, true);

if (Comdlg32.GetOpenFileNameW(ofn.ptr!)) {
  const path = fileBuf.toString('utf16le').replace(/\0.*$/, '');
  console.log('Selected:', path);
} else {
  console.log('Cancelled. Error code:', Comdlg32.CommDlgExtendedError());
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:palette-painter        # Interactive color picker — build a palette of colors
bun run example:file-dialog-diagnostic # Open file dialog with full OPENFILENAMEW field dump
```

## Notes

- Either rely on lazy binding or call `Comdlg32.Preload()`.
- All `A`/`W` pairs are bound; prefer the `W` (Unicode) variants for modern code.
- The common dialog APIs are interactive — they display modal windows. Use `CommDlgExtendedError()` to inspect failure codes after a `FALSE`/`0` return.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
