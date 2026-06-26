# @bun-win32/firewallapi

Zero-dependency, zero-overhead Win32 FirewallAPI bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/firewallapi` exposes the `FirewallAPI.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `FirewallApi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

`FirewallAPI.dll` has a small documented flat-export surface: the 9 `NetworkIsolation*` AppContainer / network-isolation functions plus the four `Dll*` COM-server entry points. The Windows Firewall policy surface (`INetFwPolicy2`, `INetFwRules`, `INetFwRule`) is COM: `FirewallAPI.dll` is the registered in-process server for `CLSID_NetFwPolicy2`, so it is reached through `DllGetClassObject` + the `IClassFactory` / `INetFwPolicy2` vtables (see the example).

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `FirewallAPI.dll` (Windows Firewall policy COM server, network isolation, and AppContainer enumeration).
- In-source docs in `structs/FirewallApi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`FirewallApi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/FirewallApi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/firewallapi
```

## Quick Start

```ts
import FirewallApi, { NETISO_FLAG } from '@bun-win32/firewallapi';

// Enumerate every AppContainer registered on the system.
const count = Buffer.alloc(4);
const ppList = Buffer.alloc(8); // receives a PINET_FIREWALL_APP_CONTAINER

const status = FirewallApi.NetworkIsolationEnumAppContainers(NETISO_FLAG.NETISO_FLAG_FORCE_COMPUTE_BINARIES, count.ptr!, ppList.ptr!);

if (status === 0) {
  console.log(`AppContainers registered: ${count.readUInt32LE(0)}`);
  // ppList now holds the address of the DLL-allocated array; walk it with
  // Kernel32.ReadProcessMemory, then release it via
  // FirewallApi.NetworkIsolationFreeAppContainers (see example/firewall-x-ray.ts).
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:firewall-x-ray
bun run example:firewall-audit
```

## Notes

- Either rely on lazy binding or call `FirewallApi.Preload()`.
- The `INetFwPolicy2` policy COM surface is reached via `DllGetClassObject` (this DLL is the registered `CLSID_NetFwPolicy2` in-process server). Call `CoInitialize` first.
- Reading firewall profile state works unelevated; modifying policy requires elevation.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
