# @bun-win32/dnsapi

Zero-dependency, zero-overhead Win32 Dnsapi bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/dnsapi` exposes the `dnsapi.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Dnsapi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `dnsapi.dll` (DNS queries for every record type, name validation, server discovery, DNS-SD service browsing, mDNS, and async resolution).
- In-source docs in `structs/Dnsapi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Dnsapi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Dnsapi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/dnsapi
```

## Quick Start

```ts
import { read, toArrayBuffer, type Pointer } from 'bun:ffi';

import Dnsapi, { DnsFreeType, DnsQueryOption, DnsType } from '@bun-win32/dnsapi';

// Query A records for example.com
const name = Buffer.from('example.com\0', 'utf16le');
const out = Buffer.alloc(8);

const status = Dnsapi.DnsQuery_W(name.ptr, DnsType.DNS_TYPE_A, DnsQueryOption.DNS_QUERY_STANDARD, null, out.ptr, null);

if (status !== 0) {
  throw new Error(`DnsQuery_W failed with status ${status}`);
}

const head = read.ptr(out.ptr) as Pointer | null;
let cur: Pointer | null = head;

while (cur) {
  // DNS_RECORD header is 32 bytes; DNS_A_DATA places the IPv4 octets at offset 32
  const buf = Buffer.from(toArrayBuffer(cur, 0, 40));
  const pNext = Number(buf.readBigUInt64LE(0));
  const wType = buf.readUInt16LE(16);

  if (wType === DnsType.DNS_TYPE_A) {
    console.log(`${buf[32]}.${buf[33]}.${buf[34]}.${buf[35]}`);
  }

  cur = pNext !== 0 ? (pNext as Pointer) : null;
}

if (head) Dnsapi.DnsRecordListFree(head, DnsFreeType.DnsFreeRecordList);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:dns-tree
bun run example:dns-forensics
bun run example:dns-forensics microsoft.com github.com   # custom targets
```

## Notes

- Either rely on lazy binding or call `Dnsapi.Preload()`.
- DNS records returned by `DnsQuery_W`/`DnsQuery_A`/`DnsQuery_UTF8` are a linked list rooted at the pointer written into the `ppQueryResults` out-buffer; release the whole list with `DnsRecordListFree(head, DnsFreeType.DnsFreeRecordList)`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
