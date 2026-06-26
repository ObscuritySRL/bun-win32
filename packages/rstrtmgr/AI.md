# AI Guide for @bun-win32/rstrtmgr

How to use this package, not what the Win32 API does.

## Usage

```ts
import Rstrtmgr, { CCH_RM_SESSION_KEY } from '@bun-win32/rstrtmgr';

const sessionHandleBuffer = Buffer.alloc(4);
const sessionKeyBuffer = Buffer.alloc((CCH_RM_SESSION_KEY + 1) * 2);

const status = Rstrtmgr.RmStartSession(sessionHandleBuffer.ptr, 0, sessionKeyBuffer.ptr);

Rstrtmgr.Preload(['RmGetList', 'RmRegisterResources']);
Rstrtmgr.Preload('RmGetFilterList');
Rstrtmgr.Preload();
```

## Where To Look

| Need                              | Read                  |
| --------------------------------- | --------------------- |
| Find a method or its MS Docs link | `structs/Rstrtmgr.ts` |
| Find types, enums, constants      | `types/Rstrtmgr.ts`   |
| Quick examples                    | `README.md`           |

`index.ts` re-exports the class and all types - import from `@bun-win32/rstrtmgr` directly.

## Calling Convention

All documented `rstrtmgr.dll` exports are bound. Each method maps 1:1 to its DLL export. Names, parameter names, and order match Microsoft Docs.

### Strings

Restart Manager string parameters use UTF-16LE NUL-terminated buffers. String-array parameters use a caller-built pointer array whose elements point at UTF-16LE strings.

```ts
const filePath = Buffer.from('C:\\temp\\demo.txt\0', 'utf16le');
const fileNames = Buffer.alloc(8);

fileNames.writeBigUInt64LE(BigInt(filePath.ptr!), 0);

Rstrtmgr.RmRegisterResources(sessionHandle, 1, fileNames.ptr, 0, null, 0, null);
```

### Return types

- `DWORD`, `UINT`, `ULONG` -> `number`
- `LPWSTR`, `LPCWSTR`, `PBYTE`, `PLPCWSTR`, `PRM_PROCESS_INFO`, `PRM_UNIQUE_PROCESS`, `RM_WRITE_STATUS_CALLBACK` -> `Pointer`
- Restart Manager returns Win32 error codes directly; `0` is `ERROR_SUCCESS`.

### Pointers and out-parameters

- Pointer params (`LP*`, `P*`, `Pointer`): pass `buffer.ptr` from a caller-allocated `Buffer`.
- Pointer-array params (`PLPCWSTR`): pass a buffer of 64-bit pointer values.
- **Out-parameters** carry a direction suffix on the parameter **name** — `_out` for an `_Out_` param (the function writes through it), `_in_out` for `_Inout_` (you seed it, the function updates it); an `_In_` param is bare. Allocate a `Buffer`, pass `.ptr`, read the result after the call.

```ts
const bytesNeeded = Buffer.alloc(4);

Rstrtmgr.RmGetFilterList(sessionHandle, null, 0, bytesNeeded.ptr);

const requiredBytes = bytesNeeded.readUInt32LE(0);
```

### Nullability

Nullability is encoded in the **type** via two representation-aware markers — the null sentinel is derived from `T` (`null` for pointer types `LP*`/`P*`, `0n` for handles and by-value addresses):

- `OPTIONAL<T>` — the parameter is formally optional (SAL `_*opt_` / `[*, optional]` / `_Reserved_` that still takes a value). Pass a value, or the null sentinel to omit.
- `NULLABLE<T>` — a plain `[in]`/`[out]` param whose docs say it can be NULL ("This parameter can be NULL" / "Specify NULL to …", including sizing-call buffers).
- A **required** param is bare; a **must-be-null reserved** param is typed `NULL`. A by-value **scalar** (`DWORD`/`ULONG`/`UINT`/`BOOL`) is never wrapped — its "optional" means pass `0`/a default.
## Errors and Cleanup

Return values are raw system error codes. Close every session with `RmEndSession()` in a `finally` block.
