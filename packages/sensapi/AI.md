# AI Guide for @bun-win32/sensapi

How to use this package, not what the Win32 API does.

## Usage

```ts
import Sensapi, { NetworkAliveFlags } from '@bun-win32/sensapi';

// Methods bind lazily on first call
const flagsBuffer = Buffer.alloc(4);
const alive = Sensapi.IsNetworkAlive(flagsBuffer.ptr);

// Preload: array, single string, or no args (all symbols)
Sensapi.Preload(['IsDestinationReachableW', 'IsNetworkAlive']);
Sensapi.Preload('IsNetworkAlive');
Sensapi.Preload();
```

## Where To Look

| Need                              | Read                 |
| --------------------------------- | -------------------- |
| Find a method or its MS Docs link | `structs/Sensapi.ts` |
| Find types, enums, constants      | `types/Sensapi.ts`   |
| Quick examples                    | `README.md`          |

`index.ts` re-exports the class and all types — import from `@bun-win32/sensapi` directly.

## Calling Convention

All documented `sensapi.dll` exports are bound. Each method maps 1:1 to its DLL export. Names, parameter names, and order match Microsoft Docs.

### Strings

`W` methods take UTF-16LE NUL-terminated buffers. `A` methods take ANSI strings.

```ts
const wide = Buffer.from('www.example.com\0', 'utf16le'); // LPCWSTR
Sensapi.IsDestinationReachableW(wide.ptr, null);
```

### Return types

- `BOOL` → `number` (0 or non-zero). Do not compare with `=== true`.

### Pointers, handles, out-parameters

- **Pointer** params (`LP*`): pass `buffer.ptr` from a caller-allocated `Buffer`.
- **Out-parameters** carry a direction suffix on the parameter **name** — `_out` for an `_Out_` param (the function writes through it), `_in_out` for `_Inout_` (you seed it, the function updates it); an `_In_` param is bare. Allocate a `Buffer`, pass `.ptr`, read the result after the call.

```ts
const flags = Buffer.alloc(4);
Sensapi.IsNetworkAlive(flags.ptr);
const value = flags.readUInt32LE(0);
```

### Nullability

Nullability is encoded in the **type** via two representation-aware markers — the null sentinel is derived from `T` (`null` for pointer types `LP*`/`P*`, `0n` for handles and by-value addresses):

- `OPTIONAL<T>` — the parameter is formally optional (SAL `_*opt_` / `[*, optional]` / `_Reserved_` that still takes a value). Pass a value, or the null sentinel to omit.
- `NULLABLE<T>` — a plain `[in]`/`[out]` param whose docs say it can be NULL ("This parameter can be NULL" / "Specify NULL to …", including sizing-call buffers).
- A **required** param is bare; a **must-be-null reserved** param is typed `NULL`. A by-value **scalar** (`DWORD`/`ULONG`/`UINT`/`BOOL`) is never wrapped — its "optional" means pass `0`/a default.
## Errors and Cleanup

Return values are raw. Read `GetLastError()` from `@bun-win32/kernel32` for extended error info. The caller owns `QOCINFO` buffer memory; free it when done.

### Platform caveat

`IsDestinationReachableA/W` is documented as unsupported on Windows Vista and later — it always returns `ERROR_CALL_NOT_IMPLEMENTED`. The binding is still exposed because `sensapi.dll` still exports it. Use `IsNetworkAlive` (or the newer Network List Manager) for modern code.
