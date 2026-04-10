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
- **Out-parameters**: allocate a `Buffer`, pass `.ptr`, read the result after the call.

```ts
const out = Buffer.alloc(8);
Virtdisk.OpenVirtualDisk(storageType.ptr!, path.ptr!, 0, 0, null, out.ptr!);
const handle = out.readBigUInt64LE(0);
```

### Nullability

- `| NULL` in a signature → pass `null` (optional pointer).
- `| 0n` in a signature → pass `0n` (optional handle).

## Errors and Cleanup

All functions return a `DWORD` Win32 error code. `0` (`ERROR_SUCCESS`) means success. Close virtual disk handles with `CloseHandle` from `@bun-win32/kernel32`.
