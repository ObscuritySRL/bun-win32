# @bun-win32/wimgapi

Zero-dependency, zero-overhead Win32 WIMGAPI bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/wimgapi` exposes the `wimgapi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Wimgapi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The Windows Imaging Interface (WIMGAPI) is the supported, in-process API for Windows image (`.wim`) files — create/open archives, capture a directory tree, apply or enumerate an image, mount/unmount, split, export, set references, and stream live progress through a message callback. It is the same engine `DISM.exe` and `ImageX` drive, with no process spawn. It complements [`@bun-win32/dismapi`](../dismapi) (image servicing).

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `wimgapi.dll` (image capture/apply/mount/split/export, message callbacks).
- In-source docs in `structs/Wimgapi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Wimgapi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases and the full WIM flag/message enums (see `types/Wimgapi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later
- An **elevated** process for capture/apply/mount (`WIMCaptureImage`/`WIMApplyImage`/`WIMMountImage` need `SeBackupPrivilege`/`SeRestorePrivilege`). Opening a `.wim` read-only and enumerating it (`WIMApplyImage` with `WIM_FLAG_NO_APPLY`) needs no privilege.

## Installation

```sh
bun add @bun-win32/wimgapi
```

## Quick Start

```ts
import Wimgapi, { WIMCreationDisposition, WIMDesiredAccess } from '@bun-win32/wimgapi';

const wide = (s: string) => Buffer.from(s + '\0', 'utf16le');

// Open an existing .wim read-only and read its header + image count.
const result = Buffer.alloc(4);
const hWim = Wimgapi.WIMCreateFile(wide('C:\\images\\install.wim').ptr!, WIMDesiredAccess.WIM_GENERIC_READ, WIMCreationDisposition.WIM_OPEN_EXISTING, 0, 0, result.ptr!);

if (hWim !== 0n) {
  console.log('images in archive:', Wimgapi.WIMGetImageCount(hWim));

  const wimInfo = Buffer.alloc(560); // WIM_INFO
  if (Wimgapi.WIMGetAttributes(hWim, wimInfo.ptr!, 560)) {
    console.log('compression type:', wimInfo.readUInt32LE(540));
  }

  Wimgapi.WIMCloseHandle(hWim); // always pair create/open with close
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples (run elevated, or pass an existing `.wim` path, for full output):

```sh
bun run example/wim-inspector.ts [path\to\image.wim]
bun run example/wim-xray.ts      [path\to\image.wim]
```

- **wim-inspector** — a thorough diagnostic: decoded `WIM_INFO` header (GUID, compression, parts, attributes), per-image XML manifest, and the live system-wide mounted-image table.
- **wim-xray** — a live truecolor X-ray of an image's file tree, driven by the real imaging engine calling back into a `bun:ffi` JSCallback (registered via `WIMRegisterMessageCallback`, enumerated with `WIMApplyImage(hImage, NULL, WIM_FLAG_NO_APPLY)`).

## Notes

- Either rely on lazy binding or call `Wimgapi.Preload()`.
- All WIM functions are wide-only (no `A`/`W` split); strings are UTF-16LE NUL-terminated buffers.
- Handles (`WIMCreateFile`/`WIMLoadImage`/`WIMCaptureImage` returns) are `bigint`; failure is `0n`. Always release them with `WIMCloseHandle`.
- `WIMGetImageInformation` returns a **WIM-allocated** UTF-16 buffer via a `PVOID*` out-pointer plus a `DWORD` byte count; read the count from your own buffer, then free the buffer with `Kernel32.LocalFree`.
- Sizing pattern: `WIMGetMountedImages(NULL, &cb)` / `WIMGetMountedImageInfo(level, &count, NULL, 0, &cb)` return the required buffer size; allocate, then call again.
- Register a `WIMMessageCallback` (a `bun:ffi` JSCallback passed as `FARPROC`) for live progress; return `WIM_MSG_SUCCESS` to continue or `WIM_MSG_ABORT_IMAGE` to cancel. Keep the JSCallback alive for the duration of the operation.
- Seven exported file-IO/enumeration functions (`WIMReadImageFile`, `WIMCreateImageFile`, `WIMFindFirstImageFile`, `WIMFindNextImageFile`, `WIMEnumImageFiles`, `WIMInitFileIOCallbacks`, `WIMSetFileIOCallbackTemporaryPath`) and the `Dll*` server entries are undocumented internals and intentionally not bound.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
