# @bun-win32/activeds

Zero-dependency, zero-overhead Win32 Activeds bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/activeds` exposes the `activeds.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Activeds`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

These are the ADSI (Active Directory Service Interfaces) C/C++ helper functions: bind to a directory object by ADsPath (`ADsGetObject` / `ADsOpenObject`), enumerate container children (`ADsBuildEnumerator` / `ADsEnumerateNext` / `ADsFreeEnumerator`), build Automation variant arrays, and round-trip binary security descriptors. The object surface itself is COM (`IADs` / `IADsContainer`), driven through the returned interface pointers. The `WinNT:` provider works on a standalone machine; `LDAP:` requires a directory.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `activeds.dll` (ADSI directory automation).
- In-source docs in `structs/Activeds.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Activeds.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Activeds.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/activeds
```

## Quick Start

```ts
import { CFunction, FFIType, type Pointer, dlopen, read } from 'bun:ffi';

import Activeds from '@bun-win32/activeds';

// COM must be initialized before any ADSI bind.
const ole32 = dlopen('ole32.dll', { CoInitializeEx: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 } });
ole32.symbols.CoInitializeEx(null, 0x2 /* COINIT_APARTMENTTHREADED */);

// IID_IADs = {fd8256d0-fd15-11ce-abc4-02608c9e7553}
const iid = Buffer.alloc(16);
iid.writeUInt32LE(0xfd8256d0, 0);
iid.writeUInt16LE(0xfd15, 4);
iid.writeUInt16LE(0x11ce, 6);
Buffer.from([0xab, 0xc4, 0x02, 0x60, 0x8c, 0x9e, 0x75, 0x53]).copy(iid, 8);

const path = Buffer.from(`WinNT://${process.env.COMPUTERNAME},computer\0`, 'utf16le');
const ppObject = Buffer.alloc(8);

const hr = Activeds.ADsGetObject(path.ptr!, iid.ptr!, ppObject.ptr!);
const pIADs = ppObject.readBigUInt64LE(0);
console.log('ADsGetObject hr =', (hr >>> 0).toString(16), 'IADs* =', pIADs.toString(16));

// IADs::get_Name is vtable slot 7 (IUnknown 0-2, IDispatch 3-6).
const vtable = read.u64(Number(pIADs) as Pointer, 0);
const getName = read.u64(Number(vtable) as Pointer, 7 * 8);
const pBstr = Buffer.alloc(8);
CFunction({ ptr: Number(getName) as Pointer, args: [FFIType.u64, FFIType.ptr], returns: FFIType.i32 })(pIADs, pBstr.ptr!);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:directory-explorer
bun run example:directory-constellation
```

## Notes

- Either rely on lazy binding or call `Activeds.Preload()`.
- Call `CoInitializeEx` before any ADSI bind; ADSI objects are COM.
- Windows only. Bun runtime required.
