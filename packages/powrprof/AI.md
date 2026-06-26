# AI Guide for @bun-win32/powrprof

How to use this package, not what the Win32 API does.

## Usage

```ts
import PowrProf, { POWER_INFORMATION_LEVEL } from '@bun-win32/powrprof';

// Methods bind lazily on first call
const result = PowrProf.CallNtPowerInformation(level, null, 0, buf.ptr, buf.byteLength);

// Preload: array, single string, or no args (all symbols)
PowrProf.Preload(['CallNtPowerInformation', 'PowerGetActiveScheme']);
PowrProf.Preload('SetSuspendState');
PowrProf.Preload();
```

## Where To Look

| Need                              | Read                  |
| --------------------------------- | --------------------- |
| Find a method or its MS Docs link | `structs/PowrProf.ts` |
| Find types, enums, constants      | `types/PowrProf.ts`   |
| Quick examples                    | `README.md`           |

`index.ts` re-exports the class and all types — import from `@bun-win32/powrprof` directly.

## Calling Convention

All documented `powrprof.dll` exports are bound. Each method maps 1:1 to its DLL export. Names, parameter names, and order match Microsoft Docs.

### Strings

Most powrprof functions work with GUIDs and binary data rather than strings. Where strings are used (e.g. `WritePwrScheme`), they take UTF-16LE NUL-terminated buffers.

```ts
const wide = Buffer.from('My Scheme\0', 'utf16le');  // LPCWSTR
PowrProf.WritePwrScheme(idBuf.ptr, wide.ptr, null, policyBuf.ptr);

// Reading a wide string back from a buffer:
const text = new TextDecoder('utf-16').decode(buf).replace(/\0.*$/, '');
```

### Return types

- `HANDLE`, `HKEY`, `HPOWERNOTIFY` → `bigint`
- `DWORD`, `UINT`, `BOOL`, `ULONG`, `REGSAM`, `NTSTATUS` → `number`
- `BOOLEAN` → `number` (0 or 1, unsigned byte)
- `HRESULT` → `number` (signed 32-bit)
- `LPVOID`, `LPWSTR`, `LPCGUID`, `PUCHAR`, etc. → `Pointer`
- Win32 `BOOL` is `number` (0 or non-zero), **not** JS `boolean`. Do not compare with `=== true`.

### Pointers, handles, out-parameters

- **Pointer** params (`LPCGUID`, `PUCHAR`, `Pointer`): pass `buffer.ptr` from a caller-allocated `Buffer`.
- **Handle** params (`HKEY`, `HANDLE`, `HPOWERNOTIFY`): pass a `bigint` value.
- **Out-parameters** carry a direction suffix on the parameter **name** — `_out` for an `_Out_` param (the function writes through it), `_in_out` for `_Inout_` (you seed it, the function updates it); an `_In_` param is bare. Allocate a `Buffer`, pass `.ptr`, read the result after the call.

```ts
const out = Buffer.alloc(4);
PowrProf.PowerReadACValueIndex(0n, schemeGuid.ptr, null, settingGuid.ptr, out.ptr);
const value = new DataView(out.buffer).getUint32(0, true);
```

### Nullability

Nullability is encoded in the **type** via two representation-aware markers — the null sentinel is derived from `T` (`null` for pointer types `LP*`/`P*`, `0n` for handles and by-value addresses):

- `OPTIONAL<T>` — the parameter is formally optional (SAL `_*opt_` / `[*, optional]` / `_Reserved_` that still takes a value). Pass a value, or the null sentinel to omit.
- `NULLABLE<T>` — a plain `[in]`/`[out]` param whose docs say it can be NULL ("This parameter can be NULL" / "Specify NULL to …", including sizing-call buffers).
- A **required** param is bare; a **must-be-null reserved** param is typed `NULL`. A by-value **scalar** (`DWORD`/`ULONG`/`UINT`/`BOOL`) is never wrapped — its "optional" means pass `0`/a default.

## Errors and Cleanup

Return values are raw. Most modern Power* functions return `DWORD` error codes (`0` = `ERROR_SUCCESS`). Legacy functions return `BOOLEAN` (`1` = success, `0` = failure). `CallNtPowerInformation` returns `NTSTATUS` (`0` = `STATUS_SUCCESS`). Resource cleanup is your responsibility — same as raw Win32.
