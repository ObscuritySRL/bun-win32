# PROMPT.md — Generating a New Win32 API Package

You are creating `@bun-win32/{name}` — a zero-dependency FFI binding for `{name}.dll` using Bun on Windows. This is production infrastructure. Verify every claim against MS docs and dumpbin. Never guess.

---

## 1. Placeholders

### TypeScript files

TS files use valid identifiers as placeholders so the template type-checks:

| Placeholder     | Replace with                        | Example                            |
| --------------- | ----------------------------------- | ---------------------------------- |
| `WIN32_CLASS`   | PascalCase class name               | `Kernel32`, `GDI32`, `Ws2_32`     |
| `WIN32_DLL`     | lowercase DLL name (in string only) | `kernel32`, `gdi32`, `ws2_32`     |

### Non-TypeScript files (README.md, package.json, AI.md)

| Placeholder     | Replace with                                 | Example                                              |
| --------------- | -------------------------------------------- | ---------------------------------------------------- |
| `{name}`        | lowercase DLL name without `.dll`            | `kernel32`                                           |
| `{Name}`        | title-case display name                      | `Kernel32`, `GDI32`                                  |
| `{Class}`       | PascalCase class name (same as `WIN32_CLASS`)| `Kernel32`, `GDI32`, `Ws2_32`                        |
| `{NAME}`        | uppercase                                    | `KERNEL32`, `GDI32`                                  |
| `{description}` | short phrase for the README subtitle         | `process, memory, files, console, time, and more`    |
| `{quickstart}`  | TypeScript quick-start example               |                                                      |
| `{examples}`    | shell commands to run examples               |                                                      |

---

## 2. Prerequisites

### 2a. Read the template

Read **every file** in `packages/template/`. The template is type-safe — files compile as-is. After copying to `packages/{name}/`, rename `WIN32_CLASS` in filenames and code, and replace all other placeholders.

### 2b. Dump the DLL exports

```bash
./bin/dumpbin.exe //EXPORTS 'C:\Windows\System32\{name}.dll'
```

> Use single quotes around the Windows path. This is your **source of truth** for what functions exist. If a function is not in the output, it is not exported and must not be bound.

### 2c. Read reference packages

Read `packages/kernel32` and `packages/user32` for patterns. All packages in `packages/` (excluding `core`) follow the same conventions. When in doubt about any decision, check how those packages handle it.

### 2d. Read Microsoft documentation

For **every** function you bind, read its docs page. The header is often not the DLL name — e.g., `kernel32` functions may be under `processthreadsapi`, `memoryapi`, `fileapi`, `winbase`, etc.

```
https://learn.microsoft.com/en-us/windows/win32/api/{header}/nf-{header}-{functionname}
```

Match the documentation **exactly** for: function name (including A/W suffix), parameter names (preserve `hWnd`, `lpBuffer`, `dwSize`, etc.), parameter types, return type, and nullability.

---

## 3. Directory Structure

```
packages/{name}/
|-- AI.md
|-- README.md
|-- example/
|-- index.ts
|-- package.json
|-- tsconfig.json
|-- structs/
|   `-- {Class}.ts
`-- types/
    `-- {Class}.ts
