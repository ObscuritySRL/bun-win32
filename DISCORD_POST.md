# [@bun-win32/\*](https://github.com/ObscuritySRL/bun-win32)

Zero-dependency Win32 FFI bindings for [Bun](https://bun.sh) on Windows. Each system DLL is a standalone `@bun-win32/*` package with full type definitions.

## Install

```sh
bun add @bun-win32/kernel32 @bun-win32/user32 # etc...
```

## Usage

After the first call resolves the symbol via `dlopen`/`dlsym`, the native function pointer is cached directly on the class. Every subsequent call is a straight pointer invocation through Bun's FFI - no marshaling layer, no runtime type checks, no wrapper overhead.

For hot paths, `Preload()` resolves symbols eagerly so even the first call pays zero binding cost:

```ts
import Kernel32 from '@bun-win32/kernel32';

const pid = Kernel32.GetCurrentProcessId();
const ticks = Kernel32.GetTickCount64();
```

```ts
import User32 from '@bun-win32/user32';

User32.Preload(['GetForegroundWindow', 'SetWindowPos']);
SetWindowPos(hWnd, 0n, x, y, width, height, flags);
```

## [All Packages](https://github.com/ObscuritySRL/bun-win32/tree/main/packages)

Each package includes an `AI.md` so coding agents can use the bindings correctly without scanning the implementation.

### Graphics & Windowing

- `dwmapi` - DWM composition, blur, thumbnails
- `gdi32` - graphics device interface
- `glu32` - OpenGL utility functions
- `opengl32` - OpenGL rendering context
- `user32` - windows, messages, input, UI
- `uxtheme` - visual styles, themed controls

### Multimedia

- `winmm` - audio, MIDI, mixers, timers, joysticks, MCI

### Networking

- `bluetoothapis` - Bluetooth Classic/BLE discovery, GATT, SDP, auth
- `iphlpapi` - network adapters, TCP/UDP tables, routing
- `mpr` - network drive mapping, UNC connections
- `netapi32` - users, groups, shares, domain joins
- `wlanapi` - Wifi enumeration, scans, profiles, Wi-Fi Direct
- `ws2_32` - Winsock 2: BSD sockets, DNS, network I/O

### Printing

- `winspool` - printer management, jobs, spooler, drivers

### Remote Desktop

- `wtsapi32` - Terminal Services sessions, virtual channels

### Security & Crypto

- `advapi32` - registry, security descriptors, service control
- `credui` - credential prompts, auth blobs, SSPI helpers
- `crypt32` - certificate stores, chains, encoding, DPAPI
- `secur32` - SSPI authentication, credentials, LSA
- `sspicli` - SSPI client-side auth and SASL
- `winscard` - smart card reader discovery, APDU transport

### System

- `dbghelp` - symbol engine, stack walking, minidumps
- `hid` - HID device access, feature reports
- `kernel32` - processes, memory, files, console, threads
- `msi` - Windows Installer: products, install state, patching
- `ntdll` - native NT API
- `normaliz` - IDN, Nameprep, Unicode normalization
- `ole32` - COM/OLE, monikers, structured storage, drag-drop
- `pdh` - performance counter queries, logs, enumeration
- `powrprof` - power schemes, sleep states, battery
- `psapi` - process status and module enumeration
- `rstrtmgr` - Restart Manager sessions, lock discovery
- `setupapi` - device installation, INF parsing, class enumeration
- `shell32` - shell operations and file management
- `shlwapi` - shell lightweight utility functions
- `uiautomationcore` - UI Automation nodes, patterns, events
- `version` - file version resources, string tables
- `wevtapi` - Event Log queries, subscriptions, channel config
- `winusb` - WinUSB device I/O, descriptors, pipes, policies

**GitHub**: <https://github.com/ObscuritySRL/bun-win32>
