# @bun-win32/vssapi

Zero-dependency, zero-overhead Win32 VSSAPI bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/vssapi` exposes the `vssapi.dll` exports — the Volume Shadow Copy Service (VSS) backup engine — using [Bun](https://bun.sh)'s FFI. It provides a single class, `Vssapi`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

VSS is how Windows takes point-in-time, application-consistent snapshots of live volumes (it is what `vssadmin`, Windows Backup, and every serious backup product sit on top of). This package binds the documented flat C entry points: spin up the COM backup engine with `CreateVssBackupComponents`, examine writer metadata with `CreateVssExamineWriterMetadata`, ask whether a volume already has shadow copies with `IsVolumeSnapshotted`, check the revert-blocking policy with `ShouldBlockRevert`, and free snapshot-property memory with `VssFreeSnapshotProperties`. The real backup/restore surface is the COM `IVssBackupComponents` interface, reached by invoking its vtable on the pointer `CreateVssBackupComponents` hands back.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `vssapi.dll` (VSS backup engine, writer-metadata examination, volume snapshot status, revert-block policy, snapshot-property cleanup).
- The documented `vsbackup.h` flat exports (under their real `*Internal` export names) plus the standard `DllCanUnloadNow` / `DllGetClassObject` COM-server entries.
- In-source docs in `structs/Vssapi.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`Vssapi.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases plus the `VSS_SNAPSHOT_STATE`, `VSS_SNAPSHOT_COMPATIBILITY`, and `VSS_VOLUME_SNAPSHOT_ATTRIBUTES` enums (see `types/Vssapi.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later
- Most VSS operations require an elevated (Administrator) process.

## Installation

```sh
bun add @bun-win32/vssapi
```

## Quick Start

```ts
import Vssapi from '@bun-win32/vssapi';
import Ole32 from '@bun-win32/ole32';

// VSS requires COM to be initialized first.
Ole32.CoInitialize(null);

// Does the C: volume already have any shadow copies?
const volume = Buffer.from('C:\\\0', 'utf16le');
const present = Buffer.alloc(4);
const capability = Buffer.alloc(4);

const hr = Vssapi.IsVolumeSnapshotted(volume.ptr!, present.ptr!, capability.ptr!);
if (hr === 0) {
  console.log('Shadow copies present:', present.readInt32LE(0) !== 0);
  console.log('Snapshot compatibility bitmask:', capability.readInt32LE(0));
} else {
  // 0x80070005 = E_ACCESSDENIED — run elevated.
  console.log('IsVolumeSnapshotted → 0x' + (hr >>> 0).toString(16));
}
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:shadow-copy-inspector
bun run example:vss-writer-xray
```

- **shadow-copy-inspector** — a thorough diagnostic: enumerates every fixed volume on the system, then for each one decodes `IsVolumeSnapshotted` (shadow copies present? which volume-control operations are disabled via the `VSS_SNAPSHOT_COMPATIBILITY` bitmask) and `ShouldBlockRevert`, all rendered as an aligned report with every HRESULT decoded by name and graceful E_ACCESSDENIED handling.
- **vss-writer-xray** — a live, animated reveal driven entirely over the COM vtable: `CreateVssBackupComponents` boots the VSS backup engine, `InitializeForBackup` + `GatherWriterMetadata` (awaited through an `IVssAsync`) gathers every registered VSS writer, and `GetWriterMetadataCount` / `GetWriterMetadata` / `IVssExamineWriterMetadata::GetIdentity` X-rays each writer's name, class/instance GUID, usage and source type — strict `IUnknown::Release` teardown throughout.

## Notes

- Call `Ole32.CoInitialize` (or `CoInitializeEx`) before using any VSS export.
- The documented functions are exported under `*Internal` names (e.g. `CreateVssBackupComponentsInternal`); the SDK header `#define`s the documented name to the `*Internal` export. This package binds the real export names.
- `CreateVssBackupComponents` returns an `IVssBackupComponents*` as an opaque `bigint`; drive the backup/restore surface by invoking its vtable, and always `IUnknown::Release` it when done.
- Nearly all VSS calls require an elevated process and the backup privilege; without it expect `E_ACCESSDENIED` (`0x80070005`).
- Either rely on lazy binding or call `Vssapi.Preload()`.
- Windows only. Bun runtime required.
