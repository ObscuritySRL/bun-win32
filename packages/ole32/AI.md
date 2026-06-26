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
- **Out-parameters** carry a direction suffix on the parameter **name** — `_out` for an `_Out_` param (the function writes through it), `_in_out` for `_Inout_` (you seed it, the function updates it); an `_In_` param is bare. Allocate a `Buffer`, pass `.ptr`, read the result after the call.

```ts
const fileTimeBuffer = Buffer.alloc(8);
const dosDateBuffer = Buffer.alloc(2);
const dosTimeBuffer = Buffer.alloc(2);
Ole32.CoFileTimeToDosDateTime(fileTimeBuffer.ptr, dosDateBuffer.ptr, dosTimeBuffer.ptr);
```

### Nullability

Nullability is encoded in the **type** via two representation-aware markers — the null sentinel is derived from `T` (`null` for pointer types `LP*`/`P*`, `0n` for handles and by-value addresses):

- `Optional<T>` — the parameter is formally optional (SAL `_*opt_` / `[*, optional]` / `_Reserved_` that still takes a value). Pass a value, or the null sentinel to omit.
- `Nullable<T>` — a plain `[in]`/`[out]` param whose docs say it can be NULL ("This parameter can be NULL" / "Specify NULL to …", including sizing-call buffers).
- A **required** param is bare; a **must-be-null reserved** param is typed `NULL`. A by-value **scalar** (`DWORD`/`ULONG`/`UINT`/`BOOL`) is never wrapped — its "optional" means pass `0`/a default.
## Errors and Cleanup

Return values are raw. If a call returns an interface pointer, handle, or allocated memory, cleanup is still your responsibility. COM interface pointers returned by flat exports are raw pointers; this package does not wrap vtable-based method calls or reference counting.
