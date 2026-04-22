# AI Guide for @bun-win32/bcrypt

How to use this package, not what the Win32 API does.

## Usage

```ts
import Bcrypt, { SomeFlag } from '@bun-win32/bcrypt';

// Methods bind lazily on first call
const result = Bcrypt.SomeFunctionW(arg1, arg2);

// Preload: array, single string, or no args (all symbols)
Bcrypt.Preload(['SomeFunctionW', 'AnotherFunction']);
Bcrypt.Preload('SomeFunctionW');
Bcrypt.Preload();
```

## Where To Look

| Need                              | Read                 |
| --------------------------------- | -------------------- |
| Find a method or its MS Docs link | `structs/Bcrypt.ts` |
| Find types, enums, constants      | `types/Bcrypt.ts`   |
| Quick examples                    | `README.md`          |

`index.ts` re-exports the class and all types — import from `@bun-win32/bcrypt` directly.

## Calling Convention

All documented `bcrypt.dll` exports are bound. Each method maps 1:1 to its DLL export. Names, parameter names, and order match Microsoft Docs.

### Strings

`W` methods take UTF-16LE NUL-terminated buffers. `A` methods take ANSI strings.

```ts
const wide = Buffer.from('Hello\0', 'utf16le');  // LPCWSTR
Bcrypt.SomeFunctionW(wide.ptr);

// Reading a wide string back from a buffer:
const text = new TextDecoder('utf-16').decode(buf).replace(/\0.*$/, '');
```

### Return types

- `HANDLE`, `HWND`, etc. → `bigint`
- `DWORD`, `UINT`, `BOOL`, `INT`, `LONG` → `number`
- `LPVOID`, `LPWSTR`, etc. → `Pointer`
- Win32 `BOOL` is `number` (0 or non-zero), **not** JS `boolean`. Do not compare with `=== true`.

### Pointers, handles, out-parameters

- **Pointer** params (`LP*`, `P*`, `Pointer`): pass `buffer.ptr` from a caller-allocated `Buffer`.
- **Handle** params (`HANDLE`, `HWND`, etc.): pass a `bigint` value.
- **Out-parameters**: allocate a `Buffer`, pass `.ptr`, read the result after the call.

```ts
const out = Buffer.alloc(4);
Bcrypt.SomeFunction(out.ptr);
const value = out.readUInt32LE(0);
```

### Nullability

- `| NULL` in a signature → pass `null` (optional pointer).
- `| 0n` in a signature → pass `0n` (optional handle).

## Errors and Cleanup

Return values are raw. If the Win32 function uses last-error semantics, read via `GetLastError()`. Resource cleanup is your responsibility — same as raw Win32.
