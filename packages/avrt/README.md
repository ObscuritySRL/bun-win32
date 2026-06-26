# @bun-win32/avrt

Zero-dependency, zero-overhead Win32 AVRT bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/avrt` exposes the `avrt.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Avrt`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

`avrt.dll` is the Multimedia Class Scheduler Service (MMCSS) client library: it lets a thread register with a multimedia task ("Audio", "Pro Audio", "Games", …), raise its scheduling priority, query the system-responsiveness reservation, and coordinate work across threads via thread-ordering groups — the same primitives low-latency audio and capture engines use.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `avrt.dll` (MMCSS thread characteristics, AVRT priorities, system responsiveness, thread-ordering groups).
- In-source docs in `structs/Avrt.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Avrt.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/Avrt.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/avrt
```

## Quick Start

```ts
import Avrt, { AVRT_PRIORITY } from '@bun-win32/avrt';

// Join the "Pro Audio" MMCSS task; TaskIndex must be 0 on the first call.
const taskIndex = Buffer.alloc(4);
const handle = Avrt.AvSetMmThreadCharacteristicsW(Buffer.from('Pro Audio\0', 'utf16le').ptr, taskIndex.ptr);

if (handle !== 0n) {
  Avrt.AvSetMmThreadPriority(handle, AVRT_PRIORITY.AVRT_PRIORITY_CRITICAL);

  const responsiveness = Buffer.alloc(4);
  Avrt.AvQuerySystemResponsiveness(handle, responsiveness.ptr);
  console.log(`${responsiveness.readUInt32LE(0)}% reserved for non-MMCSS threads`);

  // ... run latency-sensitive work ...

  Avrt.AvRevertMmThreadCharacteristics(handle); // always pair with the join
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example/mmcss-jitter-scope.ts
bun run example/mmcss-profile-report.ts
```

## Notes

- Either rely on lazy binding or call `Avrt.Preload()`.
- Always pair `AvSetMm*ThreadCharacteristics` with `AvRevertMmThreadCharacteristics`.
- Thread-ordering-group APIs require the thread-ordering server; it is disabled on some SKUs (`AvRtCreateThreadOrderingGroup` then fails with `ERROR_SERVICE_DISABLED`).
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
