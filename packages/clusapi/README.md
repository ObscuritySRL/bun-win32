# @bun-win32/clusapi

Zero-dependency, zero-overhead Win32 Failover Cluster bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/clusapi` exposes the `clusapi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Clusapi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

All 205 documented Microsoft Failover Cluster API functions are bound — cluster/node/group/resource/network lifecycle, enumeration, control, the cluster registry batch API, and notification ports. Opaque cluster handles (`HCLUSTER`, `HNODE`, `HRESOURCE`, enum handles, …) are modeled as `bigint`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11 and Windows Server.
- Direct FFI to `clusapi.dll` (Failover Cluster management — server products).
- In-source docs in `structs/Clusapi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Clusapi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases and decoded state enums (see `types/Clusapi.ts`).
- Degrades gracefully on standalone machines (no Cluster service required to call the API).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later (Failover Clustering is a Windows Server feature; the API is callable everywhere)

## Installation

```sh
bun add @bun-win32/clusapi
```

## Quick Start

```ts
import Clusapi from '@bun-win32/clusapi';

// Is the Cluster service installed/running on this node?
const stateBuf = Buffer.alloc(4);
if (Clusapi.GetNodeClusterState(null, stateBuf.ptr!) === 0) {
  const state = stateBuf.readUInt32LE(0); // NODE_CLUSTER_STATE
  const running = (state & 0x10) !== 0;
  console.log(running ? 'Active cluster node' : 'Not clustered');
}

// Connect to the local cluster (0n when there is no Cluster service).
const hCluster = Clusapi.OpenCluster(null);
if (hCluster !== 0n) {
  const cch = Buffer.alloc(4);
  cch.writeUInt32LE(256, 0);
  const name = Buffer.alloc(512);
  Clusapi.GetClusterInformation(hCluster, name.ptr!, cch.ptr!, null);
  console.log('Cluster:', name.toString('utf16le').replace(/\0.*$/, ''));
  Clusapi.CloseCluster(hCluster);
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:cluster-radar       # animated live cluster radar sweep
bun run example:cluster-diagnostic  # full Failover Cluster diagnostic report
bun test  example/clusapi.integration.test.ts  # real FFI integration test
```

## Notes

- Either rely on lazy binding or call `Clusapi.Preload()`.
- Cluster handles are opaque `bigint` tokens — never dereference them; pass them back to other `Clusapi` methods and release with the matching `Close*` call.
- Many functions follow the two-call sizing pattern: call with a NULL/short buffer, observe `ERROR_MORE_DATA` (234), then re-call with the required size.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
