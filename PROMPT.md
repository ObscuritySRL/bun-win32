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

## 3. The `Win32` Base Class

Every package subclass extends `Win32` from `@bun-win32/core`. You do **not** need to read the base class — everything you need is here.

### Architecture

```
Win32 (base, in @bun-win32/core)
 ├── name: string              — the DLL filename, e.g. 'kernel32.dll'
 ├── Symbols: Record<string, FFIFunction>  — FFI signatures; subclasses override
 ├── Load(method): NativeFunction          — lazily binds one export
 └── Preload(methods?): void               — eagerly binds multiple exports
```

Each package subclass does three things:

1. Sets `protected static override readonly name = '{name}.dll';`
2. Overrides `Symbols` with its FFI declarations.
3. Exposes public static methods that call `{Class}.Load('ExportName')(args)`.

### How `Load` works (lazy binding)

`Load(method)` is the only way methods invoke DLL functions. On **first call**:

1. Checks if the method is already bound (non-configurable own property).
2. If not, calls `dlopen(this.name, { [method]: this.Symbols[method] })` to load **only that one export**.
3. Memoizes the result with `Object.defineProperty` (non-configurable) so subsequent calls skip dlopen entirely.
4. Returns the native function for immediate invocation.

This means startup cost is zero — no DLL is loaded until a method is actually called, and each export is bound at most once.

### How `Preload` works (eager binding)

`Preload()` binds all symbols at once. `Preload('Foo')` or `Preload(['Foo', 'Bar'])` binds a subset. It skips already-bound symbols. Use it for hot paths where you want to pay the binding cost upfront.

### What this means for subclass code

Every public method body is always one line:

```typescript
public static FunctionNameW(hWnd: HWND, lpBuffer: LPWSTR): BOOL {
  return Kernel32.Load('FunctionNameW')(hWnd, lpBuffer);
}
```

You never call `dlopen` directly. You never manage caching. You never import `dlopen`. The base class handles all of it through `Load`.

---

## 4. Directory Structure

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

## 5. FFI Type Mapping — The Critical Rules

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

### How NULL returns behave at runtime

The FFI return type determines the JS representation of a null/zero return:

| FFI return type | NULL value at runtime | JS type    |
| --------------- | --------------------- | ---------- |
| `FFIType.u64`   | `0n`                  | `bigint`   |
| `FFIType.ptr`   | `null`                | `null`     |
| `FFIType.u32`   | `0`                   | `number`   |

When a function "returns NULL on success" (e.g., `LocalFree` returns `HLOCAL`), the return type is **not** `null` — it is `0n` because `HLOCAL` maps to `FFIType.u64`. The TypeScript return type should be the proper type alias (e.g., `HLOCAL`), not `DWORD` or `void`. The caller checks `result === 0n`.

### No type casts — ever

**Do not use `as unknown as T`, `as any`, or any forced cast anywhere** — not in struct files, not in type files, not in examples, not in tests. If the types don't line up, the FFI mapping or the type alias is wrong. Fix the root cause:

- FFI says `u64` but TS type says `number`? → Change the TS alias to `bigint`.
- FFI says `ptr` but you're passing a handle? → The FFI type or the parameter type is wrong. Check the C prototype.
- Return type mismatch? → Fix the return type alias, don't cast.

If you find yourself reaching for a cast, **stop** and re-read Sections 5 and 6. The type system should agree with the FFI layer without coercion.

### When in doubt

1. Read the C declaration on the MS docs page.
2. Search `packages/kernel32` or `packages/user32` for the same type.
3. **Test both.** Try `FFIType.u64` first, then `FFIType.ptr`. Observe which crashes, which returns sensible values. The runtime informs the decision — it doesn't make it.

---

## 6. Nullability — `| NULL` and `| 0n`

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

Use a **header-first** workflow. Do not rely on memory or English prose alone.