```

No other files or directories. `.gitignore` and `.prettierrc.json` live at the repo root.

---

## 4. FFI Type Mapping — The Critical Rules

This is where most mistakes happen. Read this section carefully, then read it again.

### The core distinction: `FFIType.ptr` vs `FFIType.u64`

| FFIType       | TS type   | When to use                                                                |
| ------------- | --------- | -------------------------------------------------------------------------- |
| `FFIType.ptr` | `Pointer` | **Local memory addresses** — buffers, strings, structs passed by reference |
| `FFIType.u64` | `bigint`  | **Handles**, **64-bit integers**, and **remote/opaque pointer values**     |

### The decision rule

Ask: **"Does the caller pass `.ptr` from a Buffer/TypedArray they allocated?"**

- **Yes** → `FFIType.ptr` (Pointer)
- **No** → `FFIType.u64` (bigint)

### `FFIType.u64` — handles and 64-bit integers

**All HANDLE types are `FFIType.u64`.** Handles are opaque numeric tokens, not memory addresses. You never dereference a handle. You never call `.ptr` on a handle.

```
HANDLE, HWND, HINSTANCE, HMODULE, HDC, HKEY, HICON, HCURSOR, HMENU, HBRUSH, HPEN,
HFONT, HRGN, HBITMAP, HPALETTE, HGLOBAL, HLOCAL, HDESK, HWINSTA, HHOOK, HDWP,
HMONITOR, HACCEL, HCONV, HCONVLIST, HDDEDATA, HSZ, HPCON, HRSRC, HCRYPTHASH,
HCRYPTKEY, HCRYPTPROV, HUSKEY, HGLRC, SC_HANDLE
```

TypeScript: `export type HWND = bigint;`

**All pointer-SIZED integer types are `FFIType.u64` (or `FFIType.i64` if signed).** These have "PTR" in the name but are NOT pointers — they are integers whose width matches the pointer size:

```
SIZE_T, DWORD_PTR, UINT_PTR, INT_PTR, LONG_PTR, ULONG_PTR, ULONGLONG, DWORDLONG,
LARGE_INTEGER, ULARGE_INTEGER
```

Special cases:
- `WPARAM` = `UINT_PTR` → `FFIType.u64` (unsigned)
- `LPARAM` = `LONG_PTR` → `FFIType.i64` (signed)
- `LRESULT` = `LONG_PTR` → `FFIType.i64` (signed)

**Remote pointers are `FFIType.u64`.** If a parameter is an address in *another process's* address space (e.g., `lpBaseAddress` in `ReadProcessMemory`), you must not dereference it locally. Pass it as `bigint`, not `Pointer`.

### `FFIType.ptr` — local data pointers

**All LP\* and P\* data types are `FFIType.ptr`.** The caller allocates memory and passes `.ptr`:

```
LPVOID, LPSTR, LPWSTR, LPCSTR, LPCWSTR, LPBYTE, LPDWORD, LPHANDLE, LPRECT,
LPPOINT, LPMSG, PVOID, PBYTE, PDWORD, PSECURITY_ATTRIBUTES, PSID, ...
```

TypeScript: `export type LPVOID = Pointer;`

**Callback function pointers are `FFIType.ptr`.** When the docs say a parameter is a "pointer to an application-defined callback function" (like `WNDPROC`, `HOOKPROC`, `TIMERPROC`, `DLGPROC`), the caller creates the callback via Bun's `CFunction`/`JSCallback` and passes its `.ptr`. These are real addresses in your local process.

### STOP — "Pointer to a function" does NOT always mean `FFIType.ptr`

MS Docs frequently describe parameters as "A pointer to a function that receives..." or "Pointer to the callback function." **Before using `FFIType.ptr`, verify what the caller actually passes.**

The test: **Can the caller construct this value from a `Buffer`, `TypedArray`, or `JSCallback` in their own process?**

- "Pointer to a callback function" where the **caller registers their own function** → `FFIType.ptr` (they pass `jsCallback.ptr`)
- "Pointer to a function" that is actually a **FARPROC/PROC returned by `GetProcAddress`** → this is an opaque function address. If the API takes it as a parameter, check the C typedef. If the C type is a handle or `LONG_PTR`-family type, use `FFIType.u64`. If it's a true `void*` or function pointer typedef, use `FFIType.ptr`.

**When uncertain, check the C prototype in the header, not the English description.** The docs' English prose is often ambiguous. The C annotations (`_In_`, `_Out_`, `_In_opt_`, and the actual C type) are authoritative.

### 32-bit and smaller types

| Win32 type                    | FFIType        | TS type  |
| ----------------------------- | -------------- | -------- |
| DWORD, UINT, ULONG            | `FFIType.u32`  | `number` |
| BOOL, INT, LONG               | `FFIType.i32`  | `number` |
| WORD, USHORT                   | `FFIType.u16`  | `number` |
| SHORT                          | `FFIType.i16`  | `number` |
| BYTE                           | `FFIType.u8`   | `number` |
| ATOM                           | `FFIType.u16`  | `number` |
| COLORREF                       | `FFIType.u32`  | `number` |
| void return                    | `FFIType.void` |          |

### By-value structs

A few small structs (notably `POINT` — 8 bytes) are passed **by value**, not by pointer. Pack them into a `bigint` and use `FFIType.u64`. See `packPOINT` in `packages/user32/types/User32.ts`.

### Return types follow the same rules

A function returning `HANDLE` → `returns: FFIType.u64`. Returning `LPVOID` → `returns: FFIType.ptr`. Returning `DWORD` → `returns: FFIType.u32`.

### When in doubt

1. Read the C declaration on the MS docs page.
2. Search `packages/kernel32` or `packages/user32` for the same type.
3. **Test both.** Try `FFIType.u64` first, then `FFIType.ptr`. Observe which crashes, which returns sensible values. The runtime informs the decision — it doesn't make it.

---

## 5. Nullability — `| NULL` and `| 0n`

### `| NULL` — pointer parameters that accept null

When the docs say a pointer parameter can be `NULL`, add `| NULL`:

```typescript
lpSecurityAttributes: LPSECURITY_ATTRIBUTES | NULL,
```

### `| 0n` — handle parameters that accept zero/null

When the docs say a handle parameter can be `NULL` or zero, add `| 0n`:

```typescript
hWndParent: HWND | 0n,
```

### How to decide

Check **all four** locations on the docs page — they don't always agree:

1. **C prototype** — `[in, optional]`, `_In_opt_`, `_Out_opt_` SAL annotations.
2. **Parameters section** — "This parameter can be **NULL**", "This parameter is optional."
3. **Return value section** — sizing-call signals: "If the buffer is **NULL**", `ERROR_INSUFFICIENT_BUFFER`.
4. **Remarks and example code** — nullability is sometimes only documented here.

If confirmed nullable: pointer types (`LP*`, `P*`) → `| NULL`. Handle types (`H*`, `HANDLE`) → `| 0n`.

If the docs do **not** mention nullability in any of the four locations, do **not** add a union.

### The sizing-call pattern

Many functions use a two-call pattern: first call with `NULL` buffer to get the required size, second call with an allocated buffer. These buffer parameters **must** be `| NULL`:

```typescript
public static GetAdaptersInfo(AdapterInfo: PIP_ADAPTER_INFO | NULL, SizePointer: PULONG): ULONG { ... }
```

Look for: `ERROR_INSUFFICIENT_BUFFER`, `ERROR_BUFFER_OVERFLOW`, "first with a NULL pointer."

### Nullable parameter audit (mandatory)

After all methods are written, perform a **dedicated review pass** over every method:

1. For each method with pointer or handle parameters, open its MS docs page.
2. Check all four locations above.
3. Add missing `| NULL` or `| 0n`.
4. Remove incorrect unions where the docs don't confirm nullability.

This step exists because bulk-writing 100+ methods inevitably misses annotations. It is not optional.

---

## 6. Symbol Declarations

```typescript
/** @inheritdoc */
protected static override readonly Symbols = {
  FunctionNameA: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
  FunctionNameW: { args: [FFIType.ptr, FFIType.u32], returns: FFIType.i32 },
} as const satisfies Record<string, FFIFunction>;
```

Rules:
1. **Alphabetize** all entries (ASCIIbetical).
2. **Every documented export from dumpbin** should be included. Bind both A and W variants.
3. **Do not include** forwarded functions (`(forwarded to ...)`) or undocumented internals.
4. Use the **exact export name** from dumpbin — capitalization matters.

---

## 7. Public Method Signatures

```typescript
// https://learn.microsoft.com/en-us/windows/win32/api/{header}/nf-{header}-{functionname}
public static FunctionNameW(paramOne: TYPE1, paramTwo: TYPE2 | NULL): RETURN_TYPE {
  return {Class}.Load('FunctionNameW')(paramOne, paramTwo);
}
```

Rules:
1. **One MS Docs URL comment** above each method.
2. **Exact Win32 parameter names** — `hWnd`, `lpBuffer`, `dwSize`, not renamed.
3. **Type using aliases** from `types/{Class}.ts`.
4. **Add `| NULL` / `| 0n`** per Section 5.
5. **Alphabetize** all methods.
6. **Body is always one line**: `return {Class}.Load('MethodName')(args);`

---

## 8. Type Aliases and Enums

### `types/{Class}.ts` structure

Re-export shared types from `@bun-win32/core` rather than redefining them. Only define types specific to this DLL.

```typescript
import type { Pointer } from 'bun:ffi';

