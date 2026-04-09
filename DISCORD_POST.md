Zero-dependency Win32 FFI bindings for Bun. **29** packages, **6,650** functions, pure `bun:ffi`, no native addons.

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

## Packages

Shared runtime/types: [`@bun-win32/core`](https://www.npmjs.com/package/@bun-win32/core)

### System

- [`hid`](https://www.npmjs.com/package/@bun-win32/hid) - USB HID devices: controllers, barcode scanners, custom hardware
- [`kernel32`](https://www.npmjs.com/package/@bun-win32/kernel32) - processes, memory, files, console, threads
- [`msi`](https://www.npmjs.com/package/@bun-win32/msi) - installer database, product inventory, patches
- [`ntdll`](https://www.npmjs.com/package/@bun-win32/ntdll) - native NT API
- [`pdh`](https://www.npmjs.com/package/@bun-win32/pdh) - performance counters and logs
- [`powrprof`](https://www.npmjs.com/package/@bun-win32/powrprof) - power schemes, battery, sleep/hibernate
- [`psapi`](https://www.npmjs.com/package/@bun-win32/psapi) - process status and module enumeration
- [`shell32`](https://www.npmjs.com/package/@bun-win32/shell32) - shell operations and file management
- [`shlwapi`](https://www.npmjs.com/package/@bun-win32/shlwapi) - shell utility functions
- [`version`](https://www.npmjs.com/package/@bun-win32/version) - file version info, product metadata
- [`wevtapi`](https://www.npmjs.com/package/@bun-win32/wevtapi) - Event Log queries, subscriptions, real-time tailing

### Security and Crypto

- [`advapi32`](https://www.npmjs.com/package/@bun-win32/advapi32) - registry, security descriptors, service control
- [`crypt32`](https://www.npmjs.com/package/@bun-win32/crypt32) - DPAPI, certificate stores, chains, encoding
- [`secur32`](https://www.npmjs.com/package/@bun-win32/secur32) - SSPI auth, credentials, LSA
- [`sspicli`](https://www.npmjs.com/package/@bun-win32/sspicli) - SSPI client auth and SASL

### Graphics and Windowing

- [`user32`](https://www.npmjs.com/package/@bun-win32/user32) - windows, messages, hotkeys, input — native UI without Electron
- [`gdi32`](https://www.npmjs.com/package/@bun-win32/gdi32) - graphics device interface
- [`dwmapi`](https://www.npmjs.com/package/@bun-win32/dwmapi) - DWM composition, blur, thumbnails
- [`uxtheme`](https://www.npmjs.com/package/@bun-win32/uxtheme) - visual styles, themed controls, buffered painting
- [`opengl32`](https://www.npmjs.com/package/@bun-win32/opengl32) - real-time GPU rendering from a `.ts` file
- [`glu32`](https://www.npmjs.com/package/@bun-win32/glu32) - OpenGL utility functions

### Printing

- [`winspool`](https://www.npmjs.com/package/@bun-win32/winspool) - printer enumeration, job management, spooler control

### Networking

- [`bluetoothapis`](https://www.npmjs.com/package/@bun-win32/bluetoothapis) - Bluetooth discovery, pairing, BLE GATT
- [`ws2_32`](https://www.npmjs.com/package/@bun-win32/ws2_32) - raw TCP/UDP sockets, DNS — what `fetch` can't do
- [`iphlpapi`](https://www.npmjs.com/package/@bun-win32/iphlpapi) - adapters, TCP/UDP tables, routing
- [`netapi32`](https://www.npmjs.com/package/@bun-win32/netapi32) - users, groups, shares, domain joins
- [`wlanapi`](https://www.npmjs.com/package/@bun-win32/wlanapi) - Wi-Fi scanning, signal quality, profiles, Wi-Fi Direct

### Remote Desktop and Terminal Services

- [`wtsapi32`](https://www.npmjs.com/package/@bun-win32/wtsapi32) - Terminal Services sessions, processes, virtual channels, remote desktop

### Multimedia

- [`winmm`](https://www.npmjs.com/package/@bun-win32/winmm) - audio, MIDI, mixers, timers, joysticks

**GitHub**: <https://github.com/ObscuritySRL/bun-win32>
