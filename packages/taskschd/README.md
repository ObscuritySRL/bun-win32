# @bun-win32/taskschd

Zero-dependency, zero-overhead Win32 Taskschd bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/taskschd` exposes the documented `taskschd.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `Taskschd`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The package intentionally stays export-accurate: `taskschd.dll` exports the COM server entry points, not the `ITaskService` methods themselves. The runnable examples show how to activate `CLSID_TaskScheduler` through `DllGetClassObject` and then drive the Task Scheduler COM interfaces through their vtables.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `taskschd.dll` (Task Scheduler COM server entry points).
- In-source docs in `structs/Taskschd.ts` with links to Microsoft Learn.
- Lazy binding on first call; optional eager preload (`Taskschd.Preload()`).
- No wrapper overhead; calls map 1:1 to native exports.
- Strongly-typed COM pointer aliases for `DllGetClassObject` (see `types/Taskschd.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/taskschd
```

## Quick Start

```ts
import Taskschd from '@bun-win32/taskschd';

Taskschd.Preload(['DllCanUnloadNow', 'DllGetClassObject']);

const unloadStatus = Taskschd.DllCanUnloadNow();
console.log(`DllCanUnloadNow -> 0x${(unloadStatus >>> 0).toString(16).padStart(8, '0')}`);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:schedule-constellation
bun run example:task-service-audit
```

## Notes

- Either rely on lazy binding or call `Taskschd.Preload()`.
- `taskschd.dll` exports `DllCanUnloadNow`, `DllGetClassObject`, `DllRegisterServer`, and `DllUnregisterServer`.
- The Task Scheduler object model itself is COM-based. Use `DllGetClassObject` to obtain an `IClassFactory`, create `ITaskService`, and then call the interface vtables as shown in `example/task-service-audit.ts` and `example/schedule-constellation.ts`.
- `DllRegisterServer` and `DllUnregisterServer` mutate COM registration. Do not call them casually from end-user code.
- Windows only. Bun runtime required.
