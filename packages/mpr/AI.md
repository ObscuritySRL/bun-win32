# AI Guide for @bun-win32/mpr

How to use this package, not what the Win32 API does.

## Usage

```ts
import Mpr, { ResourceScope, ResourceType, ConnectFlags, WN_NO_ERROR } from '@bun-win32/mpr';

// Methods bind lazily on first call
const result = Mpr.WNetGetUserW(null, userBuf.ptr, sizeBuf.ptr);

// Preload: array, single string, or no args (all symbols)
Mpr.Preload(['WNetOpenEnumW', 'WNetEnumResourceW', 'WNetCloseEnum']);
Mpr.Preload('WNetGetConnectionW');
Mpr.Preload();
```

## Where To Look

| Need                              | Read             |
| --------------------------------- | ---------------- |
| Find a method or its MS Docs link | `structs/Mpr.ts` |
| Find types, enums, constants      | `types/Mpr.ts`   |
| Quick examples                    | `README.md`      |

`index.ts` re-exports the class and all types — import from `@bun-win32/mpr` directly.

## Calling Convention

All documented `mpr.dll` exports are bound. Each method maps 1:1 to its DLL export. Names, parameter names, and order match Microsoft Docs.

### Strings

`W` methods take UTF-16LE NUL-terminated buffers. Buffer size parameters are in **characters**, not bytes.

```ts
const wide = Buffer.from('Z:\0', 'utf16le');  // LPCWSTR
Mpr.WNetGetConnectionW(wide.ptr, remoteBuf.ptr, sizeBuf.ptr);

// Reading a wide string back from a buffer:
const text = buf.toString('utf16le').replace(/\0.*$/, '');
```

### Return types

- `HANDLE`, `HWND`, etc. → `bigint`
- `DWORD`, `UINT`, `BOOL`, `INT`, `LONG` → `number`
- `LPVOID`, `LPWSTR`, etc. → `Pointer`
- All WNet functions return `DWORD` (error code). Check against `WN_NO_ERROR` (0).

### Pointers, handles, out-parameters

- **Pointer** params (`LP*`, `P*`, `Pointer`): pass `buffer.ptr` from a caller-allocated `Buffer`.
- **Handle** params (`HANDLE`, `HWND`, etc.): pass a `bigint` value.
- **Out-parameters** carry a direction suffix on the parameter **name** — `_out` for an `_Out_` param (the function writes through it), `_in_out` for `_Inout_` (you seed it, the function updates it); an `_In_` param is bare. Allocate a `Buffer`, pass `.ptr`, read the result after the call.

```ts
const remoteBuf = Buffer.alloc(520);
const sizeBuf = Buffer.alloc(4);
sizeBuf.writeUInt32LE(260, 0);
Mpr.WNetGetConnectionW(driveBuf.ptr, remoteBuf.ptr, sizeBuf.ptr);
const remote = remoteBuf.toString('utf16le').replace(/\0.*$/, '');
```

### Nullability

Nullability is encoded in the **type** via two representation-aware markers — the null sentinel is derived from `T` (`null` for pointer types `LP*`/`P*`, `0n` for handles and by-value addresses):

- `OPTIONAL<T>` — the parameter is formally optional (SAL `_*opt_` / `[*, optional]` / `_Reserved_` that still takes a value). Pass a value, or the null sentinel to omit.
- `NULLABLE<T>` — a plain `[in]`/`[out]` param whose docs say it can be NULL ("This parameter can be NULL" / "Specify NULL to …", including sizing-call buffers).
- A **required** param is bare; a **must-be-null reserved** param is typed `NULL`. A by-value **scalar** (`DWORD`/`ULONG`/`UINT`/`BOOL`) is never wrapped — its "optional" means pass `0`/a default.

## Errors and Cleanup

All WNet functions return a `DWORD` error code. Compare against `WN_NO_ERROR`, `WN_MORE_DATA`, `WN_NO_MORE_ENTRIES`, etc. from `types/Mpr.ts`. For extended error details after `WN_EXTENDED_ERROR`, call `Mpr.WNetGetLastErrorW`. Enumeration handles from `WNetOpenEnumW` must be closed with `WNetCloseEnum`.
