# PROMPT.md — Generating a New Win32 API Package

You are creating a new `@bun-win32/{name}` package — a zero-dependency, zero-overhead FFI binding for `{name}.dll` using Bun on Windows.

This document is your **complete specification**. Follow it exactly. The result must be indistinguishable from the existing packages (`kernel32`, `user32`, `advapi32`, `gdi32`, `psapi`, `shlwapi`, `opengl32`, `glu32`).

---

## 0. Mindset — Read This First

This package will be downloaded millions of times. It will be used in production systems where correctness is not a preference — it is a hard requirement. People will build security tools, system utilities, and critical infrastructure on top of these bindings. **Lives may depend on the correctness of your work.**

Act like it.

- **Never take the easy way out.** If something is ambiguous, do not guess and move on. Stop. Read the Microsoft documentation. Read the existing packages. Test it. Then test it again. The lazy path — assuming a type, skipping a nullable annotation, eyeballing a parameter name — is not available to you.
- **Never assume. Ever.** Do not assume a parameter is a pointer because it "looks like one." Do not assume a function exists in a DLL because the docs mention it. Do not assume a handle is 32-bit because another API's handle was. Do not assume a parameter is non-nullable because "most parameters aren't." Verify every single claim against the docs, against dumpbin, against the runtime. Assumptions are bugs you haven't found yet.
- **Correctness over speed.** It does not matter how long this takes. What matters is that every type is right, every parameter name matches the docs character-for-character, every nullable annotation reflects reality, and every FFI declaration has been tested against a live call. A binding that is 99% correct is a binding that will crash in production for 1% of users.
- **If you are unsure, do not ship it.** Investigate until you are sure. Read the C header. Read the existing `kernel32` or `user32` bindings for the same type. Write a test. Change the type, run it again. Cross-reference two independent sources. Only commit a declaration when you are confident it is correct — not when you are tired of looking.

This is not a prototype. This is not a demo. This is infrastructure. Treat it accordingly.

---

## Table of Contents

