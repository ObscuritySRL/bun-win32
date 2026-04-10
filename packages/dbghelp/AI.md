# AI Guide for @bun-win32/dbghelp

How to use this package, not what the Win32 API does.

## Usage

```ts
import Dbghelp, { SYMOPT_UNDNAME, SYMOPT_DEFERRED_LOADS } from '@bun-win32/dbghelp';

// Methods bind lazily on first call
Dbghelp.SymSetOptions(SYMOPT_UNDNAME | SYMOPT_DEFERRED_LOADS);
const ok = Dbghelp.SymInitialize(hProcess, null, 1);

// Preload: array, single string, or no args (all symbols)
Dbghelp.Preload(['SymInitializeW', 'SymCleanup', 'SymFromAddrW']);
Dbghelp.Preload('StackWalk64');
Dbghelp.Preload();
```

## Where To Look

| Need                              | Read                 |
| --------------------------------- | -------------------- |
| Find a method or its MS Docs link | `structs/Dbghelp.ts` |
| Find types, enums, constants      | `types/Dbghelp.ts`   |
| Quick examples                    | `README.md`          |

`index.ts` re-exports the class and all types - import from `@bun-win32/dbghelp` directly.

## Calling Convention

All documented `dbghelp.dll` exports are bound. Each method maps 1:1 to its DLL export. Names, parameter names, and order match Microsoft Docs.

### Strings

`W` methods take UTF-16LE NUL-terminated buffers. Non-`W` methods take ANSI strings.

```ts
const wide = Buffer.from('ntdll.dll\0', 'utf16le');  // LPCWSTR
Dbghelp.SymLoadModuleExW(hProcess, 0n, wide.ptr, null, 0n, 0, null, 0);

// Reading a wide string back from a buffer:
const text = new TextDecoder('utf-16').decode(buf).replace(/\0.*$/, '');
```

### Return types

- `HANDLE`, `DWORD64`, `ULONG64` -> `bigint`
- `DWORD`, `UINT`, `BOOL`, `ULONG`, `USHORT` -> `number`
- `LPVOID`, `LPWSTR`, `LPSTR`, `PVOID` -> `Pointer`
- Win32 `BOOL` is `number` (0 or non-zero), **not** JS `boolean`. Do not compare with `=== true`.

### Pointers, handles, out-parameters

- **Pointer** params (`LP*`, `P*`, `Pointer`): pass `buffer.ptr` from a caller-allocated `Buffer`.
- **Handle** params (`HANDLE`, `HMODULE`): pass a `bigint` value.
- **Out-parameters**: allocate a `Buffer`, pass `.ptr`, read the result after the call.

```ts
const displacement = Buffer.alloc(8);
Dbghelp.SymFromAddr(hProcess, address, displacement.ptr, symbolInfo.ptr);
const disp = displacement.readBigUInt64LE(0);
```

### Nullability

- `| NULL` in a signature -> pass `null` (optional pointer).
- `| 0n` in a signature -> pass `0n` (optional handle).

## Errors and Cleanup

Return values are raw. If the Win32 function uses last-error semantics, read via `GetLastError()`. Always call `SymCleanup(hProcess)` to release resources - use a `finally` block.
