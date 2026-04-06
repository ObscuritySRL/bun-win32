# bun-win32

Zero-dependency Win32 FFI bindings for [Bun](https://bun.sh) on Windows. Each system DLL is a standalone `@bun-win32/*` package with full type definitions.

```ts
import Kernel32 from '@bun-win32/kernel32';

const pid = Kernel32.GetCurrentProcessId();
const ticks = Kernel32.GetTickCount64();
```

After the first call resolves the symbol via `dlopen`/`dlsym`, the native function pointer is cached directly on the class. Every subsequent call is a straight pointer invocation through Bun's FFI — no marshaling layer, no runtime type checks, no wrapper overhead. It's the same codepath as calling the C function yourself.

For hot paths, `Preload()` resolves symbols eagerly so even the first call pays zero binding cost:

```ts
import User32 from '@bun-win32/user32';

User32.Preload(['GetForegroundWindow', 'SetWindowPos']);

const { GetForegroundWindow, SetWindowPos } = User32;

SetWindowPos(hWnd, 0n, x, y, width, height, flags);
```

> [!NOTE]
> If you destructure before binding, you capture the lazy wrapper instead of the native function.

## Packages

All type definitions are provided by [`@bun-win32/core`](./packages/core).

#### System

- [`kernel32`](./packages/kernel32) — processes, memory, files, console, threads
- [`ntdll`](./packages/ntdll) — native NT API
- [`pdh`](./packages/pdh) — performance counter queries, logs, and enumeration
- [`psapi`](./packages/psapi) — process status and module enumeration
- [`shell32`](./packages/shell32) — shell operations and file management
- [`shlwapi`](./packages/shlwapi) — shell lightweight utility functions

#### Security & Crypto

- [`advapi32`](./packages/advapi32) — registry, security descriptors, service control
- [`crypt32`](./packages/crypt32) — certificate stores, chains, encoding, DPAPI
- [`secur32`](./packages/secur32) — SSPI authentication, credentials, LSA
- [`sspicli`](./packages/sspicli) — SSPI client-side auth and SASL

#### Graphics & Windowing

- [`user32`](./packages/user32) — windows, messages, input, UI
- [`gdi32`](./packages/gdi32) — graphics device interface
- [`dwmapi`](./packages/dwmapi) — DWM composition, blur, thumbnails
- [`opengl32`](./packages/opengl32) — OpenGL rendering context
- [`glu32`](./packages/glu32) — OpenGL utility functions

#### Networking

- [`ws2_32`](./packages/ws2_32) — Winsock 2: BSD sockets, DNS, network I/O
- [`iphlpapi`](./packages/iphlpapi) — network adapters, TCP/UDP tables, routing
- [`netapi32`](./packages/netapi32) — users, groups, shares, domain joins

## Install

```sh
bun add @bun-win32/kernel32
```

Requires Bun >= 1.1.0 and Windows 10+.

## Generating a New Package

All packages in this repo are AI-generated using Claude Code. To add bindings for a new DLL:

1. Open the repo in Claude Code.
2. Set the model to **max effort** with **extended thinking** enabled.
3. Send:

```
Execute @PROMPT.md for `crypt32`.
```

Replace `crypt32` with whatever DLL you're targeting. `PROMPT.md` is the complete specification — it walks the model through dumping exports, reading Microsoft Docs, scaffolding from the template, writing every FFI declaration, and testing each one.

## License

MIT
