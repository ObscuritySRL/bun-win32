# @bun-win32/core

Shared base class, runtime extensions, and fundamental Win32 types for `@bun-win32` packages.

## Overview

`@bun-win32/core` provides the foundation that all `@bun-win32` DLL packages build on:

- **`Win32` base class** — Abstract class that handles lazy `dlopen` loading and symbol memoization. Every DLL package (`kernel32`, `user32`, etc.) extends this class.
- **Runtime extensions** — Installs a `.ptr` getter on all `ArrayBuffer`, `Buffer`, `DataView`, and typed array prototypes, giving direct access to native pointers for Bun FFI calls.
- **Win32 type aliases** — Strongly-typed aliases (`HANDLE`, `DWORD`, `LPVOID`, `BOOL`, etc.) that map Win32 C types to their TypeScript equivalents.

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/core
```

> You typically do not need to install this directly — it is pulled in as a dependency of each DLL package.

> [!NOTE]
> AI agents: see `AI.md` for the package contract and runtime behavior. It explains how `@bun-win32/core` differs from the DLL binding packages.

## Usage

### Extending `Win32` for a new DLL

```ts
import { FFIType, type FFIFunction } from 'bun:ffi';
import { Win32 } from '@bun-win32/core';

class MyDll extends Win32 {
  protected static override name = 'mydll.dll';
  protected static override readonly Symbols = {
    MyFunction: { args: [FFIType.u32], returns: FFIType.i32 },
  } as const satisfies Record<string, FFIFunction>;

  public static MyFunction(value: number): number {
    return MyDll.Load('MyFunction')(value);
  }
}
```

### Runtime pointer extensions

```ts
import '@bun-win32/core';

const buffer = new Uint8Array([1, 2, 3]);
nativeFunction(buffer.ptr, buffer.length);
```

### Win32 type aliases

```ts
import type { DWORD, HANDLE, BOOL } from '@bun-win32/core';
```

## Notes

- This package is a dependency of all `@bun-win32` DLL packages.
- Windows only. Bun runtime required.
