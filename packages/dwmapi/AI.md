# AI Guide for @bun-win32/dwmapi

This file documents the binding contract of this package, not the Windows API itself.

## What This Package Is

- The package exports one class: `Dwmapi`.
- Every `Dwmapi.MethodName(...)` call is a thin 1:1 binding to `dwmapi.dll!MethodName`.
- Method names, parameter names, and parameter order follow Microsoft Docs.
- `Dwmapi.Preload()` only changes when symbols are bound. It does not change signatures, return values, or semantics.
- The package does not add wrappers, helper objects, automatic conversions, error translation, or cleanup.

## How To Read It

- `index.ts` exports the default `Dwmapi` class and re-exports everything from `types/Dwmapi.ts`.
- `structs/Dwmapi.ts` is the method index. Each static method maps to one export and has a Microsoft Docs URL comment above it.
- `types/Dwmapi.ts` contains the aliases, enums, constants, flags, and sentinels used by the method signatures.
- `README.md` contains quick examples and package-level notes.

## Calling Convention

- If the DLL exposes both `A` and `W` variants, they are exposed as separate methods.
- `W` methods expect UTF-16LE NUL-terminated buffers from the caller.
- Pointer arguments are passed as `.ptr` from caller-owned buffers or structs.
- Out parameters are caller-allocated memory passed by pointer.
- Optional pointers are `null`.
- Optional handles are usually `0n`.
- Handles and pointer-sized integers are usually `bigint`.
- Flags, enums, constants, and sentinels should be imported from `@bun-win32/dwmapi` when available.

## Errors And Lifetime

- Return values are raw native results.
- Failure sentinels and error sources follow the underlying API contract.
- When the native API uses Win32 last-error semantics, read the error through the corresponding API, such as `GetLastError()`.
- Resource ownership is unchanged from Win32. If the native API requires cleanup, you must still do it here.