1. **Inspect the Windows SDK header prototype first.**
   - Open the real header for the function (`libloaderapi.h`, `fileapi.h`, `processthreadsapi.h`, etc.).
   - Treat SAL annotations as the primary source of truth for parameter optionality.
   - Any parameter annotation containing `_opt_` is nullable for bindings purposes:
     - `_In_opt_`
     - `_Inout_opt_`
     - `_Out_opt_`
     - `_Outptr_opt_`
     - `_Out_writes_opt_`
     - `_Out_writes_to_opt_`
     - `_In_reads_opt_`
     - `_In_reads_bytes_opt_`
     - and the related `_opt_` SAL families
   - Also treat parameters annotated with `OPTIONAL` as nullable.
   - Treat `_Reserved_` pointer and handle parameters as nullable too when the Windows API expects callers to pass `NULL`.

2. **Map optionality to the TypeScript union mechanically.**
   - Optional or reserved pointer-like parameters (`LP*`, `LPC*`, `P*`, callback pointers, struct pointers) → add `| NULL`
   - Optional or reserved handle-like parameters (`HANDLE`, `HMODULE`, `HWND`, any `H*` handle typedef) → add `| 0n`
   - Do **not** change the FFI symbol type because of nullability alone. `FFIType.ptr` and `FFIType.u64` stay the same; only the TS method signature gets the nullable union.

3. **Then cross-check the docs page in all four locations below.**

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

After all methods are written, perform a **dedicated review pass** over every method. This is a mechanical audit, not an intuition-based one:

1. For each method with pointer or handle parameters, inspect the Windows SDK header prototype and locate the exact parameter annotation.
2. If the parameter SAL annotation contains `_opt_`, `OPTIONAL`, or `_Reserved_`, mark pointer and handle parameters nullable.
3. Map pointer-like parameters to `| NULL` and handle-like parameters to `| 0n`.
4. Open the Microsoft Learn page and verify the docs do not contradict the header.
5. Add missing `| NULL` or `| 0n`.
6. Remove incorrect unions where neither the header nor docs confirm nullability.

If you are auditing a large package, script this pass:
- Parse each generated method signature in `structs/{Class}.ts`
- Resolve the corresponding SDK prototype
- Match parameters by exact Win32 name
- Compare the existing TS type to the SAL-derived expectation
- Patch only the method signature unions

This audit should catch cases like:
- `GetModuleHandleW(lpModuleName)` → `lpModuleName: LPCWSTR | NULL`
- `GetModuleFileNameW(hModule)` → `hModule: HMODULE | 0n`
- `CreateFileW(lpSecurityAttributes, hTemplateFile)` → `lpSecurityAttributes: LPSECURITY_ATTRIBUTES | NULL`, `hTemplateFile: HANDLE | 0n`

This step exists because bulk-writing 100+ methods inevitably misses annotations. It is not optional.

---

## 7. Symbol Declarations

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

## 8. Public Method Signatures

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
4. **Add `| NULL` / `| 0n`** per Section 6.
5. **Alphabetize** all methods.
6. **Body is always one line**: `return {Class}.Load('MethodName')(args);`

---

## 9. Type Aliases and Enums

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

## 10. Examples

Each package must have **at least two example scripts** in `example/`.

### Creative example (WOW factor)

One example should be creative, visually impressive, or surprising — the kind of demo that makes someone say *"you can do that with just FFI?"*

Good creative examples:
- Animated console effects (Matrix rain, colored heatmaps)
- Real-time dashboards with live-updating bars
- Audio synthesis or playback
- Visual rendering (spirograph, pendulum chaos)
- Cross-package demos that combine multiple DLLs naturally

### Professional example (thorough diagnostic)

One example should be professional, showing exhaustive, richly-formatted output. Not just counts or booleans — show formatted tables, aligned labels, human-readable sizes, progress bars, and structured data.

Good professional examples:
- Full system diagnostic with every field labeled and formatted
- Complete device/adapter/interface enumeration
- Registry, certificate store, or security deep-dive
- Network topology, process forensics, or power audit report

### JSDoc header (mandatory)

Every example file must begin with a JSDoc block:

```typescript
/**
 * System Diagnostic
 *
 * A comprehensive system information dashboard that queries hardware, memory,
 * storage, and timing details through Kernel32 APIs. Every value is formatted
 * with aligned labels, human-readable sizes, and progress bars.
 *
 * APIs demonstrated:
 *   - GetNativeSystemInfo          (CPU architecture, core count, page size)
 *   - GlobalMemoryStatusEx         (physical/virtual memory, page file stats)
 *   - GetLogicalDrives             (bitmask of mounted drive letters)
 *   - GetDiskFreeSpaceExW          (per-drive capacity and free space)
 *
 * APIs demonstrated (Kernel32, cross-package):
 *   - OpenProcess                  (obtain process handle)
 *   - CloseHandle                  (release handle)
 *
 * Run: bun run example/system-diagnostic.ts
 */
```

