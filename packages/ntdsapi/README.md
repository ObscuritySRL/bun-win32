# @bun-win32/ntdsapi

Zero-dependency, zero-overhead Win32 NTDSAPI (Active Directory client) bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/ntdsapi` exposes the `ntdsapi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Ntdsapi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

NTDSAPI is the Active Directory client surface: bind to a directory (`DsBind*`), translate object names between formats (`DsCrackNames`), forge and register Kerberos Service Principal Names (`DsGetSpn` / `DsClientMakeSpnForTargetServer` / `DsWriteAccountSpn`), enumerate sites/servers/roles/domain-controllers, drive replication (`DsReplicaSync` / `DsReplicaAdd` / `DsReplicaGetInfo`), and migrate SID history. All 81 documented exports are bound — the SPN and syntactical name-translation calls work with no domain at all.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `ntdsapi.dll` (directory bind, name cracking, SPNs, replication, sites/roles, SID history).
- In-source docs in `structs/Ntdsapi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Ntdsapi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases and enums (see `types/Ntdsapi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/ntdsapi
```

## Quick Start

```ts
import Ntdsapi from '@bun-win32/ntdsapi';

// Construct a Kerberos SPN for a target server — no domain required.
const serviceClass = Buffer.from('HOST\0', 'utf16le');
const serviceName = Buffer.from('dc01.fabrikam.com\0', 'utf16le');
const len = Buffer.alloc(4);
len.writeUInt32LE(512, 0);
const spn = Buffer.alloc(512 * 2);

if (Ntdsapi.DsClientMakeSpnForTargetServerW(serviceClass.ptr!, serviceName.ptr!, len.ptr, spn.ptr!) === 0) {
  console.log('SPN:', spn.toString('utf16le', 0, (len.readUInt32LE(0) - 1) * 2));
}

// Mint and release an alternate-credential handle.
const pAuth = Buffer.alloc(8);
const user = Buffer.from('jeff@fabrikam.com\0', 'utf16le');
if (Ntdsapi.DsMakePasswordCredentialsW(user.ptr!, null, null, pAuth.ptr) === 0) {
  const handle = pAuth.readBigUInt64LE(0);
  Ntdsapi.DsFreePasswordCredentials(handle); // always pair with DsMakePasswordCredentials
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example/spn-forge.ts
bun run example/directory-diagnostic.ts
```

## Notes

- Either rely on lazy binding or call `Ntdsapi.Preload()`.
- Most functions return a Win32/RPC error code (`0` = `ERROR_SUCCESS`); the `DsFree*` family returns `void`.
- `DsBind*` returns a directory handle via an out-parameter; always release it with `DsUnBind*`.
- `DsCrackNames`, `DsGetSpn`, `DsMapSchemaGuids`, `DsListSites`, `DsGetDomainControllerInfo`, etc. allocate result memory in the DLL — read it back via `bun:ffi`'s `read.ptr` / `toArrayBuffer`, then free it with the matching `DsFree*` call.
- `DsCrackNames*` with `DS_NAME_FLAG_SYNTACTICAL_ONLY` and a `0n` handle works entirely client-side (no domain).
- Windows only. Bun runtime required.
