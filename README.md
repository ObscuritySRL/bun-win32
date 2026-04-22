# bun-win32

Zero-dependency Win32 FFI bindings for [Bun](https://bun.sh) on Windows. Each system DLL is a standalone `@bun-win32/*` package with full type definitions.

## Install

```sh
bun add @bun-win32/kernel32 @bun-win32/user32 # etc...
```

Requires Bun >= 1.1.0 and Windows 10+.

## Usage

After the first call resolves the symbol via `dlopen`/`dlsym`, the native function pointer is cached directly on the class. Every subsequent call is a straight pointer invocation through Bun's FFI - no marshaling layer, no runtime type checks, no wrapper overhead. It's the same codepath as calling the C function yourself.

For hot paths, `Preload()` resolves symbols eagerly so even the first call pays zero binding cost:

```ts
import Kernel32 from '@bun-win32/kernel32';

const pid = Kernel32.GetCurrentProcessId();
const ticks = Kernel32.GetTickCount64();
```

```ts
import User32 from '@bun-win32/user32';

User32.Preload(['GetForegroundWindow', 'SetWindowPos']);

const { GetForegroundWindow, SetWindowPos } = User32;

SetWindowPos(hWnd, 0n, x, y, width, height, flags);
```

> [!IMPORTANT]
> If you destructure before binding, you capture the lazy wrapper instead of the native function.

## Packages

All type definitions are provided by [`@bun-win32/core`](./packages/core).

Published packages are AI-friendly. Alongside the `README.md`, each package includes an `AI.md` file that documents the binding contract, type surface, and source layout so coding agents can use the package correctly.

#### Graphics & Windowing

- [`comctl32`](./packages/comctl32) - common controls, image lists, property sheets, DPA/DSA dynamic arrays, flat scroll bars, window subclassing
- [`d3d11`](./packages/d3d11) - Direct3D 11 device / swap-chain creation, D3D11-on-12 interop, WinRT `IDirect3DDevice` / `IDirect3DSurface` bridges
- [`dwmapi`](./packages/dwmapi) - DWM composition, blur, thumbnails
- [`dxgi`](./packages/dxgi) - DXGI adapter enumeration, factory creation, debug interface (`CreateDXGIFactory*`, `DXGIGetDebugInterface1`)
- [`gdi32`](./packages/gdi32) - graphics device interface
- [`glu32`](./packages/glu32) - OpenGL utility functions
- [`opengl32`](./packages/opengl32) - OpenGL rendering context
- [`user32`](./packages/user32) - windows, messages, input, UI
- [`uxtheme`](./packages/uxtheme) - visual styles, themed controls, buffered painting

#### Multimedia

- [`mfplat`](./packages/mfplat) - Media Foundation platform: lifecycle, work queues, MFT registry, media type / sample / byte stream factories (`MFStartup`, `MFTEnumEx`, `MFCreateAttributes`, `MFCreateSample`)
- [`mfreadwrite`](./packages/mfreadwrite) - Media Foundation source reader / sink writer factories (`MFCreateSourceReader*`, `MFCreateSinkWriter*`)
- [`mmdevapi`](./packages/mmdevapi) - MMDevice / Core Audio class factory, WASAPI async activation (`DllGetClassObject`, `ActivateAudioInterfaceAsync`)
- [`winmm`](./packages/winmm) - multimedia audio, MIDI, mixers, timers, joysticks, MCI
- [`xinput1_4`](./packages/xinput1_4) - XInput 1.4: Xbox controller state, vibration, battery, audio, keystroke
- [`xinput9_1_0`](./packages/xinput9_1_0) - XInput 9.1.0: legacy Xbox controller state, vibration, DirectSound GUIDs

#### Networking

- [`bluetoothapis`](./packages/bluetoothapis) - Bluetooth Classic radio/device discovery, BLE GATT, SDP, authentication
- [`iphlpapi`](./packages/iphlpapi) - network adapters, TCP/UDP tables, routing
- [`mpr`](./packages/mpr) - network drive mapping, UNC connections, resource enumeration
- [`netapi32`](./packages/netapi32) - users, groups, shares, domain joins
- [`wlanapi`](./packages/wlanapi) - Native Wifi: interface enumeration, scans, profiles, Wi-Fi Direct
- [`ws2_32`](./packages/ws2_32) - Winsock 2: BSD sockets, DNS, network I/O

#### Printing

- [`winspool`](./packages/winspool) - printer management, print jobs, spooler control, drivers

#### Remote Desktop & Terminal Services

- [`wtsapi32`](./packages/wtsapi32) - Terminal Services sessions, processes, virtual channels, remote desktop

#### Security & Crypto

- [`advapi32`](./packages/advapi32) - registry, security descriptors, service control
- [`bcrypt`](./packages/bcrypt) - Cryptography Next Gen (CNG): ciphers, hashes, HMAC, PBKDF2, signatures, random bytes, key agreement
- [`credui`](./packages/credui) - credential prompts, username parsing, auth blobs, and SSPI prompt helpers
- [`crypt32`](./packages/crypt32) - certificate stores, chains, encoding, DPAPI
- [`secur32`](./packages/secur32) - SSPI authentication, credentials, LSA
- [`sspicli`](./packages/sspicli) - SSPI client-side auth and SASL
- [`winscard`](./packages/winscard) - smart card resource manager, reader discovery, status changes, and APDU transport

#### System

- [`cfgmgr32`](./packages/cfgmgr32) - device tree traversal, configuration management, device properties, interfaces, resources
- [`dbghelp`](./packages/dbghelp) - symbol engine, stack walking, minidumps, image helpers, source-level debugging
- [`hid`](./packages/hid) - HID device access, feature reports, preparsed data parsing
- [`kernel32`](./packages/kernel32) - processes, memory, files, console, threads
- [`mi`](./packages/mi) - Windows Management Infrastructure client bootstrap and function-table discovery
- [`msi`](./packages/msi) - Windows Installer: product enumeration, install state, database, patching
- [`ntdll`](./packages/ntdll) - native NT API
- [`normaliz`](./packages/normaliz) - internationalized domain names, Nameprep, and Unicode normalization
- [`ole32`](./packages/ole32) - COM/OLE helpers, monikers, structured storage, clipboard, drag-drop
- [`pdh`](./packages/pdh) - performance counter queries, logs, and enumeration
- [`powrprof`](./packages/powrprof) - power schemes, policies, sleep states, battery management
- [`psapi`](./packages/psapi) - process status and module enumeration
- [`rstrtmgr`](./packages/rstrtmgr) - Restart Manager sessions, lock discovery, shutdown, and restart orchestration
- [`setupapi`](./packages/setupapi) - device installation, INF parsing, class and interface enumeration
- [`shcore`](./packages/shcore) - DPI awareness, scale factors, AppUserModelID, random access streams, registry helpers, isolated-container detection, threading refs
- [`shell32`](./packages/shell32) - shell operations and file management
- [`shlwapi`](./packages/shlwapi) - shell lightweight utility functions
- [`taskschd`](./packages/taskschd) - Task Scheduler COM server entry points, class factory activation, task enumeration
- [`uiautomationcore`](./packages/uiautomationcore) - UI Automation nodes, pattern objects, provider bridging, and event plumbing
- [`userenv`](./packages/userenv) - user profiles, environment blocks, and Group Policy
- [`version`](./packages/version) - file version resources, string tables, installer version helpers
- [`virtdisk`](./packages/virtdisk) - VHD, VHDX, and ISO virtual disk creation, attachment, inspection, and management
- [`wevtapi`](./packages/wevtapi) - Windows Event Log queries, rendering, subscriptions, channel configuration, publisher metadata
- [`winusb`](./packages/winusb) - WinUSB device I/O, descriptors, pipes, policies, and isochronous transfers

## Project Structure

```text
bun-win32/
|-- bin/
|-- packages/
|   |-- core/
|   |-- template/
|   |-- advapi32/
|   |-- ...
|   |-- uiautomationcore/
|   `-- wtsapi32/
|-- scripts/
|-- AGENTS.md
|-- PROMPT.md
|-- PROMPT_NEW.md
`-- README.md
```

## Generating a New Package

All packages in this repo are AI-generated using Claude Code. To add bindings for a new DLL:

1. Open the repo in Claude Code.
2. Set the model to **max effort** with **extended thinking** enabled.
3. Send:

```
Execute @PROMPT_NEW.md for `crypt32`.
```

Replace `crypt32` with whatever DLL you're targeting. `PROMPT_NEW.md` is the recommended package-generation prompt. It uses the scaffold, catalog, runtime-probe, and audit scripts to keep the work more mechanical, more resumable, and less error-prone.

## License

MIT
