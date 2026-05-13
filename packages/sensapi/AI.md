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
- **Out-parameters**: allocate a `Buffer`, pass `.ptr`, read the result after the call.

```ts
const flags = Buffer.alloc(4);
Sensapi.IsNetworkAlive(flags.ptr);
const value = flags.readUInt32LE(0);
```

### Nullability

- `| NULL` in a signature → pass `null` (optional pointer).

`IsDestinationReachable[AW]`'s `lpQOCInfo` is optional — pass `null` to skip QoC collection.

## Errors and Cleanup

Return values are raw. Read `GetLastError()` from `@bun-win32/kernel32` for extended error info. The caller owns `QOCINFO` buffer memory; free it when done.

### Platform caveat

`IsDestinationReachableA/W` is documented as unsupported on Windows Vista and later — it always returns `ERROR_CALL_NOT_IMPLEMENTED`. The binding is still exposed because `sensapi.dll` still exports it. Use `IsNetworkAlive` (or the newer Network List Manager) for modern code.