Required sections in the JSDoc:
1. **Title** — short name of what it does
2. **Description** — how it works, what to expect when running
3. **APIs demonstrated** — bulleted list of every Win32 function used, with a short parenthetical. Group by package when cross-package.
4. **Run command** — `Run: bun run example/{filename}.ts`

### Code style

- **Clear variable names** — `processorArchitecture`, not `arch`. `consoleWidth`, not `w`.
- **Inline comments** on non-obvious Win32 struct layouts, buffer offsets, and bit manipulation.
- **No section comment blocks** — no `// ========`, `// --------`, or decorative headers.
- **Cross-package usage encouraged** where natural (e.g., a Psapi memory heatmap importing Kernel32 for `OpenProcess`/`CloseHandle`).
- **`Preload`** all APIs at the top of the file.
- **Check return values** where failure would produce confusing or empty output.

### Console output: use ANSI, not WriteConsoleW

For colored or cursor-controlled console output, use **ANSI escape codes** via `console.log` or `process.stdout.write`. Do **not** use `WriteConsoleW` for rendering — it fails silently in ConPTY-based terminals (Windows Terminal, VS Code) and piped environments.

Kernel32 console setup APIs are fine and encouraged:
- `GetStdHandle` + `GetConsoleMode` + `SetConsoleMode` — enable VT processing
- `GetConsoleScreenBufferInfo` — query dimensions (with fallback to `process.stdout.columns/rows`)
- `SetConsoleCursorInfo` — hide/show cursor
- `SetConsoleTitleW` — set window title

```typescript
// Enable ANSI escape processing
const hStdout = Kernel32.GetStdHandle(STD_HANDLE.OUTPUT);
const modeBuf = Buffer.alloc(4);
if (Kernel32.GetConsoleMode(hStdout, modeBuf.ptr)) {
  Kernel32.SetConsoleMode(hStdout, modeBuf.readUInt32LE(0) | 0x0004);
}

// Then use ANSI for all rendering
const RED = '\x1b[91m';
const RESET = '\x1b[0m';
console.log(`${RED}Error count: 5${RESET}`);
```

### package.json scripts

Add a named script for each example:

```json
{
  "scripts": {
    "example:matrix-rain": "bun ./example/matrix-rain.ts",
    "example:system-diagnostic": "bun ./example/system-diagnostic.ts"
  }
}
```

### Type checking

All examples must pass `tsc` with no errors. **No `as unknown as T`, `as any`, or forced casts** — if types don't align, the binding or the type alias is wrong. Fix it at the source.

Allowed narrowing patterns:
- `!` non-null assertion — `Buffer.ptr!`, `JSCallback.ptr!`, `null!` for nullable params
- `BigInt()` — converting pointer numbers to handle (`bigint`) parameters
- Explicit type annotations — breaking circular inference in loops (`const x: Buffer = ...`)

These are **not** casts — they are legitimate narrowing that preserves type safety.

---

## 11. Process

Follow this order. **Test at every step.**

1. **Scaffold.** Copy `packages/template/` to `packages/{name}/`. Rename `WIN32_CLASS` files and identifiers. Replace all placeholders. Run `bun install` and `bun run index.ts`.

2. **Catalog exports.** Run dumpbin. For each function, find the MS docs page. Note every parameter name, type, nullability, and the return type.

3. **Define types** (`types/{Class}.ts`). Add every alias, enum, and constant. Alphabetize. Test: `bun run index.ts`.

4. **Build symbols** (`structs/{Class}.ts`). Add FFI declarations in batches of 10-20. Test after each batch.

5. **Build methods** (`structs/{Class}.ts`). Add public static methods in batches. Each has a MS docs URL, exact parameter names, type aliases, `| NULL` / `| 0n`. Test after each batch.

6. **Nullable audit.** Dedicated pass over every method — see Section 6.

