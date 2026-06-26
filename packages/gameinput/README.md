# @bun-win32/gameinput

Zero-dependency, zero-overhead Win32 GameInput bindings for [Bun](https://bun.sh) on Windows.

## Overview

`@bun-win32/gameinput` exposes the `gameinput.dll` exports — Microsoft's modern, unified input model — using [Bun](https://bun.sh)'s FFI. It provides a single class, `GameInput`, which lazily binds native symbols on first use. You can optionally preload a subset or all symbols up-front via `Preload()`.

GameInput is the successor to XInput and DirectInput: one API for gamepads, arcade sticks, flight sticks, racing wheels, keyboards, mice, touch, and motion — with a high-resolution microsecond input clock and a unified reading stream. `gameinput.dll` exposes only a tiny flat surface: a single Nano-COM factory, `GameInputCreate`, hands back the per-process `IGameInput` singleton, and everything else (readings, devices, callbacks) is reached by invoking that interface's COM vtable directly.

The bindings are strongly typed for a smooth DX in TypeScript.

## Features

- [Bun](https://bun.sh)-first ergonomics on Windows 10/11.
- Direct FFI to `gameinput.dll` (Nano-COM `IGameInput` factory + the standard `Dll*` COM-server entries).
- All 3 documented `gameinput.dll` exports bound.
- The full `GameInputKind` and `GameInputGamepadButtons` flag enums, ready for filtering and decoding readings.
- In-source docs in `structs/GameInput.ts` with links to Microsoft Docs.
- Lazy binding on first call; optional eager preload (`GameInput.Preload()`).
- No wrapper overhead; calls map 1:1 to native APIs.
- Strongly-typed aliases (see `types/GameInput.ts`).

## Requirements

- [Bun](https://bun.sh) runtime
- Windows 10 or later (GameInput redistributable / GDK runtime)

## Installation

```sh
bun add @bun-win32/gameinput
```

## Quick Start

```ts
import { FFIType, dlopen, linkSymbols } from 'bun:ffi';
import GameInput from '@bun-win32/gameinput';

// GameInputCreate is a Nano-COM factory: it returns the per-process
// IGameInput singleton through an out-pointer.
const ppGameInput = Buffer.alloc(8);
const hr = GameInput.GameInputCreate(ppGameInput.ptr!);
const gameInput = ppGameInput.readBigUInt64LE(0);
console.log('GameInputCreate → 0x' + (hr >>> 0).toString(16), 'IGameInput @ 0x' + gameInput.toString(16));

// Walk the IGameInput COM vtable to read the microsecond input clock.
// IUnknown (3 slots) + GetCurrentTimestamp at slot index 3 → offset 0x18.
const k = dlopen('kernel32.dll', {
  GetCurrentProcess: { args: [], returns: FFIType.u64 },
  ReadProcessMemory: { args: [FFIType.u64, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr], returns: FFIType.i32 },
});
const proc = k.symbols.GetCurrentProcess();
const readPtr = (a: bigint) => {
  const b = Buffer.alloc(8);
  k.symbols.ReadProcessMemory(proc, a, b.ptr!, 8n, null!);
  return b.readBigUInt64LE(0);
};
const vtable = readPtr(gameInput);
const getTimestamp = linkSymbols({
  call: { args: [FFIType.u64], ptr: readPtr(vtable + 0x18n), returns: FFIType.u64 },
});
console.log('Input clock:', getTimestamp.symbols.call(gameInput), 'µs');
getTimestamp.close();
k.close();
```

> [!NOTE]
> AI agents: see `AI.md` for the package binding contract and source-navigation guidance. It explains how to use the package without scanning the entire implementation.

## Examples

Run the included examples:

```sh
bun run example:gameinput-diagnostic
bun run example:gameinput-oscilloscope
```

- **gameinput-diagnostic** — a thorough diagnostic: bootstraps the `IGameInput` singleton, walks the COM vtable to read the microsecond input clock (with a deterministic, CPU-verifiable monotonic-delta check), probes every `GameInputKind` (gamepad / keyboard / mouse / controller / flight stick / arcade stick / racing wheel / sensors) for a current reading, decodes any live gamepad / mouse / keyboard reading struct, and verifies the singleton ref-count drains via `DllCanUnloadNow`.
- **gameinput-oscilloscope** — a live full-screen terminal scope: scrolls the real per-frame `IGameInput::GetCurrentTimestamp` delta across the screen as a colored waveform (you watch the OS input clock advance in real time), and renders live analog-stick / trigger signal bars plus a lit button grid when a controller is connected (with an idle sweep when none is).

## Notes

- The GameInput surface is COM. `GameInputCreate` returns the `IGameInput` singleton through the out-pointer; read it with `Buffer.readBigUInt64LE`. Everything else — readings, devices, callbacks — is reached by walking the interface's vtable (`ReadProcessMemory` + `linkSymbols`), exactly as the examples show.
- Vtable layout (8-byte slots, `IUnknown` first): `IGameInput` — `GetCurrentTimestamp` @ 0x18, `GetCurrentReading` @ 0x20. `IGameInputReading` — `GetInputKind` @ 0x18, `GetGamepadState` @ 0xB0, `GetMouseState` @ 0x80.
- `GameInputKind` values are flags and can be OR-combined to filter the reading stream for multiple device kinds at once.
- Call `GameInputCreate` once at startup and keep the `IGameInput` reference until shutdown; the first call constructs the per-process singleton and can be briefly slow.
- `DllCanUnloadNow` returns `S_FALSE` (`0x1`) while the OS input service still references the singleton — this is expected, not an error.
- Either rely on lazy binding or call `GameInput.Preload()`.
- Windows only. Bun runtime required.
- **SAL types & naming:** nullability is in the **type** — `OPTIONAL<T>` (formally optional, SAL `_*opt_`) and `NULLABLE<T>` (plain `[in]`/`[out]` the docs say can be NULL), the null sentinel derived from `T` (`null` for pointers `LP*`/`P*`, `0n` for handles/by-value addresses); direction is in the **parameter name** — `_out` (`_Out_`), `_in_out` (`_Inout_`), `_In_` bare. See `AI.md` and the repo `AGENTS.md`.