import type { DWORD, HANDLE } from '@bun-win32/core';
export type { BOOL, DWORD, HANDLE, LPCWSTR, LPVOID, LPWSTR, NULL } from '@bun-win32/core';
```

**Important:** `export type { X } from '...'` re-exports `X` for consumers but does **not** make `X` available within this file. If you need a core type locally (e.g., for a constant), add a separate `import type` line **before** the `export type` line.

### File ordering

1. `import type { Pointer } from 'bun:ffi';`
2. (Optional) `import type { ... } from '@bun-win32/core';` — only if needed locally
3. `export type { ... } from '@bun-win32/core';` — re-export shared types
4. (Optional) Exported constants (`INVALID_HANDLE_VALUE`, `HKEY_*`, etc.)
5. Enums — alphabetized, members alphabetized, hex literals with numeric separators (`0x0000_0001`)
6. Type aliases — all interleaved in one alphabetized block (no section grouping)

### Type rules

- Handles → `bigint`
- Pointers → `Pointer`
- 32-bit unsigned → `number`
- 32-bit signed → `number`
- 64-bit integers → `bigint`
- Only define types **actually used** by your bindings.

**No comment blocks or section headers.** No decorative comments like `// Scalar types` or `// Pointer types`. The file is clean: imports, re-exports, constants, enums, types.

