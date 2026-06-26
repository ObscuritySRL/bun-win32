# @bun-win32/httpapi

Zero-dependency, zero-overhead Win32 Httpapi bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/httpapi` exposes the `httpapi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Httpapi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `httpapi.dll` (HTTP Server API: kernel-mode HTTP listener powering IIS, HTTP.sys request queues, URL groups, server sessions, SSL/TLS config, response caching, push, and request/response shaping).
- In-source docs in `structs/Httpapi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Httpapi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Httpapi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/httpapi
```

## Quick Start

```ts
import Httpapi, {
  HTTPAPI_VERSION_2,
  HTTP_INITIALIZE_FLAG,
  HTTP_SERVER_PROPERTY,
} from '@bun-win32/httpapi';

// Bring HTTP.sys online for this process
const init = Httpapi.HttpInitialize(HTTPAPI_VERSION_2, HTTP_INITIALIZE_FLAG.HTTP_INITIALIZE_SERVER, null);
if (init !== 0) throw new Error(`HttpInitialize failed: ${init}`);

// Create a server session, URL group, and request queue
const sessionIdBuf = Buffer.alloc(8);
Httpapi.HttpCreateServerSession(HTTPAPI_VERSION_2, sessionIdBuf.ptr, 0);
const sessionId = sessionIdBuf.readBigUInt64LE(0);

const urlGroupIdBuf = Buffer.alloc(8);
Httpapi.HttpCreateUrlGroup(sessionId, urlGroupIdBuf.ptr, 0);
const urlGroupId = urlGroupIdBuf.readBigUInt64LE(0);

const queueHandleBuf = Buffer.alloc(8);
Httpapi.HttpCreateRequestQueue(HTTPAPI_VERSION_2, null, null, 0, queueHandleBuf.ptr);
const queueHandle = queueHandleBuf.readBigUInt64LE(0);

// HTTP_BINDING_INFO { Flags (Present:1), HANDLE RequestQueueHandle }
const binding = Buffer.alloc(16);
binding.writeUInt32LE(1, 0);
binding.writeBigUInt64LE(queueHandle, 8);
Httpapi.HttpSetUrlGroupProperty(urlGroupId, HTTP_SERVER_PROPERTY.HttpServerBindingProperty, binding.ptr, 16);

const url = Buffer.from('http://localhost:8765/\0', 'utf16le');
Httpapi.HttpAddUrlToUrlGroup(urlGroupId, url.ptr, 0n, 0);

// ... HttpReceiveHttpRequest / HttpSendHttpResponse loop ...

Httpapi.HttpRemoveUrlFromUrlGroup(urlGroupId, url.ptr, 0);
Httpapi.HttpCloseUrlGroup(urlGroupId);
Httpapi.HttpCloseRequestQueue(queueHandle);
Httpapi.HttpCloseServerSession(sessionId);
Httpapi.HttpTerminate(HTTP_INITIALIZE_FLAG.HTTP_INITIALIZE_SERVER, null);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:http-traffic-monitor
bun run example:http-traffic-monitor --port=9000 --max=10   # custom port and request cap
bun run example:http-service-audit
```

## Notes

- `HttpAddUrlToUrlGroup` (and `HttpAddUrl`) require either Administrator privileges **or** a one-time URL ACL reservation: `netsh http add urlacl url=http://+:8765/ user=Everyone`.
- `HttpInitialize` / `HttpTerminate` are per-process reference-counted — match every call.
- Either rely on lazy binding or call `Httpapi.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
