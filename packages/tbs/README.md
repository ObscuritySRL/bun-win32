# @bun-win32/tbs

Zero-dependency, zero-overhead Win32 TBS (TPM Base Services) bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/tbs` exposes the `tbs.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Tbs`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

TPM Base Services (TBS) is the supported user-mode gateway to the Trusted Platform Module: open a context, submit raw TPM 2.0 command buffers (`TPM2_GetRandom`, `TPM2_GetCapability`, attestation, …), read the TCG measured-boot event log, fetch the device's Windows AIK ID, and query owner-auth. This is the foundation for attestation, sealing, and compliance tooling.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `tbs.dll` (TPM context, command submit, TCG log, device ID, owner-auth).
- In-source docs in `structs/Tbs.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Tbs.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Tbs.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later, with a TPM 2.0 device

## Installation

```sh
bun add @bun-win32/tbs
```

## Quick Start

```ts
import Tbs, { TBS_COMMAND_LOCALITY_ZERO, TBS_COMMAND_PRIORITY_NORMAL, TBS_CONTEXT_VERSION_TWO, TBS_SUCCESS } from '@bun-win32/tbs';

// TBS_CONTEXT_PARAMS2 { version; includeTpm20 }
const params = Buffer.alloc(8);
params.writeUInt32LE(TBS_CONTEXT_VERSION_TWO, 0);
params.writeUInt32LE(0b100, 4); // includeTpm20

const ctx = Buffer.alloc(8);
if (Tbs.Tbsi_Context_Create(params.ptr, ctx.ptr) === TBS_SUCCESS) {
  const hContext = ctx.readBigUInt64LE(0);

  // TPM2_GetRandom(16) — pull 16 bytes from the hardware RNG.
  const cmd = Buffer.alloc(12);
  cmd.writeUInt16BE(0x8001, 0); // TPM_ST_NO_SESSIONS
  cmd.writeUInt32BE(12, 2); // commandSize
  cmd.writeUInt32BE(0x0000017b, 6); // TPM_CC_GetRandom
  cmd.writeUInt16BE(16, 10); // bytesRequested

  const resp = Buffer.alloc(64);
  const respLen = Buffer.alloc(4);
  respLen.writeUInt32LE(resp.byteLength, 0);
  Tbs.Tbsip_Submit_Command(hContext, TBS_COMMAND_LOCALITY_ZERO, TBS_COMMAND_PRIORITY_NORMAL, cmd.ptr, cmd.byteLength, resp.ptr, respLen.ptr);

  const size = resp.readUInt16BE(10);
  console.log('TPM random:', resp.subarray(12, 12 + size).toString('hex'));

  Tbs.Tbsip_Context_Close(hContext); // always pair with Tbsi_Context_Create
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example/tpm-entropy-fountain.ts
bun run example/tpm-diagnostic.ts
```

## Notes

- Either rely on lazy binding or call `Tbs.Preload()`.
- Always pair `Tbsi_Context_Create` with `Tbsip_Context_Close`.
- `Tbsip_Submit_Command` takes a raw TPM command buffer (big-endian) and writes the raw response; you build/parse the TPM wire format yourself.
- `Tbsi_Get_TCG_Log` / `GetDeviceID` use the sizing-call pattern: call with `NULL` first to learn the required length.
- Result codes are `TBS_RESULT` (`0` = `TBS_SUCCESS`); `GetDeviceID*` return `HRESULT`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
