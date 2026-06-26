# AI Guide for @bun-win32/winscard

How to use this package, not what the Win32 API does.

## Usage

```ts
import WinSCard, { SCARD_SCOPE } from '@bun-win32/winscard';

const contextHandleBuffer = Buffer.alloc(8);

const status = WinSCard.SCardEstablishContext(SCARD_SCOPE.SYSTEM, null, null, contextHandleBuffer.ptr);

WinSCard.Preload(['SCardEstablishContext', 'SCardReleaseContext']);
WinSCard.Preload('SCardEstablishContext');
WinSCard.Preload();
```

## Where To Look

| Need                              | Read                  |
| --------------------------------- | --------------------- |
| Find a method or its MS Docs link | `structs/WinSCard.ts` |
| Find types, enums, constants      | `types/WinSCard.ts`   |
| Quick examples                    | `README.md`           |

`index.ts` re-exports the class and all types - import from `@bun-win32/winscard` directly.

## Calling Convention

All documented `winscard.dll` function exports are bound. Each method maps 1:1 to its DLL export. Names, parameter names, and order match Microsoft Docs.

### Strings

`W` methods take UTF-16LE NUL-terminated buffers. `A` methods take ANSI strings.

```ts
const wide = Buffer.from('Reader Name\0', 'utf16le');
WinSCard.SCardConnectW(contextHandle, wide.ptr, shareMode, preferredProtocols, cardHandleBuffer.ptr, activeProtocolBuffer.ptr);

const text = new TextDecoder('utf-16').decode(buf).replace(/\0.*$/, '');
```

### Return types

- `HANDLE`, `HWND`, `SCARDCONTEXT`, `SCARDHANDLE`, etc. -> `bigint`
- `DWORD`, `UINT`, `BOOL`, `INT`, `LONG` -> `number`
- `LPVOID`, `LPWSTR`, `LPSCARD_READERSTATEW`, etc. -> `Pointer`
- Win32 `BOOL` is `number` (0 or non-zero), not JS `boolean`. Do not compare with `=== true`.

### Pointers, handles, out-parameters

- Pointer params (`LP*`, `P*`, `Pointer`): pass `buffer.ptr` from a caller-allocated `Buffer`.
- Handle params (`HANDLE`, `SCARDCONTEXT`, `SCARDHANDLE`, etc.): pass a `bigint` value.
- **Out-parameters** carry a direction suffix on the parameter **name** — `_out` for an `_Out_` param (the function writes through it), `_in_out` for `_Inout_` (you seed it, the function updates it); an `_In_` param is bare. Allocate a `Buffer`, pass `.ptr`, read the result after the call.

```ts
const out = Buffer.alloc(4);
WinSCard.SCardGetTransmitCount(cardHandle, out.ptr);
const value = out.readUInt32LE(0);
```

### Nullability

Nullability is encoded in the **type** via two representation-aware markers — the null sentinel is derived from `T` (`null` for pointer types `LP*`/`P*`, `0n` for handles and by-value addresses):

- `OPTIONAL<T>` — the parameter is formally optional (SAL `_*opt_` / `[*, optional]` / `_Reserved_` that still takes a value). Pass a value, or the null sentinel to omit.
- `NULLABLE<T>` — a plain `[in]`/`[out]` param whose docs say it can be NULL ("This parameter can be NULL" / "Specify NULL to …", including sizing-call buffers).
- A **required** param is bare; a **must-be-null reserved** param is typed `NULL`. A by-value **scalar** (`DWORD`/`ULONG`/`UINT`/`BOOL`) is never wrapped — its "optional" means pass `0`/a default.
## Errors and Cleanup

Return values are raw. WinSCard functions usually return `SCARD_S_SUCCESS` (`0`) on success and an `SCARD_*` error code on failure. Resource cleanup is your responsibility - release contexts with `SCardReleaseContext`, disconnect cards with `SCardDisconnect`, and free service-allocated buffers with `SCardFreeMemory`.
