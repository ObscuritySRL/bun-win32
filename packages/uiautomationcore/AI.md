# AI Guide for @bun-win32/uiautomationcore

How to use this package, not what the Win32 API does.

## Usage

```ts
import UIAutomationCore, { SomeFlag } from '@bun-win32/uiautomationcore';

// Methods bind lazily on first call
const result = UIAutomationCore.SomeFunction(arg1, arg2);

// Preload: array, single string, or no args (all symbols)
UIAutomationCore.Preload(['SomeFunction', 'AnotherFunction']);
UIAutomationCore.Preload('SomeFunction');
UIAutomationCore.Preload();
```

## Where To Look

| Need                              | Read                         |
| --------------------------------- | ---------------------------- |
| Find a method or its MS Docs link | `structs/UIAutomationCore.ts` |
| Find types, enums, constants      | `types/UIAutomationCore.ts`   |
| Quick examples                    | `README.md`                  |

`index.ts` re-exports the class and all types - import from `@bun-win32/uiautomationcore` directly.

## Calling Convention

All documented `uiautomationcore.dll` exports that resolved to reliable header-plus-doc pairs are bound. Each method maps 1:1 to its DLL export. Names, parameter names, and order match Microsoft Learn.

### Strings

`LPCWSTR` parameters take UTF-16LE NUL-terminated buffers.

```ts
const wide = Buffer.from('Hello\0', 'utf16le');
UIAutomationCore.SomeFunction(wide.ptr);

const text = new TextDecoder('utf-16').decode(buffer).replace(/\0.*$/, '');
```

### Return types

- `HANDLE`, `HWND`, and other handle-like values -> `bigint`
- `DWORD`, `UINT`, `BOOL`, `INT`, `LONG` -> `number`
- `LPVOID`, `LPWSTR`, and other pointer-like values -> `Pointer`
- Win32 `BOOL` is `number` (0 or non-zero), not JS `boolean`. Do not compare with `=== true`.

### Pointers, handles, out-parameters

- Pointer params (`LP*`, `P*`, `Pointer`): pass `buffer.ptr` from a caller-allocated `Buffer`.
- Handle params (`HANDLE`, `HWND`, and similar): pass a `bigint` value.
- **Out-parameters** carry a direction suffix on the parameter **name** — `_out` for an `_Out_` param (the function writes through it), `_in_out` for `_Inout_` (you seed it, the function updates it); an `_In_` param is bare. Allocate a `Buffer`, pass `.ptr`, read the result after the call.

```ts
const out = Buffer.alloc(8);
UIAutomationCore.SomeFunction(out.ptr);
const handle = out.readBigUInt64LE(0);
```

### By-value aggregates

`VARIANT` and `UiaPoint` parameters are modeled as pointer-shaped aliases because Windows x64 passes these aggregates indirectly at the ABI boundary. Pack the native layout into a caller-owned buffer and pass `.ptr`.

### Nullability

Nullability is encoded in the **type** via two representation-aware markers — the null sentinel is derived from `T` (`null` for pointer types `LP*`/`P*`, `0n` for handles and by-value addresses):

- `Optional<T>` — the parameter is formally optional (SAL `_*opt_` / `[*, optional]` / `_Reserved_` that still takes a value). Pass a value, or the null sentinel to omit.
- `Nullable<T>` — a plain `[in]`/`[out]` param whose docs say it can be NULL ("This parameter can be NULL" / "Specify NULL to …", including sizing-call buffers).
- A **required** param is bare; a **must-be-null reserved** param is typed `NULL`. A by-value **scalar** (`DWORD`/`ULONG`/`UINT`/`BOOL`) is never wrapped — its "optional" means pass `0`/a default.
## Errors and Cleanup

Return values are raw. If a function returns a node or pattern handle, release it with `UiaNodeRelease`, `UiaPatternRelease`, or `UiaTextRangeRelease` as appropriate.