1. [Prerequisites — Before You Write a Single Line](#1-prerequisites--before-you-write-a-single-line)
2. [Directory Structure](#2-directory-structure)
3. [Step-by-Step Creation Process](#3-step-by-step-creation-process)
4. [File Specifications](#4-file-specifications)
5. [FFI Type Mapping — The Critical Rules](#5-ffi-type-mapping--the-critical-rules)
6. [Nullability — `| NULL` and `| 0n`](#6-nullability--null-and--0n)
7. [Symbol Declarations](#7-symbol-declarations)
8. [Public Method Signatures](#8-public-method-signatures)
9. [Type Aliases and Enums](#9-type-aliases-and-enums)
10. [Testing — Non-Negotiable](#10-testing--non-negotiable)
11. [Completeness Checklist](#11-completeness-checklist)
12. [Common Mistakes to Avoid](#12-common-mistakes-to-avoid)
13. [Reference Commands](#13-reference-commands)

---

## 1. Prerequisites — Before You Write a Single Line

### 1a. Read the template directory

Read **every file** in `template/`:

```
template/
├── README.md
├── index.ts
├── package.json
├── tsconfig.json
├── structs/
│   └── {Class}.ts
└── types/
    └── {Class}.ts
```

The template files contain `{name}`, `{Name}`, `{Class}`, `{NAME}`, `{description}`, `{quickstart}`, and `{examples}` placeholders. You will replace these with the actual values for the target DLL.

- `{name}` = lowercase DLL name without `.dll` (e.g., `shell32`, `kernel32`)
- `{Name}` = title-case DLL name (e.g., `Shell32`, `Kernel32`)
- `{Class}` = PascalCase class name — usually same as `{Name}` (e.g., `Shell32`, `Kernel32`, `GDI32`, `OpenGL32`, `Psapi`, `Shlwapi`)
- `{NAME}` = uppercase DLL name (e.g., `SHELL32`, `KERNEL32`)
- `{description}` = a short phrase describing what the DLL covers (e.g., `process, memory, files, console, time, and more`)
- `{quickstart}` = a short TypeScript code example for the README
- `{examples}` = shell commands to run examples

### 1b. Dump the DLL exports

Use `dumpbin.exe` from the `bin/` directory to get the **authoritative list** of exported symbols:

```bash
./bin/dumpbin.exe //EXPORTS 'C:\Windows\System32\{name}.dll'
```

> **Shell escaping:** Use single quotes around the Windows path. Double backslashes (`C:\\Windows\\`) get consumed by the shell and produce an invalid path.

This gives you every exported function name. **This is your source of truth for what functions exist.** Do not guess — if a function is not in the dumpbin output, it is not exported from that DLL and must not be included.

Save this list. You will cross-reference it against Microsoft documentation for each function's signature.

### 1c. Read existing subprojects for reference

Before implementing, read at least `packages/kernel32` and `packages/user32` to understand the exact patterns. If you are unsure about any decision (type mapping, nullability, naming), look at how these projects handle it. They are your source of truth for style and convention.

You can also look at these projects quickly when you need to verify a type or pattern rather than searching the web.

### 1d. Read the Microsoft documentation

For **every single function** you are binding, read its Microsoft Docs page:

```
https://learn.microsoft.com/en-us/windows/win32/api/{header}/nf-{header}-{functionname}
```

The `{header}` is often (but not always) the same as the DLL name. Some DLLs have functions documented under different headers. For example, `kernel32` functions might be under `processthreadsapi`, `memoryapi`, `synchapi`, `fileapi`, `winbase`, etc.

You **must match the Microsoft documentation exactly** for:

- Function name (including A/W suffix)
- Parameter names (preserve Win32 naming: `hWnd`, `lpBuffer`, `dwSize`, `nCount`, etc.)
- Parameter types
- Return type
- Whether parameters are optional/nullable

---

## 2. Directory Structure

The final package must have this exact structure:

```
packages/{name}/
├── README.md
├── index.ts
├── package.json
├── tsconfig.json
├── structs/
│   └── {Class}.ts
└── types/
    └── {Class}.ts
```

Note: `.gitignore`, `.prettierrc.json`, and `AGENTS.md` live at the **repo root** and apply to all packages. Do not duplicate them per-package.

**No other files or directories** unless you also create an `example/` directory.

---

## 3. Step-by-Step Creation Process

Follow this order exactly. **Test at every step.** Do not proceed to the next step until the current step compiles and works.

### Step 1: Scaffold the project

1. Create the directory `packages/{name}/`.
2. Copy every template file from `template/` into `packages/{name}/`.
3. Replace all placeholders (`{name}`, `{Name}`, `{Class}`, `{NAME}`, etc.) in every file.
4. Run `bun install` in the new directory.
5. Run `bun run index.ts` — it should import without errors (even though no symbols are defined yet).

### Step 2: Dump and catalog the exports

1. Run `dumpbin.exe //EXPORTS 'C:\Windows\System32\{name}.dll'`.
2. Record the complete list of exported function names.
3. For each function, find the Microsoft Docs page and note:
   - The header file it belongs to (for the URL)
   - Every parameter: name, type, and whether it is optional/nullable
   - The return type
   - Whether there are A (ANSI) and W (Wide/Unicode) variants

### Step 3: Define types (`types/{Class}.ts`)

1. Start with the base types from the template.
2. Add every Win32 type alias needed by the functions you cataloged.
3. Add every enum needed for flag/constant groups.
4. Add any exported constants (like `INVALID_HANDLE_VALUE`, `HWND_ZORDER`, predefined `HKEY_*` values, etc.).
5. **Alphabetize everything** (ASCIIbetical: uppercase before lowercase).
6. Test: `bun run index.ts` must still work.

### Step 4: Build the symbols table (`structs/{Class}.ts`)

1. Add FFI symbol declarations one batch at a time (10-20 functions per batch).
2. After each batch, **test** by calling at least one of the new functions.
3. Pay meticulous attention to `.ptr` vs `.u64` (see Section 5).
4. Alphabetize all symbol entries.

### Step 5: Build the public methods (`structs/{Class}.ts`)

1. Add public static methods one batch at a time.
2. Each method must have a Microsoft Docs URL comment above it.
3. Each method must use the exact Win32 parameter names from the docs.
4. Each method must use the type aliases from `types/{Class}.ts`.
5. Add `| NULL` and `| 0n` where the docs say parameters are optional (see Section 6).
6. Alphabetize all methods.
7. **Test after each batch.**

### Step 6: Write the README

1. Fill in the README template with a real quick-start example.
2. Add any example scripts if appropriate.

### Step 7: Final verification

1. Run `bun run index.ts`.
2. Type-check with `npx tsc --noEmit` — verify there are **no** TypeScript errors in the library **or** the examples. If you created an `example/` directory, the example files must also pass the type-checker. A type error in an example means a method signature is wrong (e.g., missing `| NULL` on a parameter that callers pass `null` to).
3. Run a real integration test that calls several functions and verifies results.
4. Verify that the number of public methods matches the number of dumpbin exports you chose to bind.

---

## 4. File Specifications

### `index.ts`

```typescript
import {Class} from './structs/{Class}';

export * from './types/{Class}';
export default {Class};
```

Exactly two lines of real code. No deviations. Extensions are loaded transitively via `@bun-win32/core`.

### `package.json`

Copy from template and replace placeholders. Key fields:

```json
{
  "name": "@bun-win32/{name}",
  "version": "1.0.0",
  "dependencies": { "@bun-win32/core": "workspace:*" },
  "description": "Zero-dependency, zero-overhead Win32 {NAME} bindings for Bun (FFI) on Windows.",
  "author": "Stev Peifer <stev@bell.net>",
  "license": "MIT",
  "type": "module",
  "main": "./index.ts",
  "module": "index.ts",
  "exports": { ".": "./index.ts" },
  "peerDependencies": { "typescript": "^5" },
  "devDependencies": { "@types/bun": "latest" },
  "engines": { "bun": ">=1.1.0" },
  "sideEffects": false,
  "files": ["index.ts", "structs/*.ts", "types/*.ts", "README.md"]
}
```

Add `scripts` entries for any examples you create.

### `tsconfig.json`

Copy from template verbatim. Do not modify.

### `structs/{Class}.ts`

This is the main implementation file. The class **extends `Win32`** from `@bun-win32/core`, which provides the `Load()` and `Preload()` methods for lazy DLL binding. The skeleton looks like this:

```typescript
import { type FFIFunction, FFIType } from 'bun:ffi';

import { Win32 } from '@bun-win32/core';

import type { BOOL, DWORD, HANDLE, LPCWSTR, LPVOID, LPWSTR } from '../types/{Class}';

class {Class} extends Win32 {
  protected static override name = '{name}.dll';

  protected static override readonly Symbols = {
    // ... (see Section 7)
  } as const satisfies Record<string, FFIFunction>;

  // ... public methods (see Section 8)
}

export default {Class};
```

Key points:
- **`extends Win32`** — inherits `Load()` and `Preload()` from the base class in `@bun-win32/core`.
- **`protected static override name`** — tells the base class which DLL to open. Must include `.dll`.
- **`protected static override readonly Symbols`** — the FFI symbol table. Must use `override` (the root tsconfig sets `noImplicitOverride: true`).
- **Do not re-implement `Load()` or `Preload()`** — they are inherited from `Win32`.

See Sections 5-8 for detailed specification of the symbols and methods.

### `types/{Class}.ts`

This is the type definitions file. See Section 9 for the detailed specification.

---

## 5. FFI Type Mapping — The Critical Rules

This is the section where most AI make mistakes. Read it carefully.

### The fundamental distinction: `.ptr` vs `.u64`

In Bun's FFI (`bun:ffi`), there are two ways to represent pointer-sized values:

| FFIType       | TypeScript type | When to use                                                                                                                                                                                                                                                     |
| ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FFIType.ptr` | `Pointer`       | When you are **passing a buffer/memory address from your local process** — i.e., a pointer to data you allocated (a `Buffer`, `TypedArray`, struct, string buffer, etc.). The caller passes `buffer.ptr` or a `Pointer` value.                                  |
| `FFIType.u64` | `bigint`        | When the value is a **handle** (HANDLE, HWND, HMODULE, HDC, HKEY, etc.) or a **64-bit integer** (SIZE_T, ULONGLONG, DWORD_PTR, LONG_PTR, UINT_PTR, etc.) or a **remote pointer** (an address in another process's space that you must not dereference locally). |

### Concrete rules

1. **All HANDLE types use `FFIType.u64`** — returns `bigint` in TypeScript.
   - HANDLE, HWND, HINSTANCE, HMODULE, HDC, HKEY, HICON, HCURSOR, HMENU, HBRUSH, HPEN, HFONT, HRGN, HBITMAP, HPALETTE, HGLOBAL, HLOCAL, HDESK, HWINSTA, HHOOK, HDWP, HMONITOR, HACCEL, HCONV, HCONVLIST, HDDEDATA, HSZ, HPCON, HRSRC, HCRYPTHASH, HCRYPTKEY, HCRYPTPROV, HUSKEY, HGLRC, SC_HANDLE — **all `FFIType.u64`**.
   - In TypeScript: `export type HWND = bigint;`

2. **All pointer-to-data parameters use `FFIType.ptr`** — typed as `Pointer` in TypeScript.
   - LP\* types: LPVOID, LPSTR, LPWSTR, LPCSTR, LPCWSTR, LPBYTE, LPDWORD, LPHANDLE, LPRECT, LPPOINT, LPMSG, etc.
   - P\* types: PVOID, PBYTE, PDWORD, PSECURITY_ATTRIBUTES, PSID, etc.
   - Callback pointers: WNDPROC, DLGPROC, HOOKPROC, TIMERPROC, etc.
   - Structure pointers passed by reference: DEVMODEW, BITMAPINFO, etc.
   - In TypeScript: `export type LPVOID = Pointer;`

3. **64-bit integer types use `FFIType.u64`** — typed as `bigint`.
   - SIZE_T, DWORD_PTR, UINT_PTR, INT_PTR, LONG_PTR, ULONG_PTR, ULONGLONG, DWORDLONG, LARGE_INTEGER, ULARGE_INTEGER
   - LPARAM and WPARAM are special: LPARAM = LONG_PTR (bigint via `FFIType.i64`), WPARAM = UINT_PTR (bigint via `FFIType.u64`)

4. **32-bit types use `FFIType.u32` or `FFIType.i32`** — typed as `number`.
   - DWORD, UINT, ULONG → `FFIType.u32`
   - BOOL, INT, LONG → `FFIType.i32`
   - WORD, USHORT, SHORT → `FFIType.u16` / `FFIType.i16`
   - BYTE → `FFIType.u8`
   - ATOM → `FFIType.u16`

5. **`FFIType.void`** for functions that return nothing.

6. **PACKED structs passed by value** — some Win32 functions take small structs by value (not by pointer). For example, `POINT` (8 bytes: two INT32s) is passed by value to functions like `WindowFromPoint`. In Bun FFI, you must pack these into a `u64` (bigint) and use `FFIType.u64` in the symbol declaration. See the `packPOINT` helper in `user32/types/User32.ts` for an example. If the target DLL has similar by-value struct parameters, follow the same pattern.

7. **COLORREF** is a `DWORD` (`FFIType.u32`, typed as `number`).

8. **Return types follow the same rules.** A function returning `HANDLE` uses `returns: FFIType.u64`. A function returning `LPVOID` uses `returns: FFIType.ptr`. A function returning `DWORD` uses `returns: FFIType.u32`.

### When in doubt

- **Read the Microsoft docs** for the function. Look at the parameter type in the C declaration.
- **Check `kernel32` or `user32`** — search for the same type or a similar function.
- **Test it with both.** Try `FFIType.u64` (bigint) first, then try `FFIType.ptr` (Pointer). Test both — observe which crashes, which returns sensible values, and which matches the MS docs and the patterns in `kernel32`/`user32`. Then make the judgment call.

---

## 6. Nullability — `| NULL` and `| 0n`

Microsoft documentation explicitly marks certain parameters as optional. These must be reflected in the TypeScript signatures.

### `| NULL` — for pointer parameters that accept null

When the MS docs say a pointer parameter can be `NULL`, add `| NULL` to the TypeScript type:

```typescript
// The docs say lpSecurityAttributes can be NULL
public static CreateFileW(
  lpFileName: LPCWSTR,
  dwDesiredAccess: DWORD,
  dwShareMode: DWORD,
  lpSecurityAttributes: LPSECURITY_ATTRIBUTES | NULL,
  dwCreationDisposition: DWORD,
  dwFlagsAndAttributes: DWORD,
  hTemplateFile: HANDLE
): HANDLE {
  return Kernel32.Load('CreateFileW')(...);
}
```

`NULL` is defined in `types/{Class}.ts` as:

```typescript
export type NULL = null;
```

Common nullable pointer parameters include:

- `LPSECURITY_ATTRIBUTES` (very often optional)
- `LPOVERLAPPED` (often optional)
- `LPVOID` (when the docs say "This parameter can be NULL")
- Any `LP*` or `P*` parameter the docs explicitly mark as optional

### `| 0n` — for handle parameters that accept zero/null

When the MS docs say a handle parameter can be `NULL` or zero, add `| 0n` to the TypeScript type:

```typescript
// The docs say hWndParent can be NULL (no parent)
public static CreateWindowExW(
  dwExStyle: DWORD,
  lpClassName: LPCWSTR,
  lpWindowName: LPCWSTR | NULL,
  dwStyle: DWORD,
  X: int,
  Y: int,
  nWidth: int,
  nHeight: int,
  hWndParent: HWND | 0n,
  hMenu: HMENU | 0n,
  hInstance: HINSTANCE | 0n,
  lpParam: LPVOID | NULL
): HWND {
  return User32.Load('CreateWindowExW')(...);
}
```

Common nullable handle parameters include:

- `HWND` parent/owner windows that can be `NULL` (no owner)
- `HMENU` when a menu is optional
- `HINSTANCE` when the module handle is optional
- `HBITMAP` when a bitmap is optional (e.g., `CreateCaret`)
- `HHOOK` when the MS docs explicitly say the parameter is ignored (e.g., `CallNextHookEx`)
- Any DDE handle (`HSZ`, `HCONV`, `HCONVLIST`) that the docs say can be `NULL`

### How to decide

1. Read the **Parameters** section of the Microsoft Docs page for the function.
2. Read the **Return value** section — many sizing-call functions document that `ERROR_INSUFFICIENT_BUFFER` or `ERROR_BUFFER_OVERFLOW` is returned "if the buffer parameter is **NULL**." This is explicit confirmation that the buffer is nullable.
3. Read the **Remarks** section and any **Example code** — nullability is sometimes only documented here (e.g., `GetInterfaceInfo` documents its NULL-first-call pattern in Remarks, not Parameters).
4. For **callback registration functions** (e.g., `Notify*Change`, `Register*`), the `CallerContext` parameter (typed `PVOID`) is a pass-through to the callback. These are always nullable — the docs never list `CallerContext = NULL` as an error condition.
5. If a parameter says "This parameter can be NULL", "If this parameter is NULL", or "This parameter is optional":
   - For pointer types (`LP*`, `P*`) → add `| NULL`
   - For handle types (`H*`, `HANDLE`) → add `| 0n`
6. If the docs do **not** mention the parameter being optional anywhere (Parameters, Return value, Remarks, or Examples), do **not** add a union. Not every pointer parameter is nullable.

### The sizing-call pattern

Many Win32 functions follow a two-call pattern: the first call passes `NULL` for the output buffer to get the required size, the second call passes an allocated buffer. These buffer parameters **must** be marked `| NULL`:

```typescript
// GetAdaptersInfo: first call with NULL to get required buffer size
public static GetAdaptersInfo(AdapterInfo: PIP_ADAPTER_INFO | NULL, SizePointer: PULONG): ULONG { ... }

// GetExtendedTcpTable: same pattern
public static GetExtendedTcpTable(pTcpTable: PVOID | NULL, pdwSize: PDWORD, ...): DWORD { ... }
```

Look for these signals in the docs:
- Return value mentions `ERROR_INSUFFICIENT_BUFFER` or `ERROR_BUFFER_OVERFLOW` when the buffer is `NULL`
- Remarks describe calling the function "first with a NULL pointer" to determine the required size
- Example code shows `FunctionName(NULL, &size)`

If you miss `| NULL` on these parameters, callers cannot use the standard sizing pattern without a type error.

---

## 7. Symbol Declarations

The `Symbols` object is a `protected static override readonly` field on the class (overriding the empty default from `Win32`). It maps Win32 export names to FFI function signatures.

### Format

```typescript
protected static override readonly Symbols = {
  FunctionNameA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
  FunctionNameW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
  // ...
} as const satisfies Record<string, FFIFunction>;
```

### Rules

1. **Alphabetize** all entries (ASCIIbetical: uppercase before lowercase).
2. **One entry per line** unless the args array is very long. If it exceeds the 240-char print width, break it across lines.
3. **Every function from dumpbin** that has a documented signature should be included. Do not cherry-pick.
4. **Do not include** forwarded functions (shown as `(forwarded to ...)` in dumpbin) unless they are also documented as direct exports. Some forwarded functions still work via dlopen — test if unsure.
5. **Do not include** undocumented internal functions (e.g., names starting with underscore that have no MS docs page — unless they are legacy APIs like `_hread`, `_lclose`, etc. that are documented).
6. Use the **exact export name** from dumpbin. Capitalization matters. If dumpbin says `GetModuleHandleW`, the symbol key is `GetModuleHandleW`, not `getModuleHandleW`.

### The comment header above Symbols

Include this exact comment block (adjusted for your DLL) above the Symbols object:

```typescript
// ---------------------------------------------------------------------------
// FFI symbol declarations — alphabetized
//
// FFIType reference:
//   FFIType.i32   → BOOL, int, LONG
//   FFIType.u32   → DWORD, UINT, ULONG
//   FFIType.u64   → HANDLE, HWND, HMODULE (returned as bigint)
//   FFIType.ptr   → any pointer parameter (LPVOID, LPWSTR, LPCWSTR, etc.)
//   FFIType.void  → void return
//
// Consult the Win32 docs for each function's exact signature:
//   https://learn.microsoft.com/en-us/windows/win32/api/{header}/nf-{header}-{functionname}
// ---------------------------------------------------------------------------
```

---

## 8. Public Method Signatures

Each symbol gets a corresponding public static method on the class.

### Format

```typescript
// https://learn.microsoft.com/en-us/windows/win32/api/{header}/nf-{header}-{functionname}
public static FunctionNameW(paramOne: TYPE1, paramTwo: TYPE2 | NULL, paramThree: TYPE3): RETURN_TYPE {
  return {Class}.Load('FunctionNameW')(paramOne, paramTwo, paramThree);
}
```

### Rules

1. **One Microsoft Docs URL comment** directly above each method. The URL must be the exact docs page for that function. Use lowercase in the URL path.
2. **Use the exact Win32 parameter names** from the Microsoft documentation. Do not rename them. `hWnd` stays `hWnd`, `lpBuffer` stays `lpBuffer`, `dwSize` stays `dwSize`. This is the one exception to the "no abbreviations" naming rule.
3. **Type each parameter** using the type aliases from `types/{Class}.ts`.
4. **Add `| NULL` or `| 0n`** where appropriate (see Section 6).
5. **Alphabetize** all methods (ASCIIbetical).
6. **The method body is always a single line**: `return {Class}.Load('MethodName')(args);`
7. If a method has many parameters and exceeds the 240-char print width, break the parameter list across multiple lines (one param per line, indented). The body remains a single-line return.

### The comment header above methods

Include this exact comment block above the methods section:

```typescript
// ---------------------------------------------------------------------------
// Public methods — alphabetized, one per symbol
//
// Each method:
//   1. Has a Microsoft Docs link as a comment above it.
//   2. Uses Win32 parameter names as-is (hWnd, lpBuffer, dwSize, etc.).
//   3. Delegates to Load() which lazy-binds on first call.
//   4. Is typed with aliases from ../types/{Class}.ts.
// ---------------------------------------------------------------------------
```

---

## 9. Type Aliases and Enums

### `types/{Class}.ts` structure

Many common Win32 types (BOOL, DWORD, HANDLE, HWND, LPVOID, LPWSTR, LPCWSTR, NULL, etc.) are already defined in `@bun-win32/core`. **Re-export shared types from core** rather than redefining them locally. Only define types here that are specific to this DLL.

```typescript
import type { Pointer } from 'bun:ffi';

export type { BOOL, DWORD, HANDLE, LPCWSTR, LPVOID, LPWSTR } from '@bun-win32/core';
```

**No comment blocks or section headers.** The existing packages (`kernel32`, `user32`, `advapi32`, `gdi32`, `psapi`) do not have them. Do not add `// Re-export shared Win32 types from core`, `// ── Scalar types`, `// ── Pointer types`, or any similar decorative comments. The type file should be clean: imports, re-exports, constants, enums, types.

**Important:** `export type { X } from '@bun-win32/core'` re-exports `X` for consumers of this package but does **not** make `X` available for use within this same file. If you need a core type locally (e.g., to define a constant like `export const INVALID_HANDLE_VALUE = -1n as HANDLE`), you must also add a separate import:

```typescript
import type { DWORD, HANDLE } from '@bun-win32/core';
```

Place this `import type` line **before** the `export type` re-export line.

### File ordering

The file must follow this exact order:

1. `import type { Pointer } from 'bun:ffi';`
2. (Optional) `import type { ... } from '@bun-win32/core';` — only if you need core types locally (for constants)
3. `export type { ... } from '@bun-win32/core';` — re-export shared types
4. (Optional) Exported constants (`INVALID_HANDLE_VALUE`, `HKEY_*`, `HWND_ZORDER`, etc.)
5. Enums — alphabetized by enum name, members alphabetized within each enum
6. Type aliases — **all types mixed together** (scalars and pointers interleaved), alphabetized

**Do not group types into separate sections** (e.g., "scalar types" vs "pointer types"). They are all interleaved in one alphabetized block, matching `kernel32`, `user32`, `advapi32`, and `gdi32`.

### Type alias rules

1. **Alphabetize** all type aliases.
2. **Re-export shared types from `@bun-win32/core`** — check `packages/core/types/Win32.ts` for the full list of available shared types. Do not redefine types that already exist in core.
3. **Only define package-specific types** below the re-export. For example, if your DLL uses `HKEY` (not in core), define it: `export type HKEY = bigint;`
4. **Handles → `bigint`**: `export type HKEY = bigint;`
5. **Pointers → `Pointer`**: `export type LPSECURITY_ATTRIBUTES = Pointer;`
6. **32-bit unsigned → `number`**: `export type REGSAM = number;`
7. **32-bit signed → `number`**: `export type LSTATUS = number;`
8. **64-bit integers → `bigint`**: `export type SIZE_T = bigint;`
9. **`void` → `void`**: `export type VOID = void;`
10. **NULL → `null`**: `export type NULL = null;` (already in core — re-export it)
11. Only define types that are **actually used** by the functions you are binding. Do not speculatively define unused types.

### Enum rules

1. **Alphabetize** enum names and their members.
2. Use **hex literals with numeric separators** for values: `0x0000_0001`, `0x0000_0400`, etc.
3. Name enum members using the **exact Win32 constant name**: `WS_POPUP`, `MB_OK`, `SW_SHOW`, etc.
4. Group related constants into a single enum. For example, all `WS_*` window style constants go into a `WindowStyles` enum.
5. If the DLL has well-known constant groups (file flags, access rights, display flags, etc.), create enums for them.

### Exported constants

Some Win32 APIs have well-known constant values that don't fit in enums. Export them as constants:

```typescript
// kernel32 example
export const INVALID_HANDLE_VALUE = -1n as HANDLE;
export const INFINITE = 0xffffffff as DWORD;

// user32 example
export const HWND_ZORDER = {
  TOP: 0n as HWND,
  BOTTOM: 1n as HWND,
  TOPMOST: -1n as HWND,
  NOTOPMOST: -2n as HWND,
} as const;

// advapi32 example
export const HKEY_CLASSES_ROOT = 0x8000_0000n as HKEY;
export const HKEY_CURRENT_CONFIG = 0x8000_0005n as HKEY;
export const HKEY_CURRENT_USER = 0x8000_0001n as HKEY;
// ...
```

---

## 10. Testing — Non-Negotiable

### Test at every step

After every batch of symbols/methods you add, test them. Not a type-check — a **real call** to the FFI function.

### What a real test looks like

```typescript
import { Class } from './structs/{Class}';

// Call a function that should succeed
const result = { Class }.SomeFunctionW(args);
console.log('SomeFunctionW returned:', result);

// Verify the result makes sense
if (result === 0) {
  console.error('FAIL: expected non-zero result');
  process.exit(1);
}

console.log('PASS');
```

### Testing `.ptr` vs `.u64` decisions

If you are uncertain whether a parameter should be `FFIType.ptr` or `FFIType.u64`, **test both** — try `u64` first:

```typescript
// Test 1: Try with FFIType.u64 (passing a bigint) — try this first
try {
  const result = { Class }.SomeFunction(0n);
  console.log('u64 works:', result);
} catch (e) {
  console.log('u64 failed:', e);
}

// Test 2: Try with FFIType.ptr (passing a Buffer pointer)
const buffer = Buffer.alloc(256);
try {
  const result = { Class }.SomeFunction(buffer.ptr);
  console.log('ptr works:', result);
} catch (e) {
  console.log('ptr failed:', e);
}
```

**Always test both**, even if the first one works. Then make a judgment call based on: (1) the MS docs for that parameter's C type, (2) how `kernel32` and `user32` handle the same or analogous types, and (3) your gut. The runtime results inform the decision — they don't make it for you.

### Test categories

1. **Smoke test**: Does the import work? Does `{Class}.Preload()` succeed without errors?
2. **Individual function tests**: Call each function with valid arguments and verify the return value.
3. **Nullability tests**: Pass `null` for `| NULL` parameters, `0n` for `| 0n` parameters. Verify no crash.
4. **Error-path tests**: Call functions with known-bad arguments and verify they return error codes (not crash).

### When tests fail

- If a function crashes (segfault, access violation): your FFI type mapping is wrong. Check `.ptr` vs `.u64`, check the number of arguments, check the return type.
- If a function returns unexpected values: check the parameter order, check signedness (i32 vs u32), check 32-bit vs 64-bit.
- If `dlopen` fails to find a symbol: the function may not be exported from that DLL. Re-check dumpbin output.

---

## 11. Completeness Checklist

Before you are done, verify:

- [ ] **Every template file** exists in the new package, with placeholders replaced.
- [ ] **`bun install`** succeeds.
- [ ] **`bun run index.ts`** succeeds (no import errors).
- [ ] **All dumpbin exports** that have MS documentation are bound (both A and W variants where they exist).
- [ ] **All type aliases** needed by the bound functions are defined in `types/{Class}.ts`.
- [ ] **All enums** for flag/constant groups are defined and exported.
- [ ] **All relevant constants** are exported.
- [ ] **All symbols are alphabetized** in the Symbols object.
- [ ] **All methods are alphabetized** in the class.
- [ ] **All type aliases are alphabetized** in the types file.
- [ ] **All enum members are alphabetized** within each enum.
- [ ] **Every method has a Microsoft Docs URL** comment above it.
- [ ] **Every method uses exact Win32 parameter names** from the docs.
- [ ] **`| NULL` is used** on every pointer parameter that the docs say can be NULL.
- [ ] **`| 0n` is used** on every handle parameter that the docs say can be NULL/zero.
- [ ] **No `as unknown as T`** or `as any` casts anywhere.
- [ ] **Hex literals with numeric separators** are used for all constants (`0x0000_0001`, not `1`).
- [ ] **Single quotes** for all strings (per `.prettierrc.json`).
- [ ] **Print width 240** is respected (per `.prettierrc.json`).
- [ ] **At least one real integration test** passes (calling actual FFI functions, not just type-checking).
- [ ] **README** has a working quick-start example.
- [ ] **`package.json`** has correct metadata, keywords, files, and scripts.

---

## 12. Common Mistakes to Avoid

### Mistake 1: Using `.ptr` for handles

**Wrong:**

```typescript
CloseHandle: { args: [FFIType.ptr], returns: FFIType.i32 },
```

**Right:**

```typescript
CloseHandle: { args: [FFIType.u64], returns: FFIType.i32 },
```

Handles are opaque numeric values, not memory pointers. They are `bigint` in Bun FFI. Using `.ptr` will cause crashes or silent corruption.

### Mistake 2: Using `.u64` for buffer pointers

**Wrong:**

```typescript
GetWindowTextW: { args: [FFIType.u64, FFIType.u64, FFIType.i32], returns: FFIType.i32 },
//                                     ^^^^^^^^^^^ lpString should be ptr
```

**Right:**

```typescript
GetWindowTextW: { args: [FFIType.u64, FFIType.ptr, FFIType.i32], returns: FFIType.i32 },
//                       ^^^^^^^^^^   ^^^^^^^^^^
//                       hWnd=handle  lpString=buffer pointer
```

Buffer pointers (where you pass `buffer.ptr`) must use `FFIType.ptr`. Using `.u64` means Bun treats the value as a raw bigint, not a pointer.

### Mistake 3: Forgetting LPARAM/WPARAM are 64-bit

On 64-bit Windows, `LPARAM` is `LONG_PTR` (signed 64-bit) and `WPARAM` is `UINT_PTR` (unsigned 64-bit). In FFI:

- LPARAM → `FFIType.i64` (signed)
- WPARAM → `FFIType.u64` (unsigned)

### Mistake 4: Forgetting A/W variants

Most string-taking Win32 functions have both `FunctionA` (ANSI) and `FunctionW` (Wide/Unicode) variants. **Bind both.** Both appear in the dumpbin output. Both should have corresponding symbols and methods.

### Mistake 5: Not checking dumpbin

Never assume a function exists in a DLL. The Microsoft docs may document a function under a particular header, but it may be exported from a different DLL than you expect. **Always verify with dumpbin.**

### Mistake 6: Inventing parameter names

The MS docs say `hWnd` — you write `hWnd`. Not `windowHandle`, not `handle`, not `hwnd` (lowercase). The **exact** casing and naming from the docs.

### Mistake 7: Missing nullability

If the MS docs say "This parameter can be NULL" and you don't add `| NULL` or `| 0n`, the TypeScript types are lying to the caller. Read every parameter description.

### Mistake 8: Using `CString` for wide strings

`CString` from `bun:ffi` is UTF-8 only. Win32 wide-string functions (the `W` variants) use UTF-16LE. Encode with:

```typescript
const str = Buffer.from('Hello\0', 'utf16le');
```

### Mistake 9: Confusing LRESULT/LONG_PTR with LONG

`LRESULT` and `LONG_PTR` are 64-bit on x64 Windows. They map to `FFIType.i64` and TypeScript `bigint`. `LONG` is 32-bit and maps to `FFIType.i32` and TypeScript `number`.

### Mistake 10: Not using `as const satisfies Record<string, FFIFunction>`

The Symbols object must end with `as const satisfies Record<string, FFIFunction>`. This ensures type safety and enables the generic `Load<T>` method to infer the correct types.

---

## 13. Reference Commands

### Dump DLL exports

```bash
./bin/dumpbin.exe //EXPORTS 'C:\Windows\System32\{name}.dll'
```

### Install dependencies

```bash
cd packages/{name} && bun install
```

### Run the entry point (smoke test)

```bash
cd packages/{name} && bun run index.ts
```

### Type-check

```bash
cd packages/{name} && bunx tsc --noEmit
```

### Run an example

```bash
cd packages/{name} && bun run example/{name}.ts
```

---

## Appendix A: Complete Example — Small DLL (Psapi)

For a concrete example of a small, complete binding, read `packages/psapi/`. It has 28 functions and demonstrates every pattern:

- `packages/psapi/types/Psapi.ts` — 1 enum, handle types, pointer types, scalar types
- `packages/psapi/structs/Psapi.ts` — 28 symbols, 28 methods, full docs URLs
- `packages/psapi/index.ts` — standard entry point

This is your best reference for understanding the complete flow without being overwhelmed by 1,000+ functions.

## Appendix B: Complete Example — Large DLL (Kernel32)

For the most comprehensive example, read `packages/kernel32/`. It has 1,400+ functions and demonstrates:

- Massive Symbols table with every FFI type combination
- 26+ enums covering flags, access rights, modes
- Exported constants (`INVALID_HANDLE_VALUE`, `INFINITE`, `STD_HANDLE`)
- `| NULL` on nullable pointer parameters
- Every handle type using `FFIType.u64`

## Appendix C: Nullable Handles Example (User32)

For the most extensive examples of `| 0n` and `| NULL` usage, read `packages/user32/`. It demonstrates:

- `HWND | 0n` for optional parent windows
- `HMENU | 0n` for optional menus
- `HINSTANCE | 0n` for optional module handles
- `LPCWSTR | NULL` for optional strings
- `LPSECURITY_ATTRIBUTES | NULL` for optional security attributes
- `LPVOID | NULL` for optional buffers
- `PACKED_POINT` pattern for structs passed by value
- `packPOINT()` helper function

## Appendix D: OpenGL/Non-Win32 Naming

If the DLL uses non-Win32 naming conventions (like OpenGL's `glBegin`, `gluSphere`), preserve the **exact export names**. Do not PascalCase them. The function names in the Symbols table and public methods must match the dumpbin output exactly.

## Appendix E: Struct Pointers vs Struct By-Value

Most Win32 structs are passed by pointer (`FFIType.ptr`). The caller allocates a `Buffer`, writes fields into it, and passes `buffer.ptr`.

A few small structs (notably `POINT` — 8 bytes) are passed **by value**. In Bun FFI, this means packing the struct into a `bigint` and using `FFIType.u64`. The `user32` package has a `packPOINT` function that demonstrates this pattern. If your DLL has similar by-value struct parameters, follow the same approach:

```typescript
// In types/{Class}.ts
export type PACKED_POINT = bigint;

const _packBuf = Buffer.alloc(8);

export function packPOINT(x: number, y: number): PACKED_POINT {
  _packBuf.writeInt32LE(x, 0);
  _packBuf.writeInt32LE(y, 4);
  return _packBuf.readBigUInt64LE(0);
}
```

And in the Symbols table:

```typescript
WindowFromPoint: { args: [FFIType.u64], returns: FFIType.u64 },
//                        ^^^^^^^^^^^ PACKED_POINT passed as u64
```
