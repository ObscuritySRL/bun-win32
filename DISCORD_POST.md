Zero-dependency Win32 FFI bindings for Bun. **22** packages, **5,800**+ functions, pure `bun:ffi`, no native addons.

```sh
bun add @bun-win32/kernel32
```

```ts
import Kernel32 from '@bun-win32/kernel32';

const pid = Kernel32.GetCurrentProcessId();
const ticks = Kernel32.GetTickCount64();
```

Each package is a thin 1:1 binding to a Windows DLL. Symbols resolve via `dlopen`/`dlsym` on first call, then the native function pointer is cached on the class.

TypeScript typings follow Microsoft Docs closely, including mappings like `HANDLE -> bigint` and `DWORD -> number`.

## Why this matters

- **user32** - Native Windows UI from TypeScript. Create windows, register global hotkeys, track cursors, and pump message loops. No Electron, no Tauri, no native addon.
- **opengl32** - Real-time OpenGL rendering from Bun. Physics simulations, games, and visualizations straight to a GPU context from a `.ts` file.
- **hid** - Talk to USB devices. Game controllers, barcode scanners, and custom hardware. Node usually needs `node-hid` and a build step.
- **winspool** - Native printer management and spooler control. Enumerate printers, inspect queues, manage jobs, and work with drivers from Bun.
- **wlanapi** - Native Wi-Fi access from Bun. Enumerate interfaces, scan networks, inspect signal quality, manage profiles, and use Wi-Fi Direct.
- **ws2_32** - Raw TCP/UDP sockets. Build your own protocols, bind to ports, and resolve DNS. `fetch` cannot do this.
- **crypt32** - DPAPI encryption and certificate store access. Encrypt secrets with the current user's Windows credentials in two function calls.

## Packages

Shared runtime/types: [`@bun-win32/core`](https://www.npmjs.com/package/@bun-win32/core)

### System

- [`hid`](https://www.npmjs.com/package/@bun-win32/hid) - HID device access, feature reports, preparsed data
- [`kernel32`](https://www.npmjs.com/package/@bun-win32/kernel32) - processes, memory, files, console, threads
- [`ntdll`](https://www.npmjs.com/package/@bun-win32/ntdll) - native NT API
- [`pdh`](https://www.npmjs.com/package/@bun-win32/pdh) - performance counters and logs
- [`psapi`](https://www.npmjs.com/package/@bun-win32/psapi) - process status and module enumeration
- [`shell32`](https://www.npmjs.com/package/@bun-win32/shell32) - shell operations and file management
- [`shlwapi`](https://www.npmjs.com/package/@bun-win32/shlwapi) - shell utility functions

### Security and Crypto

- [`advapi32`](https://www.npmjs.com/package/@bun-win32/advapi32) - registry, security descriptors, service control
- [`crypt32`](https://www.npmjs.com/package/@bun-win32/crypt32) - certificate stores, chains, encoding, DPAPI
- [`secur32`](https://www.npmjs.com/package/@bun-win32/secur32) - SSPI auth, credentials, LSA
- [`sspicli`](https://www.npmjs.com/package/@bun-win32/sspicli) - SSPI client auth and SASL

### Graphics and Windowing

- [`user32`](https://www.npmjs.com/package/@bun-win32/user32) - windows, messages, input, UI
- [`gdi32`](https://www.npmjs.com/package/@bun-win32/gdi32) - graphics device interface
- [`dwmapi`](https://www.npmjs.com/package/@bun-win32/dwmapi) - DWM composition, blur, thumbnails
- [`opengl32`](https://www.npmjs.com/package/@bun-win32/opengl32) - OpenGL rendering context
- [`glu32`](https://www.npmjs.com/package/@bun-win32/glu32) - OpenGL utility functions

### Printing

- [`winspool`](https://www.npmjs.com/package/@bun-win32/winspool) - printer management, print jobs, spooler control

### Networking

- [`ws2_32`](https://www.npmjs.com/package/@bun-win32/ws2_32) - Winsock 2, DNS, network I/O
- [`iphlpapi`](https://www.npmjs.com/package/@bun-win32/iphlpapi) - adapters, TCP/UDP tables, routing
- [`netapi32`](https://www.npmjs.com/package/@bun-win32/netapi32) - users, groups, shares, domain joins
- [`wlanapi`](https://www.npmjs.com/package/@bun-win32/wlanapi) - Native Wifi, scans, profiles, Wi-Fi Direct

**GitHub**: <https://github.com/ObscuritySRL/bun-win32>
