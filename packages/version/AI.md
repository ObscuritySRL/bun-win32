# AI Guide for @bun-win32/version

How to use this package, not what the Win32 API does.

## Usage

```ts
import Version, { FileVersionGetFlags } from '@bun-win32/version';

// Methods bind lazily on first call
const size = Version.GetFileVersionInfoSizeExW(FileVersionGetFlags.FILE_VER_GET_NEUTRAL, filePath.ptr, sizeHint.ptr);

// Preload: array, single string, or no args (all symbols)
Version.Preload(['GetFileVersionInfoExW', 'VerQueryValueW']);
Version.Preload('GetFileVersionInfoByHandle');
Version.Preload();
```

## Where To Look

| Need                              | Read                 |
| --------------------------------- | -------------------- |
| Find a method or its MS Docs link | `structs/Version.ts` |
| Find types, enums, constants      | `types/Version.ts`   |
| Quick examples                    | `README.md`          |

`index.ts` re-exports the class and all types — import from `@bun-win32/version` directly.

## Calling Convention

All documented `version.dll` exports are bound except forwarded exports. Each method maps 1:1 to its DLL export. Names, parameter names, and order match Microsoft Docs.

### Strings

`W` methods take UTF-16LE NUL-terminated buffers. `A` methods take ANSI strings.

```ts
const wide = Buffer.from('C:\\Windows\\System32\\kernel32.dll\0', 'utf16le'); // LPCWSTR
Version.GetFileVersionInfoSizeW(wide.ptr, null);

// Reading a wide string back from a buffer:
const text = new TextDecoder('utf-16').decode(buf).replace(/\0.*$/, '');
```

### Return types

- `HANDLE` → `bigint`
- `DWORD`, `UINT`, `BOOL` → `number`
- `LPVOID`, `LPWSTR`, etc. → `Pointer`
- Win32 `BOOL` is `number` (0 or non-zero), **not** JS `boolean`. Do not compare with `=== true`.

### Pointers, handles, out-parameters

- **Pointer** params (`LP*`, `P*`, `Pointer`): pass `buffer.ptr` from a caller-allocated `Buffer`.
- **Handle** params (`HANDLE`): pass a `bigint` value.
- **Out-parameters**: allocate a `Buffer`, pass `.ptr`, read the result after the call.

```ts
const sizePointer = Buffer.alloc(4);
Version.GetFileVersionInfoSizeW(filePath.ptr, sizePointer.ptr);
const size = sizePointer.readUInt32LE(0);
```

### Nullability

- `| NULL` in a signature → pass `null` (optional pointer).
- `| 0n` in a signature → pass `0n` (optional handle).

## Errors and Cleanup

Return values are raw. If the Win32 function uses last-error semantics, read via `GetLastError()`. Buffers returned by `GetFileVersionInfoByHandle` must be released with `LocalFree`.
