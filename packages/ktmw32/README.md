# @bun-win32/ktmw32

Zero-dependency, zero-overhead Win32 KTM (Kernel Transaction Manager) bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/ktmw32` exposes the `ktmw32.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Ktmw32`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The Kernel Transaction Manager is Windows' built-in distributed-transaction engine. Open a transaction with `CreateTransaction`, enlist work in it — transacted-NTFS files (via `kernel32`'s `CreateFileTransactedW`), the transacted registry, or your own resource manager — then `CommitTransaction` to apply everything atomically and durably, or `RollbackTransaction` to discard the whole batch as if it never happened. The full Transaction-Manager → Resource-Manager → Enlistment object graph, the two-phase-commit verbs, and virtual-clock recovery are all bound.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `ktmw32.dll` (transactions, transaction managers, resource managers, enlistments, two-phase commit).
- In-source docs in `structs/Ktmw32.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Ktmw32.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases and the full KTM enum set (see `types/Ktmw32.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later (KTM since Windows Vista / Server 2008)

## Installation

```sh
bun add @bun-win32/ktmw32
```

## Quick Start

```ts
import Ktmw32, { TransactionOutcome } from '@bun-win32/ktmw32';
import Kernel32 from '@bun-win32/kernel32';

// Open a KTM transaction (all-access handle; INVALID_HANDLE_VALUE on failure).
const hTx = Ktmw32.CreateTransaction(null, null, 0, 0, 0, 0, null);

// Create/replace a file *inside* the transaction — invisible to outside readers until commit.
const path = Buffer.from('C:\\Temp\\ledger.txt\0', 'utf16le');
const hFile = Kernel32.CreateFileTransactedW(path.ptr, 0x4000_0000 /* GENERIC_WRITE */, 0, null!, 2 /* CREATE_ALWAYS */, 0x80 /* FILE_ATTRIBUTE_NORMAL */, 0n, hTx, null!, null!);
const data = Buffer.from('balance=100');
Kernel32.WriteFile(hFile, data.ptr, data.byteLength, Buffer.alloc(4).ptr, null!);
Kernel32.CloseHandle(hFile);

// Inspect the live transaction, then resolve it atomically.
const outcome = Buffer.alloc(4);
Ktmw32.GetTransactionInformation(hTx, outcome.ptr, null, null, null, 0, null);
console.log('outcome:', TransactionOutcome[outcome.readUInt32LE(0)]); // TransactionOutcomeUndetermined

Ktmw32.CommitTransaction(hTx); // ...or Ktmw32.RollbackTransaction(hTx) to discard everything
Kernel32.CloseHandle(hTx);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example/atomic-ledger.ts
bun run example/transaction-forensics.ts
```

## Notes

- Either rely on lazy binding or call `Ktmw32.Preload()`.
- `CreateTransaction` / `CreateTransactionManager` / `CreateResourceManager` / `CreateEnlistment` / `Open*` return a `HANDLE`; failure is `INVALID_HANDLE_VALUE` (`0xFFFFFFFFFFFFFFFFn`), **not** `0n`. Close every handle with `kernel32`'s `CloseHandle`.
- Closing the last transaction handle before `CommitTransaction` implicitly rolls the transaction back.
- After `CreateTransactionManager` / `OpenTransactionManager*` you must call `RecoverTransactionManager` for durable TMs; volatile TMs (`TRANSACTION_MANAGER_VOLATILE`, `LogFileName` = `NULL`) do not perform recovery.
- A volatile resource manager can live on a durable TM, but a durable RM cannot live on a volatile TM.
- Every resource manager must register at least `TRANSACTION_NOTIFY_PREPREPARE | PREPARE | COMMIT | ROLLBACK` in its `CreateEnlistment` notification mask.
- `GetTransactionInformation` returns `BOOL`; the `Outcome` out-param decodes via the `TransactionOutcome` enum.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
