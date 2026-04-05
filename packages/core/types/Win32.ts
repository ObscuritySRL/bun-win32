import type { Pointer } from 'bun:ffi';

// ── Scalar types (number) ───────────────────────────────────────────────────

export type ACCESS_MASK = number;
export type BOOL = number;
export type BOOLEAN = number;
export type BYTE = number;
export type CHAR = number;
export type DWORD = number;
export type HRESULT = LONG;
export type INT = number;
export type LONG = number;
export type SHORT = number;
export type UINT = number;
export type ULONG = number;
export type USHORT = number;
export type WCHAR = number;
export type WORD = number;

// ── 64-bit types (bigint) ───────────────────────────────────────────────────

export type DWORD_PTR = bigint;
export type HANDLE = bigint;
export type HINSTANCE = bigint;
export type HMODULE = bigint;
export type HWND = bigint;
export type INT_PTR = bigint;
export type LONG_PTR = bigint;
export type SIZE_T = bigint;
export type UINT_PTR = bigint;
export type ULONG_PTR = bigint;

// ── Derived types ───────────────────────────────────────────────────────────

export type LPARAM = LONG_PTR;
export type LRESULT = LONG_PTR;
export type WPARAM = UINT_PTR;

// ── Common pointer types ────────────────────────────────────────────────────

export type LPBOOL = Pointer;
export type LPBYTE = Pointer;
export type LPCSTR = Pointer;
export type LPCVOID = Pointer;
export type LPCWSTR = Pointer;
export type LPDWORD = Pointer;
export type LPHANDLE = Pointer;
export type LPSECURITY_ATTRIBUTES = Pointer;
export type LPSTR = Pointer;
export type LPVOID = Pointer;
export type LPWSTR = Pointer;
export type PBYTE = Pointer;
export type PDWORD = Pointer;
export type PHANDLE = Pointer;
export type PULONG = Pointer;
export type PVOID = Pointer;

// ── Special ─────────────────────────────────────────────────────────────────

export type NULL = null;
export type VOID = void;
