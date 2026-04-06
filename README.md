# bun-win32

Zero-dependency, zero-overhead Win32 FFI bindings for [Bun](https://bun.sh) on Windows.

## Overview

`bun-win32` is a monorepo of strongly-typed Win32 DLL bindings built on [Bun](https://bun.sh)'s FFI. Each Windows system DLL is published as a standalone package under the `@bun-win32` scope. All packages share a common base class and type definitions provided by `@bun-win32/core`.

Bindings are lazy by default — native symbols are bound on first call. For hot paths, call `Preload()` to bind everything up-front.

## Packages

| Package | DLL | Description |
|---------|-----|-------------|
| [`@bun-win32/core`](./packages/core) | — | Shared base class, runtime extensions, and fundamental Win32 types |
| [`@bun-win32/advapi32`](./packages/advapi32) | `advapi32.dll` | Registry, security, and service management |
| [`@bun-win32/crypt32`](./packages/crypt32) | `crypt32.dll` | Certificate stores, chains, encoding, data protection, signing |
| [`@bun-win32/dwmapi`](./packages/dwmapi) | `dwmapi.dll` | Desktop Window Manager composition, blur, thumbnails, and window attributes |
| [`@bun-win32/gdi32`](./packages/gdi32) | `gdi32.dll` | Graphics device interface |
| [`@bun-win32/glu32`](./packages/glu32) | `glu32.dll` | OpenGL utility functions |
| [`@bun-win32/iphlpapi`](./packages/iphlpapi) | `iphlpapi.dll` | IP Helper: network adapters, TCP/UDP tables, routing |
| [`@bun-win32/kernel32`](./packages/kernel32) | `kernel32.dll` | Process, memory, files, console, and more |
| [`@bun-win32/netapi32`](./packages/netapi32) | `netapi32.dll` | Network management: users, groups, shares, servers, domain joins |
| [`@bun-win32/ntdll`](./packages/ntdll) | `ntdll.dll` | Native NT API |
| [`@bun-win32/opengl32`](./packages/opengl32) | `opengl32.dll` | OpenGL rendering |
| [`@bun-win32/psapi`](./packages/psapi) | `psapi.dll` | Process status and module enumeration |
| [`@bun-win32/secur32`](./packages/secur32) | `secur32.dll` | SSPI authentication, credential management, LSA, SASL |
| [`@bun-win32/shell32`](./packages/shell32) | `shell32.dll` | Shell operations and file management |
| [`@bun-win32/shlwapi`](./packages/shlwapi) | `shlwapi.dll` | Shell lightweight utility functions |
| [`@bun-win32/user32`](./packages/user32) | `user32.dll` | Windows, messages, input, and UI |
| [`@bun-win32/ws2_32`](./packages/ws2_32) | `ws2_32.dll` | Winsock 2: BSD sockets, DNS, and network I/O |

## Requirements

- [Bun](https://bun.sh) >= 1.1.0
- Windows 10 or later

## Quick Start

```sh
bun add @bun-win32/kernel32
```

```ts
import Kernel32 from '@bun-win32/kernel32';

const pid = Kernel32.GetCurrentProcessId();
const ticks = Kernel32.GetTickCount64();

console.log('PID=%s Ticks=%s', pid, ticks.toString());
```

## Project Structure

```
bun-win32/
├── packages/
│   ├── core/          Shared base class and Win32 types
│   ├── advapi32/      advapi32.dll bindings
│   ├── crypt32/       crypt32.dll bindings
│   ├── dwmapi/        dwmapi.dll bindings
│   ├── gdi32/         gdi32.dll bindings
│   ├── glu32/         glu32.dll bindings
│   ├── iphlpapi/      iphlpapi.dll bindings
│   ├── kernel32/      kernel32.dll bindings
│   ├── netapi32/      netapi32.dll bindings
│   ├── ntdll/         ntdll.dll bindings
│   ├── opengl32/      opengl32.dll bindings
│   ├── psapi/         psapi.dll bindings
│   ├── secur32/       secur32.dll bindings
│   ├── shell32/       shell32.dll bindings
│   ├── shlwapi/       shlwapi.dll bindings
│   ├── user32/        user32.dll bindings
│   └── ws2_32/        ws2_32.dll bindings
└── template/          Template for new DLL packages
```

## How It Works

Every DLL package extends the `Win32` base class from `@bun-win32/core`. This base class handles lazy `dlopen` loading and symbol memoization. Public methods on each subclass map 1:1 to native Win32 API calls with no wrapper overhead.

```ts
import User32 from '@bun-win32/user32';

// Lazy — binds FindWindowExW on first call
const hwnd = User32.FindWindowExW(0n, 0n, null, null);

// Eager — bind specific symbols up-front
User32.Preload(['GetForegroundWindow', 'GetWindowTextW']);
```

## Generating a New Package

All packages in this repo are AI-generated using Claude Code. To add bindings for a new DLL:

1. Open the repo in Claude Code.
2. Set the model to **max effort** with **extended thinking** enabled.
3. Send:

```
Execute @PROMPT.md for `crypt32`.
```

Replace `crypt32` with whatever DLL you're targeting. `PROMPT.md` is the complete specification — it walks the model through dumping exports, reading Microsoft Docs, scaffolding from the template, writing every FFI declaration, and testing each one. No further prompting is needed.

## License

MIT
