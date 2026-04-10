# AI Guide for @bun-win32/normaliz

How to use this package, not what the Win32 API does.

## Usage

```ts
import Normaliz, { NormalizationForm } from '@bun-win32/normaliz';

const source = Buffer.from('e\u0301\0', 'utf16le');
const bufferLengthEstimate = Normaliz.NormalizeString(NormalizationForm.NormalizationC, source.ptr!, -1, null, 0);

Normaliz.Preload(['IdnToAscii', 'IdnToUnicode']);
Normaliz.Preload('NormalizeString');
Normaliz.Preload();
```

## Where To Look

| Need                              | Read                  |
| --------------------------------- | --------------------- |
| Find a method or its MS Docs link | `structs/Normaliz.ts` |
| Find types, enums, constants      | `types/Normaliz.ts`   |
| Quick examples                    | `README.md`           |

`index.ts` re-exports the class and all types. Import from `@bun-win32/normaliz` directly.

## Calling Convention

All documented `normaliz.dll` exports are bound. Each method maps 1:1 to its DLL export. Names, parameter names, and order match Microsoft Docs.

### Strings

All methods in this package use UTF-16LE NUL-terminated buffers.

```ts
const wide = Buffer.from('xn--bcher-kva\0', 'utf16le');
const requiredLength = Normaliz.IdnToUnicode(0, wide.ptr!, -1, null, 0);
```

### Return types

- `BOOL`, `DWORD`, `INT`, and enums map to `number`.
- `LPCWSTR` and `LPWSTR` map to `Pointer`.
- Win32 `BOOL` is `number` (0 or non-zero), not JS `boolean`.

### Pointers and out-parameters

- Pointer parameters take `buffer.ptr!` from a caller-allocated `Buffer`.
- For sizing calls, pass `null` for the optional output buffer and `0` for its length.
- For output buffers, allocate `requiredLength * 2` bytes because the API lengths are character counts, not byte counts.

```ts
const source = Buffer.from('e\u0301\0', 'utf16le');
const bufferLengthEstimate = Normaliz.NormalizeString(NormalizationForm.NormalizationC, source.ptr!, -1, null, 0);
const destination = Buffer.alloc(bufferLengthEstimate * 2);
const writtenLength = Normaliz.NormalizeString(NormalizationForm.NormalizationC, source.ptr!, -1, destination.ptr!, bufferLengthEstimate);
```

### Nullability

- `| NULL` means pass `null` for an optional pointer parameter.

## Errors and Cleanup

Return values are raw. If a call returns `0` or a negative length, read `GetLastError()` through another package such as `@bun-win32/kernel32`.