7. **Type consistency audit.** Run the automated audit and fix every issue before proceeding:

   ```bash
   bun run scripts/audit.ts {name}
   ```

   The script cross-references three sources for every bound function:
   - The **FFI symbol type** (`FFIType.u64`, `FFIType.ptr`, etc.) — determines runtime behavior.
   - The **TypeScript method type** (`HANDLE`, `DWORD`, `LPVOID`, etc.) — what the caller sees.
   - The **Windows SDK header** (when available) — the authoritative C prototype.

   It flags any mismatch. Common mistakes it catches:
   - `DWORD` (number) used where the FFI symbol is `u64` (bigint) — should be a HANDLE type.
   - `LPVOID` (Pointer) used where the FFI symbol is `u64` (bigint) — should be `SIZE_T` or a HANDLE.
   - `HANDLE` (bigint) used where the FFI symbol is `ptr` (Pointer) — the FFI symbol or the type is wrong.
   - `DWORD` (number) used where the FFI symbol is `ptr` (Pointer) — should be a pointer/callback type.

   **The audit must report zero mismatches.** If both the FFI symbol and TS type are wrong in the same direction (both say `number` when the SDK says `bigint`), the script won't catch it — you must still verify against the C prototype during step 5.

   Use `--fix` for automatic method-signature repair, then manually review changes:
   ```bash
   bun run scripts/audit.ts {name} --fix
   ```

8. **README, AI.md, examples.** Fill in the README template. Fill in AI.md (change only class/DLL/package names). Write examples per Section 10 (minimum 2: one creative, one professional, each with JSDoc header and ANSI output). Add `example:*` scripts to `package.json`. Update the **root README.md** (Packages table and Project Structure tree).

9. **Final verification.** Run `bun run index.ts`. Run `bunx prettier --write "packages/{name}/**/*.ts"`. Run `bunx tsc --noEmit`. Run a real integration test.

---

## 12. Completeness Checklist

- [ ] Every template file exists with placeholders replaced
- [ ] `bun install` and `bun run index.ts` succeed
- [ ] All documented dumpbin exports are bound (both A and W variants)
- [ ] All type aliases, enums, and constants are defined and exported
- [ ] Everything alphabetized (symbols, methods, types, enum members)
- [ ] Every method has a MS Docs URL comment
- [ ] Every method uses exact Win32 parameter names
- [ ] `| NULL` on every nullable pointer; `| 0n` on every nullable handle
- [ ] `bun run scripts/audit.ts {name}` reports zero mismatches
- [ ] No `as unknown as T` or `as any` casts
- [ ] Hex literals use numeric separators (`0x0000_0001`)
- [ ] Prettier formatted, tsc passes with no errors
- [ ] At least two examples: one creative (WOW), one professional (thorough diagnostic)
- [ ] Every example has JSDoc header (title, description, APIs, run command)
- [ ] Examples use ANSI escape codes for color, not `WriteConsoleW`
- [ ] `example:*` scripts in `package.json` for each example
- [ ] All examples pass `tsc` with no errors
- [ ] At least one real FFI integration test passes
- [ ] README points agents to AI.md
- [ ] AI.md exists
- [ ] Root README updated
- [ ] `package.json` has correct metadata, keywords, files, scripts

---

## 13. Reference Commands

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

# Type consistency audit (must report 0 mismatches)
bun run scripts/audit.ts {name}

# Auto-fix method signatures (review changes after)
bun run scripts/audit.ts {name} --fix

# Audit all packages at once
bun run scripts/audit.ts --all

# Run example
cd packages/{name} && bun run example/{name}.ts
```

---

## 14. Reference Packages

- **Small DLL example:** `packages/psapi` — ~28 functions, demonstrates every pattern concisely.
- **Large DLL example:** `packages/kernel32` — 1,000+ functions, massive Symbols table, 26+ enums, exported constants.
- **Nullable handles example:** `packages/user32` — extensive `| 0n` and `| NULL` usage, `PACKED_POINT` pattern.
- **Non-Win32 naming:** `packages/opengl32` — preserves `glBegin`, `gluSphere` naming (not PascalCased).

All packages in `packages/` (excluding `core`) follow identical conventions.
