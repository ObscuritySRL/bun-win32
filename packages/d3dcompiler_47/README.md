# @bun-win32/d3dcompiler_47

Zero-dependency, zero-overhead Win32 D3dcompiler_47 bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/d3dcompiler_47` exposes the `d3dcompiler_47.dll` exports using [Bun](https://bun.sh)'s FFI. It provides a single class, `D3dcompiler_47`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `d3dcompiler_47.dll` — HLSL → DXBC shader compilation, preprocessing, disassembly, reflection, blob part extraction, shader stripping, function linking graph, and shader assembly compression.
- In-source docs in `structs/D3dcompiler_47.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`D3dcompiler_47.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed Win32 aliases (see `types/D3dcompiler_47.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later

## Installation

```sh
bun add @bun-win32/d3dcompiler_47
```

## Quick Start

Compile an HLSL pixel shader to DXBC bytecode and read the bytes back through the `ID3DBlob` vtable.

```ts
import D3dcompiler_47, { D3DCOMPILE_ENABLE_STRICTNESS, D3DCOMPILE_OPTIMIZATION_LEVEL3 } from '@bun-win32/d3dcompiler_47';
import { CFunction, FFIType, read, toArrayBuffer, type Pointer } from 'bun:ffi';

const source = Buffer.from('float4 main() : SV_Target { return float4(1,0,0,1); }\0', 'utf8');
const entry = Buffer.from('main\0', 'utf8');
const target = Buffer.from('ps_5_0\0', 'utf8');

const ppCode = Buffer.alloc(8);
const ppErr = Buffer.alloc(8);

const hr = D3dcompiler_47.D3DCompile(
  source.ptr!,
  BigInt(source.byteLength - 1),
  null, // pSourceName
  null, // pDefines
  null, // pInclude
  entry.ptr!, // pEntrypoint
  target.ptr!, // pTarget
  D3DCOMPILE_ENABLE_STRICTNESS | D3DCOMPILE_OPTIMIZATION_LEVEL3,
  0,
  ppCode.ptr!,
  ppErr.ptr!,
);

if (hr !== 0) throw new Error(`D3DCompile failed: HR=0x${(hr >>> 0).toString(16)}`);

// ID3DBlob vtable: [QueryInterface, AddRef, Release, GetBufferPointer, GetBufferSize]
const blob = ppCode.readBigUInt64LE(0);
const vtable = read.u64(Number(blob) as Pointer, 0);
const getBufferPointer = CFunction({ ptr: Number(read.u64(Number(vtable) as Pointer, 24)) as Pointer, args: [FFIType.u64], returns: FFIType.u64 });
const getBufferSize = CFunction({ ptr: Number(read.u64(Number(vtable) as Pointer, 32)) as Pointer, args: [FFIType.u64], returns: FFIType.u64 });
const release = CFunction({ ptr: Number(read.u64(Number(vtable) as Pointer, 16)) as Pointer, args: [FFIType.u64], returns: FFIType.u32 });

const dataAddr = getBufferPointer(blob) as bigint;
const dataSize = Number(getBufferSize(blob) as bigint);
const bytecode = new Uint8Array(toArrayBuffer(Number(dataAddr) as Pointer, 0, dataSize));
console.log('DXBC magic:', String.fromCharCode(...bytecode.subarray(0, 4))); // 'DXBC'
release(blob);
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:hlsl-disco
bun run example:shader-doctor
```

- **`hlsl-disco`** — Compiles four colourful HLSL pixel shaders, renders each as a split-pane view of rainbow source / syntax-highlighted disassembly, with bytecode-byte gradient previews and per-shader stats.
- **`shader-doctor`** — A full diagnostic for a vertex shader: preprocessed output, DXBC chunk layout, every `D3DGetBlobPart` slot, parsed input / output signature records, strip-flag size deltas, and the colourised assembly.

## Notes

- Either rely on lazy binding or call `D3dcompiler_47.Preload()`.
- Windows only. Bun runtime required.
- `D3DCompile` and friends return new `ID3DBlob` instances. Their lifetime is yours: call the vtable's `Release` slot (offset `16` from the vtable pointer) when you are done, or you will leak native memory.
- Sentinel pointer `D3D_COMPILE_STANDARD_FILE_INCLUDE = (ID3DInclude*)1` can be passed for `pInclude` if you want the compiler's built-in include handler. From TypeScript, construct it as `Number(1) as Pointer` since the API takes `FFIType.ptr`.
- **SAL types & naming:** nullability is in the **type** — `Optional<T>` (formally optional, SAL `_*opt_`) and `Nullable<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
