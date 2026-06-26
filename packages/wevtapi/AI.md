# AI Guide for @bun-win32/wevtapi

How to use this package, not what the Win32 API does.

## Usage

```ts
import Wevtapi, { SomeFlag } from '@bun-win32/wevtapi';

// Methods bind lazily on first call
const result = Wevtapi.SomeFunctionW(arg1, arg2);

// Preload: array, single string, or no args (all symbols)
Wevtapi.Preload(['SomeFunctionW', 'AnotherFunction']);
Wevtapi.Preload('SomeFunctionW');
Wevtapi.Preload();
```

## Where To Look

| Need                              | Read                 |
| --------------------------------- | -------------------- |
| Find a method or its MS Docs link | `structs/Wevtapi.ts` |
| Find types, enums, constants      | `types/Wevtapi.ts`   |
| Quick examples                    | `README.md`          |

`index.ts` re-exports the class and all types - import from `@bun-win32/wevtapi` directly.

## Calling Convention

All documented `wevtapi.dll` exports are bound. Each method maps 1:1 to its DLL export. Names, parameter names, and order match Microsoft Docs.

### Strings

`W` methods take UTF-16LE NUL-terminated buffers. `A` methods take ANSI strings.

```ts
const wide = Buffer.from('Hello\0', 'utf16le'); // LPCWSTR
Wevtapi.SomeFunctionW(wide.ptr);

// Reading a wide string back from a buffer:
const text = new TextDecoder('utf-16').decode(buf).replace(/\0.*$/, '');
```

### Return types

- `HANDLE`, `HWND`, etc. -> `bigint`
- `DWORD`, `UINT`, `BOOL`, `INT`, `LONG` -> `number`
- `LPVOID`, `LPWSTR`, etc. -> `Pointer`
- Win32 `BOOL` is `number` (0 or non-zero), **not** JS `boolean`. Do not compare with `=== true`.

### Pointers, handles, out-parameters

- **Pointer** params (`LP*`, `P*`, `Pointer`): pass `buffer.ptr` from a caller-allocated `Buffer`.
- **Handle** params (`HANDLE`, `HWND`, etc.): pass a `bigint` value.
- **Out-parameters** carry a direction suffix on the parameter **name** — `_out` for an `_Out_` param (the function writes through it), `_in_out` for `_Inout_` (you seed it, the function updates it); an `_In_` param is bare. Allocate a `Buffer`, pass `.ptr`, read the result after the call.

```ts
const out = Buffer.alloc(4);
Wevtapi.SomeFunction(out.ptr);
const value = out.readUInt32LE(0);
```

### Nullability

Nullability is encoded in the **type** via two representation-aware markers — the null sentinel is derived from `T` (`null` for pointer types `LP*`/`P*`, `0n` for handles and by-value addresses):

- `Optional<T>` — the parameter is formally optional (SAL `_*opt_` / `[*, optional]` / `_Reserved_` that still takes a value). Pass a value, or the null sentinel to omit.
- `Nullable<T>` — a plain `[in]`/`[out]` param whose docs say it can be NULL ("This parameter can be NULL" / "Specify NULL to …", including sizing-call buffers).
- A **required** param is bare; a **must-be-null reserved** param is typed `NULL`. A by-value **scalar** (`DWORD`/`ULONG`/`UINT`/`BOOL`) is never wrapped — its "optional" means pass `0`/a default.
## Errors and Cleanup

Return values are raw. If the Win32 function uses last-error semantics, read via `GetLastError()`. Resource cleanup is your responsibility - same as raw Win32.
