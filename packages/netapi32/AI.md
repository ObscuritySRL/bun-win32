# AI Guide for @bun-win32/netapi32

This file documents the binding contract of this package, not the Windows API itself.

## What This Package Is

- The package exports one class: `Netapi32`.
- Every `Netapi32.MethodName(...)` call is a thin 1:1 binding to `netapi32.dll!MethodName`.
- Method names, parameter names, and parameter order follow Microsoft Docs.
- `Netapi32.Preload()` only changes when symbols are bound. It does not change signatures, return values, or semantics.
- The package does not add wrappers, helper objects, automatic conversions, error translation, or cleanup.

## How To Read It

- `index.ts` exports the default `Netapi32` class and re-exports everything from `types/Netapi32.ts`.
- `structs/Netapi32.ts` is the method index. Each static method maps to one export and has a Microsoft Docs URL comment above it.
- `types/Netapi32.ts` contains the aliases, enums, constants, flags, and sentinels used by the method signatures.
- `README.md` contains quick examples and package-level notes.

## Calling Convention

- If the DLL exposes both `A` and `W` variants, they are exposed as separate methods.
- `W` methods expect UTF-16LE NUL-terminated buffers from the caller.
- Pointer arguments are passed as `.ptr` from caller-owned buffers or structs.
- Out parameters are caller-allocated memory passed by pointer.
- Optional pointers are `null`.
- Optional handles are usually `0n`.
- Handles and pointer-sized integers are usually `bigint`.
- Flags, enums, constants, and sentinels should be imported from `@bun-win32/netapi32` when available.

## Errors And Lifetime

- Return values are raw native results.
- Failure sentinels and error sources follow the underlying API contract.
- When the native API uses Win32 last-error semantics, read the error through the corresponding API, such as `GetLastError()`.
- Resource ownership is unchanged from Win32. If the native API requires cleanup, you must still do it here.