---

## 9. Process

Follow this order. **Test at every step.**

1. **Scaffold.** Copy `packages/template/` to `packages/{name}/`. Rename `WIN32_CLASS` files and identifiers. Replace all placeholders. Run `bun install` and `bun run index.ts`.

2. **Catalog exports.** Run dumpbin. For each function, find the MS docs page. Note every parameter name, type, nullability, and the return type.

3. **Define types** (`types/{Class}.ts`). Add every alias, enum, and constant. Alphabetize. Test: `bun run index.ts`.

4. **Build symbols** (`structs/{Class}.ts`). Add FFI declarations in batches of 10-20. Test after each batch.

5. **Build methods** (`structs/{Class}.ts`). Add public static methods in batches. Each has a MS docs URL, exact parameter names, type aliases, `| NULL` / `| 0n`. Test after each batch.

6. **Nullable audit.** Dedicated pass over every method — see Section 5.

7. **README, AI.md, examples.** Fill in the README template. Fill in AI.md (change only class/DLL/package names). Add example scripts. Update the **root README.md** (Packages table and Project Structure tree).

8. **Final verification.** Run `bun run index.ts`. Run `bunx prettier --write "packages/{name}/**/*.ts"`. Run `bunx tsc --noEmit`. Run a real integration test.

---

## 10. Completeness Checklist

- [ ] Every template file exists with placeholders replaced
- [ ] `bun install` and `bun run index.ts` succeed
- [ ] All documented dumpbin exports are bound (both A and W variants)
- [ ] All type aliases, enums, and constants are defined and exported
- [ ] Everything alphabetized (symbols, methods, types, enum members)
- [ ] Every method has a MS Docs URL comment
- [ ] Every method uses exact Win32 parameter names
- [ ] `| NULL` on every nullable pointer; `| 0n` on every nullable handle
- [ ] No `as unknown as T` or `as any` casts
- [ ] Hex literals use numeric separators (`0x0000_0001`)
- [ ] Prettier formatted, tsc passes with no errors
- [ ] At least one real FFI integration test passes
- [ ] README points agents to AI.md
- [ ] AI.md exists
- [ ] Root README updated
- [ ] `package.json` has correct metadata, keywords, files, scripts

---

## 11. Reference Commands

```bash
# Dump DLL exports
./bin/dumpbin.exe //EXPORTS 'C:\Windows\System32\{name}.dll'

# Install
cd packages/{name} && bun install

# Smoke test
cd packages/{name} && bun run index.ts

# Type-check
cd packages/{name} && bunx tsc --noEmit

# Format
cd packages/{name} && bunx prettier --write "**/*.ts"

# Run example
cd packages/{name} && bun run example/{name}.ts
```

---

## 12. Reference Packages

- **Small DLL example:** `packages/psapi` — ~28 functions, demonstrates every pattern concisely.
- **Large DLL example:** `packages/kernel32` — 1,000+ functions, massive Symbols table, 26+ enums, exported constants.
- **Nullable handles example:** `packages/user32` — extensive `| 0n` and `| NULL` usage, `PACKED_POINT` pattern.
- **Non-Win32 naming:** `packages/opengl32` — preserves `glBegin`, `gluSphere` naming (not PascalCased).

All packages in `packages/` (excluding `core`) follow identical conventions.
