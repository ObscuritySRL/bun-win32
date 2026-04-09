# AI Guide for @bun-win32/ole32

How to use this package, not what the Win32 API does.

## Usage

```ts
import Ole32 from '@bun-win32/ole32';

const result = Ole32.OleBuildVersion();

Ole32.Preload(['OleBuildVersion', 'StgIsStorageFile']);
Ole32.Preload('OleBuildVersion');
Ole32.Preload();
```

## Where To Look

| Need                              | Read              |
| --------------------------------- | ----------------- |
| Find a method or its MS Docs link | `structs/Ole32.ts` |
| Find types, enums, constants      | `types/Ole32.ts`   |
| Quick examples                    | `README.md`        |

`index.ts` re-exports the class and all types - import from `@bun-win32/ole32` directly.

## Calling Convention

All documented `ole32.dll` exports in this package are bound. Each method maps 1:1 to its DLL export. Names, parameter names, and order match Microsoft Docs or Windows SDK headers.

### Strings

`W` methods take UTF-16LE NUL-terminated buffers.

```ts
const wide = Buffer.from('Hello\\0', 'utf16le');
const result = Ole32.StgIsStorageFile(wide.ptr);
```

### Return types

- `HANDLE`, `HWND`, `HGLOBAL`, `HICON`, `HOLEMENU`, and similar handle types -> `bigint`
- `DWORD`, `UINT`, `BOOL`, `INT`, `LONG`, `HRESULT`, and similar scalar types -> `number`
- `LPVOID`, COM interface pointers, `LPOLESTR`, and other pointer types -> `Pointer`

### Pointers, handles, out-parameters

- Pointer params (`LP*`, `P*`, interface pointers): pass `buffer.ptr` from caller-allocated memory.
- Handle params (`HANDLE`, `HGLOBAL`, `HWND`, etc.): pass a `bigint`.
- Out-parameters: allocate a buffer, pass `.ptr`, then read the result after the call.

```ts
const fileTimeBuffer = Buffer.alloc(8);
const dosDateBuffer = Buffer.alloc(2);
const dosTimeBuffer = Buffer.alloc(2);
Ole32.CoFileTimeToDosDateTime(fileTimeBuffer.ptr, dosDateBuffer.ptr, dosTimeBuffer.ptr);
```

### Nullability

- `| NULL` in a signature -> pass `null`.
- `| 0n` in a signature -> pass `0n`.

## Errors and Cleanup

Return values are raw. If a call returns an interface pointer, handle, or allocated memory, cleanup is still your responsibility. COM interface pointers returned by flat exports are raw pointers; this package does not wrap vtable-based method calls or reference counting.
