import type { Pointer } from 'bun:ffi';

// Re-export shared Win32 types from core.
// Only include types that are actually used by this package.
export type { BOOL, DWORD, HANDLE, LPCWSTR, LPVOID, LPWSTR } from '@bun-win32/core';

// ---------------------------------------------------------------------------
// Package-specific Win32 type aliases
//
// These map Win32 C types to their Bun FFI equivalents:
//   - Handles (HANDLE, HWND, HMODULE, etc.) → bigint (FFIType.u64)
//   - Booleans (BOOL) → number (FFIType.i32)
//   - Unsigned 32-bit (DWORD, UINT) → number (FFIType.u32)
//   - Pointers (LP*, P*) → Pointer (FFIType.ptr)
//
// Add types here in alphabetical order as needed by structs/{Class}.ts.
// Export enums for flag/constant groups used by callers.
// ---------------------------------------------------------------------------
