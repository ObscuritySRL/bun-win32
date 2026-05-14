# @bun-win32/wintrust

Zero-dependency, zero-overhead Win32 Wintrust bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/wintrust` exposes the `wintrust.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Wintrust`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `wintrust.dll` (Authenticode signature verification, catalog files, trust providers, and subject interface packages).
- In-source docs in `structs/Wintrust.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Wintrust.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Wintrust.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/wintrust
```

## Quick Start

```ts
import Wintrust, { WINTRUST_ACTION_GENERIC_VERIFY_V2 } from '@bun-win32/wintrust';

// Verify the Authenticode signature of a PE file.
function verify(exePath: string): number {
  // WINTRUST_FILE_INFO (x64): 32 bytes
  const pathBuf = Buffer.from(exePath + '\0', 'utf16le');
  const fileInfo = Buffer.alloc(32);
  fileInfo.writeUInt32LE(32, 0); // cbStruct
  fileInfo.writeBigUInt64LE(BigInt(pathBuf.ptr!), 8); // pcwszFilePath

  // WINTRUST_DATA (x64, with pSignatureSettings): 88 bytes
  const trustData = Buffer.alloc(88);
  trustData.writeUInt32LE(88, 0); // cbStruct
  trustData.writeUInt32LE(2, 24); // dwUIChoice = WTD_UI_NONE
  trustData.writeUInt32LE(0, 28); // fdwRevocationChecks = WTD_REVOKE_NONE
  trustData.writeUInt32LE(1, 32); // dwUnionChoice = WTD_CHOICE_FILE
  trustData.writeBigUInt64LE(BigInt(fileInfo.ptr!), 40); // pFile

  return Wintrust.WinVerifyTrust(-1n, WINTRUST_ACTION_GENERIC_VERIFY_V2.ptr!, trustData.ptr!);
}

const status = verify(process.execPath);
console.log(status === 0 ? 'Trusted' : `Failed: 0x${(status >>> 0).toString(16)}`);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:authenticode-audit  # System32 signature audit with status bars and counts
bun run example:trust-radar         # Animated radar sweep verifying directories in real time
```

## Notes

- Either rely on lazy binding or call `Wintrust.Preload()`.
- WinVerifyTrust returns 0 on success; any non-zero value is a status code (do **not** use `SUCCEEDED()`).
- System files like `notepad.exe` are catalog-signed (no embedded signature); WinVerifyTrust returns `TRUST_E_NOSIGNATURE` (0x800B0100) for them — use `CryptCATAdmin*` to look them up in the system catalog database.
- Windows only. Bun runtime required.
