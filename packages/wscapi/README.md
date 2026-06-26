# @bun-win32/wscapi

Zero-dependency, zero-overhead Win32 WSCAPI bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/wscapi` exposes the `wscapi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Wscapi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The Windows Security Center (WSC) API reports the aggregate health of the system's security provider categories — firewall, antivirus, automatic updates, UAC, internet settings, and the WSC service — and lets an app register for change notifications. It is the supported way to read security posture without parsing `Get-MpComputerStatus` output.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `wscapi.dll` (Windows Security Center provider health, change notifications, antimalware URI).
- In-source docs in `structs/Wscapi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Wscapi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Wscapi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/wscapi
```

## Quick Start

```ts
import Wscapi, { WSC_SECURITY_PROVIDER, WSC_SECURITY_PROVIDER_HEALTH } from '@bun-win32/wscapi';

const health = Buffer.alloc(4);
const hr = Wscapi.WscGetSecurityProviderHealth(WSC_SECURITY_PROVIDER.WSC_SECURITY_PROVIDER_ANTIVIRUS, health.ptr);

const code = health.readInt32LE(0);
console.log('Antivirus:', WSC_SECURITY_PROVIDER_HEALTH[code], `(hr=${hr})`);
// hr === 1 (S_FALSE) means the WSC service is not running.
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example/security-dashboard.ts
bun run example/wsc-health-report.ts
```

## Notes

- Either rely on lazy binding or call `Wscapi.Preload()`.
- `WscGetSecurityProviderHealth` returns `S_FALSE` (`1`) and forces `pHealth` to `POOR` if the WSC service is stopped.
- As of Windows 10 1607, WSC tracks antivirus but not standalone antispyware.
- Pair `WscRegisterForChanges` with `WscUnRegisterChanges`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
