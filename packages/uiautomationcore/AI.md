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
- Out-parameters: allocate a `Buffer`, pass `.ptr`, read the result after the call.

```ts
const out = Buffer.alloc(8);
UIAutomationCore.SomeFunction(out.ptr);
const handle = out.readBigUInt64LE(0);
```

### By-value aggregates

`VARIANT` and `UiaPoint` parameters are modeled as pointer-shaped aliases because Windows x64 passes these aggregates indirectly at the ABI boundary. Pack the native layout into a caller-owned buffer and pass `.ptr`.

### Nullability

- `| NULL` in a signature -> pass `null` (optional pointer).
- `| 0n` in a signature -> pass `0n` (optional handle).

## Errors and Cleanup

Return values are raw. If a function returns a node or pattern handle, release it with `UiaNodeRelease`, `UiaPatternRelease`, or `UiaTextRangeRelease` as appropriate.
