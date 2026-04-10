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
- Out-parameters: allocate a `Buffer`, pass `.ptr`, read the result after the call.

```ts
const out = Buffer.alloc(4);
WinSCard.SCardGetTransmitCount(cardHandle, out.ptr);
const value = out.readUInt32LE(0);
```

### Nullability

- `| NULL` in a signature -> pass `null` (optional pointer).
- `| 0n` in a signature -> pass `0n` (optional handle).

## Errors and Cleanup

Return values are raw. WinSCard functions usually return `SCARD_S_SUCCESS` (`0`) on success and an `SCARD_*` error code on failure. Resource cleanup is your responsibility - release contexts with `SCardReleaseContext`, disconnect cards with `SCardDisconnect`, and free service-allocated buffers with `SCardFreeMemory`.
