# AI Guide for @bun-win32/virtdisk

How to use this package, not what the Win32 API does.

## Usage

```ts
import Virtdisk, { VIRTUAL_DISK_ACCESS_MASK, OPEN_VIRTUAL_DISK_FLAG } from '@bun-win32/virtdisk';

// Methods bind lazily on first call
const result = Virtdisk.OpenVirtualDisk(storageType.ptr!, path.ptr!, 0, 0, null, handle.ptr!);

// Preload: array, single string, or no args (all symbols)
Virtdisk.Preload(['OpenVirtualDisk', 'AttachVirtualDisk']);
Virtdisk.Preload('CreateVirtualDisk');
Virtdisk.Preload();
```

## Where To Look

| Need                              | Read                 |
| --------------------------------- | -------------------- |
| Find a method or its MS Docs link | `structs/Virtdisk.ts` |
| Find types, enums, constants      | `types/Virtdisk.ts`   |
| Quick examples                    | `README.md`          |

`index.ts` re-exports the class and all types — import from `@bun-win32/virtdisk` directly.

## Calling Convention

All documented `virtdisk.dll` exports are bound. Each method maps 1:1 to its DLL export. Names, parameter names, and order match Microsoft Docs.

### Strings

Wide-string parameters (`PCWSTR`, `PWSTR`) take UTF-16LE NUL-terminated buffers.

```ts
const wide = Buffer.from('C:\\path\\to\\disk.vhdx\0', 'utf16le');
Virtdisk.OpenVirtualDisk(storageType.ptr!, wide.ptr!, 0, 0, null, handle.ptr!);
```

### Return types

- `HANDLE`, `HWND`, etc. → `bigint`
- `DWORD`, `UINT`, `BOOL`, `INT`, `LONG` → `number`
- `LPVOID`, `LPWSTR`, etc. → `Pointer`
- Win32 `BOOL` is `number` (0 or non-zero), **not** JS `boolean`. Do not compare with `=== true`.

### Pointers, handles, out-parameters

- **Pointer** params (`LP*`, `P*`, `Pointer`): pass `buffer.ptr` from a caller-allocated `Buffer`.
- **Handle** params (`HANDLE`, `HWND`, etc.): pass a `bigint` value.
- **Out-parameters** carry a direction suffix on the parameter **name** — `_out` for an `_Out_` param (the function writes through it), `_in_out` for `_Inout_` (you seed it, the function updates it); an `_In_` param is bare. Allocate a `Buffer`, pass `.ptr`, read the result after the call.

```ts
const out = Buffer.alloc(8);
Virtdisk.OpenVirtualDisk(storageType.ptr!, path.ptr!, 0, 0, null, out.ptr!);
const handle = out.readBigUInt64LE(0);
```

### Nullability

Nullability is encoded in the **type** via two representation-aware markers — the null sentinel is derived from `T` (`null` for pointer types `LP*`/`P*`, `0n` for handles and by-value addresses):

- `OPTIONAL<T>` — the parameter is formally optional (SAL `_*opt_` / `[*, optional]` / `_Reserved_` that still takes a value). Pass a value, or the null sentinel to omit.
- `NULLABLE<T>` — a plain `[in]`/`[out]` param whose docs say it can be NULL ("This parameter can be NULL" / "Specify NULL to …", including sizing-call buffers).
- A **required** param is bare; a **must-be-null reserved** param is typed `NULL`. A by-value **scalar** (`DWORD`/`ULONG`/`UINT`/`BOOL`) is never wrapped — its "optional" means pass `0`/a default.

## Errors and Cleanup

All functions return a `DWORD` Win32 error code. `0` (`ERROR_SUCCESS`) means success. Close virtual disk handles with `CloseHandle` from `@bun-win32/kernel32`.
